import { NextPage } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { fullCaseStudies } from '../../config/case-studies';
import MainLayout from '@/components/layouts/MainLayout';

const CaseStudies: NextPage = () => {
  return (
    <MainLayout>

      <main>
        {/* Page Title */}
        <div className="relative isolate overflow-hidden bg-gradient-to-b from-primary/20 pt-14">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                Case Studies
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Explore how we help enterprises achieve digital transformation through real success stories
              </p>
            </div>
          </div>
        </div>

        {/* Case Studies List */}
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8">
          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
            {fullCaseStudies.map((study) => (
              <article key={study.title} className="flex flex-col items-start">
                <div className="relative w-full">
                  <Image
                    src={study.imageUrl}
                    alt={study.title}
                    width={800}
                    height={400}
                    className="aspect-[2/1] w-full rounded-2xl bg-gray-100 object-cover"
                  />
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-gray-900/10" />
                </div>
                <div className="max-w-xl">
                  <div className="mt-8 flex items-center gap-x-4 text-xs">
                    <time dateTime="2024" className="text-gray-500">
                      {study.duration}
                    </time>
                    <span className="relative z-10 rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-600">
                      {study.industry}
                    </span>
                  </div>
                  <div className="group relative">
                    <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900 group-hover:text-gray-600">
                      <Link href={study.href}>
                        <span className="absolute inset-0" />
                        {study.title}
                      </Link>
                    </h3>
                    <p className="mt-5 text-sm leading-6 text-gray-600">
                      {study.description}
                    </p>
                    <p className="mt-3 text-sm italic text-gray-500">
                      Client: {study.client}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>

      
    </MainLayout>
  );
};

export default CaseStudies; 