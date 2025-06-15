import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from '@/utils/languageContextUtils';

export interface ClearableInputProps extends React.ComponentProps<"input"> {
  onClear?: () => void;
}

export const ClearableInput = React.forwardRef<HTMLInputElement, ClearableInputProps>(
  ({ className, type = "text", value, onChange, onClear, ...props }, ref) => {
    const { t } = useLanguage();
    return (
      <div className="relative w-full">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pr-10",
            className
          )}
          value={value}
          onChange={onChange}
          ref={ref}
          {...props}
        />
        {value && value !== "" && (
          <button
            type="button"
            tabIndex={-1}
            className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            onClick={onClear}
            aria-label={t('clearInput')}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }
);
ClearableInput.displayName = "ClearableInput";
