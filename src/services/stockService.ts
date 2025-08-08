// خدمة إدارة المخزون والعناصر المجانية
// Stock management and free items service

import { supabase } from '@/integrations/supabase/client';

export interface FreeItem {
  product_id: string;
  name_ar: string;
  name_en: string;
  name_he: string;
  quantity: number;
  value?: number;
}

export interface AppliedOffer {
  id: string;
  name_ar: string;
  name_en: string;
  name_he: string;
  discount_percentage?: number;
  applied_discount?: number;
}

// متغير لتجنب الخصم المضاعف للطلبية نفسها
const processedOrders = new Set<string>();

/**
 * تحديث المخزون لمنتج معين
 * Update stock for a specific product
 */
export async function updateProductStock(productId: string, quantityToDeduct: number, orderId?: string) {
  try {
    const timestamp = Date.now();
    const operationId = orderId ? `${orderId}-${productId}-${timestamp}` : `${timestamp}-${productId}`;
    
    // التحقق من الخصم المضاعف (فقط للطلبيات الجديدة، ليس التعديل)
    const isEditOperation = orderId?.includes('edit-');
    if (orderId && !isEditOperation && processedOrders.has(operationId)) {
      console.warn(`⚠️ تجنب الخصم المضاعف للطلبية ${orderId} - المنتج ${productId}`);
      return { success: true, message: 'تم تجنب الخصم المضاعف' };
    }
    
    if (orderId && !isEditOperation) {
      processedOrders.add(operationId);
      // حذف الذاكرة بعد 5 دقائق لتجنب تراكم البيانات
      setTimeout(() => processedOrders.delete(operationId), 5 * 60 * 1000);
    }
    
    console.log(`🔄 تحديث المخزون للمنتج ${productId} - خصم ${quantityToDeduct} - معرف العملية: ${operationId}`);
    
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
    const quantityToUpdate = Math.abs(quantityToDeduct);
    const newStock = Math.max(0, currentStock - quantityToUpdate);

    console.log(`📦 ${product.name_ar} - المخزون الحالي: ${currentStock} | سيتم خصم: ${quantityToUpdate} | المخزون الجديد: ${newStock}`);

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
  const results = [];
  
  console.log(`🎁 بدء خصم ${freeItems.length} عنصر مجاني من المخزون`);
  console.log('📊 تفاصيل العناصر المجانية:', freeItems);
  
  for (const item of freeItems) {
    console.log(`🔄 معالجة منتج مجاني: ${item.product_id} - الكمية: ${item.quantity}`);
    const result = await updateProductStock(item.product_id, item.quantity, `free-${orderId || 'unknown'}`);
    console.log(`📊 نتيجة خصم المنتج ${item.product_id}:`, result);
    
    results.push({
      ...result,
      item: item
    });
  }
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log(`📊 نتائج خصم العناصر المجانية: ${successCount} نجح، ${failCount} فشل`);
  console.log('📋 تفاصيل النتائج الكاملة:', results);
  
  return {
    success: failCount === 0,
    results: results,
    summary: {
      total: freeItems.length,
      successful: successCount,
      failed: failCount
    }
  };
}

/**
 * خصم عناصر الطلبية من المخزون
 * Deduct order items from stock  
 */
export async function deductOrderItemsFromStock(orderItems: any[], orderId?: string) {
  const results = [];
  
  console.log(`📦 بدء خصم ${orderItems.length} عنصر من الطلبية من المخزون - معرف الطلب:`, orderId);
  console.log('📊 تفاصيل عناصر الطلبية:', orderItems);
  
  for (const item of orderItems) {
    const productId = item.product?.id || item.product_id;
    const quantity = item.quantity;
    
    console.log(`🔄 معالجة منتج عادي: ${productId} - الكمية: ${quantity}`);
    const result = await updateProductStock(productId, quantity, orderId);
    console.log(`📊 نتيجة خصم المنتج ${productId}:`, result);
    
    results.push({
      ...result,
      item: item
    });
  }
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log(`📊 نتائج خصم عناصر الطلبية: ${successCount} نجح، ${failCount} فشل`);
  console.log('📋 تفاصيل النتائج الكاملة:', results);
  
  return {
    success: failCount === 0,
    results: results,
    summary: {
      total: orderItems.length,
      successful: successCount,
      failed: failCount
    }
  };
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
          parsedOffers.forEach((offer: any, index: number) => {
            console.log(`🎁 معالجة العرض ${index + 1}:`, offer);
            
            // استخراج من freeProducts
            if (offer.freeProducts && Array.isArray(offer.freeProducts)) {
              console.log(`📦 منتجات مجانية من freeProducts:`, offer.freeProducts);
              offer.freeProducts.forEach((freeProduct: any) => {
                const processedItem = {
                  product_id: freeProduct.productId || freeProduct.product_id,
                  quantity: freeProduct.quantity || 1,
                  name_ar: freeProduct.name_ar || '',
                  name_en: freeProduct.name_en || '',
                  name_he: freeProduct.name_he || '',
                  value: freeProduct.value || 0
                };
                console.log(`✅ تمت إضافة منتج مجاني:`, processedItem);
                processedFreeItems.push(processedItem);
              });
            }
            
            // استخراج من freeItems
            if (offer.freeItems && Array.isArray(offer.freeItems)) {
              console.log(`📦 منتجات مجانية من freeItems:`, offer.freeItems);
              offer.freeItems.forEach((freeItem: any) => {
                const processedItem = {
                  product_id: freeItem.productId || freeItem.product_id,
                  quantity: freeItem.quantity || 1,
                  name_ar: freeItem.name_ar || '',
                  name_en: freeItem.name_en || '',
                  name_he: freeItem.name_he || '',
                  value: freeItem.value || 0
                };
                console.log(`✅ تمت إضافة منتج مجاني:`, processedItem);
                processedFreeItems.push(processedItem);
              });
            }
          });
        }
      } catch (error) {
        console.error('❌ خطأ في تحليل العروض المطبقة:', error);
      }
    }
    
    // معالجة العناصر المجانية من الحقل المنفصل كاحتياطي
    if (freeItems && processedFreeItems.length === 0) {
      try {
        const parsedFreeItems = typeof freeItems === 'string' ? JSON.parse(freeItems) : freeItems;
        console.log('📦 العناصر المجانية من الحقل المنفصل:', parsedFreeItems);
        if (Array.isArray(parsedFreeItems)) {
          processedFreeItems = parsedFreeItems;
        }
      } catch (error) {
        console.error('❌ خطأ في تحليل العناصر المجانية:', error);
      }
    }
    
    console.log(`📦 إجمالي المنتجات المجانية للخصم: ${processedFreeItems.length}`);
    console.log('📊 قائمة المنتجات المجانية:', processedFreeItems);
    
    // خصم العناصر المجانية من المخزون
    if (processedFreeItems.length > 0) {
      const stockResult = await deductFreeItemsFromStock(processedFreeItems, orderId);
      
      if (stockResult.success) {
        console.log('✅ تم خصم جميع العناصر المجانية من المخزون بنجاح');
      } else {
        console.warn('⚠️ بعض العناصر المجانية لم يتم خصمها من المخزون');
        console.log('❌ تفاصيل الأخطاء:', stockResult);
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
    
    // استخراج المنتجات المجانية القديمة
    const oldFreeProducts = extractFreeProductsFromOrderData(oldOrder?.applied_offers, oldOrder?.free_items);
    console.log('📦 المنتجات المجانية القديمة:', oldFreeProducts);
    
    // استخراج المنتجات المجانية الجديدة
    const newFreeProducts = extractFreeProductsFromOrderData(newAppliedOffers, newFreeItems);
    console.log('📦 المنتجات المجانية الجديدة:', newFreeProducts);
    
    // حساب الفروقات
    const changes = calculateFreeProductChanges(oldFreeProducts, newFreeProducts);
    console.log('📊 التغييرات المطلوبة:', changes);
    
    // تطبيق التغييرات على المخزون
    const results = [];
    for (const change of changes) {
      if (change.quantityDiff > 0) {
        // خصم من المخزون (منتجات مجانية إضافية)
        console.log(`➖ خصم ${change.quantityDiff} من المنتج ${change.productId}`);
        const result = await updateProductStock(change.productId, change.quantityDiff, `edit-deduct-${orderId}`);
        results.push({ ...result, operation: 'deduct', productId: change.productId });
      } else if (change.quantityDiff < 0) {
        // إضافة للمخزون (منتجات مجانية أقل)
        const restoreQuantity = Math.abs(change.quantityDiff);
        console.log(`➕ إضافة ${restoreQuantity} للمنتج ${change.productId}`);
        const result = await restoreProductStock(change.productId, restoreQuantity, `edit-restore-${orderId}`);
        results.push({ ...result, operation: 'restore', productId: change.productId });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    console.log(`📊 نتائج تحديث المخزون: ${successCount} نجح، ${failCount} فشل`);
    
    return {
      success: failCount === 0,
      message: `تم تحديث مخزون ${successCount} منتج مجاني`,
      results: results,
      changes: changes
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
  
  // استخراج من applied_offers
  if (appliedOffers) {
    try {
      const offers = JSON.parse(appliedOffers);
      if (Array.isArray(offers)) {
        for (const offer of offers) {
          if (offer.freeProducts && Array.isArray(offer.freeProducts)) {
            for (const product of offer.freeProducts) {
              const productId = product.productId || product.product_id;
              const quantity = product.quantity || 1;
              if (productId) {
                products.set(productId, (products.get(productId) || 0) + quantity);
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('⚠️ خطأ في تحليل applied_offers:', e);
    }
  }
  
  // استخراج من free_items
  if (freeItems) {
    try {
      const items = JSON.parse(freeItems);
      if (Array.isArray(items)) {
        for (const item of items) {
          const productId = item.productId || item.product_id;
          const quantity = item.quantity || 1;
          if (productId) {
            products.set(productId, (products.get(productId) || 0) + quantity);
          }
        }
      }
    } catch (e) {
      console.warn('⚠️ خطأ في تحليل free_items:', e);
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
  const changes = [];
  
  // تحويل إلى Map للبحث السريع
  const oldMap = new Map(oldProducts.map(p => [p.productId, p.quantity]));
  const newMap = new Map(newProducts.map(p => [p.productId, p.quantity]));
  
  // جميع المنتجات المتأثرة
  const allProductIds = new Set([...oldMap.keys(), ...newMap.keys()]);
  
  for (const productId of allProductIds) {
    const oldQuantity = oldMap.get(productId) || 0;
    const newQuantity = newMap.get(productId) || 0;
    const quantityDiff = newQuantity - oldQuantity;
    
    if (quantityDiff !== 0) {
      changes.push({
        productId,
        oldQuantity,
        newQuantity,
        quantityDiff
      });
    }
  }
  
  return changes;
}

/**
 * إرجاع كمية معينة للمخزون
 */
async function restoreProductStock(productId: string, quantity: number, operationId: string) {
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

    const currentStock = product.stock_quantity || 0;
    const newStock = currentStock + quantity;

    console.log(`📦 ${product.name_ar} - المخزون الحالي: ${currentStock} | سيتم إضافة: ${quantity} | المخزون الجديد: ${newStock}`);

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

    console.log(`✅ تم إرجاع مخزون ${product.name_ar} بنجاح - من ${currentStock} إلى ${newStock}`);
    return { 
      success: true, 
      oldStock: currentStock, 
      newStock: newStock,
      productName: product.name_ar
    };
  } catch (error) {
    console.error('❌ خطأ في إرجاع المخزون:', error);
    return { success: false, error: 'خطأ في إرجاع المخزون' };
  }
}

/**
 * إرجاع المنتجات المجانية للمخزون عند إلغاء الطلبية
 * Restore free products to stock when cancelling order
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
    
    const freeProductsToRestore = [];
    
    // أولاً: استخراج المنتجات المجانية من حقل free_items
    if (order?.free_items) {
      try {
        const freeItems = JSON.parse(order.free_items);
        console.log('🎁 المنتجات المجانية من free_items:', freeItems);
        
        if (Array.isArray(freeItems)) {
          for (const freeItem of freeItems) {
            const productId = freeItem.productId || freeItem.product_id;
            const quantity = freeItem.quantity || 1;
            
            if (productId) {
              console.log(`🎁 تم العثور على منتج مجاني من free_items لإرجاعه: ${productId} - الكمية: ${quantity}`);
              freeProductsToRestore.push({
                product_id: productId,
                quantity: quantity
              });
            }
          }
        }
      } catch (e) {
        console.warn('⚠️ خطأ في تحليل free_items:', e);
      }
    }
    
    // ثانياً: استخراج المنتجات المجانية من العروض المطبقة
    if (order?.applied_offers) {
      try {
        const appliedOffers = JSON.parse(order.applied_offers);
        console.log('📦 العروض المطبقة:', appliedOffers);
        
        // استخراج المنتجات المجانية من كل عرض
        for (const offer of appliedOffers) {
          console.log('🔍 فحص العرض:', { offer });
          if (offer.freeProducts && Array.isArray(offer.freeProducts)) {
            console.log('🎁 منتجات مجانية في العرض:', offer.freeProducts);
            for (const freeProduct of offer.freeProducts) {
              console.log('🔍 فحص المنتج المجاني:', freeProduct);
              // التحقق من وجود productId أو product_id
              const productId = freeProduct.productId || freeProduct.product_id;
              const quantity = freeProduct.quantity || 1;
              
              if (productId) {
                console.log(`🎁 تم العثور على منتج مجاني من العرض لإرجاعه: ${productId} - الكمية: ${quantity}`);
                freeProductsToRestore.push({
                  product_id: productId,
                  quantity: quantity
                });
              }
            }
          }
        }
      } catch (e) {
        console.warn('⚠️ خطأ في تحليل applied_offers:', e);
      }
    }
    
    if (freeProductsToRestore.length === 0) {
      console.log('ℹ️ لا توجد منتجات مجانية لإرجاعها');
      return { success: true, message: 'لا توجد منتجات مجانية لإرجاعها' };
    }
    
    // إرجاع كل منتج مجاني للمخزون
    const results = [];
    for (const item of freeProductsToRestore) {
      // التحقق من صحة product_id
      if (!item.product_id || item.product_id === 'undefined' || item.product_id === undefined) {
        console.error('❌ معرف المنتج غير صحيح:', item.product_id);
        results.push({ success: false, error: 'معرف المنتج غير صحيح', product_id: item.product_id });
        continue;
      }
      
      console.log(`🔄 إرجاع منتج مجاني: ${item.product_id} - الكمية: ${item.quantity}`);
      
      // الحصول على المنتج الحالي
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

      const currentStock = product.stock_quantity || 0;
      const newStock = currentStock + item.quantity;

      console.log(`📦 ${product.name_ar} - المخزون الحالي: ${currentStock} | سيتم إضافة: ${item.quantity} | المخزون الجديد: ${newStock}`);

      // تحديث المخزون
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          stock_quantity: newStock,
          in_stock: newStock > 0
        })
        .eq('id', item.product_id);

      if (updateError) {
        console.error(`❌ خطأ في تحديث مخزون ${item.product_id}:`, updateError);
        results.push({ success: false, error: updateError.message, product_id: item.product_id });
      } else {
        console.log(`✅ تم إرجاع مخزون ${product.name_ar} بنجاح - من ${currentStock} إلى ${newStock}`);
        results.push({ success: true, product_id: item.product_id, oldStock: currentStock, newStock: newStock });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    console.log(`📊 نتائج إرجاع المنتجات المجانية: ${successCount} نجح، ${failCount} فشل`);
    
    return {
      success: failCount === 0,
      message: `تم إرجاع ${successCount} منتج مجاني للمخزون`,
      results: results
    };
    
  } catch (error) {
    console.error('❌ خطأ في إرجاع المنتجات المجانية للمخزون:', error);
    return { success: false, error: 'خطأ في إرجاع المنتجات المجانية' };
  }
}
