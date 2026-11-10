import { useCallback, useEffect, useRef, useState } from 'react';

export const TIANDITU_KEY = 'ffd7ff4248c941cfdd6028f846d9405c';
const TARGET = { lon: 113.5575, lat: 24.748 };

/* 天地图三维地球（Cesium）懒加载：滚动到附近才开始下载，首屏不受影响 */
const CESIUM_VERSION = '1.126.0';
const CESIUM_CDNS = [
  'https://cdn.jsdelivr.net/npm/cesium@' + CESIUM_VERSION + '/Build/Cesium/',
  'https://unpkg.com/cesium@' + CESIUM_VERSION + '/Build/Cesium/',
  // 国内可达性差时的备选（目录结构不同，取不到会自动跳过）
  'https://cdn.staticfile.net/cesium/' + CESIUM_VERSION + '/',
  'https://lib.baomitu.com/cesium/' + CESIUM_VERSION + '/',
];

type Phase = 'poster' | 'live' | 'map';

declare global {
  interface Window {
    Cesium?: any;
    CESIUM_BASE_URL?: string;
    T?: any;
    TMAP_AUTHKEY?: string;
    __tmapPromise?: Promise<any>;
    __cesiumPromise?: Promise<any>;
  }
}

function injectScript(src: string, timeout = 25000): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('load error: ' + src));
    document.head.appendChild(s);
    window.setTimeout(() => reject(new Error('timeout: ' + src)), timeout);
  });
}

async function loadCesium(): Promise<any> {
  if (window.Cesium) return window.Cesium;
  if (window.__cesiumPromise) return window.__cesiumPromise;

  window.__cesiumPromise = (async () => {
    let lastErr: unknown = null;
    for (const base of CESIUM_CDNS) {
      try {
        window.CESIUM_BASE_URL = base;
        await injectScript(base + 'Cesium.js');
        if (window.Cesium) return window.Cesium;
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr ?? new Error('cesium unavailable');
  })();

  return window.__cesiumPromise;
}

function loadTianditu(): Promise<any> {
  if (window.T?.Map) return Promise.resolve(window.T);
  if (window.__tmapPromise) return window.__tmapPromise;
  window.__tmapPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://api.tianditu.gov.cn/api?v=4.0&tk=' + TIANDITU_KEY;
    s.async = true;
    s.onload = () => (window.T?.Map ? resolve(window.T) : reject(new Error('T missing')));
    s.onerror = () => reject(new Error('script error'));
    document.head.appendChild(s);
    window.setTimeout(() => (window.T?.Map ? resolve(window.T) : reject(new Error('timeout'))), 12000);
  });
  return window.__tmapPromise;
}

/** 天地图 WMTS 图层（影像 / 注记），Cesium 直接吃 */
function imageryProvider(Cesium: any, layer: 'img' | 'cia') {
  return new Cesium.WebMapTileServiceImageryProvider({
    url:
      'https://t{s}.tianditu.gov.cn/' +
      layer +
      '_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=' +
      layer +
      '&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&tk=' +
      TIANDITU_KEY,
    layer,
    style: 'default',
    format: 'tiles',
    tileMatrixSetID: 'w',
    subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
    tilingScheme: new Cesium.WebMercatorTilingScheme(),
    maximumLevel: 18,
    tileWidth: 256,
    tileHeight: 256,
  });
}

/** 相机的高度插值：22,000 km（整颗地球）→ 1.2 km（街区） */
const RANGE_FAR = 22_000_000;
const RANGE_NEAR = 1_200;

/** 放大在哪一格完成：0.55 之后是「最清晰段」的驻留区，球不再动。
    轨道全长 260vh，剩下 45% 约 72vh 的可滚行程留给这帧画面。 */
const ZOOM_END = 0.62;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const zoomOf = (p: number) => clamp01(p / ZOOM_END);

/** 手机/触屏：没有 hover、不能拖地图，这一屏就走「自动播放一遍放大」而不是滚动驱动 */
const isMobileView = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(max-width: 720px)').matches ||
    window.matchMedia('(hover: none) and (pointer: coarse)').matches);

export default function GlobeToMap({
  label,
  coordinates,
  fail,
  aria,
  attribution,
  scrollHint,
  scrollHintEnd,
}: {
  label: string;
  coordinates: string;
  fail: string;
  aria: string;
  /** 天地图审图号：法规要求随图标注 */
  attribution: string;
  /** 刚滚到这一屏时的提示：还能继续往下滑 */
  scrollHint: string;
  /** 已经压到最大缩放时的提示：上滑可以回看 */
  scrollHintEnd: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvasHost = useRef<HTMLDivElement>(null);
  const mapHost = useRef<HTMLDivElement>(null);
  const markerHost = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const [phase, setPhase] = useState<Phase>('poster');
  const [mapFailed, setMapFailed] = useState(false);
  const [pct, setPct] = useState(0);
  const pctRef = useRef(0);
  /** 手动缩放倍率：1 = 跟随滚动；点 +/− 会偏离，继续滚动时慢慢回归 */
  const bias = useRef(1);
  const mapRef = useRef<any>(null);
  const viewerRef = useRef<any>(null);

  /* ---------------- 滚动进度（桌面） ---------------- */
  useEffect(() => {
    if (isMobileView()) return;
    let raf = 0;
    const update = () => {
      const el = (wrap.current?.closest('.loc__track') as HTMLElement | null) ?? wrap.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = total > 0 ? clamp01(-rect.top / total) : 1;
      progress.current = p;
      const q = zoomOf(p);
      if (Math.abs(q - pctRef.current) > 0.004) {
        pctRef.current = q;
        setPct(q);
      }
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* ---------------- 手机端：进入视口后自动播一遍放大 ---------------- */
  useEffect(() => {
    if (!isMobileView()) return;
    const host = wrap.current;
    if (!host) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const DURATION = reduce ? 1 : 4200;
    let raf = 0;
    let t0 = 0;
    let started = false;

    const step = (now: number) => {
      if (!t0) t0 = now;
      const k = Math.min(1, (now - t0) / DURATION);
      // ease-in-out：前段慢慢离开整颗地球，后段稳稳落到街区
      const eased = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      progress.current = eased * ZOOM_END;
      const q = zoomOf(progress.current);
      if (Math.abs(q - pctRef.current) > 0.002) {
        pctRef.current = q;
        setPct(q);
      }
      if (k < 1) raf = requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || started) return;
        started = true;
        io.disconnect();
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.3 }
    );
    io.observe(host);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  /* ---------------- 三维地球（懒加载天地图 / Cesium） ---------------- */
  useEffect(() => {
    const host = canvasHost.current;
    if (!host) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let disposed = false;
    let viewer: any = null;
    let raf = 0;
    let visible = true;

    const start = async () => {
      try {
        const Cesium = await loadCesium();
        if (disposed || !canvasHost.current) return;

        viewer = new Cesium.Viewer(host, {
          baseLayer: false,
          animation: false,
          timeline: false,
          geocoder: false,
          homeButton: false,
          sceneModePicker: false,
          baseLayerPicker: false,
          navigationHelpButton: false,
          fullscreenButton: false,
          infoBox: false,
          selectionIndicator: false,
          vrButton: false,
          creditContainer: document.createElement('div'),
          contextOptions: { webgl: { alpha: true, antialias: true } },
        });

        const scene = viewer.scene;
        scene.skyBox.show = false;
        scene.sun.show = false;
        scene.moon.show = false;
        scene.globe.showGroundAtmosphere = false;
        scene.fog.enabled = false;
        scene.backgroundColor = Cesium.Color.TRANSPARENT;
        scene.globe.baseColor = Cesium.Color.fromCssColorString('#0e1a22');
        scene.screenSpaceCameraController.enableInputs = false;
        scene.screenSpaceCameraController.enableZoom = false;
        scene.screenSpaceCameraController.enableRotate = false;
        scene.screenSpaceCameraController.enableTilt = false;
        scene.screenSpaceCameraController.enableLook = false;
        viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
          Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
        );

        const img = viewer.imageryLayers.addImageryProvider(imageryProvider(Cesium, 'img'));
        const labels = viewer.imageryLayers.addImageryProvider(imageryProvider(Cesium, 'cia'));
        labels.alpha = 0.9;

        const target = Cesium.Cartesian3.fromDegrees(TARGET.lon, TARGET.lat, 0);
        const pin = viewer.entities.add({
          position: target,
          billboard: {
            image: '/img/map/tible-marker.png',
            width: 54,
            height: 54,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            scaleByDistance: new Cesium.NearFarScalar(2.0e4, 1.0, 4.0e5, 0.4),
          },
        });

        viewerRef.current = viewer;

        let range = RANGE_FAR;
        let pitch = Cesium.Math.toRadians(-90);

        // 只要有一批瓦片下载完就转正，不要等「全部加载完」
        let wentLive = false;
        const goLive = () => {
          if (wentLive || disposed) return;
          wentLive = true;
          setPhase((p) => (p === 'poster' ? 'live' : p));
        };
        viewer.scene.globe.tileLoadProgressEvent.addEventListener((n: number) => {
          if (n === 0) goLive();
        });
        window.setTimeout(goLive, 900);

        const io = new IntersectionObserver(
          ([e]) => {
            visible = e.isIntersecting;
            if (viewer) viewer.useDefaultRenderLoop = visible;
          },
          { rootMargin: '120px' }
        );
        io.observe(host);

        const ro = new ResizeObserver(() => viewer?.resize());
        ro.observe(host);

        let lastP = -1;
        const loop = () => {
          raf = requestAnimationFrame(loop);
          if (!viewer || disposed) return;

          const p = zoomOf(progress.current);
          // 手动缩放过之后，滚动继续时慢慢回到叙事轨道
          if (lastP >= 0 && Math.abs(p - lastP) > 0.004) bias.current += (1 - bias.current) * 0.06;
          lastP = p;

          // 前段几乎不动（看得清是整颗地球），后段才加速落下去
          const fall = Math.pow(p, 1.95);
          const eased = fall * fall * (3 - 2 * fall);
          const baseRange = RANGE_FAR * Math.pow(RANGE_NEAR / RANGE_FAR, fall * (reduce ? 0.7 : 1));
          const targetRange = Math.min(RANGE_FAR * 1.6, Math.max(180, baseRange * bias.current));
          const targetPitch = Cesium.Math.toRadians(-90 + 46 * fall);

          range += (targetRange - range) * 0.085;
          pitch += (targetPitch - pitch) * 0.085;

          viewer.camera.lookAt(target, new Cesium.HeadingPitchRange(0, pitch, range));
          pin.show = p > 0.42;
          labels.alpha = Math.min(1, Math.max(0, (p - 0.25) / 0.35)) * 0.92;
        };
        loop();

        // 首帧先摆好位置
        viewer.camera.lookAt(target, new Cesium.HeadingPitchRange(0, pitch, range));

        (window as any).__globeCleanup = () => {
          ro.disconnect();
          io.disconnect();
          cancelAnimationFrame(raf);
          try {
            viewer.destroy();
          } catch {
            /* ignore */
          }
        };
      } catch {
        if (disposed) return;
        setPhase('map');
      }
    };

    /* 距离视口 1200px 就开始加载：等用户滚到这一屏，瓦片基本已经就位 */
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          io.disconnect();
          start();
        }
      },
      { rootMargin: '1200px 0px' }
    );
    io.observe(host);

    return () => {
      disposed = true;
      io.disconnect();
      cancelAnimationFrame(raf);
      (window as any).__globeCleanup?.();
    };
  }, []);

  /* ---------------- 兜底：天地图 2D 地图 ---------------- */
  useEffect(() => {
    if (phase !== 'map') return;
    const host = mapHost.current;
    if (!host || host.dataset.ready) return;

    let map: any = null;
    let cancelled = false;

    loadTianditu()
      .then((T) => {
        if (cancelled || !host) return;
        host.dataset.ready = '1';
        map = new T.Map(host);
        mapRef.current = map;
        map.centerAndZoom(new T.LngLat(TARGET.lon, TARGET.lat), 16);
        const hybrid = (window as any).TMAP_HYBRID_MAP;
        if (hybrid !== undefined) map.setMapType(hybrid);
        map.disableDrag(false);
        map.enableScrollWheelZoom(false);
        map.enableDoubleClickZoom(true);

        const updateMarker = () => {
          const el = markerHost.current;
          if (!el || !map) return;
          try {
            const pt = map.lngLatToContainerPoint(new T.LngLat(TARGET.lon, TARGET.lat));
            el.style.transform = 'translate(' + (pt.x - 32) + 'px,' + (pt.y - 64) + 'px)';
          } catch {
            /* ignore */
          }
        };
        updateMarker();
        map.addEventListener?.('moveend', updateMarker);
        map.addEventListener?.('zoomend', updateMarker);
        window.setTimeout(updateMarker, 600);
      })
      .catch(() => {
        if (!cancelled) setMapFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [phase]);

  const zoom = useCallback((dir: 1 | -1) => {
    if (phase === 'map' && mapRef.current) {
      if (dir > 0) mapRef.current.zoomIn?.();
      else mapRef.current.zoomOut?.();
      return;
    }
    const next = bias.current * (dir > 0 ? 0.5 : 2);
    bias.current = Math.min(6, Math.max(0.02, next));
  }, [phase]);

  const onOpenFull = useCallback(() => {
    window.open(
      'https://map.tianditu.gov.cn/?lng=' + TARGET.lon + '&lat=' + TARGET.lat + '&zoom=16&type=3d',
      '_blank',
      'noopener'
    );
  }, []);

  return (
    <div className="globe" ref={wrap} data-phase={phase}>
      <div className="globe__stage">
        <div className="globe__orbit" aria-hidden="true" />
        <div className="globe__globe" ref={canvasHost} data-phase={phase} />
        <div className="globe__map" ref={mapHost} data-show={phase === 'map' ? 'true' : 'false'} aria-label={aria} role="img" />
        <div className="globe__mapmarker" ref={markerHost} data-show={phase === 'map' && !mapFailed ? 'true' : 'false'} aria-hidden="true">
          <img src="/img/map/tible-marker.png" alt="" width={64} height={64} loading="lazy" decoding="async" />
        </div>

        <img
          className="globe__poster"
          src="/img/globe/globe-poster.webp"
          alt=""
          width={720}
          height={720}
          aria-hidden="true"
          data-show={phase === 'poster' ? 'true' : 'false'}
          style={{ transform: 'translate(-50%, -50%) scale(' + (1 + pct * 2.1).toFixed(3) + ')' }}
        />

        <p className="globe__loading mono" data-show={phase === 'poster' ? 'true' : 'false'}>
          正在载入三维地球
        </p>

        {/* 出场就告诉人这一屏可以滑：不提示没人知道地图会跟着滚 */}
        <p className="globe__hint" data-done={pct > 0.92 ? 'true' : 'false'}>
          <span>{pct > 0.92 ? scrollHintEnd : scrollHint}</span>
          <svg
            viewBox="0 0 24 24"
            width="12"
            height="12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M12 5v14M6 13l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </p>

        {mapFailed && (
          <p className="globe__fail" role="status">
            {fail}
          </p>
        )}

        <div className="globe__hud">
          <span className="mono globe__hud-label">{label}</span>
          <span className="mono globe__hud-coords">{coordinates}</span>
          <span className="mono globe__hud-pct">{String(Math.round(pct * 100)).padStart(3, '0')}</span>
          <span className="mono globe__hud-attr">{attribution}</span>
        </div>

        <div className="globe__zoom" data-show={phase === 'poster' ? 'false' : 'true'}>
          <button type="button" className="globe__zoom-btn" onClick={() => zoom(1)} aria-label="放大">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </button>
          <button type="button" className="globe__zoom-btn" onClick={() => zoom(-1)} aria-label="缩小">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M5 12h14" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <button type="button" className="globe__open" onClick={onOpenFull} data-show={phase === 'poster' ? 'false' : 'true'}>
          {label}
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M7 17L17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
