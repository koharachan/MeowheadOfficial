import { useCallback, useEffect, useRef, useState } from 'react';

export interface PlayItem {
  id: string;
  name: string;
  note: string;
  image: string;
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
  const [active, setActive] = useState(items[0]?.id ?? '');
  const [bubble, setBubble] = useState<string | null>(null);
  const [pokes, setPokes] = useState(0);
  const [fading, setFading] = useState(false);
  const timer = useRef<number | null>(null);

  const current = items.find((i) => i.id === active) ?? items[0];

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const poke = useCallback(() => {
    if (!items.length) return;
    setPokes((n) => n + 1);
    const nextIndex = items.findIndex((i) => i.id === active);
    const nextState = items[(nextIndex + 1) % items.length];
    setActive(nextState.id);
    setBubble(lines[(pokes + 1) % lines.length] ?? lines[0]);

    setFading(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setFading(false), 60);
  }, [active, items, lines, pokes]);

  const select = (id: string) => {
    setActive(id);
    setBubble(null);
  };

  const doReset = () => {
    setActive(items[0]?.id ?? '');
    setBubble(null);
    setPokes(0);
  };

  if (!current) return null;

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
            data-fading={fading ? 'true' : 'false'}
            decoding="async"
          />
        </button>

        <p className="play__bubble" data-show={bubble ? 'true' : 'false'} aria-live="polite">
          {bubble}
        </p>

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
            aria-pressed={item.id === active}
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
