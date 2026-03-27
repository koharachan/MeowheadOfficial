import { ReactNode, useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

interface ParallaxOnViewProps {
  children: ReactNode;
  className?: string;
  dataSpeed?: number;
  maxOffsetPx?: number;
}

export default function ParallaxOnView({
  children,
  className,
  dataSpeed = 0.35,
  maxOffsetPx = 56,
}: ParallaxOnViewProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { amount: 0.2 });
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!inView) return;

    let raf = 0;
    const update = () => {
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const progress = (rect.top + rect.height * 0.3 - vh * 0.5) / vh;
      const raw = -progress * maxOffsetPx * dataSpeed;
      const clamped = Math.max(-maxOffsetPx, Math.min(maxOffsetPx, raw));
      setOffset(clamped);

      raf = requestAnimationFrame(update);
    };

    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [dataSpeed, inView, maxOffsetPx]);

  return (
    <div
      ref={ref}
      className={className}
      data-speed={dataSpeed}
      style={{ transform: `translate3d(0, ${offset.toFixed(2)}px, 0)` }}
    >
      {children}
    </div>
  );
}
