import { useState, useEffect } from 'react';
import api from '../lib/api';
import { PageShell } from '../components/PageShell';
import { DataTable } from '../components/DataTable';
import { useAuth } from '../contexts/AuthContext';

interface Product {
  id: string
  sku: string
  name: string
  description: string
  category: string
  createdAt: string
  updatedAt: string
}

export const ProductsList = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.append('size', '100');
        
        if (searchQuery) {
          params.append('name', searchQuery);
        }
        if (selectedCategory) {
          params.append('category', selectedCategory);
        }

        const response = await api.get(`/products/search?${params.toString()}`);
        setProducts(response.data.content || []);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCategory]);

  const columns = [
    { key: 'sku' as keyof Product, label: 'SKU', sortable: true },
    { key: 'name' as keyof Product, label: 'Product Name', sortable: true },
    { key: 'category' as keyof Product, label: 'Category', sortable: true },
    { key: 'createdAt' as keyof Product, label: 'Created', sortable: true },
  ];

  return (
    <PageShell title="Products">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[var(--t1)]">Products</h2>
            <p className="text-[var(--t2)] text-sm mt-1">
              Manage your product catalog
            </p>
          </div>
          {user?.roles.includes('MANUFACTURER') && (
            <a
              href={`${import.meta.env.BASE_URL}products/new`}
              className="flex items-center space-x-2 px-4 py-2 bg-[var(--blue)] text-[var(--t1)] font-medium rounded-lg hover:bg-[var(--blue)]/90 transition-colors duration-200"
            >
              <i className="ti ti-plus" aria-hidden="true" />
              <span>New Product</span>
            </a>
          )}
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--t3)]" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search products by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg2)]/50 border border-[var(--border)]/20 rounded-lg text-[var(--t1)] placeholder-[var(--t3)] focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/50 transition-all duration-200"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="sm:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-[var(--bg2)]/50 border border-[var(--border)]/20 rounded-lg text-[var(--t1)] focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/50 transition-all duration-200"
              >
                <option value="">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="Pharmaceuticals">Pharmaceuticals</option>
                <option value="Food & Beverage">Food & Beverage</option>
                <option value="Textiles">Textiles</option>
                <option value="Automotive">Automotive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <div className="h-5 w-5 border-2 border-[var(--cyan)] border-t-transparent rounded-full animate-spin" />
                <span className="text-[var(--t2)]">Loading products...</span>
              </div>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={products}
              emptyState={{
                title: 'No products found',
                description: searchQuery || selectedCategory
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by creating your first product',
                action: user?.roles.includes('MANUFACTURER') ? {
                  label: 'Create Product',
                  onClick: () => window.location.assign(`${import.meta.env.BASE_URL}products/new`),
                } : undefined,
              }}
            />
          )}
        </div>
      </div>
    </PageShell>
  );
};