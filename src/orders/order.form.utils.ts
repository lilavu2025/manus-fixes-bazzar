import { OrderItem, NewOrderForm } from "./order.types";

export function addOrderItemToForm(orderForm: NewOrderForm, products: any[]): NewOrderForm {
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
