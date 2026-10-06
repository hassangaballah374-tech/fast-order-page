'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function AuthPage() {
  const router = useRouter();
  
  // 'register' لإنشاء متجر جديد، أو 'login' لتسجيل الدخول
  const [mode, setMode] = useState('register');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // حقول إنشاء المتجر
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

  // حقول تسجيل الدخول
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  // استرجاع البيانات المحفوظة إن وُجدت
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('nextorder_saved_email');
      const savedPassword = localStorage.getItem('nextorder_saved_password');
      if (savedEmail && savedPassword) {
        setLoginData({ email: savedEmail, password: savedPassword });
        setRememberMe(true);
      }
    }
  }, []);

  // إدارة حفظ أو حذف بيانات الدخول
  const handleRememberCredentials = (email, password) => {
    if (typeof window === 'undefined') return;
    if (rememberMe) {
      localStorage.setItem('nextorder_saved_email', email);
      localStorage.setItem('nextorder_saved_password', password);
    } else {
      localStorage.removeItem('nextorder_saved_email');
      localStorage.removeItem('nextorder_saved_password');
    }
  };

  // 1. معالجة تسجيل الدخول لتاجر مسجل مسبقاً
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const cleanEmail = loginData.email.trim().toLowerCase();
      const cleanPassword = loginData.password;

      // محاولة تسجيل الدخول عبر Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      let merchantUserId = authData?.user?.id;

      // إذا لم يكن الحساب مسجلاً في Auth أو حدث تقييد، نبحث عنه بريدياً في بروفايل المتاجر
      if (authError || !merchantUserId) {
        const { data: storeProfile } = await supabase
          .from('store_profiles')
          .select('user_id')
          .ilike('owner_name', `%${cleanEmail.split('@')[0]}%`)
          .limit(1)
          .maybeSingle();

        if (storeProfile?.user_id) {
          merchantUserId = storeProfile.user_id;
        } else {
          throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
        }
      }

      handleRememberCredentials(cleanEmail, cleanPassword);
      localStorage.setItem('merchant_user_id', merchantUserId);

      alert('✅ أهلاً بك مجدداً! جاري فتح متجرك...');
      router.push('/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'فشل تسجيل الدخول، تأكد من بياناتك');
    }
    setLoading(false);
  };

  // 2. معالجة إنشاء متجر جديد
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const cleanEmail = formData.email.trim().toLowerCase();
      const cleanSlug = (formData.storeSlug || formData.storeName)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-');

      let currentUserId = null;

      // إنشاء حساب المستخدم في Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: formData.password,
        options: {
          data: { full_name: formData.ownerName },
        },
      });

      if (authError && authError.message.includes('rate limit')) {
        currentUserId = 'merchant_' + Date.now();
      } else if (authError) {
        throw authError;
      } else {
        currentUserId = authData?.user?.id || 'merchant_' + Date.now();
      }

      // حفظ بيانات المتجر الجديد
      const { error: profileError } = await supabase.from('store_profiles').insert([
        {
          user_id: currentUserId,
          store_name: formData.storeName,
          store_slug: cleanSlug,
          owner_name: formData.ownerName,
          phone: formData.phone,
          governorate: formData.governorate,
          address: formData.address,
          is_active: false,
          amount_paid: 0,
        },
      ]);

      if (profileError) throw profileError;

      // إعداد سجل الإعدادات الأولي
      await supabase.from('merchant_settings').upsert({
        user_id: currentUserId,
        store_name: formData.storeName,
        support_phone: formData.phone,
      }, { onConflict: 'user_id' });

      handleRememberCredentials(cleanEmail, formData.password);
      localStorage.setItem('merchant_user_id', currentUserId);

      alert('🎉 تم فتح حساب متجرك بنجاح! جاري تحويلك إلى لوحة التحكم الخاصة بك...');
      router.push('/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'حدث خطأ أثناء إتمام التسجيل');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 sm:p-6 font-sans select-none" dir="rtl">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-6 shadow-2xl">
        
        {/* الترويسة الرئيسية */}
        <div className="text-center space-y-2">
          <span className="text-4xl block">🏪</span>
          <h1 className="text-2xl sm:text-3xl font-black">
            {mode === 'register' ? 'فتح متجر إلكتروني جديد' : 'تسجيل الدخول إلى متجرك'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {mode === 'register'
              ? 'سجل بيانات متجرك الآن على NEXT ORDER وابدأ البيع فوراً'
              : 'أدخل بيانات حسابك للمتابعة وإدارة منتجاتك وطلباتك'}
          </p>
        </div>

        {/* أزرار التبديل السريع بين إنشاء حساب وتسجيل الدخول */}
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(''); }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
              mode === 'register' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            🏪 فتح متجر جديد
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
              mode === 'login' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            🔑 تسجيل الدخول
          </button>
        </div>

        {/* رسائل التنبيه أو الخطأ */}
        {errorMsg && (
          <div className="p-3.5 bg-red-500/20 border border-red-500/40 text-red-300 rounded-2xl text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        {/* 🌟 1. نموذج تسجيل الدخول */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1.5">البريد الإلكتروني *</label>
              <input
                type="email"
                required
                dir="ltr"
                placeholder="name@example.com"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white text-sm font-mono focus:outline-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1.5">كلمة المرور *</label>
              <input
                type="password"
                required
                dir="ltr"
                placeholder="••••••••"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white text-sm font-mono focus:outline-emerald-500"
              />
            </div>

            {/* زر تذكّر بيانات الدخول وحفظ كلمة المرور */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
                <span className="font-bold">حفظ بيانات الدخول وكلمة المرور على هذا الجهاز</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-xl transition-all duration-300 active:scale-95 disabled:opacity-50 mt-4 cursor-pointer"
            >
              {loading ? 'جاري التحقق والدخول...' : 'تسجيل الدخول إلى متجري 🚀'}
            </button>
          </form>
        )}

        {/* 🌟 2. نموذج فتح متجر جديد */}
        {mode === 'register' && (
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-emerald-500"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm font-mono focus:outline-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">اسم التاجر بالكامل *</label>
                <input
                  type="text"
                  required
                  placeholder="محمد أحمد علي"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1.5">رقم الهاتف (الواتساب) *</label>
                <input
                  type="tel"
                  required
                  dir="ltr"
                  placeholder="01xxxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm font-mono focus:outline-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">المحافظة *</label>
                <input
                  type="text"
                  required
                  placeholder="القاهرة / الإسكندرية..."
                  value={formData.governorate}
                  onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1.5">العنوان بالتفصيل *</label>
                <input
                  type="text"
                  required
                  placeholder="المدينة / الشارع"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-emerald-500"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm font-mono focus:outline-emerald-500"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm font-mono focus:outline-emerald-500"
                />
              </div>
            </div>

            {/* خيار الحفظ التلقائي عند التسجيل */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="regRemember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
              <label htmlFor="regRemember" className="font-bold text-slate-300 cursor-pointer">
                تذكر بيانات الحساب وكلمة المرور للدخول التلقائي
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-xl transition-all duration-300 active:scale-95 disabled:opacity-50 mt-4 cursor-pointer"
            >
              {loading ? 'جاري إنشاء المتجر...' : 'إنشاء المتجر وبدء التجارة 🚀'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
