'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useUsdRate } from '../useUsdRate';

const DAY = 86400000;
const PERIODS = [
  { k: '7', t: 'آخر أسبوع', days: 7, bucket: 'day' },
  { k: '30', t: 'آخر شهر', days: 30, bucket: 'day' },
  { k: '182', t: 'آخر 6 شهور', days: 182, bucket: 'month' },
  { k: '365', t: 'آخر سنة', days: 365, bucket: 'month' },
  { k: 'all', t: 'من البداية', days: null, bucket: 'month' },
];
const num = (v) => Number(v) || 0;
const fmt = (v) => num(v).toLocaleString('en-US', { maximumFractionDigits: 0 });
const usd = (v) => `$${num(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (a, b) => (b > 0 ? (a / b) * 100 : null);
const deliveryRate = (d, r, c) => pct(num(d), num(d) + num(r) + num(c));

/* نسبة التغيير مقارنة بالفترة السابقة */
function Delta({ cur, prev, points = false }) {
  if (prev === null || prev === undefined || cur === null || cur === undefined) return <span className="text-[10px] text-slate-400">—</span>;
  if (!points && num(prev) === 0) return <span className="text-[10px] text-slate-400">{num(cur) > 0 ? 'جديد' : '—'}</span>;
  const d = points ? num(cur) - num(prev) : ((num(cur) - num(prev)) / num(prev)) * 100;
  const up = d > 0.05; const down = d < -0.05;
  const cls = up ? 'text-emerald-500' : down ? 'text-rose-500' : 'text-slate-400';
  return <span className={`text-[11px] font-black ${cls}`} dir="ltr">{up ? '▲' : down ? '▼' : '■'} {Math.abs(d).toFixed(1)}{points ? ' نقطة' : '%'}</span>;
}

function Kpi({ label, value, sub, delta, isDark }) {
  return (
    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0B132B] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
      <div className="text-[11px] font-bold text-slate-400">{label}</div>
      <div className="text-2xl font-black mt-1" dir="ltr" style={{ textAlign: 'right' }}>{value}</div>
      <div className="flex items-center justify-between gap-2 mt-1 min-h-[16px]">
        <span className="text-[10px] text-slate-400">{sub}</span>
        {delta}
      </div>
    </div>
  );
}

export default function AdminAnalytics({ isDark }) {
  const rate = useUsdRate();
  const [pk, setPk] = useState('30');
  const [cur, setCur] = useState(null);
  const [prev, setPrev] = useState(null);
  const [all, setAll] = useState(null);
  const [series, setSeries] = useState([]);
  const [stores, setStores] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('orders');

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    const P = PERIODS.find((x) => x.k === pk);
    const now = new Date(Date.now() + 60000);
    const from = P.days ? new Date(now.getTime() - P.days * DAY) : new Date('2020-01-01T00:00:00Z');
    const pFrom = P.days ? new Date(from.getTime() - P.days * DAY) : null;
    const iso = (d) => d.toISOString();
    try {
      const calls = [
        supabase.rpc('admin_stats_period', { p_from: iso(from), p_to: iso(now) }),
        P.days ? supabase.rpc('admin_stats_period', { p_from: iso(pFrom), p_to: iso(from) }) : Promise.resolve({ data: null }),
        supabase.rpc('admin_stats_period', { p_from: '2020-01-01T00:00:00Z', p_to: iso(now) }),
        supabase.rpc('admin_stats_series', { p_from: iso(from), p_to: iso(now), p_bucket: P.bucket }),
        supabase.rpc('admin_stats_stores', { p_from: iso(from), p_to: iso(now) }),
      ];
      const [a, b, c, d, e] = await Promise.all(calls);
      const bad = [a, c, d, e].find((x) => x.error);
      if (bad) throw new Error(bad.error.message);
      setCur(a.data); setPrev(b.data); setAll(c.data); setSeries(d.data || []); setStores(e.data || []);
    } catch (ex) { setErr(ex.message || 'تعذر تحميل الإحصائيات'); }
    setLoading(false);
  }, [pk]);
  useEffect(() => { load(); }, [load]);

  const P = PERIODS.find((x) => x.k === pk);
  const r = num(rate.rate);

  const dr = cur ? deliveryRate(cur.delivered, cur.returned, cur.cancelled) : null;
  const drPrev = prev ? deliveryRate(prev.delivered, prev.returned, prev.cancelled) : null;

  const verdict = useMemo(() => {
    if (!cur || !prev) return null;
    const checks = [
      [num(cur.orders), num(prev.orders)],
      [num(cur.gmv), num(prev.gmv)],
      [num(cur.commission_usd), num(prev.commission_usd)],
    ];
    if (dr !== null && drPrev !== null) checks.push([dr, drPrev]);
    const up = checks.filter(([a, b]) => a > b).length;
    const down = checks.filter(([a, b]) => a < b).length;
    if (!num(prev.orders) && !num(cur.orders)) return { c: 'slate', t: 'لا توجد طلبات في الفترتين للمقارنة.' };
    if (up > down) return { c: 'emerald', t: `📈 المنصة في تقدّم مقارنة بالفترة السابقة (${up} من ${checks.length} مؤشرات تحسّنت).` };
    if (down > up) return { c: 'rose', t: `📉 المنصة في تراجع مقارنة بالفترة السابقة (${down} من ${checks.length} مؤشرات انخفضت).` };
    return { c: 'amber', t: '➖ الأداء ثابت تقريباً مقارنة بالفترة السابقة.' };
  }, [cur, prev, dr, drPrev]);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = stores.filter((s) => !t || `${s.store_name || ''} ${s.store_slug || ''}`.toLowerCase().includes(t));
    const by = {
      orders: (s) => -num(s.orders), gmv: (s) => -num(s.gmv), commission: (s) => -num(s.commission_usd),
      delivery: (s) => -(deliveryRate(s.delivered, s.returned, s.cancelled) ?? -1), left: (s) => num(s.orders_left),
      name: (s) => String(s.store_name || ''),
    }[sort];
    return [...list].sort((a, b) => { const x = by(a); const y = by(b); return typeof x === 'string' ? x.localeCompare(y) : x - y; });
  }, [stores, q, sort]);

  const maxOrders = Math.max(1, ...series.map((s) => num(s.orders)));
  const label = (b) => { const d = new Date(b + 'T00:00:00'); return P.bucket === 'month' ? `${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}` : `${d.getDate()}/${d.getMonth() + 1}`; };

  const exportCsv = () => {
    const head = ['المتجر', 'الرابط', 'الطلبات', 'المبيعات', 'تم التسليم', 'مرتجع', 'ملغي', 'نسبة التسليم %', 'عمولة مخصومة $', 'طلبات مجانية استُهلكت', 'الرصيد $', 'مجاني متبقي', 'عمولة الطلب $', 'طلبات متبقية', 'اشتراك شهري حتى'];
    const body = rows.map((s) => [s.store_name, s.store_slug, s.orders, s.gmv, s.delivered, s.returned, s.cancelled, (deliveryRate(s.delivered, s.returned, s.cancelled) ?? '').toString().slice(0, 5), s.commission_usd, s.free_used, s.wallet_balance_usd, s.free_orders_left, s.commission_each, s.orders_left, s.monthly_until || '']);
    const csv = '\ufeff' + [head, ...body].map((r2) => r2.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `spike-stores-${pk}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  const card = `p-4 sm:p-6 rounded-2xl border ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'}`;
  const verdictCls = { emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600', rose: 'bg-rose-500/10 border-rose-500/30 text-rose-600', amber: 'bg-amber-500/10 border-amber-500/30 text-amber-600', slate: 'bg-slate-500/10 border-slate-500/30 text-slate-500' };

  return (
    <div className="space-y-4">
      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black">إحصائيات المنصة</h3>
            <p className="text-xs text-slate-400">كل الأرقام لحظية من قاعدة البيانات. المقارنة مع نفس المدة قبل الفترة المختارة.</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PERIODS.map((x) => (
              <button key={x.k} type="button" onClick={() => setPk(x.k)} className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer border ${pk === x.k ? 'bg-[#00B050] text-white border-[#00B050]' : isDark ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-600'}`}>{x.t}</button>
            ))}
            <button type="button" onClick={load} className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer border ${isDark ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-600'}`}>↻ تحديث</button>
          </div>
        </div>
        {err ? <div className="mt-3 p-3 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-bold">⚠️ {err} — تأكد إنك شغّلت ملف SQL الخاص بالإحصائيات (spike_stage6a.sql).</div> : null}
      </div>

      {loading && !cur ? <div className={card}>جاري التحميل...</div> : null}

      {all ? (
        <div className={`${card} bg-gradient-to-l from-[#00B050]/10 to-transparent`}>
          <div className="text-xs font-black text-slate-400 mb-2">🌍 الإجمالي من أول يوم لحد اللحظة دي</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div><div className="text-2xl font-black">{fmt(all.orders)}</div><div className="text-[11px] text-slate-400">طلب على المنصة</div></div>
            <div><div className="text-2xl font-black">{fmt(all.gmv)}</div><div className="text-[11px] text-slate-400">إجمالي المبيعات</div></div>
            <div><div className="text-2xl font-black">{usd(all.commission_usd)}</div><div className="text-[11px] text-slate-400">عمولات محصّلة{r ? ` (≈ ${fmt(num(all.commission_usd) * r)} ج.م)` : ''}</div></div>
            <div><div className="text-2xl font-black">{fmt(all.new_stores)}</div><div className="text-[11px] text-slate-400">متجر مسجّل</div></div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">العمولات تُحسب من لحظة تفعيل سجل العمولات فقط (الطلبات قبله لا يوجد لها سجل خصم).</p>
        </div>
      ) : null}

      {cur ? (
        <>
          {verdict ? <div className={`p-3 rounded-xl border text-sm font-black ${verdictCls[verdict.c]}`}>{verdict.t}</div> : null}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi isDark={isDark} label={`الطلبات (${P.t})`} value={fmt(cur.orders)} sub={prev ? `قبلها: ${fmt(prev.orders)}` : ''} delta={prev ? <Delta cur={num(cur.orders)} prev={num(prev.orders)} /> : null} />
            <Kpi isDark={isDark} label="المبيعات" value={fmt(cur.gmv)} sub={prev ? `قبلها: ${fmt(prev.gmv)}` : 'ج.م (مجموع الطلبات)'} delta={prev ? <Delta cur={num(cur.gmv)} prev={num(prev.gmv)} /> : null} />
            <Kpi isDark={isDark} label="نسبة التسليم" value={dr === null ? '—' : `${dr.toFixed(1)}%`} sub={`${fmt(cur.delivered)} تسليم · ${fmt(cur.returned)} مرتجع · ${fmt(cur.cancelled)} ملغي`} delta={prev ? <Delta cur={dr} prev={drPrev} points /> : null} />
            <Kpi isDark={isDark} label="العمولات المحصّلة" value={usd(cur.commission_usd)} sub={`${fmt(cur.commission_orders)} طلب بعمولة${r ? ` · ≈ ${fmt(num(cur.commission_usd) * r)} ج.م` : ''}`} delta={prev ? <Delta cur={num(cur.commission_usd)} prev={num(prev.commission_usd)} /> : null} />
            <Kpi isDark={isDark} label="طلبات مجانية" value={fmt(cur.free_orders)} sub="من رصيد الطلبات المجانية" delta={prev ? <Delta cur={num(cur.free_orders)} prev={num(prev.free_orders)} /> : null} />
            <Kpi isDark={isDark} label="طلبات اشتراك شهري" value={fmt(cur.monthly_orders)} sub="بدون خصم" delta={prev ? <Delta cur={num(cur.monthly_orders)} prev={num(prev.monthly_orders)} /> : null} />
            <Kpi isDark={isDark} label="متاجر نشطة (لها طلبات)" value={fmt(cur.active_stores)} sub={prev ? `قبلها: ${fmt(prev.active_stores)}` : ''} delta={prev ? <Delta cur={num(cur.active_stores)} prev={num(prev.active_stores)} /> : null} />
            <Kpi isDark={isDark} label="متاجر جديدة" value={fmt(cur.new_stores)} sub={prev ? `قبلها: ${fmt(prev.new_stores)}` : ''} delta={prev ? <Delta cur={num(cur.new_stores)} prev={num(prev.new_stores)} /> : null} />
          </div>

          <div className={card}>
            <h4 className="font-black text-sm mb-3">الطلبات {P.bucket === 'month' ? 'شهرياً' : 'يومياً'}</h4>
            {series.length === 0 ? <p className="text-xs text-slate-400">لا توجد بيانات في الفترة.</p> : (
              <div className="flex items-end gap-1 overflow-x-auto pb-1" style={{ height: 150 }} dir="ltr">
                {series.map((s) => (
                  <div key={s.bucket} className="flex flex-col items-center justify-end shrink-0" style={{ width: Math.max(18, Math.min(46, 900 / series.length)), height: '100%' }} title={`${label(s.bucket)} — ${fmt(s.orders)} طلب · ${fmt(s.gmv)} ج.م · ${usd(s.commission_usd)} عمولة`}>
                    <span className="text-[9px] text-slate-400">{fmt(s.orders)}</span>
                    <div className="w-full rounded-t bg-[#00B050]" style={{ height: `${Math.max(3, (num(s.orders) / maxOrders) * 100)}px` }} />
                    <span className="text-[9px] text-slate-400 mt-1">{label(s.bucket)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={card}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h4 className="font-black text-sm">التجار ({rows.length})</h4>
              <div className="flex flex-wrap gap-2">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالاسم..." className={`px-3 py-1.5 rounded-lg border text-xs ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`} />
                <select value={sort} onChange={(e) => setSort(e.target.value)} className={`px-3 py-1.5 rounded-lg border text-xs ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <option value="orders">الأكثر طلبات</option>
                  <option value="gmv">الأعلى مبيعات</option>
                  <option value="commission">الأعلى عمولة</option>
                  <option value="delivery">الأعلى تسليماً</option>
                  <option value="left">الأقل طلبات متبقية</option>
                  <option value="name">الاسم</option>
                </select>
                <button type="button" onClick={exportCsv} className="px-3 py-1.5 rounded-lg bg-[#00B050] text-white text-xs font-black cursor-pointer">⬇ تصدير CSV</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                    {['المتجر', 'الطلبات', 'المبيعات', 'نسبة التسليم', 'مرتجع/ملغي', 'عمولة مخصومة', 'مجاني مُستهلك', 'الرصيد', 'الطلبات المتبقية', 'الحالة'].map((h) => <th key={h} className="p-2.5 text-right whitespace-nowrap">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => {
                    const d = deliveryRate(s.delivered, s.returned, s.cancelled);
                    const monthly = s.monthly_until && new Date(s.monthly_until) > new Date();
                    const low = !monthly && num(s.orders_left) <= 5;
                    return (
                      <tr key={s.store_id} className="border-b border-slate-100 dark:border-slate-800/50">
                        <td className="p-2.5"><b className="block">{s.store_name || '—'}</b><span className="text-[10px] text-slate-400 font-mono" dir="ltr">{s.store_slug}</span></td>
                        <td className="p-2.5 font-mono font-bold">{fmt(s.orders)}</td>
                        <td className="p-2.5 font-mono">{fmt(s.gmv)}</td>
                        <td className="p-2.5 font-mono font-bold" style={{ color: d === null ? undefined : d >= 70 ? '#10b981' : d >= 50 ? '#f59e0b' : '#f43f5e' }}>{d === null ? '—' : `${d.toFixed(0)}%`}</td>
                        <td className="p-2.5 font-mono text-slate-500">{fmt(s.returned)} / {fmt(s.cancelled)}</td>
                        <td className="p-2.5 font-mono">{usd(s.commission_usd)}<span className="block text-[10px] text-slate-400">{num(s.commission_usd) && r ? `≈ ${fmt(num(s.commission_usd) * r)} ج.م` : ''}</span></td>
                        <td className="p-2.5 font-mono">{fmt(s.free_used)}</td>
                        <td className="p-2.5 font-mono">{usd(s.wallet_balance_usd)}</td>
                        <td className="p-2.5 font-mono font-bold" style={{ color: low ? '#f43f5e' : undefined }}>
                          {monthly ? <span className="text-emerald-500">∞ شهري</span> : fmt(s.orders_left)}
                          {!monthly ? <span className="block text-[10px] font-normal text-slate-400">{fmt(s.free_orders_left)} مجاني + {usd(s.wallet_balance_usd)} ÷ {usd(s.commission_each)}</span> : null}
                        </td>
                        <td className="p-2.5">{s.is_active ? <span className="text-emerald-500 font-bold">مفعّل</span> : <span className="text-rose-500 font-bold">معطّل</span>}</td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 ? <tr><td colSpan={10} className="p-6 text-center text-slate-400">لا توجد نتائج.</td></tr> : null}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">نسبة التسليم = تم التسليم ÷ (تم التسليم + مرتجع + ملغي). الأحمر = أقل من 5 طلبات متبقية.</p>
          </div>
        </>
      ) : null}
    </div>
  );
}
