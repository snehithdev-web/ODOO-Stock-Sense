import React, { useState, useEffect } from 'react';
import { createProductApi, updateProductApi } from './productApi';
import { PackagePlus, Save, X, AlertCircle } from 'lucide-react';

const ProductForm = ({ product, onClose, onSuccess }) => {
  const isEdit = !!product;

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    unit: 'pcs',
    quantity: 0,
    reorderLevel: 10,
    price: 0,
    description: '',
    location: 'Main Warehouse',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        category: product.category || '',
        unit: product.unit || 'pcs',
        quantity: product.quantity !== undefined ? product.quantity : 0,
        reorderLevel: product.reorderLevel !== undefined ? product.reorderLevel : 10,
        price: product.price !== undefined ? product.price : 0,
        description: product.description || '',
        location: product.location || 'Main Warehouse',
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.sku || !formData.category) {
      setError('Please fill in Name, SKU, and Category.');
      return;
    }

    try {
      setSubmitting(true);
      if (isEdit) {
        await updateProductApi(product._id, formData);
      } else {
        await createProductApi(formData);
      }
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to save product. Check duplicate SKU or inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <PackagePlus size={22} color="#6366f1" />
            <h3>{isEdit ? 'Edit Product' : 'Add New Product'}</h3>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-grid">
            <div className="form-group col-span-2">
              <label htmlFor="name">Product Name *</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g. Wireless Ergonomic Mouse"
                value={formData.name}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="sku">SKU / Code *</label>
              <input
                id="sku"
                name="sku"
                type="text"
                placeholder="e.g. ELEC-MSE-001"
                value={formData.sku}
                onChange={handleChange}
                required
                className="form-control font-mono uppercase"
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <input
                id="category"
                name="category"
                type="text"
                placeholder="e.g. Electronics, Hardware"
                value={formData.category}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="unit">Unit of Measure</label>
              <select
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="form-control"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="box">Boxes (box)</option>
                <option value="unit">Units (unit)</option>
                <option value="meter">Meters (m)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="quantity">Initial Stock Quantity</label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min="0"
                placeholder="0"
                value={formData.quantity}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="reorderLevel">Reorder Level Threshold</label>
              <input
                id="reorderLevel"
                name="reorderLevel"
                type="number"
                min="0"
                placeholder="10"
                value={formData.reorderLevel}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="price">Unit Price ($)</label>
              <input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.price}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="form-group col-span-2">
              <label htmlFor="location">Warehouse Location</label>
              <input
                id="location"
                name="location"
                type="text"
                placeholder="e.g. Main Warehouse - Shelf A3"
                value={formData.location}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="form-group col-span-2">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Optional notes or specification details..."
                value={formData.description}
                onChange={handleChange}
                className="form-control"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? (
                <span className="spinner-sm"></span>
              ) : (
                <>
                  <Save size={18} />
                  <span>{isEdit ? 'Save Changes' : 'Create Product'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
