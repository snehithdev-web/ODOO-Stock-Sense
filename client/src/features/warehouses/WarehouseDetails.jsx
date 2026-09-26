import React from 'react';
import { Building2, Pencil, Plus } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';

const WarehouseDetails = ({ warehouse, onAddLocation, onEditLocation, onClose }) => {
  if (!warehouse) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card warehouse-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Building2 size={22} color="#6366f1" />
            <h3>{warehouse.name}</h3>
          </div>
          <StatusBadge type={warehouse.status === 'ACTIVE' ? 'success' : 'default'}>{warehouse.status}</StatusBadge>
        </div>

        <div className="warehouse-details-content">
          <div className="warehouse-summary-grid">
            <div className="detail-group">
              <span className="detail-label">Warehouse Code</span>
              <strong>{warehouse.code}</strong>
            </div>
            <div className="detail-group">
              <span className="detail-label">Locations</span>
              <strong>{warehouse.locations?.length || 0}</strong>
            </div>
          </div>

          <div className="details-section-title">Locations</div>
          <div className="warehouse-location-list-details">
            {(warehouse.locations || []).map((location) => (
              <div key={location._id} className="warehouse-location-card">
                <div>
                  <div className="location-name">{location.name}</div>
                  <div className="location-code">{location.code}</div>
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => onEditLocation(location)}>
                  <Pencil size={14} />
                  <span>Edit</span>
                </button>
              </div>
            ))}
          </div>

          <div className="warehouse-action-row">
            <button type="button" className="btn btn-primary" onClick={onAddLocation}>
              <Plus size={18} />
              <span>Add Location</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarehouseDetails;
