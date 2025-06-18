import React from 'react';
import { Menu, Search, ShoppingCart, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';

interface MobileBottomNavBarProps {
  onMenuClick: () => void;
  onSearchClick: () => void;
  onCartClick: () => void;
  onHomeClick: () => void;
}

const MobileBottomNavBar: React.FC<MobileBottomNavBarProps> = ({ onMenuClick, onSearchClick, onCartClick, onHomeClick }) => {
  const { getTotalItems } = useCart();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg flex justify-around items-center h-16 md:hidden">
      <Button variant="ghost" size="icon" aria-label="Home" onClick={onHomeClick}>
        <Home className="h-7 w-7" />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Search" onClick={onSearchClick}>
        <Search className="h-7 w-7" />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Cart" onClick={onCartClick} className="relative">
        <ShoppingCart className="h-7 w-7" />
        {getTotalItems() > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">{getTotalItems()}</span>
        )}
      </Button>
      <Button variant="ghost" size="icon" aria-label="Menu" onClick={onMenuClick}>
        <Menu className="h-7 w-7" />
      </Button>
    </nav>
  );
};

export default MobileBottomNavBar;
