import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Badge, Button, Dropdown, Empty, Input, Layout, List, Modal, Popover, Space, Typography, message } from 'antd';
import type { MenuProps } from 'antd';
import {
  BellOutlined,
  HomeOutlined,
  LeftOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { adminService } from '../services/admin';
import { authService } from '@services/supabase';
import { useAuthStore } from '@store/index';
import { ROUTES } from '../constants';

const { Header } = Layout;

type AdminTopbarProps = {
  drawerWidth?: number;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
};

const AdminTopbar: React.FC<AdminTopbarProps> = ({
  drawerWidth = 268,
  collapsed = false,
  onToggleCollapsed,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loadingNotifications, setLoadingNotifications] = React.useState(false);

  const pageLabel = React.useMemo(() => {
    const chunk = location.pathname.split('/').filter(Boolean).pop() || 'dashboard';
    return chunk.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }, [location.pathname]);

  const loadNotifications = React.useCallback(async () => {
    setLoadingNotifications(true);
    try {
      const [list, unread] = await Promise.all([
        adminService.getAdminNotifications(10),
        adminService.getUnreadNotificationsCount(),
      ]);
      setNotifications(list || []);
      setUnreadCount(unread || 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  React.useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAllRead = async () => {
    try {
      await adminService.markAllNotificationsRead();
      message.success('All notifications marked as read');
      await loadNotifications();
    } catch {
      message.error('Unable to mark notifications as read');
    }
  };

  const markSingleRead = async (id: string) => {
    try {
      await adminService.markNotificationRead(id);
      await loadNotifications();
    } catch {
      // noop
    }
  };

  const performLogout = async () => {
    try {
      await authService.signOut();
    } catch {
      // Ignore Supabase signout failures and proceed with local logout.
    } finally {
      logout();
      message.success('Logged out successfully');
      navigate(ROUTES.LOGIN, { replace: true });
    }
  };

  const handleLogout = () => {
    Modal.confirm({
      title: 'Logout?',
      content: 'Are you sure you want to logout from admin dashboard?',
      okText: 'Yes, Logout',
      cancelText: 'Cancel',
      okButtonProps: { danger: true },
      onOk: async () => {
        await performLogout();
      },
    });
  };

  const profileMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: user?.name || user?.email || 'Admin Profile',
      disabled: true,
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Admin Settings',
      onClick: () => navigate(ROUTES.ADMIN_SETTINGS),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      danger: true,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  const notificationContent = (
    <div style={{ width: 360 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Typography.Text strong>Notifications</Typography.Text>
        <Button type="link" size="small" onClick={markAllRead} disabled={unreadCount === 0}>
          Mark all read
        </Button>
      </div>
      {notifications.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No notifications" />
      ) : (
        <List
          size="small"
          loading={loadingNotifications}
          dataSource={notifications}
          renderItem={(item: any) => (
            <List.Item
              style={{ cursor: item.read ? 'default' : 'pointer', paddingLeft: 8, paddingRight: 8 }}
              onClick={() => {
                if (!item.read && item.id) markSingleRead(String(item.id));
              }}
            >
              <List.Item.Meta
                title={<Typography.Text strong={!item.read}>{item.title || 'Notification'}</Typography.Text>}
                description={
                  <Space direction="vertical" size={0}>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {item.message || '-'}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      {item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent'}
                    </Typography.Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );

  return (
    <Header
      style={{
        position: 'fixed',
        left: collapsed ? 80 : drawerWidth,
        right: 0,
        top: 0,
        height: 74,
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
        padding: '0 20px',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Space size={10}>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggleCollapsed}
        />
        <Button icon={<LeftOutlined />} onClick={() => navigate(-1)} />
        <div>
          <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', lineHeight: 1.1 }}>
            Admin / {pageLabel}
          </Typography.Text>
          <Typography.Title level={5} style={{ margin: 0, lineHeight: 1.25, color: '#0f172a' }}>
            Admin Portal
          </Typography.Title>
        </div>
      </Space>

      <Space size={10}>
        <Input prefix={<SearchOutlined />} placeholder="Search admin tools" style={{ width: 240 }} />
        <Button icon={<HomeOutlined />} onClick={() => navigate(ROUTES.HOME)} />
        <Popover trigger="click" placement="bottomRight" content={notificationContent}>
          <Badge count={unreadCount} size="small" overflowCount={99}>
            <Button icon={<BellOutlined />} />
          </Badge>
        </Popover>
        <Dropdown trigger={['click']} menu={{ items: profileMenuItems }} placement="bottomRight">
          <Avatar style={{ backgroundColor: '#1d4ed8', cursor: 'pointer' }}>
            {(user?.name || user?.email || 'A').charAt(0).toUpperCase()}
          </Avatar>
        </Dropdown>
      </Space>
    </Header>
  );
};

export default AdminTopbar;
