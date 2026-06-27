import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormValidation } from '../hooks/useFormValidation';
import { clsx } from 'clsx';
import api from '../lib/api';

// Role options from enum
const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Administrator' },
  { value: 'MANUFACTURER', label: 'Manufacturer' },
  { value: 'SHIPPER', label: 'Shipper' },
  { value: 'RETAILER', label: 'Retailer' }
];

type OrgOption = { id: string; name: string };

export const Register = () => {
  const navigate = useNavigate();

  const [successMessage, setSuccessMessage] = useState<string>('');
  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const [orgsLoading, setOrgsLoading] = useState<boolean>(true);
  const [orgsError, setOrgsError] = useState<string | null>(null);

  // Form validation rules
  const validationRules = {
    email: [
      { validate: (value: string) => value.trim().length > 0, message: 'Email is required' },
      { validate: (value: string) => /\S+@\S+\.\S+/.test(value), message: 'Email is invalid' }
    ],
    password: [
      { validate: (value: string) => value.length >= 8, message: 'Password must be at least 8 characters' },
      { validate: (value: string) => /[A-Z]/.test(value), message: 'Password must contain at least one uppercase letter' },
      { validate: (value: string) => /[a-z]/.test(value), message: 'Password must contain at least one lowercase letter' },
      { validate: (value: string) => /\d/.test(value), message: 'Password must contain at least one digit' },
      { validate: (value: string) => /[!@#$%^&*(),.?":{}|<>]/.test(value), message: 'Password must contain at least one special character' }
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
    setFieldError,
    validateField,
    validateForm
  } = useFormValidation({
    email: '',
    password: '',
    role: '',
    orgId: ''
  });

  useEffect(() => {
    let cancelled = false;

    const loadOrganizations = async () => {
      try {
        setOrgsLoading(true);
        setOrgsError(null);
        const response = await api.get('/organizations');
        const items: OrgOption[] = (response.data?.content ?? response.data ?? []).map((org: any) => ({
          id: String(org.id),
          name: String(org.name)
        }));
        if (!cancelled && items.length > 0) {
          setOrganizations(items);
          return;
        }
      } catch (err: any) {
        const status = err?.response?.status;
        if (status !== 401 && status !== 403) {
          const message = err.response?.data?.message || 'Failed to load organizations';
          if (!cancelled) setOrgsError(message);
        }
      } finally {
        if (!cancelled) {
          setOrganizations(prev => prev.length > 0 ? prev : [
            { id: 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', name: 'PharmaCorp Manufacturing' },
            { id: 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', name: 'FastTrack Logistics' },
            { id: 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', name: 'RetailPlus Inc.' }
          ]);
          setOrgsLoading(false);
        }
      }
    };

    loadOrganizations();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = validateForm(validationRules);

    if (!isValid) {
      Object.keys(validationRules).forEach(field => {
        validateField(field, validationRules[field as keyof typeof validationRules]);
      });
      return;
    }

    try {
      await api.post('/auth/register', {
        email: values.email,
        password: values.password,
        role: values.role,
        orgId: values.orgId
      });

      setSuccessMessage('Registration successful! Redirecting to login...');

      setTimeout(() => {
        navigate('/login', {
          replace: true,
          state: { message: 'Registration successful! Please login with your new account.' }
        });
      }, 1500);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setFieldError('email', errorMessage);
    }
  };

  return (
    <div className="relative min-h-screen bg-[var(--bg0)] overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="animate-grid-bg"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <form onSubmit={handleSubmit} className="bg-[var(--bg1)]/80 backdrop-blur-sm p-8 rounded-xl shadow-xl w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-[var(--t1)]">
              Create Account
            </h1>
            <p className="text-[var(--t2)]">
              Join the ChainTrack network to track your supply chain provenance
            </p>
          </div>

          {successMessage && (
            <div className="text-[var(--green)] mb-4 text-center font-medium">
              {successMessage}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--t2)]">
              Email Address
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
                'w-full px-4 py-3 border rounded-lg text-[#F1F5F9]',
                'bg-[#111827] border-[#1E3A5F]',
                'placeholder:text-[#475569]',
                'focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/50',
                'transition-all duration-200',
                errors.email ? 'border-[#EF4444]/50' : 'border-[#1E3A5F]'
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
              <p className="text-[var(--red)] text-sm mt-1">
                {errors.password}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--t2)]">
              Role
            </label>
            <select
              id="role"
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
            >
              <option value="" className="bg-[#111827]">Select your role</option>
              {ROLE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.role && (
              <p className="text-[var(--red)] text-sm mt-1">
                {errors.role}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--t2)]">
              Organization
            </label>
            <select
              id="orgId"
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
                'transition-all duration-200 cursor-pointer disabled:cursor-wait',
                errors.orgId ? 'border-[#EF4444]/50' : 'border-[#1E3A5F]'
              )}
              required
              disabled={orgsLoading}
            >
              <option value="" className="bg-[#111827]">
                {orgsLoading ? 'Loading organizations...' : 'Select your organization'}
              </option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
            {orgsError && (
              <p className="text-[var(--red)] text-sm mt-1">
                {orgsError}
              </p>
            )}
            {errors.orgId && (
              <p className="text-[var(--red)] text-sm mt-1">
                {errors.orgId}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="w-full flex h-12 items-center justify-center border border-[var(--border)] text-[var(--t2)] hover:text-[var(--t1)] hover:border-[var(--cyan)] transition-colors text-sm rounded-lg"
            >
              Already have an account? Login
            </button>

            <button
              type="submit"
              className={clsx(
                'w-full flex h-12 items-center justify-center',
                'bg-[var(--blue)] text-[var(--t1)] font-medium px-6 rounded-lg',
                'hover:bg-[var(--blue)]/90 transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-[var(--blue)]/30',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              disabled={Object.keys(errors).length > 0 || orgsLoading}
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
