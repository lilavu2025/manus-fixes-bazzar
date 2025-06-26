// Phone validation utility functions
export const validatePhoneNumber = (phone: string): boolean => {
  // Check if phone starts with 05 and has exactly 10 digits
  const phoneRegex = /^05[0-9]{8}$/;
  return phoneRegex.test(phone);
};

export const formatPhoneNumber = (phone: string): string => {
  // Remove any non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // If it starts with 05, keep it as is
  if (digitsOnly.startsWith('05')) {
    return digitsOnly.slice(0, 10);
  }
  
  // If it starts with 5, add 0 prefix
  if (digitsOnly.startsWith('5') && digitsOnly.length === 9) {
    return '0' + digitsOnly;
  }
  
  return digitsOnly.slice(0, 10);
};

export const getPhoneErrorMessage = (phone: string, t: (key: string) => string): string => {
  if (!phone) {
    return t('phoneRequired');
  }
  
  if (phone.length !== 10) {
    return t('phoneMustBe10Digits');
  }
  
  if (!phone.startsWith('05')) {
    return t('phoneMustStartWith05');
  }
  
  if (!/^[0-9]+$/.test(phone)) {
    return t('phoneOnlyNumbers');
  }
  
  return '';
};