import { Router } from 'express';
import { adminDb, adminAuth } from '../middlewares/auth.js';
import { verifySuperAdmin } from '../middlewares/adminAuth.js';
import { renderJobs, notifyJobUpdate } from '../services/remotionService.js';
import { telegramService } from '../services/telegramService.js';
import { planService } from '../services/planService.js';
import { computeSubscriptionExpiry } from '../services/paymentDecision.js';
import { getAllRecipes, saveRecipe, resetRecipes } from '../services/creativeRecipeService.js';
import { aiLogService } from '../services/aiLogService.js';

const router = Router();

// Apply verifySuperAdmin middleware to ALL admin routes
router.use(verifySuperAdmin);

// ── 1. Executive Metrics & Analytics ──
router.get('/metrics', async (req, res) => {
  try {
    let totalUsers = 0;
    let freeUsers = 0;
    let creatorUsers = 0;
    let businessUsers = 0;
    let adminUsers = 0;
    let totalRevenue = 0;
    let totalTransactions = 0;

    if (adminDb) {
      // Aggregate users
      const usersSnap = await adminDb.collection('users').get();
      totalUsers = usersSnap.size;

      usersSnap.forEach(doc => {
        const u = doc.data();
        const tier = u.planTier || 'free';
        if (tier === 'creator') creatorUsers++;
        else if (tier === 'business') businessUsers++;
        else if (tier === 'admin') adminUsers++;
        else freeUsers++;
      });

      // Aggregate revenue from transactions
      const txSnap = await adminDb.collection('transactions').get();
      totalTransactions = txSnap.size;

      txSnap.forEach(doc => {
        const tx = doc.data();
        totalRevenue += Number(tx.amount || 0);
      });
    }

    // Active render jobs count
    let activeRendersCount = 0;
    renderJobs.forEach(job => {
      if (job.status === 'queued' || job.status === 'bundling' || job.status === 'rendering') {
        activeRendersCount++;
      }
    });

    res.json({
      totalRevenue,
      totalUsers,
      freeUsers,
      creatorUsers,
      businessUsers,
      adminUsers,
      proUsersCount: creatorUsers + businessUsers,
      totalTransactions,
      activeRendersCount,
      serverUptimeSec: Math.round(process.uptime()),
    });
  } catch (err) {
    console.error('❌ [Admin Metrics Error]:', err);
    res.status(500).json({ error: 'Failed to compute admin metrics', details: err.message });
  }
});

// ── 2. User CRM Management ──
router.get('/users', async (req, res) => {
  try {
    const search = String(req.query.search || '').trim().toLowerCase();
    const users = [];

    if (adminDb) {
      const usersSnap = await adminDb.collection('users').get();
      usersSnap.forEach(doc => {
        const data = doc.data();
        const userObj = {
          uid: doc.id,
          email: data.email || '',
          displayName: data.displayName || '',
          planTier: data.planTier || 'free',
          role: data.role || 'user',
          licenseKeyUsed: data.licenseKeyUsed || null,
          createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null,
          updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt) : null,
        };

        if (!search || userObj.email.toLowerCase().includes(search) || userObj.uid.toLowerCase().includes(search)) {
          users.push(userObj);
        }
      });
    }

    res.json(users);
  } catch (err) {
    console.error('❌ [Admin Users Error]:', err);
    res.status(500).json({ error: 'Failed to fetch users', details: err.message });
  }
});

// Update a user's plan tier directly
router.post('/users/:uid/plan', async (req, res) => {
  const { uid } = req.params;
  const { planTier } = req.body;

  if (!['free', 'creator', 'business', 'admin'].includes(planTier)) {
    return res.status(400).json({ error: 'Invalid planTier specified' });
  }

  try {
    if (adminDb) {
      await adminDb.collection('users').doc(uid).set({
        planTier,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    console.log(`✅ [Admin Action]: Updated UID ${uid} to plan ${planTier}`);
    res.json({ success: true, uid, planTier });
  } catch (err) {
    console.error('❌ [Admin User Update Error]:', err);
    res.status(500).json({ error: 'Failed to update user plan', details: err.message });
  }
});

// Update a user's role (admin / user) and synchronize Firebase Custom Claims
router.post('/users/:uid/role', async (req, res) => {
  const { uid } = req.params;
  const { role } = req.body;

  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Role không hợp lệ. Chỉ chấp nhận user hoặc admin.' });
  }

  try {
    if (adminDb) {
      await adminDb.collection('users').doc(uid).set({
        role,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    if (adminAuth) {
      await adminAuth.setCustomUserClaims(uid, {
        admin: role === 'admin',
        role,
      });
      console.log(`👑 [Admin Action]: Updated Custom Claims for UID ${uid} to role: ${role}`);
    }

    res.json({ success: true, uid, role });
  } catch (err) {
    console.error('❌ [Admin Role Update Error]:', err);
    res.status(500).json({ error: 'Failed to update user role', details: err.message });
  }
});

// ── 3. Transactions & Order Ledger ──
router.get('/transactions', async (req, res) => {
  try {
    const transactions = [];

    if (adminDb) {
      const txSnap = await adminDb.collection('transactions').get();
      txSnap.forEach(doc => {
        transactions.push({
          id: doc.id,
          ...doc.data(),
        });
      });
    }

    // Sort newest first
    transactions.sort((a, b) => new Date(b.processedAt || 0) - new Date(a.processedAt || 0));
    res.json(transactions);
  } catch (err) {
    console.error('❌ [Admin Transactions Error]:', err);
    res.status(500).json({ error: 'Failed to fetch transactions', details: err.message });
  }
});

// Manual 1-Click Approval for Pending Transactions / Bank Transfers
router.post('/transactions/manual-approve', async (req, res) => {
  const { email, uid, planTier = 'creator', amount = 0, note = 'Duyệt thủ công bởi Admin' } = req.body;
  // 0 = vô thời hạn; còn lại: gia hạn cùng gói khi còn hạn → cộng tiếp từ ngày hết hạn hiện tại
  const durationDays = Math.max(0, Number(req.body.durationDays) || 0);

  if (!email && !uid) {
    return res.status(400).json({ error: 'Must provide email or uid to approve' });
  }

  try {
    let targetUid = uid;

    if (!targetUid && adminDb) {
      const snap = await adminDb.collection('users').where('email', '==', email.trim()).limit(1).get();
      if (!snap.empty) {
        targetUid = snap.docs[0].id;
      }
    }

    if (!targetUid) {
      return res.status(404).json({ error: 'User not found in system' });
    }

    const nowIso = new Date().toISOString();
    const txId = `MANUAL_${Date.now()}`;

    if (adminDb) {
      const userRef = adminDb.collection('users').doc(targetUid);
      const current = (await userRef.get()).data() || {};
      const subscription = durationDays > 0
        ? {
            subscriptionExpiresAt: computeSubscriptionExpiry({
              currentTier: current.planTier,
              currentExpiresAt: current.subscriptionExpiresAt,
              targetTier: planTier,
              days: durationDays,
            }),
            subscriptionPeriod: durationDays >= 365 ? 'yearly' : 'monthly',
          }
        : { subscriptionExpiresAt: null, subscriptionPeriod: 'lifetime' };

      // Upgrade user
      await userRef.set({
        planTier,
        ...subscription,
        subscriptionStatus: 'active',
        updatedAt: nowIso,
      }, { merge: true });

      // Save transaction audit
      await adminDb.collection('transactions').doc(txId).set({
        transactionId: txId,
        amount: Number(amount),
        description: `DUYET THU CONG - GÓI ${planTier.toUpperCase()}`,
        targetUid,
        targetEmail: email || targetUid,
        targetTier: planTier,
        processedAt: nowIso,
        status: 'completed',
        note,
      });
    }

    console.log(`🎉 [Admin Manual Approve]: Upgraded user ${email || targetUid} to ${planTier}`);
    res.json({ success: true, txId, targetUid, planTier });
  } catch (err) {
    console.error('❌ [Admin Manual Approve Error]:', err);
    res.status(500).json({ error: 'Failed to manual approve transaction', details: err.message });
  }
});

// ── 4. Live Render Queue Monitor ──
router.get('/render-queue', (req, res) => {
  const jobsList = [];
  renderJobs.forEach((job, jobId) => {
    jobsList.push({
      id: jobId,
      userId: job.userId,
      userEmail: job.userEmail,
      status: job.status,
      progress: job.progress || 0,
      scenesCount: job.scenesCount || 0,
      createdAt: job.createdAt,
      renderTimeSec: job.renderTimeSec,
      outputFilename: job.outputFilename,
      downloadUrl: job.downloadUrl,
      error: job.error,
    });
  });

  // Sort newest first
  jobsList.sort((a, b) => b.createdAt - a.createdAt);
  res.json(jobsList);
});

// Kill a runaway or stuck render job
router.post('/render-queue/:jobId/kill', (req, res) => {
  const { jobId } = req.params;
  const job = renderJobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found in queue' });
  }

  job.status = 'cancelled';
  job.error = 'Hủy bởi Super Admin';
  notifyJobUpdate(jobId);
  renderJobs.delete(jobId);

  console.log(`🛑 [Admin Kill Job]: Terminated render job ${jobId}`);
  res.json({ success: true, jobId, message: 'Job terminated successfully' });
});

// ── 5. License Keys Management ──
router.get('/license-keys', async (req, res) => {
  try {
    const keys = [];
    if (adminDb) {
      const snap = await adminDb.collection('license_keys').get();
      snap.forEach(doc => {
        keys.push({ id: doc.id, ...doc.data() });
      });
    }
    res.json(keys);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch license keys', details: err.message });
  }
});

router.post('/license-keys', async (req, res) => {
  const { key, tier = 'creator', note, maxUses = 1 } = req.body;
  const cleanKey = String(key || '').trim().toUpperCase();

  if (!cleanKey) {
    return res.status(400).json({ error: 'License key cannot be empty' });
  }

  try {
    if (adminDb) {
      await adminDb.collection('license_keys').doc(cleanKey).set({
        key: cleanKey,
        tier,
        note: note || '',
        maxUses: Number(maxUses),
        usedCount: 0,
        createdAt: new Date().toISOString(),
        createdBy: req.user.email,
      });
    }

    res.json({ success: true, key: cleanKey, tier });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create license key', details: err.message });
  }
});

// ── 6. Dynamic System & Payment Settings (Zero-Code Control) ──
router.get('/settings', async (req, res) => {
  try {
    let settings = {
      bankName: 'ACB',
      accountNumber: '271090168',
      companyName: 'CÔNG TY TNHH THẾ GIỚI SỐ X-DMAIC',
      supportHotline: '0967896567',
      supportZalo: 'https://zalo.me/0967896567',
      dailyFreeLimit: 5,
      telegramBotToken: '',
      telegramChatId: '',
      webhookSecret: '',
      aiLimitFree: 5,
      aiLimitCreator: 50,
      aiLimitBusiness: -1,
      aiCacheEnabled: true,
    };

    if (adminDb) {
      const doc = await adminDb.collection('system_settings').doc('app_config').get();
      if (doc.exists) {
        settings = { ...settings, ...doc.data() };
      } else {
        const fallbackDoc = await adminDb.collection('system').doc('settings').get();
        if (fallbackDoc.exists) {
          settings = { ...settings, ...fallbackDoc.data() };
        }
      }
    }

    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch system settings', details: err.message });
  }
});

router.post('/settings', async (req, res) => {
  const updates = req.body || {};
  try {
    if (adminDb) {
      const payload = {
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: req.user.email,
      };

      // Save to both collections for seamless access
      await adminDb.collection('system_settings').doc('app_config').set(payload, { merge: true });
      await adminDb.collection('system').doc('settings').set(payload, { merge: true });
    }

    console.log(`⚙️ [Admin Settings]: Updated system settings by ${req.user.email}`);
    res.json({ success: true, settings: updates });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save system settings', details: err.message });
  }
});

// ── 7. Telegram Bot Test Ping ──
router.post('/telegram-test', async (req, res) => {
  const { botToken, chatId } = req.body || {};
  try {
    const result = await telegramService.sendTestPing(botToken, chatId);
    if (result.success) {
      res.json({ success: true, message: 'Đã gửi tin nhắn thử nghiệm thành công tới Telegram!' });
    } else {
      res.status(400).json({
        error: result.error || 'Không thể gửi tin nhắn tới Telegram. Vui lòng kiểm tra lại Bot Token và Chat ID.',
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 8. Dynamic Subscription Plans & Feature Matrix ──
router.get('/plans', async (req, res) => {
  try {
    const plans = await planService.getAllPlans();
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch plans', details: err.message });
  }
});

router.put('/plans/:id', async (req, res) => {
  const planId = req.params.id;
  const updates = req.body || {};
  try {
    const saved = await planService.savePlan(planId, updates, req.user?.email || 'admin');
    console.log(`⚙️ [Admin Plans]: Updated plan "${planId}" by ${req.user?.email}`);
    res.json({ success: true, plan: saved });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save plan', details: err.message });
  }
});

router.post('/plans', async (req, res) => {
  const planData = req.body || {};
  const planId = planData.id || planData.slug;
  if (!planId) {
    return res.status(400).json({ error: 'Missing plan ID or slug' });
  }
  try {
    const saved = await planService.savePlan(planId, planData, req.user?.email || 'admin');
    console.log(`✨ [Admin Plans]: Created new plan "${planId}" by ${req.user?.email}`);
    res.json({ success: true, plan: saved });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create plan', details: err.message });
  }
});

router.post('/plans/reset', async (req, res) => {
  try {
    const defaults = await planService.resetToDefaults(req.user?.email || 'admin');
    console.log(`🔄 [Admin Plans]: Reset all plans to defaults by ${req.user?.email}`);
    res.json({ success: true, plans: defaults });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset plans', details: err.message });
  }
});

// ── 7. Creative Recipes & Narrative Arc Engine ──
router.get('/recipes', async (req, res) => {
  try {
    const recipes = await getAllRecipes();
    res.json({ success: true, recipes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recipes', details: err.message });
  }
});

router.put('/recipes/:id', async (req, res) => {
  const recipeId = req.params.id;
  const updates = req.body || {};
  try {
    const saved = await saveRecipe(recipeId, updates);
    console.log(`🧪 [Admin Recipes]: Updated creative recipe "${recipeId}" by ${req.user?.email}`);
    res.json({ success: true, recipe: saved });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save recipe', details: err.message });
  }
});

router.post('/recipes/reset', async (req, res) => {
  try {
    const defaults = await resetRecipes();
    console.log(`🔄 [Admin Recipes]: Reset all creative recipes to defaults by ${req.user?.email}`);
    res.json({ success: true, recipes: defaults });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset recipes', details: err.message });
  }
});

// ── 8. AI Generation Logs & Observability ──
router.get('/ai-logs/summary', async (req, res) => {
  try {
    const summary = await aiLogService.getAiDailySummary(req.query.dateKey);
    res.json({ success: true, summary });
  } catch (err) {
    console.error('❌ [Admin AI Summary Error]:', err);
    res.status(500).json({ error: 'Failed to fetch AI daily summary', details: err.message });
  }
});

router.get('/ai-logs', async (req, res) => {
  try {
    const { limit = 50, tier = '', model = '', status = '', search = '' } = req.query;
    const logs = await aiLogService.getAiLogs({ limit, tier, model, status, search });
    res.json({ success: true, logs });
  } catch (err) {
    console.error('❌ [Admin AI Logs Error]:', err);
    res.status(500).json({ error: 'Failed to fetch AI generation logs', details: err.message });
  }
});

export default router;
