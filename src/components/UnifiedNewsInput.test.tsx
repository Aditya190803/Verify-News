import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import UnifiedNewsInput from './UnifiedNewsInput';

const mockHandleUnifiedInput = vi.fn();
let mockStatus = 'idle';

vi.mock('@/context/NewsContext', () => ({
  useNews: () => ({
    handleUnifiedInput: mockHandleUnifiedInput,
    status: mockStatus,
  }),
}));

const renderComponent = () =>
  render(
    <BrowserRouter>
      <UnifiedNewsInput />
    </BrowserRouter>,
  );

describe('UnifiedNewsInput Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStatus = 'idle';
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
    it('shows error or disables when submitting empty input', async () => {
      const user = userEvent.setup();
      renderComponent();
      const submitButton = screen.getByRole('button', { name: /verify/i });
      await user.click(submitButton);
      await waitFor(() => {
        const errorMessage = screen.queryByText(/enter something/i);
        if (!errorMessage) expect(submitButton).toBeDisabled();
        else expect(errorMessage).toBeInTheDocument();
      });
    });

    it('calls handleUnifiedInput on valid submission', async () => {
      const user = userEvent.setup();
      mockHandleUnifiedInput.mockResolvedValue(undefined);
      renderComponent();
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Some news to verify');
      await user.click(screen.getByRole('button', { name: /verify/i }));
      await waitFor(() => {
        expect(mockHandleUnifiedInput).toHaveBeenCalledWith('Some news to verify');
      });
    });

    it('disables button while processing', () => {
      mockStatus = 'verifying';
      renderComponent();
      expect(screen.getByRole('button', { name: /checking/i })).toBeDisabled();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('submits on Ctrl+Enter', async () => {
      const user = userEvent.setup();
      mockHandleUnifiedInput.mockResolvedValue(undefined);
      renderComponent();
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Test content');
      fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
      await waitFor(() => expect(mockHandleUnifiedInput).toHaveBeenCalled());
    });
  });

  describe('Error Handling', () => {
    it('displays error when handleUnifiedInput fails', async () => {
      const user = userEvent.setup();
      mockHandleUnifiedInput.mockRejectedValue(new Error('API Error'));
      renderComponent();
      await user.type(screen.getByRole('textbox'), 'Test content');
      await user.click(screen.getByRole('button', { name: /verify/i }));
      await waitFor(() => expect(screen.getByText(/server error/i)).toBeInTheDocument());
    });
  });
});