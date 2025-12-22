/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STACK_PROJECT_ID: string;
  readonly VITE_STACK_PUBLISHABLE_CLIENT_KEY: string;
  readonly VITE_APPWRITE_ENDPOINT: string;
  readonly VITE_APPWRITE_PROJECT_ID: string;
  readonly VITE_APPWRITE_DATABASE_ID: string;
  readonly VITE_APPWRITE_COLLECTION_SEARCH_HISTORY: string;
  readonly VITE_APPWRITE_COLLECTION_VERIFICATIONS: string;
  readonly VITE_APPWRITE_COLLECTION_USER_PROFILES: string;
  readonly VITE_APPWRITE_COLLECTION_FEEDBACK: string;
  readonly VITE_APPWRITE_COLLECTION_TRENDING: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
