import React from 'react';
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../constants';

const items = [
  { label: 'Dashboard', to: ROUTES.ADMIN_DASHBOARD },
  { label: 'Users', to: ROUTES.ADMIN_USERS },
  { label: 'Recruiters', to: ROUTES.ADMIN_RECRUITERS },
  { label: 'Candidates', to: ROUTES.ADMIN_CANDIDATES },
  { label: 'Jobs', to: ROUTES.ADMIN_JOBS },
  { label: 'Applications', to: ROUTES.ADMIN_APPLICATIONS },
  { label: 'Analytics', to: ROUTES.ADMIN_ANALYTICS },
  { label: 'Bulk Import', to: ROUTES.ADMIN_BULK_IMPORT },
  { label: 'Data Integrity', to: ROUTES.ADMIN_DATA_INTEGRITY },
  { label: 'System Health', to: ROUTES.ADMIN_SYSTEM_HEALTH },
  { label: 'Settings', to: ROUTES.ADMIN_SETTINGS },
];

const AdminSidebar: React.FC<{ drawerWidth?: number }> = ({ drawerWidth = 260 }) => {
  return (
    <aside style={{
      width: drawerWidth,
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      paddingTop: 72,
      background: '#f8fafc',
      borderRight: '1px solid rgba(148, 163, 184, 0.2)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ padding: 20, fontWeight: 700, color: '#0f172a', letterSpacing: 1, borderBottom: '1px solid rgba(148, 163, 184, 0.12)' }}>
        Admin Menu
      </div>
      <nav aria-label="Admin navigation" style={{ flex: 1, overflowY: 'auto' }}>
        <ul style={{ listStyle: 'none', padding: '16px 0', margin: 0 }}>
          {items.map((it) => (
            <li key={it.to} style={{ margin: 0 }}>
              <NavLink
                to={it.to}
                style={({ isActive }) => ({
                  display: 'block',
                  padding: '12px 20px',
                  textDecoration: 'none',
                  color: isActive ? '#1d4ed8' : '#334155',
                  background: isActive ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                  borderLeft: isActive ? '4px solid #2563eb' : '4px solid transparent',
                  transition: 'background 0.2s ease, color 0.2s ease',
                })}
              >
                {it.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
