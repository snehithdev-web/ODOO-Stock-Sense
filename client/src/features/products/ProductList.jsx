import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  fetchProductsApi,
  fetchProductFilterOptionsApi,
  deleteProductApi,
} from './productApi';
import { useAuth } from '../../context/AuthContext';
import ProductForm from './ProductForm';
import ProductDetails from './ProductDetails';
import StatusBadge from '../../components/StatusBadge';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Filter,
  RefreshCw,
  AlertCircle,
  PackageX,
  X,
  ChevronLeft,
  ChevronRight,
  Hash,
  ArrowUpDown,
} from 'lucide-react';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

const FILTER_DEFAULTS = {
  category: '',
  location: '',
  unit: '',
  stockStatus: '',
  minPrice: '',
  maxPrice: '',
};

/**
 * Query string key per filter field, kept short so a filtered view is a
 * readable, shareable URL.
 */
const URL_KEYS = {
  category: 'category',
  location: 'location',
  unit: 'unit',
  stockStatus: 'stock',
  minPrice: 'min',
  maxPrice: 'max',
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'sku_asc', label: 'SKU (A-Z)' },
  { value: 'sku_desc', label: 'SKU (Z-A)' },
  { value: 'quantity_asc', label: 'Quantity (low to high)' },
  { value: 'quantity_desc', label: 'Quantity (high to low)' },
  { value: 'price_asc', label: 'Price (low to high)' },
  { value: 'price_desc', label: 'Price (high to low)' },
];

/**
 * Mirrors the server's stock buckets, so the row badge and the filter agree on
 * what "low stock" means. Out of stock is deliberately a separate bucket.
 */
const STOCK_STATUS_OPTIONS = [
  { value: '', label: 'Any stock level' },
  { value: 'in_stock', label: 'In stock' },
  { value: 'low_stock', label: 'Low stock' },
  { value: 'out_of_stock', label: 'Out of stock' },
];

const EMPTY_OPTIONS = { categories: [], locations: [], units: [], stock: {} };

const stockStateOf = (product) => {
  if (Number(product.quantity) <= 0) {
    return { status: 'out_of_stock', label: 'Out of stock', badge: 'danger' };
  }
  if (Number(product.quantity) <= Number(product.reorderLevel)) {
    return { status: 'low_stock', label: 'Low stock', badge: 'warning' };
  }
  return { status: 'in_stock', label: 'In stock', badge: 'success' };
};

const ProductList = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'inventory_manager';
  const [searchParams, setSearchParams] = useSearchParams();

  // Every control is seeded from the URL, so a filtered view can be shared or
  // reloaded without losing state.
  const [searchInput, setSearchInput] = useState(() => searchParams.get('q') || '');
  const [skuInput, setSkuInput] = useState(() => searchParams.get('sku') || '');
  const [filters, setFilters] = useState(() => ({
    category: searchParams.get('category') || '',
    location: searchParams.get('location') || '',
    unit: searchParams.get('unit') || '',
    stockStatus: searchParams.get('stock') || '',
    minPrice: searchParams.get('min') || '',
    maxPrice: searchParams.get('max') || '',
  }));
  const [sort, setSort] = useState(() => searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(() =>
    Math.max(Number.parseInt(searchParams.get('page'), 10) || 1, 1)
  );

  // The values the request actually uses, updated once typing settles.
  const [search, setSearch] = useState(searchInput);
  const [sku, setSku] = useState(skuInput);

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [options, setOptions] = useState(EMPTY_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Debounced so a request is not fired on every keystroke. Both timers also
  // return to page 1, because page 4 of a new result set is usually empty.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSku(skuInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [skuInput]);

  // Mirror the active query back into the URL. replace: true keeps a burst of
  // typing from filling the history with one entry per keystroke.
  useEffect(() => {
    const next = new URLSearchParams();
    if (search) next.set('q', search);
    if (sku) next.set('sku', sku);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) next.set(URL_KEYS[key], value);
    });
    if (sort && sort !== 'newest') next.set('sort', sort);
    if (page > 1) next.set('page', String(page));
    setSearchParams(next, { replace: true });
  }, [search, sku, filters, sort, page, setSearchParams]);

  const loadOptions = useCallback(async () => {
    try {
      const response = await fetchProductFilterOptionsApi();
      setOptions(response.data || EMPTY_OPTIONS);
    } catch {
      // Filter options are an enhancement, not the page. If they fail the
      // catalog still loads, the dropdowns just stay empty.
      setOptions(EMPTY_OPTIONS);
    }
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetchProductsApi({
        search: search || undefined,
        sku: sku || undefined,
        category: filters.category || undefined,
        location: filters.location || undefined,
        unit: filters.unit || undefined,
        stockStatus: filters.stockStatus || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        sort,
        page,
        limit: PAGE_SIZE,
      });

      // The list endpoint returns the shared { status, message, data, pagination }
      // envelope, with the product array under `data`.
      setProducts(response.data || []);
      setPagination(response.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search, sku, filters, sort, page]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const updateSort = (value) => {
    setSort(value);
    setPage(1);
  };

  const clearAll = () => {
    setSearchInput('');
    setSearch('');
    setSkuInput('');
    setSku('');
    setFilters(FILTER_DEFAULTS);
    setSort('newest');
    setPage(1);
  };

  // One removable chip per active constraint, so it is always obvious why the
  // list is short and which control to reset.
  const activeChips = useMemo(() => {
    const chips = [];
    const stockLabel =
      STOCK_STATUS_OPTIONS.find((o) => o.value === filters.stockStatus)?.label ||
      filters.stockStatus;
    const sortLabel =
      SORT_OPTIONS.find((o) => o.value === sort)?.label || sort;

    if (search) {
      chips.push({
        key: 'q',
        label: `Search: ${search}`,
        onRemove: () => {
          setSearchInput('');
          setSearch('');
          setPage(1);
        },
      });
    }
    if (sku) {
      chips.push({
        key: 'sku',
        label: `SKU: ${sku}`,
        onRemove: () => {
          setSkuInput('');
          setSku('');
          setPage(1);
        },
      });
    }
    if (filters.category) {
      chips.push({
        key: 'category',
        label: `Category: ${filters.category}`,
        onRemove: () => updateFilter('category', ''),
      });
    }
    if (filters.location) {
      chips.push({
        key: 'location',
        label: `Location: ${filters.location}`,
        onRemove: () => updateFilter('location', ''),
      });
    }
    if (filters.unit) {
      chips.push({
        key: 'unit',
        label: `Unit: ${filters.unit}`,
        onRemove: () => updateFilter('unit', ''),
      });
    }
    if (filters.stockStatus) {
      chips.push({
        key: 'stock',
        label: `Stock: ${stockLabel}`,
        onRemove: () => updateFilter('stockStatus', ''),
      });
    }
    if (filters.minPrice) {
      chips.push({
        key: 'min',
        label: `Min price: $${filters.minPrice}`,
        onRemove: () => updateFilter('minPrice', ''),
      });
    }
    if (filters.maxPrice) {
      chips.push({
        key: 'max',
        label: `Max price: $${filters.maxPrice}`,
        onRemove: () => updateFilter('maxPrice', ''),
      });
    }
    if (sort !== 'newest') {
      chips.push({
        key: 'sort',
        label: `Sort: ${sortLabel}`,
        onRemove: () => updateSort('newest'),
      });
    }

    return chips;
  }, [search, sku, filters, sort]);

  const handleDelete = async (id, skuToDelete) => {
    if (!window.confirm(`Are you sure you want to delete product SKU: ${skuToDelete}?`)) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteProductApi(id);
      // The filter counts are derived from the catalog, so they go stale too.
      await Promise.all([loadProducts(), loadOptions()]);
    } catch (err) {
      alert(err.message || 'Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormSuccess = () => {
    setShowFormModal(false);
    setEditingProduct(null);
    loadProducts();
    loadOptions();
  };

  const total = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="product-list-container">
      {/* Header Bar */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Product Catalog</h1>
          <p className="page-subtitle">
            Manage product Master Data, SKUs, Categories, and Units of Measure
          </p>
        </div>

        {isManager && (
          <button
            onClick={() => {
              setEditingProduct(null);
              setShowFormModal(true);
            }}
            className="btn btn-primary"
          >
            <Plus size={18} />
            <span>Add Product</span>
          </button>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="toolbar-card toolbar-card-stack">
        <div className="toolbar-left toolbar-left-wrap">
          <div className="input-with-icon search-input">
            <Search size={18} className="input-icon" />
            <input
              type="text"
              placeholder="Search name, SKU, category or description..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="form-control"
              aria-label="Search products"
            />
          </div>

          <div className="input-with-icon filter-input">
            <Hash size={18} className="input-icon" />
            <input
              type="text"
              placeholder="SKU contains..."
              value={skuInput}
              onChange={(e) => setSkuInput(e.target.value)}
              className="form-control"
              aria-label="Filter by SKU"
            />
          </div>

          <div className="input-with-icon filter-input">
            <Filter size={18} className="input-icon" />
            <select
              value={filters.category}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="form-control"
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {options.categories.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.value} ({opt.count})
                </option>
              ))}
            </select>
          </div>

          <div className="input-with-icon filter-input">
            <Filter size={18} className="input-icon" />
            <select
              value={filters.location}
              onChange={(e) => updateFilter('location', e.target.value)}
              className="form-control"
              aria-label="Filter by location"
            >
              <option value="">All Locations</option>
              {options.locations.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.value} ({opt.count})
                </option>
              ))}
            </select>
          </div>

          <div className="input-with-icon filter-input">
            <Filter size={18} className="input-icon" />
            <select
              value={filters.unit}
              onChange={(e) => updateFilter('unit', e.target.value)}
              className="form-control"
              aria-label="Filter by unit of measure"
            >
              <option value="">All Units</option>
              {options.units.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.value} ({opt.count})
                </option>
              ))}
            </select>
          </div>

          <div className="input-with-icon filter-input">
            <Filter size={18} className="input-icon" />
            <select
              value={filters.stockStatus}
              onChange={(e) => updateFilter('stockStatus', e.target.value)}
              className="form-control"
              aria-label="Filter by stock level"
            >
              {STOCK_STATUS_OPTIONS.map((opt) => {
                const count = {
                  in_stock: options.stock?.inStock,
                  low_stock: options.stock?.lowStock,
                  out_of_stock: options.stock?.outOfStock,
                }[opt.value];
                return (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                    {count === undefined ? '' : ` (${count})`}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="input-with-icon filter-input filter-input-narrow">
            <span className="input-prefix">$</span>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="Min"
              value={filters.minPrice}
              onChange={(e) => updateFilter('minPrice', e.target.value)}
              className="form-control form-control-prefixed"
              aria-label="Minimum unit price"
            />
          </div>

          <div className="input-with-icon filter-input filter-input-narrow">
            <span className="input-prefix">$</span>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(e) => updateFilter('maxPrice', e.target.value)}
              className="form-control form-control-prefixed"
              aria-label="Maximum unit price"
            />
          </div>

          <div className="input-with-icon filter-input">
            <ArrowUpDown size={18} className="input-icon" />
            <select
              value={sort}
              onChange={(e) => updateSort(e.target.value)}
              className="form-control"
              aria-label="Sort products"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              loadProducts();
              loadOptions();
            }}
            className="btn btn-secondary btn-icon-only"
            title="Refresh List"
          >
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Active filters + result count */}
      {(activeChips.length > 0 || !loading) && (
        <div className="filter-summary">
          <div className="filter-chips">
            {activeChips.map((chip) => (
              <span key={chip.key} className="filter-chip">
                <span className="filter-chip-label">{chip.label}</span>
                <button
                  onClick={chip.onRemove}
                  className="filter-chip-remove"
                  title={`Remove ${chip.label}`}
                  aria-label={`Remove filter ${chip.label}`}
                >
                  <X size={13} />
                </button>
              </span>
            ))}
            {activeChips.length > 1 && (
              <button onClick={clearAll} className="btn-link">
                Clear all
              </button>
            )}
          </div>

          <p className="result-count">
            {loading
              ? 'Loading...'
              : `${total} product${total === 1 ? '' : 's'} matched`}
          </p>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Table Content */}
      {loading && products.length === 0 ? (
        <div className="flex-center py-12">
          <div className="spinner"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state-card">
          <PackageX size={48} color="#94a3b8" />
          <h3>No products found</h3>
          <p>Try adjusting your search criteria or filter options.</p>
          {activeChips.length > 0 && (
            <button onClick={clearAll} className="btn btn-secondary mt-4">
              <X size={18} />
              <span>Clear All Filters</span>
            </button>
          )}
          {isManager && (
            <button
              onClick={() => {
                setEditingProduct(null);
                setShowFormModal(true);
              }}
              className="btn btn-primary mt-4"
            >
              <Plus size={18} />
              <span>Create First Product</span>
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Stock / Unit</th>
                  <th>Unit Price</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const stock = stockStateOf(p);

                  return (
                    <tr key={p._id}>
                      <td>
                        <span className="font-mono sku-badge">{p.sku}</span>
                      </td>
                      <td>
                        <div className="product-name-cell">
                          <span className="font-semibold">{p.name}</span>
                          {p.description && (
                            <span className="text-muted text-xs truncate max-w-xs">
                              {p.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <StatusBadge type="info">{p.category}</StatusBadge>
                      </td>
                      <td>
                        <div className="stock-cell">
                          <span className="font-mono">{p.quantity}</span>{' '}
                          <span className="text-muted text-xs">{p.unit}</span>
                          <StatusBadge type={stock.badge}>
                            {stock.label}
                          </StatusBadge>
                        </div>
                      </td>
                      <td className="font-mono">${Number(p.price).toFixed(2)}</td>
                      <td className="text-muted text-sm">
                        {p.location || 'Main Warehouse'}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            onClick={() => setViewingProduct(p)}
                            className="btn-action btn-action-view"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>

                          {isManager && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingProduct(p);
                                  setShowFormModal(true);
                                }}
                                className="btn-action btn-action-edit"
                                title="Edit Product"
                              >
                                <Edit2 size={16} />
                              </button>

                              <button
                                onClick={() => handleDelete(p._id, p.sku)}
                                disabled={deletingId === p._id}
                                className="btn-action btn-action-delete"
                                title="Delete Product"
                              >
                                {deletingId === p._id ? (
                                  <span className="spinner-xs"></span>
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-bar">
              <span className="pagination-summary">
                Page {pagination?.page} of {totalPages}
              </span>
              <div className="pagination-controls">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={!pagination?.hasPreviousPage || loading}
                  className="btn btn-secondary btn-sm"
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={!pagination?.hasNextPage || loading}
                  className="btn btn-secondary btn-sm"
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Form Modal (Add / Edit) */}
      {showFormModal && (
        <ProductForm
          product={editingProduct}
          onClose={() => {
            setShowFormModal(false);
            setEditingProduct(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Details Modal */}
      {viewingProduct && (
        <ProductDetails
          product={viewingProduct}
          onClose={() => setViewingProduct(null)}
          onEdit={
            isManager
              ? (p) => {
                  setEditingProduct(p);
                  setShowFormModal(true);
                }
              : null
          }
        />
      )}
    </div>
  );
};

export default ProductList;
