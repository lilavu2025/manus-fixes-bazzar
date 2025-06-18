import React, { useState } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { useLanguage } from '@/utils/languageContextUtils';
import { useAddresses } from '@/hooks/useAddresses';
import AddAddressDialog from '@/components/AddAddressDialog';
import EditAddressDialog from '@/components/EditAddressDialog';
import DeleteAddressDialog from '@/components/DeleteAddressDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FiEdit2, FiTrash2, FiLogOut, FiMapPin, FiUser, FiPhone, FiMail } from 'react-icons/fi';
import { supabase } from '@/integrations/supabase/client';

const Profile: React.FC = () => {
  const { user, profile, updateProfile, signOut } = useAuth();
  const { t, isRTL } = useLanguage();
  const { addresses } = useAddresses();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
  });
  const [editMode, setEditMode] = useState(false);
  // تغيير كلمة السر
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(null);
    setProfileSuccess(null);
    setProfileError(null);
    // تحقق من صحة رقم الهاتف
    const phone = profileData.phone.trim();
    if (!/^05\d{8}$/.test(phone)) {
      setPhoneError(t('invalidPhone') || 'رقم الجوال يجب أن يبدأ بـ 05 ويكون مكونًا من 10 أرقام');
      return;
    }
    setIsLoading(true);
    try {
      await updateProfile(profileData);
      setProfileSuccess(t('profileUpdatedSuccessfully') || 'تم حفظ البيانات بنجاح');
      setEditMode(false);
    } catch (err) {
      setProfileError((err as Error).message || t('errorUpdatingProfile'));
    } finally {
      setIsLoading(false);
    }
  };

  const isStrongPassword = (password: string) => {
    // على الأقل 6 أحرف وتحتوي على رقم
    return /^(?=.*\d).{6,}$/.test(password);
  };
  // تغيير كلمة السر عبر Supabase
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    if (!passwordData.current) {
      setPasswordError(t('enterCurrentPassword') || 'يرجى إدخال كلمة السر الحالية');
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      setPasswordError(t('passwordsDoNotMatch') || 'Passwords do not match');
      return;
    }
    if (!isStrongPassword(passwordData.new)) {
      setPasswordError(t('weakPassword') || 'كلمة السر يجب أن تكون 6 أحرف على الأقل وتحتوي على رقم');
      return;
    }
    if (passwordData.new === passwordData.current) {
      setPasswordError(t('newPasswordSameAsCurrent') || 'كلمة السر الجديدة يجب أن تختلف عن الحالية');
      return;
    }
    setPasswordLoading(true);
    try {
      // تحقق من كلمة السر الحالية عبر تسجيل الدخول
      const email = user?.email;
      if (!email) throw new Error('لا يوجد بريد إلكتروني للمستخدم');
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: passwordData.current,
      });
      if (signInError) {
        setPasswordError(t('currentPasswordIncorrect') || 'كلمة السر الحالية غير صحيحة');
        setPasswordLoading(false);
        return;
      }
      // تغيير كلمة السر
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new,
      });
      if (error) throw error;
      setPasswordSuccess(t('passwordChangedSuccessfully') || 'Password changed successfully');
      setPasswordData({ current: '', new: '', confirm: '' });
      setShowPasswordDialog(false);
    } catch (err) {
      setPasswordError((err as Error).message || t('errorChangingPassword'));
    } finally {
      setPasswordLoading(false);
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
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* <Header onSearchChange={() => {}} onCartClick={() => {}} onMenuClick={() => {}} /> */}
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8 flex flex-col items-center justify-center gap-2">
          <h1 className="text-3xl font-bold mt-2">{t('profile')}</h1>
          <p className="text-gray-600">{t('manageYourAccount')}</p>
          {/* نوع الحساب وتاريخ الإنشاء */}
          <div className="flex gap-4 mt-2 text-sm items-center">
            <span className="flex items-center gap-1 px-2 py-1 rounded bg-orange-100 text-orange-700">
              {profile?.user_type === 'admin' && <FiUser className="inline" />} 
              {profile?.user_type === 'wholesale' && <FiMapPin className="inline" />}
              {profile?.user_type === 'retail' && <FiUser className="inline" />}
              {t(profile?.user_type || 'retail')}
            </span>
            {profile?.created_at && (
              <span className="text-gray-500">{t('createdAt')}: {new Date(profile.created_at).toLocaleDateString()}</span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* بيانات المستخدم */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>{t('accountInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileSuccess && <div className="bg-green-100 text-green-700 px-3 py-2 rounded text-sm">{profileSuccess}</div>}
              {profileError && <div className="bg-red-100 text-red-700 px-3 py-2 rounded text-sm">{profileError}</div>}
              {!editMode ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FiUser className="text-xl text-orange-400" />
                    <span className="font-medium">{profileData.full_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiPhone className="text-xl text-blue-400" />
                    <span>{profileData.phone || <span className="text-gray-400">{t('noPhone')}</span>}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiMail className="text-xl text-green-400" />
                    <span>{user?.email}</span>
                  </div>
                  <Button variant="outline" className="w-full mt-2" onClick={() => setEditMode(true)}>
                    <FiEdit2 className="inline mr-2" /> {t('editProfile')}
                  </Button>
                  <Button variant="outline" className="w-full mt-2" onClick={() => setShowPasswordDialog(true)}>
                    <FiEdit2 className="inline mr-2" /> {t('changePassword') || 'Change Password'}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">{t('fullName')}</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      autoComplete="name"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                      required
                      className="w-full"
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('phone')}</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full"
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                    {phoneError && <div className="text-red-500 text-sm">{phoneError}</div>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('email')}</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-gray-100 w-full"
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                    <p className="text-sm text-gray-500">{t('emailCannotBeChanged')}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isLoading} className="w-full">
                      {isLoading ? t('loading') : t('save')}
                    </Button>
                    <Button type="button" variant="outline" className="w-full" onClick={() => setEditMode(false)}>
                      {t('cancel')}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
          {/* إدارة العناوين */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>{t('savedAddresses')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium flex items-center gap-1"><FiMapPin className="text-orange-400" /> {t('addresses')}</span>
                <AddAddressDialog />
              </div>
              {addresses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-center">{t('noAddressesSaved')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <Card key={address.id} className="p-4 bg-white border border-orange-100 shadow-sm hover:shadow-md transition-all">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-orange-700">{address.full_name}</h4>
                            {address.is_default && (
                              <span className="bg-orange-100 text-orange-700 rounded px-2 py-0.5 text-xs">{t('default')}</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {address.street}, {address.building}
                            {address.floor && `, ${t('floor')} ${address.floor}`}
                            {address.apartment && `, ${t('apartment')} ${address.apartment}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {address.area}, {address.city}
                          </p>
                          <p className="text-sm text-gray-600">
                            <FiPhone className="inline mr-1 text-blue-400" /> {address.phone}
                          </p>
                        </div>
                        <div className="flex gap-2 mt-2 md:mt-0">
                          <EditAddressDialog address={address} />
                          <DeleteAddressDialog addressId={address.id!} addressName={address.full_name} />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Dialog تغيير كلمة السر */}
        {showPasswordDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setShowPasswordDialog(false)}>&times;</button>
              <h2 className="text-xl font-bold mb-4">{t('changePassword') || 'Change Password'}</h2>
              {passwordSuccess && <div className="bg-green-100 text-green-700 px-3 py-2 rounded text-sm mb-2">{passwordSuccess}</div>}
              {passwordError && <div className="bg-red-100 text-red-700 px-3 py-2 rounded text-sm mb-2">{passwordError}</div>}
              <form onSubmit={handleChangePassword} className="space-y-2">
                <Label htmlFor="current-password">{t('currentPassword') || 'Current Password'}</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={passwordData.current}
                  onChange={e => setPasswordData(d => ({ ...d, current: e.target.value }))}
                  required
                  minLength={6}
                  autoComplete="current-password"
                />
                <Label htmlFor="new-password">{t('newPassword') || 'New Password'}</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordData.new}
                  onChange={e => setPasswordData(d => ({ ...d, new: e.target.value }))}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <Label htmlFor="confirm-password">{t('confirmPassword') || 'Confirm Password'}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordData.confirm}
                  onChange={e => setPasswordData(d => ({ ...d, confirm: e.target.value }))}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <div className="text-xs text-gray-500">
                  {t('passwordRequirements') || 'كلمة السر يجب أن تكون 6 أحرف على الأقل وتحتوي على رقم'}
                </div>
                <div className="flex gap-2 mt-2">
                  <Button type="submit" disabled={passwordLoading} className="w-full">
                    {passwordLoading ? t('loading') : t('save')}
                  </Button>
                  <Button type="button" variant="outline" className="w-full" onClick={() => setShowPasswordDialog(false)}>
                    {t('cancel')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* زر تسجيل الخروج منفصل */}
        <div className="flex justify-center mt-8">
          <Button variant="destructive" className="w-full max-w-xs" onClick={signOut}>
            <FiLogOut className="inline mr-2" /> {t('logout')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
