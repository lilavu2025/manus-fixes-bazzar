import React, { useState } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { useLanguage } from '@/utils/languageContextUtils';
import { useAddresses } from '@/hooks/useAddresses';
import Header from '@/components/Header';
import CartSidebar from '@/components/CartSidebar';
import AddAddressDialog from '@/components/AddAddressDialog';
import EditAddressDialog from '@/components/EditAddressDialog';
import DeleteAddressDialog from '@/components/DeleteAddressDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { User, Settings, MapPin } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, profile, updateProfile } = useAuth();
  const { t, isRTL } = useLanguage();
  const { addresses } = useAddresses();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateProfile(profileData);
      toast.success(t('profileUpdated'));
    } catch (error: unknown) {
      toast.error(typeof error === 'object' && error && 'message' in error ? (error as { message?: string }).message : 'Error updating profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Header 
        onSearchChange={() => {}}
        onCartClick={() => setIsCartOpen(true)}
        onMenuClick={() => {}}
      />

      <div className="container mx-auto px-4 py-6">
        <div className={`mb-8 ${isRTL ? 'text-right' : 'text-left'}`}>
          <h1 className={`text-3xl font-bold mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('profile')}</h1>
          <p className={`text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('manageYourAccount')}
          </p>
        </div>

        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6`}>
          {/* Profile Summary */}
          <Card className={isRTL ? 'text-right' : 'text-left'}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                <User className="h-5 w-5" />
                <span>{t('accountInfo')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className={`text-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>{t('fullName')}</p>
                <p className={`font-medium ${isRTL ? 'text-right' : 'text-left'}`}>{profile?.full_name || t('notProvided')}</p>
              </div>
              <div>
                <p className={`text-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>{t('email')}</p>
                <p className={`font-medium ${isRTL ? 'text-right' : 'text-left'}`}>{user?.email}</p>
              </div>
              <div>
                <p className={`text-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>{t('phone')}</p>
                <p className={`font-medium ${isRTL ? 'text-right' : 'text-left'}`}>{profile?.phone || t('notProvided')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                <Settings className="h-5 w-5" />
                <span>{t('settings')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="profile" className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="profile">{t('profileInfo')}</TabsTrigger>
                  <TabsTrigger value="addresses">{t('addresses')}</TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                  <form onSubmit={handleUpdateProfile} className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
                    <div className="space-y-2">
                      <Label htmlFor="full_name" className={`block ${isRTL ? 'text-right' : 'text-left'}`}>{t('fullName')}</Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        autoComplete="name"
                        value={profileData.full_name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                        required
                        className={`w-full ${isRTL ? 'text-right' : 'text-left'}`}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className={`block ${isRTL ? 'text-right' : 'text-left'}`}>{t('phone')}</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        className={`w-full ${isRTL ? 'text-right' : 'text-left'}`}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className={`block ${isRTL ? 'text-right' : 'text-left'}`}>{t('email')}</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={user?.email || ''}
                        disabled
                        className={`bg-gray-100 w-full ${isRTL ? 'text-right' : 'text-left'}`}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                      <p className={`text-sm text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>{t('emailCannotBeChanged')}</p>
                    </div>

                    <div className={`flex ${isRTL ? 'justify-start' : 'justify-start'}`}>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? t('loading') : t('updateProfile')}
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="addresses">
                  <div className="space-y-4">
                    <div className={`flex items-center justify-between ${isRTL ? 'text-right' : 'text-left'}`}>
                      <h3 className={`text-lg font-medium ${isRTL ? 'text-right' : 'text-left'}`}>{t('savedAddresses')}</h3>
                      <AddAddressDialog />
                    </div>
                    
                    {addresses.length === 0 ? (
                      <div className="text-center py-8">
                        <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className={`text-gray-500 text-center`}>{t('noAddressesSaved')}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {addresses.map((address) => (
                          <Card key={address.id} className="p-4">
                            <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                              <div className="flex-1">
                                <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                                  <h4 className={`font-medium ${isRTL ? 'text-right' : 'text-left'}`}>{address.full_name}</h4>
                                  {address.is_default && (
                                    <Badge variant="secondary">{t('default')}</Badge>
                                  )}
                                </div>
                                <p className={`text-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                                  {address.street}, {address.building}
                                  {address.floor && `, ${t('floor')} ${address.floor}`}
                                  {address.apartment && `, ${t('apartment')} ${address.apartment}`}
                                </p>
                                <p className={`text-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                                  {address.area}, {address.city}
                                </p>
                                <p className={`text-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                                  {address.phone}
                                </p>
                              </div>
                              <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                                <EditAddressDialog address={address} />
                                <DeleteAddressDialog 
                                  addressId={address.id!}
                                  addressName={address.full_name}
                                />
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default Profile;
