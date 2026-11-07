/**
 * 导出多语对照全表：node scripts/export-translations.mjs
 * 直接用 node 的类型剥离能力加载 .ts（Node 22.6+ 需 --experimental-strip-types，
 * 这里改成把三份词典当纯文本处理：用正则取出导出对象再 eval，避免额外依赖）。
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const LANGS = ['zh', 'yue', 'en', 'ja'];

const load = async (lang) => {
  const src = await readFile(path.join(ROOT, 'src/i18n', lang + '.ts'), 'utf8');
  // 去掉 import 与类型标注
  const body = src
    .replace(/^import[^;]+;$/gm, '')
    .replace(/^export const \w+: Dict =/m, 'return');
  // eslint-disable-next-line no-new-func
  return new Function(body)();
};

const flatten = (obj, prefix = '', acc = {}) => {
  if (obj == null) return acc;
  if (typeof obj === 'string' || typeof obj === 'number') {
    acc[prefix] = String(obj);
    return acc;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => flatten(v, prefix + '[' + i + ']', acc));
    return acc;
  }
  for (const k of Object.keys(obj)) flatten(obj[k], prefix ? prefix + '.' + k : k, acc);
  return acc;
};

const dicts = {};
for (const l of LANGS) dicts[l] = flatten(await load(l));

// 内部字段不进对照表
const SKIP = /^(lang|htmlLang|ogLocale|path\.|\.href$|fonts)/;
const all = new Set();
for (const l of LANGS) Object.keys(dicts[l]).forEach((k) => { if (!SKIP.test(k)) all.add(k); });

const groups = {};
for (const key of all) {
  const top = key.split(/[.[]/)[0];
  (groups[top] ||= []).push(key);
}

const esc = (s) => (s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
let md = '# 多语对照全文\n\n';
md += '> 由 src/i18n/{zh,yue,en,ja}.ts 自动导出，逐条并列。改动文案后重跑 `node scripts/export-translations.mjs`。\n\n';
let total = 0;
for (const top of Object.keys(groups)) {
  md += '\n## ' + top + '\n\n';
  md += '| key | 简中 | 粵語 | EN | 日本語 |\n| --- | --- | --- | --- | --- |\n';
  for (const k of groups[top].sort()) {
    const row = LANGS.map((l) => esc(dicts[l][k]));
    if (row.every((v) => !v)) continue;
    total += 1;
    md += '| ' + k + ' | ' + row.join(' | ') + ' |\n';
  }
}
const out = path.join(ROOT, '..', 'translations.md');
await writeFile(out, md, 'utf8');
console.log('rows', total, 'groups', Object.keys(groups).length, '->', out);
