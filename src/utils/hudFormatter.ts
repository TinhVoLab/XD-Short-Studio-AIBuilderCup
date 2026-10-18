/**
 * Format dynamic tokens in HUD text (e.g. {page}, {total}, {index})
 * Handles dynamic scene page numbering for both Canvas and Video renderers.
 */
export function formatHudText(
  template: string | undefined | null,
  sceneIndex: number,
  totalScenes: number
): string {
  if (!template || typeof template !== 'string') return ''

  const pageNum = sceneIndex + 1
  const totalNum = Math.max(1, totalScenes)

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)

  // 1. If explicit dynamic tokens exist, replace them
  if (template.includes('{page}') || template.includes('{total}') || template.includes('{index}')) {
    return template
      .replace(/\{page\}/g, pad(pageNum))
      .replace(/\{total\}/g, pad(totalNum))
      .replace(/\{index\}/g, `${pageNum}`)
  }

  // 2. Backward compatibility: If it's a legacy static page string like "01/08 REV 2026.08" or "02/06",
  // automatically update the numbers while preserving any suffix (e.g. " REV 2026.08")
  const legacyMatch = template.match(/^0?(\d+)\/0?(\d+)(.*)$/)
  if (legacyMatch) {
    const suffix = legacyMatch[3] || ''
    return `${pad(pageNum)}/${pad(totalNum)}${suffix}`
  }

  // 3. Otherwise return user custom string as-is (e.g. "@xdshort", "CUSTOM TITLE")
  return template
}
