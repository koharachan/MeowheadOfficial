import { ReactNode } from 'react';
import Head from 'next/head';
import Navbar from '../Navbar';
import Footer from '../Footer';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const MainLayout = ({ children, title = '重庆三握云网络科技有限公司', description = '猫猫头开发的官网 - 重庆三握云网络科技有限公司' }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Head>

      <Navbar />

      <main>
        {children}
      </main>

      <Footer />
    </div>
  );
};

export default MainLayout; 