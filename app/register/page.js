'use client';
import { useState } from 'react';
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
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. إنشاء الحساب في Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: formData.ownerName },
        },
      });

      if (authError) throw authError;

      // 2. ضبط رابط المتجر تلقائياً
      const slug = formData.storeSlug
        ? formData.storeSlug.trim().toLowerCase().replace(/\s+/g, '-')
        : formData.storeName.trim().toLowerCase().replace(/\s+/g, '-');

      // 3. حفظ بيانات التاجر في جدول المشتركين
      const { error: profileError } = await supabase.from('store_profiles').insert([
        {
          user_id: authData?.user?.id,
          store_name: formData.storeName,
          store_slug: slug,
          owner_name: formData.ownerName,
          phone: formData.phone,
          governorate: formData.governorate,
          address: formData.address,
          is_active: false, // متوقف بانتظار تأكيدك واستلام الرسوم
          amount_paid: 0,
        },
      ]);

      if (profileError) throw profileError;

      alert('🎉 تم تسجيل بيانات متجرك بنجاح! متجرك الآن قيد المراجعة بانتظار التفعيل.');
      router.push('/admin');
    } catch (err) {
      setErrorMsg(err.message || 'حدث خطأ أثناء التسجيل، تأكد من صحة البريد وكلمة المرور');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 sm:p-6 font-sans select-none" dir="rtl">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-6 shadow-2xl">
        
        <div className="text-center space-y-2">
          <span className="text-4xl block">🏪</span>
          <h1 className="text-2xl sm:text-3xl font-black">فتح متجر إلكتروني جديد</h1>
          <p className="text-xs sm:text-sm text-slate-400">سجل بيانات متجرك الآن وانضم للمنصة</p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-red-500/20 border border-red-500/40 text-red-300 rounded-2xl text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

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
              <label className="block font-bold text-slate-300 mb-1.5">اسم التاجر بالكامل *</label>
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
                placeholder="المدينة / الشارع"
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
            {loading ? 'جاري إنشاء المتجر...' : 'إنشاء المتجر وبدء الاشتراك 🚀'}
          </button>
        </form>

      </div>
    </div>
  );
}
