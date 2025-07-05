import React, { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/utils/languageContextUtils";
import CartSidebar from "@/components/CartSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { useContactInfo } from "@/hooks/useContactInfo";
import emailjs from "@emailjs/browser";
import { useEnhancedToast } from "@/hooks/useEnhancedToast";
import config from "@/configs/activeConfig";

const Contact: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const enhancedToast = useEnhancedToast();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { contactInfo, loading: contactLoading } = useContactInfo();
  const { primaryColor, secondaryColor } = config.visual;
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
      enhancedToast.success('messageSubmitted');
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (err) {
      enhancedToast.error('errorSendingMessage');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen bg-gray-50 ${isRTL ? "rtl" : "ltr"}`}
      dir={isRTL ? "rtl" : "ltr"}
      style={{ paddingTop: '2rem', paddingBottom: '2rem', paddingLeft: '1rem', paddingRight: '1rem' }}
    >
      {/* Animated Banner */}
      <div
        className="rounded-xl p-1 text-white text-center mb-2"
        style={{
          backgroundImage: `linear-gradient(270deg, ${primaryColor}, ${secondaryColor}, ${primaryColor})`,
          backgroundSize: "300% 300%",
          animation: "gradientBG 6s ease infinite",
        }}
      >
        <style>
          {`
            @keyframes gradientBG {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
          `}
        </style>
        <h1 className="text-3xl font-bold mb-2">{t("contact")}</h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        

        {/* Contact Info Cards */}
        <section>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            {/* Email Card */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.4 }}
            >
              <Card className="bg-white shadow-sm border border-gray-200 rounded-xl hover:shadow-md transition">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800 text-base font-medium">
                    <Mail className="h-5 w-5 text-blue-600" />
                    {t("email")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">
                    {contactInfo?.email || t("defaultEmail")}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Phone Card */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.4 }}
            >
              <Card className="bg-white shadow-sm border border-gray-200 rounded-xl hover:shadow-md transition">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800 text-base font-medium">
                    <Phone className="h-5 w-5 text-green-600" />
                    {t("phone")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">
                    {contactInfo?.phone || t("defaultPhone")}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Address Card */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.4 }}
            >
              <Card className="bg-white shadow-sm border border-gray-200 rounded-xl hover:shadow-md transition">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800 text-base font-medium">
                    <MapPin className="h-5 w-5 text-red-600" />
                    {t("address")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">
                    {contactInfo?.address || t("defaultAddress")}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Working Hours - Full Width */}
            <motion.div
              className="lg:col-span-3"
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.4 }}
            >
              <Card className="bg-white shadow-sm border border-gray-200 rounded-xl hover:shadow-md transition lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800 text-base font-medium">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    {t("workingHours")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm whitespace-pre-line">
                    {contactInfo?.working_hours
                      ? contactInfo.working_hours
                      : `${t("sunday")}-${t("thursday")}: 9:00 - 18:00\n${t("friday")}-${t("saturday")}: 10:00 - 16:00`}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </section>
{/* Quick Contact Section */}
        <section className="mt-8 text-center">
          <h2 className="text-xl font-bold mb-4 text-black/80">
            {t("quickContacts")}
          </h2>
          <motion.div
            className="max-w-2xl mx-auto flex flex-col sm:flex-row justify-center gap-4 items-center text-center"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            <motion.a
              href={`https://wa.me/${contactInfo?.phone || t("defaultPhone")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 text-green-800 font-semibold hover:bg-green-200 transition-colors"
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.4 }}
            >
              <svg
                className="w-5 h-5 text-green-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 32 32"
              >
                <path d="M16.001 3.2a12.8 12.8 0 0 0-11.13 18.83L3.2 28.8l6.99-1.654A12.801 12.801 0 1 0 16.001 3.2zm0 23.054a10.26 10.26 0 0 1-5.205-1.428l-.373-.219-4.153.983.997-4.045-.243-.416a10.27 10.27 0 1 1 9.007 5.125zm5.735-7.735c-.31-.155-1.824-.9-2.107-1.003-.282-.104-.488-.155-.695.155-.206.31-.797 1.003-.978 1.21-.181.206-.36.232-.67.078-.31-.155-1.31-.483-2.492-1.54-.921-.82-1.543-1.833-1.724-2.143-.18-.31-.02-.478.135-.632.138-.136.31-.36.465-.543.154-.181.206-.31.31-.516.104-.206.052-.388-.026-.543-.077-.155-.694-1.674-.951-2.294-.251-.602-.508-.52-.694-.53-.181-.01-.388-.012-.594-.012-.206 0-.543.078-.827.388-.282.31-1.077 1.052-1.077 2.565s1.103 2.976 1.256 3.183c.154.206 2.168 3.31 5.25 4.636.733.316 1.304.504 1.75.643.735.234 1.404.201 1.935.122.59-.087 1.824-.745 2.083-1.464.257-.717.257-1.33.18-1.464-.077-.132-.282-.206-.59-.36z"/>
              </svg>
              {t("whatsapp")}
            </motion.a>

            <motion.a
              href={`mailto:${contactInfo?.email || t("defaultEmail")}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 text-blue-800 font-semibold hover:bg-blue-200 transition-colors"
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.4 }}
            >
              <Mail className="w-5 h-5" />
              {t("emailContact")}
            </motion.a>
          </motion.div>
        </section>
      </div>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default Contact;
