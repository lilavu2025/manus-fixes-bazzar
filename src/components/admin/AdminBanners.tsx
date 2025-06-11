import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Upload, X } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useLanguage } from '../../utils/languageContextUtils';
import { toast } from 'sonner';

// تعريف واجهة البانر (Banner) كما هو مخزن في قاعدة البيانات
interface Banner {
  id: string;
  title_ar: string;
  title_en: string;
  title_he: string;
  subtitle_ar?: string;
  subtitle_en?: string;
  subtitle_he?: string;
  image: string;
  link?: string;
  sort_order: number;
  active: boolean;
  created_at: string;
}

// تعريف واجهة بيانات النموذج (BannerFormData) لإدارة حالة النموذج
interface BannerFormData {
  title_ar: string;
  title_en: string;
  title_he: string;
  subtitle_ar: string;
  subtitle_en: string;
  subtitle_he: string;
  image: File | null;
  imageUrl: string;
  link: string;
  sort_order: number;
  active: boolean;
}

const AdminBanners: React.FC = () => {
  // استخدام الترجمة من الكونتكست
  const { t } = useLanguage();

  // تعريف الحالات الرئيسية للصفحة
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState<BannerFormData>({
    title_ar: '',
    title_en: '',
    title_he: '',
    subtitle_ar: '',
    subtitle_en: '',
    subtitle_he: '',
    image: null,
    imageUrl: '',
    link: '',
    sort_order: 0,
    active: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // جلب البانرات عند تحميل الصفحة
  useEffect(() => {
    fetchBanners();
  }, []);

  // دالة لجلب البانرات من قاعدة البيانات
  const fetchBanners = async () => {
    console.log('جلب البانرات من قاعدة البيانات...');
    try {
      setError(null);
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
      console.log('تم جلب البانرات:', data);
    } catch (error: unknown) {
      const err = error as Error;
      console.error('خطأ أثناء جلب البانرات:', err);
      setError(err.message || 'حدث خطأ أثناء تحميل البانرات');
      toast.error('Error loading banners');
    } finally {
      setLoading(false);
    }
  };

  // إعادة تعيين النموذج وإغلاقه
  const resetForm = () => {
    console.log('إعادة تعيين النموذج');
    setFormData({
      title_ar: '',
      title_en: '',
      title_he: '',
      subtitle_ar: '',
      subtitle_en: '',
      subtitle_he: '',
      image: null,
      imageUrl: '',
      link: '',
      sort_order: 0,
      active: true
    });
    setEditingBanner(null);
    setShowForm(false);
  };

  // عند الضغط على زر التعديل، تعبئة النموذج ببيانات البانر المحدد
  const handleEdit = (banner: Banner) => {
    console.log('تعديل البانر:', banner);
    setEditingBanner(banner);
    setFormData({
      title_ar: banner.title_ar,
      title_en: banner.title_en,
      title_he: banner.title_he,
      subtitle_ar: banner.subtitle_ar || '',
      subtitle_en: banner.subtitle_en || '',
      subtitle_he: banner.subtitle_he || '',
      image: null,
      imageUrl: banner.image,
      link: banner.link || '',
      sort_order: banner.sort_order,
      active: banner.active
    });
    setShowForm(true);
  };

  // عند تغيير صورة البانر في النموذج
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('تم اختيار صورة:', file.name);
      setFormData(prev => ({ ...prev, image: file }));
    }
  };

  // رفع الصورة إلى التخزين السحابي وإرجاع الرابط العام
  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `banners/${fileName}`;

    console.log('رفع الصورة إلى التخزين:', filePath);

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('خطأ أثناء رفع الصورة:', uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    console.log('تم رفع الصورة، الرابط:', data.publicUrl);
    return data.publicUrl;
  };

  // عند إرسال النموذج (إضافة أو تعديل بانر)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // التحقق من العناوين
    if (!formData.title_ar || !formData.title_en || !formData.title_he) {
      toast.error(t('pleaseEnterAllTitles'));
      return;
    }

    // التحقق من وجود صورة عند الإضافة
    if (!editingBanner && !formData.image) {
      toast.error(t('pleaseSelectImage'));
      return;
    }

    setSubmitting(true);

    try {
      let imageUrl = formData.imageUrl;

      // رفع الصورة إذا تم اختيار صورة جديدة
      if (formData.image) {
        imageUrl = await uploadImage(formData.image);
      }

      // تجهيز بيانات البانر للإرسال
      const bannerData = {
        title_ar: formData.title_ar,
        title_en: formData.title_en,
        title_he: formData.title_he,
        subtitle_ar: formData.subtitle_ar || null,
        subtitle_en: formData.subtitle_en || null,
        subtitle_he: formData.subtitle_he || null,
        image: imageUrl,
        link: formData.link || null,
        sort_order: formData.sort_order,
        active: formData.active
      };

      if (editingBanner) {
        // تعديل بانر موجود
        console.log('تعديل بانر:', editingBanner.id, bannerData);
        const { error } = await supabase
          .from('banners')
          .update(bannerData)
          .eq('id', editingBanner.id);

        if (error) throw error;
        toast.success(t('bannerUpdatedSuccessfully'));
      } else {
        // إضافة بانر جديد
        console.log('إضافة بانر جديد:', bannerData);
        const { error } = await supabase
          .from('banners')
          .insert([bannerData]);

        if (error) throw error;
        toast.success(t('bannerAddedSuccessfully'));
      }

      resetForm();
      fetchBanners();
    } catch (error) {
      console.error('خطأ أثناء حفظ البانر:', error);
      toast.error(editingBanner ? t('errorUpdatingBanner') : t('errorAddingBanner'));
    } finally {
      setSubmitting(false);
    }
  };

  // حذف بانر
  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteBannerConfirmation'))) return;

    try {
      console.log('حذف بانر:', id);
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success(t('bannerDeletedSuccessfully'));
      fetchBanners();
    } catch (error) {
      console.error('خطأ أثناء حذف البانر:', error);
      toast.error(t('errorDeletingBanner'));
    }
  };

  // تفعيل أو تعطيل البانر
  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      console.log('تغيير حالة البانر:', id, 'الحالة الحالية:', currentStatus);
      const { error } = await supabase
        .from('banners')
        .update({ active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(t('bannerStatusUpdated'));
      fetchBanners();
    } catch (error) {
      console.error('خطأ أثناء تحديث حالة البانر:', error);
      toast.error(t('errorUpdatingBannerStatus'));
    }
  };

  // عرض مؤشر التحميل إذا كانت البيانات قيد التحميل
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-center">
          <div className="flex flex-col items-center mb-4">
            <X className="h-16 w-16 text-red-300 mb-2" />
            <h3 className="text-lg font-medium text-red-900 mb-2">{t('errorLoadingBanners') || 'خطأ في تحميل البانرات'}</h3>
            <p className="text-red-600 mb-4">{error}</p>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              fetchBanners();
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            {t('retry') || 'إعادة المحاولة'}
          </button>
        </div>
      </div>
    );
  }

  // واجهة الصفحة الرئيسية
  return (
    <div className="space-y-6">
      {/* رأس الصفحة وزر إضافة بانر */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('manageBanners')}</h1>
          <p className="text-gray-600">{t('manageBannersDescription')}</p>
        </div>
        <button
          onClick={() => {
            console.log('فتح نموذج إضافة بانر جديد');
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('addBanner')}
        </button>
      </div>

      {/* نموذج إضافة/تعديل بانر */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingBanner ? t('editBanner') : t('addNewBanner')}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* عناوين البانر باللغات الثلاث */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('title')} ({t('arabic')})
                  </label>
                  <input
                    type="text"
                    value={formData.title_ar}
                    onChange={(e) => setFormData(prev => ({ ...prev, title_ar: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('enterTitleArabic')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('title')} ({t('english')})
                  </label>
                  <input
                    type="text"
                    value={formData.title_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, title_en: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('enterTitleEnglish')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('title')} ({t('hebrew')})
                  </label>
                  <input
                    type="text"
                    value={formData.title_he}
                    onChange={(e) => setFormData(prev => ({ ...prev, title_he: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('enterTitleHebrew')}
                    required
                  />
                </div>
              </div>

              {/* العناوين الفرعية (اختياري) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('subtitleArabic')} ({t('optional')})
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle_ar}
                    onChange={(e) => setFormData(prev => ({ ...prev, subtitle_ar: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('enterSubtitleArabic')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('subtitleEnglish')} ({t('optional')})
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, subtitle_en: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('enterSubtitleEnglish')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('subtitleHebrew')} ({t('optional')})
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle_he}
                    onChange={(e) => setFormData(prev => ({ ...prev, subtitle_he: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('enterSubtitleHebrew')}
                  />
                </div>
              </div>

              {/* رفع صورة البانر */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('bannerImage')}
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="banner-image"
                  />
                  <label
                    htmlFor="banner-image"
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 cursor-pointer flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {formData.image ? t('changeImage') : t('selectImage')}
                  </label>
                  {(formData.imageUrl || formData.image) && (
                    <span className="text-sm text-green-600">
                      {formData.image ? formData.image.name : t('currentImage')}
                    </span>
                  )}
                </div>
                {formData.imageUrl && (
                  <img
                    src={formData.imageUrl}
                    alt="Banner preview"
                    className="mt-2 h-20 w-32 object-cover rounded-md"
                  />
                )}
              </div>

              {/* رابط البانر وترتيبه */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('bannerLink')} ({t('optional')})
                  </label>
                  <input
                    type="url"
                    value={formData.link}
                    onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('enterBannerLink')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('sortOrder')}
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('enterSortOrder')}
                    min="0"
                  />
                </div>
              </div>

              {/* حالة البانر (فعال/غير فعال) */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                  {t('activeBanner')}
                </label>
              </div>

              {/* أزرار الإرسال والإلغاء */}
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting
                    ? (editingBanner ? t('updating') : t('adding'))
                    : (editingBanner ? t('updateBanner') : t('addBanner'))
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* جدول عرض البانرات */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {banners.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('noBannersFound')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('image')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('title')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('sortOrder')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {banners.map((banner) => (
                  <tr key={banner.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img
                        src={banner.image}
                        alt={banner.title_en}
                        className="h-16 w-24 object-cover rounded-md"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {banner.title_en}
                      </div>
                      <div className="text-sm text-gray-500">
                        {banner.title_ar}
                      </div>
                      <div className="text-sm text-gray-500">
                        {banner.title_he}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {banner.sort_order}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleActive(banner.id, banner.active)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          banner.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {banner.active ? (
                          <><Eye className="h-3 w-3" /> {t('active')}</>
                        ) : (
                          <><EyeOff className="h-3 w-3" /> {t('inactive')}</>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(banner)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBanners;

// -----------------------------
// شرح الصفحة بالعربي:
// -----------------------------
// هذه الصفحة مخصصة لإدارة البانرات في لوحة تحكم الأدمن.
// - يمكنك من خلالها إضافة بانر جديد أو تعديل أو حذف بانر موجود.
// - كل بانر يحتوي على عنوان بثلاث لغات، وصورة، ورابط اختياري، وترتيب، وحالة تفعيل.
// - عند إضافة أو تعديل بانر، يتم رفع الصورة إلى التخزين السحابي (Supabase Storage).
// - يتم جلب البانرات من قاعدة البيانات وعرضها في جدول مع إمكانية التفعيل/التعطيل والتعديل والحذف.
// - تم إضافة console.log في جميع العمليات المهمة لتسهيل تتبع الأخطاء أثناء التطوير.
// - جميع الدوال الرئيسية مشروحة بالتعليقات داخل الكود.
// - تم استخدام مكتبة sonner لعرض رسائل النجاح أو الخطأ.
// - تم استخدام الترجمة من الكونتكست لدعم تعدد اللغات في الصفحة.