'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useDash, PageHead, Tog, Empty } from '../ui';
import { useProducts, uploadAsset } from '../hooks';
import { cleanLooks, newLookId, LOOKS_DEFAULT } from '../../../lib/looks';

/* شاشة الإطلالات: التاجر يضيف إطلالة = صورة موديل + القطع اللي لابسها، والعميل يشتريها كاملة أو قطعة قطعة. */

const blank = () => ({ id: newLookId(), name: '', image: '', note: '', product_ids: [] });

export function LooksScreen() {
  const { cfg, saveCfg, say, uid } = useDash();
  const prods = useProducts();
  const [d, setD] = useState(() => ({ ...LOOKS_DEFAULT, ...(cfg.looks || {}) }));
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState('');
  const [q, setQ] = useState('');
  const [up, setUp] = useState('');
  const fileRef = useRef(null);
  const upFor = useRef('');
  useEffect(() => { setD({ ...LOOKS_DEFAULT, ...(cfg.looks || {}) }); setDirty(false); }, [cfg.looks]);

  const patch = (p) => { setD((c) => ({ ...c, ...p })); setDirty(true); };
  const setLook = (id, p) => patch({ items: d.items.map((l) => (l.id === id ? { ...l, ...p } : l)) });
  const addLook = () => { const l = blank(); patch({ items: [...d.items, l] }); setOpen(l.id); };
  const del = (id) => { if (window.confirm('حذف الإطلالة؟')) patch({ items: d.items.filter((l) => l.id !== id) }); };
  const move = (i, k) => { const a = [...d.items]; const j = i + k; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; patch({ items: a }); };
  const toggleProd = (l, pid) => {
    const s = String(pid); const has = l.product_ids.includes(s);
    if (!has && l.product_ids.length >= 12) { say('الحد الأقصى 12 قطعة في الإطلالة'); return; }
    setLook(l.id, { product_ids: has ? l.product_ids.filter((x) => x !== s) : [...l.product_ids, s] });
  };
  const pickImg = async (e) => {
    const f = (e.target.files || [])[0]; e.target.value = '';
    const id = upFor.current;
    if (!f || !id) return;
    setUp(id);
    try { const r = await uploadAsset(uid, f, 'looks'); setLook(id, { image: r.url }); } catch (err) { say(err.message || 'تعذر رفع الصورة'); }
    setUp('');
  };
  const save = async () => {
    const bad = d.items.find((l) => !String(l.name).trim() || !l.product_ids.length);
    if (bad) { setOpen(bad.id); say('كل إطلالة محتاجة اسم وقطعة واحدة على الأقل'); return; }
    setBusy(true);
    const ok = await saveCfg('looks', cleanLooks(d));
    setBusy(false);
    if (ok !== false) { setDirty(false); say('تم حفظ الإطلالات ✓'); }
  };

  const list = prods.rows.filter((p) => !q.trim() || String(p.title || '').toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <>
      <PageHead title="الإطلالات (تسوّق الإطلالة)" sub="ارفع صورة موديل لابس قطع من متجرك، والعميل يختار المقاس لكل قطعة ويضيف الإطلالة كاملة بضغطة.">
        <button className="btn p" type="button" disabled={!dirty || busy} onClick={save}>{busy ? 'جاري الحفظ...' : 'حفظ'}</button>
      </PageHead>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickImg} />
      <div className="card" style={{ marginBottom: 14, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <Tog on={d.enabled !== false} set={(v) => patch({ enabled: v })} />
        <b>عرض الإطلالات في المتجر</b>
        <input className="in" style={{ maxWidth: 260 }} value={d.title} onChange={(e) => patch({ title: e.target.value })} placeholder="عنوان القسم" aria-label="عنوان القسم" />
        <span className="mut" style={{ fontSize: 12 }}>تظهر في صفحة «الإطلالات» وفي قسم «تسوّق الإطلالة» لو أضفته للصفحة الرئيسية.</span>
      </div>
      {!d.items.length ? <Empty icon="👗" t="لا توجد إطلالات" d="أضف أول إطلالة" /> : null}
      {d.items.map((l, i) => (
        <div className="card" key={l.id} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ width: 54, height: 72, borderRadius: 10, background: 'var(--s2)', overflow: 'hidden', flex: 'none' }}>{l.image ? <img src={l.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}</div>
            <div style={{ flex: 1, minWidth: 160 }}><b>{l.name || 'إطلالة جديدة'}</b><div className="mut" style={{ fontSize: 12 }}>{l.product_ids.length} قطعة</div></div>
            <button type="button" className="btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="تحريك لأعلى">↑</button>
            <button type="button" className="btn" onClick={() => move(i, 1)} disabled={i === d.items.length - 1} aria-label="تحريك لأسفل">↓</button>
            <button type="button" className="btn" onClick={() => setOpen(open === l.id ? '' : l.id)}>{open === l.id ? 'إغلاق' : 'تعديل'}</button>
            <button type="button" className="btn dng" onClick={() => del(l.id)}>حذف</button>
          </div>
          {open === l.id && (
            <div style={{ marginTop: 14, display: 'grid', gap: 12 }}>
              <div className="fgrid">
                <label>اسم الإطلالة<input className="in" value={l.name} maxLength={80} onChange={(e) => setLook(l.id, { name: e.target.value })} placeholder="مثلاً: إطلالة الخريف" /></label>
                <label>وصف قصير (اختياري)<input className="in" value={l.note} maxLength={160} onChange={(e) => setLook(l.id, { note: e.target.value })} /></label>
              </div>
              <div>
                <button type="button" className="btn" disabled={up === l.id} onClick={() => { upFor.current = l.id; fileRef.current?.click(); }}>{up === l.id ? 'جاري الرفع...' : l.image ? '🖼️ تغيير صورة الموديل' : '🖼️ رفع صورة الموديل'}</button>
                {l.image ? <button type="button" className="btn" style={{ marginInlineStart: 8 }} onClick={() => setLook(l.id, { image: '' })}>إزالة الصورة</button> : <span className="mut" style={{ marginInlineStart: 8, fontSize: 12 }}>بدون صورة هيظهر تجميعة من صور القطع.</span>}
              </div>
              <div>
                <b>القطع في الإطلالة ({l.product_ids.length}/12)</b>
                <input className="in" style={{ margin: '8px 0' }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن منتج..." aria-label="بحث" />
                <div style={{ maxHeight: 260, overflow: 'auto', display: 'grid', gap: 6 }}>
                  {list.map((p) => {
                    const on = l.product_ids.includes(String(p.id));
                    return (
                      <label key={p.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 8px', borderRadius: 10, background: on ? 'var(--cream)' : 'transparent', cursor: 'pointer' }}>
                        <input type="checkbox" checked={on} onChange={() => toggleProd(l, p.id)} />
                        <span style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--s2)', overflow: 'hidden', flex: 'none' }}>{(p.images || [])[0] ? <img src={p.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}</span>
                        <span style={{ flex: 1 }}>{p.title}</span>
                      </label>
                    );
                  })}
                  {!list.length ? <div className="mut">لا توجد منتجات</div> : null}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
      <button type="button" className="btn p" onClick={addLook}>+ إضافة إطلالة</button>
    </>
  );
}
