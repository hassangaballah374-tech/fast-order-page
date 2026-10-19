'use client';
import React, { useEffect, useState } from 'react';
import { useDash, CopyBtn } from './ui';

/* مربع رابط مع نسخ وفتح */
export function LinkBox({ url }) {
  if (!url) return <span className="mut">—</span>;
  return (
    <div className="lnk">
      <code>{url}</code>
      <CopyBtn text={url} />
      <a className="btn sm" href={url} target="_blank" rel="noreferrer">فتح</a>
    </div>
  );
}

/* مسودة قسم من إعدادات المتجر مع حفظ في store_config */
export function useSection(section) {
  const { cfg, saveCfg, say } = useDash();
  const [draft, setDraft] = useState(cfg[section] || {});
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setDraft(cfg[section] || {}); setDirty(false); }, [cfg[section]]);
  const set = (k, v) => { setDraft((d) => ({ ...d, [k]: v })); setDirty(true); };
  const save = async (validate) => {
    const msg = validate ? validate(draft) : '';
    if (msg) { say(msg); return false; }
    setBusy(true);
    const ok = await saveCfg(section, draft);
    setBusy(false);
    if (ok) { setDirty(false); say('✅ تم الحفظ وسيظهر في المتجر فوراً'); }
    return ok;
  };
  return { draft, set, save, dirty, busy, setDraft };
}

export function SaveBtn({ s, validate }) {
  return (
    <button type="button" className="btn p" disabled={!s.dirty || s.busy} onClick={() => s.save(validate)}>
      {s.busy ? 'جاري الحفظ...' : s.dirty ? 'حفظ التغييرات' : 'محفوظ ✓'}
    </button>
  );
}

/* اختيار عدة منتجات (للكروس سيل) */
export function MultiProductPick({ products, value, onChange, exclude = [], max = 12 }) {
  const ids = (Array.isArray(value) ? value : []).map(String);
  const avail = products.filter((p) => !ids.includes(String(p.id)) && !exclude.includes(String(p.id)) && (p.status || 'active') === 'active');
  return (
    <div>
      <div className="chips" style={{ marginBottom: 8 }}>
        {ids.map((id) => {
          const p = products.find((x) => String(x.id) === id);
          return (
            <span key={id} className="chip act" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
              {p ? p.title : id}
              <button type="button" style={{ border: 0, background: 'none', color: 'inherit', cursor: 'pointer' }} onClick={() => onChange(ids.filter((x) => x !== id))}>✕</button>
            </span>
          );
        })}
        {!ids.length && <span className="mut">لم يتم اختيار منتجات بعد</span>}
      </div>
      <select className="in" value="" onChange={(e) => { if (e.target.value && ids.length < max) onChange([...ids, e.target.value]); }}>
        <option value="">+ إضافة منتج</option>
        {avail.map((p) => <option key={p.id} value={String(p.id)}>{p.title}</option>)}
      </select>
    </div>
  );
}

export const asNumber = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
