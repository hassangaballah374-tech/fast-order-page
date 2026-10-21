'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const ST = { pending: 'قيد المراجعة', processing: 'جاري التنفيذ', done: 'تم التسجيل', rejected: 'مرفوض' };

/* أدمن: طلبات الدومين من كل التجار + تغيير الحالة + رد للتاجر (يوصله إشعار) */
export default function AdminDomains({ isDark }) {
  const [rows, setRows] = useState(null);
  const [names, setNames] = useState({});
  const [notes, setNotes] = useState({});
  const load = useCallback(async () => {
    const { data } = await supabase.from('domain_requests').select('*').order('created_at', { ascending: false }).limit(200);
    setRows(data || []);
    const { data: sp } = await supabase.from('store_profiles').select('user_id,store_name,store_slug');
    const m = {}; (sp || []).forEach((s) => { m[String(s.user_id)] = s.store_name || s.store_slug; });
    setNames(m);
  }, []);
  useEffect(() => { load(); }, [load]);

  const setStatus = async (r, status) => {
    const admin_note = (notes[r.id] ?? r.admin_note ?? '').trim() || null;
    const { error } = await supabase.from('domain_requests').update({ status, admin_note, decided_at: new Date().toISOString() }).eq('id', r.id);
    if (error) { alert('خطأ: ' + error.message); return; }
    await supabase.from('platform_notifications').insert([{ audience: r.store_id, kind: 'domain', title: `طلب الدومين ${r.domain}: ${ST[status]}`, body: admin_note || '' }]);
    load();
  };

  const box = `p-4 rounded-2xl border mb-4 ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'}`;
  return (
    <div className={box}>
      <h3 className="font-black text-sm mb-3">طلبات شراء الدومين</h3>
      {rows === null ? <p className="text-xs text-slate-500">جاري التحميل...</p> : rows.length === 0 ? <p className="text-xs text-slate-500">لا توجد طلبات.</p> : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <div><b dir="ltr">{r.domain}</b> · {r.years} سنة · {names[r.store_id] || r.store_id}</div>
                <span className="font-black">{ST[r.status] || r.status}</span>
              </div>
              {r.note ? <div className="text-slate-500">ملاحظة التاجر: {r.note}</div> : null}
              <input className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-xs" placeholder="رد للتاجر (السعر / طريقة الدفع...)" value={notes[r.id] ?? r.admin_note ?? ''} onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))} />
              <div className="flex flex-wrap gap-2">
                {['processing', 'done', 'rejected'].map((s) => (
                  <button key={s} onClick={() => setStatus(r, s)} className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg font-bold cursor-pointer">{ST[s]}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
