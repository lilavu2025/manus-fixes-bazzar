import { OfferService, type Offer } from "@/services/offerService";
import type { OrderItem } from "@/orders/order.types";
import type { Product } from "@/types/product";
import { getDisplayPrice } from "@/utils/priceUtils";

export interface OfferEligibility {
  isEligible: boolean;
  offer: Offer | null;
  message: string;
  canApply: boolean;
}

/**
 * فحص إذا كان المنتج مؤهل لعرض معين
 */
export async function checkProductOfferEligibility(
  productId: string,
  quantity: number,
  currentItems: OrderItem[],
  userType: string = 'retail'
): Promise<OfferEligibility> {
  try {
    // جلب العروض المتاحة للمنتج
    const offers = await OfferService.getOffersForProduct(productId);
    
    if (offers.length === 0) {
      return {
        isEligible: false,
        offer: null,
        message: "لا توجد عروض متاحة لهذا المنتج",
        canApply: false
      };
    }

    // فحص كل عرض
    for (const offer of offers) {
      const eligibility = await checkSingleOfferEligibility(offer, productId, quantity, currentItems, userType);
      if (eligibility.isEligible && eligibility.canApply) {
        return eligibility;
      }
    }

    // إذا لم يكن هناك عرض قابل للتطبيق، فحص إذا كان هناك عرض مطبق بالفعل
    for (const offer of offers) {
      if (isOfferAlreadyApplied(offer.id, currentItems)) {
        // تحقق من أن الشروط لا تزال محققة للعرض المطبق
        const eligibility = await checkSingleOfferEligibility(offer, productId, quantity, currentItems, userType);
        if (!eligibility.isEligible && eligibility.message !== `تم تطبيق العرض: ${offer.title_ar || offer.title_en}`) {
          // الشروط لم تعد محققة، لكن العرض مطبق
          return {
            isEligible: false,
            offer,
            message: `⚠️ العرض مطبق لكن الشروط لم تعد محققة: ${eligibility.message}`,
            canApply: false
          };
        }
      }
    }

    return {
      isEligible: false,
      offer: null,
      message: "لم يتم تحقيق شروط أي عرض",
      canApply: false
    };
  } catch (error) {
    console.error("Error checking offer eligibility:", error);
    return {
      isEligible: false,
      offer: null,
      message: "خطأ في فحص العروض",
      canApply: false
    };
  }
}

/**
 * فحص عرض واحد فقط
 */
async function checkSingleOfferEligibility(
  offer: Offer,
  productId: string,
  quantity: number,
  currentItems: OrderItem[],
  userType: string
): Promise<OfferEligibility> {
  
  // أولاً تحقق من الشروط، ثم تحقق من التطبيق
  let conditionsMet = false;
  let conditionsMessage = "";
  
  // فحص نوع العرض وشروطه
  if (offer.offer_type === "discount") {
    // عروض الخصم العامة - تطبق على جميع المنتجات
    const minQuantity = (offer as any).min_quantity || 1;
    const minAmount = (offer as any).min_amount || 0;
    
    // فحص الكمية الدنيا
    if (quantity < minQuantity) {
      conditionsMessage = `الكمية الدنيا المطلوبة: ${minQuantity}`;
    } else if (minAmount > 0) {
      // فحص المبلغ الأدنى (إذا كان محدد)
      const currentTotal = currentItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      if (currentTotal < minAmount) {
        conditionsMessage = `المبلغ الأدنى المطلوب: ${minAmount} ₪`;
      } else {
        conditionsMet = true;
        conditionsMessage = `عرض خصم متاح: ${offer.title_ar || offer.title_en}`;
      }
    } else {
      conditionsMet = true;
      conditionsMessage = `عرض خصم متاح: ${offer.title_ar || offer.title_en}`;
    }
  } else if (offer.offer_type === "buy_get") {
    // عروض اشتري واحصل
    const linkedProductId = (offer as any).linked_product_id;
    const buyQuantity = (offer as any).buy_quantity || 1;
    
    // تحقق من أن المنتج الحالي هو المنتج المربوط بالعرض
    if (productId !== linkedProductId) {
      conditionsMessage = "هذا العرض لمنتج آخر";
    } else if (quantity < buyQuantity) {
      conditionsMessage = `اشتري ${buyQuantity} قطع للحصول على العرض`;
    } else {
      conditionsMet = true;
      conditionsMessage = `عرض اشتري واحصل متاح: ${offer.title_ar || offer.title_en}`;
    }
  } else {
    conditionsMessage = "نوع عرض غير مدعوم";
  }
  
  // إذا لم تتحقق الشروط، ارجع فوراً
  if (!conditionsMet) {
    return {
      isEligible: false,
      offer,
      message: conditionsMessage,
      canApply: false
    };
  }
  
  // الآن تحقق من أن العرض لم يتم تطبيقه بالفعل
  if (isOfferAlreadyApplied(offer.id, currentItems)) {
    return {
      isEligible: false, // الشروط محققة لكن العرض مطبق بالفعل
      offer,
      message: `تم تطبيق العرض: ${offer.title_ar || offer.title_en}`,
      canApply: false // لا يمكن تطبيقه مرة أخرى
    };
  }
  
  // الشروط محققة والعرض غير مطبق
  return {
    isEligible: true,
    offer,
    message: conditionsMessage,
    canApply: true
  };
}

/**
 * تطبيق العرض على المنتج
 */
export async function applyOfferToProduct(
  offer: Offer,
  productId: string,
  currentItems: OrderItem[],
  products: Product[],
  userType: string = 'retail'
): Promise<OrderItem[]> {
  try {
    // إنشاء نسخة جديدة من العناصر
    let updatedItems = [...currentItems];

    if (offer.offer_type === "buy_get") {
      const linkedProductId = (offer as any).linked_product_id;
      const getProductId = (offer as any).get_product_id;
      const buyQuantity = (offer as any).buy_quantity || 1;
      const getDiscountType = (offer as any).get_discount_type || "free";
      const getDiscountValue = (offer as any).get_discount_value || 0;

      const linkedItem = updatedItems.find(i => i.product_id === linkedProductId);
      const applicableTimes = linkedItem ? Math.floor((linkedItem.quantity || 0) / buyQuantity) : 0;

      // وسم عنصر الشراء بأنه حقق الشرط
      if (linkedItem && applicableTimes > 0) {
        Object.assign(linkedItem as any, {
          offer_trigger: true,
          offer_trigger_id: offer.id,
          offer_id: (linkedItem as any).offer_id ?? offer.id,
          offer_name: (linkedItem as any).offer_name ?? (offer.title_ar || offer.title_en),
        });
      }

      if (getDiscountType === "free") {
        // إضافة/تحديث منتج مجاني بعدد مرات الاستحقاق
        const freeProduct = products.find(p => p.id === getProductId);
        if (freeProduct && applicableTimes > 0) {
          const existingFreeItem = updatedItems.find(item => 
            item.product_id === getProductId && (item as any).is_free
          );

          const originalPrice = getDisplayPrice(freeProduct as any, userType);

          if (existingFreeItem) {
            (existingFreeItem as any).quantity = applicableTimes;
          } else {
            updatedItems.push({
              id: `free_${offer.id}_${getProductId}`,
              product_id: getProductId,
              quantity: applicableTimes,
              price: 0, // مجاني
              product_name: (freeProduct as any).name || (freeProduct as any).nameEn || "",
              is_free: true,
              original_price: originalPrice,
              offer_id: offer.id,
              offer_name: offer.title_ar || offer.title_en
            } as any);
          }
        }
      } else {
        // تطبيق خصم على المنتج المستهدف
        const targetItemIndex = updatedItems.findIndex(item => item.product_id === getProductId);
        const targetProduct = products.find(p => p.id === getProductId);
        
        if (targetProduct && applicableTimes > 0) {
          // حساب السعر الأصلي بناءً على نوع المستخدم
          const originalPrice = getDisplayPrice(targetProduct as any, userType);
          
          // حساب السعر بعد الخصم
          let discountedPrice = originalPrice;
          if (getDiscountType === "percentage") {
            discountedPrice = Math.max(0, originalPrice * (1 - getDiscountValue / 100));
          } else if (getDiscountType === "fixed") {
            discountedPrice = Math.max(0, originalPrice - getDiscountValue);
          }

          if (targetItemIndex !== -1) {
            // المنتج موجود في السلة - تحديث السعر
            const targetItem = updatedItems[targetItemIndex] as any;
            updatedItems[targetItemIndex] = {
              ...targetItem,
              price: discountedPrice,
              original_price: targetItem.original_price ?? originalPrice,
              offer_applied: true,
              offer_id: offer.id,
              offer_name: offer.title_ar || offer.title_en
            } as any;
          } else {
            // المنتج غير موجود في السلة - إضافته بالسعر المخفض
            updatedItems.push({
              id: `offer_${offer.id}_${getProductId}`,
              product_id: getProductId,
              quantity: 1,
              price: discountedPrice,
              product_name: (targetProduct as any).name || (targetProduct as any).nameEn || "",
              original_price: originalPrice,
              offer_applied: true,
              offer_id: offer.id,
              offer_name: offer.title_ar || offer.title_en
            } as any);
          }
        }
      }
    }

    if (offer.offer_type === "discount") {
      // خصم عام — وسم العناصر فقط (لا نغيّر الأسعار هنا، الحساب يتم عند التجميع)
      updatedItems = updatedItems.map((it: any) => {
        if (it.is_free) return it;
        return {
          ...it,
          offer_applied: true,
          offer_id: offer.id,
          offer_name: offer.title_ar || offer.title_en,
          original_price: typeof it.original_price === "number" ? it.original_price : it.price,
        };
      });
    }

    return updatedItems;
  } catch (error) {
    console.error("Error applying offer:", error);
    return currentItems;
  }
}

/**
 * إزالة العرض المطبق
 */
export function removeAppliedOffer(
  currentItems: OrderItem[],
  offerId: string
): OrderItem[] {
  return currentItems.filter(item => {
    // إزالة المنتجات المجانية من هذا العرض
    if ((item as any).is_free && (item as any).offer_id === offerId) {
      return false;
    }
    return true;
  }).map(item => {
    // إعادة السعر الأصلي للمنتجات التي تم تطبيق خصم عليها
    if ((item as any).offer_id === offerId && (item as any).original_price) {
      return {
        ...item,
        price: (item as any).original_price,
        original_price: undefined,
        offer_applied: undefined,
        offer_id: undefined,
        offer_name: undefined,
        offer_trigger: undefined,
        offer_trigger_id: undefined,
      } as OrderItem;
    }
    return item;
  });
}

/**
 * فحص ما إذا كان يمكن تطبيق عرض على الطلب الحالي
 */
export async function canApplyOfferToOrder(
  offer: Offer,
  currentItems: OrderItem[],
  userType: string = 'retail'
): Promise<boolean> {
  try {
    if (offer.offer_type === "discount") {
      const minQuantity = (offer as any).min_quantity || 1;
      const minAmount = (offer as any).min_amount || 0;
      
      const totalQuantity = currentItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = currentItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      return totalQuantity >= minQuantity && totalAmount >= minAmount;
    }
    
    if (offer.offer_type === "buy_get") {
      const linkedProductId = (offer as any).linked_product_id;
      const buyQuantity = (offer as any).buy_quantity || 1;
      
      const linkedItem = currentItems.find(item => item.product_id === linkedProductId);
      return linkedItem ? linkedItem.quantity >= buyQuantity : false;
    }
    
    return false;
  } catch (error) {
    console.error("Error checking offer applicability:", error);
    return false;
  }
}

/**
 * فحص ما إذا كان العرض مطبق بالفعل على الطلب
 */
export function isOfferAlreadyApplied(
  offerId: string,
  currentItems: OrderItem[]
): boolean {
  return currentItems.some(item => 
    ((item as any).offer_id === offerId) || 
    ((item as any).is_free && (item as any).offer_id === offerId)
  );
}

/**
 * الحصول على تفاصيل العرض المطبق
 */
export function getAppliedOfferDetails(
  currentItems: OrderItem[]
): Array<{ offerId: string; offerName: string; items: OrderItem[] }> {
  const appliedOffers: Record<string, { offerName: string; items: OrderItem[] }> = {};
  
  currentItems.forEach(item => {
    const offerId = (item as any).offer_id;
    const offerName = (item as any).offer_name;
    
    if (offerId && offerName) {
      if (!appliedOffers[offerId]) {
        appliedOffers[offerId] = { offerName, items: [] };
      }
      appliedOffers[offerId].items.push(item);
    }
  });
  
  return Object.entries(appliedOffers).map(([offerId, details]) => ({
    offerId,
    offerName: details.offerName,
    items: details.items
  }));
}
