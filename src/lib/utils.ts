import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Debounces a function, ensuring it's only called after a specified delay
 * since the last time it was invoked.
 *
 * @param func The function to debounce
 * @param wait The number of milliseconds to delay
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  
  return function (...args: Parameters<T>): void {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * Throttles a function, ensuring it's called at most once in a specified time period.
 *
 * @param func The function to throttle
 * @param limit The number of milliseconds to throttle
 * @returns A throttled version of the function
 */
export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastFunc: ReturnType<typeof setTimeout> | null = null
  let lastRan = 0
  
  return function (...args: Parameters<T>): void {
    const now = Date.now()
    
    if (!lastRan || now - lastRan >= limit) {
      func(...args)
      lastRan = now
    } else if (!lastFunc) {
      lastFunc = setTimeout(() => {
        if (lastRan === 0 || Date.now() - lastRan >= limit) {
          func(...args)
          lastRan = Date.now()
          lastFunc = null
        }
      }, limit - (now - lastRan))
    }
  }
}

/**
 * Performs a deep comparison between two values to determine if they are equivalent.
 *
 * @param obj1 The first value to compare
 * @param obj2 The second value to compare
 * @returns True if the values are deeply equal, false otherwise
 */
export function deepEqual(obj1: unknown, obj2: unknown): boolean {
  // Handle primitive types and null/undefined
  if (obj1 === obj2) return true
  
  if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
    return false
  }
  
  // Handle Date objects
  if (obj1 instanceof Date && obj2 instanceof Date) {
    return obj1.getTime() === obj2.getTime()
  }
  
  // Handle arrays
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) return false
    
    for (let i = 0; i < obj1.length; i++) {
      if (!deepEqual(obj1[i], obj2[i])) return false
    }
    
    return true
  }
  
  // Handle objects
  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)
  
  if (keys1.length !== keys2.length) return false
  
  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
      return false
    }
  }
  
  return true
}

/**
 * Normalizes a query string for similarity matching.
 * Converts to lowercase, removes punctuation, extra spaces, and common stop words.
 * 
 * @param query The query string to normalize
 * @returns Normalized query string
 */
export function normalizeQuery(query: string): string {
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used',
    'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
    'through', 'during', 'before', 'after', 'above', 'below', 'between',
    'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either', 'neither',
    'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just',
    'that', 'this', 'these', 'those', 'what', 'which', 'who', 'whom',
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves',
    'you', 'your', 'yours', 'yourself', 'yourselves',
    'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
    'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves'
  ])

  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .sort() // Sort for consistent ordering
    .join(' ')
    .trim()
}

/**
 * Generates a simple hash from a string for quick similarity lookup.
 * Uses a combination of normalized content for grouping similar queries.
 * 
 * @param text The text to hash
 * @returns A hash string suitable for database indexing
 */
export function generateQueryHash(text: string): string {
  const normalized = normalizeQuery(text)
  
  // Simple hash function for client-side use
  let hash = 0
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  
  // Return as hex string with prefix for readability
  return `qh_${Math.abs(hash).toString(16)}`
}

/**
 * Calculates similarity score between two strings using Jaccard similarity.
 * 
 * @param str1 First string
 * @param str2 Second string
 * @returns Similarity score between 0 and 1
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(normalizeQuery(str1).split(' '))
  const words2 = new Set(normalizeQuery(str2).split(' '))
  
  if (words1.size === 0 || words2.size === 0) return 0
  
  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const union = new Set([...words1, ...words2])
  
  return intersection.size / union.size
}
