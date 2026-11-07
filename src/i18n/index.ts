import type { Dict, Lang } from './types';
import { zh } from './zh';
import { en } from './en';
import { yue } from './yue';
import { ja } from './ja';

export type { Dict, Lang };
export * from './types';

const dicts: Record<Lang, Dict> = { zh, en, yue, ja };

export function getDict(lang: Lang): Dict {
  return dicts[lang];
}

/** 极简 i18n：单页站不需要运行时切换，构建期就决定语言。 */
export function useDict(lang: Lang): Dict {
  return getDict(lang);
}

/** 语言顺序固定：中文 → 粤语 → English */
export const LANGS: Lang[] = ['zh', 'yue', 'en', 'ja'];

export function otherLang(lang: Lang): Lang {
  return lang === 'zh' ? 'en' : 'zh';
}

/** 去掉语言前缀后的基线路径；'/' 保持 '/' */
export function basePath(pathname: string): string {
  const stripped = pathname.replace(/^\/(en|yue|ja)(?=\/|$)/, '');
  return stripped === '' ? '/' : stripped;
}

/** 由基线路径推出某语言的路径 */
export function pathFor(lang: Lang, base: string): string {
  const b = base === '/' ? '/' : base;
  if (lang === 'zh') return b;
  return '/' + lang + (b === '/' ? '/' : b);
}
