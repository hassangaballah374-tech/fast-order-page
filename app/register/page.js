'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { SPIKE_LOGO_URL } from '../../components/SpikeBrandHeader';

export default function SpikeRegisterAndAuthPage() {
  const router = useRouter();

  const [isLoginMode, setIsLoginMode] = useState(false);
  const [showTopBanner, setShowTopBanner] = useState(true);
  const [loading, setLoading] = useState(false);

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
        // تسجيل الدخول
        if (!formData.email || !formData.password) {
          alert('يرجى كتابة البريد الإلكتروني وكلمة المرور');
          setLoading(false);
          return;
        }

        // محاولة جلب التاجر من Supabase
        const { data: store } = await supabase
          .from('store_profiles')
          .select('*')
          .eq('owner_name', formData.fullName || formData.email)
          .maybeSingle();

        const uid = store?.user_id || 'merchant_' + Date.now();
        localStorage.setItem('merchant_user_id', uid);
        localStorage.setItem('is_super_admin', 'false');

        alert('✅ تم تسجيل الدخول بنجاح! جاري توجيهك للوحة التحكم...');
        router.push('/dashboard');
      } else {
        // إنشاء حساب جديد
        if (!formData.storeSlug || !formData.fullName || !formData.phone || !formData.email || !formData.password) {
          alert('يرجى ملء كافة الحقول المطلوبة');
          setLoading(false);
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          alert('كلمتا المرور غير متطابقتين!');
          setLoading(false);
          return;
        }

        const cleanSlug = formData.storeSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
        const generatedUid = 'usr_' + Date.now().toString(36);

        // إنشاء بروفايل المتجر في Supabase مع رصيد تجريبي
        await supabase.from('store_profiles').insert([{
          user_id: generatedUid,
          store_name: formData.storeSlug,
          store_slug: cleanSlug,
          owner_name: formData.fullName,
          phone: '+20' + formData.phone.replace(/^0+/, ''),
          wallet_balance_usd: 5.0, // رصيد تجريبي افتراضي
          is_active: true,
          subscription_status: 'active',
          plan_type: 'starter',
        }]);

        // إعدادات المتجر الأولية
        await supabase.from('merchant_settings').insert([{
          user_id: generatedUid,
          store_name: formData.storeSlug,
          owner_name: formData.fullName,
          store_email: formData.email,
          support_phone: '+20' + formData.phone.replace(/^0+/, ''),
          about_us: 'متجر معتمد يوفر أفضل المنتجات مع ضمان المعاينة قبل الاستلام.',
        }]);

        localStorage.setItem('merchant_user_id', generatedUid);
        localStorage.setItem('is_super_admin', 'false');

        alert(`🎉 مرحباً بك في سبايك! تم إنشاء متجرك (${cleanSlug}.spike.shop) بنجاح.`);
        router.push('/dashboard');
      }
    } catch (err) {
      alert('حدث خطأ: ' + (err.message || 'تعذر الاتصال بالسيرفر'));
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1E293B] font-sans flex flex-col justify-between selection:bg-emerald-500 selection:text-white" dir="rtl">

      {/* 🟢 1. الشريط العلوي الترويجي الأخضر */}
      {showTopBanner && (
        <div className="bg-[#00B050] text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between transition-all duration-300">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTopBanner(false)}
              className="text-white/80 hover:text-white text-base leading-none cursor-pointer"
            >
              ✕
            </button>
            <Link
              href="/"
              className="bg-white text-[#00B050] hover:bg-slate-100 px-3 py-1 rounded-md font-black text-[11px] shadow-sm transition"
            >
              زيارة موقع مصر
            </Link>
          </div>

          <div className="text-center sm:text-right hidden sm:block">
            <span>لدينا نسخة مخصصة لـ مصر • </span>
            <span className="font-normal opacity-90">ننصح بالانتقال إلى الموقع المخصص لبلدك للحصول على أفضل تجربة وسرعة شحن.</span>
          </div>
        </div>
      )}

      {/* 🧭 2. النافبار الأبيض المتناسق */}
      <header className="bg-white border-b border-slate-200/80 px-6 lg:px-14 py-3.5 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* الجانب الأيمن: اللوجو والروابط الرئيسية */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <img
                src={SPIKE_LOGO_URL}
                alt="SPIKE | سبايك"
                className="h-10 w-auto object-contain rounded-lg"
              />
              <span className="text-xl font-black tracking-tight text-[#0E1E38]">
                سبايك
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-700">
              <Link href="/" className="hover:text-[#00B050] transition">الرئيسية</Link>
              <button className="hover:text-[#00B050] transition cursor-pointer">الكورسات</button>
              <Link href="/#pricing" className="hover:text-[#00B050] transition">الأسعار</Link>
            </nav>
          </div>

          {/* الجانب الأيسر: محدد الدولة/اللغة وأزرار الإجراء */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 border border-slate-200 bg-slate-50 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 cursor-pointer">
              <span>🌐</span>
              <span>عالمي • AR</span>
              <span className="text-[10px] text-slate-400">▼</span>
            </div>

            <button
              onClick={() => setIsLoginMode(false)}
              className="bg-[#00B050] hover:bg-[#009644] text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm transition whitespace-nowrap cursor-pointer"
            >
              اشترك مجاناً الآن
            </button>

            <button
              onClick={() => setIsLoginMode(true)}
              className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              title="تسجيل الدخول"
            >
              👤
            </button>
          </div>
        </div>
      </header>

      {/* 📝 3. البطاقة المركزية لإنشاء الحساب والتسجيل */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 my-6">
        
        {/* رأس النموذج: الشعار والعنوان */}
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
            {isLoginMode ? 'تسجيل الدخول إلى حسابك' : 'انشئ حساب مجاني'}
          </h2>
        </div>

        {/* جسم الفورم الأبيض المنسق */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 max-w-lg w-full shadow-sm space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-slate-700">
            
            {!isLoginMode && (
              <>
                {/* 1. اسم الموقع / المتجر */}
                <div className="space-y-1.5">
                  <label className="block text-slate-600">اسم موقعك</label>
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

                {/* 2. اختيار العملة */}
                <div className="space-y-1.5">
                  <label className="block text-slate-600">العملة الأساسية</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-[#00B050] transition text-xs font-bold"
                  >
                    <option value="USD">دولار أمريكي - USD</option>
                    <option value="EGP">جنيه مصري - EGP</option>
                    <option value="SAR">ريال سعودي - SAR</option>
                    <option value="AED">درهم إماراتي - AED</option>
                  </select>
                </div>

                {/* 3. اسمك واسم العائلة */}
                <div className="space-y-1.5">
                  <label className="block text-slate-600">اسمك واسم العائلة</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أحمد محمد"
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:border-[#00B050] transition text-xs shadow-2xs"
                  />
                </div>

                {/* 4. رقم الهاتف مع مفتاح مصر */}
                <div className="space-y-1.5">
                  <label className="block text-slate-600">رقم الهاتف</label>
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

            {/* 5. البريد الإلكتروني */}
            <div className="space-y-1.5">
              <label className="block text-slate-600">البريد الالكتروني</label>
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

            {/* 6. الرقم السري */}
            <div className="space-y-1.5">
              <label className="block text-slate-600">الرقم السري</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:border-[#00B050] transition text-xs shadow-2xs"
              />
            </div>

            {/* 7. تأكيد الرقم السري (في حالة إنشاء الحساب فقط) */}
            {!isLoginMode && (
              <div className="space-y-1.5">
                <label className="block text-slate-600">اعد كتابة الرقم السري</label>
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

            {/* أزرار الإجراء */}
            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#00B050] hover:bg-[#009644] text-white rounded-xl text-sm font-black transition shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>جاري المعالجة...</span>
                ) : isLoginMode ? (
                  <span>تسجيل الدخول</span>
                ) : (
                  <span>انشاء حساب</span>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-slate-500 block mb-2 font-normal">
                  {isLoginMode ? 'ليس لديك حساب بعد؟' : 'لديك حساب بالفعل؟'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsLoginMode(!isLoginMode)}
                  className="w-full py-2.5 border border-[#00B050] text-[#00B050] hover:bg-[#00B050]/5 rounded-xl text-xs font-black transition cursor-pointer"
                >
                  {isLoginMode ? 'انشئ حساب مجاني جديد' : 'تسجيل الدخول'}
                </button>
              </div>
            </div>

          </form>
        </div>
      </main>

      {/* 🖤 4. الفوتر الداكن الاحترافي المطابق للصورة */}
      <footer className="bg-[#191919] text-white pt-12 pb-8 px-6 lg:px-16 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto space-y-10">
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-start">
            
            {/* العمود 1: عن سبايك */}
            <div className="space-y-2.5">
              <h4 className="font-black text-sm text-white">عن سبايك</h4>
              <ul className="space-y-2 text-slate-400 font-normal">
                <li><Link href="/" className="hover:text-white transition">من نحن</Link></li>
                <li><Link href="/#contact" className="hover:text-white transition">اتصل بنا</Link></li>
                <li><Link href="/" className="hover:text-white transition">سياسة الاستخدام</Link></li>
                <li><Link href="/" className="hover:text-white transition">سياسة الخصوصية</Link></li>
                <li><Link href="/" className="hover:text-white transition">الرئيسية</Link></li>
                <li><Link href="/#pricing" className="hover:text-white transition">الأسعار</Link></li>
              </ul>
            </div>

            {/* العمود 2: الأكاديمية */}
            <div className="space-y-2.5">
              <h4 className="font-black text-sm text-white">الأكاديمية</h4>
              <ul className="space-y-2 text-slate-400 font-normal">
                <li><button className="hover:text-white transition cursor-pointer">الكورسات</button></li>
                <li><button className="hover:text-white transition cursor-pointer">كورسات متقدمة</button></li>
                <li><button className="hover:text-white transition cursor-pointer">شروحات الـ COD</button></li>
              </ul>
            </div>

            {/* العمود 3: للمطورين */}
            <div className="space-y-2.5">
              <h4 className="font-black text-sm text-white">للمطورين</h4>
              <ul className="space-y-2 text-slate-400 font-normal font-mono text-[11px]">
                <li><span className="hover:text-white cursor-pointer">Public API</span></li>
                <li><span className="hover:text-white cursor-pointer">Themes Docs</span></li>
                <li><span className="hover:text-white cursor-pointer">Funnels Docs</span></li>
                <li><span className="hover:text-white cursor-pointer">Webhooks</span></li>
              </ul>
            </div>

            {/* العمود 4: حمّل التطبيق */}
            <div className="space-y-3">
              <h4 className="font-black text-sm text-white">حمّل التطبيق</h4>
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

            {/* العمود 5: هوية الشركة وسوشيال ميديا */}
            <div className="space-y-4 md:text-left">
              <div className="flex items-center gap-2 md:justify-end">
                <img src={SPIKE_LOGO_URL} alt="SPIKE" className="h-9 w-auto object-contain rounded" />
                <span className="text-base font-black">إحدى منصات سبايك للتجارة</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed md:text-left">
                حلّق بتجارتك الإلكترونية بمعدل يصل إلى 200% عن منافسيك، منظومة سبايك تفهم متطلباتك وسلوك عملائك.
              </p>
              <div className="flex items-center gap-2 md:justify-end flex-wrap pt-1 text-slate-300">
                <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-[#00B050] transition">📷</span>
                <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-[#00B050] transition">🎵</span>
                <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-[#00B050] transition">▶️</span>
                <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-[#00B050] transition">💬</span>
                <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-[#00B050] transition">📘</span>
                <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-[#00B050] transition">✈️</span>
              </div>
            </div>

          </div>

          {/* شريط الدول وحقوق الملكية السفلي */}
          <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-slate-500 text-[11px]">
            <div>
              Copyright © SPIKE | 2026
            </div>
            <div className="flex items-center gap-3 font-bold text-slate-400">
              <span className="text-white">مصر EG</span>
              <span>•</span>
              <span>المغرب MA</span>
              <span>•</span>
              <span>الجزائر DZ</span>
              <span>•</span>
              <span>السعودية SA</span>
            </div>
          </div>

        </div>
      </footer>

      {/* 🟢 زر واتساب العائم الأخضر في أسفل الشاشة */}
      <a
        href="https://wa.me/201000000000"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-50 w-13 h-13 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center text-2xl shadow-xl transition-transform hover:scale-110 active:scale-95 cursor-pointer shadow-emerald-500/30"
        title="تواصل معنا عبر واتساب"
      >
        💬
      </a>

    </div>
  );
}
