'use client';
import React, { useMemo, useRef, useState } from 'react';
import { useDash, PageHead, Modal, Field, Empty, Spin, Tabs, Pager, useDebounced, Badge, Stat, Tog } from '../ui';
import { useTable, useProducts, uploadAsset } from '../hooks';
import { Crud, ConfigForm, FieldsGrid } from '../forms';
import { fromLocalInput, toLocalInput } from '../forms';
import { LinkBox, MultiProductPick, asNumber } from '../bits';
import { downloadCsvFile, fday, fdate } from '../shared';
import { money, toCSV, parseCSV, saleActive, applyOffer } from '../../../lib/storeKit';
import { supabase } from '../../../lib/supabase';
import { readTableFile } from '../../../lib/xlsxRead';
import { parseProductRows, planImport, insertPayload, updatePatch, TEMPLATE_HEAD, TEMPLATE_ROWS } from '../../../lib/productImport';

const PER = 20;
const PRODUCT_COPY_FIELDS = ['title', 'description', 'price', 'compare_price', 'cost_price', 'category_id', 'featured', 'track_stock', 'stock_quantity', 'images', 'variants', 'offers', 'upsell', 'cross_sell', 'sort_order'];

const stockOf = (p) => (p.track_stock === false ? null : Number(p.stock_quantity) || 0);

/* ====================== معرض الصور ====================== */
function Gallery({ value, onChange }) {
  const { uid, say } = useDash();
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState('');
  const list = Array.isArray(value) ? value : [];

  const pick = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setBusy(true);
    const added = [];
    for (const f of files.slice(0, 8)) {
      if (!/^image\//.test(f.type)) { say('تم تجاهل ملف ليس صورة'); continue; }
      try { const r = await uploadAsset(uid, f, 'products'); added.push(r.url); } catch (err) { say(err.message || 'تعذر الرفع'); }
    }
    setBusy(false);
    if (added.length) onChange([...list, ...added].slice(0, 10));
  };
  const addUrl = () => {
    const u = url.trim();
    if (!/^https?:\/\//i.test(u)) { say('اكتب رابط صورة يبدأ بـ https://'); return; }
    onChange([...list, u].slice(0, 10));
    setUrl('');
  };
  const makeFirst = (i) => onChange([list[i], ...list.filter((_, k) => k !== i)]);
  const makeBack = (i) => { const rest = list.filter((_, k) => k !== i); onChange([rest[0], list[i], ...rest.slice(1)].filter(Boolean)); };
  const slotHint = (n) => (n === 0 ? 'وجه المنتج' : 'ظهر المنتج');

  return (
    <div>
      <div className="gal">
        {list.map((u, i) => (
          <div key={u + i} className={'gi' + (i === 0 ? ' first' : i === 1 ? ' back' : '')}>
            <img src={u} alt="" onClick={() => i > 0 && makeFirst(i)} title={i > 0 ? 'اضغط لجعلها وجه المنتج (الصورة الرئيسية)' : ''} style={{ cursor: i > 0 ? 'pointer' : 'default' }} />
            <button type="button" onClick={() => onChange(list.filter((_, k) => k !== i))} aria-label="حذف">✕</button>
            {i > 1 && <button type="button" className="mkb" onClick={() => makeBack(i)} title="اجعلها ظهر المنتج" aria-label="اجعلها ظهر المنتج">ظهر</button>}
          </div>
        ))}
        {list.length < 2 && Array.from({ length: 2 - list.length }).map((_, k) => (
          <button key={'ph' + k} type="button" className="add slot" disabled={busy} onClick={() => ref.current?.click()}>
            <span>{busy ? '...' : '+'}</span><small>{slotHint(list.length + k)}</small>
          </button>
        ))}
        {list.length >= 2 && list.length < 10 && <button type="button" className="add" disabled={busy} onClick={() => ref.current?.click()}>{busy ? '...' : '+'}</button>}
      </div>
      <input ref={ref} type="file" accept="image/*" multiple hidden onChange={pick} />
      <div className="row" style={{ marginTop: 10, marginBottom: 0 }}>
        <input className="in num" dir="ltr" placeholder="أو الصق رابط صورة https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
        <button type="button" className="btn sm" onClick={addUrl}>إضافة الرابط</button>
      </div>
      <small className="hint">الصورة الأولى = <b>وجه المنتج</b> (الرئيسية). الصورة الثانية = <b>ظهر المنتج</b>: لما العميل يضغط على المنتج في المتجر بيلف ويظهر الظهر، وضغطة تانية ترجعه للوجه. اضغط أي صورة لتصبح الوجه، أو زر «ظهر» لتصبح الظهر. حتى 10 صور.</small>
    </div>
  );
}

/* صورة لكل قيمة خيار (مثلاً صورة المنتج بكل لون). العميل بيضغط اللون فتظهر صورته. */
const valuesOf = (text) => [...new Set(String(text || '').split(/[,،\n]/).map((s) => s.trim()).filter(Boolean))];
function ValueImages({ values, map, onChange, isColor }) {
  const { uid, say } = useDash();
  const [open, setOpen] = useState(() => Object.keys(map || {}).length > 0 || isColor);
  const [busyV, setBusyV] = useState('');
  const refs = useRef({});
  if (!values.length) return null;
  const upload = async (v, f) => {
    if (!f) return;
    if (!/^image\//.test(f.type)) { say('الملف ليس صورة'); return; }
    setBusyV(v);
    try { const r = await uploadAsset(uid, f, 'products'); onChange({ ...(map || {}), [v]: r.url }); } catch (err) { say(err.message || 'تعذر الرفع'); }
    setBusyV('');
  };
  if (!open) return <button type="button" className="btn sm" style={{ margin: '-4px 0 12px' }} onClick={() => setOpen(true)}>🖼 صورة لكل قيمة (مثلاً لكل لون)</button>;
  return (
    <div className="vimg" style={{ marginBottom: 14 }}>
      <small className="hint" style={{ display: 'block', marginBottom: 8 }}>{isColor ? '🎨 ارفع صورة المنتج بكل لون. لما العميل يضغط على اللون بتظهر صورته.' : 'ارفع صورة لكل قيمة (اختياري). لما العميل يختارها بتظهر صورتها.'}</small>
      <div className="vimg-g">
        {values.map((v) => {
          const u = (map || {})[v];
          return (
            <div className="vimg-i" key={v}>
              <button type="button" className={'vimg-p' + (u ? ' has' : '')} disabled={busyV === v} onClick={() => refs.current[v]?.click()} aria-label={`صورة ${v}`}>
                {u ? <img src={u} alt={v} /> : <span>{busyV === v ? '...' : '+'}</span>}
              </button>
              {u && <button type="button" className="vimg-x" aria-label={`حذف صورة ${v}`} onClick={() => { const m = { ...(map || {}) }; delete m[v]; onChange(m); }}>✕</button>}
              <b>{v}</b>
              <input ref={(el) => { refs.current[v] = el; }} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; upload(v, f); }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ====================== محرر المنتج ====================== */
function ProductEditor({ product, cats, products, api, onClose }) {
  const { say, cur } = useDash();
  const isNew = !!product._new;
  const [tab, setTab] = useState('basic');
  const [busy, setBusy] = useState(false);
  const [p, setP] = useState(() => ({
    title: '', description: '', price: '', compare_price: '', cost_price: '', sku: '', category_id: '', status: 'active', featured: false,
    track_stock: true, stock_quantity: 100, sale_ends_at: null, sort_order: 0,
    ...product,
    compare_price: product.compare_price || '',
    category_id: product.category_id ? String(product.category_id) : '',
    sku: product.sku || '',
    description: product.description || '',
  }));
  const [images, setImages] = useState(() => (Array.isArray(product.images) ? product.images : []));
  const [groups, setGroups] = useState(() => (Array.isArray(product.variants) ? product.variants : []).map((g) => ({ stock: g.stock && typeof g.stock === 'object' ? g.stock : {}, prices: g.prices && typeof g.prices === 'object' ? g.prices : {}, imgs: g.images && typeof g.images === 'object' ? g.images : {}, name: g.name || '', text: (g.values || []).join('، ') })));
  const [offers, setOffers] = useState(() => (Array.isArray(product.offers) ? product.offers : []).map((o) => (
    o.percent ? { qty: o.qty, mode: 'percent', value: o.percent, label: o.label || '' } : { qty: o.qty, mode: 'total', value: o.total, label: o.label || '' }
  )));
  const [up, setUp] = useState(() => ({ product_id: '', percent: 10, text: '', ...(product.upsell && typeof product.upsell === 'object' ? product.upsell : {}) }));
  const [cross, setCross] = useState(() => (Array.isArray(product.cross_sell) ? product.cross_sell.map(String) : []));
  const set = (k, v) => setP((x) => ({ ...x, [k]: v }));

  const price = asNumber(p.price);
  const selfId = product.id ? String(product.id) : '';
  const bumpChoices = products.filter((x) => String(x.id) !== selfId && (x.status || 'active') === 'active' && !(Array.isArray(x.variants) && x.variants.length));

  const save = async () => {
    const title = String(p.title || '').trim();
    if (title.length < 2) { setTab('basic'); say('اكتب اسم المنتج'); return; }
    if (!(price > 0)) { setTab('basic'); say('اكتب سعراً صحيحاً أكبر من صفر'); return; }
    const cmp = asNumber(p.compare_price);
    if (cmp && cmp <= price) { setTab('basic'); say('سعر المقارنة لازم يكون أكبر من سعر البيع'); return; }

    const variants = [];
    for (const g of groups) {
      const name = String(g.name || '').trim();
      const values = [...new Set(String(g.text || '').split(/[,،\n]/).map((s) => s.trim()).filter(Boolean))];
      if (!name && !values.length) continue;
      if (!name || values.length < 1) { setTab('variants'); say('كل خيار لازم له اسم وقيمة واحدة على الأقل'); return; }
      const images = {};
      for (const v of values) if (/^https?:\/\//i.test((g.imgs || {})[v] || '')) images[v] = g.imgs[v];
      const prices = {};
      for (const v of values) {
        const raw = (g.prices || {})[v];
        if (raw === undefined || raw === '' || raw === null) continue;
        const n = asNumber(raw);
        if (!(n > 0)) { setTab('variants'); say(`سعر «${v}» لازم يكون رقم أكبر من صفر (أو سيبه فاضي)`); return; }
        prices[v] = n;
      }
      const stock = {};
      for (const v of values) {
        const raw = (g.stock || {})[v];
        if (raw === undefined || raw === '' || raw === null) continue;
        const n = Math.floor(Number(raw));
        if (!(n >= 0)) { setTab('variants'); say(`مخزون «${v}» لازم يكون رقم صفر أو أكتر (أو سيبه فاضي)`); return; }
        stock[v] = n;
      }
      const vg = { name, values };
      if (Object.keys(stock).length) vg.stock = stock;
      if (Object.keys(images).length) vg.images = images;
      if (Object.keys(prices).length) vg.prices = prices;
      variants.push(vg);
    }
    const cleanOffers = [];
    for (const o of offers) {
      const qty = parseInt(o.qty, 10);
      const val = asNumber(o.value);
      if (!qty && !val) continue;
      if (!(qty >= 2) || !(val > 0)) { setTab('offers'); say('كل عرض كمية: العدد 2 أو أكثر، والقيمة أكبر من صفر'); return; }
      if (o.mode === 'percent') {
        if (val > 90) { setTab('offers'); say('أقصى خصم 90%'); return; }
        cleanOffers.push({ qty, percent: val, label: String(o.label || '').trim() || `اشترِ ${qty} ووفّر ${val}%` });
      } else {
        cleanOffers.push({ qty, total: val, label: String(o.label || '').trim() || `${qty} بـ ${val} ${cur}` });
      }
    }
    cleanOffers.sort((a, b) => a.qty - b.qty);
    const upsell = up.product_id ? { product_id: String(up.product_id), percent: Math.min(90, Math.max(0, asNumber(up.percent))), text: String(up.text || '').trim().slice(0, 120) } : {};

    const row = {
      title, description: String(p.description || '').trim(), price, compare_price: cmp || null, cost_price: asNumber(p.cost_price),
      sku: String(p.sku || '').trim() || null, category_id: p.category_id || null, status: p.status, featured: !!p.featured,
      track_stock: !!p.track_stock, stock_quantity: Math.max(0, parseInt(p.stock_quantity, 10) || 0),
      sale_ends_at: cmp ? (p.sale_ends_at || null) : null, sort_order: parseInt(p.sort_order, 10) || 0,
      images, variants, offers: cleanOffers, upsell, cross_sell: cross.filter((x) => x !== selfId),
    };
    setBusy(true);
    const res = isNew ? await api.insert(row) : await api.update(product.id, row);
    setBusy(false);
    if (res) { say(isNew ? '✅ تمت إضافة المنتج' : '✅ تم حفظ المنتج'); onClose(); }
  };

  return (
    <Modal
      wide t={isNew ? 'منتج جديد' : `تعديل: ${product.title}`} x={onClose}
      foot={<><button type="button" className="btn" onClick={onClose}>إلغاء</button><button type="button" className="btn p" disabled={busy} onClick={save}>{busy ? '...' : 'حفظ المنتج'}</button></>}
    >
      <Tabs value={tab} onChange={setTab} tabs={[['basic', 'الأساسيات'], ['images', `الصور (${images.length})`], ['variants', `الخيارات (${groups.length})`], ['offers', `عروض الكمية (${offers.length})`], ['upsell', 'Order Bump والكروس'], ['stock', 'المخزون']]} />

      {tab === 'basic' && (
        <div className="fgrid">
          <Field l="اسم المنتج" full><input className="in" value={p.title} onChange={(e) => set('title', e.target.value)} /></Field>
          <Field l="الوصف" full><textarea className="in ta" rows={5} value={p.description} onChange={(e) => set('description', e.target.value)} placeholder="اكتب مميزات المنتج وطريقة الاستخدام..." /></Field>
          <Field l={`سعر البيع (${cur})`}><input className="in num" type="number" min="0" value={p.price} onChange={(e) => set('price', e.target.value)} /></Field>
          <Field l={`سعر قبل الخصم (${cur})`} hint="اختياري. يظهر مشطوباً في المتجر"><input className="in num" type="number" min="0" value={p.compare_price} onChange={(e) => set('compare_price', e.target.value)} /></Field>
          {asNumber(p.compare_price) > price && (
            <Field l="ينتهي العرض في" hint="بعدها يرجع السعر تلقائياً لسعر ما قبل الخصم"><input className="in num" type="datetime-local" value={toLocalInput(p.sale_ends_at)} onChange={(e) => set('sale_ends_at', fromLocalInput(e.target.value))} /></Field>
          )}
          <Field l={`سعر التكلفة (${cur})`} hint="لحساب الأرباح. لا يظهر للعميل"><input className="in num" type="number" min="0" value={p.cost_price} onChange={(e) => set('cost_price', e.target.value)} /></Field>
          <Field l="كود المنتج SKU"><input className="in num" dir="ltr" value={p.sku} onChange={(e) => set('sku', e.target.value)} /></Field>
          <Field l="القسم">
            <select className="in" value={p.category_id} onChange={(e) => set('category_id', e.target.value)}>
              <option value="">بدون قسم</option>
              {cats.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </select>
          </Field>
          <Field l="الحالة">
            <select className="in" value={p.status} onChange={(e) => set('status', e.target.value)}>
              <option value="active">نشط (ظاهر في المتجر)</option>
              <option value="draft">مسودة (مخفي)</option>
            </select>
          </Field>
          <Field l="ترتيب الظهور" hint="الأصغر يظهر أولاً"><input className="in num" type="number" value={p.sort_order} onChange={(e) => set('sort_order', e.target.value)} /></Field>
          <Field l="منتج مميز" full><div className="tgrow"><Tog on={p.featured} set={(v) => set('featured', v)} /><span>يظهر في قسم «منتجات مميزة» بالصفحة الرئيسية</span></div></Field>
        </div>
      )}

      {tab === 'images' && <Gallery value={images} onChange={setImages} />}

      {tab === 'variants' && (
        <div>
          <p className="mut dsc">أضف خيارات مثل المقاس واللون. العميل لازم يختار كل خيار قبل الطلب. افصل القيم بفاصلة.</p>
          {groups.map((g, i) => (
            <React.Fragment key={i}>
            <div className="row">
              <input className="in" style={{ maxWidth: 160 }} placeholder="اسم الخيار (المقاس)" value={g.name} onChange={(e) => setGroups((gs) => gs.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} />
              <input className="in" style={{ flex: 3 }} placeholder="S، M، L، XL" value={g.text} onChange={(e) => setGroups((gs) => gs.map((x, k) => (k === i ? { ...x, text: e.target.value } : x)))} />
              <button type="button" className="btn sm dng" onClick={() => setGroups((gs) => gs.filter((_, k) => k !== i))}>✕</button>
            </div>
              {valuesOf(g.text).length > 0 && (
                <div className="vprice" style={{ margin: '-2px 0 14px', padding: 10, border: '1px dashed var(--bd, #ccc)', borderRadius: 10 }}>
                  <small className="hint" style={{ display: 'block', marginBottom: 8 }}>💰 سعر ومخزون خاص لكل قيمة (اختياري). أول خانة = المخزون (0 = نفد)، التانية = السعر. سيب الخانة فاضية وهياخد السعر الأساسي ({money(asNumber(price) || 0, cur)}).</small>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {valuesOf(g.text).map((v) => (
                      <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                        <b style={{ minWidth: 28 }}>{v}</b>
                        <input className="in" inputMode="numeric" style={{ width: 74, fontSize: 16 }} placeholder="مخزون" aria-label={`مخزون ${v}`} value={(g.stock || {})[v] ?? ''}
                          onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); setGroups((gs) => gs.map((x, k) => (k === i ? { ...x, stock: { ...(x.stock || {}), [v]: val } } : x))); }} />
                        <input className="in" inputMode="decimal" style={{ width: 90, fontSize: 16 }} placeholder={String(asNumber(price) || '')} value={(g.prices || {})[v] ?? ''}
                          onChange={(e) => { const val = e.target.value; setGroups((gs) => gs.map((x, k) => (k === i ? { ...x, prices: { ...(x.prices || {}), [v]: val } } : x))); }} />
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <ValueImages values={valuesOf(g.text)} map={g.imgs || {}} isColor={/لون|الوان|ألوان|color|colour/i.test(g.name || '')} onChange={(m) => setGroups((gs) => gs.map((x, k) => (k === i ? { ...x, imgs: m } : x)))} />
            </React.Fragment>
          ))}
          {groups.length < 3 && <button type="button" className="btn sm" onClick={() => setGroups((gs) => [...gs, { name: '', text: '', imgs: {}, prices: {}, stock: {} }])}>+ إضافة خيار</button>}
          {groups.length > 0 && <small className="hint" style={{ marginTop: 10 }}>ملاحظة: المنتج اللي له خيارات لا يصلح كـ Order Bump. لو أكتر من خيار له سعر خاص، بيتطبق الأعلى.</small>}
        </div>
      )}

      {tab === 'offers' && (
        <div>
          <p className="mut dsc">اعرض خصم لما العميل يشتري أكثر: «اشترِ 2 ووفّر 10%» أو «3 بـ 500». يتحسب السعر من السيرفر.</p>
          {offers.map((o, i) => {
            const demo = o.qty && o.value ? applyOffer(price, parseInt(o.qty, 10) || 0, [o.mode === 'percent' ? { qty: parseInt(o.qty, 10), percent: asNumber(o.value) } : { qty: parseInt(o.qty, 10), total: asNumber(o.value) }]) : null;
            return (
              <div className="row" key={i}>
                <Field l="العدد"><input className="in num" type="number" min="2" value={o.qty} onChange={(e) => setOffers((os) => os.map((x, k) => (k === i ? { ...x, qty: e.target.value } : x)))} /></Field>
                <Field l="نوع العرض">
                  <select className="in" value={o.mode} onChange={(e) => setOffers((os) => os.map((x, k) => (k === i ? { ...x, mode: e.target.value } : x)))}>
                    <option value="percent">خصم %</option>
                    <option value="total">سعر الباقة</option>
                  </select>
                </Field>
                <Field l={o.mode === 'percent' ? 'نسبة الخصم %' : `سعر الباقة (${cur})`}><input className="in num" type="number" min="0" value={o.value} onChange={(e) => setOffers((os) => os.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)))} /></Field>
                <Field l="النص (اختياري)"><input className="in" value={o.label} onChange={(e) => setOffers((os) => os.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} /></Field>
                <button type="button" className="btn sm dng" onClick={() => setOffers((os) => os.filter((_, k) => k !== i))}>✕</button>
                {demo && demo.saved > 0 && <small className="ok" style={{ flexBasis: '100%' }}>الإجمالي {money(demo.total, cur)} — يوفّر العميل {money(demo.saved, cur)}</small>}
              </div>
            );
          })}
          {offers.length < 5 && <button type="button" className="btn sm" onClick={() => setOffers((os) => [...os, { qty: 2, mode: 'percent', value: 10, label: '' }])}>+ إضافة عرض</button>}
        </div>
      )}

      {tab === 'upsell' && (
        <div>
          <h3>🎁 عرض قبل التأكيد (Order Bump)</h3>
          <p className="mut dsc">منتج إضافي بخصم يظهر للعميل قبل تأكيد الطلب بضغطة واحدة.</p>
          <div className="fgrid">
            <Field l="المنتج المقترح">
              <select className="in" value={up.product_id} onChange={(e) => setUp({ ...up, product_id: e.target.value })}>
                <option value="">بدون</option>
                {bumpChoices.map((x) => <option key={x.id} value={String(x.id)}>{x.title}</option>)}
              </select>
            </Field>
            <Field l="نسبة الخصم عليه %"><input className="in num" type="number" min="0" max="90" value={up.percent} onChange={(e) => setUp({ ...up, percent: e.target.value })} /></Field>
            <Field l="نص العرض (اختياري)" full><input className="in" placeholder="أضف الكريم المناسب بخصم خاص" value={up.text} onChange={(e) => setUp({ ...up, text: e.target.value })} /></Field>
          </div>
          <h3 style={{ marginTop: 18 }}>🔗 منتجات مرتبطة (Cross Selling)</h3>
          <p className="mut dsc">تظهر في صفحة المنتج وفي السلة تحت «كمّل طلبك بـ».</p>
          <MultiProductPick products={products} value={cross} onChange={setCross} exclude={[selfId]} />
        </div>
      )}

      {tab === 'stock' && (
        <div className="fgrid">
          <Field l="تتبع المخزون" full><div className="tgrow"><Tog on={p.track_stock} set={(v) => set('track_stock', v)} /><span>إيقاف البيع تلقائياً عند نفاد الكمية</span></div></Field>
          {p.track_stock && <Field l="الكمية المتاحة"><input className="in num" type="number" min="0" value={p.stock_quantity} onChange={(e) => set('stock_quantity', e.target.value)} /></Field>}
        </div>
      )}
    </Modal>
  );
}

/* ====================== استيراد من Excel / CSV ====================== */
const ACTION_LABEL = { insert: ['جديد', '#2f855a'], update: ['تحديث', '#2b6cb0'], skip: ['تخطي', '#718096'], invalid: ['خطأ', '#c53030'] };

function ImportModal({ cats, existing, onClose, onDone }) {
  const { uid, say } = useDash();
  const [parsed, setParsed] = useState(null);
  const [fileName, setFileName] = useState('');
  const [mode, setMode] = useState('update');
  const [mkCats, setMkCats] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [result, setResult] = useState(null);
  const ref = useRef(null);

  const plan = useMemo(() => (parsed && !parsed.error ? planImport(parsed.items, existing, cats, mode) : []), [parsed, existing, cats, mode]);
  const cnt = useMemo(() => {
    const c = { insert: 0, update: 0, skip: 0, invalid: 0 };
    plan.forEach((r) => { c[r.action] += 1; });
    return c;
  }, [plan]);
  const newCats = useMemo(() => [...new Set(plan.filter((r) => r.action !== 'invalid' && r.action !== 'skip' && r.missingCat).map((r) => r.missingCat))], [plan]);

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setErr(''); setResult(null); setParsed(null); setFileName(f.name);
    try {
      const rows = await readTableFile(f);
      const r = parseProductRows(rows);
      if (r.error) setErr(r.error);
      setParsed(r);
    } catch (ex) {
      setErr(ex?.message || 'تعذر قراءة الملف');
    }
  };

  const run = async () => {
    setBusy(true);
    let added = 0, updated = 0, failed = 0, createdCats = 0;
    try {
      /* الأقسام الناقصة */
      const catIds = new Map((cats || []).map((c) => [String(c.name).trim().toLowerCase(), String(c.id)]));
      if (mkCats && newCats.length) {
        const base = (cats || []).length;
        const { data, error } = await supabase.from('store_categories').insert(newCats.map((name, i) => ({ store_id: uid, name: name.slice(0, 80), sort_order: base + i + 1, enabled: true }))).select('id, name');
        if (error) say(`تعذر إنشاء الأقسام: ${error.message}`);
        else (data || []).forEach((c) => { catIds.set(String(c.name).trim().toLowerCase(), String(c.id)); createdCats += 1; });
      }
      const catOf = (r) => (r.category ? catIds.get(r.category.toLowerCase()) || null : null);

      const inserts = plan.filter((r) => r.action === 'insert').map((r) => insertPayload(r, uid, catOf(r)));
      for (let i = 0; i < inserts.length; i += 100) {
        const chunk = inserts.slice(i, i + 100);
        const { error } = await supabase.from('products').insert(chunk);
        if (error) { failed += chunk.length; say(`تعذر إضافة دفعة: ${error.message}`); } else added += chunk.length;
      }
      const ups = plan.filter((r) => r.action === 'update');
      for (let i = 0; i < ups.length; i += 10) {
        const res = await Promise.all(ups.slice(i, i + 10).map((r) => {
          const patch = updatePatch(r, catOf(r));
          if (!Object.keys(patch).length) return Promise.resolve({ error: null });
          return supabase.from('products').update(patch).eq('id', r.target.id).eq('store_id', uid);
        }));
        res.forEach((x) => { if (x.error) failed += 1; else updated += 1; });
      }
    } catch (ex) {
      say(`توقف الاستيراد: ${ex?.message || ''}`);
    }
    setBusy(false);
    setResult({ added, updated, failed, createdCats, skipped: cnt.skip, invalid: cnt.invalid });
    say(`✅ تم: ${added} جديد، ${updated} تحديث`);
    onDone(false);
  };

  const todo = cnt.insert + cnt.update;
  return (
    <Modal
      wide t="استيراد منتجات من Excel" x={() => onClose()}
      foot={result ? <button type="button" className="btn p" onClick={() => onClose()}>تم</button> : <><button type="button" className="btn" onClick={() => onClose()}>إغلاق</button><button type="button" className="btn p" disabled={busy || !todo} onClick={run}>{busy ? 'جاري الاستيراد...' : `استيراد ${todo} منتج`}</button></>}
    >
      {result ? (
        <div className="pv">
          <b>✅ انتهى الاستيراد</b>
          <span>
            تمت إضافة {result.added} منتج جديد وتحديث {result.updated}.
            {result.createdCats ? ` وإنشاء ${result.createdCats} قسم جديد.` : ''}
            {result.skipped ? ` تم تخطي ${result.skipped}.` : ''}
            {result.invalid ? ` وتجاهل ${result.invalid} صف فيهم أخطاء.` : ''}
            {result.failed ? ` فشل ${result.failed}، راجع الرسائل وجرّب تاني.` : ''}
          </span>
        </div>
      ) : (
        <>
          <p className="mut dsc">ارفع ملف Excel (.xlsx) أو CSV فيه منتجاتك. العمود الوحيد المطلوب هو «الاسم» (و«السعر» للمنتجات الجديدة). الأعمدة بتتعرّف عليها بالعربي أو الإنجليزي: الاسم، السعر، السعر قبل الخصم، سعر التكلفة، الكمية، الكود، القسم، الصور، الوصف، الحالة.</p>
          <div className="row">
            <button type="button" className="btn p" onClick={() => ref.current?.click()}>اختيار ملف Excel أو CSV</button>
            <button type="button" className="btn" onClick={() => downloadCsvFile('spike-products-template.csv', `﻿${[TEMPLATE_HEAD, ...TEMPLATE_ROWS].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')}`)}>⬇️ تحميل نموذج جاهز</button>
            <input ref={ref} type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden onChange={onFile} />
          </div>
          {fileName && <p className="mut dsc">الملف: <b>{fileName}</b></p>}
          {err && <div className="card errbox">⚠️ {err}</div>}
          {parsed && !parsed.error && (
            <>
              <div className="grid3">
                <Stat label="منتجات جديدة" value={cnt.insert} color="#2f855a" />
                <Stat label="هتتحدّث" value={cnt.update} color="#2b6cb0" />
                <Stat label="أخطاء / تخطي" value={cnt.invalid + cnt.skip} color="#c53030" />
              </div>
              <div className="fgrid">
                <Field l="لو الكود (SKU) موجود عندك بالفعل">
                  <select className="in" value={mode} onChange={(e) => setMode(e.target.value)}>
                    <option value="update">حدّث المنتج الموجود (السعر والكمية وغيرها)</option>
                    <option value="skip">تخطّاه ومتغيّرش حاجة</option>
                    <option value="add">أضفه كمنتج جديد برضه</option>
                  </select>
                </Field>
                <Field l="الأقسام">
                  <div className="tgrow"><Tog on={mkCats} set={setMkCats} /><span>{newCats.length ? `إنشاء ${newCats.length} قسم جديد (${newCats.slice(0, 3).join('، ')}${newCats.length > 3 ? '…' : ''})` : 'إنشاء الأقسام الناقصة تلقائياً'}</span></div>
                </Field>
              </div>
              {parsed.ignored.length > 0 && <p className="mut dsc">أعمدة اتجاهلت (مش معروفة): {parsed.ignored.join('، ')}</p>}
              <p className="mut dsc">في التحديث: الخلايا الفاضية بتتساب زي ما هي، والأسعار والكميات اللي في الملف بس هي اللي بتتغيّر. الصور لازم تكون روابط (https://...).</p>
              <div className="card tw">
                <table className="tbl">
                  <thead><tr><th>صف</th><th>الاسم</th><th>السعر</th><th>الكمية</th><th>الكود</th><th>القسم</th><th>الإجراء</th></tr></thead>
                  <tbody>
                    {plan.slice(0, 100).map((r) => {
                      const [l, c] = ACTION_LABEL[r.action];
                      return (
                        <tr key={r.line}>
                          <td className="num">{r.line}</td>
                          <td>{r.title || <span className="warn">—</span>}</td>
                          <td className="num">{r.price ?? '—'}</td>
                          <td className="num">{r.stock ?? '—'}</td>
                          <td className="num">{r.sku || '—'}</td>
                          <td>{r.category || '—'}</td>
                          <td><Badge c={c}>{l}</Badge>{r.errors.length > 0 && <small className="warn" style={{ display: 'block' }}>{r.errors.join('، ')}</small>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {plan.length > 100 && <p className="mut dsc" style={{ padding: 10 }}>معروض أول 100 صف من {plan.length}. الاستيراد هيشمل الكل.</p>}
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );
}

/* ====================== كل المنتجات ====================== */
export function ProductsScreen() {
  const { say, cur, storeUrl } = useDash();
  const t = useProducts();
  const cats = useTable('store_categories', { order: 'sort_order', asc: true });
  const [q, setQ] = useState('');
  const dq = useDebounced(q);
  const [st, setSt] = useState('all');
  const [cat, setCat] = useState('');
  const [page, setPage] = useState(1);
  const [edit, setEdit] = useState(null);
  const [imp, setImp] = useState(false);

  const counts = useMemo(() => ({
    all: t.rows.length,
    active: t.rows.filter((p) => (p.status || 'active') === 'active').length,
    draft: t.rows.filter((p) => p.status === 'draft').length,
    out: t.rows.filter((p) => stockOf(p) !== null && stockOf(p) <= 0).length,
  }), [t.rows]);

  const list = useMemo(() => {
    const s = dq.trim().toLowerCase();
    return t.rows.filter((p) => {
      if (st === 'active' && (p.status || 'active') !== 'active') return false;
      if (st === 'draft' && p.status !== 'draft') return false;
      if (st === 'out' && !(stockOf(p) !== null && stockOf(p) <= 0)) return false;
      if (cat && String(p.category_id || '') !== cat) return false;
      return !s || `${p.title} ${p.sku || ''}`.toLowerCase().includes(s);
    });
  }, [t.rows, st, cat, dq]);
  const rows = list.slice((page - 1) * PER, page * PER);

  const dup = async (p) => {
    const row = {};
    PRODUCT_COPY_FIELDS.forEach((k) => { if (p[k] !== undefined) row[k] = p[k]; });
    row.title = `${p.title} (نسخة)`;
    row.status = 'draft';
    if (await t.insert(row)) say('تم إنشاء نسخة كمسودة');
  };
  const del = async (p) => {
    if (!window.confirm(`حذف «${p.title}» نهائياً؟ الطلبات القديمة لن تتأثر.`)) return;
    if (await t.remove(p.id)) say('تم الحذف');
  };
  const exportCsv = () => downloadCsvFile('products.csv', toCSV(list, [
    { label: 'title', key: 'title' }, { label: 'price', key: 'price' }, { label: 'compare_price', key: 'compare_price' }, { label: 'cost_price', key: 'cost_price' },
    { label: 'stock', get: (p) => (p.track_stock === false ? '' : p.stock_quantity) }, { label: 'sku', key: 'sku' },
    { label: 'category', get: (p) => cats.rows.find((c) => String(c.id) === String(p.category_id))?.name || '' },
    { label: 'image', get: (p) => (Array.isArray(p.images) ? p.images[0] || '' : '') }, { label: 'description', key: 'description' }, { label: 'status', key: 'status' },
  ]));

  return (
    <>
      <PageHead title="كل المنتجات" sub={`${t.rows.length} منتج`}>
        <button type="button" className="btn" onClick={exportCsv}>⬇️ تصدير</button>
        <button type="button" className="btn" onClick={() => setImp(true)}>⬆️ استيراد Excel</button>
        <button type="button" className="btn p" onClick={() => setEdit({ _new: true })}>+ منتج جديد</button>
      </PageHead>
      {t.err && <div className="card errbox">⚠️ {t.err}<br /><small>شغّل ملف spike_store_all.sql في Supabase.</small></div>}
      <Tabs value={st} onChange={(v) => { setSt(v); setPage(1); }} tabs={[['all', 'الكل', counts.all], ['active', 'نشط', counts.active], ['draft', 'مسودة', counts.draft], ['out', 'نفد', counts.out]]} />
      <div className="tl">
        <input className="in" placeholder="بحث بالاسم أو SKU…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <select className="in" style={{ maxWidth: 200 }} value={cat} onChange={(e) => { setCat(e.target.value); setPage(1); }}>
          <option value="">كل الأقسام</option>
          {cats.rows.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </select>
      </div>
      <div className="card tw">
        {t.loading ? <div className="c"><Spin /></div> : rows.length === 0 ? (
          <Empty icon="🏷️" t="لا توجد منتجات" d={t.rows.length ? 'جرّب تغيير الفلاتر' : 'أضف أول منتج لمتجرك'}>
            {!t.rows.length && <button type="button" className="btn p" style={{ marginTop: 12 }} onClick={() => setEdit({ _new: true })}>+ أضف منتجاً</button>}
          </Empty>
        ) : (
          <table className="tbl">
            <thead><tr><th>المنتج</th><th>السعر</th><th>المخزون</th><th>القسم</th><th>الحالة</th><th /></tr></thead>
            <tbody>
              {rows.map((p) => {
                const img = Array.isArray(p.images) ? p.images[0] : '';
                const s = stockOf(p);
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="imgin">
                        {img ? <img src={img} alt="" className="thumb" /> : <span className="thumb ph">🖼️</span>}
                        <div><b>{p.title}</b>{p.sku && <small className="num">{p.sku}</small>}{p.featured && <small>⭐ مميز</small>}</div>
                      </div>
                    </td>
                    <td className="num"><b>{money(p.price, cur)}</b>{saleActive(p) && <small style={{ textDecoration: 'line-through' }}>{money(p.compare_price, cur)}</small>}</td>
                    <td className="num">{s === null ? <span className="mut">غير محدود</span> : s <= 0 ? <Badge c="#c53030">نفد</Badge> : s <= 5 ? <Badge c="#b7791f">{s}</Badge> : s}</td>
                    <td>{cats.rows.find((c) => String(c.id) === String(p.category_id))?.name || <span className="mut">—</span>}</td>
                    <td><Tog on={(p.status || 'active') === 'active'} set={(v) => t.update(p.id, { status: v ? 'active' : 'draft' })} /></td>
                    <td className="acts">
                      {storeUrl && (p.status || 'active') === 'active' && <a className="btn sm" href={`${storeUrl}/p/${p.id}`} target="_blank" rel="noreferrer">عرض</a>}
                      <button type="button" className="btn sm" onClick={() => setEdit(p)}>تعديل</button>
                      <button type="button" className="btn sm" onClick={() => dup(p)}>نسخ</button>
                      <button type="button" className="btn sm dng" onClick={() => del(p)}>حذف</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <Pager total={list.length} page={page} per={PER} onPage={setPage} />
      </div>
      {edit && <ProductEditor key={edit.id || 'new'} product={edit} cats={cats.rows} products={t.rows} api={t} onClose={() => setEdit(null)} />}
      {imp && <ImportModal cats={cats.rows} existing={t.rows} onClose={() => { setImp(false); t.reload(); cats.reload && cats.reload(); }} onDone={() => { t.reload(); cats.reload && cats.reload(); }} />}
    </>
  );
}

/* ====================== المخزون ====================== */
export function InventoryScreen() {
  const { say } = useDash();
  const t = useProducts();
  const [f, setF] = useState('all');
  const [q, setQ] = useState('');
  const dq = useDebounced(q);
  const [vals, setVals] = useState({});

  const tracked = t.rows.filter((p) => p.track_stock !== false);
  const low = tracked.filter((p) => (Number(p.stock_quantity) || 0) > 0 && (Number(p.stock_quantity) || 0) <= 5);
  const out = tracked.filter((p) => (Number(p.stock_quantity) || 0) <= 0);
  const units = tracked.reduce((a, p) => a + (Number(p.stock_quantity) || 0), 0);
  const value = tracked.reduce((a, p) => a + (Number(p.stock_quantity) || 0) * (Number(p.cost_price) || 0), 0);

  const list = t.rows.filter((p) => {
    if (f === 'low' && !low.includes(p)) return false;
    if (f === 'out' && !out.includes(p)) return false;
    if (f === 'untracked' && p.track_stock !== false) return false;
    return !dq || String(p.title).toLowerCase().includes(dq.toLowerCase());
  });

  const setStock = async (p, n) => {
    const v = Math.max(0, parseInt(n, 10) || 0);
    if (v === (Number(p.stock_quantity) || 0)) return;
    if (await t.update(p.id, { stock_quantity: v })) say(`تم تحديث مخزون «${p.title}»`);
  };

  return (
    <>
      <PageHead title="المخزون" sub="تعديل سريع للكميات" />
      <div className="grid4">
        <Stat label="إجمالي القطع" value={units.toLocaleString('en-US')} />
        <Stat label="قيمة المخزون (بالتكلفة)" value={money(value)} color="var(--b)" />
        <Stat label="مخزون منخفض (≤5)" value={low.length} color="#b7791f" />
        <Stat label="نفد" value={out.length} color="#c53030" />
      </div>
      <Tabs value={f} onChange={setF} tabs={[['all', 'الكل', t.rows.length], ['low', 'منخفض', low.length], ['out', 'نفد', out.length], ['untracked', 'غير متتبَّع', t.rows.length - tracked.length]]} />
      <div className="tl"><input className="in" placeholder="بحث…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="card tw">
        {t.loading ? <div className="c"><Spin /></div> : list.length === 0 ? <Empty icon="📦" t="لا توجد منتجات في هذا الفلتر" /> : (
          <table className="tbl">
            <thead><tr><th>المنتج</th><th>تتبع</th><th>الكمية</th></tr></thead>
            <tbody>
              {list.map((p) => {
                const cur = vals[p.id] ?? (Number(p.stock_quantity) || 0);
                return (
                  <tr key={p.id}>
                    <td><b>{p.title}</b>{p.sku && <small className="num">{p.sku}</small>}</td>
                    <td><Tog on={p.track_stock !== false} set={(v) => t.update(p.id, { track_stock: v })} /></td>
                    <td>
                      {p.track_stock === false ? <span className="mut">غير محدود</span> : (
                        <span className="stk">
                          <button type="button" onClick={() => setStock(p, (Number(p.stock_quantity) || 0) - 1)}>−</button>
                          <input
                            className="in num" type="number" min="0" value={cur}
                            onChange={(e) => setVals((v) => ({ ...v, [p.id]: e.target.value }))}
                            onBlur={() => { setStock(p, cur); setVals((v) => { const n = { ...v }; delete n[p.id]; return n; }); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                          />
                          <button type="button" onClick={() => setStock(p, (Number(p.stock_quantity) || 0) + 1)}>+</button>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

/* ====================== عروض الفلاش ====================== */
export function FlashScreen() {
  const { say, cur } = useDash();
  const t = useProducts();
  const [pid, setPid] = useState('');
  const [pct, setPct] = useState(20);
  const [ends, setEnds] = useState(() => { const d = new Date(Date.now() + 24 * 3600 * 1000); return d.toISOString(); });
  const [busy, setBusy] = useState(false);

  const active = t.rows.filter((p) => saleActive(p) && p.sale_ends_at);
  const expired = t.rows.filter((p) => p.sale_ends_at && !saleActive(p));
  const p = t.rows.find((x) => String(x.id) === pid);
  const newPrice = p ? Math.round((Number(p.price) || 0) * (1 - pct / 100)) : 0;

  const start = async () => {
    if (!p) { say('اختر منتجاً'); return; }
    if (!(pct >= 1 && pct <= 90)) { say('الخصم من 1% إلى 90%'); return; }
    if (new Date(ends).getTime() <= Date.now()) { say('اختر وقت انتهاء في المستقبل'); return; }
    const regular = saleActive(p) ? Number(p.compare_price) : Number(p.price);
    setBusy(true);
    const ok = await t.update(p.id, { compare_price: regular, price: Math.round(regular * (1 - pct / 100)), sale_ends_at: ends });
    setBusy(false);
    if (ok) { say('🔥 بدأ عرض الفلاش'); setPid(''); }
  };
  const end = async (x) => {
    if (await t.update(x.id, { price: Number(x.compare_price) || Number(x.price), compare_price: null, sale_ends_at: null })) say('تم إنهاء العرض وعاد السعر الأصلي');
  };
  const clean = async (x) => { if (await t.update(x.id, { compare_price: null, sale_ends_at: null })) say('تم التنظيف'); };

  return (
    <>
      <PageHead title="عروض الفلاش" sub="خصم لفترة محدودة بعدّاد تنازلي" />
      <div className="two">
        <div className="card">
          <h3>🔥 ابدأ عرضاً جديداً</h3>
          <Field l="المنتج">
            <select className="in" value={pid} onChange={(e) => setPid(e.target.value)}>
              <option value="">اختر منتجاً</option>
              {t.rows.filter((x) => (x.status || 'active') === 'active').map((x) => <option key={x.id} value={String(x.id)}>{x.title} — {money(x.price, cur)}</option>)}
            </select>
          </Field>
          <div className="fgrid">
            <Field l="نسبة الخصم %"><input className="in num" type="number" min="1" max="90" value={pct} onChange={(e) => setPct(Number(e.target.value) || 0)} /></Field>
            <Field l="ينتهي في"><input className="in num" type="datetime-local" value={toLocalInput(ends)} onChange={(e) => setEnds(fromLocalInput(e.target.value) || ends)} /></Field>
          </div>
          {p && <div className="pv"><b>{p.title}</b><span>السعر الحالي {money(saleActive(p) ? p.compare_price : p.price, cur)} ← السعر في العرض <b className="ok">{money(newPrice, cur)}</b></span></div>}
          <button type="button" className="btn p" style={{ marginTop: 12 }} disabled={busy || !p} onClick={start}>{busy ? '...' : 'بدء العرض'}</button>
          <small className="hint">لما العرض ينتهي يرجع السعر تلقائياً لسعره الأصلي.</small>
        </div>
        <div className="card">
          <h3>العروض الجارية <small>{active.length}</small></h3>
          {active.length === 0 ? <Empty icon="⏳" t="لا توجد عروض جارية" /> : active.map((x) => (
            <div className="pls" key={x.id}>
              <p><b>{x.title}</b><small>{money(x.price, cur)} بدل {money(x.compare_price, cur)} · ينتهي {fdate(x.sale_ends_at)}</small></p>
              <button type="button" className="btn sm dng" onClick={() => end(x)}>إنهاء</button>
            </div>
          ))}
          {expired.length > 0 && (
            <>
              <h3 style={{ marginTop: 18 }}>عروض منتهية <small>{expired.length}</small></h3>
              {expired.map((x) => (
                <div className="pls" key={x.id}>
                  <p><b>{x.title}</b><small>انتهى {fday(x.sale_ends_at)} — السعر رجع {money(x.compare_price, cur)}</small></p>
                  <button type="button" className="btn sm" onClick={() => clean(x)}>تنظيف</button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ====================== الأقسام ====================== */
export function CategoriesScreen() {
  const prods = useProducts();
  const count = (id) => prods.rows.filter((p) => String(p.category_id || '') === String(id)).length;
  return (
    <Crud
      table="store_categories" noun="قسم" title="الأقسام" order="sort_order" asc
      desc="الأقسام تظهر في الصفحة الرئيسية وتسمح للعميل بتصفية المنتجات."
      search={(r) => r.name}
      defaults={{ enabled: true, sort_order: 0 }}
      toggleKey="enabled"
      columns={[
        { l: 'القسم', render: (r) => <div className="imgin">{r.image ? <img src={r.image} alt="" className="thumb" /> : <span className="thumb ph">🗂️</span>}<b>{r.name}</b></div> },
        { l: 'المنتجات', render: (r) => <span className="num">{count(r.id)}</span> },
        { l: 'الترتيب', render: (r) => <span className="num">{r.sort_order}</span> },
      ]}
      fields={[
        { k: 'name', l: 'اسم القسم', full: true },
        { k: 'image', l: 'صورة القسم', type: 'image', folder: 'categories' },
        { k: 'sort_order', l: 'الترتيب (الأصغر أولاً)', type: 'number' },
      ]}
      validate={(e) => (String(e.name || '').trim().length < 2 ? 'اكتب اسم القسم' : '')}
      transform={(e) => ({ ...e, name: String(e.name).trim(), sort_order: Number(e.sort_order) || 0 })}
    />
  );
}

/* ====================== التقييمات ====================== */
export function ReviewsScreen() {
  const { say } = useDash();
  const t = useTable('store_reviews', { order: 'created_at', limit: 1000 });
  const prods = useProducts();
  const [f, setF] = useState('pending');
  const [add, setAdd] = useState(null);

  const counts = { all: t.rows.length, pending: 0, approved: 0, hidden: 0 };
  t.rows.forEach((r) => { counts[r.status] = (counts[r.status] || 0) + 1; });
  const list = t.rows.filter((r) => f === 'all' || r.status === f);
  const pname = (id) => prods.rows.find((p) => String(p.id) === String(id))?.title || 'المتجر عموماً';
  const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

  const saveAdd = async () => {
    const name = String(add.name || '').trim();
    if (name.length < 2) { say('اكتب اسم العميل'); return; }
    if (!String(add.comment || '').trim()) { say('اكتب نص التقييم'); return; }
    const ok = await t.insert({ customer_name: name, rating: Number(add.rating) || 5, comment: String(add.comment).trim(), product_id: add.product_id || null, status: 'approved', source: 'merchant' });
    if (ok) { setAdd(null); say('✅ تمت الإضافة'); }
  };

  return (
    <>
      <PageHead title="التقييمات" sub={`${counts.pending} بانتظار المراجعة`}>
        <button type="button" className="btn p" onClick={() => setAdd({ name: '', rating: 5, comment: '', product_id: '' })}>+ إضافة تقييم</button>
      </PageHead>
      {t.err && <div className="card errbox">⚠️ {t.err}</div>}
      <Tabs value={f} onChange={setF} tabs={[['pending', 'قيد المراجعة', counts.pending], ['approved', 'معتمد', counts.approved || 0], ['hidden', 'مخفي', counts.hidden || 0], ['all', 'الكل', counts.all]]} />
      <div className="card tw">
        {t.loading ? <div className="c"><Spin /></div> : list.length === 0 ? <Empty icon="⭐" t="لا توجد تقييمات هنا" d="التقييمات الجديدة من العملاء تظهر هنا للموافقة عليها" /> : (
          <table className="tbl">
            <thead><tr><th>العميل</th><th>التقييم</th><th>المنتج</th><th>التاريخ</th><th /></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td><b>{r.customer_name}</b>{r.source === 'merchant' && <small>أضفته أنت</small>}</td>
                  <td style={{ maxWidth: 320 }}><span style={{ color: '#e08f4f' }}>{stars(r.rating)}</span><small style={{ color: 'var(--ink)' }}>{r.comment}</small></td>
                  <td>{pname(r.product_id)}</td>
                  <td>{fday(r.created_at)}</td>
                  <td className="acts">
                    {r.status !== 'approved' && <button type="button" className="btn sm p" onClick={() => t.update(r.id, { status: 'approved' })}>اعتماد</button>}
                    {r.status !== 'hidden' && <button type="button" className="btn sm" onClick={() => t.update(r.id, { status: 'hidden' })}>إخفاء</button>}
                    <button type="button" className="btn sm dng" onClick={async () => { if (window.confirm('حذف التقييم؟')) t.remove(r.id); }}>حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {add && (
        <Modal t="إضافة تقييم" x={() => setAdd(null)} foot={<><button type="button" className="btn" onClick={() => setAdd(null)}>إلغاء</button><button type="button" className="btn p" onClick={saveAdd}>حفظ</button></>}>
          <div className="fgrid">
            <Field l="اسم العميل"><input className="in" value={add.name} onChange={(e) => setAdd({ ...add, name: e.target.value })} /></Field>
            <Field l="التقييم">
              <select className="in" value={add.rating} onChange={(e) => setAdd({ ...add, rating: e.target.value })}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{stars(n)}</option>)}
              </select>
            </Field>
            <Field l="المنتج" full>
              <select className="in" value={add.product_id} onChange={(e) => setAdd({ ...add, product_id: e.target.value })}>
                <option value="">المتجر عموماً</option>
                {prods.rows.map((p) => <option key={p.id} value={String(p.id)}>{p.title}</option>)}
              </select>
            </Field>
            <Field l="نص التقييم" full><textarea className="in ta" rows={3} value={add.comment} onChange={(e) => setAdd({ ...add, comment: e.target.value })} /></Field>
          </div>
          <small className="hint">أضف فقط تقييمات حقيقية من عملائك (مثلاً من رسائل واتساب).</small>
        </Modal>
      )}
    </>
  );
}

/* ====================== Product Feed ====================== */
export function FeedScreen() {
  const { slug, origin } = useDash();
  const prods = useProducts();
  const base = slug && origin ? `${origin}/api/feed/${slug}` : '';
  const ok = prods.rows.filter((p) => (p.status || 'active') === 'active' && Array.isArray(p.images) && p.images[0]);
  const missing = prods.rows.filter((p) => (p.status || 'active') === 'active' && !(Array.isArray(p.images) && p.images[0]));
  return (
    <ConfigForm
      section="feed" title="Product Feed" desc="رابط يقرأه Google Merchant و Meta Catalog و TikTok Catalog ويحدّث منتجاتك تلقائياً."
      fields={[
        { k: 'brand', l: 'اسم العلامة التجارية', ph: 'اسم متجرك' },
        { k: 'condition', l: 'حالة المنتجات', type: 'select', options: [['new', 'جديد'], ['refurbished', 'مجدد'], ['used', 'مستعمل']] },
        { k: 'google_category', l: 'تصنيف جوجل (اختياري)', ph: 'Apparel & Accessories > Clothing', full: true },
        { k: 'include_out_of_stock', l: 'المنتجات النافدة', type: 'toggle', text: 'تضمين المنتجات النافدة (بحالة out of stock)' },
      ]}
    >
      {() => (
        <div style={{ marginTop: 16 }}>
          <h3>🔗 الروابط</h3>
          <Field l="Google Merchant / Meta (XML)"><LinkBox url={base} /></Field>
          <Field l="ملف CSV (للمنصات التي تقبله)"><LinkBox url={base ? `${base}?format=csv` : ''} /></Field>
          <div className="pv" style={{ marginTop: 10 }}>
            <span>✅ <b className="num">{ok.length}</b> منتج جاهز للنشر في الفيد</span>
            {missing.length > 0 && <span className="warn">⚠️ {missing.length} منتج بدون صورة لن يظهر: {missing.slice(0, 3).map((p) => p.title).join('، ')}{missing.length > 3 ? '…' : ''}</span>}
          </div>
        </div>
      )}
    </ConfigForm>
  );
}

/* ====================== كتالوج سبايك ====================== */
export function CatalogScreen() {
  const { storeUrl } = useDash();
  const url = storeUrl ? `${storeUrl}/catalog` : '';
  return (
    <ConfigForm
      section="catalog" title="كتالوج سبايك" desc="صفحة كتالوج منظمة بكل منتجاتك تشاركها مع عملائك على واتساب أو تطبعها."
      fields={[
        { k: 'title', l: 'عنوان الكتالوج', full: true },
        { k: 'show_prices', l: 'الأسعار', type: 'toggle', text: 'إظهار الأسعار في الكتالوج' },
        { k: 'wa_button', l: 'واتساب', type: 'toggle', text: 'زر «اطلب عبر واتساب» أمام كل منتج' },
      ]}
    >
      {() => (
        <div style={{ marginTop: 16 }}>
          <h3>🔗 رابط الكتالوج</h3>
          <LinkBox url={url} />
          <small className="hint">الكتالوج يعرض المنتجات النشطة فقط ويتحدث تلقائياً. يمكن طباعته كـ PDF من المتصفح.</small>
        </div>
      )}
    </ConfigForm>
  );
}
