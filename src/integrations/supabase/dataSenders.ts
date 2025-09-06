// جميع دوال الإرسال أو التعديل (insert, update, delete) من Supabase
// يمنع أي استدعاء مباشر لـ supabase خارج هذا الملف
import { supabase } from "./client";
import type { Database, TablesInsert, TablesUpdate } from "./types";
import type { Banner, ContactInfo } from "./dataFetchers";

// ⬇️ خدمات المخزون والعروض (تأكّد من صحة المسار/الالياس @)
import {
  deductOrderItemsFromStock,
  processOffersStockDeduction,
  restoreFreeProductsStock,
  updateFreeProductsStockOnEdit,
  deductVariantItemsStockForOrder,
  restoreVariantItemsStockForOrder,
} from "@/services/stockService";

// مخزن مؤقت للطلبات المعلقة لمنع التكرار
const pendingCartRequests = new Map<string, Promise<boolean>>();

export async function createProfile(profile: TablesInsert<"profiles">) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .insert(profile)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error: unknown) {
    console.error("Error creating profile:", error);
    return null;
  }
}

export async function updateProfile(
  userId: string,
  updates: TablesUpdate<"profiles">,
) {
  try {
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);
    if (error) throw error;
    return true;
  } catch (error: unknown) {
    console.error("Error updating profile:", error);
    return false;
  }
}

export async function changeUserPassword(
  email: string,
  currentPassword: string,
  newPassword: string,
) {
  try {
    // تحقق من كلمة السر الحالية عبر تسجيل الدخول
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (signInError) throw signInError;
    // تغيير كلمة السر
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return true;
  } catch (error: unknown) {
    console.error("Error changing password:", error);
    throw error;
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  } catch (error: unknown) {
    console.error("Error signing in:", error);
    throw error;
  }
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  phone?: string,
) {
  try {
    // تنظيف رقم الهاتف - تحويل string فارغ إلى null
    const cleanPhone = phone && phone.trim() !== '' ? phone.trim() : null;

    console.log('Signup data:', { email, fullName, cleanPhone });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: cleanPhone
        }
      },
    });

    if (error) {
      console.error('Supabase auth error:', error);
      throw error;
    }

    console.log('Signup successful:', data);
    return data;
  } catch (error: unknown) {
    console.error("Error signing up:", error);
    throw error;
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  } catch (error: unknown) {
    console.error("Error signing out:", error);
    throw error;
  }
}

export async function addToCart(
  userId: string,
  productId: string,
  quantity: number,
  variantId?: string,
  variantAttributes?: Record<string, any>
) {
  try {
    console.log(`Adding to cart: userId=${userId}, productId=${productId}, quantity=${quantity}, variantId=${variantId}`);

    // تحقق إذا كان المنتج موجود مسبقاً (مع نفس الفيرنت إن وجد)
    let selectQuery = supabase
      .from("cart")
      .select("*")
      .eq("user_id", userId)
      .eq("product_id", productId);

    // إذا لم يوجد variantId نستخدم IS NULL بدل eq.null لتجنب خطأ UUID
    selectQuery = variantId
      ? selectQuery.eq("variant_id", variantId)
      : selectQuery.is("variant_id", null);

    const { data: existing, error: fetchError } = await selectQuery.maybeSingle();

    if (fetchError && fetchError.code !== "PGRST116") throw fetchError;

    if (existing) {
      console.log(`Product exists in cart, updating quantity: ${existing.quantity} + ${quantity} = ${existing.quantity + quantity}`);
      let updateQuery = supabase
        .from("cart")
        .update({ quantity: existing.quantity + quantity })
        .eq("user_id", userId)
        .eq("product_id", productId);

      updateQuery = variantId
        ? updateQuery.eq("variant_id", variantId)
        : updateQuery.is("variant_id", null);

      await updateQuery;
    } else {
      console.log(`Product not in cart, inserting new item with quantity: ${quantity}`);
      
      const insertData: any = { 
        user_id: userId, 
        product_id: productId, 
        quantity 
      };
      
      if (variantId) {
        insertData.variant_id = variantId;
      }
      
      if (variantAttributes) {
        insertData.variant_attributes = variantAttributes;
      }

      await supabase
        .from("cart")
        .insert(insertData);
    }
    return true;
  } catch (error: unknown) {
    console.error("Error adding to cart:", error);
    throw error;
  }
}

export async function updateCartItem(
  userId: string,
  productId: string,
  quantity: number,
  variantId?: string | null,
) {
  try {
    console.log(`Updating cart item: userId=${userId}, productId=${productId}, quantity=${quantity}, variantId=${variantId}`);

    // بناء شروط التحديث مع دعم IS NULL عند غياب الفيرنت
    let updateQuery = supabase
      .from("cart")
      .update({ quantity })
      .eq("user_id", userId)
      .eq("product_id", productId);

    updateQuery = variantId
      ? updateQuery.eq("variant_id", variantId)
      : updateQuery.is("variant_id", null);

    const { error } = await updateQuery;

    if (error) throw error;
    return true;
  } catch (error: unknown) {
    console.error("Error updating cart item:", error);
    throw error;
  }
}

export async function removeFromCart(
  userId: string, 
  productId: string, 
  variantId?: string | null
) {
  try {
    console.log(`Removing from cart: userId=${userId}, productId=${productId}, variantId=${variantId}`);

    // بناء شروط الحذف مع دعم IS NULL عند غياب الفيرنت
    let deleteQuery = supabase
      .from("cart")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId);

    deleteQuery = variantId
      ? deleteQuery.eq("variant_id", variantId)
      : deleteQuery.is("variant_id", null);

    const { error } = await deleteQuery;

    if (error) throw error;
    return true;
  } catch (error: unknown) {
    console.error("Error removing from cart:", error);
    throw error;
  }
}

export async function clearUserCart(userId: string) {
  try {
    await supabase.from("cart").delete().eq("user_id", userId);
    return true;
  } catch (error: unknown) {
    console.error("Error clearing cart:", error);
    throw error;
  }
}

export async function uploadImageToStorage(
  bucket: string,
  filePath: string,
  file: File,
) {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);
    if (error) throw error;
    return true;
  } catch (error: unknown) {
    console.error("Error uploading image:", error);
    throw error;
  }
}

export async function getPublicImageUrl(
  bucket: string,
  filePath: string,
): Promise<string> {
  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error: unknown) {
    console.error("Error getting public image url:", error);
    return "";
  }
}

export async function resendConfirmationEmail(email: string) {
  try {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    if (error) throw error;
    return true;
  } catch (error: unknown) {
    console.error("Error resending confirmation email:", error);
    throw error;
  }
}

export async function insertCategory(category: {
  name_ar: string;
  name_en: string;
  name_he: string;
  image: string;
  active: boolean;
  icon: string;
}) {
  try {
    const { data, error } = await supabase
      .from("categories")
      .insert([category], { defaultToNull: true })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error: unknown) {
    console.error("Error inserting category:", error);
    throw error;
  }
}

export async function insertProduct(product: TablesInsert<"products">) {
  try {
    const { data, error } = await supabase
      .from("products")
      .insert([product], { defaultToNull: true })
      .select();
    if (error) throw error;
    return data && data[0];
  } catch (error: unknown) {
    console.error("Error inserting product:", error);
    throw error;
  }
}

// إضافة بانر جديد
export async function addBanner(
  bannerData: Omit<Banner, "id" | "created_at">,
): Promise<boolean> {
  try {
    // تحويل الحقول الاختيارية إلى null إذا لم تكن موجودة
    const dataToInsert = {
      ...bannerData,
      subtitle_ar: bannerData.subtitle_ar ?? null,
      subtitle_en: bannerData.subtitle_en ?? null,
      subtitle_he: bannerData.subtitle_he ?? null,
      link: bannerData.link ?? null,
    };
    const { error } = await supabase.from("banners").insert([dataToInsert]);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error adding banner:", error);
    return false;
  }
}

// تعديل بانر
export async function updateBanner(
  id: string,
  bannerData: Partial<Omit<Banner, "id" | "created_at">>,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("banners")
      .update(bannerData)
      .eq("id", id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating banner:", error);
    return false;
  }
}

// حذف بانر
export async function deleteBanner(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("banners").delete().eq("id", id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting banner:", error);
    return false;
  }
}

// تفعيل/تعطيل بانر
export async function toggleBannerActive(
  id: string,
  currentStatus: boolean,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("banners")
      .update({ active: !currentStatus })
      .eq("id", id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error toggling banner active:", error);
    return false;
  }
}

// رفع صورة بانر
export async function uploadBannerImage(file: File): Promise<string> {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `banners/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error) {
    console.error("Error uploading banner image:", error);
    throw error;
  }
}

// حذف فئة
export async function deleteCategory(categoryId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", categoryId);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting category:", error);
    return false;
  }
}

// تحديث بيانات التواصل
export async function updateContactInfo(
  info: Partial<ContactInfo>,
): Promise<ContactInfo | null> {
  try {
    const { data, error } = await supabase
      .from("contact_info")
      .update({ ...info, updated_at: new Date().toISOString() })
      .order("updated_at", { ascending: false })
      .limit(1)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating contact info:", error);
    return null;
  }
}

// حذف عرض
export async function deleteOffer(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("offers").delete().eq("id", id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting offer:", error);
    throw error;
  }
}

// إضافة عرض جديد
export async function addOffer(
  offerData: Omit<Database["public"]["Tables"]["offers"]["Insert"], "id">,
): Promise<boolean> {
  try {
    const { error } = await supabase.from("offers").insert([offerData]);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error adding offer:", error);
    return false;
  }
}

// تعديل عرض
export async function updateOffer(
  id: string,
  updateData: Partial<Database["public"]["Tables"]["offers"]["Update"]>,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("offers")
      .update(updateData)
      .eq("id", id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating offer:", error);
    return false;
  }
}

// تحديث حالة الطلب
export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  userMeta?: { full_name?: string; email?: string },
) {
  try {
    const updateObj: TablesUpdate<"orders"> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (newStatus === "cancelled") {
      updateObj.cancelled_by = "admin";
      updateObj.cancelled_by_name =
        userMeta?.full_name || userMeta?.email || "أدمن";
    }

    const { error } = await supabase
      .from("orders")
      .update(updateObj)
      .eq("id", orderId);
    if (error) throw error;
  // بث حدث كتحديث فوري للإدمن (fallback عند غياب replication) مع إعادة استخدام القناة
  (supabase.getChannels?.().find((ch: any) => ch?.topic === 'realtime:orders-feed') || supabase.channel('orders-feed')).send({
      type: 'broadcast',
      event: 'order_updated',
      payload: { id: orderId, status: newStatus }
    }).catch(() => {});

    // عند الإلغاء: إرجاع المنتجات المجانية فقط مرة واحدة
    if (newStatus === "cancelled") {
      console.log(`🎁 بدء إرجاع المنتجات المجانية للطلبية الملغية: ${orderId}`);
      const freeStockResult = await restoreFreeProductsStock(orderId);
      if (freeStockResult.success) {
        console.log("✅ تم إرجاع المنتجات المجانية بنجاح");
      } else {
        console.warn("⚠️ خطأ أثناء إرجاع المنتجات المجانية:", freeStockResult.error);
      }

      // إرجاع مخزون الفيرنتس للعناصر التي تم خصمها
      try {
        await restoreVariantItemsStockForOrder(orderId);
      } catch (e) {
        console.warn("⚠️ تحذير: مشكلة في إرجاع مخزون الفيرنتس عند الإلغاء:", e);
      }

      // تحديث عدد المبيعات بعد إلغاء الطلبية
      console.log("🔄 تحديث إحصائيات المبيعات بعد إلغاء الطلبية...");
      await updateTopOrderedProducts();
      console.log("✅ تم تحديث إحصائيات المبيعات");
    }

    return true;
  } catch (err) {
    console.error("Error updating order status:", err);
    return false;
  }
}

// تحديث المنتجات الأكثر مبيعًا تلقائيًا بعد كل طلب جديد
export async function updateTopOrderedProducts() {
  try {
    console.log('🔄 بدء تحديث إحصائيات المبيعات...');

    // أولاً، دعنا نتحقق من هيكل جدول المنتجات
    const { data: sampleProduct, error: sampleError } = await supabase
      .from('products')
      .select('*')
      .limit(1)
      .single();

    if (sampleError) {
      console.error('❌ خطأ في جلب عينة المنتج:', sampleError);
    } else {
      console.log('📋 هيكل المنتج:', Object.keys(sampleProduct || {}));
      console.log('🔍 هل يحتوي على sales_count؟', 'sales_count' in (sampleProduct || {}));
    }

    // 1. احسب عدد مرات بيع كل منتج من الطلبات غير الملغاة فقط
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select(`
        product_id, 
        quantity,
        order_id
      `);

    if (orderItemsError) {
      console.error('Error fetching order_items:', orderItemsError.message);
      throw orderItemsError;
    }

    // 2. جلب معلومات الطلبات للتحقق من الحالة
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, status');

    if (ordersError) {
      console.error('Error fetching orders:', ordersError.message);
      throw ordersError;
    }

    // 3. إنشاء خريطة للطلبات وحالاتها
    const orderStatusMap = new Map();
    let cancelledOrdersCount = 0;
    orders?.forEach(order => {
      orderStatusMap.set(order.id, order.status);
      if (order.status === 'cancelled') cancelledOrdersCount++;
    });

    console.log(`📊 إجمالي الطلبات: ${orders?.length || 0}`);
    console.log(`❌ الطلبات الملغاة: ${cancelledOrdersCount}`);
    console.log(`✅ الطلبات النشطة: ${(orders?.length || 0) - cancelledOrdersCount}`);

    // 4. حساب عدد مرات بيع كل منتج (فقط من الطلبات غير الملغاة)
    const salesCount: Record<string, number> = {};
    let processedItems = 0;
    let skippedItems = 0;
    for (const item of orderItems || []) {
      if (!item.product_id || !item.order_id) continue;

      // تحقق من حالة الطلبية
      const orderStatus = orderStatusMap.get(item.order_id);
      if (orderStatus === 'cancelled') {
        skippedItems++;
        continue; // تجاهل المنتجات من الطلبات الملغاة
      }

      processedItems++;
      salesCount[item.product_id] = (salesCount[item.product_id] || 0) + (item.quantity || 0);
    }

    console.log(`📦 إجمالي عناصر الطلبات: ${orderItems?.length || 0}`);
    console.log(`✅ عناصر تم معالجتها: ${processedItems}`);
    console.log(`❌ عناصر تم تجاهلها (من طلبات ملغاة): ${skippedItems}`);
    console.log('📊 إحصائيات المبيعات المحسوبة:', Object.keys(salesCount).length, 'منتج');

    // 5. ترتيب المنتجات حسب عدد المبيعات (مع تحويل القيم إلى أرقام)
    const sorted = Object.entries(salesCount)
      .sort((a, b) => Number(b[1]) - Number(a[1]));

    console.log('🏆 أعلى 3 منتجات مبيعاً:', sorted.slice(0, 3));

    // 6. تحديث المنتجات - أولاً نحاول تحديث top_ordered فقط
    console.log('🔄 إعادة تعيين جميع المنتجات...');
    const resetResult = await supabase.from('products').update({ top_ordered: false }).neq('top_ordered', false);
    if (resetResult.error) {
      console.error('❌ خطأ في إعادة تعيين المنتجات:', resetResult.error);
    } else {
      console.log('✅ تم إعادة تعيين المنتجات بنجاح');
    }

    // 7. تحديث أفضل المنتجات - سنحدث فقط top_ordered
    console.log('🏆 تحديث أفضل 10 منتجات...');
    for (const [productId] of sorted.slice(0, 10)) {
      console.log(`- تحديث المنتج ${productId}`);
      const updateResult = await supabase.from('products')
        .update({ top_ordered: true })
        .eq('id', productId);

      if (updateResult.error) {
        console.error(`❌ فشل تحديث top_ordered للمنتج ${productId}:`, updateResult.error);
        continue;
      }

      console.log(`✅ تم تحديث top_ordered للمنتج ${productId}`);
    }

    // إعادة تعيين غير المتميّز (احتياطي، نفس القيمة false)
  const topProductIds = sorted.slice(0, 10).map(([id]) => id);
  // ملاحظة: لقيم UUID لا نضع اقتباسات داخل in(...) وإلا ستفشل بصيغة UUID
  const resetNonTopResult = topProductIds.length > 0
    ? await supabase.from('products')
      .update({ top_ordered: false })
      .not('id', 'in', `(${topProductIds.join(',')})`)
    : { error: null } as any;

    if (resetNonTopResult.error) {
      console.warn('⚠️ تحذير: فشل إعادة تعيين المنتجات غير المتميزة:', resetNonTopResult.error);
    } else {
      console.log('✅ تم إعادة تعيين المنتجات غير المتميزة');
    }

    console.log('✅ تم الانتهاء من تحديث إحصائيات المبيعات');
  } catch (error) {
    console.error('❌ خطأ في تحديث إحصائيات المبيعات:', error);
    throw error;
  }
}

// إضافة طلب جديد
export async function addOrder(
  orderInsertObj: TablesInsert<"orders">,
  orderItems: Omit<TablesInsert<"order_items">, "order_id">[],
) {
  try {
    // 1) إنشاء الطلب
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(orderInsertObj)
      .select()
      .single();
    if (orderError) throw orderError;
  // بث حدث إنشاء (مع إعادة استخدام القناة)
  (supabase.getChannels?.().find((ch: any) => ch?.topic === 'realtime:orders-feed') || supabase.channel('orders-feed')).send({
      type: 'broadcast',
      event: 'order_created',
      payload: { id: order?.id }
    }).catch(() => {});

    // 2) إدخال العناصر
    const itemsToInsert = orderItems.map((item) => ({
      ...item,
      order_id: order.id,
    }));
    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsToInsert);
    if (itemsError) throw itemsError;

    // 3) خصم المخزون للعناصر العادية مرّة واحدة
    try {
      await deductOrderItemsFromStock(itemsToInsert, order.id);
    } catch (e) {
      console.warn("⚠️ تحذير: مشكلة في خصم مخزون العناصر العادية:", e);
    }

    // 3.1) خصم مخزون الفيرنتس للعناصر غير المجانية مرة واحدة
    try {
      await deductVariantItemsStockForOrder(order.id);
    } catch (e) {
      console.warn("⚠️ تحذير: مشكلة في خصم مخزون الفيرنتس:", e);
    }

    // 4) خصم مخزون العناصر المجانية الناتجة عن العروض مرّة واحدة
    try {
      await processOffersStockDeduction(order.id, order.applied_offers as any, order.free_items as any);
    } catch (e) {
      console.warn("⚠️ تحذير: مشكلة في خصم مخزون العناصر المجانية:", e);
    }

    // 5) تحديث المنتجات الأكثر مبيعًا
    await updateTopOrderedProducts();
    return true;
  } catch (error) {
    console.error("Error adding order:", error);
    return false;
  }
}

// تعديل طلب
export async function editOrder(
  editOrderId: string,
  updateObj: TablesUpdate<"orders">,
  orderItems: Omit<TablesInsert<"order_items">, "order_id">[],
) {
  try {
    // 1) تحديث مخزون المنتجات المجانية فقط حسب الفروقات
    // (تجنّب خصم/إرجاع العناصر العادية هنا حتى لا تتضاعف)
    try {
      const freeStockUpdate = await updateFreeProductsStockOnEdit(
        editOrderId,
        updateObj.applied_offers as any,
        updateObj.free_items as any
      );
      console.log("📦 free stock on edit:", freeStockUpdate);
    } catch (e) {
      console.warn("⚠️ تحذير: مشكلة في تحديث مخزون المنتجات المجانية عند التعديل:", e);
    }

    // 2) تحديث الطلب (orders)
    const { error } = await supabase
      .from("orders")
      .update(updateObj)
      .eq("id", editOrderId);
    if (error) throw error;
  // بث حدث تحديث (مع إعادة استخدام القناة)
  (supabase.getChannels?.().find((ch: any) => ch?.topic === 'realtime:orders-feed') || supabase.channel('orders-feed')).send({
      type: 'broadcast',
      event: 'order_updated',
      payload: { id: editOrderId }
    }).catch(() => {});

    // 3) قبل حذف العناصر القديمة: إرجاع مخزون الفيرنتس القديم (إن كان قد خُصِم)
    // ملاحظة: هذه العملية تعتمد على order_items.stock_deducted=true
    try {
      console.log("🧮 Restoring previous variant stock before rebuilding order_items...");
      await restoreVariantItemsStockForOrder(editOrderId);
    } catch (e) {
      console.warn("⚠️ تحذير: فشل إرجاع مخزون الفيرنتس قبل إعادة الإدراج:", e);
    }

    // 4) إعادة بناء العناصر (حذف القديم ثم إدراج الجديد)
    await supabase.from("order_items").delete().eq("order_id", editOrderId);
    if (orderItems.length > 0) {
      const itemsToInsert = orderItems.map((item) => ({
        ...item,
        order_id: editOrderId,
      }));
      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(itemsToInsert);
      if (itemsError) throw itemsError;
    }

    // 5) بعد إدراج العناصر الجديدة: خصم مخزون الفيرنتس للعناصر الجديدة (مرة واحدة)
    try {
      console.log("🧮 Deducting variant stock for new order_items after edit...");
      await deductVariantItemsStockForOrder(editOrderId);
    } catch (e) {
      console.warn("⚠️ تحذير: فشل خصم مخزون الفيرنتس بعد التعديل:", e);
    }

    return true;
  } catch (error) {
    console.error("Error editing order:", error);
    return false;
  }
}

// حذف طلب
export async function deleteOrder(orderId: string) {
  try {
    // ✅ إرجاع المنتجات المجانية قبل الحذف (مرة واحدة)
    console.log(`🎁 بدء إرجاع المنتجات المجانية قبل حذف الطلبية: ${orderId}`);
    try {
      const freeStockResult = await restoreFreeProductsStock(orderId);
      if (freeStockResult.success) {
        console.log("✅ تم إرجاع المنتجات المجانية بنجاح قبل الحذف");
      } else {
        console.warn("⚠️ حدث خطأ في إرجاع المنتجات المجانية:", freeStockResult.error);
      }
    } catch (e) {
      console.warn("⚠️ تحذير: مشكلة أثناء إرجاع المنتجات المجانية قبل الحذف:", e);
    }

    // ✅ إرجاع مخزون الفيرنتس قبل الحذف
    try {
      await restoreVariantItemsStockForOrder(orderId);
    } catch (e) {
      console.warn("⚠️ تحذير: مشكلة أثناء إرجاع مخزون الفيرنتس قبل الحذف:", e);
    }

    // حذف العناصر المرتبطة أولاً
    const { error: itemsError } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", orderId);
    if (itemsError) throw itemsError;

    // ثم حذف الطلب نفسه
    const { error } = await supabase.from("orders").delete().eq("id", orderId);
    if (error) throw error;
  // بث حدث حذف (مع إعادة استخدام القناة)
  (supabase.getChannels?.().find((ch: any) => ch?.topic === 'realtime:orders-feed') || supabase.channel('orders-feed')).send({
      type: 'broadcast',
      event: 'order_deleted',
      payload: { id: orderId }
    }).catch(() => {});

    // تحديث عدد المبيعات بعد حذف الطلبية
    console.log("🔄 تحديث إحصائيات المبيعات بعد حذف الطلبية...");
    await updateTopOrderedProducts();
    console.log("✅ تم تحديث إحصائيات المبيعات");

    return true;
  } catch (error) {
    console.error("Error deleting order:", error);
    return false;
  }
}

// حذف منتج
export async function deleteProduct(productId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting product:", error);
    return false;
  }
}

// تعطيل/تفعيل مستخدم
export async function disableUserById(
  userId: string,
  disabled: boolean,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ disabled })
      .eq("id", userId);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error disabling/enabling user:", error);
    return false;
  }
}

// حذف مستخدم مباشرة (للاستخدام في التطوير فقط)
// هذه الدالة تحذف المستخدم من profiles فقط ولا تؤرشف البيانات
export async function deleteUserDirectly(userId: string): Promise<boolean> {
  try {
    // في وضع التطوير، نحذف المستخدم من جدول profiles مباشرة
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting user directly:", error);
    return false;
  }
}

// تسجيل نشاط الأدمن على المستخدم مع حفظ معلومات الأدمن والمستخدم
export async function logUserActivity(
  adminId: string,
  userId: string,
  action: string,
  details: Record<string, unknown> = {},
): Promise<boolean> {
  try {
    // جلب معلومات الأدمن
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", adminId)
      .single();

    // جلب معلومات المستخدم المستهدف
    let userProfile = null;
    const { data: userFromProfiles } = await supabase
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", userId)
      .single();

    if (userFromProfiles) {
      userProfile = userFromProfiles;
    } else {
      // جرب من deleted_users
      const { data: userFromDeleted } = await supabase
        .from("deleted_users")
        .select("full_name, email, phone")
        .eq("user_id", userId)
        .single();
      if (userFromDeleted) {
        userProfile = userFromDeleted;
      }
    }

    const { error } = await supabase.from("user_activity_log").insert([
      {
        admin_id: adminId,
        user_id: userId,
        action,
        details: details as any,
        admin_name: adminProfile?.full_name || null,
        admin_email: adminProfile?.email || null,
        admin_phone: adminProfile?.phone || null,
        target_user_name: userProfile?.full_name || null,
        target_user_email: userProfile?.email || null,
        target_user_phone: userProfile?.phone || null,
        created_at: new Date().toISOString(),
      },
    ]);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error logging user activity:", error);
    return false;
  }
}

// تسجيل تحديث محدد مع القيم القديمة والجديدة وحفظ معلومات الأدمن والمستخدم
export async function logUserUpdateActivity(
  adminId: string,
  userId: string,
  fieldName: string,
  oldValue: string | null,
  newValue: string | null,
  details: Record<string, unknown> = {},
): Promise<boolean> {
  try {
    // جلب معلومات الأدمن
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", adminId)
      .single();

    // جلب معلومات المستخدم المستهدف
    let userProfile = null;
    const { data: userFromProfiles } = await supabase
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", userId)
      .single();

    if (userFromProfiles) {
      userProfile = userFromProfiles;
    } else {
      // جرب من deleted_users
      const { data: userFromDeleted } = await supabase
        .from("deleted_users")
        .select("full_name, email, phone")
        .eq("user_id", userId)
        .single();
      if (userFromDeleted) {
        userProfile = userFromDeleted;
      }
    }

    const { error } = await supabase.from("user_activity_log").insert([
      {
        admin_id: adminId,
        user_id: userId,
        action: 'update',
        target_field: fieldName,
        old_value: oldValue?.toString() || null,
        new_value: newValue?.toString() || null,
        details: details as any,
        admin_name: adminProfile?.full_name || null,
        admin_email: adminProfile?.email || null,
        admin_phone: adminProfile?.phone || null,
        target_user_name: userProfile?.full_name || null,
        target_user_email: userProfile?.email || null,
        target_user_phone: userProfile?.phone || null,
        created_at: new Date().toISOString(),
      },
    ]);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error logging user update activity:", error);
    return false;
  }
}

// تسجيل عدة تحديثات في عملية واحدة
export async function logMultipleUserUpdates(
  adminId: string,
  userId: string,
  changes: Array<{
    field: string;
    oldValue: string | null;
    newValue: string | null;
  }>,
  details: Record<string, unknown> = {},
): Promise<boolean> {
  try {
    const logs = changes.map(change => ({
      admin_id: adminId,
      user_id: userId,
      action: 'update',
      target_field: change.field,
      old_value: change.oldValue?.toString() || null,
      new_value: change.newValue?.toString() || null,
      details: {
        ...details,
        batch_update: true,
        total_changes: changes.length,
      } as any,
      created_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("user_activity_log").insert(logs);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error logging multiple user updates:", error);
    return false;
  }
}

// إلغاء طلب من قبل المستخدم
export async function cancelUserOrder(
  orderId: string,
  userMeta: { full_name?: string; email?: string; displayName?: string },
): Promise<boolean> {
  try {
    const updateObj = {
      status: "cancelled",
      cancelled_by: "user",
      cancelled_by_name:
        userMeta.full_name || userMeta.email || userMeta.displayName || "user",
    };

    const { error } = await supabase
      .from("orders")
      .update(updateObj)
      .eq("id", orderId);
    if (error) throw error;

    // إرجاع المنتجات المجانية عند إلغاء الطلبية من قبل المستخدم (مرة واحدة)
    console.log(`🎁 بدء إرجاع المنتجات المجانية للطلبية الملغية من قبل المستخدم: ${orderId}`);
    try {
      const freeStockResult = await restoreFreeProductsStock(orderId);
      if (freeStockResult.success) {
        console.log("✅ تم إرجاع المنتجات المجانية بنجاح");
      } else {
        console.warn("⚠️ حدث خطأ في إرجاع المنتجات المجانية:", freeStockResult.error);
      }
    } catch (e) {
      console.warn("⚠️ تحذير: مشكلة أثناء إرجاع المنتجات المجانية:", e);
    }

    // إرجاع مخزون الفيرنتس للعناصر التي تم خصمها
    try {
      await restoreVariantItemsStockForOrder(orderId);
    } catch (e) {
      console.warn("⚠️ تحذير: مشكلة أثناء إرجاع مخزون الفيرنتس:", e);
    }

    // تحديث عدد المبيعات بعد إلغاء الطلبية من قبل المستخدم
    console.log('🔄 تحديث إحصائيات المبيعات بعد إلغاء الطلبية من قبل المستخدم...');
    await updateTopOrderedProducts();
    console.log('✅ تم تحديث إحصائيات المبيعات');

    return true;
  } catch (error) {
    console.error("Error cancelling user order:", error);
    return false;
  }
}

// جلب المنتجات الأكثر مبيعًا (top_ordered)
export async function fetchTopOrderedProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('top_ordered', true)
    .order('sales_count', { ascending: false });
  if (error) {
    console.error('Error fetching top ordered products:', error.message);
    return [];
  }
  return data || [];
}

// تعيين كمية محددة في السلة بدلاً من الإضافة
export async function setCartQuantity(
  userId: string,
  productId: string,
  quantity: number,
  variantId?: string | null,
  variantAttributes?: Record<string, any> | null,
) {
  const requestKey = `${userId}-${productId}-${variantId ?? 'no-variant'}`;

  // إذا كان هناك طلب معلق لنفس المستخدم والمنتج، انتظره
  if (pendingCartRequests.has(requestKey)) {
    return await pendingCartRequests.get(requestKey)!;
  }

  const requestPromise = async (): Promise<boolean> => {
    try {
      console.log(`Setting cart quantity: userId=${userId}, productId=${productId}, quantity=${quantity}`);

      if (quantity <= 0) {
        // إذا كانت الكمية 0 أو أقل، احذف المنتج
        await removeFromCart(userId, productId, variantId ?? undefined);
        return true;
      }

      // تحقق إذا كان المنتج موجود مسبقاً (حسب الفيرنت إن وجد)
      let selectQ = supabase
        .from("cart")
        .select("*")
        .eq("user_id", userId)
        .eq("product_id", productId);

      selectQ = variantId ? selectQ.eq("variant_id", variantId) : selectQ.is("variant_id", null);

      const { data: existing, error: fetchError } = await selectQ.maybeSingle();

      if (fetchError && fetchError.code !== "PGRST116") throw fetchError;

      if (existing) {
        console.log(`Product exists, setting quantity to: ${quantity}`);
        let updQ = supabase
          .from("cart")
          .update({ quantity })
          .eq("user_id", userId)
          .eq("product_id", productId);
        updQ = variantId ? updQ.eq("variant_id", variantId) : updQ.is("variant_id", null);
        await updQ;
      } else {
        console.log(`Product not in cart, inserting with quantity: ${quantity}`);
        const insertData: any = { user_id: userId, product_id: productId, quantity };
        if (variantId) insertData.variant_id = variantId;
        if (variantAttributes) insertData.variant_attributes = variantAttributes;
        await supabase
          .from("cart")
          .insert(insertData);
      }
      return true;
    } catch (error: unknown) {
      console.error("Error setting cart quantity:", error);
      throw error;
    } finally {
      // إزالة الطلب من المخزن المؤقت
      pendingCartRequests.delete(requestKey);
    }
  };

  const promise = requestPromise();
  pendingCartRequests.set(requestKey, promise);

  return await promise;
}
