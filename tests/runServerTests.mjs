// Chạy toàn bộ test server (node + assert) và test hợp đồng ngữ nghĩa; thoát mã 1 nếu có file lỗi.
import { spawnSync } from 'child_process';
import { readdirSync } from 'fs';
import path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const files = [
  ...readdirSync(path.join(ROOT, 'server/tests')).filter(f => f.endsWith('.test.js')).map(f => path.join('server/tests', f)),
  'tests/semanticContract.test.js',
];
let failed = 0;
for (const f of files) {
  const r = spawnSync(process.execPath, [f], { cwd: ROOT, encoding: 'utf8' });
  const ok = r.status === 0;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${f}`);
  if (!ok) console.log((r.stderr || r.stdout).split('\n').filter(l => /Error|assert/i.test(l)).slice(0, 4).join('\n'));
}
process.exit(failed ? 1 : 0);
