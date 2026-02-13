export interface Step {
  id: number;
  title: string;
  description: string;
  action: string;
  href: string;
  imageUrl: string;
}

export interface QuickStartGuide {
  title: string;
  description: string;
  href: string;
  icon: string;
}

export const steps: Step[] = [
  {
    id: 1,
    title: 'Create an Account',
    description:
      'Sign up for a free account to access our platform and explore all features.',
    action: 'Sign Up Now',
    href: '/',
    imageUrl: '/get-started/1.webp',
  },
  {
    id: 2,
    title: 'Choose Your Plan',
    description:
      'Select a plan that best fits your business needs and scale as you grow.',
    action: 'View Plans',
    href: '/',
    imageUrl: '/get-started/1.webp',
  },
  {
    id: 3,
    title: 'Set Up Your Project',
    description:
      'Configure your project settings and invite team members to collaborate.',
    action: 'Start Setup',
    href: '/',
    imageUrl: '/get-started/1.webp',
  },
  {
    id: 4,
    title: 'Launch Your Solution',
    description:
      'Deploy your digital solution and start transforming your business.',
    action: 'Launch Now',
    href: '/',
    imageUrl: '/get-started/1.webp',
  },
];

export const quickStartGuides: QuickStartGuide[] = [
  {
    title: 'Platform Overview',
    description: 'Learn about our platform features and capabilities',
    href: '/docs/overview',
    icon: '📚',
  },
  {
    title: 'API Documentation',
    description: 'Explore our API endpoints and integration guides',
    href: '/docs/api',
    icon: '🔧',
  },
  {
    title: 'Best Practices',
    description: 'Discover tips and tricks for optimal usage',
    href: '/docs/best-practices',
    icon: '💡',
  },
  {
    title: 'Video Tutorials',
    description: 'Watch step-by-step guides and demonstrations',
    href: '/docs/tutorials',
    icon: '🎥',
  },
];

export const features: string[] = [
  'Intuitive dashboard interface',
  'Real-time analytics and reporting',
  'Secure data encryption',
  'Automated backup systems',
  'Custom integration options',
  'Priority technical support',
  '24/7 system monitoring',
  'Regular feature updates',
]; 