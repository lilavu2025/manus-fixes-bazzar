import React from "react";
import { Menu, Search, ShoppingCart, Home, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/utils/languageContextUtils";

interface MobileBottomNavBarProps {
  onMenuClick: () => void;
  onSearchClick: () => void;
  onCartClick: () => void;
  onHomeClick: () => void;
}

const MobileBottomNavBar: React.FC<MobileBottomNavBarProps> = ({
  onMenuClick,
  onSearchClick,
  onCartClick,
  onHomeClick,
}) => {
  const { getTotalItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();

  // تحديد الزر النشط بناءً على المسار
  const getActiveKey = () => {
    if (location.pathname === "/" || location.pathname === "/index")
      return "home";
    return "";
  };
  const activeKey = getActiveKey();

  const buttonClass = (isActive: boolean) => `
    flex flex-col items-center justify-center flex-1 py-2 px-1 transition-all duration-200
    ${isActive 
      ? "text-primary font-bold bg-gradient-to-t from-orange-50 to-transparent shadow-inner rounded-xl transform scale-105" 
      : "text-gray-500 hover:text-primary hover:bg-gray-50 rounded-lg active:scale-95"
    }
    touch-manipulation select-none
  `;

  return (
    <nav 
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-700 
        shadow-xl flex justify-around items-center h-20 md:hidden px-2 backdrop-blur-md
        ${isRTL ? 'rtl' : 'ltr'}`}
    >
      {/* الرئيسية */}
      <button
        className={buttonClass(activeKey === "home")}
        onClick={() => navigate("/")}
        aria-label={t('home')}
      >
        <Home className="h-6 w-6 mb-1" />
        <span className="text-[10px] leading-tight font-medium">{t('home')}</span>
      </button>
      
      {/* البحث */}
      <button
        className={buttonClass(false)}
        onClick={onSearchClick}
        aria-label={t('search')}
      >
        <Search className="h-6 w-6 mb-1" />
        <span className="text-[10px] leading-tight font-medium">{t('search')}</span>
      </button>
      
      {/* السلة */}
      <button
        className={`${buttonClass(false)} relative`}
        onClick={onCartClick}
        aria-label={t('cart')}
      >
        <div className="relative">
          <ShoppingCart className="h-6 w-6 mb-1" />
          {getTotalItems() > 0 && (
            <span className={`absolute -top-2 ${isRTL ? '-left-2' : '-right-2'} bg-red-500 text-white 
              rounded-full text-[9px] min-w-[18px] h-[18px] flex items-center justify-center 
              border-2 border-white font-bold shadow-md animate-pulse`}>
              {getTotalItems() > 99 ? '99+' : getTotalItems()}
            </span>
          )}
        </div>
        <span className="text-[10px] leading-tight font-medium">{t('cart')}</span>
      </button>
      
      {/* القائمة */}
      <button
        className={buttonClass(false)}
        onClick={onMenuClick}
        aria-label={t('menu')}
        type="button"
      >
        <Menu className="h-6 w-6 mb-1" />
        <span className="text-[10px] leading-tight font-medium">{t('menu')}</span>
      </button>
      {/* زر إشعارات مستقبلي */}
      {/*
      <button
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${activeKey === 'notifications' ? 'text-primary font-bold bg-orange-50 shadow-inner rounded-xl' : 'text-gray-500 hover:text-primary'} mx-1`}
        onClick={() => {}}
        aria-label="Notifications"
      >
        <Bell className="h-7 w-7 mb-0.5" />
        <span className="text-[11px] leading-none">إشعارات</span>
      </button>
      */}
    </nav>
  );
};

export default MobileBottomNavBar;
