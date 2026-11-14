'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { api, uploadAsset } from './dash/hooks';
import { spikeLogout } from './SpikeSessionBar';

const CSS = `
.pfp{min-height:100vh;background:#ECF3FD;color:#0f172a;font-family:inherit}
.pfp.dk{background:#061C2A;color:#e2e8f0}
.pfp-top{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 18px;background:#fff;border-bottom:1px solid rgba(148,163,184,.3)}
.pfp.dk .pfp-top{background:#0A2A3E}
.pfp-top b{font-size:16px}
.pfp-wrap{max-width:880px;margin:0 auto;padding:22px 16px 60px;display:grid;gap:16px}
.pfp-hero{display:flex;align-items:center;gap:18px;flex-wrap:wrap;padding:22px;border-radius:22px;background:linear-gradient(135deg,#014D6F,#0E8FC0);color:#fff}
.pfp-pic{width:112px;height:112px;border-radius:50%;background:rgba(255,255,255,.18);border:3px solid rgba(255,255,255,.7);display:grid;place-items:center;font-size:44px;font-weight:800;overflow:hidden;flex:none}
.pfp-pic img{width:100%;height:100%;object-fit:cover}
.pfp-hero h1{margin:0;font-size:22px}
.pfp-hero small{opacity:.85;display:block;margin-top:4px}
.pfp-card{background:#fff;border-radius:20px;padding:20px;display:grid;gap:14px;box-shadow:0 6px 24px rgba(15,23,42,.06)}
.pfp.dk .pfp-card{background:#0A2A3E}
.pfp-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:640px){.pfp-grid{grid-template-columns:1fr}}
.pfp-l{display:grid;gap:6px;font-size:12.5px;font-weight:700}
.pfp-in{width:100%;box-sizing:border-box;padding:12px;border-radius:12px;border:1px solid rgba(148,163,184,.55);background:transparent;color:inherit;font:inherit;font-size:14px;outline:none}
.pfp-in:focus{border-color:#0E8FC0}
.pfp-btn{border:1px solid rgba(148,163,184,.55);background:transparent;color:inherit;border-radius:12px;padding:10px 16px;cursor:pointer;font:inherit;font-size:13px;font-weight:700}
.pfp-hero .pfp-btn{background:rgba(255,255,255,.16);border-color:rgba(255,255,255,.55);color:#fff}
.pfp-btn.p{background:#014D6F;border-color:#014D6F;color:#fff}
.pfp-btn[disabled]{opacity:.55;cursor:default}
.pfp-m{font-size:13px;line-height:1.7;padding:11px 13px;border-radius:12px}
.pfp-m.ok{background:rgba(22,163,74,.12);color:#16a34a}.pfp-m.err{background:rgba(239,68,68,.12);color:#ef4444}
.pfp-meta{font-size:12px;opacity:.75;line-height:1.9}
.pfp-bar{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}
`;

/* صفحة التاجر الشخصية (صفحة كاملة): الصورة والاسم والموبايل والإيميل، وكلها قابلة للتعديل.
   self: التاجر نفسه (الإيميل بيتغيّر برابط تأكيد)
   admin: الأدمن بيعدّل أي تاجر (uid) والإيميل بيتغيّر مباشرة */
export default function ProfilePage({ uid, mode = 'self' }) {
  const router = useRouter();
  const back = () => router.push(mode === 'admin' ? '/admin' : '/dashboard');
  const [dark, setDark] = useState(false);
  useEffect(() => { try { setDark(localStorage.getItem('spike_dash_dark') === '1'); } catch { /* تجاهل */ } }, []);
  const [f, setF] = useState(null);
  const [orig, setOrig] = useState('');
  const [meta, setMeta] = useState({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    let off = false;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess?.session) { router.replace('/register'); return; }
      const r = await api('/api/dashboard/profile', { action: 'get', uid });
      if (off) return;
      if (!r.ok) { setMsg({ k: 'err', t: r.error || 'تعذر تحميل البيانات' }); setF({ name: '', phone: '', email: '', photo: '' }); return; }
      setF({ name: r.profile.owner_name, phone: r.profile.phone, email: r.email, photo: r.photo });
      setOrig(r.email);
      setMeta({ store: r.profile.store_name, slug: r.profile.store_slug, plan: r.profile.plan_type, since: r.profile.created_at, last: r.last_sign_in_at });
    })();
    return () => { off = true; };
  }, [uid]);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\//.test(file.type)) { setMsg({ k: 'err', t: 'اختار ملف صورة' }); return; }
    setBusy(true);
    try {
      const { data } = await supabase.auth.getUser();
      const up = await uploadAsset(data?.user?.id || uid, file, 'profile');
      setF((p) => ({ ...p, photo: up.url }));
      setMsg(null);
    } catch (ex) { setMsg({ k: 'err', t: ex.message || 'تعذر رفع الصورة' }); }
    setBusy(false);
  };

  const save = async () => {
    setMsg(null);
    setBusy(true);
    const payload = { action: 'save', uid, owner_name: f.name, phone: f.phone };
    payload.photo = f.photo;
    if (mode === 'admin') payload.email = f.email;
    const r = await api('/api/dashboard/profile', payload);
    if (!r.ok) { setBusy(false); setMsg({ k: 'err', t: r.error || 'تعذر الحفظ' }); return; }
    let note = 'تم حفظ البيانات';
    if (mode === 'self') {
      const em = f.email.trim().toLowerCase();
      if (em && em !== orig.toLowerCase()) {
        const { error } = await supabase.auth.updateUser({ email: em });
        note = error ? `اتحفظت باقي البيانات، لكن تغيير الإيميل فشل: ${error.message}` : 'اتحفظت البيانات. بعتنا رابط تأكيد على الإيميل الجديد، وهيتغيّر بعد ما تضغط عليه.';
        if (error) { setBusy(false); setMsg({ k: 'err', t: note }); return; }
      }
    } else if (r.emailChanged) { setOrig(f.email.trim().toLowerCase()); note = 'تم حفظ البيانات وتغيير الإيميل'; }
    setBusy(false);
    setMsg({ k: 'ok', t: note });
  };

  const initial = (f?.name || meta.store || 'S').trim().charAt(0).toUpperCase();
  const pic = f?.photo || '';
  return (
    <div className={'pfp' + (dark ? ' dk' : '')} dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pfp-top">
        <button type="button" className="pfp-btn" onClick={back}>{mode === 'admin' ? '← رجوع للأدمن' : '← رجوع للوحة التحكم'}</button>
        <b>{mode === 'admin' ? 'بيانات التاجر' : 'صفحتي الشخصية'}</b>
        {mode === 'self' ? <button type="button" className="pfp-btn" onClick={() => spikeLogout(router)}>خروج</button> : <span />}
      </div>
      {!f ? <div className="pfp-wrap">جاري التحميل...</div> : (
        <div className="pfp-wrap">
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={upload} />
          <div className="pfp-hero">
            <div className="pfp-pic">{pic ? <img src={pic} alt="" /> : initial}</div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <h1>{f.name || meta.store || 'التاجر'}</h1>
              <small>{meta.store || '—'} {meta.slug ? `· ${meta.slug}` : ''}</small>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <button type="button" className="pfp-btn" disabled={busy} onClick={() => fileRef.current?.click()}>{f.photo ? 'تغيير الصورة' : 'رفع صورة'}</button>
                {f.photo && <button type="button" className="pfp-btn" disabled={busy} onClick={() => setF({ ...f, photo: '' })}>حذف الصورة</button>}
              </div>
            </div>
          </div>
          <div className="pfp-card">
            <div className="pfp-grid">
              <label className="pfp-l">الاسم<input className="pfp-in" value={f.name} maxLength={80} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
              <label className="pfp-l">رقم الموبايل<input className="pfp-in" dir="ltr" inputMode="tel" value={f.phone} placeholder="01xxxxxxxxx" onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
            </div>
            <label className="pfp-l">الإيميل<input className="pfp-in" dir="ltr" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
            {mode === 'self' && <div className="pfp-meta">تغيير الإيميل بيحتاج تأكيد: هنبعت رابط على الإيميل الجديد، وبيفضل القديم شغّال لحد ما تأكد.</div>}
            <div className="pfp-meta">
              الباقة: {meta.plan || '—'}
              {meta.since ? <> · تاريخ الانضمام: {new Date(meta.since).toLocaleDateString('ar-EG')}</> : null}
              {mode === 'admin' && meta.last ? <> · آخر دخول: {new Date(meta.last).toLocaleString('ar-EG')}</> : null}
            </div>
            {msg && <div className={'pfp-m ' + msg.k} role="alert">{msg.t}</div>}
            <div className="pfp-bar">
              <button type="button" className="pfp-btn" onClick={back}>إلغاء</button>
              <button type="button" className="pfp-btn p" disabled={busy} onClick={save}>{busy ? 'جاري الحفظ...' : 'حفظ'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
