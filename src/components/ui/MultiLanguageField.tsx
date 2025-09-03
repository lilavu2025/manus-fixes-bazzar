// src/components/ui/MultiLanguageField.tsx
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/utils/languageContextUtils';
import { shouldShowLanguageField, isLanguageFieldRequired, getLanguageName } from '@/utils/fieldVisibilityUtils';
import { Language } from '@/types/language';

interface MultiLanguageFieldProps {
  fieldName: string;
  label: string;
  type?: 'input' | 'textarea';
  values: {
    ar?: string;
    en?: string;
    he?: string;
  };
  onChange: (language: Language, value: string) => void;
  placeholder?: {
    ar?: string;
    en?: string;
    he?: string;
  };
  rows?: number;
  className?: string;
  required?: boolean; // إضافة خاصية للتحكم في كون الحقل مطلوب أم لا
  inline?: boolean; // عرض الحقول لكل اللغات في نفس السطر
}

const MultiLanguageField: React.FC<MultiLanguageFieldProps> = ({
  fieldName,
  label,
  type = 'input',
  values,
  onChange,
  placeholder,
  rows = 3,
  className = '',
  required = false, // قيمة افتراضية
  inline = false
}) => {
  const { language: currentLang, isRTL } = useLanguage();

  const languages: Language[] = ['ar', 'en', 'he'];
  const visibleLanguages = languages.filter(lang => shouldShowLanguageField(lang));

  // إذا كان هناك لغة واحدة فقط، لا نعرض التبويبات
  if (visibleLanguages.length === 1) {
    const lang = visibleLanguages[0];
    const isFieldRequired = required && isLanguageFieldRequired(lang);
    
    return (
      <div className={className} dir={isRTL ? 'rtl' : 'ltr'}>
        <Label htmlFor={`${fieldName}_${lang}`}>
          {label} {isFieldRequired && <span className="text-red-500">*</span>}
        </Label>
        {type === 'textarea' ? (
          <Textarea
            id={`${fieldName}_${lang}`}
            value={values[lang] || ''}
            onChange={(e) => onChange(lang, e.target.value)}
            placeholder={placeholder?.[lang]}
            rows={rows}
            required={isFieldRequired}
            className={isRTL ? 'text-right' : 'text-left'}
          />
        ) : (
          <Input
            id={`${fieldName}_${lang}`}
            value={values[lang] || ''}
            onChange={(e) => onChange(lang, e.target.value)}
            placeholder={placeholder?.[lang]}
            required={isFieldRequired}
            className={isRTL ? 'text-right' : 'text-left'}
          />
        )}
      </div>
    );
  }

  // إذا كان هناك أكثر من لغة، عرض الحقول إما عموديًا (افتراضي) أو أفقيًا (inline)
  if (!inline) {
    return (
      <div className={className} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="space-y-4">
          {visibleLanguages.map((lang) => {
            const isFieldRequired = required && isLanguageFieldRequired(lang);
            const langName = getLanguageName(lang, currentLang);
            return (
              <div key={lang}>
                <Label htmlFor={`${fieldName}_${lang}`} className="text-sm">
                  {langName} {isFieldRequired && <span className="text-red-500">*</span>}
                </Label>
                {type === 'textarea' ? (
                  <Textarea
                    id={`${fieldName}_${lang}`}
                    value={values[lang] || ''}
                    onChange={(e) => onChange(lang, e.target.value)}
                    placeholder={placeholder?.[lang]}
                    rows={rows}
                    required={isFieldRequired}
                    className={isRTL ? 'text-right' : 'text-left'}
                  />
                ) : (
                  <Input
                    id={`${fieldName}_${lang}`}
                    value={values[lang] || ''}
                    onChange={(e) => onChange(lang, e.target.value)}
                    placeholder={placeholder?.[lang]}
                    required={isFieldRequired}
                    className={isRTL ? 'text-right' : 'text-left'}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // inline layout: شبكة بثلاثة أعمدة (عربي/إنجليزي/عبري) في نفس السطر
  return (
    <div className={className} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {visibleLanguages.map((lang) => {
          const isFieldRequired = required && isLanguageFieldRequired(lang);
          const langName = getLanguageName(lang, currentLang);
          // نجعل وسم اللغة كـ aria-label ونستعمل placeholder المختصر
          return (
            <div key={lang}>
              <Label htmlFor={`${fieldName}_${lang}`} className="text-[11px] text-gray-600 mb-1 block">
                {langName} {isFieldRequired && <span className="text-red-500">*</span>}
              </Label>
              {type === 'textarea' ? (
                <Textarea
                  aria-label={langName}
                  id={`${fieldName}_${lang}`}
                  value={values[lang] || ''}
                  onChange={(e) => onChange(lang, e.target.value)}
                  placeholder={placeholder?.[lang] || langName}
                  rows={rows}
                  required={isFieldRequired}
                  className={isRTL ? 'text-right' : 'text-left'}
                />
              ) : (
                <Input
                  aria-label={langName}
                  id={`${fieldName}_${lang}`}
                  value={values[lang] || ''}
                  onChange={(e) => onChange(lang, e.target.value)}
                  placeholder={placeholder?.[lang] || langName}
                  required={isFieldRequired}
                  className={isRTL ? 'text-right' : 'text-left'}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MultiLanguageField;
