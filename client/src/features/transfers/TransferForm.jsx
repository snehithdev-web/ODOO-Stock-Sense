import React, { useMemo, useState } from 'react';
import { ArrowRightLeft, Save, X, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useReferenceData } from '../shared/useReferenceData';

/**
 * Create an internal transfer: stock moving between two places.
 *
 * Submitted body, matching the API contract:
 *   { from: { warehouse, location }, to: { warehouse, location },
 *     items: [{ product, quantity }] }
 *
 * A transfer names two places and one quantity. The server takes the quantity
 * out of the source and adds it to the destination in a single posting, so total
 * stock is unchanged while its location is. The previous version of this form
 * sent four flat fields and a `products` array, none of which the API accepts.
 */

const createEmptyRow = () => ({ product: '', quantity: 1 });

const TransferForm = ({ onClose, onSubmit, submitting = false }) => {
  const [formData, setFormData] = useState({
    sourceWarehouse: '',
    sourceLocation: '',
    destinationWarehouse: '',
    destinationLocation: '',
    products: [createEmptyRow()]
  });
  const [error, setError] = useState('');
  const { warehouses, productOptions, locationsFor, loading, loadError } = useReferenceData();

  const sourceLocations = useMemo(
    () => locationsFor(formData.sourceWarehouse),
    [locationsFor, formData.sourceWarehouse]
  );
  const destinationLocations = useMemo(
    () => locationsFor(formData.destinationWarehouse),
    [locationsFor, formData.destinationWarehouse]
  );

  // Changing either warehouse invalidates that side's location, because a code
  // only means something inside its own warehouse.
  const updateWarehouse = (field, warehouseId) => {
    setFormData((prev) => ({
      ...prev,
      [field]: warehouseId,
      [field === 'sourceWarehouse' ? 'sourceLocation' : 'destinationLocation']: ''
    }));
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
    if (!formData.sourceWarehouse) return 'Source warehouse is required.';
    if (!formData.sourceLocation) return 'Source location is required.';
    if (!formData.destinationWarehouse) return 'Destination warehouse is required.';
    if (!formData.destinationLocation) return 'Destination location is required.';

    // The server rejects a transfer to the exact same place; catching it here
    // saves a round trip and gives the same answer.
    if (
      formData.sourceWarehouse === formData.destinationWarehouse &&
      formData.sourceLocation === formData.destinationLocation
    ) {
      return 'Source and destination cannot be identical.';
    }

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
      from: { warehouse: formData.sourceWarehouse, location: formData.sourceLocation },
      to: { warehouse: formData.destinationWarehouse, location: formData.destinationLocation },
      items: formData.products.map((row) => ({
        product: row.product,
        quantity: Number(row.quantity),
        notes: ''
      }))
    });
  };

  const warehouseSelect = (id, label, field) => (
    <div className="form-group">
      <label htmlFor={id}>{label} *</label>
      <select
        id={id}
        className="form-control"
        value={field === 'sourceWarehouse' ? formData.sourceWarehouse : formData.destinationWarehouse}
        onChange={(e) => updateWarehouse(field, e.target.value)}
        disabled={loading}
      >
        <option value="">{loading ? 'Loading warehouses...' : `Select ${label.toLowerCase()}`}</option>
        {warehouses.map((warehouse) => (
          <option key={warehouse._id} value={warehouse._id}>
            {warehouse.name} ({warehouse.code})
          </option>
        ))}
      </select>
    </div>
  );

  const locationSelect = (id, label, field, options) => {
    const warehouseId =
      field === 'sourceLocation' ? formData.sourceWarehouse : formData.destinationWarehouse;

    return (
      <div className="form-group">
        <label htmlFor={id}>{label} *</label>
        <select
          id={id}
          className="form-control"
          value={field === 'sourceLocation' ? formData.sourceLocation : formData.destinationLocation}
          onChange={(e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }))}
          disabled={!warehouseId}
        >
          <option value="">{warehouseId ? `Select ${label.toLowerCase()}` : 'Select a warehouse first'}</option>
          {options.map((location) => (
            <option key={location.code} value={location.code}>
              {location.name} ({location.code})
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card transfer-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <ArrowRightLeft size={22} color="#6366f1" />
            <h3>Create Transfer</h3>
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

          <div className="transfer-form-grid">
            {warehouseSelect('sourceWarehouse', 'Source Warehouse', 'sourceWarehouse')}
            {warehouseSelect('destinationWarehouse', 'Destination Warehouse', 'destinationWarehouse')}
            {locationSelect('sourceLocation', 'Source Location', 'sourceLocation', sourceLocations)}
            {locationSelect(
              'destinationLocation',
              'Destination Location',
              'destinationLocation',
              destinationLocations
            )}
          </div>

          <div className="transfer-products-header">
            <h4>Products</h4>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addProductRow}>
              <Plus size={16} />
              <span>Add Product</span>
            </button>
          </div>

          <div className="transfer-product-list">
            {formData.products.map((row, index) => (
              <div key={`transfer-product-${index}`} className="transfer-product-row">
                <div className="form-group transfer-product-name">
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

                <div className="form-group transfer-qty">
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
                  className="btn-icon transfer-remove-btn"
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

export default TransferForm;
