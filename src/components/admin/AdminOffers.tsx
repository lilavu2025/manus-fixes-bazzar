import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash,
  Trash2,
  Calendar,
  Percent,
  Image as ImageIcon,
  Eye,
  EyeOff,
  XCircle,
} from "lucide-react";
import { useLanguage } from "../../utils/languageContextUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import ImageUpload from "@/components/ImageUpload";
import MultiLanguageField from "@/components/ui/MultiLanguageField";
import { useOffersRealtime } from "@/hooks/useOffersRealtime";
import { useProductsRealtime } from "@/hooks/useProductsRealtime";
import { getSetting, setSetting } from "@/services/settingsService";
import { getAvailableLanguages, isLanguageFieldRequired } from "@/utils/fieldVisibilityUtils";
import type { Database } from "@/integrations/supabase/types";
import {
  useAddOffer,
  useUpdateOffer,
  useDeleteOffer,
} from "@/integrations/supabase/reactQueryHooks";
import AdminHeader from "./AdminHeader";
import { ClearableInput } from "@/components/ui/ClearableInput";
import Autocomplete from "@/components/ui/autocomplete";
import OfferStatsCard from "@/components/OfferStatsCard";
import OfferSummaryStats from "@/components/admin/OfferSummaryStats";

const AdminOffers: React.FC = () => {
  const { t, isRTL, language } = useLanguage();
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<
    Database["public"]["Tables"]["offers"]["Row"] | null
  >(null);
  const [hideOffersPage, setHideOffersPage] = useState<boolean>(false);
  const [loadingSetting, setLoadingSetting] = useState(true);
  const [searchName, setSearchName] = useState(""); // بحث بالاسم
  const [isEditFormInitialized, setIsEditFormInitialized] = useState(false);

  // نموذج العرض مع جميع الحقول المطلوبة
  const initialForm = useMemo(
    () => ({
      title_en: "",
      title_ar: "",
      title_he: "",
      description_en: "",
      description_ar: "",
      description_he: "",
      discount_type: "percentage" as "percentage" | "fixed",
      discount_percent: "",
      discount_amount: "",
      image_url: "",
      start_date: "",
      end_date: "",
      active: true,
      // نوع العرض
      offer_type: "discount" as "discount" | "buy_get" | "product_discount",
      buy_quantity: "",
      linked_product_id: "",
      get_product_id: "",
      get_discount_type: "free" as "free" | "percentage" | "fixed",
      get_discount_value: "",
    }),
    [],
  );

  const [form, setForm] = useState(initialForm);

  // متغيرات للتعامل مع المنتجات
  const [linkedProductSearch, setLinkedProductSearch] = useState("");
  const [getProductSearch, setGetProductSearch] = useState("");

  // دالة لاختيار النص حسب اللغة الحالية
  const getLocalizedText = (textAr: string, textEn: string, textHe: string) => {
    switch (language) {
      case 'en':
        return textEn || textAr || textHe || "";
      case 'he':
        return textHe || textEn || textAr || "";
      case 'ar':
      default:
        return textAr || textEn || textHe || "";
    }
  };

  // دالة لتنسيق اسم المنتج حسب اللغة
  const getProductDisplayName = (product: any) => {
    if (!product) return "";
    return getLocalizedText(product.name_ar, product.name_en, product.name_he);
  };

  // دالة لتحديث المنتج المربوط
  const handleLinkedProductChange = (productName: string) => {
    setLinkedProductSearch(productName);
    const selectedProduct = productsData.find(p => getProductDisplayName(p) === productName);
    if (selectedProduct) {
      setForm(prev => {
        // تحديث صورة العرض تلقائياً بصورة المنتج إذا كان النوع "خصم على منتج معين"
        const shouldUpdateImage = prev.offer_type === "product_discount" && 
          selectedProduct.image && selectedProduct.image.trim() !== "";
        
        return {
          ...prev, 
          linked_product_id: selectedProduct.id,
          // تحديث صورة العرض تلقائياً بصورة المنتج
          image_url: shouldUpdateImage ? selectedProduct.image : prev.image_url
        };
      });
    } else {
      setForm(prev => ({ ...prev, linked_product_id: "" }));
    }
  };

  // دالة لتحديث المنتج المجاني
  const handleGetProductChange = (productName: string) => {
    setGetProductSearch(productName);
    const selectedProduct = productsData.find(p => getProductDisplayName(p) === productName);
    if (selectedProduct) {
      setForm(prev => {
        // تحديث صورة العرض تلقائياً بصورة المنتج المجاني إذا كان النوع "اشتري واحصل"
        const shouldUpdateImage = prev.offer_type === "buy_get" && 
          selectedProduct.image && selectedProduct.image.trim() !== "";
        
        return {
          ...prev, 
          get_product_id: selectedProduct.id,
          // تحديث صورة العرض تلقائياً بصورة المنتج المجاني
          image_url: shouldUpdateImage ? selectedProduct.image : prev.image_url
        };
      });
    } else {
      setForm(prev => ({ ...prev, get_product_id: "" }));
    }
  };

  // جلب العروض من قاعدة البيانات
  const { offers: offersRawData, loading, error, refetch, setOffers } = useOffersRealtime();
  const offersData = Array.isArray(offersRawData) ? offersRawData : [];

  // جلب المنتجات من قاعدة البيانات
  const { products: productsRawData, loading: productsLoading } = useProductsRealtime();
  const productsData = Array.isArray(productsRawData) ? productsRawData : [];

  // إعداد أسماء المنتجات للقائمة
  const productOptions = productsData.map(getProductDisplayName).filter(Boolean);

  // ربط hooks العروض
  const addOfferMutation = useAddOffer();
  const updateOfferMutation = useUpdateOffer();
  const deleteOfferMutation = useDeleteOffer();

  // جلب الإعداد عند تحميل الصفحة
  useEffect(() => {
    getSetting("hide_offers_page").then((val) => {
      setHideOffersPage(val === "true");
      setLoadingSetting(false);
    });
  }, []);

  // حذف عرض
  const handleDelete = async (id: string) => {
    if (!id) {
      console.error('لا يوجد معرف للحذف');
      return;
    }
    console.log('محاولة حذف العرض بالمعرف:', id);
    try {
      await deleteOfferMutation.mutateAsync(id);
      console.log('تم حذف العرض بنجاح');
      toast.success(t("offerDeletedSuccessfully") || "تم حذف العرض بنجاح");
      setShowDelete(false);
      setSelectedOffer(null);
      refetch();
    } catch (error) {
      console.error("خطأ في حذف العرض:", error);
      toast.error(t("errorDeletingOffer") || "خطأ في حذف العرض");
    }
  };

  // معالجة تغيير المدخلات
  const handleInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // معالجة تغيير المفتاح (Switch)
  const handleSwitchChange = (checked: boolean) => {
    setForm((prev) => ({ ...prev, active: checked }));
  };

  // إضافة عرض جديد
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    // التحقق من صحة البيانات باستخدام اللغات المتاحة
    const availableLanguages = getAvailableLanguages();
    
    // التحقق من وجود عنوان في اللغات المطلوبة
    const hasRequiredTitles = availableLanguages.every(lang => {
      if (isLanguageFieldRequired(lang)) {
        const titleField = `title_${lang}` as keyof typeof form;
        return form[titleField] && String(form[titleField]).trim().length > 0;
      }
      return true;
    });

    if (!hasRequiredTitles) {
      toast.error(t("pleaseCompleteRequiredFields"));
      return;
    }

    // التحقق من بيانات العرض حسب النوع
    if ((form.offer_type === "discount" || form.offer_type === "product_discount")) {
      // التحقق من وجود منتج مرتبط
      if (form.offer_type === "product_discount" && !form.linked_product_id) {
        toast.error(t("selectProduct") || "يرجى اختيار المنتج");
        return;
      }
      
      if (form.discount_type === "percentage") {
        if (!form.discount_percent || Number(form.discount_percent) <= 0 || Number(form.discount_percent) > 100) {
          toast.error(t("invalidDiscountPercent") || "نسبة الخصم يجب أن تكون بين 1 و 100");
          return;
        }
      } else if (form.discount_type === "fixed") {
        if (!form.discount_amount || Number(form.discount_amount) <= 0) {
          toast.error(t("invalidDiscountAmount") || "مبلغ الخصم يجب أن يكون أكبر من 0");
          return;
        }
      }
    } else if (form.offer_type === "buy_get") {
      // التحقق من بيانات اشتري واحصل
      if (!form.buy_quantity || Number(form.buy_quantity) <= 0) {
        toast.error(t("buyQuantityRequired") || "يجب تحديد الكمية المطلوبة للشراء");
        return;
      }
      if (!form.linked_product_id) {
        toast.error(t("linkedProductRequired") || "يجب اختيار المنتج المطلوب شراؤه");
        return;
      }
      if (!form.get_product_id) {
        toast.error(t("getProductRequired") || "يجب اختيار المنتج المجاني");
        return;
      }
      if (form.get_discount_type === "percentage") {
        if (!form.get_discount_value || Number(form.get_discount_value) <= 0 || Number(form.get_discount_value) > 100) {
          toast.error(t("invalidGetDiscountPercent") || "نسبة خصم المنتج المجاني يجب أن تكون بين 1 و 100");
          return;
        }
      } else if (form.get_discount_type === "fixed") {
        if (!form.get_discount_value || Number(form.get_discount_value) <= 0) {
          toast.error(t("invalidGetDiscountAmount") || "مبلغ خصم المنتج المجاني يجب أن يكون أكبر من 0");
          return;
        }
      }
    }

    if (
      form.start_date &&
      form.end_date &&
      new Date(form.start_date) >= new Date(form.end_date)
    ) {
      toast.error(t("endDateMustBeAfterStartDate"));
      return;
    }

    // إعداد بيانات العرض بناءً على اللغات المتاحة
    const availableLangs = getAvailableLanguages();
    
    // تنسيق التواريخ بشكل صحيح
    const startDate = form.start_date ? new Date(form.start_date).toISOString() : null;
    const endDate = form.end_date ? new Date(form.end_date).toISOString() : null;
    
    const offerData: any = {
      offer_type: form.offer_type,
      discount_type: (form.offer_type === "discount" || form.offer_type === "product_discount") ? form.discount_type : null,
      discount_percentage: (form.offer_type === "discount" || form.offer_type === "product_discount") && form.discount_type === "percentage" ? Number(form.discount_percent) : null,
      discount_amount: (form.offer_type === "discount" || form.offer_type === "product_discount") && form.discount_type === "fixed" ? Number(form.discount_amount) : null,
      image_url: form.image_url,
      start_date: startDate,
      end_date: endDate,
      active: form.active,
      // حقول اشتري واحصل
      buy_quantity: form.offer_type === "buy_get" ? Number(form.buy_quantity) : null,
      linked_product_id: form.offer_type === "buy_get" ? form.linked_product_id : (form.offer_type === "product_discount" ? form.linked_product_id : null),
      get_product_id: form.offer_type === "buy_get" ? form.get_product_id : null,
      get_discount_type: form.offer_type === "buy_get" ? form.get_discount_type : null,
      get_discount_value: form.offer_type === "buy_get" && form.get_discount_type !== "free" ? Number(form.get_discount_value) : null,
    };

    console.log('إضافة عرض - البيانات المُرسلة:', offerData);
    console.log('إضافة عرض - اللغات المتاحة:', availableLangs);

    // إضافة حقول اللغات المتاحة فقط
    availableLangs.forEach(lang => {
      const titleField = `title_${lang}` as keyof typeof form;
      const descField = `description_${lang}` as keyof typeof form;
      
      offerData[titleField] = form[titleField] || '';
      // للوصف: إرسال null إذا كان فارغ، وإلا إرسال النص
      const descValue = form[descField] as string;
      offerData[descField] = descValue && descValue.trim() ? descValue : null;
    });
    
    // إضافة قيم للغات غير المتاحة (للتوافق مع قاعدة البيانات)
    const allLanguages = ['ar', 'en', 'he'];
    allLanguages.forEach(lang => {
      if (!availableLangs.includes(lang as any)) {
        offerData[`title_${lang}`] = '';
        offerData[`description_${lang}`] = null;
      }
    });

    console.log('إضافة عرض - البيانات المُرسلة:', offerData);
    console.log('🔍 Object keys:', Object.keys(offerData));
    console.log('🔍 Object values:', Object.values(offerData));

    addOfferMutation.mutate(offerData, {
      onSuccess: (data) => {
        console.log('تم إضافة العرض بنجاح - البيانات المُستلمة:', data);
        toast.success(t("offerAddedSuccessfully"));
        setShowAdd(false);
        setForm(initialForm);
        refetch();
      },
      onError: (error: unknown) => {
        console.error("خطأ في إضافة العرض:", error);
        console.error("تفاصيل الخطأ:", JSON.stringify(error, null, 2));
        toast.error(t("errorAddingOffer"));
      },
    });
  };

  // تعديل عرض موجود
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer) {
      toast.error(t("noOfferSelected"));
      return;
    }
    
    // التحقق من صحة البيانات باستخدام اللغات المتاحة
    const availableLanguages = getAvailableLanguages();
    
    // التحقق من وجود عنوان في اللغات المطلوبة
    const hasRequiredTitles = availableLanguages.every(lang => {
      if (isLanguageFieldRequired(lang)) {
        const titleField = `title_${lang}` as keyof typeof form;
        return form[titleField] && String(form[titleField]).trim().length > 0;
      }
      return true;
    });

    if (!hasRequiredTitles) {
      toast.error(t("pleaseCompleteRequiredFields"));
      return;
    }

    // التحقق من بيانات العرض حسب النوع
    if ((form.offer_type === "discount" || form.offer_type === "product_discount")) {
      // التحقق من وجود قيمة الخصم حسب النوع المختار
      if (form.offer_type === "product_discount" && !form.linked_product_id) {
        toast.error(t("selectProduct") || "يرجى اختيار منتج");
        return;
      }
      
      if (form.discount_type === "percentage") {
        if (!form.discount_percent || Number(form.discount_percent) <= 0 || Number(form.discount_percent) > 100) {
          toast.error(t("invalidDiscountPercent") || "نسبة الخصم يجب أن تكون بين 1 و 100");
          return;
        }
      } else if (form.discount_type === "fixed") {
        if (!form.discount_amount || Number(form.discount_amount) <= 0) {
          toast.error(t("invalidDiscountAmount") || "مبلغ الخصم يجب أن يكون أكبر من 0");
          return;
        }
      }
    } else if (form.offer_type === "buy_get") {
      // التحقق من بيانات اشتري واحصل
      if (!form.buy_quantity || Number(form.buy_quantity) <= 0) {
        toast.error(t("buyQuantityRequired") || "يجب تحديد الكمية المطلوبة للشراء");
        return;
      }
      if (!form.linked_product_id) {
        toast.error(t("linkedProductRequired") || "يجب اختيار المنتج المطلوب شراؤه");
        return;
      }
      if (!form.get_product_id) {
        toast.error(t("getProductRequired") || "يجب اختيار المنتج المجاني");
        return;
      }
      if (form.get_discount_type === "percentage") {
        if (!form.get_discount_value || Number(form.get_discount_value) <= 0 || Number(form.get_discount_value) > 100) {
          toast.error(t("invalidGetDiscountPercent") || "نسبة خصم المنتج المجاني يجب أن تكون بين 1 و 100");
          return;
        }
      } else if (form.get_discount_type === "fixed") {
        if (!form.get_discount_value || Number(form.get_discount_value) <= 0) {
          toast.error(t("invalidGetDiscountAmount") || "مبلغ خصم المنتج المجاني يجب أن يكون أكبر من 0");
          return;
        }
      }
    }
    
    // التحقق من وجود صورة
    if (!form.image_url || form.image_url.trim().length === 0) {
      toast.error(t("imageRequired") || "يجب إضافة صورة للعرض");
      return;
    }
    
    // التحقق من التواريخ المطلوبة
    if (!form.start_date || form.start_date.trim().length === 0) {
      toast.error(t("startDateRequired") || "يجب تحديد تاريخ البداية");
      return;
    }

    if (!form.end_date || form.end_date.trim().length === 0) {
      toast.error(t("endDateRequired") || "يجب تحديد تاريخ النهاية");
      return;
    }
    
    if (
      form.start_date &&
      form.end_date &&
      new Date(form.start_date) >= new Date(form.end_date)
    ) {
      toast.error(t("endDateMustBeAfterStartDate"));
      return;
    }
    
    // إعداد بيانات التحديث بناءً على اللغات المتاحة
    const availableLangs = getAvailableLanguages();
    const updateData: any = {
      offer_type: form.offer_type,
      discount_type: (form.offer_type === "discount" || form.offer_type === "product_discount") ? form.discount_type : null,
      discount_percentage: (form.offer_type === "discount" || form.offer_type === "product_discount") && form.discount_type === "percentage" ? Number(form.discount_percent) : null,
      discount_amount: (form.offer_type === "discount" || form.offer_type === "product_discount") && form.discount_type === "fixed" ? Number(form.discount_amount) : null,
      image_url: form.image_url || null,
      start_date: form.start_date,
      end_date: form.end_date,
      active: form.active,
      // حقول اشتري واحصل
      buy_quantity: form.offer_type === "buy_get" ? Number(form.buy_quantity) : null,
      linked_product_id: form.offer_type === "buy_get" ? form.linked_product_id : (form.offer_type === "product_discount" ? form.linked_product_id : null),
      get_product_id: form.offer_type === "buy_get" ? form.get_product_id : null,
      get_discount_type: form.offer_type === "buy_get" ? form.get_discount_type : null,
      get_discount_value: form.offer_type === "buy_get" && form.get_discount_type !== "free" ? Number(form.get_discount_value) : null,
    };

    // إضافة حقول اللغات المتاحة فقط
    availableLangs.forEach(lang => {
      const titleField = `title_${lang}` as keyof typeof form;
      const descField = `description_${lang}` as keyof typeof form;
      
      updateData[titleField] = form[titleField] || '';
      // للوصف: إرسال null إذا كان فارغ، وإلا إرسال النص
      const descValue = form[descField] as string;
      updateData[descField] = descValue && descValue.trim() ? descValue : null;
    });
    
    updateOfferMutation.mutate(
      { id: selectedOffer.id, updateData },
      {
        onSuccess: () => {
          toast.success(t("offerUpdatedSuccessfully"));
          setShowEdit(false);
          setSelectedOffer(null);
          setForm(initialForm);
          setIsEditFormInitialized(false);
          refetch();
        },
        onError: (error: unknown) => {
          console.error("خطأ في تعديل العرض:", error);
          toast.error(t("errorUpdatingOffer"));
        },
      },
    );
  };

  // تحديث النموذج عند تحديد عرض للتعديل
  useEffect(() => {
    if (showEdit && selectedOffer && !isEditFormInitialized) {
      setForm({
        title_en: selectedOffer.title_en || "",
        title_ar: selectedOffer.title_ar || "",
        title_he: selectedOffer.title_he || "",
        description_en: selectedOffer.description_en || "",
        description_ar: selectedOffer.description_ar || "",
        description_he: selectedOffer.description_he || "",
        discount_type:
          selectedOffer.discount_type === "percentage"
            ? "percentage"
            : selectedOffer.discount_type === "fixed"
            ? "fixed"
            : "percentage",
        discount_percent: String(selectedOffer.discount_percentage || ""),
        discount_amount: String(selectedOffer.discount_amount || ""),
        image_url: selectedOffer.image_url || "",
        start_date: selectedOffer.start_date
          ? selectedOffer.start_date.split("T")[0]
          : "",
        end_date: selectedOffer.end_date
          ? selectedOffer.end_date.split("T")[0]
          : "",
        active: selectedOffer.active ?? true,
        // حقول اشتري واحصل
        offer_type: (selectedOffer as any).offer_type || "discount",
        buy_quantity: String((selectedOffer as any).buy_quantity || ""),
        linked_product_id: (selectedOffer as any).linked_product_id || "",
        get_product_id: (selectedOffer as any).get_product_id || "",
        get_discount_type: (selectedOffer as any).get_discount_type || "free",
        get_discount_value: String((selectedOffer as any).get_discount_value || ""),
      });
      
      // تحديث أسماء المنتجات المعروضة
      const linkedProduct = productsData.find(p => p.id === (selectedOffer as any).linked_product_id);
      const getProduct = productsData.find(p => p.id === (selectedOffer as any).get_product_id);
      
      setLinkedProductSearch(linkedProduct ? getProductDisplayName(linkedProduct) : "");
      setGetProductSearch(getProduct ? getProductDisplayName(getProduct) : "");
      
      setIsEditFormInitialized(true);
    } else if (!showEdit && !showAdd) {
      setForm(initialForm);
      setLinkedProductSearch("");
      setGetProductSearch("");
      setIsEditFormInitialized(false);
    }
  }, [showEdit, selectedOffer, showAdd, productsData, isEditFormInitialized]);

  // تحديث الإعداد عند تغيير السويتش
  const handleToggleHideOffers = async (checked: boolean) => {
    setLoadingSetting(true);
    await setSetting("hide_offers_page", checked ? "true" : "false");
    setHideOffersPage(checked);
    setLoadingSetting(false);
  };

  // تصفية العروض حسب البحث بالاسم
  const filteredOffers = offersData.filter((offer) => {
    if (!searchName.trim()) return true;
    return (
      offer.title_ar?.toLowerCase().includes(searchName.trim().toLowerCase()) ||
      offer.title_en?.toLowerCase().includes(searchName.trim().toLowerCase()) ||
      offer.title_he?.toLowerCase().includes(searchName.trim().toLowerCase())
    );
  });

  return (
    <div className={`space-y-6 ${isRTL ? "rtl" : "ltr"}`}>
      {/* إعداد إخفاء صفحة العروض */}
      <div className="flex items-center gap-4 mb-4 justify-center py-4 bg-gray-50 rounded-lg border">
        <Switch
          checked={hideOffersPage}
          onCheckedChange={handleToggleHideOffers}
          disabled={loadingSetting}
        />
        <span
          className={`font-medium text-base ${hideOffersPage ? "text-red-600" : "text-green-700"}`}
        >
          {hideOffersPage
            ? t("offersHidden")
            : t("offersVisible")}
        </span>
        {loadingSetting && (
          <span className="ml-2 text-xs text-gray-400 animate-pulse">
            {t("loadingSetting")}
          </span>
        )}
      </div>

      {/* رأس الصفحة */}
      <AdminHeader
        title={t("offers") || "العروض"}
        count={offersData.length}
        addLabel={t("addOffer") || "إضافة عرض"}
        onAdd={() => setShowAdd(true)}
      />

      {/* الإحصائيات العامة */}
      {!loading && offersData.length > 0 && (
        <OfferSummaryStats offers={offersData} />
      )}

      {/* شريط الفلاتر الموحد (تصميم متجاوب ومحسّن) */}
      <Card className="shadow-lg border-0 mt-1">
        <CardContent className="p-2 sm:p-3 lg:p-4">
          <div className="flex flex-col gap-2 lg:gap-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
              {/* بحث بالاسم */}
              <div className="w-full sm:w-64 flex-shrink-0">
                <div className="relative">
                  <ClearableInput
                    type="text"
                    className={`border-2 border-gray-200 rounded-lg py-2 h-10 text-xs sm:text-sm w-full bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-300 transition-colors placeholder:text-gray-400 ${isRTL ? 'pr-8 pl-3' : 'pl-8 pr-3'}`}
                    placeholder={t("searchByNameOfferPlaceholder") || "اكتب اسم العرض..."}
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    onClear={() => setSearchName("")}
                    maxLength={60}
                  />
                </div>
              </div>
              {/* زر تصفير الفلاتر */}
              <div className="w-full sm:w-auto flex flex-row gap-2 mt-2 sm:mt-0">
                <button
                  type="button"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 font-bold shadow border border-red-200 hover:bg-red-100 transition-all duration-200 h-10 text-xs sm:text-sm"
                  onClick={() => {
                    setSearchName("");
                  }}
                >
                  <XCircle className="h-4 w-4" />
                  <span>{t("resetFilters") || "مسح الفلاتر"}</span>
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* حالة التحميل */}
      {loading && (
        <div className="space-y-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto animate-spin rounded-full border-primary"></div>
            <p className="mt-4 text-gray-600">{t("loadingOffers")}</p>
          </div>
        </div>
      )}

      {/* عرض العروض */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOffers.map(
            (offer: Database["public"]["Tables"]["offers"]["Row"]) => {
              const currentTitle = getLocalizedText(offer.title_ar, offer.title_en, offer.title_he);
              const currentDescription = getLocalizedText(offer.description_ar, offer.description_en, offer.description_he);
              const isActive = offer.active;
              const isExpired =
                offer.end_date && new Date(offer.end_date) < new Date();

              return (
                <Card
                  key={offer.id}
                  className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg flex flex-col h-full ${
                    !isActive ? "opacity-60" : ""
                  }`}
                >
                  {/* شارة الحالة */}
                  <div className="absolute top-3 right-3 z-10">
                    {isExpired ? (
                      <Badge variant="destructive" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {t("expired")}
                      </Badge>
                    ) : isActive ? (
                      <Badge variant="default" className="text-xs bg-green-500">
                        <Eye className="h-3 w-3 mr-1" />
                        {t("active")}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        <EyeOff className="h-3 w-3 mr-1" />
                        {t("inactive")}
                      </Badge>
                    )}
                  </div>

                  {/* صورة العرض */}
                  {offer.image_url && (
                    <div className="relative h-48 overflow-hidden">
                      <div
                        className="w-full h-full bg-center bg-contain bg-no-repeat transition-transform duration-200 hover:scale-105"
                        style={{ backgroundImage: `url(${offer.image_url})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                  )}

                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg line-clamp-2">
                      {currentTitle}
                    </CardTitle>
                    {currentDescription && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {currentDescription}
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="pt-0 flex-grow flex flex-col justify-between">
                    <div>
                      {/* معلومات العرض */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          {(offer as any).offer_type === "buy_get" ? (
                            <div className="space-y-1">
                              <div className="text-sm font-bold text-primary">
                                {t("buyGetOffer") || "اشتري واحصل"}
                              </div>
                              <div className="text-xs text-gray-600">
                                {t("buy") || "اشتري"} {(offer as any).buy_quantity || 1} {" "}
                                {(() => {
                                  const linkedProduct = productsData.find(p => p.id === (offer as any).linked_product_id);
                                  return linkedProduct ? getProductDisplayName(linkedProduct) : t("product") || "منتج";
                                })()}
                              </div>
                              <div className="text-xs text-green-600">
                                {(offer as any).get_discount_type === "free" 
                                  ? (t("getFree") || "واحصل مجاناً على") 
                                  : `${t("getDiscount") || "واحصل على خصم"} ${(offer as any).get_discount_value}${(offer as any).get_discount_type === "percentage" ? "%" : " " + (t("currency") || "شيكل")}`
                                } {" "}
                                {(() => {
                                  const getProduct = productsData.find(p => p.id === (offer as any).get_product_id);
                                  return getProduct ? getProductDisplayName(getProduct) : t("product") || "منتج";
                                })()}
                              </div>
                            </div>
                          ) : offer.offer_type === "product_discount" ? (
                            <div className="space-y-1">
                              <span className="text-lg font-bold text-purple-600">
                                {offer.discount_type === "percentage" 
                                  ? `${offer.discount_percentage}% ${t("discount")}` 
                                  : `${offer.discount_amount} ${t("currency")} ${t("discount")}`
                                }
                              </span>
                              <div className="text-xs text-purple-600">
                                {t("on") || "على"} {" "}
                                {(() => {
                                  const linkedProduct = productsData.find(p => p.id === offer.linked_product_id);
                                  return linkedProduct ? getProductDisplayName(linkedProduct) : t("product") || "منتج";
                                })()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-lg font-bold text-primary">
                              {offer.discount_type === "percentage" 
                                ? `${offer.discount_percentage}% ${t("discount")}` 
                                : `${offer.discount_amount} ${t("currency") || "شيكل"} ${t("discount")}`
                              }
                            </span>
                          )}
                        </div>
                      </div>

                      {/* تواريخ العرض */}
                      {(offer.start_date || offer.end_date) && (
                        <div className="text-xs text-gray-500 mb-4 space-y-1">
                          {offer.start_date && (
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {t("startDate")}:{" "}
                              {new Date(offer.start_date).toLocaleDateString('en-US', { calendar: 'gregory' })}
                            </div>
                          )}
                          {offer.end_date && (
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {t("endDate")}:{" "}
                              {new Date(offer.end_date).toLocaleDateString('en-US', { calendar: 'gregory' })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* إحصائيات العرض */}
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <OfferStatsCard offer={offer} variant="inline" />
                      </div>
                    </div>

                    {/* أزرار الإجراءات - مثبتة في الأسفل */}
                    <div className="flex gap-2 mt-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedOffer(offer);
                          setIsEditFormInitialized(false);
                          setShowEdit(true);
                        }}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        {t("edit")}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          console.log('تم النقر على زر الحذف للعرض:', offer);
                          setSelectedOffer(offer);
                          setShowDelete(true);
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            },
          )}
        </div>
      )}

      {/* رسالة عدم وجود عروض */}
      {!loading && offersData.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-4 bg-white rounded-xl shadow border mx-auto max-w-xl">
          <ImageIcon className="h-20 w-20 text-gray-300 mb-2" />
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {t("noOffers")}
          </h3>
          <p className="text-gray-500 mb-4 text-base text-center">
            {t("noOffersDesc")}
          </p>
          <Button
            onClick={() => setShowAdd(true)}
            className="gap-2 bg-primary text-white font-bold px-6 py-3 rounded-lg text-base shadow hover:bg-primary/90 transition"
          >
            <Plus className="h-5 w-5" />
            {t("addFirstOffer")}
          </Button>
        </div>
      )}

      {/* نافذة إضافة عرض جديد */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 -m-6 mb-6 p-6 border-b border-blue-200">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center text-blue-800 flex items-center justify-center gap-2">
                <Plus className="h-6 w-6" />
                {t("addOffer") || "إضافة عرض"}
              </DialogTitle>
              <DialogDescription className="text-center text-blue-600 mt-2">
                {t("addOfferDesc") || "أدخل بيانات العرض الجديد"}
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleAdd} className="space-y-6">
            {/* قسم المحتوى متعدد اللغات */}
            <Card className="border-l-4 border-l-green-500 bg-green-50/50">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-green-800 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  {t("offerContent") || "محتوى العرض"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* العناوين متعددة اللغات */}
                <MultiLanguageField
                  fieldName="offerTitle"
                  label={t("offerTitle") || "عنوان العرض"}
                  values={{
                    ar: form.title_ar,
                    en: form.title_en,
                    he: form.title_he,
                  }}
                  onChange={(lang, value) => 
                    handleInput({ target: { name: `title_${lang}`, value } } as any)
                  }
                  placeholder={{
                    ar: "أدخل عنوان العرض",
                    en: "Enter offer title",
                    he: "הכנס כותרת הצעה"
                  }}
                  required={true}
                />

                {/* الأوصاف متعددة اللغات */}
                <MultiLanguageField
                  fieldName="offerDescription"
                  label={t("offerDescription") || "وصف العرض"}
                  type="textarea"
                  values={{
                    ar: form.description_ar,
                    en: form.description_en,
                    he: form.description_he,
                  }}
                  onChange={(lang, value) => 
                    handleInput({ target: { name: `description_${lang}`, value } } as any)
                  }
                  placeholder={{
                    ar: "أدخل وصف العرض",
                    en: "Enter offer description",
                    he: "הכנס תיאור הצעה"
                  }}
                  rows={3}
                  required={false}
                />
              </CardContent>
            </Card>

            {/* قسم تفاصيل العرض */}
            <Card className="border-l-4 border-l-purple-500 bg-purple-50/50">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-purple-800 flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  {t("offerDetails") || "تفاصيل العرض"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* اختيار نوع العرض */}
                  <div>
                    <Label className="text-sm font-medium text-purple-700 mb-2 block">
                      {t("offerType") || "نوع العرض"} <span className="text-red-500">*</span>
                    </Label>
                    <select
                      name="offer_type"
                      value={form.offer_type}
                      onChange={(e) => {
                        const newOfferType = e.target.value as "discount" | "product_discount" | "buy_get";
                        setForm(prev => ({ 
                          ...prev, 
                          offer_type: newOfferType,
                          // إعادة تعيين القيم عند التغيير فقط إذا كان النوع مختلف
                          ...(newOfferType !== prev.offer_type && {
                            discount_type: "percentage",
                            discount_percent: "",
                            discount_amount: "",
                            buy_quantity: "",
                            linked_product_id: "",
                            get_product_id: "",
                            get_discount_type: "free",
                            get_discount_value: "",
                            // إعادة تعيين الصورة عند التغيير إلى نوع خصم عادي
                            ...(newOfferType === "discount" && { image_url: "" })
                          })
                        }));
                        // إعادة تعيين أسماء المنتجات عند التغيير
                        if (newOfferType !== form.offer_type) {
                          setLinkedProductSearch("");
                          setGetProductSearch("");
                        }
                      }}
                      className="w-full p-2 border border-purple-200 rounded-md focus:border-purple-500 focus:outline-none"
                    >
                      <option value="discount">{t("regularDiscount") || "خصم على كل المنتجات"}</option>
                      <option value="product_discount">{t("productDiscount") || "خصم على المنتج"}</option><option value="buy_get">{t("buyGetOffer") || "اشتري واحصل"}</option>
                    </select>
                  </div>

                  {/* حقول الخصم العادي */}
                  {form.offer_type === "discount" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* اختيار نوع الخصم */}
                      <div>
                        <Label className="text-sm font-medium text-purple-700 mb-2 block">
                          {t("discountType") || "نوع الخصم"} <span className="text-red-500">*</span>
                        </Label>
                        <select
                          name="discount_type"
                          value={form.discount_type}
                          onChange={(e) => setForm(prev => ({ 
                            ...prev, 
                            discount_type: e.target.value as "percentage" | "fixed",
                            // إعادة تعيين القيم عند التغيير
                            discount_percent: "",
                            discount_amount: ""
                          }))}
                          className="w-full p-2 border border-purple-200 rounded-md focus:border-purple-500 focus:outline-none"
                        >
                          <option value="percentage">{t("percentageDiscount") || "خصم بالنسبة المئوية"}</option>
                          <option value="fixed">{t("fixedAmountDiscount") || "خصم بمبلغ ثابت"}</option>
                        </select>
                      </div>

                      {/* حقل نسبة الخصم - يظهر فقط عند اختيار percentage */}
                      {form.discount_type === "percentage" && (
                        <div>
                          <Label className="text-sm font-medium text-purple-700 mb-2 block">
                            {t("discountPercent") || "نسبة الخصم"} <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            name="discount_percent"
                            type="number"
                            min="1"
                            max="100"
                            value={form.discount_percent}
                            onChange={handleInput}
                            placeholder="0"
                            required
                            className="border-purple-200 focus:border-purple-500"
                          />
                        </div>
                      )}

                      {/* حقل مبلغ الخصم - يظهر فقط عند اختيار fixed */}
                      {form.discount_type === "fixed" && (
                        <div>
                          <Label className="text-sm font-medium text-purple-700 mb-2 block">
                            {t("discountAmount") || "مبلغ الخصم"} <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            name="discount_amount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={form.discount_amount}
                            onChange={handleInput}
                            placeholder="0.00"
                            required
                            className="border-purple-200 focus:border-purple-500"
                          />
                        </div>
                      )}

                      <div>
                        <Label className="text-sm font-medium text-purple-700 mb-2 block">
                          {t("image") || "الصورة"} <span className="text-red-500">*</span>
                        </Label>
                        <ImageUpload
                          value={form.image_url}
                          onChange={(url) =>
                            setForm((prev) => ({ ...prev, image_url: url as string }))
                          }
                          label={t("image")}
                          placeholder={t("uploadImage")}
                          bucket="product-images"
                        />
                      </div>
                    </div>
                  )}

                  {/* حقول الخصم على منتج معين  */}
                  {form.offer_type === "product_discount" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* اختيار المنتج */}
                      <div>
                        <Label className="text-sm font-medium text-purple-700 mb-2 block">
                          {t("product") || "المنتج"} <span className="text-red-500">*</span>
                        </Label>
                        <Autocomplete
                          value={linkedProductSearch}
                          onInputChange={handleLinkedProductChange}
                          onClear={() => {
                            setLinkedProductSearch("");
                            setForm(prev => ({ ...prev, linked_product_id: "" }));
                          }}
                          options={productOptions}
                          placeholder={t("selectProduct") || "اختر المنتج..."}
                          required
                        />
                      </div>

                      {/* اختيار نوع الخصم */}
                      <div>
                        <Label className="text-sm font-medium text-purple-700 mb-2 block">
                          {t("discountType") || "نوع الخصم"} <span className="text-red-500">*</span>
                        </Label>
                        <select
                          name="discount_type"
                          value={form.discount_type}
                          onChange={(e) => setForm(prev => ({ 
                            ...prev, 
                            discount_type: e.target.value as "percentage" | "fixed",
                            //إعادة تعيين القيم عند التغيير
                            discount_percent: "",
                            discount_amount: ""
                          }))}
                          className="w-full p-2 border border-purple-200 rounded-md focus:border-purple-500 focus:outline-none"
                        >
                          <option value="percentage">{t("percentageDiscount") || "خصم بالنسبة المئوية"}</option>
                          <option value="fixed">{t("fixedAmountDiscount") || "خصم بمبلغ ثابت"}</option>
                        </select>
                      </div>

                      {/* حقل نسبة الخصم - يظهر فقط عند اختيار percentage*/}
                      {form.discount_type === "percentage" && (
                        <div>
                          <Label className="text-sm font-medium text-purple-700 mb-2 block">
                            {t("discountPercent") || "نسبة الخصم"} <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            name="discount_percent"
                            type="number"
                            min="1"
                            max="100"
                            value={form.discount_percent}
                            onChange={handleInput}
                            placeholder="0"
                            required
                            className="border-purple-200 focus:border-purple-500"
                          />
                        </div>
                      )}

                      {/*حقل مبلغ الخصم - يظهر فقط عند اختيار fixed */}
                      {form.discount_type === "fixed" && (
                        <div>
                          <Label className="text-sm font-medium text-purple-700 mb-2 block">
                            {t("discountAmount") || "مبلغ الخصم"} <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            name="discount_amount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={form.discount_amount}
                            onChange={handleInput}
                            placeholder="0.00"
                            required
                            className="border-purple-200 focus:border-purple-500"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* حقول اشتري واحصل */}
                  {form.offer_type === "buy_get" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* المنتج المطلوب شراؤه */}
                        <div>
                          <Label className="text-sm font-medium text-purple-700 mb-2 block">
                            {t("linkedProduct") || "المنتج المطلوب شراؤه"} <span className="text-red-500">*</span>
                          </Label>
                          <Autocomplete
                            value={linkedProductSearch}
                            onInputChange={handleLinkedProductChange}
                            onClear={() => {
                              setLinkedProductSearch("");
                              setForm(prev => ({ ...prev, linked_product_id: "" }));
                            }}
                            options={productOptions}
                            placeholder={t("selectProduct") || "اختر المنتج..."}
                            required
                          />
                        </div>

                        {/* الكمية المطلوبة */}
                        <div>
                          <Label className="text-sm font-medium text-purple-700 mb-2 block">
                            {t("buyQuantity") || "الكمية المطلوبة"} <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            name="buy_quantity"
                            type="number"
                            min="1"
                            value={form.buy_quantity}
                            onChange={handleInput}
                            placeholder={t("buyQuantity") || "الكمية المطلوبة"} 
                            required
                            className="border-purple-200 focus:border-purple-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* المنتج المجاني */}
                        <div>
                          <Label className="text-sm font-medium text-purple-700 mb-2 block">
                            {t("getProduct") || "المنتج المجاني"} <span className="text-red-500">*</span>
                          </Label>
                          <Autocomplete
                            value={getProductSearch}
                            onInputChange={handleGetProductChange}
                            onClear={() => {
                              setGetProductSearch("");
                              setForm(prev => ({ ...prev, get_product_id: "" }));
                            }}
                            options={productOptions}
                            placeholder={t("selectProduct") || "اختر المنتج..."}
                            required
                          />
                        </div>

                        {/* نوع خصم المنتج المجاني */}
                        <div>
                          <Label className="text-sm font-medium text-purple-700 mb-2 block">
                            {t("getDiscountType") || "نوع الخصم للمنتج المجاني"} <span className="text-red-500">*</span>
                          </Label>
                          <select
                            name="get_discount_type"
                            value={form.get_discount_type}
                            onChange={(e) => setForm(prev => ({ 
                              ...prev, 
                              get_discount_type: e.target.value as "free" | "percentage" | "fixed",
                              get_discount_value: ""
                            }))}
                            className="w-full p-2 border border-purple-200 rounded-md focus:border-purple-500 focus:outline-none"
                          >
                            <option value="free">{t("free") || "مجاني"}</option>
                            <option value="percentage">{t("discountPercentage") || "خصم بالنسبة المئوية"}</option>
                            <option value="fixed">{t("fixedDiscount") || "خصم بمبلغ ثابت"}</option>
                          </select>
                        </div>
                      </div>

                      {/* قيمة الخصم للمنتج المجاني */}
                      {form.get_discount_type !== "free" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label className="text-sm font-medium text-purple-700 mb-2 block">
                              {form.get_discount_type === "percentage" 
                                ? (t("discountPercent") || "نسبة الخصم") 
                                : (t("discountAmount") || "مبلغ الخصم")
                              } <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              name="get_discount_value"
                              type="number"
                              min={form.get_discount_type === "percentage" ? "1" : "0.01"}
                              max={form.get_discount_type === "percentage" ? "100" : undefined}
                              step={form.get_discount_type === "percentage" ? "1" : "0.01"}
                              value={form.get_discount_value}
                              onChange={handleInput}
                              placeholder={form.get_discount_type === "percentage" ? "0" : "0.00"}
                              required
                              className="border-purple-200 focus:border-purple-500"
                            />
                          </div>
                        </div>
                      )}

                      {/* صورة العرض */}
                      <div>
                        <Label className="text-sm font-medium text-purple-700 mb-2 block">
                          {t("image") || "الصورة"} <span className="text-red-500">*</span>
                        </Label>
                        <ImageUpload
                          value={form.image_url}
                          onChange={(url) =>
                            setForm((prev) => ({ ...prev, image_url: url as string }))
                          }
                          label={t("image")}
                          placeholder={t("uploadImage")}
                          bucket="product-images"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* قسم التواريخ والحالة */}
            <Card className="border-l-4 border-l-orange-500 bg-orange-50/50">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-orange-800 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {t("dateAndStatus") || "التاريخ والحالة"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-orange-700 mb-2 block">
                      {t("startDate") || "تاريخ البداية"} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      name="start_date"
                      type="date"
                      value={form.start_date}
                      onChange={handleInput}
                      required
                      className="border-orange-200 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-orange-700 mb-2 block">
                      {t("endDate") || "تاريخ النهاية"} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      name="end_date"
                      type="date"
                      value={form.end_date}
                      onChange={handleInput}
                      required
                      className="border-orange-200 focus:border-orange-500"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-orange-100 rounded-lg border border-orange-200">
                  <Switch
                    checked={form.active}
                    onCheckedChange={handleSwitchChange}
                  />
                  <Label className="text-sm font-medium text-orange-800">
                    {t("activeOffer") || "العرض نشط"}
                  </Label>
                </div>
              </CardContent>
            </Card>

            <div className="bg-gray-50 -m-6 mt-6 p-6 border-t border-gray-200">
              <DialogFooter className="gap-3">
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="flex-1">
                    {t("cancel") || "إلغاء"}
                  </Button>
                </DialogClose>
                <Button type="submit" className="bg-primary hover:bg-primary/90 flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("add") || "إضافة"}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* نافذة تعديل العرض */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 -m-6 mb-6 p-6 border-b border-blue-200">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center text-blue-800 flex items-center justify-center gap-2">
                <Edit className="h-6 w-6" />
                {t("editOffer") || "تعديل العرض"}
              </DialogTitle>
              <DialogDescription className="text-center text-blue-600 mt-2">
                {t("editOfferDesc") || "تعديل بيانات العرض"}
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleEdit} className="space-y-6">
            {/* قسم المحتوى متعدد اللغات */}
            <Card className="border-l-4 border-l-green-500 bg-green-50/50">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-green-800 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  {t("offerContent") || "محتوى العرض"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* العناوين متعددة اللغات */}
                <MultiLanguageField
                  fieldName="offerTitle"
                  label={t("offerTitle") || "عنوان العرض"}
                  values={{
                    ar: form.title_ar,
                    en: form.title_en,
                    he: form.title_he,
                  }}
                  onChange={(lang, value) => 
                    handleInput({ target: { name: `title_${lang}`, value } } as any)
                  }
                  placeholder={{
                    ar: "أدخل عنوان العرض",
                    en: "Enter offer title",
                    he: "הכנס כותרת הצעה"
                  }}
                  required={true}
                />

                {/* الأوصاف متعددة اللغات */}
                <MultiLanguageField
                  fieldName="offerDescription"
                  label={t("offerDescription") || "وصف العرض"}
                  type="textarea"
                  values={{
                    ar: form.description_ar,
                    en: form.description_en,
                    he: form.description_he,
                  }}
                  onChange={(lang, value) => 
                    handleInput({ target: { name: `description_${lang}`, value } } as any)
                  }
                  placeholder={{
                    ar: "أدخل وصف العرض",
                    en: "Enter offer description",
                    he: "הכנס תיאור הצעה"
                  }}
                  rows={3}
                  required={false}
                />
              </CardContent>
            </Card>

            {/* قسم تفاصيل العرض */}
            <Card className="border-l-4 border-l-purple-500 bg-purple-50/50">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-purple-800 flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  {t("offerDetails") || "تفاصيل العرض"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* اختيار نوع العرض */}
                  <div>
                    <Label className="text-sm font-medium text-purple-700 mb-2 block">
                      {t("offerType") || "نوع العرض"} <span className="text-red-500">*</span>
                    </Label>
                    <select
                      name="offer_type"
                      value={form.offer_type}
                      onChange={(e) => {
                        const newOfferType = e.target.value as "discount" | "product_discount" | "buy_get";
                        setForm(prev => ({ 
                          ...prev, 
                          offer_type: newOfferType,
                          // إعادة تعيين القيم عند التغيير فقط إذا كان النوع مختلف
                          ...(newOfferType !== prev.offer_type && {
                            discount_type: "percentage",
                            discount_percent: "",
                            discount_amount: "",
                            buy_quantity: "",
                            linked_product_id: "",
                            get_product_id: "",
                            get_discount_type: "free",
                            get_discount_value: "",
                            // إعادة تعيين الصورة عند التغيير إلى نوع خصم عادي
                            ...(newOfferType === "discount" && { image_url: "" })
                          })
                        }));
                        // إعادة تعيين أسماء المنتجات عند التغيير
                        if (newOfferType !== form.offer_type) {
                          setLinkedProductSearch("");
                          setGetProductSearch("");
                        }
                      }}
                      className="w-full p-2 border border-purple-200 rounded-md focus:border-purple-500 focus:outline-none"
                    >
                      <option value="discount">{t("regularDiscount") || "خصم على كل المنتجات"}</option>
                      <option value="product_discount">{t("productDiscount") || "خصم على منتج"}</option><option value="buy_get">{t("buyGetOffer") || "اشتري واحصل"}</option>
                    </select>
                  </div>

                  {/* حقول الخصم العادي */}
                  {form.offer_type === "discount" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* اختيار نوع الخصم */}
                      <div>
                        <Label className="text-sm font-medium text-purple-700 mb-2 block">
                          {t("discountType") || "نوع الخصم"} <span className="text-red-500">*</span>
                        </Label>
                        <select
                          name="discount_type"
                          value={form.discount_type}
                          onChange={(e) => setForm(prev => ({ 
                            ...prev, 
                            discount_type: e.target.value as "percentage" | "fixed",
                            // إعادة تعيين القيم عند التغيير
                            discount_percent: "",
                            discount_amount: ""
                          }))}
                          className="w-full p-2 border border-purple-200 rounded-md focus:border-purple-500 focus:outline-none"
                        >
                          <option value="percentage">{t("percentageDiscount") || "خصم بالنسبة المئوية"}</option>
                          <option value="fixed">{t("fixedAmountDiscount") || "خصم بمبلغ ثابت"}</option>
                        </select>
                      </div>

                      {/* حقل نسبة الخصم - يظهر فقط عند اختيار percentage */}
                      {form.discount_type === "percentage" && (
                        <div>
                          <Label className="text-sm font-medium text-purple-700 mb-2 block">
                            {t("discountPercent") || "نسبة الخصم"} <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            name="discount_percent"
                            type="number"
                            min="1"
                            max="100"
                            value={form.discount_percent}
                            onChange={handleInput}
                            placeholder="0"
                            required
                            className="border-purple-200 focus:border-purple-500"
                          />
                        </div>
                      )}

                      {/* حقل مبلغ الخصم - يظهر فقط عند اختيار fixed */}
                      {form.discount_type === "fixed" && (
                        <div>
                          <Label className="text-sm font-medium text-purple-700 mb-2 block">
                            {t("discountAmount") || "مبلغ الخصم"} <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            name="discount_amount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={form.discount_amount}
                            onChange={handleInput}
                            placeholder="0.00"
                            required
                            className="border-purple-200 focus:border-purple-500"
                          />
                        </div>
                      )}

                      <div>
                        <Label className="text-sm font-medium text-purple-700 mb-2 block">
                          {t("image") || "الصورة"}
                        </Label>
                        <ImageUpload
                          value={form.image_url}
                          onChange={(url) =>
                            setForm((prev) => ({ ...prev, image_url: url as string }))
                          }
                          label={t("image")}
                          placeholder={t("uploadImage")}
                          bucket="product-images"
                        />
                      </div>
                    </div>
                  )}
                  {/* حقول الخصم على منتج معين  */}
                  {form.offer_type === "product_discount" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* اختيار المنتج */}
                      <div>
                        <Label className="text-sm font-medium text-purple-700 mb-2 block">
                          {t("product") || "المنتج"} <span className="text-red-500">*</span>
                        </Label>
                        <Autocomplete
                          value={linkedProductSearch}
                          onInputChange={handleLinkedProductChange}
                          onClear={() => {
                            setLinkedProductSearch("");
                            setForm(prev => ({ ...prev, linked_product_id: "" }));
                          }}
                          options={productOptions}
                          placeholder={t("selectProduct") || "اختر المنتج..."}
                          required
                        />
                      </div>

                      {/* اختيار نوع الخصم */}
                      <div>
                        <Label className="text-sm font-medium text-purple-700 mb-2 block">
                          {t("discountType") || "نوع الخصم"} <span className="text-red-500">*</span>
                        </Label>
                        <select
                          name="discount_type"
                          value={form.discount_type}
                          onChange={(e) => setForm(prev => ({ 
                            ...prev, 
                            discount_type: e.target.value as "percentage" | "fixed",
                            // إعادة تعيين القيم عند التغيير
                            discount_percent: "",
                            discount_amount: ""
                          }))}
                          className="w-full p-2 border border-purple-200 rounded-md focus:border-purple-500 focus:outline-none"
                        >
                          <option value="percentage">{t("percentageDiscount") || "خصم بالنسبة المئوية"}</option>
                          <option value="fixed">{t("fixedAmountDiscount") || "خصم بمبلغ ثابت"}</option>
                        </select>
                      </div>

                      {/* حقل نسبة الخصم - يظهر فقط عند اختيار percentage */}
                      {form.discount_type === "percentage" && (
                        <div>
                          <Label className="text-sm font-medium text-purple-700 mb-2 block">
                            {t("discountPercent") || "نسبة الخصم"} <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            name="discount_percent"
                            type="number"
                            min="1"
                            max="100"
                            value={form.discount_percent}
                            onChange={handleInput}
                            placeholder="0"
                            required
                            className="border-purple-200 focus:border-purple-500"
                          />
                        </div>
                      )}

                      {/* حقل المبلغ الثابت - يظهر فقط عند اختيار fixed */}
                      {form.discount_type === "fixed" && (
                        <div>
                          <Label className="text-sm font-medium text-purple-700 mb-2 block">
                            {t("discountAmount") || "مبلغ الخصم"} <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            name="discount_amount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={form.discount_amount}
                            onChange={handleInput}
                            placeholder="0.00"
                            required
                            className="border-purple-200 focus:border-purple-500"
                          />
                        </div>
                      )}
                    </div>
                  )}


                  {/* حقول اشتري واحصل */}
                  {form.offer_type === "buy_get" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* المنتج المطلوب شراؤه */}
                        <div>
                          <Label className="text-sm font-medium text-purple-700 mb-2 block">
                            {t("linkedProduct") || "المنتج المطلوب شراؤه"} <span className="text-red-500">*</span>
                          </Label>
                          <Autocomplete
                            value={linkedProductSearch}
                            onInputChange={handleLinkedProductChange}
                            onClear={() => {
                              setLinkedProductSearch("");
                              setForm(prev => ({ ...prev, linked_product_id: "" }));
                            }}
                            options={productOptions}
                            placeholder={t("selectProduct") || "اختر المنتج..."}
                            required
                          />
                        </div>

                        {/* الكمية المطلوبة */}
                        <div>
                          <Label className="text-sm font-medium text-purple-700 mb-2 block">
                            {t("buyQuantity") || "الكمية المطلوبة"} <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            name="buy_quantity"
                            type="number"
                            min="1"
                            value={form.buy_quantity}
                            onChange={handleInput}
                            placeholder={t("buyQuantity") || "الكمية المطلوبة"} 
                            required
                            className="border-purple-200 focus:border-purple-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* المنتج المجاني */}
                        <div>
                          <Label className="text-sm font-medium text-purple-700 mb-2 block">
                            {t("getProduct") || "المنتج المجاني"} <span className="text-red-500">*</span>
                          </Label>
                          <Autocomplete
                            value={getProductSearch}
                            onInputChange={handleGetProductChange}
                            onClear={() => {
                              setGetProductSearch("");
                              setForm(prev => ({ ...prev, get_product_id: "" }));
                            }}
                            options={productOptions}
                            placeholder={t("selectProduct") || "اختر المنتج..."}
                            required
                          />
                        </div>

                        {/* نوع خصم المنتج المجاني */}
                        <div>
                          <Label className="text-sm font-medium text-purple-700 mb-2 block">
                            {t("getDiscountType") || "نوع الخصم للمنتج المجاني"} <span className="text-red-500">*</span>
                          </Label>
                          <select
                            name="get_discount_type"
                            value={form.get_discount_type}
                            onChange={(e) => setForm(prev => ({ 
                              ...prev, 
                              get_discount_type: e.target.value as "free" | "percentage" | "fixed",
                              get_discount_value: ""
                            }))}
                            className="w-full p-2 border border-purple-200 rounded-md focus:border-purple-500 focus:outline-none"
                          >
                            <option value="free">{t("free") || "مجاني"}</option>
                            <option value="percentage">{t("discountPercentage") || "خصم بالنسبة المئوية"}</option>
                            <option value="fixed">{t("fixedDiscount") || "خصم بمبلغ ثابت"}</option>
                          </select>
                        </div>
                      </div>

                      {/* قيمة الخصم للمنتج المجاني */}
                      {form.get_discount_type !== "free" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label className="text-sm font-medium text-purple-700 mb-2 block">
                              {form.get_discount_type === "percentage" 
                                ? (t("discountPercent") || "نسبة الخصم") 
                                : (t("discountAmount") || "مبلغ الخصم")
                              } <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              name="get_discount_value"
                              type="number"
                              min={form.get_discount_type === "percentage" ? "1" : "0.01"}
                              max={form.get_discount_type === "percentage" ? "100" : undefined}
                              step={form.get_discount_type === "percentage" ? "1" : "0.01"}
                              value={form.get_discount_value}
                              onChange={handleInput}
                              placeholder={form.get_discount_type === "percentage" ? "0" : "0.00"}
                              required
                              className="border-purple-200 focus:border-purple-500"
                            />
                          </div>
                        </div>
                      )}

                      {/* صورة العرض */}
                      <div>
                        <Label className="text-sm font-medium text-purple-700 mb-2 block">
                          {t("image") || "الصورة"}
                        </Label>
                        <ImageUpload
                          value={form.image_url}
                          onChange={(url) =>
                            setForm((prev) => ({ ...prev, image_url: url as string }))
                          }
                          label={t("image")}
                          placeholder={t("uploadImage")}
                          bucket="product-images"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* قسم التواريخ والحالة */}
            <Card className="border-l-4 border-l-orange-500 bg-orange-50/50">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-orange-800 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {t("dateAndStatus") || "التاريخ والحالة"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-orange-700 mb-2 block">
                      {t("startDate") || "تاريخ البداية"}
                    </Label>
                    <Input
                      name="start_date"
                      type="date"
                      value={form.start_date}
                      onChange={handleInput}
                      className="border-orange-200 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-orange-700 mb-2 block">
                      {t("endDate") || "تاريخ النهاية"}
                    </Label>
                    <Input
                      name="end_date"
                      type="date"
                      value={form.end_date}
                      onChange={handleInput}
                      className="border-orange-200 focus:border-orange-500"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-orange-100 rounded-lg border border-orange-200">
                  <Switch
                    checked={form.active}
                    onCheckedChange={handleSwitchChange}
                  />
                  <Label className="text-sm font-medium text-orange-800">
                    {t("activeOffer") || "العرض نشط"}
                  </Label>
                </div>
              </CardContent>
            </Card>

            <div className="bg-gray-50 -m-6 mt-6 p-6 border-t border-gray-200">
              <DialogFooter className="gap-3">
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="flex-1">
                    {t("cancel") || "إلغاء"}
                  </Button>
                </DialogClose>
                <Button type="submit" className="bg-primary hover:bg-primary/90 flex-1">
                  <Edit className="h-4 w-4 mr-2" />
                  {t("save") || "حفظ"}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* نافذة تأكيد الحذف */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={`text-2xl font-bold mb-1 text-primary text-center ${isRTL ? "text-right" : "text-left"}`}>
              {t("deleteOffer")}
            </DialogTitle>
            <DialogDescription className={isRTL ? "text-right" : "text-left"}>
              {t("deleteOfferConfirmation")}
              {selectedOffer && (
                <span className="font-semibold">
                  "{getLocalizedText(selectedOffer.title_ar, selectedOffer.title_en, selectedOffer.title_he)}"
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 flex-col">
            <Button
              variant="destructive"
              onClick={() => selectedOffer && handleDelete(selectedOffer.id)}
              className="w-full"
              disabled={deleteOfferMutation.isPending}
            >
              {deleteOfferMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {t("deleting")}
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("delete")}
                </>
              )}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="w-full">
                {t("cancel")}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOffers;
