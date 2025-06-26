import React from "react";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/utils/languageContextUtils";

interface ProgressIndicatorProps {
  value: number; // 0-100
  className?: string;
  size?: "sm" | "md" | "lg";
  showPercentage?: boolean;
  label?: string;
  color?: "default" | "success" | "warning" | "error";
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  value,
  className = "",
  size = "md",
  showPercentage = true,
  label,
  color = "default",
}) => {
  const { isRTL } = useLanguage();

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "h-2";
      case "lg":
        return "h-4";
      default:
        return "h-3";
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case "success":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-blue-500";
    }
  };

  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div 
      className={`w-full ${isRTL ? "rtl" : "ltr"} ${className}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {label && (
        <div className={`flex justify-between items-center mb-2 text-sm ${isRTL ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-gray-700 font-medium">{label}</span>
          {showPercentage && (
            <span className="text-gray-500 font-mono">
              {Math.round(clampedValue)}%
            </span>
          )}
        </div>
      )}
      
      <div className={`relative ${getSizeClasses()}`}>
        <Progress 
          value={clampedValue} 
          className={`w-full ${getSizeClasses()}`}
        />
        {/* Custom color overlay */}
        <div 
          className={`absolute top-0 ${isRTL ? "right-0" : "left-0"} h-full ${getColorClasses()} rounded-full transition-all duration-300 ease-in-out`}
          style={{ 
            width: `${clampedValue}%`,
            background: color !== "default" ? undefined : undefined
          }}
        />
      </div>
      
      {!label && showPercentage && (
        <div className={`text-center mt-1 text-xs text-gray-500 font-mono ${isRTL ? "text-right" : "text-left"}`}>
          {Math.round(clampedValue)}%
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator;
