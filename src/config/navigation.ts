export interface NavigationItem {
  name: string;
  href: string;
}

export const navigation: NavigationItem[] = [
  { name: '案例研究', href: '/case-studies' },
  { name: '团队', href: '/team' },
  { name: '招聘机会', href: '/careers' },
  { name: '博客', href: '/blog' },
  { name: 'UI组件', href: '/blocks' },
];

export const siteConfig = {
  name: '猫猫头开发',
  description: '专业的网站开发解决方案',
  getStarted: {
    href: '/get-started',
    text: '开始使用',
  },
}; 