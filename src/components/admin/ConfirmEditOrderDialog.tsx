import React from "react";
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
  appliedOffers?: any[];       // الشكل: { offer:{id,title_ar,title_en}, discountAmount, affectedProducts[], freeProducts[] }
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
    // fallback: من itemsBefore (أي عنصر سعره 0 أو is_free)
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

  // ===== عروض مطبقة (الحالي) =====
  const appliedList = Array.isArray(appliedOffers) ? appliedOffers : [];
  const totalOfferDiscount = typeof discountFromOffers === "number"
    ? discountFromOffers
    : appliedList.reduce((s: number, a: any) => s + (Number(a?.discountAmount) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-1 text-primary text-center">
            {t("confirmEditOrder") || "تأكيد تعديل الطلبية"}
          </DialogTitle>
        </DialogHeader>

        {/* قسم: ملخص العروض */}
        <div className="mb-4 rounded-lg border p-3 bg-primary/5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-semibold">
              {t("appliedOffers") || "العروض المطبقة"}
            </div>
            <div className="text-sm">
              {(t("totalDiscount") || "إجمالي الخصم") + ": "}
              <span className="font-bold">{totalOfferDiscount.toFixed ? totalOfferDiscount.toFixed(2) : totalOfferDiscount}</span>
            </div>
          </div>

          {appliedList.length === 0 ? (
            <div className="mt-2 text-sm text-gray-600">
              {t("noOffersApplied") || "لا توجد عروض مطبقة."}
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {appliedList.map((o: any, idx: number) => {
                const title = o?.offer?.title_ar || o?.offer?.title_en || o?.offer?.id || t("offer") || "عرض";
                const affectedCount = Array.isArray(o?.affectedProducts) ? o.affectedProducts.length : 0;
                const freeCount = Array.isArray(o?.freeProducts) ? o.freeProducts.length : 0;
                return (
                  <li key={idx} className="rounded-md border p-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-medium">
                        {title}
                      </div>
                      <div className="text-xs text-gray-700">
                        {t("discount") || "الخصم"}: <b>{Number(o?.discountAmount || 0).toFixed(2)}</b>
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-gray-600 flex flex-wrap gap-3">
                      <span className="inline-flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded bg-gray-100">
                          {t("affectedProducts") || "منتجات متأثرة"}: {affectedCount}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded bg-gray-100">
                          {t("freeProducts") || "منتجات مجانية"}: {freeCount}
                        </span>
                      </span>
                    </div>
                    {/* قائمة المنتجات المجانية ضمن العرض (إن وجدت) */}
                    {Array.isArray(o?.freeProducts) && o.freeProducts.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs font-medium mb-1">{t("freeProductsList") || "قائمة المنتجات المجانية"}</div>
                        <ul className="text-xs list-disc ms-5">
                          {o.freeProducts.map((fp: any, i: number) => (
                            <li key={i}>
                              {productName(products, String(fp.productId))} — {t("qty") || "الكمية"}: {fp.quantity || 1}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

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
                    <tr key={pid} className={changed ? "bg-yellow-50" : ""}>
                      <td className="p-2 border">{productName(products, pid)}</td>
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
          <div className="mt-2 text-xs text-gray-600">
            {t("freeItemsStockNote") || "ملاحظة: سيتم خصم الكميات المجانية من المخزون بواسطة منطق الخادم/التريغر وفق إعدادات النظام."}
          </div>
        </div>

        {/* جدول التغييرات المفصّلة (كما كان) */}
        <div className="mb-4 text-gray-700">
          <p>{t("areYouSureYouWantToSaveTheFollowingChanges") || "هل أنت متأكد أنك تريد حفظ التعديلات التالية على الطلبية؟"}</p>
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
                changes.map((change, idx) => (
                  <tr key={idx}>
                    <td className="p-2 border">{change.label}</td>
                    <td className="p-2 border">{change.oldValue}</td>
                    <td className="p-2 border">{change.newValue}</td>
                  </tr>
                ))
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
