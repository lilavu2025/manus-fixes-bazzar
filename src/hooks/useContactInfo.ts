import { useEffect, useState } from 'react';
import { ContactInfoService, ContactInfo } from '@/services/supabase/contactInfoService';

export function useContactInfo() {
  // فارغ - استخدم AuthContext فقط
  return { contactInfo: null, loading: false, error: null, refetch: () => {} };
}
