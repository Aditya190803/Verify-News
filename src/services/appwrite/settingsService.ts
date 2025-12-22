import { databases, DATABASE_ID, COLLECTIONS, isAppwriteConfigured, retryOperation, removeUndefined } from './base';
import { Query, ID } from 'appwrite';
import { logger } from '@/lib/logger';

export interface UserSettings {
  theme: string;
  notifications: boolean;
  emailNotifications: boolean;
  privateProfile: boolean;
  dataCollection: boolean;
  language: string;
  userId: string;
}

export const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  if (!isAppwriteConfigured() || !userId) return null;

  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.USER_SETTINGS,
      [Query.equal('userId', userId), Query.limit(1)]
    );

    if (response.documents.length === 0) {
      return null;
    }

    const doc = response.documents[0];
    return {
      theme: doc.theme,
      notifications: doc.notifications,
      emailNotifications: doc.emailNotifications,
      privateProfile: doc.privateProfile,
      dataCollection: doc.dataCollection,
      language: doc.language,
      userId: doc.userId,
    };
  } catch (error) {
    logger.error('Error fetching user settings:', error);
    return null;
  }
};

export const saveUserSettings = async (userId: string, settings: Partial<UserSettings>): Promise<void> => {
  if (!isAppwriteConfigured() || !userId) return;

  try {
    const existingSettings = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.USER_SETTINGS,
      [Query.equal('userId', userId), Query.limit(1)]
    );

    const data = removeUndefined({
      ...settings,
      userId,
    });

    if (existingSettings.documents.length > 0) {
      await retryOperation(() =>
        databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.USER_SETTINGS,
          existingSettings.documents[0].$id,
          data
        )
      );
    } else {
      await retryOperation(() =>
        databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.USER_SETTINGS,
          ID.unique(),
          data
        )
      );
    }
    logger.info('User settings saved successfully');
  } catch (error) {
    logger.error('Error saving user settings:', error);
    throw error;
  }
};
