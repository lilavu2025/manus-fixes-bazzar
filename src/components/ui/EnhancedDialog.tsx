import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/utils/languageContextUtils";
import { AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";

export type DialogType = "success" | "error" | "warning" | "info" | "confirm";

interface EnhancedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type?: DialogType;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  showIcon?: boolean;
  className?: string;
}

const EnhancedDialog: React.FC<EnhancedDialogProps> = ({
  open,
  onOpenChange,
  type = "info",
  title,
  description,
  children,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  isLoading = false,
  showIcon = true,
  className,
}) => {
  const { t, isRTL } = useLanguage();

  const getIcon = () => {
    if (!showIcon) return null;
    
    switch (type) {
      case "success":
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case "error":
        return <X className="h-6 w-6 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      case "confirm":
        return <AlertTriangle className="h-6 w-6 text-blue-600" />;
      default:
        return <Info className="h-6 w-6 text-blue-600" />;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case "success":
        return {
          icon: "text-green-600",
          button: "bg-green-600 hover:bg-green-700",
        };
      case "error":
        return {
          icon: "text-red-600",
          button: "bg-red-600 hover:bg-red-700",
        };
      case "warning":
        return {
          icon: "text-yellow-600",
          button: "bg-yellow-600 hover:bg-yellow-700",
        };
      case "confirm":
        return {
          icon: "text-blue-600",
          button: "bg-blue-600 hover:bg-blue-700",
        };
      default:
        return {
          icon: "text-blue-600",
          button: "bg-blue-600 hover:bg-blue-700",
        };
    }
  };

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
    if (type !== "confirm") {
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  const colorClasses = getColorClasses();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`sm:max-w-md ${isRTL ? "rtl" : "ltr"} ${className || ""}`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-3 ${isRTL ? "text-right" : "text-left"}`}>
            {getIcon()}
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className={isRTL ? "text-right" : "text-left"}>
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {children && (
          <div className="py-4">
            {children}
          </div>
        )}

        <DialogFooter className={`flex gap-2 ${isRTL ? "flex-row-reverse" : "flex-row"}`}>
          {(type === "confirm" || onCancel) && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className={isRTL ? "ml-auto" : "mr-auto"}
            >
              {cancelText || t("cancel")}
            </Button>
          )}
          
          {onConfirm && (
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className={colorClasses.button}
            >
              {isLoading && <LoadingSpinner size="sm" />}
              {confirmText || (type === "confirm" ? t("confirm") : t("ok"))}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedDialog;
