'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const AUD = { new: 'مشتركون جدد لأول مرة', existing: 'تجار شغّالون قبل كده', all: 'الكل' };

/* أدمن: الأكواد الترحيبية (كود + عدد طلبات مجانية + لمن) + عدد الطلبات المجانية الافتراضي للتاجر الجديد */
export default function AdminPromos({ isDark }) {
  const [rows, setRows] = useState(null);
  const [def, setDef] = useState('25');
  const [msg, setMsg] = useState('');
  const [f, setF] = useState({ code: '', free_orders: 25, audience: 'new', max_uses: '', ends_at: '', note: '' });

  const load = useCallback(async () => {
    const [a, b] = await Promise.all([
      supabase.from('promo_codes').select('*').order('created_at', { ascending: false }),
      supabase.from('platform_kv').select('value').eq('key', 'default_free_orders').maybeSingle(),
    ]);
    setRows(a.data || []);
    if (b.data?.value != null) setDef(b.data.value);
  }, []);
  useEffect(() => { load(); }, [load]);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3500); };
  const saveDef = async () => {
    const v = Math.max(0, Math.floor(Number(def) || 0));
    const { error } = await supabase.from('platform_kv').upsert({ key: 'default_free_orders', value: String(v), updated_at: new Date().toISOString() }, { onConflict: 'key' });
    flash(error ? 'خطأ: ' + error.message : 'تم حفظ الطلبات المجانية الافتراضية ✓');
  };
  const add = async () => {
    const code = f.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (code.length < 3) { flash('الكود 3 أحرف/أرقام إنجليزية على الأقل'); return; }
    const row = {
      code, free_orders: Math.max(1, Math.floor(Number(f.free_orders) || 0)), audience: f.audience,
      max_uses: f.max_uses === '' ? null : Math.max(1, Math.floor(Number(f.max_uses) || 1)),
      ends_at: f.ends_at ? new Date(f.ends_at + 'T23:59:59').toISOString() : null, note: f.note.trim() || null,
    };
    const { error } = await supabase.from('promo_codes').insert([row]);
    if (error) { flash(error.code === '23505' ? 'الكود موجود بالفعل' : 'خطأ: ' + error.message); return; }
    setF({ code: '', free_orders: 25, audience: 'new', max_uses: '', ends_at: '', note: '' });
    load(); flash('تمت إضافة الكود ✓');
  };
  const patch = async (r, p) => { const { error } = await supabase.from('promo_codes').update(p).eq('id', r.id); if (error) flash('خطأ: ' + error.message); else load(); };
  const edit = (r) => {
    const v = prompt('عدد الطلبات المجانية لهذا الكود:', r.free_orders);
    if (v === null) return;
    patch(r, { free_orders: Math.max(1, Math.floor(Number(v) || 1)) });
  };
  const del = async (r) => { if (!confirm(`حذف الكود ${r.code}؟`)) return; const { error } = await supabase.from('promo_codes').delete().eq('id', r.id); if (error) flash('خطأ: ' + error.message); else load(); };

  const box = `p-4 rounded-2xl border mb-4 ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'}`;
  const inp = 'w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-xs outline-none focus:border-[#00B050]';
  const btn = 'px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-[11px] font-bold cursor-pointer hover:bg-slate-500/10';
  return (
    <div className={box}>
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <h3 className="font-black text-sm">🎁 الطلبات المجانية والأكواد الترحيبية</h3>
        {msg ? <span className="text-xs font-bold text-[#00B050]">{msg}</span> : null}
      </div>

      <div className="flex flex-wrap items-end gap-2 mb-4 text-xs">
        <label>الطلبات المجانية لكل تاجر جديد تلقائياً<input className={`${inp} w-40`} type="number" min="0" value={def} onChange={(e) => setDef(e.target.value)} /></label>
        <button className="px-4 py-2 bg-[#00B050] text-white rounded-lg font-bold cursor-pointer" onClick={saveDef}>حفظ</button>
        <span className="text-slate-400">يسري على المتاجر التي تُنشأ بعد الحفظ.</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 mb-4">
        <label>الكود<input className={`${inp} font-mono`} dir="ltr" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder="WELCOME50" /></label>
        <label>طلبات مجانية<input className={inp} type="number" min="1" value={f.free_orders} onChange={(e) => setF({ ...f, free_orders: e.target.value })} /></label>
        <label>مين يستخدمه
          <select className={inp} value={f.audience} onChange={(e) => setF({ ...f, audience: e.target.value })}>
            {Object.entries(AUD).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>أقصى استخدامات<input className={inp} type="number" min="1" value={f.max_uses} onChange={(e) => setF({ ...f, max_uses: e.target.value })} placeholder="بلا حد" /></label>
        <label>ينتهي في<input className={inp} type="date" value={f.ends_at} onChange={(e) => setF({ ...f, ends_at: e.target.value })} /></label>
        <button className="py-2 bg-[#00B050] text-white rounded-lg font-bold cursor-pointer" onClick={add}>+ إضافة كود</button>
        <label className="col-span-2 md:col-span-6">ملاحظة داخلية (اختياري)<input className={inp} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></label>
      </div>

      {rows === null ? <p className="text-xs text-slate-400">جاري التحميل...</p> : rows.length === 0 ? <p className="text-xs text-slate-400">لا توجد أكواد بعد.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">{['الكود', 'الطلبات المجانية', 'لمن', 'الاستخدامات', 'ينتهي', 'الحالة', ''].map((h) => <th key={h} className="p-2 text-right whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800/60">
                  <td className="p-2 font-mono font-bold" dir="ltr">{r.code}{r.note ? <div className="text-[10px] text-slate-400 font-sans" dir="rtl">{r.note}</div> : null}</td>
                  <td className="p-2 font-mono">{r.free_orders}</td>
                  <td className="p-2">{AUD[r.audience] || r.audience}</td>
                  <td className="p-2 font-mono">{r.uses}{r.max_uses != null ? ` / ${r.max_uses}` : ' / ∞'}</td>
                  <td className="p-2 whitespace-nowrap">{r.ends_at ? new Date(r.ends_at).toLocaleDateString() : '—'}</td>
                  <td className="p-2"><span className={`px-2 py-0.5 rounded-full font-bold ${r.enabled ? 'bg-emerald-500/15 text-emerald-600' : 'bg-slate-500/15 text-slate-500'}`}>{r.enabled ? 'فعّال' : 'موقوف'}</span></td>
                  <td className="p-2"><div className="flex gap-1 flex-wrap">
                    <button className={btn} onClick={() => patch(r, { enabled: !r.enabled })}>{r.enabled ? 'إيقاف' : 'تفعيل'}</button>
                    <button className={btn} onClick={() => edit(r)}>تعديل العدد</button>
                    <button className={`${btn} text-rose-500`} onClick={() => del(r)}>حذف</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
