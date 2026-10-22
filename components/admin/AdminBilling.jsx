'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { storeStateOf, commissionOf, ordersLeft, monthlyActive, toEgp, egpFmt, usdFmt, setPlatformCommission } from '../../lib/billing';
import { useUsdRate } from '../useUsdRate';

const n = (v) => Number(v) || 0;
const money = (v) => Math.round(n(v) * 100) / 100;

export const storeState = (s) => storeStateOf(s);
const STATE = {
  ok: ['يعمل', 'bg-emerald-500/15 text-emerald-600'],
  inactive: ['غير مفعّل', 'bg-slate-500/15 text-slate-500'],
  quota: ['الرصيد خلص', 'bg-rose-500/15 text-rose-500'],
  expired: ['انتهى الاشتراك', 'bg-amber-500/15 text-amber-600'],
};

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
  const [pc, setPc] = useState('0.03');
  const [manual, setManual] = useState('');
  const { rate, source } = useUsdRate();

  const load = useCallback(async () => {
    const [a, b, c, k] = await Promise.all([
      supabase.from('store_profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('platform_plans').select('*').order('sort_order'),
      supabase.from('plan_requests').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('platform_kv').select('key,value').in('key', ['commission_usd', 'usd_egp_manual']),
    ]);
    (k.data || []).forEach((x) => {
      if (x.key === 'commission_usd') { setPc(x.value || '0.03'); setPlatformCommission(Number(x.value) || 0); }
      if (x.key === 'usd_egp_manual') setManual((cur) => (cur === '' ? x.value || '' : cur));
    });
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
  const addBalance = (s) => {
    const v = prompt('كم دولار تضيف لرصيد هذا التاجر؟ (المبلغ الذي حوّله)', '10');
    if (v === null) return;
    const add = money(n(v));
    if (add <= 0) return;
    patch(s, { wallet_balance_usd: money(n(s.wallet_balance_usd) + add), amount_paid: money(n(s.amount_paid) + add) }, `تمت إضافة ${usdFmt(add)} للرصيد`);
  };
  const addFree = (s) => {
    const v = prompt('كم طلب مجاني تضيف لهذا التاجر؟', '25');
    if (v === null) return;
    const add = Math.floor(n(v));
    if (add <= 0) return;
    patch(s, { free_orders_left: n(s.free_orders_left) + add, free_orders_total: n(s.free_orders_total) + add }, `تمت إضافة ${add} طلب مجاني`);
  };
  const setBalance = (s) => {
    const v = prompt('اضبط الرصيد الحالي بالدولار (تصحيح):', money(s.wallet_balance_usd));
    if (v === null) return;
    patch(s, { wallet_balance_usd: Math.max(0, money(n(v))) }, 'تم ضبط الرصيد');
  };
  const setCommission = (s) => {
    const v = prompt('عمولة الطلب لهذا التاجر بالدولار (فارغ = عمولة المنصة):', s.commission_usd ?? '');
    if (v === null) return;
    patch(s, { commission_usd: v.trim() === '' ? null : Math.max(0, n(v)) }, 'تم تحديث العمولة');
  };
  const renew = (s) => {
    const v = prompt('اشتراك شهري: مدّ كم يوم من الآن؟ (0 = إلغاء الاشتراك الشهري)', '30');
    if (v === null) return;
    const d = Math.floor(n(v));
    patch(s, { subscription_ends_at: d > 0 ? new Date(Date.now() + d * 86400000).toISOString() : null }, 'تم تحديث الاشتراك الشهري');
  };
  const toggleWa = (s) => patch(s, { whatsapp_button: s.whatsapp_button === false }, s.whatsapp_button === false ? 'تم إظهار زر الواتساب' : 'تم إخفاء زر الواتساب');

  const rows = useMemo(() => stores.filter((s) => {
    const st = storeState(s);
    if (filter !== 'all' && st !== filter) return false;
    const t = q.trim().toLowerCase();
    return !t || [s.store_name, s.store_slug, s.owner_name, s.phone].some((x) => String(x || '').toLowerCase().includes(t));
  }), [stores, q, filter]);

  const totals = useMemo(() => {
    const t = { stores: stores.length, ok: 0, inactive: 0, quota: 0, expired: 0, used: 0, remaining: 0, balance: 0, topped: 0, payers: 0, monthly: 0 };
    stores.forEach((s) => {
      t[storeState(s)] += 1;
      t.used += n(s.orders_used); t.balance += n(s.wallet_balance_usd); t.topped += n(s.wallet_topped_usd);
      const r = ordersLeft(s); if (r != null) t.remaining += r; else t.monthly += 1;
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
    await after('تمت الموافقة: أُضيف الرصيد/الاشتراك وفُعّل المتجر');
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
    ['price', 'sort_order'].forEach((k) => { if (k in row) row[k] = n(row[k]); });
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
    const { error } = await supabase.from('platform_plans').insert([{ code, name: code, price: 0, currency: 'USD', kind: 'topup', sort_order: plans.length + 1 }]);
    if (error) { flash('خطأ: ' + error.message); return; }
    await after('تمت إضافة الباقة');
  };
  const delPlan = async (p) => {
    if (!confirm(`حذف باقة «${p.name}»؟`)) return;
    const { error } = await supabase.from('platform_plans').delete().eq('id', p.id);
    if (error) { flash('خطأ: ' + error.message); return; }
    await after('تم حذف الباقة');
  };

  const savePricing = async () => {
    const c = n(pc);
    if (!(c > 0 && c < 5)) { flash('عمولة غير صحيحة'); return; }
    const m = String(manual).trim();
    if (m !== '' && !(n(m) > 1)) { flash('سعر الدولار اليدوي غير صحيح'); return; }
    const { error } = await supabase.from('platform_kv').upsert([
      { key: 'commission_usd', value: String(c), updated_at: new Date().toISOString() },
      { key: 'usd_egp_manual', value: m, updated_at: new Date().toISOString() },
    ], { onConflict: 'key' });
    if (error) { flash('خطأ: ' + error.message); return; }
    setPlatformCommission(c);
    await after('تم حفظ التسعير');
  };

  const box = `rounded-2xl border ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'}`;
  const inp = 'w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-xs outline-none focus:border-[#00B050]';
  const btn = 'px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-[11px] font-bold cursor-pointer hover:bg-slate-500/10 disabled:opacity-50';
  const pending = reqs.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        {[['stores', 'المتاجر والأرصدة'], ['reqs', `طلبات الاشتراك${pending ? ` (${pending})` : ''}`], ['plans', 'الباقات والأسعار']].map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer border ${tab === id ? 'bg-[#00B050] text-white border-[#00B050]' : 'border-slate-300 dark:border-slate-700'}`}>{l}</button>
        ))}
        {msg ? <span className="text-xs font-bold text-[#00B050] mx-2">{msg}</span> : null}
      </div>

      {tab === 'stores' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card title="إجمالي التجار" value={totals.stores} sub={`${totals.ok} يعمل · ${totals.inactive} غير مفعّل · ${totals.monthly} اشتراك شهري`} />
            <Card title="دفعوا / شحنوا رصيداً" value={totals.payers} sub={`إجمالي المشحون ${usdFmt(totals.topped)}${rate ? ` ≈ ${egpFmt(toEgp(totals.topped, rate))}` : ''}`} tone="text-emerald-600" />
            <Card title="إجمالي الطلبات المستخدمة" value={totals.used} sub={`المتبقي لدى التجار ${totals.remaining} طلب`} />
            <Card title="متاجر متوقفة (الرصيد خلص)" value={totals.quota} sub={`${totals.inactive} غير مفعّل`} tone="text-rose-500" />
            <Card title="إجمالي أرصدة التجار" value={usdFmt(totals.balance)} sub={rate ? `≈ ${egpFmt(toEgp(totals.balance, rate))}` : ''} tone="text-amber-600" />
            <Card title="سعر الدولار الآن" value={rate ? `${rate} ج.م` : '...'} sub={source === 'manual' ? 'سعر يدوي من الأدمن' : source ? `تلقائي (${source})` : ''} />
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
                    {['المتجر', 'الحالة', 'الرصيد', 'إجمالي الشحن', 'الطلبات', 'المتبقي', 'الاشتراك الشهري', 'العمولة', 'إجراءات'].map((h) => <th key={h} className="p-2 text-right whitespace-nowrap">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => {
                    const st = storeState(s); const rem = ordersLeft(s);
                    return (
                      <tr key={s.id} className="border-b border-slate-100 dark:border-slate-800/60 align-top">
                        <td className="p-2"><b>{s.store_name || s.store_slug}</b><div className="text-[10px] text-slate-400" dir="ltr">{s.store_slug} · {s.phone || ''}</div></td>
                        <td className="p-2"><span className={`px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${STATE[st][1]}`}>{STATE[st][0]}</span></td>
                        <td className="p-2 font-mono">{usdFmt(s.wallet_balance_usd)}{rate ? <div className="text-[10px] text-slate-400">{egpFmt(toEgp(s.wallet_balance_usd, rate))}</div> : null}</td>
                        <td className="p-2 font-mono">{usdFmt(s.wallet_topped_usd)}</td>
                        <td className="p-2 font-mono">{n(s.orders_used)}</td>
                        <td className={`p-2 font-mono font-bold ${rem === 0 ? 'text-rose-500' : ''}`}>{rem == null ? '∞' : rem}{n(s.free_orders_left) > 0 ? <div className="text-[10px] text-slate-400 font-normal">منها {n(s.free_orders_left)} مجاني</div> : null}</td>
                        <td className="p-2 whitespace-nowrap font-mono">{monthlyActive(s) ? new Date(s.subscription_ends_at).toLocaleDateString() : '—'}</td>
                        <td className="p-2 font-mono">{usdFmt(commissionOf(s))}{s.commission_usd ? <div className="text-[10px] text-slate-400">خاصة</div> : null}</td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-1 min-w-[260px]">
                            <button disabled={busy} className={`${btn} ${s.is_active === true ? 'text-rose-500' : 'text-emerald-600'}`} onClick={() => toggle(s)}>{s.is_active === true ? 'تعطيل' : 'تفعيل'}</button>
                            <button disabled={busy} className={btn} onClick={() => addBalance(s)}>+ رصيد $</button>
                            <button disabled={busy} className={btn} onClick={() => addFree(s)}>+ طلبات مجانية</button>
                            <button disabled={busy} className={btn} onClick={() => setBalance(s)}>ضبط الرصيد</button>
                            <button disabled={busy} className={btn} onClick={() => setCommission(s)}>العمولة</button>
                            <button disabled={busy} className={btn} onClick={() => renew(s)}>اشتراك شهري</button>
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
            <p className="text-[10px] text-slate-400 mt-3">كل طلب يخصم العمولة من رصيد التاجر. المتجر يتوقف تلقائياً (لا طلبات ولا بكسل) لو الرصيد أقل من عمولة طلب ولا يوجد اشتراك شهري ساري أو لم يُفعَّل، ويرجع تلقائياً بمجرد الشحن. الاشتراك الشهري الساري = طلبات بلا خصم.</p>
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
        <div className={`${box} p-4 mb-4`}>
          <h3 className="font-black mb-3">التسعير العام</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs items-end">
            <label>عمولة الطلب بالدولار (الافتراضي 0.03 = 3 سنت)<input className={inp} type="number" step="0.001" min="0" value={pc} onChange={(e) => setPc(e.target.value)} /></label>
            <label>سعر الدولار يدوي بالجنيه (فارغ = تلقائي، الآن {rate || '...'})<input className={inp} type="number" step="0.01" min="0" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="اتركه فارغاً للسعر التلقائي" /></label>
            <button className="py-2 bg-[#00B050] text-white rounded-lg font-bold cursor-pointer" onClick={savePricing}>حفظ التسعير</button>
          </div>
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
                  <label>السعر ($)<input className={inp} type="number" min="0" value={dv(p, 'price')} onChange={(e) => setD(p, 'price', e.target.value)} /></label>
                  <label>النوع<select className={inp} value={dv(p, 'kind') || 'topup'} onChange={(e) => setD(p, 'kind', e.target.value)}><option value="topup">شحن رصيد</option><option value="monthly">اشتراك شهري (30 يوم)</option></select></label>
                  <label>الترتيب<input className={inp} type="number" value={dv(p, 'sort_order')} onChange={(e) => setD(p, 'sort_order', e.target.value)} /></label>
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
