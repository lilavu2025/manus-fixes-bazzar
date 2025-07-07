import React, { useState } from "react";
import {
  Home,
  Settings,
  ShoppingCart,
  Package,
  LogIn,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useLanguage } from "@/utils/languageContextUtils";
import { useAuth } from "@/contexts/useAuth";
import config from "@/configs/activeConfig";

interface Props {
  onMenuClick: () => void;
  onCartClick: (open: boolean) => void;
}

const MobileBottomNavBar: React.FC<Props> = ({
  onMenuClick,
  onCartClick,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getTotalItems } = useCart();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { primaryColor } = config.visual;

  const [activeTab, setActiveTab] = useState("home");
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleTabClick = (key: string, action?: () => void) => {
    if (key === "cart") {
      const newState = !isCartOpen;
      setIsCartOpen(newState);
      onCartClick(newState);
    } else {
      setIsCartOpen(false);
      onCartClick(false); // تأكد تسكر السلة
    }
    setActiveTab(key);
    if (action) action();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* زر السلة الطاير */}
      <div className="relative flex justify-center">
        <button
          onClick={() => handleTabClick("cart")}
          className="absolute -top-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center border-4 border-white"
          style={{ backgroundColor: primaryColor }}
        >
          <ShoppingCart className="text-white h-6 w-6" />
          {getTotalItems() > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] min-w-[16px] h-[16px] rounded-full flex items-center justify-center text-xs font-bold shadow-md">
              {getTotalItems() > 99 ? "99+" : getTotalItems()}
            </span>
          )}
        </button>
      </div>

      {/* شريط الأزرار */}
      <nav className="flex justify-between items-center bg-white rounded-t-3xl shadow-2xl px-4 py-2 h-20 border-t border-gray-200">
        <button
          onClick={() =>
            handleTabClick("home", () => navigate("/"))
          }
          className={`flex flex-col items-center justify-center flex-1 transition-all duration-200 ${
            activeTab === "home"
              ? "text-primary scale-110 font-bold"
              : "text-gray-500"
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-[11px] mt-1">{t("home")}</span>
        </button>

        <button
          onClick={() =>
            handleTabClick("products", () => navigate("/products"))
          }
          className={`flex flex-col items-center justify-center flex-1 transition-all duration-200 ${
            location.pathname === "/products"
              ? "text-primary scale-110 font-bold"
              : "text-gray-500"
          }`}
        >
          <Package className="h-5 w-5" />
          <span className="text-[11px] mt-1">{t("products")}</span>
        </button>

        <div className="w-14" /> {/* مساحة السلة */}

        <button
          onClick={() =>
            handleTabClick("orders", () => navigate("/orders"))
          }
          className={`flex flex-col items-center justify-center flex-1 transition-all duration-200 ${
            activeTab === "orders"
              ? "text-primary scale-110 font-bold"
              : "text-gray-500"
          }`}
        >
          <Package className="h-5 w-5" />
          <span className="text-[11px] mt-1">{t("orders")}</span>
        </button>

        <button
          onClick={() =>
            handleTabClick("settings", () => navigate(user ? "/profile" : "/auth"))
          }
          className={`flex flex-col items-center justify-center flex-1 transition-all duration-200 ${
            (user && location.pathname === "/profile") || (!user && location.pathname === "/auth")
              ? "text-primary scale-110 font-bold"
              : "text-gray-500"
          }`}
        >
          {user ? <Settings className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
          <span className="text-[11px] mt-1">{user ? t("settings") : t("login")}</span>
        </button>
      </nav>
    </div>
  );
};

export default MobileBottomNavBar;
