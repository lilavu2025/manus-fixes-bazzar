import React from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClearableInput } from "@/components/ui/ClearableInput";
import { useLanguage } from "@/utils/languageContextUtils";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showMobileSearch?: boolean;
  setShowMobileSearch?: (show: boolean) => void;
  isMobileOnly?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  showMobileSearch,
  setShowMobileSearch,
  isMobileOnly = false,
}) => {
  const { t, isRTL } = useLanguage();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  if (isMobileOnly) {
    return (
      <div
        className="w-full flex justify-center items-center"
        aria-label={t("searchBarMobile")}
      >
        <div className="relative w-full max-w-xs">
          <Search
            className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 ${isRTL ? "right-3" : "left-3"}`}
          />
          <ClearableInput
            placeholder={t("search")}
            value={searchQuery}
            onChange={handleSearchChange}
            onClear={() => onSearchChange("")}
            className={`${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"} h-12 rounded-full border-2 border-gray-200 focus:border-primary text-base w-full`}
            autoFocus
            aria-label={t("searchInput")}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Search */}
      <div
        className="hidden md:flex flex-1 max-w-md mx-4"
        aria-label={t("searchBarDesktop")}
      >
        <div className="relative w-full">
          <Search
            className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 ${isRTL ? "right-3" : "left-3"}`}
          />
          <ClearableInput
            placeholder={t("search")}
            value={searchQuery}
            onChange={handleSearchChange}
            onClear={() => onSearchChange("")}
            className={`${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"} h-11 rounded-full border-2 border-gray-200 focus:border-primary text-base`}
            aria-label={t("searchInput")}
          />
        </div>
      </div>
      {/* Mobile Search Toggle */}
      {setShowMobileSearch && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowMobileSearch(!showMobileSearch)}
          className="md:hidden h-10 w-10"
          aria-label={showMobileSearch ? t("closeSearch") : t("openSearch")}
        >
          {showMobileSearch ? (
            <X className="h-5 w-5" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </Button>
      )}
    </>
  );
};

export default SearchBar;
