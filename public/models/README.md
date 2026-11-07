# 3D 模型（public/models）

全部由 `site/scripts/analyze-glb.py` 校验，源文件来自 `/home/koharachan/cathead/brand/3d/`。
压缩链：weld → prune → quantize (KHR_mesh_quantization) → meshopt (EXT_meshopt_compression)。

| 文件 | 用途 | 体积 | 三角面 | 顶点 | 必须扩展 |
| --- | --- | ---: | ---: | ---: | --- |
| `logo_3d.glb` | **首屏 3D logo（首选）** | 130.8 KB | 35,336 | 20,897 | `EXT_meshopt_compression`, `KHR_mesh_quantization` |
| `logo_3d.mobile.glb` | 低端机 LOD（顶点减半） | 76.4 KB | 15,896 | 11,482 | 同上 |
| `logo_3d.quantized.glb` | 不想加载 meshopt 解码器时的回退（服务端 gzip 后约 240 KB） | 537.6 KB | 35,336 | 20,897 | `KHR_mesh_quantization` |
| `mascot_3d.glb` | 旧 3D 吉祥物（猫娘方案上线后大概率不再使用） | 439.7 KB | 102,338 | 56,617 | meshopt + webp 纹理 + quantization |

原始 `logo_3d.glb` 767 KB → 130.8 KB（**-82.5%**），`mascot_3d.glb` 3.34 MB → 439.7 KB（**-87.1%**）。

## 用法（React Three Fiber + drei，推荐）

`@react-three/drei` 的 `useGLTF` **自带 meshopt 解码器**，直接加载即可，不需要额外配置：

```tsx
import { useGLTF } from '@react-three/drei';
const { scene } = useGLTF('/models/logo_3d.glb');
```

## 用法（裸 three.js GLTFLoader）

必须手动设置 meshopt 解码器，否则模型不会显示：

```ts
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
loader.load('/models/logo_3d.glb', (gltf) => { /* ... */ });
```

`KHR_mesh_quantization` three r150+ 原生支持，无需额外处理。

如果移动端想省带宽，可以按 `matchMedia('(max-width: 768px)')` 切到 `logo_3d.mobile.glb`。

## 重新生成

```bash
cd /home/koharachan/assetwork && npm i @gltf-transform/cli
npx gltf-transform weld       work/logo_src.glb work/logo_1_weld.glb
npx gltf-transform prune      work/logo_1_weld.glb work/logo_2_prune.glb
npx gltf-transform quantize   work/logo_2_prune.glb work/logo_3_quant.glb
npx gltf-transform meshopt    work/logo_3_quant.glb work/logo_4_meshopt.glb
python3 /home/koharachan/cathead/site/scripts/analyze-glb.py --compare work/logo_src.glb work/logo_4_meshopt.glb
```
