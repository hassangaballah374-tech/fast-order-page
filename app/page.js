'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '../context/AppContext';

export default function SpikeLandingPage() {
  const { lang, theme, toggleLanguage, toggleTheme } = useApp();
  const isDark = theme === 'dark';

  const t = {
    ar: {
      brandName: 'سبايك | SPIKE',
      brandSlogan: 'ابنِ متجرك.. وضاعف طلباتك',
      whySpike: 'لماذا سبايك؟',
      features: 'المميزات',
      pricing: 'الباقات والأسعار',
      enterprise: 'كبار التجار',
      login: 'تسجيل الدخول',
      startFree: 'ابدأ مجاناً',
      heroTitle: 'ابنِ متجرك.. وضاعف طلباتك',
      heroSubtitle: 'المنظومة الأقوى لإدارة المتاجر الإلكترونية، الشحن، وتحصيل الدفع عند الاستلام بأعلى معدلات تأكيد وتسليم.',
      promoSubtext: 'ابدأ فترتك التجريبية مجاناً الآن بدون أي بطاقة بنكية.',
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
      brandSlogan: 'Build your store.. Double your orders',
      whySpike: 'Why SPIKE?',
      features: 'Features',
      pricing: 'Pricing',
      enterprise: 'Enterprise',
      login: 'Log in',
      startFree: 'Start Free',
      heroTitle: 'Build your store.. Double your orders',
      heroSubtitle: 'The ultimate eCommerce platform built for Cash on Delivery, inventory scaling, and highest delivery rates.',
      promoSubtext: 'Start your free trial today. No credit card required.',
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
      
      {/* 🧭 1. الترويسة العلوية (Navbar) */}
      <nav className={`sticky top-0 z-50 border-b px-6 lg:px-14 py-3.5 flex items-center justify-between backdrop-blur-md transition-colors ${
        isDark ? 'bg-[#0E1E38]/90 border-slate-800' : 'bg-[#F7F4EC]/90 border-slate-200/80 shadow-sm'
      }`}>
        
        {/* اللوجو واسم المتجر */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3">
            {/* أيقونة الأسهم المستوحاة من لوجو سبايك */}
            <div className="w-10 h-10 rounded-2xl bg-[#E86A53] flex items-center justify-center p-2 shadow-lg shadow-[#E86A53]/30">
              <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-white stroke-current stroke-[8] stroke-linecap-round stroke-linejoin-round">
                <path d="M50 20 L50 45" />
                <path d="M50 80 L50 55" />
                <path d="M20 50 L45 50" />
                <path d="M80 50 L55 50" />
                <path d="M28 28 L45 45" />
                <path d="M72 72 L55 55" />
                <path d="M72 28 L55 45" />
                <path d="M28 72 L45 55" />
                <circle cx="50" cy="50" r="10" fill="currentColor" />
              </svg>
            </div>
            <div>
              <span className={`text-2xl font-black tracking-tight block leading-tight ${isDark ? 'text-white' : 'text-[#0E1E38]'}`}>
                سبايك | SPIKE
              </span>
              <span className="text-[10px] text-[#E86A53] font-bold block">
                {t.brandSlogan}
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-6 text-sm font-bold">
            <button className="hover:text-[#E86A53] transition cursor-pointer">{t.whySpike}</button>
            <button className="hover:text-[#E86A53] transition cursor-pointer">{t.features}</button>
            <Link href="#pricing" className="hover:text-[#E86A53] transition">{t.pricing}</Link>
            <Link href="#enterprise" className="hover:text-[#E86A53] transition">{t.enterprise}</Link>
          </div>
        </div>

        {/* أدوات التحكم (لغة + مود + أزرار) */}
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

      {/* 🚀 2. القسم الرئيسي (Hero Section) */}
      <section className={`relative overflow-hidden py-24 lg:py-36 px-6 lg:px-16 border-b transition-colors ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        {/* التدرج اللوني اللطيف المشتق من ألوان اللوجو */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background: isDark
              ? `
                radial-gradient(circle at 15% 85%, rgba(232, 106, 83, 0.25) 0%, transparent 50%),
                radial-gradient(circle at 85% 15%, rgba(14, 30, 56, 0.9) 0%, transparent 60%)
              `
              : `
                radial-gradient(circle at 15% 85%, rgba(232, 106, 83, 0.20) 0%, transparent 50%),
                radial-gradient(circle at 85% 15%, rgba(247, 244, 236, 0.8) 0%, transparent 60%)
              `,
          }}
        />

        <div className="max-w-4xl mx-auto relative z-10 space-y-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E86A53]/10 border border-[#E86A53]/30 text-[#E86A53] text-xs font-black">
            <span>🔥</span>
            <span>{t.brandSlogan}</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.15]">
            {t.heroTitle}
          </h1>

          <p className={`text-lg sm:text-xl font-medium max-w-2xl mx-auto leading-relaxed ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            {t.heroSubtitle}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="px-8 py-3.5 bg-[#E86A53] hover:bg-[#d65942] text-white font-black text-sm rounded-xl transition shadow-xl shadow-[#E86A53]/30"
            >
              {t.startFree}
            </Link>
            <Link
              href="/register"
              className={`px-8 py-3.5 border-2 font-bold text-sm rounded-xl transition ${
                isDark 
                  ? 'border-white/20 hover:bg-white/10 text-white' 
                  : 'border-[#0E1E38]/20 hover:bg-[#0E1E38]/5 text-[#0E1E38]'
              }`}
            >
              {t.login}
            </Link>
          </div>

          <p className={`text-xs font-medium pt-2 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {t.promoSubtext}
          </p>
        </div>
      </section>

      {/* 📦 3. قسم المميزات (Take your store to the next level) */}
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
            
            {/* كارت 1 */}
            <div className={`rounded-3xl p-6 border flex flex-col justify-between space-y-6 transition-all duration-300 hover:shadow-2xl ${
              isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="bg-[#091222] rounded-2xl h-56 p-4 flex items-center justify-center relative overflow-hidden">
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="w-24 h-32 bg-[#E86A53]/20 border border-[#E86A53]/40 rounded-xl shadow-lg flex items-center justify-center text-3xl">
                    🛍️
                  </div>
                  <div className="absolute right-4 bottom-4 bg-[#E86A53] text-white px-3 py-1 rounded-lg text-xs font-black shadow-md">
                    +150% طلبات
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

            {/* كارت 2 */}
            <div className={`rounded-3xl p-6 border flex flex-col justify-between space-y-6 transition-all duration-300 hover:shadow-2xl ${
              isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="bg-[#091222] rounded-2xl h-56 p-4 flex items-center justify-center relative overflow-hidden">
                <div className="bg-white text-[#0E1E38] rounded-2xl p-4 w-4/5 shadow-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-bold">شراء سريع (COD)</span>
                    <span className="text-emerald-600 font-bold">✓ مؤكد</span>
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

            {/* كارت 3 */}
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

      {/* 🖤 4. الفوتر المتناسق مع ألوان سبايك */}
      <footer className={`pt-16 pb-12 px-6 lg:px-16 border-t text-xs transition-colors ${
        isDark ? 'bg-[#091222] border-slate-800 text-slate-400' : 'bg-[#ede9dc] border-slate-300 text-slate-600'
      }`}>
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <span className="text-xl font-black text-[#E86A53] block">
                سبايك | SPIKE
              </span>
              <p className="text-xs font-bold mt-1">
                {t.brandSlogan}
              </p>
            </div>

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
