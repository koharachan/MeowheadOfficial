import { motion } from 'framer-motion';

interface BackgroundBeamsProps {
  className?: string;
}

export default function BackgroundBeams({ className }: BackgroundBeamsProps) {
  return (
    <div className={className} aria-hidden="true">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.55] [mask-image:radial-gradient(60%_60%_at_50%_38%,black,transparent)]">
          <div className="absolute -inset-32 bg-[linear-gradient(120deg,rgba(247,108,94,0.35),rgba(246,142,95,0.22),rgba(50,67,118,0.18),rgba(247,108,94,0.28))] blur-2xl" />
        </div>

        <div className="absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(55%_70%_at_50%_45%,black,transparent)]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>

        <motion.div
          className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/25 blur-3xl"
          animate={{
            x: ['-50%', '-47%', '-52%', '-50%'],
            y: [-10, 12, -6, -10],
            opacity: [0.55, 0.7, 0.6, 0.55],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div
          className="absolute -bottom-32 left-[15%] h-[420px] w-[420px] rounded-full bg-accent/20 blur-3xl"
          animate={{
            x: [0, 20, -8, 0],
            y: [0, -12, 10, 0],
            opacity: [0.45, 0.6, 0.5, 0.45],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(255,255,255,0.65),transparent_55%)]" />
      </div>
    </div>
  );
}
