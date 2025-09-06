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
  let processedFreeItems: Array<FreeItem & { variant_id?: string | null }> = [];

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
                  value: freeProduct.value || 0,
                  variant_id: freeProduct.variantId || freeProduct.variant_id || null,
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
          value: freeItem.value || 0,
          variant_id: freeItem.variantId || freeItem.variant_id || null,
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
            quantity: x?.quantity ?? 1,
            variant_id: x?.variantId ?? x?.variant_id ?? null,
          }));
        }
      } catch (error) {
        console.error('❌ خطأ في تحليل العناصر المجانية:', error);
      }
    }

    // تفريد ودمج الكميات قبل الخصم — تقسيم حسب الفيرنت/المنتج
    const variantAgg = new Map<string, number>();
    const productAgg = new Map<string, number>();
    for (const it of processedFreeItems) {
      const q = Number(it.quantity || 0);
      const vid = String(it.variant_id || '').trim();
      const pid = String(it.product_id || '').trim();
      if (!q) continue;
      if (vid) {
        variantAgg.set(vid, (variantAgg.get(vid) || 0) + q);
      } else if (pid) {
        productAgg.set(pid, (productAgg.get(pid) || 0) + q);
      }
    }

    console.log(`📦 إجمالي العناصر المجانية بحسب الفيرنت: ${variantAgg.size}, وبحسب المنتج دون فيرنت: ${productAgg.size}`);

    const results: any = { success: true, variantResults: [], productResults: [] };

    // أ) خصم الفيرنتس المجانية
    if (variantAgg.size > 0) {
      let ok = 0; let fail = 0; const rows: any[] = [];
      for (const [variantId, totalQty] of variantAgg.entries()) {
        try {
          const { error: rpcError } = await supabase.rpc('decrease_variant_stock' as any, {
            variant_id: variantId,
            quantity: totalQty,
          });
          if (rpcError) {
            console.warn(`⚠️ decrease_variant_stock RPC فشل للفيرنت (مجاني) ${variantId}، سنحاول التحديث المباشر.`, rpcError?.message || rpcError);
            const { data: variant, error: fetchErr } = await supabase
              .from('product_variants')
              .select('stock_quantity')
              .eq('id', variantId)
              .single();
            if (fetchErr) throw fetchErr;
            const current = Number(variant?.stock_quantity || 0);
            const newStock = Math.max(0, current - Number(totalQty || 0));
            const { error: directUpdErr } = await supabase
              .from('product_variants')
              .update({ stock_quantity: newStock })
              .eq('id', variantId);
            if (directUpdErr) throw directUpdErr;
          }
          ok++; rows.push({ variantId, deducted: totalQty });
        } catch (e: any) {
          console.error(`❌ فشل خصم مخزون الفيرنت (مجاني) ${variantId}:`, e?.message || e);
          fail++; rows.push({ variantId, error: e?.message || String(e) });
        }
      }
      results.variantResults = { ok, fail, rows };
      // مزامنة مخزون المنتج الأب للفيرنتس
      await refreshParentProductStockForVariants(Array.from(variantAgg.keys()));
      if (fail > 0) results.success = false;
    }

    // ب) خصم المنتجات المجانية بدون فيرنت (كما السابق)
    if (productAgg.size > 0) {
      const uniqueFreeItems = Array.from(productAgg.entries()).map(([product_id, quantity]) => ({ product_id, quantity }));
      const stockResult = await deductFreeItemsFromStock(uniqueFreeItems, orderId);
      results.productResults = stockResult;
      if (!stockResult.success) results.success = false;
    }

    if (variantAgg.size === 0 && productAgg.size === 0) {
      console.log('ℹ️ لا توجد عناصر مجانية للخصم');
      return { success: true, message: 'لا توجد عناصر مجانية للخصم' };
    }

    return results;

  } catch (error) {
    console.error('❌ خطأ في معالجة خصم العروض من المخزون:', error);
    return { success: false, error: 'خطأ في معالجة العروض' };
  }
}

/**
 * خصم مخزون الفيرنتس لعناصر الطلبية (مرة واحدة لكل عنصر)
 * Deduct stock for variant items in an order (idempotent via order_items.stock_deducted)
 */
export async function deductVariantItemsStockForOrder(orderId: string) {
  try {
    console.log(`🧩 خصم مخزون الفيرنتس للطلبية: ${orderId}`);

    // 0) محاولة الخصم عبر دالة آمنة على الخادم (تتجاوز RLS)
    let rpcApplied = false;
    let rpcRows: any[] | null = null;
    try {
      const { data: applyData, error: applyErr } = await supabase
        .rpc('apply_order_variant_deduction' as any, { p_order_id: orderId });
      if (!applyErr) {
        // قد ترجع الدالة صفوفًا أو لا (لا يعني عدم وجود خطأ أنها نفذت شيئًا)
        rpcRows = Array.isArray(applyData) ? applyData : null;
        console.log('🛡️ محاولة خصم عبر الدالة الآمنة - rows:', rpcRows?.length ?? 0);
        // سنعد rpcApplied مبدئيًا true، لكن سنؤكد لاحقًا بعد الفحص أن جميع العناصر تم تعليمها
        rpcApplied = true;
      } else {
        console.warn('⚠️ فشل apply_order_variant_deduction، سنتابع بالخطة الحالية:', applyErr?.message || applyErr);
      }
    } catch (e) {
      console.warn('⚠️ استثناء أثناء استدعاء apply_order_variant_deduction، سنتابع بالخطة الحالية:', (e as any)?.message || e);
    }

    // 1) جلب عناصر الطلبية لتحديد الفيرنتات المتأثرة
    const { data: items, error: fetchError } = await supabase
      .from('order_items')
      .select('id, variant_id, quantity, is_free, stock_deducted')
      .eq('order_id', orderId);
    if (fetchError) throw fetchError;
    console.log('📝 عناصر الطلبية (order_items) المسترجعة لهذا الطلب:', items);
    const target = (items || []).filter(
      (it) => it.variant_id && !it.is_free && !it.stock_deducted
    ) as Array<{ id: string; variant_id: string; quantity: number }>;
    const allVariantIds = Array.from(new Set((items || []).map((it: any) => it.variant_id).filter(Boolean))) as string[];

    // إذا نجح مسار ال-RPC بالفعل ولم يتبق عناصر بحاجة للخصم، لا نكرر الخصم؛ فقط نزامن ونخرج
    if (rpcApplied && target.length === 0) {
      console.log('✅ تأكيد: لا توجد عناصر بحاجة للخصم بعد استدعاء الدالة الآمنة. سيتم الاكتفاء بالمزامنة.');
      await refreshParentProductStockForVariants(allVariantIds);
      return { success: true, processed: 'rpc', variants: allVariantIds.length } as any;
    }

    if (target.length === 0) {
      console.log('ℹ️ لا توجد عناصر فيرنتس بحاجة لخصم المخزون');
      return { success: true, processed: 0 };
    }

    // 2) تجميع حسب variant_id
    const byVariant = new Map<string, { totalQty: number; rowIds: string[] }>();
  for (const it of target) {
      const entry = byVariant.get(it.variant_id) || { totalQty: 0, rowIds: [] };
      entry.totalQty += Number(it.quantity || 0);
      entry.rowIds.push(it.id);
      byVariant.set(it.variant_id, entry);
    }

  console.log('📦 التجميع حسب الفيرنت:', Array.from(byVariant.entries()).map(([vid, v]) => ({ variantId: vid, totalQty: v.totalQty, rows: v.rowIds.length })));

  // 3) خصم لكل فيرنت (خطة بديلة إذا لم تؤكد الدالة الآمنة الخصم)
    let ok = 0; let fail = 0; const results: any[] = [];
    for (const [variantId, { totalQty, rowIds }] of byVariant.entries()) {
      try {
        // استدعاء الدالة المخزنة لخصم مخزون الفيرنت
        const { error: rpcError } = await supabase.rpc('decrease_variant_stock' as any, {
          variant_id: variantId,
          quantity: totalQty,
        });

        // في حال فشل الـ RPC (مثلاً بسبب RLS)، ننفذ خطة بديلة بتحديث مباشر
        if (rpcError) {
          console.warn(`⚠️ decrease_variant_stock RPC فشل للفيرنت ${variantId}، سنحاول التحديث المباشر.`, rpcError?.message || rpcError);
          const { data: variant, error: fetchErr } = await supabase
            .from('product_variants')
            .select('stock_quantity')
            .eq('id', variantId)
            .single();
          if (fetchErr) throw fetchErr;
          const current = Number(variant?.stock_quantity || 0);
          const newStock = Math.max(0, current - Number(totalQty || 0));
          const { error: directUpdErr } = await supabase
            .from('product_variants')
            .update({ stock_quantity: newStock })
            .eq('id', variantId);
          if (directUpdErr) throw directUpdErr;
        }

        // تعليم صفوف العناصر بأنها خُصمت
        const { error: updError } = await supabase
          .from('order_items')
          .update({ stock_deducted: true })
          .in('id', rowIds);
        if (updError) throw updError;
        ok++;
        results.push({ variantId, deducted: totalQty, rows: rowIds.length });
      } catch (e: any) {
        console.error(`❌ فشل خصم مخزون الفيرنت ${variantId}:`, e?.message || e);
        fail++;
        results.push({ variantId, error: e?.message || String(e) });
      }
    }

    console.log(`📊 نتائج خصم مخزون الفيرنتس: نجح ${ok}، فشل ${fail}`);
  // مزامنة مخزون المنتج الأب (products.stock_quantity) ليعكس مجموع الفيرنتس
  await refreshParentProductStockForVariants(Array.from(byVariant.keys()));
  return { success: fail === 0, ok, fail, results };
  } catch (error) {
    console.error('❌ خطأ عام في خصم مخزون الفيرنتس:', error);
    return { success: false, error: 'خطأ في خصم مخزون الفيرنتس' };
  }
}

/**
 * إرجاع مخزون الفيرنتس لعناصر الطلبية عند الإلغاء/الحذف (مرة واحدة)
 * Restore variant stock for order items on cancel/delete (idempotent using stock_deducted)
 */
export async function restoreVariantItemsStockForOrder(orderId: string) {
  try {
    console.log(`🧩 إرجاع مخزون الفيرنتس للطلبية: ${orderId}`);

    // 0) محاولة الإرجاع عبر دالة آمنة على الخادم (تتجاوز RLS)
    let rpcRestored = false;
    try {
      const { data: restoreData, error: restoreErr } = await supabase
        .rpc('restore_order_variant_stock' as any, { p_order_id: orderId });
      if (!restoreErr) {
        console.log('🛡️ تم إرجاع مخزون الفيرنتس عبر الدالة الآمنة:', restoreData);
        rpcRestored = true;
      } else {
        console.warn('⚠️ فشل restore_order_variant_stock، سنتابع بالخطة الحالية:', restoreErr?.message || restoreErr);
      }
    } catch (e) {
      console.warn('⚠️ استثناء أثناء استدعاء restore_order_variant_stock، سنتابع بالخطة الحالية:', (e as any)?.message || e);
    }

    // 1) جلب عناصر الطلبية لتحديد الفيرنتات المتأثرة
    const { data: items, error: fetchError } = await supabase
      .from('order_items')
      .select('id, variant_id, quantity, is_free, stock_deducted')
      .eq('order_id', orderId);
    if (fetchError) throw fetchError;

    const target = (items || []).filter(
      (it) => it.variant_id && !it.is_free && it.stock_deducted
    ) as Array<{ id: string; variant_id: string; quantity: number }>;
    const allVariantIds = Array.from(new Set((items || []).map((it: any) => it.variant_id).filter(Boolean))) as string[];

    // إذا نجح مسار ال-RPC، لا نكرر الإرجاع؛ فقط نزامن مخزون المنتج الأب من الفيرنتس ونخرج
    if (rpcRestored) {
      await refreshParentProductStockForVariants(allVariantIds);
      return { success: true, processed: 'rpc', variants: allVariantIds.length } as any;
    }

    if (target.length === 0) {
      console.log('ℹ️ لا توجد عناصر فيرنتس بحاجة لإرجاع المخزون');
      return { success: true, processed: 0 };
    }

    // 2) تجميع حسب variant_id
    const byVariant = new Map<string, { totalQty: number; rowIds: string[] }>();
    for (const it of target) {
      const entry = byVariant.get(it.variant_id) || { totalQty: 0, rowIds: [] };
      entry.totalQty += Number(it.quantity || 0);
      entry.rowIds.push(it.id);
      byVariant.set(it.variant_id, entry);
    }

    // 3) إرجاع المخزون عبر تحديث القيمة الحالية + الكمية المرجّعة
    let ok = 0; let fail = 0; const results: any[] = [];
    for (const [variantId, { totalQty, rowIds }] of byVariant.entries()) {
      try {
        // جلب المخزون الحالي للفيرنت
        const { data: variant, error: varErr } = await supabase
          .from('product_variants')
          .select('stock_quantity')
          .eq('id', variantId)
          .single();
        if (varErr) throw varErr;
        const current = Number(variant?.stock_quantity || 0);
        const newStock = current + Number(totalQty || 0);

        // تحديث عبر الدالة المخزنة (أو بديلًا via update)
        const { error: rpcError } = await supabase.rpc('update_variant_stock' as any, {
          variant_id: variantId,
          stock_quantity: newStock,
        });
        // في حال فشل الـ RPC (مثلاً بسبب RLS)، ننفذ تحديثًا مباشرًا كخطة بديلة
        if (rpcError) {
          console.warn(`⚠️ update_variant_stock RPC فشل للفيرنت ${variantId}، سنحاول التحديث المباشر.`, rpcError?.message || rpcError);
          const { error: directUpdErr } = await supabase
            .from('product_variants')
            .update({ stock_quantity: newStock })
            .eq('id', variantId);
          if (directUpdErr) throw directUpdErr;
        }

        // تعليم صفوف العناصر بأنها لم تعد مخصومة
        const { error: updError } = await supabase
          .from('order_items')
          .update({ stock_deducted: false })
          .in('id', rowIds);
        if (updError) throw updError;
        ok++;
        results.push({ variantId, restored: totalQty, rows: rowIds.length });
      } catch (e: any) {
        console.error(`❌ فشل إرجاع مخزون الفيرنت ${variantId}:`, e?.message || e);
        fail++;
        results.push({ variantId, error: e?.message || String(e) });
      }
    }

    console.log(`📊 نتائج إرجاع مخزون الفيرنتس: نجح ${ok}، فشل ${fail}`);
    // مزامنة مخزون المنتج الأب (products.stock_quantity) ليعكس مجموع الفيرنتس
    await refreshParentProductStockForVariants(Array.from(byVariant.keys()));
    return { success: fail === 0, ok, fail, results };
  } catch (error) {
    console.error('❌ خطأ عام في إرجاع مخزون الفيرنتس:', error);
    return { success: false, error: 'خطأ في إرجاع مخزون الفيرنتس' };
  }
}

/**
 * مزامنة stock_quantity في جدول المنتجات ليعكس مجموع مخزون الفيرنتس
 */
async function refreshParentProductStockForVariants(variantIds: string[]) {
  try {
    if (!variantIds || variantIds.length === 0) return;
    // جلب product_id لكل variant
    const { data: variants, error: vErr } = await supabase
      .from('product_variants')
      .select('id, product_id')
      .in('id', variantIds);
    if (vErr) {
      console.warn('⚠️ فشل جلب product_id للفيريئنتس للمزامنة:', vErr?.message || vErr);
      return;
    }
    const productIds = Array.from(new Set((variants || []).map((v: any) => v?.product_id).filter(Boolean)));
    for (const pid of productIds) {
      // جمع المجموع من جميع الفيرنتس لهذا المنتج
      const { data: sumData, error: sErr } = await supabase
        .from('product_variants')
        .select('stock_quantity, id')
        .eq('product_id', pid);
      if (sErr) {
        console.warn(`⚠️ فشل جلب مجموع مخزون الفيرنتس للمنتج ${pid}:`, sErr?.message || sErr);
        continue;
      }
      const total = (sumData || []).reduce((acc: number, row: any) => acc + Number(row?.stock_quantity || 0), 0);
      // تحديث المنتج لعرض المجموع على مستوى المنتج (لأغراض العرض في لوحات الأدمن)
      const { error: updErr } = await supabase
        .from('products')
        .update({ stock_quantity: total, in_stock: total > 0 })
        .eq('id', pid);
      if (updErr) {
        console.warn(`⚠️ فشل تحديث stock_quantity للمنتج ${pid}:`, updErr?.message || updErr);
      } else {
        console.log(`🔄 تمت مزامنة stock_quantity للمنتج ${pid} = ${total}`);
      }
    }
  } catch (e) {
    console.warn('⚠️ فشل مزامنة مخزون المنتج من الفيرنتس:', (e as any)?.message || e);
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
        if (change.variantId) {
          // خصم من الفيرنت مباشرة
          try {
            const { error: rpcError } = await supabase.rpc('decrease_variant_stock' as any, { variant_id: change.variantId, quantity: change.quantityDiff });
            if (rpcError) {
              console.warn(`⚠️ RPC decrease_variant_stock فشل للفيرنت ${change.variantId}, سنحاول التحديث المباشر.`, rpcError?.message || rpcError);
              const { data: variant, error: vErr } = await supabase.from('product_variants').select('stock_quantity').eq('id', change.variantId).single();
              if (vErr) throw vErr;
              const current = Number(variant?.stock_quantity || 0);
              const newStock = Math.max(0, current - Number(change.quantityDiff || 0));
              const { error: updErr } = await supabase.from('product_variants').update({ stock_quantity: newStock }).eq('id', change.variantId);
              if (updErr) throw updErr;
            }
            results.push({ success: true, operation: 'deduct', variantId: change.variantId, quantity: change.quantityDiff });
          } catch (e: any) {
            results.push({ success: false, error: e?.message || String(e), variantId: change.variantId });
          }
        } else {
          const res = await updateProductStock(change.productId, change.quantityDiff, `edit:${orderId}`);
          results.push({ ...res, operation: 'deduct', productId: change.productId });
        }
      } else if (change.quantityDiff < 0) {
        // إرجاع
        const restoreQty = Math.abs(change.quantityDiff);
        if (change.variantId) {
          try {
            // إرجاع مخزون الفيرنت
            const { data: variant, error: vErr } = await supabase
              .from('product_variants')
              .select('stock_quantity')
              .eq('id', change.variantId)
              .single();
            if (vErr) throw vErr;
            const current = Number(variant?.stock_quantity || 0);
            const newStock = current + Number(restoreQty || 0);
            const { error: rpcError } = await supabase.rpc('update_variant_stock' as any, { variant_id: change.variantId, stock_quantity: newStock });
            if (rpcError) {
              console.warn(`⚠️ RPC update_variant_stock فشل للفيرنت ${change.variantId}, سنحاول التحديث المباشر.`, rpcError?.message || rpcError);
              const { error: updErr } = await supabase.from('product_variants').update({ stock_quantity: newStock }).eq('id', change.variantId);
              if (updErr) throw updErr;
            }
            results.push({ success: true, operation: 'restore', variantId: change.variantId, quantity: restoreQty });
          } catch (e: any) {
            results.push({ success: false, error: e?.message || String(e), variantId: change.variantId });
          }
        } else {
          const res = await restoreProductStock(change.productId, restoreQty, `edit:${orderId}`);
          results.push({ ...res, operation: 'restore', productId: change.productId });
        }
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
 * استخراج المنتجات المجانية من بيانات الطلبية (مع دعم variant_id إن وجد)
 */
function extractFreeProductsFromOrderData(appliedOffers?: any, freeItems?: any) {
  type Key = string; // productId|variantId (variant-aware key)
  const products = new Map<Key, { productId: string; variantId?: string | null; quantity: number }>();
  const safeParse = (raw: any) => { try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return null; } };

  const push = (pid?: any, qty?: any, vid?: any) => {
    const productId = String(pid || '').trim();
    const variantId = vid ? String(vid).trim() : undefined;
    const q = Number(qty || 0);
    if (!productId || q <= 0) return;
    const key = variantId ? `${productId}__${variantId}` : productId;
    const prev = products.get(key) || { productId, variantId, quantity: 0 };
    prev.quantity += q;
    products.set(key, prev);
  };

  // من applied_offers أولاً
  const offers = safeParse(appliedOffers);
  if (Array.isArray(offers)) {
    for (const offer of offers) {
      if (Array.isArray(offer?.freeProducts)) {
        for (const fp of offer.freeProducts) {
          push(fp?.productId ?? fp?.product_id, fp?.quantity ?? 1, fp?.variantId ?? fp?.variant_id);
        }
      }
      if (Array.isArray(offer?.freeItems)) {
        for (const fi of offer.freeItems) {
          push(fi?.productId ?? fi?.product_id, fi?.quantity ?? 1, fi?.variantId ?? fi?.variant_id);
        }
      }
    }
  }

  // fallback: من free_items فقط إذا لم نجد في applied_offers
  if (products.size === 0) {
    const free = safeParse(freeItems);
    if (Array.isArray(free)) {
      for (const it of free) {
        push(it?.productId ?? it?.product_id, it?.quantity ?? 1, it?.variantId ?? it?.variant_id);
      }
    }
  }

  return Array.from(products.values());
}

/**
 * حساب التغييرات المطلوبة في المخزون
 */
function calculateFreeProductChanges(
  oldProducts: { productId: string; variantId?: string | null; quantity: number }[],
  newProducts: { productId: string; variantId?: string | null; quantity: number }[]
) {
  const changes: Array<{ productId: string; variantId?: string | null; oldQuantity: number; newQuantity: number; quantityDiff: number; }> = [];
  const keyOf = (p: { productId: string; variantId?: string | null }) => (p.variantId ? `${p.productId}__${p.variantId}` : p.productId);
  const oldMap = new Map(oldProducts.map(p => [keyOf(p), p.quantity]));
  const newMap = new Map(newProducts.map(p => [keyOf(p), p.quantity]));
  const allIds = new Set([...oldMap.keys(), ...newMap.keys()]);
  for (const key of allIds) {
    const oldQ = oldMap.get(key) || 0;
    const newQ = newMap.get(key) || 0;
    const diff = newQ - oldQ;
    if (diff !== 0) {
      const [productId, variantId] = key.includes('__') ? key.split('__') : [key, undefined];
      changes.push({ productId, variantId, oldQuantity: oldQ, newQuantity: newQ, quantityDiff: diff });
    }
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

    // دمج وتفريد كل المصادر — تفصيل حسب الفيرنت/المنتج
    const variantAgg = new Map<string, number>();
    const productAgg = new Map<string, number>();
    const safeParse = (raw: any) => { try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return null; } };
    const push = (pid?: any, q?: any, vid?: any) => {
      const productId = String(pid || '').trim();
      const qty = Number(q || 0);
      const variantId = vid ? String(vid).trim() : '';
      if (qty <= 0) return;
      if (variantId) {
        variantAgg.set(variantId, (variantAgg.get(variantId) || 0) + qty);
      } else if (productId) {
        productAgg.set(productId, (productAgg.get(productId) || 0) + qty);
      }
    };

    // من applied_offers أولاً (freeProducts + freeItems)
    const offers = safeParse(order?.applied_offers);
    if (Array.isArray(offers)) {
      for (const off of offers) {
        if (Array.isArray(off?.freeProducts)) {
          for (const fp of off.freeProducts) push(fp?.productId ?? fp?.product_id, fp?.quantity ?? 1, fp?.variantId ?? fp?.variant_id);
        }
        if (Array.isArray(off?.freeItems)) {
          for (const fi of off.freeItems) push(fi?.productId ?? fi?.product_id, fi?.quantity ?? 1, fi?.variantId ?? fi?.variant_id);
        }
      }
    }

    // fallback: من free_items فقط إذا لم نجد شيء عبر applied_offers
    if (variantAgg.size === 0 && productAgg.size === 0) {
      const freeItems = safeParse(order?.free_items);
      if (Array.isArray(freeItems)) {
        for (const it of freeItems) push(it?.productId ?? it?.product_id, it?.quantity ?? 1, it?.variantId ?? it?.variant_id);
      }
    }

    // لا يوجد أي عناصر مجانية
    if (variantAgg.size === 0 && productAgg.size === 0) {
      console.log('ℹ️ لا توجد منتجات مجانية لإرجاعها (بعد التفريد)');
      return { success: true, message: 'لا توجد منتجات مجانية لإرجاعها' };
    }

    const results: any = { success: true, variantResults: [], productResults: [] };

    // 1) إرجاع الفيرنتس
    if (variantAgg.size > 0) {
      let ok = 0; let fail = 0; const rows: any[] = [];
      for (const [variantId, qty] of variantAgg.entries()) {
        try {
          const { data: variant, error: varErr } = await supabase
            .from('product_variants')
            .select('stock_quantity')
            .eq('id', variantId)
            .single();
          if (varErr) throw varErr;
          const current = Number(variant?.stock_quantity || 0);
          const newStock = current + Number(qty || 0);
          const { error: rpcError } = await supabase.rpc('update_variant_stock' as any, { variant_id: variantId, stock_quantity: newStock });
          if (rpcError) {
            console.warn(`⚠️ update_variant_stock RPC فشل للفيرنت ${variantId}، سنحاول التحديث المباشر.`, rpcError?.message || rpcError);
            const { error: directUpdErr } = await supabase
              .from('product_variants')
              .update({ stock_quantity: newStock })
              .eq('id', variantId);
            if (directUpdErr) throw directUpdErr;
          }
          ok++; rows.push({ variantId, restored: qty });
        } catch (e: any) {
          console.error(`❌ فشل إرجاع مخزون الفيرنت ${variantId}:`, e?.message || e);
          fail++; rows.push({ variantId, error: e?.message || String(e) });
        }
      }
      results.variantResults = { ok, fail, rows };
      await refreshParentProductStockForVariants(Array.from(variantAgg.keys()));
      if (fail > 0) results.success = false;
    }

    // 2) إرجاع المنتجات غير المعرّفة بفيرنت
    if (productAgg.size > 0) {
      const freeProductsToRestore = Array.from(productAgg.entries()).map(([product_id, quantity]) => ({ product_id, quantity }));
      const productResults: any[] = [];
      for (const item of freeProductsToRestore) {
        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select('stock_quantity, name_ar')
          .eq('id', item.product_id)
          .single();

        if (fetchError) {
          console.error(`❌ خطأ في جلب المنتج ${item.product_id}:`, fetchError);
          productResults.push({ success: false, error: fetchError.message, product_id: item.product_id });
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
          productResults.push({ success: false, error: updateError.message, product_id: item.product_id });
        } else {
          console.log(`✅ تم إرجاع مخزون ${product?.name_ar} بنجاح - من ${currentStock} إلى ${newStock}`);
          productResults.push({ success: true, product_id: item.product_id, oldStock: currentStock, newStock });
        }
      }
      const successCount = productResults.filter(r => r.success).length;
      const failCount = productResults.length - successCount;
      console.log(`📊 نتائج إرجاع المنتجات المجانية بدون فيرنت: ${successCount} نجح، ${failCount} فشل`);
      results.productResults = productResults;
      if (failCount > 0) results.success = false;
    }

    return results;

  } catch (error) {
    console.error('❌ خطأ في إرجاع المنتجات المجانية للمخزون:', error);
    return { success: false, error: 'خطأ في إرجاع المخزون' };
  }
}
