// ── Prompt Layout & Hook Templates (V10 SSOT Architecture) ──────────────
import { getHookLayoutFromRegistry, getCompiledLayoutRulesFromRegistry } from '../../src/config/layoutRegistry.js';

export const getHookLayout = (sText, acc) => {
  return getHookLayoutFromRegistry(sText, acc);
};

export const getCompiledLayoutRules = (customTemplates, style, ACCENT) => {
  return getCompiledLayoutRulesFromRegistry(customTemplates, style, ACCENT);
};

