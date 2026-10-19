'use client';
import React, { useEffect, useState } from 'react';
import { useDash, PageHead, Modal, Field, Empty, Spin, Badge, Tog, CopyBtn } from '../ui';
import { useTable, useProducts } from '../hooks';
import { ConfigForm } from '../forms';
import { LinkBox } from '../bits';
import { fdate } from '../shared';
import { GTM_RE } from '../../../lib/storeKit';
import { supabase } from '../../../lib/supabase';

/* ====================== إعدادات البكسل ====================== */
const PLATFORMS = {
  facebook: { ar: 'فيسبوك / إنستجرام (Meta Pixel)', icon: '📘', re: /^\d{8,20}$/, ph: '123456789012345', hint: 'من مدير الأحداث في ميتا: أرقام فقط' },
  tiktok: { ar: 'تيك توك (TikTok Pixel)', icon: '🎵', re: /^[A-Za-z0-9]{10,30}$/, ph: 'C1A2B3C4D5E6F7G8H9', hint: 'كود البكسل من TikTok Events Manager' },
  snapchat: { ar: 'سناب شات (Snap Pixel)', icon: '👻', re: /^[0-9a-fA-F-]{20,40}$/, ph: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', hint: 'معرّف البكسل من Snap Ads Manager' },
  ga4: { ar: 'جوجل أناليتيكس (GA4)', icon: '📊', re: /^G-[A-Za-z0-9]{6,14}$/, ph: 'G-XXXXXXXXXX', hint: 'معرّف القياس يبدأ بـ G-' },
};

/* standard = تعمل افتراضياً. extra = إضافات من سبايك (تعمل فقط لو فعّلتها) */
const EVENTS = [
  { k: 'PageView', ar: 'مشاهدة صفحة', std: true },
  { k: 'ViewContent', ar: 'مشاهدة منتج', std: true },
  { k: 'AddToCart', ar: 'إضافة للسلة', std: true },
  { k: 'InitiateCheckout', ar: 'بدء إتمام الطلب', std: true },
  { k: 'Purchase', ar: 'شراء (بعد تأكيد الطلب)', std: true },
  { k: 'Lead', ar: 'اشتراك بالنشرة (Lead)', std: true },
  { k: 'Contact', ar: '✦ ضغط زر واتساب', std: false },
  { k: 'Scroll75', ar: '✦ قراءة 75% من صفحة المنتج', std: false },
  { k: 'Time30', ar: '✦ بقاء 30 ثانية في الصفحة', std: false },
  { k: 'ApplyCoupon', ar: '✦ استخدام كود خصم', std: false },
];
const defaultEvents = () => Object.fromEntries(EVENTS.map((e) => [e.k, e.std]));

export function PixelsScreen() {
  const { say } = useDash();
  const t = useTable('store_pixels', { order: 'created_at', asc: true });
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);

  const open = (r) => setEdit(r ? { ...r, events: { ...defaultEvents(), ...(r.events || {}) } } : { _new: true, platform: 'facebook', pixel_id: '', label: '', enabled: true, events: defaultEvents() });

  const save = async () => {
    const pf = PLATFORMS[edit.platform];
    const id = String(edit.pixel_id || '').trim();
    if (!pf.re.test(id)) { say(`معرّف غير صحيح لـ ${pf.ar}. ${pf.hint}`); return; }
    setBusy(true);
    const row = { platform: edit.platform, pixel_id: id, label: String(edit.label || '').trim() || null, enabled: edit.enabled !== false, events: edit.events };
    const res = edit._new ? await t.insert(row) : await t.update(edit.id, row);
    setBusy(false);
    if (res) { setEdit(null); say('✅ تم حفظ البكسل وسيعمل في المتجر فوراً'); }
  };
  const del = async (r) => { if (window.confirm('حذف هذا البكسل؟')) { if (await t.remove(r.id)) say('تم الحذف'); } };

  return (
    <>
      <PageHead title="إعدادات البكسل" sub={`${t.rows.length} بكسل`}>
        <button type="button" className="btn p" onClick={() => open(null)}>+ إضافة بكسل</button>
      </PageHead>
      <p className="mut dsc">أضف أكثر من بكسل لكل منصة، وتحكم في الأحداث التي ترسلها. أحداث ✦ إضافية من سبايك.</p>
      {t.err && <div className="card errbox">⚠️ {t.err}</div>}
      <div className="card tw">
        {t.loading ? <div className="c"><Spin /></div> : t.rows.length === 0 ? <Empty icon="🎯" t="لا توجد بكسلات" d="أضف بكسل فيسبوك أو تيك توك لتتبع المبيعات وتحسين إعلاناتك" /> : (
          <table className="tbl">
            <thead><tr><th>المنصة</th><th>المعرّف</th><th>الأحداث</th><th>مفعّل</th><th /></tr></thead>
            <tbody>
              {t.rows.map((r) => {
                const ev = { ...defaultEvents(), ...(r.events || {}) };
                const on = EVENTS.filter((e) => (e.std ? ev[e.k] !== false : ev[e.k] === true)).length;
                return (
                  <tr key={r.id}>
                    <td><b>{(PLATFORMS[r.platform] || {}).icon} {(PLATFORMS[r.platform] || {}).ar || r.platform}</b>{r.label && <small>{r.label}</small>}</td>
                    <td className="num" dir="ltr" style={{ textAlign: 'start' }}>{r.pixel_id}</td>
                    <td><Badge c="#0a7f86">{on} من {EVENTS.length}</Badge></td>
                    <td><Tog on={r.enabled !== false} set={(v) => t.update(r.id, { enabled: v })} /></td>
                    <td className="acts">
                      <button type="button" className="btn sm" onClick={() => open(r)}>تعديل</button>
                      <button type="button" className="btn sm dng" onClick={() => del(r)}>حذف</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {edit && (
        <Modal
          wide t={edit._new ? 'إضافة بكسل' : 'تعديل البكسل'} x={() => setEdit(null)}
          foot={<><button type="button" className="btn" onClick={() => setEdit(null)}>إلغاء</button><button type="button" className="btn p" disabled={busy} onClick={save}>{busy ? '...' : 'حفظ'}</button></>}
        >
          <div className="fgrid">
            <Field l="المنصة">
              <select className="in" value={edit.platform} disabled={!edit._new} onChange={(e) => setEdit({ ...edit, platform: e.target.value })}>
                {Object.entries(PLATFORMS).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.ar}</option>)}
              </select>
            </Field>
            <Field l="معرّف البكسل" hint={PLATFORMS[edit.platform].hint}><input className="in num" dir="ltr" placeholder={PLATFORMS[edit.platform].ph} value={edit.pixel_id} onChange={(e) => setEdit({ ...edit, pixel_id: e.target.value })} /></Field>
            <Field l="اسم داخلي (اختياري)"><input className="in" value={edit.label || ''} onChange={(e) => setEdit({ ...edit, label: e.target.value })} /></Field>
            <Field l="التفعيل"><div className="tgrow"><Tog on={edit.enabled !== false} set={(v) => setEdit({ ...edit, enabled: v })} /><span>البكسل يعمل في المتجر</span></div></Field>
          </div>
          <h3 style={{ marginTop: 8 }}>الأحداث المُرسلة</h3>
          <div className="fgrid">
            {EVENTS.map((e) => (
              <div className="tgrow" key={e.k} style={{ marginBottom: 10 }}>
                <Tog on={e.std ? edit.events[e.k] !== false : edit.events[e.k] === true} set={(v) => setEdit({ ...edit, events: { ...edit.events, [e.k]: v } })} />
                <span>{e.ar} <small className="mut num">{e.k}</small></span>
              </div>
            ))}
          </div>
          <small className="hint">حدث Purchase يُرسل بنفس معرّف الحدث (event_id) الذي يرسله السيرفر عبر Conversion API لمنع التكرار.</small>
        </Modal>
      )}
    </>
  );
}

/* ====================== Conversion API ====================== */
const CAPI = [
  { provider: 'facebook_capi', ar: 'Meta Conversion API', icon: '📘', help: 'Events Manager ← Settings ← Conversions API ← Generate access token', idLabel: 'Pixel ID', re: /^\d{8,20}$/ },
  { provider: 'tiktok_capi', ar: 'TikTok Events API', icon: '🎵', help: 'TikTok Events Manager ← Web Events ← Settings ← Generate Access Token', idLabel: 'Pixel Code', re: /^[A-Za-z0-9]{10,30}$/ },
];

function CapiCard({ spec, row, onSaved }) {
  const { uid, say } = useDash();
  const cfg0 = row?.config || {};
  const [enabled, setEnabled] = useState(!!row?.enabled);
  const [pixel, setPixel] = useState(cfg0.pixel_id || '');
  const [token, setToken] = useState('');
  const [test, setTest] = useState(cfg0.test_event_code || '');
  const [busy, setBusy] = useState(false);
  const hasToken = !!cfg0.access_token;

  const save = async () => {
    const pid = pixel.trim();
    if (enabled && !spec.re.test(pid)) { say(`${spec.idLabel} غير صحيح`); return; }
    if (enabled && !token.trim() && !hasToken) { say('أدخل Access Token'); return; }
    setBusy(true);
    const config = { ...cfg0, pixel_id: pid, test_event_code: test.trim() };
    if (token.trim()) config.access_token = token.trim();
    const { error } = await supabase.from('store_integrations').upsert({ store_id: uid, provider: spec.provider, enabled, config, updated_at: new Date().toISOString() }, { onConflict: 'store_id,provider' });
    setBusy(false);
    if (error) { say(`تعذر الحفظ: ${error.message}`); return; }
    setToken('');
    say('✅ تم الحفظ');
    onSaved();
  };

  return (
    <div className="card">
      <div className="appc">
        <div className="top2">
          <span className="ai">{spec.icon}</span>
          <div style={{ flex: 1 }}><b>{spec.ar}</b><p>{spec.help}</p></div>
          <Tog on={enabled} set={setEnabled} />
        </div>
        <div className="fgrid">
          <Field l={spec.idLabel}><input className="in num" dir="ltr" value={pixel} onChange={(e) => setPixel(e.target.value)} /></Field>
          <Field l="Access Token" hint={hasToken ? 'محفوظ ✓ اتركه فارغاً للإبقاء عليه' : 'يُحفظ بشكل آمن ولا يظهر للعملاء'}>
            <input className="in num" dir="ltr" type="password" autoComplete="off" placeholder={hasToken ? '••••••••••••' : ''} value={token} onChange={(e) => setToken(e.target.value)} />
          </Field>
          <Field l="Test Event Code (اختياري)" hint="لتجربة الأحداث في Events Manager قبل الإطلاق"><input className="in num" dir="ltr" value={test} onChange={(e) => setTest(e.target.value)} /></Field>
        </div>
        {cfg0.last_status && (
          <div className="pv">
            <span>آخر إرسال: <b>{cfg0.last_status}</b></span>
            {cfg0.last_at && <small className="mut">{fdate(cfg0.last_at)}</small>}
          </div>
        )}
        <div><button type="button" className="btn p" disabled={busy} onClick={save}>{busy ? '...' : 'حفظ'}</button></div>
      </div>
    </div>
  );
}

export function CapiScreen() {
  const { uid } = useDash();
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const load = async () => {
    const { data, error } = await supabase.from('store_integrations').select('*').eq('store_id', uid).in('provider', CAPI.map((c) => c.provider));
    if (error) { setErr(error.message); setRows([]); return; }
    setErr('');
    setRows(data || []);
  };
  useEffect(() => { if (uid) load(); }, [uid]);

  return (
    <>
      <PageHead title="Conversion API" sub="إرسال المبيعات من السيرفر" />
      <p className="mut dsc">يرسل أحداث الشراء مباشرة من خادم سبايك، فلا تضيع المبيعات بسبب حاجب الإعلانات أو إعدادات الخصوصية. يعمل مع البكسل بدون تكرار.</p>
      {err && <div className="card errbox">⚠️ {err}</div>}
      {rows === null ? <div className="c"><Spin /></div> : (
        <div style={{ display: 'grid', gap: 16 }}>
          {CAPI.map((c) => <CapiCard key={c.provider + (rows.find((r) => r.provider === c.provider)?.id || '')} spec={c} row={rows.find((r) => r.provider === c.provider)} onSaved={load} />)}
        </div>
      )}
    </>
  );
}

/* ====================== جوجل تاج ====================== */
export function GtmScreen() {
  return (
    <ConfigForm
      section="tracking" title="الربط مع جوجل تاج" desc="أضف حاوية Google Tag Manager ورموز التحقق من الملكية."
      fields={[
        { k: 'gtm_id', l: 'معرّف الحاوية GTM', type: 'ltr', upper: true, ph: 'GTM-XXXXXXX' },
        { k: 'google_site_verification', l: 'كود التحقق من Google Search Console', type: 'ltr', ph: 'محتوى وسم meta فقط' },
        { k: 'facebook_domain_verification', l: 'كود تحقق دومين فيسبوك', type: 'ltr', ph: 'محتوى وسم meta فقط' },
      ]}
      validate={(d) => (d.gtm_id && !GTM_RE.test(String(d.gtm_id).trim()) ? 'معرّف GTM غير صحيح. مثال: GTM-ABC1234' : '')}
    >
      {() => (
        <ol className="steps" style={{ marginTop: 16 }}>
          <li><span>أنشئ حاوية في tagmanager.google.com واختر نوع «Web».</span></li>
          <li><span>انسخ معرّف الحاوية (يبدأ بـ GTM-) والصقه هنا واحفظ.</span></li>
          <li><span>سيُحمَّل GTM في كل صفحات متجرك، ويصلك حدث <b className="num">purchase</b> في الـ dataLayer.</span></li>
        </ol>
      )}
    </ConfigForm>
  );
}

/* ====================== منشئ روابط الحملات UTM ====================== */
const PRESETS = [
  ['facebook', 'cpc', 'فيسبوك'], ['instagram', 'cpc', 'إنستجرام'], ['tiktok', 'cpc', 'تيك توك'], ['snapchat', 'cpc', 'سناب'],
  ['google', 'cpc', 'جوجل'], ['whatsapp', 'social', 'واتساب'], ['influencer', 'referral', 'مؤثر'], ['email', 'newsletter', 'بريد'],
];
const clean = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_\-؀-ۿ]/g, '').slice(0, 60);

export function UtmScreen() {
  const { storeUrl, say } = useDash();
  const prods = useProducts();
  const [target, setTarget] = useState('home');
  const [custom, setCustom] = useState('');
  const [f, setF] = useState({ source: 'facebook', medium: 'cpc', campaign: '', content: '', ref: '' });
  const [hist, setHist] = useState([]);

  useEffect(() => {
    try { setHist(JSON.parse(localStorage.getItem('spike_utm_hist') || '[]')); } catch { /* تجاهل */ }
  }, []);

  const base = target === 'home' ? storeUrl : target === 'custom' ? custom.trim() : `${storeUrl}/p/${target}`;
  const params = [['utm_source', clean(f.source)], ['utm_medium', clean(f.medium)], ['utm_campaign', clean(f.campaign)], ['utm_content', clean(f.content)], ['ref', clean(f.ref)]].filter(([, v]) => v);
  const link = base ? `${base}${params.length ? (base.includes('?') ? '&' : '?') : ''}${params.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}` : '';

  const keep = () => {
    if (!link) return;
    const next = [{ link, at: Date.now(), name: clean(f.campaign) || clean(f.source) }, ...hist.filter((h) => h.link !== link)].slice(0, 15);
    setHist(next);
    try { localStorage.setItem('spike_utm_hist', JSON.stringify(next)); } catch { /* تجاهل */ }
    say('تم حفظ الرابط في السجل على هذا المتصفح');
  };

  return (
    <>
      <PageHead title="منشئ روابط الحملات (UTM)" sub="✦ من سبايك" />
      <p className="mut dsc">اصنع رابطاً مخصصاً لكل إعلان، فتظهر لك في «تتبع نتائج الحملات» الطلبات والأرباح لكل حملة.</p>
      <div className="two">
        <div className="card">
          <div className="chips" style={{ marginBottom: 12 }}>
            {PRESETS.map(([s, m, ar]) => <button key={s} type="button" className={'chip' + (f.source === s ? ' act' : '')} onClick={() => setF({ ...f, source: s, medium: m })}>{ar}</button>)}
          </div>
          <div className="fgrid">
            <Field l="الوجهة" full>
              <select className="in" value={target} onChange={(e) => setTarget(e.target.value)}>
                <option value="home">الصفحة الرئيسية</option>
                {prods.rows.filter((p) => (p.status || 'active') === 'active').map((p) => <option key={p.id} value={String(p.id)}>منتج: {p.title}</option>)}
                <option value="custom">رابط آخر…</option>
              </select>
            </Field>
            {target === 'custom' && <Field l="الرابط" full><input className="in num" dir="ltr" placeholder="https://..." value={custom} onChange={(e) => setCustom(e.target.value)} /></Field>}
            <Field l="المصدر (utm_source)"><input className="in num" dir="ltr" value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} /></Field>
            <Field l="الوسيط (utm_medium)"><input className="in num" dir="ltr" value={f.medium} onChange={(e) => setF({ ...f, medium: e.target.value })} /></Field>
            <Field l="اسم الحملة (utm_campaign)"><input className="in num" dir="ltr" placeholder="ramadan-offer" value={f.campaign} onChange={(e) => setF({ ...f, campaign: e.target.value })} /></Field>
            <Field l="المحتوى/الإعلان (utm_content)"><input className="in num" dir="ltr" placeholder="video-1" value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} /></Field>
            <Field l="كود إحالة (ref) اختياري" hint="لو أنشأت رابط إحالة في «روابط الإحالة»" full><input className="in num" dir="ltr" value={f.ref} onChange={(e) => setF({ ...f, ref: e.target.value })} /></Field>
          </div>
        </div>
        <div className="card">
          <h3>🔗 رابطك</h3>
          {link ? <LinkBox url={link} /> : <span className="mut">اختر وجهة لإنشاء الرابط</span>}
          <div className="row" style={{ marginTop: 10, marginBottom: 0 }}>
            <button type="button" className="btn p" disabled={!link} onClick={keep}>حفظ في السجل</button>
          </div>
          {hist.length > 0 && (
            <>
              <h3 style={{ marginTop: 18 }}>آخر الروابط</h3>
              {hist.map((h) => (
                <div className="pls" key={h.link}>
                  <p><b>{h.name || 'رابط'}</b><small className="num" dir="ltr" style={{ textAlign: 'start', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.link}</small></p>
                  <CopyBtn text={h.link} />
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}
