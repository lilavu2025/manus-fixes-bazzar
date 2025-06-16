// دالة موحدة لإرجاع السعر المناسب حسب نوع المستخدم (جملة/مفرق)
import { Product } from '@/types/product';

/**
 * إرجاع السعر المناسب للعرض حسب نوع المستخدم
 * @param product المنتج
 * @param userType نوع المستخدم ('retail' | 'wholesale' | 'admin' | undefined)
 * @returns السعر المناسب
 */
export function getDisplayPrice(product: Product, userType?: string): number {
  if (!product) return 0;
  if (userType === 'wholesale' && typeof product.wholesalePrice === 'number') {
    return product.wholesalePrice;
  }
  return product.price;
}
