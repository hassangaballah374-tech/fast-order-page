'use client';
import React, { useState } from 'react';
import { useDash, PageHead, Modal, Field, Empty, Spin, Badge, Tabs, Tog } from '../ui';
import { useTable, useProducts } from '../hooks';
import { Crud, ConfigForm } from '../forms';
import { useSection, SaveBtn, LinkBox, MultiProductPick, asNumber } from '../bits';
import { useWa, ProductSelect, fdate } from '../shared';
import { money, applyOffer, fillTemplate } from '../../../lib/storeKit';

/* ====================== قائمة قواعد لكل منتج (تُستخدم في Cross / Bump / Offers) ====================== */
function ProductRules({ title, desc, summary, hasRule, initial, build, validate, children, cols = 'القاعدة', emptyIcon = '🏷️' }) {
  const { say, cur } = useDash();
  const p = useProducts();
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('all');

  const rows = p.rows.filter((x) => (filter === 'all' ? true : filter === 'on' ? hasRule(x) : !hasRule(x)));
  const save = async () => {
    const msg = validate ? validate(edit.v, edit.p, p.rows) : '';
    if (msg) { say(msg); return; }
    setBusy(true);
    const res = await p.update(edit.p.id, build(edit.v, edit.p));
    setBusy(false);
    if (res) { setEdit(null); say('✅ تم الحفظ'); }
  };
  const clear = async (x) => {
    if (!window.confirm('إلغاء هذه القاعدة للمنتج؟')) return;
    const res = await p.update(x.id, build(null, x));
    if (res) say('تم الإلغاء');
  };

  return (
    <>
      <PageHead title={title} sub={`${p.rows.filter(hasRule).length} منتج مفعّل`}>
        <select className="in" style={{ maxWidth: 160 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">كل المنتجات</option><option value="on">المفعّلة فقط</option><option value="off">غير المفعّلة</option>
        </select>
      </PageHead>
      {desc && <p className="mut dsc">{desc}</p>}
      {p.err && <div className="card errbox">⚠️ {p.err}</div>}
      <div className="card tw">
        {p.loading ? <div className="c"><Spin /></div> : rows.length === 0 ? <Empty icon={emptyIcon} t="لا توجد منتجات" d="أضف منتجات أولاً من «كل المنتجات»" /> : (
          <table className="tbl">
            <thead><tr><th>المنتج</th><th>السعر</th><th>{cols}</th><th /></tr></thead>
            <tbody>
              {rows.map((x) => (
                <tr key={x.id}>
                  <td><b>{x.title}</b>{(x.status || 'active') !== 'active' && <small>مسودة</small>}</td>
                  <td className="num">{money(x.price, cur)}</td>
                  <td>{hasRule(x) ? summary(x, p) : <span className="mut">—</span>}</td>
                  <td className="acts">
                    <button type="button" className="btn sm" onClick={() => setEdit({ p: x, v: initial(x) })}>{hasRule(x) ? 'تعديل' : 'إعداد'}</button>
                    {hasRule(x) && <button type="button" className="btn sm dng" onClick={() => clear(x)}>إلغاء</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {edit && (
        <Modal
          wide t={`${title}: ${edit.p.title}`} x={() => setEdit(null)}
          foot={<><button type="button" className="btn" onClick={() => setEdit(null)}>إلغاء</button><button type="button" className="btn p" disabled={busy} onClick={save}>{busy ? '...' : 'حفظ'}</button></>}
        >
          {children({ v: edit.v, set: (k, val) => setEdit((e) => ({ ...e, v: { ...e.v, [k]: val } })), setAll: (v) => setEdit((e) => ({ ...e, v })), product: edit.p, products: p.rows, cur })}
        </Modal>
      )}
    </>
  );
}

/* ====================== Cross Selling ====================== */
export function CrossScreen() {
  return (
    <>
      <ConfigForm
        section="cross" title="Cross Selling" desc="اقترح منتجات مكمّلة للعميل في صفحة المنتج والسلة. اختر المنتجات المقترحة لكل منتج بالأسفل."
        fields={[
          { k: 'show_on_product', l: 'صفحة المنتج', type: 'toggle', text: 'إظهار «كمّل طلبك» في صفحة المنتج' },
          { k: 'show_in_cart', l: 'السلة', type: 'toggle', text: 'إظهار الاقتراحات في السلة' },
          { k: 'title', l: 'عنوان القسم' },
          { k: 'max_items', l: 'أقصى عدد اقتراحات', type: 'number', min: 1, max: 8 },
        ]}
      />
      <div style={{ height: 18 }} />
      <ProductRules
        title="المنتجات المقترحة لكل منتج" cols="المقترحات" emptyIcon="🔗"
        hasRule={(x) => Array.isArray(x.cross_sell) && x.cross_sell.length > 0}
        summary={(x, p) => <span>{x.cross_sell.map((id) => (p.byId[String(id)] || {}).title).filter(Boolean).join('، ') || `${x.cross_sell.length} منتج`}</span>}
        initial={(x) => ({ ids: (x.cross_sell || []).map(String) })}
        build={(v) => ({ cross_sell: v ? v.ids : [] })}
        validate={(v) => (v.ids.length ? '' : 'اختر منتجاً واحداً على الأقل أو اضغط إلغاء')}
      >
        {({ v, set, product, products }) => (
          <Field l="المنتجات المقترحة (حتى 12)"><MultiProductPick products={products} value={v.ids} onChange={(ids) => set('ids', ids)} exclude={[String(product.id)]} /></Field>
        )}
      </ProductRules>
    </>
  );
}

/* ====================== Order Bump ====================== */
export function BumpScreen() {
  return (
    <ProductRules
      title="عرض قبل التأكيد (Order Bump)" cols="العرض" emptyIcon="🎁"
      desc="يظهر للعميل قبل زر الطلب: «أضف هذا المنتج بخصم». يظهر فقط لو المنتج المقترح بدون خيارات (مقاس/لون)."
      hasRule={(x) => !!(x.upsell && x.upsell.product_id)}
      summary={(x, p) => <span>{(p.byId[String(x.upsell.product_id)] || {}).title || 'منتج محذوف'} <Badge c="#0a7f86">خصم {Number(x.upsell.percent) || 0}%</Badge></span>}
      initial={(x) => ({ product_id: '', percent: 10, text: '', ...(x.upsell && typeof x.upsell === 'object' ? x.upsell : {}) })}
      build={(v) => ({ upsell: v && v.product_id ? { product_id: String(v.product_id), percent: Math.min(90, Math.max(0, asNumber(v.percent))), text: String(v.text || '').trim().slice(0, 120) } : {} })}
      validate={(v) => (v.product_id ? '' : 'اختر المنتج المقترح')}
    >
      {({ v, set, product, products, cur }) => {
        const pool = products.filter((x) => String(x.id) !== String(product.id) && (x.status || 'active') === 'active' && !(Array.isArray(x.variants) && x.variants.length));
        const t = products.find((x) => String(x.id) === String(v.product_id));
        const price = t ? Math.round((Number(t.price) || 0) * (1 - (asNumber(v.percent) / 100))) : 0;
        return (
          <div className="fgrid">
            <Field l="المنتج المقترح" full><ProductSelect products={pool} value={v.product_id} onChange={(id) => set('product_id', id)} placeholder="اختر منتجاً بدون خيارات" /></Field>
            <Field l="نسبة الخصم %"><input className="in num" type="number" min="0" max="90" value={v.percent} onChange={(e) => set('percent', e.target.value)} /></Field>
            <Field l="نص العرض (اختياري)"><input className="in" maxLength={120} placeholder="أضف الكابل بخصم خاص!" value={v.text} onChange={(e) => set('text', e.target.value)} /></Field>
            {t && <div className="pv" style={{ gridColumn: '1/-1' }}><b>معاينة</b><span>{v.text || `أضف ${t.title}`} — <b>{money(price, cur)}</b> <s className="mut">{money(t.price, cur)}</s></span></div>}
          </div>
        );
      }}
    </ProductRules>
  );
}

/* ====================== عروض الكمية ====================== */
export function OffersScreen() {
  return (
    <ProductRules
      title="عروض الكمية (اشترِ أكثر ووفّر)" cols="العروض" emptyIcon="📦"
      desc="مثال: اشترِ 2 بخصم 10%، أو 3 بسعر 500 للقطعة. العميل يرى التوفير في صفحة المنتج، والسيرفر هو من يحسب السعر النهائي."
      hasRule={(x) => Array.isArray(x.offers) && x.offers.length > 0}
      summary={(x) => <span>{x.offers.map((o) => `${o.qty}+ ${o.percent ? `${o.percent}%` : `${o.total} للقطعة`}`).join(' · ')}</span>}
      initial={(x) => ({ rows: (Array.isArray(x.offers) && x.offers.length ? x.offers : [{ qty: 2, percent: 10 }]).map((o) => ({ qty: o.qty, kind: o.total ? 'total' : 'percent', value: o.total || o.percent || '', label: o.label || '' })) })}
      build={(v) => ({
        offers: v ? v.rows.filter((r) => asNumber(r.qty) >= 2 && asNumber(r.value) > 0).sort((a, b) => a.qty - b.qty)
          .map((r) => ({ qty: Math.floor(asNumber(r.qty)), [r.kind]: asNumber(r.value), label: String(r.label || '').trim().slice(0, 40) })) : [],
      })}
      validate={(v) => {
        const rs = v.rows.filter((r) => r.qty !== '' || r.value !== '');
        if (!rs.length) return 'أضف عرضاً واحداً على الأقل أو اضغط إلغاء';
        const seen = new Set();
        for (const r of rs) {
          const q = asNumber(r.qty); const val = asNumber(r.value);
          if (q < 2 || !Number.isInteger(q)) return 'الكمية لازم تكون رقماً صحيحاً 2 أو أكثر';
          if (seen.has(q)) return 'لا تكرر نفس الكمية';
          seen.add(q);
          if (!(val > 0)) return 'اكتب قيمة العرض';
          if (r.kind === 'percent' && val > 90) return 'نسبة الخصم لا تزيد عن 90%';
        }
        return '';
      }}
    >
      {({ v, set, product, cur }) => {
        const rows = v.rows;
        const upd = (i, k, val) => set('rows', rows.map((r, j) => (j === i ? { ...r, [k]: val } : r)));
        const prev = [2, 3, 5].map((q) => {
          const offers = rows.filter((r) => asNumber(r.value) > 0).map((r) => ({ qty: asNumber(r.qty), [r.kind]: asNumber(r.value) }));
          const o = applyOffer(Number(product.price) || 0, q, offers);
          return [q, o];
        });
        return (
          <>
            {rows.map((r, i) => (
              <div className="row" key={i} style={{ alignItems: 'flex-end' }}>
                <Field l="من كمية"><input className="in num" type="number" min="2" style={{ width: 90 }} value={r.qty} onChange={(e) => upd(i, 'qty', e.target.value)} /></Field>
                <Field l="النوع">
                  <select className="in" value={r.kind} onChange={(e) => upd(i, 'kind', e.target.value)}>
                    <option value="percent">خصم %</option><option value="total">سعر القطعة</option>
                  </select>
                </Field>
                <Field l={r.kind === 'percent' ? 'النسبة %' : `سعر القطعة (${cur})`}><input className="in num" type="number" min="0" style={{ width: 110 }} value={r.value} onChange={(e) => upd(i, 'value', e.target.value)} /></Field>
                <Field l="شارة (اختياري)"><input className="in" maxLength={40} placeholder="الأكثر توفيراً" value={r.label} onChange={(e) => upd(i, 'label', e.target.value)} /></Field>
                <button type="button" className="btn sm dng" onClick={() => set('rows', rows.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
            <button type="button" className="btn sm" onClick={() => set('rows', [...rows, { qty: '', kind: 'percent', value: '', label: '' }])}>+ عرض</button>
            <div className="pv" style={{ marginTop: 12 }}>
              <b>معاينة (سعر المنتج {money(product.price, cur)})</b>
              {prev.map(([q, o]) => <span key={q}>{q} قطع = <b>{money(o.total, cur)}</b>{o.saved > 0 && <Badge c="#16a34a">وفّر {money(o.saved, cur)}</Badge>}</span>)}
            </div>
          </>
        );
      }}
    </ProductRules>
  );
}

/* ====================== الكوبونات ====================== */
const KIND = { percent: 'نسبة %', fixed: 'مبلغ ثابت', free_ship: 'شحن مجاني' };

export function CouponsScreen() {
  const { cur } = useDash();
  const state = (r) => {
    const now = Date.now();
    if (r.enabled === false) return ['موقوف', '#718096'];
    if (r.ends_at && new Date(r.ends_at).getTime() < now) return ['منتهي', '#dc2626'];
    if (r.starts_at && new Date(r.starts_at).getTime() > now) return ['لم يبدأ', '#d97706'];
    if (r.max_uses && r.uses >= r.max_uses) return ['استُنفد', '#dc2626'];
    return ['ساري', '#16a34a'];
  };
  return (
    <Crud
      table="store_coupons" noun="كوبون" title="الكوبونات" toggleKey="enabled"
      desc="أكواد خصم يكتبها العميل في صفحة الطلب. الاستخدام يُحسب ويُحدَّث تلقائياً من السيرفر."
      search={(r) => r.code}
      defaults={{ kind: 'percent', value: 10, min_order: 0, enabled: true }}
      columns={[
        { l: 'الكود', render: (r) => <b className="num" dir="ltr">{r.code}</b> },
        { l: 'الخصم', render: (r) => (r.kind === 'free_ship' ? 'شحن مجاني' : r.kind === 'percent' ? `${r.value}%` : money(r.value, cur)) },
        { l: 'حد أدنى', render: (r) => (Number(r.min_order) ? money(r.min_order, cur) : '—') },
        { l: 'الاستخدام', render: (r) => <span className="num">{r.uses || 0}{r.max_uses ? ` / ${r.max_uses}` : ''}</span> },
        { l: 'الحالة', render: (r) => { const [t, c] = state(r); return <Badge c={c}>{t}</Badge>; } },
      ]}
      fields={[
        { k: 'code', l: 'كود الخصم', type: 'ltr', upper: true, ph: 'RAMADAN10', hint: 'حروف إنجليزية وأرقام فقط' },
        { k: 'kind', l: 'نوع الخصم', type: 'select', options: Object.entries(KIND) },
        { k: 'value', l: 'قيمة الخصم', type: 'number', min: 0, showIf: (d) => d.kind !== 'free_ship', hint: 'نسبة % أو مبلغ بالجنيه حسب النوع' },
        { k: 'min_order', l: 'الحد الأدنى للطلب', type: 'number', min: 0 },
        { k: 'max_uses', l: 'أقصى عدد استخدامات (فارغ = بلا حد)', type: 'number', min: 1 },
        { k: 'starts_at', l: 'يبدأ في', type: 'datetime' },
        { k: 'ends_at', l: 'ينتهي في', type: 'datetime' },
      ]}
      validate={(e) => {
        if (!/^[A-Z0-9_-]{3,20}$/.test(String(e.code || '').trim().toUpperCase())) return 'الكود من 3 إلى 20 حرفاً إنجليزياً أو رقماً';
        if (e.kind !== 'free_ship') {
          const v = Number(e.value);
          if (!(v > 0)) return 'اكتب قيمة الخصم';
          if (e.kind === 'percent' && v > 100) return 'النسبة لا تزيد عن 100%';
        }
        if (e.starts_at && e.ends_at && new Date(e.ends_at) <= new Date(e.starts_at)) return 'تاريخ الانتهاء لازم يكون بعد البداية';
        return '';
      }}
      transform={(e) => ({
        ...e, code: String(e.code).trim().toUpperCase(), value: e.kind === 'free_ship' ? 0 : Number(e.value), min_order: Number(e.min_order) || 0,
        max_uses: e.max_uses === '' || e.max_uses == null ? null : Math.floor(Number(e.max_uses)), starts_at: e.starts_at || null, ends_at: e.ends_at || null,
      })}
    />
  );
}

/* ====================== إعادة الاستهداف ====================== */
export function RetargetScreen() {
  return (
    <ConfigForm
      section="retarget" title="إعادة الاستهداف" desc="رسائل تعيد العملاء الذين زاروا متجرك أو تركوا طلبهم. رسالة الواتساب تُرسل يدوياً من «الطلبات المفقودة»."
      fields={[
        { k: 'welcome_back', l: 'ترحيب بالعائدين', type: 'toggle', text: 'إظهار رسالة ترحيب لمن زار المتجر من قبل' },
        { k: 'welcome_text', l: 'نص الترحيب', full: true },
        { k: 'cart_reminder', l: 'تذكير السلة', type: 'toggle', text: 'إظهار «لديك طلب غير مكتمل» للعميل العائد' },
        { k: 'coupon_code', l: 'كود خصم للمتروكين (اختياري)', type: 'ltr', upper: true, hint: 'يُضاف لرسالة الواتساب. أنشئه أولاً في «الكوبونات»' },
        { k: 'abandoned_msg', l: 'رسالة واتساب للطلبات المفقودة', type: 'textarea', rows: 4, hint: 'المتغيرات: {name} {store} {coupon_line} {link}' },
      ]}
      preview={(d) => (
        <div className="pv">
          <b>معاينة رسالة الواتساب</b>
          <div className="wabub" style={{ whiteSpace: 'pre-wrap' }}>{fillTemplate(d.abandoned_msg, { name: 'أحمد', store: 'متجري', link: 'https://…', coupon_line: d.coupon_code ? ` واستخدم كود ${d.coupon_code} لخصم إضافي` : '' })}</div>
        </div>
      )}
    />
  );
}

/* ====================== واتساب ====================== */
const TPL = [
  ['confirm', 'تأكيد الطلب', '{name} {order_no} {store} {total}'],
  ['shipped', 'تم الشحن', '{name} {order_no} {store} {tracking}'],
  ['abandoned', 'طلب مفقود', '{name} {store} {coupon_line}'],
  ['promo', 'عرض ترويجي', '{name} {store} {link}'],
  ['review', 'طلب تقييم', '{name} {store} {link}'],
];

function WaLog() {
  const t = useTable('store_wa_log', { order: 'created_at', limit: 200 });
  return (
    <div className="card tw">
      {t.loading ? <div className="c"><Spin /></div> : t.rows.length === 0 ? <Empty icon="💬" t="لا توجد رسائل مسجلة" d="تظهر هنا الرسائل التي تفتحها من الطلبات والطلبات المفقودة" /> : (
        <table className="tbl">
          <thead><tr><th>الرقم</th><th>القالب</th><th>الوقت</th></tr></thead>
          <tbody>{t.rows.map((r) => <tr key={r.id}><td className="num" dir="ltr" style={{ textAlign: 'start' }}>{r.phone}</td><td>{(TPL.find((x) => x[0] === r.template) || [])[1] || r.template}</td><td>{fdate(r.created_at)}</td></tr>)}</tbody>
        </table>
      )}
    </div>
  );
}

function WaTemplates() {
  const wa = useWa();
  const s = useSection('wa_templates');
  return (
    <>
      <div className="row"><SaveBtn s={s} /></div>
      <div style={{ display: 'grid', gap: 14 }}>
        {TPL.map(([k, name, vars]) => (
          <div className="card" key={k}>
            <b>{name}</b>
            <small className="mut num" dir="ltr" style={{ display: 'block', margin: '4px 0 8px', textAlign: 'start' }}>{vars}</small>
            <textarea className="in ta" rows={3} value={s.draft[k] ?? ''} onChange={(e) => s.set(k, e.target.value)} />
            <div className="wabub" style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{fillTemplate(s.draft[k], wa.vars({ name: 'أحمد علي', order_no: 1024, total: 350, tracking: 'BST123' }))}</div>
          </div>
        ))}
      </div>
    </>
  );
}

export function WaScreen() {
  const [tab, setTab] = useState('tpl');
  return (
    <>
      <PageHead title="WhatsApp Marketing" sub="رسائل واتساب حقيقية تُفتح بنقرة" />
      <p className="mut dsc">الرسائل تُفتح في واتساب بنص جاهز من القوالب، وتُسجَّل هنا. لا يوجد إرسال تلقائي (لحماية رقمك من الحظر).</p>
      <Tabs value={tab} onChange={setTab} tabs={[['tpl', 'قوالب الرسائل'], ['btn', 'زر واتساب في المتجر'], ['log', 'سجل الرسائل']]} />
      <div style={{ marginTop: 14 }}>
        {tab === 'tpl' && <WaTemplates />}
        {tab === 'log' && <WaLog />}
        {tab === 'btn' && <WaButton />}
      </div>
    </>
  );
}

function WaButton() {
  const { cfg, say } = useDash();
  const s = useSection('whatsapp');
  const validate = () => (s.draft.enabled && !String(cfg.contact?.whatsapp || '').replace(/\D/g, '') ? 'اكتب رقم واتساب المتجر أولاً من الإعدادات ← بيانات التواصل' : '');
  return (
    <div className="card">
      <div className="row"><SaveBtn s={s} validate={validate} /></div>
      <div className="fgrid">
        <Field l="الزر العائم" full><div className="tgrow"><Tog on={!!s.draft.enabled} set={(v) => s.set('enabled', v)} /><span>إظهار زر واتساب العائم في المتجر</span></div></Field>
        <Field l="في صفحة المنتج" full><div className="tgrow"><Tog on={!!s.draft.show_on_product} set={(v) => s.set('show_on_product', v)} /><span>زر «اسأل عن المنتج» في صفحة المنتج</span></div></Field>
        <Field l="رسالة افتتاحية" full><textarea className="in ta" rows={2} value={s.draft.message || ''} onChange={(e) => s.set('message', e.target.value)} /></Field>
      </div>
      <small className="hint">رقم واتساب الحالي: <b className="num" dir="ltr">{cfg.contact?.whatsapp || 'غير مضبوط'}</b></small>
    </div>
  );
}

/* ====================== توثيق الطلبات (Verify) + الحماية ====================== */
export function VerifyScreen() {
  const [tab, setTab] = useState('verify');
  return (
    <>
      <PageHead title="توثيق الطلبات (سبايك Verify)" sub="✦ حماية من الطلبات الوهمية" />
      <Tabs value={tab} onChange={setTab} tabs={[['verify', 'تأكيد بالواتساب'], ['protect', 'قواعد الحماية']]} />
      <div style={{ marginTop: 14 }}>
        {tab === 'verify' ? <VerifyForm /> : <ProtectForm />}
      </div>
    </>
  );
}

function VerifyForm() {
  const s = useSection('verify');
  return (
    <div className="card">
      <div className="row"><SaveBtn s={s} validate={(d) => (Number(d.threshold) < 1 || Number(d.threshold) > 100 ? 'حد الخطورة من 1 إلى 100' : '')} /></div>
      <div className="fgrid">
        <Field l="تمييز الطلبات المشبوهة" full><div className="tgrow"><Tog on={!!s.draft.flag_risk} set={(v) => s.set('flag_risk', v)} /><span>وسم الطلب بدرجة خطورة وإظهار زر «وثّق بالواتساب»</span></div></Field>
        <Field l="حد الخطورة (1-100)" hint="الطلب الذي تتجاوز درجته هذا الحد يُوسم «يحتاج توثيق»"><input className="in num" type="number" min="1" max="100" value={s.draft.threshold ?? ''} onChange={(e) => s.set('threshold', Number(e.target.value))} /></Field>
        <Field l="رسالة التوثيق" full hint="المتغيرات: {name} {order_no} {store}"><textarea className="in ta" rows={3} value={s.draft.message || ''} onChange={(e) => s.set('message', e.target.value)} /></Field>
      </div>
      <div className="pv"><b>كيف يعمل؟</b><span>تُحسب درجة خطورة لكل طلب (تكرار رقم، قيمة عالية، رقم غير منطقي...). من «كل الطلبات» تفتح رسالة التوثيق على الواتساب بنقرة وتغيّر الحالة بعد رد العميل.</span></div>
    </div>
  );
}

function ProtectForm() {
  const s = useSection('protection');
  const num = (k, l, hint, min = 0, max = 100000) => (
    <Field l={l} hint={hint}><input className="in num" type="number" min={min} max={max} value={s.draft[k] ?? ''} onChange={(e) => s.set(k, e.target.value === '' ? '' : Number(e.target.value))} /></Field>
  );
  return (
    <div className="card">
      <div className="row"><SaveBtn s={s} /></div>
      <div className="fgrid">
        <Field l="رقم الهاتف" full><div className="tgrow"><Tog on={s.draft.validate_phone !== false} set={(v) => s.set('validate_phone', v)} /><span>رفض الأرقام غير المصرية الصحيحة</span></div></Field>
        {num('block_duplicate_hours', 'منع تكرار الطلب (ساعات)', '0 = بدون منع. نفس الرقم لا يطلب نفس المنتج خلال هذه المدة', 0, 168)}
        {num('max_orders_per_phone_day', 'أقصى طلبات للرقم يومياً', '0 = بدون حد', 0, 50)}
        {num('min_fill_seconds', 'أقل وقت لملء النموذج (ثواني)', 'يرفض الروبوتات التي تملأ فوراً', 0, 30)}
        {num('flag_high_value', 'وسم الطلب مرتفع القيمة عند', 'طلب بقيمة أعلى يُوسم للمراجعة. 0 = إيقاف', 0, 1000000)}
      </div>
    </div>
  );
}

/* ====================== Google Merchant ====================== */
export function MerchantScreen() {
  const { storeUrl, slug } = useDash();
  const prods = useProducts();
  const active = prods.rows.filter((p) => (p.status || 'active') === 'active');
  const ok = (p) => p.title && Number(p.price) > 0 && Array.isArray(p.images) && p.images.length > 0;
  const bad = active.filter((p) => !ok(p));
  const origin = storeUrl ? storeUrl.replace(/\/shop\/.*$/, '') : '';
  const feed = slug && origin ? `${origin}/api/feed/${slug}` : '';
  return (
    <>
      <PageHead title="Google Merchant" sub="ظهور منتجاتك في جوجل شوبنج" />
      <div className="card">
        <h3>🔗 رابط الـ Feed</h3>
        <LinkBox url={feed} />
        <ol className="steps" style={{ marginTop: 14 }}>
          <li><span>ادخل على merchants.google.com وأنشئ حساباً وتحقق من دومين متجرك.</span></li>
          <li><span>من Products ← Feeds اختر «Scheduled fetch» والصق الرابط أعلاه بصيغة CSV.</span></li>
          <li><span>اضبط «العلامة التجارية» و«تصنيف جوجل» من شاشة Product Feed.</span></li>
        </ol>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>✅ جاهزية المنتجات</h3>
        {prods.loading ? <Spin /> : (
          <>
            <p><b>{active.length - bad.length}</b> من <b>{active.length}</b> منتج مكتمل البيانات (عنوان + سعر + صورة).</p>
            {bad.length > 0 && <ul>{bad.slice(0, 20).map((p) => <li key={p.id}>{p.title || 'بدون عنوان'} — {!p.images?.length ? 'ينقصه صورة ' : ''}{!(Number(p.price) > 0) ? 'ينقصه سعر' : ''}</li>)}</ul>}
          </>
        )}
        <small className="hint">لا نضمن قبول جوجل للمنتجات؛ القبول يخضع لسياساتها ومراجعتها.</small>
      </div>
    </>
  );
}

/* ====================== Sales Popup ====================== */
export function PopupScreen() {
  return (
    <ConfigForm
      section="popup" title="Sales Popup" desc="إشعارات صغيرة تُظهر مشتريات حقيقية حديثة من متجرك لزيادة الثقة. تُبنى من طلباتك الفعلية فقط."
      fields={[
        { k: 'enabled', l: 'التفعيل', type: 'toggle', text: 'إظهار إشعارات الشراء للزوار' },
        { k: 'position', l: 'المكان', type: 'select', options: [['bottom-start', 'أسفل اليمين'], ['bottom-end', 'أسفل اليسار']] },
        { k: 'delay', l: 'أول ظهور بعد (ثانية)', type: 'number', min: 1, max: 120 },
        { k: 'interval', l: 'الفاصل بين الإشعارات (ثانية)', type: 'number', min: 5, max: 300 },
        { k: 'max_per_visit', l: 'أقصى عدد في الزيارة', type: 'number', min: 1, max: 20 },
        { k: 'text', l: 'نص الإشعار', full: true, hint: 'المتغيرات: {name} {gov} {product} {ago}' },
      ]}
      preview={(d) => (
        <div className="pv"><b>معاينة</b><div className="wabub">{fillTemplate(d.text, { name: 'محمد', gov: 'القاهرة', product: 'منتج تجريبي', ago: '12 دقيقة' })}</div></div>
      )}
      validate={(d) => (d.enabled && !String(d.text || '').trim() ? 'اكتب نص الإشعار' : '')}
    />
  );
}

/* ====================== الحد الأدنى للشحن المجاني ====================== */
export function FreeShipScreen() {
  const { cur } = useDash();
  return (
    <ConfigForm
      section="shipping" title="الحد الأدنى للشحن المجاني" desc="الشحن يصبح مجانياً عندما يتجاوز إجمالي الطلب هذا المبلغ، ويظهر للعميل شريط تقدم يشجعه على زيادة طلبه."
      fields={[
        { k: 'free_over', l: `شحن مجاني فوق (${cur})`, type: 'number', min: 0, hint: '0 = إيقاف الشحن المجاني' },
        { k: 'show_progress', l: 'شريط التقدم', type: 'toggle', text: 'إظهار «باقي X للشحن المجاني» في السلة والطلب' },
      ]}
      preview={(d) => {
        const lim = Number(d.free_over) || 0;
        return (
          <div className="pv">
            <b>معاينة</b>
            {lim > 0 ? (
              <>
                <span>باقي <b>{money(Math.round(lim * 0.4), cur)}</b> للحصول على شحن مجاني 🚚</span>
                <div style={{ height: 8, borderRadius: 8, background: 'var(--ln, #e2e8f0)' }}><div style={{ width: '60%', height: '100%', borderRadius: 8, background: '#0a7f86' }} /></div>
              </>
            ) : <span className="mut">الشحن المجاني متوقف</span>}
          </div>
        );
      }}
    />
  );
}

/* ====================== Downsell ====================== */
export function DownsellScreen() {
  return (
    <ConfigForm
      section="downsell" title="Downsell" desc="عندما يهم العميل بالمغادرة تظهر له نافذة بكود خصم لإنقاذ الطلب. أنشئ الكود أولاً في «الكوبونات»."
      fields={[
        { k: 'enabled', l: 'التفعيل', type: 'toggle', text: 'إظهار نافذة الخصم قبل المغادرة' },
        { k: 'trigger', l: 'متى تظهر؟', type: 'select', options: [['exit', 'عند محاولة المغادرة / زر الرجوع'], ['time', 'بعد وقت في صفحة الطلب']] },
        { k: 'delay_seconds', l: 'بعد كم ثانية', type: 'number', min: 5, max: 300, showIf: (d) => d.trigger === 'time' },
        { k: 'coupon_code', l: 'كود الخصم', type: 'ltr', upper: true },
        { k: 'title', l: 'العنوان', full: true },
        { k: 'body', l: 'النص', type: 'textarea', rows: 3 },
      ]}
      validate={(d) => (d.enabled && !String(d.coupon_code || '').trim() ? 'اكتب كود الخصم أو أوقف الميزة' : '')}
      preview={(d) => (
        <div className="pv" style={{ textAlign: 'center' }}>
          <b>{d.title}</b><p style={{ margin: 0 }}>{d.body}</p>
          {d.coupon_code && <span className="btn p num" dir="ltr">{d.coupon_code}</span>}
        </div>
      )}
    />
  );
}

/* ====================== عدّاد الندرة ====================== */
export function ScarcityScreen() {
  return (
    <ConfigForm
      section="scarcity" title="عدّاد الندرة" desc="يظهر «باقي X قطع» عندما يقل المخزون الفعلي للمنتج عن الحد. يعمل فقط للمنتجات التي فعّلت لها تتبع المخزون."
      fields={[
        { k: 'enabled', l: 'التفعيل', type: 'toggle', text: 'إظهار عدّاد المخزون المتبقي' },
        { k: 'threshold', l: 'يظهر عندما يتبقى أقل من', type: 'number', min: 1, max: 100 },
        { k: 'text', l: 'النص', full: true, hint: 'استخدم {n} لعدد القطع المتبقية' },
      ]}
      validate={(d) => (d.enabled && !String(d.text || '').includes('{n}') ? 'النص لازم يحتوي على {n}' : '')}
      preview={(d) => (
        <div className="pv"><b>معاينة</b><Badge c="#dc2626">🔥 {fillTemplate(d.text, { n: Math.max(1, (Number(d.threshold) || 5) - 1) })}</Badge></div>
      )}
    />
  );
}
