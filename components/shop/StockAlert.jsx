'use client';
import { useT } from '../I18n';
import React, { useState } from 'react';

/* «نبّهني لما يرجع»: يظهر على المنتج النافد. بيتحفظ في Supabase ويظهر للتاجر في «المخزون ← طلبات التنبيه». */
export default function StockAlert({ slug, pid }) {
  const tx = useT();
  const [phone, setPhone] = useState('');
  const [st, setSt] = useState('idle'); // idle | busy | done
  const [err, setErr] = useState('');
  const key = `spk_sa_${slug}_${pid}`;
  const [was] = useState(() => { try { return !!localStorage.getItem(key); } catch { return false; } });
  const send = async (e) => {
    e.preventDefault(); setErr(''); setSt('busy');
    try {
      const r = await fetch('/api/store/stockalert', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ slug, product_id: pid, phone, hp: '' }) });
      const j = await r.json().catch(() => ({}));
      if (j.ok) { setSt('done'); try { localStorage.setItem(key, '1'); } catch { /* تجاهل */ } } else { setErr(j.error || tx('تعذر الإرسال')); setSt('idle'); }
    } catch { setErr(tx('مشكلة في الاتصال')); setSt('idle'); }
  };
  if (st === 'done' || was) return <div className="sa ok" role="status">{tx('✓ سجلنا رقمك، هنبلّغك أول ما المنتج يرجع.')}</div>;
  return (
    <form className="sa" onSubmit={send}>
      <b>{tx('نبّهني لما يرجع')}</b>
      <div className="sa-r">
        <input className="in num" dir="ltr" inputMode="tel" autoComplete="tel" placeholder="01xxxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} aria-label={tx('رقم الموبايل')} required />
        <button className="b p" type="submit" disabled={st === 'busy'}>{st === 'busy' ? '...' : tx('نبّهني')}</button>
      </div>
      {err ? <small className="err">{err}</small> : null}
    </form>
  );
}
