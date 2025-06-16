import { supabase } from '@/integrations/supabase/client';

export class AvatarService {
  static async uploadAvatar(userId: string, file: File): Promise<string | null> {
    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${userId}.${fileExt}`;
    const { error } = await supabase.storage.from('avatars').upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    });
    if (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
    // Get public URL
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data?.publicUrl || null;
  }
}
