import { Client, Account, Databases, ID, Query } from 'appwrite';
import { API_ENDPOINTS, COLLECTIONS } from '@/lib/constants';

// Initialize Appwrite client
const client = new Client();

// Environment variables
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || API_ENDPOINTS.APPWRITE_DEFAULT;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'verifynews-db';

if (projectId) {
  client
    .setEndpoint(endpoint)
    .setProject(projectId);
  console.log('✅ Appwrite initialized:', { endpoint, projectId, databaseId });
} else {
  console.warn('⚠️ Missing VITE_APPWRITE_PROJECT_ID environment variable');
}

// Initialize Appwrite services
export const account = new Account(client);
export const databases = new Databases(client);

// Database and collection IDs
export const DATABASE_ID = databaseId;
export { COLLECTIONS };

// Export utilities
export { client, ID, Query };
export default client;
