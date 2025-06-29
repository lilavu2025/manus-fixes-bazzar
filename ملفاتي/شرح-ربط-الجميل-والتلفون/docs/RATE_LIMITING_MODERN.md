# ✅ الطريقة الصحيحة لإعداد Rate Limiting في Supabase الحديث

## لماذا فشل السكريبت؟ 🤔

الخطأ `relation "auth.config" does not exist` يعني أن Supabase يستخدم طريقة جديدة لإعداد Rate Limiting.

## الطريقة الصحيحة (Dashboard) 🎯

### 1️⃣ انتقل إلى Authentication Settings
```
🌐 https://supabase.com/dashboard/project/gcjqjcuwsofzrgohwleg/auth/settings
```

### 2️⃣ ابحث عن قسم "Security"
- اسحب لأسفل في صفحة Settings
- ابحث عن "Rate Limits" أو "Security Settings"
- أو "Auth Providers" ثم "Advanced Settings"

### 3️⃣ إعدادات Rate Limiting
ابحث عن هذه الخيارات:

```
📧 Email Rate Limit
   └── Max requests: 5
   └── Time window: 300 seconds

🔑 Password Reset Rate Limit  
   └── Max requests: 3
   └── Time window: 600 seconds
```

## إذا لم تجد الإعدادات في Dashboard 🔧

### الطريقة البديلة: Supabase Management API

1. **احصل على Service Role Key**:
   - Dashboard > Settings > API
   - انسخ `service_role` key

2. **استخدم curl أو Postman**:
```bash
curl -X PATCH 'https://api.supabase.com/v1/projects/{project-id}/config/auth' \
  -H 'Authorization: Bearer {service-role-key}' \
  -H 'Content-Type: application/json' \
  -d '{
    "RATE_LIMIT_EMAIL_SENT": 5,
    "RATE_LIMIT_SMS_SENT": 5
  }'
```

## طريقة أخرى: إعداد في الكود 💻

يمكن إضافة Rate Limiting في التطبيق نفسه:

### إنشاء middleware للحماية:

```typescript
// src/utils/rateLimiter.ts
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

export const checkRateLimit = (
  identifier: string, 
  maxRequests: number = 5, 
  windowMs: number = 5 * 60 * 1000 // 5 minutes
): boolean => {
  const now = Date.now();
  const key = `email_${identifier}`;
  
  if (!rateLimitStore[key] || now > rateLimitStore[key].resetTime) {
    rateLimitStore[key] = {
      count: 1,
      resetTime: now + windowMs
    };
    return true;
  }
  
  if (rateLimitStore[key].count >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  rateLimitStore[key].count++;
  return true;
};
```

### استخدام في AuthContext:

```typescript
// في src/contexts/AuthContext.tsx
import { checkRateLimit } from '@/utils/rateLimiter';

const signIn = async (email: string, password: string) => {
  // فحص Rate Limiting
  if (!checkRateLimit(email)) {
    throw new Error('تم تجاوز الحد المسموح. جرب مرة أخرى بعد 5 دقائق.');
  }
  
  // باقي كود تسجيل الدخول...
};
```

## للتحقق من أن Rate Limiting يعمل 🧪

### اختبار بسيط:
1. انتقل إلى: http://localhost:8080/auth
2. جرب طلب "Forgot Password" 6 مرات متتالية
3. يجب أن تظهر رسالة خطأ بعد المحاولة الخامسة

### رسالة الخطأ المتوقعة:
```
"Too many requests. Please wait before trying again."
```

## الحل المؤقت ✨

حتى تجد الإعدادات الصحيحة، يمكن الاعتماد على:

1. **Rate Limiting الافتراضي**: Supabase يطبق حماية أساسية تلقائياً
2. **Rate Limiting في الكود**: كما موضح أعلاه
3. **Cloudflare**: إذا كنت تستخدم Cloudflare كـ CDN

## خطوات سريعة للبحث 🔍

### جرب هذه الأماكن في Dashboard:
```
✅ Authentication > Settings > Security
✅ Authentication > Settings > Rate Limits  
✅ Project Settings > Authentication
✅ API Settings > Rate Limiting
```

### أو ابحث في الصفحة عن:
```
🔍 "rate"
🔍 "limit" 
🔍 "security"
🔍 "throttle"
```

---

**💡 خلاصة**: Rate Limiting موجود في Supabase لكن مكانه يختلف حسب الإصدار. الأهم أن هناك حماية افتراضية موجودة بالفعل!
