import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Building2, Eye, Pencil, Plus, Search, RefreshCw } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import WarehouseForm from './WarehouseForm';
import WarehouseDetails from './WarehouseDetails';
import { createWarehouse, getWarehouses, updateWarehouse } from './warehouseApi';

const WarehouseList = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadWarehouses = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getWarehouses();
      const data = Array.isArray(response?.data) ? response.data : [];
      setWarehouses(data);
    } catch (err) {
      setError(err.message || 'Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWarehouses();
  }, [loadWarehouses]);

  const handleCreateWarehouse = async (payload) => {
    try {
      setActionLoading(true);
      const response = await createWarehouse(payload);
      const created = response?.data || payload;
      setWarehouses((current) => [created, ...current]);
      setShowForm(false);
    } catch (err) {
      setError(err.message || 'Failed to save warehouse');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateWarehouse = async (id, payload) => {
    try {
      setActionLoading(true);
      const response = await updateWarehouse(id, payload);
      const updated = response?.data || payload;
      setWarehouses((current) => current.map((warehouse) => (warehouse._id === id ? { ...warehouse, ...updated } : warehouse)));
      setSelectedWarehouse((current) => (current && current._id === id ? { ...current, ...updated } : current));
      setShowForm(false);
    } catch (err) {
      setError(err.message || 'Failed to update warehouse');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="warehouse-list-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Warehouse Settings</h1>
          <p className="page-subtitle">Manage warehouses and their stock locations.</p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          <span>Add Warehouse</span>
        </button>
      </div>

      <div className="toolbar-card">
        <div className="toolbar-left">
          <div className="input-with-icon search-input">
            <Search size={18} className="input-icon" />
            <input type="text" placeholder="Search warehouse..." className="form-control" value="" readOnly />
          </div>
        </div>

        <button className="btn btn-secondary btn-icon-only" title="Refresh warehouses" onClick={loadWarehouses}>
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
      ) : warehouses.length === 0 ? (
        <div className="empty-state-card">
          <Building2 size={48} color="#94a3b8" />
          <h3>No warehouses configured</h3>
          <p>Create your first warehouse to begin defining locations.</p>
          <button className="btn btn-primary mt-4" onClick={() => setShowForm(true)}>
            <Plus size={18} />
            <span>Add Warehouse</span>
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Warehouse Name</th>
                <th>Code</th>
                <th>Locations</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((warehouse) => (
                <tr key={warehouse._id}>
                  <td>{warehouse.name}</td>
                  <td className="font-mono">{warehouse.code}</td>
                  <td>{warehouse.locations?.length || 0}</td>
                  <td>
                    <StatusBadge type={warehouse.status === 'ACTIVE' ? 'success' : 'default'}>{warehouse.status}</StatusBadge>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-action btn-action-view" title="View warehouse" onClick={() => setSelectedWarehouse(warehouse)}>
                        <Eye size={16} />
                      </button>
                      <button className="btn-action btn-action-edit" title="Edit warehouse" onClick={() => setShowForm({ type: 'edit', warehouse })}>
                        <Pencil size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <WarehouseForm
          warehouse={showForm?.warehouse || null}
          onClose={() => setShowForm(false)}
          onSubmit={(payload) => {
            if (showForm?.warehouse) {
              return handleUpdateWarehouse(showForm.warehouse._id, payload);
            }
            return handleCreateWarehouse(payload);
          }}
          submitting={actionLoading}
        />
      )}

      {selectedWarehouse && (
        <WarehouseDetails
          warehouse={selectedWarehouse}
          onClose={() => setSelectedWarehouse(null)}
          onAddLocation={() => {
            const nextLocation = { _id: `LOC-${Date.now()}`, name: 'New Location', code: 'NEW-01' };
            const updated = { ...selectedWarehouse, locations: [...(selectedWarehouse.locations || []), nextLocation] };
            setSelectedWarehouse(updated);
          }}
          onEditLocation={(location) => {
            const edited = {
              ...selectedWarehouse,
              locations: (selectedWarehouse.locations || []).map((item) =>
                item._id === location._id ? { ...item, name: `${item.name} (Edited)`, code: `${item.code}-E` } : item
              ),
            };
            setSelectedWarehouse(edited);
          }}
        />
      )}
    </div>
  );
};

export default WarehouseList;
