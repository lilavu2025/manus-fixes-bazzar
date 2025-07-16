// utils لمعالجة وتحسين عرض سجل نشاط الأدمن

// دالة لاستخراج الاسم المناسب للمستخدم من مصادر مختلفة
export function extractUserName(
  userId: string,
  profileMap: Record<string, any>,
  details: any,
  fallbackText: string = "مستخدم غير معروف"
): string {
  // أولاً جرب من profileMap
  if (profileMap[userId]?.full_name) {
    return profileMap[userId].full_name;
  }

  // ثانياً جرب من details
  if (details && typeof details === "object") {
    return (
      details.full_name ||
      details.user_name ||
      details.deletedUserName ||
      details.user_full_name ||
      fallbackText
    );
  }

  return fallbackText;
}

// دالة لاستخراج البريد الإلكتروني المناسب للمستخدم
export function extractUserEmail(
  userId: string,
  profileMap: Record<string, any>,
  details: any,
  fallbackText: string = "البريد غير متوفر"
): string {
  // أولاً جرب من profileMap
  if (profileMap[userId]?.email) {
    return profileMap[userId].email;
  }

  // ثانياً جرب من details
  if (details && typeof details === "object") {
    return (
      details.email ||
      details.user_email ||
      details.user_mail ||
      fallbackText
    );
  }

  return fallbackText;
}

// دالة لاستخراج رقم الهاتف المناسب للمستخدم
export function extractUserPhone(
  userId: string,
  profileMap: Record<string, any>,
  details: any,
  fallbackText: string = "الهاتف غير متوفر"
): string | null {
  // أولاً جرب من profileMap
  if (profileMap[userId]?.phone) {
    return profileMap[userId].phone;
  }

  // ثانياً جرب من details
  if (details && typeof details === "object") {
    return (
      details.phone ||
      details.user_phone ||
      null
    );
  }

  return null;
}

// دالة لتحسين وصف الإجراء
export function getActionDescription(action: string, actionLabels: Record<string, string>): string {
  return actionLabels[action] || action;
}

// دالة لتحسين عرض التفاصيل الإضافية
export function formatAdditionalDetails(details: any): Array<{ key: string; value: string; displayKey: string }> {
  if (!details || typeof details !== "object") {
    return [];
  }

  const excludedKeys = [
    'deletedUser', 'deletedUserName', 'batch_update', 'total_changes',
    'admin_name', 'admin_email', 'admin_phone', 'user_name', 'user_email',
    'user_phone', 'timestamp', 'mass_update', 'bulk_update', 'full_name',
    'email', 'phone', 'user_full_name', 'admin_full_name'
  ];

  const formattedDetails: Array<{ key: string; value: string; displayKey: string }> = [];

  Object.entries(details).forEach(([key, value]) => {
    if (!excludedKeys.includes(key) && value !== null && value !== undefined && value !== '') {
      let displayKey = key;
      let displayValue = String(value);

      // تحسين أسماء المفاتيح
      switch (key) {
        case 'user_type':
          displayKey = 'نوع المستخدم';
          if (value === 'admin') displayValue = 'مدير';
          else if (value === 'wholesale') displayValue = 'جملة';
          else if (value === 'retail') displayValue = 'تجزئة';
          break;
        case 'disabled':
          displayKey = 'حالة الحساب';
          displayValue = value === 'true' ? 'معطل' : 'مفعل';
          break;
        case 'language':
          displayKey = 'اللغة';
          if (value === 'ar') displayValue = 'العربية';
          else if (value === 'en') displayValue = 'الإنجليزية';
          else if (value === 'he') displayValue = 'العبرية';
          break;
        case 'created_at':
          displayKey = 'تاريخ الإنشاء';
          displayValue = new Date(String(value)).toLocaleDateString('ar');
          break;
        case 'updated_at':
          displayKey = 'تاريخ التحديث';
          displayValue = new Date(String(value)).toLocaleDateString('ar');
          break;
        default:
          displayKey = key.replace(/_/g, ' ');
      }

      formattedDetails.push({ key, value: displayValue, displayKey });
    }
  });

  return formattedDetails;
}

// دالة للتحقق من صحة البيانات
export function validateUserData(userData: any): { isValid: boolean; missingFields: string[] } {
  const requiredFields = ['full_name', 'email'];
  const missingFields = requiredFields.filter(field => !userData[field] || userData[field].trim() === '');
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}
