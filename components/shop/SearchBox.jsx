'use client';
import { useT } from '../I18n';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useShop } from './StoreContext';

/* بحث بملء الشاشة: آخر عمليات بحثك + الأكثر طلباً (من مبيعات المتجر الفعلية) + نتائج فورية.
   بيتفتح بالضغط على مربع البحث في الهيدر أو أيقونة البحث (موبايل / الشريط السفلي). */
const MAX_RECENT = 8;

export default function SearchBox() {
  const tx = useT();
  const { slug, base, cur } = useShop();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [popular, setPopular] = useState(null);
  const [recent, setRecent] = useState([]);
  const seq = useRef(0);
  const inp = useRef(null);
  const root = useRef(null);
  const [host, setHost] = useState(null);
  const rkey = `spike_recent_${slug}`;

  const loadRecent = useCallback(() => {
    try { const a = JSON.parse(localStorage.getItem(rkey) || '[]'); setRecent(Array.isArray(a) ? a.filter((x) => typeof x === 'string').slice(0, MAX_RECENT) : []); } catch { setRecent([]); }
  }, [rkey]);
  const saveRecent = (term) => {
    const t = String(term || '').trim().slice(0, 40);
    if (t.length < 2) return;
    try {
      const a = [t, ...recent.filter((x) => x !== t)].slice(0, MAX_RECENT);
      localStorage.setItem(rkey, JSON.stringify(a)); setRecent(a);
    } catch { /* تجاهل */ }
  };
  const dropRecent = (t) => { try { const a = recent.filter((x) => x !== t); localStorage.setItem(rkey, JSON.stringify(a)); setRecent(a); } catch { /* تجاهل */ } };
  const clearRecent = () => { try { localStorage.removeItem(rkey); } catch { /* تجاهل */ } setRecent([]); };

  const openIt = useCallback(() => {
    loadRecent(); setHost(root.current?.closest('.spk') || document.body); setOpen(true);
    setTimeout(() => { try { inp.current?.focus(); } catch { /* */ } }, 60);
  }, [loadRecent]);
  const closeIt = useCallback(() => { setOpen(false); setQ(''); setItems([]); }, []);

  useEffect(() => {
    window.addEventListener('spike:search-open', openIt);
    return () => window.removeEventListener('spike:search-open', openIt);
  }, [openIt]);

  /* قفل سكرول الصفحة + Esc */
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const k = (e) => { if (e.key === 'Escape') closeIt(); };
    window.addEventListener('keydown', k);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', k); };
  }, [open, closeIt]);

  /* الأكثر طلباً: بنجيبها مرة أول ما الشاشة تتفتح */
  useEffect(() => {
    if (!open || popular) return;
    fetch('/api/store/suggest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, popular: true }) })
      .then((r) => r.json()).then((j) => setPopular(j.items || [])).catch(() => setPopular([]));
  }, [open, popular, slug]);

  /* نتائج فورية */
  useEffect(() => {
    const term = q.trim();
    if (!open || term.length < 2) { setItems([]); setBusy(false); return undefined; }
    setBusy(true);
    const my = ++seq.current;
    const t = setTimeout(async () => {
      try {
        const r = await fetch('/api/store/suggest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, q: term }) });
        const j = await r.json();
        if (my === seq.current) setItems(j.items || []);
      } catch { if (my === seq.current) setItems([]); }
      if (my === seq.current) setBusy(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q, slug, open]);

  const go = (term) => {
    const t = String(term || '').trim();
    if (!t) return;
    saveRecent(t); closeIt();
    router.push(`${base}/products?q=${encodeURIComponent(t)}`);
  };
  const submit = (e) => { e.preventDefault(); go(q); };
  const term = q.trim();

  const Card = ({ p }) => (
    <Link href={`${base}/p/${p.id}`} className="so-card" onClick={() => { if (term) saveRecent(term); closeIt(); }}>
      <span className="so-img">{p.image ? <img src={p.image} alt="" loading="lazy" /> : null}</span>
      <span className="so-tt">{p.title}</span>
      <b className="num so-pr">{Math.round(p.price)} {cur}</b>
    </Link>
  );

  return (
    <div className="sbx" ref={root}>
      <button type="button" className="sbx-ic" aria-label={tx('بحث')} onClick={openIt}>🔍</button>
      <form className="sbx-f" onSubmit={(e) => { e.preventDefault(); openIt(); }} role="search">
        <input className="sbx-in" readOnly onClick={openIt} onFocus={openIt} placeholder={tx('ابحث عن منتج...')} aria-label={tx('ابحث عن منتج')} autoComplete="off" />
      </form>

      {open && host ? createPortal(
        <div className="so" role="dialog" aria-modal="true" aria-label={tx('بحث')}>
          <div className="so-top">
            <form className="so-f" onSubmit={submit} role="search">
              <span className="so-mag" aria-hidden="true">🔍</span>
              <input ref={inp} className="so-in" value={q} onChange={(e) => setQ(e.target.value)} placeholder={tx('ابحث عن منتج...')} aria-label={tx('ابحث عن منتج')} autoComplete="off" enterKeyHint="search" />
              {q ? <button type="button" className="so-clr" aria-label={tx('مسح')} onClick={() => { setQ(''); inp.current?.focus(); }}>✕</button> : null}
            </form>
            <button type="button" className="so-x" onClick={closeIt}>{tx('إلغاء')}</button>
          </div>

          <div className="so-body">
            {term.length < 2 ? (
              <>
                {recent.length ? (
                  <section className="so-sec">
                    <div className="so-h"><h4>{tx('آخر عمليات بحثك')}</h4><button type="button" className="so-link" onClick={clearRecent}>{tx('مسح الكل')}</button></div>
                    <div className="so-chips">
                      {recent.map((t) => (
                        <span key={t} className="so-chip">
                          <button type="button" onClick={() => go(t)}>{t}</button>
                          <button type="button" className="so-cx" aria-label={tx('حذف')} onClick={() => dropRecent(t)}>✕</button>
                        </span>
                      ))}
                    </div>
                  </section>
                ) : null}
                <section className="so-sec">
                  <div className="so-h"><h4>{tx('الأكثر طلباً')}</h4></div>
                  {popular === null ? <div className="so-em">{tx('جاري التحميل...')}</div> : popular.length ? (
                    <div className="so-grid">{popular.map((p) => <Card key={p.id} p={p} />)}</div>
                  ) : <div className="so-em">{tx('اكتب اسم المنتج اللي بتدوّر عليه')}</div>}
                </section>
              </>
            ) : (
              <section className="so-sec">
                {items.length ? <div className="so-grid">{items.map((p) => <Card key={p.id} p={p} />)}</div> : <div className="so-em">{busy ? tx('جاري البحث...') : tx('لا توجد نتائج')}</div>}
                <button type="button" className="so-all" onClick={() => go(term)}>{tx('عرض كل النتائج عن «{1}» ←', [term])}</button>
              </section>
            )}
          </div>
        </div>,
        host
      ) : null}
    </div>
  );
}
