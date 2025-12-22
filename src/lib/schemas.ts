/**
 * Zod schemas for API responses and form validation
 * These provide runtime type checking at application boundaries
 */
import { z } from 'zod';
import { logger } from './logger';

// ============================================
// News Types Schemas
// ============================================

/**
 * Schema for verification status
 */
export const VerificationStatusSchema = z.enum(['idle', 'searching', 'verifying', 'verified', 'error']);
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

/**
 * Schema for news veracity levels
 */
export const NewsVeracitySchema = z.enum(['true', 'false', 'unverified', 'partially-true']);
export type NewsVeracity = z.infer<typeof NewsVeracitySchema>;

/**
 * Schema for a news article
 */
export const NewsArticleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  snippet: z.string(),
  url: z.string().url('Must be a valid URL'),
});
export type NewsArticle = z.infer<typeof NewsArticleSchema>;

/**
 * Schema for a source reference
 */
export const SourceSchema = z.object({
  name: z.string().min(1, 'Source name is required'),
  url: z.string().url('Must be a valid URL'),
});
export type Source = z.infer<typeof SourceSchema>;

/**
 * Schema for verification result from Gemini API
 */
export const VerificationResultSchema = z.object({
  veracity: NewsVeracitySchema,
  confidence: z.number().min(0).max(100),
  explanation: z.string(),
  sources: z.array(SourceSchema).default([]),
  correctedInfo: z.string().optional(),
});
export type VerificationResult = z.infer<typeof VerificationResultSchema>;

// ============================================
// Search History Schemas
// ============================================

/**
 * Schema for search history result type
 */
export const ResultTypeSchema = z.enum(['search', 'verification']);
export type ResultType = z.infer<typeof ResultTypeSchema>;

/**
 * Schema for search history item from Appwrite
 */
export const SearchHistoryItemSchema = z.object({
  id: z.string().optional(),
  query: z.string().min(1, 'Query is required'),
  title: z.string().optional(),
  timestamp: z.string().datetime({ message: 'Must be a valid ISO timestamp' }),
  articleUrl: z.string().url().optional().or(z.literal('')),
  articleTitle: z.string().optional(),
  resultType: ResultTypeSchema,
  slug: z.string().optional(),
  veracity: z.string().optional(),
  confidence: z.number().optional(),
});
export type SearchHistoryItem = z.infer<typeof SearchHistoryItemSchema>;

/**
 * Schema for verification document stored in Appwrite
 */
export const VerificationDocumentSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(1, 'Slug is required'),
  userId: z.string().nullable().optional(),
  query: z.string().optional(),
  content: z.string().optional(),
  title: z.string().optional(),
  articleUrl: z.string().optional(),
  articleTitle: z.string().optional(),
  veracity: z.string().optional(),
  confidence: z.number().optional(),
  result: z.string().optional(), // JSON string
  timestamp: z.string().datetime(),
  isPublic: z.boolean().default(true),
  viewCount: z.number().default(0),
});
export type VerificationDocument = z.infer<typeof VerificationDocumentSchema>;

// ============================================
// Auth Schemas
// ============================================

/**
 * Schema for email validation
 */
export const EmailSchema = z.string().email('Invalid email address');

/**
 * Schema for password validation (min 8 chars, at least one number and one letter)
 */
export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * Schema for login form
 */
export const LoginFormSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required'),
});
export type LoginFormData = z.infer<typeof LoginFormSchema>;

/**
 * Schema for signup form
 */
export const SignupFormSchema = z
  .object({
    email: EmailSchema,
    password: PasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type SignupFormData = z.infer<typeof SignupFormSchema>;

// ============================================
// API Response Schemas
// ============================================

/**
 * Schema for Gemini API verification response (raw JSON)
 */
export const GeminiResponseSchema = z.object({
  veracity: z.enum(['true', 'false', 'partially-true', 'unverified']),
  confidence: z.number(),
  explanation: z.string(),
  sources: z.array(z.string()).or(z.array(SourceSchema)),
});

/**
 * Schema for search API response (LangSearch format)
 */
export const LangSearchResultSchema = z.object({
  webPages: z
    .object({
      value: z.array(
        z.object({
          name: z.string().optional(),
          snippet: z.string().optional(),
          url: z.string().optional(),
        })
      ),
    })
    .optional(),
});
export type LangSearchResult = z.infer<typeof LangSearchResultSchema>;

// ============================================
// Validation Helpers
// ============================================

/**
 * Safely parse data with a Zod schema, returning null on failure
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Parsed data or null if validation fails
 */
export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  logger.warn('Schema validation failed:', result.error.errors);
  return null;
}

/**
 * Parse data with a Zod schema, throwing on failure with detailed errors
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Parsed data
 * @throws ZodError if validation fails
 */
export function parseOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Validate and sanitize a URL
 * @param url - URL string to validate
 * @returns Valid URL or null
 */
export function validateUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Validate email format
 * @param email - Email string to validate
 * @returns true if valid email format
 */
export function isValidEmail(email: string): boolean {
  return EmailSchema.safeParse(email).success;
}
