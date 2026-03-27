import Link from 'next/link';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  'aria-hidden'?: boolean;
}

const navigation = {
  support: [
    { name: '联系我们', href: '/contact' },
  ],
  company: [
    { name: '关于我们', href: '/about' },
    { name: '加入我们', href: '/careers' }
  ],
  links: [
    { name: '小原 Blog', href: 'https://blog.meowhead.cn' },
  ],
  social: [
    {
      name: '微博',
      href: 'https://weibo.com/company',
      icon: (props: IconProps) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path d="M20.194 14.32c0 3.66-4.54 6.634-10.142 6.634-5.603 0-10.142-2.974-10.142-6.634 0-3.66 4.54-6.634 10.142-6.634 5.603 0 10.142 2.974 10.142 6.634zM10.052 7.04c-4.187 0-7.573 2.228-7.573 4.978 0 2.75 3.386 4.978 7.573 4.978 4.187 0 7.573-2.228 7.573-4.978 0-2.75-3.386-4.978-7.573-4.978z" />
        </svg>
      ),
    },
    {
      name: '微信',
      href: '#',
      icon: (props: IconProps) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path d="M8.516 13.545c-.865 0-1.565-.7-1.565-1.565s.7-1.565 1.565-1.565 1.565.7 1.565 1.565-.7 1.565-1.565 1.565zm4.968 0c-.865 0-1.565-.7-1.565-1.565s.7-1.565 1.565-1.565 1.565.7 1.565 1.565-.7 1.565-1.565 1.565zm2.484-5.565C15.968 4.98 13.365 3 10.052 3 6.165 3 3 5.71 3 9.055c0 1.89.92 3.56 2.35 4.66l-.59 1.77 2.06-1.03c.73.2 1.5.31 2.31.31.21 0 .42-.01.63-.02-.13-.44-.2-.9-.2-1.38 0-2.97 2.87-5.38 6.41-5.38.39 0 .77.03 1.14.09C16.96 6.66 15.97 5.71 14.52 5.71z" />
        </svg>
      ),
    },
  ],
};

const Footer = () => {
  return (
    <footer className="bg-black" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8">
            <Link href="/" className="text-2xl font-bold text-white">
              猫猫头开发
            </Link>
            <p className="text-sm leading-6 text-white/70">
              构建专业的企业网站解决方案，助力企业数字化转型
            </p>
            <div className="flex space-x-6">
              {navigation.social.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-white hover:text-white"
                >
                  <span className="sr-only">{item.name}</span>
                  {item.icon && <item.icon className="h-6 w-6" aria-hidden={true} />}
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-white">Support</h3>
                <ul role="list" className="mt-6 space-y-4 list-none">
                  {navigation.support.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className="text-sm leading-6 text-white/70 hover:text-white">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-white">Company</h3>
                <ul role="list" className="mt-6 space-y-4 list-none">
                  {navigation.company.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className="text-sm leading-6 text-white/70 hover:text-white">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-white">Links</h3>
                <ul role="list" className="mt-6 space-y-4 list-none">
                  {navigation.links.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm leading-6 text-white/70 hover:text-white"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-white/10 pt-8 sm:mt-20 lg:mt-24">
          <p className="text-xs leading-5 text-white/70">
            &copy; {new Date().getFullYear()} 重庆三握云网络科技有限公司. 保留所有权利.
          </p>
          <p className="text-xs leading-5 text-white/70 mt-2">
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white hover:underline underline-offset-4"
            >
              渝ICP备2025059102号-3
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;