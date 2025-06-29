// Rate Limiter للمصادقة - حماية في الكود
interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastAttempt: number;
}

interface RateLimitStore {
  [key: string]: RateLimitEntry;
}

class AuthRateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: number | null = null;

  constructor() {
    // تنظيف البيانات القديمة كل 10 دقائق
    this.cleanupInterval = window.setInterval(() => {
      this.cleanup();
    }, 10 * 60 * 1000);
  }

  /**
   * فحص ما إذا كان المستخدم قد تجاوز الحد المسموح
   */
  checkLimit(
    identifier: string,
    type: 'email' | 'sms' | 'password_reset' = 'email',
    maxRequests: number = 5,
    windowMs: number = 5 * 60 * 1000 // 5 دقائق
  ): { allowed: boolean; resetTime?: number; remainingAttempts?: number } {
    const key = `${type}_${identifier}`;
    const now = Date.now();

    // إذا لم توجد محاولات سابقة أو انتهت المدة الزمنية
    if (!this.store[key] || now > this.store[key].resetTime) {
      this.store[key] = {
        count: 1,
        resetTime: now + windowMs,
        lastAttempt: now
      };
      
      return {
        allowed: true,
        remainingAttempts: maxRequests - 1
      };
    }

    const entry = this.store[key];

    // إذا تم تجاوز الحد المسموح
    if (entry.count >= maxRequests) {
      return {
        allowed: false,
        resetTime: entry.resetTime,
        remainingAttempts: 0
      };
    }

    // زيادة العداد
    entry.count++;
    entry.lastAttempt = now;

    return {
      allowed: true,
      remainingAttempts: maxRequests - entry.count
    };
  }

  /**
   * الحصول على معلومات الحد المتبقي
   */
  getLimitInfo(identifier: string, type: 'email' | 'sms' | 'password_reset' = 'email') {
    const key = `${type}_${identifier}`;
    const entry = this.store[key];

    if (!entry) {
      return { hasLimit: false };
    }

    const now = Date.now();
    if (now > entry.resetTime) {
      return { hasLimit: false };
    }

    const secondsUntilReset = Math.ceil((entry.resetTime - now) / 1000);
    const minutesUntilReset = Math.ceil(secondsUntilReset / 60);

    return {
      hasLimit: true,
      count: entry.count,
      resetTime: entry.resetTime,
      secondsUntilReset,
      minutesUntilReset
    };
  }

  /**
   * إعادة تعيين الحد لمستخدم معين (للإدارة)
   */
  resetLimit(identifier: string, type: 'email' | 'sms' | 'password_reset' = 'email') {
    const key = `${type}_${identifier}`;
    delete this.store[key];
  }

  /**
   * تنظيف البيانات المنتهية الصلاحية
   */
  private cleanup() {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  /**
   * تدمير Rate Limiter
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store = {};
  }
}

// إنشاء instance واحد للتطبيق كله
export const authRateLimiter = new AuthRateLimiter();

// دوال مساعدة للاستخدام السهل
export const checkEmailRateLimit = (email: string) => {
  return authRateLimiter.checkLimit(email, 'email', 5, 5 * 60 * 1000);
};

export const checkSMSRateLimit = (phone: string) => {
  return authRateLimiter.checkLimit(phone, 'sms', 3, 5 * 60 * 1000);
};

export const checkPasswordResetRateLimit = (email: string) => {
  return authRateLimiter.checkLimit(email, 'password_reset', 3, 10 * 60 * 1000);
};

// معلومات مفيدة للمطور
export const getRateLimitInfo = {
  email: (email: string) => authRateLimiter.getLimitInfo(email, 'email'),
  sms: (phone: string) => authRateLimiter.getLimitInfo(phone, 'sms'),
  passwordReset: (email: string) => authRateLimiter.getLimitInfo(email, 'password_reset')
};

// رسائل خطأ باللغات المختلفة
export const getRateLimitMessage = (
  type: 'email' | 'sms' | 'password_reset',
  resetTime: number,
  language: 'ar' | 'en' | 'he' = 'ar'
) => {
  const minutesLeft = Math.ceil((resetTime - Date.now()) / (1000 * 60));
  
  const messages = {
    ar: {
      email: `تم تجاوز حد إرسال الإيميلات. جرب مرة أخرى بعد ${minutesLeft} دقيقة.`,
      sms: `تم تجاوز حد إرسال الرسائل النصية. جرب مرة أخرى بعد ${minutesLeft} دقيقة.`,
      password_reset: `تم تجاوز حد طلبات إعادة تعيين كلمة المرور. جرب مرة أخرى بعد ${minutesLeft} دقيقة.`
    },
    en: {
      email: `Email rate limit exceeded. Try again in ${minutesLeft} minutes.`,
      sms: `SMS rate limit exceeded. Try again in ${minutesLeft} minutes.`,
      password_reset: `Password reset rate limit exceeded. Try again in ${minutesLeft} minutes.`
    },
    he: {
      email: `חריגה ממגבלת שליחת אימיילים. נסה שוב בעוד ${minutesLeft} דקות.`,
      sms: `חריגה ממגבלת שליחת SMS. נסה שוב בעוד ${minutesLeft} דקות.`,
      password_reset: `חריגה ממגבלת איפוס סיסמה. נסה שוב בעוד ${minutesLeft} דקות.`
    }
  };

  return messages[language][type];
};
