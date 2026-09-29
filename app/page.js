'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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

const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbw_zn4XtPgmuksXCQ8VsiUamby9bqj_OVuqJ4fEPhG9vHRww2qjsEvjuNg8SKSTJCwnbg/exec';

export default function Home() {
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
    try {
      const savedCart = localStorage.getItem('fast_order_cart');
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('fast_order_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  useEffect(() => {
    async function loadInitialData() {
      const { data: storeData } = await supabase.from('store_settings').select('*').eq('id', 1).single();
      if (storeData) {
        setSettings(storeData);
        const defaultRates = storeData.shipping_rates || { cairo_giza: 50 };
        setCurrentShippingFee(defaultRates.cairo_giza || 50);
      }

      const { data: productsData } = await supabase.from('products').select('*').order('created_at', { ascending: false }).limit(1);

      if (productsData && productsData.length > 0) {
        const prod = productsData[0];
        setProduct(prod);
        if (prod.show_colors && Array.isArray(prod.colors) && prod.colors.length > 0) {
          setSelectedColor(prod.colors[0].name);
        }
        if (prod.show_sizes && Array.isArray(prod.sizes) && prod.sizes.length > 0) {
          setSelectedSize(prod.sizes[0]);
        }
      } else {
        const { data: legacyData } = await supabase.from('store_settings').select('*').eq('id', 1).single();
        if (legacyData && legacyData.product_name) {
          setProduct({
            name: legacyData.product_name,
            price: legacyData.product_price,
            original_price: legacyData.original_price,
            description: legacyData.description,
            images: legacyData.images || (legacyData.image_url ? [legacyData.image_url] : []),
            video_url: legacyData.video_url,
            show_colors: legacyData.show_colors,
            colors: legacyData.colors,
            show_sizes: legacyData.show_sizes,
            sizes: legacyData.sizes,
          });
        }
      }

      setLoading(false);
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!settings) return;

    if (settings.fb_pixel_id && typeof window !== 'undefined') {
      if (!window.fbq) {
        (function(f, b, e, v, n, t, s) {
          if (f.fbq) return;
          n = f.fbq = function() {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
          };
          if (!f._fbq) f._fbq = n;
          n.push = n;
          n.loaded = !0;
          n.version = '2.0';
          n.queue = [];
          t = b.createElement(e);
          t.async = !0;
          t.src = v;
          s = b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t, s);
        })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

        window.fbq('init', settings.fb_pixel_id.trim());
        window.fbq('track', 'PageView');
      }
    }

    if (settings.tiktok_pixel_id && typeof window !== 'undefined') {
      if (!window.ttq) {
        (function(w, d, t) {
          w.TiktokAnalyticsObject = t;
          var ttq = (w[t] = w[t] || []);
          ttq.methods = [
            'page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'
          ];
          ttq.setAndDefer = function(t, e) {
            t[e] = function() {
              t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
            };
          };
          for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
          ttq.instance = function(t) {
            for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
            return e;
          };
          ttq.load = function(e, n) {
            var i = 'https://analytics.tiktok.com/i18n/pixel/events.js';
            ttq._i = ttq._i || {};
            ttq._i[e] = [];
            ttq._i[e]._u = i;
            ttq._t = ttq._t || {};
            ttq._t[e] = +new Date();
            ttq._o = ttq._o || {};
            ttq._o[e] = n || {};
            var o = document.createElement('script');
            o.type = 'text/javascript';
            o.async = !0;
            o.src = i + '?sdkid=' + e + '&lib=' + t;
            var a = document.getElementsByTagName('script')[0];
            a.parentNode.insertBefore(o, a);
          };
          ttq.load(settings.tiktok_pixel_id.trim());
          ttq.page();
        })(window, document, 'ttq');
      }
    }
  }, [settings]);

  const handleGovernorateChange = (gov) => {
    setSelectedGovernorate(gov);
    setSelectedCity('');

    if (!gov || !settings?.shipping_rates) return;

    const zoneKey = EGYPT_REGIONS[gov]?.zone || 'cairo_giza';
    const rate = settings.shipping_rates[zoneKey] ?? 50;
    setCurrentShippingFee(rate);
  };

  const galleryImages = Array.isArray(product?.images) && product.images.length > 0 ? product.images : [];

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

    if (typeof window !== 'undefined') {
      if (window.fbq) {
        window.fbq('track', 'AddToCart', {
          content_name: product?.name,
          value: product?.price,
          currency: 'EGP',
        });
      }
      if (window.ttq) {
        window.ttq.track('AddToCart', {
          content_name: product?.name,
          value: product?.price,
          currency: 'EGP',
        });
      }
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

    if (typeof window !== 'undefined') {
      if (window.fbq) {
        window.fbq('track', 'InitiateCheckout', {
          content_name: product?.name,
          value: product?.price,
          currency: 'EGP',
        });
      }
      if (window.ttq) {
        window.ttq.track('InitiateCheckout', {
          content_name: product?.name,
          value: product?.price,
          currency: 'EGP',
        });
      }
    }

    const formElement = document.getElementById('checkout-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
      const nameInput = document.getElementById('customer-name');
      if (nameInput) nameInput.focus();
    }
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

    try {
      await fetch(GOOGLE_SHEET_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
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
      });
    } catch (sheetError) {
      console.error('Google Sheets error:', sheetError);
    }

    if (!error) {
      setSuccess(true);
      setCart([]);
      localStorage.removeItem('fast_order_cart');

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
    } else {
      alert('حدث خطأ أثناء إرسال الطلب: ' + error.message);
    }
    setOrderLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-base font-bold text-slate-600">جاري تحميل المتجر...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-28 antialiased" dir="rtl">
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white text-center py-2.5 px-4 text-xs sm:text-sm font-bold shadow-sm tracking-wide">
        🚚 التوصيل متاح لجميع محافظات مصر • الدفع عند الاستلام بعد المعاينة والفحص!
      </div>

      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 py-4 px-4 sm:px-8 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto relative flex items-center justify-between">
          <div className="w-10 sm:w-20"></div>

          <div className="text-center px-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 drop-shadow-sm select-none">
              {settings?.store_name || 'متجرنا الرسمي'}
            </h1>
            <div className="w-12 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mx-auto mt-1.5"></div>
          </div>

          <div className="w-10 sm:w-20 flex justify-end">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 sm:px-3.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl border border-slate-200 flex items-center gap-2 transition active:scale-95 shadow-sm"
              title="عرض السلة"
            >
              <span className="text-lg sm:text-xl">🛒</span>
              <span className="text-xs font-bold hidden sm:inline text-slate-700">السلة</span>
              {totalCartCount > 0 && (
                <span className="absolute -top-1.5 -left-1.5 bg-emerald-600 text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow-md">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-lg p-5 sm:p-7 space-y-6">
          {galleryImages.length > 0 && (
            <div className="space-y-3">
              <div className="relative w-full bg-slate-100/70 rounded-2xl overflow-hidden border border-slate-200/80 flex items-center justify-center min-h-[320px] max-h-[520px] select-none p-2">
                <img
                  src={galleryImages[currentIndex]}
                  alt={product?.name}
                  className="w-full h-auto max-h-[500px] object-contain block mx-auto transition-all duration-300"
                />

                {galleryImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 border border-slate-200 flex items-center justify-center text-lg transition shadow-md"
                    >
                      ❮
                    </button>
                    <button
                      type="button"
                      onClick={nextImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 border border-slate-200 flex items-center justify-center text-lg transition shadow-md"
                    >
                      ❯
                    </button>
                    <span className="absolute bottom-3 left-3 bg-white/90 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 shadow-sm">
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
                        currentIndex === idx ? 'border-emerald-600 scale-105 shadow-md' : 'border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {product?.video_url && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-black">
              <video
                src={product.video_url}
                controls
                className="w-full max-h-[450px] object-contain mx-auto"
              />
            </div>
          )}

          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {product?.name}
            </h2>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black text-emerald-600">{product?.price} ج.م</span>
              {product?.original_price && (
                <span className="text-xl line-through text-slate-400 font-medium">{product.original_price} ج.م</span>
              )}
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-bold">
              <span>🚚</span>
              <span>الشحن يحدد تلقائياً حسب محافظتك عند تأكيد الطلب</span>
            </div>
          </div>

          {product?.description && (
            <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                مميزات وتفاصيل المنتج:
              </h3>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line text-sm sm:text-base font-normal">
                {product.description}
              </p>
            </div>
          )}

          {product?.show_colors && product.colors?.length > 0 && (
            <div className="space-y-3 border-t border-slate-100 pt-5">
              <span className="block text-sm font-bold text-slate-700">
                اللون المختار: <strong className="text-emerald-600 font-extrabold">{selectedColor}</strong>
              </span>
              <div className="flex flex-wrap gap-2.5">
                {product.colors.map((c, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedColor(c.name)}
                    className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border text-sm font-semibold transition ${
                      selectedColor === c.name
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full border border-slate-300 shadow-inner" style={{ backgroundColor: c.code }}></span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {product?.show_sizes && product.sizes?.length > 0 && (
            <div className="space-y-3 border-t border-slate-100 pt-5">
              <span className="block text-sm font-bold text-slate-700">
                المقاس المختار: <strong className="text-emerald-600 font-extrabold">{selectedSize}</strong>
              </span>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedSize(s)}
                    className={`min-w-[54px] px-4 py-2.5 rounded-xl border text-sm font-black transition ${
                      selectedSize === s
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100">
            <button
              type="button"
              id="btn-order-now"
              onClick={scrollToCheckout}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg rounded-2xl shadow-lg shadow-emerald-600/20 transition active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>⚡</span>
              <span>اطلب الآن</span>
            </button>

            <button
              type="button"
              id="btn-add-to-cart"
              onClick={() => handleAddToCart(true)}
              className="w-full py-4 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold text-base rounded-2xl transition active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>🛒</span>
              <span>أضف إلى السلة</span>
            </button>
          </div>

          {addedNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-700 rounded-xl text-center text-sm font-bold animate-pulse">
              ✅ تمت إضافة المنتج إلى سلة المشتريات ومحفوظ في جهازك!
            </div>
          )}
        </div>

        <div id="checkout-form" className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-lg scroll-mt-24">
          <div className="text-center mb-6">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">أدخل بيانات التوصيل</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">الدفع عند الاستلام نقداً بعد فحص ومعاينة الشحنة</p>
          </div>

          {success ? (
            <div className="p-6 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-center space-y-3">
              <p className="text-3xl font-black">🎉 تم تأكيد طلبك بنجاح!</p>
              <p className="text-sm sm:text-base text-slate-700">سيتواصل معك فريق خدمة العملاء هاتفياً لتأكيد الشحن والتوصيل.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-700 mb-1.5 font-bold">الاسم بالكامل</label>
                <input
                  id="customer-name"
                  type="text"
                  required
                  placeholder="محمد أحمد علي"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-1.5 font-bold">رقم الهاتف (الواتساب)</label>
                <input
                  type="tel"
                  required
                  placeholder="01xxxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-700 mb-1.5 font-bold">المحافظة</label>
                  <select
                    required
                    value={selectedGovernorate}
                    onChange={(e) => handleGovernorateChange(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition cursor-pointer font-medium"
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
                  <label className="block text-sm text-slate-700 mb-1.5 font-bold">المركز / المدينة</label>
                  <select
                    required
                    disabled={!selectedGovernorate}
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition cursor-pointer disabled:opacity-50 font-medium"
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

              <div>
                <label className="block text-sm text-slate-700 mb-1.5 font-bold">العنوان التفصيلي (الشارع والمنطقة ورقم العقار)</label>
                <textarea
                  required
                  rows="2"
                  placeholder="مثال: شارع الجمهورية، بجوار مسجد النور، عمارة 5 الدور الثاني..."
                  value={formData.detailedAddress}
                  onChange={(e) => setFormData({ ...formData, detailedAddress: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                ></textarea>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>سعر المنتج / المنتجات:</span>
                  <span className="font-bold text-slate-800">
                    {cart.length > 0 ? cartSubtotal : (Number(product?.price) || 0)} ج.م
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>مصاريف الشحن ({selectedGovernorate || 'حدد المحافظة'}):</span>
                  <span className="font-bold text-emerald-700">{currentShippingFee} ج.م</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-base">
                  <span className="text-slate-900">الإجمالي عند الاستلام:</span>
                  <span className="text-emerald-700 text-xl font-black">
                    {(cart.length > 0 ? cartSubtotal : (Number(product?.price) || 0)) + currentShippingFee} ج.م
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="btn-confirm-order"
                  disabled={orderLoading}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg rounded-2xl shadow-lg shadow-emerald-600/20 transition active:scale-[0.99] disabled:opacity-50"
                >
                  {orderLoading ? 'جاري تأكيد طلبك...' : 'تأكيد الطلب والدفع عند الاستلام 🚚'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-md h-full bg-white border-r border-slate-200 flex flex-col p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🛒</span>
                <h2 className="text-xl font-black text-slate-900">سلة مشترياتك ({totalCartCount})</h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                  <span className="text-5xl">🛍️</span>
                  <p className="text-base font-bold text-slate-600">سلة المشتريات فارغة حالياً</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 items-center">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl border border-slate-200" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{item.name}</h4>
                      <p className="text-emerald-700 font-extrabold text-sm mt-0.5">{item.price} ج.م</p>
                      <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
                        {item.color && <span>اللون: <strong className="text-slate-800">{item.color}</strong></span>}
                        {item.size && <span>المقاس: <strong className="text-slate-800">{item.size}</strong></span>}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-bold"
                      >
                        حذف
                      </button>
                      <div className="flex items-center gap-2 bg-white border border-slate-300 px-2 py-1 rounded-lg">
                        <button onClick={() => updateQuantity(item.id, -1)} className="text-slate-800 font-bold px-1">−</button>
                        <span className="text-xs font-black text-slate-900">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="text-slate-800 font-bold px-1">+</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">إجمالي المنتجات:</span>
                  <span className="font-extrabold text-slate-900">{cartSubtotal} ج.م</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">الشحن:</span>
                  <span className="font-extrabold text-emerald-700">{currentShippingFee} ج.م</span>
                </div>
                <div className="flex justify-between items-center text-base border-t border-slate-200 pt-2 font-black">
                  <span className="text-slate-900">الإجمالي الكلي:</span>
                  <span className="text-emerald-700 text-lg">{cartSubtotal + currentShippingFee} ج.م</span>
                </div>

                <button
                  type="button"
                  onClick={scrollToCheckout}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 font-black text-white text-base rounded-2xl shadow-lg shadow-emerald-600/20 transition active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <span>⚡</span>
                  <span>اطلب الآن وتأكيد البيانات</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur border-t border-slate-200 z-40 flex items-center gap-3 shadow-lg">
        <button
          type="button"
          onClick={scrollToCheckout}
          className="flex-1 py-3 bg-emerald-600 text-white font-black text-base rounded-xl shadow-md shadow-emerald-600/20"
        >
          اطلب الآن ⚡
        </button>
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="relative px-4 py-3 bg-slate-100 text-slate-800 border border-slate-200 font-bold text-sm rounded-xl"
        >
          🛒
          {totalCartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {totalCartCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
