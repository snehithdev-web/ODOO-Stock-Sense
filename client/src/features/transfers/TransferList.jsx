import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ArrowRightLeft, Eye, Plus, Search, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import TransferForm from './TransferForm';
import TransferDetails from './TransferDetails';
import { cancelTransfer, createTransfer, getTransfers, validateTransfer } from './transferApi';

const TransferList = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadTransfers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getTransfers();
      const data = Array.isArray(response?.data) ? response.data : [];
      setTransfers(data);
    } catch (err) {
      setError(err.message || 'Failed to load internal transfers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransfers();
  }, [loadTransfers]);

  const handleCreateTransfer = async (payload) => {
    try {
      setActionLoading(true);
      const response = await createTransfer(payload);
      const created = response?.data || payload;
      setTransfers((current) => [created, ...current]);
      setShowForm(false);
    } catch (err) {
      setError(err.message || 'Failed to save transfer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcess = async (id) => {
    try {
      setActionLoading(true);
      const response = await validateTransfer(id);
      const updated = response?.data;
      setTransfers((current) => current.map((transfer) => (transfer._id === id ? { ...transfer, ...updated } : transfer)));
      setSelectedTransfer((current) => (current && current._id === id ? { ...current, ...updated } : current));
    } catch (err) {
      setError(err.message || 'Failed to process transfer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (id) => {
    const target = transfers.find((transfer) => transfer._id === id);
    if (!target) return;

    if (!window.confirm(`Cancel transfer ${target.reference}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await cancelTransfer(id);
      const updated = response?.data;
      setTransfers((current) => current.map((transfer) => (transfer._id === id ? { ...transfer, ...updated } : transfer)));
      setSelectedTransfer((current) => (current && current._id === id ? { ...current, ...updated } : current));
    } catch (err) {
      setError(err.message || 'Failed to cancel transfer');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="transfer-list-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Internal Transfers</h1>
          <p className="page-subtitle">Move stock between warehouses and locations.</p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          <span>Create Transfer</span>
        </button>
      </div>

      <div className="toolbar-card">
        <div className="toolbar-left">
          <div className="input-with-icon search-input">
            <Search size={18} className="input-icon" />
            <input type="text" placeholder="Search transfer or item..." className="form-control" value="" readOnly />
          </div>
        </div>

        <button className="btn btn-secondary btn-icon-only" title="Refresh transfers" onClick={loadTransfers}>
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
      ) : transfers.length === 0 ? (
        <div className="empty-state-card">
          <ArrowRightLeft size={48} color="#94a3b8" />
          <h3>No transfer records found</h3>
          <p>Create the first transfer to move inventory between warehouse locations.</p>
          <button className="btn btn-primary mt-4" onClick={() => setShowForm(true)}>
            <Plus size={18} />
            <span>Create Transfer</span>
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Product / Items</th>
                <th>Source</th>
                <th>Destination</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((transfer) => {
                const totalQuantity = (transfer.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);

                return (
                  <tr key={transfer._id}>
                    <td>
                      <span className="font-mono sku-badge">{transfer.reference}</span>
                    </td>
                    <td>
                      <div className="transfer-items-cell">
                        {(transfer.items || []).map((item, index) => (
                          <span key={`${item.productName}-${index}`} className="receipt-item-chip">
                            {item.product} × {item.quantity}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="receipt-location-cell">
                        <strong>{transfer.from?.warehouse}</strong>
                        <span>{transfer.from?.location}</span>
                      </div>
                    </td>
                    <td>
                      <div className="receipt-location-cell">
                        <strong>{transfer.to?.warehouse}</strong>
                        <span>{transfer.to?.location}</span>
                      </div>
                    </td>
                    <td className="font-mono">{totalQuantity}</td>
                    <td>
                      <StatusBadge type={transfer.statusValue === 'done' ? 'success' : transfer.statusValue === 'canceled' ? 'danger' : 'default'}>
                        {transfer.statusLabel}
                      </StatusBadge>
                    </td>
                    <td>{new Date(transfer.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-action btn-action-view" title="View details" onClick={() => setSelectedTransfer(transfer)}>
                          <Eye size={16} />
                        </button>

                        {(transfer.statusValue === 'draft' || transfer.statusValue === 'ready') && (
                          <button className="btn-action btn-action-edit" title="Process transfer" onClick={() => handleProcess(transfer._id)} disabled={actionLoading}>
                            <CheckCircle2 size={16} />
                          </button>
                        )}

                        {transfer.status !== 'DONE' && transfer.status !== 'CANCELED' && (
                          <button className="btn-action btn-action-delete" title="Cancel transfer" onClick={() => handleCancel(transfer._id)} disabled={actionLoading}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <TransferForm onClose={() => setShowForm(false)} onSubmit={handleCreateTransfer} submitting={actionLoading} />
      )}

      {selectedTransfer && (
        <TransferDetails
          transfer={selectedTransfer}
          loading={actionLoading}
          onProcess={() => handleProcess(selectedTransfer._id)}
          onCancel={() => {
            setSelectedTransfer(null);
            handleCancel(selectedTransfer._id);
          }}
        />
      )}
    </div>
  );
};

export default TransferList;
