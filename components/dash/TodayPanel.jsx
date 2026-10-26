'use client';
import React, { useMemo } from 'react';
import { money } from '../../lib/storeKit';

const live = (o) => !['cancelled', 'returned'].includes(o.status || 'pending');
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const hourLabel = (h) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'ص' : 'م'}`;

/* مركز القيادة: ملخص اليوم + ما يحتاج تصرفك الآن. يقرأ من البيانات المحمّلة فعلاً في شاشة الإحصائيات */
export default function TodayPanel({ orders, aband, products, go, cur, name }) {
  const d = useMemo(() => {
    const now = new Date();
    const y = new Date(now); y.setDate(now.getDate() - 1);
    const since30 = new Date(now); since30.setDate(now.getDate() - 30);
    let tSales = 0; let tCount = 0; let ySales = 0; let yCount = 0;
    const hours = new Array(24).fill(0);
    let pending = 0; let risky = 0;
    orders.forEach((o) => {
      const dt = o.created_at ? new Date(o.created_at) : null;
      if ((o.status || 'pending') === 'pending') { pending += 1; if (Number(o.risk_score) >= 40) risky += 1; }
      if (!dt || !live(o)) return;
      const v = Number(o.total_price) || 0;
      if (sameDay(dt, now)) { tSales += v; tCount += 1; }
      else if (sameDay(dt, y)) { ySales += v; yCount += 1; }
      if (dt >= since30) hours[dt.getHours()] += 1;
    });
    const peak = hours.indexOf(Math.max(...hours));
    const hasPeak = hours[peak] > 2;
    const delta = ySales > 0 ? Math.round(((tSales - ySales) / ySales) * 100) : null;
    const low = products.filter((p) => p.track_stock !== false && p.status !== 'archived' && (Number(p.stock_quantity) || 0) <= 5).length;
    const lost = aband.filter((a) => !a.recovered).length;
    return { tSales, tCount, ySales, yCount, delta, pending, risky, low, lost, peak, hasPeak, hours };
  }, [orders, aband, products]);

  const h = new Date().getHours();
  const hello = h < 5 ? 'سهران معانا' : h < 12 ? 'صباح الخير' : h < 18 ? 'مساء النور' : 'مساء الخير';
  const max = Math.max(1, ...d.hours);
  const actions = [
    d.pending > 0 && { ic: '⏳', t: `${d.pending} طلب ينتظر التأكيد`, to: 'confirm', tone: 'warn' },
    d.risky > 0 && { ic: '🚩', t: `${d.risky} طلب مشبوه راجعه أولاً`, to: 'orders', tone: 'bad' },
    d.low > 0 && { ic: '📉', t: `${d.low} منتج مخزونه قارب على النفاذ`, to: 'inventory', tone: 'warn' },
    d.lost > 0 && { ic: '🛒', t: `${d.lost} سلة يمكن استرجاعها`, to: 'abandoned', tone: 'ok' },
  ].filter(Boolean);

  return (
    <div className="tdp">
      <style>{`
        .tdp{position:relative;overflow:hidden;border-radius:24px;padding:22px;margin-bottom:16px;color:#fff;background:linear-gradient(135deg,#06494e 0%,#0a7f86 55%,#13a3a0 100%);box-shadow:0 22px 44px -22px rgba(6,73,78,.65)}
        .tdp::before{content:'';position:absolute;inset:auto auto -90px -70px;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.22),transparent 65%)}
        .tdp-top{position:relative;display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;align-items:flex-end}
        .tdp h2{margin:0;font-size:20px;font-weight:900}
        .tdp-sub{opacity:.85;font-size:13px;margin-top:3px}
        .tdp-big{font-size:34px;font-weight:900;letter-spacing:-.5px;line-height:1.1}
        .tdp-dl{display:inline-block;margin-inline-start:8px;font-size:12px;font-weight:800;padding:3px 10px;border-radius:999px;background:rgba(255,255,255,.18)}
        .tdp-dl.up{background:#22c55e;color:#052e14}.tdp-dl.dn{background:#fecaca;color:#7f1d1d}
        .tdp-row{position:relative;display:grid;grid-template-columns:1fr;gap:14px;margin-top:16px}
        @media(min-width:860px){.tdp-row{grid-template-columns:1.1fr 1fr}}
        .tdp-act{display:flex;flex-direction:column;gap:8px}
        .tdp-a{display:flex;align-items:center;gap:10px;width:100%;text-align:start;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.12);color:#fff;border-radius:14px;padding:10px 12px;font:inherit;font-weight:700;font-size:13px;cursor:pointer;transition:transform .2s,background .2s;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
        .tdp-a:hover{background:rgba(255,255,255,.2);transform:translateX(-3px)}
        .tdp-a i{font-style:normal;font-size:18px}.tdp-a span{flex:1}.tdp-a em{font-style:normal;opacity:.75;font-size:12px}
        .tdp-ok{background:rgba(255,255,255,.12);border-radius:14px;padding:14px;font-weight:700;font-size:13px}
        .tdp-h{background:rgba(0,0,0,.16);border-radius:14px;padding:12px 14px}
        .tdp-h small{opacity:.85;font-size:12px}
        .tdp-bars{display:flex;align-items:flex-end;gap:3px;height:54px;margin-top:8px}
        .tdp-bars b{flex:1;border-radius:3px 3px 0 0;background:rgba(255,255,255,.35);min-height:3px}
        .tdp-bars b.pk{background:#fde68a}
        @media(prefers-reduced-motion:reduce){.tdp-a{transition:none}}
      `}</style>
      <div className="tdp-top">
        <div>
          <h2>{hello}{name ? `، ${name}` : ''} 👋</h2>
          <div className="tdp-sub">مبيعات اليوم حتى الآن</div>
          <div className="tdp-big num">{money(d.tSales, cur)}
            {d.delta !== null && <span className={'tdp-dl ' + (d.delta >= 0 ? 'up' : 'dn')}>{d.delta >= 0 ? '▲' : '▼'} {Math.abs(d.delta)}% عن أمس</span>}
          </div>
        </div>
        <div style={{ textAlign: 'end' }}>
          <div className="tdp-big num" style={{ fontSize: 28 }}>{d.tCount}</div>
          <div className="tdp-sub">طلب اليوم · أمس {d.yCount}</div>
        </div>
      </div>
      <div className="tdp-row">
        <div className="tdp-act">
          {actions.length === 0 ? <div className="tdp-ok">✅ مفيش حاجة معلّقة. كل حاجة تحت السيطرة.</div> : actions.map((a) => (
            <button key={a.to + a.t} type="button" className="tdp-a" onClick={() => go(a.to)}><i>{a.ic}</i><span>{a.t}</span><em>افتح ←</em></button>
          ))}
        </div>
        <div className="tdp-h">
          <small>{d.hasPeak ? `🔥 أكتر وقت بيجيلك فيه طلبات: حوالي ${hourLabel(d.peak)} (آخر 30 يوم)` : 'هنوريك أكتر ساعات الطلب لما يتجمع بيانات كفاية'}</small>
          <div className="tdp-bars" aria-hidden="true">
            {d.hours.map((v, i) => <b key={i} className={d.hasPeak && i === d.peak ? 'pk' : ''} style={{ height: `${Math.max(6, (v / max) * 100)}%` }} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
