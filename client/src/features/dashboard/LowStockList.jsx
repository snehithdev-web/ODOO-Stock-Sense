import React from 'react';
import { AlertTriangle, ArrowUpRight, PackageX } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';

const LowStockList = ({ products = [], loading = false, error = '' }) => {
  if (loading) {
    return (
      <div className="panel-card">
        <div className="panel-header">
          <h3>Low / Out of Stock</h3>
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
          <h3>Low / Out of Stock</h3>
        </div>
        <div className="alert alert-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="panel-card">
        <div className="panel-header">
          <h3>Low / Out of Stock</h3>
        </div>
        <div className="empty-state-card compact">
          <PackageX size={36} color="#94a3b8" />
          <h4>No low stock alerts</h4>
          <p>Inventory is currently within expected thresholds.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-card">
      <div className="panel-header">
        <h3>Low / Out of Stock</h3>
      </div>

      <div className="table-responsive">
        <table className="custom-table compact-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Warehouse / Location</th>
              <th>Current Stock</th>
              <th>Reorder Level</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const isOutOfStock = Number(product.currentStock ?? 0) === 0;
              const statusType = isOutOfStock ? 'danger' : 'warning';
              const statusLabel = isOutOfStock ? 'OUT OF STOCK' : 'LOW STOCK';

              return (
                <tr key={product._id || product.id || product.sku || product.name}>
                  <td>{product.name}</td>
                  <td className="font-mono">{product.sku}</td>
                  <td>{product.category}</td>
                  <td>{product.warehouse || product.location || 'N/A'}</td>
                  <td className="font-mono">{product.currentStock}</td>
                  <td className="font-mono">{product.reorderLevel}</td>
                  <td>
                    <StatusBadge type={statusType}>{statusLabel}</StatusBadge>
                  </td>
                  <td>
                    <button className="btn-action btn-action-view" title="Review stock">
                      <ArrowUpRight size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LowStockList;
