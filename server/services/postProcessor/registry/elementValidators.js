import { z } from 'zod';
import { VALID_ELEMENT_TYPES_ARRAY } from '../../../../src/config/validElementTypes.js';
import { telemetry } from '../../telemetryService.js';

const isValidHex = (color) => /^#([0-9A-F]{3,8})$/i.test(color) || /^rgba?\(/i.test(color);

export const sceneElementSchema = z.object({
  type: z.enum(VALID_ELEMENT_TYPES_ARRAY),
  left: z.number().optional(),
  top: z.number().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  fontSize: z.number().positive().optional(),
  color: z.string().optional().refine(val => !val || isValidHex(val), { message: "Invalid color format" }),
}).passthrough();

export const validateElementSchema = (el) => {
  const result = sceneElementSchema.safeParse(el);
  if (!result.success) {
    telemetry.recordHealing(1, { reason: 'ZodValidationError', error: result.error.issues });
    return false;
  }
  
  // Array length validation (Must not be empty if they exist)
  const arrayFields = ['chartData', 'flowSteps', 'checklistItems', 'chatMessages', 'rankingItems', 'pyramidLayers'];
  for (const field of arrayFields) {
    if (el[field] && Array.isArray(el[field]) && el[field].length === 0) return false;
  }
  
  return true; // Passed strict validation
};
