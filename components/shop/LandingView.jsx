'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useShop } from './StoreContext';
import { track } from './tracker';
import Checkout from './Checkout';
import { soldOut } from './ui';
import { money, effectivePrice, saleActive } from '../../lib/storeKit';

const ytId = (u) => { const m = String(u || '').match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/); return m ? m[1] : ''; };
const scrollToOrder = () => { track('LandingCTA', {}); document.getElementById('checkout')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

function Countdown({ id, minutes, label }) {
  const key = `spike_cd_${id}`;
  const [left, setLeft] = useState(null);
  useEffect(() => {
    let end;
    try { end = Number(sessionStorage.getItem(key)); } catch { /* تجاهل */ }
    if (!end) { end = Date.now() + minutes * 60000; try { sessionStorage.setItem(key, String(end)); } catch { /* تجاهل */ } }
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [key, minutes]);
  if (left === null) return null;
  const s = Math.floor(left / 1000);
  const p = (n) => String(n).padStart(2, '0');
  return (
    <div className="lp-cd">
      <div style={{ opacity: .85, marginBottom: 4 }}>{left > 0 ? (label || 'ينتهي العرض خلال') : 'انتهى العرض'}</div>
      <b className="num" style={{ fontSize: 32, letterSpacing: 2 }}>{p(Math.floor(s / 3600))}:{p(Math.floor((s % 3600) / 60))}:{p(s % 60)}</b>
    </div>
  );
}

function Faq({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {items.map((q, i) => (
        <div key={i} className="lp-card" style={{ padding: 0 }}>
          <button type="button" onClick={() => setOpen(open === i ? -1 : i)} style={{ all: 'unset', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontWeight: 700 }}>
            <span>{q.q}</span><span>{open === i ? '−' : '+'}</span>
          </button>
          {open === i ? <div style={{ padding: '0 14px 14px', opacity: .85, lineHeight: 1.8 }}>{q.a}</div> : null}
        </div>
      ))}
    </div>
  );
}

function Section({ s, ctx }) {
  const { fn, p, price, onSale, cur } = ctx;
  const d = s.data || {};
  switch (s.type) {
    case 'hero':
      return (
        <section className="lp-sec" style={{ textAlign: 'center' }}>
          {d.badge ? <span className="lp-badge">{d.badge}</span> : null}
          <h1 style={{ margin: '10px 0 8px', fontSize: 'clamp(26px,6vw,40px)', lineHeight: 1.3 }}>{d.title || p.title}</h1>
          {d.subtitle ? <p style={{ opacity: .85, fontSize: 17, lineHeight: 1.8 }}>{d.subtitle}</p> : null}
          {(d.image || p.images[0]) ? <img src={d.image || p.images[0]} alt={d.title || p.title} className="lp-img" style={{ margin: '14px 0' }} /> : null}
          {d.show_price !== false ? (
            <div className="lp-price"><b className="num">{money(price, cur)}</b>{onSale ? <span className="num old">{money(p.compare_price, cur)}</span> : null}</div>
          ) : null}
          <button type="button" className="lp-btn" onClick={scrollToOrder}>{d.cta || fn.cta_text || 'اطلب الآن'}</button>
        </section>
      );
    case 'video': {
      const v = ytId(d.url);
      if (!v) return null;
      return (
        <section className="lp-sec">
          {d.title ? <h2 className="lp-h2">{d.title}</h2> : null}
          <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 'var(--lp-r)', overflow: 'hidden' }}>
            <iframe src={`https://www.youtube.com/embed/${v}`} title={d.title || 'فيديو'} loading="lazy" allowFullScreen style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
          </div>
        </section>
      );
    }
    case 'benefits':
      return (
        <section className="lp-sec">
          {d.title ? <h2 className="lp-h2">{d.title}</h2> : null}
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
            {(d.items || []).map((b, i) => (
              <div key={i} className="lp-card">
                <div style={{ fontSize: 28 }}>{b.icon || '✔'}</div>
                <b>{b.title}</b>
                {b.text ? <p style={{ opacity: .8, margin: '6px 0 0', lineHeight: 1.7 }}>{b.text}</p> : null}
              </div>
            ))}
          </div>
        </section>
      );
    case 'gallery':
      return (
        <section className="lp-sec">
          {d.title ? <h2 className="lp-h2">{d.title}</h2> : null}
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
            {(d.images && d.images.length ? d.images : p.images).map((u, i) => <img key={i} src={u} alt="" loading="lazy" className="lp-img" />)}
          </div>
        </section>
      );
    case 'image':
      return d.url ? <section className="lp-sec"><img src={d.url} alt={d.alt || ''} loading="lazy" className="lp-img" /></section> : null;
    case 'text':
      return (
        <section className="lp-sec" style={{ textAlign: d.align || 'right' }}>
          {d.title ? <h2 className="lp-h2">{d.title}</h2> : null}
          <p style={{ lineHeight: 2, whiteSpace: 'pre-wrap', margin: 0 }}>{d.body}</p>
        </section>
      );
    case 'testimonials':
      return (
        <section className="lp-sec">
          <h2 className="lp-h2">{d.title || 'آراء عملائنا'}</h2>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
            {(d.items || []).map((t, i) => (
              <div key={i} className="lp-card">
                <div style={{ color: '#f59e0b' }}>{'★'.repeat(Math.max(1, Math.min(5, Number(t.stars) || 5)))}</div>
                <p style={{ margin: '6px 0', lineHeight: 1.8 }}>{t.text}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {t.image ? <img src={t.image} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} /> : null}
                  <b>{t.name}</b>
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    case 'faq':
      return <section className="lp-sec"><h2 className="lp-h2">{d.title || 'الأسئلة الشائعة'}</h2><Faq items={d.items || []} /></section>;
    case 'guarantee':
      return (
        <section className="lp-sec">
          <div className="lp-card" style={{ textAlign: 'center', borderColor: 'var(--lp-primary)' }}>
            <div style={{ fontSize: 36 }}>{d.icon || '🛡️'}</div>
            <h3 style={{ margin: '6px 0' }}>{d.title || 'ضمان الاستبدال والاسترجاع'}</h3>
            <p style={{ margin: 0, opacity: .85, lineHeight: 1.8 }}>{d.text}</p>
          </div>
        </section>
      );
    case 'countdown':
      return <section className="lp-sec"><Countdown id={`${ctx.slug}_${fn.slug}_${s.id}`} minutes={Number(d.minutes) || 60} label={d.label} /></section>;
    case 'cta':
      return (
        <section className="lp-sec" style={{ textAlign: 'center' }}>
          {d.title ? <h2 className="lp-h2">{d.title}</h2> : null}
          <button type="button" className="lp-btn" onClick={scrollToOrder}>{d.cta || 'اطلب الآن'}</button>
        </section>
      );
    case 'order':
      return <OrderBox s={s} ctx={ctx} />;
    default:
      return null;
  }
}

function OrderBox({ s, ctx }) {
  const { fn, p, price, onSale, cur } = ctx;
  const d = s.data || {};
  const [opts, setOpts] = useState({});
  const [qty, setQty] = useState(1);
  const groups = p.variants || [];
  const optsOk = groups.every((g) => opts[g.name]);
  const item = useMemo(() => ({ key: p.id, product_id: p.id, title: p.title, image: p.images[0] || '', price, qty, options: opts }), [p.id, qty, opts, price]);
  return (
    <section className="lp-sec" id="checkout">
      <div className="lp-card" style={{ padding: 16 }}>
        <h2 className="lp-h2" style={{ marginTop: 0 }}>{d.title || 'اطلب الآن · الدفع عند الاستلام'}</h2>
        <div className="lp-price" style={{ justifyContent: 'center' }}>
          <b className="num">{money(price, cur)}</b>
          {onSale ? <><span className="num old">{money(p.compare_price, cur)}</span><span className="lp-badge">وفّر {Math.round((1 - price / p.compare_price) * 100)}%</span></> : null}
        </div>
        {soldOut(p) ? <div className="err">نفدت الكمية حالياً</div> : (
          <>
            {groups.map((g) => (
              <div className="opt" key={g.name}>
                <b>{g.name}</b>
                <div className="chips">{g.values.map((v) => <button type="button" key={v} className={'chip' + (opts[g.name] === v ? ' act' : '')} onClick={() => setOpts({ ...opts, [g.name]: v })}>{v}</button>)}</div>
              </div>
            ))}
            <div className="qty" style={{ margin: '10px 0' }}>
              <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="إنقاص">−</button>
              <span className="num">{qty}</span>
              <button type="button" onClick={() => setQty(Math.min(50, qty + 1))} aria-label="زيادة">+</button>
            </div>
            {!optsOk ? <div className="err" style={{ marginBottom: 10 }}>اختر {groups.filter((g) => !opts[g.name]).map((g) => g.name).join(' و ')} لإتمام الطلب</div> : null}
            <Checkout items={optsOk ? [item] : []} bump={null} funnel={fn.slug} buttonText={d.cta || fn.cta_text || undefined} title="بيانات الشحن" />
          </>
        )}
      </div>
    </section>
  );
}

/* صفحة هبوط بالأقسام. لو مفيش أقسام يتم بناء أقسام افتراضية من بيانات الـ Funnel القديمة */
export default function LandingView({ funnel: fn, product: p }) {
  const { slug, cur } = useShop();
  const th = fn.theme || {};
  const st = fn.settings || {};
  const price = effectivePrice(p);
  const onSale = saleActive(p) && p.compare_price > price;
  const sections = useMemo(() => {
    if (Array.isArray(fn.sections) && fn.sections.length) return fn.sections.filter((x) => x && x.on !== false);
    const out = [{ id: 'h', type: 'hero', data: { title: fn.headline, subtitle: fn.subheadline } }];
    if (fn.video_url) out.push({ id: 'v', type: 'video', data: { url: fn.video_url } });
    if (fn.bullets?.length) out.push({ id: 'b', type: 'benefits', data: { items: fn.bullets.map((t) => ({ icon: '✔', title: t })) } });
    if (fn.countdown_minutes > 0) out.push({ id: 'c', type: 'countdown', data: { minutes: fn.countdown_minutes } });
    out.push({ id: 'o', type: 'order', data: {} });
    return out;
  }, [fn]);
  const hasOrder = sections.some((x) => x.type === 'order');
  const all = hasOrder ? sections : [...sections, { id: 'o_auto', type: 'order', data: {} }];
  const ctx = { fn, p, price, onSale, cur, slug };
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => { track('ViewContent', { value: price, items: [{ id: p.id, title: p.title, price, qty: 1 }] }); }, [p.id]);
  useEffect(() => {
    if (!st.sticky_cta) return undefined;
    const on = () => {
      const o = document.getElementById('checkout');
      const y = o ? o.getBoundingClientRect().top : 9999;
      setShowSticky(window.scrollY > 300 && y > window.innerHeight);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [st.sticky_cta]);

  const vars = {
    '--lp-primary': th.primary || '#0a7f86', '--lp-bg': th.bg || '#ffffff', '--lp-text': th.text || '#1a1a1a',
    '--lp-card': th.card || 'rgba(127,127,127,.08)', '--lp-r': `${Number(th.radius ?? 14)}px`,
    '--lp-btn-text': th.btn_text || '#ffffff', fontFamily: th.font ? `${th.font}, system-ui, sans-serif` : undefined,
  };
  const wa = String(st.whatsapp || '').replace(/\D/g, '');

  return (
    <div style={{ ...vars, background: 'var(--lp-bg)', color: 'var(--lp-text)', minHeight: '100vh', paddingBottom: st.sticky_cta ? 70 : 0 }}>
      {th.font ? <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(th.font)}:wght@400;700&display=swap`} /> : null}
      <style>{`
        .lp-wrap{max-width:${Number(th.width) || 680}px;margin:0 auto;padding:0 16px}
        .lp-sec{padding:18px 0}
        .lp-h2{font-size:24px;margin:0 0 12px;text-align:center}
        .lp-card{background:var(--lp-card);border:1px solid rgba(127,127,127,.2);border-radius:var(--lp-r);padding:14px}
        .lp-img{width:100%;border-radius:var(--lp-r);display:block}
        .lp-btn{background:var(--lp-primary);color:var(--lp-btn-text);border:0;border-radius:var(--lp-r);padding:14px 30px;font-size:18px;font-weight:800;cursor:pointer;width:100%;max-width:380px;font-family:inherit}
        .lp-price{display:flex;gap:10px;align-items:baseline;margin:10px 0;font-size:28px;color:var(--lp-primary)}
        .lp-price .old{font-size:17px;text-decoration:line-through;opacity:.55;color:var(--lp-text)}
        .lp-badge{display:inline-block;background:var(--lp-primary);color:var(--lp-btn-text);border-radius:99px;padding:3px 12px;font-size:13px;font-weight:700}
        .lp-cd{background:var(--lp-primary);color:var(--lp-btn-text);border-radius:var(--lp-r);padding:14px;text-align:center}
        .lp-sticky{position:fixed;bottom:0;left:0;right:0;padding:10px 16px;background:var(--lp-bg);border-top:1px solid rgba(127,127,127,.25);z-index:50;display:flex;justify-content:center}
        .lp-wa{position:fixed;bottom:${st.sticky_cta ? 78 : 18}px;left:16px;width:52px;height:52px;border-radius:50%;background:#25d366;color:#fff;display:flex;align-items:center;justify-content:center;font-size:26px;z-index:60;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,.25)}
        .lp-wrap .card{background:var(--lp-card);color:var(--lp-text)}
      `}</style>
      <div className="lp-wrap">
        {all.map((s) => <Section key={s.id} s={s} ctx={ctx} />)}
      </div>
      {st.sticky_cta && showSticky ? (
        <div className="lp-sticky"><button type="button" className="lp-btn" onClick={scrollToOrder}>{st.sticky_text || fn.cta_text || 'اطلب الآن'} · {money(price, cur)}</button></div>
      ) : null}
      {wa ? <a className="lp-wa" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" aria-label="واتساب">💬</a> : null}
    </div>
  );
}
