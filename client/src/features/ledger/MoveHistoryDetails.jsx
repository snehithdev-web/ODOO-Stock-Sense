import React from 'react';
import { Activity, Clock3 } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';

const MoveHistoryDetails = ({ movement, onClose }) => {
  if (!movement) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card ledger-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Activity size={22} color="#6366f1" />
            <h3>{movement.reference}</h3>
          </div>
          <StatusBadge type={movement.status === 'DONE' ? 'success' : 'danger'}>{movement.status}</StatusBadge>
        </div>

        <div className="ledger-details-content">
          <div className="ledger-summary-grid">
            <div className="detail-group">
              <span className="detail-label">Movement Type</span>
              <strong>{movement.movementType}</strong>
            </div>
            <div className="detail-group">
              <span className="detail-label">Product</span>
              <strong>{movement.product}</strong>
            </div>
            <div className="detail-group">
              <span className="detail-label">Quantity</span>
              <strong>{movement.quantity}</strong>
            </div>
            <div className="detail-group">
              <span className="detail-label">Warehouse</span>
              <strong>{movement.warehouse}</strong>
            </div>
            <div className="detail-group">
              <span className="detail-label">From Location</span>
              <strong>{movement.fromLocation}</strong>
            </div>
            <div className="detail-group">
              <span className="detail-label">To Location</span>
              <strong>{movement.toLocation}</strong>
            </div>
            <div className="detail-group">
              <span className="detail-label">Performed By</span>
              <strong>{movement.performedBy}</strong>
            </div>
            <div className="detail-group">
              <span className="detail-label">Date / Time</span>
              <strong>{new Date(movement.date).toLocaleString()}</strong>
            </div>
          </div>

          {movement.movementType === 'ADJUSTMENT' && (
            <>
              <div className="details-section-title">Adjustment Details</div>
              <div className="ledger-summary-grid">
                <div className="detail-group">
                  <span className="detail-label">Recorded Quantity</span>
                  <strong>{movement.recordedQuantity}</strong>
                </div>
                <div className="detail-group">
                  <span className="detail-label">Physical Quantity</span>
                  <strong>{movement.physicalQuantity}</strong>
                </div>
                <div className="detail-group">
                  <span className="detail-label">Difference</span>
                  <strong>{movement.difference}</strong>
                </div>
                <div className="detail-group col-span-2">
                  <span className="detail-label">Reason</span>
                  <strong>{movement.reason}</strong>
                </div>
              </div>
            </>
          )}

          {movement.movementType === 'TRANSFER' && (
            <>
              <div className="details-section-title">Transfer Details</div>
              <div className="ledger-summary-grid">
                <div className="detail-group">
                  <span className="detail-label">Source Warehouse</span>
                  <strong>{movement.sourceWarehouse}</strong>
                </div>
                <div className="detail-group">
                  <span className="detail-label">Destination Warehouse</span>
                  <strong>{movement.destinationWarehouse}</strong>
                </div>
                <div className="detail-group">
                  <span className="detail-label">Source Location</span>
                  <strong>{movement.sourceLocation}</strong>
                </div>
                <div className="detail-group">
                  <span className="detail-label">Destination Location</span>
                  <strong>{movement.destinationLocation}</strong>
                </div>
              </div>
            </>
          )}

          {movement.movementType === 'RECEIPT' && (
            <div className="detail-group">
              <span className="detail-label">Supplier</span>
              <strong>{movement.supplier}</strong>
            </div>
          )}

          {movement.movementType === 'DELIVERY' && (
            <div className="detail-group">
              <span className="detail-label">Customer</span>
              <strong>{movement.customer}</strong>
            </div>
          )}

          <div className="detail-note mt-4">
            <Clock3 size={16} />
            <span>Movement captured on {new Date(movement.date).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoveHistoryDetails;
