const { error } = await supabase.from('orders').insert([
      {
        customer_name: formData.name,
        phone: formData.phone,
        address: formData.address,
        notes: formData.notes,
        product_name: itemsToOrder.map((i) => `${i.name} (${i.quantity})`).join(' + '),
        total_amount: finalTotal,
        total_price: finalTotal, // إرسال نفس القيمة هنا لمنع أي تعارض
        selected_color: itemsToOrder[0]?.color || selectedColor || null,
        selected_size: itemsToOrder[0]?.size || selectedSize || null,
        quantity: itemsToOrder.reduce((acc, i) => acc + i.quantity, 0),
        items: itemsToOrder,
        status: 'جديد',
      },
    ]);
