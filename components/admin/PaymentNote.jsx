'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

/* نص تعليمات الدفع الذي يظهر للتاجر في شاشة الاشتراك وشحن الرصيد */
export const PAY_METHODS = { vodafone: 'فودافون كاش', instapay: 'إنستا باي' };

/* أرقام التحويل اللي بتظهر للتاجر مع كل رقم والطريقة بتاعته */
function PaymentNumbers({ isDark }) {
  const [rows, setRows] = useState([]);
  const [wa, setWa] = useState('');
  const [msg, setMsg] = useState('');
  useEffect(() => {
    supabase.from('platform_kv').select('value').eq('key', 'payment_whatsapp').maybeSingle().then(({ data }) => setWa(data?.value || ''));
    supabase.from('platform_kv').select('value').eq('key', 'payment_numbers').maybeSingle().then(({ data }) => {
      try { const j = JSON.parse(data?.value || '[]'); setRows(Array.isArray(j) ? j : []); } catch { setRows([]); }
    });
  }, []);
  const set = (i, k, v) => setRows((r) => r.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const save = async () => {
    const clean = rows.map((r) => ({ method: r.method === 'instapay' ? 'instapay' : 'vodafone', number: String(r.number || '').trim().slice(0, 60), name: String(r.name || '').trim().slice(0, 60) })).filter((r) => r.number);
    const w = await supabase.from('platform_kv').upsert({ key: 'payment_whatsapp', value: String(wa || '').replace(/[^\d+]/g, '').slice(0, 20), updated_at: new Date().toISOString() }, { onConflict: 'key' });
    const { error: e2 } = await supabase.from('platform_kv').upsert({ key: 'payment_numbers', value: JSON.stringify(clean), updated_at: new Date().toISOString() }, { onConflict: 'key' });
    const error = e2 || w.error;
    if (!error) setRows(clean);
    setMsg(error ? 'خطأ: ' + error.message : 'تم الحفظ ✓ وظهرت عند التجار');
    setTimeout(() => setMsg(''), 3500);
  };
  const inp = 'p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-xs outline-none focus:border-[#014D6F]';
  return (
    <div className={`p-4 rounded-2xl border mb-4 ${isDark ? 'bg-[#0A2A3E] border-slate-800' : 'bg-white border-slate-200'}`}>
      <h3 className="font-black text-sm mb-1">أرقام التحويل (فودافون كاش / إنستا باي)</h3>
      <p className="text-xs opacity-70 mb-3">الأرقام دي بتظهر للتاجر في «الباقات والشحن» و«رصيدك» فوراً بعد الحفظ، مع اسم طريقة التحويل.</p>
      <label className="block mb-3 text-xs font-bold">رقم واتساب الإدارة (التاجر يبعتلك عليه صورة التحويل)
        <input dir="ltr" value={wa} onChange={(e) => setWa(e.target.value)} placeholder="01XXXXXXXXX" className={inp + ' block w-full mt-1 font-normal'} />
      </label>
      {rows.map((r, i) => (
        <div key={i} className="flex flex-wrap gap-2 mb-2 items-center">
          <select value={r.method === 'instapay' ? 'instapay' : 'vodafone'} onChange={(e) => set(i, 'method', e.target.value)} className={inp}>
            {Object.entries(PAY_METHODS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <input dir="ltr" value={r.number || ''} onChange={(e) => set(i, 'number', e.target.value)} placeholder="رقم الهاتف أو عنوان إنستا باي" className={inp + ' flex-1 min-w-[160px]'} />
          <input value={r.name || ''} onChange={(e) => set(i, 'name', e.target.value)} placeholder="اسم صاحب الرقم (اختياري)" className={inp + ' w-44'} />
          <button onClick={() => setRows((x) => x.filter((_, j) => j !== i))} className="px-2 py-1 text-xs font-bold text-red-600 cursor-pointer" aria-label="حذف">✕</button>
        </div>
      ))}
      <div className="flex items-center gap-3 mt-2">
        <button onClick={() => setRows((x) => [...x, { method: 'vodafone', number: '', name: '' }])} className="px-3 py-2 border border-[#014D6F] text-[#014D6F] rounded-lg text-xs font-bold cursor-pointer">+ إضافة رقم</button>
        <button onClick={save} className="px-4 py-2 bg-[#014D6F] text-white rounded-lg text-xs font-bold cursor-pointer">حفظ الأرقام</button>
        {msg ? <span className="text-xs font-bold text-[#014D6F]">{msg}</span> : null}
      </div>
    </div>
  );
}

export default function PaymentNote({ isDark }) {
  const [v, setV] = useState('');
  const [msg, setMsg] = useState('');
  useEffect(() => { supabase.from('platform_kv').select('value').eq('key', 'payment_instructions').maybeSingle().then(({ data }) => setV(data?.value || '')); }, []);
  const save = async () => {
    const { error } = await supabase.from('platform_kv').upsert({ key: 'payment_instructions', value: v, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    setMsg(error ? 'خطأ: ' + error.message : 'تم الحفظ ✓');
    setTimeout(() => setMsg(''), 3000);
  };
  return (
    <>
    <PaymentNumbers isDark={isDark} />
    <div className={`p-4 rounded-2xl border mb-4 ${isDark ? 'bg-[#0A2A3E] border-slate-800' : 'bg-white border-slate-200'}`}>
      <h3 className="font-black text-sm mb-1">تعليمات الدفع (تظهر للتاجر عند الاشتراك أو شحن الرصيد)</h3>
      <textarea rows={3} value={v} onChange={(e) => setV(e.target.value)} placeholder="مثال: حوّل المبلغ إلى فودافون كاش 010XXXXXXXX ثم ارفع صورة التحويل" className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-xs outline-none focus:border-[#014D6F]" />
      <div className="flex items-center gap-3 mt-2">
        <button onClick={save} className="px-4 py-2 bg-[#014D6F] text-white rounded-lg text-xs font-bold cursor-pointer">حفظ</button>
        {msg ? <span className="text-xs font-bold text-[#014D6F]">{msg}</span> : null}
      </div>
    </div>
    </>
  );
}
