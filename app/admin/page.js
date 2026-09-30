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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [products, setProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    compare_price: '',
    cost_price: '',
    stock: 20,
    description: '',
    images: [],
    video_url: '',
    show_colors: false,
    colors: [],
    show_sizes: false,
    sizes: [],
  });

  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newColorName, setNewColorName] = useState('');
  const [newColorCode, setNewColorCode] = useState('#000000');
  const [newSize, setNewSize] = useState('');
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
              is_legacy: true,
              name: sData.product_name,
              price: Number(sData.product_price) || 0,
              compare_price: Number(sData.original_price) || null,
              cost_price: Number(sData.cost_price) || 0,
              stock: Number(sData.stock) || 20,
              description: sData.description || '',
              images: sData.images || (sData.image_url ? [sData.image_url] : []),
              video_url: sData.video_url || '',
              show_colors: Boolean(sData.show_colors),
              colors: sData.colors || [],
              show_sizes: Boolean(sData.show_sizes),
              sizes: sData.sizes || [],
            });
          }
        }
        setProducts(list);

        const { data: oData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (oData) setOrders(oData);
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
        facebook_pixel_id: (settings.pixel_1 || '').trim(), // توافق عكسي
        facebook_api_token: (settings.token_1 || '').trim(),
        tiktok_pixel_id: (settings.tiktok_pixel_id || '').trim(),
      };

      const { error } = await supabase.from('store_settings').upsert(payload);
      if (error) throw error;

      setSettingsNotice(true);
      setTimeout(() => setSettingsNotice(false), 3000);
      alert('✅ تم حفظ كافة البيكسلات ورموز وصول الـ API الخاصة بها بنجاح!');
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
    if (!error) {
      setOrders((prev) => prev.filter((o) => o.id !== id));
    }
  };

  const openNewProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      price: '',
      compare_price: '',
      cost_price: '',
      stock: 20,
      description: '',
      images: [],
      video_url: '',
      show_colors: false,
      colors: [],
      show_sizes: false,
      sizes: [],
    });
    setNewImageUrl('');
    setNewColorName('');
    setNewColorCode('#000000');
    setNewSize('');
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
    setNewImageUrl('');
    setNewColorName('');
    setNewColorCode('#000000');
    setNewSize('');
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (prod) => {
    if (!confirm(`هل أنت متأكد من حذف المنتج: ${prod.name}؟`)) return;
    if (prod.id !== 'legacy_product') {
      const { error } = await supabase.from('products').delete().eq('id', prod.id);
      if (error) alert('خطأ أثناء الحذف: ' + error.message);
    }
    setProducts((prev) => prev.filter((p) => p.id !== prod.id));
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height *= maxDim / width;
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width *= maxDim / height;
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
    });
  };

  const handleImageFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingMedia(true);
    try {
      const list = [];
      for (const file of files) {
        const compressed = await compressImage(file);
        list.push(compressed);
      }
      setProductForm((prev) => ({ ...prev, images: [...(prev.images || []), ...list] }));
    } catch (err) {
      alert('خطأ أثناء قراءة الصورة: ' + err.message);
    }
    setUploadingMedia(false);
    e.target.value = '';
  };

  const handleVideoFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert('حجم الفيديو أكبر من 15 ميجابايت، يرجى اختيار فيديو أقصر');
      return;
    }
    setUploadingMedia(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setProductForm((prev) => ({ ...prev, video_url: event.target.result }));
      setUploadingMedia(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
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
        const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
        if (error) throw error;
        setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? { ...p, ...payload } : p)));
      } else {
        const { data, error } = await supabase.from('products').insert([payload]).select().single();
        if (error) throw error;
        if (data) {
          setProducts((prev) => [data, ...prev]);
        }
      }

      alert('✅ تم حفظ المنتج وتحديث المخزون بنجاح!');
      setShowProductModal(false);
    } catch (err) {
      alert('❌ فشل الحفظ: ' + err.message);
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
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

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
              <p className="text-xs text-slate-400">إدارة المخزون، الطلبات، والبيكسلات ورموز الـ API</p>
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
              <span className="bg-slate-900 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-black">
                {products.length}
              </span>
            </button>

            <button
              onClick={() => setActiveView('cart')}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                activeView === 'cart' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🛒 السلة والطلبات</span>
              <span className="bg-slate-900 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-black">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveView('settings')}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                activeView === 'settings' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>⚙️️ إعدادات البيكسلات و الـ API</span>
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
                <p className="text-xs text-slate-400 mt-0.5">متابعة المخزون، الأسعار، وهامش الربح لكل منتج</p>
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
                const sellingPrice = Number(p.price) || 0;
                const comparePrice = Number(p.compare_price || p.original_price) || 0;
                const costPrice = Number(p.cost_price) || 0;
                const stockCount = p.stock !== undefined ? p.stock : 20;

                const discountPercent = comparePrice > sellingPrice && comparePrice > 0
                  ? Math.round(((comparePrice - sellingPrice) / comparePrice) * 100)
                  : 0;

                const profitMargin = sellingPrice - costPrice;
                const profitPercent = sellingPrice > 0 ? Math.round((profitMargin / sellingPrice) * 100) : 0;
                const productUrl = p.id === 'legacy_product' ? '/' : `/p/${p.id}`;

                return (
                  <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      {p.images && p.images.length > 0 ? (
                        <div className="w-full h-48 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center p-2 relative">
                          <img src={p.images[0]} alt={p.name} className="w-full h-full object-contain" />
                          {discountPercent > 0 && (
                            <span className="absolute top-2 right-2 bg-red-600 text-white text-[11px] font-black px-2 py-0.5 rounded-lg shadow">
                              خصم {discountPercent}%
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center text-slate-600 text-4xl">
                          📦
                        </div>
                      )}

                      <h3 className="font-black text-lg text-white line-clamp-1">{p.name}</h3>

                      <div className="bg-[#050811] p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">المخزون المتبقي:</span>
                        <span className={`text-xs font-black px-3 py-1 rounded-xl border ${
                          stockCount <= 5
                            ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        }`}>
                          {stockCount} قطعة متبقية
                        </span>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">سعر البيع:</span>
                          <span className="text-emerald-400 font-black text-sm">{sellingPrice} ج.م</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">بدلاً من:</span>
                          <span className="text-slate-400 line-through font-bold">{comparePrice > 0 ? `${comparePrice} ج.م` : 'غير محدد'}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-800 pt-1.5">
                          <span className="text-slate-400">سعر التكلفة:</span>
                          <span className="text-amber-400 font-bold">{costPrice} ج.م</span>
                        </div>
                        <div className="border-t border-slate-800 pt-1.5 flex justify-between items-center font-bold">
                          <span className="text-slate-200">صافي الربح:</span>
                          <span className={`text-sm font-black ${profitMargin >= 0 ? 'text-teal-400' : 'text-red-500'}`}>
                            {profitMargin >= 0 ? `+${profitMargin} ج.م` : `${profitMargin} ج.م`}
                            {profitPercent !== 0 && ` (${profitPercent}%)`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      <a href={productUrl} target="_blank" rel="noreferrer" className="py-2.5 px-3 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1">
                        <span>🔗</span>
                        <span>معاينة</span>
                      </a>
                      <button onClick={() => openEditProductModal(p)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition">
                        <span>✏️ تعديل</span>
                      </button>
                      <button onClick={() => handleDeleteProduct(p)} className="px-4 py-2.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-xl text-xs font-bold transition">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-lg space-y-1">
                <div className="text-slate-400 text-xs font-bold">إجمالي المبيعات</div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400">{totalRevenue.toLocaleString()} ج.م</div>
              </div>
              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-lg space-y-1">
                <div className="text-slate-400 text-xs font-bold">إجمالي التكاليف</div>
                <div className="text-2xl sm:text-3xl font-black text-amber-400">{totalCost.toLocaleString()} ج.م</div>
              </div>
              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-lg space-y-1">
                <div className="text-slate-400 text-xs font-bold">إجمالي الربح الصافي</div>
                <div className="text-2xl sm:text-3xl font-black text-teal-400">{totalProfit.toLocaleString()} ج.م</div>
              </div>
              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-lg space-y-1">
                <div className="text-slate-400 text-xs font-bold">عدد الطلبات</div>
                <div className="text-2xl sm:text-3xl font-black text-white">{totalOrdersCount} طلب</div>
              </div>
              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-lg space-y-1">
                <div className="text-slate-400 text-xs font-bold">متوسط الطلب</div>
                <div className="text-2xl sm:text-3xl font-black text-sky-400">{avgOrderValue.toLocaleString()} ج.م</div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
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

        {/* تبويب إعدادات البيكسلات المستقلة مع رموز الـ API الخاصة بها */}
        {activeView === 'settings' && (
          <form onSubmit={handleSaveSettings} className="bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>🎯</span>
                <span>إعدادات البيكسلات المستقلة ورموز وصول السيرفر (CAPI Tokens)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                لكل بيكسل معرّف مستقل ورمز وصول API خاص به، وجميعها ستعمل وتقرأ الأحداث بالتوازي في نفس اللحظة
              </p>
            </div>

            {settingsNotice && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2">
                <span>✅</span>
                <span>تم حفظ إعدادات البيكسلات ورموز الوصول بنجاح!</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم المتجر</label>
                <input
                  type="text"
                  value={settings.store_name}
                  onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* البيكسل الأول */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <h4 className="text-xs font-black text-emerald-400">⚡ بيكسل فيسبوك (1)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    dir="ltr"
                    value={settings.pixel_1}
                    onChange={(e) => setSettings({ ...settings, pixel_1: e.target.value })}
                    placeholder="Pixel ID 1 (مثال: 1005...)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-white"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    value={settings.token_1}
                    onChange={(e) => setSettings({ ...settings, token_1: e.target.value })}
                    placeholder="API Access Token 1 (EAABw...)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-blue-300"
                  />
                </div>
              </div>

              {/* البيكسل الثاني */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <h4 className="text-xs font-black text-emerald-400">⚡ بيكسل فيسبوك (2)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    dir="ltr"
                    value={settings.pixel_2}
                    onChange={(e) => setSettings({ ...settings, pixel_2: e.target.value })}
                    placeholder="Pixel ID 2"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-white"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    value={settings.token_2}
                    onChange={(e) => setSettings({ ...settings, token_2: e.target.value })}
                    placeholder="API Access Token 2"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-blue-300"
                  />
                </div>
              </div>

              {/* البيكسل الثالث */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <h4 className="text-xs font-black text-emerald-400">⚡ بيكسل فيسبوك (3)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    dir="ltr"
                    value={settings.pixel_3}
                    onChange={(e) => setSettings({ ...settings, pixel_3: e.target.value })}
                    placeholder="Pixel ID 3"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-white"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    value={settings.token_3}
                    onChange={(e) => setSettings({ ...settings, token_3: e.target.value })}
                    placeholder="API Access Token 3"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-blue-300"
                  />
                </div>
              </div>

              {/* البيكسل الرابع */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <h4 className="text-xs font-black text-emerald-400">⚡ بيكسل فيسبوك (4)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    dir="ltr"
                    value={settings.pixel_4}
                    onChange={(e) => setSettings({ ...settings, pixel_4: e.target.value })}
                    placeholder="Pixel ID 4"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-white"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    value={settings.token_4}
                    onChange={(e) => setSettings({ ...settings, token_4: e.target.value })}
                    placeholder="API Access Token 4"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-blue-300"
                  />
                </div>
              </div>

            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {savingSettings ? 'جاري الحفظ...' : 'حفظ وتفعيل البيكسلات ورموز الوصول 💾'}
              </button>
            </div>
          </form>
        )}

      </main>

      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xl font-black text-white">
                {editingProduct ? '✏ تعديل المنتج والمخزون' : '➕ إضافة منتج ومخزون جديد'}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">اسم المنتج</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-emerald-400 mb-1">سعر البيع (ج.م) *</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full bg-slate-950 border border-emerald-500/40 rounded-xl p-3 text-white text-sm focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">بدلاً من كذا</label>
                  <input
                    type="number"
                    value={productForm.compare_price}
                    onChange={(e) => setProductForm({ ...productForm, compare_price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-400 mb-1">سعر التكلفة *</label>
                  <input
                    type="number"
                    required
                    value={productForm.cost_price}
                    onChange={(e) => setProductForm({ ...productForm, cost_price: e.target.value })}
                    className="w-full bg-slate-950 border border-amber-500/40 rounded-xl p-3 text-white text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-teal-400 mb-1">المخزون (قطع) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full bg-slate-950 border border-teal-500/40 rounded-xl p-3 text-white text-sm font-black focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">وصف المنتج</label>
                <textarea
                  rows="3"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button type="button" onClick={() => setShowProductModal(false)} className="px-5 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-sm">
                  إلغاء
                </button>
                <button type="submit" disabled={savingProduct || uploadingMedia} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm">
                  {savingProduct ? 'جاري الحفظ...' : 'حفظ المنتج والمخزون 💾'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
