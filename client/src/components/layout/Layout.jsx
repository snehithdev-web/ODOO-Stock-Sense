import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Navbar from '../Navbar';
import { useAuth } from '../../context/AuthContext';

const Layout = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="app-public-container">
        <Navbar />
        <main className="main-content main-content-public">
          <div className="content-wrapper">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      {sidebarOpen && <div className="sidebar-backdrop" onClick={closeSidebar} />}
      <div className="app-main">
        <Header pathname={location.pathname} onToggleSidebar={toggleSidebar} />
        <main className="main-content">
          <div className="content-wrapper">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

