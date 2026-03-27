import CountUpOnView from './ui/CountUpOnView';
import ParallaxOnView from './ui/ParallaxOnView';
import StaggerLetters from './ui/StaggerLetters';
import { BackgroundBeams } from './aceternity-ui/background-beams';

const CompanyRegistrySection = () => {
  return (
    <section className="relative py-20 sm:py-28">
      <BackgroundBeams className="opacity-90" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <ParallaxOnView dataSpeed={0.45}>
              <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-8 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.75)] backdrop-blur">
                <div className="text-xs font-semibold tracking-[0.22em] text-white/60">
                  基本信息
                </div>

                <div className="mt-4">
                  <StaggerLetters
                    as="h2"
                    className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
                    text="重庆三握云网络科技有限公司"
                  />
                </div>

                <div className="mt-5 text-sm leading-6 text-white/70">
                  <StaggerLetters
                    as="p"
                    className="text-sm leading-7 text-white/70"
                    text="成立于2025年，位于重庆市，是一家以从事互联网和相关服务为主的企业。"
                    stagger={0.012}
                    delay={0.12}
                  />
                </div>

                <div className="mt-7 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
                    <div className="text-xs text-white/60">企业规模</div>
                    <div className="mt-1 text-lg font-semibold text-white">中型</div>
                  </div>
                  <div className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
                    <div className="text-xs text-white/60">注册资本</div>
                    <div className="mt-1 text-lg font-semibold text-white">1,000万人民币</div>
                  </div>
                  <div className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
                    <div className="text-xs text-white/60">成立日期</div>
                    <div className="mt-1 text-lg font-semibold text-white">2025-04-29</div>
                  </div>
                  <div className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
                    <div className="text-xs text-white/60">国标行业</div>
                    <div className="mt-1 text-sm font-semibold leading-6 text-white">
                      互联网其他信息服务
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl bg-white/[0.06] px-5 py-4 text-white ring-1 ring-white/10">
                  <div className="flex items-baseline justify-between">
                    <div className="text-sm font-semibold">同行领先</div>
                    <div className="text-3xl font-bold tracking-tight">
                      <CountUpOnView value={96} suffix="%" />
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-white/65">
                    天眼查统计超过了 96% 的重庆市同行
                  </div>
                </div>
              </div>
            </ParallaxOnView>
          </div>

          <div className="lg:col-span-7">
            <div className="grid gap-6">
              <ParallaxOnView dataSpeed={0.18}>
                <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-8 backdrop-blur">
                  <div className="text-sm font-semibold text-white">统一社会信用代码</div>
                  <div className="mt-2 font-mono text-base text-white/70">91500106MAEJ8TC761</div>
                </div>
              </ParallaxOnView>

              <ParallaxOnView dataSpeed={0.28}>
                <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-8 backdrop-blur">
                  <div className="text-sm font-semibold text-white">法定代表人</div>
                  <div className="mt-2 text-2xl font-bold tracking-tight text-white">朱柏霖</div>
                </div>
              </ParallaxOnView>

              <ParallaxOnView dataSpeed={0.38}>
                <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-8 backdrop-blur">
                  <div className="text-sm font-semibold text-white">信息摘要</div>
                  <p className="mt-3 text-base leading-7 text-white/70">
                    重庆三握云网络科技有限公司，成立于2025年，位于重庆市，是一家以从事互联网和相关服务为主的企业。企业注册资本1000万人民币。
                  </p>
                </div>
              </ParallaxOnView>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompanyRegistrySection;
