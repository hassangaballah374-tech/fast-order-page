'use client';
import React, { useMemo, useState } from 'react';
import { useDash, Badge } from './ui';
import { useTable } from './hooks';
import { supabase } from '../../lib/supabase'; 
import { STATUS, waLink, fillTemplate, money, dayKey } from '../../lib/storeKit';

/* ---------- نطاق التاريخ ---------- */
export const RANGES = [['today', 'اليوم', 1], ['7', 'آخر 7 أيام', 7], ['30', 'آخر 30 يوم', 30], ['90', 'آخر 90 يوم', 90], ['all', 'الكل', 0]];

const parseD = (v) => { if (!/^\d{4}-\d{2}-\d{2}$/.test(String(v || ''))) return null; const [y, m, d] = v.split('-').map(Number); const x = new Date(y, m - 1, d); return Number.isNaN(x.getTime()) ? null : x; };

export function useRange(initial = '30') {
  const [key, setKey] = useState(initial);
  const [cFrom, setCFrom] = useState('');
  const [cTo, setCTo] = useState('');
  const days0 = (RANGES.find((r) => r[0] === key) || RANGES[2])[2];
  const custom = key === 'custom';
  const cf = parseD(cFrom);
  const ct = parseD(cTo);
  const valid = custom && cf && ct && cf <= ct;
  const from = useMemo(() => {
    if (custom && valid) return cf;
    if (!days0) return null;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (days0 - 1));
    return d;
  }, [days0, custom, valid, cFrom]);
  const to = useMemo(() => {
    if (!valid) return null;
    const d = new Date(ct);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [valid, cTo]);
  const days = valid ? Math.min(366, Math.round((ct - cf) / 86400000) + 1) : days0;
  return { key, setKey, days, from, to, custom, cFrom, cTo, setCFrom, setCTo, valid };
}

export function RangeBar({ r, custom = false }) {
  return (
    <div className="chips" style={{ alignItems: 'center' }}>
      {RANGES.map(([k, t]) => <button key={k} type="button" className={'chip' + (r.key === k ? ' act' : '')} onClick={() => r.setKey(k)}>{t}</button>)}
      {custom && <button type="button" className={'chip' + (r.key === 'custom' ? ' act' : '')} onClick={() => r.setKey('custom')}>📅 تاريخ محدد</button>}
      {custom && r.key === 'custom' && (
        <>
          <input type="date" className="in" style={{ width: 'auto' }} value={r.cFrom} max={r.cTo || undefined} onChange={(e) => r.setCFrom(e.target.value)} aria-label="من تاريخ" />
          <span className="mut">إلى</span>
          <input type="date" className="in" style={{ width: 'auto' }} value={r.cTo} min={r.cFrom || undefined} onChange={(e) => r.setCTo(e.target.value)} aria-label="إلى تاريخ" />
        </>
      )}
    </div>
  );
}

export const inRange = (d, from, to) => !from ? (!to || (d && new Date(d) <= to)) : (d && new Date(d) >= from && (!to || new Date(d) <= to));

/* أيام النطاق كمصفوفة (للرسوم). لو "الكل" نعرض آخر 60 يوم */
export function rangeDays(r) {
  const n = r.days || 60;
  return Array.from({ length: n }, (_, i) => {
    const d = r.to ? new Date(r.to) : new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (n - 1 - i));
    return d;
  });
}
export const dayLabel = (d) => `${d.getDate()}/${d.getMonth() + 1}`;

/* تجميع قيمة لكل يوم */
export function bucketByDay(rows, days, getDate, getVal) {
  const m = {};
  rows.forEach((r) => {
    const d = getDate(r);
    if (!d) return;
    const k = dayKey(d);
    m[k] = (m[k] || 0) + getVal(r);
  });
  return days.map((d) => m[dayKey(d)] || 0);
}

/* ---------- الطلبات ---------- */
export const isLive = (o) => !['cancelled', 'returned'].includes(o.status || 'pending');

export function StatusBadge({ s }) {
  const st = STATUS[s || 'pending'] || STATUS.pending;
  return <Badge c={st.color}>{st.ar}</Badge>;
}

/* ربح الطلب: الإجمالي - التكلفة - تكلفة الشحن. المرتجع يخسر تكلفة الشحن فقط. */
export function orderProfit(o, courierCost = 0) {
  const ship = o.courier_fee !== null && o.courier_fee !== undefined ? Number(o.courier_fee) || 0 : Number(courierCost) || 0;
  if (o.status === 'cancelled') return 0;
  if (o.status === 'returned') return -ship;
  return (Number(o.total_price) || 0) - (Number(o.cost_total) || 0) - ship;
}

export function useOrders(limit = 5000) {
  return useTable('orders', { order: 'created_at', asc: false, limit });
}

export const FLAG_LABEL = {
  fast_submit: 'تعبئة سريعة جداً (بوت محتمل)',
  high_value: 'قيمة طلب مرتفعة',
  weird_name: 'اسم غير معتاد',
  short_address: 'عنوان قصير',
  repeat_today: 'طلب متكرر اليوم',
  returns_history: 'سجل مرتجعات/إلغاءات',
  needs_verify: 'يحتاج توثيق',
  duplicate_hold: 'طلب مكرر خلال فترة المنع: معلّق لحين موافقتك (غيّر الحالة إلى «مؤكد»)',
  otp_blocked: 'رقم في قائمة OTP المحظورة',
};

export function RiskBadge({ score }) {
  const s = Number(score) || 0;
  if (s <= 0) return <span className="mut">—</span>;
  const c = s >= 60 ? '#c53030' : s >= 30 ? '#b7791f' : '#2f855a';
  return <Badge c={c}>{s}%</Badge>;
}

/* ---------- واتساب ---------- */
export function useWa() {
  const { cfg, store, storeUrl, uid, say } = useDash();
  const vars = (o = {}) => ({
    store: store?.store_name || '', link: storeUrl, name: String(o.name || '').split(' ')[0] || 'عميلنا',
    order_no: o.order_no ?? '', total: o.total !== undefined ? money(o.total, cfg.currency) : '', tracking: o.tracking || '',
    coupon_line: cfg.retarget.coupon_code ? ` واستخدم كود ${cfg.retarget.coupon_code} لخصم إضافي` : '',
  });
  const message = (tplKey, o) => fillTemplate(tplKey === 'verify' ? cfg.verify.message : (cfg.wa_templates[tplKey] ?? tplKey), vars(o));
  const url = (phone, text) => waLink(phone, text);
  const log = async (phone, template) => {
    try { await supabase.from('store_wa_log').insert([{ store_id: uid, phone, template }]); } catch { /* تجاهل */ }
  };
  return { message, url, log, vars, say };
}

/* ---------- اختيار منتج ---------- */
export function ProductSelect({ products, value, onChange, placeholder = 'اختر منتجاً', exclude = [] }) {
  return (
    <select className="in" value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {products.filter((p) => !exclude.includes(String(p.id))).map((p) => <option key={p.id} value={String(p.id)}>{p.title}</option>)}
    </select>
  );
}

export function downloadCsvFile(name, text) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export const fdate = (d) => (d ? new Date(d).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : '');
export const fday = (d) => (d ? new Date(d).toLocaleDateString('ar-EG', { dateStyle: 'medium' }) : '');
export const mkMoney = (cur) => (n) => money(n, cur);
