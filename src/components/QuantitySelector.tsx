import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/utils/languageContextUtils";
import { toast } from "sonner";

interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  max?: number;
  min?: number;
  disabled?: boolean;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onQuantityChange,
  max = 999,
  min = 1,
  disabled = false,
}) => {
  const { isRTL } = useLanguage();
  const [inputValue, setInputValue] = useState(quantity.toString());
  const debounceRef = useRef<number | null>(null);
  const isDisabled = disabled || max <= 0; // auto-disable when out of stock (max <= 0)
  
  // Calculate input width based on the number of digits
  const getInputWidth = (value: string) => {
    const digits = value.length;
    // Base width + additional width per digit
    const baseWidth = 3; // rem
    const perDigitWidth = 0.6; // rem per digit
    return Math.max(baseWidth, baseWidth + (digits - 1) * perDigitWidth);
  };

  // Sync local input when external props change (do not emit change here)
  useEffect(() => {
    let q = quantity;
    if (q < min) q = min;
    if (q > max) q = max;
    setInputValue(q.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantity, min, max]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const commitValue = (raw: string, reason: "debounce" | "blur" | "enter") => {
    const sanitized = raw.replace(/[^0-9]/g, "");
    // If empty, fallback to min on commit
    if (sanitized === "") {
      setInputValue(min.toString());
      if (quantity !== min) onQuantityChange(min);
      return;
    }
    const numValue = parseInt(sanitized, 10);
    const clamped = Math.min(max, Math.max(min, isNaN(numValue) ? min : numValue));
    if (!isNaN(numValue) && numValue > max) {
      toast.error(`${isRTL ? 'الكمية المتوفرة من هذا المنتج هي' : 'Available quantity is'} ${max}`);
    }
    setInputValue(clamped.toString());
    if (clamped !== quantity) onQuantityChange(clamped);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only digits to be displayed during typing
    const sanitized = value.replace(/[^0-9]/g, "");
    setInputValue(sanitized);
    // Debounce committing the value to avoid mid-typing clamp (e.g., typing 500 quickly)
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      commitValue(sanitized, "debounce");
    }, 300);
  };

  const handleInputBlur = () => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    commitValue(inputValue, "blur");
  };

  const increment = () => {
    if (isDisabled) return;
    if (quantity < max) {
      const newQuantity = quantity + 1;
      setInputValue(newQuantity.toString());
      onQuantityChange(newQuantity);
    }
  };

  const decrement = () => {
    if (isDisabled) return;
    if (quantity > min) {
      const newQuantity = quantity - 1;
      setInputValue(newQuantity.toString());
      onQuantityChange(newQuantity);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${isRTL ? "flex-row-reverse" : "flex-row"}`}>
      <Button
        size="icon"
        variant="outline"
        className="h-8 w-8"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          decrement();
        }}
        disabled={quantity <= min || isDisabled}
      >
        <Minus className="h-4 w-4" />
      </Button>

      <Input
        type="text" // Use text to avoid native number quirks while still showing numeric keypad via inputMode
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (debounceRef.current) window.clearTimeout(debounceRef.current);
            commitValue(inputValue, 'enter');
          }
        }}
        className={`text-center ${isRTL ? "text-right" : "text-left"}`}
        style={{ 
          width: `${getInputWidth(inputValue)}rem`,
          minWidth: '3rem'
        }}
        min={min}
        max={max}
        inputMode="numeric"
        pattern="[0-9]*"
        dir={isRTL ? "rtl" : "ltr"}
        disabled={isDisabled}
      />

      <Button
        size="icon"
        variant="outline"
        className="h-8 w-8"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          increment();
        }}
        disabled={quantity >= max || isDisabled}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default QuantitySelector;
