'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

/* ===================== كتالوج التكاملات ===================== */ 
export const CATALOG = [
  // قنوات التسويق والتتبع
  { key: 'facebook_pixel', cat: 'marketing', icon: '📘', ar: 'فيسبوك بيكسل', en: 'Facebook Pixel', dAr: 'تتبع المشتريات والإضافة للسلة للإعلانات', fields: [{ k: 'pixel_id', ar: 'Pixel ID', ph: '1234567890' }] },
  { key: 'tiktok_pixel', cat: 'marketing', icon: '🎵', ar: 'تيك توك بيكسل', en: 'TikTok Pixel', dAr: 'تتبع التحويلات لحملات تيك توك', fields: [{ k: 'pixel_id', ar: 'Pixel ID', ph: 'C...' }] },
  { key: 'snap_pixel', cat: 'marketing', icon: '👻', ar: 'سناب بيكسل', en: 'Snap Pixel', dAr: 'تتبع تحويلات سناب شات', fields: [{ k: 'pixel_id', ar: 'Pixel ID', ph: '' }] },
  { key: 'google_analytics', cat: 'marketing', icon: '📈', ar: 'جوجل أناليتكس', en: 'Google Analytics', dAr: 'تحليلات الزوار والمبيعات (GA4)', fields: [{ k: 'measurement_id', ar: 'Measurement ID', ph: 'G-XXXXXXX' }] },
  { key: 'whatsapp', cat: 'marketing', icon: '💬', ar: 'زر واتساب', en: 'WhatsApp Button', dAr: 'زر تواصل عائم داخل المتجر', fields: [{ k: 'phone', ar: 'رقم واتساب بصيغة دولية', ph: '201000000000' }, { k: 'message', ar: 'رسالة افتراضية', ph: 'أهلاً، عندي استفسار' }] },
  // أدوات رفع المبيعات (زي إيزي أوردر)
  { key: 'easy_checkout', cat: 'sales', icon: '⚡', ar: 'الدفع السريع (صفحة واحدة)', en: 'One-page COD checkout', dAr: 'فورم طلب مباشر في صفحة المنتج بالدفع عند الاستلام', fields: [] },
  { key: 'order_bump', cat: 'sales', icon: '🎁', ar: 'عرض إضافي قبل التأكيد', en: 'Order Bump', dAr: 'اقتراح منتج إضافي بخصم داخل الطلب', fields: [{ k: 'discount_percent', ar: 'نسبة الخصم %', ph: '10' }] },
  { key: 'abandoned_cart', cat: 'sales', icon: '🛒', ar: 'استرجاع السلات المتروكة', en: 'Abandoned Cart', dAr: 'حفظ بيانات العميل غير المكتمل للمتابعة', fields: [{ k: 'delay_minutes', ar: 'المدة قبل الاعتبار متروكة (دقيقة)', ph: '30' }] },
  { key: 'discount_codes', cat: 'sales', icon: '🏷️', ar: 'أكواد الخصم', en: 'Discount Codes', dAr: 'تفعيل كوبونات الخصم في الطلب', fields: [] },
  { key: 'fake_order_guard', cat: 'sales', icon: '🛡️', ar: 'حماية من الطلبات الوهمية', en: 'Fake-order guard', dAr: 'منع تكرار الطلب من نفس الرقم خلال فترة', fields: [{ k: 'window_hours', ar: 'الفترة بالساعات', ph: '24' }] },
  // الشحن
  { key: 'bosta', cat: 'shipping', icon: '🚚', ar: 'بوسطة', en: 'Bosta', dAr: 'إرسال الطلبات لشركة الشحن تلقائياً', fields: [{ k: 'api_key', ar: 'API Key', ph: '', secret: true }] },
  { key: 'aramex', cat: 'shipping', icon: '📮', ar: 'أرامكس', en: 'Aramex', dAr: 'ربط الشحن والتتبع', fields: [{ k: 'account', ar: 'Account Number', ph: '' }, { k: 'api_key', ar: 'API Key', ph: '', secret: true }] },
  { key: 'mylerz', cat: 'shipping', icon: '📦', ar: 'مايلرز', en: 'Mylerz', dAr: 'ربط الشحن والتتبع', fields: [{ k: 'api_key', ar: 'API Key', ph: '', secret: true }] },
  // الدفع
  { key: 'cod', cat: 'payments', icon: '💵', ar: 'الدفع عند الاستلام', en: 'Cash on Delivery', dAr: 'الطريقة الافتراضية للتجار في مصر', fields: [{ k: 'fee', ar: 'رسوم إضافية (ج.م)', ph: '0' }] },
  { key: 'paymob', cat: 'payments', icon: '💳', ar: 'Paymob', en: 'Paymob', dAr: 'بطاقات ومحافظ إلكترونية', fields: [{ k: 'api_key', ar: 'API Key', ph: '', secret: true }, { k: 'integration_id', ar: 'Integration ID', ph: '' }] },
  { key: 'fawry', cat: 'payments', icon: '🏪', ar: 'فوري', en: 'Fawry', dAr: 'الدفع عبر كود فوري', fields: [{ k: 'merchant_code', ar: 'Merchant Code', ph: '' }, { k: 'secret', ar: 'Secret Key', ph: '', secret: true }] },
  // الربط
  { key: 'webhook', cat: 'sync', icon: '🔗', ar: 'استقبال الطلبات (Webhook)', en: 'Orders Webhook', dAr: 'استقبال طلبات من شوبيفاي / ووكومرس / أي نظام برابط خاص', fields: [] },
];

const CATS = [
  { id: 'all', ar: 'الكل', en: 'All' },
  { id: 'marketing', ar: 'التسويق والتتبع', en: 'Marketing' },
  { id: 'sales', ar: 'رفع المبيعات', en: 'Sales boosters' },
  { id: 'shipping', ar: 'الشحن', en: 'Shipping' },
  { id: 'payments', ar: 'الدفع', en: 'Payments' },
  { id: 'sync', ar: 'الربط', en: 'Sync' },
];

/* ===================== CSV ===================== */
function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  const s = text.replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"' && s[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((x) => x.trim() !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== '')) rows.push(row);
  if (!rows.length) return [];
  const head = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])));
}

const pick = (row, aliases) => {
  const keys = Object.keys(row);
  for (const a of aliases) {
    const k = keys.find((x) => x.toLowerCase() === a.toLowerCase());
    if (k && row[k] !== '') return row[k];
  }
  return '';
};
const num = (v) => parseFloat(String(v).replace(/[^\d.\-]/g, '')) || 0;

const PRODUCT_MAP = {
  title: ['Title', 'Name', 'Product Name', 'اسم المنتج', 'المنتج', 'الاسم'],
  price: ['Variant Price', 'Price', 'Regular price', 'سعر البيع', 'السعر'],
  cost: ['Cost per item', 'Cost', 'سعر التكلفة', 'التكلفة'],
  stock: ['Variant Inventory Qty', 'Stock', 'Quantity', 'Inventory', 'الكمية', 'المخزون'],
};
const ORDER_MAP = {
  name: ['Shipping Name', 'Billing Name', 'Customer Name', 'Name', 'العميل', 'اسم العميل', 'الاسم'],
  phone: ['Shipping Phone', 'Phone', 'Billing Phone', 'Customer Phone', 'الهاتف', 'رقم الهاتف', 'الموبايل'],
  gov: ['Shipping Province', 'Shipping City', 'Province', 'Governorate', 'State', 'المحافظة'],
  address: ['Shipping Address1', 'Address', 'Billing Address1', 'العنوان'],
  total: ['Total', 'Total Price', 'Order Total', 'الإجمالي', 'الاجمالي', 'المبلغ'],
  status: ['Fulfillment Status', 'Status', 'الحالة'],
};
const STATUS_ALIAS = { fulfilled: 'delivered', shipped: 'shipped', unfulfilled: 'pending', partial: 'shipped', completed: 'delivered', processing: 'confirmed', cancelled: 'cancelled', canceled: 'cancelled', pending: 'pending' };

/* ===================== المكون ===================== */
export default function SpikeIntegrations({ stores = [], isAr = true, canManage = true, onLog = () => {}, onImported = () => {} }) {
  const [storeId, setStoreId] = useState('');
  const [cat, setCat] = useState('all');
  const [rows, setRows] = useState({}); // provider -> {enabled, config}
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [importKind, setImportKind] = useState('products');
  const [importSource, setImportSource] = useState('shopify');
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!storeId && stores.length) setStoreId(stores[0].user_id);
  }, [stores, storeId]);

  const load = async (sid) => {
    if (!sid) return;
    setLoading(true);
    const { data, error } = await supabase.from('store_integrations').select('*').eq('store_id', sid);
    if (error) setMsg(isAr ? '⚠️ جدول التكاملات غير موجود. شغّل ملف SQL أولاً.' : 'Table missing. Run the SQL first.');
    else setMsg('');
    const map = {};
    (data || []).forEach((r) => { map[r.provider] = r; });
    setRows(map);
    setDrafts({});
    setLoading(false);
  };
  useEffect(() => { load(storeId); }, [storeId]);

  const getCfg = (key) => ({ ...(rows[key]?.config || {}), ...(drafts[key] || {}) });

  const save = async (key, enabled, extraCfg) => {
    if (!canManage) return alert(isAr ? 'ليس لديك صلاحية' : 'No permission');
    const config = { ...getCfg(key), ...(extraCfg || {}) };
    const { data, error } = await supabase
      .from('store_integrations')
      .upsert({ store_id: storeId, provider: key, enabled, config, updated_at: new Date().toISOString() }, { onConflict: 'store_id,provider' })
      .select()
      .single();
    if (error) return alert(error.message);
    setRows((p) => ({ ...p, [key]: data }));
    setDrafts((p) => { const n = { ...p }; delete n[key]; return n; });
    onLog(`integration.${enabled ? 'enable' : 'disable'}:${key}`, { store: storeId });
  };

  const webhookUrl = useMemo(() => {
    const secret = rows.webhook?.config?.secret;
    if (!secret || typeof window === 'undefined') return '';
    return `${window.location.origin}/api/webhooks/orders?store=${encodeURIComponent(storeId)}&key=${secret}`;
  }, [rows, storeId]);

  const genWebhook = async () => {
    const secret = Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => b.toString(16).padStart(2, '0')).join('');
    await save('webhook', true, { secret });
  };

  /* ---------- الاستيراد ---------- */
  const onFile = async (file) => {
    if (!file) return;
    const text = await file.text();
    const data = parseCSV(text);
    if (importKind === 'products') {
      const items = data
        .map((r) => ({ title: pick(r, PRODUCT_MAP.title), price: num(pick(r, PRODUCT_MAP.price)), cost_price: num(pick(r, PRODUCT_MAP.cost)), stock_quantity: Math.round(num(pick(r, PRODUCT_MAP.stock))) }))
        .filter((x) => x.title);
      setPreview({ kind: 'products', items });
    } else {
      const items = data
        .map((r) => {
          const st = (pick(r, ORDER_MAP.status) || 'pending').toLowerCase();
          return { customer_name: pick(r, ORDER_MAP.name), customer_phone: pick(r, ORDER_MAP.phone), governorate: pick(r, ORDER_MAP.gov), address: pick(r, ORDER_MAP.address), total_price: num(pick(r, ORDER_MAP.total)), status: STATUS_ALIAS[st] || 'pending' };
        })
        .filter((x) => x.customer_name || x.customer_phone);
      setPreview({ kind: 'orders', items });
    }
  };

  const runImport = async () => {
    if (!canManage) return alert(isAr ? 'ليس لديك صلاحية' : 'No permission');
    if (!preview?.items?.length || !storeId) return;
    setImporting(true);
    const table = preview.kind;
    const payload = preview.items.map((x) => ({ ...x, store_id: storeId, ...(table === 'products' ? { status: 'active' } : {}) }));
    let ok = 0;
    for (let i = 0; i < payload.length; i += 200) {
      const { error } = await supabase.from(table).insert(payload.slice(i, i + 200));
      if (error) { alert(error.message); break; }
      ok += Math.min(200, payload.length - i);
    }
    setImporting(false);
    if (ok) {
      onLog(`import.${importSource}.${table}`, { store: storeId, count: ok });
      alert(isAr ? `✅ تم استيراد ${ok} سجل` : `Imported ${ok} rows`);
      setPreview(null);
      onImported();
    }
  };

  const list = CATALOG.filter((c) => cat === 'all' || c.cat === cat);
  const enabledCount = Object.values(rows).filter((r) => r.enabled).length;

  return (
    <div className="space-y-6">
      {/* اختيار المتجر */}
      <div className="p-6 rounded-2xl border">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h3 className="text-lg font-black">{isAr ? 'التكاملات والإضافات' : 'Integrations & Add-ons'}</h3>
            <p className="text-xs text-slate-400 mt-1">
              {isAr ? 'فعّل الأدوات لكل متجر على حدة — الإعدادات تتحفظ وتتقرأ من المتجر مباشرة.' : 'Enable tools per store.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono px-3 py-1.5 rounded-full" style={{ background: 'var(--surface-2)' }}>{enabledCount} {isAr ? 'مفعّلة' : 'active'}</span>
            <select value={storeId} onChange={(e) => setStoreId(e.target.value)} style={{ minWidth: 220 }}>
              {stores.map((s) => (<option key={s.id} value={s.user_id}>{s.store_name}</option>))}
            </select>
          </div>
        </div>
        {msg && <div className="mt-4 text-xs font-bold" style={{ color: 'var(--danger)' }}>{msg}</div>}
        {!stores.length && <div className="mt-4 text-xs text-slate-400">{isAr ? 'أضف متجراً أولاً.' : 'Add a store first.'}</div>}
      </div>

      {/* الاستيراد */}
      <div className="p-6 rounded-2xl border">
        <h3 className="text-base font-black">{isAr ? 'استيراد من شوبيفاي / إيزي أوردر / أي ملف CSV' : 'Import from Shopify / EasyOrders / CSV'}</h3>
        <p className="text-xs text-slate-400 mt-1 mb-4">
          {isAr ? 'ارفع ملف التصدير كما هو (Products أو Orders). النظام بيتعرّف على أسماء الأعمدة تلقائياً (عربي وإنجليزي).' : 'Upload the export as-is; columns are auto-mapped.'}
        </p>
        <div className="flex flex-wrap gap-3 items-center">
          <select value={importSource} onChange={(e) => setImportSource(e.target.value)}>
            <option value="shopify">Shopify</option>
            <option value="easyorders">EasyOrders</option>
            <option value="woocommerce">WooCommerce</option>
            <option value="csv">CSV</option>
          </select>
          <select value={importKind} onChange={(e) => { setImportKind(e.target.value); setPreview(null); }}>
            <option value="products">{isAr ? 'منتجات' : 'Products'}</option>
            <option value="orders">{isAr ? 'طلبات' : 'Orders'}</option>
          </select>
          <label className="border" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 44, padding: '0 16px', borderRadius: 12, cursor: 'pointer', background: 'var(--surface)', borderColor: 'var(--line)', fontWeight: 700, fontSize: 13 }}>
            📁 {isAr ? 'اختيار ملف CSV' : 'Choose CSV'}
            <input type="file" accept=".csv,text/csv" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
        </div>

        {preview && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-black">{isAr ? `تم قراءة ${preview.items.length} سجل — معاينة أول 5` : `${preview.items.length} rows parsed`}</span>
              <div className="flex gap-2">
                <button type="button" className="border" onClick={() => setPreview(null)}>{isAr ? 'إلغاء' : 'Cancel'}</button>
                <button type="button" className="bg-[#00B050] text-white" disabled={importing || !preview.items.length} onClick={runImport}>
                  {importing ? '...' : isAr ? 'استيراد للمتجر المحدد' : 'Import'}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    {preview.kind === 'products'
                      ? ['المنتج', 'السعر', 'التكلفة', 'المخزون'].map((h) => <th key={h} className="p-3 text-right">{h}</th>)
                      : ['العميل', 'الهاتف', 'المحافظة', 'الإجمالي', 'الحالة'].map((h) => <th key={h} className="p-3 text-right">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {preview.items.slice(0, 5).map((x, i) => (
                    <tr key={i}>
                      {preview.kind === 'products' ? (
                        <><td className="p-3 font-bold">{x.title}</td><td className="p-3 font-mono">{x.price}</td><td className="p-3 font-mono">{x.cost_price}</td><td className="p-3 font-mono">{x.stock_quantity}</td></>
                      ) : (
                        <><td className="p-3 font-bold">{x.customer_name}</td><td className="p-3 font-mono" dir="ltr">{x.customer_phone}</td><td className="p-3">{x.governorate}</td><td className="p-3 font-mono">{x.total_price}</td><td className="p-3">{x.status}</td></>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* التصنيفات */}
      <div className="flex flex-wrap gap-2">
        {CATS.map((c) => (
          <button key={c.id} type="button" onClick={() => setCat(c.id)} className={cat === c.id ? 'bg-[#00B050] text-white' : 'border'} style={{ minHeight: 34, borderRadius: 999 }}>
            {isAr ? c.ar : c.en}
          </button>
        ))}
      </div>

      {/* البطاقات */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map((it) => {
          const r = rows[it.key];
          const on = !!r?.enabled;
          const cfg = getCfg(it.key);
          const dirty = !!drafts[it.key];
          return (
            <div key={it.key} className="p-5 rounded-2xl border flex flex-col gap-3" style={{ borderColor: on ? 'var(--teal)' : undefined }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: 26 }}>{it.icon}</span>
                  <div>
                    <div className="font-black text-sm">{isAr ? it.ar : it.en}</div>
                    <div className="text-[11px] text-slate-400 leading-snug mt-0.5">{it.dAr}</div>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  disabled={!storeId}
                  onClick={() => (it.key === 'webhook' && !on ? genWebhook() : save(it.key, !on))}
                  style={{ width: 46, minHeight: 26, height: 26, padding: 0, borderRadius: 999, position: 'relative', background: on ? 'var(--teal)' : 'var(--line)', border: 0, flexShrink: 0 }}
                >
                  <span style={{ position: 'absolute', top: 3, insetInlineStart: on ? 23 : 3, width: 20, height: 20, borderRadius: 999, background: '#fff', transition: 'inset-inline-start .15s' }} />
                </button>
              </div>

              {on && it.fields.length > 0 && (
                <div className="space-y-2.5">
                  {it.fields.map((f) => (
                    <div key={f.k}>
                      <label className="block text-[11px] text-slate-400 mb-1 font-bold">{f.ar}</label>
                      <input
                        type={f.secret ? 'password' : 'text'}
                        dir="ltr"
                        placeholder={f.ph}
                        value={cfg[f.k] ?? ''}
                        onChange={(e) => setDrafts((p) => ({ ...p, [it.key]: { ...(p[it.key] || {}), [f.k]: e.target.value } }))}
                        className="w-full"
                      />
                    </div>
                  ))}
                  <button type="button" className={dirty ? 'bg-[#00B050] text-white' : 'border'} disabled={!dirty} onClick={() => save(it.key, true)} style={{ minHeight: 34 }}>
                    {isAr ? 'حفظ الإعدادات' : 'Save'}
                  </button>
                </div>
              )}

              {on && it.key === 'webhook' && (
                <div className="space-y-2">
                  <label className="block text-[11px] text-slate-400 font-bold">{isAr ? 'رابط الاستقبال (انسخه في Shopify/WooCommerce)' : 'Webhook URL'}</label>
                  <input readOnly dir="ltr" value={webhookUrl} onFocus={(e) => e.target.select()} className="w-full font-mono" style={{ fontSize: 11 }} />
                  <div className="flex gap-2">
                    <button type="button" className="border" style={{ minHeight: 32 }} onClick={() => navigator.clipboard?.writeText(webhookUrl)}>{isAr ? 'نسخ' : 'Copy'}</button>
                    <button type="button" className="border" style={{ minHeight: 32 }} onClick={genWebhook}>{isAr ? 'مفتاح جديد' : 'Rotate key'}</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {loading && <div className="text-xs text-slate-400 text-center">...</div>}
    </div>
  );
}
