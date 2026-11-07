/**
 * 千禧年兼容页的后处理：
 * Astro 会把所有页面的 doctype 统一改写成 <!DOCTYPE html>，IE6 会因此进怪异模式。
 * 这里把 /ie/ 与 /en/ie/ 换回 HTML 4.01 Transitional，并剥掉 Astro 的 scoped 属性。
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const TARGETS = ['dist/ie/index.html', 'dist/en/ie/index.html'];
const LEGACY_DOCTYPE =
  '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">';

let changed = 0;
for (const file of TARGETS) {
  if (!existsSync(file)) continue;
  let html = await readFile(file, 'utf8');
  const before = html;
  html = html.replace(/^<!DOCTYPE html>/i, LEGACY_DOCTYPE);
  // 去掉 Astro 注入的作用域属性
  html = html.replace(/\sdata-astro-cid-[a-z0-9]+(?==|\s|>)/g, '');
  if (html !== before) {
    await writeFile(file, html, 'utf8');
    changed += 1;
    console.log('[legacy] patched', file);
  }
}
if (!changed) console.log('[legacy] nothing to patch');
