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
