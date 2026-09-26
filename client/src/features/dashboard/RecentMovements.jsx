import React from 'react';
import { AlertCircle, Eye } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';

const RecentMovements = ({ movements = [], loading = false, error = '' }) => {
  if (loading) {
    return (
      <div className="panel-card">
        <div className="panel-header">
          <h3>Recent Inventory Movements</h3>
        </div>
        <div className="flex-center py-12">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel-card">
        <div className="panel-header">
          <h3>Recent Inventory Movements</h3>
        </div>
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!movements.length) {
    return (
      <div className="panel-card">
        <div className="panel-header">
          <h3>Recent Inventory Movements</h3>
        </div>
        <div className="empty-state-card compact">
          <p>No recent movement history is available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-card">
      <div className="panel-header">
        <h3>Recent Inventory Movements</h3>
      </div>

      <div className="table-responsive">
        <table className="custom-table compact-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Type</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>From</th>
              <th>To</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((movement) => (
              <tr key={movement._id || movement.reference || movement.id}>
                <td><span className="font-mono sku-badge">{movement.reference}</span></td>
                <td>
                  <StatusBadge type={movement.movementType === 'ADJUSTMENT' ? 'warning' : movement.movementType === 'DELIVERY' ? 'info' : 'default'}>
                    {movement.movementType}
                  </StatusBadge>
                </td>
                <td>{movement.product}</td>
                <td className="font-mono">{movement.quantity}</td>
                <td>{movement.fromLocation}</td>
                <td>{movement.toLocation}</td>
                <td>{new Date(movement.date).toLocaleDateString()}</td>
                <td>
                  <a href="/move-history" className="btn btn-secondary btn-sm" title="View details">
                    <Eye size={15} />
                    <span>View</span>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentMovements;
