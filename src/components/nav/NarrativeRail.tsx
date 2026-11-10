import type { CSSProperties } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface Chapter {
  id: string;
  no: string;
  label: string;
  short: string;
}

type Seg = { from: number; to: number; dark: boolean };

/** 屏幕点 (x, y) 的背后是不是深色底：取该点最上层的页面元素（跳过轴自己），
    先看它有没有 .on-dark 祖先，再沿祖先链找第一层不透明背景，按亮度判 */
const isDarkAt = (x: number, y: number): boolean => {
  const hit = document.elementsFromPoint(x, y).find((n) => !n.closest('.rail'));
  if (!hit) return false;
  if (hit.closest('.on-dark')) return true;
  let n: Element | null = hit;
  while (n && n !== document.documentElement) {
    const m = /rgba?\(([\d.]+), ?([\d.]+), ?([\d.]+)(?:, ?([\d.]+))?\)/.exec(getComputedStyle(n).backgroundColor);
    if (m) {
      const a = m[4] === undefined ? 1 : Number(m[4]);
      if (a > 0.5) return 0.2126 * +m[1] + 0.7152 * +m[2] + 0.0722 * +m[3] < 96;
    }
    n = n.parentElement;
  }
  return false;
};

/** 元素的文档纵坐标：沿 offsetParent 累加 offsetTop（布局位置，不受滚动和 sticky 影响） */
const docTop = (el: HTMLElement): number => {
  let y = 0;
  let n: HTMLElement | null = el;
  while (n) {
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return y;
};

/**
 * 贯穿全站的叙事轴。
 * - 左侧竖轴：章节刻度 + 当前章高亮 + 阅读进度
 * - tible 站在轴上，随滚动往下走，并按章节换表情（它是「带你读下去」的那个角色）
 * - 移动端收成右侧的极简刻度，只留点与进度
 */
export default function NarrativeRail({
  chapters,
  mascot,
  ariaLabel,
  mascotAlt,
  bgOf,
}: {
  chapters: Chapter[];
  mascot: { idle: string; happy: string; sleep: string; alert: string };
  ariaLabel: string;
  mascotAlt: string;
  /** 每章底色的明暗（由 Astro 侧按脚本里读不到的样式算好传进来，1 = 深底） */
  bgOf?: number[];
}) {
  const [active, setActive] = useState(0);
  /* 章内进度（0~1）：橙线在「当前章这一格」里按这个比例往下走，
     走到 1 正好是下一格刻度——所以章与章的边界上橙线端点必然压在刻度柱上 */
  const [into, setInto] = useState(0);
  const [ready, setReady] = useState(false);
  const [segs, setSegs] = useState<Seg[]>([]);
  /* 每根刻度此刻的皮肤：轴是固定的一架梯子，压在黑底上就该是白描边黑填充，
     压回奶白底就换回淡墨线。按「当前是第几章」染色不够——深色段里另外 9 根刻度
     会全部变成黑底上的墨线，直接看不见 */
  const [liveSkin, setLiveSkin] = useState<boolean[] | null>(null);
  const segRef = useRef<Seg[]>([]);
  const raf = useRef(0);
  const navRef = useRef<HTMLElement | null>(null);

  /** 章底色的明暗：用 builder 传进来的表；没传就按 .on-dark 兜底 */
  const darkOf = (id: string, i: number): boolean => {
    if (bgOf && typeof bgOf[i] === 'number') return bgOf[i] > 0.55;
    return !!document.getElementById(id)?.classList.contains('on-dark');
  };

  /* 分段：把「文档进度」切成每章一段，并判断这一段的底是深是浅。
     这样进度末端（橙线）与刻度柱都在同一段上，颜色永远一致，不会一半露在底部。 */
  useEffect(() => {
    const build = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const tops = chapters.map((c, i) => {
        const el = document.getElementById(c.id);
        return { i, id: c.id, top: el ? docTop(el as HTMLElement) : 0 };
      });
      const next: Seg[] = [];
      let prevTo = 0;
      tops.forEach((t, k) => {
        const nextTop = tops[k + 1]?.top ?? (document.documentElement.scrollHeight - window.innerHeight);
        const from = k === 0 ? 0 : max > 0 ? t.top / max : 0;
        const to = k === tops.length - 1 ? 1 : max > 0 ? nextTop / max : 1;
        next.push({ from: Math.min(prevTo, to), to, dark: darkOf(t.id, t.i) });
        prevTo = to;
      });
      /* 首段从 0 开始：第一章的边界就是页首，不跟着它自己的章顶走 */
      next[0] = { ...next[0], from: 0 };
      segRef.current = next;
      setSegs(next);
      setReady(true);
    };
    build();
    const t = window.setTimeout(build, 600);
    window.addEventListener('resize', build);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', build);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapters, bgOf]);

  /* 进度 + 当前章节：按「章在文档里的位置」判，比 IntersectionObserver 稳
     （sticky 的长屏 section 用 IO 会一直霸占高亮，滚到底也切不到最后几章） */
  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const y = window.scrollY;

        /* 当前章：每帧按章节当前的版面位置判（scrollTo(章顶) 正好点亮该章）。
           不用 build() 缓存下来的比例——字体/图片迟到会让缓存值偏，章顶差一格 */
        const tops = chapters.map((c) => {
          const el = document.getElementById(c.id);
          return el ? docTop(el as HTMLElement) : null;
        });
        const last = max > 0 && y >= max - 2;
        let idx = 0;
        for (let k = 0; k < tops.length; k += 1) {
          const top = tops[k];
          if (top != null && top <= y + 1) idx = k;
        }
        if (last) idx = chapters.length - 1;

        /* 章内细分：章首 0、章尾 1。橙线端点 = 本章刻度 + 一格 × 章内细分，
           所以端点连续地走，且每到章界就正好落在下一根刻度柱中心（不再整格跳） */
        const startTop = tops[idx];
        const endTop = idx + 1 < tops.length ? tops[idx + 1] : document.documentElement.scrollHeight;
        let frac = 0;
        if (last) frac = 1;
        else if (startTop != null && endTop != null && endTop > startTop) {
          frac = Math.max(0, Math.min(1, (y - startTop) / (endTop - startTop)));
        }
        setActive(idx);
        setInto(frac);

        /* 皮肤：逐根量「这根刻度此刻压在什么底上」。探测点取轴右侧 4px（轴只有 14px 宽，
           紧挨着的底色和轴底下基本是同一块），y 取刻度中心 */
        const navBox = navRef.current?.getBoundingClientRect();
        const ticks = navRef.current?.querySelectorAll('.rail__tick');
        if (navBox && ticks && ticks.length === chapters.length) {
          const probeX = navBox.right + 4;
          const nextDark: boolean[] = [];
          ticks.forEach((el, i) => {
            const r = el.getBoundingClientRect();
            nextDark[i] = isDarkAt(probeX, r.top + r.height / 2);
          });
          setLiveSkin((prev) => (prev && prev.length === nextDark.length && prev.every((v, i) => v === nextDark[i]) ? prev : nextDark));
        }
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf.current);
    };
  }, [chapters]);

  /* 点刻度：滚到那一章，让刻度柱正好落在本屏的中线上（也就是橙线末端的位置） */
  const go = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const mid = (navRef.current?.getBoundingClientRect().top ?? window.innerHeight / 2) + (navRef.current?.offsetHeight ?? 0) / 2;
    const y = el.getBoundingClientRect().top + window.scrollY - mid + 40;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }, []);

  /* 刻度柱的像素位置：nav 是 fixed 居中的，li 的高度只有 14px，
     所以先量一次第一根刻度中心与刻度间距（都来自真实布局，不靠猜） */
  const [tickBase, setTickBase] = useState(17);
  const [laneStep, setLaneStep] = useState(35);
  /* 轴柱顶到第一根刻度中心的余量：桌面端是半格（刻度在 14px 格子里竖直居中），
     移动端刻度贴在格子顶部所以是 0——用实测值，不写死 */
  const [lanePad, setLanePad] = useState(7);

  useEffect(() => {
    const measure = () => {
      const ticks = navRef.current?.querySelectorAll('.rail__tick');
      const track = navRef.current?.querySelector('.rail__track');
      if (!ticks || ticks.length < 2 || !track) return;
      const tb = track.getBoundingClientRect();
      const r0 = ticks[0].getBoundingClientRect();
      const r1 = ticks[1].getBoundingClientRect();
      const c0 = r0.top + r0.height / 2 - tb.top;
      const c1 = r1.top + r1.height / 2 - tb.top;
      if (Math.abs(c1 - c0 - laneStep) > 0.5) setLaneStep(c1 - c0);
      // 段/橙线的坐标都相对轨道顶（.rail__track），刻度中心 = 轨道顶 + lanePad
      if (Math.abs(c0 - tickBase) > 0.5) setTickBase(c0);
      // c0 就是轨道顶到第一根刻度中心距离的实测值（桌面 7px，移动端 0px）
      if (Math.abs(c0 - lanePad) > 0.5) setLanePad(c0);
    };
    measure();
    const t = window.setTimeout(measure, 400);
    window.addEventListener('resize', measure);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapters]);

  // tible 的表情跟着章节走：开场打招呼、地图段困、其余随进度
  const face =
    active === 0 ? mascot.happy : active === 7 ? mascot.sleep : active === 8 ? mascot.happy : active % 2 === 0 ? mascot.idle : mascot.alert;

  /* 段在柱子里的像素位置：柱高 = 首末刻度中心之差，段顶 = 该章刻度中心 − 柱顶。
     百分比会把段拉成 100% 高，而实际刻度只占 329px，橙线末端就会甩开刻度十几二十像素 */
  /* 段/橙线相对刻度中心各外扩半颗刻度的量（刻度 7x7，中心在 3.5px 处），
     这样末端正好压在刻度柱中心，露出的就是刻度圆点本身 */
  const LANE_GAP = 3.5;
  /* 刻度位置全部来自实测：第一根刻度中心相对轨道顶 tickBase（桌面 7px、移动端 0px），
     间距 laneStep（桌面 35px、移动端随屏幕高变化）。写死会在移动端整体错半格 */
  const laneTop = (i: number) => tickBase + laneStep * i;
  /* 橙线端点（相对 .rail__track 顶部）：本章刻度 + 一格 × 章内细分 */
  const tipPx = laneTop(Math.min(active, chapters.length - 1)) + laneStep * into;

  /* 轴的「皮肤」：刻度和进度都是按段染色。
     轴线本体（.rail__track）是一个满高的柱子，里面横着排几段：奶白段用墨色，
     深色段用黑填充 + 白描边——不做反相，只把填充压成黑的，交界处自然是一条硬线 */
  const skin = (dark: boolean) => (dark ? 'dark' : 'light');
  /** 第 i 根刻度的明暗：优先用逐根实测（随滚动变化），首帧回落到按章节算的值 */
  const darkAt = (i: number) => liveSkin?.[i] ?? segs[i]?.dark ?? false;

  return (
    <nav
      ref={navRef}
      className="rail"
      aria-label={ariaLabel}
      data-ready={ready ? 'true' : 'false'}
      style={{ ['--tip' as string]: `${tipPx}px` } as CSSProperties}
    >
      <div className="rail__track" aria-hidden="true">
        {/* 底层：整条时间轴按章分段的浅色柱 */}
        {(() => {
          /* 段按「顶到章界、尾到下一段起点」铺：最后一段收在末刻度，首尾都不越界 */
          const tops = chapters.map((_, i) => laneTop(i));
          const lastTop = laneTop(chapters.length - 1);
          tops.push(lastTop);
          return segs.map((s, i) => (
            <span
              key={i}
              className="rail__seg"
              data-skin={skin(darkAt(i))}
              style={{
                top: `${tops[i]}px`,
                // 段首尾各缩 3.5px：段尾收到刻度柱中心，交界处才是一条干净的横线
                height: `${Math.max(1, (i === segs.length - 1 ? lastTop : tops[i + 1]) - tops[i] - (i === segs.length - 1 ? 0 : LANE_GAP))}px`,
              }}
            />
          ));
        })()}
        {/* 顶层：走过的部分盖一层橙，整个是「一根从轴顶拉到当前刻度中心的线与面」，
            不再每段各画一张矩形——分段的边/描边会把相邻两张橙条的拐角描出来，
            看上去像一串小方块。段只决定这一截是深底还是浅底 */}
        {segs.map((s, i) => {
          if (i > active) return null;
          const top = i === 0 ? 0 : laneTop(i);
          // 当前章的尾巴跟章内进度走（tipPx），前面几张铺满到下一章边界，彼此紧贴不留缝
          const end = i === active ? tipPx + LANE_GAP : laneTop(i + 1);
          return (
            <span
              key={`f${i}`}
              className="rail__fill"
              data-skin={skin(darkAt(i))}
              style={{ top: `${top}px`, height: `${Math.max(1, end - top)}px` }}
            />
          );
        })}
      </div>

      <img className="rail__tible" src={face} alt={mascotAlt} width={34} height={34} decoding="async" />

      <ol className="rail__list">
        {chapters.map((c, i) => {
          const seg = segs[i];
          return (
            <li key={c.id}>
              <button
                type="button"
                className="rail__item"
                data-active={i === active ? 'true' : 'false'}
                data-skin={skin(darkAt(i))}
                aria-current={i === active ? 'true' : undefined}
                onClick={() => go(c.id)}
                aria-label={`${c.no} ${c.label}`}
              >
                <span className="rail__no mono-sm">{c.no}</span>
                <span className="rail__tick" aria-hidden="true" />
                <span className="rail__label">{c.short}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}