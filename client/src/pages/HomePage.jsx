import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import StatusBadge from '../components/StatusBadge';
import { Package, ShieldCheck, Database, ArrowRight, Activity } from 'lucide-react';

const HomePage = () => {
  return (
    <MainLayout>
      <div className="home-container">
        <div className="hero-banner">
          <div className="hero-badge">
            <Activity size={16} color="#6366f1" />
            <span>Hour 2 Foundation Ready</span>
          </div>
          <h1 className="hero-title">
            Welcome to <span className="text-highlight">StockSense</span>
          </h1>
          <p className="hero-subtitle">
            Modular, scalable MERN stack Inventory Management System. Secure authentication with JWT, role-based controls, and master product data management.
          </p>

          <div className="hero-actions">
            <Link to="/products" className="btn btn-primary btn-lg">
              <Package size={20} />
              <span>Explore Products</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        <div className="architecture-grid">
          <div className="info-card">
            <div className="card-icon">
              <ShieldCheck size={24} color="#6366f1" />
            </div>
            <h3>Authentication Module</h3>
            <p>JWT-based sessions, password encryption via bcrypt, OTP verification, and RBAC roles.</p>
            <div className="card-footer-tags">
              <StatusBadge type="manager">Manager Role</StatusBadge>
              <StatusBadge type="staff">Staff Role</StatusBadge>
            </div>
          </div>

          <div className="info-card">
            <div className="card-icon">
              <Package size={24} color="#10b981" />
            </div>
            <h3>Product Master Data</h3>
            <p>Full Product CRUD with SKU validation, Category classification, Units of Measure, and initial stock tracking.</p>
            <div className="card-footer-tags">
              <StatusBadge type="success">SKU Uniqueness</StatusBadge>
              <StatusBadge type="info">Category Filter</StatusBadge>
            </div>
          </div>

          <div className="info-card">
            <div className="card-icon">
              <Database size={24} color="#3b82f6" />
            </div>
            <h3>MERN Architecture</h3>
            <p>Clean layer separation: React components → Feature API → Express Routes → Controllers → Services → Models → MongoDB.</p>
            <div className="card-footer-tags">
              <StatusBadge type="default">Express + Mongo</StatusBadge>
              <StatusBadge type="default">Vite + React</StatusBadge>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default HomePage;
