'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

/* صفحة تعيين كلمة مرور جديدة: يوصلها المستخدم من رابط الإيميل */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((ev, session) => {
      if (ev === 'PASSWORD_RECOVERY' || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data?.session) setReady(true); });
    return () => sub?.subscription?.unsubscribe();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    if (p1.length < 6) { setMsg('كلمة المرور يجب ألا تقل عن 6 أحرف'); return; }
    if (p1 !== p2) { setMsg('كلمتا المرور غير متطابقتين'); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: p1 });
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    setDone(true);
    await supabase.auth.signOut();
    setTimeout(() => router.replace('/register'), 2500);
  };

  const inp = 'w-full p-3 rounded-xl border border-slate-300 bg-slate-50 outline-none text-sm focus:border-[#00B050] focus:bg-white';
  return (
    <div dir="rtl" className="min-h-screen bg-[#F4F6F9] flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <h1 className="text-xl font-black mb-1 text-slate-900">تعيين كلمة مرور جديدة</h1>
        {done ? (
          <p className="text-sm text-emerald-600 font-bold mt-4">✅ تم تغيير كلمة المرور. جاري تحويلك لتسجيل الدخول...</p>
        ) : !ready ? (
          <div className="text-sm text-slate-500 mt-4 space-y-3">
            <p>جاري التحقق من الرابط... لو الصفحة فضلت كده، يبقى الرابط منتهي أو غير صالح.</p>
            <Link href="/register" className="text-[#00B050] font-black underline">طلب رابط جديد</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 mt-4 text-xs font-bold">
            <div className="space-y-1.5">
              <label className="text-slate-700">كلمة المرور الجديدة</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} autoComplete="new-password" dir="ltr" value={p1} onChange={(e) => setP1(e.target.value)} className={`${inp} pl-11`} required />
                <button type="button" onClick={() => setShow(!show)} className="absolute top-1/2 -translate-y-1/2 left-3 text-base cursor-pointer" aria-label="show password">{show ? '🙈' : '👁️'}</button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-700">إعادة كتابة كلمة المرور</label>
              <input type={show ? 'text' : 'password'} autoComplete="new-password" dir="ltr" value={p2} onChange={(e) => setP2(e.target.value)} className={inp} required />
            </div>
            {msg ? <p className="text-rose-600">{msg}</p> : null}
            <button type="submit" disabled={busy} className="w-full py-3 bg-[#00B050] hover:bg-[#009644] text-white rounded-xl text-sm font-black cursor-pointer disabled:opacity-60">{busy ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
