'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDash, PageHead, Modal, Field, Empty, Spin, Tabs, Pager, useDebounced, Badge, Stat, CopyBtn, Tog } from '../ui';
import { useTable, useProducts, api, useInterval } from '../hooks';
import { Crud } from '../forms';
import {
  useOrders, useRange, RangeBar, inRange, StatusBadge, RiskBadge, FLAG_LABEL, useWa, orderProfit, isLive, downloadCsvFile, fdate, fday,
} from '../shared';
import { STATUS, GOVERNORATES, money, toCSV, normalizePhone, isValidEgPhone, trackUrl, ago } from '../../../lib/storeKit';
import { supabase } from '../../../lib/supabase';

const PER = 25;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const itemsText = (o) => (Array.isArray(o.items) ? o.items : []).map((i) => `${i.title}${i.options && Object.keys(i.options).length ? ` (${Object.values(i.options).join('/')})` : ''} ×${i.qty}`).join('، ');

function printWaybills(list, storeName, cur) {
  const w = window.open('', '_blank');
  if (!w) return false;
  const pages = list.map((o) => `
    <section>
      <header><b>${esc(storeName)}</b><span>طلب #${esc(o.order_no ?? o.id)}</span></header>
      <p><b>${esc(o.customer_name)}</b> — <span dir="ltr">${esc(o.customer_phone)}</span>${o.phone2 ? ` / <span dir="ltr">${esc(o.phone2)}</span>` : ''}</p>
      <p>${esc(o.governorate)} — ${esc(o.address)}</p>
      <p class="it">${esc(itemsText(o))}</p>
      ${o.notes ? `<p class="nt">ملاحظات: ${esc(o.notes)}</p>` : ''}
      <div class="cod">المطلوب تحصيله: <b>${esc(Math.round(Number(o.total_price) || 0))} ${esc(cur)}</b></div>
      ${o.tracking_number ? `<p dir="ltr">Tracking: ${esc(o.tracking_number)}</p>` : ''}
    </section>`).join('');
  w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>بوالص الشحن</title>
    <style>body{font-family:Tahoma,Arial,sans-serif;margin:0;padding:12px}section{border:2px solid #222;border-radius:10px;padding:14px;margin:0 0 12px;page-break-inside:avoid;max-width:520px}
    header{display:flex;justify-content:space-between;border-bottom:1px dashed #888;padding-bottom:8px;margin-bottom:8px;font-size:16px}p{margin:6px 0}.it{background:#f4f4f4;padding:8px;border-radius:6px}.nt{color:#a00}
    .cod{margin-top:10px;font-size:18px;border:2px solid #000;padding:8px;text-align:center}</style></head><body>${pages}<script>window.onload=function(){window.print()}<\/script></body></html>`);
  w.document.close();
  return true;
}

/* ====================== كل الطلبات ====================== */
export function OrdersScreen() {
  const { say, cur, store, uid } = useDash();
  const t = useOrders(3000);
  const [st, setSt] = useState('all');
  const [q, setQ] = useState('');
  const dq = useDebounced(q);
  const r = useRange('all');
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState(() => new Set());
  const [viewId, setViewId] = useState(null);
  const [manual, setManual] = useState(false);
  const [busy, setBusy] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('confirmed');
  const prevPending = useRef(null);

  useInterval(() => { t.refresh(); }, 60000);

  useEffect(() => {
    const n = t.rows.filter((o) => (o.status || 'pending') === 'pending').length;
    if (prevPending.current !== null && n > prevPending.current) say(`🔔 وصلك ${n - prevPending.current} طلب جديد`);
    prevPending.current = n;
  }, [t.rows]);

  const counts = useMemo(() => {
    const c = { all: t.rows.length };
    Object.keys(STATUS).forEach((k) => { c[k] = 0; });
    t.rows.forEach((o) => { const k = o.status || 'pending'; c[k] = (c[k] || 0) + 1; });
    return c;
  }, [t.rows]);

  const list = useMemo(() => {
    const s = dq.trim().toLowerCase();
    return t.rows.filter((o) => (st === 'all' || (o.status || 'pending') === st)
      && inRange(o.created_at, r.from)
      && (!s || [o.order_no, o.customer_name, o.customer_phone, o.governorate, o.tracking_number].some((v) => String(v ?? '').toLowerCase().includes(s))));
  }, [t.rows, st, dq, r.key, r.from]);

  useEffect(() => { setPage(1); setSel(new Set()); }, [st, dq, r.key]);

  const rows = list.slice((page - 1) * PER, page * PER);
  const allOnPage = rows.length > 0 && rows.every((o) => sel.has(o.id));
  const toggle = (id) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAll = () => setSel((s) => { const n = new Set(s); rows.forEach((o) => (allOnPage ? n.delete(o.id) : n.add(o.id))); return n; });
  const selected = t.rows.filter((o) => sel.has(o.id));
  const viewing = t.rows.find((o) => o.id === viewId);

  const changeStatus = async (ids, status) => {
    if (!ids.length) return;
    setBusy(true);
    const res = await api('/api/dashboard/orders', { action: 'status', ids, status });
    setBusy(false);
    if (!res.results) { say(res.error || 'تعذر تحديث الحالة'); return; }
    const fails = res.results.filter((x) => !x.ok);
    say(fails.length ? `تم تحديث ${res.results.length - fails.length} وتعذر ${fails.length}: ${fails[0].error}` : `✅ تم تحويل الحالة إلى «${STATUS[status].ar}»`);
    await t.refresh();
  };

  const sendBosta = async (ids) => {
    if (!ids.length) return;
    setBusy(true);
    const res = await api('/api/shipping/send', { order_ids: ids });
    setBusy(false);
    if (!res.results) { say(res.error || 'تعذر الإرسال'); return; }
    const ok = res.results.filter((x) => x.ok).length;
    const fail = res.results.find((x) => !x.ok);
    say(ok ? `🚚 تم إرسال ${ok} طلب لبوسطة${fail ? ` — تعذر: ${fail.error}` : ''}` : `تعذر الإرسال: ${fail?.error || ''}`);
    await t.refresh();
  };

  const exportCsv = (list2) => {
    const csv = toCSV(list2, [
      { label: 'رقم الطلب', get: (o) => o.order_no ?? o.id },
      { label: 'التاريخ', get: (o) => fdate(o.created_at) },
      { label: 'العميل', key: 'customer_name' },
      { label: 'الهاتف', key: 'customer_phone' },
      { label: 'المحافظة', key: 'governorate' },
      { label: 'العنوان', key: 'address' },
      { label: 'المنتجات', get: itemsText },
      { label: 'الإجمالي', key: 'total_price' },
      { label: 'الحالة', get: (o) => STATUS[o.status || 'pending']?.ar },
      { label: 'شركة الشحن', key: 'courier' },
      { label: 'رقم التتبع', key: 'tracking_number' },
      { label: 'كود الخصم', key: 'coupon_code' },
      { label: 'المصدر', get: (o) => o.utm?.source || '' },
    ]);
    downloadCsvFile(`orders-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  const print = (list2) => { if (!printWaybills(list2, store?.store_name || 'سبايك', cur)) say('اسمح بالنوافذ المنبثقة للطباعة'); };

  return (
    <>
      <PageHead title="كل الطلبات" sub={`${t.rows.length} طلب`}>
        <button type="button" className="btn" onClick={() => exportCsv(list)}>⬇️ تصدير CSV</button>
        <button type="button" className="btn p" onClick={() => setManual(true)}>+ طلب يدوي</button>
      </PageHead>
      {t.err && <div className="card errbox">⚠️ {t.err}<br /><small>شغّل ملف spike_store_all.sql في Supabase.</small></div>}

      <Tabs
        value={st} onChange={setSt}
        tabs={[['all', 'الكل', counts.all], ...Object.entries(STATUS).map(([k, v]) => [k, v.ar, counts[k] || 0])]}
      />
      <div className="tl">
        <input className="in" placeholder="بحث بالاسم أو الهاتف أو رقم الطلب…" value={q} onChange={(e) => setQ(e.target.value)} />
        <RangeBar r={r} />
      </div>

      {selected.length > 0 && (
        <div className="bulk">
          <b>{selected.length} محدد</b>
          <select className="in sm" style={{ width: 150 }} value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.ar}</option>)}
          </select>
          <button type="button" className="btn sm p" disabled={busy} onClick={() => changeStatus(selected.map((o) => o.id), bulkStatus)}>تطبيق الحالة</button>
          <button type="button" className="btn sm" disabled={busy} onClick={() => sendBosta(selected.map((o) => o.id))}>🚚 إرسال لبوسطة</button>
          <button type="button" className="btn sm" onClick={() => print(selected)}>🖨️ طباعة البوالص</button>
          <button type="button" className="btn sm" onClick={() => exportCsv(selected)}>⬇️ تصدير المحدد</button>
          <button type="button" className="btn sm" onClick={() => setSel(new Set())}>إلغاء التحديد</button>
        </div>
      )}

      <div className="card tw">
        {t.loading ? <div className="c"><Spin /></div> : rows.length === 0 ? (
          <Empty icon="📦" t="لا توجد طلبات" d={t.rows.length ? 'جرّب تغيير الفلاتر' : 'ستظهر هنا طلبات متجرك فور وصولها'} />
        ) : (
          <table className="tbl">
            <thead><tr>
              <th style={{ width: 36 }}><input type="checkbox" checked={allOnPage} onChange={toggleAll} aria-label="تحديد الكل" /></th>
              <th>الطلب</th><th>العميل</th><th>المحافظة</th><th>المنتجات</th><th>الإجمالي</th><th>الحالة</th><th>مخاطرة</th><th>الشحن</th><th />
            </tr></thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className={sel.has(o.id) ? 'sel' : ''}>
                  <td><input type="checkbox" checked={sel.has(o.id)} onChange={() => toggle(o.id)} aria-label="تحديد" /></td>
                  <td><b className="num">#{o.order_no ?? o.id}</b><small>{ago(o.created_at)} · {fday(o.created_at)}</small></td>
                  <td><b>{o.customer_name}</b><small className="num" dir="ltr" style={{ textAlign: 'start' }}>{o.customer_phone}</small></td>
                  <td>{o.governorate}</td>
                  <td style={{ maxWidth: 220 }}><span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{itemsText(o)}</span></td>
                  <td className="num"><b>{money(o.total_price, cur)}</b>{o.coupon_code && <small>🏷️ {o.coupon_code}</small>}</td>
                  <td><StatusBadge s={o.status} />{o.verified && <small className="ok">✓ موثّق</small>}</td>
                  <td><RiskBadge score={o.risk_score} /></td>
                  <td>{o.tracking_number ? <><small className="num">{o.courier}</small><a className="num" href={trackUrl(o.courier, o.tracking_number)} target="_blank" rel="noreferrer">{o.tracking_number}</a></> : <span className="mut">—</span>}</td>
                  <td className="acts"><button type="button" className="btn sm p" onClick={() => setViewId(o.id)}>عرض</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pager total={list.length} page={page} per={PER} onPage={setPage} />
      </div>

      {viewing && (
        <OrderView
          order={viewing} onClose={() => setViewId(null)} busy={busy}
          onStatus={(s) => changeStatus([viewing.id], s)} onBosta={() => sendBosta([viewing.id])}
          onPrint={() => print([viewing])} onChanged={() => t.refresh()}
          onDeleted={() => { setViewId(null); t.reload(); }}
        />
      )}
      {manual && <ManualOrder onClose={() => setManual(false)} onDone={() => { setManual(false); t.reload(); }} />}
    </>
  );
}

function OrderView({ order: o, onClose, onStatus, onBosta, onPrint, onChanged, onDeleted, busy }) {
  const { cfg, cur, say, uid } = useDash();
  const wa = useWa();
  const [note, setNote] = useState(o.internal_note || '');
  const [savingNote, setSavingNote] = useState(false);
  const st = o.status || 'pending';
  const items = Array.isArray(o.items) ? o.items : [];
  const courier = Number(cfg.shipping.courier_cost) || 0;
  const profit = orderProfit(o, courier);
  const waVars = { name: o.customer_name, order_no: o.order_no ?? o.id, total: o.total_price, tracking: o.tracking_number };

  const saveNote = async () => {
    setSavingNote(true);
    const { error } = await supabase.from('orders').update({ internal_note: note, updated_at: new Date().toISOString() }).eq('id', o.id).eq('store_id', uid);
    setSavingNote(false);
    if (error) say(`تعذر الحفظ: ${error.message}`); else { say('✅ تم حفظ الملاحظة'); onChanged(); }
  };
  const markVerified = async () => {
    const { error } = await supabase.from('orders').update({ verified: true, verified_at: new Date().toISOString() }).eq('id', o.id).eq('store_id', uid);
    if (error) say(error.message); else { say('✓ تم توثيق الطلب'); onChanged(); }
  };
  const block = async () => {
    if (!window.confirm(`حظر الرقم ${o.customer_phone} من الطلب؟`)) return;
    const { error } = await supabase.from('store_blocklist').upsert({ store_id: uid, phone: normalizePhone(o.customer_phone), kind: 'order', reason: `من الطلب #${o.order_no ?? o.id}` }, { onConflict: 'store_id,phone,kind' });
    say(error ? error.message : '🚫 تم حظر الرقم');
  };
  const del = async () => {
    if (!window.confirm('حذف هذا الطلب الملغي نهائياً؟')) return;
    const { error } = await supabase.from('orders').delete().eq('id', o.id).eq('store_id', uid);
    if (error) say(`تعذر الحذف: ${error.message}`); else { say('تم الحذف'); onDeleted(); }
  };
  const openWa = (key) => {
    const text = wa.message(key, waVars);
    window.open(wa.url(o.customer_phone, text), '_blank', 'noopener');
    wa.log(normalizePhone(o.customer_phone), key);
  };

  return (
    <Modal wide t={`طلب #${o.order_no ?? o.id}`} x={onClose}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div><StatusBadge s={st} /> <span className="mut">{fdate(o.created_at)}</span></div>
        <div className="chips">
          {Object.entries(STATUS).map(([k, v]) => (
            <button key={k} type="button" disabled={busy || k === st} className={'chip' + (k === st ? ' act' : '')} onClick={() => onStatus(k)}>{v.ar}</button>
          ))}
        </div>
      </div>

      <div className="two">
        <div className="card">
          <h3>👤 العميل</h3>
          <div className="pls"><p><b>{o.customer_name}</b></p></div>
          <div className="pls"><p className="num" dir="ltr" style={{ textAlign: 'start' }}>{o.customer_phone}{o.phone2 ? ` · ${o.phone2}` : ''}</p>
            <a className="btn sm" href={`tel:${o.customer_phone}`}>اتصال</a>
            <button type="button" className="btn sm wa" onClick={() => openWa('confirm')}>واتساب</button></div>
          {o.email && <div className="pls"><p className="num" dir="ltr" style={{ textAlign: 'start' }}>{o.email}</p></div>}
          <div className="pls"><p>{o.governorate}<small>{o.address}</small></p><CopyBtn text={`${o.customer_name}\n${o.customer_phone}\n${o.governorate} - ${o.address}`} label="نسخ" /></div>
          {o.notes && <div className="pls"><p>📝 {o.notes}</p></div>}
        </div>

        <div className="card">
          <h3>🧾 الحساب</h3>
          <div className="pls"><p>المنتجات</p><b className="num">{money(o.subtotal, cur)}</b></div>
          {Number(o.discount) > 0 && <div className="pls"><p>خصم {o.coupon_code ? `(${o.coupon_code})` : ''}</p><b className="num ok">- {money(o.discount, cur)}</b></div>}
          <div className="pls"><p>الشحن</p><b className="num">{money(o.shipping_cost, cur)}</b></div>
          {Number(o.cod_fee) > 0 && <div className="pls"><p>رسوم الدفع عند الاستلام</p><b className="num">{money(o.cod_fee, cur)}</b></div>}
          <div className="pls"><p><b>الإجمالي (يُحصَّل من العميل)</b></p><b className="num" style={{ fontSize: 18 }}>{money(o.total_price, cur)}</b></div>
          <div className="pls"><p>التكلفة</p><b className="num">{money(o.cost_total, cur)}</b></div>
          <div className="pls"><p>صافي الربح التقديري</p><b className={'num ' + (profit >= 0 ? 'ok' : 'warn')}>{money(profit, cur)}</b></div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h3>🛍️ المنتجات</h3>
        {items.map((i, k) => (
          <div className="pls" key={k}>
            {i.image ? <img src={i.image} alt="" className="thumb" /> : <span className="thumb ph">🖼️</span>}
            <p><b>{i.title}</b>{i.bump && <> <Badge c="#e08f4f">Order Bump</Badge></>}
              <small>{i.options && Object.keys(i.options).length ? Object.entries(i.options).map(([a, b]) => `${a}: ${b}`).join(' · ') : ''}{i.offer ? ` · ${i.offer}` : ''}</small></p>
            <span className="num">×{i.qty}</span><b className="num">{money(i.line_total, cur)}</b>
          </div>
        ))}
      </div>

      <div className="two" style={{ marginTop: 14 }}>
        <div className="card">
          <h3>🛡️ الحماية والتوثيق</h3>
          <div className="pls"><p>نسبة المخاطرة</p><RiskBadge score={o.risk_score} /></div>
          {(Array.isArray(o.flags) ? o.flags : []).map((f) => <div key={f} className="pls"><p>⚠️ {FLAG_LABEL[f] || f}</p></div>)}
          <div className="pls"><p>المصدر</p><span className="num">{o.utm?.source || o.source || '—'}{o.utm?.campaign ? ` / ${o.utm.campaign}` : ''}{o.utm?.ref ? ` · ref:${o.utm.ref}` : ''}</span></div>
          <div className="row" style={{ marginTop: 10, marginBottom: 0 }}>
            {o.verified ? <Badge c="#2f855a">✓ موثّق</Badge> : <button type="button" className="btn sm" onClick={markVerified}>✓ تحديد كموثّق</button>}
            <button type="button" className="btn sm" onClick={() => openWa('verify')}>رسالة توثيق</button>
            <button type="button" className="btn sm dng" onClick={block}>🚫 حظر الرقم</button>
          </div>
        </div>
        <div className="card">
          <h3>🚚 الشحن</h3>
          {o.tracking_number ? (
            <>
              <div className="pls"><p>{o.courier}</p><b className="num">{o.tracking_number}</b></div>
              <div className="row" style={{ marginBottom: 0 }}>
                {trackUrl(o.courier, o.tracking_number) && <a className="btn sm" href={trackUrl(o.courier, o.tracking_number)} target="_blank" rel="noreferrer">تتبع الشحنة</a>}
                <button type="button" className="btn sm wa" onClick={() => openWa('shipped')}>إبلاغ العميل</button>
              </div>
            </>
          ) : (
            <>
              <p className="mut">لم يُرسل للشحن بعد.</p>
              <div className="row" style={{ marginBottom: 0 }}>
                <button type="button" className="btn p sm" disabled={busy || !['pending', 'confirmed'].includes(st)} onClick={onBosta}>🚚 إرسال لبوسطة</button>
                <button type="button" className="btn sm" onClick={onPrint}>🖨️ طباعة بوليصة</button>
              </div>
              <small className="hint">يتطلب تفعيل بوسطة من صفحة «التطبيقات».</small>
            </>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h3>🗒️ ملاحظة داخلية <small>لا تظهر للعميل</small></h3>
        <textarea className="in ta" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="row" style={{ marginTop: 10, marginBottom: 0 }}>
          <button type="button" className="btn p sm" disabled={savingNote || note === (o.internal_note || '')} onClick={saveNote}>حفظ الملاحظة</button>
          {st === 'cancelled' && <button type="button" className="btn dng sm" onClick={del}>حذف الطلب</button>}
        </div>
      </div>
    </Modal>
  );
}

function ManualOrder({ onClose, onDone }) {
  const { say, slug, uid, cur } = useDash();
  const prods = useProducts();
  const [c, setC] = useState({ name: '', phone: '', governorate: '', address: '', notes: '' });
  const [lines, setLines] = useState([{ product_id: '', qty: 1, options: {} }]);
  const [coupon, setCoupon] = useState('');
  const [quote, setQuote] = useState(null);
  const [busy, setBusy] = useState(false);

  const active = prods.rows.filter((p) => (p.status || 'active') === 'active');
  const setLine = (i, patch) => setLines((ls) => ls.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  const valid = lines.filter((l) => l.product_id);
  const qkey = JSON.stringify([valid, c.governorate, coupon]);

  useEffect(() => {
    if (!valid.length || !c.governorate || !slug) { setQuote(null); return undefined; }
    const h = setTimeout(async () => {
      try {
        const res = await fetch('/api/store/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, items: valid, governorate: c.governorate, coupon }) });
        setQuote(await res.json());
      } catch { setQuote(null); }
    }, 350);
    return () => clearTimeout(h);
  }, [qkey, slug]);

  const create = async () => {
    setBusy(true);
    const res = await api('/api/dashboard/orders', { action: 'create', store_id: uid, customer: c, items: valid, coupon });
    setBusy(false);
    if (!res.ok) { say(res.error || 'تعذر إنشاء الطلب'); return; }
    say(`✅ تم إنشاء الطلب #${res.order_no}`);
    onDone();
  };

  return (
    <Modal
      wide t="طلب يدوي" x={onClose}
      foot={<><button type="button" className="btn" onClick={onClose}>إلغاء</button><button type="button" className="btn p" disabled={busy || !valid.length} onClick={create}>{busy ? '...' : 'إنشاء الطلب'}</button></>}
    >
      <div className="fgrid">
        <Field l="اسم العميل"><input className="in" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} /></Field>
        <Field l="رقم الموبايل"><input className="in num" dir="ltr" value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} /></Field>
        <Field l="المحافظة">
          <select className="in" value={c.governorate} onChange={(e) => setC({ ...c, governorate: e.target.value })}>
            <option value="">اختر</option>{GOVERNORATES.map(([g]) => <option key={g}>{g}</option>)}
          </select>
        </Field>
        <Field l="كود خصم (اختياري)"><input className="in num" dir="ltr" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} /></Field>
        <Field l="العنوان بالتفصيل" full><input className="in" value={c.address} onChange={(e) => setC({ ...c, address: e.target.value })} /></Field>
        <Field l="ملاحظات" full><input className="in" value={c.notes} onChange={(e) => setC({ ...c, notes: e.target.value })} /></Field>
      </div>
      <h3>المنتجات</h3>
      {lines.map((l, i) => {
        const p = active.find((x) => String(x.id) === l.product_id);
        const groups = Array.isArray(p?.variants) ? p.variants : [];
        return (
          <div className="row" key={i}>
            <select className="in" style={{ flex: 2 }} value={l.product_id} onChange={(e) => setLine(i, { product_id: e.target.value, options: {} })}>
              <option value="">اختر منتجاً</option>
              {active.map((x) => <option key={x.id} value={String(x.id)}>{x.title} — {money(x.price, cur)}</option>)}
            </select>
            {groups.map((g) => (
              <select key={g.name} className="in" value={l.options[g.name] || ''} onChange={(e) => setLine(i, { options: { ...l.options, [g.name]: e.target.value } })}>
                <option value="">{g.name}</option>{(g.values || []).map((v) => <option key={v}>{v}</option>)}
              </select>
            ))}
            <input className="in num" type="number" min="1" style={{ maxWidth: 80 }} value={l.qty} onChange={(e) => setLine(i, { qty: Math.max(1, parseInt(e.target.value, 10) || 1) })} />
            {lines.length > 1 && <button type="button" className="btn sm dng" onClick={() => setLines((ls) => ls.filter((_, k) => k !== i))}>✕</button>}
          </div>
        );
      })}
      <button type="button" className="btn sm" onClick={() => setLines((ls) => [...ls, { product_id: '', qty: 1, options: {} }])}>+ منتج آخر</button>

      {quote && (
        <div className="card" style={{ marginTop: 14 }}>
          {quote.ok ? (
            <>
              <div className="pls"><p>المنتجات</p><b className="num">{money(quote.subtotal, cur)}</b></div>
              {quote.discount > 0 && <div className="pls"><p>الخصم</p><b className="num ok">- {money(quote.discount, cur)}</b></div>}
              <div className="pls"><p>الشحن</p><b className="num">{money(quote.shipping, cur)}</b></div>
              <div className="pls"><p><b>الإجمالي</b></p><b className="num" style={{ fontSize: 18 }}>{money(quote.total, cur)}</b></div>
              {coupon && <small className="mut">{quote.couponMsg}</small>}
            </>
          ) : <span className="warn">{quote.error}</span>}
        </div>
      )}
    </Modal>
  );
}

/* ====================== الطلبات المفقودة ====================== */
export function AbandonedScreen() {
  const { cfg, say, cur, uid } = useDash();
  const t = useTable('abandoned_carts', { order: 'updated_at', limit: 1000 });
  const wa = useWa();
  const [showAll, setShowAll] = useState(false);
  const list = t.rows.filter((a) => showAll || !a.recovered);
  const pendingSend = list.filter((a) => !a.recovered && !a.wa_sent_at);

  const send = async (a) => {
    const text = wa.message('abandoned', { name: a.customer_name });
    window.open(wa.url(a.phone, text), '_blank', 'noopener');
    wa.log(a.phone, 'abandoned');
    await t.update(a.id, { wa_sent_at: new Date().toISOString() });
  };
  const summary = (a) => (Array.isArray(a.items) ? a.items : []).map((i) => `${i.title} ×${i.qty}`).join('، ');
  const totalLost = list.filter((a) => !a.recovered).reduce((x, a) => x + (Number(a.total) || 0), 0);

  return (
    <>
      <PageHead title="الطلبات المفقودة" sub="عملاء كتبوا أرقامهم ولم يكملوا الطلب">
        <button type="button" className="btn p" disabled={!pendingSend.length} onClick={() => send(pendingSend[0])}>📲 تواصل مع التالي ({pendingSend.length})</button>
      </PageHead>
      {t.err && <div className="card errbox">⚠️ {t.err}</div>}
      <div className="grid3">
        <Stat label="سلات يمكن استرجاعها" value={list.filter((a) => !a.recovered).length} />
        <Stat label="قيمتها المحتملة" value={money(totalLost, cur)} color="var(--b)" />
        <Stat label="لم يُتواصل معهم" value={pendingSend.length} color="#b7791f" />
      </div>
      <div className="tl"><div className="tgrow"><Tog on={showAll} set={setShowAll} /><span>إظهار المسترجَعة أيضاً</span></div></div>
      <div className="card tw">
        {t.loading ? <div className="c"><Spin /></div> : list.length === 0 ? <Empty icon="🛒" t="لا توجد طلبات مفقودة" d="تُسجَّل السلة تلقائياً عندما يكتب العميل رقمه ولا يكمل الطلب" /> : (
          <table className="tbl">
            <thead><tr><th>العميل</th><th>المنتجات</th><th>القيمة</th><th>منذ</th><th>الحالة</th><th /></tr></thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id}>
                  <td><b>{a.customer_name || 'بدون اسم'}</b><small className="num" dir="ltr" style={{ textAlign: 'start' }}>{a.phone}</small></td>
                  <td style={{ maxWidth: 240 }}>{summary(a)}</td>
                  <td className="num">{money(a.total, cur)}</td>
                  <td>{ago(a.updated_at || a.created_at)}</td>
                  <td>{a.recovered ? <Badge c="#2f855a">اكتمل</Badge> : a.wa_sent_at ? <Badge c="#0a7f86">تم التواصل</Badge> : <Badge c="#b7791f">جديد</Badge>}</td>
                  <td className="acts">
                    {!a.recovered && <button type="button" className="btn sm wa" onClick={() => send(a)}>واتساب</button>}
                    {!a.recovered && <button type="button" className="btn sm" onClick={() => t.update(a.id, { recovered: true })}>تم</button>}
                    <button type="button" className="btn sm dng" onClick={async () => { if (window.confirm('حذف؟')) t.remove(a.id); }}>حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

/* ====================== الأرقام المحظورة ====================== */
export function BlockedScreen({ kind = 'order' }) {
  const isOtp = kind === 'otp';
  return (
    <Crud
      table="store_blocklist" filter={{ kind }} noun="رقم"
      title={isOtp ? 'الأرقام المحظورة OTP' : 'الأرقام المحظورة من الطلب'}
      desc={isOtp
        ? 'أرقام لا يُرسل لها رسائل توثيق، ويُعلَّم أي طلب منها «للمراجعة اليدوية» تلقائياً قبل الشحن.'
        : 'أي عميل برقم هنا لن يستطيع إتمام طلب من متجرك (تظهر له رسالة للتواصل معك).'}
      search={(r) => `${r.phone} ${r.reason}`}
      columns={[
        { l: 'الرقم', render: (r) => <b className="num" dir="ltr">{r.phone}</b> },
        { l: 'السبب', k: 'reason' },
        { l: 'التاريخ', render: (r) => fday(r.created_at) },
      ]}
      fields={[
        { k: 'phone', l: 'رقم الموبايل', type: 'ltr', ph: '01012345678' },
        { k: 'reason', l: 'السبب (اختياري)', ph: 'مثال: رفض الاستلام مرتين' },
      ]}
      validate={(e) => (isValidEgPhone(normalizePhone(e.phone)) ? '' : 'اكتب رقم موبايل مصري صحيح (مثال 01012345678)')}
      transform={(e) => ({ ...e, phone: normalizePhone(e.phone), kind })}
      emptyText="لا توجد أرقام محظورة"
    />
  );
}

/* ====================== العملاء ====================== */
export function CustomersScreen() {
  const { cur, go } = useDash();
  const t = useOrders(5000);
  const wa = useWa();
  const [seg, setSeg] = useState('all');
  const [q, setQ] = useState('');
  const dq = useDebounced(q);

  const customers = useMemo(() => {
    const m = new Map();
    t.rows.forEach((o) => {
      const k = normalizePhone(o.customer_phone) || o.customer_phone;
      if (!k) return;
      const c = m.get(k) || { phone: k, name: o.customer_name, orders: 0, spent: 0, last: o.created_at, bad: 0, govs: {} };
      if (isLive(o)) { c.orders += 1; c.spent += Number(o.total_price) || 0; } else c.bad += 1;
      if (new Date(o.created_at) > new Date(c.last)) { c.last = o.created_at; c.name = o.customer_name || c.name; }
      if (o.governorate) c.govs[o.governorate] = (c.govs[o.governorate] || 0) + 1;
      m.set(k, c);
    });
    return [...m.values()].map((c) => ({
      ...c,
      gov: Object.entries(c.govs).sort((a, b) => b[1] - a[1])[0]?.[0] || '',
      seg: c.bad >= 2 || (c.bad >= 1 && c.orders === 0) ? 'risky' : c.orders >= 3 ? 'vip' : c.orders === 2 ? 'repeat' : 'new',
    })).sort((a, b) => b.spent - a.spent);
  }, [t.rows]);

  const SEG = { vip: ['VIP', '#6b46c1'], repeat: ['متكرر', '#0a7f86'], new: ['جديد', '#2f855a'], risky: ['خطر مرتجعات', '#c53030'] };
  const counts = customers.reduce((a, c) => { a[c.seg] = (a[c.seg] || 0) + 1; return a; }, {});
  const list = customers.filter((c) => (seg === 'all' || c.seg === seg) && (!dq || `${c.name} ${c.phone}`.toLowerCase().includes(dq.toLowerCase())));
  const repeatRate = customers.length ? Math.round(((counts.vip || 0) + (counts.repeat || 0)) / customers.length * 100) : 0;
  const ltv = customers.length ? customers.reduce((x, c) => x + c.spent, 0) / customers.length : 0;

  const promo = (c) => {
    window.open(wa.url(c.phone, wa.message('promo', { name: c.name })), '_blank', 'noopener');
    wa.log(c.phone, 'promo');
  };
  const exportCsv = () => downloadCsvFile('customers.csv', toCSV(list, [
    { label: 'الاسم', key: 'name' }, { label: 'الهاتف', key: 'phone' }, { label: 'المحافظة', key: 'gov' },
    { label: 'عدد الطلبات', key: 'orders' }, { label: 'إجمالي المشتريات', get: (c) => Math.round(c.spent) },
    { label: 'آخر طلب', get: (c) => fday(c.last) }, { label: 'الشريحة', get: (c) => SEG[c.seg][0] },
  ]));

  return (
    <>
      <PageHead title="العملاء" sub="مبنية تلقائياً من طلباتك"><button type="button" className="btn" onClick={exportCsv}>⬇️ تصدير CSV</button></PageHead>
      <div className="grid4">
        <Stat label="إجمالي العملاء" value={customers.length} />
        <Stat label="نسبة العملاء المتكررين" value={`${repeatRate}%`} color="var(--b)" />
        <Stat label="متوسط قيمة العميل" value={money(ltv, cur)} />
        <Stat label="عملاء VIP" value={counts.vip || 0} color="#6b46c1" />
      </div>
      <Tabs value={seg} onChange={setSeg} tabs={[['all', 'الكل', customers.length], ...Object.entries(SEG).map(([k, v]) => [k, v[0], counts[k] || 0])]} />
      <div className="tl"><input className="in" placeholder="بحث بالاسم أو الهاتف…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="card tw">
        {t.loading ? <div className="c"><Spin /></div> : list.length === 0 ? <Empty icon="👥" t="لا يوجد عملاء بعد" /> : (
          <table className="tbl">
            <thead><tr><th>العميل</th><th>المحافظة</th><th>الطلبات</th><th>إجمالي المشتريات</th><th>آخر طلب</th><th>الشريحة</th><th /></tr></thead>
            <tbody>
              {list.slice(0, 200).map((c) => (
                <tr key={c.phone}>
                  <td><b>{c.name}</b><small className="num" dir="ltr" style={{ textAlign: 'start' }}>{c.phone}</small></td>
                  <td>{c.gov}</td><td className="num">{c.orders}{c.bad > 0 && <small className="warn">{c.bad} ملغي/مرتجع</small>}</td>
                  <td className="num"><b>{money(c.spent, cur)}</b></td><td>{fday(c.last)}</td>
                  <td><Badge c={SEG[c.seg][1]}>{SEG[c.seg][0]}</Badge></td>
                  <td className="acts"><button type="button" className="btn sm wa" onClick={() => promo(c)}>عرض واتساب</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

/* ====================== النشرة البريدية ====================== */
export function NewsletterScreen() {
  const wa = useWa();
  const sendWa = (r) => {
    window.open(wa.url(r.contact, wa.message('promo', {})), '_blank', 'noopener');
    wa.log(r.contact, 'promo');
  };
  return (
    <Crud
      table="store_newsletter" noun="مشترك"
      title="النشرة البريدية"
      desc="المشتركون من قسم «اشترك ليصلك كل جديد» في متجرك. أرقام الموبايل يمكنك مراسلتها عبر واتساب مباشرة."
      search={(r) => r.contact}
      columns={[
        { l: 'جهة الاتصال', render: (r) => <b className="num" dir="ltr">{r.contact}</b> },
        { l: 'النوع', render: (r) => (r.contact.includes('@') ? '✉️ بريد' : '📱 موبايل') },
        { l: 'تاريخ الاشتراك', render: (r) => fday(r.created_at) },
      ]}
      fields={[{ k: 'contact', l: 'بريد إلكتروني أو رقم موبايل', type: 'ltr' }]}
      validate={(e) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.contact || '') || isValidEgPhone(normalizePhone(e.contact)) ? '' : 'اكتب بريداً أو رقماً صحيحاً')}
      transform={(e) => ({ ...e, contact: String(e.contact).includes('@') ? String(e.contact).trim().toLowerCase() : normalizePhone(e.contact) })}
      canEdit={false}
      extraActions={(r) => (!r.contact.includes('@') ? <button type="button" className="btn sm wa" onClick={() => sendWa(r)}>واتساب</button> : null)}
      toolbar={(t) => <button type="button" className="btn" onClick={() => downloadCsvFile('newsletter.csv', toCSV(t.rows, [{ label: 'جهة الاتصال', key: 'contact' }, { label: 'التاريخ', get: (r) => fday(r.created_at) }]))}>⬇️ تصدير</button>}
    />
  );
}
