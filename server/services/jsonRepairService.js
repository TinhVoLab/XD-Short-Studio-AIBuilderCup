/**
 * Resilient JSON Parser & Repair Engine for AI Responses
 * Fixes common LLM JSON syntax anomalies:
 * - Markdown fences (```json ... ```)
 * - Trailing commas before } or ]
 * - Unescaped newlines/tabs inside string values
 * - Missing commas between properties and array items
 * - Unescaped internal double quotes inside string values
 * - Truncated JSON / unclosed brackets from token limit cutoffs
 * - Scene-by-scene fallback extraction if entire array fails
 */

export function safeJsonParse(raw, fallback = null) {
  if (typeof raw !== 'string') return raw || fallback;

  let text = raw.trim();

  // 1. Remove markdown code fences
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // 2. Fast Path: standard JSON.parse
  try {
    return JSON.parse(text);
  } catch (e1) {
    // Proceed to repair pipeline
  }

  // 3. Extract outermost JSON array or object
  const firstBracket = text.indexOf('[');
  const firstBrace = text.indexOf('{');

  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    const lastBracket = text.lastIndexOf(']');
    if (lastBracket !== -1 && lastBracket > firstBracket) {
      text = text.substring(firstBracket, lastBracket + 1);
    } else {
      text = text.substring(firstBracket);
    }
  } else if (firstBrace !== -1) {
    const lastBrace = text.lastIndexOf('}');
    if (lastBrace !== -1 && lastBrace > firstBrace) {
      text = text.substring(firstBrace, lastBrace + 1);
    } else {
      text = text.substring(firstBrace);
    }
  }

  try {
    return JSON.parse(text);
  } catch (e2) {
    // Continue
  }

  // 4. Clean comments & trailing commas & missing commas
  let cleaned = text
    .replace(/\/\*[\s\S]*?\*\//g, '') // remove multi-line comments
    .replace(/\/\/.*$/gm, '')           // remove single-line comments
    .replace(/,\s*([\}\]])/g, '$1');    // remove trailing commas

  // Fix missing commas between properties: e.g. "value"\n  "nextKey": -> "value",\n  "nextKey":
  cleaned = cleaned.replace(/("(?:[^"\\]|\\.)*")\s*\n\s*(")/g, '$1,\n$2');
  cleaned = cleaned.replace(/(\btrue\b|\bfalse\b|\bnull\b|\d+)\s*\n\s*(")/g, '$1,\n$2');
  cleaned = cleaned.replace(/(\}|\])\s*\n\s*(\{)/g, '$1,\n$2');

  // Fix literal unescaped newlines/tabs inside quotes
  cleaned = cleaned.replace(/"([^"\\]*(\\.[^"\\]*)*)"/gs, (match) => {
    return match
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  });

  try {
    return JSON.parse(cleaned);
  } catch (e3) {
    // Continue
  }

  // 5. Fix unescaped internal double quotes inside string values:
  // e.g. "voiceoverText": "Nhiều bạn vẫn dùng "thủ công" để..."
  let unescapedQuoteFixed = '';
  let inStr = false;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    const prev = i > 0 ? cleaned[i - 1] : '';

    if (ch === '"' && prev !== '\\') {
      if (!inStr) {
        // Opening quote
        inStr = true;
        unescapedQuoteFixed += ch;
      } else {
        // Look ahead: is this a closing quote?
        // A real closing quote must be followed by whitespace then [,:}\]]
        const rest = cleaned.substring(i + 1, i + 30).trimStart();
        const isClosing = rest.length === 0 || /^[,:\}\]]/.test(rest);
        if (isClosing) {
          inStr = false;
          unescapedQuoteFixed += ch;
        } else {
          // Internal unescaped quote! Escape it or replace with single quote
          unescapedQuoteFixed += "'";
        }
      }
    } else {
      unescapedQuoteFixed += ch;
    }
  }

  try {
    return JSON.parse(unescapedQuoteFixed);
  } catch (eQuote) {
    cleaned = unescapedQuoteFixed;
  }

  // 6. Repair truncated JSON by balancing quotes, braces, and brackets
  let bracketCount = 0;
  let braceCount = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (ch === '[') bracketCount++;
      else if (ch === ']') bracketCount = Math.max(0, bracketCount - 1);
      else if (ch === '{') braceCount++;
      else if (ch === '}') braceCount = Math.max(0, braceCount - 1);
    }
  }

  if (inString) {
    cleaned += '"';
  }

  cleaned = cleaned.trim().replace(/,\s*$/, '').replace(/:\s*$/, ': ""');

  while (braceCount > 0) {
    cleaned += '}';
    braceCount--;
  }
  while (bracketCount > 0) {
    cleaned += ']';
    bracketCount--;
  }

  try {
    return JSON.parse(cleaned);
  } catch (e4) {
    console.warn('[safeJsonParse] Full array parse failed, attempting scene-by-scene recovery...');
  }

  // 7. Ultimate Fallback: Scene-by-Scene Object Recovery
  // If the full array is corrupted in one scene, extract all individually valid scene objects!
  const extractedScenes = [];
  let depth = 0;
  let objStart = -1;
  let insideStr = false;
  let isEscaped = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (isEscaped) {
      isEscaped = false;
      continue;
    }
    if (char === '\\') {
      isEscaped = true;
      continue;
    }
    if (char === '"') {
      insideStr = !insideStr;
      continue;
    }
    if (!insideStr) {
      if (char === '{') {
        if (depth === 0) objStart = i;
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0 && objStart !== -1) {
          const rawObj = text.substring(objStart, i + 1);
          try {
            const parsedObj = JSON.parse(rawObj);
            if (parsedObj && (parsedObj.elements || parsedObj.voiceoverText || parsedObj.name || parsedObj.temporalRole)) {
              extractedScenes.push(parsedObj);
            }
          } catch {
            // Try cleaning single object
            try {
              const cleanedObj = rawObj
                .replace(/,\s*([\}\]])/g, '$1')
                .replace(/("(?:[^"\\]|\\.)*")\s*\n\s*(")/g, '$1,\n$2');
              const parsedObj = JSON.parse(cleanedObj);
              if (parsedObj) extractedScenes.push(parsedObj);
            } catch {}
          }
          objStart = -1;
        }
      }
    }
  }

  if (extractedScenes.length > 0) {
    console.log(`[safeJsonParse] Successfully recovered ${extractedScenes.length} scenes via object extraction!`);
    return extractedScenes;
  }

  console.error('[safeJsonParse] Could not parse AI response even after repairs');
  if (fallback !== null) return fallback;
  throw new Error('Could not parse AI response into valid JSON');
}

