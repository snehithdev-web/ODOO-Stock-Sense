import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRightLeft,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Package,
  ReceiptText,
  Truck,
  User,
  Warehouse,
  Boxes,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const operationLinks = [
  { to: '/receipts', label: 'Receipts', icon: ReceiptText },
  { to: '/delivery-orders', label: 'Delivery Orders', icon: Truck },
  { to: '/transfers', label: 'Internal Transfers', icon: ArrowRightLeft },
  { to: '/adjustments', label: 'Inventory Adjustment', icon: ClipboardCheck },
  { to: '/move-history', label: 'Move History', icon: Activity },
];

const settingsLinks = [{ to: '/settings/warehouse', label: 'Warehouse', icon: Warehouse }];

const profileLinks = [{ to: '/profile', label: 'My Profile', icon: User }];

const Sidebar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link to="/dashboard" className="sidebar-brand">
          <div className="logo-icon logo-icon-lg">
            <Boxes size={22} color="#6366f1" />
          </div>
          <span>StockSense</span>
        </Link>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        <div className="nav-group">
          <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/products" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Package size={18} />
            <span>Products</span>
          </NavLink>
        </div>

        <div className="nav-group">
          <div className="nav-section-label">Operations</div>
          {operationLinks.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link sidebar-sub-link ${isActive ? 'active' : ''}`}>
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>

        <div className="nav-group">
          <div className="nav-section-label">Settings</div>
          {settingsLinks.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link sidebar-sub-link ${isActive ? 'active' : ''}`}>
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>

        <div className="nav-group nav-group-profile">
          <div className="nav-section-label">Profile</div>
          {profileLinks.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link sidebar-sub-link ${isActive ? 'active' : ''}`}>
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}

          <button type="button" className="sidebar-link sidebar-sub-link sidebar-logout" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user-card">
          <div className="sidebar-user-avatar">
            <User size={16} />
          </div>
          <div>
            <div className="sidebar-user-name">{user?.name || 'Inventory User'}</div>
            <div className="sidebar-user-role">{user?.role === 'inventory_manager' ? 'Inventory Manager' : 'Warehouse Staff'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
