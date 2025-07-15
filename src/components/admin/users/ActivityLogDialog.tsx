import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/utils/languageContextUtils";
import {
  Shield,
  User,
  Activity,
  Clock,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  Info,
  X
} from "lucide-react";

interface ActivityLogData {
  id: string;
  admin_id: string;
  user_id: string;
  action: string;
  target_field?: string;
  old_value?: string;
  new_value?: string;
  details: any | null;
  created_at: string;
}

interface ProfileData {
  full_name: string;
  email: string;
  phone: string | null;
}

interface ActivityLogDialogProps {
  log: ActivityLogData | null;
  adminProfile: ProfileData | undefined;
  userProfile: ProfileData | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ActivityLogDialog: React.FC<ActivityLogDialogProps> = ({
  log,
  adminProfile,
  userProfile,
  open,
  onOpenChange,
}) => {
  const { t } = useLanguage();

  if (!log) return null;

  // ترجمة أسماء الحقول
  const getFieldLabel = (field: string): string => {
    const fieldLabels: Record<string, string> = {
      'user_type': t("userType") || "نوع المستخدم",
      'full_name': t("fullName") || "الاسم الكامل",
      'email': t("email") || "البريد الإلكتروني",
      'phone': t("phone") || "رقم الهاتف",
      'disabled': t("accountStatus") || "حالة الحساب",
      'language': t("language") || "اللغة"
    };
    return fieldLabels[field] || field;
  };

  // ترجمة القيم
  const getValueLabel = (field: string, value: string): string => {
    if (field === 'user_type') {
      const userTypes: Record<string, string> = {
        'retail': t("retail") || "تجزئة",
        'wholesale': t("wholesale") || "جملة",
        'admin': t("admin") || "مدير"
      };
      return userTypes[value] || value;
    }
    
    if (field === 'disabled') {
      return value === 'true' ? (t("disabledStatus") || "معطل") : (t("enabledStatus") || "مفعل");
    }
    
    if (field === 'language') {
      const languages: Record<string, string> = {
        'ar': t("arabicLang") || "العربية",
        'en': t("englishLang") || "الإنجليزية", 
        'he': t("hebrewLang") || "العبرية"
      };
      return languages[value] || value;
    }
    
    return value;
  };

  // دالة لعرض التفاصيل الإضافية بشكل سهل الفهم
  const renderAdditionalDetails = (details: any) => {
    if (!details || typeof details !== 'object') return null;

    const items = [];

    // معلومات المستخدم المحذوف
    if (details.deletedUser && details.deletedUserName) {
      items.push(
        <div key="deletedUser" className="bg-white p-3 rounded border">
          <div className="flex items-center gap-2 mb-2">
            <UserX className="h-4 w-4 text-red-600" />
            <span className="font-medium text-red-900">{t("deletedUserInfo") || "معلومات المستخدم المحذوف"}</span>
          </div>
          <p className="text-sm text-gray-700">
            <span className="font-medium">{t("userName") || "اسم المستخدم"}:</span> {details.deletedUserName}
          </p>
        </div>
      );
    }

    // معلومات أخرى (مع إخفاء المعلومات التقنية المربكة والمكررة)
    const excludedKeys = [
      'deletedUser', 'deletedUserName', 'batch_update', 'total_changes', 
      'admin_name', 'admin_email', 'admin_phone', 'user_name', 'user_email', 
      'user_phone', 'timestamp', 'mass_update', 'bulk_update'
    ];
    
    const otherKeys = Object.keys(details).filter(key => !excludedKeys.includes(key));

    if (otherKeys.length > 0) {
      items.push(
        <div key="otherInfo" className="bg-white p-3 rounded border">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-indigo-600" />
            <span className="font-medium text-indigo-900">{t("relevantInfo") || "معلومات ذات صلة"}</span>
          </div>
          <div className="space-y-1 text-sm text-gray-700">
            {otherKeys.map(key => {
              let displayValue = details[key];
              let displayKey = key;
              
              // ترجمة أسماء الحقول
              const fieldLabels: Record<string, string> = {
                'disabled': t("accountStatus") || "حالة الحساب",
                'user_type': t("userType") || "نوع المستخدم",
                'language': t("language") || "اللغة",
                'full_name': t("fullName") || "الاسم الكامل",
                'email': t("email") || "البريد الإلكتروني",
                'phone': t("phone") || "رقم الهاتف"
              };
              displayKey = fieldLabels[key] || key;
              
              // ترجمة القيم الخاصة
              if (key === 'disabled') {
                displayValue = details[key] === true || details[key] === 'true' 
                  ? (t("disabledStatus") || "معطل") 
                  : (t("enabledStatus") || "مفعل");
              } else if (key === 'user_type') {
                const userTypes: Record<string, string> = {
                  'retail': t("retail") || "تجزئة",
                  'wholesale': t("wholesale") || "جملة",
                  'admin': t("admin") || "مدير"
                };
                displayValue = userTypes[details[key]] || details[key];
              } else if (key === 'language') {
                const languages: Record<string, string> = {
                  'ar': t("arabicLang") || "العربية",
                  'en': t("englishLang") || "الإنجليزية",
                  'he': t("hebrewLang") || "العبرية"
                };
                displayValue = languages[details[key]] || details[key];
              } else if (typeof details[key] === 'boolean') {
                displayValue = details[key] ? (t("yes") || "نعم") : (t("no") || "لا");
              } else if (typeof details[key] === 'object') {
                // إخفاء الكائنات المعقدة لأنها مربكة للمستخدم
                return null;
              } else {
                displayValue = String(details[key]);
              }

              return (
                <p key={key}>
                  <span className="font-medium">{displayKey}:</span> {displayValue}
                </p>
              );
            }).filter(Boolean)}
          </div>
        </div>
      );
    }

    return items.length > 0 ? items : (
      <div className="bg-white p-3 rounded border text-center text-gray-500">
        {t("noAdditionalInfo") || "لا توجد معلومات إضافية"}
      </div>
    );
  };

  const ACTION_LABELS: Record<string, string> = {
    disable: t("disableUser") || "تعطيل المستخدم",
    enable: t("enableUser") || "تفعيل المستخدم", 
    delete: t("deleteUser") || "حذف المستخدم",
    restore: t("restoreUser") || "استعادة المستخدم",
    update: t("updateUser") || "تحديث بيانات المستخدم",
    create: t("createUser") || "إنشاء مستخدم جديد",
    password_reset: t("passwordReset") || "إعادة تعيين كلمة المرور",
    stock_increased: t("stockIncreased") || "زيادة المخزون",
    stock_decreased: t("stockDecreased") || "نقص المخزون",
    login: t("userLogin") || "دخول المستخدم",
    logout: t("userLogout") || "خروج المستخدم",
    profile_update: t("profileUpdate") || "تحديث الملف الشخصي",
    type_change: t("userTypeChange") || "تغيير نوع المستخدم",
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'delete': return <Trash2 className="h-5 w-5" />;
      case 'disable': return <UserX className="h-5 w-5" />;
      case 'enable': return <UserCheck className="h-5 w-5" />;
      case 'update': return <Edit className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'delete': return 'bg-red-50 border-red-200 text-red-700';
      case 'disable': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'enable': return 'bg-green-50 border-green-200 text-green-700';
      case 'update': return 'bg-blue-50 border-blue-200 text-blue-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        calendar: 'gregory'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        calendar: 'gregory'
      })
    };
  };

  const { date, time } = formatDateTime(log.created_at);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className={`p-2 rounded-lg ${getActionColor(log.action)}`}>
                {getActionIcon(log.action)}
              </div>
              {t("activityDetails") || "تفاصيل النشاط"}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Action Information */}
          <Card className={`border-2 ${getActionColor(log.action)}`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-full ${getActionColor(log.action)}`}>
                  {getActionIcon(log.action)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {ACTION_LABELS[log.action] || log.action}
                  </h3>
                  <p className="text-sm opacity-80">
                    {t("actionPerformed") || "العملية المنفذة"}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">{date}</p>
                    <p className="text-xs opacity-70">{time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">{t("actionId") || "معرف العملية"}</p>
                    <p className="text-xs font-mono opacity-70">{log.id}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Information */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">
                    {t("adminInfo") || "معلومات المدير"}
                  </h3>
                  <p className="text-sm text-blue-600">
                    {t("whoPerformedAction") || "من قام بالعملية"}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">
                      {adminProfile?.full_name || 
                       (log.details?.admin_name) || 
                       (log.details?.admin_full_name) ||
                       t("unknownAdmin") || "مدير غير معروف"}
                    </p>
                    <p className="text-xs text-blue-600">{t("fullName") || "الاسم الكامل"}</p>
                  </div>
                </div>
                
                {(adminProfile?.email || log.details?.admin_email) && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-800">{adminProfile?.email || log.details?.admin_email}</p>
                      <p className="text-xs text-blue-600">{t("email") || "البريد الإلكتروني"}</p>
                    </div>
                  </div>
                )}
                
                {adminProfile?.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-800">{adminProfile.phone}</p>
                      <p className="text-xs text-blue-600">{t("phone") || "الهاتف"}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* User Information */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gray-100 rounded-full">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t("targetUser") || "المستخدم المستهدف"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t("affectedUser") || "المستخدم المتأثر بالعملية"}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {userProfile?.full_name || 
                       (log.details?.full_name) || 
                       (log.details?.user_name) || 
                       (log.details?.deletedUserName) ||
                       t("unknownUser") || "مستخدم غير معروف"}
                    </p>
                    <p className="text-xs text-gray-600">{t("fullName") || "الاسم الكامل"}</p>
                  </div>
                </div>
                
                {(userProfile?.email || log.details?.email || log.details?.user_email) && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-800">
                        {userProfile?.email || log.details?.email || log.details?.user_email}
                      </p>
                      <p className="text-xs text-gray-600">{t("email") || "البريد الإلكتروني"}</p>
                    </div>
                  </div>
                )}
                
                {(userProfile?.phone || log.details?.phone) && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-800">
                        {userProfile?.phone || log.details?.phone}
                      </p>
                      <p className="text-xs text-gray-600">{t("phone") || "الهاتف"}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Change Details */}
          {(log.target_field || log.old_value || log.new_value) && (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-amber-100 rounded-full">
                    <Edit className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-amber-900">
                      {t("changeDetails") || "تفاصيل التغيير"}
                    </h3>
                    <p className="text-sm text-amber-600">
                      {t("whatChanged") || "ما الذي تم تغييره"}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {log.target_field && (
                    <div>
                      <p className="text-sm font-medium text-amber-900 mb-1">
                        {t("changedField") || "الحقل المتغير"}:
                      </p>
                      <Badge variant="outline" className="bg-white border-amber-300 text-amber-800">
                        {getFieldLabel(log.target_field)}
                      </Badge>
                    </div>
                  )}
                  
                  {log.old_value && (
                    <div>
                      <p className="text-sm font-medium text-amber-900 mb-1">
                        {t("previousValue") || "القيمة السابقة"}:
                      </p>
                      <div className="bg-red-50 border border-red-200 p-3 rounded text-sm">
                        <span className="font-medium text-red-800">
                          {getValueLabel(log.target_field || '', log.old_value)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {log.new_value && (
                    <div>
                      <p className="text-sm font-medium text-amber-900 mb-1">
                        {t("currentValue") || "القيمة الجديدة"}:
                      </p>
                      <div className="bg-green-50 border border-green-200 p-3 rounded text-sm">
                        <span className="font-medium text-green-800">
                          {getValueLabel(log.target_field || '', log.new_value)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Details */}
          {log.details && Object.keys(log.details).length > 0 && (
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Info className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-purple-900">
                      {t("additionalDetails") || "تفاصيل إضافية"}
                    </h3>
                    <p className="text-sm text-purple-600">
                      {t("moreInfo") || "معلومات إضافية عن العملية"}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {renderAdditionalDetails(log.details)}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityLogDialog;
