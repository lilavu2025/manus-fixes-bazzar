import * as React from "react";
import { X, Minus, Plus, ShoppingBag, Trash2, Tag, Gift, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/useCart";
import { useLanguage } from "@/utils/languageContextUtils";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import { useEnhancedToast } from "@/hooks/useEnhancedToast";
import { getLocalizedName } from "@/utils/getLocalizedName";
import { getDisplayPrice } from "@/utils/priceUtils";
import type { Product as ProductFull } from '@/types/product';
import QuantitySelector from "@/components/QuantitySelector";
import useOffers from "@/hooks/useOffers";
import ProductPriceWithOffers from "@/components/ProductPriceWithOffers";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose }) => {
  const { state, updateQuantity, removeItem, getTotalItems, getTotalPrice, addItem } = useCart();
  const cartItems = state.items;
  const { t, isRTL, language } = useLanguage();
  const { user, profile } = useAuth();
  const enhancedToast = useEnhancedToast();
  const navigate = useNavigate();
  const { applyOffersToCart } = useOffers();
  
  // حالة العروض المطبقة
  const [appliedOffers, setAppliedOffers] = useState({
    appliedOffers: [],
    totalDiscount: 0,
    updatedItems: [],
    freeItems: []
  });
  const [offersLoading, setOffersLoading] = useState(false);

  // حالة العروض المتاحة للتحفيز
  const [availableOffers, setAvailableOffers] = useState([]);

  // تطبيق العروض عند تغيير السلة
  useEffect(() => {
    const applyOffers = async () => {
      if (!cartItems.length) {
        setAppliedOffers({
          appliedOffers: [],
          totalDiscount: 0,
          updatedItems: [],
          freeItems: []
        });
        setAvailableOffers([]);
        return;
      }

      try {
        setOffersLoading(true);
        const result = await applyOffersToCart(cartItems);
        setAppliedOffers(result);
        
        // العثور على العروض المتاحة للتحفيز
        const incentiveOffers = await findIncentiveOffers(cartItems);
        setAvailableOffers(incentiveOffers);
      } catch (error) {
        console.error("Error applying offers:", error);
      } finally {
        setOffersLoading(false);
      }
    };

    applyOffers();
  }, [cartItems, applyOffersToCart]);

  // دالة للعثور على العروض التي تحتاج إلى منتج مستهدف أو تحفيز لزيادة الكمية
  const findIncentiveOffers = async (cartItems: any[]) => {
    try {
      console.log('🔍 البحث عن عروض التحفيز...');
      console.log('عناصر السلة:', cartItems);

      const { data: offers, error } = await supabase
        .from('offers')
        .select(`
          id,
          title_ar,
          title_en,
          offer_type,
          linked_product_id,
          buy_quantity,
          get_product_id,
          get_discount_type,
          get_discount_value,
          active,
          start_date,
          end_date
        `)
        .eq('active', true)
        .eq('offer_type', 'buy_get')
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString());

      console.log('عروض buy_get الموجودة:', offers);
      console.log('خطأ في جلب العروض:', error);

      if (error) throw error;

      const incentiveOffers = [];

      for (const offer of offers || []) {
        console.log('فحص العرض:', offer);
        
        const linkedProductId = offer.linked_product_id;
        const buyQuantity = offer.buy_quantity || 1;
        const getProductId = offer.get_product_id;

        console.log(`البحث عن المنتج المؤهل ${linkedProductId} بكمية ${buyQuantity}`);
        console.log(`المنتج المستهدف: ${getProductId}`);

        // العثور على المنتج المؤهل في السلة
        const qualifyingItem = cartItems.find(item => item.product.id === linkedProductId);
        const targetItem = cartItems.find(item => item.product.id === getProductId);

        console.log('المنتج المؤهل في السلة:', qualifyingItem);
        console.log('المنتج المستهدف في السلة:', targetItem);

        // إذا كان المنتج المؤهل موجود بالكمية المطلوبة ولكن المنتج المستهدف غير موجود
        if (qualifyingItem && qualifyingItem.quantity >= buyQuantity && !targetItem) {
          console.log('✅ العرض مؤهل للعرض! جلب تفاصيل المنتج المستهدف...');
          
          // إذا كان العرض مجاني، لا نعرض تحفيز لأنه يُضاف تلقائياً
          if (offer.get_discount_type === "free") {
            console.log('🎁 العرض مجاني - لا حاجة لعرض تحفيز');
            continue;
          }
          
          const { data: targetProduct, error: productError } = await supabase
            .from('products')
            .select(`
              id,
              name_ar,
              name_en,
              name_he,
              image,
              price,
              wholesale_price,
              in_stock,
              stock_quantity
            `)
            .eq('id', getProductId)
            .single();

          console.log('تفاصيل المنتج المستهدف:', targetProduct);
          console.log('خطأ في جلب المنتج:', productError);

          if (!productError && targetProduct) {
            console.log('✅ تم إضافة العرض التحفيزي بنجاح');
            incentiveOffers.push({
              type: 'add_target_product',
              offer,
              targetProduct,
              qualifyingProduct: qualifyingItem.product,
              qualifyingQuantity: qualifyingItem.quantity
            });
          } else {
            console.log('❌ فشل في جلب المنتج المستهدف:', productError);
          }
        } 
        // إذا كان المنتج المؤهل موجود لكن بكمية أقل من المطلوبة (ضمن 50% من الكمية المطلوبة)
        else if (qualifyingItem && qualifyingItem.quantity < buyQuantity) {
          const percentage = (qualifyingItem.quantity / buyQuantity) * 100;
          const threshold = 50; // حد التحفيز - إذا وصل لـ 50% من الكمية المطلوبة
          
          if (percentage >= threshold) {
            console.log(`🎯 تحفيز لزيادة الكمية! الكمية الحالية: ${qualifyingItem.quantity}/${buyQuantity} (${percentage.toFixed(0)}%)`);
            
            const { data: targetProduct, error: productError } = await supabase
              .from('products')
              .select(`
                id,
                name_ar,
                name_en,
                name_he,
                image,
                price,
                wholesale_price,
                in_stock,
                stock_quantity
              `)
              .eq('id', getProductId)
              .single();

            if (!productError && targetProduct) {
              incentiveOffers.push({
                type: 'increase_quantity',
                offer,
                targetProduct,
                qualifyingProduct: qualifyingItem.product,
                qualifyingQuantity: qualifyingItem.quantity,
                requiredQuantity: buyQuantity,
                missingQuantity: buyQuantity - qualifyingItem.quantity
              });
            }
          }
        } else {
          console.log('❌ العرض غير مؤهل:', {
            hasQualifyingItem: !!qualifyingItem,
            qualifyingQuantity: qualifyingItem?.quantity,
            requiredQuantity: buyQuantity,
            hasTargetItem: !!targetItem
          });
        }
      }

      console.log('عروض التحفيز النهائية:', incentiveOffers);
      return incentiveOffers;
    } catch (error) {
      console.error("❌ خطأ في العثور على عروض التحفيز:", error);
      return [];
    }
  };

  // دالة لإضافة المنتج المستهدف للاستفادة من العرض
  const addTargetProduct = async (targetProduct: any) => {
    try {
      // تحويل البيانات لتتوافق مع نوع Product المتوقع
      const productToAdd = {
        ...targetProduct,
        inStock: targetProduct.in_stock,
        // إضافة أي حقول مطلوبة أخرى
        description: targetProduct.description || '',
        descriptionEn: targetProduct.description_en || '',
        descriptionHe: targetProduct.description_he || '',
        category_id: targetProduct.category_id || '',
        brand: targetProduct.brand || '',
        created_at: targetProduct.created_at || new Date().toISOString(),
        updated_at: targetProduct.updated_at || new Date().toISOString()
      };

      // إضافة المنتج بكمية 1 إلى السلة
      await addItem(productToAdd, 1);
      
      enhancedToast.success(
        `${getLocalizedName(targetProduct, language)} ${t("addedToCart")}`
      );
    } catch (error) {
      console.error("Error adding target product:", error);
      enhancedToast.error(t("errorAddingToCart"));
    }
  };

  // دالة لزيادة كمية المنتج المؤهل
  const increaseQualifyingQuantity = async (productId: string, currentQuantity: number, requiredQuantity: number) => {
    try {
      const missingQuantity = requiredQuantity - currentQuantity;
      const cartItem = cartItems.find(item => item.product.id === productId);
      
      if (cartItem) {
        await updateQuantity(cartItem.id, requiredQuantity, productId);
        enhancedToast.success(
          `تم زيادة الكمية لتحقيق شروط العرض! (+${missingQuantity})`
        );
      }
    } catch (error) {
      console.error("Error increasing quantity:", error);
      enhancedToast.error("خطأ في زيادة الكمية");
    }
  };

  // دالة مخصصة للتعامل مع الدفع
  const handleCheckoutClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      
      // حفظ نية الدفع قبل التوجيه لتسجيل الدخول
      const checkoutIntent = {
        action: 'checkout',
        timestamp: Date.now(),
        fromCart: true // إشارة أنه قادم من السلة وليس buyNow
      };
      
      localStorage.setItem('checkout_intent', JSON.stringify(checkoutIntent));
      
      // إغلاق السلة أولاً
      onClose();
      
      // التوجه لتسجيل الدخول مع redirect parameter فوراً
      navigate('/auth?redirect=checkout');
    } else {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 ${isRTL ? "left-0" : "right-0"} h-full w-full sm:max-w-md bg-white z-50 transform transition-transform duration-300 shadow-2xl ${
          isOpen
            ? "translate-x-0"
            : isRTL
              ? "-translate-x-full"
              : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <h2 className="text-lg sm:text-xl font-bold">{t("cart")}</h2>
              {getTotalItems() > 0 && (
                <Badge variant="secondary">{getTotalItems()}</Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 sm:h-10 sm:w-10"
              aria-label="إغلاق السلة" /* Close cart */
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </div>

          {/* Content */}
          {cartItems.length === 0 ? (
            <div className="flex-1 flex items-center justify-center flex-col gap-4 p-4 sm:p-6">
              <ShoppingBag className="h-16 w-16 sm:h-24 sm:w-24 text-gray-300" />
              <div className="text-center">
                <h3 className="text-base sm:text-lg font-semibold text-gray-600 mb-2">
                  {t("cartEmpty")}
                </h3>
                <p className="text-sm sm:text-base text-gray-500 mb-4">{t("noProductsAdded")}</p>
                <Button onClick={onClose} asChild className="text-sm sm:text-base">
                  <Link to="/products">{t("browseProducts")}</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Items */}
              <ScrollArea className="flex-1 p-3 sm:p-4">
                <div className="space-y-3 sm:space-y-4">
                  {/* عناصر السلة العادية */}
                  {cartItems.map((item) => {
                    // العثور على الخصم المطبق على هذا المنتج فقط
                    const productDiscount = appliedOffers.appliedOffers
                      .filter(offer => {
                        // للعروض العادية
                        if ((offer.offer as any).offer_type === 'discount' || (offer.offer as any).offer_type === 'product_discount') {
                          return offer.affectedProducts.includes(item.product.id);
                        }
                        
                        // لعروض اشتري واحصل - فقط المنتج المستهدف للخصم
                        if ((offer.offer as any).offer_type === 'buy_get') {
                          const getProductId = (offer.offer as any).get_product_id;
                          const getDiscountType = (offer.offer as any).get_discount_type;
                          
                          // فقط إذا كان هذا المنتج هو المستهدف للخصم وليس منتج مجاني
                          return item.product.id === getProductId && getDiscountType !== 'free';
                        }
                        
                        return false;
                      })
                      .reduce((total, offer) => {
                        if ((offer.offer as any).offer_type === 'buy_get') {
                          // عرض اشتري واحصل - نطبق الخصم الكامل على المنتج المستهدف
                          return total + offer.discountAmount;
                        } else {
                          // عرض عادي - نحسب نسبة المنتج من إجمالي العرض
                          const productValue = getDisplayPrice(item.product, profile?.user_type) * item.quantity;
                          const totalOfferedProductsValue = offer.affectedProducts.reduce((sum, productId) => {
                            const cartItem = cartItems.find(ci => ci.product.id === productId);
                            if (cartItem) {
                              return sum + (getDisplayPrice(cartItem.product, profile?.user_type) * cartItem.quantity);
                            }
                            return sum;
                          }, 0);
                          
                          const productRatio = totalOfferedProductsValue > 0 ? productValue / totalOfferedProductsValue : 0;
                          return total + (offer.discountAmount * productRatio);
                        }
                      }, 0);

                    return (
                      <div
                        key={item.id}
                        className={`flex ${isRTL ? "flex-row-reverse" : "flex-row"} gap-4 p-4 bg-gray-50 rounded-lg shadow-md animate-fade-in relative`}
                      >
                        <div 
                          className="w-16 h-16 sm:w-20 sm:h-20 bg-center bg-contain bg-no-repeat rounded-lg flex-shrink-0 border border-gray-200"
                          style={{ backgroundImage: `url(${item.product.image})` }}
                        />

                        <div className={`flex-1 flex flex-col justify-between ${isRTL ? "items-end" : "items-start"}`}>
                          <div>
                            <h4 className="font-semibold text-sm sm:text-base mb-1 line-clamp-2">
                              {getLocalizedName(item.product, language)}
                            </h4>
                            {/* Product description */}
                            <p className={`text-gray-500 text-xs sm:text-sm mb-1 line-clamp-2 ${isRTL ? "text-right" : "text-left"}`}>
                              {item.product.description || item.product.descriptionEn || item.product.descriptionHe}
                            </p>
                            
                            {/* عرض السعر مع الخصم */}
                            <ProductPriceWithOffers 
                              product={item.product}
                              appliedDiscount={productDiscount}
                              quantity={item.quantity}
                              className="text-sm"
                              showSavings={productDiscount > 0}
                            />
                            
                            {/* عرض العروض المطبقة على هذا المنتج */}
                            {appliedOffers.appliedOffers
                              .filter(offer => {
                                // للعروض العادية
                                if ((offer.offer as any).offer_type === 'discount' || (offer.offer as any).offer_type === 'product_discount') {
                                  return offer.affectedProducts.includes(item.product.id);
                                }
                                
                                // لعروض اشتري واحصل
                                if ((offer.offer as any).offer_type === 'buy_get') {
                                  const linkedProductId = (offer.offer as any).linked_product_id;
                                  const getProductId = (offer.offer as any).get_product_id;
                                  const getDiscountType = (offer.offer as any).get_discount_type;
                                  
                                  // إظهار البادج على المنتج المحقق للشروط (بدون خصم)
                                  if (item.product.id === linkedProductId) {
                                    return true;
                                  }
                                  
                                  // إظهار البادج على المنتج المستهدف (مع خصم)
                                  if (item.product.id === getProductId && getDiscountType !== 'free') {
                                    return true;
                                  }
                                }
                                
                                return false;
                              })
                              .map((offer, index) => {
                                const offerType = (offer.offer as any).offer_type;
                                const linkedProductId = (offer.offer as any).linked_product_id;
                                const getProductId = (offer.offer as any).get_product_id;
                                let offerText = (offer.offer as any).title_ar || (offer.offer as any).title_en || t("offer");
                                
                                // إذا كان عرض "اشتري واحصل" نوضح التفاصيل
                                if (offerType === "buy_get") {
                                  const getDiscountType = (offer.offer as any).get_discount_type;
                                  const getDiscountValue = (offer.offer as any).get_discount_value;
                                  const buyQuantity = (offer.offer as any).buy_quantity || 1;
                                  
                                  if (item.product.id === linkedProductId) {
                                    // المنتج المحقق للشروط
                                    offerText = `${t("buyGetOffer")}: اشتري ${buyQuantity}`;
                                  } else if (item.product.id === getProductId) {
                                    // المنتج المستهدف للخصم
                                    if (getDiscountType === "percentage") {
                                      offerText = `${t("buyGetOffer")}: خصم ${getDiscountValue}%`;
                                    } else if (getDiscountType === "fixed") {
                                      offerText = `${t("buyGetOffer")}: خصم ${getDiscountValue} ${t("currency")}`;
                                    }
                                  }
                                }
                                
                                return (
                                  <div key={index} className="mt-1">
                                    <Badge 
                                      variant="secondary" 
                                      className={`text-xs ${
                                        item.product.id === linkedProductId 
                                          ? 'bg-blue-100 text-blue-700' 
                                          : 'bg-green-100 text-green-700'
                                      }`}
                                    >
                                      <Tag className="h-3 w-3 mr-1" />
                                      {offerText}
                                    </Badge>
                                  </div>
                                );
                              })
                            }
                          </div>

                          <div className={`flex items-center justify-between mt-2 ${isRTL ? "flex-row-reverse" : "flex-row"}`}>
                            <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : "flex-row"}`}>
                              <div className={`flex items-center justify-center lg:justify-start gap-4 sm:gap-8 lg:gap-12 w-full ${isRTL ? "flex-row-reverse" : "flex-row"}`}>
                                <label className={`block text-xs sm:text-sm font-semibold ${isRTL ? "flex-row-reverse" : "flex-row"}`}>
                                  {t("quantity")}
                                </label>
                                <QuantitySelector 
                                  quantity={item.quantity}
                                  onQuantityChange={(newQuantity) => {
                                    const totalQuantityInCart = cartItems.reduce((acc, cartItem) => {
                                      return cartItem.id === item.id ? acc + newQuantity : acc + cartItem.quantity;
                                    }, 0);

                                    if (totalQuantityInCart > item.product.stock_quantity) {
                                      enhancedToast.error(t("exceededStockQuantity"));
                                    } else {
                                      updateQuantity(item.id, newQuantity, item.product.id);
                                    }
                                  }}
                                  max={item.product.stock_quantity}
                                  min={1}
                                  disabled={!item.product.inStock}
                                />
                              </div>
                            </div>
                          </div>

                          {/* عرض تحفيزي لإضافة منتج مستهدف أو زيادة الكمية */}
                          {availableOffers
                            .filter(incentiveOffer => incentiveOffer.offer.linked_product_id === item.product.id)
                            .map((incentiveOffer, index) => {
                              const offer = incentiveOffer.offer;
                              const targetProduct = incentiveOffer.targetProduct;
                              
                              let discountText = "";
                              if (offer.get_discount_type === "percentage") {
                                discountText = `خصم ${offer.get_discount_value}%`;
                              } else if (offer.get_discount_type === "fixed") {
                                discountText = `خصم ${offer.get_discount_value} ${t("currency")}`;
                              } else if (offer.get_discount_type === "free") {
                                discountText = t("freeItem");
                              }

                              // عرض مختلف حسب نوع التحفيز
                              if (incentiveOffer.type === 'add_target_product') {
                                return (
                                  <div key={`incentive-${index}`} className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Gift className="h-4 w-4 text-orange-600" />
                                      <span className="text-xs font-semibold text-orange-700">🎁 عرض خاص متاح!</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                      <div 
                                        className="w-12 h-12 bg-center bg-contain bg-no-repeat rounded-md border border-orange-200"
                                        style={{ backgroundImage: `url(${targetProduct.image})` }}
                                      />
                                      
                                      <div className="flex-1">
                                        <p className="text-xs text-orange-700 mb-1">
                                          أضف <span className="font-semibold">{getLocalizedName(targetProduct, language)}</span> واحصل على {discountText}
                                        </p>
                                        
                                        <div className="flex items-center gap-2">
                                          {offer.get_discount_type !== "free" && (
                                            <>
                                              <span className="text-xs text-gray-500 line-through">
                                                {getDisplayPrice(targetProduct, profile?.user_type).toFixed(2)} {t("currency")}
                                              </span>
                                              <span className="text-xs text-orange-600 font-bold">
                                                {offer.get_discount_type === "percentage" 
                                                  ? (getDisplayPrice(targetProduct, profile?.user_type) * (1 - offer.get_discount_value / 100)).toFixed(2)
                                                  : (getDisplayPrice(targetProduct, profile?.user_type) - offer.get_discount_value).toFixed(2)
                                                } {t("currency")}
                                              </span>
                                            </>
                                          )}
                                          {offer.get_discount_type === "free" && (
                                            <span className="text-xs text-green-600 font-bold">مجاني!</span>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {/* زر الإضافة فقط إذا لم يكن المنتج مجاني */}
                                      {offer.get_discount_type !== "free" && (
                                        <Button
                                          size="sm"
                                          className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-2 py-1 h-7"
                                          onClick={() => addTargetProduct(targetProduct)}
                                          disabled={!targetProduct.in_stock}
                                        >
                                          {t("addToCart")}
                                        </Button>
                                      )}
                                      
                                      {/* رسالة للمنتج المجاني */}
                                      {offer.get_discount_type === "free" && (
                                        <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded border">
                                          ✨ يُضاف تلقائياً
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              } 
                              // عرض تحفيز زيادة الكمية
                              else if (incentiveOffer.type === 'increase_quantity') {
                                const missingQuantity = incentiveOffer.missingQuantity;
                                const currentQuantity = incentiveOffer.qualifyingQuantity;
                                const requiredQuantity = incentiveOffer.requiredQuantity;
                                
                                return (
                                  <div key={`quantity-incentive-${index}`} className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">!</span>
                                      </div>
                                      <span className="text-xs font-semibold text-blue-700">⚡ أنت قريب من العرض!</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                      <div 
                                        className="w-12 h-12 bg-center bg-contain bg-no-repeat rounded-md border border-blue-200"
                                        style={{ backgroundImage: `url(${targetProduct.image})` }}
                                      />
                                      
                                      <div className="flex-1">
                                        <div className="mb-2">
                                          <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                                            <div 
                                              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                              style={{ width: `${(currentQuantity / requiredQuantity) * 100}%` }}
                                            />
                                          </div>
                                          <p className="text-xs text-blue-700">
                                            {currentQuantity}/{requiredQuantity} - أضف {missingQuantity} للحصول على <span className="font-semibold">{getLocalizedName(targetProduct, language)} {discountText}</span>
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <Button
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 h-7"
                                        onClick={() => increaseQualifyingQuantity(item.product.id, currentQuantity, requiredQuantity)}
                                        disabled={!item.product.inStock}
                                      >
                                        +{missingQuantity}
                                      </Button>
                                    </div>
                                  </div>
                                );
                              }

                              return null;
                            })
                          }

                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 absolute top-2 end-2"
                            onClick={() => removeItem(item.id, item.product.id)}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* عناصر مجانية من العروض */}
                  {appliedOffers.freeItems.map((freeItem) => (
                    <div
                      key={freeItem.id}
                      className={`flex ${isRTL ? "flex-row-reverse" : "flex-row"} gap-4 p-4 bg-green-50 rounded-lg shadow-md animate-fade-in relative border-2 border-green-200`}
                    >
                      <div 
                        className="w-16 h-16 sm:w-20 sm:h-20 bg-center bg-contain bg-no-repeat rounded-lg flex-shrink-0 border border-green-300"
                        style={{ backgroundImage: `url(${freeItem.product.image})` }}
                      />

                      <div className={`flex-1 flex flex-col justify-between ${isRTL ? "items-end" : "items-start"}`}>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Gift className="h-4 w-4 text-green-600" />
                            <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                              {t("freeItem")}
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-sm sm:text-base mb-1 line-clamp-2">
                            {getLocalizedName(freeItem.product, language)}
                          </h4>
                          <p className={`text-gray-500 text-xs sm:text-sm mb-1 ${isRTL ? "text-right" : "text-left"}`}>
                            {t("quantity")}: {freeItem.quantity}
                          </p>
                          <p className="text-green-600 font-bold text-sm">
                            {t("freeItem")} ({getDisplayPrice(freeItem.product, profile?.user_type).toFixed(2)} {t("currency")} {t("value")})
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Footer */}
              <div className={`border-t p-3 space-y-2 ${isRTL ? "mb-24 sm:mb-0" : "mb-24 sm:mb-0"}`}>
                {/* ملخص العروض */}
                {appliedOffers.totalDiscount > 0 && (
                  <div className="bg-green-50 p-2 rounded-md border border-green-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-green-700 font-medium flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {t("totalOffers")}
                      </span>
                      <span className="text-green-600 font-bold text-sm">
                        -{appliedOffers.totalDiscount.toFixed(2)} {t("currency")}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold">{t("total")}:</span>
                  <div className="text-right">
                    {appliedOffers.totalDiscount > 0 && (
                      <div className="text-xs text-gray-500 line-through">
                        {getTotalPrice?.()?.toFixed(2) || state.total.toFixed(2)} {t("currency")}
                      </div>
                    )}
                    <span className="text-lg font-bold text-primary">
                      {((getTotalPrice?.() || state.total) - appliedOffers.totalDiscount).toFixed(2)} {t("currency")}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button className="w-full" size="default" asChild>
                    <Link to="/checkout" onClick={handleCheckoutClick}>
                      {t("checkout")}
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={onClose}
                    asChild
                  >
                    <Link to="/products">{t("continueShopping")}</Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default CartSidebar;
