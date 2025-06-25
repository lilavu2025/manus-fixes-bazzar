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
  // مقارنة الخصم
  const origDiscountEnabled = !!(
    original.discount_type && original.discount_value && original.discount_value > 0
  );
  const editDiscountEnabled = !!(
    edited.discountEnabled && edited.discountValue && edited.discountValue > 0
  );
  if (origDiscountEnabled !== editDiscountEnabled) {
    changes.push({
      label: "تفعيل الخصم",
      oldValue: origDiscountEnabled ? "مفعل" : "غير مفعل",
      newValue: editDiscountEnabled ? "مفعل" : "غير مفعل",
    });
  }
  if (editDiscountEnabled) {
    if (original.discount_type !== edited.discountType) {
      changes.push({
        label: "نوع الخصم",
        oldValue: original.discount_type === "percent" ? "نسبة مئوية" : "مبلغ ثابت",
        newValue: edited.discountType === "percent" ? "نسبة مئوية" : "مبلغ ثابت",
      });
    }
    if (original.discount_value !== edited.discountValue) {
      changes.push({
        label: "قيمة الخصم",
        oldValue: original.discount_value?.toString() || "0",
        newValue: edited.discountValue?.toString() || "0",
      });
    }
  }
  return changes;
}
