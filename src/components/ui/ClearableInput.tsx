import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/utils/languageContextUtils";

export interface ClearableInputProps extends React.ComponentProps<"input"> {
  onClear?: () => void;
  autoResize?: boolean;
  minWidth?: string;
  maxWidth?: string;
}

export const ClearableInput = React.forwardRef<
  HTMLInputElement,
  ClearableInputProps
>(({ className, type = "text", value, onChange, onClear, autoResize = false, minWidth = "150px", maxWidth = "400px", ...props }, ref) => {
  const { t } = useLanguage();
  const [inputWidth, setInputWidth] = React.useState(minWidth);

  // Calculate input width based on content
  React.useEffect(() => {
    if (autoResize && value) {
      // Create a temporary span to measure text width
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        context.font = '14px system-ui, -apple-system, sans-serif'; // Approximate font
        const textWidth = context.measureText(value.toString()).width;
        const calculatedWidth = Math.max(textWidth + 40, parseInt(minWidth)); // +40 for padding and clear button
        const finalWidth = Math.min(calculatedWidth, parseInt(maxWidth));
        setInputWidth(`${finalWidth}px`);
      }
    } else if (!autoResize) {
      setInputWidth('100%');
    }
  }, [value, autoResize, minWidth, maxWidth]);

  return (
    <div className="relative" style={{ width: autoResize ? inputWidth : '100%' }}>
      <input
        type={type}
        className={cn(
          "flex h-auto min-h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pr-7",
          autoResize ? "" : "w-full",
          className,
        )}
        style={{ 
          width: autoResize ? '100%' : undefined
        }}
        title={value?.toString() || ""}
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
          aria-label={t("clearInput")}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
});
ClearableInput.displayName = "ClearableInput";
