import React from 'react';
import { ArrowRightLeft, CheckCircle2, XCircle } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';

const TransferDetails = ({ transfer, onProcess, onCancel, loading = false }) => {
  if (!transfer) return null;

  const canProcess = transfer.status !== 'DONE' && transfer.status !== 'CANCELED';

  return (
    <div className="modal-overlay" onClick={onCancel ? onCancel : undefined}>
      <div className="modal-card transfer-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <ArrowRightLeft size={22} color="#6366f1" />
            <h3>{transfer.reference}</h3>
          </div>
          <StatusBadge
            type={
              transfer.statusValue === 'done' ? 'success' : transfer.statusValue === 'canceled' ? 'danger' : 'default'
            }
          >
            {transfer.statusLabel}
          </StatusBadge>
        </div>

        <div className="transfer-details-content">
          <div className="transfer-summary-grid">
            <div className="detail-group">
              <span className="detail-label">Source Warehouse</span>
              <strong>{transfer.sourceWarehouse}</strong>
            </div>
            <div className="detail-group">
              <span className="detail-label">Destination Warehouse</span>
              <strong>{transfer.destinationWarehouse}</strong>
            </div>
            <div className="detail-group">
              <span className="detail-label">Source Location</span>
              <strong>{transfer.from?.location}</strong>
            </div>
            <div className="detail-group">
              <span className="detail-label">Destination Location</span>
              <strong>{transfer.to?.location}</strong>
            </div>
            <div className="detail-group">
              <span className="detail-label">Created By</span>
              <strong>{transfer.createdBy}</strong>
            </div>
            <div className="detail-group">
              <span className="detail-label">Completed Date</span>
              <strong>{transfer.completedAt ? new Date(transfer.completedAt).toLocaleDateString() : 'Not completed yet'}</strong>
            </div>
          </div>

          <div className="details-section-title">Products</div>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {(transfer.items || []).map((item, index) => (
                  <tr key={`${item.productName}-${index}`}>
                    <td>{item.productName}</td>
                    <td className="font-mono">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="transfer-action-row">
            {transfer.statusValue === 'draft' && (
              <button type="button" className="btn btn-primary" onClick={onProcess} disabled={loading || !canProcess}>
                <CheckCircle2 size={18} />
                <span>{loading ? 'Processing...' : 'Confirm / Process'}</span>
              </button>
            )}

            {transfer.statusValue === 'ready' && (
              <button type="button" className="btn btn-primary" onClick={onProcess} disabled={loading || !canProcess}>
                <CheckCircle2 size={18} />
                <span>{loading ? 'Processing...' : 'Confirm / Process'}</span>
              </button>
            )}

            {transfer.statusValue === 'done' && (
              <div className="detail-note success-note">This transfer has already been completed and no further action is required.</div>
            )}

            {transfer.statusValue === 'canceled' && (
              <div className="detail-note">This transfer was canceled and cannot be processed further.</div>
            )}

            {canProcess && (
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

export default TransferDetails;
