'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { useApp } from '../../../context/AppContext';

export default function PublicStoreCheckoutPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { lang, theme, toggleLanguage, toggleTheme } = useApp();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState(null);
  const [storeSettings, setStoreSettings] = useState(null);
  const [platformLogo, setPlatformLogo] = useState('');
  const [shippingRates, setShippingRates] = useState({});
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [selectedBundleTier, setSelectedBundleTier] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [currentDynamicUnitPrice, setCurrentDynamicUnitPrice] = useState(0);

  const [orderForm, setOrderForm] = useState({
    customerName: '',
    phone: '',
    governorate: 'القاهرة',
    address: '',
  });

  const [shippingCost, setShippingCost] = useState(50);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState(null);
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
        let { data: store } = await supabase
          .from('store_profiles')
          .select('*')
          .eq('store_slug', slug)
          .maybeSingle();

        if (!store) {
          const { data: firstStore } = await supabase.from('store_profiles').select('*').limit(1).maybeSingle();
          if (firstStore) store = firstStore;
        }

        if (!store) {
          setLoading(false);
          return;
        }
        setStoreData(store);

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

        const { data: pData } = await supabase
          .from('products')
          .select('*')
          .or(`user_id.eq.${store.user_id},store_slug.eq.${slug},store_slug.eq.main-store,user_id.is.null`)
          .order('created_at', { ascending: false });

        if (pData && pData.length > 0) {
          const sanitized = pData.map(p => {
            let imgs = [];
            if (Array.isArray(p.images)) {
              imgs = p.images;
            } else if (typeof p.images === 'string' && p.images.trim()) {
              try {
                const parsed = JSON.parse(p.images);
                imgs = Array.isArray(parsed) ? parsed : [p.images];
              } catch {
                imgs = [p.images];
              }
            }
            return {
              ...p,
              images: imgs,
              variants_matrix: Array.isArray(p.variants_matrix) ? p.variants_matrix : [],
            };
          });

          setProducts(sanitized);
          const first = sanitized[0];
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
      alert(lang === 'ar' ? 'يرجى كتابة رقم هاتف مصري صحيح يبدأ بـ 01.' : 'Please enter a valid Egyptian mobile number (starts with 01)');
      return;
    }

    setSubmittingOrder(true);
    try {
      const { data: blocked } = await supabase.from('blacklist').select('id').eq('user_id', storeData.user_id).eq('phone', phoneClean).maybeSingle();
      if (blocked) {
        alert(lang === 'ar' ? 'عذراً، لا يمكن إتمام الطلب في الوقت الحالي.' : 'Sorry, order cannot be placed right now.');
        setSubmittingOrder(false);
        return;
      }

      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { data: recentOrder } = await supabase.from('orders').select('id').eq('user_id', storeData.user_id).eq('phone', phoneClean).gt('created_at', twoMinutesAgo).maybeSingle();
      if (recentOrder) {
        alert(lang === 'ar' ? '⚠️ تم تسجيل طلبك بالفعل منذ قليل! سنتواصل معك هاتفياً.' : '⚠️ You already placed an order recently! We will contact you.');
        setSubmittingOrder(false);
        return;
      }

      const isUnlimitedActive = 
        storeData.plan_type === 'unlimited_monthly' && 
        storeData.unlimited_ends_at && 
        new Date(storeData.unlimited_ends_at) > new Date();

      const currentWallet = Number(storeData.wallet_balance_usd || 0);

      if (!isUnlimitedActive && currentWallet < 0.05) {
        alert(lang === 'ar' ? 'عذراً، المتجر غير متاح لاستقبال الطلبات حالياً بسبب صيانة المحفظة.' : 'Store temporarily unavailable for orders.');
        setSubmittingOrder(false);
        return;
      }

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
      alert('Order Error: ' + err.message);
    }
    setSubmittingOrder(false);
  };

  if (loading) return <div className={`min-h-screen flex items-center justify-center font-sans ${isDark ? 'bg-[#0b0f19] text-white' : 'bg-slate-100 text-black'}`}>{lang === 'ar' ? 'جاري فتح المتجر...' : 'Loading Storefront...'}</div>;

  if (orderSuccessData) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 font-sans ${isDark ? 'bg-[#0b0f19] text-white' : 'bg-slate-100 text-black'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className={`max-w-md w-full border border-emerald-500/30 p-8 rounded-3xl text-center space-y-4 ${isDark ? 'bg-[#111827]' : 'bg-white shadow-xl'}`}>
          <div className="text-4xl text-emerald-400">✓</div>
          <h2 className="text-xl font-black">{lang === 'ar' ? 'تم تأكيد طلبك بنجاح!' : 'Order Placed Successfully!'}</h2>
          <p className="text-xs text-slate-400">
            {lang === 'ar' 
              ? `شكراً لطلبك من متجر ${storeData?.store_name} تحت إشراف التاجر ${storeData?.owner_name}.`
              : `Thank you for ordering from ${storeData?.store_name}.`}
          </p>
          <div className={`p-4 rounded-xl text-xs space-y-2 ${isDark ? 'bg-slate-900 text-slate-300' : 'bg-slate-50 text-slate-700'}`}>
            <div>{lang === 'ar' ? 'كود الطلب:' : 'Order Code:'} <strong className="font-mono">{orderSuccessData.orderId}</strong></div>
            <div>{lang === 'ar' ? 'المنتج:' : 'Item:'} <strong>{orderSuccessData.product_name}</strong></div>
            <div>{lang === 'ar' ? 'الإجمالي عند الاستلام:' : 'Total COD:'} <strong className="text-emerald-400 font-bold">{orderSuccessData.total_amount} {lang === 'ar' ? 'ج.م' : 'EGP'}</strong></div>
          </div>
          <button onClick={() => { setOrderSuccessData(null); setSelectedBundleTier(1); }} className="w-full py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer">
            {lang === 'ar' ? 'العودة للمتجر' : 'Back to Store'}
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
    <div className={`min-h-screen font-sans pb-24 select-none relative transition-colors ${
      isDark ? 'bg-[#0b0f19] text-white' : 'bg-slate-100 text-slate-900'
    }`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* 👑 شريط عائم دائم للأدمن للتبديل والرجوع من أي صفحة متجر */}
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-slate-900/95 border-2 border-amber-500/80 p-2 rounded-2xl shadow-2xl backdrop-blur-md">
        <div className="text-[11px] font-black text-amber-400 px-2 hidden sm:block">
          👑 {lang === 'ar' ? 'وضع الإدارة' : 'Admin Mode'}
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
        >
          {lang === 'ar' ? 'لوحة التاجر' : 'Merchant Dashboard'}
        </button>
        <button
          onClick={() => {
            localStorage.setItem('is_super_admin', 'true');
            router.push('/admin');
          }}
          className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black text-xs font-black rounded-xl shadow transition cursor-pointer flex items-center gap-1"
        >
          <span>⬅</span>
          <span>{lang === 'ar' ? 'الرجوع للسوبر أدمن' : 'Super Admin'}</span>
        </button>
      </div>

      {/* الشريط الإعلاني */}
      <div className="bg-emerald-600 text-white text-[11px] font-black py-2 px-4 text-center">
        {storeSettings?.announcement_text || (lang === 'ar' ? '🚚 شحن لجميع المحافظات والدفع عند الاستلام بعد المعاينة!' : '🚚 Fast shipping & Cash on Delivery across Egypt!')}
      </div>

      {/* الترويسة العلوية للزبون */}
      <header className={`border-b px-4 sm:px-8 py-3.5 sticky top-0 z-40 backdrop-blur-md bg-opacity-95 shadow-sm transition-colors ${
        isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {storeSettings?.store_logo ? (
              <img src={storeSettings.store_logo} alt="Logo" className="w-10 h-10 rounded-xl object-contain bg-white p-0.5 border border-slate-700 shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                {storeData?.store_name?.charAt(0) || '🏪'}
              </div>
            )}
            <div>
              <h1 className="text-base font-black leading-tight">{storeData?.store_name}</h1>
              <p className="text-[11px] text-emerald-400 font-bold">{lang === 'ar' ? 'التاجر المعتمد:' : 'Certified Merchant:'} {storeData?.owner_name || 'Owner'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggleLanguage} className="px-2.5 py-1 bg-slate-800 text-white rounded-lg text-[10px] font-bold border border-slate-700">
              🌐 {lang === 'ar' ? 'EN' : 'AR'}
            </button>
            <button onClick={toggleTheme} className="px-2.5 py-1 bg-slate-800 text-white rounded-lg text-[10px] font-bold border border-slate-700">
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">

        {/* شبكة اختيار منتجات المتجر الأخرى */}
        {products.length > 1 && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400">{lang === 'ar' ? 'منتجات أخرى متوفرة في المتجر:' : 'Other Available Products:'}</span>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {products.map((p) => {
                const thumb = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : '';
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProduct(p);
                      setCurrentDynamicUnitPrice(Number(p.price));
                      if (p.sizes?.length) setSelectedSize(p.sizes[0]);
                      if (p.colors?.length) setSelectedColor(p.colors[0]);
                      setActiveMediaIndex(0);
                      setSelectedBundleTier(1);
                    }}
                    className={`flex items-center gap-2.5 p-2 pr-3 rounded-2xl border transition shrink-0 cursor-pointer ${
                      selectedProduct?.id === p.id
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : isDark ? 'border-slate-800 bg-[#111827] opacity-70 hover:opacity-100' : 'border-slate-200 bg-white opacity-80 hover:opacity-100 shadow-sm'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center shrink-0">
                      {thumb ? <img src={thumb} className="w-full h-full object-cover" alt={p.name} /> : '📦'}
                    </div>
                    <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
                      <span className="text-xs font-bold block truncate max-w-[120px]">{p.name}</span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">{p.price} {lang === 'ar' ? 'ج.م' : 'EGP'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {selectedProduct ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* المعرض */}
            <div className="lg:col-span-6 space-y-3">
              <div className={`w-full h-80 sm:h-[400px] border rounded-3xl overflow-hidden flex items-center justify-center ${
                isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                {allMedia[activeMediaIndex]?.type === 'video' ? (
                  <video src={allMedia[activeMediaIndex].url} controls autoPlay className="w-full h-full object-cover" />
                ) : allMedia[activeMediaIndex]?.url ? (
                  <img src={allMedia[activeMediaIndex].url} className="w-full h-full object-contain p-2" alt={selectedProduct.name} />
                ) : (
                  <span className="text-4xl">🛍️</span>
                )}
              </div>

              {allMedia.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {allMedia.map((m, idx) => (
                    <button key={idx} onClick={() => setActiveMediaIndex(idx)} className={`w-14 h-14 rounded-xl border-2 overflow-hidden shrink-0 ${activeMediaIndex === idx ? 'border-emerald-500' : 'border-slate-800'}`}>
                      {m.type === 'video' ? <div className="w-full h-full bg-slate-900 flex items-center justify-center text-xs">🎬</div> : <img src={m.url} className="w-full h-full object-cover" alt="" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* تفاصيل المنتج والـ Upsell وفورم الشراء */}
            <div className="lg:col-span-6 space-y-4">
              <div>
                <span className="text-xs text-emerald-400 font-bold block mb-1">{lang === 'ar' ? 'التاجر المسؤول:' : 'Merchant:'} {storeData?.owner_name}</span>
                <h2 className="text-xl font-black">{selectedProduct.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-2xl font-black text-emerald-400">{currentDynamicUnitPrice} {lang === 'ar' ? 'ج.م' : 'EGP'}</span>
                  {selectedProduct.original_price > 0 && <span className="text-slate-500 line-through text-sm">{selectedProduct.original_price} {lang === 'ar' ? 'ج.م' : 'EGP'}</span>}
                </div>
              </div>

              {/* الألوان */}
              {selectedProduct.colors?.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">{lang === 'ar' ? 'اختر اللون:' : 'Select Color:'}</label>
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

              {/* المقاسات */}
              {selectedProduct.sizes?.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">{lang === 'ar' ? 'اختر المقاس:' : 'Select Size:'}</label>
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
                <label className="text-xs font-bold text-slate-400 block">{lang === 'ar' ? 'اختر العرض الأفضل لك ووفر:' : 'Select Quantity & Save:'}</label>
                <div className="grid grid-cols-3 gap-2">
                  <div onClick={() => setSelectedBundleTier(1)} className={`p-3 rounded-2xl border cursor-pointer text-center ${selectedBundleTier === 1 ? 'border-emerald-500 bg-emerald-500/10' : isDark ? 'border-slate-800 bg-[#111827]' : 'border-slate-200 bg-white shadow-sm'}`}>
                    <span className="text-xs font-bold block">{lang === 'ar' ? 'قطعة' : '1 Piece'}</span>
                    <strong className="text-emerald-400 text-xs font-mono">{currentDynamicUnitPrice} {lang === 'ar' ? 'ج.م' : 'EGP'}</strong>
                  </div>
                  <div onClick={() => setSelectedBundleTier(2)} className={`p-3 rounded-2xl border cursor-pointer text-center ${selectedBundleTier === 2 ? 'border-emerald-500 bg-emerald-500/10' : isDark ? 'border-slate-800 bg-[#111827]' : 'border-slate-200 bg-white shadow-sm'}`}>
                    <span className="text-xs font-bold block">{lang === 'ar' ? 'قطعتين' : '2 Pieces'}</span>
                    <strong className="text-emerald-400 text-xs font-mono">{Math.round((currentDynamicUnitPrice * 2) * (1 - (selectedProduct.bundle_tier_2_discount || 10) / 100))} {lang === 'ar' ? 'ج.م' : 'EGP'}</strong>
                  </div>
                  <div onClick={() => setSelectedBundleTier(3)} className={`p-3 rounded-2xl border cursor-pointer text-center ${selectedBundleTier === 3 ? 'border-emerald-500 bg-emerald-500/10' : isDark ? 'border-slate-800 bg-[#111827]' : 'border-slate-200 bg-white shadow-sm'}`}>
                    <span className="text-xs font-bold block">{lang === 'ar' ? '3 قطع' : '3 Pieces'}</span>
                    <strong className="text-emerald-400 text-xs font-mono">{Math.round((currentDynamicUnitPrice * 3) * (1 - (selectedProduct.bundle_tier_3_discount || 20) / 100))} {lang === 'ar' ? 'ج.م' : 'EGP'}</strong>
                  </div>
                </div>
              </div>

              {/* فورم الشراء السريع بالـ COD */}
              <form onSubmit={handleCheckoutSubmit} className={`border p-5 rounded-3xl space-y-3 ${isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <input type="text" required placeholder={lang === 'ar' ? 'الاسم بالكامل' : 'Full Name'} value={orderForm.customerName} onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })} className={`w-full border rounded-xl p-3 text-xs ${isDark ? 'bg-[#0b0f19] border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`} />
                <input type="tel" required dir="ltr" placeholder={lang === 'ar' ? 'رقم الهاتف (للتوصيل)' : 'Phone Number (For Delivery)'} value={orderForm.phone} onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })} className={`w-full border rounded-xl p-3 text-xs font-mono ${isDark ? 'bg-[#0b0f19] border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`} />
                
                <div className="grid grid-cols-2 gap-2">
                  <select value={orderForm.governorate} onChange={(e) => setOrderForm({ ...orderForm, governorate: e.target.value })} className={`border rounded-xl p-3 text-xs ${isDark ? 'bg-[#0b0f19] border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`}>
                    {governorates.map((g, i) => <option key={i} value={g}>{g}</option>)}
                  </select>
                  <input type="text" required placeholder={lang === 'ar' ? 'العنوان بالتفصيل' : 'Detailed Address'} value={orderForm.address} onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })} className={`w-full border rounded-xl p-3 text-xs ${isDark ? 'bg-[#0b0f19] border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`} />
                </div>

                <div className={`p-3 rounded-xl border text-xs flex justify-between font-bold ${isDark ? 'bg-[#0b0f19] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span>{lang === 'ar' ? 'الإجمالي عند الاستلام:' : 'Total at Delivery (COD):'}</span>
                  <span className="text-emerald-400 font-mono text-sm">{pricing.finalTotal} {lang === 'ar' ? 'ج.م' : 'EGP'}</span>
                </div>

                <button type="submit" disabled={submittingOrder} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-xl transition cursor-pointer">
                  {submittingOrder ? (lang === 'ar' ? 'جاري تأكيد الطلب...' : 'Processing...') : (lang === 'ar' ? 'تأكيد الطلب الآن 🚚' : 'Confirm Order Now 🚚')}
                </button>
              </form>
            </div>

          </div>
        ) : (
          <div className="text-center py-16 text-slate-500 bg-[#111827] rounded-3xl border border-slate-800">
            <span className="text-3xl block mb-2">🛍️</span>
            <span>{lang === 'ar' ? 'لا توجد منتجات مسجلة في هذا المتجر حالياً.' : 'No products available currently.'}</span>
          </div>
        )}
      </main>

      {/* فوتر الشفافية والسياسات */}
      <footer className={`mt-12 border-t p-6 max-w-4xl mx-auto rounded-3xl text-center space-y-4 ${
        isDark ? 'bg-[#111827] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-wrap justify-center gap-3 text-xs font-bold">
          <button onClick={() => setActivePolicyModal('about')} className="text-slate-400 hover:text-emerald-400 cursor-pointer">
            ℹ️ {lang === 'ar' ? 'من نحن' : 'About Us'}
          </button>
          <span className="text-slate-700">•</span>
          <button onClick={() => setActivePolicyModal('returns')} className="text-slate-400 hover:text-emerald-400 cursor-pointer">
            🔄 {lang === 'ar' ? 'سياسة الاستبدال والاسترجاع' : 'Returns & Refunds'}
          </button>
          <span className="text-slate-700">•</span>
          <button onClick={() => setActivePolicyModal('privacy')} className="text-slate-400 hover:text-emerald-400 cursor-pointer">
            🔒 {lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </button>
          <span className="text-slate-700">•</span>
          <button onClick={() => setActivePolicyModal('contact')} className="text-slate-400 hover:text-emerald-400 cursor-pointer">
            📞 {lang === 'ar' ? 'تواصل معنا' : 'Contact Us'}
          </button>
        </div>

        <p className="text-[11px] text-slate-500">
          {lang === 'ar' 
            ? 'متجر معتمد وموثق عبر منصة NEXT ORDER • يحق للعميل معاينة وفحص الشحنة بالكامل قبل سداد المبلغ للمندوب.'
            : 'Verified store powered by NEXT ORDER • You can inspect items before paying COD.'}
        </p>
      </footer>

      {/* مودال السياسات التفاعلي */}
      {activePolicyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`border rounded-3xl p-6 max-w-md w-full space-y-4 text-xs ${isDark ? 'bg-[#111827] border-slate-800 text-white' : 'bg-white border-slate-300 text-black'}`}>
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black">
                {activePolicyModal === 'about' && (lang === 'ar' ? 'من نحن' : 'About Us')}
                {activePolicyModal === 'returns' && (lang === 'ar' ? 'سياسة الاستبدال والاسترجاع' : 'Return Policy')}
                {activePolicyModal === 'privacy' && (lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy')}
                {activePolicyModal === 'contact' && (lang === 'ar' ? 'بيانات التواصل' : 'Contact Details')}
              </h3>
              <button onClick={() => setActivePolicyModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="leading-relaxed max-h-60 overflow-y-auto">
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
                  <div>{lang === 'ar' ? 'التاجر المسؤول:' : 'Owner:'} <strong>{storeData?.owner_name}</strong></div>
                  <div>WhatsApp: <strong className="text-emerald-400 font-mono" dir="ltr">{storeSettings?.support_phone || storeData?.phone}</strong></div>
                  {storeSettings?.store_email && <div>Email: <strong className="text-cyan-400 font-mono">{storeSettings.store_email}</strong></div>}
                  {storeSettings?.store_address && <div>Address: <strong>{storeSettings.store_address}</strong></div>}
                </div>
              )}
            </div>

            <button onClick={() => setActivePolicyModal(null)} className="w-full py-2.5 bg-slate-800 text-white rounded-xl font-bold">
              {lang === 'ar' ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
