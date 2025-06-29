import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/utils/languageContextUtils';
import { useAuth } from '@/contexts/useAuth';

interface CompleteProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userName?: string;
  onComplete: () => void;
}

export const CompleteProfileDialog: React.FC<CompleteProfileDialogProps> = ({
  isOpen,
  onClose,
  userEmail,
  userName = '',
  onComplete
}) => {
  const { t } = useLanguage();
  const { updateProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: userName || '',
    phone: ''
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const isValidPhone = (phone: string) => /^05\d{8}$/.test(phone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // التحقق من البيانات
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'الاسم الكامل مطلوب';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'رقم الهاتف مطلوب';
    } else if (!isValidPhone(formData.phone)) {
      newErrors.phone = 'رقم الهاتف غير صحيح، يجب أن يبدأ بـ 05 ويحتوي على 10 أرقام';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // تحديث الملف الشخصي
      await updateProfile({
        full_name: formData.fullName.trim(),
        phone: formData.phone.trim()
      });
      
      onComplete();
      onClose();
    } catch (error: any) {
      setErrors({ general: error.message || 'حدث خطأ أثناء تحديث البيانات' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center">
            أكمل بياناتك
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center text-sm text-gray-600 mb-4">
          مرحباً! لإكمال تسجيلك عبر Google، نحتاج بعض البيانات الإضافية
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* عرض الإيميل (للقراءة فقط) */}
          <div className="space-y-2">
            <Label>البريد الإلكتروني</Label>
            <Input 
              value={userEmail} 
              disabled 
              className="bg-gray-100"
            />
          </div>

          {/* الاسم الكامل */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center gap-1">
              الاسم الكامل 
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder="أدخل اسمك الكامل"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                fullName: e.target.value
              }))}
              className={errors.fullName ? "border-red-500" : ""}
            />
            {errors.fullName && (
              <span className="text-xs text-red-600">{errors.fullName}</span>
            )}
          </div>

          {/* رقم الهاتف */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-1">
              رقم الهاتف 
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="05xxxxxxxx"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                phone: e.target.value
              }))}
              className={errors.phone ? "border-red-500" : ""}
            />
            <p className="text-xs text-gray-600">
              مثال: 0501234567
            </p>
            {errors.phone && (
              <span className="text-xs text-red-600">{errors.phone}</span>
            )}
          </div>

          {/* خطأ عام */}
          {errors.general && (
            <div className="text-sm text-red-600 text-center">
              {errors.general}
            </div>
          )}

          {/* أزرار */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'جاري الحفظ...' : 'إكمال التسجيل'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
