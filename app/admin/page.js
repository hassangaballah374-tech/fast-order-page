'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('merchants');
  const [loading, setLoading] = useState(true);

  const [merchants, setMerchants] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(50.0);
  const [orderFeeUsd, setOrderFeeUsd] = useState(0.05);

  // حالة نافذة شحن المحفظة
  const [rechargeModalMerchant, setRechargeModalMerchant] = useState(null);
  const [chargeUsd, setChargeUsd] = useState(5.0);
  const [chargeEgp, setChargeEgp] = useState(250.0);

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    setLoading(true);
    try {
      // 1. جلب سعر الصرف
      const { data: rateData } = await supabase.from('platform_exchange_rates').select('*').eq('id', 1).single();
      if (rateData) {
        setExchangeRate(Number(rateData.usd_to_egp) || 50.0);
        setOrderFeeUsd(Number(rateData.order_fee_usd) || 0.05);
      }

      // 2. جلب المتاجر
      const { data: mData } = await supabase.from('store_profiles').select('*').order('created_at', { ascending: false });
      if (mData) setMerchants(mData);

      // 3. جلب سجل العمليات المالية
      const { data: tData } = await supabase.from('wallet_transactions').select('*').order('created_at', { ascending: false }).limit(100);
      if (tData) setTransactions(tData);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  // تحديث سعر الدولار اللحظي في النظام
  const handleUpdateExchangeRate = async () => {
    await supabase.from('platform_exchange_rates').update({
      usd_to_egp: Number(exchangeRate),
      order_fee_usd: Number(orderFeeUsd),
      updated_at: new Date().toISOString(),
    }).eq('id', 1);

    alert(`✅ تم تحديث سعر صرف الدولار إلى ${exchangeRate} ج.م وعمولة الأوردر إلى ${orderFeeUsd}$ بنجاح!`);
    loadAdminData();
  };

  // شحن محفظة التاجر
  const handleConfirmRecharge = async () => {
    if (!rechargeModalMerchant) return;
    const currentBal = Number(rechargeModalMerchant.wallet_balance_usd || 0);
    const newBal = currentBal + Number(chargeUsd);

    // 1. تحديث رصيد المتجر وتفعيله
    await supabase.from('store_profiles').update({
      wallet_balance_usd: newBal,
      is_active: true,
      subscription_status: 'active',
      amount_paid: (Number(rechargeModalMerchant.amount_paid) || 0) + Number(chargeEgp),
    }).eq('id', rechargeModalMerchant.id);

    // 2. تسجيل معاملة إيداع
    await supabase.from('wallet_transactions').insert([{
      user_id: rechargeModalMerchant.user_id,
      store_name: rechargeModalMerchant.store_name,
      type: 'deposit',
      amount_usd: Number(chargeUsd),
      amount_egp: Number(chargeEgp),
      usd_rate: Number(exchangeRate),
      description: `شحن محفظة التاجر (${chargeUsd}$ = ${chargeEgp} ج.م)`,
    }]);

    alert(`✅ تم شحن ${chargeUsd}$ وتفعيل متجر (${rechargeModalMerchant.store_name}) بنجاح!`);
    setRechargeModalMerchant(null);
    loadAdminData();
  };

  // الدخول كتاجر بنقرة واحدة
  const handleLoginAs = (merchant) => {
    if (!merchant.user_id) return alert('لا يوجد معرف تاجر');
    localStorage.setItem('merchant_user_id', merchant.user_id);
    router.push('/dashboard');
  };

  const filteredMerchants = merchants.filter(m =>
    (m.store_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.owner_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.phone || '').includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex items-center justify-center font-sans" dir="rtl">
        <div className="animate-pulse text-lg font-bold">جاري تحميل لوحة السوبر أدمن المالية...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-white font-sans flex flex-col md:flex-row select-none" dir="rtl">
      
      {/* القائمة الجانبية */}
      <aside className="w-full md:w-64 bg-[#0d1322] border-b md:border-b-0 md:border-l border-slate-800 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div>
            <span className="text-xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              NEXT ORDER
            </span>
            <p className="text-[10px] text-slate-400 mt-1">نظام المحفظة & 0.05$ لكل أوردر</p>
          </div>

          <nav className="space-y-1.5 text-xs font-bold">
            <button
              onClick={() => setActiveTab('merchants')}
              className={`w-full flex items-center gap-2.5 p-3 rounded-2xl transition cursor-pointer ${
                activeTab === 'merchants' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span>🏪</span>
              <span>المتاجر والمحافظ ({merchants.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('rates')}
              className={`w-full flex items-center gap-2.5 p-3 rounded-2xl transition cursor-pointer ${
                activeTab === 'rates' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span>💱</span>
              <span>سعر الصرف والعمولة</span>
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`w-full flex items-center gap-2.5 p-3 rounded-2xl transition cursor-pointer ${
                activeTab === 'ledger' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span>📜</span>
              <span>سجل الحركات والخصومات</span>
            </button>
          </nav>
        </div>

        <button
          onClick={() => {
            const link = `${window.location.origin}/register`;
            navigator.clipboard.writeText(link);
            alert('📋 تم نسخ رابط تسجيل التجار:\n' + link);
          }}
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
        >
          🔗 نسخ رابط التسجيل
        </button>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 p-4 sm:p-8 space-y-6 overflow-y-auto">

        {/* 1. إدارة المتاجر والمحافظ */}
        {activeTab === 'merchants' && (
          <div className="space-y-4">
            <div className="bg-[#0d1322] p-5 rounded-3xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-lg font-black text-white">إدارة محافظ المتاجر ({filteredMerchants.length})</h2>
                <p className="text-xs text-slate-400">شحن الرصيد ومتابعة استهلاك عمولة الطلبات (0.05$ لكل أوردر)</p>
              </div>
              <input
                type="text"
                placeholder="بحث باسم المتجر أو المالك..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs p-2.5 rounded-xl w-60 text-white"
              />
            </div>

            <div className="space-y-3">
              {filteredMerchants.map((m) => {
                const bal = Number(m.wallet_balance_usd || 0);
                const ordersCapacity = Math.floor(bal / 0.05);

                return (
                  <div key={m.id} className="bg-[#0d1322] border border-slate-800 p-5 rounded-3xl space-y-3 hover:border-slate-700 transition">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-base text-white">{m.store_name}</strong>
                        <span className="text-xs text-slate-400 font-mono">({m.store_slug})</span>
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                          bal > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {bal > 0 ? '🟢 المتجر مفعل' : '🔴 المحفظة فارغة (معلق)'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400">
                        المالك: <strong className="text-white">{m.owner_name}</strong> ({m.phone})
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-2xl">
                      <div>رصيد المحفظة: <strong className="text-emerald-400 font-mono font-bold">{bal.toFixed(2)}$</strong> ({Math.round(bal * exchangeRate)} ج.م)</div>
                      <div>يكفي حتى: <strong className="text-cyan-400 font-mono font-bold">{ordersCapacity} أوردر</strong></div>
                      <div>أوردرات مخصومة: <strong className="text-amber-400 font-mono">{m.total_orders_billed || 0}</strong></div>
                      <div>إجمالي ما شحنه: <strong className="text-white font-mono">{m.amount_paid || 0} ج.م</strong></div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleLoginAs(m)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        🔑 دخول كتاجر
                      </button>
                      <button
                        onClick={() => {
                          setRechargeModalMerchant(m);
                          setChargeUsd(5.0);
                          setChargeEgp(Math.round(5.0 * exchangeRate));
                        }}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg transition cursor-pointer"
                      >
                        💳 شحن المحفظة
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. ضبط أسعار الصرف والعمولة */}
        {activeTab === 'rates' && (
          <div className="bg-[#0d1322] border border-slate-800 p-6 rounded-3xl max-w-xl space-y-4">
            <h3 className="text-base font-black">ضبط سعر الصرف والعمولة اللحظية</h3>
            <p className="text-xs text-slate-400">سعر الدولار المعتمد لتحويل الـ 5$ عند الشحن ولحساب الـ 0.05$ لكل طلب</p>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">سعر الدولار المعتمد بالجنيه المصري (USD/EGP)</label>
              <input
                type="number"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm font-bold text-emerald-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">العمولة لكل طلب ناجح بالدولار ($)</label>
              <input
                type="number"
                step="0.01"
                value={orderFeeUsd}
                onChange={(e) => setOrderFeeUsd(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm font-bold text-amber-400"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                تساوي حالياً: <strong>{(orderFeeUsd * exchangeRate).toFixed(2)} جنيه مصري</strong> لكل أوردر.
              </span>
            </div>

            <button
              onClick={handleUpdateExchangeRate}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              حفظ التحديث اللحظي 💾
            </button>
          </div>
        )}

        {/* 3. سجل حركات المحفظة والخصومات */}
        {activeTab === 'ledger' && (
          <div className="bg-[#0d1322] border border-slate-800 rounded-3xl p-5 space-y-4">
            <h3 className="text-base font-black">سجل العمليات المالية والخصومات الحية</h3>
            <div className="space-y-2">
              {transactions.map((t) => (
                <div key={t.id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <strong className="text-white block">{t.store_name}</strong>
                    <span className="text-slate-400">{t.description}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono font-bold block ${t.type === 'deposit' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.type === 'deposit' ? `+${t.amount_usd}$` : `-${t.amount_usd}$`}
                    </span>
                    <span className="text-[10px] text-slate-500">{new Date(t.created_at).toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* نافذة شحن محفظة التاجر */}
      {rechargeModalMerchant && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1322] border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-black border-b border-slate-800 pb-2">
              شحن محفظة: {rechargeModalMerchant.store_name}
            </h3>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400">
              الرصيد الحالي: <strong>{Number(rechargeModalMerchant.wallet_balance_usd || 0).toFixed(2)}$</strong>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">المبلغ بالدولار ($)</label>
                <input
                  type="number"
                  min="5"
                  value={chargeUsd}
                  onChange={(e) => {
                    const u = Number(e.target.value);
                    setChargeUsd(u);
                    setChargeEgp(Math.round(u * exchangeRate));
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 font-bold text-emerald-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">المعادل بالمصري (ج.م)</label>
                <input
                  type="number"
                  value={chargeEgp}
                  onChange={(e) => {
                    const eg = Number(e.target.value);
                    setChargeEgp(eg);
                    setChargeUsd(Number((eg / exchangeRate).toFixed(2)));
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 font-bold text-white"
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-900/60 p-3 rounded-xl space-y-1">
              <div>• عمولة الأوردر الواحد: <strong>{orderFeeUsd}$</strong> (~{(orderFeeUsd * exchangeRate).toFixed(2)} ج.م).</div>
              <div>• سعة الشحن: <strong>{Math.floor(chargeUsd / orderFeeUsd)} أوردر</strong>.</div>
              <div>• الرصيد المتبقي بنهاية الشهر يرحل تلقائياً دون أي فقد.</div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button onClick={() => setRechargeModalMerchant(null)} className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-bold">إلغاء</button>
              <button onClick={handleConfirmRecharge} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 font-black text-xs rounded-xl shadow-lg">
                تأكيد الشحن والتفعيل 🚀
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
