import React, { useState, useEffect, useCallback } from 'react';
import { fetchProductsApi, deleteProductApi } from './productApi';
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
} from 'lucide-react';

const ProductList = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'inventory_manager';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetchProductsApi({
        search,
        category: selectedCategory,
      });

      // The list endpoint returns the shared { status, message, data, pagination }
      // envelope, with the product array under `data`.
      const list = response.data || [];
      setProducts(list);

      // Extract unique categories for filter dropdown
      const cats = Array.from(new Set(list.map((p) => p.category).filter(Boolean)));
      setCategories((prev) => Array.from(new Set([...prev, ...cats])));
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleDelete = async (id, sku) => {
    if (!window.confirm(`Are you sure you want to delete product SKU: ${sku}?`)) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteProductApi(id);
      loadProducts();
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
  };

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
      <div className="toolbar-card">
        <div className="toolbar-left">
          <div className="input-with-icon search-input">
            <Search size={18} className="input-icon" />
            <input
              type="text"
              placeholder="Search by SKU, product name, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="input-with-icon filter-input">
            <Filter size={18} className="input-icon" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-control"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={loadProducts}
          className="btn btn-secondary btn-icon-only"
          title="Refresh List"
        >
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Table Content */}
      {loading ? (
        <div className="flex-center py-12">
          <div className="spinner"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state-card">
          <PackageX size={48} color="#94a3b8" />
          <h3>No products found</h3>
          <p>Try adjusting your search criteria or filter options.</p>
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
                const isLow = p.quantity <= p.reorderLevel;

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
                      <div className="font-mono">
                        <span className={isLow ? 'text-warning font-bold' : ''}>
                          {p.quantity}
                        </span>{' '}
                        <span className="text-muted text-xs">{p.unit}</span>
                      </div>
                    </td>
                    <td className="font-mono">${Number(p.price).toFixed(2)}</td>
                    <td className="text-muted text-sm">{p.location || 'Main Warehouse'}</td>
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
