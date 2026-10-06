'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function PublicStoreCheckoutPage() {
  const { slug } = useParams();

  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState(null);
  const [storeSettings, setStoreSettings] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // اختيارات الزبون
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  // بيانات فورم الشراء
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    phone: '',
    governorate: 'القاهرة',
    address: '',
    notes: '',
  });

  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState(null);

  // قائمة المحافظات المصرية
  const governorates = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'البحيرة', 'الغربية', 'المنوفية',
    'الشرقية', 'الدقهلية', 'كفر الشيخ', 'القليوبية', 'دمياط', 'بورسعيد',
    'الإسماعيلية', 'السويس', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط',
    'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر', 'مطروح',
  ];

  useEffect(() => {
    if (slug) loadStoreFront();
  }, [slug]);

  async function loadStoreFront() {
    setLoading(true);
    try {
      if (supabase) {
        // 1. جلب بيانات المتجر بناءً على الـ slug
        const { data: store } = await supabase
          .from('store_profiles')
          .select('*')
          .eq('store_slug', slug)
          .maybeSingle();

        if (!store) {
          setLoading(false);
          return;
        }
        setStoreData(store);

        // 2. جلب إعدادات وبيكسلات المتجر
        const { data: sData } = await supabase
          .from('merchant_settings')
          .select('*')
          .eq('user_id', store.user_id)
          .maybeSingle();
        if (sData) setStoreSettings(sData);

        // 3. جلب منتجات هذا المتجر
        const { data: pData } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', store.user_id)
          .order('created_at', { ascending: false });

        if (pData && pData.length > 0) {
          setProducts(pData);
          const firstProd = pData[0];
          setSelectedProduct(firstProd);
          if (firstProd.sizes?.length) setSelectedSize(firstProd.sizes[0]);
          if (firstProd.colors?.length) setSelectedColor(firstProd.colors[0]);

          // تسجيل زيارة ومشاهدة للمنتج والمتجر
          await supabase.from('store_analytics').insert([{
            user_id: store.user_id,
            event_type: 'visit',
            store_slug: slug,
          }]);

          await supabase.from('products')
            .update({ views_count: (firstProd.views_count || 0) + 1 })
            .eq('id', firstProd.id);

          // إطلاق حدث ViewContent للبيكسل
          triggerMetaPixel('ViewContent', {
            content_name: firstProd.name,
            value: firstProd.price,
            currency: 'EGP',
          }, sData, firstProd);
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  // محرك تتبع بيكسل فيسبوك
  function triggerMetaPixel(eventName, eventData, merchantConfig, productObj) {
    const pixelId = productObj?.custom_pixel_id || merchantConfig?.pixel_1;
    if (!pixelId) return;

    // استدعاء البيكسل من المتصفح إن وُجد
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', eventName, eventData);
    }
  }

  // إرسال ومتابعة الطلب
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    // التحقق من رقم الهاتف المصري
    const phoneClean = orderForm.phone.trim();
    const phoneRegex = /^01[0125][0-9]{8}$/;
    if (!phoneRegex.test(phoneClean)) {
      alert('يرجى كتابة رقم هاتف مصري صحيح يبدأ بـ 01 ومكون من 11 رقماً للتواصل والشحن.');
      return;
    }

    setSubmittingOrder(true);
    try {
      const totalAmount = Number(selectedProduct.price) * quantity;

      const orderPayload = {
        user_id: storeData.user_id,
        customer_name: orderForm.customerName.trim(),
        phone: phoneClean,
        governorate: orderForm.governorate,
        address: orderForm.address.trim(),
        product_name: `${selectedProduct.name} ${selectedSize ? `(مقاس: ${selectedSize})` : ''} ${selectedColor ? `(لون: ${selectedColor})` : ''}`,
        quantity: quantity,
        total_amount: totalAmount,
        cost_price: Number(selectedProduct.cost_price || 0),
        status: 'جديد',
      };

      const { data: createdOrder, error } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select()
        .single();

      if (error) throw error;

      // تحديث عدادات مبيعات المنتج
      await supabase.from('products').update({
        sales_count: (selectedProduct.sales_count || 0) + 1,
        stock: Math.max(0, (selectedProduct.stock || 20) - quantity),
      }).eq('id', selectedProduct.id);

      // تسجيل حدث شراء في التحليلات
      await supabase.from('store_analytics').insert([{
        user_id: storeData.user_id,
        event_type: 'purchase',
        store_slug: slug,
      }]);

      // إطلاق حدث Purchase في البيكسل
      triggerMetaPixel('Purchase', {
        content_name: selectedProduct.name,
        value: totalAmount,
        currency: 'EGP',
        num_items: quantity,
      }, storeSettings, selectedProduct);

      setOrderSuccessData({
        ...orderPayload,
        orderId: createdOrder?.id ? createdOrder.id.slice(0, 8).toUpperCase() : 'ORD-' + Date.now().toString().slice(-6),
      });

    } catch (err) {
      alert('حدث خطأ أثناء إرسال الطلب: ' + err.message);
    }
    setSubmittingOrder(false);
  };

  // الشراء السريع عبر واتساب
  const handleWhatsAppOrder = () => {
    if (!selectedProduct) return;
    const phone = storeSettings?.support_phone || storeData?.phone || '01000000000';
    const total = Number(selectedProduct.price) * quantity;
    const text = encodeURIComponent(
      `مرحباً، أود تأكيد طلبي من متجركم (${storeData?.store_name}):\n\n` +
      `📦 المنتج: ${selectedProduct.name}\n` +
      `📏 المقاس: ${selectedSize || 'افتراضي'}\n` +
      `🎨 اللون: ${selectedColor || 'افتراضي'}\n` +
      `🔢 الكمية: ${quantity}\n` +
      `💰 الإجمالي: ${total} ج.م\n\n` +
      `يرجى تأكيد التوصيل والدفع عند الاستلام!`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center font-sans" dir="rtl">
        <div className="font-bold text-lg animate-pulse flex items-center gap-3">
          <span>🛍️</span>
          <span>جاري تجهيز متجر {slug}...</span>
        </div>
      </div>
    );
  }

  if (!storeData) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <span className="text-5xl mb-4">🏪</span>
        <h1 className="text-2xl font-black mb-2">المتجر غير متوفر أو الرابط غير صحيح</h1>
        <p className="text-slate-400 text-sm max-w-md">يرجى التأكد من رابط المتجر أو مراجعة إدارة منصة NEXT ORDER لتفعيل الحساب.</p>
      </div>
    );
  }

  // شاشة الشكر وإتمام الطلب بنجاح
  if (orderSuccessData) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="max-w-lg w-full bg-[#111827] border border-emerald-500/30 rounded-3xl p-6 sm:p-10 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center text-4xl mx-auto">
            ✓
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">تم استلام طلبك بنجاح!</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              شكراً لتسوقك من <strong className="text-emerald-400">{storeData.store_name}</strong>. سنتواصل معك هاتفياً لتأكيد الشحن والتوصيل.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs text-right space-y-2 text-slate-300">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">رقم الطلب:</span>
              <strong className="text-white font-mono">{orderSuccessData.orderId}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">المنتج:</span>
              <strong className="text-white">{orderSuccessData.product_name}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">العنوان:</span>
              <strong className="text-white">{orderSuccessData.governorate} - {orderSuccessData.address}</strong>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-400">المبلغ المطلوب عند الاستلام:</span>
              <strong className="text-emerald-400 font-black text-sm">{orderSuccessData.total_amount} ج.م</strong>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => { setOrderSuccessData(null); setQuantity(1); }}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition cursor-pointer"
            >
              العودة للتسوق والمزيد من المنتجات 🛍️
            </button>
            <button
              onClick={handleWhatsAppOrder}
              className="w-full py-3 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/30 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>💬</span>
              <span>متابعة الشحن والتأكيد عبر واتساب</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // تجميع كافة الوسائط (الصور + الفيديو)
  const allMedia = [
    ...(selectedProduct?.videos || []).map(v => ({ type: 'video', url: v })),
    ...(selectedProduct?.images || []).map(img => ({ type: 'image', url: img })),
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white font-sans pb-20 select-none" dir="rtl">
      
      {/* 🌟 1. الشريط الترويجي العلوي */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white text-[11px] font-black py-2 px-4 text-center tracking-wide">
        {storeSettings?.announcement_text || '🚚 شحن سريع لجميع محافظات مصر والدفع عند الاستلام بعد المعاينة!'}
      </div>

      {/* 🌟 2. الرأس العلوي بشعار المنصة وشعار المتجر */}
      <header className="bg-[#111827] border-b border-slate-800 px-4 sm:px-8 py-3.5 sticky top-0 z-40 backdrop-blur-md bg-opacity-90">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            {storeSettings?.store_logo ? (
              <img src={storeSettings.store_logo} alt="Logo" className="w-10 h-10 rounded-xl object-contain bg-white p-0.5 border border-slate-700 shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-lg">
                {storeData.store_name?.charAt(0) || 'N'}
              </div>
            )}
            <div>
              <h1 className="text-base sm:text-lg font-black text-white leading-tight">{storeData.store_name}</h1>
              <p className="text-[11px] text-slate-400 line-clamp-1">{storeSettings?.store_description || 'أفضل المنتجات بأعلى جودة وضمان حقيقي'}</p>
            </div>
          </div>

          {/* شعار منصة NEXT ORDER الرسمي في رأس المتجر */}
          <div className="flex items-center gap-1.5 pl-2 border-r border-slate-800 pr-3">
            <span className="text-[10px] text-slate-500 font-bold hidden sm:inline">مدعوم بواسطة</span>
            <span className="text-xs font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              NEXT ORDER
            </span>
          </div>

        </div>
      </header>

      {/* 🌟 3. محتوى المتجر والشراء السريع */}
      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-8">
        
        {/* قائمة التبديل بين المنتجات إذا كان لدى المتجر أكثر من منتج */}
        {products.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {products.map((prod) => (
              <button
                key={prod.id}
                onClick={() => {
                  setSelectedProduct(prod);
                  setActiveMediaIndex(0);
                  if (prod.sizes?.length) setSelectedSize(prod.sizes[0]);
                  if (prod.colors?.length) setSelectedColor(prod.colors[0]);
                }}
                className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition cursor-pointer border ${
                  selectedProduct?.id === prod.id
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg'
                    : 'bg-[#111827] text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {prod.name}
              </button>
            ))}
          </div>
        )}

        {selectedProduct ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* 📸 العمود الأيمن: معرض الصور ومُشغل الفيديو */}
            <div className="lg:col-span-6 space-y-4">
              
              <div className="w-full h-80 sm:h-[420px] bg-[#111827] border border-slate-800 rounded-3xl overflow-hidden relative flex items-center justify-center shadow-xl">
                {allMedia.length > 0 ? (
                  allMedia[activeMediaIndex]?.type === 'video' ? (
                    <video
                      src={allMedia[activeMediaIndex].url}
                      controls
                      autoPlay
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={allMedia[activeMediaIndex].url}
                      alt={selectedProduct.name}
                      className="w-full h-full object-contain p-2"
                    />
                  )
                ) : (
                  <span className="text-5xl text-slate-700">🛍️</span>
                )}

                {/* شارة الخصم */}
                {selectedProduct.discount_percent > 0 && (
                  <div className="absolute top-4 right-4 bg-red-600 text-white font-black text-xs px-3 py-1 rounded-xl shadow-lg">
                    وفر {selectedProduct.discount_percent}% الآن
                  </div>
                )}
              </div>

              {/* مصغرات الوسائط */}
              {allMedia.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                  {allMedia.map((m, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveMediaIndex(idx)}
                      className={`w-16 h-16 rounded-2xl border-2 overflow-hidden shrink-0 transition cursor-pointer ${
                        activeMediaIndex === idx ? 'border-emerald-500 scale-105' : 'border-slate-800 opacity-60'
                      }`}
                    >
                      {m.type === 'video' ? (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center text-xs">🎬</div>
                      ) : (
                        <img src={m.url} className="w-full h-full object-cover" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* شريط الإلحاح والعد التنازلي */}
              <div className="bg-[#111827] border border-amber-500/30 p-4 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <span>⚡</span>
                    <span>ينتهي عرض الخصم والطلب اليوم خلال:</span>
                  </span>
                  <span className="font-mono font-bold bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-md">
                    03:42:18
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  🔥 متبقي فقط <strong className="text-red-400 font-bold">{selectedProduct.stock || 4} قطع</strong> في المخزن بهذا السعر!
                </div>
              </div>

            </div>

            {/* 📝 العمود الأيسر: تفاصيل المنتج وفورم الشراء السريع بخطوة واحدة */}
            <div className="lg:col-span-6 space-y-6">
              
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">{selectedProduct.name}</h2>
                <div className="flex items-center gap-3">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400">{selectedProduct.price} ج.م</span>
                  {selectedProduct.original_price > 0 && (
                    <span className="text-slate-500 line-through text-sm sm:text-base font-mono">
                      {selectedProduct.original_price} ج.م
                    </span>
                  )}
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    الدفع عند الاستلام
                  </span>
                </div>
              </div>

              {/* اختيار المقاسات */}
              {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300">اختر المقاس:</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.sizes.map((sz, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          selectedSize === sz
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-md scale-105'
                            : 'bg-[#111827] text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* اختيار الألوان */}
              {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300">اختر اللون:</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.colors.map((clr, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedColor(clr)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          selectedColor === clr
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-md scale-105'
                            : 'bg-[#111827] text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {clr}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* تحديد الكمية */}
              <div className="flex items-center gap-4 bg-[#111827] border border-slate-800 p-3 rounded-2xl w-fit">
                <span className="text-xs font-bold text-slate-300">الكمية:</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-xl bg-slate-800 text-white font-black hover:bg-slate-700 transition"
                  >
                    -
                  </button>
                  <span className="font-mono font-black text-sm text-white w-5 text-center">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-xl bg-slate-800 text-white font-black hover:bg-slate-700 transition"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 🌟 نموذج الشراء السريع بخطوة واحدة (1-Click Fast Checkout) */}
              <form onSubmit={handlePlaceOrder} className="bg-[#111827] border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-4 shadow-xl">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>📝</span>
                    <span>بيانات الشحن والتوصيل (الدفع عند الاستلام)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">املأ بياناتك وسيتم شحن المنتج فوراً لمنزلك</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">الاسم بالكامل *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أحمد محمد علي"
                    value={orderForm.customerName}
                    onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
                    className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">رقم الهاتف (للتأكيد والشحن) *</label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    placeholder="01xxxxxxxxx"
                    value={orderForm.phone}
                    onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                    className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl p-3 text-sm text-white font-mono focus:outline-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">المحافظة *</label>
                    <select
                      value={orderForm.governorate}
                      onChange={(e) => setOrderForm({ ...orderForm, governorate: e.target.value })}
                      className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-emerald-500"
                    >
                      {governorates.map((gov, i) => (
                        <option key={i} value={gov}>{gov}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">العنوان بالتفصيل *</label>
                    <input
                      type="text"
                      required
                      placeholder="المدينة / اسم الشارع / رقم العقار"
                      value={orderForm.address}
                      onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                      className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-emerald-500"
                    />
                  </div>
                </div>

                {/* ملخص الحساب */}
                <div className="bg-[#0b0f19] p-3.5 rounded-2xl border border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>قيمة المنتج (x{quantity}):</span>
                    <span className="font-mono text-white font-bold">{Number(selectedProduct.price) * quantity} ج.م</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>مصاريف الشحن:</span>
                    <span className="text-emerald-400 font-bold">مجاني اليوم 🎉</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-1.5 text-sm font-black text-white">
                    <span>الإجمالي المستحق للدفع:</span>
                    <span className="text-emerald-400 font-mono">{Number(selectedProduct.price) * quantity} ج.م</span>
                  </div>
                </div>

                {/* زر تأكيد الطلب الصاروخي */}
                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base rounded-2xl shadow-xl transition-all duration-300 hover:scale-[1.01] active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {submittingOrder ? 'جاري إرسال طلبك...' : 'اضغط هنا لتأكيد الطلب الآن 🚚'}
                </button>

                {/* زر الشراء بالواتساب البديل */}
                <button
                  type="button"
                  onClick={handleWhatsAppOrder}
                  className="w-full py-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 font-bold text-xs rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>💬</span>
                  <span>أو اطلب بنقرة واحدة عبر الواتساب</span>
                </button>

              </form>

            </div>

          </div>
        ) : (
          <div className="text-center py-16 text-slate-500 bg-[#111827] border border-slate-800 rounded-3xl">
            لم يقم التاجر بإضافة منتجات لهذا المتجر بعد.
          </div>
        )}

      </main>

      {/* الرأس السفلي الثابت (Floating Buy Bar) للجوال لرفع معدل الشراء */}
      {selectedProduct && (
        <div className="fixed bottom-0 inset-x-0 bg-[#111827] border-t border-slate-800 p-3 sm:hidden z-40 flex items-center justify-between gap-3 shadow-2xl">
          <div>
            <span className="text-[10px] text-slate-400 block">الإجمالي:</span>
            <strong className="text-emerald-400 font-mono text-base">{Number(selectedProduct.price) * quantity} ج.م</strong>
          </div>
          <button
            onClick={() => {
              window.scrollTo({ top: document.body.scrollHeight / 2, behavior: 'smooth' });
            }}
            className="flex-1 py-3 bg-emerald-600 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer"
          >
            اطلب الآن - دفع عند الاستلام 🚀
          </button>
        </div>
      )}

    </div>
  );
}
