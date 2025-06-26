import { toast as sonnerToast } from 'sonner';
import { useLanguage } from '@/utils/languageContextUtils';

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Enhanced toast utilities with better translations and RTL support
export const useEnhancedToast = () => {
  const { t, isRTL } = useLanguage();

  // Get proper CSS classes for RTL support
  const getToastClasses = () => {
    return isRTL ? 'rtl:text-right rtl:pr-4 rtl:pl-12' : 'ltr:text-left ltr:pl-4 ltr:pr-12';
  };

  const toast = {
    success: (message: string, options?: ToastOptions) => {
      sonnerToast.success(message, {
        description: options?.description,
        duration: options?.duration || 4000,
        action: options?.action,
        className: getToastClasses(),
        style: {
          direction: isRTL ? 'rtl' : 'ltr',
          textAlign: isRTL ? 'right' : 'left',
        },
      });
    },

    error: (message: string, options?: ToastOptions) => {
      sonnerToast.error(message, {
        description: options?.description,
        duration: options?.duration || 5000,
        action: options?.action,
        className: getToastClasses(),
        style: {
          direction: isRTL ? 'rtl' : 'ltr',
          textAlign: isRTL ? 'right' : 'left',
        },
      });
    },

    warning: (message: string, options?: ToastOptions) => {
      sonnerToast(message, {
        description: options?.description,
        duration: options?.duration || 4000,
        action: options?.action,
        className: getToastClasses(),
        style: {
          direction: isRTL ? 'rtl' : 'ltr',
          textAlign: isRTL ? 'right' : 'left',
        },
      });
    },

    info: (message: string, options?: ToastOptions) => {
      sonnerToast(message, {
        description: options?.description,
        duration: options?.duration || 4000,
        action: options?.action,
        className: getToastClasses(),
        style: {
          direction: isRTL ? 'rtl' : 'ltr',
          textAlign: isRTL ? 'right' : 'left',
        },
      });
    },

    // مساعدة سريعة للاستخدام المباشر مع النصوص المترجمة
    loginRequired: () => {
      sonnerToast.error(t('loginRequired'), {
        description: t('mustBeLoggedIn'),
        className: getToastClasses(),
        duration: 5000,
        style: {
          direction: isRTL ? 'rtl' : 'ltr',
          textAlign: isRTL ? 'right' : 'left',
        },
      });
    },

    operationFailed: () => {
      sonnerToast.error(t('operationFailed'), {
        description: t('tryAgainLater'),
        className: getToastClasses(),
        duration: 5000,
        style: {
          direction: isRTL ? 'rtl' : 'ltr',
          textAlign: isRTL ? 'right' : 'left',
        },
      });
    },

    connectionError: () => {
      sonnerToast.error(t('connectionError'), {
        description: t('dataLoadFailed'),
        className: getToastClasses(),
        duration: 5000,
        style: {
          direction: isRTL ? 'rtl' : 'ltr',
          textAlign: isRTL ? 'right' : 'left',
        },
      });
    },

    dismiss: sonnerToast.dismiss,
    dismissAll: () => sonnerToast.dismiss(),
  };

  return toast;
};

// تصدير افتراضي أيضاً للتوافق
export default useEnhancedToast;
