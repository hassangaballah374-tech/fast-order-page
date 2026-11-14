'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useDash, PageHead, Tog } from '../ui';
import { useProducts, uploadAsset } from '../hooks';
import { cleanFitting, newFitId, FITTING_DEFAULT, SLOTS } from '../../../lib/fitting';
import { cutoutImage } from '../../../lib/cutout';

/* غرفة القياس: التاجر يرفع صور موديلز، وصورة PNG شفافة (بدون خلفية) لكل قطعة يحب العميل يجربها عليهم. */

export function FittingScreen() {
  const { cfg, saveCfg, say, uid } = useDash();
  const prods = useProducts();
  const [d, setD] = useState(() => ({ ...FITTING_DEFAULT, ...(cfg.fitting || {}) }));
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [up, setUp] = useState('');
  const [q, setQ] = useState('');
  const mRef = useRef(null);
  const iRef = useRef(null);
  const target = useRef('');
  useEffect(() => { setD({ ...FITTING_DEFAULT, ...(cfg.fitting || {}) }); setDirty(false); }, [cfg.fitting]);

  const patch = (p) => { setD((c) => ({ ...c, ...p })); setDirty(true); };
  const setItem = (pid, p) => patch({ items: { ...d.items, [pid]: { slot: 'top', image: '', ...(d.items[pid] || {}), ...p } } });
  const rmItem = (pid) => { const it = { ...d.items }; delete it[pid]; patch({ items: it }); };

  const addModels = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 8 - d.models.length); e.target.value = '';
    if (!files.length) return;
    setUp('m');
    const add = [];
    for (const f of files) { try { const r = await uploadAsset(uid, f, 'fitting'); add.push({ id: newFitId(), name: '', image: r.url }); } catch (err) { say(err.message || 'تعذر الرفع'); } }
    if (add.length) patch({ models: [...d.models, ...add] });
    setUp('');
  };
  const cutExisting = async (pid, url) => {
    setUp(pid);
    try {
      const c = await cutoutImage(url);
      if (!c.blob) { say(c.reason === 'busy' ? 'الخلفية مش لون واحد، مقدرتش أشيلها. ارفع صورة القطعة لوحدها على خلفية بيضاء.' : 'تعذر إزالة الخلفية'); }
      else { const r = await uploadAsset(uid, new File([c.blob], 'item.png', { type: 'image/png' }), 'fitting'); setItem(pid, { image: r.url }); say('تمت إزالة الخلفية ✓ اضغط حفظ'); }
    } catch (err) { say('تعذر قراءة الصورة للمعالجة. ارفعها من جديد بدل كده.'); }
    setUp('');
  };
  const pickItem = async (e) => {
    const f = (e.target.files || [])[0]; e.target.value = '';
    const pid = target.current; if (!f || !pid) return;
    setUp(pid);
    try {
      /* إزالة الخلفية تلقائياً (للصور اللي خلفيتها لون واحد) وقص الصورة على حدود القطعة */
      let file = f;
      try {
        const c = await cutoutImage(f);
        if (c.blob) file = new File([c.blob], 'item.png', { type: 'image/png' });
        else if (c.reason === 'busy') say('الصورة خلفيتها مش لون واحد (أو عليها شخص)، فمقدرتش أشيل الخلفية. الأفضل صورة القطعة لوحدها على خلفية بيضاء أو PNG شفاف.');
      } catch { /* نرفع الأصل */ }
      const r = await uploadAsset(uid, file, 'fitting'); setItem(pid, { image: r.url });
    } catch (err) { say(err.message || 'تعذر الرفع'); }
    setUp('');
  };
  const save = async () => {
    if (d.enabled && !d.models.length) { say('ارفع صورة موديل واحدة على الأقل'); return; }
    setBusy(true);
    const ok = await saveCfg('fitting', cleanFitting(d));
    setBusy(false);
    if (ok !== false) { setDirty(false); say('تم حفظ غرفة القياس ✓'); }
  };

  const list = prods.rows.filter((p) => !q.trim() || String(p.title || '').toLowerCase().includes(q.trim().toLowerCase()));
  const used = Object.values(d.items).filter((x) => x.image).length;

  return (
    <>
      <PageHead title="غرفة القياس" sub="العميل يلبّس قطعك على موديل ويظبّطها بالسحب، ثم يضيف اللي عجبه للسلة. بدون ذكاء اصطناعي: الصور من عندك.">
        <button className="btn p" type="button" disabled={!dirty || busy} onClick={save}>{busy ? 'جاري الحفظ...' : 'حفظ'}</button>
      </PageHead>
      <input ref={mRef} type="file" accept="image/*" multiple hidden onChange={addModels} />
      <input ref={iRef} type="file" accept="image/png,image/webp,image/*" hidden onChange={pickItem} />
      <div className="card" style={{ marginBottom: 14, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <Tog on={!!d.enabled} set={(v) => patch({ enabled: v })} />
        <b>تفعيل غرفة القياس في المتجر</b>
        <input className="in" style={{ maxWidth: 260 }} value={d.title} onChange={(e) => patch({ title: e.target.value })} placeholder="العنوان" aria-label="العنوان" />
        <span className="mut" style={{ fontSize: 12 }}>تظهر في صفحة «غرفة القياس» وكقسم في الصفحة الرئيسية. {used} قطعة جاهزة.</span>
      </div>
      <div className="card" style={{ marginBottom: 14 }}>
        <b>1) صور الموديلز ({d.models.length}/8)</b>
        <p className="mut" style={{ fontSize: 12.5, margin: '4px 0 10px' }}>صورة واقفة كاملة من الرأس للقدم، خلفية بسيطة، نسبة 3:4 تقريباً (طولية).</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {d.models.map((m) => (
            <div key={m.id} style={{ width: 96, textAlign: 'center' }}>
              <img src={m.image} alt="" style={{ width: 96, height: 128, objectFit: 'cover', borderRadius: 12, background: 'var(--s2)' }} />
              <button type="button" className="btn dng sm" style={{ marginTop: 4 }} onClick={() => patch({ models: d.models.filter((x) => x.id !== m.id) })}>حذف</button>
            </div>
          ))}
          {d.models.length < 8 && <button type="button" className="btn" style={{ width: 96, height: 128, borderStyle: 'dashed' }} disabled={up === 'm'} onClick={() => mRef.current?.click()}>{up === 'm' ? '...' : '+ موديل'}</button>}
        </div>
      </div>
      <div className="card">
        <b>2) القطع القابلة للتجربة</b>
        <p className="mut" style={{ fontSize: 12.5, margin: '4px 0 10px' }}>لكل منتج: ارفع صورة القطعة <b>PNG بخلفية شفافة</b> (ممكن تشيل الخلفية بأي أداة مجانية) واختار مكانها على الجسم.</p>
        <input className="in" style={{ marginBottom: 10 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن منتج..." aria-label="بحث" />
        <div style={{ display: 'grid', gap: 8, maxHeight: 520, overflow: 'auto' }}>
          {list.map((p) => {
            const pid = String(p.id); const it = d.items[pid];
            return (
              <div key={pid} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', padding: 8, borderRadius: 12, background: it && it.image ? 'var(--cream)' : 'transparent', border: '1px solid var(--ln)' }}>
                <span style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--s2)', overflow: 'hidden', flex: 'none' }}>{(p.images || [])[0] ? <img src={p.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}</span>
                <span style={{ flex: 1, minWidth: 120, fontWeight: 700 }}>{p.title}</span>
                {it && it.image ? <img src={it.image} alt="" style={{ width: 40, height: 40, objectFit: 'contain', background: 'repeating-conic-gradient(#ddd 0 25%,#fff 0 50%) 0 0/10px 10px', borderRadius: 6 }} /> : null}
                {it && it.image ? <select className="in" style={{ maxWidth: 190 }} value={it.slot} onChange={(e) => setItem(pid, { slot: e.target.value })} aria-label="مكان القطعة">{Object.entries(SLOTS).map(([k, v]) => <option key={k} value={k}>{v.t}</option>)}</select> : null}
                {it && it.image ? <button type="button" className="btn sm" disabled={up === pid} title="يمسح الخلفية من الصورة المرفوعة" onClick={() => cutExisting(pid, it.image)}>✂️ إزالة الخلفية</button> : null}
                <button type="button" className="btn sm" disabled={up === pid} onClick={() => { target.current = pid; iRef.current?.click(); }}>{up === pid ? '...' : it && it.image ? 'تغيير الصورة' : '⬆️ رفع صورة القطعة'}</button>
                {it ? <button type="button" className="btn dng sm" onClick={() => rmItem(pid)}>إزالة</button> : null}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
