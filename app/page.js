'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // السلايدر
  const [currentIndex, setCurrentIndex] = useState(0);

  // اختيارات اللون والمقاس
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  // حالة السلة والنافذة الجانبية (Drawer / Modal)
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase
        .from('store_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (data) {
        let cleanDesc = data.description || '';
        cleanDesc = cleanDesc.replace(/^وصف المنتج ومميزاته هنا\.\.\.?\s*/i, '');

        setProduct({ ...data, description: cleanDesc });

        if (data.show_colors && Array.isArray(data.colors) && data.colors.length > 0) {
          setSelectedColor(data.colors[0].name);
        }
        if (data.show_sizes && Array.isArray(data.sizes) && data.sizes.length > 0) {
          setSelectedSize(data.sizes[0]);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const galleryImages = Array.isArray(product?.images) && product.images.length > 0
    ? product.images
    : (product?.image_url ? [product.image_url] : []);

  const nextImage = () => {
    if (galleryImages.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
    }
  };

  const prevImage = () => {
    if (galleryImages.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    }
  };

  // إضافة منتج للسلة
  const handleAddToCart = (openDrawer = false) => {
    if (product?.show_colors && product.colors?.length > 0 && !selectedColor) {
      alert('يرجى اختيار اللون أولاً');
      return;
    }
    if (product?.show_sizes && product.sizes?.length > 0 && !selectedSize) {
      alert('يرجى اختيار المقاس أولاً');
      return;
    }

    const newItem = {
      id: `${Date.now()}_${Math.random()}`,
      name: product?.product_name || 'منتج',
      price: Number(product?.product_price) || 0,
      image: galleryImages[0] || '',
      color: selectedColor || null,
      size: selectedSize || null,
      quantity: 1,
    };

    setCart((prev) => [...prev, newItem]);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);

    // تتبع فيسبوك وتيك توك
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'AddToCart', {
        content_name: product?.product_name,
        value: product?.product_price,
        currency: 'EGP',
      });
    }

    if (openDrawer) {
      setIsCartOpen(true);
    }
  };

  // زيادة / إنقاص الكمية داخل السلة
  const updateQuantity = (itemId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeItem = (itemId) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  // إجمالي السلة
  const cartSubtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // زر "اطلب الآن" ينقله مباشرة لقسم ملء البيانات
  const scrollToCheckout = () => {
    setIsCartOpen(false);

    // إذا كانت السلة فارغة يضيف المنتج تلقائياً
    if (cart.length === 0) {
      handleAddToCart(false);
    }

    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        content_name: product?.product_name,
        value: product?.product_price,
        currency: 'EGP',
      });
    }

    const formElement = document.getElementById('checkout-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
      const nameInput = document.getElementById('customer-name');
      if (nameInput) nameInput.focus();
    }
  };

  // تأكيد الطلب
  const handleSubmit = async (e) => {
    e.preventDefault();

    setOrderLoading(true);

    const itemsToOrder = cart.length > 0 ? cart : [
      {
        name: product?.product_name || 'منتج',
        price: Number(product?.product_price) || 0,
        color: selectedColor || null,
        size: selectedSize || null,
        quantity: 1,
      }
    ];

    const subtotal = itemsToOrder.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shipping = Number(product?.shipping_fee) || 0;
    const finalTotal = subtotal + shipping;

    const { error } = await supabase.from('orders').insert([
      {
        customer_name: formData.name,
        phone: formData.phone,
        address: formData.address,
        notes: formData.notes,
        product_name: itemsToOrder.map((i) => `${i.name} (${i.quantity})`).join(' + '),
        total_amount: finalTotal,
        selected_color: itemsToOrder[0]?.color || selectedColor || null,
        selected_size: itemsToOrder[0]?.size || selectedSize || null,
        quantity: itemsToOrder.reduce((acc, i) => acc + i.quantity, 0),
        items: itemsToOrder,
        status: 'جديد',
      },
    ]);

    if (!error) {
      setSuccess(true);
      setCart([]);
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Purchase', {
          content_name: product?.product_name,
          value: finalTotal,
          currency: 'EGP',
        });
      }
    } else {
      alert('حدث خطأ أثناء إرسال الطلب: ' + error.message);
    }
    setOrderLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white" dir="rtl">
        <p className="text-xl">جاري تحميل المتجر...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-24" dir="rtl">
      {/* شريط الإعلان */}
      <div className="bg-emerald-600 text-white text-center py-2 px-4 text-xs sm:text-sm font-bold shadow-md">
        🚚 التوصيل متاح لجميع المحافظات والدفع عند الاستلام بعد المعاينة!
      </div>

      {/* الهيدر العلوي */}
      <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 py-3.5 px-4 sm:px-8 sticky top-0 z-40 flex items-center justify-between shadow-sm">
        <h1 className="text-lg sm:text-xl font-black text-emerald-400">
          {product?.store_name || 'متجرنا الرسمي'}
        </h1>

        {/* زر فتح السلة في الهيدر */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 flex items-center gap-2 transition"
        >
          <span className="text-xl">🛒</span>
          <span className="text-xs font-bold hidden sm:inline">السلة</span>
          {totalCartCount > 0 && (
            <span className="absolute -top-1.5 -left-1.5 bg-emerald-500 text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
              {totalCartCount}
            </span>
          )}
        </button>
      </header>

      <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-4 sm:p-6 space-y-6">
          
          {/* سلايدر الصور */}
          {galleryImages.length > 0 && (
            <div className="space-y-3">
              <div className="relative w-full bg-black/50 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center min-h-[320px] max-h-[500px] select-none">
                <img
                  src={galleryImages[currentIndex]}
                  alt={product?.product_name}
                  className="w-full h-auto max-h-[480px] object-contain block mx-auto transition-all duration-300"
                />

                {galleryImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-900 border border-slate-600 flex items-center justify-center text-white text-lg transition shadow-lg"
                    >
                      ❮
                    </button>
                    <button
                      type="button"
                      onClick={nextImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-900 border border-slate-600 flex items-center justify-center text-white text-lg transition shadow-lg"
                    >
                      ❯
                    </button>
                    <span className="absolute bottom-3 left-3 bg-black/70 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-300">
                      {currentIndex + 1} / {galleryImages.length}
                    </span>
                  </>
                )}
              </div>

              {galleryImages.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-2">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                        currentIndex === idx ? 'border-emerald-500 scale-105 shadow-md shadow-emerald-500/20' : 'border-slate-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* فيديو المنتج */}
          {product?.video_url && (
            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black">
              <video
                src={product.video_url}
                controls
                className="w-full max-h-[450px] object-contain mx-auto"
              />
            </div>
          )}

          {/* تفاصيل السعر */}
          <div className="border-b border-slate-800 pb-5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">{product?.product_name}</h2>
            <div className="flex items-baseline gap-3 mt-3">
              <span className="text-3xl sm:text-4xl font-black text-emerald-400">{product?.product_price} ج.م</span>
              {product?.original_price && (
                <span className="text-xl line-through text-slate-500">{product.original_price} ج.م</span>
              )}
            </div>
            <div className="inline-block mt-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold">
              مصاريف الشحن: {product?.shipping_fee || 0} ج.م فقط
            </div>
          </div>

          {/* اختيار الألوان */}
          {product?.show_colors && product.colors?.length > 0 && (
            <div className="space-y-3">
              <span className="block text-sm font-semibold text-slate-300">
                اللون المختار: <strong className="text-emerald-400">{selectedColor}</strong>
              </span>
              <div className="flex flex-wrap gap-2.5">
                {product.colors.map((c, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedColor(c.name)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition ${
                      selectedColor === c.name
                        ? 'border-emerald-500 bg-emerald-500/20 text-white shadow-sm'
                        : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full border border-white/20 shadow-inner" style={{ backgroundColor: c.code }}></span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* اختيار المقاسات */}
          {product?.show_sizes && product.sizes?.length > 0 && (
            <div className="space-y-3">
              <span className="block text-sm font-semibold text-slate-300">
                المقاس المختار: <strong className="text-emerald-400">{selectedSize}</strong>
              </span>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedSize(s)}
                    className={`min-w-[54px] px-4 py-2.5 rounded-xl border text-sm font-bold transition ${
                      selectedSize === s
                        ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                        : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* أزرار الإجراءات */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              id="btn-order-now"
              onClick={scrollToCheckout}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg rounded-2xl shadow-lg shadow-emerald-500/25 transition active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>⚡</span>
              <span>اطلب الآن</span>
            </button>

            <button
              type="button"
              id="btn-add-to-cart"
              onClick={() => handleAddToCart(true)}
              className="w-full py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-base rounded-2xl transition active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>🛒</span>
              <span>أضف إلى السلة</span>
            </button>
          </div>

          {addedNotice && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 rounded-xl text-center text-sm font-bold animate-pulse">
              ✅ تمت إضافة المنتج إلى سلة المشتريات!
            </div>
          )}

          {/* تفاصيل المنتج */}
          {product?.description && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h3 className="text-sm font-bold text-slate-300">تفاصيل ومميزات المنتج:</h3>
              <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/50 text-slate-200 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {product.description}
              </div>
            </div>
          )}
        </div>

        {/* نموذج استلام الطلب */}
        <div id="checkout-form" className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl scroll-mt-24">
          <h3 className="text-xl sm:text-2xl font-black text-emerald-400 mb-1 text-center">أدخل بيانات التوصيل</h3>
          <p className="text-xs sm:text-sm text-slate-400 mb-6 text-center">الدفع عند الاستلام بعد فحص ومعاينة المنتج</p>

          {success ? (
            <div className="p-6 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-2xl text-center space-y-3">
              <p className="text-3xl font-black">🎉 تم تأكيد طلبك بنجاح!</p>
              <p className="text-sm sm:text-base">سيتواصل معك فريق خدمة العملاء هاتفياً لتأكيد الشحن والتوصيل.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5 font-medium">الاسم بالكامل</label>
                <input
                  id="customer-name"
                  type="text"
                  required
                  placeholder="محمد أحمد"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-400 transition"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1.5 font-medium">رقم الهاتف (الواتساب)</label>
                <input
                  type="tel"
                  required
                  placeholder="01xxxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-400 transition"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1.5 font-medium">العنوان بالتفصيل</label>
                <textarea
                  required
                  rows="2"
                  placeholder="المحافظة - المدينة - الشارع - رقم العقار..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-400 transition"
                ></textarea>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="btn-confirm-order"
                  disabled={orderLoading}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 rounded-2xl font-black text-lg text-white transition shadow-lg shadow-emerald-500/25 active:scale-[0.99] disabled:opacity-50"
                >
                  {orderLoading ? 'جاري تأكيد طلبك...' : 'تأكيد الطلب والدفع عند الاستلام 🚚'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* نافذة سلة المشتريات المنبثقة (Drawer Modal) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-md h-full bg-slate-900 border-r border-slate-800 flex flex-col p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🛒</span>
                <h2 className="text-xl font-black text-white">سلة مشترياتك ({totalCartCount})</h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* قائمة المنتجات في السلة */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                  <span className="text-5xl">🛍️</span>
                  <p className="text-base font-semibold">سلة المشتريات فارغة حالياً</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-3 bg-slate-800/70 p-3 rounded-2xl border border-slate-700/60 items-center">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl border border-slate-700" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-white line-clamp-1">{item.name}</h4>
                      <p className="text-emerald-400 font-extrabold text-sm mt-0.5">{item.price} ج.م</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        {item.color && <span>اللون: <strong className="text-slate-200">{item.color}</strong></span>}
                        {item.size && <span>المقاس: <strong className="text-slate-200">{item.size}</strong></span>}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-400 hover:text-red-300 text-xs font-bold"
                      >
                        حذف
                      </button>
                      <div className="flex items-center gap-2 bg-slate-700 px-2 py-1 rounded-lg">
                        <button onClick={() => updateQuantity(item.id, -1)} className="text-slate-200 font-bold px-1">−</button>
                        <span className="text-xs font-black">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="text-slate-200 font-bold px-1">+</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* الجزء السفلي من السلة */}
            {cart.length > 0 && (
              <div className="border-t border-slate-800 pt-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">إجمالي المنتجات:</span>
                  <span className="font-extrabold text-white">{cartSubtotal} ج.م</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">الشحن:</span>
                  <span className="font-extrabold text-emerald-400">{product?.shipping_fee || 0} ج.م</span>
                </div>
                <div className="flex justify-between items-center text-base border-t border-slate-800 pt-2 font-black">
                  <span>الإجمالي الكلي:</span>
                  <span className="text-emerald-400 text-lg">{cartSubtotal + (Number(product?.shipping_fee) || 0)} ج.م</span>
                </div>

                <button
                  type="button"
                  onClick={scrollToCheckout}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 font-black text-white text-base rounded-2xl shadow-lg shadow-emerald-500/25 transition active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <span>⚡</span>
                  <span>اطلب الآن وتأكيد البيانات</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* زر الموبايل الثابت */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-slate-900/95 backdrop-blur border-t border-slate-800 z-40 flex items-center gap-3">
        <button
          type="button"
          onClick={scrollToCheckout}
          className="flex-1 py-3 bg-emerald-500 text-white font-black text-base rounded-xl shadow-lg shadow-emerald-500/30"
        >
          اطلب الآن ⚡
        </button>
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="relative px-4 py-3 bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm rounded-xl"
        >
          🛒
          {totalCartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              {totalCartCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
