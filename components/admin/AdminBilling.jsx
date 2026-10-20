'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

const n = (v) => Number(v) || 0;
const money = (v) => Math.round(n(v) * 100) / 100;

export function storeState(s) {
  if (s.is_active !== true) return 'inactive';
  if (s.orders_quota != null && n(s.orders_used) >= n(s.orders_quota)) return 'quota';
  if (s.subscription_ends_at && new Date(s.subscription_ends_at).getTime() < Date.now()) return 'expired';
  return 'ok';
}
const STATE = {
  ok: ['يعمل', 'bg-emerald-500/15 text-emerald-600'],
  inactive: ['غير مفعّل', 'bg-slate-500/15 text-slate-500'],
  quota: ['انتهت الطلبات', 'bg-rose-500/15 text-rose-500'],
  expired: ['انتهى الاشتراك', 'bg-amber-500/15 text-amber-600'],
};
const remainingOf = (s) => (s.orders_quota == null ? null : Math.max(0, n(s.orders_quota) - n(s.orders_used)));
const owedOf = (s) => (n(s.price_per_order) > 0 ? Math.max(0, money(n(s.orders_used) * n(s.price_per_order) - n(s.amount_paid))) : 0);

function Card({ title, value, sub, tone }) {
  return (
    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="text-[11px] text-slate-400 font-bold">{title}</div>
      <div className={`text-2xl font-black mt-1 ${tone || ''}`}>{value}</div>
      {sub ? <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div> : null}
    </div>
  );
}

export default function AdminBilling({ isDark, initial = 'stores', onChanged }) {
  const [tab, setTab] = useState(initial);
  const [stores, setStores] = useState([]);
  const [plans, setPlans] = useState([]);
  const [reqs, setReqs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [draft, setDraft] = useState({});

  const load = useCallback(async () => {
    const [a, b, c] = await Promise.all([
      supabase.from('store_profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('platform_plans').select('*').order('sort_order'),
      supabase.from('plan_requests').select('*').order('created_at', { ascending: false }).limit(200),
    ]);
    if (a.error) setMsg('تعذر تحميل المتاجر: ' + a.error.message);
    setStores(a.data || []); setPlans(b.data || []); setReqs(c.data || []);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    const ch = supabase.channel('admin-billing')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plan_requests' }, load)
      .subscribe();
    return () => { clearInterval(t); supabase.removeChannel(ch); };
  }, [load]);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };
  const after = async (m) => { await load(); if (onChanged) onChanged(); flash(m); };
  const patch = async (s, p, m) => {
    setBusy(true);
    const { error } = await supabase.from('store_profiles').update(p).eq('id', s.id);
    setBusy(false);
    if (error) { flash('خطأ: ' + error.message); return; }
    await after(m || 'تم الحفظ');
  };

  const toggle = (s) => patch(s, s.is_active === true ? { is_active: false } : { is_active: true, activated_at: s.activated_at || new Date().toISOString() }, s.is_active === true ? 'تم تعطيل المتجر' : 'تم تفعيل المتجر');
  const addOrders = (s) => {
    const v = prompt('كم طلب تضيف لباقة هذا التاجر؟', '100');
    if (v === null) return;
    const add = Math.floor(n(v));
    if (add <= 0) return;
    patch(s, { orders_quota: n(s.orders_used) + (remainingOf(s) || 0) + add }, `تمت إضافة ${add} طلب`);
  };
  const setQuota = (s) => {
    const v = prompt('إجمالي الطلبات المسموحة (اتركه فارغاً = بلا حد):', s.orders_quota ?? '');
    if (v === null) return;
    patch(s, { orders_quota: v.trim() === '' ? null : Math.max(0, Math.floor(n(v))) }, 'تم تحديث الحصة');
  };
  const setPrice = (s) => {
    const v = prompt('سعر الطلب الواحد المستحق على التاجر:', s.price_per_order ?? 0);
    if (v === null) return;
    patch(s, { price_per_order: Math.max(0, n(v)) }, 'تم تحديث سعر الطلب');
  };
  const pay = (s) => {
    const v = prompt('المبلغ الذي دفعه التاجر الآن:', '0');
    if (v === null || n(v) <= 0) return;
    patch(s, { amount_paid: money(n(s.amount_paid) + n(v)) }, 'تم تسجيل الدفعة');
  };
  const renew = (s) => {
    const v = prompt('مدّ الاشتراك كم يوم من الآن؟ (0 = بلا تاريخ انتهاء)', '30');
    if (v === null) return;
    const d = Math.floor(n(v));
    patch(s, { subscription_ends_at: d > 0 ? new Date(Date.now() + d * 86400000).toISOString() : null }, 'تم تحديث الاشتراك');
  };
  const toggleWa = (s) => patch(s, { whatsapp_button: s.whatsapp_button === false }, s.whatsapp_button === false ? 'تم إظهار زر الواتساب' : 'تم إخفاء زر الواتساب');

  const rows = useMemo(() => stores.filter((s) => {
    const st = storeState(s);
    if (filter !== 'all' && st !== filter) return false;
    const t = q.trim().toLowerCase();
    return !t || [s.store_name, s.store_slug, s.owner_name, s.phone].some((x) => String(x || '').toLowerCase().includes(t));
  }), [stores, q, filter]);

  const totals = useMemo(() => {
    const t = { stores: stores.length, ok: 0, inactive: 0, quota: 0, expired: 0, used: 0, remaining: 0, paid: 0, owed: 0, payers: 0 };
    stores.forEach((s) => {
      t[storeState(s)] += 1;
      t.used += n(s.orders_used); t.paid += n(s.amount_paid); t.owed += owedOf(s);
      const r = remainingOf(s); if (r != null) t.remaining += r;
      if (n(s.amount_paid) > 0) t.payers += 1;
    });
    return t;
  }, [stores]);

  const storeName = (id) => { const s = stores.find((x) => String(x.user_id) === String(id)); return s ? (s.store_name || s.store_slug) : id; };
  const planName = (id) => plans.find((p) => p.id === id)?.name || '—';

  const approve = async (r) => {
    setBusy(true);
    const { error } = await supabase.rpc('approve_plan_request', { p_id: r.id });
    setBusy(false);
    if (error) { flash('خطأ: ' + error.message); return; }
    await after('تمت الموافقة وتفعيل المتجر');
  };
  const reject = async (r) => {
    const note = prompt('سبب الرفض (يصل للتاجر):', '');
    if (note === null) return;
    setBusy(true);
    await supabase.from('plan_requests').update({ status: 'rejected', note, decided_at: new Date().toISOString() }).eq('id', r.id);
    await supabase.from('platform_notifications').insert([{ audience: String(r.store_id), kind: 'plan', title: 'تم رفض طلب الاشتراك', body: note || '' }]);
    setBusy(false);
    await after('تم رفض الطلب');
  };

  const dv = (p, k) => (draft[p.id] && k in draft[p.id] ? draft[p.id][k] : (k === 'features' ? (p.features || []).join('\n') : p[k]));
  const setD = (p, k, v) => setDraft((d) => ({ ...d, [p.id]: { ...(d[p.id] || {}), [k]: v } }));
  const savePlan = async (p) => {
    const d = draft[p.id] || {};
    const row = { ...d };
    if ('features' in d) row.features = String(d.features).split('\n').map((x) => x.trim()).filter(Boolean);
    ['price', 'orders_included', 'per_order_price', 'sort_order'].forEach((k) => { if (k in row) row[k] = n(row[k]); });
    if (!Object.keys(row).length) return;
    setBusy(true);
    const { error } = await supabase.from('platform_plans').update(row).eq('id', p.id);
    setBusy(false);
    if (error) { flash('خطأ: ' + error.message); return; }
    setDraft((x) => { const c = { ...x }; delete c[p.id]; return c; });
    await after('تم حفظ الباقة');
  };
  const addPlan = async () => {
    const code = (prompt('كود الباقة بالإنجليزية (مثال: gold):', '') || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!code) return;
    const { error } = await supabase.from('platform_plans').insert([{ code, name: code, price: 0, orders_included: 100, sort_order: plans.length + 1 }]);
    if (error) { flash('خطأ: ' + error.message); return; }
    await after('تمت إضافة الباقة');
  };
  const delPlan = async (p) => {
    if (!confirm(`حذف باقة «${p.name}»؟`)) return;
    const { error } = await supabase.from('platform_plans').delete().eq('id', p.id);
    if (error) { flash('خطأ: ' + error.message); return; }
    await after('تم حذف الباقة');
  };

  const box = `rounded-2xl border ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'}`;
  const inp = 'w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-xs outline-none focus:border-[#00B050]';
  const btn = 'px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-[11px] font-bold cursor-pointer hover:bg-slate-500/10 disabled:opacity-50';
  const pending = reqs.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        {[['stores', 'المتاجر والحصص'], ['reqs', `طلبات الاشتراك${pending ? ` (${pending})` : ''}`], ['plans', 'الباقات والأسعار']].map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer border ${tab === id ? 'bg-[#00B050] text-white border-[#00B050]' : 'border-slate-300 dark:border-slate-700'}`}>{l}</button>
        ))}
        {msg ? <span className="text-xs font-bold text-[#00B050] mx-2">{msg}</span> : null}
      </div>

      {tab === 'stores' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card title="إجمالي التجار" value={totals.stores} sub={`${totals.ok} يعمل · ${totals.inactive} غير مفعّل`} />
            <Card title="دفعوا اشتراكاً" value={totals.payers} sub={`إجمالي المدفوع ${money(totals.paid)}`} tone="text-emerald-600" />
            <Card title="إجمالي الطلبات المستهلكة" value={totals.used} sub={`المتبقي لدى التجار ${totals.remaining}`} />
            <Card title="متاجر متوقفة (طلبات/اشتراك)" value={totals.quota + totals.expired} sub={`${totals.quota} انتهت طلباتهم · ${totals.expired} انتهى اشتراكهم`} tone="text-rose-500" />
            <Card title="إجمالي المستحق على التجار" value={money(totals.owed)} tone="text-amber-600" />
          </div>

          <div className={`${box} p-4`}>
            <div className="flex flex-wrap gap-2 mb-3">
              <input className={`${inp} max-w-xs`} placeholder="بحث باسم المتجر/المالك/الهاتف" value={q} onChange={(e) => setQ(e.target.value)} />
              <select className={`${inp} max-w-[160px]`} value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">كل الحالات</option>
                {Object.entries(STATE).map(([k, v]) => <option key={k} value={k}>{v[0]}</option>)}
              </select>
              <button className={btn} onClick={load}>🔄 تحديث</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                    {['المتجر', 'الحالة', 'الطلبات', 'المتبقي', 'ينتهي', 'سعر الطلب', 'المدفوع', 'المستحق', 'إجراءات'].map((h) => <th key={h} className="p-2 text-right whitespace-nowrap">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => {
                    const st = storeState(s); const rem = remainingOf(s);
                    return (
                      <tr key={s.id} className="border-b border-slate-100 dark:border-slate-800/60 align-top">
                        <td className="p-2"><b>{s.store_name || s.store_slug}</b><div className="text-[10px] text-slate-400" dir="ltr">{s.store_slug} · {s.phone || ''}</div></td>
                        <td className="p-2"><span className={`px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${STATE[st][1]}`}>{STATE[st][0]}</span></td>
                        <td className="p-2 font-mono">{n(s.orders_used)}{s.orders_quota != null ? ` / ${s.orders_quota}` : ' / ∞'}</td>
                        <td className={`p-2 font-mono font-bold ${rem === 0 ? 'text-rose-500' : ''}`}>{rem == null ? '∞' : rem}</td>
                        <td className="p-2 whitespace-nowrap font-mono">{s.subscription_ends_at ? new Date(s.subscription_ends_at).toLocaleDateString() : '—'}</td>
                        <td className="p-2 font-mono">{money(s.price_per_order)}</td>
                        <td className="p-2 font-mono">{money(s.amount_paid)}</td>
                        <td className={`p-2 font-mono font-bold ${owedOf(s) > 0 ? 'text-amber-600' : ''}`}>{owedOf(s)}</td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-1 min-w-[260px]">
                            <button disabled={busy} className={`${btn} ${s.is_active === true ? 'text-rose-500' : 'text-emerald-600'}`} onClick={() => toggle(s)}>{s.is_active === true ? 'تعطيل' : 'تفعيل'}</button>
                            <button disabled={busy} className={btn} onClick={() => addOrders(s)}>+ طلبات</button>
                            <button disabled={busy} className={btn} onClick={() => setQuota(s)}>الحصة</button>
                            <button disabled={busy} className={btn} onClick={() => setPrice(s)}>سعر الطلب</button>
                            <button disabled={busy} className={btn} onClick={() => pay(s)}>تسجيل دفعة</button>
                            <button disabled={busy} className={btn} onClick={() => renew(s)}>تجديد</button>
                            <button disabled={busy} className={btn} onClick={() => toggleWa(s)}>واتساب: {s.whatsapp_button === false ? 'مخفي' : 'ظاهر'}</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!rows.length && <tr><td colSpan={9} className="p-8 text-center text-slate-400">لا توجد متاجر مطابقة</td></tr>}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-400 mt-3">المستحق = (الطلبات المستهلكة × سعر الطلب) − المدفوع. المتجر يتوقف تلقائياً (لا طلبات ولا بكسل) عند نفاد الحصة أو انتهاء الاشتراك أو عدم التفعيل، ويرجع تلقائياً بمجرد التجديد أو إضافة طلبات.</p>
          </div>
        </>
      )}

      {tab === 'reqs' && (
        <div className={`${box} p-4`}>
          <h3 className="font-black mb-3">طلبات الاشتراك والشحن</h3>
          {!reqs.length ? <div className="text-center text-slate-400 py-10 text-xs">لا توجد طلبات</div> : (
            <div className="space-y-2">
              {reqs.map((r) => (
                <div key={r.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-3 items-center text-xs">
                  {r.proof_url ? <a href={r.proof_url} target="_blank" rel="noopener noreferrer"><img src={r.proof_url} alt="إثبات الدفع" className="w-16 h-16 rounded-lg object-cover border" /></a> : <div className="w-16 h-16 rounded-lg bg-slate-500/10 flex items-center justify-center text-slate-400">بدون صورة</div>}
                  <div className="flex-1 min-w-[180px]">
                    <b>{storeName(r.store_id)}</b> · {planName(r.plan_id)}
                    <div className="text-slate-400">المبلغ: {money(r.amount)} · {new Date(r.created_at).toLocaleString()}</div>
                    {r.note ? <div className="text-slate-500">ملاحظة: {r.note}</div> : null}
                  </div>
                  {r.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button disabled={busy} className={`${btn} text-emerald-600`} onClick={() => approve(r)}>موافقة وتفعيل</button>
                      <button disabled={busy} className={`${btn} text-rose-500`} onClick={() => reject(r)}>رفض</button>
                    </div>
                  ) : <span className={`px-2 py-0.5 rounded-full font-bold ${r.status === 'approved' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-rose-500/15 text-rose-500'}`}>{r.status === 'approved' ? 'تمت الموافقة' : 'مرفوض'}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'plans' && (
        <div className={`${box} p-4`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-black">الباقات وأسعارها (تظهر للتاجر داخل لوحته)</h3>
            <button className={btn} onClick={addPlan}>+ باقة جديدة</button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {plans.map((p) => (
              <div key={p.id} className={`p-4 rounded-xl border space-y-2 text-xs ${p.highlight ? 'border-[#00B050]' : 'border-slate-200 dark:border-slate-800'}`}>
                <div className="flex justify-between items-center"><span className="font-mono text-slate-400" dir="ltr">{p.code}</span><button className="text-rose-500 font-bold cursor-pointer" onClick={() => delPlan(p)}>حذف</button></div>
                <label className="block">الاسم<input className={inp} value={dv(p, 'name')} onChange={(e) => setD(p, 'name', e.target.value)} /></label>
                <div className="grid grid-cols-2 gap-2">
                  <label>السعر<input className={inp} type="number" min="0" value={dv(p, 'price')} onChange={(e) => setD(p, 'price', e.target.value)} /></label>
                  <label>العملة<input className={inp} value={dv(p, 'currency')} onChange={(e) => setD(p, 'currency', e.target.value)} /></label>
                  <label>الطلبات المشمولة<input className={inp} type="number" min="0" value={dv(p, 'orders_included')} onChange={(e) => setD(p, 'orders_included', e.target.value)} /></label>
                  <label>سعر الطلب الإضافي<input className={inp} type="number" min="0" value={dv(p, 'per_order_price')} onChange={(e) => setD(p, 'per_order_price', e.target.value)} /></label>
                </div>
                <label className="block">المميزات (سطر لكل ميزة)<textarea rows={4} className={inp} value={dv(p, 'features')} onChange={(e) => setD(p, 'features', e.target.value)} /></label>
                <div className="flex gap-4">
                  <label className="flex gap-1 items-center"><input type="checkbox" checked={!!dv(p, 'highlight')} onChange={(e) => setD(p, 'highlight', e.target.checked)} />مميزة</label>
                  <label className="flex gap-1 items-center"><input type="checkbox" checked={dv(p, 'enabled') !== false} onChange={(e) => setD(p, 'enabled', e.target.checked)} />ظاهرة للتجار</label>
                </div>
                <button disabled={busy || !draft[p.id]} className="w-full py-2 bg-[#00B050] text-white rounded-lg font-bold cursor-pointer disabled:opacity-40" onClick={() => savePlan(p)}>حفظ</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
