import { SunoBgmTrack, SunoVibe } from '@/types/scene';

export interface SunoVibeCategory {
  id: 'all' | SunoVibe;
  label: string;
  emoji: string;
  color: string;
}

export const SUNO_VIBE_CATEGORIES: SunoVibeCategory[] = [
  { id: 'all', label: 'Tất cả', emoji: '✨', color: '#BEFF01' },
  { id: 'healing', label: 'Thiền', emoji: '🌿', color: '#00FF88' },
  { id: 'hype', label: 'Hype', emoji: '🔥', color: '#FF5544' },
  { id: 'mystery', label: 'Bí Ẩn', emoji: '🧠', color: '#B84DFF' },
  { id: 'tech', label: 'Công Nghệ', emoji: '📈', color: '#00E5FF' },
  { id: 'funny', label: 'Vui Nhộn', emoji: '😂', color: '#FFB800' },
];

// Default system BGM tracks (11 high-quality authentic offline tracks mapped directly to public/audio/bgm/)
export const INITIAL_SUNO_PRESET_TRACKS: SunoBgmTrack[] = [
  // ── Tech / AI / Công Nghệ ─────────────────────────
  {
    id: 'bgm_tech_synthwave_ai',
    title: 'Tech Synthwave AI (Công Nghệ Tương Lai)',
    vibe: 'tech',
    audioUrl: '/audio/bgm/tech_synthwave_ai.mp3',
    duration: 111,
    tags: ['synthwave', 'ai', 'tech', 'cyber'],
    createdAt: 1001,
  },
  {
    id: 'bgm_cyberpunk_drive',
    title: 'Cyberpunk Drive (Nhịp Điệu Điện Tử)',
    vibe: 'tech',
    audioUrl: '/audio/bgm/cyberpunk_drive.mp3',
    duration: 110,
    tags: ['cyberpunk', 'drive', 'synth', 'modern'],
    createdAt: 1002,
  },
  {
    id: 'bgm_electronic_energy',
    title: 'Electronic Energy (Năng Lượng Số)',
    vibe: 'tech',
    audioUrl: '/audio/bgm/electronic_energy.mp3',
    duration: 130,
    tags: ['electronic', 'energy', 'tech', 'startup'],
    createdAt: 1003,
  },

  // ── Hype / Năng Lượng / Viral ─────────────────────
  {
    id: 'bgm_future_bass_hype',
    title: 'Future Bass Drop (Hype & Năng Lượng)',
    vibe: 'hype',
    audioUrl: '/audio/bgm/future_bass_hype.mp3',
    duration: 134,
    tags: ['future bass', 'hype', 'viral', 'edm'],
    createdAt: 1004,
  },

  // ── Mystery / Bí Ẩn / Kịch Tính ───────────────────
  {
    id: 'bgm_cinematic_mystery_noir',
    title: 'Cinematic Mystery Noir (Bí Ẩn Tò Mò)',
    vibe: 'mystery',
    audioUrl: '/audio/bgm/cinematic_mystery_noir.mp3',
    duration: 70,
    tags: ['mystery', 'noir', 'detective', 'cinematic'],
    createdAt: 1005,
  },
  {
    id: 'bgm_dark_suspense',
    title: 'Dark Suspense (Kịch Tính Cao Trào)',
    vibe: 'mystery',
    audioUrl: '/audio/bgm/dark_suspense.mp3',
    duration: 51,
    tags: ['suspense', 'thriller', 'dramatic', 'dark'],
    createdAt: 1006,
  },

  // ── Funny / Hài Hước / Vui Nhộn ───────────────────
  {
    id: 'bgm_funny_quirky_groove',
    title: 'Funny Quirky Groove (Dí Dỏm Hài Hước)',
    vibe: 'funny',
    audioUrl: '/audio/bgm/funny_quirky_groove.mp3',
    duration: 44,
    tags: ['funny', 'quirky', 'comedy', 'happy'],
    createdAt: 1007,
  },
  {
    id: 'bgm_playful_comedy',
    title: 'Playful Comedy (Vui Tươi Nhí Nhảnh)',
    vibe: 'funny',
    audioUrl: '/audio/bgm/playful_comedy.mp3',
    duration: 45,
    tags: ['playful', 'comedy', 'cute', 'cartoon'],
    createdAt: 1008,
  },

  // ── Healing / Thiền / Thư Giãn ────────────────────
  {
    id: 'bgm_deep_meditation_zen',
    title: 'Deep Meditation Zen (Thiền Định Sâu)',
    vibe: 'healing',
    audioUrl: '/audio/bgm/deep_meditation_zen.mp3',
    duration: 162,
    tags: ['zen', 'meditation', 'healing', 'peaceful'],
    createdAt: 1009,
  },
  {
    id: 'bgm_chill_lofi_vibes',
    title: 'Chill Lofi Vibes (Thư Giãn Nhẹ Nhàng)',
    vibe: 'healing',
    audioUrl: '/audio/bgm/chill_lofi_vibes.mp3',
    duration: 144,
    tags: ['lofi', 'chill', 'study', 'calm'],
    createdAt: 1010,
  },
  {
    id: 'bgm_healing_lofi',
    title: 'Healing Soul (Chữa Lành Tâm Hồn)',
    vibe: 'healing',
    audioUrl: '/audio/bgm/healing_lofi.mp3',
    duration: 60,
    tags: ['healing', 'soul', 'peace', 'nature'],
    createdAt: 1011,
  },
];

