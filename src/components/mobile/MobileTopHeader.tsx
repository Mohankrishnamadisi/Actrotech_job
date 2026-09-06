import React from 'react';
import { AppBar, Badge, Box, IconButton, Toolbar } from '@mui/material';
import { Notifications as BellIcon, Search as SearchIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@store/index';
import { ROUTES } from '@constants/index';
import { Logo } from '@components/common/Logo';

export const MobileTopHeader: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        top: 0,
        zIndex: 20,
        background: 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
      }}
    >
      <Toolbar
        sx={{
          minHeight: 64,
          px: 1.5,
          py: 0.5,
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', minWidth: 0 }}>
          <Logo size="small" showText />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton
            aria-label="Search jobs"
            size="large"
            onClick={() => navigate(ROUTES.JOBS)}
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <SearchIcon fontSize="small" />
          </IconButton>

          {user && (
            <IconButton
              aria-label="Open notifications"
              size="large"
              onClick={() => navigate(ROUTES.DASHBOARD_NOTIFICATIONS)}
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                position: 'relative',
              }}
            >
              <Badge
                color="error"
                variant="dot"
                overlap="circular"
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <BellIcon fontSize="small" />
              </Badge>
            </IconButton>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};
