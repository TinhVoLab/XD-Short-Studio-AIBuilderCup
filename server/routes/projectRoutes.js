import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import util from 'util';
import { projectsStorageDir } from '../config/paths.js';

const execFilePromise = util.promisify(execFile);
const router = Router();

/**
 * Tạo slug an toàn cho tên thư mục dự án (chữ thường, không dấu, không ký tự đặc biệt)
 */
function sanitizeFolderName(title, customName) {
  const raw = customName || title || 'du-an-moi';
  let slug = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);

  if (!slug) slug = 'project';
  return slug;
}

// 1. GET /api/projects - Liệt kê tất cả dự án từ ổ cứng
router.get('/', (req, res) => {
  try {
    if (!fs.existsSync(projectsStorageDir)) {
      return res.json([]);
    }

    const entries = fs.readdirSync(projectsStorageDir, { withFileTypes: true });
    const projects = [];
    const seenIds = new Set();

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

      const projectFilePath = path.join(projectsStorageDir, entry.name, 'project.json');
      if (fs.existsSync(projectFilePath)) {
        try {
          const raw = fs.readFileSync(projectFilePath, 'utf-8');
          const data = JSON.parse(raw);
          const dur = (data.scenes || []).reduce((acc, sc) => acc + (sc.duration || 0), 0);
          const firstSc = data.scenes?.[0];
          const firstText = firstSc?.elements?.find(e => e.type === "text")?.content || firstSc?.name || "";

          let projId = data.id || `proj_${entry.name}`;
          // Bảo vệ chống trùng lặp key (ví dụ nhiều dự án copy cùng có id: proj_default)
          if (seenIds.has(projId)) {
            projId = `proj_${entry.name}`;
            if (seenIds.has(projId)) {
              projId = `${projId}_${Math.random().toString(36).slice(2, 6)}`;
            }
          }
          seenIds.add(projId);

          projects.push({
            id: projId,
            folderName: entry.name,
            title: data.title || data.projectName || entry.name,
            createdAt: data.createdAt || Date.now(),
            updatedAt: data.updatedAt || Date.now(),
            sceneCount: data.scenes?.length || 0,
            durationSec: dur,
            videoFormat: data.videoFormat || '9:16',
            firstSceneText: firstText,
            firstSceneBg: firstSc?.bgColor || '#0C0E12',
            tags: data.tags || []
          });
        } catch (readErr) {
          console.warn(`[Projects API] Error reading project in ${entry.name}:`, readErr.message);
        }
      }
    }

    projects.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    res.json(projects);
  } catch (err) {
    console.error('[Projects API] List error:', err);
    res.status(500).json({ error: 'Không thể liệt kê danh sách dự án trên ổ cứng' });
  }
});

// 2. GET /api/projects/:folderName - Đọc chi tiết file project.json từ ổ cứng
router.get('/:folderName', (req, res) => {
  try {
    const folderName = path.basename(req.params.folderName);
    const projectFilePath = path.join(projectsStorageDir, folderName, 'project.json');

    if (!fs.existsSync(projectFilePath)) {
      return res.status(404).json({ error: 'Không tìm thấy dự án trên ổ đĩa' });
    }

    const data = JSON.parse(fs.readFileSync(projectFilePath, 'utf-8'));
    data.folderName = folderName;
    res.json(data);
  } catch (err) {
    console.error('[Projects API] Load error:', err);
    res.status(500).json({ error: 'Lỗi khi đọc tệp dự án' });
  }
});

// 3. POST /api/projects/save - Lưu hoặc cập nhật dự án vào thư mục riêng biệt
router.post('/save', (req, res) => {
  try {
    const { project, customFolderName } = req.body;
    if (!project || !Array.isArray(project.scenes)) {
      return res.status(400).json({ error: 'Dữ liệu dự án không hợp lệ' });
    }

    // Xác định tên thư mục (ưu tiên customFolderName -> folderName sẵn có -> tự sinh từ title)
    let folderName = customFolderName
      ? sanitizeFolderName('', customFolderName)
      : (project.folderName || sanitizeFolderName(project.title || project.projectName, ''));

    if (!folderName || folderName === 'du-an-moi' || folderName === 'project') {
      const shortSuffix = (project.id || Date.now().toString()).slice(-5);
      folderName = `${folderName || 'project'}-${shortSuffix}`;
    }

    const projectDir = path.join(projectsStorageDir, folderName);
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }

    let projId = project.id;
    if (!projId || (projId === 'proj_default' && folderName !== '10-meo-seo')) {
      projId = `proj_${folderName}`;
    }

    const projectDataWithFolder = {
      ...project,
      id: projId,
      folderName,
      updatedAt: Date.now()
    };

    const targetFile = path.join(projectDir, 'project.json');
    // Ghi file sạch sẽ định dạng 2 spaces
    fs.writeFileSync(targetFile, JSON.stringify(projectDataWithFolder, null, 2), 'utf-8');

    res.json({
      success: true,
      folderName,
      path: projectDir,
      updatedAt: projectDataWithFolder.updatedAt
    });
  } catch (err) {
    console.error('[Projects API] Save error:', err);
    res.status(500).json({ error: 'Lỗi khi lưu dự án vào ổ cứng: ' + err.message });
  }
});

// 4. POST /api/projects/rename - Đổi tên thư mục dự án (Atomic Rename)
router.post('/rename', (req, res) => {
  try {
    const { oldFolderName, newFolderName } = req.body;
    if (!oldFolderName || !newFolderName) {
      return res.status(400).json({ error: 'Thiếu tên thư mục cần đổi' });
    }

    const sanitizedOld = path.basename(oldFolderName);
    const sanitizedNew = sanitizeFolderName('', newFolderName);

    if (sanitizedOld === sanitizedNew) {
      return res.json({ success: true, folderName: sanitizedNew });
    }

    const oldPath = path.join(projectsStorageDir, sanitizedOld);
    const newPath = path.join(projectsStorageDir, sanitizedNew);

    if (!fs.existsSync(oldPath)) {
      return res.status(404).json({ error: 'Thư mục dự án cũ không tồn tại' });
    }

    if (fs.existsSync(newPath)) {
      return res.status(409).json({ error: 'Thư mục mới đã tồn tại, vui lòng chọn tên khác' });
    }

    // Đổi tên thư mục nguyên tử
    fs.renameSync(oldPath, newPath);

    // Cập nhật folderName bên trong file project.json
    const projectFilePath = path.join(newPath, 'project.json');
    if (fs.existsSync(projectFilePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(projectFilePath, 'utf-8'));
        data.folderName = sanitizedNew;
        data.updatedAt = Date.now();
        fs.writeFileSync(projectFilePath, JSON.stringify(data, null, 2), 'utf-8');
      } catch (e) {
        console.warn('Failed to update folderName inside project.json:', e);
      }
    }

    res.json({ success: true, folderName: sanitizedNew });
  } catch (err) {
    console.error('[Projects API] Rename error:', err);
    res.status(500).json({ error: 'Không thể đổi tên thư mục: ' + err.message });
  }
});

// 5. DELETE /api/projects/:folderName - Xóa sạch thư mục dự án trên ổ cứng
router.delete('/:folderName', (req, res) => {
  try {
    const folderName = path.basename(req.params.folderName);
    const projectDir = path.join(projectsStorageDir, folderName);

    if (fs.existsSync(projectDir)) {
      fs.rmSync(projectDir, { recursive: true, force: true });
      return res.json({ success: true, message: 'Đã dọn dẹp sạch dự án trên ổ cứng', folderName });
    } else {
      return res.status(404).json({ error: 'Không tìm thấy thư mục dự án cần xóa' });
    }
  } catch (err) {
    console.error('[Projects API] Delete error:', err);
    res.status(500).json({ error: 'Không thể xóa dự án: ' + err.message });
  }
});

// 6. POST /api/projects/:folderName/reveal - Mở thư mục dự án trên Finder / File Explorer
router.post('/:folderName/reveal', async (req, res) => {
  try {
    const folderName = path.basename(req.params.folderName);
    const projectDir = path.join(projectsStorageDir, folderName);

    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }

    if (process.platform === 'darwin') {
      await execFilePromise('open', [projectDir]);
    } else if (process.platform === 'win32') {
      await execFilePromise('explorer.exe', [projectDir]);
    } else {
      await execFilePromise('xdg-open', [projectDir]);
    }

    res.json({ success: true, message: 'Đã mở thư mục trong Finder', path: projectDir });
  } catch (err) {
    console.error('[Projects API] Reveal error:', err);
    res.status(500).json({ error: 'Không thể mở thư mục: ' + err.message });
  }
});

export default router;
