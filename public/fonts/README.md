# 自托管字体（public/fonts）

> 由 `site/scripts/build-fonts.py` 自动生成，**不要手改产物**。改文案/换字重后重跑脚本即可。
> 生成时间：2026-11-07 02:39:29

## 为什么自托管

首屏 LCP 不能被 Google Fonts CDN 卡住（国内不可达 / 额外 DNS + TLS 握手）。这里全部是本地 `woff2`，同域名、可 CDN 缓存、可 preload。

## 文件清单

| 文件 | 用途 | 体积 | 字形数 | 子集字符数 |
| --- | --- | ---: | ---: | ---: |
| [`noto-sans-sc-critical.woff2`](./noto-sans-sc-critical.woff2) | 中文首屏关键子集（preload，覆盖首屏文字/导航） | 104.1 KB | 530 | 318 |
| [`noto-sans-sc-full.woff2`](./noto-sans-sc-full.woff2) | 中文全站子集（unicode-range 与 critical 互补） | 589.4 KB | 2653 | 1439 |
| [`archivo-latin.woff2`](./archivo-latin.woff2) | 拉丁字母/数字/符号（可变 100-900） | 24.7 KB | 194 | 180 |
| [`jetbrains-mono-400.woff2`](./jetbrains-mono-400.woff2) | 等宽 400（工程感标签/编号） | 19.1 KB | 394 | 235 |
| [`jetbrains-mono-500.woff2`](./jetbrains-mono-500.woff2) | 等宽 500（强调） | 19.9 KB | 394 | 235 |


## 字体来源与许可

| 家族 | 源文件 | 许可 |
| --- | --- | --- |
| Noto Sans SC（中文） | [notofonts/noto-cjk](https://github.com/notofonts/noto-cjk) `Sans/Variable/OTF/NotoSansCJKsc-VF.otf`（可变 wght 100-900） | SIL OFL 1.1 |
| Archivo（拉丁/数字） | [google/fonts](https://github.com/google/fonts) `ofl/archivo/Archivo[wdth,wght].ttf`（wdth 固定 100） | SIL OFL 1.1 |
| JetBrains Mono（等宽） | [google/fonts](https://github.com/google/fonts) `ofl/jetbrainsmono/JetBrainsMono[wght].ttf` | SIL OFL 1.1 |

三个家族都是 **SIL Open Font License 1.1**：可商用、可自托管、可子集化，保留版权声明即可。

## 用法

```html
<link rel="stylesheet" href="/fonts/fonts.css" />
```

（global.css 里 `@import "/fonts/fonts.css";` 也可以，但 `<link>` 更快发现、不阻塞 CSSOM 构建。）

首屏建议 preload 这两个（critical 子集 + 拉丁子集）：

```html
<link rel="preload" href="/fonts/noto-sans-sc-critical.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/fonts/archivo-latin.woff2" as="font" type="font/woff2" crossorigin />
```

推荐字体栈：

```css
--font-sans: "Archivo", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
--font-mono: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
```

## unicode-range 说明

critical 与 full 是同一 `font-family` 的两个文件：
- critical 的 `unicode-range` = 它实际包含的字符；
- full 的 `unicode-range` = 全站字符集 **减去** critical 已覆盖的字符。

两组范围互补，所以浏览器只为页面实际出现的字去挑文件，不会出现「后一个文件把前一个覆盖掉、fallback 字符丢失」的问题。范围是从子集 woff2 的 cmap 实际算出来的（连续码位自动合并）。

## 重新生成

```bash
# 源字体（一次性，约 31 MB + 0.7 MB + 0.2 MB）
mkdir -p /home/koharachan/assetwork/fonts && cd /home/koharachan/assetwork/fonts
curl --noproxy '*' -LO https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/Variable/OTF/NotoSansCJKsc-VF.otf
curl --noproxy '*' -LO 'https://raw.githubusercontent.com/google/fonts/main/ofl/archivo/Archivo%5Bwdth%2Cwght%5D.ttf'
curl --noproxy '*' -LO 'https://raw.githubusercontent.com/google/fonts/main/ofl/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf'

python3 -m pip install --user fonttools brotli
python3 /home/koharachan/cathead/site/scripts/build-fonts.py
```

脚本每次都会重新扫描 `src/**` 与 `site.config.*` 的字符，**改完 i18n 文案后重跑一次**就会把新字补进子集。
扫描不到中文字符时用 `FALLBACK_CJK` 占位兜底；正式发布建议加 `--no-fallback`。

## 参数

| 参数 | 说明 |
| --- | --- |
| `--dry-run` | 只扫描统计，不生成字体 |
| `--no-fallback` | 不用占位字符集，只切源码里真实出现的字 |
| `--no-instance` | 不做可变字重轴裁剪（Archivo / JetBrains Mono） |
