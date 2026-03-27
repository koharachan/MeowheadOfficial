import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

interface StaggerLettersProps {
  text: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  stagger?: number;
  delay?: number;
}

export default function StaggerLetters({
  text,
  className,
  as = 'span',
  stagger = 0.018,
  delay = 0,
}: StaggerLettersProps) {
  const Tag = as as any;

  const container: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  };

  const letter: Variants = {
    hidden: {
      opacity: 0,
      y: 10,
      filter: 'blur(6px)',
    },
    show: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.55,
        ease: [0.2, 0.7, 0.2, 1] as [number, number, number, number],
      },
    },
  };

  const chars = Array.from(text);

  return (
    <Tag className={className}>
      <motion.span
        className="inline"
        aria-label={text}
        role="text"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.6 }}
      >
        {chars.map((ch, idx) => (
          <motion.span
            key={`${ch}-${idx}`}
            className="letter"
            variants={letter}
          >
            {ch === ' ' ? '\u00A0' : ch}
          </motion.span>
        ))}
      </motion.span>
    </Tag>
  );
}
