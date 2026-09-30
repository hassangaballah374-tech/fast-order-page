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

  // السلة
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartOrderLoading, setCartOrderLoading] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [addedPopup, setAddedPopup] = useState(false);

  const hasFiredCheckout = useRef(false);

  // شحن مباشر
  const [selectedGovernorate, setSelectedGovernorate] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [currentShippingFee, setCurrentShippingFee] = useState(50);
  const [formData, setFormData] = useState({ name: '', phone: '', detailedAddress: '', notes: '' });

  // شحن السلة
  const [cartGov, setCartGov] = useState('');
  const [cartCity, setCartCity] = useState('');
  const [cartShippingFee, setCartShippingFee] = useState(50);
  const [cartForm, setCartForm] = useState({ name: '', phone: '', detailedAddress: '' });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('fast_order_cart');
      if (saved) setCart(JSON.parse(saved));
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
    async function loadProductData() {
      setLoading(true);
      try {
        const { data: sData } = await supabase.from('store_settings').select('*').limit(1).maybeSingle();
        if (sData) {
          setSettings(sData);
          if (sData.shipping_rates?.cairo_giza) {
            setCurrentShippingFee(sData.shipping_rates.cairo_giza);
            setCartShippingFee(sData.shipping_rates.cairo_giza);
          }
        }

        let prod = null;
        if (productId === 'legacy') {
          if (sData && sData.product_name) {
            prod = {
              id: 'legacy',
              name: sData.product_name,
              price: Number(sData.product_price) || 0,
              compare_price: Number(sData.original_price) || null,
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

          if (typeof window !== 'undefined') {
            if (window.fbq) {
              window.fbq('track', 'ViewContent', { content_name: prod.name, value: Number(prod.price) || 0, currency: 'EGP' });
            }
            if (window.ttq) {
              window.ttq.track('ViewContent', { content_name: prod.name, value: Number(prod.price) || 0, currency: 'EGP' });
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

  const handleCartGovChange = (gov) => {
    setCartGov(gov);
    setCartCity('');
    if (!gov || !settings?.shipping_rates) return;
    const zoneKey = EGYPT_REGIONS[gov]?.zone || 'cairo_giza';
    const rate = settings.shipping_rates[zoneKey] ?? 50;
    setCartShippingFee(rate);
  };

  const galleryImages = Array.isArray(product?.images) && product.images.length > 0 ? product.images : [];

  const handleAddToCart = () => {
    if (product?.show_colors && product.colors?.length > 0 && !selectedColor) {
      alert('يرجى اختيار اللون أولاً');
      return;
    }
    if (product?.show_sizes && product.sizes?.length > 0 && !selectedSize) {
      alert('يرجى اختيار المقاس أولاً');
      return;
    }

    const newItem = {
      id: `${product.id}_${selectedColor || ''}_${selectedSize || ''}_${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      image: galleryImages[0] || '',
      color: selectedColor || null,
      size: selectedSize || null,
      quantity: quantity,
    };

    setCart((prev) => [...prev, newItem]);
    setAddedPopup(true);
    setTimeout(() => setAddedPopup(false), 2500);

    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'AddToCart', {
        content_name: product.name,
        value: (Number(product.price) || 0) * quantity,
        currency: 'EGP',
      });
    }
  };

  const updateCartQty = (itemId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeCartItem = (itemId) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const scrollToCheckout = () => {
    if (!hasFiredCheckout.current) {
      hasFiredCheckout.current = true;
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'InitiateCheckout', {
          content_name: product?.name,
          value: (Number(product?.price) || 0) * quantity,
          currency: 'EGP',
        });
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

      setSuccess(true);
      setOrderLoading(false);

      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Purchase', { content_name: product?.name, value: finalTotal, currency: 'EGP' });
      }

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

  const handleCartSubmit = async (e) => {
    e.preventDefault();
    if (!cartGov) {
      alert('يرجى اختيار المحافظة في السلة');
      return;
    }
    if (cart.length === 0) return;

    setCartOrderLoading(true);
    const shipping = Number(cartShippingFee) || 0;
    const finalTotal = cartSubtotal + shipping;
    const fullAddress = `${cartGov} - ${cartCity || 'مركز/مدينة'} - ${cartForm.detailedAddress}`;
    const productsSummary = cart.map((i) => `${i.name} (${i.quantity})`).join(' + ');
    const colorsSummary = cart.map((i) => i.color).filter(Boolean).join(', ') || '-';
    const sizesSummary = cart.map((i) => i.size).filter(Boolean).join(', ') || '-';
    const totalQty = cart.reduce((acc, i) => acc + i.quantity, 0);

    try {
      const { error } = await supabase.from('orders').insert([
        {
          customer_name: cartForm.name,
          phone: cartForm.phone,
          governorate: cartGov,
          city: cartCity,
          address: fullAddress,
          product_name: productsSummary,
          total_amount: finalTotal,
          total_price: finalTotal,
          selected_color: colorsSummary,
          selected_size: sizesSummary,
          quantity: totalQty,
          status: 'جديد',
        },
      ]);

      if (error) throw error;

      setCartSuccess(true);
      setCart([]);
      localStorage.removeItem('fast_order_cart');

      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Purchase', { content_name: productsSummary, value: finalTotal, currency: 'EGP' });
      }

      fetch(GOOGLE_SHEET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          name: cartForm.name,
          phone: cartForm.phone,
          governorate: cartGov,
          city: cartCity,
          address: cartForm.detailedAddress,
          product_name: productsSummary,
          quantity: totalQty,
          shipping_fee: shipping,
          total_amount: finalTotal,
        }),
      }).catch((err) => console.error(err));

    } catch (err) {
      alert('خطأ أثناء تأكيد طلب السلة: ' + err.message);
    }
    setCartOrderLoading(false);
  };

  // حساب دقيق لنسبة الخصم ومبلغ التوفير
  const currentSellingPrice = Number(product?.price) || 0;
  const originalOldPrice = Number(product?.compare_price || product?.original_price) || 0;
  const hasDiscount = originalOldPrice > currentSellingPrice && currentSellingPrice > 0;
  const discountPercent = hasDiscount
    ? Math.round(((originalOldPrice - currentSellingPrice) / originalOldPrice) * 100)
    : 0;
  const savedAmount = hasDiscount ? (originalOldPrice - currentSellingPrice) : 0;

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
        <h2 className="text-2xl font-black">المنتج غير موجود!</h2>
        <Link href="/" className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl text-sm">العودة للمتجر</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-28 antialiased" dir="rtl">
      {/* شريط الإعلان */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white text-center py-2.5 px-4 text-xs sm:text-sm font-bold shadow-md">
        🚚 التوصيل لجميع محافظات مصر • الدفع عند الاستلام بعد المعاينة والفحص!
      </div>

      {/* الترويسة العلوية */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 py-3.5 px-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xs sm:text-sm font-bold text-emerald-400 flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700">
            <span>‹</span>
            <span>كل المنتجات</span>
          </Link>

          <button
            onClick={() => { setIsCartOpen(true); setCartSuccess(false); }}
            className="relative px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
          >
            <span>🛒</span>
            <span>السلة</span>
            {totalCartCount > 0 && (
              <span className="bg-white text-emerald-950 text-[11px] px-1.5 py-0.2 rounded-full font-black">
                {totalCartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* إشعار الإضافة للسلة */}
      {addedPopup && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-2.5 rounded-2xl shadow-2xl font-bold text-xs sm:text-sm flex items-center gap-2 animate-bounce">
          <span>✅</span>
          <span>تمت إضافة المنتج إلى السلة بنجاح!</span>
        </div>
      )}

      <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-6 shadow-2xl">
          
          {/* معرض الصور مع شارة الخصم العلوية */}
          {galleryImages.length > 0 && (
            <div className="space-y-3">
              <div className="relative w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center min-h-[300px] max-h-[460px] p-2">
                <img src={galleryImages[currentIndex]} alt={product.name} className="w-full h-auto max-h-[440px] object-contain mx-auto" />
                
                {/* شارة الخصم البارزة على الصورة */}
                {hasDiscount && (
                  <div className="absolute top-3 right-3 bg-red-600 text-white font-black px-3 py-1.5 rounded-2xl shadow-xl flex items-center gap-1 text-xs sm:text-sm animate-pulse">
                    <span>🔥</span>
                    <span>خصم {discountPercent}%</span>
                  </div>
                )}

                {galleryImages.length > 1 && (
                  <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-300">
                    {currentIndex + 1} / {galleryImages.length}
                  </div>
                )}
              </div>
              {galleryImages.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 ${currentIndex === idx ? 'border-emerald-500' : 'border-slate-800 opacity-60'}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* فيديو المنتج */}
          {product.video_url && (
            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black">
              <video src={product.video_url} controls className="w-full max-h-[420px] object-contain mx-auto" />
            </div>
          )}

          {/* اسم المنتج وقسم الأسعار ونسبة الخصم والتوفير */}
          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-white">{product.name}</h2>
            
            {/* كتلة الأسعار مع شارة الخصم الصريحة */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 block font-bold">السعر الآن لفترة محدودة:</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-400">{currentSellingPrice} ج.م</span>
                  {hasDiscount && (
                    <span className="text-base sm:text-lg line-through text-slate-500 font-bold">
                      {originalOldPrice} ج.م
                    </span>
                  )}
                </div>
              </div>

              {/* بطاقات الخصم والتوفير للعميل */}
              {hasDiscount && (
                <div className="flex flex-col items-end gap-1.5">
                  <span className="bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-xs sm:text-sm px-3.5 py-1.5 rounded-xl shadow-lg flex items-center gap-1">
                    <span>⚡</span>
                    <span>خصم {discountPercent}%</span>
                  </span>
                  <span className="text-[11px] text-emerald-400 font-black bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                    وفرت: {savedAmount} ج.م
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* وصف المنتج */}
          {product.description && (
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {product.description}
            </div>
          )}

          {/* الألوان */}
          {product.show_colors && product.colors?.length > 0 && (
            <div className="space-y-2.5 border-t border-slate-800 pt-4">
              <span className="block text-xs sm:text-sm font-bold text-slate-300">
                اللون: <strong className="text-emerald-400">{selectedColor}</strong>
              </span>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedColor(c.name)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-bold transition ${selectedColor === c.name ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-slate-800 bg-slate-950 text-slate-400'}`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-700" style={{ backgroundColor: c.code }}></span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* المقاسات */}
          {product.show_sizes && product.sizes?.length > 0 && (
            <div className="space-y-2.5 border-t border-slate-800 pt-4">
              <span className="block text-xs sm:text-sm font-bold text-slate-300">
                المقاس: <strong className="text-emerald-400">{selectedSize}</strong>
              </span>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedSize(s)}
                    className={`min-w-[48px] px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-black transition ${selectedSize === s ? 'border-emerald-500 bg-emerald-600 text-white' : 'border-slate-800 bg-slate-950 text-slate-400'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* الكمية */}
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

          {/* زر اطلب الآن وزر أضف للسلة جنباً إلى جنب */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={scrollToCheckout}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base sm:text-lg rounded-2xl shadow-xl shadow-emerald-950/40 transition active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>⚡</span>
              <span>اطلب الآن - الدفع عند الاستلام</span>
            </button>

            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-base sm:text-lg rounded-2xl border border-slate-700 transition active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg"
            >
              <span>🛒</span>
              <span>أضف إلى السلة</span>
            </button>
          </div>
        </div>

        {/* نموذج الشراء المباشر */}
        <div id="checkout-form" className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl scroll-mt-20">
          <div className="text-center mb-6">
            <h3 className="text-xl sm:text-2xl font-black text-white">بيانات توصيل الطلب</h3>
            <p className="text-xs text-slate-400 mt-1">الدفع نقداً بعد استلام وفحص الشحنة</p>
          </div>

          {success ? (
            <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl text-center space-y-3">
              <p className="text-3xl font-black">🎉 تم تأكيد طلبك بنجاح!</p>
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
                <label className="block text-xs font-bold text-slate-400 mb-1.5">العنوان بالتفصيل</label>
                <textarea
                  required
                  rows="2"
                  placeholder="اسم الشارع، رقم العمارة، أو علامة مميزة..."
                  value={formData.detailedAddress}
                  onChange={(e) => setFormData({ ...formData, detailedAddress: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-sm"
                ></textarea>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>سعر المنتج ({quantity} قطعة):</span>
                  <span className="font-bold text-white">{currentSellingPrice * quantity} ج.م</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>الشحن ({selectedGovernorate || 'حدد المحافظة'}):</span>
                  <span className="font-bold text-emerald-400">{currentShippingFee} ج.م</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between font-black text-sm sm:text-base">
                  <span className="text-white">المبلغ عند الاستلام:</span>
                  <span className="text-emerald-400 text-xl">{(currentSellingPrice * quantity) + currentShippingFee} ج.م</span>
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

      {/* دراوَر السلة الجانبي */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md h-full bg-slate-900 border-r border-slate-800 flex flex-col p-6 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🛒</span>
                <h2 className="text-xl font-black text-white">سلة المشتريات ({totalCartCount})</h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {cartSuccess ? (
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-center space-y-2 mt-6">
                <p className="text-2xl font-black">🎉 تم تأكيد طلب السلة بنجاح!</p>
                <p className="text-xs text-slate-300">سيتواصل معك فريق خدمة العملاء لتأكيد الشحن.</p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-4 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                >
                  إغلاق
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 py-4 space-y-3">
                  {cart.length === 0 ? (
                    <div className="py-16 text-center text-slate-500 font-bold space-y-2">
                      <span className="text-4xl block">🛍️</span>
                      <p>السلة فارغة حالياً</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="flex gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800 items-center">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-xl border border-slate-800" />
                        )}
                        <div className="flex-1">
                          <h4 className="font-bold text-xs text-white line-clamp-1">{item.name}</h4>
                          <p className="text-emerald-400 font-black text-xs mt-0.5">{item.price} ج.م</p>
                          {(item.color || item.size) && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {item.color && `لون: ${item.color} `}
                              {item.size && `مقاس: ${item.size}`}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
                          <button onClick={() => removeCartItem(item.id)} className="text-red-400 hover:text-red-300 text-[11px] font-bold">
                            حذف
                          </button>
                          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-lg">
                            <button onClick={() => updateCartQty(item.id, -1)} className="text-white font-bold px-1">−</button>
                            <span className="text-xs font-black text-emerald-400">{item.quantity}</span>
                            <button onClick={() => updateCartQty(item.id, 1)} className="text-white font-bold px-1">+</button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <form onSubmit={handleCartSubmit} className="border-t border-slate-800 pt-4 space-y-3">
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>إجمالي المنتجات:</span>
                        <span className="text-white font-bold">{cartSubtotal} ج.م</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>الشحن ({cartGov || 'حدد المحافظة'}):</span>
                        <span className="text-emerald-400 font-bold">{cartShippingFee} ج.م</span>
                      </div>
                      <div className="flex justify-between text-sm font-black border-t border-slate-800 pt-1.5">
                        <span className="text-white">الإجمالي النهائي:</span>
                        <span className="text-emerald-400 text-base">{cartSubtotal + cartShippingFee} ج.م</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <input
                        type="text"
                        required
                        placeholder="الاسم بالكامل"
                        value={cartForm.name}
                        onChange={(e) => setCartForm({ ...cartForm, name: e.target.value })}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                      <input
                        type="tel"
                        required
                        placeholder="رقم الهاتف"
                        value={cartForm.phone}
                        onChange={(e) => setCartForm({ ...cartForm, phone: e.target.value })}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          required
                          value={cartGov}
                          onChange={(e) => handleCartGovChange(e.target.value)}
                          className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
                        >
                          <option value="">المحافظة...</option>
                          {Object.keys(EGYPT_REGIONS).map((g) => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                        <select
                          required
                          disabled={!cartGov}
                          value={cartCity}
                          onChange={(e) => setCartCity(e.target.value)}
                          className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none disabled:opacity-50"
                        >
                          <option value="">المركز...</option>
                          {cartGov &&
                            EGYPT_REGIONS[cartGov]?.cities.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          <option value="مركز آخر">مركز آخر</option>
                        </select>
                      </div>
                      <textarea
                        required
                        rows="2"
                        placeholder="العنوان بالتفصيل"
                        value={cartForm.detailedAddress}
                        onChange={(e) => setCartForm({ ...cartForm, detailedAddress: e.target.value })}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      ></textarea>

                      <button
                        type="submit"
                        disabled={cartOrderLoading}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 font-black text-white text-sm rounded-xl transition shadow-lg disabled:opacity-50"
                      >
                        {cartOrderLoading ? 'جاري تأكيد الطلب...' : 'تأكيد طلب السلة 🚚'}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* زر السلة العائم */}
      <button
        onClick={() => { setIsCartOpen(true); setCartSuccess(false); }}
        className="fixed bottom-5 left-5 z-40 bg-emerald-600 hover:bg-emerald-500 text-white p-3.5 rounded-full shadow-2xl flex items-center justify-center transition active:scale-95 border-2 border-emerald-400/40"
        title="فتح سلة المشتريات"
      >
        <span className="text-xl">🛒</span>
        {totalCartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow">
            {totalCartCount}
          </span>
        )}
      </button>

    </div>
  );
}
