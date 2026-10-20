'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useShop, getUtm, hit } from './StoreContext';
import { track } from './tracker';
import { GOVERNORATES, money, normalizePhone, isValidEgPhone } from '../../lib/storeKit';

const ss = (k, v) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* تجاهل */ } };

/* نموذج الطلب المشترك (صفحة المنتج، السلة، الفانيل).
   items: [{product_id,title,image,price,qty,options}]، bump: {product_id}|null */
export default function Checkout({ items, bump, buttonText, onSuccess, funnel, title = 'بيانات الشحن' }) {
  const { slug, cfg, cur, zones, base, live } = useShop();
  const router = useRouter();
  const co = cfg.checkout || {};
  const [f, setF] = useState({ name: '', phone: '', phone2: '', email: '', governorate: '', address: '', address2: '', notes: '' });
  const [coupon, setCoupon] = useState('');
  const [appliedCode, setAppliedCode] = useState('');
  const [q, setQ] = useState(null);
  const [qMsg, setQMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [hp, setHp] = useState('');
  const t0 = useRef(Date.now());
  const started = useRef(false);
  const lastCart = useRef('');
  const govs = useMemo(() => (zones && zones.length ? zones.map((z) => z.governorate) : GOVERNORATES.map((g) => g[0])), [zones]);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  useEffect(() => {
    const load = () => { try { const c = localStorage.getItem(`spike_coupon_${slug}`); if (c) { setCoupon(c); setAppliedCode(c); } } catch { /* تجاهل */ } };
    load();
    window.addEventListener('spike-coupon', load);
    return () => window.removeEventListener('spike-coupon', load);
  }, [slug]);

  const itemsKey = JSON.stringify(items.map((i) => [i.product_id, i.qty, i.options])) + (bump?.product_id || '');
  useEffect(() => {
    if (!items.length) { setQ(null); return undefined; }
    const t = setTimeout(async () => {
      try {
        const r = await fetch('/api/store/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, items: items.map((i) => ({ product_id: i.product_id, qty: i.qty, options: i.options })), bump: bump || undefined, governorate: f.governorate, coupon: appliedCode }) });
        const j = await r.json();
        if (j.ok) { setQ(j); setQMsg(appliedCode ? j.couponMsg : ''); setErr(''); } else { setQ(null); setErr(j.error || ''); }
      } catch { /* تجاهل */ }
    }, 350);
    return () => clearTimeout(t);
  }, [itemsKey, f.governorate, appliedCode, slug]);

  const onFocus = () => {
    if (started.current || !items.length) return;
    started.current = true;
    track('InitiateCheckout', { value: q?.total || 0, items: items.map((i) => ({ id: i.product_id, title: i.title, price: i.price, qty: i.qty })) });
    hit(slug, 'checkout');
  };

  const saveAbandoned = () => {
    const phone = normalizePhone(f.phone);
    if (!isValidEgPhone(phone) || !items.length) return;
    const sig = phone + itemsKey;
    if (lastCart.current === sig) return;
    lastCart.current = sig;
    try {
      fetch('/api/store/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true, body: JSON.stringify({ slug, phone, name: f.name, items: items.map((i) => ({ product_id: i.product_id, title: i.title, qty: i.qty, price: i.price })), total: q?.total || 0, utm: getUtm(slug) }) });
    } catch { /* تجاهل */ }
  };

  const applyCoupon = () => { const c = coupon.trim(); setAppliedCode(c); try { if (c) localStorage.setItem(`spike_coupon_${slug}`, c); else localStorage.removeItem(`spike_coupon_${slug}`); } catch { /* تجاهل */ } if (c) track('ApplyCoupon', {}); };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setErr('');
    if (!live) { setErr('المتجر غير مفعّل حالياً، الطلبات متوقفة مؤقتاً'); return; }
    if (!items.length) { setErr('السلة فارغة'); return; }
    if (f.name.trim().length < 2) { setErr('اكتب اسمك بالكامل'); return; }
    if (!isValidEgPhone(normalizePhone(f.phone))) { setErr('رقم الموبايل غير صحيح (مثال: 01012345678)'); return; }
    if (!f.governorate) { setErr('اختر المحافظة'); return; }
    if (f.address.trim().length < 6) { setErr('اكتب العنوان بالتفصيل'); return; }
    setBusy(true);
    try {
      const r = await fetch('/api/store/order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug, customer: f, items: items.map((i) => ({ product_id: i.product_id, qty: i.qty, options: i.options })),
          bump: bump || undefined, coupon: appliedCode || undefined, utm: getUtm(slug), hp, t: Math.round((Date.now() - t0.current) / 1000),
        }),
      });
      const j = await r.json();
      if (!j.ok) { setErr(j.error || 'تعذر إرسال الطلب، حاول مرة أخرى'); setBusy(false); return; }
      ss(`spike_last_${slug}`, { order_no: j.order_no, token: j.token, total: j.total, event_id: j.event_id, name: f.name, phone: f.phone, items: items.map((i) => ({ id: i.product_id, title: i.title, price: i.price, qty: i.qty })) });
      if (onSuccess) onSuccess(j);
      router.push(`${base}/thank-you`);
    } catch { setErr('تعذر الاتصال، حاول مرة أخرى'); setBusy(false); }
  };

  const remain = q && q.free_over > 0 && q.remaining_free != null ? q.remaining_free : null;
  const pct = q && q.free_over > 0 ? Math.min(100, Math.round(((q.subtotal - q.discount) / q.free_over) * 100)) : 0;

  return (
    <form className="frm" onSubmit={submit} onFocus={onFocus} id="checkout">
      <h3>{title}</h3>
      {co.show_images !== false && items.length > 0 && (
        <div>{items.map((i) => (
          <div className="ci" key={i.key || i.product_id} style={{ marginBottom: 6 }}>
            {i.image ? <img src={i.image} alt="" /> : null}
            <div className="ci-b"><b>{i.title}</b><span className="mut">{Object.values(i.options || {}).join(' / ')} × <span className="num">{i.qty}</span></span></div>
          </div>
        ))}</div>
      )}
      <div className="fld"><label>الاسم بالكامل</label><input className="in" autoComplete="name" value={f.name} onChange={set('name')} /></div>
      <div className="r2">
        <div className="fld"><label>رقم الموبايل</label><input className="in num" dir="ltr" inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" value={f.phone} onChange={set('phone')} onBlur={saveAbandoned} /></div>
        {co.phone2 ? <div className="fld"><label>موبايل آخر (اختياري)</label><input className="in num" dir="ltr" inputMode="tel" value={f.phone2} onChange={set('phone2')} /></div> : null}
      </div>
      {co.email ? <div className="fld"><label>البريد الإلكتروني (اختياري)</label><input className="in" dir="ltr" type="email" value={f.email} onChange={set('email')} /></div> : null}
      <div className="fld"><label>المحافظة</label>
        <select className="in" value={f.governorate} onChange={set('governorate')}>
          <option value="">اختر المحافظة</option>
          {govs.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <div className="fld"><label>العنوان بالتفصيل</label><input className="in" autoComplete="street-address" value={f.address} onChange={set('address')} /></div>
      {co.address2 ? <div className="fld"><label>علامة مميزة / عنوان إضافي</label><input className="in" value={f.address2} onChange={set('address2')} /></div> : null}
      {co.note !== false ? <div className="fld"><label>ملاحظات (اختياري)</label><input className="in" value={f.notes} onChange={set('notes')} /></div> : null}
      <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={(e) => setHp(e.target.value)} />

      <div className="fld">
        <label>كود الخصم</label>
        <div className="cpn">
          <input className="in" dir="ltr" value={coupon} onChange={(e) => setCoupon(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } }} />
          <button type="button" className="b" onClick={applyCoupon}>تطبيق</button>
        </div>
        {qMsg ? <div className={q?.coupon ? 'okm' : 'err'} style={{ marginTop: 6 }}>{qMsg}</div> : null}
      </div>

      {cfg.shipping?.show_progress !== false && q && q.free_over > 0 ? (
        <div>
          <div className="prog"><i style={{ width: `${pct}%` }} /></div>
          <p className="mut" style={{ fontSize: 13, marginTop: 4 }}>{remain > 0 ? `أضف ${money(remain, cur)} للحصول على شحن مجاني 🚚` : 'مبروك! الشحن مجاني 🎉'}</p>
        </div>
      ) : null}

      {q ? (
        <div className="sum">
          <div><span>المنتجات</span><b className="num">{money(q.subtotal, cur)}</b></div>
          {q.discount > 0 ? <div><span>الخصم</span><b className="num">- {money(q.discount, cur)}</b></div> : null}
          <div><span>الشحن</span><b className="num">{q.shipping > 0 ? money(q.shipping, cur) : (f.governorate ? 'مجاني' : 'يُحدد بالمحافظة')}</b></div>
          {q.cod_fee > 0 ? <div><span>رسوم الدفع عند الاستلام</span><b className="num">{money(q.cod_fee, cur)}</b></div> : null}
          <div className="tot"><span>الإجمالي</span><b className="num">{money(q.total, cur)}</b></div>
        </div>
      ) : null}

      {err ? <div className="err">{err}</div> : null}
      <button className="b p blk" type="submit" disabled={busy || !items.length || !live}>{busy ? 'جاري إرسال الطلب...' : (buttonText || co.button_text || 'اطلب الآن')}</button>
      {co.trust_text ? <p className="mut center" style={{ fontSize: 13 }}>🔒 {co.trust_text}</p> : null}
      {co.terms_text ? <p className="mut center" style={{ fontSize: 12 }}>{co.terms_text}</p> : null}
    </form>
  );
}
