'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useDash, PageHead, Tog } from '../ui';
import { useProducts, uploadVideo } from '../hooks';

/* عرض 360°: التاجر يرفع فيديو دوران (turntable) لكل منتج، والعميل يلاقي زرار «360°» في صفحة المنتج. */

export function Spin360Screen() {
  const { cfg, saveCfg, say, uid } = useDash();
  const prods = useProducts();
  const [d, setD] = useState(() => ({ enabled: true, items: {}, ...(cfg.spin || {}) }));
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [up, setUp] = useState('');
  const [q, setQ] = useState('');
  const fRef = useRef(null);
  const target = useRef({ pid: '', slot: 'video' });
  useEffect(() => { setD({ enabled: true, items: {}, ...(cfg.spin || {}) }); setDirty(false); }, [cfg.spin]);
  const patch = (p) => { setD((c) => ({ ...c, ...p })); setDirty(true); };
  /* slot: video (الأساسي) | top | bottom. حذف الأساسي بيحذف الاتنين التانيين معاه */
  const setVid = (pid, url, slot = 'video') => {
    const items = { ...d.items };
    const cur = { ...(items[pid] || {}) };
    if (url) cur[slot] = url; else if (slot === 'video') { delete items[pid]; patch({ items }); return; } else delete cur[slot];
    items[pid] = cur;
    patch({ items });
  };
  const pick = async (e) => {
    const f = (e.target.files || [])[0]; e.target.value = '';
    const { pid, slot } = target.current; if (!f || !pid) return;
    setUp(pid + ':' + slot);
    try { const r = await uploadVideo(uid, f, 'spin'); setVid(pid, r.url, slot); say('تم رفع الفيديو ✓ اضغط حفظ'); } catch (err) { say(err.message || 'تعذر الرفع'); }
    setUp('');
  };
  const save = async () => {
    setBusy(true);
    const clean = { enabled: !!d.enabled, items: Object.fromEntries(Object.entries(d.items).filter(([, v]) => v && /^https?:\/\//.test(v.video || '')).map(([k, v]) => [k, { video: v.video, ...(/^https?:\/\//.test(v.top || '') ? { top: v.top } : {}), ...(/^https?:\/\//.test(v.bottom || '') ? { bottom: v.bottom } : {}) }])) };
    const ok = await saveCfg('spin', clean);
    setBusy(false);
    if (ok !== false) { setDirty(false); say('تم حفظ عرض 360° ✓'); }
  };
  const list = prods.rows.filter((p) => !q.trim() || String(p.title || '').toLowerCase().includes(q.trim().toLowerCase()));
  const used = Object.keys(d.items).length;

  return (
    <>
      <PageHead title="عرض 360°" sub="ارفع فيديو دوران للمنتج، والعميل يقدر يلفّه بالسحب من صفحة المنتج.">
        <button className="btn p" type="button" disabled={!dirty || busy} onClick={save}>{busy ? 'جاري الحفظ...' : 'حفظ'}</button>
      </PageHead>
      <input ref={fRef} type="file" accept="video/mp4,video/webm,video/quicktime" hidden onChange={pick} />
      <div className="card" style={{ marginBottom: 14, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <Tog on={!!d.enabled} set={(v) => patch({ enabled: v })} />
        <b>تفعيل عرض 360° في المتجر</b>
        <span className="mut" style={{ fontSize: 12 }}>{used} منتج عليه فيديو.</span>
      </div>
      <div className="card" style={{ marginBottom: 14, fontSize: 13, lineHeight: 1.9 }}>
        <b>إزاي تصوّر فيديو كويس؟</b>
        <ul style={{ margin: '6px 0 0', paddingInlineStart: 18 }}>
          <li>المنتج على قاعدة دوّارة (أو شماعة بتلف)، لفة كاملة واحدة بسرعة ثابتة، والكاميرا ثابتة.</li>
          <li>المدة 3-6 ثواني، العرض حوالي 720px، والحجم أقل من 25MB (صيغة MP4 أو WebM).</li>
          <li>للدوران لفوق وتحت حقيقي: صوّر نفس اللفة من زاوية أعلى (حوالي 30-45°) ومرة من زاوية أدنى. لازم نفس المدة، وتبدأ من نفس الوش، وبنفس اتجاه ودوران اللفة. الاتنين اختياريين.</li>
          <li>خلفية بسيطة وإضاءة ثابتة، وآخر الفيديو يرجع لنفس وضع أوله عشان اللفة تبقى متصلة.</li>
        </ul>
      </div>
      <input className="in" style={{ maxWidth: 320, marginBottom: 12 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن منتج" aria-label="بحث" />
      <div style={{ display: 'grid', gap: 10 }}>
        {list.map((p) => {
          const it = d.items[p.id] || {};
          const slots = [['video', 'مستوى النظر (أساسي)', true], ['top', 'من فوق (اختياري)', !!it.video], ['bottom', 'من تحت (اختياري)', !!it.video]];
          return (
            <div key={p.id} className="card" style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {p.images && p.images[0] ? <img src={p.images[0]} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} /> : null}
                <b style={{ flex: 1 }}>{p.title}</b>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 10 }}>
                {slots.map(([slot, label, enabled]) => {
                  const v = it[slot]; const busyHere = up === p.id + ':' + slot;
                  return (
                    <div key={slot} style={{ border: '1px solid var(--ln, #e2e8f0)', borderRadius: 10, padding: 10, display: 'grid', gap: 8, opacity: enabled ? 1 : 0.5 }}>
                      <b style={{ fontSize: 13 }}>{label}</b>
                      {v ? <video src={v} muted playsInline controls preload="metadata" style={{ width: '100%', maxHeight: 120, borderRadius: 8, background: '#000' }} /> : <span className="mut" style={{ fontSize: 12 }}>{enabled ? 'مفيش فيديو' : 'ارفع الأساسي الأول'}</span>}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn" type="button" disabled={!enabled || busyHere} onClick={() => { target.current = { pid: p.id, slot }; fRef.current && fRef.current.click(); }}>{busyHere ? 'جاري الرفع...' : v ? 'استبدال' : 'رفع'}</button>
                        {v ? <button className="btn" type="button" onClick={() => setVid(p.id, '', slot)}>حذف</button> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {!list.length ? <div className="mut">مفيش منتجات.</div> : null}
      </div>
    </>
  );
}
export default Spin360Screen;
