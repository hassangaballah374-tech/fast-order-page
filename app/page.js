'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [success, setSuccess] = useState(false);
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
      if (data) setProduct(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOrderLoading(true);
    const { error } = await supabase.from('orders').insert([
      {
        customer_name: formData.name,
        phone: formData.phone,
        address: formData.address,
        notes: formData.notes,
        product_name: product?.product_name || 'طلب عام',
        total_amount: (Number(product?.product_price) || 0) + (Number(product?.shipping_fee) || 0),
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white" dir="rtl">
        <p className="text-xl">جاري تحميل المتجر...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-12" dir="rtl">
      {/* رأس الصفحة */}
      <header className="bg-slate-900 border-b border-slate-800 py-4 px-6 text-center shadow-md">
        <h1 className="text-2xl font-black text-emerald-400">متجرنا الرسمي</h1>
      </header>

      <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        {/* بطاقة المنتج */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-5 space-y-5">
          {product?.image_url && (
            <img
              src={product.image_url}
              alt={product.product_name}
              className="w-full h-80 object-cover rounded-2xl border border-slate-800"
            />
          )}

          {product?.video_url && (
            <video
              src={product.video_url}
              controls
              className="w-full rounded-2xl border border-slate-800 mt-3"
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

          {product?.description && (
            <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/50 text-slate-300 leading-relaxed whitespace-pre-line text-sm">
              {product.description}
            </div>
          )}
        </div>

        {/* نموذج الطلب */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
          <h3 className="text-xl font-bold text-emerald-400 mb-4 text-center">أدخل بياناتك لتأكيد الطلب والدفع عند الاستلام</h3>

          {success ? (
            <div className="p-6 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-2xl text-center space-y-2">
              <p className="text-2xl font-black">🎉 تم استلام طلبك بنجاح!</p>
              <p className="text-sm">سنتواصل معك هاتفياً لتأكيد تفاصيل الشحن.</p>
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
                <label className="block text-sm text-slate-300 mb-1">العنوان بالتفصيل (المحافظة / المدينة / الشارع)</label>
                <textarea
                  required
                  rows="2"
                  placeholder="مثال: القاهرة، مدينة نصر، شارع عباس العقاد..."
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
