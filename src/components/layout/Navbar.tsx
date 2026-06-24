import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Container,
  Button,
  Menu,
  MenuItem,
  IconButton,
  Avatar,
  Typography,
  Divider,
} from '@mui/material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Person as PersonIcon,
  Dashboard as DashboardIcon,
  WorkOutline as WorkIcon,
  Settings as SettingsIcon,
  ExitToApp as ExitToAppIcon,
  ArrowBackIosNew as ArrowBackIosNewIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import { useAuthStore } from '@store/index';
import { authService } from '@services/supabase';
import { ROUTES, USER_ROLES } from '@constants/index';
import { generateInitials } from '@utils/index';
import { Logo } from '@components/common/Logo';
import InstallApp from '@components/InstallApp/InstallApp';
import { useSubscription } from '@hooks/index';

const MotionBox = motion(Box);

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { subscription } = useSubscription(user?.id || null);
  const navigate = useNavigate();
  const location = useLocation();
  const isRecruiter = user?.role === USER_ROLES.RECRUITER;
  const canGoBack = location.pathname !== ROUTES.HOME && location.pathname !== '/';
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileAnchor, setMobileAnchor] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileAnchor(null);
  };

  const mobileNavItems = [
    { label: 'Home', to: ROUTES.HOME },
    { label: 'Jobs', to: ROUTES.JOBS },
    { label: 'Pricing', to: ROUTES.PRICING },
  ];

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
        Swal.fire({
          title: 'Error!',
          text: 'Failed to logout',
          icon: 'error',
          background: '#FFFFFF',
          color: '#172033',
        });
      }
    }
  };

  const dashboardRoute =
    user?.role === USER_ROLES.RECRUITER
      ? ROUTES.RECRUITER_DASHBOARD
      : ROUTES.DASHBOARD;

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderBottom: '1px solid rgba(226,232,240,0.9)',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar
          disableGutters
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'center', sm: 'center' },
            gap: { xs: 1.25, sm: 1 },
            py: { xs: 1.25, sm: 0.75 },
            px: { xs: 0, sm: 1 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'space-between', sm: 'flex-start' },
              ml: { xs: -1.5, sm: 0 },
            }}
          >
            {canGoBack && (
              <IconButton
                onClick={() => navigate(-1)}
                size="small"
                sx={{
                  bgcolor: 'background.paper',
                  border: '1px solid rgba(15,23,42,0.08)',
                  boxShadow: 1,
                  color: 'text.primary',
                  ml: { xs: 1, sm: 0 },
                }}
              >
                <ArrowBackIosNewIcon fontSize="small" />
              </IconButton>
            )}
            <Logo size="medium" />
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              alignItems: 'center',
              justifyContent: { xs: 'center', sm: 'flex-end' },
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            <IconButton
              onClick={handleMobileMenuOpen}
              sx={{ display: { xs: 'inline-flex', sm: 'none' }, color: 'text.primary' }}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={mobileAnchor}
              open={Boolean(mobileAnchor)}
              onClose={handleMobileMenuClose}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            >
              {mobileNavItems.map((item) => (
                <MenuItem
                  key={item.label}
                  component={RouterLink}
                  to={item.to}
                  onClick={handleMobileMenuClose}
                >
                  {item.label}
                </MenuItem>
              ))}
              {user ? (
                <>
                  <MenuItem
                    component={RouterLink}
                    to={dashboardRoute}
                    onClick={handleMobileMenuClose}
                  >
                    Dashboard
                  </MenuItem>
                  <MenuItem
                    component={RouterLink}
                    to={user?.role === USER_ROLES.RECRUITER ? ROUTES.RECRUITER_SUBSCRIPTION : ROUTES.PRICING}
                    onClick={handleMobileMenuClose}
                  >
                    Subscription
                  </MenuItem>
                  <MenuItem onClick={() => { handleMenuClose(); handleLogout(); }}>
                    Logout
                  </MenuItem>
                </>
              ) : (
                <>
                  <MenuItem
                    component={RouterLink}
                    to={ROUTES.LOGIN}
                    onClick={handleMobileMenuClose}
                  >
                    Login
                  </MenuItem>
                  <MenuItem
                    component={RouterLink}
                    to={ROUTES.SIGNUP}
                    onClick={handleMobileMenuClose}
                  >
                    Sign Up
                  </MenuItem>
                </>
              )}
            </Menu>

            <Box
              sx={{
                display: { xs: 'none', sm: 'flex' },
                width: { xs: '100%', sm: 'auto' },
                justifyContent: { xs: 'center', sm: 'flex-end' },
              }}
            >
              <InstallApp />
            </Box>
            {!user && (
              <MotionBox whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Button
                  component={RouterLink}
                  to={ROUTES.RECRUITER_REGISTER}
                  variant="outlined"
                  size="small"
                  startIcon={<WorkIcon sx={{ fontSize: 18 }} />}
                  sx={{
                    display: { xs: 'none', sm: 'flex' },
                    borderColor: 'divider',
                    color: 'primary.dark',
                    px: 1.25,
                    py: 0.65,
                    minWidth: 120,
                    fontSize: '0.85rem',
                    textTransform: 'none',
                    borderRadius: 2,
                    '&:hover': {
                      borderColor: 'primary.main',
                      background: 'rgba(59, 130, 246, 0.12)',
                    },
                  }}
                >
                  Post a Job
                </Button>
              </MotionBox>
            )}

            {!user ? (
              <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
                <Button
                  component={RouterLink}
                  to={ROUTES.LOGIN}
                  variant="text"
                  sx={{
                    color: 'text.primary',
                    textTransform: 'none',
                    px: 1.4,
                    py: 0.65,
                    fontSize: '0.9rem',
                    borderRadius: 999,
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  Login
                </Button>
                <MotionBox whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    component={RouterLink}
                    to={ROUTES.SIGNUP}
                    variant="contained"
                    sx={{
                      textTransform: 'none',
                      px: 1.8,
                      py: 0.75,
                      fontSize: '0.9rem',
                      borderRadius: '999px',
                      background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                      boxShadow: '0 10px 18px rgba(37, 99, 235, 0.18)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)',
                      },
                    }}
                  >
                    Register
                  </Button>
                </MotionBox>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Button
                  component={RouterLink}
                  to={user?.role === USER_ROLES.RECRUITER ? ROUTES.RECRUITER_SUBSCRIPTION : ROUTES.PRICING}
                  variant="contained"
                  size="small"
                  startIcon={
                    <Box
                      component="img"
                      src="/crown.png"
                      alt="Crown icon"
                      sx={{
                        width: 20,
                        height: 20,
                        display: 'block',
                        animation: 'crownGlow 3s ease-in-out infinite',
                      }}
                    />
                  }
                  sx={{
                    textTransform: 'none',
                    px: 1.5,
                    py: 0.7,
                    minWidth: 140,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: '#ffffff',
                    boxShadow: '0 12px 24px rgba(245, 158, 11, 0.18)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                    },
                    '@keyframes crownGlow': {
                      '0%, 100%': {
                        transform: 'rotate(0deg)',
                        boxShadow: '0 0 0 rgba(255, 215, 0, 0)',
                      },
                      '25%': {
                        transform: 'rotate(6deg)',
                        boxShadow: '0 0 10px rgba(245, 158, 11, 0.45)',
                      },
                      '50%': {
                        transform: 'rotate(0deg)',
                        boxShadow: '0 0 0 rgba(255, 215, 0, 0)',
                      },
                      '75%': {
                        transform: 'rotate(-6deg)',
                        boxShadow: '0 0 10px rgba(245, 158, 11, 0.45)',
                      },
                    },
                  }}
                >
                  {subscription ? 'Subscribed' : 'Subscribe'}
                </Button>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      display: { xs: 'none', sm: 'block' },
                      color: subscription ? '#B45309' : 'text.primary',
                    }}
                  >
                    {user.name}
                  </Typography>
                  <IconButton
                  onClick={handleMenuOpen}
                  size="small"
                  sx={{
                    position: 'relative',
                    '&::after': isRecruiter
                      ? {
                          content: '""',
                          position: 'absolute',
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #FACC15, #F59E0B)',
                          border: '2px solid #ffffff',
                          right: 0,
                          top: 0,
                          boxShadow: '0 0 0 4px rgba(251, 191, 36, 0.15)',
                        }
                      : {},
                  }}
                >
                  <Avatar
                    src={user.avatar}
                    sx={{
                      width: 40,
                      height: 40,
                      background: isRecruiter
                        ? 'radial-gradient(circle at top left, #FDE68A, #F59E0B 55%, #C2410C)'
                        : subscription
                        ? '#FFFBEB'
                        : '#1D4ED8',
                      border: isRecruiter
                        ? '2px solid #FBBF24'
                        : subscription
                        ? '2px solid #FFD700'
                        : '2px solid #DBEAFE',
                      color: isRecruiter ? '#92400E' : subscription ? '#B45309' : '#FFFFFF',
                      boxShadow: isRecruiter
                        ? '0 0 0 6px rgba(245, 158, 11, 0.16)'
                        : 'none',
                    }}
                  >
                    {generateInitials(user.name)}
                  </Avatar>
                </IconButton>
                </Box>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  PaperProps={{
                    sx: {
                      background: '#FFFFFF',
                      border: '1px solid #E4E9F2',
                      borderRadius: 2,
                      boxShadow: '0 18px 40px rgba(15, 23, 42, 0.12)',
                      minWidth: 200,
                      mt: 1,
                    },
                  }}
                >
                  <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {user.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {user.email}
                    </Typography>
                  </Box>
                  <Divider sx={{ borderColor: 'divider' }} />
                  <MenuItem
                    component={RouterLink}
                    to={dashboardRoute}
                    onClick={handleMenuClose}
                  >
                    <DashboardIcon sx={{ mr: 1.5, fontSize: 20 }} /> Dashboard
                  </MenuItem>
                  <MenuItem
                    component={RouterLink}
                    to={ROUTES.DASHBOARD_PROFILE}
                    onClick={handleMenuClose}
                  >
                    <PersonIcon sx={{ mr: 1.5, fontSize: 20 }} /> My Profile
                  </MenuItem>
                  <MenuItem
                    component={RouterLink}
                    to={ROUTES.DASHBOARD_SETTINGS}
                    onClick={handleMenuClose}
                  >
                    <SettingsIcon sx={{ mr: 1.5, fontSize: 20 }} /> Settings
                  </MenuItem>
                  <Divider sx={{ borderColor: 'divider' }} />
                  <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                    <ExitToAppIcon sx={{ mr: 1.5, fontSize: 20 }} /> Logout
                  </MenuItem>
                </Menu>
              </Box>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};
