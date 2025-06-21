import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ArrowUpDown } from "lucide-react";
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
    <Card className="shadow-lg border-0">
      <CardContent className="p-4 lg:p-6">
        {/* شريط الفلاتر */}
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search
                className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 ${isRTL ? "right-3" : "left-3"}`}
              />
              <Input
                placeholder={t("searchUsersPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"} h-10 lg:h-11 border-2 border-gray-200 focus:border-blue-500 transition-colors text-sm lg:text-base`}
              />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            {/* User Type Filter */}
            <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
              <SelectTrigger className="w-full lg:w-48 h-10 lg:h-11 border-2 border-gray-200 text-sm lg:text-base">
                <SelectValue placeholder={t("userType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allTypes")}</SelectItem>
                <SelectItem value="admin">{t("admin")}</SelectItem>
                <SelectItem value="wholesale">{t("wholesale")}</SelectItem>
                <SelectItem value="retail">{t("retail")}</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48 h-10 lg:h-11 border-2 border-gray-200 text-sm lg:text-base">
                <SelectValue placeholder={t("confirmationStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allStatuses")}</SelectItem>
                <SelectItem value="confirmed">{t("confirmed")}</SelectItem>
                <SelectItem value="unconfirmed">{t("unconfirmed")}</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-48 h-10 lg:h-11 border-2 border-gray-200 text-sm lg:text-base">
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

            {/* Sort Order */}
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-full lg:w-32 h-10 lg:h-11 border-2 border-gray-200 text-sm lg:text-base">
                <SelectValue placeholder={t("sortOrder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">{t("descending")}</SelectItem>
                <SelectItem value="asc">{t("ascending")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserFilters;
