import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { PageShell } from '../components/PageShell';
import { Toast } from '../components/Toast';

export const CreateProduct = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [skuChecking, setSkuChecking] = useState(false);
  const [skuAvailable, setSkuAvailable] = useState<boolean | null>(null);

  // Real-time SKU validation using debounce
  useEffect(() => {
    if (!sku || sku.length < 3) {
      setSkuAvailable(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSkuChecking(true);
      try {
        await api.get(`/products/search?name=${encodeURIComponent(sku)}&size=1`);
        setSkuAvailable(false);
      } catch (error: any) {
        if (error.response?.status === 404) {
          setSkuAvailable(true);
        } else {
          setSkuAvailable(null);
        }
      } finally {
        setSkuChecking(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [sku]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user?.orgId) {
      setError('User organization not found');
      return;
    }

    try {
      setLoading(true);
      await api.post('/products', {
        sku,
        name,
        category: category || undefined,
        description: description || undefined,
        manufacturerId: user.orgId,
      });
      setSuccess('Product created successfully!');
      setTimeout(() => navigate('/products'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell title="Create Product">
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
            <h2 className="text-xl font-bold text-[var(--t1)] mb-6">Product Information</h2>

            {/* SKU Field with real-time validation */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-[var(--t2)]">
                SKU <span className="text-[var(--red)]">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  onBlur={() => {
                    if (sku && sku.length >= 3) {
                      setSkuChecking(true);
                    }
                  }}
                  className={`w-full px-4 py-3 rounded-lg bg-[var(--bg2)]/50 border ${
                    skuChecking
                      ? 'border-[var(--amber)]'
                      : skuAvailable === true
                        ? 'border-[var(--green)]'
                        : skuAvailable === false
                          ? 'border-[var(--red)]'
                          : 'border-[var(--border)]/20'
                  } text-[var(--t1)] placeholder-[var(--t3)] focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/50 transition-all duration-200`}
                  placeholder="Enter unique SKU (e.g., ELEC-001)"
                  required
                />
                {skuChecking && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-5 w-5 border-2 border-[var(--amber)] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {!skuChecking && skuAvailable === true && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <i className="ti ti-check text-[var(--green)]" aria-hidden="true" />
                  </div>
                )}
                {!skuChecking && skuAvailable === false && sku.length >= 3 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <i className="ti ti-x text-[var(--red)]" aria-hidden="true" />
                  </div>
                )}
              </div>
              {skuAvailable === false && sku.length >= 3 && (
                <p className="mt-2 text-[var(--red)] text-sm">This SKU is already in use</p>
              )}
              {skuAvailable === true && (
                <p className="mt-2 text-[var(--green)] text-sm">SKU is available</p>
              )}
              <p className="mt-1 text-[var(--t3)] text-xs">Must be unique across all products</p>
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
              disabled={loading || skuAvailable === false}
              className="px-6 py-3 rounded-lg bg-[var(--blue)] text-[var(--t1)] font-medium hover:bg-[var(--blue)]/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--blue)]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
};