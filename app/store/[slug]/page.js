'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function StoreCheckoutPage() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [governorate, setGovernorate] = useState('القاهرة');
  const [address, setAddress] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [orderDone, setOrderDone] = useState(false);

  useEffect(() => {
    if (slug) loadStore();
  }, [slug]);

  async function loadStore() {
    setLoading(true);
    const { data: s } = await supabase.from('store_profiles').select('*').eq('store_slug', slug).maybeSingle();
    if (s) {
      setStore(s);
      const { data: p } = await supabase.from('products').select('*').eq('user_id', s.user_id);
      if (p && p.length) {
        setProducts(p);
        setSelectedProduct(p[0]);
      }
    }
    setLoading(false);
  }

  // إتمام الطلب وخصم الـ 0.05$
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (!/^01[0125][0-9]{8}$/.test(phone.trim())) {
      alert('يرجى كتابة رقم هاتف مصري صحيح يبدأ بـ 01.');
      return;
    }

    // التحقق من كفاية رصيد محفظة التاجر
    const currentWallet = Number(store.wallet_balance_usd || 0);
    if (currentWallet < 0.05) {
      alert('عذراً، المتجر غير متاح لاستقبال الطلبات حالياً بسبب صيانة المحفظة. يرجى التواصل مع التاجر.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. تسجيل الطلب في جدول orders
      const { data: order, error: orderErr } = await supabase.from('orders').insert([{
        user_id: store.user_id,
        customer_name: customerName.trim(),
        phone: phone.trim(),
        governorate,
        address: address.trim(),
        product_name: selectedProduct.name,
        quantity: 1,
        total_amount: Number(selectedProduct.price),
        status: 'جديد',
      }]).select().single();

      if (orderErr) throw orderErr;

      // 2. جلب سعر الصرف اللحظي
      const { data: rateData } = await supabase.from('platform_exchange_rates').select('*').eq('id', 1).single();
      const usdRate = Number(rateData?.usd_to_egp || 50.0);
      const feeUsd = 0.05;
      const feeEgp = feeUsd * usdRate;

      // 3. خصم 0.05$ من محفظة التاجر وتحديث الرصيد
      const newBal = Math.max(0, currentWallet - feeUsd);
      await supabase.from('store_profiles').update({
        wallet_balance_usd: newBal,
        total_orders_billed: (store.total_orders_billed || 0) + 1,
        is_active: newBal >= 0.05, // تجميد المتجر إن أصبح صفراً
      }).eq('id', store.id);

      // 4. تسجيل حركة الخصم المالي
      await supabase.from('wallet_transactions').insert([{
        user_id: store.user_id,
        store_name: store.store_name,
        type: 'order_fee',
        amount_usd: feeUsd,
        amount_egp: feeEgp,
        usd_rate: usdRate,
        order_id: order.id,
        description: `عمولة طلب جديد (${feeUsd}$ = ${feeEgp.toFixed(2)} ج.م)`,
      }]);

      setOrderDone(true);
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
    setSubmitting(false);
  };

  if (loading) return <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center">جاري فتح المتجر...</div>;

  if (orderDone) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center p-4" dir="rtl">
        <div className="bg-[#111827] border border-emerald-500/30 p-8 rounded-3xl text-center space-y-4 max-w-md w-full">
          <div className="text-4xl text-emerald-400">✓</div>
          <h2 className="text-xl font-black">تم استلام طلبك بنجاح!</h2>
          <p className="text-xs text-slate-400">سيتواصل معك مندوب المتجر لتسليم المنتج والدفع عند الاستلام.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white font-sans p-4 sm:p-8" dir="rtl">
      <div className="max-w-xl mx-auto space-y-6">
        
        <header className="text-center space-y-1">
          <h1 className="text-2xl font-black text-white">{store?.store_name}</h1>
          <p className="text-xs text-slate-400">شراء سريع ودفع عند الاستلام</p>
        </header>

        {selectedProduct && (
          <div className="bg-[#111827] border border-slate-800 p-5 rounded-3xl space-y-4">
            <h3 className="font-black text-base">{selectedProduct.name}</h3>
            <span className="text-2xl font-black text-emerald-400 block">{selectedProduct.price} ج.م</span>

            <form onSubmit={handlePlaceOrder} className="space-y-3 pt-3 border-t border-slate-800 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">الاسم بالكامل *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">رقم الهاتف (للتوصيل) *</label>
                <input
                  type="tel"
                  required
                  dir="ltr"
                  placeholder="01xxxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">المحافظة والعنوان بالتفصيل *</label>
                <input
                  type="text"
                  required
                  placeholder="المدينة / الشارع"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-xl transition cursor-pointer mt-2"
              >
                {submitting ? 'جاري تأكيد الطلب...' : 'تأكيد الطلب الآن (دفع عند الاستلام) 🚚'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
