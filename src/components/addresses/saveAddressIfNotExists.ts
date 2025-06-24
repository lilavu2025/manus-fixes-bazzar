import { AddressService } from "@/services/supabaseService";

export interface SaveAddressInput {
  userId: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    city: string;
    area: string;
    street: string;
    building: string;
    floor?: string;
    apartment?: string;
  };
}

/**
 * يحفظ العنوان للمستخدم إذا لم يكن موجودًا مسبقًا.
 */
export async function saveAddressIfNotExists({ userId, shippingAddress }: SaveAddressInput) {
  const addresses = await AddressService.getUserAddresses(userId);
  const exists = addresses.some(addr =>
    addr.full_name === shippingAddress.fullName &&
    addr.phone === shippingAddress.phone &&
    addr.city === shippingAddress.city &&
    addr.area === shippingAddress.area &&
    addr.street === shippingAddress.street &&
    addr.building === shippingAddress.building
  );
  if (!exists) {
    await AddressService.createAddress(userId, {
      full_name: shippingAddress.fullName,
      phone: shippingAddress.phone,
      city: shippingAddress.city,
      area: shippingAddress.area,
      street: shippingAddress.street,
      building: shippingAddress.building,
      floor: shippingAddress.floor,
      apartment: shippingAddress.apartment,
      is_default: false,
    });
    return true;
  }
  return false;
}
