/*
联系表单：首页 #contact 那一屏的表单本体，也是全站唯一一处「用户输入」的边界。

  - 输入只在这里检查一次：称呼 / 正文去掉首尾空格后不能为空，邮箱要长得像邮箱。
    不合格就在表单下方那行说一句原因，并把焦点送过去，让读屏念出来。
  - 静态站没有后端，合格后就拼一条 mailto: 交给用户自己的邮件客户端——这是最诚实的一条路。
  - 发出后整块换成「收到啦」那一屏，带一个回到空白表单的按钮。

在 Astro 里调用（client:visible = 滚到这一屏才加载 React）：

  <ContactForm
    client:visible
    copy={c.form}                               // 所有文案都在这里，组件里不写死中文
    happyImage="/img/mascot/hiromi-happy.webp"  // 成功页那张大图
    happyAlt={t.mascot.alt}
    companionImage="/img/mascot/tible-happy.webp" // 成功页角上那只小的
  />

要换收件地址只改 CONTACT_EMAIL 一处。
*/
import { useRef, useState } from 'react';

/** 真实收件地址（静态站没有后端，表单走 mailto） */
export const CONTACT_EMAIL = 'xy@6832.me';

/** 表单上所有看得见的字，全部由页面从字典传进来 */
export interface FormCopy {
  legend: string;   // 表单的标题
  name: string;     // 「称呼」这个词
  org: string;      // 「公司 / 团队」
  email: string;    // 「邮箱」
  topic: string;    // 「想聊什么」的下拉标题
  topics: string[]; // 下拉里可选的几项
  message: string;  // 「正文」
  submit: string;   // 提交按钮上的字
  note: string;     // 提交按钮下面那行小字（隐私说明之类）
  successTitle: string; // 成功页大标题
  successBody: string;  // 成功页正文
  resetLabel: string;   // 「再写一封」按钮
  error: string;        // 表单填错时那行提示
  placeholder: { name: string; org: string; email: string; message: string }; // 四个占位提示
}

/** idle = 还没提交、error = 填错了、done = 已经交给邮件客户端 */
type Status = 'idle' | 'error' | 'done';

export default function ContactForm({
  copy,
  happyImage,
  happyAlt,
  companionImage,
}: {
  copy: FormCopy;
  happyImage: string; // 成功页的大图
  happyAlt: string;   // 大图的替代文字
  companionImage: string; // 成功页角上那只小的，纯装饰
}) {
  const [status, setStatus] = useState<Status>('idle');   // 现在处于哪个阶段
  const formRef = useRef<HTMLFormElement>(null);          // 表单本体，重置和找回焦点要用
  const liveRef = useRef<HTMLParagraphElement>(null);     // 下面那行提示，填错时把焦点送到它身上

  // --- 提交：先检查，再拼一条 mailto ---
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();                                  // 静态站没有接口可提交，先拦住浏览器的默认行为
    const form = e.currentTarget;
    const data = new FormData(form);                     // 一次性把三个输入框和下拉都读出来
    const name = String(data.get('name') ?? '').trim();  // 先去首尾空格，只填空格也能识破
    const email = String(data.get('email') ?? '').trim();// 邮箱同样先去空格
    const message = String(data.get('message') ?? '').trim(); // 正文同样
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); // 只查「有本地部分、有 @、有带点的域名」

    if (!name || !message || !emailOk) {
      setStatus('error');                                // 换成错误状态，提示那行会变成原因
      window.setTimeout(() => liveRef.current?.focus(), 30); // 等 React 把节点换完再聚焦，否则聚到旧节点上
      return;                                            // 不合规就到这儿，不往下拼邮件
    }

    // 真表单：组装 mailto，打开用户邮件客户端（静态站没有后端，这是最诚实的一条路）
    const org = String(data.get('org') ?? '').trim();
    const topic = String(data.get('topic') ?? '').trim();
    const subject = '[官网咨询] ' + (topic || '项目') + ' · ' + name; // 主题行：[官网咨询] 话题 · 称呼
    // 正文按「称呼 / 公司 / 邮箱 / 想聊什么 / 空行 / 正文 / 落款」排；没填的行留空，最后统一滤掉
    const body = [
      '称呼：' + name,
      org ? '公司 / 团队：' + org : '',
      '邮箱：' + email,
      topic ? '想聊什么：' + topic : '',
      '',
      message,
      '',
      '—— 来自官网联系表单',
    ]
      .filter(Boolean)  // 没填的可选项连同空行一起丢掉，别留一堆「公司：」
      .join('\n');      // 邮件正文按行断开

    const href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    window.location.href = href;   // 交给系统默认邮件客户端
    setStatus('done');             // 这个页面立刻换成成功页（客户端打开了就算完成）
  };

  // --- 再写一封：回到空白表单 ---
  const reset = () => {
    setStatus('idle');            // 先退出成功页
    formRef.current?.reset();     // 清掉所有输入
    window.setTimeout(() => formRef.current?.querySelector<HTMLInputElement>('input')?.focus(), 30); // 等表单挂回来再聚焦第一个框
  };

  // --- 成功页 ---
  if (status === 'done') {
    return (
      <div className="form-done" role="status">
        <div className="form-done__figures">
          <img className="form-done__hero" src={happyImage} alt={happyAlt} width={420} height={420} loading="lazy" decoding="async" />
          <img className="form-done__tible" src={companionImage} alt="" aria-hidden="true" width={72} height={72} loading="lazy" decoding="async" />
        </div>
        <h3 className="h3">{copy.successTitle}</h3>
        <p className="body-text">{copy.successBody}</p>
        <button type="button" className="form-reset" onClick={reset}>
          {copy.resetLabel}
          {/* 回来那个拐弯箭头，手画的两根线，不引图标库 */}
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M4 12a8 8 0 1 0 3-6.2M4 4v5h5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    );
  }

  // --- 表单 ---
  return (
    <form className="form" ref={formRef} onSubmit={onSubmit} noValidate aria-describedby="form-note">
      {/* noValidate：浏览器自带的报错是英文且样式不可控，检查全在 onSubmit 里自己做；aria-describedby 让读屏把下面那行提示连到表单上 */}
      <div className="form__grid">
        <label className="field">
          <span className="field__label mono-sm">{copy.name}</span>
          <input name="name" type="text" autoComplete="name" placeholder={copy.placeholder.name} required />
        </label>

        <label className="field">
          <span className="field__label mono-sm">{copy.org}</span>
          <input name="org" type="text" autoComplete="organization" placeholder={copy.placeholder.org} />
        </label>

        <label className="field">
          <span className="field__label mono-sm">{copy.email}</span>
          <input name="email" type="email" autoComplete="email" placeholder={copy.placeholder.email} required inputMode="email" />
        </label>

        <label className="field">
          <span className="field__label mono-sm">{copy.topic}</span>
          <div className="field__select">
            <select name="topic" defaultValue={copy.topics[0]}>
              {copy.topics.map((tp) => (
                <option key={tp} value={tp}>
                  {tp}
                </option>
              ))}
            </select>
          </div>
        </label>

        <label className="field field--wide">
          <span className="field__label mono-sm">{copy.message}</span>
          <textarea name="message" rows={3} placeholder={copy.placeholder.message} required />
        </label>
      </div>

      {/* 平时是隐私说明，填错时换成原因；tabIndex=-1 让它能用脚本聚焦，但不会插进 Tab 顺序 */}
      <p
        className="form__live"
        id="form-note"
        ref={liveRef}
        tabIndex={-1}
        aria-live="polite"
        data-status={status}
      >
        {status === 'error' ? copy.error : copy.note}
      </p>

      <button className="form__submit" type="submit">
        <span>{copy.submit}</span>
        {/* 提交箭头，同样手画，靠 stroke 跟文字同色 */}
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M4 12h15M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </form>
  );
}
