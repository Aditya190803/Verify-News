/**
 * Application-wide constants
 * Centralizes magic strings and configuration values
 */

// ============================================
// Local Storage Keys
// ============================================
export const STORAGE_KEYS = {
  /** User's theme preference */
  THEME: 'verifynews-theme',
  /** Whether to show search history sidebar */
  SHOW_SEARCH_HISTORY: 'showSearchHistory',
  /** Stack Auth access token */
  ACCESS_TOKEN: 'stack_access_token',
  /** Stack Auth refresh token */
  REFRESH_TOKEN: 'stack_refresh_token',
} as const;

// ============================================
// API Endpoints
// ============================================
export const API_ENDPOINTS = {
  /** LangSearch API base URL */
  LANGSEARCH: 'https://api.langsearch.io/v1/web-search',
  /** Stack Auth API base URL */
  STACK_AUTH: 'https://api.stack-auth.com/api/v1',
  /** Appwrite default endpoint */
  APPWRITE_DEFAULT: 'https://cloud.appwrite.io/v1',
} as const;

// ============================================
// App Metadata
// ============================================
export const APP_METADATA = {
  NAME: 'VerifyNews',
  DESCRIPTION: 'AI-powered news verification platform',
  URL: 'https://verifynews.app',
  TWITTER_HANDLE: '@verifynewsapp',
} as const;

// ============================================
// Error Messages
// ============================================
export const ERROR_MESSAGES = {
  // Authentication
  AUTH_NOT_CONFIGURED: 'Authentication is not configured',
  INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
  SIGNUP_FAILED: 'Failed to create account. Please try again.',
  LOGIN_REQUIRED: 'Please log in to continue',
  USER_NOT_FOUND: 'Failed to get user after authentication',
  
  // Verification
  INVALID_SEARCH_QUERY: 'Invalid search query',
  VERIFICATION_FAILED: 'Failed to verify the content. Please try again.',
  
  // Network
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  
  // API
  API_KEY_MISSING: 'API key is not configured',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please wait before trying again.',
  
  // General
  SOMETHING_WENT_WRONG: 'Something went wrong. Please try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action',
} as const;

// ============================================
// Success Messages
// ============================================
export const SUCCESS_MESSAGES = {
  // Authentication
  SIGNUP_SUCCESS: 'Account created successfully!',
  LOGIN_SUCCESS: 'Logged in successfully!',
  LOGOUT_SUCCESS: 'Logged out successfully',
  PASSWORD_RESET_SENT: 'Password reset email sent. Check your inbox.',
  
  // Verification
  VERIFICATION_COMPLETE: 'Verification complete!',
  
  // History
  HISTORY_CLEARED: 'Search history cleared',
  HISTORY_ITEM_DELETED: 'Item removed from history',
} as const;

// ============================================
// UI Text
// ============================================
export const UI_TEXT = {
  // Loading states
  LOADING: 'Loading...',
  VERIFYING: 'Verifying...',
  SEARCHING: 'Searching...',
  
  // Buttons
  SUBMIT: 'Submit',
  CANCEL: 'Cancel',
  VERIFY: 'Verify',
  SEARCH: 'Search',
  LOGIN: 'Log In',
  SIGNUP: 'Sign Up',
  LOGOUT: 'Log Out',
  
  // Placeholders
  EMAIL_PLACEHOLDER: 'Enter your email',
  PASSWORD_PLACEHOLDER: 'Enter your password',
  SEARCH_PLACEHOLDER: 'Enter news headline, URL, or paste article text...',
} as const;

// ============================================
// Routes
// ============================================
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  ABOUT: '/about',
  HOW_IT_WORKS: '/how-it-works',
  SEARCH_RESULTS: '/search-results',
  RESULT: '/result',
  OAUTH_CALLBACK: '/oauth/callback',
  RESET_PASSWORD: '/reset-password',
} as const;

// ============================================
// Verification Verdicts
// ============================================
export const VERDICTS = {
  TRUE: 'True',
  FALSE: 'False',
  MISLEADING: 'Misleading',
  UNVERIFIED: 'Unverified',
  PARTIALLY_TRUE: 'Partially True',
} as const;

// ============================================
// Rate Limiting
// ============================================
export const RATE_LIMITS = {
  /** Maximum verification requests per minute */
  VERIFICATIONS_PER_MINUTE: 10,
  /** Maximum search requests per minute */
  SEARCHES_PER_MINUTE: 20,
  /** Delay between retries in milliseconds */
  RETRY_DELAY_MS: 1000,
  /** Maximum number of retry attempts */
  MAX_RETRIES: 3,
} as const;

// ============================================
// Database Collections (Appwrite)
// ============================================
export const COLLECTIONS = {
  USERS: 'users',
  VERIFICATIONS: 'verifications',
  SEARCH_HISTORY: 'search_history',
  USER_SETTINGS: 'user_settings',
} as const;

// ============================================
// Reliable Sources for Verification Badges
// ============================================
export const RELIABLE_SOURCES = [
  'Reuters',
  'Associated Press',
  'AP News',
  'BBC',
  'BBC News',
  'The New York Times',
  'NYT',
  'The Wall Street Journal',
  'WSJ',
  'The Guardian',
  'Al Jazeera',
  'NPR',
  'PBS NewsHour',
  'The Economist',
  'Bloomberg',
  'Financial Times',
  'FT',
  'Snopes',
  'PolitiFact',
  'FactCheck.org',
  'Full Fact',
  'AFP Fact Check',
  'Reuters Fact Check'
] as const;
