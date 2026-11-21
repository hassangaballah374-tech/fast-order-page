'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../dash/hooks';

const SRC = {
  order: 'تسجيل الطلبات', 'bosta-webhook': 'ويب هوك بوسطة', 'bosta-ship': 'شحن بوسطة التلقائي', 'wa-cloud': 'واتساب (تأكيد الطلب)',
  'cron-recover': 'استرجاع السلات (واتساب)', 'order-webhook': 'ويب هوك الطلبات', tryon: 'التلبيس بالذكاء الاصطناعي',
};
const LV = { error: ['خطأ', 'bg-rose-500/10 text-rose-500'], warn: ['تحذير', 'bg-amber-500/10 text-amber-500'], info: ['معلومة', 'bg-sky-500/10 text-sky-500'] };
const ago = (d) => { const s = Math.max(1, Math.round((Date.now() - new Date(d).getTime()) / 1000)); if (s < 60) return `من ${s} ث`; if (s < 3600) return `من ${Math.round(s / 60)} د`; if (s < 86400) return `من ${Math.round(s / 3600)} س`; return `من ${Math.round(s / 86400)} يوم`; };

export default function AdminHealth({ isDark }) {
  const [d, setD] = useState(null);
  const [level, setLevel] = useState('');
  const [source, setSource] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const load = useCallback(async () => {
    setBusy(true); setMsg('');
    const r = await api('/api/platform/events', { action: 'list', level, source });
    setBusy(false);
    if (!r || !r.ok) { setMsg(r?.error || 'تعذر التحميل'); setD(null); return; }
    setD(r);
  }, [level, source]);
  useEffect(() => { load(); }, [load]);
  const clear = async () => { if (!window.confirm('مسح كل الأحداث؟')) return; await api('/api/platform/events', { action: 'clear' }); load(); };

  const card = `rounded-2xl border p-4 ${isDark ? 'bg-[#0A2A3E] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`;
  const sum = d?.summary || {};
  const totalErr = Object.values(sum).reduce((a, x) => a + (x.error || 0), 0);
  const totalWarn = Object.values(sum).reduce((a, x) => a + (x.warn || 0), 0);

  return (
    <div className="space-y-4">
      <div className={card}>
        <div className="flex flex-wrap items-center gap-3">
          <b className="text-lg">🩺 صحة المنصة</b>
          <span className={'px-3 py-1 rounded-full text-xs font-bold ' + (totalErr ? 'bg-rose-500/10 text-rose-500' : totalWarn ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500')}>
            {totalErr ? `${totalErr} خطأ في آخر 24 ساعة` : totalWarn ? `${totalWarn} تحذير في آخر 24 ساعة` : 'مفيش مشاكل في آخر 24 ساعة'}
          </span>
          <span className="flex-1" />
          <button type="button" onClick={load} disabled={busy} className="px-3 py-1.5 rounded-lg border border-slate-400/30 text-sm">{busy ? '...' : 'تحديث'}</button>
          <button type="button" onClick={clear} className="px-3 py-1.5 rounded-lg border border-rose-500/40 text-rose-500 text-sm">مسح السجل</button>
        </div>
        {msg ? <p className="mt-3 text-sm text-amber-500">{msg}</p> : null}
        {Object.keys(sum).length ? (
          <div className="grid gap-2 mt-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(sum).map(([k, v]) => (
              <button key={k} type="button" onClick={() => setSource(source === k ? '' : k)} className={'text-start rounded-xl border p-3 ' + (source === k ? 'border-sky-500' : 'border-slate-400/20')}>
                <b className="block text-sm">{SRC[k] || k}</b>
                <span className="text-xs opacity-80">{v.error ? `${v.error} خطأ ` : ''}{v.warn ? `${v.warn} تحذير ` : ''}{v.info ? `${v.info} معلومة` : ''}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className={card}>
        <div className="flex gap-2 mb-3 flex-wrap">
          {[['', 'الكل'], ['error', 'أخطاء'], ['warn', 'تحذيرات']].map(([k, l]) => <button key={k} type="button" onClick={() => setLevel(k)} className={'px-3 py-1 rounded-full text-xs font-bold border ' + (level === k ? 'bg-sky-500 text-white border-sky-500' : 'border-slate-400/30')}>{l}</button>)}
          {source ? <button type="button" onClick={() => setSource('')} className="px-3 py-1 rounded-full text-xs border border-slate-400/30">المصدر: {SRC[source] || source} ✕</button> : null}
        </div>
        {!d ? null : !d.rows.length ? <p className="text-sm opacity-70 py-6 text-center">مفيش أحداث.</p> : (
          <div className="divide-y divide-slate-400/10">
            {d.rows.map((r) => (
              <div key={r.id} className="py-3 text-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={'px-2 py-0.5 rounded-full text-xs font-bold ' + (LV[r.level]?.[1] || '')}>{LV[r.level]?.[0] || r.level}</span>
                  <b>{SRC[r.source] || r.source}</b>
                  <span className="opacity-60 text-xs">{ago(r.at)}</span>
                  {r.store_id ? <span className="opacity-60 text-xs num" dir="ltr">متجر: {String(r.store_id).slice(0, 8)}…</span> : null}
                </div>
                <p className="mt-1">{r.message}</p>
                {r.meta && Object.keys(r.meta).length ? <p className="mt-1 text-xs opacity-60" dir="ltr">{Object.entries(r.meta).map(([k, v]) => `${k}: ${v}`).join(' · ')}</p> : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
