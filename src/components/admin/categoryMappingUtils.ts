import { Category } from '@/types';
import type { DatabaseCategory } from '@/types/index';

// Map a Supabase DB row to the UI Category shape
export function mapDbCategoryToCategory(db: Partial<DatabaseCategory>): Category {
  return {
    id: db.id || '',
    name: db.name_ar || db.name_en || '',
    nameEn: db.name_en || '',
    nameHe: db.name_he || '',
    image: db.image || '',
    count: 0, // Product count is not returned from Supabase update, so default to 0
    active: typeof db.active === 'boolean' ? db.active : true,
  };
}
