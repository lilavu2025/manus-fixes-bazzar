import { OfferService, type Offer } from "@/services/offerService";
import type { OrderItem } from "@/orders/order.types";
import type { Product } from "@/types/product";

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
      if (eligibility.isEligible) {
        return eligibility;
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
  
  // تحقق أولاً من أن العرض لم يتم تطبيقه بالفعل
  if (isOfferAlreadyApplied(offer.id, currentItems)) {
    return {
      isEligible: true, // العرض مؤهل لكن مطبق بالفعل
      offer,
      message: `تم تطبيق العرض: ${offer.title_ar || offer.title_en}`,
      canApply: false // لا يمكن تطبيقه مرة أخرى
    };
  }
  
  // فحص نوع العرض
  if (offer.offer_type === "discount") {
    // عروض الخصم العامة - تطبق على جميع المنتجات
    const minQuantity = (offer as any).min_quantity || 1;
    const minAmount = (offer as any).min_amount || 0;
    
    // فحص الكمية الدنيا
    if (quantity < minQuantity) {
      return {
        isEligible: false,
        offer,
        message: `الكمية الدنيا المطلوبة: ${minQuantity}`,
        canApply: false
      };
    }

    // فحص المبلغ الأدنى (إذا كان محدد)
    if (minAmount > 0) {
      const currentTotal = currentItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      if (currentTotal < minAmount) {
        return {
          isEligible: false,
          offer,
          message: `المبلغ الأدنى المطلوب: ${minAmount} ₪`,
          canApply: false
        };
      }
    }

    return {
      isEligible: true,
      offer,
      message: `عرض خصم متاح: ${offer.title_ar || offer.title_en}`,
      canApply: true
    };
  }
  
  if (offer.offer_type === "buy_get") {
    // عروض اشتري واحصل
    const linkedProductId = (offer as any).linked_product_id;
    const buyQuantity = (offer as any).buy_quantity || 1;
    
    // تحقق من أن المنتج الحالي هو المنتج المربوط بالعرض
    if (productId !== linkedProductId) {
      return {
        isEligible: false,
        offer,
        message: "هذا العرض لمنتج آخر",
        canApply: false
      };
    }

    // تحقق من الكمية المطلوبة
    if (quantity < buyQuantity) {
      return {
        isEligible: false,
        offer,
        message: `اشتري ${buyQuantity} قطع للحصول على العرض`,
        canApply: false
      };
    }

    return {
      isEligible: true,
      offer,
      message: `عرض اشتري واحصل متاح: ${offer.title_ar || offer.title_en}`,
      canApply: true
    };
  }

  return {
    isEligible: false,
    offer,
    message: "نوع عرض غير مدعوم",
    canApply: false
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
      const getProductId = (offer as any).get_product_id;
      const getDiscountType = (offer as any).get_discount_type;
      const getDiscountValue = (offer as any).get_discount_value || 0;

      if (getDiscountType === "free") {
        // إضافة منتج مجاني
        const freeProduct = products.find(p => p.id === getProductId);
        if (freeProduct) {
          // تحقق من أن المنتج المجاني غير موجود بالفعل
          const existingFreeItem = updatedItems.find(item => 
            item.product_id === getProductId && (item as any).is_free
          );

          if (!existingFreeItem) {
            // حساب السعر الأصلي للمنتج المجاني بناءً على نوع المستخدم
            let originalPrice = freeProduct.price;
            if (userType === 'admin' || userType === 'wholesale') {
              const wholesalePrice = (freeProduct as any).wholesale_price || (freeProduct as any).wholesalePrice || 0;
              if (wholesalePrice > 0) {
                originalPrice = wholesalePrice;
              }
            }

            updatedItems.push({
              id: `free_${offer.id}_${getProductId}`,
              product_id: getProductId,
              quantity: 1,
              price: 0, // مجاني
              product_name: freeProduct.name || freeProduct.nameEn || "",
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
        
        if (targetProduct) {
          // حساب السعر الأصلي بناءً على نوع المستخدم
          let originalPrice = targetProduct.price;
          if (userType === 'admin' || userType === 'wholesale') {
            const wholesalePrice = (targetProduct as any).wholesale_price || (targetProduct as any).wholesalePrice || 0;
            if (wholesalePrice > 0) {
              originalPrice = wholesalePrice;
            }
          }
          
          // حساب السعر بعد الخصم
          let discountedPrice = originalPrice;
          if (getDiscountType === "percentage") {
            discountedPrice = originalPrice * (1 - getDiscountValue / 100);
          } else if (getDiscountType === "fixed") {
            discountedPrice = Math.max(0, originalPrice - getDiscountValue);
          }

          if (targetItemIndex !== -1) {
            // المنتج موجود في السلة - تحديث السعر
            const targetItem = updatedItems[targetItemIndex];
            updatedItems[targetItemIndex] = {
              ...targetItem,
              price: discountedPrice,
              original_price: originalPrice,
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
              product_name: targetProduct.name || targetProduct.nameEn || "",
              original_price: originalPrice,
              offer_applied: true,
              offer_id: offer.id,
              offer_name: offer.title_ar || offer.title_en
            } as any);
          }
        }
      }
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
        offer_name: undefined
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
