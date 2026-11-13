'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../dash/hooks';

/* أدمن: الدومينات اللي التجار ربطوها بمتاجرهم + حالتها الحية على Vercel */
export default function AdminLinkedDomains({ isDark, onLoaded }) {
  const [rows, setRows] = useState(null);
  const [info, setInfo] = useState({ live: false, missingTable: false });
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async (live) => {
    setBusy(live ? 'check' : '');
    const r = await api('/api/platform/domains', { action: 'list', live: !!live });
    setBusy('');
    if (!r.ok) { setMsg(r.error || 'تعذر التحميل'); setRows([]); return; }
    setRows(r.rows || []);
    setInfo({ live: !!r.live, missingTable: !!r.missingTable });
    if (onLoaded) onLoaded(r.rows || []);
  }, [onLoaded]);
  useEffect(() => { load(false); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (action, domain) => {
    if (action === 'remove' && !window.confirm(`فصل الدومين ${domain} عن المتجر؟`)) return;
    setBusy(domain);
    const r = await api('/api/platform/domains', { action, domain });
    setBusy('');
    setMsg(r.ok ? (action === 'remove' ? 'تم فصل الدومين' : 'تم طلب إعادة التحقق') : (r.error || 'حصل خطأ'));
    load(true);
  };

  const box = `p-4 rounded-2xl border mb-4 ${isDark ? 'bg-[#0A2A3E] border-slate-800' : 'bg-white border-slate-200'}`;
  const badge = (r) => {
    if (r.connected) return ['شغّال', 'text-emerald-500'];
    if (r.missingOnVercel) return ['غير مضاف على Vercel', 'text-red-500'];
    if (r.verified === false || r.status === 'pending') return ['بانتظار DNS', 'text-amber-500'];
    if (r.status === 'manual') return ['يدوي (Vercel غير مفعّل)', 'text-amber-500'];
    return [r.status, 'text-slate-500'];
  };
  return (
    <div className={box}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="font-black text-sm">الدومينات المربوطة بالمتاجر</h3>
        <button onClick={() => load(true)} disabled={!!busy} className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold cursor-pointer">{busy === 'check' ? 'جاري الفحص...' : 'فحص الحالة على Vercel'}</button>
      </div>
      {!info.live && rows && <p className="text-[11px] text-amber-600 mb-2">الربط التلقائي مع Vercel غير مفعّل (ناقص VERCEL_API_TOKEN أو VERCEL_PROJECT_ID)، فالدومينات بتتسجّل عندنا بس وإنت اللي بتضيفها يدوي في Vercel.</p>}
      {info.missingTable && <p className="text-[11px] text-red-600 mb-2">جدول store_domains غير موجود. شغّل ملف sql/store_domains.sql في Supabase.</p>}
      {msg && <p className="text-[11px] text-slate-500 mb-2">{msg}</p>}
      {rows === null ? <p className="text-xs text-slate-500">جاري التحميل...</p> : rows.length === 0 ? <p className="text-xs text-slate-500">لا توجد دومينات مربوطة.</p> : (
        <div className="space-y-2">
          {rows.map((r) => {
            const [label, cls] = badge(r);
            return (
              <div key={r.domain} className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2">
                <div>
                  <b dir="ltr" className="font-mono">{r.domain}</b>
                  <div className="text-slate-500">المتجر: {r.store_name}{r.created_at ? ` · ${new Date(r.created_at).toLocaleDateString('ar-EG')}` : ''}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-black ${cls}`}>{label}</span>
                  <button onClick={() => act('verify', r.domain)} disabled={!!busy} className="px-2 py-1 border border-slate-300 dark:border-slate-700 rounded-lg font-bold cursor-pointer">تحقق</button>
                  <button onClick={() => act('remove', r.domain)} disabled={!!busy} className="px-2 py-1 border border-red-300 text-red-500 rounded-lg font-bold cursor-pointer">فصل</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
