import * as React from "react";
import { memo, useEffect } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/useAuth";
import { useLanguage } from "@/utils/languageContextUtils";
import { Home } from "lucide-react";
import HeaderLogo from "./header/HeaderLogo";
import SearchBar from "./header/SearchBar";
import UserActions from "./header/UserActions";
import MobileNavigation from "./header/MobileNavigation";
import DesktopNavigation from "./header/DesktopNavigation";
import { getSetting } from "@/services/settingsService";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCartClick: () => void;
  onMenuClick: () => void;
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
  showMobileSearch?: boolean;
  setShowMobileSearch?: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = memo(
  ({
    searchQuery,
    onSearchChange,
    onCartClick,
    onMenuClick,
    mobileMenuOpen,
    setMobileMenuOpen,
    showMobileSearch,
    setShowMobileSearch,
  }) => {
    const [hideOffers, setHideOffers] = React.useState(false);
    const [loadingSetting, setLoadingSetting] = React.useState(true);
    const [isScrolled, setIsScrolled] = React.useState(false);
    const { user } = useAuth();
    const { t } = useLanguage();

    React.useEffect(() => {
      const handleScroll = () => {
        setIsScrolled(window.scrollY > 10);
      };
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
      getSetting("hide_offers_page").then((val) => {
        setHideOffers(val === "true");
        setLoadingSetting(false);
      });
    }, []);

    // استخدم props للتحكم في المنيو والبحث إذا تم تمريرها من App
    const menuOpen =
      typeof mobileMenuOpen === "boolean" ? mobileMenuOpen : false;
    const setMenuOpen = setMobileMenuOpen || (() => {});
    const mobileSearch =
      typeof showMobileSearch === "boolean" ? showMobileSearch : false;
    const setMobileSearch = setShowMobileSearch || (() => {});

    const navigationItems = React.useMemo(() => {
      if (loadingSetting)
        return [
          { path: "/", label: t("home"), icon: Home },
          { path: "/products", label: t("products") },
          { path: "/categories", label: t("categories") },
          ...(user ? [{ path: "/orders", label: t("orders") }] : []),
          { path: "/contact", label: t("contact") },
        ];
      return [
        { path: "/", label: t("home"), icon: Home },
        { path: "/products", label: t("products") },
        { path: "/categories", label: t("categories") },
        ...(!hideOffers ? [{ path: "/offers", label: t("offers") }] : []),
        ...(user ? [{ path: "/orders", label: t("orders") }] : []),
        { path: "/contact", label: t("contact") },
      ];
    }, [t, user, hideOffers, loadingSetting]);

    return (
      <header
        className={`bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100 sticky top-0 z-50 transition-all duration-300 ${mobileSearch ? "" : "hidden md:block"}`}
      >
        <div className="container mx-auto px-3 sm:px-4 lg:px-6">
          {/* Mobile Search Only */}
          {mobileSearch ? (
            <div className="flex items-center justify-between py-1 gap-2 md:hidden">
              <SearchBar
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
                showMobileSearch={mobileSearch}
                setShowMobileSearch={setMobileSearch}
                isMobileOnly={true}
              />
            </div>
          ) : (
            <>
              {/* Top bar */}
              <div className={`flex items-center justify-between gap-1 transition-all duration-300 ${isScrolled ? 'py-0 min-h-[20px]' : 'py-2 min-h-[56px]'}`}> 
                {/* Mobile Menu Button */}
                <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`md:hidden ${isScrolled ? 'h-4 w-4' : 'h-8 w-8'} hover:bg-gray-100 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200`}
                      aria-label={t("openMenu")}
                      onClick={onMenuClick}
                    >
                      <Menu className={`${isScrolled ? 'h-2.5 w-2.5' : 'h-5 w-5'}`} />
                    </Button>
                  </SheetTrigger>
                  <MobileNavigation
                    mobileMenuOpen={menuOpen}
                    setMobileMenuOpen={setMenuOpen}
                    navigationItems={navigationItems}
                  />
                </Sheet>
                {/* Centered Logo */}
                <div className="flex-1 flex justify-center items-center relative">
                  <div className={`transition-all duration-300 ${isScrolled ? 'scale-[0.7]' : 'scale-100'}`} style={{minWidth: isScrolled ? 40 : 100}}>
                    <HeaderLogo />
                  </div>
                </div>
                {/* Search */}
                <div className={`hidden lg:flex flex-1 transition-all duration-300 ${isScrolled ? 'max-h-5' : 'max-h-12'} justify-end`}>
                  <SearchBar
                    searchQuery={searchQuery}
                    onSearchChange={onSearchChange}
                    showMobileSearch={mobileSearch}
                    setShowMobileSearch={setMobileSearch}
                    isScrolled={isScrolled}
                  />
                </div>
                {/* Actions */}
                <div className="transition-all duration-300 scale-100 hidden lg:flex">
                  <UserActions onCartClick={onCartClick} />
                </div>
              </div>
              {/* Desktop Navigation */}
              <DesktopNavigation navigationItems={navigationItems} />
            </>
          )}
        </div>
      </header>
    );
  },
);

export default Header;

// Add display name for debugging
Header.displayName = "Header";
