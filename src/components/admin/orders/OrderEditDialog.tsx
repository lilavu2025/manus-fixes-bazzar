// OrderEditDialog.tsx
import React, { useEffect, useContext, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Autocomplete from "../../ui/autocomplete";
import type { NewOrderForm, OrderItem } from "@/orders/order.types";
import OrderDiscountSection from "./OrderDiscountSection";
import OrderDiscountSummary from "./OrderDiscountSummary";
import { LanguageContext } from '@/contexts/LanguageContext.context';
import { checkProductOfferEligibility, applyOfferToProduct, removeAppliedOffer, type OfferEligibility } from "@/utils/offerUtils";
import { getDisplayPrice } from "@/utils/priceUtils";
import { OfferService, type Offer } from "@/services/offerService";

/* ===== Helpers: JSON & Free Refs canonicals ===== */

type FreeRef = { productId: string; quantity: number };

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
  // dedupe keep max qty
  const map = new Map<string, number>();
  for (const x of out) map.set(x.productId, Math.max(map.get(x.productId) || 0, x.quantity));
  return Array.from(map.entries()).map(([productId, quantity]) => ({ productId, quantity }));
}

function freeFromAppliedOffers(rawApplied: any): FreeRef[] {
  const applied = normalizeJson(rawApplied);
  const list = Array.isArray(applied)
    ? applied.flatMap((a: any) => Array.isArray(a?.freeProducts) ? a.freeProducts : [])
    : [];
  return normalizeFreeRefs(list);
}

/* ===== Offers summary (returns canonical free_items) ===== */

function summarizeOffersForOrder(items: OrderItem[], products: any[], userType?: string) {
  const appliedMap: Record<string, {
    offer: any;
    discountAmount: number;
    affectedProducts: string[];
    freeProducts: { productId: string; quantity: number }[];
  }> = {};
  const freeRefs: FreeRef[] = [];

  items.forEach((it: any) => {
    const offerId = it.offer_id;
    const offerName = it.offer_name;
    if (!offerId && !it.is_free && !it.offer_applied) return;

    const typeGuess = it.is_free ? "buy_get" : (it.offer_applied ? "discount" : "discount");

    if (offerId && !appliedMap[offerId]) {
      appliedMap[offerId] = {
        offer: { id: offerId, title_ar: offerName, title_en: offerName, offer_type: typeGuess },
        discountAmount: 0,
        affectedProducts: [],
        freeProducts: [],
      };
    }

    if (it.is_free) {
      const qty = Number(it.quantity || 1);
      const pid = String(it.product_id);
      freeRefs.push({ productId: pid, quantity: qty > 0 ? qty : 1 });
      if (offerId) {
        appliedMap[offerId].freeProducts.push({ productId: pid, quantity: qty > 0 ? qty : 1 });
      }
    }

    if (offerId && it.offer_applied && typeof it.original_price === "number") {
      const perUnitDiscount = Math.max(0, it.original_price - (it.price ?? 0));
      appliedMap[offerId].discountAmount += perUnitDiscount * (it.quantity || 0);
      const pid = String(it.product_id || "");
      if (pid && !appliedMap[offerId].affectedProducts.includes(pid)) {
        appliedMap[offerId].affectedProducts.push(pid);
      }
    }
  });

  // dedupe freeRefs (max qty)
  const map = new Map<string, number>();
  for (const f of freeRefs) map.set(f.productId, Math.max(map.get(f.productId) || 0, f.quantity));
  const free_items = Array.from(map.entries()).map(([productId, quantity]) => ({ productId, quantity }));

  const applied_offers = Object.values(appliedMap);
  return { applied_offers, free_items };
}

/* ===== Changes builder: fix "old free qty = 0" by reading prev free from order ===== */

function buildChangesForConfirm(originalOrder: any, edited: NewOrderForm, products: any[], userType?: string) {
  const changes: { label: string; oldValue: string; newValue: string }[] = [];

  const basePrice = (pid: string) => {
    const prod = products.find((p: any) => p.id === pid);
    return prod ? getDisplayPrice(prod, userType) : 0;
  };

  // prev quantities/prices from original items
  const oldByPid: Record<string, { qty: number; price: number }> = {};
  (originalOrder?.items || []).forEach((it: any) => {
    const pid = String(it.product_id);
    const isFree = !!it?.is_free || Number(it?.price) === 0;
    oldByPid[pid] = {
      qty: (oldByPid[pid]?.qty || 0) + (Number(it.quantity || 0)),
      price: isFree ? 0 : (typeof it.price === "number" ? it.price : basePrice(pid)),
    };
  });

  // also previous free refs from free_items / applied_offers
  const prevFreeA = normalizeFreeRefs(originalOrder?.free_items);
  const prevFreeB = freeFromAppliedOffers(originalOrder?.applied_offers);
  const prevFreeMerged: FreeRef[] = (() => {
    const m = new Map<string, number>();
    [...prevFreeA, ...prevFreeB].forEach(({ productId, quantity }) => {
      m.set(productId, Math.max(m.get(productId) || 0, quantity));
    });
    return Array.from(m.entries()).map(([productId, quantity]) => ({ productId, quantity }));
  })();

  for (const f of prevFreeMerged) {
    if (!oldByPid[f.productId]) {
      oldByPid[f.productId] = { qty: f.quantity, price: 0 };
    } else {
      oldByPid[f.productId].qty = Math.max(oldByPid[f.productId].qty, f.quantity);
      oldByPid[f.productId].price = 0;
    }
  }

  edited.items.forEach((it: any) => {
    const pid = String(it.product_id);
    const old = oldByPid[pid];
    const name =
      products.find((p: any) => String(p.id) === pid)?.name_ar ||
      it.product_name ||
      pid;

    const newQty = it.quantity || 0;
    const newPriceForDisplay = it.is_free
      ? 0
      : (typeof it.price === "number" ? it.price : basePrice(pid));

    const oldQty = old?.qty ?? 0;
    const oldPriceForDisplay = old?.price ?? basePrice(pid);

    // 🎁 لو بند مجاني، خلي الملصق واضح في النص نفسه
    const prefix = it.is_free || oldPriceForDisplay === 0 || newPriceForDisplay === 0 ? "🎁 " : "";

    const oldStr = `${prefix}الكمية: ${oldQty}, السعر: ${oldPriceForDisplay}`;
    const newStr = `${prefix}الكمية: ${newQty}, السعر: ${newPriceForDisplay}`;

    if (oldStr !== newStr) {
      changes.push({
        label: name,
        oldValue: oldStr,
        newValue: newStr,
      });
    }
  });

  return changes;
}

/* ===== Build offers like Checkout (single source of truth) ===== */

async function computeOffersLikeCheckout(
  items: any[],
  products: any[],
  userType?: string
): Promise<{ appliedOffers: any[]; freeRefs: FreeRef[]; totalDiscount: number }> {
  // cart-like shape for OfferService.applyOffers
  const cartItemsForOffers = items
    .filter((it: any) => it.product_id && !it.is_free && (it.quantity || 0) > 0)
    .map((it: any) => {
      const p = products.find((x: any) => x.id === it.product_id);
      return p ? { id: `cart_${p.id}`, product: p, quantity: Number(it.quantity || 0) } : null;
    })
    .filter(Boolean) as any[];

  if (cartItemsForOffers.length === 0) {
    return { appliedOffers: [], freeRefs: [], totalDiscount: 0 };
  }

  const result = await OfferService.applyOffers(cartItemsForOffers, userType);
  const appliedOffers = result?.appliedOffers || [];
  const freeItems = result?.freeItems || [];

  const freeRefs: FreeRef[] = [];
  for (const f of freeItems) {
    const pid = f?.product?.id;
    const qty = Number(f?.quantity || 1);
    if (pid) freeRefs.push({ productId: String(pid), quantity: qty > 0 ? qty : 1 });
  }
  // dedupe max qty
  const map = new Map<string, number>();
  for (const fr of freeRefs) map.set(fr.productId, Math.max(map.get(fr.productId) || 0, fr.quantity));

  return {
    appliedOffers,
    freeRefs: Array.from(map.entries()).map(([productId, quantity]) => ({ productId, quantity })),
    totalDiscount: Number(result?.totalDiscount || 0),
  };
}

/* ===== Component ===== */

interface OrderEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editOrderForm: NewOrderForm | null;
  setEditOrderForm: React.Dispatch<React.SetStateAction<NewOrderForm | null>>;
  originalOrderForEdit: any;
  setEditOrderChanges: (changes: any[]) => void;
  setShowConfirmEditDialog: (open: boolean) => void;
  getOrderEditChangesDetailed: (original: any, edited: any) => any[];
  t: (key: string) => string;
  isRTL: boolean;
  products: any[];
}

const OrderEditDialog: React.FC<OrderEditDialogProps> = ({
  open,
  onOpenChange,
  editOrderForm,
  setEditOrderForm,
  originalOrderForEdit,
  setEditOrderChanges,
  setShowConfirmEditDialog,
  getOrderEditChangesDetailed,
  t,
  isRTL,
  products,
}) => {
  const { language } = useContext(LanguageContext) ?? { language: 'ar' };
  const [offerEligibilities, setOfferEligibilities] = useState<Record<string, OfferEligibility>>({});
  const autoAppliedOffersRef = useRef<Set<string>>(new Set());
  const offersCacheRef = useRef<Record<string, Offer[]>>({});

  function isOfferAlreadyAppliedForProduct(items: any[], eligibility: OfferEligibility) {
    const offerId = eligibility.offer?.id;
    if (!offerId) return false;

    const hasFree = items.some(it =>
      (it as any).is_free && (it as any).offer_id === offerId
    );
    const hasDiscountApplied = items.some(it =>
      (it as any).offer_applied && (it as any).offer_id === offerId
    );

    const getPid = (eligibility.offer as any)?.get_product_id;
    const targetAlreadyGranted = getPid && items.some(it =>
      it.product_id === getPid && ( (it as any).is_free || (it as any).offer_applied )
    );

    const autoApplied = autoAppliedOffersRef.current.has(offerId);
    return !!(hasFree || hasDiscountApplied || targetAlreadyGranted || autoApplied);
  }

  // ==== فحص العروض المتاحة =====
  const checkOffersForItems = async () => {
    if (!editOrderForm?.items) return;

    const userType = originalOrderForEdit?.profiles?.user_type || 'retail';
    const newEligibilities: Record<string, OfferEligibility> = {};

    for (const item of editOrderForm.items) {
      if (item.product_id && item.quantity > 0 && !(item as any).is_free) {
        try {
          const eligibility = await checkProductOfferEligibility(
            item.product_id,
            item.quantity,
            editOrderForm.items,
            userType
          );

          if (eligibility.isEligible && eligibility.canApply) {
            if (!isOfferAlreadyAppliedForProduct(editOrderForm.items, eligibility)) {
              newEligibilities[item.product_id] = eligibility;
            }
          }
        } catch (error) {
          console.error("Error checking offer for product:", item.product_id, error);
        }
      }
    }

    setOfferEligibilities(newEligibilities);
  };

  // cache offers per pid
  const getOffersFor = async (pid: string) => {
    if (!offersCacheRef.current[pid]) {
      offersCacheRef.current[pid] = await OfferService.getOffersForProduct(pid);
    }
    return offersCacheRef.current[pid];
  };

  // ==== تصالح العروض تلقائياً عند تغيّر الكميات ====
  const reconcileOffers = async () => {
    if (!editOrderForm?.items) return;
    const userType = originalOrderForEdit?.profiles?.user_type || 'retail';

    let items = [...editOrderForm.items];
    let changed = false;

    for (const line of items) {
      if (!line.product_id || (line as any).is_free) continue;

      const offers = await getOffersFor(line.product_id);
      if (!offers.length) continue;

      for (const offer of offers) {
        if (offer.offer_type !== "buy_get") continue;

        const linkedProductId = (offer as any).linked_product_id;
        if (linkedProductId !== line.product_id) continue;

        const buyQuantity = (offer as any).buy_quantity || 1;
        const getProductId = (offer as any).get_product_id;
        const getDiscountType = (offer as any).get_discount_type || "free";
        const getDiscountValue = (offer as any).get_discount_value || 0;

        const qty = line.quantity || 0;
        const applicableTimes = Math.floor(qty / buyQuantity);

        // تحديث وسم trigger للعنصر
        const lineIdx = items.findIndex(it => it.id === line.id);
        if (lineIdx !== -1) {
          const hadTrigger = !!(items[lineIdx] as any).offer_trigger;
          const shouldTrigger = applicableTimes > 0;
          if (hadTrigger !== shouldTrigger) changed = true;
          items[lineIdx] = {
            ...(items[lineIdx] as any),
            offer_trigger: shouldTrigger || undefined,
            offer_trigger_id: shouldTrigger ? offer.id : undefined,
            offer_id: shouldTrigger ? ((items[lineIdx] as any).offer_id ?? offer.id) : undefined,
            offer_name: shouldTrigger ? ((items[lineIdx] as any).offer_name ?? (offer.title_ar || offer.title_en)) : undefined,
          } as any;
        }

        // FREE: حدّث/ازل المنتج المجاني
        if (getDiscountType === "free") {
          const freeIndex = items.findIndex(it => it.product_id === getProductId && (it as any).is_free);
          if (applicableTimes <= 0) {
            if (freeIndex !== -1) {
              items.splice(freeIndex, 1);
              changed = true;
            }
          } else {
            if (freeIndex !== -1) {
              const cur = items[freeIndex];
              if (cur.quantity !== applicableTimes) {
                items[freeIndex] = { ...cur, quantity: applicableTimes } as any;
                changed = true;
              }
            } else {
              const freeProduct = products.find(p => p.id === getProductId);
              if (freeProduct) {
                const originalPrice = getDisplayPrice(freeProduct as any, userType);
                items.push({
                  id: `free_${offer.id}_${getProductId}`,
                  product_id: getProductId,
                  quantity: applicableTimes,
                  price: 0,
                  product_name: freeProduct.name_ar || freeProduct.name_en || "",
                  is_free: true,
                  original_price: originalPrice,
                  offer_id: offer.id,
                  offer_name: offer.title_ar || offer.title_en,
                } as any);
                changed = true;
              }
            }
          }
        } else {
          // خصم على منتج الهدف
          const targetIdx = items.findIndex(it => it.product_id === getProductId && !(it as any).is_free);
          const targetProduct = products.find(p => p.id === getProductId);
          const originalPrice = targetProduct ? getDisplayPrice(targetProduct as any, userType) : 0;

          if (applicableTimes <= 0) {
            // الشرط سقط: شيل الخصم إن وجد
            if (targetIdx !== -1 && (items[targetIdx] as any).offer_applied && (items[targetIdx] as any).offer_id === offer.id) {
              const original = (items[targetIdx] as any).original_price ?? originalPrice;
              items[targetIdx] = {
                ...items[targetIdx],
                price: original,
                original_price: undefined,
                offer_applied: undefined,
                offer_id: undefined,
                offer_name: undefined,
              } as any;
              changed = true;
            }
          } else {
            // الشرط محقق: طبّق الخصم لو موجود المنتج الهدف
            if (targetIdx !== -1) {
              let discountedPrice = originalPrice;
              if (getDiscountType === "percentage") {
                discountedPrice = Math.max(0, originalPrice * (1 - getDiscountValue / 100));
              } else if (getDiscountType === "fixed") {
                discountedPrice = Math.max(0, originalPrice - getDiscountValue);
              }
              const tgt = items[targetIdx] as any;
              if (!tgt.offer_applied || tgt.price !== discountedPrice || tgt.offer_id !== offer.id) {
                items[targetIdx] = {
                  ...items[targetIdx],
                  price: discountedPrice,
                  original_price: tgt.original_price ?? originalPrice,
                  offer_applied: true,
                  offer_id: offer.id,
                  offer_name: offer.title_ar || offer.title_en,
                } as any;
                changed = true;
              }
            }
          }
        }
      }
    }

    if (changed) {
      setEditOrderForm(prev => prev ? { ...prev, items } : prev);
    }
  };

  const handleApplyOffer = async (productId: string, eligibility: OfferEligibility) => {
    if (!editOrderForm || !eligibility.offer) return;
    try {
      const userType = originalOrderForEdit?.profiles?.user_type || 'retail';
      const updatedItems = await applyOfferToProduct(
        eligibility.offer,
        productId,
        editOrderForm.items,
        products,
        userType
      );
      autoAppliedOffersRef.current.add(eligibility.offer.id);
      setEditOrderForm(prev => prev ? { ...prev, items: updatedItems } : prev);
      setOfferEligibilities(prev => {
        const updated = { ...prev };
        delete updated[productId];
        return updated;
      });
    } catch (error) {
      console.error("Error applying offer:", error);
    }
  };

  // إزالة العرض المطبق
  const handleRemoveOffer = (offerId: string) => {
    if (!editOrderForm) return;
    autoAppliedOffersRef.current.delete(offerId);
    const updatedItems = removeAppliedOffer(editOrderForm.items, offerId);
    const selectedUser = originalOrderForEdit?.profiles;
    const userType = (selectedUser && selectedUser.user_type) ? selectedUser.user_type : 'retail';
    const itemsWithCorrectPrices = updatedItems.map(item => {
      if ((item as any).is_free || (item as any).offer_applied) return item;
      const matched = products.find(p => p.id === item.product_id);
      if (!matched) return item;
      const base = getDisplayPrice(matched, userType);
      return { ...item, price: base, original_price: base };
    });
    setEditOrderForm(prev => prev ? { ...prev, items: itemsWithCorrectPrices } : prev);
  };

  // حذف صنف
  function removeOrderItem(id: string) {
    setEditOrderForm(f => {
      if (!f) return f;
      return { ...f, items: f.items.filter(item => item.id !== id) };
    });
  }
  function removeOrderItemByIndex(index: number) {
    setEditOrderForm(f => {
      if (!f) return f;
      return { ...f, items: f.items.filter((_, i) => i !== index) };
    });
  }

  // تحديث أسعار عند الفتح/نوع المستخدم
  useEffect(() => {
    if (!editOrderForm || !open) return;
    const selectedUser = originalOrderForEdit?.profiles;
    const userType = (selectedUser && selectedUser.user_type) ? selectedUser.user_type : 'retail';

    setEditOrderForm(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map(item => {
          if ((item as any).is_free) return item;
          const matched = products.find(p => p.id === item.product_id);
          if (!matched) return item;
          const base = getDisplayPrice(matched, userType);
          if ((item as any).offer_applied && typeof item.price === 'number') {
            if (typeof (item as any).original_price !== 'number') {
              return { ...item, original_price: base };
            }
            return item;
          }
          return { ...item, price: base, original_price: base };
        })
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, originalOrderForEdit?.profiles?.user_type, products]);

  // sync خصم يدوي من الطلب الأصلي
  useEffect(() => {
    if (!open || !originalOrderForEdit) return;
    setEditOrderForm(f => {
      if (!f) return f;
      const hasDiscount = !!originalOrderForEdit.discount_type && originalOrderForEdit.discount_value > 0;
      return {
        ...f,
        discountEnabled: hasDiscount,
        discountType: hasDiscount ? originalOrderForEdit.discount_type : "amount",
        discountValue: hasDiscount ? originalOrderForEdit.discount_value : 0,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, originalOrderForEdit]);

  // فحص/تصالح العروض عند تغيّر العناصر
  useEffect(() => {
    if (editOrderForm?.items && products.length > 0) {
      const timeoutId = setTimeout(() => {
        checkOffersForItems();
        reconcileOffers();
      }, 200);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editOrderForm?.items, products]);

  // تطبيق تلقائي للعروض لما الأهلية تتولّد
  useEffect(() => {
    if (!editOrderForm?.items) return;
    const entries = Object.entries(offerEligibilities);
    if (entries.length === 0) return;
    for (const [productId, eligibility] of entries) {
      if (!eligibility?.offer) continue;
      if (isOfferAlreadyAppliedForProduct(editOrderForm.items, eligibility)) continue;
      handleApplyOffer(productId, eligibility);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offerEligibilities]);

  // تطبيع العناصر قبل الحفظ (للتوافق مع Checkout: نحفظ سعر الأساس للبنود المخفضة)
  const normalizeItemsForSave = (items: any[]) => {
    return items.map(it => {
      if ((it as any).is_free) {
        return {
          ...it,
          price: 0,
          is_free: true,
          offer_id: (it as any).offer_id,
          offer_name: (it as any).offer_name,
          original_price: (it as any).original_price,
        };
      }
      if ((it as any).offer_applied) {
        const base = typeof (it as any).original_price === 'number' ? (it as any).original_price : it.price;
        return {
          ...it,
          // نخزّن بسعر الأساس
          price: base,
          offer_applied: true,
          offer_id: (it as any).offer_id,
          offer_name: (it as any).offer_name,
          original_price: (it as any).original_price ?? it.price,
        };
      }
      return {
        ...it,
        is_free: undefined,
        offer_applied: undefined,
        offer_id: undefined,
        offer_name: undefined,
        original_price: undefined,
        offer_trigger: undefined,
        offer_trigger_id: undefined,
      };
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-0 sm:p-0">
        <DialogHeader className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b px-6 py-4 rounded-t-2xl">
          <DialogTitle className="text-2xl font-bold mb-1 text-primary text-center">
            {t("editOrder") || "تعديل الطلبية"}
          </DialogTitle>
          <p className={`text-gray-500 text-sm mt-1 ${isRTL ? "text-right" : "text-left"}`}>
            <span className="text-xs font-bold text-gray-700 print:text-black">
              {t("orderNumber") || "رقم الطلب"}: <span className="font-bold">{originalOrderForEdit?.order_number}</span>
            </span>
          </p>
        </DialogHeader>
        {editOrderForm && (
          <form
            className="space-y-8 px-6 py-6"
            autoComplete="off"
            onSubmit={async e => {
              e.preventDefault();

              const userType = originalOrderForEdit?.profiles?.user_type || 'retail';

              // 1) احسب العروض بنفس منطق الشيك أوت
              const { appliedOffers, freeRefs, totalDiscount } =
                await computeOffersLikeCheckout(editOrderForm.items, products, userType);

              // 2) تأكد من وجود العناصر المجانية في الـ UI حسب freeRefs (لأجل التأكيد فقط)
              let itemsForUi = [...editOrderForm.items];
              for (const fr of freeRefs) {
                const existsIdx = itemsForUi.findIndex((x: any) => x.product_id === fr.productId && x.is_free);
                if (fr.quantity <= 0 && existsIdx !== -1) {
                  itemsForUi.splice(existsIdx, 1);
                } else if (fr.quantity > 0) {
                  const freeProd = products.find(p => p.id === fr.productId);
                  const originalPrice = freeProd ? getDisplayPrice(freeProd as any, userType) : 0;
                  if (existsIdx !== -1) {
                    if (itemsForUi[existsIdx].quantity !== fr.quantity) {
                      itemsForUi[existsIdx] = { ...(itemsForUi[existsIdx] as any), quantity: fr.quantity };
                    }
                  } else {
                    itemsForUi.push({
                      id: `free_${fr.productId}`,
                      product_id: fr.productId,
                      quantity: fr.quantity,
                      price: 0,
                      product_name: freeProd?.name_ar || freeProd?.name_en || "",
                      is_free: true,
                      original_price: originalPrice,
                    } as any);
                  }
                }
              }

              // 3) عناصر للحفظ (نرجّع سعر البنود المخفضة إلى الأساس)
              const normalizedItems = normalizeItemsForSave(itemsForUi as any[]);

              // 4) جهّز الحقول للعرض والحفظ
              const applied_offers_obj = appliedOffers;
              const free_items_obj = freeRefs;

              const applied_offers = applied_offers_obj.length ? JSON.stringify(applied_offers_obj) : null;
              const free_items = free_items_obj.length ? JSON.stringify(free_items_obj) : null;

              // 5) تغييرات التأكيد
              const confirmChanges = buildChangesForConfirm(
                originalOrderForEdit,
                { ...editOrderForm, items: normalizedItems } as any,
                products,
                userType
              );

              // 6) خزّن بالـ form (للدايلوج و AdminOrders)
              setEditOrderForm(f => f ? {
                ...f,
                items: normalizedItems,
                // للعرض في Confirm
                applied_offers_obj,
                free_items_obj,
                offers_discount_total: totalDiscount,
                // للحفظ في DB
                applied_offers,
                free_items,
              } as any : f);

              // خصم يدوي إن كان مطفّى
              if (editOrderForm.discountEnabled === false || editOrderForm.discountValue === 0) {
                setEditOrderForm(f => f ? {
                  ...f,
                  discountType: undefined,
                  discountValue: 0,
                  discountEnabled: false,
                } : f);
              }

              setEditOrderChanges(confirmChanges);
              setShowConfirmEditDialog(true);
            }}
          >
            {/* اسم العميل */}
            <div className="mb-4">
              <Label>{t("customerName") || "اسم العميل"}</Label>
              <Input
                value={editOrderForm.shipping_address.fullName}
                disabled
                className="bg-gray-100 font-bold"
              />
            </div>

            {/* باقي الحقول */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="payment_method">
                  {t("paymentMethod") || "طريقة الدفع"} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={editOrderForm.payment_method}
                  onValueChange={value =>
                    setEditOrderForm(f => (f ? { ...f, payment_method: value } : f))
                  }
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
              <div>
                <Label htmlFor="status">
                  {t("status") || "الحالة"} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={editOrderForm.status}
                  onValueChange={value =>
                    setEditOrderForm(f => (f ? { ...f, status: value } : f))
                  }
                >
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder={t("selectStatus") || "اختر الحالة"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{t("pending") || "قيد الانتظار"}</SelectItem>
                    <SelectItem value="processing">{t("processing") || "قيد التنفيذ"}</SelectItem>
                    <SelectItem value="shipped">{t("shipped") || "تم الشحن"}</SelectItem>
                    <SelectItem value="delivered">{t("delivered") || "تم التوصيل"}</SelectItem>
                    <SelectItem value="cancelled">{t("cancelled") || "ملغي"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* معلومات الشحن */}
            <div className="bg-gray-50 rounded-xl p-4 border mt-2">
              <h3 className="text-lg font-semibold mb-4 text-primary">
                {t("shippingInfo") || "معلومات الشحن"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="phone">
                    {t("phone") || "رقم الهاتف"} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    value={editOrderForm.shipping_address.phone}
                    onChange={e =>
                      setEditOrderForm(f =>
                        f
                          ? {
                              ...f,
                              shipping_address: {
                                ...f.shipping_address,
                                phone: e.target.value,
                              },
                            }
                          : f,
                      )
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="city">{t("city") || "المدينة"}</Label>
                  <Input
                    id="city"
                    value={editOrderForm.shipping_address.city}
                    onChange={e =>
                      setEditOrderForm(f =>
                        f
                          ? {
                              ...f,
                              shipping_address: {
                                ...f.shipping_address,
                                city: e.target.value,
                              },
                            }
                          : f,
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="area">{t("area") || "المنطقة"}</Label>
                  <Input
                    id="area"
                    value={editOrderForm.shipping_address.area}
                    onChange={e =>
                      setEditOrderForm(f =>
                        f
                          ? {
                              ...f,
                              shipping_address: {
                                ...f.shipping_address,
                                area: e.target.value,
                              },
                            }
                          : f,
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="street">{t("street") || "الشارع"}</Label>
                  <Input
                    id="street"
                    value={editOrderForm.shipping_address.street}
                    onChange={e =>
                      setEditOrderForm(f =>
                        f
                          ? {
                              ...f,
                              shipping_address: {
                                ...f.shipping_address,
                                street: e.target.value,
                              },
                            }
                          : f,
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="building">{t("building") || "رقم المبنى"}</Label>
                  <Input
                    id="building"
                    value={editOrderForm.shipping_address.building}
                    onChange={e =>
                      setEditOrderForm(f =>
                        f
                          ? {
                              ...f,
                              shipping_address: {
                                ...f.shipping_address,
                                building: e.target.value,
                              },
                            }
                          : f,
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="floor">{t("floor") || "الطابق"}</Label>
                  <Input
                    id="floor"
                    value={editOrderForm.shipping_address.floor}
                    onChange={e =>
                      setEditOrderForm(f =>
                        f
                          ? {
                              ...f,
                              shipping_address: {
                                ...f.shipping_address,
                                floor: e.target.value,
                              },
                            }
                          : f,
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="apartment">{t("apartment") || "رقم الشقة"}</Label>
                  <Input
                    id="apartment"
                    value={editOrderForm.shipping_address.apartment}
                    onChange={e =>
                      setEditOrderForm(f =>
                        f
                          ? {
                              ...f,
                              shipping_address: {
                                ...f.shipping_address,
                                apartment: e.target.value,
                              },
                            }
                          : f,
                      )
                    }
                  />
                </div>
              </div>
            </div>

            {/* قسم الخصم */}
            <OrderDiscountSection
              discountEnabled={editOrderForm.discountEnabled}
              discountType={editOrderForm.discountType}
              discountValue={editOrderForm.discountValue}
              onDiscountEnabledChange={val => setEditOrderForm(f => f ? { ...f, discountEnabled: val } : f)}
              onDiscountTypeChange={val => setEditOrderForm(f => f ? { ...f, discountType: val } : f)}
              onDiscountValueChange={val => setEditOrderForm(f => f ? { ...f, discountValue: val } : f)}
              t={t}
            />

            {/* المنتجات */}
            <div className="bg-gray-50 rounded-xl p-4 border mt-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-primary">
                  {t("products") || "المنتجات"}
                </h3>
                <Button
                  type="button"
                  onClick={() => {
                    setEditOrderForm(f => {
                      if (!f) return f;
                      const items = f.items;
                      const emptyIndex = items.findIndex(itm => !itm.product_id);
                      if (emptyIndex !== -1) return f;
                      return {
                        ...f,
                        items: [
                          ...items,
                          {
                            id: Date.now().toString(),
                            product_id: "",
                            quantity: 1,
                            price: 0,
                            product_name: "",
                          },
                        ],
                      };
                    });
                  }}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" /> {t("addProduct") || "إضافة منتج"}
                </Button>
              </div>
              <div className="space-y-3">
                {editOrderForm.items.map((item, index) => {
                  const isFree = (item as any).is_free;
                  const isDiscounted = (item as any).offer_applied && !isFree;

                  return (
                    <div key={item.id} className={`p-4 border rounded-lg shadow-sm ${isFree ? 'bg-green-50 border-green-200' : isDiscounted ? 'bg-yellow-50 border-yellow-200' : 'bg-white'}`}>
                      <div className="mb-3">
                        <Label className="text-sm font-semibold">
                          {t("product") || "المنتج"} <span className="text-primary font-bold">{editOrderForm.items.length > 1 ? (index + 1) : null}</span> <span className="text-red-500">*</span>
                          {isFree && (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold mr-2">
                              🎁 مجاني
                            </span>
                          )}
                          {!isFree && (item as any).offer_applied && (
                            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-bold mr-2">
                              % خصم مطبق
                            </span>
                          )}
                          {(item as any).offer_trigger && (
                            <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold mr-2">
                              ✅ حقق الشرط
                            </span>
                          )}
                        </Label>
                      </div>
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="flex-1 min-w-[250px]">
                          {isFree || (item as any).offer_applied ? (
                            <Input
                              value={
                                products.find(p => p.id === item.product_id)?.[`name_${language}`] ||
                                products.find(p => p.id === item.product_id)?.name_ar ||
                                ""
                              }
                              disabled
                              className="bg-green-50 text-green-700 border-green-200 cursor-not-allowed"
                              placeholder="منتج مجاني من عرض مطبق"
                            />
                          ) : (
                            <Autocomplete
                              value={
                                products.find(p => p.id === item.product_id)?.[`name_${language}`] ||
                                products.find(p => p.id === item.product_id)?.name_ar ||
                                ""
                              }
                              onClear={() => {
                                setEditOrderForm(f => {
                                  if (!f) return f;
                                  const updatedItems = f.items.map((itm, idx) =>
                                    idx === index
                                      ? {
                                          ...itm,
                                          product_id: "",
                                          product_name: "",
                                          price: 0,
                                          quantity: 1,
                                          offer_applied: undefined,
                                          offer_id: undefined,
                                          offer_name: undefined,
                                          original_price: undefined,
                                          offer_trigger: undefined,
                                          offer_trigger_id: undefined,
                                        }
                                      : itm
                                  );
                                  return { ...f, items: updatedItems };
                                });
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
                                    {description && (
                                      <div className="text-sm text-gray-500 mt-1">{description}</div>
                                    )}
                                  </div>
                                );
                              }}
                              onInputChange={val => {
                                if (!val || val.trim() === "") {
                                  return;
                                }
                                const matched = products.find(
                                  p => p[`name_${language}`] === val || p.name_ar === val || p.name_en === val || p.name_he === val
                                );
                                setEditOrderForm(f => {
                                  if (!f) return f;
                                  if (matched) {
                                    const existingIndex = f.items.findIndex((itm, idx) => itm.product_id === matched.id && idx !== index);
                                    if (existingIndex !== -1) {
                                      const updatedItems = f.items
                                        .map((itm, idx) => idx === existingIndex ? { ...itm, quantity: Number(itm.quantity) + 1 } : itm)
                                        .filter((itm, idx) => idx !== index);
                                      return { ...f, items: updatedItems };
                                    }
                                  }
                                  const selectedUser = originalOrderForEdit?.profiles;
                                  const userType = (selectedUser && selectedUser.user_type) ? selectedUser.user_type : 'retail';
                                  const priceBase = matched ? getDisplayPrice(matched, userType) : 0;
                                  const updatedItems = f.items.map((itm, idx) =>
                                    idx === index
                                      ? {
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
                                        }
                                      : itm
                                  );
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
                          <Label className="text-xs text-gray-600 mb-1 block">
                            {t("quantity") || "الكمية"} <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity === 0 ? "" : item.quantity}
                            onChange={e =>
                              setEditOrderForm(f => {
                                if (!f) return f;
                                const val = e.target.value === "" ? 0 : parseInt(e.target.value) || 1;
                                const updatedItems = f.items.map((itm, idx) =>
                                  idx === index ? { ...itm, quantity: val } : itm
                                );
                                return { ...f, items: updatedItems };
                              })
                            }
                            required
                            disabled={isFree || (item as any).offer_applied}
                            className={isFree ? "bg-green-50 text-green-700" : ""}
                          />
                        </div>
                        <div className="w-28">
                          <Label className="text-xs text-gray-600 mb-1 block">
                            {t("price") || "السعر"} <span className="text-red-500">*</span>
                            {isFree && (
                              <span className="text-green-600 font-bold ml-1">مجاني</span>
                            ) &&
                            <span className="text-xs text-gray-500 line-through">
                                {(item as any).original_price} ₪
                              </span>
                              }
                          </Label>
                          <div className="flex flex-col gap-1">
                            {((item as any).offer_applied &&
                              typeof (item as any).original_price === "number" &&
                              ((item as any).original_price > (item.price ?? 0))) && (
                              <span className="text-xs text-gray-500 line-through">
                                {(item as any).original_price} ₪
                              </span>
                            )}
                            <Input
                              type="number"
                              step="0.01"
                              value={item.price === 0 ? 0 : item.price && item.price >= 0 ? item.price : 0}
                              onChange={e =>
                                setEditOrderForm(f => {
                                  if (!f) return f;
                                  const val = e.target.value === "" ? 0 : parseFloat(e.target.value) || 0;
                                  const updatedItems = f.items.map((itm, idx) =>
                                    idx === index ? { ...itm, price: val } : itm
                                  );
                                  return { ...f, items: updatedItems };
                                })
                              }
                              required
                              disabled={isFree || (item as any).offer_applied}
                              className={isFree ? "bg-green-50 text-green-700" : ""}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {!isFree && (
                          <Button
                            type="button"
                            onClick={() => {
                              if (isFree) {
                                if (window.confirm("هذا منتج مجاني من عرض مطبق. هل أنت متأكد من حذفه؟")) {
                                  removeOrderItemByIndex(index);
                                }
                              } else {
                                removeOrderItem(item.id);
                              }
                            }}
                            variant={"destructive"}
                            size="sm"
                            className="h-10"
                            title={isFree ? "منتج مجاني من عرض مطبق" : "حذف المنتج"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          )}

                          {/* زر تطبيق العرض - يظهر فقط عند تحقق شروط عرض */}
                          {item.product_id && offerEligibilities[item.product_id] && !isFree && (
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

                          {/* زر إزالة العرض المطبق */}
                          {/* {(item as any).offer_applied && (item as any).offer_id && (
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
                          )} */}
                        </div>
                      </div>

                      {(item as any).offer_applied && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                          <span className="text-blue-700 font-medium">
                            🎉 عرض مطبق: {(item as any).offer_name || "عرض"}
                          </span>
                          {typeof (item as any).original_price === "number" && (
                            <span className="block text-gray-600 text-xs mt-1 line-through">
                              السعر الأصلي: {(item as any).original_price} ₪
                            </span>
                          )}
                        </div>
                      )}

                      {(item as any).offer_trigger && (item as any).offer_trigger_id && (
                        <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-sm">
                          <span className="text-emerald-700 font-medium">✅ هذا المنتج حقق العرض :"{(item as any).offer_name || "عرض"}"</span>
                        </div>
                      )}

                      {item.product_id && offerEligibilities[item.product_id] && !isFree && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                          <span className="text-green-700 font-medium">
                            🎁 {offerEligibilities[item.product_id].message}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* المجموع الكلي */}
              {editOrderForm.items.length > 0 && (
                <div className="text-right mt-3 space-y-2">
                  {(() => {
                    const selectedUser = originalOrderForEdit?.profiles;
                    const userType = (selectedUser && selectedUser.user_type) ? selectedUser.user_type : 'retail';

                    const basePrice = (it: any) => {
                      const prod = products.find((p: any) => p.id === it.product_id);
                      if (!prod) return 0;
                      return getDisplayPrice(prod, userType);
                    };

                    const subtotalBeforeDiscounts = editOrderForm.items
                      .filter((it: any) => !it.is_free)
                      .reduce((sum, it: any) => sum + (basePrice(it) * (it.quantity || 0)), 0);

                    const freeProductsDiscount = editOrderForm.items
                      .filter((it: any) => it.is_free)
                      .reduce((sum, it: any) => sum + (basePrice(it) * (it.quantity || 0)), 0);

                    const itemDiscounts = editOrderForm.items
                      .filter((it: any) => it.offer_applied && typeof it.original_price === 'number')
                      .reduce((sum, it: any) => {
                        const perUnit = Math.max(0, ((it.original_price as number) - (it.price || 0)));
                        return sum + perUnit * (it.quantity || 0);
                      }, 0);

                    const grandTotal = subtotalBeforeDiscounts - itemDiscounts;

                    return (
                      <div className="border rounded-lg p-3 bg-gray-50">
                        <p className="text-sm text-gray-600">
                          {t("subtotal") || "المجموع الفرعي"}: {subtotalBeforeDiscounts} ₪
                        </p>
                        {freeProductsDiscount > 0 && (
                          <p className="text-sm text-green-600">
                            {t("freeProductsDiscount") || "خصم المنتجات المجانية"}: -{freeProductsDiscount} ₪
                          </p>
                        )}
                        {itemDiscounts > 0 && (
                          <p className="text-sm text-green-600">
                            {t("itemsDiscount") || "خصم المنتجات المخفضة"}: -{itemDiscounts} ₪
                          </p>
                        )}
                        <div className="border-t pt-2 mt-2">
                          <p className="text-lg font-semibold">
                            {t("total") || "المجموع الكلي"}: {grandTotal} ₪
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  <OrderDiscountSummary
                    discountEnabled={editOrderForm.discountEnabled}
                    discountType={editOrderForm.discountType}
                    discountValue={editOrderForm.discountValue}
                    items={editOrderForm.items}
                    t={t}
                  />
                </div>
              )}
            </div>

            {/* ملاحظات */}
            <div>
              <Label htmlFor="notes">{t("notes") || "ملاحظات"}</Label>
              <Textarea
                id="notes"
                value={editOrderForm.notes}
                onChange={e =>
                  setEditOrderForm(f => (f ? { ...f, notes: e.target.value } : f))
                }
                placeholder={t("orderNotesPlaceholder") || "أدخل ملاحظات إضافية (اختياري)"}
              />
            </div>

            {/* أزرار الحفظ */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t("cancel") || "إلغاء"}
              </Button>
              <Button type="submit" className="bg-primary text-white font-bold">
                {t("save") || "حفظ التعديلات"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderEditDialog;
