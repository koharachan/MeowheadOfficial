// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://maomaotou.tech',
  trailingSlash: 'ignore',
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    react(),
    sitemap({
      i18n: { defaultLocale: 'zh', locales: { zh: 'zh-CN', yue: 'zh-HK', en: 'en-US' } },
      // 403 / 404 不进 sitemap
      filter: (page) => !/\/(403|404|418)\/?$/.test(page),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: { cssMinify: 'lightningcss' },
  },
  build: { inlineStylesheets: 'auto' },
});
