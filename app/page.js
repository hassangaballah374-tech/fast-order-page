'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

// بيانات المحافظات ومصاريف الشحن (قابلة للتعديل حسب أسعارك)
const SHIPPING_RATES = {
  cairo_giza: { name: 'القاهرة والجيزة', cost: 50 },
  alex: { name: 'الإسكندرية', cost: 60 },
  delta: { name: 'وجه بحري والدلتا', cost: 65 },
  canal: { name: 'مدن القناة', cost: 70 },
  upper_egypt: { name: 'الصعيد ومحافظات أخرى', cost: 80 },
};

export default function LandingPage() {
  // بيانات المنتج التجريبي
  const product = {
    name: 'المنتج المميز (عرض التوفير الحصري)',
    price: 350, // سعر القطعة الواحدة بالجنيه
    originalPrice: 500,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
  };

  // State للنموذج والعمليات
  const [quantity, setQuantity] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    governorate: 'cairo_giza',
    address: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // حساب الإجمالي
  const shippingCost = SHIPPING_RATES[formData.governorate]?.cost || 50;
  const productsSubtotal = product.price * quantity;
  const grandTotal = productsSubtotal + shippingCost;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    // توليد معرف فريد للحدث (سنستخدمه للبيكسيل و CAPI في المرحلة القادمة)
    const eventId = 'order_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    try {
      // إرسال البيانات مباشرة إلى جدول orders في Supabase
      const { data, error } = await supabase.from('orders').insert([
        {
          customer_name: formData.name,
          phone: formData.phone,
          governorate: SHIPPING_RATES[formData.governorate].name,
          address: formData.address,
          product_name: product.name,
          quantity: quantity,
          total_price: grandTotal,
          shipping_cost: shippingCost,
          notes: formData.notes,
          event_id: eventId,
          status: 'pending',
        },
      ]);

      if (error) throw error;

      // نجاح العملية
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      setErrorMsg('حدث خطأ أثناء تسجيل طلبك، برجاء المحاولة مجدداً أو التواصل معنا.');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-green-100">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">تم استلام طلبك بنجاح!</h2>
          <p className="text-gray-600 mb-6">
            شكراً لك يا <strong>{formData.name}</strong>. سنتواصل معك هاتفياً على الرقم ({formData.phone}) لتأكيد الشحن.
          </p>
          <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 space-y-1 mb-6 text-right">
            <div><strong>المنتج:</strong> {product.name} (عدد {quantity})</div>
            <div><strong>الإجمالي شامل الشحن:</strong> {grandTotal} ج.م</div>
            <div><strong>الدفع:</strong> عند الاستلام (COD)</div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition"
          >
            العودة للصفحة الرئيسية
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-gray-800 font-sans pb-16" dir="rtl">
      {/* شريط الإعلان العلوي */}
      <div className="bg-emerald-600 text-white text-center py-2 px-4 text-sm font-semibold">
        🔥 خصم خاص لفترة محدودة + الدفع عند الاستلام ومعاينة المنتج قبل الدفع
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* قسم تفاصيل المنتج والصور */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
            <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-square">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                وفر 30% اليوم
              </span>
            </div>

            <div>
              <h1 className="text-xl md:text-2xl font-black text-gray-900 leading-snug">
                {product.name}
              </h1>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-2xl md:text-3xl font-black text-emerald-600">
                  {product.price} ج.م
                </span>
                <span className="text-gray-400 line-through text-lg">
                  {product.originalPrice} ج.م
                </span>
              </div>
            </div>

            {/* نقاط البيع السريعة (Trust Badges) */}
            <ul className="space-y-2 border-t pt-4 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span> شحن سريع لجميع المحافظات خلال 48 ساعة.
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span> إمكانية فتح الشحنة ومعاينتها قبل الاستلام.
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span> ضمان استبدال واسترجاع مجاني لمدة 14 يوماً.
              </li>
            </ul>
          </div>

          {/* قسم نموذج الدفع والطلب السريع (One-Page Checkout) */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-emerald-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b">
              بيانات التوصيل السريع 🚚
            </h2>

            {errorMsg && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* اختيار الكمية */}
              <div>
                <label className="block text-sm font-semibold mb-1">الكمية المطلوبة:</label>
                <div className="flex items-center border rounded-xl w-36 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 py-2 bg-gray-100 hover:bg-gray-200 text-lg font-bold"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-bold text-base">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 py-2 bg-gray-100 hover:bg-gray-200 text-lg font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* الاسم */}
              <div>
                <label className="block text-sm font-semibold mb-1">الاسم بالكامل *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="مثال: محمد أحمد"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* رقم الهاتف */}
              <div>
                <label className="block text-sm font-semibold mb-1">رقم الهاتف (واتساب متاح) *</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="01xxxxxxxxx"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left"
                  dir="ltr"
                />
              </div>

              {/* المحافظة */}
              <div>
                <label className="block text-sm font-semibold mb-1">المحافظة *</label>
                <select
                  name="governorate"
                  value={formData.governorate}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {Object.entries(SHIPPING_RATES).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.name} (شحن: {val.cost} ج.م)
                    </option>
                  ))}
                </select>
              </div>

              {/* العنوان بالتفصيل */}
              <div>
                <label className="block text-sm font-semibold mb-1">العنوان بالتفصيل *</label>
                <input
                  type="text"
                  name="address"
                  required
                  placeholder="المدينة / المنطقة / اسم الشارع / رقم العقار"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* ملخص السعر قبل التأكيد */}
              <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">سعر المنتجات ({quantity}):</span>
                  <span className="font-semibold">{productsSubtotal} ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">مصاريف الشحن:</span>
                  <span className="font-semibold">{shippingCost} ج.م</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-base font-black text-gray-900">
                  <span>المبلغ الإجمالي عند الاستلام:</span>
                  <span className="text-emerald-600 text-lg">{grandTotal} ج.م</span>
                </div>
              </div>

              {/* زر الشراء والتأكيد */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-4 rounded-xl text-lg shadow-lg hover:shadow-xl transition transform active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'جاري تسجيل طلبك...' : 'اضغط هنا لتأكيد الطلب الآن 🛍️'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </main>
  );
}
