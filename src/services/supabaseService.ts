// src/services/supabaseService.ts

// خدمات منفصلة لكل جزء
export { AuthService } from "./supabase/authService";
export { ProfileService } from "./supabase/profileService";
export { CategoryService } from "./supabase/categoryService";
export { ProductService } from "./supabase/productService";
export { BannerService } from "./supabase/bannerService";
export { CartService } from "./supabase/cartService";
export { FavoriteService } from "./supabase/favoriteService";
export { AddressService } from "./supabase/addressService";

// دعم HMR لـ Vite (يجب أن يعمل فقط في بيئة Vite/ESM)
if (typeof import.meta !== "undefined" && import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    // لا موارد تحتاج تنظيف هنا
  });
}
