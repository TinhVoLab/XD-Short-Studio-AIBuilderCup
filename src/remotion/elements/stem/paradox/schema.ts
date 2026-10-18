import { z } from 'zod';

/**
 * Zod Schema cho 12 Khuôn (Archetypes)
 * Cung cấp khả năng Auto-UI Generation và Zero-Hallucination Parsing.
 */

export const CoreArchetypeSchema = z.enum([
  'function_plot',
  'formula_morph',
  'geometry_construct',
  'transform_matrix',
  'number_line',
  'probability_sim',
  'graph_network',
  'grid_automaton',
  'parametric_curve',
  'data_histogram',
  'proof_by_picture',
  'custom_ast'
]);

export const AnimationVerbSchema = z.enum([
  'draw', 'highlight', 'fade_in', 'morph', 'trace', 'pulse', 'reveal_step'
]);

export const MathAnimationCueSchema = z.object({
  targetId: z.string().describe("ID của node cần chạy hiệu ứng (ví dụ: 'plot_1')"),
  verb: AnimationVerbSchema,
  startTau: z.number().min(0).max(1).describe("% thời gian bắt đầu so với độ dài Voiceover"),
  endTau: z.number().min(0).max(1).describe("% thời gian kết thúc so với độ dài Voiceover"),
  color: z.string().optional()
});

// Discriminated Union cho Params của từng Khuôn
export const FunctionPlotParamsSchema = z.object({
  expr: z.string().describe("Biểu thức toán học, vd: 'sin(x)' hoặc 'x^2'"),
  color: z.string().optional().describe("Màu sắc đường thị (HEX)"),
  width: z.number().optional().describe("Độ dày nét vẽ"),
  id: z.string().optional()
});

export const FormulaMorphParamsSchema = z.object({
  expr: z.string().describe("Phương trình KaTeX, vd: 'x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}'"),
  title: z.string().optional().describe("Tiêu đề phụ"),
  id: z.string().optional()
});

export const GeometryConstructParamsSchema = z.object({
  x: z.number().optional(),
  y: z.number().optional(),
  radius: z.number().optional(),
  color: z.string().optional(),
  id: z.string().optional()
});

// Map các schema vào MathLayer
export const MathLayerSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('function_plot'), params: FunctionPlotParamsSchema }),
  z.object({ type: z.literal('formula_morph'), params: FormulaMorphParamsSchema }),
  z.object({ type: z.literal('geometry_construct'), params: GeometryConstructParamsSchema }),
  // Tương tự cho các khuôn khác, tạm fallback bằng custom_ast
  z.object({ type: z.literal('custom_ast'), params: z.record(z.string(), z.any()) }),
]);

export const MathSemanticIntentSchema = z.object({
  layers: z.array(MathLayerSchema).describe("Danh sách các layer (khuôn) chồng lên nhau"),
  animations: z.array(MathAnimationCueSchema).optional().describe("Timeline hoạt hình đạo diễn cho các layer"),
  title: z.string().optional(),
  formula: z.string().optional(),
});
