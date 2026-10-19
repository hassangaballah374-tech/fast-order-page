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

  return (
    <div>
      <div className="gal">
        {list.map((u, i) => (
          <div key={u + i} className={'gi' + (i === 0 ? ' first' : '')}>
            <img src={u} alt="" onClick={() => i > 0 && makeFirst(i)} title={i > 0 ? 'اضغط لجعلها الصورة الرئيسية' : ''} style={{ cursor: i > 0 ? 'pointer' : 'default' }} />
            <button type="button" onClick={() => onChange(list.filter((_, k) => k !== i))} aria-label="حذف">✕</button>
          </div>
        ))}
        {list.length < 10 && <button type="button" className="add" disabled={busy} onClick={() => ref.current?.click()}>{busy ? '...' : '+'}</button>}
      </div>
      <input ref={ref} type="file" accept="image/*" multiple hidden onChange={pick} />
      <div className="row" style={{ marginTop: 10, marginBottom: 0 }}>
        <input className="in num" dir="ltr" placeholder="أو الصق رابط صورة https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
        <button type="button" className="btn sm" onClick={addUrl}>إضافة الرابط</button>
      </div>
      <small className="hint">أول صورة هي الرئيسية. اضغط أي صورة لتصبح الرئيسية. حتى 10 صور.</small>
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
  const [groups, setGroups] = useState(() => (Array.isArray(product.variants) ? product.variants : []).map((g) => ({ name: g.name || '', text: (g.values || []).join('، ') })));
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
      variants.push({ name, values });
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
            <div className="row" key={i}>
              <input className="in" style={{ maxWidth: 160 }} placeholder="اسم الخيار (المقاس)" value={g.name} onChange={(e) => setGroups((gs) => gs.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} />
              <input className="in" style={{ flex: 3 }} placeholder="S، M، L، XL" value={g.text} onChange={(e) => setGroups((gs) => gs.map((x, k) => (k === i ? { ...x, text: e.target.value } : x)))} />
              <button type="button" className="btn sm dng" onClick={() => setGroups((gs) => gs.filter((_, k) => k !== i))}>✕</button>
            </div>
          ))}
          {groups.length < 3 && <button type="button" className="btn sm" onClick={() => setGroups((gs) => [...gs, { name: '', text: '' }])}>+ إضافة خيار</button>}
          {groups.length > 0 && <small className="hint" style={{ marginTop: 10 }}>ملاحظة: المنتج اللي له خيارات لا يصلح كـ Order Bump.</small>}
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

/* ====================== استيراد CSV ====================== */
const CSV_HEAD = 'title,price,compare_price,cost_price,stock,sku,category,image,description,status';

function ImportModal({ cats, onClose, onDone }) {
  const { uid, say } = useDash();
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const text = await f.text();
    const parsed = parseCSV(text).slice(0, 500).map((r) => ({
      title: r.title, price: asNumber(r.price), compare_price: asNumber(r.compare_price) || null, cost_price: asNumber(r.cost_price),
      stock: parseInt(r.stock, 10), sku: r.sku || null, category: r.category || '', image: r.image || '', description: r.description || '',
      status: r.status === 'draft' ? 'draft' : 'active',
    }));
    setRows(parsed);
  };
  const valid = rows.filter((r) => r.title && r.price > 0);

  const run = async () => {
    setBusy(true);
    const payload = valid.map((r) => {
      const cat = cats.find((c) => String(c.name).trim().toLowerCase() === String(r.category).trim().toLowerCase());
      const stock = Number.isFinite(r.stock) ? r.stock : 100;
      return {
        store_id: uid, title: r.title.slice(0, 150), price: r.price, compare_price: r.compare_price && r.compare_price > r.price ? r.compare_price : null,
        cost_price: r.cost_price, stock_quantity: Math.max(0, stock), track_stock: true, sku: r.sku, category_id: cat ? String(cat.id) : null,
        images: /^https?:\/\//i.test(r.image) ? [r.image] : [], description: r.description, status: r.status,
      };
    });
    let added = 0;
    for (let i = 0; i < payload.length; i += 100) {
      const { error } = await supabase.from('products').insert(payload.slice(i, i + 100));
      if (error) { say(`توقف الاستيراد: ${error.message}`); break; }
      added += payload.slice(i, i + 100).length;
    }
    setBusy(false);
    say(`✅ تم استيراد ${added} منتج`);
    onDone();
  };

  return (
    <Modal
      wide t="استيراد منتجات من ملف CSV" x={onClose}
      foot={<><button type="button" className="btn" onClick={onClose}>إغلاق</button><button type="button" className="btn p" disabled={busy || !valid.length} onClick={run}>{busy ? '...' : `استيراد ${valid.length} منتج`}</button></>}
    >
      <p className="mut dsc">الأعمدة المطلوبة: title و price. الباقي اختياري. اسم القسم لازم يطابق قسماً موجوداً عندك.</p>
      <div className="row">
        <button type="button" className="btn" onClick={() => downloadCsvFile('spike-products-template.csv', `﻿${CSV_HEAD}\nقميص قطن,250,300,120,50,SH-01,ملابس,https://example.com/a.jpg,قميص قطن 100%,active`)}>⬇️ تحميل النموذج</button>
        <button type="button" className="btn p" onClick={() => ref.current?.click()}>اختيار ملف CSV</button>
        <input ref={ref} type="file" accept=".csv,text/csv" hidden onChange={onFile} />
      </div>
      {rows.length > 0 && (
        <div className="card tw">
          <table className="tbl">
            <thead><tr><th>الاسم</th><th>السعر</th><th>المخزون</th><th>القسم</th><th>الحالة</th></tr></thead>
            <tbody>
              {rows.slice(0, 50).map((r, i) => (
                <tr key={i}>
                  <td>{r.title || <span className="warn">بدون اسم</span>}</td>
                  <td className="num">{r.price > 0 ? r.price : <span className="warn">سعر غير صحيح</span>}</td>
                  <td className="num">{Number.isFinite(r.stock) ? r.stock : 100}</td>
                  <td>{r.category || '—'}</td>
                  <td>{r.title && r.price > 0 ? <Badge c="#2f855a">جاهز</Badge> : <Badge c="#c53030">سيتجاهل</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
        <button type="button" className="btn" onClick={() => setImp(true)}>⬆️ استيراد CSV</button>
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
      {imp && <ImportModal cats={cats.rows} onClose={() => setImp(false)} onDone={() => { setImp(false); t.reload(); }} />}
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
