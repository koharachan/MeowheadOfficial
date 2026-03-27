import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import MatrixRain from './MatrixRain';

interface SplashScreenProps {
  durationMs?: number;
  onlyOnce?: boolean;
}

export default function SplashScreen({ durationMs = 1600, onlyOnce = true }: SplashScreenProps) {
  const storageKey = useMemo(() => 'meowhead:splash:seen', []);
  const [open, setOpen] = useState(false);

  const ease = [0.2, 0.7, 0.2, 1] as const;
  const letters = Array.from('猫猫头开发');

  useEffect(() => {
    const seen = typeof window !== 'undefined' ? window.sessionStorage.getItem(storageKey) : '1';
    if (onlyOnce && seen === '1') return;

    setOpen(true);
    if (onlyOnce) window.sessionStorage.setItem(storageKey, '1');

    const t = window.setTimeout(() => setOpen(false), durationMs);
    return () => window.clearTimeout(t);
  }, [durationMs, onlyOnce, storageKey]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] bg-black"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <MatrixRain className="absolute inset-0" />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.10),transparent_60%)]" />

          <div className="relative flex h-full items-center justify-center px-6">
            <div className="text-center">
              <div className="text-xs font-semibold tracking-[0.22em] text-white/60">MEOWHEAD</div>

              <div className="mt-3 flex items-center justify-center gap-3">
                <motion.span
                  className="text-3xl font-bold tracking-tight text-white"
                  initial={{ opacity: 0, x: 0, filter: 'blur(10px)' }}
                  animate={{
                    opacity: [0, 1, 0],
                    x: [0, 0, -180],
                    filter: ['blur(12px)', 'blur(0px)', 'blur(14px)'],
                  }}
                  transition={{
                    duration: 0.8,
                    ease,
                    times: [0, 0.35, 1],
                  }}
                >
                  三握云
                </motion.span>

                <motion.span
                  className="text-2xl font-semibold tracking-tight text-white"
                  initial={{ opacity: 0, y: 8, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.24, ease: 'easeOut', delay: 0.48 }}
                >
                  - 快速出现
                </motion.span>
              </div>

              <motion.div
                className="mt-3 text-3xl font-bold tracking-tight text-white"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: {
                    transition: {
                      staggerChildren: 0.035,
                      delayChildren: 0.62,
                    },
                  },
                }}
              >
                {letters.map((ch, idx) => (
                  <motion.span
                    key={`${ch}-${idx}`}
                    className="inline-block"
                    variants={{
                      hidden: { opacity: 0, y: 10, filter: 'blur(10px)' },
                      show: {
                        opacity: 1,
                        y: 0,
                        filter: 'blur(0px)',
                        transition: {
                          duration: 0.28,
                          ease,
                        },
                      },
                    }}
                  >
                    {ch}
                  </motion.span>
                ))}
              </motion.div>

              <motion.div
                className="mt-2 text-sm text-white/60"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut', delay: 0.9 }}
              >
                系统启动中…
              </motion.div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
