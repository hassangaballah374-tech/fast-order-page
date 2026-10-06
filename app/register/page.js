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
      // 1. إنشاء حساب المستخدم في نظام Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // 2. تسجيل ملف المتجر الجديد بحالة انتظار التفعيل (is_active = false)
      const { error: profileError } = await supabase.from('store_profiles').insert([
        {
          user_id: authData.user?.id,
          store_name: formData.storeName,
          store_slug: formData.storeSlug.trim().toLowerCase().replace(/\s+/g, '-'),
          owner_name: formData.ownerName,
          phone: formData.phone,
          is_active: false,
          amount_paid: 0,
        },
      ]);

      if (profileError) throw profileError;

      alert('🎉 تم إنشاء متجرك بنجاح! متجرك الآن بانتظار التفعيل بعد سداد الاشتراك.');
      router.push('/admin');
    } catch (err) {
      setErrorMsg(err.message || 'حدث خطأ أثناء التسجيل');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <span className="text-4xl">🚀</span>
          <h1 className="text-2xl font-black">إنشاء متجر إلكتروني جديد</h1>
          <p className="text-xs text-slate-400">انضم للمنصة وأنشئ متجرك المخصص في ثوانٍ</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl text-xs font-bold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-300 mb-1">اسم المتجر *</label>
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
            <label className="block font-bold text-slate-300 mb-1">رابط المتجر بالإنجليزية (Slug) *</label>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">اسمك بالكامل *</label>
              <input
                type="text"
                required
                placeholder="محمد أحمد"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 mb-1">رقم الهاتف (واتساب) *</label>
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

          <div>
            <label className="block font-bold text-slate-300 mb-1">البريد الإلكتروني *</label>
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
            <label className="block font-bold text-slate-300 mb-1">كلمة المرور *</label>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-xl transition hover:scale-105 active:scale-95 disabled:opacity-50 mt-2"
          >
            {loading ? 'جاري تجهيز المتجر...' : 'إنشاء المتجر والبدء 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}
