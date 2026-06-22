import React from 'react';
import { Box, Container, Grid, Typography, Link, Divider, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  GitHub as GitHubIcon,
  GetApp as InstallIcon,
} from '@mui/icons-material';
import { ROUTES, USER_ROLES } from '@constants/index';
import { useAuthStore } from '@store/index';
import usePWA from '@hooks/usePWA';
import InstallPromptDialog from '@components/InstallApp/InstallPromptDialog';

export const Footer: React.FC = () => {
  const { user } = useAuthStore();
  const { deferredPrompt, isInstalled, promptInstall } = usePWA();
  const [openDialog, setOpenDialog] = React.useState(false);
  const currentYear = new Date().getFullYear();

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setOpenDialog(true);
      return;
    }
    await promptInstall();
  };

  const recruiterLinks = [
    { label: 'Post a Job', to: ROUTES.RECRUITER_REGISTER },
    { label: 'Recruiter Dashboard', to: ROUTES.RECRUITER_DASHBOARD },
    { label: 'Pricing', to: ROUTES.PRICING },
    { label: 'Register', to: ROUTES.SIGNUP },
  ];

  const footerSections = [
    {
      title: 'Quick Links',
      items: [
        { label: 'Jobs', to: ROUTES.JOBS },
        { label: 'Pricing', to: ROUTES.PRICING },
        { label: 'Privacy Policy', to: ROUTES.PRIVACY_POLICY },
        { label: 'Terms & Conditions', to: ROUTES.TERMS_CONDITIONS },
      ],
    },
    ...(user?.role !== USER_ROLES.JOB_SEEKER
      ? [
          {
            title: 'For Recruiters',
            items: [
              { label: 'Post a Job', to: ROUTES.RECRUITER_REGISTER },
              { label: 'Recruiter Dashboard', to: ROUTES.RECRUITER_DASHBOARD },
              { label: 'Pricing', to: ROUTES.PRICING },
              { label: 'Register', to: ROUTES.SIGNUP },
            ],
          },
        ]
      : []),
    {
      title: 'Legal',
      items: [
        { label: 'Privacy Policy', to: ROUTES.PRIVACY_POLICY },
        { label: 'Terms & Conditions', to: ROUTES.TERMS_CONDITIONS },
        { label: 'Cookie Policy', to: '#' },
      ],
    },
  ];

  return (
    <Box
      component="footer"
      sx={{
        background: '#FFFFFF',
        borderTop: '1px solid',
        borderColor: 'divider',
        py: 6,
        mt: 10,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
              Actro Jobs
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Find your dream job or hire top talent. A modern platform for job seekers and
              recruiters.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {[FacebookIcon, TwitterIcon, LinkedInIcon, GitHubIcon].map((Icon, index) => (
                <Link
                  key={index}
                  href="#"
                  sx={{
                    color: 'text.secondary',
                    display: 'inline-flex',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  <Icon fontSize="small" />
                </Link>
              ))}
            </Box>
          </Grid>

          {footerSections.map((section) => (
            <Grid item xs={12} sm={6} md={3} key={section.title}>
              <Typography variant="h6" sx={{ fontWeight: 650, mb: 2 }}>
                {section.title}
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                {section.items.map((item) => (
                  <Typography key={item.label} component="li" variant="body2" sx={{ mb: 1 }}>
                    <Link
                      component={RouterLink}
                      to={item.to}
                      sx={{
                        color: 'text.secondary',
                        textDecoration: 'none',
                        transition: 'color 0.2s',
                        '&:hover': {
                          color: 'primary.main',
                        },
                      }}
                    >
                      {item.label}
                    </Link>
                  </Typography>
                ))}
              </Box>
            </Grid>
          ))}

          {user?.role === 'recruiter' && (
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="h6" sx={{ fontWeight: 650, mb: 2 }}>
                Recruiter Links
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                {recruiterLinks.map((item) => (
                  <Typography key={item.label} component="li" variant="body2" sx={{ mb: 1 }}>
                    <Link
                      component={RouterLink}
                      to={item.to}
                      sx={{
                        color: 'text.secondary',
                        textDecoration: 'none',
                        transition: 'color 0.2s',
                        '&:hover': {
                          color: 'primary.main',
                        },
                      }}
                    >
                      {item.label}
                    </Link>
                  </Typography>
                ))}
              </Box>
            </Grid>
          )}

          {/* Install App Section */}
          {!isInstalled && (
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="h6" sx={{ fontWeight: 650, mb: 2 }}>
                Mobile App
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontSize: '0.875rem' }}>
                Install our app on your mobile device for the best experience. Access jobs and manage your profile on the go.
              </Typography>
              <Button
                onClick={handleInstallClick}
                variant="contained"
                size="small"
                startIcon={<InstallIcon />}
                sx={{
                  borderRadius: 1,
                  textTransform: 'none',
                  backgroundColor: '#1D4ED8',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  py: 0.75,
                  '&:hover': {
                    backgroundColor: '#1e40af',
                  },
                }}
              >
                Install App
              </Button>
            </Grid>
          )}
        </Grid>

        <Divider sx={{ borderColor: 'divider', my: 3 }} />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Copyright {currentYear} Actro Jobs. All rights reserved.
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Built for job seekers and recruiters
          </Typography>
        </Box>
      </Container>

      {/* Install Dialog */}
      {!isInstalled && (
        <InstallPromptDialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          onInstall={handleInstallClick}
          fallbackMessage={!deferredPrompt ? 'If installation does not appear, use your browser menu → Add to Home screen.' : undefined}
        />
      )}
    </Box>
  );
};
