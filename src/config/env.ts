import { logger } from '../lib/logger';

interface EnvConfig {
  STACK_PROJECT_ID: string;
  STACK_PUBLISHABLE_CLIENT_KEY: string;
  APPWRITE_PROJECT_ID: string;
  APPWRITE_DATABASE_ID: string;
  APPWRITE_ENDPOINT: string;
  GEMINI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  LANGSEARCH_API_KEY?: string;
  TAVILY_API_KEY?: string;
  SITE_URL: string;
  AI_PROXY_URL?: string;
  USE_AI_PROXY?: string;
}

const requiredVars = [
  'VITE_STACK_PROJECT_ID',
  'VITE_STACK_PUBLISHABLE_CLIENT_KEY',
  'VITE_APPWRITE_PROJECT_ID',
  'VITE_APPWRITE_DATABASE_ID',
  'VITE_APPWRITE_ENDPOINT',
];

/**
 * Validates that all required environment variables are set.
 * Logs warnings for missing optional variables.
 */
export const validateEnv = () => {
  const missingRequired = requiredVars.filter(
    (varName) => !import.meta.env[varName]
  );

  if (missingRequired.length > 0) {
    logger.error(
      '❌ Missing required environment variables:',
      missingRequired.join(', ')
    );
    // In production, we might want to throw an error or show a blocking UI
    if (import.meta.env.PROD) {
      throw new Error(`Missing required environment variables: ${missingRequired.join(', ')}`);
    }
  }

  // Validate sensitive keys - they should not be empty strings or default values
  const sensitiveVars = [
    { name: 'VITE_STACK_PROJECT_ID', display: 'Stack Project ID' },
    { name: 'VITE_STACK_PUBLISHABLE_CLIENT_KEY', display: 'Stack Publishable Client Key' },
    { name: 'VITE_APPWRITE_PROJECT_ID', display: 'Appwrite Project ID' },
    { name: 'VITE_APPWRITE_ENDPOINT', display: 'Appwrite Endpoint' },
  ];

  sensitiveVars.forEach(({ name, display }) => {
    const value = import.meta.env[name];
    if (!value || value === 'your-project-id' || value === 'your-stack-project-id' ||
        value === 'your-publishable-client-key' || value === 'https://cloud.appwrite.io/v1') {
      const errorMsg = `❌ Invalid ${display}: "${value}" - Please set a valid ${name} in your environment`;
      logger.error(errorMsg);
      if (import.meta.env.PROD) {
        throw new Error(errorMsg);
      }
    }
  });

  const optionalVars = [
    'VITE_GEMINI_API_KEY',
    'VITE_OPENROUTER_API_KEY',
    'VITE_LANGSEARCH_API_KEY',
    'VITE_TAVILY_API_KEY',
  ];

  const missingOptional = optionalVars.filter(
    (varName) => !import.meta.env[varName]
  );

  if (missingOptional.length > 0) {
    logger.warn(
      '⚠️ Missing optional environment variables (some features may be limited):',
      missingOptional.join(', ')
    );
  }
};

/**
 * Typed access to environment variables
 */
export const env: EnvConfig = {
  STACK_PROJECT_ID: import.meta.env.VITE_STACK_PROJECT_ID,
  STACK_PUBLISHABLE_CLIENT_KEY: import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY,
  APPWRITE_PROJECT_ID: import.meta.env.VITE_APPWRITE_PROJECT_ID,
  APPWRITE_DATABASE_ID: import.meta.env.VITE_APPWRITE_DATABASE_ID || 'verifynews-db',
  APPWRITE_ENDPOINT: import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY,
  OPENROUTER_API_KEY: import.meta.env.VITE_OPENROUTER_API_KEY,
  LANGSEARCH_API_KEY: import.meta.env.VITE_LANGSEARCH_API_KEY,
  TAVILY_API_KEY: import.meta.env.VITE_TAVILY_API_KEY,
  SITE_URL: import.meta.env.VITE_SITE_URL || window.location.origin,
  AI_PROXY_URL: import.meta.env.VITE_AI_PROXY_URL,
  USE_AI_PROXY: import.meta.env.VITE_USE_AI_PROXY,
};
