// فلتر شامل لإخفاء رسائل Console غير المرغوب فيها

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// في بيئة التطوير: إخفاء رسائل محددة فقط
// في بيئة الإنتاج: إخفاء جميع الرسائل

if (isDevelopment || isProduction) {
  // حفظ الدوال الأصلية
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
    trace: console.trace
  };
  
  // قائمة النصوص المراد إخفاؤها في التطوير
  const hiddenMessages = [
    'Fetch finished loading',
    'XMLHttpRequest finished loading',
    'Resource loading',
    'Network request completed',
    'GET http',
    'POST http',
    'PUT http',
    'DELETE http',
    'PATCH http'
  ];
  
  // دالة لفحص إذا كانت الرسالة يجب إخفاؤها
  const shouldHideMessage = (message: string): boolean => {
    if (isProduction) return true; // إخفاء كل شيء في الإنتاج
    
    return hiddenMessages.some(hiddenMsg => 
      message.toString().toLowerCase().includes(hiddenMsg.toLowerCase())
    );
  };
  
  // دالة مساعدة للتحقق من الرسائل
  const filterConsoleMethod = (originalMethod: Function) => {
    return (...args: any[]) => {
      const message = args.join(' ');
      if (!shouldHideMessage(message)) {
        originalMethod.apply(console, args);
      }
    };
  };
  
  // استبدال جميع دوال console
  if (isProduction) {
    // في الإنتاج: تعطيل console تماماً
    console.log = () => {};
    console.info = () => {};
    console.warn = () => {};
    console.error = () => {}; // يمكن الاحتفاظ بالأخطاء للمراقبة
    console.debug = () => {};
    console.trace = () => {};
  } else if (isDevelopment) {
    // في التطوير: فلترة انتقائية
    console.log = filterConsoleMethod(originalConsole.log);
    console.info = filterConsoleMethod(originalConsole.info);
    console.warn = filterConsoleMethod(originalConsole.warn);
    // الاحتفاظ بـ error في التطوير
    console.debug = filterConsoleMethod(originalConsole.debug);
  }
  
  // إخفاء رسائل الشبكة من DevTools (إذا كان ممكناً)
  const hideNetworkMessages = () => {
    try {
      // محاولة إخفاء رسائل الشبكة عبر CSS injection
      const style = document.createElement('style');
      style.textContent = `
        /* محاولة إخفاء رسائل DevTools */
        .console-message[data-category="network"],
        .console-message[data-category="xhr"],
        .console-message[data-category="fetch"] {
          display: none !important;
        }
        
        /* إخفاء رسائل محددة */
        .console-message-text:contains("Fetch finished loading"),
        .console-message-text:contains("XMLHttpRequest finished loading") {
          display: none !important;
        }
      `;
      
      if (document.head) {
        document.head.appendChild(style);
      } else {
        document.addEventListener('DOMContentLoaded', () => {
          document.head?.appendChild(style);
        });
      }
    } catch (error) {
      // تجاهل الأخطاء
    }
  };
  
  // تطبيق إخفاء رسائل الشبكة
  hideNetworkMessages();
  
  // منع طباعة تفاصيل الطلبات
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch.apply(window, args);
      // عدم طباعة تفاصيل الاستجابة
      return response;
    } catch (error) {
      if (isDevelopment) {
        originalConsole.error('Network Error:', error);
      }
      throw error;
    }
  };
  
  // منع طباعة XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(...args) {
    // منع طباعة تفاصيل XHR
    return originalXHROpen.apply(this, args);
  };
}

export {};
