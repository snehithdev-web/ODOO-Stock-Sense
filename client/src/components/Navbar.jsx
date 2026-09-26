import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatusBadge from './StatusBadge';
import { Package, LogOut, User, Boxes } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <div className="logo-icon">
            <Boxes size={22} color="#6366f1" />
          </div>
          <span className="logo-text">StockSense</span>
        </Link>

        {isAuthenticated ? (
          <>
            <div className="nav-menu">
              <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                Home
              </NavLink>
              <NavLink to="/products" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                <Package size={16} />
                <span>Products</span>
              </NavLink>
            </div>

            <div className="user-profile-menu">
              <div className="user-info">
                <div className="user-avatar">
                  <User size={16} />
                </div>
                <div className="user-details">
                  <span className="user-name">{user?.name}</span>
                  <StatusBadge type={user?.role}>
                    {user?.role === 'inventory_manager' ? 'Manager' : 'Staff'}
                  </StatusBadge>
                </div>
              </div>

              <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </>
        ) : (
          <div className="auth-nav-buttons">
            <Link to="/login" className="btn btn-secondary btn-sm">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
