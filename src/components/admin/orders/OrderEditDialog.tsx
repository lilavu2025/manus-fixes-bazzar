import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Autocomplete from "../../ui/autocomplete";
import type { NewOrderForm, OrderItem } from "@/orders/order.types";
import { calculateOrderTotal } from "@/orders/order.utils";
import OrderDiscountSection from "./OrderDiscountSection";
import OrderDiscountSummary from "./OrderDiscountSummary";

interface OrderEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editOrderForm: NewOrderForm | null;
  setEditOrderForm: React.Dispatch<React.SetStateAction<NewOrderForm | null>>;
  originalOrderForEdit: any;
  setEditOrderChanges: (changes: any[]) => void;
  setShowConfirmEditDialog: (open: boolean) => void;
  getOrderEditChangesDetailed: (original: any, edited: any) => any[];
  t: (key: string) => string;
  isRTL: boolean;
  products: any[];
}

const OrderEditDialog: React.FC<OrderEditDialogProps> = ({
  open,
  onOpenChange,
  editOrderForm,
  setEditOrderForm,
  originalOrderForEdit,
  setEditOrderChanges,
  setShowConfirmEditDialog,
  getOrderEditChangesDetailed,
  t,
  isRTL,
  products,
}) => {
  // حذف صنف من الطلب
  function removeOrderItem(id: string) {
    setEditOrderForm(f => {
      if (!f) return f;
      return { ...f, items: f.items.filter(item => item.id !== id) };
    });
  }

  // تحديث أسعار المنتجات عند تغيير المستخدم (أو عند تحميل الطلبية)
  useEffect(() => {
    if (!editOrderForm) return;
    let selectedUser = originalOrderForEdit?.profiles;
    let userType = (selectedUser && selectedUser.user_type) ? selectedUser.user_type : 'retail';
    setEditOrderForm(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map(item => {
          const matched = products.find(p => p.id === item.product_id);
          if (!matched) return item;
          let price = 0;
          let wholesale = 0;
          if (typeof matched.wholesale_price === 'number' && matched.wholesale_price > 0) wholesale = matched.wholesale_price;
          if (typeof matched.wholesalePrice === 'number' && matched.wholesalePrice > 0) wholesale = Math.max(wholesale, matched.wholesalePrice);
          if (userType === 'admin' || userType === 'wholesale') {
            price = wholesale > 0 ? wholesale : matched.price;
          } else {
            price = matched.price;
          }
          return { ...item, price };
        })
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalOrderForEdit?.profiles?.user_type, products]);

  // عند فتح الديالوج، إذا الطلبية الأصلية فيها خصم، فعّل الخصم وعبّي القيم
  useEffect(() => {
    if (!open || !originalOrderForEdit) return;
    setEditOrderForm(f => {
      if (!f) return f;
      // إذا الطلبية الأصلية فيها خصم
      const hasDiscount = !!originalOrderForEdit.discount_type && originalOrderForEdit.discount_value > 0;
      return {
        ...f,
        discountEnabled: hasDiscount,
        discountType: hasDiscount ? originalOrderForEdit.discount_type : "amount",
        discountValue: hasDiscount ? originalOrderForEdit.discount_value : 0,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, originalOrderForEdit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-0 sm:p-0">
        <DialogHeader className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b px-6 py-4 rounded-t-2xl">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            {t("editOrder") || "تعديل الطلبية"}
          </DialogTitle>
          <p className={`text-gray-500 text-sm mt-1 ${isRTL ? "text-right" : "text-left"}`}>
            <span className="text-xs font-bold text-gray-700 print:text-black">
              {t("orderNumber") || "رقم الطلب"}: <span className="font-bold">{originalOrderForEdit?.order_number}</span>
            </span>
          </p>
        </DialogHeader>
        {editOrderForm && (
          <form
            className="space-y-8 px-6 py-6"
            autoComplete="off"
            onSubmit={e => {
              e.preventDefault();
              // إذا تم إلغاء تفعيل الخصم، احذف الخصم من الداتا بيس
              if (editOrderForm.discountEnabled === false || editOrderForm.discountValue === 0) {
                setEditOrderForm(f => f ? {
                  ...f,
                  discountType: undefined,
                  discountValue: 0,
                  discountEnabled: false,
                } : f);
              }
              setEditOrderChanges(getOrderEditChangesDetailed(originalOrderForEdit, editOrderForm));
              setShowConfirmEditDialog(true);
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
                  {t("paymentMethod") || "طريقة الدفع"} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={editOrderForm.payment_method}
                  onValueChange={value =>
                    setEditOrderForm(f => (f ? { ...f, payment_method: value } : f))
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
              <div>
                <Label htmlFor="status">
                  {t("status") || "الحالة"} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={editOrderForm.status}
                  onValueChange={value =>
                    setEditOrderForm(f => (f ? { ...f, status: value } : f))
                  }
                >
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder={t("selectStatus") || "اختر الحالة"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{t("pending") || "قيد الانتظار"}</SelectItem>
                    <SelectItem value="processing">{t("processing") || "قيد التنفيذ"}</SelectItem>
                    <SelectItem value="shipped">{t("shipped") || "تم الشحن"}</SelectItem>
                    <SelectItem value="delivered">{t("delivered") || "تم التوصيل"}</SelectItem>
                    <SelectItem value="cancelled">{t("cancelled") || "ملغي"}</SelectItem>
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
                    {t("phone") || "رقم الهاتف"} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    value={editOrderForm.shipping_address.phone}
                    onChange={e =>
                      setEditOrderForm(f =>
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
                    onChange={e =>
                      setEditOrderForm(f =>
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
                    onChange={e =>
                      setEditOrderForm(f =>
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
                    onChange={e =>
                      setEditOrderForm(f =>
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
                  <Label htmlFor="building">{t("building") || "رقم المبنى"}</Label>
                  <Input
                    id="building"
                    value={editOrderForm.shipping_address.building}
                    onChange={e =>
                      setEditOrderForm(f =>
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
                    onChange={e =>
                      setEditOrderForm(f =>
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
                  <Label htmlFor="apartment">{t("apartment") || "رقم الشقة"}</Label>
                  <Input
                    id="apartment"
                    value={editOrderForm.shipping_address.apartment}
                    onChange={e =>
                      setEditOrderForm(f =>
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
            {/* قسم الخصم */}
            <OrderDiscountSection
              discountEnabled={editOrderForm.discountEnabled}
              discountType={editOrderForm.discountType}
              discountValue={editOrderForm.discountValue}
              onDiscountEnabledChange={val => setEditOrderForm(f => f ? { ...f, discountEnabled: val } : f)}
              onDiscountTypeChange={val => setEditOrderForm(f => f ? { ...f, discountType: val } : f)}
              onDiscountValueChange={val => setEditOrderForm(f => f ? { ...f, discountValue: val } : f)}
              t={t}
            />
            {/* المنتجات */}
            <div className="bg-gray-50 rounded-xl p-4 border mt-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-primary">
                  {t("products") || "المنتجات"}
                </h3>
                <Button
                  type="button"
                  onClick={() => {
                    setEditOrderForm(f =>
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
                    );
                  }}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" /> {t("addProduct") || "إضافة منتج"}
                </Button>
              </div>
              <div className="space-y-3">
                {editOrderForm.items.map((item, index) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end p-3 border rounded-lg bg-white shadow-sm"
                  >
                    <div className="col-span-1">
                      <Label>
                        {t("product") || "المنتج"} <span className="text-primary font-bold">{editOrderForm.items.length > 1 ? (index + 1) : null}</span> <span className="text-red-500">*</span>
                      </Label>
                      <Autocomplete
                        value={
                          products.find(p => p.id === item.product_id)?.name_ar ||
                          products.find(p => p.id === item.product_id)?.name_en ||
                          ""
                        }
                        onInputChange={val => {
                          const matched = products.find(
                            p => p.name_ar === val || p.name_en === val
                          );
                          // تحديد نوع المستخدم من بيانات الطلبية
                          let selectedUser = originalOrderForEdit?.profiles;
                          let userType = (selectedUser && selectedUser.user_type) ? selectedUser.user_type : 'retail';
                          let price = 0;
                          let wholesale = 0;
                          if (matched) {
                            if (typeof matched.wholesale_price === 'number' && matched.wholesale_price > 0) wholesale = matched.wholesale_price;
                            if (typeof matched.wholesalePrice === 'number' && matched.wholesalePrice > 0) wholesale = Math.max(wholesale, matched.wholesalePrice);
                            if (userType === 'admin' || userType === 'wholesale') {
                              price = wholesale > 0 ? wholesale : matched.price;
                            } else {
                              price = matched.price;
                            }
                          }
                          // طباعة معلومات الديباغ
                          console.log('matched:', matched);
                          console.log('userType:', userType);
                          console.log('profiles:', originalOrderForEdit?.profiles);
                          console.log('wholesale_price:', matched?.wholesale_price, 'wholesalePrice:', matched?.wholesalePrice, 'price:', matched?.price, 'finalPrice:', price);
                          setEditOrderForm(f => {
                            if (!f) return f;
                            const updatedItems = f.items.map((itm, idx) =>
                              idx === index
                                ? {
                                    ...itm,
                                    product_id: matched ? matched.id : itm.product_id,
                                    product_name: val,
                                    price: price,
                                  }
                                : itm
                            );
                            return { ...f, items: updatedItems };
                          });
                        }}
                        options={products.map(p => p.name_ar || p.name_en || p.id)}
                        placeholder={t("searchOrSelectProduct") || "ابحث أو اكتب اسم المنتج"}
                        required
                      />
                    </div>
                    <div className="col-span-1">
                      <Label>
                        {t("quantity") || "الكمية"} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity === 0 ? "" : item.quantity}
                        onChange={e =>
                          setEditOrderForm(f => {
                            if (!f) return f;
                            const val = e.target.value === "" ? 0 : parseInt(e.target.value) || 1;
                            const updatedItems = f.items.map((itm, idx) =>
                              idx === index ? { ...itm, quantity: val } : itm
                            );
                            return { ...f, items: updatedItems };
                          })
                        }
                        required
                      />
                    </div>
                    <div className="col-span-1">
                      <Label>
                        {t("price") || "السعر"} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.price === 0 ? "" : item.price}
                        onChange={e =>
                          setEditOrderForm(f => {
                            if (!f) return f;
                            const val = e.target.value === "" ? 0 : parseFloat(e.target.value) || 0;
                            const updatedItems = f.items.map((itm, idx) =>
                              idx === index ? { ...itm, price: val } : itm
                            );
                            return { ...f, items: updatedItems };
                          })
                        }
                        required
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
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
                  </div>
                ))}
              </div>
              {/* المجموع الكلي */}
              {editOrderForm.items.length > 0 && (
                <div className="text-right mt-3">
                  <p className="text-lg font-semibold">
                    {t("total") || "المجموع الكلي"}: {calculateOrderTotal(editOrderForm.items)} ₪
                  </p>
                  <OrderDiscountSummary
                    discountEnabled={editOrderForm.discountEnabled}
                    discountType={editOrderForm.discountType}
                    discountValue={editOrderForm.discountValue}
                    items={editOrderForm.items}
                    t={t}
                  />
                </div>
              )}
            </div>
            {/* ملاحظات */}
            <div>
              <Label htmlFor="notes">{t("notes") || "ملاحظات"}</Label>
              <Textarea
                id="notes"
                value={editOrderForm.notes}
                onChange={e =>
                  setEditOrderForm(f => (f ? { ...f, notes: e.target.value } : f))
                }
                placeholder={t("orderNotesPlaceholder") || "أدخل ملاحظات إضافية (اختياري)"}
              />
            </div>
            {/* أزرار الحفظ */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t("cancel") || "إلغاء"}
              </Button>
              <Button type="submit" className="bg-primary text-white font-bold">
                {t("save") || "حفظ التعديلات"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderEditDialog;
