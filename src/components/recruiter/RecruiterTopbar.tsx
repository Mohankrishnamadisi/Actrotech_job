import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Chat as ChatIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Logout as LogoutIcon,
  CreditScore as CreditScoreIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { themeColors } from '@styles/recruiterTheme';
import { useAuthStore } from '@store/index';
import { authService } from '@services/supabase';
import { ROUTES } from '@constants/index';
import { supportService } from '@services/support';

interface RecruiterTopbarProps {
  notificationCount?: number;
  unreadMessagesCount?: number;
  credits?: number;
  planName?: string;
  onNotificationsClick?: () => void;
  onMessagesClick?: () => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onCustomerCareClick?: () => void;
}

const MotionBox = motion(Box);

export const RecruiterTopbar: React.FC<RecruiterTopbarProps> = ({
  notificationCount = 0,
  unreadMessagesCount = 0,
  credits = 0,
  planName = 'Free',
  onNotificationsClick,
  onMessagesClick,
  onProfileClick,
  onSettingsClick,
  onCustomerCareClick,
}) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [ticketNotifCount, setTicketNotifCount] = React.useState(0);

  React.useEffect(() => {
    if (!user?.id) return;
    supportService.getUnseenAdminResponseCount(user.id).then(setTicketNotifCount).catch(() => {});
  }, [user?.id]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignout = async () => {
    handleMenuClose();
    try {
      await authService.signOut();
    } catch {
      // noop
    } finally {
      logout();
      navigate(ROUTES.LOGIN, { replace: true });
    }
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: '#FFFFFF',
          borderBottom: `1px solid ${themeColors.border}`,
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 3,
            py: 1.5,
            minHeight: 'auto',
          }}
        >
          {/* Left Side - Search/Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: themeColors.text.primary,
                fontSize: '1.1rem',
              }}
            >
              Dashboard
            </Typography>
          </Box>

          {/* Right Side - Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Credits Badge */}
            {credits > 0 && !isMobile && (
              <MotionBox
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Chip
                  icon={<CreditScoreIcon sx={{ fontSize: '1rem !important' }} />}
                  label={`${credits} Credits`}
                  variant="outlined"
                  size="small"
                  sx={{
                    borderColor: themeColors.primary,
                    color: themeColors.primary,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    '& .MuiChip-icon': {
                      color: themeColors.primary + ' !important',
                    },
                  }}
                />
              </MotionBox>
            )}

            {/* Plan Badge */}
            {!isMobile && (
              <Chip
                label={planName}
                variant="filled"
                size="small"
                sx={{
                  background: 'linear-gradient(135deg, #0066FF 0%, #7C3AED 100%)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              />
            )}

            {/* Notifications */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <IconButton
                onClick={onNotificationsClick}
                sx={{
                  color: themeColors.text.secondary,
                  '&:hover': { color: themeColors.primary },
                }}
              >
                <Badge badgeContent={notificationCount} color="error">
                  <NotificationsIcon sx={{ fontSize: '1.25rem' }} />
                </Badge>
              </IconButton>
            </motion.div>

            {/* Messages */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <IconButton
                onClick={onMessagesClick}
                sx={{
                  color: themeColors.text.secondary,
                  '&:hover': { color: themeColors.primary },
                }}
              >
                <Badge badgeContent={unreadMessagesCount} color="error">
                  <ChatIcon sx={{ fontSize: '1.25rem' }} />
                </Badge>
              </IconButton>
            </motion.div>

            {/* Help */}
            {!isMobile && (
              <IconButton
                sx={{
                  color: themeColors.text.secondary,
                  '&:hover': { color: themeColors.primary },
                }}
              >
                <HelpIcon sx={{ fontSize: '1.25rem' }} />
              </IconButton>
            )}

            {/* Profile Menu */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <IconButton
                onClick={handleMenuOpen}
                sx={{
                  p: 0,
                  ml: 1,
                }}
              >
                <Avatar
                  src={user?.avatar}
                  sx={{
                    width: 36,
                    height: 36,
                    background: 'linear-gradient(135deg, #0066FF 0%, #7C3AED 100%)',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    border: `2px solid ${themeColors.border}`,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: themeColors.primary,
                    },
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
            </motion.div>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile Menu Dropdown */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            borderRadius: '12px',
            border: `1px solid ${themeColors.border}`,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          },
        }}
      >
        <MenuItem
          sx={{
            py: 1.5,
            px: 2,
            '&:hover': { backgroundColor: themeColors.hover },
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ fontSize: '0.75rem', color: themeColors.text.tertiary }}>
              Signed in as
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {user?.name || 'User'}
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            onSettingsClick?.();
          }}
          sx={{ '&:hover': { backgroundColor: themeColors.hover } }}
        >
          <SettingsIcon sx={{ mr: 1.5, fontSize: '1.1rem' }} />
          Settings
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            onCustomerCareClick?.();
          }}
          sx={{ '&:hover': { backgroundColor: themeColors.hover } }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HelpIcon sx={{ fontSize: '1.1rem' }} />
            Customer Care
            {ticketNotifCount > 0 ? (
              <Box component="span" sx={{ bgcolor: '#EF4444', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, ml: 0.5 }}>{ticketNotifCount}</Box>
            ) : null}
          </Box>
        </MenuItem>
        <MenuItem onClick={handleSignout} sx={{ color: 'error.main', '&:hover': { backgroundColor: themeColors.hover } }}>
          <LogoutIcon sx={{ mr: 1.5, fontSize: '1.1rem' }} />
          Sign out
        </MenuItem>
      </Menu>
    </>
  );
};
