import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * 404 诗：按「DeepSeek V4 分词器」的观感切 token，每个 token 一块彩色圆角底，
 * 非匀速打字机逐块出现。
 *
 * - 中文：先尝试双字合并（模拟 BPE merge），否则单字；标点独立成 token
 * - 英文：按词切，长词再按 3~4 字母切子词（模拟 subword）
 * - 每个 token 取调色板里的下一个颜色（确定性，不用随机）
 * - SSR 直接输出完整诗句：没 JS 也读得到，reduced-motion 直接全显
 */

const PALETTE = [
  'rgba(255, 90, 26, 0.18)',
  'rgba(20, 18, 16, 0.06)',
  'rgba(255, 90, 26, 0.32)',
  'rgba(20, 18, 16, 0.12)',
  'rgba(255, 90, 26, 0.09)',
  'rgba(20, 18, 16, 0.04)',
];

/** 常见双字合并表（只影响观感，不追求和真分词器完全一致） */
const MERGES = new Set([
  // 通用
  '地址', '存在', '不是', '你的', '我们', '没写', '这一', '页面', '往回', '一格',
  '或者', '从头', '再来', '她在', '这里', '等你', '没有', '错字', '删了', '可以',
  '下面', '这些', '地方',
  // 当前这首诗（B 版）
  '这个', '查无', '此项', '是我', '这边', '少写', '一段', '再点', '一次',
  '说不', '说不定', '有了', '举着', '地图', '在等', '着地',
]);

/** 三字合并（BPE 里也会出现），优先于双字 */
const MERGES3 = new Set(['说不定']);

const PUNCT = /[，。！？、；：「」『』（）,.!?;:\-—…]/;

function tokenizeZh(text: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (PUNCT.test(ch)) {
      out.push(ch);
      i += 1;
      continue;
    }
    const tri = text.slice(i, i + 3);
    if (tri.length === 3 && !PUNCT.test(tri) && MERGES3.has(tri)) {
      out.push(tri);
      i += 3;
      continue;
    }
    const pair = text.slice(i, i + 2);
    if (pair.length === 2 && !PUNCT.test(pair[1]) && MERGES.has(pair)) {
      out.push(pair);
      i += 2;
      continue;
    }
    out.push(ch);
    i += 1;
  }
  return out;
}

function tokenizeEn(text: string): string[] {
  const out: string[] = [];
  for (const word of text.split(/\s+/)) {
    if (!word) continue;
    if (PUNCT.test(word) && word.length <= 2) {
      out.push(word);
      continue;
    }
    const clean = word.replace(/[,.;:!?]+$/, '');
    const tail = word.slice(clean.length);
    if (clean.length <= 6) {
      out.push(clean);
    } else {
      let pos = 0;
      while (pos < clean.length) {
        const size = pos === 0 ? 4 : 4;
        out.push(clean.slice(pos, pos + size));
        pos += size;
      }
    }
    if (tail) out.push(tail);
  }
  return out;
}

export default function TypedPoem({
  linesZh,
  linesEn,
  linesZhAlt,
  linesEnAlt,
  linesYue,
  ariaLabel,
}: {
  linesZh: string[];
  linesEn: string[];
  /** 备选文本：当 <html data-region="global"> 时使用（403 页按地区换诗） */
  linesZhAlt?: string[];
  linesEnAlt?: string[];
  /** 粤语版 */
  linesYue?: string[];
  ariaLabel: string;
}) {
  const [locale, setLocale] = useState<'zh' | 'en' | 'yue'>('zh');
  const [region, setRegion] = useState<'cn' | 'global'>('cn');
  /** 9999 = 全部可见（SSR 与无 JS 时的状态） */
  const [shown, setShown] = useState(9999);
  const [started, setStarted] = useState(false);
  const timers = useRef<number[]>([]);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const l = document.documentElement.dataset.locale;
    if (l === 'en') setLocale('en');
    if (l === 'yue' && linesYue) setLocale('yue');
    if (document.documentElement.dataset.region === 'global' && linesZhAlt) setRegion('global');
  }, [linesZhAlt]);

  const lines =
    region === 'global' && linesZhAlt && linesEnAlt
      ? locale === 'en'
        ? linesEnAlt
        : linesZhAlt
      : locale === 'yue' && linesYue
        ? linesYue
        : locale === 'en'
          ? linesEn
          : linesZh;

  const tokens = useMemo(() => {
    const all: { text: string; line: number; idx: number; punct: boolean }[] = [];
    lines.forEach((line, li) => {
      const parts = locale === 'en' ? tokenizeEn(line) : tokenizeZh(line);
      parts.forEach((p, pi) => {
        all.push({ text: p, line: li, idx: pi, punct: PUNCT.test(p) });
      });
    });
    return all;
  }, [lines, locale]);

  /* 挂载后先把 token 收起来（诗在首屏之外，闪一下也看不见），滚到再打 */
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    setShown(0);
  }, []);

  /* 非匀速：基础间隔 + 伪随机抖动 + 标点后停顿；进入视口才启动 */
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = root.current;
    if (reduce || !el) return;

    let startedTyping = false;

    const type = () => {
      if (startedTyping) return;
      startedTyping = true;
      setStarted(true);

      let seed = 20261104;
      const rand = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
      };

      let at = 260;
      tokens.forEach((tok, i) => {
        const id = window.setTimeout(() => setShown(i + 1), at);
        timers.current.push(id);
        let gap = 52 + rand() * 115;
        if (tok.punct) gap += 210;
        if (tok.idx === 0) gap += 140;
        at += gap;
      });
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          type();
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
  }, [tokens]);

  /* 点一下直接看全 */
  const skip = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setShown(tokens.length);
  };

  let running = 0;

  return (
    <div className="poem" ref={root} data-typing={started ? 'true' : 'false'} onClick={skip} role="presentation">
      <p className="sr-only" aria-label={ariaLabel}>
        {lines.join(' ')}
      </p>

      <div aria-hidden="true">
        {lines.map((line, li) => (
          <p className="poem__line" key={li}>
            {(locale === 'en' ? tokenizeEn(line) : tokenizeZh(line)).map((text, ti) => {
              const index = running++;
              const on = index < shown;
              return (
                <span
                  className="poem__tok"
                  key={`${li}-${ti}`}
                  data-on={on ? 'true' : 'false'}
                  style={{ backgroundColor: PALETTE[index % PALETTE.length] }}
                >
                  {text}
                </span>
              );
            })}
          </p>
        ))}
      </div>
    </div>
  );
}
