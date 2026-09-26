import React from 'react';
import { Link } from 'react-router-dom';
import { Boxes } from 'lucide-react';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-brand">
            <div className="logo-icon-lg">
              <Boxes size={28} color="#6366f1" />
            </div>
            <h1 className="auth-title">StockSense</h1>
          </Link>
          {title && <h2 className="auth-page-title">{title}</h2>}
          <p className="auth-subtitle">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
