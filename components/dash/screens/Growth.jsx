'use client';
import React, { useMemo, useState } from 'react';
import { useDash, PageHead, Empty, Spin, Badge, Stat, Tabs } from '../ui';
import { useTable, useProducts } from '../hooks';
import { Crud } from '../forms';
import { LinkBox } from '../bits';
import { useOrders, useRange, RangeBar, inRange, orderProfit, isLive, rangeDays, dayLabel, bucketByDay, ProductSelect, downloadCsvFile, fday } from '../shared';
import { Area, HBars, fmtN } from '../charts';
import { money, slugify, safeUrl, youtubeId, toCSV, dayKey, PLATFORM_LABEL, COUNTED_STATUSES } from '../../../lib/storeKit';

const counted = (o) => COUNTED_STATUSES.includes(o.status || 'pending');
const platformOf = (src) => {
  const s = String(src || '').toLowerCase();
  if (/^(fb|facebook|meta|ig|instagram)/.test(s)) return 'facebook';
  if (/tiktok|^tt$/.test(s)) return 'tiktok';
  if (/snap/.test(s)) return 'snapchat';
  if (/google|^gads|youtube/.test(s)) return 'google';
  return 'other';
};

/* ====================== Funnels ====================== */
export function FunnelsScreen() {
  const { storeUrl, cur } = useDash();
  const prods = useProducts();
  return (
    <Crud
      table="store_funnels" noun="Funnel" title="Funnels" order="created_at" toggleKey="enabled"
      desc="صفحة هبوط مخصصة لمنتج واحد بعنوان قوي وفيديو وعدّاد ونموذج طلب، تصلح كوجهة للإعلانات. الرابط: متجرك/f/اسم-الصفحة"
      search={(r) => `${r.name} ${r.slug}`}
      defaults={{ enabled: true, countdown_minutes: 0, bullets: [] }}
      columns={[
        { l: 'الصفحة', render: (r) => <b>{r.name}</b> },
        { l: 'المنتج', render: (r) => (prods.byId[String(r.product_id)] || {}).title || <span className="warn">غير محدد</span> },
        { l: 'الرابط', render: (r) => <a className="num" dir="ltr" target="_blank" rel="noreferrer" href={`${storeUrl}/f/${r.slug}`}>/f/{r.slug}</a> },
        { l: 'المشاهدات', render: (r) => <span className="num">{fmtN(r.views || 0)}</span> },
      ]}
      fields={[
        { k: 'name', l: 'اسم داخلي' },
        { k: 'slug', l: 'رابط الصفحة', type: 'ltr', ph: 'offer-1', hint: 'اتركه فارغاً ليُنشأ من الاسم' },
        { k: 'product_id', l: 'المنتج', type: 'custom' },
        { k: 'headline', l: 'العنوان الرئيسي', full: true },
        { k: 'subheadline', l: 'عنوان فرعي', full: true },
        { k: 'bullets', l: 'نقاط البيع (سطر لكل نقطة)', type: 'lines', rows: 5 },
        { k: 'video_url', l: 'فيديو يوتيوب (اختياري)', type: 'ltr', full: true },
        { k: 'countdown_minutes', l: 'عدّاد تنازلي بالدقائق (0 = بدون)', type: 'number', min: 0, max: 1440 },
        { k: 'cta_text', l: 'نص زر الطلب' },
      ].map((f) => (f.type === 'custom' ? { ...f, type: 'select', options: [['', `— اختر المنتج —`], ...prods.rows.map((p) => [String(p.id), `${p.title} (${money(p.price, cur)})`])] } : f))}
      validate={(e) => {
        if (String(e.name || '').trim().length < 2) return 'اكتب اسماً للصفحة';
        if (!e.product_id) return 'اختر المنتج';
        if (!slugify(e.slug || e.name)) return 'اكتب رابطاً صالحاً';
        if (e.video_url && !youtubeId(e.video_url)) return 'رابط يوتيوب غير صحيح';
        if (!String(e.headline || '').trim()) return 'اكتب العنوان الرئيسي';
        return '';
      }}
      transform={(e) => ({
        ...e, name: String(e.name).trim(), slug: slugify(e.slug || e.name), product_id: String(e.product_id),
        bullets: (Array.isArray(e.bullets) ? e.bullets : String(e.bullets || '').split('\n')).map((x) => String(x).trim()).filter(Boolean).slice(0, 10),
        countdown_minutes: Math.max(0, Math.floor(Number(e.countdown_minutes) || 0)), video_url: e.video_url || null,
      })}
    />
  );
}

/* ====================== تتبع نتائج الحملات ====================== */
function SpendTab() {
  const { cur } = useDash();
  return (
    <Crud
      table="store_ad_spend" noun="مصروف" title="مصروفات الإعلانات" order="spend_date"
      desc="سجّل ما أنفقته على الإعلانات يومياً ليحسب سبايك العائد (ROAS) وتكلفة الطلب (CPA) وصافي الربح."
      defaults={{ platform: 'facebook', spend_date: new Date().toISOString().slice(0, 10), amount: '' }}
      columns={[
        { l: 'التاريخ', render: (r) => fday(r.spend_date) },
        { l: 'المنصة', render: (r) => PLATFORM_LABEL[r.platform] || r.platform },
        { l: 'المبلغ', render: (r) => <b className="num">{money(r.amount, cur)}</b> },
        { l: 'ملاحظة', k: 'note' },
      ]}
      fields={[
        { k: 'platform', l: 'المنصة', type: 'select', options: Object.entries(PLATFORM_LABEL) },
        { k: 'spend_date', l: 'التاريخ', type: 'date' },
        { k: 'amount', l: `المبلغ (${cur})`, type: 'number', min: 0 },
        { k: 'note', l: 'ملاحظة (اختياري، مثل اسم الحملة)', full: true },
      ]}
      validate={(e) => (!(Number(e.amount) > 0) ? 'اكتب مبلغاً أكبر من صفر' : !e.spend_date ? 'اختر التاريخ' : '')}
      transform={(e) => ({ ...e, amount: Number(e.amount), note: String(e.note || '').trim() || null })}
    />
  );
}

function ResultsTab() {
  const { cur } = useDash();
  const r = useRange('30');
  const orders = useOrders();
  const spend = useTable('store_ad_spend', { order: 'spend_date', limit: 3000 });

  const d = useMemo(() => {
    const fromKey = r.from ? dayKey(r.from) : '';
    const os = orders.rows.filter((o) => inRange(o.created_at, r.from));
    const plat = {};
    const camp = {};
    Object.keys(PLATFORM_LABEL).forEach((k) => { plat[k] = { spend: 0, orders: 0, revenue: 0, profit: 0 }; });
    spend.rows.forEach((s) => { if (!fromKey || String(s.spend_date) >= fromKey) { (plat[s.platform] || plat.other).spend += Number(s.amount) || 0; } });
    let tracked = 0;
    os.forEach((o) => {
      if (!counted(o)) return;
      const u = o.utm || {};
      const p = u.source ? platformOf(u.source) : null;
      if (p) {
        tracked += 1;
        plat[p].orders += 1; plat[p].revenue += Number(o.total_price) || 0; plat[p].profit += orderProfit(o);
        const key = `${u.source}|${u.campaign || '—'}`;
        camp[key] = camp[key] || { source: u.source, campaign: u.campaign || '—', orders: 0, revenue: 0 };
        camp[key].orders += 1; camp[key].revenue += Number(o.total_price) || 0;
      }
    });
    const total = os.filter(counted).length;
    return { plat, camp: Object.values(camp).sort((a, b) => b.revenue - a.revenue), tracked, total };
  }, [orders.rows, spend.rows, r.from]);

  const rows = Object.entries(d.plat).filter(([, v]) => v.spend || v.orders);
  const totSpend = rows.reduce((a, [, v]) => a + v.spend, 0);
  const totRev = rows.reduce((a, [, v]) => a + v.revenue, 0);
  const loading = orders.loading || spend.loading;

  return (
    <>
      <RangeBar r={r} />
      <div className="grid4" style={{ margin: '14px 0' }}>
        <Stat label="إجمالي الإنفاق" value={money(totSpend, cur)} />
        <Stat label="إيراد الحملات" value={money(totRev, cur)} hint="طلبات مؤكدة فأعلى" />
        <Stat label="ROAS" value={totSpend ? `${(totRev / totSpend).toFixed(2)}x` : '—'} color={totSpend && totRev / totSpend < 1 ? 'var(--bad)' : undefined} />
        <Stat label="طلبات منسوبة لحملات" value={`${d.tracked} / ${d.total}`} hint="الباقي بلا UTM" />
      </div>
      {loading ? <div className="c"><Spin /></div> : rows.length === 0 ? <div className="card"><Empty icon="📣" t="لا توجد بيانات حملات في هذه الفترة" d="استخدم «منشئ روابط الحملات» في إعلاناتك وسجّل المصروفات من التبويب المجاور" /></div> : (
        <div className="card tw">
          <table className="tbl">
            <thead><tr><th>المنصة</th><th>الإنفاق</th><th>الطلبات</th><th>الإيراد</th><th>ROAS</th><th>تكلفة الطلب</th><th>صافي الربح</th></tr></thead>
            <tbody>
              {rows.map(([k, v]) => {
                const net = v.profit - v.spend;
                return (
                  <tr key={k}>
                    <td><b>{PLATFORM_LABEL[k]}</b></td>
                    <td className="num">{money(v.spend, cur)}</td>
                    <td className="num">{v.orders}</td>
                    <td className="num">{money(v.revenue, cur)}</td>
                    <td className="num">{v.spend ? `${(v.revenue / v.spend).toFixed(2)}x` : '—'}</td>
                    <td className="num">{v.orders && v.spend ? money(v.spend / v.orders, cur) : '—'}</td>
                    <td className="num" style={{ color: net < 0 ? 'var(--bad)' : 'var(--ok, #16a34a)', fontWeight: 800 }}>{money(net, cur)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {d.camp.length > 0 && (
        <div className="card tw" style={{ marginTop: 16 }}>
          <h3 style={{ padding: '12px 14px 0' }}>الحملات (حسب utm_campaign)</h3>
          <table className="tbl">
            <thead><tr><th>المصدر</th><th>الحملة</th><th>الطلبات</th><th>الإيراد</th></tr></thead>
            <tbody>{d.camp.slice(0, 30).map((c) => <tr key={c.source + c.campaign}><td className="num" dir="ltr" style={{ textAlign: 'start' }}>{c.source}</td><td className="num" dir="ltr" style={{ textAlign: 'start' }}>{c.campaign}</td><td className="num">{c.orders}</td><td className="num">{money(c.revenue, cur)}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </>
  );
}

export function CampaignsScreen() {
  const [tab, setTab] = useState('res');
  return (
    <>
      <PageHead title="تتبع نتائج الحملات الإعلانية" sub="الإنفاق مقابل المبيعات الحقيقية" />
      <Tabs value={tab} onChange={setTab} tabs={[['res', 'النتائج'], ['spend', 'تسجيل المصروفات']]} />
      <div style={{ marginTop: 14 }}>{tab === 'res' ? <ResultsTab /> : <SpendTab />}</div>
    </>
  );
}

/* ====================== روابط الإحالة ====================== */
export function ReferralsScreen() {
  const { storeUrl, cur } = useDash();
  const orders = useOrders();
  const stat = useMemo(() => {
    const m = {};
    orders.rows.forEach((o) => {
      const code = o.utm?.ref;
      if (!code) return;
      const s = (m[code] = m[code] || { orders: 0, pending: 0, delivered: 0 });
      if (o.status === 'delivered') { s.delivered += Number(o.total_price) || 0; s.orders += 1; } else if (isLive(o)) { s.pending += Number(o.total_price) || 0; s.orders += 1; }
    });
    return m;
  }, [orders.rows]);

  return (
    <Crud
      table="store_referrals" noun="رابط إحالة" title="إنشاء روابط الإحالة" order="created_at" toggleKey="enabled"
      desc="رابط خاص لكل مسوّق أو مؤثر. تُحسب له الزيارات والطلبات والعمولة المستحقة عند تسليم الطلب."
      defaults={{ enabled: true, commission_percent: 10, paid_amount: 0 }}
      search={(r) => `${r.code} ${r.label} ${r.affiliate_name}`}
      columns={[
        { l: 'المسوّق', render: (r) => <><b>{r.affiliate_name || r.label || r.code}</b><small className="mut num" style={{ display: 'block' }} dir="ltr">?ref={r.code}</small></> },
        { l: 'زيارات', render: (r) => <span className="num">{fmtN(r.clicks || 0)}</span> },
        { l: 'طلبات', render: (r) => <span className="num">{(stat[r.code] || {}).orders || 0}</span> },
        { l: 'مبيعات مسلّمة', render: (r) => <span className="num">{money((stat[r.code] || {}).delivered || 0, cur)}</span> },
        { l: 'العمولة', render: (r) => <span className="num">{Number(r.commission_percent) || 0}%</span> },
        {
          l: 'المستحق', render: (r) => {
            const earned = ((stat[r.code] || {}).delivered || 0) * (Number(r.commission_percent) || 0) / 100;
            const due = Math.max(0, earned - (Number(r.paid_amount) || 0));
            return <span className="num"><b>{money(due, cur)}</b><small className="mut" style={{ display: 'block' }}>مدفوع {money(r.paid_amount || 0, cur)}</small></span>;
          },
        },
        { l: 'الرابط', render: (r) => <LinkBox url={`${storeUrl}?ref=${r.code}`} /> },
      ]}
      fields={[
        { k: 'affiliate_name', l: 'اسم المسوّق' },
        { k: 'affiliate_phone', l: 'رقم المسوّق (اختياري)', type: 'ltr' },
        { k: 'code', l: 'كود الإحالة', type: 'ltr', ph: 'ahmed', hint: 'حروف إنجليزية وأرقام وشرطة' },
        { k: 'label', l: 'وصف داخلي (اختياري)' },
        { k: 'commission_percent', l: 'نسبة العمولة %', type: 'number', min: 0, max: 90 },
        { k: 'coupon_code', l: 'كوبون خاص بالمسوّق (اختياري)', type: 'ltr', upper: true },
        { k: 'paid_amount', l: 'المبلغ المدفوع له حتى الآن', type: 'number', min: 0 },
      ]}
      validate={(e) => {
        if (!/^[a-z0-9][a-z0-9-]{1,29}$/.test(String(e.code || '').trim().toLowerCase())) return 'الكود من 2 إلى 30 حرفاً إنجليزياً صغيراً أو أرقاماً أو شرطة';
        const c = Number(e.commission_percent);
        if (!(c >= 0 && c <= 90)) return 'العمولة من 0 إلى 90%';
        return '';
      }}
      transform={(e) => ({ ...e, code: String(e.code).trim().toLowerCase(), commission_percent: Number(e.commission_percent) || 0, paid_amount: Number(e.paid_amount) || 0, coupon_code: e.coupon_code ? String(e.coupon_code).toUpperCase() : null })}
    />
  );
}

/* ====================== تقارير الربح ====================== */
export function ReportsScreen() {
  const { cur, cfg } = useDash();
  const r = useRange('30');
  const orders = useOrders();
  const spend = useTable('store_ad_spend', { order: 'spend_date', limit: 3000 });
  const prods = useProducts();
  const courier = Number(cfg.shipping?.courier_cost) || 0;

  const d = useMemo(() => {
    const days = rangeDays(r);
    const os = orders.rows.filter((o) => inRange(o.created_at, r.from) && o.status !== 'cancelled');
    const live = os.filter(counted);
    const fromKey = r.from ? dayKey(r.from) : '';
    const sp = spend.rows.filter((s) => !fromKey || String(s.spend_date) >= fromKey);
    const revenue = live.reduce((a, o) => a + (Number(o.total_price) || 0), 0);
    const grossProfit = os.filter((o) => counted(o) || o.status === 'returned').reduce((a, o) => a + orderProfit(o, courier), 0);
    const ads = sp.reduce((a, s) => a + (Number(s.amount) || 0), 0);
    const returned = os.filter((o) => o.status === 'returned').length;
    const dayProfit = bucketByDay(os.filter((o) => counted(o) || o.status === 'returned'), days, (o) => o.created_at, (o) => orderProfit(o, courier));
    const dayAds = bucketByDay(sp, days, (s) => `${s.spend_date}T12:00:00`, (s) => Number(s.amount) || 0);
    const net = dayProfit.map((v, i) => Math.round(v - dayAds[i]));
    const byProd = {};
    live.forEach((o) => (Array.isArray(o.items) ? o.items : []).forEach((i) => {
      const k = String(i.product_id);
      const p = prods.byId[k] || {};
      const row = (byProd[k] = byProd[k] || { title: i.title || p.title || k, qty: 0, revenue: 0, cost: 0 });
      const q = Number(i.qty) || 1;
      row.qty += q; row.revenue += i.line_total !== undefined ? Number(i.line_total) || 0 : (Number(i.price) || 0) * q; row.cost += (i.unit_cost !== undefined ? Number(i.unit_cost) || 0 : Number(p.cost_price) || 0) * q;
    }));
    const prodRows = Object.values(byProd).map((x) => ({ ...x, margin: x.revenue - x.cost })).sort((a, b) => b.margin - a.margin);
    return { days, revenue, grossProfit, ads, net: grossProfit - ads, returned, count: live.length, netSeries: net, prodRows };
  }, [orders.rows, spend.rows, prods.byId, r.from, courier]);

  const exportCsv = () => downloadCsvFile(`spike-profit-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(d.prodRows.map((x) => ({ ...x, margin: Math.round(x.margin) })), [['المنتج', 'title'], ['الكمية', 'qty'], ['الإيراد', 'revenue'], ['التكلفة', 'cost'], ['هامش الربح', 'margin']]));
  const loading = orders.loading || spend.loading;

  return (
    <>
      <PageHead title="تقارير الربح" sub="✦ من سبايك">
        <button type="button" className="btn" onClick={exportCsv} disabled={!d.prodRows.length}>⬇️ تصدير المنتجات CSV</button>
      </PageHead>
      <p className="mut dsc">الربح = الإيراد − تكلفة المنتجات − تكلفة الشحن − مصروف الإعلانات. أدخل «سعر التكلفة» في كل منتج وتكلفة شركة الشحن من «الشحن والتوصيل» لتكون الأرقام دقيقة.</p>
      <RangeBar r={r} />
      {loading ? <div className="c"><Spin /></div> : (
        <>
          <div className="grid4" style={{ margin: '14px 0' }}>
            <Stat label="الإيراد" value={money(d.revenue, cur)} hint={`${d.count} طلب`} />
            <Stat label="الربح قبل الإعلانات" value={money(d.grossProfit, cur)} />
            <Stat label="مصروف الإعلانات" value={money(d.ads, cur)} />
            <Stat label="صافي الربح" value={money(d.net, cur)} color={d.net < 0 ? 'var(--bad)' : 'var(--ok, #16a34a)'} hint={`${d.returned} مرتجع`} />
          </div>
          <div className="card"><h3>صافي الربح اليومي</h3><Area labels={d.days.map(dayLabel)} values={d.netSeries} unit={cur} /></div>
          <div className="card" style={{ marginTop: 16 }}>
            <h3>الأكثر ربحاً (هامش المنتج)</h3>
            <HBars items={d.prodRows.slice(0, 8).map((x) => ({ label: x.title, value: Math.max(0, Math.round(x.margin)) }))} unit={cur} />
          </div>
          {d.prodRows.length > 0 && (
            <div className="card tw" style={{ marginTop: 16 }}>
              <table className="tbl">
                <thead><tr><th>المنتج</th><th>الكمية</th><th>الإيراد</th><th>التكلفة</th><th>الهامش</th></tr></thead>
                <tbody>
                  {d.prodRows.map((x) => (
                    <tr key={x.title}>
                      <td><b>{x.title}</b>{x.cost === 0 && <small className="warn">بدون سعر تكلفة</small>}</td>
                      <td className="num">{x.qty}</td><td className="num">{money(x.revenue, cur)}</td><td className="num">{money(x.cost, cur)}</td>
                      <td className="num"><b>{money(x.margin, cur)}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
