import React, { useContext, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BadgeDollarSign, Percent, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { NewOrderForm, OrderItem } from "@/orders/order.types";
import { calculateOrderTotal } from "@/orders/order.utils";
import Autocomplete from "../../ui/autocomplete";
import AddressSelector from "@/components/addresses/AddressSelector";
import { getNextOrderNumber } from "@/integrations/supabase/getNextOrderNumber";
import { isRTL } from "@/utils/languageContextUtils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import OrderDiscountSection from "./OrderDiscountSection";
import OrderDiscountSummary from "./OrderDiscountSummary";
import { LanguageContext } from '@/contexts/LanguageContext.context';
import { addOrderItemToForm } from "@/orders/order.form.utils"; // استيراد الدالة من المسار الصحيح

interface OrderAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderForm: NewOrderForm;
  setOrderForm: React.Dispatch<React.SetStateAction<NewOrderForm>>;
  allowCustomClient: boolean;
  setAllowCustomClient: (v: boolean) => void;
  users: any[];
  products: any[];
  addOrderItem: () => void;
  removeOrderItem: (id: string) => void;
  updateOrderItem: (id: string, field: keyof OrderItem, value: string | number) => void;
  handleSelectUser: (userId: string) => void;
  isAddingOrder: boolean;
  handleAddOrder: () => void;
  t: (key: string) => string;
}

const OrderAddDialog: React.FC<OrderAddDialogProps> = ({
  open,
  onOpenChange,
  orderForm,
  setOrderForm,
  allowCustomClient,
  setAllowCustomClient,
  users,
  products,
  addOrderItem,
  removeOrderItem,
  updateOrderItem,
  handleSelectUser,
  isAddingOrder,
  handleAddOrder,
  t,
}) => {
  const { language } = useContext(LanguageContext) ?? { language: 'ar' };
  const [nextOrderNumber, setNextOrderNumber] = useState<number | null>(null);

  // إضافة الخصم إلى orderForm إذا لم يكن موجوداً
  useEffect(() => {
    setOrderForm(prev => ({
      ...prev,
      discountEnabled: prev.discountEnabled !== undefined ? prev.discountEnabled : false,
      discountType: prev.discountType || "amount", // "amount" أو "percent"
      discountValue: prev.discountValue || 0,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (open) {
      getNextOrderNumber().then(setNextOrderNumber).catch(() => setNextOrderNumber(null));
    }
  }, [open]);

  useEffect(() => {
    // تحديث أسعار المنتجات عند تغيير المستخدم
    let selectedUser = users.find(u => u.id === orderForm.user_id);
    let userType = (selectedUser && selectedUser.user_type) ? selectedUser.user_type : 'retail';
    setOrderForm(prev => ({
      ...prev,
      items: prev.items.map(item => {
        const matched = products.find(p => p.id === item.product_id);
        if (!matched) return item;
        let price = 0;
        if (userType === 'admin' || userType === 'wholesale') {
          price = matched.wholesale_price && matched.wholesale_price > 0 ? matched.wholesale_price : matched.price;
        } else {
          price = matched.price;
        }
        return { ...item, price };
      })
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderForm.user_id, allowCustomClient]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-0 sm:p-0">
        <DialogHeader className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b px-6 py-4 rounded-t-2xl">
          <DialogTitle className={`text-2xl font-bold mb-1 text-primary text-center ${isRTL ? "text-right" : "text-left"}`}>
            <Plus className="h-5 w-5 text-primary" />
            {t("addNewOrder") + " " || "إضافة طلب جديد"}
            {nextOrderNumber && (
              <span className="ml-2 text-base text-gray-500">
                #{nextOrderNumber}
              </span>
            )}
          </DialogTitle>
          <p className={`text-gray-500 text-sm mt-1 ${isRTL ? "text-right" : "text-left"}`}>
            {t("fillAllRequiredFields") || "يرجى تعبئة جميع الحقول المطلوبة بعناية. جميع الحقول بعلامة * مطلوبة."}
          </p>
        </DialogHeader>
        <form
          className="space-y-8 px-6 py-6"
          autoComplete="off"
          onSubmit={e => {
            e.preventDefault();
            handleAddOrder();
          }}
        >
          {/* اختيار العميل */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="user_id" className="mb-2">
                {t("customer") || "العميل"} <span className="text-red-500"></span>
              </Label>
              <Select
                value={allowCustomClient ? "" : orderForm.user_id}
                onValueChange={value => {
                  if (value === "__custom__") {
                    setAllowCustomClient(true);
                    setOrderForm(prev => ({
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
                  <SelectValue placeholder={t("searchOrSelectCustomer") || "ابحث أو اختر العميل"} />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id} className="truncate">
                      {user.full_name} <span className="text-xs text-gray-400">({user.email})</span>
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__" className="text-blue-600 font-bold">
                    {t("newCustomer") || "عميل جديد"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="payment_method" className="mb-2">
                {t("paymentMethod") || "طريقة الدفع"} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={orderForm.payment_method}
                onValueChange={value =>
                  setOrderForm(prev => ({ ...prev, payment_method: value }))
                }
              >
                <SelectTrigger id="payment_method" className="w-full">
                  <SelectValue placeholder={t("selectPaymentMethod") || "اختر طريقة الدفع"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t("cash") || "نقداً"}</SelectItem>
                  <SelectItem value="card">{t("card") || "بطاقة ائتمان"}</SelectItem>
                  <SelectItem value="bank_transfer">{t("bankTransfer") || "تحويل بنكي"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* معلومات الشحن */}
          <div className="bg-gray-50 rounded-xl p-4 border mt-2">
            <h3 className="text-lg font-semibold mb-4 text-primary">
              {t("shippingInfo") || "معلومات الشحن"}
            </h3>
            {/* اختيار عنوان محفوظ */}
            <AddressSelector
              value={{
                id: orderForm.shipping_address.id || "",
                full_name: orderForm.shipping_address.fullName || "",
                phone: orderForm.shipping_address.phone || "",
                city: orderForm.shipping_address.city || "",
                area: orderForm.shipping_address.area || "",
                street: orderForm.shipping_address.street || "",
                building: orderForm.shipping_address.building || "",
                floor: orderForm.shipping_address.floor || "",
                apartment: orderForm.shipping_address.apartment || "",
              }}
              onChange={addr => setOrderForm(prev => ({
                ...prev,
                shipping_address: {
                  ...prev.shipping_address,
                  // لا تغير fullName و phone، أبقِهم كما هم
                  id: addr.id,
                  city: addr.city,
                  area: addr.area,
                  street: addr.street,
                  building: addr.building,
                  floor: addr.floor,
                  apartment: addr.apartment,
                }
              }))}
              userId={allowCustomClient || !orderForm.user_id ? undefined : orderForm.user_id}
              disabled={allowCustomClient || !orderForm.user_id}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="full_name" className="mb-2">
                  {t("fullName") || "الاسم الكامل"} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="full_name"
                  value={orderForm.shipping_address.fullName}
                  onChange={e =>
                    setOrderForm(prev => ({
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
                <Label htmlFor="phone" className="mb-2">
                  {t("phone") || "رقم الهاتف"} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  value={orderForm.shipping_address.phone}
                  onChange={e =>
                    setOrderForm(prev => ({
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
                <Label htmlFor="city" className="mb-2">{t("city") || "المدينة"}</Label>
                <Input
                  id="city"
                  value={orderForm.shipping_address.city}
                  onChange={e =>
                    setOrderForm(prev => ({
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
                <Label htmlFor="area" className="mb-2">{t("area") || "المنطقة"}</Label>
                <Input
                  id="area"
                  value={orderForm.shipping_address.area}
                  onChange={e =>
                    setOrderForm(prev => ({
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
                <Label htmlFor="street" className="mb-2">{t("street") || "الشارع"}</Label>
                <Input
                  id="street"
                  value={orderForm.shipping_address.street}
                  onChange={e =>
                    setOrderForm(prev => ({
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
                <Label htmlFor="building" className="mb-2">{t("building") || "رقم المبنى"}</Label>
                <Input
                  id="building"
                  value={orderForm.shipping_address.building}
                  onChange={e =>
                    setOrderForm(prev => ({
                      ...prev,
                      shipping_address: {
                        ...prev.shipping_address,
                        building: e.target.value,
                      },
                    }))
                  }
                  placeholder={t("enterBuildingNumber") || "أدخل رقم المبنى"}
                />
              </div>
              <div>
                <Label htmlFor="floor" className="mb-2">{t("floor") || "الطابق"}</Label>
                <Input
                  id="floor"
                  value={orderForm.shipping_address.floor}
                  onChange={e =>
                    setOrderForm(prev => ({
                      ...prev,
                      shipping_address: {
                        ...prev.shipping_address,
                        floor: e.target.value,
                      },
                    }))
                  }
                  placeholder={t("enterFloorOptional") || "أدخل الطابق (اختياري)"}
                />
              </div>
              <div>
                <Label htmlFor="apartment" className="mb-2">{t("apartment") || "رقم الشقة"}</Label>
                <Input
                  id="apartment"
                  value={orderForm.shipping_address.apartment}
                  onChange={e =>
                    setOrderForm(prev => ({
                      ...prev,
                      shipping_address: {
                        ...prev.shipping_address,
                        apartment: e.target.value,
                      },
                    }))
                  }
                  placeholder={t("enterApartmentNumber") || "أدخل رقم الشقة"}
                />
              </div>
            </div>
          </div>
          <OrderDiscountSection
            discountEnabled={orderForm.discountEnabled}
            discountType={orderForm.discountType}
            discountValue={orderForm.discountValue}
            onDiscountEnabledChange={val => setOrderForm(prev => ({ ...prev, discountEnabled: val }))}
            onDiscountTypeChange={val => setOrderForm(prev => ({ ...prev, discountType: val }))}
            onDiscountValueChange={val => setOrderForm(prev => ({ ...prev, discountValue: val }))}
            t={t}
          />
          {/* المنتجات */}
          <div className="bg-gray-50 rounded-xl p-4 border mt-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-primary">
                {t("products") || "المنتجات"}
              </h3>
              <Button type="button" onClick={addOrderItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" /> {t("addProduct") || "إضافة منتج"}
              </Button>
            </div>
            <div className="space-y-3">
              {orderForm.items.map((item, index) => (
                <div key={item.id} className="p-4 border rounded-lg bg-white shadow-sm">
                  <div className="mb-3">
                    <Label className="text-sm font-semibold">
                      {t("product") || "المنتج"} <span className="text-primary font-bold">{orderForm.items.length > 1 ? (index + 1) : null}</span> <span className="text-red-500">*</span>
                    </Label>
                  </div>
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[250px]">
                      <Autocomplete
                      value={
                        products.find(p => p.id === item.product_id)?.[`name_${language}`] ||
                        products.find(p => p.id === item.product_id)?.name_ar ||
                        ""
                      }
                      onClear={() => {
                        // مسح جميع بيانات المنتج عند الضغط على X
                        updateOrderItem(item.id, "product_id", "");
                        updateOrderItem(item.id, "product_name", "");
                        updateOrderItem(item.id, "price", 0);
                        updateOrderItem(item.id, "quantity", 1);
                      }}
                      renderOption={(option) => {
                        const product = products.find(
                          p => p[`name_${language}`] === option || p.name_ar === option || p.name_en === option || p.name_he === option
                        );
                        if (!product) return option;
                        const description = product[`description_${language}`] || product.description_ar || product.description_en || product.description_he;
                        return (
                          <div className="py-1">
                            <div className="font-semibold">{option}</div>
                            {description && (
                              <div className="text-sm text-gray-500 mt-1">{description}</div>
                            )}
                          </div>
                        );
                      }}
                      onInputChange={val => {
                        // إذا كان النص فارغاً، لا تفعل شيئاً (سيتم التعامل معه في onClear)
                        if (!val || val.trim() === "") {
                          return;
                        }
                        
                        const matched = products.find(
                          p => p[`name_${language}`] === val || p.name_ar === val || p.name_en === val || p.name_he === val
                        );
                        // تحديث السطر الحالي كالمعتاد
                        let selectedUser = users.find(u => u.id === orderForm.user_id);
                        let userType = selectedUser?.user_type || (allowCustomClient ? 'retail' : undefined);
                        let price = 0;
                        if (matched) {
                          if (userType === 'admin' || userType === 'wholesale') {
                            price = matched.wholesale_price && matched.wholesale_price > 0 ? matched.wholesale_price : matched.price;
                          } else {
                            price = matched.price;
                          }
                        }
                        updateOrderItem(item.id, "product_id", matched ? matched.id : "");
                        updateOrderItem(item.id, "product_name", val);
                        updateOrderItem(item.id, "price", matched ? price : 0);
                      }}
                      options={products.map(p => p[`name_${language}`] || p.name_ar || p.id)}
                      placeholder={t("searchOrSelectProduct") || "ابحث أو اكتب اسم المنتج"}
                      required                      />
                    </div>
                    <div className="w-24">
                      <Label className="text-xs text-gray-600 mb-1 block">
                        {t("quantity") || "الكمية"} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity === 0 ? "" : item.quantity}
                        onChange={e => {
                          const val = e.target.value === "" ? 0 : parseInt(e.target.value) || 1;
                          updateOrderItem(item.id, "quantity", val);
                        }}
                        required
                      />
                    </div>
                    <div className="w-28">
                      <Label className="text-xs text-gray-600 mb-1 block">
                        {t("price") || "السعر"} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.price === 0 ? "" : item.price}
                        onChange={e => {
                          const val = e.target.value === "" ? 0 : parseFloat(e.target.value) || 0;
                          updateOrderItem(item.id, "price", val);
                        }}
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => removeOrderItem(item.id)}
                      variant="destructive"
                      size="sm"
                      className="h-10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {orderForm.items.length > 0 && (
              <div className="text-right mt-3">
                <p className="text-lg font-semibold">
                  {t("total") || "المجموع الكلي"}: {calculateOrderTotal(orderForm.items)} ₪
                </p>
                <OrderDiscountSummary
                  discountEnabled={orderForm.discountEnabled}
                  discountType={orderForm.discountType}
                  discountValue={orderForm.discountValue}
                  items={orderForm.items}
                  t={t}
                />
              </div>
            )}
          </div>
          {/* ملاحظات + تمييز منشئ الطلب */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="notes" className="mb-2">{t("notes") || "ملاحظات"}</Label>
              <Textarea
                id="notes"
                value={orderForm.notes}
                onChange={e => setOrderForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={t("orderNotesPlaceholder") || "أدخل ملاحظات إضافية (اختياري)"}
              />
            </div>
            <div className="flex flex-col gap-2 mt-2">
              <Label className="mb-2">{t("orderCreator") || "منشئ الطلبية"}</Label>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                  {t("admin") || "أدمن"}
                </Badge>
                <span className="text-xs text-gray-500">
                  {t("orderCreatedFromAdminPanel") || "سيتم تمييز هذه الطلبية أنها أُنشئت من لوحة التحكم"}
                </span>
              </div>
            </div>
          </div>
          {/* أزرار الحفظ */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isAddingOrder}
            >
              {t("cancel") || "إلغاء"}
            </Button>
            <Button
              type="submit"
              className="bg-primary text-white font-bold"
              disabled={isAddingOrder}
            >
              {isAddingOrder ? t("adding") || "جاري الإضافة..." : t("addOrder") || "إضافة الطلب"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderAddDialog;
