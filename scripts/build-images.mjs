#!/usr/bin/env node
/**
 * build-images.mjs — 把 brand/3d 的 3D 渲染大图转成站点用的 WebP + AVIF（两档尺寸）。
 *
 * 源图：/home/koharachan/cathead/brand/3d/logo_3d.png      (1500x1500, RGBA)
 *       /home/koharachan/cathead/brand/3d/mascot_3d.png    (1500x1500, RGBA, 备用)
 * 输出：/home/koharachan/cathead/site/public/img/*.webp / *.avif
 *
 * 依赖 sharp（装在 /home/koharachan/assetwork/node_modules，不进 site 的 package.json）：
 *   cd /home/koharachan/assetwork && npm i sharp
 *   node /home/koharachan/cathead/site/scripts/build-images.mjs
 *
 * 质量策略：单图硬上限 300 KB；超过就从 quality 自动降档重试。
 */

import { createRequire } from 'node:module';
import { mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const sharp = require('/home/koharachan/assetwork/node_modules/sharp');

const BRAND_3D = '/home/koharachan/cathead/brand/3d';
const PUBLIC_IMG = '/home/koharachan/cathead/site/public/img';

const MAX_BYTES = 300 * 1024;
const WIDTHS = [1200, 640];

const JOBS = [
  { src: 'logo_3d.png', base: 'logo-3d', role: '3D 首屏 logo 渲染图（WebGL 加载失败/首屏占位）' },
  { src: 'mascot_3d.png', base: 'mascot-3d', role: '旧版 3D 吉祥物渲染图（备用，猫娘方案替换后可能不用）' },
];

async function encode(input, width, format, quality, out) {
  let sharped = sharp(input).resize({ width, withoutEnlargement: true });
  if (format === 'webp') {
    sharped = sharped.webp({ quality, alphaQuality: 90, effort: 6 });
  } else {
    sharped = sharped.avif({ quality, effort: 6, chromaSubsampling: '4:2:0' });
  }
  const info = await sharped.toFile(out);
  return info.size;
}

async function main() {
  await mkdir(PUBLIC_IMG, { recursive: true });
  const report = [];
  for (const job of JOBS) {
    const src = path.join(BRAND_3D, job.src);
    try {
      await stat(src);
    } catch {
      console.warn('! 缺少源图，跳过：' + src);
      continue;
    }
    const meta = await sharp(src).metadata();
    console.log('\n' + job.src + '  ' + meta.width + 'x' + meta.height + '  ' + (meta.hasAlpha ? 'alpha' : 'opaque'));
    for (const w of WIDTHS) {
      for (const format of ['webp', 'avif']) {
        let quality = format === 'webp' ? 84 : 52;
        let out = path.join(PUBLIC_IMG, job.base + '-' + w + '.' + format);
        let size = await encode(src, w, format, quality, out);
        // 硬上限 300KB，超了自动降档
        while (size > MAX_BYTES && quality > 30) {
          quality -= 8;
          size = await encode(src, w, format, quality, out);
        }
        const rel = path.relative('/home/koharachan/cathead/site', out);
        console.log('  ' + rel + '  ' + (size / 1024).toFixed(1) + ' KB  q=' + quality);
        report.push({ file: '/' + path.relative('/home/koharachan/cathead/site/public', out), width: w, format, quality, bytes: size, role: job.role });
      }
    }
  }
  const total = report.reduce((a, r) => a + r.bytes, 0);
  console.log('\n合计 ' + report.length + ' 个文件，' + (total / 1024).toFixed(1) + ' KB');
  const over = report.filter((r) => r.bytes > MAX_BYTES);
  if (over.length) {
    console.error('! 仍有超过 300KB 的图：' + over.map((r) => r.file).join(', '));
    process.exitCode = 1;
  }
  return report;
}

main().then((r) => console.log('\n' + JSON.stringify(r, null, 2)));
