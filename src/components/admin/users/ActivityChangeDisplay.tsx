import React from 'react';
import { useLanguage } from '@/utils/languageContextUtils';
import { Badge } from '@/components/ui/badge';

interface ActivityChangeDetails {
  target_field?: string;
  old_value?: string;
  new_value?: string;
  action: string;
  details?: Record<string, any>;
}

interface ActivityChangeDisplayProps {
  change: ActivityChangeDetails;
}

const ActivityChangeDisplay: React.FC<ActivityChangeDisplayProps> = ({ change }) => {
  const { t } = useLanguage();

  const FIELD_LABELS: Record<string, string> = {
    full_name: t("fullName") || "الاسم الكامل",
    phone: t("phone") || "الهاتف",
    user_type: t("userType") || "نوع المستخدم",
    email: t("email") || "البريد الإلكتروني",
    disabled: t("status") || "الحالة",
  };

  const USER_TYPE_LABELS: Record<string, string> = {
    admin: t("admin") || "مدير",
    wholesale: t("wholesale") || "جملة",
    retail: t("retail") || "تجزئة",
  };

  const ACTION_LABELS: Record<string, string> = {
    disable: t("disableUser"),
    enable: t("enableUser"),
    delete: t("deleteUser"),
    restore: t("restoreUser"),
    update: t("updateUser"),
  };

  // تنسيق القيمة بناءً على نوع الحقل
  const formatValue = (value: string | undefined, fieldType?: string): string => {
    if (!value) return t("empty") || "فارغ";
    
    if (fieldType === 'user_type') {
      return USER_TYPE_LABELS[value] || value;
    }
    
    if (fieldType === 'disabled') {
      return value === 'true' ? (t("disabled") || "معطل") : (t("active") || "نشط");
    }
    
    return value;
  };

  // إذا لم يكن تحديث، اعرض النشاط العادي
  if (change.action !== 'update') {
    return (
      <Badge 
        variant="outline" 
        className={`text-xs ${
          change.action === 'delete' ? 'border-red-500 text-red-700' :
          change.action === 'disable' ? 'border-yellow-500 text-yellow-700' :
          change.action === 'enable' ? 'border-green-500 text-green-700' :
          'border-blue-500 text-blue-700'
        }`}
      >
        {ACTION_LABELS[change.action] || change.action}
      </Badge>
    );
  }

  // إذا كان لديه target_field و القيم القديمة والجديدة
  if (change.target_field && (change.old_value !== undefined || change.new_value !== undefined)) {
    const fieldLabel = FIELD_LABELS[change.target_field] || change.target_field;
    const oldValue = formatValue(change.old_value, change.target_field);
    const newValue = formatValue(change.new_value, change.target_field);

    return (
      <div className="space-y-1 text-xs">
        <div className="font-semibold text-blue-700">{fieldLabel}</div>
        <div className="space-y-1">
          {change.old_value !== undefined && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-gray-500 text-xs">{t("fromValue")}:</span>
              <Badge variant="destructive" className="text-xs px-1 py-0">
                {oldValue}
              </Badge>
            </div>
          )}
          {change.new_value !== undefined && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-gray-500 text-xs">{t("toValue")}:</span>
              <Badge variant="default" className="text-xs px-1 py-0 bg-green-100 text-green-700 border-green-300">
                {newValue}
              </Badge>
            </div>
          )}
        </div>
      </div>
    );
  }

  // إذا كان لديه تفاصيل في details
  if (change.details && typeof change.details === 'object') {
    const details = change.details;
    
    // إذا كان batch update
    if (details.batch_update && details.total_changes) {
      return (
        <div className="text-xs">
          <Badge variant="secondary" className="text-xs">
            {t("multipleChanges")} ({details.total_changes})
          </Badge>
        </div>
      );
    }

    // محاولة استخراج التغييرات من details
    const changeKeys = Object.keys(details).filter(key => 
      key !== 'admin_name' && 
      key !== 'admin_email' && 
      key !== 'user_name' && 
      key !== 'user_email' &&
      key !== 'timestamp' &&
      key !== 'batch_update' &&
      key !== 'total_changes'
    );

    if (changeKeys.length > 0) {
      return (
        <div className="space-y-1 text-xs">
          {changeKeys.slice(0, 2).map(key => (
            <div key={key} className="flex items-center gap-1">
              <span className="font-semibold text-blue-700">
                {FIELD_LABELS[key] || key}:
              </span>
              <span className="text-gray-700 truncate max-w-20">
                {formatValue(details[key]?.toString(), key)}
              </span>
            </div>
          ))}
          {changeKeys.length > 2 && (
            <div className="text-gray-500 text-xs">
              +{changeKeys.length - 2} {t("more")}
            </div>
          )}
        </div>
      );
    }
  }

  // عرض افتراضي
  return (
    <Badge variant="outline" className="text-xs">
      {ACTION_LABELS[change.action] || t("updateUser")}
    </Badge>
  );
};

export default ActivityChangeDisplay;
