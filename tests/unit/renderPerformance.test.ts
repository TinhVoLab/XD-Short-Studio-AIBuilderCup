import assert from 'assert/strict'
import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

/**
 * Chặn tái phát thuộc tính làm render video chậm (đo ở 1080×1920):
 * backdrop-filter khiến 3 thẻ kính tốn thêm ~79 ms/frame (gấp đôi thời gian render)
 * trong khi nền thẻ đã đục ≥ 0.85 nên phần mờ phía sau gần như không nhìn thấy.
 */
const ROOT = join(process.cwd(), 'src/remotion')
const BANNED: Array<[RegExp, string]> = [
  [/backdropFilter\s*:/, 'backdrop-filter (dùng nền --card-bg đục ≥ 0.85)'],
  [/backdrop-filter\s*:/, 'backdrop-filter (dùng nền --card-bg đục ≥ 0.85)'],
  // CSS transition không có tác dụng khi render từng frame → preview (Player) khác video
  [/\btransition:\s*['"`]/, 'CSS transition (dùng interpolate/spring theo frame)'],
  [/^\s*transition:\s*[a-z][^;]*;/, 'CSS transition trong chuỗi CSS'],
  // Mỗi worker render một dải frame riêng → Math.random cho kết quả khác preview / khác giữa các worker
  [/\bMath\.random\(/, 'Math.random (dùng random(seed) của remotion)'],
]

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|css)$/.test(name) ? [p] : []
  })
}

const hits: string[] = []
for (const file of walk(ROOT)) {
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (/^\s*(\/\/|\*)/.test(line)) return
    const rule = BANNED.find(([re]) => re.test(line))
    if (rule) hits.push(`${file.replace(process.cwd() + '/', '')}:${i + 1} — ${rule[1]}`)
  })
}

assert.equal(hits.length, 0, `Thuộc tính cấm trong code render (src/remotion):\n  ${hits.join('\n  ')}`)
