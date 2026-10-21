'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

/* نص تعليمات الدفع الذي يظهر للتاجر في شاشة الاشتراك وشحن الرصيد */
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
    <div className={`p-4 rounded-2xl border mb-4 ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'}`}>
      <h3 className="font-black text-sm mb-1">تعليمات الدفع (تظهر للتاجر عند الاشتراك أو شحن الرصيد)</h3>
      <textarea rows={3} value={v} onChange={(e) => setV(e.target.value)} placeholder="مثال: حوّل المبلغ إلى فودافون كاش 010XXXXXXXX ثم ارفع صورة التحويل" className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-xs outline-none focus:border-[#00B050]" />
      <div className="flex items-center gap-3 mt-2">
        <button onClick={save} className="px-4 py-2 bg-[#00B050] text-white rounded-lg text-xs font-bold cursor-pointer">حفظ</button>
        {msg ? <span className="text-xs font-bold text-[#00B050]">{msg}</span> : null}
      </div>
    </div>
  );
}
