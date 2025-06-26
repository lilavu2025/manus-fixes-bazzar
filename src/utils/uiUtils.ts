/**
 * UI Utilities - All UI component utilities in one place
 * دمج جميع أدوات واجهة المستخدم في مكان واحد
 */

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Button Variants
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Badge Variants
export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-green-500 text-white hover:bg-green-600",
        warning: "border-transparent bg-yellow-500 text-white hover:bg-yellow-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// Toast Utilities
export const getToastClassNames = (isRTL: boolean) => {
  return cn(
    "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
    isRTL ? "text-right" : "text-left"
  );
};

// Form Utilities
export const getFormFieldClasses = (isRTL: boolean, hasError?: boolean) => {
  return cn(
    "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    isRTL && "text-right",
    hasError && "border-destructive focus-visible:ring-destructive"
  );
};

// Navigation Utilities
export const getNavItemClasses = (isActive: boolean, isRTL: boolean) => {
  return cn(
    "flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isRTL && "space-x-reverse",
    isActive
      ? "bg-accent text-accent-foreground"
      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
  );
};

// Sidebar Utilities
export const getSidebarClasses = (isOpen: boolean, isRTL: boolean) => {
  return cn(
    "fixed inset-y-0 z-50 w-72 bg-background shadow-lg transition-transform duration-300 ease-in-out",
    isRTL ? "right-0" : "left-0",
    isOpen ? "translate-x-0" : isRTL ? "translate-x-full" : "-translate-x-full"
  );
};

// Toggle Utilities
export const getToggleClasses = (pressed: boolean, size: "sm" | "default" | "lg" = "default") => {
  const sizeClasses = {
    sm: "h-8 px-2",
    default: "h-10 px-3",
    lg: "h-12 px-4"
  };
  
  return cn(
    "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    sizeClasses[size],
    pressed && "bg-accent text-accent-foreground"
  );
};

// Tab Utilities
export const getTabTriggerClasses = (isActive: boolean) => {
  return cn(
    "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    isActive
      ? "bg-background text-foreground shadow-sm"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  );
};

// Dropdown Menu Utilities
export const getDropdownMenuItemClasses = (inset?: boolean) => {
  return cn(
    "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    inset && "pl-8"
  );
};

// Export types for component props
export type ButtonVariants = VariantProps<typeof buttonVariants>;
export type BadgeVariants = VariantProps<typeof badgeVariants>;
