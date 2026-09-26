import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ClipboardCheck, Eye, Plus, Search, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import AdjustmentForm from './AdjustmentForm';
import AdjustmentDetails from './AdjustmentDetails';
import { cancelAdjustment, createAdjustment, getAdjustments, validateAdjustment } from './adjustmentApi';

const AdjustmentList = () => {
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadAdjustments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getAdjustments();
      const data = Array.isArray(response?.data) ? response.data : [];
      setAdjustments(data);
    } catch (err) {
      setError(err.message || 'Failed to load inventory adjustments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdjustments();
  }, [loadAdjustments]);

  const handleCreateAdjustment = async (payload) => {
    try {
      setActionLoading(true);
      const response = await createAdjustment(payload);
      const created = response?.data || payload;
      setAdjustments((current) => [created, ...current]);
      setShowForm(false);
    } catch (err) {
      setError(err.message || 'Failed to save adjustment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApplyAdjustment = async (id) => {
    try {
      setActionLoading(true);
      const response = await validateAdjustment(id);
      const updated = response?.data;
      setAdjustments((current) => current.map((adjustment) => (adjustment._id === id ? { ...adjustment, ...updated } : adjustment)));
      setSelectedAdjustment((current) => (current && current._id === id ? { ...current, ...updated } : current));
    } catch (err) {
      setError(err.message || 'Failed to apply adjustment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelAdjustment = async (id) => {
    const target = adjustments.find((adjustment) => adjustment._id === id);
    if (!target) return;

    if (!window.confirm(`Cancel adjustment ${target.reference}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await cancelAdjustment(id);
      const updated = response?.data;
      setAdjustments((current) => current.map((adjustment) => (adjustment._id === id ? { ...adjustment, ...updated } : adjustment)));
      setSelectedAdjustment((current) => (current && current._id === id ? { ...current, ...updated } : current));
    } catch (err) {
      setError(err.message || 'Failed to cancel adjustment');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="adjustment-list-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Adjustments</h1>
          <p className="page-subtitle">Reconcile recorded stock with the actual physical stock.</p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          <span>Create Adjustment</span>
        </button>
      </div>

      <div className="toolbar-card">
        <div className="toolbar-left">
          <div className="input-with-icon search-input">
            <Search size={18} className="input-icon" />
            <input type="text" placeholder="Search adjustment or product..." className="form-control" value="" readOnly />
          </div>
        </div>

        <button className="btn btn-secondary btn-icon-only" title="Refresh adjustments" onClick={loadAdjustments}>
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
      ) : adjustments.length === 0 ? (
        <div className="empty-state-card">
          <ClipboardCheck size={48} color="#94a3b8" />
          <h3>No adjustments found</h3>
          <p>Create the first adjustment to reconcile physical stock with the system records.</p>
          <button className="btn btn-primary mt-4" onClick={() => setShowForm(true)}>
            <Plus size={18} />
            <span>Create Adjustment</span>
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Product</th>
                <th>Warehouse</th>
                <th>Location</th>
                <th>Recorded</th>
                <th>Physical</th>
                <th>Difference</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.map((adjustment) => {
                const difference = Number(adjustment.difference ?? 0);
                return (
                  <tr key={adjustment._id}>
                    <td>
                      <span className="font-mono sku-badge">{adjustment.reference}</span>
                    </td>
                    <td>{adjustment.product}</td>
                    <td>{adjustment.warehouse}</td>
                    <td>{adjustment.location}</td>
                    <td className="font-mono">{adjustment.recordedQuantity}</td>
                    <td className="font-mono">{adjustment.physicalQuantity}</td>
                    <td className={difference > 0 ? 'text-success font-mono' : difference < 0 ? 'text-danger font-mono' : 'font-mono'}>
                      {difference > 0 ? '+' : ''}
                      {difference}
                    </td>
                    <td>
                      <StatusBadge type={adjustment.status === 'DONE' ? 'success' : adjustment.status === 'CANCELED' ? 'danger' : 'default'}>
                        {adjustment.status}
                      </StatusBadge>
                    </td>
                    <td>{new Date(adjustment.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-action btn-action-view" title="View details" onClick={() => setSelectedAdjustment(adjustment)}>
                          <Eye size={16} />
                        </button>

                        {adjustment.status === 'DRAFT' && (
                          <button className="btn-action btn-action-edit" title="Apply adjustment" onClick={() => handleApplyAdjustment(adjustment._id)} disabled={actionLoading}>
                            <CheckCircle2 size={16} />
                          </button>
                        )}

                        {adjustment.status !== 'DONE' && adjustment.status !== 'CANCELED' && (
                          <button className="btn-action btn-action-delete" title="Cancel adjustment" onClick={() => handleCancelAdjustment(adjustment._id)} disabled={actionLoading}>
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
        <AdjustmentForm onClose={() => setShowForm(false)} onSubmit={handleCreateAdjustment} submitting={actionLoading} />
      )}

      {selectedAdjustment && (
        <AdjustmentDetails
          adjustment={selectedAdjustment}
          loading={actionLoading}
          onApply={() => handleApplyAdjustment(selectedAdjustment._id)}
          onCancel={() => {
            setSelectedAdjustment(null);
            handleCancelAdjustment(selectedAdjustment._id);
          }}
        />
      )}
    </div>
  );
};

export default AdjustmentList;
