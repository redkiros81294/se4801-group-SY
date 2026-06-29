import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InvitationAccept } from './InvitationAccept';
import * as router from 'react-router-dom';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
    useParams: vi.fn()
  };
});

vi.mock('../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

vi.mock('../contexts/AuthContext', () => ({
  getToken: vi.fn(() => null),
  clearToken: vi.fn()
}));

import api from '../lib/api';

const mockNavigate = vi.fn();

describe('InvitationAccept', () => {
  const mockInvitation = {
    id: 'inv-123',
    email: 'test@example.com',
    role: 'MANUFACTURER',
    orgName: 'Test Org',
    expiresAt: '2026-12-31T23:59:59Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(router.useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(router.useParams).mockReturnValue({ token: 'valid-token-123' });
    (api.get as any).mockResolvedValue({ data: mockInvitation });
  });

  describe('loading state', () => {
    it('shows loading indicator while fetching invitation', () => {
      (api.get as any).mockImplementation(() => new Promise(() => {}));
      render(<InvitationAccept />);
      expect(screen.getByText('Loading invitation...')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('shows error when no token is provided', async () => {
      vi.mocked(router.useParams).mockReturnValue({ token: undefined });
      render(<InvitationAccept />);
      await waitFor(() => {
        expect(screen.getByText('Invalid Invitation')).toBeInTheDocument();
      });
      expect(screen.getByText('No invitation token provided')).toBeInTheDocument();
    });

    it('shows error when invitation fetch fails', async () => {
      (api.get as any).mockRejectedValue({
        response: { data: { message: 'Invalid or expired invitation' } }
      });
      render(<InvitationAccept />);
      await waitFor(() => {
        expect(screen.getByText('Invalid Invitation')).toBeInTheDocument();
      });
      expect(screen.getByText('Invalid or expired invitation')).toBeInTheDocument();
    });
  });

  describe('invitation details display', () => {
    it('renders invitation details after successful fetch', async () => {
      render(<InvitationAccept />);
      await waitFor(() => {
        expect(screen.getByText('Accept Invitation')).toBeInTheDocument();
      });
      expect(screen.getByText('Invitation Details')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('MANUFACTURER')).toBeInTheDocument();
      expect(screen.getByText('Test Org')).toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('shows password validation errors on blur', async () => {
      render(<InvitationAccept />);
      await screen.findByText('Accept Invitation');

      const passwordInput = screen.getByPlaceholderText('Create a strong password');
      fireEvent.focus(passwordInput);
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      });
    });

    it('validates password complexity requirements', async () => {
      render(<InvitationAccept />);
      await screen.findByText('Accept Invitation');

      const passwordInput = screen.getByLabelText('Password');
      
      fireEvent.change(passwordInput, { target: { name: 'password', value: 'Abc1!' } });
      fireEvent.blur(passwordInput);
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();

      fireEvent.change(passwordInput, { target: { name: 'password', value: 'abcdefgh1!' } });
      fireEvent.blur(passwordInput);
      await waitFor(() => {
        expect(screen.getByText('Password must contain at least one uppercase letter')).toBeInTheDocument();
      });

      fireEvent.change(passwordInput, { target: { name: 'password', value: 'ABCDEFGH1!' } });
      fireEvent.blur(passwordInput);
      await waitFor(() => {
        expect(screen.getByText('Password must contain at least one lowercase letter')).toBeInTheDocument();
      });

      fireEvent.change(passwordInput, { target: { name: 'password', value: 'ABCDEFGH!' } });
      fireEvent.blur(passwordInput);
      await waitFor(() => {
        expect(screen.getByText('Password must contain at least one digit')).toBeInTheDocument();
      });

      fireEvent.change(passwordInput, { target: { name: 'password', value: 'ABCDEFGH1' } });
      fireEvent.blur(passwordInput);
      await waitFor(() => {
        expect(screen.getByText('Password must contain at least one special character')).toBeInTheDocument();
      });
    });

    it('shows password mismatch error when passwords do not match', async () => {
      render(<InvitationAccept />);
      await screen.findByText('Accept Invitation');

      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');

      fireEvent.change(passwordInput, { target: { name: 'password', value: 'ValidPass1!' } });
      fireEvent.change(confirmPasswordInput, { target: { name: 'confirmPassword', value: 'Different1!' } });

      const submitButton = screen.getByRole('button', { name: 'Accept Invitation' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });
  });

  describe('successful submission', () => {
    it('submits form with valid data and redirects to login', async () => {
      (api.post as any).mockResolvedValue({ data: {} });

      render(<InvitationAccept />);
      await screen.findByText('Accept Invitation');

      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');

      fireEvent.change(passwordInput, { target: { name: 'password', value: 'ValidPass1!' } });
      fireEvent.change(confirmPasswordInput, { target: { name: 'confirmPassword', value: 'ValidPass1!' } });

      const submitButton = screen.getByRole('button', { name: 'Accept Invitation' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/auth/invitations/accept', {
          token: 'valid-token-123',
          password: 'ValidPass1!'
        });
      });

      expect(screen.getByText('Invitation Accepted!')).toBeInTheDocument();
    });

    it('shows success message after acceptance', async () => {
      (api.post as any).mockResolvedValue({ data: {} });

      render(<InvitationAccept />);
      await screen.findByText('Accept Invitation');

      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');

      fireEvent.change(passwordInput, { target: { name: 'password', value: 'ValidPass1!' } });
      fireEvent.change(confirmPasswordInput, { target: { name: 'confirmPassword', value: 'ValidPass1!' } });

      const submitButton = screen.getByRole('button', { name: 'Accept Invitation' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invitation Accepted!')).toBeInTheDocument();
      });
      expect(screen.getByText(/Your account has been created/)).toBeInTheDocument();
    });
  });

  describe('error handling during submission', () => {
    it('shows error message when API submission fails', async () => {
      (api.post as any).mockRejectedValue({
        response: { data: { message: 'Token has expired' } }
      });

      render(<InvitationAccept />);
      await screen.findByText('Accept Invitation');

      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');

      fireEvent.change(passwordInput, { target: { name: 'password', value: 'ValidPass1!' } });
      fireEvent.change(confirmPasswordInput, { target: { name: 'confirmPassword', value: 'ValidPass1!' } });

      const submitButton = screen.getByRole('button', { name: 'Accept Invitation' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Token has expired')).toBeInTheDocument();
      });
    });
  });

  describe('navigation', () => {
    it('navigates to login when clicking "Already have an account"', async () => {
      render(<InvitationAccept />);
      await screen.findByText('Accept Invitation');

      const loginLink = screen.getByText('Already have an account? Login');
      fireEvent.click(loginLink);

      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    it('navigates to login when clicking "Go to Login" on error screen', async () => {
      (api.get as any).mockRejectedValue(new Error('Network error'));
      render(<InvitationAccept />);
      await screen.findByText('Invalid Invitation');

      const loginButton = screen.getByText('Go to Login');
      fireEvent.click(loginButton);

      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });
});