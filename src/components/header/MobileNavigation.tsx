import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/useAuth";
import { useLanguage } from "@/utils/languageContextUtils";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import config from "@/configs/activeConfig";

interface MobileNavigationProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  navigationItems: Array<{
    path: string;
    label: string;
    icon?: React.ElementType;
  }>;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  mobileMenuOpen,
  setMobileMenuOpen,
  navigationItems,
}) => {
  const { user, profile, signOut } = useAuth();
  const { t, isRTL } = useLanguage();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const isActive = (path: string) => location.pathname === path;
  const { primaryColor, secondaryColor } = config.visual;

  return (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetContent side={isRTL ? "left" : "right"} className="w-80 p-0 flex flex-col">
        {/* Header - ثابت في الأعلى */}
        <div className="mobile-nav-header flex-shrink-0 p-6 border-b">
          <Link
            to="/"
            className="flex items-center gap-3"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="w-24 h-24 bg-gradient-to-r [hsl(var(--primary))] to-[hsl(var(--secondary))] text-[hsl(var(--primary-foreground))] rounded-full flex items-center justify-center mx-auto mb-4">
              <img
                src={config.visual.logo}
                alt={t('storeName')}
                className="w-24 h-24 sm:w-24 sm:h-24 rounded-lg object-contain bg-white shadow"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {t("storeName")}
              </h1>
              <p className="text-sm text-gray-500">{t("storeDescription")}</p>
            </div>
          </Link>
        </div>

        {/* Navigation - قابل للتمرير */}
        <nav className="mobile-nav-content flex-1 overflow-y-auto p-6">
          <div className="space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive(item.path)
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-lg transform scale-105"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {item.icon && <item.icon className="h-5 w-5" />}
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Footer - ثابت في الأسفل */}
        <div className="mobile-nav-footer flex-shrink-0 p-6 border-t bg-gray-50">
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {profile?.full_name?.charAt(0) || "U"}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {profile?.full_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t(profile?.user_type || "user")}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      {t("profile")}
                    </Link>
                  </Button>

                  {profile?.user_type === "admin" && (
                    <Button
                      asChild
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Link
                        to="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {t("admin")}
                      </Link>
                    </Button>
                  )}

                  <Button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t("logout")}
                  </Button>
                </div>
              </div>
            ) : (
              <Button asChild variant="default" className="w-full">
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  {t("login")}
                </Link>
              </Button>
            )}

            <div className="mt-4 flex justify-center">
              <LanguageSwitcher />
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNavigation;
