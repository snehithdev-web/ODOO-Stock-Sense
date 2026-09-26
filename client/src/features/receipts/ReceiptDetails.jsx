import React from 'react';
import { CheckCircle2, XCircle, Package } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';

const ReceiptDetails = ({ receipt, onValidate, onCancel, loading = false }) => {
  if (!receipt) return null;

  const isDraft = receipt.statusValue === 'draft';
  const isDone = receipt.statusValue === 'done';

  return (
    <div className="modal-overlay" onClick={onCancel ? onCancel : undefined}>
      <div className="modal-card receipt-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Package size={22} color="#6366f1" />
            <h3>{receipt.reference}</h3>
          </div>
          <StatusBadge type={receipt.statusValue === 'done' ? 'success' : receipt.statusValue === 'canceled' ? 'danger' : 'default'}>
            {receipt.statusLabel}
          </StatusBadge>
        </div>

        <div className="receipt-details-content">
          <div className="receipt-summary-grid">
            <div className="detail-group">
              <span className="detail-label">Supplier</span>
              <strong>{receipt.supplier}</strong>
            </div>
            <div className="detail-group">
              <span className="detail-label">Warehouse</span>
              <strong>{receipt.warehouse}</strong>
            </div>
            <div className="detail-group">
              <span className="detail-label">Location</span>
              <strong>{receipt.location}</strong>
            </div>
            <div className="detail-group">
              <span className="detail-label">Created By</span>
              <strong>{receipt.createdBy}</strong>
            </div>
            <div className="detail-group">
              <span className="detail-label">Created Date</span>
              <strong>{new Date(receipt.createdAt).toLocaleDateString()}</strong>
            </div>
            <div className="detail-group">
              <span className="detail-label">Validated Date</span>
              <strong>{receipt.validatedAt ? new Date(receipt.validatedAt).toLocaleDateString() : 'Not yet validated'}</strong>
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
                {(receipt.items || []).map((item, index) => (
                  <tr key={`${item.productName}-${index}`}>
                    <td>{item.productName}</td>
                    <td className="font-mono">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="receipt-action-row">
            {isDraft && (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onValidate}
                  disabled={loading}
                >
                  <CheckCircle2 size={18} />
                  <span>{loading ? 'Validating...' : 'Validate'}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onCancel}
                  disabled={loading}
                >
                  <XCircle size={18} />
                  <span>Cancel</span>
                </button>
              </>
            )}

            {!isDraft && !isDone && (
              <div className="detail-note">This receipt cannot be validated again.</div>
            )}

            {isDone && (
              <div className="detail-note success-note">This receipt has already been validated and completed.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptDetails;
