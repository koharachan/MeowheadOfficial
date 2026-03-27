import { useEffect, useMemo, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

interface CountUpOnViewProps {
  value: number;
  durationMs?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export default function CountUpOnView({
  value,
  durationMs = 1200,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}: CountUpOnViewProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.7 });

  const [current, setCurrent] = useState(0);

  const formatter = useMemo(() => {
    return new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }, [decimals]);

  useEffect(() => {
    if (!inView) return;

    const start = performance.now();
    const from = 0;
    const to = value;

    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setCurrent(from + (to - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs, inView, value]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatter.format(current)}
      {suffix}
    </span>
  );
}
