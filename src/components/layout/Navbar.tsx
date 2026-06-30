import React, { useEffect, useState } from 'react';
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
  HeadsetMic as HeadsetMicIcon,
  Menu as MenuIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Apartment as ApartmentIcon,
  TravelExplore as TravelExploreIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import Swal from '@utils/sweetAlert';
import { useAuthStore } from '@store/index';
import { authService } from '@services/supabase';
import { ROUTES, USER_ROLES } from '@constants/index';
import { generateInitials } from '@utils/index';
import { Logo } from '@components/common/Logo';
import InstallApp from '@components/InstallApp/InstallApp';
import { useSubscription, useThemeMode } from '@hooks/index';
import SupportWidget from '@components/common/SupportWidget';
import { supportService } from '@services/support';
import { AnimatedBackButton } from '@components/common/AnimatedBackButton';
import '../../styles/navbarPremiumButton.css';

const MotionBox = motion(Box);

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { subscription } = useSubscription(user?.id || null);
  const { setThemeMode } = useThemeMode();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isRecruiter = user?.role === USER_ROLES.RECRUITER;
  const isDarkMode = theme.palette.mode === 'dark';
  const showPremiumThemeToggle = Boolean(
    user
      && !isRecruiter
      && subscription
      && location.pathname === ROUTES.DASHBOARD,
  );
  const canGoBack = location.pathname !== ROUTES.HOME && location.pathname !== '/';
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileAnchor, setMobileAnchor] = useState<null | HTMLElement>(null);
  const [exploreAnchor, setExploreAnchor] = useState<null | HTMLElement>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const [ticketNotifCount, setTicketNotifCount] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setTicketNotifCount(0);
      return;
    }
    supportService.getUnseenAdminResponseCount(user.id).then(setTicketNotifCount).catch(() => setTicketNotifCount(0));
  }, [user?.id, supportOpen]);

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

  const handleExploreMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setExploreAnchor(event.currentTarget);
  };

  const handleExploreMenuClose = () => {
    setExploreAnchor(null);
  };

  const mobileNavItems = [
    { label: 'Home', to: ROUTES.HOME },
    { label: 'Jobs', to: ROUTES.JOBS },
  ];

  const desktopNavItems = [
    { label: 'Home', to: ROUTES.HOME },
    { label: 'Jobs', to: ROUTES.JOBS },
  ];

  const featuredCompanies = [
    { label: 'TCS Jobs', to: `${ROUTES.JOBS}?keyword=TCS` },
    { label: 'Infosys Jobs', to: `${ROUTES.JOBS}?keyword=Infosys` },
    { label: 'Wipro Jobs', to: `${ROUTES.JOBS}?keyword=Wipro` },
    { label: 'Cognizant Jobs', to: `${ROUTES.JOBS}?keyword=Cognizant` },
    { label: 'Accenture Jobs', to: `${ROUTES.JOBS}?keyword=Accenture` },
    { label: 'Capgemini Jobs', to: `${ROUTES.JOBS}?keyword=Capgemini` },
  ];

  const jobCollections = [
    { label: 'Remote Roles', to: `${ROUTES.JOBS}?workMode=Remote` },
    { label: 'Hybrid Jobs', to: `${ROUTES.JOBS}?workMode=Hybrid` },
    { label: 'Internships', to: `${ROUTES.JOBS}?jobType=Internship` },
    { label: 'Fresher Openings', to: `${ROUTES.JOBS}?experience=0-1 years` },
    { label: 'Last 7 Days', to: `${ROUTES.JOBS}?freshness=7d` },
  ];

  const featureTools = [
    { label: 'Recommended Jobs', to: '/dashboard/recommended-jobs' },
    { label: 'Remote Dashboard', to: '/dashboard/remote-jobs' },
    { label: 'Mock Interviews', to: '/dashboard/mock-interviews' },
    { label: 'Resume Review', to: '/dashboard/resume-review' },
    { label: 'Priority Apply', to: '/dashboard/priority-apply' },
  ];

  const goToFeature = (to: string) => {
    handleExploreMenuClose();
    handleMobileMenuClose();
    navigate(to);
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

  const getCurrentHashRoute = () => {
    const hash = window.location.hash || '';
    const route = hash.startsWith('#') ? hash.slice(1) : hash;
    return route || '/';
  };

  const handleBackNavigation = () => {
    const fallbackRoute = user ? dashboardRoute : ROUTES.HOME;

    if (window.history.length > 1) {
      const beforeRoute = getCurrentHashRoute();
      window.history.back();

      window.setTimeout(() => {
        const afterRoute = getCurrentHashRoute();
        if (afterRoute === beforeRoute) {
          navigate(fallbackRoute, { replace: true });
        }
      }, 180);
      return;
    }

    navigate(fallbackRoute, { replace: true });
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        background: isDarkMode ? 'rgba(10, 15, 30, 0.86)' : 'rgba(255, 255, 255, 0.9)',
        borderBottom: isDarkMode ? '1px solid rgba(71, 85, 105, 0.5)' : '1px solid rgba(226, 232, 240, 0.92)',
        top: 0,
        width: '100%',
        zIndex: 1200,
        backdropFilter: 'blur(10px)',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar
          disableGutters
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: { xs: 0.9, md: 1.2 },
            py: { xs: 0.95, sm: 0.9 },
            px: { xs: 0.3, sm: 0.8 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexShrink: 0,
            }}
          >
            {canGoBack && (
              <Box
                onClick={handleBackNavigation}
                sx={{
                  transform: 'scale(0.62)',
                  transformOrigin: 'left center',
                  ml: -1,
                  cursor: 'pointer',
                }}
              >
                <AnimatedBackButton onClick={handleBackNavigation} ariaLabel="Go back" />
              </Box>
            )}
            <Logo size="medium" />
          </Box>

          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            {desktopNavItems.map((item) => {
              const isActive = location.pathname === item.to;

              return (
                <Button
                  key={item.label}
                  component={RouterLink}
                  to={item.to}
                  sx={{
                    textTransform: 'none',
                    px: 1.4,
                    py: 0.5,
                    borderRadius: 2,
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: isActive ? 'primary.main' : 'text.primary',
                    bgcolor: isActive ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                    '&:hover': {
                      bgcolor: isActive ? 'rgba(37, 99, 235, 0.14)' : 'rgba(148, 163, 184, 0.14)',
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}

            <Button
              onClick={handleExploreMenuOpen}
              endIcon={<KeyboardArrowDownIcon />}
              sx={{
                textTransform: 'none',
                px: 1.4,
                py: 0.5,
                borderRadius: 2,
                fontWeight: 700,
                fontSize: '0.9rem',
                color: location.pathname === ROUTES.JOBS ? 'primary.main' : 'text.primary',
                bgcolor: location.pathname === ROUTES.JOBS ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                '&:hover': {
                  bgcolor: 'rgba(148, 163, 184, 0.14)',
                },
              }}
            >
              Explore
            </Button>
            <Menu
              anchorEl={exploreAnchor}
              open={Boolean(exploreAnchor)}
              onClose={handleExploreMenuClose}
              anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
              transformOrigin={{ horizontal: 'center', vertical: 'top' }}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 320,
                  borderRadius: 2.5,
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 18px 36px rgba(15, 23, 42, 0.12)',
                  py: 0.6,
                },
              }}
            >
              <MenuItem disabled sx={{ opacity: 1, fontSize: '0.74rem', fontWeight: 800, color: '#64748B', letterSpacing: 0.8 }}>
                <ApartmentIcon sx={{ mr: 1, fontSize: 18 }} /> Posted Companies
              </MenuItem>
              {featuredCompanies.map((item) => (
                <MenuItem key={item.label} onClick={() => goToFeature(item.to)}>
                  {item.label}
                </MenuItem>
              ))}
              <Divider sx={{ my: 0.5 }} />
              <MenuItem disabled sx={{ opacity: 1, fontSize: '0.74rem', fontWeight: 800, color: '#64748B', letterSpacing: 0.8 }}>
                <TravelExploreIcon sx={{ mr: 1, fontSize: 18 }} /> Job Collections
              </MenuItem>
              {jobCollections.map((item) => (
                <MenuItem key={item.label} onClick={() => goToFeature(item.to)}>
                  {item.label}
                </MenuItem>
              ))}
            </Menu>
          </Box>

          <Box
            sx={{
              display: 'flex',
              gap: 0.85,
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            <IconButton
              onClick={handleMobileMenuOpen}
              sx={{
                display: { xs: 'inline-flex', md: 'none' },
                color: isDarkMode ? '#E2E8F0' : '#0F172A',
                bgcolor: isDarkMode ? 'rgba(30, 41, 59, 0.65)' : 'rgba(248, 250, 252, 0.96)',
                border: isDarkMode ? '1px solid rgba(100, 116, 139, 0.45)' : '1px solid rgba(148, 163, 184, 0.35)',
                '&:hover': {
                  bgcolor: isDarkMode ? 'rgba(51, 65, 85, 0.78)' : 'rgba(241, 245, 249, 1)',
                },
              }}
            >
              <MenuIcon />
            </IconButton>
            {showPremiumThemeToggle ? (
              <IconButton
                onClick={() => setThemeMode(isDarkMode ? 'light' : 'dark')}
                sx={{
                  bgcolor: isDarkMode ? 'rgba(250, 204, 21, 0.2)' : 'rgba(15, 23, 42, 0.08)',
                  color: isDarkMode ? '#FACC15' : '#0F172A',
                  border: `1px solid ${isDarkMode ? 'rgba(250, 204, 21, 0.35)' : 'rgba(15,23,42,0.16)'}`,
                  '&:hover': {
                    bgcolor: isDarkMode ? 'rgba(250, 204, 21, 0.28)' : 'rgba(15, 23, 42, 0.14)',
                  },
                }}
                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
              </IconButton>
            ) : null}
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
              <Divider />
              <MenuItem disabled sx={{ opacity: 1, fontSize: '0.74rem', fontWeight: 800, color: '#64748B', letterSpacing: 0.8 }}>
                Posted Companies
              </MenuItem>
              {featuredCompanies.map((item) => (
                <MenuItem key={item.label} onClick={() => goToFeature(item.to)}>
                  {item.label}
                </MenuItem>
              ))}
              <Divider />
              <MenuItem disabled sx={{ opacity: 1, fontSize: '0.74rem', fontWeight: 800, color: '#64748B', letterSpacing: 0.8 }}>
                Collections & Tools
              </MenuItem>
              {jobCollections.map((item) => (
                <MenuItem key={item.label} onClick={() => goToFeature(item.to)}>
                  {item.label}
                </MenuItem>
              ))}
              {featureTools.map((item) => (
                <MenuItem key={item.label} onClick={() => goToFeature(item.to)}>
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
                display: { xs: 'none', md: 'flex' },
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
                    display: { xs: 'none', md: 'flex' },
                    borderColor: 'rgba(37, 99, 235, 0.32)',
                    color: '#1d4ed8',
                    px: 1.5,
                    py: 0.72,
                    minWidth: 132,
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: 999,
                    bgcolor: 'rgba(37, 99, 235, 0.05)',
                    '&:hover': {
                      borderColor: '#2563EB',
                      background: 'rgba(59, 130, 246, 0.14)',
                    },
                  }}
                >
                  Hire Talent
                </Button>
              </MotionBox>
            )}

            {!user ? (
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                <Button
                  component={RouterLink}
                  to={ROUTES.LOGIN}
                  variant="text"
                  sx={{
                    color: 'text.primary',
                    textTransform: 'none',
                    px: 1.6,
                    py: 0.74,
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    borderRadius: 999,
                    border: '1px solid rgba(148, 163, 184, 0.28)',
                    bgcolor: isDarkMode ? 'rgba(30, 41, 59, 0.58)' : 'rgba(248, 250, 252, 0.92)',
                    '&:hover': {
                      bgcolor: isDarkMode ? 'rgba(51, 65, 85, 0.74)' : 'rgba(241, 245, 249, 1)',
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
                      px: 2,
                      py: 0.82,
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      borderRadius: '999px',
                      background: 'linear-gradient(90deg, #0284c7, #2563eb)',
                      color: '#ffffff',
                      boxShadow: '0 10px 20px rgba(37, 99, 235, 0.24)',
                      '&:hover': {
                        background: 'linear-gradient(90deg, #0369a1, #1d4ed8)',
                        color: '#ffffff',
                      },
                    }}
                  >
                    Register
                  </Button>
                </MotionBox>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <button
                  className="navbar-premium-btn"
                  onClick={() => navigate(user?.role === USER_ROLES.RECRUITER ? ROUTES.RECRUITER_SUBSCRIPTION : ROUTES.PRICING)}
                  type="button"
                >
                  <svg viewBox="0 0 576 512" height="1em" className="navbar-premium-logoIcon" aria-hidden="true">
                    <path d="M309 106c11.4-7 19-19.7 19-34c0-22.1-17.9-40-40-40s-40 17.9-40 40c0 14.4 7.6 27 19 34L209.7 220.6c-9.1 18.2-32.7 23.4-48.6 10.7L72 160c5-6.7 8-15 8-24c0-22.1-17.9-40-40-40S0 113.9 0 136s17.9 40 40 40c.2 0 .5 0 .7 0L86.4 427.4c5.5 30.4 32 52.6 63 52.6H426.6c30.9 0 57.4-22.1 63-52.6L535.3 176c.2 0 .5 0 .7 0c22.1 0 40-17.9 40-40s-17.9-40-40-40s-40 17.9-40 40c0 9 3 17.3 8 24l-89.1 71.3c-15.9 12.7-39.5 7.5-48.6-10.7L309 106z" />
                  </svg>
                  GO PREMIUM
                </button>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      display: { xs: 'none', md: 'block' },
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
                      width: 38,
                      height: 38,
                      background: '#1D4ED8',
                      border: '2px solid #DBEAFE',
                      color: '#FFFFFF',
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
                    to={isRecruiter ? ROUTES.RECRUITER_DASHBOARD : ROUTES.DASHBOARD_SETTINGS}
                    onClick={handleMenuClose}
                  >
                    <SettingsIcon sx={{ mr: 1.5, fontSize: 20 }} /> Settings
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleMenuClose();
                      setSupportOpen(true);
                    }}
                  >
                    <HeadsetMicIcon sx={{ mr: 1.5, fontSize: 20 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      Customer Care
                      {ticketNotifCount > 0 ? (
                        <Box component="span" sx={{ bgcolor: 'error.main', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{ticketNotifCount}</Box>
                      ) : null}
                    </Box>
                  </MenuItem>
                  <Divider sx={{ borderColor: 'divider' }} />
                  <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                    <ExitToAppIcon sx={{ mr: 1.5, fontSize: 20 }} /> Logout
                  </MenuItem>
                </Menu>

                <SupportWidget
                  audience={isRecruiter ? 'recruiter' : 'candidate'}
                  showFab={false}
                  open={supportOpen}
                  onClose={() => setSupportOpen(false)}
                />
              </Box>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};
