'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { SPIKE_LOGO_URL } from '../../components/SpikeBrandHeader';

const SUPER_ADMIN_EMAIL = 'hassanhosny2007@gmail.com';

export default function SpikeRegisterAndAuthPage() {
  const router = useRouter();
  const { lang, theme, toggleLanguage, toggleTheme, isDark } = useApp();
  const isAr = lang === 'ar';

  const [isLoginMode, setIsLoginMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const t = {
    ar: {
      brand: 'سبايك',
      home: 'الرئيسية',
      pricing: 'الأسعار',
      subscribeBtn: 'اشترك الآن',
      loginTitle: 'تسجيل الدخول إلى حسابك',
      registerTitle: 'Sign Up Account',
      registerSubtitle: 'Enter your personal data to create your account',
      firstNameLabel: 'First Name',
      lastNameLabel: 'Last Name',
      storeNameLabel: 'اسم موقعك',
      currencyLabel: 'العملة الأساسية',
      emailLabel: 'Email',
      passLabel: 'Password',
      confirmPassLabel: 'اعد كتابة الرقم السري',
      submitRegister: 'Sign Up',
      submitLogin: 'تسجيل الدخول',
      processing: 'جاري المعالجة...',
      noAccount: 'ليس لديك حساب بعد؟',
      hasAccount: 'Already have an account?',
      switchRegister: 'انشئ حساب مجاني جديد',
      switchLogin: 'Log in',
      orText: 'Or',
      aboutTitle: 'عن سبايك',
      aboutDesc: 'حلّق بتجارتك الإلكترونية بمعدل يصل إلى 200% عن منافسيك، منظومة سبايك تفهم متطلباتك وسلوك عملائك.',
      academyTitle: 'الأكاديمية',
      devsTitle: 'للمطورين',
      appTitle: 'حمّل التطبيق',
      rights: 'Copyright © SPIKE | 2026',
    },
    en: {
      brand: 'SPIKE',
      home: 'Home',
      pricing: 'Pricing',
      subscribeBtn: 'Start Free',
      loginTitle: 'Sign In to Your Account',
      registerTitle: 'Sign Up Account',
      registerSubtitle: 'Enter your personal data to create your account',
      firstNameLabel: 'First Name',
      lastNameLabel: 'Last Name',
      storeNameLabel: 'Your Store Name',
      currencyLabel: 'Base Currency',
      emailLabel: 'Email',
      passLabel: 'Password',
      confirmPassLabel: 'Confirm Password',
      submitRegister: 'Sign Up',
      submitLogin: 'Sign In',
      processing: 'Processing...',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      switchRegister: 'Create a new free account',
      switchLogin: 'Log in',
      orText: 'Or',
      aboutTitle: 'About SPIKE',
      aboutDesc: 'Scale your eCommerce business up to 200% over competitors. SPIKE understands your needs and customer behaviors.',
      academyTitle: 'Academy',
      devsTitle: 'Developers',
      appTitle: 'Download App',
      rights: 'Copyright © SPIKE | 2026',
    },
  }[lang || 'ar'];

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    storeSlug: '',
    currency: 'USD',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const emailNow = formData.email.trim().toLowerCase();
  const isAdminEmail = emailNow === SUPER_ADMIN_EMAIL.toLowerCase();
  const showRegisterFields = !isLoginMode && !isAdminEmail;

  const ensureStore = async (user) => {
    const meta = user.user_metadata || {};
    const { data: existing } = await supabase
      .from('store_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (existing || !meta.store_slug) return;

    const cleanSlug = String(meta.store_slug).trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const phone = '+201000000000';

    const { error: spErr } = await supabase.from('store_profiles').insert([{
      user_id: user.id,
      store_name: meta.store_slug,
      store_slug: cleanSlug,
      owner_name: `${meta.first_name || ''} ${meta.last_name || ''}`.trim() || 'Store Owner',
      phone,
      wallet_balance_usd: 5.0,
      is_active: false,
      subscription_status: 'active',
      plan_type: 'starter',
    }]);
    if (spErr) throw new Error(spErr.message);

    await supabase.from('merchant_settings').insert([{
      user_id: user.id,
      store_name: meta.store_slug,
      owner_name: `${meta.first_name || ''} ${meta.last_name || ''}`.trim(),
      store_email: user.email,
      support_phone: phone,
      about_us: 'Official verified store powered by SPIKE.',
    }]);
  };

  const rememberSession = (user, isAdmin) => {
    try {
      localStorage.setItem('user_email', user.email || '');
      localStorage.setItem('is_super_admin', isAdmin ? 'true' : 'false');
      if (!isAdmin) localStorage.setItem('merchant_user_id', user.id);
    } catch (err) { /* تجاهل */ }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const emailInput = formData.email.trim().toLowerCase();

      if (isLoginMode || emailInput === SUPER_ADMIN_EMAIL.toLowerCase()) {
        if (!emailInput || !formData.password) {
          alert(isAr ? 'يرجى كتابة البريد الإلكتروني وكلمة المرور' : 'Please enter email and password');
          setLoading(false);
          return;
        }

        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email: emailInput,
          password: formData.password,
        });

        if (loginError || !data?.user) {
          alert((isAr ? 'خطأ في البريد أو كلمة المرور: ' : 'Login Error: ') + (loginError?.message || ''));
          setLoading(false);
          return;
        }

        if (emailInput === SUPER_ADMIN_EMAIL.toLowerCase()) {
          rememberSession(data.user, true);
          router.replace('/admin');
          return;
        }

        await ensureStore(data.user);
        rememberSession(data.user, false);
        router.replace('/dashboard');
        return;
      }

      const generatedSlug = formData.storeSlug.trim() || `${formData.firstName.toLowerCase() || 'store'}-${Math.floor(Math.random() * 900 + 100)}`;

      if (!formData.firstName || !emailInput || !formData.password) {
        alert(isAr ? 'يرجى ملء الحقول الأساسية (الاسم، الإيميل، الباسورد)' : 'Please fill required fields');
        setLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        alert(isAr ? 'كلمة المرور يجب ألا تقل عن 6 أحرف' : 'Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      const cleanSlug = generatedSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: emailInput,
        password: formData.password,
        options: {
          data: {
            store_slug: cleanSlug,
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            currency: formData.currency,
          },
        },
      });

      if (signUpError) {
        alert((isAr ? 'تعذر إنشاء الحساب: ' : 'Sign up failed: ') + signUpError.message);
        setLoading(false);
        return;
      }

      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        alert(isAr ? 'هذا البريد مسجل بالفعل، سجّل الدخول بدلاً من ذلك.' : 'Email already registered. Please sign in.');
        setIsLoginMode(true);
        setLoading(false);
        return;
      }

      if (!data?.session) {
        alert(isAr
          ? '📧 تم إنشاء حسابك. افتح بريدك واضغط رابط التأكيد، ثم سجّل الدخول وسيُنشأ متجرك تلقائياً.'
          : '📧 Account created. Confirm your email, then sign in and your store will be created.');
        setIsLoginMode(true);
        setLoading(false);
        return;
      }

      await ensureStore(data.user);
      rememberSession(data.user, false);
      alert(isAr ? `🎉 تم إنشاء متجرك (${cleanSlug}.spike.shop) بنجاح!` : `🎉 Store (${cleanSlug}.spike.shop) created!`);
      router.replace('/dashboard');
      return;
    } catch (err) {
      alert('Error: ' + (err.message || 'Connection failed'));
    }

    setLoading(false);
  };

  return (
    <div 
      className="min-h-screen font-sans flex flex-col justify-between selection:bg-[#00B050] selection:text-white transition-colors duration-200 overflow-x-hidden bg-[#0A1118] text-slate-100" 
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <header className="px-4 sm:px-8 py-3 border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md bg-[#0A1118]/90">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img src={SPIKE_LOGO_URL} alt="SPIKE" className="h-8 w-auto object-contain rounded-lg shadow-xs" />
            <span className="text-lg font-black tracking-tight text-white">{t.brand}</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLanguage}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-slate-800 bg-[#121B26] text-slate-200 transition cursor-pointer"
            >
              <span>🌐</span> <span className="font-mono">{isAr ? 'EN' : 'عربي'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLoginMode(false)}
              className="bg-[#00B050] hover:bg-[#009644] text-white px-3 sm:px-4 py-1.5 rounded-lg text-xs font-black shadow-xs transition cursor-pointer"
            >
              {t.subscribeBtn}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 w-full max-w-md mx-auto">
        <div className="w-full rounded-[28px] border border-slate-800 bg-[#111A24]/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          
          {/* تأثيرات الإضاءة الخلفية المتدرجة مثل التصميم */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#00B050]/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="text-center space-y-1.5 mb-6 relative z-10">
            <div className="flex justify-center mb-2">
              <img src={SPIKE_LOGO_URL} alt="SPIKE" className="h-10 w-auto object-contain rounded-xl" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {(isLoginMode || isAdminEmail) ? t.loginTitle : t.registerTitle}
            </h2>
            {!isLoginMode && !isAdminEmail && (
              <p className="text-slate-400 text-[11px]">{t.registerSubtitle}</p>
            )}
          </div>

          {/* أزرار التسجيل السريع (Google & Github) مطابقة للصورة */}
          {showRegisterFields && (
            <div className="grid grid-cols-2 gap-3 mb-5 relative z-10">
              <button
                type="button"
                onClick={() => alert(isAr ? 'التسجيل بواسطة Google قيد الإعداد' : 'Google sign up coming soon')}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-700/80 bg-[#182433] hover:bg-[#1E2D3D] text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                <span className="text-sm">🌐</span> Google
              </button>
              <button
                type="button"
                onClick={() => alert(isAr ? 'التسجيل بواسطة Github قيد الإعداد' : 'Github sign up coming soon')}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-700/80 bg-[#182433] hover:bg-[#1E2D3D] text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                <span className="text-sm">🐙</span> Github
              </button>

              <div className="col-span-2 flex items-center my-1">
                <div className="flex-1 border-t border-slate-800"></div>
                <span className="px-3 text-[11px] text-slate-500 font-mono">{t.orText}</span>
                <div className="flex-1 border-t border-slate-800"></div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-bold relative z-10">
            
            {showRegisterFields && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px] font-medium">{t.firstNameLabel}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hassan"
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-700/80 bg-[#182433] text-white placeholder-slate-500 outline-none text-xs focus:border-[#00B050] transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px] font-medium">{t.lastNameLabel}</label>
                    <input
                      type="text"
                      placeholder="e.g. Hosny"
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-700/80 bg-[#182433] text-white placeholder-slate-500 outline-none text-xs focus:border-[#00B050] transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-[11px] font-medium">{t.storeNameLabel}</label>
                  <input
                    type="text"
                    placeholder="my-store-slug"
                    value={formData.storeSlug}
                    onChange={(e) => handleChange('storeSlug', e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-700/80 bg-[#182433] text-white placeholder-slate-500 outline-none text-xs font-mono focus:border-[#00B050] transition"
                  />
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-slate-400 text-[11px] font-medium">{t.emailLabel}</label>
              <input
                type="email"
                required
                dir="ltr"
                placeholder="eg. assardev58@gmail.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-700/80 bg-[#182433] text-white placeholder-slate-500 outline-none text-xs font-mono text-left focus:border-[#00B050] transition"
              />
            </div>

            <div className="space-y-1 relative">
              <label className="text-slate-400 text-[11px] font-medium">{t.passLabel}</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-700/80 bg-[#182433] text-white placeholder-slate-500 outline-none text-xs focus:border-[#00B050] transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-sm cursor-pointer"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-white hover:bg-slate-100 text-[#0A1118] rounded-xl text-xs font-black transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? t.processing : (isLoginMode || isAdminEmail) ? t.submitLogin : t.submitRegister}
              </button>

              <div className="text-center pt-3 text-slate-400 text-[11px] flex items-center justify-center gap-1">
                <span>{isLoginMode ? t.noAccount : t.hasAccount}</span>
                <button
                  type="button"
                  onClick={() => setIsLoginMode(!isLoginMode)}
                  className="text-[#00B050] hover:underline font-bold cursor-pointer"
                >
                  {isLoginMode ? t.switchRegister : t.switchLogin}
                </button>
              </div>
            </div>

          </form>
        </div>
      </main>

      <footer className="bg-[#080E14] text-white pt-6 pb-4 px-4 sm:px-8 border-t border-slate-800/80 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-slate-500 text-[10px]">
          <div>{t.rights}</div>
          <div className="flex items-center gap-2 font-bold text-slate-400">
            <span className="text-white">EG</span> • <span>SA</span> • <span>AE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
