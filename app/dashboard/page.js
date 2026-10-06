'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function MerchantFullDashboard() {
  const router = useRouter();

  // 'home' | 'products' | 'orders' | 'my_policies' | 'platform_terms' | 'wallet' | 'settings'
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  const [myStore, setMyStore] = useState(null);
  const [platformLogo, setPlatformLogo] = useState('');
  const [exchangeRate, setExchangeRate] = useState(50.0);

  // سياسات منصة NEXT ORDER الرسمية (يقرأها من السوبر أدمن)
  const [platformTerms, setPlatformTerms] = useState({
    about_us: '',
    privacy_policy: '',
    terms_conditions: '',
    support_email: '',
    business_address: '',
    support_phone: '',
  });

  // سياسات وبيانات متجر التاجر الخاصة به (تظهر لزبائنه)
  const [storeSettings, setStoreSettings] = useState({
    store_name: '',
    owner_name: '',
    store_logo: '',
    store_description: '',
    support_phone: '',
    store_email: '',
    store_address: '',
    about_us: 'متجر متخصص في توفير أفضل المنتجات بأعلى معايير الجودة مع ضمان المعاينة قبل الاستلام.',
    privacy_policy: 'نضمن الحفاظ التام على سرية أرقام الهواتف وبيانات الشحن واستخدامها فقط لتوصيل طلبك.',
    return_policy: 'يحق للعميل استبدال أو استرجاع المنتج خلال 14 يوماً من الاستلام في حالته الأصلية.',
    shipping_policy: 'التوصيل خلال 2 إلى 4 أيام عمل لجميع المحافظات والدفع عند الاستلام.',
  });

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

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

    const { data: sData } = await supabase.from('store_profiles').select('*').eq('user_id', uid).maybeSingle();
    if (sData) setMyStore(sData);

    // جلب سياسات وشعار منصة NEXT ORDER من السوبر أدمن
    const { data: platSettings } = await supabase.from('store_settings').select('*').limit(1).maybeSingle();
    if (platSettings) {
      if (platSettings.store_logo) setPlatformLogo(platSettings.store_logo);
      setPlatformTerms({
        about_us: platSettings.about_us || '',
        privacy_policy: platSettings.privacy_policy || '',
        terms_conditions: platSettings.terms_conditions || '',
        support_email: platSettings.support_email || 'support@nextorder.shop',
        business_address: platSettings.business_address || 'القاهرة، مصر',
        support_phone: platSettings.support_phone || '',
      });
    }

    const { data: rateData } = await supabase.from('platform_exchange_rates').select('*').eq('id', 1).single();
    if (rateData) setExchangeRate(Number(rateData.usd_to_egp) || 50.0);

    const { data: setts } = await supabase.from('merchant_settings').select('*').eq('user_id', uid).maybeSingle();
    if (setts) setStoreSettings(prev => ({ ...prev, ...setts }));

    const { data: pData } = await supabase.from('products').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    if (pData) setProducts(pData);

    const { data: oData } = await supabase.from('orders').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    if (oData) setOrders(oData);

    setLoading(false);
  }

  // حفظ سياسات المتجر وتواصل التاجر
  const handleSaveStorePolicies = async (e) => {
    e.preventDefault();
    await supabase.from('merchant_settings').upsert({
      user_id: userId,
      ...storeSettings,
    }, { onConflict: 'user_id' });
    alert('✅ تم حفظ وتحديث سياسات وبيانات متجرك بنجاح وستظهر لزبائنك!');
  };

  const walletUsd = Number(myStore?.wallet_balance_usd || 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center font-sans" dir="rtl">
        <div className="animate-pulse text-lg font-bold">جاري فتح لوحة المتجر...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white font-sans flex flex-col md:flex-row select-none" dir="rtl">
      
      {/* 🧭 الشريط الجانبي */}
      <aside className="w-full md:w-64 bg-[#111827] border-b md:border-b-0 md:border-l border-slate-800 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="space-y-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              {platformLogo ? (
                <img src={platformLogo} alt="NEXT ORDER" className="w-9 h-9 object-contain rounded-xl bg-white p-0.5" />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-black font-black flex items-center justify-center text-sm">NO</div>
              )}
              <div>
                <span className="text-base font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent block leading-tight">NEXT ORDER</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.2 rounded-full">لوحة التاجر الشريك</span>
              </div>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-xs">
              <strong className="text-white block">{myStore?.store_name}</strong>
              <span className="text-emerald-400 font-bold">التاجر: {myStore?.owner_name}</span>
            </div>
          </div>

          <nav className="space-y-1 text-xs font-bold">
            {[
              { id: 'home', label: 'الرئيسية والمؤشرات', icon: '📊' },
              { id: 'products', label: `المنتجات (${products.length})`, icon: '🛍️' },
              { id: 'orders', label: `الطلبات (${orders.length})`, icon: '📦' },
              { id: 'my_policies', label: 'سياسات وتواصل متجري', icon: '📜' },
              { id: 'platform_terms', label: 'سياسات وشروط المنصة', icon: '🛡️' },
              { id: 'wallet', label: `المحفظة (${walletUsd.toFixed(2)}$)`, icon: '💳' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition cursor-pointer ${
                  activeTab === item.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <a href={`/store/${myStore?.store_slug}`} target="_blank" className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-black rounded-xl flex items-center justify-center gap-1.5">
            <span>عرض المتجر للزبائن ↗</span>
          </a>
        </div>
      </aside>

      {/* 🖥️ المحتوى */}
      <main className="flex-1 p-4 sm:p-8 space-y-6 overflow-y-auto">

        {/* 🌟 1. سياسات وتواصل متجر التاجر (تظهر للزبون) */}
        {activeTab === 'my_policies' && (
          <form onSubmit={handleSaveStorePolicies} className="bg-[#111827] border border-slate-800 p-6 rounded-3xl space-y-5 max-w-3xl">
            <div>
              <h3 className="text-base font-black text-white">إعداد سياسات وبيانات تواصل متجرك للزبائن</h3>
              <p className="text-xs text-slate-400">هذه البيانات تظهر في صفحة الشراء لزيادة ثقة المشتري وضمان حقوق الطرفين.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">البريد الإلكتروني الرسمي للمتجر</label>
                <input
                  type="email"
                  dir="ltr"
                  placeholder="contact@mystore.com"
                  value={storeSettings.store_email || ''}
                  onChange={(e) => setStoreSettings({ ...storeSettings, store_email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">عنوان المتجر / المخزن / المحافظة</label>
                <input
                  type="text"
                  placeholder="مثال: مدينة نصر، القاهرة"
                  value={storeSettings.store_address || ''}
                  onChange={(e) => setStoreSettings({ ...storeSettings, store_address: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">من نحن (عن متجرك وفريق العمل)</label>
                <textarea
                  rows="3"
                  value={storeSettings.about_us}
                  onChange={(e) => setStoreSettings({ ...storeSettings, about_us: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                ></textarea>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">سياسة الاستبدال والاسترجاع للعملاء</label>
                <textarea
                  rows="3"
                  value={storeSettings.return_policy}
                  onChange={(e) => setStoreSettings({ ...storeSettings, return_policy: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                ></textarea>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">سياسة الخصوصية وأمان بيانات الزبائن</label>
                <textarea
                  rows="3"
                  value={storeSettings.privacy_policy}
                  onChange={(e) => setStoreSettings({ ...storeSettings, privacy_policy: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                ></textarea>
              </div>
            </div>

            <button type="submit" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black cursor-pointer shadow-lg">
              حفظ السياسات وعرضها للمشترين 💾
            </button>
          </form>
        )}

        {/* 🌟 2. سياسات وشروط منصة NEXT ORDER (يراها التاجر من السوبر أدمن) */}
        {activeTab === 'platform_terms' && (
          <div className="bg-[#111827] border border-slate-800 p-6 rounded-3xl space-y-5 max-w-3xl">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>🛡️</span>
                <span>مركز الشفافية وسياسات منصة NEXT ORDER</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">البيانات والسياسات الرسمية المعتمدة من إدارة المنصة لتنظيم حقوق التجار والخدمات.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div>
                <span className="text-slate-400 block mb-0.5">بريد الدعم الفني للمنصة:</span>
                <strong className="text-cyan-400 font-mono">{platformTerms.support_email}</strong>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">مقر الإدارة:</span>
                <strong className="text-white">{platformTerms.business_address}</strong>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
                <h4 className="font-bold text-emerald-400 text-sm">من نحن:</h4>
                <p className="text-slate-300 leading-relaxed">{platformTerms.about_us || 'منظومة NEXT ORDER الرائدة في التجارة الإلكترونية والدفع عند الاستلام.'}</p>
              </div>

              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
                <h4 className="font-bold text-amber-400 text-sm">سياسة الخصوصية وأمان المنصة:</h4>
                <p className="text-slate-300 leading-relaxed">{platformTerms.privacy_policy || 'نلتزم بالحفاظ الكامل على سرية قواعد بيانات التجار والعملاء.'}</p>
              </div>

              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
                <h4 className="font-bold text-purple-400 text-sm">الشروط والأحكام واتفاقية الخدمة:</h4>
                <p className="text-slate-300 leading-relaxed">{platformTerms.terms_conditions || 'تخضع جميع المعاملات لشروط الاستخدام العادل وعمولة الطلب المتفق عليها.'}</p>
              </div>
            </div>
          </div>
        )}

        {/* باقي التبويبات (الرئيسية، المنتجات، الطلبات، المحفظة) */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            <h2 className="text-xl font-black">أهلاً بك يا {myStore?.owner_name || 'تاجرنا العزيز'} 🚀</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-[#111827] border border-slate-800 p-5 rounded-3xl">
                <span className="text-xs text-slate-400 block mb-1">المنتجات النشطة</span>
                <span className="text-2xl font-black text-white">{products.length}</span>
              </div>
              <div className="bg-[#111827] border border-slate-800 p-5 rounded-3xl">
                <span className="text-xs text-slate-400 block mb-1">الطلبات الكلية</span>
                <span className="text-2xl font-black text-blue-400">{orders.length}</span>
              </div>
              <div className="bg-[#111827] border border-slate-800 p-5 rounded-3xl">
                <span className="text-xs text-slate-400 block mb-1">رصيد المحفظة</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">{walletUsd.toFixed(2)}$</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-3">
            <h3 className="text-lg font-black">المنتجات ({products.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-[#111827] border border-slate-800 p-4 rounded-2xl">
                  <h4 className="font-bold text-sm text-white">{p.name}</h4>
                  <span className="text-emerald-400 font-bold block mt-1">{p.price} ج.م</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
