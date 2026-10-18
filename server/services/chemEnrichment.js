import { resolveCompound } from './pubchemService.js';

/**
 * Thay SMILES / công thức do AI viết bằng dữ liệu PubChem tra theo `name` (tên tiếng Anh / IUPAC).
 * Không tìm thấy hoặc PubChem lỗi → xoá hẳn để cổng kiểm tra ở client chặn (không vẽ phân tử sai).
 * @param {Record<string, any> | undefined} data slots hoặc chemData
 */
export async function enrichChemData(data) {
  const base = { ...(data || {}) };
  delete base.smiles;
  delete base.formula;
  delete base.pubchemCid;

  const lookup = String(base.name || base.lookupName || '').trim();
  if (!lookup) return base;
  try {
    const compound = await resolveCompound(lookup);
    if (!compound) return base;
    return { ...base, smiles: compound.smiles, formula: compound.formula, pubchemCid: compound.cid };
  } catch (err) {
    console.warn('[chemEnrichment] PubChem lookup failed:', lookup, err?.message || err);
    return base;
  }
}

/** Áp enrichChemData cho mọi cảnh phân tử trong envelope (các lần tra chạy song song, đã giãn cách trong service) */
export async function enrichChemScenes(scenes) {
  if (!Array.isArray(scenes)) return scenes;
  return Promise.all(
    scenes.map(async (scene) =>
      scene?.widgetType === 'chemical-molecule' ? { ...scene, slots: await enrichChemData(scene.slots) } : scene
    )
  );
}
