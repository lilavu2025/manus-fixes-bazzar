import React from "react";

interface OrderStatsBarProps {
  stats: {
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  t: (key: string) => string;
}

const OrderStatsBar: React.FC<OrderStatsBarProps> = ({ stats, statusFilter, setStatusFilter, t }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-2">
    <div
      className={`bg-gradient-to-r from-blue-100 to-blue-50 rounded-xl p-3 flex flex-col items-center shadow-sm cursor-pointer transition ring-2 ${statusFilter === "all" ? "ring-blue-400" : "ring-transparent"} hover:ring-blue-300`}
      onClick={() => setStatusFilter("all")}
    >
      <span className="text-lg font-bold">{stats.total}</span>
      <span className="text-xs text-gray-600">{t("orders")}</span>
    </div>
    <div
      className={`bg-gradient-to-r from-yellow-100 to-yellow-50 rounded-xl p-3 flex flex-col items-center shadow-sm cursor-pointer transition ring-2 ${statusFilter === "pending" ? "ring-yellow-400" : "ring-transparent"} hover:ring-yellow-300`}
      onClick={() => setStatusFilter("pending")}
    >
      <span className="text-lg font-bold">{stats.pending}</span>
      <span className="text-xs text-gray-600">{t("pending")}</span>
    </div>
    <div
      className={`bg-gradient-to-r from-blue-100 to-blue-50 rounded-xl p-3 flex flex-col items-center shadow-sm cursor-pointer transition ring-2 ${statusFilter === "processing" ? "ring-blue-500" : "ring-transparent"} hover:ring-blue-300`}
      onClick={() => setStatusFilter("processing")}
    >
      <span className="text-lg font-bold">{stats.processing}</span>
      <span className="text-xs text-gray-600">{t("processing")}</span>
    </div>
    <div
      className={`bg-gradient-to-r from-purple-100 to-purple-50 rounded-xl p-3 flex flex-col items-center shadow-sm cursor-pointer transition ring-2 ${statusFilter === "shipped" ? "ring-purple-400" : "ring-transparent"} hover:ring-purple-300`}
      onClick={() => setStatusFilter("shipped")}
    >
      <span className="text-lg font-bold">{stats.shipped}</span>
      <span className="text-xs text-gray-600">{t("shipped")}</span>
    </div>
    <div
      className={`bg-gradient-to-r from-green-100 to-green-50 rounded-xl p-3 flex flex-col items-center shadow-sm cursor-pointer transition ring-2 ${statusFilter === "delivered" ? "ring-green-400" : "ring-transparent"} hover:ring-green-300`}
      onClick={() => setStatusFilter("delivered")}
    >
      <span className="text-lg font-bold">{stats.delivered}</span>
      <span className="text-xs text-gray-600">{t("delivered")}</span>
    </div>
    <div
      className={`bg-gradient-to-r from-red-100 to-red-50 rounded-xl p-3 flex flex-col items-center shadow-sm cursor-pointer transition ring-2 ${statusFilter === "cancelled" ? "ring-red-400" : "ring-transparent"} hover:ring-red-300`}
      onClick={() => setStatusFilter("cancelled")}
    >
      <span className="text-lg font-bold">{stats.cancelled}</span>
      <span className="text-xs text-gray-600">{t("cancelled")}</span>
    </div>
  </div>
);

export default OrderStatsBar;
