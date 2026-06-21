import React from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import {
  AccountCircle as AccountIcon,
  Lock as LockIcon,
  Work as WorkIcon,
  Block as BlockIcon,
} from '@mui/icons-material';
import { Layout } from '@components/layout/Layout';
import { ROUTES } from '@constants/index';

const sections = [
  {
    label: 'Account',
    path: ROUTES.DASHBOARD_SETTINGS_ACCOUNT,
    icon: <AccountIcon fontSize="small" />, 
    description: 'Manage your profile, contact details and password.',
  },
  {
    label: 'Communication & Privacy',
    path: ROUTES.DASHBOARD_SETTINGS_PRIVACY,
    icon: <LockIcon fontSize="small" />, 
    description: 'Control alerts, visibility, and data sharing.',
  },
  {
    label: 'Job Preferences',
    path: ROUTES.DASHBOARD_SETTINGS_PREFERENCES,
    icon: <WorkIcon fontSize="small" />, 
    description: 'Set preferred roles, locations and work modes.',
  },
  {
    label: 'Blocked Companies',
    path: ROUTES.DASHBOARD_SETTINGS_BLOCKED,
    icon: <BlockIcon fontSize="small" />, 
    description: 'Review companies you do not want job suggestions from.',
  },
];

export const SettingsLayout: React.FC = () => {
  const location = useLocation();

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Settings
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Choose an area to manage your account, privacy settings, job preferences, and blocked companies.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gap: 24,
            gridTemplateColumns: { xs: '1fr', md: '320px 1fr' },
            alignItems: 'start',
          }}
        >
          <Card variant="outlined" sx={{ position: { md: 'sticky' }, top: { md: 100 }, alignSelf: 'start' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                Settings menu
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List disablePadding>
                {sections.map((section) => {
                  const selected = location.pathname === section.path;
                  return (
                    <ListItemButton
                      key={section.path}
                      component={RouterLink}
                      to={section.path}
                      selected={selected}
                      sx={{ borderRadius: 2, mb: 1 }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: selected ? 'primary.main' : 'text.secondary' }}>
                        {section.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={section.label}
                        secondary={section.description}
                        primaryTypographyProps={{ fontWeight: 600 }}
                        secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            </CardContent>
          </Card>

          <Card sx={{ minHeight: 520 }}>
            <CardContent>
              <Outlet />
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Layout>
  );
};
