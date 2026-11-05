'use client';
import React, { useEffect, useState } from 'react';
import { useDash, PageHead } from '../ui';
import { useTable } from '../hooks';

const STYLES = [
  { k: 'orbit', t: 'المدار', i: '🪐', d: 'منتجات بتدور على مسار منحني، سحب بالعجلة، وإضافة بضغطة على المقاس.' },
  { k: 'rail', t: 'رف الشماعات', i: '👗', d: 'قطع معلّقة على سكة أفقية، القطعة الأوسط تكبر وتتقدم. مناسب للملابس.' },
  { k: 'shuffle', t: 'شبكة الخلط', i: '🔀', d: 'منتجات عايمة في شبكة وزر «اخلط» يعيد ترتيبها. مناسب للأحذية والإكسسوار.' },
  { k: 'grid', t: 'شبكة كلاسيك', i: '▦', d: 'كروت منتجات عادية في شبكة. الأسرع والأبسط.' },
];

function Pick({ value, onChange, allowInherit, name }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 10 }}>
      {allowInherit && (
        <button type="button" className="card" onClick={() => onChange('')} aria-pressed={!value}
          style={{ textAlign: 'start', cursor: 'pointer', outline: !value ? '2px solid var(--b)' : 'none' }}>
          <b>↩ زي الافتراضي</b><div className="mut" style={{ fontSize: 12, marginTop: 4 }}>بدون تخصيص</div>
        </button>
      )}
      {STYLES.map((s) => (
        <button key={s.k} type="button" className="card" onClick={() => onChange(s.k)} aria-pressed={value === s.k} aria-label={`${name || ''} ${s.t}`}
          style={{ textAlign: 'start', cursor: 'pointer', outline: value === s.k ? '2px solid var(--b)' : 'none' }}>
          <div style={{ fontSize: 26 }}>{s.i}</div>
          <b>{s.t}</b>
          <div className="mut" style={{ fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>{s.d}</div>
        </button>
      ))}
    </div>
  );
}

export function BrowseScreen() {
  const { cfg, saveCfg, say } = useDash();
  const cats = useTable('store_categories', { order: 'sort_order', asc: true });
  const [d, setD] = useState(() => ({ style: 'orbit', by_cat: {}, ...(cfg.browse || {}) }));
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setD({ style: 'orbit', by_cat: {}, ...(cfg.browse || {}) }); setDirty(false); }, [cfg.browse]);

  const setCat = (id, v) => {
    const by = { ...(d.by_cat || {}) };
    if (v) by[id] = v; else delete by[id];
    setD({ ...d, by_cat: by }); setDirty(true);
  };
  const save = async () => {
    setBusy(true);
    const ok = await saveCfg('browse', { style: d.style || 'orbit', by_cat: d.by_cat || {} });
    setBusy(false);
    if (ok !== false) { setDirty(false); say('تم حفظ شكل عرض المنتجات ✓'); }
  };

  return (
    <>
      <PageHead title="شكل عرض المنتجات" sub="اختر الطريقة اللي العميل بيتصفح بيها منتجاتك: الصفحة الرئيسية وصفحة كل المنتجات والأقسام.">
        <button className="b p" type="button" disabled={!dirty || busy} onClick={save}>{busy ? 'جاري الحفظ...' : 'حفظ'}</button>
      </PageHead>
      <div className="card" style={{ marginBottom: 14 }}>
        <div><b>الشكل الافتراضي للمتجر</b><p className="mut" style={{ fontSize: 12.5, margin: '4px 0 12px' }}>بيتطبق على كل المنتجات ما عدا الأقسام اللي تخصصها تحت. العميل يقدر يبدّل بين الأشكال من صفحة المنتجات.</p>
          <Pick value={d.style} onChange={(v) => { setD({ ...d, style: v }); setDirty(true); }} name="الافتراضي" />
        </div>
      </div>
      <div className="card">
        <b>تخصيص حسب القسم</b>
        <p className="mut" style={{ fontSize: 12.5, margin: '4px 0 12px' }}>مثلاً: الملابس على «رف الشماعات» والأحذية على «شبكة الخلط».</p>
        {!cats.rows.length ? <div className="mut">مفيش أقسام لسه. ضيف أقسام من صفحة المنتجات.</div> : cats.rows.map((c) => (
          <div key={c.id} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>{c.name}</div>
            <Pick value={(d.by_cat || {})[c.id] || ''} onChange={(v) => setCat(c.id, v)} allowInherit name={c.name} />
          </div>
        ))}
      </div>
    </>
  );
}
