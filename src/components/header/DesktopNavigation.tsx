import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/utils/languageContextUtils';

interface NavigationItem {
  path: string;
  label: string;
  icon?: React.ElementType;
}

interface DesktopNavigationProps {
  navigationItems: NavigationItem[];
  isScrolled?: boolean;
}

const DesktopNavigation: React.FC<DesktopNavigationProps> = ({ navigationItems, isScrolled = false }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className={`hidden md:flex items-center gap-1 lg:gap-2 pb-2 border-t pt-2 overflow-x-auto transition-all duration-300 ${isScrolled ? 'text-xs' : 'text-sm lg:text-base'}`}>
      {navigationItems.map((item) => (
        <Link 
          key={item.path}
          to={item.path}
          className={`flex items-center gap-1 px-2 lg:px-3 py-1 rounded-lg transition-all duration-300 whitespace-nowrap ${
            isScrolled ? 'text-xs px-2 py-1' : 'text-sm lg:text-base px-3 lg:px-4 py-2'
          } ${
            isActive(item.path) 
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-gray-100'
          }`}
        >
          {item.icon && <item.icon className={`${isScrolled ? 'h-3 w-3' : 'h-4 w-4'}`} />}
          {item.label}
        </Link>
      ))}
    </nav>
  );
};

export default DesktopNavigation;
