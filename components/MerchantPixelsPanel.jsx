'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const PLATFORMS = {
  facebook: { icon: '📘', ar: 'فيسبوك / ميتا', ph: '1234567890123456', re: /^\d{8,20}$/, hint: 'رقم البيكسل من Meta Events Manager' },
  tiktok: { icon: '🎵', ar: 'تيك توك', ph: 'C1ABCDEF2GHIJK3L', re: /^[A-Z0-9]{8,30}$/i, hint: 'Pixel ID من TikTok Events Manager' },
  snapchat: { icon: '👻', ar: 'سناب شات', ph: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', re: /^[a-z0-9-]{8,60}$/i, hint: 'Pixel ID من Snap Ads Manager' },
  ga4: { icon: '📈', ar: 'جوجل أناليتكس 4', ph: 'G-XXXXXXXXXX', re: /^G-[A-Z0-9]{4,20}$/i, hint: 'Measurement ID بيبدأ بـ G-' },
};

export const STD_EVENTS = [
  { k: 'PageView', ar: 'مشاهدة صفحة' },
  { k: 'ViewContent', ar: 'مشاهدة منتج' },
  { k: 'AddToCart', ar: 'إضافة للسلة' },
  { k: 'InitiateCheckout', ar: 'بدء إتمام الطلب' },
  { k: 'AddPaymentInfo', ar: 'بيانات الدفع' },
  { k: 'Purchase', ar: 'شراء / طلب مكتمل' },
  { k: 'Lead', ar: 'عميل محتمل' },
  { k: 'Search', ar: 'بحث' },
];

const defaultEvents = () => ({ standard: Object.fromEntries(STD_EVENTS.map((e) => [e.k, true])), custom: [] });
const NAME_RE = /^[A-Za-z0-9_]{2,40}$/;

/* ستايل مستقل: بيورّث لون النص من الصفحة، فيشتغل في لوحة التاجر ولوحة الإدارة نهاري وليلي */
const CSS = `
.px{--pxc:var(--b,var(--teal,#0a7f86));display:grid;gap:14px;color:inherit;font-family:inherit}
.px *{box-sizing:border-box}
.px-box{border:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:16px;padding:14px;display:grid;gap:12px}
.px-box.on{border-color:var(--pxc)}
.px-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.px-sp{justify-content:space-between}
.px-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
@media(max-width:760px){.px-grid{grid-template-columns:1fr}}
.px input,.px select{width:100%;min-height:40px;padding:0 12px;border-radius:12px;color:inherit;font:inherit;font-size:13px;background:color-mix(in srgb,currentColor 6%,transparent);border:1px solid color-mix(in srgb,currentColor 20%,transparent)}
.px input:focus,.px select:focus{outline:0;border-color:var(--pxc);box-shadow:0 0 0 3px color-mix(in srgb,var(--pxc) 18%,transparent)}
.px select option{color:#1f2f33;background:#fff}
.px-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:36px;padding:0 14px;border-radius:12px;cursor:pointer;white-space:nowrap;font:inherit;font-size:12.5px;font-weight:700;color:inherit;background:transparent;border:1px solid color-mix(in srgb,currentColor 22%,transparent)}
.px-btn:hover{background:color-mix(in srgb,currentColor 7%,transparent)}
.px-btn.p{background:var(--pxc);border-color:var(--pxc);color:#fff}
.px-btn.d{color:#c95e53;border-color:rgba(201,94,83,.4)}
.px-btn:disabled{opacity:.5;cursor:not-allowed}
.px-chip{min-height:30px;padding:0 12px;border-radius:999px;font:inherit;font-size:12px;font-weight:700;cursor:pointer;color:inherit;background:transparent;border:1px solid color-mix(in srgb,currentColor 25%,transparent)}
.px-chip.on{background:color-mix(in srgb,var(--pxc) 16%,transparent);border-color:var(--pxc);color:var(--pxc)}
.px-tog{width:46px;height:26px;padding:0;border-radius:999px;border:0;position:relative;cursor:pointer;flex:none;background:color-mix(in srgb,currentColor 25%,transparent);transition:.15s}
.px-tog.on{background:var(--pxc)}
.px-tog i{position:absolute;top:3px;inset-inline-start:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:.15s}
.px-tog.on i{inset-inline-start:23px}
.px-mut{font-size:11.5px;opacity:.65}
.px-t{font-weight:800;font-size:13px}
.px-mono{font-family:Inter,ui-monospace,monospace}
.px-cust{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 12px;border-radius:12px;font-size:12px;border:1px solid color-mix(in srgb,currentColor 16%,transparent)}
`;

export default function MerchantPixelsPanel({ storeId, isAr = true, canEdit = true, onCount }) {
  const [sid, setSid] = useState(storeId || '');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({ platform: 'facebook', pixel_id: '', label: '' });
  const [open, setOpen] = useState(null);
  const [cdraft, setCdraft] = useState({});

  useEffect(() => { if (storeId) setSid(storeId); }, [storeId]);

  const load = async () => {
    if (!sid) return;
    setLoading(true);
    const { data, error } = await supabase.from('store_pixels').select('*').eq('store_id', sid).order('created_at', { ascending: true });
    setErr(error ? (isAr ? 'تعذر تحميل البيكسلات. تأكد من تشغيل ملف sql_3_pixels.sql في Supabase.' : error.message) : '');
    setRows(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [sid]);
  useEffect(() => { if (onCount) onCount(rows.length); }, [rows]);

  const add = async () => {
    if (!canEdit) return;
    const id = form.pixel_id.trim();
    if (!PLATFORMS[form.platform].re.test(id)) {
      alert(isAr ? 'الـ ID غير صحيح لهذه المنصة' : 'Invalid ID');
      return;
    }
    const { data, error } = await supabase
      .from('store_pixels')
      .insert([{ store_id: sid, platform: form.platform, pixel_id: id, label: form.label.trim() || null, enabled: true, events: defaultEvents() }])
      .select()
      .single();
    if (error) { alert(error.message); return; }
    setRows((p) => [...p, data]);
    setForm({ ...form, pixel_id: '', label: '' });
    setOpen(data.id);
  };

  const patch = async (row, changes) => {
    if (!canEdit) return;
    const next = { ...row, ...changes };
    setRows((p) => p.map((r) => (r.id === row.id ? next : r)));
    const { error } = await supabase.from('store_pixels').update(changes).eq('id', row.id);
    if (error) { alert(error.message); load(); }
  };

  const remove = async (row) => {
    if (!canEdit) return;
    if (!confirm(isAr ? 'حذف هذا البيكسل؟' : 'Delete this pixel?')) return;
    const { error } = await supabase.from('store_pixels').delete().eq('id', row.id);
    if (error) return alert(error.message);
    setRows((p) => p.filter((r) => r.id !== row.id));
  };

  const ev = (row) => ({ standard: row.events?.standard || {}, custom: row.events?.custom || [] });

  const toggleStd = (row, k) => {
    const e = ev(row);
    patch(row, { events: { ...e, standard: { ...e.standard, [k]: e.standard[k] === false } } });
  };

  const addCustom = (row) => {
    const d = cdraft[row.id] || { name: '', trigger: 'click', value: '' };
    if (!NAME_RE.test(d.name)) return alert(isAr ? 'اسم الحدث: حروف إنجليزية/أرقام/_ فقط (2-40)' : 'Event name: letters, digits, _');
    if (!d.value.trim()) return alert(isAr ? 'اكتب قيمة المشغّل' : 'Trigger value required');
    const e = ev(row);
    patch(row, { events: { ...e, custom: [...e.custom, { name: d.name, trigger: d.trigger, value: d.value.trim() }] } });
    setCdraft((p) => ({ ...p, [row.id]: { name: '', trigger: d.trigger, value: '' } }));
  };

  const removeCustom = (row, i) => {
    const e = ev(row);
    patch(row, { events: { ...e, custom: e.custom.filter((_, x) => x !== i) } });
  };

  if (!sid) return <div className="px-mut">{isAr ? 'لم يتم تحديد المتجر.' : 'No store selected.'}</div>;

  return (
    <div className="px" dir={isAr ? 'rtl' : 'ltr'}>
      <style>{CSS}</style>
      {err && <div className="px-t" style={{ color: '#c95e53' }}>{err}</div>}

      {canEdit && (
        <div className="px-box">
          <div className="px-t">{isAr ? 'ربط بيكسل جديد' : 'Connect a pixel'}</div>
          <div className="px-grid">
            <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
              {Object.entries(PLATFORMS).map(([k, v]) => (<option key={k} value={k}>{v.icon} {v.ar}</option>))}
            </select>
            <input dir="ltr" className="px-mono" style={{ gridColumn: 'span 2' }} placeholder={PLATFORMS[form.platform].ph} value={form.pixel_id} onChange={(e) => setForm({ ...form, pixel_id: e.target.value })} />
            <input placeholder={isAr ? 'اسم للتمييز (اختياري)' : 'Label'} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </div>
          <div className="px-row px-sp">
            <span className="px-mut">{PLATFORMS[form.platform].hint}</span>
            <button type="button" className="px-btn p" onClick={add}>+ {isAr ? 'ربط البيكسل' : 'Connect'}</button>
          </div>
        </div>
      )}

      {loading && <div className="px-mut">...</div>}
      {!loading && rows.length === 0 && !err && (
        <div className="px-mut" style={{ textAlign: 'center', padding: '18px 0' }}>{isAr ? 'لا توجد بيكسلات مربوطة بعد. أضف أول بيكسل من فوق.' : 'No pixels yet.'}</div>
      )}

      {rows.map((row) => {
        const pf = PLATFORMS[row.platform] || { icon: '🔗', ar: row.platform };
        const e = ev(row);
        const isOpen = open === row.id;
        const draft = cdraft[row.id] || { name: '', trigger: 'click', value: '' };
        return (
          <div key={row.id} className={'px-box' + (row.enabled ? ' on' : '')}>
            <div className="px-row px-sp">
              <div className="px-row" style={{ minWidth: 0 }}>
                <span style={{ fontSize: 24 }}>{pf.icon}</span>
                <div style={{ minWidth: 0 }}>
                  <div className="px-t">{row.label || pf.ar}</div>
                  <div className="px-mut px-mono" dir="ltr">{pf.ar} · {row.pixel_id}</div>
                </div>
              </div>
              <div className="px-row">
                <button type="button" className="px-btn" onClick={() => setOpen(isOpen ? null : row.id)}>
                  {isOpen ? (isAr ? 'إخفاء الأحداث' : 'Hide') : (isAr ? 'الأحداث' : 'Events')}
                </button>
                <button type="button" role="switch" aria-checked={!!row.enabled} disabled={!canEdit} className={'px-tog' + (row.enabled ? ' on' : '')} onClick={() => patch(row, { enabled: !row.enabled })}><i /></button>
                {canEdit && <button type="button" className="px-btn d" onClick={() => remove(row)}>🗑</button>}
              </div>
            </div>

            {isOpen && (
              <div style={{ display: 'grid', gap: 16, paddingTop: 12, borderTop: '1px solid color-mix(in srgb,currentColor 14%,transparent)' }}>
                <div>
                  <div className="px-t" style={{ marginBottom: 8 }}>{isAr ? 'الأحداث القياسية (فعّل اللي تحتاجه)' : 'Standard events'}</div>
                  <div className="px-row">
                    {STD_EVENTS.map((s) => (
                      <button key={s.k} type="button" className={'px-chip' + (e.standard[s.k] !== false ? ' on' : '')} onClick={() => toggleStd(row, s.k)}>
                        {e.standard[s.k] !== false ? '✓ ' : ''}{s.ar}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="px-t" style={{ marginBottom: 8 }}>{isAr ? 'أحداث مخصصة' : 'Custom events'}</div>
                  {e.custom.length === 0 && <div className="px-mut" style={{ marginBottom: 8 }}>{isAr ? 'مثال: حدث WhatsAppClick يتسجل لما العميل يضغط على زر واتساب.' : ''}</div>}
                  <div style={{ display: 'grid', gap: 8, marginBottom: 10 }}>
                    {e.custom.map((c, i) => (
                      <div key={i} className="px-cust">
                        <b className="px-mono" dir="ltr">{c.name}</b>
                        <span className="px-mut" dir="ltr">{c.trigger === 'click' ? `click → ${c.value}` : `url contains ${c.value}`}</span>
                        {canEdit && <button type="button" className="px-btn d" style={{ minHeight: 28, padding: '0 10px' }} onClick={() => removeCustom(row, i)}>✕</button>}
                      </div>
                    ))}
                  </div>
                  {canEdit && (
                    <div className="px-grid">
                      <input dir="ltr" className="px-mono" placeholder="EventName" value={draft.name} onChange={(ev2) => setCdraft((p) => ({ ...p, [row.id]: { ...draft, name: ev2.target.value } }))} />
                      <select value={draft.trigger} onChange={(ev2) => setCdraft((p) => ({ ...p, [row.id]: { ...draft, trigger: ev2.target.value } }))}>
                        <option value="click">{isAr ? 'عند الضغط على عنصر' : 'On click'}</option>
                        <option value="path">{isAr ? 'عند زيارة صفحة' : 'On page visit'}</option>
                      </select>
                      <input dir="ltr" className="px-mono" placeholder={draft.trigger === 'click' ? '#whatsapp-btn أو .buy-now' : '/thank-you'} value={draft.value} onChange={(ev2) => setCdraft((p) => ({ ...p, [row.id]: { ...draft, value: ev2.target.value } }))} />
                      <button type="button" className="px-btn p" onClick={() => addCustom(row)}>+ {isAr ? 'إضافة' : 'Add'}</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
