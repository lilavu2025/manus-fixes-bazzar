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
    return `${isRTL ? 'rtl:text-right rtl:pr-4 rtl:pl-12' : 'ltr:text-left ltr:pl-4 ltr:pr-12'} 
            border-2 shadow-lg backdrop-blur-sm`;
  };

  // Helper function to get translated message - simplified to use translation keys directly
  const getTranslatedMessage = (messageKey: string): string => {
    return t(messageKey) || messageKey;
  };

  const toast = {
    success: (message: string, options?: ToastOptions) => {
      const translatedMessage = getTranslatedMessage(message);
      sonnerToast.success(translatedMessage, {
        description: options?.description ? getTranslatedMessage(options.description) : undefined,
        duration: options?.duration || 4000,
        action: options?.action,
        className: getToastClasses(),
        style: {
          direction: isRTL ? 'rtl' : 'ltr',
          textAlign: isRTL ? 'right' : 'left',
          fontFamily: isRTL ? 'Cairo, system-ui' : 'Inter, system-ui',
        },
      });
    },

    error: (message: string, options?: ToastOptions) => {
      const translatedMessage = getTranslatedMessage(message);
      sonnerToast.error(translatedMessage, {
        description: options?.description ? getTranslatedMessage(options.description) : undefined,
        duration: options?.duration || 6000, // longer for errors
        action: options?.action,
        className: getToastClasses(),
        style: {
          direction: isRTL ? 'rtl' : 'ltr',
          textAlign: isRTL ? 'right' : 'left',
          fontFamily: isRTL ? 'Cairo, system-ui' : 'Inter, system-ui',
        },
      });
    },

    warning: (message: string, options?: ToastOptions) => {
      const translatedMessage = getTranslatedMessage(message);
      sonnerToast.warning(translatedMessage, {
        description: options?.description ? getTranslatedMessage(options.description) : undefined,
        duration: options?.duration || 5000,
        action: options?.action,
        className: getToastClasses(),
        style: {
          direction: isRTL ? 'rtl' : 'ltr',
          textAlign: isRTL ? 'right' : 'left',
          fontFamily: isRTL ? 'Cairo, system-ui' : 'Inter, system-ui',
        },
      });
    },

    info: (message: string, options?: ToastOptions) => {
      const translatedMessage = getTranslatedMessage(message);
      sonnerToast.info(translatedMessage, {
        description: options?.description ? getTranslatedMessage(options.description) : undefined,
        duration: options?.duration || 4000,
        action: options?.action,
        className: getToastClasses(),
        style: {
          direction: isRTL ? 'rtl' : 'ltr',
          textAlign: isRTL ? 'right' : 'left',
          fontFamily: isRTL ? 'Cairo, system-ui' : 'Inter, system-ui',
        },
      });
    },

    // Convenience methods for common operations with better translation
    operationSuccess: (operation: string = '', customMessage?: string) => {
      const message = customMessage || operation || t('operationSuccessful');
      toast.success(message);
    },

    operationError: (operation: string = '', error?: string, customMessage?: string) => {
      const message = customMessage || operation || t('operationFailed');
      const description = error ? getTranslatedMessage(error) : undefined;
      toast.error(message, { description });
    },

    // Auth-specific convenience methods
    authSuccess: (type: 'login' | 'signup' | 'logout' | 'emailConfirmed' = 'login') => {
      const messages = {
        login: t('loginSuccess'),
        signup: t('signupSuccess'),
        logout: t('logoutSuccess'),
        emailConfirmed: t('emailConfirmedSuccessfully')
      };
      toast.success(messages[type]);
    },

    authError: (type: 'login' | 'signup' | 'emailNotConfirmed' | 'invalidCredentials' = 'login', customError?: string) => {
      const messages = {
        login: t('loginError'),
        signup: t('signupError'),
        emailNotConfirmed: t('emailNotConfirmed'),
        invalidCredentials: t('invalidLoginCredentials')
      };
      const message = customError ? getTranslatedMessage(customError) : messages[type];
      toast.error(message);
    },

    // Permission-specific methods
    accessDenied: (userType?: string) => {
      toast.error(t('accessDenied'), {
        description: userType === 'admin' ? t('adminAccessRequired') : t('loginRequired'),
        duration: 5000
      });
    },

    loginRequired: () => {
      toast.warning(t('loginRequired'), {
        description: t('mustBeLoggedIn'),
        duration: 5000
      });
    },

    // Cart-specific methods
    cartSuccess: (action: 'add' | 'remove' | 'update' = 'add') => {
      const messages = {
        add: t('addedToCart'),
        remove: t('removedFromCart'),
        update: t('cartUpdated')
      };
      toast.success(messages[action]);
    },

    // Network error handling with retry option
    networkError: (error?: string, retryAction?: () => void) => {
      toast.error(t('connectionError'), {
        description: error || t('dataLoadFailed'),
        duration: 6000,
        action: retryAction ? {
          label: t('tryAgainLater'),
          onClick: retryAction
        } : undefined
      });
    },

    // Admin operations
    adminSuccess: (operation: 'userDeleted' | 'orderAdded' | 'orderEdited' | 'orderDeleted' | 'productAdded' | 'productUpdated' | 'productDeleted') => {
      const message = getTranslatedMessage(operation);
      toast.success(message);
    },

    adminError: (operation: 'userDeleteFailed' | 'orderAddFailed') => {
      const message = getTranslatedMessage(operation);
      toast.error(message);
    },

    // Loading state (for longer operations)
    loading: (message: string = '') => {
      return sonnerToast.loading(getTranslatedMessage(message) || t('processingRequest'), {
        className: getToastClasses(),
        style: {
          direction: isRTL ? 'rtl' : 'ltr',
          textAlign: isRTL ? 'right' : 'left',
          fontFamily: isRTL ? 'Cairo, system-ui' : 'Inter, system-ui',
        },
      });
    },

    // Promise-based toast for async operations
    promise: <T>(
      promise: Promise<T>,
      {
        loading: loadingMessage = t('processingRequest'),
        success: successMessage = t('operationSuccessful'),
        error: errorMessage = t('operationFailed'),
      }: {
        loading?: string;
        success?: string | ((data: T) => string);
        error?: string | ((error: Error) => string);
      }
    ) => {
      return sonnerToast.promise(promise, {
        loading: getTranslatedMessage(loadingMessage),
        success: (data) => {
          if (typeof successMessage === 'function') {
            return successMessage(data);
          }
          return getTranslatedMessage(successMessage);
        },
        error: (error) => {
          if (typeof errorMessage === 'function') {
            return errorMessage(error);
          }
          return getTranslatedMessage(errorMessage);
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
