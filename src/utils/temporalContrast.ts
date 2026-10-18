import { Scene } from '../types/scene';
import {
  SCENE_ROLE_IDS,
  LEGACY_SCENE_ROLE_IDS,
  sceneRoleSpec,
  inferRoleByIndex,
  sceneDurationForRole,
  type AnySceneRole,
} from '@/config/sceneRoles';

/** Vai trò cảnh (6 vai Master + 2 giá trị cũ normal/highlight) — thông số ở config/sceneRoles */
export type TemporalRole = AnySceneRole;

/** Màu hiển thị vai trên filmstrip / NodeFlow / wizard (chỉ phần trình bày; thông số nằm ở sceneRoles) */
const ROLE_COLORS: Record<TemporalRole, string> = {
  hook: '#FFB800',
  bridge: '#7AA7FF',
  content: '#00D8F6',
  normal: '#00D8F6',
  retention: '#F2A65A',
  highlight: '#BEFF01',
  climax: '#BEFF01',
  cta: '#FF3366',
};

const hexToRgba = (hex: string, alpha: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

export const TEMPORAL_ROLE_INFO = Object.fromEntries(
  [...SCENE_ROLE_IDS, ...LEGACY_SCENE_ROLE_IDS].map((role) => {
    const spec = sceneRoleSpec(role);
    return [
      role,
      {
        label: spec.label,
        badge: spec.shortLabel,
        color: ROLE_COLORS[role],
        bgColor: hexToRgba(ROLE_COLORS[role], 0.15),
        defaultDuration: spec.duration.target,
        description: spec.hint,
      },
    ];
  })
) as Record<
  TemporalRole,
  { label: string; badge: string; color: string; bgColor: string; defaultDuration: number; description: string }
>;

/**
 * "Tự động chia nhịp": gán vai theo vị trí (cùng công thức với lúc AI tạo video) và đặt thời lượng theo vai,
 * không bao giờ ngắn hơn giọng đọc (sceneDurationForRole).
 */
export function assignViralRoles(scenes: Scene[]): Scene[] {
  if (!scenes || scenes.length === 0) return [];
  const n = scenes.length;
  return scenes.map((scene, index) => {
    const role = inferRoleByIndex(index, n);
    return { ...scene, temporalRole: role, duration: sceneDurationForRole(role, scene) };
  });
}
