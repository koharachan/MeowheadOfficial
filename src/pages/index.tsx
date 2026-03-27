import { NextPage } from 'next';
import Head from 'next/head';
import Hero from '../components/Hero';
import CompanyRegistrySection from '../components/CompanyRegistrySection';
import CompanyTimelineSection from '../components/CompanyTimelineSection';
import Features from '../components/Features';
import CaseStudies from '../components/CaseStudies';
import Testimonials from '../components/Testimonials';
import Careers from '../components/Careers';
import MainLayout from '../components/layouts/MainLayout';

const HomePage: NextPage = () => {
  return (
    <MainLayout
      title="Technology Company Official Website"
      description="Welcome to our website"
    >
      <div className="min-h-screen bg-black">
        <Head>
          <title>重庆三握云网络科技有限公司</title>
          <meta name="description" content="猫猫头开发的官网 - 重庆三握云网络科技有限公司" />
          <meta name="google-adsense-account" content="ca-pub-6041318726736667" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main>
          <Hero />
          <CompanyRegistrySection />
          <CompanyTimelineSection />
          <Features />
          <CaseStudies />
          <Testimonials />
          <Careers />
        </main>

      </div>
    </MainLayout>
  );
};

export default HomePage;