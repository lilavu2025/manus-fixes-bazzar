import React from "react";
import { useLanguage } from "@/utils/languageContextUtils";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SearchResultsProps {
  query: string;
  resultsCount: number;
  totalCount: number;
  onClearSearch: () => void;
  appliedFilters?: { [key: string]: string };
  onClearFilter?: (key: string) => void;
  className?: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  resultsCount,
  totalCount,
  onClearSearch,
  appliedFilters = {},
  onClearFilter,
  className = "",
}) => {
  const { t, isRTL } = useLanguage();

  const hasFilters = Object.keys(appliedFilters).length > 0;
  const showingFiltered = resultsCount !== totalCount;

  return (
    <div 
      className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${isRTL ? "rtl" : "ltr"} ${className}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Search Query Info */}
      {query && (
        <div className={`flex items-center gap-2 mb-3 ${isRTL ? "flex-row-reverse" : "flex-row"}`}>
          <Search className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-800">
            {t("searchingFor")}: "<span className="font-semibold">{query}</span>"
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSearch}
            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Applied Filters */}
      {hasFilters && (
        <div className={`flex flex-wrap gap-2 mb-3 ${isRTL ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-sm text-blue-800 font-medium">
            {t("filters")}:
          </span>
          {Object.entries(appliedFilters).map(([key, value]) => (
            <Badge
              key={key}
              variant="secondary"
              className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
              onClick={() => onClearFilter?.(key)}
            >
              {t(key)}: {t(value)}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}

      {/* Results Count */}
      <div className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : "flex-row"}`}>
        <div className="text-sm text-blue-800">
          {showingFiltered ? (
            <>
              {t("showing")} <span className="font-semibold">{resultsCount}</span> {t("of")} <span className="font-semibold">{totalCount}</span> {t("results")}
            </>
          ) : (
            <>
              <span className="font-semibold">{resultsCount}</span> {t("results")} {t("found")}
            </>
          )}
        </div>

        {(query || hasFilters) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onClearSearch();
              Object.keys(appliedFilters).forEach(key => onClearFilter?.(key));
            }}
            className="text-blue-600 border-blue-300 hover:bg-blue-100 hover:border-blue-400"
          >
            {t("clearAll")}
          </Button>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
