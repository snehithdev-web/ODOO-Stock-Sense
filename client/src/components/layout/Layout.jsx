import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const location = useLocation();

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Header pathname={location.pathname} />
        <main className="main-content">
          <div className="content-wrapper">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
