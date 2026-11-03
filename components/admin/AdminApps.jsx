'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

const CATS = { tracking: 'التتبع', marketing: 'التسويق', sales: 'المبيعات', shipping: 'الشحن', other: 'أخرى' };

/* حالة التطبيق عند التاجر:
   open   = شغّال: التاجر يثبّته ويستخدمه
   soon   = قريباً: يظهر للتاجر وبيقدر يطلب تفعيله، وإنت بتوافق
   locked = مقفول: مخفي عن التجار بالكامل */
const stateOf = (a) => (!a.enabled ? 'locked' : a.coming_soon ? 'soon' : 'open');
const STATE_PATCH = { open: { enabled: true, coming_soon: false }, soon: { enabled: true, coming_soon: true }, locked: { enabled: false, coming_soon: false } };
const SECTIONS = [
  { id: 'open', icon: '✅', title: 'شغّالة', hint: 'ظاهرة للتجار ويقدروا يثبّتوها', cls: 'text-emerald-600' },
  { id: 'soon', icon: '🔜', title: 'قريباً', hint: 'ظاهرة للتجار بزر «اطلب تفعيله». إنت اللي بتوافق', cls: 'text-amber-600' },
  { id: 'locked', icon: '🔒', title: 'مقفولة', hint: 'مخفية عن التجار تماماً', cls: 'text-slate-500' },
];

/* أدمن: التطبيقات والمميزات (أيها شغّال وأيها هيتفتح وأيها مقفول) + طلبات التجار لتفعيل التطبيقات القادمة */
export default function AdminApps({ isDark }) {
  const [apps, setApps] = useState(null);
  const [reqs, setReqs] = useState([]);
  const [installs, setInstalls] = useState({});
  const [names, setNames] = useState({});
  const [msg, setMsg] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [f, setF] = useState({ key: '', name: '', icon: '🧩', category: 'marketing', description: '', screen: '', state: 'soon' });

  const load = useCallback(async () => {
    const [a, r, i, s] = await Promise.all([
      supabase.from('platform_apps').select('*').order('sort_order'),
      supabase.from('store_apps').select('*').eq('status', 'requested').order('created_at', { ascending: false }),
      supabase.from('store_apps').select('app_key').eq('status', 'installed').limit(20000),
      supabase.from('store_profiles').select('user_id,store_name,store_slug'),
    ]);
    setApps(a.data || []); setReqs(r.data || []);
    const c = {}; (i.data || []).forEach((x) => { c[x.app_key] = (c[x.app_key] || 0) + 1; });
    setInstalls(c);
    const m = {}; (s.data || []).forEach((x) => { m[String(x.user_id)] = x.store_name || x.store_slug; });
    setNames(m);
  }, []);
  useEffect(() => { load(); }, [load]);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3500); };
  const add = async () => {
    const key = f.key.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!key || f.name.trim().length < 2) { flash('اكتب مفتاحاً إنجليزياً واسماً'); return; }
    const { error } = await supabase.from('platform_apps').insert([{ key, name: f.name.trim(), icon: f.icon || '🧩', category: f.category, description: f.description.trim() || null, screen: f.screen.trim() || null, ...STATE_PATCH[f.state] }]);
    if (error) { flash(error.code === '23505' ? 'المفتاح موجود بالفعل' : 'خطأ: ' + error.message); return; }
    setF({ key: '', name: '', icon: '🧩', category: 'marketing', description: '', screen: '', state: 'soon' });
    setShowAdd(false); load(); flash('تمت الإضافة ✓');
  };
  const setState = async (a, st) => {
    const { error } = await supabase.from('platform_apps').update(STATE_PATCH[st]).eq('id', a.id);
    if (error) flash('خطأ: ' + error.message); else { load(); flash('تم التحديث ✓'); }
  };
  const del = async (a) => {
    if (!window.confirm(`حذف «${a.name}»؟`)) return;
    const { error } = await supabase.from('platform_apps').delete().eq('id', a.id);
    if (error) flash('خطأ: ' + error.message); else load();
  };
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

  const groups = useMemo(() => {
    const g = { open: [], soon: [], locked: [] };
    (apps || []).forEach((a) => g[stateOf(a)].push(a));
    return g;
  }, [apps]);

  const box = `p-4 rounded-2xl border mb-4 ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'}`;
  const inp = 'w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-xs outline-none focus:border-[#00B050]';
  const btn = 'px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-[11px] font-bold cursor-pointer hover:bg-slate-500/10';
  return (
    <div>
      <div className={box}>
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="font-black text-sm">🧩 التطبيقات والمميزات</h3>
          {msg ? <span className="text-xs font-bold text-[#00B050]">{msg}</span> : null}
          <span className="flex-1" />
          <button className={btn} onClick={() => setShowAdd(!showAdd)}>{showAdd ? 'إلغاء' : '+ إضافة تطبيق'}</button>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
          {SECTIONS.map((s) => (
            <div key={s.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className={`text-2xl font-black ${s.cls}`}>{groups[s.id].length}</div>
              <div className="font-bold">{s.icon} {s.title}</div>
            </div>
          ))}
        </div>

        {showAdd && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 mt-3">
            <label>المفتاح (إنجليزي)<input className={`${inp} font-mono`} dir="ltr" value={f.key} onChange={(e) => setF({ ...f, key: e.target.value })} placeholder="my-app" /></label>
            <label>الاسم<input className={inp} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
            <label>أيقونة<input className={inp} value={f.icon} onChange={(e) => setF({ ...f, icon: e.target.value })} /></label>
            <label>القسم<select className={inp} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label>الحالة<select className={inp} value={f.state} onChange={(e) => setF({ ...f, state: e.target.value })}>{SECTIONS.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.title}</option>)}</select></label>
            <button className="py-2 bg-[#00B050] text-white rounded-lg font-bold cursor-pointer" onClick={add}>+ إضافة</button>
            <label className="col-span-2 md:col-span-3">الوصف<input className={inp} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
            <label className="col-span-2 md:col-span-3">شاشة الإعدادات (اختياري)<input className={`${inp} font-mono`} dir="ltr" value={f.screen} onChange={(e) => setF({ ...f, screen: e.target.value })} placeholder="pixels" /></label>
          </div>
        )}
      </div>

      {reqs.length > 0 && (
        <div className={box}>
          <div className="text-sm font-black mb-2">📥 طلبات تفعيل من التجار ({reqs.length})</div>
          <div className="space-y-2">
            {reqs.map((r) => (
              <div key={r.id} className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs">
                <b>{names[r.store_id] || r.store_id}</b><span>·</span><span>{(apps || []).find((a) => a.key === r.app_key)?.name || r.app_key}</span>
                <span className="flex-1" />
                <button className={`${btn} text-emerald-600`} onClick={() => decide(r, true)}>تفعيل</button>
                <button className={`${btn} text-rose-500`} onClick={() => decide(r, false)}>رفض</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {apps === null ? <div className={box}><p className="text-xs text-slate-400">جاري التحميل...</p></div> : SECTIONS.map((s) => (
        <div key={s.id} className={box}>
          <div className="flex flex-wrap items-baseline gap-2 mb-2">
            <h4 className={`font-black text-sm ${s.cls}`}>{s.icon} {s.title} ({groups[s.id].length})</h4>
            <span className="text-[11px] text-slate-400">{s.hint}</span>
          </div>
          {groups[s.id].length === 0 ? <p className="text-xs text-slate-400">لا يوجد.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">{['', 'التطبيق', 'القسم', 'مثبّت عند', 'تغيير الحالة', ''].map((h, i) => <th key={i} className="p-2 text-right whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody>
                  {groups[s.id].map((a) => (
                    <tr key={a.id} className="border-b border-slate-100 dark:border-slate-800/60">
                      <td className="p-2 text-lg">{a.icon}</td>
                      <td className="p-2"><b>{a.name}</b><div className="text-[10px] text-slate-400 font-mono" dir="ltr">{a.key}{a.screen ? ` → ${a.screen}` : ''}</div></td>
                      <td className="p-2">{CATS[a.category] || a.category}</td>
                      <td className="p-2 font-bold">{installs[a.key] || 0} متجر</td>
                      <td className="p-2"><div className="flex gap-1 flex-wrap">
                        {SECTIONS.filter((x) => x.id !== s.id).map((x) => <button key={x.id} className={btn} onClick={() => setState(a, x.id)}>{x.icon} {x.id === 'open' ? 'افتح' : x.id === 'soon' ? 'قريباً' : 'اقفل'}</button>)}
                      </div></td>
                      <td className="p-2"><button className={`${btn} text-rose-500`} onClick={() => del(a)}>حذف</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
