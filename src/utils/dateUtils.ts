/**
 * Date formatting utilities
 * Ensures all dates use Gregorian calendar (English format) across all languages
 * No Hijri calendar dates allowed as per requirements
 */

export type DateFormatType = 'full' | 'short' | 'time' | 'dateTime' | 'relative';

/**
 * Format date using English Gregorian calendar only
 * @param date - Date string or Date object
 * @param format - Format type
 * @returns Formatted date string
 */
export const formatDate = (date: string | Date, format: DateFormatType = 'short'): string => {
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  // Always use English locale and Gregorian calendar
  const locale = 'en-US';
  const options: Intl.DateTimeFormatOptions = {
    calendar: 'gregory', // Explicitly use Gregorian calendar (no Hijri)
  };

  switch (format) {
    case 'full':
      return dateObj.toLocaleDateString(locale, {
        ...options,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      });

    case 'short':
      return dateObj.toLocaleDateString(locale, {
        ...options,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

    case 'time':
      return dateObj.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false, // Use 24-hour format
      });

    case 'dateTime':
      return dateObj.toLocaleString(locale, {
        ...options,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

    case 'relative':
      return getRelativeTime(dateObj);

    default:
      return dateObj.toLocaleDateString(locale, options);
  }
};

/**
 * Get relative time description (e.g., "2 days ago", "yesterday")
 * @param date - Date object
 * @returns Relative time string in English
 */
export const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  } else if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`;
  } else if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
  }
};

/**
 * Check if a date is today
 * @param date - Date to check
 * @returns True if date is today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Check if a date is yesterday
 * @param date - Date to check
 * @returns True if date is yesterday
 */
export const isYesterday = (date: Date): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
};

/**
 * Format date for order display (consistent across admin and user interfaces)
 * @param date - Date string or Date object
 * @returns Formatted date and time string
 */
export const formatOrderDate = (date: string | Date): string => {
  return formatDate(date, 'dateTime');
};

/**
 * Format date for product creation/update display
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export const formatProductDate = (date: string | Date): string => {
  return formatDate(date, 'dateTime');
};

/**
 * Format date for user activity logs
 * @param date - Date string or Date object
 * @returns Formatted date and time string
 */
export const formatActivityDate = (date: string | Date): string => {
  return formatDate(date, 'dateTime');
};
