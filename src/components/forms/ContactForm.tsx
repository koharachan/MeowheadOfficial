import { useRef, useState } from 'react';

export interface FormCopy {
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
}

type Status = 'idle' | 'error' | 'done';

export default function ContactForm({
  copy,
  happyImage,
  happyAlt,
  companionImage,
}: {
  copy: FormCopy;
  happyImage: string;
  happyAlt: string;
  companionImage: string;
}) {
  const [status, setStatus] = useState<Status>('idle');
  const formRef = useRef<HTMLFormElement>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const message = String(data.get('message') ?? '').trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!name || !message || !emailOk) {
      setStatus('error');
      window.setTimeout(() => liveRef.current?.focus(), 30);
      return;
    }

    // 演示表单：不出网，不存数据
    setStatus('done');
  };

  const reset = () => {
    setStatus('idle');
    formRef.current?.reset();
    window.setTimeout(() => formRef.current?.querySelector<HTMLInputElement>('input')?.focus(), 30);
  };

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
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M4 12a8 8 0 1 0 3-6.2M4 4v5h5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <form className="form" ref={formRef} onSubmit={onSubmit} noValidate aria-describedby="form-note">
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
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M4 12h15M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </form>
  );
}
