import { z } from 'zod';

export type MotionType =
  | 'rise'        // Đi lên, thăng hoa, tăng trưởng, tiến lên
  | 'fall'        // Rơi, tụt hậu, sụt giảm, suy thoái
  | 'expand'      // Bung tỏa, vỡ òa, mở rộng, lan tỏa
  | 'contract'    // Thu hẹp, dồn nén, tập trung, cô đọng
  | 'pulse'       // Nhịp đập, thu hút chú ý, cảnh báo
  | 'spiral'      // Xoáy sâu, rối rắm, phát triển vòng lặp
  | 'oscillate'   // Dao động, lưỡng lự, bất ổn, sóng gió
  | 'static';     // Đứng yên, vững chãi, nền tảng, cố định

export type FormArchetype =
  | 'arrow'       // Hướng đi, chỉ thị, chuyển dịch, mục tiêu
  | 'circle'      // Bao bọc, khoanh vùng, hoàn hảo, toàn diện
  | 'line'        // Dẫn dắt, ranh giới, gạch chân, liên kết
  | 'burst'       // Đột phá, ngạc nhiên, năng lượng lớn, vụt sáng
  | 'frame'       // Đóng khung, cấu trúc, rào cản, quy chuẩn
  | 'check'       // Xác thực, hoàn thành, đúng đắn, giải pháp
  | 'wave'        // Nhịp điệu, mềm mại, biến đổi, linh hoạt
  | 'spiral';     // Chu kỳ, tiến hóa, phức tạp, lốc xoáy

export type Valence = 'urgent' | 'positive' | 'neutral' | 'cautionary';

export type PrimaryDimension = 'motion' | 'form' | 'energy' | 'valence';

export interface VisualDNA {
  motion: MotionType;
  form: FormArchetype;
  energy: number;                  // 0.0 – 1.0 (tỉ lệ với nhịp điệu, cường độ cảm xúc)
  valence: Valence;
  primaryDimension: PrimaryDimension; // Chiều đóng vai trò quyết định nhất (trọng số 3.0)
  strokeComplexity: 1 | 2 | 3;    // Độ phức tạp nét vẽ (1: nét đơn, 2: nét kép, 3: phức hợp)
}

export interface MatchExplanation {
  selectedAssetId: string;
  selectedAssetName: string;
  initialRank: number;
  finalRank: number;
  dnaDistance: number;
  semanticScore: number;
  diversityPenalty: number;
  reason: string;                  // Giải trình người đọc được (Audit Trail)
}

export interface SceneDirection {
  sceneId: string;
  sceneIndex: number;
  visualMetaphor: string;          // Câu văn xuôi giàu cảm xúc
  dna: VisualDNA;                  // Vector lượng hóa 6 chiều
  matchExplanation?: MatchExplanation;
  needsNewAsset: boolean;
  intensity?: 'quiet' | 'normal' | 'peak';
}

// ── ZOD SCHEMA VALIDATION (Structured Output SSOT) ───────────────────────────

export const VisualDNASchema = z.object({
  motion: z.enum(['rise', 'fall', 'expand', 'contract', 'pulse', 'spiral', 'oscillate', 'static']),
  form: z.enum(['arrow', 'circle', 'line', 'burst', 'frame', 'check', 'wave', 'spiral']),
  energy: z.number().min(0).max(1),
  valence: z.enum(['urgent', 'positive', 'neutral', 'cautionary']),
  primaryDimension: z.enum(['motion', 'form', 'energy', 'valence']),
  strokeComplexity: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

export type VisualDNASchemaType = z.infer<typeof VisualDNASchema>;
