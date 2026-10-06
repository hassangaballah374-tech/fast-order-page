'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function RegisterStorePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    storeName: '',
    storeSlug: '',
    ownerName: '',
    phone: '',
    governorate: '',
    address: '',
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // فحص ما إذا كان المستخدم قادماً من تسجيل الدخول عبر Google
  useEffect(() => {
    async function checkGoogleAuth() {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const u = session.user;
        setFormData((prev) => ({
          ...prev,
          email: u.email || '',
          ownerName: u.user_metadata?.full_name || u.user_metadata?.name || prev.ownerName,
        }));
      }
    }
    checkGoogleAuth();
  }, []);

  // 1. التسجيل الفوري عبر حساب Google
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/register` : '',
        },
      });
      if (error) throw error;
    } catch (err) {
      setErrorMsg('خطأ أثناء الدخول بحساب جوجل: ' + err.message);
      setGoogleLoading(false);
    }
  };

  // 2. تأكيد حفظ بيانات المتجر
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      let currentUserId = null;
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        currentUserId = session.user.id;
      } else {
        // إنشاء حساب يدوي بالبريد وكلمة المرور
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { full_name: formData.ownerName },
          },
        });
        if (authError) throw authError;
        currentUserId = authData?.user?.id;
      }

      // حفظ بيانات المتجر وملف التاجر في store_profiles
      const slug = formData.storeSlug
        ? formData.storeSlug.trim().toLowerCase().replace(/\s+/g, '-')
        : formData.storeName.trim().toLowerCase().replace(/\s+/g, '-');

      const { error: profileError } = await supabase.from('store_profiles').upsert([
        {
          user_id: currentUserId,
          store_name: formData.storeName,
          store_slug: slug,
          owner_name: formData.ownerName,
          phone: formData.phone,
          governorate: formData.governorate,
          address: formData.address,
          is_active: false, // لا يعمل إلا بعد تفعيلك له
          amount_paid: 0,
        },
      ]);

      if (profileError) throw profileError;

      alert('🎉 تم إنشاء طلب اشتراك متجرك بنجاح! سيتم تحويلك للوحة التحكم وبدء التفعيل فور تأكيد الاشتراك.');
      router.push('/admin');
    } catch (err) {
      setErrorMsg(err.message || 'حدث خطأ أثناء إتمام التسجيل');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 sm:p-6 font-sans select-none" dir="rtl">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-6 shadow-2xl">
        
        <div className="text-center space-y-2">
          <span className="text-4xl block">🏪</span>
          <h1 className="text-2xl sm:text-3xl font-black">فتح متجر إلكتروني جديد</h1>
          <p className="text-xs sm:text-sm text-slate-400">سجل بياناتك لتبدأ في إضافة منتجاتك وتجهيز متجرك</p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-red-500/20 border border-red-500/40 text-red-300 rounded-2xl text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        {/* زر التسجيل الفوري بحساب Google */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-2xl text-sm transition flex items-center justify-center gap-3 shadow-md hover:scale-[1.01] active:scale-95 cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.26v3.13C3.27 21.36 7.35 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.6H1.26C.46 8.21 0 10.05 0 12s.46 3.79 1.26 5.4l4.02-3.13z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.64 1.26 6.6l4.02 3.13c.95-2.84 3.6-4.98 6.72-4.98z"/>
          </svg>
          <span>{googleLoading ? 'جاري الاتصال بجوجل...' : 'التسجيل السريع بحساب Google'}</span>
        </button>

        <div className="flex items-center gap-3 text-slate-500 text-xs my-2">
          <div className="flex-1 h-px bg-slate-800"></div>
          <span>أو كتابة البيانات يدوياً</span>
          <div className="flex-1 h-px bg-slate-800"></div>
        </div>

        <form onSubmit={handleRegister} className="space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1.5">اسم المتجر *</label>
              <input
                type="text"
                required
                placeholder="مثال: لقطة ستور"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1.5">رابط المتجر بالإنجليزية (Slug) *</label>
              <input
                type="text"
                required
                dir="ltr"
                placeholder="loqta-store"
                value={formData.storeSlug}
                onChange={(e) => setFormData({ ...formData, storeSlug: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1.5">اسم التاجر / المالك بالكامل *</label>
              <input
                type="text"
                required
                placeholder="محمد أحمد علي"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1.5">رقم الهاتف (الواتساب للتواصل) *</label>
              <input
                type="tel"
                required
                dir="ltr"
                placeholder="01xxxxxxxxx"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1.5">المحافظة *</label>
              <input
                type="text"
                required
                placeholder="القاهرة / الإسكندرية / البحيرة..."
                value={formData.governorate}
                onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1.5">العنوان بالتفصيل *</label>
              <input
                type="text"
                required
                placeholder="المدينة / المركز / الشارع"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1.5">البريد الإلكتروني *</label>
              <input
                type="email"
                required
                dir="ltr"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1.5">كلمة المرور *</label>
              <input
                type="password"
                required
                dir="ltr"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 mt-4 cursor-pointer"
          >
            {loading ? 'جاري تجهيز متجرك...' : 'تأكيد التسجيل وفتح المتجر 🚀'}
          </button>
        </form>

      </div>
    </div>
  );
}
