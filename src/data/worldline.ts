/**
 * 世界线：站点上所有东西（终端、字体、地球、吉祥物）都是同一条时间线上的坐标。
 * 只写真实发生过的事；「设定」类内容会明确标注为设定。
 */
export interface Milestone {
  id: string;
  date: string;
  /** 世界线编号 */
  no: string;
  zh: { title: string; body: string; tag: string };
  en: { title: string; body: string; tag: string };
  yue: { title: string; body: string; tag: string };
}

export const worldline: Milestone[] = [
  {
    id: 'founding',
    date: '2026-11-04',
    no: '01',
    zh: {
      title: '公司注册',
      body: '韶关市武江区，一张营业执照，三条经营线：卫星通信终端、软件开发与系统集成、信息安全。',
      tag: '事实',
    },
    en: {
      title: 'Registered',
      body: 'Wujiang District, Shaoguan. One licence, three lines: satellite terminals, software integration, information security.',
      tag: 'Fact',
    },
    yue: {
      title: '公司註冊',
      body: '韶關市武江區，一張營業執照，三條經營線：衛星通訊終端、軟件開發同系統集成、資訊安全。',
      tag: '事實',
    },
  },
  {
    id: 'terminal',
    date: '2026-11-05',
    no: '02',
    zh: {
      title: '第一台终端样机',
      body: '外壳、板卡、天线都还在桌上。这一天开始有「硬件」这个说法，而不是只有代码。',
      tag: '事实',
    },
    en: {
      title: 'First terminal prototype',
      body: 'Enclosure, board and antenna still on the desk. From this day "hardware" became a real word here, not just code.',
      tag: 'Fact',
    },
    yue: {
      title: '第一台終端樣機',
      body: '外殼、板卡、天線都仲喺枱面。呢一日開始有「硬件」呢個講法，唔係淨係有代碼。',
      tag: '事實',
    },
  },
  {
    id: 'globe',
    date: '2026-11-05',
    no: '03',
    zh: {
      title: '地球被烘出来',
      body: '256 张天地图瓦片拼成一张球体贴图。写这篇日志的时候，贴图还躺在 /tmp 里。',
      tag: '事实',
    },
    en: {
      title: 'The globe is baked',
      body: '256 Tianditu tiles stitched into one sphere texture. When this log was written the file was still sitting in /tmp.',
      tag: 'Fact',
    },
    yue: {
      title: '地球烘好咗',
      body: '256 塊天地圖瓦片砌成一張球體貼圖。寫呢篇日誌嗰陣，貼圖仲擺喺 /tmp 度。',
      tag: '事實',
    },
  },
  {
    id: 'hiromi',
    date: '2026-11-04',
    no: '04',
    zh: {
      title: '寻美出现',
      body: '从标志那颗猫头派生出来的人形。先有母版，再有七个姿势——她是被设计出来的，不是被找到的。',
      tag: '设定',
    },
    en: {
      title: 'HIROMI appears',
      body: 'A person derived from the cat head in the mark. Master first, then seven poses — designed, not discovered.',
      tag: 'Design',
    },
    yue: {
      title: '尋美出現',
      body: '由標誌嗰個貓頭派生出嚟嘅人形。先有母版，再有七個姿勢——佢係設計出嚟嘅，唔係搵返嚟嘅。',
      tag: '設定',
    },
  },
  {
    id: 'site',
    date: '2026-11-06',
    no: '05',
    zh: {
      title: '这条世界线被写下来',
      body: '站点上线，日志开始。每篇日志都是这条线上的一个坐标，不是散落的技术笔记。',
      tag: '事实',
    },
    en: {
      title: 'The worldline is written down',
      body: 'The site goes live and the log begins. Every post is a coordinate on this line, not a loose technical note.',
      tag: 'Fact',
    },
    yue: {
      title: '呢條世界線被寫低',
      body: '網站上線，日誌開始。每篇日誌都係呢條線上面嘅一個座標，唔係散落嘅技術筆記。',
      tag: '事實',
    },
  },
];

/** 把一篇日志挂到世界线上：取不晚于它的最后一个里程碑 */
export function milestoneFor(date: string): Milestone {
  const sorted = [...worldline].sort((a, b) => a.date.localeCompare(b.date));
  let hit = sorted[0];
  for (const m of sorted) if (m.date <= date) hit = m;
  return hit;
}
