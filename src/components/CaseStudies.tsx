import { simpleCaseStudies } from '../config/case-studies';
import Link from 'next/link';
import ScrollReveal from '@/components/ui/ScrollReveal';

const CaseStudies = () => {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            案例研究
          </h2>
          <p className="mt-2 text-lg leading-8 text-white/70">
            了解我们如何通过这些成功案例帮助企业实现数字化转型
          </p>
        </ScrollReveal>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {simpleCaseStudies.map((study) => (
            <ScrollReveal key={study.title}>
              <article className="flex flex-col items-start">
                <div className="relative w-full">
                  <img
                    src={study.imageUrl}
                    alt={study.title}
                    className="aspect-[16/9] w-full rounded-2xl bg-white/5 object-cover sm:aspect-[2/1] lg:aspect-[3/2]"
                  />
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
                </div>
                <div className="max-w-xl">
                  <div className="mt-8 flex items-center gap-x-4 text-xs">
                    <Link
                      href={study.href}
                      className="relative z-10 rounded-full bg-white/5 px-3 py-1.5 font-medium text-white/70 hover:bg-white/10"
                    >
                      查看详情
                    </Link>
                  </div>
                  <div className="group relative">
                    <h3 className="mt-3 text-lg font-semibold leading-6 text-white group-hover:text-white/80">
                      <Link href={study.href}>
                        <span className="absolute inset-0" />
                        {study.title}
                      </Link>
                    </h3>
                    <p className="mt-5 text-sm leading-6 text-white/70">
                      {study.description}
                    </p>
                  </div>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CaseStudies;