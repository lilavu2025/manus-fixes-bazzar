import { Order, NewOrderForm, Address } from "./order.types";
import { getStatusText, getPaymentMethodText, safeDecompressNotes } from "./order.utils";

export function getOrderEditChangesDetailed(
  original: Order | null,
  edited: NewOrderForm | null,
  t: (key: string) => string
): { label: string; oldValue: string; newValue: string }[] {
  if (!original || !edited) return [];
  const changes: { label: string; oldValue: string; newValue: string }[] = [];
  if (original.status !== edited.status)
    changes.push({
      label: "حالة الطلب",
      oldValue: getStatusText(original.status, t),
      newValue: getStatusText(edited.status, t),
    });
  if (original.payment_method !== edited.payment_method)
    changes.push({
      label: "طريقة الدفع",
      oldValue: getPaymentMethodText(original.payment_method, t),
      newValue: getPaymentMethodText(edited.payment_method, t),
    });
  if (safeDecompressNotes(original.notes || "") !== (edited.notes || ""))
    changes.push({
      label: "الملاحظات",
      oldValue: safeDecompressNotes(original.notes || ""),
      newValue: edited.notes || "",
    });
  // مقارنة المنتجات
  const origItems = original.items
    .map((i) => `${i.product_name} (x${i.quantity}) بسعر ${i.price}`)
    .join("، ");
  const editItems = edited.items
    .map((i) => `${i.product_name} (x${i.quantity}) بسعر ${i.price}`)
    .join("، ");
  if (origItems !== editItems)
    changes.push({
      label: "الأصناف",
      oldValue: origItems || "-",
      newValue: editItems || "-",
    });
  // مقارنة العنوان
  const omitFullName = (
    addr: Record<string, unknown> | Address | undefined | null
  ) => {
    if (!addr) return {};
    const { fullName, ...rest } = addr as Address;
    return rest;
  };
  if (
    JSON.stringify(omitFullName(original.shipping_address)) !==
    JSON.stringify(omitFullName(edited.shipping_address))
  ) {
    changes.push({
      label: "عنوان الشحن",
      oldValue: Object.values(omitFullName(original.shipping_address)).join(", "),
      newValue: Object.values(omitFullName(edited.shipping_address)).join(", "),
    });
  }
  return changes;
}
