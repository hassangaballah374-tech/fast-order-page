'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useShop, hit } from './StoreContext';
import { track } from './tracker';
import { soldOut } from './ui';
import { flyToCart } from './fly';
import { lockScroll } from './scrollLock';
import FlipPic from './FlipPic';
import SizeHelp from './SizeFinder';
import { chartFor, isSizeGroup } from '../../lib/sizeFinder';
import { money, effectivePrice, unitPrice, overridePrice, priceRange, saleActive, splitImages } from '../../lib/storeKit';

/* عرض «المدار»: المنتجات بتدور على مسار منحني، والعميل بيسحب العجلة (أو الشاشة) عشان يتنقل.
   ضغطة على مقاس = إضافة للسلة، وضغطة على المنتج الأوسط بتفتح العرض المركّز. */

const pad = (n) => String(n).padStart(2, '0');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function Ph({ p }) {
  return <span className="ob-ph">{(p.title || '?').trim().charAt(0)}</span>;
}

export default function OrbitView({ list = [] }) {
  const { slug, cfg, cur, base, add, count } = useShop();
  const router = useRouter();
  const n = list.length;

  const stageRef = useRef(null);
  const trackRef = useRef(null);
  const [dim, setDim] = useState({ w: 1000, rtl: true });
  const [pos, setPos] = useState(0);
  const posRef = useRef(0);
  const raf = useRef(0);
  const drag = useRef(null);
  const moved = useRef(false);
  const reduce = useRef(false);

  const [focus, setFocus] = useState(false);
  const [busy, setBusy] = useState('');
  const [added, setAdded] = useState(null);
  const [fopts, setFopts] = useState({});
  const [swap, setSwap] = useState(0);
  const [imgI, setImgI] = useState(0);
  const [flipId, setFlipId] = useState('');

  const idx = n ? clamp(Math.round(pos), 0, n - 1) : 0;
  const cur0 = list[idx];

  /* قياس المنصة والاتجاه */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    reduce.current = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const m = () => setDim({ w: el.clientWidth || 1000, rtl: getComputedStyle(el).direction === 'rtl' });
    m();
    let ro;
    try { ro = new ResizeObserver(m); ro.observe(el); } catch { window.addEventListener('resize', m); }
    return () => { try { ro && ro.disconnect(); } catch { /* تجاهل */ } window.removeEventListener('resize', m); cancelAnimationFrame(raf.current); };
  }, []);

  const setBoth = useCallback((v) => { posRef.current = v; setPos(v); }, []);
  const glide = useCallback((to) => {
    cancelAnimationFrame(raf.current);
    const t = clamp(Math.round(to), 0, Math.max(0, n - 1));
    if (reduce.current) { setBoth(t); return; }
    const step = () => {
      const c = posRef.current; const d = t - c;
      if (Math.abs(d) < 0.003) { setBoth(t); return; }
      setBoth(c + d * 0.17);
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }, [n, setBoth]);

  /* تغيّر المنتج النشط: صفّر اختيارات العرض المركّز وأعد ضبط الصورة */
  useEffect(() => { setFopts({}); setImgI(0); setSwap((s) => s + 1); setBusy(''); setFlipId(''); }, [idx]);
  useEffect(() => { if (!added) return undefined; const t = setTimeout(() => setAdded(null), 6000); return () => clearTimeout(t); }, [added]);

  /* هندسة المدار */
  const { w, rtl } = dim;
  const mobile = w < 700;
  const H = mobile ? 560 : clamp(Math.round(w * 0.5), 520, 640);
  const S = mobile ? Math.round(w * 0.58) : Math.round(Math.min(H * 0.5, w * 0.3));
  const sx = mobile ? S * 0.66 : S * 0.8;
  const sy = mobile ? S * 0.42 : S * 0.5;
  const kc = sy * 0.2;
  const s = rtl ? -1 : 1;
  const cx = mobile ? w * 0.5 : (rtl ? w * 0.37 : w * 0.63);
  const cy = mobile ? H * 0.56 : H * 0.55;
  const at = (d) => ({ x: cx + s * d * sx, y: cy - d * sy + d * d * kc });
  const curve = (() => {
    const pts = [];
    for (let d = -3.6; d <= 3.61; d += 0.3) { const q = at(d); pts.push(`${pts.length ? 'L' : 'M'}${q.x.toFixed(1)} ${q.y.toFixed(1)}`); }
    return pts.join(' ');
  })();

  /* سحب المنصة */
  const onDown = (e) => {
    if (e.target.closest('.ob-trk') || n < 2) return;
    cancelAnimationFrame(raf.current);
    drag.current = { x: e.clientX, p: posRef.current, cap: false, id: e.pointerId };
    moved.current = false;
  };
  const onMove = (e) => {
    const d = drag.current; if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.cap && Math.abs(dx) > 6) { d.cap = true; moved.current = true; try { e.currentTarget.setPointerCapture(d.id); } catch { /* تجاهل */ } }
    if (d.cap) setBoth(clamp(d.p - (s * dx) / sx, -0.35, n - 0.65));
  };
  const onUp = () => {
    const d = drag.current; drag.current = null;
    if (d && d.cap) { glide(posRef.current); setTimeout(() => { moved.current = false; }, 0); }
  };

  /* سحب العجلة */
  const TH = 46;
  const trackW = Math.min(520, Math.max(220, w * 0.7));
  const usable = trackW - TH;
  const frac = n > 1 ? clamp(pos / (n - 1), 0, 1) : 0;
  const thumbLeft = (rtl ? 1 - frac : frac) * usable;
  const fromPointer = (e) => {
    const r = trackRef.current.getBoundingClientRect();
    let f = clamp((e.clientX - r.left - TH / 2) / usable, 0, 1);
    if (rtl) f = 1 - f;
    return f * (n - 1);
  };
  const tDown = (e) => {
    if (n < 2) return;
    cancelAnimationFrame(raf.current);
    drag.current = { track: true, id: e.pointerId };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* تجاهل */ }
    setBoth(fromPointer(e));
  };
  const tMove = (e) => { if (drag.current && drag.current.track) setBoth(fromPointer(e)); };
  const tUp = () => { if (drag.current && drag.current.track) { drag.current = null; glide(posRef.current); } };

  /* عجلة الماوس الأفقية + لوحة المفاتيح */
  useEffect(() => {
    const el = stageRef.current; if (!el) return undefined;
    const wh = (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || n < 2) return;
      e.preventDefault();
      cancelAnimationFrame(raf.current);
      setBoth(clamp(posRef.current + (s * -e.deltaX) / 220, 0, n - 1));
      clearTimeout(wh.t); wh.t = setTimeout(() => glide(posRef.current), 140);
    };
    el.addEventListener('wheel', wh, { passive: false });
    return () => el.removeEventListener('wheel', wh);
  }, [n, s, glide, setBoth]);

  const go = useCallback((d) => glide(clamp(Math.round(posRef.current) + d, 0, n - 1)), [glide, n]);
  useEffect(() => {
    const k = (e) => {
      if (e.key === 'Escape' && focus) { setFocus(false); return; }
      if (!focus && !(document.activeElement && document.activeElement.closest && document.activeElement.closest('.ob-stage'))) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); go((e.key === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1)); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [focus, go, rtl]);

  /* قفل تمرير الصفحة مع العرض المركّز + تتبّع المشاهدة */
  useEffect(() => {
    if (!focus) return undefined;
    return lockScroll();
  }, [focus]);
  useEffect(() => {
    if (!focus || !cur0) return;
    try { const price = effectivePrice(cur0); track('ViewContent', { value: price, items: [{ id: cur0.id, title: cur0.title, price, qty: 1 }] }); hit(slug, 'pview', { product: String(cur0.id) }); } catch { /* تجاهل */ }
  }, [focus, cur0 && cur0.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* الإضافة للسلة */
  const addLine = (p, opts, label) => {
    if (soldOut(p)) return;
    const price = unitPrice(p, opts);
    const srcEl = document.querySelector(focus ? '.ob-focus .ob-fpic img' : '.ob-it.on img');
    flyToCart(srcEl, p.images[0]);
    add({ product_id: p.id, title: p.title, image: p.images[0] || '', price, qty: 1, options: opts });
    track('AddToCart', { value: price, items: [{ id: p.id, title: p.title, price, qty: 1 }] });
    hit(slug, 'cart', { product: String(p.id) });
    setAdded({ id: p.id, label });
    setBusy('');
  };
  const pick = (p, g, v) => {
    if (busy || soldOut(p)) return;
    setBusy(`${p.id}|${v}`);
    setTimeout(() => addLine(p, { [g.name]: v }, v), reduce.current ? 0 : 420);
  };
  const quickAdd = (p) => {
    if (busy || soldOut(p)) return;
    setBusy(`${p.id}|*`);
    setTimeout(() => addLine(p, {}, ''), reduce.current ? 0 : 420);
  };
  const openCart = () => { if (cfg.cart?.drawer === false) router.push(`${base}/cart`); else window.dispatchEvent(new Event('spike:cart-open')); };

  if (!n) return <div className="empty">لا توجد منتجات مطابقة</div>;

  const p = cur0;
  const groups = p.variants || [];
  const chart = chartFor(cfg.sizing, p);
  const gi = splitImages(p, cfg.browse?.flip !== false);
  const rg = priceRange(p);
  const picked = Object.keys(fopts).length > 0;
  const ovr = overridePrice(p, fopts) > 0;
  const price = picked ? unitPrice(p, fopts) : effectivePrice(p);
  const onSale = !ovr && !(rg.varies && !picked) && saleActive(p) && p.compare_price > price;
  const sold = soldOut(p);
  const justAdded = added && added.id === p.id;
  const needed = groups.filter((g) => !fopts[g.name]);
  const fAddBusy = busy === `${p.id}|F`;

  const addFocus = () => {
    if (sold || busy || needed.length) return;
    setBusy(`${p.id}|F`);
    setTimeout(() => addLine(p, { ...fopts }, Object.values(fopts).join(' / ')), reduce.current ? 0 : 420);
  };

  const PriceEl = () => (
    <div className="ob-price num">{rg.varies && !picked ? <small style={{ fontWeight: 600, marginInlineEnd: 4 }}>من</small> : null}{money(rg.varies && !picked ? rg.min : price, cur)}{onSale ? <s>{money(p.compare_price, cur)}</s> : null}</div>
  );
  const AddedLine = () => (justAdded ? (
    <div className="ob-added" role="status">
      <span>✓ تمت إضافة «{p.title}»{added.label ? ` · ${added.label}` : ''} للسلة</span>
      <button type="button" onClick={openCart}>عرض السلة ←</button>
    </div>
  ) : null);

  /* النافذة بتتعرض داخل جذر المتجر مباشرة: لو أي عنصر أب فيه transform/animation كان بيخلّي fixed نسبي له فتظهر تحت الهيدر وتتقطع */
  const inPortal = (node) => {
    const host = typeof document !== 'undefined' ? document.querySelector('.spk') : null;
    return host ? createPortal(node, host) : node;
  };

  return (
    <div className="ob">
      <div
        className="ob-stage"
        ref={stageRef}
        style={{ height: H }}
        tabIndex={0}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        aria-roledescription="carousel"
        aria-label="المنتجات"
      >
        <div className="ob-txt" key={p.id}>
          <div className="ob-cnt num" dir="ltr">{pad(idx + 1)} / {pad(n)}</div>
          <h2>{p.title}</h2>
          <PriceEl />
          <Link className="ob-lnk" href={`${base}/p/${p.id}`}>عرض التفاصيل ←</Link>
        </div>

        <svg className="ob-curve" width={w} height={H} viewBox={`0 0 ${w} ${H}`} aria-hidden="true">
          <path d={curve} fill="none" stroke="rgba(15,23,42,.16)" strokeWidth="1" />
          <path d={curve} transform={`translate(${s * S * 0.42} ${S * 0.62})`} fill="none" stroke="rgba(15,23,42,.07)" strokeWidth="1" />
        </svg>

        {list.map((it, i) => {
          const d = i - pos;
          const ad = Math.abs(d);
          if (ad > 3.4) return null;
          const q = at(d);
          const sc = 1 / (1 + 0.38 * ad);
          const op = ad <= 2 ? 1 : clamp(1 - (ad - 2) / 1.2, 0, 1);
          const front = ad < 0.5;
          const bk = cfg.browse?.flip !== false ? splitImages(it, true).back : '';
          const flipped = flipId === String(it.id);
          const half = (S * sc) / 2;
          const toLeft = q.x > w / 2; // لو المنتج في الجنب اليمين نحط الزرار على يساره والعكس
          const bx = clamp(toLeft ? q.x - half - 10 - 78 : q.x + half + 10, 6, Math.max(6, w - 84));
          return (
            <React.Fragment key={it.id}>
              <button
                type="button"
                className={'ob-it' + (front ? ' on' : '') + (flipped ? ' flp' : '')}
                style={{ width: S, height: S, transform: `translate3d(${(q.x - S / 2).toFixed(1)}px,${(q.y - S / 2).toFixed(1)}px,0) scale(${sc.toFixed(3)}) rotate(${(-4 * clamp(d, -2, 2)).toFixed(1)}deg)`, opacity: op, zIndex: 100 - Math.round(ad * 10) }}
                onClick={() => { if (moved.current) return; if (front) setFocus(true); else glide(i); }}
                aria-label={it.title}
                tabIndex={front ? 0 : -1}
              >
                <span className="ob-fl">
                  <span className="ob-3d">
                    {it.images[0] ? <img className="ob-fr" src={it.images[0]} alt="" draggable={false} decoding="async" /> : <Ph p={it} />}
                    {bk && (front || flipped) ? <img className="ob-bk" src={bk} alt="" draggable={false} loading="lazy" /> : null}
                  </span>
                </span>
                <i className="ob-sh" />
              </button>
              {front && bk ? (
                <button
                  type="button"
                  className={'ob-flipbtn' + (flipped ? ' on' : '')}
                  style={{ transform: `translate3d(${bx.toFixed(1)}px,${(q.y - 18).toFixed(1)}px,0)`, opacity: op }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); setFlipId(flipped ? '' : String(it.id)); }}
                  aria-pressed={flipped}
                  aria-label={flipped ? 'عرض الصورة الأمامية' : 'عرض الصورة الخلفية'}
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" /><path d="M3 21v-5h5" /></svg>
                  <span>{flipped ? 'الأمام' : 'الخلف'}</span>
                </button>
              ) : null}
            </React.Fragment>
          );
        })}

        {n > 1 && (
          <div className="ob-whl">
            <div className="ob-ends"><span className="num" dir="ltr">{pad(1)}</span><span>اسحب العجلة</span><span className="num" dir="ltr">{pad(n)}</span></div>
            <div
              className="ob-trk"
              ref={trackRef}
              style={{ width: trackW, backgroundPositionX: `${(rtl ? 1 : -1) * pos * 64}px` }}
              onPointerDown={tDown}
              onPointerMove={tMove}
              onPointerUp={tUp}
              onPointerCancel={tUp}
              role="slider"
              aria-valuemin={1}
              aria-valuemax={n}
              aria-valuenow={idx + 1}
              aria-label="عجلة المنتجات"
            >
              <b className="ob-th" style={{ left: thumbLeft, width: TH }} />
            </div>
          </div>
        )}
      </div>

      <div className="ob-pick">
        {sold ? <div className="ob-sold">نفدت الكمية حالياً</div> : groups.length === 1 ? (
          <>
            <div className="ob-lbl">اختر {groups[0].name} · ضغطة واحدة تضيف للسلة</div>
            <div className="ob-sz">
              {groups[0].values.map((v) => (
                <button key={v} type="button" className={busy === `${p.id}|${v}` ? 'ld' : (justAdded && added.label === v ? 'ok' : '')} onClick={() => pick(p, groups[0], v)}>
                  {busy === `${p.id}|${v}` ? <span className="ob-spin" /> : v}
                </button>
              ))}
            </div>
            {chart && isSizeGroup(groups[0].name) ? <SizeHelp chart={chart} values={groups[0].values} onPick={(v) => pick(p, groups[0], v)} /> : null}
          </>
        ) : groups.length === 0 ? (
          <button type="button" className={'ob-add' + (justAdded ? ' ok' : '')} onClick={() => quickAdd(p)}>
            {busy === `${p.id}|*` ? <span className="ob-spin" /> : justAdded ? 'تمت الإضافة للسلة ✓' : '🛒 أضف للسلة'}
          </button>
        ) : (
          <button type="button" className="ob-add" onClick={() => setFocus(true)}>اختر الخيارات</button>
        )}
        <AddedLine />
      </div>

      {focus && inPortal(
        <div className="ob-focus" role="dialog" aria-modal="true" aria-label={p.title}>
          <button type="button" className="ob-x" onClick={() => setFocus(false)}>إغلاق ✕</button>
          <button type="button" className="ob-cartp" data-fly-target="1" onClick={openCart} aria-label="السلة">🛒 <span className="num">{count}</span></button>
          <div className="ob-fgrid">
            <div className="ob-fimg">
              <FlipPic key={`${p.id}-${swap}`} className="ob-fpic" front={gi.list[imgI]} back={imgI === 0 ? gi.back : ''} alt={p.title}>
                {!gi.list[imgI] ? <Ph p={p} /> : null}
                <i className="ob-sh big" />
              </FlipPic>
              {gi.list.length > 1 && (
                <div className="ob-dots">{gi.list.map((_, k) => <button key={k} type="button" className={k === imgI ? 'on' : ''} aria-label={`صورة ${k + 1}`} onClick={() => setImgI(k)} />)}</div>
              )}
            </div>
            <div className="ob-finfo" key={`i-${p.id}`}>
              <h2>{p.title}</h2>
              <PriceEl />
              {sold ? <div className="ob-sold">نفدت الكمية حالياً</div> : null}
              {groups.map((g) => (
                <div className="ob-grp" key={g.name}>
                  <div className="ob-gh"><span>{g.name}</span><b>{fopts[g.name] || ''}</b></div>
                  <div className="ob-sz">
                    {g.values.map((v) => (
                      <button key={v} type="button" className={fopts[g.name] === v ? 'sel' : ''} disabled={sold} onClick={() => setFopts({ ...fopts, [g.name]: v })}>{v}</button>
                    ))}
                  </div>
                  {chart && isSizeGroup(g.name) ? <SizeHelp chart={chart} values={g.values} onPick={(v) => setFopts((o) => ({ ...o, [g.name]: v }))} /> : null}
                </div>
              ))}
              <button type="button" className={'ob-add' + (justAdded ? ' ok' : '') + (needed.length || sold ? ' dis' : '')} onClick={addFocus} disabled={sold}>
                {fAddBusy ? <span className="ob-spin" /> : justAdded ? 'تمت الإضافة للسلة ✓' : needed.length ? `اختر ${needed[0].name}` : '🛒 أضف للسلة'}
              </button>
              <div className="ob-fl2">
                {justAdded ? <button type="button" onClick={openCart}>عرض السلة ←</button> : null}
                <Link className="ob-lnk" href={`${base}/p/${p.id}`}>عرض كل التفاصيل ←</Link>
              </div>
            </div>
          </div>
          <div className="ob-fbar">
            <div className="ob-ths">
              {list.map((it, i) => (
                <button key={it.id} type="button" className={i === idx ? 'on' : ''} onClick={() => glide(i)} aria-label={it.title}>
                  {it.images[0] ? <img src={it.images[0]} alt="" loading="lazy" /> : <Ph p={it} />}
                </button>
              ))}
            </div>
            <div className="ob-nav">
              <button type="button" onClick={() => go(-1)} disabled={idx <= 0} aria-label="السابق">→</button>
              <span className="num" dir="ltr">{pad(idx + 1)} / {pad(n)}</span>
              <button type="button" className="dk" onClick={() => go(1)} disabled={idx >= n - 1} aria-label="التالي">←</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
