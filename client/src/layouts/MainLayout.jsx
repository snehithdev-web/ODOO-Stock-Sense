import React from 'react';
import Navbar from '../components/Navbar';

const MainLayout = ({ children }) => {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <div className="content-wrapper">{children}</div>
      </main>
      <footer className="footer">
        <div className="footer-container">
          <p>© 2026 StockSense Inventory System. Built for logistics excellence.</p>
          <div className="badge-outline">Hour 2 Foundation Ready</div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
