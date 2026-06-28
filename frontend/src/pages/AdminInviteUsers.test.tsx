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
  getToken: vi.fn(() => null),
  clearToken: vi.fn()
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
        expect(screen.getByText('Invite User')).toBeInTheDocument();
      });
      expect(screen.getByText(/Pending Users/)).toBeInTheDocument();
      expect(screen.getByText(/Sent Invitations/)).toBeInTheDocument();
    });

    it('shows invite tab content by default', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Invite New User' })).toBeInTheDocument();
      });
    });

    it('switches to pending users tab when clicked', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByText('Invite User'));

      const pendingTab = screen.getByText(/Pending Users/);
      fireEvent.click(pendingTab);

      expect(screen.getByRole('columnheader', { name: 'Email' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Role' })).toBeInTheDocument();
    });

    it('switches to invitations tab when clicked', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByText('Invite User'));

      const invitationsTab = screen.getByText(/Sent Invitations/);
      fireEvent.click(invitationsTab);

      expect(screen.getByText('invited@example.com')).toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('shows email validation error when email is invalid', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByText('Invite User'));

      const emailInput = screen.getByLabelText('Email Address');
      fireEvent.change(emailInput, { target: { name: 'email', value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText('Email is invalid')).toBeInTheDocument();
      });
    });

    it('shows role validation error when role is not selected', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByText('Invite User'));

      const roleSelect = screen.getByLabelText('Role');
      fireEvent.focus(roleSelect);
      fireEvent.blur(roleSelect);

      await waitFor(() => {
        expect(screen.getByText('Role is required')).toBeInTheDocument();
      });
    });

    it('shows organization validation error when org is not selected', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByText('Invite User'));

      const orgSelect = screen.getByLabelText('Organization');
      fireEvent.focus(orgSelect);
      fireEvent.blur(orgSelect);

      await waitFor(() => {
        expect(screen.getByText('Organization is required')).toBeInTheDocument();
      });
    });
  });

  describe('form submission for inviting users', () => {
    it('submits invite form with valid data', async () => {
      (api.post as any).mockResolvedValue({ data: {} });

      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByText('Invite User'));

      const emailInput = screen.getByLabelText('Email Address');
      const roleSelect = screen.getByLabelText('Role');
      const orgSelect = screen.getByLabelText('Organization');

      fireEvent.change(emailInput, { target: { name: 'email', value: 'newuser@example.com' } });
      fireEvent.change(roleSelect, { target: { name: 'role', value: 'MANUFACTURER' } });
      fireEvent.change(orgSelect, { target: { name: 'orgId', value: '1' } });

      const submitButton = screen.getByRole('button', { name: 'Send Invitation' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/auth/invite', {
          email: 'newuser@example.com',
          role: 'MANUFACTURER',
          orgId: '1'
        });
      });
    });

    it('shows success message after successful invite', async () => {
      (api.post as any).mockResolvedValue({ data: {} });

      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByText('Invite User'));

      const emailInput = screen.getByLabelText('Email Address');
      const roleSelect = screen.getByLabelText('Role');
      const orgSelect = screen.getByLabelText('Organization');

      fireEvent.change(emailInput, { target: { name: 'email', value: 'newuser@example.com' } });
      fireEvent.change(roleSelect, { target: { name: 'role', value: 'MANUFACTURER' } });
      fireEvent.change(orgSelect, { target: { name: 'orgId', value: '1' } });

      const submitButton = screen.getByRole('button', { name: 'Send Invitation' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Invitation sent to newuser@example.com/)).toBeInTheDocument();
      });
    });

    it('shows error message when invite fails', async () => {
      (api.post as any).mockRejectedValue({
        response: { data: { message: 'Email already invited' } }
      });

      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByText('Invite User'));

      const emailInput = screen.getByLabelText('Email Address');
      const roleSelect = screen.getByLabelText('Role');
      const orgSelect = screen.getByLabelText('Organization');

      fireEvent.change(emailInput, { target: { name: 'email', value: 'existing@example.com' } });
      fireEvent.change(roleSelect, { target: { name: 'role', value: 'SHIPPER' } });
      fireEvent.change(orgSelect, { target: { name: 'orgId', value: '2' } });

      const submitButton = screen.getByRole('button', { name: 'Send Invitation' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email already invited')).toBeInTheDocument();
      });
    });

    it('shows loading spinner when submitting', async () => {
      (api.post as any).mockImplementation(() => new Promise(() => {}));

      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByText('Invite User'));

      const emailInput = screen.getByLabelText('Email Address');
      const roleSelect = screen.getByLabelText('Role');
      const orgSelect = screen.getByLabelText('Organization');

      fireEvent.change(emailInput, { target: { name: 'email', value: 'loading@example.com' } });
      fireEvent.change(roleSelect, { target: { name: 'role', value: 'RETAILER' } });
      fireEvent.change(orgSelect, { target: { name: 'orgId', value: '1' } });

      const submitButton = screen.getByRole('button', { name: 'Send Invitation' });
      fireEvent.click(submitButton);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('loads organizations into dropdown', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => {
        expect(screen.getByText('Org A')).toBeInTheDocument();
      });
    });
  });

  describe('pending users tab actions', () => {
    it('displays pending users', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByText('Invite User'));

      const pendingTab = screen.getByText(/Pending Users/);
      fireEvent.click(pendingTab);

      expect(screen.getByText('pending@example.com')).toBeInTheDocument();
      expect(screen.getByText('MANUFACTURER')).toBeInTheDocument();
      expect(screen.getByText('Org A')).toBeInTheDocument();
    });

    it('approves user when approve button clicked', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByText('Invite User'));

      const pendingTab = screen.getByText(/Pending Users/);
      fireEvent.click(pendingTab);

      const approveButton = screen.getByTitle('Approve user');
      fireEvent.click(approveButton);

      expect(api.post).toHaveBeenCalledWith('/admin/users/user-1/approve', expect.objectContaining({ adminId: '' }));
    });

    it('rejects user when reject button clicked', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByText('Invite User'));

      const pendingTab = screen.getByText(/Pending Users/);
      fireEvent.click(pendingTab);

      const rejectButton = screen.getByTitle('Reject user');
      fireEvent.click(rejectButton);

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
      await waitFor(() => screen.getByText('Invite User'));

      const pendingTab = screen.getByText(/Pending Users/);
      fireEvent.click(pendingTab);

      expect(screen.getByText('No Pending Users')).toBeInTheDocument();
      expect(screen.getByText('All invited users have been processed')).toBeInTheDocument();
    });
  });

  describe('invitations tab actions', () => {
    it('displays invitations', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByText('Invite User'));

      const invitationsTab = screen.getByText(/Sent Invitations/);
      fireEvent.click(invitationsTab);

      expect(screen.getByText('invited@example.com')).toBeInTheDocument();
      expect(screen.getByText('SHIPPER')).toBeInTheDocument();
    });

    it('shows revoke button only for PENDING invitations', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByText('Invite User'));

      const invitationsTab = screen.getByText(/Sent Invitations/);
      fireEvent.click(invitationsTab);

      const revokeButtons = screen.getAllByTitle('Revoke invitation');
      expect(revokeButtons).toHaveLength(1);
    });

    it('revokes invitation when revoke button clicked', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByText('Invite User'));

      const invitationsTab = screen.getByText(/Sent Invitations/);
      fireEvent.click(invitationsTab);

      const revokeButton = screen.getByTitle('Revoke invitation');
      fireEvent.click(revokeButton);

      expect(api.post).toHaveBeenCalledWith('/admin/invitations/inv-1/revoke');
    });

    it('shows empty state when no invitations', async () => {
      (api.get as any).mockImplementation((url: string) => {
        if (url === '/admin/invitations') return Promise.resolve({ data: [] });
        return Promise.resolve({ data: [] });
      });

      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByText('Invite User'));

      const invitationsTab = screen.getByText(/Sent Invitations/);
      fireEvent.click(invitationsTab);

      expect(screen.getByText('No Sent Invitations')).toBeInTheDocument();
      expect(screen.getByText('No invitations have been sent yet')).toBeInTheDocument();
    });
  });

  describe('status badges', () => {
    it('shows PENDING status with amber styling', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByText('Invite User'));

      const invitationsTab = screen.getByText(/Sent Invitations/);
      fireEvent.click(invitationsTab);

      expect(screen.getByText('PENDING')).toBeInTheDocument();
    });

    it('shows ACCEPTED status with green styling', async () => {
      render(<AdminInviteUsers />);
      await waitFor(() => screen.getByText('Invite User'));

      const invitationsTab = screen.getByText(/Sent Invitations/);
      fireEvent.click(invitationsTab);

      expect(screen.getByText('ACCEPTED')).toBeInTheDocument();
    });
  });
});