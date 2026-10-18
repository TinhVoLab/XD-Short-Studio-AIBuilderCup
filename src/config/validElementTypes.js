import { ELEMENTS_REGISTRY } from './elementsRegistry.js';

// The elementsRegistry has almost all elements. We also include a few structural/internal ones
// that might not be exposed in the UI catalog but are valid system types.
export const INTERNAL_ELEMENT_TYPES = ['text', 'caption', 'master-hook'];

export const VALID_ELEMENT_TYPES_ARRAY = [
  ...Object.keys(ELEMENTS_REGISTRY),
  ...INTERNAL_ELEMENT_TYPES
];

export const VALID_ELEMENT_TYPES = new Set(VALID_ELEMENT_TYPES_ARRAY);
