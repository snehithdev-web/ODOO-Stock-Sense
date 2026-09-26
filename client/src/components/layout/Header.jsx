import React from 'react';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../StatusBadge';
import { Menu, Sparkles, User as UserIcon } from 'lucide-react';

const getPageTitle = (pathname) => {
  const map = {
    '/': 'Overview',
    '/dashboard': 'Dashboard Overview',
    '/products': 'Product Master Data',
    '/receipts': 'Incoming Receipts',
    '/delivery-orders': 'Outgoing Deliveries',
    '/transfers': 'Internal Stock Transfers',
    '/adjustments': 'Inventory Adjustments',
    '/move-history': 'Stock Move History',
    '/settings/warehouse': 'Warehouse Settings',
    '/profile': 'User Profile',
  };

  if (pathname?.startsWith('/products/')) {
    return 'Product Details';
  }

  return map[pathname] || 'Inventory System';
};

const getPageKicker = (pathname) => {
  const map = {
    '/': 'System Portal',
    '/dashboard': 'Real-time Metrics',
    '/products': 'Inventory Catalog',
    '/receipts': 'Stock Operations',
    '/delivery-orders': 'Stock Operations',
    '/transfers': 'Stock Operations',
    '/adjustments': 'Stock Control',
    '/move-history': 'Audit Log',
    '/settings/warehouse': 'Configuration',
    '/profile': 'Account',
  };

  return map[pathname] || 'StockSense ERP';
};

const Header = ({ title, pathname, onToggleSidebar }) => {
  const { user } = useAuth();
  const currentPath = pathname || window.location.pathname;
  const pageTitle = title || getPageTitle(currentPath);
  const pageKicker = getPageKicker(currentPath);

  return (
    <header className="app-header">
      <div className="app-header-left">
        <button type="button" className="sidebar-toggle-btn" onClick={onToggleSidebar} aria-label="Toggle navigation">
          <Menu size={20} />
        </button>
        <div className="header-title-block">
          <span className="app-header-kicker">{pageKicker}</span>
          <h1 className="app-header-title">{pageTitle}</h1>
        </div>
      </div>

      <div className="app-header-right">
        <div className="header-status-pill">
          <Sparkles size={14} className="text-primary" />
          <span>Live ERP Sync</span>
        </div>

        <div className="header-user-meta">
          <div className="user-avatar-sm">
            <UserIcon size={14} />
          </div>
          <div className="header-user-text">
            <span className="header-user-name">{user?.name || 'Inventory User'}</span>
            <StatusBadge type={user?.role === 'inventory_manager' ? 'manager' : 'staff'}>
              {user?.role === 'inventory_manager' ? 'Manager' : 'Staff'}
            </StatusBadge>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

