/*
全站左侧那根叙事轴（#rail）：
  - 一根竖轴，十个章节各一根刻度，读过的部分染成橙色，橙线末端跟着滚动连续往下走
  - tible 站在轴上，随滚动换表情
  - 压在深色屏上时自己换成「白描边 + 黑填充」，压回奶白屏又换回来（逐根刻度实测底色，不是按章节猜）
  - 点某根刻度 = 滚到那一章，让刻度落在屏幕中线上
  - 窄屏（≤720px）由样式收成右侧极简刻度，逻辑不变

在 Astro 页面里调用（client:idle 让它进页面后自己接管，不需要父级再传滚动事件）：

  <NarrativeRail
    client:idle
    chapters={t.chapters}                    // 章节表：id 必须等于页面里那一屏的 id
    bgOf={t.chapters.map((c) => darkOf(c.id))}  // 每章底色明暗，1 = 深底（可选，不传就按 .on-dark 判）
    ariaLabel={t.ux.sectionNav}
    mascotAlt={t.mascot.companion.alt}
    mascot={{ idle: '/img/mascot/tible-idle.webp', happy: '...', sleep: '...', alert: '...' }}
  />

依赖页面里已有的结构：每章的 section 需要 id，轴的样式和测量都靠这几条类名
（.rail / .rail__track / .rail__tick / .rail__seg / .rail__fill 都在 styles/islands.css）。
*/
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

/** 一个章节：no 是刻度上显示的编号，short 是轴上显示的短标题，label 是读屏用的全称 */
export interface Chapter {
  id: string;    // 对应页面里那一屏 section 的 id
  no: string;    // 「01」这种编号
  label: string; // 章节全称，只给读屏和 aria-label 用
  short: string; // 轴上实际显示的两三个字
}

/** 一章在「整页可滚动高度」里占的那一段：from/to 是 0~1 的比例，dark 是这一段的底深不深 */
type Span = { from: number; to: number; dark: boolean };

// --- 读屏幕上的实际底色 ---

/** 屏幕点 (x, y) 底下是不是深色：取该点最上层的页面元素（跳过轴自己），
    先看它有没有 .on-dark 祖先，再沿祖先链找第一层不透明背景，按亮度判。
    用「实际渲染出来的颜色」而不是「按章节建表」，是因为同一章里也可能压着别的底色 */
const isDarkAt = (x: number, y: number): boolean => {
  const hit = document.elementsFromPoint(x, y).find((node) => !node.closest('.rail')); // 点底下最上层的页面元素
  if (!hit) return false;                                             // 点到轴外面去了，当浅底
  if (hit.closest('.on-dark')) return true;                           // 设计上标了深色的片区，直接算深
  let node: Element | null = hit;                                     // 从这一层开始往上找背景色
  while (node && node !== document.documentElement) {
    const color = /rgba?\(([\d.]+), ?([\d.]+), ?([\d.]+)(?:, ?([\d.]+))?\)/.exec(getComputedStyle(node).backgroundColor);
    if (color) {                                                      // 找到第一层不透明背景就停下
      const alpha = color[4] === undefined ? 1 : Number(color[4]);    // 没写 alpha 就是全不透明
      // 透明度够高才算「这层的底」；亮度用和人眼接近的加权公式，96 以下看着就是黑的
      if (alpha > 0.5) return 0.2126 * +color[1] + 0.7152 * +color[2] + 0.0722 * +color[3] < 96;
    }
    node = node.parentElement;                                        // 这层透明，继续往上
  }
  return false;                                                       // 整条链都没背景，当浅底
};

/** 元素在文档里的纵坐标：沿 offsetParent 一路累加 offsetTop。
    不用 getBoundingClientRect，是因为它算的是「此刻屏幕上」的位置，
    而 sticky 的长屏章节会一直贴在屏幕上、滚动时不动，量出来的章顶是假的 */
const docTop = (el: HTMLElement): number => {
  let y = 0;
  let node: HTMLElement | null = el;
  while (node) {
    y += node.offsetTop;                       // 加上自己相对 offsetParent 的偏移
    node = node.offsetParent as HTMLElement | null; // 换到上一层，直到文档根
  }
  return y;
};

/** 每章此刻的章顶纵坐标；页面里找不到那一屏就给 null（比如别的页面复用了这个轴） */
const readChapterTops = (chapters: Chapter[]): (number | null)[] =>
  chapters.map((chapter) => {
    const el = document.getElementById(chapter.id);
    return el ? docTop(el as HTMLElement) : null;
  });

// --- 轴本体 ---

export default function NarrativeRail({ chapters, mascot, ariaLabel, mascotAlt, bgOf }: {
  chapters: Chapter[];
  mascot: { idle: string; happy: string; sleep: string; alert: string };
  ariaLabel: string;
  mascotAlt: string;
  /** 每章底色的明暗，1 = 深底。由 Astro 侧在构建期算好传进来（脚本里读不到别的页面的 computed style） */
  bgOf?: number[];
}) {
  const [active, setActive] = useState(0);          // 当前是第几章（0 起）
  const [chapterProgress, setChapterProgress] = useState(0); // 当前章读到哪儿：0 = 刚到章顶，1 = 到下一章章顶
  const [ready, setReady] = useState(false);        // 分段算好了没有（没算好时先不显示橙线，免得闪一下）
  const [spans, setSpans] = useState<Span[]>([]);   // 每章在整页进度里占的那一段
  // 每根刻度此刻的皮肤（true = 压在深底上）。必须逐根量：
  // 轴是一架固定的梯子，压在黑底上的那几根如果按「本章是深色」整体染黑，就会变成黑底上的墨线、直接看不见
  const [liveSkin, setLiveSkin] = useState<boolean[] | null>(null);
  const spansRef = useRef<Span[]>([]);               // 给不重渲染的地方用（滚动回调里读）
  const raf = useRef(0);                            // 滚动回调排到下一帧的句柄，用来合并高频滚动
  const navRef = useRef<HTMLElement | null>(null);  // 轴自己，量刻度和滚到章节都要用

  // 第一根刻度中心相对轨道顶的距离、相邻两根刻度的间距。默认值是桌面端的常见值，真正的数在布局后被量出来覆盖
  const [firstTickCenter, setFirstTickCenter] = useState(17);
  const [tickGap, setTickGap] = useState(35);

  /** 一章的底色深不深：优先用页面传进来的表；没传就看这一屏有没有 .on-dark */
  const darkOf = (id: string, i: number): boolean => {
    if (bgOf && typeof bgOf[i] === 'number') return bgOf[i] > 0.55; // 0.55 是「明显偏暗」的分界，不是精确阈值
    return !!document.getElementById(id)?.classList.contains('on-dark');
  };

  // --- 把整页进度切成每章一段 ---
  useEffect(() => {
    const buildSpans = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight; // 整页能滚多远
      const tops = chapters.map((chapter, i) => {
        const el = document.getElementById(chapter.id);      // 这一章的 section
        return { i, id: chapter.id, top: el ? docTop(el as HTMLElement) : 0 }; // 章顶在文档里的位置
      });
      const next: Span[] = [];
      let prevTo = 0;                                        // 上一段的终点，用来保证段与段首尾相接
      tops.forEach((chapter, k) => {
        const nextTop = tops[k + 1]?.top ?? max;             // 下一章的章顶；最后一章到页底
        const from = k === 0 ? 0 : max > 0 ? chapter.top / max : 0;  // 这一段的起点（占整页的比例）
        const to = k === tops.length - 1 ? 1 : max > 0 ? nextTop / max : 1; // 这一段的终点
        next.push({ from: Math.min(prevTo, to), to, dark: darkOf(chapter.id, chapter.i) }); // 章顶偶尔会互相越过，取小的那个
        prevTo = to;
      });
      next[0] = { ...next[0], from: 0 };                     // 第一章的边界就是页首，不跟它自己的章顶走
      spansRef.current = next;
      setSpans(next);
      setReady(true);
    };

    buildSpans();
    const lateTimer = window.setTimeout(buildSpans, 600); // 字体、图片迟到会把章顶往下推，所以布局稳下来再算一次
    window.addEventListener('resize', buildSpans);
    return () => {
      window.clearTimeout(lateTimer);
      window.removeEventListener('resize', buildSpans);
    };
    // 只在章节表变化时重建；bgOf 跟着章节表一起变，不再单独列依赖
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapters, bgOf]);

  // --- 跟着滚动更新：当前章、章内进度、每根刻度的皮肤 ---
  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(raf.current);                         // 上一帧还没跑就丢掉，只留最新这次
      raf.current = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight; // 能滚的总距离
        const y = window.scrollY;                                 // 此刻滚到哪儿
        const tops = readChapterTops(chapters);                   // 每章章顶的实时位置
        const atBottom = max > 0 && y >= max - 2;                 // 到底了没有（留 2px 容差，缩放会差一点点）

        // 当前章：取「章顶已经越过屏幕顶」的最后一章，所以 scrollTo(章顶) 正好点亮这一章
        let index = 0;
        for (let k = 0; k < tops.length; k += 1) {
          const top = tops[k];
          if (top != null && top <= y + 1) index = k;              // +1 容差，避免浮点差一格
        }
        if (atBottom) index = chapters.length - 1;                // 滚到底一定是最后一章

        // 章内进度：章首 0、下一章章首 1。橙线末端 = 本章刻度 + 一格 × 这个比例，
        // 所以末端连续地走，每到章界正好落在下一根刻度柱中心
        const startTop = tops[index];
        const endTop = index + 1 < tops.length ? tops[index + 1] : document.documentElement.scrollHeight;
        let progress = 0;
        if (atBottom) progress = 1;
        else if (startTop != null && endTop != null && endTop > startTop) {
          progress = Math.max(0, Math.min(1, (y - startTop) / (endTop - startTop)));
        }
        setActive(index);
        setChapterProgress(progress);

        // 皮肤：逐根量「这根刻度此刻压在什么底上」。探测点取轴右侧 4px
        //（轴只有 14px 宽，紧挨着的底色和轴底下基本是同一块），y 取刻度中心
        const navBox = navRef.current?.getBoundingClientRect();
        const ticks = navRef.current?.querySelectorAll('.rail__tick');
        if (navBox && ticks && ticks.length === chapters.length) {
          const probeX = navBox.right + 4;
          const nextDark: boolean[] = [];
          ticks.forEach((tick, i) => {
            const box = tick.getBoundingClientRect();
            nextDark[i] = isDarkAt(probeX, box.top + box.height / 2); // 每根刻度中心那一行
          });
          // 只有明暗真的变了才 setState，否则滚动时会白渲染一整轮
          setLiveSkin((prev) => (prev && prev.length === nextDark.length && prev.every((dark, i) => dark === nextDark[i]) ? prev : nextDark));
        }
      });
    };

    onScroll();                                                  // 先按当前滚动位置摆一次
    window.addEventListener('scroll', onScroll, { passive: true }); // 被动监听，不挡滚动的流畅度
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf.current);
    };
  }, [chapters]);

  // --- 量刻度几何：第一根刻度中心、刻度间距 ---
  useEffect(() => {
    const measureTicks = () => {
      const ticks = navRef.current?.querySelectorAll('.rail__tick');
      const track = navRef.current?.querySelector('.rail__track');
      if (!ticks || ticks.length < 2 || !track) return;          // 还没渲染出来，等下一轮
      const trackTop = track.getBoundingClientRect().top;        // 轨道顶，段和橙线的坐标都相对它
      const first = ticks[0].getBoundingClientRect();
      const second = ticks[1].getBoundingClientRect();
      const center0 = first.top + first.height / 2 - trackTop;   // 第一根刻度中心（相对轨道顶）
      const center1 = second.top + second.height / 2 - trackTop; // 第二根刻度中心
      if (Math.abs(center1 - center0 - tickGap) > 0.5) setTickGap(center1 - center0);          // 半像素以内不算变化，免得死循环
      if (Math.abs(center0 - firstTickCenter) > 0.5) setFirstTickCenter(center0);
    };

    measureTicks();
    const lateTimer = window.setTimeout(measureTicks, 400); // 窄屏下面字号会变，布局稳下来再量一次
    window.addEventListener('resize', measureTicks);
    return () => {
      window.clearTimeout(lateTimer);
      window.removeEventListener('resize', measureTicks);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapters]);

  // --- 点刻度：滚到那一章，让刻度柱落在本屏中线上（也就是橙线末端的位置）---
  const scrollToChapter = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;                                             // 页面里没有这一屏，什么都不做
    const navBox = navRef.current?.getBoundingClientRect();
    const mid = (navBox?.top ?? window.innerHeight / 2) + (navRef.current?.offsetHeight ?? 0) / 2; // 屏幕中线
    // 40px 是让章节标题别贴着屏幕顶留的呼吸位
    const y = el.getBoundingClientRect().top + window.scrollY - mid + 40;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }, []);

  // --- 摆位置用的几个换算 ---

  // 段与橙线相对刻度中心各外扩半颗刻度的量（刻度 7×7，中心在 3.5px 处），
  // 这样橙线末端正好压在刻度柱中心，露出来看的就是刻度圆点本身
  const TICK_HALF = 3.5;

  // 第 i 根刻度中心相对轨道顶的像素位置。全部来自实测（firstTickCenter、tickGap），
  // 写死会在窄屏整体错半格——窄屏刻度贴在格子顶部，余量是 0，桌面是半格
  const tickCenterOf = (i: number) => firstTickCenter + tickGap * i;

  // 橙线末端：本章刻度 + 一格 × 章内进度
  const tipPx = tickCenterOf(Math.min(active, chapters.length - 1)) + tickGap * chapterProgress;

  // 第 i 根刻度的明暗：优先用逐根实测（随滚动变），首帧回落到按章节算的表
  const darkAt = (i: number) => liveSkin?.[i] ?? spans[i]?.dark ?? false;
  const skinOf = (i: number) => (darkAt(i) ? 'dark' : 'light');

  // tible 的表情跟着章节走：开场打招呼、地图段困、回程开心、其余按奇偶换
  const faceSrc = active === 0 ? mascot.happy : active === 7 ? mascot.sleep : active === 8 ? mascot.happy : active % 2 === 0 ? mascot.idle : mascot.alert;

  // 底层那几段浅色柱：每段从本章刻度铺到下一章刻度，末段收在最后一根刻度上
  const spanRows = spans.map((_, i) => {
    const top = tickCenterOf(i);
    const isLast = i === spans.length - 1;
    const bottom = isLast ? top : tickCenterOf(i + 1);           // 末段没有下一根刻度，自己收自己
    // 段尾缩 3.5px 收到刻度柱中心，交界处才是一条干净的横线；末段本来就只有 1px
    return { key: i, top, height: Math.max(1, bottom - top - (isLast ? 0 : TICK_HALF)) };
  });

  // 顶层那条橙线：一整条从轴顶拉到当前刻度中心，只按段切成几截换皮肤。
  // 不每段各画一张矩形——分段的描边会把相邻两张橙条的拐角描出来，看上去像一串小方块
  const fillRows = spans.slice(0, active + 1).map((_, i) => {
    const top = i === 0 ? 0 : tickCenterOf(i);                   // 第一截从轴顶开始
    const isActive = i === active;
    // 当前这截的尾巴跟着章内进度走，前面几截铺满到下一章刻度，彼此紧贴不留缝
    const end = isActive ? tipPx + TICK_HALF : tickCenterOf(i + 1);
    return { key: i, top, height: Math.max(1, end - top) };
  });

  return (
    <nav
      ref={navRef}
      className="rail"
      aria-label={ariaLabel}
      data-ready={ready ? 'true' : 'false'}          // 分段算好之前不显示，免得橙线先闪一下
      style={{ ['--tip' as string]: `${tipPx}px` } as CSSProperties} // 橙线末端位置交给 CSS 画（tible 也靠它定位）
    >
      <div className="rail__track" aria-hidden="true">
        {/* 底层：整条轴按章分段的浅色柱 */}
        {spanRows.map((row) => (
          <span key={row.key} className="rail__seg" data-skin={skinOf(row.key)} style={{ top: `${row.top}px`, height: `${row.height}px` }} />
        ))}
        {/* 顶层：走过的部分盖一层橙 */}
        {fillRows.map((row) => (
          <span key={`fill${row.key}`} className="rail__fill" data-skin={skinOf(row.key)} style={{ top: `${row.top}px`, height: `${row.height}px` }} />
        ))}
      </div>

      <img className="rail__tible" src={faceSrc} alt={mascotAlt} width={34} height={34} decoding="async" />

      <ol className="rail__list">
        {chapters.map((chapter, i) => (
          <li key={chapter.id}>
            <button
              type="button"
              className="rail__item"
              data-active={i === active ? 'true' : 'false'}
              data-skin={skinOf(i)}
              aria-current={i === active ? 'true' : undefined}
              onClick={() => scrollToChapter(chapter.id)}
              aria-label={`${chapter.no} ${chapter.label}`}
            >
              <span className="rail__no mono-sm">{chapter.no}</span>
              <span className="rail__tick" aria-hidden="true" />
              <span className="rail__label">{chapter.short}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
