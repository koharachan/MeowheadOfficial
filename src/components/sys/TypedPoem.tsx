/*
404 / 403 页上那首「打字机诗」：按 DeepSeek V4 分词器的观感把诗切成一块块 token，
每块垫一个彩色圆角底，滚到这一屏后逐块冒出来；点一下直接看全。

  - 中文：先试三字合并、再试双字合并（模拟 BPE merge），否则单字；标点单独成块
  - 英文：按词切，超过 6 个字母的长词再按 4 个字母切子词（模拟 subword）
  - 颜色按顺序从调色板里取，不用随机：同一首诗每次打开长得一样
  - 没有 JS、或者用户开了「减少动态效果」：直接整首显示（SSR 输出的就是完整诗句）

在 Astro 页面里这样调用（client:idle = 首屏空下来再接管）：

  <TypedPoem
    client:idle
    linesZh={poemZh}          // 中文原版
    linesEn={poemEn}          // 英文版
    linesYue={poemYue}        // 粤语版（可选）
    linesZhAlt={poemZhGlobal} // 海外版中文（可选，403 页按地区换诗）
    linesEnAlt={poemEnGlobal} // 海外版英文（可选）
    linesJa={poemJaCn}        // 日语版（可选）
    linesJaAlt={poemJaGlobal} // 海外版日语（可选）
    ariaLabel="404 诗：……"    // 整首诗的读屏文字
  />

语言和地区不是 props，而是从 <html data-locale / data-region> 上读的（全站只有这一处来源）。
样式在 styles/islands.css 的 .poem* 里；这里只负责 data-typing / data-on 这两个开关。
*/
import { useEffect, useMemo, useRef, useState } from 'react';

// --- 观感用的几张表 ---

/** token 的底色，按顺序循环取。橙色是品牌色，墨色几档深浅用来分隔相邻的 token */
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

/** 中文标点：碰到就单独成块，不参与合并。英文那几个也一并收进来，中英混排时一样处理 */
const PUNCT = /[，。！？、；：「」『』（）,.!?;:\-—…]/;

// --- 把一行字切成 token ---

/** 中文按「三字优先、双字其次、否则单字」切：这样切出来才像真分词器的样子，
    读的人看得到「说不定」是一块、「地图」是一块，而不是清一色单字 */
function tokenizeZh(text: string): string[] {
  const pieces: string[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (PUNCT.test(ch)) {
      pieces.push(ch);          // 标点自己一块
      i += 1;
      continue;
    }
    const triple = text.slice(i, i + 3);
    if (triple.length === 3 && !PUNCT.test(triple) && MERGES3.has(triple)) {
      pieces.push(triple);      // 「说不定」这种三字词，优先级最高
      i += 3;
      continue;
    }
    const pair = text.slice(i, i + 2);
    if (pair.length === 2 && !PUNCT.test(pair[1]) && MERGES.has(pair)) {
      pieces.push(pair);        // 常见双字词，合成一块
      i += 2;
      continue;
    }
    pieces.push(ch);            // 都不是，就单字一块
    i += 1;
  }
  return pieces;
}

/** 英文按词切；超过 6 个字母的长词按 4 个字母断开（模拟 subword），
    词尾的逗号句号再拆出来单独成块，和中文的标点一样处理 */
function tokenizeEn(text: string): string[] {
  const pieces: string[] = [];
  for (const word of text.split(/\s+/)) {
    if (!word) continue;                                   // 连续空格切出来的空串丢掉
    if (PUNCT.test(word) && word.length <= 2) {
      pieces.push(word);                                   // 单独一个标点，原样一块
      continue;
    }
    const clean = word.replace(/[,.;:!?]+$/, '');          // 去掉词尾标点
    const tail = word.slice(clean.length);                 // 去掉的那部分，等会儿单独补回去
    if (clean.length <= 6) {
      pieces.push(clean);                                  // 短词整块留着，看着更像「一个词」
    } else {
      let pos = 0;
      while (pos < clean.length) {
        const size = 4;                                    // 长词一律 4 字母一截（原来是 pos===0?4:4，写死成 4 行为不变）
        pieces.push(clean.slice(pos, pos + size));
        pos += size;
      }
    }
    if (tail) pieces.push(tail);                           // 词尾标点自己一块
  }
  return pieces;
}

// --- 组件本体 ---

export default function TypedPoem({
  linesZh,
  linesEn,
  linesZhAlt,
  linesEnAlt,
  linesYue,
  linesJa,
  linesJaAlt,
  ariaLabel,
}: {
  linesZh: string[];
  linesEn: string[];
  /** 备选文本：当 <html data-region="global"> 时使用（403 页按地区换诗） */
  linesZhAlt?: string[];
  linesEnAlt?: string[];
  /** 粤语版 */
  linesYue?: string[];
  /** 日语版 */
  linesJa?: string[];
  linesJaAlt?: string[];
  ariaLabel: string;
}) {
  const [locale, setLocale] = useState<'zh' | 'en' | 'yue' | 'ja'>('zh'); // 读哪一版：默认中文
  const [region, setRegion] = useState<'cn' | 'global'>('cn');            // 国内还是海外版：决定用不用 *Alt 那几版
  /** 已经露出几个 token。9999 = 全部可见（SSR 与无 JS 时的状态） */
  const [shownCount, setShownCount] = useState(9999);
  const [isTyping, setIsTyping] = useState(false);   // 打字机开没开：给样式用来收起提示
  const typingTimers = useRef<number[]>([]);          // 每个 token 的定时器句柄，点一下或卸载时要全部清掉
  const root = useRef<HTMLDivElement>(null);          // 整首诗，用来判断有没有滚进视口

  /* 语言和地区写在 <html data-locale / data-region> 上：刷新后就定下来了，
     这里只在「海外版文本有没有传」变化时重读一次，所以依赖只有 linesZhAlt */
  useEffect(() => {
    const l = document.documentElement.dataset.locale;
    if (l === 'en') setLocale('en');
    if (l === 'yue' && linesYue) setLocale('yue');   // 没传粤语版就老实待在中文，不显示空白
    if (l === 'ja' && linesJa) setLocale('ja');
    if (document.documentElement.dataset.region === 'global' && linesZhAlt) setRegion('global');
  }, [linesZhAlt]);

  // --- 挑这一遍该读哪一首诗 ---

  /** 按「地区 + 语言」挑诗：先看是不是海外版，再看语言，都没有就回落到中文原版。
      顺序有讲究：海外版优先于语言，否则海外用户会看到国内那一版 */
  const pickLines = (): string[] => {
    if (region === 'global' && locale === 'ja' && linesJaAlt) return linesJaAlt; // 海外日语单独一版
    if (region === 'global' && linesZhAlt && linesEnAlt) {
      return locale === 'en' ? linesEnAlt : linesZhAlt;                          // 海外版：中英各一版
    }
    if (locale === 'ja' && linesJa) return linesJa;
    if (locale === 'yue' && linesYue) return linesYue;
    if (locale === 'en') return linesEn;
    return linesZh;                                                              // 其余一律中文原版
  };

  const lines = pickLines();

  /* 把整首诗切成 token，同时记下它属于第几行、行内第几个、是不是标点：
     后面控制「露出到第几个」全靠这个扁平表，切一次就够了 */
  const tokens = useMemo(() => {
    const all: { text: string; line: number; idx: number; punct: boolean }[] = [];
    lines.forEach((line, li) => {
      const parts = locale === 'en' ? tokenizeEn(line) : tokenizeZh(line); // 英文换一套切法
      parts.forEach((p, pi) => {
        all.push({ text: p, line: li, idx: pi, punct: PUNCT.test(p) });
      });
    });
    return all;
  }, [lines, locale]);

  /* 挂载后先把 token 收起来（诗在首屏之外，闪一下也看不见），滚到再打 */
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;          // 开了「减少动态效果」就保持 9999 全显
    setShownCount(0);            // 否则从空白开始等
  }, []);

  /* 非匀速：基础间隔 + 伪随机抖动 + 标点后停顿；进入视口才启动，只启动一次 */
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = root.current;
    if (reduce || !el) return;

    let startedTyping = false;   // 只打一遍：进出视口不重播

    const startTyping = () => {
      if (startedTyping) return;
      startedTyping = true;
      setIsTyping(true);

      // 固定种子的伪随机：每次刷新的节奏一模一样。换 Math.random 会变成「这次特别快、下次特别卡」
      let seed = 20261104;
      const rand = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;   // 线性同余，够用又不引库
        return seed / 0x7fffffff;
      };

      let at = 260;   // 进视口后先空 260ms（约四分之一秒），等人眼睛落到诗上再开始
      tokens.forEach((tok, i) => {
        const id = window.setTimeout(() => setShownCount(i + 1), at); // 到点就多露一块
        typingTimers.current.push(id);
        let gap = 52 + rand() * 115;   // 基础 52ms、随机再多最多 115ms：快慢不匀才像在敲
        if (tok.punct) gap += 210;     // 标点后停一下，像换气
        if (tok.idx === 0) gap += 140; // 每行开头也顿一下，读起来才有句子
        at += gap;
      });
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          startTyping();
          io.disconnect();   // 打过一遍就不用再观察
        }
      },
      { threshold: 0.25 }    // 露出四分之一才开打，一露头就打会被人错过
    );
    io.observe(el);

    return () => {
      io.disconnect();
      typingTimers.current.forEach((t) => window.clearTimeout(t)); // 卸载时把没跑完的定时器清掉
      typingTimers.current = [];
    };
  }, [tokens]);

  /* 点一下直接看全 */
  const showAll = () => {
    typingTimers.current.forEach((t) => window.clearTimeout(t));  // 先停掉还在排队的
    typingTimers.current = [];
    setShownCount(tokens.length);
  };

  let tokenNo = 0;   // 渲染时的全局编号：和上面的扁平表同序，用来判断「这块该露了吗」

  return (
    <div className="poem" ref={root} data-typing={isTyping ? 'true' : 'false'} onClick={showAll} role="presentation">
      {/* 读屏读整首，不受打字机进度影响 */}
      <p className="sr-only" aria-label={ariaLabel}>
        {lines.join(' ')}
      </p>

      {/* 逐块显示的那一层对读屏是噪音，整层藏起来 */}
      <div aria-hidden="true">
        {lines.map((line, li) => (
          <p className="poem__line" key={li}>
            {/* 这里按行再切一遍：和上面 tokens 用的是同一个函数，切法一定一致，序号才对得上 */}
            {(locale === 'en' ? tokenizeEn(line) : tokenizeZh(line)).map((text, ti) => {
              const index = tokenNo++;              // 这块在整首诗里的序号
              const on = index < shownCount;        // 已经打到了吗
              return (
                <span
                  className="poem__tok"
                  key={`${li}-${ti}`}
                  data-on={on ? 'true' : 'false'}
                  style={{ backgroundColor: PALETTE[index % PALETTE.length] }} // 循环取色，同一块每次颜色都一样
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
