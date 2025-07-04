import React, { useEffect } from "react";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useLocation } from "react-router-dom";
import AdminUsersHeader from "./users/AdminUsersHeader";
import UserStatsCards from "./users/UserStatsCards";
import UserFilters from "./users/UserFilters";
import UsersTable from "./users/UsersTable";
import UserErrorDisplay from "./users/UserErrorDisplay";
import { useLanguage } from "@/utils/languageContextUtils";
import { XCircle } from "lucide-react";

const AdminUsers: React.FC = () => {
  const { isRTL } = useLanguage();
  const location = useLocation();

  const {
    users,
    allUsers,
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
    refetch, // إضافة refetch
  } = useAdminUsers();

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
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">لوحة المستخدمين</h1>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto border-primary"></div>
          <p className="mt-4 text-gray-600">جاري تحميل المستخدمين...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">لوحة المستخدمين</h1>
        <UserErrorDisplay error={error} refetch={refetch} />
      </div>
    );
  }

  return (
    <div
      className={`p-4 lg:p-6 ${isRTL ? "text-right" : "text-left"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <AdminUsersHeader />

      <div className="space-y-6">
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

        <UsersTable
          users={users}
          isLoading={isLoading}
          error={typeof error === "string" ? error : error?.message || ""}
          disableUser={disableUser}
          deleteUser={deleteUser}
          refetch={refetch}
        />
      </div>
    </div>
  );
};

export default AdminUsers;
