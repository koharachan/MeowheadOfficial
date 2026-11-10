/*
首屏右侧那颗会转的标识：实时 WebGL（three.js）渲染 logo_3d.glb，
鼠标移过来会跟着偏一点、页面往下滚会慢慢自转并缩小，模型没到位之前先显示静态海报。

  - 能跑实时渲染：WebGL2/WebGL 可用、不是两核两 G 的弱机 → mode=live，转起来
  - 跑不了 / 显卡上下文丢了 → mode=static，只留海报，不报错、不空着
  - 离开视口就停帧（frameloop=never），别在后台白烧 GPU

在 Astro 页面里这样调用（client:idle = 首屏空下来再接管）：

  <HeroMark
    client:idle
    poster="/img/logo-3d-1200.webp"  // 静态海报：模型下载期间和降级后看它
    posterAlt={h.posterAlt}          // 海报的替代文字
    noteLive={h.sceneNote}           // 转起来时角上那行小字
    noteStatic={h.sceneNoteFallback} // 静态时角上那行小字
  />

样式全在 styles/islands.css 的 .hero-mark / .hero-canvas / .hero-poster / .hero-note 里；
这里只负责 data-mode / data-hidden / data-visible 这三个开关。
*/
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

/** 画面处在哪一档：pending = 还没判断完、live = 实时渲染、static = 只留静态海报 */
type Mode = 'pending' | 'live' | 'static';

// --- 判断这台设备能不能跑实时渲染 ---

/** 这台设备能不能画 WebGL：建一个离屏 canvas 试着取上下文，取不到就是不能 */
function canUseWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;                     // 有些浏览器直接抛异常，也算不能
  }
}

/** 是不是明显跑不动的弱机：内存 ≤ 2G 或者只有 ≤ 2 个核。
    宁可给张静态图，也不要开着一块转不动的 canvas 把整页拖卡 */
function isLowEndDevice() {
  const nav = navigator as Navigator & { deviceMemory?: number; hardwareConcurrency?: number };
  const memory = nav.deviceMemory;          // 内存（GB），只有部分浏览器给
  const cores = nav.hardwareConcurrency;    // 逻辑核数
  if (typeof memory === 'number' && memory > 0 && memory <= 2) return true;
  if (typeof cores === 'number' && cores > 0 && cores <= 2) return true;
  return false;
}

// --- 把 Blender 导出的模型收拾成能直接摆进画面的样子 ---

/** 克隆一份模型并统一材质、居中、缩放到画面里合适的大小。
    直接用 scene 会污染 drei 的缓存（下次进来还是被改过的样子），所以先 clone */
function prepareModel(scene: THREE.Group) {
  const root = scene.clone(true);

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;                 // 只要网格，灯光/相机节点跳过
    mesh.castShadow = false;                  // 不开阴影：这一屏没有地面，开了只是白算
    mesh.receiveShadow = false;
    mesh.frustumCulled = true;                // 出画面就不画

    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((mat) => {
      const m = mat as THREE.MeshStandardMaterial;
      if (!m) return;
      // 用同一套「纸感哑光 + 一点高光」的参数覆盖 Blender 导出的默认值（0.46 是试出来最像纸的一档）
      m.roughness = 0.46;
      m.metalness = 0.0;                      // 不带金属感，否则在暖光下会发白
      m.envMapIntensity = 0.9;                // 环境反射收一点，细节才留得住
      if ('flatShading' in m) m.flatShading = false; // 要圆润表面，不要低模的多边形感
      m.needsUpdate = true;                   // 改完材质参数必须标脏，否则不生效
    });
  });

  // 自动居中 + 适配视口，不依赖 Blender 里的作者坐标（模型原点常常不在几何中心）
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const wrapper = new THREE.Group();
  root.position.sub(center);                  // 把几何中心挪到原点
  wrapper.add(root);

  const maxDim = Math.max(size.x, size.y, size.z) || 1; // 最长的那条边；全 0（空模型）时兜成 1，免得下面除以 0
  const shrink = 2.95 / maxDim;               // 2.95 是相机在 z=5.4、fov=34 下「刚好不顶边」的直径
  wrapper.scale.setScalar(shrink);

  return wrapper;
}

// --- 会转的那颗标识本体 ---

/** 相机、鼠标、滚动都接进来之后，这一层只负责每帧把模型摆到该在的位置 */
function Mark({ onReady }: { onReady: () => void }) {
  const { scene } = useGLTF('/models/logo_3d.glb', false, true); // 第三个参数 true = 直接拿 ArrayBuffer 解析，省一次额外的 fetch
  const group = useRef<THREE.Group>(null);
  const ready = useRef(false);        // 首帧画出来只通知父级一次
  const { size } = useThree();        // 视口尺寸：窄屏模型要再小一点

  const model = useMemo(() => prepareModel(scene as unknown as THREE.Group), [scene]);

  const pointer = useRef({ x: 0, y: 0 }); // 鼠标位置，-1 ~ 1
  const scroll = useRef(0);               // 首页滚过的比例 0~1
  const reduce = useRef(false);           // 用户在系统里开了「减少动态效果」

  useEffect(() => {
    reduce.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 鼠标位置归一化到 -1 ~ 1：左上角是 (-1,-1)，右下角是 (1,1)，视差量直接乘系数
    const onPointer = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    // 滚过一屏就记满 1；夹住是因为这之后模型只按满格摆，不用继续变
    const onScroll = () => {
      scroll.current = Math.min(1, Math.max(0, window.scrollY / Math.max(1, window.innerHeight)));
    };
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();                                          // 刷新后可能停在半路，先按当前滚动位置摆一次

    return () => {
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useFrame((state, delta) => {
    const mark = group.current;
    if (!mark) return;                    // 还没挂上，下一帧再说

    if (!ready.current) {
      ready.current = true;               // 画出第一帧 = 模型真的显示出来了
      onReady();                          // 告诉父组件可以把海报淡掉了
    }

    if (reduce.current) return;           // 开了「减少动态效果」就定住不动，只留静态姿态

    const dt = Math.min(delta, 0.05);     // 掉帧（切标签页回来）时 delta 会很大，夹住，免得模型瞬移
    const time = state.clock.elapsedTime;
    const mouse = pointer.current;
    const scrolled = scroll.current;

    // 鼠标视差 + 滚动转为缓慢自转 + 一点点呼吸摆动
    const targetRotY = mouse.x * 0.3 + scrolled * 1.15 + Math.sin(time * 0.35) * 0.035; // 0.3 最大偏 17°，1.15 rad ≈ 66° 随滚动转完
    const targetRotX = -mouse.y * 0.14 + scrolled * 0.1 + Math.sin(time * 0.27) * 0.02;  // 上下只给一点点，转多了会像翻跟头

    mark.rotation.y = THREE.MathUtils.damp(mark.rotation.y, targetRotY, 3.2, dt); // 3.2 是阻尼：越大跟得越快，越小越飘
    mark.rotation.x = THREE.MathUtils.damp(mark.rotation.x, targetRotX, 3.2, dt);

    // 「随滚动缩小」：窄屏（和全站 720px 断点一致）本来就小一圈，再乘上滚动的 18%
    const targetScale = (size.width < 720 ? 0.86 : 1) * (1 - scrolled * 0.18);
    mark.scale.setScalar(THREE.MathUtils.damp(mark.scale.x, targetScale, 3, dt));

    mark.position.y = Math.sin(time * 0.62) * 0.045;                        // 上下浮一点点，让静止画面也活着
    mark.position.x = THREE.MathUtils.damp(mark.position.x, mouse.x * 0.09, 3, dt); // 横向跟着鼠标挪一丝，制造纵深
  });

  // 卸载时把这份克隆出来的几何和材质还回去，不然来回切页面会一直涨显存
  useEffect(() => {
    return () => {
      model.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.geometry?.dispose?.();
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          mats.forEach((mm) => mm?.dispose?.());
        }
      });
    };
  }, [model]);

  return (
    <group ref={group}>
      <primitive object={model} />
    </group>
  );
}

// --- 相机 ---

/** 相机固定站在正前方看原点。和 Canvas 的 camera 参数写同一组数，
    是因为 Canvas 里那份只管建相机，这里再 lookAt 一次保证朝向对（父级容器不同，默认朝向会偏） */
function Rig() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 0.12, 5.4);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  return null;
}

// --- 组件本体 ---

export default function HeroMark({
  poster,
  posterAlt,
  noteLive,
  noteStatic,
}: {
  poster: string;
  posterAlt: string;
  noteLive: string;
  noteStatic: string;
}) {
  const [mode, setMode] = useState<Mode>('pending'); // 还没判断完，先按静态显示（海报本来就在）
  const [loaded, setLoaded] = useState(false);       // 模型真的画出第一帧了
  const [visible, setVisible] = useState(true);      // 在不在视口里
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canUseWebGL() || isLowEndDevice()) {
      setMode('static');   // 画不动：只留海报
      return;
    }
    setMode('live');       // 能画：挂上 Canvas
  }, []);

  // 离开视口就停帧，别在后台烧 GPU
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.01 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const isLive = mode === 'live'; // 实时画面真的该露出来了吗

  return (
    <div className="hero-mark" ref={wrap} data-mode={mode}>
      {/* 静态海报：一直躺在底下，实时画面真的画出第一帧之后才让位（data-hidden） */}
      <img
        className="hero-poster"
        src={poster}
        alt={posterAlt}
        width={1200}
        height={1200}
        decoding="async"
        fetchPriority="high"                 // 首屏要立刻看到的图，优先下载
        data-hidden={isLive && loaded ? 'true' : 'false'}
      />

      <div className="hero-canvas" data-visible={isLive && loaded ? 'true' : 'false'} aria-hidden="true">
        {isLive && (
          <Canvas
            camera={{ position: [0, 0.12, 5.4], fov: 34 }}   // 34° 是标识刚好占满 2.95 直径的距离
            dpr={[1, 1.7]}                                     // 上限 1.7：再高在高分屏上只是多烧 GPU，肉眼看不出
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }} // 透明底 + 抗锯齿 + 优先独显
            frameloop={visible ? 'always' : 'never'}            // 不在视口就停帧
            onCreated={({ gl }) => {
              gl.setClearAlpha(0);                              // 画布底色全透明，露出页面底色
              // 显卡上下文丢了（切显卡、显存被抢）就退回静态图，别留一块黑
              gl.domElement.addEventListener('webglcontextlost', (e) => {
                e.preventDefault();
                setMode('static');
              });
            }}
          >
            <Rig />
            {/* 三盏方向光：主光暖白打正面、侧后方橙色当补光、底下一点回光提亮暗部 */}
            <ambientLight intensity={0.72} />
            <directionalLight position={[3.4, 4.2, 5]} intensity={2.35} color="#fff6ea" />
            <directionalLight position={[-5.2, 1.4, -3.4]} intensity={1.05} color="#ffb08a" />
            <directionalLight position={[0, -3.4, 2.4]} intensity={0.45} color="#fff9f1" />
            {/* 模型是异步加载的：没到位之前什么都别画（海报还在上面顶着） */}
            <Suspense fallback={null}>
              <Mark onReady={() => setLoaded(true)} />
            </Suspense>
          </Canvas>
        )}
      </div>

      {/* 角上那行小字：实时 / 静态两套文案，读屏跳过 */}
      <span className="hero-note mono-sm" aria-hidden="true">
        {isLive && loaded ? noteLive : noteStatic}
      </span>
    </div>
  );
}
