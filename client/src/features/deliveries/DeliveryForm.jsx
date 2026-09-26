import React, { useState } from 'react';
import { PackagePlus, Save, X, Plus, Trash2, AlertCircle } from 'lucide-react';

const customerOptions = [
  'ABC Manufacturing',
  'North Ridge Traders',
  'BuildWell Materials',
  'Harbor Logistics',
  'BluePeak Retail',
];

const warehouseOptions = ['Main Warehouse', 'North Hub', 'South Hub', 'Cold Storage'];

const productCatalog = [
  'Steel Rods',
  'Cement',
  'Wire Mesh',
  'Pipe Fittings',
  'Paint',
  'Sandbags',
  'Industrial Fasteners',
];

const createEmptyRow = () => ({ product: '', quantity: 1, availableStock: 0 });

const DeliveryForm = ({ onClose, onSubmit, submitting = false }) => {
  const [formData, setFormData] = useState({
    customer: '',
    warehouse: '',
    sourceLocation: '',
    products: [createEmptyRow()],
  });
  const [error, setError] = useState('');

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateProductRow = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.map((row, rowIndex) => {
        if (rowIndex !== index) return row;

        const nextValue = field === 'quantity' ? Number(value) || 0 : value;
        const updatedRow = { ...row, [field]: nextValue };

        if (field === 'product') {
          const stockMap = {
            'Steel Rods': 100,
            Cement: 60,
            'Wire Mesh': 80,
            'Pipe Fittings': 45,
            Paint: 40,
            Sandbags: 32,
            'Industrial Fasteners': 55,
          };
          updatedRow.availableStock = stockMap[nextValue] || 0;
        }

        return updatedRow;
      }),
    }));
  };

  const addProductRow = () => {
    setFormData((prev) => ({
      ...prev,
      products: [...prev.products, createEmptyRow()],
    }));
  };

  const removeProductRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      products:
        prev.products.length > 1
          ? prev.products.filter((_, rowIndex) => rowIndex !== index)
          : [createEmptyRow()],
    }));
  };

  const validateForm = () => {
    if (!formData.customer.trim()) {
      return 'Customer is required.';
    }

    if (!formData.warehouse.trim()) {
      return 'Warehouse is required.';
    }

    if (!formData.sourceLocation.trim()) {
      return 'Source location is required.';
    }

    if (!formData.products.length) {
      return 'At least one product is required.';
    }

    for (const row of formData.products) {
      if (!row.product.trim()) {
        return 'Each product row must include a product.';
      }

      if (!Number.isFinite(row.quantity) || Number(row.quantity) <= 0) {
        return 'Each product quantity must be greater than zero.';
      }

      if (row.quantity > (row.availableStock || 0)) {
        return `Quantity for ${row.product} exceeds available stock.`;
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

    const payload = {
      customer: formData.customer.trim(),
      warehouse: formData.warehouse.trim(),
      sourceLocation: formData.sourceLocation.trim(),
      products: formData.products.map((row) => ({
        product: row.product.trim(),
        quantity: Number(row.quantity),
        availableStock: Number(row.availableStock) || 0,
      })),
      createdBy: 'Current User',
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
    };

    await onSubmit(payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card delivery-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <PackagePlus size={22} color="#6366f1" />
            <h3>Create Delivery Order</h3>
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

          <div className="delivery-form-grid">
            <div className="form-group">
              <label htmlFor="customer">Customer *</label>
              <select
                id="customer"
                className="form-control"
                value={formData.customer}
                onChange={(e) => updateField('customer', e.target.value)}
              >
                <option value="">Select customer</option>
                {customerOptions.map((customer) => (
                  <option key={customer} value={customer}>
                    {customer}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="warehouse">Warehouse *</label>
              <select
                id="warehouse"
                className="form-control"
                value={formData.warehouse}
                onChange={(e) => updateField('warehouse', e.target.value)}
              >
                <option value="">Select warehouse</option>
                {warehouseOptions.map((warehouse) => (
                  <option key={warehouse} value={warehouse}>
                    {warehouse}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group col-span-2">
              <label htmlFor="sourceLocation">Source Location *</label>
              <input
                id="sourceLocation"
                className="form-control"
                type="text"
                placeholder="e.g. Main Store, Dock 2, Picking Zone A"
                value={formData.sourceLocation}
                onChange={(e) => updateField('sourceLocation', e.target.value)}
              />
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
                  >
                    <option value="">Select product</option>
                    {productCatalog.map((product) => (
                      <option key={product} value={product}>
                        {product}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group delivery-qty">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={row.quantity}
                    onChange={(e) => updateProductRow(index, 'quantity', e.target.value)}
                  />
                </div>

                <div className="form-group delivery-stock">
                  <label>Available</label>
                  <div className="stock-readout">{row.availableStock || 0}</div>
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
            <button type="submit" disabled={submitting} className="btn btn-primary">
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
