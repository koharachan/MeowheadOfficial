#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
analyze-glb.py — 直接解析 GLB 的 JSON chunk，报告三角面数 / 顶点数 / 材质数 / 纹理数。

不依赖任何 3D 库，只读 GLB 头（12 字节）+ 第一个 JSON chunk，所以对 meshopt / draco
压缩后的文件同样有效（压缩只影响 BIN chunk，JSON 里的 accessor.count 不变）。

用法：
    python3 site/scripts/analyze-glb.py <a.glb> [b.glb ...]
    python3 site/scripts/analyze-glb.py --compare before.glb after.glb

注意：meshopt 压缩后 accessor 的 count 仍是原始顶点数（共享 bufferView 的情况除外），
三角形数按 primitive.indices.count / 3 统计，没有 indices 时按 POSITION.count / 3。
"""

from __future__ import annotations

import json
import struct
import sys
from pathlib import Path

GLB_MAGIC = 0x46546C67
CHUNK_JSON = 0x4E4F534A


def read_glb_json(path: Path) -> tuple[dict, dict]:
    data = path.read_bytes()
    magic, version, length = struct.unpack_from("<III", data, 0)
    if magic != GLB_MAGIC:
        raise SystemExit(f"{path}: 不是 GLB 文件（magic={magic:#x}）")
    offset = 12
    gltf = None
    bin_len = 0
    while offset < length:
        clen, ctype = struct.unpack_from("<II", data, offset)
        body = data[offset + 8 : offset + 8 + clen]
        if ctype == CHUNK_JSON and gltf is None:
            gltf = json.loads(body.decode("utf-8"))
        elif ctype != CHUNK_JSON:
            bin_len += clen
        offset += 8 + clen
    if gltf is None:
        raise SystemExit(f"{path}: 找不到 JSON chunk")
    return gltf, {"version": version, "file_bytes": len(data), "bin_bytes": bin_len}


def stats(path: Path) -> dict:
    g, meta = read_glb_json(path)
    accessors = g.get("accessors", [])
    meshes = g.get("meshes", [])
    prims = [p for m in meshes for p in m.get("primitives", [])]

    def acc_count(i):
        return accessors[i]["count"] if i is not None and i < len(accessors) else 0

    triangles = 0
    verts = 0
    for p in prims:
        if "indices" in p:
            triangles += acc_count(p["indices"]) // 3
        else:
            triangles += acc_count(p.get("attributes", {}).get("POSITION")) // 3
        verts += acc_count(p.get("attributes", {}).get("POSITION"))

    images = g.get("images", [])
    textures = g.get("textures", [])
    return {
        "path": str(path),
        "bytes": meta["file_bytes"],
        "triangles": triangles,
        "vertices": verts,
        "meshes": len(meshes),
        "primitives": len(prims),
        "materials": len(g.get("materials", [])),
        "textures": len(textures),
        "images": len(images),
        "nodes": len(g.get("nodes", [])),
        "animations": len(g.get("animations", [])),
        "skins": len(g.get("skins", [])),
        "extensionsUsed": g.get("extensionsUsed", []),
        "extensionsRequired": g.get("extensionsRequired", []),
    }


def human(n: int) -> str:
    return f"{n / 1024:.1f} KB" if n < 1024 * 1024 else f"{n / 1024 / 1024:.2f} MB"


def print_one(s: dict) -> None:
    print(f"{s['path']}")
    print(f"  体积        {human(s['bytes'])} ({s['bytes']} bytes)")
    print(f"  三角面数    {s['triangles']:,}")
    print(f"  顶点数      {s['vertices']:,}")
    print(f"  网格/图元   {s['meshes']} / {s['primitives']}")
    print(f"  材质        {s['materials']}")
    print(f"  纹理/图片   {s['textures']} / {s['images']}")
    print(f"  节点/动画   {s['nodes']} / {s['animations']}")
    if s["extensionsUsed"]:
        print(f"  扩展        {', '.join(s['extensionsUsed'])}")
    if s["extensionsRequired"]:
        print(f"  必须扩展    {', '.join(s['extensionsRequired'])}")


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        print(__doc__)
        return 1
    if "--compare" in sys.argv and len(args) >= 2:
        before, after = stats(Path(args[0])), stats(Path(args[1]))
        print_one(before)
        print()
        print_one(after)
        print("\n== 前后对比 ==")
        for key, label in (("bytes", "体积"), ("triangles", "三角面数"), ("vertices", "顶点数")):
            b, a = before[key], after[key]
            delta = f"{(a - b) / b * 100:+.1f}%" if b else "n/a"
            show = human if key == "bytes" else (lambda v: f"{v:,}")
            print(f"  {label:<8} {show(b):>12}  ->  {show(a):>12}   {delta}")
        return 0
    for p in args:
        print_one(stats(Path(p)))
        print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
