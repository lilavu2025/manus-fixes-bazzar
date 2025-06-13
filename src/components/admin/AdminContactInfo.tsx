import React, { useState } from 'react';
import { ContactInfoService, ContactInfo } from '@/services/supabase/contactInfoService';
import { useContactInfo } from '@/hooks/useContactInfo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Mail, Phone, MapPin, Facebook, Instagram, Clock, MessageCircle } from 'lucide-react';

const FIELD_LABELS: Record<string, string> = {
  email: 'البريد الإلكتروني',
  phone: 'رقم الهاتف',
  address: 'العنوان',
  facebook: 'رابط فيسبوك',
  instagram: 'رابط انستغرام',
  whatsapp: 'رقم واتساب',
  working_hours: 'ساعات العمل',
};
const FIELD_ICONS: Record<string, React.ReactNode> = {
  email: <Mail className="inline w-5 h-5 text-blue-600" />,
  phone: <Phone className="inline w-5 h-5 text-green-600" />,
  address: <MapPin className="inline w-5 h-5 text-gray-600" />,
  facebook: <Facebook className="inline w-5 h-5 text-blue-700" />,
  instagram: <Instagram className="inline w-5 h-5 text-pink-500" />,
  whatsapp: <MessageCircle className="inline w-5 h-5 text-green-500" />,
  working_hours: <Clock className="inline w-5 h-5 text-yellow-600" />,
};
const FIELD_COMPONENTS = [
  'email',
  'phone',
  'address',
  'facebook',
  'instagram',
  'whatsapp',
  'working_hours',
];

const AdminContactInfo: React.FC = () => {
  const { contactInfo, loading, error, refetch } = useContactInfo();
  const [form, setForm] = useState<Partial<ContactInfo>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fieldsOrder, setFieldsOrder] = useState<string[]>(FIELD_COMPONENTS);
  React.useEffect(() => {
    if (contactInfo) {
      setForm(contactInfo);
      let order: string[] = FIELD_COMPONENTS;
      if (Array.isArray(contactInfo.fields_order)) {
        order = contactInfo.fields_order.filter((f): f is string => typeof f === 'string');
      }
      setFieldsOrder(order);
    }
  }, [contactInfo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Drag and drop logic
  const handleDragStart = (idx: number) => (e: React.DragEvent) => {
    e.dataTransfer.setData('fieldIdx', idx.toString());
  };
  const handleDrop = (idx: number) => (e: React.DragEvent) => {
    const fromIdx = Number(e.dataTransfer.getData('fieldIdx'));
    if (fromIdx === idx) return;
    const newOrder = [...fieldsOrder];
    const [removed] = newOrder.splice(fromIdx, 1);
    newOrder.splice(idx, 0, removed);
    setFieldsOrder(newOrder);
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    const updated = await ContactInfoService.updateContactInfo({ ...form, fields_order: fieldsOrder });
    setSaving(false);
    if (updated) {
      setSuccess(true);
      refetch();
    }
  };

  // نسخ النص
  const handleCopy = (val: string) => {
    navigator.clipboard.writeText(val);
  };

  if (loading) return <div>جاري تحميل معلومات الاتصال...</div>;
  if (error) return <div>خطأ في تحميل معلومات الاتصال</div>;

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl w-full mx-auto space-y-6 bg-white dark:bg-gray-900 p-6 rounded shadow-lg border border-gray-100 dark:border-gray-800 transition-all">
      <h2 className="text-2xl font-bold mb-4 text-center">معلومات اتصل بنا</h2>
      <div className="mb-4">
        <div className="font-semibold mb-2">ترتيب الحقول (اسحب وغير الترتيب):</div>
        <ul className="flex flex-wrap gap-2">
          {fieldsOrder.map((field, idx) => (
            <li
              key={field}
              draggable
              onDragStart={handleDragStart(idx)}
              onDrop={handleDrop(idx)}
              onDragOver={handleDragOver}
              className="bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 mb-1 cursor-move flex items-center gap-2 shadow-sm border border-gray-200 dark:border-gray-700"
              style={{ minWidth: 120 }}
            >
              <span className="material-icons text-gray-400">drag_indicator</span>
              {FIELD_ICONS[field]} {FIELD_LABELS[field] || field}
            </li>
          ))}
        </ul>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fieldsOrder.map((field) => (
          <div key={field} className="flex flex-col gap-1 relative group">
            <Label htmlFor={field} className="font-semibold flex items-center gap-2">
              {FIELD_ICONS[field]} {FIELD_LABELS[field] || field}
            </Label>
            {field === 'working_hours' ? (
              <textarea
                id="working_hours"
                name="working_hours"
                value={form.working_hours || ''}
                onChange={handleChange}
                rows={3}
                className="w-full border rounded px-2 py-1 dark:bg-gray-800 dark:text-white"
                placeholder="مثال: من 9 صباحاً حتى 5 مساءً\nالجمعة مغلق"
              />
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  id={field}
                  name={field}
                  value={form[field as keyof typeof form] as string || ''}
                  onChange={handleChange}
                  type={field === 'email' ? 'email' : 'text'}
                  className="flex-1 dark:bg-gray-800 dark:text-white"
                />
                {form[field as keyof typeof form] && (
                  <button
                    type="button"
                    title="نسخ"
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => handleCopy(form[field as keyof typeof form] as string)}
                  >
                    <Copy className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>
            )}
            {/* روابط مباشرة */}
            {form[field as keyof typeof form] && (
              <div className="text-xs mt-1 text-blue-600 dark:text-blue-400">
                {field === 'whatsapp' && (
                  <a href={`https://wa.me/${form['whatsapp'] as string}`} target="_blank" rel="noopener noreferrer">محادثة واتساب</a>
                )}
                {field === 'facebook' && (
                  <a href={form['facebook'] as string} target="_blank" rel="noopener noreferrer">زيارة فيسبوك</a>
                )}
                {field === 'instagram' && (
                  <a href={form['instagram'] as string} target="_blank" rel="noopener noreferrer">زيارة انستغرام</a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <Button type="submit" disabled={saving} className="w-full md:w-auto">{saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}</Button>
      {success && <div className="text-green-600 mt-2 text-center">تم تحديث المعلومات بنجاح</div>}
      {typeof error === 'string' && <div className="text-red-600 mt-2 text-center">{error}</div>}
    </form>
  );
};

export default AdminContactInfo;
