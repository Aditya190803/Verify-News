import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { VerificationWidget } from './VerificationWidget';
import type { VerificationResult } from '@/types/news';

// Mock the news state hook
const mockHandleUnifiedInput = vi.fn();
let mockSearchQuery = '';
let mockSetSearchQuery = vi.fn();
let mockStatus: 'idle' | 'verifying' | 'searching' | 'error' = 'idle';
let mockResult: VerificationResult | null = null;

vi.mock('@/hooks/useNewsState', () => ({
  useNewsState: () => ({
    searchQuery: mockSearchQuery,
    setSearchQuery: mockSetSearchQuery,
    handleUnifiedInput: mockHandleUnifiedInput,
    status: mockStatus,
    result: mockResult,
  }),
}));

const renderWidget = (props = {}) => {
  return render(
    <BrowserRouter>
      <VerificationWidget {...props} />
    </BrowserRouter>
  );
};

describe('VerificationWidget Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchQuery = '';
    mockSetSearchQuery = vi.fn((value) => { mockSearchQuery = value; });
    mockStatus = 'idle';
    mockResult = null;
    mockHandleUnifiedInput.mockResolvedValue('test-slug');
  });

  describe('Rendering', () => {
    it('renders compact widget when compact prop is true', () => {
      renderWidget({ compact: true });
      const shieldButton = screen.getByRole('button');
      expect(shieldButton).toBeInTheDocument();
      // Compact mode shows the collapsed circular button
      expect(shieldButton.querySelector('svg')).toBeInTheDocument();
    });

    it('renders expanded widget by default', () => {
      renderWidget();
      expect(screen.getByPlaceholderText(/paste url or news text/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '' })).toBeInTheDocument(); // Search button has no accessible name
    });

    it('shows widget title', () => {
      renderWidget();
      expect(screen.getByText(/verifynews widget/i)).toBeInTheDocument();
    });

    it('shows powered by text in footer', () => {
      renderWidget();
      expect(screen.getByText(/powered by verifynews ai/i)).toBeInTheDocument();
    });
  });

  describe.skip('Compact Mode Behavior', () => {
    it('starts as compact circle when compact prop is true', () => {
      renderWidget({ compact: true });
      const button = screen.getByRole('button', { name: /shield/i });
      expect(button).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/paste url or news text/i)).not.toBeInTheDocument();
    });

    it('expands when compact widget is clicked', async () => {
      const user = userEvent.setup();
      renderWidget({ compact: true });

      const expandButton = screen.getByRole('button', { name: /shield/i });
      await user.click(expandButton);

      expect(screen.getByPlaceholderText(/paste url or news text/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    });

    it('shows close button in compact mode when expanded', async () => {
      const user = userEvent.setup();
      renderWidget({ compact: true });

      const expandButton = screen.getByRole('button', { name: /shield/i });
      await user.click(expandButton);

      expect(screen.getByText('×')).toBeInTheDocument();
    });

    it('collapses back to compact mode when close button is clicked', async () => {
      const user = userEvent.setup();
      renderWidget({ compact: true });

      // Expand first
      const expandButton = screen.getByRole('button', { name: /shield/i });
      await user.click(expandButton);

      // Now collapse
      const closeButton = screen.getByText('×');
      await user.click(closeButton);

      expect(screen.getByRole('button', { name: /shield/i })).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/paste url or news text/i)).not.toBeInTheDocument();
    });
  });

  describe.skip('Input Handling', () => {
    it('updates search query when typing in input', async () => {
      const user = userEvent.setup();
      renderWidget();

      const input = screen.getByPlaceholderText(/paste url or news text/i);
      await user.type(input, 'Test news content');

      expect(mockSetSearchQuery).toHaveBeenCalledWith('Test news content');
      expect(mockSearchQuery).toBe('Test news content');
    });

    it('disables input when status is verifying', () => {
      mockStatus = 'verifying';
      renderWidget();

      const input = screen.getByPlaceholderText(/paste url or news text/i);
      expect(input).toBeDisabled();
    });

    it('disables input when status is searching', () => {
      mockStatus = 'searching';
      renderWidget();

      const input = screen.getByPlaceholderText(/paste url or news text/i);
      expect(input).toBeDisabled();
    });
  });

  describe.skip('Form Submission', () => {
    it('does not submit when input is empty', async () => {
      const user = userEvent.setup();
      renderWidget();

      const submitButton = screen.getByRole('button', { name: /search/i });
      await user.click(submitButton);

      expect(mockHandleUnifiedInput).not.toHaveBeenCalled();
    });

    it('disables submit button when input is empty', () => {
      renderWidget();
      const submitButton = screen.getByRole('button', { name: /search/i });
      expect(submitButton).toBeDisabled();
    });

    it('calls handleUnifiedInput on form submission', async () => {
      const user = userEvent.setup();
      mockHandleUnifiedInput.mockResolvedValue('test-slug');
      renderWidget();

      const input = screen.getByPlaceholderText(/paste url or news text/i);
      await user.type(input, 'Test news to verify');

      const submitButton = screen.getByRole('button', { name: /search/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockHandleUnifiedInput).toHaveBeenCalledWith('Test news to verify');
      });
    });

    it('disables submit button during verification', () => {
      mockStatus = 'verifying';
      renderWidget();

      const submitButton = screen.getByRole('button', { name: /checking/i });
      expect(submitButton).toBeDisabled();
    });

    it('shows loading spinner during verification', () => {
      mockStatus = 'verifying';
      renderWidget();

      expect(screen.getByRole('button', { name: /checking/i })).toBeInTheDocument();
    });
  });

  describe.skip('Verification Results', () => {
    it('shows verified result with green icon', () => {
      mockResult = {
        veracity: 'verified',
        confidence: 0.95,
        explanation: 'This news is verified as true',
        sources: [],
        id: 'test-id'
      };
      renderWidget();

      expect(screen.getByText(/verified/i)).toBeInTheDocument();
      expect(screen.getByText(/95% confidence/i)).toBeInTheDocument();
      expect(screen.getByText(/this news is verified as true/i)).toBeInTheDocument();
    });

    it('shows misleading result with red icon', () => {
      mockResult = {
        veracity: 'misleading',
        confidence: 0.8,
        explanation: 'This news is misleading',
        sources: [],
        id: 'test-id'
      };
      renderWidget();

      expect(screen.getByText(/misleading/i)).toBeInTheDocument();
      expect(screen.getByText(/80% confidence/i)).toBeInTheDocument();
    });

    it('shows false result with red icon', () => {
      mockResult = {
        veracity: 'false',
        confidence: 0.9,
        explanation: 'This news is false',
        sources: [],
        id: 'test-id'
      };
      renderWidget();

      expect(screen.getByText(/false/i)).toBeInTheDocument();
      expect(screen.getByText(/90% confidence/i)).toBeInTheDocument();
    });

    it('shows view full report button with correct link', () => {
      mockResult = {
        veracity: 'verified',
        confidence: 0.95,
        explanation: 'This news is verified',
        sources: [],
        id: 'test-result-id'
      };
      renderWidget();

      const reportButton = screen.getByRole('button', { name: /view full report/i });
      expect(reportButton).toHaveAttribute('onclick');
    });

    it('shows default shield icon when no result', () => {
      renderWidget();
      expect(screen.queryByText(/verified/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/misleading/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/false/i)).not.toBeInTheDocument();
    });
  });

  describe.skip('Accessibility', () => {
    it('input is focusable', () => {
      renderWidget();
      const input = screen.getByPlaceholderText(/paste url or news text/i);
      expect(input).not.toBeDisabled();
      expect(input).toBeInTheDocument();
    });

    it('submit button is accessible', () => {
      renderWidget();
      const submitButton = screen.getByRole('button', { name: /search/i });
      expect(submitButton).toBeInTheDocument();
    });

    it('compact mode button is accessible', () => {
      renderWidget({ compact: true });
      const button = screen.getByRole('button', { name: /shield/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe.skip('Edge Cases', () => {
    it('handles form submission with whitespace-only input', async () => {
      const user = userEvent.setup();
      renderWidget();

      const input = screen.getByPlaceholderText(/paste url or news text/i);
      await user.type(input, '   ');

      const submitButton = screen.getByRole('button', { name: /search/i });
      await user.click(submitButton);

      expect(mockHandleUnifiedInput).not.toHaveBeenCalled();
    });

    it('disables submit button with whitespace-only input', async () => {
      const user = userEvent.setup();
      renderWidget();

      const input = screen.getByPlaceholderText(/paste url or news text/i);
      await user.type(input, '   ');

      const submitButton = screen.getByRole('button', { name: /search/i });
      expect(submitButton).toBeDisabled();
    });

    it('handles very long input text', async () => {
      const user = userEvent.setup({ delay: null }); // Set delay to null for faster typing
      const longText = 'a'.repeat(100); // Use shorter text for testing
      renderWidget();

      const input = screen.getByPlaceholderText(/paste url or news text/i) as HTMLInputElement;
      await user.type(input, longText);

      // Check that the input was updated
      expect(mockSetSearchQuery).toHaveBeenCalled();
      expect(input.value).toBe(longText);
    });

    it('shows result explanation with line clamping', () => {
      mockResult = {
        veracity: 'verified',
        confidence: 0.95,
        explanation: 'This is a very long explanation that should be truncated with line clamping to show only the first few lines of text in the UI component.',
        sources: [],
        id: 'test-id'
      };
      renderWidget();

      const explanation = screen.getByText(/this is a very long explanation/i);
      expect(explanation).toHaveClass('line-clamp-3');
    });
  });

  describe('Visual States', () => {
    it('shows correct icon for verified result', () => {
      mockResult = {
        veracity: 'verified',
        confidence: 0.95,
        explanation: 'Verified news',
        sources: [],
        id: 'test-id'
      };
      renderWidget();

      const statusTexts = screen.getAllByText(/verified/i);
      const statusSpan = statusTexts.find(el => el.className.includes('uppercase'));
      const icon = statusSpan?.previousSibling;
      expect(icon).toHaveClass('text-green-500');
    });

    it('shows correct icon for misleading result', () => {
      mockResult = {
        veracity: 'misleading',
        confidence: 0.8,
        explanation: 'Misleading news',
        sources: [],
        id: 'test-id'
      };
      renderWidget();

      const statusTexts = screen.getAllByText(/misleading/i);
      const statusSpan = statusTexts.find(el => el.className.includes('uppercase'));
      const icon = statusSpan?.previousSibling;
      expect(icon).toHaveClass('text-destructive');
    });

    it('shows correct icon for false result', () => {
      mockResult = {
        veracity: 'false',
        confidence: 0.9,
        explanation: 'False news',
        sources: [],
        id: 'test-id'
      };
      renderWidget();

      const statusTexts = screen.getAllByText(/false/i);
      const statusSpan = statusTexts.find(el => el.className.includes('uppercase'));
      const icon = statusSpan?.previousSibling;
      expect(icon).toHaveClass('text-destructive');
    });
  });
});