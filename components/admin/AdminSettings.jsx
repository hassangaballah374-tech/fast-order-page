'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { TERMS_DEFAULT, PRIVACY_DEFAULT, LEGAL_UPDATED } from '../../lib/legalText';

/* إعدادات المنصة: بيانات التواصل + نصوص الصفحات العامة + السوشيال. كله في platform_kv. */
const KEYS = ['contact_email', 'contact_whatsapp', 'contact_phone', 'contact_address', 'contact_text', 'about_text', 'terms_text', 'privacy_text', 'platform_social'];
const SOC = [['facebook', 'فيسبوك'], ['instagram', 'إنستجرام'], ['tiktok', 'تيك توك'], ['youtube', 'يوتيوب'], ['x', 'X / تويتر']];
const digits = (v) => String(v || '').replace(/[^\d+]/g, '').slice(0, 20);
const url = (v) => { const s = String(v || '').trim().slice(0, 200); return !s ? '' : /^https?:\/\//i.test(s) ? s : 'https://' + s; };

export default function AdminSettings({ isDark }) {
  const [v, setV] = useState(null);
  const [soc, setSoc] = useState({});
  const [msg, setMsg] = useState({});
  const set = (k, x) => setV((p) => ({ ...p, [k]: x }));

  useEffect(() => {
    supabase.from('platform_kv').select('key,value').in('key', KEYS).then(({ data }) => {
      const o = {}; (data || []).forEach((r) => { o[r.key] = r.value || ''; });
      try { setSoc(JSON.parse(o.platform_social || '{}') || {}); } catch { setSoc({}); }
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
