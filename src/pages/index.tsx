import { NextPage } from 'next';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
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
      <div className="min-h-screen bg-white">
        <Head>
          <title>Company Website Template - Professional Enterprise Solutions</title>
          <meta name="description" content="Providing professional website solutions for enterprises, facilitating digital transformation" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <Navbar />
        
        <main>
          <Hero />
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