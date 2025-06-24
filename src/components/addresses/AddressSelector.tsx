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
}

const AddressSelector: React.FC<AddressSelectorProps> = ({ value, onChange }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    if (user?.id) {
      AddressService.getUserAddresses(user.id).then((data) => {
        setAddresses(data);
      });
    }
  }, [user?.id]);

  // دالة تحقق من صحة رقم الهاتف
  function isValidPhone(phone: string) {
    return /^05\d{8}$/.test(phone);
  }

  return (
    <div className="mb-2">
      {addresses.length > 0 && (
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
                  // تحقق من صحة رقم الهاتف قبل تمريره
                  if (!isValidPhone(addr.phone)) {
                    alert(t("invalidPhone") || "رقم الهاتف غير صحيح، يجب أن يبدأ بـ 05 ويتكون من 10 أرقام");
                    return;
                  }
                  onChange(addr);
                }
              }
            }}
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
    </div>
  );
};

export type { Address };
export default AddressSelector;
