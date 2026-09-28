'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// قائمة المحافظات المصرية ومراكزها وتصنيف منطقة الشحن
const EGYPT_REGIONS = {
  'القاهرة': {
    zone: 'cairo_giza',
    cities: ['مدينة نصر', 'مصر الجديدة', 'المعادي', 'التجمع الخامس / القاهرة الجديدة', 'الشروق', 'بدر', 'شبرا', 'حلوان', 'المقطم', 'عين شمس', 'الزيتون', 'وسط البلد']
  },
  'الجيزة': {
    zone: 'cairo_giza',
    cities: ['الدقي', 'المهندسين', 'الهرم', 'فيصل', 'مدينة 6 أكتوبر', 'الشيخ زايد', 'العمرانية', 'إمبابة', 'الحوامدية', 'البدرشين']
  },
  'الإسكندرية': {
    zone: 'alex',
    cities: ['سموحة', 'سيدي جابر', 'محرم بك', 'المنتزه', 'العصافرة', 'ميامي', 'العجمي', 'العامرية', 'برج العرب']
  },
  'البحيرة': {
    zone: 'delta',
    cities: ['دمنهور', 'كفر الدوار', 'حوش عيسى', 'أبو حمص', 'إيتاي البارود', 'كوم حمادة', 'رشيد', 'إدكو', 'الدلنجات', 'أبو المطامير', 'المحمودية']
  },
  'الغربية': {
    zone: 'delta',
    cities: ['طنطا', 'المحلة الكبرى', 'زفتى', 'كفر الزيات', 'سمنود', 'بسيون', 'السنطة', 'قطور']
  },
  'الشرقية': {
    zone: 'delta',
    cities: ['الزقازيق', 'العاشر من رمضان', 'بلبيس', 'منيا القمح', 'فاقوس', 'أبو حماد', 'أبو كبير', 'ههيا', 'ديرب نجم']
  },
  'الدقهلية': {
    zone: 'delta',
    cities: ['المنصورة', 'ميت غمر', 'السنبلاوين', 'دكرنس', 'بلقاس', 'شربين', 'طلخا', 'منية النصر', 'أجا']
  },
  'القليوبية': {
    zone: 'delta',
    cities: ['بنها', 'شبرا الخيمة', 'قليوب', 'القناطر الخيرية', 'الخانكة', 'طوخ', 'العبور', 'قها']
  },
  'المنوفية': {
    zone: 'delta',
    cities: ['شبين الكوم', 'مدينة السادات', 'منوف', 'أشمون', 'بركة السبع', 'قويسنا', 'الشهداء', 'تلا']
  },
  'كفر الشيخ': {
    zone: 'delta',
    cities: ['كفر الشيخ', 'دسوق', 'فوه', 'مطوبس', 'بيلا', 'الحامول', 'سيدي سالم', 'الرياض', 'قلين']
  },
  'دمياط': {
    zone: 'delta',
    cities: ['دمياط', 'دمياط الجديدة', 'رأس البر', 'فارسكور', 'الزرقا', 'كفر سعد']
  },
  'الإسماعيلية': {
    zone: 'canal',
    cities: ['الإسماعيلية', 'فايد', 'القنطرة شرق', 'القنطرة غرب', 'التل الكبير', 'أبو صوير']
  },
  'بورسعيد': {
    zone: 'canal',
    cities: ['حي الشرق', 'حي العرب', 'حي المناخ', 'حي الضواحي', 'حي الزهور', 'بورفؤاد']
  },
  'السويس': {
    zone: 'canal',
    cities: ['السويس', 'الأربعين', 'عتاقة', 'فيصل', 'الجناين']
  },
  'الفيوم': {
    zone: 'upper_egypt',
    cities: ['الفيوم', 'سنورس', 'إطسا', 'طامية', 'يوسف الصديق', 'إبشواي']
  },
  'بني سويف': {
    zone: 'upper_egypt',
    cities: ['بني سويف', 'الواسطى', 'ناصر', 'ببا', 'سمسطا', 'الفشن', 'إهناسيا']
  },
  'المنيا': {
    zone: 'upper_egypt',
    cities: ['المنيا', 'ملوي', 'بني مزار', 'مغاغة', 'أبو قرقاص', 'سمالوط', 'مطاي', 'دير مواس']
  },
  'أسيوط': {
    zone: 'upper_egypt',
    cities: ['أسيوط', 'ديروط', 'القوصية', 'أبنوب', 'منفلوط', 'أبو تيج', 'البداري', 'صدفا', 'ساحل سليم']
  },
  'سوهاج': {
    zone: 'upper_egypt',
    cities: ['سوهاج', 'طهطا', 'جرجا', 'المراغة', 'أخميم', 'المنشأة', 'طما', 'البلينا']
  },
  'قنا': {
    zone: 'upper_egypt',
    cities: ['قنا', 'نجع حمادي', 'دشنا', 'أبو تشت', 'قوص', 'نقادة', 'فرشوط']
  },
  'الأقصر': {
    zone: 'upper_egypt',
    cities: ['الأقصر', 'إسنا', 'أرمنت', 'القرنة', 'البياضية', 'الطود']
  },
  'أسوان': {
    zone: 'upper_egypt',
    cities: ['أسوان', 'كوم أمبو', 'إدفو', 'دراو', 'نصر النوبة']
  },
  'مطروح': {
    zone: 'remote',
    cities: ['مرسى مطروح', 'الحمام', 'العلمين', 'الضبعة', 'سيوة']
  },
  'البحر الأحمر': {
    zone: 'remote',
    cities: ['الغردقة', 'سفاجا', 'القصير', 'رأس غارب', 'مرسى علم']
  },
  'جنوب سيناء': {
    zone: 'remote',
    cities: ['شرم الشيخ', 'دهب', 'نويبع', 'طابا', 'طور سيناء', 'رأس سدر']
  },
  'شمال سيناء': {
    zone: 'remote',
    cities: ['العريش', 'بئر العبد', 'الشيخ زويد', 'رفح']
  },
  'الوادي الجديد': {
    zone: 'remote',
    cities: ['الخارجة', 'الداخلة', 'الفرافرة', 'باريس']
  }
};

export default function Home() {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // السلايدر
  const [currentIndex, setCurrentIndex] = useState(0);

  // اختيارات اللون والمقاس
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  // سلة المشتريات
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);

  // بيانات العنوان والمحافظة المختارة
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
      const { data } = await supabase
        .from('store_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (data) {
        let cleanDesc = data.description || '';
        cleanDesc = cleanDesc.replace(/^وصف المنتج ومميزاته هنا\.\.\.?\s*/i, '');

        setProduct({ ...data, description: cleanDesc });

        if (data.show_colors && Array.isArray(data.colors) && data.colors.length > 0) {
          setSelectedColor(data.colors[0].name);
        }
        if (data.show_sizes && Array.isArray(data.sizes) && data.sizes.length > 0) {
          setSelectedSize(data.sizes[0]);
        }

        const defaultRates = data.shipping_rates || {
          cairo_giza: 50,
          alex: 60,
          delta: 65,
          canal: 70,
          upper_egypt: 80,
          remote: 100,
        };
        // السعر الافتراضي قبل اختيار المحافظة
        setCurrentShippingFee(defaultRates.cairo_giza || Number(data.shipping_fee) || 50);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  // تحديث سعر الشحن تلقائياً عند تغيير المحافظة
  const handleGovernorateChange = (gov) => {
    setSelectedGovernorate(gov);
    setSelectedCity('');

    if (!gov || !product?.shipping_rates) return;

    const zoneKey = EGYPT_REGIONS[gov]?.zone || 'cairo_giza';
    const rate = product.shipping_rates[zoneKey] ?? (Number(product.shipping_fee) || 50);
    setCurrentShippingFee(rate);
  };

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
      name: product?.product_name || 'منتج',
      price: Number(product?.product_price) || 0,
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
        content_name: product?.product_name,
        value: product?.product_price,
        currency: 'EGP',
      });
    }

    if (openDrawer) {
      setIsCartOpen(true);
    }
  };

  const updateQuantity = (itemId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeItem = (itemId) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const scrollToCheckout = () => {
    setIsCartOpen(false);

    if (cart.length === 0) {
      handleAddToCart(false);
    }

    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        content_name: product?.product_name,
        value: product?.product_price,
        currency: 'EGP',
      });
    }

    const formElement = document.getElementById('checkout-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
      const nameInput = document.getElementById('customer-name');
      if (nameInput) nameInput.focus();
    }
  };

  // تأكيد وحفظ الطلب
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedGovernorate) {
      alert('يرجى اختيار المحافظة');
      return;
    }

    setOrderLoading(true);

    const itemsToOrder = cart.length > 0 ? cart : [
      {
        name: product?.product_name || 'منتج',
        price: Number(product?.product_price) || 0,
        color: selectedColor || null,
        size: selectedSize || null,
        quantity: 1,
      }
    ];

    const subtotal = itemsToOrder.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shipping = Number(currentShippingFee) || 0;
    const finalTotal = subtotal + shipping;

    const fullAddress = `${selectedGovernorate} - ${selectedCity || 'مركز/مدينة'} - ${formData.detailedAddress}`;

    const { error } = await supabase.from('orders').insert([
      {
        customer_name: formData.name,
        phone: formData.phone,
        governorate: selectedGovernorate,
        city: selectedCity,
        address: fullAddress,
        notes: formData.notes,
        product_name: itemsToOrder.map((i) => `${i.name} (${i.quantity})`).join(' + '),
        total_amount: finalTotal,
        total_price: finalTotal,
        selected_color: itemsToOrder[0]?.color || selectedColor || null,
        selected_size: itemsToOrder[0]?.size || selectedSize || null,
        quantity: itemsToOrder.reduce((acc, i) => acc + i.quantity, 0),
        items: itemsToOrder,
        status: 'جديد',
      },
    ]);

    if (!error) {
      setSuccess(true);
      setCart([]);
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Purchase', {
          content_name: product?.product_name,
          value: finalTotal,
          currency: 'EGP',
        });
      }
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
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-24" dir="rtl">
      {/* شريط الإعلان */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white text-center py-2 px-4 text-xs sm:text-sm font-bold shadow-md tracking-wide">
        🚚 التوصيل متاح لجميع محافظات مصر والدفع عند الاستلام بعد المعاينة والفحص!
      </div>

      {/* الهيدر العلوي واسم المتجر في المنتصف */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 py-4 px-4 sm:px-8 sticky top-0 z-40 shadow-lg shadow-black/20">
        <div className="max-w-4xl mx-auto relative flex items-center justify-between">
          <div className="w-10 sm:w-20"></div>

          <div className="text-center px-2">
            <h1 className="text-xl sm:text-3xl font-black tracking-wider bg-gradient-to-r from-white via-emerald-200 to-emerald-400 bg-clip-text text-transparent drop-shadow-sm select-none">
              {product?.store_name || 'متجرنا الرسمي'}
            </h1>
            <div className="w-12 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full mx-auto mt-1.5 opacity-80"></div>
          </div>

          <div className="w-10 sm:w-20 flex justify-end">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 sm:px-3.5 sm:py-2 bg-slate-800/90 hover:bg-slate-800 rounded-2xl border border-slate-700/80 flex items-center gap-2 transition active:scale-95 shadow-md"
              title="عرض السلة"
            >
              <span className="text-lg sm:text-xl">🛒</span>
              <span className="text-xs font-bold hidden sm:inline text-slate-200">السلة</span>
              {totalCartCount > 0 && (
                <span className="absolute -top-1.5 -left-1.5 bg-emerald-500 text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow-md shadow-emerald-500/50">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-4 sm:p-6 space-y-6">
          
          {/* سلايدر صور المنتج */}
          {galleryImages.length > 0 && (
            <div className="space-y-3">
              <div className="relative w-full bg-black/50 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center min-h-[320px] max-h-[500px] select-none">
                <img
                  src={galleryImages[currentIndex]}
                  alt={product?.product_name}
                  className="w-full h-auto max-h-[480px] object-contain block mx-auto transition-all duration-300"
                />

                {galleryImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-900 border border-slate-600 flex items-center justify-center text-white text-lg transition shadow-lg"
                    >
                      ❮
                    </button>
                    <button
                      type="button"
                      onClick={nextImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-900 border border-slate-600 flex items-center justify-center text-white text-lg transition shadow-lg"
                    >
                      ❯
                    </button>
                    <span className="absolute bottom-3 left-3 bg-black/70 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-300">
                      {currentIndex + 1} / {galleryImages.length}
                    </span>
                  </>
                )}
              </div>

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

          {/* فيديو المنتج */}
          {product?.video_url && (
            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black">
              <video
                src={product.video_url}
                controls
                className="w-full max-h-[450px] object-contain mx-auto"
              />
            </div>
          )}

          {/* تفاصيل المنتج الأساسية: الاسم والسعر */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">{product?.product_name}</h2>
            <div className="flex items-baseline gap-3 mt-3">
              <span className="text-3xl sm:text-4xl font-black text-emerald-400">{product?.product_price} ج.م</span>
              {product?.original_price && (
                <span className="text-xl line-through text-slate-500">{product.original_price} ج.م</span>
              )}
            </div>
            <div className="inline-block mt-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold">
              🚚 الشحن يحسب حسب محافظتك عند تأكيد الطلب
            </div>
          </div>

          {/* تفاصيل ومميزات المنتج تحت الاسم والسعر مباشرة */}
          {product?.description && (
            <div className="p-4 bg-slate-800/70 rounded-2xl border border-slate-700/60 space-y-2">
              <h3 className="text-sm font-bold text-emerald-400">مميزات وتفاصيل المنتج:</h3>
              <p className="text-slate-200 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {product.description}
              </p>
            </div>
          )}

          {/* اختيار الألوان */}
          {product?.show_colors && product.colors?.length > 0 && (
            <div className="space-y-3 border-t border-slate-800 pt-4">
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
            <div className="space-y-3 border-t border-slate-800 pt-4">
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

          {/* أزرار الإجراءات */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-800">
            <button
              type="button"
              id="btn-order-now"
              onClick={scrollToCheckout}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg rounded-2xl shadow-lg shadow-emerald-500/25 transition active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>⚡</span>
              <span>اطلب الآن</span>
            </button>

            <button
              type="button"
              id="btn-add-to-cart"
              onClick={() => handleAddToCart(true)}
              className="w-full py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-base rounded-2xl transition active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>🛒</span>
              <span>أضف إلى السلة</span>
            </button>
          </div>

          {addedNotice && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 rounded-xl text-center text-sm font-bold animate-pulse">
              ✅ تمت إضافة المنتج إلى سلة المشتريات!
            </div>
          )}
        </div>

        {/* نموذج استلام الطلب مع اختيار المحافظة والمركز */}
        <div id="checkout-form" className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl scroll-mt-24">
          <h3 className="text-xl sm:text-2xl font-black text-emerald-400 mb-1 text-center">أدخل بيانات التوصيل</h3>
          <p className="text-xs sm:text-sm text-slate-400 mb-6 text-center">الدفع عند الاستلام بعد فحص ومعاينة المنتج</p>

          {success ? (
            <div className="p-6 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-2xl text-center space-y-3">
              <p className="text-3xl font-black">🎉 تم تأكيد طلبك بنجاح!</p>
              <p className="text-sm sm:text-base">سيتواصل معك فريق خدمة العملاء هاتفياً لتأكيد الشحن والتوصيل.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5 font-medium">الاسم بالكامل</label>
                <input
                  id="customer-name"
                  type="text"
                  required
                  placeholder="محمد أحمد علي"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-400 transition"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1.5 font-medium">رقم الهاتف (الواتساب)</label>
                <input
                  type="tel"
                  required
                  placeholder="01xxxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-400 transition"
                />
              </div>

              {/* القوائم المنسدلة: المحافظة والمركز */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-1.5 font-medium">المحافظة</label>
                  <select
                    required
                    value={selectedGovernorate}
                    onChange={(e) => handleGovernorateChange(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-400 transition cursor-pointer"
                  >
                    <option value="">اختر المحافظة...</option>
                    {Object.keys(EGYPT_REGIONS).map((gov) => (
                      <option key={gov} value={gov}>
                        {gov}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1.5 font-medium">المركز / المدينة</label>
                  <select
                    required
                    disabled={!selectedGovernorate}
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-400 transition cursor-pointer disabled:opacity-50"
                  >
                    <option value="">اختر المركز أو المدينة...</option>
                    {selectedGovernorate &&
                      EGYPT_REGIONS[selectedGovernorate]?.cities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    <option value="مركز آخر">مركز / قرية أخرى</option>
                  </select>
                </div>
              </div>

              {/* العنوان اليدوي التفصيلي */}
              <div>
                <label className="block text-sm text-slate-300 mb-1.5 font-medium">العنوان التفصيلي (الشارع والمنطقة ورقم العقار)</label>
                <textarea
                  required
                  rows="2"
                  placeholder="مثال: شارع الجمهورية، بجوار مسجد النور، عمارة 5 الدور الثاني..."
                  value={formData.detailedAddress}
                  onChange={(e) => setFormData({ ...formData, detailedAddress: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-400 transition"
                ></textarea>
              </div>

              {/* ملخص تكلفة الطلب مع الشحن المخصص */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>سعر المنتج / المنتجات:</span>
                  <span className="font-bold text-white">
                    {cart.length > 0 ? cartSubtotal : (Number(product?.product_price) || 0)} ج.م
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>مصاريف الشحن ({selectedGovernorate || 'حدد المحافظة'}):</span>
                  <span className="font-bold text-emerald-400">{currentShippingFee} ج.م</span>
                </div>
                <div className="border-t border-slate-700 pt-2 flex justify-between font-black text-base">
                  <span>الإجمالي عند الاستلام:</span>
                  <span className="text-emerald-400 text-lg">
                    {(cart.length > 0 ? cartSubtotal : (Number(product?.product_price) || 0)) + currentShippingFee} ج.م
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="btn-confirm-order"
                  disabled={orderLoading}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 rounded-2xl font-black text-lg text-white transition shadow-lg shadow-emerald-500/25 active:scale-[0.99] disabled:opacity-50"
                >
                  {orderLoading ? 'جاري تأكيد طلبك...' : 'تأكيد الطلب والدفع عند الاستلام 🚚'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* نافذة سلة المشتريات المنبثقة */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-md h-full bg-slate-900 border-r border-slate-800 flex flex-col p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🛒</span>
                <h2 className="text-xl font-black text-white">سلة مشترياتك ({totalCartCount})</h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                  <span className="text-5xl">🛍️</span>
                  <p className="text-base font-semibold">سلة المشتريات فارغة حالياً</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-3 bg-slate-800/70 p-3 rounded-2xl border border-slate-700/60 items-center">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl border border-slate-700" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-white line-clamp-1">{item.name}</h4>
                      <p className="text-emerald-400 font-extrabold text-sm mt-0.5">{item.price} ج.م</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        {item.color && <span>اللون: <strong className="text-slate-200">{item.color}</strong></span>}
                        {item.size && <span>المقاس: <strong className="text-slate-200">{item.size}</strong></span>}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-400 hover:text-red-300 text-xs font-bold"
                      >
                        حذف
                      </button>
                      <div className="flex items-center gap-2 bg-slate-700 px-2 py-1 rounded-lg">
                        <button onClick={() => updateQuantity(item.id, -1)} className="text-slate-200 font-bold px-1">−</button>
                        <span className="text-xs font-black">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="text-slate-200 font-bold px-1">+</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-slate-800 pt-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">إجمالي المنتجات:</span>
                  <span className="font-extrabold text-white">{cartSubtotal} ج.م</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">الشحن:</span>
                  <span className="font-extrabold text-emerald-400">{currentShippingFee} ج.م</span>
                </div>
                <div className="flex justify-between items-center text-base border-t border-slate-800 pt-2 font-black">
                  <span>الإجمالي الكلي:</span>
                  <span className="text-emerald-400 text-lg">{cartSubtotal + currentShippingFee} ج.م</span>
                </div>

                <button
                  type="button"
                  onClick={scrollToCheckout}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 font-black text-white text-base rounded-2xl shadow-lg shadow-emerald-500/25 transition active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <span>⚡</span>
                  <span>اطلب الآن وتأكيد البيانات</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* زر الموبايل الثابت */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-slate-900/95 backdrop-blur border-t border-slate-800 z-40 flex items-center gap-3">
        <button
          type="button"
          onClick={scrollToCheckout}
          className="flex-1 py-3 bg-emerald-500 text-white font-black text-base rounded-xl shadow-lg shadow-emerald-500/30"
        >
          اطلب الآن ⚡
        </button>
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="relative px-4 py-3 bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm rounded-xl"
        >
          🛒
          {totalCartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              {totalCartCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
