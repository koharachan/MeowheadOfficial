import { NextPage } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { MapPinIcon, BriefcaseIcon, UserIcon } from '@heroicons/react/24/outline';
import MainLayout from '../../components/layouts/MainLayout';
import { simpleBenefits, jobPosts } from '../../config/careers';
import JobItem from '@/components/careers/JobItem';

const CareersPage: NextPage = () => {
  return (
    <MainLayout
      title="Careers - Technology Company Official Website"
      description="Join our team and build the future together"
    >
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden bg-gradient-to-b from-primary/20 pt-14">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Join Our Team
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              We're looking for passionate individuals to help us build the future of digital transformation.
            </p>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Why Join Us
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            We offer competitive benefits and a supportive work environment to help you thrive.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-7xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {simpleBenefits.map((benefit, index) => (
              <div
                key={index}
                className="rounded-2xl bg-gray-50 p-8 ring-1 ring-gray-200"
              >
                <h3 className="text-lg font-semibold leading-8 text-gray-900">
                  {benefit.name}
                </h3>
                <p className="mt-4 text-base leading-7 text-gray-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Open Positions Section */}
      <div className="mx-auto max-w-7xl px-6 pb-24 sm:pb-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Open Positions
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Find your next opportunity and make an impact with us.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-7xl">
          <div className="grid gap-4">
            {jobPosts.map((position) => (
              <JobItem key={position.id} position={position} />
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CareersPage;