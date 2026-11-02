'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useShop } from './StoreContext';
import { track } from './tracker';
import { money, effectivePrice } from '../../lib/storeKit';
import { nextHref } from '../../lib/flowKit';
import { flowHit, goTo, readLast, writeLast } from './flowClient';

const CSS = `
.upv{max-width:560px;margin:0 auto;padding:18px 14px 40px;text-align:center}
.upv-steps{display:flex;gap:6px;justify-content:center;margin-bottom:16px}
.upv-steps i{height:5px;width:42px;border-radius:9px;background:var(--ln)}.upv-steps i.on{background:var(--c)}
.upv-ok{display:inline-flex;align-items:center;gap:8px;background:color-mix(in srgb,var(--c) 14%,transparent);color:var(--ink);border-radius:99px;padding:7px 14px;font-weight:800;font-size:13.5px}
.upv h1{font-size:clamp(24px,6vw,34px);line-height:1.3;margin:14px 0 8px;font-weight:900}
.upv-sub{color:var(--mut);margin:0 auto 16px;max-width:460px;line-height:1.8}
.upv-card{background:var(--card);border:1px solid var(--ln);border-radius:calc(var(--r) + 6px);padding:14px;box-shadow:0 22px 44px -26px rgba(0,0,0,.35)}
.upv-img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:var(--r);display:block;background:var(--bg)}
.upv-t{font-weight:900;font-size:19px;margin:12px 0 6px}
.upv-price{display:flex;gap:10px;justify-content:center;align-items:baseline;flex-wrap:wrap}
.upv-price b{font-size:34px;font-weight:900;color:var(--c)}
.upv-price s{color:var(--mut);font-size:17px}
.upv-off{background:#dc2626;color:#fff;border-radius:99px;padding:3px 10px;font-weight:900;font-size:13px}
.upv-pts{list-style:none;padding:0;margin:12px 0 0;display:grid;gap:8px;text-align:start}
.upv-pts li{display:flex;gap:9px;align-items:flex-start;font-weight:700}
.upv-pts li::before{content:'✓';flex:none;width:21px;height:21px;border-radius:50%;background:var(--c);color:var(--onc);display:grid;place-items:center;font-size:12px;margin-top:2px}
.upv-cd{margin:16px 0 4px;font-weight:800;color:var(--mut);font-size:14px}
.upv-cd b{display:inline-block;margin-inline-start:6px;font-size:26px;color:var(--ink);letter-spacing:2px}
.upv-yes{width:100%;margin-top:14px;border:0;cursor:pointer;font:900 19px 'Cairo',sans-serif;color:var(--onc);background:var(--c);padding:17px;border-radius:calc(var(--r) + 2px);box-shadow:0 18px 34px -14px var(--c);transition:transform .15s}
.upv-yes:hover{transform:translateY(-2px)}.upv-yes:disabled{opacity:.6;cursor:wait}
.upv-no{display:block;margin:14px auto 0;background:none;border:0;color:var(--mut);text-decoration:underline;cursor:pointer;font:700 14px 'Cairo',sans-serif}
.upv-err{background:#fee2e2;color:#991b1b;border-radius:var(--r);padding:10px 12px;margin-top:12px;font-weight:700}
.upv-note{color:var(--mut);font-size:12.5px;margin-top:10px}
`;

export default function UpsellView({ flow, step, product: p }) {
  const { slug, cur, base } = useShop();
  const [last, setLast] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [left, setLeft] = useState(null);
  const gone = useRef(false);
  const price = effectivePrice(p);
  const qty = step.qty || 1;
  const unit = price * (1 - step.percent / 100);
  const total = Math.round(unit * qty * 100) / 100;
  const was = Math.round(price * qty * 100) / 100;
  const acceptUrl = nextHref(base, flow, step.id, 'accept');
  const declineUrl = nextHref(base, flow, step.id, 'decline');
  const img = step.image || p.images?.[0] || '';
  const idx = flow.steps.findIndex((s) => s.id === step.id);

  useEffect(() => { setLast(readLast(slug) || null); flowHit(slug, flow.slug, step.id, 'view'); }, [slug, flow.slug, step.id]);

  const decline = () => {
    if (gone.current) return;
    gone.current = true;
    flowHit(slug, flow.slug, step.id, 'decline');
    setTimeout(() => goTo(declineUrl), 120);
  };

  /* عدّاد العرض: لما يخلص بنكمّل للخطوة اللي بعد الرفض */
  useEffect(() => {
    if (!step.minutes || !last?.token) return undefined;
    const key = `spike_up_${slug}_${last.order_no}_${step.id}`;
    let end = 0;
    try { end = Number(sessionStorage.getItem(key)); } catch { /* تجاهل */ }
    if (!end) { end = Date.now() + step.minutes * 60000; try { sessionStorage.setItem(key, String(end)); } catch { /* تجاهل */ } }
    const tick = () => { const l = Math.max(0, end - Date.now()); setLeft(l); if (l <= 0) decline(); };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [step.minutes, step.id, last?.token]);

  const accept = async () => {
    if (busy || !last?.token) return;
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/store/upsell', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, token: last.token, flow: flow.slug, step: step.id }) });
      const j = await r.json();
      if (!j.ok) { setErr(j.error || 'تعذر إضافة العرض'); setBusy(false); return; }
      if (!j.already && j.item) {
        const cur0 = readLast(slug) || last;
        writeLast(slug, { ...cur0, upsells: [...(cur0.upsells || []), { id: j.item.id, title: j.item.title, price: j.item.price, qty: j.item.qty }], extra: (Number(cur0.extra) || 0) + (Number(j.added) || 0) });
        track('Purchase', { value: j.added, items: [{ id: j.item.id, title: j.item.title, price: j.item.price, qty: j.item.qty }] }, j.event_id);
      }
      goTo(acceptUrl);
    } catch { setErr('تعذر الاتصال، حاول مرة أخرى'); setBusy(false); }
  };

  if (last === undefined) return <div className="wrap empty">...</div>;
  if (!last?.token) {
    return (
      <div className="wrap empty">
        <div style={{ fontSize: 56 }}>🎁</div>
        <h2>العرض ده بيظهر بعد تأكيد الطلب</h2>
        <p className="mut" style={{ margin: '8px 0 16px' }}>اطلب الأول وبعدين هتشوف عروضنا الخاصة.</p>
        <Link className="b p" href={base}>الرئيسية</Link>
      </div>
    );
  }

  const p2 = (n) => String(n).padStart(2, '0');
  const s = left == null ? 0 : Math.floor(left / 1000);
  return (
    <div className="upv">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="upv-steps" aria-hidden="true">{flow.steps.map((x, i) => <i key={x.id} className={i <= idx ? 'on' : ''} />)}</div>
      <span className="upv-ok">✅ تم تسجيل طلبك رقم <b className="num">#{last.order_no}</b></span>
      <h1>{step.headline}</h1>
      {step.subheadline ? <p className="upv-sub">{step.subheadline}</p> : null}
      <div className="upv-card">
        {img ? <img className="upv-img" src={img} alt={p.title} /> : null}
        <div className="upv-t">{p.title}{qty > 1 ? ` × ${qty}` : ''}</div>
        <div className="upv-price">
          <b className="num">{money(total, cur)}</b>
          {step.percent > 0 ? <><s className="num">{money(was, cur)}</s><span className="upv-off">وفّر {step.percent}%</span></> : null}
        </div>
        {step.points?.length ? <ul className="upv-pts">{step.points.map((t, i) => <li key={i}>{t}</li>)}</ul> : null}
      </div>
      {step.minutes > 0 && left != null ? <div className="upv-cd">⏳ العرض بينتهي خلال <b className="num" dir="ltr">{p2(Math.floor(s / 60))}:{p2(s % 60)}</b></div> : null}
      {err ? <div className="upv-err">{err}{' '}<button type="button" className="upv-no" style={{ display: 'inline', margin: 0 }} onClick={() => goTo(acceptUrl)}>كمّل بدون العرض</button></div> : null}
      <button type="button" className="upv-yes" onClick={accept} disabled={busy}>{busy ? 'جاري الإضافة...' : `${step.accept_text} · ${money(total, cur)}`}</button>
      <button type="button" className="upv-no" onClick={decline}>{step.decline_text}</button>
      <p className="upv-note">بيتضاف لنفس الطلب بنفس بياناتك · الدفع عند الاستلام</p>
    </div>
  );
}
