'use client';
import React, { useMemo, useState } from 'react';
import { useDash, PageHead, Empty, Spin, Badge } from '../ui';
import { useTable, api } from '../hooks';
import { useOrders, useWa, fdate } from '../shared';
import { STATUS, money, normalizePhone } from '../../../lib/storeKit';

/* طابور تأكيد الطلبات: الطلبات الجديدة + إرسال رسالة التأكيد بالواتساب بضغطة + تأكيد/إلغاء مباشر */
export function ConfirmScreen() {
  const { cur, say } = useDash();
  const orders = useOrders(1000);
  const logs = useTable('store_wa_log', { order: 'created_at', limit: 3000 });
  const wa = useWa();
  const [busyId, setBusyId] = useState(null);
  const [onlyUnsent, setOnlyUnsent] = useState(false);

  const sent = useMemo(() => {
    const m = {};
    logs.rows.filter((l) => l.template === 'confirm').forEach((l) => {
      const k = normalizePhone(l.phone);
      if (!m[k] || new Date(l.created_at) > new Date(m[k])) m[k] = l.created_at;
    });
    return m;
  }, [logs.rows]);

  const pending = useMemo(() => orders.rows
    .filter((o) => (o.status || 'pending') === 'pending')
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)), [orders.rows]);

  const list = onlyUnsent ? pending.filter((o) => !sent[normalizePhone(o.customer_phone)]) : pending;

  const sendWa = async (o) => {
    const text = wa.message('confirm', { name: o.customer_name, order_no: o.order_no ?? o.id, total: o.total_price });
    window.open(wa.url(o.customer_phone, text), '_blank', 'noopener');
    await wa.log(normalizePhone(o.customer_phone), 'confirm');
    logs.refresh();
  };

  const setStatus = async (o, status) => {
    setBusyId(o.id);
    const res = await api('/api/dashboard/orders', { action: 'status', ids: [o.id], status });
    setBusyId(null);
    if (!res.results || res.results.some((x) => !x.ok)) { say((res.results && res.results.find((x) => !x.ok)?.error) || res.error || 'تعذر تحديث الحالة'); return; }
    say(`✅ تم تحويل الطلب إلى «${STATUS[status].ar}»`);
    orders.refresh();
  };

  if (orders.loading || logs.loading) return <Spin />;
  return (
    <>
      <PageHead title="تأكيد الطلبات" sub="الطلبات الجديدة بانتظار التأكيد. أرسل رسالة واتساب للعميل بضغطة، ثم أكّد الطلب أو ألغه.">
        <label className="tgrow" style={{ cursor: 'pointer' }}>
          <input type="checkbox" checked={onlyUnsent} onChange={(e) => setOnlyUnsent(e.target.checked)} /> <span>اللي ماتبعتلهوش رسالة بس</span>
        </label>
      </PageHead>
      <div className="card">
        <p className="mut" style={{ marginTop: 0 }}>
          زر واتساب بيفتح المحادثة والرسالة جاهزة، وأنت اللي بتضغط «إرسال» في واتساب. الإرسال التلقائي بدون ضغط محتاج WhatsApp Business API (حساب رسمي من Meta) وده مش مفعّل. تقدر تعدّل نص الرسالة من «قوالب واتساب» في التسويق.
        </p>
        {list.length === 0 ? <Empty icon="✅" t="مفيش طلبات بانتظار التأكيد" /> : (
          <div className="tw"><table className="tbl">
            <thead><tr><th>#</th><th>العميل</th><th>الإجمالي</th><th>الوقت</th><th>الرسالة</th><th /></tr></thead>
            <tbody>
              {list.map((o) => {
                const when = sent[normalizePhone(o.customer_phone)];
                const flags = Array.isArray(o.flags) ? o.flags : [];
                return (
                  <tr key={o.id}>
                    <td className="num">{o.order_no ?? o.id}</td>
                    <td>
                      <b>{o.customer_name}</b>
                      <div className="mut num" dir="ltr">{o.customer_phone}</div>
                      {flags.includes('duplicate_hold') ? <Badge c="#b7791f">مكرر – معلّق</Badge> : null}
                    </td>
                    <td className="num">{money(o.total_price, cur)}</td>
                    <td className="mut">{fdate(o.created_at)}</td>
                    <td>{when ? <span className="ok">أُرسلت {fdate(when)}</span> : <span className="mut">لم تُرسل</span>}</td>
                    <td>
                      <button type="button" className="btn sm" onClick={() => sendWa(o)}>💬 واتساب</button>{' '}
                      <button type="button" className="btn sm p" disabled={busyId === o.id} onClick={() => setStatus(o, 'confirmed')}>تأكيد</button>{' '}
                      <button type="button" className="btn sm dng" disabled={busyId === o.id} onClick={() => { if (window.confirm('إلغاء الطلب؟')) setStatus(o, 'cancelled'); }}>إلغاء</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        )}
      </div>
    </>
  );
}
