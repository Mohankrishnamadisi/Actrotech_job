import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';

const drawerWidth = 260;

const AdminLayout: React.FC = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminTopbar drawerWidth={drawerWidth} />
      <AdminSidebar drawerWidth={drawerWidth} />
      <main style={{ flexGrow: 1, padding: 24, background: 'var(--bg, white)' }}>
        <div style={{ height: 64 }} />
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
