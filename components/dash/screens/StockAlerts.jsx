'use client';
import React from 'react';
import { useDash } from '../ui';
import { useWa, fday, downloadCsvFile } from '../shared';
import { Crud } from '../forms';
import { toCSV } from '../../../lib/storeKit';

/* طلبات «نبّهني لما يرجع»: عملاء سابوا رقمهم على منتج نفد. بلّغهم بواتساب وعلّم اللي اتبلّغ. */
export function StockAlertsScreen() {
  const wa = useWa();
  const { store } = useDash();
  const tell = (r, t) => {
    const text = `أهلاً! المنتج «${r.product_title}» رجع متاح تاني في ${store?.store_name || 'متجرنا'} 🎉\nاطلبه دلوقتي قبل ما يخلص: ${wa.vars().link}`;
    window.open(wa.url(r.phone, text), '_blank', 'noopener');
    wa.log(r.phone, 'back_in_stock');
    if (!r.notified) t.update(r.id, { notified: true });
  };
  return (
    <Crud
      table="stock_alerts" noun="طلب تنبيه"
      title="طلبات التنبيه بالمخزون"
      desc="عملاء ضغطوا «نبّهني لما يرجع» على منتج نفد. لما المنتج يرجع، ابعتلهم واتساب بضغطة."
      search={(r) => `${r.product_title} ${r.phone}`}
      columns={[
        { l: 'المنتج', render: (r) => <b>{r.product_title || r.product_id}</b> },
        { l: 'الموبايل', render: (r) => <span className="num" dir="ltr">{r.phone}</span> },
        { l: 'التاريخ', render: (r) => fday(r.created_at) },
        { l: 'الحالة', render: (r) => (r.notified ? '✅ تم التبليغ' : '⏳ في الانتظار') },
      ]}
      fields={[]}
      canAdd={false} canEdit={false}
      emptyText="لسه مفيش حد طلب تنبيه."
      extraActions={(r, t) => <button type="button" className="btn sm wa" onClick={() => tell(r, t)}>{r.notified ? 'بلّغه تاني' : 'بلّغه واتساب'}</button>}
      toolbar={(t) => <button type="button" className="btn" onClick={() => downloadCsvFile('stock-alerts.csv', toCSV(t.rows, [{ label: 'المنتج', key: 'product_title' }, { label: 'الموبايل', key: 'phone' }]))}>تصدير CSV</button>}
    />
  );
}
export default StockAlertsScreen;
