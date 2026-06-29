import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Typography } from 'antd';
import {
  AppstoreOutlined,
  BarChartOutlined,
  BugOutlined,
  CustomerServiceOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  FileSearchOutlined,
  SettingOutlined,
  TeamOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { ROUTES } from '../constants';

const { Sider } = Layout;

const items = [
  { label: 'Dashboard', to: ROUTES.ADMIN_DASHBOARD, icon: <DashboardOutlined /> },
  { label: 'Users', to: ROUTES.ADMIN_USERS, icon: <UserOutlined /> },
  { label: 'Recruiters', to: ROUTES.ADMIN_RECRUITERS, icon: <TeamOutlined /> },
  { label: 'Candidates', to: ROUTES.ADMIN_CANDIDATES, icon: <TeamOutlined /> },
  { label: 'Jobs', to: ROUTES.ADMIN_JOBS, icon: <ToolOutlined /> },
  { label: 'Applications', to: ROUTES.ADMIN_APPLICATIONS, icon: <FileSearchOutlined /> },
  { label: 'Customer Care', to: ROUTES.ADMIN_CUSTOMER_CARE, icon: <CustomerServiceOutlined /> },
  { label: 'Subscribers', to: ROUTES.ADMIN_SUBSCRIPTIONS, icon: <DatabaseOutlined /> },
  { label: 'Analytics', to: ROUTES.ADMIN_ANALYTICS, icon: <BarChartOutlined /> },
  { label: 'Bulk Activities', to: ROUTES.ADMIN_BULK_IMPORT, icon: <AppstoreOutlined /> },
  { label: 'Data Integrity', to: ROUTES.ADMIN_DATA_INTEGRITY, icon: <BugOutlined /> },
  { label: 'System Health', to: ROUTES.ADMIN_SYSTEM_HEALTH, icon: <BarChartOutlined /> },
  { label: 'Settings', to: ROUTES.ADMIN_SETTINGS, icon: <SettingOutlined /> },
];

type AdminSidebarProps = {
  drawerWidth?: number;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
};

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  drawerWidth = 268,
  collapsed = false,
  onCollapsedChange,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const selected = React.useMemo(() => {
    const match = items.find((item) => location.pathname.startsWith(item.to));
    return match ? [match.to] : [ROUTES.ADMIN_DASHBOARD];
  }, [location.pathname]);

  const menuItems = items.map((it) => ({ key: it.to, icon: it.icon, label: it.label }));

  return (
    <Sider
      width={drawerWidth}
      collapsed={collapsed}
      collapsible
      onCollapse={(value) => onCollapsedChange?.(value)}
      breakpoint="lg"
      theme="light"
      style={{
        borderRight: '1px solid rgba(148, 163, 184, 0.18)',
        boxShadow: '2px 0 20px rgba(15, 23, 42, 0.05)',
      }}
    >
      <div style={{ height: 70, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? 0 : '0 18px', borderBottom: '1px solid rgba(148, 163, 184, 0.14)' }}>
        <Typography.Title level={5} style={{ margin: 0, color: '#0f172a' }}>
          {collapsed ? 'AD' : 'Admin Desk'}
        </Typography.Title>
      </div>

      <Menu
        mode="inline"
        selectedKeys={selected}
        items={menuItems}
        style={{ borderInlineEnd: 'none', paddingTop: 10 }}
        onClick={({ key }) => navigate(String(key))}
      />
    </Sider>
  );
};

export default AdminSidebar;
