'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useShop } from './StoreContext';
import { Ph, PriceEl, FocusSheet, useBrowseCart } from './browseKit';
import { useFavs } from './favs';
import Mannequin from './Mannequin';
import { soldOut } from './ui';
import { track } from './tracker';
import { money, unitPrice } from '../../lib/storeKit';

/* عرض «الاستوديو»: مشهد زجاجي داكن؛ الموديل في النص، اختيار قطعة من الشبكة يبدّل اللبس بمسح من فوق لتحت مع خط مضيء،
   فلاتر للمشهد، واقعية، طول/بنية الموديل، تأطير (كامل/متوسط/بورتريه)، تراجع وإعادة، حفظ في «المكتبة» (المفضلة). */

const FILTERS = [
  { id: 'day', n: 'ضوء النهار', f: 'none', t: 'transparent' },
  { id: 'film', n: 'فيلم ناعم', f: 'contrast(.92) saturate(.85) brightness(1.06)', t: 'linear-gradient(180deg,rgba(255,226,214,.35),rgba(180,200,220,.35))' },
  { id: 'cool', n: 'استوديو بارد', f: 'saturate(.9) brightness(1.06) contrast(1.04)', t: 'linear-gradient(180deg,rgba(150,190,255,.55),rgba(200,220,255,.3))' },
  { id: 'blue', n: 'الساعة الزرقاء', f: 'brightness(.82) contrast(1.1) saturate(1.1)', t: 'linear-gradient(180deg,rgba(70,60,170,.75),rgba(150,90,170,.55))' },
  { id: 'mono', n: 'أبيض وأسود', f: 'grayscale(1) contrast(1.12) brightness(1.03)', t: 'transparent' },
  { id: 'gold', n: 'الساعة الذهبية', f: 'saturate(1.1) brightness(1.02)', t: 'linear-gradient(180deg,rgba(255,180,90,.6),rgba(255,140,80,.4))' },
];
const FRAMES = [{ id: 'full', n: 'كامل' }, { id: 'mid', n: 'متوسط' }, { id: 'portrait', n: 'بورتريه' }];
const DEF = { look: 0, grade: 0, real: 75, height: 168, build: 50, frame: 'full' };

export default function StudioView({ list = [] }) {
  const cart = useBrowseCart();
  const { cfg } = cart;
  const { add } = useShop();
  const fav = useFavs(cart.slug);
  const items = list.slice(0, 24);
  const n = items.length;
  const [hist, setHist] = useState([DEF]);
  const [hi, setHi] = useState(0);
  const [live, setLive] = useState(null);
  const S = live ? { ...hist[hi], ...live } : hist[hi];
  const [figs, setFigs] = useState([{ k: 0, look: 0, entering: false }]);
  const [scan, setScan] = useState(0);
  const [tab, setTab] = useState('style');
  const [open, setOpen] = useState(false);
  const [fOpen, setFOpen] = useState(false);
  const [focus, setFocus] = useState(false);
  const [toast, setToast] = useState('');
  const [opts, setOpts] = useState({});
  const [inCart, setInCart] = useState({});
  const [rand, setRand] = useState(-1);
  const kRef = useRef(1);
  const shownRef = useRef(0);
  const tRef = useRef(0);

  const say = (m) => { setToast(m); clearTimeout(tRef.current); tRef.current = setTimeout(() => setToast(''), 1800); };
  const reduce = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const models = (cfg.fitting && cfg.fitting.models) || [];
  const modelImg = models[0] && models[0].image;
  const fitOf = (p) => { const f = cfg.fitting && cfg.fitting.items && cfg.fitting.items[String(p.id)]; return f && f.image ? { id: p.id, slot: f.slot || 'top', image: f.image } : null; };

  /* تبديل اللبس: شكل جديد يتكشف من فوق لتحت فوق القديم */
  const showLook = useCallback((i) => {
    if (i === shownRef.current) return;
    shownRef.current = i;
    if (reduce()) { setFigs([{ k: kRef.current++, look: i, entering: false }]); return; }
    const k = kRef.current++;
    setFigs((f) => [...f, { k, look: i, entering: true }]);
    setScan((x) => x + 1);
    setTimeout(() => setFigs((f) => f.filter((x) => x.k === k).map((x) => ({ ...x, entering: false }))), 1100);
  }, []);
  useEffect(() => { if (n) showLook(Math.min(S.look, n - 1)); }, [S.look, n, showLook]);

  const commit = (patch) => { const arr = hist.slice(0, hi + 1).concat({ ...hist[hi], ...patch }); setHist(arr); setHi(arr.length - 1); };
  const rel = () => { if (live) { commit(live); setLive(null); } };
  const slide = (k) => ({ onChange: (e) => setLive((l) => ({ ...(l || {}), [k]: +e.target.value })), onPointerUp: rel, onKeyUp: rel, onBlur: rel });
  const undo = () => { if (hi > 0) setHi(hi - 1); };
  const redo = () => { if (hi < hist.length - 1) setHi(hi + 1); };
  const reset = () => { commit({ ...DEF }); say('رجعنا للوضع الافتراضي'); };
  const pick = (i) => { if (i === S.look) return; commit({ look: i }); };
  useEffect(() => {
    const kd = (e) => {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
    };
    window.addEventListener('keydown', kd); return () => window.removeEventListener('keydown', kd);
  });

  const randomize = () => {
    if (n < 2 || rand >= 0) return;
    let steps = 0; let delay = 50; const target = (() => { let t; do { t = Math.floor(Math.random() * n); } while (t === S.look); return t; })();
    const tick = () => {
      if (steps < 12) { setRand(steps % n); steps += 1; delay += 8; setTimeout(tick, delay); return; }
      setRand(-1);
      commit({ look: target, grade: Math.floor(Math.random() * 4), real: 55 + Math.floor(Math.random() * 45) });
    };
    tick();
  };

  const p = items[Math.min(S.look, n - 1)];
  const groups = p ? (p.variants || []) : [];
  const o = p ? (opts[p.id] || {}) : {};
  const missing = groups.filter((g) => !o[g.name]);
  const addCart = () => {
    if (!p || soldOut(p)) return;
    if (missing.length) { say(`اختر ${missing[0].name} الأول`); return; }
    const price = unitPrice(p, o);
    add({ product_id: p.id, title: p.title, image: p.images[0] || '', price, qty: 1, options: o });
    track('AddToCart', { value: price, items: [{ id: p.id, title: p.title, price, qty: 1 }] });
    setInCart((c) => ({ ...c, [p.id]: true })); say('تمت الإضافة للسلة');
  };
  const saved = fav.ids;
  const save = () => { if (!p) return; if (!fav.has(p.id)) fav.toggle(p.id); setOpen(true); say('اتحفظت في المكتبة'); };

  const real = Math.max(0, (80 - S.real) / 80);
  const gr = FILTERS[S.grade] || FILTERS[0];
  const vars = {
    '--st-h': 1 + (S.height - 168) / 168 * 0.9, '--st-b': 1 + (S.build - 50) / 50 * 0.07,
    '--st-real': `saturate(${1 + real * 0.9}) contrast(${1 + real * 0.25}) blur(${real * 1.4}px) brightness(${1 + real * 0.05})`,
    '--st-bg': `blur(${real * 5}px) saturate(${1 + real * 0.5})`,
  };
  const savedItems = useMemo(() => items.filter((x) => saved.includes(String(x.id))), [items, saved]);

  if (!n) return <div className="empty">لا توجد منتجات مطابقة</div>;
  const renderFig = (it) => { const w = fitOf(it); return w ? <Mannequin size={2} worn={[w]} /> : (it.images[0] ? <img src={it.images[0]} alt="" draggable="false" /> : <Ph p={it} />); };

  return (
    <div className="st" style={vars} data-frame={S.frame}>
      <div className="st-scene" aria-hidden="true"><div className="st-grade" style={{ filter: gr.f }}><div className="st-bg" /><div className="st-tint" style={{ background: gr.t }} /></div><div className="st-vig" /></div>

      <div className="st-tabs glass-d" role="tablist">
        {[['style', 'المنتجات'], ['body', 'الجسم']].map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
      </div>

      <div className="st-model">
        <div className="st-shadow" />
        <div className="st-inner"><div className="st-breath">
          {modelImg && !fitOf(p) ? <img className="st-base" src={modelImg} alt="" draggable="false" /> : null}
          <div className="st-figs">
            {figs.map((f) => { const it = items[Math.min(f.look, n - 1)]; return <div key={f.k} className={'st-fig' + (f.entering ? ' in' : '')}>{renderFig(it)}</div>; })}
          </div>
          <span className="st-scan" key={scan} data-go={scan ? 1 : 0} />
        </div></div>
      </div>

      <div className="st-card glass-d">
        <b className="st-nm">{p.title}</b>
        <PriceEl p={p} cur={cart.cur} />
        <div className="st-act"><button type="button" onClick={() => setFocus(true)}>عرض سريع</button><Link href={`${cart.base}/p/${p.id}`}>كل التفاصيل ←</Link></div>
      </div>

      <div className="st-panel glass-d">
        {tab === 'style' ? (
          <>
            <div className="st-ph"><h3>الإطلالات</h3><span className="num">{n} {n === 1 ? 'قطعة' : 'قطع'}</span></div>
            <div className="st-grid" role="listbox" aria-label="المنتجات">
              {items.map((it, i) => (
                <button key={it.id} type="button" role="option" aria-selected={i === S.look} className={'st-c' + (i === S.look ? ' on' : '') + (rand === i % n ? ' hl' : '')} onClick={() => pick(i)} onDoubleClick={() => { fav.toggle(it.id); say(fav.has(it.id) ? 'اتشالت من المكتبة' : 'اتحفظت في المكتبة'); }} aria-label={it.title}>
                  <span className="st-im">{it.images[0] ? <img src={it.images[0]} alt="" loading="lazy" draggable="false" /> : <Ph p={it} />}</span>
                  <span className="st-tg">{it.title}</span>
                  {fav.has(it.id) ? <span className="st-hr" aria-hidden="true">♥</span> : null}
                </button>
              ))}
            </div>
            <div className="st-det">
              <div className="st-dh"><b>{p.title}</b><PriceEl p={p} cur={cart.cur} /></div>
              {soldOut(p) ? <small className="st-so">نفدت الكمية</small> : groups.map((g) => (
                <div key={g.name} className="st-sz" role="group" aria-label={g.name}><span>{g.name}</span>{g.values.map((v) => <button key={v} type="button" className={o[g.name] === v ? 'on' : ''} aria-pressed={o[g.name] === v} onClick={() => setOpts((x) => ({ ...x, [p.id]: { ...(x[p.id] || {}), [g.name]: v } }))}>{v}</button>)}</div>
              ))}
              <button type="button" className={'st-add' + (inCart[p.id] ? ' ok' : '')} disabled={soldOut(p)} onClick={addCart}>{inCart[p.id] ? '✓ في السلة' : '+ أضف للسلة'}</button>
            </div>
          </>
        ) : (
          <>
            <div className="st-ph"><h3>الجسم</h3><span>التغييرات بتتطبّق على الموديل</span></div>
            <label className="st-sl"><span>الطول (سم)</span><b className="num">{S.height}</b><input type="range" min="150" max="185" value={S.height} {...slide('height')} /></label>
            <label className="st-sl"><span>البنية</span><b className="num">{S.build}</b><input type="range" min="0" max="100" value={S.build} {...slide('build')} /></label>
            <div className="st-lb">التأطير</div>
            <div className="st-chips">{FRAMES.map((f) => <button key={f.id} type="button" className={S.frame === f.id ? 'on' : ''} onClick={() => commit({ frame: f.id })}>{f.n}</button>)}</div>
            <label className="st-sl"><span>الواقعية</span><b className="num">{S.real}%</b><input type="range" min="0" max="100" value={S.real} {...slide('real')} /></label>
            <div className="st-lb">الفلتر</div>
            <div className="st-flt">
              <button type="button" className="st-fd" aria-expanded={fOpen} onClick={() => setFOpen((x) => !x)}>{gr.n} <i>▾</i></button>
              {fOpen ? <div className="st-fl glass-d" role="listbox">{FILTERS.map((f, i) => <button key={f.id} type="button" role="option" aria-selected={i === S.grade} className={i === S.grade ? 'on' : ''} onClick={() => { commit({ grade: i }); setFOpen(false); }}>{f.n}</button>)}</div> : null}
            </div>
            <div className="st-th">{FILTERS.map((f, i) => (
              <button key={f.id} type="button" className={i === S.grade ? 'on' : ''} aria-label={f.n} onClick={() => commit({ grade: i })}>
                <span style={{ filter: f.f }}>{p.images[0] ? <img src={p.images[0]} alt="" /> : null}</span><i style={{ background: f.t }} />
              </button>))}</div>
          </>
        )}
      </div>

      <div className="st-bar glass-d" role="toolbar" aria-label="أدوات">
        <button type="button" disabled={hi === 0} onClick={undo}>↶ تراجع</button>
        <button type="button" disabled={hi >= hist.length - 1} onClick={redo}>↷ إعادة</button>
        <button type="button" className="on" onClick={() => commit({ frame: FRAMES[(FRAMES.findIndex((f) => f.id === S.frame) + 1) % 3].id })}>{FRAMES.find((f) => f.id === S.frame).n}</button>
        <button type="button" onClick={reset}>⟲ إعادة ضبط</button>
        <button type="button" onClick={randomize}>🎲 عشوائي</button>
      </div>
      <button type="button" className="st-save" onClick={save}>احفظ في المكتبة <span className="num">{savedItems.length || ''}</span></button>
      {open ? (
        <div className="st-lib glass-d" role="dialog" aria-label="المكتبة">
          <div className="st-ph"><h3>المكتبة</h3><button type="button" className="st-x" aria-label="إغلاق" onClick={() => setOpen(false)}>✕</button></div>
          {savedItems.length ? <div className="st-lr">{savedItems.map((it) => <button key={it.id} type="button" onClick={() => { pick(items.indexOf(it)); setOpen(false); }} aria-label={it.title}>{it.images[0] ? <img src={it.images[0]} alt="" /> : null}</button>)}</div> : <p>احفظ إطلالة عشان تبدأ مكتبتك.</p>}
        </div>
      ) : null}
      {toast ? <div className="st-toast" role="status">✓ {toast}</div> : null}
      {focus && <FocusSheet list={items} idx={Math.min(S.look, n - 1)} onGo={(i) => pick(Math.max(0, Math.min(n - 1, i)))} onClose={() => setFocus(false)} cart={cart} />}
    </div>
  );
}
