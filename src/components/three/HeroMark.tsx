import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/* 首屏标识：实时 WebGL。降级由父组件负责，这里只处理“能跑”的情况。      */
/* ------------------------------------------------------------------ */

type Mode = 'pending' | 'live' | 'static';

function markWebGL() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch {
    return false;
  }
}

function isLowEnd() {
  const nav = navigator as Navigator & { deviceMemory?: number; hardwareConcurrency?: number };
  const mem = nav.deviceMemory;
  const cores = nav.hardwareConcurrency;
  if (typeof mem === 'number' && mem > 0 && mem <= 2) return true;
  if (typeof cores === 'number' && cores > 0 && cores <= 2) return true;
  return false;
}

function preparModel(scene: THREE.Group) {
  const root = scene.clone(true);

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.frustumCulled = true;

    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((mat) => {
      const m = mat as THREE.MeshStandardMaterial;
      if (!m) return;
      // 用同一套「纸感哑光 + 一点高光」的参数覆盖 Blender 导出的默认值
      m.roughness = 0.46;
      m.metalness = 0.0;
      m.envMapIntensity = 0.9;
      if ('flatShading' in m) m.flatShading = false;
      m.needsUpdate = true;
    });
  });

  // 自动居中 + 适配视口，不依赖 Blender 里的作者坐标
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const wrapper = new THREE.Group();
  root.position.sub(center);
  wrapper.add(root);

  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const s = 2.95 / maxDim;
  wrapper.scale.setScalar(s);

  return wrapper;
}

function Mark({ onReady }: { onReady: () => void }) {
  const { scene } = useGLTF('/models/logo_3d.glb', false, true);
  const group = useRef<THREE.Group>(null);
  const ready = useRef(false);
  const { size } = useThree();

  const model = useMemo(() => preparModel(scene as unknown as THREE.Group), [scene]);

  const pointer = useRef({ x: 0, y: 0 });
  const scroll = useRef(0);
  const reduce = useRef(false);

  useEffect(() => {
    reduce.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const onPointer = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onScroll = () => {
      scroll.current = Math.min(1, Math.max(0, window.scrollY / Math.max(1, window.innerHeight)));
    };
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;

    if (!ready.current) {
      ready.current = true;
      onReady();
    }

    if (reduce.current) return;

    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const p = pointer.current;
    const sc = scroll.current;

    // 鼠标视差 + 滚动转为缓慢自转，「随滚动缩小」
    const targetRotY = p.x * 0.3 + sc * 1.15 + Math.sin(t * 0.35) * 0.035;
    const targetRotX = -p.y * 0.14 + sc * 0.1 + Math.sin(t * 0.27) * 0.02;

    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, targetRotY, 3.2, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, targetRotX, 3.2, dt);

    const targetScale = (size.width < 720 ? 0.86 : 1) * (1 - sc * 0.18);
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, targetScale, 3, dt));

    g.position.y = Math.sin(t * 0.62) * 0.045;
    g.position.x = THREE.MathUtils.damp(g.position.x, p.x * 0.09, 3, dt);
  });

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

function Rig() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 0.12, 5.4);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  return null;
}

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
  const [mode, setMode] = useState<Mode>('pending');
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(true);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!markWebGL() || isLowEnd()) {
      setMode('static');
      return;
    }
    setMode('live');
  }, []);

  // 离开视口就停帧，别在后台烧 GPU
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.01 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const isLive = mode === 'live';

  return (
    <div className="hero-mark" ref={wrap} data-mode={mode}>
      <img
        className="hero-poster"
        src={poster}
        alt={posterAlt}
        width={1200}
        height={1200}
        decoding="async"
        fetchPriority="high"
        data-hidden={isLive && loaded ? 'true' : 'false'}
      />

      <div className="hero-canvas" data-visible={isLive && loaded ? 'true' : 'false'} aria-hidden="true">
        {isLive && (
          <Canvas
            camera={{ position: [0, 0.12, 5.4], fov: 34 }}
            dpr={[1, 1.7]}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
            frameloop={visible ? 'always' : 'never'}
            onCreated={({ gl }) => {
              gl.setClearAlpha(0);
              gl.domElement.addEventListener('webglcontextlost', (e) => {
                e.preventDefault();
                setMode('static');
              });
            }}
          >
            <Rig />
            <ambientLight intensity={0.72} />
            <directionalLight position={[3.4, 4.2, 5]} intensity={2.35} color="#fff6ea" />
            <directionalLight position={[-5.2, 1.4, -3.4]} intensity={1.05} color="#ffb08a" />
            <directionalLight position={[0, -3.4, 2.4]} intensity={0.45} color="#fff9f1" />
            <Suspense fallback={null}>
              <Mark onReady={() => setLoaded(true)} />
            </Suspense>
          </Canvas>
        )}
      </div>

      <span className="hero-note mono-sm" aria-hidden="true">
        {isLive && loaded ? noteLive : noteStatic}
      </span>
    </div>
  );
}
