// صفحة الدفع والشراء - تتيح للمستخدم إتمام عملية الشراء
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import { useLanguage } from "@/utils/languageContextUtils";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { AddressService } from "@/services/supabaseService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useEnhancedToast } from "@/hooks/useEnhancedToast";
import { ShoppingCart, CreditCard, Banknote, ArrowLeft } from "lucide-react";
import { Product } from "@/types";
import { compressText, decompressText } from "@/utils/commonUtils";
import { getDisplayPrice } from "@/utils/priceUtils";
import AddressSelector, { Address as UserAddress } from "@/components/addresses/AddressSelector";
import { saveAddressIfNotExists } from "@/components/addresses/saveAddressIfNotExists";

// واجهة بيانات الشراء المباشر
interface DirectBuyState {
  directBuy?: boolean;
  product?: Product;
  quantity?: number;
  skipCart?: boolean; // إضافة خاصية skipCart
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const { t, isRTL } = useLanguage();
  const {
    state,
    cartItems = state.items,
    getTotalPrice,
    clearCart,
    isLoading: cartLoading,
  } = useCart();
  const [isCartLoading, setIsCartLoading] = useState(true);
  useEffect(() => {
    if (state.items.length > 0 || cartItems.length > 0) {
      setIsCartLoading(false);
    }
  }, [state.items, cartItems]);
  const enhancedToast = useEnhancedToast();

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!user) {
      // حفظ نية الدفع قبل التوجيه لتسجيل الدخول
      const checkoutIntent = {
        action: 'checkout',
        timestamp: Date.now(),
        fromCart: true // إشارة أنه قادم من السلة وليس buyNow
      };
      
      localStorage.setItem('checkout_intent', JSON.stringify(checkoutIntent));
      
      enhancedToast.error(t("pleaseLoginToCheckout"));
      // التوجه لتسجيل الدخول مع redirect parameter
      navigate("/auth?redirect=checkout", { replace: true });
    }
  }, [user, navigate, enhancedToast, t]);

  // الحصول على بيانات الشراء المباشر من التنقل
  const directBuyState = location.state as DirectBuyState;
  const isDirectBuy = directBuyState?.directBuy || false;
  const directProduct = directBuyState?.product;
  const directQuantity = directBuyState?.quantity || 1;
  const skipCart = directBuyState?.skipCart || false;

  // حالات المكون
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "bank_transfer">("cash");
  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    phone: "",
    city: "",
    area: "",
    street: "",
    building: "",
    floor: "",
    apartment: "",
  });
  const [notes, setNotes] = useState("");

  // تحديد العناصر المراد شراؤها (من السلة أو الشراء المباشر)
  const itemsToCheckout =
    (isDirectBuy && directProduct) || skipCart
      ? [{ product: directProduct, quantity: directQuantity }]
      : cartItems && cartItems.length > 0
        ? cartItems
        : state.items;

  // حساب السعر الإجمالي
  const totalPrice =
    (isDirectBuy && directProduct) || skipCart
      ? getDisplayPrice(
          normalizeProductForDisplay(directProduct),
          profile?.user_type,
        ) * directQuantity
      : getTotalPrice();

  // عند اختيار عنوان من AddressSelector
  const handleAddressSelect = (addr: UserAddress) => {
    setShippingAddress({
      fullName: addr.full_name || "",
      phone: addr.phone || "",
      city: addr.city || "",
      area: addr.area || "",
      street: addr.street || "",
      building: addr.building || "",
      floor: addr.floor || "",
      apartment: addr.apartment || "",
    });
  };

  // دالة تحقق من صحة رقم الهاتف
  function isValidPhone(phone: string) {
    return /^05\d{8}$/.test(phone);
  }

  // وظيفة إتمام الطلب
  const handlePlaceOrder = async () => {
    // التحقق من تسجيل الدخول
    if (!user) {
      enhancedToast.error(t("pleaseLogin"));
      return;
    }

    // التحقق من وجود عناصر للشراء
    if (itemsToCheckout.length === 0) {
      enhancedToast.error(t(""));
      return;
    }

    // التحقق من صحة عنوان الشحن
    if (
      !shippingAddress.fullName ||
      !shippingAddress.phone ||
      !shippingAddress.city ||
      !shippingAddress.area ||
      !shippingAddress.street ||
      !shippingAddress.building
    ) {
      enhancedToast.error(t("fillRequiredFields"));
      return;
    }

    // تحقق من صحة رقم الهاتف
    if (!isValidPhone(shippingAddress.phone)) {
      enhancedToast.error(t("invalidPhone"));
      return;
    }

    setIsLoading(true);

    try {
      // إنشاء الطلب في قاعدة البيانات
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total: totalPrice,
          payment_method: paymentMethod,
          shipping_address: JSON.stringify(shippingAddress),
          notes: notes ? compressText(notes) : null,
          status: "pending", // حالة الطلب: في الانتظار
        })
        .select()
        .single();

      if (orderError) {
        console.error("خطأ في إنشاء الطلب:", JSON.stringify(orderError, null, 2));
        throw orderError;
      }

      // إضافة العنوان تلقائياً إذا لم يكن موجوداً
      try {
        await saveAddressIfNotExists({
          userId: user.id,
          shippingAddress,
        });
      } catch (err) {
        console.warn("لم يتم حفظ العنوان تلقائياً:", err);
      }

      // إنشاء عناصر الطلب
      const orderItems = itemsToCheckout.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        console.error("خطأ في إنشاء عناصر الطلب:", itemsError);
        throw itemsError;
      }

      // مسح السلة والتوجه لصفحة الطلبات (فقط إذا لم يكن شراء مباشر)
      if (!isDirectBuy) {
        clearCart();
      }

      enhancedToast.success("orderPlaced");

      // التوجه لصفحة الطلبات
      navigate("/orders");
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      enhancedToast.error(err.message || t("errorPlacingOrder"));
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  // وظيفة العودة للصفحة السابقة
  const handleGoBack = () => {
    if (isDirectBuy) {
      navigate(-1); // العودة للصفحة السابقة
    } else {
      navigate("/cart"); // العودة للسلة
    }
  };

  // عرض رسالة انتظار تحميل السلة
  if (!isDirectBuy && cartLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t("loadingCart") || "جاري تحميل السلة..."}
          </h2>
        </div>
      </div>
    );
  }

  // عرض رسالة السلة الفارغة (فقط إذا لم يكن شراء مباشر أو skipCart)
  if (!isDirectBuy && !skipCart && cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t("cartIsEmpty")}
            </h2>
            <p className="text-gray-600 mb-6">{t("addItemsToCheckout")}</p>
            <Button onClick={() => navigate("/products")}>
              {t("continueShopping")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gray-50 ${isRTL ? "rtl" : "ltr"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* <Header onSearchChange={() => {}} onCartClick={() => {}} onMenuClick={() => {}} /> */}

      <div className="container mx-auto px-4 py-6">
        {/* رأس الصفحة مع زر العودة */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
              className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <ArrowLeft className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
              {t("back")}
            </Button>
            {isDirectBuy && (
              <span className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                {t("directPurchase")}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold mb-2">{t("checkout")}</h1>
          <p className="text-gray-600">
            {isDirectBuy ? t("completeDirectPurchase") : t("completeYourOrder")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* قسم الشحن والدفع */}
          <div className="lg:col-span-2 space-y-6">
            {/* عنوان الشحن */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>{t("shippingAddress")}</span>
                  <span className="text-red-500">*</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* AddressSelector الجديد */}
                <AddressSelector value={null} onChange={handleAddressSelect} userId={user?.id} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t("fullName")} *</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      autoComplete="name"
                      value={shippingAddress.fullName}
                      onChange={(e) =>
                        setShippingAddress((prev) => ({
                          ...prev,
                          fullName: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("phone")} *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={shippingAddress.phone}
                      onChange={(e) =>
                        setShippingAddress((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">{t("city")} *</Label>
                    <Input
                      id="city"
                      name="city"
                      autoComplete="address-level2"
                      value={shippingAddress.city}
                      onChange={(e) =>
                        setShippingAddress((prev) => ({
                          ...prev,
                          city: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="area">{t("area")} *</Label>
                    <Input
                      id="area"
                      name="area"
                      autoComplete="address-level3"
                      value={shippingAddress.area}
                      onChange={(e) =>
                        setShippingAddress((prev) => ({
                          ...prev,
                          area: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="street">{t("street")} *</Label>
                    <Input
                      id="street"
                      name="street"
                      autoComplete="street-address"
                      value={shippingAddress.street}
                      onChange={(e) =>
                        setShippingAddress((prev) => ({
                          ...prev,
                          street: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="building">{t("building")} *</Label>
                    <Input
                      id="building"
                      name="building"
                      autoComplete="address-line2"
                      value={shippingAddress.building}
                      onChange={(e) =>
                        setShippingAddress((prev) => ({
                          ...prev,
                          building: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="floor">{t("floor")}</Label>
                    <Input
                      id="floor"
                      name="floor"
                      autoComplete="off"
                      value={shippingAddress.floor}
                      onChange={(e) =>
                        setShippingAddress((prev) => ({
                          ...prev,
                          floor: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apartment">{t("apartment")}</Label>
                    <Input
                      id="apartment"
                      name="apartment"
                      autoComplete="off"
                      value={shippingAddress.apartment}
                      onChange={(e) =>
                        setShippingAddress((prev) => ({
                          ...prev,
                          apartment: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">{t("orderNotes")}</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    autoComplete="off"
                    placeholder={t("orderNotesPlaceholder")}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* طريقة الدفع */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>{t("paymentMethod")}</span>
                  <span className="text-red-500">*</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  name="paymentMethod"
                  value={paymentMethod}
                  onValueChange={(value: "cash" | "card" | "bank_transfer") =>
                    setPaymentMethod(value)
                  }
                >
                  <div
                    className={`flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors ${isRTL ? "flex-row-reverse space-x-reverse space-x-2" : "space-x-2"}`}
                  >
                    <RadioGroupItem value="cash" id="cash" />
                    <Label
                      htmlFor="cash"
                      className={`flex items-center gap-2 cursor-pointer flex-1 ${isRTL ? "flex-row-reverse space-x-reverse space-x-2" : "space-x-2"}`}
                    >
                      <Banknote className="h-5 w-5 text-green-600" />
                      <div>
                        <span className="font-medium">
                          {t("cashOnDelivery")}
                        </span>
                        <p className="text-sm text-gray-500">
                          {t("payOnDeliveryDescription")}
                        </p>
                      </div>
                    </Label>
                  </div>
                  <div
                    className={`flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors ${isRTL ? "flex-row-reverse space-x-reverse space-x-2" : "space-x-2"}`}
                  >
                    <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                    <Label
                      htmlFor="bank_transfer"
                      className={`flex items-center gap-2 cursor-pointer flex-1 ${isRTL ? "flex-row-reverse space-x-reverse space-x-2" : "space-x-2"}`}
                    >
                      <Banknote className="h-5 w-5 text-blue-600" />
                      <div>
                        <span className="font-medium">
                          {t("bankTransfer") || "تحويل بنكي"}
                        </span>
                        <p className="text-sm text-gray-500">
                          {t("bankTransferDescription") ||
                            "ادفع عبر التحويل البنكي"}
                        </p>
                      </div>
                    </Label>
                  </div>
                  <div
                    className={`flex items-center p-4 border rounded-lg opacity-50 ${isRTL ? "flex-row-reverse space-x-reverse space-x-2" : "space-x-2"}`}
                  >
                    <RadioGroupItem value="card" id="card" disabled />
                    <Label
                      htmlFor="card"
                      className={`flex items-center gap-2 cursor-not-allowed flex-1 ${isRTL ? "flex-row-reverse space-x-reverse space-x-2" : "space-x-2"}`}
                    >
                      <CreditCard className="h-5 w-5" />
                      <div>
                        <span>{t("creditCard")}</span>
                        <p className="text-sm text-gray-500">
                          ({t("comingSoon")})
                        </p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* ملخص الطلب */}
          <Card className="h-fit sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t("orderSummary")}</span>
                <span className="text-sm font-normal text-gray-500">
                  ({itemsToCheckout.length} {t("items")})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* عرض المنتجات */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {itemsToCheckout.map((item, index) => {
                  // Ensure all required Product fields are present for getDisplayPrice
                  const productForPrice = {
                    id: item.product.id || "",
                    name: item.product.name || "",
                    nameEn: item.product.nameEn || "",
                    nameHe: item.product.nameHe || "",
                    description: item.product.description || "",
                    descriptionEn: item.product.descriptionEn || "",
                    descriptionHe: item.product.descriptionHe || "",
                    price: item.product.price,
                    originalPrice: item.product.originalPrice,
                    wholesalePrice: item.product.wholesalePrice,
                    image: item.product.image || "",
                    images: item.product.images || [],
                    category: item.product.category || "",
                    inStock:
                      typeof item.product.inStock === "boolean"
                        ? item.product.inStock
                        : true,
                    rating: item.product.rating || 0,
                    reviews: item.product.reviews || 0,
                    discount: item.product.discount,
                    featured: item.product.featured,
                    tags: item.product.tags || [],
                    stock_quantity: item.product.stock_quantity,
                    active: item.product.active,
                    created_at: item.product.created_at,
                  };
                  return (
                    <div
                      key={item.product.id || `item-${index}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {item.product.name}
                        </h4>
                        {/* Product description */}
                        <p className="text-gray-500 text-xs truncate mt-0.5">
                          {item.product.description || item.product.descriptionEn || item.product.descriptionHe}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm text-gray-600">
                            {item.quantity} × {getDisplayPrice(productForPrice, profile?.user_type)}
                          </span>
                          <p className="font-medium text-sm">
                            {item.quantity *
                              getDisplayPrice(
                                productForPrice,
                                profile?.user_type,
                              )}{" "}
                            {t("currency")}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Separator />

              {/* تفاصيل التكلفة */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t("subtotal")}</span>
                  <span>
                    {totalPrice} {t("currency")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t("shipping")}</span>
                  <span className="text-green-600">{t("free")}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>{t("total")}</span>
                  <span className="text-primary">
                    {totalPrice} {t("currency")}
                  </span>
                </div>
              </div>

              {/* زر إتمام الطلب */}
              <Button
                onClick={handlePlaceOrder}
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
                disabled={isLoading || itemsToCheckout.length === 0}
              >
                {isLoading ? t("placingOrder") : t("placeOrder")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Helper to normalize a Product to the canonical type with all required fields
function normalizeProductForDisplay(
  product: Product,
): import("@/types/product").Product {
  return {
    ...product,
    nameHe: (product as { nameHe?: string }).nameHe ?? "",
    descriptionHe: (product as { descriptionHe?: string }).descriptionHe ?? "",
    // fallback for any other required fields if needed
    name: product.name || "",
    nameEn: product.nameEn || "",
    description: product.description || "",
    descriptionEn: product.descriptionEn || "",
    id: product.id || "",
    price: product.price,
    image: product.image || "",
    category: product.category || "",
    inStock: typeof product.inStock === "boolean" ? product.inStock : true,
    rating: product.rating || 0,
    reviews: product.reviews || 0,
  };
}

export default Checkout;
