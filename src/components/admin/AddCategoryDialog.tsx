import React, { useState } from 'react';
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

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddCategoryDialog: React.FC<AddCategoryDialogProps> = ({
  open,
  onOpenChange,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('categories')
        .insert([
          {
            name_ar: formData.name_ar,
            name_en: formData.name_en,
            name_he: formData.name_he,
            image: formData.image,
            active: true,
          },
        ]);

      if (error) throw error;

      toast({
        title: t('categoryAdded'),
        description: t('categoryAddedSuccessfully'),
      });

      setFormData({
        name_ar: '',
        name_en: '',
        name_he: '',
        image: '',
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: t('error'),
        description: t('errorAddingCategory'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (url: string | string[]) => {
    const imageUrl = Array.isArray(url) ? url[0] || '' : url;
    handleInputChange('image', imageUrl);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('addCategory')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name_ar">{t('categoryNameArabic')}</Label>
            <Input
              id="name_ar"
              value={formData.name_ar}
              onChange={(e) => handleInputChange('name_ar', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="name_en">{t('categoryNameEnglish')}</Label>
            <Input
              id="name_en"
              value={formData.name_en}
              onChange={(e) => handleInputChange('name_en', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="name_he">{t('categoryNameHebrew')}</Label>
            <Input
              id="name_he"
              value={formData.name_he}
              onChange={(e) => handleInputChange('name_he', e.target.value)}
              required
            />
          </div>

          <ImageUpload
            value={formData.image}
            onChange={handleImageChange}
            bucket="category-images"
            label={t('categoryImage')}
            placeholder="https://example.com/category-image.jpg"
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('adding') : t('addCategory')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCategoryDialog;
