'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

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

export default function CatalogHome() {
  const [settings, setSettings] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // حالة السلة
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // بيانات الشحن والشراء من السلة
  const [selectedGovernorate, setSelectedGovernorate] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [currentShippingFee, setCurrentShippingFee] = useState(50);
  const [formData, setFormData] = useState({ name: '', phone: '', detailedAddress: '', notes: '' });

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
    async function loadCatalog() {
      setLoading(true);
      try {
        const { data: storeData } = await supabase.from('store_settings').select('*').limit(1).maybeSingle();
        if (storeData) {
          setSettings(storeData);
          if (storeData.shipping_rates?.cairo_giza) {
            setCurrentShippingFee(storeData.shipping_rates.cairo_giza);
          }
        }

        const { data: pData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        let list = pData ? [...pData] : [];

        if (storeData && storeData.product_name) {
          const exists = list.some((p) => p.name === storeData.product_name);
          if (!exists) {
            list.unshift({
              id: 'legacy',
              name: storeData.product_name,
              price: storeData.product_price,
              original_price: storeData.original_price,
              description: storeData.description,
              images: storeData.images || (storeData.image_url ? [storeData.image_url] : []),
            });
          }
        }
        setProducts(list);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    loadCatalog();
  }, []);

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const quickAddToCart = (product) => {
    const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : [];
    const item = {
      id: `${product.id}_${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      image: images[0] || '',
      color: null,
      size: null,
      quantity: 1,
    };
    setCart((prev) => [...prev, item]);
    setIsCartOpen(true);

    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'AddToCart', { content_name: product.name, value: Number(product.price) || 0, currency: 'EGP' });
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

  const handleGovernorateChange = (gov) => {
    setSelectedGovernorate(gov);
    setSelectedCity('');
    if (!gov || !settings?.shipping_rates) return;
    const zoneKey = EGYPT_REGIONS[gov]?.zone || 'cairo_giza';
    const rate = settings.shipping_rates[zoneKey] ?? 50;
    setCurrentShippingFee(rate);
  };

  const handleCartSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGovernorate) {
      alert('يرجى اختيار المحافظة أولاً');
      return;
    }
    if (cart.length === 0) {
      alert('السلة فارغة!');
      return;
    }

    setOrderLoading(true);
    const shipping = Number(currentShippingFee) || 0;
    const finalTotal = cartSubtotal + shipping;
    const fullAddress = `${selectedGovernorate} - ${selectedCity || 'مركز/مدينة'} - ${formData.detailedAddress}`;
    const productsSummary = cart.map((i) => `${i.name} (${i.quantity})`).join(' + ');
    const totalQty = cart.reduce((acc, i) => acc + i.quantity, 0);

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
          selected_color: '-',
          selected_size: '-',
          quantity: totalQty,
          status: 'جديد',
        },
      ]);

      if (error) throw error;

      setOrderSuccess(true);
      setCart([]);
      localStorage.removeItem('fast_order_cart');

      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Purchase', { content_name: productsSummary, value: finalTotal, currency: 'EGP' });
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
          quantity: totalQty,
          shipping_fee: shipping,
          total_amount: finalTotal,
          notes: formData.notes,
        }),
      }).catch((err) => console.error(err));

    } catch (err) {
      alert('خطأ أثناء تأكيد الطلب: ' + err.message);
    }
    setOrderLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold">جاري تحميل المتجر...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24 antialiased" dir="rtl">
      {/* شريط الإعلان */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white text-center py-2.5 px-4 text-xs sm:text-sm font-bold shadow-md">
        🚚 التوصيل متاح لجميع المحافظات • الدفع عند الاستلام بعد المعاينة!
      </div>

      {/* الترويسة مع زر السلة */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 py-4 px-4 sm:px-8 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛍️</span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">{settings?.store_name || 'متجرنا الرسمي'}</h1>
              <p className="text-xs text-slate-400">تصفح منتجاتنا واطلب مباشرة</p>
            </div>
          </div>

          <button
            onClick={() => { setIsCartOpen(true); setOrderSuccess(false); }}
            className="relative px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-emerald-950/40"
          >
            <span>🛒</span>
            <span>السلة</span>
            {totalCartCount > 0 && (
              <span className="bg-white text-emerald-950 text-xs px-2 py-0.5 rounded-full font-black animate-pulse">
                {totalCartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* كتالوج المنتجات */}
      <main className="max-w-6xl mx-auto p-4 sm:p-8 space-y-6">
        <div className="text-center py-4 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">المنتجات المتاحة</h2>
          <p className="text-xs sm:text-sm text-slate-400">اختر المنتج لعرض خيارات الألوان والمقاسات أو أضفه مباشرة للسلة</p>
          <div className="w-16 h-1 bg-emerald-500 rounded-full mx-auto mt-2"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const image = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null;
            const productLink = product.id === 'legacy' ? `/p/legacy` : `/p/${product.id}`;

            return (
              <div
                key={product.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between transition-all hover:border-emerald-500/60 group"
              >
                <div className="p-5 space-y-4">
                  <Link href={productLink} className="block relative w-full h-56 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 p-2 flex items-center justify-center">
                    {image ? (
                      <img src={image} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <span className="text-5xl text-slate-600">📦</span>
                    )}
                  </Link>

                  <div className="space-y-2">
                    <Link href={productLink}>
                      <h3 className="font-black text-lg text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-2xl font-black text-emerald-400">{product.price} ج.م</span>
                      {product.original_price && (
                        <span className="text-sm line-through text-slate-500">{product.original_price} ج.م</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 grid grid-cols-2 gap-2">
                  <Link
                    href={productLink}
                    className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition text-center flex items-center justify-center"
                  >
                    التفاصيل
                  </Link>
                  <button
                    type="button"
                    onClick={() => quickAddToCart(product)}
                    className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1"
                  >
                    <span>🛒</span>
                    <span>أضف للسلة</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* دراوَر نافذة السلة الجانبية المنبثقة */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end transition-opacity">
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

            {orderSuccess ? (
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-center space-y-2 mt-6">
                <p className="text-2xl font-black">🎉 تم تأكيد طلبك بنجاح!</p>
                <p className="text-xs text-slate-300">سيتواصل معك فريق خدمة العملاء هاتفياً لتأكيد الشحن.</p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-4 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                >
                  إغلاق السلة
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
                      <div key={item.id} className="flex gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800/80 items-center">
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
                          <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-300 text-[11px] font-bold">
                            حذف
                          </button>
                          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-lg">
                            <button onClick={() => updateQuantity(item.id, -1)} className="text-white font-bold px-1">−</button>
                            <span className="text-xs font-black text-emerald-400">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="text-white font-bold px-1">+</button>
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
                        <span>الشحن ({selectedGovernorate || 'حدد المحافظة'}):</span>
                        <span className="text-emerald-400 font-bold">{currentShippingFee} ج.م</span>
                      </div>
                      <div className="flex justify-between text-sm font-black border-t border-slate-800 pt-1.5">
                        <span className="text-white">الإجمالي النهائي:</span>
                        <span className="text-emerald-400 text-base">{cartSubtotal + currentShippingFee} ج.م</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <input
                        type="text"
                        required
                        placeholder="الاسم بالكامل"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                      <input
                        type="tel"
                        required
                        placeholder="رقم الهاتف"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          required
                          value={selectedGovernorate}
                          onChange={(e) => handleGovernorateChange(e.target.value)}
                          className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
                        >
                          <option value="">المحافظة...</option>
                          {Object.keys(EGYPT_REGIONS).map((g) => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                        <select
                          required
                          disabled={!selectedGovernorate}
                          value={selectedCity}
                          onChange={(e) => setSelectedCity(e.target.value)}
                          className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none disabled:opacity-50"
                        >
                          <option value="">المركز...</option>
                          {selectedGovernorate &&
                            EGYPT_REGIONS[selectedGovernorate]?.cities.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          <option value="مركز آخر">مركز آخر</option>
                        </select>
                      </div>
                      <textarea
                        required
                        rows="2"
                        placeholder="العنوان بالتفصيل"
                        value={formData.detailedAddress}
                        onChange={(e) => setFormData({ ...formData, detailedAddress: e.target.value })}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      ></textarea>

                      <button
                        type="submit"
                        disabled={orderLoading}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 font-black text-white text-sm rounded-xl transition shadow-lg disabled:opacity-50"
                      >
                        {orderLoading ? 'جاري تأكيد الطلب...' : 'تأكيد طلب السلة 🚚'}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* زر السلة العائم أسفل الشاشة للموبايل */}
      <button
        onClick={() => { setIsCartOpen(true); setOrderSuccess(false); }}
        className="fixed bottom-5 left-5 z-40 bg-emerald-600 hover:bg-emerald-500 text-white p-3.5 rounded-full shadow-2xl flex items-center justify-center transition active:scale-95 border-2 border-emerald-400/40"
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
