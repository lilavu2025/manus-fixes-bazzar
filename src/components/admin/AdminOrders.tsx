import React, { useState, useEffect, useMemo, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useUpdateOrderStatus,
  useAddOrder,
  useEditOrder,
  useDeleteOrder,
} from "@/integrations/supabase/reactQueryHooks";
import { useLanguage } from "../../utils/languageContextUtils";
import { useAuth } from "@/contexts/useAuth";
import { useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { Address } from "@/types";
import { useOrdersRealtime } from "@/hooks/useOrdersRealtime";
import { useProductsRealtime } from "@/hooks/useProductsRealtime";
import { compressText } from "@/utils/textCompression";
import { calculateOrderTotal } from "../../orders/order.utils";
import { safeDecompressNotes } from "../../orders/order.utils";
import { filteredOrders as filterOrdersUtil, advancedFilteredOrders as advFilteredOrdersUtil, advancedFilteredOrdersWithoutStatus as advFilteredOrdersNoStatusUtil } from "../../orders/order.filters";
import { getOrderStats as getOrderStatsUtil } from "../../orders/order.stats";
import { getOrderEditChangesDetailed as getOrderEditChangesDetailedUtil } from "../../orders/order.compare";
import { addOrderItemToForm, removeOrderItemFromForm, updateOrderItemInForm } from "../../orders/order.form.utils";
import OrderCard from "./orders/OrderCard";
import OrderDetailsPrint from "./orders/OrderDetailsPrint";
import OrderDeleteDialog from "./orders/OrderDeleteDialog";
import OrderDetailsDialog from "./orders/OrderDetailsDialog";
import OrderFiltersBar from "./orders/OrderFiltersBar";
import OrderStatsBar from "./orders/OrderStatsBar";
import AdminHeader from "./AdminHeader";
import ConfirmEditOrderDialog from "./ConfirmEditOrderDialog";
import type { Change, Order, OrderItem, NewOrderForm } from "../../orders/order.types";
import { mapOrderFromDb } from "../../orders/order.helpers";
import { initialOrderForm } from "../../orders/order.initialForm";
import OrderAddDialog from "./orders/OrderAddDialog";
import OrderEditDialog from "./orders/OrderEditDialog";
import { generateWhatsappMessage } from "@/orders/order.whatsapp";
import VirtualScrollList from "../VirtualScrollList";

// مكون إدارة الطلبات الرئيسي في لوحة تحكم الأدمن
const AdminOrders: React.FC = () => {
  // اللغة والاتجاه
  const { t, isRTL, language } = useLanguage();
  // بيانات المستخدم الحالي
  const { user, profile } = useAuth();
  // كاش الاستعلامات
  const queryClient = useQueryClient();
  // موقع الصفحة (للتعامل مع الفلاتر من التنقل)
  const location = useLocation();

  // حالات الفلاتر والبحث
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [orderForm, setOrderForm] = useState<NewOrderForm>(initialOrderForm);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [allowCustomClient, setAllowCustomClient] = useState(false);
  const [showEditOrder, setShowEditOrder] = useState(false);
  const [editOrderForm, setEditOrderForm] = useState<NewOrderForm | null>(null);
  const [editOrderId, setEditOrderId] = useState<string | null>(null);
  const [showConfirmEditDialog, setShowConfirmEditDialog] = useState(false);
  const [editOrderChanges, setEditOrderChanges] = useState<Change[]>([]);
  const [originalOrderForEdit, setOriginalOrderForEdit] = useState<Order | null>(null);
  const virtualListRef = useRef<HTMLDivElement>(null);
  // جلب المستخدمين والمنتجات
  const { users, isLoading: usersLoading } = useAdminUsers();
  const { products, loading: productsLoading } = useProductsRealtime();

  // التعامل مع الفلاتر القادمة من التنقل بين الصفحات
  useEffect(() => {
    if (location.state?.filterStatus) {
      setStatusFilter(location.state.filterStatus);
    }
    if (location.state?.filterOrderId) {
      setSearchQuery(location.state.filterOrderId);
    }
  }, [location.state]);

  // جلب الطلبات بشكل لحظي
  const {
    orders,
    loading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
    setOrders,
  } = useOrdersRealtime();

  // ربط دوال التعامل مع الطلبات (تحديث، حذف، إضافة، تعديل)
  const updateOrderStatusMutation = useUpdateOrderStatus();
  const deleteOrderMutation = useDeleteOrder();
  const addOrderMutation = useAddOrder();
  const editOrderMutation = useEditOrder();

  // تعريف المستخدم بشكل آمن
  const safeUser =
    typeof user === "object" && user && "user_metadata" in user
      ? (user as {
          user_metadata?: { full_name?: string; email?: string };
          email?: string;
        })
      : undefined;
  const safeUserMeta = safeUser?.user_metadata;

  // تحديث حالة الطلب
  const updateOrderStatus = (orderId: string, newStatus: string) => {
    updateOrderStatusMutation.mutate(
      {
        orderId,
        newStatus,
        userMeta: {
          full_name: safeUserMeta?.full_name,
          email: safeUser?.email,
        },
      },
      {
        onSuccess: () => {
          toast.success(t("orderStatusUpdatedSuccess"));
          refetchOrders();
          queryClient.invalidateQueries({ queryKey: ["admin-orders-stats"] }); // إعادة جلب إحصائيات لوحة التحكم
        },
        onError: (err: unknown) => {
          toast.error(t("orderStatusUpdateFailed"));
        },
      },
    );
  };

  // إضافة صنف جديد للطلب
  const addOrderItem = () => {
    setOrderForm((prev) => addOrderItemToForm(prev, products));
  };

  // حذف صنف من الطلب
  const removeOrderItem = (itemId: string) => {
    setOrderForm((prev) => removeOrderItemFromForm(prev, itemId));
  };

  // تحديث صنف في الطلب
  const updateOrderItem = (
    itemId: string,
    field: keyof OrderItem,
    value: string | number,
  ) => {
    setOrderForm((prev) => updateOrderItemInForm(prev, itemId, field, value, products));
  };

  // إضافة طلب جديد
  const handleAddOrder = async () => {
    try {
      setIsAddingOrder(true);
      if (!orderForm.user_id && !allowCustomClient) {
        toast.error(t("selectCustomerRequired"));
        setIsAddingOrder(false);
        return;
      }
      if (orderForm.items.length === 0) {
        toast.error(t("addAtLeastOneProduct"));
        setIsAddingOrder(false);
        return;
      }
      if (
        !orderForm.shipping_address.fullName ||
        !orderForm.shipping_address.phone
      ) {
        toast.error(t("enterShippingInfo"));
        setIsAddingOrder(false);
        return;
      }
      const total = calculateOrderTotal(orderForm.items);
      const orderInsertObj = {
        items: orderForm.items as any, // لضمان التوافق مع نوع JSON
        total,
        status: orderForm.status,
        payment_method: orderForm.payment_method,
        shipping_address: orderForm.shipping_address as any, // إرسال كائن العنوان مباشرة وليس كنص
        notes: orderForm.notes ? compressText(orderForm.notes) : null,
        admin_created: true,
        admin_creator_name: safeUserMeta?.full_name || safeUser?.email,
        ...(orderForm.user_id
          ? { user_id: orderForm.user_id }
          : { customer_name: orderForm.shipping_address.fullName }),
        ...(orderForm.discountEnabled && orderForm.discountValue && orderForm.discountType
          ? {
              discount_type: orderForm.discountType,
              discount_value: orderForm.discountValue,
              total_after_discount:
                orderForm.discountType === "percent"
                  ? Math.max(
                      total - (total * orderForm.discountValue) / 100,
                      0
                    )
                  : Math.max(total - orderForm.discountValue, 0),
            }
          : {}),
      };
      const orderItems = orderForm.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      }));
      addOrderMutation.mutate(
        {
          orderInsertObj,
          orderItems: orderItems as any[],
        },
        {
          onSuccess: () => {
            toast.success(t("orderAddedSuccess"));
            setShowAddOrder(false);
            setOrderForm(initialOrderForm);
            refetchOrders();
            queryClient.invalidateQueries({ queryKey: ["admin-orders-stats"] }); // إعادة جلب إحصائيات لوحة التحكم
          },
          onError: (error: unknown) => {
            toast.error(t("orderAddFailed"));
          },
          onSettled: () => {
            setIsAddingOrder(false);
          },
        },
      );
    } catch (error: unknown) {
      toast.error(t("orderAddFailed"));
      setIsAddingOrder(false);
    }
  };

  // تعديل الطلب (يتم استدعاؤها من Dialog التعديل)
  const handleEditOrder = async () => {
    if (!editOrderForm || !editOrderId) return;
    if (!editOrderForm.items || editOrderForm.items.length === 0) {
      toast.error(t("orderMustHaveItems") || "يجب أن تحتوي الطلبية على صنف واحد على الأقل.");
      return;
    }
    setIsAddingOrder(true);
    try {
      const total = editOrderForm.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      );
      const updateObj = {
        items: editOrderForm.items as any, // إرسال المصفوفة مباشرة وليس كنص
        total,
        status: editOrderForm.status,
        payment_method: editOrderForm.payment_method,
        shipping_address: editOrderForm.shipping_address as any, // إرسال كائن العنوان مباشرة وليس كنص
        notes: editOrderForm.notes ? compressText(editOrderForm.notes) : null,
        updated_at: new Date().toISOString(),
        ...(editOrderForm.shipping_address.fullName
          ? { customer_name: editOrderForm.shipping_address.fullName }
          : {}),
      };
      const orderItems = editOrderForm.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      }));
      editOrderMutation.mutate(
        { editOrderId, updateObj, orderItems },
        {
          onSuccess: () => {
            toast.success(t("orderEditSuccess"));
            setShowEditOrder(false);
            setEditOrderForm(null);
            setEditOrderId(null);
            refetchOrders();
            queryClient.invalidateQueries({ queryKey: ["admin-orders-stats"] }); // إعادة جلب إحصائيات لوحة التحكم
          },
          onError: (error: unknown) => {
            toast.error(t("orderEditFailed"));
          },
          onSettled: () => {
            setIsAddingOrder(false);
          },
        },
      );
    } catch (error) {
      toast.error(t("orderEditFailed"));
      setIsAddingOrder(false);
    }
  };

  // فلترة الطلبات حسب الفلاتر المختارة
  const filteredOrdersMemo = useMemo(() => filterOrdersUtil(orders, statusFilter), [orders, statusFilter]);
  const advancedFilteredOrdersMemo = useMemo(() => advFilteredOrdersUtil(filteredOrdersMemo, dateFrom, dateTo, paymentFilter, searchQuery), [filteredOrdersMemo, dateFrom, dateTo, paymentFilter, searchQuery]);
  const advancedFilteredOrdersWithoutStatusMemo = useMemo(() => advFilteredOrdersNoStatusUtil(orders, dateFrom, dateTo, paymentFilter, searchQuery), [orders, dateFrom, dateTo, paymentFilter, searchQuery]);

  // حساب الإحصائيات من جميع الطلبات (بدون فلترة)
  const stats = React.useMemo(() => getOrderStatsUtil((Array.isArray(orders) ? orders.map(o => {
    let shipping_address: Address = { id: "", fullName: "", phone: "", city: "", area: "", street: "", building: "" };
    if (typeof o.shipping_address === "object" && o.shipping_address !== null && !Array.isArray(o.shipping_address)) {
      shipping_address = {
        id: o.shipping_address.id ? String(o.shipping_address.id) : "",
        fullName: o.shipping_address.fullName ? String(o.shipping_address.fullName) : "",
        phone: o.shipping_address.phone ? String(o.shipping_address.phone) : "",
        city: o.shipping_address.city ? String(o.shipping_address.city) : "",
        area: o.shipping_address.area ? String(o.shipping_address.area) : "",
        street: o.shipping_address.street ? String(o.shipping_address.street) : "",
        building: o.shipping_address.building ? String(o.shipping_address.building) : "",
        floor: o.shipping_address.floor ? String(o.shipping_address.floor) : undefined,
        apartment: o.shipping_address.apartment ? String(o.shipping_address.apartment) : undefined,
      };
    }
    return {
      id: o.id,
      status: (o.status === "pending" || o.status === "processing" || o.status === "shipped" || o.status === "delivered" || o.status === "cancelled") ? o.status : "pending",
      payment_method: o.payment_method || "cash",
      created_at: o.created_at,
      user_id: o.user_id || "",
      items: Array.isArray(o.items) ? o.items.map((item: any) => ({
        id: item.id || "",
        product_id: item.product_id || "",
        quantity: item.quantity || 0,
        price: item.price || 0,
        product_name: item.product_name || "",
      })) : [],
      total: typeof o.total === "number" ? o.total : 0,
      shipping_address,
      updated_at: o.updated_at || "",
      customer_name: o.customer_name || "",
    };
  }) : [])), [orders]);

  // حذف الطلب مع تأكيد
  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    deleteOrderMutation.mutate(orderToDelete.id, {
      onSuccess: () => {
        toast.success(t("orderDeletedSuccess"));
        setShowDeleteDialog(false);
        setOrderToDelete(null);
        refetchOrders();
        queryClient.invalidateQueries({ queryKey: ["admin-orders-stats"] }); // إعادة جلب إحصائيات لوحة التحكم
      },
      onError: () => {
        toast.error(t("orderDeleteFailed"));
      },
    });
  };

  // عند اختيار مستخدم من القائمة
  const handleSelectUser = React.useCallback(
    (userId: string) => {
      setOrderForm((prev) => {
        if (!userId)
          return {
            ...prev,
            user_id: "",
            shipping_address: {
              ...prev.shipping_address,
              fullName: "",
              phone: "",
            },
          };
        const user = users.find((u) => u.id === userId);
        if (user) {
          return {
            ...prev,
            user_id: userId,
            shipping_address: {
              ...prev.shipping_address,
              fullName: user.full_name || "",
              phone: user.phone || "",
            },
          };
        }
        return { ...prev, user_id: userId };
      });
    },
    [users],
  );

  // شاشة تحميل الطلبات
  if (ordersLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{t("manageOrders")}</h1>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto animate-spin rounded-full border-primary"></div>
          <p className="mt-4 text-gray-600">{t("loadingOrders")}</p>
        </div>
      </div>
    );
  }

  // شاشة ظهور خطأ في جلب الطلبات
  if (ordersError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{t("manageOrders")}</h1>
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <XCircle className="h-16 w-16 text-red-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-900 mb-2">
                {t("errorLoadingOrders")}
              </h3>
              <p className="text-red-600 mb-4">{ordersError.message}</p>
              <Button onClick={() => refetchOrders()}>{t("retry")}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // شاشة إدارة الطلبات الرئيسية
  return (
    <div
      className={`space-y-6 ${isRTL ? "text-right" : "text-left"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* شريط الإحصائيات */}
      <OrderStatsBar
        stats={stats}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        t={t}
      />
      {/* شريط الفلاتر */}
      <OrderFiltersBar
        t={t}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        paymentFilter={paymentFilter}
        setPaymentFilter={setPaymentFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onResetFilters={() => {
          setStatusFilter("all");
          setDateFrom("");
          setDateTo("");
          setPaymentFilter("all");
          setSearchQuery("");
        }}
        onExportExcel={() => {}}
      />
      {/* رأس الصفحة مع زر إضافة طلب */}
      <AdminHeader
        title={t("orders") || "الطلبات"}
        count={advancedFilteredOrdersMemo.length}
        addLabel={t("addNewOrder") || "إضافة طلب جديد"}
        onAdd={() => setShowAddOrder(true)}
      />
      {/* Dialog إضافة طلب جديد */}
      <OrderAddDialog
        open={showAddOrder}
        onOpenChange={setShowAddOrder}
        orderForm={orderForm}
        setOrderForm={setOrderForm}
        allowCustomClient={allowCustomClient}
        setAllowCustomClient={setAllowCustomClient}
        users={users}
        products={products}
        addOrderItem={addOrderItem}
        removeOrderItem={removeOrderItem}
        updateOrderItem={updateOrderItem}
        handleSelectUser={handleSelectUser}
        isAddingOrder={isAddingOrder}
        handleAddOrder={handleAddOrder}
        t={t}
      />
      {/* قائمة الطلبات مع تمرير الفلاتر */}
      {advancedFilteredOrdersMemo.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {statusFilter === "all"
                  ? t("noOrders")
                  : t("noOrdersForStatus") + " \" " + t(statusFilter) + " \"" }
              </h3>
              <p className="text-gray-500">
                {statusFilter === "all"
                  ? t("ordersWillAppearHere")
                  : t("tryChangingFilterToShowOtherOrders")}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="w-full">
          <VirtualScrollList
            items={advancedFilteredOrdersMemo}
            itemHeight={270}
            containerHeight={window.innerHeight - 320}
            overscan={6}
            getItemKey={(order) => order.id}
            renderItem={(order, idx) => {
              // جلب الطلب الأحدث من قاعدة البيانات
              const latestOrder = Array.isArray(orders)
                ? orders.find((o) => o.id === order.id) || order
                : order;
              // معالجة أصناف الطلب
              let items = [];
              if (typeof latestOrder.items === "string") {
                try {
                  items = JSON.parse(latestOrder.items);
                } catch {
                  items = [];
                }
              } else if (Array.isArray(latestOrder.items)) {
                items = latestOrder.items;
              }
              // معالجة عنوان الشحن
              let shipping_address: any = latestOrder.shipping_address;
              if (typeof shipping_address === "string") {
                try {
                  shipping_address = JSON.parse(shipping_address);
                } catch {
                  shipping_address = {};
                }
              } else if (typeof shipping_address !== "object" || shipping_address === null) {
                shipping_address = {};
              }
              const customerName = latestOrder.customer_name || shipping_address.fullName || latestOrder.profiles?.full_name || "";
              return (
                <OrderCard
                  key={order.id}
                  order={order}
                  orders={orders as any}
                  t={t}
                  onShowDetails={() => {
                    setSelectedOrder(
                      mapOrderFromDb({
                        ...latestOrder,
                        items,
                        shipping_address,
                      } as Record<string, unknown>),
                    );
                  }}
                  onShareWhatsapp={() => {
                    const msg = encodeURIComponent(generateWhatsappMessage(order, t));
                    window.open(`https://wa.me/?text=${msg}`, "_blank");
                  }}
                  onEdit={() => {
                    setEditOrderId(latestOrder.id);
                    // معالجة order_items من قاعدة البيانات
                    const items = Array.isArray((latestOrder as any).order_items)
                      ? (latestOrder as any).order_items.map(item => ({
                          id: item.id,
                          product_id: item.product_id,
                          quantity: item.quantity,
                          price: item.price,
                          product_name: item.products?.name_ar || item.products?.name_en || item.products?.id || "",
                        }))
                      : Array.isArray(latestOrder.items)
                        ? latestOrder.items
                        : [];
                    setEditOrderForm({
                      user_id: latestOrder.user_id,
                      payment_method: latestOrder.payment_method,
                      status: latestOrder.status,
                      notes: latestOrder.notes ? safeDecompressNotes(latestOrder.notes) : "",
                      items,
                      shipping_address: {
                        ...shipping_address,
                        fullName: customerName,
                      },
                    });
                    setOriginalOrderForEdit(mapOrderFromDb({ ...latestOrder, items, shipping_address } as Record<string, unknown>));
                    setShowEditOrder(true);
                  }}
                  onDelete={() => {
                    setOrderToDelete(order);
                    setShowDeleteDialog(true);
                  }}
                  onUpdateStatus={updateOrderStatus}
                />
              );
            }}
          />
        </div>
      )}
      {/* Dialog حذف الطلب */}
      <OrderDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        t={t}
        isRTL={isRTL}
        handleDeleteOrder={handleDeleteOrder}
        setShowDeleteDialog={setShowDeleteDialog}
      />
      {/* Dialog تفاصيل الطلب */}
      <OrderDetailsDialog
        open={!!selectedOrder}
        onOpenChange={() => setSelectedOrder(null)}
        order={selectedOrder}
        t={t}
        profile={profile}
        generateWhatsappMessage={generateWhatsappMessage}
      />
      {/* Dialog تعديل الطلب */}
      <OrderEditDialog
        open={showEditOrder}
        onOpenChange={(opened) => {
          setShowEditOrder(opened);
          if (!opened) {
            setEditOrderForm(null);
            setEditOrderId(null);
          }
        }}
        editOrderForm={editOrderForm}
        setEditOrderForm={setEditOrderForm}
        originalOrderForEdit={originalOrderForEdit}
        setEditOrderChanges={setEditOrderChanges}
        setShowConfirmEditDialog={setShowConfirmEditDialog}
        getOrderEditChangesDetailed={(original, edited) => getOrderEditChangesDetailedUtil(original, edited, t)}
        t={t}
        isRTL={isRTL}
        products={products}
      />
      {/* Dialog تأكيد تعديل الطلب */}
      <ConfirmEditOrderDialog
        open={showConfirmEditDialog}
        onConfirm={handleEditOrder}
        onCancel={() => setShowConfirmEditDialog(false)}
        changes={editOrderChanges}
      />
    </div>
  );
};

export default AdminOrders;
