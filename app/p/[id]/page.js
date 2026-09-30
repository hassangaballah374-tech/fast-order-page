'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
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

export default function SingleProductPage() {
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
  const [quantity, setQuantity] = useState(1);

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
    async function loadProductData() {
      setLoading(true);
      try {
        // 1. جلب إعدادات المتجر
        const { data: sData } = await supabase.from('store_settings').select('*').limit(1).maybeSingle();
        if (sData) {
          setSettings(sData);
          const defaultRates = sData.shipping_rates || { cairo_giza: 50 };
          setCurrentShippingFee(defaultRates.cairo_giza || 50);
        }

        // 2. جلب المنتج المطلوب
        let prod = null;
        if (productId === 'legacy') {
          if (sData && sData.product_name) {
            prod = {
              id: 'legacy',
              name: sData.product_name,
              price: Number(sData.product_price) || 0,
              original_price: Number(sData.original_price) || null,
              description: sData.description || '',
              images: sData.images || (sData.image_url ? [sData.image_url] : []),
              video_url: sData.video_url || '',
              show_colors: Boolean(sData.show_colors),
              colors: sData.colors || [],
              show_sizes: Boolean(sData.show_sizes),
              sizes: sData.sizes || [],
            };
          }
        } else if (productId) {
          const { data: pData } = await supabase.from('products').select('*').eq('id', productId).maybeSingle();
          if (pData) prod = pData;
        }

        if (prod) {
          setProduct(prod);
          if (prod.show_colors && Array.isArray(prod.colors) && prod.colors.length > 0) {
            setSelectedColor(prod.colors[0].name);
          }
          if (prod.show_sizes && Array.isArray(prod.sizes) && prod.sizes.length > 0) {
            setSelectedSize(prod.sizes[0]);
          }

          // إطلاق حدث ViewContent للبيكسل لصفحة هذا المنتج المحددة
          if (typeof window !== 'undefined') {
            if (window.fbq) {
              window.fbq('track', 'ViewContent', {
                content_name: prod.name,
                content_ids: [prod.id],
                value: Number(prod.price) || 0,
                currency: 'EGP',
              });
            }
            if (window.ttq) {
              window.ttq.track('ViewContent', {
                content_name: prod.name,
                content_id: String(prod.id),
                value: Number(prod.price) || 0,
                currency: 'EGP',
              });
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }

    loadProductData();
  }, [productId]);

  const handleGovernorateChange = (gov) => {
    setSelectedGovernorate(gov);
    setSelectedCity('');
    if (!gov || !settings?.shipping_rates) return;
    const zoneKey = EGYPT_REGIONS[gov]?.zone || 'cairo_giza';
    const rate = settings.shipping_rates[zoneKey] ?? 50;
    setCurrentShippingFee(rate);
  };

  const scrollToCheckout = () => {
    if (!hasFiredCheckout.current) {
      hasFiredCheckout.current = true;
      if (typeof window !== 'undefined') {
        if (window.fbq) {
          window.fbq('track', 'InitiateCheckout', {
            content_name: product?.name,
            value: (Number(product?.price) || 0) * quantity,
            currency: 'EGP',
          });
        }
        if (window.ttq) {
          window.ttq.track('InitiateCheckout', {
            content_name: product?.name,
            value: (Number(product?.price) || 0) * quantity,
            currency: 'EGP',
          });
        }
      }
    }
    document.getElementById('checkout-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGovernorate) {
      alert('يرجى اختيار المحافظة أولاً');
      return;
    }

    setOrderLoading(true);

    const subtotal = (Number(product?.price) || 0) * quantity;
    const shipping = Number(currentShippingFee) || 0;
    const finalTotal = subtotal + shipping;

    const fullAddress = `${selectedGovernorate} - ${selectedCity || 'مركز/مدينة'} - ${formData.detailedAddress}`;
    const productsSummary = `${product?.name} (عدد: ${quantity})`;
    const colorChosen = selectedColor || '-';
    const sizeChosen = selectedSize || '-';

    try {
      // 1. الحفظ السريع داخل Supabase
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
          selected_color: colorChosen,
          selected_size: sizeChosen,
          quantity: quantity,
          status: 'جديد',
        },
      ]);

      if (error) throw error;

      // 2. إظهار رسالة النجاح فوراً
      setSuccess(true);
      setOrderLoading(false);

      // إطلاق حدث الشراء Purchase
      if (typeof window !== 'undefined') {
        if (window.fbq) {
          window.fbq('track', 'Purchase', {
            content_name: product?.name,
            value: finalTotal,
            currency: 'EGP',
          });
        }
        if (window.ttq) {
          window.ttq.track('CompletePayment', {
            content_name: product?.name,
            value: finalTotal,
            currency: 'EGP',
          });
        }
      }

      // 3. إرسال لجوجل شيت في الخلفية بدون تأخير
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
          color: colorChosen,
          size: sizeChosen,
          quantity: quantity,
          shipping_fee: shipping,
          total_amount: finalTotal,
          notes: formData.notes,
        }),
      }).catch((err) => console.error(err));

    } catch (err) {
      alert('حدث خطأ أثناء تأكيد الطلب: ' + err.message);
      setOrderLoading(false);
    }
  };

  const galleryImages = Array.isArray(product?.images) && product.images.length > 0 ? product.images : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold">جاري تحميل صفحة المنتج...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4 font-sans p-6 text-center" dir="rtl">
        <span className="text-5xl">🔍</span>
        <h2 className="text-2xl font-black">عذراً، هذا المنتج غير متوفر أو تم حذفه!</h2>
        <Link href="/" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-sm transition">
          العودة لكتالوج المنتجات
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-28 antialiased" dir="rtl">
      {/* شريط الشحن */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white text-center py-2.5 px-4 text-xs sm:text-sm font-bold shadow-md">
        🚚 التوصيل لجميع محافظات مصر • الدفع عند الاستلام بعد المعاينة والفحص!
      </div>

      {/* الترويسة مع زر الرجوع للكتالوج */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 py-3.5 px-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xs sm:text-sm font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span>‹</span>
            <span>كل المنتجات</span>
          </Link>
          <h1 className="text-base sm:text-lg font-black text-white">{settings?.store_name || 'متجرنا'}</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        {/* كارت عرض تفاصيل المنتج */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-5 sm:p-7 space-y-6">
          {/* معرض الصور */}
          {galleryImages.length > 0 && (
            <div className="space-y-3">
              <div className="relative w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center min-h-[300px] max-h-[480px] p-2">
                <img
                  src={galleryImages[currentIndex]}
                  alt={product.name}
                  className="w-full h-auto max-h-[460px] object-contain mx-auto transition-all"
                />
                {galleryImages.length > 1 && (
                  <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-300">
                    {currentIndex + 1} / {galleryImages.length}
                  </div>
                )}
              </div>

              {galleryImages.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-2">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition ${
                        currentIndex === idx ? 'border-emerald-500 scale-105' : 'border-slate-800 opacity-60'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* فيديو المنتج إن وجد */}
          {product.video_url && (
            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black">
              <video src={product.video_url} controls className="w-full max-h-[420px] object-contain mx-auto" />
            </div>
          )}

          {/* الاسم والأسعار */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white">{product.name}</h2>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-emerald-400">{product.price} ج.م</span>
              {product.original_price && (
                <span className="text-lg line-through text-slate-500">{product.original_price} ج.م</span>
              )}
            </div>
          </div>

          {/* الوصف */}
          {product.description && (
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {product.description}
            </div>
          )}

          {/* اختيار اللون */}
          {product.show_colors && product.colors?.length > 0 && (
            <div className="space-y-2.5 border-t border-slate-800 pt-4">
              <span className="block text-xs sm:text-sm font-bold text-slate-300">
                اللون المختار: <strong className="text-emerald-400">{selectedColor}</strong>
              </span>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedColor(c.name)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-bold transition ${
                      selectedColor === c.name
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-700" style={{ backgroundColor: c.code }}></span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* اختيار المقاس */}
          {product.show_sizes && product.sizes?.length > 0 && (
            <div className="space-y-2.5 border-t border-slate-800 pt-4">
              <span className="block text-xs sm:text-sm font-bold text-slate-300">
                المقاس المختار: <strong className="text-emerald-400">{selectedSize}</strong>
              </span>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedSize(s)}
                    className={`min-w-[48px] px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-black transition ${
                      selectedSize === s
                        ? 'border-emerald-500 bg-emerald-600 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* اختيار الكمية */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-4">
            <span className="text-xs sm:text-sm font-bold text-slate-300">الكمية المطلوبة:</span>
            <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black"
              >
                −
              </button>
              <span className="text-sm font-black text-white w-6 text-center">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black"
              >
                +
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={scrollToCheckout}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg rounded-2xl shadow-xl shadow-emerald-900/40 transition active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>⚡</span>
              <span>اطلب الآن - الدفع عند الاستلام</span>
            </button>
          </div>
        </div>

        {/* نموذج كتابة البيانات وتأكيد الطلب السريع */}
        <div id="checkout-form" className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl scroll-mt-20">
          <div className="text-center mb-6">
            <h3 className="text-xl sm:text-2xl font-black text-white">بيانات توصيل الطلب</h3>
            <p className="text-xs text-slate-400 mt-1">الدفع نقداً بعد استلام وفحص الشحنة</p>
          </div>

          {success ? (
            <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl text-center space-y-3">
              <p className="text-3xl font-black">🎉 تم تسجيل طلبك بنجاح!</p>
              <p className="text-sm text-slate-300">سيتواصل معك فريق خدمة العملاء هاتفياً لتأكيد الشحن والتسليم.</p>
              <Link href="/" className="inline-block mt-3 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold">
                متابعة التسوق في المتجر
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">الاسم بالكامل</label>
                <input
                  type="text"
                  required
                  placeholder="محمد أحمد علي"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">رقم الهاتف (الواتساب)</label>
                <input
                  type="tel"
                  required
                  placeholder="01xxxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">المحافظة</label>
                  <select
                    required
                    value={selectedGovernorate}
                    onChange={(e) => handleGovernorateChange(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">اختر المحافظة...</option>
                    {Object.keys(EGYPT_REGIONS).map((gov) => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">المركز / المدينة</label>
                  <select
                    required
                    disabled={!selectedGovernorate}
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-50"
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
                <label className="block text-xs font-bold text-slate-400 mb-1.5">العنوان بالتفصيل (الشارع وعلامة مميزة)</label>
                <textarea
                  required
                  rows="2"
                  placeholder="اسم الشارع، رقم العمارة، الشقة، أو علامة مميزة..."
                  value={formData.detailedAddress}
                  onChange={(e) => setFormData({ ...formData, detailedAddress: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-sm"
                ></textarea>
              </div>

              {/* ملخص السعر والحسابات */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>سعر المنتج ({quantity} قطعة):</span>
                  <span className="font-bold text-white">{Number(product.price) * quantity} ج.م</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>مصاريف الشحن ({selectedGovernorate || 'حدد المحافظة'}):</span>
                  <span className="font-bold text-emerald-400">{currentShippingFee} ج.م</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between font-black text-sm sm:text-base">
                  <span className="text-white">المبلغ الإجمالي عند الاستلام:</span>
                  <span className="text-emerald-400 text-xl">{(Number(product.price) * quantity) + currentShippingFee} ج.م</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={orderLoading}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg rounded-2xl shadow-xl transition disabled:opacity-50"
              >
                {orderLoading ? 'جاري تأكيد الطلب...' : 'تأكيد الطلب والدفع عند الاستلام 🚚'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
