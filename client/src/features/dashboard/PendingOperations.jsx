import React from 'react';
import { AlertCircle, Eye } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';

const PendingOperations = ({ title, records = [], type, loading = false, error = '', viewPath = '/' }) => {
  if (loading) {
    return (
      <div className="panel-card">
        <div className="panel-header">
          <h3>{title}</h3>
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
          <h3>{title}</h3>
        </div>
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="panel-card">
        <div className="panel-header">
          <h3>{title}</h3>
        </div>
        <div className="empty-state-card compact">
          <p>No pending {type.toLowerCase()} found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-card">
      <div className="panel-header">
        <h3>{title}</h3>
      </div>

      <div className="table-responsive">
        <table className="custom-table compact-table">
          <thead>
            <tr>
              <th>Reference</th>
              {type === 'Receipt' && <th>Supplier</th>}
              {type === 'Delivery' && <th>Customer</th>}
              {type === 'Transfer' && <th>Product / Items</th>}
              {type === 'Receipt' && <th>Items</th>}
              {type === 'Delivery' && <th>Items</th>}
              <th>Warehouse</th>
              <th>Status</th>
              <th>Created Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record._id || record.reference || record.id}>
                <td><span className="font-mono sku-badge">{record.reference}</span></td>
                {type === 'Receipt' && <td>{record.supplier}</td>}
                {type === 'Delivery' && <td>{record.customer}</td>}
                {type === 'Transfer' && <td>{record.items || record.product || '—'}</td>}
                {type === 'Receipt' && <td>{record.items ? record.items.length : 0}</td>}
                {type === 'Delivery' && <td>{record.items ? record.items.length : 0}</td>}
                <td>{record.warehouse}</td>
                <td>
                  <StatusBadge type={record.status === 'DONE' ? 'success' : record.status === 'CANCELED' ? 'danger' : 'default'}>
                    {record.status}
                  </StatusBadge>
                </td>
                <td>{new Date(record.createdAt).toLocaleDateString()}</td>
                <td>
                  <a href={viewPath} className="btn btn-secondary btn-sm" title="View">
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

export default PendingOperations;
