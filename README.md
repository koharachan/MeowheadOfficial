# 猫猫头网络科技（广东）有限公司 · 官网

> 上到卫星，下到代码。
> 单页长滚动 · 中英双语两套真实路由 · 首屏实时 WebGL · 吉祥物「绪方 寻美 / tible」

---

## 这是什么

「猫猫头网络科技（广东）有限公司」的官方网站，纯静态输出（`astro build` → `dist/`），可直接丢到任意静态托管。

页面一览：

| 路由 | 说明 |
| --- | --- |
| `/` `/en/` | 首页（单页长滚动，01–10 屏） |
| `/mascot/` `/en/mascot/` | 吉祥物「绪方 寻美」人物页 |
| `/blog/` `/en/blog/` | 企业日志索引 |
| `/blog/<slug>/` `/en/blog/<slug>/` | 日志正文（3 篇，中英各一） |
| `/downloads/` `/en/downloads/` | 资源下载：标志包 / 立绘包 / 3D 模型 / 提案板 / 图标 |
| `/ie/` `/en/ie/` | **千禧年兼容主题**（表格布局、斜面边框、marquee、计数器、88×31 按钮，IE5.5+ 可读） |
| `/yue/...` | **粤语版**：`/yue/`、`/yue/mascot/`、`/yue/blog/`、`/yue/blog/<slug>/`、`/yue/downloads/`，与中文一一对应 |
| `/403/` `/418/` | 403 地区差异页（两套诗）、418 茶壶页 |
| `/404` | 404 诗：按 token 着色的非匀速打字机 |

## 启动态（Splash）

`src/components/Loader.astro`，绝区零路子的三件事：

1. **斜切叠层**：黑色 / 橙色两块 skew 色块 + 背面第二张斜纹卡 + 主卡片 + 贴纸，全部硬投影、零圆角，互相压边；
2. **元素共享**：标题本体与橙色重影共框错位；tible 贴纸在退场时用 FLIP 飞进导航 logo 再溶解，同一角色跨界面延续；
3. **滑动驱动**：滚轮 / 触摸 / 点击 / 按键任意一个都能把自检序列直接推到 100% 并触发退场，不必干等；无 JS 时靠 CSS 动画兜底 2.8s 自动退场，reduced-motion 下不出现。

## 贯穿全站的叙事轴

页面左侧有一条固定竖轴（`src/components/nav/NarrativeRail.tsx`）：

- 9 个章节刻度（01 开场 → 09 联系），当前章节的刻度变成橙色并显示编号，hover 出章节名，点击可直接跳过去；
- 轴内一条橙色进度线随滚动填充；
- **tible 站在轴上**，随滚动往下走，并跟着章节换表情（开场开心、地图段犯困、其余交替）——它就是"带你读完"的那个角色；
- 移动端收成贴左的一条 12px 细轴（只有刻度 + tible），不占正文宽度。

除此之外，每一屏都有一个**全幅滚动画布层**（`src/components/ui/SectionField.astro`：竖向发丝线 + 巨型章节号），随滚动平移，所以整页在滚动时没有"死掉的一段"。

## 位置屏的三维地球

原来是自己用 three.js 画球 + 烘一张等距圆柱贴图，滚到省级再淡出切给天地图 2D —— 转场一硬就露馅。现在改成**直接用天地图自己的三维地球**（Cesium + 天地图 WMTS 影像）：

- **懒加载**：IntersectionObserver 距离视口 500px 才注入 Cesium（约 5 MB），滚不到这一屏就一个字节都不下；
- **同一套影像从轨道落到门牌**：相机高度 22,000 km → 1.2 km 连续插值，全程天地图 img_w 瓦片，没有贴图切换，所以不会有「糊了再换图」的断点；
- **阻尼跟随**：滚动只提供目标高度，实际相机每帧朝目标插值 8.5%，滚轮停下来画面还会自己收尾，这就是「丝滑」的来源；
- **解码前的占位**：离线烘的 globe-poster.webp（720²，69 KB，正交投影对准韶关）先顶着，Cesium 首批瓦片到位后淡出；
- **注记分级**：cia_w 注记层透明度随进度从 0 → 0.92，远景不糊、近景可读；
- **可手动缩放**：右下角 +/− 按钮（三维和兜底 2D 都能用），倍率偏离后继续滚动会慢慢回叙事轨道；双击不再抢 Cesium 默认事件；
- **加载期也有反馈**：海报会随滚动进度放大（1 → 3.1 倍），不会出现「一张不会动的地球」；
- **兜底**：Cesium 挂了（CDN 不可达 / 无 WebGL）自动退回天地图 2D 卫星图 + 标记，再挂就显示 fail 文案和地址。

天地图 key 是浏览器端 key，前端直接用；要收紧请在天地图控制台配域名白名单。

## 手感规范（十条）

一次性落实的界面手感规则，全部在 `src/styles/tokens.css` + ` 与 `src/styles/global.css` 里，改一处全站生效。

| # | 规则 | 实现 |
| --- | --- | --- |
| 1 | 去边框，靠明度分层 | `--hair` 降到 4.5%；分块改用 `--surface-0/1/2/3` 与 `--dark-0/1/2/3` 的 1%–3% 明度差（能力格、团队卡、下载行） |
| 2 | 输入框无 outline | 聚焦用双层 box-shadow：内环 1px 收紧 + 外环橙色 4px 晕开 + inset 1px，形成咬合 |
| 3 | 暗色补偿 | `.on-dark` 内 `--fw-shift: -40`，正文 400→360、标签 500→460，防白字发胖 |
| 4 | 流式打字 | 单字 90ms 从 `blur(6px)` 到清晰，`cubic-bezier(.215,.61,.355,1)`，相邻错开 30ms |
| 5 | 行内图标 | `:where(p,span,a,button,li,…) > svg` 统一 `vertical-align: -0.125em` |
| 6 | 数字防抖 | `time` / `.mono` / `.tabular` 全部 `tabular-nums` + `tnum` |
| 7 | 丝滑折叠 | 移动端目录用 `grid-template-rows: 0fr → 1fr`，不问 JS 要高度 |
| 8 | 防孤字 | `body` 与标题 `text-wrap: pretty` / `balance` |
| 9 | 动效性格 | 拖拽 `--spring-drag`（k=1200 c=80，过阻尼零回弹）；点赞/对勾 `--spring-pop`（k=380 c=18，微弹）——两条曲线由弹簧方程积分生成 `linear()`，不是随手写的 bezier |
| 10 | 反馈自熄 | 复制按钮 2.5s 后自动恢复原状，带微弹对勾 |

降级：`prefers-reduced-motion` 下流式打字与弹簧全部关闭；无 JS 时标题保持纯文本可见（拆字只在 JS 真的执行后才隐藏）。

## 技术栈

- **Astro 5** — 静态输出，ScrollTrigger 首帧即可拿到准确布局；只有 3D / 表单 / 吉祥物互动是 island
- **React 19 islands** — 仅带状态的组件
- **Tailwind CSS 4** + CSS 变量设计令牌（`src/styles/tokens.css`）
- **GSAP 3 + ScrollTrigger**、**Lenis** 平滑滚动
- **three.js + @react-three/fiber + @react-three/drei** — 首屏 3D 标志
- **Cesium（懒加载）+ 天地图 WMTS** — 位置屏的三维地球：整颗地球连续缩到门牌号，全程同一套卫星影像，没有贴图切换
- **天地图（Tianditu）** — 三维地球影像源 + 2D 卫星地图兜底 + 定位

## 目录

```
src/
  layouts/Base.astro            全局 head、SEO/OG/hreflang、JSON-LD、字体
  components/
    Nav.astro  Footer.astro  Loader.astro      导航 / 页脚 / 00 加载态（包豪斯）
    sections/                   01 Hero 02 Claim 03 Capability 04 Method
                                05 Mascot 06 Why 07 Process 08 Team 09 Location 10 Contact
    mascot/                     寻美：舞台、互动台、角落探头、人物页
    map/GlobeToMap.tsx          三维地球（Cesium + 天地图 WMTS，懒加载）
    three/HeroMark.tsx          首屏实时 WebGL 标志
    forms/ContactForm.tsx       联系表单（演示用，不出网）
    ui/                         按钮、区块头
  i18n/                         types.ts（单一真源）+ zh.ts + en.ts
  styles/                       tokens.css / global.css / islands.css
  scripts/motion.ts             Lenis + ScrollTrigger + 加载层 + 菜单
public/
  fonts/                        自托管 woff2（子集化）+ fonts.css
  models/logo_3d.glb            meshopt 压缩，130.8 KB / 35,336 面
  img/                          立绘、3D 降级图、地球海报、地图标记
  brand/                        标志 SVG 全套
  og/                           OG 分享图
scripts/                        资产生成脚本（字体 / 立绘 / 地球贴图 / favicon / OG）
```

## 开发

```bash
pnpm install
pnpm dev        # http://localhost:4321
pnpm build      # 输出 dist/（纯静态）
pnpm preview    # 预览构建产物
```

> 环境注意：`pnpm` 12 默认拦截依赖的 build script，仓库里的 `pnpm-workspace.yaml` 已经用 `allowBuilds` 放行 `esbuild` / `sharp`，不要删。

## 部署

构建产物是纯静态，`dist/` 可直接部署（Vercel / Netlify / Nginx / 对象存储均可）。

- 部署到**根路径**：无需改配置，直接 `pnpm build`。
- 部署到**子路径**（如 GitHub Pages 项目页）：需要设置
  `astro.config.mjs` 里的 `site` 与 `base`，并把 `Base.astro` 中少量以 `/` 开头的资源引用改为 `import.meta.env.BASE_URL` 拼接。
- `astro.config.mjs` 里的 `site` 目前是占位域名 `https://maomaotou.tech`，上线前改成真实域名（影响 canonical / hreflang / sitemap / OG 绝对地址）。

## 团队头像

团队屏的头像**取自本人站点上公开的本人形象**，抓到后转成 192px PNG 存在 `public/team/`，
站内不外链任何第三方域名（避免泄露访客 IP 到别人服务器）：

| 角色 | 域名 | 头像来源 |
| --- | --- | --- |
| 法定代表人 | xiaoyanboke.cn | 该站「博主 QQ」公开的 QQ 头像（640×640） |
| 股东 / CEO | blog.meowhead.cn | `blog.rainchan.com`（同一站的可用镜像，og:url 仍是 blog.meowhead.cn）里的 `profile__avatar`（640×640） |
| 算法顾问 | luoaowoo.cn | `/images/logo/这是我的头像.jpg`（500×500，本人站点自己标注的头像） |

说明两点：

- 小岩笔记站内的头像位用的是主题自带随机图（`assets/images/rand/1..13.jpg`），不是本人照片，
  所以改用该站在页脚公开的「博主 QQ」对应的 QQ 头像，这是站主自己公示的形象。
- 没有生成任何人脸，也没有把随机图当成某个人的照片。姓名仍留空——只有域名，没有可公开的姓名。
- CEO 那张源图本身非常软（640×640 只有 18 KB，几乎是一张失焦的树叶特写），
  已做轻度对比 / 饱和 / 锐化归一化，否则在 56px 的牌子尺寸下会像图没加载。

## 三语

| 语言 | 前缀 | `<html lang>` | 说明 |
| --- | --- | --- | --- |
| 中文 | 无 | `zh-CN` | 简体 |
| 粵語 | `/yue` | `zh-HK` | 繁体粤语书面语（嘅 / 咗 / 喺 / 唔 / 冇 / 佢 / 哋） |
| English | `/en` | `en` | |

- 三份词典在 `src/i18n/{zh,yue,en}.ts`，共用一套 `Dict` 接口，缺字段编译期就报错。
- 语言切换器是三档胶囊（中 / 粵 / EN），当前项反白；导航、移动菜单、页脚各一份。
- `<head>` 输出三条 `hreflang`（`zh-CN` / `zh-HK` / `en`）+ `x-default`，路径由 `basePath()` / `pathFor()` 从当前 URL 推导，不用每页手写。
- 粤语首屏字符已加进 `CRITICAL_CJK`（323 字 / 104 KB 预加载子集），否则繁体字会掉进 589 KB 的全量子集。
- 404 页三语：按路径前缀 `/en`、`/yue` 切文案与分词诗（`TypedPoem` 新增 `linesYue`）。

## 备案

页脚「备案」栏两条，都是占位待替换：

| 项 | 当前 | 办理完成后 |
| --- | --- | --- |
| ICP 备案 | `粤ICP备（办理中）` | 换成真实备案号，链接仍指 beian.miit.gov.cn |
| 公安联网备案 | `粤公网安备（办理中）` + 官方徽标 | 换真实号码，并在 `footer.policeHref` 的 `?code=` 后补备案号 |

徽标 `public/brand/beian.png`（20×20）取自 beian.gov.cn 官方图标，是备案页面的指定标识。

## 许可

| 内容 | 许可 |
| --- | --- |
| 站点源码、品牌素材、`/downloads` 下的压缩包 | **MIT**（见根目录 `LICENSE`，站内可访问 `/LICENSE.txt`） |
| `/blog` 下的全部文章文字 | **CC BY 4.0** — 署名后可转载、改编、商用 |

MIT 覆盖的是版权；商标（猫猫头、绪方寻美、tible 的名称与形象识别）不在授权范围内，别用来暗示并不存在的合作或背书。第三方依赖各自遵循原始许可。

## 404 诗

`/404` 下半屏是一首四行的 404 诗，按「DeepSeek V4 分词器」的观感切成 token：

- 中文优先做双字合并（模拟 BPE merge），标点独立成 token；英文按词切，长词再切子词；
- 每个 token 一块圆角底色（品牌橙的 4 档透明度 + 墨黑的 3 档），token 之间留 0.34em 间距；
- 非匀速打字机：基础 52–167 ms 抖动，标点后 +210 ms，行首 +140 ms；进入视口才启动；
- 中英双语：SSR 输出全诗（无 JS 也读得到），客户端按 `/en/` 前缀切换；
- `prefers-reduced-motion` 直接全显，点一下也能看全。

## 资源下载与兼容主题

- `/downloads/`：标志包（62 KB）、立绘包（388 KB）、3D 模型（131 KB）、品牌提案板（227 KB）、图标集。每个文件都带格式 / 体积 / 使用说明。
- `/ie/`：独立的千禧年风格页面，**不复用现代设计系统**——纯表格布局、斜面边框、宋体、CSS 跑马灯、访客计数器、88×31 按钮、"最佳浏览 1024×768"。页面不依赖 JS / flex / grid / CSS 变量，老浏览器也能读。

## 团队

首页第 08 屏。三个人、三条责任线，身份牌直接给到个人站点：

| 编号 | 角色 | 链接 |
| --- | --- | --- |
| 01 | 法定代表人 | https://xiaoyanboke.cn |
| 02 | 股东 / CEO | https://blog.meowhead.cn |
| 03 | 算法顾问 | https://luoaowoo.cn |

> 卡片默认只显示「角色 + 域名」。要显示真名，在 `src/i18n/*.ts` 的 `team.members[].name` 填一个字符串即可（组件已有渲染分支）。

## 地图合规

国内站点只要嵌在线地图，就必须标注**审图号**（《地图管理条例》）。

- 位置屏左下角常驻一行 `审图号 GS（2026）4921号`，与 `实时卫星影像 · 天地图` 并排，三语各一份（`location.attribution`）；
- 号码取自天地图官方（`www.tianditu.gov.cn` 页面里的 `mapdrawingApprovalNumber`），不是自己编的；
- 兜底 2D 地图阶段，天地图 JS API 自己会在左下角画 logo 与审图号，此时 HUD 自动上抬，避免把它盖住；
- 如果换了底图供应商（高德 / 百度 / Mapbox），审图号必须跟着换，不能沿用。

## 内容与合规

- 站内所有公司事实只来自营业执照：全称、统一社会信用代码 `91440200MAKT9DRH5P`、注册资本 1000 万元、成立日期 2026-11-04、住所。
- **不虚构**客户、案例、奖项、员工人数、营收、合作方；能力条目全部从经营范围提炼。
- 备案写「粤ICP备（办理中）」，未编造备案号；邮箱 `hello@maomaotou.tech` 为占位地址。
- 表单是演示表单，前端不出网、不存数据。

## 品牌与吉祥物

- 三色：墨黑 `#141210` / 奶白 `#FFF9F1` / 亮橙 `#FF5A1A`。没有第四种主色。
- 标志：闭合轮廓的猫头，头顶 M 形（两峰两耳、谷为中缝），橙色三角鼻。
- **绪方 寻美（OGATA HIROMI）**：主吉祥物，猫娘。7 种状态立绘（idle / wave / think / happy / sleep / oops / peek）。
- **tible**：小吉祥物，就是那颗黑色猫头本身，尺寸上限 48px，只出现在加载、角标、404。
- 立绘由 AI 生成后统一抠底、裁切、导出 WebP（见 `scripts/build-mascot-assets.py`）。

## 滚动叙事覆盖率（实测）

用脚本遍历全站，统计"滚动时会动的元素"在纵向上的覆盖区间（合并重叠区间 / 页面总高）：

| 指标 | 结果 |
| --- | --- |
| 滚动反应覆盖率（含入场动效） | **100.7 %**（91 个反应元素，10,906 px / 10,829 px 页面） |
| 连续滚动联动（scrub / 3D / sticky / 叙事轴） | **100.7 %** |
| 每屏是否都有联动 | 10 屏 + 页脚，全覆盖 |
| 入场动画总数 / 滚完仍隐藏 | 41 / **0** |
| 叙事轴章节切换 | 0 %→开场 10 %→主张 20 %→能力 30 %→方法 40 %→吉祥物 50 %→为什么 60 %→流程 70 %→位置 90 %→联系 100 % |

## 适配与内核（实测矩阵）

| 宽度 | 设备 | 横向溢出 | 导航 | 叙事轴 |
| --- | --- | --- | --- | --- |
| 320 / 360 / 375 | 小屏手机 | 无 | 汉堡菜单 | 12px 细轴 |
| 390 横屏(844×390) | 手机横屏 | 无 | 汉堡菜单 | 12px 细轴 |
| 768 / 834 | iPad 竖屏 | 无 | 汉堡菜单 | 12px 细轴 |
| 1024 | 平板横屏 | 无 | 汉堡菜单 | 14px 刻度 |
| 1280 | 笔记本 | 无 | 完整导航 | 14px + 章节号 |
| 1440 / 1920 / 2560 | 桌面 / 超宽 | 无 | 完整导航 | 14px + 章节号 |

内核验证（真实浏览器，非模拟）：

| 内核 | 结果 |
| --- | --- |
| Chromium（Blink） | 3 个页面全部正常，首屏 WebGL 实拍渲染，0 报错 |
| Firefox（Gecko） | 3 个页面全部正常，字体/布局/叙事轴一致，WebGL 不可用时自动落到静态海报 |
| WebKit（Safari） | **本机无法验证**：Playwright 的 WebKit 缺少系统库（libavif / libbacktrace / libmanette），已尝试补 libevent 仍未跑起来 |

## 性能与可访问性（实测）

在本机 Chromium，限速「1.6 Mbps / 150ms RTT + 4× CPU」下：

| 指标 | 中文 | 英文 |
| --- | --- | --- |
| FCP | 0.81 s | 0.73 s |
| LCP | **1.41 s** | **1.46 s** |

- 首屏 3D 走的顺序：静态海报图（首帧即可见）→ WebGL 就绪后淡入接管；WebGL 不可用 / 低端设备自动停在静态图（`data-mode="static"`）。
- 375px 宽度下无横向滚动；`prefers-reduced-motion` 下所有动效直达终态（实测 41 个动画元素 0 个不可见）。
- 无 JS 时：标题、正文、页脚照常可读，加载层通过 CSS 动画自动退场。
- 所有 `<img>` 有 alt；装饰图 `aria-hidden`；表单字段都有 label；每页一个 `h1`。

## 已知取舍

1. **三维地球是懒加载的**：Cesium（约 5 MB gzip 前）只在滚动到位置屏前 500px 才开始下载，用户滚不到那屏就一个字节都不会下。首屏完全不受影响。
2. `mascot_3d.glb`（原 3.4 MB）已压缩到 440 KB，但猫娘方案下不再使用，保留备用。
3. 天地图的瓦片接口必须带浏览器 UA（服务端抓取），运行时由浏览器的天地图 JS API 自行请求，key 是浏览器端 key，暴露在客户端属正常用法；如需收紧请在天地图后台配置域名白名单。
4. 中文字体拆成 critical（70.8 KB，preload）+ full（321 KB，按需）两个子集；改文案后需要重跑 `scripts/build-fonts.py`，否则新字会回退到系统字体。

## 脚本

```bash
python3 scripts/build-fonts.py          # 扫描 src 生成中文字体子集 + fonts.css
python3 scripts/build-mascot-assets.py  # 立绘 trim / 缩放 / WebP
python3 scripts/build-globe.py          # 天地图卫星影像 → 等距圆柱贴图（供海报烘焙用）
python3 scripts/build-og.py             # OG 分享图
node scripts/build-images.mjs           # 3D 渲染图 → WebP/AVIF
node scripts/build-favicons.mjs         # favicon 套件
```
