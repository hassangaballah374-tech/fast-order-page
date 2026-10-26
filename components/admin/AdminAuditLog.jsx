'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

const ACTIONS = {
  'store.create': ['إنشاء متجر', '🏬', 'ok'],
  'store.activate': ['تفعيل متجر', '✅', 'ok'],
  'store.deactivate': ['إيقاف متجر', '⛔', 'bad'],
  'wallet.update': ['تعديل رصيد محفظة', '👛', 'warn'],
  'store.plan': ['تغيير باقة متجر', '💎', 'info'],
  'broadcast.send': ['إرسال تنبيه جماعي', '📢', 'info'],
  'order.status': ['تغيير حالة طلب', '📦', 'info'],
  'product.create': ['إضافة منتج', '🏷️', 'ok'],
  'admin.create': ['إضافة مشرف', '🛡️', 'warn'],
  'admin.revoke': ['سحب صلاحيات مشرف', '🚫', 'bad'],
  'settings.update': ['تعديل إعدادات المنصة', '⚙️', 'warn'],
};
const TONE = {
  ok: 'bg-emerald-500/10 text-emerald-500',
  bad: 'bg-rose-500/10 text-rose-500',
  warn: 'bg-amber-500/10 text-amber-500',
  info: 'bg-sky-500/10 text-sky-500',
  neutral: 'bg-slate-500/10 text-slate-400',
};
const STATUS_AR = { pending: 'جديد', confirmed: 'مؤكد', shipped: 'في الشحن', delivered: 'تم التسليم', returned: 'مرتجع', cancelled: 'ملغي' };

const meta = (l) => (l && typeof l.meta === 'object' && l.meta ? l.meta : {});
function details(l) {
  const m = meta(l);
  switch (l.action) {
    case 'store.create': return `${m.name || ''} (${m.slug || ''})`;
    case 'store.activate': case 'store.deactivate': return m.store_name || m.store_id || '';
    case 'wallet.update': return `من ${m.from ?? '—'} إلى ${m.to ?? '—'} — ${m.store_name || m.store_id || ''}`;
    case 'store.plan': return `${m.plan || ''} — ${m.store_name || m.store_id || ''}`;
    case 'broadcast.send': return `رسالة ${m.length || 0} حرف`;
    case 'order.status': return `طلب ${m.order_id || ''} ← ${STATUS_AR[m.status] || m.status || ''}`;
    case 'product.create': return m.title || '';
    case 'admin.create': return m.email || '';
    case 'admin.revoke': return m.email || '';
    case 'settings.update': return `سعر الصرف ${m.exchangeRate ?? '—'} · العمولة ${m.platformCommission ?? '—'}% · حد السحب ${m.withdrawThreshold ?? '—'}`;
    default: { const s = JSON.stringify(m); return s === '{}' ? '' : s.slice(0, 140); }
  }
}
const fdt = (v) => { try { return new Date(v).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return v || ''; } };
const PER = 25;

export default function AdminAuditLog({ isDark }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [act, setAct] = useState('all');
  const [actor, setActor] = useState('all');
  const [days, setDays] = useState('30');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(1000);
    if (error) setErr(error.message); else setRows(data || []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const actors = useMemo(() => [...new Set(rows.map((r) => r.actor_email).filter(Boolean))], [rows]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const from = days === 'all' ? 0 : Date.now() - Number(days) * 86400000;
    return rows.filter((r) => {
      if (act !== 'all' && r.action !== act) return false;
      if (actor !== 'all' && r.actor_email !== actor) return false;
      if (from && new Date(r.created_at).getTime() < from) return false;
      if (!t) return true;
      const label = (ACTIONS[r.action]?.[0] || r.action || '');
      return `${label} ${r.action} ${r.actor_email || ''} ${details(r)}`.toLowerCase().includes(t);
    });
  }, [rows, q, act, actor, days]);

  useEffect(() => { setPage(1); }, [q, act, actor, days]);
  const pages = Math.max(1, Math.ceil(list.length / PER));
  const view = list.slice((page - 1) * PER, page * PER);

  const exportCsv = () => {
    const head = ['الوقت', 'الحركة', 'الكود', 'بواسطة', 'التفاصيل'];
    const body = list.map((r) => [r.created_at, ACTIONS[r.action]?.[0] || r.action, r.action, r.actor_email || '', details(r)]);
    const csv = '\ufeff' + [head, ...body].map((x) => x.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `spike-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  const card = `p-4 sm:p-6 rounded-2xl border ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'}`;
  const ctl = `px-3 py-2 rounded-lg border text-xs ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`;

  return (
    <div className={card}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-black">📑 سجل نشاط الإدارة</h3>
          <p className="text-xs text-slate-400">كل إجراء إداري على المنصة: مين عمله، وإيه هو، وإمتى. ({list.length} حركة)</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={load} className={`${ctl} font-black cursor-pointer`}>↻ تحديث</button>
          <button type="button" onClick={exportCsv} className="px-3 py-2 rounded-lg bg-[#00B050] text-white text-xs font-black cursor-pointer">⬇ تصدير CSV</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث في الحركات..." className={`${ctl} flex-1 min-w-[160px]`} />
        <select value={act} onChange={(e) => setAct(e.target.value)} className={ctl}>
          <option value="all">كل أنواع الحركات</option>
          {Object.entries(ACTIONS).map(([k, v]) => <option key={k} value={k}>{v[0]}</option>)}
        </select>
        <select value={actor} onChange={(e) => setActor(e.target.value)} className={ctl}>
          <option value="all">كل المشرفين</option>
          {actors.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={days} onChange={(e) => setDays(e.target.value)} className={ctl}>
          <option value="1">آخر 24 ساعة</option>
          <option value="7">آخر 7 أيام</option>
          <option value="30">آخر 30 يوم</option>
          <option value="90">آخر 90 يوم</option>
          <option value="all">الكل</option>
        </select>
      </div>

      {err ? <div className="mb-3 p-3 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-bold">⚠️ {err}</div> : null}
      {loading ? <p className="text-xs text-slate-400">جاري التحميل...</p> : view.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs">لا توجد حركات مطابقة</div>
      ) : (
        <div className="space-y-2">
          {view.map((l) => {
            const a = ACTIONS[l.action] || [l.action, '•', 'neutral'];
            return (
              <div key={l.id ?? `${l.created_at}${l.action}`} className={`p-3 border rounded-xl flex flex-wrap items-center gap-x-3 gap-y-1 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black whitespace-nowrap ${TONE[a[2]] || TONE.neutral}`}>{a[1]} {a[0]}</span>
                <span className="text-xs font-bold flex-1 min-w-[140px]">{details(l) || <span className="text-slate-400 font-normal">—</span>}</span>
                <span className="text-[11px] text-slate-400" dir="ltr">{l.actor_email || ''}</span>
                <span className="text-[11px] text-slate-400 whitespace-nowrap">{fdt(l.created_at)}</span>
              </div>
            );
          })}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4 text-xs font-black">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className={`${ctl} cursor-pointer disabled:opacity-40`}>السابق</button>
          <span className="text-slate-400">{page} / {pages}</span>
          <button type="button" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className={`${ctl} cursor-pointer disabled:opacity-40`}>التالي</button>
        </div>
      )}
    </div>
  );
}
