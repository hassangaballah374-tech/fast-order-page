'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // التحكم في معرض الصور والتقليب
  const [currentIndex, setCurrentIndex] = useState(0);

  // اختيارات العميل
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase
        .from('store_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (data) {
        setProduct(data);
        if (data.show_colors && Array.isArray(data.colors) && data.colors.length > 0) {
          setSelectedColor(data.colors[0].name);
        }
        if (data.show_sizes && Array.isArray(data.sizes) && data.sizes.length > 0) {
          setSelectedSize(data.sizes[0]);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const galleryImages = Array.isArray(product?.images) && product.images.length > 0
    ? product.images
    : (product?.image_url ? [product.image_url] : []);

  const nextImage = () => {
    if (galleryImages.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
    }
  };

  const prevImage = () => {
    if (galleryImages.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (product?.show_colors && product.colors?.length > 0 && !selectedColor) {
      alert('يرجى اختيار اللون المطلوب');
      return;
    }
    if (product?.show_sizes && product.sizes?.length > 0 && !selectedSize) {
      alert('يرجى اختيار المقاس المطلوب');
      return;
    }

    setOrderLoading(true);
    const { error } = await supabase.from('orders').insert([
      {
        customer_name: formData.name,
        phone: formData.phone,
        address: formData.address,
        notes: formData.notes,
        product_name: product?.product_name || 'طلب عام',
        total_amount: (Number(product?.product_price) || 0) + (Number(product?.shipping_fee) || 0),
        selected_color: selectedColor || null,
        selected_size: selectedSize || null,
        status: 'جديد',
      },
    ]);

    if (!error) {
      setSuccess(true);
    } else {
      alert('حدث خطأ أثناء إرسال الطلب: ' + error.message);
    }
    setOrderLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white" dir="rtl">
        <p className="text-xl">جاري تحميل المتجر...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-16" dir="rtl">
      {/* شريط الإعلان */}
      <div className="bg-emerald-600 text-white text-center py-2 px-4 text-xs sm:text-sm font-bold shadow-md">
        🚚 التوصيل متاح لجميع المحافظات والدفع عند الاستلام بعد المعاينة!
      </div>

      {/* اسم الموقع والترويسة */}
      <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 py-4 px-6 text-center sticky top-0 z-50 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-black text-emerald-400 tracking-wide">
          {product?.store_name || 'متجرنا الرسمي'}
        </h1>
      </header>

      <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-4 sm:p-6 space-y-6">
          
          {/* قسم تقليب الصور التفاعلي */}
          {galleryImages.length > 0 && (
            <div className="space-y-3">
              <div className="relative w-full bg-black/50 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center min-h-[300px] max-h-[500px] select-none">
                <img
                  src={galleryImages[currentIndex]}
                  alt={product?.product_name}
                  className="w-full h-auto max-h-[480px] object-contain block mx-auto transition-all duration-300"
                />

                {/* أزرار تقليب الصور (يمين ويسار) إذا كانت الصور أكثر من واحدة */}
                {galleryImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-900 border border-slate-600 flex items-center justify-center text-white text-lg transition shadow-lg"
                      title="الصورة السابقة"
                    >
                      ❮
                    </button>
                    <button
                      type="button"
                      onClick={nextImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-900 border border-slate-600 flex items-center justify-center text-white text-lg transition shadow-lg"
                      title="الصورة التالية"
                    >
                      ❯
                    </button>
                    <span className="absolute bottom-3 left-3 bg-black/70 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-300">
                      {currentIndex + 1} / {galleryImages.length}
                    </span>
                  </>
                )}
              </div>

              {/* مصغرات المعرض للضغط والتنقل المباشر */}
              {galleryImages.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-2">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                        currentIndex === idx ? 'border-emerald-500 scale-105 shadow-md shadow-emerald-500/20' : 'border-slate-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* فيديو توضيحي إن وجد */}
          {product?.video_url && (
            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black">
              <video
                src={product.video_url}
                controls
                className="w-full max-h-[450px] object-contain mx-auto"
              />
            </div>
          )}

          {/* تفاصيل السعر والشحن واسم المنتج */}
          <div className="border-b border-slate-800 pb-5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">{product?.product_name}</h2>
            <div className="flex items-baseline gap-3 mt-3">
              <span className="text-3xl sm:text-4xl font-black text-emerald-400">{product?.product_price} ج.م</span>
              {product?.original_price && (
                <span className="text-xl line-through text-slate-500">{product.original_price} ج.م</span>
              )}
            </div>
            <div className="inline-block mt-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold">
              مصاريف الشحن: {product?.shipping_fee || 0} ج.م فقط
            </div>
          </div>

          {/* اختيار الألوان */}
          {product?.show_colors && product.colors?.length > 0 && (
            <div className="space-y-3">
              <span className="block text-sm font-semibold text-slate-300">
                اللون المختار: <strong className="text-emerald-400">{selectedColor}</strong>
              </span>
              <div className="flex flex-wrap gap-2.5">
                {product.colors.map((c, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedColor(c.name)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition ${
                      selectedColor === c.name
                        ? 'border-emerald-500 bg-emerald-500/20 text-white shadow-sm'
                        : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full border border-white/20 shadow-inner" style={{ backgroundColor: c.code }}></span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* اختيار المقاسات */}
          {product?.show_sizes && product.sizes?.length > 0 && (
            <div className="space-y-3">
              <span className="block text-sm font-semibold text-slate-300">
                المقاس المختار: <strong className="text-emerald-400">{selectedSize}</strong>
              </span>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedSize(s)}
                    className={`min-w-[54px] px-4 py-2.5 rounded-xl border text-sm font-bold transition ${
                      selectedSize === s
                        ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                        : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* وصف ومميزات المنتج */}
          {product?.description && (
            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-bold text-slate-300">تفاصيل ومميزات المنتج:</h3>
              <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/50 text-slate-200 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {product.description}
              </div>
            </div>
          )}
        </div>

        {/* نموذج استلام الطلب */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl">
          <h3 className="text-xl sm:text-2xl font-black text-emerald-400 mb-2 text-center">أدخل بياناتك لتأكيد الطلب</h3>
          <p className="text-xs sm:text-sm text-slate-400 mb-6 text-center">الدفع عند الاستلام بعد فحص المنتج والمعاينة</p>

          {success ? (
            <div className="p-6 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-2xl text-center space-y-3">
              <p className="text-3xl font-black">🎉 تم استلام طلبك بنجاح!</p>
              <p className="text-sm sm:text-base">سيتواصل معك فريق خدمة العملاء هاتفياً لتأكيد تفاصيل الشحن.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5 font-medium">الاسم ثلاثي</label>
                <input
                  type="text"
                  required
                  placeholder="محمد أحمد"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-400 transition"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1.5 font-medium">رقم الهاتف (واتساب متاح عليه)</label>
                <input
                  type="tel"
                  required
                  placeholder="01xxxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-400 transition"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1.5 font-medium">العنوان بالتفصيل</label>
                <textarea
                  required
                  rows="2"
                  placeholder="المحافظة - المدينة - الشارع - رقم العقار أو أقرب علامة مميزة"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-400 transition"
                ></textarea>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={orderLoading}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 rounded-2xl font-black text-lg text-white transition shadow-lg shadow-emerald-500/25 active:scale-[0.99] disabled:opacity-50"
                >
                  {orderLoading ? 'جاري تأكيد طلبك...' : 'اضغط هنا لتأكيد الطلب الآن 🚚'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
