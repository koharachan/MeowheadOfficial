/**
 * 单一真源：所有文案的结构定义。
 * zh / en 两份字典必须实现同一个 interface —— 缺键在 tsc 阶段就会报错。
 */
export type Lang = 'zh' | 'en' | 'yue' | 'ja';

export interface LangLink {
  code: Lang;
  /** 切换器上显示的短标签 */
  label: string;
  /** 无障碍用的完整名称 */
  name: string;
}

export interface Link {
  label: string;
  href: string;
}

export interface Spec {
  k: string;
  v: string;
}

export interface CapabilityItem {
  code: string;
  title: string;
  summary: string;
  bullets: string[];
}

export interface ProcessStep {
  no: string;
  title: string;
  body: string;
  deliverable: string;
}

export interface RingItem {
  code: string;
  title: string;
  body: string;
}

export interface WhyItem {
  no: string;
  title: string;
  body: string;
}

export interface MascotState {
  id: 'idle' | 'wave' | 'think' | 'happy' | 'sleep' | 'oops';
  label: string;
  image: string;
  note: string;
}

export interface MascotPage {
  meta: { title: string; description: string };
  chapters: { id: string; no: string; label: string; short: string }[];
  hero: {
    kicker: string;
    name: string;
    roman: string;
    tagline: string;
    intro: string[];
    portraitAlt: string;
    back: string;
  };
  file: { label: string; title: string; rows: Spec[] };
  personality: { label: string; title: string; items: WhyItem[] };
  expressions: { label: string; title: string; lede: string; items: { id: string; name: string; note: string }[] };
  usage: { label: string; title: string; lede: string; items: { code: string; title: string; body: string }[] };
  stanza: { label: string; lines: string[] };
  design: { label: string; title: string; paragraphs: string[]; notes: Spec[] };
  companion: { label: string; title: string; body: string[]; traits: Spec[]; alt: string };
  play: { label: string; title: string; hint: string; lines: string[]; reset: string };
  cta: { title: string; body: string; button: Link };
}

export interface Dict {
  lang: Lang;
  htmlLang: string;
  ogLocale: string;
  path: { home: string; mascot: string; blog: string; downloads: string; legacy: string };
  downloads: {
    label: string;
    title: string;
    lede: string;
    note: string;
    action: string;
    items: { name: string; href: string; format: string; size: string; note: string }[];
    licenseTitle: string;
    license: string[];
  };
  blog: {
    label: string;
    title: string;
    lede: string;
    readUnit: string;
    toc: string;
    more: string;
    top: string;
    license: string;
    back: string;
    all: string;
    home: string;
    note: string;
  };
  meta: {
    title: string;
    description: string;
    keywords: string;
    ogAlt: string;
  };
  brand: {
    name: string;
    nameFull: string;
    roman: string;
    logoAlt: string;
    claim: string;
  };
  nav: {
    links: Link[];
    cta: Link;
    menu: string;
    close: string;
  };
  /** 语言切换器里的三档（每种语言都是同一份） */
  langs: LangLink[];
  langSwitch: { label: string; short: string; href: string };
  ux: {
    skip: string;
    loading: string;
    loadingDone: string;
    scroll: string;
    close: string;
    sectionNav: string;
    peek: { bubble: string; cta: string };
  };
  chapters: { id: string; no: string; label: string; short: string }[];
  splash: { boot: string };
  hero: {
    kicker: string;
    lines: string[];
    lede: string;
    primary: Link;
    secondary: Link;
    /** 首屏按钮下的小字（可空） */
    tagline: string;
    specs: Spec[];
    caption: string;
    posterAlt: string;
    sceneNote: string;
    sceneNoteFallback: string;
  };
  claim: {
    no: string;
    label: string;
    lines: string[];
    body: string[];
    notes: Spec[];
  };
  capability: {
    no: string;
    label: string;
    title: string;
    lede: string;
    items: CapabilityItem[];
    footnote: string;
  };
  method: {
    no: string;
    label: string;
    title: string;
    lede: string;
    rings: RingItem[];
    note: string;
  };
  mascot: {
    no: string;
    label: string;
    title: string;
    body: string[];
    cta: Link;
    alt: string;
    states: MascotState[];
    companion: {
      name: string;
      roman: string;
      body: string;
      alt: string;
      image: string;
      label: string;
    };
  };
  why: {
    no: string;
    label: string;
    title: string;
    items: WhyItem[];
  };
  process: {
    no: string;
    label: string;
    title: string;
    lede: string;
    steps: ProcessStep[];
    deliverableLabel: string;
  };
  team: {
    no: string;
    label: string;
    title: string;
    lede: string;
    members: { no: string; role: string; name: string; handle: string; href: string; duty: string; avatar: string; origin: string; email: string }[];
    note: string;
  };
  location: {
    no: string;
    label: string;
    title: string;
    lede: string;
    hint: string;
    /** 天地图审图号（法定必须标注） */
    attribution: string;
    chips: Spec[];
    caption: string;
    fail: string;
    aria: string;
    coordinates: string;
  };
  contact: {
    no: string;
    label: string;
    title: string;
    lede: string;
    facts: Spec[];
    map: { label: string; caption: string; fail: string; aria: string; coordinates: string };
    form: {
      legend: string;
      name: string;
      org: string;
      email: string;
      topic: string;
      topics: string[];
      message: string;
      submit: string;
      note: string;
      successTitle: string;
      successBody: string;
      resetLabel: string;
      error: string;
      placeholder: { name: string; org: string; email: string; message: string };
    };
  };
  footer: {
    tagline: string;
    icp: string;
    icpHref: string;
    /** 公安备案（占位） */
    police: string;
    policeHref: string;
    copyright: string;
    note: string;
    columns: { title: string; links: Link[] }[];
  };
  teapot: {
    label: string;
    title: string;
    lines: string[];
    stamp: string;
    hint: string;
    pour: string;
    home: Link;
    mascot: Link;
  };
  forbidden: {
    label: string;
    titleCn: string;
    /** 日本 IP 分支（404/403 的地区差异） */
    titleJp: string;
    titleGlobal: string;
    bodyCn: string;
    bodyJp: string;
    bodyGlobal: string;
    home: Link;
    mascot: Link;
    note: string;
    regionNote: string;
  };
  notFound: {
    code: string;
    title: string;
    body: string;
    home: Link;
    mascot: Link;
    alt: string;
  };
  mascotPage: MascotPage;
}
