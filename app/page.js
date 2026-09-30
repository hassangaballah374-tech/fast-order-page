'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

export default function CatalogHome() {
  const [settings, setSettings] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCatalog() {
      setLoading(true);
      try {
        // 1. جلب إعدادات المتجر والبيكسل
        const { data: storeData } = await supabase.from('store_settings').select('*').limit(1).maybeSingle();
        if (storeData) {
          setSettings(storeData);

          // إطلاق حدث PageView للبيكسل إن وجد
          if (typeof window !== 'undefined') {
            if (window.fbq) window.fbq('track', 'PageView');
            if (window.ttq) window.ttq.track('PageView');
          }
        }

        // 2. جلب كافة المنتجات من جدول products
        const { data: pData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        let list = pData ? [...pData] : [];

        // إذا كان هناك منتج أولي في store_settings غير مدرج في جدول المنتجات يتم ضمه
        if (storeData && storeData.product_name) {
          const exists = list.some((p) => p.name === storeData.product_name);
          if (!exists) {
            list.unshift({
              id: 'legacy',
              name: storeData.product_name,
              price: storeData.product_price,
              original_price: storeData.original_price,
              description: storeData.description,
              images: storeData.images || (storeData.image_url ? [storeData.image_url] : []),
            });
          }
        }

        setProducts(list);
      } catch (err) {
        console.error('Error loading catalog:', err);
      }
      setLoading(false);
    }

    loadCatalog();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold">جاري تحميل المتجر والمنتجات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20 antialiased" dir="rtl">
      {/* شريط الإعلان العلوي */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white text-center py-2.5 px-4 text-xs sm:text-sm font-bold shadow-md">
        🚚 التوصيل متاح لجميع محافظات مصر • الدفع عند الاستلام بعد المعاينة والفحص!
      </div>

      {/* ترويسة المتجر */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 py-4 px-4 sm:px-8 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛍️</span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">{settings?.store_name || 'متجرنا الرسمي'}</h1>
              <p className="text-xs text-slate-400">تسوق أفضل المنتجات بأعلى جودة وأفضل سعر</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            {products.length} منتجات متاحة
          </span>
        </div>
      </header>

      {/* المحتوى الرئيسي: كتالوج المنتجات */}
      <main className="max-w-6xl mx-auto p-4 sm:p-8 space-y-6">
        <div className="text-center py-4 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">منتجاتنا المميزة</h2>
          <p className="text-xs sm:text-sm text-slate-400">اختر المنتج واضغط لعرض التفاصيل وتأكيد طلبك مباشرة</p>
          <div className="w-16 h-1 bg-emerald-500 rounded-full mx-auto mt-2"></div>
        </div>

        {products.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 font-bold space-y-3">
            <span className="text-4xl">📦</span>
            <p>لا توجد منتجات معروضة حالياً. يمكنك إضافة أول منتج من لوحة التحكم.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const image = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null;
              const productLink = product.id === 'legacy' ? `/p/legacy` : `/p/${product.id}`;
              const discount = product.original_price && product.original_price > product.price
                ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
                : 0;

              return (
                <div
                  key={product.id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between transition-all duration-300 hover:border-emerald-500/60 hover:shadow-emerald-950/20 group"
                >
                  <div className="space-y-4 p-5">
                    {/* صورة المنتج */}
                    <Link href={productLink} className="block relative w-full h-56 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 p-2 flex items-center justify-center">
                      {image ? (
                        <img
                          src={image}
                          alt={product.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-5xl text-slate-600">📦</span>
                      )}
                      {discount > 0 && (
                        <span className="absolute top-3 right-3 bg-red-600 text-white text-[11px] font-black px-2.5 py-1 rounded-xl shadow-md">
                          خصم {discount}%
                        </span>
                      )}
                    </Link>

                    {/* تفاصيل المنتج */}
                    <div className="space-y-2">
                      <Link href={productLink}>
                        <h3 className="font-black text-lg text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                      </Link>

                      <div className="flex items-baseline gap-2.5">
                        <span className="text-2xl font-black text-emerald-400">{product.price} ج.م</span>
                        {product.original_price && (
                          <span className="text-sm line-through text-slate-500">{product.original_price} ج.م</span>
                        )}
                      </div>

                      {product.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* زر عرض الصفحة المستقلة والطلب */}
                  <div className="p-5 pt-0">
                    <Link
                      href={productLink}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <span>⚡</span>
                      <span>عرض التفاصيل واطلب الآن</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
