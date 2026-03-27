import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

interface BackgroundBeamsProps {
  className?: string;
}

export function BackgroundBeams({ className }: BackgroundBeamsProps) {
  return (
    <div className={cn('pointer-events-none absolute inset-0', className)} aria-hidden="true">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.7] [mask-image:radial-gradient(60%_60%_at_50%_38%,black,transparent)]">
          <div className="absolute -inset-40 bg-[linear-gradient(120deg,rgba(34,211,238,0.22),rgba(59,130,246,0.18),rgba(168,85,247,0.16),rgba(34,211,238,0.20))] blur-3xl" />
        </div>

        <div className="absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(55%_70%_at_50%_45%,black,transparent)]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:72px_72px]" />
        </div>

        <motion.div
          className="absolute -top-24 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl"
          animate={{
            x: ['-50%', '-46%', '-53%', '-50%'],
            y: [-14, 10, -8, -14],
            opacity: [0.45, 0.62, 0.52, 0.45],
          }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div
          className="absolute -bottom-40 left-[18%] h-[460px] w-[460px] rounded-full bg-fuchsia-400/15 blur-3xl"
          animate={{
            x: [0, 24, -10, 0],
            y: [0, -14, 12, 0],
            opacity: [0.35, 0.55, 0.42, 0.35],
          }}
          transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(255,255,255,0.12),transparent_55%)]" />
      </div>
    </div>
  );
}
