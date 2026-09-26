import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Save, X, AlertCircle } from 'lucide-react';
import { useReferenceData } from '../shared/useReferenceData';
import { getProductStock } from '../../services/inventoryApi';
import { ADJUSTMENT_REASON, ADJUSTMENT_REASON_LABELS } from '../../constants/operations';

/**
 * Create a stock adjustment: correcting the book record to a physical count.
 *
 * Submitted body, matching the API contract:
 *   { warehouse, location, reason, items: [{ product, countedQuantity }] }
 *
 * Only the counted quantity is sent. The recorded figure is read by the server
 * from the live ledger balance and re-read again at post time, because a client
 * cannot know what the book record says right now, and a count has to land on
 * the number that was physically counted even if stock moved while the document
 * sat in draft. The recorded balance is displayed here read-only, purely so the
 * operator can see what they are correcting.
 *
 * A count changes the book record, so these documents are manager only; a
 * warehouse_staff user receives a 403 from the API.
 */

const AdjustmentForm = ({ onClose, onSubmit, submitting = false }) => {
  const [formData, setFormData] = useState({
    product: '',
    warehouse: '',
    location: '',
    countedQuantity: '',
    reason: ADJUSTMENT_REASON.DAMAGE
  });
  const [recordedQuantity, setRecordedQuantity] = useState(null);
  const [error, setError] = useState('');
  const { warehouses, productOptions, locationsFor, loading, loadError } = useReferenceData();

  const locations = useMemo(
    () => locationsFor(formData.warehouse),
    [locationsFor, formData.warehouse]
  );

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateWarehouse = (warehouseId) => {
    setFormData((prev) => ({ ...prev, warehouse: warehouseId, location: '' }));
  };

  /**
   * Looks up what the ledger says is held at the chosen place, so the form can
   * show the operator the figure their count is being compared against.
   */
  useEffect(() => {
    let active = true;

    if (!formData.product) {
      setRecordedQuantity(null);
      return undefined;
    }

    const loadBalance = async () => {
      try {
        const stock = await getProductStock(formData.product);
        if (!active) return;

        const match = (stock.locations || []).find(
          (entry) =>
            entry.location === formData.location &&
            (!formData.warehouse || String(entry.warehouse?._id || entry.warehouse) === formData.warehouse)
        );

        setRecordedQuantity(match ? match.balance : 0);
      } catch {
        if (active) setRecordedQuantity(null);
      }
    };

    loadBalance();

    return () => {
      active = false;
    };
  }, [formData.product, formData.warehouse, formData.location]);

  const difference = useMemo(() => {
    if (recordedQuantity === null) return null;
    return Number(formData.countedQuantity) - recordedQuantity;
  }, [formData.countedQuantity, recordedQuantity]);

  const validateForm = () => {
    if (!formData.product) return 'Product is required.';
    if (!formData.warehouse) return 'Warehouse is required.';
    if (!formData.location) return 'Location is required.';

    if (formData.countedQuantity === '' || !Number.isFinite(Number(formData.countedQuantity))) {
      return 'Counted quantity is required and must be a valid number.';
    }

    if (Number(formData.countedQuantity) < 0) return 'Counted quantity cannot be negative.';

    if (recordedQuantity !== null && Number(formData.countedQuantity) === recordedQuantity) {
      return 'The count matches the recorded stock at that location. There is nothing to adjust.';
    }

    if (!formData.reason) return 'Reason is required.';

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
      warehouse: formData.warehouse,
      location: formData.location,
      reason: formData.reason,
      items: [
        {
          product: formData.product,
          countedQuantity: Number(formData.countedQuantity),
          notes: ''
        }
      ]
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card adjustment-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <ClipboardCheck size={22} color="#6366f1" />
            <h3>Create Adjustment</h3>
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

          <div className="adjustment-form-grid">
            <div className="form-group">
              <label htmlFor="product">Product *</label>
              <select
                id="product"
                className="form-control"
                value={formData.product}
                onChange={(e) => updateField('product', e.target.value)}
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

            <div className="form-group">
              <label htmlFor="recorded-readout">Recorded Quantity</label>
              <div className="difference-readout" id="recorded-readout">
                {recordedQuantity === null ? '-' : recordedQuantity}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="countedQuantity">Counted Quantity *</label>
              <input
                id="countedQuantity"
                className="form-control"
                type="number"
                min="0"
                step="any"
                value={formData.countedQuantity}
                onChange={(e) => updateField('countedQuantity', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="difference-readout">Difference</label>
              <div
                className={`difference-readout ${
                  difference > 0 ? 'positive' : difference < 0 ? 'negative' : ''
                }`}
                id="difference-readout"
              >
                {difference === null ? '-' : `${difference > 0 ? '+' : ''}${difference}`}
              </div>
            </div>

            <div className="form-group col-span-2">
              <label htmlFor="reason">Reason *</label>
              <select
                id="reason"
                className="form-control"
                value={formData.reason}
                onChange={(e) => updateField('reason', e.target.value)}
              >
                {Object.values(ADJUSTMENT_REASON).map((reason) => (
                  <option key={reason} value={reason}>
                    {ADJUSTMENT_REASON_LABELS[reason]}
                  </option>
                ))}
              </select>
            </div>
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

export default AdjustmentForm;
