import Image from 'next/image';

import { BackgroundBeams } from '@/components/aceternity-ui/background-beams';
import ParallaxOnView from '@/components/ui/ParallaxOnView';
import StaggerLetters from '@/components/ui/StaggerLetters';
import { AnimatedGradientText } from '@/components/magicui/animated-gradient-text';

const CompanyTimelineSection = () => {
  return (
    <section className="relative py-20 sm:py-28">
      <BackgroundBeams className="opacity-90" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-xs font-semibold tracking-[0.22em] text-white/70">TIMELINE</div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            <AnimatedGradientText text="从项目到企业" />
          </h2>
          <p className="mt-4 text-base leading-7 text-white/70">
            关键节点梳理：转型前、子项目、未来高新技术转型与预计搬迁。
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <ParallaxOnView dataSpeed={0.18}>
            <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                  <Image src="/3wicon.png" alt="企业 Logo" width={44} height={44} className="h-11 w-11" />
                </div>
                <div>
                  <div className="text-xs font-semibold tracking-[0.18em] text-white/60">2026</div>
                  <div className="mt-1 text-lg font-semibold text-white">未来高新高科技转型</div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/70">
                预计进一步面向高新技术方向升级，并计划在阶段性节点后搬迁至杭州。
              </p>
              <div className="mt-5 rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
                <StaggerLetters
                  as="p"
                  className="text-sm leading-7 text-white/80"
                  text="面向未来：更强算力、更强工程化、更高可信交付。"
                  stagger={0.012}
                />
              </div>
            </article>
          </ParallaxOnView>

          <ParallaxOnView dataSpeed={0.28}>
            <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur">
              <div className="text-xs font-semibold tracking-[0.18em] text-white/60">2025</div>
              <h3 className="mt-2 text-xl font-semibold text-white">子项目 · MeowPan</h3>
              <div className="mt-5 overflow-hidden rounded-2xl ring-1 ring-white/10">
                <Image
                  src="/meowpan.png"
                  alt="MeowPan"
                  width={1024}
                  height={512}
                  className="h-44 w-full object-cover grayscale-[0.15] transition duration-500 group-hover:scale-[1.02]"
                />
              </div>
              <p className="mt-4 text-sm leading-6 text-white/70">
                作为探索型子项目，在产品化、体验与工程化交付上进行验证与沉淀。
              </p>
            </article>
          </ParallaxOnView>

          <ParallaxOnView dataSpeed={0.38}>
            <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur">
              <div className="text-xs font-semibold tracking-[0.18em] text-white/60">2021</div>
              <h3 className="mt-2 text-xl font-semibold text-white">转型前 · 岩海云电脑</h3>
              <div className="mt-5 overflow-hidden rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <Image
                  src="/FonZKD-v36OTKIPOPeqo2EOZ4G51.jpg"
                  alt="岩海云电脑"
                  width={1200}
                  height={400}
                  className="h-24 w-full object-contain"
                />
              </div>
              <p className="mt-4 text-sm leading-6 text-white/70">
                早期项目阶段聚焦云电脑方向，为后续转型积累技术与行业经验。
              </p>
            </article>
          </ParallaxOnView>
        </div>
      </div>
    </section>
  );
};

export default CompanyTimelineSection;
