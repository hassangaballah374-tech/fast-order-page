'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useShop } from './StoreContext';

/* مربع بحث في الهيدر مع اقتراحات فورية */
export default function SearchBox() {
  const { slug, base, cur } = useShop();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [mob, setMob] = useState(false);
  const [busy, setBusy] = useState(false);
  const box = useRef(null);
  const seq = useRef(0);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setItems([]); setBusy(false); return undefined; }
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
  }, [q, slug]);

  useEffect(() => {
    const away = (e) => { if (box.current && !box.current.contains(e.target)) { setOpen(false); setMob(false); } };
    document.addEventListener('mousedown', away);
    document.addEventListener('touchstart', away);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('touchstart', away); };
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    setOpen(false); setMob(false);
    router.push(`${base}/products?q=${encodeURIComponent(term)}`);
  };
  const done = () => { setOpen(false); setMob(false); setQ(''); };

  return (
    <div className={'sbx' + (mob ? ' mob' : '')} ref={box}>
      <button type="button" className="sbx-ic" aria-label="بحث" onClick={() => setMob((v) => !v)}>🔍</button>
      <form className="sbx-f" onSubmit={submit} role="search">
        <input className="sbx-in" value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder="ابحث عن منتج..." aria-label="ابحث عن منتج" autoComplete="off" />
      </form>
      {open && q.trim().length >= 2 ? (
        <div className="sbx-dd">
          {items.map((p) => (
            <Link key={p.id} href={`${base}/p/${p.id}`} className="sbx-it" onClick={done}>
              {p.image ? <img src={p.image} alt="" loading="lazy" /> : <span className="sbx-ph" />}
              <span className="sbx-tt">{p.title}</span>
              <b className="num">{Math.round(p.price)} {cur}</b>
            </Link>
          ))}
          {!items.length ? <div className="sbx-em">{busy ? 'جاري البحث...' : 'لا توجد نتائج'}</div> : null}
          <Link href={`${base}/products?q=${encodeURIComponent(q.trim())}`} className="sbx-all" onClick={done}>عرض كل النتائج ←</Link>
        </div>
      ) : null}
    </div>
  );
}
