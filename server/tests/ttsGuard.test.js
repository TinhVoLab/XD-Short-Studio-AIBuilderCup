import assert from 'node:assert/strict';
import { createTtsGuard } from '../middlewares/ttsGuard.js';

const LIMITS = { MAX_CHARS_PER_REQUEST: 50, CHARS_PER_WINDOW: 100, WINDOW_MS: 1000 };
let clock = 0;
const guard = createTtsGuard(LIMITS, () => clock);

function call(user, text) {
  const res = {
    statusCode: 200, body: null, headers: {},
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
    set(k, v) { this.headers[k] = v; return this; },
  };
  let passed = false;
  guard({ user, body: { text } }, res, () => { passed = true; });
  return { passed, res };
}

const alice = { uid: 'alice' };
const bob = { uid: 'bob' };

// Một request quá dài → 413, không tính vào hạn mức
let r = call(alice, 'x'.repeat(51));
assert.equal(r.passed, false);
assert.equal(r.res.statusCode, 413);
assert.equal(r.res.body.code, 'tts/text_too_long');

// Trong hạn mức → qua
assert.equal(call(alice, 'x'.repeat(50)).passed, true);
assert.equal(call(alice, 'x'.repeat(50)).passed, true);

// Vượt hạn mức cửa sổ → 429 kèm Retry-After
r = call(alice, 'x');
assert.equal(r.passed, false);
assert.equal(r.res.statusCode, 429);
assert.equal(r.res.body.code, 'tts/rate_limited');
assert.ok(Number(r.res.headers['Retry-After']) > 0);

// Người dùng khác đếm riêng
assert.equal(call(bob, 'x'.repeat(50)).passed, true);

// Admin không bị giới hạn ký tự cửa sổ
assert.equal(call({ uid: 'admin', admin: true }, 'x'.repeat(50)).passed, true);
assert.equal(call({ uid: 'admin', admin: true }, 'x'.repeat(50)).passed, true);
assert.equal(call({ uid: 'admin', admin: true }, 'x'.repeat(50)).passed, true);

// Hết cửa sổ → reset
clock = 1000;
assert.equal(call(alice, 'x'.repeat(50)).passed, true);

console.log('ttsGuard.test.js: OK');
