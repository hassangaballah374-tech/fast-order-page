'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const CATS = { tracking: 'التتبع', marketing: 'التسويق', sales: 'المبيعات', shipping: 'الشحن', other: 'أخرى' };

/* أدمن: كتالوج التكاملات والإضافات + طلبات التجار لتفعيل التطبيقات القادمة */
export default function AdminApps({ isDark }) {
  const [apps, setApps] = useState(null);
  const [reqs, setReqs] = useState([]);
  const [names, setNames] = useState({});
  const [msg, setMsg] = useState('');
  const [f, setF] = useState({ key: '', name: '', icon: '🧩', category: 'marketing', description: '', screen: '', coming_soon: false });

  const load = useCallback(async () => {
    const [a, r, s] = await Promise.all([
      supabase.from('platform_apps').select('*').order('sort_order'),
      supabase.from('store_apps').select('*').eq('status', 'requested').order('created_at', { ascending: false }),
      supabase.from('store_profiles').select('user_id,store_name,store_slug'),
    ]);
    setApps(a.data || []); setReqs(r.data || []);
    const m = {}; (s.data || []).forEach((x) => { m[String(x.user_id)] = x.store_name || x.store_slug; });
    setNames(m);
  }, []);
  useEffect(() => { load(); }, [load]);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3500); };
  const add = async () => {
    const key = f.key.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!key || f.name.trim().length < 2) { flash('اكتب مفتاحاً إنجليزياً واسماً'); return; }
    const { error } = await supabase.from('platform_apps').insert([{ key, name: f.name.trim(), icon: f.icon || '🧩', category: f.category, description: f.description.trim() || null, screen: f.screen.trim() || null, coming_soon: f.coming_soon, sort_order: (apps?.length || 0) + 1 }]);
    if (error) { flash(error.code === '23505' ? 'المفتاح موجود بالفعل' : 'خطأ: ' + error.message); return; }
    setF({ key: '', name: '', icon: '🧩', category: 'marketing', description: '', screen: '', coming_soon: false });
    load(); flash('تمت الإضافة ✓');
  };
  const patch = async (a, p) => { const { error } = await supabase.from('platform_apps').update(p).eq('id', a.id); if (error) flash('خطأ: ' + error.message); else load(); };
  const del = async (a) => { if (!confirm(`حذف «${a.name}»؟`)) return; const { error } = await supabase.from('platform_apps').delete().eq('id', a.id); if (error) flash('خطأ: ' + error.message); else load(); };

  const decide = async (r, ok) => {
    const app = (apps || []).find((x) => x.key === r.app_key);
    if (ok) {
      const { error } = await supabase.from('store_apps').update({ status: 'installed' }).eq('id', r.id);
      if (error) { flash('خطأ: ' + error.message); return; }
    } else {
      const { error } = await supabase.from('store_apps').delete().eq('id', r.id);
      if (error) { flash('خطأ: ' + error.message); return; }
    }
    await supabase.from('platform_notifications').insert([{ audience: r.store_id, kind: 'app', title: ok ? `تم تفعيل ${app?.name || r.app_key} ✅` : `تعذر تفعيل ${app?.name || r.app_key}`, body: '' }]);
    load(); flash(ok ? 'تم التفعيل' : 'تم الرفض');
  };

  const box = `p-4 rounded-2xl border mb-4 ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'}`;
  const inp = 'w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-xs outline-none focus:border-[#00B050]';
  const btn = 'px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-[11px] font-bold cursor-pointer hover:bg-slate-500/10';
  return (
    <div className={box}>
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <h3 className="font-black text-sm">🧩 التكاملات والإضافات (تظهر للتجار)</h3>
        {msg ? <span className="text-xs font-bold text-[#00B050]">{msg}</span> : null}
      </div>

      {reqs.length > 0 && (
        <div className="mb-4 space-y-2">
          <div className="text-xs font-black">طلبات التفعيل ({reqs.length})</div>
          {reqs.map((r) => (
            <div key={r.id} className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs">
              <b>{names[r.store_id] || r.store_id}</b><span>·</span><span>{(apps || []).find((a) => a.key === r.app_key)?.name || r.app_key}</span>
              <span className="flex-1" />
              <button className={`${btn} text-emerald-600`} onClick={() => decide(r, true)}>تفعيل</button>
              <button className={`${btn} text-rose-500`} onClick={() => decide(r, false)}>رفض</button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 mb-4">
        <label>المفتاح (إنجليزي)<input className={`${inp} font-mono`} dir="ltr" value={f.key} onChange={(e) => setF({ ...f, key: e.target.value })} placeholder="my-app" /></label>
        <label>الاسم<input className={inp} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label>أيقونة<input className={inp} value={f.icon} onChange={(e) => setF({ ...f, icon: e.target.value })} /></label>
        <label>القسم<select className={inp} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label>شاشة الإعدادات (اختياري)<input className={`${inp} font-mono`} dir="ltr" value={f.screen} onChange={(e) => setF({ ...f, screen: e.target.value })} placeholder="pixels" /></label>
        <button className="py-2 bg-[#00B050] text-white rounded-lg font-bold cursor-pointer" onClick={add}>+ إضافة</button>
        <label className="col-span-2 md:col-span-5">الوصف<input className={inp} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
        <label className="flex gap-1 items-center"><input type="checkbox" checked={f.coming_soon} onChange={(e) => setF({ ...f, coming_soon: e.target.checked })} />قريباً</label>
      </div>

      {apps === null ? <p className="text-xs text-slate-400">جاري التحميل...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">{['', 'التطبيق', 'القسم', 'الشاشة', 'الحالة', ''].map((h, i) => <th key={i} className="p-2 text-right whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 dark:border-slate-800/60">
                  <td className="p-2 text-lg">{a.icon}</td>
                  <td className="p-2"><b>{a.name}</b><div className="text-[10px] text-slate-400 font-mono" dir="ltr">{a.key}</div></td>
                  <td className="p-2">{CATS[a.category] || a.category}</td>
                  <td className="p-2 font-mono" dir="ltr">{a.screen || '—'}</td>
                  <td className="p-2">
                    <span className={`px-2 py-0.5 rounded-full font-bold ${a.enabled ? 'bg-emerald-500/15 text-emerald-600' : 'bg-slate-500/15 text-slate-500'}`}>{a.enabled ? 'ظاهر' : 'مخفي'}</span>
                    {a.coming_soon ? <span className="ms-1 px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-600">قريباً</span> : null}
                  </td>
                  <td className="p-2"><div className="flex gap-1 flex-wrap">
                    <button className={btn} onClick={() => patch(a, { enabled: !a.enabled })}>{a.enabled ? 'إخفاء' : 'إظهار'}</button>
                    <button className={btn} onClick={() => patch(a, { coming_soon: !a.coming_soon })}>{a.coming_soon ? 'إتاحته الآن' : 'قريباً'}</button>
                    <button className={`${btn} text-rose-500`} onClick={() => del(a)}>حذف</button>
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
