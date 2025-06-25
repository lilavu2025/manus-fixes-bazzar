import { Order, NewOrderForm, Address } from "./order.types";
import { getStatusText, getPaymentMethodText, safeDecompressNotes } from "./order.utils";

export function getOrderEditChangesDetailed(
  original: Order | null,
  edited: NewOrderForm | null,
  t: (key: string) => string,
  language: string = 'ar',
  products: any[] = []
): { label: string; oldValue: string; newValue: string }[] {
  if (!original || !edited) return [];
  const changes: { label: string; oldValue: string; newValue: string }[] = [];
  if (original.status !== edited.status)
    changes.push({
      label: t("status") || "الحالة",
      oldValue: getStatusText(original.status, t),
      newValue: getStatusText(edited.status, t),
    });
  if (original.payment_method !== edited.payment_method)
    changes.push({
      label: t("paymentMethod") || "طريقة الدفع",
      oldValue: getPaymentMethodText(original.payment_method, t),
      newValue: getPaymentMethodText(edited.payment_method, t),
    });
  if (safeDecompressNotes(original.notes || "") !== (edited.notes || ""))
    changes.push({
      label: t("notes") || "الملاحظات",
      oldValue: safeDecompressNotes(original.notes || ""),
      newValue: edited.notes || "",
    });
  // مقارنة المنتجات: عرض فقط المنتجات التي تغيرت (كمية أو سعر أو حذف/إضافة)
  const getProductKey = (item: any) => item.product_id || item.id;
  const getProductName = (item: any) => {
    const prod = products.find((p) => p.id === item.product_id);
    if (prod) {
      if (language === "he") return prod.nameHe || prod.name_he || prod.nameEn || prod.name_en || prod.name || prod.name_ar || prod.product_name || prod.id || "";
      if (language === "en") return prod.nameEn || prod.name_en || prod.nameHe || prod.name_he || prod.name || prod.name_ar || prod.product_name || prod.id || "";
      return prod.name || prod.name_ar || prod.nameEn || prod.name_en || prod.nameHe || prod.name_he || prod.product_name || prod.id || "";
    }
    // fallback: استخدم الاسم المخزن في العنصر
    return item[`name_${language}`] || item.product_name || item.name_ar || item.name_en || item.name_he || item.id || "";
  };
  const origItemsMap = new Map(original.items.map(i => [getProductKey(i), i]));
  const editItemsMap = new Map(edited.items.map(i => [getProductKey(i), i]));
  // المنتجات التي تغيرت أو أضيفت أو حذفت
  const allKeys = Array.from(new Set([
    ...original.items.map(getProductKey),
    ...edited.items.map(getProductKey)
  ]));
  allKeys.forEach(key => {
    const orig = origItemsMap.get(key);
    const edit = editItemsMap.get(key);
    if (!orig && edit) {
      // منتج جديد أضيف
      changes.push({
        label: getProductName(edit),
        oldValue: '-',
        newValue: `${t('quantity') || 'الكمية'}: ${edit.quantity}, ${t('price') || 'السعر'}: ${edit.price}`
      });
    } else if (orig && !edit) {
      // منتج تم حذفه
      changes.push({
        label: getProductName(orig),
        oldValue: `${t('quantity') || 'الكمية'}: ${orig.quantity}, ${t('price') || 'السعر'}: ${orig.price}`,
        newValue: '-'
      });
    } else if (orig && edit) {
      // منتج موجود في الاثنين: تحقق من التغييرات
      if (orig.quantity !== edit.quantity || orig.price !== edit.price) {
        changes.push({
          label: getProductName(orig),
          oldValue: `${t('quantity') || 'الكمية'}: ${orig.quantity}, ${t('price') || 'السعر'}: ${orig.price}`,
          newValue: `${t('quantity') || 'الكمية'}: ${edit.quantity}, ${t('price') || 'السعر'}: ${edit.price}`
        });
      }
    }
  });
  // مقارنة العنوان مع دعم التعدد اللغوي
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
      label: t("shippingAddress") || "عنوان الشحن",
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
      label: t("discountEnabled") || "تفعيل الخصم",
      oldValue: origDiscountEnabled ? t("enabled") || "مفعل" : t("disabled") || "غير مفعل",
      newValue: editDiscountEnabled ? t("enabled") || "مفعل" : t("disabled") || "غير مفعل",
    });
  }
  if (editDiscountEnabled) {
    if (original.discount_type !== edited.discountType) {
      changes.push({
        label: t("discountType") || "نوع الخصم",
        oldValue: original.discount_type === "percent" ? t("percent") || "نسبة مئوية" : t("amount") || "مبلغ ثابت",
        newValue: edited.discountType === "percent" ? t("percent") || "نسبة مئوية" : t("amount") || "مبلغ ثابت",
      });
    }
    if (original.discount_value !== edited.discountValue) {
      changes.push({
        label: t("discountValue") || "قيمة الخصم",
        oldValue: original.discount_value?.toString() || "0",
        newValue: edited.discountValue?.toString() || "0",
      });
    }
  }
  return changes;
}
