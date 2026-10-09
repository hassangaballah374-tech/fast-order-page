'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { SPIKE_LOGO_URL } from '../../components/SpikeBrandHeader';

export default function SpikeAdminDashboard() {
  const { lang, theme, toggleLanguage, toggleTheme, isDark, isMobileView, toggleMobileView } = useApp();
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState('overview');

  // قائمة التنقل الجانبية مع الشارات والعدادات
  const navItems = [
    { id: 'overview', title: 'الرئيسية والمؤشرات', icon: '📊', count: null },
    { id: 'merchants', title: 'المتاجر والتجار', icon: '🏬', count: 1 },
    { id: 'orders', title: 'كافة الطلبات', icon: '📦', count: 0 },
    { id: 'inventory', title: 'المنتجات والمخزون', icon: '🏷️', count: 3 },
    { id: 'policies', title: 'سياسات سبايك', icon: '📜', count: null },
    { id: 'rates', title: 'سعر الصرف والعمولة', icon: '💱', count: null },
    { id: 'domains', title: 'الدومينات والربط', icon: '🌐', count: 0 },
    { id: 'plans', title: 'باقات الاشتراك', icon: '💎', count: null },
    { id: 'audit', title: 'سجل الحركات', icon: '📑', count: null },
    { id: 'broadcast', title: 'الإعلانات الجماعية', icon: '📢', count: null },
  ];

  // بطاقات المؤشرات الأساسية (KPIs) مع خطوط بيانية ومقارنات حية
  const stats = [
    {
      title: 'إجمالي المتاجر',
      value: '1',
      change: '+100%',
      icon: '🏬',
      badgeColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      desc1: 'مقارنة بالشهر الماضي',
      desc2: 'إجمالي المتحصلات'
    },
    {
      title: 'بانتظار الشحن',
      value: '0',
      change: '0 أوردر',
      icon: '⏳',
      badgeColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      desc1: 'تحت التجهيز',
      desc2: 'تحت التجهيز'
    },
    {
      title: 'العملاء المفعلين',
      value: '1',
      change: '100% نشط',
      icon: '🟢',
      badgeColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      desc1: 'معدل التفعيل',
      desc2: 'معدل التفعيل'
    },
    {
      title: 'إجمالي المبيعات',
      value: '0.00 ج.م',
      change: '0.00%',
      icon: '💰',
      badgeColor: 'text-[#E86A53] bg-[#E86A53]/10 border-[#E86A53]/20',
      desc1: 'مقارنة بالشهر الماضي',
      desc2: 'إجمالي المتحصلات'
    }
  ];

  return (
    <div className={`min-h-screen font-sans flex transition-colors duration-200 ${
      isDark ? 'bg-[#0B132B] text-slate-100' : 'bg-[#F4F6F9] text-slate-800'
    }`} dir="rtl">

      {/* 📊 منطقة المحتوى الرئيسية (اليسار في RTL) */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* الهيدر العلوي: يحتوي على الأزرار ونظرة عامة */}
        <header className={`px-8 py-6 border-b flex items-center justify-between backdrop-blur-md sticky top-0 z-30 transition-colors ${
          isDark ? 'bg-[#0B132B]/90 border-slate-800' : 'bg-[#F4F6F9]/95 border-slate-200/80 shadow-xs'
        }`}>
          {/* الجانب الأيمن: أزرار الإجراء السريعة */}
          <div className="flex items-center gap-3">
            <button className="px-5 py-2.5 rounded-xl bg-[#00B050] hover:bg-[#009644] text-white text-xs font-black shadow-sm transition cursor-pointer flex items-center gap-2">
              <span>+</span>
              <span>إضافة متجر جديد</span>
            </button>
            <button className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              isDark ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs'
            }`}>
              <span>🔄</span>
              <span>تحديث البيانات</span>
            </button>
          </div>

          {/* الجانب الأيسر: نظرة عامة على أداء منصة سبايك */}
          <div className="text-left">
            <div className="flex items-center gap-3 justify-end">
              <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                نظرة عامة على أداء منصة سبايك
              </span>
              <span className="text-lg text-slate-400 bg-slate-200/50 dark:bg-slate-800 px-3 py-1 rounded-lg font-bold">
                داشبورد
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">مؤشرات الأداء اللحظية، طلبات المتاجر، والتسويات المالية</p>
          </div>
        </header>

        {/* شبكة بطاقات الإحصائيات (Stat Grid) */}
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {stats.map((stat, i) => (
              <div
                key={i}
                className={`p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg flex flex-col justify-between ${
                  isDark 
                    ? 'bg-[#0E1E38] border-slate-800 hover:border-slate-700' 
                    : 'bg-white border-slate-200/80 shadow-xs hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md border ${stat.badgeColor}`}>
                    {stat.change}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-400">{stat.title}</span>
                    <span className="text-base">{stat.icon}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <span className="text-2xl font-black font-mono tracking-tight block">
                    {stat.value}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-medium">
                    {stat.desc1}
                  </span>
                </div>

                {/* الخط البياني المصغر للتصميم الاحترافي */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-medium">
                  <span>{stat.desc2}</span>
                  <div className="w-24 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: stat.value === '0' || stat.value.includes('0.00') ? '10%' : '75%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* مساحة العمل السفلية للمخططات */}
          <div className={`p-10 rounded-3xl border text-center py-16 space-y-3 ${
            isDark ? 'bg-[#0E1E38]/50 border-slate-800/80' : 'bg-white border-slate-200/80 shadow-xs'
          }`}>
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#E86A53]/10 text-[#E86A53] flex items-center justify-center text-2xl">
              📈
            </div>
            <h3 className="font-bold text-sm">مخططات العمليات والمبيعات اللحظية</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              مخططات الاداء والمبيعات اللحظية
            </p>
          </div>
        </div>

      </main>

      {/* 🚀 القائمة الجانبية العالمية (اليمين في RTL) */}
      <aside className={`w-72 shrink-0 border-r flex flex-col justify-between transition-colors duration-200 select-none ${
        isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-[#0E1E38] border-slate-800'
      }`}>
        
        {/* رأس القائمة الجانبية */}
        <div className="p-5 border-b border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20">
              Admin
            </span>
            <Link href="/" className="flex items-center gap-2.5 justify-end">
              <div>
                <div className="flex items-center gap-1.5 font-black text-lg leading-tight tracking-tight text-white">
                  <span>سبايك</span>
                  <span className="text-slate-500 font-light">|</span>
                  <span className="font-mono text-xs tracking-wider text-[#E86A53]">SPIKE</span>
                </div>
                <span className="text-[10px] text-slate-400 block font-medium">ابن متجرك.. وضاعف طلباتك</span>
              </div>
              <img
                src={SPIKE_LOGO_URL}
                alt="SPIKE"
                className="h-9 w-auto object-contain rounded-xl shadow-xs"
              />
            </Link>
          </div>

          {/* 🎛️ شريط أدوات التحكم الاحترافي (Segmented Control Bar) */}
          <div className="p-1 rounded-xl flex items-center gap-1 border border-slate-800 bg-slate-900/60">
            {/* زر تبديل وضع الموبايل */}
            <button
              onClick={toggleMobileView}
              className={`py-1.5 px-2.5 rounded-lg text-xs transition flex items-center justify-center cursor-pointer ${
                isMobileView 
                  ? 'bg-[#00B050] text-white shadow-xs' 
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
              title={isMobileView ? 'شاشة كاملة' : 'محاكاة الموبايل'}
            >
              <span>موبايل 📱</span>
            </button>

            {/* زر المظهر (Dark / Light) */}
            <button
              onClick={toggleTheme}
              className="flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-800 text-amber-300"
              title={isDark ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي'}
            >
              <span>🌙 ليلى</span>
            </button>

            {/* زر اللغة المدمج */}
            <button
              onClick={toggleLanguage}
              className="flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-800 text-slate-200"
              title="تغيير اللغة"
            >
              <span>🌐 EN</span>
            </button>
          </div>
        </div>

        {/* روابط التنقل في السايد بار */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-l from-[#E86A53] to-orange-500 text-white shadow-md shadow-[#E86A53]/25 font-black'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.title}</span>
                </div>

                {item.count !== null && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* تذييل السايد بار */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <Link href="/register" className="text-slate-400 hover:text-rose-500 text-xs transition" title="تسجيل الخروج">
            🚪
          </Link>
          <div className="flex items-center gap-2.5 text-right">
            <div className="leading-tight">
              <span className="text-xs font-bold block text-white">مدير النظام</span>
              <span className="text-[10px] text-slate-400 block">admin@spike.shop</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#E86A53] to-orange-400 flex items-center justify-center text-white text-xs font-black shadow-xs">
              S
            </div>
          </div>
        </div>
      </aside>

    </div>
  );
}
