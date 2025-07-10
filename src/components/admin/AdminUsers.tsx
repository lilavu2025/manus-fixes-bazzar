import React, { useEffect, useState, useRef } from "react";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useLocation } from "react-router-dom";
import UserStatsCards from "./users/UserStatsCards";
import UserFilters from "./users/UserFilters";
import UsersTable from "./users/UsersTable";
import UserActivityLogTable from "./users/UserActivityLogTable";
import UserErrorDisplay from "./users/UserErrorDisplay";
import { useLanguage } from "@/utils/languageContextUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Activity, LoaderCircle, ChevronDown, ChevronUp } from "lucide-react";

const AdminUsers: React.FC = () => {
  const { isRTL, t } = useLanguage();
  const location = useLocation();
  const [showActivityLog, setShowActivityLog] = useState(false);
  const activityLogRef = useRef<HTMLDivElement>(null);

  const {
    users,
    allUsers,
    filteredUsers,
    isLoading,
    error,
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
    disableUser,
    deleteUser,
    refetch,
    // Pagination properties
    currentPage,
    totalCount,
    totalPages,
    pageSize,
    hasNextPage,
    hasPrevPage,
    goToFirstPage,
    goToPrevPage,
    goToNextPage,
    goToLastPage,
  } = useAdminUsers();

  const toggleActivityLog = () => {
    setShowActivityLog(!showActivityLog);
    if (!showActivityLog) {
      // Scroll to activity log after it's rendered
      setTimeout(() => {
        activityLogRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  };

  // Handle filter from dashboard navigation
  useEffect(() => {
    if (location.state?.filterType) {
      const filterType = location.state.filterType;
      // Map Arabic names to English for filtering
      const typeMapping: { [key: string]: string } = {
        مدير: "admin",
        جملة: "wholesale",
        تجزئة: "retail",
        admin: "admin",
        wholesale: "wholesale",
        retail: "retail",
        all: "all",
        new: "new",
      };
      const mappedType = typeMapping[filterType] || filterType;
      setUserTypeFilter(mappedType);
    }
  }, [location.state, setUserTypeFilter]);

  const handleSortOrderChange = (order: string) => {
    setSortOrder(order as "asc" | "desc");
  };

  if (isLoading) {
    return (
      <div className={`p-4 lg:p-6 ${isRTL ? "text-right" : "text-left"}`} dir={isRTL ? "rtl" : "ltr"}>
        <div className="space-y-6">
          {/* Header */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-blue-900">
                    {t("userManagement") || "إدارة المستخدمين"}
                  </CardTitle>
                  <p className="text-blue-600 mt-1">
                    {t("manageAndMonitorUsers") || "إدارة ومراقبة المستخدمين"}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Loading */}
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-12">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <LoaderCircle className="h-12 w-12 text-blue-600 animate-spin" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t("loadingUsers") || "جاري تحميل المستخدمين"}
                </h3>
                <p className="text-gray-500">
                  {t("pleaseWait") || "يرجى الانتظار..."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 lg:p-6 ${isRTL ? "text-right" : "text-left"}`} dir={isRTL ? "rtl" : "ltr"}>
        <div className="space-y-6">
          {/* Header */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-blue-900">
                    {t("userManagement") || "إدارة المستخدمين"}
                  </CardTitle>
                  <p className="text-blue-600 mt-1">
                    {t("manageAndMonitorUsers") || "إدارة ومراقبة المستخدمين"}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <UserErrorDisplay error={error} refetch={refetch} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 lg:p-6 ${isRTL ? "text-right" : "text-left"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl lg:text-2xl font-bold text-blue-900">
                    {t("userManagement") || "إدارة المستخدمين"}
                  </CardTitle>
                  <p className="text-blue-600 text-sm lg:text-base mt-1">
                    {t("manageAndMonitorUsers") || "إدارة ومراقبة المستخدمين"}
                  </p>
                </div>
              </div>
              
              {/* Controls Section - Mobile Responsive */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                {/* Users Count */}
                <div className="flex items-center justify-center gap-2 bg-white/70 rounded-lg px-3 py-2 text-sm">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-700">
                    {totalCount} {t("totalUsers") || "مستخدم"}
                  </span>
                </div>
                
                {/* Activity Log Button */}
                <Button
                  variant="outline"
                  onClick={toggleActivityLog}
                  className="flex items-center justify-center gap-2 bg-white/70 hover:bg-white/90 text-sm px-3 py-2"
                  size="sm"
                >
                  <Activity className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {showActivityLog
                      ? t("hideActivityLog") || "إخفاء السجل"
                      : t("showActivityLog") || "عرض سجل النشاط"}
                  </span>
                  <span className="sm:hidden">
                    {showActivityLog ? "إخفاء السجل" : "السجل"}
                  </span>
                  {showActivityLog ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Activity Log Section - Shows directly under header when toggled */}
        {showActivityLog && (
          <div 
            ref={activityLogRef}
            className="animate-fade-in"
          >
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 border-b border-green-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Activity className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-green-900">
                      {t("adminActivityLog") || "سجل نشاط الأدمن"}
                    </CardTitle>
                    <p className="text-green-600 text-sm mt-1">
                      {t("trackAdminActions") || "تتبع إجراءات المدراء على المستخدمين"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-1">
                <div className="min-h-[300px]">
                  <UserActivityLogTable />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Statistics Cards */}
        <UserStatsCards
          users={allUsers}
          onFilterByType={(type) => {
            setSearchQuery("");
            setUserTypeFilter("all");
            setStatusFilter("all");
            setSortBy("created_at");
            setSortOrder("desc");
            setTimeout(() => {
              setUserTypeFilter(type);
            }, 0);
          }}
        />

        {/* Filters */}
        <UserFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          userTypeFilter={userTypeFilter}
          setUserTypeFilter={setUserTypeFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={handleSortOrderChange}
        />

        {/* Users Table */}
        <UsersTable
          users={users}
          isLoading={isLoading}
          error={typeof error === "string" ? error : error?.message || ""}
          disableUser={disableUser}
          deleteUser={deleteUser}
          refetch={refetch}
          // Pagination props
          currentPage={currentPage}
          totalCount={totalCount}
          totalPages={totalPages}
          pageSize={pageSize}
          hasNextPage={hasNextPage}
          hasPrevPage={hasPrevPage}
          goToFirstPage={goToFirstPage}
          goToPrevPage={goToPrevPage}
          goToNextPage={goToNextPage}
          goToLastPage={goToLastPage}
        />
      </div>
    </div>
  );
};

export default AdminUsers;
