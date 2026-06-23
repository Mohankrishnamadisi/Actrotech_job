import React from 'react';
import { useNavigate } from 'react-router-dom';

const AdminTopbar: React.FC<{ drawerWidth?: number }> = ({ drawerWidth = 260 }) => {
  const navigate = useNavigate();
  return (
    <header style={{
      position: 'fixed',
      left: drawerWidth,
      right: 0,
      top: 0,
      height: 72,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      background: '#f8fafc',
      borderBottom: '1px solid rgba(148, 163, 184, 0.24)',
      boxShadow: '0 1px 12px rgba(15, 23, 42, 0.06)',
      zIndex: 1200,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          style={{
            width: 42,
            height: 42,
            borderRadius: 8,
            border: '1px solid rgba(148, 163, 184, 0.35)',
            background: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
          }}
        >
          ←
        </button>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: '#2563eb' }} aria-hidden />
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Admin Portal</h2>
      </div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <input
          aria-label="Search"
          placeholder="Search admin tools"
          style={{
            width: 220,
            padding: '10px 12px',
            borderRadius: 12,
            border: '1px solid rgba(148, 163, 184, 0.35)',
            background: '#fff',
            color: '#0f172a',
            outline: 'none',
          }}
        />
        <button
          aria-label="Notifications"
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            border: 'none',
            background: '#fff',
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.08)',
            cursor: 'pointer',
          }}
        >
          🔔
        </button>
        <div style={{ width: 42, height: 42, borderRadius: 14, background: '#374151' }} aria-hidden />
      </div>
    </header>
  );
};

export default AdminTopbar;
