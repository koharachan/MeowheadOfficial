interface CaseStudy {
  title: string;
  description: string;
  imageUrl: string;
  href: string;
  client: string;
  industry: string;
  duration: string;
  challenge: string;
  solution: string[];
  results: {
    label: string;
    value: string;
  }[];
}

export const fullCaseStudies: CaseStudy[] = [
  {
    title: 'Enterprise Digital Transformation Success Story',
    description: 'Through our solutions, we help traditional enterprises achieve digital transformation, improving operational efficiency.',
    imageUrl: '/case-study-1.png',
    href: '/case-studies/digital-transformation',
    client: 'A Large Manufacturing Enterprise',
    industry: 'Manufacturing',
    duration: '6 months',
    challenge: 'The client was facing challenges with outdated systems and manual processes that were causing delays, errors, and inefficiencies in their operations. Their legacy infrastructure couldn\'t support their growth plans and was becoming increasingly expensive to maintain.',
    solution: [
      'Conducted comprehensive analysis of existing systems and workflows',
      'Developed and implemented custom digital solutions integrated with existing systems',
      'Provided staff training and change management support',
      'Established monitoring and optimization processes'
    ],
    results: [
      { label: 'Increase in operational efficiency', value: '40%' },
      { label: 'Reduction in processing time', value: '50%' },
      { label: 'Cost savings in the first year', value: '30%' },
      { label: 'Customer satisfaction rate', value: '95%' }
    ]
  },
  {
    title: 'Brand Image Upgrade Project',
    description: 'We create a new brand image for well-known enterprises, enhancing brand value and market competitiveness.',
    imageUrl: '/case-study-2.png',
    href: '/case-studies/brand-upgrade',
    client: 'A New Retail Brand',
    industry: 'Retail',
    duration: '3 months',
    challenge: 'The client needed to modernize their brand image to appeal to a younger demographic while maintaining their existing customer base. Their online presence was fragmented and inconsistent across different platforms.',
    solution: [
      'Conducted market research and competitor analysis',
      'Developed comprehensive brand strategy and guidelines',
      'Created unified digital presence across all platforms',
      'Implemented modern e-commerce solutions'
    ],
    results: [
      { label: 'Increase in brand recognition', value: '60%' },
      { label: 'Growth in online sales', value: '45%' },
      { label: 'Increase in younger customer segment', value: '35%' },
      { label: 'Social media engagement growth', value: '80%' }
    ]
  },
  {
    title: 'Globalized Enterprise Website Construction',
    description: 'We help enterprises build multilingual websites, expanding into international markets and achieving globalization.',
    imageUrl: '/case-study-3.png',
    href: '/case-studies/global-website',
    client: 'A Transnational Trade Company',
    industry: 'International Trade',
    duration: '4 months',
    challenge: 'The client was struggling to effectively reach and serve customers in multiple international markets due to language barriers and localization issues. Their existing website couldn\'t support multiple languages or regional content variations.',
    solution: [
      'Designed scalable multilingual website architecture',
      'Implemented advanced localization features',
      'Developed region-specific content strategy',
      'Created automated translation workflow'
    ],
    results: [
      { label: 'International market reach', value: '5x' },
      { label: 'Increase in global sales', value: '70%' },
      { label: 'Reduction in translation costs', value: '40%' },
      { label: 'Improvement in user engagement', value: '55%' }
    ]
  },
  {
    title: 'E-commerce Platform Optimization',
    description: 'We optimize the user experience of e-commerce platforms, increasing conversion rates and customer satisfaction.',
    imageUrl: '/case-study-4.png',
    href: '/case-studies/ecommerce-optimization',
    client: 'An E-commerce Platform',
    industry: 'E-commerce',
    duration: '5 months',
    challenge: 'The client was experiencing high cart abandonment rates and low conversion rates due to a complex checkout process and poor mobile experience. Site performance issues were also affecting their search engine rankings.',
    solution: [
      'Streamlined checkout process and improved mobile UX',
      'Implemented performance optimization techniques',
      'Enhanced search and filtering capabilities',
      'Developed personalized recommendation system'
    ],
    results: [
      { label: 'Increase in conversion rate', value: '25%' },
      { label: 'Reduction in cart abandonment', value: '35%' },
      { label: 'Improvement in page load speed', value: '60%' },
      { label: 'Growth in mobile sales', value: '45%' }
    ]
  },
];

export const simpleCaseStudies = fullCaseStudies.slice(0, 3).map(({ title, description, imageUrl, href }) => ({
  title,
  description,
  imageUrl,
  href,
})); 