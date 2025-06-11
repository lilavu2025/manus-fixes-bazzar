import React from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/utils/languageContextUtils';

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
  isMobileOnly = false
}) => {
  const { t, isRTL } = useLanguage();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  if (isMobileOnly) {
    return (
      <div className="relative">
        <Search className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 ${isRTL ? 'right-3' : 'left-3'}`} />
        <Input
          placeholder={t('search')}
          value={searchQuery}
          onChange={handleSearchChange}
          className={`${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} h-12 rounded-full border-2 border-gray-200 focus:border-primary text-base`}
          autoFocus
        />
      </div>
    );
  }

  return (
    <>
      {/* Desktop Search */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 ${isRTL ? 'right-3' : 'left-3'}`} />
          <Input
            placeholder={t('search')}
            value={searchQuery}
            onChange={handleSearchChange}
            className={`${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} h-11 rounded-full border-2 border-gray-200 focus:border-primary text-base`}
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
        >
          {showMobileSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
        </Button>
      )}
    </>
  );
};

export default SearchBar;
