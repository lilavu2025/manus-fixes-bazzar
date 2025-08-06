import React, { useEffect, useContext, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Autocomplete from "../../ui/autocomplete";
import type { NewOrderForm, OrderItem } from "@/orders/order.types";
import { calculateOrderTotal, calculateOrderTotalWithFreeItems } from "@/orders/order.utils";
import OrderDiscountSection from "./OrderDiscountSection";
import OrderDiscountSummary from "./OrderDiscountSummary";
import { LanguageContext } from '@/contexts/LanguageContext.context';
import { checkProductOfferEligibility, applyOfferToProduct, removeAppliedOffer, type OfferEligibility } from "@/utils/offerUtils";

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
  const { language } = useContext(LanguageContext) ?? { language: 'ar' };
  const [offerEligibilities, setOfferEligibilities] = useState<Record<string, OfferEligibility>>({});

  // فحص العروض المتاحة للمنتجات
  const checkOffersForItems = async () => {
    if (!editOrderForm?.items) return;
    
    const userType = originalOrderForEdit?.profiles?.user_type || 'retail';
    const newEligibilities: Record<string, OfferEligibility> = {};
    
    for (const item of editOrderForm.items) {
      if (item.product_id && item.quantity > 0 && !(item as any).is_free) {
        try {
          const eligibility = await checkProductOfferEligibility(
            item.product_id,
            item.quantity,
            editOrderForm.items,
            userType
          );
          
          if (eligibility.isEligible && eligibility.canApply) {
            newEligibilities[item.product_id] = eligibility;
          }
        } catch (error) {
          console.error("Error checking offer for product:", item.product_id, error);
        }
      }
    }
    
    setOfferEligibilities(newEligibilities);
  };

  // تطبيق العرض
  const handleApplyOffer = async (productId: string, eligibility: OfferEligibility) => {
    if (!editOrderForm || !eligibility.offer) return;
    
    try {
      const userType = originalOrderForEdit?.profiles?.user_type || 'retail';
      const updatedItems = await applyOfferToProduct(
        eligibility.offer,
        productId,
        editOrderForm.items,
        products,
        userType
      );
      
      setEditOrderForm(prev => prev ? { ...prev, items: updatedItems } : prev);
      
      // إزالة العرض من قائمة العروض المتاحة لأنه تم تطبيقه
      setOfferEligibilities(prev => {
        const updated = { ...prev };
        delete updated[productId];
        return updated;
      });
    } catch (error) {
      console.error("Error applying offer:", error);
    }
  };

  // إزالة العرض المطبق
  const handleRemoveOffer = (offerId: string) => {
    if (!editOrderForm) return;
    
    const updatedItems = removeAppliedOffer(editOrderForm.items, offerId);
    
    // إعادة حساب الأسعار بناءً على نوع المستخدم بعد إزالة العرض
    const selectedUser = originalOrderForEdit?.profiles;
    const userType = (selectedUser && selectedUser.user_type) ? selectedUser.user_type : 'retail';
    
    const itemsWithCorrectPrices = updatedItems.map(item => {
      // تحديث السعر فقط للمنتجات التي تم إزالة العرض منها وليست مجانية
      if (!(item as any).is_free && !(item as any).offer_applied) {
        const matched = products.find(p => p.id === item.product_id);
        if (matched) {
          let price = matched.price;
          let wholesale = 0;
          if (typeof matched.wholesale_price === 'number' && matched.wholesale_price > 0) wholesale = matched.wholesale_price;
          if (typeof matched.wholesalePrice === 'number' && matched.wholesalePrice > 0) wholesale = Math.max(wholesale, matched.wholesalePrice);
          
          if (userType === 'admin' || userType === 'wholesale') {
            price = wholesale > 0 ? wholesale : matched.price;
          }
          
          return { ...item, price };
        }
      }
      return item;
    });
    
    setEditOrderForm(prev => prev ? { ...prev, items: itemsWithCorrectPrices } : prev);
  };

  // حذف صنف من الطلب
  function removeOrderItem(id: string) {
    setEditOrderForm(f => {
      if (!f) return f;
      return { ...f, items: f.items.filter(item => item.id !== id) };
    });
  }

  // حذف صنف من الطلب بالفهرس (للمنتجات التي قد يكون لها id معقد)
  function removeOrderItemByIndex(index: number) {
    setEditOrderForm(f => {
      if (!f) return f;
      return { ...f, items: f.items.filter((_, i) => i !== index) };
    });
  }

  // تحديث أسعار المنتجات عند تغيير المستخدم (أو عند تحميل الطلبية أو فتح الديالوج)
  useEffect(() => {
    if (!editOrderForm || !open) return;
    let selectedUser = originalOrderForEdit?.profiles;
    let userType = (selectedUser && selectedUser.user_type) ? selectedUser.user_type : 'retail';
    setEditOrderForm(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map(item => {
          // لا نحدث أسعار المنتجات المجانية، نخليها صفر
          if ((item as any).is_free) {
            return item;
          }
          
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
  }, [open, originalOrderForEdit?.profiles?.user_type, products]);

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

  // فحص العروض عند تغيير العناصر
  useEffect(() => {
    if (editOrderForm?.items && products.length > 0) {
      // إضافة تأخير بسيط لتجنب الاستدعاءات المتكررة
      const timeoutId = setTimeout(() => {
        checkOffersForItems();
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editOrderForm?.items, products]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-0 sm:p-0">
        <DialogHeader className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b px-6 py-4 rounded-t-2xl">
          <DialogTitle className="text-2xl font-bold mb-1 text-primary text-center">
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
                    setEditOrderForm(f => {
                      if (!f) return f;
                      // استخدم نفس منطق OrderAddDialog: إذا المنتج مكرر زد الكمية فقط
                      const items = f.items;
                      // ابحث عن أول عنصر فارغ (بدون product_id)
                      const emptyIndex = items.findIndex(itm => !itm.product_id);
                      if (emptyIndex !== -1) {
                        // إذا فيه سطر فارغ، لا تضف سطر جديد
                        return f;
                      }
                      return {
                        ...f,
                        items: [
                          ...items,
                          {
                            id: Date.now().toString(),
                            product_id: "",
                            quantity: 1,
                            price: 0,
                            product_name: "",
                          },
                        ],
                      };
                    });
                  }}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" /> {t("addProduct") || "إضافة منتج"}
                </Button>
              </div>
              <div className="space-y-3">
                {editOrderForm.items.map((item, index) => (
                  <div key={item.id} className={`p-4 border rounded-lg shadow-sm ${(item as any).is_free ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                    <div className="mb-3">
                      <Label className="text-sm font-semibold">
                        {t("product") || "المنتج"} <span className="text-primary font-bold">{editOrderForm.items.length > 1 ? (index + 1) : null}</span> <span className="text-red-500">*</span>
                        {(item as any).is_free && (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold mr-2">
                            🎁 مجاني
                          </span>
                        )}
                      </Label>
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="flex-1 min-w-[250px]">
                        {(item as any).is_free ? (
                          // للمنتجات المجانية: عرض Input معطل
                          <Input
                            value={
                              products.find(p => p.id === item.product_id)?.[`name_${language}`] ||
                              products.find(p => p.id === item.product_id)?.name_ar ||
                              ""
                            }
                            disabled
                            className="bg-green-50 text-green-700 border-green-200 cursor-not-allowed"
                            placeholder="منتج مجاني من عرض مطبق"
                          />
                        ) : (
                          // للمنتجات العادية: Autocomplete
                          <Autocomplete
                            value={
                              products.find(p => p.id === item.product_id)?.[`name_${language}`] ||
                              products.find(p => p.id === item.product_id)?.name_ar ||
                              ""
                            }
                            onClear={() => {
                              // مسح جميع بيانات المنتج عند الضغط على X
                              setEditOrderForm(f => {
                                if (!f) return f;
                                const updatedItems = f.items.map((itm, idx) =>
                                  idx === index
                                    ? {
                                        ...itm,
                                        product_id: "",
                                        product_name: "",
                                        price: 0,
                                        quantity: 1,
                                      }
                                    : itm
                                );
                                return { ...f, items: updatedItems };
                              });
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
                          // تحديث السطر الحالي
                          setEditOrderForm(f => {
                            if (!f) return f;
                            if (matched) {
                              const existingIndex = f.items.findIndex((itm, idx) => itm.product_id === matched.id && idx !== index);
                              if (existingIndex !== -1) {
                                // زد الكمية في السطر الموجود واحذف السطر الحالي
                                const updatedItems = f.items
                                  .map((itm, idx) => idx === existingIndex ? { ...itm, quantity: Number(itm.quantity) + 1 } : itm)
                                  .filter((itm, idx) => idx !== index);
                                return { ...f, items: updatedItems };
                              }
                            }
                            // تحديث السطر الحالي كالمعتاد
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
                            const updatedItems = f.items.map((itm, idx) =>
                              idx === index
                                ? {
                                    ...itm,
                                    product_id: matched ? matched.id : "",
                                    product_name: val,
                                    price: matched ? price : 0,
                                  }
                                : itm
                            );
                            return { ...f, items: updatedItems };
                          });
                        }}
                        options={products.map(p => p[`name_${language}`] || p.name_ar || p.id)}
                        placeholder={t("searchOrSelectProduct") || "ابحث أو اكتب اسم المنتج"}
                        required
                        />
                        )}
                      </div>
                      <div className="w-24">
                        <Label className="text-xs text-gray-600 mb-1 block">
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
                          disabled={(item as any).is_free} // تعطيل تحرير الكمية للمنتجات المجانية
                          className={(item as any).is_free ? "bg-green-50 text-green-700" : ""}
                        />
                      </div>
                      <div className="w-28">
                        <Label className="text-xs text-gray-600 mb-1 block">
                          {t("price") || "السعر"} <span className="text-red-500">*</span>
                          {(item as any).is_free && (
                            <span className="text-green-600 font-bold ml-1">مجاني</span>
                          )}
                        </Label>
                        <div className="flex flex-col gap-1">
                          {(item as any).is_free && (item as any).original_price > 0 && (
                            <span className="text-xs text-gray-500 line-through">
                              {(() => {
                                // حساب السعر الأصلي بناءً على نوع المستخدم
                                const selectedUser = originalOrderForEdit?.profiles;
                                const userType = (selectedUser && selectedUser.user_type) ? selectedUser.user_type : 'retail';
                                const matched = products.find(p => p.id === item.product_id);
                                if (!matched) return (item as any).original_price;
                                
                                let price = matched.price;
                                let wholesale = 0;
                                if (typeof matched.wholesale_price === 'number' && matched.wholesale_price > 0) wholesale = matched.wholesale_price;
                                if (typeof matched.wholesalePrice === 'number' && matched.wholesalePrice > 0) wholesale = Math.max(wholesale, matched.wholesalePrice);
                                
                                if (userType === 'admin' || userType === 'wholesale') {
                                  price = wholesale > 0 ? wholesale : matched.price;
                                }
                                
                                return price;
                              })()} ₪
                            </span>
                          )}
                          <Input
                            type="number"
                            step="0.01"
                            value={item.price === 0 ? 0 : item.price && item.price >= 0 ? item.price : 0}
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
                            disabled={(item as any).is_free} // تعطيل تحرير السعر للمنتجات المجانية
                            className={(item as any).is_free ? "bg-green-50 text-green-700" : ""}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          type="button"
                          onClick={() => {
                            if ((item as any).is_free) {
                              // تحذير للمنتجات المجانية
                              if (window.confirm("هذا منتج مجاني من عرض مطبق. هل أنت متأكد من حذفه؟")) {
                                removeOrderItemByIndex(index); // استخدام الفهرس للمنتجات المجانية
                              }
                            } else {
                              removeOrderItem(item.id);
                            }
                          }}
                          variant={(item as any).is_free ? "outline" : "destructive"}
                          size="sm"
                          className="h-10"
                          title={(item as any).is_free ? "منتج مجاني من عرض مطبق" : "حذف المنتج"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        
                        {/* زر تطبيق العرض - يظهر فقط عند تحقيق شروط عرض */}
                        {item.product_id && offerEligibilities[item.product_id] && !((item as any).is_free) && (
                          <Button
                            type="button"
                            onClick={() => handleApplyOffer(item.product_id, offerEligibilities[item.product_id])}
                            variant="outline"
                            size="sm"
                            className="h-10 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                            title={offerEligibilities[item.product_id].message}
                          >
                            <Gift className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {/* زر إزالة العرض المطبق */}
                        {(item as any).offer_applied && (item as any).offer_id && (
                          <Button
                            type="button"
                            onClick={() => handleRemoveOffer((item as any).offer_id)}
                            variant="outline"
                            size="sm"
                            className="h-10 bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                            title="إزالة العرض المطبق"
                          >
                            <span className="text-xs">✕</span>
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* عرض معلومات العرض المطبق */}
                    {(item as any).offer_applied && (item as any).offer_name && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                        <span className="text-blue-700 font-medium">
                          🎉 عرض مطبق: {(item as any).offer_name}
                        </span>
                        {(item as any).original_price && (
                          <span className="block text-gray-600 text-xs mt-1">
                            السعر الأصلي: {(() => {
                              // حساب السعر الأصلي بناءً على نوع المستخدم
                              const selectedUser = originalOrderForEdit?.profiles;
                              const userType = (selectedUser && selectedUser.user_type) ? selectedUser.user_type : 'retail';
                              const matched = products.find(p => p.id === item.product_id);
                              if (!matched) return (item as any).original_price;
                              
                              let price = matched.price;
                              let wholesale = 0;
                              if (typeof matched.wholesale_price === 'number' && matched.wholesale_price > 0) wholesale = matched.wholesale_price;
                              if (typeof matched.wholesalePrice === 'number' && matched.wholesalePrice > 0) wholesale = Math.max(wholesale, matched.wholesalePrice);
                              
                              if (userType === 'admin' || userType === 'wholesale') {
                                price = wholesale > 0 ? wholesale : matched.price;
                              }
                              
                              return price;
                            })()} ₪
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* عرض معلومات العرض المتاح */}
                    {item.product_id && offerEligibilities[item.product_id] && !((item as any).is_free) && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                        <span className="text-green-700 font-medium">
                          🎁 {offerEligibilities[item.product_id].message}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {/* المجموع الكلي */}
              {editOrderForm.items.length > 0 && (
                <div className="text-right mt-3 space-y-2">
                  {/* عرض تفصيلي للمجموع */}
                  {(() => {
                    // حساب المجموع الفرعي للمنتجات العادية
                    const regularItemsTotal = editOrderForm.items
                      .filter(item => !(item as any).is_free)
                      .reduce((sum, item) => sum + (item.price * item.quantity), 0);
                    
                    // حساب قيمة المنتجات المجانية بناءً على نوع الزبون
                    let selectedUser = originalOrderForEdit?.profiles;
                    let userType = (selectedUser && selectedUser.user_type) ? selectedUser.user_type : 'retail';
                    
                    const freeProductsValue = editOrderForm.items
                      .filter(item => (item as any).is_free)
                      .reduce((sum, item) => {
                        const matched = products.find(p => p.id === item.product_id);
                        if (!matched) return sum;
                        
                        let price = 0;
                        let wholesale = 0;
                        if (typeof matched.wholesale_price === 'number' && matched.wholesale_price > 0) wholesale = matched.wholesale_price;
                        if (typeof matched.wholesalePrice === 'number' && matched.wholesalePrice > 0) wholesale = Math.max(wholesale, matched.wholesalePrice);
                        
                        if (userType === 'admin' || userType === 'wholesale') {
                          price = wholesale > 0 ? wholesale : matched.price;
                        } else {
                          price = matched.price;
                        }
                        
                        return sum + (price * item.quantity);
                      }, 0);
                    
                    const totalBeforeFree = regularItemsTotal + freeProductsValue;
                    const totalAfterFree = regularItemsTotal;
                    
                    return (
                      <div className="border rounded-lg p-3 bg-gray-50">
                        <p className="text-sm text-gray-600">
                          {t("subtotal") || "المجموع الفرعي"}: {totalBeforeFree} ₪
                        </p>
                        {freeProductsValue > 0 && (
                          <p className="text-sm text-green-600">
                            {t("freeProductsDiscount") || "خصم المنتجات المجانية"}: -{freeProductsValue} ₪
                          </p>
                        )}
                        <div className="border-t pt-2 mt-2">
                          <p className="text-lg font-semibold">
                            {t("total") || "المجموع الكلي"}: {totalAfterFree} ₪
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                  
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
