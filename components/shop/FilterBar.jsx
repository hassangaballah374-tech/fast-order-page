'use client';
import React, { useEffect, useMemo, useState } from 'react';
import BrowseView from './BrowseView';
import { useShop } from './StoreContext';
import { soldOut } from './ui';
import { effectivePrice, valueSoldOut } from '../../lib/storeKit';
import { lockScroll } from './scrollLock';

/* تصفية المنتجات في صفحة «كل المنتجات»: السعر، المقاس/اللون/أي خيار، المتاح فقط، والتخفيضات.
   التصفية بتحصل في المتصفح على القائمة المحمّلة، فهي فورية. الخيارات بتتجمع من منتجات المتجر نفسها. */
const norm = (v) => String(v || '').trim();
const isColor = (n) => /لون|color|colour/i.test(n);
const onSale = (p) => Number(p.compare_price) > effectivePrice(p);

function facets(list) {
  const groups = new Map();
  for (const p of list) {
    for (const g of Array.isArray(p.variants) ? p.variants : []) {
      const gn = norm(g.name); if (!gn) continue;
      if (!groups.has(gn)) groups.set(gn, new Map());
      const m = groups.get(gn);
      for (const v of g.values || []) { const k = norm(v); if (!k) continue; if (!valueSoldOut(g, v)) m.set(k, (m.get(k) || 0) + 1); else if (!m.has(k)) m.set(k, 0); }
    }
  }
  return [...groups.entries()].map(([name, m]) => ({ name, values: [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 24) })).slice(0, 4);
}

export default function FilterBar({ list = [], style = 'grid' }) {
  const { cur } = useShop();
  const fac = useMemo(() => facets(list), [list]);
  const prices = useMemo(() => list.map((p) => effectivePrice(p)).filter((n) => n > 0), [list]);
  const lo = prices.length ? Math.floor(Math.min(...prices)) : 0;
  const hi = prices.length ? Math.ceil(Math.max(...prices)) : 0;
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ min: '', max: '', avail: false, sale: false, opts: {} });
  const [draft, setDraft] = useState(f);

  useEffect(() => { if (!open) return undefined; const un = lockScroll(); const k = (e) => e.key === 'Escape' && setOpen(false); window.addEventListener('keydown', k); return () => { un(); window.removeEventListener('keydown', k); }; }, [open]);

  const shown = useMemo(() => list.filter((p) => {
    const price = effectivePrice(p);
    if (f.min !== '' && price < Number(f.min)) return false;
    if (f.max !== '' && price > Number(f.max)) return false;
    if (f.avail && soldOut(p)) return false;
    if (f.sale && !onSale(p)) return false;
    for (const [gn, vals] of Object.entries(f.opts)) {
      if (!vals.length) continue;
      const g = (p.variants || []).find((x) => norm(x.name) === gn);
      if (!g) return false;
      if (!vals.some((v) => (g.values || []).some((x) => norm(x) === v && !valueSoldOut(g, x)))) return false;
    }
    return true;
  }), [list, f]);

  const count = (f.min !== '' || f.max !== '' ? 1 : 0) + (f.avail ? 1 : 0) + (f.sale ? 1 : 0) + Object.values(f.opts).reduce((a, v) => a + v.length, 0);
  const tog = (gn, v) => setDraft((d) => { const cur0 = d.opts[gn] || []; const next = cur0.includes(v) ? cur0.filter((x) => x !== v) : [...cur0, v]; return { ...d, opts: { ...d.opts, [gn]: next } }; });
  const apply = () => { setF(draft); setOpen(false); };
  const reset = () => { const e = { min: '', max: '', avail: false, sale: false, opts: {} }; setDraft(e); setF(e); setOpen(false); };
  const chips = [
    ...(f.min !== '' || f.max !== '' ? [['price', `${f.min || lo} – ${f.max || hi} ${cur}`]] : []),
    ...(f.avail ? [['avail', 'المتاح فقط']] : []), ...(f.sale ? [['sale', 'تخفيضات']] : []),
    ...Object.entries(f.opts).flatMap(([gn, vs]) => vs.map((v) => [`o:${gn}:${v}`, v])),
  ];
  const drop = (k) => setF((c) => {
    if (k === 'price') return { ...c, min: '', max: '' };
    if (k === 'avail') return { ...c, avail: false };
    if (k === 'sale') return { ...c, sale: false };
    const [, gn, v] = k.split(':'); return { ...c, opts: { ...c.opts, [gn]: (c.opts[gn] || []).filter((x) => x !== v) } };
  });
  const canFilter = fac.length > 0 || hi > lo || list.some(onSale) || list.some(soldOut);
  if (!canFilter) return <BrowseView style={style} list={list} />;

  return (
    <>
      <div className="wrap fb-bar">
        <button type="button" className="chip fb-btn" onClick={() => { setDraft(f); setOpen(true); }} aria-haspopup="dialog">تصفية{count ? <b className="fb-n num">{count}</b> : null}</button>
        {chips.map(([k, l]) => <button key={k} type="button" className="chip act fb-x" onClick={() => drop(k)} aria-label={`إزالة ${l}`}>{l} ✕</button>)}
        {count ? <span className="mut fb-c">{shown.length} من {list.length} منتج</span> : null}
      </div>
      {shown.length ? <BrowseView key={`${style}|${count}|${JSON.stringify(f)}`} style={style} list={shown} /> : (
        <div className="wrap"><div className="card fb-empty"><p>مفيش منتجات بالتصفية دي.</p><button type="button" className="b p" onClick={reset}>مسح التصفية</button></div></div>
      )}
      {open ? (
        <div className="fb-ov" role="dialog" aria-modal="true" aria-label="تصفية المنتجات" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="fb-sh">
            <div className="fb-hd"><b>تصفية المنتجات</b><button type="button" className="fb-cl" onClick={() => setOpen(false)} aria-label="إغلاق">✕</button></div>
            <div className="fb-bd">
              {hi > lo ? (
                <fieldset className="fb-g"><legend>السعر ({cur})</legend>
                  <div className="fb-pr">
                    <input className="in num" inputMode="numeric" dir="ltr" placeholder={String(lo)} value={draft.min} onChange={(e) => setDraft({ ...draft, min: e.target.value.replace(/\D/g, '') })} aria-label="أقل سعر" />
                    <span>إلى</span>
                    <input className="in num" inputMode="numeric" dir="ltr" placeholder={String(hi)} value={draft.max} onChange={(e) => setDraft({ ...draft, max: e.target.value.replace(/\D/g, '') })} aria-label="أعلى سعر" />
                  </div>
                </fieldset>
              ) : null}
              {fac.map((g) => (
                <fieldset className="fb-g" key={g.name}><legend>{g.name}</legend>
                  <div className="chips">
                    {g.values.map(([v, n]) => { const on = (draft.opts[g.name] || []).includes(v); return <button key={v} type="button" aria-pressed={on} disabled={n === 0 && !on} className={'chip' + (on ? ' act' : '') + (isColor(g.name) ? ' fb-col' : '')} onClick={() => tog(g.name, v)}>{v}</button>; })}
                  </div>
                </fieldset>
              ))}
              <fieldset className="fb-g"><legend>أخرى</legend>
                <label className="fb-ck"><input type="checkbox" checked={draft.avail} onChange={(e) => setDraft({ ...draft, avail: e.target.checked })} /> المتاح فقط</label>
                {list.some(onSale) ? <label className="fb-ck"><input type="checkbox" checked={draft.sale} onChange={(e) => setDraft({ ...draft, sale: e.target.checked })} /> عليه تخفيض</label> : null}
              </fieldset>
            </div>
            <div className="fb-ft"><button type="button" className="b" onClick={reset}>مسح الكل</button><button type="button" className="b p" onClick={apply}>عرض النتائج</button></div>
          </div>
        </div>
      ) : null}
    </>
  );
}
