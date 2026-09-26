import React, { useMemo, useState } from 'react';
import { PackagePlus, Save, X, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useReferenceData } from '../shared/useReferenceData';

/**
 * Create a receipt: stock arriving from a vendor.
 *
 * The submitted body matches the API contract exactly:
 *   { supplier: { name, code }, warehouse, location, items: [{ product, quantity }] }
 *
 * Warehouse, location and product are chosen from real records and submitted as
 * ids, because the API resolves all three against the database. The supplier is
 * free text, since the spec has receipts carrying a supplier but never defines a
 * supplier entity, so the server captures it inline.
 *
 * Creating a receipt only ever produces a draft. Nothing moves stock until the
 * document is marked ready and posted, which is the server's decision.
 */

const createEmptyRow = () => ({ product: '', quantity: 1 });

const ReceiptForm = ({ onClose, onSubmit, submitting = false }) => {
  const [formData, setFormData] = useState({
    supplier: '',
    supplierCode: '',
    warehouse: '',
    location: '',
    products: [createEmptyRow()]
  });
  const [error, setError] = useState('');
  const { warehouses, productOptions, locationsFor, loading, loadError } = useReferenceData();

  const locations = useMemo(() => locationsFor(formData.warehouse), [locationsFor, formData.warehouse]);

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
      products: prev.products.map((row, rowIndex) =>
        rowIndex === index
          ? { ...row, [field]: field === 'quantity' ? Number(value) || 0 : value }
          : row
      )
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
    if (!formData.supplier.trim()) return 'Supplier is required.';
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
      supplier: {
        name: formData.supplier.trim(),
        code: formData.supplierCode.trim()
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
      <div className="modal-card receipt-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <PackagePlus size={22} color="#6366f1" />
            <h3>Create Receipt</h3>
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

          <div className="receipt-form-grid">
            <div className="form-group">
              <label htmlFor="supplier">Supplier *</label>
              <input
                id="supplier"
                className="form-control"
                type="text"
                placeholder="e.g. ABC Steel Suppliers"
                value={formData.supplier}
                onChange={(e) => updateField('supplier', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="supplierCode">Supplier Code</label>
              <input
                id="supplierCode"
                className="form-control"
                type="text"
                placeholder="Optional"
                value={formData.supplierCode}
                onChange={(e) => updateField('supplierCode', e.target.value)}
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
              <label htmlFor="location">Location *</label>
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

          <div className="receipt-products-header">
            <h4>Products</h4>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addProductRow}>
              <Plus size={16} />
              <span>Add Product</span>
            </button>
          </div>

          <div className="receipt-product-list">
            {formData.products.map((row, index) => (
              <div key={`product-${index}`} className="receipt-product-row">
                <div className="form-group receipt-product-name">
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

                <div className="form-group receipt-qty">
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
                  className="btn-icon receipt-remove-btn"
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

export default ReceiptForm;
