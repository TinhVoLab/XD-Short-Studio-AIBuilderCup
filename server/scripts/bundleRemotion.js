import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { bundle } from '@remotion/bundler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const outDir = process.env.REMOTION_BUNDLE_DIR ? path.resolve(process.env.REMOTION_BUNDLE_DIR) : path.join(rootDir, 'server/build/remotion-bundle');
const publicDir = path.join(rootDir, 'public');

async function main() {
  console.log('🚀 [Remotion Enterprise] Pre-bundling composition for production...');
  const startTime = Date.now();

  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  fs.mkdirSync(path.dirname(outDir), { recursive: true });

  const bundled = await bundle(
    path.join(rootDir, 'src/remotion/index.ts'),
    (progress) => {
      process.stdout.write(`\r[Remotion Bundler] Progress: ${Math.round(progress * 100)}%`);
    },
    {
      publicDir: null,
      outDir,
      webpackOverride: (config) => {
        config.devtool = false;
        config.resolve = config.resolve || {};
        config.resolve.alias = {
          ...config.resolve.alias,
          '@': path.resolve(rootDir, 'src'),
        };
        return config;
      },
    }
  );

  // Clean up bundled public folder (360MB+) if created by Remotion
  const bundlePublicDir = path.join(outDir, 'public');
  if (fs.existsSync(bundlePublicDir)) {
    fs.rmSync(bundlePublicDir, { recursive: true, force: true });
  }

  // Strip vendor sourceMappingURL comments to prevent Chromium ENOENT crashes
  const files = fs.readdirSync(outDir);
  for (const file of files) {
    if (file.endsWith('.js')) {
      const filePath = path.join(outDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const stripped = content
        .replace(/\/\/# sourceMappingURL=[^\s]+/g, '')
        .replace(/\/\*# sourceMappingURL=[^\s]+ \*\//g, '');
      if (content !== stripped) {
        fs.writeFileSync(filePath, stripped);
      }
    }
  }

  console.log(`\n✅ [Remotion Enterprise] Successfully bundled composition in ${((Date.now() - startTime) / 1000).toFixed(2)}s!`);
  console.log(`📂 Output: ${bundled}`);
}

main().catch((err) => {
  console.error('\n❌ [Remotion Enterprise] Bundle failed:', err);
  process.exit(1);
});
