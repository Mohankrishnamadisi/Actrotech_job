import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import SupportWidget from '@components/common/SupportWidget';

const { Content } = Layout;
const drawerWidth = 268;

const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fb' }}>
      <AdminSidebar
        drawerWidth={drawerWidth}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
      />
      <Layout>
        <AdminTopbar
          drawerWidth={drawerWidth}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((prev) => !prev)}
        />
        <Content style={{ margin: '96px 18px 18px', minHeight: 280 }}>
          <div
            style={{
              borderRadius: 14,
              padding: 18,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.94), rgba(248,251,255,0.98))',
              boxShadow: '0 12px 30px rgba(15, 23, 42, 0.07)',
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>

      <SupportWidget audience="admin" />
    </Layout>
  );
};

export default AdminLayout;
