// OrderEditDialog.tsx
import React, { useEffect, useContext, useState, useRef, useCallback, useMemo } from "react";
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
import { useToast } from "@/hooks/use-toast";

/* ===== Helpers ===== */

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
    if (!prev) { 
      map.set(key, { ...it }); 
      continue; 
    }
    // عند الدمج، نحافظ على جميع الخصائص من العنصر الأول
    prev.quantity = qty(prev.quantity) + qty(it.quantity);
  }
  return Array.from(map.values()).filter(x => qty(x.quantity) > 0);
}

/* ===== تغييرات التأكيد (إرجاع لائحة التغييرات للمودال) ===== */

function buildChangesForConfirm(originalOrder: any, edited: NewOrderForm, products: any[], userType?: string) {
  const changes: { label: string; oldValue: string; newValue: string }[] = [];

  // مقارنة الحقول الأساسية للطلبية
  const fieldsToCompare = [
    { key: 'customer_name', label: 'اسم العميل' },
    { key: 'customer_phone', label: 'رقم الهاتف' },
    { key: 'customer_address', label: 'العنوان' },
    { key: 'status', label: 'حالة الطلبية' },
    { key: 'payment_method', label: 'طريقة الدفع' },
    { key: 'notes', label: 'ملاحظات' },
    { key: 'delivery_fee', label: 'رسوم التوصيل' },
    { key: 'discountValue', label: 'قيمة الخصم' },
    { key: 'discountType', label: 'نوع الخصم' }
  ];

  fieldsToCompare.forEach(field => {
    const oldValue = String(originalOrder?.[field.key] || '');
    const newValue = String(edited?.[field.key] || '');
    
    // تجاهل التغييرات التلقائية غير المهمة
    if (field.key === 'discountType') {
      // إذا كان القديم فارغ والجديد "amount" (القيمة الافتراضية)، تجاهل
      if (!oldValue && newValue === 'amount') return;
      // إذا كان القديم "amount" والجديد فارغ، تجاهل أيضاً
      if (oldValue === 'amount' && !newValue) return;
    }
    
    if (oldValue !== newValue) {
      changes.push({
        label: field.label,
        oldValue: oldValue || '(فارغ)',
        newValue: newValue || '(فارغ)'
      });
    }
  });

  // مقارنة معلومات الشحن (object)
  const compareShippingAddress = () => {
    const oldShipping = originalOrder?.shipping_address || {};
    const newShipping = edited?.shipping_address || {};
    
    const shippingFields = [
      { key: 'fullName', label: 'اسم المستلم' },
      { key: 'phone', label: 'هاتف المستلم' },
      { key: 'city', label: 'المدينة' },
      { key: 'area', label: 'المنطقة' },
      { key: 'street', label: 'الشارع' },
      { key: 'building', label: 'رقم المبنى' },
      { key: 'floor', label: 'الطابق' },
      { key: 'apartment', label: 'الشقة' }
    ];

    shippingFields.forEach(field => {
      const oldValue = String(oldShipping[field.key] || '');
      const newValue = String(newShipping[field.key] || '');
      
      if (oldValue !== newValue) {
        changes.push({
          label: `${field.label} (الشحن)`,
          oldValue: oldValue || '(فارغ)',
          newValue: newValue || '(فارغ)'
        });
      }
    });
  };

  compareShippingAddress();

  const originalItems = originalOrder?.items || [];
  const editedItems = edited.items || [];

  // تجميع العناصر بحسب المنتج والنوع (عادي، مجاني، مخفض)
  const groupItems = (items: any[]) => {
    const grouped = new Map<string, {
      normalQty: number;
      normalPrice: number;
      freeQty: number;
      discountedQty: number;
      discountedPrice: number;
      name: string;
    }>();

    items.forEach((item: any) => {
      const pid = String(item.product_id || '');
      const qty = Number(item.quantity || 0);
      const price = Number(item.price || 0);
      const name = products.find((p: any) => String(p.id) === pid)?.name_ar || 
                   item.product_name || 
                   String(pid);

      if (qty <= 0) return;

      if (!grouped.has(pid)) {
        grouped.set(pid, {
          normalQty: 0,
          normalPrice: 0,
          freeQty: 0,
          discountedQty: 0,
          discountedPrice: 0,
          name
        });
      }

      const group = grouped.get(pid)!;

      if (item.is_free) {
        group.freeQty += qty;
      } else if (item.offer_applied) {
        group.discountedQty += qty;
        group.discountedPrice = price;
      } else {
        group.normalQty += qty;
        group.normalPrice = price;
      }
    });

    return grouped;
  };

  const oldGroups = groupItems(originalItems);
  const newGroups = groupItems(editedItems);

  // مقارنة كل منتج
  const allProductIds = new Set([...oldGroups.keys(), ...newGroups.keys()]);

  allProductIds.forEach(pid => {
    const oldGroup = oldGroups.get(pid);
    const newGroup = newGroups.get(pid);

    const productName = oldGroup?.name || newGroup?.name || 'منتج غير معروف';

    // مقارنة العادي
    const oldNormalQty = oldGroup?.normalQty || 0;
    const newNormalQty = newGroup?.normalQty || 0;
    const oldNormalPrice = oldGroup?.normalPrice || 0;
    const newNormalPrice = newGroup?.normalPrice || 0;

    if (oldNormalQty !== newNormalQty || oldNormalPrice !== newNormalPrice) {
      changes.push({
        label: `${productName}`,
        oldValue: `الكمية: ${oldNormalQty}, السعر: ${oldNormalPrice}`,
        newValue: `الكمية: ${newNormalQty}, السعر: ${newNormalPrice}`
      });
    }

    // مقارنة المجاني
    const oldFreeQty = oldGroup?.freeQty || 0;
    const newFreeQty = newGroup?.freeQty || 0;

    if (oldFreeQty !== newFreeQty) {
      changes.push({
        label: `🎁 ${productName} (مجاني)`,
        oldValue: `الكمية: ${oldFreeQty}`,
        newValue: `الكمية: ${newFreeQty}`
      });
    }

    // مقارنة المخفض
    const oldDiscountedQty = oldGroup?.discountedQty || 0;
    const newDiscountedQty = newGroup?.discountedQty || 0;
    const oldDiscountedPrice = oldGroup?.discountedPrice || 0;
    const newDiscountedPrice = newGroup?.discountedPrice || 0;

    if (oldDiscountedQty !== newDiscountedQty || oldDiscountedPrice !== newDiscountedPrice) {
      changes.push({
        label: `% ${productName} (مخفض)`,
        oldValue: `الكمية: ${oldDiscountedQty}, السعر: ${oldDiscountedPrice}`,
        newValue: `الكمية: ${newDiscountedQty}, السعر: ${newDiscountedPrice}`
      });
    }
  });

  return changes;
}

/* ===== Reconcile helpers ===== */

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

  // نحتاج نزيد المجاني
  if (delta > 0) {
    let toTake = delta;
    // أولاً اسحب من المدفوع (تحويله لمجاني)
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
    // لو لسه باقي كميّة مجانية ومفيش مدفوع، ضيف سطر مجاني جديد (عادي)
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

  // نحتاج نقلّل المجاني
  if (delta < 0 && currentFree > 0) {
    let toReturn = -delta;
    if (freeIdx !== -1) {
      const giveBack = Math.min(currentFree, toReturn);
      // قلّل من المجاني
      list[freeIdx] = { ...list[freeIdx], quantity: currentFree - giveBack };
      toReturn -= giveBack;

      // رجّع للكرت كمدفوع
      if (giveBack > 0) {
        const p = productOf(products, pid);
        const price = basePrice(products, pid, userType);
        // ابحث عن خط مدفوع موجود
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

// يضمن وجود خط "مخفَّض" بكمية expectedQty (والباقي عادي)
async function ensureDiscountedQty(
  items: any[],
  products: any[],
  pid: string,
  expectedQty: number,
  offer: any, // نفس الشيء اللي يرجع من OfferService
  userType?: string,
  forcedUnitPrice?: number   // 👈 اختياري: سعر الوحدة بعد الخصم (لو موزّع من discountAmount)
) {
  let list = [...items];

  const discountedIndices = list
    .map((it, i) => ({ it, i }))
    .filter(({ it }) => it.product_id === pid && (it as any).offer_applied && (it as any).offer_id === offer.id);

  const currentDiscounted = discountedIndices.reduce((s, { it }) => s + qty(it.quantity), 0);

  // خطّ مدفوع (غير مخفّض) لنفس المنتج
  const normalIndices = list
    .map((it, i) => ({ it, i }))
    .filter(({ it }) => it.product_id === pid && !(it as any).is_free && (!(it as any).offer_applied || (it as any).offer_id !== offer.id));

  const p = productOf(products, pid);
  const original = basePrice(products, pid, userType);

  // احسب سعر الوحدة المخفض
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
      // fallback مرن
      const dtypeRaw = String(
        (offer as any).get_discount_type ?? (offer as any).discount_type ?? ""
      ).toLowerCase();

      let dval = Number(
        (offer as any).get_discount_value ?? (offer as any).discount_value ?? 0
      );

      if (dtypeRaw === "percentage" || dtypeRaw === "percent" || dtypeRaw === "%") {
        const perc = dval > 1 ? dval / 100 : dval; // يدعم 10 أو 0.1
        discountedUnit = Math.max(0, original * (1 - perc));
      } else if (dtypeRaw === "fixed" || dtypeRaw === "amount") {
        discountedUnit = Math.max(0, original - dval);
      } else {
        discountedUnit = original;
      }
    }
  }

  const delta = expectedQty - currentDiscounted;

  // نحتاج نزيد المخفّض: حرّك من المدفوع → المخفّض
  if (delta > 0) {
    let toTake = delta;
    for (const { it, i } of normalIndices) {
      if (toTake <= 0) break;
      const take = Math.min(qty(it.quantity), toTake);
      if (take <= 0) continue;

      // قلّل من العادي - نحافظ على السعر الموجود
      const currentPrice = Number(it.price) || original; // نحافظ على السعر المعدّل
      list[i] = { ...list[i], quantity: qty(list[i].quantity) - take, price: currentPrice, original_price: original };

      // كبّر أو أنشئ المخفّض
      const idxDisc = list.findIndex(x => x.product_id === pid && (x as any).offer_applied && (x as any).offer_id === offer.id);
      if (idxDisc !== -1) {
        list[idxDisc] = { ...list[idxDisc], quantity: qty(list[idxDisc].quantity) + take, price: discountedUnit, original_price: original, offer_applied: true, offer_id: offer.id, offer_name: (offer.title_ar || offer.title_en) };
      } else {
        list.push({
          id: `disc_${offer.id}_${pid}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          product_id: pid,
          quantity: take,
          price: discountedUnit,
          original_price: original,
          offer_applied: true,
          offer_id: offer.id,
          offer_name: (offer.title_ar || offer.title_en),
        } as any);
      }
      toTake -= take;
    }
    // ما منضيف مخفّض لو المنتج مش موجود مدفوع أصلاً
  }

  // نحتاج نقلّل المخفّض: رجّع الفرق لخطوط عاديّة
  if (delta < 0 && currentDiscounted > 0) {
    let toReturn = -delta;
    for (const { it, i } of discountedIndices) {
      if (toReturn <= 0) break;
      const canMove = Math.min(qty(it.quantity), toReturn);
      if (canMove <= 0) continue;
      list[i] = { ...list[i], quantity: qty(list[i].quantity) - canMove, price: discountedUnit, original_price: original, offer_applied: true, offer_id: offer.id, offer_name: (offer.title_ar || offer.title_en) };

      const idxNorm = list.findIndex(x => x.product_id === pid && !(x as any).is_free && !(x as any).offer_applied);
      if (idxNorm !== -1) {
        // نحافظ على السعر الموجود أو نحطه من الأصل
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

/* ===== حساب/تصالح العروض ديناميكياً على كامل العناصر ===== */

async function reconcileAllOffersLive(
  items: any[],
  products: any[],
  userType?: string
) {
  let list = [...items];

  // تنظيف أولي: إزالة علامات العروض السابقة لإعادة تقييمها
  list = list.map(item => {
    if ((item as any).is_free) return item; // المنتجات المجانية تبقى كما هي
    const { offer_trigger, offer_trigger_id, offer_name, offer_applied, offer_id, ...cleanItem } = item as any;
    return cleanItem;
  });

  // ابنِ سلة مجمّعة حسب المنتج (بدون مجاني)
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

  // === FREE ===
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

  // === BUY_GET discount ===
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

    // لو السيرفر رجّع discountAmount لهاي الصفقة، وزّعه على الوحدات المستحقّة
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

  // === عروض discount / product_discount (تُطبّق على كامل الكميّة) ===
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

  // === تحديد المنتجات التي حققت شروط العروض (offer_trigger) ===
  // أولاً، إزالة جميع العلامات السابقة
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
      // هذا المنتج حقق شرط العرض
      list = list.map(item => {
        if (item.product_id === triggerPid && !(item as any).is_free && !(item as any).offer_applied) {
          return {
            ...item,
            offer_trigger: true,
            offer_trigger_id: off.id,
            offer_name: off.title_ar || off.title_en || "عرض"
          };
        }
        return item;
      });
    }
  }

  return {
    items: mergeSimilarLines(list),
    appliedOffers,
    freeRefs: normalizeFreeRefs(freeItems),
    totalDiscount
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
  const { toast } = useToast();
  const [offerEligibilities, setOfferEligibilities] = useState<Record<string, OfferEligibility>>({});
  const lastProcessedItemsRef = useRef<string>("");
  const autoAppliedOffersRef = useRef<Set<string>>(new Set());
  const initialItemsSnapshotRef = useRef<any[]>([]);  // حفظ snapshot من البيانات عند فتح النافذة
  const initialFormSnapshotRef = useRef<NewOrderForm | null>(null);  // حفظ snapshot من كامل النموذج

  // يمنع دمج “خصم” مع “عادي” في نفس المنتج
  const canMergeLines = (a: any, b: any) => {
    return a.product_id === b.product_id
      && !!a.is_free === !!b.is_free
      && (!!a.offer_applied === !!b.offer_applied)
      && String(a.offer_id || "") === String(b.offer_id || "")
      && !!a.offer_trigger === !!b.offer_trigger
      && String(a.offer_trigger_id || "") === String(b.offer_trigger_id || "");
  };

  // ==== فحص العروض المتاحة (زر الهدية) =====
  const checkOffersForItems = async () => {
    if (!editOrderForm?.items) return;
    const userType = originalOrderForEdit?.profiles?.user_type || 'retail';
    const newEligibilities: Record<string, OfferEligibility> = {};
    for (const item of editOrderForm.items) {
      if (item.product_id && item.quantity > 0 && !(item as any).is_free && !(item as any).offer_trigger) {
        try {
          const eligibility = await checkProductOfferEligibility(
            item.product_id,
            item.quantity,
            editOrderForm.items,
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
    if (!editOrderForm || !eligibility.offer) return;
    try {
      const userType = originalOrderForEdit?.profiles?.user_type || 'retail';
      // طبّق العرض مباشرة على هذا المنتج (قد يضيف سطر مخفّض)
      let updatedItems = await applyOfferToProduct(
        eligibility.offer,
        productId,
        editOrderForm.items,
        products,
        userType
      );
      autoAppliedOffersRef.current.add(eligibility.offer.id);

      // وصالح كل شيء حسب المنطق العام (للتكرارات/المجاني/الخصم)
      const { items } = await reconcileAllOffersLive(updatedItems, products, userType);
      setEditOrderForm(prev => prev ? { ...prev, items } : prev);

      setOfferEligibilities(prev => {
        const u = { ...prev };
        delete u[productId];
        return u;
      });
    } catch (error) {
      console.error("Error applying offer:", error);
    }
  };

  // حذف صنف
  function removeOrderItem(id: string) {
    setEditOrderForm(f => {
      if (!f) return f;
      const items = f.items.filter(item => item.id !== id);
      return { ...f, items };
    });
  }
  function removeOrderItemByIndex(index: number) {
    setEditOrderForm(f => {
      if (!f) return f;
      const items = f.items.filter((_, i) => i !== index);
      return { ...f, items };
    });
  }

  // تحديث أسعار عند الفتح/نوع المستخدم
  useEffect(() => {
    if (!editOrderForm || !open) return;
    const userType = originalOrderForEdit?.profiles?.user_type || 'retail';

    setEditOrderForm(prev => {
      if (!prev) return prev;
      const items = prev.items.map(item => {
        const p = productOf(products, item.product_id);
        if (!p) return item;
        const base = getDisplayPrice(p, userType);
        // ما نرجّع السعر الأساسي للبنود المخفّضة — نخليه كما هو، بس نتأكد من original_price
        if ((item as any).offer_applied) {
          return {
            ...item,
            original_price: typeof (item as any).original_price === "number" ? (item as any).original_price : base
          };
        }
        if ((item as any).is_free) {
          return { ...item, price: 0, original_price: base };
        }
        return { ...item, price: base, original_price: base };
      });
      return { ...prev, items };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, originalOrderForEdit?.profiles?.user_type, products]);

  // حفظ snapshot من البيانات عند فتح النافذة (بعد تحديث الأسعار)
  useEffect(() => {
    if (open && editOrderForm && editOrderForm.items && initialItemsSnapshotRef.current.length === 0) {
      // احفظ مرة واحدة فقط عند فتح النافذة
      const timer = setTimeout(() => {
        if (initialItemsSnapshotRef.current.length === 0) { // تأكد مرة ثانية
          initialItemsSnapshotRef.current = JSON.parse(JSON.stringify(editOrderForm.items));
          initialFormSnapshotRef.current = JSON.parse(JSON.stringify(editOrderForm));
          console.log('🔍 Full form snapshot saved (ONCE):', initialFormSnapshotRef.current);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [open, originalOrderForEdit?.id]); // بدون editOrderForm?.items

  // مسح الـ snapshot عند إغلاق النافذة
  useEffect(() => {
    if (!open) {
      initialItemsSnapshotRef.current = [];
      initialFormSnapshotRef.current = null;
      console.log('🔍 Snapshots cleared');
    }
  }, [open]);

  // sync الخصم اليدوي من الطلب الأصلي
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

  // فحص/تصالح العروض عند تغيّر العناصر (ديناميكي)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!editOrderForm?.items || products.length === 0) return;
      
      // تجنب التكرار إذا كانت العناصر نفسها
      const currentItemsKey = JSON.stringify(editOrderForm.items);
      if (lastProcessedItemsRef.current === currentItemsKey) return;
      
      const userType = originalOrderForEdit?.profiles?.user_type || 'retail';
      const { items } = await reconcileAllOffersLive(editOrderForm.items, products, userType);
      
      // فقط إذا تغيرت العناصر فعلياً، حدث الـ state
      const itemsChanged = JSON.stringify(items) !== JSON.stringify(editOrderForm.items);
      if (!cancelled && itemsChanged) {
        lastProcessedItemsRef.current = JSON.stringify(items); // حدث المرجع قبل التحديث
        setEditOrderForm(prev => prev ? { ...prev, items } : prev);
      }
      
      // فقط حدث المرجع إذا لم تتغير العناصر
      if (!itemsChanged) {
        lastProcessedItemsRef.current = currentItemsKey;
      }
      
      if (!cancelled) checkOffersForItems();
    };
    const t = setTimeout(run, 150);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editOrderForm?.items, products]);

  // تطبيع العناصر قبل الحفظ — نحافظ على السعر المعدّل للعناصر العادية
  const normalizeItemsForSave = (items: any[]) => {
    return mergeSimilarLines(items).map(it => {
      const userType = originalOrderForEdit?.profiles?.user_type || 'retail';
      const basePriceForProduct = basePrice(products, it.product_id, userType);
      
      if ((it as any).is_free) {
        return {
          ...it,
          price: 0, // المنتجات المجانية سعرها صفر
          is_free: true, // نحافظ على علامة المجاني لتجنب الخصم المضاعف من المخزون
          offer_applied: undefined,
          offer_id: undefined,
          offer_name: undefined,
          original_price: undefined,
        };
      }
      if ((it as any).offer_applied) {
        return {
          ...it,
          // نحفظ السعر الأساسي، OrderDetailsPrint سيحسب الخصم من applied_offers
          price: basePriceForProduct,
          offer_applied: undefined,
          offer_id: undefined,
          offer_name: undefined,
          original_price: undefined,
        };
      }
      // عادي - نحافظ على السعر المعدّل إذا كان مختلف عن السعر الأساسي
      return {
        ...it,
        price: it.price || basePriceForProduct, // نحافظ على السعر المعدّل
        is_free: undefined,
        offer_applied: undefined,
        offer_id: undefined,
        offer_name: undefined,
        original_price: undefined,
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

              // 1) احصل على البيانات المعروضة أولاً (snapshot عند فتح النافذة)
              const initialSnapshot = initialItemsSnapshotRef.current.length > 0 
                ? initialItemsSnapshotRef.current 
                : editOrderForm.items; // fallback للبيانات الحالية إذا لم يكن هناك snapshot

              const initialFormSnapshot = initialFormSnapshotRef.current || editOrderForm;

              console.log('🔍 Using form snapshot:', initialFormSnapshot);
              console.log('🔍 Current form:', editOrderForm);

              // لا نطبق reconcile على البيانات الأولية لنحافظ على الأسعار المعدّلة
              // const initialReconciled = await reconcileAllOffersLive(initialSnapshot, products, userType);

              // 2) صالح كل شيء نهائياً قبل التأكيد (يعتمد على applyOffers)
              const { items, appliedOffers, freeRefs, totalDiscount } =
                await reconcileAllOffersLive(editOrderForm.items, products, userType);

              // 3) تغييرات التأكيد (مقارنة البيانات الأولية مع الجديدة)
              console.log('🔍 Initial snapshot items:', initialSnapshot);
              console.log('🔍 New reconciled items:', items);
              
              const confirmChanges = buildChangesForConfirm(
                { ...initialFormSnapshot, items: initialSnapshot }, // البيانات الأولية بدون معالجة
                { ...editOrderForm, items: items }, // البيانات الجديدة مع العروض
                products,
                userType
              );
              
              console.log('🔍 Confirm changes:', confirmChanges);

              // إذا لم تكن هناك تغييرات، لا نظهر نافذة التأكيد
              if (confirmChanges.length === 0) {
                // إعلام المستخدم أنه لا توجد تغييرات
                toast({
                  title: "لا توجد تغييرات",
                  description: "لا توجد تغييرات لحفظها في هذه الطلبية",
                  variant: "default",
                });
                return;
              }

              // 4) عناصر للحفظ (بعد التطبيع)
              const normalizedItems = normalizeItemsForSave(items);

              // 5) جهّز الحقول للعرض والحفظ
              const applied_offers_obj = appliedOffers;
              const free_items_obj = freeRefs;

              const applied_offers = applied_offers_obj.length ? JSON.stringify(applied_offers_obj) : null;
              const free_items = free_items_obj.length ? JSON.stringify(free_items_obj) : null;

              // 5) خزّن بالـ form (للدايلوج و AdminOrders)
              setEditOrderForm(f => f ? {
                ...f,
                items: normalizedItems,
                applied_offers_obj,
                free_items_obj,
                offers_discount_total: totalDiscount,
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

                  const nameInputClasses =
                    isFree
                      ? "bg-green-50 text-green-700 border-green-200 cursor-not-allowed"
                      : isDiscounted
                      ? "bg-yellow-50 text-yellow-700 border-yellow-200 cursor-not-allowed"
                      : "";

                  const qtyPriceDisabled = isFree || isDiscounted;

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
                                if (!val || val.trim() === "") return;
                                const matched = products.find(
                                  p => p[`name_${language}`] === val || p.name_ar === val || p.name_en === val || p.name_he === val
                                );
                                setEditOrderForm(f => {
                                  if (!f) return f;
                                  const selectedUser = originalOrderForEdit?.profiles;
                                  const userType = (selectedUser && selectedUser.user_type) ? selectedUser.user_type : 'retail';
                                  const priceBase = matched ? getDisplayPrice(matched, userType) : 0;

                                  // ⚠️ لا تدمج مع خط موجود إذا حالته مختلفة (free/discount)
                                  const existingIndex = f.items.findIndex((itm, idx) =>
                                    idx !== index &&
                                    itm.product_id === matched?.id &&
                                    canMergeLines(itm, f.items[index])
                                  );

                                  if (existingIndex !== -1) {
                                    const updatedItems = f.items
                                      .map((itm, idx) => idx === existingIndex ? { ...itm, quantity: qty(itm.quantity) + 1 } : itm)
                                      .filter((itm, idx) => idx !== index);
                                    return { ...f, items: updatedItems };
                                  }

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
                            disabled={qtyPriceDisabled}
                            className={isFree ? "bg-green-50 text-green-700" : isDiscounted ? "bg-yellow-50 text-yellow-700" : ""}
                          />
                        </div>
                        <div className="w-28">
                          <Label className="text-xs text-gray-600 mb-1 block">
                            {t("price") || "السعر"} <span className="text-red-500">*</span>
                            {isFree && <span className="text-green-600 font-bold ml-1">مجاني</span>}
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
                              disabled={qtyPriceDisabled}
                              className={isFree ? "bg-green-50 text-green-700" : isDiscounted ? "bg-yellow-50 text-yellow-700" : ""}
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

                      {/* إظهار العروض المتاحة فقط إذا لم يكن المنتج محققاً لشروط عرض آخر */}
                      {item.product_id && offerEligibilities[item.product_id] && !isFree && !(item as any).offer_trigger && (
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
                    const userType = originalOrderForEdit?.profiles?.user_type || 'retail';
                    const subtotalBeforeDiscounts = editOrderForm.items
                      .filter((it: any) => !it.is_free)
                      .reduce((sum, it: any) => sum + (basePrice(products, it.product_id, userType) * (it.quantity || 0)), 0);

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
