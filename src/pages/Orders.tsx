import React, { useState, useEffect } from "react";
import { useLanguage } from "@/utils/languageContextUtils";
import { useAuth } from "@/contexts/useAuth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Package,
  CreditCard,
  XCircle,
  MapPin,
  Truck,
  CheckCircle,
  Loader2,
  PackageOpen,
  UserPlus,
  Eye,
  Gift,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import OrderStatusBadge from "@/components/ui/OrderStatusBadge";
import FormattedDate from "@/components/ui/FormattedDate";
import OrderDetailsDialog from "@/components/OrderDetailsDialogSimple";
import {
  useUserOrdersWithDetailsQuery,
  useCancelUserOrderMutation,
} from "@/integrations/supabase/reactQueryHooks";
import type { Tables } from "@/integrations/supabase/types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDisplayPrice } from "@/utils/priceUtils";
import { mapOrderFromDb } from "../utils/orderUtils";
import type { OrdersWithDetails } from "@/integrations/supabase/dataFetchers";
import { decompressText } from "@/utils/commonUtils";
import { ClearableInput } from "@/components/ui/ClearableInput";
import { useProductsRealtime } from '@/hooks/useProductsRealtime';

// أنواع الطلب وعناصر الطلب من Supabase
type ProductDB = {
  id: string;
  name_ar: string;
  name_en: string;
  name_he: string;
  description_ar: string;
  description_en: string;
  description_he: string;
  price: number;
  original_price: number | null;
  wholesale_price: number | null;
  image: string;
  images: string[] | null;
  in_stock: boolean | null;
  rating: number | null;
  discount: number | null;
  featured: boolean | null;
  tags: string[] | null;
  stock_quantity: number | null;
  active: boolean | null;
  created_at: string;
};

type OrderItemDB = {
  id: string;
  order_id: string;
  price: number;
  product_id: string;
  quantity: number;
  created_at: string;
  product_name?: string; // Adding this field as optional
  products?: ProductDB;
};

type OrderDB = Omit<Tables<"orders">, "items" | "shipping_address"> & {
  items: any | null;
  shipping_address: any;
  order_items?: OrderItemDB[];
};

const Orders: React.FC = () => {
  const { t, isRTL, language } = useLanguage();
  const { user, profile } = useAuth();
  const { products } = useProductsRealtime();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<OrdersWithDetails | null>(null);

  // تتبع تغيير selectedOrderForDetails
  useEffect(() => {
    console.log("selectedOrderForDetails changed:", selectedOrderForDetails);
  }, [selectedOrderForDetails]);

  // جلب الطلبات مع تفاصيل المنتجات
  const {
    data: orders = [],
    isLoading: loading,
    error,
    refetch,
  } = useUserOrdersWithDetailsQuery(
    typeof user === "object" && user && "id" in user
      ? (user as { id: string }).id
      : "",
  );
  // إلغاء الطلب
  const cancelOrderMutation = useCancelUserOrderMutation();

  const handleCancelOrder = async (orderId: string) => {
    setCancellingId(orderId);
    await cancelOrderMutation.mutateAsync({
      orderId,
      userMeta: {
        full_name: profile?.full_name,
        email:
          typeof user === "object" && user && "email" in user
            ? (user as { email: string }).email
            : "",
        displayName:
          typeof user === "object" &&
          user &&
          "user_metadata" in user &&
          user.user_metadata &&
          typeof user.user_metadata === "object" &&
          "full_name" in user.user_metadata
            ? (user.user_metadata as { full_name?: string }).full_name || ""
            : "",
      },
    });
    setCancellingId(null);
    refetch();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // منطق إلغاء الطلب
  // التحقق من إمكانية الإلغاء
  const canCancel = (order: OrdersWithDetails) => {
    if (order.status !== "pending") return false;
    const created = new Date(order.created_at);
    const now = new Date();
    const diffHrs = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return diffHrs <= 24;
  };

  const filteredOrders = orders.filter((order) => {
    // فلترة حسب الحالة
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    // بحث بالرقم أو اسم منتج
    if (search) {
      const orderIdMatch = order.id.toString().includes(search.trim());
      const orderNumberMatch = order.order_number?.toString().includes(search.trim());
      const productMatch = order.order_items?.some(
        (item) =>
          (item.products?.name_ar || "")
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          (item.products?.name_en || "")
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          (item.products?.name_he || "")
            .toLowerCase()
            .includes(search.toLowerCase()),
      );
      if (!orderIdMatch && !orderNumberMatch && !productMatch) return false;
    }
    return true;
  });

  // دالة فك الضغط لملاحظات الطلب
  function safeDecompressNotes(notes: string) {
    try {
      return decompressText(notes);
    } catch {
      return notes;
    }
  }

  // منطق loading ومنع عرض الصفحة قبل التأكد من تحميل بيانات المستخدم
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gray-50 ${isRTL ? "rtl" : "ltr"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* <Header onSearchChange={() => {}} onCartClick={() => {}} onMenuClick={() => {}} /> */}
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <div className={`mb-8 ${isRTL ? "text-right" : "text-left"}`}>
          <h1 className="text-3xl font-bold mb-1 text-center">{t("orders")}</h1>
          <p className="text-gray-600 mt-2 text-center">
            {t("trackYourOrders") || t("viewYourOrders")}
          </p>
        </div>
        {/* شريط الفلترة والبحث */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("orderStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatuses")}</SelectItem>
              <SelectItem value="pending">{t("pending")}</SelectItem>
              <SelectItem value="processing">{t("processing")}</SelectItem>
              <SelectItem value="shipped">{t("shipped")}</SelectItem>
              <SelectItem value="delivered">{t("delivered")}</SelectItem>
              <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
            </SelectContent>
          </Select>
          <ClearableInput
            className={`border-2 border-gray-200 rounded-lg py-2 h-10 text-xs sm:text-sm w-full bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-300 transition-colors placeholder:text-gray-400 ${
              isRTL ? "pr-8 pl-3" : "pl-8 pr-3"
            }`}    
            placeholder={t("search") + "..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch("")}
          />
        </div>
        <div className="space-y-6">
          {loading ? (
            <Card className="text-center py-12">
              <CardContent>
                <Loader2 className="h-12 w-12 text-gray-300 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t("loadingData") || "جاري تحميل الطلبات..."}
                </h3>
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="text-center py-12">
              <CardContent>
                <h3 className="text-lg font-medium text-red-600 mb-2">
                  {t("errorLoadingData") || "خطأ في تحميل الطلبات"}
                </h3>
                <p className="text-gray-500">
                  {error instanceof Error ? error.message : String(error)}
                </p>
              </CardContent>
            </Card>
          ) : filteredOrders.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t("noOrders")}
                </h3>
                <p className="text-gray-500">{t("noOrdersDescription")}</p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => {
              // شريط الحالة
              const statusSteps = [
                {
                  key: "pending",
                  label: t("pending"),
                  icon: <Loader2 className="h-5 w-5" />,
                },
                {
                  key: "processing",
                  label: t("processing"),
                  icon: <PackageOpen className="h-5 w-5" />,
                },
                {
                  key: "shipped",
                  label: t("shipped"),
                  icon: <Truck className="h-5 w-5" />,
                },
                {
                  key: "delivered",
                  label: t("delivered"),
                  icon: <CheckCircle className="h-5 w-5" />,
                },
                {
                  key: "cancelled",
                  label: t("cancelled"),
                  icon: <XCircle className="h-5 w-5" />,
                },
              ];
              const currentStep = statusSteps.findIndex(
                (s) => s.key === order.status,
              );
              const safeOrder = mapOrderFromDb(order);
              function getPaymentMethodText(payment_method: string): React.ReactNode {
                switch (payment_method) {
                  case "cash":
                    return t("cashOnDelivery") || "الدفع عند الاستلام";
                  case "card":
                    return t("creditCard") || "بطاقة ائتمان";
                  case "bank_transfer":
                    return t("bankTransfer") || "تحويل بنكي";
                  default:
                    return payment_method;
                }
              }

              return (
                <Card
                  key={order.id}
                  className="overflow-hidden border shadow-md"
                >
                  <CardHeader className="bg-gray-50 border-b flex flex-col gap-2">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {t("orderNumber")}
                        </span>
                        <span className="font-bold text-lg tracking-wider">
                          #{order.order_number}
                        </span>
                        {/* شارة منشئ الطلب */}
                        {safeOrder.admin_created && (
                          <Badge
                            className="ml-0 bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1 animate-pulse cursor-pointer text-[11px] px-2 py-0.5 w-fit max-w-[90vw] sm:max-w-xs whitespace-normal break-words overflow-hidden block"
                            onClick={() =>
                              toast({
                                title: t("adminOrderInfoTitle") || "طلب أنشئ من الأدمن",
                                description:
                                  t("adminOrderInfoDesc") ||
                                  "تم إنشاء هذا الطلب من قبل الأدمن عبر لوحة التحكم. غالبًا تم إنشاؤه لمساعدتك أو بناءً على تواصلك مع خدمة العملاء.",
                                duration: 5000,
                              })
                            }
                            tabIndex={0}
                            title={t("orderCreatedFromAdminPanel") || "تم إنشاء الطلب من قبل الأدمن"}
                          >
                            <UserPlus className="h-4 w-4 min-w-[16px] min-h-[16px]" />
                            <span className="block">{t("admin") || "أدمن"}</span>
                          </Badge>
                        )}
                        {/* شارة إلغاء الطلب */}
                        {order.status === "cancelled" &&
                          order.cancelled_by === "admin" && (
                            <Badge
                              className="ml-0 mt-1 bg-red-100 text-red-800 border-red-200 animate-pulse cursor-pointer text-[11px] px-2 py-0.5 w-fit max-w-[90vw] sm:max-w-xs whitespace-normal break-words overflow-hidden block"
                              style={{ lineHeight: "1.2", fontWeight: 600 }}
                            >
                              <span className="inline-flex items-center gap-1">
                                <XCircle className="h-4 w-4 min-w-[16px] min-h-[16px]" />
                                <span className="block">
                                  <span className="block">
                                    {t("orderCancelledByAdmin") ||
                                      "ألغي الطلب بواسطة الأدمن"}
                                  </span>
                                </span>
                              </span>
                            </Badge>
                          )}
                      </div>
                      <div className="flex items-center gap-2">
                        <OrderStatusBadge status={order.status} className="text-base px-3 py-1 rounded-full font-semibold" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center text-xs text-gray-500 mt-1">
                      <CalendarDays className="h-4 w-4" />
                      <FormattedDate date={order.created_at} format="short" />
                      <CreditCard className="h-4 w-4 ml-2" />
                      <span>
                        {t("paymentMethod")}:{" "}
                            {getPaymentMethodText(safeOrder.paymentMethod)}
                      </span>
                    </div>
                    {/* شريط الحالة */}
                    <div
                      className="flex items-center gap-1 mt-2 w-full flex-nowrap"
                      style={{ flexWrap: "nowrap" }}
                    >
                      {statusSteps.map((step, idx) => {
                        // منطق التلوين:
                        let colorClass = "";
                        if (order.status === "cancelled") {
                          colorClass =
                            step.key === "cancelled"
                              ? "text-red-600 font-bold"
                              : "text-gray-300";
                        } else {
                          colorClass =
                            idx <= currentStep
                              ? "text-primary font-bold"
                              : "text-gray-300";
                        }
                        return (
                          <React.Fragment key={step.key}>
                            <div
                              className={`flex flex-col items-center flex-1 basis-0 min-w-0 ${colorClass}`}
                              style={{ maxWidth: "100%" }}
                            >
                              <span
                                style={{
                                  fontSize: 15,
                                  lineHeight: 1,
                                  display: "block",
                                }}
                              >
                                {step.icon}
                              </span>
                              <span
                                className="text-[10px] md:text-xs mt-0.5 w-full text-center leading-tight break-keep whitespace-nowrap"
                                style={{
                                  fontSize: "clamp(9px,2vw,13px)",
                                  lineHeight: 1.1,
                                  display: "block",
                                }}
                              >
                                {step.label}
                              </span>
                            </div>
                            {idx < statusSteps.length - 1 && (
                              <div
                                className={`h-1 rounded-full flex-shrink-0`}
                                style={{
                                  width: 16,
                                  background:
                                    order.status === "cancelled"
                                      ? step.key === "cancelled"
                                        ? "#ef4444"
                                        : "#e5e7eb"
                                      : idx < currentStep
                                        ? "#2563eb"
                                        : "#e5e7eb",
                                }}
                              ></div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </CardHeader>
                  <CardContent className="bg-white">
                    {/* عنوان الشحن */}
                    <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-1 sm:gap-2 mb-4 text-sm text-gray-600 break-words">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-2 w-full">
                        {(() => {
                          const addr = safeOrder.shippingAddress;
                          if (!addr) return "-";
                          const fullName = addr.fullName || "";
                          const phone = addr.phone || "";
                          const city = addr.city || "";
                          const area = addr.area || "";
                          const street = addr.street || "";
                          const building = addr.building || "";
                          const floor = addr.floor || "";
                          const apartment = addr.apartment || "";
                          return [
                            fullName && (
                              <span
                                key="fn"
                                className="inline-block break-words whitespace-normal"
                              >
                                {fullName}
                              </span>
                            ),
                            phone && (
                              <span
                                key="ph"
                                className="inline-block break-words whitespace-normal"
                              >
                                ({phone})
                              </span>
                            ),
                            [city, area, street, building]
                              .filter(Boolean)
                              .join(t("addressSeparator") || "، "),
                            floor || apartment
                              ? `${t("floor")}: ${floor || "-"}${t("addressSeparator") || "، "}${t("apartment")}: ${apartment || "-"}`
                              : null,
                          ]
                            .filter(Boolean)
                            .map((part, i) => (
                              <span
                                key={i}
                                className="inline-block break-words whitespace-normal"
                              >
                                {part}
                                {i < 2 ? " - " : ""}
                              </span>
                            ));
                        })()}
                      </span>
                    </div>
                    {/* المنتجات */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm border rounded-lg">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="p-2 text-right font-semibold">
                              {t("productName")}
                            </th>
                            <th className="p-2 text-center font-semibold">
                              {t("quantity")}
                            </th>
                            <th className="p-2 text-center font-semibold">
                              {t("price")}
                            </th>
                            <th className="p-2 text-center font-semibold">
                              {t("total")}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.order_items && order.order_items.length > 0 ? (
                            order.order_items.map((item) => (
                              <tr
                                key={item.id}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="p-2">
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-10 h-10 bg-center bg-contain bg-no-repeat rounded border border-gray-200"
                                      style={{ backgroundImage: `url(${item.products?.image})` }}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {language === "ar"
                                          ? item.products?.name_ar
                                          : language === "he"
                                          ? item.products?.name_he
                                          : item.products?.name_en || item.product_name}
                                      </span>
                                      <span className="text-xs text-gray-500 mt-0.5">
                                        {language === "ar"
                                          ? item.products?.description_ar
                                          : language === "he"
                                          ? item.products?.description_he
                                          : item.products?.description_en}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-2 text-center">
                                  {item.quantity}
                                </td>
                                <td className="p-2 text-center">
                                  {(() => {
                                    const originalPrice = getDisplayPrice(
                                      {
                                        id: item.products?.id || "",
                                        name: item.products?.name_ar || "",
                                        nameEn: item.products?.name_en || "",
                                        nameHe: item.products?.name_he || "",
                                        description:
                                          item.products?.description_ar || "",
                                        descriptionEn:
                                          item.products?.description_en || "",
                                        descriptionHe:
                                          item.products?.description_he || "",
                                        price: item.price,
                                        originalPrice:
                                          item.products?.original_price,
                                        wholesalePrice:
                                          item.products?.wholesale_price,
                                        image: item.products?.image || "",
                                        images: item.products?.images || [],
                                        category: "", // fallback
                                        inStock:
                                          typeof item.products?.in_stock ===
                                          "boolean"
                                            ? item.products.in_stock
                                            : true,
                                        rating: item.products?.rating || 0,
                                        reviews: 0, // fallback
                                        discount: item.products?.discount,
                                        featured: item.products?.featured,
                                        tags: item.products?.tags || [],
                                        stock_quantity:
                                          item.products?.stock_quantity,
                                        active: item.products?.active,
                                        created_at: item.products?.created_at,
                                      },
                                      profile?.user_type,
                                    );
                                    
                                    // التحقق من وجود خصم على هذا المنتج من العروض
                                    let hasDiscount = false;
                                    let discountAmount = 0;
                                    try {
                                      const appliedOffers = order.applied_offers 
                                        ? (typeof order.applied_offers === 'string' 
                                            ? JSON.parse(order.applied_offers) 
                                            : order.applied_offers)
                                        : [];
                                      
                                      for (const offer of appliedOffers) {
                                        // للعروض العادية وعروض خصم المنتج
                                        if ((offer.offer?.offer_type === 'discount' || offer.offer?.offer_type === 'product_discount') 
                                            && offer.affectedProducts && offer.affectedProducts.includes(item.product_id)) {
                                          hasDiscount = true;
                                          // حساب الخصم لهذا المنتج
                                          const totalAffectedValue = offer.affectedProducts.reduce((sum: number, productId: string) => {
                                            const affectedItem = order.order_items?.find((oi: any) => oi.product_id === productId);
                                            if (affectedItem) {
                                              return sum + (originalPrice * affectedItem.quantity);
                                            }
                                            return sum;
                                          }, 0);
                                          
                                          if (totalAffectedValue > 0) {
                                            const itemValue = originalPrice * item.quantity;
                                            const itemDiscountRatio = itemValue / totalAffectedValue;
                                            discountAmount += (offer.discountAmount || 0) * itemDiscountRatio;
                                          }
                                        }
                                        
                                        // لعروض اشتري واحصل - فقط على المنتج المستهدف للخصم
                                        if (offer.offer?.offer_type === 'buy_get') {
                                          const getProductId = offer.offer?.get_product_id;
                                          const getDiscountType = offer.offer?.get_discount_type;
                                          
                                          // نطبق الخصم فقط على المنتج المستهدف وليس المنتج المطلوب شراؤه
                                          if (item.product_id === getProductId && getDiscountType !== 'free') {
                                            hasDiscount = true;
                                            // نطبق الخصم الكامل للعرض على هذا المنتج
                                            discountAmount += offer.discountAmount || 0;
                                          }
                                        }
                                      }
                                    } catch (error) {
                                      // في حالة الخطأ، لا نطبق خصم
                                    }

                                    const finalPrice = originalPrice - (discountAmount / item.quantity);
                                    
                                    if (hasDiscount && finalPrice < originalPrice) {
                                      return (
                                        <div>
                                          <span className="line-through text-gray-400 text-sm">{originalPrice.toFixed(2)} {t("currency")}</span>
                                          <div className="text-green-600 font-bold">{finalPrice.toFixed(2)} {t("currency")}</div>
                                        </div>
                                      );
                                    }
                                    
                                    return `${originalPrice.toFixed(2)} ${t("currency")}`;
                                  })()}
                                </td>
                                <td className="p-2 text-center font-semibold">
                                  {(() => {
                                    const originalPrice = getDisplayPrice(
                                      {
                                        id: item.products?.id || "",
                                        name: item.products?.name_ar || "",
                                        nameEn: item.products?.name_en || "",
                                        nameHe: item.products?.name_he || "",
                                        description:
                                          item.products?.description_ar || "",
                                        descriptionEn:
                                          item.products?.description_en || "",
                                        descriptionHe:
                                          item.products?.description_he || "",
                                        price: item.price,
                                        originalPrice:
                                          item.products?.original_price,
                                        wholesalePrice:
                                          item.products?.wholesale_price,
                                        image: item.products?.image || "",
                                        images: item.products?.images || [],
                                        category: "", // fallback
                                        inStock:
                                          typeof item.products?.in_stock ===
                                          "boolean"
                                            ? item.products.in_stock
                                            : true,
                                        rating: item.products?.rating || 0,
                                        reviews: 0, // fallback
                                        discount: item.products?.discount,
                                        featured: item.products?.featured,
                                        tags: item.products?.tags || [],
                                        stock_quantity:
                                          item.products?.stock_quantity,
                                        active: item.products?.active,
                                        created_at: item.products?.created_at,
                                      },
                                      profile?.user_type,
                                    );
                                    
                                    // التحقق من وجود خصم على هذا المنتج من العروض
                                    let hasDiscount = false;
                                    let discountAmount = 0;
                                    try {
                                      const appliedOffers = order.applied_offers 
                                        ? (typeof order.applied_offers === 'string' 
                                            ? JSON.parse(order.applied_offers) 
                                            : order.applied_offers)
                                        : [];
                                      
                                      for (const offer of appliedOffers) {
                                        // للعروض العادية وعروض خصم المنتج
                                        if ((offer.offer?.offer_type === 'discount' || offer.offer?.offer_type === 'product_discount') 
                                            && offer.affectedProducts && offer.affectedProducts.includes(item.product_id)) {
                                          hasDiscount = true;
                                          // حساب الخصم لهذا المنتج
                                          const totalAffectedValue = offer.affectedProducts.reduce((sum: number, productId: string) => {
                                            const affectedItem = order.order_items?.find((oi: any) => oi.product_id === productId);
                                            if (affectedItem) {
                                              return sum + (originalPrice * affectedItem.quantity);
                                            }
                                            return sum;
                                          }, 0);
                                          
                                          if (totalAffectedValue > 0) {
                                            const itemValue = originalPrice * item.quantity;
                                            const itemDiscountRatio = itemValue / totalAffectedValue;
                                            discountAmount += (offer.discountAmount || 0) * itemDiscountRatio;
                                          }
                                        }
                                        
                                        // لعروض اشتري واحصل - فقط على المنتج المستهدف للخصم
                                        if (offer.offer?.offer_type === 'buy_get') {
                                          const getProductId = offer.offer?.get_product_id;
                                          const getDiscountType = offer.offer?.get_discount_type;
                                          
                                          // نطبق الخصم فقط على المنتج المستهدف وليس المنتج المطلوب شراؤه
                                          if (item.product_id === getProductId && getDiscountType !== 'free') {
                                            hasDiscount = true;
                                            // نطبق الخصم الكامل للعرض على هذا المنتج
                                            discountAmount += offer.discountAmount || 0;
                                          }
                                        }
                                      }
                                    } catch (error) {
                                      // في حالة الخطأ، لا نطبق خصم
                                    }

                                    const finalPrice = originalPrice - (discountAmount / item.quantity);
                                    const finalTotal = finalPrice * item.quantity;
                                    const originalTotal = originalPrice * item.quantity;
                                    
                                    if (hasDiscount && finalPrice < originalPrice) {
                                      const savings = originalTotal - finalTotal;
                                      return (
                                        <div>
                                          <span className="line-through text-gray-400 text-sm">{originalTotal.toFixed(2)} {t("currency")}</span>
                                          <div className="text-green-600 font-bold">{finalTotal.toFixed(2)} {t("currency")}</div>
                                          <div className="text-xs text-green-500">
                                            ({t("saved") || "وفرت"}: {savings.toFixed(2)} {t("currency")})
                                          </div>
                                        </div>
                                      );
                                    }
                                    
                                    return `${originalTotal.toFixed(2)} ${t("currency")}`;
                                  })()}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={4}
                                className="text-center text-gray-400 py-4"
                              >
                                {t("noProductsFound") || "لا توجد منتجات"}
                              </td>
                            </tr>
                          )}
                          
                          {/* المنتجات المجانية */}
                          {(() => {
                            let allFreeItems = [];
                            
                            // الحصول على المنتجات المجانية من العروض المطبقة
                            try {
                              const appliedOffers = order.applied_offers 
                                ? (typeof order.applied_offers === 'string' 
                                    ? JSON.parse(order.applied_offers) 
                                    : order.applied_offers)
                                : [];
                              
                              appliedOffers.forEach((offer: any) => {
                                if (offer.freeProducts && Array.isArray(offer.freeProducts)) {
                                  allFreeItems = [...allFreeItems, ...offer.freeProducts];
                                }
                                if (offer.freeItems && Array.isArray(offer.freeItems)) {
                                  allFreeItems = [...allFreeItems, ...offer.freeItems];
                                }
                              });
                            } catch {}
                            
                            // إزالة المكررات
                            const uniqueFreeItems = allFreeItems.reduce((acc: any[], current: any) => {
                              const currentProductId = String(current.productId || current.product_id || current.id || '').trim();
                              
                              if (!currentProductId) return acc;
                              
                              const existing = acc.find(item => {
                                const existingProductId = String(item.productId || item.product_id || item.id || '').trim();
                                return existingProductId === currentProductId;
                              });
                              
                              if (!existing) {
                                acc.push(current);
                              }
                              return acc;
                            }, []);
                            
                            return uniqueFreeItems.length > 0 && uniqueFreeItems.map((item: any, idx: number) => {
                              // البحث عن المنتج في قاعدة البيانات مباشرة
                              const product = products.find((p) => 
                                p.id === item.productId || 
                                p.id === item.product_id ||
                                String(p.id) === String(item.productId) ||
                                String(p.id) === String(item.product_id)
                              );
                              
                              let productName = '';
                              if (product) {
                                productName = language === "ar" ? product.name_ar :
                                            language === "he" ? product.name_he :
                                            product.name_en || product.name_ar;
                              }
                              
                              if (!productName) {
                                productName = item.name_ar || item.name_en || item.name_he || 
                                             item.name || item.productName || t("unknownProduct") || "منتج غير معروف";
                              }
                              
                              if (!productName || productName.trim() === '') {
                                return null;
                              }
                              
                              const quantity = item.quantity || 1;
                              
                              // الحصول على السعر الأصلي
                              let originalPrice = 0;
                              if (product) {
                                originalPrice = getDisplayPrice(
                                  {
                                    id: product.id || "",
                                    name: product.name_ar || "",
                                    nameEn: product.name_en || "",
                                    nameHe: product.name_he || "",
                                    description: product.description_ar || "",
                                    descriptionEn: product.description_en || "",
                                    descriptionHe: product.description_he || "",
                                    price: product.price || 0,
                                    originalPrice: product.original_price,
                                    wholesalePrice: product.wholesale_price,
                                    image: product.image || "",
                                    images: product.images || [],
                                    category: "",
                                    inStock: typeof product.in_stock === "boolean" ? product.in_stock : true,
                                    rating: product.rating || 0,
                                    reviews: 0,
                                    discount: product.discount,
                                    featured: product.featured,
                                    tags: product.tags || [],
                                    stock_quantity: product.stock_quantity,
                                    active: product.active,
                                    created_at: product.created_at,
                                  },
                                  profile?.user_type,
                                );
                              } else {
                                originalPrice = item.originalPrice || item.price || item.original_price || 0;
                              }
                              
                              return (
                                <tr key={`free-${idx}`} className="bg-green-50 border-green-200">
                                  <td className="p-2">
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-10 h-10 bg-center bg-contain bg-no-repeat rounded border border-gray-200"
                                        style={{ backgroundImage: `url(${product?.image})` }}
                                      />
                                      <div className="flex flex-col">
                                        <span className="font-medium text-green-800 flex items-center gap-1">
                                          🎁 {productName}
                                        </span>
                                        <span className="text-xs text-green-600 mt-0.5">
                                          {t("freeItem") || "منتج مجاني"} - {t("fromOffer") || "من العرض"}
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-2 text-center font-bold text-green-700">
                                    {quantity}
                                  </td>
                                  <td className="p-2 text-center">
                                    {originalPrice > 0 ? (
                                      <div>
                                        <span className="line-through text-gray-400 text-sm">{originalPrice.toFixed(2)} {t("currency")}</span>
                                        <div className="text-green-600 font-bold">{t("free") || "مجاني"}</div>
                                      </div>
                                    ) : (
                                      <div className="text-green-600 font-bold">{t("free") || "مجاني"}</div>
                                    )}
                                  </td>
                                  <td className="p-2 text-center font-semibold">
                                    <div>
                                      {originalPrice > 0 && (
                                        <span className="line-through text-gray-400 text-sm">{(originalPrice * quantity).toFixed(2)} {t("currency")}</span>
                                      )}
                                      <div className="text-green-600 font-bold">0.00 {t("currency")}</div>
                                      {originalPrice > 0 && (
                                        <div className="text-xs text-green-500 mt-1">
                                          💰 {t("saved") || "وفرت"}: {(originalPrice * quantity).toFixed(2)} {t("currency")}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            }).filter(Boolean);
                          })()}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* زر عرض تفاصيل الطلبية - تحت جدول المنتجات */}
                    <div className="mt-4 flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrderForDetails(order);
                        }}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all duration-200 rounded-lg font-medium shadow-sm hover:shadow-md"
                      >
                        <Eye className="h-4 w-4" />
                        {t("viewOrderDetails") || "عرض تفاصيل الطلبية"}
                      </Button>
                    </div>
                    
                    {/* العروض المطبقة */}
                    {(() => {
                      try {
                        const appliedOffers = order.applied_offers 
                          ? (typeof order.applied_offers === 'string' 
                              ? JSON.parse(order.applied_offers) 
                              : order.applied_offers)
                          : null;
                        
                        if (appliedOffers && appliedOffers.length > 0) {
                          return (
                            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                              <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                                <Gift className="h-4 w-4" />
                                {t("appliedOffers") || "العروض المطبقة"}
                              </h4>
                              <div className="space-y-2">
                                {appliedOffers.map((appliedOffer: any, index: number) => (
                                  <div key={index} className="flex items-center justify-between bg-white p-2 rounded border border-orange-100">
                                    <div className="flex-1">
                                      <span className="text-sm font-medium text-orange-700">
                                        {language === "ar" ? appliedOffer.offer?.title_ar : 
                                         language === "he" ? appliedOffer.offer?.title_he : 
                                         appliedOffer.offer?.title_en || "عرض خاص"}
                                      </span>
                                      <div className="text-xs text-orange-600">
                                        {appliedOffer.offer?.offer_type === 'buy_get' ? t('buyGetOffer') || 'اشتري واحصل' : 
                                         appliedOffer.offer?.offer_type === 'product_discount' ? t('productDiscount') || 'خصم على منتج' :
                                         t('discount') || 'خصم'}
                                      </div>
                                    </div>
                                    {appliedOffer.discountAmount > 0 && (
                                      <div className="text-right">
                                        <div className="text-sm font-bold text-orange-600">
                                          -{appliedOffer.discountAmount.toFixed(2)} {t("currency")}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      } catch (error) {
                        console.error('Error parsing applied offers:', error);
                        return null;
                      }
                    })()}
                    
                    {/* ملخص الطلب */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mt-6 border-t pt-4">
                      <div className="space-y-2">
                        {/* عرض معلومات الخصم إذا كان موجوداً */}
                        {order.discount_value && order.discount_value > 0 ? (
                          <>
                            {/* السعر الأصلي مع خط عليه */}
                            <div className="flex items-center gap-2 text-lg text-gray-500">
                              <span>{t("orderTotal")}:</span>
                              <span className="line-through">
                                {order.total?.toFixed(2) || "-"} {t("currency")}
                              </span>
                            </div>
                            
                            {/* معلومات الخصم */}
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-green-700">{t("discountType")}:</span>
                                <span className="text-green-600">
                                  {/* استخدام discount_type المباشر من قاعدة البيانات */}
                                  {order.discount_type === "percent" ? t("percent") : t("fixedAmount")}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-green-700">{t("discountValue")}:</span>
                                <span className="text-green-600">
                                  {/* عرض النسبة المئوية أو المبلغ الثابت بناءً على النوع */}
                                  {order.discount_type === "percent"
                                    ? `${order.discount_value?.toFixed(0)}%` 
                                    : `${order.discount_value?.toFixed(2)} ${t("currency")}`}
                                </span>
                              </div>
                              
                              {/* المبلغ الموفر - يظهر فقط للنسبة المئوية */}
                              {order.discount_type === "percent" && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium text-green-700">{t("savings") || "المبلغ الموفر"}:</span>
                                  <span className="text-green-600 font-semibold">
                                    {(() => {
                                      const total = order.total || 0;
                                      const totalAfterDiscount = order.total_after_discount || 
                                        (order.discount_value 
                                          ? total * (1 - order.discount_value / 100)
                                          : total);
                                      const savings = total - totalAfterDiscount;
                                      return `${savings.toFixed(2)} ${t("currency")}`;
                                    })()}
                                  </span>
                                </div>
                              )}
                              
                              {/* السعر النهائي بعد الخصم */}
                              <div className="flex items-center justify-between text-base font-bold border-t border-green-200 pt-2">
                                <span className="text-green-700">{t("totalAfterDiscount")}: </span>
                                <span className="text-green-600">
                                  {order.total_after_discount?.toFixed(2) || 
                                   (order.total && order.discount_value 
                                    ? order.discount_type === "percent"
                                      ? (order.total * (1 - order.discount_value / 100)).toFixed(2)
                                      : (order.total - order.discount_value).toFixed(2)
                                    : "-")}{" "}{t("currency")}
                                </span>
                              </div>
                            </div>
                          </>
                        ) : (
                          /* حساب خصم العروض وعرض السعر مثل OrderDetailsDialogSimple */
                          (() => {
                            // حساب إجمالي الخصم من العروض
                            const appliedOffersData = order.applied_offers 
                              ? (typeof order.applied_offers === 'string' 
                                  ? JSON.parse(order.applied_offers) 
                                  : order.applied_offers)
                              : [];
                            
                            const totalOffersDiscount = appliedOffersData.reduce((sum: number, offer: any) => 
                              sum + (offer.discountAmount || 0), 0);
                            
                            const finalTotal = order.total || 0;
                            const originalTotal = finalTotal + totalOffersDiscount;
                            
                            if (totalOffersDiscount > 0) {
                              return (
                                <div className="space-y-2">
                                  {/* السعر الأصلي مشطوب */}
                                  <div className="flex items-center gap-2 text-lg text-gray-500">
                                    <span>{t("orderTotal")}:</span>
                                    <span className="line-through">
                                      {originalTotal.toFixed(2)} {t("currency")}
                                    </span>
                                  </div>
                                  
                                  {/* خصم العروض */}
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="font-medium text-green-700 flex items-center gap-1">
                                        <Gift className="h-4 w-4" />
                                        {t("offersDiscount") || "خصم العروض"}:
                                      </span>
                                      <span className="text-green-600 font-semibold">
                                        -{totalOffersDiscount.toFixed(2)} {t("currency")}
                                      </span>
                                    </div>
                                    
                                    {/* السعر النهائي */}
                                    <div className="flex items-center justify-between text-base font-bold border-t border-green-200 pt-2 mt-2">
                                      <span className="text-green-700">{t("totalAfterDiscount") || "الإجمالي بعد الخصم"}: </span>
                                      <span className="text-green-600">
                                        {finalTotal.toFixed(2)} {t("currency")}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                                <div className="flex items-center gap-2 text-lg font-bold">
                                  <span>{t("orderTotal")}:</span>
                                  <span className="text-primary">
                                    {finalTotal.toFixed(2)} {t("currency")}
                                  </span>
                                </div>
                              );
                            }
                          })()
                        )}
                      </div>
                      {canCancel(order) && (
                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 font-semibold"
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={cancellingId === order.id}
                        >
                          <XCircle className="h-5 w-5" />
                          {cancellingId === order.id
                            ? t("loading")
                            : t("cancel")}
                        </button>
                      )}
                    </div>
                    {/* ملاحظات الطلب */}
                    {safeOrder.notes && (
                      <div className="mt-2 text-sm text-gray-500">
                        <span className="font-semibold">
                          {t("orderNotes")}:
                        </span>{" "}
                        {safeDecompressNotes(safeOrder.notes)}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="bg-gray-50 border-t flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                    <CardDescription className="text-xs text-gray-500">
                      {order.status === "pending" && t("pending")}
                      {order.status === "processing" && t("processing")}
                      {order.status === "shipped" && t("shipped")}
                      {order.status === "delivered" && t("delivered")}
                      {order.status === "cancelled" && t("cancelled")}
                    </CardDescription>
                    <span className="text-xs text-gray-400">
                      {t("orderDate")}:{" "}
                      {new Date(order.created_at).toLocaleString("en-GB")}
                    </span>
                  </CardFooter>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* استدعاء مكون تفاصيل الطلبية */}
      <OrderDetailsDialog
        order={selectedOrderForDetails}
        isOpen={!!selectedOrderForDetails}
        onClose={() => {
          setSelectedOrderForDetails(null);
        }}
      />
    </div>
  );
};

export default Orders;
