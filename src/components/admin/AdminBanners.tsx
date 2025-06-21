import React, { useState, ReactNode } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  X,
  Trash,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useBannersQuery,
  useAddBanner,
  useUpdateBanner,
  useDeleteBanner,
  useToggleBannerActive,
  useUploadBannerImage,
} from "@/integrations/supabase/reactQueryHooks";
import { useLanguage } from "../../utils/languageContextUtils";
// إزالة تعريف Banner المحلي واستخدام Banner من dataFetchers
import type { Banner } from "@/integrations/supabase/dataFetchers";

// تعريف واجهة بيانات النموذج (BannerFormData) لإدارة حالة النموذج
interface BannerFormData {
  title_ar: string;
  title_en: string;
  title_he: string;
  subtitle_ar: string;
  subtitle_en: string;
  subtitle_he: string;
  image: File | null;
  imageUrl: string;
  link: string;
  sort_order: number;
  active: boolean;
}

const AdminBanners: React.FC = () => {
  // استخدام الترجمة من الكونتكست
  const { t } = useLanguage();

  // تعريف الحالات الرئيسية للصفحة
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState<BannerFormData>({
    title_ar: "",
    title_en: "",
    title_he: "",
    subtitle_ar: "",
    subtitle_en: "",
    subtitle_he: "",
    image: null,
    imageUrl: "",
    link: "",
    sort_order: 0,
    active: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // استخدام hooks الجديدة
  const {
    data: bannersData = [],
    isLoading: loadingBanners,
    error: bannersError,
    refetch,
  } = useBannersQuery();
  const addBannerMutation = useAddBanner();
  const updateBannerMutation = useUpdateBanner();
  const deleteBannerMutation = useDeleteBanner();
  const toggleBannerActiveMutation = useToggleBannerActive();
  const uploadBannerImageMutation = useUploadBannerImage();

  // إعادة تعيين النموذج وإغلاقه
  const resetForm = () => {
    console.log("إعادة تعيين النموذج");
    setFormData({
      title_ar: "",
      title_en: "",
      title_he: "",
      subtitle_ar: "",
      subtitle_en: "",
      subtitle_he: "",
      image: null,
      imageUrl: "",
      link: "",
      sort_order: 0,
      active: true,
    });
    setEditingBanner(null);
    setShowForm(false);
  };

  // عند الضغط على زر التعديل، تعبئة النموذج ببيانات البانر المحدد
  const handleEdit = (banner: Banner) => {
    console.log("تعديل البانر:", banner);
    setEditingBanner(banner);
    setFormData({
      title_ar: banner.title_ar,
      title_en: banner.title_en,
      title_he: banner.title_he,
      subtitle_ar: banner.subtitle_ar || "",
      subtitle_en: banner.subtitle_en || "",
      subtitle_he: banner.subtitle_he || "",
      image: null,
      imageUrl: banner.image,
      link: banner.link || "",
      sort_order: banner.sort_order,
      active: banner.active,
    });
    setShowForm(true);
  };

  // عند تغيير صورة البانر في النموذج
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("تم اختيار صورة:", file.name);
      setFormData((prev) => ({ ...prev, image: file }));
    }
  };

  // handleSubmit الجديد:
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // التحقق من العناوين
    if (!formData.title_ar || !formData.title_en || !formData.title_he) {
      toast.error(t("pleaseEnterAllTitles"));
      return;
    }
    // التحقق من وجود صورة عند الإضافة
    if (!editingBanner && !formData.image) {
      toast.error(t("pleaseSelectImage"));
      return;
    }
    setSubmitting(true);
    try {
      let imageUrl = formData.imageUrl;
      // رفع الصورة إذا تم اختيار صورة جديدة
      if (formData.image) {
        imageUrl = await uploadBannerImageMutation.mutateAsync(formData.image);
      }
      // تجهيز بيانات البانر للإرسال
      const bannerData = {
        title_ar: formData.title_ar,
        title_en: formData.title_en,
        title_he: formData.title_he,
        subtitle_ar: formData.subtitle_ar || null,
        subtitle_en: formData.subtitle_en || null,
        subtitle_he: formData.subtitle_he || null,
        image: imageUrl,
        link: formData.link || null,
        sort_order: formData.sort_order,
        active: formData.active,
      };
      if (editingBanner) {
        // تعديل بانر موجود
        console.log("تعديل بانر:", editingBanner.id, bannerData);
        await updateBannerMutation.mutateAsync({
          id: editingBanner.id,
          bannerData,
        });
        toast.success(t("bannerUpdatedSuccessfully"));
      } else {
        // إضافة بانر جديد
        console.log("إضافة بانر جديد:", bannerData);
        await addBannerMutation.mutateAsync(bannerData);
        toast.success(t("bannerAddedSuccessfully"));
      }
      resetForm();
      refetch();
    } catch (error) {
      console.error("خطأ أثناء حفظ البانر:", error);
      toast.error(
        editingBanner ? t("errorUpdatingBanner") : t("errorAddingBanner"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  // handleDelete الجديد:
  const handleDelete = async (id: string) => {
    try {
      await deleteBannerMutation.mutateAsync(id);
      toast.success(t("bannerDeletedSuccessfully"));
      refetch();
    } catch (error) {
      console.error("خطأ أثناء حذف البانر:", error);
      toast.error(t("errorDeletingBanner"));
    }
  };

  // toggleActive الجديد:
  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await toggleBannerActiveMutation.mutateAsync({ id, currentStatus });
      toast.success(t("bannerStatusUpdated"));
      refetch();
    } catch (error) {
      console.error("خطأ أثناء تحديث حالة البانر:", error);
      toast.error(t("errorUpdatingBannerStatus"));
    }
  };

  // عرض مؤشر التحميل إذا كانت البيانات قيد التحميل
  if (loadingBanners) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{t("manageBanners")}</h1>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto animate-spin rounded-full border-primary"></div>
          <p className="mt-4 text-gray-600">{t("loadingBanners")}</p>
        </div>
      </div>
    );
  }

  if (bannersError) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-center">
          <div className="flex flex-col items-center mb-4">
            <X className="h-16 w-16 text-red-300 mb-2" />
            <h3 className="text-lg font-medium text-red-900 mb-2">
              {t("errorLoadingBanners") || "خطأ في تحميل البانرات"}
            </h3>
            <p className="text-red-600 mb-4">{bannersError.message}</p>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              refetch();
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            {t("retry") || "إعادة المحاولة"}
          </button>
        </div>
      </div>
    );
  }

  // واجهة الصفحة الرئيسية
  return (
    <div className="space-y-6">
      {/* رأس الصفحة وزر إضافة بانر */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("manageBanners")}
          </h1>
          <p className="text-gray-600">{t("manageBannersDescription")}</p>
        </div>
        <button
          onClick={() => {
            console.log("فتح نموذج إضافة بانر جديد");
            setShowForm(true);
          }}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t("addBanner")}
        </button>
      </div>

      {/* نموذج إضافة/تعديل بانر */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingBanner ? t("editBanner") : t("addNewBanner")}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* عناوين البانر باللغات الثلاث */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("title")} ({t("arabic")})
                  </label>
                  <input
                    type="text"
                    value={formData.title_ar}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title_ar: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t("enterTitleArabic")}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("title")} ({t("english")})
                  </label>
                  <input
                    type="text"
                    value={formData.title_en}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title_en: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t("enterTitleEnglish")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("title")} ({t("hebrew")})
                  </label>
                  <input
                    type="text"
                    value={formData.title_he}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title_he: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t("enterTitleHebrew")}
                  />
                </div>
              </div>

              {/* العناوين الفرعية (اختياري) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("subtitleArabic")} ({t("optional")})
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle_ar}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        subtitle_ar: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t("enterSubtitleArabic")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("subtitleEnglish")} ({t("optional")})
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle_en}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        subtitle_en: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t("enterSubtitleEnglish")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("subtitleHebrew")} ({t("optional")})
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle_he}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        subtitle_he: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t("enterSubtitleHebrew")}
                  />
                </div>
              </div>

              {/* رفع صورة البانر */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("bannerImage")}
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="banner-image"
                  />
                  <label
                    htmlFor="banner-image"
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 cursor-pointer flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {formData.image ? t("changeImage") : t("selectImage")}
                  </label>
                  {(formData.imageUrl || formData.image) && (
                    <span className="text-sm text-green-600">
                      {formData.image ? formData.image.name : t("currentImage")}
                    </span>
                  )}
                </div>
                {formData.imageUrl && (
                  <img
                    src={formData.imageUrl}
                    alt="Banner preview"
                    className="mt-2 h-20 w-32 object-cover rounded-md"
                  />
                )}
              </div>

              {/* رابط البانر وترتيبه */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("bannerLink")} ({t("optional")})
                  </label>
                  <input
                    type="url"
                    value={formData.link}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, link: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t("enterBannerLink")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("sortOrder")}
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sort_order: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t("enterSortOrder")}
                    min="0"
                  />
                </div>
              </div>

              {/* حالة البانر (فعال/غير فعال) */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      active: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="active"
                  className="ml-2 block text-sm text-gray-900"
                >
                  {t("activeBanner")}
                </label>
              </div>

              {/* أزرار الإرسال والإلغاء */}
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary hover:bg-primary/90 px-4 py-2 text-white rounded-md disabled:opacity-50"
                >
                  {submitting
                    ? editingBanner
                      ? t("updating")
                      : t("adding")
                    : editingBanner
                      ? t("updateBanner")
                      : t("addBanner")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* جدول عرض البانرات */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {bannersData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">{t("noBannersFound")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("image")}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("title")}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("sortOrder")}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("status")}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bannersData.map((banner) => (
                  <tr key={banner.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img
                        src={banner.image}
                        alt={banner.title_en}
                        className="h-16 w-24 object-cover rounded-md"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {banner.title_en}
                      </div>
                      <div className="text-sm text-gray-500">
                        {banner.title_ar}
                      </div>
                      <div className="text-sm text-gray-500">
                        {banner.title_he}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {banner.sort_order}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleActive(banner.id, banner.active)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          banner.active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {banner.active ? (
                          <>
                            <Eye className="h-3 w-3" /> {t("active")}
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3" /> {t("inactive")}
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(banner)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              title={t("delete")}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {t("deleteCategory")}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("deleteCategoryConfirmation")} "
                                {banner.title_ar}"?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                {t("cancel")}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(banner.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {t("delete")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBanners;

// -----------------------------
// شرح الصفحة بالعربي:
// -----------------------------
// هذه الصفحة مخصصة لإدارة البانرات في لوحة تحكم الأدمن.
// - يمكنك من خلالها إضافة بانر جديد أو تعديل أو حذف بانر موجود.
// - كل بانر يحتوي على عنوان بثلاث لغات، وصورة، ورابط اختياري، وترتيب، وحالة تفعيل.
// - عند إضافة أو تعديل بانر، يتم رفع الصورة إلى التخزين السحابي (Supabase Storage).
// - يتم جلب البانرات من قاعدة البيانات وعرضها في جدول مع إمكانية التفعيل/التعطيل والتعديل والحذف.
// - تم إضافة console.log في جميع العمليات المهمة لتسهيل تتبع الأخطاء أثناء التطوير.
// - جميع الدوال الرئيسية مشروحة بالتعليقات داخل الكود.
// - تم استخدام مكتبة sonner لعرض رسائل النجاح أو الخطأ.
// - تم استخدام الترجمة من الكونتكست لدعم تعدد اللغات في الصفحة.
