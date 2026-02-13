export interface PricingTier {
  name: string;
  id: string;
  price: string;
  description: string;
  features: string[];
  featured: boolean;
}

export interface FAQ {
  question: string;
  answer: string;
}

export const tiers: PricingTier[] = [
  {
    name: 'Basic',
    id: 'basic',
    price: '999',
    description: 'Perfect for small businesses and startups',
    features: [
      'Basic digital solutions',
      'Standard technical support',
      '1 project management account',
      'Basic data analytics',
      '5 consulting sessions per month',
      'System usage training',
    ],
    featured: false,
  },
  {
    name: 'Professional',
    id: 'professional',
    price: '2999',
    description: 'Ideal for medium-sized businesses',
    features: [
      'Advanced digital solutions',
      'Priority technical support',
      '5 project management accounts',
      'Advanced data analytics',
      '15 consulting sessions per month',
      'Customized training program',
      'API integration support',
      'Dedicated account manager',
    ],
    featured: true,
  },
  {
    name: 'Enterprise',
    id: 'enterprise',
    price: '9999',
    description: 'For large enterprises and corporations',
    features: [
      'Complete digital solutions',
      '24/7 technical support',
      'Unlimited project accounts',
      'Enterprise-grade analytics',
      'Unlimited consulting',
      'On-site implementation training',
      'Full API integration',
      'Dedicated service team',
      'Custom development',
      'Strategic partnership benefits',
    ],
    featured: false,
  },
];

export const faqs: FAQ[] = [
  {
    question: 'How do I choose the right plan?',
    answer:
      'You can choose a plan based on your company size, business needs, and budget. Our account managers can also provide professional consultation.',
  },
  {
    question: 'Do you offer annual billing?',
    answer:
      'Yes, we offer annual billing with a 15% discount. Contact our account manager for specific discount plans.',
  },
  {
    question: 'Can I change my plan?',
    answer:
      'Yes. You can upgrade your plan at any time to access more services. Downgrades will take effect at the end of the current billing cycle.',
  },
  {
    question: 'Is there a trial period?',
    answer:
      'We offer a 15-day free trial period where you can experience all features and receive professional technical support.',
  },
]; 