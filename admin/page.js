'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState('');

  // حقول بيانات المنتج
  const [productData, setProductData] = useState({
    product_name: '',
    product_price: '',
    original_price: '',
    shipping_fee: '',
    image_url: '',
    description: '',
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchSettings();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchSettings();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (data) {
      setProductData({
        product_name: data.product_name || '',
        product_price: data.product_price || '',
        original_price: data.original_price || '',
        shipping_fee: data.shipping_fee || '',
        image_url: data.image_url || '',
        description: data.description || '',
      });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage('بيانات الدخول غير صحيحة');
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setMessage('');

    const { error } = await supabase
      .from('store_settings')
      .upsert({
        id: 1,
        product_name: productData.product_name,
        product_price: Number(productData.product_price),
        original_price: Number(productData.original_price),
        shipping_fee: Number(productData.shipping_fee),
        image_url: productData.image_url,
        description: productData.description,
        updated_at: new Date(),
      });

    if (error) {
      setMessage('حدث خطأ أثناء الحفظ: ' + error.message);
    } else {
      setMessage('✅ تم حفظ التعديلات بنجاح وتحديث المتجر!');
    }
    setSaveLoading(false);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white" dir="rtl">
        <form onSubmit={handleLogin} className="bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-700">
          <h1 className="text-2xl font-bold mb-6 text-center text-emerald-400">لوحة تحكم المتجر</h1>
          {message && <div className="p-3 mb-4 bg-red-500/20 text-red-300 rounded-lg text-sm text-center">{message}</div>}
          <div className="mb-4">
            <label className="block mb-2 text-sm text-slate-300">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-700 border border-slate-600 focus:outline-none focus:border-emerald-400 text-white"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block mb-2 text-sm text-slate-300">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-700 border border-slate-600 focus:outline-none focus:border-emerald-400 text-white"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold text-white transition disabled:opacity-50"
          >
            {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
          <h1 className="text-2xl font-bold text-emerald-400">إدارة المنتج والعروض</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 text-sm"
          >
            تسجيل الخروج
          </button>
        </div>

        {message && (
          <div className={`p-4 mb-6 rounded-xl text-center text-sm font-semibold ${
            message.includes('✅') ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-5">
          <div>
            <label className="block mb-2 text-sm text-slate-300">اسم المنتج</label>
            <input
              type="text"
              value={productData.product_name}
              onChange={(e) => setProductData({ ...productData, product_name: e.target.value })}
              className="w-full p-3 rounded-xl bg-slate-700 border border-slate-600 focus:outline-none focus:border-emerald-400"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-2 text-sm text-slate-300">سعر البيع (ج.م)</label>
              <input
                type="number"
                value={productData.product_price}
                onChange={(e) => setProductData({ ...productData, product_price: e.target.value })}
                className="w-full p-3 rounded-xl bg-slate-700 border border-slate-600 focus:outline-none focus:border-emerald-400"
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-sm text-slate-300">السعر قبل الخصم (اختياري)</label>
              <input
                type="number"
                value={productData.original_price}
                onChange={(e) => setProductData({ ...productData, original_price: e.target.value })}
                className="w-full p-3 rounded-xl bg-slate-700 border border-slate-600 focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm text-slate-300">مصاريف الشحن (ج.م)</label>
              <input
                type="number"
                value={productData.shipping_fee}
                onChange={(e) => setProductData({ ...productData, shipping_fee: e.target.value })}
                className="w-full p-3 rounded-xl bg-slate-700 border border-slate-600 focus:outline-none focus:border-emerald-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm text-slate-300">رابط صورة المنتج</label>
            <input
              type="url"
              value={productData.image_url}
              onChange={(e) => setProductData({ ...productData, image_url: e.target.value })}
              className="w-full p-3 rounded-xl bg-slate-700 border border-slate-600 focus:outline-none focus:border-emerald-400"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm text-slate-300">وصف ومميزات المنتج</label>
            <textarea
              rows="4"
              value={productData.description}
              onChange={(e) => setProductData({ ...productData, description: e.target.value })}
              className="w-full p-3 rounded-xl bg-slate-700 border border-slate-600 focus:outline-none focus:border-emerald-400"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={saveLoading}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold text-white transition text-lg disabled:opacity-50"
          >
            {saveLoading ? 'جاري الحفظ...' : 'حفظ التعديلات في الموقع 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}
