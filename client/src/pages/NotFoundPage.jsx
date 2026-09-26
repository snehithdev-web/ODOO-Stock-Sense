import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { HelpCircle, Home } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <MainLayout>
      <div className="empty-state-card py-16">
        <HelpCircle size={64} color="#6366f1" />
        <h2>404 - Page Not Found</h2>
        <p className="text-muted">The requested page or route does not exist in StockSense.</p>
        <Link to="/" className="btn btn-primary mt-4">
          <Home size={18} />
          <span>Return Home</span>
        </Link>
      </div>
    </MainLayout>
  );
};

export default NotFoundPage;
