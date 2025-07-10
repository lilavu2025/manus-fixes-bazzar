import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Download, LoaderCircle, AlertCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useLanguage } from "@/utils/languageContextUtils";
import UserTableRow from "./UserTableRow";
import type { UserProfile } from "@/types/profile";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface UsersTableProps {
  users: UserProfile[];
  isLoading: boolean;
  error?: string | null;
  disableUser: (userId: string, disabled: boolean) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  refetch?: () => void;
  // Pagination props
  currentPage?: number;
  totalCount?: number;
  totalPages?: number;
  pageSize?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  goToFirstPage?: () => void;
  goToPrevPage?: () => void;
  goToNextPage?: () => void;
  goToLastPage?: () => void;
}

const UsersTable: React.FC<UsersTableProps> = ({
  users,
  isLoading,
  error,
  disableUser,
  deleteUser,
  refetch,
  // Pagination props
  currentPage = 1,
  totalCount = 0,
  totalPages = 1,
  pageSize = 10,
  hasNextPage = false,
  hasPrevPage = false,
  goToFirstPage,
  goToPrevPage,
  goToNextPage,
  goToLastPage,
}) => {
  const { t } = useLanguage();

  // زر ودالة تصدير المستخدمين
  const exportUsersToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      users.map((u) => ({
        ID: u.id,
        Name: u.full_name,
        Email: u.email,
        Phone: u.phone,
        Type: u.user_type,
        Status: u.disabled ? "معطل" : "نشط",
        Created: u.created_at,
        LastSignIn: u.last_sign_in_at,
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }),
      "users.xlsx",
    );
  };

  const [sortConfig, setSortConfig] = React.useState<{
    key: string;
    direction: "asc" | "desc" | "default";
  }>({
    key: "",
    direction: "default",
  });

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      let direction: "asc" | "desc" | "default" = "asc";
      if (prev.key === key && prev.direction === "asc") {
        direction = "desc";
      } else if (prev.key === key && prev.direction === "desc") {
        direction = "default";
      }
      return { key, direction };
    });
  };

  const sortedUsers = React.useMemo(() => {
    if (sortConfig.direction === "default") return users;
    const sorted = [...users].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key])
        return sortConfig.direction === "asc" ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key])
        return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [users, sortConfig]);

  if (isLoading) {
    return (
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
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 shadow-sm">
        <CardContent className="p-12">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-red-900 mb-2">
              {t("errorLoadingData") || "خطأ في تحميل البيانات"}
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            {refetch && (
              <Button onClick={refetch} variant="outline" className="text-red-700 border-red-300">
                {t("retry") || "إعادة المحاولة"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-12">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-gray-100 rounded-full">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t("noResults") || "لا توجد نتائج"}
            </h3>
            <p className="text-gray-500">
              {t("tryChangingFilters") || "جرب تغيير الفلاتر"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900">
                {t("registeredUsers") || "المستخدمين المسجلين"}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {`${t("showing") || "يتم عرض"} ${users.length} ${t("user") || "مستخدم"}`}
              </p>
            </div>
          </div>
          <Button
            onClick={exportUsersToExcel}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 w-full sm:w-auto"
            size="sm"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t("exportUsersExcel") || "تصدير إلى Excel"}
            </span>
            <span className="sm:hidden">
              {t("export") || "تصدير"}
            </span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead
                  className="font-semibold text-gray-700 text-center cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort("full_name")}
                >
                  <div className="flex items-center justify-center gap-1">
                    {t("userName") || "اسم المستخدم"}
                    {sortConfig.key === "full_name" && (
                      <span className="text-blue-600">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="font-semibold text-gray-700 text-center cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort("email")}
                >
                  <div className="flex items-center justify-center gap-1">
                    {t("email") || "البريد الإلكتروني"}
                    {sortConfig.key === "email" && (
                      <span className="text-blue-600">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="font-semibold text-gray-700 text-center cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort("disabled")}
                >
                  <div className="flex items-center justify-center gap-1">
                    {t("status") || "الحالة"}
                    {sortConfig.key === "disabled" && (
                      <span className="text-blue-600">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-gray-700 text-center">
                  {t("actions") || "الإجراءات"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.map((user, index) => (
                <UserTableRow
                  key={user.id}
                  user={user}
                  index={index}
                  disableUser={disableUser}
                  deleteUser={deleteUser}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {users.length > 0 && totalPages > 1 && (
          <div className="mt-6 border-t border-gray-200 pt-4 px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* معلومات الصفحة */}
              <div className="text-sm text-gray-600">
                {t("showingResults") || "عرض"} {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} {t("paginationOf") || "من"} {totalCount} {t("paginationResults") || "نتيجة"}
              </div>

              {/* أزرار التنقل */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToFirstPage}
                  disabled={!hasPrevPage}
                  className="flex items-center gap-1"
                >
                  <ChevronsLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("first") || "الأول"}</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevPage}
                  disabled={!hasPrevPage}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("previous") || "السابق"}</span>
                </Button>

                {/* معلومات الصفحة الحالية */}
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-md">
                  <span className="text-sm font-medium text-gray-700">
                    {t("page") || "صفحة"} {currentPage} {t("paginationOf") || "من"} {totalPages}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={!hasNextPage}
                  className="flex items-center gap-1"
                >
                  <span className="hidden sm:inline">{t("next") || "التالي"}</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToLastPage}
                  disabled={!hasNextPage}
                  className="flex items-center gap-1"
                >
                  <span className="hidden sm:inline">{t("last") || "الأخير"}</span>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* معلومات إضافية على الهواتف */}
            <div className="mt-3 sm:hidden text-center">
              <div className="text-xs text-gray-500">
                {pageSize} {t("itemsPerPage") || "العناصر لكل صفحة"}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UsersTable;
