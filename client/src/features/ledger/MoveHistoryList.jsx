import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRightLeft, Eye, Filter, Search } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import MoveHistoryDetails from './MoveHistoryDetails';
import { getMoveHistory } from './ledgerApi';

const movementTypes = ['All', 'RECEIPT', 'DELIVERY', 'TRANSFER', 'ADJUSTMENT'];
const statusOptions = ['All', 'DONE', 'CANCELED'];

const MoveHistoryList = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [filters, setFilters] = useState({
    movementType: 'All',
    status: 'All',
    warehouse: 'All',
    product: '',
    date: '',
  });

  useEffect(() => {
    const loadMovementHistory = async () => {
      try {
        setLoading(true);
        const response = await getMoveHistory();
        setMovements(Array.isArray(response?.data) ? response.data : []);
      } catch (err) {
        setError(err.message || 'Failed to load movement history');
      } finally {
        setLoading(false);
      }
    };

    loadMovementHistory();
  }, []);

  const availableLocations = useMemo(() => {
    const values = new Set(movements.map((movement) => movement.warehouse).filter(Boolean));
    return ['All', ...Array.from(values)];
  }, [movements]);

  const filteredMovements = useMemo(() => {
    return movements.filter((movement) => {
      const matchesType = filters.movementType === 'All' || movement.movementType === filters.movementType;
      const matchesStatus = filters.status === 'All' || movement.status === filters.status;
      const matchesWarehouse = filters.warehouse === 'All' || movement.warehouse === filters.warehouse;
      const matchesProduct = !filters.product || movement.product.toLowerCase().includes(filters.product.toLowerCase());
      const matchesDate = !filters.date || new Date(movement.date).toISOString().slice(0, 10) === filters.date;
      return matchesType && matchesStatus && matchesWarehouse && matchesProduct && matchesDate;
    });
  }, [filters, movements]);

  const clearFilters = () => {
    setFilters({
      movementType: 'All',
      status: 'All',
      warehouse: 'All',
      product: '',
      date: '',
    });
  };

  return (
    <div className="ledger-list-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Move History</h1>
          <p className="page-subtitle">View the complete history of inventory movements.</p>
        </div>
      </div>

      <div className="toolbar-card ledger-filter-card">
        <div className="ledger-filter-grid">
          <div className="form-group">
            <label>Movement Type</label>
            <select className="form-control" value={filters.movementType} onChange={(e) => setFilters((prev) => ({ ...prev, movementType: e.target.value }))}>
              {movementTypes.map((type) => (
                <option key={type} value={type}>{type === 'All' ? 'All' : type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select className="form-control" value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status === 'All' ? 'All' : status}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Warehouse / Location</label>
            <select className="form-control" value={filters.warehouse} onChange={(e) => setFilters((prev) => ({ ...prev, warehouse: e.target.value }))}>
              {availableLocations.map((warehouse) => (
                <option key={warehouse} value={warehouse}>{warehouse === 'All' ? 'All' : warehouse}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Product</label>
            <div className="input-with-icon">
              <Search size={16} className="input-icon" />
              <input
                type="text"
                className="form-control"
                value={filters.product}
                onChange={(e) => setFilters((prev) => ({ ...prev, product: e.target.value }))}
                placeholder="Search product"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              className="form-control"
              value={filters.date}
              onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))}
            />
          </div>

          <div className="form-group ledger-filter-actions">
            <label>&nbsp;</label>
            <button type="button" className="btn btn-secondary" onClick={clearFilters}>
              <Filter size={16} />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>
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
      ) : filteredMovements.length === 0 ? (
        <div className="empty-state-card">
          <ArrowRightLeft size={48} color="#94a3b8" />
          <h3>No movement history found</h3>
          <p>Adjust your filters or add a new movement to see results here.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Date</th>
                <th>Movement Type</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>From</th>
                <th>To</th>
                <th>User</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.map((movement) => (
                <tr key={movement._id}>
                  <td>
                    <span className="font-mono sku-badge">{movement.reference}</span>
                  </td>
                  <td>{new Date(movement.date).toLocaleDateString()}</td>
                  <td>
                    <StatusBadge type={movement.movementType === 'ADJUSTMENT' ? 'warning' : movement.movementType === 'DELIVERY' ? 'info' : 'default'}>
                      {movement.movementType}
                    </StatusBadge>
                  </td>
                  <td>{movement.product}</td>
                  <td className="font-mono">{movement.quantity}</td>
                  <td>{movement.fromLocation}</td>
                  <td>{movement.toLocation}</td>
                  <td>{movement.performedBy}</td>
                  <td>
                    <StatusBadge type={movement.status === 'DONE' ? 'success' : 'danger'}>{movement.status}</StatusBadge>
                  </td>
                  <td>
                    <button className="btn-action btn-action-view" title="View movement details" onClick={() => setSelectedMovement(movement)}>
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedMovement && <MoveHistoryDetails movement={selectedMovement} onClose={() => setSelectedMovement(null)} />}
    </div>
  );
};

export default MoveHistoryList;
