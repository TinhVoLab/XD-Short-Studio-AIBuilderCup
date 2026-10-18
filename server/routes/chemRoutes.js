import { Router } from 'express';
import { resolveCompound, normalizeChemName } from '../services/pubchemService.js';

const router = Router();

/**
 * Tra phân tử theo tên (tiếng Anh / IUPAC) → SMILES + công thức chuẩn của PubChem.
 * 200 { found: true, compound } | 404 { found: false } | 502 khi PubChem lỗi (không cache).
 */
router.get('/resolve', async (req, res) => {
  const name = normalizeChemName(req.query.name);
  if (!name) return res.status(400).json({ error: 'Thiếu tên chất' });

  try {
    const compound = await resolveCompound(name);
    if (!compound) return res.status(404).json({ found: false, name });
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.json({ found: true, name, compound });
  } catch (err) {
    console.error('[chemRoutes] PubChem lookup failed:', err?.message || err);
    return res.status(502).json({ error: 'Không tra được PubChem, thử lại sau' });
  }
});

export default router;
