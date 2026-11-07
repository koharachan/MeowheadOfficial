/**
 * 世界线：站点上所有东西都在同一条时间线上。
 * 全部为公司真实节点（由负责人提供），不写「设定」以外的虚构事件。
 */
export interface Milestone {
  id: string;
  date: string;
  /** 世界线编号 */
  no: string;
  /** 可选的对外链接 */
  href?: string;
  zh: { title: string; body: string; tag: string };
  en: { title: string; body: string; tag: string };
  yue: { title: string; body: string; tag: string };
}

export const worldline: Milestone[] = [
  {
    id: 'surface',
    date: '2021-01-01',
    no: '01',
    zh: { title: '地表开发组', body: '猫猫头的前身：一个小型开发组，做 Minecraft 服务器与周边的工具。', tag: '事实' },
    en: { title: 'The Surface dev group', body: 'The ancestor of Meowhead: a small dev group building Minecraft servers and tooling.', tag: 'Fact' },
    yue: { title: '地表開發組', body: '貓貓頭嘅前身：一個細型開發組，做 Minecraft 伺服器同周邊工具。', tag: '事實' },
  },
  {
    id: 'domain',
    date: '2025-03-16',
    no: '02',
    zh: { title: 'meowhead.cn 注册', body: '名字先落地，业务后来才跟上。', tag: '事实' },
    en: { title: 'meowhead.cn registered', body: 'The name landed first; the business followed.', tag: 'Fact' },
    yue: { title: 'meowhead.cn 註冊', body: '個名落咗地先，業務後來先跟上。', tag: '事實' },
  },
  {
    id: 'group',
    date: '2025-04-29',
    no: '03',
    zh: {
      title: '猫猫头正式公开',
      body: '重庆三握云网络科技有限公司成立；猫猫头作为该公司的一个开发组（部门），在这一天正式公开存在。',
      tag: '事实',
    },
    en: {
      title: 'Meowhead goes public',
      body: 'Chongqing Sanwoyun Network Technology is founded. From this day Meowhead exists publicly as a dev group — a department inside that company.',
      tag: 'Fact',
    },
    yue: {
      title: '貓貓頭正式公開',
      body: '重慶三握雲網絡科技有限公司成立；貓貓頭作為該公司嘅一個開發組（部門），喺呢一日正式公開存在。',
      tag: '事實',
    },
  },
  {
    id: 'merge',
    date: '2025-05-01',
    no: '04',
    zh: { title: '合并地表开发组', body: '两条线并成一条：地表开发组并入猫猫头。', tag: '事实' },
    en: { title: 'The two lines merge', body: 'Surface folded into Meowhead. One team instead of two.', tag: 'Fact' },
    yue: { title: '合併地表開發組', body: '兩條線併成一條：地表開發組併入貓貓頭。', tag: '事實' },
  },
  {
    id: 'meowchan',
    date: '2025-05-02',
    no: '05',
    href: 'https://cnb.cool/Meowhead/MeowChan',
    zh: { title: '发布猫猫酱大模型架构', body: '第一版自研大模型架构对外发布，仓库公开在 CNB。', tag: '事实' },
    en: { title: 'MeowChan architecture released', body: 'The first in-house model architecture goes public, repo hosted on CNB.', tag: 'Fact' },
    yue: { title: '發佈貓貓醬大模型架構', body: '第一版自研大模型架構對外發佈，倉庫公開喺 CNB。', tag: '事實' },
  },
  {
    id: 'earthon',
    date: '2026-05-07',
    no: '06',
    zh: { title: '地球 Online PE 通过审核', body: '网易《我的世界》地球 Online PE 网络游戏服务器入驻申请通过审核。', tag: '事实' },
    en: { title: 'Earth Online PE approved', body: 'The Minecraft Earth Online PE server application passes NetEase review.', tag: 'Fact' },
    yue: { title: '地球 Online PE 通過審核', body: '網易《我的世界》地球 Online PE 網絡遊戲伺服器入駐申請通過審核。', tag: '事實' },
  },
  {
    id: 'incorporation',
    date: '2026-11-04',
    no: '07',
    zh: {
      title: '拿到营业执照',
      body: '猫猫头网络科技（广东）有限公司成立：由三握云的一个部门分拆独立，成为独立法人。',
      tag: '事实',
    },
    en: {
      title: 'Incorporated',
      body: 'Maomaotou Network Technology (Guangdong) is registered — spun out of a department at Sanwoyun into a separate company.',
      tag: 'Fact',
    },
    yue: {
      title: '攞到營業執照',
      body: '貓貓頭網絡科技（廣東）有限公司成立：由三握雲一個部門分拆獨立，成為獨立法人。',
      tag: '事實',
    },
  },
  {
    id: 'globe',
    date: '2026-11-05',
    no: '08',
    zh: { title: '地球被烘出来', body: '256 张天地图瓦片拼成一张球体贴图，用在这一版官网上。', tag: '事实' },
    en: { title: 'The globe is baked', body: '256 Tianditu tiles stitched into a sphere texture, used on this site.', tag: 'Fact' },
    yue: { title: '地球烘好咗', body: '256 塊天地圖瓦片砌成一張球體貼圖，用喺呢一版官網。', tag: '事實' },
  },
  {
    id: 'site',
    date: '2026-11-06',
    no: '09',
    zh: { title: '官网与日志上线', body: '站点上线，工程记录开始公开写。', tag: '事实' },
    en: { title: 'Site and log go live', body: 'The site ships and the engineering log starts in public.', tag: 'Fact' },
    yue: { title: '官網同日誌上線', body: '網站上線，工程記錄開始公開寫。', tag: '事實' },
  },
];

/** 把一篇日志挂到世界线上：取不晚于它的最后一个里程碑 */
export function milestoneFor(date: string): Milestone {
  const sorted = [...worldline].sort((a, b) => a.date.localeCompare(b.date));
  let hit = sorted[0];
  for (const m of sorted) if (m.date <= date) hit = m;
  return hit;
}
