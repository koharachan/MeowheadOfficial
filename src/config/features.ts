import { CogIcon, DevicePhoneMobileIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';

export interface Feature {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

export const features: Feature[] = [
  {
    name: 'Customization',
    description: 'Customize every detail of the website according to your needs, creating a unique brand image.',
    icon: CogIcon,
    href: '/',
  },
  {
    name: 'Responsive Design',
    description: 'Perfectly adapt to various devices, providing the best browsing experience for users.',
    icon: DevicePhoneMobileIcon,
    href: '/',
  },
  {
    name: 'Future-oriented',
    description: 'Adopt the latest technology to ensure that your website always stays ahead.',
    icon: RocketLaunchIcon,
    href: '/',
  },
]; 