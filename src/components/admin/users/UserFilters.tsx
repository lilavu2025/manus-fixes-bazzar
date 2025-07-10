import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ClearableInput } from "@/components/ui/ClearableInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  ArrowUpDown, 
  RotateCcw, 
  Filter,
  Users,
  UserCheck,
  Shield,
  TrendingUp
} from "lucide-react";
import { useLanguage } from "@/utils/languageContextUtils";

interface UserFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  userTypeFilter: string;
  setUserTypeFilter: (type: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  sortOrder: string;
  setSortOrder: (order: string) => void;
}

const UserFilters: React.FC<UserFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  userTypeFilter,
  setUserTypeFilter,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
}) => {
  const { isRTL, t } = useLanguage();

  // إعادة تعيين الفلاتر
  const resetFilters = () => {
    setSearchQuery("");
    setUserTypeFilter("all");
    setStatusFilter("all");
    setSortBy("created_at");
    setSortOrder("desc");
  };

  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Filter className="h-5 w-5 text-gray-600" />
          </div>
          <CardTitle className="text-lg text-gray-900">
            {t("userFilters") || "فلاتر المستخدمين"}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* البحث */}
          <div className="space-y-2">
            <Label htmlFor="userSearch" className="text-sm font-medium text-gray-700">
              <Search className="h-4 w-4 inline mr-2" />
              {t("search") || "بحث"}
            </Label>
            <div className="relative">
              <ClearableInput
                id="userSearch"
                type="text"
                placeholder={t("searchUsersPlaceholder") || "البحث في المستخدمين"}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery("")}
                className="w-full"
                maxLength={60}
              />
            </div>
          </div>

          {/* نوع المستخدم */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              <Users className="h-4 w-4 inline mr-2" />
              {t("userType") || "نوع المستخدم"}
            </Label>
            <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("selectUserType") || "اختر نوع المستخدم"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {t("allTypes") || "جميع الأنواع"}
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {t("admin") || "مدير"}
                  </div>
                </SelectItem>
                <SelectItem value="wholesale">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {t("wholesale") || "جملة"}
                  </div>
                </SelectItem>
                <SelectItem value="retail">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    {t("retail") || "تجزئة"}
                  </div>
                </SelectItem>
                <SelectItem value="new">{t("newUsersReport") || "مستخدمين جدد"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* حالة التأكيد */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              <UserCheck className="h-4 w-4 inline mr-2" />
              {t("confirmationStatus") || "حالة التأكيد"}
            </Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("selectStatus") || "اختر الحالة"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allStatuses") || "جميع الحالات"}</SelectItem>
                <SelectItem value="confirmed">{t("confirmed") || "مؤكد"}</SelectItem>
                <SelectItem value="unconfirmed">{t("unconfirmed") || "غير مؤكد"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* الترتيب */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              <ArrowUpDown className="h-4 w-4 inline mr-2" />
              {t("sortBy") || "ترتيب حسب"}
            </Label>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={t("selectSort") || "اختر الترتيب"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">{t("registrationDate") || "تاريخ التسجيل"}</SelectItem>
                  <SelectItem value="last_order_date">{t("lastOrder") || "آخر طلب"}</SelectItem>
                  <SelectItem value="highest_order_value">{t("highestOrder") || "أعلى طلب"}</SelectItem>
                  <SelectItem value="full_name">{t("name") || "الاسم"}</SelectItem>
                  <SelectItem value="email">{t("email") || "البريد"}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">{t("desc") || "↓"}</SelectItem>
                  <SelectItem value="asc">{t("asc") || "↑"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* أزرار التحكم */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {t("filterResults") || "نتائج الفلترة"}
          </div>
          <Button
            variant="outline"
            onClick={resetFilters}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {t("resetFilters") || "إعادة تعيين الفلاتر"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserFilters;
