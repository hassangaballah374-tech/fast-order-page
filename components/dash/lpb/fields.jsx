'use client';
import React from 'react';
import { Field, Tog } from '../ui';
import { ImageInput } from '../forms';
import { FONTS_ALL } from '../../../lib/themes100';
import { SECTION_DEFS, STYLE_DEFAULT, BG_OPTS, PAD_OPTS, ALIGN_OPTS, WIDTH_OPTS, ANIM_OPTS } from '../../../lib/lpSections';

/* حقل واحد حسب نوعه */
export function Inp({ f, v, set }) {
  const [k, , type, opts] = f;
  if (type === 'area') return <textarea className="in ta" rows={3} value={v ?? ''} onChange={(e) => set(k, e.target.value)} />;
  if (type === 'img') return <ImageInput value={v || ''} onChange={(x) => set(k, x)} folder="landing" />;
  if (type === 'tog') return <div className="tgrow"><Tog on={v !== false && !!v} set={(x) => set(k, x)} /></div>;
  if (type === 'num') return <input className="in num" type="number" value={v ?? ''} onChange={(e) => set(k, e.target.value === '' ? '' : Number(e.target.value))} />;
  if (type === 'ltr') return <input className="in num" dir="ltr" value={v ?? ''} onChange={(e) => set(k, e.target.value)} />;
  if (type === 'sel') return <select className="in" value={v ?? ''} onChange={(e) => set(k, e.target.value)}>{opts.map((o) => <option key={o[0]} value={o[0]}>{o[1]}</option>)}</select>;
  return <input className="in" value={v ?? ''} onChange={(e) => set(k, e.target.value)} />;
}

const wide = (f) => f[2] === 'area' || f[2] === 'img';

/* محتوى القسم: الحقول + القوائم + الصور */
export function SectionFields({ s, onChange }) {
  const T = SECTION_DEFS[s.type];
  if (!T) return <div className="mut">نوع قسم غير معروف</div>;
  const d = s.data || {};
  const set = (k, v) => onChange({ ...s, data: { ...d, [k]: v } });
  const items = T.list ? (d[T.list.k] || []) : [];
  const setItem = (i, k, v) => set(T.list.k, items.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const moveItem = (i, dir) => { const b = [...items]; const j = i + dir; if (j < 0 || j >= b.length) return; [b[i], b[j]] = [b[j], b[i]]; set(T.list.k, b); };
  const imgs = T.imgs ? (d[T.imgs] || []) : [];
  return (
    <div>
      <div className="fgrid">
        {T.f.map((f) => <Field key={f[0]} l={f[1]} full={wide(f)}><Inp f={f} v={d[f[0]]} set={set} /></Field>)}
      </div>
      {T.list && (
        <div style={{ marginTop: 10 }}>
          {items.map((it, i) => (
            <div key={i} className="card" style={{ marginBottom: 8, padding: 10 }}>
              <div className="fgrid">{T.list.f.map((f) => <Field key={f[0]} l={f[1]} full={wide(f)}><Inp f={f} v={it[f[0]]} set={(k, v) => setItem(i, k, v)} /></Field>)}</div>
              <div className="row" style={{ gap: 6, marginTop: 6 }}>
                <button type="button" className="btn sm" onClick={() => moveItem(i, -1)} disabled={i === 0}>↑</button>
                <button type="button" className="btn sm" onClick={() => moveItem(i, 1)} disabled={i === items.length - 1}>↓</button>
                <button type="button" className="btn sm dng" onClick={() => set(T.list.k, items.filter((_, j) => j !== i))}>حذف</button>
              </div>
            </div>
          ))}
          <button type="button" className="btn sm" onClick={() => set(T.list.k, [...items, { ...T.list.blank }])}>+ إضافة {T.list.add}</button>
        </div>
      )}
      {T.imgs && (
        <div style={{ marginTop: 10 }}>
          <div className="mut" style={{ marginBottom: 6 }}>اتركه فارغاً لعرض صور المنتج تلقائياً</div>
          {imgs.map((u, i) => (
            <div key={i} className="row" style={{ marginBottom: 6 }}>
              <div style={{ flex: 1 }}><ImageInput value={u} onChange={(x) => set(T.imgs, imgs.map((y, j) => (j === i ? x : y)))} folder="landing" /></div>
              <button type="button" className="btn sm dng" onClick={() => set(T.imgs, imgs.filter((_, j) => j !== i))}>حذف</button>
            </div>
          ))}
          <button type="button" className="btn sm" onClick={() => set(T.imgs, [...imgs, ''])}>+ صورة</button>
        </div>
      )}
    </div>
  );
}

/* صف بعنوان (div وليس label عشان الأزرار ما تتفعلش بالغلط) */
const Row = ({ l, children }) => (
  <div className="fld full"><span>{l}</span>{children}</div>
);

/* أزرار اختيار (chips) */
function Chips({ v, set, opts }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {opts.map(([k, l]) => (
        <button key={k} type="button" className={`btn sm ${(v ?? '') === k ? 'p' : ''}`} onClick={() => set(k)}>{l}</button>
      ))}
    </div>
  );
}

/* اختيار لون مع زر مسح */
function ColorIn({ v, set, fallback = '#0a7f86', clearable }) {
  const ok = /^#[0-9a-fA-F]{6}$/.test(v || '');
  return (
    <div className="row" style={{ gap: 8, alignItems: 'center' }}>
      <input type="color" value={ok ? v : fallback} onChange={(e) => set(e.target.value)} style={{ width: 44, height: 34, padding: 0, border: 0, background: 'none', cursor: 'pointer' }} />
      <input className="in num" dir="ltr" style={{ flex: 1 }} value={v || ''} placeholder="تلقائي" onChange={(e) => set(e.target.value)} />
      {clearable && v ? <button type="button" className="btn sm" onClick={() => set('')}>مسح</button> : null}
    </div>
  );
}

/* شكل القسم: خلفية، لون، مسافات، محاذاة، عرض، حركة، إخفاء */
export function StyleForm({ s, onChange }) {
  const st = { ...STYLE_DEFAULT, ...(s.style || {}) };
  const set = (k, v) => onChange({ ...s, style: { ...st, [k]: v } });
  return (
    <div className="fgrid">
      <Row l="الخلفية"><Chips v={st.bg} set={(v) => set('bg', v)} opts={BG_OPTS} /></Row>
      {st.bg === 'custom' && <Row l="لون الخلفية"><ColorIn v={st.bgColor} set={(v) => set('bgColor', v)} fallback="#f3f4f6" /></Row>}
      <Row l="لون النص"><ColorIn v={st.color} set={(v) => set('color', v)} fallback="#1a1a1a" clearable /></Row>
      <Row l="المسافات (أعلى وأسفل)"><Chips v={st.pad} set={(v) => set('pad', v)} opts={PAD_OPTS} /></Row>
      <Row l="المحاذاة"><Chips v={st.align} set={(v) => set('align', v)} opts={ALIGN_OPTS} /></Row>
      <Row l="عرض المحتوى"><Chips v={st.width} set={(v) => set('width', v)} opts={WIDTH_OPTS} /></Row>
      <Field l="استدارة الزوايا (px، فارغ = الافتراضي)"><input className="in num" type="number" min="0" max="40" value={st.radius ?? ''} onChange={(e) => set('radius', e.target.value === '' ? '' : Number(e.target.value))} /></Field>
            <Field l="الخط (لهذا القسم فقط)" full><select className="in" value={st.font || ''} onChange={(e) => set('font', e.target.value)}><option value="">خط الصفحة العام</option>{FONTS_ALL.map((f) => <option key={f} value={f}>{f}</option>)}</select></Field>
      <Row l="حركة الظهور"><Chips v={st.anim} set={(v) => set('anim', v)} opts={ANIM_OPTS} /></Row>
      <Field l="إخفاء على الموبايل"><div className="tgrow"><Tog on={!!st.hideM} set={(x) => set('hideM', x)} /></div></Field>
      <Field l="إخفاء على الكمبيوتر"><div className="tgrow"><Tog on={!!st.hideD} set={(x) => set('hideD', x)} /></div></Field>
      <Field l="معرّف الرابط (anchor) مثل: offer" full><input className="in num" dir="ltr" value={st.anchor || ''} onChange={(e) => set('anchor', e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))} placeholder="يسمح بالنزول للقسم عبر #offer" /></Field>
      <div style={{ gridColumn: '1/-1' }}><button type="button" className="btn sm" onClick={() => onChange({ ...s, style: { ...STYLE_DEFAULT } })}>إعادة ضبط الشكل</button></div>
    </div>
  );
}
