'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function MerchantEasyOrdersMaster() {
  const router = useRouter();
  
  // الشاشات عبر الشريط الجانبي:
  // 'home' | 'products' | 'landing_builder' | 'orders' | 'shipping' | 'policies' | 'blacklist' | 'pixels' | 'settings'
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  const [myStore, setMyStore] = useState(null);
  const [storeSettings, setStoreSettings] = useState({
    store_name: '',
    store_logo: '',
    store_description: '',
    support_phone: '',
    announcement_text: '',
    theme_style: 'modern',
    return_policy: 'يحق للعميل استبدال أو استرجاع المنتج خلال 14 يوماً من الاستلام في حالته الأصلية.',
    shipping_policy: 'التوصيل خلال 2 إلى 4 أيام عمل لجميع المحافظات والدفع عند الاستلام.',
    facebook_url: '',
    instagram_url: '',
    tiktok_url: '',
    pixel_1: '', token_1: '',
    pixel_2: '', token_2: '',
    tiktok_pixel_id: '',
    snapchat_pixel_id: '',
  });

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [shippingRates, setShippingRates] = useState([]);
  const [blacklist, setBlacklist] = useState([]);
  const [analytics, setAnalytics] = useState([]);

  // حالات مودال المنتج
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '', price: '', original_price: '', cost_price: '', stock: 20,
    images: [], videos: [], sizes: [], colors: [],
    landing_headline: '', landing_video_url: '', product_features: [],
    custom_pixel_id: '', custom_pixel_token: '',
  });

  const [tagFeature, setTagFeature] = useState('');
  const [tagSize, setTagSize] = useState('');
  const [tagColor, setTagColor] = useState('');

  // إضافة رقم للقائمة السوداء
  const [blacklistPhone, setBlacklistPhone] = useState('');
  const [blacklistReason, setBlacklistReason] = useState('');

  // تخصيص شحن محافظة
  const [selectedGov, setSelectedGov] = useState('القاهرة');
  const [govShippingCost, setGovShippingCost] = useState('50');

  const governoratesList = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'البحيرة', 'الغربية', 'المنوفية',
    'الشرقية', 'الدقهلية', 'كفر الشيخ', 'القليوبية', 'دمياط', 'بورسعيد',
    'الإسماعيلية', 'السويس', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط',
    'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر', 'مطروح',
  ];

  useEffect(() => {
    initMerchantFull();
  }, []);

  async function initMerchantFull() {
    setLoading(true);
    let uid = null;
    const { data: { session } } = await supabase.auth.getSession();
    uid = session?.user?.id || localStorage.getItem('merchant_user_id');

    if (!uid) {
      router.push('/register');
      return;
    }
    setUserId(uid);

    // 1. البروفايل
    const { data: sData } = await supabase.from('store_profiles').select('*').eq('user_id', uid).maybeSingle();
    if (sData) setMyStore(sData);

    // 2. الإعدادات
    const { data: setts } = await supabase.from('merchant_settings').select('*').eq('user_id', uid).maybeSingle();
    if (setts) setStoreSettings(prev => ({ ...prev, ...setts }));

    // 3. المنتجات والطلبات
    const { data: pList } = await supabase.from('products').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    if (pList) setProducts(pList);

    const { data: oList } = await supabase.from('orders').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    if (oList) setOrders(oList);

    // 4. أسعار الشحن والقائمة السوداء
    const { data: shipList } = await supabase.from('shipping_rates').select('*').eq('user_id', uid);
    if (shipList) setShippingRates(shipList);

    const { data: bList } = await supabase.from('blacklist').select('*').eq('user_id', uid);
    if (bList) setBlacklist(bList);

    // 5. التحليلات
    const { data: aList } = await supabase.from('store_analytics').select('*').eq('user_id', uid);
    if (aList) setAnalytics(aList);

    setLoading(false);
  }

  // حفظ الإعدادات والسياسات
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    await supabase.from('merchant_settings').upsert({ user_id: userId, ...storeSettings }, { onConflict: 'user_id' });
    alert('✅ تم حفظ كافة الإعدادات والسياسات بنجاح!');
  };

  // حفظ سعر الشحن للمحافظة
  const handleSaveShippingRate = async () => {
    await supabase.from('shipping_rates').upsert({
      user_id: userId,
      governorate: selectedGov,
      cost: Number(govShippingCost),
      is_free: Number(govShippingCost) === 0,
    }, { onConflict: 'user_id,governorate' });
    alert(`✅ تم تحديث شحن محافظة ${selectedGov} بمبلغ ${govShippingCost} ج.م`);
    initMerchantFull();
  };

  // إضافة رقم للبلاك ليست
  const handleAddBlacklist = async () => {
    if (!blacklistPhone) return alert('يرجى كتابة رقم الهاتف');
    await supabase.from('blacklist').insert([{
      user_id: userId,
      phone: blacklistPhone.trim(),
      reason: blacklistReason || 'عميل مزعج / وهمي',
    }]);
    setBlacklistPhone('');
    setBlacklistReason('');
    initMerchantFull();
  };

  // حفظ المنتج وصفحة الهبوط
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const payload = {
      user_id: userId,
      name: productForm.name,
      price: Number(productForm.price),
      original_price: Number(productForm.original_price) || 0,
      cost_price: Number(productForm.cost_price) || 0,
      stock: Number(productForm.stock) || 0,
      images: productForm.images,
      videos: productForm.videos,
      sizes: productForm.sizes,
      colors: productForm.colors,
      landing_headline: productForm.landing_headline,
      landing_video_url: productForm.landing_video_url,
      product_features: productForm.product_features,
      custom_pixel_id: productForm.custom_pixel_id.trim(),
      custom_pixel_token: productForm.custom_pixel_token.trim(),
    };

    if (editingProductId) {
      await supabase.from('products').update(payload).eq('id', editingProductId);
    } else {
      await supabase.from('products').insert([payload]);
    }
    setShowProductModal(false);
    initMerchantFull();
  };

  // العمليات الحسابية
  const totalSales = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const totalCost = orders.reduce((sum, o) => sum + (Number(o.cost_price) || 0), 0);
  const netProfit = totalSales - totalCost;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center font-sans" dir="rtl">
        <div className="animate-pulse text-lg font-bold">جاري فتح منظومة التاجر...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white font-sans flex flex-col md:flex-row" dir="rtl">
      
      {/* 🧭 الشريط الجانبي الاحترافي (Easy Orders Sidebar) */}
      <aside className="w-full md:w-64 bg-[#111827] border-b md:border-b-0 md:border-l border-slate-800 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          
          {/* هوية المنصة والمتجر */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                NEXT ORDER
              </span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 font-bold truncate">متجر: {myStore?.store_name}</p>
          </div>

          {/* روابط الشريط الجانبي */}
          <nav className="space-y-1.5 text-xs font-bold">
            {[
              { id: 'home', label: 'الرئيسية والمؤشرات', icon: '📊' },
              { id: 'products', label: 'المنتجات والمخزون', icon: '🛍️' },
              { id: 'landing_builder', label: 'القوالب وصفحات الهبوط', icon: '🎨' },
              { id: 'orders', label: 'الطلبات والمبيعات', icon: '📦' },
              { id: 'shipping', label: 'أسعار الشحن والمحافظات', icon: '🚚' },
              { id: 'policies', label: 'السياسات وطرق التواصل', icon: '📜' },
              { id: 'blacklist', label: 'حظر الطلبات الوهمية', icon: '🚫' },
              { id: 'pixels', label: 'تتبع البيكسل (CAPI)', icon: '⚡' },
              { id: 'settings', label: 'إعدادات وهوية المتجر', icon: '⚙️' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

        </div>

        {/* زر رابط المتجر السريع */}
        <div className="pt-4 border-t border-slate-800">
          <a
            href={`/store/${myStore?.store_slug}`}
            target="_blank"
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition"
          >
            <span>زيارة متجرك للزبائن</span>
            <span>↗</span>
          </a>
        </div>
      </aside>

      {/* 🖥️ منطقة المحتوى الرئيسية */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-6">
        
        {/* 1. الرئيسية والمؤشرات */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black">نظرة عامة على أداء المتجر</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs text-slate-400 block mb-1">إجمالي المبيعات</span>
                <span className="text-2xl font-black text-emerald-400">{totalSales.toLocaleString()} ج.م</span>
              </div>
              <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs text-slate-400 block mb-1">صافي الأرباح</span>
                <span className="text-2xl font-black text-cyan-400">{netProfit.toLocaleString()} ج.م</span>
              </div>
              <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs text-slate-400 block mb-1">إجمالي الطلبات</span>
                <span className="text-2xl font-black text-blue-400">{orders.length}</span>
              </div>
              <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs text-slate-400 block mb-1">زوار المتجر</span>
                <span className="text-2xl font-black text-purple-400">{analytics.filter(a => a.event_type === 'visit').length}</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. القوالب وصفحات الهبوط (Landing & Theme Builder) */}
        {activeTab === 'landing_builder' && (
          <div className="bg-[#111827] border border-slate-800 p-6 rounded-3xl space-y-6 max-w-4xl">
            <div>
              <h3 className="text-lg font-black">تخصيص نمط المتجر وصفحات الهبوط</h3>
              <p className="text-xs text-slate-400">اختر الشكل والمظهر وطريقة عرض منتجاتك لزيادة المبيعات</p>
            </div>

            {/* أنماط القوالب */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: 'modern', name: 'المتجر الحديث (Modern Store)', desc: 'عرض شبكي أنيق مع شراء سريع' },
                { id: 'landing', name: 'صفحة هبوط مباشرة (High Conversion Landing)', desc: 'فيديو في الصدارة ومميزات بارزة ونموذج أسفلها' },
                { id: 'classic', name: 'الكلاسيكي السريع (Classic COD)', desc: 'تصميم فائق السرعة مخصص لحملات الموبايل' },
              ].map((th) => (
                <div
                  key={th.id}
                  onClick={() => setStoreSettings({ ...storeSettings, theme_style: th.id })}
                  className={`p-4 rounded-2xl border cursor-pointer transition space-y-2 ${
                    storeSettings.theme_style === th.id
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-800 bg-slate-900'
                  }`}
                >
                  <span className="text-xs font-bold text-white block">{th.name}</span>
                  <p className="text-[11px] text-slate-400">{th.desc}</p>
                </div>
              ))}
            </div>

            <button
              onClick={handleSaveSettings}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              حفظ النمط المختار 💾
            </button>
          </div>
        )}

        {/* 3. أسعار الشحن المخصصة للمحافظات */}
        {activeTab === 'shipping' && (
          <div className="bg-[#111827] border border-slate-800 p-6 rounded-3xl space-y-6 max-w-3xl">
            <div>
              <h3 className="text-lg font-black">مصفوفة أسعار الشحن للمحافظات</h3>
              <p className="text-xs text-slate-400">حدد سعر الشحن لكل محافظة (اكتب 0 للشحن المجاني)</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedGov}
                onChange={(e) => setSelectedGov(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs p-3 rounded-xl text-white flex-1"
              >
                {governoratesList.map((g, i) => <option key={i} value={g}>{g}</option>)}
              </select>

              <input
                type="number"
                placeholder="سعر الشحن (ج.م)"
                value={govShippingCost}
                onChange={(e) => setGovShippingCost(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs p-3 rounded-xl text-white font-bold w-40"
              />

              <button
                onClick={handleSaveShippingRate}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                تحديث الشحن 🚚
              </button>
            </div>

            <div className="space-y-2 border-t border-slate-800 pt-4">
              <h4 className="text-xs font-bold text-slate-300">الأسعار المسجلة حالياً:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {shippingRates.map((r) => (
                  <div key={r.id} className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex justify-between">
                    <span>{r.governorate}</span>
                    <strong className="text-emerald-400">{r.is_free ? 'مجاني' : `${r.cost} ج.م`}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. السياسات والشروط وروابط التواصل (Trust & Policies) */}
        {activeTab === 'policies' && (
          <form onSubmit={handleSaveSettings} className="bg-[#111827] border border-slate-800 p-6 rounded-3xl space-y-5 max-w-3xl">
            <div>
              <h3 className="text-lg font-black">السياسات وروابط السوشيال ميديا</h3>
              <p className="text-xs text-slate-400">تظهر في أسفل المتجر لزيادة ثقة العميل في الشراء</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">سياسة الاستبدال والاسترجاع</label>
              <textarea
                rows="3"
                value={storeSettings.return_policy}
                onChange={(e) => setStoreSettings({ ...storeSettings, return_policy: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">سياسة الشحن والتسليم</label>
              <textarea
                rows="3"
                value={storeSettings.shipping_policy}
                onChange={(e) => setStoreSettings({ ...storeSettings, shipping_policy: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">رابط صفحة فيسبوك</label>
                <input
                  type="url"
                  dir="ltr"
                  value={storeSettings.facebook_url}
                  onChange={(e) => setStoreSettings({ ...storeSettings, facebook_url: e.target.value })}
                  placeholder="https://facebook.com/..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">رابط إنستجرام</label>
                <input
                  type="url"
                  dir="ltr"
                  value={storeSettings.instagram_url}
                  onChange={(e) => setStoreSettings({ ...storeSettings, instagram_url: e.target.value })}
                  placeholder="https://instagram.com/..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">رابط تيك توك</label>
                <input
                  type="url"
                  dir="ltr"
                  value={storeSettings.tiktok_url}
                  onChange={(e) => setStoreSettings({ ...storeSettings, tiktok_url: e.target.value })}
                  placeholder="https://tiktok.com/@..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
            </div>

            <button type="submit" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer">
              حفظ السياسات والدعم 💾
            </button>
          </form>
        )}

        {/* 5. القائمة السوداء وحظر الطلبات الوهمية */}
        {activeTab === 'blacklist' && (
          <div className="bg-[#111827] border border-slate-800 p-6 rounded-3xl space-y-6 max-w-3xl">
            <div>
              <h3 className="text-lg font-black text-rose-400">حظر الأرقام والطلبات الوهمية (Blacklist)</h3>
              <p className="text-xs text-slate-400">أي رقم مضاف هنا سيتم منعه تلقائياً من إتمام أي طلب على متجرك</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="tel"
                dir="ltr"
                placeholder="01xxxxxxxxx"
                value={blacklistPhone}
                onChange={(e) => setBlacklistPhone(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs p-3 rounded-xl text-white font-mono flex-1"
              />
              <input
                type="text"
                placeholder="سبب الحظر (مثلاً: يرفض الاستلام)"
                value={blacklistReason}
                onChange={(e) => setBlacklistReason(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs p-3 rounded-xl text-white flex-1"
              />
              <button
                onClick={handleAddBlacklist}
                className="px-5 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                حظر الرقم 🚫
              </button>
            </div>

            <div className="space-y-2 border-t border-slate-800 pt-4">
              <h4 className="text-xs font-bold text-slate-300">الأرقام المحظورة: ({blacklist.length})</h4>
              {blacklist.map((b) => (
                <div key={b.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <strong className="font-mono text-rose-400 block" dir="ltr">{b.phone}</strong>
                    <span className="text-slate-400 text-[11px]">{b.reason}</span>
                  </div>
                  <button
                    onClick={async () => {
                      await supabase.from('blacklist').delete().eq('id', b.id);
                      initMerchantFull();
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    إلغاء الحظر
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. باقي الأقسام (المنتجات، الطلبات، البيكسل، الإعدادات) */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black">منتجات المتجر ({products.length})</h3>
              <button
                onClick={() => {
                  setEditingProductId(null);
                  setProductForm({
                    name: '', price: '', original_price: '', cost_price: '', stock: 20,
                    images: [], videos: [], sizes: [], colors: [],
                    landing_headline: '', landing_video_url: '', product_features: [],
                    custom_pixel_id: '', custom_pixel_token: '',
                  });
                  setShowProductModal(true);
                }}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                ➕ إضافة منتج جديد
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {products.map((p) => (
                <div key={p.id} className="bg-[#111827] border border-slate-800 p-4 rounded-3xl space-y-3">
                  <div className="w-full h-36 bg-slate-900 rounded-2xl flex items-center justify-center overflow-hidden">
                    {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-contain" /> : '📦'}
                  </div>
                  <h4 className="font-bold text-sm text-white truncate">{p.name}</h4>
                  <div className="flex justify-between text-xs">
                    <span className="text-emerald-400 font-bold">{p.price} ج.م</span>
                    <span className="text-slate-400">المخزون: {p.stock || 20}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* نافذة إضافة وتعديل المنتج المتكاملة مع بيانات صفحة الهبوط */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveProduct} className="bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full my-8 space-y-4">
            <h3 className="text-base font-black border-b border-slate-800 pb-3">بيانات المنتج وصفحة الهبوط</h3>
            
            <input
              type="text"
              required
              placeholder="اسم المنتج"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
            />

            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                required
                placeholder="سعر البيع"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white font-bold"
              />
              <input
                type="number"
                placeholder="السعر قبل الخصم"
                value={productForm.original_price}
                onChange={(e) => setProductForm({ ...productForm, original_price: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
              />
              <input
                type="number"
                placeholder="المخزون"
                value={productForm.stock}
                onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
              />
            </div>

            <input
              type="text"
              placeholder="عنوان تسويقي عريض لصفحة الهبوط (مثال: المنتج الأكثر مبيعاً في 2026)"
              value={productForm.landing_headline}
              onChange={(e) => setProductForm({ ...productForm, landing_headline: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
            />

            <input
              type="url"
              dir="ltr"
              placeholder="رابط فيديو توضيحي (YouTube / Vimeo / Direct)"
              value={productForm.landing_video_url}
              onChange={(e) => setProductForm({ ...productForm, landing_video_url: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onClick={() => setShowProductModal(false)} className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-bold">إلغاء</button>
              <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">حفظ المنتج 🚀</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
