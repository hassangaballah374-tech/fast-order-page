'use client';
import React, { useMemo, useState } from 'react';
import { useDash, PageHead, Stat, Empty } from '../ui';
import { useTable } from '../hooks';
import { Spark, Area, Bars, Funnel, fmtN } from '../charts';
import { useOrders, useRange, RangeBar, inRange, rangeDays, dayLabel, bucketByDay, isLive } from '../shared';
import { money, dayKey } from '../../../lib/storeKit';
import PurgeStats from '../PurgeStats';

const sum = (a) => a.reduce((x, y) => x + y, 0);
const pct = (a, b) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);

/* إحصائيات منتج واحد: زي لوحة المتجر بس للمنتج المختار */
export function ProductStatsScreen() {
  const { cur, uid } = useDash();
  const r = useRange('30');
  const products = useTable('products', { order: 'created_at', limit: 3000 });
  const stats = useTable('store_product_stats', { order: 'day', asc: true, limit: 5000 });
  const orders = useOrders();
  const [pid, setPid] = useState('');
  const sel = pid || (products.rows[0] ? String(products.rows[0].id) : '');
  const prod = products.rows.find((p) => String(p.id) === sel);
  const loading = products.loading || stats.loading || orders.loading;

  const d = useMemo(() => {
    const days = rangeDays(r);
    const labels = days.map(dayLabel);
    const fromKey = r.from ? dayKey(r.from) : '';
    const toKey = r.to ? dayKey(r.to) : '';
    const dmap = {};
    stats.rows.forEach((x) => {
      if (String(x.product_id) !== sel) return;
      const k = String(x.day).slice(0, 10);
      if ((fromKey && k < fromKey) || (toKey && k > toKey)) return;
      dmap[k] = x;
    });
    const ser = (k) => days.map((x) => Number(dmap[dayKey(x)]?.[k]) || 0);
    const lines = [];
    orders.rows.filter((o) => isLive(o) && inRange(o.created_at, r.from, r.to)).forEach((o) => {
      (Array.isArray(o.items) ? o.items : []).forEach((i) => {
        if (String(i.product_id) === sel) lines.push({ at: o.created_at, phone: String(o.customer_phone || o.id), qty: Number(i.qty) || 1, total: Number(i.line_total ?? (Number(i.price) || 0) * (Number(i.qty) || 1)) });
      });
    });
    const viewsS = ser('views'); const cartsS = ser('carts'); const checkoutsS = ser('checkouts'); const trackedBuys = sum(ser('purchases'));
    const buyS = bucketByDay(lines, days, (l) => l.at, () => 1);
    const revS = bucketByDay(lines, days, (l) => l.at, (l) => l.total);
    const views = sum(viewsS); const carts = sum(cartsS); const checkouts = sum(checkoutsS);
    const buyers = new Set(lines.map((l) => l.phone)).size;
    const units = sum(lines.map((l) => l.qty));
    const rev = sum(revS);
    return { labels, viewsS, cartsS, checkoutsS, buyS, revS, views, carts, checkouts, buyers, trackedBuys, orders: lines.length, units, rev };
  }, [stats.rows, orders.rows, sel, r.key, r.from, r.to]);

  const K = ({ label, value, spark, color, hint }) => (
    <Stat label={label} value={loading ? '-' : value} color={color} hint={hint}>
      {spark && <div className="spark"><Spark data={spark} color={color || 'var(--b)'} /></div>}
    </Stat>
  );

  if (!loading && !products.rows.length) return <><PageHead title="إحصائيات المنتج" sub="أضف منتج الأول" /><Empty icon="🏷️" t="لا توجد منتجات بعد" /></>;

  return (
    <>
      <PageHead title="إحصائيات المنتج" sub="نفس أرقام المتجر لكن لمنتج واحد"><RangeBar r={r} custom /></PageHead>
      {stats.err && <div className="card errbox">⚠️ {stats.err}<br /><small>شغّل ملف sql/product_stats.sql في Supabase ثم أعد تحميل الصفحة.</small></div>}
      <div className="card" style={{ marginBottom: 16 }}>
        <select className="in" value={sel} onChange={(e) => setPid(e.target.value)}>
          {products.rows.map((p) => <option key={p.id} value={String(p.id)}>{p.title}</option>)}
        </select>
        {prod && <small className="mut" style={{ display: 'block', marginTop: 6 }}>السعر: {money(Number(prod.price) || 0, cur)}</small>}
      </div>

      <PurgeStats uid={uid} table="store_product_stats" match={sel ? { product_id: sel } : null} label={`إحصائيات «${prod?.title || 'المنتج'}»`} onDone={stats.reload} />

      <div className="grid3 kpis">
        <K label="مشاهدات المنتج" value={`${fmtN(d.views)} مشاهدة`} spark={d.viewsS} />
        <K label="مرات إضافة للسلة" value={fmtN(d.carts)} spark={d.cartsS} />
        <K label="مرات بدء الشراء" value={fmtN(d.checkouts)} spark={d.checkoutsS} />
        <K label="شراء" value={`${fmtN(d.buyers)} مشتري`} color="#2f855a" spark={d.buyS} hint="عدد العملاء اللي اشتروا المنتج" />
        <K label="القطع المباعة" value={fmtN(d.units)} />
        <K label="إيراد المنتج" value={money(d.rev, cur)} color="var(--b)" spark={d.revS} />
        <K label="معدل التحويل" value={`${Math.min(100, pct(d.trackedBuys, d.views))}%`} hint="مشتريات متسجلة ÷ المشاهدات (من بداية التتبع)" />
        <K label="من السلة للشراء" value={`${Math.min(100, pct(d.trackedBuys, d.carts))}%`} hint="من بداية التتبع" />
      </div>

      <div className="grid2">
        <div className="card"><h3>المشاهدات</h3>{d.views ? <Bars labels={d.labels} values={d.viewsS} height={190} /> : <Empty icon="🗂️" t="لا توجد بيانات لعرضها" />}</div>
        <div className="card"><h3>إيراد المنتج</h3>{d.rev ? <Area labels={d.labels} values={d.revS} height={190} unit={cur} /> : <Empty icon="🗂️" t="لا توجد بيانات لعرضها" />}</div>
      </div>

      <div className="card">
        <h3>معدلات التحويل</h3>
        <Funnel steps={[
          { label: 'مشاهدات', value: d.views },
          { label: 'إضافة للسلة', value: d.carts },
          { label: 'بدء الشراء', value: d.checkouts, color: '#e08f4f' },
          { label: 'شراء', value: d.buyers, color: '#2f855a' },
        ]} />
      </div>
    </>
  );
}
