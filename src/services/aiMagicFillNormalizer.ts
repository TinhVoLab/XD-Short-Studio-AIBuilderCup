/**
 * ==============================================================================
 * 🛡️ AI MAGIC FILL CANONICAL NORMALIZER & SANITIZER ENGINE
 * ==============================================================================
 * Ensures 100% Schema Integrity between AI generative responses (DeepSeek / Gemini)
 * and Remotion / Fabric rendering components.
 * 
 * Auto-repairs:
 *  - Outer wrappers ({ data: {...} }, { result: {...} }, { table: {...} })
 *  - Field renames (quote -> content, author -> authorName, steps -> flowSteps)
 *  - Type coercion (string numbers "85%" -> 85, comma-separated strings -> arrays)
 *  - Enum normalization (winner: "Phần mềm B" -> "right", status: "done" -> "checked")
 *  - Height recalculation via 3-Point Dynamic Box-Model Contract H = f(X)
 * ==============================================================================
 */

import { calculateElementDynamicHeight } from '../config/layoutRegistry.js';
import { ELEMENTS_REGISTRY } from '../config/elementsRegistry.js';
import type { SceneElement } from '../types/scene';
import { validatePlotData } from '@/utils/stem/mathExpr';
import { validateChemData } from '@/utils/stem/stemValidation';
import { normalizeLatex, validateLatex } from '@/utils/stem/latex';

export interface NormalizationResult {
  patch: Record<string, any>;
  summary: string;
}

// ── HELPER UTILITIES ─────────────────────────────────────────────────────────

export function coerceNumber(val: any, fallback = 0): number {
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (!val) return fallback;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? fallback : parsed;
}

export function coerceString(val: any, fallback = ''): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val.trim();
  return String(val).trim();
}

export function coerceArray<T = any>(val: any): T[] {
  if (Array.isArray(val)) return val;
  if (val === null || val === undefined) return [];
  if (typeof val === 'object') return Object.values(val) as T[];
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [val as unknown as T];
    }
  }
  return [val as unknown as T];
}

/**
 * Strips outer layer wrapper if AI wrapped the result in { data: ... }, { result: ... }, etc.
 */
function unwrapAiResponse(raw: any, primaryKey?: string): Record<string, any> {
  if (!raw || typeof raw !== 'object') return {};
  
  // If wrapped in { data: ... } or { result: ... } or { response: ... }
  if (raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
    return unwrapAiResponse(raw.data, primaryKey);
  }
  if (raw.result && typeof raw.result === 'object' && !Array.isArray(raw.result)) {
    return unwrapAiResponse(raw.result, primaryKey);
  }
  if (raw.output && typeof raw.output === 'object' && !Array.isArray(raw.output)) {
    return unwrapAiResponse(raw.output, primaryKey);
  }
  if (raw.payload && typeof raw.payload === 'object' && !Array.isArray(raw.payload)) {
    return unwrapAiResponse(raw.payload, primaryKey);
  }

  // If already matches primaryKey
  if (primaryKey && raw[primaryKey] && typeof raw[primaryKey] === 'object') {
    return raw;
  }

  return raw;
}

// ── TYPE-SPECIFIC NORMALIZERS ────────────────────────────────────────────────

/**
 * 1. TABLE LAYER NORMALIZER
 * Target schema: { tableData: { headers: string[], rows: string[][] } }
 */
function normalizeTable(data: any, currentElement?: SceneElement): NormalizationResult {
  const unwrapped = unwrapAiResponse(data, 'tableData');
  const source = unwrapped.tableData || unwrapped.table || unwrapped;

  let headers: string[] = [];
  if (Array.isArray(source.headers)) {
    headers = source.headers.map((h: any) => coerceString(h));
  } else if (Array.isArray(source.columns)) {
    headers = source.columns.map((h: any) => coerceString(h));
  } else if (Array.isArray(source.labels)) {
    headers = source.labels.map((h: any) => coerceString(h));
  }

  if (headers.length === 0) {
    headers = currentElement?.tableData?.headers || ['TIÊU CHÍ', 'ĐẶC ĐIỂM'];
  }

  let rows: string[][] = [];
  const rawRows = source.rows || source.data || source.items || [];
  if (Array.isArray(rawRows)) {
    rows = rawRows.map((r: any) => {
      if (Array.isArray(r)) {
        return r.map((c: any) => coerceString(c));
      }
      if (typeof r === 'object' && r !== null) {
        // e.g. { criterion: "X", value: "Y" } or { col1: "X", col2: "Y" }
        const values = Object.values(r);
        return values.map((c: any) => coerceString(c));
      }
      return [coerceString(r), ''];
    });
  }

  if (rows.length === 0) {
    rows = currentElement?.tableData?.rows || [
      ['Tốc độ', 'Nhanh hơn 10x'],
      ['Chi phí', 'Tiết kiệm 80%'],
    ];
  }

  const patch: Record<string, any> = {
    tableData: {
      headers,
      rows,
      secondColor: source.secondColor || currentElement?.tableData?.secondColor || '#BEFF01',
    },
    rows, // Backward-compatibility
  };

  return {
    patch,
    summary: `Bảng đối chiếu ${rows.length} dòng (${headers.join(' vs ')})`,
  };
}

/**
 * 2. VS BATTLE LAYER NORMALIZER
 * Target schema: { vsBattle: { leftSubject, rightSubject, rounds, winner, showWinner } }
 */
function normalizeVsBattle(data: any, currentElement?: SceneElement): NormalizationResult {
  const unwrapped = unwrapAiResponse(data, 'vsBattle');
  const source = unwrapped.vsBattle || unwrapped.battle || unwrapped;

  const curVs = currentElement?.vsBattle || {
    leftSubject: { name: 'Cách Cũ', icon: '❌', color: '#FF5544' },
    rightSubject: { name: 'Cách Mới', icon: '⚡', color: '#BEFF01' },
    rounds: [],
    winner: 'right' as const,
    showWinner: true,
  };

  // Left Subject
  const leftRaw = source.leftSubject || source.left || source.leftCard || {};
  const leftSubject = {
    name: coerceString(leftRaw.name || leftRaw.title, curVs.leftSubject?.name || 'Cách Cũ'),
    icon: coerceString(leftRaw.icon, curVs.leftSubject?.icon || '❌'),
    color: coerceString(leftRaw.color, curVs.leftSubject?.color || '#FF5544'),
  };

  // Right Subject
  const rightRaw = source.rightSubject || source.right || source.rightCard || {};
  const rightSubject = {
    name: coerceString(rightRaw.name || rightRaw.title, curVs.rightSubject?.name || 'Cách Mới'),
    icon: coerceString(rightRaw.icon, curVs.rightSubject?.icon || '⚡'),
    color: coerceString(rightRaw.color, curVs.rightSubject?.color || '#BEFF01'),
  };

  // Rounds
  const rawRounds = source.rounds || source.items || source.criteria || [];
  let rounds: Array<{ criterion: string; winner: 'left' | 'right' | 'tie'; leftValue: string; rightValue: string }> = [];

  if (Array.isArray(rawRounds)) {
    rounds = rawRounds.map((r: any, idx: number) => {
      const criterion = coerceString(r.criterion || r.name || r.title || r.label, `Vòng ${idx + 1}`);
      const leftValue = coerceString(r.leftValue || r.left || r.c1 || r.val1, 'Thủ công');
      const rightValue = coerceString(r.rightValue || r.right || r.c2 || r.val2, 'Tự động');
      
      // Normalize winner per round
      let roundWinner: 'left' | 'right' | 'tie' = 'right';
      const rawW = String(r.winner || '').toLowerCase();
      if (rawW.includes('left') || rawW.includes('trái') || rawW.includes('1') || rawW === leftSubject.name.toLowerCase()) {
        roundWinner = 'left';
      } else if (rawW.includes('tie') || rawW.includes('hòa') || rawW.includes('equal')) {
        roundWinner = 'tie';
      } else {
        roundWinner = 'right';
      }

      return {
        criterion,
        winner: roundWinner,
        leftValue,
        rightValue,
      };
    });
  }

  if (rounds.length === 0) {
    rounds = curVs.rounds?.length
      ? curVs.rounds.map(r => ({
          criterion: coerceString(r.criterion, 'Tiêu chí'),
          winner: (r.winner || 'right') as 'left' | 'right' | 'tie',
          leftValue: coerceString(r.leftValue, ''),
          rightValue: coerceString(r.rightValue, ''),
        }))
      : [
          { criterion: '⚡ Tốc độ', winner: 'right', leftValue: '3 giờ', rightValue: '10 giây' },
          { criterion: '💰 Chi phí', winner: 'right', leftValue: '10 triệu', rightValue: '500k' },
          { criterion: '🎯 Hiệu quả', winner: 'right', leftValue: 'Khá', rightValue: 'Vượt trội' },
        ];
  }

  // Calculate or normalize overall winner
  let winner: 'left' | 'right' | 'tie' = 'right';
  const rawOverallWinner = String(source.winner || '').toLowerCase();
  if (rawOverallWinner.includes('left') || rawOverallWinner.includes('trái') || rawOverallWinner === leftSubject.name.toLowerCase()) {
    winner = 'left';
  } else if (rawOverallWinner.includes('tie') || rawOverallWinner.includes('hòa')) {
    winner = 'tie';
  } else if (rawOverallWinner.includes('right') || rawOverallWinner.includes('phải') || rawOverallWinner === rightSubject.name.toLowerCase()) {
    winner = 'right';
  } else {
    // Auto-tally rounds
    const rightWins = rounds.filter(r => r.winner === 'right').length;
    const leftWins = rounds.filter(r => r.winner === 'left').length;
    winner = rightWins > leftWins ? 'right' : leftWins > rightWins ? 'left' : 'tie';
  }

  const vsBattle = {
    leftSubject,
    rightSubject,
    rounds,
    winner,
    showWinner: source.showWinner !== undefined ? Boolean(source.showWinner) : true,
  };

  const patch = { vsBattle };
  const winnerName = winner === 'right' ? rightSubject.name : winner === 'left' ? leftSubject.name : 'Hòa điểm';

  return {
    patch,
    summary: `Đối đầu ${rounds.length} vòng: ${leftSubject.name} vs ${rightSubject.name} (Thắng: ${winnerName})`,
  };
}

/**
 * 3. FLOWCHART LAYER NORMALIZER
 * Target schema: { content: string, flowSteps: Array<{ title, subtitle, color, icon }> }
 */
function normalizeFlowchart(data: any, currentElement?: SceneElement): NormalizationResult {
  const unwrapped = unwrapAiResponse(data, 'flowSteps');
  const source = unwrapped;

  const content = coerceString(source.content || source.title || source.mainTitle, currentElement?.content || 'QUY TRÌNH THỰC HIỆN');
  const rawSteps = source.flowSteps || source.steps || source.items || [];

  const baseAccent = currentElement?.accentColor || '#BEFF01';
  const defaultColors = [baseAccent, `${baseAccent}CC`, '#F5F5F5', 'rgba(255,255,255,0.75)', `${baseAccent}99`];
  const defaultIcons = ['💡', '⚡', '🚀', '🎯', '✨'];

  let flowSteps: Array<{ title: string; subtitle: string; color: string; icon: string }> = [];

  if (Array.isArray(rawSteps)) {
    flowSteps = rawSteps.map((st: any, idx: number) => {
      if (typeof st === 'string') {
        const parts = st.split(/[:\-\–]/);
        return {
          title: coerceString(parts[0], `BƯỚC ${idx + 1}`),
          subtitle: coerceString(parts.slice(1).join(':'), ''),
          color: defaultColors[idx % defaultColors.length],
          icon: defaultIcons[idx % defaultIcons.length],
        };
      }
      return {
        title: coerceString(st.title || st.step || st.name || st.label, `BƯỚC ${idx + 1}`),
        subtitle: coerceString(st.subtitle || st.desc || st.description || st.subtext, ''),
        color: coerceString(st.color, defaultColors[idx % defaultColors.length]),
        icon: coerceString(st.icon, defaultIcons[idx % defaultIcons.length]),
      };
    });
  }

  if (flowSteps.length === 0) {
    flowSteps = currentElement?.flowSteps?.length
      ? currentElement.flowSteps.map((st, idx) => ({
          title: coerceString(st.title, `BƯỚC ${idx + 1}`),
          subtitle: coerceString(st.subtitle, ''),
          color: coerceString(st.color, defaultColors[idx % defaultColors.length]),
          icon: coerceString(st.icon, defaultIcons[idx % defaultIcons.length]),
        }))
      : [
          { title: 'BƯỚC 1: TIẾP NHẬN', subtitle: 'Phân tích yêu cầu & dữ liệu đầu vào', color: '#BEFF01', icon: '💡' },
          { title: 'BƯỚC 2: XỬ LÝ AI', subtitle: 'Truy xuất Vector DB & sinh nội dung', color: '#00D4FF', icon: '⚡' },
          { title: 'BƯỚC 3: XUẤT BẢN', subtitle: 'Hoàn thiện video & bàn giao', color: '#00FF88', icon: '🚀' },
        ];
  }

  return {
    patch: {
      content,
      flowSteps,
    },
    summary: `Quy trình ${flowSteps.length} bước: ${content}`,
  };
}

/**
 * 4. QUOTE BOX LAYER NORMALIZER
 * Target schema: { content: string, authorName: string }
 */
function normalizeQuoteBox(data: any, currentElement?: SceneElement): NormalizationResult {
  const unwrapped = unwrapAiResponse(data);
  const content = coerceString(
    unwrapped.content || unwrapped.quote || unwrapped.text || unwrapped.message,
    currentElement?.content || 'Người bình thường giải quyết hậu quả. Chuyên gia giải quyết nguyên nhân gốc rễ.'
  );

  const authorName = coerceString(
    unwrapped.authorName || unwrapped.author || unwrapped.speaker || unwrapped.source,
    currentElement?.authorName || 'Chiêm Nghiệm'
  );

  return {
    patch: {
      content,
      authorName,
    },
    summary: `Trích dẫn: "${content.slice(0, 32)}..." — ${authorName}`,
  };
}

/**
 * 5. CHECKLIST LAYER NORMALIZER
 * Target schema: { content, checklistData: { title, badge, style, tickAnimation, items }, checklistItems }
 */
function normalizeChecklist(data: any, currentElement?: SceneElement): NormalizationResult {
  const unwrapped = unwrapAiResponse(data, 'checklistData');
  const source = unwrapped.checklistData || unwrapped;

  const title = coerceString(source.title || source.content || unwrapped.content, currentElement?.content || 'DANH SÁCH QUY TẮC');
  const badge = coerceString(source.badge, 'QUY TẮC');
  const rawItems = source.items || source.checklistItems || unwrapped.checklistItems || [];

  let items: Array<{ text: string; subtext: string; status: 'checked' | 'cross' | 'warning' }> = [];

  if (Array.isArray(rawItems)) {
    items = rawItems.map((it: any, idx: number) => {
      if (typeof it === 'string') {
        return {
          text: coerceString(it),
          subtext: '',
          status: 'checked' as const,
        };
      }
      const text = coerceString(it.text || it.title || it.label, `Điều ${idx + 1}`);
      const subtext = coerceString(it.subtext || it.subtitle || it.desc, '');
      
      let status: 'checked' | 'cross' | 'warning' = 'checked';
      const rawStatus = String(it.status ?? it.checked ?? '').toLowerCase();
      if (['cross', 'false', 'fail', 'x', 'wrong', '0'].includes(rawStatus)) {
        status = 'cross';
      } else if (['warn', 'warning', 'caution', '!'].includes(rawStatus)) {
        status = 'warning';
      }

      return { text, subtext, status };
    });
  }

  if (items.length === 0) {
    items = [
      { text: 'Xác thực 2 lớp 2FA', subtext: 'Bảo vệ tài khoản tối đa', status: 'checked' },
      { text: 'Không click link lạ', subtext: 'Tránh mã độc tống tiền', status: 'checked' },
      { text: 'Dùng mật khẩu dễ đoán', subtext: 'Nguy cơ bị hack 99%', status: 'cross' },
    ];
  }

  const checklistData = {
    title,
    badge,
    style: (source.style || 'glass') as 'glass' | 'minimal' | 'audit' | 'cyber',
    tickAnimation: source.tickAnimation !== undefined ? Boolean(source.tickAnimation) : true,
    items,
  };

  return {
    patch: {
      content: title,
      checklistData,
      checklistItems: items.map(i => i.text),
    },
    summary: `Checklist ${items.length} mục: ${title}`,
  };
}

/**
 * 6. RANKING LIST LAYER NORMALIZER
 */
function normalizeRankingList(data: any, currentElement?: SceneElement): NormalizationResult {
  const unwrapped = unwrapAiResponse(data, 'rankingItems');
  const content = coerceString(unwrapped.content || unwrapped.title, currentElement?.content || 'TOP BẢNG XẾP HẠNG');
  const rawItems = unwrapped.rankingItems || unwrapped.items || [];

  const defaultColors = ['#FFD700', '#C0C0C0', '#CD7F32', '#00D4FF', '#BEFF01'];

  let rankingItems: Array<{ rank: number; name: string; score: string; badge: string; color: string }> = [];

  if (Array.isArray(rawItems)) {
    rankingItems = rawItems.map((it: any, idx: number) => ({
      rank: typeof it.rank === 'number' ? it.rank : idx + 1,
      name: coerceString(it.name || it.title || it.label, `Top ${idx + 1}`),
      score: coerceString(it.score || it.value || it.stat, '100%'),
      badge: coerceString(it.badge, idx === 0 ? 'Quán Quân' : idx === 1 ? 'Á Quân' : ''),
      color: coerceString(it.color, defaultColors[idx % defaultColors.length]),
    }));
  }

  if (rankingItems.length === 0) {
    rankingItems = [
      { rank: 1, name: 'Công Cụ AI Tối Ưu Nhất', score: '98%', badge: 'Quán Quân', color: '#FFD700' },
      { rank: 2, name: 'Giải Pháp Đứng Thứ Hai', score: '85%', badge: 'Á Quân', color: '#C0C0C0' },
      { rank: 3, name: 'Quy Trình Thủ Công Cũ', score: '42%', badge: '', color: '#CD7F32' },
    ];
  }

  return {
    patch: {
      content,
      rankingItems,
    },
    summary: `Bảng xếp hạng ${rankingItems.length} hạng mục: ${content}`,
  };
}

/**
 * 7. NUMERICAL DATA CHARTS (chart-bar, line-chart, pie-chart, radar-chart)
 */
function normalizeDataChart(data: any, elementType: string, currentElement?: SceneElement): NormalizationResult {
  const unwrapped = unwrapAiResponse(data, 'chartData');
  const rawData = unwrapped.chartData || unwrapped.data || unwrapped.items || (Array.isArray(unwrapped) ? unwrapped : []);

  const baseAccent = currentElement?.accentColor || '#BEFF01';
  const defaultColors = [baseAccent, '#F5F5F5', `${baseAccent}BB`, 'rgba(255,255,255,0.7)', `${baseAccent}77`, 'rgba(255,255,255,0.45)'];

  let chartData: Array<{ label: string; value: number; color?: string; unit?: string }> = [];

  if (Array.isArray(rawData)) {
    chartData = rawData.map((it: any, idx: number) => {
      const label = coerceString(it.label || it.name || it.title || it.key, `Mục ${idx + 1}`);
      const rawVal = it.value ?? it.val ?? it.amount ?? it.percent ?? 0;
      const numVal = coerceNumber(rawVal, 50);

      // Detect unit if embedded in string
      let unit = coerceString(it.unit);
      if (!unit && typeof rawVal === 'string') {
        if (rawVal.includes('%')) unit = '%';
        else if (rawVal.includes('$')) unit = '$';
        else if (rawVal.includes('đ') || rawVal.includes('k')) unit = 'đ';
      }

      return {
        label,
        value: numVal,
        color: coerceString(it.color, defaultColors[idx % defaultColors.length]),
        unit: unit || undefined,
      };
    });
  }

  if (chartData.length === 0) {
    chartData = currentElement?.chartData || [
      { label: 'Nhóm A', value: 85, color: '#BEFF01', unit: '%' },
      { label: 'Nhóm B', value: 45, color: '#00D4FF', unit: '%' },
    ];
  }

  return {
    patch: { chartData },
    summary: `Biểu đồ ${chartData.length} cột/điểm dữ liệu`,
  };
}

/**
 * 8. CANDLESTICK CHART
 */
function normalizeCandlestick(data: any, currentElement?: SceneElement): NormalizationResult {
  const unwrapped = unwrapAiResponse(data, 'candlestickData');
  const source = unwrapped.candlestickData || unwrapped;

  const symbol = coerceString(source.symbol, currentElement?.candlestickData?.symbol || 'BTC / USDT');
  const currentPrice = coerceString(source.currentPrice, currentElement?.candlestickData?.currentPrice || '$98,450');
  const changePct = coerceString(source.changePct, currentElement?.candlestickData?.changePct || '+8.45%');

  const rawCandles = source.candles || source.data || [];
  let candles: any[] = [];

  if (Array.isArray(rawCandles)) {
    candles = rawCandles.map((c: any, idx: number) => ({
      open: coerceNumber(c.open || c.o, 90000),
      high: coerceNumber(c.high || c.h, 95000),
      low: coerceNumber(c.low || c.l, 89000),
      close: coerceNumber(c.close || c.c, 94000),
      label: coerceString(c.label || c.time, `${idx + 1}h`),
    }));
  }

  if (candles.length === 0) {
    candles = currentElement?.candlestickData?.candles || [
      { open: 92000, high: 94000, low: 91500, close: 93800, label: '09:00' },
      { open: 93800, high: 97000, low: 93200, close: 96500, label: '15:00' },
      { open: 96500, high: 99000, low: 95800, close: 98450, label: 'Live' },
    ];
  }

  return {
    patch: {
      candlestickData: {
        symbol,
        currentPrice,
        changePct,
        candles,
      },
    },
    summary: `Biểu đồ nến: ${symbol} (${currentPrice}, ${changePct})`,
  };
}

/**
 * 9. STEM MODULES NORMALIZER
 */
function normalizeStem(elementType: string, data: any, currentElement?: SceneElement): NormalizationResult {
  const unwrapped = unwrapAiResponse(data);

  if (elementType === 'math-plot') {
    const source = unwrapped.mathData || unwrapped;
    const mathData = {
      title: coerceString(source.title, currentElement?.mathData?.title || 'Đồ Thị Hàm Số'),
      latexLabel: coerceString(source.latexLabel, currentElement?.mathData?.latexLabel || 'y = f(x)'),
      expression: coerceString(source.expression, currentElement?.mathData?.expression || ''),
      domainX: Array.isArray(source.domainX) ? source.domainX.map((n: any) => coerceNumber(n)) : [-5, 5],
      domainY: Array.isArray(source.domainY) ? source.domainY.map((n: any) => coerceNumber(n)) : [-3, 3],
      color: source.color || currentElement?.mathData?.color || '#BEFF01',
      lineWidth: coerceNumber(source.lineWidth, 3.5),
      showGrid: source.showGrid !== undefined ? Boolean(source.showGrid) : true,
      showAxes: source.showAxes !== undefined ? Boolean(source.showAxes) : true,
      animateSpeed: coerceNumber(source.animateSpeed, 1.0),
    };
    // Đồ thị sai không được áp vào cảnh: báo lỗi để người dùng bấm tạo lại
    const check = validatePlotData(mathData);
    if (!check.ok) throw new Error(`Đồ thị AI tạo không hợp lệ (${check.errors[0]}). Hãy bấm tạo lại.`);
    return {
      patch: { mathData },
      summary: `Đồ thị: ${mathData.title} (${mathData.latexLabel || mathData.expression})`,
    };
  }

  if (elementType === 'chemical-molecule') {
    // Server đã thay SMILES/công thức bằng dữ liệu PubChem (tra theo tên tiếng Anh `name`)
    const source = unwrapped.chemData || unwrapped;
    const chemData = {
      name: coerceString(source.displayName || source.name, currentElement?.chemData?.name || ''),
      lookupName: coerceString(source.name, ''),
      formula: coerceString(source.formula, ''),
      smiles: coerceString(source.smiles, ''),
      pubchemCid: Number.isInteger(source.pubchemCid) ? source.pubchemCid : undefined,
      theme: source.theme || currentElement?.chemData?.theme || 'neon',
      bondThickness: coerceNumber(source.bondThickness, 2.2),
      subtext: coerceString(source.subtext, ''),
    };
    const check = validateChemData(chemData);
    if (!check.ok) throw new Error(`${check.errors[0]} (“${chemData.lookupName || chemData.name}”). Hãy bấm tạo lại.`);
    return {
      patch: { chemData },
      summary: `Phân tử: ${chemData.name} (${chemData.formula})`,
    };
  }

  if (elementType === 'latex-formula') {
    const source = unwrapped.latexData || unwrapped;
    const latexData = {
      title: coerceString(source.title, currentElement?.latexData?.title || 'Công Thức Toán'),
      latex: normalizeLatex(coerceString(source.latex, '')),
      fontSize: coerceNumber(source.fontSize, 28),
      color: source.color || '#ffffff',
      glow: source.glow !== undefined ? Boolean(source.glow) : true,
      showBackground: source.showBackground !== undefined ? Boolean(source.showBackground) : true,
    };
    const check = validateLatex(latexData.latex);
    if (!check.ok) throw new Error(`${check.error}. Hãy bấm tạo lại.`);
    return {
      patch: { latexData },
      summary: `Công thức: ${latexData.title}`,
    };
  }

  if (elementType === 'interactive-quiz') {
    const source = unwrapped.quizData || unwrapped;
    let options = Array.isArray(source.options) ? source.options.map((o: any, idx: number) => {
      if (typeof o === 'string') {
        const id = String.fromCharCode(65 + idx);
        return { id, text: o };
      }
      return { id: coerceString(o.id, String.fromCharCode(65 + idx)), text: coerceString(o.text) };
    }) : [
      { id: 'A', text: 'Lựa chọn A' },
      { id: 'B', text: 'Lựa chọn B' },
      { id: 'C', text: 'Lựa chọn C' },
      { id: 'D', text: 'Lựa chọn D' },
    ];

    let correctAnswers = coerceArray<string>(source.correctAnswers || source.correctAnswer || ['A']);

    const quizData = {
      quizType: 'single-choice',
      badge: coerceString(source.badge, 'THỬ THÁCH 5S'),
      question: coerceString(source.question, 'Câu hỏi trắc nghiệm'),
      options,
      correctAnswers,
      countdownSec: coerceNumber(source.countdownSec, 5),
      introSec: coerceNumber(source.introSec, 3),
      revealSec: coerceNumber(source.revealSec, 4),
      explanation: coerceString(source.explanation, ''),
      showExplanation: true,
    };
    return {
      patch: { quizData },
      summary: `Trắc nghiệm: ${quizData.question.slice(0, 32)}...`,
    };
  }

  if (elementType === 'vocab-card') {
    const source = unwrapped.vocabData || unwrapped;
    const vocabData = {
      word: coerceString(source.word, currentElement?.vocabData?.word || 'ESSENTIAL'),
      partOfSpeech: coerceString(source.partOfSpeech, 'adj'),
      ipa: coerceString(source.ipa, '/ɪˈsen.ʃəl/'),
      audioAccent: coerceString(source.audioAccent, 'UK'),
      cefrLevel: coerceString(source.cefrLevel, 'IELTS 7.0+'),
      meaningVi: coerceString(source.meaningVi, 'Thiết yếu, quan trọng'),
      meaningEn: coerceString(source.meaningEn, 'Completely necessary'),
      exampleEn: coerceString(source.exampleEn, 'It is essential to stay focused.'),
      exampleVi: coerceString(source.exampleVi, 'Điều thiết yếu là giữ tập trung.'),
      highlightWord: coerceString(source.highlightWord, 'essential'),
      synonyms: coerceArray<string>(source.synonyms || ['Crucial', 'Vital']),
      cardStyle: source.cardStyle || 'glass-modern',
    };
    return {
      patch: { vocabData },
      summary: `Từ vựng: ${vocabData.word} (${vocabData.ipa || vocabData.meaningVi})`,
    };
  }

  return { patch: {}, summary: 'Đã sinh dữ liệu hoàn tất' };
}

/**
 * 12. KNOWLEDGE GRAPH NORMALIZER
 * Target schema: { knowledgeGraphData: KnowledgeGraphData }
 */
function normalizeKnowledgeGraph(data: any, currentElement?: SceneElement): NormalizationResult {
  const unwrapped = unwrapAiResponse(data, 'knowledgeGraphData');
  const source = unwrapped.knowledgeGraphData || unwrapped;

  const title = coerceString(
    source.title || source.name || source.lessonTitle || 'Cây tri thức bài giảng'
  );
  const layout = ['cascade', 'spine', 'orbit'].includes(source.layout)
    ? source.layout
    : 'cascade';
  const theme = source.theme || 'obsidian-dark';

  const baseAccent = currentElement?.accentColor || '#BEFF01';
  const palette = [baseAccent, '#F5F5F5', `${baseAccent}CC`, 'rgba(255,255,255,0.75)', `${baseAccent}88`, 'rgba(255,255,255,0.5)', `${baseAccent}44`];
  const defaultIcons = ['🌱', '🧬', '⚛️', '⚡', '📐', '🔬', '💡', '🏛️', '⚔️', '📖', '🎯', '⚖️'];

  // 1. Flatten nested tree or list
  const rawNodes = source.nodes || source.branches || source.items || source.tree || [];
  const flattened: any[] = [];

  const traverse = (nodeItem: any, defaultTier: 0 | 1 | 2 = 1, inheritedParentId?: string) => {
    if (!nodeItem || typeof nodeItem !== 'object') return;
    const rawId = coerceString(nodeItem.id);
    const id = rawId || `n_${Date.now().toString().slice(-4)}_${Math.random().toString(36).slice(2, 5)}`;
    const tier = (nodeItem.tier === 0 || nodeItem.tier === 1 || nodeItem.tier === 2)
      ? nodeItem.tier
      : defaultTier;
    const parentId = nodeItem.parentId || inheritedParentId;

    flattened.push({
      ...nodeItem,
      id,
      tier,
      parentId,
    });

    const children = nodeItem.children || nodeItem.subNodes || nodeItem.subBranches || [];
    if (Array.isArray(children)) {
      children.forEach((child: any) => traverse(child, 2, id));
    }
  };

  if (Array.isArray(rawNodes)) {
    rawNodes.forEach((n: any, idx: number) => {
      traverse(n, idx === 0 ? 0 : 1);
    });
  }

  // 2. Ensure exactly one Root Node (Tier 0)
  let rootNode = flattened.find(n => n.tier === 0);
  if (!rootNode && flattened.length > 0) {
    rootNode = flattened[0];
    rootNode.tier = 0;
    rootNode.parentId = undefined;
  } else if (!rootNode) {
    rootNode = {
      id: 'root',
      label: title,
      subLabel: 'Bài học trọng tâm',
      tier: 0,
      color: baseAccent,
      icon: '🌱',
      insight: `Tổng quan bài học về ${title}, hệ thống hóa các kiến thức cốt lõi.`,
    };
    flattened.unshift(rootNode);
  }

  const rootId = rootNode.id || 'root';
  rootNode.id = rootId;
  rootNode.tier = 0;
  rootNode.parentId = undefined;

  // 3. Multi-stage Self-Healing Parent-Child Hierarchy
  const nonRootNodes = flattened.filter(n => n !== rootNode && n.id !== rootId);
  const validTier1Ids = new Set<string>();

  // Pass 3.1: Validate and register Tier 1 nodes
  nonRootNodes.forEach(n => {
    if (n.tier === 0) n.tier = 1;
    if (n.tier === 1) {
      n.parentId = rootId;
      validTier1Ids.add(n.id);
    }
  });

  // Guarantee at least 1 Tier 1 node if nodes exist
  if (validTier1Ids.size === 0 && nonRootNodes.length > 0) {
    nonRootNodes[0].tier = 1;
    nonRootNodes[0].parentId = rootId;
    validTier1Ids.add(nonRootNodes[0].id);
  }

  // Pass 3.2: Self-heal Tier 2 nodes (Heal phantom IDs, root pointing, or orphaned nodes)
  let lastSeenTier1Id: string = Array.from(validTier1Ids)[0] || rootId;

  nonRootNodes.forEach(n => {
    if (n.tier === 1) {
      lastSeenTier1Id = n.id;
      return;
    }

    if (n.tier === 2) {
      const hasValidParent = n.parentId && n.parentId !== rootId && validTier1Ids.has(n.parentId);
      if (!hasValidParent) {
        // Auto-heal: attach to the closest preceding Tier 1 branch!
        n.parentId = lastSeenTier1Id;
      }
    }
  });

  // 4. Topological Tree Sorter: Group Tier 2 children immediately under their Tier 1 parent
  const orderedNodes: any[] = [rootNode];
  const tier1List = nonRootNodes.filter(n => n.tier === 1);
  const tier2List = nonRootNodes.filter(n => n.tier === 2);

  tier1List.forEach(t1 => {
    orderedNodes.push(t1);
    const children = tier2List.filter(t2 => t2.parentId === t1.id);
    children.forEach(c => orderedNodes.push(c));
  });

  // Safety append for any leftover nodes
  const addedIds = new Set(orderedNodes.map(n => n.id));
  nonRootNodes.forEach(n => {
    if (!addedIds.has(n.id)) {
      n.tier = 2;
      n.parentId = lastSeenTier1Id;
      orderedNodes.push(n);
      addedIds.add(n.id);
    }
  });

  // 5. Final Sanitation & Pedagogical Enrichment
  const finalNodes = orderedNodes.map((n, idx) => {
    const isRoot = n.id === rootId || n.tier === 0;
    const rawLabel = coerceString(n.label || n.title || n.name, isRoot ? title : `Nhánh ${idx}`);
    // Clean up unnecessary leading number patterns like "1. ", "2. " to keep labels punchy
    const label = rawLabel.replace(/^(\d+[\.\-\)]\s*)/, '');

    const subLabel = coerceString(n.subLabel || n.subtitle || n.badge || '');
    const color = coerceString(n.color, isRoot ? baseAccent : palette[idx % palette.length]);
    const icon = coerceString(n.icon, defaultIcons[idx % defaultIcons.length]);

    // Ensure rich, pedagogical insight (at least 15-25 words)
    let insight = coerceString(n.insight || n.explanation || n.description);
    if (!insight || insight.length < 15) {
      if (isRoot) {
        insight = `Tổng quan bài giảng về ${label}, hệ thống hóa các kiến thức cốt lõi và mối liên hệ bản chất.`;
      } else if (n.tier === 1) {
        insight = `${label} là nhánh trọng tâm của bài học, đóng vai trò nền tảng trong việc giải quyết vấn đề.`;
      } else {
        insight = `${label} là ý nghĩa bổ trợ then chốt, minh họa chi tiết cho nhánh chính với ví dụ thực tiễn.`;
      }
    }

    return {
      id: n.id,
      label: label || rawLabel,
      subLabel,
      tier: (isRoot ? 0 : (n.tier === 2 ? 2 : 1)) as 0 | 1 | 2,
      parentId: isRoot ? undefined : n.parentId,
      color,
      icon,
      insight,
    };
  });

  const activeNodeId = source.activeNodeId && finalNodes.some(n => n.id === source.activeNodeId)
    ? source.activeNodeId
    : (finalNodes.find(n => n.tier === 1)?.id || finalNodes[0]?.id);

  const knowledgeGraphData = {
    title,
    layout,
    theme,
    nodes: finalNodes,
    activeNodeId,
    showParticles: source.showParticles !== false,
    autoBloom: true,
  };

  return {
    patch: { knowledgeGraphData },
    summary: `Đã chuẩn hóa sơ đồ tư duy: "${title}" (${finalNodes.length} nút, layout ${layout}) với cấu trúc phân cấp tự nắn chỉnh an toàn 100%.`,
  };
}

// ── MAIN DISPATCHER & HEIGHT SYNC ────────────────────────────────────────────

const DYNAMIC_BOX_MODEL_TYPES = [
  'table',
  'vs-battle',
  'flowchart',
  'quote-box',
  'checklist',
  'ranking-list',
  'timeline',
  'highlight-box',
];

/**
 * Normalizes raw AI responses into canonical, type-safe patches that adhere to
 * Remotion Component prop contracts and the 3-Point Dynamic Box-Model Contract.
 */
export function normalizeMagicFillPayload(
  elementType: string,
  rawAiData: any,
  currentElement?: SceneElement
): NormalizationResult {
  if (!rawAiData || typeof rawAiData !== 'object') {
    const fallbackPayload = ELEMENTS_REGISTRY[elementType]?.ui?.defaultPayload || {};
    return {
      patch: { ...fallbackPayload },
      summary: 'Khôi phục dữ liệu mặc định',
    };
  }

  let result: NormalizationResult;

  switch (elementType) {
    case 'table':
      result = normalizeTable(rawAiData, currentElement);
      break;

    case 'vs-battle':
      result = normalizeVsBattle(rawAiData, currentElement);
      break;

    case 'flowchart':
      result = normalizeFlowchart(rawAiData, currentElement);
      break;

    case 'quote-box':
      result = normalizeQuoteBox(rawAiData, currentElement);
      break;

    case 'checklist':
      result = normalizeChecklist(rawAiData, currentElement);
      break;

    case 'ranking-list':
      result = normalizeRankingList(rawAiData, currentElement);
      break;

    case 'chart-bar':
    case 'line-chart':
    case 'pie-chart':
    case 'radar-chart':
      result = normalizeDataChart(rawAiData, elementType, currentElement);
      break;

    case 'candlestick-chart':
      result = normalizeCandlestick(rawAiData, currentElement);
      break;

    case 'math-plot':
    case 'chemical-molecule':
    case 'latex-formula':
    case 'interactive-quiz':
    case 'vocab-card':
      result = normalizeStem(elementType, rawAiData, currentElement);
      break;

    case 'knowledge-graph':
      result = normalizeKnowledgeGraph(rawAiData, currentElement);
      break;

    default: {
      // General fallthrough: match defaultPayload key or unwrap
      const defaultPayload = ELEMENTS_REGISTRY[elementType]?.ui?.defaultPayload;
      const detectedKey = defaultPayload ? Object.keys(defaultPayload)[0] : null;
      const unwrapped = unwrapAiResponse(rawAiData, detectedKey || undefined);

      let patch: Record<string, any> = {};

      if (detectedKey && unwrapped[detectedKey]) {
        patch = { [detectedKey]: unwrapped[detectedKey] };
      } else if (detectedKey) {
        patch = { [detectedKey]: unwrapped };
      } else {
        // Clean layout metadata
        const clean: Record<string, any> = {};
        for (const [k, v] of Object.entries(unwrapped)) {
          if (!['type', 'left', 'top', 'width', 'height', 'scaleX', 'scaleY', 'angle', 'opacity', 'animPreset', 'animDuration', 'animDelay', '_provider'].includes(k)) {
            clean[k] = v;
          }
        }
        patch = clean;
      }

      result = {
        patch,
        summary: unwrapped.title ? `Tiêu đề: ${unwrapped.title}` : 'Đã cập nhật dữ liệu AI',
      };
      break;
    }
  }

  // 📐 3-Point Dynamic Box Model Contract H = f(X):
  // Automatically calculate real-world bounding height matching Remotion canvas
  if (DYNAMIC_BOX_MODEL_TYPES.includes(elementType)) {
    const mockEl = {
      ...(currentElement || { type: elementType, id: 'temp', left: 0, top: 0, width: 330, height: 200, scaleX: 1, scaleY: 1, angle: 0, opacity: 1 }),
      ...result.patch,
      type: elementType,
    };
    const dynamicH = calculateElementDynamicHeight(mockEl);
    if (dynamicH && dynamicH > 0) {
      result.patch.height = dynamicH;
    }
  }

  return result;
}
