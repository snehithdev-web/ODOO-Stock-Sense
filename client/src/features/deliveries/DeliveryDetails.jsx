import React from 'react';
import { Package, CheckCircle2, XCircle, Truck, PackageCheck } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';

const DeliveryDetails = ({ delivery, onPick, onPack, onValidate, onCancel, loading = false }) => {
  if (!delivery) return null;

  const isDraft = delivery.status === 'DRAFT';
  const isReady = delivery.status === 'READY';
  const isPicked = delivery.status === 'PICKED';
  const isPacked = delivery.status === 'PACKED';
  const isDone = delivery.status === 'DONE';

  return (
    <div className="modal-overlay" onClick={onCancel ? onCancel : undefined}>
      <div className="modal-card delivery-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Package size={22} color="#6366f1" />
            <h3>{delivery.reference}</h3>
          </div>
          <StatusBadge
            type={
              delivery.status === 'DONE'
                ? 'success'
                : delivery.status === 'CANCELED'
                  ? 'danger'
                  : delivery.status === 'PACKED'
                    ? 'info'
                    : 'default'
            }
          >
            {delivery.status}
          </StatusBadge>
        </div>

        <div className="delivery-details-content">
          <div className="delivery-summary-grid">
            <div className="detail-group">
              <span className="detail-label">Customer</span>
              <strong>{delivery.customer}</strong>
            </div>
            <div className="detail-group">
              <span className="detail-label">Warehouse</span>
              <strong>{delivery.warehouse}</strong>
            </div>
            <div className="detail-group">
              <span className="detail-label">Source Location</span>
              <strong>{delivery.sourceLocation}</strong>
            </div>
            <div className="detail-group">
              <span className="detail-label">Created By</span>
              <strong>{delivery.createdBy}</strong>
            </div>
            <div className="detail-group">
              <span className="detail-label">Created Date</span>
              <strong>{new Date(delivery.createdAt).toLocaleDateString()}</strong>
            </div>
            <div className="detail-group">
              <span className="detail-label">Validated Date</span>
              <strong>{delivery.validatedAt ? new Date(delivery.validatedAt).toLocaleDateString() : 'Not yet validated'}</strong>
            </div>
          </div>

          <div className="details-section-title">Products</div>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Available</th>
                </tr>
              </thead>
              <tbody>
                {(delivery.products || []).map((item, index) => (
                  <tr key={`${item.product}-${index}`}>
                    <td>{item.product}</td>
                    <td className="font-mono">{item.quantity}</td>
                    <td className="font-mono">{item.availableStock || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="delivery-action-row">
            {isDraft && (
              <>
                <button type="button" className="btn btn-primary" onClick={onPick} disabled={loading}>
                  <Truck size={18} />
                  <span>{loading ? 'Picking...' : 'Pick'}</span>
                </button>
                <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
                  <XCircle size={18} />
                  <span>Cancel</span>
                </button>
              </>
            )}

            {isReady && (
              <button type="button" className="btn btn-primary" onClick={onPick} disabled={loading}>
                <Truck size={18} />
                <span>{loading ? 'Picking...' : 'Pick'}</span>
              </button>
            )}

            {isPicked && (
              <button type="button" className="btn btn-primary" onClick={onPack} disabled={loading}>
                <PackageCheck size={18} />
                <span>{loading ? 'Packing...' : 'Pack'}</span>
              </button>
            )}

            {isPacked && (
              <button type="button" className="btn btn-primary" onClick={onValidate} disabled={loading}>
                <CheckCircle2 size={18} />
                <span>{loading ? 'Validating...' : 'Validate'}</span>
              </button>
            )}

            {isDone && (
              <div className="detail-note success-note">This delivery has already been validated and completed.</div>
            )}

            {delivery.status === 'CANCELED' && (
              <div className="detail-note">This delivery was canceled and cannot be processed further.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDetails;
