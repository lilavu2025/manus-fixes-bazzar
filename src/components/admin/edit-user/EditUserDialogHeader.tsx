import React from 'react';
import { useLanguage } from '@/utils/languageContextUtils';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Edit } from 'lucide-react';

const EditUserDialogHeader: React.FC = () => {
  const { t } = useLanguage();
  return (
    <DialogHeader className="text-center pb-4 lg:pb-6 space-y-3">
      <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] rounded-full flex items-center justify-center mx-auto shadow-lg">
        <Edit className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
      </div>
      <DialogTitle className="text-2xl font-bold mb-1 text-primary text-center">
        {t('editUser') || 'تعديل المستخدم'}
      </DialogTitle>
      <DialogDescription className="text-gray-500 text-sm lg:text-base text-center">
        {t('editUserDescription') || 'قم بتعديل معلومات المستخدم وحفظ التغييرات'}
      </DialogDescription>
    </DialogHeader>
  );
};

export default EditUserDialogHeader;
