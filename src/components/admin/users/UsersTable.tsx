import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users } from "lucide-react";
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
  refetch?: () => void; // إضافة refetch كخاصية اختيارية
}

const UsersTable: React.FC<UsersTableProps> = ({
  users,
  isLoading,
  error,
  disableUser,
  deleteUser,
  refetch, // استلام refetch كدالة
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
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{t("manageUsers")}</h1>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto animate-spin rounded-full border-primary"></div>
          <p className="mt-4 text-gray-600">{t("loadingUsers")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="shadow-xl border-0 overflow-hidden">
        <CardContent className="p-0">
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl text-red-500">!</span>
            </div>
            <h3 className="text-xl font-medium text-red-900 mb-2">
              {t("errorLoadingData") || "خطأ في تحميل البيانات"}
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={refetch}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
            >
              {t("retry") || "إعادة المحاولة"}
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card className="shadow-xl border-0 overflow-hidden">
        <CardContent className="p-0">
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {t("noResults")}
            </h3>
            <p className="text-gray-500">{t("tryChangingFilters")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-0 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b p-4 lg:p-6 flex items-center justify-between">
        <CardTitle className="flex items-center gap-3 text-base lg:text-xl">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="h-4 w-4 lg:h-6 lg:w-6 text-blue-600" />
          </div>
          {t("registeredUsers")}
        </CardTitle>
        <button
          onClick={exportUsersToExcel}
          className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] text-white px-4 py-2 rounded font-bold hover:bg-green-700"
        >
          {t("exportUsersExcel") || "תצא משתמשים לאקסל"}
        </button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="text-center">
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead
                  className="font-semibold text-gray-700 text-xs lg:text-sm p-2 lg:p-4 text-center cursor-pointer"
                  onClick={() => handleSort("full_name")}
                >
                  {t("userName")}
                </TableHead>
                <TableHead
                  className="font-semibold text-gray-700 text-xs lg:text-sm p-2 lg:p-4 text-center cursor-pointer"
                  onClick={() => handleSort("email")}
                >
                  {t("email")}
                </TableHead>
                <TableHead
                  className="font-semibold text-gray-700 text-xs lg:text-sm p-2 lg:p-4 text-center cursor-pointer"
                  onClick={() => handleSort("disabled")}
                >
                  {t("status")}
                </TableHead>
                <TableHead className="font-semibold text-gray-700 text-xs lg:text-sm p-2 lg:p-4 text-center">
                  {t("actions")}
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
      </CardContent>
    </Card>
  );
};

export default UsersTable;
