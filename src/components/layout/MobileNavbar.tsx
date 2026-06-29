import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  Work as WorkIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  ExitToApp as ExitToAppIcon,
  Person as PersonIcon,
  Bookmark as BookmarkIcon,
  Notifications as NotificationsIcon,
  AttachMoney as PricingIcon,
} from '@mui/icons-material';
import Swal from '@utils/sweetAlert';
import { useAuthStore } from '@store/index';
import { authService } from '@services/supabase';
import { ROUTES, USER_ROLES } from '@constants/index';
import { generateInitials } from '@utils/index';
import { Logo } from '@components/common/Logo';

export const MobileNavbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleMenuClose = () => {
    setDrawerOpen(false);
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Logout?',
      text: 'Are you sure you want to logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1D4ED8',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'Cancel',
      background: '#FFFFFF',
      color: '#172033',
    });

    if (result.isConfirmed) {
      try {
        await authService.signOut();
        logout();
        handleMenuClose();
        navigate(ROUTES.HOME);
        Swal.fire({
          title: 'Logged out successfully!',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: '#FFFFFF',
          color: '#172033',
        });
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }
  };

  const publicMenuItems = [
    { label: 'Home', to: ROUTES.HOME, icon: HomeIcon },
    { label: 'Jobs', to: ROUTES.JOBS, icon: WorkIcon },
    { label: 'Pricing', to: ROUTES.PRICING, icon: PricingIcon },
  ];

  const recruiterMenuItems = [
    { label: 'Dashboard', to: ROUTES.RECRUITER_DASHBOARD, icon: DashboardIcon },
    { label: 'Post Job', to: ROUTES.RECRUITER_REGISTER, icon: WorkIcon },
    { label: 'Manage Jobs', to: ROUTES.RECRUITER_DASHBOARD, icon: DashboardIcon },
  ];

  const jobSeekerMenuItems = [
    { label: 'Dashboard', to: ROUTES.DASHBOARD, icon: DashboardIcon },
    { label: 'Browse Jobs', to: ROUTES.JOBS, icon: WorkIcon },
    { label: 'Saved Jobs', to: ROUTES.DASHBOARD_SAVED_JOBS, icon: BookmarkIcon },
    { label: 'Applications', to: ROUTES.DASHBOARD_APPLICATIONS, icon: WorkIcon },
    { label: 'Notifications', to: ROUTES.DASHBOARD_NOTIFICATIONS, icon: NotificationsIcon },
    { label: 'Profile', to: ROUTES.DASHBOARD_PROFILE, icon: PersonIcon },
    { label: 'Settings', to: ROUTES.DASHBOARD_SETTINGS_ACCOUNT, icon: SettingsIcon },
  ];

  const menuItems = user
    ? user.role === USER_ROLES.RECRUITER
      ? recruiterMenuItems
      : jobSeekerMenuItems
    : publicMenuItems;

  const drawerContent = (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Logo size="small" />
        <IconButton onClick={handleMenuClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {user && (
        <>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#f5f5f5' }}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#fff',
                fontWeight: 700,
              }}
            >
              {generateInitials(user.name)}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {user.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {user.role === USER_ROLES.RECRUITER ? 'Recruiter' : 'Job Seeker'}
              </Typography>
            </Box>
          </Box>
          <Divider />
        </>
      )}

      <List sx={{ flex: 1, overflow: 'auto' }}>
        {menuItems.map((item) => (
          <ListItem
            key={item.label}
            component={RouterLink}
            to={item.to}
            onClick={handleMenuClose}
            sx={{
              py: 1.5,
              px: 2,
              color: location.pathname === item.to ? 'primary.main' : 'text.primary',
              bgcolor: location.pathname === item.to ? '#EFF6FF' : 'transparent',
              borderLeft: location.pathname === item.to ? '3px solid' : 'none',
              borderLeftColor: location.pathname === item.to ? 'primary.main' : 'transparent',
              '&:hover': {
                bgcolor: '#f5f5f5',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
              <item.icon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{ variant: 'body2', sx: { fontWeight: 500 } }}
            />
          </ListItem>
        ))}
      </List>

      {user && (
        <>
          <Divider />
          <ListItem
            onClick={() => {
              handleLogout();
            }}
            sx={{
              py: 1.5,
              px: 2,
              color: 'error.main',
              '&:hover': {
                bgcolor: '#f5f5f5',
              },
              cursor: 'pointer',
            }}
          >
            <ListItemIcon sx={{ color: 'error.main', minWidth: 40 }}>
              <ExitToAppIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{ variant: 'body2', sx: { fontWeight: 500 } }}
            />
          </ListItem>
        </>
      )}

      {!user && (
        <>
          <Divider />
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box
              component={RouterLink}
              to={ROUTES.LOGIN}
              onClick={handleMenuClose}
              sx={{
                px: 2,
                py: 1,
                textAlign: 'center',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                color: 'text.primary',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: '#f5f5f5',
                },
              }}
            >
              Login
            </Box>
            <Box
              component={RouterLink}
              to={ROUTES.SIGNUP}
              onClick={handleMenuClose}
              sx={{
                px: 2,
                py: 1,
                textAlign: 'center',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                borderRadius: 2,
                color: '#fff',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Sign Up
            </Box>
          </Box>
        </>
      )}
    </Box>
  );

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(18px)',
        borderBottom: '1px solid rgba(226,232,240,0.9)',
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 1.5,
          py: 1,
        }}
      >
        <Logo size="small" />
        <IconButton
          onClick={handleDrawerToggle}
          sx={{ color: 'text.primary' }}
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            width: '280px',
            maxWidth: '100vw',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </AppBar>
  );
};
