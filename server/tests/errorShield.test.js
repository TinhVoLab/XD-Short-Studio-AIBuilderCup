import assert from 'node:assert';

function isBenignError(errorOrMsg) {
  if (!errorOrMsg) return true;

  const msg = typeof errorOrMsg === 'string'
    ? errorOrMsg
    : errorOrMsg.message || String(errorOrMsg);

  if (
    msg.includes('ResizeObserver loop completed with undelivered notifications') ||
    msg.includes('ResizeObserver loop limit exceeded')
  ) {
    return true;
  }

  if (
    errorOrMsg.name === 'AbortError' ||
    msg.includes('The user aborted a request') ||
    msg.includes('signal is aborted')
  ) {
    return true;
  }

  if (
    msg.includes('chrome-extension://') ||
    msg.includes('moz-extension://') ||
    msg.includes('safari-extension://')
  ) {
    return true;
  }

  return false;
}

function mockElementFallbackStyle(el) {
  return {
    position: 'absolute',
    left: el?.left ?? 0,
    top: el?.top ?? 0,
    width: el?.width ?? 160,
    height: el?.height ?? 50,
    transform: `rotate(${el?.angle ?? 0}deg) scale(${el?.scaleX ?? 1}, ${el?.scaleY ?? 1})`,
    border: '1.5px dashed rgba(255, 77, 79, 0.45)',
    backgroundColor: 'rgba(255, 77, 79, 0.08)',
    borderRadius: 6,
    label: `[Lỗi phần tử: ${el?.type || 'unknown'}]`,
  };
}

function testErrorShield() {
  console.log('--- 1. Testing Benign Noise Filter ---');
  assert.strictEqual(isBenignError('ResizeObserver loop limit exceeded'), true);
  assert.strictEqual(isBenignError('ResizeObserver loop completed with undelivered notifications'), true);
  assert.strictEqual(isBenignError({ name: 'AbortError', message: 'The user aborted a request.' }), true);
  assert.strictEqual(isBenignError('Error inside chrome-extension://abc123xyz/content.js'), true);
  assert.strictEqual(isBenignError('TypeError: Cannot read properties of undefined (reading "map")'), false);
  assert.strictEqual(isBenignError(new Error('SyntaxError: Unexpected token < in JSON at position 0')), false);

  console.log('--- 2. Testing Element Error Fallback Geometry Preservation ---');
  const sampleElement = {
    id: 'el-math-123',
    type: 'latex-formula',
    left: 200,
    top: 350,
    width: 300,
    height: 80,
    angle: 5,
    scaleX: 1.1,
    scaleY: 1.1,
  };
  const fallback = mockElementFallbackStyle(sampleElement);
  assert.strictEqual(fallback.left, 200);
  assert.strictEqual(fallback.top, 350);
  assert.strictEqual(fallback.width, 300);
  assert.strictEqual(fallback.height, 80);
  assert.strictEqual(fallback.transform, 'rotate(5deg) scale(1.1, 1.1)');
  assert.strictEqual(fallback.label, '[Lỗi phần tử: latex-formula]');

  console.log('--- 3. Testing Panel Auto-Recovery on Key Change ---');
  let panelState = { hasError: true, error: new Error('Corrupted prop') };
  let currentKey = 'element_1_tab_design';

  function updatePanel(newKey) {
    if (newKey !== currentKey && panelState.hasError) {
      panelState = { hasError: false, error: null };
      currentKey = newKey;
    }
  }

  // Same key: remains in error
  updatePanel('element_1_tab_design');
  assert.strictEqual(panelState.hasError, true);

  // User selects another element or tab: auto-recovers
  updatePanel('element_2_tab_design');
  assert.strictEqual(panelState.hasError, false);
  assert.strictEqual(panelState.error, null);

  console.log(' All Error Shield & Defensive Architecture tests PASSED successfully!');
}

testErrorShield();
