import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import VerificationResult from './VerificationResult';

// Mock the news context
let mockResult: {
  veracity: 'true' | 'false' | 'partially-true' | 'unverified';
  confidence: number;
  explanation: string;
  sources: { name: string; url: string }[];
  mediaAnalysis?: {
    type: 'image' | 'audio' | 'video' | 'text';
    description?: string;
    transcription?: string;
    manipulationIndicators?: string[];
  };
  correctedInfo?: string;
} | null = null;
let mockStatus = 'idle';
let mockNewsContent = '';
let mockSearchQuery = '';
const mockResetState = vi.fn();

vi.mock('@/context/NewsContext', () => ({
  useNews: () => ({
    result: mockResult,
    status: mockStatus,
    resetState: mockResetState,
    newsContent: mockNewsContent,
    searchQuery: mockSearchQuery,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/services/appwriteService', () => ({
  getVerificationBySlug: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/utils/urlExtractor', () => ({
  extractHeadlineFromUrl: vi.fn().mockResolvedValue('Extracted headline'),
  isValidUrl: (url: string) => url.startsWith('http'),
}));

const renderWithBrowserRouter = () => {
  return render(
    <BrowserRouter>
      <VerificationResult />
    </BrowserRouter>
  );
};

describe('VerificationResult Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResult = null;
    mockStatus = 'idle';
    mockNewsContent = '';
    mockSearchQuery = '';
  });

  describe('Rendering', () => {
    it('returns null when status is not verified', () => {
      mockStatus = 'idle';
      renderWithBrowserRouter();
      expect(screen.queryByText(/Verification Complete/i)).not.toBeInTheDocument();
    });

    it('returns null when result is null', () => {
      mockStatus = 'verified';
      mockResult = null;
      renderWithBrowserRouter();
      expect(screen.queryByText(/Verification Complete/i)).not.toBeInTheDocument();
    });

    it('renders verification result when status is verified and result exists', () => {
      mockStatus = 'verified';
      mockResult = {
        veracity: 'true',
        confidence: 95,
        explanation: 'This news is verified as true.',
        sources: [{ name: 'Reuters', url: 'https://reuters.com/article' }],
      };
      mockSearchQuery = 'Test news content';
      renderWithBrowserRouter();
      
      expect(screen.getByText(/Verification Complete/i)).toBeInTheDocument();
    });
  });

  describe('Veracity Display', () => {
    it('shows TRUE status with correct styling', () => {
      mockStatus = 'verified';
      mockResult = {
        veracity: 'true',
        confidence: 90,
        explanation: 'This is verified as true.',
        sources: [],
      };
      mockSearchQuery = 'Test content';
      renderWithBrowserRouter();
      
      expect(screen.getByText('True')).toBeInTheDocument();
      expect(screen.getByText('• 90%')).toBeInTheDocument();
    });

    it('shows FALSE status with correct styling', () => {
      mockStatus = 'verified';
      mockResult = {
        veracity: 'false',
        confidence: 85,
        explanation: 'This is verified as false.',
        sources: [],
      };
      mockSearchQuery = 'Test content';
      renderWithBrowserRouter();
      
      expect(screen.getByText('False')).toBeInTheDocument();
      expect(screen.getByText('• 85%')).toBeInTheDocument();
    });

    it('shows PARTIALLY TRUE status', () => {
      mockStatus = 'verified';
      mockResult = {
        veracity: 'partially-true',
        confidence: 70,
        explanation: 'This is partially true.',
        sources: [],
      };
      mockSearchQuery = 'Test content';
      renderWithBrowserRouter();
      
      expect(screen.getByText('Partially True')).toBeInTheDocument();
    });

    it('shows UNVERIFIED status', () => {
      mockStatus = 'verified';
      mockResult = {
        veracity: 'unverified',
        confidence: 0,
        explanation: 'Unable to verify.',
        sources: [],
      };
      mockSearchQuery = 'Test content';
      renderWithBrowserRouter();
      
      expect(screen.getByText('Unverified')).toBeInTheDocument();
    });
  });

  describe('Content Display', () => {
    it('displays the explanation', () => {
      mockStatus = 'verified';
      mockResult = {
        veracity: 'true',
        confidence: 90,
        explanation: 'This is a detailed explanation of the verification.',
        sources: [],
      };
      mockSearchQuery = 'Test content';
      renderWithBrowserRouter();
      
      expect(screen.getByText('This is a detailed explanation of the verification.')).toBeInTheDocument();
    });

    it('displays sources with links', () => {
      mockStatus = 'verified';
      mockResult = {
        veracity: 'true',
        confidence: 90,
        explanation: 'Verified.',
        sources: [
          { name: 'Reuters', url: 'https://reuters.com/article1' },
          { name: 'AP News', url: 'https://apnews.com/article2' },
        ],
      };
      mockSearchQuery = 'Test content';
      renderWithBrowserRouter();
      
      expect(screen.getByText('Reuters')).toBeInTheDocument();
      expect(screen.getByText('AP News')).toBeInTheDocument();
    });

    it('shows no sources message when sources array is empty', () => {
      mockStatus = 'verified';
      mockResult = {
        veracity: 'true',
        confidence: 90,
        explanation: 'Verified.',
        sources: [],
      };
      mockSearchQuery = 'Test content';
      renderWithBrowserRouter();
      
      expect(screen.getByText(/No sources available/i)).toBeInTheDocument();
    });

    it('displays corrected info when available', () => {
      mockStatus = 'verified';
      mockResult = {
        veracity: 'false',
        confidence: 95,
        explanation: 'This is false.',
        sources: [],
        correctedInfo: 'The correct information is XYZ.',
      };
      mockSearchQuery = 'Test content';
      renderWithBrowserRouter();
      
      expect(screen.getByText('The correct information is XYZ.')).toBeInTheDocument();
    });
  });

  describe('Media Analysis', () => {
    it('displays image analysis', () => {
      mockStatus = 'verified';
      mockResult = {
        veracity: 'true',
        confidence: 85,
        explanation: 'Image verified.',
        sources: [],
        mediaAnalysis: {
          type: 'image',
          description: 'This is an image of a cat.',
        },
      };
      mockSearchQuery = 'Test image';
      renderWithBrowserRouter();
      
      expect(screen.getByText('Media Analysis')).toBeInTheDocument();
      expect(screen.getByText('This is an image of a cat.')).toBeInTheDocument();
    });

    it('displays audio transcription', () => {
      mockStatus = 'verified';
      mockResult = {
        veracity: 'true',
        confidence: 80,
        explanation: 'Audio verified.',
        sources: [],
        mediaAnalysis: {
          type: 'audio',
          transcription: 'This is the audio transcription.',
        },
      };
      mockSearchQuery = 'Test audio';
      renderWithBrowserRouter();
      
      expect(screen.getByText('This is the audio transcription.')).toBeInTheDocument();
    });

    it('displays manipulation indicators', () => {
      mockStatus = 'verified';
      mockResult = {
        veracity: 'false',
        confidence: 90,
        explanation: 'Image manipulated.',
        sources: [],
        mediaAnalysis: {
          type: 'image',
          manipulationIndicators: ['Clone stamps detected', 'Inconsistent lighting'],
        },
      };
      mockSearchQuery = 'Test image';
      renderWithBrowserRouter();
      
      expect(screen.getByText('Clone stamps detected')).toBeInTheDocument();
      expect(screen.getByText('Inconsistent lighting')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('renders Verify Another button', () => {
      mockStatus = 'verified';
      mockResult = {
        veracity: 'true',
        confidence: 90,
        explanation: 'Verified.',
        sources: [],
      };
      mockSearchQuery = 'Test content';
      renderWithBrowserRouter();
      
      expect(screen.getByRole('button', { name: /verify another/i })).toBeInTheDocument();
    });

    it('renders Share button', () => {
      mockStatus = 'verified';
      mockResult = {
        veracity: 'true',
        confidence: 90,
        explanation: 'Verified.',
        sources: [],
      };
      mockSearchQuery = 'Test content';
      renderWithBrowserRouter();
      
      expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
    });

    it('calls resetState when Verify Another is clicked', async () => {
      mockStatus = 'verified';
      mockResult = {
        veracity: 'true',
        confidence: 90,
        explanation: 'Verified.',
        sources: [],
      };
      mockSearchQuery = 'Test content';
      const user = userEvent.setup();
      renderWithBrowserRouter();
      
      const button = screen.getByRole('button', { name: /verify another/i });
      await user.click(button);
      
      expect(mockResetState).toHaveBeenCalled();
    });
  });

  describe('URL Handling', () => {
    it('shows source link for URL content', () => {
      mockStatus = 'verified';
      mockResult = {
        veracity: 'true',
        confidence: 90,
        explanation: 'Verified.',
        sources: [],
      };
      mockSearchQuery = 'https://example.com/article';
      renderWithBrowserRouter();
      
      expect(screen.getByText(/view source/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      mockStatus = 'verified';
      mockResult = {
        veracity: 'true',
        confidence: 90,
        explanation: 'Verified.',
        sources: [],
      };
      mockSearchQuery = 'Test content';
      renderWithBrowserRouter();
      
      expect(screen.getByRole('heading', { name: /verification complete/i })).toBeInTheDocument();
    });

    it('source links open in new tab', () => {
      mockStatus = 'verified';
      mockResult = {
        veracity: 'true',
        confidence: 90,
        explanation: 'Verified.',
        sources: [{ name: 'Reuters', url: 'https://reuters.com' }],
      };
      mockSearchQuery = 'Test content';
      renderWithBrowserRouter();
      
      const sourceLink = screen.getByText('Reuters').closest('a');
      expect(sourceLink).toHaveAttribute('target', '_blank');
      expect(sourceLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});
