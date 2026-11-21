'use client';
import React, { useState } from 'react';
import { useDash, PageHead } from '../ui';
import { downloadCsvFile } from '../shared';
import { toCSV } from '../../../lib/storeKit';
import { supabase } from '../../../lib/supabase';

/* نسخة احتياطية وتصدير بيانات المتجر. كل البيانات بتتسحب من حسابك أنت (صلاحيات RLS) وبتتنزّل على جهازك،
   ومفيش حاجة بتتبعت لأي طرف. مفاتيح الربط والأسرار (واتساب، الذكاء الاصطناعي، الشحن) مش بتتضمن. */
const TABLES = [
  ['orders', 'الطلبات', true], ['products', 'المنتجات', true], ['store_categories', 'الأقسام', false],
  ['store_coupons', 'الكوبونات', false], ['store_reviews', 'التقييمات', false], ['store_newsletter', 'المشتركون', true],
  ['abandoned_carts', 'الطلبات المفقودة', true], ['stock_alerts', 'طلبات التنبيه بالمخزون', true], ['store_pages', 'الصفحات', false],
  ['store_shipping_zones', 'مناطق الشحن', false], ['store_referrals', 'روابط الإحالة', false], ['store_blocklist', 'الأرقام المحظورة', false],
  ['store_wallet_tx', 'معاملات الرصيد', false], ['store_blocks', 'UI Blocks', false], ['store_flows', 'الفانلز', false],
];
const PAGE = 1000;

async function pull(table, uid) {
  const rows = [];
  for (let from = 0; from < 200000; from += PAGE) {
    const { data, error } = await supabase.from(table).select('*').eq('store_id', uid).range(from, from + PAGE - 1);
    if (error) return { rows, error: error.message };
    rows.push(...(data || []));
    if (!data || data.length < PAGE) break;
  }
  return { rows };
}
const flat = (v) => (v && typeof v === 'object' ? JSON.stringify(v) : v);
const csv = (rows) => {
  const keys = [...rows.reduce((s, r) => { Object.keys(r).forEach((k) => s.add(k)); return s; }, new Set())];
  return `﻿${toCSV(rows.map((r) => Object.fromEntries(keys.map((k) => [k, flat(r[k])]))), keys.map((k) => ({ label: k, key: k })))}`;
};
const save = (name, text, type) => {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

export function BackupScreen() {
  const { uid, cfg, store, say } = useDash();
  const [busy, setBusy] = useState('');
  const [sum, setSum] = useState(null);
  const day = () => new Date().toISOString().slice(0, 10);

  const full = async () => {
    setBusy('full'); setSum(null);
    const out = { app: 'spike', exported_at: new Date().toISOString(), store: { store_name: store?.store_name, store_slug: store?.store_slug }, config: cfg, tables: {} };
    const info = [];
    for (const [t, label] of TABLES) {
      setBusy(`جاري سحب ${label}...`);
      const r = await pull(t, uid);
      if (r.error) info.push([label, 'غير متاح']); else { out.tables[t] = r.rows; info.push([label, r.rows.length]); }
    }
    save(`spike-backup-${day()}.json`, JSON.stringify(out), 'application/json');
    setSum(info); setBusy(''); say('تم تنزيل النسخة الكاملة ✓');
  };
  const one = async (t, label) => {
    setBusy(`جاري سحب ${label}...`);
    const r = await pull(t, uid);
    setBusy('');
    if (r.error) { say(`تعذر سحب ${label}`); return; }
    if (!r.rows.length) { say(`مفيش بيانات في «${label}»`); return; }
    downloadCsvFile(`${t}-${day()}.csv`, csv(r.rows));
  };

  return (
    <>
      <PageHead title="نسخة احتياطية وتصدير" sub="نزّل بيانات متجرك كلها على جهازك. دي ملكك.">
        <button className="btn p" type="button" disabled={!!busy} onClick={full}>{busy === 'full' ? 'جاري التجهيز...' : 'تنزيل نسخة كاملة (JSON)'}</button>
      </PageHead>
      {busy && busy !== 'full' ? <div className="card" role="status">{busy}</div> : null}
      <div className="card" style={{ marginBottom: 14, lineHeight: 1.9, fontSize: 13 }}>
        النسخة الكاملة فيها: الطلبات، المنتجات، الأقسام، الكوبونات، التقييمات، المشتركين، الطلبات المفقودة، الصفحات، مناطق الشحن، إعدادات المتجر كلها، وغيرها.
        <br />مش بتتضمن مفاتيح الربط (واتساب والذكاء الاصطناعي والشحن) ولا كلمات المرور. احتفظ بالملف في مكان آمن، لأنه فيه بيانات عملائك.
      </div>
      {sum ? (
        <div className="card" style={{ marginBottom: 14 }}>
          <b>اللي اتصدّر:</b>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 6, marginTop: 8, fontSize: 13 }}>
            {sum.map(([l, n]) => <div key={l}>{l}: <b className="num">{n}</b></div>)}
          </div>
        </div>
      ) : null}
      <div className="card">
        <b>تصدير جدول واحد (CSV يفتح في Excel)</b>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {TABLES.filter((x) => x[2]).map(([t, l]) => <button key={t} type="button" className="btn" disabled={!!busy} onClick={() => one(t, l)}>{l}</button>)}
        </div>
      </div>
    </>
  );
}
export default BackupScreen;
