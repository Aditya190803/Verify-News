/**
 * Input sanitization utilities to prevent XSS and other injection attacks
 * These functions sanitize user input before display or storage
 */

/**
 * HTML entities that need to be escaped
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape HTML entities to prevent XSS attacks
 * @param str - String to sanitize
 * @returns Sanitized string with HTML entities escaped
 */
export function escapeHtml(str: string): string {
  if (typeof str !== 'string') {
    return '';
  }
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Remove HTML tags from a string
 * @param str - String to strip tags from
 * @returns String with HTML tags removed
 */
export function stripHtmlTags(str: string): string {
  if (typeof str !== 'string') {
    return '';
  }
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize a string for safe display in HTML context
 * Removes tags and escapes entities
 * @param str - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeForDisplay(str: string): string {
  return escapeHtml(stripHtmlTags(str));
}

/**
 * Sanitize user input for storage
 * Trims whitespace and removes control characters
 * @param str - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeForStorage(str: string): string {
  if (typeof str !== 'string') {
    return '';
  }
  // Remove control characters except newlines and tabs
  // eslint-disable-next-line no-control-regex
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

/**
 * Sanitize a URL to prevent javascript: and data: protocol attacks
 * @param url - URL to sanitize
 * @returns Safe URL or empty string if unsafe
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') {
    return '';
  }
  
  const trimmed = url.trim().toLowerCase();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      console.warn(`Blocked dangerous URL protocol: ${protocol}`);
      return '';
    }
  }
  
  // Only allow http, https, mailto, and tel protocols
  if (trimmed.startsWith('http://') || 
      trimmed.startsWith('https://') || 
      trimmed.startsWith('mailto:') || 
      trimmed.startsWith('tel:') ||
      trimmed.startsWith('/') ||
      trimmed.startsWith('#')) {
    return url.trim();
  }
  
  // If no protocol, assume https
  if (!trimmed.includes('://') && !trimmed.startsWith('/')) {
    return `https://${url.trim()}`;
  }
  
  return '';
}

/**
 * Sanitize search query input
 * Removes potentially dangerous characters while preserving search functionality
 * @param query - Search query to sanitize
 * @returns Sanitized search query
 */
export function sanitizeSearchQuery(query: string): string {
  if (typeof query !== 'string') {
    return '';
  }
  
  return query
    .trim()
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove special characters that could be used for injection
    .replace(/[<>{}[\]\\]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Limit length
    .substring(0, 1000);
}

/**
 * Sanitize news content input
 * Preserves more content while removing dangerous elements
 * @param content - News content to sanitize
 * @returns Sanitized content
 */
export function sanitizeNewsContent(content: string): string {
  if (typeof content !== 'string') {
    return '';
  }
  
  return content
    .trim()
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove style tags and their content
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove HTML tags but preserve text content
    .replace(/<[^>]*>/g, '')
    // Normalize whitespace but preserve paragraph breaks
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    // Limit length
    .substring(0, 10000);
}

/**
 * Validate and sanitize an email address
 * @param email - Email to validate
 * @returns Sanitized email or empty string if invalid
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    return '';
  }
  
  const trimmed = email.trim().toLowerCase();
  
  // Basic email regex validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return '';
  }
  
  // Remove any potentially dangerous characters
  return trimmed.replace(/[<>'"]/g, '');
}

/**
 * Create a safe text node from user input
 * For use when you need to insert user content into DOM
 * @param str - String to make safe
 * @returns Safe string for text content
 */
export function toSafeTextContent(str: string): string {
  if (typeof str !== 'string') {
    return '';
  }
  
  // Create a text node and extract its content to get proper escaping
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Truncate a string safely without breaking HTML entities
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to append if truncated (default: '...')
 * @returns Truncated string
 */
export function truncateSafe(str: string, maxLength: number, suffix = '...'): string {
  if (typeof str !== 'string' || str.length <= maxLength) {
    return str || '';
  }
  
  const truncated = str.substring(0, maxLength - suffix.length);
  
  // Don't break in the middle of an HTML entity
  const lastAmpersand = truncated.lastIndexOf('&');
  if (lastAmpersand !== -1 && !truncated.substring(lastAmpersand).includes(';')) {
    return truncated.substring(0, lastAmpersand) + suffix;
  }
  
  return truncated + suffix;
}
