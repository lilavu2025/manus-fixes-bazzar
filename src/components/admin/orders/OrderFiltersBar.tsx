import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { XCircle, BarChart3 } from "lucide-react";

interface OrderFiltersBarProps {
  t: (key: string) => string;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  paymentFilter: string;
  setPaymentFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  onExportExcel?: () => void;
  onResetFilters?: () => void;
}

const OrderFiltersBar: React.FC<OrderFiltersBarProps> = ({
  t,
  searchQuery,
  setSearchQuery,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  paymentFilter,
  setPaymentFilter,
  statusFilter,
  setStatusFilter,
  onExportExcel,
  onResetFilters,
}) => {
  return (
    <Card className="shadow-lg border-0 mt-1">
      <CardContent className="p-2 sm:p-3 lg:p-4">
        <div className="flex flex-col gap-2 lg:gap-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
            {/* بحث الطلبات */}
            <div className="w-full sm:w-56 flex-shrink-0">
              <div className="relative">
                <input
                  type="text"
                  className="border border-gray-200 rounded-md pl-8 pr-2 py-1.5 h-9 text-xs sm:text-sm w-full bg-gray-50 focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition-colors placeholder:text-gray-400"
                  placeholder={t("searchByOrderNumberNameOrPhone") || "بحث برقم الطلب أو اسم العميل أو رقم الهاتف فقط..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  maxLength={60}
                />
                <span className="absolute top-1/2 left-2 -translate-y-1/2 text-gray-400 text-base">
                  🔍
                </span>
              </div>
            </div>
            {/* من تاريخ */}
            <div className="w-full sm:w-36 flex-shrink-0">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full border border-gray-200 rounded-md h-9 text-xs sm:text-sm bg-gray-50 focus:border-blue-400 focus:ring-1 focus:ring-blue-200 placeholder:text-gray-400"
                placeholder={t("fromDate") || "من تاريخ"}
              />
            </div>
            {/* إلى تاريخ */}
            <div className="w-full sm:w-36 flex-shrink-0">
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full border border-gray-200 rounded-md h-9 text-xs sm:text-sm bg-gray-50 focus:border-blue-400 focus:ring-1 focus:ring-blue-200 placeholder:text-gray-400"
                placeholder={t("toDate") || "إلى تاريخ"}
              />
            </div>
            {/* طريقة الدفع */}
            <div className="w-full sm:w-36 flex-shrink-0">
              <select
                className="border border-gray-200 rounded-md px-2 py-1.5 h-9 text-xs sm:text-sm w-full bg-blue-50 focus:border-blue-400"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <option value="all">{t("all") || "الكل"}</option>
                <option value="cash">{t("cash") || "نقداً"}</option>
                <option value="card">{t("card") || "بطاقة ائتمان"}</option>
                <option value="bank_transfer">{t("bankTransfer") || "تحويل بنكي"}</option>
              </select>
            </div>
            {/* الحالة */}
            <div className="w-full sm:w-36 flex-shrink-0">
              <select
                className="border border-gray-200 rounded-md px-2 py-1.5 h-9 text-xs sm:text-sm w-full bg-yellow-50 focus:border-yellow-400"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">{t("all") || "الكل"}</option>
                <option value="pending">{t("pending") || "قيد الانتظار"}</option>
                <option value="processing">{t("processing") || "قيد التنفيذ"}</option>
                <option value="shipped">{t("shipped") || "تم الشحن"}</option>
                <option value="delivered">{t("delivered") || "تم التوصيل"}</option>
                <option value="cancelled">{t("cancelled") || "ملغي"}</option>
              </select>
            </div>
            <button
              type="button"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-2 py-1.5 rounded-md bg-red-50 text-red-700 font-bold shadow border border-red-200 hover:bg-red-100 transition-all duration-200 h-9 text-xs sm:text-sm"
              onClick={onResetFilters ? onResetFilters : () => {
                setStatusFilter("all");
                setDateFrom("");
                setDateTo("");
                setPaymentFilter("all");
                setSearchQuery("");
              }}
            >
              <XCircle className="h-4 w-4" />
              <span>{t("resetFilters") || "مسح الفلاتر"}</span>
            </button>
            <button
              type="button"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-2 py-1.5 rounded-md bg-blue-600 text-white font-bold shadow border border-blue-700 hover:bg-blue-700 transition-all duration-200 h-9 text-xs sm:text-sm"
              onClick={onExportExcel}
            >
              <BarChart3 className="h-4 w-4" />
              <span>{t("exportExcel") || "تصدير Excel"}</span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderFiltersBar;
