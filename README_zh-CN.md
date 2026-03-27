# 企业官网模板

基于 Next.js 和 Tailwind CSS 构建的现代化企业官网模板，支持静态页面生成（SSG）。

## 技术栈

- **前端框架**: Next.js 15.3.1+
- **样式方案**: Tailwind CSS V4
- **动效**: Framer Motion
- **UI 组件**: shadcn/ui + 自定义组件
- **类型系统**: TypeScript
- **代码规范**: ESLint + Prettier
- **风格组件**: Aceternity UI（按目录规范接入）
- **效果组件**: Magic UI（示例：渐变动态文字）

## 功能特点

- 📱 响应式设计，完美适配各种设备
- 🎨 现代化 UI 设计，基于 shadcn/ui 组件库
- 🚀 静态页面生成（SSG），优秀的性能表现
- 🔍 SEO 友好
- 💻 TypeScript 支持，提供完整的类型定义
- 🌑 全站黑色主题（暗色可读性优化）
- ✨ 全站动效体系
  - 开屏代码雨（Matrix Rain）
  - 首页 Hero 飞入 + 错峰出现
  - ScrollReveal：滚动进入视口动效
- 🇨🇳 ICP 备案号按国内常见规范支持点击跳转查询页
- 🔗 Footer 友情链接示例：小原 Blog（blog.meowhead.cn）

## 页面列表

- 🏠 首页 (`/`)
- 📄 关于我们 (`/about`)
- 🛠️ 服务介绍 (`/services`)
- 📰 新闻中心 (`/news`)
- 📝 博客 (`/blog`)
- 👥 团队介绍 (`/team`)
- 💼 职位列表 (`/careers`)
- 📞 联系我们 (`/contact`)
- 🚀 快速开始 (`/get-started`)

## 快速开始

1. **克隆项目**

```bash
git clone [项目地址]
cd [项目目录]
```

2. **安装依赖**

```bash
npm install
# 或
yarn install
```

3. **启动开发服务器**

```bash
npm run dev
# 或
yarn dev
```

4. **构建生产版本**

```bash
npm run build
# 或
yarn build
```

## 结合 CMS（可选）

项目提供了结合 Contentful CMS 的脚本，可以将 Contentful 上的博客数据拉取到 Markdown。

本项目提供了数据结构可以直接[导入](https://www.contentful.com/developers/docs/tutorials/cli/import-and-export/)到 Contentful:
`contentful space import --content-file contentful-export.json --space-id ${your-space-id}`

配置环境变量到本地：

```
CONTENTFUL_SPACE_ID=Contentful 空间 ID
CONTENTFUL_DELIVERY_TOKEN=Contentful API 密钥
CONTENTFUL_PREVIEW_TOKEN=Contentful 预览密钥
DEV=true
NEXT_PUBLIC_FORMSPREE_ID=Formspree 联系我们提交时的表单 ID
```

以上环境变量的获取方式参考文档：https://edgeone.cloud.tencent.com/pages/document/178968240027983872

再执行`npm run dev`即可预览到 Contentful 数据了。

## 项目结构

```
├── public/          # 静态资源
├── src/
│   ├── components/  # 组件
│   │   ├── cards/   # 卡片组件
│   │   ├── layouts/ # 布局组件
│   │   ├── aceternity-ui/ # Aceternity UI 风格组件
│   │   ├── magicui/ # Magic UI 效果组件
│   │   └── ui/      # UI 组件
│   ├── lib/         # 工具函数（例如 cn）
│   ├── config/      # 配置文件
│   ├── pages/       # 页面
│   └── styles/      # 样式文件
├── .eslintrc.js    # ESLint 配置
├── .prettierrc     # Prettier 配置
├── next.config.ts  # Next.js 配置
└── tailwind.config.js # Tailwind 配置
```

### 动效相关组件

- `src/components/SplashScreen.tsx`: 开屏容器（默认 session 仅展示一次）
- `src/components/MatrixRain.tsx`: Canvas 代码雨背景
- `src/components/ui/ScrollReveal.tsx`: 滚动进入视口动效封装
- `src/components/Hero.tsx`: 首页 Hero 飞入动效

## 配置文件说明

项目使用了多个配置文件来管理数据：

- `config/articles.ts`: 博客文章数据
- `config/get-started.ts`: 快速入门指南
- `config/team.ts`: 团队成员信息

## 开发指南

### 组件开发规范

1. 所有组件使用 TypeScript 开发
2. 组件命名采用 PascalCase
3. 确保添加适当的 Props 类型定义
4. 遵循项目既定的样式规范

### 样式开发规范

1. 优先使用 Tailwind CSS 类名
2. 遵循响应式设计原则
3. 保持颜色和间距的一致性

### 页面开发规范

1. 使用 MainLayout 组件作为页面布局
2. 实现适当的 SEO 优化
3. 确保页面的响应式表现

## 部署说明

项目使用静态页面生成（SSG），可以部署到任何静态托管服务：

1. 构建项目：

```bash
npm run build
```

2. 生成的静态文件位于 `out` 目录

3. 将 `out` 目录部署到您的托管服务

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

[MIT License](https://github.com/TencentEdgeOne/enterprise-website-template/blob/main/LICENSE)

## 一键部署

[![Deploy with EdgeOne Pages](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://console.cloud.tencent.com/edgeone/pages/new?template=enterprise-website-template)
