'use client';
import React, { useEffect, useState } from 'react';
import { useDash, PageHead, Tog, Empty } from '../ui';
import { useProducts, useTable } from '../hooks';
import { BROWSE_STYLES } from '../../../lib/browse';
import { cleanShowcases, newShowcaseId, SHOWCASES_DEFAULT } from '../../../lib/showcases';

/* التشكيلات: اعمل مجموعة منتجات (كل المنتجات / قسم / اختيار يدوي) واختار لها تخطيط خاص، وتظهر في الرئيسية وبرابط لوحدها. */

const blank = () => ({ id: newShowcaseId(), name: '', subtitle: '', style: 'rail', source: 'all', cat_id: '', product_ids: [], limit: 12, home: true });

export function ShowcasesScreen() {
  const { cfg, saveCfg, say } = useDash();
  const prods = useProducts();
  const cats = useTable('store_categories', { order: 'sort_order', asc: true });
  const [d, setD] = useState(() => ({ ...SHOWCASES_DEFAULT, ...(cfg.showcases || {}) }));
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState('');
  const [q, setQ] = useState('');
  useEffect(() => { setD({ ...SHOWCASES_DEFAULT, ...(cfg.showcases || {}) }); setDirty(false); }, [cfg.showcases]);

  const patch = (items) => { setD({ items }); setDirty(true); };
  const set = (id, p) => patch(d.items.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const add = () => { const x = blank(); patch([...d.items, x]); setOpen(x.id); };
  const del = (id) => { if (window.confirm('حذف التشكيلة؟')) patch(d.items.filter((x) => x.id !== id)); };
  const move = (i, k) => { const a = [...d.items]; const j = i + k; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; patch(a); };
  const tp = (x, pid) => { const s = String(pid); set(x.id, { product_ids: x.product_ids.includes(s) ? x.product_ids.filter((v) => v !== s) : [...x.product_ids, s] }); };
  const save = async () => {
    const bad = d.items.find((x) => !String(x.name).trim() || (x.source === 'cat' && !x.cat_id) || (x.source === 'pick' && !x.product_ids.length));
    if (bad) { setOpen(bad.id); say('كل تشكيلة محتاجة اسم، وقسم أو منتجات حسب المصدر'); return; }
    setBusy(true);
    const ok = await saveCfg('showcases', cleanShowcases(d));
    setBusy(false);
    if (ok !== false) { setDirty(false); say('تم حفظ التشكيلات ✓'); }
  };
  const list = prods.rows.filter((p) => !q.trim() || String(p.title || '').toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <>
      <PageHead title="التشكيلات" sub="مجموعات منتجات بتخطيط خاص: مثلاً «وصل حديثاً» على رف الشماعات و«الأحذية» على شبكة الخلط.">
        <button className="btn p" type="button" disabled={!dirty || busy} onClick={save}>{busy ? 'جاري الحفظ...' : 'حفظ'}</button>
      </PageHead>
      <div className="card" style={{ marginBottom: 12 }}>
        <span className="mut" style={{ fontSize: 12.5 }}>عشان التشكيلة تظهر في الصفحة الرئيسية: من «تعديل الصفحة الرئيسية» أضف قسم «التشكيلات». وكل تشكيلة ليها رابط مباشر <b className="num" dir="ltr">/s/&lt;الكود&gt;</b>.</span>
      </div>
      {!d.items.length ? <Empty icon="✨" t="لا توجد تشكيلات" d="أضف أول تشكيلة" /> : null}
      {d.items.map((x, i) => (
        <div className="card" key={x.id} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 160 }}><b>{x.name || 'تشكيلة جديدة'}</b><div className="mut" style={{ fontSize: 12 }}>{BROWSE_STYLES[x.style]} · {x.source === 'all' ? 'كل المنتجات' : x.source === 'cat' ? 'قسم' : `${x.product_ids.length} منتج`} · <span className="num" dir="ltr">/s/{x.id}</span></div></div>
            <button type="button" className="btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="لأعلى">↑</button>
            <button type="button" className="btn" onClick={() => move(i, 1)} disabled={i === d.items.length - 1} aria-label="لأسفل">↓</button>
            <button type="button" className="btn" onClick={() => setOpen(open === x.id ? '' : x.id)}>{open === x.id ? 'إغلاق' : 'تعديل'}</button>
            <button type="button" className="btn dng" onClick={() => del(x.id)}>حذف</button>
          </div>
          {open === x.id && (
            <div style={{ marginTop: 14, display: 'grid', gap: 12 }}>
              <div className="fgrid">
                <label>اسم التشكيلة<input className="in" value={x.name} maxLength={60} onChange={(e) => set(x.id, { name: e.target.value })} placeholder="مثلاً: وصل حديثاً" /></label>
                <label>وصف قصير<input className="in" value={x.subtitle} maxLength={140} onChange={(e) => set(x.id, { subtitle: e.target.value })} /></label>
                <label>التخطيط<select className="in" value={x.style} onChange={(e) => set(x.id, { style: e.target.value })}>{Object.entries(BROWSE_STYLES).map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select></label>
                <label>المصدر<select className="in" value={x.source} onChange={(e) => set(x.id, { source: e.target.value })}><option value="all">كل المنتجات (الأحدث أولاً)</option><option value="cat">قسم معيّن</option><option value="pick">اختيار يدوي</option></select></label>
                {x.source === 'cat' ? <label>القسم<select className="in" value={x.cat_id} onChange={(e) => set(x.id, { cat_id: e.target.value })}><option value="">اختر القسم</option>{cats.rows.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label> : null}
                {x.source !== 'pick' ? <label>أقصى عدد منتجات<input className="in num" type="number" min="2" max="60" value={x.limit} onChange={(e) => set(x.id, { limit: Number(e.target.value) })} /></label> : null}
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Tog on={x.home !== false} set={(v) => set(x.id, { home: v })} /><span>عرضها في الصفحة الرئيسية (قسم «التشكيلات»)</span></div>
              {x.source === 'pick' && (
                <div>
                  <b>المنتجات ({x.product_ids.length})</b>
                  <input className="in" style={{ margin: '8px 0' }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن منتج..." aria-label="بحث" />
                  <div style={{ maxHeight: 260, overflow: 'auto', display: 'grid', gap: 6 }}>
                    {list.map((p) => { const on = x.product_ids.includes(String(p.id)); return (
                      <label key={p.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 8px', borderRadius: 10, background: on ? 'var(--cream)' : 'transparent', cursor: 'pointer' }}>
                        <input type="checkbox" checked={on} onChange={() => tp(x, p.id)} />
                        <span style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--s2)', overflow: 'hidden', flex: 'none' }}>{(p.images || [])[0] ? <img src={p.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}</span>
                        <span style={{ flex: 1 }}>{p.title}</span>
                      </label>); })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      <button type="button" className="btn p" onClick={add}>+ إضافة تشكيلة</button>
    </>
  );
}
