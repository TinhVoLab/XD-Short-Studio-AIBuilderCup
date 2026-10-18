import assert from 'node:assert/strict';
import { parsePubchemProperties, normalizeChemName } from '../services/pubchemService.js';

// Khoá mới của PubChem (2025): hỏi CanonicalSMILES nhưng nhận về ConnectivitySMILES
assert.deepEqual(
  parsePubchemProperties({ PropertyTable: { Properties: [{ CID: 2519, MolecularFormula: 'C8H10N4O2', ConnectivitySMILES: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C' }] } }),
  { cid: 2519, smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C', formula: 'C8H10N4O2', title: '' }
);

// Ưu tiên SMILES đầy đủ (có lập thể) khi có
assert.equal(
  parsePubchemProperties({ PropertyTable: { Properties: [{ CID: 5793, MolecularFormula: 'C6H12O6', SMILES: 'C([C@@H]1O)O', ConnectivitySMILES: 'C(C1O)O', Title: 'D-Glucose' }] } }).smiles,
  'C([C@@H]1O)O'
);

// Khoá cũ vẫn đọc được (cache cũ)
assert.equal(parsePubchemProperties({ PropertyTable: { Properties: [{ CID: 702, MolecularFormula: 'C2H6O', CanonicalSMILES: 'CCO' }] } }).smiles, 'CCO');

// Thiếu SMILES hoặc công thức → không dùng
assert.equal(parsePubchemProperties({ PropertyTable: { Properties: [{ CID: 1, MolecularFormula: 'H2O' }] } }), null);
assert.equal(parsePubchemProperties({ PropertyTable: { Properties: [{ CID: 1, SMILES: 'O' }] } }), null);
assert.equal(parsePubchemProperties({ Fault: { Code: 'PUGREST.NotFound' } }), null);

// Khoá cache: không phân biệt hoa thường và khoảng trắng thừa
assert.equal(normalizeChemName('  Ethanol  '), 'ethanol');
assert.equal(normalizeChemName('Copper(II)   sulfate'), 'copper(ii) sulfate');
assert.equal(normalizeChemName(''), '');
assert.equal(normalizeChemName('x'.repeat(500)).length, 120);

console.log('✅ pubchemService: all assertions passed');
