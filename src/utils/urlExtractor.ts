/**
 * Utility functions for extracting content from URLs
 */

/**
 * Extract headline/title from a URL
 * @param url The URL to extract title from
 * @returns Promise<string> The extracted title or fallback text
 */
export const extractHeadlineFromUrl = async (url: string): Promise<string> => {
  try {
    // Basic validation
    if (!url || !url.startsWith('http')) {
      return url;
    }

    // For security and CORS reasons, we'll try to extract from URL patterns first
    const extractedTitle = extractTitleFromUrlPattern(url);
    if (extractedTitle && extractedTitle !== url) {
      return extractedTitle;
    }

    // If we can't extract from URL pattern, try to fetch (this might fail due to CORS)
    try {
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      if (response.ok) {
        const data = await response.json();
        const html = data.contents;
        
        // Extract title from HTML
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          return titleMatch[1].trim();
        }

        // Try meta property="og:title"
        const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
        if (ogTitleMatch && ogTitleMatch[1]) {
          return ogTitleMatch[1].trim();
        }

        // Try meta name="title"
        const metaTitleMatch = html.match(/<meta[^>]*name=["']title["'][^>]*content=["']([^"']+)["']/i);
        if (metaTitleMatch && metaTitleMatch[1]) {
          return metaTitleMatch[1].trim();
        }
      }
    } catch (fetchError) {
      console.warn('Could not fetch URL content:', fetchError);
    }

    // Fallback to URL pattern extraction
    return extractTitleFromUrlPattern(url);
  } catch (error) {
    console.error('Error extracting headline from URL:', error);
    return url; // Return original URL as fallback
  }
};

/**
 * Extract a readable title from URL patterns
 * @param url The URL to extract title from
 * @returns string A readable title or the original URL
 */
const extractTitleFromUrlPattern = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Remove common file extensions
    let path = pathname.replace(/\.(html|htm|php|aspx|jsp)$/i, '');
    
    // Remove leading slash
    path = path.replace(/^\/+/, '');
    
    // Remove trailing slash
    path = path.replace(/\/+$/, '');
    
    // If path is empty, use domain
    if (!path) {
      return urlObj.hostname.replace(/^www\./, '');
    }
    
    // Split by slash and take the last meaningful part
    const parts = path.split('/');
    let title = parts[parts.length - 1];
    
    // If the last part looks like an ID or is too short, try the previous part
    if (title && (title.match(/^\d+$/) || title.length < 3) && parts.length > 1) {
      title = parts[parts.length - 2];
    }
    
    // Replace hyphens and underscores with spaces
    title = title.replace(/[-_]/g, ' ');
    
    // Remove query parameters and fragments
    title = title.split('?')[0].split('#')[0];
    
    // Capitalize first letter of each word
    title = title.replace(/\b\w/g, l => l.toUpperCase());
    
    // If title is still not good, return domain
    if (!title || title.length < 3) {
      return urlObj.hostname.replace(/^www\./, '');
    }
    
    return title.trim();
  } catch (error) {
    console.error('Error extracting title from URL pattern:', error);
    return url;
  }
};

/**
 * Check if a string is a valid URL
 * @param string The string to check
 * @returns boolean True if it's a valid URL
 */
export const isValidUrl = (string: string): boolean => {
  try {
    new URL(string);
    return string.startsWith('http://') || string.startsWith('https://');
  } catch (_) {
    return false;
  }
};
