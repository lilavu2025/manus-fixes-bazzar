import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import type { VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/utils/ui/buttonUtils"
import { useLanguage, isRTL } from "@/utils/languageContextUtils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const { language } = useLanguage();
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), isRTL(language) ? "rtl" : "ltr")}
        style={{ direction: isRTL(language) ? "rtl" : "ltr" }}
        ref={ref}
        aria-label={typeof props.children === 'string' ? props.children : undefined}
        {...props}
      />
    );
  }
)
Button.displayName = "Button"

export { Button }
