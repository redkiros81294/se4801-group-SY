import { useState, useEffect } from 'react';
import { useFormValidation } from '../hooks/useFormValidation';
import { useAuth } from '../contexts/AuthContext';
import { clsx } from 'clsx';
import api from '../lib/api';
import { EmptyState } from '../components/EmptyState';

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
  const [activeTab, setActiveTab] = useState<'create' | 'pending' | 'invitations'>('create');
  const [submitting, setSubmitting] = useState(false);
  const [createSuccess, setCreateSuccess] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
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
    ],
    password: [
      { validate: (value: string) => value.length >= 8, message: 'Password must be at least 8 characters' },
      { validate: (value: string) => /[A-Z]/.test(value), message: 'Password must contain at least one uppercase letter' },
      { validate: (value: string) => /[a-z]/.test(value), message: 'Password must contain at least one lowercase letter' },
      { validate: (value: string) => /\d/.test(value), message: 'Password must contain at least one digit' },
      { validate: (value: string) => /[!@#$%^&*(),.?":{}|<>]/.test(value), message: 'Password must contain at least one special character' }
    ],
    confirmPassword: [
      { validate: (value: string) => value.length >= 8, message: 'Please confirm the password' }
    ]
  };

  const {
    values,
    errors,
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldError,
    validateField,
    validateForm,
    resetForm
  } = useFormValidation({
    email: '',
    role: '',
    orgId: '',
    password: '',
    confirmPassword: ''
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

  const generatePassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnopqrstuvwxyz';
    const digits = '23456789';
    const special = '!@#$%^&*';
    const all = upper + lower + digits + special;
    const pick = (source: string, count: number) =>
      Array.from({ length: count }, () => source[Math.floor(Math.random() * source.length)]).join('');
    const generated = pick(upper, 2) + pick(lower, 4) + pick(digits, 3) + pick(special, 2) + pick(all, 5);
    const shuffled = generated.split('').sort(() => Math.random() - 0.5).join('');
    setFieldValue('password', shuffled);
    setFieldValue('confirmPassword', shuffled);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (values.password !== values.confirmPassword) {
      setFieldError('confirmPassword', 'Passwords do not match');
      return;
    }

    const isValid = validateForm(validationRules);
    if (!isValid) return;

    setSubmitting(true);
    setError('');
    setCreateSuccess('');

    try {
      await api.post('/admin/users', {
        email: values.email,
        role: values.role,
        orgId: values.orgId,
        password: values.password
      });
      setCreateSuccess(`User created for ${values.email}. They can log in immediately.`);
      resetForm({ email: '', role: '', orgId: '', password: '', confirmPassword: '' });
      loadPendingUsers();
      loadInvitations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = validateForm({
      email: validationRules.email,
      role: validationRules.role,
      orgId: validationRules.orgId
    });
    if (!isValid) return;

    setSubmitting(true);
    setError('');
    setInviteSuccess('');

    try {
      await api.post('/auth/invite', {
        email: values.email,
        role: values.role,
        orgId: values.orgId
      });
      setInviteSuccess(`Invitation sent to ${values.email}`);
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

  const inputClass = (hasError: boolean) => clsx(
    'w-full px-4 py-3 border rounded-lg text-[var(--t1)]',
    'bg-[var(--bg2)] border-[var(--border)]',
    'placeholder:text-[var(--t3)]',
    'focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/50',
    'transition-all duration-200',
    hasError ? 'border-[var(--red)]/50' : 'border-[var(--border)]'
  );

  const fieldLabel = 'block text-sm font-medium mb-2 text-[var(--t2)]';

  const renderSelects = (disabled: boolean) => (
    <>
      <div>
        <label htmlFor="role" className={fieldLabel}>Role</label>
        <select
          id="role"
          name="role"
          value={values.role}
          onChange={handleChange}
          onBlur={(e) => {
            handleBlur(e);
            validateField('role', validationRules.role);
          }}
          className={clsx(inputClass(Boolean(errors.role)), 'appearance-none cursor-pointer')}
          required
          disabled={disabled}
        >
          <option value="" className="bg-[var(--bg2)]">Select role</option>
          {ROLE_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.role && <p className="text-[var(--red)] text-sm mt-1">{errors.role}</p>}
      </div>

      <div>
        <label htmlFor="orgId" className={fieldLabel}>Organization</label>
        <select
          id="orgId"
          name="orgId"
          value={values.orgId}
          onChange={handleChange}
          onBlur={(e) => {
            handleBlur(e);
            validateField('orgId', validationRules.orgId);
          }}
          className={clsx(inputClass(Boolean(errors.orgId)), 'appearance-none cursor-pointer')}
          required
          disabled={orgsLoading || disabled}
        >
          <option value="" className="bg-[var(--bg2)]">
            {orgsLoading ? 'Loading...' : 'Select organization'}
          </option>
          {organizations.map(org => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
        {errors.orgId && <p className="text-[var(--red)] text-sm mt-1">{errors.orgId}</p>}
      </div>
    </>
  );

  const renderEmailField = (disabled: boolean) => (
    <div>
      <label htmlFor="email" className={fieldLabel}>Email Address</label>
      <input
        type="email"
        id="email"
        name="email"
        value={values.email}
        onChange={handleChange}
        onBlur={(e) => {
          handleBlur(e);
          validateField('email', validationRules.email);
        }}
        className={inputClass(Boolean(errors.email))}
        required
        placeholder="user@example.com"
        disabled={disabled}
      />
      {errors.email && <p className="text-[var(--red)] text-sm mt-1">{errors.email}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--t1)]">User Management</h1>
          <p className="text-[var(--t2)] text-sm mt-1">Create user accounts and manage invitations</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b border-[var(--border)]/20">
        <button
          onClick={() => setActiveTab('create')}
          className={clsx(
            'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
            activeTab === 'create'
              ? 'bg-[var(--bg2)] text-[var(--cyan)] border-b-2 border-[var(--cyan)]'
              : 'text-[var(--t2)] hover:text-[var(--t1)]'
          )}
        >
          <i className="ti ti-user-plus mr-2" aria-hidden="true" />
          Create User
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
          Pending Approvals ({pendingUsers.length})
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

      {/* Create User Tab */}
      {activeTab === 'create' && (
        <div className="bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 p-6">
          <h2 className="text-lg font-bold text-[var(--t1)] mb-1">Create User Account</h2>
          <p className="text-[var(--t2)] text-sm mb-4">
            The account is activated immediately -- the user can log in with the temporary password right away. No email or approval needed.
          </p>

          {createSuccess && (
            <div className="mb-4 p-4 bg-[var(--green)]/10 border border-[var(--green)]/20 rounded-lg">
              <p className="text-[var(--green)]">{createSuccess}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-[var(--red)]/10 border border-[var(--red)]/20 rounded-lg">
              <p className="text-[var(--red)]">{error}</p>
            </div>
          )}

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            {renderEmailField(submitting)}

            {renderSelects(submitting)}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className={fieldLabel}>Temporary Password</label>
                <input
                  type="text"
                  id="password"
                  name="password"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={(e) => {
                    handleBlur(e);
                    validateField('password', validationRules.password);
                  }}
                  className={inputClass(Boolean(errors.password))}
                  required
                  placeholder="Create a strong password"
                  disabled={submitting}
                  autoComplete="new-password"
                />
                {errors.password && <p className="text-[var(--red)] text-sm mt-1">{errors.password}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className={fieldLabel}>Confirm Password</label>
                <input
                  type="text"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={values.confirmPassword}
                  onChange={handleChange}
                  onBlur={(e) => {
                    handleBlur(e);
                    validateField('confirmPassword', validationRules.confirmPassword);
                  }}
                  className={inputClass(Boolean(errors.confirmPassword))}
                  required
                  placeholder="Repeat the password"
                  disabled={submitting}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && <p className="text-[var(--red)] text-sm mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={generatePassword}
                disabled={submitting}
                className="flex h-12 items-center justify-center bg-[var(--bg2)] text-[var(--t1)] font-medium px-6 rounded-lg hover:bg-[var(--bg2)]/80 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/30 disabled:opacity-50 disabled:cursor-not-allowed border border-[var(--border)]/30"
              >
                <i className="ti ti-dice-5 mr-2" aria-hidden="true" />
                Generate Password
              </button>

              <button
                type="submit"
                disabled={Object.keys(errors).length > 0 || submitting}
                className="flex-1 flex h-12 items-center justify-center bg-[var(--blue)] text-[var(--t1)] font-medium px-6 rounded-lg hover:bg-[var(--blue)]/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--blue)]/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="h-5 w-5 border-2 border-[var(--t1)] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <i className="ti ti-user-check mr-2" aria-hidden="true" />
                    Create Account
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pending Approvals Tab */}
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
                {pendingUsers.map((pendingUser, index) => (
                  <tr key={pendingUser.id} className={clsx(
                    'border-t border-[var(--border)]/20',
                    index % 2 === 1 ? 'bg-[var(--bg2)]/20' : 'bg-[var(--bg2)]/10'
                  )}>
                    <td className="px-6 py-4 text-[var(--t1)] font-mono text-sm">{pendingUser.email}</td>
                    <td className="px-6 py-4 text-[var(--t1)]">{pendingUser.role}</td>
                    <td className="px-6 py-4 text-[var(--t1)]">{pendingUser.orgName}</td>
                    <td className="px-6 py-4 text-[var(--t2)] text-sm">{new Date(pendingUser.invitedAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleApprove(pendingUser.id)}
                          className="px-3 py-1.5 rounded-lg bg-[var(--green)]/20 text-[var(--green)] text-sm font-medium hover:bg-[var(--green)]/30 transition-colors"
                          title="Approve user"
                        >
                          <i className="ti ti-check" aria-hidden="true" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(pendingUser.id, 'Rejected by admin')}
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
        <div className="space-y-6">
          <div className="bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 p-6">
            <h2 className="text-lg font-bold text-[var(--t1)] mb-4">Send Invitation</h2>
            <p className="text-[var(--t2)] text-sm mb-4">
              Invite a colleague by email. They'll set their own password, then wait for admin approval.
            </p>

            {inviteSuccess && (
              <div className="mb-4 p-4 bg-[var(--green)]/10 border border-[var(--green)]/20 rounded-lg">
                <p className="text-[var(--green)]">{inviteSuccess}</p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 bg-[var(--red)]/10 border border-[var(--red)]/20 rounded-lg">
                <p className="text-[var(--red)]">{error}</p>
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              {renderEmailField(submitting)}
              {renderSelects(submitting)}

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

          <div className="bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 overflow-hidden">
            {invitations.length === 0 ? (
              <EmptyState
                icon="ti ti-mail"
                title="No Sent Invitations"
                message="No invitations have been sent yet"
              />
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
        </div>
      )}
    </div>
  );
};
