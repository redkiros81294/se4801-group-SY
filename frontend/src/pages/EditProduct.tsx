import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import { PageShell } from '../components/PageShell';
import { Toast } from '../components/Toast';

export const EditProduct = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await api.get(`/products/${id}`);
        const product = response.data;

        setSku(product.sku);
        setName(product.name);
        setCategory(product.category || '');
        setDescription(product.description || '');
      } catch (err: any) {
        if (err.response?.status === 404) {
          setNotFound(true);
        } else {
          setError('Failed to load product');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!id) return;

    try {
      setSaving(true);
      await api.patch(`/products/${id}`, {
        sku,
        name,
        category: category || undefined,
        description: description || undefined,
      });
      setSuccess('Product updated successfully!');
      setTimeout(() => navigate('/products'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageShell title="Edit Product">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <div className="h-5 w-5 border-2 border-[var(--cyan)] border-t-transparent rounded-full animate-spin" />
            <span className="text-[var(--t2)]">Loading product...</span>
          </div>
        </div>
      </PageShell>
    );
  }

  if (notFound) {
    return (
      <PageShell title="Edit Product">
        <div className="text-center py-12">
          <i className="ti ti-alert-circle text-[var(--red)] text-4xl mb-4" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-[var(--t1)] mb-2">Product Not Found</h2>
          <p className="text-[var(--t2)] mb-6">The product you're trying to edit doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/products')}
            className="px-6 py-3 rounded-lg bg-[var(--blue)] text-[var(--t1)] font-medium hover:bg-[var(--blue)]/90 transition-colors duration-200"
          >
            Back to Products
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Edit Product">
      <div className="max-w-2xl mx-auto">
        <Toast
          type={error ? 'error' : 'success'}
          message={error || success}
          onClose={() => {
            setError('');
            setSuccess('');
          }}
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 p-6">
            <h2 className="text-xl font-bold text-[var(--t1)] mb-6">Edit Product Information</h2>

            {/* SKU Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-[var(--t2)]">
                SKU <span className="text-[var(--red)]">*</span>
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[var(--bg2)]/50 border border-[var(--border)]/20 text-[var(--t1)] placeholder-[var(--t3)] focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/50 transition-all duration-200"
                placeholder="Enter unique SKU"
                required
              />
              <p className="mt-1 text-[var(--t3)] text-xs">Changing SKU may affect existing batch records</p>
            </div>

            {/* Product Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-[var(--t2)]">
                Product Name <span className="text-[var(--red)]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[var(--bg2)]/50 border border-[var(--border)]/20 text-[var(--t1)] placeholder-[var(--t3)] focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/50 transition-all duration-200"
                placeholder="Enter product name"
                required
              />
            </div>

            {/* Category */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-[var(--t2)]">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[var(--bg2)]/50 border border-[var(--border)]/20 text-[var(--t1)] focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/50 transition-all duration-200"
              >
                <option value="">Select a category</option>
                <option value="Electronics">Electronics</option>
                <option value="Pharmaceuticals">Pharmaceuticals</option>
                <option value="Food & Beverage">Food & Beverage</option>
                <option value="Textiles">Textiles</option>
                <option value="Automotive">Automotive</option>
              </select>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-[var(--t2)]">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-lg bg-[var(--bg2)]/50 border border-[var(--border)]/20 text-[var(--t1)] placeholder-[var(--t3)] focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/50 transition-all duration-200"
                placeholder="Enter product description (optional)"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="px-6 py-3 rounded-lg border border-[var(--border)]/40 bg-[var(--bg2)]/50 text-[var(--t1)] hover:bg-[var(--bg3)]/50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-lg bg-[var(--blue)] text-[var(--t1)] font-medium hover:bg-[var(--blue)]/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--blue)]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
};