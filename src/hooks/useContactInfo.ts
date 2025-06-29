import { useEffect, useState, useCallback } from "react";
import {
  ContactInfoService,
  ContactInfo,
} from "@/services/supabase/contactInfoService";

export function useContactInfo() {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);

  const fetchContactInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ContactInfoService.getContactInfo();
      setContactInfo(data);
    } catch (err) {
      setError("Error fetching contact info");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContactInfo();
  }, [fetchContactInfo]);

  return { contactInfo, loading, error, refetch: fetchContactInfo };
}
