// منع فتح DevTools في بيئة الإنتاج
// هذا الملف سيتم تحميله فقط في الإنتاج

const isProduction = import.meta.env.PROD;

if (isProduction) {
  // منع فتح DevTools
  const disableDevTools = () => {
    // منع F12
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && e.key === 'I') || // Ctrl+Shift+I
          (e.ctrlKey && e.shiftKey && e.key === 'J') || // Ctrl+Shift+J
          (e.ctrlKey && e.key === 'U')) { // Ctrl+U
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    });

    // منع النقر بالزر الأيمن
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });

    // فحص إذا كان DevTools مفتوح
    const devToolsChecker = () => {
      const startTime = performance.now();
      debugger;
      const endTime = performance.now();
      
      if (endTime - startTime > 100) {
        // DevTools مفتوح، قم بإعادة توجيه أو إخفاء المحتوى
        document.body.innerHTML = '<div style="text-align:center;margin-top:50px;"><h1>😊</h1><p>يرجى إغلاق أدوات المطور للمتابعة</p></div>';
      }
    };

    // فحص دوري
    setInterval(devToolsChecker, 1000);
  };

  // تطبيق الحماية بعد تحميل الصفحة
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', disableDevTools);
  } else {
    disableDevTools();
  }

  // إخفاء console logs
  const originalConsole = { ...console };
  Object.keys(console).forEach(key => {
    if (typeof console[key] === 'function') {
      console[key] = () => {};
    }
  });

  // منع استخدام eval و Function constructor
  window.eval = function() {
    throw new Error('eval is disabled');
  };
  
  // @ts-ignore
  window.Function = function() {
    throw new Error('Function constructor is disabled');
  };
}

export {};
