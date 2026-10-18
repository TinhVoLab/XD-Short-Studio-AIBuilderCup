import { GUARD_HANDLERS } from './elementDefaulters.js';

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const WIDGET_MORPH_CONFIG = {
  'highlight-box':  { fallback: (el) => (el.content && el.content.includes('\n')) ? 'checklist' : 'quote-box' },
  'chart-bar':      { fallback: () => pickRandom(['pie-chart', 'line-chart']) },
  'vs-battle':      { fallback: () => pickRandom(['table', 'ranking-list']) },
  'quote-box':      { fallback: () => pickRandom(['highlight-box', 'document-evidence']) },
  'checklist':      { fallback: () => pickRandom(['flowchart', 'timeline']) },
  'stat-big':       { fallback: () => pickRandom(['circle-chart', 'gauge-chart']) },
};

export function transformWidgetData(el, newType, ACCENT) {
  const newEl = { ...el, type: newType };
  const rawText = el.content || el.text || el.title || '';
  const lines = rawText.split('\n').map(l => l.replace(/^[•\-\*]\s*/, '').trim()).filter(l => l.length > 0);

  if (newType === 'checklist') {
    if (!el.checklistItems || el.checklistItems.length === 0) {
      newEl.checklistItems = lines.slice(0, 3).map(l => ({ text: l, subtext: '', status: 'checked' }));
      if (newEl.checklistItems.length === 0) newEl.checklistItems = [{ text: 'Mục 1', subtext: '', status: 'checked' }];
    }
  } else if (newType === 'quote-box') {
    newEl.content = lines[0] || 'Trích dẫn hay';
    newEl.authorName = el.authorName || 'Chiêm Nghiệm';
  } else if (newType === 'flowchart' || newType === 'timeline') {
    if (!el.flowSteps || el.flowSteps.length === 0) {
      newEl.flowSteps = lines.slice(0, 3).map((l, i) => ({ step: `0${i+1}`, title: l, desc: '', status: i===0?'done':'pending' }));
      if (newEl.flowSteps.length === 0) newEl.flowSteps = [{ step: '01', title: 'Bước 1', desc: '', status: 'done' }];
    }
  } else if (newType === 'document-evidence') {
    newEl.variant = 'note';
    newEl.title = 'GHI CHÚ';
    newEl.content = lines[0] || 'Thông điệp quan trọng';
  }
  
  if (GUARD_HANDLERS[newType]) {
     GUARD_HANDLERS[newType](newEl, ACCENT, { sceneText: rawText });
  }
  
  return newEl;
}
