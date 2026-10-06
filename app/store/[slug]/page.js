'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function EasyOrderFullCheckout() {
  const { slug } = useParams();

  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState(null);
  const [storeSettings, setStoreSettings] = useState(null);
  const [shippingRates, setShippingRates] = useState({});
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // اختيارات العميل
  const [selectedBundleTier, setSelectedBundleTier] = useState(1); // 1 = قطعة, 2 = قطعتين, 3 = 3 قطع
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  // فورم الشراء السريع
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    phone: '',
    governorate: 'القاهرة',
    address: '',
    notes: '',
  });

  const [shippingCost, setShippingCost] = useState(50);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState(null);

  const governorates = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'البحيرة', 'الغربية', 'المنوفية',
    'الشرقية', 'الدقهلية', 'كفر الشيخ', 'القليوبية', 'دمياط', 'بورسعيد',
    'الإسماعيلية', 'السويس', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط',
    'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر', 'مطروح',
  ];

  useEffect(() => {
    if (slug) loadStoreData();
  }, [slug]);

  // تحديث سعر الشحن عند تغيير المحافظة
  useEffect(() => {
    if (shippingRates[orderForm.governorate] !== undefined) {
      setShippingCost(Number(shippingRates[orderForm.governorate]));
    } else {
      setShippingCost(Number(storeSettings?.default_shipping_cost || 50));
    }
  }, [orderForm.governorate, shippingRates, storeSettings]);

  async function loadStoreData() {
    setLoading(true);
    try {
      if (supabase) {
        // 1. بيانات المتجر
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

        // 2. إعدادات المتجر والشحن
        const { data: sData } = await supabase
          .from('merchant_settings')
          .select('*')
          .eq('user_id', store.user_id)
          .maybeSingle();
        if (sData) setStoreSettings(sData);

        const { data: shipData } = await supabase
          .from('shipping_rates')
          .select('*')
          .eq('user_id', store.user_id);

        if (shipData) {
          const ratesMap = {};
          shipData.forEach(r => ratesMap[r.governorate] = r.is_free ? 0 : r.cost);
          setShippingRates(ratesMap);
        }

        // 3. منتجات المتجر
        const { data: pData } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', store.user_id)
          .order('created_at', { ascending: false });

        if (pData && pData.length > 0) {
          setProducts(pData);
          const first = pData[0];
          setSelectedProduct(first);
          if (first.sizes?.length) setSelectedSize(first.sizes[0]);
          if (first.colors?.length) setSelectedColor(first.colors[0]);

          // تتبع الزيارة
          await supabase.from('store_analytics').insert([{
            user_id: store.user_id,
            event_type: 'visit',
            store_slug: slug,
          }]);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  // حساب الحسبة المالية للـ Bundle
  const getPricing = () => {
    if (!selectedProduct) return { unitPrice: 0, subtotal: 0, discount: 0, finalTotal: 0 };
    const price = Number(selectedProduct.price) || 0;
    let qty = selectedBundleTier;
    let discountPercent = 0;

    if (qty === 2) discountPercent = Number(selectedProduct.bundle_tier_2_discount || 10);
    if (qty >= 3) discountPercent = Number(selectedProduct.bundle_tier_3_discount || 20);

    const baseAmount = price * qty;
    const discountAmount = Math.round(baseAmount * (discountPercent / 100));
    const subtotal = baseAmount - discountAmount;
    const finalTotal = subtotal + (qty >= 3 ? 0 : shippingCost); // شحن مجاني لـ 3 قطع فأكثر

    return { price, qty, discountPercent, discountAmount, subtotal, finalTotal };
  };

  const pricing = getPricing();

  // تأكيد وتنفيذ الطلب مع فحص الـ Fake Orders
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const phoneClean = orderForm.phone.trim();
    if (!/^01[0125][0-9]{8}$/.test(phoneClean)) {
      alert('يرجى إدخال رقم هاتف مصري صحيح مكون من 11 رقماً للتواصل والتسليم.');
      return;
    }

    setSubmittingOrder(true);
    try {
      // 1. فحص القائمة السوداء (Blacklist Check)
      const { data: blocked } = await supabase
        .from('blacklist')
        .select('id')
        .eq('user_id', storeData.user_id)
        .eq('phone', phoneClean)
        .maybeSingle();

      if (blocked) {
        alert('عذراً، لا يمكن إتمام الطلب في الوقت الحالي. يرجى التواصل مع خدمة العملاء.');
        setSubmittingOrder(false);
        return;
      }

      // 2. منع الطلب المكرر (Duplicate Check خلال آخر دقيقتين)
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { data: recentOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', storeData.user_id)
        .eq('phone', phoneClean)
        .gt('created_at', twoMinutesAgo)
        .maybeSingle();

      if (recentOrder) {
        alert('⚠️ تم تسجيل طلبك بالفعل منذ لحظات! مندوبنا سيتواصل معك هاتفياً لتأكيد الشحن.');
        setSubmittingOrder(false);
        return;
      }

      // 3. إدخال الأوردر في قاعدة البيانات
      const orderPayload = {
        user_id: storeData.user_id,
        customer_name: orderForm.customerName.trim(),
        phone: phoneClean,
        governorate: orderForm.governorate,
        address: orderForm.address.trim(),
        product_name: `${selectedProduct.name} - (عرض: ${pricing.qty} قطع) ${selectedSize ? `[مقاس: ${selectedSize}]` : ''} ${selectedColor ? `[لون: ${selectedColor}]` : ''}`,
        quantity: pricing.qty,
        total_amount: pricing.finalTotal,
        cost_price: Number(selectedProduct.cost_price || 0) * pricing.qty,
        status: 'جديد',
      };

      const { data: created, error } = await supabase.from('orders').insert([orderPayload]).select().single();
      if (error) throw error;

      // 4. تحديث المخزون
      await supabase.from('products').update({
        sales_count: (selectedProduct.sales_count || 0) + pricing.qty,
        stock: Math.max(0, (selectedProduct.stock || 20) - pricing.qty),
      }).eq('id', selectedProduct.id);

      setOrderSuccessData({
        ...orderPayload,
        orderId: created?.id ? created.id.slice(0, 8).toUpperCase() : 'ORD-' + Date.now().toString().slice(-6),
      });

    } catch (err) {
      alert('خطأ أثناء إرسال الطلب: ' + err.message);
    }
    setSubmittingOrder(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center font-sans" dir="rtl">
        <div className="font-bold text-lg animate-pulse flex items-center gap-3">
          <span>🚀</span>
          <span>جاري فتح المتجر...</span>
        </div>
      </div>
    );
  }

  if (orderSuccessData) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="max-w-lg w-full bg-[#111827] border border-emerald-500/30 rounded-3xl p-6 sm:p-10 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center text-4xl mx-auto">
            ✓
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">تم تأكيد طلبك بنجاح!</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              شكراً لثقتك في متجر <strong className="text-emerald-400">{storeData.store_name}</strong>. سيتم الاتصال بك لتسليم المنتج.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs text-right space-y-2 text-slate-300">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">كود الطلب:</span>
              <strong className="text-white font-mono">{orderSuccessData.orderId}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">المنتج والكمية:</span>
              <strong className="text-white">{orderSuccessData.product_name}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">عنوان الاستلام:</span>
              <strong className="text-white">{orderSuccessData.governorate} - {orderSuccessData.address}</strong>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-400">المبلغ المطلوب للدفع عند الاستلام:</span>
              <strong className="text-emerald-400 font-black text-base">{orderSuccessData.total_amount} ج.م</strong>
            </div>
          </div>

          <button
            onClick={() => { setOrderSuccessData(null); setSelectedBundleTier(1); }}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition cursor-pointer"
          >
            العودة للمتجر 🛍️
          </button>
        </div>
      </div>
    );
  }

  const allMedia = [
    ...(selectedProduct?.videos || []).map(v => ({ type: 'video', url: v })),
    ...(selectedProduct?.images || []).map(img => ({ type: 'image', url: img })),
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white font-sans pb-24 select-none" dir="rtl">
      
      {/* 1. الشريط الإعلاني */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white text-[11px] font-black py-2 px-4 text-center">
        {storeSettings?.announcement_text || '🚚 شحن لجميع المحافظات والدفع عند الاستلام بعد فحص المنتج!'}
      </div>

      {/* 2. الترويسة وشعار المنصة */}
      <header className="bg-[#111827] border-b border-slate-800 px-4 sm:px-8 py-3.5 sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {storeSettings?.store_logo ? (
              <img src={storeSettings.store_logo} alt="Logo" className="w-10 h-10 rounded-xl object-contain bg-white p-0.5" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                {storeData.store_name?.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-base font-black text-white">{storeData.store_name}</h1>
              <p className="text-[11px] text-slate-400">{storeSettings?.store_description || 'أفضل المنتجات وأسرع شحن'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500">مدعوم من</span>
            <span className="text-xs font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              NEXT ORDER
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-8">
        
        {selectedProduct ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* 📸 العمود الأيمن: المعرض والعد التنازلي */}
            <div className="lg:col-span-6 space-y-4">
              <div className="w-full h-80 sm:h-[400px] bg-[#111827] border border-slate-800 rounded-3xl overflow-hidden relative flex items-center justify-center">
                {allMedia.length > 0 ? (
                  allMedia[activeMediaIndex]?.type === 'video' ? (
                    <video src={allMedia[activeMediaIndex].url} controls autoPlay className="w-full h-full object-cover" />
                  ) : (
                    <img src={allMedia[activeMediaIndex].url} alt={selectedProduct.name} className="w-full h-full object-contain p-2" />
                  )
                ) : (
                  <span className="text-5xl">🛍️</span>
                )}
              </div>

              {allMedia.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {allMedia.map((m, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveMediaIndex(idx)}
                      className={`w-14 h-14 rounded-xl border-2 overflow-hidden shrink-0 ${
                        activeMediaIndex === idx ? 'border-emerald-500 scale-105' : 'border-slate-800 opacity-60'
                      }`}
                    >
                      {m.type === 'video' ? <div className="w-full h-full bg-slate-900 flex items-center justify-center text-xs">🎬</div> : <img src={m.url} className="w-full h-full object-cover" />}
                    </button>
                  ))}
                </div>
              )}

              {/* شريط الإلحاح والعد التنازلي */}
              <div className="bg-[#111827] border border-amber-500/30 p-4 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-amber-400 font-bold">⚡ ينتهي العرض الخاص اليوم خلال:</span>
                <span className="font-mono font-bold bg-amber-500/20 text-amber-300 px-3 py-1 rounded-md">02:41:19</span>
              </div>
            </div>

            {/* 📝 العمود الأيسر: خيارات الـ Upsell وفورم الشراء السريع */}
            <div className="lg:col-span-6 space-y-5">
              
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">{selectedProduct.name}</h2>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-2xl font-black text-emerald-400">{selectedProduct.price} ج.م</span>
                  {selectedProduct.original_price > 0 && (
                    <span className="text-slate-500 line-through text-sm font-mono">{selectedProduct.original_price} ج.م</span>
                  )}
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full">
                    الدفع عند الاستلام
                  </span>
                </div>
              </div>

              {/* 🌟 محرك عروض الكميات وزيادة متوسط السلة (Easy Order Upsell BOGO) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">اختر العرض الأفضل لك ووفر أكتر:</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  
                  {/* خيار 1 قطعة */}
                  <div
                    onClick={() => setSelectedBundleTier(1)}
                    className={`p-3 rounded-2xl border cursor-pointer transition text-center space-y-1 ${
                      selectedBundleTier === 1 ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-[#111827]'
                    }`}
                  >
                    <span className="text-xs font-bold block">قطعة واحدة</span>
                    <strong className="text-emerald-400 text-sm font-mono">{selectedProduct.price} ج.م</strong>
                    <span className="text-[10px] text-slate-500 block">+ الشحن العادي</span>
                  </div>

                  {/* خيار قطعتين (خصم 10%) */}
                  <div
                    onClick={() => setSelectedBundleTier(2)}
                    className={`p-3 rounded-2xl border cursor-pointer transition text-center space-y-1 relative ${
                      selectedBundleTier === 2 ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-[#111827]'
                    }`}
                  >
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[9px] font-black px-2 py-0.5 rounded-full">
                      خصم {selectedProduct.bundle_tier_2_discount || 10}%
                    </span>
                    <span className="text-xs font-bold block">قطعتين</span>
                    <strong className="text-emerald-400 text-sm font-mono">
                      {Math.round((selectedProduct.price * 2) * (1 - (selectedProduct.bundle_tier_2_discount || 10) / 100))} ج.م
                    </strong>
                    <span className="text-[10px] text-slate-400 block">الأكثر طلباً 🔥</span>
                  </div>

                  {/* خيار 3 قطع (شحن مجاني + خصم 20%) */}
                  <div
                    onClick={() => setSelectedBundleTier(3)}
                    className={`p-3 rounded-2xl border cursor-pointer transition text-center space-y-1 relative ${
                      selectedBundleTier === 3 ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-[#111827]'
                    }`}
                  >
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                      شحن مجاني 🚚
                    </span>
                    <span className="text-xs font-bold block">3 قطع</span>
                    <strong className="text-emerald-400 text-sm font-mono">
                      {Math.round((selectedProduct.price * 3) * (1 - (selectedProduct.bundle_tier_3_discount || 20) / 100))} ج.م
                    </strong>
                    <span className="text-[10px] text-emerald-400 font-bold block">أعلى توفير</span>
                  </div>

                </div>
              </div>

              {/* المقاسات والألوان */}
              {selectedProduct.sizes?.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-300">المقاس:</span>
                  <div className="flex gap-2">
                    {selectedProduct.sizes.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedSize(s)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${selectedSize === s ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-800 text-slate-300'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedProduct.colors?.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-300">اللون:</span>
                  <div className="flex gap-2">
                    {selectedProduct.colors.map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${selectedColor === c ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-800 text-slate-300'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* فورم الشراء السريع بالـ COD */}
              <form onSubmit={handleCheckoutSubmit} className="bg-[#111827] border border-slate-800 p-5 rounded-3xl space-y-3.5 shadow-xl">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="text-sm font-black text-white">بيانات التوصيل (الدفع عند الاستلام)</h3>
                  <p className="text-[10px] text-slate-400">لن تدفع أي مبالغ حتى تستلم وتفحص المنتج بنفسك</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">الاسم ثلاثي *</label>
                  <input
                    type="text"
                    required
                    placeholder="أحمد محمد علي"
                    value={orderForm.customerName}
                    onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
                    className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl p-3 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">رقم الهاتف (للتوصيل) *</label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    placeholder="01xxxxxxxxx"
                    value={orderForm.phone}
                    onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                    className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl p-3 text-sm text-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">المحافظة *</label>
                    <select
                      value={orderForm.governorate}
                      onChange={(e) => setOrderForm({ ...orderForm, governorate: e.target.value })}
                      className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl p-3 text-sm text-white"
                    >
                      {governorates.map((g, i) => <option key={i} value={g}>{g}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">العنوان بالتفصيل *</label>
                    <input
                      type="text"
                      required
                      placeholder="الشارع / رقم البيت"
                      value={orderForm.address}
                      onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                      className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl p-3 text-sm text-white"
                    />
                  </div>
                </div>

                {/* الحساب النهائي المفصل */}
                <div className="bg-[#0b0f19] p-3.5 rounded-2xl border border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>قيمة المنتجات (x{pricing.qty}):</span>
                    <span className="font-mono text-white">{pricing.subtotal} ج.م</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>مصاريف الشحن لـ ({orderForm.governorate}):</span>
                    <span className="font-mono text-white">{pricing.qty >= 3 ? 'مجاني 🎉' : `${shippingCost} ج.م`}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-1.5 text-sm font-black text-white">
                    <span>الإجمالي عند الاستلام:</span>
                    <span className="text-emerald-400 font-mono">{pricing.finalTotal} ج.م</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-xl transition-all duration-300 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {submittingOrder ? 'جاري تسجيل الطلب...' : 'تأكيد الطلب الآن 🚚'}
                </button>
              </form>

            </div>

          </div>
        ) : (
          <div className="text-center py-16 text-slate-500">لا توجد منتجات مضافة لهذا المتجر حالياً.</div>
        )}

      </main>

    </div>
  );
}
