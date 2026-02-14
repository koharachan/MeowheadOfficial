import Link from 'next/link';
import Image from 'next/image';

const Hero = () => {
  return (
    <div className="relative isolate pt-14">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-40">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            猫猫头开发 - 专业的网站解决方案
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            我们提供专业的网站开发服务，帮助企业实现数字化转型，打造美观、高效的企业官网。
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/get-started"
              className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              开始使用
            </Link>
          </div>
          <div className="mt-16 flex items-center justify-center">
            <div className="relative">
              <Image
                src="/hero-image.png"
                alt="猫猫头开发网站展示"
                width={800}
                height={600}
                className="rounded-xl shadow-xl"
              />
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-white p-4 rounded-lg shadow-lg">
                <div className="flex items-center gap-x-2">
                  <div className="flex items-center">
                    <span className="text-sm font-semibold text-gray-900">★★★★★</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    来自12,252位用户的5星评价
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero; 