/**
 * 导出多语对照全表：node scripts/export-translations.mjs
 * 覆盖：界面文案（i18n）+ 三篇日志正文（posts）+ 九站世界线（worldline）
 * 不依赖额外包：剥掉 import / interface，把 export const 变成 return。
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const LANGS = ['zh', 'yue', 'en', 'ja'];

const loadTs = async (file, exportName) => {
  let src = await readFile(path.join(ROOT, file), 'utf8');
  src = src.replace(/^import[^;]+;$/gm, '');
  src = src.replace(/export interface[\s\S]*?\n}/g, '');
  // 去掉文件里其它导出的函数/类型（例如 milestoneFor），只留目标数据
  src = src.replace(/export function[\s\S]*?\n}/g, '');
  src = src.replace(/export type[^;]+;/g, '');
  const marker = new RegExp('export const ' + exportName + '[^=]*=');
  if (!marker.test(src)) throw new Error('export not found in ' + file);
  src = src.replace(marker, 'return');
  src = src.replace(/^export /gm, '');
  // eslint-disable-next-line no-new-func
  return new Function(src)();
};

const flatten = (obj, prefix = '', acc = {}) => {
  if (obj == null) return acc;
  if (typeof obj === 'string' || typeof obj === 'number') { acc[prefix] = String(obj); return acc; }
  if (Array.isArray(obj)) { obj.forEach((v, i) => flatten(v, prefix + '[' + i + ']', acc)); return acc; }
  for (const k of Object.keys(obj)) flatten(obj[k], prefix ? prefix + '.' + k : k, acc);
  return acc;
};

const esc = (s) => (s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const row = (key, cells) => '| ' + key + ' | ' + cells.map(esc).join(' | ') + ' |';
const HEAD = '| key | 简中 | 粵語 | EN | 日本語 |\n| --- | --- | --- | --- | --- |\n';

let md = '# 多语对照全文\n\n';
md += '> 自动导出，逐条并列。改文案后重跑  node scripts/export-translations.mjs\n';
md += '> 覆盖：界面文案 + 三篇日志正文 + 九站世界线。\n';
let total = 0;

/* ---------- 1. 界面文案 ---------- */
const dicts = {};
for (const l of LANGS) dicts[l] = flatten(await loadTs('src/i18n/' + l + '.ts', l));
const SKIP = /^(lang|htmlLang|ogLocale|path\.|\.href$|fonts)/;
const all = new Set();
for (const l of LANGS) Object.keys(dicts[l]).forEach((k) => { if (!SKIP.test(k)) all.add(k); });
const groups = {};
for (const key of all) { const top = key.split(/[.[]/)[0]; (groups[top] ||= []).push(key); }

md += '\n---\n\n## 一、界面文案\n';
for (const top of Object.keys(groups)) {
  md += '\n### ' + top + '\n\n' + HEAD;
  for (const k of groups[top].sort()) {
    const cells = LANGS.map((l) => dicts[l][k]);
    if (cells.every((v) => !v)) continue;
    total += 1;
    md += row(k, cells) + '\n';
  }
}

/* ---------- 2. 日志正文 ---------- */
const posts = await loadTs('src/data/posts.ts', 'posts');
md += '\n---\n\n## 二、日志正文\n';
for (const post of posts) {
  md += '\n### ' + post.slug + '（' + post.date + '）\n\n' + HEAD;
  md += row('title', LANGS.map((l) => post[l]?.title)) + '\n';
  md += row('excerpt', LANGS.map((l) => post[l]?.excerpt)) + '\n';
  md += row('epigraph', LANGS.map((l) => post[l]?.epigraph)) + '\n';
  const n = Math.max(...LANGS.map((l) => post[l]?.body?.length ?? 0));
  for (let i = 0; i < n; i += 1) {
    md += row('body[' + i + '].h', LANGS.map((l) => post[l]?.body?.[i]?.h)) + '\n';
    md += row('body[' + i + '].p', LANGS.map((l) => post[l]?.body?.[i]?.p)) + '\n';
  }
  total += 4 + n * 2;
}

/* ---------- 3. 世界线 ---------- */
const worldline = await loadTs('src/data/worldline.ts', 'worldline');
md += '\n---\n\n## 三、世界线\n\n' + HEAD;
for (const m of worldline) {
  md += row(m.no + ' ' + m.date, LANGS.map((l) => m[l]?.title)) + '\n';
  md += row(m.no + ' ' + m.date + ' · body', LANGS.map((l) => m[l]?.body)) + '\n';
  total += 2;
}

const out = '/home/koharachan/meowhead/translations.md';
await writeFile(out, md, 'utf8');
console.log('rows', total, '->', out);
