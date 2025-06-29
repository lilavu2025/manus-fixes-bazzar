import { OrderItem, NewOrderForm } from "./order.types";

export function addOrderItemToForm(orderForm: NewOrderForm, products: any[], productId?: string): NewOrderForm {
  // إذا لم يتم تمرير productId، أضف عنصر فارغ كالسابق (للاستخدام في زر إضافة سطر فارغ)
  if (!productId) {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      product_id: "",
      quantity: 1,
      price: 0,
      product_name: "",
    };
    return {
      ...orderForm,
      items: [...orderForm.items, newItem],
    };
  }
  // إذا تم تمرير productId، تحقق إذا كان المنتج موجودًا
  const existingIndex = orderForm.items.findIndex(item => item.product_id === productId);
  if (existingIndex !== -1) {
    // المنتج موجود: زد الكمية فقط
    const updatedItems = orderForm.items.map((item, idx) =>
      idx === existingIndex ? { ...item, quantity: Number(item.quantity) + 1 } : item
    );
    return { ...orderForm, items: updatedItems };
  } else {
    // المنتج غير موجود: أضف عنصر جديد
    const selectedProduct = products.find(p => p.id === productId);
    const newItem: OrderItem = {
      id: Date.now().toString(),
      product_id: productId,
      quantity: 1,
      price: selectedProduct?.price || 0,
      product_name:
        selectedProduct?.name_ar ||
        selectedProduct?.name_en ||
        selectedProduct?.name_he ||
        selectedProduct?.id || '',
    };
    return {
      ...orderForm,
      items: [...orderForm.items, newItem],
    };
  }
}

export function removeOrderItemFromForm(orderForm: NewOrderForm, itemId: string): NewOrderForm {
  return {
    ...orderForm,
    items: orderForm.items.filter((item) => item.id !== itemId),
  };
}

export function updateOrderItemInForm(
  orderForm: NewOrderForm,
  itemId: string,
  field: keyof OrderItem,
  value: string | number,
  products: any[]
): NewOrderForm {
  // إذا كان التغيير هو product_id، تحقق إذا كان المنتج مكررًا في عنصر آخر
  if (field === "product_id") {
    const existingIndex = orderForm.items.findIndex(
      (item) => item.product_id === value && item.id !== itemId
    );
    if (existingIndex !== -1) {
      // المنتج مكرر: زد الكمية في السطر الأصلي واحذف السطر الحالي
      const currentItem = orderForm.items.find(item => item.id === itemId);
      const updatedItems = orderForm.items
        .map((item, idx) =>
          idx === existingIndex && currentItem
            ? { ...item, quantity: Number(item.quantity) + Number(currentItem.quantity) }
            : item
        )
        .filter(item => item.id !== itemId);
      return { ...orderForm, items: updatedItems };
    }
  }
  return {
    ...orderForm,
    items: orderForm.items.map((item) => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        if (field === "product_id") {
          const selectedProduct = products.find((p) => p.id === value);
          if (selectedProduct) {
            updatedItem.product_name =
              selectedProduct.name_ar ||
              selectedProduct.name_en ||
              selectedProduct.name_he ||
              selectedProduct.id;
            updatedItem.price = selectedProduct.price;
          }
        }
        return updatedItem;
      }
      return item;
    }),
  };
}
