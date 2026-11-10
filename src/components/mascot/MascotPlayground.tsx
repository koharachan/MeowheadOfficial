/*
吉祥物游乐场：吉祥物页 #play 那一屏的互动件，点它一下换一个表情。

  - 点一下 = 换到下一个表情，同时从台词表里挑下一句气泡
  - 下面那排按钮可以直接指定某个状态（跳过轮换）
  - POKE 计数记下被点了几下，纯好玩；重置按钮把它清零
  - 换表情的瞬间给 data-fading，让 CSS 再播一次 60ms 的闪动，看着像换了个频道

在 Astro 里调用（client:visible = 滚到这一屏才开始跑）：

  <MascotPlayground
    client:visible
    items={t.mascot.states.map((s) => ({ id: s.id, name: s.label, note: s.note, image: s.image }))}
    lines={t.mascotPage.play.lines}   // 气泡台词表，点一下换下一句
    hint={t.mascotPage.play.hint}     // 也是大按钮的 aria-label
    reset={t.mascotPage.play.reset}
    alt={t.mascot.alt}
  />
*/
import { useCallback, useEffect, useRef, useState } from 'react';

/** 一个可以点着玩的状态：id 用来记当前是哪个，name 是按钮上那两个字 */
export interface PlayItem {
  id: string;    // 状态名，和首页舞台共用同一份数据
  name: string;  // 按钮上显示的名字
  note: string;  // 这一屏没用上；留着是因为它和首页舞台吃同一份状态表
  image: string; // 这个状态用哪张图
}

export default function MascotPlayground({
  items,
  lines,
  hint,
  reset,
  alt,
}: {
  items: PlayItem[];
  lines: string[];
  hint: string;
  reset: string;
  alt: string;
}) {
  const [active, setActive] = useState(items[0]?.id ?? '');   // 当前是哪个状态（存 id，不存整个对象）
  const [bubble, setBubble] = useState<string | null>(null);  // 气泡里那句话；null = 不显示气泡
  const [pokes, setPokes] = useState(0);                      // 被点了几下，显示成 POKE 001
  const [fading, setFading] = useState(false);                // 正在闪的那 60ms，交给 CSS 播动画
  const fadeTimer = useRef<number | null>(null);              // 闪动的定时器，换手时要先清掉旧的

  const current = items.find((i) => i.id === active) ?? items[0]; // 按 id 找回来；找不到就退回第一个

  // --- 走的时候收尾 ---
  useEffect(() => () => {
    if (fadeTimer.current) window.clearTimeout(fadeTimer.current); // 组件卸了还有定时器在跑，会 setState 到空组件上
  }, []);

  // --- 点一下：换下一个状态 + 换下一句台词 ---
  const poke = useCallback(() => {
    if (!items.length) return;                                 // 没有状态可换（理论上不会，状态表是构建期给的）
    setPokes((n) => n + 1);                                    // 计数先加一，下面挑台词要用加完之后的值
    const position = items.findIndex((i) => i.id === active);  // 现在这个是第几个
    const nextState = items[(position + 1) % items.length];    // 下一个；最后一个绕回第一个
    setActive(nextState.id);                                   // 换脸
    setBubble(lines[(pokes + 1) % lines.length] ?? lines[0]);   // 台词跟着点击次数轮换，空表则留空

    setFading(true);                                           // 先把闪动打开
    if (fadeTimer.current) window.clearTimeout(fadeTimer.current); // 上一闪还没结束就先取消，免得两个叠着
    fadeTimer.current = window.setTimeout(() => setFading(false), 60); // 60ms 只是让 CSS 重放一次动画，够短到看不出停顿
  }, [active, items, lines, pokes]);

  // --- 下面那排按钮：直接指定状态，顺手把气泡收掉 ---
  const select = (id: string) => {
    setActive(id);      // 换成点中的那个
    setBubble(null);    // 气泡留着会跟新状态对不上
  };

  // --- 重置：回到第一个状态、清空气泡和计数 ---
  const doReset = () => {
    setActive(items[0]?.id ?? ''); // 回到第一个状态
    setBubble(null);
    setPokes(0);                   // POKE 计数清零
  };

  if (!current) return null;       // 一个状态都没有，这一屏干脆不渲染

  return (
    <div className="play">
      <div className="play__stage">
        <button type="button" className="play__hit" onClick={poke} aria-label={hint}>
          <img
            className="play__img"
            src={current.image}
            alt={alt}
            width={420}
            height={420}
            data-fading={fading ? 'true' : 'false'} // CSS 靠这个每次换脸都重播一下闪动
            decoding="async"
          />
        </button>

        <p className="play__bubble" data-show={bubble ? 'true' : 'false'} aria-live="polite">
          {bubble}
        </p>

        {/* 计数补到三位，跳数时宽度不抖，看着像游戏机上的计数器 */}
        <span className="play__pokes" aria-hidden="true">
          POKE {String(pokes).padStart(3, '0')}
        </span>
      </div>

      <div className="play__controls">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="play__btn"
            aria-pressed={item.id === active}  // 读屏能听出当前选的是哪个
            onClick={() => select(item.id)}
          >
            {item.name}
          </button>
        ))}
        <button type="button" className="play__reset" onClick={doReset}>
          {reset}
        </button>
      </div>
    </div>
  );
}
