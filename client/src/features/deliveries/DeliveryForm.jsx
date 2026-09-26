import React, { useMemo, useState } from 'react';
import { PackagePlus, Save, X, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useReferenceData } from '../shared/useReferenceData';

/**
 * Create a delivery order: stock leaving the warehouse for a customer.
 *
 * Submitted body, matching the API contract:
 *   { customer: { name, code }, warehouse, location, items: [{ product, quantity }] }
 *
 * The customer is free text, because the spec has deliveries carrying a customer
 * but never defines a customer entity, so the server captures it inline.
 *
 * There is no "available stock" figure shown per line. Availability is a balance
 * per (product, warehouse, location) in the ledger, and the server is what
 * decides whether the document can be posted: it validates every line against
 * the current balances and rejects the whole document rather than letting stock
 * go negative. A number invented in the browser would drift from the ledger and
 * could contradict the result.
 */

const createEmptyRow = () => ({ product: '', quantity: 1 });

const DeliveryForm = ({ onClose, onSubmit, submitting = false }) => {
  const [formData, setFormData] = useState({
    customer: '',
    customerCode: '',
    warehouse: '',
    location: '',
    products: [createEmptyRow()]
  });
  const [error, setError] = useState('');
  const { warehouses, productOptions, locationsFor, loading, loadError } = useReferenceData();

  const locations = useMemo(
    () => locationsFor(formData.warehouse),
    [locationsFor, formData.warehouse]
  );

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Changing the warehouse invalidates the location, because a code only means
  // something inside its own warehouse.
  const updateWarehouse = (warehouseId) => {
    setFormData((prev) => ({ ...prev, warehouse: warehouseId, location: '' }));
  };

  const updateProductRow = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.map((row, rowIndex) => {
        if (rowIndex !== index) return row;
        return { ...row, [field]: field === 'quantity' ? Number(value) || 0 : value };
      })
    }));
  };

  const addProductRow = () => {
    setFormData((prev) => ({ ...prev, products: [...prev.products, createEmptyRow()] }));
  };

  const removeProductRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      products:
        prev.products.length > 1
          ? prev.products.filter((_, rowIndex) => rowIndex !== index)
          : [createEmptyRow()]
    }));
  };

  const validateForm = () => {
    if (!formData.customer.trim()) return 'Customer is required.';
    if (!formData.warehouse) return 'Warehouse is required.';
    if (!formData.location) return 'Location is required.';

    for (const row of formData.products) {
      if (!row.product) return 'Each product row must include a product.';
      if (!Number.isFinite(row.quantity) || row.quantity <= 0) {
        return 'Each product quantity must be greater than zero.';
      }
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationMessage = validateForm();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    await onSubmit({
      customer: {
        name: formData.customer.trim(),
        code: formData.customerCode.trim()
      },
      warehouse: formData.warehouse,
      location: formData.location,
      items: formData.products.map((row) => ({
        product: row.product,
        quantity: Number(row.quantity),
        notes: ''
      }))
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card delivery-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <PackagePlus size={22} color="#6366f1" />
            <h3>Create Delivery Order</h3>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close modal" type="button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {(error || loadError) && (
            <div className="alert alert-error">
              <AlertCircle size={18} />
              <span>{error || loadError}</span>
            </div>
          )}

          <div className="delivery-form-grid">
            <div className="form-group">
              <label htmlFor="customer">Customer *</label>
              <input
                id="customer"
                className="form-control"
                type="text"
                placeholder="e.g. BuildWell Materials"
                value={formData.customer}
                onChange={(e) => updateField('customer', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="customerCode">Customer Code</label>
              <input
                id="customerCode"
                className="form-control"
                type="text"
                placeholder="Optional"
                value={formData.customerCode}
                onChange={(e) => updateField('customerCode', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="warehouse">Warehouse *</label>
              <select
                id="warehouse"
                className="form-control"
                value={formData.warehouse}
                onChange={(e) => updateWarehouse(e.target.value)}
                disabled={loading}
              >
                <option value="">{loading ? 'Loading warehouses...' : 'Select warehouse'}</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse._id} value={warehouse._id}>
                    {warehouse.name} ({warehouse.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="location">Pick From Location *</label>
              <select
                id="location"
                className="form-control"
                value={formData.location}
                onChange={(e) => updateField('location', e.target.value)}
                disabled={!formData.warehouse}
              >
                <option value="">
                  {formData.warehouse ? 'Select location' : 'Select a warehouse first'}
                </option>
                {locations.map((location) => (
                  <option key={location.code} value={location.code}>
                    {location.name} ({location.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="delivery-products-header">
            <h4>Products</h4>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addProductRow}>
              <Plus size={16} />
              <span>Add Product</span>
            </button>
          </div>

          <div className="delivery-product-list">
            {formData.products.map((row, index) => (
              <div key={`delivery-product-${index}`} className="delivery-product-row">
                <div className="form-group delivery-product-name">
                  <label>Product *</label>
                  <select
                    className="form-control"
                    value={row.product}
                    onChange={(e) => updateProductRow(index, 'product', e.target.value)}
                    disabled={loading}
                  >
                    <option value="">{loading ? 'Loading products...' : 'Select product'}</option>
                    {productOptions.map((product) => (
                      <option key={product.value} value={product.value}>
                        {product.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group delivery-qty">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    className="form-control"
                    value={row.quantity}
                    onChange={(e) => updateProductRow(index, 'quantity', e.target.value)}
                  />
                </div>

                <button
                  type="button"
                  className="btn-icon delivery-remove-btn"
                  aria-label="Remove product"
                  onClick={() => removeProductRow(index)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting || loading} className="btn btn-primary">
              {submitting ? (
                <span className="spinner-sm"></span>
              ) : (
                <>
                  <Save size={18} />
                  <span>Save Draft</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeliveryForm;
