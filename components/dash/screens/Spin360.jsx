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
  const target = useRef('');
  useEffect(() => { setD({ enabled: true, items: {}, ...(cfg.spin || {}) }); setDirty(false); }, [cfg.spin]);
  const patch = (p) => { setD((c) => ({ ...c, ...p })); setDirty(true); };
  const setVid = (pid, url) => {
    const items = { ...d.items };
    if (url) items[pid] = { video: url }; else delete items[pid];
    patch({ items });
  };
  const pick = async (e) => {
    const f = (e.target.files || [])[0]; e.target.value = '';
    const pid = target.current; if (!f || !pid) return;
    setUp(pid);
    try { const r = await uploadVideo(uid, f, 'spin'); setVid(pid, r.url); say('تم رفع الفيديو ✓ اضغط حفظ'); } catch (err) { say(err.message || 'تعذر الرفع'); }
    setUp('');
  };
  const save = async () => {
    setBusy(true);
    const clean = { enabled: !!d.enabled, items: Object.fromEntries(Object.entries(d.items).filter(([, v]) => v && /^https?:\/\//.test(v.video || '')).map(([k, v]) => [k, { video: v.video }])) };
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
          <li>خلفية بسيطة وإضاءة ثابتة، وآخر الفيديو يرجع لنفس وضع أوله عشان اللفة تبقى متصلة.</li>
        </ul>
      </div>
      <input className="in" style={{ maxWidth: 320, marginBottom: 12 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن منتج" aria-label="بحث" />
      <div style={{ display: 'grid', gap: 10 }}>
        {list.map((p) => {
          const v = d.items[p.id] && d.items[p.id].video;
          return (
            <div key={p.id} className="card" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              {p.images && p.images[0] ? <img src={p.images[0]} alt="" style={{ width: 54, height: 54, objectFit: 'cover', borderRadius: 8 }} /> : null}
              <b style={{ flex: 1, minWidth: 140 }}>{p.title}</b>
              {v ? <video src={v} muted playsInline controls preload="metadata" style={{ width: 90, height: 60, borderRadius: 8, background: '#000' }} /> : <span className="mut" style={{ fontSize: 12 }}>مفيش فيديو</span>}
              <button className="btn" type="button" disabled={up === p.id} onClick={() => { target.current = p.id; fRef.current && fRef.current.click(); }}>{up === p.id ? 'جاري الرفع...' : v ? 'استبدال' : 'رفع فيديو'}</button>
              {v ? <button className="btn" type="button" onClick={() => setVid(p.id, '')}>حذف</button> : null}
            </div>
          );
        })}
        {!list.length ? <div className="mut">مفيش منتجات.</div> : null}
      </div>
    </>
  );
}
export default Spin360Screen;
