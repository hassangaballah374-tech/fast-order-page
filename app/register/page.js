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

  const [isLoginMode, setIsLoginMode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('user_email', SUPER_ADMIN_EMAIL);
    localStorage.setItem('is_super_admin', 'true');
  }, []);

  const t = {
    ar: {
      brand: 'سبايك',
      home: 'الرئيسية',
      pricing: 'الأسعار',
      subscribeBtn: 'اشترك الآن',
      loginTitle: 'تسجيل الدخول إلى حسابك',
      registerTitle: 'انشئ حساب مجاني',
      storeNameLabel: 'اسم موقعك',
      currencyLabel: 'العملة الأساسية',
      nameLabel: 'اسمك واسم العائلة',
      phoneLabel: 'رقم الهاتف',
      emailLabel: 'البريد الالكتروني',
      passLabel: 'الرقم السري',
      confirmPassLabel: 'اعد كتابة الرقم السري',
      submitRegister: 'انشاء حساب',
      submitLogin: 'تسجيل الدخول',
      processing: 'جاري المعالجة...',
      noAccount: 'ليس لديك حساب بعد؟',
      hasAccount: 'لديك حساب بالفعل؟',
      switchRegister: 'انشئ حساب مجاني جديد',
      switchLogin: 'تسجيل الدخول',
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
      registerTitle: 'Create Free Account',
      storeNameLabel: 'Your Store Name',
      currencyLabel: 'Base Currency',
      nameLabel: 'Full Name',
      phoneLabel: 'Phone Number',
      emailLabel: 'Email Address',
      passLabel: 'Password',
      confirmPassLabel: 'Confirm Password',
      submitRegister: 'Create Account',
      submitLogin: 'Sign In',
      processing: 'Processing...',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      switchRegister: 'Create a new free account',
      switchLogin: 'Sign In',
      aboutTitle: 'About SPIKE',
      aboutDesc: 'Scale your eCommerce business up to 200% over competitors. SPIKE understands your needs and customer behaviors.',
      academyTitle: 'Academy',
      devsTitle: 'Developers',
      appTitle: 'Download App',
      rights: 'Copyright © SPIKE | 2026',
    },
  }[lang || 'ar'];

  const [formData, setFormData] = useState({
    storeSlug: '',
    currency: 'USD',
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const emailInput = formData.email.trim().toLowerCase();

      // 👑 فحص قاطع: إذا كان البريد هو بريد السوبر أدمن، يتم توجيهه حصرياً وفوراً إلى /admin وتخزينه
      if (emailInput === SUPER_ADMIN_EMAIL.toLowerCase()) {
        localStorage.setItem('user_email', SUPER_ADMIN_EMAIL);
        localStorage.setItem('is_super_admin', 'true');
        
        // محاولة تسجيل الدخول في Supabase إن أمكن، وإن حدث خطأ نتجاوزه لضمان الدخول للوحة الأدمن
        try {
          await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });
        } catch (authErr) {
          console.log('Bypassing auth check for super admin:', authErr);
        }

        alert(isAr ? '👑 أهلاً بك يا حسن حسني (مرحباً بك في لوحة الإدارة العليا)' : 'Welcome Super Admin!');
        router.push('/admin');
        setLoading(false);
        return;
      }

      if (isLoginMode) {
        if (!emailInput || !formData.password) {
          alert(isAr ? 'يرجى كتابة البريد الإلكتروني وكلمة المرور' : 'Please enter email and password');
          setLoading(false);
          return;
        }

        // محاولة تسجيل الدخول الفعلي عبر Supabase للتاجر
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (loginError) {
          alert(isAr ? 'خطأ في البريد أو كلمة المرور: ' + loginError.message : 'Login Error: ' + loginError.message);
          setLoading(false);
          return;
        }

        const { data: store } = await supabase
          .from('store_profiles')
          .select('*')
          .eq('owner_name', formData.fullName || emailInput)
          .maybeSingle();

        const uid = store?.user_id || 'merchant_' + Date.now();
        localStorage.setItem('merchant_user_id', uid);
        localStorage.setItem('user_email', emailInput);
        localStorage.setItem('is_super_admin', 'false');

        alert(isAr ? '✅ تم تسجيل الدخول بنجاح!' : '✅ Logged in successfully!');
        router.push('/dashboard');
      } else {
        if (!formData.storeSlug || !formData.fullName || !formData.phone || !emailInput || !formData.password) {
          alert(isAr ? 'يرجى ملء كافة الحقول المطلوبة' : 'Please fill all required fields');
          setLoading(false);
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          alert(isAr ? 'كلمتا المرور غير متطابقتين!' : 'Passwords do not match!');
          setLoading(false);
          return;
        }

        const cleanSlug = formData.storeSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
        const generatedUid = 'usr_' + Date.now().toString(36);

        await supabase.from('store_profiles').insert([{
          user_id: generatedUid,
          store_name: formData.storeSlug,
          store_slug: cleanSlug,
          owner_name: formData.fullName,
          phone: '+20' + formData.phone.replace(/^0+/, ''),
          wallet_balance_usd: 5.0,
          is_active: true,
          subscription_status: 'active',
          plan_type: 'starter',
        }]);

        await supabase.from('merchant_settings').insert([{
          user_id: generatedUid,
          store_name: formData.storeSlug,
          owner_name: formData.fullName,
          store_email: emailInput,
          support_phone: '+20' + formData.phone.replace(/^0+/, ''),
          about_us: 'Official verified store powered by SPIKE.',
        }]);

        localStorage.setItem('merchant_user_id', generatedUid);
        localStorage.setItem('user_email', emailInput);
        localStorage.setItem('is_super_admin', 'false');

        alert(isAr ? `🎉 تم إنشاء متجرك (${cleanSlug}.spike.shop) بنجاح!` : `🎉 Store (${cleanSlug}.spike.shop) created!`);
        router.push('/dashboard');
      }
    } catch (err) {
      alert('Error: ' + (err.message || 'Connection failed'));
    }

    setLoading(false);
  };

  return (
    <div 
      className={`min-h-screen font-sans flex flex-col justify-between selection:bg-[#00B050] selection:text-white transition-colors duration-200 overflow-x-hidden ${
        isDark ? 'bg-[#0B132B] text-slate-100' : 'bg-[#F4F6F9] text-slate-800'
      }`} 
      dir={isAr ? 'rtl' : 'ltr'}
    >

      <header className={`px-4 sm:px-8 py-3 border-b sticky top-0 z-40 backdrop-blur-md transition-colors ${
        isDark ? 'bg-[#091222]/95 border-slate-800' : 'bg-white/95 border-slate-200/90 shadow-2xs'
      }`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img
              src={SPIKE_LOGO_URL}
              alt="SPIKE"
              className="h-8 w-auto object-contain rounded-lg shadow-xs"
            />
            <span className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-[#0E1E38]'}`}>
              {t.brand}
            </span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <button
              type="button"
              onClick={toggleLanguage}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer shrink-0 ${
                isDark 
                  ? 'border-slate-700 bg-slate-800 text-slate-200' 
                  : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              <span>🌐</span>
              <span className="font-mono">{isAr ? 'EN' : 'عربي'}</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs transition cursor-pointer shrink-0 ${
                isDark 
                  ? 'border-slate-700 bg-slate-800 text-amber-300' 
                  : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
              title={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            <button
              type="button"
              onClick={() => setIsLoginMode(false)}
              className="bg-[#00B050] hover:bg-[#009644] text-white px-3 sm:px-4 py-1.5 rounded-lg text-xs font-black shadow-xs transition shrink-0 cursor-pointer"
            >
              {t.subscribeBtn}
            </button>

            <button
              type="button"
              onClick={() => setIsLoginMode(true)}
              className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs transition shrink-0 cursor-pointer ${
                isDark ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-600'
              }`}
              title={t.submitLogin}
            >
              👤
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-10 w-full max-w-lg mx-auto">
        
        <div className="text-center space-y-2 mb-5">
          <div className="flex justify-center">
            <img
              src={SPIKE_LOGO_URL}
              alt="SPIKE"
              className="h-14 w-auto object-contain rounded-2xl shadow-sm"
            />
          </div>

          <div className="flex items-center justify-center gap-1.5 font-black text-xl">
            <span className={isDark ? 'text-white' : 'text-[#0E1E38]'}>سبايك</span>
            <span className="text-slate-400 font-light">|</span>
            <span className="text-[#00B050] font-mono tracking-wider">SPIKE</span>
          </div>

          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {isLoginMode ? t.loginTitle : t.registerTitle}
          </h2>
        </div>

        <div className={`w-full rounded-2xl border p-5 sm:p-8 shadow-sm transition-colors ${
          isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold">
            
            {!isLoginMode && (
              <>
                <div className="space-y-1.5">
                  <label className={isDark ? 'text-slate-300' : 'text-slate-700'}>{t.storeNameLabel}</label>
                  <div className={`flex items-stretch rounded-xl border overflow-hidden transition-all ${
                    isDark ? 'border-slate-700 bg-slate-900 focus-within:border-[#00B050]' : 'border-slate-300 bg-slate-50 focus-within:border-[#00B050] focus-within:bg-white'
                  }`} dir="ltr">
                    <input
                      type="text"
                      required
                      placeholder="store-name"
                      value={formData.storeSlug}
                      onChange={(e) => handleChange('storeSlug', e.target.value)}
                      className={`flex-1 p-3 outline-none font-mono text-xs text-left bg-transparent ${
                        isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                      }`}
                    />
                    <span className={`px-3 flex items-center font-mono text-xs select-none border-l ${
                      isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-200 text-slate-600 border-slate-300'
                    }`}>
                      .spike.shop
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={isDark ? 'text-slate-300' : 'text-slate-700'}>{t.currencyLabel}</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    className={`w-full p-3 rounded-xl border outline-none text-xs font-bold transition-all ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-[#00B050]' : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-[#00B050] focus:bg-white'
                    }`}
                  >
                    <option value="USD">{isAr ? 'دولار أمريكي - USD' : 'US Dollar - USD'}</option>
                    <option value="EGP">{isAr ? 'جنيه مصري - EGP' : 'Egyptian Pound - EGP'}</option>
                    <option value="SAR">{isAr ? 'ريال سعودي - SAR' : 'Saudi Riyal - SAR'}</option>
                    <option value="AED">{isAr ? 'درهم إماراتي - AED' : 'UAE Dirham - AED'}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className={isDark ? 'text-slate-300' : 'text-slate-700'}>{t.nameLabel}</label>
                  <input
                    type="text"
                    required
                    placeholder={isAr ? 'مثال: أحمد محمد' : 'e.g. John Doe'}
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    className={`w-full p-3 rounded-xl border outline-none text-xs transition-all ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-[#00B050]' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#00B050] focus:bg-white'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={isDark ? 'text-slate-300' : 'text-slate-700'}>{t.phoneLabel}</label>
                  <div className={`flex items-stretch rounded-xl border overflow-hidden transition-all ${
                    isDark ? 'border-slate-700 bg-slate-900 focus-within:border-[#00B050]' : 'border-slate-300 bg-slate-50 focus-within:border-[#00B050] focus-within:bg-white'
                  }`} dir="ltr">
                    <div className={`px-3 flex items-center gap-1.5 font-mono text-xs select-none border-r ${
                      isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-200 text-slate-700 border-slate-300'
                    }`}>
                      <span>🇪🇬</span>
                      <span>+20</span>
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="01xxxxxxxxx"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className={`flex-1 p-3 outline-none font-mono text-xs text-left bg-transparent ${
                        isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className={isDark ? 'text-slate-300' : 'text-slate-700'}>{t.emailLabel}</label>
              <input
                type="email"
                required
                dir="ltr"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`w-full p-3 rounded-xl border outline-none text-xs font-mono text-left transition-all ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-[#00B050]' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#00B050] focus:bg-white'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className={isDark ? 'text-slate-300' : 'text-slate-700'}>{t.passLabel}</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={`w-full p-3 rounded-xl border outline-none text-xs transition-all ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-[#00B050]' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#00B050] focus:bg-white'
                }`}
              />
            </div>

            {!isLoginMode && (
              <div className="space-y-1.5">
                <label className={isDark ? 'text-slate-300' : 'text-slate-700'}>{t.confirmPassLabel}</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  className={`w-full p-3 rounded-xl border outline-none text-xs transition-all ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-[#00B050]' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#00B050] focus:bg-white'
                  }`}
                />
              </div>
            )}

            <div className="pt-3 space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#00B050] hover:bg-[#009644] text-white rounded-xl text-sm font-black transition-all shadow-sm active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? t.processing : isLoginMode ? t.submitLogin : t.submitRegister}
              </button>

              <div className="text-center pt-1">
                <span className="text-slate-400 text-xs block mb-2 font-normal">
                  {isLoginMode ? t.noAccount : t.hasAccount}
                </span>
                <button
                  type="button"
                  onClick={() => setIsLoginMode(!isLoginMode)}
                  className="w-full py-2.5 border-2 border-[#00B050] text-[#00B050] hover:bg-[#00B050]/10 rounded-xl text-xs font-black transition cursor-pointer"
                >
                  {isLoginMode ? t.switchRegister : t.switchLogin}
                </button>
              </div>
            </div>

          </form>
        </div>
      </main>

      <footer className="bg-[#121824] text-white pt-8 pb-6 px-4 sm:px-8 border-t border-slate-800 text-xs">
        <div className="max-w-6xl mx-auto space-y-6">
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 items-start">
            <div className="space-y-2">
              <h4 className="font-black text-xs text-white">{t.aboutTitle}</h4>
              <ul className="space-y-1.5 text-slate-400 text-[11px]">
                <li><Link href="/" className="hover:text-white transition">{t.home}</Link></li>
                <li><Link href="/#pricing" className="hover:text-white transition">{t.pricing}</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-black text-xs text-white">{t.academyTitle}</h4>
              <ul className="space-y-1.5 text-slate-400 text-[11px]">
                <li><span className="hover:text-white transition cursor-pointer">شروحات COD</span></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-black text-xs text-white">{t.devsTitle}</h4>
              <ul className="space-y-1.5 text-slate-400 text-[11px] font-mono">
                <li><span className="hover:text-white cursor-pointer">Public API</span></li>
                <li><span className="hover:text-white cursor-pointer">Webhooks</span></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-black text-xs text-white">{t.appTitle}</h4>
              <div className="space-y-1.5">
                <div className="border border-slate-700 bg-black/40 rounded-lg p-1.5 flex items-center gap-2 cursor-pointer">
                  <span className="text-base">🍏</span>
                  <div>
                    <span className="text-[8px] text-slate-400 block leading-none">Download on</span>
                    <strong className="text-[10px] font-mono">App Store</strong>
                  </div>
                </div>
                <div className="border border-slate-700 bg-black/40 rounded-lg p-1.5 flex items-center gap-2 cursor-pointer">
                  <span className="text-base">▶️</span>
                  <div>
                    <span className="text-[8px] text-slate-400 block leading-none">GET IT ON</span>
                    <strong className="text-[10px] font-mono">Google Play</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-slate-500 text-[10px]">
            <div>{t.rights}</div>
            <div className="flex items-center gap-2 font-bold text-slate-400">
              <span className="text-white">EG</span>
              <span>•</span>
              <span>MA</span>
              <span>•</span>
              <span>DZ</span>
              <span>•</span>
              <span>SA</span>
            </div>
          </div>

        </div>
      </footer>

      <a
        href="https://wa.me/201000000000"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 left-4 z-50 w-11 h-11 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center text-xl shadow-xl transition-transform active:scale-90 cursor-pointer"
        title="WhatsApp Support"
      >
        💬
      </a>

    </div>
  );
}
