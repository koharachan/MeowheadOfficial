/*
角落探头：读过小半页之后，寻美从右下角探出头来打招呼，跟一个气泡把人引到吉祥物页。

  - 关掉就记进 sessionStorage（同一个标签页里不再冒出来），开新标签页才会再来一次
  - #mascot / #location / #contact 这几屏进入视口时自动让位，别挡住关键信息
  - 只在页面中段露脸：太早没人读到，太晚人已经要走了

在 Astro 里调用（client:idle = 页面空闲后再接管，不抢首屏）：

  <MascotPeek
    client:idle
    image="/img/mascot/hiromi-peek.webp"
    alt={t.mascot.alt}
    closeLabel={t.ux.close}
    href={t.path.mascot}        // 气泡里的链接和探头本身指向同一个地址
    cta={t.ux.peek.cta}
    bubble={t.ux.peek.bubble}
  />

露不露只用一个 data-open 布尔值交给 CSS 播动画，本文件不碰位移和时长。
*/
import { useEffect, useState } from 'react';

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
  href: string;    // 点气泡或探头去的地方
  cta: string;     // 气泡里那句可点的字
  bubble: string;  // 气泡正文
}) {
  const [shown, setShown] = useState(false);     // 此刻该不该露（滚动位置 + 有没有挡脸的东西）
  const [dismissed, setDismissed] = useState(true); // 用户关掉了没有；先当关着，等读完存档再放开

  // --- 决定露不露 ---
  useEffect(() => {
    let closedBefore = false;
    try {
      closedBefore = window.sessionStorage.getItem('mibo-peek') === 'closed'; // 同一个标签页里关过就不再打扰
    } catch {
      closedBefore = false;                     // 隐私模式里 sessionStorage 会直接抛错，当作没关过
    }
    if (closedBefore) return;                   // 关过就整段不启动，连监听都不挂
    setDismissed(false);                        // 没关过，允许它出现

    // 地图与联系表单出现时要让位，别挡住关键信息。用 Set 记「现在有几块挡脸的东西在场」
    const blockers = new Set<Element>();
    const watcher = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => (entry.isIntersecting ? blockers.add(entry.target) : blockers.delete(entry.target)));
        tick();                                 // 进出视口都会改变「能不能露」，立刻重算一次
      },
      { threshold: 0.05 }                       // 露 5% 就算这一屏到了，不必等整块入画
    );
    ['#mascot', '#location', '#contact'].forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) watcher.observe(el);              // 页面上没有这一屏就跳过，别的页面也能复用
    });

    let raf = 0;                                // 排到下一帧的句柄，滚动很密时只留最新一次
    const tick = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;                                    // 此刻滚到哪儿
        const limit = document.documentElement.scrollHeight - window.innerHeight; // 还能往下滚多少
        // 三个条件同时成立才露：没有挡脸的东西、已经滚过一屏多、还没快到页底（到底了就该让人看结尾）
        setShown(blockers.size === 0 && y > window.innerHeight * 1.2 && y < limit * 0.9);
      });
    };
    const onScroll = tick;
    onScroll();                                 // 先按当前滚动位置算一次，刷新在半页处进来也对
    window.addEventListener('scroll', onScroll, { passive: true }); // 被动监听，不挡滚动
    return () => {
      window.removeEventListener('scroll', onScroll);
      watcher.disconnect();                     // 观察器要拆，否则页面切走还在量
      cancelAnimationFrame(raf);
    };
  }, []);

  // --- 关掉它 ---
  const close = () => {
    setShown(false);                            // 先把动画收回去
    setDismissed(true);                         // 再从页面上摘掉
    try {
      window.sessionStorage.setItem('mibo-peek', 'closed'); // 记下来：这个标签页里别再出现
    } catch {
      /* 隐私模式下写不进去，那就只关这一次 */
    }
  };

  if (dismissed) return null;                   // 关过 / 还没读完存档，什么都不渲染

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
        {/* 关窗那个叉，画成两根线：不引图标库，省一个请求 */}
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M5 5l14 14M19 5L5 19" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
