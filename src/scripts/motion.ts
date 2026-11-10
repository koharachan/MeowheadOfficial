/*
全站动效总开关（唯一一份，全站页面都靠它）：
  - Lenis：接管滚轮，把生硬的翻页式滚动变成带阻尼的顺滑滚动
  - GSAP ScrollTrigger：滚到某处时的入场编排、随滚动推进的联动（scrub）
  - 一堆小交互：数字滚动、视差、流式打字、折叠、复制、世界线、导航状态、移动端菜单

在哪儿被引入：src/layouts/Base.astro:109-111 的 <script>，那是一个 Astro 打包脚本，
由 Base 布局统一引入，所以每一个页面（含 404 / 418）都会执行本文件，页面里不用再 import。

改之前先记三条原则（这个文件里所有取舍都是它们推出来的）：
  - 首屏正文不做入场动画：LCP 元素必须第一帧就可见，否则首次渲染的分数会掉
  - 一次编排好的入场，好过每处各飞各的：节奏统一，读者不会觉得页面在乱动
  - prefers-reduced-motion 下全部跳过动画、直接终态（系统的「减少动态效果」开关优先于设计）

怎么用：给元素加 data-anim 属性即可，不用写 JS。入场动画的取值表：

  | data-anim 取值 | 挂在哪个元素上            | 实际动的对象                     | 效果                                                   |
  |----------------|---------------------------|----------------------------------|--------------------------------------------------------|
  | "fade"         | 任意块                    | 它自己                           | 从下方 28px、透明，0.9s 升到原位、不透明                |
  | "lines"        | 包着 .line-mask>span 的块 | 里面每一行的 span                | 每行从自己整行高处升上来，逐行错开（藏靠父级 overflow）  |
  | "stagger"      | 容器                      | 它的直接子元素                   | 子元素从下方 24px 淡入，依次错开                         |
  | "draw"         | SVG 容器                  | [data-stroke] 路径、[data-fill-fade] 块 | 路径按真实长度一笔笔画出来，随后填充块淡入       |
  | 不写 / 其它值  | —                         | —                                | 不动（脚本直接跳过，写错了不会报错，也不会有动画）      |

  data-delay="0.12" 是额外延迟，单位秒（直接当 GSAP 的 delay 用），同一屏里几块要排先后时加它。
  四种入场都由「元素顶边到视口某个位置」触发，且只播一次（once: true），回头再滚不会重播。

可复制的 HTML 用法：

  <!-- 最常用：一句一段，滚到跟前从下往上淡入 -->
  <h2 class="h2" data-anim="fade">我们做一只猫头</h2>

  <!-- 同一片里的第二块，等第一块起来一点再跟上 -->
  <p class="lead" data-anim="fade" data-delay="0.12">……</p>

  <!-- 逐行升起：每一行都必须包一层 .line-mask > span（样式在 styles/global.css:258） -->
  <h2 data-anim="lines">
    <span class="line-mask"><span>第一行</span></span>
    <span class="line-mask"><span>第二行</span></span>
  </h2>

  <!-- 容器里的孩子依次浮现：data-anim 挂容器，动的是直接子元素（孙子不管） -->
  <ul class="cards" data-anim="stagger" data-delay="0.1">
    <li class="card">…</li>
    <li class="card">…</li>
  </ul>

  <!-- 描线：data-stroke 的路径按长度画，data-fill-fade 的块在画到一半时淡入 -->
  <svg class="figure" data-anim="draw" viewBox="0 0 400 240">
    <path data-stroke d="…" fill="none" stroke="currentColor" />
    <rect data-fill-fade x="0" y="0" width="400" height="240" fill="var(--cream)" />
  </svg>

除了 data-anim，本文件还接管这些属性（都在下面各自的段落里，改样式前先看那段注释）：
  data-scrub / data-scrub-x / data-scrub-y / data-scrub-rotate / data-scrub-scope
  data-scrub-line   一条发丝线，随段落进度从左画到右
  data-count        数字从 0 滚到属性里写的数（小数位跟着属性里的写法走）
  data-parallax / data-parallax-scope   视差，默认幅度 60px
  data-stream       整段文字拆成字/词，进视口时逐字去模糊（拉丁按词、中文按字）
  data-collapse / data-collapse-toggle  折叠块，只切 class，高度交给 CSS 自己插值
  data-copy         点一下把属性里的值复制走，2.5s 后按钮自己复原
  data-worldline / data-wl-track / data-wl-fill   钉住一屏，横向随滚动推进
  data-nav / data-progress / data-rail-item / data-menu-toggle / data-menu-panel   导航与菜单
*/
import Lenis from 'lenis';                 // 平滑滚动本体
import gsap from 'gsap';                   // 补间引擎
import ScrollTrigger from 'gsap/ScrollTrigger'; // 把补间挂到滚动位置上

// 用户的系统设置：开了「减少动态效果」就整套动画都不做。只读一次，运行时不再变
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

gsap.registerPlugin(ScrollTrigger);        // 注册后 gsap 的 tween 才认 scrollTrigger 配置

// --- Lenis ---

let lenis: Lenis | null = null;            // 平滑滚动实例；reduced-motion 下始终为 null，别处靠它判断是否有平滑滚动

// --- 起平滑滚动 ---
function initSmoothScroll() {
  if (reduceMotion) return;                // 用户关了动效：保留浏览器原生滚动，不接管

  lenis = new Lenis({
    duration: 1.05,                        // 一次滚动大约一秒出头停稳。再长会「黏」，再短又回到生硬的原生手感
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // 起步快、尾巴长：手指停了以后余速自然衰减
    smoothWheel: true,                     // 只接管滚轮；触控板/键盘的惯性交给系统自己
    syncTouch: false,                      // 手机不同步接管触摸：原生惯性比 Lenis 模拟的更跟手，别跟系统抢
    touchMultiplier: 1.4,                  // 手指划一下走 1.4 倍距离：小屏一屏内容很长，1 倍要划很多下
  });

  lenis.on('scroll', ScrollTrigger.update); // Lenis 自己算的滚动位置要喂给 ScrollTrigger，否则触发点算不准
  gsap.ticker.add((time) => lenis?.raf(time * 1000)); // 让 Lenis 跟着 gsap 的帧循环走（time 是秒，Lenis 要毫秒）
  gsap.ticker.lagSmoothing(0);             // 关掉 gsap 的掉帧补偿：它会为追帧把时间轴整体放慢，和 Lenis 自己的 delta 叠加会一顿一顿

  document.documentElement.classList.add('has-lenis'); // 给样式留的钩子：有平滑滚动时页面才是可滚动的容器
}

// --- 锚点跳转 ---
/* 锚点跳转走 Lenis，保留键盘与 reduced-motion 的原生行为 */
function initAnchors() {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;              // 点到的那个节点
    const link = target?.closest?.('a[href^="#"]') as HTMLAnchorElement | null; // 是不是页内锚点（点在按钮里的文字上也认）
    if (!link) return;                                          // 不是页内链接：交给浏览器
    const id = link.getAttribute('href');                       // 目标选择器，比如 "#story"
    if (!id || id === '#') return;                              // 空链接或只有个 #：没有目标，别拦
    const el = document.querySelector(id);                      // 真去找那一屏，找不到就当没这回事
    if (!el) return;
    e.preventDefault();                                         // 到这里确认了目标，才拦掉浏览器的瞬间跳转

    const navOffset = -72;                                      // 顶部导航是 fixed、高 76px（components/Nav.astro:131），减掉它标题才不被压住；留 4px 余量不贴死
    if (lenis) {
      lenis.scrollTo(el as HTMLElement, { offset: navOffset, duration: 1.2 }); // 有平滑滚动：交给 Lenis 滚，1.2s 比滚轮那次略长，远距离跳转才不会冲太快
    } else {
      const y = (el as HTMLElement).getBoundingClientRect().top + window.scrollY + navOffset; // 没有 Lenis（reduced-motion）：自己算目标位置（视口内位置 + 已滚距离 + 导航偏移）
      window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' }); // 关动效就瞬间到位，否则用浏览器的平滑滚动
    }
    history.replaceState(null, '', id);                          // 地址栏跟着换，但不新增历史记录（返回键仍然回上一页）
  });
}

// --- 入场编排 ---
const EASE = 'expo.out';                   // 入场统一用这条曲线：起步快、收尾长，落位时「轻轻停住」，比线性更像实物

// --- 滚到跟前就入场 ---
function initReveals() {
  const items = gsap.utils.toArray<HTMLElement>('[data-anim]'); // 页面里所有声明了入场动画的元素
  if (!items.length) return;                                    // 这一页没有：直接回去，不做无谓开销

  if (reduceMotion) {
    // 直接终态
    items.forEach((el) => el.classList.add('is-in'));           // 逐个打上终态类（有的样式拿它跳过过渡），不播任何补间
    return;
  }

  items.forEach((el) => {
    const kind = el.dataset.anim;                               // 要哪种入场（取值见文件头那张表）
    const delay = parseFloat(el.dataset.delay ?? '0');           // 额外延迟，单位秒；没写就是 0

    // fade：整块从下方 28px 升上来。28 只够让人看出「从下往上」，再大就成了幻灯片
    if (kind === 'fade') {
      gsap.fromTo(
        el,
        { y: 28, opacity: 0 },                                  // 起始：下方 28px、全透明
        {
          y: 0,
          opacity: 1,
          duration: 0.9,                                        // 0.9s：一段正文的常规入场长度，再快像闪一下，再慢会挡人读
          delay,
          ease: EASE,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }, // 元素顶到视口 88% 处就开演：还没完全进屏就开始，等读者看到时已经落稳
        }
      );
    }

    // lines：逐行升起。每行一层 .line-mask（overflow: hidden），动的是里面那个 span
    if (kind === 'lines') {
      const lines = el.querySelectorAll<HTMLElement>('.line-mask > span'); // 一行一个 span，父级负责裁切
      gsap.fromTo(
        lines,
        { yPercent: 108 },                                      // 起始：整行高度往下 108%（100% 就刚好藏住，多出的 8% 吃掉亚像素误差，否则会漏一条边）
        {
          yPercent: 0,
          duration: 1.1,                                        // 比 fade 长一点：一行文字的位移更远，走快了会糊
          stagger: 0.075,                                       // 每行差 75ms：看得出是一行行来，又不会排成队形等太久
          delay,
          ease: EASE,
          scrollTrigger: { trigger: el, start: 'top 85%', once: true }, // 85%（比 fade 早一点）：大标题是这一屏的主角，先起来
        }
      );
    }

    // stagger：孩子依次浮现。只动直接子元素，孙子由各自的 data-anim 决定
    if (kind === 'stagger') {
      const kids = Array.from(el.children) as HTMLElement[];    // 只取直接子元素，别把嵌套层一起翻出来
      gsap.fromTo(
        kids,
        { y: 24, opacity: 0 },                                  // 起始：下方 24px、全透明（比 fade 略小，卡片块数多，位移大了会显得闹）
        {
          y: 0,
          opacity: 1,
          duration: 0.8,                                        // 每块 0.8s，稍微短于 fade：一块块来，整体别拖太久
          stagger: 0.07,                                        // 每块差 70ms：十来块也就是半秒出头的顺序感
          delay,
          ease: EASE,
          scrollTrigger: { trigger: el, start: 'top 86%', once: true },
        }
      );
    }

    // draw：SVG 描线。路径按真实长度做成虚线，再把偏移收到 0，看起来像一笔画出来
    if (kind === 'draw') {
      const paths = el.querySelectorAll<SVGGeometryElement>('[data-stroke]'); // 要描的线，由作者在 SVG 里标好（只描标了的，不猜）
      paths.forEach((path) => {
        const len = path.getTotalLength ? path.getTotalLength() : 0; // 线的实际长度：虚线段长必须等于它，整条线才是一段
        if (!len) return;                                     // 量不出长度（比如浏览器不支持）就跳过这条
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len }); // 先全藏：一段长度为 len 的虚线，整体挪走 len
        gsap.to(path, {
          strokeDashoffset: 0,                                // 偏移收到 0，虚线段正好铺满整条线
          duration: 1.6,                                      // 1.6s：描线是给人「看它慢慢画」的，短了就成了瞬间出现
          ease: 'power2.inOut',                               // 两头慢中间快，笔锋感；这里不用统一的 expo，描线抢跑会显得急
          scrollTrigger: { trigger: el, start: 'top 78%', once: true }, // 78%（四种里最早）：线要画 1.6s，得提前开演，读者到跟前时刚好画完
        });
      });
      const fills = el.querySelectorAll<HTMLElement>('[data-fill-fade]'); // 描完线要跟着显形的色块
      gsap.fromTo(
        fills,
        { opacity: 0 },                                       // 起始：全透明
        {
          opacity: 1,
          duration: 1,                                        // 1s 淡入，比描线短，落在描线尾巴上
          delay: 0.5,                                         // 等 0.5s 再起：让线先画到一半，填充才不像抢跑（注意这一支不叠加 data-delay）
          stagger: 0.12,                                      // 每块差 120ms：几个填充块依次盖上
          ease: 'power1.out',                                 // 淡入用更平的曲线，色块不抢描线的戏
          scrollTrigger: { trigger: el, start: 'top 78%', once: true }, // 和上面的描线同一个触发点
        }
      );
    }
  });
}

// --- 滚动联动（scrub）---
/* 让每一屏都「跟着手走」，而不只是入场一次 */
function initScrub() {
  if (reduceMotion) return;                                   // 关动效：这些元素就一直停在原位

  // 进度按哪块区域算：优先作者标的 data-scrub-scope，其次所在的 section，最后退到元素自己
  const scopeOf = (el: HTMLElement) => (el.closest('[data-scrub-scope]') as HTMLElement | null) ?? el.closest('section') ?? el;

  gsap.utils.toArray<HTMLElement>('[data-scrub]').forEach((el) => {
    const y = parseFloat(el.dataset.scrubY ?? '0');            // 纵向总共要走多少 px
    const x = parseFloat(el.dataset.scrubX ?? '0');            // 横向总共要走多少 px
    const r = parseFloat(el.dataset.scrubRotate ?? '0');       // 总共转多少度
    if (!y && !x && !r) return;                               // 三个都是 0：没写幅度，跳过（免得白建一个触发器）

    gsap.fromTo(
      el,
      { y: -y / 2, x: -x / 2, rotate: -r / 2 },                // 起始在「总幅度」的一半反向：往 + 方向走一半，往 - 方向也走一半
      {
        y: y / 2,
        x: x / 2,
        rotate: r / 2,
        ease: 'none',                                          // 线性：进度和滚动严格 1:1，别在中间加缓动
        scrollTrigger: {
          trigger: scopeOf(el),
          start: 'top bottom',                                 // 区域顶边刚进视口底部就开始
          end: 'bottom top',                                   // 区域底边离开视口顶部才结束
          scrub: 0.7,                                          // 0.7s 阻尼：完全 0 会像硬贴在手上，这点延迟让元素「跟得上但不黏」
        },
      }
    );
  });

  // 发丝线随段落进度画出
  gsap.utils.toArray<HTMLElement>('[data-scrub-line]').forEach((el) => {
    gsap.fromTo(
      el,
      { scaleX: 0 },                                          // 起始：横向缩到 0（宽度不变，视觉上是一条线）
      {
        scaleX: 1,
        ease: 'none',
        transformOrigin: 'left center',                        // 从左边开始长，不是从中间往两边
        scrollTrigger: {
          trigger: scopeOf(el),
          start: 'top 88%',                                    // 段落顶到 88% 处开始画
          end: 'top 32%',                                      // 段落顶走到 32% 处画满：正好在读者读到这段时收尾
          scrub: 0.5,                                          // 比位移那组阻尼小一点：线是细的，跟手要更紧
        },
      }
    );
  });
}

// --- 数字滚动 ---
/* 只在出现时触发一次 */
function initCounters() {
  const nodes = gsap.utils.toArray<HTMLElement>('[data-count]'); // 页面里所有要滚的数字
  if (!nodes.length || reduceMotion) return;                  // 没有目标，或者用户关了动效：数字保持 HTML 里的原值

  nodes.forEach((el) => {
    const raw = el.dataset.count ?? '';                       // 属性里的写法，比如 "1,280" 或 "98.6%"
    const target = parseFloat(raw.replace(/[^\d.]/g, '')) || 0; // 去掉千分位、百分号再取数，取不出来就当 0
    const decimals = (raw.split('.')[1] ?? '').length;        // 小数点后几位就保留几位：和作者写的精度对齐
    const counter = { v: 0 };                                 // 补间只能动对象属性，所以拿一个中间对象当计数器
    gsap.to(counter, {
      v: target,                                              // 从 0 补到目标值
      duration: 1.4,                                          // 1.4s：数字跳太快读者看不清，太慢又会让人等
      ease: 'power2.out',                                     // 先快后慢：一开始就有变化，末尾稳稳停在整数上
      scrollTrigger: { trigger: el, start: 'top 90%', once: true }, // 快到 90%（基本进屏）才滚，避免读者没看到就滚完了
      onUpdate: () => {
        el.textContent = counter.v.toFixed(decimals);         // 每帧写回，精度按上面数出来的位数
      },
    });
  });
}

// --- 视差 ---
function initParallax() {
  if (reduceMotion) return;                                   // 关动效：不做视差
  gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
    const amount = parseFloat(el.dataset.parallax ?? '60');   // 要走的总幅度，没写就是 60px（够看出层叠，又不至于露出背景空洞）
    gsap.fromTo(
      el,
      { y: -amount * 0.5 },                                   // 起始上移一半
      {
        y: amount * 0.5,                                      // 走到下移一半，总位移正好是 amount
        ease: 'none',                                         // 线性：视差和滚动必须同步，加缓动会打架
        scrollTrigger: { trigger: el.closest('[data-parallax-scope]') ?? el, start: 'top bottom', end: 'bottom top', scrub: true }, // 按整块区域的范围算进度，true = 完全跟手
      }
    );
  });
}

// --- 顶部导航状态 + 右侧段落索引 ---
function initChrome() {
  const nav = document.querySelector<HTMLElement>('[data-nav]');           // 顶部导航
  const progress = document.querySelector<HTMLElement>('[data-progress]'); // 顶部那条阅读进度线

  const onScroll = () => {
    const y = window.scrollY;                                 // 此刻滚到哪儿
    if (nav) nav.classList.toggle('is-stuck', y > 24);         // 滚过 24px 才贴上背景：阈值太小会在顶部一像素抖动时闪
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight; // 全页还能滚多远
      const p = max > 0 ? Math.min(1, y / max) : 0;            // 读到的比例，夹在 0~1（页面比屏还短时就是 0）
      progress.style.transform = `scaleX(${p})`;                // 直接改 transform：每帧都跑，别碰会引发布局的属性
    }
  };
  onScroll();                                                 // 先跑一次：刷新时可能已经在半页，不等第一次滚动
  window.addEventListener('scroll', onScroll, { passive: true }); // passive：告诉浏览器这里不会 preventDefault，滚动不被拖慢

  // 章节高亮
  const rail = document.querySelectorAll<HTMLElement>('[data-rail-item]'); // 右侧索引里的每一项（指到某一章的锚点）
  if (rail.length) {
    const sections = Array.from(rail)
      .map((a) => document.querySelector<HTMLElement>(a.getAttribute('href') ?? '')) // 按 href 找到对应那一屏
      .filter((el): el is HTMLElement => Boolean(el));        // 目标可能不在这一页（别的页复用的导航），剔掉
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;                  // 关心的是「谁进来了」，离开不用管
          const id = '#' + entry.target.id;                   // 进来的那一屏的锚点名
          rail.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === id)); // 只点亮对应的那一项
        });
      },
      // 上下各切掉一截，只剩屏幕中间 5% 高的一条探测带：保证任何时刻最多只有一屏算「当前章节」
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );
    sections.forEach((s) => io.observe(s));                   // 每一屏都交给这个观察器
  }
}

// --- 移动端菜单 ---
function initMenu() {
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]'); // 汉堡按钮
  const panel = document.querySelector<HTMLElement>('[data-menu-panel]');         // 弹出的菜单面板
  if (!toggle || !panel) return;                              // 这一页没有菜单：直接回去

  const setOpen = (open: boolean) => {
    panel.classList.toggle('is-open', open);                  // 面板显隐交给 CSS
    toggle.setAttribute('aria-expanded', String(open));       // 读屏要知道现在是展开还是收起
    document.documentElement.classList.toggle('menu-open', open); // 根节点上的标记：样式用它锁页面滚动
    if (lenis) open ? lenis.stop() : lenis.start();           // 菜单开着时冻住平滑滚动，免得在菜单上滚还把背后的页面滚走
  };

  toggle.addEventListener('click', () => setOpen(!panel.classList.contains('is-open'))); // 点按钮切换：状态以面板自己的 class 为准，不另存一份
  panel.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false))); // 点了菜单里的链接就收起
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);                   // Esc 关闭：键盘用户没别的出口
  });
}

// --- 流式打字 ---
/* 单字 90ms 从 blur(6px) 到清晰，相邻错开 30ms */
function initTextStream() {
  if (reduceMotion) return;                                   // 关动效：整段文字原样留着，一个字都不拆

  // 拉丁按词切、中文按字切，避免把英文单词拆到两行
  const TOKEN = /([A-Za-z0-9][A-Za-z0-9'’\-.]*|[\s\S])/g;

  const targets = Array.from(
    document.querySelectorAll<HTMLElement>('[data-stream]')    // 所有要求流式打字的块
  );
  if (!targets.length) return;                                // 没有目标：回去

  targets.forEach((el) => {
    // 只处理纯文本节点，避免破坏内部结构
    if (el.children.length > 0) return;                       // 里面已经有标签（比如 <em>）：拆字会把它拆坏，整块放弃

    const text = el.textContent ?? '';                        // 原文，拆完要靠它还原读屏和 aria
    if (!text.trim()) return;                                 // 空块或只有空白：没什么可拆的

    // 交给流式动画后，撤掉 gsap 的整块淡入，避免双重动画
    el.removeAttribute('data-anim');                          // 先把 data-anim 撤掉：initReveals 在 boot 里排在后面，撤了它就不会再给整块做淡入
    el.style.opacity = '1';                                   // 整块显式可见：逐字的透明度由下面每个 span 自己控

    const frag = document.createDocumentFragment();           // 先在内存里拼好碎片，最后一次插进去（少触发几次重排）
    const parts: HTMLElement[] = [];                          // 真正要动的那几段（空白段不进来）
    const tokens = text.match(TOKEN) ?? [];                   // 切成一个一个词/字

    tokens.forEach((tk) => {
      const span = document.createElement('span');            // 每个词/字包一层，动画要逐段单独跑
      span.className = 'stream-ch';                           // 样式钩子：初始透明、留好 will-change
      span.textContent = tk === '\u0020' || tk === ' ' ? '\u00A0' : tk; // 普通空格换成不换行空格：inline-block 的普通空格会被吃掉，词会粘在一起
      frag.appendChild(span);                                 // 攒进碎片
      if (tk.trim()) parts.push(span);                        // 只把有字的段排进动画顺序；空格不占一拍，否则字与字之间会有怪空拍
    });

    el.setAttribute('aria-label', text);                      // 读屏读整句原文，不读被拆开的碎词
    el.textContent = '';                                      // 清空原来的文本，再塞碎片
    el.appendChild(frag);
    el.classList.add('is-streaming');                         // 标记「已拆好」：样式从这里开始把字藏起来（无 JS 时字本来就可见）
    parts.forEach((s) => s.setAttribute('aria-hidden', 'true')); // 碎词对读屏隐藏，避免逐字念

    // 保险：2s 内没触发视口动画就直接显形，别把标题留在不可见状态
    const safety = window.setTimeout(() => {
      if (!el.classList.contains('is-stream-done')) reveal();  // 2s 是兜底：观察器万一没回调（极端布局/省电模式），也得让字露出来
    }, 2000);

    const reveal = () => {
      window.clearTimeout(safety);                            // 已经显形了，兜底定时器没用了
      el.classList.add('is-stream-done');                     // 样式据此把整块字放出来
    };

    const io = new IntersectionObserver(
      ([entry], obs) => {
        if (!entry.isIntersecting) return;                    // 还没进视口：什么都不做，也就不会白播
        obs.disconnect();                                     // 只播一次：进场后立刻断开观察
        reveal();                                             // 先把块放出来（逐字的特效由下面每个 span 自己演）
        parts.forEach((s, i) => {
          s.animate(
            [
              { filter: 'blur(6px)', opacity: 0 },            // 起始：糊的、透明的
              { filter: 'blur(0px)', opacity: 1 },            // 终态：清晰
            ],
            {
              duration: 90,                                   // 单字 90ms：比这个短看不出「打出来」，比这个长整句会读得慢
              delay: i * 30,                                  // 相邻错开 30ms：连成一串往前推，又不至于等太久
              easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)',  // easeOutCubic：开头就动、收尾稳，最像字落纸
              fill: 'both',                                   // 两端都保持：延迟期间不会先闪出来
            }
          );
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.15 }      // 底边切掉 8%、露出 15% 才开始：字刚探个头就开演会看得人发呆
    );
    io.observe(el);
  });
}

// --- 折叠 ---
/* 只切 class，高度由 grid 0fr→1fr 自己插值 */
function initCollapse() {
  document.querySelectorAll<HTMLElement>('[data-collapse]').forEach((box) => {
    const btn = box.querySelector<HTMLButtonElement>('[data-collapse-toggle]'); // 这一块自己的开关按钮
    if (!btn) return;                                         // 没给按钮：这块不能开合，跳过
    btn.addEventListener('click', () => {
      const open = !box.classList.contains('is-open');        // 当前是什么状态以 class 为准
      box.classList.toggle('is-open', open);                  // 高度变化交给 CSS 的 grid 过渡，JS 不碰 height
      btn.setAttribute('aria-expanded', String(open));        // 读屏同步开关状态
    });
  });
}

// --- 复制到剪贴板 ---
/* 对勾微弹一下就停，2.5s 后自动淡回原状 */
function initCopy() {
  // 浏览器不给用剪贴板接口时的退路：造一个看不见的 textarea，选中、复制、扔掉
  const copyWithTextarea = (value: string) => {
    const ta = document.createElement('textarea');            // 临时的取词框
    ta.value = value;                                         // 把要复制的内容放进去
    ta.style.position = 'fixed';                              // 固定定位：不参与文档流，页面不会跳一下
    ta.style.opacity = '0';                                   // 看不见，但仍然可以选中
    document.body.appendChild(ta);                            // 必须进文档才能被 select()
    ta.select();                                              // 全选这段文字
    try {
      document.execCommand('copy');                           // 老接口，但它是唯一不依赖权限的退路
    } catch {
      /* ignore */                                            // 这条路也走不通就算了：不弹错，用户会自己再点一次
    }
    ta.remove();                                              // 用完就清掉，别在 DOM 里留垃圾
  };

  document.addEventListener('click', async (e) => {
    const btn = (e.target as HTMLElement)?.closest?.('[data-copy]') as HTMLElement | null; // 点到的按钮（点在里层图标上也认）
    if (!btn) return;                                         // 点的不是复制按钮：不管
    const value = btn.dataset.copy ?? '';                     // 要复制的原文就在属性里
    if (!value) return;                                       // 没给内容：不复制空串，也不给反馈

    try {
      await navigator.clipboard.writeText(value);             // 首选：现代剪贴板接口
    } catch {
      copyWithTextarea(value);                                // 被拒（非安全上下文、权限被关）：走退路
    }

    btn.dataset.copied = 'true';                              // 换个状态：样式据此把对勾弹出来
    btn.dispatchEvent(new CustomEvent('copied', { bubbles: true })); // 通知外面（比如埋点）这次复制成了
    window.clearTimeout(Number(btn.dataset.copyTimer ?? 0));  // 连点两下时，先撤掉上一条复原计时，否则会提前复原
    const timer = window.setTimeout(() => {
      delete btn.dataset.copied;                              // 2.5s 后复原：够读者看到对勾，又不会一直挂着
    }, 2500);
    btn.dataset.copyTimer = String(timer);                    // 计时器句柄存在 dataset 里：这是每个按钮自己的状态，别处拿不到变量
  });
}

// --- 世界线 ---
/* 钉住一屏，横向随滚动推进 + 轴线填充 */
function initWorldline() {
  const section = document.querySelector<HTMLElement>('[data-worldline]');       // 钉住的那一屏
  const track = section?.querySelector<HTMLElement>('[data-wl-track]');          // 里面横向排开的长条
  const fill = section?.querySelector<HTMLElement>('[data-wl-fill]');            // 底下那条进度轴线
  if (!section || !track) return;                                                  // 这一页没有世界线（或没给轨道）：回去
  if (reduceMotion || window.matchMedia('(max-width: 1023px)').matches) return;  // 关动效或窄屏：横向钉屏在小屏上会把内容挤没，直接不接管

  let shift = 0;                                              // 轨道总共要往左挪多少 px
  const measure = () => {
    shift = Math.max(0, track.scrollWidth - track.parentElement!.clientWidth); // 轨道比可视宽度多出来的那段；内容比屏窄时就不挪（不给负数）
  };
  measure();                                                  // 先量一次，下面 end 的计算要用

  const tween = gsap.to(track, {
    x: () => -shift,                                          // 挪到正好露出最后一块
    ease: 'none',                                             // 线性：横向推进和纵向滚动严格同步
    scrollTrigger: {
      trigger: section,
      start: 'top 78%',                                       // 这一屏顶到 78% 处开始接管横向
      end: () => '+=' + Math.max(320, shift * 0.9),            // 滚动距离取轨道的九成（略短于横向距离，感觉更紧凑）；最少 320px，内容很少时也留一段可滚的行程
      scrub: 0.7,                                             // 和上面那组位移同一个阻尼：手感统一
      invalidateOnRefresh: true,                              // 窗口变了重算时，让 x/end 这些函数值重新求一遍（shift 是变量，不重算就会用旧值）
      onUpdate: (self) => {
        if (fill) fill.style.width = (self.progress * 100).toFixed(1) + '%'; // 轴线按进度填：一位小数够平滑，也避免每帧拼超长字符串
      },
    },
  });

  ScrollTrigger.addEventListener('refreshInit', measure);     // 每次重算触发点之前先重新量宽度（字体/图片迟到会改宽度）
  window.addEventListener('resize', () => {
    measure();                                                // 尺寸变了先量
    tween.scrollTrigger?.refresh();                           // 再让 ScrollTrigger 按新尺寸重算一遍触发点
  });
}

// --- 开机 ---
const boot = () => {
  // 顺序有讲究：TextStream 必须在 Reveals 之前——它要先把 data-stream 块上的 data-anim 撤掉，
  // 否则同一块会被「整块淡入」和「逐字去模糊」两套动画各演一遍
  initTextStream();
  initCopy();
  initCollapse();
  initWorldline();
  initSmoothScroll();      // 平滑滚动先起：后面的锚点、菜单都要用它，ScrollTrigger 也靠它喂位置
  initAnchors();
  initReveals();
  initScrub();
  initCounters();
  initParallax();
  initChrome();
  initMenu();
  ScrollTrigger.refresh(); // 全部挂完再统一算一次触发点：此时布局稳定，位置才对
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true }); // 文档还在下载：等 DOM 好了再开（once：只开一次）
} else {
  boot();                                                 // 脚本是后加载的（DOM 已就绪）：直接开
}

// 字体加载完成后重新计算 ScrollTrigger 位置，避免首帧布局偏差
// 字体换了字宽就变、元素高度跟着变，触发点会偏；所以字体 ready 后再 refresh 一次
if (document.fonts?.ready) {
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}

export {}; // 标成模块：否则这些顶层声明会落进全局作用域，和别的脚本撞名
