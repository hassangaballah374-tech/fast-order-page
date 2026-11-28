'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useBrand } from '../BrandContext';
import { DEFAULT_BRAND, mergeBrand } from '../../lib/brand';
import { TERMS_DEFAULT, PRIVACY_DEFAULT, LEGAL_UPDATED } from '../../lib/legalText';

/* إعدادات المنصة: بيانات التواصل + نصوص الصفحات العامة + السوشيال. كله في platform_kv. */
const KEYS = ['platform_brand', 'contact_email', 'contact_whatsapp', 'contact_phone', 'contact_address', 'contact_text', 'about_text', 'terms_text', 'privacy_text', 'platform_social'];
const SOC = [['facebook', 'فيسبوك'], ['instagram', 'إنستجرام'], ['tiktok', 'تيك توك'], ['youtube', 'يوتيوب'], ['x', 'X / تويتر']];
const digits = (v) => String(v || '').replace(/[^\d+]/g, '').slice(0, 20);
const url = (v) => { const s = String(v || '').trim().slice(0, 200); return !s ? '' : /^https?:\/\//i.test(s) ? s : 'https://' + s; };

function LogoField({ label, hint, value, onChange, dark }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const pick = async (e) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) return setErr('الصورة لازم تكون PNG أو JPG أو WEBP (الـ SVG بيترفض من تخزين المنصة، استخدم رابط)');
    if (f.size > 2 * 1024 * 1024) return setErr('الحجم الأقصى 2 ميجا');
    setBusy(true); setErr('');
    const ext = (f.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'png';
    /* بنرفع على store-assets في مجلد الأدمن (السياسة الموجودة بالفعل بتسمح بكده) */
    const { data: ud } = await supabase.auth.getUser();
    const uid = ud?.user?.id;
    if (!uid) { setBusy(false); return setErr('سجّل دخول تاني وجرّب'); }
    const path = `${uid}/platform/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('store-assets').upload(path, f, { contentType: f.type, cacheControl: '31536000', upsert: false });
    if (error) setErr('تعذّر الرفع: ' + error.message + ' — الصق رابط الصورة بدل الرفع.');
    else onChange(supabase.storage.from('store-assets').getPublicUrl(path).data.publicUrl);
    setBusy(false);
  };
  return (
    <div className="text-xs font-bold">
      <div>{label}</div>
      <div className="text-[11px] opacity-60 font-normal mb-1">{hint}</div>
      <div className="flex items-center gap-3">
        <div className={'w-24 h-16 rounded-lg border flex items-center justify-center overflow-hidden shrink-0 ' + (dark ? 'bg-[#04141F] border-slate-700' : 'bg-white border-slate-300')}>
          {value ? <img src={value} alt="" className="max-w-full max-h-full object-contain" /> : <span className="opacity-40 font-normal">الافتراضي</span>}
        </div>
        <div className="flex-1 min-w-0">
          <input dir="ltr" className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-xs outline-none w-full font-normal" value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://... (أو ارفع صورة)" />
          <div className="flex items-center gap-2 mt-1.5">
            <label className="px-3 py-1.5 border border-[#014D6F] text-[#014D6F] rounded-lg cursor-pointer">{busy ? 'جاري الرفع…' : 'رفع صورة'}<input type="file" accept="image/*" hidden onChange={pick} /></label>
            {value ? <button type="button" onClick={() => onChange('')} className="text-red-600 cursor-pointer">استخدام الافتراضي</button> : null}
          </div>
          {err ? <div className="text-red-600 font-normal mt-1">{err}</div> : null}
        </div>
      </div>
    </div>
  );
}

export default function AdminSettings({ isDark }) {
  const { brand, setBrand } = useBrand();
  const [bf, setBf] = useState(brand);
  const [v, setV] = useState(null);
  const [soc, setSoc] = useState({});
  const [msg, setMsg] = useState({});
  const set = (k, x) => setV((p) => ({ ...p, [k]: x }));

  useEffect(() => {
    supabase.from('platform_kv').select('key,value').in('key', KEYS).then(({ data }) => {
      const o = {}; (data || []).forEach((r) => { o[r.key] = r.value || ''; });
      try { setSoc(JSON.parse(o.platform_social || '{}') || {}); } catch { setSoc({}); }
      try { setBf(mergeBrand(JSON.parse(o.platform_brand || '{}'))); } catch { setBf(DEFAULT_BRAND); }
      setV({ ...o, terms_text: o.terms_text || TERMS_DEFAULT, privacy_text: o.privacy_text || PRIVACY_DEFAULT });
    });
  }, []);

  const flash = (g, m) => { setMsg((p) => ({ ...p, [g]: m })); setTimeout(() => setMsg((p) => ({ ...p, [g]: '' })), 4000); };
  const put = async (g, rows) => {
    const now = new Date().toISOString();
    const { error } = await supabase.from('platform_kv').upsert(rows.map(([key, value]) => ({ key, value, updated_at: now })), { onConflict: 'key' });
    flash(g, error ? 'خطأ: ' + error.message : 'تم الحفظ ✓ وظهر في المنصة');
  };

  const saveContact = () => {
    const e = String(v.contact_email || '').trim();
    if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return flash('c', 'البريد غير صحيح');
    return put('c', [['contact_email', e], ['contact_whatsapp', digits(v.contact_whatsapp)], ['contact_phone', digits(v.contact_phone)], ['contact_address', String(v.contact_address || '').trim().slice(0, 200)], ['contact_text', String(v.contact_text || '').trim().slice(0, 600)]]);
  };
  const saveBrand = async () => {
    const nb = mergeBrand({ ...bf, v: String(Date.now()) });
    const { v: _v, ...store } = nb;
    const now = new Date().toISOString();
    const { error } = await supabase.from('platform_kv').upsert({ key: 'platform_brand', value: JSON.stringify(store), updated_at: now }, { onConflict: 'key' });
    if (error) return flash('b', 'خطأ: ' + error.message);
    setBrand(nb); setBf(nb);
    flash('b', 'تم الحفظ ✓ الاسم والشعار اتغيّروا في المنصة كلها');
  };
  const saveSoc = () => { const c = {}; SOC.forEach(([k]) => { const u = url(soc[k]); if (u) c[k] = u; }); setSoc(c); return put('s', [['platform_social', JSON.stringify(c)]]); };
  const resetText = async (k, def) => { set(k, def); await put(k, [[k, '']]); flash(k, 'رجع النص الافتراضي ✓'); };

  const card = `p-5 rounded-2xl border mb-4 ${isDark ? 'bg-[#0A2A3E] border-slate-800' : 'bg-white border-slate-200'}`;
  const inp = 'p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-sm outline-none focus:border-[#014D6F] block w-full mt-1 font-normal';
  const btn = 'px-5 py-2 bg-[#014D6F] text-white rounded-lg text-xs font-bold cursor-pointer';
  const Msg = ({ g }) => (msg[g] ? <span className="text-xs font-bold text-[#014D6F]">{msg[g]}</span> : null);

  if (!v) return <div className="text-sm opacity-60">جاري التحميل…</div>;
  const Text = ({ k, title, def, hint }) => (
    <div className={card}>
      <h3 className="font-black text-sm mb-1">{title}</h3>
      <p className="text-xs opacity-70 mb-2">{hint}</p>
      <textarea rows={12} className={inp + ' leading-6'} value={v[k] || ''} onChange={(e) => set(k, e.target.value)} placeholder={def ? '' : 'اتركه فاضي لاستخدام النص الافتراضي للمنصة'} />
      <div className="flex flex-wrap items-center gap-3 mt-3">
        <button onClick={() => put(k, [[k, String(v[k] || '').trim()]])} className={btn}>حفظ</button>
        <button onClick={() => (def ? resetText(k, def) : (set(k, ''), put(k, [[k, '']])))} className="px-4 py-2 border border-slate-400 rounded-lg text-xs font-bold cursor-pointer">رجّع النص الافتراضي</button>
        <Msg g={k} />
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl">
      <div className={card}>
        <h3 className="font-black text-sm mb-1">هوية المنصة (الاسم والشعار)</h3>
        <p className="text-xs opacity-70 mb-3">بعد الحفظ بيتغيّروا في: الصفحة الرئيسية، التسجيل، لوحة التاجر، لوحة الأدمن، فوتر المتاجر، عنوان التبويب، أيقونة المتصفح والتطبيق، وصفحات الشروط والخصوصية. أي صفحة مفتوحة عند حد تاني بتتحدّث لما يعمل ريفريش.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
          <label>اسم المنصة (عربي)<input className={inp} value={bf.name} onChange={(e) => setBf({ ...bf, name: e.target.value })} placeholder="سبايك" maxLength={40} /></label>
          <label>اسم المنصة (إنجليزي)<input dir="ltr" className={inp} value={bf.name_en} onChange={(e) => setBf({ ...bf, name_en: e.target.value })} placeholder="SPIKE" maxLength={40} /></label>
          <label className="sm:col-span-2">الشعار النصي (Tagline)<input className={inp} value={bf.tagline} onChange={(e) => setBf({ ...bf, tagline: e.target.value })} maxLength={120} /></label>
          <label className="sm:col-span-2">وصف المنصة (لمحركات البحث)<input className={inp} value={bf.description} onChange={(e) => setBf({ ...bf, description: e.target.value })} maxLength={200} /></label>
          <LogoField label="الشعار — الوضع النهاري" hint="يفضّل PNG شفاف أو SVG" value={bf.logo_light} onChange={(x) => setBf({ ...bf, logo_light: x })} dark={false} />
          <LogoField label="الشعار — الوضع الليلي" hint="لو سبته فاضي هيستخدم شعار النهار" value={bf.logo_night} onChange={(x) => setBf({ ...bf, logo_night: x })} dark />
          <LogoField label="أيقونة المتصفح والتطبيق" hint="مربعة 512×512 PNG" value={bf.icon} onChange={(x) => setBf({ ...bf, icon: x })} dark={false} />
        </div>
        <div className="flex items-center gap-3 mt-3"><button onClick={saveBrand} className={btn}>حفظ الهوية</button><Msg g="b" /></div>
      </div>

      <div className={card}>
        <h3 className="font-black text-sm mb-1">بيانات التواصل بالمنصة</h3>
        <p className="text-xs opacity-70 mb-3">بتظهر في صفحة «تواصل معنا»، وبتتعبّى تلقائي في الشروط والخصوصية مكان [بريد الدعم] و[رقم الواتساب].</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
          <label>بريد الدعم<input dir="ltr" className={inp} value={v.contact_email || ''} onChange={(e) => set('contact_email', e.target.value)} placeholder="support@example.com" /></label>
          <label>رقم الواتساب<input dir="ltr" className={inp} value={v.contact_whatsapp || ''} onChange={(e) => set('contact_whatsapp', e.target.value)} placeholder="01XXXXXXXXX" /></label>
          <label>رقم الهاتف<input dir="ltr" className={inp} value={v.contact_phone || ''} onChange={(e) => set('contact_phone', e.target.value)} placeholder="01XXXXXXXXX" /></label>
          <label>العنوان<input className={inp} value={v.contact_address || ''} onChange={(e) => set('contact_address', e.target.value)} placeholder="القاهرة، مصر" /></label>
          <label className="sm:col-span-2">نص «تواصل معنا»<textarea rows={3} className={inp} value={v.contact_text || ''} onChange={(e) => set('contact_text', e.target.value)} placeholder="لو فاضي بيظهر النص الافتراضي" /></label>
        </div>
        <div className="flex items-center gap-3 mt-3"><button onClick={saveContact} className={btn}>حفظ بيانات التواصل</button><Msg g="c" /></div>
      </div>

      <div className={card}>
        <h3 className="font-black text-sm mb-1">حسابات المنصة على السوشيال</h3>
        <p className="text-xs opacity-70 mb-3">بتظهر كأزرار في صفحة «تواصل معنا». سيب الخانة فاضية لو مفيش حساب.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
          {SOC.map(([k, l]) => <label key={k}>{l}<input dir="ltr" className={inp} value={soc[k] || ''} onChange={(e) => setSoc((p) => ({ ...p, [k]: e.target.value }))} placeholder="https://..." /></label>)}
        </div>
        <div className="flex items-center gap-3 mt-3"><button onClick={saveSoc} className={btn}>حفظ الروابط</button><Msg g="s" /></div>
      </div>

      <Text k="about_text" title="صفحة «من نحن»" def="" hint="النص اللي بيظهر في /about. لو فاضي بيظهر النص الافتراضي." />
      <Text k="terms_text" title="شروط الاستخدام" def={TERMS_DEFAULT} hint={`كل فقرة تبدأ بسطر العنوان (مثل «1) الخدمة») ثم النص، وسطور «- » بتبقى نقاط. تقدر تكتب [بريد الدعم] و[رقم الواتساب] و[تاريخ آخر تحديث] (${LEGAL_UPDATED}) وهتتعبّى تلقائي.`} />
      <Text k="privacy_text" title="سياسة الخصوصية" def={PRIVACY_DEFAULT} hint="نفس طريقة الكتابة: عنوان في أول سطر ثم النص، والنقاط بـ «- »." />
    </div>
  );
}
