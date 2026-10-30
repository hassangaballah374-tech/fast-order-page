'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useShop } from './StoreContext';
import { track } from './tracker';
import Checkout from './Checkout';
import { soldOut } from './ui';
import { money, effectivePrice, saleActive } from '../../lib/storeKit'; 
import { fontHref, isDark } from '../../lib/themes100';
import { lpThemeCss } from '../../lib/landingThemes';
import WaIcon from './WaIcon';
import { renderBlock, SectionWrap, useBuilderBridge } from './LpBlocks';

const ytId = (u) => { const m = String(u || '').match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/); return m ? m[1] : ''; };
const scrollToOrder = () => { track('LandingCTA', {}); document.getElementById('checkout')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

/* ظهور تدريجي عند التمرير */
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setOn(true); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`lp-rv ${on ? 'on' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

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
  const seg = [[p(Math.floor(s / 3600)), 'ساعة'], [p(Math.floor((s % 3600) / 60)), 'دقيقة'], [p(s % 60), 'ثانية']];
  return (
    <div className="lp-cd">
      <div className="lp-cd-t">⏳ {left > 0 ? (label || 'ينتهي العرض خلال') : 'انتهى العرض'}</div>
      <div className="lp-cd-r" dir="ltr">
        {seg.map(([v, l], i) => (
          <React.Fragment key={l}>
            {i > 0 ? <span className="lp-cd-c">:</span> : null}
            <div className="lp-cd-b"><b className="num">{v}</b><small>{l}</small></div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function Faq({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="lp-faq">
      {items.map((q, i) => (
        <div key={i} className={'lp-fq' + (open === i ? ' open' : '')}>
          <button type="button" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
            <span>{q.q}</span><i>+</i>
          </button>
          <div className="lp-fa"><div><p>{q.a}</p></div></div>
        </div>
      ))}
    </div>
  );
}

function Stars({ n = 5 }) { return <span className="lp-stars" aria-label={`${n} من 5`}>{'★'.repeat(Math.max(1, Math.min(5, Number(n) || 5)))}</span>; }

function Section({ s, ctx }) {
  const { fn, p, price, onSale, cur, scarce, setLight } = ctx;
  const d = s.data || {};
  const off = onSale ? Math.round((1 - price / p.compare_price) * 100) : 0;
  switch (s.type) {
    case 'hero': {
      const img = d.image || p.images[0];
      const trust = (Array.isArray(d.trust) && d.trust.length ? d.trust : ['💵|الدفع عند الاستلام', '🚚|توصيل لكل المحافظات', '📞|دعم سريع']).slice(0, 4);
      return (
        <section className="lp-hero">
          <Reveal className="lp-hero-t">
            {d.badge ? <span className="lp-badge">✦ {d.badge}</span> : null}
            <h1>{d.title || p.title}</h1>
            {d.subtitle ? <p className="lp-sub">{d.subtitle}</p> : null}
            {p.rating_count > 0 ? <div className="lp-rate"><Stars n={Math.round(p.rating_avg)} /> <b className="num">{p.rating_avg}</b> <span>({p.rating_count} تقييم)</span></div> : null}
            {d.show_price !== false ? (
              <div className="lp-price">
                <b className="num">{money(price, cur)}</b>
                {onSale ? <><span className="num old">{money(p.compare_price, cur)}</span><span className="lp-save">وفّر {off}%</span></> : null}
              </div>
            ) : null}
            {scarce ? <div className="lp-scar">🔥 {String(ctx.scarText).replace('{n}', p.stock_quantity)}</div> : null}
            <button type="button" className="lp-btn" onClick={scrollToOrder}>{d.cta || fn.cta_text || 'اطلب الآن'} <span aria-hidden="true">←</span></button>
            <div className="lp-trust">{trust.map((x, i) => { const [ic, t] = String(x).includes('|') ? String(x).split('|') : ['✔', x]; return <span key={i}><i>{ic}</i>{t}</span>; })}</div>
          </Reveal>
          {img ? (
            <Reveal className="lp-hero-i" delay={120}>
              <div className="lp-frame"><img src={img} alt={d.title || p.title} fetchPriority="high" decoding="async" />{off > 0 ? <span className="lp-float">-{off}%</span> : null}</div>
            </Reveal>
          ) : null}
        </section>
      );
    }
    case 'video': {
      const v = ytId(d.url);
      if (!v) return null;
      return (
        <section className="lp-sec lp-n">
          <Reveal>
            {d.title ? <h2 className="lp-h2">{d.title}</h2> : null}
            <div className="lp-video"><iframe src={`https://www.youtube.com/embed/${v}`} title={d.title || 'فيديو'} loading="lazy" allowFullScreen /></div>
          </Reveal>
        </section>
      );
    }
    case 'benefits':
      return (
        <section className="lp-sec lp-n">
          {d.title ? <Reveal><h2 className="lp-h2">{d.title}</h2></Reveal> : null}
          <div className="lp-ben">
            {(d.items || []).map((b, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="lp-card lp-bi"><div className="lp-ic">{b.icon || '✔'}</div><b>{b.title}</b>{b.text ? <p>{b.text}</p> : null}</div>
              </Reveal>
            ))}
          </div>
        </section>
      );
    case 'gallery':
      return (
        <section className="lp-sec lp-n">
          {d.title ? <Reveal><h2 className="lp-h2">{d.title}</h2></Reveal> : null}
          <div className="lp-gal">
            {(d.images && d.images.length ? d.images : p.images).map((u, i) => (
              <Reveal key={i} delay={i * 50}><button type="button" className="lp-gi" onClick={() => setLight(u)} aria-label="تكبير الصورة"><img src={u} alt="" loading="lazy" decoding="async" /></button></Reveal>
            ))}
          </div>
        </section>
      );
    case 'image':
      return d.url ? <section className="lp-sec lp-n"><Reveal><img src={d.url} alt={d.alt || ''} loading="lazy" decoding="async" className="lp-img" /></Reveal></section> : null;
    case 'text':
      return (
        <section className="lp-sec lp-n" style={{ textAlign: d.align || 'right' }}>
          <Reveal>
            {d.title ? <h2 className="lp-h2" style={{ textAlign: d.align || 'right' }}>{d.title}</h2> : null}
            <p className="lp-body">{d.body}</p>
          </Reveal>
        </section>
      );
    case 'testimonials':
      return (
        <section className="lp-sec lp-n">
          <Reveal><h2 className="lp-h2">{d.title || 'آراء عملائنا'}</h2></Reveal>
          <div className="lp-tst">
            {(d.items || []).map((t, i) => (
              <Reveal key={i} delay={i * 70}>
                <figure className="lp-card lp-tc">
                  <span className="lp-q" aria-hidden="true">“</span>
                  <Stars n={t.stars} />
                  <blockquote>{t.text}</blockquote>
                  <figcaption>
                    {t.image ? <img src={t.image} alt="" /> : <span className="lp-av">{String(t.name || '؟').trim().charAt(0)}</span>}
                    <b>{t.name}</b>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </section>
      );
    case 'faq':
      return <section className="lp-sec lp-n"><Reveal><h2 className="lp-h2">{d.title || 'الأسئلة الشائعة'}</h2><Faq items={d.items || []} /></Reveal></section>;
    case 'guarantee':
      return (
        <section className="lp-sec lp-n">
          <Reveal>
            <div className="lp-guar">
              <div className="lp-shield">{d.icon || '🛡️'}</div>
              <div><h3>{d.title || 'ضمان الاستبدال والاسترجاع'}</h3><p>{d.text}</p></div>
            </div>
          </Reveal>
        </section>
      );
    case 'countdown':
      return <section className="lp-sec lp-n"><Reveal><Countdown id={`${ctx.slug}_${fn.slug}_${s.id}`} minutes={Number(d.minutes) || 60} label={d.label} /></Reveal></section>;
    case 'cta':
      return (
        <section className="lp-sec lp-n">
          <Reveal>
            <div className="lp-cta">
              {d.title ? <h2>{d.title}</h2> : null}
              <button type="button" className="lp-btn lp-btn-w" onClick={scrollToOrder}>{d.cta || 'اطلب الآن'} <span aria-hidden="true">←</span></button>
            </div>
          </Reveal>
        </section>
      );
    case 'order':
      return <OrderBox s={s} ctx={ctx} />;
    default:
      return renderBlock(s);
  }
}

function OrderBox({ s, ctx }) {
  const { fn, p, price, onSale, cur, scarce } = ctx;
  const d = s.data || {};
  const [opts, setOpts] = useState({});
  const [qty, setQty] = useState(1);
  const groups = p.variants || [];
  const optsOk = groups.every((g) => opts[g.name]);
  const item = useMemo(() => ({ key: p.id, product_id: p.id, title: p.title, image: p.images[0] || '', price, qty, options: opts }), [p.id, qty, opts, price]);
  const maxQty = p.track_stock ? Math.max(1, Math.min(50, p.stock_quantity)) : 50;
  return (
    <section className="lp-sec lp-n" id="checkout">
      <Reveal>
        <div className="lp-order">
          <div className="lp-ribbon">💵 الدفع عند الاستلام · لا تدفع قبل ما تستلم</div>
          <h2 className="lp-h2" style={{ marginTop: 6 }}>{d.title || 'اطلب الآن'}</h2>
          <div className="lp-prod">
            {p.images[0] ? <img src={p.images[0]} alt="" /> : null}
            <div><b>{p.title}</b>
              <div className="lp-price sm"><b className="num">{money(price, cur)}</b>{onSale ? <><span className="num old">{money(p.compare_price, cur)}</span><span className="lp-save">وفّر {Math.round((1 - price / p.compare_price) * 100)}%</span></> : null}</div>
              {scarce ? <div className="lp-scar sm">🔥 {String(ctx.scarText).replace('{n}', p.stock_quantity)}</div> : null}
            </div>
          </div>
          {soldOut(p) ? <div className="err">نفدت الكمية حالياً</div> : (
            <>
              {groups.map((g) => (
                <div className="opt" key={g.name}>
                  <b>{g.name}</b>
                  <div className="chips">{g.values.map((v) => <button type="button" key={v} className={'chip' + (opts[g.name] === v ? ' act' : '')} onClick={() => setOpts({ ...opts, [g.name]: v })}>{v}</button>)}</div>
                </div>
              ))}
              <div className="lp-qrow"><span>الكمية</span>
                <div className="qty">
                  <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="إنقاص">−</button>
                  <span className="num">{qty}</span>
                  <button type="button" onClick={() => setQty(Math.min(maxQty, qty + 1))} aria-label="زيادة">+</button>
                </div>
              </div>
              {!optsOk ? <div className="err" style={{ marginBottom: 10 }}>اختر {groups.filter((g) => !opts[g.name]).map((g) => g.name).join(' و ')} لإتمام الطلب</div> : null}
              <Checkout items={optsOk ? [item] : []} bump={null} funnel={fn.slug} buttonText={d.cta || fn.cta_text || undefined} title="بيانات الشحن" />
              <div className="lp-safe"><span>🔒 بياناتك محمية</span><span>🚚 توصيل لباب البيت</span><span>↩️ تواصل معنا لأي استفسار</span></div>
            </>
          )}
        </div>
      </Reveal>
    </section>
  );
}

/* صفحة هبوط بالأقسام. لو مفيش أقسام يتم بناء أقسام افتراضية من بيانات الـ Funnel القديمة */
export default function LandingView({ funnel: fnProp, product: p }) {
  const { fn, sel, builder, pick } = useBuilderBridge(fnProp);
  const { slug, cur, cfg } = useShop();
  const th = fn.theme || {};
  const st = fn.settings || {};
  const price = effectivePrice(p);
  const onSale = saleActive(p) && p.compare_price > price;
  const scarce = !!(cfg.scarcity?.enabled && p.track_stock && p.stock_quantity > 0 && p.stock_quantity <= (Number(cfg.scarcity.threshold) || 5));
  const scarText = cfg.scarcity?.text || 'باقي {n} قطع فقط!';
  const [light, setLight] = useState('');
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
  const ctx = { fn, p, price, onSale, cur, slug, scarce, scarText, setLight };
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
  useEffect(() => {
    if (!light) return undefined;
    const k = (e) => { if (e.key === 'Escape') setLight(''); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [light]);

  const vars = {
    '--lp-primary': th.primary || '#0a7f86', '--lp-bg': th.bg || '#ffffff', '--lp-text': th.text || '#1a1a1a',
    '--lp-card': th.card || 'rgba(127,127,127,.08)', '--lp-r': `${Number(th.radius ?? 18)}px`,
    colorScheme: /^#[0-9a-fA-F]{6}$/.test(th.bg || '') && isDark(th.bg) ? 'dark' : 'light',
    '--lp-btn-text': th.btn_text || '#ffffff', '--lp-w': `${Number(th.width) || 720}px`,
    fontFamily: th.font ? `${th.font}, 'Cairo', system-ui, sans-serif` : "'Cairo', system-ui, sans-serif",
  };
  const wa = String(st.whatsapp || '').replace(/\D/g, '');

  return (
 <div className={builder ? 'lp lp-builder' : 'lp'} data-p={th.p || 'clean'} data-pat={th.pat || 'none'} style={{ ...vars, backgroundColor: 'var(--lp-bg)', color: 'var(--lp-text)', minHeight: '100vh', paddingBottom: st.sticky_cta ? 76 : 0 }}>
          {th.font ? <link rel="stylesheet" href={fontHref(th.font)} /> : null}
      <style dangerouslySetInnerHTML={{ __html: lpThemeCss(th) }} />
      <style>{`
        .lp{position:relative;overflow-x:clip;--lp-soft:color-mix(in srgb,var(--lp-primary) 12%,transparent);--lp-line:color-mix(in srgb,var(--lp-text) 14%,transparent);--lp-dark:color-mix(in srgb,var(--lp-primary) 62%,#000)}
        .lp *{box-sizing:border-box}
        .lp::before{content:'';position:absolute;inset:0 0 auto 0;height:900px;pointer-events:none;background:radial-gradient(55% 45% at 85% 0%,color-mix(in srgb,var(--lp-primary) 24%,transparent),transparent 70%),radial-gradient(45% 40% at 0% 18%,color-mix(in srgb,var(--lp-primary) 13%,transparent),transparent 70%)}
        .lp-wrap{position:relative;max-width:1060px;margin:0 auto;padding:0 18px}
        .lp-n{max-width:var(--lp-w);margin-inline:auto}
        .lp-sec{padding:28px 0}
        .lp-h2{font-size:clamp(22px,4.6vw,32px);font-weight:900;margin:0 0 18px;text-align:center;line-height:1.35}
        .lp-rv{opacity:0;transform:translateY(26px);transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1)}
        .lp-rv.on{opacity:1;transform:none}
        .lp-card{background:var(--lp-card);border:1px solid var(--lp-line);border-radius:var(--lp-r);padding:18px}
        .lp-img{width:100%;border-radius:var(--lp-r);display:block;box-shadow:0 24px 50px -28px rgba(0,0,0,.5)}
        /* hero */
        .lp-hero{display:grid;gap:26px;align-items:center;padding:34px 0 26px}
        @media(min-width:880px){.lp-hero{grid-template-columns:1.05fr .95fr;gap:48px;padding:64px 0 44px}}
        .lp-hero h1{font-size:clamp(30px,6.4vw,54px);line-height:1.22;font-weight:900;margin:14px 0 12px;letter-spacing:-.5px}
        .lp-sub{font-size:clamp(15px,2.6vw,18px);line-height:1.9;opacity:.82;margin:0 0 14px}
        .lp-badge{display:inline-block;background:var(--lp-soft);color:var(--lp-primary);border:1px solid color-mix(in srgb,var(--lp-primary) 35%,transparent);border-radius:99px;padding:5px 14px;font-size:13px;font-weight:800}
        .lp-rate{display:flex;align-items:center;gap:6px;font-size:14px;margin-bottom:6px}.lp-rate span{opacity:.7}
        .lp-stars{color:#f59e0b;letter-spacing:2px}
        .lp-price{display:flex;gap:12px;align-items:baseline;flex-wrap:wrap;margin:14px 0}
        .lp-price b{font-size:clamp(34px,7vw,50px);font-weight:900;color:var(--lp-primary);letter-spacing:-1px;line-height:1}
        .lp-price.sm b{font-size:26px}
        .lp-price .old{font-size:19px;text-decoration:line-through;opacity:.5}
        .lp-save{background:#dc2626;color:#fff;border-radius:99px;padding:4px 12px;font-size:13px;font-weight:800}
        .lp-scar{display:inline-block;background:#fee2e2;color:#b91c1c;font-weight:800;font-size:14px;padding:6px 14px;border-radius:99px;margin:2px 0 14px}.lp-scar.sm{font-size:12px;padding:3px 10px;margin:4px 0 0}
        .lp-btn{position:relative;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;gap:10px;width:100%;max-width:420px;border:0;cursor:pointer;font-family:inherit;font-size:19px;font-weight:900;color:var(--lp-btn-text);padding:17px 30px;border-radius:calc(var(--lp-r) + 2px);background:linear-gradient(135deg,var(--lp-primary),var(--lp-dark));box-shadow:0 18px 34px -14px var(--lp-primary);animation:lpring 2.4s infinite;transition:transform .2s}
        .lp-btn:hover{transform:translateY(-2px)}.lp-btn:active{transform:scale(.98)}
        .lp-btn::after{content:'';position:absolute;top:0;left:0;width:34%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.4),transparent);transform:translateX(-170%) skewX(-20deg);animation:lpshine 3.4s ease-in-out infinite}
        .lp-btn-w{background:#fff;color:var(--lp-dark);box-shadow:0 18px 34px -16px rgba(0,0,0,.5)}
        @keyframes lpshine{0%,55%{transform:translateX(-170%) skewX(-20deg)}100%{transform:translateX(480%) skewX(-20deg)}}
        @keyframes lpring{0%{box-shadow:0 18px 34px -14px var(--lp-primary),0 0 0 0 color-mix(in srgb,var(--lp-primary) 45%,transparent)}70%,100%{box-shadow:0 18px 34px -14px var(--lp-primary),0 0 0 16px transparent}}
        .lp-trust{display:flex;flex-wrap:wrap;gap:8px 16px;margin-top:18px;font-size:13px;font-weight:700;opacity:.9}
        .lp-trust span{display:inline-flex;align-items:center;gap:6px}.lp-trust i{font-style:normal}
        .lp-frame{position:relative;border-radius:calc(var(--lp-r) + 10px);padding:10px;background:linear-gradient(145deg,color-mix(in srgb,var(--lp-primary) 35%,transparent),transparent 60%);box-shadow:0 40px 70px -34px color-mix(in srgb,var(--lp-primary) 70%,#000)}
        .lp-frame img{width:100%;display:block;border-radius:calc(var(--lp-r) + 4px);background:var(--lp-card);animation:lpfloat 6s ease-in-out infinite}
        @keyframes lpfloat{50%{transform:translateY(-8px)}}
        .lp-float{position:absolute;top:-10px;inset-inline-start:-6px;background:#dc2626;color:#fff;font-weight:900;border-radius:99px;padding:9px 16px;font-size:18px;box-shadow:0 14px 26px -10px rgba(220,38,38,.7);transform:rotate(-6deg)}
        /* benefits */
        .lp-ben{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(210px,1fr))}
        .lp-bi{height:100%;transition:transform .25s,box-shadow .25s,border-color .25s}
        .lp-bi:hover{transform:translateY(-4px);border-color:var(--lp-primary);box-shadow:0 22px 40px -26px var(--lp-primary)}
        .lp-ic{width:50px;height:50px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:26px;margin-bottom:12px;background:linear-gradient(135deg,var(--lp-soft),color-mix(in srgb,var(--lp-primary) 4%,transparent));border:1px solid color-mix(in srgb,var(--lp-primary) 25%,transparent)}
        .lp-bi p{opacity:.78;margin:6px 0 0;line-height:1.8;font-size:14.5px}
        /* gallery */
        .lp-gal{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}
        .lp-gal>div:first-child{grid-column:span 2;grid-row:span 2}
        .lp-gi{all:unset;display:block;cursor:zoom-in;border-radius:var(--lp-r);overflow:hidden;aspect-ratio:1;width:100%;height:100%;background:var(--lp-card)}
        .lp-gi img{width:100%;height:100%;object-fit:cover;transition:transform .6s}
        .lp-gi:hover img{transform:scale(1.08)}
        .lp-lb{position:fixed;inset:0;z-index:120;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;padding:16px;cursor:zoom-out}
        .lp-lb img{max-width:100%;max-height:100%;border-radius:12px}
        /* video */
        .lp-video{position:relative;padding-top:56.25%;border-radius:calc(var(--lp-r) + 4px);overflow:hidden;box-shadow:0 34px 60px -30px color-mix(in srgb,var(--lp-primary) 70%,#000);border:1px solid var(--lp-line)}
        .lp-video iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
        .lp-body{line-height:2.05;white-space:pre-wrap;margin:0;font-size:16.5px;opacity:.92}
        /* testimonials */
        .lp-tst{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(230px,1fr))}
        .lp-tc{position:relative;margin:0;height:100%}
        .lp-q{position:absolute;top:-6px;inset-inline-end:14px;font-size:70px;line-height:1;color:var(--lp-primary);opacity:.18;font-family:Georgia,serif}
        .lp-tc blockquote{margin:8px 0 14px;line-height:1.9;font-size:15px}
        .lp-tc figcaption{display:flex;align-items:center;gap:10px}
        .lp-tc figcaption img,.lp-av{width:38px;height:38px;border-radius:50%;object-fit:cover}
        .lp-av{display:inline-flex;align-items:center;justify-content:center;background:var(--lp-primary);color:var(--lp-btn-text);font-weight:900}
        /* faq */
        .lp-faq{display:grid;gap:10px}
        .lp-fq{background:var(--lp-card);border:1px solid var(--lp-line);border-radius:var(--lp-r);overflow:hidden;transition:border-color .2s}
        .lp-fq.open{border-color:var(--lp-primary)}
        .lp-fq button{all:unset;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:12px;width:100%;box-sizing:border-box;padding:16px 18px;font-weight:800;font-size:15.5px}
        .lp-fq button i{font-style:normal;font-size:22px;color:var(--lp-primary);transition:transform .3s}
        .lp-fq.open button i{transform:rotate(45deg)}
        .lp-fa{display:grid;grid-template-rows:0fr;transition:grid-template-rows .3s ease}
        .lp-fq.open .lp-fa{grid-template-rows:1fr}
        .lp-fa>div{overflow:hidden}
        .lp-fa p{margin:0;padding:0 18px 18px;opacity:.82;line-height:1.9}
        /* guarantee */
        .lp-guar{display:flex;gap:16px;align-items:center;border-radius:calc(var(--lp-r) + 4px);padding:20px;border:1.5px solid var(--lp-primary);background:linear-gradient(135deg,var(--lp-soft),transparent)}
        .lp-guar h3{margin:0 0 4px;font-size:18px;font-weight:900}.lp-guar p{margin:0;opacity:.85;line-height:1.8}
        .lp-shield{flex:none;width:62px;height:62px;border-radius:20px;display:flex;align-items:center;justify-content:center;font-size:32px;background:var(--lp-primary);box-shadow:0 14px 26px -12px var(--lp-primary)}
        /* countdown */
        .lp-cd{border-radius:calc(var(--lp-r) + 4px);padding:20px;text-align:center;color:var(--lp-btn-text);background:linear-gradient(135deg,var(--lp-primary),var(--lp-dark))}
        .lp-cd-t{font-weight:800;margin-bottom:12px;opacity:.95}
        .lp-cd-r{display:flex;justify-content:center;align-items:center;gap:8px}
        .lp-cd-b{background:rgba(0,0,0,.22);border-radius:14px;min-width:70px;padding:10px 6px}
        .lp-cd-b b{display:block;font-size:34px;font-weight:900;line-height:1.1}.lp-cd-b small{opacity:.8;font-size:11px}
        .lp-cd-c{font-size:28px;font-weight:900;opacity:.7}
        /* cta */
        .lp-cta{text-align:center;border-radius:calc(var(--lp-r) + 8px);padding:34px 20px;color:var(--lp-btn-text);background:linear-gradient(135deg,var(--lp-primary),var(--lp-dark))}
        .lp-cta h2{margin:0 0 18px;font-size:clamp(22px,4.6vw,32px);font-weight:900}
        /* order */
        .lp-order{position:relative;border-radius:calc(var(--lp-r) + 8px);padding:22px 18px 20px;background:var(--lp-card);border:1.5px solid color-mix(in srgb,var(--lp-primary) 55%,transparent);box-shadow:0 40px 70px -36px color-mix(in srgb,var(--lp-primary) 70%,#000)}
        .lp-ribbon{margin:-22px -18px 16px;border-radius:calc(var(--lp-r) + 6px) calc(var(--lp-r) + 6px) 0 0;padding:10px 14px;text-align:center;font-size:13px;font-weight:800;color:var(--lp-btn-text);background:linear-gradient(135deg,var(--lp-primary),var(--lp-dark))}
        .lp-prod{display:flex;gap:14px;align-items:center;padding:12px;border-radius:var(--lp-r);border:1px dashed var(--lp-line);margin-bottom:14px}
        .lp-prod img{width:74px;height:74px;border-radius:14px;object-fit:cover;flex:none}
        .lp-qrow{display:flex;justify-content:space-between;align-items:center;margin:12px 0;font-weight:800}
        .lp-safe{display:flex;flex-wrap:wrap;justify-content:center;gap:6px 14px;margin-top:14px;font-size:12px;opacity:.75;font-weight:700}
        .lp-order .card,.lp-order .frm{background:transparent;box-shadow:none;border:0;padding:0}
        /* sticky + whatsapp */
        .lp-sticky{position:fixed;bottom:0;left:0;right:0;padding:10px 16px calc(10px + env(safe-area-inset-bottom));background:color-mix(in srgb,var(--lp-bg) 82%,transparent);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border-top:1px solid var(--lp-line);z-index:50;display:flex;justify-content:center;animation:lpup .3s}
        @keyframes lpup{from{transform:translateY(100%)}}
        .lp-wa{position:fixed;bottom:${st.sticky_cta ? 86 : 18}px;left:16px;width:54px;height:54px;border-radius:50%;background:#25d366;color:#fff;display:flex;align-items:center;justify-content:center;font-size:27px;z-index:60;text-decoration:none;box-shadow:0 12px 26px -8px rgba(37,211,102,.7)}
        .lp .card{background:var(--lp-card);color:var(--lp-text)}
        @media(max-width:560px){.lp-sec{padding:20px 0}.lp-guar{flex-direction:column;text-align:center}.lp-gal>div:first-child{grid-column:span 2;grid-row:span 1}.lp-cd-b{min-width:62px}.lp-cd-b b{font-size:28px}}
        @media(prefers-reduced-motion:reduce){.lp-rv{opacity:1;transform:none;transition:none}.lp-btn,.lp-btn::after,.lp-frame img{animation:none}.lp-sticky{animation:none}}
      `}</style>
      <div className="lp-wrap">
        {all.map((s) => (
          <SectionWrap key={s.id} s={s} builder={builder} picked={sel === s.id} onPick={pick}>
            <Section s={s} ctx={ctx} />
          </SectionWrap>
        ))}
        
      </div>
      {st.sticky_cta && showSticky ? (
        <div className="lp-sticky"><button type="button" className="lp-btn" onClick={scrollToOrder}>{st.sticky_text || fn.cta_text || 'اطلب الآن'} · {money(price, cur)}</button></div>
      ) : null}
      {wa ? <a className="lp-wa" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" aria-label="واتساب"><WaIcon size={32} /></a> : null}
      {light ? <div className="lp-lb" onClick={() => setLight('')} role="dialog" aria-label="الصورة"><img src={light} alt="" /></div> : null}
    </div>
  );
}
