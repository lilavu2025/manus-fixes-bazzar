import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Order } from "./order.types";

export function exportOrdersToExcel(orders: Order[]) {
  const ws = XLSX.utils.json_to_sheet(
    orders.map((o) => ({
      ID: o.id,
      Client: o.profiles?.full_name || "",
      Status: o.status,
      Total: o.total,
      Date: o.created_at,
      Payment: o.payment_method,
      Phone: o.profiles?.phone || "",
    }))
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Orders");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(
    new Blob([wbout], { type: "application/octet-stream" }),
    "orders.xlsx"
  );
}

export function exportOrdersToCSV(orders: Order[]) {
  const BOM = "\uFEFF";
  const csv = [
    ["ID", "Client", "Status", "Total", "Date", "Payment", "Phone"],
    ...orders.map((o) => [
      o.id,
      o.profiles?.full_name || "",
      o.status,
      o.total,
      o.created_at,
      o.payment_method,
      o.profiles?.phone || "",
    ]),
  ]
    .map((row) => row.join(","))
    .join("\n");
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "orders.csv";
  a.click();
  URL.revokeObjectURL(url);
}