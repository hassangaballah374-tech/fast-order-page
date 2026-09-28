'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // الصورة النشطة في المعرض
  const [activeImage, setActiveImage] = useState('');

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
        const imagesList = Array.isArray(data.images) && data.images.length > 0 
          ? data.images 
          : (data.image_url ? [data.image_url] : []);
        if (imagesList.length > 0) setActiveImage(imagesList[0]);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (product?.show_colors && product.colors?.length > 0 && !selectedColor) {
      alert('يرجى اختيار اللون المفضل');
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

  const galleryImages = Array.isArray(product?.images) && product.images.length > 0
    ? product.images
    : (product?.image_url ? [product.image_url] : []);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-12" dir="rtl">
      <header className="bg-slate-900 border-b border-slate-800 py-4 px-6 text-center shadow-md">
        <h1 className="text-2xl font-black text-emerald-400">متجرنا الرسمي</h1>
      </header>

      <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-5 space-y-5">
          {/* صورة المنتج الرئيسية المحددة */}
          {activeImage && (
            <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
              <img
                src={activeImage}
                alt={product?.product_name}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* مصغرات معرض الصور */}
          {galleryImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(img)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition ${
                    activeImage === img ? 'border-emerald-500 scale-105' : 'border-slate-700 opacity-60'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* فيديو المنتج إن وجد */}
          {product?.video_url && (
            <video
              src={product.video_url}
              controls
              className="w-full rounded-2xl border border-slate-800 mt-2"
            />
          )}

          <div>
            <h2 className="text-3xl font-extrabold text-white mt-2">{product?.product_name}</h2>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-3xl font-black text-emerald-400">{product?.product_price} ج.م</span>
              {product?.original_price && (
                <span className="text-lg line-through text-slate-500">{product.original_price} ج.م</span>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-1">مصاريف الشحن: {product?.shipping_fee || 0} ج.م</p>
          </div>

          {/* خيار اختيار اللون */}
          {product?.show_colors && product.colors?.length > 0 && (
            <div className="border-t border-slate-800 pt-4">
              <span className="block text-sm font-semibold text-slate-300 mb-2">
                اختر اللون: <span className="text-emerald-400">{selectedColor}</span>
              </span>
              <div className="flex flex-wrap gap-2.5">
                {product.colors.map((c, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedColor(c.name)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium transition ${
                      selectedColor === c.name
                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                        : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full border border-slate-400" style={{ backgroundColor: c.code }}></span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* خيار اختيار المقاس */}
          {product?.show_sizes && product.sizes?.length > 0 && (
            <div className="border-t border-slate-800 pt-4">
              <span className="block text-sm font-semibold text-slate-300 mb-2">
                اختر المقاس: <span className="text-emerald-400">{selectedSize}</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedSize(s)}
                    className={`min-w-[48px] px-3.5 py-2 rounded-xl border text-sm font-bold transition ${
                      selectedSize === s
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product?.description && (
            <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/50 text-slate-300 leading-relaxed whitespace-pre-line text-sm">
              {product.description}
            </div>
          )}
        </div>

        {/* نموذج استلام الطلب */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
          <h3 className="text-xl font-bold text-emerald-400 mb-4 text-center">أدخل بياناتك لتأكيد الطلب والدفع عند الاستلام</h3>

          {success ? (
            <div className="p-6 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-2xl text-center space-y-2">
              <p className="text-2xl font-black">🎉 تم استلام طلبك بنجاح!</p>
              <p className="text-sm">سنتواصل معك هاتفياً لتأكيد تفاصيل الشحن والتوصيل.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">الاسم بالكامل</label>
                <input
                  type="text"
                  required
                  placeholder="محمد أحمد"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">رقم الهاتف</label>
                <input
                  type="tel"
                  required
                  placeholder="010xxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">العنوان بالتفصيل</label>
                <textarea
                  required
                  rows="2"
                  placeholder="المحافظة، المدينة، الشارع، رقم العقار..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-400"
                ></textarea>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={orderLoading}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 rounded-2xl font-black text-lg text-white transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {orderLoading ? 'جاري تأكيد الطلب...' : 'اضغط هنا لتأكيد الطلب 🚚'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
