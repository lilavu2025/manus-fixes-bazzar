import * as React from "react";
import { memo, useEffect } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/useAuth";
import { useLanguage } from "@/utils/languageContextUtils";
import { Home } from "lucide-react";
import HeaderLogo from "./header/HeaderLogo";
import UserActions from "./header/UserActions";
import MobileNavigation from "./header/MobileNavigation";
import DesktopNavigation from "./header/DesktopNavigation";
import { getSetting } from "@/services/settingsService";

interface HeaderProps {
  onCartClick: () => void;
  onMenuClick: () => void;
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
}

  const Header: React.FC<HeaderProps> = memo(
  ({
    onCartClick,
    onMenuClick,
    mobileMenuOpen,
    setMobileMenuOpen,
  }) => {
    const [hideOffers, setHideOffers] = React.useState(false);
    const [loadingSetting, setLoadingSetting] = React.useState(true);
    const [isScrolled, setIsScrolled] = React.useState(false);
    const { user } = useAuth();
    const { t, isRTL } = useLanguage();

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

    // استخدم props للتحكم في المنيو إذا تم تمريرها من App
    const menuOpen =
      typeof mobileMenuOpen === "boolean" ? mobileMenuOpen : false;
    const setMenuOpen = setMobileMenuOpen || (() => {});

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
        className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100 sticky top-0 z-50 transition-all duration-300"
      >
        <div className="container mx-auto px-3 sm:px-4 lg:px-6">
          {/* Mobile Top bar */}
          <div className={`md:hidden flex items-center justify-between transition-all duration-300 ${isScrolled ? 'py-1 min-h-[40px]' : 'py-2 min-h-[56px]'} ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}> 
            {/* Logo and Store Name */}
            <div className="flex items-center gap-2">
              <HeaderLogo isMobile={true} isScrolled={isScrolled} />
            </div>
            
            {/* Menu Button */}
            <div className="flex-shrink-0">
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`${isScrolled ? 'h-8 w-8' : 'h-10 w-10'} hover:bg-gray-100 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200`}
                    aria-label={t("openMenu")}
                    onClick={onMenuClick}
                  >
                    <Menu className={`${isScrolled ? 'h-4 w-4' : 'h-5 w-5'}`} />
                  </Button>
                </SheetTrigger>
                <MobileNavigation
                  mobileMenuOpen={menuOpen}
                  setMobileMenuOpen={setMenuOpen}
                  navigationItems={navigationItems}
                />
              </Sheet>
            </div>
          </div>

          {/* Desktop Top bar */}
          <div className={`hidden md:flex items-center justify-between gap-1 transition-all duration-300 ${isScrolled ? 'py-0 min-h-[20px]' : 'py-2 min-h-[56px]'}`}> 
            {/* Desktop Logo */}
            <div className="flex-2 flex justify-center items-center relative">
              <div className={`transition-all duration-300 ${isScrolled ? 'scale-[0.7]' : 'scale-100'}`} style={{minWidth: isScrolled ? 40 : 100}}>
                <HeaderLogo isMobile={false} isScrolled={isScrolled} />
              </div>
            </div>
            {/* Desktop Actions */}
            <div className="transition-all duration-300 scale-100">
              <UserActions onCartClick={onCartClick} />
            </div>
          </div>
          {/* Desktop Navigation */}
          <DesktopNavigation navigationItems={navigationItems} isScrolled={isScrolled} />
        </div>
      </header>
    );
  },
);

export default Header;

// Add display name for debugging
Header.displayName = "Header";
