import React, { useState, useEffect } from 'react';
import { PackagePlus, Save, X, Plus, Trash2, AlertCircle } from 'lucide-react';
import { fetchProductsApi } from '../products/productApi';
import { getWarehouses } from '../warehouses/warehouseApi';

const supplierOptions = [
  'ABC Steel Suppliers',
  'BuildWell Materials',
  'Metro Supply Co.',
  'North Ridge Traders',
  'Global Hardware Group',
];

const defaultWarehouseOptions = ['Main Warehouse', 'North Hub', 'South Hub', 'Cold Storage'];

const defaultProducts = [
  'Steel Rods',
  'Cement',
  'Wire Mesh',
  'Pipe Fittings',
  'Paint',
  'Sandbags',
  'Industrial Fasteners',
];

const createEmptyRow = () => ({ product: '', quantity: 1 });

const ReceiptForm = ({ onClose, onSubmit, submitting = false }) => {
  const [formData, setFormData] = useState({
    supplier: '',
    warehouse: '',
    location: '',
    products: [createEmptyRow()],
  });
  const [error, setError] = useState('');
  const [availableProducts, setAvailableProducts] = useState(defaultProducts);
  const [warehouseList, setWarehouseList] = useState(defaultWarehouseOptions);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [prodRes, whRes] = await Promise.all([
          fetchProductsApi({ limit: 100 }),
          getWarehouses(),
        ]);
        if (Array.isArray(prodRes?.data) && prodRes.data.length > 0) {
          setAvailableProducts(prodRes.data.map((p) => p.name));
        }
        if (Array.isArray(whRes?.data) && whRes.data.length > 0) {
          setWarehouseList(whRes.data.map((w) => w.name));
        }
      } catch {
        // keep fallback options
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
      products: prev.products.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [field]: field === 'quantity' ? Number(value) || 0 : value,
            }
          : row
      ),
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
      products: prev.products.length > 1 ? prev.products.filter((_, rowIndex) => rowIndex !== index) : [createEmptyRow()],
    }));
  };

  const validateForm = () => {
    if (!formData.supplier.trim()) {
      return 'Supplier is required.';
    }

    if (!formData.warehouse.trim()) {
      return 'Warehouse is required.';
    }

    if (!formData.location.trim()) {
      return 'Location is required.';
    }

    if (!formData.products.length) {
      return 'Add at least one product.';
    }

    for (const row of formData.products) {
      if (!row.product.trim()) {
        return 'Each product row must include a product.';
      }
      if (!Number.isFinite(row.quantity) || Number(row.quantity) <= 0) {
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

    const payload = {
      supplier: { name: formData.supplier.trim() },
      warehouse: formData.warehouse.trim(),
      location: formData.location.trim().toUpperCase(),
      items: formData.products.map((row) => ({
        product: row.product.trim(),
        quantity: Number(row.quantity),
      })),
    };

    await onSubmit(payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card receipt-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <PackagePlus size={22} color="#6366f1" />
            <h3>Create Receipt</h3>
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

          <div className="receipt-form-grid">
            <div className="form-group">
              <label htmlFor="supplier">Supplier *</label>
              <select
                id="supplier"
                className="form-control"
                value={formData.supplier}
                onChange={(e) => updateField('supplier', e.target.value)}
              >
                <option value="">Select supplier</option>
                {supplierOptions.map((supplier) => (
                  <option key={supplier} value={supplier}>
                    {supplier}
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
                {warehouseList.map((warehouse) => (
                  <option key={warehouse} value={warehouse}>
                    {warehouse}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group col-span-2">
              <label htmlFor="location">Location *</label>
              <input
                id="location"
                className="form-control"
                type="text"
                placeholder="e.g. Main Store, Receiving Bay A"
                value={formData.location}
                onChange={(e) => updateField('location', e.target.value)}
              />
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
                  >
                    <option value="">Select product</option>
                    {availableProducts.map((product) => (
                      <option key={product} value={product}>
                        {product}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group receipt-qty">
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

export default ReceiptForm;
