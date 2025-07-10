import { z } from 'zod';
import { getAvailableLanguages, isLanguageFieldRequired } from '@/utils/fieldVisibilityUtils';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address');

export const phoneSchema = z.string()
  .min(10, 'Phone number must be at least 10 digits')
  .regex(/^[\d\s\-+()]+$/, 'Invalid phone number format');

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const nameSchema = z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters');

// Address validation schemas
export const addressSchema = z.object({
  full_name: nameSchema,
  phone: phoneSchema,
  city: z.string().min(2, 'City is required'),
  area: z.string().min(2, 'Area is required'),
  street: z.string().min(2, 'Street is required'),
  building: z.string().min(1, 'Building is required'),
  floor: z.string().optional(),
  apartment: z.string().optional(),
  is_default: z.boolean().default(false),
});

// Dynamic validation functions based on available languages
export const createProductSchema = () => {
  const availableLanguages = getAvailableLanguages();
  
  const schemaFields: any = {
    price: z.number().positive('Price must be positive'),
    original_price: z.number().positive('Original price must be positive').optional(),
    wholesale_price: z.number().positive('Wholesale price must be positive').optional(),
    discount: z.number().min(0).max(100).optional(),
    category_id: z.string().uuid('Invalid category'),
    in_stock: z.boolean(),
    featured: z.boolean(),
    active: z.boolean(),
  };

  // Add language fields based on availability
  if (availableLanguages.includes('ar')) {
    schemaFields.name_ar = isLanguageFieldRequired('ar') 
      ? z.string().min(2, 'Arabic name is required')
      : z.string().optional();
    schemaFields.description_ar = z.string().optional();
  }
  
  if (availableLanguages.includes('en')) {
    schemaFields.name_en = isLanguageFieldRequired('en')
      ? z.string().min(2, 'English name is required')  
      : z.string().optional();
    schemaFields.description_en = z.string().optional();
  }
  
  if (availableLanguages.includes('he')) {
    schemaFields.name_he = isLanguageFieldRequired('he')
      ? z.string().min(2, 'Hebrew name is required')
      : z.string().optional();
    schemaFields.description_he = z.string().optional();
  }

  return z.object(schemaFields);
};

export const createCategorySchema = () => {
  const availableLanguages = getAvailableLanguages();
  
  const schemaFields: any = {
    image: z.string().url('Invalid image URL').optional(),
    icon: z.string().optional(),
  };

  // Add language fields based on availability
  if (availableLanguages.includes('ar')) {
    schemaFields.name_ar = isLanguageFieldRequired('ar')
      ? z.string().min(2, 'Arabic name is required')
      : z.string().optional();
  }
  
  if (availableLanguages.includes('en')) {
    schemaFields.name_en = isLanguageFieldRequired('en')
      ? z.string().min(2, 'English name is required')
      : z.string().optional();
  }
  
  if (availableLanguages.includes('he')) {
    schemaFields.name_he = isLanguageFieldRequired('he')
      ? z.string().min(2, 'Hebrew name is required')
      : z.string().optional();
  }

  return z.object(schemaFields);
};

// Order validation schemas
export const orderSchema = z.object({
  shipping_address: addressSchema,
  payment_method: z.enum(['cash', 'credit_card', 'bank_transfer']),
  notes: z.string().optional(),
});

// Sanitization functions
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '');
};

export const sanitizePhone = (phone: string): string => {
  return phone.replace(/[^\d+]/g, '');
};

export const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

// Validation helpers
export const validateForm = <T>(schema: z.ZodSchema<T>, data: unknown): { 
  success: boolean; 
  data?: T; 
  errors?: Record<string, string> 
} => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          errors[err.path.join('.')] = err.message;
        }
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};

// XSS prevention
export const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// SQL injection prevention (for search queries)
export const sanitizeSearchQuery = (query: string): string => {
  return query
    .replace(/[';\\]/g, '')
    .trim()
    .substring(0, 100); // Limit length
};