'use client';
import React, { useMemo, useState } from 'react';

const DAY = 864e5;
const fmt = (n, d = 0) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });
const pct = (a, b) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);

const COLS = [
  ['rank', '#'], ['name', 'المتجر'], ['orders', 'الطلبات'], ['sales', 'المبيعات (ج.م)'], ['delivered', 'مسلّمة'],
  ['deliveryRate', 'نسبة التسليم %'], ['cancelRate', 'إلغاء %'], ['returnRate', 'مرتجع %'], ['aov', 'متوسط الطلب'], ['last', 'آخر طلب'], ['wallet', 'المحفظة $'],
];

/* تقرير أداء التجار: كله من الطلبات المحمّلة في صفحة الأدمن (آخر 3000 طلب كحد أقصى) */
export default function AdminMerchantReport({ stores = [], orders = [], isDark }) {
  const [range, setRange] = useState(30);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('sales');
  const [asc, setAsc] = useState(false);

  const rows = useMemo(() => {
    const from = range ? Date.now() - range * DAY : 0;
    const m = {};
    orders.forEach((o) => {
      if (!o.store_id) return;
      const t = o.created_at ? new Date(o.created_at).getTime() : 0;
      if (from && t < from) return;
      const a = m[o.store_id] || (m[o.store_id] = { n: 0, live: 0, sales: 0, del: 0, can: 0, ret: 0, last: 0 });
      const st = o.status || 'pending';
      a.n += 1;
      if (st === 'cancelled') a.can += 1;
      else if (st === 'returned') a.ret += 1;
      else { a.live += 1; a.sales += Number(o.total_price) || 0; }
      if (st === 'delivered') a.del += 1;
      if (t > a.last) a.last = t;
    });
    return stores.map((s) => {
      const a = m[s.user_id] || m[s.id] || { n: 0, live: 0, sales: 0, del: 0, can: 0, ret: 0, last: 0 };
      return {
        id: s.id, name: s.store_name || s.store_slug || '—', slug: s.store_slug || '', active: s.is_active !== false,
        orders: a.n, sales: a.sales, delivered: a.del,
        deliveryRate: pct(a.del, a.n), cancelRate: pct(a.can, a.n), returnRate: pct(a.ret, a.n),
        aov: a.live ? a.sales / a.live : 0, last: a.last, wallet: Number(s.wallet_balance_usd) || 0,
      };
    });
  }, [stores, orders, range]);

  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    const f = rows.filter((r) => !n || r.name.toLowerCase().includes(n) || r.slug.toLowerCase().includes(n));
    const dir = asc ? 1 : -1;
    const sorted = [...f].sort((a, b) => (typeof a[sort] === 'string' ? a[sort].localeCompare(b[sort]) * dir : ((a[sort] || 0) - (b[sort] || 0)) * dir));
    return sorted.map((r, i) => ({ ...r, rank: i + 1 }));
  }, [rows, q, sort, asc]);

  const totals = useMemo(() => ({
    orders: rows.reduce((a, r) => a + r.orders, 0),
    sales: rows.reduce((a, r) => a + r.sales, 0),
    activeStores: rows.filter((r) => r.orders > 0).length,
  }), [rows]);

  const top = [...rows].filter((r) => r.orders >= 5).sort((a, b) => b.deliveryRate - a.deliveryRate).slice(0, 1)[0];
  const worst = [...rows].filter((r) => r.orders >= 5).sort((a, b) => b.cancelRate + b.returnRate - (a.cancelRate + a.returnRate)).slice(0, 1)[0];

  const sortBy = (k) => { if (k === sort) setAsc(!asc); else { setSort(k); setAsc(k === 'name'); } };
  const lastTxt = (t) => (t ? new Date(t).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }) : '—');

  const exportCsv = () => {
    const head = COLS.map((c) => c[1]);
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const body = list.map((r) => [r.rank, r.name, r.orders, Math.round(r.sales), r.delivered, r.deliveryRate, r.cancelRate, r.returnRate, Math.round(r.aov), r.last ? new Date(r.last).toISOString().slice(0, 10) : '', r.wallet.toFixed(2)].map(esc).join(','));
    const blob = new Blob(['\ufeff' + [head.map(esc).join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `spike-merchants-${range || 'all'}d.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  const card = isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200';
  const mut = isDark ? 'text-slate-400' : 'text-slate-500';
  const inp = isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900';
  const rateCls = (v, bad) => (bad ? (v >= 25 ? 'text-rose-500 font-black' : v >= 12 ? 'text-amber-500 font-bold' : '') : (v >= 70 ? 'text-emerald-500 font-black' : v > 0 && v < 40 ? 'text-amber-500 font-bold' : ''));

  return (
    <div className={`p-4 sm:p-6 rounded-2xl border space-y-4 ${card}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black">🏆 تقرير أداء التجار</h3>
          <p className={`text-xs ${mut}`}>ترتيب التجار حسب المبيعات ونسب التسليم والإلغاء والمرتجع (من آخر 3000 طلب محمّل).</p>
        </div>
        <button type="button" onClick={exportCsv} className="px-4 py-2 rounded-xl bg-[#00B050] hover:bg-[#009644] text-white text-xs font-black cursor-pointer">⬇ تصدير CSV</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {[['🏬', 'متاجر لها طلبات', `${totals.activeStores} / ${rows.length}`], ['📦', 'إجمالي الطلبات', fmt(totals.orders)], ['💰', 'إجمالي المبيعات', `${fmt(totals.sales)} ج.م`],
          ['⭐', 'أعلى نسبة تسليم', top ? `${top.name} · ${top.deliveryRate}%` : 'تحتاج 5 طلبات+']].map(([ic, l, v]) => (
          <div key={l} className={`p-3 rounded-xl border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
            <div className={`text-[11px] font-bold ${mut}`}>{ic} {l}</div>
            <div className="text-sm sm:text-base font-black mt-1 truncate" dir="auto">{v}</div>
          </div>
        ))}
      </div>
      {worst && (worst.cancelRate + worst.returnRate) >= 20 && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-500">
          ⚠️ أعلى إلغاء ومرتجع: {worst.name} ({worst.cancelRate}% إلغاء + {worst.returnRate}% مرتجع). راجع جودة طلباته قبل ما يستنزف الرصيد.
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        {[[7, '7 أيام'], [30, '30 يوم'], [90, '90 يوم'], [0, 'الكل']].map(([v, l]) => (
          <button key={v} type="button" onClick={() => setRange(v)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${range === v ? 'bg-[#00B050] text-white border-[#00B050]' : `${inp}`}`}>{l}</button>
        ))}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم المتجر..." className={`flex-1 min-w-[140px] px-3 py-1.5 rounded-lg text-xs border outline-none ${inp}`} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-200'} ${mut}`}>
              {COLS.map(([k, l]) => (
                <th key={k} className="p-2.5 text-right whitespace-nowrap">
                  {k === 'rank' ? l : <button type="button" onClick={() => sortBy(k)} className="font-bold cursor-pointer hover:text-[#00B050]">{l}{sort === k ? (asc ? ' ▲' : ' ▼') : ''}</button>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? <tr><td colSpan={COLS.length} className={`p-8 text-center ${mut}`}>لا توجد نتائج</td></tr> : list.map((r) => (
              <tr key={r.id} className={`border-b ${isDark ? 'border-slate-800/60 hover:bg-slate-800/40' : 'border-slate-100 hover:bg-slate-50'}`}>
                <td className="p-2.5 font-mono">{r.rank <= 3 && r.orders > 0 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank}</td>
                <td className="p-2.5 font-bold whitespace-nowrap">{r.name}{!r.active && <span className="ms-1 text-[10px] text-rose-500">(معطل)</span>}</td>
                <td className="p-2.5 font-mono">{fmt(r.orders)}</td>
                <td className="p-2.5 font-mono font-bold text-[#00B050]">{fmt(r.sales)}</td>
                <td className="p-2.5 font-mono">{fmt(r.delivered)}</td>
                <td className={`p-2.5 font-mono ${rateCls(r.deliveryRate, false)}`}>{r.orders ? `${r.deliveryRate}%` : '—'}</td>
                <td className={`p-2.5 font-mono ${rateCls(r.cancelRate, true)}`}>{r.orders ? `${r.cancelRate}%` : '—'}</td>
                <td className={`p-2.5 font-mono ${rateCls(r.returnRate, true)}`}>{r.orders ? `${r.returnRate}%` : '—'}</td>
                <td className="p-2.5 font-mono">{fmt(r.aov)}</td>
                <td className="p-2.5 whitespace-nowrap">{lastTxt(r.last)}</td>
                <td className="p-2.5 font-mono">{fmt(r.wallet, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
