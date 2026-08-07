import { useState, useEffect } from 'react';
import { useFormValidation } from '../hooks/useFormValidation';
import { clsx } from 'clsx';
import api from '../lib/api';
import { EmptyState } from '../components/EmptyState';

interface Organization {
  id: string;
  name: string;
  orgType: string;
  createdAt: string;
  updatedAt: string;
}

export const AdminOrganizations = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const { values, errors, handleChange, handleSubmit, resetForm } = useFormValidation(
    { name: '', orgType: 'MANUFACTURER' },
    {
      name: [(value: string) => !!value.trim()],
    }
  );

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const response = await api.get('/organizations');
      const data = response.data?.content ?? [];
      setOrganizations(data.map((org: any) => ({
        id: org.id,
        name: org.name,
        orgType: org.orgType,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt
      })));
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 401) {
        setError('Session expired. Please log in again.');
      } else if (status === 403) {
        setError('You do not have permission to view organizations.');
      } else {
        setError(err.response?.data?.message || 'Failed to load organizations');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: Record<string, any>) => {
    setSubmitLoading(true);
    setSubmitError('');
    setSubmitSuccess('');
    try {
      await api.post('/organizations', data);
      setSubmitSuccess('Organization created successfully');
      setShowForm(false);
      resetForm();
      loadOrganizations();
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.message || 'Failed to create organization';
      if (status === 401) {
        setSubmitError('Session expired. Please refresh the page and try again.');
      } else if (status === 403) {
        setSubmitError('You do not have permission to perform this action.');
      } else {
        setSubmitError(message);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdate = async (data: Record<string, any>) => {
    if (!editingId) return;
    setSubmitLoading(true);
    setSubmitError('');
    setSubmitSuccess('');
    try {
      await api.put(`/organizations/${editingId}`, data);
      setSubmitSuccess('Organization updated successfully');
      setEditingId(null);
      resetForm();
      loadOrganizations();
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.message || 'Failed to update organization';
      if (status === 401) {
        setSubmitError('Session expired. Please refresh the page and try again.');
      } else if (status === 403) {
        setSubmitError('You do not have permission to perform this action.');
      } else {
        setSubmitError(message);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this organization?')) return;
    try {
      await api.delete(`/organizations/${id}`);
      loadOrganizations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete organization');
    }
  };

  const startEdit = (org: Organization) => {
    setEditingId(org.id);
    handleChange({ target: { name: 'name', value: org.name } } as any);
    handleChange({ target: { name: 'orgType', value: org.orgType } } as any);
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
    resetForm();
  };

  const orgTypeLabel = (type: string) => {
    switch (type) {
      case 'MANUFACTURER': return 'Manufacturer';
      case 'SHIPPER': return 'Shipper';
      case 'RETAILER': return 'Retailer';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--t1)]">Organizations</h1>
          <p className="text-[var(--t2)] text-sm mt-1">Manage supply chain organizations</p>
        </div>
        <button
          onClick={() => { cancelEdit(); setShowForm(true); }}
          className="px-4 py-2 rounded-lg bg-[var(--blue)] text-[var(--t1)] font-medium hover:bg-[var(--blue)]/90 transition-colors"
        >
          Add Organization
        </button>
      </div>

      {submitError && <div className="p-3 rounded-lg bg-[var(--red)]/15 border border-[var(--red)]/25 text-[var(--red)] text-sm">{submitError}</div>}
      {submitSuccess && <div className="p-3 rounded-lg bg-[var(--green)]/15 border border-[var(--green)]/25 text-[var(--green)] text-sm">{submitSuccess}</div>}

      {(showForm || editingId) && (
        <div className="bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 p-6">
          <h2 className="text-lg font-semibold text-[var(--t1)] mb-4">
            {editingId ? 'Edit Organization' : 'Create Organization'}
          </h2>
          <form onSubmit={handleSubmit(editingId ? handleUpdate : handleCreate)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--t2)] mb-2">Organization Name</label>
              <input
                type="text"
                name="name"
                value={values.name}
                onChange={handleChange}
                className={clsx(
                  'w-full px-4 py-3 rounded-lg bg-[var(--bg2)] border text-[var(--t1)] focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/50',
                  errors.name ? 'border-[var(--red)]' : 'border-[var(--border)]/30'
                )}
                placeholder="Enter organization name"
              />
              {errors.name && <p className="mt-1 text-sm text-[var(--red)]">{errors.name}</p>}
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
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitLoading}
                className="px-6 py-3 rounded-lg bg-[var(--blue)] text-[var(--t1)] font-medium hover:bg-[var(--blue)]/90 transition-colors disabled:opacity-50"
              >
                {submitLoading ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="px-6 py-3 rounded-lg border border-[var(--border)]/40 bg-[var(--bg2)]/50 text-[var(--t2)] hover:text-[var(--t1)] hover:bg-[var(--bg3)]/50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {error && <div className="p-3 rounded-lg bg-[var(--red)]/15 border border-[var(--red)]/25 text-[var(--red)] text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 border-2 border-[var(--cyan)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : organizations.length === 0 ? (
        <EmptyState
          icon="ti ti-building"
          title="No organizations yet"
          message="Create your first organization to get started."
          action={
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 rounded-lg bg-[var(--blue)] text-[var(--t1)] font-medium hover:bg-[var(--blue)]/90 transition-colors"
            >
              Add Organization
            </button>
          }
        />
      ) : (
        <div className="bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]/20">
                <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--t2)] uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--t2)] uppercase tracking-wider">Type</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--t2)] uppercase tracking-wider">Created</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-[var(--t2)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]/20">
              {organizations.map((org) => (
                <tr key={org.id} className="hover:bg-[var(--bg3)]/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-[var(--t1)]">{org.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--cyan)]/15 text-[var(--cyan)] border border-[var(--cyan)]/25">
                      {orgTypeLabel(org.orgType)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--t2)]">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => startEdit(org)}
                        className="p-2 rounded-lg hover:bg-[var(--bg3)]/50 text-[var(--t2)] hover:text-[var(--t1)] transition-colors"
                        title="Edit"
                      >
                        <i className="ti ti-edit" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => handleDelete(org.id)}
                        className="p-2 rounded-lg hover:bg-[var(--red)]/15 text-[var(--t2)] hover:text-[var(--red)] transition-colors"
                        title="Delete"
                      >
                        <i className="ti ti-trash" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
