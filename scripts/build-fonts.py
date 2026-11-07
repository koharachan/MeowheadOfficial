#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build-fonts.py — 「猫猫头网络科技官网」自托管网页字体子集化流水线

产物（public/fonts/）：
  noto-sans-sc-critical.woff2   中文首屏关键子集（可变字重 wght 100-900，preload）
  noto-sans-sc-full.woff2       中文全站子集（可变字重 wght 100-900，懒加载）
  archivo-latin.woff2           拉丁/数字子集（可变字重 wght 100-900，wdth 固定 100）
  jetbrains-mono-400.woff2      等宽 400（静态实例后子集）
  jetbrains-mono-500.woff2      等宽 500（静态实例后子集）
  fonts.css                     最终 @font-face（unicode-range 按实际 cmap 计算）
  README.md                     来源/许可/体积/字形数/重新生成命令

流程：
  1. 扫描站点源码（src/**/*.ts、.astro、.tsx、.md…、site.config.*）抽出真实用到的字符；
  2. pyftsubset 切子集 + woff2（brotli）；
  3. 读子集结果的 cmap 生成 unicode-range，保证 critical / full 两个同族文件互补而不是互相覆盖。

可反复重跑：i18n 没写完时用占位字符集兜底，写完后再跑一次即可把新字补进去。

用法：
    python3 site/scripts/build-fonts.py
    python3 site/scripts/build-fonts.py --dry-run
    python3 site/scripts/build-fonts.py --no-fallback   # 只切源码里真实出现的字
    python3 site/scripts/build-fonts.py --no-instance   # 不做可变字重轴裁剪

环境变量：
    CATHEAD_FONT_SRC   源字体目录，默认 /home/koharachan/assetwork/fonts
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
import time
from pathlib import Path

# ---------------------------------------------------------------- 路径

SCRIPT_DIR = Path(__file__).resolve().parent
SITE_ROOT = SCRIPT_DIR.parent
PUBLIC_DIR = SITE_ROOT / "public"
FONTS_OUT = PUBLIC_DIR / "fonts"
FONT_SRC = Path(os.environ.get("CATHEAD_FONT_SRC", "/home/koharachan/assetwork/fonts"))
INSTANCE_DIR = FONT_SRC / "instanced"

NOTO_SRC = FONT_SRC / "NotoSansCJKsc-VF.otf"
ARCHIVO_SRC = FONT_SRC / "Archivo-VF.ttf"
JBM_SRC = FONT_SRC / "JetBrainsMono-VF.ttf"

# ---------------------------------------------------------------- 字符集

# 首屏关键子集：站名 + 导航 + 首屏大标题/副标题/按钮（约 130 字，可安全超集）
CRITICAL_CJK = (
    # 首屏真实文案（取自 src/i18n/zh.ts 的 brand / nav / ux / hero 段，2026-11-07 版本）
    "猫猫头网络科技（广东）有限公司"
    "上到卫星，下到代码。"
    "卫星终端是我们造的，跑在终端上的系统也是我们写的。硬件、软件与安全之间，没有第三家供应商。"
    "看我们做什么 聊聊你的项目"
    "成立 注册资本 注册地 广东 韶关"
    "首屏为实时渲染的 3D 标志，随滚动转向"
    "能力 方法 吉祥物 为什么 流程 联系 聊一聊 菜单 关闭"
    "跳到主要内容 正在加载 已就绪 向下滚动 页面段落索引"
    "页面底下还有一位在等你 认识寻美 寻美 绪方"
    # 粤语首页（zh-HK 用繁体，首屏不可回退到全量子集）
    "貓貓頭網絡科技（廣東）有限公司"
    "上到衛星，下到代碼。"
    "衛星終端係我哋造嘅，跑喺終端上面嘅系統都係我哋寫嘅。硬件、軟件同安全之間，冇第三間供應商。"
    "睇下我哋做咩 傾下你個項目 傾兩句 成立 註冊資本 註冊地 韶關"
    "首屏係即時渲染嘅三維標誌，會跟住滑動轉向"
    "能力 方法 吉祥物 為咩 流程 團隊 位置 聯絡 選單 閂 載入緊 搞掂 向下滑"
    "跳去主要內容 頁面段落索引 頁底仲有一位喺度等你 識下尋美 尋美 緒方"
    # 常见兜底（导航/按钮/数字标签的高频字，避免文案小改就掉出 critical）
    "首页产品服务解决方案案例关于我们团队客户优势新闻招聘加入"
    "一二三四五六七八九十百千万亿年月日"
    "中文更多了解查看全部详情立即咨询开始合作"
)

# 占位全站字符集：i18n 未写完时兜底，避免出现豆腐块
FALLBACK_CJK = (
    "猫猫头网络科技首页产品服务解决方案案例关于我们联系方式团队客户优势新闻招聘加入"
    "数字化转型技术让世界更简单立即咨询开始合作免费评估获取报价预约演示在线客服"
    "人工智能大数据云计算物联网区块链安全开发设计运维运营网站小程序移动端企业级"
    "高性能稳定性可靠性创新专业性经验十年行业深耕合作伙伴交付上线优化体验响应式"
    "驱动智慧未来数字平台架构微服务中台数据可视化分析决策云端部署容器自动化监控"
    "预警防护加密合规隐私保障质量测试敏捷迭代持续集成文档培训支持售后响应定制"
    "预算周期报价欢迎致电邮箱地址北京上海深圳杭州广州成都武汉西安南京苏州长沙"
    "厦门香港全球国内领先专注匠心极致简单高效智能连接万物系统软件硬件集成接口"
    "协议网络服务器数据库算法模型训练推理引擎框架前端后端全栈工程师协作文化"
    "招聘简历福利成长学习分享使命愿景价值观真诚开放好奇热爱坚持结果导向用户第一"
    "口碑信赖长期发展共赢生态渠道代理加盟媒体报道动态博客活动直播白皮书报告手册"
    "下载资料帮助中心常见问题条款政策版权声明商标注册号电话传真邮编官网域名备案"
    "每一个项目都从理解您的业务开始用技术回答真实问题让复杂变简单让效率看得见"
    "本页面所示内容版权归所有未经许可不得转载使用法律允许范围内最终解释权"
    "公司简介发展历程资质荣誉社会责任合作伙伴客户评价联系我们获取方案"
    "行业覆盖金融教育医疗制造零售物流政企能源汽车地产文旅餐饮电商传媒"
    "核心能力研发实力项目管理质量保证信息安全交付流程运维体系持续服务"
    "选择理由响应速度快交付质量高价格透明沟通顺畅售后无忧省心放心"
    "常见问答如何收费多久交付能否定制是否有案例技术支持保密协议"
    "联系我们工作时间周一至周五上午下午周末节假日请留言我们会尽快回复"
)

CJK_PUNCT = "，。、；：？！“”‘’（）【】《》〈〉「」『』—…·～¥￥％＋－×÷　．"

SYMBOLS = "→←↑↓⟶⟵✓✔✕✖•●○◆◇■□★☆♥※†‡§¶©®™°±µ≈≤≥≠∞€£¥¢×÷—–…‘’“”·‹›«»"

LATIN_EXTRA = "ÄÖÜäöüßÉÈÊËÁÀÂÅÍÌÎÏÓÒÔÕÚÙÛÇÑŒÆéèêëáàâåíìîïóòôõúùûçñœæ€£¥¢©®™°±§µ×÷–—…‘’“”·•‹›«»"

# 等宽字体额外字符：工程图纸感的编号/参数/结构符号
MONO_EXTRA = "→←↑↓·•—–…±×÷≈≤≥√∑∫∞°§¶©®™₀₁₂₃₄₅₆₇₈₉⁰¹²³⁴⁵⁶⁷⁸⁹☐☑☰⌘─│┌┐└┘├┤┬┴┼██░▒▓"

# ---------------------------------------------------------------- 扫描

SCAN_PATTERNS = [
    "src/**/*.astro",
    "src/**/*.tsx",
    "src/**/*.jsx",
    "src/**/*.ts",
    "src/**/*.js",
    "src/**/*.mjs",
    "src/**/*.md",
    "src/**/*.mdx",
    "src/**/*.json",
    "src/**/*.html",
    "src/**/*.yaml",
    "src/**/*.yml",
    "src/**/*.css",
    "src/**/*.cjs",
    "site.config.*",
]
SKIP_DIRS = {"node_modules", ".git", "dist", ".astro", "public"}
UNICODE_ESCAPE_RE = re.compile(r"\\u([0-9a-fA-F]{4})")


def iter_source_files() -> list[Path]:
    files: set[Path] = set()
    for pattern in SCAN_PATTERNS:
        for p in SITE_ROOT.glob(pattern):
            if p.is_file() and not any(part in SKIP_DIRS for part in p.parts):
                files.add(p)
    return sorted(files)


def is_cjk(ch: str) -> bool:
    o = ord(ch)
    return (
        0x3400 <= o <= 0x4DBF
        or 0x4E00 <= o <= 0x9FFF
        or 0xF900 <= o <= 0xFAFF
        or 0x20000 <= o <= 0x2FA1F
        or 0x3040 <= o <= 0x30FF
        or 0xAC00 <= o <= 0xD7AF
    )


def scan_chars() -> tuple[set[str], list[Path]]:
    files = iter_source_files()
    chars: set[str] = set()
    for path in files:
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        for ch in text:
            if ord(ch) > 127:
                chars.add(ch)
        for m in UNICODE_ESCAPE_RE.finditer(text):
            cp = int(m.group(1), 16)
            if cp > 127:
                chars.add(chr(cp))
    return chars, files


# ---------------------------------------------------------------- 字体加工


def run(cmd: list[str]) -> None:
    pretty = " ".join(cmd)
    print("    $ " + (pretty if len(pretty) < 200 else pretty[:197] + "..."))
    subprocess.run(cmd, check=True)


def instance_axes(src: Path, dst: Path, axes: list[str]) -> Path:
    if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
        return dst
    INSTANCE_DIR.mkdir(parents=True, exist_ok=True)
    print(f"  [instance] {src.name} -> {dst.name}  ({' '.join(axes)})")
    t0 = time.time()
    run([sys.executable, "-m", "fontTools.varLib.instancer", str(src), *axes, "-o", str(dst)])
    print(f"    done in {time.time() - t0:.1f}s -> {dst.stat().st_size / 1024:.1f} KB")
    return dst


def font_cmap_chars(path: Path) -> set[str]:
    from fontTools.ttLib import TTFont

    with TTFont(str(path), lazy=True) as f:
        return {chr(cp) for cp in f.getBestCmap()}


def count_glyphs(path: Path) -> int:
    try:
        from fontTools.ttLib import TTFont

        with TTFont(str(path)) as f:
            return len(f.getGlyphOrder())
    except Exception as exc:  # pragma: no cover
        print(f"    ! glyph count failed: {exc}")
        return -1


def subset_font(src: Path, dst: Path, chars: set[str], label: str) -> dict:
    chars = {c for c in chars if c.strip() or c == " "}
    dst.parent.mkdir(parents=True, exist_ok=True)
    tmp = dst.with_suffix(".charset.txt")
    tmp.write_text("".join(sorted(chars)), encoding="utf-8")
    print(f"  [subset] {label}: {len(chars)} chars -> {dst.name}")
    t0 = time.time()
    run([
        sys.executable, "-m", "fontTools.subset", str(src),
        "--text-file=" + str(tmp),
        "--output-file=" + str(dst),
        "--flavor=woff2",
        "--layout-features=kern,liga,clig,calt,ccmp,mark,mkmk,locl",
        "--no-hinting",
        "--drop-tables+=DSIG,vhea,vmtx",
        "--recalc-timestamp",
        "--no-subset-tables+=fvar,avar",
    ])
    tmp.unlink(missing_ok=True)
    size = dst.stat().st_size
    glyphs = count_glyphs(dst)
    print(f"    -> {size / 1024:.1f} KB, {glyphs} glyphs, {time.time() - t0:.1f}s")
    return {"file": dst.name, "bytes": size, "glyphs": glyphs, "chars": len(chars)}


def unicode_range(chars: set[str]) -> str:
    cps = sorted({ord(c) for c in chars})
    if not cps:
        return "U+0-10FFFF"
    parts: list[str] = []
    start = prev = cps[0]
    for cp in cps[1:]:
        if cp == prev + 1:
            prev = cp
            continue
        parts.append(f"U+{start:X}" if start == prev else f"U+{start:X}-{prev:X}")
        start = prev = cp
    parts.append(f"U+{start:X}" if start == prev else f"U+{start:X}-{prev:X}")
    return ",".join(parts)


# ---------------------------------------------------------------- 输出模板

CSS_HEADER = """/*
 * 猫猫头网络科技官网 · 自托管字体（自动生成：site/scripts/build-fonts.py，请勿手改）
 * 生成时间：{generated_at}
 *
 * 文件体积 / 字形数：
{file_comment}
 *
 * Noto Sans SC critical 子集覆盖的首屏文字：站名「猫猫头网络科技」、导航（首页/产品/服务/
 * 解决方案/案例/关于我们/联系）、首屏 H1 与副标题、首屏 CTA 按钮、首屏统计数字标签；
 * 其余中文由 full 子集按需加载（font-display: swap），不会阻塞 LCP。
 *
 * 许可：Noto Sans SC / Archivo / JetBrains Mono 均为 SIL Open Font License 1.1。
 */
"""

CSS_TMPL = """
@font-face {{
  font-family: "Archivo";
  src: url("/fonts/archivo-latin.woff2") format("woff2");
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
  unicode-range: {archivo_range};
}}

@font-face {{
  font-family: "Noto Sans SC";
  src: url("/fonts/noto-sans-sc-critical.woff2") format("woff2");
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
  unicode-range: {noto_critical_range};
}}

@font-face {{
  font-family: "Noto Sans SC";
  src: url("/fonts/noto-sans-sc-full.woff2") format("woff2");
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
  unicode-range: {noto_full_range};
}}

@font-face {{
  font-family: "JetBrains Mono";
  src: url("/fonts/jetbrains-mono-400.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  unicode-range: {mono_range};
}}

@font-face {{
  font-family: "JetBrains Mono";
  src: url("/fonts/jetbrains-mono-500.woff2") format("woff2");
  font-weight: 500;
  font-style: normal;
  font-display: swap;
  unicode-range: {mono_range};
}}
"""

README_TMPL = """# 自托管字体（public/fonts）

> 由 `site/scripts/build-fonts.py` 自动生成，**不要手改产物**。改文案/换字重后重跑脚本即可。
> 生成时间：{generated_at}

## 为什么自托管

首屏 LCP 不能被 Google Fonts CDN 卡住（国内不可达 / 额外 DNS + TLS 握手）。这里全部是本地 `woff2`，同域名、可 CDN 缓存、可 preload。

## 文件清单

| 文件 | 用途 | 体积 | 字形数 | 子集字符数 |
| --- | --- | ---: | ---: | ---: |
{file_rows}
{extra_rows}

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
"""


def human_size(n: int) -> str:
    if n >= 1024 * 1024:
        return f"{n / 1024 / 1024:.2f} MB"
    return f"{n / 1024:.1f} KB"


def main() -> int:
    ap = argparse.ArgumentParser(description="生成自托管子集字体")
    ap.add_argument("--dry-run", action="store_true", help="只扫描打印，不生成")
    ap.add_argument("--no-fallback", action="store_true", help="不使用占位字符集")
    ap.add_argument("--no-instance", action="store_true", help="跳过可变字重轴裁剪")
    args = ap.parse_args()

    t0 = time.time()
    print("== 1/4 扫描源码字符 ==")
    scanned, files = scan_chars()
    scanned_cjk = {c for c in scanned if is_cjk(c)}
    print(f"  扫描 {len(files)} 个源码文件，非 ASCII 字符 {len(scanned)} 个（其中 CJK {len(scanned_cjk)} 个）")
    if files:
        print("  文件：" + ", ".join(str(p.relative_to(SITE_ROOT)) for p in files[:10])
              + (" ..." if len(files) > 10 else ""))
    if not scanned_cjk:
        print("  ! 源码里还没有中文字符（i18n 未写完？），使用占位字符集兜底")

    if args.dry_run:
        print(f"\n[dry-run] 扫描到字符：{''.join(sorted(scanned))[:800]}")
        return 0

    for src in (NOTO_SRC, ARCHIVO_SRC):
        if not src.exists():
            print(f"错误：缺少源字体 {src}", file=sys.stderr)
            return 2

    print("\n== 2/4 准备源字体 ==")
    archivo_src = ARCHIVO_SRC
    if not args.no_instance:
        archivo_src = instance_axes(ARCHIVO_SRC, INSTANCE_DIR / "Archivo-wdth100-wght100-900.ttf", ["wdth=100", "wght=100:900"])

    print("\n== 3/4 子集化 ==")
    critical_chars: set[str] = {c for c in CRITICAL_CJK if c.strip()}
    critical_chars |= set(CJK_PUNCT)
    critical_chars |= set("0123456789%+/—·")

    full_chars: set[str] = set(scanned_cjk) | {c for c in scanned if not c.isascii()}
    full_chars |= critical_chars
    if not args.no_fallback:
        full_chars |= {c for c in FALLBACK_CJK if c.strip()}

    latin_chars: set[str] = {chr(c) for c in range(0x20, 0x7F)}
    latin_chars |= set(LATIN_EXTRA)
    latin_chars |= {c for c in scanned if ord(c) < 0x2000 and not is_cjk(c)}
    latin_chars |= set("→←↑↓√")

    noto_symbols: set[str] = set(SYMBOLS)
    mono_chars = set(latin_chars) | set(MONO_EXTRA) | set(SYMBOLS)

    FONTS_OUT.mkdir(parents=True, exist_ok=True)
    results: dict[str, dict] = {}
    results["critical"] = subset_font(NOTO_SRC, FONTS_OUT / "noto-sans-sc-critical.woff2", critical_chars | noto_symbols, "中文首屏关键子集")
    results["full"] = subset_font(NOTO_SRC, FONTS_OUT / "noto-sans-sc-full.woff2", full_chars | noto_symbols, "中文全站子集")
    results["archivo"] = subset_font(archivo_src, FONTS_OUT / "archivo-latin.woff2", latin_chars, "拉丁/数字子集")

    if JBM_SRC.exists():
        jobs = [("mono400", 400), ("mono500", 500)]
        for key, weight in jobs:
            src = JBM_SRC
            if not args.no_instance:
                src = instance_axes(JBM_SRC, INSTANCE_DIR / f"JetBrainsMono-{weight}.ttf", [f"wght={weight}"])
            results[key] = subset_font(src, FONTS_OUT / f"jetbrains-mono-{weight}.woff2", mono_chars, f"等宽 {weight}")
    else:
        print(f"  ! 缺少 {JBM_SRC}，跳过 JetBrains Mono")

    print("\n== 4/4 生成 fonts.css 与 README ==")
    # unicode-range 从实际 cmap 计算：critical 优先，full 排除 critical 已覆盖的码位
    cmap_critical = font_cmap_chars(FONTS_OUT / "noto-sans-sc-critical.woff2")
    cmap_full_own = font_cmap_chars(FONTS_OUT / "noto-sans-sc-full.woff2")
    cmap_full = cmap_full_own - cmap_critical
    cmap_archivo = font_cmap_chars(FONTS_OUT / "archivo-latin.woff2")
    cmap_mono = font_cmap_chars(FONTS_OUT / "jetbrains-mono-400.woff2") if "mono400" in results else set()

    file_comment_lines = []
    labels = {
        "critical": "noto-sans-sc-critical.woff2：中文首屏关键子集（preload，wght 100-900）",
        "full": "noto-sans-sc-full.woff2：中文全站子集（懒加载，wght 100-900）",
        "archivo": "archivo-latin.woff2：拉丁/数字子集（wght 100-900）",
        "mono400": "jetbrains-mono-400.woff2：等宽 400（标签/编号/参数）",
        "mono500": "jetbrains-mono-500.woff2：等宽 500（标签/编号/参数强调）",
    }
    for k, r in results.items():
        file_comment_lines.append(f" *   {labels[k]} — {human_size(r['bytes'])} / {r['glyphs']} 字形 / {r['chars']} 字符")

    css = CSS_HEADER.format(
        generated_at=time.strftime("%Y-%m-%d %H:%M:%S"),
        file_comment="\n".join(file_comment_lines),
    ) + CSS_TMPL.format(
        archivo_range=unicode_range(cmap_archivo),
        noto_critical_range=unicode_range(cmap_critical),
        noto_full_range=unicode_range(cmap_full),
        mono_range=unicode_range(cmap_mono),
    )
    (FONTS_OUT / "fonts.css").write_text(css, encoding="utf-8")
    print(f"  fonts.css -> {(FONTS_OUT / 'fonts.css').stat().st_size} bytes")

    # ---------------- 校验：src 里所有非 ASCII 字符都必须落在已生成的某个字体里 ----------------
    print("\n== 校验 ==")
    covered = set()
    for fn in ("noto-sans-sc-critical.woff2", "noto-sans-sc-full.woff2", "archivo-latin.woff2"):
        covered |= font_cmap_chars(FONTS_OUT / fn)
    for fn in ("jetbrains-mono-400.woff2", "jetbrains-mono-500.woff2"):
        p = FONTS_OUT / fn
        if p.exists():
            covered |= font_cmap_chars(p)
    missing = sorted(scanned - covered)
    if missing:
        print(f"  ✗ 缺字 {len(missing)} 个：{''.join(missing)}")
        print(f"    码位：{' '.join(f'U+{ord(c):04X}' for c in missing)}")
    else:
        print(f"  ✓ src 里全部 {len(scanned)} 个非 ASCII 字符都在子集里（critical/full/archivo/mono 任一份）")
    hero_chars = {c for c in CRITICAL_CJK if c.strip()}
    hero_missing = sorted(hero_chars - cmap_critical)
    if hero_missing:
        print(f"  ✗ critical 子集缺 {len(hero_missing)} 个首屏用字：{''.join(hero_missing)}")
    else:
        print(f"  ✓ critical 子集覆盖首屏关键字符表全部 {len(hero_chars)} 个字")
    missing_upper = [c for c in "ABCDEFGHIJKLMNOPQRSTUVWXYZ" if c not in covered]
    print(f"  {'✓' if not missing_upper else '✗'} 拉丁 A-Z（动态拼接 IDLE/WAVE/HIROMI-01 等）：{'全部覆盖' if not missing_upper else '缺 ' + ''.join(missing_upper)}")

    rows = []
    purposes = {
        "critical": ("中文首屏关键子集（preload，覆盖首屏文字/导航）", len(cmap_critical)),
        "full": ("中文全站子集（unicode-range 与 critical 互补）", len(cmap_full_own)),
        "archivo": ("拉丁字母/数字/符号（可变 100-900）", len(cmap_archivo)),
        "mono400": ("等宽 400（工程感标签/编号）", len(cmap_mono)),
        "mono500": ("等宽 500（强调）", len(cmap_mono)),
    }
    for k, r in results.items():
        purpose, chars = purposes[k]
        rows.append(f"| [`{r['file']}`](./{r['file']}) | {purpose} | {human_size(r['bytes'])} | {r['glyphs']} | {chars} |")

    extra_rows = ""
    readme = README_TMPL.format(
        generated_at=time.strftime("%Y-%m-%d %H:%M:%S"),
        file_rows="\n".join(rows),
        extra_rows=extra_rows,
    )
    (FONTS_OUT / "README.md").write_text(readme, encoding="utf-8")

    total = sum(r["bytes"] for r in results.values()) + (FONTS_OUT / "fonts.css").stat().st_size
    print(f"\n[done] {len(results)} 个 woff2 + fonts.css + README.md，合计 {human_size(total)}，用时 {time.time() - t0:.1f}s")
    for k, r in results.items():
        print(f"  {r['file']:<32} {human_size(r['bytes']):>9}  {r['glyphs']:>5} glyphs  {r['chars']:>4} chars")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
