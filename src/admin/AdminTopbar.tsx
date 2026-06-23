import React from 'react';

const AdminTopbar: React.FC<{ drawerWidth?: number }> = ({ drawerWidth = 260 }) => {
  return (
    <header style={{
      position: 'fixed',
      left: drawerWidth,
      right: 0,
      top: 0,
      height: 64,
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      background: 'var(--bg, #fff)',
      borderBottom: '1px solid rgba(0,0,0,0.08)',
      zIndex: 1200,
    }}>
      <h2 style={{ margin: 0, flex: 1 }}>Admin Portal</h2>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <input aria-label="Search" placeholder="Search..." style={{ padding: '6px 8px' }} />
        <button aria-label="Notifications">🔔</button>
        <div style={{ width: 32, height: 32, borderRadius: 16, background: '#666' }} aria-hidden />
      </div>
    </header>
  );
};

export default AdminTopbar;
