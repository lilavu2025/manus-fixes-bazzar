import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '../../utils/languageContextUtils';
import { useAuth } from '@/contexts/useAuth';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShoppingCart, Eye, Package, Clock, CheckCircle, XCircle, Plus, Trash2, UserPlus, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useProducts } from '@/hooks/useSupabaseData';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { Address, Product } from '@/types';
import { useOrdersRealtime } from '@/hooks/useOrdersRealtime';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import VirtualScrollList from '../VirtualScrollList';
import OptimizedSearch from '../OptimizedSearch';

// واجهة الطلب
interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
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
function mapAddressFromDb(dbAddress: Record<string, unknown>): Address {
  return {
    fullName: dbAddress['full_name'] as string,
    phone: dbAddress['phone'] as string,
    city: dbAddress['city'] as string,
    area: dbAddress['area'] as string,
    street: dbAddress['street'] as string,
    building: dbAddress['building'] as string,
    floor: dbAddress['floor'] as string,
    apartment: dbAddress['apartment'] as string,
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
  if (Array.isArray(order['order_items']) && order['order_items'].length > 0) {
    type OrderItemDB = {
      id: string;
      product_id: string;
      quantity: number;
      price: number;
      products?: { name_ar?: string; name_en?: string };
    };
    items = (order['order_items'] as OrderItemDB[]).map((item) => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      product_name: item.products?.name_ar || item.products?.name_en || '',
    }));
  } else if (typeof order['items'] === 'string') {
    items = JSON.parse(order['items'] as string);
  } else if (Array.isArray(order['items'])) {
    items = order['items'] as OrderItem[];
  }
  return {
    id: order['id'] as string,
    user_id: order['user_id'] as string,
    items,
    total: order['total'] as number,
    status: order['status'] as Order['status'],
    created_at: order['created_at'] as string,
    shipping_address: typeof order['shipping_address'] === 'string' ? mapAddressFromDb(JSON.parse(order['shipping_address'] as string)) : mapAddressFromDb(order['shipping_address'] as Record<string, unknown>),
    payment_method: order['payment_method'] as string,
    notes: order['notes'] as string,
    updated_at: order['updated_at'] as string,
    profiles: order['profiles'] as { full_name: string; email?: string; phone?: string },
    admin_created: order['admin_created'] === true || order['admin_created'] === 1, // دعم boolean أو رقم
    admin_creator_name: order['admin_creator_name'] as string | undefined, // دعم اسم المنشئ
  };
}

const initialOrderForm: NewOrderForm = {
  user_id: '',
  payment_method: 'cash',
  status: 'pending',
  notes: '',
  items: [],
  shipping_address: {
    fullName: '',
    phone: '',
    city: '',
    area: '',
    street: '',
    building: '',
    floor: '',
    apartment: '',
  },
};

const AdminOrders: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [orderForm, setOrderForm] = useState<NewOrderForm>(initialOrderForm);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  // 1. إضافة حالة allowCustomClient
  const [allowCustomClient, setAllowCustomClient] = useState(false);
  const virtualListRef = useRef<HTMLDivElement>(null);
  const { data: productsData } = useProducts();
  const products = productsData && Array.isArray(productsData.data) ? productsData.data : [];
  const { users, isLoading: usersLoading } = useAdminUsers();

  // Handle filter from dashboard navigation
  useEffect(() => {
    if (location.state?.filterStatus) {
      setStatusFilter(location.state.filterStatus);
    }
  }, [location.state]);
  
  // استعلام الطلبات مع تفعيل polling وتحديث البيانات عند العودة للنافذة
  const { orders, loading: ordersLoading, error: ordersError, refetch: refetchOrders } = useOrdersRealtime();
  
  // تحديث حالة الطلب
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (error) throw error;
      
      toast.success('تم تحديث حالة الطلب بنجاح');
      refetchOrders(); // تحديث الطلبات مباشرة بعد التغيير
    } catch (err: unknown) {
      console.error('خطأ في تحديث حالة الطلب:', err);
      toast.error('فشل في تحديث حالة الطلب');
    }
  };
  
  // إضافة عنصر جديد للطلب
  const addOrderItem = () => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      product_id: '',
      quantity: 1,
      price: 0,
      product_name: ''
    };
    setOrderForm(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };
  
  // حذف عنصر من الطلب
  const removeOrderItem = (itemId: string) => {
    setOrderForm(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };
  
  // تحديث عنصر في الطلب
  const updateOrderItem = (itemId: string, field: keyof OrderItem, value: string | number) => {
    setOrderForm(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'product_id') {
            const selectedProduct = products.find((p: Product) => p.id === value);
            if (selectedProduct) {
              updatedItem.product_name = selectedProduct.name;
              updatedItem.price = selectedProduct.price;
            }
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };
  
  // حساب المجموع الكلي
  const calculateTotal = () => {
    return orderForm.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  
  // إضافة طلب جديد
  const handleAddOrder = async () => {
    try {
      setIsAddingOrder(true);
      
      // التحقق من صحة البيانات
      if (!orderForm.user_id) {
        toast.error('يرجى اختيار العميل');
        return;
      }
      
      if (orderForm.items.length === 0) {
        toast.error('يرجى إضافة منتج واحد على الأقل');
        return;
      }
      
      if (!orderForm.shipping_address.fullName || !orderForm.shipping_address.phone) {
        toast.error('يرجى إدخال معلومات الشحن الأساسية');
        return;
      }
      
      const total = calculateTotal();
      
      // إنشاء الطلب
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: orderForm.user_id,
          items: JSON.stringify(orderForm.items),
          total,
          status: orderForm.status,
          payment_method: orderForm.payment_method,
          shipping_address: JSON.stringify(orderForm.shipping_address),
          notes: orderForm.notes || null,
          admin_created: true, // <--- هنا
          admin_creator_name: user?.user_metadata?.full_name || user?.email, // <--- حفظ اسم المنشئ
        })
        .select()
        .single();
      
      if (orderError) {
        console.error('خطأ في إنشاء الطلب:', orderError);
        throw orderError;
      }
      
      // إنشاء عناصر الطلب
      const orderItems = orderForm.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) {
        console.error('خطأ في إنشاء عناصر الطلب:', itemsError);
        throw itemsError;
      }
      
      toast.success('تم إضافة الطلب بنجاح');
      setShowAddOrder(false);
      setOrderForm(initialOrderForm);
      refetchOrders(); // إعادة جلب الطلبات
      
    } catch (error: unknown) {
      console.error('خطأ في إضافة الطلب:', error);
      toast.error('فشل في إضافة الطلب');
    } finally {
      setIsAddingOrder(false);
    }
  };
  
  // الحصول على لون الحالة
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // الحصول على أيقونة الحالة
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'processing': return <Package className="h-4 w-4" />;
      case 'shipped': return <Package className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };
  
  // Filter orders based on status - moved before early returns to maintain hook order
  const filteredOrders: Order[] = useMemo(() => {
    const mappedOrders = Array.isArray(orders)
      ? orders.map(order => mapOrderFromDb(order as Record<string, unknown>))
      : [];
    if (statusFilter === 'all') {
      return mappedOrders;
    }
    return mappedOrders.filter(order => order.status === statusFilter);
  }, [orders, statusFilter]);

  // فلترة متقدمة للطلبات
  const advancedFilteredOrders = useMemo(() => {
    let result = filteredOrders;
    if (dateFrom) {
      result = result.filter(o => new Date(o.created_at) >= new Date(dateFrom));
    }
    if (dateTo) {
      result = result.filter(o => new Date(o.created_at) <= new Date(dateTo));
    }
    if (paymentFilter !== 'all') {
      result = result.filter(o => o.payment_method === paymentFilter);
    }
    if (searchQuery) {
      result = result.filter(o =>
        (o.profiles?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.id.includes(searchQuery)
      );
    }
    return result;
  }, [filteredOrders, dateFrom, dateTo, paymentFilter, searchQuery]);

  // فلترة متقدمة للطلبات بدون فلتر الحالة (لأجل الإحصائيات)
  const advancedFilteredOrdersWithoutStatus = useMemo(() => {
    const mappedOrders = Array.isArray(orders)
      ? orders.map(order => mapOrderFromDb(order as Record<string, unknown>))
      : [];
    let result = mappedOrders;
    if (dateFrom) {
      result = result.filter(o => new Date(o.created_at) >= new Date(dateFrom));
    }
    if (dateTo) {
      result = result.filter(o => new Date(o.created_at) <= new Date(dateTo));
    }
    if (paymentFilter !== 'all') {
      result = result.filter(o => o.payment_method === paymentFilter);
    }
    if (searchQuery) {
      result = result.filter(o =>
        (o.profiles?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.id.includes(searchQuery)
      );
    }
    return result;
  }, [orders, dateFrom, dateTo, paymentFilter, searchQuery]);

  // إحصائيات سريعة (تعتمد على جميع الطلبات بعد الفلاتر بدون فلتر الحالة)
  const stats = useMemo(() => {
    const mappedOrders = advancedFilteredOrdersWithoutStatus;
    return {
      total: mappedOrders.length,
      pending: mappedOrders.filter(o => o.status === 'pending').length,
      processing: mappedOrders.filter(o => o.status === 'processing').length,
      shipped: mappedOrders.filter(o => o.status === 'shipped').length,
      delivered: mappedOrders.filter(o => o.status === 'delivered').length,
      cancelled: mappedOrders.filter(o => o.status === 'cancelled').length,
    };
  }, [advancedFilteredOrdersWithoutStatus]);

  const exportOrdersToCSV = () => {
    const BOM = '\uFEFF';
    const csv = [
      ['ID', 'Client', 'Status', 'Total', 'Date', 'Payment', 'Phone'],
      ...filteredOrders.map(o => [
        o.id,
        o.profiles?.full_name || '',
        o.status,
        o.total,
        o.created_at,
        o.payment_method,
        o.profiles?.phone || ''
      ])
    ].map(row => row.join(',')).join('\n');
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orders.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportOrdersToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(advancedFilteredOrders.map(o => ({
      ID: o.id,
      Client: o.profiles?.full_name || '',
      Status: o.status,
      Total: o.total,
      Date: o.created_at,
      Payment: o.payment_method,
      Phone: o.profiles?.phone || ''
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'orders.xlsx');
  };
  // حذف الطلب مع تأكيد
  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    const { error } = await supabase.from('orders').delete().eq('id', orderToDelete.id);
    if (!error) {
      toast.success('تم حذف الطلب بنجاح');
      setShowDeleteDialog(false);
      setOrderToDelete(null);
      refetchOrders();
    } else {
      toast.error('فشل في حذف الطلب');
    }
  };
  const generateWhatsappMessage = (order: Order) => {
    let msg = `🛒 تفاصيل الطلبية:\n`;
    msg += `رقم الطلب: ${order.id}\n`;
    if (order.profiles?.full_name) msg += `العميل: ${order.profiles.full_name}\n`;
    if (order.profiles?.phone) msg += `رقم الهاتف: ${order.profiles.phone}\n`;
    msg += `التاريخ: ${new Date(order.created_at).toLocaleDateString('en-GB')} - ${new Date(order.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}\n`;
    msg += `الحالة: ${order.status}\n`;
    msg += `طريقة الدفع: ${order.payment_method}\n`;
    if (order.shipping_address) {
      msg += `عنوان الشحن: ${order.shipping_address.fullName}, ${order.shipping_address.phone}, ${order.shipping_address.city}, ${order.shipping_address.area}, ${order.shipping_address.street}`;
      if (order.shipping_address.building) msg += `، مبنى: ${order.shipping_address.building}`;
      if (order.shipping_address.apartment) msg += `، شقة: ${order.shipping_address.apartment}`;
      msg += '\n';
    }
    if (order.notes) msg += `ملاحظات: ${order.notes}\n`;
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
  const handleSelectUser = React.useCallback((userId: string) => {
    setOrderForm(prev => {
      if (!userId) return { ...prev, user_id: '', shipping_address: { ...prev.shipping_address, fullName: '', phone: '' } };
      const user = users.find(u => u.id === userId);
      if (user) {
        return {
          ...prev,
          user_id: userId,
          shipping_address: {
            ...prev.shipping_address,
            fullName: user.full_name || '',
            phone: user.phone || '',
          },
        };
      }
      return { ...prev, user_id: userId };
    });
  }, [users]);

  if (ordersLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{t('manageOrders')}</h1>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }
  
  if (ordersError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{t('manageOrders')}</h1>
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <XCircle className="h-16 w-16 text-red-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-900 mb-2">خطأ في تحميل الطلبات</h3>
              <p className="text-red-600 mb-4">{ordersError.message}</p>
              <Button onClick={() => refetchOrders()}>إعادة المحاولة</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-2">
        <div
          className={`bg-gradient-to-r from-blue-100 to-blue-50 rounded-xl p-3 flex flex-col items-center shadow-sm cursor-pointer transition ring-2 ${statusFilter === 'all' ? 'ring-blue-400' : 'ring-transparent'} hover:ring-blue-300`}
          onClick={() => setStatusFilter('all')}
        >
          <span className="text-lg font-bold">{stats.total}</span>
          <span className="text-xs text-gray-600">{t('orders')}</span>
        </div>
        <div
          className={`bg-gradient-to-r from-yellow-100 to-yellow-50 rounded-xl p-3 flex flex-col items-center shadow-sm cursor-pointer transition ring-2 ${statusFilter === 'pending' ? 'ring-yellow-400' : 'ring-transparent'} hover:ring-yellow-300`}
          onClick={() => setStatusFilter('pending')}
        >
          <span className="text-lg font-bold">{stats.pending}</span>
          <span className="text-xs text-gray-600">قيد الانتظار</span>
        </div>
        <div
          className={`bg-gradient-to-r from-blue-100 to-blue-50 rounded-xl p-3 flex flex-col items-center shadow-sm cursor-pointer transition ring-2 ${statusFilter === 'processing' ? 'ring-blue-500' : 'ring-transparent'} hover:ring-blue-300`}
          onClick={() => setStatusFilter('processing')}
        >
          <span className="text-lg font-bold">{stats.processing}</span>
          <span className="text-xs text-gray-600">قيد التنفيذ</span>
        </div>
        <div
          className={`bg-gradient-to-r from-purple-100 to-purple-50 rounded-xl p-3 flex flex-col items-center shadow-sm cursor-pointer transition ring-2 ${statusFilter === 'shipped' ? 'ring-purple-400' : 'ring-transparent'} hover:ring-purple-300`}
          onClick={() => setStatusFilter('shipped')}
        >
          <span className="text-lg font-bold">{stats.shipped}</span>
          <span className="text-xs text-gray-600">تم الشحن</span>
        </div>
        <div
          className={`bg-gradient-to-r from-green-100 to-green-50 rounded-xl p-3 flex flex-col items-center shadow-sm cursor-pointer transition ring-2 ${statusFilter === 'delivered' ? 'ring-green-400' : 'ring-transparent'} hover:ring-green-300`}
          onClick={() => setStatusFilter('delivered')}
        >
          <span className="text-lg font-bold">{stats.delivered}</span>
          <span className="text-xs text-gray-600">تم التوصيل</span>
        </div>
        <div
          className={`bg-gradient-to-r from-red-100 to-red-50 rounded-xl p-3 flex flex-col items-center shadow-sm cursor-pointer transition ring-2 ${statusFilter === 'cancelled' ? 'ring-red-400' : 'ring-transparent'} hover:ring-red-300`}
          onClick={() => setStatusFilter('cancelled')}
        >
          <span className="text-lg font-bold">{stats.cancelled}</span>
          <span className="text-xs text-gray-600">ملغي</span>
        </div>
      </div>
      {/* شريط الفلاتر والبحث والتصدير */}
      <div className="flex flex-wrap gap-2 items-center bg-white rounded-xl p-3 shadow-sm border mt-2 relative">
        <OptimizedSearch onSearch={setSearchQuery} placeholder="بحث بالعميل أو رقم الطلب..." />
        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36" placeholder="من تاريخ" />
        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36" placeholder="إلى تاريخ" />
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="طريقة الدفع" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="cash">نقداً</SelectItem>
            <SelectItem value="card">بطاقة ائتمان</SelectItem>
            <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="الحالة" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="pending">قيد الانتظار</SelectItem>
            <SelectItem value="processing">قيد التنفيذ</SelectItem>
            <SelectItem value="shipped">تم الشحن</SelectItem>
            <SelectItem value="delivered">تم التوصيل</SelectItem>
            <SelectItem value="cancelled">ملغي</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => refetchOrders()} variant="outline">تحديث</Button>
        {/* أزرار التصدير */}
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" onClick={exportOrdersToExcel} className="flex items-center gap-1">
            <span role="img" aria-label="excel">📊</span> تصدير Excel
          </Button>
        </div>
        <Dialog open={showAddOrder} onOpenChange={setShowAddOrder}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white font-bold ml-2">
              <Plus className="h-4 w-4" />
              إضافة طلب جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-0 sm:p-0">
            <DialogHeader className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b px-6 py-4 rounded-t-2xl">
              <DialogTitle className="text-xl font-bold text-primary flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> إضافة طلب جديد
              </DialogTitle>
              <p className="text-gray-500 text-sm mt-1">يرجى تعبئة جميع الحقول المطلوبة بعناية. جميع الحقول بعلامة * مطلوبة.</p>
            </DialogHeader>
            <form className="space-y-8 px-6 py-6" autoComplete="off" onSubmit={e => { e.preventDefault(); handleAddOrder(); }}>
              {/* اختيار العميل */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="user_id">العميل <span className="text-red-500">*</span></Label>
                  <Select value={allowCustomClient ? '' : orderForm.user_id} onValueChange={value => {
  if (value === '__custom__') {
    setAllowCustomClient(true);
    setOrderForm(prev => ({ ...prev, user_id: '', shipping_address: { ...prev.shipping_address, fullName: '', phone: '' } }));
  } else {
    setAllowCustomClient(false);
    handleSelectUser(value);
  }
}}>
                    <SelectTrigger id="user_id" className="w-full">
                      <SelectValue placeholder="ابحث أو اختر العميل" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id} className="truncate">
                          {user.full_name} <span className="text-xs text-gray-400">({user.email})</span>
                        </SelectItem>
                      ))}
                      <SelectItem value="__custom__" className="text-blue-600 font-bold">+ عميل جديد (غير موجود)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="payment_method">طريقة الدفع <span className="text-red-500">*</span></Label>
                  <Select value={orderForm.payment_method} onValueChange={value => setOrderForm(prev => ({ ...prev, payment_method: value }))}>
                    <SelectTrigger id="payment_method" className="w-full">
                      <SelectValue placeholder="اختر طريقة الدفع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">نقداً</SelectItem>
                      <SelectItem value="card">بطاقة ائتمان</SelectItem>
                      <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* معلومات الشحن */}
              <div className="bg-gray-50 rounded-xl p-4 border mt-2">
                <h3 className="text-lg font-semibold mb-4 text-primary">معلومات الشحن</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="full_name">الاسم الكامل <span className="text-red-500">*</span></Label>
                    <Input id="full_name" value={orderForm.shipping_address.fullName} onChange={e => setOrderForm(prev => ({ ...prev, shipping_address: { ...prev.shipping_address, fullName: e.target.value } }))} placeholder="أدخل الاسم الكامل" required disabled={!allowCustomClient && !!orderForm.user_id} />
                  </div>
                  <div>
                    <Label htmlFor="phone">رقم الهاتف <span className="text-red-500">*</span></Label>
                    <Input id="phone" value={orderForm.shipping_address.phone} onChange={e => setOrderForm(prev => ({ ...prev, shipping_address: { ...prev.shipping_address, phone: e.target.value } }))} placeholder="أدخل رقم الهاتف" required disabled={!allowCustomClient && !!orderForm.user_id} />
                  </div>
                  <div>
                    <Label htmlFor="city">المدينة</Label>
                    <Input id="city" value={orderForm.shipping_address.city} onChange={e => setOrderForm(prev => ({ ...prev, shipping_address: { ...prev.shipping_address, city: e.target.value } }))} placeholder="أدخل المدينة" />
                  </div>
                  <div>
                    <Label htmlFor="area">المنطقة</Label>
                    <Input id="area" value={orderForm.shipping_address.area} onChange={e => setOrderForm(prev => ({ ...prev, shipping_address: { ...prev.shipping_address, area: e.target.value } }))} placeholder="أدخل المنطقة" />
                  </div>
                  <div>
                    <Label htmlFor="street">الشارع</Label>
                    <Input id="street" value={orderForm.shipping_address.street} onChange={e => setOrderForm(prev => ({ ...prev, shipping_address: { ...prev.shipping_address, street: e.target.value } }))} placeholder="أدخل الشارع" />
                  </div>
                  <div>
                    <Label htmlFor="building">رقم المبنى</Label>
                    <Input id="building" value={orderForm.shipping_address.building} onChange={e => setOrderForm(prev => ({ ...prev, shipping_address: { ...prev.shipping_address, building: e.target.value } }))} placeholder="أدخل رقم المبنى" />
                  </div>
                  <div>
                    <Label htmlFor="floor">الطابق</Label>
                    <Input id="floor" value={orderForm.shipping_address.floor} onChange={e => setOrderForm(prev => ({ ...prev, shipping_address: { ...prev.shipping_address, floor: e.target.value } }))} placeholder="أدخل الطابق (اختياري)" />
                  </div>
                  <div>
                    <Label htmlFor="apartment">رقم الشقة</Label>
                    <Input id="apartment" value={orderForm.shipping_address.apartment} onChange={e => setOrderForm(prev => ({ ...prev, shipping_address: { ...prev.shipping_address, apartment: e.target.value } }))} placeholder="أدخل رقم الشقة" />
                  </div>
                </div>
              </div>
              {/* المنتجات */}
              <div className="bg-gray-50 rounded-xl p-4 border mt-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-primary">المنتجات</h3>
                  <Button type="button" onClick={addOrderItem} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" /> إضافة منتج
                  </Button>
                </div>
                <div className="space-y-3">
                  {orderForm.items.map((item, index) => (
                    <div key={item.id} className="flex flex-col sm:flex-row gap-3 items-end p-3 border rounded-lg bg-white shadow-sm">
                      <div className="flex-1 min-w-[180px]">
                        <Label>المنتج <span className="text-red-500">*</span></Label>
                        <Select value={item.product_id} onValueChange={value => updateOrderItem(item.id, 'product_id', value)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="ابحث أو اختر المنتج" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map(product => (
                              <SelectItem key={product.id} value={product.id} className="truncate">
                                {product.name} <span className="text-xs text-gray-400">({product.price} ₪)</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-full sm:w-24">
                        <Label>الكمية <span className="text-red-500">*</span></Label>
                        <Input type="number" min="1" value={item.quantity} onChange={e => updateOrderItem(item.id, 'quantity', parseInt(e.target.value) || 1)} required />
                      </div>
                      <div className="w-full sm:w-24">
                        <Label>السعر <span className="text-red-500">*</span></Label>
                        <Input type="number" step="0.01" value={item.price} onChange={e => updateOrderItem(item.id, 'price', parseFloat(e.target.value) || 0)} required />
                      </div>
                      <Button type="button" onClick={() => removeOrderItem(item.id)} variant="destructive" size="sm" className="self-end">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                {orderForm.items.length > 0 && (
                  <div className="text-right mt-3">
                    <p className="text-lg font-semibold">
                      المجموع الكلي: {calculateTotal().toFixed(2)} ₪
                    </p>
                  </div>
                )}
              </div>
              {/* ملاحظات + تمييز منشئ الطلب */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Textarea id="notes" value={orderForm.notes} onChange={e => setOrderForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="أدخل ملاحظات إضافية (اختياري)" />
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  <Label>منشئ الطلبية</Label>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">أدمن</Badge>
                    <span className="text-xs text-gray-500">سيتم تمييز هذه الطلبية أنها أُنشئت من لوحة التحكم</span>
                  </div>
                </div>
              </div>
              {/* أزرار الحفظ */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
                <Button type="button" variant="outline" onClick={() => setShowAddOrder(false)} disabled={isAddingOrder}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-primary text-white font-bold" disabled={isAddingOrder}>
                  {isAddingOrder ? 'جاري الإضافة...' : 'إضافة الطلب'}
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
                {statusFilter === 'all' ? t('noOrders') : `لا توجد طلبات ${statusFilter === 'pending' ? 'في الانتظار' : statusFilter === 'processing' ? 'قيد المعالجة' : statusFilter === 'shipped' ? 'مشحونة' : statusFilter === 'delivered' ? 'مسلمة' : 'ملغية'}`}
              </h3>
              <p className="text-gray-500">{statusFilter === 'all' ? t('ordersWillAppearHere') : 'جرب تغيير الفلتر لعرض طلبات أخرى'}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="w-full">
          <VirtualScrollList
            items={advancedFilteredOrders}
            // إزالة itemHeight لجعل الكروت تعتمد على محتواها
            containerHeight={700}
            overscan={5}
            className="w-full"
            renderItem={(order: Order, idx: number) => (
              <div className="p-2 w-full min-h-[240px] sm:min-h-0">
                <Card className="relative h-full flex flex-col justify-between border shadow-md rounded-xl transition-all duration-200 bg-white">
                  <CardHeader className="bg-gray-50 border-b flex flex-col gap-2 p-4 rounded-t-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{t('orderNumber')}</span>
                        <span className="font-bold text-lg tracking-wider">#{order.id}</span>
                        {order.admin_created && (
  <div className="relative group">
    <Badge className="ml-2 bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1 animate-pulse cursor-pointer">
      <UserPlus className="h-4 w-4" />
      <span>أدمن</span>
    </Badge>
    <div className="absolute z-20 hidden group-hover:block bg-white border shadow-lg rounded-lg px-3 py-2 text-xs text-gray-700 top-8 right-0 whitespace-nowrap">
      {order.admin_creator_name ? `أنشأها: ${order.admin_creator_name}` : 'أنشئت من الأدمن'}
    </div>
  </div>
)}
                      </div>
                      <Badge className={`text-base px-3 py-1 rounded-full font-semibold ${getStatusColor(order.status)}`}>{t(order.status)}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center text-xs text-gray-500 mt-1">
                      <span>{new Date(order.created_at).toLocaleDateString('en-GB')}</span>
                      <span>|</span>
                      <span>{order.profiles?.full_name || 'غير محدد'}</span>
                      <span>|</span>
                      <span>{order.total} ₪</span>
                      <span>|</span>
                      <span>{order.payment_method}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3 p-4">
                    <div className="flex flex-col gap-2">
                      {order.notes && <div className="mb-1 text-xs text-gray-500">{t('orderNotes')}: {order.notes}</div>}
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        {order.items.map((item) => (
                          <span key={item.id} className="bg-gray-100 rounded px-2 py-1">
                            {item.product_name} × {item.quantity}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-row flex-wrap gap-2 w-full sm:w-auto">
                        <Button size="sm" variant="outline" className="flex-1 sm:flex-none" onClick={() => setSelectedOrder(order)}>
                          <Eye className="h-4 w-4 mr-1" /> تفاصيل
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 sm:flex-none" onClick={() => {
                          const msg = encodeURIComponent(generateWhatsappMessage(order));
                          window.open(`https://wa.me/?text=${msg}`, '_blank');
                        }}>
                          <Copy className="h-4 w-4 mr-1" /> واتساب
                        </Button>
                        <Button size="sm" variant="destructive" className="flex-1 sm:flex-none" onClick={() => { setOrderToDelete(order); setShowDeleteDialog(true); }}>
                          <Trash2 className="h-4 w-4 mr-1" /> حذف
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Button size="sm" variant="outline" className="flex-1 min-w-[110px]" onClick={() => updateOrderStatus(order.id, 'pending')} disabled={order.status === 'pending'}>في الانتظار</Button>
                      <Button size="sm" variant="outline" className="flex-1 min-w-[110px]" onClick={() => updateOrderStatus(order.id, 'processing')} disabled={order.status === 'processing'}>قيد المعالجة</Button>
                      <Button size="sm" variant="outline" className="flex-1 min-w-[110px]" onClick={() => updateOrderStatus(order.id, 'shipped')} disabled={order.status === 'shipped' || order.status === 'delivered'}>تم الشحن</Button>
                      <Button size="sm" variant="outline" className="flex-1 min-w-[110px]" onClick={() => updateOrderStatus(order.id, 'delivered')} disabled={order.status === 'delivered'}>تم التسليم</Button>
                      <Button size="sm" variant="destructive" className="flex-1 min-w-[110px]" onClick={() => updateOrderStatus(order.id, 'cancelled')} disabled={order.status === 'cancelled' || order.status === 'delivered'}>إلغاء</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          />
        </div>
      )}
      {/* Dialog تأكيد حذف الطلب */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600">تأكيد حذف الطلب</DialogTitle>
          </DialogHeader>
          <div className="mb-4">هل أنت متأكد أنك تريد حذف هذا الطلب؟ لا يمكن التراجع عن هذه العملية.</div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDeleteOrder}>تأكيد الحذف</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Dialog عرض تفاصيل الطلب */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">معلومات الطلب</h3>
                <p className="text-sm text-gray-600">رقم الطلب: {selectedOrder.id}</p>
                <p className="text-sm text-gray-600">التاريخ: {new Date(selectedOrder.created_at).toLocaleDateString('en-GB')} - {new Date(selectedOrder.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                <p className="text-sm text-gray-600">الحالة: {selectedOrder.status}</p>
                <p className="text-sm text-gray-600">المجموع: {selectedOrder.total} ₪</p>
                <p className="text-sm text-gray-600">طريقة الدفع: {selectedOrder.payment_method}</p>
                {selectedOrder.notes && <p className="text-sm text-gray-600">ملاحظات: {selectedOrder.notes}</p>}
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const msg = encodeURIComponent(generateWhatsappMessage(selectedOrder));
                      window.open(`https://wa.me/?text=${msg}`, '_blank');
                    }}
                  >
                    <Copy className="h-4 w-4 mr-1" /> مشاركة الطلبية عبر واتساب
                  </Button>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">المنتجات المطلوبة</h3>
                <ul className="list-disc pl-5">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, idx) => (
                      <li key={item.id} className="mb-1">
                        {item.product_name} - الكمية: {item.quantity} - السعر: {item.price} ₪
                      </li>
                    ))
                  ) : (
                    <li>لا توجد منتجات</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
