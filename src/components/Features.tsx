import Link from 'next/link';
import { LinkButton } from '@/components/ui/LinkButton';
import { features } from '@/config/features';
import ScrollReveal from '@/components/ui/ScrollReveal';

const Features = () => {
  return (
    <div className="py-12 sm:py-8">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-primary">功能特点</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            一站式企业网站解决方案
          </p>
          <p className="mt-6 text-lg leading-8 text-white/70">
            我们提供丰富的功能和组件，满足各种企业网站的需求。
          </p>
        </ScrollReveal>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <ScrollReveal key={feature.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                  <feature.icon className="h-5 w-5 flex-none text-primary" aria-hidden="true" />
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-white/70">
                  <p className="flex-auto">{feature.description}</p>
                  <p className="mt-6">
                    <LinkButton href={feature.href}>
                      了解更多
                    </LinkButton>
                  </p>
                </dd>
              </ScrollReveal>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
};

export default Features;