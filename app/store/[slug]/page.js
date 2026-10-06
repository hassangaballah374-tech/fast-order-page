'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function PublicStoreCheckoutPage() {
  const { slug } = useParams();

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

        // جلب شعار منصة NEXT ORDER الرسمي
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

  // حساب أسعار عروض الـ Upsell
  const getPricing = () => {
    if (!selectedProduct) return { price: 0, qty: 1, subtotal: 0, finalTotal: 0 };
    const price = Number(selectedProduct.price) || 0;
    let qty = selectedBundleTier;
    let discountPercent = 0;

    if (qty === 2) discountPercent = Number(selectedProduct.bundle_tier_2_discount || 10);
    if (qty >= 3) discountPercent = Number(selectedProduct.bundle_tier_3_discount || 20);

    const baseAmount = price * qty;
    const discountAmount = Math.round(baseAmount * (discountPercent / 100));
    const subtotal = baseAmount - discountAmount;
    const finalTotal = subtotal + (qty >= 3 ? 0 : shippingCost);

    return { price, qty, discountPercent, subtotal, finalTotal };
  };

  const pricing = getPricing();

  // إرسال الطلب مع التحقق من المحفظة والبلاك ليست وخصم الـ 0.05$
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const phoneClean = orderForm.phone.trim();
    if (!/^01[0125][0-9]{8}$/.test(phoneClean)) {
      alert('يرجى كتابة رقم هاتف مصري صحيح يبدأ بـ 01.');
      return;
    }

    // التحقق من رصيد محفظة التاجر
    const currentWallet = Number(storeData.wallet_balance_usd || 0);
    if (currentWallet < 0.05) {
      alert('عذراً، المتجر غير متاح لاستقبال الطلبات حالياً بسبب صيانة المحفظة.');
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

      // 3. إدراج الأوردر
      const orderPayload = {
        user_id: storeData.user_id,
        customer_name: orderForm.customerName.trim(),
        phone: phoneClean,
        governorate: orderForm.governorate,
        address: orderForm.address.trim(),
        product_name: `${selectedProduct.name} - (${pricing.qty} قطع) ${selectedSize ? `[${selectedSize}]` : ''} ${selectedColor ? `[${selectedColor}]` : ''}`,
        quantity: pricing.qty,
        total_amount: pricing.finalTotal,
        cost_price: Number(selectedProduct.cost_price || 0) * pricing.qty,
        status: 'جديد',
      };

      const { data: created, error } = await supabase.from('orders').insert([orderPayload]).select().single();
      if (error) throw error;

      // 4. خصم عمولة الأوردر اللحظية (0.05$) من محفظة التاجر
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
        description: `عمولة طلب (${feeUsd}$ = ${feeEgp.toFixed(2)} ج.م)`,
      }]);

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
          <p className="text-xs text-slate-400">شكراً لطلبك من {storeData.store_name}. سنتواصل معك لتسليم المنتج والدفع عند الاستلام.</p>
          <div className="bg-slate-900 p-4 rounded-xl text-xs text-right space-y-2">
            <div>المنتج: <strong className="text-white">{orderSuccessData.product_name}</strong></div>
            <div>الإجمالي: <strong className="text-emerald-400 font-bold">{orderSuccessData.total_amount} ج.م</strong></div>
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
    <div className="min-h-screen bg-[#0b0f19] text-white font-sans pb-24 select-none" dir="rtl">
      
      {/* الشريط الإعلاني */}
      <div className="bg-emerald-600 text-white text-[11px] font-black py-2 px-4 text-center">
        {storeSettings?.announcement_text || '🚚 شحن لجميع المحافظات والدفع عند الاستلام بعد المعاينة!'}
      </div>

      {/* الترويسة العلوية للزبون مع شعار المنصة الرسمي وشعار المتجر */}
      <header className="bg-[#111827] border-b border-slate-800 px-4 sm:px-8 py-3.5 sticky top-0 z-40 backdrop-blur-md bg-opacity-95 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          
          {/* شعار واسم متجر التاجر */}
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
              <p className="text-[11px] text-slate-400 line-clamp-1">{storeSettings?.store_description || 'أفضل المنتجات بأعلى جودة وضمان حقيقي'}</p>
            </div>
          </div>

          {/* شعار منصة NEXT ORDER الرسمي للمشتري */}
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
                <h2 className="text-xl font-black">{selectedProduct.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-2xl font-black text-emerald-400">{selectedProduct.price} ج.م</span>
                  {selectedProduct.original_price > 0 && <span className="text-slate-500 line-through text-sm">{selectedProduct.original_price} ج.م</span>}
                </div>
              </div>

              {/* عروض الكميات Upsell */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">اختر العرض الأفضل لك ووفر:</label>
                <div className="grid grid-cols-3 gap-2">
                  <div onClick={() => setSelectedBundleTier(1)} className={`p-3 rounded-2xl border cursor-pointer text-center ${selectedBundleTier === 1 ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-[#111827]'}`}>
                    <span className="text-xs font-bold block">قطعة</span>
                    <strong className="text-emerald-400 text-xs font-mono">{selectedProduct.price} ج.م</strong>
                  </div>
                  <div onClick={() => setSelectedBundleTier(2)} className={`p-3 rounded-2xl border cursor-pointer text-center ${selectedBundleTier === 2 ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-[#111827]'}`}>
                    <span className="text-xs font-bold block">قطعتين</span>
                    <strong className="text-emerald-400 text-xs font-mono">{Math.round((selectedProduct.price * 2) * (1 - (selectedProduct.bundle_tier_2_discount || 10) / 100))} ج.م</strong>
                  </div>
                  <div onClick={() => setSelectedBundleTier(3)} className={`p-3 rounded-2xl border cursor-pointer text-center ${selectedBundleTier === 3 ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-[#111827]'}`}>
                    <span className="text-xs font-bold block">3 قطع</span>
                    <strong className="text-emerald-400 text-xs font-mono">{Math.round((selectedProduct.price * 3) * (1 - (selectedProduct.bundle_tier_3_discount || 20) / 100))} ج.م</strong>
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
                  <input type="text" required placeholder="العنوان بالتفصيل" value={orderForm.address} onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })} className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 text-xs text-white" />
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

      {/* فوتر الثقة للمشتري */}
      <footer className="mt-16 py-8 border-t border-slate-800/80 text-center space-y-3 bg-[#0d1322]">
        <div className="flex items-center justify-center gap-2">
          {platformLogo ? (
            <img src={platformLogo} alt="NEXT ORDER" className="h-6 object-contain opacity-80" />
          ) : (
            <span className="text-xs font-black text-emerald-400">NEXT ORDER</span>
          )}
          <span className="text-xs text-slate-400 font-bold">| منصة التجارة والدفع عند الاستلام المعتمدة</span>
        </div>
        <p className="text-[11px] text-slate-500">
          جميع المعاملات والشحنات مؤمنة ومحمية بالكامل • حق المعاينة والفحص متاح للعميل قبل السداد
        </p>
      </footer>

    </div>
  );
}
