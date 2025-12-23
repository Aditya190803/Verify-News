import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  saveSearchToHistory, 
  saveVerificationToHistory, 
  getUserSearchHistory,
  deleteSearchHistoryItem,
  clearUserSearchHistory
} from './historyService';
import { databases } from './base';
import type { VerificationResult } from '@/types/news';

// Mock the base module
vi.mock('./base', () => ({
  databases: {
    listDocuments: vi.fn(),
    createDocument: vi.fn(),
    updateDocument: vi.fn(),
    deleteDocument: vi.fn(),
    getDocument: vi.fn(),
  },
  DATABASE_ID: 'test-db',
  COLLECTIONS: {
    SEARCH_HISTORY: 'history-col',
  },
  isAppwriteConfigured: vi.fn(() => true),
  retryOperation: vi.fn((fn) => fn()),
  removeUndefined: vi.fn((obj) => obj),
}));

describe('historyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveSearchToHistory', () => {
    it('should create a search history entry', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(databases.createDocument).mockResolvedValue({ $id: 'new-id' } as any);

      await saveSearchToHistory(
        'user123',
        'test query',
        { title: 'Article', url: 'http://test.com', snippet: '...' },
        'test-slug',
        'Test Title'
      );

      expect(databases.createDocument).toHaveBeenCalledWith(
        'test-db',
        'history-col',
        expect.any(String),
        expect.objectContaining({
          userId: 'user123',
          query: 'test query',
          resultType: 'search'
        })
      );
    });
  });

  describe('saveVerificationToHistory', () => {
    it('should create a verification history entry', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(databases.createDocument).mockResolvedValue({ $id: 'new-id' } as any);

      await saveVerificationToHistory(
        'user123',
        'test query',
        { veracity: 'true', confidence: 95, explanation: '...', sources: [] } as VerificationResult,
        null,
        'test-slug',
        'Test Title'
      );

      expect(databases.createDocument).toHaveBeenCalledWith(
        'test-db',
        'history-col',
        expect.any(String),
        expect.objectContaining({
          userId: 'user123',
          resultType: 'verification',
          veracity: 'true'
        })
      );
    });
  });

  describe('getUserSearchHistory', () => {
    it('should return empty array if userId is missing', async () => {
      const result = await getUserSearchHistory('');
      expect(result.items).toHaveLength(0);
    });

    it('should return history items for a user', async () => {
      vi.mocked(databases.listDocuments).mockResolvedValue({
        documents: [
          { $id: '1', query: 'q1', timestamp: '2024-01-01', resultType: 'search' }
        ],
        total: 1
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await getUserSearchHistory('user123');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].query).toBe('q1');
    });
  });

  describe('deleteSearchHistoryItem', () => {
    it('should delete a history item', async () => {
      vi.mocked(databases.getDocument).mockResolvedValue({
        $id: 'doc-id',
        userId: 'user123'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(databases.deleteDocument).mockResolvedValue({} as any);

      await deleteSearchHistoryItem('user123', 'doc-id');

      expect(databases.deleteDocument).toHaveBeenCalledWith(
        'test-db',
        'history-col',
        'doc-id'
      );
    });
  });

  describe('clearUserSearchHistory', () => {
    it('should delete all history items for a user', async () => {
      vi.mocked(databases.listDocuments).mockResolvedValue({
        documents: [
          { $id: '1' },
          { $id: '2' }
        ],
        total: 2
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      await clearUserSearchHistory('user123');

      expect(databases.deleteDocument).toHaveBeenCalledTimes(2);
    });
  });
});
