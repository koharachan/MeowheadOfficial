import { useEffect, useState } from 'react';

/**
 * 角落探头：滚动过半页后，寻美从右下角探出头。
 * 可关闭（记住选择），进入联系区自动让位。
 */
export default function MascotPeek({
  image,
  alt,
  closeLabel,
  href,
  cta,
  bubble,
}: {
  image: string;
  alt: string;
  closeLabel: string;
  href: string;
  cta: string;
  bubble: string;
}) {
  const [shown, setShown] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    let closed = false;
    try {
      closed = window.sessionStorage.getItem('mibo-peek') === 'closed';
    } catch {
      closed = false;
    }
    if (closed) return;
    setDismissed(false);

    // 地图与联系表单出现时让位，别挡住关键信息
    const blockers = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? blockers.add(e.target) : blockers.delete(e.target)));
        tick();
      },
      { threshold: 0.05 }
    );
    ['#mascot', '#location', '#contact'].forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) io.observe(el);
    });

    let raf = 0;
    const tick = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const limit = document.documentElement.scrollHeight - window.innerHeight;
        setShown(blockers.size === 0 && y > window.innerHeight * 1.2 && y < limit * 0.9);
      });
    };
    const onScroll = tick;
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  const close = () => {
    setShown(false);
    setDismissed(true);
    try {
      window.sessionStorage.setItem('mibo-peek', 'closed');
    } catch {
      /* 忽略 */
    }
  };

  if (dismissed) return null;

  return (
    <div className="peek" data-open={shown ? 'true' : 'false'}>
      <div className="peek__bubble">
        <p>{bubble}</p>
        <a href={href}>{cta}</a>
      </div>

      <a className="peek__figure" href={href} aria-label={cta}>
        <img src={image} alt={alt} width={220} height={220} loading="lazy" decoding="async" />
      </a>

      <button type="button" className="peek__close" onClick={close} aria-label={closeLabel}>
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M5 5l14 14M19 5L5 19" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
