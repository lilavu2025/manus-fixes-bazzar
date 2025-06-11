import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/useAuth';
import { useLanguage } from '@/utils/languageContextUtils';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface MobileNavigationProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  navigationItems: Array<{ path: string; label: string; icon?: React.ElementType }>;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  mobileMenuOpen,
  setMobileMenuOpen,
  navigationItems
}) => {
  const { user, profile, signOut } = useAuth();
  const { t, isRTL } = useLanguage();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetContent side={isRTL ? "right" : "left"} className="w-80 p-0">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <Link to="/" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">م</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{t('storeName')}</h1>
                <p className="text-sm text-gray-500">{t('storeDescription')}</p>
              </div>
            </Link>
          </div>
          
          <nav className="flex-1 p-6">
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.icon && <item.icon className="h-5 w-5" />}
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>

          <div className="p-6 border-t bg-gray-50">
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {profile?.full_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{profile?.full_name}</p>
                    <p className="text-sm text-gray-500">{t(profile?.user_type || 'user')}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                      <User className="h-4 w-4 mr-2" />
                      {t('profile')}
                    </Link>
                  </Button>
                  
                  {profile?.user_type === 'admin' && (
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                        {t('admin')}
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
                    {t('logout')}
                  </Button>
                </div>
              </div>
            ) : (
              <Button asChild variant="default" className="w-full">
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  {t('login')}
                </Link>
              </Button>
            )}
            
            <div className="mt-4 flex justify-center">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNavigation;
