import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { Package, ShieldCheck, Database, ArrowRight, ArrowRightLeft, Sparkles, Layers } from 'lucide-react';

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <MainLayout>
      <div className="home-container">
        <div className="hero-banner">
          <div className="hero-badge">
            <Sparkles size={15} color="#6366f1" />
            <span>Next-Gen MERN ERP Ready</span>
          </div>
          <h1 className="hero-title">
            Intelligent Inventory & <span className="text-gradient">Stock Management</span>
          </h1>
          <p className="hero-subtitle">
            Modular, scalable MERN stack ERP system. Seamless real-time tracking, double-entry inventory ledger, automated stock movements, and role-based access control.
          </p>

          <div className="hero-actions">
            <Link to={isAuthenticated ? '/dashboard' : '/products'} className="btn btn-primary btn-lg">
              <Package size={20} />
              <span>{isAuthenticated ? 'Open Dashboard' : 'Explore Warehouse'}</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        <div className="features-section">
          <div className="section-title-wrapper text-center">
            <h2 className="section-title">Core Architecture & Capabilities</h2>
            <p className="section-subtitle">Engineered for accuracy, scalability, and seamless user experience</p>
          </div>

          <div className="architecture-grid">
            <div className="info-card">
              <div className="card-icon icon-purple">
                <ShieldCheck size={24} />
              </div>
              <h3>Authentication & Security</h3>
              <p>JWT-based sessions, bcrypt password encryption, OTP email verification, and strict role-based controls (Manager vs Staff).</p>
              <div className="card-footer-tags">
                <StatusBadge type="manager">Manager Role</StatusBadge>
                <StatusBadge type="staff">Staff Role</StatusBadge>
              </div>
            </div>

            <div className="info-card">
              <div className="card-icon icon-emerald">
                <Package size={24} />
              </div>
              <h3>Product Master Data</h3>
              <p>Comprehensive Product CRUD with automated SKU generation, Category classification, Units of Measure, and threshold stock alerts.</p>
              <div className="card-footer-tags">
                <StatusBadge type="success">SKU Validation</StatusBadge>
                <StatusBadge type="info">Category Filtering</StatusBadge>
              </div>
            </div>

            <div className="info-card">
              <div className="card-icon icon-blue">
                <Database size={24} />
              </div>
              <h3>Double-Entry Stock Ledger</h3>
              <p>Full auditability tracking every physical item movement between vendors, warehouses, internal zones, and customer deliveries.</p>
              <div className="card-footer-tags">
                <StatusBadge type="default">Express + Mongo</StatusBadge>
                <StatusBadge type="default">Vite + React</StatusBadge>
              </div>
            </div>

            <div className="info-card">
              <div className="card-icon icon-amber">
                <Layers size={24} />
              </div>
              <h3>Operational Workflows</h3>
              <p>Integrated processing for Receipts, Delivery Orders, Internal Transfers, and Inventory Adjustments with draft validation lifecycle.</p>
              <div className="card-footer-tags">
                <StatusBadge type="warning">Multi-Stage States</StatusBadge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default HomePage;

