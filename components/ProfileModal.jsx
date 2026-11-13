'use client';
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { api, uploadAsset } from './dash/hooks';

const CSS = `
.pfm-ov{position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;padding:16px}
.pfm{width:100%;max-width:460px;max-height:92vh;overflow:auto;border-radius:20px;background:#fff;color:#0f172a;box-shadow:0 24px 70px rgba(0,0,0,.35);font-family:inherit}
.pfm.dk{background:#0A2A3E;color:#e2e8f0}
.pfm-h{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid rgba(148,163,184,.25)}
.pfm-h b{font-size:16px}
.pfm-x{border:1px solid rgba(148,163,184,.4);background:transparent;color:inherit;border-radius:10px;padding:6px 12px;cursor:pointer;font:inherit;font-size:13px}
.pfm-b{padding:18px;display:grid;gap:14px}
.pfm-av{display:flex;align-items:center;gap:14px}
.pfm-pic{width:84px;height:84px;border-radius:50%;background:#014D6F;color:#fff;display:grid;place-items:center;font-size:32px;font-weight:800;overflow:hidden;flex:none}
.pfm-pic img{width:100%;height:100%;object-fit:cover}
.pfm-l{display:grid;gap:6px;font-size:12.5px;font-weight:700}
.pfm-in{width:100%;box-sizing:border-box;padding:11px 12px;border-radius:12px;border:1px solid rgba(148,163,184,.55);background:transparent;color:inherit;font:inherit;font-size:14px;outline:none}
.pfm-in:focus{border-color:#0E8FC0}
.pfm-in[disabled]{opacity:.6}
.pfm-btn{border:1px solid rgba(148,163,184,.55);background:transparent;color:inherit;border-radius:12px;padding:9px 14px;cursor:pointer;font:inherit;font-size:13px;font-weight:700}
.pfm-btn.p{background:#014D6F;border-color:#014D6F;color:#fff}
.pfm-btn[disabled]{opacity:.55;cursor:default}
.pfm-m{font-size:12.5px;line-height:1.7;padding:10px 12px;border-radius:12px}
.pfm-m.ok{background:rgba(22,163,74,.12);color:#16a34a}.pfm-m.err{background:rgba(239,68,68,.12);color:#ef4444}
.pfm-meta{font-size:11.5px;opacity:.7;line-height:1.8}
.pfm-f{padding:14px 18px;border-top:1px solid rgba(148,163,184,.25);display:flex;gap:10px;justify-content:flex-end}
`;

/* صفحة التاجر الشخصية (نافذة): الصورة والاسم والموبايل والإيميل، وكلها قابلة للتعديل.
   self: التاجر نفسه (الصورة تتحفظ عبر onPhotoSave عشان نسخة الإعدادات في اللوحة تفضل متزامنة، والإيميل برابط تأكيد)
   admin: الأدمن بيعدّل أي تاجر (uid) والإيميل بيتغيّر مباشرة */
export default function ProfileModal({ uid, mode = 'self', dark, onClose, onSaved, onPhotoSave, fallbackLogo }) {
  const [f, setF] = useState(null);
  const [orig, setOrig] = useState('');
  const [meta, setMeta] = useState({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    let off = false;
    (async () => {
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
    if (mode === 'admin') { payload.photo = f.photo; payload.email = f.email; }
    const r = await api('/api/dashboard/profile', payload);
    if (!r.ok) { setBusy(false); setMsg({ k: 'err', t: r.error || 'تعذر الحفظ' }); return; }
    let note = 'تم حفظ البيانات';
    if (mode === 'self') {
      if (onPhotoSave) await onPhotoSave(f.photo);
      const em = f.email.trim().toLowerCase();
      if (em && em !== orig.toLowerCase()) {
        const { error } = await supabase.auth.updateUser({ email: em });
        note = error ? `اتحفظت باقي البيانات، لكن تغيير الإيميل فشل: ${error.message}` : 'اتحفظت البيانات. بعتنا رابط تأكيد على الإيميل الجديد، وهيتغيّر بعد ما تضغط عليه.';
        if (error) { setBusy(false); setMsg({ k: 'err', t: note }); return; }
      }
    } else if (r.emailChanged) { setOrig(f.email.trim().toLowerCase()); note = 'تم حفظ البيانات وتغيير الإيميل'; }
    setBusy(false);
    setMsg({ k: 'ok', t: note });
    if (onSaved) onSaved({ owner_name: f.name, phone: f.phone, photo: f.photo });
  };

  const initial = (f?.name || meta.store || 'S').trim().charAt(0).toUpperCase();
  const pic = f?.photo || fallbackLogo || '';
  return (
    <div className="pfm-ov" onClick={onClose}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className={'pfm' + (dark ? ' dk' : '')} dir="rtl" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="الصفحة الشخصية">
        <div className="pfm-h"><b>{mode === 'admin' ? 'بيانات التاجر' : 'صفحتي الشخصية'}</b><button type="button" className="pfm-x" onClick={onClose}>إغلاق</button></div>
        {!f ? <div className="pfm-b">جاري التحميل...</div> : (
          <div className="pfm-b">
            <div className="pfm-av">
              <div className="pfm-pic">{pic ? <img src={pic} alt="" /> : initial}</div>
              <div style={{ display: 'grid', gap: 8 }}>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={upload} />
                <button type="button" className="pfm-btn" disabled={busy} onClick={() => fileRef.current?.click()}>{f.photo ? 'تغيير الصورة' : 'رفع صورة'}</button>
                {f.photo && <button type="button" className="pfm-btn" disabled={busy} onClick={() => setF({ ...f, photo: '' })}>حذف الصورة</button>}
              </div>
            </div>
            <label className="pfm-l">الاسم<input className="pfm-in" value={f.name} maxLength={80} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
            <label className="pfm-l">رقم الموبايل<input className="pfm-in" dir="ltr" inputMode="tel" value={f.phone} placeholder="01xxxxxxxxx" onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
            <label className="pfm-l">الإيميل<input className="pfm-in" dir="ltr" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
            {mode === 'self' && <div className="pfm-meta">تغيير الإيميل بيحتاج تأكيد: هنبعت رابط على الإيميل الجديد، وبيفضل القديم شغّال لحد ما تأكد.</div>}
            <div className="pfm-meta">
              المتجر: <b>{meta.store || '—'}</b> {meta.slug ? `(${meta.slug})` : ''} · الباقة: {meta.plan || '—'}
              {meta.since ? <><br />تاريخ الانضمام: {new Date(meta.since).toLocaleDateString('ar-EG')}</> : null}
              {mode === 'admin' && meta.last ? <><br />آخر دخول: {new Date(meta.last).toLocaleString('ar-EG')}</> : null}
            </div>
            {msg && <div className={'pfm-m ' + msg.k} role="alert">{msg.t}</div>}
          </div>
        )}
        <div className="pfm-f">
          <button type="button" className="pfm-btn" onClick={onClose}>إلغاء</button>
          <button type="button" className="pfm-btn p" disabled={busy || !f} onClick={save}>{busy ? 'جاري الحفظ...' : 'حفظ'}</button>
        </div>
      </div>
    </div>
  );
}
