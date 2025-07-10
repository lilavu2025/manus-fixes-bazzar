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
}

const MultiLanguageField: React.FC<MultiLanguageFieldProps> = ({
  fieldName,
  label,
  type = 'input',
  values,
  onChange,
  placeholder,
  rows = 3,
  className = ''
}) => {
  const { language: currentLang } = useLanguage();

  const languages: Language[] = ['ar', 'en', 'he'];
  const visibleLanguages = languages.filter(lang => shouldShowLanguageField(lang));

  // إذا كان هناك لغة واحدة فقط، لا نعرض التبويبات
  if (visibleLanguages.length === 1) {
    const lang = visibleLanguages[0];
    const isRequired = isLanguageFieldRequired(lang);
    
    return (
      <div className={className}>
        <Label htmlFor={`${fieldName}_${lang}`}>
          {label} {isRequired && <span className="text-red-500">*</span>}
        </Label>
        {type === 'textarea' ? (
          <Textarea
            id={`${fieldName}_${lang}`}
            value={values[lang] || ''}
            onChange={(e) => onChange(lang, e.target.value)}
            placeholder={placeholder?.[lang]}
            rows={rows}
            required={isRequired}
          />
        ) : (
          <Input
            id={`${fieldName}_${lang}`}
            value={values[lang] || ''}
            onChange={(e) => onChange(lang, e.target.value)}
            placeholder={placeholder?.[lang]}
            required={isRequired}
          />
        )}
      </div>
    );
  }

  // إذا كان هناك أكثر من لغة، عرض التبويبات
  return (
    <div className={className}>
      <div className="space-y-4">
        {visibleLanguages.map((lang) => {
          const isRequired = isLanguageFieldRequired(lang);
          const langName = getLanguageName(lang, currentLang);
          
          return (
            <div key={lang}>
              <Label htmlFor={`${fieldName}_${lang}`} className="text-sm">
                {langName} {isRequired && <span className="text-red-500">*</span>}
              </Label>
              {type === 'textarea' ? (
                <Textarea
                  id={`${fieldName}_${lang}`}
                  value={values[lang] || ''}
                  onChange={(e) => onChange(lang, e.target.value)}
                  placeholder={placeholder?.[lang]}
                  rows={rows}
                  required={isRequired}
                />
              ) : (
                <Input
                  id={`${fieldName}_${lang}`}
                  value={values[lang] || ''}
                  onChange={(e) => onChange(lang, e.target.value)}
                  placeholder={placeholder?.[lang]}
                  required={isRequired}
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
