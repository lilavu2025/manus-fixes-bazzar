import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ClearableInput } from "@/components/ui/ClearableInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ArrowUpDown, XCircle } from "lucide-react";
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

  return (
    <Card className="shadow-lg border-0 mt-1">
      <CardContent className="p-2 sm:p-3 lg:p-4">
        <div className="flex flex-col gap-2 lg:gap-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
            {/* بحث المستخدمين */}
            <div className="w-full sm:w-64 flex-shrink-0">
              <div className="relative">
                <ClearableInput
                  type="text"
                  className={`border-2 border-gray-200 rounded-lg py-2 h-10 text-xs sm:text-sm w-full bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-300 transition-colors placeholder:text-gray-400 ${
                    isRTL ? "pr-8 pl-3" : "pl-8 pr-3"
                  }`}
                  placeholder={t("searchUsersPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClear={() => setSearchQuery("")}
                  maxLength={60}
                />
              </div>
            </div>
            {/* نوع المستخدم */}
            <div className="w-full sm:w-40 flex-shrink-0">
              <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                <SelectTrigger className="w-full border-2 border-gray-200 rounded-lg h-10 text-xs sm:text-sm bg-blue-50 focus:border-blue-500">
                  <SelectValue placeholder={t("userType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allTypes")}</SelectItem>
                  <SelectItem value="admin">{t("admin")}</SelectItem>
                  <SelectItem value="wholesale">{t("wholesale")}</SelectItem>
                  <SelectItem value="retail">{t("retail")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* حالة التفعيل */}
            <div className="w-full sm:w-40 flex-shrink-0">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full border-2 border-gray-200 rounded-lg h-10 text-xs sm:text-sm bg-yellow-50 focus:border-yellow-500">
                  <SelectValue placeholder={t("confirmationStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allStatuses")}</SelectItem>
                  <SelectItem value="confirmed">{t("confirmed")}</SelectItem>
                  <SelectItem value="unconfirmed">{t("unconfirmed")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* فرز حسب */}
            <div className="w-full sm:w-40 flex-shrink-0">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full border-2 border-gray-200 rounded-lg h-10 text-xs sm:text-sm bg-blue-50 focus:border-blue-500">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t("sortBy")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">
                    {t("registrationDate")}
                  </SelectItem>
                  <SelectItem value="last_order_date">
                    {t("lastOrder")}
                  </SelectItem>
                  <SelectItem value="highest_order_value">
                    {t("highestOrder")}
                  </SelectItem>
                  <SelectItem value="full_name">{t("name")}</SelectItem>
                  <SelectItem value="email">{t("email")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* ترتيب الفرز */}
            <div className="w-full sm:w-32 flex-shrink-0">
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-full border-2 border-gray-200 rounded-lg h-10 text-xs sm:text-sm bg-gray-50 focus:border-blue-500">
                  <SelectValue placeholder={t("sortOrder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">{t("descending")}</SelectItem>
                  <SelectItem value="asc">{t("ascending")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* زر تصفير الفلاتر */}
            <div className="w-full sm:w-auto flex flex-row gap-2 mt-2 sm:mt-0">
              <button
                type="button"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 font-bold shadow border border-red-200 hover:bg-red-100 transition-all duration-200 h-10 text-xs sm:text-sm"
                onClick={() => {
                  setSearchQuery("");
                  setUserTypeFilter("all");
                  setStatusFilter("all");
                  setSortBy("created_at");
                  setSortOrder("desc");
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
  );
};

export default UserFilters;
