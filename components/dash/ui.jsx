'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

export const DashCtx = createContext(null);
export const useDash = () => useContext(DashCtx);
 
export const Tog = ({ on, set, disabled }) => (
  <button type="button" role="switch" aria-checked={!!on} disabled={disabled} className={'tog' + (on ? ' on' : '')} onClick={() => set(!on)}><i /></button>
);

export const Modal = ({ t, x, children, wide, foot }) => (
  <div className="ov" onClick={x}>
    <div className={'mod' + (wide ? ' wide' : '')} onClick={(e) => e.stopPropagation()}>
      <div className="mh"><b>{t}</b><button type="button" className="btn sm" onClick={x}>إغلاق</button></div>
      <div className="mb">{children}</div>
      {foot && <div className="mf">{foot}</div>}
    </div>
  </div>
);

export const Field = ({ l, hint, children, full }) => (
  <label className={'fld' + (full ? ' full' : '')}>
    {l && <span>{l}</span>}
    {children}
    {hint && <em className="hint">{hint}</em>}
  </label>
);

export const PageHead = ({ title, sub, children }) => (
  <div className="phd">
    <h1>{title}{sub ? <small>{sub}</small> : null}</h1>
    <div className="phr">{children}</div>
  </div>
);

export const Empty = ({ icon = '📭', t, d, children }) => (
  <div className="empty"><span>{icon}</span><b>{t}</b>{d && <p>{d}</p>}{children}</div>
);

export const Badge = ({ c = '#718096', children }) => (
  <span className="bdg" style={{ color: c, background: `color-mix(in srgb, ${c} 14%, transparent)` }}>{children}</span>
);

export const Stat = ({ label, value, hint, color, children }) => (
  <div className="card kpi">
    <small>{label}</small>
    <b style={color ? { color } : undefined}>{value}</b>
    {hint && <em className="hint">{hint}</em>}
    {children}
  </div>
);

export const Spin = () => <div className="spin" aria-label="loading" />;

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map(([k, t, n]) => (
        <button key={k} type="button" role="tab" aria-selected={value === k} className={'tb' + (value === k ? ' act' : '')} onClick={() => onChange(k)}>
          {t}{n !== undefined && n !== null ? <em>{n}</em> : null}
        </button>
      ))}
    </div>
  );
}

export function CopyBtn({ text, label = 'نسخ', className = 'btn sm' }) {
  const { say } = useDash();
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setOk(true); say('تم النسخ'); setTimeout(() => setOk(false), 1500); } catch { say('تعذر النسخ'); }
      }}
    >
      {ok ? '✓ تم' : label}
    </button>
  );
}

export function useDebounced(v, ms = 250) {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}

export function Pager({ total, page, per, onPage }) {
  const pages = Math.max(1, Math.ceil(total / per));
  if (pages <= 1) return null;
  return (
    <div className="pager">
      <button type="button" className="btn sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>السابق</button>
      <span className="num">{page} / {pages}</span>
      <button type="button" className="btn sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>التالي</button>
    </div>
  );
}
