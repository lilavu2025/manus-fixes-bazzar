import * as React from "react";
import { useLanguage } from "@/utils/languageContextUtils";
import type { Language } from "@/types/language";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import config from "@/configs/activeConfig";

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const allLanguages: { code: Language; name: string; flag: string }[] = [
    { code: "ar", name: "العربية", flag: "🇸🇦" },
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "he", name: "עברית", flag: "🇮🇱" },
  ];

  // فلترة اللغات المتاحة بناءً على تكوين العميل
  const availableLanguages = allLanguages.filter((lang) =>
    config.availableLanguages?.includes(lang.code) ?? true
  );

  const currentLanguage = availableLanguages.find((lang) => lang.code === language);

  // إخفاء السويتشر إذا كان هناك لغة واحدة فقط
  if (availableLanguages.length <= 1) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-6 w-6" />
          <span>
            {currentLanguage?.flag} {currentLanguage?.name}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={`bg-white z-50 ${isRTL(language) ? "rtl" : "ltr"}`}
        style={{ direction: isRTL(language) ? "rtl" : "ltr" }}
      >
        {availableLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`gap-2 cursor-pointer ${language === lang.code ? "bg-gray-100" : ""}`}
          >
            <span>{lang.flag}</span>
            <span>{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;

function isRTL(language: Language) {
  return language === "ar" || language === "he";
}
