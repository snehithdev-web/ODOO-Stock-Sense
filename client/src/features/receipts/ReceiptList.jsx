import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Plus, Search, Trash2, RefreshCw, Eye, CheckCircle2, PackageX } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import ReceiptForm from './ReceiptForm';
import ReceiptDetails from './ReceiptDetails';
import { cancelReceipt, createReceipt, getReceipts, validateReceipt } from './receiptsApi';

const ReceiptList = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadReceipts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getReceipts();
      const data = Array.isArray(response?.data) ? response.data : [];
      setReceipts(data);
    } catch (err) {
      setError(err.message || 'Failed to load receipts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  const handleCreateReceipt = async (payload) => {
    try {
      setActionLoading(true);
      const response = await createReceipt(payload);
      const created = response?.data || payload;
      setReceipts((current) => [created, ...current]);
      setShowForm(false);
    } catch (err) {
      setError(err.message || 'Failed to save receipt');
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidate = async (id) => {
    try {
      setActionLoading(true);
      const response = await validateReceipt(id);
      const updated = response?.data;
      setReceipts((current) =>
        current.map((receipt) => (receipt._id === id ? { ...receipt, ...updated } : receipt))
      );
      setSelectedReceipt((current) => (current && current._id === id ? { ...current, ...updated } : current));
    } catch (err) {
      setError(err.message || 'Failed to validate receipt');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (id) => {
    const target = receipts.find((receipt) => receipt._id === id);
    if (!target) return;

    if (!window.confirm(`Cancel receipt ${target.reference}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await cancelReceipt(id);
      const updated = response?.data;
      setReceipts((current) =>
        current.map((receipt) => (receipt._id === id ? { ...receipt, ...updated } : receipt))
      );
      setSelectedReceipt((current) => (current && current._id === id ? { ...current, ...updated } : current));
    } catch (err) {
      setError(err.message || 'Failed to cancel receipt');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="receipt-list-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Receipts</h1>
          <p className="page-subtitle">Manage incoming goods and update inventory.</p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          <span>Create Receipt</span>
        </button>
      </div>

      <div className="toolbar-card">
        <div className="toolbar-left">
          <div className="input-with-icon search-input">
            <Search size={18} className="input-icon" />
            <input
              type="text"
              placeholder="Search receipt or supplier..."
              className="form-control"
              value=""
              readOnly
            />
          </div>
        </div>

        <button className="btn btn-secondary btn-icon-only" title="Refresh receipts" onClick={loadReceipts}>
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex-center py-12">
          <div className="spinner"></div>
        </div>
      ) : receipts.length === 0 ? (
        <div className="empty-state-card">
          <PackageX size={48} color="#94a3b8" />
          <h3>No receipts found</h3>
          <p>Create your first incoming goods receipt to begin tracking stock.</p>
          <button className="btn btn-primary mt-4" onClick={() => setShowForm(true)}>
            <Plus size={18} />
            <span>Create First Receipt</span>
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Supplier</th>
                <th>Items</th>
                <th>Warehouse / Location</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((receipt) => (
                <tr key={receipt._id}>
                  <td>
                    <span className="font-mono sku-badge">{receipt.reference}</span>
                  </td>
                  <td>{receipt.supplier}</td>
                  <td>
                    <div className="receipt-items-cell">
                      {receipt.products && receipt.products.length > 0 ? (
                        receipt.products.map((item, index) => (
                          <span key={`${item.product}-${index}`} className="receipt-item-chip">
                            {item.product} × {item.quantity}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted">No items</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="receipt-location-cell">
                      <strong>{receipt.warehouse}</strong>
                      <span>{receipt.location}</span>
                    </div>
                  </td>
                  <td>
                    <StatusBadge
                      type={
                        receipt.status === 'DONE'
                          ? 'success'
                          : receipt.status === 'CANCELED'
                            ? 'danger'
                            : 'default'
                      }
                    >
                      {receipt.status}
                    </StatusBadge>
                  </td>
                  <td>{new Date(receipt.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn-action btn-action-view"
                        title="View Details"
                        onClick={() => setSelectedReceipt(receipt)}
                      >
                        <Eye size={16} />
                      </button>

                      {receipt.status === 'DRAFT' && (
                        <button
                          className="btn-action btn-action-edit"
                          title="Validate receipt"
                          onClick={() => handleValidate(receipt._id)}
                          disabled={actionLoading}
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}

                      {receipt.status !== 'CANCELED' && (
                        <button
                          className="btn-action btn-action-delete"
                          title="Cancel receipt"
                          onClick={() => handleCancel(receipt._id)}
                          disabled={actionLoading}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ReceiptForm
          onClose={() => setShowForm(false)}
          onSubmit={handleCreateReceipt}
          submitting={actionLoading}
        />
      )}

      {selectedReceipt && (
        <ReceiptDetails
          receipt={selectedReceipt}
          loading={actionLoading}
          onValidate={() => handleValidate(selectedReceipt._id)}
          onCancel={() => {
            setSelectedReceipt(null);
            handleCancel(selectedReceipt._id);
          }}
        />
      )}
    </div>
  );
};

export default ReceiptList;
