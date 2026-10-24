'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

const num = (v) => Number(v) || 0;
const ST = { pending: 'جديد', confirmed: 'مؤكد', shipped: 'مشحون', delivered: 'مسلّم', cancelled: 'ملغي', returned: 'مرتجع' };
const ROLE = { merchant: 'التاجر', admin: 'الأدمن', system: 'النظام' };
const fdt = (v) => { try { return new Date(v).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }); } catch { return v || ''; } };

export default function AdminAlerts({ isDark }) {
  const [days, setDays] = useState(30);
  const [rows, setRows] = useState([]);
  const [log, setLog] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [th, setTh] = useState({ badRate: 40, stale: 5, reversals: 2, minOrders: 5 });

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    const [a, b] = await Promise.all([
      supabase.rpc('admin_merchant_alerts', { p_days: days }),
      supabase.from('order_status_log').select('*').order('created_at', { ascending: false }).limit(60),
    ]);
    if (a.error) setErr(a.error.message); else setRows(a.data || []);
    if (!b.error) setLog(b.data || []);
    setLoading(false);
  }, [days]);
  useEffect(() => { load(); }, [load]);

  const names = useMemo(() => Object.fromEntries(rows.map((s) => [s.store_id, s.store_name || s.store_slug])), [rows]);

  const flagged = useMemo(() => rows.map((s) => {
    const done = num(s.delivered) + num(s.returned) + num(s.cancelled);
    const bad = done > 0 ? ((num(s.returned) + num(s.cancelled)) / done) * 100 : 0;
    const reasons = [];
    if (num(s.orders) >= th.minOrders && bad >= th.badRate) reasons.push(`نسبة إلغاء + مرتجع ${bad.toFixed(0)}%`);
    if (num(s.stale_pending) >= th.stale) reasons.push(`${num(s.stale_pending)} طلب معلّق أكثر من 48 ساعة`);
    if (num(s.reversals) >= th.reversals) reasons.push(`${num(s.reversals)} طلب مسلّم تحوّل لملغي/مرتجع`);
    return { ...s, bad, reasons };
  }).filter((s) => s.reasons.length).sort((x, y) => y.reasons.length - x.reasons.length || y.bad - x.bad), [rows, th]);

  const card = `p-4 sm:p-6 rounded-2xl border ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'}`;
  const inp = `w-16 px-2 py-1 rounded-lg border text-xs text-center ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`;

  return (
    <div className="space-y-4 mt-4">
      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black">🚨 تنبيهات التجار المشبوهين</h3>
            <p className="text-xs text-slate-400">التاجر ميقدرش يحذف الطلبات ولا يمسح سجل تغيير الحالة. هنا بتشوف اللي سلوكه غير طبيعي.</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[7, 30, 90].map((d) => (
              <button key={d} type="button" onClick={() => setDays(d)} className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer border ${days === d ? 'bg-[#00B050] text-white border-[#00B050]' : isDark ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-600'}`}>آخر {d} يوم</button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-400">
          <label className="flex items-center gap-1">إلغاء+مرتجع ≥ <input className={inp} type="number" value={th.badRate} onChange={(e) => setTh({ ...th, badRate: num(e.target.value) })} />%</label>
          <label className="flex items-center gap-1">معلّق &gt;48س ≥ <input className={inp} type="number" value={th.stale} onChange={(e) => setTh({ ...th, stale: num(e.target.value) })} /></label>
          <label className="flex items-center gap-1">مسلّم→ملغي ≥ <input className={inp} type="number" value={th.reversals} onChange={(e) => setTh({ ...th, reversals: num(e.target.value) })} /></label>
          <label className="flex items-center gap-1">أقل عدد طلبات للحكم <input className={inp} type="number" value={th.minOrders} onChange={(e) => setTh({ ...th, minOrders: num(e.target.value) })} /></label>
        </div>
        {err ? <div className="mt-3 p-3 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-bold">⚠️ {err} — شغّل ملف spike_stage6b.sql في Supabase.</div> : null}
      </div>

      <div className={card}>
        <h4 className="font-black text-sm mb-3">تجار محتاجين مراجعة ({flagged.length})</h4>
        {loading ? <p className="text-xs text-slate-400">جاري التحميل...</p> : flagged.length === 0 ? <p className="text-sm text-emerald-500 font-bold">✅ مفيش تاجر تخطّى الحدود دي في الفترة.</p> : (
          <div className="space-y-2">
            {flagged.map((s) => (
              <div key={s.store_id} className={`p-3 rounded-xl border ${isDark ? 'border-rose-500/30 bg-rose-500/5' : 'border-rose-200 bg-rose-50'}`}>
                <div className="flex flex-wrap justify-between gap-2">
                  <b>{s.store_name || '—'} <span className="text-[10px] text-slate-400 font-mono" dir="ltr">{s.store_slug}</span></b>
                  <span className="text-xs text-slate-500">{num(s.orders)} طلب · {num(s.delivered)} مسلّم · {num(s.returned)} مرتجع · {num(s.cancelled)} ملغي · {num(s.archived)} مؤرشف · {num(s.merchant_changes)} تغيير حالة</span>
                </div>
                <ul className="mt-1 text-xs text-rose-600 list-disc pr-5">{s.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={card}>
        <h4 className="font-black text-sm mb-3">آخر تغييرات حالة الطلبات</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">{['الوقت', 'المتجر', 'طلب', 'من', 'إلى', 'بواسطة'].map((h) => <th key={h} className="p-2 text-right whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {log.map((l) => {
                const sus = l.from_status === 'delivered' && ['cancelled', 'returned'].includes(l.to_status);
                return (
                  <tr key={l.id} className="border-b border-slate-100 dark:border-slate-800/50" style={sus ? { background: 'rgba(244,63,94,.08)' } : undefined}>
                    <td className="p-2 whitespace-nowrap">{fdt(l.created_at)}</td>
                    <td className="p-2">{names[l.store_id] || String(l.store_id).slice(0, 8)}</td>
                    <td className="p-2 font-mono">#{l.order_no ?? l.order_id}</td>
                    <td className="p-2">{l.from_status ? (ST[l.from_status] || l.from_status) : '—'}</td>
                    <td className="p-2 font-bold">{ST[l.to_status] || l.to_status}</td>
                    <td className="p-2">{ROLE[l.by_role] || l.by_role}</td>
                  </tr>
                );
              })}
              {log.length === 0 ? <tr><td colSpan={6} className="p-5 text-center text-slate-400">السجل فاضي لحد دلوقتي — بيبدأ من وقت تشغيل الـ SQL.</td></tr> : null}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-slate-400 mt-2">الصف الأحمر = طلب كان مسلّم واتحوّل لملغي أو مرتجع (أخطر نمط للتهرّب من العمولة).</p>
      </div>
    </div>
  );
}
