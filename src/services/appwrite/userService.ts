import { databases, DATABASE_ID, COLLECTIONS, isAppwriteConfigured, retryOperation, removeUndefined } from './base';
import { Query, ID } from 'appwrite';
import { logger } from '@/lib/logger';
import { StackUser } from '@/services/stackAuthApi';

export interface AppwriteUser {
  id?: string;
  userId: string; // Stack Auth user ID
  email: string;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  signedUpAt: string;
  lastSync: string;
  isAnonymous: boolean;
  metadata?: Record<string, unknown>;
}

// Sync Stack Auth user to Appwrite
// This ensures we have a local copy of user data for analytics and consistency
export const syncUserToAppwrite = async (stackUser: StackUser): Promise<AppwriteUser | null> => {
  if (!isAppwriteConfigured() || !stackUser?.id) {
    logger.warn('syncUserToAppwrite: Not configured or missing user ID');
    return null;
  }

  try {
    const userData: AppwriteUser = {
      userId: stackUser.id,
      email: stackUser.primary_email || '',
      displayName: stackUser.display_name || null,
      photoURL: stackUser.profile_image_url || null,
      emailVerified: stackUser.primary_email_verified || false,
      signedUpAt: new Date(stackUser.signed_up_at_millis).toISOString(),
      lastSync: new Date().toISOString(),
      isAnonymous: stackUser.is_anonymous || false,
      metadata: stackUser.client_metadata || undefined,
    };

    // Check if user already exists
    const existingUsers = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.USERS,
      [Query.equal('userId', stackUser.id), Query.limit(1)]
    );

    let result: AppwriteUser;
    if (existingUsers.documents.length > 0) {
      // Update existing user
      const docId = existingUsers.documents[0].$id;
      const updatedDoc = await retryOperation(() =>
        databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.USERS,
          docId,
          removeUndefined(userData)
        )
      );
      
      result = {
        id: updatedDoc.$id,
        ...userData,
      };
      logger.info('User updated in Appwrite:', { userId: stackUser.id });
    } else {
      // Create new user
      const newDoc = await retryOperation(() =>
        databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.USERS,
          ID.unique(),
          removeUndefined(userData)
        )
      );
      
      result = {
        id: newDoc.$id,
        ...userData,
      };
      logger.info('User created in Appwrite:', { userId: stackUser.id });
    }

    return result;
  } catch (error) {
    logger.error('Error syncing user to Appwrite:', error);
    return null;
  }
};

// Get user from Appwrite by Stack Auth user ID
export const getUserById = async (userId: string): Promise<AppwriteUser | null> => {
  if (!isAppwriteConfigured() || !userId) {
    return null;
  }

  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.USERS,
      [Query.equal('userId', userId), Query.limit(1)]
    );

    if (response.documents.length === 0) {
      return null;
    }

    const doc = response.documents[0];
    return {
      id: doc.$id,
      userId: doc.userId,
      email: doc.email,
      displayName: doc.displayName,
      photoURL: doc.photoURL,
      emailVerified: doc.emailVerified,
      signedUpAt: doc.signedUpAt,
      lastSync: doc.lastSync,
      isAnonymous: doc.isAnonymous,
      metadata: doc.metadata,
    };
  } catch (error) {
    logger.error('Error getting user from Appwrite:', error);
    return null;
  }
};

// Get all users (for admin purposes)
export const getAllUsers = async (limit: number = 100, offset: number = 0): Promise<AppwriteUser[]> => {
  if (!isAppwriteConfigured()) {
    return [];
  }

  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.USERS,
      [Query.limit(limit), Query.offset(offset)]
    );

    return response.documents.map((doc) => ({
      id: doc.$id,
      userId: doc.userId,
      email: doc.email,
      displayName: doc.displayName,
      photoURL: doc.photoURL,
      emailVerified: doc.emailVerified,
      signedUpAt: doc.signedUpAt,
      lastSync: doc.lastSync,
      isAnonymous: doc.isAnonymous,
      metadata: doc.metadata,
    }));
  } catch (error) {
    logger.error('Error getting all users from Appwrite:', error);
    return [];
  }
};

// Update user metadata
export const updateUserMetadata = async (
  userId: string,
  metadata: Record<string, unknown>
): Promise<boolean> => {
  if (!isAppwriteConfigured() || !userId) {
    return false;
  }

  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.USERS,
      [Query.equal('userId', userId), Query.limit(1)]
    );

    if (response.documents.length === 0) {
      logger.warn('User not found in Appwrite for metadata update:', { userId });
      return false;
    }

    const docId = response.documents[0].$id;
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.USERS,
      docId,
      { metadata: removeUndefined(metadata), lastSync: new Date().toISOString() }
    );

    logger.info('User metadata updated in Appwrite:', { userId });
    return true;
  } catch (error) {
    logger.error('Error updating user metadata in Appwrite:', error);
    return false;
  }
};

// Delete user from Appwrite (when user deletes account)
export const deleteUser = async (userId: string): Promise<boolean> => {
  if (!isAppwriteConfigured() || !userId) {
    return false;
  }

  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.USERS,
      [Query.equal('userId', userId), Query.limit(1)]
    );

    if (response.documents.length === 0) {
      logger.warn('User not found in Appwrite for deletion:', { userId });
      return false;
    }

    const docId = response.documents[0].$id;
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.USERS, docId);

    logger.info('User deleted from Appwrite:', { userId });
    return true;
  } catch (error) {
    logger.error('Error deleting user from Appwrite:', error);
    return false;
  }
};