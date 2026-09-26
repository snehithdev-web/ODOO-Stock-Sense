import React from 'react';
import { ClipboardCheck, CheckCircle2, XCircle } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';

const AdjustmentDetails = ({ adjustment, onApply, onCancel, loading = false }) => {
  if (!adjustment) return null;

  const difference = Number(adjustment.difference ?? 0);
  const isActionable = adjustment.status !== 'DONE' && adjustment.status !== 'CANCELED';

  return (
    <div className="modal-overlay" onClick={onCancel ? onCancel : undefined}>
      <div className="modal-card adjustment-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <ClipboardCheck size={22} color="#6366f1" />
            <h3>{adjustment.reference}</h3>
          </div>
          <StatusBadge type={adjustment.status === 'DONE' ? 'success' : adjustment.status === 'CANCELED' ? 'danger' : 'default'}>
            {adjustment.status}
          </StatusBadge>
        </div>

        <div className="adjustment-details-content">
          <div className="adjustment-summary-grid">
            <div className="detail-group">
              <span className="detail-label">Product</span>
              <strong>{adjustment.product}</strong>
            </div>
            <div className="detail-group">
              <span className="detail-label">Warehouse</span>
              <strong>{adjustment.warehouse}</strong>
            </div>
            <div className="detail-group">
              <span className="detail-label">Location</span>
              <strong>{adjustment.location}</strong>
            </div>
            <div className="detail-group">
              <span className="detail-label">Difference</span>
              <strong className={difference > 0 ? 'text-success' : difference < 0 ? 'text-danger' : ''}>
                {difference > 0 ? '+' : ''}
                {difference}
              </strong>
            </div>
            <div className="detail-group">
              <span className="detail-label">Recorded Quantity</span>
              <strong>{adjustment.recordedQuantity}</strong>
            </div>
            <div className="detail-group">
              <span className="detail-label">Physical Quantity</span>
              <strong>{adjustment.physicalQuantity}</strong>
            </div>
            <div className="detail-group col-span-2">
              <span className="detail-label">Reason</span>
              <strong>{adjustment.reason}</strong>
            </div>
            <div className="detail-group">
              <span className="detail-label">Created By</span>
              <strong>{adjustment.createdBy}</strong>
            </div>
            <div className="detail-group">
              <span className="detail-label">Completed Date</span>
              <strong>{adjustment.completedAt ? new Date(adjustment.completedAt).toLocaleDateString() : 'Not completed yet'}</strong>
            </div>
          </div>

          <div className="adjustment-action-row">
            {adjustment.status === 'DRAFT' && (
              <button type="button" className="btn btn-primary" onClick={onApply} disabled={loading || !isActionable}>
                <CheckCircle2 size={18} />
                <span>{loading ? 'Applying...' : 'Apply Adjustment'}</span>
              </button>
            )}

            {adjustment.status === 'DONE' && (
              <div className="detail-note success-note">This adjustment has already been applied and no further action is required.</div>
            )}

            {adjustment.status === 'CANCELED' && (
              <div className="detail-note">This adjustment was canceled and cannot be processed further.</div>
            )}

            {isActionable && (
              <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
                <XCircle size={18} />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdjustmentDetails;
