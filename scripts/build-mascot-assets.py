#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build-mascot-assets.py — 吉祥物立绘后处理（可反复重跑）。

角色：
  hiromi-*  主吉祥物「绪方 寻美 / OGATA HIROMI」  -> 长边 720 / @512 / png(720)
  tible-*   小吉祥物「TIBLE」（黑色猫头本体）     -> 长边 320 / @160 / png(320)

输入：/home/koharachan/assetwork/img/final/*.png（透明底 1254x1254，图像 API 陆续产出）
输出：/home/koharachan/cathead/site/public/img/mascot/
      <name>.webp            主尺寸（透明，q88）
      <name>@512.webp / @160.webp  小尺寸
      <name>.png             透明 PNG 回退
      hiromi-face.webp       512x512 头部特写（从 hiromi-idle 裁）
      hiromi-face-128.png    128x128 小头像
      manifest.json          每个文件的实际像素尺寸 / 用途 / 体积

处理规则：
  1. alpha 通道 getbbox() 自动 trim 透明边距（不裁头顶呆毛：bbox 上边贴到 0 时自然保留）；
  2. 四周补 6% 透明 padding；
  3. 无 alpha 通道的图（生成异常）会尝试「从四边泛洪抠底」并打 warning 写进 manifest。

用法：
    python3 site/scripts/build-mascot-assets.py
    python3 site/scripts/build-mascot-assets.py --force          # 源没变也重建
    python3 site/scripts/build-mascot-assets.py --pad 0.06 --no-pad
"""

from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

DEFAULT_SRC = Path("/home/koharachan/assetwork/img/final")
DEFAULT_OUT = Path("/home/koharachan/cathead/site/public/img/mascot")
WEBP_QUALITY = 88

# 每个角色家族的输出规格
FAMILIES = {
    "hiromi": {
        "persona": "绪方 寻美 / OGATA HIROMI（主吉祥物）",
        "main": 720,
        "small": 512,
        "small_suffix": "@512",
    },
    "tible": {
        "persona": "TIBLE（小吉祥物，黑色猫头）",
        "main": 320,
        "small": 160,
        "small_suffix": "@160",
    },
}
SKIP_PREFIXES = ("mibo-", "_", ".")

STATE_USAGE = {
    "idle": "默认待机姿态（首屏 / 关于我们）",
    "wave": "打招呼（CTA 区块 / 客服浮窗）",
    "think": "思考（服务流程 / 方案说明）",
    "happy": "开心（成功态 / 活动）",
    "sleep": "睡觉（404 / 休息态 / 夜间模式）",
    "oops": "出错（错误页 / 表单校验失败）",
    "peek": "探头（滚动彩蛋 / 侧边装饰）",
    "alert": "警觉（提示 / 通知）",
}


def has_real_alpha(im: Image.Image) -> bool:
    if im.mode not in ("RGBA", "LA"):
        return False
    alpha = im.convert("RGBA").getchannel("A")
    return alpha.getextrema()[0] < 250


def key_background(im: Image.Image) -> Image.Image:
    """无 alpha 的图：从画面边缘识别并抠掉背景（纯色或棋盘格透明底），返回 RGBA。

    做法：先标记「中性灰/白」候选背景像素，再做连通域分析，只保留与画面边缘相连的
    候选区域作为背景 —— 这样角色内部的浅色（奶白毛衣、白色高光）不会被误删。
    """
    rgb = im.convert("RGB")
    try:
        import numpy as np
        from scipy import ndimage

        arr = np.asarray(rgb).astype(np.int16)
        mx = arr.max(axis=2)
        mn = arr.min(axis=2)
        lum = arr.mean(axis=2)
        candidate = ((mx - mn) <= 10) & (lum >= 130) & (lum <= 245)
        labels, _ = ndimage.label(candidate)
        border = np.unique(np.concatenate([labels[0, :], labels[-1, :], labels[:, 0], labels[:, -1]]))
        border = border[border != 0]
        bg = np.isin(labels, border)
        solid = ~bg
        # 1px 腐蚀掉抗锯齿灰边，再轻微羽化
        solid = ndimage.binary_erosion(solid, iterations=1)
        alpha = Image.fromarray((solid * 255).astype("uint8"))
        alpha = alpha.filter(ImageFilter.GaussianBlur(0.6))
    except Exception as exc:  # numpy/scipy 不可用时的兜底：四角泛洪
        print(f"    ! numpy 抠底失败（{exc}），退回泛洪填充")
        w, h = rgb.size
        marker = (255, 0, 255)
        work = rgb.copy()
        for xy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
            try:
                ImageDraw.floodfill(work, xy, marker, thresh=45)
            except Exception:
                pass
        px = work.load()
        alpha = Image.new("L", (w, h), 255)
        apx = alpha.load()
        for y in range(h):
            for x in range(w):
                if px[x, y] == marker:
                    apx[x, y] = 0
        alpha = alpha.filter(ImageFilter.GaussianBlur(1))

    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    return out


def trim_and_pad(im: Image.Image, pad_ratio: float) -> tuple[Image.Image, tuple | None]:
    rgba = im.convert("RGBA")
    bbox = rgba.getchannel("A").getbbox()
    if bbox:
        rgba = rgba.crop(bbox)
    if pad_ratio > 0:
        w, h = rgba.size
        pad = max(1, round(max(w, h) * pad_ratio))
        canvas = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
        canvas.paste(rgba, (pad, pad))
        rgba = canvas
    return rgba, bbox


def resize_long_edge(im: Image.Image, long_edge: int) -> Image.Image:
    w, h = im.size
    if max(w, h) <= long_edge:
        return im.copy()
    scale = long_edge / max(w, h)
    return im.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)


def save_set(im: Image.Image, out_dir: Path, stem: str, main: int, small: int, small_suffix: str,
             fmt: str, usage: str, records: list) -> None:
    sized = resize_long_edge(im, main)
    if fmt in ("main", "png"):
        if fmt == "png":
            p = out_dir / f"{stem}.png"
            sized.save(p, format="PNG", optimize=True, compress_level=9)
            records.append(make_record(p, sized, usage + "（PNG 回退，透明）"))
        else:
            p = out_dir / f"{stem}.webp"
            sized.save(p, format="WEBP", quality=WEBP_QUALITY, method=6, alpha_quality=95)
            records.append(make_record(p, sized, usage + "（主用，透明 WebP）"))
    if fmt == "small":
        s = resize_long_edge(im, small)
        p = out_dir / f"{stem}{small_suffix}.webp"
        s.save(p, format="WEBP", quality=WEBP_QUALITY, method=6, alpha_quality=95)
        records.append(make_record(p, s, usage + f"（小尺寸 {small}px 长边，透明 WebP）"))


def make_record(p: Path, im: Image.Image, usage: str) -> dict:
    return {
        "file": p.name,
        "path": f"/img/mascot/{p.name}",
        "format": p.suffix.lstrip("."),
        "width": im.width,
        "height": im.height,
        "bytes": p.stat().st_size,
        "usage": usage,
    }


def crop_face(im: Image.Image) -> Image.Image:
    """从 trim 后的全身立绘里裁头部特写（方形，头顶留一点空气）。"""
    w, h = im.size
    side = min(w, round(h * 0.52))
    # 头部横向中心：取画面上方 45% 区域 alpha 的质心
    region = im.crop((0, 0, w, max(1, round(h * 0.45))))
    a = region.getchannel("A")
    px = a.load()
    total = 0
    sx = 0
    for y in range(0, region.height, 2):
        for x in range(0, region.width, 2):
            if px[x, y] > 8:
                sx += x
                total += 1
    cx = round(sx / total) if total else w // 2
    x0 = max(0, min(w - side, cx - side // 2))
    y0 = max(0, min(h - side, round(side * 0.04)))
    return im.crop((x0, y0, x0 + side, y0 + side))


def process_family(src: Path, out_dir: Path, family: dict, pad_ratio: float, force: bool,
                   records: list, sources: list, warnings: list) -> None:
    stem = src.stem
    expected = [out_dir / f"{stem}.webp", out_dir / f"{stem}{family['small_suffix']}.webp", out_dir / f"{stem}.png"]
    if not force and all(p.exists() and p.stat().st_mtime >= src.stat().st_mtime for p in expected):
        print(f"  = 跳过（已最新）：{src.name}")
        for p in expected:
            with Image.open(p) as im:
                records.append(make_record(p, im, f"复用（源文件未变）"))
        return

    with Image.open(src) as raw:
        info = {"file": src.name, "source_pixels": list(raw.size), "mode": raw.mode}
        if has_real_alpha(raw):
            im = raw.convert("RGBA")
        elif raw.mode in ("RGB", "P", "L"):
            print(f"    ! {src.name} 没有 alpha 通道，尝试边缘抠底")
            im = key_background(raw)
            warnings.append(f"{src.name} 缺少 alpha 通道（{raw.mode}），已自动从四边抠底，建议让图像 API 重新生成透明底版本")
            info["background_keyed"] = True
        else:
            im = raw.convert("RGBA")

    trimmed, bbox = trim_and_pad(im, pad_ratio)
    info["trim_bbox"] = list(bbox) if bbox else None
    info["padded_pixels"] = [trimmed.width, trimmed.height]
    print(f"  {src.name}: {info['source_pixels'][0]}x{info['source_pixels'][1]} -> trim {bbox} -> {trimmed.width}x{trimmed.height}")

    state = stem.split("-", 1)[1] if "-" in stem else stem
    usage = f"{family['persona']} · {STATE_USAGE.get(state, state)}"
    for fmt in ("main", "small", "png"):
        before = len(records)
        save_set(trimmed, out_dir, stem, family["main"], family["small"], family["small_suffix"], fmt, usage, records)
        for r in records[before:]:
            print(f"    {r['file']:<30} {r['width']:>4}x{r['height']:<4} {r['bytes'] / 1024:>7.1f} KB")

    if stem == "hiromi-idle":
        face = crop_face(trimmed)
        print(f"    -> hiromi-face.webp / .png  (crop {face.width}x{face.height})")
        fw = face.resize((512, 512), Image.LANCZOS)
        p = out_dir / "hiromi-face.webp"
        fw.save(p, format="WEBP", quality=WEBP_QUALITY, method=6, alpha_quality=95)
        records.append(make_record(p, fw, "hiromi 头部特写 512x512（透明，头像/OG 装饰）"))
        p128 = out_dir / "hiromi-face-128.png"
        face.resize((128, 128), Image.LANCZOS).save(p128, format="PNG", optimize=True, compress_level=9)
        records.append(make_record(p128, face.resize((128, 128), Image.LANCZOS), "hiromi 头部特写 128x128（favicon 装饰/小头像）"))
        print(f"    {p.name:<30} 512x512  {p.stat().st_size / 1024:>7.1f} KB")
        print(f"    {p128.name:<30} 128x128  {p128.stat().st_size / 1024:>7.1f} KB")

    sources.append(info)



def build_map_marker(out_dir: Path, size: int = 256) -> dict | None:
    """地图标记：奶白圆盘 + tible 猫头（暗色卫星图上也看得见），输出 /img/map/tible-marker.png。"""
    src = DEFAULT_SRC / "tible-idle.png"
    if not src.exists():
        return None
    map_dir = out_dir.parent / "map"
    map_dir.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as raw:
        head = raw.convert("RGBA")
        bbox = head.getchannel("A").getbbox()
        if bbox:
            head = head.crop(bbox)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(canvas)
    pad = round(size * 0.06)
    d.ellipse([pad, pad, size - pad, size - pad], fill=(255, 249, 241, 255),
              outline=(20, 18, 16, 255), width=max(2, round(size * 0.018)))
    inner = round(size * 0.66)
    head.thumbnail((inner, inner), Image.LANCZOS)
    canvas.paste(head, ((size - head.width) // 2, (size - head.height) // 2), head)
    p = map_dir / "tible-marker-badge.png"
    canvas.save(p, format="PNG", optimize=True)
    print(f"  {p.name:<28} {size}x{size}  {p.stat().st_size / 1024:.1f} KB  (地图标记 → {p.parent})")
    return {"file": p.name, "path": f"/img/map/{p.name}", "format": "png",
            "width": size, "height": size, "bytes": p.stat().st_size,
            "usage": "天地图地图阶段的 tible 标记（奶白圆盘 + 猫头，暗色卫星底可见）"}


def main() -> int:
    ap = argparse.ArgumentParser(description="吉祥物立绘后处理")
    ap.add_argument("--src", default=str(DEFAULT_SRC))
    ap.add_argument("--out", default=str(DEFAULT_OUT))
    ap.add_argument("--force", action="store_true", help="源文件未变也强制重建")
    ap.add_argument("--pad", type=float, default=0.06, help="trim 后四周透明 padding 比例，默认 0.06")
    ap.add_argument("--no-pad", action="store_true", help="不补 padding")
    args = ap.parse_args()

    src_dir, out_dir = Path(args.src), Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    if not src_dir.exists():
        print(f"源目录不存在：{src_dir}")
        return 0
    pngs = sorted(p for p in src_dir.glob("*.png") if p.is_file() and not p.name.startswith(SKIP_PREFIXES))
    if not pngs:
        print(f"暂无立绘：{src_dir} 里没有 PNG。图像 API 产出后重跑本脚本即可。")
        return 0

    pad_ratio = 0 if args.no_pad else args.pad
    records: list[dict] = []
    sources: list[dict] = []
    warnings: list[str] = []
    print(f"== 处理 {len(pngs)} 张立绘（padding={pad_ratio:.0%}）==")
    for p in pngs:
        family_key = p.stem.split("-", 1)[0]
        family = FAMILIES.get(family_key)
        if not family:
            print(f"  - 跳过未识别角色：{p.name}")
            continue
        process_family(p, out_dir, family, pad_ratio, args.force, records, sources, warnings)

    print("== 地图标记 ==")
    marker = build_map_marker(out_dir)
    if marker:
        records.append(marker)

    manifest = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "generator": "site/scripts/build-mascot-assets.py",
        "note": "吉祥物立绘：透明底 PNG -> WebP(q88, 保留透明) + PNG 回退。已按 alpha bbox trim 并补统一 padding。",
        "characters": {k: v["persona"] for k, v in FAMILIES.items()},
        "padding_ratio": pad_ratio,
        "sources": sources,
        "warnings": warnings,
        "files": sorted(records, key=lambda e: e["file"]),
    }
    mp = out_dir / "manifest.json"
    mp.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    total = sum(r["bytes"] for r in records)
    print(f"\n完成：{len(records)} 个文件，合计 {total / 1024:.1f} KB")
    if warnings:
        print("警告：")
        for w in warnings:
            print("  ! " + w)
    print(f"manifest: {mp}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
