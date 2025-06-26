import React from 'react';
import { useLanguage } from '@/utils/languageContextUtils';
import { formatDate, getRelativeTime } from '@/utils/commonUtils';

interface FormattedDateProps {
  date: string | Date;
  format?: 'relative' | 'full' | 'short' | 'time' | 'dateTime';
  className?: string;
}

export const FormattedDate: React.FC<FormattedDateProps> = ({ 
  date, 
  format = 'relative', 
  className = '' 
}) => {
  const { t } = useLanguage();

  const formatDateWithTranslation = (dateInput: string | Date, formatType: string) => {
    const dateObj = new Date(dateInput);
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }

    if (formatType === 'relative') {
      const now = new Date();
      const diffInMs = now.getTime() - dateObj.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInDays === 0) {
        return t('todayText') || 'Today';
      } else if (diffInDays === 1) {
        return t('yesterdayText') || 'Yesterday';
      } else if (diffInDays < 7) {
        const text = t('daysAgoText') || '{count} days ago';
        return text.replace('{count}', diffInDays.toString());
      } else if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        const text = t('weeksAgoText') || '{count} weeks ago';
        return text.replace('{count}', weeks.toString());
      } else {
        const months = Math.floor(diffInDays / 30);
        const text = t('monthsAgoText') || '{count} months ago';
        return text.replace('{count}', months.toString());
      }
    }

    // Use the utility function for consistent Gregorian formatting
    return formatDate(dateInput, formatType as any);
  };

  return (
    <span className={`text-sm ${className}`}>
      {formatDateWithTranslation(date, format)}
    </span>
  );
};

export default FormattedDate;
