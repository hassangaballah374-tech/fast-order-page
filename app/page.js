// لمنع تكرار إرسال InitiateCheckout نهائياً في الجلسة الواحدة
  const [hasInitiatedCheckout, setHasInitiatedCheckout] = useState(false);

  const triggerInitiateCheckout = () => {
    if (hasInitiatedCheckout) return;
    setHasInitiatedCheckout(true);

    if (typeof window !== 'undefined') {
      if (window.fbq) {
        window.fbq('track', 'InitiateCheckout', {
          content_name: product?.name || 'منتج',
          value: Number(product?.price) || 0,
          currency: 'EGP',
        });
      }
      if (window.ttq) {
        window.ttq.track('InitiateCheckout', {
          content_name: product?.name || 'منتج',
          value: Number(product?.price) || 0,
          currency: 'EGP',
        });
      }
    }
  };

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

    // إرسال AddToCart مرة واحدة فقط عند الضغط الفعلي على الزر
    if (typeof window !== 'undefined') {
      if (window.fbq) {
        window.fbq('track', 'AddToCart', {
          content_name: product?.name,
          value: Number(product?.price) || 0,
          currency: 'EGP',
        });
      }
      if (window.ttq) {
        window.ttq.track('AddToCart', {
          content_name: product?.name,
          value: Number(product?.price) || 0,
          currency: 'EGP',
        });
      }
    }

    if (openDrawer) {
      setIsCartOpen(true);
    }
  };

  const scrollToCheckout = () => {
    setIsCartOpen(false);
    triggerInitiateCheckout();

    const formElement = document.getElementById('checkout-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };
