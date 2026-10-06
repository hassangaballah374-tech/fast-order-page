'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AppGridDashboard() {
  // 'home' تعرض شبكة الكروت الرئيسية
  // أو تعرض القسم المختار: 'subscribers' | 'orders' | 'products' | 'analytics' | 'pixels'
  const [activeScreen, setActiveScreen] = useState('home');

  const [loading, setLoading] = useState(true);

  // بيانات المشتركين
  const [subscribers, setSubscribers] = useState([]);
  const [editingSub, setEditingSub] = useState(null);
  const [durationMonths, setDurationMonths] = useState(1);
  const [paymentAmount, setPaymentAmount] = useState('');

  // بيانات المتجر والبيكسل
  const [settings, setSettings] = useState({
    store_name: '',
    pixel_1: '', token_1: '',
    pixel_2: '', token_2: '',
    pixel_3: '', token_3: '',
    pixel_4: '', token_4: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // الطلبات والمنتجات والتحليلات
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '', price: '', cost_price: '', stock: 20, images: [],
  });
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      if (supabase) {
        const { data: subData } = await supabase.from('store_profiles').select('*').order('created_at', { ascending: false });
        if (subData) setSubscribers(subData);

        const { data: sData } = await supabase.from('store_settings').select('*').limit(1).maybeSingle();
        if (sData) {
          setSettings({
            store_name: sData.store_name || '',
            pixel_1: sData.pixel_1 || sData.facebook_pixel_id || '',
            token_1: sData.token_1 || sData.facebook_api_token || '',
            pixel_2: sData.pixel_2 || '', token_2: sData.token_2 || '',
            pixel_3: sData.pixel_3 || '', token_3: sData.token_3 || '',
            pixel_4: sData.pixel_4 || '', token_4: sData.token_4 || '',
          });
        }

        const { data: pData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (pData) setProducts(pData);

        const { data: oData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (oData) setOrders(oData);

        const { data: aData } = await supabase.from('store_analytics').select('*');
        if (aData) setAnalytics(aData);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  // تفعيل المشترك
  const handleActivateSubscriber = async (sub) => {
    const months = parseInt(durationMonths) || 1;
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + months);

    const payload = {
      is_active: true,
      subscription_ends_at: expiry.toISOString(),
      amount_paid: Number(paymentAmount) || Number(sub.amount_paid) || 0,
    };

    const { error } = await supabase.from('store_profiles').update(payload).eq('id', sub.id);
    if (!error) {
      alert(`✅ تم تفعيل متجر (${sub.store_name}) بنجاح!`);
      setEditingSub(null);
      loadAllData();
    }
  };

  const handleDeactivateSubscriber = async (id) => {
    if (!confirm('تعطيل هذا المتجر؟')) return;
    await supabase.from('store_profiles').update({ is_active: false }).eq('id', id);
    loadAllData();
  };

  // إعدادات البيكسل
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    await supabase.from('store_settings').upsert({ id: 1, ...settings });
    alert('✅ تم حفظ الإعدادات والبيكسلات!');
    setSavingSettings(false);
  };

  // إحصائيات
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount || o.total_price) || 0), 0);
  const totalOrdersCount = orders.length;
  const visitorsCount = analytics.filter(a => a.event_type === 'visit').length;
  const averageOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;
  const conversionRate = visitorsCount > 0 ? ((totalOrdersCount / visitorsCount) * 100).toFixed(2) : '0.00';

  // الكروت المعروضة في الشاشة الرئيسية بنفس شكل وألوان وتصميم الصورة
  const gridCards = [
    {
      id: 'subscribers',
      title: 'المشتركين والعملاء',
      desc: 'إدارة المتاجر وتفعيل الاشتراكات وتحديد المبالغ',
      icon: '👥',
      bgClass: 'bg-gradient-to-r from-emerald-500 to-teal-600',
      badge: `${subscribers.length} مشترك`,
    },
    {
      id: 'orders',
      title: 'طلبات جديدة ومبيعات',
      desc: 'متابعة شحن وتأكيد الطلبات الواردة فوراً',
      icon: '📦',
      bgClass: 'bg-gradient-to-r from-blue-600 to-indigo-600',
      badge: `${orders.length} طلب`,
    },
    {
      id: 'products',
      title: 'منتجاتي والمخزون',
      desc: 'إضافة وتعديل المنتجات ومتابعة مخزون القطع',
      icon: '🛍️',
      bgClass: 'bg-gradient-to-r from-teal-500 to-emerald-600',
      badge: `${products.length} منتج`,
    },
    {
      id: 'analytics',
      title: 'التحليلات والمبيعات',
      desc: 'معدل التحويل ومتوسط قيمة الطلب وصافي الأرباح',
      icon: '📈',
      bgClass: 'bg-gradient-to-r from-indigo-600 to-purple-600',
      badge: `${totalRevenue.toLocaleString()} ج.م`,
    },
    {
      id: 'pixels',
      title: 'بيكسلات فيسبوك (CAPI)',
      desc: 'ربط ما يصل إلى 4 بيكسلات مع الرموز السرية',
      icon: '⚡',
      bgClass: 'bg-gradient-to-r from-rose-600 to-red-600',
      badge: 'إعدادات CAPI',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans text-slate-800" dir="rtl">
        <div className="font-bold text-lg animate-pulse">جاري تحميل لوحة التحكم...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-16" dir="rtl">
      
      {/* الرأس العلوي */}
      <header className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {activeScreen !== 'home' && (
              <button
                onClick={() => setActiveScreen('home')}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-2xl text-sm font-bold flex items-center gap-1.5 transition"
              >
                <span>⬅</span>
                <span>الرئيسية</span>
              </button>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                {activeScreen === 'home' ? 'لوحة التحكم الرئيسية' : gridCards.find(c => c.id === activeScreen)?.title}
              </h1>
              <p className="text-xs text-slate-500">منظومة إدارة المتاجر والمبيعات والتحليلات</p>
            </div>
          </div>

          <div className="text-xs font-bold text-slate-600 bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200">
            {settings.store_name || 'LMAA STOR'}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-8">

        {/* 🌟 1. الشاشة الرئيسية: شبكة الكروت الكبيرة الملونة (نفس الصورة تماماً) */}
        {activeScreen === 'home' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {gridCards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => setActiveScreen(card.id)}
                  className={`${card.bgClass} text-white p-6 rounded-3xl cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between min-h-[145px]`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full font-bold">
                      {card.badge}
                    </span>
                    <span className="text-2xl opacity-90">{card.icon}</span>
                  </div>

                  <div className="space-y-1 mt-4">
                    <h3 className="text-lg font-black tracking-wide">{card.title}</h3>
                    <p className="text-[11px] text-white/80 line-clamp-1">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🌟 2. شاشة المشتركين والعملاء */}
        {activeScreen === 'subscribers' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black">المشتركين والمتاجر ({subscribers.length})</h2>
                <p className="text-xs text-slate-500">تفعيل المتجر فور تحويل المبلغ وتحديد عدد الأشهر</p>
              </div>
              <button onClick={loadAllData} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold">🔄 تحديث</button>
            </div>

            <div className="space-y-3">
              {subscribers.map((s) => {
                const isExpired = !s.subscription_ends_at || new Date(s.subscription_ends_at) < new Date();
                const isActive = s.is_active && !isExpired;

                return (
                  <div key={s.id} className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-lg">{s.store_name}</span>
                        <span className="text-xs text-slate-400 font-mono">({s.store_slug})</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                          {isActive ? 'نشط ويعمل' : 'معطل / غير مفعل'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex flex-wrap gap-4 pt-1">
                        <span>المالك: <strong className="text-slate-800">{s.owner_name}</strong></span>
                        <span>الهاتف: <strong className="text-slate-800 font-mono" dir="ltr">{s.phone}</strong></span>
                        <span>المسدد: <strong className="text-emerald-600 font-bold">{s.amount_paid || 0} ج.م</strong></span>
                        <span>الانتهاء: <strong className="text-amber-600 font-mono">{s.subscription_ends_at ? new Date(s.subscription_ends_at).toLocaleDateString('ar-EG') : 'لم يفعل'}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditingSub(s); setPaymentAmount(s.amount_paid || ''); }}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition"
                      >
                        تفعيل / تجديد المتجر 🚀
                      </button>
                      {isActive && (
                        <button onClick={() => handleDeactivateSubscriber(s.id)} className="px-3 py-2.5 bg-red-100 text-red-600 rounded-xl text-xs font-bold">
                          إيقاف
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 🌟 3. شاشة الطلبات الجديدة */}
        {activeScreen === 'orders' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between gap-3">
              <div>
                <h2 className="text-lg font-black">الطلبات الواردة ({orders.length})</h2>
                <p className="text-xs text-slate-500">إدارة ومتابعة طلبات المتجر وتغيير الحالات</p>
              </div>
              <input
                type="text"
                placeholder="بحث بالاسم أو الهاتف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-xl w-60"
              />
            </div>

            <div className="space-y-3">
              {orders.map((o, idx) => (
                <div key={o.id} className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="font-black text-slate-900">طلب #{idx + 1} - {o.customer_name}</span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl">{o.status || 'جديد'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                    <div>الهاتف: <strong className="text-slate-900 font-mono" dir="ltr">{o.phone}</strong></div>
                    <div>العنوان: <strong className="text-slate-900">{o.governorate} - {o.address}</strong></div>
                    <div>المبلغ: <strong className="text-emerald-600 font-bold">{o.total_amount || o.total_price} ج.م</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🌟 4. شاشة المنتجات */}
        {activeScreen === 'products' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black">منتجاتي ومخزون القطع ({products.length})</h2>
                <p className="text-xs text-slate-500">إدارة كل منتج وتعديله ومتابعته</p>
              </div>
              <button
                onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                ➕ إضافة منتج
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {products.map((p) => (
                <div key={p.id} className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm space-y-3">
                  <div className="w-full h-40 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden">
                    {p.images && p.images[0] ? <img src={p.images[0]} className="w-full h-full object-contain" /> : '📦'}
                  </div>
                  <h4 className="font-bold text-slate-900 line-clamp-1">{p.name}</h4>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-600 font-black">{p.price} ج.م</span>
                    <span className="text-slate-500">المخزون: {p.stock || 20}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🌟 5. شاشة التحليلات الشاملة */}
        {activeScreen === 'analytics' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
              <span className="text-xs text-slate-500 block">إجمالي الزوار</span>
              <span className="text-2xl font-black text-slate-900">{visitorsCount}</span>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
              <span className="text-xs text-slate-500 block">الطلبات المكتملة</span>
              <span className="text-2xl font-black text-emerald-600">{totalOrdersCount} طلب</span>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
              <span className="text-xs text-slate-500 block">متوسط سعر الطلب</span>
              <span className="text-2xl font-black text-amber-500">{averageOrderValue} ج.م</span>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
              <span className="text-xs text-slate-500 block">معدل التحويل</span>
              <span className="text-2xl font-black text-indigo-600">{conversionRate}%</span>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm col-span-full">
              <span className="text-xs text-slate-500 block">إجمالي المبيعات</span>
              <span className="text-3xl font-black text-emerald-600">{totalRevenue.toLocaleString()} ج.م</span>
            </div>
          </div>
        )}

        {/* 🌟 6. شاشة بيكسلات فيسبوك (CAPI) */}
        {activeScreen === 'pixels' && (
          <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
            <h2 className="text-lg font-black border-b border-slate-100 pb-3">إعدادات البيكسلات ورموز CAPI</h2>
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-slate-700">بيكسل فيسبوك ({num})</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    dir="ltr"
                    value={settings[`pixel_${num}`]}
                    onChange={(e) => setSettings({ ...settings, [`pixel_${num}`]: e.target.value })}
                    placeholder={`Pixel ID ${num}`}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    value={settings[`token_${num}`]}
                    onChange={(e) => setSettings({ ...settings, [`token_${num}`]: e.target.value })}
                    placeholder={`API Token ${num}`}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono"
                  />
                </div>
              </div>
            ))}
            <button type="submit" disabled={savingSettings} className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow">
              حفظ الإعدادات 💾
            </button>
          </form>
        )}

      </main>

      {/* مودال تفعيل المشتركين */}
      {editingSub && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-black border-b border-slate-100 pb-3">تفعيل اشتراك: {editingSub.store_name}</h3>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">المدة بالأشهر</label>
              <select value={durationMonths} onChange={(e) => setDurationMonths(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm">
                <option value="1">شهر واحد (30 يوم)</option>
                <option value="3">3 أشهر</option>
                <option value="6">6 أشهر</option>
                <option value="12">سنة كاملة</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">المبلغ المحول (ج.م)</label>
              <input
                type="number"
                placeholder="500"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-bold"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setEditingSub(null)} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold">إلغاء</button>
              <button onClick={() => handleActivateSubscriber(editingSub)} className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">تأكيد التفعيل 🚀</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
