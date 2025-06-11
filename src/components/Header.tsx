import React, { useState, memo, useCallback, useMemo } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/useAuth';
import { useLanguage } from '@/utils/languageContextUtils';
import { Home } from 'lucide-react';
import HeaderLogo from './header/HeaderLogo';
import SearchBar from './header/SearchBar';
import UserActions from './header/UserActions';
import MobileNavigation from './header/MobileNavigation';
import DesktopNavigation from './header/DesktopNavigation';

interface HeaderProps {
  onSearchChange: (query: string) => void;
  onCartClick: () => void;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = memo(({ onSearchChange, onCartClick, onMenuClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    onSearchChange(query);
  }, [onSearchChange]);

  const handleMobileMenuToggle = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  const handleMobileSearchToggle = useCallback(() => {
    setShowMobileSearch(prev => !prev);
  }, []);

  const navigationItems = useMemo(() => [
    { path: '/', label: t('home'), icon: Home },
    { path: '/products', label: t('products') },
    { path: '/categories', label: t('categories') },
    { path: '/offers', label: t('offers') },
    ...(user ? [{ path: '/orders', label: t('orders') }] : []),
    { path: '/contact', label: t('contact') },
  ], [t, user]);

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100 sticky top-0 z-50 transition-all duration-300">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        {/* Top bar */}
        <div className="flex items-center justify-between py-3 sm:py-4 gap-2">
          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-10 w-10 hover:bg-gray-100 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200"
                aria-label={t('openMenu')}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <MobileNavigation 
              mobileMenuOpen={mobileMenuOpen}
              setMobileMenuOpen={setMobileMenuOpen}
              navigationItems={navigationItems}
            />
          </Sheet>
          
          {/* Logo */}
          <HeaderLogo />

          {/* Search */}
          <SearchBar 
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            showMobileSearch={showMobileSearch}
            setShowMobileSearch={handleMobileSearchToggle}
          />

          {/* Actions */}
          <UserActions onCartClick={onCartClick} />
        </div>

        {/* Mobile Search Bar */}
        {showMobileSearch && (
          <div className="md:hidden pb-3 animate-fade-in">
            <SearchBar 
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              isMobileOnly={true}
            />
          </div>
        )}

        {/* Desktop Navigation */}
        <DesktopNavigation navigationItems={navigationItems} />
      </div>
    </header>
  );
});

export default Header;

// Add display name for debugging
Header.displayName = 'Header';
