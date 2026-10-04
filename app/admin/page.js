'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminPage() {
  const [activeView, setActiveView] = useState('products');
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState({
    store_name: '',
    pixel_1: '', token_1: '',
    pixel_2: '', token_2: '',
    pixel_3: '', token_3: '',
    pixel_4: '', token_4: '',
    tiktok_pixel_id: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState(false);

  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [products, setProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [productForm, setProductForm] = useState({
    name: '', price: '', compare_price: '', cost_price: '', stock: 20,
    description: '', images: [], video_url: '', show_colors: false, colors: [], show_sizes: false, sizes: [],
  });

  const [newImageUrl, setNewImageUrl] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      if (supabase) {
        const { data: sData } = await supabase.from('store_settings').select('*').limit(1).maybeSingle();
        if (sData) {
          setSettings({
            store_name: sData.store_name || '',
            pixel_1: sData.pixel_1 || sData.facebook_pixel_id || '',
            token_1: sData.token_1 || sData.facebook_api_token || '',
            pixel_2: sData.pixel_2 || '', token_2: sData.token_2 || '',
            pixel_3: sData.pixel_3 || '', token_3: sData.token_3 || '',
            pixel_4: sData.pixel_4 || '', token_4: sData.token_4 || '',
            tiktok_pixel_id: sData.tiktok_pixel_id || '',
          });
        }

        const { data: pData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        let list = pData ? [...pData] : [];
        if (sData && sData.product_name) {
          const exists = list.some((p) => p.name === sData.product_name);
          if (!exists) {
            list.push({
              id: 'legacy_product',
              name: sData.product_name,
              price: Number(sData.product_price) || 0,
              compare_price: Number(sData.original_price) || null,
              cost_price: Number(sData.cost_price) || 0,
              stock: Number(sData.stock) || 20,
              images: sData.images || (sData.image_url ? [sData.image_url] : []),
            });
          }
        }
        setProducts(list);

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

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const { data: existing } = await supabase.from('store_settings').select('id').limit(1).maybeSingle();
      const targetId = existing?.id || 1;

      const payload = {
        id: targetId,
        store_name: settings.store_name,
        pixel_1: (settings.pixel_1 || '').trim(),
        token_1: (settings.token_1 || '').trim(),
        pixel_2: (settings.pixel_2 || '').trim(),
        token_2: (settings.token_2 || '').trim(),
        pixel_3: (settings.pixel_3 || '').trim(),
        token_3: (settings.token_3 || '').trim(),
        pixel_4: (settings.pixel_4 || '').trim(),
        token_4: (settings.token_4 || '').trim(),
        facebook_pixel_id: (settings.pixel_1 || '').trim(),
        facebook_api_token: (settings.token_1 || '').trim(),
      };

      const { error } = await supabase.from('store_settings').upsert(payload);
      if (error) throw error;

      setSettingsNotice(true);
      setTimeout(() => setSettingsNotice(false), 3000);
      alert('✅ تم الحفظ بنجاح!');
    } catch (err) {
      alert('خطأ أثناء الحفظ: ' + err.message);
    }
    setSavingSettings(false);
  };

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      (o.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.phone || '').includes(searchTerm) ||
      (o.governorate || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch && (statusFilter === 'all' || o.status === statusFilter);
  });

  const handleUpdateStatus = async (id, status) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (!error) {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!confirm('هل تريد حذف هذا الطلب نهائياً؟')) return;
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (!error) setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  const openNewProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '', price: '', compare_price: '', cost_price: '', stock: 20,
      description: '', images: [], video_url: '', show_colors: false, colors: [], show_sizes: false, sizes: [],
    });
    setShowProductModal(true);
  };

  const openEditProductModal = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name || '',
      price: prod.price || '',
      compare_price: prod.compare_price || prod.original_price || '',
      cost_price: prod.cost_price || '',
      stock: prod.stock !== undefined ? prod.stock : 20,
      description: prod.description || '',
      images: prod.images || [],
      video_url: prod.video_url || '',
      show_colors: Boolean(prod.show_colors),
      colors: prod.colors || [],
      show_sizes: Boolean(prod.show_sizes),
      sizes: prod.sizes || [],
    });
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (prod) => {
    if (!confirm(`حذف المنتج: ${prod.name}؟`)) return;
    if (prod.id !== 'legacy_product') {
      await supabase.from('products').delete().eq('id', prod.id);
    }
    setProducts((prev) => prev.filter((p) => p.id !== prod.id));
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSavingProduct(true);
    const payload = {
      name: productForm.name,
      price: Number(productForm.price) || 0,
      original_price: Number(productForm.compare_price) || null,
      cost_price: Number(productForm.cost_price) || 0,
      stock: Math.max(0, parseInt(productForm.stock) || 0),
      description: productForm.description,
      images: productForm.images || [],
      video_url: productForm.video_url || '',
      show_colors: Boolean(productForm.show_colors),
      colors: productForm.colors || [],
      show_sizes: Boolean(productForm.show_sizes),
      sizes: productForm.sizes || [],
    };

    try {
      if (editingProduct?.id && editingProduct.id !== 'legacy_product') {
        await supabase.from('products').update(payload).eq('id', editingProduct.id);
        setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? { ...p, ...payload } : p)));
      } else {
        const { data } = await supabase.from('products').insert([payload]).select().single();
        if (data) setProducts((prev) => [data, ...prev]);
      }
      setShowProductModal(false);
      alert('✅ تم حفظ المنتج بنجاح وتوليد لوحة التحليلات الخاصة به تلقائياً!');
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
    setSavingProduct(false);
  };

  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount || o.total_price) || 0), 0);
  const totalOrdersCount = orders.length;

  let totalCost = 0;
  orders.forEach((o) => {
    const matchedProduct = products.find((p) => o.product_name && o.product_name.includes(p.name));
    const costPerItem = matchedProduct ? Number(matchedProduct.cost_price) || 0 : 0;
    const qty = Number(o.quantity) || 1;
    totalCost += costPerItem * qty;
  });

  const totalProfit = totalRevenue - totalCost;
  const visitorsCount = analytics.filter(a => a.event_type === 'visit').length;
  const addToCartCount = analytics.filter(a => a.event_type === 'add_to_cart').length;
  const initiateCheckoutCount = analytics.filter(a => a.event_type === 'initiate_checkout').length;
  const incompleteOrders = orders.filter(o => o.status === 'قيد الانتظار' || o.status === 'ملغي').length;
  const conversionRate = visitorsCount > 0 ? ((totalOrdersCount / visitorsCount) * 100).toFixed(2) : '0.00';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16" dir="rtl">
      <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">{settings.store_name || 'LMAA STOR'}</h1>
              <p className="text-xs text-slate-400">لوحة التحكم والتحليلات التلقائية للمنتجات</p>
            </div>
          </div>

          <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveView('products')}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                activeView === 'products' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🛍️ المنتجات والمخزون</span>
              <span className="bg-slate-900 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-black">{products.length}</span>
            </button>

            <button
              onClick={() => setActiveView('cart')}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                activeView === 'cart' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🛒 السلة والطلبات</span>
              <span className="bg-slate-900 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-black">{orders.length}</span>
            </button>

            <button
              onClick={() => setActiveView('settings')}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                activeView === 'settings' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>⚙ الإعدادات</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6">

        {activeView === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-5 rounded-3xl border border-slate-800">
              <div>
                <h2 className="text-xl font-black text-white">قائمة المنتجات ومخزون القطع ({products.length})</h2>
                <p className="text-xs text-slate-400 mt-0.5">كل منتج له لوحة تحليلات مستقلة تتولد وتعمل تلقائياً فور إضافته</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={loadAllData} className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-xs sm:text-sm">
                  🔄 تحديث
                </button>
                <button onClick={openNewProductModal} className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-lg flex items-center gap-2">
                  <span>➕</span>
                  <span>إضافة منتج جديد</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => {
                const stockCount = p.stock !== undefined ? p.stock : 20;
                const productUrl = p.id === 'legacy_product' ? '/' : `/p/${p.id}`;

                const pOrders = orders.filter((o) => o.product_name && o.product_name.includes(p.name));
                const pOrdersCount = pOrders.length;
                const pRevenue = pOrders.reduce((sum, o) => sum + (Number(o.total_amount || o.total_price) || 0), 0);
                
                const pVisits = analytics.filter(a => String(a.product_id) === String(p.id) && a.event_type === 'visit').length;
                const pCarts = analytics.filter(a => String(a.product_id) === String(p.id) && a.event_type === 'add_to_cart').length;
                const pCheckouts = analytics.filter(a => String(a.product_id) === String(p.id) && a.event_type === 'initiate_checkout').length;
                const pConvRate = pVisits > 0 ? ((pOrdersCount / pVisits) * 100).toFixed(2) : '0.00';

                return (
                  <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      {p.images && p.images.length > 0 ? (
                        <div className="w-full h-44 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center p-2">
                          <img src={p.images[0]} alt={p.name} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-full h-44 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center text-slate-600 text-3xl">
                          📦
                        </div>
                      )}

                      <h3 className="font-black text-lg text-white line-clamp-1">{p.name}</h3>

                      {/* 📊 لوحة الإحصائيات المستقلة (إجمالي المبيعات + معدل التحويل) */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">الزيارات</span>
                          <span className="text-white font-black text-sm">{pVisits}</span>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">الطلبات المكتملة</span>
                          <span className="text-emerald-400 font-black text-sm">{pOrdersCount} طلب</span>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">إضافة للسلة</span>
                          <span className="text-teal-400 font-black text-sm">{pCarts}</span>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">بدء الشراء</span>
                          <span className="text-indigo-400 font-black text-sm">{pCheckouts}</span>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">إجمالي المبيعات</span>
                          <span className="text-emerald-400 font-black text-sm">{pRevenue.toLocaleString()} ج.م</span>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">معدل التحويل</span>
                          <span className="text-sky-400 font-black text-sm">{pConvRate}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      <a href={productUrl} target="_blank" rel="noreferrer" className="py-2.5 px-3 bg-emerald-600/20 text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1">
                        <span>🔗</span> معاينة
                      </a>
                      <button onClick={() => openEditProductModal(p)} className="flex-1 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold">
                        ✏️ تعديل
                      </button>
                      <button onClick={() => handleDeleteProduct(p)} className="px-4 py-2.5 bg-red-600/20 text-red-400 rounded-xl text-xs font-bold">
                        حذف
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeView === 'cart' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-2">
                <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
                  <span>إجمالي الزائرين</span>
                  <span>👁</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">{visitorsCount.toLocaleString()}</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-2">
                <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
                  <span>الطلبات المكتملة</span>
                  <span>📦</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400">{totalOrdersCount} طلب</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-2">
                <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
                  <span>طلبات غير مكتملة</span>
                  <span>⚠</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-400">{incompleteOrders}</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-2">
                <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
                  <span>معدل التحويل العام</span>
                  <span>📈</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-sky-400">{conversionRate}%</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-2">
                <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
                  <span>مرات الإضافة للسلة</span>
                  <span>🛒</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-teal-400">{addToCartCount}</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-2">
                <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
                  <span>مرات بدء الشراء</span>
                  <span>⚡</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-indigo-400">{initiateCheckoutCount}</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-2">
                <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
                  <span>إجمالي المبيعات</span>
                  <span>💰</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400">{totalRevenue.toLocaleString()} ج.م</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-2">
                <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
                  <span>صافي الأرباح</span>
                  <span>💎</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-teal-300">{totalProfit.toLocaleString()} ج.م</div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-black text-white">قائمة الطلبات الواردة</h3>
              {filteredOrders.map((order, idx) => (
                <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <span className="font-black text-white">طلب #{idx + 1} - {order.customer_name}</span>
                    <select
                      value={order.status || 'جديد'}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                      className="bg-slate-950 border border-slate-700 text-xs font-bold text-emerald-400 p-1.5 rounded-xl"
                    >
                      <option value="جديد">جديد</option>
                      <option value="قيد الانتظار">قيد الانتظار</option>
                      <option value="تم التأكيد">تم التأكيد</option>
                      <option value="تم الشحن">تم الشحن</option>
                      <option value="تم التسليم">تم التسليم</option>
                      <option value="مرتجع">مرتجع</option>
                      <option value="ملغي">ملغي</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>الهاتف: <strong className="text-white" dir="ltr">{order.phone}</strong></div>
                    <div>العنوان: <strong className="text-white">{order.governorate} - {order.address}</strong></div>
                    <div>الإجمالي: <strong className="text-emerald-400">{order.total_amount || order.total_price} ج.م</strong></div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-slate-400">{order.product_name}</span>
                    <button onClick={() => handleDeleteOrder(order.id)} className="text-red-400 hover:text-red-300 text-xs font-bold">
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'settings' && (
          <form onSubmit={handleSaveSettings} className="bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>🎯</span>
                <span>إعدادات البيكسلات المستقلة ورموز الوصول (CAPI Tokens)</span>
              </h2>
            </div>

            {settingsNotice && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs sm:text-sm font-bold">
                ✅ تم حفظ الإعدادات بنجاح!
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم المتجر</label>
                <input
                  type="text"
                  value={settings.store_name}
                  onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white text-sm"
                />
              </div>

              {[1, 2, 3, 4].map((num) => (
                <div key={num} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <h4 className="text-xs font-black text-emerald-400">⚡ بيكسل فيسبوك ({num})</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      dir="ltr"
                      value={settings[`pixel_${num}`]}
                      onChange={(e) => setSettings({ ...settings, [`pixel_${num}`]: e.target.value })}
                      placeholder={`Pixel ID ${num}`}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-white"
                    />
                    <input
                      type="text"
                      dir="ltr"
                      value={settings[`token_${num}`]}
                      onChange={(e) => setSettings({ ...settings, [`token_${num}`]: e.target.value })}
                      placeholder={`API Access Token ${num}`}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-blue-300"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm rounded-2xl shadow-xl transition hover:scale-105"
            >
              {savingSettings ? 'جاري الحفظ...' : 'حفظ الإعدادات 💾'}
            </button>
          </form>
        )}

      </main>

      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <h3 className="text-xl font-black text-white border-b border-slate-800 pb-3">
              {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <input
                type="text"
                required
                placeholder="اسم المنتج"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="number"
                  required
                  placeholder="سعر البيع"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm font-bold"
                />
                <input
                  type="number"
                  required
                  placeholder="سعر التكلفة"
                  value={productForm.cost_price}
                  onChange={(e) => setProductForm({ ...productForm, cost_price: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm font-bold"
                />
                <input
                  type="number"
                  required
                  placeholder="المخزون"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm font-bold"
                />
              </div>

              <input
                type="url"
                placeholder="رابط الصورة"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  if (newImageUrl) {
                    setProductForm(prev => ({ ...prev, images: [...prev.images, newImageUrl] }));
                    setNewImageUrl('');
                  }
                }}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                إضافة الصورة
              </button>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowProductModal(false)} className="px-5 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-sm font-bold">
                  إلغاء
                </button>
                <button type="submit" disabled={savingProduct} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold">
                  حفظ المنتج 💾
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
