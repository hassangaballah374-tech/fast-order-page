'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useShop, hit } from './StoreContext';
import { track } from './tracker';
import { soldOut } from './ui';
import { flyToCart } from './fly';
import { lockScroll } from './scrollLock';
import SizeHelp from './SizeFinder';
import { chartFor, isSizeGroup } from '../../lib/sizeFinder';
import FlipPic from './FlipPic';
import { money, effectivePrice, unitPrice, priceRange, saleActive, splitImages } from '../../lib/storeKit';

/* أجزاء مشتركة بين تخطيطات التصفح (رف الشماعات، شبكة الخلط...):
   منطق الإضافة للسلة + تأثير الطيران، لوحة اختيار المقاس السريعة، والعرض المركّز للمنتج. */

export const pad2 = (n) => String(n).padStart(2, '0');

export function Ph({ p }) {
  return <span className="ob-ph">{(p.title || '?').trim().charAt(0)}</span>;
}

export function useBrowseCart() {
  const { slug, cfg, cur, base, add, count } = useShop();
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [added, setAdded] = useState(null);
  useEffect(() => { if (!added) return undefined; const t = setTimeout(() => setAdded(null), 6000); return () => clearTimeout(t); }, [added]);
  const reduce = () => !!(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const openCart = () => { if (cfg.cart?.drawer === false) router.push(`${base}/cart`); else window.dispatchEvent(new Event('spike:cart-open')); };
  const addLine = (p, opts, label, srcSel) => {
    if (soldOut(p)) return;
    const price = unitPrice(p, opts);
    if (srcSel) flyToCart(document.querySelector(srcSel), p.images[0]);
    add({ product_id: p.id, title: p.title, image: p.images[0] || '', price, qty: 1, options: opts });
    track('AddToCart', { value: price, items: [{ id: p.id, title: p.title, price, qty: 1 }] });
    hit(slug, 'cart', { product: String(p.id) });
    setAdded({ id: p.id, label });
    setBusy('');
  };
  const later = (fn) => setTimeout(fn, reduce() ? 0 : 420);
  const pick = (p, g, v, srcSel) => { if (busy || soldOut(p)) return; setBusy(`${p.id}|${v}`); later(() => addLine(p, { [g.name]: v }, v, srcSel)); };
  const quickAdd = (p, srcSel) => { if (busy || soldOut(p)) return; setBusy(`${p.id}|*`); later(() => addLine(p, {}, '', srcSel)); };
  const addMulti = (p, opts, srcSel) => { if (busy || soldOut(p)) return; setBusy(`${p.id}|F`); later(() => addLine(p, opts, Object.values(opts).join(' / '), srcSel)); };
  return { slug, cfg, cur, base, count, busy, added, openCart, pick, quickAdd, addMulti, reduce };
}

export function PriceEl({ p, cur }) {
  const rg = priceRange(p);
  const price = effectivePrice(p);
  const onSale = !rg.varies && saleActive(p) && p.compare_price > price;
  return <div className="ob-price num">{rg.varies ? <small style={{ fontWeight: 600, marginInlineEnd: 4 }}>من</small> : null}{money(rg.min, cur)}{onSale ? <s>{money(p.compare_price, cur)}</s> : null}</div>;
}

export function AddedLine({ p, cart }) {
  const a = cart.added;
  if (!a || a.id !== p.id) return null;
  return (
    <div className="ob-added" role="status">
      <span>✓ تمت إضافة «{p.title}»{a.label ? ` · ${a.label}` : ''} للسلة</span>
      <button type="button" onClick={cart.openCart}>عرض السلة ←</button>
    </div>
  );
}

/* لوحة تحت المنتج النشط: مقاسات بضغطة واحدة / زر إضافة / فتح العرض المركّز */
export function QuickPick({ p, cart, srcSel, onMore }) {
  const { cfg, busy, added, pick, quickAdd } = { ...cart };
  const groups = p.variants || [];
  const chart = chartFor(cfg.sizing, p);
  const sold = soldOut(p);
  const just = added && added.id === p.id;
  return (
    <div className="ob-pick">
      {sold ? <div className="ob-sold">نفدت الكمية حالياً</div> : groups.length === 1 ? (
        <>
          <div className="ob-lbl">اختر {groups[0].name} · ضغطة واحدة تضيف للسلة</div>
          <div className="ob-sz">
            {groups[0].values.map((v) => (
              <button key={v} type="button" className={busy === `${p.id}|${v}` ? 'ld' : (just && added.label === v ? 'ok' : '')} onClick={() => pick(p, groups[0], v, srcSel)}>
                {busy === `${p.id}|${v}` ? <span className="ob-spin" /> : v}
              </button>
            ))}
          </div>
          {chart && isSizeGroup(groups[0].name) ? <SizeHelp chart={chart} values={groups[0].values} onPick={(v) => pick(p, groups[0], v, srcSel)} /> : null}
        </>
      ) : groups.length === 0 ? (
        <button type="button" className={'ob-add' + (just ? ' ok' : '')} onClick={() => quickAdd(p, srcSel)}>
          {busy === `${p.id}|*` ? <span className="ob-spin" /> : just ? 'تمت الإضافة للسلة ✓' : '🛒 أضف للسلة'}
        </button>
      ) : (
        <button type="button" className="ob-add" onClick={onMore}>اختر الخيارات</button>
      )}
      <AddedLine p={p} cart={cart} />
    </div>
  );
}

/* العرض المركّز: صورة كبيرة + تفاصيل + اختيارات + صور مصغّرة وأسهم */
export function FocusSheet({ list, idx, onGo, onClose, cart }) {
  const { cfg, cur, base, count, busy, added, openCart, addMulti } = cart;
  const p = list[idx];
  const n = list.length;
  const gi = splitImages(p, cfg?.browse?.flip !== false);
  const [fopts, setFopts] = useState({});
  const [imgI, setImgI] = useState(0);
  const [swap, setSwap] = useState(0);
  useEffect(() => lockScroll(), []);
  useEffect(() => { setFopts({}); setImgI(0); setSwap((s) => s + 1); }, [idx]);
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  useEffect(() => {
    try { const price = effectivePrice(p); track('ViewContent', { value: price, items: [{ id: p.id, title: p.title, price, qty: 1 }] }); hit(cart.slug, 'pview', { product: String(p.id) }); } catch { /* تجاهل */ }
  }, [p.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const groups = p.variants || [];
  const chart = chartFor(cfg.sizing, p);
  const sold = soldOut(p);
  const just = added && added.id === p.id;
  const needed = groups.filter((g) => !fopts[g.name]);
  const fBusy = busy === `${p.id}|F`;
  return (
    <div className="ob-focus" role="dialog" aria-modal="true" aria-label={p.title}>
      <button type="button" className="ob-x" onClick={onClose}>إغلاق ✕</button>
      <button type="button" className="ob-cartp" data-fly-target="1" onClick={openCart} aria-label="السلة">🛒 <span className="num">{count}</span></button>
      <div className="ob-fgrid">
        <div className="ob-fimg">
          <FlipPic key={`${p.id}-${swap}`} className="ob-fpic" front={gi.list[imgI]} back={imgI === 0 ? gi.back : ''} alt={p.title}>
            {!gi.list[imgI] ? <Ph p={p} /> : null}
            <i className="ob-sh big" />
          </FlipPic>
          {gi.list.length > 1 && <div className="ob-dots">{gi.list.map((_, k) => <button key={k} type="button" className={k === imgI ? 'on' : ''} aria-label={`صورة ${k + 1}`} onClick={() => setImgI(k)} />)}</div>}
        </div>
        <div className="ob-finfo" key={`i-${p.id}`}>
          <h2>{p.title}</h2>
          <PriceEl p={p} cur={cur} />
          {sold ? <div className="ob-sold">نفدت الكمية حالياً</div> : null}
          {groups.map((g) => (
            <div className="ob-grp" key={g.name}>
              <div className="ob-gh"><span>{g.name}</span><b>{fopts[g.name] || ''}</b></div>
              <div className="ob-sz">
                {g.values.map((v) => <button key={v} type="button" className={fopts[g.name] === v ? 'sel' : ''} disabled={sold} onClick={() => setFopts({ ...fopts, [g.name]: v })}>{v}</button>)}
              </div>
              {chart && isSizeGroup(g.name) ? <SizeHelp chart={chart} values={g.values} onPick={(v) => setFopts((o) => ({ ...o, [g.name]: v }))} /> : null}
            </div>
          ))}
          <button type="button" className={'ob-add' + (just ? ' ok' : '') + (needed.length || sold ? ' dis' : '')} disabled={sold}
            onClick={() => { if (!needed.length) addMulti(p, { ...fopts }, '.ob-focus .ob-fpic img'); }}>
            {fBusy ? <span className="ob-spin" /> : just ? 'تمت الإضافة للسلة ✓' : needed.length ? `اختر ${needed[0].name}` : '🛒 أضف للسلة'}
          </button>
          <div className="ob-fl2">
            {just ? <button type="button" onClick={openCart}>عرض السلة ←</button> : null}
            <Link className="ob-lnk" href={`${base}/p/${p.id}`}>عرض كل التفاصيل ←</Link>
          </div>
        </div>
      </div>
      <div className="ob-fbar">
        <div className="ob-ths">
          {list.map((it, i) => (
            <button key={it.id} type="button" className={i === idx ? 'on' : ''} onClick={() => onGo(i)} aria-label={it.title}>
              {it.images[0] ? <img src={it.images[0]} alt="" loading="lazy" /> : <Ph p={it} />}
            </button>
          ))}
        </div>
        <div className="ob-nav">
          <button type="button" onClick={() => onGo(idx - 1)} disabled={idx <= 0} aria-label="السابق">→</button>
          <span className="num" dir="ltr">{pad2(idx + 1)} / {pad2(n)}</span>
          <button type="button" className="dk" onClick={() => onGo(idx + 1)} disabled={idx >= n - 1} aria-label="التالي">←</button>
        </div>
      </div>
    </div>
  );
}
