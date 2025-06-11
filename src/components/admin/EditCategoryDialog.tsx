import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../utils/languageContextUtils';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import ImageUpload from '@/components/ImageUpload';
import { Category } from '@/types/product';

interface EditCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category;
  onSuccess: () => void;
}

const EditCategoryDialog: React.FC<EditCategoryDialogProps> = ({
  open,
  onOpenChange,
  category,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    name_he: '',
    image: '',
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name_ar: category.name || '',
        name_en: category.nameEn || '',
        name_he: category.nameHe || '',
        image: category.image || '',

      });
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name_ar: formData.name_ar,
          name_en: formData.name_en,
          name_he: formData.name_he,
          image: formData.image,
        })
        .eq('id', category.id);

      if (error) throw error;

      toast({
        title: t('categoryUpdated'),
        description: t('categoryUpdatedSuccessfully'),
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: t('error'),
        description: t('errorUpdatingCategory'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (url: string | string[]) => {
    const imageUrl = Array.isArray(url) ? url[0] || '' : url;
    setFormData({ ...formData, image: imageUrl });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('editCategory')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name_ar">{t('categoryNameArabic')}</Label>
            <Input
              id="name_ar"
              value={formData.name_ar}
              onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="name_en">{t('categoryNameEnglish')}</Label>
            <Input
              id="name_en"
              value={formData.name_en}
              onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="name_he">{t('categoryNameHebrew')}</Label>
            <Input
              id="name_he"
              value={formData.name_he}
              onChange={(e) => setFormData({ ...formData, name_he: e.target.value })}
              required
            />
          </div>

          <ImageUpload
            value={formData.image}
            onChange={handleImageChange}
            bucket="category-images"
            label={t('categoryImage')}
          />



          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('updating') : t('updateCategory')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryDialog;
