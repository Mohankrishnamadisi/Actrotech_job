import React, { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Home as HomeIcon,
  Dashboard as DashboardIcon,
  Work as WorkIcon,
  People as PeopleIcon,
  AutoAwesome as AutoAwesomeIcon,
  Search as SearchIcon,
  AccountTree as AccountTreeIcon,
  BusinessCenter as BusinessCenterIcon,
  FolderSpecial as PoolIcon,
  LocalOffer as TagIcon,
  Settings as SettingsIcon,
  CreditScore as CreditScoreIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@store/index';
import { themeColors } from '@styles/recruiterTheme';

interface RecruiterSidebarProps {
  onTabChange?: (tabId: string) => void;
  currentTab?: string;
  companyName?: string;
  companyLogo?: string;
}

const MotionBox = motion(Box);

export const RecruiterSidebar: React.FC<RecruiterSidebarProps> = ({
  onTabChange,
  currentTab = 'overview',
  companyName = 'Your Company',
  companyLogo,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useAuthStore();

  const menuItems = [
    { id: 'home', label: 'Home', icon: HomeIcon, color: '#6366F1', external: true },
    { id: 'overview', label: 'Dashboard', icon: DashboardIcon, color: '#0066FF' },
    { id: 'jobs', label: 'Jobs', icon: WorkIcon, color: '#7C3AED' },
    { id: 'company-profile', label: 'Company Profile', icon: BusinessCenterIcon, color: '#0EA5E9' },
    { id: 'applicants', label: 'Applicants', icon: PeopleIcon, color: '#10B981' },
    { id: 'recommended', label: 'Recommended', icon: AutoAwesomeIcon, color: '#F59E0B' },
    { id: 'find-candidates', label: 'Find Candidates', icon: SearchIcon, color: '#14B8A6' },
    { id: 'talent-pool', label: 'Talent Pool', icon: PoolIcon, color: '#06B6D4' },
    { id: 'tags', label: 'Tags', icon: TagIcon, color: '#EC4899' },
    { id: 'ats-pipeline', label: 'ATS Pipeline', icon: AccountTreeIcon, color: '#F97316' },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, color: '#4F46E5' },
    { id: 'credits', label: 'Credits', icon: CreditScoreIcon, color: '#8B5CF6' },
  ];

  const handleMenuClick = (itemId: string) => {
    if (itemId === 'home') {
      navigate('/');
      return;
    }
    onTabChange?.(itemId);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const sidebarContent = (
    <MotionBox
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#FFFFFF',
        borderRight: `1px solid ${themeColors.border}`,
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2.5, borderBottom: `1px solid ${themeColors.border}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          {companyLogo ? (
            <Avatar src={companyLogo} sx={{ width: 40, height: 40 }} />
          ) : (
            <Avatar
              sx={{
                width: 40,
                height: 40,
                background: 'linear-gradient(135deg, #0066FF 0%, #7C3AED 100%)',
                fontWeight: 700,
              }}
            >
              {companyName.charAt(0).toUpperCase()}
            </Avatar>
          )}
          <Typography
            variant="h6"
            sx={{
              fontSize: '0.95rem',
              fontWeight: 700,
              color: themeColors.text.primary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {companyName}
          </Typography>
        </Box>
        <Typography
          variant="caption"
          sx={{ color: themeColors.text.tertiary, fontSize: '0.7rem', textTransform: 'uppercase' }}
        >
          Recruiter Dashboard
        </Typography>
      </Box>

      {/* Navigation Items */}
      <List sx={{ flex: 1, py: 1 }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id && !item.external;
          return (
            <motion.div
              key={item.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleMenuClick(item.id)}
                  sx={{
                    mx: 1.5,
                    borderRadius: '8px',
                    backgroundColor: isActive ? item.color + '12' : 'transparent',
                    color: isActive ? item.color : themeColors.text.secondary,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: item.color + '12',
                      color: item.color,
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 36,
                      color: isActive ? item.color : themeColors.text.secondary,
                    }}
                  >
                    <Icon sx={{ fontSize: '1.25rem' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            </motion.div>
          );
        })}
      </List>

      <Divider sx={{ borderColor: themeColors.border }} />

      {/* Bottom Actions */}
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleMenuClick('settings')}
            sx={{
              borderRadius: '8px',
              color: themeColors.text.secondary,
              '&:hover': {
                backgroundColor: themeColors.hover,
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <SettingsIcon sx={{ fontSize: '1.25rem' }} />
            </ListItemIcon>
            <ListItemText
              primary="Settings"
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: '8px',
              color: themeColors.text.secondary,
              '&:hover': {
                backgroundColor: '#FEE2E2',
                color: themeColors.danger,
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <LogoutIcon sx={{ fontSize: '1.25rem' }} />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            />
          </ListItemButton>
        </ListItem>
      </Box>
    </MotionBox>
  );

  if (isMobile) {
    return (
      <>
        <Box sx={{ display: 'flex', alignItems: 'center', p: 1, mb: 2 }}>
          <IconButton onClick={() => setMobileOpen(true)} edge="start">
            <MenuIcon />
          </IconButton>
        </Box>
        <Drawer
          anchor="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: 280,
              boxSizing: 'border-box',
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              borderBottom: `1px solid ${themeColors.border}`,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Menu
            </Typography>
            <IconButton onClick={() => setMobileOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          {sidebarContent}
        </Drawer>
      </>
    );
  }

  return (
    <Box sx={{ width: 280, height: '100vh', position: 'sticky', top: 0 }}>
      {sidebarContent}
    </Box>
  );
};
