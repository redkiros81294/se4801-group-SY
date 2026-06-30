import { useState, useEffect } from 'react';
import { useFormValidation } from '../hooks/useFormValidation';
import { clsx } from 'clsx';
import api from '../lib/api';

interface Organization {
  id: string;
  name: string;
}

interface PendingUser {
  id: string;
  email: string;
  role: string;
  orgName: string;
  invitedAt: string;
  rejectionReason?: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  orgName: string;
  status: string;
  expiresAt: string;
}

export const AdminInviteUsers = () => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [activeTab, setActiveTab] = useState<'invite' | 'pending' | 'invitations'>('invite');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Form validation rules
  const validationRules = {
    email: [
      { validate: (value: string) => value.trim().length > 0, message: 'Email is required' },
      { validate: (value: string) => /\S+@\S+\.\S+/.test(value), message: 'Email is invalid' }
    ],
    role: [
      { validate: (value: string) => value.length > 0, message: 'Role is required' }
    ],
    orgId: [
      { validate: (value: string) => value.length > 0, message: 'Organization is required' }
    ]
  };

  const {
    values,
    errors,
    handleChange,
    handleBlur,
    validateField,
    validateForm,
    resetForm
  } = useFormValidation({
    email: '',
    role: '',
    orgId: ''
  });

  useEffect(() => {
    loadOrganizations();
    loadPendingUsers();
    loadInvitations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setOrgsLoading(true);
      const response = await api.get('/organizations');
      const items: Organization[] = (response.data?.content ?? response.data ?? []).map((org: any) => ({
        id: String(org.id),
        name: String(org.name)
      }));
      setOrganizations(items);
    } catch (err: any) {
      console.error('Failed to load organizations:', err);
    } finally {
      setOrgsLoading(false);
    }
  };

  const loadPendingUsers = async () => {
    try {
      const response = await api.get('/admin/users/pending');
      setPendingUsers(response.data || []);
    } catch (err: any) {
      console.error('Failed to load pending users:', err);
    }
  };

  const loadInvitations = async () => {
    try {
      const response = await api.get('/admin/invitations');
      setInvitations(response.data || []);
    } catch (err: any) {
      console.error('Failed to load invitations:', err);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = validateForm(validationRules);
    if (!isValid) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/auth/invite', {
        email: values.email,
        role: values.role,
        orgId: values.orgId
      });
      setSuccess(`Invitation sent to ${values.email}`);
      resetForm();
      loadPendingUsers();
      loadInvitations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      await api.post(`/admin/users/${userId}/approve`, { adminId: user?.userId || '' });
      loadPendingUsers();
    } catch (err: any) {
      console.error('Failed to approve user:', err);
    }
  };

  const handleReject = async (userId: string, reason: string) => {
    try {
      await api.post(`/admin/users/${userId}/reject`, { adminId: user?.userId || '', rejectionReason: reason });
      loadPendingUsers();
    } catch (err: any) {
      console.error('Failed to reject user:', err);
    }
  };

  const handleRevoke = async (invitationId: string) => {
    try {
      await api.post(`/admin/invitations/${invitationId}/revoke`);
      loadInvitations();
    } catch (err: any) {
      console.error('Failed to revoke invitation:', err);
    }
  };

  const ROLE_OPTIONS = [
    { value: 'ADMIN', label: 'Administrator' },
    { value: 'MANUFACTURER', label: 'Manufacturer' },
    { value: 'SHIPPER', label: 'Shipper' },
    { value: 'RETAILER', label: 'Retailer' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--t1)]">User Invitations</h1>
          <p className="text-[var(--t2)] text-sm mt-1">Manage user invitations and approvals</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b border-[var(--border)]/20">
        <button
          onClick={() => setActiveTab('invite')}
          className={clsx(
            'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
            activeTab === 'invite' 
              ? 'bg-[var(--bg2)] text-[var(--cyan)] border-b-2 border-[var(--cyan)]' 
              : 'text-[var(--t2)] hover:text-[var(--t1)]'
          )}
        >
          <i className="ti ti-user-plus mr-2" aria-hidden="true" />
          Invite User
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={clsx(
            'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
            activeTab === 'pending' 
              ? 'bg-[var(--bg2)] text-[var(--amber)] border-b-2 border-[var(--amber)]' 
              : 'text-[var(--t2)] hover:text-[var(--t1)]'
          )}
        >
          <i className="ti ti-clock mr-2" aria-hidden="true" />
          Pending Users ({pendingUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('invitations')}
          className={clsx(
            'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
            activeTab === 'invitations' 
              ? 'bg-[var(--bg2)] text-[var(--purple)] border-b-2 border-[var(--purple)]' 
              : 'text-[var(--t2)] hover:text-[var(--t1)]'
          )}
        >
          <i className="ti ti-mail mr-2" aria-hidden="true" />
          Sent Invitations ({invitations.length})
        </button>
      </div>

      {/* Invite Form Tab */}
      {activeTab === 'invite' && (
        <div className="bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 p-6">
          <h2 className="text-lg font-bold text-[var(--t1)] mb-4">Invite New User</h2>
          
          {success && (
            <div className="mb-4 p-4 bg-[var(--green)]/10 border border-[var(--green)]/20 rounded-lg">
              <p className="text-[var(--green)]">{success}</p>
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-4 bg-[var(--red)]/10 border border-[var(--red)]/20 rounded-lg">
              <p className="text-[var(--red)]">{error}</p>
            </div>
          )}

          <form onSubmit={handleInviteSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--t2)]">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={values.email}
                onChange={handleChange}
                onBlur={(e) => {
                  handleBlur(e);
                  validateField('email', validationRules.email);
                }}
                className={clsx(
                  'w-full px-4 py-3 border rounded-lg text-[#F1F5F9]',
                  'bg-[#111827] border-[#1E3A5F]',
                  'placeholder:text-[#475569]',
                  'focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/50',
                  'transition-all duration-200',
                  errors.email ? 'border-[#EF4444]/50' : 'border-[#1E3A5F]'
                )}
                required
                placeholder="user@example.com"
                disabled={submitting}
              />
              {errors.email && (
                <p className="text-[var(--red)] text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--t2)]">
                Role
              </label>
              <select
                name="role"
                value={values.role}
                onChange={handleChange}
                onBlur={(e) => {
                  handleBlur(e);
                  validateField('role', validationRules.role);
                }}
                className={clsx(
                  'w-full px-4 py-3 border rounded-lg text-[#F1F5F9] appearance-none',
                  'bg-[#111827] border-[#1E3A5F]',
                  'focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/50',
                  'transition-all duration-200 cursor-pointer',
                  errors.role ? 'border-[#EF4444]/50' : 'border-[#1E3A5F]'
                )}
                required
                disabled={submitting}
              >
                <option value="" className="bg-[#111827]">Select role</option>
                {ROLE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="text-[var(--red)] text-sm mt-1">{errors.role}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--t2)]">
                Organization
              </label>
              <select
                name="orgId"
                value={values.orgId}
                onChange={handleChange}
                onBlur={(e) => {
                  handleBlur(e);
                  validateField('orgId', validationRules.orgId);
                }}
                className={clsx(
                  'w-full px-4 py-3 border rounded-lg text-[#F1F5F9] appearance-none',
                  'bg-[#111827] border-[#1E3A5F]',
                  'focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/50',
                  'transition-all duration-200 cursor-pointer',
                  errors.orgId ? 'border-[#EF4444]/50' : 'border-[#1E3A5F]'
                )}
                required
                disabled={orgsLoading || submitting}
              >
                <option value="" className="bg-[#111827]">
                  {orgsLoading ? 'Loading...' : 'Select organization'}
                </option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
              {errors.orgId && (
                <p className="text-[var(--red)] text-sm mt-1">{errors.orgId}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={Object.keys(errors).length > 0 || submitting}
              className="w-full flex h-12 items-center justify-center bg-[var(--blue)] text-[var(--t1)] font-medium px-6 rounded-lg hover:bg-[var(--blue)]/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--blue)]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="h-5 w-5 border-2 border-[var(--t1)] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <i className="ti ti-send mr-2" aria-hidden="true" />
                  Send Invitation
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Pending Users Tab */}
      {activeTab === 'pending' && (
        <div className="bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 overflow-hidden">
          {pendingUsers.length === 0 ? (
            <div className="text-center py-12">
              <i className="ti ti-check text-[var(--green)] text-4xl mb-4" aria-hidden="true" />
              <h3 className="text-[var(--t1)] font-semibold mb-2">No Pending Users</h3>
              <p className="text-[var(--t2)]">All invited users have been processed</p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[var(--bg2)]/50">
                  <th className="px-6 py-3 text-left text-[var(--t2)] font-medium text-sm">Email</th>
                  <th className="px-6 py-3 text-left text-[var(--t2)] font-medium text-sm">Role</th>
                  <th className="px-6 py-3 text-left text-[var(--t2)] font-medium text-sm">Organization</th>
                  <th className="px-6 py-3 text-left text-[var(--t2)] font-medium text-sm">Invited At</th>
                  <th className="px-6 py-3 text-right text-[var(--t2)] font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((user, index) => (
                  <tr key={user.id} className={clsx(
                    'border-t border-[var(--border)]/20',
                    index % 2 === 1 ? 'bg-[var(--bg2)]/20' : 'bg-[var(--bg2)]/10'
                  )}>
                    <td className="px-6 py-4 text-[var(--t1)] font-mono text-sm">{user.email}</td>
                    <td className="px-6 py-4 text-[var(--t1)]">{user.role}</td>
                    <td className="px-6 py-4 text-[var(--t1)]">{user.orgName}</td>
                    <td className="px-6 py-4 text-[var(--t2)] text-sm">{new Date(user.invitedAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleApprove(user.id)}
                          className="px-3 py-1.5 rounded-lg bg-[var(--green)]/20 text-[var(--green)] text-sm font-medium hover:bg-[var(--green)]/30 transition-colors"
                          title="Approve user"
                        >
                          <i className="ti ti-check" aria-hidden="true" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(user.id, 'Rejected by admin')}
                          className="px-3 py-1.5 rounded-lg bg-[var(--red)]/20 text-[var(--red)] text-sm font-medium hover:bg-[var(--red)]/30 transition-colors"
                          title="Reject user"
                        >
                          <i className="ti ti-x" aria-hidden="true" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Sent Invitations Tab */}
      {activeTab === 'invitations' && (
        <div className="bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 overflow-hidden">
          {invitations.length === 0 ? (
            <div className="text-center py-12">
              <i className="ti ti-mail text-[var(--t3)] text-4xl mb-4" aria-hidden="true" />
              <h3 className="text-[var(--t1)] font-semibold mb-2">No Sent Invitations</h3>
              <p className="text-[var(--t2)]">No invitations have been sent yet</p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[var(--bg2)]/50">
                  <th className="px-6 py-3 text-left text-[var(--t2)] font-medium text-sm">Email</th>
                  <th className="px-6 py-3 text-left text-[var(--t2)] font-medium text-sm">Role</th>
                  <th className="px-6 py-3 text-left text-[var(--t2)] font-medium text-sm">Organization</th>
                  <th className="px-6 py-3 text-left text-[var(--t2)] font-medium text-sm">Status</th>
                  <th className="px-6 py-3 text-left text-[var(--t2)] font-medium text-sm">Expires</th>
                  <th className="px-6 py-3 text-right text-[var(--t2)] font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv, index) => (
                  <tr key={inv.id} className={clsx(
                    'border-t border-[var(--border)]/20',
                    index % 2 === 1 ? 'bg-[var(--bg2)]/20' : 'bg-[var(--bg2)]/10'
                  )}>
                    <td className="px-6 py-4 text-[var(--t1)] font-mono text-sm">{inv.email}</td>
                    <td className="px-6 py-4 text-[var(--t1)]">{inv.role}</td>
                    <td className="px-6 py-4 text-[var(--t1)]">{inv.orgName}</td>
                    <td className="px-6 py-4 text-[var(--t1)]">
                      <span className={clsx(
                        'px-2 py-1 rounded text-xs font-medium',
                        inv.status === 'PENDING' ? 'bg-[var(--amber)]/20 text-[var(--amber)]' :
                        inv.status === 'ACCEPTED' ? 'bg-[var(--green)]/20 text-[var(--green)]' :
                        'bg-[var(--t3)]/20 text-[var(--t3)]'
                      )}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--t2)] text-sm">
                      {new Date(inv.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {inv.status === 'PENDING' && (
                        <button
                          onClick={() => handleRevoke(inv.id)}
                          className="px-3 py-1.5 rounded-lg bg-[var(--red)]/20 text-[var(--red)] text-sm font-medium hover:bg-[var(--red)]/30 transition-colors"
                          title="Revoke invitation"
                        >
                          <i className="ti ti-ban" aria-hidden="true" />
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};