'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useShop, hit } from './StoreContext';
import { track } from './tracker';
import { soldOut } from './ui';
import { flyToCart } from './fly';
import SizeHelp from './SizeFinder';
import { chartFor, isSizeGroup } from '../../lib/sizeFinder';
import { money, effectivePrice } from '../../lib/storeKit';

/* تسوّق الإطلالة: صف موديلز، ضغطة على إطلالة تعرض قطعها بمقاس لكل قطعة، وزر «أضف الإطلالة كاملة» بإجمالي السعر. */

const Thumb = ({ p, cls }) => (p.images && p.images[0] ? <img className={cls} src={p.images[0]} alt="" loading="lazy" decoding="async" /> : <span className={cls + ' ph'}>{(p.title || '?').charAt(0)}</span>);

export default function LooksView({ looks = [], title = '' }) {
  const { slug, cfg, cur, base, add, count } = useShop();
  const router = useRouter();
  const [sel, setSel] = useState(0);
  const [opts, setOpts] = useState({});
  const [skip, setSkip] = useState({});
  const [done, setDone] = useState('');
  const [busy, setBusy] = useState(false);
  const look = looks[Math.min(sel, looks.length - 1)];

  useEffect(() => { setOpts({}); setSkip({}); setDone(''); }, [look && look.id]);
  useEffect(() => { if (!done) return undefined; const t = setTimeout(() => setDone(''), 7000); return () => clearTimeout(t); }, [done]);
  useEffect(() => { if (look) { try { hit(slug, 'look', { look: look.id }); } catch { /* تجاهل */ } } }, [look && look.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const items = look ? look.products : [];
  const status = useMemo(() => items.map((p) => {
    const groups = p.variants || [];
    const o = opts[p.id] || {};
    const missing = groups.filter((g) => !o[g.name]);
    return { p, o, sold: soldOut(p), off: !!skip[p.id], missing };
  }), [items, opts, skip]);
  const active = status.filter((s) => !s.sold && !s.off);
  const total = active.reduce((a, s) => a + effectivePrice(s.p), 0);
  const need = active.find((s) => s.missing.length);

  const openCart = () => { if (cfg.cart?.drawer === false) router.push(`${base}/cart`); else window.dispatchEvent(new Event('spike:cart-open')); };
  const setOpt = (p, g, v) => setOpts((c) => ({ ...c, [p.id]: { ...(c[p.id] || {}), [g.name]: v } }));
  const pushLine = (s) => {
    const price = effectivePrice(s.p);
    add({ product_id: s.p.id, title: s.p.title, image: s.p.images[0] || '', price, qty: 1, options: s.o });
    track('AddToCart', { value: price, items: [{ id: s.p.id, title: s.p.title, price, qty: 1 }] });
    hit(slug, 'cart', { product: String(s.p.id) });
  };
  const reduce = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const addOne = (s) => {
    if (s.missing.length || s.sold || busy) return;
    flyToCart(document.querySelector(`[data-lk="${s.p.id}"] img`), s.p.images[0]);
    pushLine(s);
    setDone(`«${s.p.title}»`);
  };
  const addAll = () => {
    if (need || !active.length || busy) return;
    setBusy(true);
    flyToCart(document.querySelector('.lk-main img'), (active[0].p.images || [])[0]);
    setTimeout(() => {
      active.forEach(pushLine);
      setDone(`الإطلالة كاملة (${active.length} قطع)`);
      setBusy(false);
    }, reduce() ? 0 : 380);
  };

  if (!look) return null;
  return (
    <div className="lk">
      <div className="lk-top">
        {title ? <h2>{title}</h2> : null}
        <button type="button" className="lk-cart" data-fly-target="1" onClick={openCart} aria-label="السلة">🛒 <span className="num">{count}</span></button>
      </div>
      {looks.length > 1 && (
        <div className="lk-line" role="tablist" aria-label="الإطلالات">
          {looks.map((l, i) => (
            <button key={l.id} type="button" role="tab" aria-selected={i === sel} className={i === sel ? 'on' : ''} onClick={() => setSel(i)}>
              {l.image ? <img src={l.image} alt="" loading="lazy" decoding="async" /> : <Thumb p={l.products[0]} cls="" />}
              <span>{l.name}</span>
            </button>
          ))}
        </div>
      )}
      <div className="lk-grid">
        <div className="lk-main" key={look.id}>
          {look.image ? <img src={look.image} alt={look.name} decoding="async" /> : <div className="lk-collage">{look.products.slice(0, 4).map((p) => <Thumb key={p.id} p={p} cls="" />)}</div>}
        </div>
        <div className="lk-side">
          <div className="lk-k">في هذه الإطلالة · {items.length} قطع</div>
          <h3>{look.name}</h3>
          {look.note ? <p className="lk-note">{look.note}</p> : null}
          <div className="lk-list">
            {status.map((s) => {
              const { p } = s;
              const chart = chartFor(cfg.sizing, p);
              return (
                <div key={p.id} className={'lk-it' + (s.off ? ' off' : '') + (s.sold ? ' so' : '')} data-lk={p.id}>
                  <Link href={`${base}/p/${p.id}`} className="lk-th"><Thumb p={p} cls="" /></Link>
                  <div className="lk-bd">
                    <div className="lk-nm">{p.title}</div>
                    <div className="lk-pr num">{money(effectivePrice(p), cur)}</div>
                    {s.sold ? <div className="lk-sold">نفدت الكمية</div> : (p.variants || []).map((g) => (
                      <div key={g.name} className="lk-opt">
                        <div className="lk-chips">
                          {g.values.map((v) => <button key={v} type="button" className={(s.o[g.name] === v ? 'sel' : '')} onClick={() => setOpt(p, g, v)} aria-pressed={s.o[g.name] === v}>{v}</button>)}
                        </div>
                        {chart && isSizeGroup(g.name) ? <SizeHelp chart={chart} values={g.values} onPick={(v) => setOpt(p, g, v)} /> : null}
                      </div>
                    ))}
                  </div>
                  {!s.sold && (
                    <div className="lk-ac">
                      <button type="button" className="lk-add" disabled={!!s.missing.length} onClick={() => addOne(s)} aria-label={`أضف ${p.title} للسلة`} title={s.missing.length ? `اختر ${s.missing[0].name}` : 'أضف للسلة'}>+</button>
                      <label className="lk-in"><input type="checkbox" checked={!s.off} onChange={() => setSkip((c) => ({ ...c, [p.id]: !c[p.id] }))} /><span>ضمن الإطلالة</span></label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="lk-ft">
            <div className="lk-tot"><span>الإجمالي</span><b className="num">{money(total, cur)}</b></div>
            <button type="button" className={'lk-all' + (done.startsWith('الإطلالة') ? ' ok' : '')} disabled={!active.length || !!need || busy} onClick={addAll}>
              {busy ? <span className="ob-spin" /> : need ? `اختر ${need.missing[0].name} لـ «${need.p.title}»` : !active.length ? 'لا توجد قطع متاحة' : '🛍️ أضف الإطلالة كاملة للسلة'}
            </button>
            {done ? <div className="ob-added" role="status"><span>✓ تمت إضافة {done} للسلة</span><button type="button" onClick={openCart}>عرض السلة ←</button></div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
