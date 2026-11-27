'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

/* بروفايل الأدمن: بيانات الحساب (من تسجيل الدخول) + بيانات تواصل بتتحفظ في platform_kv + تغيير الباسورد */
const fd = (d) => { try { return d ? new Date(d).toLocaleString('ar-EG') : '—'; } catch { return '—'; } };
const digits = (v) => String(v || '').replace(/[^\d+]/g, '').slice(0, 20);

export default function AdminProfile({ isDark, role = '' }) {
  const [u, setU] = useState(null);
  const [f, setF] = useState({ name: '', title: '', phone: '', whatsapp: '', email: '', note: '' });
  const [pub, setPub] = useState(false);
  const [msg, setMsg] = useState('');
  const [pw, setPw] = useState({ a: '', b: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [loaded, setLoaded] = useState(false);
  const key = u ? `admin_profile:${u.id}` : '';

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setU(data?.user || null)); }, []);
  useEffect(() => {
    if (!u) return;
    supabase.from('platform_kv').select('value').eq('key', `admin_profile:${u.id}`).maybeSingle().then(({ data }) => {
      try { const j = JSON.parse(data?.value || '{}'); setF((p) => ({ ...p, ...j, email: j.email || u.email || '' })); } catch { setF((p) => ({ ...p, email: u.email || '' })); }
      setLoaded(true);
    });
  }, [u]);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const flash = (m, set_ = setMsg) => { set_(m); setTimeout(() => set_(''), 4000); };

  const save = async () => {
    if (!u) return;
    const clean = { name: f.name.trim().slice(0, 60), title: f.title.trim().slice(0, 60), phone: digits(f.phone), whatsapp: digits(f.whatsapp), email: f.email.trim().slice(0, 120), note: f.note.trim().slice(0, 300) };
    if (clean.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) return flash('البريد غير صحيح');
    const now = new Date().toISOString();
    let { error } = await supabase.from('platform_kv').upsert({ key, value: JSON.stringify(clean), updated_at: now }, { onConflict: 'key' });
    if (!error && pub) {
      const rows = [];
      if (clean.email) rows.push({ key: 'contact_email', value: clean.email, updated_at: now });
      if (clean.whatsapp) rows.push({ key: 'contact_whatsapp', value: clean.whatsapp, updated_at: now });
      if (rows.length) ({ error } = await supabase.from('platform_kv').upsert(rows, { onConflict: 'key' }));
    }
    if (!error) setF(clean);
    flash(error ? 'خطأ: ' + error.message : pub ? 'تم الحفظ ✓ وتحدّثت بيانات التواصل في صفحات المنصة' : 'تم الحفظ ✓');
  };

  const changePw = async () => {
    if (pw.a.length < 8) return flash('الباسورد لازم 8 حروف على الأقل', setPwMsg);
    if (pw.a !== pw.b) return flash('الباسوردين مش متطابقين', setPwMsg);
    const { error } = await supabase.auth.updateUser({ password: pw.a });
    if (!error) setPw({ a: '', b: '' });
    flash(error ? 'خطأ: ' + error.message : 'تم تغيير الباسورد ✓', setPwMsg);
  };

  const card = `p-5 rounded-2xl border mb-4 ${isDark ? 'bg-[#0A2A3E] border-slate-800' : 'bg-white border-slate-200'}`;
  const inp = 'p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-sm outline-none focus:border-[#014D6F] block w-full mt-1 font-normal';
  const initial = (f.name || u?.email || 'A').trim().charAt(0).toUpperCase();
  const waNum = digits(f.whatsapp);

  return (
    <div className="max-w-3xl">
      <div className={card + ' flex items-center gap-4'}>
        <div className="w-16 h-16 rounded-full bg-[#014D6F] text-white flex items-center justify-center text-2xl font-black shrink-0">{initial}</div>
        <div className="min-w-0">
          <div className="font-black text-lg truncate">{f.name || 'اسمك هنا'}</div>
          <div className="text-xs opacity-70 truncate" dir="ltr">{u?.email || '…'}</div>
          <div className="mt-1 inline-block text-[11px] font-black px-2 py-0.5 rounded-full bg-[#014D6F]/10 text-[#014D6F]">{role || 'أدمن'}{f.title ? ` · ${f.title}` : ''}</div>
        </div>
      </div>

      <div className={card}>
        <h3 className="font-black text-sm mb-3">بيانات الحساب (من تسجيل الدخول)</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
          <div><dt className="opacity-60">البريد المسجّل</dt><dd className="font-bold" dir="ltr">{u?.email || '—'}</dd></div>
          <div><dt className="opacity-60">تأكيد البريد</dt><dd className="font-bold">{u?.email_confirmed_at ? 'مؤكد ✓' : 'غير مؤكد'}</dd></div>
          <div><dt className="opacity-60">تاريخ إنشاء الحساب</dt><dd className="font-bold">{fd(u?.created_at)}</dd></div>
          <div><dt className="opacity-60">آخر تسجيل دخول</dt><dd className="font-bold">{fd(u?.last_sign_in_at)}</dd></div>
          <div className="sm:col-span-2"><dt className="opacity-60">معرّف الحساب</dt><dd className="font-mono text-[11px] break-all" dir="ltr">{u?.id || '—'}</dd></div>
        </dl>
      </div>

      <div className={card}>
        <h3 className="font-black text-sm mb-3">بياناتك الشخصية وبيانات التواصل</h3>
        {!loaded ? <div className="text-xs opacity-60">جاري التحميل…</div> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
            <label>الاسم<input className={inp} value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="الاسم الكامل" /></label>
            <label>المسمّى الوظيفي<input className={inp} value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="مثال: مدير المنصة" /></label>
            <label>بريد التواصل<input dir="ltr" className={inp} value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="name@example.com" /></label>
            <label>رقم الهاتف<input dir="ltr" className={inp} value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="01XXXXXXXXX" /></label>
            <label className="sm:col-span-2">رقم الواتساب
              <div className="flex gap-2 items-center">
                <input dir="ltr" className={inp} value={f.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="01XXXXXXXXX" />
                {waNum.length >= 10 ? <a href={`https://wa.me/${waNum.startsWith('0') ? '2' + waNum : waNum}`} target="_blank" rel="noopener noreferrer" className="mt-1 px-3 py-2.5 rounded-lg bg-[#25D366] text-white text-xs font-black whitespace-nowrap">تجربة</a> : null}
              </div>
            </label>
            <label className="sm:col-span-2">ملاحظات<textarea rows={2} className={inp} value={f.note} onChange={(e) => set('note', e.target.value)} placeholder="أي ملاحظة خاصة بك" /></label>
            <label className="sm:col-span-2 flex items-center gap-2 font-normal cursor-pointer">
              <input type="checkbox" checked={pub} onChange={(e) => setPub(e.target.checked)} />
              استخدم البريد والواتساب كبيانات تواصل المنصة (تظهر في صفحات «تواصل معنا» والشروط والخصوصية)
            </label>
          </div>
        )}
        <div className="flex items-center gap-3 mt-4">
          <button onClick={save} disabled={!loaded} className="px-5 py-2 bg-[#014D6F] text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50">حفظ</button>
          {msg ? <span className="text-xs font-bold text-[#014D6F]">{msg}</span> : null}
        </div>
      </div>

      <div className={card}>
        <h3 className="font-black text-sm mb-3">تغيير الباسورد</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
          <label>باسورد جديد<input type="password" autoComplete="new-password" dir="ltr" className={inp} value={pw.a} onChange={(e) => setPw({ ...pw, a: e.target.value })} /></label>
          <label>تأكيد الباسورد<input type="password" autoComplete="new-password" dir="ltr" className={inp} value={pw.b} onChange={(e) => setPw({ ...pw, b: e.target.value })} /></label>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <button onClick={changePw} className="px-5 py-2 border border-[#014D6F] text-[#014D6F] rounded-lg text-xs font-bold cursor-pointer">تغيير الباسورد</button>
          {pwMsg ? <span className="text-xs font-bold text-[#014D6F]">{pwMsg}</span> : null}
        </div>
      </div>
    </div>
  );
}
