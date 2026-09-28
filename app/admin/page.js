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
    store_name: '',
    product_name: '',
    product_price: '',
    original_price: '',
    shipping_fee: '',
    images: [],
    video_url: '',
    description: '',
    show_colors: false,
    colors: [],
    show_sizes: false,
    sizes: [],
  });

  const [newColorName, setNewColorName] = useState('');
  const [newColorCode, setNewColorCode] = useState('#000000');
  const [newSizeName, setNewSizeName] = useState('');

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
        store_name: data.store_name || '',
        product_name: data.product_name || '',
        product_price: data.product_price || '',
        original_price: data.original_price || '',
        shipping_fee: data.shipping_fee || '',
        images: Array.isArray(data.images) ? data.images : (data.image_url ? [data.image_url] : []),
        video_url: data.video_url || '',
        description: data.description || '',
        show_colors: !!data.show_colors,
        colors: Array.isArray(data.colors) ? data.colors : [],
        show_sizes: !!data.show_sizes,
        sizes: Array.isArray(data.sizes) ? data.sizes : [],
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

  const handleMultipleImagesUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploadingImage(true);
    setMessage('');

    try {
      const uploadedUrls = [];
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `img_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, file);

        if (!uploadError) {
          const { data } = supabase.storage.from('products').getPublicUrl(filePath);
          uploadedUrls.push(data.publicUrl);
        }
      }

      setProductData((prev) => {
        const allImages = [...(prev.images || []), ...uploadedUrls];
        return { ...prev, images: allImages };
      });
      setMessage('✅ تم رفع الصور بنجاح!');
    } catch (err) {
      setMessage('فشل الرفع: ' + err.message);
    }
    setUploadingImage(false);
  };

  const removeImage = (indexToRemove) => {
    setProductData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove),
    }));
  };

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

  const addColor = () => {
    if (!newColorName.trim()) return;
    setProductData((prev) => ({
      ...prev,
      colors: [...prev.colors, { name: newColorName.trim(), code: newColorCode }],
    }));
    setNewColorName('');
  };

  const removeColor = (idx) => {
    setProductData((prev) => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== idx),
    }));
  };

  const addSize = () => {
    if (!newSizeName.trim()) return;
    setProductData((prev) => ({
      ...prev,
      sizes: [...prev.sizes, newSizeName.trim()],
    }));
    setNewSizeName('');
  };

  const removeSize = (idx) => {
    setProductData((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== idx),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setMessage('');

    const { error } = await supabase
      .from('store_settings')
      .upsert({
        id: 1,
        store_name: productData.store_name,
        product_name: productData.product_name,
        product_price: Number(productData.product_price),
        original_price: Number(productData.original_price),
        shipping_fee: Number(productData.shipping_fee),
        image_url: productData.images[0] || '',
        images: productData.images,
        video_url: productData.video_url,
        description: productData.description,
        show_colors: productData.show_colors,
        colors: productData.colors,
        show_sizes: productData.show_sizes,
        sizes: productData.sizes,
        updated_at: new Date(),
      });

    if (error) {
      setMessage('حدث خطأ أثناء الحفظ: ' + error.message);
    } else {
      setMessage('✅ تم حفظ التعديلات بنجاح وتحديث الموقع بالكامل!');
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
              className="w-full p-3 rounded-xl bg-slate-700 border border-slate-600 text-white"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block mb-2 text-sm text-slate-300">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-700 border border-slate-600 text-white"
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
          <h1 className="text-2xl font-bold text-emerald-400">إدارة الموقع والمتجر</h1>
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
          {/* اسم المتجر */}
          <div>
            <label className="block mb-2 text-sm text-slate-300 font-semibold">اسم المتجر / العلامة التجارية</label>
            <input
              type="text"
              placeholder="مثال: لَمّة ستور، متجر الأناقة..."
              value={productData.store_name}
              onChange={(e) => setProductData({ ...productData, store_name: e.target.value })}
              className="w-full p-3 rounded-xl bg-slate-700 border border-slate-600 text-white focus:border-emerald-400 focus:outline-none"
              required
            />
          </div>

          {/* اسم المنتج */}
          <div>
            <label className="block mb-2 text-sm text-slate-300 font-semibold">اسم المنتج</label>
            <input
              type="text"
              placeholder="مثال: كوتش مريح وعملي خامات عالية الجودة"
              value={productData.product_name}
              onChange={(e) => setProductData({ ...productData, product_name: e.target.value })}
              className="w-full p-3 rounded-xl bg-slate-700 border border-slate-600 text-white focus:border-emerald-400 focus:outline-none"
              required
            />
          </div>

          {/* الأسعار */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-2 text-sm text-slate-300">سعر البيع بعد الخصم (ج.م)</label>
              <input
                type="number"
                value={productData.product_price}
                onChange={(e) => setProductData({ ...productData, product_price: e.target.value })}
                className="w-full p-3 rounded-xl bg-slate-700 border border-slate-600 text-white"
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-sm text-slate-300">السعر قبل الخصم (ج.م)</label>
              <input
                type="number"
                value={productData.original_price}
                onChange={(e) => setProductData({ ...productData, original_price: e.target.value })}
                className="w-full p-3 rounded-xl bg-slate-700 border border-slate-600 text-white"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm text-slate-300">مصاريف الشحن (ج.م)</label>
              <input
                type="number"
                value={productData.shipping_fee}
                onChange={(e) => setProductData({ ...productData, shipping_fee: e.target.value })}
                className="w-full p-3 rounded-xl bg-slate-700 border border-slate-600 text-white"
                required
              />
            </div>
          </div>

          {/* معرض الصور المتعددة */}
          <div className="border border-slate-700 p-4 rounded-xl bg-slate-700/40">
            <label className="block mb-2 text-sm font-semibold text-slate-200">
              معرض صور المنتج (اختر صورة أو أكثر معاً لتقليبها في الصفحة)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleMultipleImagesUpload}
              disabled={uploadingImage}
              className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-500 file:text-white hover:file:bg-emerald-600 cursor-pointer"
            />
            {uploadingImage && <p className="text-xs text-yellow-400 mt-2">جاري رفع الصور...</p>}

            {productData.images && productData.images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                {productData.images.map((img, idx) => (
                  <div key={idx} className="relative group border border-slate-600 rounded-lg overflow-hidden h-24">
                    <img src={img} alt={`صورة ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
                    >
                      ×
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1 right-1 bg-emerald-600 text-[10px] px-1.5 py-0.5 rounded text-white">
                        الرئيسية
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* رفع فيديو */}
          <div className="border border-slate-700 p-4 rounded-xl bg-slate-700/40">
            <label className="block mb-2 text-sm font-semibold text-slate-200">فيديو توضيحي للمنتج (اختياري)</label>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              disabled={uploadingVideo}
              className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-sky-500 file:text-white hover:file:bg-sky-600 cursor-pointer"
            />
            {uploadingVideo && <p className="text-xs text-yellow-400 mt-2">جاري رفع الفيديو...</p>}
            {productData.video_url && (
              <div className="mt-3">
                <video src={productData.video_url} controls className="w-48 rounded-lg border border-slate-600" />
              </div>
            )}
          </div>

          {/* قسم الألوان */}
          <div className="border border-slate-700 p-4 rounded-xl bg-slate-700/40 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-sm text-slate-200">خيارات الألوان</label>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={productData.show_colors}
                  onChange={(e) => setProductData({ ...productData, show_colors: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-0"
                />
                <span className="text-slate-300">إظهار خيار الألوان في المتجر</span>
              </label>
            </div>

            {productData.show_colors && (
              <div className="space-y-3 pt-2">
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={newColorCode}
                    onChange={(e) => setNewColorCode(e.target.value)}
                    className="w-12 h-10 p-1 bg-slate-700 border border-slate-600 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    placeholder="اسم اللون (مثال: أسود، كحلي، رصاصي)"
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                    className="flex-1 p-2 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={addColor}
                    className="px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold"
                  >
                    إضافة
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {productData.colors.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-600">
                      <span className="w-4 h-4 rounded-full border border-slate-400" style={{ backgroundColor: c.code }}></span>
                      <span className="text-xs">{c.name}</span>
                      <button type="button" onClick={() => removeColor(i)} className="text-red-400 text-xs hover:text-red-300 mr-1">×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* قسم المقاسات */}
          <div className="border border-slate-700 p-4 rounded-xl bg-slate-700/40 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-sm text-slate-200">خيارات المقاسات</label>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={productData.show_sizes}
                  onChange={(e) => setProductData({ ...productData, show_sizes: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-0"
                />
                <span className="text-slate-300">إظهار خيار المقاسات في المتجر</span>
              </label>
            </div>

            {productData.show_sizes && (
              <div className="space-y-3 pt-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="المقاس (مثال: 41, 42, 43 أو M, L, XL)"
                    value={newSizeName}
                    onChange={(e) => setNewSizeName(e.target.value)}
                    className="flex-1 p-2 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={addSize}
                    className="px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold"
                  >
                    إضافة
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {productData.sizes.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-600">
                      <span className="text-xs font-bold">{s}</span>
                      <button type="button" onClick={() => removeSize(i)} className="text-red-400 text-xs hover:text-red-300 mr-1">×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* وصف المنتج */}
          <div>
            <label className="block mb-2 text-sm text-slate-300 font-semibold">وصف ومميزات المنتج</label>
            <textarea
              rows="5"
              placeholder="اكتب هنا مميزات وتفاصيل المنتج..."
              value={productData.description}
              onChange={(e) => setProductData({ ...productData, description: e.target.value })}
              className="w-full p-3 rounded-xl bg-slate-700 border border-slate-600 text-white leading-relaxed"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={saveLoading || uploadingImage || uploadingVideo}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold text-white transition text-lg disabled:opacity-50"
          >
            {saveLoading ? 'جاري الحفظ...' : 'حفظ التعديلات في الموقع 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}
