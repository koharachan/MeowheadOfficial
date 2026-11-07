#!/usr/bin/env node
/**
 * build-favicons.mjs — 生成完整 favicon / PWA 图标套件到 site/public/。
 *
 * 设计：奶白 #FFF9F1 方形底 + 墨黑/亮橙 mark（取自 brand/logo_final/mark_primary.svg，
 *       与 brand/logo_final/size_*.png 同一版 logo；旧的 brand/deliver/app_icon.svg 的
 *       mark 是上一版几何，已不再使用，避免 SVG 图标与 PNG 图标不同源）。
 *
 * 产物（全部落在 /home/koharachan/cathead/site/public/）：
 *   favicon.ico            16+32+48，直接取 logo_final/size_{16,32,48}.png
 *   favicon.svg            矢量版（奶白方底 + mark）
 *   apple-touch-icon.png   180x180（不透明，iOS 自己切圆角）
 *   icon-192.png           192x192（manifest "any"）
 *   icon-512.png           512x512（manifest "any"）
 *   maskable-512.png       512x512（mark 缩到 86%，落在 80% 安全区内）
 *   manifest.webmanifest
 *
 * 依赖 sharp：cd /home/koharachan/assetwork && npm i sharp
 * 运行：node /home/koharachan/cathead/site/scripts/build-favicons.mjs
 */

import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const sharp = require('/home/koharachan/assetwork/node_modules/sharp');

const BRAND_FINAL = '/home/koharachan/cathead/brand/logo_final';
const SITE = '/home/koharachan/cathead/site';
const PUBLIC = path.join(SITE, 'public');

const BG = '#FFF9F1';
const INK = '#141210';
const ORANGE = '#FF5A1A';

const MARK_SVG = path.join(BRAND_FINAL, 'mark_primary.svg');

// mark_primary.svg 里 mark 的视觉 bbox（1000x1000 画布内实测）：x 129-871, y 228-901
const MARK_CX = 500;
const MARK_CY = 564.5;

function composeSvg(markSvg, scale) {
  const inner = markSvg
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">' +
    '<rect width="1000" height="1000" fill="' + BG + '"/>' +
    '<g transform="translate(' + MARK_CX + ' ' + MARK_CY + ') scale(' + scale + ') translate(' + -MARK_CX + ' ' + -MARK_CY + ')">' +
    inner +
    '</g></svg>'
  );
}

async function renderSvg(svg, size, out) {
  await sharp(Buffer.from(svg), { density: Math.max(96, Math.round((size / 1000) * 72 * 4)) })
    .resize(size, size, { fit: 'contain' })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(out);
  const meta = await sharp(out).metadata();
  const bytes = (await readFile(out)).length;
  console.log('  ' + path.relative(SITE, out) + '  ' + meta.width + 'x' + meta.height + '  ' + (bytes / 1024).toFixed(1) + ' KB');
  return bytes;
}

/** 手工拼 ICO（PNG 压缩层，Windows Vista+/所有现代浏览器都支持）。 */
async function buildIco(pngPaths, out) {
  const entries = [];
  for (const p of pngPaths) {
    const buf = await readFile(p);
    const meta = await sharp(p).metadata();
    entries.push({ buf, w: meta.width, h: meta.height });
  }
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // type = icon
  header.writeUInt16LE(entries.length, 4);
  const dir = Buffer.alloc(16 * entries.length);
  let offset = 6 + dir.length;
  entries.forEach((e, i) => {
    const o = i * 16;
    dir.writeUInt8(e.w >= 256 ? 0 : e.w, o);
    dir.writeUInt8(e.h >= 256 ? 0 : e.h, o + 1);
    dir.writeUInt8(0, o + 2); // palette
    dir.writeUInt8(0, o + 3); // reserved
    dir.writeUInt16LE(1, o + 4); // color planes
    dir.writeUInt16LE(32, o + 6); // bits per pixel
    dir.writeUInt32LE(e.buf.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += e.buf.length;
  });
  const ico = Buffer.concat([header, dir, ...entries.map((e) => e.buf)]);
  await writeFile(out, ico);
  console.log('  ' + path.relative(SITE, out) + '  ' + (ico.length / 1024).toFixed(1) + ' KB  (' + entries.map((e) => e.w + 'x' + e.h).join(' + ') + ')');
  return ico.length;
}

async function main() {
  await mkdir(PUBLIC, { recursive: true });
  const markSvg = await readFile(MARK_SVG, 'utf8');
  const summary = [];

  console.log('favicon.ico（取 logo_final/size_16/32/48.png）');
  const icoBytes = await buildIco(
    [16, 32, 48].map((n) => path.join(BRAND_FINAL, 'size_' + n + '.png')),
    path.join(PUBLIC, 'favicon.ico')
  );
  summary.push({ file: '/favicon.ico', bytes: icoBytes, note: '16+32+48' });

  console.log('favicon.svg');
  await writeFile(path.join(PUBLIC, 'favicon.svg'), composeSvg(markSvg, 1), 'utf8');
  const svgBytes = (await readFile(path.join(PUBLIC, 'favicon.svg'))).length;
  console.log('  favicon.svg  ' + (svgBytes / 1024).toFixed(1) + ' KB');
  summary.push({ file: '/favicon.svg', bytes: svgBytes, note: '矢量，奶白底 + mark' });

  console.log('PNG 图标');
  const svgStandard = composeSvg(markSvg, 1);
  const svgMaskable = composeSvg(markSvg, 0.86);
  summary.push({ file: '/apple-touch-icon.png', bytes: await renderSvg(svgStandard, 180, path.join(PUBLIC, 'apple-touch-icon.png')), note: '180 iOS' });
  summary.push({ file: '/icon-192.png', bytes: await renderSvg(svgStandard, 192, path.join(PUBLIC, 'icon-192.png')), note: '192 PWA any' });
  summary.push({ file: '/icon-512.png', bytes: await renderSvg(svgStandard, 512, path.join(PUBLIC, 'icon-512.png')), note: '512 PWA any' });
  summary.push({ file: '/maskable-512.png', bytes: await renderSvg(svgMaskable, 512, path.join(PUBLIC, 'maskable-512.png')), note: '512 maskable' });

  console.log('manifest.webmanifest');
  const manifest = {
    name: '猫猫头网络科技',
    short_name: '猫猫头',
    description: 'MAOMAOTOU NETWORK TECHNOLOGY · 猫猫头网络科技 — 数字化转型与软件工程服务',
    lang: 'zh-CN',
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: BG,
    theme_color: INK,
    categories: ['business', 'technology', 'productivity'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
  const manifestOut = path.join(PUBLIC, 'manifest.webmanifest');
  await writeFile(manifestOut, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  const manBytes = (await readFile(manifestOut)).length;
  console.log('  manifest.webmanifest  ' + (manBytes / 1024).toFixed(1) + ' KB');
  summary.push({ file: '/manifest.webmanifest', bytes: manBytes, note: 'PWA manifest' });

  // 品牌色，供 CSS 参考
  console.log('\n品牌色：墨黑 ' + INK + ' / 奶白 ' + BG + ' / 亮橙 ' + ORANGE);
  const total = summary.reduce((a, s) => a + s.bytes, 0);
  console.log('图标套件合计 ' + (total / 1024).toFixed(1) + ' KB');
  console.log(JSON.stringify(summary, null, 2));
}

main();
