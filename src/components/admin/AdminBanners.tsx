import React, { useState, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  X,
  Search,
  Filter,
  Link2,
  Image as ImageIcon,
  Calendar,
  MoreHorizontal,
  Grid3X3,
  List,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useBannersQuery,
  useAddBanner,
  useUpdateBanner,
  useDeleteBanner,
  useToggleBannerActive,
} from "@/integrations/supabase/reactQueryHooks";
import { useLanguage } from "../../utils/languageContextUtils";
import AdminHeader from "./AdminHeader";
import { ClearableInput } from "@/components/ui/ClearableInput";
import type { Banner } from "@/integrations/supabase/dataFetchers";

// Helper function to get text in current language
const getLocalizedText = (
  item: any, 
  field: string, 
  currentLanguage: string
): string => {
  if (currentLanguage === "ar") {
    return item[`${field}_ar`] || item[`${field}_en`] || item[`${field}_he`] || "";
  } else if (currentLanguage === "he") {
    return item[`${field}_he`] || item[`${field}_ar`] || item[`${field}_en`] || "";
  } else {
    return item[`${field}_en`] || item[`${field}_ar`] || item[`${field}_he`] || "";
  }
};

// Status Badge Component
const StatusBadge = ({ 
  active, 
  onClick, 
  t 
}: { 
  active: boolean; 
  onClick?: () => void; 
  t: (key: string) => string;
}) => (
  <Badge 
    variant={active ? "default" : "secondary"}
    className={`cursor-pointer transition-all duration-200 ${
      active 
        ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200" 
        : "bg-red-100 text-red-800 hover:bg-red-200 border-red-200"
    }`}
    onClick={onClick}
  >
    {active ? (
      <>
        <Eye className="h-3 w-3 mr-1" />
        {t("active") || "نشط"}
      </>
    ) : (
      <>
        <EyeOff className="h-3 w-3 mr-1" />
        {t("inactive") || "غير نشط"}
      </>
    )}
  </Badge>
);

// Quick Stats Component
const QuickStats = ({ bannersData, t, currentLanguage }: { 
  bannersData: Banner[]; 
  t: (key: string) => string;
  currentLanguage: string;
}) => {
  const stats = useMemo(() => {
    const total = bannersData.length;
    const active = bannersData.filter(b => b.active).length;
    const withImages = bannersData.filter(b => b.image).length;
    const withLinks = bannersData.filter(b => b.link).length;
    
    return [
      { 
        label: t("totalBanners") || "إجمالي البانرات", 
        value: total, 
        icon: List, 
        color: "blue" 
      },
      { 
        label: t("activeBanners") || "النشطة", 
        value: active, 
        icon: Eye, 
        color: "green" 
      },
      { 
        label: t("bannersWithImages") || "بصور", 
        value: withImages, 
        icon: ImageIcon, 
        color: "purple" 
      },
      { 
        label: t("bannersWithLinks") || "بروابط", 
        value: withLinks, 
        icon: Link2, 
        color: "orange" 
      },
    ];
  }, [bannersData, t]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card key={index} className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 hover:shadow-xl transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-primary/10`}>
                <stat.icon className={`h-4 w-4 text-primary`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Banner Card Component
const BannerCard = ({ 
  banner, 
  onEdit, 
  onDelete, 
  onToggleActive,
  t,
  currentLanguage 
}: {
  banner: Banner;
  onEdit: (banner: Banner) => void;
  onDelete: (banner: Banner) => void;
  onToggleActive: (banner: Banner) => void;
  t: (key: string) => string;
  currentLanguage: string;
}) => {
  const bannerTitle = getLocalizedText(banner, "title", currentLanguage);
  const bannerSubtitle = getLocalizedText(banner, "subtitle", currentLanguage);

  return (
    <Card className="group hover:shadow-xl transition-all duration-200 border-0 shadow-lg bg-white overflow-hidden">
      <div className="relative">
        {banner.image ? (
          <div className="aspect-video bg-gray-100 overflow-hidden">
            <img
              src={banner.image}
              alt={bannerTitle || t("banner") || "البانر"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-gray-400" />
          </div>
        )}
        
        <div className="absolute top-3 right-3 flex space-x-2">
          <StatusBadge active={banner.active} onClick={() => onToggleActive(banner)} t={t} />
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-gray-900 line-clamp-2">
              {bannerTitle || t("untitledBanner") || "بانر بدون عنوان"}
            </h3>
            {/* Show other language titles as secondary */}
            {currentLanguage === "ar" && banner.title_en && banner.title_en !== banner.title_ar && (
              <p className="text-sm text-gray-600 mt-1">{banner.title_en}</p>
            )}
            {currentLanguage === "en" && banner.title_ar && banner.title_ar !== banner.title_en && (
              <p className="text-sm text-gray-600 mt-1" dir="rtl">{banner.title_ar}</p>
            )}
            {currentLanguage === "he" && banner.title_ar && banner.title_ar !== banner.title_he && (
              <p className="text-sm text-gray-600 mt-1" dir="rtl">{banner.title_ar}</p>
            )}
          </div>

          {bannerSubtitle && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {bannerSubtitle}
            </p>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex space-x-2">
              {banner.link && (
                <Badge variant="outline" className="text-xs">
                  <Link2 className="h-3 w-3 mr-1" />
                  {t("hasLink") || "له رابط"}
                </Badge>
              )}
              {banner.sort_order !== undefined && (
                <Badge variant="outline" className="text-xs">
                  #{banner.sort_order}
                </Badge>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEdit(banner)}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t("editBanner") || "تعديل البانر"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleActive(banner)}>
                  {banner.active ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      {t("deactivated") || "إلغاء التفعيل"}
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      {t("activate") || "تفعيل"}
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(banner)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("delete") || "حذف"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Banner Form Component
const BannerForm = ({ 
  banner, 
  onSave, 
  onCancel, 
  isLoading,
  t,
  currentLanguage 
}: {
  banner?: Banner;
  onSave: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
  t: (key: string) => string;
  currentLanguage: string;
}) => {
  const [formData, setFormData] = useState({
    title_en: banner?.title_en || "",
    title_ar: banner?.title_ar || "",
    title_he: banner?.title_he || "",
    subtitle_en: banner?.subtitle_en || "",
    subtitle_ar: banner?.subtitle_ar || "",
    subtitle_he: banner?.subtitle_he || "",
    link: banner?.link || "",
    image: banner?.image || "",
    active: banner?.active ?? true,
    sort_order: banner?.sort_order || 0,
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title_ar.trim() && !formData.title_en.trim() && !formData.title_he.trim()) {
      toast.error(t("titleRequired") || "العنوان مطلوب");
      return;
    }

    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2">
              {t("titleArabic") || "العنوان بالعربية"} *
            </Label>
            <Input
              type="text"
              value={formData.title_ar}
              onChange={(e) => handleInputChange("title_ar", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder={t("enterTitleArabic") || "أدخل عنوان البانر بالعربية"}
              dir="rtl"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2">
              {t("descriptionArabic") || "الوصف بالعربية"}
            </Label>
            <Textarea
              value={formData.subtitle_ar}
              onChange={(e) => handleInputChange("subtitle_ar", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
              placeholder={t("enterDescriptionArabic") || "أدخل وصف البانر بالعربية"}
              dir="rtl"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2">
              {t("titleEnglish") || "العنوان بالإنجليزية"}
            </Label>
            <Input
              type="text"
              value={formData.title_en}
              onChange={(e) => handleInputChange("title_en", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter banner title in English"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2">
              {t("descriptionEnglish") || "الوصف بالإنجليزية"}
            </Label>
            <Textarea
              value={formData.subtitle_en}
              onChange={(e) => handleInputChange("subtitle_en", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
              placeholder="Enter banner description in English"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2">
              {t("titleHebrew") || "العنوان بالعبرية"}
            </Label>
            <Input
              type="text"
              value={formData.title_he}
              onChange={(e) => handleInputChange("title_he", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="הכנס כותרת באנר בעברית"
              dir="rtl"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2">
              {t("descriptionHebrew") || "الوصف بالعبرية"}
            </Label>
            <Textarea
              value={formData.subtitle_he}
              onChange={(e) => handleInputChange("subtitle_he", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
              placeholder="הכנס תיאור באנר בעברית"
              dir="rtl"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2">
            {t("bannerLink") || "رابط البانر"}
          </Label>
          <Input
            type="url"
            value={formData.link}
            onChange={(e) => handleInputChange("link", e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="https://example.com"
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2">
            {t("sortOrder") || "ترتيب العرض"}
          </Label>
          <Input
            type="number"
            value={formData.sort_order}
            onChange={(e) => handleInputChange("sort_order", parseInt(e.target.value) || 0)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            min="0"
          />
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2">
          {t("bannerImage") || "صورة البانر"}
        </Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          {formData.image ? (
            <div className="space-y-4">
              <img
                src={formData.image}
                alt={t("bannerPreview") || "معاينة البانر"}
                className="max-h-48 mx-auto rounded-lg shadow-sm"
              />
              <div className="flex justify-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleInputChange("image", "")}
                >
                  <X className="h-4 w-4 mr-1" />
                  {t("remove") || "إزالة"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-12 w-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-gray-600">{t("clickToUpload") || "اضغط لرفع صورة"}</p>
                <p className="text-sm text-gray-500">{t("imageFormat") || "PNG, JPG, GIF حتى 10 ميجا"}</p>
              </div>
              <Input
                type="url"
                value={formData.image}
                onChange={(e) => handleInputChange("image", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder={t("pasteImageUrl") || "أو الصق رابط الصورة"}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
        <Switch
          checked={formData.active}
          onCheckedChange={(checked) => handleInputChange("active", checked)}
        />
        <div>
          <p className="font-medium text-gray-900">{t("activeBanner") || "البانر نشط"}</p>
          <p className="text-sm text-gray-600">
            {formData.active 
              ? (t("bannerVisible") || "البانر مرئي للمستخدمين")
              : (t("bannerHidden") || "البانر مخفي عن المستخدمين")
            }
          </p>
        </div>
      </div>

      <DialogFooter className="flex justify-end space-x-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          {t("cancel") || "إلغاء"}
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90"
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              {t("saving") || "جاري الحفظ..."}
            </>
          ) : (
            <>
              {banner ? (t("updateBanner") || "تحديث البانر") : (t("createBanner") || "إنشاء البانر")}
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

// Main AdminBanners Component
const AdminBanners: React.FC = () => {
  const { t, isRTL, language: currentLanguage } = useLanguage();
  
  // State management
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"created_at" | "title" | "sort_order">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Queries and mutations
  const { 
    data: bannersData = [], 
    isLoading, 
    error, 
    refetch 
  } = useBannersQuery();
  
  const addBannerMutation = useAddBanner();
  const updateBannerMutation = useUpdateBanner();
  const deleteBannerMutation = useDeleteBanner();
  const toggleActiveMutation = useToggleBannerActive();

  // Computed values
  const filteredAndSortedBanners = useMemo(() => {
    let filtered = bannersData.filter((banner) => {
      // Search filter
      const searchMatch = !searchQuery || 
        banner.title_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        banner.title_ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        banner.title_he?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        banner.subtitle_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        banner.subtitle_ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        banner.subtitle_he?.toLowerCase().includes(searchQuery.toLowerCase());

      // Active filter
      const activeMatch = filterActive === "all" || 
        (filterActive === "active" && banner.active) ||
        (filterActive === "inactive" && !banner.active);

      return searchMatch && activeMatch;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case "title":
          aValue = a.title_ar || a.title_en || "";
          bValue = b.title_ar || b.title_en || "";
          break;
        case "sort_order":
          aValue = a.sort_order || 0;
          bValue = b.sort_order || 0;
          break;
        case "created_at":
        default:
          aValue = new Date(a.created_at || "");
          bValue = new Date(b.created_at || "");
          break;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [bannersData, searchQuery, sortBy, sortOrder, filterActive]);

  // Event handlers
  const handleAddBanner = async (data: any) => {
    try {
      await addBannerMutation.mutateAsync(data);
      toast.success(t("bannerCreatedSuccessfully") || "تم إنشاء البانر بنجاح!");
      setShowAddModal(false);
      refetch();
    } catch (error) {
      toast.error(t("failedToCreateBanner") || "فشل في إنشاء البانر");
      console.error("Error creating banner:", error);
    }
  };

  const handleEditBanner = async (data: any) => {
    if (!selectedBanner) return;
    
    try {
      await updateBannerMutation.mutateAsync({
        id: selectedBanner.id,
        bannerData: data,
      });
      toast.success(t("bannerUpdatedSuccessfully") || "تم تحديث البانر بنجاح!");
      setShowEditModal(false);
      setSelectedBanner(null);
      refetch();
    } catch (error) {
      toast.error(t("failedToUpdateBanner") || "فشل في تحديث البانر");
      console.error("Error updating banner:", error);
    }
  };

  const handleDeleteBanner = async (banner: Banner) => {
    setSelectedBanner(banner);
    setShowDeleteDialog(true);
  };

  const confirmDeleteBanner = async () => {
    if (!selectedBanner) return;
    
    try {
      await deleteBannerMutation.mutateAsync(selectedBanner.id);
      toast.success(t("bannerDeletedSuccessfully") || "تم حذف البانر بنجاح!");
      setShowDeleteDialog(false);
      setSelectedBanner(null);
      refetch();
    } catch (error) {
      toast.error(t("failedToDeleteBanner") || "فشل في حذف البانر");
      console.error("Error deleting banner:", error);
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      await updateBannerMutation.mutateAsync({
        id: banner.id,
        bannerData: { active: !banner.active },
      });
      const statusText = !banner.active ? t("activated") || "تفعيل" : t("deactivated") || "إلغاء تفعيل";
      toast.success(`${t("bannerStatusUpdated") || "تم"} ${statusText} ${t("successfully") || "البانر بنجاح!"}`);
      refetch();
    } catch (error) {
      toast.error(t("failedToUpdateBannerStatus") || "فشل في تحديث حالة البانر");
      console.error("Error toggling banner active status:", error);
    }
  };

  const openEditModal = (banner: Banner) => {
    setSelectedBanner(banner);
    setShowEditModal(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600">{t("loadingBanners") || "جاري تحميل البانرات..."}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-red-800 mb-2">{t("errorLoadingBanners") || "خطأ في تحميل البانرات"}</h3>
          <p className="text-red-600 mb-4">{t("failedToLoadBanners") || "فشل في تحميل البانرات. يرجى المحاولة مرة أخرى."}</p>
          <Button onClick={() => refetch()} variant="outline">
            {t("retry") || "إعادة المحاولة"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isRTL ? "rtl" : "ltr"}`}>
      <AdminHeader 
        title={t("bannerManagement") || "إدارة البانرات"}
        count={bannersData.length}
        addLabel={t("addBanner") || "إضافة بانر"}
        onAdd={() => setShowAddModal(true)}
      />

      <QuickStats bannersData={bannersData} t={t} currentLanguage={currentLanguage} />

      {/* Controls */}
      <Card className="shadow-lg border-0">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <ClearableInput
                  placeholder={t("searchBanners") || "البحث في البانرات..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClear={() => setSearchQuery("")}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={filterActive}
                  onChange={(e) => setFilterActive(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">{t("allStatuses") || "جميع الحالات"}</option>
                  <option value="active">{t("activeOnly") || "النشط فقط"}</option>
                  <option value="inactive">{t("inactiveOnly") || "غير النشط فقط"}</option>
                </select>

                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split("-");
                    setSortBy(field as any);
                    setSortOrder(order as any);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="created_at-desc">{t("newestFirst") || "الأحدث أولاً"}</option>
                  <option value="created_at-asc">{t("oldestFirst") || "الأقدم أولاً"}</option>
                  <option value="title-asc">{t("titleAZ") || "العنوان أ-ي"}</option>
                  <option value="title-desc">{t("titleZA") || "العنوان ي-أ"}</option>
                  <option value="sort_order-asc">{t("sortOrderAsc") || "الترتيب ↑"}</option>
                  <option value="sort_order-desc">{t("sortOrderDesc") || "الترتيب ↓"}</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="rounded"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {filteredAndSortedBanners.length > 0 && (
            <div className="text-sm text-gray-600">
              {t("showing") || "عرض"} {filteredAndSortedBanners.length} {t("of") || "من"} {bannersData.length} {t("banners") || "بانر"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content */}
      {filteredAndSortedBanners.length === 0 ? (
        <div className="text-center py-12">
          <Card className="shadow-lg border-0 p-8 max-w-md mx-auto">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery || filterActive !== "all" ? t("noBannersFound") || "لا توجد بانرات" : t("noBanners") || "لا توجد بانرات بعد"}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || filterActive !== "all" 
                ? t("tryModifyingSearchOrFilters") || "جرب تعديل البحث أو المرشحات" 
                : t("startByCreatingFirstBanner") || "ابدأ بإنشاء أول بانر"
              }
            </p>
            {!searchQuery && filterActive === "all" && (
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("createFirstBanner") || "إنشاء أول بانر"}
              </Button>
            )}
          </Card>
        </div>
      ) : (
        <div className={viewMode === "grid" 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "space-y-4"
        }>
          {filteredAndSortedBanners.map((banner) => (
            <BannerCard
              key={banner.id}
              banner={banner}
              onEdit={openEditModal}
              onDelete={handleDeleteBanner}
              onToggleActive={handleToggleActive}
              t={t}
              currentLanguage={currentLanguage}
            />
          ))}
        </div>
      )}

      {/* Add Banner Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-1 text-primary text-center">{t("addNewBanner") || "إضافة بانر جديد"}</DialogTitle>
          </DialogHeader>
          <BannerForm
            onSave={handleAddBanner}
            onCancel={() => setShowAddModal(false)}
            isLoading={addBannerMutation.isPending}
            t={t}
            currentLanguage={currentLanguage}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Banner Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-1 text-primary text-center">{t("editBanner") || "تعديل البانر"}</DialogTitle>
          </DialogHeader>
          {selectedBanner && (
            <BannerForm
              banner={selectedBanner}
              onSave={handleEditBanner}
              onCancel={() => {
                setShowEditModal(false);
                setSelectedBanner(null);
              }}
              isLoading={updateBannerMutation.isPending}
              t={t}
              currentLanguage={currentLanguage}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              {t("confirmDelete") || "تأكيد الحذف"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              {t("deleteConfirmationMessage") || "هل أنت متأكد من أنك تريد حذف هذا البانر؟ هذا الإجراء لا يمكن التراجع عنه."}
            </p>
            {selectedBanner && (
              <p className="mt-2 font-semibold">
                "{getLocalizedText(selectedBanner, "title", currentLanguage) || selectedBanner.title_ar || selectedBanner.title_en}"
              </p>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteBannerMutation.isPending}
            >
              {t("cancel") || "إلغاء"}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteBanner}
              disabled={deleteBannerMutation.isPending}
            >
              {deleteBannerMutation.isPending ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {t("deleting") || "جاري الحذف..."}
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("deleteConfirm") || "حذف نهائياً"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBanners;
