'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [message, setMessage] = useState('');

  const [productData, setProductData] = useState({
    product_name: '',
    product_price: '',
    original_price: '',
    shipping_fee: '',
    image_url: '',
    video_url: '',
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
    const { data } = await supabase
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
        video_url: data.video_url || '',
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

  // دالة رفع الصور من الجهاز
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setMessage('');
    const fileExt = file.name.split('.').pop();
    const fileName = `img_${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, file);

    if (uploadError) {
      setMessage('فشل رفع الصورة: ' + uploadError.message);
    } else {
      const { data } = supabase.storage.from('products').getPublicUrl(filePath);
      setProductData((prev) => ({ ...prev, image_url: data.publicUrl }));
      setMessage('✅ تم رفع الصورة بنجاح!');
    }
    setUploadingImage(false);
  };

  // دالة رفع الفيديو من الجهاز
  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingVideo(true);
    setMessage('');
    const fileExt = file.name.split('.').pop();
    const fileName = `vid_${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, file);

    if (uploadError) {
      setMessage('فشل رفع الفيديو: ' + uploadError.message);
    } else {
      const { data } = supabase.storage.from('products').getPublicUrl(filePath);
      setProductData((prev) => ({ ...prev, video_url: data.publicUrl }));
      setMessage('✅ تم رفع الفيديو بنجاح!');
    }
    setUploadingVideo(false);
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
        video_url: productData.video_url,
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

        <form onSubmit={handleSave} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-6">
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
              <label className="block mb-2 text-sm text-slate-300">السعر قبل الخصم</label>
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

          {/* رفع صورة من الجهاز */}
          <div className="border border-slate-700 p-4 rounded-xl bg-slate-700/40">
            <label className="block mb-2 text-sm font-semibold text-slate-200">صورة المنتج الرئيسية</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImage}
              className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-500 file:text-white hover:file:bg-emerald-600 cursor-pointer"
            />
            {uploadingImage && <p className="text-xs text-yellow-400 mt-2">جاري رفع الصورة...</p>}
            {productData.image_url && (
              <div className="mt-3 flex items-center gap-3">
                <img src={productData.image_url} alt="معاينة" className="w-20 h-20 object-cover rounded-lg border border-slate-600" />
                <span className="text-xs text-slate-400">الصورة الحالية جاهزة للعرض في المتجر</span>
              </div>
            )}
          </div>

          {/* رفع فيديو من الجهاز */}
          <div className="border border-slate-700 p-4 rounded-xl bg-slate-700/40">
            <label className="block mb-2 text-sm font-semibold text-slate-200">فيديو توضيحي / إعلان للمنتج (اختياري)</label>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              disabled={uploadingVideo}
              className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-sky-500 file:text-white hover:file:bg-sky-600 cursor-pointer"
            />
            {uploadingVideo && <p className="text-xs text-yellow-400 mt-2">جاري رفع الفيديو (قد يستغرق لحظات)...</p>}
            {productData.video_url && (
              <div className="mt-3">
                <video src={productData.video_url} controls className="w-48 rounded-lg border border-slate-600" />
              </div>
            )}
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
            disabled={saveLoading || uploadingImage || uploadingVideo}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold text-white transition text-lg disabled:opacity-50"
          >
            {saveLoading ? 'جاري الحفظ...' : 'حفظ التعديلات في الموقع 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}
