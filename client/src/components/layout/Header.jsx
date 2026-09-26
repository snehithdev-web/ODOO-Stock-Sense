import React from 'react';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../StatusBadge';

const getPageTitle = (pathname) => {
  const map = {
    '/dashboard': 'Dashboard',
    '/products': 'Products',
    '/receipts': 'Receipts',
    '/delivery-orders': 'Delivery Orders',
    '/transfers': 'Internal Transfers',
    '/adjustments': 'Inventory Adjustment',
    '/move-history': 'Move History',
    '/settings/warehouse': 'Warehouse Settings',
    '/profile': 'Profile',
  };

  return map[pathname] || 'Overview';
};

const Header = ({ title, pathname }) => {
  const { user } = useAuth();
  const pageTitle = title || getPageTitle(pathname || window.location.pathname);

  return (
    <header className="app-header">
      <div>
        <p className="app-header-kicker">Operations overview</p>
        <h1 className="app-header-title">{pageTitle}</h1>
      </div>

      <div className="app-header-user">
        <div className="header-user-meta">
          <span className="header-user-name">{user?.name || 'Inventory User'}</span>
          <StatusBadge type={user?.role === 'inventory_manager' ? 'manager' : 'staff'}>
            {user?.role === 'inventory_manager' ? 'Inventory Manager' : 'Warehouse Staff'}
          </StatusBadge>
        </div>
      </div>
    </header>
  );
};

export default Header;
