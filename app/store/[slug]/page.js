'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function PublicStoreCheckoutPage() {
  const { slug } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState(null);
  const [storeSettings, setStoreSettings] = useState(null);
  const [platformLogo, setPlatformLogo] = useState('');
  const [shippingRates, setShippingRates] = useState({});
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // اختيارات العميل
  const [selectedBundleTier, setSelectedBundleTier] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [currentDynamicUnitPrice, setCurrentDynamicUnitPrice] = useState(0);

  // فورم الشراء
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    phone: '',
    governorate: 'القاهرة',
    address: '',
  });

  const [shippingCost, setShippingCost] = useState(50);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState(null);

  // مودال السياسات المنبثق للعميل (About / Return / Privacy / Contact)
  const [activePolicyModal, setActivePolicyModal] = useState(null);

  const governorates = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'البحيرة', 'الغربية', 'المنوفية',
    'الشرقية', 'الدقهلية', 'كفر الشيخ', 'القليوبية', 'دمياط', 'بورسعيد',
    'الإسماعيلية', 'السويس', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط',
    'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر', 'مطروح',
  ];

  useEffect(() => {
    if (slug) loadStoreData();
  }, [slug]);

  useEffect(() => {
    if (shippingRates[orderForm.governorate] !== undefined) {
      setShippingCost(Number(shippingRates[orderForm.governorate]));
    } else {
      setShippingCost(50);
    }
  }, [orderForm.governorate, shippingRates]);

  async function loadStoreData() {
    setLoading(true);
    try {
      if (supabase) {
        const { data: store } = await supabase.from('store_profiles').select('*').eq('store_slug', slug).maybeSingle();
        if (!store) return setLoading(false);
        setStoreData(store);

        // جلب شعار منصة NEXT ORDER الرسمي للمشتري
        const { data: platSettings } = await supabase.from('store_settings').select('store_logo').limit(1).maybeSingle();
        if (platSettings?.store_logo) setPlatformLogo(platSettings.store_logo);

        const { data: sData } = await supabase.from('merchant_settings').select('*').eq('user_id', store.user_id).maybeSingle();
        if (sData) setStoreSettings(sData);

        const { data: shipData } = await supabase.from('shipping_rates').select('*').eq('user_id', store.user_id);
        if (shipData) {
          const map = {};
          shipData.forEach(r => map[r.governorate] = r.is_free ? 0 : r.cost);
          setShippingRates(map);
        }

        const { data: pData } = await supabase.from('products').select('*').eq('user_id', store.user_id).order('created_at', { ascending: false });
        if (pData?.length) {
          setProducts(pData);
          const first = pData[0];
          setSelectedProduct(first);
          setCurrentDynamicUnitPrice(Number(first.price));
          if (first.sizes?.length) setSelectedSize(first.sizes[0]);
          if (first.colors?.length) setSelectedColor(first.colors[0]);

          await supabase.from('store_analytics').insert([{ user_id: store.user_id, event_type: 'visit', store_slug: slug }]);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  // تحديث السعر الفردي بناءً على المتغير المختار من مصفوفة التاجر المركبة
  useEffect(() => {
    if (!selectedProduct) return;
    if (selectedProduct.variants_matrix?.length && selectedColor && selectedSize) {
      const match = selectedProduct.variants_matrix.find(v => v.color === selectedColor && v.size === selectedSize);
      if (match?.price) {
        setCurrentDynamicUnitPrice(Number(match.price));
        return;
      }
    }
    setCurrentDynamicUnitPrice(Number(selectedProduct.price));
  }, [selectedColor, selectedSize, selectedProduct]);

  // حساب أسعار عروض الـ Upsell
  const getPricing = () => {
    const unitPrice = currentDynamicUnitPrice || Number(selectedProduct?.price || 0);
    let qty = selectedBundleTier;
    let discountPercent = 0;

    if (qty === 2) discountPercent = Number(selectedProduct?.bundle_tier_2_discount || 10);
    if (qty >= 3) discountPercent = Number(selectedProduct?.bundle_tier_3_discount || 20);

    const baseAmount = unitPrice * qty;
    const discountAmount = Math.round(baseAmount * (discountPercent / 100));
    const subtotal = baseAmount - discountAmount;
    const finalTotal = subtotal + (qty >= 3 ? 0 : shippingCost);

    return { unitPrice, qty, discountPercent, subtotal, finalTotal };
  };

  const pricing = getPricing();

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const phoneClean = orderForm.phone.trim();
    if (!/^01[0125][0-9]{8}$/.test(phoneClean)) {
      alert('يرجى كتابة رقم هاتف مصري صحيح يبدأ بـ 01.');
      return;
    }

    setSubmittingOrder(true);
    try {
      // 1. فحص البلاك ليست
      const { data: blocked } = await supabase.from('blacklist').select('id').eq('user_id', storeData.user_id).eq('phone', phoneClean).maybeSingle();
      if (blocked) {
        alert('عذراً، لا يمكن إتمام الطلب في الوقت الحالي.');
        setSubmittingOrder(false);
        return;
      }

      // 2. منع الطلب المكرر (خلال دقيقتين)
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { data: recentOrder } = await supabase.from('orders').select('id').eq('user_id', storeData.user_id).eq('phone', phoneClean).gt('created_at', twoMinutesAgo).maybeSingle();
      if (recentOrder) {
        alert('⚠️ تم تسجيل طلبك بالفعل منذ قليل! سنتواصل معك هاتفياً.');
        setSubmittingOrder(false);
        return;
      }

      // 3. التحقق من نوع الاشتراك: هل المتجر على الباقة الشهرية المفتوحة وسارية؟
      const isUnlimitedActive = 
        storeData.plan_type === 'unlimited_monthly' && 
        storeData.unlimited_ends_at && 
        new Date(storeData.unlimited_ends_at) > new Date();

      const currentWallet = Number(storeData.wallet_balance_usd || 0);

      // إذا لم يكن على الباقة المفتوحة، يجب ألا يقل رصيد المحفظة عن 0.05$
      if (!isUnlimitedActive && currentWallet < 0.05) {
        alert('عذراً، المتجر غير متاح لاستقبال الطلبات حالياً بسبب صيانة المحفظة.');
        setSubmittingOrder(false);
        return;
      }

      // 4. إدراج الأوردر
      const orderPayload = {
        user_id: storeData.user_id,
        customer_name: orderForm.customerName.trim(),
        phone: phoneClean,
        governorate: orderForm.governorate,
        address: orderForm.address.trim(),
        product_name: `${selectedProduct.name} [اللون: ${selectedColor || 'افتراضي'}] [المقاس: ${selectedSize || 'افتراضي'}] (عرض: ${pricing.qty} قطع)`,
        quantity: pricing.qty,
        total_amount: pricing.finalTotal,
        cost_price: Number(selectedProduct.cost_price || 0) * pricing.qty,
        status: 'جديد',
      };

      const { data: created, error } = await supabase.from('orders').insert([orderPayload]).select().single();
      if (error) throw error;

      // 5. الخصم المالي: إذا كان استهلاك محفظة يُخصم 0.05$، وإذا كانت الباقة مفتوحة لا يُخصم أي سنت
      if (!isUnlimitedActive) {
        const { data: rateData } = await supabase.from('platform_exchange_rates').select('*').eq('id', 1).single();
        const usdRate = Number(rateData?.usd_to_egp || 50.0);
        const feeUsd = 0.05;
        const feeEgp = feeUsd * usdRate;

        const newBal = Math.max(0, currentWallet - feeUsd);
        await supabase.from('store_profiles').update({
          wallet_balance_usd: newBal,
          total_orders_billed: (storeData.total_orders_billed || 0) + 1,
          is_active: newBal >= 0.05,
        }).eq('id', storeData.id);

        await supabase.from('wallet_transactions').insert([{
          user_id: storeData.user_id,
          store_name: storeData.store_name,
          type: 'order_fee',
          amount_usd: feeUsd,
          amount_egp: feeEgp,
          usd_rate: usdRate,
          order_id: created.id,
          description: `عمولة طلب استهلاكي (${feeUsd}$ = ${feeEgp.toFixed(2)} ج.م)`,
        }]);
      } else {
        await supabase.from('store_profiles').update({
          total_orders_billed: (storeData.total_orders_billed || 0) + 1,
        }).eq('id', storeData.id);
      }

      setOrderSuccessData({ ...orderPayload, orderId: created?.id ? created.id.slice(0, 8).toUpperCase() : 'ORD-' + Date.now().toString().slice(-6) });
    } catch (err) {
      alert('خطأ أثناء إرسال الطلب: ' + err.message);
    }
    setSubmittingOrder(false);
  };

  if (loading) return <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center font-sans">جاري فتح المتجر...</div>;

  if (orderSuccessData) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="max-w-md w-full bg-[#111827] border border-emerald-500/30 p-8 rounded-3xl text-center space-y-4">
          <div className="text-4xl text-emerald-400">✓</div>
          <h2 className="text-xl font-black">تم تأكيد طلبك بنجاح!</h2>
          <p className="text-xs text-slate-400">شكراً لطلبك من متجر <strong>{storeData.store_name}</strong> تحت إشراف التاجر <strong>{storeData.owner_name}</strong>.</p>
          <div className="bg-slate-900 p-4 rounded-xl text-xs text-right space-y-2">
            <div>كود الطلب: <strong className="text-white font-mono">{orderSuccessData.orderId}</strong></div>
            <div>المنتج: <strong className="text-white">{orderSuccessData.product_name}</strong></div>
            <div>الإجمالي عند الاستلام: <strong className="text-emerald-400 font-bold">{orderSuccessData.total_amount} ج.م</strong></div>
          </div>
          <button onClick={() => { setOrderSuccessData(null); setSelectedBundleTier(1); }} className="w-full py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer">العودة للمتجر</button>
        </div>
      </div>
    );
  }

  const allMedia = [
    ...(selectedProduct?.videos || []).map(v => ({ type: 'video', url: v })),
    ...(selectedProduct?.images || []).map(img => ({ type: 'image', url: img })),
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white font-sans pb-24 select-none relative" dir="rtl">
      
      {/* 👑 شريط عائم دائم ومحمى للأدمن للتبديل والرجوع من أي صفحة متجر */}
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-slate-900/95 border-2 border-amber-500/80 p-2 rounded-2xl shadow-2xl backdrop-blur-md">
        <div className="text-[11px] font-black text-amber-400 px-2 hidden sm:block">
          👑 وضع الإدارة
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
        >
          لوحة التاجر
        </button>
        <button
          onClick={() => {
            localStorage.setItem('is_super_admin', 'true');
            router.push('/admin');
          }}
          className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black rounded-xl shadow transition cursor-pointer flex items-center gap-1"
        >
          <span>⬅</span>
          <span>الرجوع للسوبر أدمن</span>
        </button>
      </div>

      {/* الشريط الإعلاني */}
      <div className="bg-emerald-600 text-white text-[11px] font-black py-2 px-4 text-center">
        {storeSettings?.announcement_text || '🚚 شحن لجميع المحافظات والدفع عند الاستلام بعد المعاينة!'}
      </div>

      {/* الترويسة العلوية للزبون مع إظهار اسم التاجر وشعار المنصة الرسمي NEXT ORDER */}
      <header className="bg-[#111827] border-b border-slate-800 px-4 sm:px-8 py-3.5 sticky top-0 z-40 backdrop-blur-md bg-opacity-95 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            {storeSettings?.store_logo ? (
              <img src={storeSettings.store_logo} alt="Logo" className="w-10 h-10 rounded-xl object-contain bg-white p-0.5 border border-slate-700 shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                {storeData.store_name?.charAt(0) || '🏪'}
              </div>
            )}
            <div>
              <h1 className="text-base font-black text-white leading-tight">{storeData.store_name}</h1>
              <p className="text-[11px] text-emerald-400 font-bold">بإدارة التاجر المعتمد: {storeData?.owner_name || 'التاجر'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pl-1 border-r border-slate-800 pr-3">
            <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">منظومة موثقة عبر</span>
            {platformLogo ? (
              <img src={platformLogo} alt="NEXT ORDER" className="h-8 max-w-[100px] object-contain rounded-lg bg-white/5 p-1 border border-slate-800" />
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-emerald-400 to-teal-300 text-black font-black flex items-center justify-center text-[10px]">
                  NO
                </div>
                <span className="text-xs font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  NEXT ORDER
                </span>
              </div>
            )}
          </div>

        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {selectedProduct ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* المعرض */}
            <div className="lg:col-span-6 space-y-3">
              <div className="w-full h-80 sm:h-[400px] bg-[#111827] border border-slate-800 rounded-3xl overflow-hidden flex items-center justify-center">
                {allMedia[activeMediaIndex]?.type === 'video' ? (
                  <video src={allMedia[activeMediaIndex].url} controls autoPlay className="w-full h-full object-cover" />
                ) : (
                  <img src={allMedia[activeMediaIndex]?.url || ''} className="w-full h-full object-contain p-2" />
                )}
              </div>

              {allMedia.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {allMedia.map((m, idx) => (
                    <button key={idx} onClick={() => setActiveMediaIndex(idx)} className={`w-14 h-14 rounded-xl border-2 overflow-hidden shrink-0 ${activeMediaIndex === idx ? 'border-emerald-500' : 'border-slate-800'}`}>
                      {m.type === 'video' ? <div className="w-full h-full bg-slate-900 flex items-center justify-center text-xs">🎬</div> : <img src={m.url} className="w-full h-full object-cover" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* تفاصيل المنتج والـ Upsell وفورم الشراء */}
            <div className="lg:col-span-6 space-y-4">
              <div>
                <span className="text-xs text-emerald-400 font-bold block mb-1">التاجر المسؤول: {storeData?.owner_name}</span>
                <h2 className="text-xl font-black">{selectedProduct.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-2xl font-black text-emerald-400">{currentDynamicUnitPrice} ج.م</span>
                  {selectedProduct.original_price > 0 && <span className="text-slate-500 line-through text-sm">{selectedProduct.original_price} ج.م</span>}
                </div>
              </div>

              {/* اختيار اللون */}
              {selectedProduct.colors?.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">اختر اللون:</label>
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

              {/* اختيار المقاس */}
              {selectedProduct.sizes?.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">اختر المقاس:</label>
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

              {/* عروض الكميات Upsell */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">اختر العرض الأفضل لك ووفر:</label>
                <div className="grid grid-cols-3 gap-2">
                  <div onClick={() => setSelectedBundleTier(1)} className={`p-3 rounded-2xl border cursor-pointer text-center ${selectedBundleTier === 1 ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-[#111827]'}`}>
                    <span className="text-xs font-bold block">قطعة</span>
                    <strong className="text-emerald-400 text-xs font-mono">{currentDynamicUnitPrice} ج.م</strong>
                  </div>
                  <div onClick={() => setSelectedBundleTier(2)} className={`p-3 rounded-2xl border cursor-pointer text-center ${selectedBundleTier === 2 ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-[#111827]'}`}>
                    <span className="text-xs font-bold block">قطعتين</span>
                    <strong className="text-emerald-400 text-xs font-mono">{Math.round((currentDynamicUnitPrice * 2) * (1 - (selectedProduct.bundle_tier_2_discount || 10) / 100))} ج.م</strong>
                  </div>
                  <div onClick={() => setSelectedBundleTier(3)} className={`p-3 rounded-2xl border cursor-pointer text-center ${selectedBundleTier === 3 ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-[#111827]'}`}>
                    <span className="text-xs font-bold block">3 قطع</span>
                    <strong className="text-emerald-400 text-xs font-mono">{Math.round((currentDynamicUnitPrice * 3) * (1 - (selectedProduct.bundle_tier_3_discount || 20) / 100))} ج.م</strong>
                  </div>
                </div>
              </div>

              {/* فورم الشراء السريع بالـ COD */}
              <form onSubmit={handleCheckoutSubmit} className="bg-[#111827] border border-slate-800 p-5 rounded-3xl space-y-3">
                <input type="text" required placeholder="الاسم بالكامل" value={orderForm.customerName} onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })} className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl p-3 text-xs text-white" />
                <input type="tel" required dir="ltr" placeholder="رقم الهاتف (للتوصيل)" value={orderForm.phone} onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })} className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl p-3 text-xs text-white font-mono" />
                
                <div className="grid grid-cols-2 gap-2">
                  <select value={orderForm.governorate} onChange={(e) => setOrderForm({ ...orderForm, governorate: e.target.value })} className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 text-xs text-white">
                    {governorates.map((g, i) => <option key={i} value={g}>{g}</option>)}
                  </select>
                  <input type="text" required placeholder="العنوان بالتفصيل" value={orderForm.address} onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })} className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl p-3 text-xs text-white" />
                </div>

                <div className="bg-[#0b0f19] p-3 rounded-xl border border-slate-800 text-xs flex justify-between font-bold">
                  <span>الإجمالي عند الاستلام:</span>
                  <span className="text-emerald-400 font-mono text-sm">{pricing.finalTotal} ج.م</span>
                </div>

                <button type="submit" disabled={submittingOrder} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-xl transition cursor-pointer">
                  {submittingOrder ? 'جاري تأكيد الطلب...' : 'تأكيد الطلب الآن 🚚'}
                </button>
              </form>
            </div>

          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">لا توجد منتجات مسجلة في هذا المتجر حالياً.</div>
        )}
      </main>

      {/* 🌟 فوتر الشفافية والسياسات وروابط التواصل للزبائن */}
      <footer className="mt-12 border-t border-slate-800/80 bg-[#111827] p-6 max-w-4xl mx-auto rounded-3xl text-center space-y-4">
        <div className="flex flex-wrap justify-center gap-3 text-xs font-bold">
          <button onClick={() => setActivePolicyModal('about')} className="text-slate-300 hover:text-emerald-400 cursor-pointer">
            ℹ️ من نحن
          </button>
          <span className="text-slate-700">•</span>
          <button onClick={() => setActivePolicyModal('returns')} className="text-slate-300 hover:text-emerald-400 cursor-pointer">
            🔄 سياسة الاستبدال والاسترجاع
          </button>
          <span className="text-slate-700">•</span>
          <button onClick={() => setActivePolicyModal('privacy')} className="text-slate-300 hover:text-emerald-400 cursor-pointer">
            🔒 سياسة الخصوصية
          </button>
          <span className="text-slate-700">•</span>
          <button onClick={() => setActivePolicyModal('contact')} className="text-slate-300 hover:text-emerald-400 cursor-pointer">
            📞 تواصل معنا
          </button>
        </div>

        <p className="text-[11px] text-slate-500">
          متجر معتمد وموثق عبر منصة <strong className="text-emerald-400">NEXT ORDER</strong> • يحق للعميل معاينة وفحص الشحنة بالكامل قبل سداد المبلغ للمندوب.
        </p>
      </footer>

      {/* 🌟 النافذة المنبثقة التفاعلية للسياسات (Policy Modal) */}
      {activePolicyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 text-xs">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white">
                {activePolicyModal === 'about' && 'من نحن'}
                {activePolicyModal === 'returns' && 'سياسة الاستبدال والاسترجاع'}
                {activePolicyModal === 'privacy' && 'سياسة الخصوصية وأمان البيانات'}
                {activePolicyModal === 'contact' && 'بيانات التواصل الرسمية'}
              </h3>
              <button onClick={() => setActivePolicyModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="text-slate-300 leading-relaxed max-h-60 overflow-y-auto">
              {activePolicyModal === 'about' && (
                <p>{storeSettings?.about_us || 'متجر معتمد يوفر أفضل المنتجات وضمان المعاينة قبل الاستلام.'}</p>
              )}

              {activePolicyModal === 'returns' && (
                <p>{storeSettings?.return_policy || 'يحق للعميل استبدال أو استرجاع المنتج خلال 14 يوماً من الاستلام.'}</p>
              )}

              {activePolicyModal === 'privacy' && (
                <p>{storeSettings?.privacy_policy || 'نضمن الحفاظ على سرية أرقام الهواتف واستخدامها لغرض الشحن والتوصيل فقط.'}</p>
              )}

              {activePolicyModal === 'contact' && (
                <div className="space-y-2">
                  <div>التاجر المسؤول: <strong className="text-white">{storeData?.owner_name}</strong></div>
                  <div>واتساب وخدمة العملاء: <strong className="text-emerald-400 font-mono" dir="ltr">{storeSettings?.support_phone || storeData?.phone}</strong></div>
                  {storeSettings?.store_email && <div>البريد الرسمي: <strong className="text-cyan-400 font-mono">{storeSettings.store_email}</strong></div>}
                  {storeSettings?.store_address && <div>مقر المتجر: <strong className="text-white">{storeSettings.store_address}</strong></div>}
                </div>
              )}
            </div>

            <button onClick={() => setActivePolicyModal(null)} className="w-full py-2.5 bg-slate-800 text-white rounded-xl font-bold">
              إغلاق
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
