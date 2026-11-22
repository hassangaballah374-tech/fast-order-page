'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useBrowseCart } from './browseKit';
import { soldOut } from './ui';
import { useFavs } from './favs';
import { money, effectivePrice, priceRange, saleActive, swatchGroup, isHttpUrl } from '../../lib/storeKit';

/* شبكة «المتجر»: بلاطات صور متلاصقة بنسبة 4:5، تبديل الصورة عند المرور (على الكمبيوتر)، زر «+» لإضافة سريعة بالمقاس،
   تحكم في كثافة الشبكة (٢/٣/٤ أعمدة)، وظهور تدريجي أثناء التمرير. بتجمع أنماط البيع المعروفة في متاجر الرياضة، بهوية سبايك. */
const NEW_DAYS = 14;
const ts = (p) => new Date(p.created_at).getTime() || 0;
const STEP = 12;

function Tile({ p, cart, idx, fresh }) {
  const { base, cur, slug } = cart;
  const fav = useFavs(slug);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') { setSeen(true); return undefined; }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setSeen(true); io.disconnect(); } }, { rootMargin: '120px' });
    io.observe(el); return () => io.disconnect();
  }, []);
  const rg = priceRange(p); const price = effectivePrice(p);
  const onSale = !rg.varies && saleActive(p) && p.compare_price > price;
  const off = onSale ? Math.round((1 - price / p.compare_price) * 100) : 0;
  const out = soldOut(p);
  const sg = swatchGroup(p);
  const groups = p.variants || [];
  const single = groups.length === 1 ? groups[0] : null;
  const colors = sg ? sg.values.filter((v) => isHttpUrl(sg.images[v])).length : 0;
  const href = `${base}/p/${p.id}`;
  const sel = `.sg-t[data-id="${String(p.id).replace(/"/g, '')}"] .sg-i img`;
  const plus = () => {
    if (out) return;
    if (!groups.length) { cart.quickAdd(p, sel); return; }
    setOpen((v) => !v);
  };
  const justAdded = cart.added && cart.added.id === p.id;
  useEffect(() => { if (justAdded) { const t = setTimeout(() => setOpen(false), 900); return () => clearTimeout(t); } return undefined; }, [justAdded]);

  return (
    <div className={'sg-t' + (seen ? ' in' : '')} ref={ref} data-id={p.id} style={{ '--d': `${(idx % 4) * 60}ms` }} onMouseLeave={() => setOpen(false)}>
      <div className="sg-i">
        <Link href={href} aria-label={p.title} className="sg-l">
          {p.images[0] ? <img src={p.images[0]} alt={p.title} loading="lazy" /> : <span className="sg-ph">{(p.title || '?').charAt(0)}</span>}
          {p.images[1] ? <img className="sg-h" src={p.images[1]} alt="" loading="lazy" aria-hidden="true" /> : null}
        </Link>
        <div className="sg-bd">
          {out ? <span className="so">نفدت الكمية</span> : off > 0 ? <span className="sale">خصم {off}%</span> : fresh ? <span>جديد</span> : null}
        </div>
        <button type="button" className={'sg-fav' + (fav.has(p.id) ? ' on' : '')} aria-label="المفضلة" aria-pressed={fav.has(p.id)} onClick={() => fav.toggle(p.id)}>{fav.has(p.id) ? '♥' : '♡'}</button>
        {!out ? (
          <button type="button" className={'sg-plus' + (open ? ' on' : '') + (justAdded ? ' ok' : '')} aria-label={groups.length ? 'اختر المقاس' : 'أضف للسلة'} aria-expanded={open} onClick={plus}>
            {cart.busy.startsWith(`${p.id}|`) ? <span className="ob-spin" /> : justAdded ? '✓' : open ? '✕' : '+'}
          </button>
        ) : null}
        {open && !out ? (
          <div className="sg-q" role="group" aria-label="إضافة سريعة">
            {single ? (
              <>
                <b>{single.name}</b>
                <div className="sg-sz">{single.values.map((v) => <button key={v} type="button" onClick={() => cart.pick(p, single, v, sel)}>{v}</button>)}</div>
              </>
            ) : <Link href={href} className="sg-more">اختر الخيارات ←</Link>}
          </div>
        ) : null}
      </div>
      <Link href={href} className="sg-b">
        <b className="sg-n">{p.title}</b>
        {colors > 1 ? <span className="sg-c">{colors} ألوان</span> : null}
        <span className="sg-p num">{rg.varies ? <small>من </small> : null}{money(rg.min, cur)}{onSale ? <s>{money(p.compare_price, cur)}</s> : null}</span>
      </Link>
    </div>
  );
}

export default function StoreGridView({ list = [] }) {
  const cart = useBrowseCart();
  const [cols, setCols] = useState(0); /* 0 = تلقائي */
  const [n, setN] = useState(STEP);
  useEffect(() => { try { const v = Number(localStorage.getItem('spk_sg_cols')); if ([2, 3, 4].includes(v)) setCols(v); } catch { /* تجاهل */ } }, []);
  const setC = (v) => { setCols(v); try { localStorage.setItem('spk_sg_cols', String(v)); } catch { /* تجاهل */ } };
  useEffect(() => { setN(STEP); }, [list]);
  /* «جديد» بس لأحدث 6 منتجات ومن آخر أسبوعين، عشان الشارة تفضل ليها معنى */
  const fresh = useMemo(() => new Set([...list].filter((p) => Date.now() - ts(p) < NEW_DAYS * 86400_000).sort((a, b) => ts(b) - ts(a)).slice(0, 6).map((p) => p.id)), [list]);
  const shown = useMemo(() => list.slice(0, n), [list, n]);
  if (!list.length) return <div className="wrap"><div className="empty">مفيش منتجات هنا.</div></div>;
  return (
    <div className="sg">
      <div className="sg-bar wrap">
        <span className="mut num">{list.length} منتج</span>
        <span className="sg-den" role="group" aria-label="عدد الأعمدة">
          {[2, 3, 4].map((c) => <button key={c} type="button" className={'sg-d' + (cols === c ? ' on' : '')} aria-pressed={cols === c} aria-label={`${c} أعمدة`} onClick={() => setC(cols === c ? 0 : c)}>{'▮'.repeat(c)}</button>)}
        </span>
      </div>
      <div className={'sg-g' + (cols ? ` c${cols}` : '')}>{shown.map((p, i) => <Tile key={p.id} p={p} cart={cart} idx={i} fresh={fresh.has(p.id)} />)}</div>
      {n < list.length ? <div className="sg-mr"><button type="button" className="b" onClick={() => setN((x) => x + STEP)}>عرض المزيد ({list.length - n})</button></div> : null}
    </div>
  );
}
