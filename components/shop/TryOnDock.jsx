'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { useShop } from './StoreContext';
import Mannequin from './Mannequin';
import { readTry, writeTry } from './tryonBus';

/* غرفة القياس العايمة (تلبيس بالذكاء الاصطناعي): زر الشماعة على أي منتج يضيفه للموديل، وكل قطعة جديدة تتلبس فوق اللي قبلها */
const MAX = 5;

/* صورة المانيكان المدمج كـ JPEG (لو التاجر ماعندوش صورة موديل) */
async function rasterMannequin() {
  const div = document.createElement('div');
  const root = createRoot(div);
  flushSync(() => root.render(<Mannequin size={2} tone="#d9d4cc" worn={[]} />));
  let svg = div.innerHTML; root.unmount();
  svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"');
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const c = document.createElement('canvas'); c.width = 600; c.height = 900;
    const x = c.getContext('2d'); x.fillStyle = '#e9e6e0'; x.fillRect(0, 0, 600, 900); x.drawImage(im, 0, 0, 600, 900);
    return c.toDataURL('image/jpeg', 0.9);
  } finally { URL.revokeObjectURL(url); }
}

const Hanger = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 8a2.5 2.5 0 1 0-2.5-2.5" /><path d="M12 8v2l9 6.2a1.3 1.3 0 0 1-.7 2.3H3.7a1.3 1.3 0 0 1-.7-2.3L12 10" /></svg>);

export default function TryOnDock() {
  const { slug, cfg, base } = useShop();
  const models = cfg.fitting?.models || [];
  const [picks, setPicks] = useState([]);
  const [img, setImg] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [mi, setMi] = useState(models.length ? 0 : -1);
  const genKey = useRef('');
  const ctrl = useRef(null);
  const imgBox = useRef(null);
  const ready = useRef(false);

  useEffect(() => { const s = readTry(slug); setPicks(s.picks); setImg(s.img || ''); genKey.current = s.key || ''; ready.current = true; }, [slug]);

  const keyOf = (list, m) => `${m}|${list.map((p) => p.id).join(',')}`;

  const fly = useCallback((src, rect) => {
    try {
      if (!rect || !src || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const to = (imgBox.current || document.querySelector('.td')?.getBoundingClientRect && document.querySelector('.td'))?.getBoundingClientRect?.();
      if (!to) return;
      const el = document.createElement('img');
      el.src = src; el.alt = '';
      Object.assign(el.style, { position: 'fixed', left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`, objectFit: 'contain', zIndex: 2000, pointerEvents: 'none', borderRadius: '14px', filter: 'drop-shadow(0 12px 18px rgba(0,0,0,.35))' });
      document.body.appendChild(el);
      const dx = to.left + to.width / 2 - (rect.left + rect.width / 2); const dy = to.top + to.height / 2 - (rect.top + rect.height / 2);
      const a = el.animate([{ transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1 }, { transform: `translate(${dx * 0.6}px,${dy * 0.5 - 40}px) scale(.55) rotate(-8deg)`, opacity: 1, offset: 0.55 }, { transform: `translate(${dx}px,${dy}px) scale(.12) rotate(6deg)`, opacity: 0.1 }], { duration: 750, easing: 'cubic-bezier(.5,.1,.3,1)' });
      a.onfinish = () => el.remove(); a.oncancel = () => el.remove();
    } catch { /* الأنيميشن زينة بس */ }
  }, []);

  /* ضغطة الشماعة على منتج: يضاف (أو يتشال لو متلبّس) */
  useEffect(() => {
    const on = (e) => {
      const d = e.detail || {};
      if (!d.id) return;
      setOpen(true);
      setPicks((cur) => {
        const has = cur.some((p) => String(p.id) === String(d.id));
        if (has) return cur.filter((p) => String(p.id) !== String(d.id));
        fly(d.img, d.rect);
        return [...cur, { id: String(d.id), title: String(d.title || ''), img: String(d.img || '') }].slice(-MAX);
      });
    };
    window.addEventListener('spike:tryon', on);
    return () => window.removeEventListener('spike:tryon', on);
  }, [fly]);

  const run = useCallback(async (list, m) => {
    if (ctrl.current) ctrl.current.abort();
    const c = new AbortController(); ctrl.current = c;
    setBusy(true); setErr('');
    try {
      let baseData;
      if (m < 0 && !models.length) { setErr('لسه مفيش صورة موديل جاهزة في المتجر'); setBusy(false); return; }
      if (m < 0) m = 0;
      const r = await fetch('/api/store/tryon', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: c.signal, body: JSON.stringify({ slug, products: list.map((p) => p.id), model: m, baseData }) });
      const j = await r.json().catch(() => null);
      if (c.signal.aborted) return;
      if (j && j.ok && j.image) { setImg(j.image); genKey.current = keyOf(list, m); writeTry(slug, { picks: list, img: j.image, key: genKey.current }); }
      else setErr((j && j.error) || 'تعذر التلبيس حالياً');
    } catch (e) {
      if (!c.signal.aborted) setErr('مفيش اتصال، جرّب تاني');
    } finally { if (!c.signal.aborted) setBusy(false); }
  }, [slug, models.length]);

  /* أي تغيير في الاختيارات يعيد التلبيس (بعد ثانية قصيرة عشان لو العميل ضغط كذا قطعة ورا بعض) */
  useEffect(() => {
    if (!ready.current) return undefined;
    writeTry(slug, { picks, img: genKey.current === keyOf(picks, mi) ? img : '', key: genKey.current });
    if (!picks.length) { if (ctrl.current) ctrl.current.abort(); setImg(''); setBusy(false); setErr(''); genKey.current = ''; return undefined; }
    if (genKey.current === keyOf(picks, mi) && img) return undefined;
    setBusy(true);
    const t = setTimeout(() => run(picks, mi), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picks, mi, run, slug]);

  const reset = () => { setPicks([]); setImg(''); setErr(''); };

  if (!open && !picks.length) return null;
  if (!open) return <button type="button" className="td-pill" onClick={() => setOpen(true)}><Hanger /> غرفة القياس <b className="num">{picks.length}</b></button>;
  const last = picks[picks.length - 1];
  return (
    <>
      <aside className="td" role="dialog" aria-label="غرفة القياس">
        <div className="td-h"><b>غرفة القياس</b><button type="button" className="td-x" aria-label="تصغير" onClick={() => setOpen(false)}>✕</button></div>
        <div className="td-s">دوس على الشماعة 🧥 في أي منتج عشان الموديل يلبسه</div>
        {models.length > 1 ? (
          <div className="td-ms" role="tablist" aria-label="الموديل">{models.map((m, i) => <button key={m.id || i} type="button" role="tab" aria-selected={i === mi} className={i === mi ? 'on' : ''} onClick={() => setMi(i)}><img src={m.image} alt={m.name || ''} /></button>)}</div>
        ) : null}
        <div className="td-img" ref={imgBox}>
          {img ? <img src={img} alt="الموديل بعد التلبيس" /> : (models[mi]?.image ? <img src={models[mi].image} alt="الموديل" className="td-base" /> : <Mannequin size={2} worn={[]} />)}
          {busy ? <div className="td-load" role="status"><i /><b>بنلبّس الموديل...</b><small>الصورة بتتولّد بالذكاء الاصطناعي</small></div> : null}
          {img && !busy ? <button type="button" className="td-zm" aria-label="تكبير الصورة" onClick={() => setZoom(true)}>⤢</button> : null}
        </div>
        {err ? <div className="td-er" role="alert">{err} <button type="button" onClick={() => run(picks, mi)}>حاول تاني</button></div> : null}
        <div className="td-pk"><span>اختياراتك</span><span className="num">{picks.length} {picks.length === 1 ? 'قطعة' : 'قطع'}</span></div>
        <div className="td-th">
          {picks.map((p) => (
            <div key={p.id} className="td-t"><Link href={`${base}/p/${p.id}`} aria-label={p.title}><img src={p.img} alt={p.title} /></Link><button type="button" aria-label={`شيل ${p.title}`} onClick={() => setPicks((c) => c.filter((x) => x.id !== p.id))}>✕</button></div>
          ))}
          {!picks.length ? <div className="td-em">لسه ماخترتش حاجة</div> : null}
        </div>
        <div className="td-n">ضيف قطعة تانية وهتتلبس فوق اللي قبلها (لحد {MAX} قطع).</div>
        <div className="td-f">
          {last ? <Link href={`${base}/p/${last.id}`} className="b p sm">افتح آخر قطعة</Link> : <span />}
          <button type="button" className="td-rs" onClick={reset}>↺ ابدأ من جديد</button>
        </div>
      </aside>
      {zoom && img ? <div className="td-lb" role="dialog" aria-label="الصورة" onClick={() => setZoom(false)}><img src={img} alt="الموديل بعد التلبيس" /><button type="button" aria-label="إغلاق" onClick={() => setZoom(false)}>✕</button></div> : null}
    </>
  );
}
