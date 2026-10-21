'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const DEF = {
  light: { bg: '#F4F6F9', card: '#FFFFFF', accent: '#00B050' },
  dark: { bg: '#0B132B', card: '#0E1E38', accent: '#00B050' },
  headline: '', subline: '',
};
const HEX = /^#[0-9a-fA-F]{6}$/;
const NAMES = { bg: 'الخلفية', card: 'لون البطاقة', accent: 'لون الأزرار والروابط' };

/* ألوان واجهة التسجيل/الدخول للوضع النهاري والداكن + عنوان مخصص */
export default function ThemeColors({ isDark }) {
  const [v, setV] = useState(DEF);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    supabase.from('platform_kv').select('value').eq('key', 'theme_colors').maybeSingle().then(({ data }) => {
      try { if (data?.value) { const j = JSON.parse(data.value); setV({ light: { ...DEF.light, ...(j.light || {}) }, dark: { ...DEF.dark, ...(j.dark || {}) }, headline: j.headline || '', subline: j.subline || '' }); } } catch { /* افتراضي */ }
    });
  }, []);
  const set = (mode, k, val) => setV((s) => ({ ...s, [mode]: { ...s[mode], [k]: val } }));
  const save = async (value) => {
    for (const m of ['light', 'dark']) for (const k of Object.keys(NAMES)) if (!HEX.test(value[m][k])) { setMsg('لون غير صحيح'); return; }
    const { error } = await supabase.from('platform_kv').upsert({ key: 'theme_colors', value: JSON.stringify(value), updated_at: new Date().toISOString() }, { onConflict: 'key' });
    setMsg(error ? 'خطأ: ' + error.message : 'تم الحفظ ✓');
    setTimeout(() => setMsg(''), 3000);
  };
  const reset = () => { setV(DEF); save(DEF); };
  const box = `p-4 rounded-2xl border mb-4 ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'}`;
  const inp = 'w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-xs outline-none focus:border-[#00B050]';
  return (
    <div className={box}>
      <h3 className="font-black text-sm mb-3">واجهة التسجيل والدخول: الألوان والعنوان</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[['light', 'الوضع النهاري'], ['dark', 'الوضع الداكن']].map(([m, label]) => (
          <div key={m} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="font-black text-xs">{label}</div>
            {Object.entries(NAMES).map(([k, n]) => (
              <label key={k} className="flex items-center gap-2 text-xs">
                <input type="color" value={HEX.test(v[m][k]) ? v[m][k] : '#000000'} onChange={(e) => set(m, k, e.target.value)} className="w-9 h-8 rounded cursor-pointer" />
                <span className="flex-1">{n}</span>
                <input className={`${inp} max-w-[110px] font-mono`} dir="ltr" value={v[m][k]} onChange={(e) => set(m, k, e.target.value)} />
              </label>
            ))}
            <div className="rounded-lg p-3 text-center text-xs font-bold" style={{ background: v[m].bg }}>
              <div className="rounded-lg p-3" style={{ background: v[m].card, color: m === 'dark' ? '#fff' : '#0f172a' }}>
                معاينة <span className="inline-block mt-1 px-3 py-1 rounded-lg text-white" style={{ background: v[m].accent }}>زر</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        <label className="text-xs">عنوان صفحة التسجيل (اختياري)<input className={inp} value={v.headline} onChange={(e) => setV({ ...v, headline: e.target.value })} placeholder="ابدأ متجرك في دقائق" /></label>
        <label className="text-xs">سطر توضيحي (اختياري)<input className={inp} value={v.subline} onChange={(e) => setV({ ...v, subline: e.target.value })} placeholder="سجّل مجاناً وجرّب المنصة" /></label>
      </div>
      <div className="flex items-center gap-3 mt-3">
        <button onClick={() => save(v)} className="px-4 py-2 bg-[#00B050] text-white rounded-lg text-xs font-bold cursor-pointer">حفظ</button>
        <button onClick={reset} className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold cursor-pointer">استرجاع الافتراضي</button>
        {msg ? <span className="text-xs font-bold text-[#00B050]">{msg}</span> : null}
      </div>
    </div>
  );
}
