# 📋 الخطوات البسيطة لإعداد Rate Limiting

## الطريقة الأسهل (نسخ ولصق) 📋

### 1️⃣ افتح Supabase Dashboard
```
🌐 https://supabase.com/dashboard
👆 اضغط على مشروعك (gcjqjcuwsofzrgohwleg)
```

### 2️⃣ انتقل إلى SQL Editor
```
📊 Dashboard (الصفحة الرئيسية)
    ↓
🔧 SQL Editor (من القائمة اليسرى)
    ↓  
➕ New query (زر أخضر في الأعلى)
```

### 3️⃣ انسخ والصق السكريبت
```sql
-- انسخ هذا الكود كاملاً 👇

INSERT INTO auth.config (parameter, value) 
VALUES ('email_rate_limit', '5') 
ON CONFLICT (parameter) DO UPDATE SET value = '5';

INSERT INTO auth.config (parameter, value) 
VALUES ('email_rate_limit_per', '300') 
ON CONFLICT (parameter) DO UPDATE SET value = '300';

SELECT 'Rate Limiting تم تفعيله بنجاح! ✅' as result;
```

### 4️⃣ شغّل السكريبت
```
▶️ اضغط "Run" (الزر الأخضر)
✅ يجب أن ترى رسالة نجاح
```

## للتحقق من أن الإعداد يعمل 🧪

### انسخ هذا الكود للتحقق:
```sql
SELECT parameter, value 
FROM auth.config 
WHERE parameter LIKE '%email_rate%';
```

### النتيجة المتوقعة:
```
parameter              | value
email_rate_limit       | 5
email_rate_limit_per   | 300
```

## اختبار عملي 🎯

### 1. انتقل لصفحة المصادقة:
```
http://localhost:8080/auth
```

### 2. جرب طلب كود إيميل 6 مرات متتالية
- أول 5 مرات: ✅ يجب أن تعمل
- المرة السادسة: ❌ يجب أن تظهر رسالة خطأ

### 3. رسالة الخطأ المتوقعة:
```
"Email rate limit exceeded. Please wait before trying again."
```

## إذا واجهت مشكلة 🔧

### المشكلة: لا أجد SQL Editor
**الحل**: 
- تأكد أنك في الصفحة الصحيحة
- القائمة اليسرى → SQL Editor
- أو اذهب مباشرة: `https://supabase.com/dashboard/project/gcjqjcuwsofzrgohwleg/sql`

### المشكلة: خطأ في تشغيل السكريبت
**الحل**:
- تأكد من نسخ الكود كاملاً
- احذف أي مسافات إضافية
- اضغط "Run" مرة واحدة فقط

### المشكلة: الإعداد لا يعمل
**الحل**:
- انتظر دقيقتين وجرب مرة أخرى
- امسح cache المتصفح
- جرب من متصفح مختلف

## نصائح إضافية 💡

### 🔥 للتطوير (قيم متساهلة):
```sql
-- 10 رسائل كل 5 دقائق
UPDATE auth.config SET value = '10' WHERE parameter = 'email_rate_limit';
```

### 🛡️ للإنتاج (قيم صارمة):
```sql
-- 3 رسائل كل 10 دقائق
UPDATE auth.config SET value = '3' WHERE parameter = 'email_rate_limit';
UPDATE auth.config SET value = '600' WHERE parameter = 'email_rate_limit_per';
```

### 🚫 لتعطيل Rate Limiting مؤقتاً:
```sql
-- رقم كبير جداً = لا حدود عملياً
UPDATE auth.config SET value = '999' WHERE parameter = 'email_rate_limit';
```

---

**🎯 الهدف**: حماية النظام من الإساءة مع ضمان تجربة مستخدم سلسة!
