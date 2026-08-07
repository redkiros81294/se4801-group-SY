import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminInviteUsers } from './AdminInviteUsers';
import api from '../lib/api';

vi.mock('../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { userId: 'admin-1' }, login: vi.fn(), logout: vi.fn() })
}));

describe('AdminInviteUsers', () => {
  const mockOrganizations = [
    { id: '1', name: 'Org A' },
    { id: '2', name: 'Org B' }
  ];

  const mockPendingUsers = [
    {
      id: 'user-1',
      email: 'pending@example.com',
      role: 'MANUFACTURER',
      orgName: 'Org A',
      invitedAt: '2026-06-01T12:00:00Z'
    }
  ];

  const mockInvitations = [
    {
      id: 'inv-1',
      email: 'invited@example.com',
      role: 'SHIPPER',
      orgName: 'Org B',
      status: 'PENDING',
      expiresAt: '2026-07-01T12:00:00Z'
    },
    {
      id: 'inv-2',
      email: 'accepted@example.com',
      role: 'RETAILER',
      orgName: 'Org A',
      status: 'ACCEPTED',
      expiresAt: '2026-06-15T12:00:00Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/organizations') return Promise.resolve({ data: { content: mockOrganizations } });
      if (url === '/admin/users/pending') return Promise.resolve({ data: mockPendingUsers });
      if (url === '/admin/invitations') return Promise.resolve({ data: mockInvitations });
      return Promise.resolve({ data: [] });
    });
    (api.post as any).mockResolvedValue({ data: {} });
  });

  describe('tab navigation', () => {
    it('renders all three tabs', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => {
        expect(screen.getByText('Create User')).toBeInTheDocument();
      });
      expect(screen.getByText(/Pending Approvals/)).toBeInTheDocument();
      expect(screen.getByText(/Sent Invitations/)).toBeInTheDocument();
    });

    it('shows the create-user form by default', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Create User Account' })).toBeInTheDocument();
      });
    });

    it('switches to pending approvals tab when clicked', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByText('Create User'));

      fireEvent.click(screen.getByText(/Pending Approvals/));

      expect(screen.getByRole('columnheader', { name: 'Email' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Role' })).toBeInTheDocument();
    });

    it('switches to sent invitations tab when clicked', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByText('Create User'));

      fireEvent.click(screen.getByText(/Sent Invitations/));

      expect(screen.getByText('invited@example.com')).toBeInTheDocument();
    });
  });

  describe('create user form validation', () => {
    it('shows email validation error when email is invalid', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByRole('heading', { name: 'Create User Account' }));

      const emailInput = screen.getByLabelText('Email Address');
      fireEvent.change(emailInput, { target: { name: 'email', value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText('Email is invalid')).toBeInTheDocument();
      });
    });

    it('shows role validation error when role is not selected', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByRole('heading', { name: 'Create User Account' }));

      const roleSelect = screen.getByLabelText('Role');
      fireEvent.focus(roleSelect);
      fireEvent.blur(roleSelect);

      await waitFor(() => {
        expect(screen.getByText('Role is required')).toBeInTheDocument();
      });
    });

    it('shows organization validation error when org is not selected', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByRole('heading', { name: 'Create User Account' }));

      const orgSelect = screen.getByLabelText('Organization');
      fireEvent.focus(orgSelect);
      fireEvent.blur(orgSelect);

      await waitFor(() => {
        expect(screen.getByText('Organization is required')).toBeInTheDocument();
      });
    });

    it('shows password strength error for a weak password', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByRole('heading', { name: 'Create User Account' }));

      const passwordInput = screen.getByLabelText('Temporary Password');
      fireEvent.change(passwordInput, { target: { name: 'password', value: 'short' } });
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      });
    });
  });

  describe('create user submission', () => {
    const fillCreateForm = () => {
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { name: 'email', value: 'newuser@example.com' } });
      fireEvent.change(screen.getByLabelText('Role'), { target: { name: 'role', value: 'MANUFACTURER' } });
      fireEvent.change(screen.getByLabelText('Organization'), { target: { name: 'orgId', value: '1' } });
      fireEvent.change(screen.getByLabelText('Temporary Password'), { target: { name: 'password', value: 'TempPass123!' } });
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { name: 'confirmPassword', value: 'TempPass123!' } });
    };

    it('creates the user via /admin/users with the password', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByRole('heading', { name: 'Create User Account' }));

      fillCreateForm();
      fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/admin/users', {
          email: 'newuser@example.com',
          role: 'MANUFACTURER',
          orgId: '1',
          password: 'TempPass123!'
        });
      });
    });

    it('shows success message after creating a user', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByRole('heading', { name: 'Create User Account' }));

      fillCreateForm();
      fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

      await waitFor(() => {
        expect(screen.getByText(/User created for newuser@example.com/)).toBeInTheDocument();
      });
    });

    it('rejects mismatched passwords', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByRole('heading', { name: 'Create User Account' }));

      fireEvent.change(screen.getByLabelText('Email Address'), { target: { name: 'email', value: 'newuser@example.com' } });
      fireEvent.change(screen.getByLabelText('Role'), { target: { name: 'role', value: 'MANUFACTURER' } });
      fireEvent.change(screen.getByLabelText('Organization'), { target: { name: 'orgId', value: '1' } });
      fireEvent.change(screen.getByLabelText('Temporary Password'), { target: { name: 'password', value: 'TempPass123!' } });
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { name: 'confirmPassword', value: 'Different123!' } });

      fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
      expect(api.post).not.toHaveBeenCalledWith('/admin/users', expect.objectContaining({ email: 'newuser@example.com' }));
    });

    it('shows error message when creation fails', async () => {
      (api.post as any).mockRejectedValue({
        response: { data: { message: 'User already exists with email: newuser@example.com' } }
      });

      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByRole('heading', { name: 'Create User Account' }));

      fillCreateForm();
      fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

      await waitFor(() => {
        expect(screen.getByText('User already exists with email: newuser@example.com')).toBeInTheDocument();
      });
    });

    it('shows loading spinner and disables the button while submitting', async () => {
      (api.post as any).mockImplementation(() => new Promise(() => {}));

      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByRole('heading', { name: 'Create User Account' }));

      fillCreateForm();
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      fireEvent.click(submitButton);

      expect(submitButton).toBeDisabled();
    });

    it('generate password fills both password fields', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByRole('heading', { name: 'Create User Account' }));

      fireEvent.click(screen.getByRole('button', { name: 'Generate Password' }));

      const passwordInput = screen.getByLabelText('Temporary Password') as HTMLInputElement;
      const confirmInput = screen.getByLabelText('Confirm Password') as HTMLInputElement;
      expect(passwordInput.value.length).toBeGreaterThanOrEqual(8);
      expect(confirmInput.value).toBe(passwordInput.value);
    });

    it('loads organizations into dropdown', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => {
        expect(screen.getByText('Org A')).toBeInTheDocument();
      });
    });
  });

  describe('pending approvals tab actions', () => {
    it('displays pending users', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByText('Create User'));

      fireEvent.click(screen.getByText(/Pending Approvals/));

      expect(screen.getByText('pending@example.com')).toBeInTheDocument();
      expect(screen.getByText('MANUFACTURER')).toBeInTheDocument();
      expect(screen.getByText('Org A')).toBeInTheDocument();
    });

    it('approves user when approve button clicked', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByText('Create User'));

      fireEvent.click(screen.getByText(/Pending Approvals/));

      fireEvent.click(screen.getByTitle('Approve user'));

      expect(api.post).toHaveBeenCalledWith('/admin/users/user-1/approve', expect.objectContaining({ adminId: 'admin-1' }));
    });

    it('rejects user when reject button clicked', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByText('Create User'));

      fireEvent.click(screen.getByText(/Pending Approvals/));

      fireEvent.click(screen.getByTitle('Reject user'));

      expect(api.post).toHaveBeenCalledWith('/admin/users/user-1/reject', expect.objectContaining({
        rejectionReason: 'Rejected by admin'
      }));
    });

    it('shows empty state when no pending users', async () => {
      (api.get as any).mockImplementation((url: string) => {
        if (url === '/admin/users/pending') return Promise.resolve({ data: [] });
        return Promise.resolve({ data: [] });
      });

      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByText('Create User'));

      fireEvent.click(screen.getByText(/Pending Approvals/));

      expect(screen.getByText('No Pending Users')).toBeInTheDocument();
      expect(screen.getByText('All invited users have been processed')).toBeInTheDocument();
    });
  });

  describe('invitations tab actions', () => {
    it('displays invitations and the send-invite form', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByText('Create User'));

      fireEvent.click(screen.getByText(/Sent Invitations/));

      expect(screen.getByText('invited@example.com')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Send Invitation' })).toBeInTheDocument();
    });

    it('sends an email invitation via /auth/invite', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByText('Create User'));

      fireEvent.click(screen.getByText(/Sent Invitations/));

      fireEvent.change(screen.getByLabelText('Email Address'), { target: { name: 'email', value: 'invite@example.com' } });
      fireEvent.change(screen.getByLabelText('Role'), { target: { name: 'role', value: 'SHIPPER' } });
      fireEvent.change(screen.getByLabelText('Organization'), { target: { name: 'orgId', value: '2' } });

      fireEvent.click(screen.getByRole('button', { name: 'Send Invitation' }));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/auth/invite', {
          email: 'invite@example.com',
          role: 'SHIPPER',
          orgId: '2'
        });
      });
    });

    it('shows revoke button only for PENDING invitations', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByText('Create User'));

      fireEvent.click(screen.getByText(/Sent Invitations/));

      const revokeButtons = screen.getAllByTitle('Revoke invitation');
      expect(revokeButtons).toHaveLength(1);
    });

    it('revokes invitation when revoke button clicked', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByText('Create User'));

      fireEvent.click(screen.getByText(/Sent Invitations/));

      fireEvent.click(screen.getByTitle('Revoke invitation'));

      expect(api.post).toHaveBeenCalledWith('/admin/invitations/inv-1/revoke');
    });

    it('shows empty state when no invitations', async () => {
      (api.get as any).mockImplementation((url: string) => {
        if (url === '/admin/invitations') return Promise.resolve({ data: [] });
        return Promise.resolve({ data: [] });
      });

      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByText('Create User'));

      fireEvent.click(screen.getByText(/Sent Invitations/));

      expect(screen.getByText('No Sent Invitations')).toBeInTheDocument();
      expect(screen.getByText('No invitations have been sent yet')).toBeInTheDocument();
    });
  });
});
