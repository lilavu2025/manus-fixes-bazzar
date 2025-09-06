// Helper to compute variant-aware unit price by user type
import { getDisplayPrice } from "@/utils/priceUtils";

type VariantInfo = {
  variantId?: string | null;
  variantAttributes?: Record<string, any> | string | null;
};

function normalizeVariantAttributes(raw: any): Record<string, any> | null {
  if (!raw) return null;
  let obj = raw;
  if (typeof raw === "string") {
    try { obj = JSON.parse(raw); }
    catch { return null; }
  }
  if (typeof obj !== "object" || Array.isArray(obj)) return null;
  return obj as Record<string, any>;
}

function normalizeVariantValue(v: any): string {
  if (v == null) return "";
  if (typeof v === "object") {
    try { return JSON.stringify(v); } catch { return String(v); }
  }
  return String(v);
}

export function computeVariantSpecificPrice(
  product: any,
  variantInfo?: VariantInfo,
  userType?: string,
): number {
  if (!product) return 0;
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  let matchedVar: any | undefined;
  const vid = variantInfo?.variantId ?? (product as any)?.variant_id ?? null;
  const vattrs = normalizeVariantAttributes(variantInfo?.variantAttributes ?? (product as any)?.variant_attributes);

  if (vid) {
    matchedVar = variants.find((v: any) => String(v?.id) === String(vid));
  }

  if (!matchedVar && vattrs) {
    matchedVar = variants.find((v: any) => {
      const ov = v?.option_values || {};
      const options = Array.isArray(product?.options) ? product.options : [];
      if (!options || options.length === 0) return false;
      return options.every((o: any) => normalizeVariantValue(ov[o.name]) === normalizeVariantValue((vattrs as any)[o.name]));
    });
  }

  if (matchedVar) {
    const w = Number(matchedVar?.wholesale_price || 0);
    const p = Number(matchedVar?.price || 0);
    if ((userType === "wholesale" || userType === "admin") && w > 0) return w;
    return p;
  }

  return getDisplayPrice(product, userType);
}
