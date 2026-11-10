/*
这一屏「从太空一路推到街区」的地球 / 地图（#globe，挂在 Location.astro 的 sticky 长轨道下面）：
  - 桌面：页面往下滚多少，Cesium 三维地球就从 22,000 km 拉到 1.2 km，
    同时把球慢慢压平成俯视角度，最后停在街区上空
  - 手机 / 触屏：没有 hover、不能拖，也没有长轨道，改成「滚进视口自动播一遍放大」
  - 三维地球起不来（没有 WebGL、瓦片全挂）：整块换成天地图 2D 地图，画面不空着
  - 两条驱动方式写的是同一份 storyProgress，地球那边的每帧循环只读它，
    所以相机逻辑只写一份，桌面和手机不用各写一套

在 Astro 页面里这样调用（client:visible = 滚到附近才开始下载 Cesium，首屏不为它付流量）：

  <GlobeToMap
    client:visible
    label={l.hint}                  // 叠在画面上的地名，也用在「打开大地图」按钮上
    coordinates={l.coordinates}     // 经纬度文字，只显示，不参与计算
    fail={l.fail}                   // 三维和 2D 都失败时的兜底文案
    aria={l.aria}                   // 2D 地图那一层的读屏说明
    attribution={l.attribution}     // 天地图审图号，法规要求随图标注
    scrollHint={l.scrollHint}       // 刚滚到这一屏的提示：还能继续往下滑
    scrollHintEnd={l.scrollHintEnd} // 已经拉到底时的提示：上滑可以回看
  />

页面侧只依赖两件事：
  - 外层 .loc__track 提供可滚长度（240vh），本组件读它的高度算进度；
    没有这层轨道时退回自己的高度，手机端就是这样
  - 样式全在 styles/islands.css 的 .globe* 里，这里只负责 data-phase / data-show 两个开关
*/
import { useCallback, useEffect, useRef, useState } from 'react';

// --- 对准哪儿、用谁的地图 ---

/** 天地图的公开 tk。只用来拉影像和注记瓦片，写错整块画面就是空的；换 key 只改这一处 */
export const TIANDITU_KEY = 'ffd7ff4248c941cfdd6028f846d9405c';

/** 地图对准的那一个点。三维地球、2D 地图、「打开大地图」三处共用，改坐标只改这里 */
const PLACE = { lon: 113.5575, lat: 24.748 };

/* 天地图和 Cesium 都是运行时才下载的：滚到这一屏附近才注入 script。
   下面这一串是「候选下载地址」，从上往下试，第一个装上的算数 */
const CESIUM_VERSION = '1.126.0'; // 版本锁死：瓦片地址和 API 都按这一版写，跟着升级要重测
const CESIUM_CDNS = [
  'https://cdn.jsdelivr.net/npm/cesium@' + CESIUM_VERSION + '/Build/Cesium/', // 常用 CDN，国内一般能通
  'https://unpkg.com/cesium@' + CESIUM_VERSION + '/Build/Cesium/',            // jsdelivr 挂掉时换它
  // 国内可达性差时的备选（目录结构不同，取不到会自动跳过）
  'https://cdn.staticfile.net/cesium/' + CESIUM_VERSION + '/',
  'https://lib.baomitu.com/cesium/' + CESIUM_VERSION + '/',
];

/** 现在演的是哪一帧：poster = 静态海报、live = 三维地球、map = 2D 兜底地图 */
type Phase = 'poster' | 'live' | 'map';

/* Cesium 和天地图的脚本会往 window 上挂全局；这里一并声明，免得满文件 as any。
   两个 __xxxPromise 是「正在加载」的记号：几个人同时进来，只下载一份脚本 */
declare global {
  interface Window {
    Cesium?: any;                 // 三维引擎本体，脚本装完就有
    CESIUM_BASE_URL?: string;     // 告诉 Cesium 去哪儿取 Web Worker 和贴图
    T?: any;                      // 天地图 2D 地图的 API
    TMAP_AUTHKEY?: string;        // 天地图脚本自己会写，这里只占位
    __tmapPromise?: Promise<any>; // 天地图正在加载的 Promise
    __cesiumPromise?: Promise<any>; // Cesium 正在加载的 Promise
  }
}

// --- 把外部脚本一个个装进来 ---

/** 插一个 <script> 进来：加载成功就 resolve，出错或超时就 reject（超时兜底 25 秒，弱网也不至于挂住） */
function injectScript(src: string, timeout = 25000): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;                                          // 要下载的地址
    s.async = true;                                       // 异步插，不挡页面渲染
    s.onload = () => resolve();                           // 下载并执行完 = 成功
    s.onerror = () => reject(new Error('load error: ' + src)); // 网络 / 404
    document.head.appendChild(s);                         // 插进 head 就自动开始下载
    window.setTimeout(() => reject(new Error('timeout: ' + src)), timeout); // 卡住不动时兜底
  });
}

/** 加载 Cesium：装过就直接用，正在装就等同一个 Promise，没装过才去挨个试 CDN */
async function loadCesium(): Promise<any> {
  if (window.Cesium) return window.Cesium;              // 已经装好了
  if (window.__cesiumPromise) return window.__cesiumPromise; // 别人正在装，等它就行

  window.__cesiumPromise = (async () => {
    let lastErr: unknown = null;                        // 留最后一个错误，全挂了时报它
    for (const base of CESIUM_CDNS) {
      try {
        window.CESIUM_BASE_URL = base;                  // Cesium 从这儿找它的 worker 和图片
        await injectScript(base + 'Cesium.js');         // 真正下载引擎
        if (window.Cesium) return window.Cesium;        // 装上了就用这一份
      } catch (e) {
        lastErr = e;                                    // 这个地址不行，换下一个
      }
    }
    throw lastErr ?? new Error('cesium unavailable');    // 四个地址全失败才抛
  })();

  return window.__cesiumPromise;
}

/** 加载天地图 2D API（只在三维地球失败时才走这一条） */
function loadTianditu(): Promise<any> {
  if (window.T?.Map) return Promise.resolve(window.T);  // 已经装好了
  if (window.__tmapPromise) return window.__tmapPromise; // 别人正在装，共用一份
  window.__tmapPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://api.tianditu.gov.cn/api?v=4.0&tk=' + TIANDITU_KEY; // 带 key 的那一条地址
    s.async = true;
    s.onload = () => (window.T?.Map ? resolve(window.T) : reject(new Error('T missing'))); // 装完还得真有 Map 才算成功
    s.onerror = () => reject(new Error('script error'));
    document.head.appendChild(s);
    // 12 秒还没就绪就判失败：这段是兜底画面，宁可早点换文案也别一直空着
    window.setTimeout(() => (window.T?.Map ? resolve(window.T) : reject(new Error('timeout'))), 12000);
  });
  return window.__tmapPromise;
}

/** 天地图 WMTS 图层（影像 img / 注记 cia），直接喂给 Cesium 当底图 */
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
    tileMatrixSetID: 'w',                                        // w = Web 墨卡托，和下面的 tilingScheme 必须一致
    subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],        // 天地图分了 8 个子域，浏览器能并行多拉几条
    tilingScheme: new Cesium.WebMercatorTilingScheme(),          // 天地图用的是墨卡托切片，换成地理坐标系会整体错位
    maximumLevel: 18,                                            // 天地图最深到 18 级，再往上请求只会 404 出灰块
    tileWidth: 256,
    tileHeight: 256,
  });
}

// --- 相机行程的几个刻度 ---

/** 相机高度：22,000 km 是「整颗地球刚好占满画面」，1.2 km 是「街区」。
    两个数决定放大的幅度，改之前先看画面里地球是不是出框或者糊成一片 */
const RANGE_FAR = 22_000_000; // 单位米，所以 22,000 km
const RANGE_NEAR = 1_200;     // 1.2 km，比街区高一点，刚好能认出路口

/** 放大在哪一格完成：0.62 之后球不再动。
    可滚行程 = 240vh 的轨道 − 100vh 的视口 = 140vh，滚过 62%（约 87vh）就拉到底，
    剩下 38%（约 53vh）留给「最清晰段」驻留：让人看清街区，也来得及往回滑。 */
const ZOOM_END = 0.62;

/** 把任意数夹回 0~1 */
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** 滚动进度 → 放大进度：0.62 之后一直是 1，球就停住不动了 */
const zoomOf = (p: number) => clamp01(p / ZOOM_END);

// --- 手机 / 触屏 ---

/** 手机或触屏：没有 hover、手指拖不动球，这一屏就走「自动播一遍」而不是滚动驱动。
    断点和样式里一致（720px / 无 hover 的粗指针），否则会出现「样式按手机排、逻辑按桌面算」 */
const isMobileView = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(max-width: 720px)').matches ||
    window.matchMedia('(hover: none) and (pointer: coarse)').matches);

// --- 组件本体 ---

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
  const wrap = useRef<HTMLDivElement>(null);          // 整块画面，也是算滚动的锚点
  const canvasHost = useRef<HTMLDivElement>(null);    // 三维地球挂进来的那个 div
  const mapHost = useRef<HTMLDivElement>(null);       // 2D 兜底地图挂进来的那个 div
  const markerHost = useRef<HTMLDivElement>(null);    // 2D 地图上那颗自己画的针
  const storyProgress = useRef(0);                    // 叙事进度 0~1：桌面由滚动写、手机由自动播放写，地球每帧读它
  const [phase, setPhase] = useState<Phase>('poster');
  const [mapFailed, setMapFailed] = useState(false);  // 2D 地图也失败了：改成显示兜底文案
  const [zoomProgress, setZoomProgress] = useState(0); // 放大进度 0~1，只用于 HUD 数字和海报缩放
  const zoomProgressRef = useRef(0);                   // 上一帧的放大进度，用来判断「值不值得重渲染」
  /** 手动缩放倍率：1 = 跟随滚动；点 +/− 会偏离，继续滚动时慢慢回归 */
  const manualZoom = useRef(1);
  const mapRef = useRef<any>(null);                   // 天地图 2D 实例，± 按钮要转发给它
  const viewerRef = useRef<any>(null);                // Cesium 实例

  // --- 滚动进度（桌面）：页面滚多少，故事就走到哪儿 ---
  useEffect(() => {
    if (isMobileView()) return;            // 手机端没有长轨道，交给下面那段自动播放
    let raf = 0;                           // 合并高频滚动：一帧只算一次
    const update = () => {
      const track = (wrap.current?.closest('.loc__track') as HTMLElement | null) ?? wrap.current; // 滚动长度由外层长轨道给
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;                    // 还能滚多远 = 轨道高 − 一屏
      const scrolled = travel > 0 ? clamp01(-rect.top / travel) : 1;      // 滚过的比例：轨道顶贴视口顶是 0，走完整个行程是 1
      storyProgress.current = scrolled;
      const level = zoomOf(scrolled);                                     // 折算成 0~1 的放大进度
      // 0.004 以内不动 state：滚动事件一秒几十次，每次都 setState 会一路掉帧
      if (Math.abs(level - zoomProgressRef.current) > 0.004) {
        zoomProgressRef.current = level;
        setZoomProgress(level);
      }
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);           // 上一帧没跑就丢掉，只留最新这次
      raf = requestAnimationFrame(update);
    };
    update();                                                 // 先按当前滚动位置摆一次（刷新后停在半路也能对上）
    window.addEventListener('scroll', onScroll, { passive: true }); // 被动监听，不挡滚动流畅度
    window.addEventListener('resize', onScroll);              // 窗口变了，「还能滚多远」也变了
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // --- 手机端：滚进视口后自动播一遍放大 ---
  // 它和上面那段写的是同一个 storyProgress，所以地球那边的相机逻辑完全不用分叉
  useEffect(() => {
    if (!isMobileView()) return;                                  // 桌面端由滚动驱动，这段不管
    const host = wrap.current;
    if (!host) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const DURATION = reduce ? 1 : 4200;   // 4.2 秒正好「不催也不拖」；开了「减少动态效果」就 1ms 直接落到终点
    let raf = 0;
    let startedAt = 0;
    let started = false;                  // 只播一次：来回滚动不重播

    const tick = (now: number) => {
      if (!startedAt) startedAt = now;                  // 第一帧记下起点时间
      const done = Math.min(1, (now - startedAt) / DURATION); // 播到百分之几了
      // ease-in-out：前段慢慢离开整颗地球，后段稳稳落到街区
      const eased = done < 0.5 ? 2 * done * done : 1 - Math.pow(-2 * done + 2, 2) / 2;
      storyProgress.current = eased * ZOOM_END;         // 只写到 ZOOM_END：再往后是驻留区，自动播不该滚过头
      const level = zoomOf(storyProgress.current);
      if (Math.abs(level - zoomProgressRef.current) > 0.002) { // 阈值更小，手机上没有滚动事件，这点开销感觉不到
        zoomProgressRef.current = level;
        setZoomProgress(level);
      }
      if (done < 1) raf = requestAnimationFrame(tick);   // 没播完就继续
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || started) return;        // 没进视口，或者已经播过了
        started = true;
        io.disconnect();                                 // 播过就不必再观察
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.3 }                                 // 露出三成才算「看到了」，一露头就播会被人错过
    );
    io.observe(host);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  // --- 三维地球：懒加载 Cesium，然后每帧按 storyProgress 摆相机 ---
  useEffect(() => {
    const host = canvasHost.current;
    if (!host) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let disposed = false;   // 组件已经卸载：异步回来的东西一律不再碰
    let viewer: any = null; // Cesium 的 Viewer
    let raf = 0;            // 每帧循环的句柄
    let visible = true;     // 在不在视口里

    const start = async () => {
      try {
        const Cesium = await loadCesium();                  // 装引擎（可能已经装好了）
        if (disposed || !canvasHost.current) return;        // 等下载的这会儿组件可能已经没了

        /* 关掉所有自带控件：这一屏只要画面。creditContainer 给法规要求的版权信息一个去处，
           但要塞进一个不显示的空 div，不能让默认的白色小条压在地图上 */
        viewer = new Cesium.Viewer(host, {
          baseLayer: false,           // 底图自己加（天地图），不要 Cesium 默认的那份
          animation: false,           // 时间轴播放器
          timeline: false,            // 时间轴
          geocoder: false,            // 地址搜索框
          homeButton: false,          // 复位按钮
          sceneModePicker: false,     // 2D/3D 切换
          baseLayerPicker: false,     // 底图选择
          navigationHelpButton: false,// 操作提示
          fullscreenButton: false,    // 全屏按钮
          infoBox: false,             // 点图元弹出的信息框
          selectionIndicator: false,  // 选中图元的光圈
          vrButton: false,            // VR 按钮
          creditContainer: document.createElement('div'), // 版权信息装进一个脱离文档的 div
          contextOptions: { webgl: { alpha: true, antialias: true } }, // 要透明背景（露出页面底色）+ 抗锯齿
        });

        /* 只留地球本身：星空、太阳、月亮、大气、雾全部关掉，画面才干净，
           不然深色底上会浮出一层光晕，和页面的奶白/墨绿对不上 */
        const scene = viewer.scene;
        scene.skyBox.show = false;
        scene.sun.show = false;
        scene.moon.show = false;
        scene.globe.showGroundAtmosphere = false;
        scene.fog.enabled = false;
        scene.backgroundColor = Cesium.Color.TRANSPARENT;              // 没地球的地方全透明
        scene.globe.baseColor = Cesium.Color.fromCssColorString('#0e1a22'); // 瓦片没下完时露出的球体底色，取页面深色

        // 屏幕上的鼠标 / 手指全都不接管：滚动才是唯一输入，否则手指一碰画布页面就滚不动了
        scene.screenSpaceCameraController.enableInputs = false;
        scene.screenSpaceCameraController.enableZoom = false;
        scene.screenSpaceCameraController.enableRotate = false;
        scene.screenSpaceCameraController.enableTilt = false;
        scene.screenSpaceCameraController.enableLook = false;
        viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
          Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK    // 双击也不要（会跳镜头）
        );

        const img = viewer.imageryLayers.addImageryProvider(imageryProvider(Cesium, 'img'));       // 卫星影像
        const labels = viewer.imageryLayers.addImageryProvider(imageryProvider(Cesium, 'cia'));    // 地名注记
        labels.alpha = 0.9; // 先给个默认透明度，下面每帧会按放大进度覆盖它

        const target = Cesium.Cartesian3.fromDegrees(PLACE.lon, PLACE.lat, 0); // 一直盯着这个点
        const pin = viewer.entities.add({
          position: target,
          billboard: {
            image: '/img/map/tible-marker.png',                          // 和 2D 地图用的是同一张针
            width: 54,
            height: 54,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,                // 让针尖而不是图中心落在坐标上
            disableDepthTestDistance: Number.POSITIVE_INFINITY,          // 永远画在地球前面，不被球面挡住
            scaleByDistance: new Cesium.NearFarScalar(2.0e4, 1.0, 4.0e5, 0.4), // 近了原大、远了缩到 0.4，免得远看糊成一坨
          },
        });

        viewerRef.current = viewer;

        let cameraRange = RANGE_FAR;                    // 相机高度（米），每帧朝目标插值
        let pitch = Cesium.Math.toRadians(-90);         // 俯角：-90° = 正上方俯视

        // 只要有一批瓦片下载完就转正，不要等「全部加载完」——等全部会一直停在海报上
        let wentLive = false;
        const goLive = () => {
          if (wentLive || disposed) return;             // 只切一次
          wentLive = true;
          setPhase((p) => (p === 'poster' ? 'live' : p)); // 已经在 live/map 就别往回退
        };
        viewer.scene.globe.tileLoadProgressEvent.addEventListener((n: number) => {
          if (n === 0) goLive();                        // 这一屏的瓦片下完了
        });
        window.setTimeout(goLive, 900);                 // 兜底：弱网下瓦片一直排队，900ms 后也先切过去

        // 离开视口就停渲染（useDefaultRenderLoop），别在看不见的地方空烧 GPU
        const io = new IntersectionObserver(
          ([e]) => {
            visible = e.isIntersecting;
            if (viewer) viewer.useDefaultRenderLoop = visible;
          },
          { rootMargin: '120px' }                       // 提前 120px 开回来，滚到时不至于先黑一下
        );
        io.observe(host);

        // 容器尺寸变了要通知 Cesium，否则画面会被拉变形
        const ro = new ResizeObserver(() => viewer?.resize());
        ro.observe(host);

        let lastLevel = -1;                             // 上一帧的放大进度，用来判断「用户还在滚吗」
        const loop = () => {
          raf = requestAnimationFrame(loop);
          if (!viewer || disposed) return;

          const level = zoomOf(storyProgress.current);  // 故事走到哪儿（滚动和自动播放都写在这里）
          // 手动缩放过之后，滚动继续时慢慢回到叙事轨道：0.06 = 每帧靠回 6%，约一秒归位
          if (lastLevel >= 0 && Math.abs(level - lastLevel) > 0.004) manualZoom.current += (1 - manualZoom.current) * 0.06;
          lastLevel = level;

          // 1.95 次幂：前段几乎不动（看得清是整颗地球），后段才加速落下去。指数越大越「先磨后冲」
          const fall = Math.pow(level, 1.95);
          // 相机高度沿指数插值（摄影里的对数距离感）：RANGE_FAR × (NEAR/FAR)^fall
          // 开了「减少动态效果」只走 70% 的行程，不至于从太空一头砸下来
          const baseRange = RANGE_FAR * Math.pow(RANGE_NEAR / RANGE_FAR, fall * (reduce ? 0.7 : 1));
          // 手动缩放叠在上面；夹在 180m ~ 那么远之间——再远会看到球外面，再近会钻进地面
          const targetRange = Math.min(RANGE_FAR * 1.6, Math.max(180, baseRange * manualZoom.current));
          // 俯角从正上方 -90° 压到 -44°：留一点角度才看得出球面的立体感
          const targetPitch = Cesium.Math.toRadians(-90 + 46 * fall);

          // 每帧追 8.5%：直接赋值会随滚动一格一格跳，这样才是匀速滑过去
          cameraRange += (targetRange - cameraRange) * 0.085;
          pitch += (targetPitch - pitch) * 0.085;

          viewer.camera.lookAt(target, new Cesium.HeadingPitchRange(0, pitch, cameraRange));
          // 42% 之前地球还太大，针会糊成一团，等球拉近了再出现
          pin.show = level > 0.42;
          // 注记从 25% 开始淡入、到 60% 完全显示；乘 0.92 是为了不糊住影像
          labels.alpha = Math.min(1, Math.max(0, (level - 0.25) / 0.35)) * 0.92;
        };
        loop();

        // 首帧先摆好位置
        viewer.camera.lookAt(target, new Cesium.HeadingPitchRange(0, pitch, cameraRange));

        // 卸载时统一从这里收尾：监听器、循环、Viewer 都要断干净，不然换页面后 WebGL 上下文会泄漏
        (window as any).__globeCleanup = () => {
          ro.disconnect();
          io.disconnect();
          cancelAnimationFrame(raf);
          try {
            viewer.destroy();
          } catch {
            /* 已经销毁过了，忽略 */
          }
        };
      } catch {
        if (disposed) return;
        setPhase('map');   // 引擎起不来：整块换成 2D 地图，画面不空着
      }
    };

    /* 距离视口 1200px 就开始加载：等用户滚到这一屏，瓦片基本已经就位 */
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          io.disconnect();   // 只加载一次
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

  // --- 兜底：天地图 2D 地图（三维地球起不来时顶上） ---
  useEffect(() => {
    if (phase !== 'map') return;                          // 只有切到 map 才建
    const host = mapHost.current;
    if (!host || host.dataset.ready) return;              // 建过就不再建，天地图的实例不会自己清

    let map: any = null;
    let cancelled = false;                                // 组件先走了就别再动 DOM

    loadTianditu()
      .then((T) => {
        if (cancelled || !host) return;
        host.dataset.ready = '1';                         // 打上记号，防止重复建图
        map = new T.Map(host);
        mapRef.current = map;
        map.centerAndZoom(new T.LngLat(PLACE.lon, PLACE.lat), 16); // 16 级大约是街区尺度，和三维地球的落点接得上
        const hybrid = (window as any).TMAP_HYBRID_MAP;   // 混合图（影像 + 注记）的类型常量，天地图没导出类型，只能从 window 上取
        if (hybrid !== undefined) map.setMapType(hybrid);
        map.disableDrag(false);                          // 允许拖动
        map.enableScrollWheelZoom(false);                // 滚轮仍然滚页面，不然滚到这张图上就滚不动了
        map.enableDoubleClickZoom(true);

        // 自己画的那颗针跟着地图走：图片 64×64，所以水平减半宽、竖直减整高，针尖才落在坐标上
        const updateMarker = () => {
          const el = markerHost.current;
          if (!el || !map) return;
          try {
            const pt = map.lngLatToContainerPoint(new T.LngLat(PLACE.lon, PLACE.lat));
            el.style.transform = 'translate(' + (pt.x - 32) + 'px,' + (pt.y - 64) + 'px)';
          } catch {
            /* 地图还没排版好，等下一次事件 */
          }
        };
        updateMarker();
        map.addEventListener?.('moveend', updateMarker);  // 拖完重新摆
        map.addEventListener?.('zoomend', updateMarker);  // 缩完重新摆
        window.setTimeout(updateMarker, 600);             // 首帧地图还在排版，600ms 后再校一次
      })
      .catch(() => {
        if (!cancelled) setMapFailed(true);               // 2D 也挂了：交给下面的兜底文案
      });

    return () => {
      cancelled = true;
    };
  }, [phase]);

  // --- 两个按钮 ---

  /** ± 按钮：2D 地图阶段转发给天地图；三维阶段改手动倍率（0.5 = 放大一倍，2 = 缩小一半） */
  const stepZoom = useCallback((dir: 1 | -1) => {
    if (phase === 'map' && mapRef.current) {
      if (dir > 0) mapRef.current.zoomIn?.();    // 天地图自己管级别
      else mapRef.current.zoomOut?.();
      return;
    }
    const next = manualZoom.current * (dir > 0 ? 0.5 : 2);         // 一档就是翻倍 / 减半
    manualZoom.current = Math.min(6, Math.max(0.02, next));        // 夹住范围，点太多也不至于飞出太阳系
  }, [phase]);

  /** 打开天地图官网的同一点位：zoom=16 和 type=3d 跟这一屏的落点保持一致 */
  const onOpenFull = useCallback(() => {
    window.open(
      'https://map.tianditu.gov.cn/?lng=' + PLACE.lon + '&lat=' + PLACE.lat + '&zoom=16&type=3d',
      '_blank',
      'noopener'
    );
  }, []);

  return (
    <div className="globe" ref={wrap} data-phase={phase}>
      <div className="globe__stage">
        {/* 地球外面那一圈装饰轨道，纯装饰 */}
        <div className="globe__orbit" aria-hidden="true" />
        {/* 三维地球画布挂在这里 */}
        <div className="globe__globe" ref={canvasHost} data-phase={phase} />
        {/* 2D 兜底地图：data-show 才决定露不露 */}
        <div className="globe__map" ref={mapHost} data-show={phase === 'map' ? 'true' : 'false'} aria-label={aria} role="img" />
        {/* 2D 地图上的针：地图失败时一起收起来，免得只剩一颗针浮着 */}
        <div className="globe__mapmarker" ref={markerHost} data-show={phase === 'map' && !mapFailed ? 'true' : 'false'} aria-hidden="true">
          <img src="/img/map/tible-marker.png" alt="" width={64} height={64} loading="lazy" decoding="async" />
        </div>

        {/* 静态海报：Cesium 下载好之前先看它，跟着放大进度一起放大 2.1 倍，
            让静态帧和三维地球的推近感连得上（1 + 2.1 = 最多 3.1 倍） */}
        <img
          className="globe__poster"
          src="/img/globe/globe-poster.webp"
          alt=""
          width={720}
          height={720}
          aria-hidden="true"
          data-show={phase === 'poster' ? 'true' : 'false'}
          style={{ transform: 'translate(-50%, -50%) scale(' + (1 + zoomProgress * 2.1).toFixed(3) + ')' }}
        />

        <p className="globe__loading mono" data-show={phase === 'poster' ? 'true' : 'false'}>
          正在载入三维地球
        </p>

        {/* 出场就告诉人这一屏可以滑：不提示没人知道地图会跟着滚。
            滚到 92% 之后换第二句提示语（再往下就是驻留区了） */}
        <p className="globe__hint" data-done={zoomProgress > 0.92 ? 'true' : 'false'}>
          <span>{zoomProgress > 0.92 ? scrollHintEnd : scrollHint}</span>
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

        {/* 右下角那一块读数：地名、经纬度、放大百分比（补足 3 位，数字宽度不跳）、审图号 */}
        <div className="globe__hud">
          <span className="mono globe__hud-label">{label}</span>
          <span className="mono globe__hud-coords">{coordinates}</span>
          <span className="mono globe__hud-pct">{String(Math.round(zoomProgress * 100)).padStart(3, '0')}</span>
          <span className="mono globe__hud-attr">{attribution}</span>
        </div>

        {/* ± 按钮：手机端由样式收掉（那里是自动播放，不需要手动缩） */}
        <div className="globe__zoom" data-show={phase === 'poster' ? 'false' : 'true'}>
          <button type="button" className="globe__zoom-btn" onClick={() => stepZoom(1)} aria-label="放大">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </button>
          <button type="button" className="globe__zoom-btn" onClick={() => stepZoom(-1)} aria-label="缩小">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M5 12h14" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* 「打开大地图」：去天地图官网看这一点的 3D 地图 */}
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
