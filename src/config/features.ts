import { CogIcon, DevicePhoneMobileIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';

export interface Feature {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

export const features: Feature[] = [
  {
    name: '个性化定制',
    description: '根据您的需求定制网站的每一个细节，打造独特的品牌形象。',
    icon: CogIcon,
    href: '/',
  },
  {
    name: '响应式设计',
    description: '完美适配各种设备，为用户提供最佳的浏览体验。',
    icon: DevicePhoneMobileIcon,
    href: '/',
  },
  {
    name: '面向未来',
    description: '采用最新技术，确保您的网站始终保持领先地位。',
    icon: RocketLaunchIcon,
    href: '/',
  },
]; 