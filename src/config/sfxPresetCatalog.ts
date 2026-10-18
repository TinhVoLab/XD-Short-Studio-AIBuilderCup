import { CustomSfxTrack, SfxCategory } from "@/types/scene";

export interface SfxCategoryItem {
  id: SfxCategory;
  label: string;
  emoji: string;
}

export const SFX_CATEGORIES: SfxCategoryItem[] = [
  { id: "all", label: "Tất cả", emoji: "✨" },
  { id: "impact", label: "Tác động & Boom", emoji: "💥" },
  { id: "motion", label: "Chuyển cảnh", emoji: "💨" },
  { id: "ui", label: "Giao diện & Số", emoji: "🔔" },
  { id: "reaction", label: "Cảm xúc & Meme", emoji: "🎭" },
  { id: "custom", label: "Tự thêm", emoji: "⭐" },
];

export const INITIAL_SFX_PRESETS: CustomSfxTrack[] = [
  // ── NHÓM 1: TÁC ĐỘNG & CAO TRÀO (IMPACT) ──
  {
    id: "sfx_boom",
    name: "Boom điện ảnh (Sub-bass)",
    emoji: "💥",
    category: "impact",
    audioUrl: "/sfx/boom.wav",
    duration: 1.2,
    createdAt: 1001,
    isPreset: true
  },
  {
    id: "sfx_thud",
    name: "Cú đập Thud (Punch hit)",
    emoji: "🥊",
    category: "impact",
    audioUrl: "/sfx/thud.wav",
    duration: 0.45,
    createdAt: 1002,
    isPreset: true
  },
  {
    id: "sfx_riser",
    name: "Cao trào Riser (Tension build)",
    emoji: "🚀",
    category: "impact",
    audioUrl: "/sfx/riser.wav",
    duration: 1.6,
    createdAt: 1003,
    isPreset: true
  },

  // ── NHÓM 2: GIAO DIỆN, TIỀN TỆ & THỊ GIÁC (UI & DATA) ──
  {
    id: "sfx_kaching",
    name: "Tiền về Ka-ching! ($$$)",
    emoji: "💰",
    category: "ui",
    audioUrl: "/sfx/kaching.wav",
    duration: 0.8,
    createdAt: 1004,
    isPreset: true
  },
  {
    id: "sfx_camera",
    name: "Màn trập Camera (Shutter)",
    emoji: "📸",
    category: "ui",
    audioUrl: "/sfx/camera_shutter.wav",
    duration: 0.32,
    createdAt: 1005,
    isPreset: true
  },
  {
    id: "sfx_marker",
    name: "Bút dạ Highlight (Marker)",
    emoji: "🖍️",
    category: "ui",
    audioUrl: "/sfx/marker.wav",
    duration: 0.35,
    createdAt: 1006,
    isPreset: true
  },
  {
    id: "sfx_pop",
    name: "Pop (Hiện chữ / Sticker)",
    emoji: "🫧",
    category: "ui",
    audioUrl: "/sfx/pop.wav",
    duration: 0.16,
    createdAt: 1007,
    isPreset: true
  },
  {
    id: "sfx_click",
    name: "Click chuột (Tactile Tap)",
    emoji: "🖱️",
    category: "ui",
    audioUrl: "/sfx/click.wav",
    duration: 0.12,
    createdAt: 1008,
    isPreset: true
  },
  {
    id: "sfx_typewriter",
    name: "Gõ phím cơ (Keyboard)",
    emoji: "⌨️",
    category: "ui",
    audioUrl: "/sfx/typewriter.wav",
    duration: 0.14,
    createdAt: 1009,
    isPreset: true
  },
  {
    id: "sfx_bell",
    name: "Tiếng chuông (Bell)",
    emoji: "🔔",
    category: "ui",
    audioUrl: "/sfx/bell.wav",
    duration: 1.5,
    createdAt: 1010,
    isPreset: true
  },
  {
    id: "sfx_chime",
    name: "Chuông gió (Chime)",
    emoji: "🎐",
    category: "ui",
    audioUrl: "/sfx/chime.wav",
    duration: 1.8,
    createdAt: 1011,
    isPreset: true
  },

  // ── NHÓM 3: CHUYỂN ĐỘNG & LƯỚT CẢNH (MOTION) ──
  {
    id: "sfx_whoosh",
    name: "Vút qua chuyển cảnh (Whoosh)",
    emoji: "🌬️",
    category: "motion",
    audioUrl: "/sfx/whoosh.wav",
    duration: 0.65,
    createdAt: 1012,
    isPreset: true
  },
  {
    id: "sfx_swoosh",
    name: "Lướt nhẹ khí động (Swoosh)",
    emoji: "💨",
    category: "motion",
    audioUrl: "/sfx/swoosh.wav",
    duration: 0.35,
    createdAt: 1013,
    isPreset: true
  },
  {
    id: "sfx_whip",
    name: "Vút roi nhanh (Whip Crack)",
    emoji: "⚡",
    category: "motion",
    audioUrl: "/sfx/whip.wav",
    duration: 0.28,
    createdAt: 1014,
    isPreset: true
  },
  {
    id: "sfx_glitch",
    name: "Nhiễu sóng số (Digital Glitch)",
    emoji: "👾",
    category: "motion",
    audioUrl: "/sfx/glitch.wav",
    duration: 0.38,
    createdAt: 1015,
    isPreset: true
  },

  // ── NHÓM 4: CẢM XÚC, ĐÚNG / SAI & MEME (REACTION) ──
  {
    id: "sfx_ding",
    name: "Ting đúng / Ý tưởng (Ding)",
    emoji: "💡",
    category: "reaction",
    audioUrl: "/sfx/ding.wav",
    duration: 0.75,
    createdAt: 1016,
    isPreset: true
  },
  {
    id: "sfx_buzzer",
    name: "Còi báo sai lầm (Wrong Buzzer)",
    emoji: "❌",
    category: "reaction",
    audioUrl: "/sfx/buzzer.wav",
    duration: 0.45,
    createdAt: 1017,
    isPreset: true
  },
  {
    id: "sfx_record_scratch",
    name: "Phanh đĩa than (Vinyl Stop)",
    emoji: "🛑",
    category: "reaction",
    audioUrl: "/sfx/record_scratch.wav",
    duration: 0.45,
    createdAt: 1018,
    isPreset: true
  },
  {
    id: "sfx_clock",
    name: "Đồng hồ đếm ngược (Clock Tick)",
    emoji: "⏱️",
    category: "reaction",
    audioUrl: "/sfx/clock_tick.wav",
    duration: 0.15,
    createdAt: 1019,
    isPreset: true
  },
  {
    id: "sfx_clap",
    name: "Vỗ tay rộn ràng (Applause)",
    emoji: "👏",
    category: "reaction",
    audioUrl: "/sfx/clap.wav",
    duration: 0.5,
    createdAt: 1020,
    isPreset: true
  },
  {
    id: "sfx_laugh",
    name: "Tiếng cười (Giggle)",
    emoji: "😆",
    category: "reaction",
    audioUrl: "/sfx/laugh.wav",
    duration: 0.85,
    createdAt: 1021,
    isPreset: true
  },
  {
    id: "sfx_drumroll",
    name: "Trống dồn hồi hộp (Drumroll)",
    emoji: "🥁",
    category: "reaction",
    audioUrl: "/sfx/drumroll.wav",
    duration: 1.2,
    createdAt: 1022,
    isPreset: true
  },
];
