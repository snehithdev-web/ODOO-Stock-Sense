import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Save, X, Plus, Trash2, AlertCircle } from 'lucide-react';
import { fetchProductsApi } from '../products/productApi';
import { getWarehouses } from '../warehouses/warehouseApi';

const defaultWarehouseOptions = ['Main Warehouse', 'Production Warehouse', 'North Hub', 'South Hub', 'Cold Storage'];
const defaultProductCatalog = ['Steel Rods', 'Cement', 'Wire Mesh', 'Pipe Fittings', 'Paint', 'Sandbags'];

const createEmptyRow = () => ({ product: '', quantity: 1 });

const TransferForm = ({ onClose, onSubmit, submitting = false }) => {
  const [formData, setFormData] = useState({
    sourceWarehouse: '',
    sourceLocation: '',
    destinationWarehouse: '',
    destinationLocation: '',
    products: [createEmptyRow()],
  });
  const [error, setError] = useState('');
  const [productCatalog, setProductCatalog] = useState(defaultProductCatalog);
  const [warehouseOptions, setWarehouseOptions] = useState(defaultWarehouseOptions);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [prodRes, whRes] = await Promise.all([
          fetchProductsApi({ limit: 100 }),
          getWarehouses(),
        ]);
        if (Array.isArray(prodRes?.data) && prodRes.data.length > 0) {
          setProductCatalog(prodRes.data.map((p) => p.name));
        }
        if (Array.isArray(whRes?.data) && whRes.data.length > 0) {
          setWarehouseOptions(whRes.data.map((w) => w.name));
        }
      } catch {
        // keep defaults
      }
    };
    loadOptions();
  }, []);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateProductRow = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.map((row, rowIndex) => {
        if (rowIndex !== index) return row;
        return { ...row, [field]: field === 'quantity' ? Number(value) || 0 : value };
      }),
    }));
  };

  const addProductRow = () => {
    setFormData((prev) => ({ ...prev, products: [...prev.products, createEmptyRow()] }));
  };

  const removeProductRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.length > 1 ? prev.products.filter((_, rowIndex) => rowIndex !== index) : [createEmptyRow()],
    }));
  };

  const validateForm = () => {
    if (!formData.sourceWarehouse.trim()) return 'Source warehouse is required.';
    if (!formData.sourceLocation.trim()) return 'Source location is required.';
    if (!formData.destinationWarehouse.trim()) return 'Destination warehouse is required.';
    if (!formData.destinationLocation.trim()) return 'Destination location is required.';
    if (formData.sourceWarehouse.trim() === formData.destinationWarehouse.trim()) {
      if (formData.sourceLocation.trim() === formData.destinationLocation.trim()) {
        return 'Source and destination cannot be identical.';
      }
    }
    if (!formData.products.length) return 'At least one product is required.';

    for (const row of formData.products) {
      if (!row.product.trim()) return 'Each product row must include a product.';
      if (!Number.isFinite(row.quantity) || Number(row.quantity) <= 0) return 'Each product quantity must be greater than zero.';
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationMessage = validateForm();
    setError(validationMessage);
    if (validationMessage) return;

    const payload = {
      from: {
        warehouse: formData.sourceWarehouse.trim(),
        location: formData.sourceLocation.trim().toUpperCase(),
      },
      to: {
        warehouse: formData.destinationWarehouse.trim(),
        location: formData.destinationLocation.trim().toUpperCase(),
      },
      items: formData.products.map((row) => ({
        product: row.product.trim(),
        quantity: Number(row.quantity),
      })),
    };

    await onSubmit(payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card transfer-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <ArrowRightLeft size={22} color="#6366f1" />
            <h3>Create Transfer</h3>
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

          <div className="transfer-form-grid">
            <div className="form-group">
              <label htmlFor="sourceWarehouse">Source Warehouse *</label>
              <select
                id="sourceWarehouse"
                className="form-control"
                value={formData.sourceWarehouse}
                onChange={(e) => updateField('sourceWarehouse', e.target.value)}
              >
                <option value="">Select source warehouse</option>
                {warehouseOptions.map((warehouse) => (
                  <option key={warehouse} value={warehouse}>{warehouse}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="destinationWarehouse">Destination Warehouse *</label>
              <select
                id="destinationWarehouse"
                className="form-control"
                value={formData.destinationWarehouse}
                onChange={(e) => updateField('destinationWarehouse', e.target.value)}
              >
                <option value="">Select destination warehouse</option>
                {warehouseOptions.map((warehouse) => (
                  <option key={warehouse} value={warehouse}>{warehouse}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="sourceLocation">Source Location *</label>
              <input
                id="sourceLocation"
                className="form-control"
                type="text"
                placeholder="e.g. Main Store"
                value={formData.sourceLocation}
                onChange={(e) => updateField('sourceLocation', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="destinationLocation">Destination Location *</label>
              <input
                id="destinationLocation"
                className="form-control"
                type="text"
                placeholder="e.g. Production Rack"
                value={formData.destinationLocation}
                onChange={(e) => updateField('destinationLocation', e.target.value)}
              />
            </div>
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
                  >
                    <option value="">Select product</option>
                    {productCatalog.map((product) => (
                      <option key={product} value={product}>{product}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group transfer-qty">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    min="1"
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

export default TransferForm;
