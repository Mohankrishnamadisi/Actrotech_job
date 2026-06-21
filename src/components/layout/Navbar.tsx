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
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Person as PersonIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  WorkOutline as WorkIcon,
  Settings as SettingsIcon,
  ExitToApp as ExitToAppIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import { useAuthStore } from '@store/index';
import { authService } from '@services/supabase';
import { ROUTES, USER_ROLES } from '@constants/index';
import { generateInitials } from '@utils/index';
import { Logo } from '@components/common/Logo';
import InstallApp from '@components/InstallApp/InstallApp';

const MotionBox = motion(Box);

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSettingsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
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
    <AppBar position="sticky" elevation={0}>
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
          }}
        >
          <Logo size="medium" />

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
            <Box sx={{ width: { xs: '100%', sm: 'auto' }, display: 'flex', justifyContent: { xs: 'center', sm: 'flex-end' } }}>
              <InstallApp />
            </Box>
            {(!user || user.role === USER_ROLES.RECRUITER) && (
              <MotionBox whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Button
                  component={RouterLink}
                  to={user?.role === USER_ROLES.RECRUITER ? ROUTES.RECRUITER_DASHBOARD : ROUTES.RECRUITER_REGISTER}
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
              <>
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
              </>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    display: { xs: 'none', sm: 'block' },
                    color: 'text.primary',
                  }}
                >
                  {user.name}
                </Typography>
                {user?.role === USER_ROLES.JOB_SEEKER && (
                  <>
                    <IconButton
                      component={RouterLink}
                      to={ROUTES.PRICING}
                      size="small"
                      sx={{
                        p: 0.75,
                        borderRadius: '10px',
                        minWidth: 0,
                        background: 'rgba(255, 215, 0, 0.16)',
                        color: '#FFD700',
                        boxShadow: '0 0 0 0 rgba(255, 215, 0, 0.2)',
                        transition: 'transform 180ms ease, box-shadow 180ms ease',
                        position: 'relative',
                        '&:hover': {
                          transform: 'scale(1.08)',
                          boxShadow: '0 0 24px 8px rgba(255, 215, 0, 0.35)',
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          inset: 0,
                          borderRadius: '10px',
                          background: 'radial-gradient(circle at top left, rgba(255,255,255,0.7), transparent 38%)',
                          opacity: 0,
                          transition: 'opacity 300ms ease',
                        },
                        '&:hover::before': {
                          opacity: 1,
                        },
                      }}
                      title="Subscription Plans"
                    >
                      <Box
                        component="img"
                        src="/crown.png"
                        alt="Crown"
                        sx={{
                          width: 24,
                          height: 24,
                          filter: 'invert(90%) sepia(95%) saturate(850%) hue-rotate(2deg) brightness(1.18) contrast(1.1)',
                          WebkitFilter: 'invert(90%) sepia(95%) saturate(850%) hue-rotate(2deg) brightness(1.18) contrast(1.1)',
                          animation: 'crownShine 2.4s ease-in-out infinite',
                          transformOrigin: 'center center',
                          display: 'block',
                        }}
                      />
                      <Box
                        component="span"
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: '10px',
                          pointerEvents: 'none',
                          boxShadow: '0 0 10px 4px rgba(255, 215, 0, 0.22)',
                        }}
                      />
                    </IconButton>
                  </>
                )}
                <IconButton onClick={handleSettingsOpen} size="small" sx={{ color: 'text.primary' }}>
                  <SettingsIcon sx={{ fontSize: 20 }} />
                </IconButton>
                <IconButton onClick={handleMenuOpen} size="small">
                  <Avatar
                    src={user.avatar}
                    sx={{
                      width: 36,
                      height: 36,
                      background: '#1D4ED8',
                      border: '2px solid #DBEAFE',
                    }}
                  >
                    {generateInitials(user.name)}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={settingsAnchorEl}
                  open={Boolean(settingsAnchorEl)}
                  onClose={handleSettingsClose}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  PaperProps={{
                    sx: {
                      background: '#FFFFFF',
                      border: '1px solid #E4E9F2',
                      borderRadius: 2,
                      boxShadow: '0 18px 40px rgba(15, 23, 42, 0.12)',
                      minWidth: 220,
                      mt: 1,
                    },
                  }}
                >
                  <MenuItem
                    component="a"
                    href="https://www.naukri.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleSettingsClose}
                  >
                    Naukri <OpenInNewIcon sx={{ fontSize: 18, ml: 1 }} />
                  </MenuItem>
                  <MenuItem
                    component="a"
                    href="https://www.linkedin.com/jobs/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleSettingsClose}
                  >
                    LinkedIn <OpenInNewIcon sx={{ fontSize: 18, ml: 1 }} />
                  </MenuItem>
                  <MenuItem
                    component="a"
                    href="https://www.indeed.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleSettingsClose}
                  >
                    Indeed <OpenInNewIcon sx={{ fontSize: 18, ml: 1 }} />
                  </MenuItem>
                </Menu>
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
