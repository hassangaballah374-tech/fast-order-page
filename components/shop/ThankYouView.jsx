'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useShop } from './StoreContext';
import { track } from './tracker';
import { money, waLink, normalizePhone, isValidEgPhone, safeUrl } from '../../lib/storeKit';

export default function ThankYouView() {
  const { slug, name, cfg, cur, base, clear, ready } = useShop();
  const ty = cfg.thankyou || {};
  const [o, setO] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const fired = useRef(false);

  useEffect(() => {
    let v = null;
    try { v = JSON.parse(sessionStorage.getItem(`spike_last_${slug}`)); } catch { /* تجاهل */ }
    setO(v); setLoaded(true);
  }, [slug]);

  useEffect(() => {
    if (!o || !ready || fired.current) return undefined;
    fired.current = true;
    let done = false;
    try { done = sessionStorage.getItem(`spike_purchased_${slug}_${o.order_no}`) === '1'; sessionStorage.setItem(`spike_purchased_${slug}_${o.order_no}`, '1'); } catch { /* تجاهل */ }
    if (!done && !o.held) track('Purchase', { value: o.total, items: o.items || [] }, o.event_id);
    clear();
    const url = safeUrl(ty.redirect_url);
    if (!url) return undefined;
    const t = setTimeout(() => { window.location.href = url; }, 4000);
    return () => clearTimeout(t);
  }, [o, ready]);

  if (!loaded) return <div className="wrap empty">...</div>;
  if (!o) {
    return (
      <div className="wrap empty">
        <div style={{ fontSize: 56 }}>📦</div>
        <h2>لا توجد بيانات طلب</h2>
        <p className="mut" style={{ margin: '8px 0 16px' }}>لو طلبت قبل كده تقدر تتابع طلبك من صفحة التتبع</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link className="b p" href={`${base}/track`}>تتبع طلبك</Link>
          <Link className="b" href={base}>الرئيسية</Link>
        </div>
      </div>
    );
  }

  const wa = normalizePhone(cfg.contact?.whatsapp);
  const waOk = ty.show_wa_confirm !== false && cfg.whatsapp?.enabled && isValidEgPhone(wa);
  const trackHref = `${base}/track${o.token ? `?token=${encodeURIComponent(o.token)}` : ''}`;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const share = async () => {
    const data = { title: name, text: `اشتريت من ${name} 🛍️`, url: `${origin}${base}` };
    try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(data.url); alert('تم نسخ رابط المتجر'); } } catch { /* تجاهل */ }
  };

  return (
     <div className="wrap ty">
      {o.held ? (
     <div className="card" style={{ margin: '0 0 14px', padding: 14, textAlign: 'center', border: '1px solid #b7791f' }}>
          <div style={{ fontSize: 34 }}>⏳</div>
          <b>طلبك تحت التنفيذ</b>
          <p className="mut" style={{ margin: '6px 0 0' }}>
            لقينا طلب سابق بنفس الرقم لنفس المنتج، فطلبك هذا بيتراجع من فريقنا وهنتواصل معاك للتأكيد قريباً.
          </p>
        </div>
      ) : null}
      <div className="ic">🎉</div>
      <h1 style={{ margin: '10px 0' }}>{ty.title || 'تم استلام طلبك 🎉'}</h1>
      <p className="mut" style={{ maxWidth: 520, margin: '0 auto 18px' }}>{ty.message}</p>
      <div className="card" style={{ maxWidth: 420, margin: '0 auto 18px' }}>
        <p>رقم الطلب: <b className="num">#{o.order_no}</b></p>
        <p>الإجمالي: <b className="num">{money(o.total, cur)}</b> · الدفع عند الاستلام</p>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        {waOk ? <a className="b wa" target="_blank" rel="noopener noreferrer" href={waLink(wa, `مرحباً، أنا ${o.name || ''}، أريد تأكيد طلبي رقم ${o.order_no}`)} onClick={() => track('Contact', {})}>💬 أكّد طلبك على واتساب</a> : null}
        {ty.show_track !== false ? <Link className="b p" href={trackHref}>تتبع الطلب</Link> : null}
        {ty.show_share !== false ? <button type="button" className="b" onClick={share}>شارك المتجر</button> : null}
        <Link className="b" href={base}>متابعة التسوق</Link>
      </div>
      {safeUrl(ty.redirect_url) ? <p className="mut" style={{ marginTop: 14, fontSize: 13 }}>سيتم تحويلك خلال ثوانٍ...</p> : null}
    </div>
  );
}
