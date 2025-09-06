import React, { useState, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { useEnhancedToast } from "@/hooks/useEnhancedToast";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { Address } from "@/types";
import { useOrdersRealtime } from "@/hooks/useOrdersRealtime";
import { useProductsRealtime } from "@/hooks/useProductsRealtime";
import { compressText } from "@/utils/commonUtils";
import { calculateOrderTotalWithFreeItems } from "../../orders/order.utils";
import { safeDecompressNotes } from "../../orders/order.utils";
import {
  filteredOrders as filterOrdersUtil,
  advancedFilteredOrders as advFilteredOrdersUtil,
  advancedFilteredOrdersWithoutStatus as advFilteredOrdersNoStatusUtil
} from "../../orders/order.filters";
import { getOrderStats as getOrderStatsUtil } from "../../orders/order.stats";
import { getOrderEditChangesDetailed as getOrderEditChangesDetailedUtil } from "../../orders/order.compare";
import { addOrderItemToForm, removeOrderItemFromForm, updateOrderItemInForm } from "../../orders/order.form.utils";
import OrderCard from "./orders/OrderCard";
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
import { orderPrint } from "@/orders/order.print";
import { downloadInvoicePdf } from "@/orders/order.pdf";
import VirtualScrollList from "../VirtualScrollList";
import { exportOrdersToExcel } from "@/orders/order.export";

// ================= Helpers =================

// Normalize any unknown "json" field to a JS value or null
function normalizeJsonField(raw: any) {
  if (!raw) return null;
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return null; }
  }
  return raw;
}

// Normalize free refs to the canonical shape: { productId, quantity }
function normalizeFreeRefs(raw: any): { productId: string; quantity: number; variantId?: string | null; variantAttributes?: any }[] {
  const arr = normalizeJsonField(raw);
  if (!Array.isArray(arr)) return [];
  const out: { productId: string; quantity: number; variantId?: string | null; variantAttributes?: any }[] = [];
  for (const r of arr) {
    const pid =
      r?.productId ||
      r?.product_id ||
      r?.product?.id ||
      r?.productId?.id ||
      null;
    const qty = Number(r?.quantity || r?.qty || 1);
    const variantId = r?.variantId ?? r?.variant_id ?? null;
    const variantAttributes = r?.variantAttributes ?? r?.variant_attributes ?? null;
    if (pid) out.push({ productId: String(pid), quantity: qty > 0 ? qty : 1, variantId, variantAttributes });
  }
  // dedupe by productId, keep max quantity
  const map = new Map<string, { quantity: number; variantId?: string | null; variantAttributes?: any }>();
  for (const x of out) {
    const key = x.variantId ? `${x.productId}__${x.variantId}` : x.productId;
    const prev = map.get(key);
    if (!prev) map.set(key, { quantity: x.quantity, variantId: x.variantId ?? null, variantAttributes: x.variantAttributes ?? null });
    else map.set(key, { quantity: Math.max(prev.quantity, x.quantity), variantId: prev.variantId ?? x.variantId ?? null, variantAttributes: prev.variantAttributes ?? x.variantAttributes ?? null });
  }
  return Array.from(map.entries()).map(([key, v]) => {
    const [productId, variantId] = key.includes("__") ? key.split("__") : [key, null];
    return { productId, quantity: v.quantity, variantId: variantId || v.variantId || null, variantAttributes: v.variantAttributes ?? null };
  });
}

// Build a canonical freeRefs from either free_items or applied_offers.freeProducts
function getCanonicalFreeRefs(free_items_raw: any, applied_offers_raw: any) {
  const fromFree = normalizeFreeRefs(free_items_raw);
  if (fromFree.length > 0) return fromFree;
  const applied = normalizeJsonField(applied_offers_raw);
  const allFreeFromApplied = Array.isArray(applied)
    ? applied.flatMap((a: any) => {
        const arr = Array.isArray(a?.freeProducts) ? a.freeProducts : [];
        return arr.map((r: any) => ({
          productId: r?.productId ?? r?.product_id,
          quantity: r?.quantity ?? r?.qty ?? 1,
          variantId: r?.variantId ?? r?.variant_id ?? null,
          variantAttributes: r?.variantAttributes ?? r?.variant_attributes ?? null,
        }));
      })
    : [];
  return normalizeFreeRefs(allFreeFromApplied);
}

// Ensure free items exist in items[] based on canonical freeRefs
function injectFreeItemsIfMissing(
  items: any[],
  freeRefs: { productId: string; quantity: number; variantId?: string | null; variantAttributes?: any }[],
  products: any[],
  userType: 'retail' | 'wholesale' | 'admin' = 'retail'
) {
  const hasFree = new Set(
    items
      .filter(it => it?.is_free || Number(it?.price) === 0)
      .map(it => String(it.product_id))
  );

  const getOriginalPrice = (p: any) => {
    const wholesale = typeof p?.wholesale_price === 'number' && p.wholesale_price > 0 ? p.wholesale_price : 0;
    if (userType === 'admin' || userType === 'wholesale') return wholesale > 0 ? wholesale : (p?.price || 0);
    return p?.price || 0;
  };

  const additions: any[] = [];
  for (const ref of freeRefs) {
    if (!ref?.productId || hasFree.has(String(ref.productId))) continue;
    const prod = products.find(p => String(p.id) === String(ref.productId));
    if (!prod) continue;
    additions.push({
      id: `free_${ref.productId}_${Date.now()}_${Math.random()}`,
      product_id: ref.productId,
      quantity: ref.quantity || 1,
      price: 0,
      is_free: true,
      product_name: prod.name_ar || prod.name_en || prod.id,
      original_price: getOriginalPrice(prod),
  ...(ref.variantId ? { variant_id: ref.variantId } : {}),
  ...(ref.variantAttributes ? { variant_attributes: ref.variantAttributes } : {}),
    });
  }
  return additions.length ? [...items, ...additions] : items;
}

// Summarize offers from items[] (canonical shapes)
function summarizeOffersForSave(items: any[]) {
  const appliedMap: Record<string, {
    offer: any;
    discountAmount: number;
    affectedProducts: string[];
    freeProducts: { productId: string; quantity: number; variantId?: string | null; variantAttributes?: any }[];
  }> = {};
  const freeItemsOut: { productId: string; quantity: number; variantId?: string | null; variantAttributes?: any }[] = [];

  for (const it of items || []) {
    const offerId = it?.offer_id || it?.offer?.id;
    const offerName = it?.offer_name || it?.offer?.title_ar || it?.offer?.title_en;
    if (offerId && !appliedMap[offerId]) {
      appliedMap[offerId] = {
        offer: { id: offerId, title_ar: offerName, title_en: offerName },
        discountAmount: 0,
        affectedProducts: [],
        freeProducts: [],
      };
    }

    // discounts
    if (offerId && it?.offer_applied && typeof it?.original_price === "number") {
      const perUnitDiscount = Math.max(0, it.original_price - (it.price ?? 0));
      appliedMap[offerId].discountAmount += perUnitDiscount * (it.quantity || 0);
      const pid = String(it.product_id || "");
      if (pid && !appliedMap[offerId].affectedProducts.includes(pid)) {
        appliedMap[offerId].affectedProducts.push(pid);
      }
    }

    // free items
    if (it?.is_free) {
      const pid = String(it.product_id || "");
      const qty = Number(it.quantity || 1);
      if (pid) {
        freeItemsOut.push({ productId: pid, quantity: qty > 0 ? qty : 1, variantId: (it as any)?.variant_id ?? null, variantAttributes: (it as any)?.variant_attributes ?? null });
        if (offerId) {
          appliedMap[offerId].freeProducts.push({ productId: pid, quantity: qty > 0 ? qty : 1, variantId: (it as any)?.variant_id ?? null, variantAttributes: (it as any)?.variant_attributes ?? null });
        }
      }
    }
  }

  // dedupe freeItemsOut
  const freeMap = new Map<string, { quantity: number; variantId?: string | null; variantAttributes?: any }>();
  for (const f of freeItemsOut) {
    const key = f.variantId ? `${f.productId}__${f.variantId}` : f.productId;
    const prev = freeMap.get(key);
    if (!prev) freeMap.set(key, { quantity: f.quantity, variantId: f.variantId ?? null, variantAttributes: f.variantAttributes ?? null });
    else freeMap.set(key, { quantity: Math.max(prev.quantity, f.quantity), variantId: prev.variantId ?? f.variantId ?? null, variantAttributes: prev.variantAttributes ?? f.variantAttributes ?? null });
  }
  const canonicalFree = Array.from(freeMap.entries()).map(([key, v]) => {
    const [productId, variantId] = key.includes("__") ? key.split("__") : [key, null];
    return { productId, quantity: v.quantity, variantId: variantId || v.variantId || null, variantAttributes: v.variantAttributes ?? null };
  });

  return { applied_offers: Object.values(appliedMap), free_items: canonicalFree };
}

// ================= Component =================

const AdminOrders: React.FC = () => {
  const { t, isRTL, language } = useLanguage();
  const enhancedToast = useEnhancedToast();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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

  const { users } = useAdminUsers();
  const { products } = useProductsRealtime();

  useEffect(() => {
    const st: any = (location as any).state;
    if (st?.filterStatus) setStatusFilter(st.filterStatus);
    if (st?.filterOrderId) setSearchQuery(st.filterOrderId);
    if (st?.searchQuery) setSearchQuery(st.searchQuery);
  }, [location.state]);

  const {
    orders,
    loading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useOrdersRealtime();

  const updateOrderStatusMutation = useUpdateOrderStatus();
  const deleteOrderMutation = useDeleteOrder();
  const addOrderMutation = useAddOrder();
  const editOrderMutation = useEditOrder();

  const safeUser =
    typeof user === "object" && user && "user_metadata" in user
      ? (user as { user_metadata?: { full_name?: string; email?: string }; email?: string })
      : undefined;
  const adminCreatorName =
    profile?.full_name || safeUser?.user_metadata?.full_name || safeUser?.email || "مدير غير محدد";

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    updateOrderStatusMutation.mutate(
      { orderId, newStatus, userMeta: { full_name: safeUser?.user_metadata?.full_name, email: safeUser?.email } },
      {
        onSuccess: () => {
          enhancedToast.operationSuccess("orderStatusUpdatedSuccess");
          refetchOrders();
          queryClient.invalidateQueries({ queryKey: ["admin-orders-stats"] });
        },
        onError: () => enhancedToast.operationError("orderStatusUpdateFailed"),
      }
    );
  };

  const addOrderItem = () => {
    const userType = allowCustomClient ? 'retail' : (profile?.user_type || 'retail');
    setOrderForm((prev) => addOrderItemToForm(prev, products, undefined, userType));
  };
  const removeOrderItem = (itemId: string) => setOrderForm((prev) => removeOrderItemFromForm(prev, itemId));
  const updateOrderItem = (itemId: string, field: keyof OrderItem, value: string | number) => {
    const userType = allowCustomClient ? 'retail' : (profile?.user_type || 'retail');
    setOrderForm((prev) => updateOrderItemInForm(prev, itemId, field, value, products, userType));
  };

  // ================= Add Order =================
  const handleAddOrder = async (payload?: { items: any[]; applied_offers: any[]; free_items: any[]; totalDiscount: number }) => {
    try {
      setIsAddingOrder(true);
      if (!orderForm.user_id && !allowCustomClient) {
        enhancedToast.error("selectCustomerRequired");
        setIsAddingOrder(false);
        return;
      }
      if (orderForm.items.length === 0) {
        enhancedToast.error("addAtLeastOneProduct");
        setIsAddingOrder(false);
        return;
      }
      if (!orderForm.shipping_address.fullName || !orderForm.shipping_address.phone) {
        enhancedToast.error("enterShippingInfo");
        setIsAddingOrder(false);
        return;
      }

      // العروض: إن تم تمرير payload من الدايالوج نستخدمه مباشرة، وإلا نستخدم ما في الفورم أو نلخّص
      const baseItems = Array.isArray(payload?.items) && payload!.items.length > 0 ? payload!.items : orderForm.items;
      const hasDialogApplied = Array.isArray(payload?.applied_offers) && payload!.applied_offers.length > 0;
      const hasDialogFree = Array.isArray(payload?.free_items) && payload!.free_items.length > 0;
      const summarized = summarizeOffersForSave(baseItems);

      // 1) نبني قائمة مجانية مبركنة (canonical) ومُزالة التكرار
      const free_items = (hasDialogFree ? payload!.free_items : summarized.free_items) || [];

      // 2) نخزّن العروض بدون أي freeProducts لمنع التكرار
      const rawApplied = (hasDialogApplied ? payload!.applied_offers : summarized.applied_offers) || [];
      const applied_offers = rawApplied.map((a: any) => ({
        ...a,
        freeProducts: [], // مهم: نفرغها دائماً
      }));


      const total = calculateOrderTotalWithFreeItems(orderForm.items);

      const orderInsertObj: any = {
        items: baseItems as any,
        total,
        status: orderForm.status,
        payment_method: orderForm.payment_method,
        shipping_address: orderForm.shipping_address as any,
        notes: orderForm.notes ? compressText(orderForm.notes) : null,
        admin_created: true,
        admin_creator_name: adminCreatorName,
        ...(orderForm.user_id
          ? { user_id: orderForm.user_id }
          : { customer_name: orderForm.shipping_address.fullName }),
        ...(orderForm.discountEnabled && orderForm.discountValue && orderForm.discountType
          ? {
            discount_type: orderForm.discountType,
            discount_value: orderForm.discountValue,
            total_after_discount:
              orderForm.discountType === "percent"
                ? Math.max(total - (total * orderForm.discountValue) / 100, 0)
                : Math.max(total - orderForm.discountValue, 0),
          }
          : {}),
        applied_offers: JSON.stringify(applied_offers || []),
        free_items: JSON.stringify(free_items || []),
      };

  // Build order items from the baseItems we are saving (payload-normalized) to avoid state race
  const orderItems = baseItems
        .filter((it: any) => !it?.is_free)
        .map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          // keep variant data if present
          ...(item as any).variant_id ? { variant_id: (item as any).variant_id } : {},
          ...(item as any).variant_attributes ? { variant_attributes: (item as any).variant_attributes } : {},
        }));

      addOrderMutation.mutate(
        { orderInsertObj, orderItems: orderItems as any[] },
        {
          onSuccess: () => {
            enhancedToast.adminSuccess("orderAdded");
            setShowAddOrder(false);
            setOrderForm(initialOrderForm);
            setAllowCustomClient(false);
            refetchOrders();
            queryClient.invalidateQueries({ queryKey: ["admin-orders-stats"] });
          },
          onError: () => toast.error(t("orderAddFailed")),
          onSettled: () => setIsAddingOrder(false),
        }
      );
    } catch {
      toast.error(t("orderAddFailed"));
      setIsAddingOrder(false);
    }
  };

  // ================= Edit Order =================
  const handleEditOrder = async () => {
    if (!editOrderForm || !editOrderId) return;
    if (!editOrderForm.items || editOrderForm.items.length === 0) {
      toast.error(t("orderMustHaveItems") || "يجب أن تحتوي الطلبية على صنف واحد على الأقل.");
      return;
    }
    setIsAddingOrder(true);
    try {
      // Build canonical free refs from either field
      const freeRefs = getCanonicalFreeRefs(
        (editOrderForm as any).free_items,
        (editOrderForm as any).applied_offers
      );

      const userType: any =
        ((originalOrderForEdit as any)?.profiles?.user_type) ||
        (profile as any)?.user_type ||
        "retail";

      const itemsWithFree = injectFreeItemsIfMissing(
        [...(editOrderForm.items || [])],
        freeRefs,
        products,
        userType
      );

      // stabilize in form
      editOrderForm.items = itemsWithFree;

      // Totals
      const total = calculateOrderTotalWithFreeItems(itemsWithFree);

      // حساب خصم العروض من العناصر المحفوظة
      const original_total = (itemsWithFree || []).reduce((sum, it: any) => {
        if (it?.is_free) return sum; // تجاهل العناصر المجانية
        const unit = typeof it?.original_price === "number" ? it.original_price : (it.price || 0);
        return sum + unit * (it.quantity || 0);
      }, 0);
      const discount_from_offers = Math.max(0, original_total - total);

      // تفضيل شكل OfferService القادم من الدايالوج إن توفّر
      const hasDialogAppliedEdit = Array.isArray((editOrderForm as any)?.applied_offers_obj) && (editOrderForm as any).applied_offers_obj.length > 0;
      const hasDialogFreeEdit = Array.isArray((editOrderForm as any)?.free_items_obj) && (editOrderForm as any).free_items_obj.length > 0;
      const summarizedEdit = summarizeOffersForSave(itemsWithFree);

      // 1) canonical free_items
      const free_items = (hasDialogFreeEdit ? (editOrderForm as any).free_items_obj : summarizedEdit.free_items) || [];

      // 2) applied_offers بلا freeProducts
      const rawAppliedEdit = (hasDialogAppliedEdit ? (editOrderForm as any).applied_offers_obj : summarizedEdit.applied_offers) || [];
      const applied_offers = rawAppliedEdit.map((a: any) => ({
        ...a,
        freeProducts: [], // مهم جداً
      }));
      const updateObj: any = {
        items: itemsWithFree as any,
        total,
        discount_from_offers,
        applied_offers: JSON.stringify(applied_offers || []),
        free_items: JSON.stringify(free_items || []),
        status: editOrderForm.status,
        payment_method: editOrderForm.payment_method,
        shipping_address: editOrderForm.shipping_address as any,
        notes: editOrderForm.notes ? compressText(editOrderForm.notes) : null,
        updated_at: new Date().toISOString(),
        ...(editOrderForm.shipping_address.fullName
          ? { customer_name: editOrderForm.shipping_address.fullName }
          : {}),
      };

      // Manual discount
      const updateObjWithDiscount = {
        ...updateObj,
        ...(
          (!editOrderForm.discountEnabled || !editOrderForm.discountValue)
            ? { discount_type: null, discount_value: null, total_after_discount: null }
            : {
              discount_type: editOrderForm.discountType || "amount",
              discount_value: Number(editOrderForm.discountValue) || 0,
              total_after_discount:
                editOrderForm.discountType === "percent"
                  ? Math.max(0, total - (total * (Number(editOrderForm.discountValue) || 0) / 100))
                  : Math.max(0, total - (Number(editOrderForm.discountValue) || 0)),
            }
        )
      };

      const orderItems = itemsWithFree
        .filter((it: any) => !it?.is_free)
        .map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price, // السعر النهائي (بعد الخصم)
          ...(item as any).variant_id ? { variant_id: (item as any).variant_id } : {},
          ...(item as any).variant_attributes ? { variant_attributes: (item as any).variant_attributes } : {},
        }));

      editOrderMutation.mutate(
        { editOrderId, updateObj: updateObjWithDiscount, orderItems },
        {
          onSuccess: () => {
            enhancedToast.adminSuccess("orderEdited");
            setShowEditOrder(false);
            setEditOrderForm(null);
            setEditOrderId(null);
            setShowConfirmEditDialog(false);
            // Stocks are reconciled inside editOrder() now (restore old variants before delete, deduct after insert)
            refetchOrders();
            queryClient.invalidateQueries({ queryKey: ["admin-orders-stats"] });
          },
          onError: () => toast.error(t("orderEditFailed")),
          onSettled: () => setIsAddingOrder(false),
        }
      );
    } catch {
      toast.error(t("orderEditFailed"));
      setIsAddingOrder(false);
    }
  };

  // ================= Lists & Stats =================
  const filteredOrdersMemo = useMemo(() => filterOrdersUtil(orders, statusFilter), [orders, statusFilter]);
  const advancedFilteredOrdersMemo = useMemo(
    () => advFilteredOrdersUtil(filteredOrdersMemo, dateFrom, dateTo, paymentFilter, searchQuery),
    [filteredOrdersMemo, dateFrom, dateTo, paymentFilter, searchQuery]
  );
  const advancedFilteredOrdersWithoutStatusMemo = useMemo(
    () => advFilteredOrdersNoStatusUtil(orders, dateFrom, dateTo, paymentFilter, searchQuery),
    [orders, dateFrom, dateTo, paymentFilter, searchQuery]
  );

  const stats = React.useMemo(() => getOrderStatsUtil((Array.isArray(orders) ? orders.map(o => {
    let shipping_address: Address = { id: "", fullName: "", phone: "", city: "", area: "", street: "", building: "" };
    if (typeof o.shipping_address === "object" && o.shipping_address !== null && !Array.isArray(o.shipping_address)) {
      shipping_address = {
        id: (o as any).shipping_address.id ? String((o as any).shipping_address.id) : "",
        fullName: (o as any).shipping_address.fullName ? String((o as any).shipping_address.fullName) : "",
        phone: (o as any).shipping_address.phone ? String((o as any).shipping_address.phone) : "",
        city: (o as any).shipping_address.city ? String((o as any).shipping_address.city) : "",
        area: (o as any).shipping_address.area ? String((o as any).shipping_address.area) : "",
        street: (o as any).shipping_address.street ? String((o as any).shipping_address.street) : "",
        building: (o as any).shipping_address.building ? String((o as any).shipping_address.building) : "",
        floor: (o as any).shipping_address.floor ? String((o as any).shipping_address.floor) : undefined,
        apartment: (o as any).shipping_address.apartment ? String((o as any).shipping_address.apartment) : undefined,
      };
    }
    return {
      id: o.id,
      status: (o.status === "pending" || o.status === "processing" || o.status === "shipped" || o.status === "delivered" || o.status === "cancelled") ? o.status : "pending",
      payment_method: o.payment_method || "cash",
      created_at: o.created_at,
      user_id: o.user_id || "",
      items: Array.isArray(o.items) ? (o.items as any[]).map((item: any) => ({
        id: item.id || "",
        product_id: item.product_id || "",
        quantity: item.quantity || 0,
        price: item.price || 0,
        product_name: item.product_name || "",
      })) : [],
      total: typeof o.total === "number" ? o.total : 0,
      shipping_address,
      updated_at: o.updated_at || "",
      customer_name: (o as any).customer_name || "",
    };
  }) : [])), [orders]);

  // ================= Delete =================
  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    deleteOrderMutation.mutate(orderToDelete.id, {
      onSuccess: () => {
        enhancedToast.adminSuccess("orderDeleted");
        setShowDeleteDialog(false);
        setOrderToDelete(null);
        refetchOrders();
        queryClient.invalidateQueries({ queryKey: ["admin-orders-stats"] });
      },
      onError: () => toast.error(t("orderDeleteFailed")),
    });
  };

  const handleSelectUser = React.useCallback(
    (userId: string) => {
      setOrderForm((prev) => {
        if (!userId)
          return {
            ...prev,
            user_id: "",
            shipping_address: { ...prev.shipping_address, fullName: "", phone: "" },
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

  const generateOrderPrint = async (order: any, t: any, currentLang: "ar" | "en" | "he") => {
    await orderPrint(order, t, language, profile?.full_name || "-", products);
  };

  if (ordersLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{t("manageOrders")}</h1>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto rounded-full border-primary"></div>
          <p className="mt-4 text-gray-600">{t("loadingOrders")}</p>
        </div>
      </div>
    );
  }

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
              <p className="text-red-600 mb-4">{(ordersError as any).message}</p>
              <Button onClick={() => refetchOrders()}>{t("retry")}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isRTL ? "text-right" : "text-left"}`} dir={isRTL ? "rtl" : "ltr"}>
      <OrderStatsBar
        stats={stats}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        t={t}
      />

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
          setStatusFilter("all"); setDateFrom(""); setDateTo(""); setPaymentFilter("all"); setSearchQuery("");
        }}
        onExportExcel={() => {
          try {
            // Export what the user currently sees (after all filters)
            exportOrdersToExcel(advancedFilteredOrdersMemo as any);
          } catch (e) {
            console.error("Export Excel failed", e);
          }
        }}
      />

      <AdminHeader
        title={t("orders") || "الطلبات"}
        count={advancedFilteredOrdersMemo.length}
        addLabel={t("addNewOrder") || "إضافة طلب جديد"}
        onAdd={() => setShowAddOrder(true)}
      />

      <OrderAddDialog
        open={showAddOrder}
        onOpenChange={(open) => {
          setShowAddOrder(open);
          if (!open) {
            setOrderForm(initialOrderForm);
            setAllowCustomClient(false);
          }
        }}
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

      {advancedFilteredOrdersMemo.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {statusFilter === "all" ? t("noOrders") : t("noOrdersForStatus") + " \" " + t(statusFilter) + " \""}
              </h3>
              <p className="text-gray-500">
                {statusFilter === "all" ? t("ordersWillAppearHere") : t("tryChangingFilterToShowOtherOrders")}
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
            renderItem={(order) => {
              const latestOrder = Array.isArray(orders)
                ? (orders as any[]).find((o) => o.id === order.id) || order
                : order;

              let items: any[] = [];
              if (typeof (latestOrder as any).items === "string") {
                try { items = JSON.parse((latestOrder as any).items); } catch { items = []; }
              } else if (Array.isArray((latestOrder as any).items)) {
                items = (latestOrder as any).items;
              }
              // في حال لم تكن items مخزنة (طلبات قادمة من الـ Checkout)، نبنيها من order_items
              if ((!items || items.length === 0) && Array.isArray((latestOrder as any).order_items)) {
                items = (latestOrder as any).order_items.map((item: any) => ({
                  id: item.id || `item_${item.product_id}_${Date.now()}`,
                  product_id: item.product_id,
                  quantity: item.quantity,
                  price: item.price,
                  product_name: item.product_name || item.products?.name_ar || item.products?.name_en || "",
                  // تمرير معلومات الفيرنت إن وجدت
                  variant_id: item.variant_id ?? null,
                  variant_attributes: item.variant_attributes ?? null,
                }));
              }

              let shipping_address: any = (latestOrder as any).shipping_address;
              if (typeof shipping_address === "string") {
                try { shipping_address = JSON.parse(shipping_address); } catch { shipping_address = {}; }
              } else if (typeof shipping_address !== "object" || shipping_address === null) {
                shipping_address = {};
              }

              const customerName =
                (latestOrder as any).customer_name ||
                shipping_address.fullName ||
                (latestOrder as any).profiles?.full_name ||
                "";

              return (
                <OrderCard
                  key={order.id}
                  order={order}
                  orders={orders as any}
                  t={t}
                  onShowDetails={() => {
                    setSelectedOrder(
                      mapOrderFromDb({ ...latestOrder, items, shipping_address } as Record<string, unknown>)
                    );
                  }}
                  onPrintOrder={(order) => orderPrint(order, t, language, profile?.full_name || "-", products)}
                  onDownloadPdf={(order) => downloadInvoicePdf(order, t, language, profile?.full_name || "-", products)}
                  onEdit={(order) => {
                    setEditOrderId(order.id);

        const itemsFromDb = Array.isArray((latestOrder as any).items)
                      ? (latestOrder as any).items
                      : (Array.isArray((latestOrder as any).order_items)
                        ? (latestOrder as any).order_items.map((item: any) => ({
                          id: item.id || `item_${item.product_id}_${Date.now()}`,
                          product_id: item.product_id,
                          quantity: item.quantity,
                          price: item.price,
                          product_name: item.product_name || "",
          // تمرير الفيرنت إلى نموذج التعديل
          variant_id: item.variant_id ?? null,
          variant_attributes: item.variant_attributes ?? null,
                        }))
                        : []);

                    const appliedOffers = (latestOrder as any).applied_offers
                      ? (typeof (latestOrder as any).applied_offers === "string"
                        ? JSON.parse((latestOrder as any).applied_offers)
                        : (latestOrder as any).applied_offers)
                      : [];

                    // Build canonical free refs to preview in edit dialog too
                    const freeRefs = getCanonicalFreeRefs(
                      (latestOrder as any).free_items,
                      appliedOffers
                    );

                    // Add visual free items if missing
                    const userType: any = (latestOrder as any)?.profiles?.user_type || "retail";
                    const allItems = injectFreeItemsIfMissing([...itemsFromDb], freeRefs, products, userType);

                    setEditOrderForm({
                      user_id: (latestOrder as any).user_id,
                      payment_method: (latestOrder as any).payment_method,
                      status: (latestOrder as any).status,
                      notes: (latestOrder as any).notes ? safeDecompressNotes((latestOrder as any).notes) : "",
                      items: allItems,
                      shipping_address: { ...shipping_address, fullName: customerName },
                      // pass-through original fields so handleEditOrder can read them if needed
                      ...(latestOrder as any).applied_offers ? { applied_offers: (latestOrder as any).applied_offers } : {},
                      ...(latestOrder as any).free_items ? { free_items: (latestOrder as any).free_items } : {},
                    } as any);

                    setOriginalOrderForEdit(
                      mapOrderFromDb({ ...latestOrder, items: allItems, shipping_address } as Record<string, unknown>)
                    );
                    setShowEditOrder(true);
                  }}
                  onDelete={(order) => {
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

      <OrderDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        t={t}
        isRTL={isRTL}
        handleDeleteOrder={handleDeleteOrder}
        setShowDeleteDialog={setShowDeleteDialog}
      />

      <OrderDetailsDialog
        open={!!selectedOrder}
        onOpenChange={() => setSelectedOrder(null)}
        order={selectedOrder}
        t={t}
        profile={profile}
        generateOrderPrint={generateOrderPrint}
        onDownloadPdf={(order) => downloadInvoicePdf(order, t, language, profile?.full_name || "-", products)}
      />

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
        getOrderEditChangesDetailed={(original, edited) =>
          getOrderEditChangesDetailedUtil(original, edited, t, language, products)
        }
        t={t}
        isRTL={isRTL}
        products={products}
      />

      {/* ==== التعديل المهم هنا: تمرير معلومات العروض والمجاني للدايلوج ==== */}
      <ConfirmEditOrderDialog
        open={showConfirmEditDialog}
        onConfirm={handleEditOrder}
        onCancel={() => setShowConfirmEditDialog(false)}
        changes={editOrderChanges}
        appliedOffers={
          (editOrderForm as any)?.applied_offers_obj ??
          normalizeJsonField((editOrderForm as any)?.applied_offers) ??
          []
        }
        prevAppliedOffers={
          normalizeJsonField((originalOrderForEdit as any)?.applied_offers) ?? []
        }
        freeItemsNow={
          (editOrderForm as any)?.free_items_obj ??
          normalizeFreeRefs((editOrderForm as any)?.free_items) ??
          []
        }
        freeItemsPrev={
          normalizeFreeRefs((originalOrderForEdit as any)?.free_items) ?? []
        }
        itemsBefore={(originalOrderForEdit as any)?.items || []}
        itemsAfter={(editOrderForm as any)?.items || []}
        products={products}
        discountFromOffers={Number((editOrderForm as any)?.offers_discount_total || 0)}
      />
    </div>
  );
};

export default AdminOrders;
