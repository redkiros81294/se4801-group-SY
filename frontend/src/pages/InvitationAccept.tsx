import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormValidation } from '../hooks/useFormValidation';
import { clsx } from 'clsx';
import api from '../lib/api';

interface InvitationDetails {
  id: string;
  email: string;
  role: string;
  orgName: string;
  expiresAt: string;
}

export const InvitationAccept = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form validation rules
  const validationRules = {
    password: [
      { validate: (value: string) => value.length >= 8, message: 'Password must be at least 8 characters' },
      { validate: (value: string) => /[A-Z]/.test(value), message: 'Password must contain at least one uppercase letter' },
      { validate: (value: string) => /[a-z]/.test(value), message: 'Password must contain at least one lowercase letter' },
      { validate: (value: string) => /\d/.test(value), message: 'Password must contain at least one digit' },
      { validate: (value: string) => /[!@#$%^&*(),.?":{}|<>]/.test(value), message: 'Password must contain at least one special character' }
    ],
    confirmPassword: [
      { validate: (value: string) => value.length >= 8, message: 'Please confirm your password' }
    ]
  };

  const {
    values,
    errors,
    handleChange,
    handleBlur,
    setFieldError,
    validateField,
    validateForm
  } = useFormValidation({
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) {
        setError('No invitation token provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/auth/invitations/${token}`);
        setInvitation(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Invalid or expired invitation');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Custom validation for password match
    if (values.password !== values.confirmPassword) {
      setFieldError('confirmPassword', 'Passwords do not match');
      return;
    }

    const isValid = validateForm(validationRules);
    if (!isValid) return;

    setSubmitting(true);
    try {
      await api.post('/auth/invitations/accept', {
        token: token,
        password: values.password
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/login', {
          replace: true,
          state: { message: 'Account created successfully! Awaiting admin approval before you can log in.' }
        });
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen bg-[var(--bg0)] overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="animate-grid-bg"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="text-center">
            <div className="h-8 w-8 border-2 border-[var(--cyan)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[var(--t2)]">Loading invitation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="relative min-h-screen bg-[var(--bg0)] overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="animate-grid-bg"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="bg-[var(--bg1)]/80 backdrop-blur-sm p-8 rounded-xl shadow-xl w-full max-w-md border border-[var(--border)]/40 text-center">
            <i className="ti ti-alert-circle text-[var(--red)] text-5xl mb-4" aria-hidden="true" />
            <h1 className="text-2xl font-bold mb-4 text-[var(--t1)]">Invalid Invitation</h1>
            <p className="text-[var(--t2)] mb-6">{error}</p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="px-6 py-3 rounded-lg bg-[var(--blue)] text-[var(--t1)] font-medium hover:bg-[var(--blue)]/90 transition-colors duration-200"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="relative min-h-screen bg-[var(--bg0)] overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="animate-grid-bg"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="bg-[var(--bg1)]/80 backdrop-blur-sm p-8 rounded-xl shadow-xl w-full max-w-md border border-[var(--border)]/40 text-center">
            <i className="ti ti-check-circle text-[var(--green)] text-5xl mb-4" aria-hidden="true" />
            <h1 className="text-2xl font-bold mb-4 text-[var(--t1)]">Invitation Accepted!</h1>
            <p className="text-[var(--t2)] mb-6">Your account has been created. Awaiting admin approval before you can log in.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[var(--bg0)] overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="animate-grid-bg"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="bg-[var(--bg1)]/80 backdrop-blur-sm p-8 rounded-xl shadow-xl w-full max-w-md border border-[var(--border)]/40">
          <h1 className="text-2xl font-bold mb-6 text-center text-[var(--t1)]">
            Accept Invitation
          </h1>

          {invitation && (
            <div className="mb-6 p-4 bg-[var(--bg2)]/50 rounded-lg border border-[var(--border)]/20">
              <h3 className="text-[var(--t1)] font-semibold mb-3">Invitation Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--t3)]">Email:</span>
                  <span className="text-[var(--t1)] font-mono">{invitation.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--t3)]">Role:</span>
                  <span className="text-[var(--t1)]">{invitation.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--t3)]">Organization:</span>
                  <span className="text-[var(--t1)]">{invitation.orgName}</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-[var(--red)] mb-4 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--t2)]">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={values.password}
                onChange={handleChange}
                onBlur={(e) => {
                  handleBlur(e);
                  validateField('password', validationRules.password);
                }}
                className={clsx(
                  'w-full px-4 py-3 border rounded-lg text-[#F1F5F9]',
                  'bg-[#111827] border-[#1E3A5F]',
                  'placeholder:text-[#475569]',
                  'focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/50',
                  'transition-all duration-200',
                  errors.password ? 'border-[#EF4444]/50' : 'border-[#1E3A5F]'
                )}
                required
                placeholder="Create a strong password"
              />
              {errors.password && (
                <p className="text-[var(--red)] text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--t2)]">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={values.confirmPassword}
                onChange={handleChange}
                onBlur={(e) => {
                  handleBlur(e);
                  validateField('confirmPassword', validationRules.confirmPassword);
                }}
                className={clsx(
                  'w-full px-4 py-3 border rounded-lg text-[#F1F5F9]',
                  'bg-[#111827] border-[#1E3A5F]',
                  'placeholder:text-[#475569]',
                  'focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/50',
                  'transition-all duration-200',
                  errors.confirmPassword ? 'border-[#EF4444]/50' : 'border-[#1E3A5F]'
                )}
                required
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="text-[var(--red)] text-sm mt-1">{errors.confirmPassword}</p>
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
                'Accept Invitation'
              )}
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => navigate('/login', { replace: true })}
                className="text-[var(--cyan)] hover:text-[var(--t1)] text-sm transition-colors"
              >
                Already have an account? Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
