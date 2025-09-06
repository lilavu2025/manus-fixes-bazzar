// ConfirmEditOrderDialog.tsx
import React, { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/utils/languageContextUtils";
import { renderVariantInfo, toDisplayVariantText } from "@/utils/variantUtils";

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

// ===== Helpers for variant comparison/rendering =====
function normalizeVariantAttrs(raw: any): Record<string, string> | null {
  const obj = normalizeJson(raw);
  if (obj && typeof obj === 'object') return obj as Record<string, string>;
  return null;
}

function sortObjectKeys<T extends Record<string, any>>(obj: T): T {
  return Object.keys(obj)
    .sort((a, b) => a.localeCompare(b))
    .reduce((acc: any, k) => { acc[k] = obj[k]; return acc; }, {});
}

function stringifyVariant(attrs?: Record<string, any> | null, language: 'ar' | 'en' | 'he' = 'ar'): string {
  if (!attrs || Object.keys(attrs).length === 0) return "(بدون مواصفات)";
  const sorted = sortObjectKeys(attrs);
  return Object.entries(sorted)
    .map(([k, v]) => `${toDisplayVariantText(k, language)}: ${toDisplayVariantText(v, language)}`)
    .join(', ');
}

function getVariantKey(item: any): string {
  const variantId = item?.variant_id || item?.variantId || null;
  const attrs = normalizeVariantAttrs(item?.variant_attributes) || normalizeVariantAttrs(item?.variantAttributes);
  if (variantId) return `id:${variantId}`;
  if (attrs) return `attrs:${JSON.stringify(sortObjectKeys(attrs))}`;
  return 'base';
}

function buildVariantDiffChanges(itemsBefore?: any[], itemsAfter?: any[], products?: any[], language: 'ar' | 'en' | 'he' = 'ar'): Change[] {
  const before = Array.isArray(itemsBefore) ? itemsBefore : [];
  const after  = Array.isArray(itemsAfter)  ? itemsAfter  : [];

  // Group by product_id
  const getPid = (it: any) => String(it?.product_id || it?.productId || it?.product?.id || '');
  const group = (arr: any[]) => {
    const m = new Map<string, any[]>();
    for (const it of arr) {
      const pid = getPid(it);
      if (!m.has(pid)) m.set(pid, []);
      m.get(pid)!.push(it);
    }
    return m;
  };

  const gPrev = group(before);
  const gNow  = group(after);

  const allPids = new Set<string>([...gPrev.keys(), ...gNow.keys()]);
  const out: Change[] = [];

  const pname = (pid: string) => productName(products || [], pid);

  for (const pid of allPids) {
    const prevList = gPrev.get(pid) || [];
    const nowList  = gNow.get(pid)  || [];

    // Simple case: exactly one before and one after
    if (prevList.length === 1 && nowList.length === 1) {
      const a = prevList[0];
      const b = nowList[0];
      const aKey = getVariantKey(a);
      const bKey = getVariantKey(b);
      if (aKey !== bKey) {
        const aAttrs = normalizeVariantAttrs(a?.variant_attributes) || normalizeVariantAttrs(a?.variantAttributes);
        const bAttrs = normalizeVariantAttrs(b?.variant_attributes) || normalizeVariantAttrs(b?.variantAttributes);
        out.push({
          label: `${pname(pid)} • ${toDisplayVariantText({ ar: 'المواصفات', en: 'Variant', he: 'וריאנט' }, language)}`,
          oldValue: stringifyVariant(aAttrs, language),
          newValue: stringifyVariant(bAttrs, language),
        });
      }
      continue;
    }

    // Complex case: multiple lines per product
    // Create sets of keys for matching
    const prevKeys = new Set(prevList.map(getVariantKey));
    const nowKeys  = new Set(nowList.map(getVariantKey));
    const unmatchedPrev = [...prevKeys].filter(k => !nowKeys.has(k));
    const unmatchedNow  = [...nowKeys].filter(k => !prevKeys.has(k));

    // If there's exactly one unmatched on both sides, we assume variant changed
    if (unmatchedPrev.length === 1 && unmatchedNow.length === 1) {
      const prevIt = prevList.find(it => getVariantKey(it) === unmatchedPrev[0]);
      const nowIt  = nowList.find(it => getVariantKey(it) === unmatchedNow[0]);
      const aAttrs = normalizeVariantAttrs(prevIt?.variant_attributes) || normalizeVariantAttrs(prevIt?.variantAttributes);
      const bAttrs = normalizeVariantAttrs(nowIt?.variant_attributes)  || normalizeVariantAttrs(nowIt?.variantAttributes);
      out.push({
        label: `${pname(pid)} • ${toDisplayVariantText({ ar: 'المواصفات', en: 'Variant', he: 'וריאנט' }, language)}`,
        oldValue: stringifyVariant(aAttrs, language),
        newValue: stringifyVariant(bAttrs, language),
      });
    }
  }

  return out;
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
  const { t, isRTL, language } = useLanguage();

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

  // اعتبره مجاني فقط إذا العنوان يحتوي على دلالة صريحة (🎁 أو "مجاني")
  const isFreeLabel = (label: string) => /🎁|مجاني|\(مجاني\)/.test(String(label || ""));

  // ===== عروض مطبقة (الحالي) =====
  const appliedList = Array.isArray(appliedOffers) ? appliedOffers : [];
  const totalOfferDiscount = typeof discountFromOffers === "number"
    ? discountFromOffers
    : appliedList.reduce((s: number, a: any) => s + (Number(a?.discountAmount) || 0), 0);

  // لتمييز الصف في جدول التغييرات
  const classifyRow = (c: Change) => {
    // لا تعتمد على السعر القديم لأنه قد يكون 0 عند عدم وجود بند سابق
    const freeByText  = isFreePriceText(c.newValue);
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

  // ===== Combine incoming changes with computed variant changes (avoid duplicates loosely) =====
  const variantChanges = useMemo(() => buildVariantDiffChanges(itemsBefore, itemsAfter, products, language as any), [itemsBefore, itemsAfter, products, language]);
  const allChanges = useMemo(() => {
    // naive de-dup: combine and remove exact same label+old+new
    const seen = new Set<string>();
    const merged: Change[] = [];
    for (const c of [...(changes || []), ...variantChanges]) {
      const key = `${c.label}|${c.oldValue}|${c.newValue}`;
      if (!seen.has(key)) { seen.add(key); merged.push(c); }
    }
    return merged;
  }, [changes, variantChanges]);

  // ===== Map product display names to IDs to detect rows that are product lines =====
  const nameToPid = useMemo(() => {
    const map = new Map<string, string>();
    (products || []).forEach((p: any) => {
      const pid = String(p.id);
      const names = [p.name_ar, p.name_en, p.name_he, p.nameHe, p.title, p.name].filter(Boolean);
      names.forEach((n) => map.set(String(n), pid));
    });
    return map;
  }, [products]);

  const cleanLabelToName = (label: string): string => {
    if (!label) return "";
    let s = String(label).trim();
    // ignore labels that visibly mark free/discount to avoid mixing
    if (/🎁|\(مجاني\)|\(مخفض\)|%/.test(s)) return "";
    // cut anything after a bullet marker (used for variant change rows)
    s = s.split(" • ")[0].trim();
    return s;
  };

  const findVariantAttrsForPid = (pid: string): any | null => {
    const deriveFromVid = (vid: any, pidStr: string) => {
      if (!vid) return null;
      const prod = (products || []).find((p: any) => String(p.id) === String(pidStr));
      const variants = Array.isArray(prod?.variants) ? prod.variants : [];
      const v = variants.find((x: any) => String(x?.id) === String(vid));
      const opt = v?.option_values || v?.optionValues || null;
      return (opt && typeof opt === 'object') ? opt : null;
    };
    const pickFrom = (arr?: any[]) => {
      if (!Array.isArray(arr)) return null;
      const candidates = arr.filter((it) => String(it?.product_id) === String(pid));
      if (candidates.length === 0) return null;
      // 1) prefer non-free/non-offer with direct attrs
      const prefPaid = candidates.find((it) => !it?.is_free && !it?.offer_applied);
      const directPaid = prefPaid && (prefPaid.variant_attributes ?? prefPaid.variantAttributes ?? prefPaid.variant);
      if (directPaid) return directPaid;
      // 2) any candidate with direct attrs
      const anyWithAttrs = candidates.find((it) => it?.variant_attributes || it?.variantAttributes || it?.variant);
      if (anyWithAttrs) return (anyWithAttrs.variant_attributes ?? anyWithAttrs.variantAttributes ?? anyWithAttrs.variant);
      // 3) derive from variant_id among preferred, then any
      const paidVid = prefPaid && (prefPaid.variant_id ?? prefPaid.variantId ?? prefPaid.variant?.id);
      const fromPaidVid = deriveFromVid(paidVid, pid);
      if (fromPaidVid) return fromPaidVid;
      const anyVidOwner = candidates.find((it) => it?.variant_id || it?.variantId || it?.variant?.id);
      const anyVid = anyVidOwner && (anyVidOwner.variant_id ?? anyVidOwner.variantId ?? anyVidOwner.variant?.id);
      return deriveFromVid(anyVid, pid);
    };
    return pickFrom(itemsAfter) ?? pickFrom(itemsBefore);
  };

  // Fallback: find variant attributes using product_name matching when PID mapping fails
  const findVariantAttrsForLabel = (labelName: string): any | null => {
    const deriveFromVid = (vid: any, pidStr: string) => {
      if (!vid) return null;
      const prod = (products || []).find((p: any) => String(p.id) === String(pidStr));
      const variants = Array.isArray(prod?.variants) ? prod.variants : [];
      const v = variants.find((x: any) => String(x?.id) === String(vid));
      const opt = v?.option_values || v?.optionValues || null;
      return (opt && typeof opt === 'object') ? opt : null;
    };
    const pickFrom = (arr?: any[]) => {
      if (!Array.isArray(arr)) return null;
      const nameEq = (x: any) => String(x || "").trim() === labelName;
      const candidates = arr.filter((it) => nameEq(it?.product_name));
      if (candidates.length === 0) return null;
      const prefPaid = candidates.find((it) => !it?.is_free && !it?.offer_applied);
      const directPaid = prefPaid && (prefPaid.variant_attributes ?? prefPaid.variantAttributes ?? prefPaid.variant);
      if (directPaid) return directPaid;
      const anyWithAttrs = candidates.find((it) => it?.variant_attributes || it?.variantAttributes || it?.variant);
      if (anyWithAttrs) return (anyWithAttrs.variant_attributes ?? anyWithAttrs.variantAttributes ?? anyWithAttrs.variant);
      const pid = (prefPaid?.product_id ?? candidates[0]?.product_id) ? String(prefPaid?.product_id ?? candidates[0]?.product_id) : null;
      const paidVid = prefPaid && (prefPaid.variant_id ?? prefPaid.variantId ?? prefPaid.variant?.id);
      const fromPaidVid = pid ? deriveFromVid(paidVid, pid) : null;
      if (fromPaidVid) return fromPaidVid;
      const anyVidOwner = candidates.find((it) => it?.variant_id || it?.variantId || it?.variant?.id);
      const anyVid = anyVidOwner && (anyVidOwner.variant_id ?? anyVidOwner.variantId ?? anyVidOwner.variant?.id);
      return pid ? deriveFromVid(anyVid, pid) : null;
    };
    return pickFrom(itemsAfter) ?? pickFrom(itemsBefore);
  };

  // ===== Unified attrs by product: if exactly one unique variant across lines, return it
  const deriveFromVariantId = (pid: string, vid: any): Record<string, any> | null => {
    if (!vid) return null;
    const prod = (products || []).find((p: any) => String(p.id) === String(pid));
    const variants = Array.isArray(prod?.variants) ? prod.variants : [];
    const v = variants.find((x: any) => String(x?.id) === String(vid));
    const opt = v?.option_values || v?.optionValues || null;
    return (opt && typeof opt === 'object') ? opt : null;
  };

  const computeUnifiedVariantAttrsForPid = (pid: string): Record<string, any> | null => {
    const collect = (arr?: any[]) => {
      if (!Array.isArray(arr)) return [] as Record<string, any>[];
      const candidates = arr.filter((it) => String(it?.product_id) === String(pid));
      return candidates.map((it) => {
        const direct = it?.variant_attributes ?? it?.variantAttributes ?? it?.variant;
        if (direct) return direct;
        const vid = it?.variant_id ?? it?.variantId ?? it?.variant?.id;
        return deriveFromVariantId(pid, vid);
      }).filter(Boolean) as Record<string, any>[];
    };
    const list = [...collect(itemsAfter), ...collect(itemsBefore)];
    if (list.length === 0) return null;
    // unique by sorted JSON
    const uniq = new Map<string, Record<string, any>>();
    for (const a of list) {
      try {
        const obj = typeof a === 'string' ? JSON.parse(a) : a;
        if (!obj || typeof obj !== 'object') continue;
        const sorted = sortObjectKeys(obj as any);
        const key = JSON.stringify(sorted);
        if (!uniq.has(key)) uniq.set(key, sorted);
      } catch {}
    }
    if (uniq.size === 1) return Array.from(uniq.values())[0];
    return null;
  };

  const computeUnifiedVariantAttrsForLabel = (labelName: string): Record<string, any> | null => {
    const collect = (arr?: any[]) => {
      if (!Array.isArray(arr)) return [] as { pid?: string; attrs?: any; vid?: any }[];
      const candidates = arr.filter((it) => String(it?.product_name || '').trim() === labelName);
      return candidates.map((it) => ({
        pid: it?.product_id ? String(it.product_id) : undefined,
        attrs: it?.variant_attributes ?? it?.variantAttributes ?? it?.variant,
        vid: it?.variant_id ?? it?.variantId ?? it?.variant?.id
      }));
    };
    const list = [...collect(itemsAfter), ...collect(itemsBefore)];
    if (list.length === 0) return null;
    const attrsList: Record<string, any>[] = [];
    for (const r of list) {
      if (r.attrs) {
        attrsList.push(r.attrs);
      } else if (r.pid && r.vid) {
        const d = deriveFromVariantId(r.pid, r.vid);
        if (d) attrsList.push(d);
      }
    }
    if (attrsList.length === 0) return null;
    const uniq = new Map<string, Record<string, any>>();
    for (const a of attrsList) {
      try {
        const obj = typeof a === 'string' ? JSON.parse(a) : a;
        if (!obj || typeof obj !== 'object') continue;
        const sorted = sortObjectKeys(obj as any);
        const key = JSON.stringify(sorted);
        if (!uniq.has(key)) uniq.set(key, sorted);
      } catch {}
    }
    if (uniq.size === 1) return Array.from(uniq.values())[0];
    return null;
  };

  // Parse price from change value text (supports 'السعر' and 'price')
  const parsePriceFromText = (s?: string): number | null => {
    const m = String(s || "").match(/(?:السعر|price)\s*:\s*([0-9]+(?:\.[0-9]+)?)/i);
    return m ? Number(m[1]) : null;
  };

  // Fallback: infer variant by matching variant price if unique
  const inferVariantAttrsByPrice = (pid: string, targetPrice: number | null): Record<string, any> | null => {
    if (targetPrice == null || !products) return null;
    const prod = (products || []).find((p: any) => String(p.id) === String(pid));
    const variants = Array.isArray(prod?.variants) ? prod.variants : [];
    const matched = variants.filter((v: any) => {
      const p = Number(v?.price);
      const w = Number(v?.wholesale_price ?? v?.wholesalePrice);
      return (Number.isFinite(p) && p === targetPrice) || (Number.isFinite(w) && w === targetPrice);
    });
    if (matched.length === 1) {
      const opt = matched[0]?.option_values || matched[0]?.optionValues || null;
      return (opt && typeof opt === 'object') ? opt : null;
    }
    return null;
  };

  // Find the exact item row by label (product_name) and parsed new price, prefer itemsAfter
  const findVariantAttrsByLabelAndNewPrice = (labelName: string, newValText?: string): Record<string, any> | null => {
    const targetPrice = parsePriceFromText(newValText);
    const pickFrom = (arr?: any[]) => {
      if (!Array.isArray(arr)) return null;
      const rows = arr.filter((it) => String(it?.product_name || '').trim() === labelName && !it?.is_free);
      // prefer a row with explicit variant attrs
      const withAttrs = rows.find((it) => it?.variant_attributes || it?.variantAttributes || it?.variant);
      if (withAttrs) return (withAttrs.variant_attributes ?? withAttrs.variantAttributes ?? withAttrs.variant);
      // then match by price if available
      if (targetPrice != null) {
        const byPrice = rows.find((it) => Number(it?.price) === targetPrice);
        if (byPrice) {
          const direct = byPrice?.variant_attributes ?? byPrice?.variantAttributes ?? byPrice?.variant;
          if (direct) return direct;
          const pid = (byPrice?.product_id ?? byPrice?.productId) ? String(byPrice?.product_id ?? byPrice?.productId) : null;
          const vid = byPrice?.variant_id ?? byPrice?.variantId ?? byPrice?.variant?.id;
          if (pid && vid) return deriveFromVariantId(pid, vid);
        }
      }
      return null;
    };
    return pickFrom(itemsAfter) ?? pickFrom(itemsBefore);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent dir={isRTL ? 'rtl' : 'ltr'}>
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
                  // حاول إيجاد سطر العنصر من before/after لعرض خصائص الفيرينت (اختياري)
                  const findOne = (arr?: any[]) => (Array.isArray(arr) ? arr.find((it) => String(it?.product_id) === String(pid) && ((it?.is_free) || Number(it?.price) === 0)) : null);
                  const beforeItem = findOne(itemsBefore);
                  const afterItem  = findOne(itemsAfter);
                  // دعم كلا المفتاحين: variant_attributes و variantAttributes (وأحياناً variant)
                  let variantAttrs =
                    (afterItem?.variant_attributes ?? afterItem?.variantAttributes ?? afterItem?.variant ??
                     beforeItem?.variant_attributes ?? beforeItem?.variantAttributes ?? beforeItem?.variant) || null;
                  if (!variantAttrs) {
                    const vid = (afterItem?.variant_id ?? afterItem?.variantId ?? afterItem?.variant?.id ?? beforeItem?.variant_id ?? beforeItem?.variantId ?? beforeItem?.variant?.id);
                    variantAttrs = findVariantAttrsForPid(pid) || (vid ? (function(){
                      const prod = (products || []).find((p: any) => String(p.id) === String(pid));
                      const variants = Array.isArray(prod?.variants) ? prod.variants : [];
                      const v = variants.find((x: any) => String(x?.id) === String(vid));
                      return v?.option_values || v?.optionValues || null;
                    })() : null);
                  }
                  return (
                    <tr
                      key={pid}
                      className={`bg-green-50 ${changed ? "ring-1 ring-green-300" : ""}`}
                    >
                      <td className="p-2 border">
                        🎁 {productName(products, pid)}
                        {variantAttrs ? (
                          <div className="mt-1">{renderVariantInfo(variantAttrs, "text-green-700 text-[11px]", language as any)}</div>
                        ) : null}
                      </td>
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
          <p className={isRTL ? 'text-right' : 'text-left'}>{t("areYouSureYouWantToSaveTheFollowingChanges") || "هل أنت متأكد أنك تريد حفظ التعديلات التالية؟"}</p>
          <table className="w-full mt-4 border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">{t("item") || "البند"}</th>
                <th className="p-2 border">{t("oldValue") || "القيمة السابقة"}</th>
                <th className="p-2 border">{t("newValue") || "القيمة الجديدة"}</th>
              </tr>
            </thead>
            <tbody>
              {allChanges.length > 0 ? (
                allChanges.map((change, idx) => {
                  const kind = classifyRow(change); // "free" | "discount" | "normal"
                  const cellBg =
                    kind === "free"
                      ? "bg-green-50"
                      : kind === "discount"
                      ? "bg-yellow-50"
                      : change.label?.includes('Variant') ? 'bg-blue-50' : "";
                  const cellStyle = kind === "free" ? { backgroundColor: "#ecfdf5" } : undefined; // fallback

                  // إذا كان السطر يمثل منتجاً، أعرض مواصفات الفيرينت أسفل الاسم
                  const labelName = cleanLabelToName(change.label || "");
                  const pidForLabel = nameToPid.get(labelName);
                  let varAttrsForLabel = labelName ? findVariantAttrsByLabelAndNewPrice(labelName, change.newValue) : null;
                  if (!varAttrsForLabel) {
                    varAttrsForLabel = pidForLabel
                      ? (computeUnifiedVariantAttrsForPid(pidForLabel) || findVariantAttrsForPid(pidForLabel))
                      : (labelName ? (computeUnifiedVariantAttrsForLabel(labelName) || findVariantAttrsForLabel(labelName)) : null);
                  }
                  if (!varAttrsForLabel && pidForLabel) {
                    const newPrice = parsePriceFromText(change.newValue);
                    varAttrsForLabel = inferVariantAttrsByPrice(pidForLabel, newPrice) || null;
                  }

                  return (
                    <tr
                      key={idx}
                      title={kind === "free" ? "بند مجاني" : kind === "discount" ? "بند مخفّض" : ""}
                    >
                      <td className={`p-2 border ${cellBg}`} style={cellStyle}>
                        {kind === "free" ? "" : kind === "discount" ? "🏷️ " : ""}
                        <div>
                          <div>{change.label}</div>
                          {varAttrsForLabel ? (
                            <div className="mt-1">{renderVariantInfo(varAttrsForLabel, "text-blue-700 text-[11px]", language as any)}</div>
                          ) : null}
                        </div>
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
