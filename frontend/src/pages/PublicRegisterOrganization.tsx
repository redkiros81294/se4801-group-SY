import { useState } from 'react';
import { useFormValidation } from '../hooks/useFormValidation';
import { clsx } from 'clsx';
import api from '../lib/api';

export const PublicRegisterOrganization = () => {
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const { values, errors, handleChange, handleSubmit, resetForm } = useFormValidation(
    { companyName: '', orgType: 'MANUFACTURER', contactEmail: '', contactName: '', message: '' },
    {
      companyName: [(value: string) => !!value.trim()],
      orgType: [(value: string) => !!value],
      contactEmail: [(value: string) => !!value.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)],
      contactName: [(value: string) => !!value.trim()],
    }
  );

  const onSubmit = async (data: Record<string, any>) => {
    setSubmitLoading(true);
    setSubmitError('');
    setSubmitSuccess('');
    try {
      await api.post('/organizations/register', data);
      setSubmitSuccess('Your registration request has been submitted. An administrator will review it shortly.');
      resetForm();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to submit registration request');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[var(--t1)] mb-2">Register Organization</h1>
          <p className="text-[var(--t2)]">Submit a request to register your company on ChainTrack</p>
        </div>

        <div className="bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 p-6">
          {submitError && (
            <div className="mb-4 p-3 rounded-lg bg-[var(--red)]/15 border border-[var(--red)]/25 text-[var(--red)] text-sm">
              {submitError}
            </div>
          )}
          {submitSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-[var(--green)]/15 border border-[var(--green)]/25 text-[var(--green)] text-sm">
              {submitSuccess}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--t2)] mb-2">Company Name</label>
              <input
                type="text"
                name="companyName"
                value={values.companyName}
                onChange={handleChange}
                className={clsx(
                  'w-full px-4 py-3 rounded-lg bg-[var(--bg2)] border text-[var(--t1)] focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/50',
                  errors.companyName ? 'border-[var(--red)]' : 'border-[var(--border)]/30'
                )}
                placeholder="Enter company name"
              />
              {errors.companyName && <p className="mt-1 text-sm text-[var(--red)]">{errors.companyName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--t2)] mb-2">Organization Type</label>
              <select
                name="orgType"
                value={values.orgType}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-[var(--bg2)] border border-[var(--border)]/30 text-[var(--t1)] focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/50"
              >
                <option value="MANUFACTURER">Manufacturer</option>
                <option value="SHIPPER">Shipper</option>
                <option value="RETAILER">Retailer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--t2)] mb-2">Contact Email</label>
              <input
                type="email"
                name="contactEmail"
                value={values.contactEmail}
                onChange={handleChange}
                className={clsx(
                  'w-full px-4 py-3 rounded-lg bg-[var(--bg2)] border text-[var(--t1)] focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/50',
                  errors.contactEmail ? 'border-[var(--red)]' : 'border-[var(--border)]/30'
                )}
                placeholder="contact@company.com"
              />
              {errors.contactEmail && <p className="mt-1 text-sm text-[var(--red)]">{errors.contactEmail}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--t2)] mb-2">Contact Name</label>
              <input
                type="text"
                name="contactName"
                value={values.contactName}
                onChange={handleChange}
                className={clsx(
                  'w-full px-4 py-3 rounded-lg bg-[var(--bg2)] border text-[var(--t1)] focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/50',
                  errors.contactName ? 'border-[var(--red)]' : 'border-[var(--border)]/30'
                )}
                placeholder="John Doe"
              />
              {errors.contactName && <p className="mt-1 text-sm text-[var(--red)]">{errors.contactName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--t2)] mb-2">Message (optional)</label>
              <textarea
                name="message"
                value={values.message}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 rounded-lg bg-[var(--bg2)] border border-[var(--border)]/30 text-[var(--t1)] focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/50 resize-none"
                placeholder="Tell us about your organization..."
              />
            </div>

            <button
              type="submit"
              disabled={submitLoading}
              className="w-full flex h-12 items-center justify-center bg-[var(--blue)] text-[var(--t1)] font-medium px-6 rounded-lg hover:bg-[var(--blue)]/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--blue)]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitLoading ? 'Submitting...' : 'Submit Registration Request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
