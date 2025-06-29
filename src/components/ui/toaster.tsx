import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useLanguage } from '@/utils/languageContextUtils';

export function Toaster(props: React.ComponentProps<typeof ToastProvider>) {
  const { t } = useLanguage();
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>
                  {typeof description === "string"
                    ? t(
                        description === "Invalid login credentials"
                          ? "invalidLoginCredentials"
                          : description === "Passwords do not match"
                          ? "passwordsDoNotMatch"
                          : description === "Invalid login code"
                          ? "invalidLoginCode"
                          : description === "Invalid email or password"
                          ? "invalidLoginCredentials"
                          : description
                      )
                    : description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
