'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useShop, captureUtm, hit } from './StoreContext';
import { track } from './tracker';
import SearchBox from './SearchBox';
import MiniCart from './MiniCart';
import { fillTemplate, ago, safeUrl, waLink, normalizePhone, isValidEgPhone } from '../../lib/storeKit';

const sget = (k) => { try { return sessionStorage.getItem(k); } catch { return null; } };
const sset = (k, v) => { try { sessionStorage.setItem(k, v); } catch { /* تجاهل */ } };

/* التقاط UTM/الإحالة + عدّ الزيارة مرة لكل جلسة */
function HitAndUtm() {
  const { slug } = useShop();
  const path = usePathname();
  useEffect(() => {
    captureUtm(slug);
    const ref = (() => { try { return new URLSearchParams(window.location.search).get('ref') || ''; } catch { return ''; } })();
    if (!sget(`spike_hit_${slug}`)) {
      sset(`spike_hit_${slug}`, '1');
      hit(slug, 'visit', ref ? { ref } : {});
    }
    const m = String(path || '').match(/\/f\/([a-z0-9؀-ۿ-]+)/i);
    if (m && /^[a-z0-9-]+$/.test(m[1]) && !sget(`spike_fhit_${slug}_${m[1]}`)) {
      sset(`spike_fhit_${slug}_${m[1]}`, '1');
      hit(slug, 'visit', { funnel: m[1] });
    }
  }, [slug, path]);
  return null;
}

function SalesPopup() {
  const { slug, cfg } = useShop();
  const path = usePathname();
  const pc = cfg.popup || {};
  const [item, setItem] = useState(null);
  const stop = useRef(false);
  const skip = /\/(cart|thank-you)/.test(path || '');
  useEffect(() => {
    if (!pc.enabled || skip) return undefined;
    stop.current = false;
    const timers = [];
    (async () => {
      try {
        const r = await fetch(`/api/store/popup?slug=${encodeURIComponent(slug)}`);
        const j = await r.json();
        const items = j.items || [];
        if (!items.length || stop.current) return;
        let shown = 0;
        const next = () => {
          if (stop.current || shown >= (Number(pc.max_per_visit) || 5)) return;
          setItem(items[shown % items.length]);
          shown += 1;
          timers.push(setTimeout(() => setItem(null), 6000));
          timers.push(setTimeout(next, (Number(pc.interval) || 18) * 1000));
        };
        timers.push(setTimeout(next, (Number(pc.delay) || 6) * 1000));
      } catch { /* تجاهل */ }
    })();
    return () => { stop.current = true; timers.forEach(clearTimeout); };
  }, [slug, pc.enabled, skip]);
  if (!item) return null;
  return (
    <div className={`pop ${pc.position === 'bottom-end' ? 'bottom-end' : 'bottom-start'}`} role="status">
      <button type="button" aria-label="إغلاق" onClick={() => setItem(null)}>✕</button>
      🛍️ {fillTemplate(pc.text, { name: item.name, gov: item.gov, product: item.product, ago: ago(item.at) })}
    </div>
  );
}

function Downsell() {
  const { slug, cfg } = useShop();
  const path = usePathname();
  const d = cfg.downsell || {};
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const relevant = /\/(p\/|cart|f\/)/.test(path || '');
  useEffect(() => {
    if (!d.enabled || !d.coupon_code || !relevant || sget(`spike_ds_${slug}`)) return undefined;
    const fire = () => { if (!sget(`spike_ds_${slug}`)) { sset(`spike_ds_${slug}`, '1'); setOpen(true); } };
    const touch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    if (d.trigger === 'exit' && !touch) {
      const onOut = (e) => { if (!e.relatedTarget && e.clientY <= 8) fire(); };
      document.addEventListener('mouseout', onOut);
      return () => document.removeEventListener('mouseout', onOut);
    }
    const t = setTimeout(fire, (Number(d.delay_seconds) || 25) * 1000);
    return () => clearTimeout(t);
  }, [slug, d.enabled, d.coupon_code, d.trigger, d.delay_seconds, relevant]);
  if (!open) return null;
  const use = () => {
    try { localStorage.setItem(`spike_coupon_${slug}`, d.coupon_code); } catch { /* تجاهل */ }
    try { navigator.clipboard?.writeText(d.coupon_code); setCopied(true); } catch { /* تجاهل */ }
    setOpen(false);
    window.dispatchEvent(new Event('spike-coupon'));
  };
  return (
    <div className="mdl" onClick={() => setOpen(false)}>
      <div className="mdl-b" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3>{d.title}</h3>
        <p className="mut">{d.body}</p>
        <div className="code num" dir="ltr">{d.coupon_code}</div>
        <button type="button" className="b p blk" onClick={use}>{copied ? 'تم النسخ ✓' : 'استخدم الكود وكمّل طلبك'}</button>
        <button type="button" className="b blk" onClick={() => setOpen(false)}>لا، شكراً</button>
      </div>
    </div>
  );
}

function WelcomeBack() {
  const { slug, cfg, count, ready, base } = useShop();
  const r = cfg.retarget || {};
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    if (!ready || !r.welcome_back || sget(`spike_wb_${slug}`)) return;
    let seen = false;
    try { seen = !!localStorage.getItem(`spike_seen_${slug}`); localStorage.setItem(`spike_seen_${slug}`, '1'); } catch { /* تجاهل */ }
    sset(`spike_wb_${slug}`, '1');
    if (!seen) return;
    const hasCart = r.cart_reminder && count > 0;
    if (hasCart && r.coupon_code) { try { localStorage.setItem(`spike_coupon_${slug}`, r.coupon_code); } catch { /* تجاهل */ } }
    setMsg({ text: r.welcome_text, hasCart, code: hasCart ? r.coupon_code : '' });
    const t = setTimeout(() => setMsg(null), 9000);
    return () => clearTimeout(t);
  }, [ready]);
  if (!msg) return null;
  return (
    <div className="welc" role="status">
      <button type="button" aria-label="إغلاق" onClick={() => setMsg(null)}>✕</button>
      {msg.text}
      {msg.hasCart ? <> لديك طلب لم يكتمل، <Link href={`${base}/cart`}>أكمله الآن</Link>{msg.code ? <> واستخدم كود <b dir="ltr">{msg.code}</b></> : null}</> : null}
    </div>
  );
}

export default function Shell({ children, footerExtra }) {
  const { name, cfg, base, count, pages, live, reason } = useShop();
  const path = usePathname();
  const b = cfg.brand || {};
  const c = cfg.contact || {};
  const social = cfg.social || {};
  const wa = normalizePhone(c.whatsapp);
  const waOk = cfg.whatsapp?.enabled && isValidEgPhone(wa);
  const annLink = safeUrl(b.announcement_link);

  return (
    <>
      <HitAndUtm />
      {!live ? <div className="ann" style={{ background: '#b45309', color: '#fff' }}>{reason === 'inactive' ? 'المتجر في وضع الإعداد: لم يتم تفعيله بعد، الطلبات متوقفة مؤقتاً' : 'المتجر متوقف مؤقتاً عن استقبال الطلبات'}</div> : null}
      {b.announcement ? <div className="ann">{annLink ? <a href={annLink}>{b.announcement}</a> : b.announcement}</div> : null}
      <header className="hd">
        <div className="wrap hd-in">
          <Link href={base} className="logo">{b.logo ? <img src={b.logo} alt={name} /> : null}<span>{name}</span></Link>
          <nav className="nav" aria-label="القائمة">
            <Link href={base}>الرئيسية</Link>
            <Link href={`${base}/products`}>كل المنتجات</Link>
            <Link href={`${base}/favorites`}>♥ المفضلة</Link>
            <Link href={`${base}/track`}>تتبع طلبك</Link>
          </nav>
          <span className="hd-sp" />
          <SearchBox />
          <Link href={`${base}/cart`} className="cartb" aria-label="السلة" onClick={(e) => { if (cfg.cart?.drawer === false || /\/(cart|checkout)/.test(path || '')) return; e.preventDefault(); window.dispatchEvent(new Event('spike:cart-open')); }}>🛒 السلة{count > 0 ? <span className="cnt num">{count}</span> : null}</Link>
        </div>
      </header>

      <MiniCart />
      <main>{children}</main>

      {footerExtra}
      <footer className="ft">
        <div className="wrap ft-in">
          <div>
            <h4>{name}</h4>
            {b.tagline ? <p className="mut">{b.tagline}</p> : null}
            {c.address ? <p className="mut">📍 {c.address}</p> : null}
            {c.phone ? <p className="mut num" dir="ltr" style={{ textAlign: 'start' }}>📞 {c.phone}</p> : null}
            {c.email ? <p className="mut num" dir="ltr" style={{ textAlign: 'start' }}>✉️ {c.email}</p> : null}
          </div>
          <div>
            <h4>روابط</h4>
            <Link href={`${base}/products`}>كل المنتجات</Link>
            <Link href={`${base}/track`}>تتبع طلبك</Link>
            <Link href={`${base}/catalog`}>الكتالوج</Link>
            {(pages || []).map((p) => <Link key={p.slug} href={`${base}/page/${p.slug}`}>{p.title}</Link>)}
          </div>
          <div>
            <h4>تابعنا</h4>
            <div className="soc">
              {[['instagram', 'إنستجرام'], ['facebook', 'فيسبوك'], ['tiktok', 'تيك توك'], ['youtube', 'يوتيوب']].map(([k, l]) => (safeUrl(social[k]) ? <a key={k} href={safeUrl(social[k])} target="_blank" rel="noopener noreferrer">{l}</a> : null))}
            </div>
            {waOk ? <p style={{ marginTop: 10 }}><a className="b wa sm" href={waLink(wa, cfg.whatsapp.message)} target="_blank" rel="noopener noreferrer">💬 تواصل معنا على واتساب</a></p> : null}
          </div>
        </div>
        <a className="pwl" href="/" target="_blank" rel="noopener noreferrer" title="سبايك"><img src="https://kunmfgpqyyhmpcpvwuuk.supabase.co/storage/v1/object/public/branding/logo.png?v=3" alt="سبايك" loading="lazy" /></a>
        <p className="pw">متجر مبني على منصة سبايك · الدفع عند الاستلام</p>
      </footer>

      {waOk ? <a className="waf" href={waLink(wa, cfg.whatsapp.message)} target="_blank" rel="noopener noreferrer" aria-label="واتساب" onClick={() => track('Contact', {})}>💬</a> : null}
      <SalesPopup />
      <Downsell />
      <WelcomeBack />
    </>
  );
}
