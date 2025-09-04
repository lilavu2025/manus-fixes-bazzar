import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Order } from "./order.types";

// Helper: pick display string from i18n object or plain
function toDisplay(val: any, lang: 'ar' | 'en' | 'he' = 'ar'): string {
  if (val == null) return '';
  if (typeof val === 'object') {
    const o = val as any;
    if (o.ar || o.en || o.he) {
      if (lang === 'en') return o.en || o.ar || o.he || '';
      if (lang === 'he') return o.he || o.en || o.ar || '';
      return o.ar || o.en || o.he || '';
    }
  }
  if (typeof val === 'string') {
    try { const p = JSON.parse(val); return toDisplay(p, lang); } catch { return val; }
  }
  try { return String(val); } catch { return ''; }
}

// Merge freebies from applied_offers and order.free_items, preferring variantAttributes
function getMergedFreeItems(order: Order): any[] {
  const fromOffers: any[] = [];
  try {
    if (order.applied_offers) {
      const applied = typeof order.applied_offers === 'string' ? JSON.parse(order.applied_offers) : order.applied_offers as any[];
      (applied || []).forEach((offer: any) => {
        if (Array.isArray(offer.freeProducts)) fromOffers.push(...offer.freeProducts);
        if (Array.isArray(offer.freeItems)) fromOffers.push(...offer.freeItems);
      });
    }
  } catch {}
  const fromOrder: any[] = (() => {
    if (!order.free_items) return [];
    try {
      const val = typeof order.free_items === 'string' ? JSON.parse(order.free_items) : (order.free_items as any);
      return Array.isArray(val) ? val : [];
    } catch { return []; }
  })();

  const map = new Map<string, any>();
  const makeKey = (it: any) => {
    const pid = String(it.productId || it.product_id || it.id || '').trim();
    const vid = String(it.variantId || (it.variant_id ?? '') || '').trim();
    return `${pid}|${vid}`;
  };
  const merge = (target: any, src: any) => {
    const result: any = { ...target };
    for (const k of Object.keys(src || {})) {
      if (result[k] == null || result[k] === '') result[k] = src[k];
    }
    if (!result.variantAttributes && src.variantAttributes) result.variantAttributes = src.variantAttributes;
    if (!result.variant_attributes && src.variant_attributes) result.variant_attributes = src.variant_attributes;
    if (!result.variantId && src.variantId) result.variantId = src.variantId;
    return result;
  };
  const pushOrMerge = (arr: any[]) => {
    for (const it of arr) {
      const key = makeKey(it);
      if (!key.startsWith('|')) {
        if (map.has(key)) map.set(key, merge(map.get(key), it));
        else map.set(key, { ...it });
      }
    }
  };
  pushOrMerge(fromOffers);
  pushOrMerge(fromOrder);
  return Array.from(map.values());
}

function buildFreeItemsText(order: Order, lang: 'ar' | 'en' | 'he' = 'ar'): string {
  const freebies = getMergedFreeItems(order);
  if (!freebies.length) return '';
  const parts: string[] = [];
  for (const it of freebies) {
    const name = toDisplay(it.name || it[`name_${lang}`] || it.name_ar || it.name_en || it.name_he || it.productName || it.product_name || it.product_name_ar || it.product_name_en || it.product_name_he || it.productId || it.product_id || '-', lang);
    const qty = it.quantity || 1;
    const attrsObj = (it as any).variantAttributes || (it as any).variant_attributes;
    let attrsText = '';
    try {
      const attrs = typeof attrsObj === 'string' ? JSON.parse(attrsObj) : attrsObj;
      if (attrs && typeof attrs === 'object') {
        const chips = Object.entries(attrs).map(([k, v]) => `${toDisplay(k, lang)}: ${toDisplay(v, lang)}`);
        if (chips.length) attrsText = ` [${chips.join(', ')}]`;
      }
    } catch {}
    parts.push(`${name}${attrsText} x${qty}`);
  }
  return parts.join('; ');
}

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
      FreeItems: buildFreeItemsText(o, 'ar'),
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
    ["ID", "Client", "Status", "Total", "Date", "Payment", "Phone", "FreeItems"],
    ...orders.map((o) => [
      o.id,
      o.profiles?.full_name || "",
      o.status,
      o.total,
      o.created_at,
      o.payment_method,
      o.profiles?.phone || "",
      buildFreeItemsText(o, 'ar'),
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