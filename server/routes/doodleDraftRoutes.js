import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
const DRAFTS_FILE = path.resolve('data/doodle-drafts.json');

// Đảm bảo file json tồn tại
function ensureDataDir() {
  const dir = path.dirname(DRAFTS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readDrafts() {
  try {
    ensureDataDir();
    if (!fs.existsSync(DRAFTS_FILE)) {
      fs.writeFileSync(DRAFTS_FILE, JSON.stringify([], null, 2), 'utf8');
      return [];
    }
    const raw = fs.readFileSync(DRAFTS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('[DoodleDrafts] Error reading drafts file:', err.message);
    return [];
  }
}

function writeDrafts(drafts) {
  try {
    ensureDataDir();
    fs.writeFileSync(DRAFTS_FILE, JSON.stringify(drafts, null, 2), 'utf8');
  } catch (err) {
    console.error('[DoodleDrafts] Error writing drafts file:', err.message);
  }
}

// ── 1. Client Endpoint: Lưu draft được sinh tự động bởi Parametric Generator ──
router.post('/', (req, res) => {
  try {
    const { draft, visualMetaphor, createdAt } = req.body;
    if (!draft || !draft.id || !draft.pathD) {
      return res.status(400).json({ success: false, error: 'Invalid draft payload' });
    }

    const drafts = readDrafts();

    // Giới hạn tối đa 500 drafts gần nhất để tránh phình to ổ đĩa
    const newEntry = {
      id: draft.id,
      name: draft.name || 'Doodle Tham Số Mới',
      category: draft.category || 'shapes',
      pathD: draft.pathD,
      viewBox: draft.viewBox || '0 0 160 160',
      dna: draft.dna,
      visualMetaphor: visualMetaphor || '',
      status: 'pending', // 'pending' | 'approved' | 'rejected'
      createdAt: createdAt || new Date().toISOString(),
    };

    // Đẩy lên đầu danh sách
    drafts.unshift(newEntry);
    if (drafts.length > 500) drafts.pop();

    writeDrafts(drafts);
    res.json({ success: true, message: 'Draft saved successfully', draftId: newEntry.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── 2. Admin Endpoint: Lấy danh sách drafts đang chờ duyệt ──
router.get('/', (req, res) => {
  try {
    const drafts = readDrafts();
    const status = req.query.status;
    const filtered = status ? drafts.filter((d) => d.status === status) : drafts;
    res.json({ success: true, count: filtered.length, drafts: filtered });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── 3. Admin Endpoint: Duyệt draft vào Catalog chính thức ──
router.post('/:id/approve', (req, res) => {
  try {
    const { id } = req.params;
    const drafts = readDrafts();
    const target = drafts.find((d) => d.id === id);

    if (!target) {
      return res.status(404).json({ success: false, error: 'Draft not found' });
    }

    target.status = 'approved';
    target.approvedAt = new Date().toISOString();
    writeDrafts(drafts);

    res.json({ success: true, message: 'Draft approved', draft: target });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── 4. Admin Endpoint: Từ chối draft ──
router.post('/:id/reject', (req, res) => {
  try {
    const { id } = req.params;
    const drafts = readDrafts();
    const target = drafts.find((d) => d.id === id);

    if (!target) {
      return res.status(404).json({ success: false, error: 'Draft not found' });
    }

    target.status = 'rejected';
    target.rejectedAt = new Date().toISOString();
    writeDrafts(drafts);

    res.json({ success: true, message: 'Draft marked as rejected' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
