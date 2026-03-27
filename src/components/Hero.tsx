import Link from 'next/link';
import Image from 'next/image';
import { useRef } from 'react';
import { motion, type Variants, useInView } from 'framer-motion';
import MatrixRain from './MatrixRain';

const Hero = () => {
  const ease = [0.2, 0.7, 0.2, 1] as const;
  const brandLetters = Array.from('猫猫头开发组');

  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const titleInView = useInView(titleRef, { once: true, amount: 0.65 });

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.15,
      },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 18, filter: 'blur(10px)' },
    show: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.75, ease },
    },
  };

  return (
    <div className="relative isolate pt-14">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-40">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden [mask-image:radial-gradient(55%_55%_at_50%_35%,black,transparent)]">
          <MatrixRain className="absolute inset-0 opacity-35" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.12),transparent_58%)]" />
        </div>

        <motion.div
          className="mx-auto max-w-2xl text-center"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.h1
            className="text-4xl font-bold tracking-tight text-white sm:text-6xl"
            variants={item}
            ref={titleRef}
          >
            <span className="inline-flex items-baseline justify-center gap-3">
              <motion.span
                className="inline-block"
                initial={{ opacity: 0, x: 80, filter: 'blur(14px)' }}
                animate={
                  titleInView
                    ? {
                        opacity: [0, 1, 1, 1],
                        x: [80, 80, 0, 0],
                        filter: ['blur(14px)', 'blur(0px)', 'blur(18px)', 'blur(0px)'],
                      }
                    : { opacity: 0, x: 80, filter: 'blur(14px)' }
                }
                transition={{ duration: 1.25, ease, times: [0, 0.28, 0.82, 1] }}
              >
                三握云
              </motion.span>

              <motion.span
                className="inline-block text-white"
                initial={{ opacity: 0, y: 8, filter: 'blur(10px)' }}
                animate={titleInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 8, filter: 'blur(10px)' }}
                transition={{ duration: 0.18, ease: 'easeOut', delay: 1.0 }}
              >
                {' - '}
              </motion.span>

              <motion.span
                className="inline-flex"
                initial="hidden"
                animate={titleInView ? 'show' : 'hidden'}
                variants={{
                  hidden: {},
                  show: {
                    transition: {
                      staggerChildren: 0.03,
                      delayChildren: 1.18,
                    },
                  },
                }}
              >
                {brandLetters.map((ch, idx) => (
                  <motion.span
                    key={`${ch}-${idx}`}
                    className="inline-block"
                    variants={{
                      hidden: { opacity: 0, y: 10, filter: 'blur(12px)' },
                      show: {
                        opacity: 1,
                        y: 0,
                        filter: 'blur(0px)',
                        transition: { duration: 0.22, ease },
                      },
                    }}
                  >
                    {ch}
                  </motion.span>
                ))}
              </motion.span>
            </span>
          </motion.h1>

          <motion.p className="mt-6 text-lg leading-8 text-white/70" variants={item}>
            我们提供专业的网站开发服务，帮助企业实现数字化转型，打造美观、高效的企业官网。
          </motion.p>

          <motion.div className="mt-10 flex items-center justify-center gap-x-6" variants={item}>
            <Link
              href="/get-started"
              className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              开始使用
            </Link>
          </motion.div>

          <motion.div className="mt-16 flex items-center justify-center" variants={item}>
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 22, scale: 0.985, filter: 'blur(12px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.9, ease, delay: 0.35 }}
            >
              <Image
                src="/hero-image.png"
                alt="猫猫头开发网站展示"
                width={800}
                height={600}
                className="rounded-xl shadow-xl"
              />
              <motion.div
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 rounded-lg border border-white/10 bg-black/70 p-4 shadow-lg backdrop-blur"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, ease: 'easeOut', delay: 0.75 }}
              >
                <div className="flex items-center gap-x-2">
                  <div className="flex items-center">
                    <span className="text-sm font-semibold text-white">★★★★★</span>
                  </div>
                  <span className="text-sm text-white/70">
                    来自12,252位用户的5星评价
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;