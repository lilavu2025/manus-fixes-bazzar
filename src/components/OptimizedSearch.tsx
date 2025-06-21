import * as React from "react";
import { useState, useCallback, useMemo } from "react";
import { Search } from "lucide-react";
import { ClearableInput } from "@/components/ui/ClearableInput";
import { debounce } from "@/utils/performanceOptimizations";

interface OptimizedSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

const OptimizedSearch: React.FC<OptimizedSearchProps> = ({
  onSearch,
  placeholder = "البحث...",
  debounceMs = 300,
  className = "",
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Memoized debounced search function
  const debouncedSearch = useMemo(
    () => debounce(onSearch, debounceMs),
    [onSearch, debounceMs],
  );

  // Handle input change with debouncing
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);
      debouncedSearch(value);
    },
    [debouncedSearch],
  );

  return (
    <div
      className={`relative flex items-center w-full overflow-hidden rounded-xl bg-white shadow-sm ${className} !block`}
      style={{ minHeight: "40px", minWidth: 0 }}
    >
      <Search className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none z-10" />
      <ClearableInput
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={handleInputChange}
        onClear={() => {
          setSearchQuery("");
          debouncedSearch("");
        }}
        className="pr-8 sm:pr-10 pl-2 sm:pl-4 py-2 w-full bg-transparent border-none focus:ring-0 text-xs sm:text-sm md:text-base"
        dir="rtl"
        style={{ borderRadius: 0, boxShadow: "none", minWidth: 0 }}
      />
      {/* زر الشراء دائماً داخل الكرت، حجمه ثابت، لا يختفي ولا يضغط على النص */}
      {typeof className === "string" && className.includes("with-buy") && (
        <button
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-primary text-white rounded-md px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm md:px-4 md:py-2 md:text-base font-bold shadow hover:bg-primary/90 transition-all"
          style={{
            maxWidth: "110px",
            minWidth: "70px",
            width: "auto",
            whiteSpace: "nowrap",
            zIndex: 11,
          }}
        >
          اشتري الآن
        </button>
      )}
    </div>
  );
};

export default React.memo(OptimizedSearch);

// تم حذف كل منطق الجلسة أو الأحداث (addEventListener, refetch, supabase.auth, visibilitychange) من هذا الملف. استخدم AuthContext فقط.
// ملاحظة: إذا كنت تستخدم هذا الكرت ضمن شبكة (grid) أو flex في صفحة المنتجات أو أي مكان آخر، تأكد أن الكلاس grid-cols-1 أو flex-col مفعّل على الشاشات الصغيرة (مثلاً: grid-cols-1 sm:grid-cols-2 ...).
