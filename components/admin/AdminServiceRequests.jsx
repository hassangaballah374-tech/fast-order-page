'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

const ST = { new: ['جديد', 'bg-amber-500/15 text-amber-600'], contacted: ['تم التواصل', 'bg-sky-500/15 text-sky-600'], done: ['مكتمل', 'bg-emerald-500/15 text-emerald-600'], cancelled: ['ملغي', 'bg-slate-500/15 text-slate-500'] };

const waUrl = (phone, text) => {
  let d = String(phone || '').replace(/\D/g, '');
  if (d.startsWith('0')) d = `20${d.slice(1)}`;
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
};
const fdt = (d) => { try { return new Date(d).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return ''; } };

/* أدمن: طلبات التجار على «معرض الخدمات» و«خدمات التسويق» — متابعة وتغيير الحالة وإشعار التاجر */
export default function AdminServiceRequests({ isDark }) {
  const [rows, setRows] = useState(null);
  const [names, setNames] = useState({});
  const [filter, setFilter] = useState('new');
  const [notes, setNotes] = useState({});
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    const [r, s] = await Promise.all([
      supabase.from('store_service_requests').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('store_profiles').select('user_id,store_name,store_slug'),
    ]);
    if (r.error) { setErr(r.error.message); setRows([]); return; }
    setErr('');
    setRows(r.data || []);
    const m = {}; (s.data || []).forEach((x) => { m[String(x.user_id)] = x.store_name || x.store_slug; });
    setNames(m);
  }, []);
  useEffect(() => { load(); }, [load]);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3500); };
  const counts = useMemo(() => {
    const c = { all: (rows || []).length };
    Object.keys(ST).forEach((k) => { c[k] = (rows || []).filter((x) => (x.status || 'new') === k).length; });
    return c;
  }, [rows]);
  const list = (rows || []).filter((x) => filter === 'all' || (x.status || 'new') === filter);

  const setStatus = async (r, status) => {
    const note = (notes[r.id] ?? r.admin_note ?? '').trim();
    const { error } = await supabase.from('store_service_requests').update({ status, admin_note: note || null, updated_at: new Date().toISOString() }).eq('id', r.id);
    if (error) { flash('خطأ: ' + error.message); return; }
    if (status !== (r.status || 'new')) {
      await supabase.from('platform_notifications').insert([{
        audience: r.store_id, kind: 'service', title: `طلب «${r.title}»: ${ST[status][0]}`, body: note || '',
      }]);
    }
    flash('تم الحفظ ✓ وتم إشعار التاجر');
    load();
  };

  const box = `p-4 rounded-2xl border mb-4 ${isDark ? 'bg-[#0A2A3E] border-slate-800' : 'bg-white border-slate-200'}`;
  const btn = 'px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-[11px] font-bold cursor-pointer hover:bg-slate-500/10';
  return (
    <div className={box}>
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <h3 className="font-black text-sm">🧰 طلبات الخدمات من التجار</h3>
        {msg ? <span className="text-xs font-bold text-[#014D6F]">{msg}</span> : null}
        <span className="flex-1" />
        <button className={btn} onClick={load}>🔄 تحديث</button>
      </div>
      {err ? <div className="text-xs text-rose-500 mb-3">⚠️ {err} — شغّل ملف sql/service_requests.sql في Supabase ثم حدّث الصفحة.</div> : null}
      <div className="flex flex-wrap gap-2 mb-3">
        {[['new', 'جديد'], ['contacted', 'تم التواصل'], ['done', 'مكتمل'], ['cancelled', 'ملغي'], ['all', 'الكل']].map(([k, l]) => (
          <button key={k} className={`${btn} ${filter === k ? 'bg-[#014D6F] text-white border-[#014D6F]' : ''}`} onClick={() => setFilter(k)}>{l} ({counts[k] || 0})</button>
        ))}
      </div>
      {rows === null ? <p className="text-xs text-slate-400">جاري التحميل...</p> : list.length === 0 ? <p className="text-xs text-slate-400">لا توجد طلبات في هذا القسم.</p> : (
        <div className="space-y-3">
          {list.map((r) => {
            const [sl, sc] = ST[r.status || 'new'] || [r.status, 'bg-slate-500/15 text-slate-500'];
            const store = names[r.store_id] || r.store_id;
            return (
              <div key={r.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <b className="text-sm">{r.title}</b>
                  <span className={`px-2 py-0.5 rounded-full font-bold ${sc}`}>{sl}</span>
                  <span className="text-slate-400">·</span><span>🏬 {store}</span>
                  <span className="flex-1" />
                  <span className="text-slate-400">{fdt(r.created_at)}</span>
                </div>
                <p className="whitespace-pre-wrap mb-2">{r.details}</p>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span dir="ltr" className="font-mono">{r.contact}</span>
                  {r.contact ? <a className={`${btn} text-emerald-600`} target="_blank" rel="noreferrer" href={waUrl(r.contact, `أهلاً، بخصوص طلبك «${r.title}» على سبايك…`)}>💬 واتساب</a> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input className="flex-1 min-w-[180px] p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent outline-none focus:border-[#014D6F]" placeholder="ملاحظة تظهر للتاجر (السعر المتفق عليه، موعد التسليم…)" value={notes[r.id] ?? r.admin_note ?? ''} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} />
                  {['contacted', 'done', 'cancelled'].filter((k) => k !== (r.status || 'new')).map((k) => (
                    <button key={k} className={`${btn} ${k === 'done' ? 'text-emerald-600' : k === 'cancelled' ? 'text-rose-500' : ''}`} onClick={() => setStatus(r, k)}>{ST[k][0]}</button>
                  ))}
                  {(r.status || 'new') !== 'new' ? <button className={btn} onClick={() => setStatus(r, 'new')}>إرجاع لجديد</button> : null}
                  <button className={btn} onClick={() => setStatus(r, r.status || 'new')}>حفظ الملاحظة</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
