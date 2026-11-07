#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build-globe.py — 天地图卫星影像瓦片 -> Web Mercator 拼图 -> 等距圆柱(equirectangular)地球贴图。

流程：
  1. 下载 Web Mercator 瓦片（默认 z=4，16x16=256 张 256px，拼成 4096x4096）；
  2. numpy 双线性重投影到等距圆柱 2048x1024（纬度 -90..90，经度 0..360，x=0 处经度 = lon0）；
  3. 经度平移：让东经 113.56°（韶关）落在贴图正中间 x=W/2，球体初始朝向中国；
  4. 轻微降饱和 + 提对比（不加锐化），导出 WebP 2048/1024 + 1024 预览 PNG。

天地图接口要点（已实测）：
  - 必须带浏览器 UA，否则返回 403 {"code":301012,"msg":"权限类型错误"}；
  - Referer 不是必须的，但带上更稳；
  - t0..t7 八个域名可轮询。

用法：
    python3 site/scripts/build-globe.py                 # z=4
    python3 site/scripts/build-globe.py --zoom 3        # 更快，2048 拼图
    python3 site/scripts/build-globe.py --lon 113.56    # 贴图中心经度
"""

from __future__ import annotations

import argparse
import math
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance

SITE = Path("/home/koharachan/cathead/site")
OUT = SITE / "public" / "img" / "globe"
CACHE = Path("/home/koharachan/assetwork/tiles")

TK = "ffd7ff4248c941cfdd6028f846d9405c"
TILE_URL = "https://t{h}.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=" + TK
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
REFERER = "https://maomaotou.tech/"

MAX_LAT = 85.05112877980659
DEFAULT_LON = 113.56   # 韶关经度，放在贴图正中间


def tile_path(z: int, x: int, y: int) -> Path:
    return CACHE / f"z{z}" / f"{x}_{y}.jpg"


def download_tile(z: int, x: int, y: int, tries: int = 4) -> bool:
    p = tile_path(z, x, y)
    if p.exists() and p.stat().st_size > 200:
        return True
    p.parent.mkdir(parents=True, exist_ok=True)
    import urllib.request

    last = None
    for attempt in range(tries):
        host = (x + y + attempt) % 8
        url = TILE_URL.format(h=host, x=x, y=y, z=z)
        req = urllib.request.Request(url, headers={
            "User-Agent": UA,
            "Referer": REFERER,
            "Accept": "image/avif,image/webp,image/png,image/*;q=0.8,*/*;q=0.5",
            "Accept-Language": "zh-CN,zh;q=0.9",
        })
        try:
            with urllib.request.urlopen(req, timeout=25) as resp:
                data = resp.read()
            if len(data) > 200 and data[:2] == b"\xff\xd8":
                p.write_bytes(data)
                return True
            last = data[:160]
        except Exception as exc:  # noqa: BLE001
            last = repr(exc)
        time.sleep(0.4 * (attempt + 1))
    print(f"    ! tile {z}/{x}/{y} failed: {last}")
    return False


def build_mosaic(z: int, workers: int = 12) -> Image.Image:
    n = 2 ** z
    total = n * n
    print(f"  [tiles] z={z}: {n}x{n}={total} 张")
    tasks = [(x, y) for x in range(n) for y in range(n)]
    done = 0
    t0 = time.time()
    failed = 0
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = [pool.submit(download_tile, z, x, y) for x, y in tasks]
        for fut in as_completed(futures):
            if not fut.result():
                failed += 1
            done += 1
            if done % 64 == 0 or done == total:
                print(f"    {done}/{total}  {time.time() - t0:.1f}s")
    print(f"  [tiles] 完成，失败 {failed} 张，用时 {time.time() - t0:.1f}s")

    size = 256 * n
    mosaic = Image.new("RGB", (size, size), (8, 12, 18))
    blank = 0
    for x, y in tasks:
        p = tile_path(z, x, y)
        if not p.exists():
            blank += 1
            continue
        try:
            with Image.open(p) as im:
                mosaic.paste(im.convert("RGB"), (x * 256, y * 256))
        except Exception:
            blank += 1
    if blank:
        print(f"  ! 有 {blank} 张瓦片缺失，已用深色填充")
    return mosaic


def reproject_equirect(mosaic: Image.Image, w_out: int, h_out: int, center_lon: float,
                       lat_full: bool = True, strip: int = 128) -> Image.Image:
    """Web Mercator -> 等距圆柱。输出 x=0 对应经度 center_lon-180，x=W/2 对应 center_lon。

    按条带处理，避免大图（z=5 的 8192 拼图）一次性转 float32 把内存吃爆。
    """
    arr = np.asarray(mosaic.convert("RGB"))   # uint8，8192^2 约 200 MB
    h_m, w_m = arr.shape[:2]

    lon0 = center_lon - 180.0
    xs = np.arange(w_out, dtype=np.float64)
    lon = lon0 + (xs + 0.5) * 360.0 / w_out
    lon = ((lon + 180.0) % 360.0) - 180.0          # 归一化到 [-180, 180)
    xm = np.clip((lon + 180.0) / 360.0 * w_m - 0.5, 0, w_m - 1)

    x0 = np.floor(xm).astype(np.int32)
    x1 = np.minimum(x0 + 1, w_m - 1)
    wx = (xm - x0).astype(np.float32)[None, :, None]

    lat_limit = 90.0 if lat_full else MAX_LAT
    out = np.empty((h_out, w_out, 3), dtype=np.uint8)
    for y0_out in range(0, h_out, strip):
        y1_out = min(h_out, y0_out + strip)
        ys = np.arange(y0_out, y1_out, dtype=np.float64)
        lat = lat_limit - (ys + 0.5) * (2 * lat_limit) / h_out
        lat = np.clip(lat, -MAX_LAT, MAX_LAT)
        ym = (0.5 - np.log(np.tan(math.pi / 4 + np.deg2rad(lat) / 2)) / (2 * math.pi)) * h_m - 0.5
        ym = np.clip(ym, 0, h_m - 1)
        y0 = np.floor(ym).astype(np.int32)
        y1 = np.minimum(y0 + 1, h_m - 1)
        wy = (ym - y0).astype(np.float32)[:, None, None]

        a = arr[y0[:, None], x0[None, :]].astype(np.float32)
        b = arr[y0[:, None], x1[None, :]].astype(np.float32)
        c = arr[y1[:, None], x0[None, :]].astype(np.float32)
        d = arr[y1[:, None], x1[None, :]].astype(np.float32)
        top = a + (b - a) * wx
        bot = c + (d - c) * wx
        res = top + (bot - top) * wy
        out[y0_out:y1_out] = np.clip(res, 0, 255).astype(np.uint8)

    print(f"  [reproject] {w_m}x{h_m} mercator -> {w_out}x{h_out} equirect（中心经度 {center_lon}°E，x=0 处 {lon0:.2f}°）")
    return Image.fromarray(out, "RGB")


def grade(img: Image.Image) -> Image.Image:
    """轻微降饱和 + 提对比，让球体在奶白背景上有实体感；不做锐化。"""
    img = ImageEnhance.Color(img).enhance(0.84)
    img = ImageEnhance.Contrast(img).enhance(1.05)
    img = ImageEnhance.Brightness(img).enhance(1.07)
    return img


def save_webp(img: Image.Image, path: Path, quality: int, max_bytes: int) -> tuple[int, int]:
    q = quality
    while True:
        img.save(path, format="WEBP", quality=q, method=6)
        size = path.stat().st_size
        if size <= max_bytes or q <= 50:
            return q, size
        q -= 4


def make_lqip(img: Image.Image, path: Path, size: tuple[int, int] = (128, 64)) -> int:
    """from 2048 贴图生成 128x64 的低质量占位图（WebP），用于球体贴图加载前先铺色。"""
    small = img.resize(size, Image.LANCZOS)
    q = 60
    while True:
        small.save(path, format="WEBP", quality=q, method=6)
        n = path.stat().st_size
        if n <= 4096 or q <= 20:
            return n
        q -= 10


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--zoom", type=int, default=4)
    ap.add_argument("--lon", type=float, default=DEFAULT_LON)
    ap.add_argument("--workers", type=int, default=12)
    ap.add_argument("--width", type=int, default=2048, help="输出贴图宽度（高度自动取一半）")
    ap.add_argument("--lat-range", choices=["full", "85"], default="full",
                    help="full=标准 -90..90 equirect（three.js SphereGeometry 直接用）；85=只铺 -85..85 再拉伸占满（自定义 UV 时才用）")
    ap.add_argument("--no-download", action="store_true", help="只用已缓存瓦片")
    ap.add_argument("--lqip-only", action="store_true", help="只用现有 earth-2048.webp 重新生成 128x64 LQIP")
    args = ap.parse_args()

    OUT.mkdir(parents=True, exist_ok=True)
    if args.lqip_only:
        src = OUT / "earth-2048.webp"
        if not src.exists():
            print("缺少 earth-2048.webp，先跑完整流程")
            return 2
        with Image.open(src) as im:
            n = make_lqip(im.convert("RGB"), OUT / "earth-lqip.webp")
        print(f"  earth-lqip.webp  128x64  {n / 1024:.1f} KB")
        return 0

    print("== 1/4 拼接墨卡托底图 ==")
    if args.no_download and not (CACHE / f"z{args.zoom}").exists():
        print("没有缓存瓦片")
        return 2
    mosaic = build_mosaic(args.zoom, args.workers)

    print("== 2/4 重投影 ==")
    w_out = args.width
    h_out = w_out // 2
    eq = reproject_equirect(mosaic, w_out, h_out, args.lon, lat_full=(args.lat_range == "full"))
    eq = grade(eq)

    print("== 3/4 导出 ==")
    max_bytes = 400 * 1024 if w_out <= 2048 else 900 * 1024
    p_main = OUT / f"earth-{w_out}.webp"
    q, size = save_webp(eq, p_main, 82, max_bytes)
    print(f"  {p_main.name}  {eq.width}x{eq.height}  {size / 1024:.1f} KB  (q={q})")

    small = eq.resize((1024, 512), Image.LANCZOS)
    p1024 = OUT / "earth-1024.webp"
    q2, size2 = save_webp(small, p1024, 82, 200 * 1024)
    print(f"  {p1024.name}  {small.width}x{small.height}  {size2 / 1024:.1f} KB  (q={q2})")

    preview = OUT / "earth-1024@preview.png"
    small.save(preview, format="PNG", optimize=True)
    print(f"  {preview.name}  {preview.stat().st_size / 1024:.1f} KB")

    lqip = make_lqip(eq, OUT / "earth-lqip.webp")
    print(f"  earth-lqip.webp  128x64  {lqip / 1024:.1f} KB（贴图加载前的占位）")

    print("== 4/4 说明 ==")
    print(f"  经度：x=0 -> {(args.lon - 180) % 360:.2f}°E，x=W/2 -> {args.lon}°E，x=W -> {(args.lon + 180) % 360:.2f}°E")
    print(f"  纬度：标准 equirectangular，覆盖 -90..90（墨卡托极限 ±{MAX_LAT:.2f}° 之外用边缘像素填充）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
