import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Plus, Search, Trash2, RefreshCw, Eye, Truck, PackageCheck, CheckCircle2, PackageX } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import DeliveryForm from './DeliveryForm';
import DeliveryDetails from './DeliveryDetails';
import { cancelDelivery, createDelivery, getDeliveries, packDelivery, pickDelivery, validateDelivery } from './deliveryApi';

const DeliveryList = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadDeliveries = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getDeliveries();
      const data = Array.isArray(response?.data) ? response.data : [];
      setDeliveries(data);
    } catch (err) {
      setError(err.message || 'Failed to load delivery orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  const handleCreateDelivery = async (payload) => {
    try {
      setActionLoading(true);
      const response = await createDelivery(payload);
      const created = response?.data || payload;
      setDeliveries((current) => [created, ...current]);
      setShowForm(false);
    } catch (err) {
      setError(err.message || 'Failed to save delivery order');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePick = async (id) => {
    try {
      setActionLoading(true);
      const response = await pickDelivery(id);
      const updated = response?.data;
      setDeliveries((current) =>
        current.map((delivery) => (delivery._id === id ? { ...delivery, ...updated } : delivery))
      );
      setSelectedDelivery((current) => (current && current._id === id ? { ...current, ...updated } : current));
    } catch (err) {
      setError(err.message || 'Failed to pick delivery');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePack = async (id) => {
    try {
      setActionLoading(true);
      const response = await packDelivery(id);
      const updated = response?.data;
      setDeliveries((current) =>
        current.map((delivery) => (delivery._id === id ? { ...delivery, ...updated } : delivery))
      );
      setSelectedDelivery((current) => (current && current._id === id ? { ...current, ...updated } : current));
    } catch (err) {
      setError(err.message || 'Failed to pack delivery');
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidate = async (id) => {
    try {
      setActionLoading(true);
      const response = await validateDelivery(id);
      const updated = response?.data;
      setDeliveries((current) =>
        current.map((delivery) => (delivery._id === id ? { ...delivery, ...updated } : delivery))
      );
      setSelectedDelivery((current) => (current && current._id === id ? { ...current, ...updated } : current));
    } catch (err) {
      setError(err.message || 'Failed to validate delivery');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (id) => {
    const target = deliveries.find((delivery) => delivery._id === id);
    if (!target) return;

    if (!window.confirm(`Cancel delivery ${target.reference}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await cancelDelivery(id);
      const updated = response?.data;
      setDeliveries((current) =>
        current.map((delivery) => (delivery._id === id ? { ...delivery, ...updated } : delivery))
      );
      setSelectedDelivery((current) => (current && current._id === id ? { ...current, ...updated } : current));
    } catch (err) {
      setError(err.message || 'Failed to cancel delivery');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="delivery-list-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Delivery Orders</h1>
          <p className="page-subtitle">Manage outgoing goods and fulfill customer deliveries.</p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          <span>Create Delivery</span>
        </button>
      </div>

      <div className="toolbar-card">
        <div className="toolbar-left">
          <div className="input-with-icon search-input">
            <Search size={18} className="input-icon" />
            <input
              type="text"
              placeholder="Search delivery or customer..."
              className="form-control"
              value=""
              readOnly
            />
          </div>
        </div>

        <button className="btn btn-secondary btn-icon-only" title="Refresh deliveries" onClick={loadDeliveries}>
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
      ) : deliveries.length === 0 ? (
        <div className="empty-state-card">
          <PackageX size={48} color="#94a3b8" />
          <h3>No delivery orders found</h3>
          <p>Create your first outgoing delivery to schedule fulfillment.</p>
          <button className="btn btn-primary mt-4" onClick={() => setShowForm(true)}>
            <Plus size={18} />
            <span>Create First Delivery</span>
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Warehouse</th>
                <th>Source Location</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((delivery) => (
                <tr key={delivery._id}>
                  <td>
                    <span className="font-mono sku-badge">{delivery.reference}</span>
                  </td>
                  <td>{delivery.customer}</td>
                  <td>
                    <div className="delivery-items-cell">
                      {delivery.items && delivery.items.length > 0 ? (
                        delivery.items.map((item, index) => (
                          <span key={`${item.productName}-${index}`} className="receipt-item-chip">
                            {item.product} × {item.quantity}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted">No items</span>
                      )}
                    </div>
                  </td>
                  <td>{delivery.warehouse}</td>
                  <td>{delivery.location}</td>
                  <td>
                    <StatusBadge
                      type={
                        delivery.statusValue === 'done'
                          ? 'success'
                          : delivery.statusValue === 'canceled'
                            ? 'danger'
                            : delivery.statusValue === 'ready'
                              ? 'info'
                              : 'default'
                      }
                    >
                      {delivery.statusLabel}
                    </StatusBadge>
                  </td>
                  <td>{new Date(delivery.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn-action btn-action-view"
                        title="View details"
                        onClick={() => setSelectedDelivery(delivery)}
                      >
                        <Eye size={16} />
                      </button>

                      {delivery.statusValue === 'draft' && (
                        <button
                          className="btn-action btn-action-edit"
                          title="Pick delivery"
                          onClick={() => handlePick(delivery._id)}
                          disabled={actionLoading}
                        >
                          <Truck size={16} />
                        </button>
                      )}

                      {delivery.statusValue === 'waiting' && (
                        <button
                          className="btn-action btn-action-edit"
                          title="Pack delivery"
                          onClick={() => handlePack(delivery._id)}
                          disabled={actionLoading}
                        >
                          <PackageCheck size={16} />
                        </button>
                      )}

                      {delivery.statusValue === 'ready' && (
                        <button
                          className="btn-action btn-action-edit"
                          title="Validate delivery"
                          onClick={() => handleValidate(delivery._id)}
                          disabled={actionLoading}
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}

                      {delivery.status !== 'CANCELED' && delivery.status !== 'DONE' && (
                        <button
                          className="btn-action btn-action-delete"
                          title="Cancel delivery"
                          onClick={() => handleCancel(delivery._id)}
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
        <DeliveryForm
          onClose={() => setShowForm(false)}
          onSubmit={handleCreateDelivery}
          submitting={actionLoading}
        />
      )}

      {selectedDelivery && (
        <DeliveryDetails
          delivery={selectedDelivery}
          loading={actionLoading}
          onPick={() => handlePick(selectedDelivery._id)}
          onPack={() => handlePack(selectedDelivery._id)}
          onValidate={() => handleValidate(selectedDelivery._id)}
          onCancel={() => {
            setSelectedDelivery(null);
            handleCancel(selectedDelivery._id);
          }}
        />
      )}
    </div>
  );
};

export default DeliveryList;
