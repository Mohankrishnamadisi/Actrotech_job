import React, { useEffect, useState } from 'react';
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
  Badge,
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
  AutoAwesome as AiCareerHubIcon,
  AssignmentTurnedIn as AssessmentsIcon,
  Groups as CommunityIcon,
  Recommend as ReferralIcon,
  School as MentorIcon,
  Event as EventIcon,
  AttachMoney as PricingIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import Swal from '@utils/sweetAlert';
import { useAuthStore } from '@store/index';
import { authService } from '@services/supabase';
import { notificationService, recruiterService } from '@services/api';
import { ROUTES, USER_ROLES } from '@constants/index';
import { generateInitials } from '@utils/index';
import { Logo } from '@components/common/Logo';
import { useSubscription, useThemeMode } from '@hooks/index';

export const MobileNavbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { subscription } = useSubscription(user?.id || null);
  const { setThemeMode } = useThemeMode();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [recruiterAvatar, setRecruiterAvatar] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);
  const isDarkMode = theme.palette.mode === 'dark';
  const showPremiumThemeToggle = Boolean(
    user
      && user.role === USER_ROLES.JOB_SEEKER
      && subscription
  );

  useEffect(() => {
    if (!user?.id) {
      setNotificationCount(0);
      setRecruiterAvatar('');
      return undefined;
    }

    let mounted = true;
    const loadRecruiterAvatar = async () => {
      if (user.role !== USER_ROLES.RECRUITER) {
        if (mounted) setRecruiterAvatar('');
        return;
      }
      try {
        const profile = await recruiterService.getRecruiterProfile(user.id);
        if (!mounted) return;
        setRecruiterAvatar(String(profile?.company_logo_url || profile?.logo_url || '').trim());
      } catch {
        if (mounted) setRecruiterAvatar('');
      }
    };

    const refreshUnreadNotifications = async () => {
      try {
        const unread = await notificationService.getUnreadNotifications(user.id);
        if (!mounted) return;
        setNotificationCount((unread || []).length);
      } catch {
        if (mounted) setNotificationCount(0);
      }
    };

    loadRecruiterAvatar();
    refreshUnreadNotifications();
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshUnreadNotifications();
      }
    }, 30000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [user?.id, user?.role]);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleMenuClose = () => {
    setDrawerOpen(false);
  };

  const handleNotificationsClick = () => {
    if (!user) return;
    navigate(ROUTES.DASHBOARD_NOTIFICATIONS);
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
    { label: 'Assessments', to: ROUTES.DASHBOARD_ASSESSMENTS, icon: AssessmentsIcon },
    { label: 'Community', to: ROUTES.DASHBOARD_COMMUNITY, icon: CommunityIcon },
    { label: 'Referrals', to: ROUTES.DASHBOARD_REFERRALS, icon: ReferralIcon },
    { label: 'Mentorship', to: ROUTES.DASHBOARD_MENTORSHIP, icon: MentorIcon },
    { label: 'Events', to: ROUTES.DASHBOARD_EVENTS, icon: EventIcon },
    { label: 'AI Career Hub', to: ROUTES.DASHBOARD_AI_CAREER_HUB, icon: AiCareerHubIcon },
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
              src={user.role === USER_ROLES.RECRUITER ? (recruiterAvatar || user.avatar) : user.avatar}
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
        background: isDarkMode ? 'rgba(10, 15, 30, 0.96)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(18px)',
        borderBottom: `1px solid ${isDarkMode ? '#334155' : 'rgba(226,232,240,0.9)'}`,
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
        {showPremiumThemeToggle ? (
          <IconButton
            onClick={() => setThemeMode(isDarkMode ? 'light' : 'dark')}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            sx={{
              ml: 'auto',
              mr: 0.5,
              bgcolor: isDarkMode ? 'rgba(250, 204, 21, 0.2)' : 'rgba(15, 23, 42, 0.08)',
              color: isDarkMode ? '#FACC15' : '#0F172A',
              border: `1px solid ${isDarkMode ? 'rgba(250, 204, 21, 0.35)' : 'rgba(15,23,42,0.16)'}`,
              '&:hover': {
                bgcolor: isDarkMode ? 'rgba(250, 204, 21, 0.28)' : 'rgba(15, 23, 42, 0.14)',
              },
            }}
          >
            {isDarkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </IconButton>
        ) : null}
        {user && (
          <IconButton
            onClick={handleNotificationsClick}
            aria-label="Notifications"
            sx={{
              color: isDarkMode ? '#E2E8F0' : '#0F172A',
              mr: 0.5,
              bgcolor: isDarkMode ? 'rgba(30, 41, 59, 0.82)' : 'rgba(248, 250, 252, 0.96)',
              border: isDarkMode ? '1px solid rgba(148, 163, 184, 0.35)' : '1px solid rgba(148, 163, 184, 0.25)',
              '&:hover': {
                bgcolor: isDarkMode ? 'rgba(51, 65, 85, 0.86)' : 'rgba(241, 245, 249, 1)',
              },
            }}
          >
            <Badge
              badgeContent={notificationCount > 0 ? notificationCount : 0}
              color="error"
              overlap="circular"
              invisible={notificationCount <= 0}
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: 10,
                  minWidth: 18,
                  height: 18,
                  padding: '0 4px',
                  borderRadius: 999,
                  fontWeight: 700,
                },
              }}
            >
              <NotificationsIcon fontSize="small" />
            </Badge>
          </IconButton>
        )}
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
            bgcolor: isDarkMode ? '#0B0F17' : undefined,
            color: isDarkMode ? '#FFFFFF' : undefined,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </AppBar>
  );
};
