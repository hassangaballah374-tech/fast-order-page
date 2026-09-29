const handleAddToCart = (openDrawer = false) => {
    // 1. إرسال حدث AddToCart فوراً لفيسبوك وتيك توك
    if (typeof window !== 'undefined') {
      if (window.fbq) {
        window.fbq('track', 'AddToCart', {
          content_name: product?.name || 'منتج',
          value: Number(product?.price) || 0,
          currency: 'EGP',
        });
      }
      if (window.ttq) {
        window.ttq.track('AddToCart', {
          content_name: product?.name || 'منتج',
          value: Number(product?.price) || 0,
          currency: 'EGP',
        });
      }
    }

    // 2. التحقق من الألوان والمقاسات إن وجدت
    if (product?.show_colors && product.colors?.length > 0 && !selectedColor) {
      alert('يرجى اختيار اللون أولاً');
      return;
    }
    if (product?.show_sizes && product.sizes?.length > 0 && !selectedSize) {
      alert('يرجى اختيار المقاس أولاً');
      return;
    }

    // 3. إضافة العنصر لقائمة السلة
    const newItem = {
      id: `${Date.now()}_${Math.random()}`,
      name: product?.name || 'منتج',
      price: Number(product?.price) || 0,
      image: galleryImages[0] || '',
      color: selectedColor || null,
      size: selectedSize || null,
      quantity: 1,
    };

    setCart((prev) => [...prev, newItem]);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);

    if (openDrawer) {
      setIsCartOpen(true);
    }
  };
