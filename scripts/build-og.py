#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build-og.py — 生成 OG 分享图（1200x630）。

产出：
  /home/koharachan/cathead/site/public/og/og-zh.jpg
  /home/koharachan/cathead/site/public/og/og-en.jpg

设计：奶白底 #FFF9F1 + 墨黑大字 #141210 + 亮橙 #FF5A1A 点缀，
右侧是 hiromi（绪方寻美）立绘，左侧是首屏主张。
字体直接用源字体（Noto Sans SC 可变 wght / Archivo / JetBrains Mono），
用 FreeType 的可变轴接口按需取 900 / 500 字重。

依赖：Pillow（已装）、源字体在 /home/koharachan/assetwork/fonts/。
用法：python3 site/scripts/build-og.py
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

SITE = Path("/home/koharachan/cathead/site")
PUBLIC = SITE / "public"
OUT = PUBLIC / "og"
FONT_SRC = Path("/home/koharachan/assetwork/fonts")

NOTO = FONT_SRC / "NotoSansCJKsc-VF.otf"
ARCHIVO = FONT_SRC / "instanced" / "Archivo-wdth100-wght100-900.ttf"
if not ARCHIVO.exists():
    ARCHIVO = FONT_SRC / "Archivo-VF.ttf"
MONO = FONT_SRC / "instanced" / "JetBrainsMono-500.ttf"
if not MONO.exists():
    MONO = FONT_SRC / "JetBrainsMono-VF.ttf"

MASCOT = PUBLIC / "img" / "mascot" / "hiromi-idle.webp"
MARK = Path("/home/koharachan/cathead/brand/logo_final/mark_primary.png")

W, H = 1200, 630
CREAM = (255, 249, 241)
INK = (20, 18, 16)
ORANGE = (255, 90, 26)
MUTED = (108, 101, 92)
SOFT = (246, 238, 228)

COPY = {
    "zh": {
        "kicker": "（广东）有限公司 · 广东韶关",
        "lines": ["上到卫星，", "下到代码。"],
        "sub": "硬件、软件与安全之间，没有第三家供应商。",
        "url": "MAOMAOTOU.TECH",
        "lang_font": "noto",
    },
    "en": {
        "kicker": "MAOMAOTOU NETWORK TECHNOLOGY · GUANGDONG",
        "lines": ["From satellites", "to a single line."],
        "sub": "Hardware, software and security — one contract, one team.",
        "url": "MAOMAOTOU.TECH",
        "lang_font": "archivo",
    },
}


def font(path: Path, size: int, weight: int | None = None) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(str(path), size)
    if weight is not None:
        try:
            axes = [a.maximum for a in f.font.get_variation_axes()] if hasattr(f, "font") else None
        except Exception:
            axes = None
        try:
            f.set_variation_by_axes([weight])
        except Exception:
            pass
    return f


def text_width(draw: ImageDraw.ImageDraw, text: str, f: ImageFont.FreeTypeFont, tracking: int = 0) -> float:
    if tracking == 0:
        return draw.textlength(text, font=f)
    return sum(draw.textlength(ch, font=f) for ch in text) + tracking * max(0, len(text) - 1)


def draw_tracked(draw, xy, text, f, fill, tracking=0):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=f, fill=fill)
        x += draw.textlength(ch, font=f) + tracking


def pick_size(draw, lines, path, weight, max_width, start, minimum=48):
    size = start
    while size > minimum:
        f = font(path, size, weight)
        if max(text_width(draw, ln, f) for ln in lines) <= max_width:
            return size, f
        size -= 2
    return minimum, font(path, minimum, weight)


def wrap(draw, text, f, max_width):
    lines, cur = [], ""
    for ch in text:
        if draw.textlength(cur + ch, font=f) <= max_width or not cur:
            cur += ch
        else:
            lines.append(cur)
            cur = ch
    if cur:
        lines.append(cur)
    return lines


def build(lang: str) -> Path:
    c = COPY[lang]
    img = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(img)

    # 背景：右侧一块很淡的暖色圆，给立绘一点衬托
    d.ellipse([W - 560, 20, W + 140, H + 160], fill=SOFT)

    # —— 立绘（右下角，贴底）
    mascot = Image.open(MASCOT).convert("RGBA")
    mh = 604
    mw = round(mascot.width * mh / mascot.height)
    mascot = mascot.resize((mw, mh), Image.LANCZOS)
    mx, my = W - mw - 26, H - mh
    img.paste(mascot, (mx, my), mascot)
    text_max = mx - 88 - 36

    # —— 顶部品牌行
    if MARK.exists():
        mark = Image.open(MARK).convert("RGBA")
        mark = mark.resize((46, 46), Image.LANCZOS)
        img.paste(mark, (88, 62), mark)
        brand_x = 88 + 46 + 16
    else:
        brand_x = 88
    bf = font(NOTO, 25, 500)
    d.text((brand_x, 70), "猫猫头网络科技", font=bf, fill=INK)
    mf = font(MONO, 13)
    draw_tracked(d, (brand_x, 108), "MAOMAOTOU NETWORK TECHNOLOGY", mf, MUTED, tracking=2)

    # —— kicker（左侧橙色竖条 + 公司名）
    ky = 172
    d.rectangle([88, ky + 2, 94, ky + 30], fill=ORANGE)
    if lang == "zh":
        kf = font(NOTO, 21, 500)
    else:
        kf = font(MONO, 15)
    if lang == "zh":
        d.text((112, ky), c["kicker"], font=kf, fill=MUTED)
    else:
        draw_tracked(d, (112, ky + 2), c["kicker"], kf, MUTED, tracking=1)

    # —— 主标题（自动收缩到可用宽度）
    title_path = NOTO if c["lang_font"] == "noto" else ARCHIVO
    title_weight = 900
    size, tf = pick_size(d, c["lines"], title_path, title_weight, text_max, 88, 52)
    line_h = round(size * 1.2)
    y = 212
    for ln in c["lines"]:
        d.text((86, y), ln, font=tf, fill=INK)
        y += line_h

    # —— 橙色短线 + 副文案
    rule_y = y + 18
    d.rectangle([88, rule_y, 88 + 104, rule_y + 9], fill=ORANGE)
    sub_path = NOTO if lang == "zh" else ARCHIVO
    sub_weight = 400 if lang == "zh" else 400
    sf = font(sub_path, 22 if lang == "zh" else 21, sub_weight)
    sub_lines = wrap(d, c["sub"], sf, text_max)
    sy = rule_y + 40
    for ln in sub_lines[:3]:
        d.text((88, sy), ln, font=sf, fill=MUTED)
        sy += 34

    # —— 底部：域名 + 语种角标
    uf = font(MONO, 19)
    draw_tracked(d, (88, H - 76), c["url"], uf, INK, tracking=2)
    url_w = text_width(d, c["url"], uf, 2)
    d.ellipse([88 + url_w + 10, H - 68, 88 + url_w + 18, H - 60], fill=ORANGE)
    lf = font(MONO, 13)
    tag = "ZH" if lang == "zh" else "EN"
    draw_tracked(d, (88, H - 46), "ALL IN ONE  /  " + tag, lf, MUTED, tracking=2)

    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"og-{lang}.jpg"
    img.save(path, format="JPEG", quality=88, optimize=True, progressive=True)
    print(f"  {path.name}  {img.width}x{img.height}  {path.stat().st_size / 1024:.1f} KB")
    return path


def main() -> int:
    for lang in ("zh", "en"):
        build(lang)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
