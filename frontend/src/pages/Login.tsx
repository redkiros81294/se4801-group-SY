import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFormValidation } from '../hooks/useFormValidation';
import { clsx } from 'clsx';
import api, { getCurrentBaseURL } from '../lib/api';

// The OAuth2 authorization endpoint lives at the server root (not under /api).
const getSsoBaseUrl = () => getCurrentBaseURL().replace(/\/api\/?$/, '');

export const Login = () => {
  const [error, setError] = useState('');
  const [ssoEnabled, setSsoEnabled] = useState(false);
  const [ssoRegistrationId, setSsoRegistrationId] = useState('chaintrack');
  const [ssoMessage, setSsoMessage] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for status query param (pending/deactivated)
  const searchParams = new URLSearchParams(location.search);
  const statusParam = searchParams.get('status');
  const ssoParam = searchParams.get('sso');
  const tokenParam = searchParams.get('token');

  // If SSO completed, the backend redirected here with our JWT — log straight in.
  useEffect(() => {
    if (tokenParam) {
      login(tokenParam);
      navigate('/dashboard', { replace: true });
    }
  }, [tokenParam, login, navigate]);

  // Map SSO error codes to friendly messages
  useEffect(() => {
    if (ssoParam === 'not_provisioned') {
      setSsoMessage('Your SSO account is not linked to a ChainTrack account yet. Contact your administrator.');
    } else if (ssoParam === 'pending') {
      setSsoMessage('Your account is not active yet. Please contact your administrator.');
    } else if (ssoParam === 'missing_email') {
      setSsoMessage('Your SSO provider did not provide an email address.');
    }
  }, [ssoParam]);

  // Advertise the SSO button only when the backend reports it's configured
  useEffect(() => {
    api.get('/auth/sso/config')
      .then((res) => {
        setSsoEnabled(Boolean(res.data?.enabled));
        if (res.data?.registrationId) setSsoRegistrationId(res.data.registrationId);
      })
      .catch(() => {
        // SSO config is optional — ignore failures
      });
  }, []);

  // Check for message in state (from invitation acceptance)
  const message = (location.state as { message?: string } | null)?.message;

  // Form validation rules
  const validationRules = {
    email: [
      { validate: (value: string) => value.trim().length > 0, message: 'Email is required' },
      { validate: (value: string) => /\S+@\S+\.\S+/.test(value), message: 'Email is invalid' }
    ],
    password: [
      { validate: (value: string) => value.length >= 8, message: 'Password must be at least 8 characters' }
    ]
  };

  const {
    values,
    errors,
    handleChange,
    handleBlur,
    validateField,
    validateForm
  } = useFormValidation({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = validateForm(validationRules);
    if (!isValid) return;

    try {
      const response = await api.post('/auth/login', { username: values.email, password: values.password });
      login(response.data.token);
    } catch (err: any) {
      const status = err.response?.status;
      const responseMessage = err.response?.data?.message || '';
      
      if (status === 401) {
        // Check if it's a deactivated account
        if (responseMessage.includes('disabled') || responseMessage.includes('not active')) {
          setError('Your account is pending admin approval. Please contact your administrator.');
        } else {
          setError('Invalid email or password');
        }
      } else {
        setError(responseMessage || 'Login failed');
      }
    }
  };

  // Navigate when user is authenticated (redirect from login page)
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="relative min-h-screen bg-[var(--bg0)] overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 -z-10">
        <div className="animate-grid-bg"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <form onSubmit={handleSubmit} className="bg-[var(--bg1)]/80 backdrop-blur-sm p-8 rounded-xl shadow-xl w-full max-w-md border border-[var(--border)]/40">
          <h1 className="text-2xl font-bold mb-6 text-center text-[var(--t1)]">
            ChainTrack Login
          </h1>

          {/* Pending approval banner */}
          {statusParam === 'pending' && (
            <div className="mb-4 p-4 bg-[var(--amber)]/10 border border-[var(--amber)]/20 rounded-lg">
              <div className="flex items-start space-x-3">
                <i className="ti ti-clock text-[var(--amber)] text-xl mt-0.5" aria-hidden="true" />
                <div>
                  <h3 className="text-[var(--amber)] font-semibold text-sm">Pending Approval</h3>
                  <p className="text-[var(--t2)] text-sm mt-1">
                    Your account is awaiting admin approval. You will be notified once your account is activated.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SSO error banner */}
          {ssoMessage && (
            <div className="mb-4 p-4 bg-[var(--amber)]/10 border border-[var(--amber)]/20 rounded-lg">
              <p className="text-[var(--amber)] text-sm">{ssoMessage}</p>
            </div>
          )}

          {/* Success message from invitation acceptance */}
          {message && (
            <div className="mb-4 p-4 bg-[var(--green)]/10 border border-[var(--green)]/20 rounded-lg">
              <p className="text-[var(--green)] text-sm">{message}</p>
            </div>
          )}

          {/* Error message */}
          {error && statusParam !== 'pending' && (
            <div className="text-[var(--red)] mb-4">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-[var(--t2)]">
              Email
            </label>
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
              className={clsx(
                'w-full px-4 py-3 border rounded-lg text-[var(--t1)]',
                'bg-[var(--bg2)] border-[var(--border)]',
                'placeholder:text-[var(--t3)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/50',
                'transition-all duration-200',
                errors.email ? 'border-[var(--red)]/50' : 'border-[var(--border)]'
              )}
              required
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="text-[var(--red)] text-sm mt-1">
                {errors.email}
              </p>
            )}
          </div>

          <div className="mb-6">
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
                'w-full px-4 py-3 border rounded-lg text-[var(--t1)]',
                'bg-[var(--bg2)] border-[var(--border)]',
                'placeholder:text-[var(--t3)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/50',
                'transition-all duration-200',
                errors.password ? 'border-[var(--red)]/50' : 'border-[var(--border)]'
              )}
              required
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="text-[var(--red)] text-sm mt-1">
                {errors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={Object.keys(errors).length > 0}
            className="w-full flex h-12 items-center justify-center bg-[var(--blue)] text-[var(--t1)] font-medium px-6 rounded-lg hover:bg-[var(--blue)]/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--blue)]/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Login
          </button>

          {ssoEnabled && (
            <>
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-[var(--border)]" />
                <span className="text-xs text-[var(--t3)] uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-[var(--border)]" />
              </div>

              <a
                href={`${getSsoBaseUrl()}/oauth2/authorization/${ssoRegistrationId}`}
                className="w-full flex h-12 items-center justify-center border border-[var(--border)] text-[var(--t1)] font-medium px-6 rounded-lg hover:border-[var(--cyan)]/40 hover:bg-[var(--cyan)]/5 transition-all duration-200"
              >
                <i className="ti ti-fingerprint mr-2 text-[var(--cyan)]" aria-hidden="true" />
                Sign in with SSO
              </a>
            </>
          )}

          <div className="text-center mt-6">
            <p className="text-[var(--t2)] text-sm">
              Don't have an account? Contact your administrator to create one for you.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
