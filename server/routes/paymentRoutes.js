import { Router } from 'express';
import { adminDb, verifyAuth } from '../middlewares/auth.js';
import { FieldValue } from 'firebase-admin/firestore';
import { telegramService } from '../services/telegramService.js';
import { planService } from '../services/planService.js';
import { decidePayment, computeSubscriptionExpiry } from '../services/paymentDecision.js';
import { parseTransferMemo, uidTagOf } from '../../src/config/planCatalog.js';

const router = Router();

/**
 * Enterprise Payment Webhook Endpoint
 * Compatible with VietQR IPN, SePay, Casso, and direct ACB bank push notifications.
 * Features Idempotency: guarantees 0 double-charging and 0 wasted Firestore writes.
 */
router.post('/webhook', async (req, res) => {
  // 1. Fetch Dynamic Webhook Secret if configured
  let secretKey = process.env.PAYMENT_WEBHOOK_SECRET || '';
  let bankConfig = { bankName: 'ACB', accountNumber: '271090168' };

  if (adminDb) {
    try {
      const configDoc = await adminDb.collection('system_settings').doc('app_config').get();
      if (configDoc.exists) {
        const data = configDoc.data();
        if (data?.webhookSecret) secretKey = data.webhookSecret.trim();
        if (data?.bankName) bankConfig.bankName = data.bankName;
        if (data?.accountNumber) bankConfig.accountNumber = data.accountNumber;
      }
    } catch (e) {
      console.warn('⚠️ [Payment Webhook]: Could not fetch dynamic settings:', e.message);
    }
  }

  // Check Authorization token (supports SePay "Apikey <token>", custom headers, or query param)
  const authHeader = req.headers['authorization'] || '';
  const apiKeyHeader = req.headers['x-api-key'] || req.headers['x-webhook-secret'] || req.query.secret || '';
  const tokenFromAuth = authHeader.startsWith('Apikey ') ? authHeader.slice(7).trim() : authHeader.replace(/^Bearer\s+/i, '').trim();
  const providedSecret = tokenFromAuth || apiKeyHeader;

  // Không cấu hình secret trên production = ai cũng gọi được webhook để tự nâng cấp → từ chối (fail closed)
  const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.K_SERVICE || process.env.FUNCTION_TARGET);
  if (!secretKey && isProduction) {
    console.error('⛔ [Payment Webhook]: PAYMENT_WEBHOOK_SECRET / system_settings.app_config.webhookSecret chưa cấu hình — từ chối webhook.');
    return res.status(503).json({ error: 'Webhook secret is not configured' });
  }

  if (secretKey && providedSecret !== secretKey) {
    console.warn('⛔ [Payment Webhook]: Unauthorized webhook attempt with invalid secret.');
    return res.status(401).json({ error: 'Unauthorized: Invalid webhook secret token' });
  }

  if (!adminDb) {
    console.warn('⚠️ [Payment Webhook]: Firestore Admin SDK not initialized');
    return res.status(503).json({ error: 'Database service unavailable' });
  }

  const rawBody = req.body || {};

  // Normalization: Support Casso array `rawBody.data` or SePay/VietQR single object
  const rawList = Array.isArray(rawBody.data) ? rawBody.data : [rawBody];
  const results = [];

  for (const item of rawList) {
    const transactionId = String(
      item.id ||
      item.transactionId ||
      item.tid ||
      item.referenceCode ||
      item.reference ||
      Date.now()
    );

    const amount = Number(item.transferAmount || item.amount || 0);
    const description = String(
      item.description ||
      item.content ||
      item.transferContent ||
      item.memo ||
      ''
    ).trim().toUpperCase();

    if (!description) {
      console.log(`ℹ️ [Payment Webhook]: Skipping item without description (ID=${transactionId})`);
      continue;
    }

    console.log(`💳 [Bank Webhook Processing]: ID=${transactionId}, Amount=${amount}, Content="${description}"`);

    // Tiền ra khỏi tài khoản (SePay transferType = 'out') không phải thanh toán
    if (String(item.transferType || '').toLowerCase() === 'out') {
      results.push({ transactionId, status: 'skipped_outgoing' });
      continue;
    }

    try {
      const txRef = adminDb.collection('transactions').doc(transactionId);

      // 2. Idempotency (đọc nhanh, transaction bên dưới kiểm tra lại)
      if ((await txRef.get()).exists) {
        console.log(`ℹ️ [Payment Webhook]: Transaction ${transactionId} already processed, skipping.`);
        results.push({ transactionId, status: 'already_processed' });
        continue;
      }

      // 3. Nội dung "XDPRO CREATOR|BIZ|TOPUP <TAG>"
      const memo = parseTransferMemo(description);
      if (!memo) {
        console.log(`ℹ️ [Payment Webhook]: Content does not match XDPRO syntax: "${description}"`);
        results.push({ transactionId, status: 'syntax_mismatch', description });
        continue;
      }
      const cleanTag = memo.tag;

      // 4. Resolve Target User by indexed UID tag or exact match ($0 cost optimization)
      let targetUid = null;
      let targetEmail = null;

      const tagQuery = await adminDb.collection('users').where('uidTag', '==', cleanTag).limit(1).get();
      if (!tagQuery.empty) {
        targetUid = tagQuery.docs[0].id;
        targetEmail = tagQuery.docs[0].data()?.email;
      } else {
        // Bounded fallback search (limit 150 docs max to avoid runaway billing)
        const fallbackSnap = await adminDb.collection('users').limit(150).get();
        fallbackSnap.forEach(doc => {
          const u = doc.data();
          if ((u.uidTag || uidTagOf(doc.id)).toUpperCase() === cleanTag) {
            targetUid = doc.id;
            targetEmail = u.email;
          }
        });
      }

      if (!targetUid) {
        console.warn(`⚠️ [Payment Webhook]: User matching UID tag "${cleanTag}" not found.`);
        results.push({ transactionId, status: 'user_not_found', tag: cleanTag });
        continue;
      }

      // 5. Quyết định theo SỐ TIỀN thực nhận + giá gói hiện hành (Firestore gộp mặc định)
      const decision = decidePayment({ memo, amount, plans: await planService.getAllPlans() });
      const userDocRef = adminDb.collection('users').doc(targetUid);
      const nowIso = new Date().toISOString();
      const gateway = item.gateway || bankConfig.bankName;
      const baseTx = {
        transactionId,
        amount,
        description,
        targetUid,
        targetEmail: targetEmail || null,
        processedAt: nowIso,
        gateway,
        kind: memo.kind,
      };

      // 6. Transaction: kiểm tra trùng + cập nhật user + ghi biên lai cùng lúc (webhook gửi lại không cộng 2 lần)
      const outcome = await adminDb.runTransaction(async tx => {
        const [txSnap, userSnap] = await Promise.all([tx.get(txRef), tx.get(userDocRef)]);
        if (txSnap.exists) return { status: 'already_processed' };
        const userData = userSnap.exists ? userSnap.data() : {};

        if (decision.action === 'subscribe') {
          const expiresAtIso = computeSubscriptionExpiry({
            currentTier: userData.planTier,
            currentExpiresAt: userData.subscriptionExpiresAt,
            targetTier: decision.tier,
            days: decision.days,
          });
          tx.set(userDocRef, {
            planTier: decision.tier,
            subscriptionExpiresAt: expiresAtIso,
            subscriptionPeriod: decision.cycle === 'year' ? 'yearly' : 'monthly',
            subscriptionStatus: 'active',
            uidTag: cleanTag,
            updatedAt: nowIso,
          }, { merge: true });
          tx.create(txRef, { ...baseTx, targetTier: decision.tier, cycle: decision.cycle, expiresAt: expiresAtIso, status: 'success' });
          return { status: 'success', tier: decision.tier, cycle: decision.cycle, expiresAt: expiresAtIso };
        }

        if (decision.action === 'topup') {
          tx.set(userDocRef, { bonusVideos: FieldValue.increment(decision.videos), uidTag: cleanTag, updatedAt: nowIso }, { merge: true });
          tx.create(txRef, { ...baseTx, targetTier: 'topup', packId: decision.packId, packs: decision.packs, bonusVideos: decision.videos, status: 'success' });
          return { status: 'success', topupVideos: decision.videos };
        }

        // underpaid / invalid_plan: ghi nhận để đối soát, không nâng cấp
        tx.create(txRef, { ...baseTx, targetTier: decision.tier || memo.kind, expectedAmount: decision.expected || null, status: decision.action === 'underpaid' ? 'underpaid' : 'invalid_plan' });
        return { status: decision.action, expected: decision.expected };
      });

      if (outcome.status === 'already_processed') {
        results.push({ transactionId, status: 'already_processed' });
        continue;
      }
      if (outcome.status !== 'success') {
        console.warn(`⚠️ [Payment Webhook]: ${outcome.status} — ${amount} đ cho "${description}" (cần ${outcome.expected || '?'} đ). Không nâng cấp.`);
        results.push({ transactionId, status: outcome.status, expected: outcome.expected, user: targetEmail });
        continue;
      }

      console.log(`🎉 [Payment Webhook Success]: ${targetEmail} (${targetUid}) → ${outcome.tier ? `${outcome.tier}/${outcome.cycle} đến ${outcome.expiresAt}` : `+${outcome.topupVideos} video`}`);

      // 7. Instant Telegram Notification
      telegramService.sendPaymentAlert({
        email: targetEmail,
        uid: targetUid,
        amount,
        planTier: outcome.tier || `topup +${outcome.topupVideos}`,
        transactionId,
        description,
        bankName: gateway,
        accountNumber: item.accountNumber || bankConfig.accountNumber,
      }).catch(err => {
        console.error('⚠️ [Telegram Alert Error]:', err.message);
      });

      results.push({
        transactionId,
        status: 'success',
        user: targetEmail,
        tier: outcome.tier,
        cycle: outcome.cycle,
        bonusVideos: outcome.topupVideos,
      });
    } catch (itemErr) {
      console.error(`❌ [Payment Webhook Item Error ${transactionId}]:`, itemErr.message);
      results.push({ transactionId, status: 'error', error: itemErr.message });
    }
  }

  return res.json({
    success: true,
    processedCount: results.length,
    results,
  });
});

/**
 * Atomic Server-Side License Key Redemption Endpoint
 * Verifies key in Firestore `license_keys/{cleanKey}`, prevents replay attacks,
 * atomically increments `usedCount`, and grants subscription with expiry.
 */
router.post('/redeem-key', verifyAuth, async (req, res) => {
  const { licenseKey } = req.body || {};
  const cleanKey = String(licenseKey || '').trim().toUpperCase();

  if (!cleanKey) {
    return res.status(400).json({ error: 'Vui lòng nhập mã bản quyền (License Key).' });
  }

  if (!adminDb) {
    return res.status(503).json({ error: 'Cơ sở dữ liệu đang bảo trì. Vui lòng thử lại sau.' });
  }

  const uid = req.user.uid;
  const userEmail = req.user.email || 'unknown';

  try {
    const keyRef = adminDb.collection('license_keys').doc(cleanKey);
    const userRef = adminDb.collection('users').doc(uid);

    let redeemedTier = 'creator';
    let expiresAtIso = null;

    // Execute atomic transaction to prevent concurrent double-redemption
    await adminDb.runTransaction(async (transaction) => {
      const keyDoc = await transaction.get(keyRef);
      if (!keyDoc.exists) {
        throw new Error('Mã bản quyền không tồn tại hoặc không chính xác.');
      }

      const keyData = keyDoc.data();
      if (keyData.isActive === false) {
        throw new Error('Mã bản quyền này đã bị khóa bởi quản trị viên.');
      }

      const maxUses = Number(keyData.maxUses || 1);
      const usedCount = Number(keyData.usedCount || 0);

      if (usedCount >= maxUses) {
        throw new Error('Mã bản quyền này đã đạt giới hạn số lần kích hoạt.');
      }

      // Check key expiration if configured
      if (keyData.expiresAt && new Date(keyData.expiresAt).getTime() < Date.now()) {
        throw new Error('Mã bản quyền này đã hết hạn sử dụng.');
      }

      redeemedTier = keyData.tier || 'creator';
      const durationDays = Number(keyData.durationDays || (keyData.period === 'yearly' ? 365 : 30));
      const now = Date.now();
      expiresAtIso = new Date(now + durationDays * 24 * 60 * 60 * 1000).toISOString();

      // 1. Increment key used count & record user
      const redeemedUsers = Array.isArray(keyData.redeemedBy) ? keyData.redeemedBy : [];
      redeemedUsers.push({
        uid,
        email: userEmail,
        redeemedAt: new Date(now).toISOString(),
      });

      transaction.update(keyRef, {
        usedCount: usedCount + 1,
        redeemedBy: redeemedUsers,
        lastUsedAt: new Date(now).toISOString(),
      });

      // 2. Update user profile
      const cleanUidTag = uidTagOf(uid);
      transaction.set(userRef, {
        planTier: redeemedTier,
        licenseKeyUsed: cleanKey,
        subscriptionExpiresAt: expiresAtIso,
        subscriptionPeriod: durationDays > 60 ? 'yearly' : 'monthly',
        subscriptionStatus: 'active',
        uidTag: cleanUidTag,
        updatedAt: new Date(now).toISOString(),
      }, { merge: true });

      // 3. Log transaction audit record
      const txId = `KEY_${cleanKey}_${Date.now()}`;
      const txRef = adminDb.collection('transactions').doc(txId);
      transaction.set(txRef, {
        transactionId: txId,
        amount: 0,
        description: `KÍCH HOẠT MÃ BẢN QUYỀN: ${cleanKey}`,
        targetUid: uid,
        targetEmail: userEmail,
        targetTier: redeemedTier,
        licenseKey: cleanKey,
        processedAt: new Date(now).toISOString(),
        status: 'success',
        gateway: 'LICENSE_KEY',
      });
    });

    console.log(`🎉 [License Key Redeemed]: User ${userEmail} (${uid}) redeemed ${cleanKey} -> ${redeemedTier}`);

    return res.json({
      success: true,
      message: `Kích hoạt thành công mã bản quyền! Gói cước của bạn đã được nâng cấp lên ${redeemedTier.toUpperCase()}.`,
      tier: redeemedTier,
      subscriptionExpiresAt: expiresAtIso,
    });
  } catch (err) {
    console.warn(`⚠️ [License Redeem Error]: ${err.message}`);
    return res.status(400).json({ error: err.message || 'Kích hoạt mã bản quyền thất bại.' });
  }
});

export default router;
