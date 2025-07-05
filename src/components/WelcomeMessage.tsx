import React from "react";
import { useAuth } from "@/contexts/useAuth";
import { useLanguage } from "@/utils/languageContextUtils";

const WelcomeMessage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const getWelcomeMessage = () => {
    if (user) {
      // المستخدم مسجل دخول - اعرض رسالة مع الاسم
      return t("welcomeUser").replace("{name}", user.full_name);
    } else {
      // المستخدم غير مسجل دخول - اعرض رسالة ترحيب عامة
      return t("welcomeBack");
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-orange-100 to-orange-200 px-6 mb-6 md:hidden">
      <div className="text-center">
        <p className="text-orange-800 font-medium text-lg">
          {getWelcomeMessage()}
        </p>
      </div>
    </div>
  );
};

export default WelcomeMessage;
