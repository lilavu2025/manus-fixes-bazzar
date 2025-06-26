import * as React from "react";
import { useState } from "react";
import { useLanguage } from "@/utils/languageContextUtils";
import { useAddresses } from "@/hooks/useAddresses";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";

interface AddAddressDialogProps {
  trigger?: React.ReactNode;
}

const AddAddressDialog: React.FC<AddAddressDialogProps> = ({ trigger }) => {
  const { t, isRTL } = useLanguage();
  const { createAddress, isCreating } = useAddresses();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    city: "",
    area: "",
    street: "",
    building: "",
    floor: "",
    apartment: "",
    is_default: false,
  });

  // دالة تحقق من صحة رقم الهاتف
  function isValidPhone(phone: string) {
    return /^05\d{8}$/.test(phone);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhone(formData.phone)) {
      alert(t("invalidPhone") || "رقم الجوال يجب أن يبدأ بـ 05 ويكون مكونًا من 10 أرقام");
      return;
    }
    // تحويل الحقول الفارغة إلى undefined
    const cleanData = Object.fromEntries(
      Object.entries(formData).map(([k, v]) => [k, v === "" ? undefined : v]),
    ) as unknown as Omit<
      import("@/hooks/useAddresses").Address,
      "id" | "user_id"
    >;
    try {
      await new Promise((resolve, reject) => {
        createAddress(cleanData, {
          onSuccess: resolve,
          onError: reject,
        });
      });
      setFormData({
        full_name: "",
        phone: "",
        city: "",
        area: "",
        street: "",
        building: "",
        floor: "",
        apartment: "",
        is_default: false,
      });
      setOpen(false);
    } catch (err) {
      // يمكن عرض رسالة خطأ هنا إذا رغبت
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            {t("addAddress")}
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className={`max-w-md ${isRTL ? "text-right" : "text-left"}`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-1 text-primary text-center">
            {t("addNewAddress")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">{t("fullName")}</Label>
              <Input
                id="full_name"
                name="full_name"
                autoComplete="name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    full_name: e.target.value,
                  }))
                }
                required
                className={isRTL ? "text-right" : "text-left"}
                dir={isRTL ? "rtl" : "ltr"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                required
                className={isRTL ? "text-right" : "text-left"}
                dir={isRTL ? "rtl" : "ltr"}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">{t("city")}</Label>
              <Input
                id="city"
                name="city"
                autoComplete="address-level2"
                value={formData.city}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, city: e.target.value }))
                }
                required
                className={isRTL ? "text-right" : "text-left"}
                dir={isRTL ? "rtl" : "ltr"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area">{t("area")}</Label>
              <Input
                id="area"
                name="area"
                autoComplete="address-level3"
                value={formData.area}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, area: e.target.value }))
                }
                required
                className={isRTL ? "text-right" : "text-left"}
                dir={isRTL ? "rtl" : "ltr"}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="street">{t("street")}</Label>
            <Input
              id="street"
              name="street"
              autoComplete="street-address"
              value={formData.street}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, street: e.target.value }))
              }
              required
              className={isRTL ? "text-right" : "text-left"}
              dir={isRTL ? "rtl" : "ltr"}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="building">{t("building")}</Label>
              <Input
                id="building"
                name="building"
                autoComplete="address-line2"
                value={formData.building}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, building: e.target.value }))
                }
                required
                className={isRTL ? "text-right" : "text-left"}
                dir={isRTL ? "rtl" : "ltr"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floor">{t("floor")}</Label>
              <Input
                id="floor"
                name="floor"
                autoComplete="off"
                value={formData.floor}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, floor: e.target.value }))
                }
                className={isRTL ? "text-right" : "text-left"}
                dir={isRTL ? "rtl" : "ltr"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apartment">{t("apartment")}</Label>
              <Input
                id="apartment"
                name="apartment"
                autoComplete="off"
                value={formData.apartment}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    apartment: e.target.value,
                  }))
                }
                className={isRTL ? "text-right" : "text-left"}
                dir={isRTL ? "rtl" : "ltr"}
              />
            </div>
          </div>

          <div
            className={`flex items-center space-x-2 ${isRTL ? "flex-row-reverse space-x-reverse" : ""}`}
          >
            <Checkbox
              id="is_default"
              checked={formData.is_default}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  is_default: checked as boolean,
                }))
              }
            />
            <Label
              htmlFor="is_default"
              className={isRTL ? "text-right" : "text-left"}
            >
              {t("setAsDefault")}
            </Label>
          </div>

          <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? t("loading") : t("addAddress")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAddressDialog;
