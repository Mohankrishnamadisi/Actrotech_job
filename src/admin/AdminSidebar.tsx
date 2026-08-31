import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants';
import '../styles/fixedSideNav.css';

const items = [
  { label: 'Dashboard', to: ROUTES.ADMIN_DASHBOARD },
  { label: 'Organizations', to: ROUTES.ADMIN_USERS },
  { label: 'Recruiters', to: ROUTES.ADMIN_RECRUITERS },
  { label: 'Candidates', to: ROUTES.ADMIN_CANDIDATES },
  { label: 'Jobs', to: ROUTES.ADMIN_JOBS },
  { label: 'Applications', to: ROUTES.ADMIN_APPLICATIONS },
  { label: 'Support', to: ROUTES.ADMIN_CUSTOMER_CARE },
  { label: 'Communities', to: ROUTES.ADMIN_COMMUNITIES },
  { label: 'Subscriptions', to: ROUTES.ADMIN_SUBSCRIPTIONS },
  { label: 'Global Settings', to: ROUTES.ADMIN_GLOBAL_SETTINGS },
  { label: 'Localization', to: ROUTES.ADMIN_LOCALIZATION },
  { label: 'Compliance', to: ROUTES.ADMIN_COMPLIANCE },
  { label: 'Regional Management', to: ROUTES.ADMIN_REGIONAL_MANAGEMENT },
  { label: 'Settings', to: ROUTES.ADMIN_SETTINGS },
];

type AdminSidebarProps = {
  drawerWidth?: number;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
};

const AdminSidebar: React.FC<AdminSidebarProps> = () => {
  const navigate = useNavigate();

  const handleMouseEnter = React.useCallback(() => {
    try { document.body.classList.add('nav-expanded'); } catch (e) {}
  }, []);
  const handleMouseLeave = React.useCallback(() => {
    try { document.body.classList.remove('nav-expanded'); } catch (e) {}
  }, []);

  return (
    <nav className="nav__cont" aria-label="Main navigation" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <ul className="nav">
        {items.map((it) => (
          <li
            className="nav__items"
            key={it.to}
            onClick={() => navigate(it.to)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') navigate(it.to); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden>
              <circle cx="12" cy="12" r="10" fill="#90A4AE" />
            </svg>
            <a>{it.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default AdminSidebar;
