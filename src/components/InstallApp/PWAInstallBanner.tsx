import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  GetApp as GetAppIcon,
  InstallMobile as InstallMobileIcon,
  Schedule as ScheduleIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';

interface PWAInstallBannerProps {
  appName: string;
  description: string;
  isUnsupported?: boolean;
  unsupportedTip?: string;
  onInstallNow: () => void;
  onRemindLater: () => void;
  onHide: () => void;
  onNeverShowAgain: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({
  appName,
  description,
  isUnsupported,
  unsupportedTip,
  onInstallNow,
  onRemindLater,
  onHide,
  onNeverShowAgain,
}) => {
  return (
    <Card
      role="region"
      aria-label="Install app banner"
      sx={{
        borderRadius: 3,
        border: '1px solid rgba(148,163,184,0.28)',
        background: 'linear-gradient(130deg, rgba(15,23,42,0.95) 0%, rgba(29,78,216,0.93) 52%, rgba(8,145,178,0.9) 100%)',
        color: '#F8FAFC',
        boxShadow: '0 16px 26px rgba(2,6,23,0.18)',
        animation: 'installBannerReveal 320ms ease-out',
        '@keyframes installBannerReveal': {
          '0%': { opacity: 0, transform: 'translateY(8px) scale(0.99)' },
          '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1.2}>
          <Stack direction="row" spacing={1.2} sx={{ minWidth: 0 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'rgba(248,250,252,0.2)',
                border: '1px solid rgba(248,250,252,0.28)',
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              <InstallMobileIcon />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                Install {appName}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(241,245,249,0.95)', mt: 0.25 }}>
                {description}
              </Typography>
              {isUnsupported ? (
                <Typography variant="caption" sx={{ display: 'block', color: '#FDE68A', mt: 0.6 }}>
                  {unsupportedTip || 'Your browser does not support app installation.'}
                </Typography>
              ) : null}
            </Box>
          </Stack>

          <IconButton
            size="small"
            onClick={onHide}
            aria-label="Hide install banner"
            sx={{ color: '#E2E8F0' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', rowGap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={onInstallNow}
            startIcon={<GetAppIcon />}
            aria-label="Install app now"
            sx={{
              fontWeight: 700,
              bgcolor: '#FFFFFF',
              color: '#0F172A',
              '&:hover': {
                bgcolor: '#E2E8F0',
              },
            }}
          >
            Install Now
          </Button>

          <Button
            variant="outlined"
            onClick={onRemindLater}
            startIcon={<ScheduleIcon />}
            aria-label="Remind me later"
            sx={{
              fontWeight: 700,
              borderColor: 'rgba(241,245,249,0.62)',
              color: '#F8FAFC',
              '&:hover': {
                borderColor: '#F8FAFC',
                bgcolor: 'rgba(241,245,249,0.12)',
              },
            }}
          >
            Remind Me Later
          </Button>

          <Button
            variant="text"
            onClick={onNeverShowAgain}
            startIcon={<VisibilityOffIcon />}
            aria-label="Never show install banner again"
            sx={{
              fontWeight: 700,
              color: '#E2E8F0',
              '&:hover': {
                bgcolor: 'rgba(241,245,249,0.1)',
              },
            }}
          >
            Never Show Again
          </Button>

          {isUnsupported ? (
            <Chip
              label="Unsupported Browser"
              size="small"
              sx={{
                bgcolor: 'rgba(251,191,36,0.22)',
                color: '#FEF3C7',
                fontWeight: 700,
              }}
            />
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default PWAInstallBanner;
