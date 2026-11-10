/*
寻美舞台：首页第五屏那块框，寻美本人站在里面。

  - 页面往下滚，按滚动进度换表情（一次编排好顺序往下走，不做乱飞的动作）
  - 鼠标在页面上移动时整块图有轻微视差；点一下手动切到下一个状态
  - 系统开了「减少动态效果」（prefers-reduced-motion）时两样都不做，保持待机

在 Astro 里调用（React 岛，client:visible = 滚到这一屏才开始跑）：

  <MascotStage
    client:visible
    states={t.mascot.states}                                   // 状态表，数组顺序 = 滚动时切换的先后
    alt={t.mascot.alt}                                         // 读屏念的名字，拼进按钮的 aria-label
    reduceLabel={t.ux.close}                                   // 附在 aria-label 后面的提示语
    companion={{ image: '/x.webp', alt: '...', name: 'tible' }} // 框里右下角那只小的
  />

分工：组件只算「现在该露哪一张」并给它摆位置；长什么样全在 styles/islands.css 的
.stage / .stage__* 里。本文件不新增类名、不改外层布局，换皮请去改 CSS。
*/
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/** 一个心情状态：id 决定哪张图亮、label 是下面那行大字、note 是跟在大字后面的一句解释 */
export interface StageState {
  id: string;    // 状态名；'idle' 那张要立刻加载，其余等滚到跟前再说
  label: string; // 下面那行状态大字，比如「醒着」
  image: string; // 这个状态用哪张图
  note: string;  // 大字后面那句解释
}

// --- 状态和引用 ---

export default function MascotStage({ states, alt, reduceLabel, companion }: {
  states: StageState[];
  alt: string;
  reduceLabel: string;
  companion: { image: string; alt: string; name: string };
}) {
  const [index, setIndex] = useState(0);              // 滚动算出来的第几张（0 起），跟着滚动走
  const [clicks, setClicks] = useState(0);            // 手动点了几下；点了就把滚动算出的那张往后推几格
  const box = useRef<HTMLDivElement>(null);           // 整块舞台，量它在屏幕上的位置用
  const tiltLayer = useRef<HTMLDivElement>(null);     // 视差层，鼠标一动就改写它的 transform
  const riseLayer = useRef<HTMLDivElement>(null);     // 飞入层，从框底升上来的那一层
  const noMotion = useRef(false);                     // 系统是否要求减少动态效果（挂载后才问得到）
  const [preloaded, setPreloaded] = useState<Record<string, boolean>>({}); // 哪些图已经预加载过

  const count = states.length;                        // 一共几个状态，后面取模都要用它

  // --- 跟着滚动：换表情 + 从框底飞入 ---
  useEffect(() => {
    noMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches; // 先问一次系统设置
    if (noMotion.current) return;                    // 用户要求别动，就一个事件都不接，保持待机

    let raf = 0;                                     // 排到下一帧的句柄，滚动很密时只留最新一次
    const onScroll = () => {
      cancelAnimationFrame(raf);                     // 上一帧还没跑就丢掉，别排队
      raf = requestAnimationFrame(() => {
        const el = box.current;
        if (!el) return;                             // 还没挂到页面上，这一帧跳过
        const rect = el.getBoundingClientRect();     // 框此刻在屏幕上的位置和高度
        const vh = window.innerHeight;               // 屏幕高度，下面按它换算比例
        // 0..1 的滚动进度：框顶从「屏幕 85% 高处」进来说 0，走到「屏幕 15% 高处」算 1
        const raw = (vh * 0.85 - rect.top) / (rect.height + vh * 0.7);
        const progress = Math.min(1, Math.max(0, raw));                    // 掐掉两头越界的值
        const step = Math.min(count - 1, Math.floor(progress * count));    // 把进度铺到状态表上，取第几张
        setIndex(step);                                                    // 表情跟着这个数换

        /* 飞入：从框底升上来，先露头再露身；落定之后随滚动继续往上顶，越往下滑露出的越多 */
        const layer = riseLayer.current;
        if (layer) {
          const flight = Math.min(1, progress / 0.24); // 飞入只占前 24% 的滚动，剩下 76% 用来慢慢上顶
          // easeOutBack 曲线：落地时回弹一点，看着像真的站住了。1.34 是回弹的过冲量，再大会弹过头
          const backOvershoot = 1.34;
          const landed = 1 + (backOvershoot + 1) * Math.pow(flight - 1, 3) + backOvershoot * Math.pow(flight - 1, 2);
          // 落定后从 24% 到 100% 再缓缓上顶 8%：开头整只藏在框外，越往下滑露出的部分越多
          const settle = Math.min(1, Math.max(0, (progress - 0.24) / 0.76));
          const y = (1 - landed) * 62 - settle * 8;  // 62% 是起始深度：刚好整只在框沿下面，看不见
          const rotate = (1 - landed) * -10;         // 上来的时候轻轻歪一点，站直的过程本身就是「落地」
          const scale = 0.9 + landed * 0.1;          // 从 0.9 长到 1，落地那一下才有分量
          layer.style.transform = 'translate3d(0,' + y.toFixed(2) + '%,0) rotate(' + rotate.toFixed(2) + 'deg) scale(' + scale.toFixed(3) + ')';
          layer.style.opacity = String(Math.min(1, flight * 3)); // 前三分之一路程就淡到不透明，免得糊在前面
        }
      });
    };

    onScroll();                                      // 先按当前滚动位置摆一次，别等用户先动
    window.addEventListener('scroll', onScroll, { passive: true }); // 被动监听，不挡滚动的流畅度
    window.addEventListener('resize', onScroll);     // 窗口大小变了，百分比换出来的位置也变了
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);                     // 组件走的时候把还没跑的那一帧取消
    };
  }, [count]);

  // --- 跟着鼠标：轻微视差 ---
  useEffect(() => {
    if (noMotion.current) return;                    // 减少动态效果时也不跟鼠标
    const onMove = (e: PointerEvent) => {
      const el = tiltLayer.current;
      if (!el) return;                               // 还没挂上，这一下不算
      const r = el.getBoundingClientRect();          // 量这一层在屏幕上的位置，拿它当参照算偏移
      const dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;   // 横向偏离重心的量，约 -0.5..0.5
      const dy = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;  // 纵向同理
      // 16px / 10px / 2.2deg 是「刚好看得出来、又不晕」的幅度：横向多一点，纵向克制，转角只给一点
      el.style.transform = `translate3d(${(dx * 16).toFixed(2)}px, ${(dy * 10).toFixed(2)}px, 0) rotate(${(dx * 2.2).toFixed(2)}deg)`;
    };
    window.addEventListener('pointermove', onMove, { passive: true }); // 只读鼠标位置，用被动监听
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  // --- 预加载相邻两帧，切换时不闪 ---
  useEffect(() => {
    [index, index + 1].forEach((i) => {
      const state = states[((i % count) + count) % count];  // 最后一个往后要绕回第一张，所以取模两次
      if (!state || preloaded[state.image]) return;         // 没有这张 / 已经加载过，都不用再发请求
      const img = new Image();                              // 只建对象不插进页面，浏览器照样会去取图
      img.src = state.image;
      img.onload = () => setPreloaded((prev) => ({ ...prev, [state.image]: true })); // 记下来，下次别再加载
    });
  }, [index, states, count, preloaded]);

  // --- 点一下：手动切到下一个 ---
  const showNext = useCallback(() => {
    setClicks((n) => n + 1);        // 只记次数，具体换成哪一张留给下面的推导
  }, []);

  // --- 现在该露哪一张 ---
  // 滚动给出 index，手动点击在这个基础上往后推；两者都是「第几个」，所以直接相加再取模
  const current = useMemo(() => {
    const shifted = clicks > 0 ? (clicks + index) % count : index;      // 没点过就完全听滚动的
    return states[Math.min(count - 1, Math.max(0, shifted))] ?? states[0]; // 夹到合法下标，空表回第一张
  }, [clicks, index, count, states]);

  // --- 画面 ---
  return (
    <div className="stage" ref={box}>
      <div className="stage__frame">
        <div className="stage__rise" ref={riseLayer}>{/* 从框底升上来的那一层，位移由上面的滚动回调直接写 style */}
          <div className="stage__tilt" ref={tiltLayer}>{/* 视差层，鼠标回调改的就是它的 transform */}
            <button type="button" className="stage__hit" onClick={showNext} aria-label={`${alt} · ${reduceLabel}`}>
              {/* 所有状态的图都提前放进 DOM，只靠 data-active 挑一张显示：换表情时不用等新图下载 */}
              {states.map((s) => (
                <img
                  key={s.id}
                  className="stage__img"
                  src={s.image}
                  alt=""
                  aria-hidden="true"
                  data-active={s.id === current.id ? 'true' : 'false'} // CSS 靠这个只显示亮的那张
                  loading={s.id === 'idle' ? 'eager' : 'lazy'}         // 待机那张是第一眼要看的，走 eager
                  decoding="async"
                  draggable={false}                                   // 图被拖走会毁了舞台，禁掉
                  width={720}
                  height={720}                                        // 写死尺寸，图片迟到也不会跳版
                />
              ))}
            </button>
          </div>
        </div>

        <div className="stage__ledge" aria-hidden="true" />   {/* 框沿那圈硬边，纯装饰 */}
        <div className="stage__shadow" aria-hidden="true" />  {/* 她脚下一摊影子，纯装饰 */}

        <div className="stage__companion">
          <img src={companion.image} alt={companion.alt} width={96} height={96} loading="lazy" decoding="async" />
          <span className="mono-sm">{companion.name}</span>
        </div>

        {/* 状态名和解释会随滚动变，aria-live 让读屏也念一遍 */}
        <div className="stage__caption" aria-live="polite">
          <span className="stage__state mono">{current.label}</span>
          <span className="stage__note">{current.note}</span>
        </div>
      </div>
    </div>
  );
}
