# دليل إعداد المصادقة بالهاتف وGoogle OAuth

> ⚠️ **ملاحظة مهمة**: مصادقة الهاتف معطلة حالياً لأنها تحتاج لحساب Twilio مدفوع. يمكن تفعيلها لاحقاً عند الحاجة.

## الميزات المتاحة حالياً ✅

- 📧 **البريد الإلكتروني**: متاح ويعمل بشكل طبيعي
- 🔍 **Google OAuth**: متاح ويحتاج إعداد Google Cloud Console
- 📱 **الهاتف**: معطل مؤقتاً (يحتاج Twilio مدفوع)

---

## إعداد مصادقة الهاتف في Supabase (معطل حالياً)

### 1. تفعيل مصادقة الهاتف
1. اذهب إلى لوحة تحكم Supabase: https://supabase.com/dashboard
2. اختر مشروعك (gcjqjcuwsofzrgohwleg)
3. انتقل إلى Authentication > Settings
4. في قسم "Phone Auth" قم بما يلي:
   - فعّل "Enable phone confirmations"
   - اختر مزود خدمة SMS (Twilio موصى به)

### 2. إعداد Twilio (لرسائل SMS)
1. سجل حساب في Twilio: https://www.twilio.com
2. احصل على:
   - Account SID
   - Auth Token
   - Phone Number
3. في Supabase، أدخل بيانات Twilio:
   - Twilio Account SID
   - Twilio Auth Token
   - Twilio Phone Number

### 3. إعداد القوالب (Templates)
في Supabase، قم بتخصيص رسالة SMS:
```
رمز التحقق الخاص بك هو: {{ .Token }}
صالح لمدة 5 دقائق
```

## إعداد Google OAuth في Supabase

### 1. إنشاء مشروع Google Cloud
1. اذهب إلى: https://console.cloud.google.com
2. أنشئ مشروع جديد أو اختر مشروع موجود
3. فعّل Google+ API من Library

### 2. إنشاء بيانات اعتماد OAuth
1. انتقل إلى Credentials
2. اضغط "Create Credentials" > "OAuth 2.0 Client IDs"
3. اختر "Web application"
4. أضف Authorized redirect URIs:
   ```
   https://gcjqjcuwsofzrgohwleg.supabase.co/auth/v1/callback
   http://localhost:8080/auth/v1/callback
   ```

### 3. إعداد Supabase OAuth
1. في Supabase Dashboard، انتقل إلى Authentication > Settings
2. في قسم "Auth Providers"، فعّل Google
3. أدخل:
   - Google Client ID
   - Google Client Secret

### 4. إعداد OAuth Consent Screen
1. في Google Cloud Console، انتقل إلى "OAuth consent screen"
2. املأ المعلومات المطلوبة:
   - App name: متجر المدينة
   - User support email
   - Developer contact information
3. أضف النطاقات (Scopes):
   - email
   - profile
   - openid

## إعدادات إضافية

### إعداد Site URL
في Supabase Authentication Settings:
- Site URL: `https://yourdomain.com` (في الإنتاج)
- Additional redirect URLs: 
  ```
  http://localhost:8080
  https://yourdomain.com
  ```

### إعداد Rate Limiting (تحديد معدل الطلبات)

**الهدف**: منع إرسال رسائل كثيرة لنفس المستخدم لتجنب الإساءة والتكاليف الزائدة.

#### الخطوات التفصيلية:

1. **انتقل إلى لوحة تحكم Supabase**:
   - اذهب إلى: https://supabase.com/dashboard
   - اختر مشروعك (gcjqjcuwsofzrgohwleg)

2. **انتقل إلى إعدادات المصادقة**:
   ```
   Dashboard → Authentication → Settings
   ```

3. **ابحث عن قسم "Security and user management"**:
   - اسحب لأسفل حتى تجد "Rate limits"
   - أو ابحث عن "Security settings"

4. **إعداد Email Rate Limiting**:
   ```
   Email rate limit: 5 requests per 5 minutes
   ```
   - ابحث عن "Email rate limit"
   - ضع القيمة: `5` في خانة "requests"
   - ضع القيمة: `300` في خانة "seconds" (5 دقائق = 300 ثانية)

5. **إعداد SMS Rate Limiting** (عند تفعيل الهاتف):
   ```
   SMS rate limit: 5 requests per 5 minutes
   ```
   - ابحث عن "SMS rate limit" أو "Phone rate limit"
   - ضع نفس القيم: `5` requests per `300` seconds

#### إذا لم تجد الإعدادات:

**الطريقة البديلة - استخدام SQL:**

1. **انتقل إلى SQL Editor**:
   ```
   Dashboard → SQL Editor → New query
   ```

2. **تشغيل الكود التالي**:
   ```sql
   -- إعداد rate limiting للإيميل
   INSERT INTO auth.config (parameter, value) 
   VALUES ('email_rate_limit', '5') 
   ON CONFLICT (parameter) DO UPDATE SET value = '5';
   
   INSERT INTO auth.config (parameter, value) 
   VALUES ('email_rate_limit_per', '300') 
   ON CONFLICT (parameter) DO UPDATE SET value = '300';
   
   -- إعداد rate limiting للهاتف (عند التفعيل)
   INSERT INTO auth.config (parameter, value) 
   VALUES ('sms_rate_limit', '5') 
   ON CONFLICT (parameter) DO UPDATE SET value = '5';
   
   INSERT INTO auth.config (parameter, value) 
   VALUES ('sms_rate_limit_per', '300') 
   ON CONFLICT (parameter) DO UPDATE SET value = '300';
   ```

3. **اضغط "Run" لتشغيل الكود**

#### للتحقق من الإعدادات:

**تشغيل استعلام للتحقق:**
```sql
SELECT parameter, value 
FROM auth.config 
WHERE parameter LIKE '%rate_limit%';
```

#### القيم الموصى بها:

| نوع المصادقة | عدد الطلبات | المدة الزمنية | الغرض |
|-------------|------------|-------------|-------|
| Email | 5 | 5 دقائق | منع إساءة البريد |
| SMS | 5 | 5 دقائق | توفير تكاليف الرسائل |
| Password Reset | 3 | 10 دقائق | حماية إضافية |

#### ملاحظات مهمة:

⚠️ **تحذير**: 
- هذه الإعدادات تطبق على مستوى المشروع بالكامل
- تأثر على جميع المستخدمين
- اختبر الإعدادات قبل النشر في الإنتاج

✅ **نصائح**:
- ابدأ بقيم متساهلة ثم قللها تدريجياً
- راقب logs للتأكد من عدم حجب مستخدمين شرعيين
- يمكن تعديل القيم في أي وقت

## اختبار الإعدادات

### ❌ اختبار مصادقة الهاتف (معطل حالياً)
مصادقة الهاتف معطلة مؤقتاً لأنها تحتاج:
- حساب Twilio مدفوع ($)
- رصيد كافي لإرسال رسائل SMS
- إعداد معقد للبيئة الإنتاجية

**لتفعيلها لاحقاً:**
1. أنشئ حساب Twilio مدفوع
2. اتبع الخطوات المذكورة أعلاه
3. فعّل `showPhoneAuth = true` في الكود

### ✅ اختبار Google OAuth
1. اضغط على "تسجيل الدخول بـ Google"
2. تأكد من ظهور نافذة Google
3. جرب تسجيل الدخول بحساب Google

## ملاحظات أمنية

1. **أرقام الهواتف المدعومة**: معطل حالياً، سيدعم أرقام إسرائيلية (05xxxxxxxx) عند التفعيل
2. **حماية من الإساءة**: Supabase يوفر حماية تلقائية
3. **تخزين آمن**: جميع البيانات محمية بتشفير SSL/TLS
4. **انتهاء صلاحية الرموز**: سيكون 5 دقائق عند تفعيل مصادقة الهاتف

## استكشاف الأخطاء

### ❌ مشاكل مصادقة الهاتف (معطل حالياً)
- مصادقة الهاتف معطلة في الكود لتجنب التكاليف
- للتفعيل: قم بتعديل `showPhoneAuth = true` بعد إعداد Twilio

### ✅ مشاكل شائعة في Google OAuth
- **خطأ redirect_uri**: تأكد من إضافة URL الصحيح
- **خطأ client_id**: تأكد من نسخ Client ID بشكل صحيح
- **خطأ في النطاقات**: تأكد من إضافة النطاقات المطلوبة

## متطلبات الإنتاج

قبل النشر في الإنتاج:
1. استبدل localhost بالدومين الحقيقي
2. فعّل SSL/HTTPS
3. راجع إعدادات الأمان
4. اختبر جميع وظائف المصادقة
5. تأكد من عمل الإشعارات
