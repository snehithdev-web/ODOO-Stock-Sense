import React from 'react';

const StatusBadge = ({ children, type = 'default' }) => {
  const getBadgeClass = () => {
    switch (type) {
      case 'manager':
      case 'inventory_manager':
        return 'badge-manager';
      case 'staff':
      case 'warehouse_staff':
        return 'badge-staff';
      case 'success':
      case 'completed':
      case 'done':
        return 'badge-success';
      case 'warning':
      case 'low_stock':
        return 'badge-warning';
      case 'danger':
      case 'error':
        return 'badge-danger';
      case 'info':
        return 'badge-info';
      default:
        return 'badge-default';
    }
  };

  return <span className={`status-badge ${getBadgeClass()}`}>{children}</span>;
};

export default StatusBadge;
