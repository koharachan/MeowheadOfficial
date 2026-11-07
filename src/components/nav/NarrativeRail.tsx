import type { CSSProperties } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface Chapter {
  id: string;
  no: string;
  label: string;
  short: string;
}

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
}: {
  chapters: Chapter[];
  mascot: { idle: string; happy: string; sleep: string; alert: string };
  ariaLabel: string;
  mascotAlt: string;
}) {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const raf = useRef(0);

  /* 进度 + 当前章节：用「探测线」算，比 IntersectionObserver 稳
     （sticky 的长屏 section 用 IO 会一直霸占高亮，滚到底也切不到最后几章） */
  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const y = window.scrollY;
        setProgress(max > 0 ? Math.min(1, Math.max(0, y / max)) : 0);

        const probe = y + window.innerHeight * 0.42;
        let idx = 0;
        chapters.forEach((c, i) => {
          const el = document.getElementById(c.id);
          if (!el) return;
          const top = el.getBoundingClientRect().top + y;
          if (top <= probe) idx = i;
        });
        // 滚到底时强制最后一章
        if (max > 0 && y >= max - 8) idx = chapters.length - 1;
        setActive(idx);
        setReady(true);
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

  const go = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }, []);

  // tible 的表情跟着章节走：开场打招呼、地图段困、其余随进度
  const face =
    active === 0 ? mascot.happy : active === 7 ? mascot.sleep : active === 8 ? mascot.happy : active % 2 === 0 ? mascot.idle : mascot.alert;

  return (
    <nav
      className="rail"
      aria-label={ariaLabel}
      data-ready={ready ? 'true' : 'false'}
      style={{ ['--p' as string]: progress } as CSSProperties}
    >
      <div className="rail__track" aria-hidden="true">
        <span className="rail__fill" style={{ transform: `scaleY(${progress})` }} />
      </div>

      <img className="rail__tible" src={face} alt={mascotAlt} width={34} height={34} decoding="async" />

      <ol className="rail__list">
        {chapters.map((c, i) => (
          <li key={c.id}>
            <button
              type="button"
              className="rail__item"
              data-active={i === active ? 'true' : 'false'}
              aria-current={i === active ? 'true' : undefined}
              onClick={() => go(c.id)}
              aria-label={`${c.no} ${c.label}`}
            >
              <span className="rail__no mono-sm">{c.no}</span>
              <span className="rail__tick" aria-hidden="true" />
              <span className="rail__label">{c.short}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
