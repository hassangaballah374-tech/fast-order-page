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
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // اختيارات العميل
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [currentDynamicPrice, setCurrentDynamicPrice] = useState(0);

  const [orderForm, setOrderForm] = useState({ customerName: '', phone: '', governorate: 'القاهرة', address: '' });
  const [orderSuccessData, setOrderSuccessData] = useState(null);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // مودال السياسات المنبثق للعميل (About / Return / Privacy / Contact)
  const [activePolicyModal, setActivePolicyModal] = useState(null);

  useEffect(() => {
    if (slug) loadStoreData();
  }, [slug]);

  async function loadStoreData() {
    setLoading(true);
    const { data: store } = await supabase.from('store_profiles').select('*').eq('store_slug', slug).maybeSingle();
    if (!store) return setLoading(false);
    setStoreData(store);

    const { data: platSettings } = await supabase.from('store_settings').select('store_logo').limit(1).maybeSingle();
    if (platSettings?.store_logo) setPlatformLogo(platSettings.store_logo);

    const { data: sData } = await supabase.from('merchant_settings').select('*').eq('user_id', store.user_id).maybeSingle();
    if (sData) setStoreSettings(sData);

    const { data: pData } = await supabase.from('products').select('*').eq('user_id', store.user_id).order('created_at', { ascending: false });
    if (pData?.length) {
      setProducts(pData);
      const first = pData[0];
      setSelectedProduct(first);
      setCurrentDynamicPrice(Number(first.price));
      if (first.sizes?.length) setSelectedSize(first.sizes[0]);
      if (first.colors?.length) setSelectedColor(first.colors[0]);
    }
    setLoading(false);
  }

  // تحديث السعر التفاعلي
  useEffect(() => {
    if (!selectedProduct) return;
    if (selectedProduct.variants_matrix?.length && selectedColor && selectedSize) {
      const match = selectedProduct.variants_matrix.find(v => v.color === selectedColor && v.size === selectedSize);
      if (match?.price) {
        setCurrentDynamicPrice(Number(match.price));
        return;
      }
    }
    setCurrentDynamicPrice(Number(selectedProduct.price));
  }, [selectedColor, selectedSize, selectedProduct]);

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (!/^01[0125][0-9]{8}$/.test(orderForm.phone.trim())) {
      return alert('يرجى إدخال رقم هاتف مصري صحيح مكون من 11 رقماً.');
    }

    setSubmittingOrder(true);
    try {
      const orderPayload = {
        user_id: storeData.user_id,
        customer_name: orderForm.customerName.trim(),
        phone: orderForm.phone.trim(),
        governorate: orderForm.governorate,
        address: orderForm.address.trim(),
        product_name: `${selectedProduct.name} [${selectedColor || 'افتراضي'}] [${selectedSize || 'افتراضي'}]`,
        quantity: 1,
        total_amount: currentDynamicPrice,
        status: 'جديد',
      };

      const { data: created, error } = await supabase.from('orders').insert([orderPayload]).select().single();
      if (error) throw error;

      setOrderSuccessData({ ...orderPayload, orderId: created?.id?.slice(0, 8).toUpperCase() || 'ORD-DONE' });
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
    setSubmittingOrder(false);
  };

  if (loading) return <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center font-sans">جاري فتح المتجر...</div>;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white font-sans pb-24 select-none" dir="rtl">
      
      {/* 1. الترويسة العلوية */}
      <header className="bg-[#111827] border-b border-slate-800 px-6 py-3.5 sticky top-0 z-40 flex items-center justify-between">
        <div>
          <h1 className="text-base font-black text-white">{storeData?.store_name}</h1>
          <p className="text-[11px] text-emerald-400 font-bold">بإدارة التاجر المعتمد: {storeData?.owner_name || 'التاجر'}</p>
        </div>
        {platformLogo ? (
          <img src={platformLogo} alt="NEXT ORDER" className="h-7 object-contain bg-white/5 p-1 rounded-lg" />
        ) : (
          <span className="text-xs font-black text-emerald-400">NEXT ORDER</span>
        )}
      </header>

      {/* 2. محتوى المنتج وفورم الشراء السريع */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {selectedProduct && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#111827] border border-slate-800 p-6 rounded-3xl">
            <div className="h-72 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center">
              {selectedProduct.images?.[0] ? <img src={selectedProduct.images[0]} className="w-full h-full object-contain p-2" /> : '🛍️'}
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs text-emerald-400 font-bold block mb-1">التاجر المعتمد: {storeData?.owner_name}</span>
                <h2 className="text-xl font-black">{selectedProduct.name}</h2>
                <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{currentDynamicPrice} ج.م</div>
              </div>

              {/* الألوان */}
              {selectedProduct.colors?.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">اختر اللون:</label>
                  <div className="flex gap-2">
                    {selectedProduct.colors.map((c, i) => (
                      <button key={i} type="button" onClick={() => setSelectedColor(c)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${selectedColor === c ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-800 text-slate-300'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* المقاسات */}
              {selectedProduct.sizes?.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">اختر المقاس:</label>
                  <div className="flex gap-2">
                    {selectedProduct.sizes.map((s, i) => (
                      <button key={i} type="button" onClick={() => setSelectedSize(s)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${selectedSize === s ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-800 text-slate-300'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* فورم الشراء */}
              <form onSubmit={handleCheckoutSubmit} className="space-y-3 pt-2 border-t border-slate-800">
                <input type="text" required placeholder="الاسم بالكامل" value={orderForm.customerName} onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white" />
                <input type="tel" required dir="ltr" placeholder="رقم الهاتف (للتوصيل)" value={orderForm.phone} onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono" />
                <input type="text" required placeholder="المحافظة والعنوان بالتفصيل" value={orderForm.address} onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white" />
                <button type="submit" disabled={submittingOrder} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer">
                  {submittingOrder ? 'جاري الإرسال...' : `تأكيد الطلب الآن (${currentDynamicPrice} ج.م) 🚚`}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* 🌟 3. فوتر الشفافية والسياسات وروابط التواصل للزبائن */}
      <footer className="mt-12 border-t border-slate-800/80 bg-[#111827] p-6 max-w-4xl mx-auto rounded-3xl text-center space-y-4">
        
        {/* أزرار عرض السياسات */}
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

      {/* 🌟 4. النافذة المنبثقة التفاعلية للسياسات (Policy Modal) */}
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
