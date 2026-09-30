'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

const EGYPT_REGIONS = {
  'القاهرة': { zone: 'cairo_giza', cities: ['مدينة نصر', 'مصر الجديدة', 'المعادي', 'التجمع الخامس / القاهرة الجديدة', 'الشروق', 'بدر', 'شبرا', 'حلوان', 'المقطم', 'عين شمس', 'الزيتون', 'وسط البلد'] },
  'الجيزة': { zone: 'cairo_giza', cities: ['الدقي', 'المهندسين', 'الهرم', 'فيصل', 'مدينة 6 أكتوبر', 'الشيخ زايد', 'العمرانية', 'إمبابة', 'الحوامدية', 'البدرشين'] },
  'الإسكندرية': { zone: 'alex', cities: ['سموحة', 'سيدي جابر', 'محرم بك', 'المنتزه', 'العصافرة', 'ميامي', 'العجمي', 'العامرية', 'برج العرب'] },
  'البحيرة': { zone: 'delta', cities: ['دمنهور', 'كفر الدوار', 'حوش عيسى', 'أبو حمص', 'إيتاي البارود', 'كوم حمادة', 'رشيد', 'إدكو', 'الدلنجات', 'أبو المطامير', 'المحمودية'] },
  'الغربية': { zone: 'delta', cities: ['طنطا', 'المحلة الكبرى', 'زفتى', 'كفر الزيات', 'سمنود', 'بسيون', 'السنطة', 'قطور'] },
  'الشرقية': { zone: 'delta', cities: ['الزقازيق', 'العاشر من رمضان', 'بلبيس', 'منيا القمح', 'فاقوس', 'أبو حماد', 'أبو كبير', 'ههيا', 'ديرب نجم'] },
  'الدقهلية': { zone: 'delta', cities: ['المنصورة', 'ميت غمر', 'السنبلاوين', 'دكرنس', 'بلقاس', 'شربين', 'طلخا', 'منية النصر', 'أجا'] },
  'القليوبية': { zone: 'delta', cities: ['بنها', 'شبرا الخيمة', 'قليوب', 'القناطر الخيرية', 'الخانكة', 'طوخ', 'العبور', 'قها'] },
  'المنوفية': { zone: 'delta', cities: ['شبين الكوم', 'مدينة السادات', 'منوف', 'أشمون', 'بركة السبع', 'قويسنا', 'الشهداء', 'تلا'] },
  'كفر الشيخ': { zone: 'delta', cities: ['كفر الشيخ', 'دسوق', 'فوه', 'مطوبس', 'بيلا', 'الحامول', 'سيدي سالم', 'الرياض', 'قلين'] },
  'دمياط': { zone: 'delta', cities: ['دمياط', 'دمياط الجديدة', 'رأس البر', 'فارسكور', 'الزرقا', 'كفر سعد'] },
  'الإسماعيلية': { zone: 'canal', cities: ['الإسماعيلية', 'فايد', 'القنطرة شرق', 'القنطرة غرب', 'التل الكبير', 'أبو صوير'] },
  'بورسعيد': { zone: 'canal', cities: ['حي الشرق', 'حي العرب', 'حي المناخ', 'حي الضواحي', 'حي الزهور', 'بورفؤاد'] },
  'السويس': { zone: 'canal', cities: ['السويس', 'الأربعين', 'عتاقة', 'فيصل', 'الجناين'] },
  'الفيوم': { zone: 'upper_egypt', cities: ['الفيوم', 'سنورس', 'إطسا', 'طامية', 'يوسف الصديق', 'إبشواي'] },
  'بني سويف': { zone: 'upper_egypt', cities: ['بني سويف', 'الواسطى', 'ناصر', 'ببا', 'سمسطا', 'الفشن', 'إهناسيا'] },
  'المنيا': { zone: 'upper_egypt', cities: ['المنيا', 'ملوي', 'بني مزار', 'مغاغة', 'أبو قرقاص', 'سمالوط', 'مطاي', 'دير مواس'] },
  'أسيوط': { zone: 'upper_egypt', cities: ['أسيوط', 'ديروط', 'القوصية', 'أبنوب', 'منفلوط', 'أبو تيج', 'البداري', 'صدفا', 'ساحل سليم'] },
  'سوهاج': { zone: 'upper_egypt', cities: ['سوهاج', 'طهطا', 'جرجا', 'المراغة', 'أخميم', 'المنشأة', 'طما', 'البلينا'] },
  'قنا': { zone: 'upper_egypt', cities: ['قنا', 'نجع حمادي', 'دشنا', 'أبو تشت', 'قوص', 'نقادة', 'فرشوط'] },
  'الأقصر': { zone: 'upper_egypt', cities: ['الأقصر', 'إسنا', 'أرمنت', 'القرنة', 'البياضية', 'الطود'] },
  'أسوان': { zone: 'upper_egypt', cities: ['أسوان', 'كوم أمبو', 'إدفو', 'دراو', 'نصر النوبة'] },
  'مطروح': { zone: 'remote', cities: ['مرسى مطروح', 'الحمام', 'العلمين', 'الضبعة', 'سيوة'] },
  'البحر الأحمر': { zone: 'remote', cities: ['الغردقة', 'سفاجا', 'القصير', 'رأس غارب', 'مرسى علم'] },
  'جنوب سيناء': { zone: 'remote', cities: ['شرم الشيخ', 'دهب', 'نويبع', 'طابا', 'طور سيناء', 'رأس سدر'] },
  'شمال سيناء': { zone: 'remote', cities: ['العريش', 'بئر العبد', 'الشيخ زويد', 'رفح'] },
  'الوادي الجديد': { zone: 'remote', cities: ['الخارجة', 'الداخلة', 'الفرافرة', 'باريس'] }
};

const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbw_zn4XtPgmuksXCQ8VsiUamby9bqj_OVuqJ4fEPhG9vHRww2qjsEvjuNg8SKSTJCwnbg/exec';

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params?.id;

  const [settings, setSettings] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);

  const hasFiredCheckout = useRef(false);

  const [selectedGovernorate, setSelectedGovernorate] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [currentShippingFee, setCurrentShippingFee] = useState(50);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    detailedAddress: '',
    notes: '',
  });

  useEffect(() => {
    async function loadData() {
      // 1. جلب إعدادات المتجر
      const { data: sData } = await supabase.from('store_settings').select('*').eq('id', 1).maybeSingle();
      if (sData) {
        setSettings(sData);
        const defaultRates = sData.shipping_rates || { cairo_giza: 50 };
        setCurrentShippingFee(defaultRates.cairo_giza || 50);
      }

      // 2. جلب المنتج المحدد بالـ ID
      if (productId) {
        const { data: pData } = await supabase.from('products').select('*').eq('id', productId).maybeSingle();
        if (pData) {
          setProduct(pData);
          if (pData.show_colors && Array.isArray(pData.colors) && pData.colors.length > 0) {
            setSelectedColor(pData.colors[0].name);
          }
          if (pData.show_sizes && Array.isArray(pData.sizes) && pData.sizes.length > 0) {
            setSelectedSize(pData.sizes[0]);
          }
        }
      }
      setLoading(false);
    }
    loadData();
  }, [productId]);

  const triggerInitiateCheckout = () => {
    if (hasFiredCheckout.current) return;
    hasFiredCheckout.current = true;

    if (typeof window !== 'undefined') {
      if (window.fbq) {
        window.fbq('track', 'InitiateCheckout', {
          content_name: product?.name || 'منتج',
          value: Number(product?.price) || 0,
          currency: 'EGP',
        });
      }
    }
  };

  const handleGovernorateChange = (gov) => {
    setSelectedGovernorate(gov);
    setSelectedCity('');
    if (!gov || !settings?.shipping_rates) return;
    const zoneKey = EGYPT_REGIONS[gov]?.zone || 'cairo_giza';
    const rate = settings.shipping_rates[zoneKey] ?? 50;
    setCurrentShippingFee(rate);
  };

  const galleryImages = Array.isArray(product?.images) && product.images.length > 0 ? product.images : [];

  const handleAddToCart = (openDrawer = false) => {
    if (product?.show_colors && product.colors?.length > 0 && !selectedColor) {
      alert('يرجى اختيار اللون أولاً');
      return;
    }
    if (product?.show_sizes && product.sizes?.length > 0 && !selectedSize) {
      alert('يرجى اختيار المقاس أولاً');
      return;
    }

    const newItem = {
      id: `${Date.now()}_${Math.random()}`,
      name: product?.name || 'منتج',
      price: Number(product?.price) || 0,
      image: galleryImages[0] || '',
      color: selectedColor || null,
      size: selectedSize || null,
      quantity: 1,
    };

    setCart((prev) => [...prev, newItem]);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);

    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'AddToCart', {
        content_name: product?.name,
        value: Number(product?.price) || 0,
        currency: 'EGP',
      });
    }

    if (openDrawer) setIsCartOpen(true);
  };

  const scrollToCheckout = () => {
    setIsCartOpen(false);
    triggerInitiateCheckout();
    document.getElementById('checkout-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGovernorate) {
      alert('يرجى اختيار المحافظة');
      return;
    }

    setOrderLoading(true);

    const itemsToOrder = cart.length > 0 ? cart : [
      {
        name: product?.name || 'منتج',
        price: Number(product?.price) || 0,
        color: selectedColor || null,
        size: selectedSize || null,
        quantity: 1,
      }
    ];

    const subtotal = itemsToOrder.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shipping = Number(currentShippingFee) || 0;
    const finalTotal = subtotal + shipping;

    const fullAddress = `${selectedGovernorate} - ${selectedCity || 'مركز/مدينة'} - ${formData.detailedAddress}`;
    const productsSummary = itemsToOrder.map((i) => `${i.name} (عدد: ${i.quantity})`).join(' + ');
    const colorsSummary = itemsToOrder.map((i) => i.color).filter(Boolean).join(', ') || selectedColor || '-';
    const sizesSummary = itemsToOrder.map((i) => i.size).filter(Boolean).join(', ') || selectedSize || '-';
    const totalQty = itemsToOrder.reduce((acc, i) => acc + i.quantity, 0);

    try {
      const { error } = await supabase.from('orders').insert([
        {
          customer_name: formData.name,
          phone: formData.phone,
          governorate: selectedGovernorate,
          city: selectedCity,
          address: fullAddress,
          notes: formData.notes,
          product_name: productsSummary,
          total_amount: finalTotal,
          total_price: finalTotal,
          selected_color: colorsSummary,
          selected_size: sizesSummary,
          quantity: totalQty,
          items: itemsToOrder,
          status: 'جديد',
        },
      ]);

      if (error) throw error;

      setSuccess(true);
      setOrderLoading(false);
      setCart([]);

      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Purchase', {
          content_name: product?.name,
          value: finalTotal,
          currency: 'EGP',
        });
      }

      // إرسال لجوجل شيت في الخلفية بدون انتظار
      fetch(GOOGLE_SHEET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          governorate: selectedGovernorate,
          city: selectedCity,
          address: formData.detailedAddress,
          product_name: productsSummary,
          color: colorsSummary,
          size: sizesSummary,
          quantity: totalQty,
          shipping_fee: shipping,
          total_amount: finalTotal,
          notes: formData.notes,
        }),
      }).catch((err) => console.error(err));

    } catch (err) {
      alert('حدث خطأ أثناء الطلب: ' + err.message);
      setOrderLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-700" dir="rtl">
        جاري تحميل صفحة المنتج...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3" dir="rtl">
        <h2 className="text-xl font-black text-slate-800">المنتج غير موجود أو تم حذفه</h2>
        <a href="/" className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm">العودة للرئيسية</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-28 antialiased" dir="rtl">
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white text-center py-2.5 px-4 text-xs sm:text-sm font-bold shadow-sm">
        🚚 التوصيل لجميع محافظات مصر • الدفع عند الاستلام بعد المعاينة!
      </div>

      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 py-4 px-4 sticky top-0 z-40 shadow-sm text-center">
        <h1 className="text-2xl font-black text-slate-900">{settings?.store_name || 'متجرنا الرسمي'}</h1>
      </header>

      <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-lg p-5 sm:p-7 space-y-6">
          {galleryImages.length > 0 && (
            <div className="space-y-3">
              <div className="relative w-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center min-h-[320px] max-h-[500px] p-2">
                <img src={galleryImages[currentIndex]} alt={product.name} className="w-full h-auto max-h-[480px] object-contain mx-auto" />
              </div>
              {galleryImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 ${currentIndex === idx ? 'border-emerald-600' : 'border-slate-200 opacity-60'}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <h2 className="text-2xl font-extrabold text-slate-900">{product.name}</h2>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-emerald-600">{product.price} ج.م</span>
              {product.original_price && (
                <span className="text-lg line-through text-slate-400">{product.original_price} ج.م</span>
              )}
            </div>
          </div>

          {product.description && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-sm leading-relaxed text-slate-700 whitespace-pre-line">
              {product.description}
            </div>
          )}

          {/* الألوان */}
          {product.show_colors && product.colors?.length > 0 && (
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <span className="block text-sm font-bold text-slate-700">اللون: <strong className="text-emerald-600">{selectedColor}</strong></span>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedColor(c.name)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-sm font-semibold ${selectedColor === c.name ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200'}`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full border" style={{ backgroundColor: c.code }}></span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* المقاسات */}
          {product.show_sizes && product.sizes?.length > 0 && (
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <span className="block text-sm font-bold text-slate-700">المقاس: <strong className="text-emerald-600">{selectedSize}</strong></span>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedSize(s)}
                    className={`min-w-[48px] px-3.5 py-2 rounded-xl border text-sm font-black ${selectedSize === s ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={scrollToCheckout}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg rounded-2xl shadow-lg shadow-emerald-600/20 transition active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>⚡</span>
              <span>اطلب الآن - الدفع عند الاستلام</span>
            </button>
          </div>
        </div>

        {/* نموذج الشراء */}
        <div id="checkout-form" className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-lg scroll-mt-24">
          <div className="text-center mb-6">
            <h3 className="text-xl font-black text-slate-900">أدخل بيانات التوصيل</h3>
            <p className="text-xs text-slate-500 mt-1">الدفع نقداً بعد استلام وفحص المنتج</p>
          </div>

          {success ? (
            <div className="p-6 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-center space-y-2">
              <p className="text-2xl font-black">🎉 تم تأكيد طلبك بنجاح!</p>
              <p className="text-sm text-slate-600">سنتواصل معك هاتفياً لتأكيد موعد الشحن والتوصيل.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-700 mb-1 font-bold">الاسم بالكامل</label>
                <input
                  type="text"
                  required
                  placeholder="محمد أحمد"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-1 font-bold">رقم الهاتف (الواتساب)</label>
                <input
                  type="tel"
                  required
                  placeholder="01xxxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-700 mb-1 font-bold">المحافظة</label>
                  <select
                    required
                    value={selectedGovernorate}
                    onChange={(e) => handleGovernorateChange(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="">اختر المحافظة...</option>
                    {Object.keys(EGYPT_REGIONS).map((gov) => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-1 font-bold">المركز / المدينة</label>
                  <select
                    required
                    disabled={!selectedGovernorate}
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:border-emerald-600 disabled:opacity-50"
                  >
                    <option value="">اختر المركز...</option>
                    {selectedGovernorate &&
                      EGYPT_REGIONS[selectedGovernorate]?.cities.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    <option value="مركز آخر">مركز / قرية أخرى</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-1 font-bold">العنوان التفصيلي (الشارع ورقم العقار)</label>
                <textarea
                  required
                  rows="2"
                  placeholder="الشارع، المنطقة، علامة مميزة..."
                  value={formData.detailedAddress}
                  onChange={(e) => setFormData({ ...formData, detailedAddress: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:border-emerald-600"
                ></textarea>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>سعر المنتج:</span>
                  <span className="font-bold text-slate-800">{product.price} ج.م</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>مصاريف الشحن ({selectedGovernorate || 'حدد المحافظة'}):</span>
                  <span className="font-bold text-emerald-700">{currentShippingFee} ج.م</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-base">
                  <span>الإجمالي عند الاستلام:</span>
                  <span className="text-emerald-700 text-xl font-black">{Number(product.price) + currentShippingFee} ج.م</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={orderLoading}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg rounded-2xl shadow-lg shadow-emerald-600/20 transition active:scale-[0.99] disabled:opacity-50"
              >
                {orderLoading ? 'جاري تأكيد طلبك...' : 'تأكيد الطلب والدفع عند الاستلام 🚚'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
