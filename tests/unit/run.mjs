// Chạy unit test TypeScript thuần (src/utils, src/config...) không cần thêm dependency:
// esbuild bundle từng *.test.ts với alias @ → src rồi chạy bằng node.
import { build } from 'esbuild';
import { readdirSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const outDir = mkdtempSync(join(tmpdir(), 'xd-unit-'));
const files = readdirSync(here).filter(f => f.endsWith('.test.ts'));
let failed = 0;

for (const file of files) {
  const outfile = join(outDir, file.replace(/\.ts$/, '.mjs'));
  await build({
    entryPoints: [join(here, file)],
    outfile,
    bundle: true,
    platform: 'node',
    format: 'esm',
    alias: { '@': join(root, 'src') },
    logLevel: 'error',
  });
  try {
    await import(pathToFileURL(outfile).href);
    console.log(`PASS ${file}`);
  } catch (err) {
    failed++;
    console.error(`FAIL ${file}\n`, err);
  }
}

rmSync(outDir, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
