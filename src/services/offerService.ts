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
  // Optional variant identifier to enable variant-scoped offers
  variantId?: string;
  // Optional selected variant attributes (option name -> value)
  variantAttributes?: Record<string, string>;
}

export interface AppliedOffer {
  offer: Offer;
  discountAmount: number;
  affectedProducts: string[];
  freeProducts?: { productId: string; quantity: number; variantId?: string; variantAttributes?: Record<string, string> }[];
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

          // Resolve a variant if possible and attach to both freeItems and applied_offers.freeProducts
          for (let i = 0; i < application.freeProducts.length; i++) {
            const freeProduct = application.freeProducts[i];
            const productData = freeProductsData.find(p => p.id === freeProduct.productId);
            if (!productData) continue;

            let variantId: string | undefined = freeProduct.variantId;
            let variantAttributes: Record<string, string> | undefined = freeProduct.variantAttributes;

            try {
              const { data: variants, error } = await supabase
                .rpc('get_product_variants' as any, { p_product_id: freeProduct.productId });
              if (!error && Array.isArray(variants) && variants.length > 0) {
                let chosen = variants[0] as any;
                if (variantId) {
                  const match = variants.find((v: any) => String(v.id) === String(variantId));
                  if (match) chosen = match;
                }
                variantId = String(chosen.id);
                if (chosen?.option_values && typeof chosen.option_values === 'object') {
                  variantAttributes = chosen.option_values as Record<string, string>;
                }
              }
            } catch {
              // ignore variant fetch errors
            }

            // enrich applied offer entry as well
            application.freeProducts[i] = {
              ...freeProduct,
              variantId,
              variantAttributes,
            };

            // push to freeItems list for order.free_items payload
            freeItems.push({
              id: `free_${offer.id}_${freeProduct.productId}`,
              product: productData,
              quantity: freeProduct.quantity,
              variantId,
              variantAttributes,
            });
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

    // تحليل شروط النطاق للفيرنتس (اختياري)
    let tc: any = null;
    if (typeof (offer as any).terms_and_conditions === 'string' && (offer as any).terms_and_conditions.trim()) {
      try { tc = JSON.parse((offer as any).terms_and_conditions); } catch {}
    }

    // تصفية عناصر الشراء بحسب نطاق الفيرنتس إن وجد
    const buyItems = cartItems.filter(item => item.product.id === linkedProductId).filter(item => {
      if (!tc || !tc.buy_variant_scope || tc.buy_variant_scope === 'all') return true;
      if (tc.buy_variant_scope === 'specific') {
        return !!item.variantId && Array.isArray(tc.buy_variant_ids) && tc.buy_variant_ids.includes(item.variantId);
      }
      return true;
    });

    const totalBuyQty = buyItems.reduce((sum, it) => sum + it.quantity, 0);
    if (totalBuyQty < buyQuantity) {
      return result;
    }

    // حساب عدد المرات التي يمكن تطبيق العرض فيها (بناءً على مجموع الكمية المؤهلة)
    const applicableTimes = Math.floor(totalBuyQty / buyQuantity);
    result.affectedProducts.push(linkedProductId);

    if (getDiscountType === "free") {
      // منتج مجاني - جلب معلومات المنتج أولاً
      const getProducts = await this.getProducts([getProductId]);
      const getProduct = getProducts[0];
      if (getProduct) {
        // Try to respect variant scope if specified
        let chosenVariantId: string | undefined = undefined;
        if (tc && tc.get_variant_scope === 'specific' && Array.isArray((tc as any).get_variant_ids) && (tc as any).get_variant_ids.length > 0) {
          chosenVariantId = String((tc as any).get_variant_ids[0]);
        }
        result.freeProducts = [{ productId: getProductId, quantity: applicableTimes, variantId: chosenVariantId }];
      }
      return result;
    }

    // خصم على المنتج المحدد
    const getProducts = await this.getProducts([getProductId]);
    const getProduct = getProducts[0];
    if (!getProduct) return result;

    // تصفية عناصر الحصول بحسب نطاق الفيرنتس إن وجد
    const getItems = cartItems.filter(item => item.product.id === getProductId).filter(item => {
      if (!tc || !tc.get_variant_scope || tc.get_variant_scope === 'all') return true;
      if (tc.get_variant_scope === 'specific') {
        return !!item.variantId && Array.isArray(tc.get_variant_ids) && tc.get_variant_ids.includes(item.variantId);
      }
      return true;
    });
    const totalGetQty = getItems.reduce((sum, it) => sum + it.quantity, 0);
    if (totalGetQty <= 0) return result;

    const productPrice = getDisplayPrice(getProduct, userType);
    let discountPerProduct = 0;

    if (getDiscountType === "percentage") {
      discountPerProduct = (productPrice * getDiscountValue) / 100;
    } else if (getDiscountType === "fixed") {
      discountPerProduct = Math.min(getDiscountValue, productPrice);
    }

  const discountableQuantity = Math.min(totalGetQty, applicableTimes);
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

    const isProductSpecific = (offer as any).offer_type === "product_discount";
    // Optional: parse terms_and_conditions JSON for variant scope
    let tc: { variant_scope?: 'all' | 'specific'; variant_ids?: string[] } | null = null;
    if (isProductSpecific && typeof offer.terms_and_conditions === 'string' && offer.terms_and_conditions.trim()) {
      try {
        tc = JSON.parse(offer.terms_and_conditions) as any;
      } catch {
        tc = null;
      }
    }

    // تطبيق الخصم
    for (const item of cartItems) {
      // Filter applicability
      if (isProductSpecific) {
        const linkedProductId = (offer as any).linked_product_id;
        if (!linkedProductId || item.product.id !== linkedProductId) {
          continue; // only applies to the linked product
        }
        if (tc && tc.variant_scope === 'specific') {
          // If specific variants are selected, require a matching variantId
          if (!item.variantId || !Array.isArray(tc.variant_ids) || !tc.variant_ids.includes(item.variantId)) {
            continue;
          }
        }
      }

      const productPrice = getDisplayPrice(item.product, userType);
      let discountPerItem = 0;

      if (offer.discount_type === "percentage" && offer.discount_percentage) {
        discountPerItem = (productPrice * offer.discount_percentage) / 100;
      } else if (offer.discount_type === "fixed" && offer.discount_amount) {
        discountPerItem = Math.min(offer.discount_amount, productPrice);
      }

      if (discountPerItem > 0) {
        result.discountAmount += discountPerItem * item.quantity;
        if (!result.affectedProducts.includes(item.product.id)) {
          result.affectedProducts.push(item.product.id);
        }
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
  // ملاحظة: سيتم حساب إحصائيات العرض عبر offer_usage أو عبر view/trigger في قاعدة البيانات.
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
        if (offer.offer_type === "product_discount") {
          const linkedProductId = (offer as any).linked_product_id;
          return productId === linkedProductId;
        }
        
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
