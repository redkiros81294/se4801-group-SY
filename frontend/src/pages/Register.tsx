import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFormValidation } from '../hooks/useFormValidation';
import { clsx } from 'clsx';
import api from '../lib/api';

// Organization options from seed data
const ORGANIZATION_OPTIONS = [
  { value: 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', label: 'PharmaCorp Manufacturing' },
  { value: 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', label: 'FastTrack Logistics' },
  { value: 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', label: 'RetailPlus Inc.' }
];

// Role options from enum
const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Administrator' },
  { value: 'MANUFACTURER', label: 'Manufacturer' },
  { value: 'SHIPPER', label: 'Shipper' },
  { value: 'RETAILER', label: 'Retailer' }
];

export const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  // Form state
  const [successMessage, setSuccessMessage] = useState<string>('');

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
    setFieldValue,
    setFieldError,
    validateField,
    validateForm
  } = useFormValidation({
    email: '',
    password: '',
    role: '',
    orgId: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const isValid = validateForm(validationRules);
    
    if (!isValid) {
      // Trigger validation for all fields to show errors
      Object.keys(validationRules).forEach(field => {
        validateField(field, validationRules[field as keyof typeof validationRules]);
      });
      return;
    }

    try {
      const response = await api.post('/auth/register', {
        email: values.email,
        password: values.password,
        role: values.role,
        orgId: values.orgId
      });
      
      // Auto-login after successful registration
      login(response.data.token);
      
      // Set success message and redirect after delay
      setSuccessMessage('Registration successful! Redirecting...');
      
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1500);
    } catch (err: any) {
      // Handle API errors (like email already exists)
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setFieldError('email', errorMessage); // Assume it's an email conflict for now
    }
  };

  return (
    <div className="relative min-h-screen bg-[var(--bg0)] overflow-hidden">
      {/* Animated Background */}
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

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--t2)]">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={values.email}
              onChange={(e) => {
                handleChange(e);
                setFieldValue('email', e.target.value);
              }}
              onBlur={(e) => {
                handleBlur(e);
                validateField('email', validationRules.email);
              }}
              className={clsx(
                'w-full px-4 py-3 border rounded-lg',
                'bg-[var(--bg2)]/50 text-[var(--t1)] placeholder-[var(--t3)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/50',
                'transition-all duration-200',
                errors.email ? 'border-[var(--red)]/50' : 'border-[var(--border)]/40'
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

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--t2)]">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={values.password}
              onChange={(e) => {
                handleChange(e);
                setFieldValue('password', e.target.value);
              }}
              onBlur={(e) => {
                handleBlur(e);
                validateField('password', validationRules.password);
              }}
              className={clsx(
                'w-full px-4 py-3 border rounded-lg',
                'bg-[var(--bg2)]/50 text-[var(--t1)] placeholder-[var(--t3)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/50',
                'transition-all duration-200',
                errors.password ? 'border-[var(--red)]/50' : 'border-[var(--border)]/40'
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

          {/* Role Field */}
          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--t2)]">
              Role
            </label>
            <select
              id="role"
              value={values.role}
              onChange={(e) => {
                handleChange(e);
                setFieldValue('role', e.target.value as any);
              }}
              onBlur={(e) => {
                handleBlur(e);
                validateField('role', validationRules.role);
              }}
              className={clsx(
                'w-full px-4 py-3 border rounded-lg',
                'bg-[var(--bg2)]/50 text-[var(--t1)] placeholder-[var(--t3)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/50',
                'transition-all duration-200',
                errors.role ? 'border-[var(--red)]/50' : 'border-[var(--border)]/40'
              )}
              required
            >
              <option value="">Select your role</option>
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

          {/* Organization Field */}
          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--t2)]">
              Organization
            </label>
            <select
              id="orgId"
              value={values.orgId}
              onChange={(e) => {
                handleChange(e);
                setFieldValue('orgId', e.target.value);
              }}
              onBlur={(e) => {
                handleBlur(e);
                validateField('orgId', validationRules.orgId);
              }}
              className={clsx(
                'w-full px-4 py-3 border rounded-lg',
                'bg-[var(--bg2)]/50 text-[var(--t1)] placeholder-[var(--t3)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/50',
                'transition-all duration-200',
                errors.orgId ? 'border-[var(--red)]/50' : 'border-[var(--border)]/40'
              )}
              required
            >
              <option value="">Select your organization</option>
              {ORGANIZATION_OPTIONS.map(org => (
                <option key={org.value} value={org.value}>
                  {org.label}
                </option>
              ))}
            </select>
            {errors.orgId && (
              <p className="text-[var(--red)] text-sm mt-1">
                {errors.orgId}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="text-[var(--t2)] hover:text-[var(--t1)] transition-colors text-sm"
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
              disabled={Object.keys(errors).length > 0}
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
