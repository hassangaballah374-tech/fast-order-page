'use client';
import { useT } from '../I18n';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useShop } from './StoreContext';
import { track } from './tracker';
import { money, waLink, normalizePhone, isValidEgPhone, safeUrl } from '../../lib/storeKit';
import { flowHit } from './flowClient';

export default function ThankYouView({ flow }) {
  const tx = useT();
  const { slug, name, cfg, cur, base, clear, ready } = useShop();
  const ty = cfg.thankyou || {};
  const [o, setO] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const fired = useRef(false);

  useEffect(() => {
    let v = null;
    try { v = JSON.parse(sessionStorage.getItem(`spike_last_${slug}`)); } catch { /* تجاهل */ }
    setO(v); setLoaded(true);
  }, [slug]);

  useEffect(() => { if (flow) flowHit(slug, flow.slug, flow.step, 'view'); }, [flow?.slug, flow?.step]);

  useEffect(() => {
    if (!o || !ready || fired.current) return undefined;
    fired.current = true;
    let done = false;
    try { done = sessionStorage.getItem(`spike_purchased_${slug}_${o.order_no}`) === '1'; sessionStorage.setItem(`spike_purchased_${slug}_${o.order_no}`, '1'); } catch { /* تجاهل */ }
    if (!done) track('Purchase', { value: o.total, items: o.items || [] }, o.event_id);
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
        <h2>{tx('لا توجد بيانات طلب')}</h2>
        <p className="mut" style={{ margin: '8px 0 16px' }}>{tx('لو طلبت قبل كده تقدر تتابع طلبك من صفحة التتبع')}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link className="b p" href={`${base}/track`}>{tx('تتبع طلبك')}</Link>
          <Link className="b" href={base}>{tx('الرئيسية')}</Link>
        </div>
      </div>
    );
  }

  const wa = normalizePhone(cfg.contact?.whatsapp);
  const waOk = ty.show_wa_confirm !== false && cfg.whatsapp?.enabled && isValidEgPhone(wa);
  const trackHref = `${base}/track${o.token ? `?token=${encodeURIComponent(o.token)}` : ''}`;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const share = async () => {
    const data = { title: name, text: tx('اشتريت من {1} 🛍️', [name]), url: `${origin}${base}` };
    try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(data.url); alert(tx('تم نسخ رابط المتجر')); } } catch { /* تجاهل */ }
  };

  return (
    <div className="wrap ty">
      <div className="confetti" aria-hidden="true">{Array.from({ length: 26 }, (_, i) => <i key={i} style={{ left: `${(i * 3.9 + 2) % 100}%`, animationDelay: `${(i % 9) * 0.11}s`, background: ['var(--c)', '#f59e0b', '#ec4899', '#3b82f6'][i % 4] }} />)}</div>
      <div className="ty-ok" aria-hidden="true"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24" /><path d="M14 27l8 8 16-17" /></svg></div>
      <h1 style={{ margin: '10px 0' }}>{tx(ty.title || 'تم استلام طلبك 🎉')}</h1>
      <p className="mut" style={{ maxWidth: 520, margin: '0 auto 18px' }}>{tx(ty.message)}</p>
      <div className="card ty-sum">
        <div className="ty-rw"><span className="mut">{tx('رقم الطلب')}</span><span className="ty-no"><b className="num">#{o.order_no}</b><button type="button" onClick={() => { try { navigator.clipboard.writeText(String(o.order_no)); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* تجاهل */ } }}>{copied ? tx('تم النسخ ✓') : tx('نسخ')}</button></span></div>
        {[...(o.items || []), ...(o.upsells || [])].filter((i) => i && i.title).map((i, k) => <div className="ty-rw" key={k}><span>{i.title} × <span className="num">{i.qty || 1}</span></span></div>)}
        <div className="ty-rw"><span className="mut">{tx('الإجمالي · الدفع عند الاستلام')}</span><b className="num">{money((Number(o.total) || 0) + (Number(o.extra) || 0), cur)}</b></div>
      </div>
      <div className="nxt">
        <div><i>📞</i><span>{tx('هنتصل بيك لتأكيد الطلب')}<small>{tx('رد على المكالمة عشان الطلب يتجهّز بسرعة')}</small></span></div>
        <div><i>🚚</i><span>{tx('بعد التأكيد بنشحنه لعنوانك')}<small>{tx('تقدر تتابع حالته في أي وقت')}</small></span></div>
        <div><i>💵</i><span>{tx('ادفع للمندوب عند الاستلام')}<small>{tx('عاين طلبك وبعدين ادفع')}</small></span></div>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        {waOk ? <a className="b wa" target="_blank" rel="noopener noreferrer" href={waLink(wa, tx('مرحباً، أنا {1}، أريد تأكيد طلبي رقم {2}', [o.name || '', o.order_no]))} onClick={() => track('Contact', {})}>{tx('💬 أكّد طلبك على واتساب')}</a> : null}
        {ty.show_track !== false ? <Link className="b p" href={trackHref}>{tx('تتبع الطلب')}</Link> : null}
        {ty.show_share !== false ? <button type="button" className="b" onClick={share}>{tx('شارك المتجر')}</button> : null}
        <Link className="b" href={base}>{tx('متابعة التسوق')}</Link>
      </div>
      {safeUrl(ty.redirect_url) ? <p className="mut" style={{ marginTop: 14, fontSize: 13 }}>{tx('سيتم تحويلك خلال ثوانٍ...')}</p> : null}
    </div>
  );
}
