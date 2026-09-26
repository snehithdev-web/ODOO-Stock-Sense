import React, { useMemo, useState, useEffect } from 'react';
import { ClipboardCheck, Save, X, AlertCircle } from 'lucide-react';
import { fetchProductsApi } from '../products/productApi';
import { getWarehouses } from '../warehouses/warehouseApi';

const defaultProductCatalog = ['Steel Rods', 'Cement', 'Wire Mesh', 'Pipe Fittings', 'Paint', 'Sandbags'];
const defaultWarehouseOptions = ['Main Warehouse', 'Production Warehouse', 'North Hub', 'South Hub'];

const AdjustmentForm = ({ onClose, onSubmit, submitting = false }) => {
  const [formData, setFormData] = useState({
    product: '',
    warehouse: '',
    location: '',
    recordedQuantity: '',
    physicalQuantity: '',
    reason: '',
  });
  const [error, setError] = useState('');
  const [productCatalog, setProductCatalog] = useState(defaultProductCatalog);
  const [warehouseOptions, setWarehouseOptions] = useState(defaultWarehouseOptions);
  const [productMap, setProductMap] = useState({});

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [prodRes, whRes] = await Promise.all([
          fetchProductsApi({ limit: 100 }),
          getWarehouses(),
        ]);
        if (Array.isArray(prodRes?.data) && prodRes.data.length > 0) {
          setProductCatalog(prodRes.data.map((p) => p.name));
          const map = {};
          prodRes.data.forEach((p) => {
            map[p.name] = p;
          });
          setProductMap(map);
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

  const difference = useMemo(() => {
    const recordedValue = Number(formData.recordedQuantity);
    const physicalValue = Number(formData.physicalQuantity);

    if (!Number.isFinite(recordedValue) || !Number.isFinite(physicalValue)) {
      return 0;
    }

    return physicalValue - recordedValue;
  }, [formData.physicalQuantity, formData.recordedQuantity]);

  const updateField = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'product' && productMap[value]) {
        next.recordedQuantity = productMap[value].quantity;
        next.location = productMap[value].location || 'Main Store';
      }
      return next;
    });
  };

  const validateForm = () => {
    if (!formData.product.trim()) return 'Product is required.';
    if (!formData.warehouse.trim()) return 'Warehouse is required.';
    if (!formData.location.trim()) return 'Location is required.';
    if (formData.recordedQuantity === '' || !Number.isFinite(Number(formData.recordedQuantity))) {
      return 'Recorded quantity is required and must be a valid number.';
    }
    if (formData.physicalQuantity === '' || !Number.isFinite(Number(formData.physicalQuantity))) {
      return 'Physical quantity is required and must be a valid number.';
    }
    if (Number(formData.recordedQuantity) < 0) return 'Recorded quantity cannot be negative.';
    if (Number(formData.physicalQuantity) < 0) return 'Physical quantity cannot be negative.';
    if (!formData.reason.trim()) return 'Reason is required.';

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationMessage = validateForm();
    setError(validationMessage);
    if (validationMessage) return;

    const payload = {
      product: formData.product.trim(),
      warehouse: formData.warehouse.trim(),
      location: formData.location.trim().toUpperCase(),
      recordedQuantity: Number(formData.recordedQuantity),
      physicalQuantity: Number(formData.physicalQuantity),
      countedQuantity: Number(formData.physicalQuantity),
      reason: formData.reason.trim().toLowerCase(),
    };

    await onSubmit(payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card adjustment-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <ClipboardCheck size={22} color="#6366f1" />
            <h3>Create Adjustment</h3>
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

          <div className="adjustment-form-grid">
            <div className="form-group">
              <label htmlFor="product">Product *</label>
              <select
                id="product"
                className="form-control"
                value={formData.product}
                onChange={(e) => updateField('product', e.target.value)}
              >
                <option value="">Select product</option>
                {productCatalog.map((product) => (
                  <option key={product} value={product}>{product}</option>
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
                  <option key={warehouse} value={warehouse}>{warehouse}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="location">Location *</label>
              <input
                id="location"
                className="form-control"
                type="text"
                placeholder="e.g. Main Store"
                value={formData.location}
                onChange={(e) => updateField('location', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="difference-readout">Difference</label>
              <div className={`difference-readout ${difference > 0 ? 'positive' : difference < 0 ? 'negative' : ''}`} id="difference-readout">
                {difference > 0 ? '+' : ''}
                {difference}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="recordedQuantity">Recorded Quantity *</label>
              <input
                id="recordedQuantity"
                className="form-control"
                type="number"
                min="0"
                step="1"
                value={formData.recordedQuantity}
                onChange={(e) => updateField('recordedQuantity', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="physicalQuantity">Physical Quantity *</label>
              <input
                id="physicalQuantity"
                className="form-control"
                type="number"
                min="0"
                step="1"
                value={formData.physicalQuantity}
                onChange={(e) => updateField('physicalQuantity', e.target.value)}
              />
            </div>

            <div className="form-group col-span-2">
              <label htmlFor="reason">Reason *</label>
              <textarea
                id="reason"
                className="form-control form-textarea"
                rows="3"
                placeholder="Describe why the physical quantity differs from the recorded quantity."
                value={formData.reason}
                onChange={(e) => updateField('reason', e.target.value)}
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

export default AdjustmentForm;
