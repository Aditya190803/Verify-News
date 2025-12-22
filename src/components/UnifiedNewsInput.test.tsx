import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import UnifiedNewsInput from './UnifiedNewsInput';

// Mock the news context
const mockHandleUnifiedInput = vi.fn();
const mockSetMediaFile = vi.fn();
let mockStatus = 'idle';
let mockMediaFile: { type: string; file: File; mimeType?: string; preview?: string } | null = null;

vi.mock('@/context/NewsContext', () => ({
  useNews: () => ({
    handleUnifiedInput: mockHandleUnifiedInput,
    status: mockStatus,
    mediaFile: mockMediaFile,
    setMediaFile: mockSetMediaFile,
  }),
}));

vi.mock('./MediaUpload', () => ({
  default: ({ onMediaSelect }: { onMediaSelect: (media: { type: string; file: File } | null) => void }) => (
    <div data-testid="media-upload">
      <button onClick={() => onMediaSelect({ type: 'image', file: new File([], 'test.jpg') })}>
        Select Media
      </button>
    </div>
  ),
}));

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <UnifiedNewsInput />
    </BrowserRouter>
  );
};

describe('UnifiedNewsInput Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStatus = 'idle';
    mockMediaFile = null;
  });

  describe('Rendering', () => {
    it('renders the textarea', () => {
      renderComponent();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders the verify button', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument();
    });

    it('renders media button', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: /media/i })).toBeInTheDocument();
    });

    it('shows placeholder text', () => {
      renderComponent();
      expect(screen.getByPlaceholderText(/paste a link/i)).toBeInTheDocument();
    });
  });

  describe('Input Handling', () => {
    it('updates input value when typing', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Test news content');
      
      expect(textarea).toHaveValue('Test news content');
    });

    it('detects URL input and shows indicator', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'https://example.com/article');
      
      expect(screen.getByText(/url detected/i)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('shows error when submitting empty input without media', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Just click submit without entering anything
      const submitButton = screen.getByRole('button', { name: /verify/i });
      await user.click(submitButton);
      
      // The button should be disabled or show an error
      // Since both input and media are empty, submission should fail
      await waitFor(() => {
        const errorMessage = screen.queryByText(/enter something/i);
        // If no error message, button should be disabled
        if (!errorMessage) {
          expect(submitButton).toBeDisabled();
        } else {
          expect(errorMessage).toBeInTheDocument();
        }
      });
    });

    it('calls handleUnifiedInput on valid submission', async () => {
      const user = userEvent.setup();
      mockHandleUnifiedInput.mockResolvedValue('slug123');
      renderComponent();
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Some news to verify');
      
      const submitButton = screen.getByRole('button', { name: /verify/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockHandleUnifiedInput).toHaveBeenCalledWith('Some news to verify', undefined);
      });
    });

    it('disables button while processing', () => {
      mockStatus = 'verifying';
      renderComponent();
      
      const submitButton = screen.getByRole('button', { name: /checking/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Media Upload', () => {
    it('shows media upload when media button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const mediaButton = screen.getByRole('button', { name: /media/i });
      await user.click(mediaButton);
      
      expect(screen.getByTestId('media-upload')).toBeInTheDocument();
    });

    it('shows media indicator when media is attached', () => {
      mockMediaFile = { 
        type: 'image', 
        file: new File([], 'test.jpg'),
        mimeType: 'image/jpeg',
        preview: 'data:image/jpeg;base64,xxx'
      };
      renderComponent();
      
      expect(screen.getByText(/image attached/i)).toBeInTheDocument();
    });

    it('allows submission with only media (no text)', async () => {
      mockMediaFile = { 
        type: 'image', 
        file: new File([], 'test.jpg'),
        mimeType: 'image/jpeg',
      };
      mockHandleUnifiedInput.mockResolvedValue('slug123');
      
      const user = userEvent.setup();
      renderComponent();
      
      const submitButton = screen.getByRole('button', { name: /verify/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockHandleUnifiedInput).toHaveBeenCalledWith('', mockMediaFile);
      });
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('submits on Ctrl+Enter', async () => {
      const user = userEvent.setup();
      mockHandleUnifiedInput.mockResolvedValue('slug123');
      renderComponent();
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Test content');
      
      // Simulate Ctrl+Enter
      fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
      
      await waitFor(() => {
        expect(mockHandleUnifiedInput).toHaveBeenCalled();
      });
    });

    it('submits on Cmd+Enter (Mac)', async () => {
      const user = userEvent.setup();
      mockHandleUnifiedInput.mockResolvedValue('slug123');
      renderComponent();
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Test content');
      
      // Simulate Cmd+Enter
      fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true });
      
      await waitFor(() => {
        expect(mockHandleUnifiedInput).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error when handleUnifiedInput fails', async () => {
      const user = userEvent.setup();
      mockHandleUnifiedInput.mockRejectedValue(new Error('API Error'));
      renderComponent();
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Test content');
      
      const submitButton = screen.getByRole('button', { name: /verify/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/server error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('textarea is focusable', () => {
      renderComponent();
      const textarea = screen.getByRole('textbox');
      expect(textarea).not.toBeDisabled();
    });

    it('shows keyboard shortcut hint', () => {
      renderComponent();
      expect(screen.getByText('Enter')).toBeInTheDocument();
    });
  });
});
