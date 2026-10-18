/**
 * SSOT tính biểu thức toán cho đồ thị (math-plot) — dùng chung Remotion, Fabric và bước kiểm tra AI.
 * Dùng math.js đã khoá các hàm nguy hiểm thay cho `new Function` (biểu thức do AI viết không được chạy code).
 * File .js thuần để server/render worker import trực tiếp như planCatalog.js.
 */
import { create, all } from 'mathjs';

const math = create(all);
// Giữ tham chiếu trước khi khoá: parse dùng nội bộ, compile gọi qua node.compile()
const parseExpr = math.parse;
const disabled = (name) => () => {
  throw new Error(`Hàm ${name} không được phép trong biểu thức`);
};
math.import(
  {
    import: disabled('import'),
    createUnit: disabled('createUnit'),
    reviver: disabled('reviver'),
    evaluate: disabled('evaluate'),
    parse: disabled('parse'),
    compile: disabled('compile'),
    simplify: disabled('simplify'),
    derivative: disabled('derivative'),
    resolve: disabled('resolve'),
  },
  { override: true }
);

/** Miền mặc định — Remotion và Fabric dùng chung để kiểm tra khớp với hình vẽ */
export const PLOT_DEFAULT_DOMAIN_X = [-5, 5];
export const PLOT_DEFAULT_DOMAIN_Y = [-2.5, 2.5];
/** Khoảng tham số tau của đồ thị tham số (khớp Plot.Parametric) */
export const PARAMETRIC_TAU_RANGE = [-Math.PI * 2, Math.PI * 2];

/**
 * Chuyển cú pháp JS cũ (đang lưu trong dự án) sang math.js: Math.sin → sin, ** → ^, && → and.
 * @param {string} raw
 * @returns {string}
 */
export function normalizeLegacyExpr(raw) {
  return String(raw ?? '')
    .trim()
    .replace(/\bMath\./g, '')
    .replace(/\*\*/g, '^')
    .replace(/!==/g, '!=')
    .replace(/===/g, '==')
    .replace(/&&/g, ' and ')
    .replace(/\|\|/g, ' or ');
}

/** Kết quả math.js (số, boolean, số phức, BigNumber, nhiều câu lệnh) → number; không phải số thực → NaN */
function toNumber(v) {
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (v && Array.isArray(v.entries)) return toNumber(v.entries[v.entries.length - 1]);
  if (v && typeof v.re === 'number' && typeof v.im === 'number') return Math.abs(v.im) < 1e-12 ? v.re : NaN;
  if (v && typeof v.toNumber === 'function') return v.toNumber();
  return NaN;
}

/** Ký hiệu chưa biết (không phải biến cho phép, hằng hay hàm của math.js) */
function unknownSymbols(node, vars) {
  const unknown = new Set();
  node.traverse((n, _path, parent) => {
    if (!n.isSymbolNode) return;
    // Tên hàm trong lời gọi f(x) đã được math.js kiểm khi chạy; chỉ xét biến
    if (parent && parent.isFunctionNode && parent.fn === n) {
      if (!(n.name in math)) unknown.add(n.name);
      return;
    }
    if (!vars.includes(n.name) && !(n.name in math)) unknown.add(n.name);
  });
  return [...unknown];
}

const cache = new Map();
const CACHE_LIMIT = 500;

/**
 * Dịch biểu thức một lần (có cache). fn trả về số thực hoặc NaN — không bao giờ ném lỗi.
 * @param {string} raw
 * @param {string[]} [vars]
 * @returns {{ fn: ((...args: number[]) => number) | null, error: string | null }}
 */
export function compileExpr(raw, vars = ['x', 't']) {
  const source = typeof raw === 'string' ? normalizeLegacyExpr(raw) : '';
  if (!source) return { fn: null, error: 'Biểu thức trống' };

  const key = `${vars.join(',')}|${source}`;
  const hit = cache.get(key);
  if (hit) return hit;

  let result;
  try {
    const node = parseExpr(source);
    const unknown = unknownSymbols(node, vars);
    if (unknown.length) {
      result = { fn: null, error: `Ký hiệu không xác định: ${unknown.join(', ')} (chỉ dùng ${vars.join(', ')})` };
    } else {
      const code = node.compile();
      const fn = (...args) => {
        const scope = {};
        for (let i = 0; i < vars.length; i++) scope[vars[i]] = args[i];
        try {
          return toNumber(code.evaluate(scope));
        } catch {
          return NaN;
        }
      };
      result = { fn, error: null };
    }
  } catch (err) {
    result = { fn: null, error: `Biểu thức không hợp lệ: ${err?.message || err}` };
  }

  if (cache.size >= CACHE_LIMIT) cache.clear();
  cache.set(key, result);
  return result;
}

/**
 * Hàm dùng khi vẽ: điểm không tính được trả 0 (Mafs không chịu NaN — đường sẽ đứt từ điểm lỗi).
 * Biểu thức hỏng → null để nơi vẽ bỏ đường cong, không vẽ đường thẳng giả.
 * @param {string | undefined} raw
 * @param {string[]} [vars]
 */
export function compileRenderFn(raw, vars = ['x', 't']) {
  const { fn } = compileExpr(raw ?? '', vars);
  if (!fn) return null;
  return (...args) => {
    const v = fn(...args);
    return Number.isFinite(v) ? v : 0;
  };
}

/**
 * Toạ độ động: số tĩnh hoặc biểu thức theo t.
 * @param {number | string | undefined} val
 * @param {number} timeSec
 * @param {number} [defaultVal]
 */
export function evalCoordExpr(val, timeSec, defaultVal = 0) {
  if (typeof val === 'number') return Number.isFinite(val) ? val : defaultVal;
  if (typeof val === 'string') {
    const { fn } = compileExpr(val, ['t']);
    const v = fn ? fn(timeSec) : NaN;
    return Number.isFinite(v) ? v : defaultVal;
  }
  return defaultVal;
}

// ── KIỂM TRA DỮ LIỆU ĐỒ THỊ ─────────────────────────────────────────────

export const PLOT_SAMPLE_COUNT = 200;
/** Quá nửa số điểm không tính được → đồ thị hỏng (1/x, log x, tan x vẫn qua) */
const MIN_FINITE_RATIO = 0.5;

const linspace = (a, b, n) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));

function sampleCurve(fn, domain, view) {
  let finite = 0;
  let inView = 0;
  const ys = [];
  for (const x of linspace(domain[0], domain[1], PLOT_SAMPLE_COUNT)) {
    const y = fn(x, 0);
    if (!Number.isFinite(y)) continue;
    finite++;
    ys.push(y);
    if (y >= view[0] && y <= view[1]) inView++;
  }
  const mean = ys.reduce((s, y) => s + y, 0) / (ys.length || 1);
  const variance = ys.reduce((s, y) => s + (y - mean) ** 2, 0) / (ys.length || 1);
  return { finiteRatio: finite / PLOT_SAMPLE_COUNT, inView, variance };
}

const validDomain = (d, fallback) =>
  Array.isArray(d) && d.length === 2 && d.every(Number.isFinite) && d[0] < d[1] ? d : fallback;

/**
 * Kiểm tra mọi biểu thức của một đồ thị bằng 200 điểm mẫu (t = 0).
 * errors → chặn (AI tạo lại / dự phòng); warnings → chỉ báo (ví dụ hàm hằng y = 2 vẫn hợp lệ).
 * @param {Record<string, any> | undefined} data mathData
 * @returns {{ ok: boolean, errors: string[], warnings: string[] }}
 */
export function validatePlotData(data) {
  const errors = [];
  const warnings = [];
  if (!data || typeof data !== 'object') return { ok: false, errors: ['Thiếu dữ liệu đồ thị'], warnings };

  const domainX = validDomain(data.domainX, PLOT_DEFAULT_DOMAIN_X);
  const domainY = validDomain(data.domainY, PLOT_DEFAULT_DOMAIN_Y);
  const has = (k) => typeof data[k] === 'string' && data[k].trim() !== '';

  if (!has('expression') && !has('expressionY') && !(has('parametricX') && has('parametricY')) && !has('vectorFieldExpr')) {
    errors.push('Thiếu biểu thức đồ thị');
  }

  const checkCurve = (field, vars, domain, view) => {
    const { fn, error } = compileExpr(data[field], vars);
    if (!fn) return errors.push(`${field}: ${error}`);
    const s = sampleCurve(fn, domain, view);
    if (s.finiteRatio < MIN_FINITE_RATIO) errors.push(`${field}: quá nửa số điểm không tính được`);
    else if (s.inView === 0) errors.push(`${field}: đồ thị nằm ngoài vùng hiển thị`);
    else if (field === 'expression' && s.variance < 1e-12) warnings.push('expression: đồ thị là đường thẳng nằm ngang');
  };

  if (has('expression')) checkCurve('expression', ['x', 't'], domainX, domainY);
  if (has('expressionY')) checkCurve('expressionY', ['y', 't'], domainY, domainX);

  if (has('parametricX') !== has('parametricY')) {
    errors.push('Đồ thị tham số cần cả parametricX và parametricY');
  } else if (has('parametricX')) {
    const px = compileExpr(data.parametricX, ['tau', 't']);
    const py = compileExpr(data.parametricY, ['tau', 't']);
    if (!px.fn) errors.push(`parametricX: ${px.error}`);
    if (!py.fn) errors.push(`parametricY: ${py.error}`);
    if (px.fn && py.fn) {
      let finite = 0;
      let inView = 0;
      for (const tau of linspace(PARAMETRIC_TAU_RANGE[0], PARAMETRIC_TAU_RANGE[1], PLOT_SAMPLE_COUNT)) {
        const x = px.fn(tau, 0);
        const y = py.fn(tau, 0);
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        finite++;
        if (x >= domainX[0] && x <= domainX[1] && y >= domainY[0] && y <= domainY[1]) inView++;
      }
      if (finite / PLOT_SAMPLE_COUNT < MIN_FINITE_RATIO) errors.push('parametric: quá nửa số điểm không tính được');
      else if (inView === 0) errors.push('parametric: đồ thị nằm ngoài vùng hiển thị');
    }
  }

  if (has('vectorFieldExpr')) {
    const { fn, error } = compileExpr(data.vectorFieldExpr, ['x', 'y', 't']);
    if (!fn) errors.push(`vectorFieldExpr: ${error}`);
    else {
      const grid = linspace(domainX[0], domainX[1], 15).flatMap((x) => linspace(domainY[0], domainY[1], 15).map((y) => fn(x, y, 0)));
      if (grid.filter(Number.isFinite).length / grid.length < MIN_FINITE_RATIO) errors.push('vectorFieldExpr: quá nửa số điểm không tính được');
    }
  }

  // Toạ độ động theo t (điểm, vector, đường, nhãn, sprite, tiếp tuyến)
  const coords = [];
  const pushCoord = (label, v) => typeof v === 'string' && coords.push([label, v]);
  pushCoord('tangentX', data.tangentX);
  (data.points || []).forEach((p, i) => (pushCoord(`points[${i}].x`, p?.x), pushCoord(`points[${i}].y`, p?.y)));
  (data.labels || []).forEach((p, i) => (pushCoord(`labels[${i}].x`, p?.x), pushCoord(`labels[${i}].y`, p?.y)));
  (data.vectors || []).forEach((v, i) => {
    (v?.tail || []).forEach((c, j) => pushCoord(`vectors[${i}].tail[${j}]`, c));
    (v?.tip || []).forEach((c, j) => pushCoord(`vectors[${i}].tip[${j}]`, c));
  });
  (data.lines || []).forEach((l, i) => {
    (l?.point || []).forEach((c, j) => pushCoord(`lines[${i}].point[${j}]`, c));
    pushCoord(`lines[${i}].slope`, l?.slope);
  });
  (data.sprite?.at || []).forEach((c, j) => pushCoord(`sprite.at[${j}]`, c));
  pushCoord('sprite.angle', data.sprite?.angle);

  for (const [label, v] of coords) {
    const { fn, error } = compileExpr(v, ['t']);
    if (!fn) {
      errors.push(`${label}: ${error}`);
      continue;
    }
    const samples = linspace(0, 10, 21).map((t) => fn(t));
    if (samples.filter(Number.isFinite).length / samples.length < 0.9) errors.push(`${label}: không tính được theo t`);
  }

  return { ok: errors.length === 0, errors, warnings };
}
