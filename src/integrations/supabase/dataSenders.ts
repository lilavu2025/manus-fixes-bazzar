// جميع دوال الإرسال أو التعديل (insert, update, delete) من Supabase
// يمنع أي استدعاء مباشر لـ supabase خارج هذا الملف
import { supabase } from "./client";
import type { Database, TablesInsert, TablesUpdate } from "./types";
import type { Banner, ContactInfo } from "./dataFetchers";
import type { Json } from "./types";

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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone: phone || "" } },
    });
    if (error) throw error;
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
) {
  try {
    // تحقق إذا كان المنتج موجود مسبقاً
    const { data: existing, error: fetchError } = await supabase
      .from("cart")
      .select("*")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .maybeSingle();
    if (fetchError && fetchError.code !== "PGRST116") throw fetchError;
    if (existing) {
      await supabase
        .from("cart")
        .update({ quantity: existing.quantity + quantity })
        .eq("user_id", userId)
        .eq("product_id", productId);
    } else {
      await supabase
        .from("cart")
        .insert({ user_id: userId, product_id: productId, quantity });
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
) {
  try {
    await supabase
      .from("cart")
      .update({ quantity })
      .eq("user_id", userId)
      .eq("product_id", productId);
    return true;
  } catch (error: unknown) {
    console.error("Error updating cart item:", error);
    throw error;
  }
}

export async function removeFromCart(userId: string, productId: string) {
  try {
    await supabase
      .from("cart")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId);
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
    return false;
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
    return true;
  } catch (err) {
    console.error("Error updating order status:", err);
    return false;
  }
}

// إضافة طلب جديد
export async function addOrder(
  orderInsertObj: TablesInsert<"orders">,
  orderItems: Omit<TablesInsert<"order_items">, "order_id">[],
) {
  try {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(orderInsertObj)
      .select()
      .single();
    if (orderError) throw orderError;
    const itemsToInsert = orderItems.map((item) => ({
      ...item,
      order_id: order.id,
    }));
    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsToInsert);
    if (itemsError) throw itemsError;
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
    const { error } = await supabase
      .from("orders")
      .update(updateObj)
      .eq("id", editOrderId);
    if (error) throw error;
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
    return true;
  } catch (error) {
    console.error("Error editing order:", error);
    return false;
  }
}

// حذف طلب
export async function deleteOrder(orderId: string) {
  try {
    // حذف العناصر المرتبطة أولاً
    const { error: itemsError } = await supabase.from("order_items").delete().eq("order_id", orderId);
    if (itemsError) throw itemsError;
    // ثم حذف الطلب نفسه
    const { error } = await supabase.from("orders").delete().eq("id", orderId);
    if (error) throw error;
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

// تسجيل نشاط الأدمن على المستخدم
export async function logUserActivity(
  adminId: string,
  userId: string,
  action: string,
  details: Record<string, unknown> = {},
): Promise<boolean> {
  try {
    const { error } = await supabase.from("user_activity_log").insert([
      {
        admin_id: adminId,
        user_id: userId,
        action,
        details: details as Json,
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
    return true;
  } catch (error) {
    console.error("Error cancelling user order:", error);
    return false;
  }
}
