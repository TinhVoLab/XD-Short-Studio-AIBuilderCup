import { FormulaId, FormulaModule, FormulaFrame, FormulaCategory } from './types';
import { ALL_FORMULAS } from './formulas';

export const FORMULA_REGISTRY: Record<FormulaId, FormulaModule> = ALL_FORMULAS.reduce((acc, module) => {
  acc[module.id] = module;
  return acc;
}, {} as Record<FormulaId, FormulaModule>);

export const VALID_FORMULA_IDS = ALL_FORMULAS.map((m) => m.id);

export function isValidFormula(id: string | undefined): id is FormulaId {
  return typeof id === 'string' && VALID_FORMULA_IDS.includes(id as FormulaId);
}

export const FORMULA_CATALOG = ALL_FORMULAS.map((def) => ({
  id: def.id,
  name: def.name,
  category: def.category,
  description: def.description,
}));

export function computeFormula(
  formulaId: FormulaId,
  t: number,
  accentColor: string,
  secondaryColor: string,
  params?: Record<string, number>
): FormulaFrame {
  const def = FORMULA_REGISTRY[formulaId] || FORMULA_REGISTRY['quantum-orbit'];
  return def.compute(t, accentColor, secondaryColor, params);
}
