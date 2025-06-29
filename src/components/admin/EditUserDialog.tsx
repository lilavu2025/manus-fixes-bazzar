import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { toast } from "sonner";
import EditUserDialogHeader from "./edit-user/EditUserDialogHeader";
import UserInfoDisplay from "./edit-user/UserInfoDisplay";
import EditUserForm from "./edit-user/EditUserForm";
import { useLanguage } from "@/utils/languageContextUtils";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { UserProfile } from "@/types/profile";

interface EditUserDialogProps {
  user: UserProfile;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({ user }) => {
  const { isRTL, t } = useLanguage();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user.full_name,
    phone: user.phone || "",
    user_type: user.user_type,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // احفظ القيم الحالية قبل التحديث للمقارنة
      const oldData = {
        full_name: user.full_name,
        phone: user.phone || "",
        user_type: user.user_type,
      };

      // تحديث البيانات في قاعدة البيانات
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
          user_type: formData.user_type,
        })
        .eq("id", user.id)
        .select();

      if (error) throw error;

      // تحديد التغييرات وتسجيلها
      const changes: Array<{
        field: string;
        oldValue: string | null;
        newValue: string | null;
      }> = [];

      if (oldData.full_name !== formData.full_name) {
        changes.push({
          field: 'full_name',
          oldValue: oldData.full_name,
          newValue: formData.full_name,
        });
      }

      if (oldData.phone !== formData.phone) {
        changes.push({
          field: 'phone',
          oldValue: oldData.phone || null,
          newValue: formData.phone || null,
        });
      }

      if (oldData.user_type !== formData.user_type) {
        changes.push({
          field: 'user_type',
          oldValue: oldData.user_type,
          newValue: formData.user_type,
        });
      }

      // تسجيل التغييرات في سجل النشاط
      if (changes.length > 0 && profile?.id) {
        const { logMultipleUserUpdates } = await import('@/integrations/supabase/dataSenders');
        await logMultipleUserUpdates(
          profile.id,
          user.id,
          changes,
          {
            admin_name: profile.full_name,
            admin_email: profile.email || '',
            user_name: user.full_name,
            user_email: user.email || '',
            timestamp: new Date().toISOString(),
          }
        );
      }

      toast.success(t("userUpdatedSuccessfully"));
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-activity-log'] });
      setOpen(false);
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error(t("errorUpdatingUser"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 text-xs lg:text-sm h-8 lg:h-9"
        >
          <Edit className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
          <span className="hidden lg:inline">{t("edit")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        className={`max-w-md lg:max-w-lg ${isRTL ? "text-right" : "text-left"} border-0 shadow-2xl max-h-[90vh] overflow-y-auto`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <EditUserDialogHeader />
        <UserInfoDisplay user={user} isRTL={isRTL} />
        <EditUserForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
          loading={loading}
          isRTL={isRTL}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;
