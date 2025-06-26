import React from "react";
import { Menu, Search, ShoppingCart, Home, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useLocation, useNavigate } from "react-router-dom";

interface MobileBottomNavBarProps {
  onMenuClick: () => void;
  onSearchClick: () => void;
  onCartClick: () => void;
  onHomeClick: () => void;
}

const navItems = [
  { key: "home", label: "الرئيسية", icon: Home, path: "/" },
  // { key: 'search', label: 'بحث', icon: Search, path: '/search' },
  // { key: 'cart', label: 'السلة', icon: ShoppingCart, path: '/cart' },
  { key: "menu", label: "القائمة", icon: Menu, path: "/menu" },
  // { key: 'notifications', label: 'إشعارات', icon: Bell, path: '/notifications' }, // مستقبلًا
];

const MobileBottomNavBar: React.FC<MobileBottomNavBarProps> = ({
  onMenuClick,
  onSearchClick,
  onCartClick,
  onHomeClick,
}) => {
  const { getTotalItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  // تحديد الزر النشط بناءً على المسار
  const getActiveKey = () => {
    if (location.pathname === "/" || location.pathname === "/index")
      return "home";
    // لا يوجد تمييز خاص للبحث أو السلة لأنهم لا يغيرون المسار
    return "";
  };
  const activeKey = getActiveKey();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 border-t shadow-2xl flex justify-around items-center h-16 md:hidden px-1 backdrop-blur-lg">
      {/* الرئيسية */}
      <button
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${activeKey === "home" ? "text-primary font-bold bg-orange-50 shadow-inner rounded-xl" : "text-gray-500 hover:text-primary"} mx-1`}
        onClick={() => navigate("/")}
        aria-label="Home"
      >
        <Home className="h-7 w-7 mb-0.5" />
        <span className="text-[11px] leading-none">الرئيسية</span>
      </button>
      {/* البحث */}
      <button
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all text-gray-500 hover:text-primary mx-1`}
        onClick={onSearchClick}
        aria-label="Search"
      >
        <Search className="h-7 w-7 mb-0.5" />
        <span className="text-[11px] leading-none">بحث</span>
      </button>
      {/* السلة */}
      <button
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all text-gray-500 hover:text-primary mx-1 relative`}
        onClick={onCartClick}
        aria-label="Cart"
      >
        <ShoppingCart className="h-7 w-7 mb-0.5" />
        {getTotalItems() > 0 && (
          <span className="absolute top-0 right-3 bg-red-500 text-white rounded-full text-[10px] w-5 h-5 flex items-center justify-center border-2 border-white">
            {getTotalItems()}
          </span>
        )}
        <span className="text-[11px] leading-none">السلة</span>
      </button>
      {/* القائمة */}
      <button
        className={
          `flex flex-col items-center justify-center flex-1 py-1 transition-all text-gray-500 hover:text-primary mx-1 md:hidden` // إخفاء الزر على الشاشات المتوسطة وما فوق
        }
        onClick={onMenuClick}
        aria-label="Menu"
        type="button"
      >
        <Menu className="h-7 w-7 mb-0.5" />
        <span className="text-[11px] leading-none">القائمة</span>
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
