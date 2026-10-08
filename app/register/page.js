'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { SPIKE_LOGO_URL } from '../../components/SpikeBrandHeader';

export default function SpikeRegisterAndAuthPage() {
  const router = useRouter();
  const { lang, toggleLanguage } = useApp?.() || { lang: 'ar', toggleLanguage: () => {} };
  const isAr = lang === 'ar';

  const [isLoginMode, setIsLoginMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // نصوص اللغتين
  const t = {
    ar: {
      brand: 'سبايك',
      home: 'الرئيسية',
      pricing: 'الأسعار',
      langBtn: 'عالمي • AR',
      subscribeBtn: 'اشترك مجاناً الآن',
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
      langBtn: 'Global • EN',
      subscribeBtn: 'Start Free Now',
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

  // حقول نموذج التسجيل
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
      if (isLoginMode) {
        if (!formData.email || !formData.password) {
          alert(isAr ? 'يرجى كتابة البريد الإلكتروني وكلمة المرور' : 'Please enter email and password');
          setLoading(false);
          return;
        }

        const { data: store } = await supabase
          .from('store_profiles')
          .select('*')
          .eq('owner_name', formData.fullName || formData.email)
          .maybeSingle();

        const uid = store?.user_id || 'merchant_' + Date.now();
        localStorage.setItem('merchant_user_id', uid);
        localStorage.setItem('is_super_admin', 'false');

        alert(isAr ? '✅ تم تسجيل الدخول بنجاح!' : '✅ Logged in successfully!');
        router.push('/dashboard');
      } else {
        if (!formData.storeSlug || !formData.fullName || !formData.phone || !formData.email || !formData.password) {
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
          store_email: formData.email,
          support_phone: '+20' + formData.phone.replace(/^0+/, ''),
          about_us: 'Official verified store powered by SPIKE.',
        }]);

        localStorage.setItem('merchant_user_id', generatedUid);
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
      className="min-h-screen bg-[#F8F9FA] text-[#1E293B] font-sans flex flex-col justify-between selection:bg-emerald-500 selection:text-white transition-colors duration-200" 
      dir={isAr ? 'rtl' : 'ltr'}
    >

      {/* 🧭 1. النافبار مع زر اللغة الفعال */}
      <header className="bg-white border-b border-slate-200/80 px-6 lg:px-14 py-3.5 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <img
                src={SPIKE_LOGO_URL}
                alt="SPIKE | سبايك"
                className="h-10 w-auto object-contain rounded-lg"
              />
              <span className="text-xl font-black tracking-tight text-[#0E1E38]">
                {t.brand}
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-700">
              <Link href="/" className="hover:text-[#00B050] transition">{t.home}</Link>
              <Link href="/#pricing" className="hover:text-[#00B050] transition">{t.pricing}</Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* زر تبديل اللغة التفاعلي */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer select-none"
            >
              <span>🌐</span>
              <span>{t.langBtn}</span>
              <span className="text-[10px] text-slate-400">↕</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLoginMode(false)}
              className="bg-[#00B050] hover:bg-[#009644] text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm transition whitespace-nowrap cursor-pointer"
            >
              {t.subscribeBtn}
            </button>

            <button
              type="button"
              onClick={() => setIsLoginMode(true)}
              className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              title={t.submitLogin}
            >
              👤
            </button>
          </div>
        </div>
      </header>

      {/* 📝 2. البطاقة المركزية */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 my-6">
        
        <div className="text-center space-y-3 mb-6">
          <div className="flex justify-center">
            <img
              src={SPIKE_LOGO_URL}
              alt="SPIKE"
              className="h-14 sm:h-16 w-auto object-contain rounded-2xl shadow-sm"
            />
          </div>

          <div className="flex items-center justify-center gap-1.5 font-black text-2xl text-[#0E1E38]">
            <span>سبايك</span>
            <span className="text-slate-300 font-light">|</span>
            <span className="tracking-wider">SPIKE</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {isLoginMode ? t.loginTitle : t.registerTitle}
          </h2>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 max-w-lg w-full shadow-sm space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-slate-700">
            
            {!isLoginMode && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-slate-600">{t.storeNameLabel}</label>
                  <div className="flex rounded-xl border border-slate-200 overflow-hidden focus-within:border-[#00B050] transition shadow-2xs">
                    <input
                      type="text"
                      required
                      dir="ltr"
                      placeholder="store-name"
                      value={formData.storeSlug}
                      onChange={(e) => handleChange('storeSlug', e.target.value)}
                      className="w-full p-3 bg-white text-slate-900 outline-none font-mono text-xs text-left"
                    />
                    <span className="bg-slate-100 text-slate-500 px-3.5 flex items-center font-mono text-xs border-r border-slate-200 select-none" dir="ltr">
                      .spike.shop
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-600">{t.currencyLabel}</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-[#00B050] transition text-xs font-bold"
                  >
                    <option value="USD">{isAr ? 'دولار أمريكي - USD' : 'US Dollar - USD'}</option>
                    <option value="EGP">{isAr ? 'جنيه مصري - EGP' : 'Egyptian Pound - EGP'}</option>
                    <option value="SAR">{isAr ? 'ريال سعودي - SAR' : 'Saudi Riyal - SAR'}</option>
                    <option value="AED">{isAr ? 'درهم إماراتي - AED' : 'UAE Dirham - AED'}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-600">{t.nameLabel}</label>
                  <input
                    type="text"
                    required
                    placeholder={isAr ? 'مثال: أحمد محمد' : 'e.g. John Doe'}
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:border-[#00B050] transition text-xs shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-600">{t.phoneLabel}</label>
                  <div className="flex rounded-xl border border-slate-200 overflow-hidden focus-within:border-[#00B050] transition shadow-2xs">
                    <div className="bg-slate-100 text-slate-700 px-3 flex items-center gap-1.5 border-l border-slate-200 font-mono text-xs select-none" dir="ltr">
                      <span>🇪🇬</span>
                      <span>+20</span>
                      <span className="text-[10px] text-slate-400">↕</span>
                    </div>
                    <input
                      type="tel"
                      required
                      dir="ltr"
                      placeholder="01xxxxxxxxx"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full p-3 bg-white text-slate-900 outline-none font-mono text-xs text-left"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="block text-slate-600">{t.emailLabel}</label>
              <input
                type="email"
                required
                dir="ltr"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:border-[#00B050] transition text-xs font-mono shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-600">{t.passLabel}</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:border-[#00B050] transition text-xs shadow-2xs"
              />
            </div>

            {!isLoginMode && (
              <div className="space-y-1.5">
                <label className="block text-slate-600">{t.confirmPassLabel}</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:border-[#00B050] transition text-xs shadow-2xs"
                />
              </div>
            )}

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#00B050] hover:bg-[#009644] text-white rounded-xl text-sm font-black transition shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? t.processing : isLoginMode ? t.submitLogin : t.submitRegister}
              </button>

              <div className="text-center pt-2">
                <span className="text-slate-500 block mb-2 font-normal">
                  {isLoginMode ? t.noAccount : t.hasAccount}
                </span>
                <button
                  type="button"
                  onClick={() => setIsLoginMode(!isLoginMode)}
                  className="w-full py-2.5 border border-[#00B050] text-[#00B050] hover:bg-[#00B050]/5 rounded-xl text-xs font-black transition cursor-pointer"
                >
                  {isLoginMode ? t.switchRegister : t.switchLogin}
                </button>
              </div>
            </div>

          </form>
        </div>
      </main>

      {/* 🖤 3. الفوتر */}
      <footer className="bg-[#191919] text-white pt-12 pb-8 px-6 lg:px-16 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto space-y-10">
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-start">
            <div className="space-y-2.5">
              <h4 className="font-black text-sm text-white">{t.aboutTitle}</h4>
              <ul className="space-y-2 text-slate-400 font-normal">
                <li><Link href="/" className="hover:text-white transition">{t.home}</Link></li>
                <li><Link href="/#pricing" className="hover:text-white transition">{t.pricing}</Link></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-black text-sm text-white">{t.academyTitle}</h4>
              <ul className="space-y-2 text-slate-400 font-normal">
                <li><button className="hover:text-white transition cursor-pointer">{isAr ? 'شروحات COD' : 'COD Tutorials'}</button></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-black text-sm text-white">{t.devsTitle}</h4>
              <ul className="space-y-2 text-slate-400 font-normal font-mono text-[11px]">
                <li><span className="hover:text-white cursor-pointer">Public API</span></li>
                <li><span className="hover:text-white cursor-pointer">Webhooks</span></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-black text-sm text-white">{t.appTitle}</h4>
              <div className="space-y-2">
                <div className="border border-slate-700 bg-black/60 rounded-xl p-2 flex items-center gap-2 cursor-pointer hover:border-slate-500 transition">
                  <span className="text-xl">🍏</span>
                  <div>
                    <span className="text-[9px] text-slate-400 block leading-none">Download on the</span>
                    <strong className="text-xs font-mono">App Store</strong>
                  </div>
                </div>

                <div className="border border-slate-700 bg-black/60 rounded-xl p-2 flex items-center gap-2 cursor-pointer hover:border-slate-500 transition">
                  <span className="text-xl">▶️</span>
                  <div>
                    <span className="text-[9px] text-slate-400 block leading-none">GET IT ON</span>
                    <strong className="text-xs font-mono">Google Play</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 md:text-left">
              <div className="flex items-center gap-2 md:justify-end">
                <img src={SPIKE_LOGO_URL} alt="SPIKE" className="h-9 w-auto object-contain rounded" />
                <span className="text-base font-black">{isAr ? 'منصة سبايك للتجارة' : 'SPIKE Commerce Platform'}</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed md:text-left">
                {t.aboutDesc}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-slate-500 text-[11px]">
            <div>{t.rights}</div>
            <div className="flex items-center gap-3 font-bold text-slate-400">
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
        className="fixed bottom-6 left-6 z-50 w-13 h-13 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center text-2xl shadow-xl transition-transform hover:scale-110 active:scale-95 cursor-pointer shadow-emerald-500/30"
        title="WhatsApp Support"
      >
        💬
      </a>

    </div>
  );
}
