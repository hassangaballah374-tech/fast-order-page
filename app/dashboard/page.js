'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function MerchantDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  const [myStore, setMyStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(50.0);

  // شاشات
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    initMerchant();
  }, []);

  async function initMerchant() {
    setLoading(true);
    let uid = null;
    const { data: { session } } = await supabase.auth.getSession();
    uid = session?.user?.id || localStorage.getItem('merchant_user_id');

    if (!uid) {
      router.push('/register');
      return;
    }
    setUserId(uid);

    // 1. جلب بيانات المتجر والمحفظة
    const { data: sData } = await supabase.from('store_profiles').select('*').eq('user_id', uid).maybeSingle();
    if (sData) setMyStore(sData);

    // 2. سعر الدولار
    const { data: rateData } = await supabase.from('platform_exchange_rates').select('*').eq('id', 1).single();
    if (rateData) setExchangeRate(Number(rateData.usd_to_egp) || 50.0);

    // 3. المنتجات والطلبات
    const { data: pData } = await supabase.from('products').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    if (pData) setProducts(pData);

    const { data: oData } = await supabase.from('orders').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    if (oData) setOrders(oData);

    setLoading(false);
  }

  const walletUsd = Number(myStore?.wallet_balance_usd || 0);
  const remainingOrders = Math.floor(walletUsd / 0.05);
  const isWalletDepleted = walletUsd < 0.05;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center font-sans" dir="rtl">
        <div className="animate-pulse text-lg font-bold">جاري فتح لوحة متجرك...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white font-sans pb-16" dir="rtl">
      
      {/* تنبيه نفاد المحفظة */}
      {isWalletDepleted && (
        <div className="bg-red-600 text-white text-xs font-black p-3 text-center flex items-center justify-center gap-2">
          <span>⚠️</span>
          <span>لقد نفد رصيد محفظتك! تم إيقاف استقبال الطلبات مؤقتاً لحين إعادة الشحن (الحد الأدنى 5$ = ~250 ج.م).</span>
        </div>
      )}

      {/* الرأس */}
      <header className="bg-[#111827] border-b border-slate-800 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              NEXT ORDER
            </span>
            <span className="text-xs text-slate-400 font-bold border-r border-slate-700 pr-3">متجر: {myStore?.store_name}</span>
          </div>

          <a
            href={`/store/${myStore?.store_slug}`}
            target="_blank"
            className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-mono hover:underline"
          >
            /store/{myStore?.store_slug} ↗
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-8 space-y-6">

        {/* 🌟 كرت المحفظة المسبقة والعمولة الحية */}
        <section className="bg-gradient-to-r from-[#111827] via-slate-900 to-[#111827] border-2 border-emerald-500/30 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <span>💳</span>
              <span>رصيد محفظة متجرك المسبقة</span>
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-emerald-400 font-mono">{walletUsd.toFixed(2)}$</span>
              <span className="text-sm text-slate-400 font-mono">(~{Math.round(walletUsd * exchangeRate)} ج.م)</span>
            </div>
            <p className="text-xs text-slate-400">
              يكفيك لاستقبال حتى: <strong className="text-cyan-400 font-bold">{remainingOrders} أوردر قادم</strong> (يخصم 0.05$ لكل أوردر ناجح فقط).
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => {
                const phone = '01000000000'; // رقم أدمن المنصة
                const msg = encodeURIComponent(`مرحباً، أود شحن محفظة متجري (${myStore?.store_name}) في NEXT ORDER بمبلغ 5$ أو ما يعادلها بالمصري.`);
                window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
              }}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black shadow-lg transition flex items-center gap-2 cursor-pointer w-full justify-center"
            >
              <span>⚡</span>
              <span>شحن المحفظة الآن (5$ = ~250 ج.م)</span>
            </button>
          </div>
        </section>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs text-slate-400 block mb-1">الطلبات الواردة</span>
            <span className="text-2xl font-black text-blue-400">{orders.length}</span>
          </div>
          <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs text-slate-400 block mb-1">المنتجات النشطة</span>
            <span className="text-2xl font-black text-teal-400">{products.length}</span>
          </div>
          <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs text-slate-400 block mb-1">إجمالي المبيعات</span>
            <span className="text-2xl font-black text-emerald-400">
              {orders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0).toLocaleString()} ج.م
            </span>
          </div>
          <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs text-slate-400 block mb-1">عمولة الطلبات المخصومة</span>
            <span className="text-2xl font-black text-rose-400">
              {((myStore?.total_orders_billed || 0) * 0.05).toFixed(2)}$
            </span>
          </div>
        </div>

        {/* قائمة الطلبات */}
        <div className="bg-[#111827] border border-slate-800 p-6 rounded-3xl space-y-4">
          <h3 className="text-base font-black">أحدث الطلبات الواردة لمتجرك ({orders.length})</h3>
          <div className="space-y-2">
            {orders.map((o, idx) => (
              <div key={o.id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <strong className="text-white block">طلب #{idx + 1} - {o.customer_name}</strong>
                  <span className="text-slate-400">{o.product_name} | {o.phone}</span>
                </div>
                <div className="text-right">
                  <strong className="text-emerald-400 block font-mono">{o.total_amount} ج.م</strong>
                  <span className="text-[10px] text-slate-500">تم خصم عمولة (0.05$)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

    </div>
  );
}
