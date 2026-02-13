import { NextPage, GetStaticProps, GetStaticPaths } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { fullCaseStudies } from '../../config/case-studies';
import MainLayout from '@/components/layouts/MainLayout';

interface CaseStudyDetailProps {
  caseStudy: (typeof fullCaseStudies)[0];
}

const CaseStudyDetail: NextPage<CaseStudyDetailProps> = ({ caseStudy }) => {
  if (!caseStudy) {
    return null;
  }

  return (
    <MainLayout title={caseStudy.title} description={caseStudy.description}>

      <main>
        {/* Hero Section */}
        <div className="relative isolate overflow-hidden bg-gradient-to-b from-primary/20 pt-14">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
            {/* Back Button */}
            <div className="mb-8">
              <Link
                href="/case-studies"
                className="inline-flex items-center text-sm font-semibold text-gray-900 hover:text-primary"
              >
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Back to Case Studies
              </Link>
            </div>

            {/* Title and Meta */}
            <div className="mx-auto max-w-2xl lg:mx-0">
              <div className="flex items-center gap-x-4 text-xs">
                <time dateTime="2024" className="text-gray-500">
                  {caseStudy.duration}
                </time>
                <span className="relative z-10 rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-600">
                  {caseStudy.industry}
                </span>
              </div>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                {caseStudy.title}
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                {caseStudy.description}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl">
            {/* Featured Image */}
            <div className="relative aspect-[16/9] w-full mb-12">
              <Image
                src={caseStudy.imageUrl}
                alt={caseStudy.title}
                fill
                className="rounded-2xl object-cover"
              />
            </div>

            {/* Client Info */}
            <div className="mb-12 p-6 bg-gray-50 rounded-2xl">
              <h2 className="text-lg font-semibold text-gray-900">Client Information</h2>
              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Client</dt>
                  <dd className="mt-1 text-sm text-gray-900">{caseStudy.client}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Industry</dt>
                  <dd className="mt-1 text-sm text-gray-900">{caseStudy.industry}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Duration</dt>
                  <dd className="mt-1 text-sm text-gray-900">{caseStudy.duration}</dd>
                </div>
              </dl>
            </div>

            {/* Challenge Section */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">The Challenge</h2>
              <p className="text-base text-gray-600">
                The client faced significant challenges in their digital transformation journey, 
                including legacy systems, data silos, and inefficient processes that were 
                hindering their growth and competitiveness in the market.
              </p>
            </div>

            {/* Solution Section */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Solution</h2>
              <p className="text-base text-gray-600">
                We implemented a comprehensive digital transformation strategy that included:
              </p>
              <ul className="mt-4 space-y-4">
                <li className="flex items-start">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary text-white">1</span>
                  <span className="ml-4 text-base text-gray-600">
                    Thorough analysis of existing systems and processes
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary text-white">2</span>
                  <span className="ml-4 text-base text-gray-600">
                    Custom solution development tailored to specific needs
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary text-white">3</span>
                  <span className="ml-4 text-base text-gray-600">
                    Implementation of modern technology stack and best practices
                  </span>
                </li>
              </ul>
            </div>

            {/* Results Section */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Results & Impact</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-200 p-6">
                  <p className="text-2xl font-bold text-primary">40%</p>
                  <p className="mt-2 text-base text-gray-600">Increase in operational efficiency</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-6">
                  <p className="text-2xl font-bold text-primary">50%</p>
                  <p className="mt-2 text-base text-gray-600">Reduction in processing time</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-6">
                  <p className="text-2xl font-bold text-primary">30%</p>
                  <p className="mt-2 text-base text-gray-600">Cost savings in the first year</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-6">
                  <p className="text-2xl font-bold text-primary">95%</p>
                  <p className="mt-2 text-base text-gray-600">Customer satisfaction rate</p>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="rounded-2xl bg-gray-50 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to Transform Your Business?
              </h2>
              <p className="text-base text-gray-600 mb-6">
                Let us help you achieve similar results for your organization.
              </p>
              <Link
                href="/contact"
                className="inline-block rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
              >
                Contact Us Today
              </Link>
            </div>
          </div>
        </div>
      </main>

      
    </MainLayout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = fullCaseStudies.map((study) => ({
    params: { slug: study.href.split('/').pop() },
  }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const caseStudy = fullCaseStudies.find(
    (study) => study.href.split('/').pop() === slug
  );

  if (!caseStudy) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      caseStudy,
    },
  };
};

export default CaseStudyDetail; 