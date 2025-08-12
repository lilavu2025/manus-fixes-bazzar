// ConfirmEditOrderDialog.tsx
import React, { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/utils/languageContextUtils";

/** نفس النوع اللي عندك */
interface Change {
  label: string;
  oldValue: string;
  newValue: string;
}

type FreeRef = { productId: string; quantity: number };

interface ConfirmEditOrderDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  changes: Change[];

  /** مداخل جديدة (اختيارية) لعرض العروض والمجاني بشكل موحّد */
  appliedOffers?: any[];       // { offer:{id,title_ar,title_en}, discountAmount, affectedProducts[], freeProducts[] }
  prevAppliedOffers?: any[];

  freeItemsNow?: FreeRef[];    // {productId, quantity} (الحالي)
  freeItemsPrev?: FreeRef[];   // {productId, quantity} (السابق)

  itemsBefore?: any[];         // Items قبل التعديل (fallback لقراءة القديم)
  itemsAfter?: any[];          // Items بعد التعديل (fallback لقراءة الحالي)
  products?: any[];            // لعرض اسم المنتج
  discountFromOffers?: number; // مجموع خصم العروض (اختياري)
}

function normalizeJson(x: any) {
  if (!x) return null;
  if (typeof x === "string") { try { return JSON.parse(x); } catch { return null; } }
  return x;
}

function normalizeFreeRefs(raw: any): FreeRef[] {
  const arr = normalizeJson(raw);
  if (!Array.isArray(arr)) return [];
  const out: FreeRef[] = [];
  for (const r of arr) {
    const pid = r?.productId || r?.product_id || r?.product?.id || r?.productId?.id || null;
    const qty = Number(r?.quantity || r?.qty || 1);
    if (pid) out.push({ productId: String(pid), quantity: qty > 0 ? qty : 1 });
  }
  // دمج التكرارات: خذ أكبر كمية
  const map = new Map<string, number>();
  for (const x of out) map.set(x.productId, Math.max(map.get(x.productId) || 0, x.quantity));
  return Array.from(map.entries()).map(([productId, quantity]) => ({ productId, quantity }));
}

function freeFromOffers(rawApplied: any): FreeRef[] {
  const applied = normalizeJson(rawApplied);
  const list = Array.isArray(applied)
    ? applied.flatMap((a: any) => Array.isArray(a?.freeProducts) ? a.freeProducts : [])
    : [];
  return normalizeFreeRefs(list);
}

function productName(products: any[] | undefined, id: string) {
  if (!products) return id;
  const p = products.find((x: any) => String(x.id) === String(id));
  return p?.name_ar || p?.name_en || p?.title || p?.id || id;
}

function byProductId<T extends { productId: string }>(arr: T[] | undefined | null) {
  const map = new Map<string, T>();
  (arr || []).forEach((x) => map.set(String(x.productId), x));
  return map;
}

/** ✅ كشف محسّن: يعتبره مجاني لو فيه 🎁 أو كلمة "مجاني" أو السعر: 0 (عربي/إنجليزي) */
const isFreePriceText = (s?: string) => {
  const txt = String(s || "");
  if (txt.includes("🎁") || /مجاني/.test(txt)) return true;
  const m = txt.match(/(?:السعر|price)\s*:\s*([0-9]+(?:\.[0-9]+)?)/i);
  return m ? Number(m[1]) === 0 : false;
};

const ConfirmEditOrderDialog: React.FC<ConfirmEditOrderDialogProps> = ({
  open,
  onConfirm,
  onCancel,
  changes,

  appliedOffers,
  prevAppliedOffers,

  freeItemsNow,
  freeItemsPrev,

  itemsBefore,
  itemsAfter,
  products,
  discountFromOffers,
}) => {
  const { t } = useLanguage();

  // ===== Canonicalize free items prev/now =====
  // لو ما اجت props، طلعها من appliedOffers/prevAppliedOffers أو من itemsBefore/itemsAfter
  const canonicalPrevFree =
    (freeItemsPrev && freeItemsPrev.length ? freeItemsPrev : freeFromOffers(prevAppliedOffers)) ||
    (Array.isArray(itemsBefore)
      ? normalizeFreeRefs(
          (itemsBefore as any[])
            .filter((it: any) => it?.is_free || Number(it?.price) === 0)
            .map((it: any) => ({ productId: it.product_id, quantity: it.quantity }))
        )
      : []);

  const canonicalNowFree =
    (freeItemsNow && freeItemsNow.length ? freeItemsNow : freeFromOffers(appliedOffers)) ||
    (Array.isArray(itemsAfter)
      ? normalizeFreeRefs(
          (itemsAfter as any[])
            .filter((it: any) => it?.is_free || Number(it?.price) === 0)
            .map((it: any) => ({ productId: it.product_id, quantity: it.quantity }))
        )
      : []);

  const prevMap = byProductId(canonicalPrevFree);
  const nowMap  = byProductId(canonicalNowFree);

  // لتجميع قائمة موحّدة لعرض السابق/الحالي
  const allFreeProductIds = Array.from(new Set([
    ...Array.from(prevMap.keys()),
    ...Array.from(nowMap.keys()),
  ]));

  // Set بأسماء المنتجات المجانية (لإسناد التلوين بجدول التغييرات)
  const freeNameSet = useMemo(() => {
    return new Set(allFreeProductIds.map(pid => productName(products, pid)));
  }, [allFreeProductIds, products]);

  const isFreeLabel = (label: string) => {
    const clean = String(label || "").replace(/^🎁\s*/, "").trim();
    return freeNameSet.has(clean) || /مجاني/.test(clean);
  };

  // ===== عروض مطبقة (الحالي) =====
  const appliedList = Array.isArray(appliedOffers) ? appliedOffers : [];
  const totalOfferDiscount = typeof discountFromOffers === "number"
    ? discountFromOffers
    : appliedList.reduce((s: number, a: any) => s + (Number(a?.discountAmount) || 0), 0);

  // لتمييز الصف في جدول التغييرات
  const classifyRow = (c: Change) => {
    const freeByText  = isFreePriceText(c.oldValue) || isFreePriceText(c.newValue);
    const freeByLabel = isFreeLabel(c.label);
    if (freeByText || freeByLabel) return "free";

    const getPrice = (s: string) => {
      const m = String(s || "").match(/(?:السعر|price)\s*:\s*([0-9]+(?:\.[0-9]+)?)/i);
      return m ? Number(m[1]) : NaN;
    };
    const oldP = getPrice(c.oldValue);
    const newP = getPrice(c.newValue);
    if (Number.isFinite(oldP) && Number.isFinite(newP) && oldP !== newP && oldP > 0 && newP > 0) {
      return "discount";
    }
    return "normal";
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-1 text-primary text-center">
            {t("confirmEditOrder") || "تأكيد تعديل الطلبية"}
          </DialogTitle>
        </DialogHeader>

        {/* قسم: المنتجات المجانية (سابق/حالي) */}
        <div className="mb-4 rounded-lg border p-3">
          <div className="font-semibold mb-2">
            {t("freeItems") || "المنتجات المجانية"}
          </div>
          {allFreeProductIds.length === 0 ? (
            <div className="text-sm text-gray-600">
              {t("noFreeItems") || "لا توجد منتجات مجانية."}
            </div>
          ) : (
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">{t("product") || "المنتج"}</th>
                  <th className="p-2 border">{t("oldQty") || "الكمية السابقة"}</th>
                  <th className="p-2 border">{t("newQty") || "الكمية الجديدة"}</th>
                </tr>
              </thead>
              <tbody>
                {allFreeProductIds.map((pid) => {
                  const prevQty = prevMap.get(pid)?.quantity ?? 0;
                  const nowQty  = nowMap.get(pid)?.quantity ?? 0;
                  const changed = prevQty !== nowQty;
                  return (
                    <tr
                      key={pid}
                      className={`bg-green-50 ${changed ? "ring-1 ring-green-300" : ""}`}
                    >
                      <td className="p-2 border">🎁 {productName(products, pid)}</td>
                      <td className="p-2 border">{prevQty}</td>
                      <td className="p-2 border">
                        <span className={changed ? "font-semibold" : ""}>{nowQty}</span>
                        {changed && (
                          <span className="ms-2 text-xs text-gray-600">
                            ({prevQty} → {nowQty})
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* جدول التغييرات المفصّلة مع تمييز مجاني/مخفّض (بدون إيموجي هنا) */}
        <div className="mb-4 text-gray-700">
          <p>{t("areYouSureYouWantToSaveTheFollowingChanges") || "هل أنت متأكد أنك تريد حفظ التعديلات التالية؟"}</p>
          <table className="w-full mt-4 border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">{t("item") || "البند"}</th>
                <th className="p-2 border">{t("oldValue") || "القيمة السابقة"}</th>
                <th className="p-2 border">{t("newValue") || "القيمة الجديدة"}</th>
              </tr>
            </thead>
            <tbody>
              {changes.length > 0 ? (
                changes.map((change, idx) => {
                  const kind = classifyRow(change); // "free" | "discount" | "normal"
                  const cellBg =
                    kind === "free"
                      ? "bg-green-50"
                      : kind === "discount"
                      ? "bg-yellow-50"
                      : "";
                  const cellStyle = kind === "free" ? { backgroundColor: "#ecfdf5" } : undefined; // fallback

                  return (
                    <tr
                      key={idx}
                      title={kind === "free" ? "بند مجاني" : kind === "discount" ? "بند مخفّض" : ""}
                    >
                      <td className={`p-2 border ${cellBg}`} style={cellStyle}>
                        {kind === "free" ? "🎁 " : kind === "discount" ? "🏷️ " : ""}
                        {change.label}
                      </td>
                      <td className={`p-2 border ${cellBg}`} style={cellStyle}>
                        {change.oldValue}
                      </td>
                      <td className={`p-2 border ${cellBg}`} style={cellStyle}>
                        {change.newValue}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className="p-2 border text-center">
                    {t("noChangesDetected") || "لم يتم رصد تغييرات واضحة."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>{t("cancel") || "إلغاء"}</Button>
          <Button variant="default" onClick={onConfirm}>{t("confirmAndSave") || "تأكيد وحفظ"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmEditOrderDialog;
