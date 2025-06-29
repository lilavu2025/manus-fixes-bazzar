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
  
  // إصلاح للتعامل مع كلا الاسمين (wholesalePrice و wholesale_price)
  const wholesalePrice = product.wholesalePrice || (product as any).wholesale_price;
  
  // المدراء ومستخدمو الجملة يحصلون على سعر الجملة إذا كان متوفراً
  if ((userType === 'wholesale' || userType === 'admin') && 
      typeof wholesalePrice === 'number' && 
      wholesalePrice > 0) {
    return wholesalePrice;
  }
  
  return product.price || 0;
}
