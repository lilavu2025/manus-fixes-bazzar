import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/utils/languageContextUtils';
import { useAuth } from '@/contexts/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Package, CreditCard, XCircle, MapPin, Truck, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, Json } from '@/integrations/supabase/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getDisplayPrice } from '@/utils/priceUtils';

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
  products?: ProductDB;
};

type OrderDB = Omit<Tables<'orders'>, 'items' | 'shipping_address'> & {
  items: Json | null;
  shipping_address: Json;
  order_items?: OrderItemDB[];
};

const Orders: React.FC = () => {
  const { t, isRTL, language } = useLanguage();
  const { user, profile } = useAuth();

  const [orders, setOrders] = useState<OrderDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      setLoading(true);
      // جلب الطلبات مع تفاصيل المنتجات (كل الحقول)
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        setError(error.message);
        setOrders([]);
      } else {
        setError(null);
        setOrders(data || []);
      }
      setLoading(false);
    };
    fetchOrders();
  }, [user]);

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

  // منطق إلغاء الطلب
  const handleCancelOrder = async (orderId: string) => {
    setCancellingId(orderId);
    const updateObj: Record<string, unknown> = {
      status: 'cancelled',
      cancelled_by: 'user',
      cancelled_by_name: user?.user_metadata?.full_name || user?.email || t('user'),
    };
    const { error: updateError } = await supabase
      .from('orders')
      .update(updateObj)
      .eq('id', orderId);
    if (!updateError) {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'cancelled', cancelled_by: 'user', cancelled_by_name: user?.user_metadata?.full_name || user?.email || t('user') } : o));
    }
    setCancellingId(null);
  };

  // التحقق من إمكانية الإلغاء
  const canCancel = (order: OrderDB) => {
    if (order.status !== 'pending') return false;
    const created = new Date(order.created_at);
    const now = new Date();
    const diffHrs = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return diffHrs <= 24;
  };

  const filteredOrders = orders.filter(order => {
    // فلترة حسب الحالة
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    // بحث بالرقم أو اسم منتج
    if (search) {
      const orderIdMatch = order.id.toString().includes(search.trim());
      const productMatch = order.order_items?.some(item =>
        (item.products?.name_ar || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.products?.name_en || '').toLowerCase().includes(search.toLowerCase())
      );
      if (!orderIdMatch && !productMatch) return false;
    }
    return true;
  });

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* <Header onSearchChange={() => {}} onCartClick={() => {}} onMenuClick={() => {}} /> */}
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <div className={`mb-8 ${isRTL ? 'text-right' : 'text-left'}`}>  
          <h1 className="text-3xl font-bold mb-1 text-center">{t('orders')}</h1>
          <p className="text-gray-600 mt-2 text-center">{t('trackYourOrders') || t('viewYourOrders')}</p>
        </div>
        {/* شريط الفلترة والبحث */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('orderStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allStatuses')}</SelectItem>
              <SelectItem value="pending">{t('pending')}</SelectItem>
              <SelectItem value="processing">{t('processing')}</SelectItem>
              <SelectItem value="shipped">{t('shipped')}</SelectItem>
              <SelectItem value="delivered">{t('delivered')}</SelectItem>
              <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
            </SelectContent>
          </Select>
          <Input
            className="w-full md:w-64"
            placeholder={t('search') + '...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="space-y-6">
          {loading ? (
            <Card className="text-center py-12">
              <CardContent>
                <Loader2 className="h-12 w-12 text-gray-300 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('loadingData') || 'جاري تحميل الطلبات...'}
                </h3>
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="text-center py-12">
              <CardContent>
                <h3 className="text-lg font-medium text-red-600 mb-2">
                  {t('errorLoadingData') || 'خطأ في تحميل الطلبات'}
                </h3>
                <p className="text-gray-500">{error}</p>
              </CardContent>
            </Card>
          ) : filteredOrders.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('noOrders')}
                </h3>
                <p className="text-gray-500">{t('noOrdersDescription')}</p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => {
              // شريط الحالة
              const statusSteps = [
                { key: 'pending', label: t('pending'), icon: <Loader2 className="h-5 w-5" /> },
                { key: 'processing', label: t('processing'), icon: <Truck className="h-5 w-5" /> },
                { key: 'shipped', label: t('shipped'), icon: <Truck className="h-5 w-5" /> },
                { key: 'delivered', label: t('delivered'), icon: <CheckCircle className="h-5 w-5" /> },
                { key: 'cancelled', label: t('cancelled'), icon: <XCircle className="h-5 w-5" /> },
              ];
              const currentStep = statusSteps.findIndex(s => s.key === order.status);
              return (
                <Card key={order.id} className="overflow-hidden border shadow-md">
                  <CardHeader className="bg-gray-50 border-b flex flex-col gap-2">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{t('orderNumber')}</span>
                        <span className="font-bold text-lg tracking-wider">#{order.id.slice(0, 8)}</span>
                        {/* شارة إلغاء الطلب */}
                        {order.status === 'cancelled' && order.cancelled_by === 'admin' && (
                          <Badge
                            className="ml-0 mt-1 bg-red-100 text-red-800 border-red-200 animate-pulse cursor-pointer text-[11px] px-2 py-0.5 w-fit max-w-[90vw] sm:max-w-xs whitespace-normal break-words overflow-hidden block"
                            style={{ lineHeight: '1.2', fontWeight: 600 }}
                          >
                            <span className="inline-flex items-center gap-1">
                              <XCircle className="h-4 w-4 min-w-[16px] min-h-[16px]" />
                              <span className="block">
                                <span className="block">{t('orderCancelledByAdmin') || 'ألغي الطلب بواسطة الأدمن'}</span>
                              </span>
                            </span>
                          </Badge>
                        )}
                      </div>
                      <Badge className={`text-base px-3 py-1 rounded-full font-semibold ${getStatusColor(order.status)}`}>{t(order.status)}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center text-xs text-gray-500 mt-1">
                      <CalendarDays className="h-4 w-4" />
                      <span>{new Date(order.created_at).toLocaleDateString('en-GB')}</span>
                      <CreditCard className="h-4 w-4 ml-2" />
                      <span>{t('paymentMethod')}: {order.payment_method === 'cash' ? t('cashOnDelivery') : t('creditCard')}</span>
                    </div>
                    {/* شريط الحالة */}
                    <div className="flex items-center gap-1 mt-2 w-full flex-nowrap" style={{flexWrap:'nowrap'}}>
                      {statusSteps.map((step, idx) => {
                        // منطق التلوين:
                        let colorClass = '';
                        if (order.status === 'cancelled') {
                          colorClass = step.key === 'cancelled' ? 'text-red-600 font-bold' : 'text-gray-300';
                        } else {
                          colorClass = idx <= currentStep ? 'text-primary font-bold' : 'text-gray-300';
                        }
                        return (
                          <React.Fragment key={step.key}>
                            <div className={`flex flex-col items-center flex-1 basis-0 min-w-0 ${colorClass}`} style={{maxWidth:'100%'}}>
                              <span style={{fontSize: 15, lineHeight: 1, display:'block'}}>{step.icon}</span>
                              <span className="text-[10px] md:text-xs mt-0.5 w-full text-center leading-tight break-keep whitespace-nowrap" style={{fontSize:'clamp(9px,2vw,13px)',lineHeight:1.1,display:'block'}}>{step.label}</span>
                            </div>
                            {idx < statusSteps.length - 1 && (
                              <div className={`h-1 rounded-full flex-shrink-0`} style={{width: 16, background: (order.status === 'cancelled' ? (step.key === 'cancelled' ? '#ef4444' : '#e5e7eb') : (idx < currentStep ? '#2563eb' : '#e5e7eb'))}}></div>
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
                          type AddressType = {
                            fullName?: string; full_name?: string; phone?: string; city?: string; area?: string; street?: string; building?: string; floor?: string; apartment?: string;
                            [key: string]: unknown;
                          };
                          let addr: AddressType | null = null;
                          try {
                            if (typeof order.shipping_address === 'string') {
                              addr = JSON.parse(order.shipping_address) as AddressType;
                            } else if (typeof order.shipping_address === 'object' && order.shipping_address !== null) {
                              addr = order.shipping_address as AddressType;
                            }
                          } catch {
                            addr = null;
                          }
                          if (!addr) return '-';
                          const fullName = addr.fullName || addr.full_name || '';
                          const phone = addr.phone || '';
                          const city = addr.city || '';
                          const area = addr.area || '';
                          const street = addr.street || '';
                          const building = addr.building || '';
                          const floor = addr.floor || '';
                          const apartment = addr.apartment || '';
                          return [
                            fullName && <span key="fn" className="truncate max-w-xs inline-block">{fullName}</span>,
                            phone && <span key="ph" className="truncate max-w-xs inline-block">({phone})</span>,
                            [city, area, street, building].filter(Boolean).join(t('addressSeparator') || '، '),
                            (floor || apartment) ? `${t('floor')}: ${floor || '-'}${t('addressSeparator') || '، '}${t('apartment')}: ${apartment || '-'}` : null
                          ].filter(Boolean).map((part, i) => <span key={i} className="truncate max-w-xs inline-block">{part}{i < 2 ? ' - ' : ''}</span>);
                        })()}
                      </span>
                    </div>
                    {/* المنتجات */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm border rounded-lg">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="p-2 text-right font-semibold">{t('productName')}</th>
                            <th className="p-2 text-center font-semibold">{t('quantity')}</th>
                            <th className="p-2 text-center font-semibold">{t('price')}</th>
                            <th className="p-2 text-center font-semibold">{t('total')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.order_items && order.order_items.length > 0 ? (
                            order.order_items.map((item) => (
                              <tr key={item.id} className="border-b hover:bg-gray-50">
                                <td className="p-2 flex items-center gap-2">
                                  <img src={item.products?.image} alt={item.products?.name_ar || item.products?.name_en || ''} className="w-10 h-10 object-cover rounded" />
                                  <span className="truncate">{language === 'ar' ? item.products?.name_ar : item.products?.name_en}</span>
                                </td>
                                <td className="p-2 text-center">{item.quantity}</td>
                                <td className="p-2 text-center">{getDisplayPrice({
                                  id: item.products?.id || '',
                                  name: item.products?.name_ar || '',
                                  nameEn: item.products?.name_en || '',
                                  nameHe: item.products?.name_he || '',
                                  description: item.products?.description_ar || '',
                                  descriptionEn: item.products?.description_en || '',
                                  descriptionHe: item.products?.description_he || '',
                                  price: item.price,
                                  originalPrice: item.products?.original_price,
                                  wholesalePrice: item.products?.wholesale_price,
                                  image: item.products?.image || '',
                                  images: item.products?.images || [],
                                  category: '', // fallback
                                  inStock: typeof item.products?.in_stock === 'boolean' ? item.products.in_stock : true,
                                  rating: item.products?.rating || 0,
                                  reviews: 0, // fallback
                                  discount: item.products?.discount,
                                  featured: item.products?.featured,
                                  tags: item.products?.tags || [],
                                  stock_quantity: item.products?.stock_quantity,
                                  active: item.products?.active,
                                  created_at: item.products?.created_at,
                                }, profile?.user_type)} {t('currency')}</td>
                                <td className="p-2 text-center font-semibold">{(getDisplayPrice({
                                  id: item.products?.id || '',
                                  name: item.products?.name_ar || '',
                                  nameEn: item.products?.name_en || '',
                                  nameHe: item.products?.name_he || '',
                                  description: item.products?.description_ar || '',
                                  descriptionEn: item.products?.description_en || '',
                                  descriptionHe: item.products?.description_he || '',
                                  price: item.price,
                                  originalPrice: item.products?.original_price,
                                  wholesalePrice: item.products?.wholesale_price,
                                  image: item.products?.image || '',
                                  images: item.products?.images || [],
                                  category: '', // fallback
                                  inStock: typeof item.products?.in_stock === 'boolean' ? item.products.in_stock : true,
                                  rating: item.products?.rating || 0,
                                  reviews: 0, // fallback
                                  discount: item.products?.discount,
                                  featured: item.products?.featured,
                                  tags: item.products?.tags || [],
                                  stock_quantity: item.products?.stock_quantity,
                                  active: item.products?.active,
                                  created_at: item.products?.created_at,
                                }, profile?.user_type) * item.quantity).toFixed(2)} {t('currency')}</td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan={4} className="text-center text-gray-400 py-4">{t('noProductsFound') || 'لا توجد منتجات'}</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    {/* ملخص الطلب */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mt-6 border-t pt-4">
                      <div className="flex items-center gap-2 text-lg font-bold">
                        <span>{t('orderTotal')}:</span>
                        <span className="text-primary">{order.total?.toFixed(2) || '-'} {t('currency')}</span>
                      </div>
                      {canCancel(order) && (
                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 font-semibold"
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={cancellingId === order.id}
                        >
                          <XCircle className="h-5 w-5" />
                          {cancellingId === order.id ? t('loading') : t('cancel')}
                        </button>
                      )}
                    </div>
                    {/* ملاحظات الطلب */}
                    {order.notes && (
                      <div className="mt-2 text-sm text-gray-500">
                        <span className="font-semibold">{t('orderNotes')}:</span> {order.notes}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="bg-gray-50 border-t flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                    <CardDescription className="text-xs text-gray-500">
                      {order.status === 'pending' && t('pending')}
                      {order.status === 'processing' && t('processing')}
                      {order.status === 'shipped' && t('shipped')}
                      {order.status === 'delivered' && t('delivered')}
                      {order.status === 'cancelled' && t('cancelled')}
                    </CardDescription>
                    <span className="text-xs text-gray-400">{t('orderDate')}: {new Date(order.created_at).toLocaleString('en-GB')}</span>
                  </CardFooter>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;