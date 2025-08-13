// خدمة إدارة المخزون والعناصر المجانية
// Stock management and free items service

import { supabase } from '@/integrations/supabase/client';

export interface FreeItem {
  product_id: string;
  name_ar?: string;
  name_en?: string;
  name_he?: string;
  quantity: number;
  value?: number;
}

export interface AppliedOffer {
  id: string;
  name_ar?: string;
  name_en?: string;
  name_he?: string;
  discount_percentage?: number;
  applied_discount?: number;
}

// ✅ مفتاح مضاد للتكرار ثابت per (orderId, productId)
const processedOrders = new Set<string>();

/**
 * تحديث المخزون لمنتج معين
 * Update stock for a specific product
 * ملاحظة: استعملها فقط للعناصر المجانية. المنتجات العادية مسؤوليتها على التريجرات.
 */
export async function updateProductStock(productId: string, quantityToDeduct: number, orderId?: string) {
  try {
    // مفتاح ثابت بدون timestamp
    const opKey = orderId ? `${orderId}:${productId}` : null;

    if (opKey && processedOrders.has(opKey)) {
      console.warn(`⚠️ تجنّب خصم مكرر لنفس العملية: ${opKey}`);
      return { success: true, message: 'تم تجاهل خصم مكرر' };
    }
    if (opKey) {
      processedOrders.add(opKey);
      // (اختياري) تنظيف بعد 5 دقائق
      setTimeout(() => processedOrders.delete(opKey), 5 * 60 * 1000);
    }

    console.log(`🔄 تحديث المخزون للمنتج ${productId} - خصم ${quantityToDeduct} - orderId=${orderId || 'N/A'}`);

    // الحصول على الكمية الحالية
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('stock_quantity, name_ar')
      .eq('id', productId)
      .single();

    if (fetchError) {
      console.error('❌ خطأ في جلب بيانات المنتج:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!product) {
      console.error('❌ المنتج غير موجود');
      return { success: false, error: 'المنتج غير موجود' };
    }

    const currentStock = product.stock_quantity || 0;
    const quantity = Math.abs(Number(quantityToDeduct) || 0);
    const newStock = Math.max(0, currentStock - quantity);

    console.log(`📦 ${product.name_ar} - المخزون الحالي: ${currentStock} | سيتم خصم: ${quantity} | المخزون الجديد: ${newStock}`);

    // تحديث المخزون
    const { error: updateError } = await supabase
      .from('products')
      .update({
        stock_quantity: newStock,
        in_stock: newStock > 0
      })
      .eq('id', productId);

    if (updateError) {
      console.error('❌ خطأ في تحديث المخزون:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log(`✅ تم تحديث مخزون ${product.name_ar} بنجاح - من ${currentStock} إلى ${newStock}`);
    return {
      success: true,
      oldStock: currentStock,
      newStock: newStock,
      productName: product.name_ar
    };
  } catch (error) {
    console.error('❌ خطأ عام في تحديث المخزون:', error);
    return { success: false, error: 'خطأ في تحديث المخزون' };
  }
}

/**
 * خصم العناصر المجانية من المخزون
 * Deduct free items from stock
 */
export async function deductFreeItemsFromStock(freeItems: FreeItem[], orderId?: string) {
  const results: any[] = [];

  console.log(`🎁 بدء خصم ${freeItems.length} عنصر مجاني من المخزون`);
  console.log('📊 تفاصيل العناصر المجانية:', freeItems);

  for (const item of freeItems) {
    console.log(`🔄 معالجة منتج مجاني: ${item.product_id} - الكمية: ${item.quantity}`);
    const result = await updateProductStock(item.product_id, item.quantity, `free-${orderId || 'unknown'}`);
    console.log(`📊 نتيجة خصم المنتج ${item.product_id}:`, result);
    results.push({ ...result, item });
  }

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  console.log(`📊 نتائج خصم العناصر المجانية: ${successCount} نجح، ${failCount} فشل`);
  return {
    success: failCount === 0,
    results,
    summary: {
      total: freeItems.length,
      successful: successCount,
      failed: failCount
    }
  };
}

/**
 * خصم عناصر الطلبية من المخزون (❌ لا تستعملها للمنتجات العادية)
 * NOTE: ألغينا استخدامها للمنتجات العادية. التريجرات تتكفل بذلك.
 */
export async function deductOrderItemsFromStock(_orderItems: any[], _orderId?: string) {
  console.warn("deductOrderItemsFromStock موقوفة للمنتجات العادية. استخدم التريجرات.");
  return { success: true, message: "noop" };
}

/**
 * معالجة العروض المطبقة وخصم العناصر المجانية من المخزون
 * Process applied offers and deduct free items from stock
 */
export async function processOffersStockDeduction(orderId: string, appliedOffers?: string | null, freeItems?: string | null) {
  console.log(`🎯 معالجة خصم العروض من المخزون للطلبية: ${orderId}`);
  console.log('📊 البيانات الواردة:', { appliedOffers, freeItems });

  try {
    let processedFreeItems: FreeItem[] = [];

    // استخراج المنتجات المجانية من العروض المطبقة أولاً
    if (appliedOffers) {
      try {
        const parsedOffers = typeof appliedOffers === 'string' ? JSON.parse(appliedOffers) : appliedOffers;
        console.log('📦 العروض المطبقة المحللة:', parsedOffers);

        if (Array.isArray(parsedOffers)) {
          parsedOffers.forEach((offer: any) => {
            // freeProducts
            if (offer?.freeProducts && Array.isArray(offer.freeProducts)) {
              offer.freeProducts.forEach((freeProduct: any) => {
                processedFreeItems.push({
                  product_id: freeProduct.productId || freeProduct.product_id,
                  quantity: freeProduct.quantity || 1,
                  name_ar: freeProduct.name_ar || '',
                  name_en: freeProduct.name_en || '',
                  name_he: freeProduct.name_he || '',
                  value: freeProduct.value || 0
                });
              });
            }
            // freeItems
            if (offer?.freeItems && Array.isArray(offer.freeItems)) {
              offer.freeItems.forEach((freeItem: any) => {
                processedFreeItems.push({
                  product_id: freeItem.productId || freeItem.product_id,
                  quantity: freeItem.quantity || 1,
                  name_ar: freeItem.name_ar || '',
                  name_en: freeItem.name_en || '',
                  name_he: freeItem.name_he || '',
                  value: freeItem.value || 0
                });
              });
            }
          });
        }
      } catch (error) {
        console.error('❌ خطأ في تحليل العروض المطبقة:', error);
      }
    }

    // معالجة العناصر المجانية من الحقل المنفصل كاحتياطي فقط إذا ما لقينا بالـ applied_offers
    if (freeItems && processedFreeItems.length === 0) {
      try {
        const parsedFreeItems = typeof freeItems === 'string' ? JSON.parse(freeItems) : freeItems;
        console.log('📦 العناصر المجانية من الحقل المنفصل:', parsedFreeItems);
        if (Array.isArray(parsedFreeItems)) {
          processedFreeItems = parsedFreeItems.map((x: any) => ({
            product_id: x?.productId ?? x?.product_id,
            quantity: x?.quantity ?? 1
          }));
        }
      } catch (error) {
        console.error('❌ خطأ في تحليل العناصر المجانية:', error);
      }
    }

    // تفريد ودمج الكميات قبل الخصم
    const agg = new Map<string, number>();
    for (const it of processedFreeItems) {
      const pid = String(it.product_id || '').trim();
      const q = Number(it.quantity || 0);
      if (!pid || !q) continue;
      agg.set(pid, (agg.get(pid) || 0) + q);
    }
    const uniqueFreeItems = Array.from(agg.entries()).map(([product_id, quantity]) => ({ product_id, quantity }));

    console.log(`📦 إجمالي المنتجات المجانية للخصم (بعد التفريد): ${uniqueFreeItems.length}`);
    console.log('📊 قائمة المنتجات المجانية:', uniqueFreeItems);

    if (uniqueFreeItems.length > 0) {
      const stockResult = await deductFreeItemsFromStock(uniqueFreeItems, orderId);
      if (!stockResult.success) {
        console.warn('⚠️ بعض العناصر المجانية لم يتم خصمها من المخزون', stockResult);
      }
      return stockResult;
    }

    console.log('ℹ️ لا توجد عناصر مجانية للخصم');
    return { success: true, message: 'لا توجد عناصر مجانية للخصم' };

  } catch (error) {
    console.error('❌ خطأ في معالجة خصم العروض من المخزون:', error);
    return { success: false, error: 'خطأ في معالجة العروض' };
  }
}

/**
 * تحديث مخزون المنتجات المجانية عند تعديل الطلبية
 * Update free products stock when editing an order
 */
export async function updateFreeProductsStockOnEdit(
  orderId: string,
  newAppliedOffers?: string | null,
  newFreeItems?: string | null
) {
  try {
    console.log(`🔄 بدء تحديث مخزون المنتجات المجانية عند تعديل الطلبية: ${orderId}`);

    // الحصول على البيانات القديمة للطلبية
    const { data: oldOrder, error: orderError } = await supabase
      .from('orders')
      .select('applied_offers, free_items')
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('❌ خطأ في جلب تفاصيل الطلبية القديمة:', orderError);
      return { success: false, error: orderError.message };
    }

    // استخراج المنتجات المجانية القديمة والجديدة
    const oldFreeProducts = extractFreeProductsFromOrderData(oldOrder?.applied_offers, oldOrder?.free_items);
    const newFreeProducts = extractFreeProductsFromOrderData(newAppliedOffers, newFreeItems);

    // حساب الفروقات
    const changes = calculateFreeProductChanges(oldFreeProducts, newFreeProducts);
    console.log('📊 تغييرات المنتجات المجانية:', changes);

    // تطبيق التغييرات على المخزون
    const results: any[] = [];
    for (const change of changes) {
      if (change.quantityDiff > 0) {
        // خصم إضافي
        const res = await updateProductStock(change.productId, change.quantityDiff, `edit:${orderId}`);
        results.push({ ...res, operation: 'deduct', productId: change.productId });
      } else if (change.quantityDiff < 0) {
        // إرجاع
        const restoreQty = Math.abs(change.quantityDiff);
        const res = await restoreProductStock(change.productId, restoreQty, `edit:${orderId}`);
        results.push({ ...res, operation: 'restore', productId: change.productId });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;
    return {
      success: failCount === 0,
      message: `تم تحديث مخزون ${successCount} منتج مجاني`,
      results,
      changes
    };

  } catch (error) {
    console.error('❌ خطأ في تحديث مخزون المنتجات المجانية:', error);
    return { success: false, error: 'خطأ في تحديث المخزون' };
  }
}

/**
 * استخراج المنتجات المجانية من بيانات الطلبية
 */
function extractFreeProductsFromOrderData(appliedOffers?: string | null, freeItems?: string | null) {
  const products = new Map<string, number>();
  const safeParse = (raw: any) => { try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return null; } };

  // من applied_offers
  const offers = safeParse(appliedOffers);
  if (Array.isArray(offers)) {
    for (const offer of offers) {
      if (Array.isArray(offer?.freeProducts)) {
        for (const fp of offer.freeProducts) {
          const pid = fp?.productId ?? fp?.product_id;
          const q = fp?.quantity ?? 1;
          if (pid) products.set(String(pid), (products.get(String(pid)) || 0) + Number(q || 0));
        }
      }
      if (Array.isArray(offer?.freeItems)) {
        for (const fi of offer.freeItems) {
          const pid = fi?.productId ?? fi?.product_id;
          const q = fi?.quantity ?? 1;
          if (pid) products.set(String(pid), (products.get(String(pid)) || 0) + Number(q || 0));
        }
      }
    }
  }

  // من free_items
  const free = safeParse(freeItems);
  if (Array.isArray(free)) {
    for (const it of free) {
      const pid = it?.productId ?? it?.product_id;
      const q = it?.quantity ?? 1;
      if (pid) products.set(String(pid), (products.get(String(pid)) || 0) + Number(q || 0));
    }
  }

  return Array.from(products.entries()).map(([productId, quantity]) => ({ productId, quantity }));
}

/**
 * حساب التغييرات المطلوبة في المخزون
 */
function calculateFreeProductChanges(
  oldProducts: { productId: string; quantity: number }[],
  newProducts: { productId: string; quantity: number }[]
) {
  const changes: Array<{ productId: string; oldQuantity: number; newQuantity: number; quantityDiff: number; }> = [];
  const oldMap = new Map(oldProducts.map(p => [p.productId, p.quantity]));
  const newMap = new Map(newProducts.map(p => [p.productId, p.quantity]));
  const allIds = new Set([...oldMap.keys(), ...newMap.keys()]);
  for (const id of allIds) {
    const oldQ = oldMap.get(id) || 0;
    const newQ = newMap.get(id) || 0;
    const diff = newQ - oldQ;
    if (diff !== 0) changes.push({ productId: id, oldQuantity: oldQ, newQuantity: newQ, quantityDiff: diff });
  }
  return changes;
}

/**
 * إرجاع كمية معينة للمخزون
 */
async function restoreProductStock(productId: string, quantity: number, _operationId: string) {
  try {
    console.log(`📦 إرجاع ${quantity} للمنتج ${productId}`);

    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('stock_quantity, name_ar')
      .eq('id', productId)
      .single();

    if (fetchError) {
      console.error('❌ خطأ في جلب بيانات المنتج:', fetchError);
      return { success: false, error: fetchError.message };
    }

    const currentStock = product?.stock_quantity || 0;
    const newStock = currentStock + Number(quantity || 0);

    const { error: updateError } = await supabase
      .from('products')
      .update({
        stock_quantity: newStock,
        in_stock: newStock > 0
      })
      .eq('id', productId);

    if (updateError) {
      console.error('❌ خطأ في تحديث المخزون:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log(`✅ تم إرجاع مخزون ${product?.name_ar} بنجاح - من ${currentStock} إلى ${newStock}`);
    return { success: true, oldStock: currentStock, newStock, productName: product?.name_ar };
  } catch (error) {
    console.error('❌ خطأ في إرجاع المخزون:', error);
    return { success: false, error: 'خطأ في إرجاع المخزون' };
  }
}

/**
 * إرجاع المنتجات المجانية للمخزون عند إلغاء الطلبية
 * Restore free products to stock when cancelling order
 * ✅ تفريد المصادر (applied_offers + free_items) قبل الإرجاع لمنع الازدواجية
 */
export async function restoreFreeProductsStock(orderId: string) {
  try {
    console.log(`🎁 بدء إرجاع المنتجات المجانية للمخزون - الطلبية: ${orderId}`);

    // الحصول على تفاصيل الطلبية
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('applied_offers, free_items')
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('❌ خطأ في جلب تفاصيل الطلبية:', orderError);
      return { success: false, error: orderError.message };
    }

    // دمج وتفريد كل المصادر
    const agg = new Map<string, number>();
    const safeParse = (raw: any) => { try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return null; } };
    const push = (pid?: any, q?: any) => {
      const id = String(pid || '').trim();
      const qty = Number(q || 0);
      if (!id || qty <= 0 || id === 'undefined') return;
      agg.set(id, (agg.get(id) || 0) + qty);
    };

    // من free_items
    const freeItems = safeParse(order?.free_items);
    if (Array.isArray(freeItems)) {
      for (const it of freeItems) push(it?.productId ?? it?.product_id, it?.quantity ?? 1);
    }

    // من applied_offers (freeProducts + freeItems)
    const offers = safeParse(order?.applied_offers);
    if (Array.isArray(offers)) {
      for (const off of offers) {
        if (Array.isArray(off?.freeProducts)) {
          for (const fp of off.freeProducts) push(fp?.productId ?? fp?.product_id, fp?.quantity ?? 1);
        }
        if (Array.isArray(off?.freeItems)) {
          for (const fi of off.freeItems) push(fi?.productId ?? fi?.product_id, fi?.quantity ?? 1);
        }
      }
    }

    const freeProductsToRestore = Array.from(agg.entries()).map(([product_id, quantity]) => ({ product_id, quantity }));
    if (freeProductsToRestore.length === 0) {
      console.log('ℹ️ لا توجد منتجات مجانية لإرجاعها (بعد التفريد)');
      return { success: true, message: 'لا توجد منتجات مجانية لإرجاعها' };
    }

    // إرجاع المخزون مرة واحدة لكل منتج
    const results: any[] = [];
    for (const item of freeProductsToRestore) {
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('stock_quantity, name_ar')
        .eq('id', item.product_id)
        .single();

      if (fetchError) {
        console.error(`❌ خطأ في جلب المنتج ${item.product_id}:`, fetchError);
        results.push({ success: false, error: fetchError.message, product_id: item.product_id });
        continue;
      }

      const currentStock = product?.stock_quantity || 0;
      const newStock = currentStock + Number(item.quantity || 0);

      const { error: updateError } = await supabase
        .from('products')
        .update({ stock_quantity: newStock, in_stock: newStock > 0 })
        .eq('id', item.product_id);

      if (updateError) {
        console.error(`❌ خطأ في تحديث مخزون ${item.product_id}:`, updateError);
        results.push({ success: false, error: updateError.message, product_id: item.product_id });
      } else {
        console.log(`✅ تم إرجاع مخزون ${product?.name_ar} بنجاح - من ${currentStock} إلى ${newStock}`);
        results.push({ success: true, product_id: item.product_id, oldStock: currentStock, newStock });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;
    console.log(`📊 نتائج إرجاع المنتجات المجانية (بعد التفريد): ${successCount} نجح، ${failCount} فشل`);

    return { success: failCount === 0, results };

  } catch (error) {
    console.error('❌ خطأ في إرجاع المنتجات المجانية للمخزون:', error);
    return { success: false, error: 'خطأ في إرجاع المخزون' };
  }
}
