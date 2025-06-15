import React, { useState } from 'react';
import { useLanguage } from '@/utils/languageContextUtils';
import Header from '@/components/Header';
import CartSidebar from '@/components/CartSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { useContactInfo } from '@/hooks/useContactInfo';
import emailjs from '@emailjs/browser';

const Contact: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { contactInfo, loading: contactLoading } = useContactInfo();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // إرسال الرسالة عبر EmailJS إلى البريد الموجود في contactInfo
      if (contactInfo?.email) {
        await emailjs.send(
          'service_xxx', // ضع هنا ID خدمة EmailJS
          'template_xxx', // ضع هنا ID القالب
          {
            from_name: formData.name,
            from_email: formData.email,
            phone: formData.phone,
            subject: formData.subject,
            message: formData.message,
            to_email: contactInfo.email,
          },
          'user_xxx' // ضع هنا Public Key الخاص بك في EmailJS
        );
      }
      toast({
        title: t('success'),
        description: t('messageSubmitted'),
      });
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    } catch (err) {
      toast({
        title: t('error'),
        description: t('errorSendingMessage'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Header onSearchChange={() => {}} onCartClick={() => setIsCartOpen(true)} onMenuClick={() => {}} />
      <div className='mb-4' />
      <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">{t('contact')}</h1>
          {/* <p className="text-gray-600">
            {t('getInTouch')}
          </p> */}
        </div>

      <div className="container mx-auto px-2 sm:px-4 py-6">
        {/* Features Bar */}
        {/* <section className="mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-orange-50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-orange-600 font-semibold">
              <Mail className="w-6 h-6" /> دعم فني سريع
            </div>
            <div className="flex items-center gap-2 text-orange-600 font-semibold">
              <Phone className="w-6 h-6" /> استجابة خلال 24 ساعة
            </div>
            <div className="flex items-center gap-2 text-orange-600 font-semibold">
              <MapPin className="w-6 h-6" /> نخدم جميع المناطق
            </div>
          </div>
        </section> */}

        {/* Quick Contact Section */}
        <section className="mt-2 text-center">
          <h2 className="text-xl font-bold mb-4 text-orange-600">{t('quickContacts')}</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href={`https://wa.me/${contactInfo?.phone || t('defaultPhone')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 text-green-800 font-semibold hover:bg-green-200 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.52 3.48A12 12 0 1 0 2.47 20.52l2.65-7.72a1 1 0 0 1 .6-.6l7.72-2.65a1 1 0 0 1 1.2 1.2l-2.65 7.72a1 1 0 0 1-.6.6l-7.72 2.65A12 12 0 1 0 20.52 3.48z" /></svg>
              {t('whatsapp')}
            </a>
            <a href={`mailto:${contactInfo?.email || t('defaultEmail')}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 text-blue-800 font-semibold hover:bg-blue-200 transition-colors">
              <Mail className="w-5 h-5" />
              {t('emailContact')}
            </a>
          </div>
        </section>
        <div className="mb-8" />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">

          {/* Contact Form */}
          <Card className="lg:col-span-1 xl:col-span-2 bg-white/90 shadow-md">
            <CardHeader>
              <CardTitle>{t('sendMessage')}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('fullName')}</Label>
                    <Input
                      id="name"
                      name="name"
                      autoComplete="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('email')}</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('phone')}</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">{t('subject')}</Label>
                    <Input
                      id="subject"
                      name="subject"
                      autoComplete="off"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">{t('message')}</Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={6}
                    autoComplete="off"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    required
                  />
                </div>
                <Button type="submit" className="w-full font-bold bg-orange-500 hover:bg-orange-600 text-white transition-colors" disabled={isLoading}>
                  {isLoading ? t('sending') : t('sendMessage')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-6 xl:col-span-1">
            <Card className="bg-white/90 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  {t('email')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{contactInfo?.email || t('defaultEmail')}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/90 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  {t('phone')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{contactInfo?.phone || t('defaultPhone')}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/90 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {t('address')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{contactInfo?.address || t('defaultAddress')}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/90 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {t('workingHours')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {t('sunday')} - {t('thursday')}: 9:00 - 18:00<br />
                  {t('friday')} - {t('saturday')}: 10:00 - 16:00
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default Contact;
