'use client';
import React, { useState } from 'react';
import { useDash } from './ui';
import { supabase } from '../../lib/supabase';

/* حذف أرقام الإحصائيات من تاريخ لتاريخ (عدّادات الزيارات والسلة وبدء الشراء فقط، الطلبات الحقيقية لا تُمس) */
export default function PurgeStats({ uid, table, match, label, onDone }) {
  const { say } = useDash();
  const [open, setOpen] = useState(false);
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [busy, setBusy] = useState(false);
  const ok = /^\d{4}-\d{2}-\d{2}$/.test(a) && /^\d{4}-\d{2}-\d{2}$/.test(b) && a <= b;

  const run = async () => {
    if (!ok || busy || !uid) return;
    if (!window.confirm(`هتحذف ${label} من ${a} إلى ${b}. الحذف نهائي. متأكد؟`)) return;
    setBusy(true);
    let q = supabase.from(table).delete().eq('store_id', uid).gte('day', a).lte('day', b);
    if (match) for (const [k, v] of Object.entries(match)) q = q.eq(k, v);
    const { data, error } = await q.select('day');
    setBusy(false);
    if (error) { say(`تعذر الحذف: ${error.message}`); return; }
    say(`تم حذف ${data?.length || 0} يوم من البيانات`);
    setOpen(false);
    if (onDone) onDone();
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <button type="button" className="btn sm dng" onClick={() => setOpen(!open)}>🗑️ حذف بيانات من تاريخ لتاريخ</button>
      {open && (
        <div className="card" style={{ marginTop: 10 }}>
          <p className="mut" style={{ marginBottom: 10 }}>هيتحذف: {label}. الطلبات الحقيقية مش بتتأثر.</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="date" className="in" style={{ width: 'auto' }} value={a} max={b || undefined} onChange={(e) => setA(e.target.value)} aria-label="من" />
            <span className="mut">إلى</span>
            <input type="date" className="in" style={{ width: 'auto' }} value={b} min={a || undefined} onChange={(e) => setB(e.target.value)} aria-label="إلى" />
            <button type="button" className="btn sm dng" disabled={!ok || busy} onClick={run}>{busy ? 'جاري الحذف...' : 'احذف نهائياً'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
