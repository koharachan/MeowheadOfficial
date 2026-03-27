import { useEffect, useRef } from 'react';

interface MatrixRainProps {
  className?: string;
  density?: number;
  fontSize?: number;
  speed?: number;
  color?: string;
  opacity?: number;
}

const DEFAULT_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export default function MatrixRain({
  className,
  density = 0.95,
  fontSize = 14,
  speed = 1,
  color = 'rgba(34,211,238,0.95)',
  opacity = 0.9,
}: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);

    const resize = () => {
      const { innerWidth, innerHeight } = window;
      canvas.width = Math.floor(innerWidth * dpr);
      canvas.height = Math.floor(innerHeight * dpr);
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const columns = () => Math.max(1, Math.floor(window.innerWidth / fontSize));
    let drops = Array.from({ length: columns() }, () => Math.random() * 1000);

    const onResize = () => {
      resize();
      drops = Array.from({ length: columns() }, () => Math.random() * 1000);
    };
    window.addEventListener('resize', onResize);

    let raf = 0;
    const render = () => {
      ctx.fillStyle = `rgba(0,0,0,${0.08})`;
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace`;
      ctx.fillStyle = color;

      const cols = columns();
      for (let i = 0; i < cols; i++) {
        const char = DEFAULT_CHARS[Math.floor(Math.random() * DEFAULT_CHARS.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        if (Math.random() < density) {
          ctx.globalAlpha = opacity;
          ctx.fillText(char, x, y);
          ctx.globalAlpha = 1;
        }

        if (y > window.innerHeight && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += speed;
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [color, density, fontSize, opacity, speed]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
