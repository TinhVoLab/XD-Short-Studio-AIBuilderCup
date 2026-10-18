import assert from 'assert/strict'
import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

/**
 * computedStyle của element định vị `position: absolute` (left/top/transform theo khung hình).
 * Ghi đè `position: 'relative'` ngay trong cùng object style kéo thẻ vào luồng flex của khung cảnh
 * (AbsoluteFill): thẻ lệch vị trí và — khi có overflow: hidden — bị co về ~0px (dynamic-diagram, branching-flow...).
 * Thẻ cần khối chứa cho con absolute thì giữ nguyên absolute (đã là khối chứa) hoặc bọc thêm một div con.
 */
const ROOT = join(process.cwd(), 'src/remotion/elements')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : /\.tsx$/.test(name) ? [p] : []
  })
}

const hits: string[] = []
for (const file of walk(ROOT)) {
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    if (!/\.\.\.computedStyle\b/.test(line)) return
    // Quét tới hết object style chứa spread (dòng đóng `}}` đầu tiên)
    const singleLine = /\}\}/.test(line.slice(line.indexOf('...computedStyle')))
    for (let j = i; j < Math.min(lines.length, singleLine ? i + 1 : i + 40); j++) {
      const l = lines[j]
      if (j > i && /^\s*\}\}/.test(l)) break
      if (/^\s*(\/\/|\*)/.test(l)) continue
      if (/\bposition:\s*['"](relative|static)['"]/.test(l.slice(j === i ? l.indexOf('...computedStyle') : 0))) {
        hits.push(`${file.replace(process.cwd() + '/', '')}:${j + 1}`)
        break
      }
    }
  })
}

assert.equal(hits.length, 0, `Ghi đè position sau ...computedStyle (thẻ rơi vào luồng flex):\n  ${hits.join('\n  ')}`)
