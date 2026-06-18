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
  Drawer,
  List,
  ListItem,
  ListItemText,
  Avatar,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Menu as MenuIcon, Close as CloseIcon, AccountCircle as AccountCircleIcon, Logout as LogoutIcon } from '@mui/icons-material';
import { useAuthStore } from '@store/index';
import { authService } from '@services/supabase';
import { ROUTES } from '@constants/index';
import { generateInitials } from '@utils/index';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      logout();
      navigate(ROUTES.HOME);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navItems = [
    { label: 'Jobs', to: ROUTES.JOBS },
    { label: 'Pricing', to: ROUTES.PRICING },
    { label: 'About', to: ROUTES.ABOUT },
    { label: 'Contact', to: ROUTES.CONTACT },
  ];

  return (
    <>
      <AppBar position="sticky" elevation={0}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box
              component={RouterLink}
              to={ROUTES.HOME}
              sx={{
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '1.5rem',
                color: 'primary.main',
                letterSpacing: -0.5,
              }}
            >
              Actotech Jobs
            </Box>

            {/* Desktop Navigation */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3, alignItems: 'center' }}>
              {navItems.map((item) => (
                <Button
                  key={item.to}
                  component={RouterLink}
                  to={item.to}
                  sx={{
                    color: 'text.primary',
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    '&:hover': {
                      color: 'primary.main',
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>

            {/* Auth Buttons */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {!user ? (
                <>
                  <Button
                    component={RouterLink}
                    to={ROUTES.LOGIN}
                    variant="text"
                    sx={{ display: { xs: 'none', sm: 'block' } }}
                  >
                    Login
                  </Button>
                  <Button component={RouterLink} to={ROUTES.SIGNUP} variant="contained">
                    Sign Up
                  </Button>
                </>
              ) : (
                <>
                  <IconButton onClick={handleMenuOpen} size="small">
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                      }}
                    >
                      {generateInitials(user.name)}
                    </Avatar>
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    PaperProps={{
                      sx: {
                        background: 'rgba(30, 41, 59, 0.95)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(148, 163, 184, 0.1)',
                      },
                    }}
                  >
                    <MenuItem
                      component={RouterLink}
                      to={ROUTES.DASHBOARD}
                      onClick={handleMenuClose}
                    >
                      <AccountCircleIcon sx={{ mr: 1 }} /> Dashboard
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>
                      <LogoutIcon sx={{ mr: 1 }} /> Logout
                    </MenuItem>
                  </Menu>
                </>
              )}

              {/* Mobile Menu */}
              <IconButton
                sx={{ display: { xs: 'block', md: 'none' } }}
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <CloseIcon /> : <MenuIcon />}
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Box sx={{ width: 250, pt: 2 }}>
          <List>
            {navItems.map((item) => (
              <ListItem
                key={item.to}
                component={RouterLink}
                to={item.to}
                onClick={() => setMobileOpen(false)}
              >
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
};
