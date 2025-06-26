import React, { useEffect, useState } from "react";
import { AddressService } from "@/services/supabaseService";
import { useAuth } from "@/contexts/useAuth";
import { useLanguage } from "@/utils/languageContextUtils";

interface Address {
  id: string;
  full_name: string;
  phone: string;
  city: string;
  area: string;
  street: string;
  building: string;
  floor?: string;
  apartment?: string;
}

interface AddressSelectorProps {
  value: Address | null;
  onChange: (address: Address) => void;
  userId?: string; // إضافة prop جديد
  disabled?: boolean; // دعم تعطيل العنصر
}

const AddressSelector: React.FC<AddressSelectorProps> = ({ value, onChange, userId, disabled }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<string>(value?.id || "");

  useEffect(() => {
    const idToFetch = userId || user?.id;
    if (idToFetch) {
      AddressService.getUserAddresses(idToFetch).then((data) => {
        setAddresses(data);
      });
    } else {
      setAddresses([]);
    }
  }, [userId, user?.id]);

  useEffect(() => {
    setSelectedId(value?.id || "");
  }, [value?.id]);

  // دالة تحقق من صحة رقم الهاتف
  function isValidPhone(phone: string) {
    return /^05\d{8}$/.test(phone);
  }

  return (
    <div className="mb-2">
      {/* إظهار قائمة العناوين فقط إذا كان هناك userId (عميل محدد) */}
      {userId && addresses.length > 0 && (
        <>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("chooseSavedAddress") || "اختر عنوان محفوظ"}
          </label>
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            value={selectedId}
            onChange={e => {
              const val = e.target.value;
              setSelectedId(val);
              if (!val) {
                // عند الضغط على placeholder فقط
                onChange({
                  id: "",
                  full_name: "",
                  phone: "",
                  city: "",
                  area: "",
                  street: "",
                  building: "",
                  floor: "",
                  apartment: "",
                });
              } else {
                const addr = addresses.find((a) => a.id === val);
                if (addr) {
                  onChange(addr);
                }
              }
            }}
            disabled={disabled}
          >
            <option value="">{t("chooseAddressPlaceholder") || "اختر عنوان..."}</option>
            {addresses.map(addr => (
              <option key={addr.id} value={addr.id}>
                {addr.full_name} - {addr.city} - {addr.street}
              </option>
            ))}
          </select>
        </>
      )}
      {/* إذا كان هناك userId ولا يوجد عناوين */}
      {userId && addresses.length === 0 && (
        <div className="text-gray-500 text-sm py-2">
          {t("noAddressesFound") || "لا يوجد عناوين محفوظة لهذا العميل"}
        </div>
      )}
    </div>
  );
};

export type { Address };
export default AddressSelector;
