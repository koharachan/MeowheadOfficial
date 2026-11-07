import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface StageState {
  id: string;
  label: string;
  image: string;
  note: string;
}

/**
 * 首页第五屏：寻美的舞台。
 * - 滚动进度驱动表情切换（一次编排，不做乱飞的动作）
 * - 鼠标带来轻微视差，点击可以手动切下一个状态
 * - prefers-reduced-motion 下不跟滚动，保持待机
 */
export default function MascotStage({
  states,
  alt,
  reduceLabel,
  companion,
}: {
  states: StageState[];
  alt: string;
  reduceLabel: string;
  companion: { image: string; alt: string; name: string };
}) {
  const [index, setIndex] = useState(0);
  const [manual, setManual] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const rise = useRef<HTMLDivElement>(null);
  const reduce = useRef(false);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});

  const count = states.length;

  useEffect(() => {
    reduce.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce.current) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = root.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        // 进入视口 85% → 离开 15% 之间映射到 0..1
        const raw = (vh * 0.85 - rect.top) / (rect.height + vh * 0.7);
        const p = Math.min(1, Math.max(0, raw));
        const next = Math.min(count - 1, Math.floor(p * count));
        setIndex(next);

        /* 飞入：从框底升上来，先露头再露身；落定后随滚动继续往上顶 */
        const r = rise.current;
        if (r) {
          const flight = Math.min(1, p / 0.24);
          // easeOutBack：落地时有一点点回弹，但不过头
          const c1 = 1.34;
          const e = 1 + (c1 + 1) * Math.pow(flight - 1, 3) + c1 * Math.pow(flight - 1, 2);
          // 落定后 24%→100% 再缓缓上顶 8%，越往下滑露出的越多
          const settle = Math.min(1, Math.max(0, (p - 0.24) / 0.76));
          const y = (1 - e) * 62 - settle * 8;
          const rot = (1 - e) * -10;
          const scale = 0.9 + e * 0.1;
          r.style.transform = 'translate3d(0,' + y.toFixed(2) + '%,0) rotate(' + rot.toFixed(2) + 'deg) scale(' + scale.toFixed(3) + ')';
          r.style.opacity = String(Math.min(1, flight * 3));
        }
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [count]);

  useEffect(() => {
    if (reduce.current) return;
    const onMove = (e: PointerEvent) => {
      const el = tilt.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
      const dy = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
      el.style.transform = `translate3d(${(dx * 16).toFixed(2)}px, ${(dy * 10).toFixed(2)}px, 0) rotate(${(dx * 2.2).toFixed(2)}deg)`;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  // 预加载相邻两帧，切换不闪
  useEffect(() => {
    [index, index + 1].forEach((i) => {
      const s = states[((i % count) + count) % count];
      if (!s || loaded[s.image]) return;
      const img = new Image();
      img.src = s.image;
      img.onload = () => setLoaded((prev) => ({ ...prev, [s.image]: true }));
    });
  }, [index, states, count, loaded]);

  const next = useCallback(() => {
    setManual((m) => m + 1);
  }, []);

  const active = useMemo(() => {
    const manualIndex = manual > 0 ? (manual + index) % count : index;
    return states[Math.min(count - 1, Math.max(0, manualIndex))] ?? states[0];
  }, [manual, index, count, states]);

  return (
    <div className="stage" ref={root}>
      <div className="stage__frame">
        <div className="stage__rise" ref={rise}>
        <div className="stage__tilt" ref={tilt}>
          <button type="button" className="stage__hit" onClick={next} aria-label={`${alt} · ${reduceLabel}`}>
            {states.map((s) => (
              <img
                key={s.id}
                className="stage__img"
                src={s.image}
                alt=""
                aria-hidden="true"
                data-active={s.id === active.id ? 'true' : 'false'}
                loading={s.id === 'idle' ? 'eager' : 'lazy'}
                decoding="async"
                draggable={false}
                width={720}
                height={720}
              />
            ))}
          </button>
        </div>
        </div>

        <div className="stage__shadow" aria-hidden="true" />

        <div className="stage__companion">
          <img src={companion.image} alt={companion.alt} width={96} height={96} loading="lazy" decoding="async" />
          <span className="mono-sm">{companion.name}</span>
        </div>

        <div className="stage__caption" aria-live="polite">
          <span className="stage__state mono">{active.label}</span>
          <span className="stage__note">{active.note}</span>
        </div>
      </div>
    </div>
  );
}
