import React, { useState } from "react";
import { useLanguage } from "@/utils/languageContextUtils";
import CartSidebar from "@/components/CartSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { useContactInfo } from "@/hooks/useContactInfo";
import emailjs from "@emailjs/browser";

const Contact: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { contactInfo, loading: contactLoading } = useContactInfo();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (contactInfo?.email) {
        await emailjs.send(
          "service_xxx", // ضع هنا ID خدمة EmailJS
          "template_xxx", // ضع هنا ID القالب
          {
            from_name: formData.name,
            from_email: formData.email,
            phone: formData.phone,
            subject: formData.subject,
            message: formData.message,
            to_email: contactInfo.email,
          },
          "user_xxx", // ضع هنا Public Key الخاص بك في EmailJS
        );
      }
      toast({
        title: t("success"),
        description: t("messageSubmitted"),
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (err) {
      toast({
        title: t("error"),
        description: t("errorSendingMessage"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen bg-gray-50 ${isRTL ? "rtl" : "ltr"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="mb-4" />
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">{t("contact")}</h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Contact Section */}
        <section className="mt-8 text-center">
          <h2 className="text-xl font-bold mb-4 text-orange-600">
            {t("quickContacts")}
          </h2>
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row justify-center gap-4 items-center text-center">
            <a
              href={`https://wa.me/${contactInfo?.phone || t("defaultPhone")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 text-green-800 font-semibold hover:bg-green-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.52 3.48A12 12 0 1 0 2.47 20.52l2.65-7.72a1 1 0 0 1 .6-.6l7.72-2.65a1 1 0 0 1 1.2 1.2l-2.65 7.72a1 1 0 0 1-.6.6l-7.72 2.65A12 12 0 1 0 20.52 3.48z" />
              </svg>
              {t("whatsapp")}
            </a>
            <a
              href={`mailto:${contactInfo?.email || t("defaultEmail")}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 text-blue-800 font-semibold hover:bg-blue-200 transition-colors"
            >
              <Mail className="w-5 h-5" />
              {t("emailContact")}
            </a>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="mt-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <Card className="bg-white/90 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  {t("email")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {contactInfo?.email || t("defaultEmail")}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/90 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  {t("phone")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {contactInfo?.phone || t("defaultPhone")}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/90 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {t("address")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {contactInfo?.address || t("defaultAddress")}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/90 shadow-md lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t("workingHours")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                {t("sunday")} - {t("thursday")}: 9:00 - 18:00
                <br />
                {t("friday")} - {t("saturday")}: 10:00 - 16:00
              </p>
            </CardContent>
          </Card>
          </div>
        </section>
      </div>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default Contact;
