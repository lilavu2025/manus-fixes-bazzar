import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { getDisplayPrice } from "@/utils/priceUtils";
import type { Product } from "@/types/product";

export type Offer = Database["public"]["Tables"]["offers"]["Row"];
export type OfferUsage = Database["public"]["Tables"]["offer_usage"]["Row"];

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

export interface AppliedOffer {
  offer: Offer;
  discountAmount: number;
  affectedProducts: string[];
  freeProducts?: { productId: string; quantity: number }[];
}

export interface OfferApplicationResult {
  appliedOffers: AppliedOffer[];
  totalDiscount: number;
  updatedItems: CartItem[];
  freeItems: CartItem[];
}

export class OfferService {
  /**
   * جلب العروض النشطة ضمن الفترة الحالية
   */
  static async getActiveOffers(): Promise<Offer[]> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("offers")
      .select("*")
      .eq("active", true)
      .lte("start_date", now)
      .gte("end_date", now)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching active offers:", error);
      return [];
    }

    return data || [];
  }

  /**
   * جلب منتجات بحسب IDs
   */
  static async getProducts(productIds: string[]): Promise<Product[]> {
    if (!productIds.length) return [];

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .in("id", productIds);

    if (error) {
      console.error("Error fetching products:", error);
      return [];
    }

    // تحويل البيانات إلى نوع Product
    return (data || []).map(product => ({
      id: product.id,
      name: product.name_ar,
      nameEn: product.name_en,
      nameHe: product.name_he,
      description: product.description_ar || "",
      descriptionEn: product.description_en || "",
      descriptionHe: product.description_he || "",
      price: product.price,
      originalPrice: product.original_price,
      wholesalePrice: product.wholesale_price,
      image: product.image,
      images: product.images || [],
      category: "",
      inStock: product.in_stock || false,
      rating: product.rating || 0,
      reviews: product.reviews_count || 0,
      discount: product.discount,
      featured: product.featured || false,
      tags: product.tags || [],
      stock_quantity: product.stock_quantity || 0
    }));
  }

  /**
   * تطبيق جميع العروض الفعالة على السلة — يرجّع:
   * - قائمة العروض المطبقة + مجموع الخصم
   * - العناصر المجانية الناتجة
   * - updatedItems (نفس الإدخال لأن CartItem لا يحتوي price)
   */
  static async applyOffers(
    cartItems: CartItem[],
    userType?: string
  ): Promise<OfferApplicationResult> {
    const activeOffers = await this.getActiveOffers();
    const appliedOffers: AppliedOffer[] = [];
    const freeItems: CartItem[] = [];
    let totalDiscount = 0;

    // نسخة محدثة من عناصر السلة
    const updatedItems = [...cartItems];

    for (const offer of activeOffers) {
      const application = await this.applyOfferToCart(
        offer,
        updatedItems,
        userType
      );

      if (application.discountAmount > 0 || application.freeProducts?.length) {
        appliedOffers.push(application);
        totalDiscount += application.discountAmount;

        // إضافة المنتجات المجانية
        if (application.freeProducts?.length) {
          const freeProductIds = application.freeProducts.map(fp => fp.productId);
          const freeProductsData = await this.getProducts(freeProductIds);

          for (const freeProduct of application.freeProducts) {
            const productData = freeProductsData.find(p => p.id === freeProduct.productId);
            if (productData) {
              freeItems.push({
                id: `free_${offer.id}_${freeProduct.productId}`,
                product: productData,
                quantity: freeProduct.quantity
              });
            }
          }
        }
      }
    }

    return {
      appliedOffers,
      totalDiscount,
      updatedItems,
      freeItems
    };
  }

  /**
   * تطبيق عرض واحد على السلة
   */
  private static async applyOfferToCart(
    offer: Offer,
    cartItems: CartItem[],
    userType?: string
  ): Promise<AppliedOffer> {
    if (offer.offer_type === "buy_get") {
      return this.applyBuyGetOffer(offer, cartItems, userType);
    } else {
      return this.applyDiscountOffer(offer, cartItems, userType);
    }
  }

  /**
   * buy X get Y (free/discount)
   */
  private static async applyBuyGetOffer(
    offer: Offer,
    cartItems: CartItem[],
    userType?: string
  ): Promise<AppliedOffer> {
    const result: AppliedOffer = {
      offer,
      discountAmount: 0,
      affectedProducts: [],
      freeProducts: []
    };

    const linkedProductId = (offer as any).linked_product_id;
    const getProductId = (offer as any).get_product_id;
    const buyQuantity = (offer as any).buy_quantity || 1;
    const getDiscountType = (offer as any).get_discount_type || "free";
    const getDiscountValue = (offer as any).get_discount_value || 0;

    if (!linkedProductId || !getProductId) {
      console.warn("Buy-get offer missing linked_product_id or get_product_id:", offer);
      return result;
    }

    // البحث عن المنتج المطلوب شراؤه في السلة
    const linkedItem = cartItems.find(item => item.product.id === linkedProductId);
    if (!linkedItem || linkedItem.quantity < buyQuantity) {
      return result;
    }

    // حساب عدد المرات التي يمكن تطبيق العرض فيها
    const applicableTimes = Math.floor(linkedItem.quantity / buyQuantity);
    result.affectedProducts.push(linkedProductId);

    if (getDiscountType === "free") {
      // منتج مجاني - جلب معلومات المنتج أولاً
      const getProducts = await this.getProducts([getProductId]);
      const getProduct = getProducts[0];
      if (getProduct) {
        result.freeProducts = [{ productId: getProductId, quantity: applicableTimes }];
      }
      return result;
    }

    // خصم على المنتج المحدد
    const getProducts = await this.getProducts([getProductId]);
    const getProduct = getProducts[0];
    if (!getProduct) return result;

    const targetItem = cartItems.find(item => item.product.id === getProductId);
    if (!targetItem) return result;

    const productPrice = getDisplayPrice(getProduct, userType);
    let discountPerProduct = 0;

    if (getDiscountType === "percentage") {
      discountPerProduct = (productPrice * getDiscountValue) / 100;
    } else if (getDiscountType === "fixed") {
      discountPerProduct = Math.min(getDiscountValue, productPrice);
    }

    const discountableQuantity = Math.min(targetItem.quantity, applicableTimes);
    result.discountAmount = discountPerProduct * discountableQuantity;
    result.affectedProducts.push(getProductId);

    return result;
  }

  /**
   * خصم عادي على العناصر (percentage/fixed)
   */
  private static async applyDiscountOffer(
    offer: Offer,
    cartItems: CartItem[],
    userType?: string
  ): Promise<AppliedOffer> {
    const result: AppliedOffer = {
      offer,
      discountAmount: 0,
      affectedProducts: []
    };

    // تطبيق الخصم على جميع المنتجات في السلة
    for (const item of cartItems) {
      const productPrice = getDisplayPrice(item.product, userType);
      let discountPerItem = 0;

      if (offer.discount_type === "percentage" && offer.discount_percentage) {
        discountPerItem = (productPrice * offer.discount_percentage) / 100;
      } else if (offer.discount_type === "fixed" && offer.discount_amount) {
        discountPerItem = Math.min(offer.discount_amount, productPrice);
      }

      if (discountPerItem > 0) {
        result.discountAmount += discountPerItem * item.quantity;
        result.affectedProducts.push(item.product.id);
      }
    }

    return result;
  }

  /**
   * تسجيل استخدام العرض
   */
  static async recordOfferUsage(
    offerId: string,
    orderId: string,
    userId: string | null,
    discountAmount: number
  ): Promise<void> {
    try {
      // تسجيل الاستخدام
      const { error: usageError } = await supabase
        .from("offer_usage")
        .insert({
          offer_id: offerId,
          order_id: orderId,
          user_id: userId,
          discount_amount: discountAmount
        });

      if (usageError) {
        console.error("Error recording offer usage:", usageError);
        return;
      }

      // ملاحظة: تحديث counters بهذه الطريقة بدائي — يفضّل triggers أو upserts تراكمية
      const { error: updateError } = await supabase
        .from("offers")
        .update({
          usage_count: 1,
          total_discount_given: discountAmount,
          total_orders: 1
        })
        .eq("id", offerId);

      if (updateError) {
        console.error("Error updating offer stats:", updateError);
      }
    } catch (error) {
      console.error("Error in recordOfferUsage:", error);
    }
  }

  /**
   * جلب إحصائيات العرض
   */
  static async getOfferStats(offerId: string) {
    try {
      const { data, error } = await supabase
        .from("offer_usage")
        .select("*")
        .eq("offer_id", offerId);

      if (error) {
        console.error("Error fetching offer stats:", error);
        return {
          usageCount: 0,
          totalDiscount: 0,
          totalOrders: 0,
          averageDiscount: 0
        };
      }

      const usageCount = data.length;
      const totalDiscount = data.reduce((sum, usage) => sum + usage.discount_amount, 0);
      const totalOrders = new Set(data.map(usage => usage.order_id)).size;
      const averageDiscount = usageCount > 0 ? totalDiscount / usageCount : 0;

      return {
        usageCount,
        totalDiscount,
        totalOrders,
        averageDiscount
      };
    } catch (error) {
      console.error("Error in getOfferStats:", error);
      return {
        usageCount: 0,
        totalDiscount: 0,
        totalOrders: 0,
        averageDiscount: 0
      };
    }
  }

  /**
   * جلب تحليلات العرض مع تفاصيل إضافية
   */
  static async getOfferAnalytics(offerId: string) {
    try {
      // حساب نقاط الأداء
      const basic = await this.getOfferStats(offerId);
      let performanceScore = 0;
      if (basic.usageCount > 0) {
        if (basic.usageCount >= 50) performanceScore = 5;
        else if (basic.usageCount >= 20) performanceScore = 4;
        else if (basic.usageCount >= 10) performanceScore = 3;
        else if (basic.usageCount >= 5) performanceScore = 2;
        else performanceScore = 1;
      }
      return {
        ...basic,
        orderCount: basic.totalOrders,
        performanceScore
      };
    } catch (error) {
      console.error("Error in getOfferAnalytics:", error);
      return {
        usageCount: 0,
        totalDiscount: 0,
        orderCount: 0,
        averageDiscount: 0,
        performanceScore: 0
      };
    }
  }

  /**
   * تحقق من صحة العرض على منتج معين
   */
  static async isOfferValidForProduct(
    offerId: string,
    productId: string
  ): Promise<boolean> {
    try {
      const { data: offer, error } = await supabase
        .from("offers")
        .select("*")
        .eq("id", offerId)
        .eq("active", true)
        .single();

      if (error || !offer) return false;

      const now = new Date();
      const startDate = new Date(offer.start_date);
      const endDate = new Date(offer.end_date);

      if (now < startDate || now > endDate) return false;

      // للعروض العادية، تطبق على جميع المنتجات
      if (offer.offer_type === "discount") return true;

      // لعروض اشتري واحصل، تحقق من المنتج المرتبط
      if (offer.offer_type === "buy_get") {
        const linkedProductId = (offer as any).linked_product_id;
        const getProductId = (offer as any).get_product_id;
        return productId === linkedProductId || productId === getProductId;
      }

      return false;
    } catch (error) {
      console.error("Error checking offer validity:", error);
      return false;
    }
  }

  /**
   * جلب العروض المتعلقة بمنتج معين
   */
  static async getOffersForProduct(productId: string): Promise<Offer[]> {
    try {
      const active = await this.getActiveOffers();

      return active.filter(offer => {
        if (offer.offer_type === "discount") return true;
        
        // عروض اشتري واحصل تطبق على المنتجات المرتبطة
        if (offer.offer_type === "buy_get") {
          const linkedProductId = (offer as any).linked_product_id;
          const getProductId = (offer as any).get_product_id;
          return productId === linkedProductId || productId === getProductId;
        }

        return false;
      });
    } catch (error) {
      console.error("Error getting offers for product:", error);
      return [];
    }
  }
}
