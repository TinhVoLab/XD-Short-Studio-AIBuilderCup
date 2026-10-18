/**
 * ==============================================================================
 * 🛡️ SEMANTIC CONTRACT VALIDATOR & GRACEFUL DEGRADATION PROCESSOR
 * ==============================================================================
 * Enforces Widget Semantic DNA at the post-processing stage.
 * If AI hallucinated a widget forbidden in the current domain (e.g. vs-battle in Zen),
 * or if a complex widget is missing its data contract, this processor safely degrades
 * the element to a harmonious alternative before rendering.
 */

import { WIDGET_DNA, isWidgetForbidden, DEGRADE_MAP } from '../../../../src/config/widgetDNA.js';
import { telemetry } from '../../telemetryService.js';
import { classifyPromptContext } from '../../semanticContextRouter.js';

export function enforceSemanticContract(scenes = [], options = {}) {
  const { 
    style = '', 
    prompt = '', 
    activeDomains = [], 
    ACCENT = '#BEFF01' 
  } = options;

  const domainIds = Array.isArray(activeDomains) && activeDomains.length > 0
    ? activeDomains
    : classifyPromptContext(prompt, style).map(d => d.id);

  return scenes.map((scene, sceneIndex) => {
    if (!scene.elements || !Array.isArray(scene.elements)) {
      return scene;
    }

    const voiceover = scene.voiceoverText || scene.description || scene.name || '';

    const validatedElements = scene.elements.map((el, elIndex) => {
      const elType = el.type;
      if (!elType) return el;

      // Check if widget is forbidden in the current active domains
      const isForbidden = isWidgetForbidden(elType, domainIds);

      if (isForbidden) {
        const degradeRule = DEGRADE_MAP[elType] || { to: 'highlight-box', variant: 'callout-card' };
        const targetType = degradeRule.to || 'highlight-box';

        telemetry.recordHealing?.(1, {
          reason: 'SemanticDomainViolation',
          originalType: elType,
          degradedTo: targetType,
          sceneIndex,
          activeDomains: domainIds
        });

        // Gracefully morph into harmonious target
        const degradedEl = {
          ...el,
          type: targetType,
          content: el.content || voiceover || 'Thông điệp cốt lõi',
          accentColor: el.accentColor || ACCENT,
        };

        if (targetType === 'highlight-box') {
          degradedEl.variant = degradeRule.variant || 'callout-card';
          degradedEl.boxIcon = 'sparkle';
          degradedEl.fontSize = 15;
          degradedEl.height = Math.max(90, Math.min(220, (degradedEl.content.length > 40 ? 120 : 90)));
        } else if (targetType === 'quote-box') {
          degradedEl.quote = el.content || voiceover || 'Sự an yên bắt đầu từ việc lắng đọng tâm trí.';
          degradedEl.author = el.author || scene.authorName || 'Chiêm nghiệm';
          degradedEl.height = 140;
        }

        // Clean up leftover complex data blocks that don't apply to the target
        delete degradedEl.vsBattle;
        delete degradedEl.candlestickData;
        delete degradedEl.racingBarData;
        delete degradedEl.quizData;

        return degradedEl;
      }

      // Check complex widget payload completeness
      if (elType === 'vs-battle') {
        const hasValidRounds = el.vsBattle?.rounds && Array.isArray(el.vsBattle.rounds) && el.vsBattle.rounds.length > 0;
        const hasValidSubjects = el.vsBattle?.leftSubject?.name && el.vsBattle?.rightSubject?.name;
        if (!hasValidRounds || !hasValidSubjects) {
          // If completely empty, try to populate from scene voiceover
          if (!el.vsBattle) {
            el.vsBattle = {
              leftSubject: { name: 'LỰA CHỌN A', icon: 'check', color: '#BEFF01' },
              rightSubject: { name: 'LỰA CHỌN B', icon: 'sparkle', color: '#00D4FF' },
              rounds: [
                { criterion: 'Tiêu chí 01', winner: 'left', leftValue: 'Ưu thế A', rightValue: 'Hạn chế B' },
                { criterion: 'Tiêu chí 02', winner: 'right', leftValue: 'Hạn chế A', rightValue: 'Ưu thế B' }
              ]
            };
          }
        }
      }

      return el;
    });

    return {
      ...scene,
      elements: validatedElements
    };
  });
}
