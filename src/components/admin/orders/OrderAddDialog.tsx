import React, { useEffect, useContext, useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Autocomplete from "../../ui/autocomplete";
import AddressSelector from "@/components/addresses/AddressSelector";
import { getNextOrderNumber } from "@/integrations/supabase/getNextOrderNumber";
import { isRTL as computeRTL } from "@/utils/languageContextUtils";
import type { NewOrderForm } from "@/orders/order.types";
import OrderDiscountSection from "./OrderDiscountSection";
import OrderDiscountSummary from "./OrderDiscountSummary";
import { LanguageContext } from '@/contexts/LanguageContext.context';
import { checkProductOfferEligibility, applyOfferToProduct, removeAppliedOffer, type OfferEligibility } from "@/utils/offerUtils";
import { getDisplayPrice } from "@/utils/priceUtils";
import { OfferService } from "@/services/offerService";

/* ===================== Helpers (مطابقة لصفحة التعديل) ===================== */

type FreeRef = { productId: string; quantity: number };

const qty = (n: any) => Math.max(0, Number(n || 0));

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
    const q = Number(r?.quantity || r?.qty || 1);
    if (pid) out.push({ productId: String(pid), quantity: q > 0 ? q : 1 });
  }
  const map = new Map<string, number>();
  for (const x of out) map.set(x.productId, (map.get(x.productId) || 0) + x.quantity);
  return Array.from(map.entries()).map(([productId, quantity]) => ({ productId, quantity }));
}

function productOf(products: any[], pid: string) {
  return products.find(p => String(p.id) === String(pid));
}

function basePrice(products: any[], pid: string, userType?: string) {
  const p = productOf(products, pid);
  return p ? getDisplayPrice(p, userType) : 0;
}

function lineKeySignature(it: any) {
  return [
    String(it.product_id || ""),
    !!it.is_free ? "free" : (!!it.offer_applied ? `disc:${it.offer_id || ""}` : "norm"),
    !!it.offer_trigger ? `trigger:${it.offer_trigger_id || ""}` : "no-trigger"
  ].join("|");
}

function mergeSimilarLines(items: any[]) {
  const map = new Map<string, any>();
  for (const it of items) {
    const key = lineKeySignature(it);
    const prev = map.get(key);
    if (!prev) { map.set(key, { ...it }); continue; }
    prev.quantity = qty(prev.quantity) + qty(it.quantity);
  }
  return Array.from(map.values()).filter(x => qty(x.quantity) > 0);
}

// يحوّل كميّة من نفس المنتج إلى "مجاني" حسب expectedQty
function ensureFreeQty(
  items: any[],
  products: any[],
  pid: string,
  expectedQty: number,
  offerInfo?: { id?: string; title?: string },
  userType?: string
) {
  let list = [...items];
  const freeIdx = list.findIndex(it => it.product_id === pid && (it as any).is_free);
  const currentFree = freeIdx !== -1 ? qty(list[freeIdx].quantity) : 0;

  const normalIndices = list
    .map((it, i) => ({ it, i }))
    .filter(({ it }) => it.product_id === pid && !(it as any).is_free && !(it as any).offer_applied);

  const delta = expectedQty - currentFree;

  if (delta > 0) {
    let toTake = delta;
    for (const { it, i } of normalIndices) {
      if (toTake <= 0) break;
      const take = Math.min(qty(it.quantity), toTake);
      if (take <= 0) continue;
      list[i] = { ...list[i], quantity: qty(list[i].quantity) - take };
      if (freeIdx !== -1) {
        list[freeIdx] = { ...list[freeIdx], quantity: qty(list[freeIdx].quantity) + take };
      } else {
        const p = productOf(products, pid);
        list.push({
          id: `free_${offerInfo?.id || "off"}_${pid}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          product_id: pid,
          quantity: take,
          product_name: p?.name_ar || p?.name_en || "",
          price: 0,
          is_free: true,
          original_price: basePrice(products, pid, userType),
          offer_id: offerInfo?.id,
          offer_name: offerInfo?.title,
        } as any);
      }
      toTake -= take;
    }
    if (toTake > 0) {
      const p = productOf(products, pid);
      list.push({
        id: `free_${offerInfo?.id || "off"}_${pid}_extra_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        product_id: pid,
        quantity: toTake,
        product_name: p?.name_ar || p?.name_en || "",
        price: 0,
        is_free: true,
        original_price: basePrice(products, pid, userType),
        offer_id: offerInfo?.id,
        offer_name: offerInfo?.title,
      } as any);
    }
  }

  if (delta < 0 && currentFree > 0) {
    let toReturn = -delta;
    if (freeIdx !== -1) {
      const giveBack = Math.min(currentFree, toReturn);
      list[freeIdx] = { ...list[freeIdx], quantity: currentFree - giveBack };
      toReturn -= giveBack;

      if (giveBack > 0) {
        const p = productOf(products, pid);
        const price = basePrice(products, pid, userType);
        const existPaid = list.findIndex(it => it.product_id === pid && !(it as any).is_free && !(it as any).offer_applied);
        if (existPaid !== -1) {
          list[existPaid] = { ...list[existPaid], quantity: qty(list[existPaid].quantity) + giveBack, price, original_price: price };
        } else {
          list.push({
            id: `paid_back_${pid}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            product_id: pid,
            quantity: giveBack,
            product_name: p?.name_ar || p?.name_en || "",
            price,
            original_price: price,
          } as any);
        }
      }
    }
  }

  list = list.filter(it => qty(it.quantity) > 0);
  list = mergeSimilarLines(list);
  return list;
}

// يضمن وجود خط "مخفَّض"
async function ensureDiscountedQty(
  items: any[],
  products: any[],
  pid: string,
  expectedQty: number,
  offer: any,
  userType?: string,
  forcedUnitPrice?: number
) {
  let list = [...items];

  const discountedIndices = list
    .map((it, i) => ({ it, i }))
    .filter(({ it }) => it.product_id === pid && (it as any).offer_applied && (it as any).offer_id === offer.id);

  const currentDiscounted = discountedIndices.reduce((s, { it }) => s + qty(it.quantity), 0);

  let normalIndices = list
    .map((it, i) => ({ it, i }))
    .filter(({ it }) => it.product_id === pid && !(it as any).is_free && (!(it as any).offer_applied || (it as any).offer_id !== offer.id));

  const original = basePrice(products, pid, userType);

  let discountedUnit = typeof forcedUnitPrice === "number" ? forcedUnitPrice : original;

  if (typeof forcedUnitPrice !== "number") {
    try {
      const temp = await applyOfferToProduct(
        offer,
        String(pid),
        [{ id: "tmp", product_id: pid, quantity: 1, price: original, original_price: original } as any],
        products,
        userType
      );
      const tmpLine = temp.find(x => x.product_id === pid);
      if (tmpLine && tmpLine.offer_applied && typeof tmpLine.price === "number") {
        discountedUnit = tmpLine.price;
      } else {
        throw new Error("fallback");
      }
    } catch {
      const dtypeRaw = String((offer as any).get_discount_type ?? (offer as any).discount_type ?? "").toLowerCase();
      let dval = Number((offer as any).get_discount_value ?? (offer as any).discount_value ?? 0);
      if (["percentage","percent","%"].includes(dtypeRaw)) {
        const perc = dval > 1 ? dval / 100 : dval;
        discountedUnit = Math.max(0, original * (1 - perc));
      } else if (["fixed","amount"].includes(dtypeRaw)) {
        discountedUnit = Math.max(0, original - dval);
      } else {
        discountedUnit = original;
      }
    }
  }

  const delta = expectedQty - currentDiscounted;

  if (delta > 0 && normalIndices.length > 0) {
    normalIndices = [...normalIndices].sort((a, b) => {
      const ap = Number(a.it.price) || original;
      const bp = Number(b.it.price) || original;
      const da = Math.abs(ap - discountedUnit);
      const db = Math.abs(bp - discountedUnit);
      return da - db;
    });
  }

  if (delta > 0) {
    let toTake = delta;
    for (const { it, i } of normalIndices) {
      if (toTake <= 0) break;
      const take = Math.min(qty(it.quantity), toTake);
      if (take <= 0) continue;
      const currentPrice = Number(it.price) || original;
      list[i] = { ...list[i], quantity: qty(list[i].quantity) - take, price: currentPrice, original_price: original };

      const idxDisc = list.findIndex(x => x.product_id === pid && (x as any).offer_applied && (x as any).offer_id === offer.id);
      if (idxDisc !== -1) {
        list[idxDisc] = { ...list[idxDisc], quantity: qty(list[idxDisc].quantity) + take, price: discountedUnit, original_price: original, offer_applied: true, offer_id: offer.id, offer_name: (offer.title_ar || offer.title_en || offer.name || offer.title || offer.code || 'عرض') };
      } else {
        list.push({
          id: `disc_${offer.id}_${pid}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          product_id: pid,
          quantity: take,
          price: discountedUnit,
          original_price: original,
          offer_applied: true,
          offer_id: offer.id,
          offer_name: (offer.title_ar || offer.title_en || offer.name || offer.title || offer.code || 'عرض'),
        } as any);
      }
      toTake -= take;
    }
  }

  if (delta < 0 && currentDiscounted > 0) {
    let toReturn = -delta;
    for (const { it, i } of discountedIndices) {
      if (toReturn <= 0) break;
      const canMove = Math.min(qty(it.quantity), toReturn);
      if (canMove <= 0) continue;
      list[i] = { ...list[i], quantity: qty(list[i].quantity) - canMove, price: discountedUnit, original_price: original, offer_applied: true, offer_id: offer.id, offer_name: (offer.title_ar || offer.title_en || offer.name || offer.title || offer.code || 'عرض') };

      const idxNorm = list.findIndex(x => x.product_id === pid && !(x as any).is_free && !(x as any).offer_applied);
      if (idxNorm !== -1) {
        const existingPrice = Number(list[idxNorm].price) || original;
        list[idxNorm] = { ...list[idxNorm], quantity: qty(list[idxNorm].quantity) + canMove, price: existingPrice, original_price: original };
      }
      toReturn -= canMove;
    }
  }

  list = list.filter(it => qty(it.quantity) > 0);
  list = mergeSimilarLines(list);
  return list;
}

async function reconcileAllOffersLive(
  items: any[],
  products: any[],
  userType?: string,
  options?: { autoApplySimpleDiscounts?: boolean }
) {
  let list = [...items];

  list = list.map(item => {
    if ((item as any).is_free) return item;
    const preserveExisting = (item as any).offer_applied && (options?.autoApplySimpleDiscounts === false || options?.autoApplySimpleDiscounts === undefined);
    if (preserveExisting) {
      const { offer_trigger, offer_trigger_id, ...rest } = item as any;
      return rest;
    }
    const { offer_trigger, offer_trigger_id, offer_name, offer_applied, offer_id, ...cleanItem } = item as any;
    return cleanItem;
  });

  const agg = new Map<string, number>();
  for (const it of list) {
    if ((it as any).is_free) continue;
    if (!it.product_id) continue;
    agg.set(String(it.product_id), (agg.get(String(it.product_id)) || 0) + qty(it.quantity));
  }
  const cart = Array.from(agg.entries())
    .map(([pid, q]) => {
      const p = productOf(products, pid);
      return p ? { id: `cart_${pid}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, product: p, quantity: q } : null;
    })
    .filter(Boolean) as any[];

  if (cart.length === 0) {
    return { items: mergeSimilarLines(list), appliedOffers: [], freeRefs: [], totalDiscount: 0 };
  }

  const result = await OfferService.applyOffers(cart, userType);
  const appliedOffers = result?.appliedOffers || [];
  const freeItems = result?.freeItems || [];
  const totalDiscount = Number(result?.totalDiscount || 0);

  const freeMap = new Map<string, number>();
  for (const f of freeItems) {
    const pid = String(f?.product?.id);
    if (!pid) continue;
    freeMap.set(pid, (freeMap.get(pid) || 0) + qty(f.quantity));
  }
  for (const [pid, q] of freeMap) {
    const off = appliedOffers.find((a: any) => (a?.offer?.get_product_id === pid) && ((a?.offer?.get_discount_type) === "free"))?.offer;
    list = ensureFreeQty(list, products, pid, q, { id: off?.id, title: off?.title_ar || off?.title_en }, userType);
  }
  for (const it of list.filter(x => (x as any).is_free)) {
    const pid = String(it.product_id);
    if (!freeMap.has(pid)) {
      list = ensureFreeQty(list, products, pid, 0, undefined, userType);
    }
  }

  for (const a of appliedOffers) {
    const off = a?.offer;
    if (!off || (off as any).offer_type !== "buy_get") continue;
    const getPid = (off as any).get_product_id;
    const dtype = (off as any).get_discount_type;
    const buyQty = Number((off as any).buy_quantity || 1);
    const triggerPid = (off as any).linked_product_id;
    if (!triggerPid || !buyQty || !getPid || dtype === "free") continue;

    const triggerQty = agg.get(String(triggerPid)) || 0;
    const times = Math.floor(triggerQty / buyQty);
    if (times <= 0) {
      list = await ensureDiscountedQty(list, products, String(getPid), 0, off, userType);
      continue;
    }

    const targetQtyAvailable = list
      .filter(x => x.product_id === getPid && !(x as any).is_free)
      .reduce((s, x) => s + qty(x.quantity), 0);

    const perTriggerQty = Number((off as any).get_discount_qty ?? 1);
    const expectedDiscQty = Math.min(times * perTriggerQty, targetQtyAvailable);

    let forcedUnitPrice: number | undefined;
    if (expectedDiscQty > 0 && Number(a?.discountAmount) > 0) {
      const originalUnit = basePrice(products, String(getPid), userType);
      const perUnitDisc = Number(a.discountAmount) / expectedDiscQty;
      forcedUnitPrice = Math.max(0, originalUnit - perUnitDisc);
    }

    list = await ensureDiscountedQty(
      list,
      products,
      String(getPid),
      expectedDiscQty,
      off,
      userType,
      forcedUnitPrice
    );
  }

  if (options?.autoApplySimpleDiscounts) {
    for (const a of appliedOffers) {
      const off = a?.offer;
      const t = (off as any)?.offer_type;
      if (t !== "discount" && t !== "product_discount") continue;
      const affected: string[] = Array.isArray(a?.affectedProducts) ? a.affectedProducts.map(String) : [];
      for (const pid of affected) {
        const totalQty = list
          .filter(x => x.product_id === pid && !(x as any).is_free)
          .reduce((s, x) => s + qty(x.quantity), 0);
        list = await ensureDiscountedQty(list, products, pid, totalQty, off, userType);
      }
    }
  }

  list = list.map(item => {
    const { offer_trigger, offer_trigger_id, offer_name, ...cleanItem } = item as any;
    return cleanItem;
  });

  for (const a of appliedOffers) {
    const off = a?.offer;
    if (!off || (off as any).offer_type !== "buy_get") continue;
    const triggerPid = (off as any).linked_product_id;
    const buyQty = Number((off as any).buy_quantity || 1);
    if (!triggerPid || !buyQty) continue;

    const triggerQty = agg.get(String(triggerPid)) || 0;
    const times = Math.floor(triggerQty / buyQty);

    if (times > 0) {
      list = list.map(item => {
        if (item.product_id === triggerPid && !(item as any).is_free && !(item as any).offer_applied) {
          return { ...item, offer_trigger: true, offer_trigger_id: off.id, offer_name: off.title_ar || off.title_en || "عرض" };
        }
        return item;
      });
    }
  }

  return { items: mergeSimilarLines(list), appliedOffers, freeRefs: normalizeFreeRefs(freeItems), totalDiscount };
}

// ملاحظة: لا حاجة لتطبيع اسم العرض هنا.
// سنحفظ applied_offers_obj بنفس شكل Checkout: المصفوفة الراجعة من OfferService.applyOffers
// والتي تحتوي على كائن offer الكامل (بما فيه title_ar/title_en).

/* ===================== Component ===================== */

interface OrderAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderForm: NewOrderForm;
  setOrderForm: React.Dispatch<React.SetStateAction<NewOrderForm>>;
  allowCustomClient: boolean;
  setAllowCustomClient: (v: boolean) => void;
  users: any[];
  products: any[];
  addOrderItem: () => void; // مُمرر من الأعلى (نبقيه للتوافق)
  removeOrderItem: (id: string) => void; // مُمرر
  updateOrderItem: (id: string, field: keyof any, value: any) => void; // مُمرر
  handleSelectUser: (userId: string) => void; // مُمرر
  isAddingOrder: boolean;
  handleAddOrder: (payload?: {
    items: any[];
    applied_offers: any[];
    free_items: any[];
    totalDiscount: number;
  }) => void; // يستدعى عند إضافة الطلب
  t: (key: string) => string;
}

const OrderAddDialog: React.FC<OrderAddDialogProps> = ({
  open,
  onOpenChange,
  orderForm,
  setOrderForm,
  allowCustomClient,
  setAllowCustomClient,
  users,
  products,
  addOrderItem,
  removeOrderItem,
  updateOrderItem,
  handleSelectUser,
  isAddingOrder,
  handleAddOrder,
  t,
}) => {
  const { language } = useContext(LanguageContext) ?? { language: 'ar' };
  const [offerEligibilities, setOfferEligibilities] = useState<Record<string, OfferEligibility>>({});
  const lastProcessedItemsRef = useRef<string>("");
  const [nextOrderNumber, setNextOrderNumber] = useState<number | null>(null);
  const isRTL = computeRTL(language);

  const getUserType = () => {
    const u = users?.find((x: any) => x.id === orderForm?.user_id);
    return u?.user_type || 'retail';
  };

  const canMergeLines = (a: any, b: any) => {
    return a.product_id === b.product_id
      && !!a.is_free === !!b.is_free
      && (!!a.offer_applied === !!b.offer_applied)
      && String(a.offer_id || "") === String(b.offer_id || "")
      && !!a.offer_trigger === !!b.offer_trigger
      && String(a.offer_trigger_id || "") === String(b.offer_trigger_id || "");
  };

  // تهيئة خصم الفورم (مرة واحدة)
  useEffect(() => {
    if (!open) return;
    setOrderForm(prev => ({
      ...prev,
      discountEnabled: prev.discountEnabled ?? false,
      discountType: prev.discountType || "amount",
      discountValue: prev.discountValue || 0,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // رقم الطلب التالي
  useEffect(() => {
    if (open) {
      getNextOrderNumber().then(setNextOrderNumber).catch(() => setNextOrderNumber(null));
    }
  }, [open]);

  // تحديث الأسعار حسب نوع المستخدم عند الفتح/تغيير المستخدم
  useEffect(() => {
    if (!orderForm || !open) return;
    const userType = getUserType();
    setOrderForm(prev => {
      const items = prev.items.map(item => {
        const p = productOf(products, item.product_id);
        if (!p) return item;
        const base = getDisplayPrice(p, userType);
        if ((item as any).offer_applied) {
          return { ...item, original_price: typeof (item as any).original_price === "number" ? (item as any).original_price : base };
        }
        if ((item as any).is_free) {
          return { ...item, price: 0, original_price: base };
        }
        const savedPrice = typeof item.price === 'number' ? item.price : base;
        return { ...item, price: savedPrice, original_price: base };
      });
      return { ...prev, items };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, orderForm?.user_id, allowCustomClient, products]);

  // فحص العروض المتاحة (زر الهدية)
  const checkOffersForItems = async () => {
    if (!orderForm?.items) return;
    const userType = getUserType();
    const newEligibilities: Record<string, OfferEligibility> = {};
    for (const item of orderForm.items) {
      if (item.product_id && item.quantity > 0 && !(item as any).is_free && !(item as any).offer_trigger) {
        try {
          const eligibility = await checkProductOfferEligibility(
            item.product_id,
            item.quantity,
            orderForm.items,
            userType
          );
          if (eligibility.isEligible && eligibility.canApply) {
            newEligibilities[item.product_id] = eligibility;
          }
        } catch (error) {
          console.error("Error checking offer for product:", item.product_id, error);
        }
      }
    }
    setOfferEligibilities(newEligibilities);
  };

  const handleApplyOffer = async (productId: string, eligibility: OfferEligibility) => {
    if (!orderForm || !eligibility.offer) return;
    try {
      const userType = getUserType();
      let updatedItems = await applyOfferToProduct(
        eligibility.offer,
        productId,
        orderForm.items,
        products,
        userType
      );
      const { items } = await reconcileAllOffersLive(updatedItems, products, userType, { autoApplySimpleDiscounts: false });
      setOrderForm(prev => ({ ...prev, items }));
      setOfferEligibilities(prev => { const u = { ...prev }; delete u[productId]; return u; });
    } catch (error) {
      console.error("Error applying offer:", error);
    }
  };

  const handleRemoveOffer = (offerId: string) => {
    const updatedItems = removeAppliedOffer(orderForm.items, offerId);
    setOrderForm(prev => ({ ...prev, items: updatedItems }));
  };

  const removeOrderItemLocal = useCallback(async (id: string) => {
    if (!orderForm) return;
    const items = orderForm.items.filter(item => item.id !== id);
    const userType = getUserType();
    try {
      const { items: reconciledItems } = await reconcileAllOffersLive(items, products, userType, { autoApplySimpleDiscounts: false });
      setOrderForm(f => ({ ...f, items: reconciledItems }));
    } catch (error) {
      console.error("Error reconciling offers after item removal:", error);
      setOrderForm(f => ({ ...f, items }));
    }
  }, [orderForm, products]);

  const removeOrderItemByIndex = useCallback(async (index: number) => {
    if (!orderForm) return;
    const items = orderForm.items.filter((_, i) => i !== index);
    const userType = getUserType();
    try {
      const { items: reconciledItems } = await reconcileAllOffersLive(items, products, userType, { autoApplySimpleDiscounts: false });
      setOrderForm(f => ({ ...f, items: reconciledItems }));
    } catch (error) {
      console.error("Error reconciling offers after item removal:", error);
      setOrderForm(f => ({ ...f, items }));
    }
  }, [orderForm, products]);

  // فحص/تصالح العروض عند تغيّر العناصر (ديناميكي)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!orderForm?.items || products.length === 0) return;
      const currentItemsKey = JSON.stringify(orderForm.items);
      if (lastProcessedItemsRef.current === currentItemsKey) return;
      const userType = getUserType();
      const { items } = await reconcileAllOffersLive(orderForm.items, products, userType, { autoApplySimpleDiscounts: false });
      const itemsChanged = JSON.stringify(items) !== JSON.stringify(orderForm.items);
      if (!cancelled && itemsChanged) {
        lastProcessedItemsRef.current = JSON.stringify(items);
        setOrderForm(prev => ({ ...prev, items }));
      }
      if (!itemsChanged) {
        lastProcessedItemsRef.current = currentItemsKey;
      }
      if (!cancelled) checkOffersForItems();
    };
    const t = setTimeout(run, 150);
  return () => { cancelled = true; clearTimeout(t); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderForm?.items, products]);

  // تطبيع العناصر قبل الإرسال للحفظ
  const normalizeItemsForSave = (items: any[]) => {
    const userType = getUserType();
    return items.map(it => {
      const basePriceForProduct = basePrice(products, it.product_id, userType);
      if ((it as any).is_free) {
        return { ...it, price: 0, is_free: true };
      }
      if ((it as any).offer_applied) {
        return { ...it, price: typeof it.price === 'number' ? it.price : basePriceForProduct } as any;
      }
      return { ...it, price: typeof it.price === 'number' ? it.price : basePriceForProduct } as any;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-0 sm:p-0">
        <DialogHeader className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b px-6 py-4 rounded-t-2xl">
          <DialogTitle className={`text-2xl font-bold mb-1 text-primary text-center ${isRTL ? "text-right" : "text-left"}`}>
            {t("addNewOrder") || "إضافة طلب جديد"}
            {nextOrderNumber && (
              <span className="ml-2 text-base text-gray-500">#{nextOrderNumber}</span>
            )}
          </DialogTitle>
          <p className={`text-gray-500 text-sm mt-1 ${isRTL ? "text-right" : "text-left"}`}>
            {t("fillAllRequiredFields") || "يرجى تعبئة جميع الحقول المطلوبة بعناية. جميع الحقول بعلامة * مطلوبة."}
          </p>
        </DialogHeader>

        {orderForm && (
          <form
            className="space-y-8 px-6 py-6"
            autoComplete="off"
            onSubmit={async e => {
              e.preventDefault();
              const userType = getUserType();
              const { items, appliedOffers, freeRefs, totalDiscount } = await reconcileAllOffersLive(orderForm.items, products, userType, { autoApplySimpleDiscounts: true });
              const normalizedItems = normalizeItemsForSave(items);

              // حدّث الـ form (للاستعراض) ومرّر النسخة الموثوقة مباشرة لـ handleAddOrder لتفادي سباق الحالة
              setOrderForm(f => ({
                ...f,
                items: normalizedItems,
                // نفس طريقة Checkout: خزّن المصفوفة كما هي من OfferService.applyOffers
                applied_offers_obj: Array.isArray(appliedOffers) ? appliedOffers : [],
                free_items_obj: freeRefs,
                offers_discount_total: totalDiscount,
                discountType: f.discountEnabled ? f.discountType : undefined,
                discountValue: f.discountEnabled ? f.discountValue : 0,
              } as any));

              handleAddOrder({
                items: normalizedItems,
                applied_offers: Array.isArray(appliedOffers) ? appliedOffers : [],
                free_items: freeRefs,
                totalDiscount,
              });
            }}
          >
            {/* اختيار العميل + طريقة الدفع */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="user_id" className="mb-2">
                  {t("customer") || "العميل"}
                </Label>
                <Select
                  value={allowCustomClient ? "" : (orderForm.user_id || "")}
                  onValueChange={value => {
                    if (value === "__custom__") {
                      setAllowCustomClient(true);
                      setOrderForm(prev => ({
                        ...prev,
                        user_id: "",
                        shipping_address: { ...prev.shipping_address, fullName: "", phone: "" },
                      }));
                    } else {
                      setAllowCustomClient(false);
                      handleSelectUser(value);
                    }
                  }}
                >
                  <SelectTrigger id="user_id" className="w-full">
                    <SelectValue placeholder={t("searchOrSelectCustomer") || "ابحث أو اختر العميل"} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id} className="truncate">
                        {user.full_name} <span className="text-xs text-gray-400">({user.email})</span>
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__" className="text-blue-600 font-bold">
                      {t("newCustomer") || "عميل جديد"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="payment_method">
                  {t("paymentMethod") || "طريقة الدفع"} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={orderForm.payment_method}
                  onValueChange={value => setOrderForm(f => ({ ...f, payment_method: value }))}
                >
                  <SelectTrigger id="payment_method" className="w-full">
                    <SelectValue placeholder={t("selectPaymentMethod") || "اختر طريقة الدفع"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{t("cash") || "نقداً"}</SelectItem>
                    <SelectItem value="card">{t("card") || "بطاقة ائتمان"}</SelectItem>
                    <SelectItem value="bank_transfer">{t("bankTransfer") || "تحويل بنكي"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* معلومات الشحن + AddressSelector */}
            <div className="bg-gray-50 rounded-xl p-4 border mt-2">
              <h3 className="text-lg font-semibold mb-4 text-primary">{t("shippingInfo") || "معلومات الشحن"}</h3>

              <AddressSelector
                value={{
                  id: orderForm.shipping_address.id || "",
                  full_name: orderForm.shipping_address.fullName || "",
                  phone: orderForm.shipping_address.phone || "",
                  city: orderForm.shipping_address.city || "",
                  area: orderForm.shipping_address.area || "",
                  street: orderForm.shipping_address.street || "",
                  building: orderForm.shipping_address.building || "",
                  floor: orderForm.shipping_address.floor || "",
                  apartment: orderForm.shipping_address.apartment || "",
                }}
                onChange={addr => setOrderForm(prev => ({
                  ...prev,
                  shipping_address: {
                    ...prev.shipping_address,
                    id: addr.id,
                    city: addr.city,
                    area: addr.area,
                    street: addr.street,
                    building: addr.building,
                    floor: addr.floor,
                    apartment: addr.apartment,
                  }
                }))}
                userId={allowCustomClient || !orderForm.user_id ? undefined : orderForm.user_id}
                disabled={allowCustomClient || !orderForm.user_id}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="full_name" className="mb-2">{t("fullName") || "الاسم الكامل"} <span className="text-red-500">*</span></Label>
                  <Input
                    id="full_name"
                    value={orderForm.shipping_address.fullName}
                    onChange={e => setOrderForm(prev => ({ ...prev, shipping_address: { ...prev.shipping_address, fullName: e.target.value } }))}
                    placeholder={t("enterFullName") || "أدخل الاسم الكامل"}
                    required
                    disabled={!allowCustomClient && !!orderForm.user_id}
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="mb-2">{t("phone") || "رقم الهاتف"} <span className="text-red-500">*</span></Label>
                  <Input
                    id="phone"
                    value={orderForm.shipping_address.phone}
                    onChange={e => setOrderForm(prev => ({ ...prev, shipping_address: { ...prev.shipping_address, phone: e.target.value } }))}
                    placeholder={t("enterPhoneNumber") || "أدخل رقم الهاتف"}
                    required
                    disabled={!allowCustomClient && !!orderForm.user_id}
                  />
                </div>
                <div>
                  <Label htmlFor="city" className="mb-2">{t("city") || "المدينة"}</Label>
                  <Input id="city" value={orderForm.shipping_address.city} onChange={e => setOrderForm(prev => ({ ...prev, shipping_address: { ...prev.shipping_address, city: e.target.value } }))} />
                </div>
                <div>
                  <Label htmlFor="area" className="mb-2">{t("area") || "المنطقة"}</Label>
                  <Input id="area" value={orderForm.shipping_address.area} onChange={e => setOrderForm(prev => ({ ...prev, shipping_address: { ...prev.shipping_address, area: e.target.value } }))} />
                </div>
                <div>
                  <Label htmlFor="street" className="mb-2">{t("street") || "الشارع"}</Label>
                  <Input id="street" value={orderForm.shipping_address.street} onChange={e => setOrderForm(prev => ({ ...prev, shipping_address: { ...prev.shipping_address, street: e.target.value } }))} />
                </div>
                <div>
                  <Label htmlFor="building" className="mb-2">{t("building") || "رقم المبنى"}</Label>
                  <Input id="building" value={orderForm.shipping_address.building} onChange={e => setOrderForm(prev => ({ ...prev, shipping_address: { ...prev.shipping_address, building: e.target.value } }))} />
                </div>
                <div>
                  <Label htmlFor="floor" className="mb-2">{t("floor") || "الطابق"}</Label>
                  <Input id="floor" value={orderForm.shipping_address.floor} onChange={e => setOrderForm(prev => ({ ...prev, shipping_address: { ...prev.shipping_address, floor: e.target.value } }))} />
                </div>
                <div>
                  <Label htmlFor="apartment" className="mb-2">{t("apartment") || "رقم الشقة"}</Label>
                  <Input id="apartment" value={orderForm.shipping_address.apartment} onChange={e => setOrderForm(prev => ({ ...prev, shipping_address: { ...prev.shipping_address, apartment: e.target.value } }))} />
                </div>
              </div>
            </div>

            {/* الخصم اليدوي */}
            <OrderDiscountSection
              discountEnabled={orderForm.discountEnabled}
              discountType={orderForm.discountType}
              discountValue={orderForm.discountValue}
              onDiscountEnabledChange={val => setOrderForm(f => ({ ...f, discountEnabled: val }))}
              onDiscountTypeChange={val => setOrderForm(f => ({ ...f, discountType: val }))}
              onDiscountValueChange={val => setOrderForm(f => ({ ...f, discountValue: val }))}
              t={t}
            />

            {/* المنتجات (مطابقة للتعديل) */}
            <div className="bg-gray-50 rounded-xl p-4 border mt-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-primary">{t("products") || "المنتجات"}</h3>
                <Button type="button" onClick={addOrderItem} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" /> {t("addProduct") || "إضافة منتج"}
                </Button>
              </div>

              <div className="space-y-3">
                {orderForm.items.map((item, index) => {
                  const isFree = (item as any).is_free;
                  const isDiscounted = (item as any).offer_applied && !isFree;
                  const nameInputClasses = isFree ? "bg-green-50 text-green-700 border-green-200 cursor-not-allowed" : isDiscounted ? "bg-yellow-50 text-yellow-700 border-yellow-200 cursor-not-allowed" : "";
                  const qtyPriceDisabled = isFree || isDiscounted;

                  return (
                    <div key={item.id} className={`p-4 border rounded-lg shadow-sm ${isFree ? 'bg-green-50 border-green-200' : isDiscounted ? 'bg-yellow-50 border-yellow-200' : 'bg-white'}`}>
                      <div className="mb-3">
                        <Label className="text-sm font-semibold">
                          {t("product") || "المنتج"} <span className="text-primary font-bold">{orderForm.items.length > 1 ? (index + 1) : null}</span> <span className="text-red-500">*</span>
                          {isFree && (<span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold mr-2">🎁 مجاني</span>)}
                          {!isFree && (item as any).offer_applied && (<span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-bold mr-2">% خصم مطبق</span>)}
                          {(item as any).offer_trigger && (<span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold mr-2">✅ حقق الشرط</span>)}
                        </Label>
                      </div>

                      <div className="flex flex-wrap items-end gap-3">
                        <div className="flex-1 min-w-[250px]">
                          {isFree || isDiscounted ? (
                            <Input
                              value={
                                products.find(p => p.id === item.product_id)?.[`name_${language}`] ||
                                products.find(p => p.id === item.product_id)?.name_ar ||
                                ""
                              }
                              disabled
                              className={nameInputClasses}
                              placeholder={isFree ? "منتج مجاني من عرض مطبق" : "منتج عليه خصم من عرض"}
                            />
                          ) : (
                            <Autocomplete
                              value={
                                products.find(p => p.id === item.product_id)?.[`name_${language}`] ||
                                products.find(p => p.id === item.product_id)?.name_ar ||
                                ""
                              }
                              onClear={() => {
                                updateOrderItem(item.id, "product_id", "");
                                updateOrderItem(item.id, "product_name", "");
                                updateOrderItem(item.id, "price", 0);
                                updateOrderItem(item.id, "quantity", 1);
                              }}
                              renderOption={(option) => {
                                const product = products.find(
                                  p => p[`name_${language}`] === option || p.name_ar === option || p.name_en === option || p.name_he === option
                                );
                                if (!product) return option;
                                const description = product[`description_${language}`] || product.description_ar || product.description_en || product.description_he;
                                return (
                                  <div className="py-1">
                                    <div className="font-semibold">{option}</div>
                                    {description && (<div className="text-sm text-gray-500 mt-1">{description}</div>)}
                                  </div>
                                );
                              }}
                              onInputChange={val => {
                                if (!val || val.trim() === "") return;
                                const matched = products.find(
                                  p => p[`name_${language}`] === val || p.name_ar === val || p.name_en === val || p.name_he === val
                                );
                                setOrderForm(f => {
                                  const userType = getUserType();
                                  const priceBase = matched ? getDisplayPrice(matched, userType) : 0;
                                  const existingIndex = f.items.findIndex((itm, idx) => idx !== index && itm.product_id === matched?.id && canMergeLines(itm, f.items[index]));
                                  if (existingIndex !== -1) {
                                    const updated = f.items.map((itm, idx) => idx === existingIndex ? { ...itm, quantity: qty(itm.quantity) + 1 } : itm).filter((_, idx) => idx !== index);
                                    return { ...f, items: updated };
                                  }
                                  const updatedItems = f.items.map((itm, idx) => idx === index ? {
                                    ...itm,
                                    product_id: matched ? matched.id : "",
                                    product_name: val,
                                    price: matched ? priceBase : 0,
                                    original_price: matched ? priceBase : 0,
                                    offer_applied: undefined,
                                    offer_id: undefined,
                                    offer_name: undefined,
                                    offer_trigger: undefined,
                                    offer_trigger_id: undefined,
                                  } : itm);
                                  return { ...f, items: updatedItems };
                                });
                              }}
                              options={products.map(p => p[`name_${language}`] || p.name_ar || p.id)}
                              placeholder={t("searchOrSelectProduct") || "ابحث أو اكتب اسم المنتج"}
                              required
                            />
                          )}
                        </div>
                        <div className="w-24">
                          <Label className="text-xs text-gray-600 mb-1 block">{t("quantity") || "الكمية"} <span className="text-red-500">*</span></Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity === 0 ? "" : item.quantity}
                            onChange={async (e) => {
                              const val = e.target.value === "" ? 0 : parseInt(e.target.value) || 1;
                              const updatedItems = orderForm.items.map((itm, idx) => idx === index ? { ...itm, quantity: val } : itm);
                              const userType = getUserType();
                              try {
                                const { items: reconciledItems } = await reconcileAllOffersLive(updatedItems, products, userType, { autoApplySimpleDiscounts: false });
                                setOrderForm(f => ({ ...f, items: reconciledItems }));
                              } catch (error) {
                                console.error("Error reconciling offers after quantity change:", error);
                                setOrderForm(f => ({ ...f, items: updatedItems }));
                              }
                            }}
                            required
                            disabled={qtyPriceDisabled}
                            className={isFree ? "bg-green-50 text-green-700" : isDiscounted ? "bg-yellow-50 text-yellow-700" : ""}
                          />
                        </div>
                        <div className="w-28">
                          <Label className="text-xs text-gray-600 mb-1 block">
                            {t("price") || "السعر"} <span className="text-red-500">*</span>
                            {isFree && <span className="text-green-600 font-bold ml-1">مجاني</span>}
                            {((item as any).offer_applied || isFree) && (typeof (item as any).original_price === "number" && ((item as any).original_price > (item.price ?? 0))) && (
                              <span className="text-xs text-gray-500 line-through">{(item as any).original_price} ₪</span>
                            )}
                          </Label>
                          <div className="flex flex-col gap-1">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.price === 0 ? 0 : item.price && item.price >= 0 ? item.price : 0}
                              onChange={e => setOrderForm(f => {
                                const val = e.target.value === "" ? 0 : parseFloat(e.target.value) || 0;
                                const updatedItems = f.items.map((itm, idx) => idx === index ? { ...itm, price: val } : itm);
                                return { ...f, items: updatedItems };
                              })}
                              required
                              disabled={qtyPriceDisabled}
                              className={isFree ? "bg-green-50 text-green-700" : isDiscounted ? "bg-yellow-50 text-yellow-700" : ""}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {!isFree && (
                            <Button
                              type="button"
                              onClick={async () => { if (isFree) { if (window.confirm("هذا منتج مجاني من عرض مطبق. هل أنت متأكد من حذفه؟")) { await removeOrderItemByIndex(index); } } else { await removeOrderItemLocal(item.id); removeOrderItem(item.id); } }}
                              variant={"destructive"}
                              size="sm"
                              className="h-10"
                              title={isFree ? "منتج مجاني من عرض مطبق" : "حذف المنتج"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}

                          {item.product_id && offerEligibilities[item.product_id] && !isFree && !(item as any).offer_trigger && (
                            <Button
                              type="button"
                              onClick={() => handleApplyOffer(item.product_id, offerEligibilities[item.product_id])}
                              variant="outline"
                              size="sm"
                              className="h-10 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                              title={offerEligibilities[item.product_id].message}
                            >
                              <Gift className="h-4 w-4" />
                            </Button>
                          )}

                          {(item as any).offer_applied && (item as any).offer_id && (
                            <Button
                              type="button"
                              onClick={() => handleRemoveOffer((item as any).offer_id)}
                              variant="outline"
                              size="sm"
                              className="h-10 bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                              title="إزالة العرض المطبق"
                            >
                              <span className="text-xs">✕</span>
                            </Button>
                          )}
                        </div>
                      </div>

                      {(item as any).offer_applied && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                          <span className="text-blue-700 font-medium">🎉 عرض مطبق: {(item as any).offer_name || "عرض"}</span>
                          {typeof (item as any).original_price === "number" && (
                            <span className="block text-gray-600 text-xs mt-1 line-through">السعر الأصلي: {(item as any).original_price} ₪</span>
                          )}
                        </div>
                      )}

                      {(item as any).offer_trigger && (item as any).offer_trigger_id && (
                        <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-sm">
                          <span className="text-emerald-700 font-medium">✅ هذا المنتج حقق العرض :"{(item as any).offer_name || "عرض"}"</span>
                        </div>
                      )}

                      {item.product_id && offerEligibilities[item.product_id] && !isFree && !(item as any).offer_trigger && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                          <span className="text-green-700 font-medium">🎁 {offerEligibilities[item.product_id].message}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* المجموع الكلي - نفس طريقة صفحة التعديل */}
              {orderForm.items.length > 0 && (
                <div className="text-right mt-3 space-y-2">
                  {(() => {
                    const userType = getUserType();
                    const subtotalBeforeDiscounts = orderForm.items
                      .filter((it: any) => !it.is_free)
                      .reduce((sum, it: any) => sum + (basePrice(products, it.product_id, userType) * (it.quantity || 0)), 0);

                    const itemDiscounts = orderForm.items
                      .filter((it: any) => it.offer_applied && typeof it.original_price === 'number')
                      .reduce((sum, it: any) => {
                        const perUnit = Math.max(0, ((it.original_price as number) - (it.price || 0)));
                        return sum + perUnit * (it.quantity || 0);
                      }, 0);

                    const grandTotal = subtotalBeforeDiscounts - itemDiscounts;

                    return (
                      <div className="border rounded-lg p-3 bg-gray-50">
                        <p className="text-sm text-gray-600">{t("subtotal") || "المجموع الفرعي"}: {subtotalBeforeDiscounts} ₪</p>
                        {itemDiscounts > 0 && (
                          <p className="text-sm text-green-600">{t("itemsDiscount") || "خصم المنتجات المخفضة"}: -{itemDiscounts} ₪</p>
                        )}
                        <div className="border-t pt-2 mt-2">
                          <p className="text-lg font-semibold">{t("total") || "المجموع الكلي"}: {grandTotal} ₪</p>
                        </div>
                      </div>
                    );
                  })()}

                  <OrderDiscountSummary
                    discountEnabled={orderForm.discountEnabled}
                    discountType={orderForm.discountType}
                    discountValue={orderForm.discountValue}
                    items={orderForm.items}
                    t={t}
                  />
                </div>
              )}
            </div>

            {/* ملاحظات + منشئ الطلب */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="notes" className="mb-2">{t("notes") || "ملاحظات"}</Label>
                <Textarea id="notes" value={orderForm.notes} onChange={e => setOrderForm(prev => ({ ...prev, notes: e.target.value }))} placeholder={t("orderNotesPlaceholder") || "أدخل ملاحظات إضافية (اختياري)"} />
              </div>
              <div className="flex flex-col gap-2 mt-2">
                <Label className="mb-2">{t("orderCreator") || "منشئ الطلبية"}</Label>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">{t("admin") || "أدمن"}</Badge>
                  <span className="text-xs text-gray-500">{t("orderCreatedFromAdminPanel") || "سيتم تمييز هذه الطلبية أنها أُنشئت من لوحة التحكم"}</span>
                </div>
              </div>
            </div>

            {/* أزرار الحفظ */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isAddingOrder}>
                {t("cancel") || "إلغاء"}
              </Button>
              <Button type="submit" className="bg-primary text-white font-bold" disabled={isAddingOrder}>
                {isAddingOrder ? (t("adding") || "جاري الإضافة…") : (t("addOrder") || "إضافة الطلب")}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderAddDialog;
