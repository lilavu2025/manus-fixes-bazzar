import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { toast } from 'sonner';
import EditUserDialogHeader from './edit-user/EditUserDialogHeader';
import UserInfoDisplay from './edit-user/UserInfoDisplay';
import EditUserForm from './edit-user/EditUserForm';
import { useLanguage } from '@/utils/languageContextUtils';
import { useAuth } from '@/contexts/useAuth';
import type { UserProfile } from '@/types/profile';

interface EditUserDialogProps {
  user: UserProfile;
  refetch: () => void;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({ user, refetch }) => {
  const { isRTL } = useLanguage();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user.full_name,
    phone: user.phone || '',
    user_type: user.user_type,
  });

  // دالة تسجيل النشاط
  const logUserActivity = async (userId: string, action: string, details: Record<string, unknown> = {}) => {
    if (!profile?.id) return;
    await supabase.from('user_activity_log').insert([
      {
        admin_id: profile.id,
        user_id: userId,
        action,
        details,
      }
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
          user_type: formData.user_type,
        })
        .eq('id', user.id);

      if (error) throw error;

      // تسجيل النشاط
      await logUserActivity(user.id, 'update', {
        full_name: formData.full_name,
        phone: formData.phone,
        user_type: formData.user_type,
      });

      toast.success('تم تحديث بيانات المستخدم بنجاح');
      queryClient.invalidateQueries({ queryKey: ['admin-users-extended'] });
      if (refetch) refetch();
      setOpen(false);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('حدث خطأ في تحديث بيانات المستخدم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 text-xs lg:text-sm h-8 lg:h-9">
          <Edit className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
          <span className="hidden lg:inline">تعديل</span>
        </Button>
      </DialogTrigger>
      <DialogContent className={`max-w-md lg:max-w-lg ${isRTL ? 'text-right' : 'text-left'} border-0 shadow-2xl max-h-[90vh] overflow-y-auto`} dir={isRTL ? 'rtl' : 'ltr'}>
        <EditUserDialogHeader />
        <UserInfoDisplay user={user} />
        <EditUserForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
          loading={loading}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;
