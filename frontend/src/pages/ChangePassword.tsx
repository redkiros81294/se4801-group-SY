import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFormValidation } from '../hooks/useFormValidation';
import { clsx } from 'clsx';
import api from '../lib/api';

const PASSWORD_RULES = {
  password: [
    { validate: (value: string) => value.length >= 8, message: 'Password must be at least 8 characters' },
    { validate: (value: string) => /[A-Z]/.test(value), message: 'Password must contain at least one uppercase letter' },
    { validate: (value: string) => /[a-z]/.test(value), message: 'Password must contain at least one lowercase letter' },
    { validate: (value: string) => /\d/.test(value), message: 'Password must contain at least one digit' },
    { validate: (value: string) => /[!@#$%^&*(),.?":{}|<>]/.test(value), message: 'Password must contain at least one special character' }
  ],
  confirmPassword: [
    { validate: (value: string) => value.length >= 8, message: 'Please confirm the new password' }
  ]
};

export const ChangePassword = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    values,
    errors,
    handleChange,
    handleBlur,
    setFieldError,
    validateField,
    validateForm,
    resetForm
  } = useFormValidation({
    currentPassword: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (values.password !== values.confirmPassword) {
      setFieldError('confirmPassword', 'Passwords do not match');
      return;
    }

    const isValid = validateForm({
      password: PASSWORD_RULES.password,
      confirmPassword: PASSWORD_RULES.confirmPassword
    });
    if (!isValid) return;

    setSubmitting(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.password
      });
      setSuccess('Password changed successfully');
      resetForm({ currentPassword: '', password: '', confirmPassword: '' });
      // The backend revokes the current session token -- sign out and require a fresh login.
      setTimeout(() => {
        logout();
        navigate('/login', { state: { message: 'Password changed -- please sign in with your new password.' } });
      }, 1200);
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.message || '';
      if (status === 400 && (message.includes('Current password') || message.includes('current password'))) {
        setError('Your current password is incorrect');
      } else {
        setError(message || 'Failed to change password');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (hasError: boolean) => clsx(
    'w-full px-4 py-3 border rounded-lg text-[var(--t1)]',
    'bg-[var(--bg2)] border-[var(--border)]',
    'placeholder:text-[var(--t3)]',
    'focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/50',
    'transition-all duration-200',
    hasError ? 'border-[var(--red)]/50' : 'border-[var(--border)]'
  );

  const fieldLabel = 'block text-sm font-medium mb-2 text-[var(--t2)]';

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--t1)]">Change Password</h1>
          <p className="text-[var(--t2)] text-sm mt-1">
            Signed in as <span className="text-[var(--cyan)]">{user?.email}</span> -- you'll be asked to sign in again after changing it.
          </p>
        </div>

        <div className="bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 p-6 max-w-lg">
        {success && (
          <div className="mb-4 p-4 bg-[var(--green)]/10 border border-[var(--green)]/20 rounded-lg flex items-start gap-3">
            <i className="ti ti-shield-check text-[var(--green)] mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-[var(--green)] font-medium">{success}</p>
              <p className="text-[var(--t2)] text-sm mt-1">Signing you out…</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-[var(--red)]/10 border border-[var(--red)]/20 rounded-lg">
            <p className="text-[var(--red)]">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className={fieldLabel}>Current Password</label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={values.currentPassword}
              onChange={handleChange}
              onBlur={(e) => {
                handleBlur(e);
                validateField('currentPassword', [{ validate: (v: string) => v.length > 0, message: 'Current password is required' }]);
              }}
              className={inputClass(Boolean(errors.currentPassword))}
              required
              placeholder="Enter your current password"
              autoComplete="current-password"
              disabled={submitting}
            />
            {errors.currentPassword && <p className="text-[var(--red)] text-sm mt-1">{errors.currentPassword}</p>}
          </div>

          <div>
            <label htmlFor="password" className={fieldLabel}>New Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={values.password}
              onChange={handleChange}
              onBlur={(e) => {
                handleBlur(e);
                validateField('password', PASSWORD_RULES.password);
              }}
              className={inputClass(Boolean(errors.password))}
              required
              placeholder="Create a strong password"
              autoComplete="new-password"
              disabled={submitting}
            />
            {errors.password && <p className="text-[var(--red)] text-sm mt-1">{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className={fieldLabel}>Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={values.confirmPassword}
              onChange={handleChange}
              onBlur={(e) => {
                handleBlur(e);
                validateField('confirmPassword', PASSWORD_RULES.confirmPassword);
              }}
              className={inputClass(Boolean(errors.confirmPassword))}
              required
              placeholder="Repeat the new password"
              autoComplete="new-password"
              disabled={submitting}
            />
            {errors.confirmPassword && <p className="text-[var(--red)] text-sm mt-1">{errors.confirmPassword}</p>}
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
                <i className="ti ti-key mr-2" aria-hidden="true" />
                Change Password
              </>
            )}
          </button>
        </form>
      </div>
      </div>
    </div>
  );
};
