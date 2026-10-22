'use client';
import { useState, useEffect } from 'react';
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

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [mounted, setMounted] = useState(false);

  // تفعيل تأثير الانسدال والظهور المتتابع عند فتح الصفحة
  useEffect(() => {
    setMounted(true);
  }, [isLoginMode]);

  const t = {
    ar: {
      brand: 'سبايك',
      loginTitle: 'Sign In Account',
      registerTitle: 'Sign Up Account',
      registerSubtitle: 'Enter your personal data to create your account',
      loginSubtitle: 'Enter your credentials to access your store',
      firstNameLabel: 'First Name',
      lastNameLabel: 'Last Name',
      storeNameLabel: 'اسم موقعك',
      emailLabel: 'Email',
      passLabel: 'Password',
      rememberMe: 'حفظ كلمة المرور',
      submitRegister: 'Sign Up',
      submitLogin: 'Sign In',
      processing: 'جاري المعالجة...',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      switchRegister: 'إنشاء حساب جديد',
      switchLogin: 'تسجيل الدخول',
      orText: 'Or',
      rights: 'Copyright © SPIKE | 2026',
    },
    en: {
      brand: 'SPIKE',
      loginTitle: 'Sign In Account',
      registerTitle: 'Sign Up Account',
      registerSubtitle: 'Enter your personal data to create your account',
      loginSubtitle: 'Enter your credentials to access your store',
      firstNameLabel: 'First Name',
      lastNameLabel: 'Last Name',
      storeNameLabel: 'Your Store Name',
      emailLabel: 'Email',
      passLabel: 'Password',
      rememberMe: 'Remember Password',
      submitRegister: 'Sign Up',
      submitLogin: 'Sign In',
      processing: 'Processing...',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      switchRegister: 'Create a new account',
      switchLogin: 'Sign In',
      orText: 'Or',
      rights: 'Copyright © SPIKE | 2026',
    },
  }[lang || 'ar'];

 const [formData, setFormData] = useState({ storeSlug: '', currency: 'USD', fullName: '', phone: '', email: '', password: '', confirmPassword: '', promo: '' });
    firstName: '',
    lastName: '',
    storeSlug: '',
    email: '',
    password: '',
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

    await supabase.from('store_profiles').insert([{
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
        alert(isAr ? 'يرجى ملء الحقول الأساسية' : 'Please fill required fields');
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
          },
        },
      });

      if (signUpError) {
        alert((isAr ? 'تعذر إنشاء الحساب: ' : 'Sign up failed: ') + signUpError.message);
        setLoading(false);
        return;
      }

      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        alert(isAr ? 'هذا البريد مسجل بالفعل، سجّل الدخول.' : 'Email already registered. Please sign in.');
        setIsLoginMode(true);
        setLoading(false);
        return;
      }

      if (!data?.session) {
        alert(isAr ? '📧 تم إنشاء حسابك. تفقّد بريدك لتأكيد الحساب ثم سجل الدخول.' : '📧 Account created. Confirm your email and sign in.');
        setIsLoginMode(true);
        setLoading(false);
        return;
      }

      await ensureStore(data.user);
      rememberSession(data.user, false);
      router.replace('/dashboard');
      return;
    } catch (err) {
      alert('Error: ' + (err.message || 'Connection failed'));
    }

    setLoading(false);
  };

  return (
    <div 
      className={`min-h-screen font-sans flex flex-col justify-between selection:bg-[#0ea5e9] selection:text-white transition-colors duration-300 overflow-x-hidden ${
        isDark ? 'bg-gradient-to-b from-[#0B132B] via-[#0f1d36] to-[#0A1118] text-slate-100' : 'bg-gradient-to-b from-[#f0f9ff] via-[#e0f2fe] to-[#f8fafc] text-slate-800'
      }`} 
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <header className={`px-4 sm:px-8 py-3.5 border-b sticky top-0 z-40 backdrop-blur-md transition-colors ${
        isDark ? 'border-slate-800/80 bg-[#0B132B]/90' : 'border-slate-200/85 bg-white/90'
      }`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <img 
              src={SPIKE_LOGO_URL} 
              alt="SPIKE" 
              className="h-8 w-auto object-contain rounded-xl shadow-md shadow-sky-500/20 group-hover:scale-105 transition" 
            />
            <span className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t.brand}
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLanguage}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                isDark ? 'border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-2xs'
              }`}
            >
              <span>🌐</span> <span className="font-mono">{isAr ? 'EN' : 'عربي'}</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center text-sm transition cursor-pointer ${
                isDark ? 'border-slate-700 bg-slate-800/80 text-amber-300 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-2xs'
              }`}
              title={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* المحتوى مع حركات الانسدال المتتابع (Staggered Drop-down) */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 w-full max-w-md mx-auto">
        <div className={`w-full rounded-[28px] border p-6 sm:p-8 shadow-2xl backdrop-blur-2xl relative overflow-hidden transition-all duration-700 transform ${
          mounted ? 'translate-y-0 opacity-100' : '-translate-y-6 opacity-0'
        } ${isDark ? 'border-slate-800/90 bg-[#10192d]/90 shadow-sky-950/30' : 'border-slate-200 bg-white/95 shadow-xl'}`}>
          
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-sky-500/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-500/15 rounded-full blur-3xl pointer-events-none"></div>

          {/* شعار سبايك الأصلي بشكل احترافي مع إضاءة */}
          <div className="text-center space-y-1.5 mb-6 relative z-10 transition-all duration-500 delay-100 transform">
            <div className="flex justify-center mb-3">
              <div className="relative group cursor-pointer">
                <div className="absolute -inset-1 bg-gradient-to-r from-sky-500 to-teal-400 rounded-2xl blur-md opacity-70 group-hover:opacity-100 transition duration-500"></div>
                <img 
                  src={SPIKE_LOGO_URL} 
                  alt="SPIKE" 
                  className="relative h-14 w-auto object-contain rounded-2xl shadow-xl bg-[#0B132B] p-1.5 border border-slate-700/50" 
                />
              </div>
            </div>
            <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {(isLoginMode || isAdminEmail) ? t.loginTitle : t.registerTitle}
            </h2>
            <p className="text-slate-400 text-[11px]">
              {(isLoginMode || isAdminEmail) ? t.loginSubtitle : t.registerSubtitle}
            </p>
          </div>

          {/* زر Google */}
          {showRegisterFields && (
            <div className="mb-5 relative z-10 transition-all duration-500 delay-150 transform">
              <button
                type="button"
                onClick={() => alert(isAr ? 'التسجيل بواسطة Google قيد الإعداد' : 'Google sign up coming soon')}
                className={`w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border text-xs font-bold transition cursor-pointer shadow-2xs ${
                  isDark ? 'border-slate-700 bg-[#162235] hover:bg-[#1e2d44] text-white' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                }`}
              >
                <span className="text-base">🌐</span> Continue with Google
              </button>

              <div className="flex items-center my-4">
                <div className={`flex-1 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}></div>
                <span className="px-3 text-[11px] text-slate-400 font-mono">{t.orText}</span>
                <div className={`flex-1 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}></div>
              </div>
            </div>
          )}

          {/* الحقول المنسدلة وراء بعضها */}
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-bold relative z-10">
            
            {showRegisterFields && (
              <div className="grid grid-cols-2 gap-3 transition-all duration-500 delay-200 transform">
                <div className="space-y-1">
                  <label className={isDark ? 'text-slate-300 text-[11px] font-medium' : 'text-slate-600 text-[11px] font-medium'}>{t.firstNameLabel}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hassan"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    className={`w-full p-3 rounded-xl border outline-none text-xs transition ${
                      isDark ? 'border-slate-700 bg-[#162235] text-white placeholder-slate-500 focus:border-sky-400' : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-sky-500'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className={isDark ? 'text-slate-300 text-[11px] font-medium' : 'text-slate-600 text-[11px] font-medium'}>{t.lastNameLabel}</label>
                  <input
                    type="text"
                    placeholder="e.g. Hosny"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    className={`w-full p-3 rounded-xl border outline-none text-xs transition ${
                      isDark ? 'border-slate-700 bg-[#162235] text-white placeholder-slate-500 focus:border-sky-400' : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-sky-500'
                    }`}
                  />
                </div>
              </div>
            )}

            {showRegisterFields && (
              <div className="space-y-1 transition-all duration-500 delay-250 transform">
                <label className={isDark ? 'text-slate-300 text-[11px] font-medium' : 'text-slate-600 text-[11px] font-medium'}>{t.storeNameLabel}</label>
                <input
                  type="text"
                  placeholder="my-store-slug"
                  value={formData.storeSlug}
                  onChange={(e) => handleChange('storeSlug', e.target.value)}
                  className={`w-full p-3 rounded-xl border outline-none text-xs font-mono transition ${
                    isDark ? 'border-slate-700 bg-[#162235] text-white placeholder-slate-500 focus:border-sky-400' : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-sky-500'
                  }`}
                />
              </div>
            )}

            <div className="space-y-1 transition-all duration-500 delay-300 transform">
              <label className={isDark ? 'text-slate-300 text-[11px] font-medium' : 'text-slate-600 text-[11px] font-medium'}>{t.emailLabel}</label>
              <input
                type="email"
                required
                dir="ltr"
                placeholder="eg. assardev58@gmail.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`w-full p-3 rounded-xl border outline-none text-xs font-mono text-left transition ${
                  isDark ? 'border-slate-700 bg-[#162235] text-white placeholder-slate-500 focus:border-sky-400' : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-sky-500'
                }`}
              />
            </div>

            <div className="space-y-1 relative transition-all duration-500 delay-350 transform">
              <label className={isDark ? 'text-slate-300 text-[11px] font-medium' : 'text-slate-600 text-[11px] font-medium'}>{t.passLabel}</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className={`w-full p-3 rounded-xl border outline-none text-xs transition pr-10 ${
                    isDark ? 'border-slate-700 bg-[#162235] text-white placeholder-slate-500 focus:border-sky-400' : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-sky-500'
                  }`}
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

            {/* زر حفظ كلمة المرور */}
            <div className="flex items-center justify-between pt-1 transition-all duration-500 delay-400 transform">
              <label className="flex items-center gap-2 cursor-pointer text-[11px] font-normal text-slate-400 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-sky-500 focus:ring-sky-500 bg-[#162235]"
                />
                {t.rememberMe}
              </label>
            </div>

            <div className="pt-2 transition-all duration-500 delay-450 transform">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-teal-400 hover:from-sky-400 hover:to-teal-300 text-slate-950 rounded-xl text-xs font-black transition-all shadow-lg shadow-sky-500/20 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? t.processing : (isLoginMode || isAdminEmail) ? t.submitLogin : t.submitRegister}
              </button>

              <div className="text-center pt-3 text-slate-400 text-[11px] flex items-center justify-center gap-1">
                <span>{isLoginMode ? t.noAccount : t.hasAccount}</span>
                <button
                  type="button"
                  onClick={() => setIsLoginMode(!isLoginMode)}
                  className="text-sky-400 hover:underline font-bold cursor-pointer"
                >
                  {isLoginMode ? t.switchRegister : t.switchLogin}
                </button>
              </div>
            </div>

          </form>
        </div>
      </main>

      <footer className={`pt-6 pb-4 px-4 sm:px-8 border-t text-xs ${
        isDark ? 'border-slate-800 bg-[#080E14] text-slate-500' : 'border-slate-200 bg-white text-slate-500'
      }`}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px]">
          <div>{t.rights}</div>
          <div className="flex items-center gap-2 font-bold text-slate-400">
            <span className={isDark ? 'text-white' : 'text-slate-900'}>EG</span> • <span>SA</span> • <span>AE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
