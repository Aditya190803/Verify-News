import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  saveVerificationToCollection, 
  getVerificationBySlug,
  getRecentVerifications,
  incrementViewCount,
  voteOnVerification
} from './verificationService';
import { databases } from './base';

// Mock the base module
vi.mock('./base', () => ({
  databases: {
    listDocuments: vi.fn(),
    createDocument: vi.fn(),
    updateDocument: vi.fn(),
    getDocument: vi.fn(),
  },
  DATABASE_ID: 'test-db',
  COLLECTIONS: {
    VERIFICATIONS: 'verifications-col',
  },
  isAppwriteConfigured: vi.fn(() => true),
  retryOperation: vi.fn((fn) => fn()),
  removeUndefined: vi.fn((obj) => obj),
}));

describe('verificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveVerificationToCollection', () => {
    it('should create a document in the verifications collection', async () => {
      const mockResult = {
        veracity: 'true' as const,
        confidence: 90,
        explanation: 'Test explanation',
        sources: [{ name: 'Source', url: 'http://test.com' }]
      };

      vi.mocked(databases.createDocument).mockResolvedValue({
        $id: 'new-doc-id',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      await saveVerificationToCollection(
        'test query',
        'test content',
        mockResult,
        'user123',
        { title: 'Article', url: 'http://article.com', snippet: '...' },
        'test-slug',
        'Test Title'
      );

      expect(databases.createDocument).toHaveBeenCalledWith(
        'test-db',
        'verifications-col',
        expect.any(String),
        expect.objectContaining({
          query: 'test query',
          content: 'test content',
          veracity: 'true',
          confidence: 90,
          userId: 'user123',
          slug: 'test-slug',
          title: 'Test Title'
        })
      );
    });
  });

  describe('getVerificationBySlug', () => {
    it('should return null if slug is empty', async () => {
      const result = await getVerificationBySlug('');
      expect(result).toBeNull();
    });

    it('should return the document if found', async () => {
      const mockDoc = {
        $id: 'doc-id',
        slug: 'test-slug',
        query: 'test query',
        result: JSON.stringify({ veracity: 'true' })
      };

      vi.mocked(databases.listDocuments).mockResolvedValue({
        documents: [mockDoc],
        total: 1
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await getVerificationBySlug('test-slug');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('doc-id');
      expect(result?.slug).toBe('test-slug');
    });

    it('should return null if no document is found', async () => {
      vi.mocked(databases.listDocuments).mockResolvedValue({
        documents: [],
        total: 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await getVerificationBySlug('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('getRecentVerifications', () => {
    it('should return a list of latest verifications', async () => {
      vi.mocked(databases.listDocuments).mockResolvedValue({
        documents: [
          { $id: '1', slug: 'slug1', result: '{}' },
          { $id: '2', slug: 'slug2', result: '{}' }
        ],
        total: 2
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await getRecentVerifications(10);
      expect(result).toHaveLength(2);
      expect(databases.listDocuments).toHaveBeenCalled();
    });
  });

  describe('incrementViewCount', () => {
    it('should update the view count of a document', async () => {
      await incrementViewCount('doc-id', 10);

      expect(databases.updateDocument).toHaveBeenCalledWith(
        'test-db',
        'verifications-col',
        'doc-id',
        { viewCount: 11 }
      );
    });
  });

  describe('voteOnVerification', () => {
    it('should increment upvotes', async () => {
      vi.mocked(databases.getDocument).mockResolvedValue({
        $id: 'doc-id',
        upvotes: 5
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      await voteOnVerification('doc-id', 'up');

      expect(databases.updateDocument).toHaveBeenCalledWith(
        'test-db',
        'verifications-col',
        'doc-id',
        { upvotes: 6 }
      );
    });

    it('should increment downvotes', async () => {
      vi.mocked(databases.getDocument).mockResolvedValue({
        $id: 'doc-id',
        downvotes: 2
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      await voteOnVerification('doc-id', 'down');

      expect(databases.updateDocument).toHaveBeenCalledWith(
        'test-db',
        'verifications-col',
        'doc-id',
        { downvotes: 3 }
      );
    });
  });
});
