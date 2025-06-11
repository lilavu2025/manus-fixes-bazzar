export { toast } from 'sonner';

// ضع هنا الدوال أو الثوابت غير المكونية التي كانت في sonner.tsx إذا كانت موجودة
export const toastOptions = {
  classNames: {
    toast:
      "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
    description: "group-[.toast]:text-muted-foreground",
    actionButton:
      "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
    cancelButton:
      "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
  },
};
