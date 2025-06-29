# دليل إعداد Rate Limiting في Supabase 🛡️

## ما هو Rate Limiting؟
هو تحديد عدد الطلبات المسموح بها لكل مستخدم في فترة زمنية معينة لمنع:
- إساءة استخدام النظام
- إرسال رسائل spam
- استنزاف الموارد والتكاليف

## الطريقة الأسهل ✨

### 1. انتقل لـ Supabase Dashboard
```
🌐 https://supabase.com/dashboard
📁 اختر مشروعك → Authentication → Settings
```

### 2. ابحث عن Security Settings
```
⬇️ اسحب لأسفل في صفحة Settings
🔍 ابحث عن "Rate limits" أو "Security"
```

### 3. إعدادات Email Rate Limit
```
📧 Email rate limit: 5
⏰ Time window: 300 seconds (5 minutes)
```

### 4. إعدادات SMS Rate Limit (للمستقبل)
```
📱 SMS rate limit: 5  
⏰ Time window: 300 seconds (5 minutes)
```

## إذا لم تجد الإعدادات 🔧

### استخدم SQL Editor:

1. **انتقل إلى SQL Editor**
   ```
   Dashboard → SQL Editor → + New query
   ```

2. **انسخ والصق هذا الكود**:
   ```sql
   -- Rate limiting للإيميل (5 رسائل كل 5 دقائق)
   INSERT INTO auth.config (parameter, value) 
   VALUES ('email_rate_limit', '5') 
   ON CONFLICT (parameter) DO UPDATE SET value = '5';
   
   INSERT INTO auth.config (parameter, value) 
   VALUES ('email_rate_limit_per', '300') 
   ON CONFLICT (parameter) DO UPDATE SET value = '300';
   ```

3. **اضغط "Run" ▶️**

4. **للتحقق من النتيجة**:
   ```sql
   SELECT parameter, value 
   FROM auth.config 
   WHERE parameter LIKE '%email_rate%';
   ```

## للتحقق من أن الإعداد يعمل 🧪

### اختبر Rate Limiting:

1. **جرب طلب كود تحقق**
2. **كررها أكثر من 5 مرات خلال 5 دقائق**
3. **يجب أن تحصل على رسالة خطأ**: "Too many requests"

### رسالة الخطأ المتوقعة:
```
"error": {
  "message": "Email rate limit exceeded",
  "code": 429
}
```

## القيم الموصى بها 📊

| الاستخدام | Email Limit | SMS Limit | Time Window |
|-----------|-------------|-----------|-------------|
| **Development** | 10 | 10 | 5 minutes |
| **Production** | 5 | 3 | 5 minutes |
| **High Security** | 3 | 2 | 10 minutes |

## نصائح مهمة 💡

### ✅ افعل:
- ابدأ بقيم متساهلة ثم قللها
- راقب الـ logs بانتظام
- اختبر قبل النشر

### ❌ لا تفعل:
- تضع قيم منخفضة جداً (أقل من 3)
- تنسى اختبار الإعدادات
- تطبق على الإنتاج مباشرة

## استكشاف الأخطاء 🔍

### المشكلة: لا أجد إعدادات Rate Limiting
**الحل**: استخدم SQL Editor كما موضح أعلاه

### المشكلة: الإعدادات لا تعمل
**الحل**: 
1. تأكد من حفظ الإعدادات
2. انتظر دقيقتين لتطبيق التغييرات
3. اختبر من متصفح مختلف

### المشكلة: المستخدمين محجوبين بشكل غير عادل
**الحل**: زيد القيم أو المدة الزمنية

## لتعطيل Rate Limiting مؤقتاً 🔓

```sql
-- لتعطيل rate limiting للإيميل
UPDATE auth.config 
SET value = '999' 
WHERE parameter = 'email_rate_limit';
```

---

**💡 نصيحة**: ابدأ بالقيم الموصى بها ثم عدلها حسب احتياجات مشروعك!
