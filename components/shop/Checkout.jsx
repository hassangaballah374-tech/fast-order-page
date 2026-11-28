'use client';
import { useT } from '../I18n';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useShop, getUtm, hit } from './StoreContext';
import { track } from './tracker';
import WaContact from './WaContact';
import { fireInitiateCheckout } from './icGuard';
import { loadEgAreas, OTHER_VILLAGE } from '../../lib/egAreas';
import { GOVERNORATES, money, normalizePhone, isValidEgPhone } from '../../lib/storeKit';

const ss = (k, v) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* تجاهل */ } };

/* نموذج الطلب المشترك (صفحة المنتج، السلة، الفانيل).
   items: [{product_id,title,image,price,qty,options}]، bump: {product_id}|null */
/* وسم اختبار A/B (لو الزائر جاي من رابط اختبار) */
function abTag() {
  try { const v = new URLSearchParams(window.location.search).get('ab'); return /^[0-9a-f-]{36}\.[a-d]$/.test(v || '') ? v : ''; } catch { return ''; }
}

export default function Checkout({ items, bump, buttonText, onSuccess, funnel, title = 'بيانات الشحن', next, flow }) {
  const tx = useT();
  const { slug, cfg, cur, zones, base, live } = useShop();
  const router = useRouter();
  const co = cfg.checkout || {};
  const [f, setF] = useState({ name: '', phone: '', phone2: '', email: '', governorate: '', center: '', village: '', villageOther: '', address: '', address2: '', notes: '' });
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
  const useAreas = co.areas !== false;
  const [areas, setAreas] = useState(null);
  useEffect(() => { if (useAreas && f.governorate && !areas) { let ok = true; loadEgAreas().then((a) => { if (ok) setAreas(a); }); return () => { ok = false; }; } return undefined; }, [useAreas, f.governorate, areas]);
  const centers = useMemo(() => (areas && areas[f.governorate]) || [], [areas, f.governorate]);
  const villages = useMemo(() => { const c = centers.find((x) => x[0] === f.center); return c ? c[1] : []; }, [centers, f.center]);
  const setGov = (e) => setF((s) => ({ ...s, governorate: e.target.value, center: '', village: '', villageOther: '' }));
  const setCenter = (e) => setF((s) => ({ ...s, center: e.target.value, village: '', villageOther: '' }));

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
    fireInitiateCheckout(slug, q?.total || 0, items.map((i) => ({ id: i.product_id, title: i.title, price: i.price, qty: i.qty })));
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
    if (!live) { setErr(tx('المتجر غير مفعّل حالياً، الطلبات متوقفة مؤقتاً')); return; }
    if (!items.length) { setErr(tx('السلة فارغة')); return; }
    if (f.name.trim().length < 2) { setErr(tx('اكتب اسمك بالكامل')); return; }
    if (!isValidEgPhone(normalizePhone(f.phone))) { setErr(tx('رقم الموبايل غير صحيح (مثال: 01012345678)')); return; }
    if (!f.governorate) { setErr(tx('اختر المحافظة')); return; }
    if (useAreas && centers.length) {
      if (!f.center) { setErr(tx('اختر المركز / القسم')); return; }
      if (villages.length && !f.village) { setErr(tx('اختر القرية / العزبة (أو «أخرى» لو مش موجودة)')); return; }
      if (villages.length && f.village === OTHER_VILLAGE && f.villageOther.trim().length < 2) { setErr(tx('اكتب اسم قريتك / عزبتك')); return; }
    }
    if (f.address.trim().length < 6) { setErr(tx('اكتب العنوان بالتفصيل')); return; }
    setBusy(true);
    try {
      const r = await fetch('/api/store/order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug, customer: f, items: items.map((i) => ({ product_id: i.product_id, qty: i.qty, options: i.options })),
          bump: bump || undefined, coupon: appliedCode || undefined, utm: { ...getUtm(slug), ...(funnel ? { funnel } : {}), ...(flow ? { flow: flow.slug } : {}), ...(abTag() ? { ab: abTag() } : {}) }, flow: flow || undefined, hp, t: Math.round((Date.now() - t0.current) / 1000),
        }),
      });
      const j = await r.json();
      if (!j.ok) { setErr(j.error || tx('تعذر إرسال الطلب، حاول مرة أخرى')); setBusy(false); return; }
      ss(`spike_last_${slug}`, { held: !!j.held, hold_until: j.hold_until || null, order_no: j.order_no, token: j.token, total: j.total, event_id: j.event_id, name: f.name, phone: f.phone, items: items.map((i) => ({ id: i.product_id, title: i.title, price: i.price, qty: i.qty })) });
      if (onSuccess) onSuccess(j);
      router.push(next || `${base}/thank-you`);
    } catch { setErr(tx('تعذر الاتصال، حاول مرة أخرى')); setBusy(false); }
  };

  const remain = q && q.free_over > 0 && q.remaining_free != null ? q.remaining_free : null;
  const pct = q && q.free_over > 0 ? Math.min(100, Math.round(((q.subtotal - q.discount) / q.free_over) * 100)) : 0;

  return (
    <form className="frm" onSubmit={submit} onFocus={onFocus} id="checkout">
      <h3>{tx(title)}</h3>
      {co.show_images !== false && items.length > 0 && (
        <div>{items.map((i) => (
          <div className="ci" key={i.key || i.product_id} style={{ marginBottom: 6 }}>
            {i.image ? <img src={i.image} alt="" /> : null}
            <div className="ci-b"><b>{i.title}</b><span className="mut">{Object.values(i.options || {}).join(' / ')} × <span className="num">{i.qty}</span></span></div>
          </div>
        ))}</div>
      )}
      <div className="fld"><label>{tx('الاسم بالكامل')}</label><input className="in" autoComplete="name" value={f.name} onChange={set('name')} /></div>
      <div className="r2">
        <div className="fld"><label>{tx('رقم الموبايل')}</label><input className="in num" dir="ltr" inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" value={f.phone} onChange={set('phone')} onBlur={saveAbandoned} /></div>
        {co.phone2 ? <div className="fld"><label>{tx('موبايل آخر (اختياري)')}</label><input className="in num" dir="ltr" inputMode="tel" value={f.phone2} onChange={set('phone2')} /></div> : null}
      </div>
      {co.email ? <div className="fld"><label>{tx('البريد الإلكتروني (اختياري)')}</label><input className="in" dir="ltr" type="email" value={f.email} onChange={set('email')} /></div> : null}
      <div className="fld"><label>{tx('المحافظة')}</label>
        <select className="in" value={f.governorate} onChange={setGov}>
          <option value="">{tx('اختر المحافظة')}</option>
        {govs.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        {(() => {
          const z = (zones || []).find((x) => x.governorate === f.governorate);
          return z && z.eta ? <p className="mut" style={{ fontSize: 13, marginTop: 6 }}>{tx('🚚 مدة التوصيل المتوقعة:')} <b>{z.eta}</b></p> : null;
        })()}
      </div>
      {useAreas && f.governorate && centers.length ? (
        <>
          <div className="fld"><label>{tx('المركز / القسم')}</label>
            <select className="in" value={f.center} onChange={setCenter}>
              <option value="">{tx('اختر المركز / القسم')}</option>
              {centers.map((c) => <option key={c[0]} value={c[0]}>{c[0]}</option>)}
            </select>
          </div>
          {f.center && villages.length ? (
            <div className="fld"><label>{tx('القرية / العزبة / الحي')}</label>
              <select className="in" value={f.village} onChange={(e) => setF((s) => ({ ...s, village: e.target.value, villageOther: '' }))}>
                <option value="">{tx('اختر القرية / العزبة')}</option>
                {villages.map((v, i) => <option key={v + i} value={v}>{v}</option>)}
                <option value={OTHER_VILLAGE}>{tx('أخرى (مش لاقي قريتي / عزبتي)')}</option>
              </select>
              {f.village === OTHER_VILLAGE ? <input className="in" style={{ marginTop: 8 }} placeholder={tx('اكتب اسم القرية / العزبة')} value={f.villageOther} onChange={set('villageOther')} /> : null}
            </div>
          ) : null}
        </>
      ) : null}
      <div className="fld"><label>{tx('العنوان بالتفصيل')}</label><input className="in" autoComplete="street-address" placeholder={useAreas && f.governorate ? tx('الشارع، رقم المبنى/المنزل، أقرب علامة مميزة') : ''} value={f.address} onChange={set('address')} /></div>
      {co.address2 ? <div className="fld"><label>{tx('علامة مميزة / عنوان إضافي')}</label><input className="in" value={f.address2} onChange={set('address2')} /></div> : null}
      {co.note !== false ? <div className="fld"><label>{tx('ملاحظات (اختياري)')}</label><input className="in" value={f.notes} onChange={set('notes')} /></div> : null}
      <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={(e) => setHp(e.target.value)} />

      <div className="fld">
        <label>{tx('كود الخصم')}</label>
        <div className="cpn">
          <input className="in" dir="ltr" value={coupon} onChange={(e) => setCoupon(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } }} />
          <button type="button" className="b" onClick={applyCoupon}>{tx('تطبيق')}</button>
        </div>
        {qMsg ? <div className={q?.coupon ? 'okm' : 'err'} style={{ marginTop: 6 }}>{qMsg}</div> : null}
      </div>

      {cfg.shipping?.show_progress !== false && q && q.free_over > 0 ? (
        <div>
          <div className="prog"><i style={{ width: `${pct}%` }} /></div>
          <p className="mut" style={{ fontSize: 13, marginTop: 4 }}>{remain > 0 ? tx('أضف {1} للحصول على شحن مجاني 🚚', [money(remain, cur)]) : tx('مبروك! الشحن مجاني 🎉')}</p>
        </div>
      ) : null}

      {q ? (
        <div className="sum">
          <div><span>{tx('المنتجات')}</span><b className="num">{money(q.subtotal, cur)}</b></div>
          {q.discount > 0 ? <div><span>{tx('الخصم')}</span><b className="num">- {money(q.discount, cur)}</b></div> : null}
          <div><span>{tx('الشحن')}</span><b className="num">{q.shipping > 0 ? money(q.shipping, cur) : (f.governorate ? tx('مجاني') : tx('يُحدد بالمحافظة'))}</b></div>
          {q.cod_fee > 0 ? <div><span>{tx('رسوم الدفع عند الاستلام')}</span><b className="num">{money(q.cod_fee, cur)}</b></div> : null}
          <div className="tot"><span>{tx('الإجمالي')}</span><b className="num">{money(q.total, cur)}</b></div>
        </div>
      ) : null}

      {err ? <div className="err">{err}</div> : null}
      {err ? <WaContact label={tx('تواصل معنا على واتساب')} text={tx('مرحباً، حصلت لي مشكلة وأنا بعمل طلب: {1}', [err])} style={{ marginBottom: 10 }} /> : null}
      <button className="b p blk" type="submit" disabled={busy || !items.length || !live}>{busy ? tx('جاري إرسال الطلب...') : tx(buttonText || co.button_text || 'اطلب الآن')}</button>
      <WaContact label={tx('عندك سؤال؟ كلّم صاحب المتجر على واتساب')} text={tx('مرحباً، عندي سؤال قبل ما أكمل طلبي{1}', [items.length ? ` (${items.slice(0, 3).map((i) => i.title).join(tx('، '))})` : ''])} style={{ marginTop: 6 }} />
      {co.trust_text ? <p className="mut center" style={{ fontSize: 13 }}>🔒 {tx(co.trust_text)}</p> : null}
      {co.terms_text ? <p className="mut center" style={{ fontSize: 12 }}>{co.terms_text}</p> : null}
    </form>
  );
}
