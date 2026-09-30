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

export default function LuxuryProductPage() {
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

  // إضافات تفاعلية و FOMO
  const [particles, setParticles] = useState([]);
  const [liveVisitors, setLiveVisitors] = useState(17);
  const [stockLeft, setStockLeft] = useState(6);
  const [timeLeft, setTimeLeft] = useState({ minutes: 14, seconds: 48 });

  const hasFiredCheckout = useRef(false);

  // الشحن المباشر
  const [selectedGovernorate, setSelectedGovernorate] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [currentShippingFee, setCurrentShippingFee] = useState(50);
  const [formData, setFormData] = useState({ name: '', phone: '', detailedAddress: '', notes: '' });

  // سلة المشتريات
  const [cartGov, setCartGov] = useState('');
  const [cartCity, setCartCity] = useState('');
  const [cartShippingFee, setCartShippingFee] = useState(50);
  const [cartForm, setCartForm] = useState({ name: '', phone: '', detailedAddress: '' });

  // عداد الـ FOMO المتناقص
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { minutes: prev.minutes - 1, seconds: 59 };
        return { minutes: 15, seconds: 0 };
      });
    }, 1000);

    const visitorInterval = setInterval(() => {
      setLiveVisitors((v) => Math.floor(Math.random() * 9) + 14);
    }, 7000);

    return () => {
      clearInterval(timer);
      clearInterval(visitorInterval);
    };
  }, []);

  // جلب السلة من المتصفح
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

  // جلب المنتج والبيكسل
  useEffect(() => {
    async function loadData() {
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
    loadData();
  }, [productId]);

  // تأثير تفجير القلوب والإيموجيز التفاعلية عند النقر
  const triggerParticles = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const emojis = ['💖', '🔥', '✨', '⚡', '🎉', '🌟', '🛍️'];
    const newItems = Array.from({ length: 12 }).map((_, i) => ({
      id: Date.now() + i,
      x: rect.left + rect.width / 2 + (Math.random() * 80 - 40),
      y: rect.top + (Math.random() * 40 - 20),
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      vx: (Math.random() - 0.5) * 160,
      vy: -(Math.random() * 120 + 80),
    }));

    setParticles((prev) => [...prev, ...newItems]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newItems.some((n) => n.id === p.id)));
    }, 1000);
  };

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

  // الإضافة إلى السلة مع المؤثرات
  const handleAddToCart = (e) => {
    if (product?.show_colors && product.colors?.length > 0 && !selectedColor) {
      alert('يرجى اختيار اللون أولاً');
      return;
    }
    if (product?.show_sizes && product.sizes?.length > 0 && !selectedSize) {
      alert('يرجى اختيار المقاس أولاً');
      return;
    }

    triggerParticles(e);

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

    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'AddToCart', {
        content_name: product.name,
        value: (Number(product.price) || 0) * quantity,
        currency: 'EGP',
      });
    }

    setTimeout(() => {
      setIsCartOpen(true);
    }, 350);
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

  const scrollToCheckout = (e) => {
    triggerParticles(e);
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

  // تأكيد الطلب المباشر
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
          selected_color: selectedColor || '-',
          selected_size: selectedSize || '-',
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
          color: selectedColor || '-',
          size: selectedSize || '-',
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

  // تأكيد طلب السلة
  const handleCartSubmit = async (e) => {
    e.preventDefault();
    if (!cartGov) {
      alert('يرجى اختيار المحافظة أولاً');
      return;
    }
    if (cart.length === 0) return;

    setCartOrderLoading(true);
    const shipping = Number(cartShippingFee) || 0;
    const finalTotal = cartSubtotal + shipping;
    const fullAddress = `${cartGov} - ${cartCity || 'مركز/مدينة'} - ${cartForm.detailedAddress}`;
    const productsSummary = cart.map((i) => `${i.name} (${i.quantity})`).join(' + ');

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
          selected_color: cart.map((i) => i.color).filter(Boolean).join(', ') || '-',
          selected_size: cart.map((i) => i.size).filter(Boolean).join(', ') || '-',
          quantity: totalCartCount,
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
          quantity: totalCartCount,
          shipping_fee: shipping,
          total_amount: finalTotal,
        }),
      }).catch((err) => console.error(err));

    } catch (err) {
      alert('خطأ أثناء تأكيد طلب السلة: ' + err.message);
    }
    setCartOrderLoading(false);
  };

  // حساب الخصم والتوفير
  const currentSellingPrice = Number(product?.price) || 0;
  const originalOldPrice = Number(product?.compare_price || product?.original_price) || 0;
  const hasDiscount = originalOldPrice > currentSellingPrice && currentSellingPrice > 0;
  const discountPercent = hasDiscount
    ? Math.round(((originalOldPrice - currentSellingPrice) / originalOldPrice) * 100)
    : 0;
  const savedAmount = hasDiscount ? originalOldPrice - currentSellingPrice : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex items-center justify-center font-sans" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-xs">⚡</div>
          </div>
          <p className="text-slate-400 font-bold tracking-wide animate-pulse">جاري تجهيز التجربة الفاخرة...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex flex-col items-center justify-center gap-4 font-sans p-6 text-center" dir="rtl">
        <span className="text-6xl animate-bounce">💎</span>
        <h2 className="text-2xl font-black">المنتج غير موجود أو تم نقله</h2>
        <Link href="/" className="px-7 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-2xl text-sm shadow-xl hover:brightness-110 transition">
          العودة للكتالوج الرئيسي
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans pb-32 antialiased selection:bg-emerald-500 selection:text-black" dir="rtl">
      
      {/* 1. طبقة البارتكلز المتحركة عند الضغط (Confetti Particles) */}
      <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
        {particles.map((p) => (
          <span
            key={p.id}
            style={{
              left: `${p.x}px`,
              top: `${p.y}px`,
              transform: `translate(${p.vx}px, ${p.vy}px) scale(${Math.random() * 0.8 + 0.8})`,
              transition: 'all 0.9s cubic-bezier(0.1, 0.9, 0.2, 1)',
            }}
            className="absolute text-xl select-none"
          >
            {p.emoji}
          </span>
        ))}
      </div>

      {/* 2. شريط الطوارئ والعرض الحصري التنازلي الفاخر (FOMO Bar) */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-b border-emerald-500/30 text-white text-center py-2.5 px-4 text-xs sm:text-sm font-bold shadow-lg flex items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full text-[11px] border border-emerald-500/30 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          عرض حصري
        </span>
        <span>اطلب خلال</span>
        <span className="font-mono bg-black/60 px-2 py-0.5 rounded-lg text-emerald-300 font-black border border-emerald-500/40">
          {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
        </span>
        <span>للحصول على الشحن السريع ومعاينة مجانية قبل الدفع! 🎁</span>
      </div>

      {/* 3. الترويسة الشفافة الزجاجية (Glass Header) */}
      <header className="bg-[#0b1324]/80 backdrop-blur-xl border-b border-slate-800/80 py-3.5 px-4 sm:px-8 sticky top-0 z-40 shadow-xl">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-xs sm:text-sm font-bold text-slate-300 hover:text-white flex items-center gap-2 bg-slate-900/90 px-3.5 py-2 rounded-2xl border border-slate-700/60 transition hover:border-emerald-500/60 shadow"
          >
            <span>‹</span>
            <span>الكتالوج</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h1 className="text-base sm:text-lg font-black text-white tracking-wide">{settings?.store_name || 'VIP Store'}</h1>
          </div>

          <button
            onClick={() => { setIsCartOpen(true); setCartSuccess(false); }}
            className="relative px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2 shadow-lg shadow-emerald-950/60 border border-emerald-400/30 active:scale-95"
          >
            <span>🛒</span>
            <span className="hidden sm:inline">السلة</span>
            {totalCartCount > 0 && (
              <span className="bg-white text-emerald-950 text-xs px-2 py-0.2 rounded-full font-black animate-pulse">
                {totalCartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">

        {/* 4. كارت المنتج الأسطوري (Luxury Product Container) */}
        <div className="relative bg-gradient-to-b from-[#0f172a] to-[#0b1324] border border-slate-800/90 rounded-[32px] p-5 sm:p-8 space-y-6 shadow-2xl backdrop-blur-sm overflow-hidden">
          
          {/* لمسة إضاءة علوية ناعمة (Glow) */}
          <div className="absolute top-0 right-1/4 w-72 h-32 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full"></div>

          {/* مؤشر حي: الزوار والمخزون المتبقي */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#070b14]/70 p-3 rounded-2xl border border-slate-800/80 text-xs font-bold">
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>يشاهد هذا المنتج الآن <strong className="text-white font-black">{liveVisitors}</strong> عميلاً</span>
            </div>

            <div className="flex items-center gap-1.5 text-amber-400">
              <span>🔥</span>
              <span>متبقي في المخزن: <strong className="text-white bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30">{stockLeft} قطع</strong> فقط</span>
            </div>
          </div>

          {/* 5. معرض الصور التفاعلي السينمائي */}
          {galleryImages.length > 0 && (
            <div className="space-y-3.5">
              <div className="relative w-full bg-[#050811] rounded-3xl overflow-hidden border border-slate-800/80 flex items-center justify-center min-h-[320px] max-h-[500px] p-3 shadow-inner group">
                <img
                  src={galleryImages[currentIndex]}
                  alt={product.name}
                  className="w-full h-auto max-h-[460px] object-contain mx-auto transition-transform duration-500 group-hover:scale-105"
                />

                {/* شارة الخصم الفاخرة المزدوجة */}
                {hasDiscount && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white font-black px-3.5 py-1.5 rounded-2xl shadow-2xl flex items-center gap-1.5 text-xs sm:text-sm border border-red-400/40 animate-pulse">
                    <span>⚡</span>
                    <span>خصم {discountPercent}%</span>
                  </div>
                )}

                {/* مؤشر رقم الصورة */}
                {galleryImages.length > 1 && (
                  <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur border border-slate-700/60 px-3 py-1 rounded-xl text-xs font-bold text-slate-300 shadow">
                    {currentIndex + 1} / {galleryImages.length}
                  </div>
                )}
              </div>

              {/* مصغرات المعرض */}
              {galleryImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-20 h-20 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all duration-300 p-1 bg-[#050811] ${
                        currentIndex === idx
                          ? 'border-emerald-500 scale-105 shadow-lg shadow-emerald-950/60 ring-2 ring-emerald-500/20'
                          : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-700'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover rounded-xl" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* فيديو المنتج إن وجد */}
          {product.video_url && (
            <div className="rounded-3xl overflow-hidden border border-slate-800 bg-black shadow-xl">
              <video src={product.video_url} controls className="w-full max-h-[440px] object-contain mx-auto" />
            </div>
          )}

          {/* 6. كتلة الاسم والأسعار مع حساب التوفير */}
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-wide">{product.name}</h2>

            <div className="bg-gradient-to-r from-[#050811] via-[#091122] to-[#050811] p-5 rounded-3xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-4 shadow-lg">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 block font-bold">السعر النهائي بعد التخفيض:</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">{currentSellingPrice} ج.م</span>
                  {hasDiscount && (
                    <span className="text-base sm:text-lg line-through text-slate-500 font-bold decoration-red-500/60">
                      {originalOldPrice} ج.م
                    </span>
                  )}
                </div>
              </div>

              {hasDiscount && (
                <div className="flex flex-col items-end gap-1.5">
                  <span className="bg-red-500/15 border border-red-500/30 text-red-400 font-black text-xs sm:text-sm px-3.5 py-1.5 rounded-xl shadow-md">
                    وفرت اليوم: {savedAmount} ج.م 💰
                  </span>
                  <span className="text-[11px] text-emerald-400 font-bold">شامل المعاينة قبل الاستلام</span>
                </div>
              )}
            </div>
          </div>

          {/* الوصف */}
          {product.description && (
            <div className="p-4 sm:p-5 bg-[#050811]/90 rounded-3xl border border-slate-800/80 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line shadow-inner">
              {product.description}
            </div>
          )}

          {/* 7. خيارات الألوان بشكل أزرار فخمة متناسقة */}
          {product.show_colors && product.colors?.length > 0 && (
            <div className="space-y-3 border-t border-slate-800/80 pt-4">
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                <span className="text-slate-300">اختر اللون المفضل:</span>
                <span className="text-emerald-400 font-black">{selectedColor}</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {product.colors.map((c, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedColor(c.name)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-black transition-all active:scale-95 ${
                      selectedColor === c.name
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-lg shadow-emerald-950/50 ring-2 ring-emerald-500/30'
                        : 'border-slate-800 bg-[#050811] text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: c.code }}></span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 8. خيارات المقاسات */}
          {product.show_sizes && product.sizes?.length > 0 && (
            <div className="space-y-3 border-t border-slate-800/80 pt-4">
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                <span className="text-slate-300">اختر المقاس المناسب:</span>
                <span className="text-emerald-400 font-black">{selectedSize}</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {product.sizes.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedSize(s)}
                    className={`min-w-[54px] px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-black transition-all active:scale-95 ${
                      selectedSize === s
                        ? 'border-emerald-500 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/50 ring-2 ring-emerald-500/30'
                        : 'border-slate-800 bg-[#050811] text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 9. عداد الكمية */}
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
            <span className="text-xs sm:text-sm font-bold text-slate-300">الكمية المطلوبة:</span>
            <div className="flex items-center gap-4 bg-[#050811] border border-slate-800 px-3.5 py-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-base flex items-center justify-center transition active:scale-90"
              >
                −
              </button>
              <span className="text-base font-black text-white w-6 text-center">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-base flex items-center justify-center transition active:scale-90"
              >
                +
              </button>
            </div>
          </div>

          {/* 10. الأزرار الخارقة (Super Buttons مع Shimmer والبارتكلز) */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3.5 border-t border-slate-800/80">
            {/* زر اطلب الآن مع وميض ضوئي فخم */}
            <button
              type="button"
              onClick={scrollToCheckout}
              className="relative overflow-hidden w-full py-4 sm:py-4.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:brightness-110 text-white font-black text-base sm:text-lg rounded-2xl shadow-2xl shadow-emerald-950/60 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2.5 border border-emerald-300/30 group"
            >
              {/* شريط الإضاءة المار فوق الزر */}
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></span>
              <span className="text-xl animate-pulse">⚡</span>
              <span>اطلب الآن - الدفع عند الاستلام</span>
            </button>

            {/* زر أضف إلى السلة مع انطلاق الإيموجيز */}
            <button
              type="button"
              onClick={handleAddToCart}
              className="relative w-full py-4 sm:py-4.5 bg-gradient-to-r from-slate-900 to-[#0f172a] hover:from-slate-800 hover:to-slate-900 text-white font-black text-base sm:text-lg rounded-2xl border border-slate-700/80 hover:border-emerald-500/60 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2.5 shadow-xl shadow-black/50"
            >
              <span className="text-xl">🛒</span>
              <span>أضف إلى السلة</span>
            </button>
          </div>

          {/* 11. شارات الثقة الفارهة (Luxury Guarantee Badges) */}
          <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-slate-800/80 text-center">
            <div className="bg-[#050811] p-3 rounded-2xl border border-slate-800/60 space-y-1">
              <span className="text-xl block">🛡️</span>
              <span className="text-[11px] font-bold text-slate-300 block">معاينة قبل الاستلام</span>
              <span className="text-[9px] text-slate-500 block">افحص منتجك بيدك</span>
            </div>

            <div className="bg-[#050811] p-3 rounded-2xl border border-slate-800/60 space-y-1">
              <span className="text-xl block">🔄</span>
              <span className="text-[11px] font-bold text-slate-300 block">ضمان استبدال 14 يوم</span>
              <span className="text-[9px] text-slate-500 block">استبدال سهل وسريع</span>
            </div>

            <div className="bg-[#050811] p-3 rounded-2xl border border-slate-800/60 space-y-1">
              <span className="text-xl block">⚡</span>
              <span className="text-[11px] font-bold text-slate-300 block">شحن فوري سريع</span>
              <span className="text-[9px] text-slate-500 block">خلال 24 - 48 ساعة</span>
            </div>
          </div>

        </div>

        {/* 12. نموذج إدخال بيانات الطلب (High-Conversion Checkout Card) */}
        <div id="checkout-form" className="bg-gradient-to-b from-[#0f172a] to-[#0b1324] border border-slate-800/90 rounded-[32px] p-5 sm:p-8 shadow-2xl scroll-mt-20 space-y-6">
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center text-2xl mx-auto shadow-inner">
              📝
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">بيانات توصيل الطلب</h3>
            <p className="text-xs text-slate-400">ادخل بياناتك وسيتم شحن طلبك والتواصل معك فوراً</p>
          </div>

          {success ? (
            <div className="p-8 bg-gradient-to-b from-emerald-950/40 to-slate-900 border border-emerald-500/40 text-emerald-300 rounded-3xl text-center space-y-4 shadow-2xl animate-fade-in">
              <span className="text-6xl block animate-bounce">🎉</span>
              <p className="text-2xl sm:text-3xl font-black text-white">تم تأكيد طلبك بنجاح!</p>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                شكراً لثقتك بنا! يقوم فريق الدعم بتجهيز شحنتك وسنتصل بك هاتفياً لتأكيد موعد التسليم.
              </p>
              <Link
                href="/"
                className="inline-block mt-4 px-7 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-2xl text-xs sm:text-sm shadow-xl hover:brightness-110 transition"
              >
                متابعة تصفح باقي المنتجات 🛍️
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">الاسم بالكامل *</label>
                <input
                  type="text"
                  required
                  placeholder="محمد أحمد علي"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-4 rounded-2xl bg-[#050811] border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">رقم الهاتف (الواتساب) للتأكيد *</label>
                <input
                  type="tel"
                  required
                  placeholder="01xxxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-4 rounded-2xl bg-[#050811] border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm font-mono transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">المحافظة *</label>
                  <select
                    required
                    value={selectedGovernorate}
                    onChange={(e) => handleGovernorateChange(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-[#050811] border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">اختر المحافظة...</option>
                    {Object.keys(EGYPT_REGIONS).map((gov) => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">المركز / المدينة *</label>
                  <select
                    required
                    disabled={!selectedGovernorate}
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-[#050811] border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-40"
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
                <label className="block text-xs font-bold text-slate-300 mb-1.5">العنوان بالتفصيل (الشارع وعلامة مميزة) *</label>
                <textarea
                  required
                  rows="2"
                  placeholder="اسم الشارع، رقم العمارة، الشقة، علامة بجوارك..."
                  value={formData.detailedAddress}
                  onChange={(e) => setFormData({ ...formData, detailedAddress: e.target.value })}
                  className="w-full p-4 rounded-2xl bg-[#050811] border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm transition"
                ></textarea>
              </div>

              {/* ملخص الفاتورة الشفاف */}
              <div className="bg-[#050811] p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>سعر المنتج ({quantity} قطعة):</span>
                  <span className="font-bold text-white">{currentSellingPrice * quantity} ج.م</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>مصاريف الشحن ({selectedGovernorate || 'حدد المحافظة'}):</span>
                  <span className="font-bold text-emerald-400">{currentShippingFee} ج.م</span>
                </div>
                <div className="border-t border-slate-800 pt-2.5 flex justify-between font-black text-sm sm:text-base">
                  <span className="text-white">المبلغ النهائي عند الاستلام:</span>
                  <span className="text-emerald-400 text-xl font-black">
                    {(currentSellingPrice * quantity) + currentShippingFee} ج.م
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={orderLoading}
                className="w-full py-4.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:brightness-110 text-white font-black text-lg rounded-2xl shadow-2xl shadow-emerald-950/60 transition-all duration-300 active:scale-95 disabled:opacity-50 border border-emerald-400/30"
              >
                {orderLoading ? 'جاري تسجيل طلبك الفاخر...' : 'تأكيد الطلب والدفع عند الاستلام 🚚'}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* 13. دراوَر السلة الجانبي المنبثق الفاخر (VIP Cart Drawer) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex justify-end">
          <div className="w-full max-w-md h-full bg-[#0b1324] border-r border-slate-800 flex flex-col p-6 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🛒</span>
                <h2 className="text-xl font-black text-white">سلة المشتريات ({totalCartCount})</h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-9 h-9 rounded-2xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold transition"
              >
                ✕
              </button>
            </div>

            {cartSuccess ? (
              <div className="p-8 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-3xl text-center space-y-3 mt-6">
                <p className="text-3xl font-black">🎉 تم تأكيد طلب السلة!</p>
                <p className="text-xs text-slate-300">سيتواصل معك فريق خدمة العملاء لتأكيد الشحن والتسليم.</p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-4 px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-lg"
                >
                  إغلاق السلة
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 py-4 space-y-3">
                  {cart.length === 0 ? (
                    <div className="py-20 text-center text-slate-500 font-bold space-y-3">
                      <span className="text-5xl block animate-bounce">🛍️</span>
                      <p className="text-sm">سلتك فارغة، أضف منتجاتك المفضلة الآن</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="flex gap-3 bg-[#050811] p-3.5 rounded-2xl border border-slate-800/80 items-center">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl border border-slate-800" />
                        )}
                        <div className="flex-1">
                          <h4 className="font-bold text-xs sm:text-sm text-white line-clamp-1">{item.name}</h4>
                          <p className="text-emerald-400 font-black text-xs mt-1">{item.price} ج.م</p>
                          {(item.color || item.size) && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {item.color && `لون: ${item.color} `}
                              {item.size && `مقاس: ${item.size}`}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <button onClick={() => removeCartItem(item.id)} className="text-red-400 hover:text-red-300 text-xs font-bold">
                            حذف
                          </button>
                          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-lg">
                            <button onClick={() => updateCartQty(item.id, -1)} className="text-white font-bold px-1.5">−</button>
                            <span className="text-xs font-black text-emerald-400">{item.quantity}</span>
                            <button onClick={() => updateCartQty(item.id, 1)} className="text-white font-bold px-1.5">+</button>
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
                      <div className="flex justify-between text-sm font-black border-t border-slate-800 pt-2">
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
                        className="w-full p-3 bg-[#050811] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                      <input
                        type="tel"
                        required
                        placeholder="رقم الهاتف"
                        value={cartForm.phone}
                        onChange={(e) => setCartForm({ ...cartForm, phone: e.target.value })}
                        className="w-full p-3 bg-[#050811] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          required
                          value={cartGov}
                          onChange={(e) => handleCartGovChange(e.target.value)}
                          className="w-full p-3 bg-[#050811] border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
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
                          className="w-full p-3 bg-[#050811] border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none disabled:opacity-40"
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
                        className="w-full p-3 bg-[#050811] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      ></textarea>

                      <button
                        type="submit"
                        disabled={cartOrderLoading}
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 font-black text-white text-sm rounded-xl transition shadow-xl"
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

      {/* 14. الشريط السفلي اللاصق الفاخر للموبايل (Sticky Bottom Mobile Action Bar) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-[#0b1324]/90 backdrop-blur-xl border-t border-slate-800 p-3 sm:hidden shadow-2xl flex items-center gap-2.5">
        <button
          onClick={scrollToCheckout}
          className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-1.5 active:scale-95"
        >
          <span>⚡</span>
          <span>اطلب الآن ({currentSellingPrice} ج.م)</span>
        </button>

        <button
          onClick={handleAddToCart}
          className="px-4 py-3 bg-slate-800 text-white rounded-xl font-black text-sm border border-slate-700 flex items-center justify-center active:scale-95"
        >
          <span>🛒</span>
        </button>
      </div>

    </div>
  );
}
