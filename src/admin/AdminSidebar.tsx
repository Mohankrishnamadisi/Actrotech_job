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
      paddingTop: 64,
      borderRight: '1px solid rgba(0,0,0,0.06)',
      background: 'var(--bg, #fff)'
    }}>
      <div style={{ padding: 12, fontWeight: 600 }}>Admin</div>
      <nav aria-label="Admin navigation">
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {items.map((it) => (
            <li key={it.to} style={{ margin: 0 }}>
              <NavLink to={it.to} style={({ isActive }) => ({ display: 'block', padding: '10px 12px', textDecoration: 'none', color: isActive ? '#000' : '#444', background: isActive ? 'rgba(0,0,0,0.04)' : 'transparent' })}>
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
