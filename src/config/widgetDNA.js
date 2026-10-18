/**
 * ==============================================================================
 * 🧬 WIDGET SEMANTIC DNA & COMPATIBILITY REGISTRY (SSOT)
 * ==============================================================================
 * Defines semantic characteristics, emotional tones, domain compatibility,
 * and graceful degradation paths for all widgets.
 * Prevents semantic mismatch (e.g. boxing battles in Zen videos) without brittle regex.
 */

export const WIDGET_DNA = {
  // ── Universal Elements (Safe for ALL domains) ──
  'text': {
    preferredDomains: ['all'],
    forbiddenDomains: [],
    intent: 'typography_primary',
    fallbackType: null,
  },
  'badge': {
    preferredDomains: ['all'],
    forbiddenDomains: [],
    intent: 'micro_annotation',
    fallbackType: null,
  },
  'highlight-box': {
    preferredDomains: ['all'],
    forbiddenDomains: [],
    intent: 'callout_summary',
    fallbackType: null,
  },
  'stat-big': {
    preferredDomains: ['FINANCE_CRYPTO', 'BUSINESS_SALES', 'TECH_AI'],
    neutralDomains: ['EDUCATION_PEDAGOGY', 'WELLNESS_GROWTH'],
    forbiddenDomains: ['ZEN_HEALING'],
    intent: 'single_metric_punch',
    fallbackType: 'highlight-box',
  },
  'quote-box': {
    preferredDomains: ['all'],
    forbiddenDomains: [],
    intent: 'wisdom_quote',
    fallbackType: 'highlight-box',
  },
  'checklist': {
    preferredDomains: ['all'],
    forbiddenDomains: [],
    intent: 'actionable_steps',
    fallbackType: 'highlight-box',
  },
  'numbered-list': {
    preferredDomains: ['all'],
    forbiddenDomains: [],
    intent: 'sequential_numbered_rules',
    fallbackType: 'highlight-box',
  },
  'timeline': {
    preferredDomains: ['all'],
    forbiddenDomains: [],
    intent: 'chronological_journey',
    fallbackType: 'highlight-box',
  },
  'image': {
    preferredDomains: ['all'],
    forbiddenDomains: [],
    intent: '3d_visual_metaphor',
    fallbackType: null,
  },
  'divider': {
    preferredDomains: ['all'],
    forbiddenDomains: [],
    intent: 'layout_separator',
    fallbackType: null,
  },
  'master-hook': {
    preferredDomains: ['all'],
    forbiddenDomains: [],
    intent: 'viral_hook_container',
    fallbackType: null,
  },
  'generative-svg': {
    preferredDomains: ['TECH_AI', 'EDUCATION_PEDAGOGY'],
    forbiddenDomains: ['ZEN_HEALING', 'WELLNESS_GROWTH', 'STORY_DRAMA'],
    intent: 'mathematical_vector',
    fallbackType: 'highlight-box',
  },

  // ── Competitive & Battle Elements (Forbidden in peaceful/meditative domains) ──
  'vs-battle': {
    preferredDomains: ['BUSINESS_SALES', 'TECH_AI', 'FINANCE_CRYPTO'],
    forbiddenDomains: ['ZEN_HEALING', 'WELLNESS_GROWTH'],
    intent: 'head_to_head_competition',
    fallbackType: 'highlight-box',
  },
  'vs-card': {
    preferredDomains: ['BUSINESS_SALES', 'STORY_DRAMA', 'TECH_AI'],
    forbiddenDomains: ['ZEN_HEALING'],
    intent: 'side_by_side_contrast',
    fallbackType: 'highlight-box',
  },
  'racing-bar-chart': {
    preferredDomains: ['BUSINESS_SALES', 'FINANCE_CRYPTO', 'TECH_AI'],
    forbiddenDomains: ['ZEN_HEALING', 'WELLNESS_GROWTH'],
    intent: 'market_share_race',
    fallbackType: 'chart-bar',
  },
  'ranking-list': {
    preferredDomains: ['BUSINESS_SALES', 'TECH_AI'],
    forbiddenDomains: ['ZEN_HEALING'],
    intent: 'top_tier_leaderboard',
    fallbackType: 'checklist',
  },

  // ── Financial & Trading Elements ──
  'candlestick-chart': {
    preferredDomains: ['FINANCE_CRYPTO'],
    forbiddenDomains: ['ZEN_HEALING', 'WELLNESS_GROWTH', 'EDUCATION_PEDAGOGY', 'STORY_DRAMA'],
    intent: 'crypto_stock_candles',
    fallbackType: 'line-chart',
  },
  'waterfall-chart': {
    preferredDomains: ['FINANCE_CRYPTO', 'BUSINESS_SALES'],
    forbiddenDomains: ['ZEN_HEALING'],
    intent: 'cashflow_breakdown',
    fallbackType: 'chart-bar',
  },
  'sankey-chart': {
    preferredDomains: ['FINANCE_CRYPTO', 'BUSINESS_SALES'],
    forbiddenDomains: ['ZEN_HEALING'],
    intent: 'bezier_flow_decomposition',
    fallbackType: 'chart-bar',
  },
  'heatmap-matrix': {
    preferredDomains: ['FINANCE_CRYPTO', 'TECH_AI'],
    forbiddenDomains: ['ZEN_HEALING'],
    intent: 'risk_correlation_matrix',
    fallbackType: 'highlight-box',
  },

  // ── Tech & Cyber Elements ──
  'code-terminal': {
    preferredDomains: ['TECH_AI'],
    forbiddenDomains: ['ZEN_HEALING', 'WELLNESS_GROWTH'],
    intent: 'code_prompt_execution',
    fallbackType: 'highlight-box',
  },
  'neuron-network': {
    preferredDomains: ['TECH_AI'],
    forbiddenDomains: ['ZEN_HEALING'],
    intent: 'ai_synapse_cluster',
    fallbackType: 'highlight-box',
  },
  'cyber-matrix': {
    preferredDomains: ['TECH_AI'],
    forbiddenDomains: ['ZEN_HEALING', 'WELLNESS_GROWTH'],
    intent: 'cyber_scanning_grid',
    fallbackType: 'highlight-box',
  },
  'data-flow': {
    preferredDomains: ['TECH_AI', 'BUSINESS_SALES'],
    forbiddenDomains: ['ZEN_HEALING'],
    intent: 'system_pipeline_flow',
    fallbackType: 'flowchart',
  },

  // ── Zen & Mindfulness Elements ──
  'breathing-circle': {
    preferredDomains: ['ZEN_HEALING', 'WELLNESS_GROWTH'],
    forbiddenDomains: ['FINANCE_CRYPTO', 'TECH_AI'],
    intent: 'mindful_pranayama_breath',
    fallbackType: 'quote-box',
  },
  'vinyl-pulse': {
    preferredDomains: ['ZEN_HEALING', 'WELLNESS_GROWTH'],
    forbiddenDomains: ['FINANCE_CRYPTO', 'TECH_AI'],
    intent: 'healing_solfeggio_frequency',
    fallbackType: 'quote-box',
  },

  // ── Interactive & Pedagogy Elements ──
  'quiz-card': {
    preferredDomains: ['EDUCATION_PEDAGOGY', 'WELLNESS_GROWTH'],
    forbiddenDomains: [],
    intent: 'interactive_knowledge_check',
    fallbackType: 'highlight-box',
  },
  'knowledge-graph': {
    preferredDomains: ['EDUCATION_PEDAGOGY', 'TECH_AI', 'WELLNESS_GROWTH'],
    forbiddenDomains: [],
    intent: 'multi_tiered_mindmap',
    fallbackType: 'flowchart',
  },
  'flowchart': {
    preferredDomains: ['BUSINESS_SALES', 'TECH_AI', 'EDUCATION_PEDAGOGY', 'ZEN_HEALING'],
    forbiddenDomains: [],
    intent: 'structured_step_sequence',
    fallbackType: 'checklist',
  },

  // ── Free-Form Creative AI Canvas Widgets ──
  'word-cloud-burst': {
    preferredDomains: ['all'],
    forbiddenDomains: [],
    intent: 'cosmic_keyword_explosion',
    fallbackType: 'highlight-box',
  },
  'dialogue-reveal': {
    preferredDomains: ['ZEN_HEALING', 'WELLNESS_GROWTH', 'STORY_DRAMA', 'EDUCATION_PEDAGOGY'],
    forbiddenDomains: [],
    intent: 'inner_socratic_dialectic',
    fallbackType: 'quote-box',
  },
  'morphing-concept': {
    preferredDomains: ['all'],
    forbiddenDomains: [],
    intent: 'conceptual_state_transition',
    fallbackType: 'highlight-box',
  },
  'emotion-spectrum': {
    preferredDomains: ['ZEN_HEALING', 'WELLNESS_GROWTH', 'STORY_DRAMA'],
    forbiddenDomains: ['FINANCE_CRYPTO'],
    intent: 'emotional_gradient_trajectory',
    fallbackType: 'highlight-box',
  },
};

/**
 * Graceful Degradation Map
 * Specifies exact target type and configuration when a widget fails its data contract
 */
export const DEGRADE_MAP = {
  'vs-battle': { to: 'highlight-box', variant: 'callout-card' },
  'vs-card': { to: 'highlight-box', variant: 'callout-card' },
  'ranking-list': { to: 'checklist' },
  'quiz-card': { to: 'highlight-box', variant: 'bullet-list' },
  'racing-bar-chart': { to: 'chart-bar' },
  'candlestick-chart': { to: 'line-chart' },
  'waterfall-chart': { to: 'chart-bar' },
  'sankey-chart': { to: 'chart-bar' },
  'code-terminal': { to: 'highlight-box', variant: 'callout-card' },
  'breathing-circle': { to: 'quote-box' },
  'vinyl-pulse': { to: 'quote-box' },
  'word-cloud-burst': { to: 'highlight-box', variant: 'multi-pill' },
  'dialogue-reveal': { to: 'quote-box' },
  'morphing-concept': { to: 'highlight-box', variant: 'accent-strip' },
  'emotion-spectrum': { to: 'highlight-box', variant: 'callout-card' },
};

/**
 * Checks if a widget type is forbidden in any of the active domains
 * @param {string} widgetType 
 * @param {string[]} activeDomainIds 
 * @returns {boolean}
 */
export function isWidgetForbidden(widgetType, activeDomainIds = []) {
  const dna = WIDGET_DNA[widgetType];
  if (!dna || !dna.forbiddenDomains || dna.forbiddenDomains.length === 0) return false;
  return activeDomainIds.some(id => dna.forbiddenDomains.includes(id));
}
