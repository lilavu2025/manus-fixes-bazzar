import React from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/hooks/useCart";
//import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from "@/contexts/useAuth";
import { useLanguage } from "@/utils/languageContextUtils";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import config from "@/configs/activeConfig";

interface UserActionsProps {
  onCartClick: () => void;
}

const UserActions: React.FC<UserActionsProps> = ({ onCartClick }) => {
  const { getTotalItems } = useCart();
  //const { getFavoritesCount } = useFavorites();
  const { user, profile, signOut } = useAuth();
  const { t } = useLanguage();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  const { primaryColor, secondaryColor } = config.visual;

  //const favoritesCount = getFavoritesCount();

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <div className="hidden md:block">
        <LanguageSwitcher />
      </div>

      {/* <Button 
        asChild
        variant="ghost" 
        size="icon" 
        className="relative h-10 w-10 hidden sm:flex"
      >
        <Link to="/favorites">
          <Heart className="h-5 w-5" />
          {favoritesCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {favoritesCount}
            </Badge>
          )}
        </Link>
      </Button> */}

      <Button
        variant="ghost"
        size="icon"
        onClick={onCartClick}
        className="relative h-10 w-10"
      >
        <ShoppingCart className="h-5 w-5" />
        {getTotalItems() > 0 && (
          <Badge
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-bounce-in"
            style={{ backgroundColor: primaryColor, color: "#fff" }}
          >
            {getTotalItems()}
          </Badge>
        )}
      </Button>

      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 hidden md:flex"
              aria-label="القائمة الجانبية"
            >
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white z-50 w-56">
            <DropdownMenuItem asChild>
              <Link to="/profile" className="cursor-pointer">
                <User className="h-4 w-4 mr-2" />
                {t("profile")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/orders" className="cursor-pointer">
                {t("orders")}
              </Link>
            </DropdownMenuItem>
            {/*
            <DropdownMenuItem asChild>
              <Link to="/favorites" className="cursor-pointer">
                <Heart className="h-4 w-4 mr-2" />
                {t('favorites')}
              </Link>
            </DropdownMenuItem>
            */}
            {profile?.user_type === "admin" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/admin" className="cursor-pointer">
                    {t("admin")}
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer text-red-600"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button asChild variant="default" size="sm" className="hidden md:flex">
          <Link to="/auth">{t("login")}</Link>
        </Button>
      )}
    </div>
  );
};

export default UserActions;
