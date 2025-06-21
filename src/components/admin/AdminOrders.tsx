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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShoppingCart,
  Eye,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  UserPlus,
  Copy,
  MapPin,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { Address, Product } from "@/types";
import { useOrdersRealtime } from "@/hooks/useOrdersRealtime";
import { useProductsRealtime } from "@/hooks/useProductsRealtime";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import VirtualScrollList from "../VirtualScrollList";
import OptimizedSearch from "../OptimizedSearch";
import { compressText, decompressText } from "@/utils/textCompression";
import { getDisplayPrice } from "@/utils/priceUtils";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

// واجهة الطلب
interface Order {
  id: string;
  user_id: string;
  customer_name?: string | null; // دعم اسم العميل اليدوي
  items: OrderItem[];
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  payment_method: string;
  shipping_address: Address;
  notes?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    email?: string;
    phone?: string;
  };
  admin_created?: boolean; // <--- جديد
  admin_creator_name?: string; // <--- جديد
  cancelled_by?: string; // 'user' | 'admin'
  cancelled_by_name?: string;
}

// واجهة عنصر الطلب
interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  product_name: string;
}

// واجهة نموذج الطلب الجديد
interface NewOrderForm {
  user_id: string;
  payment_method: string;
  status: string;
  notes: string;
  items: OrderItem[];
  shipping_address: Address;
}

// Helper: Convert snake_case to camelCase for Address
function mapAddressFromDb(
  dbAddress: Record<string, unknown> | undefined | null,
): Address {
  if (!dbAddress) {
    return {
      fullName: "",
      phone: "",
      city: "",
      area: "",
      street: "",
      building: "",
      floor: "",
      apartment: "",
    };
  }
  return {
    fullName: (dbAddress["full_name"] as string) || "",
    phone: (dbAddress["phone"] as string) || "",
    city: (dbAddress["city"] as string) || "",
    area: (dbAddress["area"] as string) || "",
    street: (dbAddress["street"] as string) || "",
    building: (dbAddress["building"] as string) || "",
    floor: (dbAddress["floor"] as string) || "",
    apartment: (dbAddress["apartment"] as string) || "",
  };
}
function mapAddressToDb(address: Address) {
  return {
    full_name: address.fullName,
    phone: address.phone,
    city: address.city,
    area: address.area,
    street: address.street,
    building: address.building,
    floor: address.floor,
    apartment: address.apartment,
  };
}
// Helper: Map order from DB
function mapOrderFromDb(order: Record<string, unknown>): Order {
  // جلب عناصر الطلب من order_items إذا توفرت
  let items: OrderItem[] = [];
  if (Array.isArray(order["order_items"]) && order["order_items"].length > 0) {
    type OrderItemDB = {
      id: string;
      product_id: string;
      quantity: number;
      price: number;
      products?: { name_ar?: string; name_en?: string; name_he?: string };
    };
    items = (order["order_items"] as OrderItemDB[]).map((item) => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      product_name:
        item.products?.name_ar ||
        item.products?.name_en ||
        item.products?.name_he ||
        item.id,
    }));
  } else if (typeof order["items"] === "string") {
    items = JSON.parse(order["items"] as string);
  } else if (Array.isArray(order["items"])) {
    items = order["items"] as OrderItem[];
  }
  let total = order["total"] as number;
  if (typeof total !== "number" || isNaN(total)) {
    total = 0;
  }
  // Ensure profiles is always an object, not an array
  let profiles = order["profiles"];
  if (Array.isArray(profiles)) {
    profiles = profiles[0];
  }
  if (!profiles || typeof profiles !== "object") {
    profiles = { full_name: "", email: "", phone: "" };
  }
  return {
    id: order["id"] as string,
    user_id: order["user_id"] as string,
    customer_name: order["customer_name"] as string | null, // جلب اسم العميل اليدوي
    items,
    total,
    status: order["status"] as Order["status"],
    created_at: order["created_at"] as string,
    shipping_address:
      typeof order["shipping_address"] === "string"
        ? mapAddressFromDb(JSON.parse(order["shipping_address"] as string))
        : mapAddressFromDb(
            order["shipping_address"] as Record<string, unknown>,
          ),
    payment_method: order["payment_method"] as string,
    notes: order["notes"] as string,
    updated_at: order["updated_at"] as string,
    profiles: profiles as { full_name: string; email?: string; phone?: string },
    admin_created:
      order["admin_created"] === true || order["admin_created"] === 1, // دعم boolean أو رقم
    admin_creator_name: order["admin_creator_name"] as string | undefined, // دعم اسم المنشئ
    cancelled_by: order["cancelled_by"] as string | undefined,
    cancelled_by_name: order["cancelled_by_name"] as string | undefined,
  };
}

const initialOrderForm: NewOrderForm = {
  user_id: "",
  payment_method: "cash",
  status: "pending",
  notes: "",
  items: [],
  shipping_address: {
    fullName: "",
    phone: "",
    city: "",
    area: "",
    street: "",
    building: "",
    floor: "",
    apartment: "",
  },
};

const AdminOrders: React.FC = () => {
  const { t, isRTL, language } = useLanguage();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();

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
  // 1. إضافة حالة allowCustomClient
  const [allowCustomClient, setAllowCustomClient] = useState(false);
  const [showEditOrder, setShowEditOrder] = useState(false);
  const [editOrderForm, setEditOrderForm] = useState<NewOrderForm | null>(null);
  const [editOrderId, setEditOrderId] = useState<string | null>(null);
  const virtualListRef = useRef<HTMLDivElement>(null);
  const { users, isLoading: usersLoading } = useAdminUsers();
  const { products, loading: productsLoading } = useProductsRealtime();

  // Handle filter from dashboard navigation
  useEffect(() => {
    if (location.state?.filterStatus) {
      setStatusFilter(location.state.filterStatus);
    }
  }, [location.state]);

  // استعلام الطلبات مع تفعيل polling وتحديث البيانات عند العودة للنافذة
  const {
    orders,
    loading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
    setOrders,
  } = useOrdersRealtime();

  // ربط hook تحديث حالة الطلب
  const updateOrderStatusMutation = useUpdateOrderStatus();
  // ربط hook حذف الطلب
  const deleteOrderMutation = useDeleteOrder();
  // ربط hook إضافة الطلب
  const addOrderMutation = useAddOrder();
  // ربط hook تعديل الطلب
  const editOrderMutation = useEditOrder();

  // تعريف user بشكل آمن
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
          // استبدل setOrders((prevOrders) => ...) باستدعاء setOrders مع القيمة الجديدة مباشرة أو بتعليق الكود مؤقتًا
          // setOrders((prevOrders) => prevOrders.map(order => {
          //   if (order.id === orderId) {
          //     return {
          //       ...order,
          //       status: newStatus as Order['status'],
          //       updated_at: new Date().toISOString(),
          //       cancelled_by: newStatus === 'cancelled' ? 'admin' : order.cancelled_by,
          //       cancelled_by_name: newStatus === 'cancelled' ? (safeUserMeta?.full_name || safeUser?.email || 'أدمن') : order.cancelled_by_name,
          //     };
          //   }
          //   return order;
          // }));
        },
        onError: (err: unknown) => {
          console.error("خطأ في تحديث حالة الطلب:", err);
          toast.error("فشل في تحديث حالة الطلب");
        },
      },
    );
  };

  // إضافة عنصر جديد للطلب
  const addOrderItem = () => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      product_id: "",
      quantity: 1,
      price: 0,
      product_name: "",
    };
    setOrderForm((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  // حذف عنصر من الطلب
  const removeOrderItem = (itemId: string) => {
    setOrderForm((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }));
  };

  // تحديث عنصر في الطلب
  const updateOrderItem = (
    itemId: string,
    field: keyof OrderItem,
    value: string | number,
  ) => {
    setOrderForm((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          if (field === "product_id") {
            const selectedProduct = products.find(
              (p: Product) => p.id === value,
            );
            if (selectedProduct) {
              updatedItem.product_name =
                selectedProduct.name_ar ||
                selectedProduct.name_en ||
                selectedProduct.name_he ||
                selectedProduct.id;
              updatedItem.price = selectedProduct.price;
            }
          }
          return updatedItem;
        }
        return item;
      }),
    }));
  };

  // حساب المجموع الكلي
  const calculateTotal = () => {
    return orderForm.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  };

  // إضافة طلب جديد
  const handleAddOrder = async () => {
    try {
      setIsAddingOrder(true);
      if (!orderForm.user_id && !allowCustomClient) {
        toast.error("يرجى اختيار العميل أو تعبئة بيانات عميل جديد");
        return;
      }
      if (orderForm.items.length === 0) {
        toast.error("يرجى إضافة منتج واحد على الأقل");
        return;
      }
      if (
        !orderForm.shipping_address.fullName ||
        !orderForm.shipping_address.phone
      ) {
        toast.error("يرجى إدخال معلومات الشحن الأساسية");
        return;
      }
      const total = calculateTotal();
      const orderInsertObj = {
        items: JSON.stringify(orderForm.items),
        total,
        status: orderForm.status,
        payment_method: orderForm.payment_method,
        shipping_address: JSON.stringify(orderForm.shipping_address),
        notes: orderForm.notes ? compressText(orderForm.notes) : null,
        admin_created: true,
        admin_creator_name: safeUserMeta?.full_name || safeUser?.email,
        ...(orderForm.user_id
          ? { user_id: orderForm.user_id }
          : { customer_name: orderForm.shipping_address.fullName }),
      } as TablesInsert<"orders">;
      const orderItems = orderForm.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      }));
      addOrderMutation.mutate(
        {
          orderInsertObj,
          orderItems: orderItems as Omit<
            TablesInsert<"order_items">,
            "order_id"
          >[],
        },
        {
          onSuccess: () => {
            toast.success(t("orderAddedSuccess"));
            setShowAddOrder(false);
            setOrderForm(initialOrderForm);
            refetchOrders();
          },
          onError: (error: unknown) => {
            console.error("خطأ في إضافة الطلب:", error);
            toast.error("فشل في إضافة الطلب");
          },
          onSettled: () => {
            setIsAddingOrder(false);
          },
        },
      );
    } catch (error: unknown) {
      console.error("خطأ في إضافة الطلب:", error);
      toast.error("فشل في إضافة الطلب");
      setIsAddingOrder(false);
    }
  };

  // دالة تعديل الطلب (تستخدم في Dialog التعديل)
  const handleEditOrder = async () => {
    if (!editOrderForm || !editOrderId) return;
    setIsAddingOrder(true);
    try {
      const total = editOrderForm.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      );
      const updateObj: TablesUpdate<"orders"> = {
        items: JSON.stringify(editOrderForm.items),
        total,
        status: editOrderForm.status,
        payment_method: editOrderForm.payment_method,
        shipping_address: JSON.stringify(editOrderForm.shipping_address),
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
            toast.success(t("orderEditedSuccess"));
            setShowEditOrder(false);
            setEditOrderForm(null);
            setEditOrderId(null);
            refetchOrders();
          },
          onError: (error: unknown) => {
            toast.error("فشل في تعديل الطلب");
          },
          onSettled: () => {
            setIsAddingOrder(false);
          },
        },
      );
    } catch (error) {
      toast.error("فشل في تعديل الطلب");
      setIsAddingOrder(false);
    }
  };

  // الحصول على لون الحالة
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

  // الحصول على أيقونة الحالة
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "processing":
        return <Package className="h-4 w-4" />;
      case "shipped":
        return <Package className="h-4 w-4" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // الحصول على نص الحالة حسب اللغة
  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return t("pending") || "Pending";
      case "processing":
        return t("processing") || "Processing";
      case "shipped":
        return t("shipped") || "Shipped";
      case "delivered":
        return t("delivered") || "Delivered";
      case "cancelled":
        return t("cancelled") || "Cancelled";
      default:
        return status;
    }
  };
  // الحصول على نص طريقة الدفع حسب اللغة
  const getPaymentMethodText = (method: string | undefined | null) => {
    if (!method) return t("notProvided") || "غير محدد";
    switch (method) {
      case "cash":
        return t("cash") || "Cash";
      case "card":
        return t("card") || "Card";
      case "bank_transfer":
        return t("bankTransfer") || "Bank Transfer";
      default:
        return method;
    }
  };

  // Filter orders based on status - moved before early returns to maintain hook order
  const filteredOrders: Order[] = useMemo(() => {
    const mappedOrders = Array.isArray(orders)
      ? orders.map((order) =>
          mapOrderFromDb(order as unknown as Record<string, unknown>),
        )
      : [];
    if (statusFilter === "all") {
      return mappedOrders;
    }
    return mappedOrders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  // فلترة متقدمة للطلبات
  const advancedFilteredOrders = useMemo(() => {
    let result = filteredOrders;
    if (dateFrom) {
      result = result.filter(
        (o) => new Date(o.created_at) >= new Date(dateFrom),
      );
    }
    if (dateTo) {
      result = result.filter((o) => new Date(o.created_at) <= new Date(dateTo));
    }
    if (paymentFilter !== "all") {
      result = result.filter((o) => o.payment_method === paymentFilter);
    }
    if (searchQuery) {
      result = result.filter(
        (o) =>
          (o.profiles?.full_name || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) || o.id.includes(searchQuery),
      );
    }
    return result;
  }, [filteredOrders, dateFrom, dateTo, paymentFilter, searchQuery]);

  // فلترة متقدمة للطلبات بدون فلتر الحالة (لأجل الإحصائيات)
  const advancedFilteredOrdersWithoutStatus = useMemo(() => {
    const mappedOrders = Array.isArray(orders)
      ? orders.map((order) =>
          mapOrderFromDb(order as unknown as Record<string, unknown>),
        )
      : [];
    let result = mappedOrders;
    if (dateFrom) {
      result = result.filter(
        (o) => new Date(o.created_at) >= new Date(dateFrom),
      );
    }
    if (dateTo) {
      result = result.filter((o) => new Date(o.created_at) <= new Date(dateTo));
    }
    if (paymentFilter !== "all") {
      result = result.filter((o) => o.payment_method === paymentFilter);
    }
    if (searchQuery) {
      result = result.filter(
        (o) =>
          (o.profiles?.full_name || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) || o.id.includes(searchQuery),
      );
    }
    return result;
  }, [orders, dateFrom, dateTo, paymentFilter, searchQuery]);

  // إحصائيات سريعة (تعتمد على جميع الطلبات بعد الفلاتر بدون فلتر الحالة)
  const stats = useMemo(() => {
    const mappedOrders = advancedFilteredOrdersWithoutStatus;
    return {
      total: mappedOrders.length,
      pending: mappedOrders.filter((o) => o.status === "pending").length,
      processing: mappedOrders.filter((o) => o.status === "processing").length,
      shipped: mappedOrders.filter((o) => o.status === "shipped").length,
      delivered: mappedOrders.filter((o) => o.status === "delivered").length,
      cancelled: mappedOrders.filter((o) => o.status === "cancelled").length,
    };
  }, [advancedFilteredOrdersWithoutStatus]);

  const exportOrdersToCSV = () => {
    const BOM = "\uFEFF";
    const csv = [
      ["ID", "Client", "Status", "Total", "Date", "Payment", "Phone"],
      ...filteredOrders.map((o) => [
        o.id,
        o.profiles?.full_name || "",
        o.status,
        o.total,
        o.created_at,
        o.payment_method,
        o.profiles?.phone || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportOrdersToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      advancedFilteredOrders.map((o) => ({
        ID: o.id,
        Client: o.profiles?.full_name || "",
        Status: o.status,
        Total: o.total,
        Date: o.created_at,
        Payment: o.payment_method,
        Phone: o.profiles?.phone || "",
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }),
      "orders.xlsx",
    );
  };
  // حذف الطلب مع تأكيد
  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    deleteOrderMutation.mutate(orderToDelete.id, {
      onSuccess: () => {
        toast.success(t("orderDeletedSuccess"));
        setShowDeleteDialog(false);
        setOrderToDelete(null);
        refetchOrders();
      },
      onError: () => {
        toast.error("فشل في حذف الطلب");
      },
    });
  };
  const generateWhatsappMessage = (order: Order) => {
    let msg = `🛒 تفاصيل الطلبية:\n`;
    msg += `رقم الطلب: ${order.id}\n`;
    if (order.profiles?.full_name)
      msg += `العميل: ${order.profiles.full_name}\n`;
    if (order.profiles?.phone) msg += `رقم الهاتف: ${order.profiles.phone}\n`;
    msg += `التاريخ: ${new Date(order.created_at).toLocaleDateString("en-GB")} - ${new Date(order.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}\n`;
    msg += `الحالة: ${order.status}\n`;
    msg += `طريقة الدفع: ${order.payment_method}\n`;
    if (order.shipping_address) {
      msg += `عنوان الشحن: ${order.shipping_address.fullName}, ${order.shipping_address.phone}, ${order.shipping_address.city}, ${order.shipping_address.area}, ${order.shipping_address.street}`;
      if (order.shipping_address.building)
        msg += `، مبنى: ${order.shipping_address.building}`;
      if (order.shipping_address.apartment)
        msg += `، شقة: ${order.shipping_address.apartment}`;
      msg += "\n";
    }
    if (order.notes) msg += `ملاحظات: ${decompressText(order.notes)}\n`;
    msg += `\nالمنتجات:\n`;
    if (order.items && order.items.length > 0) {
      order.items.forEach((item, idx) => {
        msg += `- ${item.product_name} | الكمية: ${item.quantity} | السعر: ${item.price} ₪\n`;
      });
    } else {
      msg += `لا توجد منتجات\n`;
    }
    msg += `\nالمجموع: ${order.total} ₪`;
    return msg;
  };

  // 2. تعريف handleSelectUser باستخدام useCallback
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

  return (
    <div
      className={`space-y-6 ${isRTL ? "text-right" : "text-left"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-2">
        <div
          className={`bg-gradient-to-r from-blue-100 to-blue-50 rounded-xl p-3 flex flex-col items-center shadow-sm cursor-pointer transition ring-2 ${statusFilter === "all" ? "ring-blue-400" : "ring-transparent"} hover:ring-blue-300`}
          onClick={() => setStatusFilter("all")}
        >
          <span className="text-lg font-bold">{stats.total}</span>
          <span className="text-xs text-gray-600">{t("orders")}</span>
        </div>
        <div
          className={`bg-gradient-to-r from-yellow-100 to-yellow-50 rounded-xl p-3 flex flex-col items-center shadow-sm cursor-pointer transition ring-2 ${statusFilter === "pending" ? "ring-yellow-400" : "ring-transparent"} hover:ring-yellow-300`}
          onClick={() => setStatusFilter("pending")}
        >
          <span className="text-lg font-bold">{stats.pending}</span>
          <span className="text-xs text-gray-600">{t("pending")}</span>
        </div>
        <div
          className={`bg-gradient-to-r from-blue-100 to-blue-50 rounded-xl p-3 flex flex-col items-center shadow-sm cursor-pointer transition ring-2 ${statusFilter === "processing" ? "ring-blue-500" : "ring-transparent"} hover:ring-blue-300`}
          onClick={() => setStatusFilter("processing")}
        >
          <span className="text-lg font-bold">{stats.processing}</span>
          <span className="text-xs text-gray-600">{t("processing")}</span>
        </div>
        <div
          className={`bg-gradient-to-r from-purple-100 to-purple-50 rounded-xl p-3 flex flex-col items-center shadow-sm cursor-pointer transition ring-2 ${statusFilter === "shipped" ? "ring-purple-400" : "ring-transparent"} hover:ring-purple-300`}
          onClick={() => setStatusFilter("shipped")}
        >
          <span className="text-lg font-bold">{stats.shipped}</span>
          <span className="text-xs text-gray-600">{t("shipped")}</span>
        </div>
        <div
          className={`bg-gradient-to-r from-green-100 to-green-50 rounded-xl p-3 flex flex-col items-center shadow-sm cursor-pointer transition ring-2 ${statusFilter === "delivered" ? "ring-green-400" : "ring-transparent"} hover:ring-green-300`}
          onClick={() => setStatusFilter("delivered")}
        >
          <span className="text-lg font-bold">{stats.delivered}</span>
          <span className="text-xs text-gray-600">{t("delivered")}</span>
        </div>
        <div
          className={`bg-gradient-to-r from-red-100 to-red-50 rounded-xl p-3 flex flex-col items-center shadow-sm cursor-pointer transition ring-2 ${statusFilter === "cancelled" ? "ring-red-400" : "ring-transparent"} hover:ring-red-300`}
          onClick={() => setStatusFilter("cancelled")}
        >
          <span className="text-lg font-bold">{stats.cancelled}</span>
          <span className="text-xs text-gray-600">{t("cancelled")}</span>
        </div>
      </div>
      {/* شريط الفلاتر والبحث والتصدير */}
      <div className="flex flex-wrap gap-2 items-center bg-white rounded-xl p-3 shadow-sm border mt-2 relative">
        <OptimizedSearch
          onSearch={setSearchQuery}
          placeholder={
            t("searchByClientOrOrderNumber") || "بحث بالعميل أو رقم الطلب..."
          }
        />
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-36"
          placeholder={t("fromDate") || "من تاريخ"}
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-36"
          placeholder={t("toDate") || "إلى تاريخ"}
        />
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder={t("paymentMethod") || "طريقة الدفع"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all") || "الكل"}</SelectItem>
            <SelectItem value="cash">{t("cash") || "نقداً"}</SelectItem>
            <SelectItem value="card">{t("card") || "بطاقة ائتمان"}</SelectItem>
            <SelectItem value="bank_transfer">
              {t("bankTransfer") || "تحويل بنكي"}
            </SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder={t("status") || "الحالة"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all") || "الكل"}</SelectItem>
            <SelectItem value="pending">
              {t("pending") || "قيد الانتظار"}
            </SelectItem>
            <SelectItem value="processing">
              {t("processing") || "قيد التنفيذ"}
            </SelectItem>
            <SelectItem value="shipped">
              {t("shipped") || "تم الشحن"}
            </SelectItem>
            <SelectItem value="delivered">
              {t("delivered") || "تم التوصيل"}
            </SelectItem>
            <SelectItem value="cancelled">
              {t("cancelled") || "ملغي"}
            </SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="destructive"
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-700 font-bold shadow border border-red-200 hover:bg-red-100 transition-all duration-200"
          onClick={() => {
            setStatusFilter("all");
            setDateFrom("");
            setDateTo("");
            setPaymentFilter("all");
            setSearchQuery("");
          }}
        >
          <XCircle className="h-4 w-4" />
          <span className="inline-block align-middle">
            {t("resetFilters") || "مسح الفلاتر"}
          </span>
        </Button>
        {/* أزرار التصدير */}
        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            onClick={exportOrdersToExcel}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-bold shadow border border-blue-700 hover:bg-blue-700 transition-all duration-200"
          >
            <BarChart3 className="h-4 w-4" />
            {t("exportExcel") || "تصدير Excel"}
          </Button>
        </div>
        <Dialog open={showAddOrder} onOpenChange={setShowAddOrder}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white font-bold ml-2">
              <Plus className="h-4 w-4" />
              {t("addNewOrder") || "إضافة طلب جديد"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-0 sm:p-0">
            <DialogHeader className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b px-6 py-4 rounded-t-2xl">
              <DialogTitle className="text-xl font-bold text-primary flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />{" "}
                {t("addNewOrder") || "إضافة طلب جديد"}
              </DialogTitle>
              <p className="text-gray-500 text-sm mt-1">
                {t("fillAllRequiredFields") ||
                  "يرجى تعبئة جميع الحقول المطلوبة بعناية. جميع الحقول بعلامة * مطلوبة."}
              </p>
            </DialogHeader>
            <form
              className="space-y-8 px-6 py-6"
              autoComplete="off"
              onSubmit={(e) => {
                e.preventDefault();
                handleAddOrder();
              }}
            >
              {/* اختيار العميل */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="user_id">
                    {t("customer") || "العميل"}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={allowCustomClient ? "" : orderForm.user_id}
                    onValueChange={(value) => {
                      if (value === "__custom__") {
                        setAllowCustomClient(true);
                        setOrderForm((prev) => ({
                          ...prev,
                          user_id: "",
                          shipping_address: {
                            ...prev.shipping_address,
                            fullName: "",
                            phone: "",
                          },
                        }));
                      } else {
                        setAllowCustomClient(false);
                        handleSelectUser(value);
                      }
                    }}
                  >
                    <SelectTrigger id="user_id" className="w-full">
                      <SelectValue
                        placeholder={
                          t("searchOrSelectCustomer") || "ابحث أو اختر العميل"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem
                          key={user.id}
                          value={user.id}
                          className="truncate"
                        >
                          {user.full_name}{" "}
                          <span className="text-xs text-gray-400">
                            ({user.email})
                          </span>
                        </SelectItem>
                      ))}
                      <SelectItem
                        value="__custom__"
                        className="text-blue-600 font-bold"
                      >
                        {t("newCustomer") || "عميل جديد"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="payment_method">
                    {t("paymentMethod") || "طريقة الدفع"}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={orderForm.payment_method}
                    onValueChange={(value) =>
                      setOrderForm((prev) => ({
                        ...prev,
                        payment_method: value,
                      }))
                    }
                  >
                    <SelectTrigger id="payment_method" className="w-full">
                      <SelectValue
                        placeholder={
                          t("selectPaymentMethod") || "اختر طريقة الدفع"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">
                        {t("cash") || "نقداً"}
                      </SelectItem>
                      <SelectItem value="card">
                        {t("card") || "بطاقة ائتمان"}
                      </SelectItem>
                      <SelectItem value="bank_transfer">
                        {t("bankTransfer") || "تحويل بنكي"}
                      </SelectItem>
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
                    <Label htmlFor="full_name">
                      {t("fullName") || "الاسم الكامل"}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="full_name"
                      value={orderForm.shipping_address.fullName}
                      onChange={(e) =>
                        setOrderForm((prev) => ({
                          ...prev,
                          shipping_address: {
                            ...prev.shipping_address,
                            fullName: e.target.value,
                          },
                        }))
                      }
                      placeholder={t("enterFullName") || "أدخل الاسم الكامل"}
                      required
                      disabled={!allowCustomClient && !!orderForm.user_id}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">
                      {t("phone") || "رقم الهاتف"}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      value={orderForm.shipping_address.phone}
                      onChange={(e) =>
                        setOrderForm((prev) => ({
                          ...prev,
                          shipping_address: {
                            ...prev.shipping_address,
                            phone: e.target.value,
                          },
                        }))
                      }
                      placeholder={t("enterPhoneNumber") || "أدخل رقم الهاتف"}
                      required
                      disabled={!allowCustomClient && !!orderForm.user_id}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">{t("city") || "المدينة"}</Label>
                    <Input
                      id="city"
                      value={orderForm.shipping_address.city}
                      onChange={(e) =>
                        setOrderForm((prev) => ({
                          ...prev,
                          shipping_address: {
                            ...prev.shipping_address,
                            city: e.target.value,
                          },
                        }))
                      }
                      placeholder={t("enterCity") || "أدخل المدينة"}
                    />
                  </div>
                  <div>
                    <Label htmlFor="area">{t("area") || "المنطقة"}</Label>
                    <Input
                      id="area"
                      value={orderForm.shipping_address.area}
                      onChange={(e) =>
                        setOrderForm((prev) => ({
                          ...prev,
                          shipping_address: {
                            ...prev.shipping_address,
                            area: e.target.value,
                          },
                        }))
                      }
                      placeholder={t("enterArea") || "أدخل المنطقة"}
                    />
                  </div>
                  <div>
                    <Label htmlFor="street">{t("street") || "الشارع"}</Label>
                    <Input
                      id="street"
                      value={orderForm.shipping_address.street}
                      onChange={(e) =>
                        setOrderForm((prev) => ({
                          ...prev,
                          shipping_address: {
                            ...prev.shipping_address,
                            street: e.target.value,
                          },
                        }))
                      }
                      placeholder={t("enterStreet") || "أدخل الشارع"}
                    />
                  </div>
                  <div>
                    <Label htmlFor="building">
                      {t("building") || "رقم المبنى"}
                    </Label>
                    <Input
                      id="building"
                      value={orderForm.shipping_address.building}
                      onChange={(e) =>
                        setOrderForm((prev) => ({
                          ...prev,
                          shipping_address: {
                            ...prev.shipping_address,
                            building: e.target.value,
                          },
                        }))
                      }
                      placeholder={
                        t("enterBuildingNumber") || "أدخل رقم المبنى"
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="floor">{t("floor") || "الطابق"}</Label>
                    <Input
                      id="floor"
                      value={orderForm.shipping_address.floor}
                      onChange={(e) =>
                        setOrderForm((prev) => ({
                          ...prev,
                          shipping_address: {
                            ...prev.shipping_address,
                            floor: e.target.value,
                          },
                        }))
                      }
                      placeholder={
                        t("enterFloorOptional") || "أدخل الطابق (اختياري)"
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="apartment">
                      {t("apartment") || "رقم الشقة"}
                    </Label>
                    <Input
                      id="apartment"
                      value={orderForm.shipping_address.apartment}
                      onChange={(e) =>
                        setOrderForm((prev) => ({
                          ...prev,
                          shipping_address: {
                            ...prev.shipping_address,
                            apartment: e.target.value,
                          },
                        }))
                      }
                      placeholder={
                        t("enterApartmentNumber") || "أدخل رقم الشقة"
                      }
                    />
                  </div>
                </div>
              </div>
              {/* المنتجات */}
              <div className="bg-gray-50 rounded-xl p-4 border mt-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-primary">
                    {t("products") || "المنتجات"}
                  </h3>
                  <Button
                    type="button"
                    onClick={addOrderItem}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />{" "}
                    {t("addProduct") || "إضافة منتج"}
                  </Button>
                </div>
                <div className="space-y-3">
                  {orderForm.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row gap-3 items-end p-3 border rounded-lg bg-white shadow-sm"
                    >
                      <div className="flex-1 min-w-[180px]">
                        <Label>
                          {t("product") || "المنتج"}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={item.product_id}
                          onValueChange={(value) =>
                            updateOrderItem(item.id, "product_id", value)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={
                                t("searchOrSelectProduct") ||
                                "ابحث أو اختر المنتج"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name_ar ||
                                  product.name_en ||
                                  product.name_he ||
                                  product.id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-full sm:w-24">
                        <Label>
                          {t("quantity") || "الكمية"}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateOrderItem(
                              item.id,
                              "quantity",
                              parseInt(e.target.value) || 1,
                            )
                          }
                          required
                        />
                      </div>
                      <div className="w-full sm:w-24">
                        <Label>
                          {t("price") || "السعر"}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={(e) =>
                            updateOrderItem(
                              item.id,
                              "price",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          required
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={() => removeOrderItem(item.id)}
                        variant="destructive"
                        size="sm"
                        className="self-end"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                {orderForm.items.length > 0 && (
                  <div className="text-right mt-3">
                    <p className="text-lg font-semibold">
                      {t("total") || "المجموع الكلي"}:{" "}
                      {calculateTotal().toFixed(2)} ₪
                    </p>
                  </div>
                )}
              </div>
              {/* ملاحظات + تمييز منشئ الطلب */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="notes">{t("notes") || "ملاحظات"}</Label>
                  <Textarea
                    id="notes"
                    value={orderForm.notes}
                    onChange={(e) =>
                      setOrderForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder={
                      t("orderNotesPlaceholder") ||
                      "أدخل ملاحظات إضافية (اختياري)"
                    }
                  />
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  <Label>{t("orderCreator") || "منشئ الطلبية"}</Label>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      {t("admin") || "أدمن"}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {t("orderCreatedFromAdminPanel") ||
                        "سيتم تمييز هذه الطلبية أنها أُنشئت من لوحة التحكم"}
                    </span>
                  </div>
                </div>
              </div>
              {/* أزرار الحفظ */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddOrder(false)}
                  disabled={isAddingOrder}
                >
                  {t("cancel") || "إلغاء"}
                </Button>
                <Button
                  type="submit"
                  className="bg-primary text-white font-bold"
                  disabled={isAddingOrder}
                >
                  {isAddingOrder
                    ? t("adding") || "جاري الإضافة..."
                    : t("addOrder") || "إضافة الطلب"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Virtual Scroll للطلبات */}
      {advancedFilteredOrders.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {statusFilter === "all"
                  ? t("noOrders")
                  : t("noOrdersForStatus") + " " + t(statusFilter)}
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
            items={
              Array.isArray(advancedFilteredOrders)
                ? advancedFilteredOrders.filter(
                    (o) => o && typeof o.total === "number" && !isNaN(o.total),
                  )
                : []
            }
            containerHeight={700}
            overscan={5}
            className="w-full"
            renderItem={(order: Order, idx: number) => {
              if (
                !order ||
                typeof order.total !== "number" ||
                isNaN(order.total)
              )
                return null;
              // فك العناصر إذا كانت نصية
              let items: OrderItem[] = [];
              if (typeof order.items === "string") {
                try {
                  items = JSON.parse(order.items);
                } catch {
                  items = [];
                }
              } else if (Array.isArray(order.items)) {
                items = order.items as OrderItem[];
              }
              return (
                <div
                  className="p-2 w-full min-h-[240px] sm:min-h-0"
                  key={order.id + "-" + (order.updated_at || "")}
                >
                  <Card className="relative h-full flex flex-col justify-between border shadow-md rounded-xl transition-all duration-200 bg-white">
                    <CardHeader className="bg-gray-50 border-b flex flex-col gap-2 p-4 rounded-t-xl">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-lg text-Black">
                          {order.customer_name?.trim()
                            ? order.customer_name
                            : order.profiles?.full_name || t("notProvided")}
                        </span>
                        <div className="flex items-center gap-1">
                          {/* <span className="text-xs text-gray-400">{t('orderNumber')}</span>
                          <span className="text-lg tracking-wider">#{order.id}</span> */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full max-w-full">
                            {order.admin_created && (
                              <div className="relative group w-fit max-w-full">
                                <Badge className="ml-0 bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1 animate-pulse cursor-pointer text-[11px] px-2 py-0.5 w-fit max-w-[90vw] sm:max-w-xs whitespace-normal break-words overflow-hidden block">
                                  <UserPlus className="h-4 w-4 min-w-[16px] min-h-[16px]" />
                                  <span className="block">
                                    {t("admin") || "أدمن"}
                                  </span>
                                </Badge>
                                <div className="absolute z-20 hidden group-hover:block bg-white border shadow-lg rounded-lg px-3 py-2 text-xs text-gray-700 top-8 right-0 whitespace-nowrap">
                                  {order.admin_creator_name
                                    ? `${t("createdBy")}: ${order.admin_creator_name}`
                                    : t("createdByAdmin")}
                                </div>
                              </div>
                            )}
                            {order.status === "cancelled" &&
                              order.cancelled_by && (
                                <Badge
                                  className="ml-0 mt-1 bg-red-100 text-red-800 border-red-200 animate-pulse cursor-pointer text-[11px] px-2 py-0.5 w-fit max-w-[90vw] sm:max-w-xs whitespace-normal break-words overflow-hidden block"
                                  style={{ lineHeight: "1.2", fontWeight: 600 }}
                                >
                                  <span className="inline-flex items-center gap-1">
                                    <XCircle className="h-4 w-4 min-w-[16px] min-h-[16px]" />
                                    <span className="block">
                                      {order.cancelled_by === "admin"
                                        ? t("cancelledByAdmin")
                                        : t("cancelledByUser")}
                                      {order.cancelled_by_name
                                        ? ` (${order.cancelled_by_name})`
                                        : ""}
                                    </span>
                                  </span>
                                </Badge>
                              )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center text-xs text-gray-500 mt-1">
                          <span>
                            {new Date(order.created_at).toLocaleDateString(
                              "en-GB",
                            )}
                          </span>
                          <span>|</span>
                          <span className="block text-center text-lg font-bold text-green-700">
                            {typeof order.total === "number" &&
                            !isNaN(order.total)
                              ? order.total + " ₪"
                              : "-"}
                          </span>
                          <span>|</span>
                          <span>
                            {getPaymentMethodText(order.payment_method)}
                          </span>
                          <span>|</span>
                          <Badge
                            className={`text-base px-3 py-1 rounded-full font-semibold ${getStatusColor(order.status)}`}
                          >
                            {t(order.status)}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 p-4">
                      <div className="flex flex-col gap-2">
                        {order.notes && (
                          <div className="mb-1 text-xs text-gray-500">
                            {t("orderNotes")}: {decompressText(order.notes)}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                          {/* {order.items.map((item) => (
                            <span key={item.id} className="bg-gray-100 rounded px-2 py-1">
                              {item.product_name} × {item.quantity}
                            </span>
                          ))} */}
                        </div>
                      </div>
                      {/* أزرار التفاصيل والمشاركة */}
                      <div className="flex flex-wrap gap-2 justify-center items-center mt-4 mb-2 w-full">
                        <Button
                          size="sm"
                          variant="default"
                          className="font-bold flex items-center gap-1 px-3 py-2 min-w-[90px] flex-1 sm:flex-none"
                          onClick={() => {
                            // جلب الطلب الأحدث من orders (بعد أي تعديل)
                            const latestOrder = Array.isArray(orders)
                              ? orders.find((o) => o.id === order.id) || order
                              : order;
                            // معالجة items إذا كانت نصية
                            let items: OrderItem[] = [];
                            if (typeof latestOrder.items === "string") {
                              try {
                                items = JSON.parse(latestOrder.items);
                              } catch {
                                items = [];
                              }
                            } else if (Array.isArray(latestOrder.items)) {
                              items = latestOrder.items as OrderItem[];
                            }
                            // معالجة العنوان إذا كان نص أو unknown
                            let shipping_address: Address = {} as Address;
                            if (
                              latestOrder.shipping_address &&
                              typeof latestOrder.shipping_address === "object"
                            ) {
                              shipping_address =
                                latestOrder.shipping_address as Address;
                            } else if (
                              typeof latestOrder.shipping_address === "string"
                            ) {
                              try {
                                shipping_address = JSON.parse(
                                  latestOrder.shipping_address,
                                );
                              } catch {
                                shipping_address = {} as Address;
                              }
                            }
                            setSelectedOrder(
                              mapOrderFromDb({
                                ...latestOrder,
                                items,
                                shipping_address,
                              }),
                            );
                          }}
                        >
                          <Eye className="h-4 w-4" /> {t("details") || "تفاصيل"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="font-bold flex items-center gap-1 px-3 py-2 border-green-500 text-green-700 hover:bg-green-50 min-w-[90px] flex-1 sm:flex-none"
                          style={{ borderWidth: 2 }}
                          onClick={() => {
                            const msg = encodeURIComponent(
                              generateWhatsappMessage(order),
                            );
                            window.open(`https://wa.me/?text=${msg}`, "_blank");
                          }}
                        >
                          <Copy className="h-4 w-4" />{" "}
                          {t("shareOnWhatsapp") || "مشاركة عبر واتساب"}
                        </Button>
                        {/* زر التعديل */}
                        <Button
                          size="sm"
                          variant="secondary"
                          className="font-bold flex items-center gap-1 px-3 py-2 border-blue-500 text-blue-700 hover:bg-blue-50 min-w-[90px] flex-1 sm:flex-none"
                          style={{ borderWidth: 2 }}
                          onClick={() => {
                            // جلب الطلب الأحدث من orders
                            const latestOrder =
                              orders.find((o) => o.id === order.id) || order;
                            // معالجة items إذا كانت نصية
                            let items: OrderItem[] = [];
                            if (typeof latestOrder.items === "string") {
                              try {
                                items = JSON.parse(latestOrder.items);
                              } catch {
                                items = [];
                              }
                            } else if (Array.isArray(latestOrder.items)) {
                              items = latestOrder.items as OrderItem[];
                            }
                            // معالجة العنوان إذا كان نص
                            let shipping_address: Address =
                              latestOrder.shipping_address as Address;
                            if (typeof shipping_address === "string") {
                              try {
                                shipping_address = JSON.parse(shipping_address);
                              } catch {
                                shipping_address = {} as Address;
                              }
                            }
                            setEditOrderId(latestOrder.id);
                            setEditOrderForm({
                              user_id: latestOrder.user_id,
                              payment_method: latestOrder.payment_method,
                              status: latestOrder.status,
                              notes: latestOrder.notes
                                ? decompressText(latestOrder.notes)
                                : "",
                              items,
                              shipping_address: {
                                ...shipping_address,
                                fullName: latestOrder.customer_name || "",
                              },
                            });
                            setShowEditOrder(true);
                          }}
                        >
                          {t("edit") || "تعديل"}
                        </Button>
                        {/* زر الحذف */}
                        <Button
                          size="sm"
                          variant="destructive"
                          className="font-bold flex items-center gap-1 px-3 py-2 border-red-500 text-red-700 hover:bg-red-50 min-w-[90px] flex-1 sm:flex-none"
                          style={{ borderWidth: 2 }}
                          onClick={() => {
                            setOrderToDelete(order);
                            setShowDeleteDialog(true);
                          }}
                        >
                          {t("delete") || "حذف"}
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Button
                          size="sm"
                          variant={
                            order.status === "pending" ? "default" : "outline"
                          }
                          className={`flex-1 min-w-[110px] ${order.status === "pending" ? "bg-yellow-500 text-white font-bold border-yellow-600" : ""}`}
                          onClick={() => updateOrderStatus(order.id, "pending")}
                          disabled={order.status === "pending"}
                        >
                          {t("pending") || "في الانتظار"}
                        </Button>
                        <Button
                          size="sm"
                          variant={
                            order.status === "processing"
                              ? "default"
                              : "outline"
                          }
                          className={`flex-1 min-w-[110px] ${order.status === "processing" ? "bg-blue-600 text-white font-bold border-blue-700" : ""}`}
                          onClick={() =>
                            updateOrderStatus(order.id, "processing")
                          }
                          disabled={order.status === "processing"}
                        >
                          {t("processing") || "قيد المعالجة"}
                        </Button>
                        <Button
                          size="sm"
                          variant={
                            order.status === "shipped" ? "default" : "outline"
                          }
                          className={`flex-1 min-w-[110px] ${order.status === "shipped" ? "bg-purple-600 text-white font-bold border-purple-700" : ""}`}
                          onClick={() => updateOrderStatus(order.id, "shipped")}
                          disabled={
                            order.status === "shipped" ||
                            order.status === "delivered"
                          }
                        >
                          {t("shipped") || "تم الشحن"}
                        </Button>
                        <Button
                          size="sm"
                          variant={
                            order.status === "delivered" ? "default" : "outline"
                          }
                          className={`flex-1 min-w-[110px] ${order.status === "delivered" ? "bg-green-600 text-white font-bold border-green-700" : ""}`}
                          onClick={() =>
                            updateOrderStatus(order.id, "delivered")
                          }
                          disabled={order.status === "delivered"}
                        >
                          {t("delivered") || "تم التسليم"}
                        </Button>
                        <Button
                          size="sm"
                          variant={
                            order.status === "cancelled"
                              ? "destructive"
                              : "outline"
                          }
                          className={`flex-1 min-w-[110px] ${order.status === "cancelled" ? "bg-red-600 text-white font-bold border-red-700" : ""}`}
                          onClick={() =>
                            updateOrderStatus(order.id, "cancelled")
                          }
                          disabled={
                            order.status === "cancelled" ||
                            order.status === "delivered"
                          }
                        >
                          {t("cancel") || "إلغاء"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            }}
          />
        </div>
      )}
      {/* Dialog تأكيد حذف الطلب */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600">
              {t("confirmDeleteOrder") || "تأكيد حذف الطلب"}
            </DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            {t("areYouSureDeleteOrder") ||
              "هل أنت متأكد أنك تريد حذف هذا الطلب؟ لا يمكن التراجع عن هذه العملية."}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              {t("cancel") || "إلغاء"}
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrder}>
              {t("confirmDelete") || "تأكيد الحذف"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Dialog عرض تفاصيل الطلب */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={() => setSelectedOrder(null)}
      >
        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-0 sm:p-0">
          <DialogHeader className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b px-6 py-4 rounded-t-2xl print:bg-white print:border-none print:backdrop-blur-0 print:shadow-none">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Package className="h-5 w-5 text-primary print:hidden" />{" "}
              {t("orderDetails") || "تفاصيل الطلبية"} #
              {selectedOrder?.id.slice(0, 8)}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <>
              {/* منطقة تفاصيل الطلب للطباعة */}
              <div
                className="space-y-6 px-6 py-6 print:p-0 print:space-y-4 print:bg-white print:text-black print:rounded-none print:shadow-none print:w-full print:max-w-full print:mx-0 print:my-0"
                id="print-order-details"
              >
                {/* رأس الورقة للطباعة */}
                <div className="print:flex print:flex-col print:items-center print:mb-6 hidden">
                  <img
                    src="/favicon.ico"
                    alt="logo"
                    className="h-14 w-14 mb-2"
                  />
                  <div className="text-2xl font-bold text-primary print:text-black">
                    متجر موبايل بازار
                  </div>
                  <div className="text-sm text-gray-600 print:text-gray-700">
                    www.mobilebazaar.ps
                  </div>
                  <div className="w-full border-b border-gray-300 my-2" />
                </div>
                {/* بيانات الطلب والعميل */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-4 print:gap-0 print:border print:rounded print:p-4 print:mb-4 print:border-gray-300">
                  <div className="space-y-2 print:space-y-1">
                    <h4 className="font-semibold text-primary flex items-center gap-1 print:justify-center print:text-lg">
                      <UserPlus className="h-4 w-4 print:hidden" />{" "}
                      {t("customerInfo") || "بيانات العميل"}
                    </h4>
                    <div className="text-base font-bold text-gray-900 print:text-black">
                      {selectedOrder.customer_name?.trim()
                        ? selectedOrder.customer_name
                        : selectedOrder.profiles?.full_name || t("notProvided")}
                    </div>
                    {selectedOrder.profiles?.email && (
                      <div className="text-xs text-gray-700 print:text-black">
                        {selectedOrder.profiles.email}
                      </div>
                    )}
                    <div className="text-xs text-gray-700 print:text-black">
                      {selectedOrder.profiles?.phone ||
                        selectedOrder.shipping_address?.phone ||
                        t("notProvided")}
                    </div>
                  </div>
                  <div className="space-y-2 print:space-y-1">
                    <h4 className="font-semibold text-primary flex items-center gap-1 print:justify-center print:text-lg">
                      <MapPin className="h-4 w-4 print:hidden" />{" "}
                      {t("shippingAddress") || "عنوان الشحن"}
                    </h4>
                    <div className="text-xs text-gray-900 print:text-black">
                      {selectedOrder.shipping_address?.fullName || "-"}
                      <br />
                      {selectedOrder.shipping_address?.phone && (
                        <>
                          {selectedOrder.shipping_address.phone}
                          <br />
                        </>
                      )}
                      {selectedOrder.shipping_address?.city},{" "}
                      {selectedOrder.shipping_address?.area},{" "}
                      {selectedOrder.shipping_address?.street}
                      <br />
                      {selectedOrder.shipping_address?.building && (
                        <>مبنى: {selectedOrder.shipping_address.building}, </>
                      )}
                      {selectedOrder.shipping_address?.floor && (
                        <>طابق: {selectedOrder.shipping_address.floor}, </>
                      )}
                      {selectedOrder.shipping_address?.apartment && (
                        <>شقة: {selectedOrder.shipping_address.apartment}</>
                      )}
                    </div>
                  </div>
                </div>
                {/* معلومات الطلب */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-4 print:gap-0 print:border print:rounded print:p-4 print:mb-4 print:border-gray-300">
                  <div className="space-y-1">
                    <div className="text-xs text-gray-700 print:text-black">
                      {t("orderNumber") || "رقم الطلب"}:{" "}
                      <span className="font-bold">{selectedOrder.id}</span>
                    </div>
                    <div className="text-xs text-gray-700 print:text-black">
                      {t("orderDate") || "تاريخ الطلب"}:{" "}
                      <span className="font-bold">
                        {new Date(selectedOrder.created_at).toLocaleDateString(
                          "en-GB",
                        )}{" "}
                        -{" "}
                        {new Date(selectedOrder.created_at).toLocaleTimeString(
                          "en-GB",
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      </span>
                    </div>
                    <div className="text-xs text-gray-700 print:text-black">
                      {t("updateDate") || "تاريخ التعديل"}:{" "}
                      <span className="font-bold">
                        {selectedOrder.updated_at
                          ? new Date(
                              selectedOrder.updated_at,
                            ).toLocaleDateString("en-GB") +
                            " - " +
                            new Date(
                              selectedOrder.updated_at,
                            ).toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-700 print:text-black">
                      {t("status") || "الحالة"}:{" "}
                      <span className="font-bold">
                        {t(selectedOrder.status)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-700 print:text-black">
                      {t("paymentMethod") || "طريقة الدفع"}:{" "}
                      <span className="font-bold">
                        {t(selectedOrder.payment_method)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end md:items-center print:hidden">
                    <div className="text-lg font-bold text-green-700">
                      {selectedOrder.total} ₪
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="font-bold flex items-center gap-1 px-4 py-2 border-green-500 text-green-700 hover:bg-green-50"
                        style={{ borderWidth: 2 }}
                        onClick={() => {
                          const msg = encodeURIComponent(
                            generateWhatsappMessage(selectedOrder),
                          );
                          window.open(`https://wa.me/?text=${msg}`, "_blank");
                        }}
                      >
                        <Copy className="h-4 w-4" />{" "}
                        {t("shareOnWhatsapp") || "مشاركة عبر واتساب"}
                      </Button>
                    </div>
                  </div>
                </div>
                {/* المنتجات */}
                <div className="space-y-2 border-b pb-4 print:border print:rounded print:p-4 print:mb-4 print:border-gray-300">
                  <h4 className="font-semibold text-primary flex items-center gap-1 print:justify-center print:text-lg">
                    <Package className="h-4 w-4 print:hidden" />{" "}
                    {t("orderedProducts") || "المنتجات المطلوبة"}
                  </h4>
                  <div className="overflow-x-auto print:overflow-visible">
                    <table className="min-w-full text-xs md:text-sm border rounded-lg print:border print:rounded-none print:text-base print:w-full">
                      <thead>
                        <tr className="bg-gray-100 print:bg-gray-200">
                          <th className="p-2 font-bold">#</th>
                          <th className="p-2 font-bold">
                            {t("product") || "المنتج"}
                          </th>
                          <th className="p-2 font-bold">
                            {t("quantity") || "الكمية"}
                          </th>
                          <th className="p-2 font-bold">
                            {t("price") || "السعر"}
                          </th>
                          <th className="p-2 font-bold">
                            {t("total") || "المجموع"}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items &&
                        selectedOrder.items.length > 0 ? (
                          selectedOrder.items.map((item, idx) => (
                            <tr
                              key={item.id}
                              className="border-b hover:bg-gray-50 print:hover:bg-transparent"
                            >
                              <td className="p-2 text-center">{idx + 1}</td>
                              <td className="p-2">{item.product_name}</td>
                              <td className="p-2 text-center">
                                {item.quantity}
                              </td>
                              <td className="p-2 text-center">
                                {getDisplayPrice(
                                  [].find(
                                    (p) => p.id === item.product_id,
                                  ) as Product,
                                  profile?.user_type,
                                ) || item.price}{" "}
                                ₪
                              </td>
                              <td className="p-2 text-center font-semibold">
                                {(item.price * item.quantity).toFixed(2)} ₪
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={5}
                              className="text-center text-gray-400 py-4"
                            >
                              {t("noProducts") || "لا توجد منتجات"}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* ملاحظات الطلب */}
                {selectedOrder.notes && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded print:bg-white print:border print:border-yellow-400 print:rounded print:p-2 print:mt-2 print:mb-0">
                    <span className="font-semibold text-yellow-800 print:text-black">
                      {t("notes") || "ملاحظات"}:
                    </span>{" "}
                    <span className="text-gray-700 print:text-black">
                      {decompressText(selectedOrder.notes)}
                    </span>
                  </div>
                )}
                {/* تذييل رسمي للطباعة */}
                <div className="print:flex flex-col items-center mt-8 hidden">
                  <div className="w-full border-t border-gray-300 my-2" />
                  <div className="text-xs text-gray-500 print:text-gray-700">
                    {t("generatedByAdminPanel") ||
                      "تم توليد هذه الإرسالية إلكترونيًا من خلال لوحة تحكم متجر موبايل بازار"}{" "}
                    - {new Date().toLocaleDateString("en-GB")}
                  </div>
                  <div className="text-xs text-gray-500 print:text-gray-700">
                    {t("forInquiries") || "للاستفسار"}: 0599999999 -
                    info@mobilebazaar.ps
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      {/* Dialog تعديل الطلب */}
      <Dialog
        open={showEditOrder}
        onOpenChange={(opened) => {
          setShowEditOrder(opened);
          if (!opened) {
            setEditOrderForm(null);
            setEditOrderId(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-0 sm:p-0">
          <DialogHeader className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b px-6 py-4 rounded-t-2xl">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {t("editOrder") || "تعديل الطلبية"}
            </DialogTitle>
            <p className="text-gray-500 text-sm mt-1">
              {t("orderNotes") ||
                "يمكنك تعديل جميع بيانات الطلب عدا اسم العميل."}
            </p>
          </DialogHeader>
          {editOrderForm && (
            <form
              className="space-y-8 px-6 py-6"
              autoComplete="off"
              onSubmit={(e) => {
                e.preventDefault();
                handleEditOrder();
              }}
            >
              {/* اسم العميل (غير قابل للتغيير) */}
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
                    {t("paymentMethod") || "طريقة الدفع"}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={editOrderForm.payment_method}
                    onValueChange={(value) =>
                      setEditOrderForm((f) =>
                        f ? { ...f, payment_method: value } : f,
                      )
                    }
                  >
                    <SelectTrigger id="payment_method" className="w-full">
                      <SelectValue
                        placeholder={
                          t("selectPaymentMethod") || "اختر طريقة الدفع"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">
                        {t("cash") || "نقداً"}
                      </SelectItem>
                      <SelectItem value="card">
                        {t("card") || "بطاقة ائتمان"}
                      </SelectItem>
                      <SelectItem value="bank_transfer">
                        {t("bankTransfer") || "تحويل بنكي"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">
                    {t("status") || "الحالة"}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={editOrderForm.status}
                    onValueChange={(value) =>
                      setEditOrderForm((f) => (f ? { ...f, status: value } : f))
                    }
                  >
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue
                        placeholder={t("selectStatus") || "اختر الحالة"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        {t("pending") || "قيد الانتظار"}
                      </SelectItem>
                      <SelectItem value="processing">
                        {t("processing") || "قيد التنفيذ"}
                      </SelectItem>
                      <SelectItem value="shipped">
                        {t("shipped") || "تم الشحن"}
                      </SelectItem>
                      <SelectItem value="delivered">
                        {t("delivered") || "تم التوصيل"}
                      </SelectItem>
                      <SelectItem value="cancelled">
                        {t("cancelled") || "ملغي"}
                      </SelectItem>
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
                      {t("phone") || "رقم الهاتف"}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      value={editOrderForm.shipping_address.phone}
                      onChange={(e) =>
                        setEditOrderForm((f) =>
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
                      onChange={(e) =>
                        setEditOrderForm((f) =>
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
                      onChange={(e) =>
                        setEditOrderForm((f) =>
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
                      onChange={(e) =>
                        setEditOrderForm((f) =>
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
                    <Label htmlFor="building">
                      {t("building") || "رقم المبنى"}
                    </Label>
                    <Input
                      id="building"
                      value={editOrderForm.shipping_address.building}
                      onChange={(e) =>
                        setEditOrderForm((f) =>
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
                      onChange={(e) =>
                        setEditOrderForm((f) =>
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
                    <Label htmlFor="apartment">
                      {t("apartment") || "رقم الشقة"}
                    </Label>
                    <Input
                      id="apartment"
                      value={editOrderForm.shipping_address.apartment}
                      onChange={(e) =>
                        setEditOrderForm((f) =>
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
              {/* المنتجات */}
              <div className="bg-gray-50 rounded-xl p-4 border mt-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-primary">
                    {t("products") || "المنتجات"}
                  </h3>
                  <Button
                    type="button"
                    onClick={() =>
                      setEditOrderForm((f) =>
                        f
                          ? {
                              ...f,
                              items: [
                                ...f.items,
                                {
                                  id: Date.now().toString(),
                                  product_id: "",
                                  quantity: 1,
                                  price: 0,
                                  product_name: "",
                                },
                              ],
                            }
                          : f,
                      )
                    }
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />{" "}
                    {t("addProduct") || "إضافة منتج"}
                  </Button>
                </div>
                <div className="space-y-3">
                  {editOrderForm.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row gap-3 items-end p-3 border rounded-lg bg-white shadow-sm"
                    >
                      <div className="flex-1 min-w-[180px]">
                        <Label>
                          {t("product") || "المنتج"}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={item.product_id}
                          onValueChange={(value) => {
                            setEditOrderForm((f) => {
                              if (!f) return f;
                              // جلب بيانات المنتج المختار
                              const selectedProduct = products.find(
                                (p) => p.id === value,
                              );
                              return {
                                ...f,
                                items: f.items.map((it, i) =>
                                  i === index
                                    ? {
                                        ...it,
                                        product_id: value,
                                        // إذا تم اختيار منتج جديد، حدث السعر تلقائياً
                                        price: selectedProduct
                                          ? selectedProduct.price
                                          : 0,
                                        product_name:
                                          selectedProduct.name_ar ||
                                          selectedProduct.name_en ||
                                          selectedProduct.name_he ||
                                          selectedProduct.id,
                                      }
                                    : it,
                                ),
                              };
                            });
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue
                              className={`${isRTL ? "text-right" : "text-left"}`}
                              placeholder={
                                t("searchOrSelectProduct") ||
                                "ابحث أو اختر المنتج"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name_ar ||
                                  product.name_en ||
                                  product.name_he ||
                                  product.id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-full sm:w-24">
                        <Label>
                          {t("quantity") || "الكمية"}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            setEditOrderForm((f) =>
                              f
                                ? {
                                    ...f,
                                    items: f.items.map((it, i) =>
                                      i === index
                                        ? {
                                            ...it,
                                            quantity:
                                              parseInt(e.target.value) || 1,
                                          }
                                        : it,
                                    ),
                                  }
                                : f,
                            )
                          }
                          required
                        />
                      </div>
                      <div className="w-full sm:w-24">
                        <Label>
                          {t("price") || "السعر"}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={(e) =>
                            setEditOrderForm((f) =>
                              f
                                ? {
                                    ...f,
                                    items: f.items.map((it, i) =>
                                      i === index
                                        ? {
                                            ...it,
                                            price:
                                              parseFloat(e.target.value) || 0,
                                          }
                                        : it,
                                    ),
                                  }
                                : f,
                            )
                          }
                          required
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={() =>
                          setEditOrderForm((f) =>
                            f
                              ? {
                                  ...f,
                                  items: f.items.filter((_, i) => i !== index),
                                }
                              : f,
                          )
                        }
                        variant="destructive"
                        size="sm"
                        className="self-end"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* ملاحظات */}
              <div>
                <Label htmlFor="notes">{t("notes") || "ملاحظات"}</Label>
                <Textarea
                  id="notes"
                  value={editOrderForm.notes}
                  onChange={(e) =>
                    setEditOrderForm((f) =>
                      f ? { ...f, notes: e.target.value } : f,
                    )
                  }
                  placeholder={
                    t("orderNotesPlaceholder") ||
                    "أدخل ملاحظات إضافية (اختياري)"
                  }
                />
              </div>
              {/* أزرار الحفظ */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditOrder(false)}
                >
                  {t("cancel") || "إلغاء"}
                </Button>
                <Button
                  type="submit"
                  className="bg-primary text-white font-bold"
                >
                  {t("saveChanges") || "حفظ التعديلات"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
