/**
 * XD-Short Studio — Layout Helpers SSOT
 * Tiện ích định vị và bố cục phần tử chuẩn Canvas 9:16 (360x640 chuẩn Studio NLE).
 * 
 * LƯU Ý VỀ TỌA ĐỘ VÀ ANCHOR ORIGIN TRONG STUDIO NLE:
 * 1. Các phần tử Center-Top (badge, highlight-box, text căn giữa):
 *    - originX = 'center', originY = 'top'
 *    - CSS áp dụng translate3d(-50%, 0, 0)
 *    - Căn giữa màn hình ngang: left = screenWidth / 2 (mặc định 180)
 * 2. Phần tử Center-Center (hand-drawn):
 *    - originX = 'center', originY = 'center'
 *    - CSS áp dụng translate3d(-50%, -50%, 0)
 *    - Tâm hình học: left = centerX, top = centerY
 */

export interface RectLayout {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Căn giữa một khối phần tử theo trục ngang chuẩn Studio NLE (originX = 'center')
 * @param top Tọa độ mép trên Y
 * @param width Chiều rộng khối
 * @param height Chiều cao khối
 * @param screenWidth Chiều rộng màn hình (mặc định 360px)
 */
export function centerBlock(
  top: number,
  width: number,
  height: number,
  screenWidth = 360
): RectLayout {
  return {
    left: Math.round(screenWidth / 2), // 180 cho canvas 360
    top,
    width,
    height,
  };
}

/**
 * Tự động tính tọa độ và kích thước khung vẽ tay (hand-drawn: origin center-center)
 * ôm trọn một phần tử mục tiêu (origin center-top hoặc left-top)
 * @param target Phần tử mục tiêu cần đóng khung
 * @param padX Khoảng đệm ngang (mỗi bên)
 * @param padY Khoảng đệm dọc (mỗi bên)
 */
export function frameAround(
  target: RectLayout,
  padX = 14,
  padY = 12
): RectLayout {
  return {
    left: target.left, // Tâm ngang giữ nguyên (180)
    top: Math.round(target.top + target.height / 2), // Chuyển từ top-edge sang center-Y của khung
    width: Math.round(target.width + padX * 2),
    height: Math.round(target.height + padY * 2),
  };
}

/**
 * Tự động tính tọa độ và kích thước khoanh tròn vẽ tay (hand-drawn: origin center-center)
 * bao quanh một phần tử / số liệu mục tiêu
 * @param target Phần tử mục tiêu cần khoanh tròn
 * @param pad Khoảng đệm xung quanh
 */
export function circleAround(
  target: RectLayout,
  pad = 12
): RectLayout {
  return {
    left: target.left,
    top: Math.round(target.top + target.height / 2),
    width: Math.round(target.width + pad * 2),
    height: Math.round(target.height + pad * 2),
  };
}

/**
 * Ghép alpha hex an toàn cho chuỗi màu HEX
 * Hỗ trợ #RGB -> #RRGGBB, kiểm tra regex nghiêm ngặt
 * @param color Chuỗi màu (vd: '#BEFF01' hoặc '#F00')
 * @param alphaHex Mã hex độ trong suốt 2 ký tự (vd: '18', '33', '80')
 * @param fallback Màu dự phòng nếu màu truyền vào không hợp lệ
 */
export function withAlphaHex(
  color?: string,
  alphaHex = '18',
  fallback = '#BEFF0118'
): string {
  if (!color || typeof color !== 'string') return fallback;

  let hex = color.trim();
  if (!hex.startsWith('#')) return fallback;

  // Xử lý #RGB -> #RRGGBB
  if (hex.length === 4) {
    hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }

  // Nếu đã có 8 ký tự (#RRGGBBAA), cắt lấy 6 ký tự đầu
  if (hex.length === 9) {
    hex = hex.slice(0, 7);
  }

  // Kiểm tra tính hợp lệ của #RRGGBB
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    return fallback;
  }

  // Đảm bảo alphaHex hợp lệ 2 ký tự hex
  const cleanAlpha = /^[0-9A-Fa-f]{2}$/.test(alphaHex) ? alphaHex : '18';
  return `${hex}${cleanAlpha}`;
}
