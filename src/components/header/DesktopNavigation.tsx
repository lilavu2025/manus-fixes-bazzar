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
}

const DesktopNavigation: React.FC<DesktopNavigationProps> = ({ navigationItems }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="hidden md:flex items-center gap-2 lg:gap-4 pb-4 border-t pt-4 overflow-x-auto">
      {navigationItems.map((item) => (
        <Link 
          key={item.path}
          to={item.path}
          className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg transition-colors whitespace-nowrap text-sm lg:text-base ${
            isActive(item.path) 
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-gray-100'
          }`}
        >
          {item.icon && <item.icon className="h-4 w-4" />}
          {item.label}
        </Link>
      ))}
    </nav>
  );
};

export default DesktopNavigation;
