async function loadAllData() {
    setLoading(true);
    try {
      if (supabase) {
        // 1. جلب كل سجلات store_settings للبحث عن أي منتج محفوظ
        const { data: allStoreRows } = await supabase.from('store_settings').select('*');
        let activeStore = null;

        if (allStoreRows && allStoreRows.length > 0) {
          // نأخذ الصف الذي يحتوي على product_name، أو الصف الأول
          activeStore = allStoreRows.find((r) => r.product_name) || allStoreRows[0];
          setSettings({
            store_name: activeStore.store_name || '',
            facebook_pixel_id: activeStore.facebook_pixel_id || '',
            tiktok_pixel_id: activeStore.tiktok_pixel_id || '',
          });
        }

        // 2. جلب المنتجات من جدول products
        const { data: pData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        let combined = pData ? [...pData] : [];

        // 3. فحص كافة صفوف store_settings لضم المنتج القديم إذا لم يكن مسجلاً في products
        if (allStoreRows && allStoreRows.length > 0) {
          allStoreRows.forEach((row, idx) => {
            if (row.product_name) {
              const exists = combined.some((p) => p.name === row.product_name);
              if (!exists) {
                combined.push({
                  id: row.id ? `store_row_${row.id}` : `legacy_${idx}`,
                  is_legacy: true,
                  name: row.product_name,
                  price: Number(row.product_price) || 0,
                  original_price: Number(row.original_price) || null,
                  description: row.description || '',
                  images: row.images || (row.image_url ? [row.image_url] : []),
                  video_url: row.video_url || '',
                  show_colors: Boolean(row.show_colors),
                  colors: row.colors || [],
                  show_sizes: Boolean(row.show_sizes),
                  sizes: row.sizes || [],
                });
              }
            }
          });
        }

        setProducts(combined);

        // 4. جلب الطلبات
        const { data: oData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (oData) setOrders(oData);
      }
    } catch (e) {
      console.error('Error loading data:', e);
    }
    setLoading(false);
  }
