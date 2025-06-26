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
import { useOffersRealtime } from "@/hooks/useOffersRealtime";
import { getSetting, setSetting } from "@/services/settingsService";
import type { Database } from "@/integrations/supabase/types";
import {
  useAddOffer,
  useUpdateOffer,
  useDeleteOffer,
} from "@/integrations/supabase/reactQueryHooks";
import AdminHeader from "./AdminHeader";
import { ClearableInput } from "@/components/ui/ClearableInput";

const AdminOffers: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<
    Database["public"]["Tables"]["offers"]["Row"] | null
  >(null);
  const [hideOffersPage, setHideOffersPage] = useState<boolean>(false);
  const [loadingSetting, setLoadingSetting] = useState(true);
  const [searchName, setSearchName] = useState(""); // بحث بالاسم

  // نموذج العرض مع جميع الحقول المطلوبة
  const initialForm = useMemo(
    () => ({
      title_en: "",
      title_ar: "",
      title_he: "",
      description_en: "",
      description_ar: "",
      description_he: "",
      discount_percent: "",
      image_url: "",
      start_date: "",
      end_date: "",
      active: true,
    }),
    [],
  );

  const [form, setForm] = useState(initialForm);

  // جلب العروض من قاعدة البيانات
  const { offers, loading, error, refetch, setOffers } = useOffersRealtime();
  const offersData = Array.isArray(offers) ? offers : [];

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
    if (!id) return;
    deleteOfferMutation.mutate(id);
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

    // التحقق من صحة البيانات
    if (!form.title_en || !form.title_ar || !form.discount_percent) {
      toast.error(t("pleaseCompleteRequiredFields"));
      return;
    }

    if (
      Number(form.discount_percent) <= 0 ||
      Number(form.discount_percent) > 100
    ) {
      toast.error(t("invalidDiscountPercent"));
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

    const offerData = {
      title_en: form.title_en,
      title_ar: form.title_ar,
      title_he: form.title_he || form.title_en,
      description_en: form.description_en,
      description_ar: form.description_ar,
      description_he: form.description_he || form.description_en,
      discount_percent: Number(form.discount_percent),
      image_url: form.image_url || null,
      start_date: form.start_date || new Date().toISOString(),
      end_date:
        form.end_date ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      active: form.active,
    } as Database["public"]["Tables"]["offers"]["Insert"];

    addOfferMutation.mutate(offerData, {
      onSuccess: () => {
        toast.success(t("offerAddedSuccessfully"));
        setShowAdd(false);
        setForm(initialForm);
        refetch();
      },
      onError: (error: unknown) => {
        console.error("خطأ في إضافة العرض:", error);
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
    if (!form.title_en || !form.title_ar || !form.discount_percent) {
      toast.error(t("pleaseCompleteRequiredFields"));
      return;
    }
    if (
      Number(form.discount_percent) <= 0 ||
      Number(form.discount_percent) > 100
    ) {
      toast.error(t("invalidDiscountPercent"));
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
    const updateData = {
      title_en: form.title_en,
      title_ar: form.title_ar,
      title_he: form.title_he || form.title_en,
      description_en: form.description_en,
      description_ar: form.description_ar,
      description_he: form.description_he || form.description_en,
      discount_percent: Number(form.discount_percent),
      image_url: form.image_url || null,
      start_date: form.start_date,
      end_date: form.end_date,
      active: form.active,
    };
    updateOfferMutation.mutate(
      { id: selectedOffer.id, updateData },
      {
        onSuccess: () => {
          toast.success(t("offerUpdatedSuccessfully"));
          setShowEdit(false);
          setSelectedOffer(null);
          setForm(initialForm);
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
    if (showEdit && selectedOffer) {
      setForm({
        title_en: selectedOffer.title_en || "",
        title_ar: selectedOffer.title_ar || "",
        title_he: selectedOffer.title_he || "",
        description_en: selectedOffer.description_en || "",
        description_ar: selectedOffer.description_ar || "",
        description_he: selectedOffer.description_he || "",
        discount_percent: String(selectedOffer.discount_percent || ""),
        image_url: selectedOffer.image_url || "",
        start_date: selectedOffer.start_date
          ? selectedOffer.start_date.split("T")[0]
          : "",
        end_date: selectedOffer.end_date
          ? selectedOffer.end_date.split("T")[0]
          : "",
        active: selectedOffer.active ?? true,
      });
    } else if (!showEdit && !showAdd) {
      setForm(initialForm);
    }
  }, [showEdit, selectedOffer, showAdd, initialForm]);

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
                {/* زر إضافة عرض داخل Dialog */}
                <Dialog open={showAdd} onOpenChange={setShowAdd}>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold mb-1 text-primary text-center">
                        {t("addOffer")}
                      </DialogTitle>
                      <DialogDescription>
                        {t("addOfferDesc") || "أدخل بيانات العرض الجديد"}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAdd} className="space-y-6">
                      {/* العناوين متعددة اللغات */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">{t("titles")}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium">
                              {t("titleEnglish")} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              name="title_en"
                              value={form.title_en}
                              onChange={handleInput}
                              placeholder="Enter English title"
                              required
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">
                              {t("titleArabic")} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              name="title_ar"
                              value={form.title_ar}
                              onChange={handleInput}
                              placeholder={t("enterArabicTitlePlaceholder")}
                              required
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">
                              {t("titleHebrew")}
                            </Label>
                            <Input
                              name="title_he"
                              value={form.title_he}
                              onChange={handleInput}
                              placeholder="הכנס כותרת בעברית"
                            />
                          </div>
                        </div>
                      </div>

                      {/* الأوصاف متعددة اللغات */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">{t("descriptions")}</h3>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium">
                              {t("descriptionEnglish")}
                            </Label>
                            <Textarea
                              name="description_en"
                              value={form.description_en}
                              onChange={handleInput}
                              placeholder="Enter English description"
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">
                              {t("descriptionArabic")}
                            </Label>
                            <Textarea
                              name="description_ar"
                              value={form.description_ar}
                              onChange={handleInput}
                              placeholder={t("enterArabicDescriptionPlaceholder")}
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">
                              {t("descriptionHebrew")}
                            </Label>
                            <Textarea
                              name="description_he"
                              value={form.description_he}
                              onChange={handleInput}
                              placeholder="הכנס תיאור בעברית"
                              rows={3}
                            />
                          </div>
                        </div>
                      </div>

                      {/* تفاصيل العرض */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">{t("offerDetails")}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium">
                              {t("discountPercent")}{" "}
                              <span className="text-red-500">*</span>
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
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">{t("image")}</Label>
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
                      </div>

                      {/* التواريخ والحالة */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">{t("dateAndStatus")}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium">
                              {t("startDate")}
                            </Label>
                            <Input
                              name="start_date"
                              type="date"
                              value={form.start_date}
                              onChange={handleInput}
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">{t("endDate")}</Label>
                            <Input
                              name="end_date"
                              type="date"
                              value={form.end_date}
                              onChange={handleInput}
                            />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={form.active}
                            onCheckedChange={handleSwitchChange}
                          />
                          <Label className="text-sm font-medium">
                            {t("activeOffer")}
                          </Label>
                        </div>
                      </div>

                      <DialogFooter className="gap-2">
                        <DialogClose asChild>
                          <Button type="button" variant="outline">
                            {t("cancel")}
                          </Button>
                        </DialogClose>
                        <Button type="submit" className="bg-primary hover:bg-primary/90">
                          <Plus className="h-4 w-4 mr-2" />
                          {t("add")}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
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
              const currentTitle = offer.title_ar || offer.title_en;
              const currentDescription =
                offer.description_ar || offer.description_en;
              const isActive = offer.active;
              const isExpired =
                offer.end_date && new Date(offer.end_date) < new Date();

              return (
                <Card
                  key={offer.id}
                  className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
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
                      <img
                        loading="lazy"
                        src={offer.image_url}
                        alt={currentTitle}
                        className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
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

                  <CardContent className="pt-0">
                    {/* نسبة الخصم */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Percent className="h-4 w-4 text-primary" />
                        <span className="text-lg font-bold text-primary">
                          {offer.discount_percent}% {t("discount")}
                        </span>
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

                    {/* أزرار الإجراءات */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedOffer(offer);
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-1 text-primary text-center">
              {t("addOffer")}
            </DialogTitle>
            <DialogDescription>
              {t("addOfferDesc") || "أدخل بيانات العرض الجديد"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-6">
            {/* العناوين متعددة اللغات */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t("titles")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">
                    {t("titleEnglish")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="title_en"
                    value={form.title_en}
                    onChange={handleInput}
                    placeholder="Enter English title"
                    required
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    {t("titleArabic")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="title_ar"
                    value={form.title_ar}
                    onChange={handleInput}
                    placeholder={t("enterArabicTitlePlaceholder")}
                    required
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    {t("titleHebrew")}
                  </Label>
                  <Input
                    name="title_he"
                    value={form.title_he}
                    onChange={handleInput}
                    placeholder="הכנס כותרת בעברית"
                  />
                </div>
              </div>
            </div>

            {/* الأوصاف متعددة اللغات */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t("descriptions")}</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">
                    {t("descriptionEnglish")}
                  </Label>
                  <Textarea
                    name="description_en"
                    value={form.description_en}
                    onChange={handleInput}
                    placeholder="Enter English description"
                    rows={3}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    {t("descriptionArabic")}
                  </Label>
                  <Textarea
                    name="description_ar"
                    value={form.description_ar}
                    onChange={handleInput}
                    placeholder={t("enterArabicDescriptionPlaceholder")}
                    rows={3}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    {t("descriptionHebrew")}
                  </Label>
                  <Textarea
                    name="description_he"
                    value={form.description_he}
                    onChange={handleInput}
                    placeholder="הכנס תיאור בעברית"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* تفاصيل العرض */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t("offerDetails")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">
                    {t("discountPercent")}{" "}
                    <span className="text-red-500">*</span>
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
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">{t("image")}</Label>
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
            </div>

            {/* التواريخ والحالة */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t("dateAndStatus")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">
                    {t("startDate")}
                  </Label>
                  <Input
                    name="start_date"
                    type="date"
                    value={form.start_date}
                    onChange={handleInput}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">{t("endDate")}</Label>
                  <Input
                    name="end_date"
                    type="date"
                    value={form.end_date}
                    onChange={handleInput}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={form.active}
                  onCheckedChange={handleSwitchChange}
                />
                <Label className="text-sm font-medium">
                  {t("activeOffer")}
                </Label>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {t("cancel")}
                </Button>
              </DialogClose>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                {t("add")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* نافذة تعديل العرض */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-1 text-primary text-center">
              {t("editOffer")}
            </DialogTitle>
            <DialogDescription>
              {t("editOfferDesc") || "تعديل بيانات العرض"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-6">
            {/* العناوين متعددة اللغات */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t("titles")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">
                    {t("titleArabic")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="title_ar"
                    value={form.title_ar}
                    onChange={handleInput}
                    placeholder={t("enterArabicTitlePlaceholder")}
                    required
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    {t("titleEnglish")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="title_en"
                    value={form.title_en}
                    onChange={handleInput}
                    placeholder="Enter English title"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    {t("titleHebrew")}
                  </Label>
                  <Input
                    name="title_he"
                    value={form.title_he}
                    onChange={handleInput}
                    placeholder="הכנס כותרת בעברית"
                  />
                </div>
              </div>
            </div>

            {/* الأوصاف متعددة اللغات */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t("descriptions")}</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">
                    {t("descriptionArabic")}
                  </Label>
                  <Textarea
                    name="description_ar"
                    value={form.description_ar}
                    onChange={handleInput}
                    placeholder={t("enterArabicDescriptionPlaceholder")}
                    rows={1}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    {t("descriptionEnglish")}
                  </Label>
                  <Textarea
                    name="description_en"
                    value={form.description_en}
                    onChange={handleInput}
                    placeholder="Enter English description"
                    rows={2}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    {t("descriptionHebrew")}
                  </Label>
                  <Textarea
                    name="description_he"
                    value={form.description_he}
                    onChange={handleInput}
                    placeholder="הכנס תיאור בעברית"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* تفاصيل العرض */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t("offerDetails")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">
                    {t("discountPercent")}{" "}
                    <span className="text-red-500">*</span>
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
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">{t("image")}</Label>
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
            </div>

            {/* التواريخ والحالة */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t("dateAndStatus")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">
                    {t("startDate")}
                  </Label>
                  <Input
                    name="start_date"
                    type="date"
                    value={form.start_date}
                    onChange={handleInput}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">{t("endDate")}</Label>
                  <Input
                    name="end_date"
                    type="date"
                    value={form.end_date}
                    onChange={handleInput}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={form.active}
                  onCheckedChange={handleSwitchChange}
                />
                <Label className="text-sm font-medium">
                  {t("activeOffer")}
                </Label>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {t("cancel")}
                </Button>
              </DialogClose>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                <Edit className="h-4 w-4 mr-2" />
                {t("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* نافذة تأكيد الحذف */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-1 text-primary text-center">
              {t("deleteOffer")}
            </DialogTitle>
            <DialogDescription>
              {t("deleteOfferConfirmation")}
              {selectedOffer && (
                <span className="font-semibold">
                  "{selectedOffer.title_ar || selectedOffer.title_en}"
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t("cancel")}
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => selectedOffer && handleDelete(selectedOffer.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOffers;
