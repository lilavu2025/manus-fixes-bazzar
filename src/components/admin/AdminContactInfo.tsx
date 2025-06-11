import React, { useState } from 'react';
import { ContactInfoService, ContactInfo } from '@/services/supabase/contactInfoService';
import { useContactInfo } from '@/hooks/useContactInfo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const FIELD_LABELS: Record<string, string> = {
  email: 'البريد الإلكتروني',
  phone: 'رقم الهاتف',
  address: 'العنوان',
  facebook: 'رابط فيسبوك',
  instagram: 'رابط انستغرام',
  whatsapp: 'رقم واتساب',
  working_hours: 'ساعات العمل',
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

  if (loading) return <div>جاري تحميل معلومات الاتصال...</div>;
  if (error) return <div>خطأ في تحميل معلومات الاتصال</div>;

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4 bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">معلومات اتصل بنا</h2>
      <div className="mb-4">
        <div className="font-semibold mb-2">ترتيب الحقول (اسحب وغير الترتيب):</div>
        <ul>
          {fieldsOrder.map((field, idx) => (
            <li
              key={field}
              draggable
              onDragStart={handleDragStart(idx)}
              onDrop={handleDrop(idx)}
              onDragOver={handleDragOver}
              className="bg-gray-100 rounded px-2 py-1 mb-1 cursor-move flex items-center gap-2"
            >
              <span className="material-icons">drag_indicator</span>
              {FIELD_LABELS[field] || field}
            </li>
          ))}
        </ul>
      </div>
      {fieldsOrder.map((field) => (
        <div key={field}>
          <Label htmlFor={field}>{FIELD_LABELS[field] || field}</Label>
          {field === 'working_hours' ? (
            <textarea
              id="working_hours"
              name="working_hours"
              value={form.working_hours || ''}
              onChange={handleChange}
              rows={3}
              className="w-full border rounded px-2 py-1"
              placeholder="مثال: من 9 صباحاً حتى 5 مساءً\nالجمعة مغلق"
            />
          ) : (
            <Input
              id={field}
              name={field}
              value={form[field as keyof ContactInfo] as string || ''}
              onChange={handleChange}
              type={field === 'email' ? 'email' : 'text'}
            />
          )}
        </div>
      ))}
      <Button type="submit" disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}</Button>
      {success && <div className="text-green-600 mt-2">تم تحديث المعلومات بنجاح</div>}
    </form>
  );
};

export default AdminContactInfo;
