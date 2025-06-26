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

// Enhanced toast utilities with better translations and styling
export const useEnhancedToast = () => {
  const { t } = useLanguage();

  const toast = {
    success: (message: string, options?: ToastOptions) => {
      sonnerToast.success(message, {
        description: options?.description,
        duration: options?.duration || 4000,
        action: options?.action,
        className: 'rtl:text-right',
      });
    },

    error: (message: string, options?: ToastOptions) => {
      sonnerToast.error(message, {
        description: options?.description,
        duration: options?.duration || 5000,
        action: options?.action,
        className: 'rtl:text-right',
      });
    },

    warning: (message: string, options?: ToastOptions) => {
      sonnerToast.warning(message, {
        description: options?.description,
        duration: options?.duration || 4000,
        action: options?.action,
        className: 'rtl:text-right',
      });
    },

    info: (message: string, options?: ToastOptions) => {
      sonnerToast.info(message, {
        description: options?.description,
        duration: options?.duration || 4000,
        action: options?.action,
        className: 'rtl:text-right',
      });
    },

    // Convenience methods for common operations
    operationSuccess: (operation: string = '') => {
      sonnerToast.success(operation || t('operationSuccessful'), {
        className: 'rtl:text-right',
        duration: 3000,
      });
    },

    operationError: (operation: string = '', error?: string) => {
      sonnerToast.error(operation || t('operationFailed'), {
        description: error || t('unexpectedErrorOccurred'),
        className: 'rtl:text-right',
        duration: 5000,
      });
    },

    connectionError: () => {
      sonnerToast.error(t('connectionError'), {
        description: t('dataLoadFailed'),
        className: 'rtl:text-right',
        duration: 5000,
      });
    },

    dismiss: sonnerToast.dismiss,
    dismissAll: () => sonnerToast.dismiss(),
  };

  return toast;
};

export default useEnhancedToast;
