import { Client, Account, Databases, Storage, ID, Query } from 'appwrite';
import { API_ENDPOINTS, COLLECTIONS } from '@/lib/constants';
import { logger } from '@/lib/logger';

// Initialize Appwrite client
const client = new Client();

// Environment variables
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || API_ENDPOINTS.APPWRITE_DEFAULT;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'verifynews-db';
const bucketId = import.meta.env.VITE_APPWRITE_BUCKET_ID || 'verifynews-media';

if (projectId) {
  client
    .setEndpoint(endpoint)
    .setProject(projectId);
  logger.info('✅ Appwrite initialized:', { endpoint, projectId, databaseId, bucketId });
} else {
  logger.warn('⚠️ Missing VITE_APPWRITE_PROJECT_ID environment variable');
}

// Initialize Appwrite services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Database and collection IDs
export const DATABASE_ID = databaseId;
export const BUCKET_ID = bucketId;
export { COLLECTIONS };

// Export utilities
export { client, ID, Query };
export default client;
