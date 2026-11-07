/**
 * 全局动效基建：Lenis 平滑滚动 + GSAP ScrollTrigger。
 * 原则：
 *  - 首屏正文不做入场动画（LCP 元素必须首帧可见）
 *  - 一次编排好的入场 > 到处乱飞
 *  - prefers-reduced-motion 下全部直接终态
 */
import Lenis from 'lenis';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/* Lenis                                                               */
/* ------------------------------------------------------------------ */
let lenis: Lenis | null = null;

function initSmoothScroll() {
  if (reduceMotion) return;

  lenis = new Lenis({
    duration: 1.05,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    syncTouch: false,
    touchMultiplier: 1.4,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  document.documentElement.classList.add('has-lenis');
}

/* 锚点跳转走 Lenis，保留键盘与 reduced-motion 的原生行为 */
function initAnchors() {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    const link = target?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
    if (!link) return;
    const id = link.getAttribute('href');
    if (!id || id === '#') return;
    const el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();

    const navOffset = -72;
    if (lenis) {
      lenis.scrollTo(el as HTMLElement, { offset: navOffset, duration: 1.2 });
    } else {
      const y = (el as HTMLElement).getBoundingClientRect().top + window.scrollY + navOffset;
      window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    history.replaceState(null, '', id);
  });
}

/* ------------------------------------------------------------------ */
/* 入场编排                                                            */
/* ------------------------------------------------------------------ */
const EASE = 'expo.out';

function initReveals() {
  const items = gsap.utils.toArray<HTMLElement>('[data-anim]');
  if (!items.length) return;

  if (reduceMotion) {
    // 直接终态
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }

  items.forEach((el) => {
    const kind = el.dataset.anim;
    const delay = parseFloat(el.dataset.delay ?? '0');

    if (kind === 'fade') {
      gsap.fromTo(
        el,
        { y: 28, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          delay,
          ease: EASE,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        }
      );
    }

    if (kind === 'lines') {
      const lines = el.querySelectorAll<HTMLElement>('.line-mask > span');
      gsap.fromTo(
        lines,
        { yPercent: 108 },
        {
          yPercent: 0,
          duration: 1.1,
          stagger: 0.075,
          delay,
          ease: EASE,
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        }
      );
    }

    if (kind === 'stagger') {
      const kids = Array.from(el.children) as HTMLElement[];
      gsap.fromTo(
        kids,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.07,
          delay,
          ease: EASE,
          scrollTrigger: { trigger: el, start: 'top 86%', once: true },
        }
      );
    }

    if (kind === 'draw') {
      const paths = el.querySelectorAll<SVGGeometryElement>('[data-stroke]');
      paths.forEach((path) => {
        const len = path.getTotalLength ? path.getTotalLength() : 0;
        if (!len) return;
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(path, {
          strokeDashoffset: 0,
          duration: 1.6,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: el, start: 'top 78%', once: true },
        });
      });
      const fills = el.querySelectorAll<HTMLElement>('[data-fill-fade]');
      gsap.fromTo(
        fills,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 1,
          delay: 0.5,
          stagger: 0.12,
          ease: 'power1.out',
          scrollTrigger: { trigger: el, start: 'top 78%', once: true },
        }
      );
    }
  });
}

/* ------------------------------------------------------------------ */
/* 滚动联动（scrub）：让每一屏都「跟着手走」，而不只是入场一次          */
/* ------------------------------------------------------------------ */
function initScrub() {
  if (reduceMotion) return;

  const scopeOf = (el: HTMLElement) => (el.closest('[data-scrub-scope]') as HTMLElement | null) ?? el.closest('section') ?? el;

  gsap.utils.toArray<HTMLElement>('[data-scrub]').forEach((el) => {
    const y = parseFloat(el.dataset.scrubY ?? '0');
    const x = parseFloat(el.dataset.scrubX ?? '0');
    const r = parseFloat(el.dataset.scrubRotate ?? '0');
    if (!y && !x && !r) return;

    gsap.fromTo(
      el,
      { y: -y / 2, x: -x / 2, rotate: -r / 2 },
      {
        y: y / 2,
        x: x / 2,
        rotate: r / 2,
        ease: 'none',
        scrollTrigger: {
          trigger: scopeOf(el),
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.7,
        },
      }
    );
  });

  // 发丝线随段落进度画出
  gsap.utils.toArray<HTMLElement>('[data-scrub-line]').forEach((el) => {
    gsap.fromTo(
      el,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: 'none',
        transformOrigin: 'left center',
        scrollTrigger: {
          trigger: scopeOf(el),
          start: 'top 88%',
          end: 'top 32%',
          scrub: 0.5,
        },
      }
    );
  });
}

/* ------------------------------------------------------------------ */
/* 数字滚动（只在出现时触发一次）                                       */
/* ------------------------------------------------------------------ */
function initCounters() {
  const nodes = gsap.utils.toArray<HTMLElement>('[data-count]');
  if (!nodes.length || reduceMotion) return;

  nodes.forEach((el) => {
    const raw = el.dataset.count ?? '';
    const target = parseFloat(raw.replace(/[^\d.]/g, '')) || 0;
    const decimals = (raw.split('.')[1] ?? '').length;
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target,
      duration: 1.4,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => {
        el.textContent = obj.v.toFixed(decimals);
      },
    });
  });
}

/* ------------------------------------------------------------------ */
/* 视差                                                                */
/* ------------------------------------------------------------------ */
function initParallax() {
  if (reduceMotion) return;
  gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
    const amount = parseFloat(el.dataset.parallax ?? '60');
    gsap.fromTo(
      el,
      { y: -amount * 0.5 },
      {
        y: amount * 0.5,
        ease: 'none',
        scrollTrigger: { trigger: el.closest('[data-parallax-scope]') ?? el, start: 'top bottom', end: 'bottom top', scrub: true },
      }
    );
  });
}

/* ------------------------------------------------------------------ */
/* 顶部导航状态 + 右侧段落索引                                          */
/* ------------------------------------------------------------------ */
function initChrome() {
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  const progress = document.querySelector<HTMLElement>('[data-progress]');

  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    if (nav) nav.classList.toggle('is-stuck', y > 24);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, y / max) : 0;
      progress.style.transform = `scaleX(${p})`;
    }
    lastY = y;
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // 章节高亮
  const rail = document.querySelectorAll<HTMLElement>('[data-rail-item]');
  if (rail.length) {
    const sections = Array.from(rail)
      .map((a) => document.querySelector<HTMLElement>(a.getAttribute('href') ?? ''))
      .filter((el): el is HTMLElement => Boolean(el));

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = '#' + entry.target.id;
          rail.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === id));
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );
    sections.forEach((s) => io.observe(s));
  }
}

/* ------------------------------------------------------------------ */
/* 移动端菜单                                                          */
/* ------------------------------------------------------------------ */
function initMenu() {
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const panel = document.querySelector<HTMLElement>('[data-menu-panel]');
  if (!toggle || !panel) return;

  const setOpen = (open: boolean) => {
    panel.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.documentElement.classList.toggle('menu-open', open);
    if (lenis) open ? lenis.stop() : lenis.start();
  };

  toggle.addEventListener('click', () => setOpen(!panel.classList.contains('is-open')));
  panel.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
}


/* ------------------------------------------------------------------ */
/* 流式打字：单字 90ms 从 blur(6px) 到清晰，相邻错开 30ms               */
/* ------------------------------------------------------------------ */
function initTextStream() {
  if (reduceMotion) return;

  // 拉丁按词切、中文按字切，避免把英文单词拆到两行
  const TOKEN = /([A-Za-z0-9][A-Za-z0-9'’\-.]*|[\s\S])/g;

  const targets = Array.from(
    document.querySelectorAll<HTMLElement>('[data-stream]')
  );
  if (!targets.length) return;

  targets.forEach((el) => {
    // 只处理纯文本节点，避免破坏内部结构
    if (el.children.length > 0) return;

    const text = el.textContent ?? '';
    if (!text.trim()) return;

    // 交给流式动画后，撤掉 gsap 的整块淡入，避免双重动画
    el.removeAttribute('data-anim');
    el.style.opacity = '1';

    const frag = document.createDocumentFragment();
    const parts: HTMLElement[] = [];
    const tokens = text.match(TOKEN) ?? [];

    tokens.forEach((tk) => {
      const span = document.createElement('span');
      span.className = 'stream-ch';
      span.textContent = tk === '\u0020' || tk === ' ' ? '\u00A0' : tk;
      frag.appendChild(span);
      if (tk.trim()) parts.push(span);
    });

    el.setAttribute('aria-label', text);
    el.textContent = '';
    el.appendChild(frag);
    el.classList.add('is-streaming');
    parts.forEach((s) => s.setAttribute('aria-hidden', 'true'));

    // 保险：2s 内没触发视口动画就直接显形，别把标题留在不可见状态
    const safety = window.setTimeout(() => {
      if (!el.classList.contains('is-stream-done')) reveal();
    }, 2000);

    const reveal = () => {
      window.clearTimeout(safety);
      el.classList.add('is-stream-done');
    };

    const io = new IntersectionObserver(
      ([entry], obs) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        reveal();
        parts.forEach((s, i) => {
          s.animate(
            [
              { filter: 'blur(6px)', opacity: 0 },
              { filter: 'blur(0px)', opacity: 1 },
            ],
            {
              duration: 90,
              delay: i * 30,
              easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
              fill: 'both',
            }
          );
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.15 }
    );
    io.observe(el);
  });
}

/* ------------------------------------------------------------------ */
/* 折叠：只切 class，高度由 grid 0fr→1fr 自己插值                        */
/* ------------------------------------------------------------------ */
function initCollapse() {
  document.querySelectorAll<HTMLElement>('[data-collapse]').forEach((box) => {
    const btn = box.querySelector<HTMLButtonElement>('[data-collapse-toggle]');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const open = !box.classList.contains('is-open');
      box.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });
}

/* ------------------------------------------------------------------ */
/* 复制：对勾微弹一下就停，2.5s 后自动淡回原状                          */
/* ------------------------------------------------------------------ */
function initCopy() {
  document.addEventListener('click', async (e) => {
    const btn = (e.target as HTMLElement)?.closest?.('[data-copy]') as HTMLElement | null;
    if (!btn) return;
    const value = btn.dataset.copy ?? '';
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        /* ignore */
      }
      ta.remove();
    }

    btn.dataset.copied = 'true';
    btn.dispatchEvent(new CustomEvent('copied', { bubbles: true }));
    window.clearTimeout(Number(btn.dataset.copyTimer ?? 0));
    const timer = window.setTimeout(() => {
      delete btn.dataset.copied;
    }, 2500);
    btn.dataset.copyTimer = String(timer);
  });
}


/* ------------------------------------------------------------------ */
/* 世界线：钉住一屏，横向随滚动推进 + 轴线填充                          */
/* ------------------------------------------------------------------ */
function initWorldline() {
  const section = document.querySelector<HTMLElement>('[data-worldline]');
  const track = section?.querySelector<HTMLElement>('[data-wl-track]');
  const fill = section?.querySelector<HTMLElement>('[data-wl-fill]');
  if (!section || !track) return;
  if (reduceMotion || window.matchMedia('(max-width: 1023px)').matches) return;

  let shift = 0;
  const measure = () => {
    shift = Math.max(0, track.scrollWidth - track.parentElement!.clientWidth);
  };
  measure();

  const tween = gsap.to(track, {
    x: () => -shift,
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top 78%',
      end: () => '+=' + Math.max(320, shift * 0.9),
      scrub: 0.7,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (fill) fill.style.width = (self.progress * 100).toFixed(1) + '%';
      },
    },
  });

  ScrollTrigger.addEventListener('refreshInit', measure);
  window.addEventListener('resize', () => {
    measure();
    tween.scrollTrigger?.refresh();
  });
  void fill;
}

/* ------------------------------------------------------------------ */
const boot = () => {
  initTextStream();
  initCopy();
  initCollapse();
  initWorldline();
  initSmoothScroll();
  initAnchors();
  initReveals();
  initScrub();
  initCounters();
  initParallax();
  initChrome();
  initMenu();
  ScrollTrigger.refresh();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

// 字体加载完成后重新计算 ScrollTrigger 位置，避免首帧布局偏差
if (document.fonts?.ready) {
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}

export {};