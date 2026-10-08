'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '../context/AppContext';
import SpikeBrandHeader, { SPIKE_LOGO_URL } from '../components/SpikeBrandHeader';

export default function SpikeLandingPage() {
  const { lang, theme, toggleLanguage, toggleTheme } = useApp();
  const isDark = theme === 'dark';

  // أنيميشن كتابة كلمة SPIKE حرفاً بحرف
  const fullBrandText = 'SPIKE';
  const [typedText, setTypedText] = useState('');
  const [isTypingDone, setIsTypingDone] = useState(false);

  useEffect(() => {
    let index = 0;
    setTypedText('');
    setIsTypingDone(false);

    const interval = setInterval(() => {
      index++;
      setTypedText(fullBrandText.slice(0, index));
      if (index >= fullBrandText.length) {
        clearInterval(interval);
        setIsTypingDone(true);
      }
    }, 170);

    return () => clearInterval(interval);
  }, []);

  const t = {
    ar: {
      brandName: 'سبايك | SPIKE',
      whySpike: 'لماذا سبايك؟',
      features: 'المميزات',
      pricing: 'الباقات والأسعار',
      enterprise: 'كبار التجار',
      login: 'تسجيل الدخول',
      startFree: 'ابدأ مجاناً الآن',
      heroSubtitle: 'المنظومة الأقوى لإدارة المتاجر الإلكترونية، الشحن، وتحصيل الدفع عند الاستلام في مصر بأعلى معدلات تأكيد وتسليم.',
      promoSubtext: 'ابدأ فترتك التجريبية مجاناً الآن بدون أي بطاقة بنكية • إعداد متجرك في أقل من دقيقة.',
      liveBadge: 'النظام معتمد ونشط • معدل تسليم قياسي في المحافظات',
      sectionTitlePart1: 'انطلق بتجارتك',
      sectionTitlePart2: 'إلى القمة مع سبايك',
      card1Title: 'منظومة تجارة شاملة',
      card1Desc: 'إدارة متكاملة للمخزون، أسعار الشحن للمحافظات، وتتبع الأوردرات من مكان واحد.',
      card2Title: 'صفحة شراء فائقة السرعة',
      card2Desc: 'شراء سريع بنقرة واحدة (Fast COD Checkout) مصممة لرفع معدل التحويل ومبيعات الهاتف.',
      card3Title: 'تتبع دقيق وتكامل تام',
      card3Desc: 'ربط مباشر مع Facebook CAPI و TikTok و Snapchat لمنع فقدان البيانات ومضاعفة أرباح الإعلانات.',
      subtotal: 'الإجمالي الفرعي',
      terms: 'الشروط والأحكام',
      legal: 'المعلومات القانونية',
      privacy: 'سياسة الخصوصية',
      sitemap: 'خريطة الموقع',
      rights: 'جميع الحقوق محفوظة لمنصة سبايك © 2026',
      themeBtnDark: '🌙 ليلي',
      themeBtnLight: '☀️ نهاري',
    },
    en: {
      brandName: 'SPIKE | سبايك',
      whySpike: 'Why SPIKE?',
      features: 'Features',
      pricing: 'Pricing',
      enterprise: 'Enterprise',
      login: 'Log in',
      startFree: 'Start Free Now',
      heroSubtitle: 'The ultimate eCommerce platform built for Cash on Delivery, inventory scaling, and highest delivery rates.',
      promoSubtext: 'Start your free trial today. No credit card required • Launch in under a minute.',
      liveBadge: 'Verified & Live • Industry-leading COD delivery rate',
      sectionTitlePart1: 'Take your store',
      sectionTitlePart2: 'to the next level',
      card1Title: 'All-in-One E-Commerce',
      card1Desc: 'Manage inventory, governorate shipping rates, and order fulfillment in one clean hub.',
      card2Title: 'High-Converting Checkout',
      card2Desc: '1-click seamless COD checkout engineered to maximize mobile conversion and reduce drop-offs.',
      card3Title: 'Precise CAPI Tracking',
      card3Desc: 'Direct server-side integration with Meta, TikTok & Snap pixels for bulletproof ad performance.',
      subtotal: 'Subtotal',
      terms: 'Terms of Service',
      legal: 'Legal Notice',
      privacy: 'Privacy Policy',
      sitemap: 'Sitemap',
      rights: 'All rights reserved to SPIKE Platform © 2026',
      themeBtnDark: '🌙 Dark',
      themeBtnLight: '☀️ Light',
    }
  }[lang];

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      isDark ? 'bg-[#0E1E38] text-white' : 'bg-[#F7F4EC] text-[#0E1E38]'
    }`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* 🧭 الترويسة العلوية */}
      <nav className={`sticky top-0 z-50 border-b px-6 lg:px-14 py-3.5 flex items-center justify-between backdrop-blur-md transition-colors ${
        isDark ? 'bg-[#0E1E38]/90 border-slate-800' : 'bg-[#F7F4EC]/90 border-slate-200/80 shadow-sm'
      }`}>
        <div className="flex items-center gap-8">
          <Link href="/">
            <SpikeBrandHeader height="h-11" showSlogan={true} />
          </Link>

          <div className="hidden lg:flex items-center gap-6 text-sm font-bold">
            <button className="hover:text-[#E86A53] transition cursor-pointer">{t.whySpike}</button>
            <button className="hover:text-[#E86A53] transition cursor-pointer">{t.features}</button>
            <Link href="#pricing" className="hover:text-[#E86A53] transition">{t.pricing}</Link>
            <Link href="#enterprise" className="hover:text-[#E86A53] transition">{t.enterprise}</Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleLanguage}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
              isDark 
                ? 'border-slate-700 hover:bg-slate-800 text-white' 
                : 'border-slate-300 hover:bg-white text-[#0E1E38]'
            }`}
          >
            🌐 {lang === 'ar' ? 'English' : 'العربية'}
          </button>

          <button
            onClick={toggleTheme}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
              isDark 
                ? 'border-slate-700 hover:bg-slate-800 text-white' 
                : 'border-slate-300 hover:bg-white text-[#0E1E38]'
            }`}
          >
            {isDark ? t.themeBtnLight : t.themeBtnDark}
          </button>

          <Link
            href="/register"
            className={`text-sm font-bold transition px-2 ${
              isDark ? 'text-slate-300 hover:text-white' : 'text-[#0E1E38] hover:text-[#E86A53]'
            }`}
          >
            {t.login}
          </Link>

          <Link
            href="/register"
            className="px-5 py-2.5 bg-[#E86A53] hover:bg-[#d65942] text-white font-black text-sm rounded-xl transition shadow-lg shadow-[#E86A53]/30 whitespace-nowrap"
          >
            {t.startFree}
          </Link>
        </div>
      </nav>

      {/* 🚀 القسم الرئيسي (Hero Section) مع موشن جرافيك وتطعيمات أخضر فاتح راقية */}
      <section className={`relative overflow-hidden py-16 lg:py-24 px-6 lg:px-16 border-b transition-colors ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        
        {/* 🎬 مؤثرات الموشن جرافيك في الخلفية (Motion Graphic Canvas) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* دوائر وتوهجات مدارية حية تنبض وتتمدد */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] sm:w-[900px] h-[650px] sm:h-[900px] rounded-full border border-[#E86A53]/15 animate-ping opacity-20" style={{ animationDuration: '6s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] sm:w-[600px] h-[420px] sm:h-[600px] rounded-full border border-emerald-400/20 animate-pulse" style={{ animationDuration: '4s' }} />
          
          {/* لمسة هالة خضراء فاتحة محيطية راقية في الخلفية */}
          <div className="absolute top-[20%] right-[15%] w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />
          <div className="absolute bottom-[10%] left-[15%] w-80 h-80 bg-teal-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s' }} />

          {/* التدرج اللوني المحيطي */}
          <div 
            className="absolute inset-0 opacity-60"
            style={{
              background: isDark
                ? `
                  radial-gradient(circle at 50% 45%, rgba(232, 106, 83, 0.25) 0%, transparent 65%),
                  radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.12) 0%, transparent 45%),
                  radial-gradient(circle at 85% 15%, rgba(14, 30, 56, 0.95) 0%, transparent 60%)
                `
                : `
                  radial-gradient(circle at 50% 45%, rgba(232, 106, 83, 0.18) 0%, transparent 65%),
                  radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.12) 0%, transparent 45%),
                  radial-gradient(circle at 85% 15%, rgba(247, 244, 236, 0.9) 0%, transparent 60%)
                `,
            }}
          />

          {/* أيقونات طافية تفاعلية مطعمة بالأخضر الفاتح الراقي */}
          <div className="hidden md:flex absolute top-16 right-[10%] animate-bounce items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-[#0E1E38]/90 backdrop-blur-md border border-emerald-400/40 shadow-xl shadow-emerald-500/10" style={{ animationDuration: '4.5s' }}>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div className="text-right">
              <span className="block text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">+99.4% نجاح التسليم</span>
              <span className="block text-[9px] text-slate-500">أعلى معدل COD مؤكد</span>
            </div>
          </div>

          <div className="hidden md:flex absolute bottom-20 left-[10%] animate-bounce items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-[#0E1E38]/90 backdrop-blur-md border border-emerald-400/30 shadow-xl shadow-emerald-500/10" style={{ animationDuration: '5.5s' }}>
            <span className="text-base">⚡</span>
            <div className="text-right">
              <span className="block text-xs font-black text-[#E86A53]">ربط CAPI فوري</span>
              <span className="block text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">بدون فقدان أي داتا</span>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto relative z-10 space-y-7 text-center">
          
          {/* شارة التوثيق الحية بالأخضر الفاتح الشيك */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-black backdrop-blur-sm shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{t.liveBadge}</span>
          </div>

          {/* اللوجو المركزي مع هالة ضوئية متوهجة */}
          <div className="flex justify-center">
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#E86A53] via-emerald-400 to-[#E86A53] rounded-full blur-2xl opacity-35 animate-pulse" />
              <img
                src={SPIKE_LOGO_URL}
                alt="SPIKE Logo"
                className="relative h-32 sm:h-44 w-auto object-contain rounded-3xl shadow-2xl transition-transform duration-500 hover:scale-110 cursor-pointer"
              />
            </div>
          </div>

          {/* كلمة SPIKE عملاقة بأنيميشن كتابة حي متبوعة بمؤشر ينبض */}
          <div className="w-full flex items-center justify-center my-1">
            <div className="relative inline-flex items-center justify-center">
              <h1 className="text-6xl sm:text-8xl lg:text-9xl font-black italic tracking-widest uppercase select-none transition-all duration-300 font-sans bg-gradient-to-r from-[#E86A53] via-orange-400 to-[#E86A53] bg-clip-text text-transparent drop-shadow-[0_12px_40px_rgba(232,106,83,0.40)]">
                {typedText}
              </h1>

              {!isTypingDone && (
                <span className="inline-block w-2.5 sm:w-4 h-14 sm:h-24 bg-[#E86A53] ml-2 animate-pulse rounded-full" />
              )}
            </div>
          </div>

          <p className={`text-lg sm:text-2xl font-medium max-w-3xl mx-auto leading-relaxed ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            {t.heroSubtitle}
          </p>

          {/* 🌟 أزرار الإجراء الضخمة والمطورة بدون صاروخ مع حواف وتأثير أخضر ناعم */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-10 sm:px-14 py-5 sm:py-6 bg-gradient-to-r from-[#E86A53] via-orange-500 to-[#E86A53] hover:from-[#d65942] hover:to-[#E86A53] text-white font-black text-lg sm:text-xl rounded-2xl transition-all duration-300 shadow-[0_15px_40px_rgba(232,106,83,0.50)] hover:shadow-[0_20px_50px_rgba(16,185,129,0.45)] hover:-translate-y-1 active:translate-y-0 text-center tracking-wide ring-1 ring-emerald-400/30"
            >
              {t.startFree}
            </Link>

            <Link
              href="/register"
              className={`w-full sm:w-auto px-10 sm:px-14 py-5 sm:py-6 border-3 font-black text-lg sm:text-xl rounded-2xl transition-all duration-300 hover:-translate-y-1 active:translate-y-0 text-center ${
                isDark 
                  ? 'border-white/30 hover:border-emerald-400 hover:bg-emerald-500/10 text-white' 
                  : 'border-[#0E1E38]/30 hover:border-emerald-600 hover:bg-emerald-50 text-[#0E1E38]'
              }`}
            >
              {t.login}
            </Link>
          </div>

          <p className={`text-xs sm:text-sm font-semibold pt-2 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {t.promoSubtext}
          </p>
        </div>
      </section>

      {/* 📦 قسم المميزات */}
      <section className={`py-24 px-6 lg:px-16 transition-colors ${
        isDark ? 'bg-[#0a1527]' : 'bg-[#fffdf9]'
      }`}>
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="space-y-2">
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight max-w-md">
              {t.sectionTitlePart1} <br />
              <span className="text-[#E86A53]">{t.sectionTitlePart2}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className={`rounded-3xl p-6 border flex flex-col justify-between space-y-6 transition-all duration-300 hover:shadow-2xl ${
              isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="bg-[#091222] rounded-2xl h-56 p-4 flex items-center justify-center relative overflow-hidden">
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="w-24 h-32 bg-[#E86A53]/20 border border-[#E86A53]/40 rounded-xl shadow-lg flex items-center justify-center text-3xl">
                    🛍️
                  </div>
                  <div className="absolute right-4 bottom-4 bg-emerald-500 text-white px-3 py-1 rounded-lg text-xs font-black shadow-md flex items-center gap-1">
                    <span className="text-[10px]">●</span>
                    <span>+150% طلبات</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black">{t.card1Title}</h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {t.card1Desc}
                </p>
              </div>
            </div>

            <div className={`rounded-3xl p-6 border flex flex-col justify-between space-y-6 transition-all duration-300 hover:shadow-2xl ${
              isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="bg-[#091222] rounded-2xl h-56 p-4 flex items-center justify-center relative overflow-hidden">
                <div className="bg-white text-[#0E1E38] rounded-2xl p-4 w-4/5 shadow-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-bold">شراء سريع (COD)</span>
                    <span className="text-emerald-500 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">✓ مؤكد بنجاح</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">{t.subtotal}</span>
                    <span className="font-black font-mono text-[#E86A53]">450 ج.م</span>
                  </div>
                  <div className="bg-[#E86A53] text-white text-center py-2.5 rounded-xl font-black text-xs">
                    تأكيد الأوردر الآن 🚚
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black">{t.card2Title}</h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {t.card2Desc}
                </p>
              </div>
            </div>

            <div className={`rounded-3xl p-6 border flex flex-col justify-between space-y-6 transition-all duration-300 hover:shadow-2xl ${
              isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="bg-[#091222] rounded-2xl h-56 p-4 flex items-center justify-center relative overflow-hidden">
                <div className="grid grid-cols-3 gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xs font-black shadow-md">Meta</div>
                  <div className="w-12 h-12 rounded-xl bg-black border border-slate-700 flex items-center justify-center text-white text-xs font-black shadow-md">TikTok</div>
                  <div className="w-12 h-12 rounded-xl bg-yellow-400 flex items-center justify-center text-black text-xs font-black shadow-md">Snap</div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black">{t.card3Title}</h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {t.card3Desc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🖤 الفوتر */}
      <footer className={`pt-16 pb-12 px-6 lg:px-16 border-t text-xs transition-colors ${
        isDark ? 'bg-[#091222] border-slate-800 text-slate-400' : 'bg-[#ede9dc] border-slate-300 text-slate-600'
      }`}>
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <SpikeBrandHeader height="h-11" showSlogan={true} />

            <div className="flex flex-wrap gap-6 text-xs font-bold">
              <Link href="#" className="hover:text-[#E86A53] transition">{t.terms}</Link>
              <Link href="#" className="hover:text-[#E86A53] transition">{t.legal}</Link>
              <Link href="#" className="hover:text-[#E86A53] transition">{t.privacy}</Link>
              <Link href="#" className="hover:text-[#E86A53] transition">{t.sitemap}</Link>
            </div>
          </div>

          <div className="border-t border-slate-700/40 pt-6 text-center text-[11px]">
            {t.rights}
          </div>
        </div>
      </footer>

    </div>
  );
}
