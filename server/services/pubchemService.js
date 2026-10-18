import crypto from 'crypto';
import { adminDb } from '../middlewares/auth.js';

/**
 * Tra cấu trúc phân tử chuẩn từ PubChem PUG REST theo TÊN CHẤT (tiếng Anh / IUPAC).
 * AI không tự viết SMILES hay công thức — hai giá trị lấy từ cùng một hợp chất (CID) nên luôn khớp nhau.
 *
 * Cache 2 tầng: bộ nhớ (kể cả "không tìm thấy", 1 giờ) + Firestore `chem_cache` (chỉ kết quả tìm thấy).
 * PubChem giới hạn ~5 yêu cầu/giây → giãn cách mỗi lần gọi ≥ 220 ms, gộp các yêu cầu trùng tên.
 */

const PUG_BASE = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name';
// Khoá mới (2025): SMILES / ConnectivitySMILES; khoá cũ để đọc cache hoặc phản hồi cũ
const PROPERTIES = 'SMILES,ConnectivitySMILES,MolecularFormula,Title';
const SMILES_KEYS = ['SMILES', 'ConnectivitySMILES', 'IsomericSMILES', 'CanonicalSMILES'];
const REQUEST_TIMEOUT_MS = 8000;
const MIN_GAP_MS = 220;
const NEGATIVE_TTL_MS = 60 * 60 * 1000;
const CACHE_COLLECTION = 'chem_cache';
const MAX_NAME_LENGTH = 120;

const memory = new Map(); // key -> { value, expiresAt }
const inFlight = new Map(); // key -> Promise
let lastRequestAt = 0;
let queue = Promise.resolve();

/** Chuẩn hoá tên để làm khoá cache: chữ thường, gọn khoảng trắng */
export function normalizeChemName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ').toLowerCase().slice(0, MAX_NAME_LENGTH);
}

const cacheKey = (normalized) => crypto.createHash('sha1').update(normalized).digest('hex');

/** Hàng đợi giãn cách để không vượt giới hạn tốc độ của PubChem */
function throttled(task) {
  const run = queue.then(async () => {
    const wait = lastRequestAt + MIN_GAP_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequestAt = Date.now();
    return task();
  });
  queue = run.catch(() => undefined);
  return run;
}

/** Phản hồi PubChem → hợp chất; null nếu thiếu SMILES hoặc công thức */
export function parsePubchemProperties(json) {
  const p = json?.PropertyTable?.Properties?.[0];
  if (!p) return null;
  const smiles = SMILES_KEYS.map((k) => p[k]).find((v) => typeof v === 'string' && v.trim());
  if (!smiles || !p.MolecularFormula) return null;
  return {
    cid: p.CID,
    smiles: smiles.trim(),
    formula: String(p.MolecularFormula),
    title: p.Title || '',
  };
}

async function fetchFromPubchem(name) {
  const url = `${PUG_BASE}/${encodeURIComponent(name)}/property/${PROPERTIES}/JSON`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await throttled(() => fetch(url, { signal: controller.signal }));
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`PubChem trả về HTTP ${res.status}`);
    return parsePubchemProperties(await res.json());
  } finally {
    clearTimeout(timer);
  }
}

async function readFirestore(key) {
  if (!adminDb) return undefined;
  try {
    const snap = await adminDb.collection(CACHE_COLLECTION).doc(key).get();
    return snap.exists ? snap.data().compound : undefined;
  } catch {
    return undefined;
  }
}

async function writeFirestore(key, normalized, compound) {
  if (!adminDb) return;
  try {
    await adminDb.collection(CACHE_COLLECTION).doc(key).set({ name: normalized, compound, cachedAt: new Date() });
  } catch {
    // Cache là phụ: lỗi ghi không ảnh hưởng kết quả
  }
}

/**
 * @param {string} name tên tiếng Anh hoặc IUPAC
 * @returns {Promise<{ cid: number, smiles: string, formula: string, title: string } | null>} null = không có trên PubChem
 */
export async function resolveCompound(name) {
  const normalized = normalizeChemName(name);
  if (!normalized) return null;
  const key = cacheKey(normalized);

  const hit = memory.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value;
  if (inFlight.has(key)) return inFlight.get(key);

  const task = (async () => {
    const stored = await readFirestore(key);
    if (stored) {
      memory.set(key, { value: stored, expiresAt: Infinity });
      return stored;
    }
    const compound = await fetchFromPubchem(normalized);
    memory.set(key, { value: compound, expiresAt: compound ? Infinity : Date.now() + NEGATIVE_TTL_MS });
    if (compound) await writeFirestore(key, normalized, compound);
    return compound;
  })();

  inFlight.set(key, task);
  try {
    return await task;
  } finally {
    inFlight.delete(key);
  }
}
