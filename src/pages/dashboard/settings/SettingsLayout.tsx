import React from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Grid,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Link as RouterLink, useLocation, Outlet } from 'react-router-dom';
import {
  AccountCircle as AccountIcon,
  Lock as LockIcon,
  Work as WorkIcon,
  Block as BlockIcon,
  AutoAwesome as AutoAwesomeIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { Layout } from '@components/layout/Layout';
import { ROUTES } from '@constants/index';

const sections = [
  {
    label: 'Account',
    path: ROUTES.DASHBOARD_SETTINGS_ACCOUNT,
    icon: <AccountIcon sx={{ fontSize: 40 }} />,
    description: 'Manage your profile, contact details and password.',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
  },
  {
    label: 'Communication & Privacy',
    path: ROUTES.DASHBOARD_SETTINGS_PRIVACY,
    icon: <LockIcon sx={{ fontSize: 40 }} />,
    description: 'Control alerts, visibility, and data sharing.',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
  },
  {
    label: 'Job Preferences',
    path: ROUTES.DASHBOARD_SETTINGS_PREFERENCES,
    icon: <WorkIcon sx={{ fontSize: 40 }} />,
    description: 'Set preferred roles, locations and work modes.',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.1)',
  },
  {
    label: 'Blocked Companies',
    path: ROUTES.DASHBOARD_SETTINGS_BLOCKED,
    icon: <BlockIcon sx={{ fontSize: 40 }} />,
    description: 'Review companies you do not want job suggestions from.',
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
  },
  {
    label: 'Premium Intelligence',
    path: ROUTES.DASHBOARD_SETTINGS_PREMIUM,
    icon: <AutoAwesomeIcon sx={{ fontSize: 40 }} />,
    description: 'Tune demand score formula and weekly sprint targets.',
    color: '#7C3AED',
    bgColor: 'rgba(124, 58, 237, 0.1)',
  },
];

export const SettingsLayout: React.FC = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSettingsPage = sections.some((s) => location.pathname === s.path);

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4, pb: 6 }}>
        {/* Header */}
        <Box
          sx={{
            mb: 6,
            background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(245,158,11,0.05) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.1)',
            borderRadius: 3,
            p: 4,
          }}
        >
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
            Settings
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600 }}>
            Manage your account, privacy, job preferences, and blocked companies all in one place.
          </Typography>
        </Box>

        {/* Settings Cards Grid */}
        {!isSettingsPage || isMobile ? (
          <Box sx={{ mb: 6 }}>
            <Grid container spacing={3}>
              {sections.map((section) => {
                const selected = location.pathname === section.path;
                return (
                  <Grid item xs={12} sm={6} md={3} key={section.path}>
                    <Card
                      component={RouterLink}
                      to={section.path}
                      sx={{
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        border: selected ? `2px solid ${section.color}` : '1px solid',
                        borderColor: selected ? section.color : 'divider',
                        transform: selected ? 'translateY(-4px)' : 'translateY(0)',
                        boxShadow: selected ? `0 12px 32px ${section.color}20` : '0 2px 8px rgba(0,0,0,0.08)',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: `0 20px 48px ${section.color}30`,
                        },
                        textDecoration: 'none',
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 4 }}>
                        {/* Icon Background */}
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 80,
                            height: 80,
                            borderRadius: '16px',
                            background: section.bgColor,
                            mb: 2,
                            color: section.color,
                            transition: 'transform 0.3s ease',
                            transform: selected ? 'scale(1.1)' : 'scale(1)',
                          }}
                        >
                          {section.icon}
                        </Box>

                        {/* Title */}
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            mb: 1,
                            color: selected ? section.color : 'text.primary',
                          }}
                        >
                          {section.label}
                        </Typography>

                        {/* Description */}
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.secondary',
                            mb: 2,
                            minHeight: 40,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {section.description}
                        </Typography>

                        {/* Arrow Icon */}
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.5,
                            color: section.color,
                            fontSize: 14,
                            fontWeight: 600,
                          }}
                        >
                          View Settings
                          <ArrowForwardIcon sx={{ fontSize: 16 }} />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        ) : null}

        {/* Settings Content Card */}
        {isSettingsPage && !isMobile && (
          <Card
            sx={{
              minHeight: 600,
              boxShadow: '0 12px 32px rgba(15,23,42,0.1)',
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Outlet />
            </CardContent>
          </Card>
        )}

        {/* Mobile View - Show content below grid */}
        {isMobile && isSettingsPage && (
          <Card
            sx={{
              mt: 6,
              minHeight: 600,
              boxShadow: '0 12px 32px rgba(15,23,42,0.1)',
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Outlet />
            </CardContent>
          </Card>
        )}
      </Container>
    </Layout>
  );
};
