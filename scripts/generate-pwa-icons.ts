/**
 * PWAアイコン生成スクリプト（一度きりの実行を想定）。
 *
 * public/pwa-icon-source.svg（favicon.svgと同じ図案・ブランドカラーを
 * フルキャンバスで書き出したもの）から、manifest.icons用の
 * public/pwa-192x192.png・public/pwa-512x512.pngを生成する。
 *
 * ロゴを変更した場合は pwa-icon-source.svg を更新したうえで
 * `npx tsx scripts/generate-pwa-icons.ts` を再実行すること。
 * ref: docs/11_PWA化設計.md#5
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_SVG = resolve(REPO_ROOT, 'public/pwa-icon-source.svg');

const SIZES = [192, 512];

async function main() {
  for (const size of SIZES) {
    const outputPath = resolve(REPO_ROOT, `public/pwa-${size}x${size}.png`);
    await sharp(SOURCE_SVG, { density: (72 * size) / 512 })
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`generated: ${outputPath}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
