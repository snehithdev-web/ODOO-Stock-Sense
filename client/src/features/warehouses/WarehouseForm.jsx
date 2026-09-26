import React, { useState } from 'react';
import { Building2, Save, X, Plus, Trash2, AlertCircle } from 'lucide-react';

const createEmptyLocation = () => ({ name: '', code: '' });

const WarehouseForm = ({ warehouse = null, onClose, onSubmit, submitting = false }) => {
  const [formData, setFormData] = useState({
    name: warehouse?.name || '',
    code: warehouse?.code || '',
    status: warehouse?.status || 'ACTIVE',
    locations: warehouse?.locations?.length ? warehouse.locations : [createEmptyLocation()],
  });
  const [error, setError] = useState('');

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateLocationRow = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      locations: prev.locations.map((row, rowIndex) => {
        if (rowIndex !== index) return row;
        return { ...row, [field]: value };
      }),
    }));
  };

  const addLocationRow = () => {
    setFormData((prev) => ({
      ...prev,
      locations: [...prev.locations, createEmptyLocation()],
    }));
  };

  const removeLocationRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      locations:
        prev.locations.length > 1
          ? prev.locations.filter((_, rowIndex) => rowIndex !== index)
          : [createEmptyLocation()],
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Warehouse name is required.';
    if (!formData.code.trim()) return 'Warehouse code is required.';

    for (const row of formData.locations) {
      if (!row.name.trim()) return 'Location name is required when creating a location.';
      if (!row.code.trim()) return 'Location code is required when creating a location.';
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
      name: formData.name.trim(),
      code: formData.code.trim(),
      status: formData.status,
      locations: formData.locations.map((row) => ({
        name: row.name.trim(),
        code: row.code.trim(),
      })),
    };

    await onSubmit(payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card warehouse-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Building2 size={22} color="#6366f1" />
            <h3>{warehouse ? 'Edit Warehouse' : 'Add Warehouse'}</h3>
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

          <div className="warehouse-form-grid">
            <div className="form-group">
              <label htmlFor="warehouseName">Warehouse Name *</label>
              <input
                id="warehouseName"
                className="form-control"
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="warehouseCode">Warehouse Code *</label>
              <input
                id="warehouseCode"
                className="form-control"
                type="text"
                value={formData.code}
                onChange={(e) => updateField('code', e.target.value)}
              />
            </div>
          </div>

          <div className="transfer-products-header">
            <h4>Locations</h4>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addLocationRow}>
              <Plus size={16} />
              <span>Add Location</span>
            </button>
          </div>

          <div className="warehouse-location-list">
            {formData.locations.map((row, index) => (
              <div key={`warehouse-location-${index}`} className="warehouse-location-row">
                <div className="form-group warehouse-location-name">
                  <label>Location Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={row.name}
                    onChange={(e) => updateLocationRow(index, 'name', e.target.value)}
                  />
                </div>

                <div className="form-group warehouse-location-code">
                  <label>Location Code *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={row.code}
                    onChange={(e) => updateLocationRow(index, 'code', e.target.value)}
                  />
                </div>

                <button
                  type="button"
                  className="btn-icon transfer-remove-btn"
                  aria-label="Remove location"
                  onClick={() => removeLocationRow(index)}
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
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WarehouseForm;
