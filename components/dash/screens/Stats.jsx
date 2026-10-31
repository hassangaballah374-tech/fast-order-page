'use client';
import React, { useMemo } from 'react';
import { useDash, PageHead, Stat, Empty } from '../ui';
import TodayPanel from '../TodayPanel';
import { useTable } from '../hooks';
import { Spark, Area, Bars, HBars, Funnel, fmtN } from '../charts';
import { useOrders, useRange, RangeBar, inRange, rangeDays, dayLabel, bucketByDay, isLive, orderProfit } from '../shared';
import { money, dayKey } from '../../../lib/storeKit';

const sum = (a) => a.reduce((x, y) => x + y, 0);
const pct = (a, b) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);

export function StatsScreen() {
  const { cfg, go, cur } = useDash();
  const r = useRange('30');
  const orders = useOrders();
  const daily = useTable('store_daily_stats', { order: 'day', asc: true, limit: 500 });
  const aband = useTable('abandoned_carts', { order: 'created_at', limit: 3000 });
  const spend = useTable('store_ad_spend', { order: 'spend_date', limit: 3000 });
  const products = useTable('products', { order: 'created_at', limit: 3000 });
  const zones = useTable('store_shipping_zones', { order: 'governorate', limit: 50 });
  const pixels = useTable('store_pixels', { order: 'created_at', asc: true, limit: 20 });

  const loading = orders.loading || daily.loading;
  const err = orders.err || daily.err;

  const d = useMemo(() => {
    const days = rangeDays(r);
    const labels = days.map(dayLabel);
    const fromKey = r.from ? dayKey(r.from) : '';
    const inOrders = orders.rows.filter((o) => inRange(o.created_at, r.from));
    const live = inOrders.filter(isLive);
    const dmap = {};
    daily.rows.forEach((x) => { if (!fromKey || String(x.day) >= fromKey) dmap[String(x.day).slice(0, 10)] = x; });
    const ser = (k) => days.map((x) => Number(dmap[dayKey(x)]?.[k]) || 0);

    const salesS = bucketByDay(live, days, (o) => o.created_at, (o) => Number(o.total_price) || 0);
    const countS = bucketByDay(live, days, (o) => o.created_at, () => 1);
    const aovS = salesS.map((s, i) => (countS[i] ? Math.round(s / countS[i]) : 0));
    const visitsS = ser('visits');
    const cartsS = ser('carts');
    const checkoutsS = ser('checkouts');
    const crossS = ser('cross_adds');

    const sales = sum(salesS);
    const count = live.length;
    const buyers = new Set(live.map((o) => String(o.customer_phone || o.id))).size;
    const visits = sum(visitsS);
    const carts = sum(cartsS);
    const checkouts = sum(checkoutsS);
    const cross = sum(crossS);
    const lost = aband.rows.filter((a) => !a.recovered && inRange(a.created_at, r.from)).length;
    const adSpend = sum(spend.rows.filter((s) => !fromKey || String(s.spend_date) >= fromKey).map((s) => Number(s.amount) || 0));
    const courier = Number(cfg.shipping.courier_cost) || 0;
    const profit = sum(inOrders.map((o) => orderProfit(o, courier))) - adSpend;
    const pendingNow = orders.rows.filter((o) => (o.status || 'pending') === 'pending').length;

    const prodMap = {};
    live.forEach((o) => (Array.isArray(o.items) ? o.items : []).forEach((i) => {
      const k = i.title || 'منتج';
      prodMap[k] = (prodMap[k] || 0) + (Number(i.qty) || 1);
    }));
    const top = Object.entries(prodMap).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6);

    const govMap = {};
    live.forEach((o) => { if (o.governorate) govMap[o.governorate] = (govMap[o.governorate] || 0) + 1; });
    const topGov = Object.entries(govMap).sort((a, b) => b[1] - a[1])[0];
    const srcMap = {};
    live.forEach((o) => { const s = o.utm?.source; if (s) srcMap[s] = (srcMap[s] || 0) + 1; });
    const topSrc = Object.entries(srcMap).sort((a, b) => b[1] - a[1])[0];
    const risky = orders.rows.filter((o) => (o.status || 'pending') === 'pending' && Number(o.risk_score) >= 40).length;

    return { labels, salesS, countS, aovS, visitsS, cartsS, checkoutsS, crossS, sales, count, buyers, visits, carts, checkouts, cross, lost, profit, pendingNow, top, topGov, topSrc, risky, aov: count ? sales / count : 0 };
  }, [orders.rows, daily.rows, aband.rows, spend.rows, r.key, r.from, cfg.shipping.courier_cost]);

  const low = products.rows.filter((p) => p.track_stock !== false && (Number(p.stock_quantity) || 0) <= 5 && p.status !== 'archived').slice(0, 6);
  const steps = [
    ['أضف أول منتج', products.rows.length > 0, 'products'],
    ['حدّد أسعار الشحن للمحافظات', zones.rows.length > 0, 'shipping'],
    ['اربط بكسل الإعلانات', pixels.rows.length > 0, 'pixels'],
    ['خصّص هوية المتجر (اللوجو واللون)', !!cfg.brand.logo, 'themes'],
    ['استقبل أول طلب', orders.rows.length > 0, 'orders'],
  ];
  const done = steps.filter((s) => s[1]).length;

  const K = ({ label, value, spark, color, hint }) => (
    <Stat label={label} value={loading ? '-' : value} color={color} hint={hint}>
      {spark && <div className="spark"><Spark data={spark} color={color || 'var(--b)'} /></div>}
    </Stat>
  );

  return (
    <>
      <PageHead title="لوحة الإحصائيات" sub="أرقامك الحقيقية من متجرك"><RangeBar r={r} /></PageHead>
      {!loading && <TodayPanel orders={orders.rows} aband={aband.rows} products={products.rows} go={go} cur={cur} />}
      {err && <div className="card errbox">⚠️ {err}<br /><small>شغّل ملف spike_store_all.sql في Supabase ثم أعد تحميل الصفحة.</small></div>}

      {done < steps.length && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3>🚀 ابدأ من هنا <small>{done} من {steps.length}</small></h3>
          <div className="bar" style={{ marginBottom: 12 }}><i style={{ width: `${(done / steps.length) * 100}%` }} /></div>
          <div className="chips">
            {steps.map(([t, ok, to]) => (
              <button key={t} type="button" className={'chip' + (ok ? '' : ' act')} onClick={() => go(to)}>{ok ? '✓ ' : ''}{t}</button>
            ))}
          </div>
        </div>
      )}

        <div className="grid3 kpis">
        <K label="زيارات" value={`${fmtN(d.visits)} زيارة`} spark={d.visitsS} />
        <K label="الطلبات" value={`${fmtN(d.count)} طلب`} spark={d.countS} />
        <K label="متوسط سعر الطلب" value={money(d.aov, cur)} spark={d.aovS} />
        <K label="مرات إضافة للسلة" value={fmtN(d.carts)} spark={d.cartsS} />
        <K label="مرات بدء الشراء" value={fmtN(d.checkouts)} spark={d.checkoutsS} />
        <K label="شراء" value={`${fmtN(d.buyers)} مشتري`} color="#2f855a" hint="عدد العملاء اللي اشتروا فعلاً" />
        <K label="إضافة كروس سيل" value={fmtN(d.cross)} spark={d.crossS} />
        <K label="معدل التحويل" value={`${pct(d.count, d.visits)}%`} hint="الطلبات ÷ الزيارات" />
        <K label="طلبات جديدة" value={`${fmtN(d.pendingNow)} طلب`} color="#b7791f" hint="بانتظار التأكيد" />
        <K label="الطلبات المفقودة" value={`${fmtN(d.lost)} طلب`} color="#c53030" hint="سلات لم تكتمل" />
        <K label="المعدل بالمفقودة" value={`${pct(d.lost, d.count + d.lost)}%`} hint="المفقودة ÷ (الطلبات + المفقودة)" />
        <K label="إجمالي المبيعات" value={money(d.sales, cur)} color="var(--b)" spark={d.salesS} />
        <K label="صافي الربح" value={money(d.profit, cur)} color={d.profit >= 0 ? '#2f855a' : '#c53030'} hint="بعد التكلفة والشحن والإعلانات" />
      </div>

      <div className="grid3">
        <div className="card"><h3>إجمالي الطلبات</h3>{d.count ? <Bars labels={d.labels} values={d.countS} height={190} /> : <Empty icon="🗂️" t="لا توجد بيانات لعرضها" />}</div>
        <div className="card"><h3>متوسط سعر الطلب</h3>{d.count ? <Area labels={d.labels} values={d.aovS} height={190} unit={cur} /> : <Empty icon="🗂️" t="لا توجد بيانات لعرضها" />}</div>
        <div className="card"><h3>إجمالي المبيعات</h3>{d.count ? <Area labels={d.labels} values={d.salesS} height={190} unit={cur} /> : <Empty icon="🗂️" t="لا توجد بيانات لعرضها" />}</div>
      </div>

      <div className="grid3">
        <div className="card"><h3>إجمالي الزيارات</h3>{d.visits ? <Bars labels={d.labels} values={d.visitsS} height={190} /> : <Empty icon="🗂️" t="لا توجد بيانات لعرضها" />}</div>
        <div className="card"><h3>إجمالي بدء الشراء</h3>{d.checkouts ? <Bars labels={d.labels} values={d.checkoutsS} height={190} /> : <Empty icon="🗂️" t="لا توجد بيانات لعرضها" />}</div>
        <div className="card">
          <h3>أوشك على النفاذ <button type="button" className="btn sm" style={{ float: 'left' }} onClick={() => go('inventory')}>عرض الكل</button></h3>
          {low.length === 0 ? <Empty icon="✅" t="مخزونك بخير" /> : (
            <table className="tbl" style={{ minWidth: 0 }}>
              <thead><tr><th>المنتج</th><th>المتاح</th></tr></thead>
              <tbody>{low.map((p) => <tr key={p.id}><td>{p.title}</td><td className="num"><b className={Number(p.stock_quantity) <= 0 ? 'warn' : ''}>{Number(p.stock_quantity) || 0}</b></td></tr>)}</tbody>
            </table>
          )}
        </div>
      </div>

      <div className="grid2">
        <div className="card"><h3>المنتجات الأكثر مبيعاً</h3><HBars items={d.top} unit="قطعة" empty="لا توجد مبيعات بعد" /></div>
        <div className="card">
          <h3>معدلات التحويل</h3>
          <Funnel steps={[
            { label: 'زيارات', value: d.visits },
            { label: 'إضافة للسلة', value: d.carts },
            { label: 'بدء الشراء', value: d.checkouts, color: '#e08f4f' },
            { label: 'شراء', value: d.buyers, color: '#2f855a' },
          ]} />
          <div className="pls" style={{ marginTop: 10 }}><p>معدل التحويل</p><b className="num">{pct(d.count, d.visits)}%</b></div>
          <div className="pls"><p>معدل الضغط على الشراء</p><b className="num">{pct(d.checkouts, d.visits)}%</b></div>
          <div className="pls"><p>معدل إضافة كروس سيل</p><b className="num">{pct(d.cross, d.count)}%</b></div>
        </div>
      </div>

      <div className="card">
        <h3>✦ رؤى سريعة من سبايك</h3>
        <div className="grid4" style={{ marginBottom: 0 }}>
          <div><small className="mut">أفضل محافظة</small><br /><b>{d.topGov ? `${d.topGov[0]} (${d.topGov[1]} طلب)` : '—'}</b></div>
          <div><small className="mut">أفضل مصدر زيارات</small><br /><b>{d.topSrc ? `${d.topSrc[0]} (${d.topSrc[1]} طلب)` : '—'}</b></div>
          <div><small className="mut">طلبات جديدة مشبوهة</small><br /><b className={d.risky ? 'warn' : ''}>{d.risky}</b>{d.risky > 0 && <button type="button" className="btn sm" style={{ marginInlineStart: 8 }} onClick={() => go('verify')}>راجعها</button>}</div>
          <div><small className="mut">سلات يمكن استرجاعها</small><br /><b>{aband.rows.filter((a) => !a.recovered).length}</b><button type="button" className="btn sm" style={{ marginInlineStart: 8 }} onClick={() => go('abandoned')}>تواصل</button></div>
        </div>
      </div>
    </>
  );
}
