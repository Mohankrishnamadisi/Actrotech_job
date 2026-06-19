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
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import { useAuthStore } from '@store/index';
import { authService } from '@services/supabase';
import { ROUTES, USER_ROLES } from '@constants/index';
import { generateInitials } from '@utils/index';
import { Logo } from '@components/common/Logo';

const MotionBox = motion(Box);

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
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
        <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
          <Logo size="medium" />

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <MotionBox whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                component={RouterLink}
                to={ROUTES.RECRUITER_REGISTER}
                variant="outlined"
                size="small"
                startIcon={<WorkIcon />}
                sx={{
                  display: { xs: 'none', sm: 'flex' },
                  borderColor: 'divider',
                  color: 'primary.dark',
                  '&:hover': {
                    borderColor: 'primary.main',
                    background: 'primary.light',
                  },
                }}
              >
                Post a Job
              </Button>
            </MotionBox>

            {!user ? (
              <>
                <Button
                  component={RouterLink}
                  to={ROUTES.LOGIN}
                  variant="text"
                  sx={{ color: 'text.primary' }}
                >
                  Login
                </Button>
                <MotionBox whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button component={RouterLink} to={ROUTES.SIGNUP} variant="contained">
                    Register
                  </Button>
                </MotionBox>
              </>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
                    <LogoutIcon sx={{ mr: 1.5, fontSize: 20 }} /> Logout
                  </MenuItem>
                </Menu>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleLogout}
                  startIcon={<LogoutIcon />}
                  sx={{
                    display: { xs: 'none', md: 'flex' },
                    borderColor: 'rgba(239, 68, 68, 0.4)',
                    color: 'error.main',
                    '&:hover': {
                      borderColor: 'error.main',
                      background: 'rgba(239, 68, 68, 0.1)',
                    },
                  }}
                >
                  Logout
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};
