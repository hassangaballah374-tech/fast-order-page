'use client';
import React, { useEffect, useState } from 'react';
import { useDash, PageHead, Modal, Field, Empty, Spin, Badge, Stat, Tabs, Tog } from '../ui';
import { useTable, api } from '../hooks';
import { Crud, ConfigForm } from '../forms';
import { useSection, SaveBtn, LinkBox } from '../bits';
import { fdate } from '../shared';
import { GOVERNORATES, money, isValidEgPhone, normalizePhone, safeUrl } from '../../../lib/storeKit';
import { supabase } from '../../../lib/supabase';

const usd = (n) => `$${(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const TX_STATUS = { pending: ['قيد المراجعة', '#d97706'], done: ['تم', '#16a34a'], rejected: ['مرفوض', '#dc2626'] };

/* ====================== رصيدك ====================== */
export function BalanceScreen() {
  const { store, say, go } = useDash();
  const t = useTable('store_wallet_tx', { order: 'created_at', limit: 50 });
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = t.rows.filter((x) => x.status === 'pending');

  const request = async () => {
    const a = Number(amount);
    if (!(a >= 1 && a <= 10000)) { say('المبلغ بالدولار من 1 إلى 10000'); return; }
    if (String(note).trim().length < 3) { say('اكتب بيانات التحويل (رقم العملية أو طريقة الدفع)'); return; }
    setBusy(true);
    const res = await t.insert({ kind: 'topup', amount_usd: a, status: 'pending', note: String(note).trim().slice(0, 300) });
    setBusy(false);
    if (res) { setAmount(''); setNote(''); say('✅ تم إرسال طلب الشحن وسيُراجع من الإدارة'); }
  };

  return (
    <>
      <PageHead title="رصيدك" sub="محفظة سبايك" />
      <div className="grid4" style={{ marginBottom: 16 }}>
        <Stat label="الرصيد الحالي" value={usd(store?.wallet_balance_usd)} color="#0a7f86" />
        <Stat label="طلبات شحن قيد المراجعة" value={pending.length} hint={pending.length ? usd(pending.reduce((a, x) => a + Number(x.amount_usd || 0), 0)) : ''} />
      </div>
      <div className="card">
        <h3>طلب شحن رصيد</h3>
        <p className="mut dsc">حوّل المبلغ بالطريقة المتفق عليها مع إدارة سبايك، ثم اكتب بيانات التحويل هنا. يُضاف الرصيد بعد تأكيد الإدارة استلام المبلغ.</p>
        <div className="fgrid">
          <Field l="المبلغ (دولار)"><input className="in num" type="number" min="1" max="10000" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          <Field l="بيانات التحويل" hint="مثال: فودافون كاش من 010xxxxxxxx، رقم العملية 12345"><input className="in" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} /></Field>
        </div>
        <div className="row" style={{ marginBottom: 0 }}>
          <button type="button" className="btn p" disabled={busy} onClick={request}>{busy ? '...' : 'إرسال الطلب'}</button>
          <button type="button" className="btn" onClick={() => go('tx')}>سجل المعاملات</button>
        </div>
      </div>
    </>
  );
}

/* ====================== المعاملات ====================== */
export function TxScreen() {
  const { isAdmin, say, reloadStore } = useDash();
  const t = useTable('store_wallet_tx', { order: 'created_at', limit: 300 });
  const [queue, setQueue] = useState(null);
  const [busy, setBusy] = useState(0);

  const loadQueue = async () => {
    if (!isAdmin) return;
    const { data, error } = await supabase.from('store_wallet_tx').select('*').eq('status', 'pending').order('created_at', { ascending: true }).limit(200);
    if (error) { say(error.message); setQueue([]); return; }
    const ids = [...new Set((data || []).map((x) => x.store_id))];
    let names = {};
    if (ids.length) {
      const { data: st } = await supabase.from('store_profiles').select('user_id, store_name, owner_name').in('user_id', ids);
      (st || []).forEach((s) => { names[String(s.user_id)] = s.store_name || s.owner_name; });
    }
    setQueue((data || []).map((x) => ({ ...x, store_name: names[x.store_id] || x.store_id })));
  };
  useEffect(() => { loadQueue(); }, [isAdmin]);

  const decide = async (x, ok) => {
    if (!window.confirm(ok ? `تأكيد إضافة ${usd(x.amount_usd)} لرصيد «${x.store_name}»؟` : 'رفض هذا الطلب؟')) return;
    setBusy(x.id);
    const { data, error } = await supabase.rpc('approve_wallet_tx', { p_id: x.id, p_ok: ok });
    setBusy(0);
    if (error || data === false) { say(error?.message || 'تعذر التنفيذ (ربما تمت معالجته)'); } else { say(ok ? '✅ تمت إضافة الرصيد' : 'تم الرفض'); }
    loadQueue(); t.refresh(); reloadStore();
  };

  return (
    <>
      <PageHead title="المعاملات" sub={`${t.rows.length} معاملة`} />
      {isAdmin && (
        <div className="card tw" style={{ marginBottom: 16 }}>
          <h3 style={{ padding: '12px 14px 0' }}>👑 طلبات الشحن المعلّقة (الأدمن)</h3>
          {queue === null ? <div className="c"><Spin /></div> : queue.length === 0 ? <Empty icon="✅" t="لا توجد طلبات معلّقة" /> : (
            <table className="tbl">
              <thead><tr><th>المتجر</th><th>المبلغ</th><th>بيانات التحويل</th><th>التاريخ</th><th /></tr></thead>
              <tbody>
                {queue.map((x) => (
                  <tr key={x.id}>
                    <td><b>{x.store_name}</b></td><td className="num"><b>{usd(x.amount_usd)}</b></td><td>{x.note}</td><td>{fdate(x.created_at)}</td>
                    <td className="acts">
                      <button type="button" className="btn p sm" disabled={busy === x.id} onClick={() => decide(x, true)}>قبول</button>
                      <button type="button" className="btn sm dng" disabled={busy === x.id} onClick={() => decide(x, false)}>رفض</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      <div className="card tw">
        {t.loading ? <div className="c"><Spin /></div> : t.rows.length === 0 ? <Empty icon="🧾" t="لا توجد معاملات بعد" d="طلبات شحن الرصيد تظهر هنا" /> : (
          <table className="tbl">
            <thead><tr><th>النوع</th><th>المبلغ</th><th>الحالة</th><th>ملاحظة</th><th>التاريخ</th></tr></thead>
            <tbody>
              {t.rows.map((x) => {
                const [lbl, c] = TX_STATUS[x.status] || [x.status, '#718096'];
                return <tr key={x.id}><td>شحن رصيد</td><td className="num">{usd(x.amount_usd)}</td><td><Badge c={c}>{lbl}</Badge></td><td>{x.note}</td><td>{fdate(x.created_at)}</td></tr>;
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

/* ====================== الشحن والتوصيل ====================== */
function ShippingRates() {
  const s = useSection('shipping');
  const p = useSection('payment');
  const { cur, say } = useDash();
  const saveBoth = async () => {
    if (!(Number(s.draft.default_price) >= 0)) { say('سعر الشحن الافتراضي غير صحيح'); return; }
    if (!(Number(s.draft.courier_cost) >= 0)) { say('تكلفة شركة الشحن غير صحيحة'); return; }
    if (!(Number(p.draft.cod_fee) >= 0)) { say('رسوم الدفع عند الاستلام غير صحيحة'); return; }
    if (s.dirty) await s.save();
    if (p.dirty) await p.save();
  };
  const dirty = s.dirty || p.dirty;
  const n = (sec, k, l, hint) => (
    <Field l={l} hint={hint}><input className="in num" type="number" min="0" value={sec.draft[k] ?? ''} onChange={(e) => sec.set(k, e.target.value === '' ? '' : Number(e.target.value))} /></Field>
  );
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="row"><button type="button" className="btn p" disabled={!dirty || s.busy || p.busy} onClick={saveBoth}>{dirty ? 'حفظ التغييرات' : 'محفوظ ✓'}</button></div>
      <div className="fgrid">
        {n(s, 'default_price', `سعر الشحن الافتراضي (${cur})`, 'يُستخدم للمحافظة التي ليس لها سعر خاص')}
        {n(s, 'courier_cost', `تكلفة شركة الشحن عليك (${cur})`, 'لحساب الربح الصافي فقط، لا تظهر للعميل')}
        {n(p, 'cod_fee', `رسوم الدفع عند الاستلام (${cur})`, '0 = بدون رسوم')}
      </div>
    </div>
  );
}

export function ShippingScreen() {
  const { cur, say } = useDash();
  return (
    <>
      <ShippingRates />
      <Crud
        table="store_shipping_zones" noun="محافظة" title="أسعار الشحن لكل محافظة" order="governorate" asc toggleKey="enabled"
        desc="حدّد سعر وموعد التوصيل لكل محافظة. المحافظة المعطّلة لا يمكن الطلب إليها."
        defaults={{ enabled: true, price: 60 }}
        search={(r) => r.governorate}
        toolbar={(t) => (
          <button type="button" className="btn" onClick={async () => {
            const have = new Set(t.rows.map((r) => r.governorate));
            const miss = GOVERNORATES.filter(([g]) => !have.has(g));
            if (!miss.length) { say('كل المحافظات مضافة بالفعل'); return; }
            if (!window.confirm(`إضافة ${miss.length} محافظة بأسعار مقترحة؟ يمكنك تعديلها بعد ذلك.`)) return;
            for (const [g, price] of miss) await t.insert({ governorate: g, price, eta: '2-4 أيام', enabled: true });
            say(`✅ تمت إضافة ${miss.length} محافظة`);
            t.reload();
          }}
          >➕ إضافة كل المحافظات</button>
        )}
        columns={[
          { l: 'المحافظة', render: (r) => <b>{r.governorate}</b> },
          { l: 'السعر', render: (r) => <b className="num">{money(r.price, cur)}</b> },
          { l: 'مدة التوصيل', render: (r) => r.eta || '—' },
        ]}
        fields={[
          { k: 'governorate', l: 'المحافظة', type: 'select', options: GOVERNORATES.map(([g]) => g) },
          { k: 'price', l: `سعر الشحن (${cur})`, type: 'number', min: 0 },
          { k: 'eta', l: 'مدة التوصيل', ph: '2-4 أيام' },
        ]}
        validate={(e) => (!e.governorate ? 'اختر المحافظة' : !(Number(e.price) >= 0) || e.price === '' ? 'اكتب سعر الشحن' : '')}
        transform={(e) => ({ ...e, price: Number(e.price), eta: String(e.eta || '').trim() || null })}
      />
    </>
  );
}

/* ====================== التطبيقات ====================== */
export function BostaCard() {
  const { uid, say } = useDash();
  const [row, setRow] = useState(undefined);
  const [key, setKey] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const load = async () => {
    const { data } = await supabase.from('store_integrations').select('*').eq('store_id', uid).eq('provider', 'bosta').maybeSingle();
    setRow(data || null);
    setEnabled(!!data?.enabled);
  };
  useEffect(() => { if (uid) load(); }, [uid]);
  const has = !!row?.config?.api_key;
  const save = async () => {
    if (enabled && !key.trim() && !has) { say('أدخل مفتاح الـ API من حساب بوسطة'); return; }
    setBusy(true);
    const config = { ...(row?.config || {}) };
    if (key.trim()) config.api_key = key.trim();
    const { error } = await supabase.from('store_integrations').upsert({ store_id: uid, provider: 'bosta', enabled, config, updated_at: new Date().toISOString() }, { onConflict: 'store_id,provider' });
    setBusy(false);
    if (error) { say(`تعذر الحفظ: ${error.message}`); return; }
    setKey(''); say('✅ تم الحفظ'); load();
  };
  return (
    <div className="card">
      <div className="appc">
        <div className="top2">
          <span className="ai">🚚</span>
          <div style={{ flex: 1 }}><b>بوسطة (Bosta)</b><p>إرسال الطلبات لبوسطة من «كل الطلبات» برقم تتبع تلقائي.</p></div>
          <Tog on={enabled} set={setEnabled} />
        </div>
        {row === undefined ? <Spin /> : (
          <Field l="مفتاح API" hint={has ? 'محفوظ ✓ اتركه فارغاً للإبقاء عليه' : 'من لوحة بوسطة ← Settings ← API Integration'}>
            <input className="in num" dir="ltr" type="password" autoComplete="off" placeholder={has ? '••••••••••••' : ''} value={key} onChange={(e) => setKey(e.target.value)} />
          </Field>
        )}
        <div><button type="button" className="btn p" disabled={busy || row === undefined} onClick={save}>{busy ? '...' : 'حفظ'}</button></div>
        <small className="hint">يُنصح بإرسال طلب تجريبي واحد والتأكد من ظهوره في لوحة بوسطة قبل الاعتماد عليه.</small>
      </div>
    </div>
  );
}

export function AppsScreen() {
  const { go } = useDash();
  const links = [
    ['🎯', 'بكسل فيسبوك / تيك توك / سناب / GA4', 'إدارة البكسلات والأحداث', 'pixels'],
    ['📡', 'Conversion API', 'إرسال المبيعات من السيرفر', 'capi'],
    ['🏷️', 'Google Tag Manager', 'ربط حاوية GTM', 'gtm'],
    ['🛍️', 'Google Merchant', 'رابط Product Feed', 'merchant'],
    ['💬', 'واتساب', 'القوالب والزر العائم', 'wa'],
  ];
  return (
    <>
      <PageHead title="التطبيقات" sub="الربط مع الخدمات الخارجية" />
      <div style={{ display: 'grid', gap: 16 }}>
        <BostaCard />
        <div className="card">
          <h3>خدمات أخرى</h3>
          {links.map(([i, t, d, id]) => (
            <div className="pls" key={id}>
              <span style={{ fontSize: 22 }}>{i}</span>
              <p><b>{t}</b><small>{d}</small></p>
              <button type="button" className="btn sm" onClick={() => go(id)}>فتح</button>
            </div>
          ))}
          <small className="hint">شركات شحن أخرى غير متاحة حالياً.</small>
        </div>
      </div>
    </>
  );
}

/* ====================== معرض الخدمات / خدمات التسويق ====================== */
const SERVICES = [
  ['logo', '🎨', 'تصميم شعار وهوية', 'شعار ولوحة ألوان لمتجرك'],
  ['product_photo', '📸', 'تصوير وتحسين صور المنتجات', 'صور احترافية تزيد المبيعات'],
  ['copy', '✍️', 'كتابة وصف المنتجات', 'نصوص بيعية بالعامية المصرية'],
  ['store_setup', '🛠️', 'إعداد المتجر بالكامل', 'نرفع منتجاتك ونضبط الشحن والتتبع'],
  ['landing', '📄', 'تصميم صفحة هبوط', 'صفحة بيع مخصصة لمنتجك'],
];
const MSERVICES = [
  ['fb_ads', '📘', 'إدارة إعلانات فيسبوك/إنستجرام', 'إنشاء الحملات وتحسينها'],
  ['tt_ads', '🎵', 'إدارة إعلانات تيك توك', 'حملات فيديو وقياس النتائج'],
  ['ugc', '🎬', 'محتوى فيديو (UGC)', 'فيديوهات قصيرة للإعلانات'],
  ['pixel_setup', '📡', 'ضبط البكسل وConversion API', 'تتبع صحيح للمبيعات'],
  ['influencer', '🤝', 'تسويق مع المؤثرين', 'ترشيح والتنسيق مع مؤثرين'],
];

function ServicesView({ title, sub, catalog }) {
  const { say } = useDash();
  const reqs = useTable('store_service_requests', { order: 'created_at', limit: 100 });
  const [pick, setPick] = useState(null);
  const [f, setF] = useState({ details: '', contact: '' });
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const c = normalizePhone(f.contact);
    if (!isValidEgPhone(c)) { say('اكتب رقم موبايل مصري صحيح للتواصل'); return; }
    if (f.details.trim().length < 10) { say('اشرح طلبك بالتفصيل (10 أحرف على الأقل)'); return; }
    setBusy(true);
    const res = await reqs.insert({ service_key: pick[0], title: pick[2], details: f.details.trim().slice(0, 1000), contact: c, status: 'new' });
    setBusy(false);
    if (res) { setPick(null); setF({ details: '', contact: '' }); say('✅ تم إرسال طلبك وسنتواصل معك'); }
  };
  const mine = reqs.rows.filter((r) => catalog.some((c) => c[0] === r.service_key));
  const ST = { new: ['جديد', '#d97706'], contacted: ['تم التواصل', '#0a7f86'], done: ['مكتمل', '#16a34a'], cancelled: ['ملغي', '#718096'] };

  return (
    <>
      <PageHead title={title} sub={sub} />
      <p className="mut dsc">اطلب الخدمة وسيتواصل معك فريق سبايك لتحديد التفاصيل والسعر. لا يوجد دفع داخل المنصة.</p>
      <div className="grid4">
        {catalog.map((c) => (
          <div className="card" key={c[0]} style={{ padding: 16 }}>
            <div style={{ fontSize: 30 }}>{c[1]}</div>
            <b style={{ display: 'block', margin: '6px 0 2px' }}>{c[2]}</b>
            <small className="mut">{c[3]}</small>
            <div style={{ marginTop: 10 }}><button type="button" className="btn p sm" onClick={() => setPick(c)}>اطلب الخدمة</button></div>
          </div>
        ))}
      </div>
      {mine.length > 0 && (
        <div className="card tw" style={{ marginTop: 16 }}>
          <h3 style={{ padding: '12px 14px 0' }}>طلباتي</h3>
          <table className="tbl">
            <thead><tr><th>الخدمة</th><th>الحالة</th><th>التاريخ</th></tr></thead>
            <tbody>{mine.map((r) => { const [l, c] = ST[r.status] || [r.status, '#718096']; return <tr key={r.id}><td><b>{r.title}</b></td><td><Badge c={c}>{l}</Badge></td><td>{fdate(r.created_at)}</td></tr>; })}</tbody>
          </table>
        </div>
      )}
      {pick && (
        <Modal
          t={`طلب: ${pick[2]}`} x={() => setPick(null)}
          foot={<><button type="button" className="btn" onClick={() => setPick(null)}>إلغاء</button><button type="button" className="btn p" disabled={busy} onClick={send}>{busy ? '...' : 'إرسال الطلب'}</button></>}
        >
          <div className="fgrid">
            <Field l="رقم التواصل (واتساب)" full><input className="in num" dir="ltr" value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} /></Field>
            <Field l="تفاصيل طلبك" full><textarea className="in ta" rows={5} maxLength={1000} value={f.details} onChange={(e) => setF({ ...f, details: e.target.value })} /></Field>
          </div>
        </Modal>
      )}
    </>
  );
}

export const ServicesScreen = () => <ServicesView title="معرض الخدمات" sub="خدمات تصميم وإعداد" catalog={SERVICES} />;
export const MServicesScreen = () => <ServicesView title="خدمات التسويق" sub="إعلانات ومحتوى" catalog={MSERVICES} />;

/* ====================== التسويق بالعمولة ====================== */
export function AffiliateScreen() {
  const { go, storeUrl } = useDash();
  const refs = useTable('store_referrals', { order: 'created_at', limit: 500 });
  const clicks = refs.rows.reduce((a, r) => a + (Number(r.clicks) || 0), 0);
  return (
    <>
      <PageHead title="نظام التسويق بالعمولة" sub="مسوّقون يبيعون لك مقابل عمولة" />
      <div className="grid4" style={{ marginBottom: 16 }}>
        <Stat label="روابط الإحالة" value={refs.rows.length} />
        <Stat label="إجمالي الزيارات" value={clicks} />
      </div>
      <div className="card">
        <ol className="steps">
          <li><span>أنشئ رابط إحالة لكل مسوّق من «إنشاء روابط الإحالة» وحدد نسبة عمولته.</span></li>
          <li><span>المسوّق ينشر رابطه، وكل طلب يأتي منه يُسجَّل باسمه تلقائياً.</span></li>
          <li><span>تُحسب العمولة المستحقة عند تسليم الطلب، وتسجّل ما دفعته له لتعرف المتبقي.</span></li>
        </ol>
        <div className="row" style={{ marginBottom: 0 }}><button type="button" className="btn p" onClick={() => go('referrals')}>إدارة روابط الإحالة</button></div>
        {storeUrl && <div style={{ marginTop: 12 }}><small className="mut">مثال على رابط:</small><LinkBox url={`${storeUrl}?ref=اسم-المسوق`} /></div>}
      </div>
    </>
  );
}

/* ====================== الإعدادات ====================== */
function StoreInfo() {
  const { uid, store, say, reloadStore, origin } = useDash();
  const [name, setName] = useState(store?.store_name || '');
  const [slug, setSlug] = useState(store?.store_slug || '');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    const sl = slug.toLowerCase().trim();
    if (name.trim().length < 2) { say('اكتب اسم المتجر'); return; }
    if (!/^[a-z0-9](?:[a-z0-9-]{1,38})[a-z0-9]$/.test(sl)) { say('الرابط من 3 إلى 40 حرفاً إنجليزياً أو أرقاماً أو شرطة'); return; }
    if (sl !== store?.store_slug && !window.confirm('تغيير رابط المتجر سيُبطل الروابط القديمة (الإعلانات والمشاركات). متأكد؟')) return;
    setBusy(true);
    const r = await api('/api/dashboard/store', { action: 'save', store_id: uid, name: name.trim(), slug: sl });
    setBusy(false);
    if (!r.ok) { say(r.error || 'تعذر الحفظ'); return; }
    say('✅ تم الحفظ'); reloadStore();
  };
  return (
    <div className="card">
      <div className="fgrid">
        <Field l="اسم المتجر"><input className="in" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field l="رابط المتجر" hint={`${origin || ''}/shop/${slug || '...'}`}><input className="in num" dir="ltr" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} /></Field>
      </div>
      <button type="button" className="btn p" disabled={busy} onClick={save}>{busy ? '...' : 'حفظ'}</button>
    </div>
  );
}

function ContactForm() {
  const s = useSection('contact');
  const o = useSection('social');
  const validate = () => {
    const w = String(s.draft.whatsapp || '').trim();
    if (w && !isValidEgPhone(normalizePhone(w))) return 'رقم الواتساب لازم يكون رقم مصري صحيح (مثل 01012345678)';
    if (s.draft.email && !/^\S+@\S+\.\S+$/.test(s.draft.email)) return 'البريد الإلكتروني غير صحيح';
    for (const k of ['instagram', 'facebook', 'tiktok', 'youtube']) if (o.draft[k] && !safeUrl(o.draft[k])) return `رابط ${k} لازم يبدأ بـ https://`;
    return '';
  };
  const { say } = useDash();
  const dirty = s.dirty || o.dirty;
  const save = async () => {
    const m = validate();
    if (m) { say(m); return; }
    if (s.dirty) await s.save();
    if (o.dirty) await o.save();
  };
  const t = (sec, k, l, ph, ltr) => (
    <Field l={l}><input className={'in' + (ltr ? ' num' : '')} dir={ltr ? 'ltr' : undefined} placeholder={ph} value={sec.draft[k] || ''} onChange={(e) => sec.set(k, e.target.value)} /></Field>
  );
  return (
    <div className="card">
      <div className="row"><button type="button" className="btn p" disabled={!dirty} onClick={save}>{dirty ? 'حفظ التغييرات' : 'محفوظ ✓'}</button></div>
      <div className="fgrid">
        {t(s, 'whatsapp', 'رقم واتساب المتجر', '01012345678', true)}
        {t(s, 'phone', 'هاتف للتواصل', '', true)}
        {t(s, 'email', 'البريد الإلكتروني', '', true)}
        {t(s, 'address', 'العنوان')}
        {t(o, 'instagram', 'إنستجرام', 'https://instagram.com/...', true)}
        {t(o, 'facebook', 'فيسبوك', 'https://facebook.com/...', true)}
        {t(o, 'tiktok', 'تيك توك', 'https://tiktok.com/@...', true)}
        {t(o, 'youtube', 'يوتيوب', 'https://youtube.com/...', true)}
      </div>
    </div>
  );
}

export function SettingsScreen() {
  const [tab, setTab] = useState('store');
  const { cfg, saveCfg, say } = useDash();
  const [cur, setCur] = useState(cfg.currency || 'ج.م');
  return (
    <>
      <PageHead title="الإعدادات" sub="إعدادات المتجر العامة" />
      <Tabs value={tab} onChange={setTab} tabs={[['store', 'المتجر'], ['contact', 'التواصل والسوشيال'], ['seo', 'SEO'], ['policies', 'السياسات'], ['domain', 'الدومين'], ['currency', 'العملة']]} />
      <div style={{ marginTop: 14 }}>
        {tab === 'store' && <StoreInfo />}
        {tab === 'contact' && <ContactForm />}
        {tab === 'seo' && (
          <ConfigForm
            section="seo" title="تحسين محركات البحث" desc="العنوان والوصف الذي يظهر في جوجل وعند مشاركة رابط المتجر."
            fields={[
              { k: 'title', l: 'عنوان المتجر في جوجل', full: true, hint: 'حتى 60 حرفاً' },
              { k: 'description', l: 'وصف المتجر', type: 'textarea', rows: 3, hint: 'حتى 160 حرفاً' },
              { k: 'og_image', l: 'صورة المشاركة (OG)', type: 'image', folder: 'seo' },
              { k: 'robots_index', l: 'الفهرسة', type: 'toggle', text: 'السماح لجوجل بفهرسة المتجر' },
            ]}
            validate={(d) => ((d.title || '').length > 70 ? 'العنوان طويل (الأفضل حتى 60 حرفاً)' : (d.description || '').length > 200 ? 'الوصف طويل (الأفضل حتى 160 حرفاً)' : '')}
          />
        )}
        {tab === 'policies' && (
          <ConfigForm
            section="policies" title="السياسات" desc="تظهر في أسفل المتجر. للمزيد من الصفحات استخدم «الصفحات»."
            fields={[
              { k: 'returns', l: 'سياسة الاسترجاع والاستبدال', type: 'textarea', rows: 6 },
              { k: 'about', l: 'من نحن', type: 'textarea', rows: 6 },
            ]}
          />
        )}
        {tab === 'domain' && (
          <ConfigForm
            section="domain" title="الدومين الخاص" desc="سجّل الدومين الذي تريد ربطه بمتجرك."
            fields={[{ k: 'custom_domain', l: 'الدومين', type: 'ltr', ph: 'shop.example.com', hint: 'بدون https://' }]}
            validate={(d) => (d.custom_domain && !/^(?!-)([a-z0-9-]+\.)+[a-z]{2,}$/i.test(String(d.custom_domain).trim()) ? 'اكتب دومين صحيحاً مثل shop.example.com' : '')}
          >
            {() => <div className="pv" style={{ marginTop: 14 }}><b>ملاحظة مهمة</b><span>حفظ الدومين هنا يسجّله فقط. الربط الفعلي يحتاج إضافة الدومين في إعدادات الاستضافة وضبط الـ DNS، وهو يتم عن طريق إدارة سبايك حالياً.</span></div>}
          </ConfigForm>
        )}
        {tab === 'currency' && (
          <div className="card">
            <Field l="رمز العملة الظاهر في المتجر" hint="مثل: ج.م أو EGP">
              <input className="in" style={{ maxWidth: 200 }} maxLength={8} value={cur} onChange={(e) => setCur(e.target.value)} />
            </Field>
            <button type="button" className="btn p" onClick={async () => { const v = cur.trim(); if (!v) { say('اكتب رمز العملة'); return; } if (await saveCfg('currency', v)) say('✅ تم الحفظ'); }}>حفظ</button>
          </div>
        )}
      </div>
    </>
  );
}
