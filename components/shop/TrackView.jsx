'use client';
import React, { useEffect, useState } from 'react';
import { useShop } from './StoreContext';
import { STATUS, trackUrl, normalizePhone } from '../../lib/storeKit';

const FLOW = [['pending', 'تم استلام الطلب'], ['confirmed', 'تم تأكيد الطلب'], ['shipped', 'خرج للشحن'], ['delivered', 'تم التسليم']];

export default function TrackView() {
  const { slug, cur } = useShop();
  const [f, setF] = useState({ order_no: '', phone: '' });
  const [res, setRes] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const query = async (body) => {
    setBusy(true); setErr(''); setRes(null);
    try {
      const r = await fetch('/api/store/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, ...body }) });
      const j = await r.json();
      if (j.ok) setRes(j.order); else setErr(j.error || 'لم نجد الطلب');
    } catch { setErr('تعذر الاتصال، حاول مرة أخرى'); }
    setBusy(false);
  };

  useEffect(() => {
    try {
      const t = new URLSearchParams(window.location.search).get('token');
      if (t) query({ token: t });
    } catch { /* تجاهل */ }
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (!f.order_no.trim() || !normalizePhone(f.phone)) { setErr('اكتب رقم الطلب ورقم الموبايل'); return; }
    query({ order_no: f.order_no, phone: f.phone });
  };

  const st = res ? (STATUS[res.status] || STATUS.pending) : null;
  const idx = res ? FLOW.findIndex(([k]) => k === res.status) : -1;
  const link = res ? trackUrl(res.courier, res.tracking_number) : '';

  return (
    <section className="wrap sec" style={{ maxWidth: 640 }}>
      <div className="sh"><h2>تتبع طلبك</h2><p>اكتب رقم الطلب ورقم الموبايل الذي طلبت به</p></div>
      <form className="frm" onSubmit={submit}>
        <div className="r2">
          <div className="fld"><label>رقم الطلب</label><input className="in num" dir="ltr" inputMode="numeric" value={f.order_no} onChange={(e) => setF({ ...f, order_no: e.target.value })} /></div>
          <div className="fld"><label>رقم الموبايل</label><input className="in num" dir="ltr" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
        </div>
        <button className="b p blk" type="submit" disabled={busy}>{busy ? 'جاري البحث...' : 'تتبع'}</button>
        {err ? <div className="err">{err}</div> : null}
      </form>

      {res && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>طلب رقم #{res.order_no} <span style={{ color: st.color, fontSize: 14 }}>({st.ar})</span></h3>
          <p className="mut">أهلاً {res.first_name} · {res.governorate}</p>
          {idx >= 0 ? (
            <div className="tl">
              {FLOW.map(([k, l], i) => <div key={k} className={i <= idx ? 'done' : ''}><i>{i <= idx ? '✓' : ''}</i>{l}</div>)}
            </div>
          ) : <p className="err" style={{ margin: '12px 0' }}>حالة الطلب: {st.ar}</p>}
          {res.tracking_number ? (
            <p>رقم الشحنة: <b className="num" dir="ltr">{res.tracking_number}</b>{link ? <> · <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--c)', fontWeight: 800 }}>تتبع عند شركة الشحن</a></> : null}</p>
          ) : null}
          <hr style={{ border: 0, borderTop: '1px solid var(--ln)', margin: '14px 0' }} />
          {(res.items || []).map((i, k) => (
            <p key={k}>{i.title} × <span className="num">{i.qty}</span>{i.options && Object.keys(i.options).length ? <span className="mut"> ({Object.values(i.options).join(' / ')})</span> : null}</p>
          ))}
          <p style={{ marginTop: 10 }}>الإجمالي: <b className="num">{Math.round(res.total)} {cur}</b> · الدفع عند الاستلام</p>
        </div>
      )}
    </section>
  );
}
