
import React from 'react';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Edit } from 'lucide-react';

const EditUserDialogHeader: React.FC = () => {
  return (
    <DialogHeader className="text-center pb-4 lg:pb-6 space-y-3">
      <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
        <Edit className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
      </div>
      <DialogTitle className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
        تعديل بيانات المستخدم
      </DialogTitle>
      <DialogDescription className="text-gray-500 text-sm lg:text-base">
        قم بتعديل معلومات المستخدم وحفظ التغييرات
      </DialogDescription>
    </DialogHeader>
  );
};

export default EditUserDialogHeader;
