import assert from 'node:assert';

function formatVnd(amount) {
  if (!amount || amount <= 0) return '0 đ';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
    .format(amount)
    .replace('₫', 'đ');
}

function formatDateTime(isoString) {
  if (!isoString) return '--/--/----';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '--/--/----';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function getSubscriptionCountdown(expiresAtIso, planTier = 'free') {
  if (planTier === 'admin') {
    return { isExpired: false, isInfinite: true, daysLeft: 9999, label: 'Vô hạn (Super Admin)' };
  }

  if (planTier === 'free') {
    return { isExpired: false, isInfinite: true, daysLeft: 0, label: 'Gói Miễn Phí (Vĩnh viễn)' };
  }

  if (!expiresAtIso) {
    return { isExpired: false, isInfinite: true, daysLeft: 0, label: 'Đang hoạt động (Trọn đời)' };
  }

  const expiryTime = new Date(expiresAtIso).getTime();
  if (isNaN(expiryTime)) {
    return { isExpired: false, isInfinite: true, daysLeft: 0, label: 'Đang hoạt động' };
  }

  const now = Date.now();
  const diffMs = expiryTime - now;
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysLeft <= 0) {
    return { isExpired: true, isInfinite: false, daysLeft: 0, label: 'Đã hết hạn' };
  }

  const d = new Date(expiryTime);
  const dateFormatted = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

  return {
    isExpired: false,
    isInfinite: false,
    daysLeft,
    label: `Hết hạn ${dateFormatted} (Còn ${daysLeft} ngày)`,
  };
}

function parseProcessedAt(data) {
  let processedAt = new Date().toISOString();
  const rawTime = data.processedAt || data.createdAt;
  if (rawTime) {
    if (typeof rawTime.toDate === 'function') {
      processedAt = rawTime.toDate().toISOString();
    } else if (typeof rawTime === 'string') {
      processedAt = rawTime;
    } else if (rawTime.seconds) {
      processedAt = new Date(rawTime.seconds * 1000).toISOString();
    }
  }
  return processedAt;
}

function testComprehensiveBillingLogic() {
  console.log('--- 1. Testing formatVnd ---');
  assert.strictEqual(formatVnd(0), '0 đ');
  assert.strictEqual(formatVnd(-5000), '0 đ');
  assert.ok(formatVnd(199000).includes('199.000'));
  assert.ok(formatVnd(199000).includes('đ'));

  console.log('--- 2. Testing formatDateTime ---');
  assert.strictEqual(formatDateTime(null), '--/--/----');
  assert.strictEqual(formatDateTime(undefined), '--/--/----');
  assert.strictEqual(formatDateTime('invalid-date'), '--/--/----');
  const sampleFormatted = formatDateTime('2026-09-16T08:30:00.000Z');
  assert.ok(sampleFormatted.includes('2026'));

  console.log('--- 3. Testing getSubscriptionCountdown for all tiers ---');
  // Admin
  const adminRes = getSubscriptionCountdown(null, 'admin');
  assert.strictEqual(adminRes.isInfinite, true);
  assert.strictEqual(adminRes.label, 'Vô hạn (Super Admin)');

  // Free Tier
  const freeRes = getSubscriptionCountdown(null, 'free');
  assert.strictEqual(freeRes.isInfinite, true);
  assert.strictEqual(freeRes.label, 'Gói Miễn Phí (Vĩnh viễn)');

  // Creator without expiry (lifetime)
  const lifetimeRes = getSubscriptionCountdown(null, 'creator');
  assert.strictEqual(lifetimeRes.isInfinite, true);
  assert.strictEqual(lifetimeRes.label, 'Đang hoạt động (Trọn đời)');

  // Creator expired yesterday
  const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const expiredRes = getSubscriptionCountdown(expiredDate, 'creator');
  assert.strictEqual(expiredRes.isExpired, true);
  assert.strictEqual(expiredRes.label, 'Đã hết hạn');

  // Creator active 15 days ahead
  const activeDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
  const activeRes = getSubscriptionCountdown(activeDate, 'creator');
  assert.strictEqual(activeRes.isExpired, false);
  assert.strictEqual(activeRes.daysLeft, 15);
  assert.ok(activeRes.label.includes('Còn 15 ngày'));

  console.log('--- 4. Testing Firestore Timestamp Parsing ---');
  // ISO string
  assert.strictEqual(parseProcessedAt({ processedAt: '2026-09-16T10:00:00Z' }), '2026-09-16T10:00:00Z');
  // Firestore toDate() function
  assert.strictEqual(parseProcessedAt({ processedAt: { toDate: () => new Date('2026-09-16T10:00:00Z') } }), '2026-09-16T10:00:00.000Z');
  // Firestore seconds field
  assert.strictEqual(parseProcessedAt({ processedAt: { seconds: 1789526400 } }), new Date(1789526400000).toISOString());
  // Fallback to createdAt
  assert.strictEqual(parseProcessedAt({ createdAt: '2026-09-15T09:00:00Z' }), '2026-09-15T09:00:00Z');

  console.log('--- 5. Testing RAM Sorting (Zero Index Error) ---');
  const receipts = [
    { transactionId: 'TX1', processedAt: '2026-01-10T00:00:00Z' },
    { transactionId: 'TX3', processedAt: '2026-03-20T00:00:00Z' },
    { transactionId: 'TX2', processedAt: '2026-02-15T00:00:00Z' },
  ];
  receipts.sort((a, b) => {
    const timeA = new Date(a.processedAt).getTime() || 0;
    const timeB = new Date(b.processedAt).getTime() || 0;
    return timeB - timeA;
  });
  assert.strictEqual(receipts[0].transactionId, 'TX3');
  assert.strictEqual(receipts[1].transactionId, 'TX2');
  assert.strictEqual(receipts[2].transactionId, 'TX1');

  console.log('--- 6. Testing Quota Null Safeguard ---');
  const planConfig = { monthlyVideoLimit: 3 };
  const mockUserNoQuota = { quota: null, planTier: 'free' };
  const safeLimit = mockUserNoQuota.quota?.monthlyVideoLimit || planConfig.monthlyVideoLimit || 3;
  const safeUsed = mockUserNoQuota.quota?.videosRenderedThisMonth ?? 0;
  assert.strictEqual(safeLimit, 3);
  assert.strictEqual(safeUsed, 0);

  const displayString = `${safeUsed}/${safeLimit} Free`;
  assert.strictEqual(displayString, '0/3 Free');
  assert.ok(!displayString.includes('null'));

  console.log(' All 6 Comprehensive Acceptance Tests PASSED Successfully!');
}

testComprehensiveBillingLogic();
