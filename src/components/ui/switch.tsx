import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";
import { useLanguage, isRTL } from "@/utils/languageContextUtils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => {
  const { language } = useLanguage();
  const isRtl = isRTL(language);

  return (
    <SwitchPrimitives.Root
      className={cn(
        "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        "relative", // نضيف relative للـ container
        className,
      )}
      {...props}
      ref={ref}
      style={{
        // أبعاد ثابتة بال px لضمان عدم تغيرها في الشاشات الصغيرة
        width: '44px',
        height: '24px',
        minWidth: '44px',
        minHeight: '24px'
      }}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-all duration-200 ease-in-out absolute",
          // نزيل الـ left classes ونحطها في الـ style
        )}
        style={{
          // حجم ثابت للإبهام بال px
          width: '20px',
          height: '20px',
          top: '0px', // رفعناها أكثر
          // المواضع بناءً على الاتجاه - حركنا لليسار أكثر
          left: isRtl 
            ? (props.checked ? '0px' : '20px')  // RTL: حركنا لليسار أكثر
            : (props.checked ? '20px' : '0px'), // LTR: حركنا لليسار أكثر
          transition: 'left 0.2s ease-in-out'
        }}
      />
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
