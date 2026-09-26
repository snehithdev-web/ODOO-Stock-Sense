import React from 'react';
import { Filter, RefreshCw } from 'lucide-react';

const DashboardFilters = ({ filters, onChange, onApply, onClear, options = {} }) => {
  const handleFieldChange = (field, value) => {
    onChange((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="toolbar-card dashboard-filter-card">
      <div className="dashboard-filter-grid">
        <div className="form-group">
          <label>Document Type</label>
          <select
            className="form-control"
            value={filters.documentType}
            onChange={(e) => handleFieldChange('documentType', e.target.value)}
          >
            <option value="All">All</option>
            <option value="Receipts">Receipts</option>
            <option value="Delivery Orders">Delivery Orders</option>
            <option value="Internal Transfers">Internal Transfers</option>
            <option value="Inventory Adjustments">Inventory Adjustments</option>
          </select>
        </div>

        <div className="form-group">
          <label>Status</label>
          <select
            className="form-control"
            value={filters.status}
            onChange={(e) => handleFieldChange('status', e.target.value)}
          >
            <option value="All">All</option>
            <option value="Draft">Draft</option>
            <option value="Waiting">Waiting</option>
            <option value="Ready">Ready</option>
            <option value="Done">Done</option>
            <option value="Canceled">Canceled</option>
          </select>
        </div>

        <div className="form-group">
          <label>Warehouse / Location</label>
          <select
            className="form-control"
            value={filters.location}
            onChange={(e) => handleFieldChange('location', e.target.value)}
          >
            <option value="All">All</option>
            {(options.warehouses || []).map((warehouse) => (
              <option key={warehouse} value={warehouse}>{warehouse}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Category</label>
          <select
            className="form-control"
            value={filters.category}
            onChange={(e) => handleFieldChange('category', e.target.value)}
          >
            <option value="All">All</option>
            {(options.categories || []).map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className="form-group dashboard-filter-actions">
          <label>&nbsp;</label>
          <div className="filter-button-group">
            <button type="button" className="btn btn-primary" onClick={onApply}>
              <Filter size={16} />
              <span>Apply Filters</span>
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClear}>
              <RefreshCw size={16} />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardFilters;
