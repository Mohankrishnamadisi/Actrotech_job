import React from 'react';
import { Box, Container, Grid, Typography, Link, Divider, Button, IconButton, Paper } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  GitHub as GitHubIcon,
  GetApp as InstallIcon,
  ArrowForward as ArrowForwardIcon,
  TrendingUp as TrendingUpIcon,
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
        position: 'relative',
        overflow: 'hidden',
        background:
          'radial-gradient(circle at 14% 20%, rgba(56, 189, 248, 0.20), transparent 36%), radial-gradient(circle at 86% 12%, rgba(20, 184, 166, 0.20), transparent 40%), linear-gradient(180deg, #0B1220 0%, #111827 100%)',
        color: '#E2E8F0',
        borderTop: '1px solid rgba(148, 163, 184, 0.22)',
        py: { xs: 6, md: 8 },
        mt: 10,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(120deg, rgba(15, 23, 42, 0.1) 0%, rgba(15, 23, 42, 0.42) 40%, rgba(15, 23, 42, 0.64) 100%)',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg">
        <Paper
          sx={{
            mb: 3.5,
            p: { xs: 2, md: 2.6 },
            borderRadius: 3,
            border: '1px solid rgba(148, 163, 184, 0.26)',
            background: 'rgba(15, 23, 42, 0.42)',
            backdropFilter: 'blur(8px)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: '#F8FAFC',
                  mb: 0.8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontSize: { xs: '1.25rem', md: '1.45rem' },
                }}
              >
                <TrendingUpIcon sx={{ color: '#34D399' }} />
                Built For Faster Hiring And Better Careers
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(226, 232, 240, 0.9)' }}>
                Actro helps candidates and recruiters discover the right opportunities with modern tools, better matching, and seamless workflows.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                <Button
                  component={RouterLink}
                  to={ROUTES.JOBS}
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: 2.2,
                    px: 2,
                    py: 1,
                    background: 'linear-gradient(90deg, #0ea5e9, #2563eb)',
                    boxShadow: 'none',
                    '&:hover': {
                      background: 'linear-gradient(90deg, #0284c7, #1d4ed8)',
                      boxShadow: 'none',
                    },
                  }}
                >
                  Explore Jobs
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={4} sx={{ mb: 2, position: 'relative', zIndex: 1 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h6" sx={{ fontWeight: 750, mb: 1.5, color: '#FFFFFF' }}>
              Actro Jobs
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(226, 232, 240, 0.88)', mb: 2.2, maxWidth: 380, lineHeight: 1.75 }}>
              Discover premium hiring and job search experiences with modern analytics, growth tools, and design-forward workflows.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {[FacebookIcon, TwitterIcon, LinkedInIcon, GitHubIcon].map((Icon, index) => (
                <IconButton
                  key={index}
                  component="a"
                  href="#"
                  size="small"
                  sx={{
                    color: 'rgba(226, 232, 240, 0.8)',
                    bgcolor: 'rgba(30, 41, 59, 0.75)',
                    border: '1px solid rgba(148, 163, 184, 0.24)',
                    '&:hover': {
                      color: '#FFFFFF',
                      bgcolor: 'rgba(51, 65, 85, 0.95)',
                    },
                  }}
                >
                  <Icon fontSize="small" />
                </IconButton>
              ))}
            </Box>
          </Grid>

          {footerSections.map((section) => (
            <Grid item xs={12} sm={6} md={2.6} key={section.title}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.8, color: '#F8FAFC' }}>
                {section.title}
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                {section.items.map((item) => (
                  <Typography key={item.label} component="li" variant="body2" sx={{ mb: 1.1 }}>
                    <Link
                      component={RouterLink}
                      to={item.to}
                      sx={{
                        color: 'rgba(203, 213, 225, 0.92)',
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                        display: 'inline-flex',
                        alignItems: 'center',
                        '&:hover': {
                          color: '#7dd3fc',
                          transform: 'translateX(3px)',
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
            <Grid item xs={12} sm={6} md={2.8}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.8, color: '#F8FAFC' }}>
                Recruiter Links
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                {recruiterLinks.map((item) => (
                  <Typography key={item.label} component="li" variant="body2" sx={{ mb: 1.1 }}>
                    <Link
                      component={RouterLink}
                      to={item.to}
                      sx={{
                        color: 'rgba(203, 213, 225, 0.92)',
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                        display: 'inline-flex',
                        alignItems: 'center',
                        '&:hover': {
                          color: '#7dd3fc',
                          transform: 'translateX(3px)',
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
            <Grid item xs={12} sm={6} md={2.8}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.8, color: '#F8FAFC' }}>
                Mobile App
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(203, 213, 225, 0.92)', mb: 2, fontSize: '0.875rem', lineHeight: 1.7 }}>
                Install our app on your mobile device for the best experience. Access jobs and manage your profile on the go.
              </Typography>
              <Button
                onClick={handleInstallClick}
                variant="contained"
                size="small"
                startIcon={<InstallIcon />}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  background: 'linear-gradient(90deg, #0ea5e9, #2563eb)',
                  color: '#ffffff',
                  fontSize: '0.86rem',
                  py: 0.78,
                  px: 1.3,
                  boxShadow: 'none',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #0284c7, #1d4ed8)',
                    boxShadow: 'none',
                  },
                }}
              >
                Install App
              </Button>
            </Grid>
          )}
        </Grid>

        <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.28)', my: 3, position: 'relative', zIndex: 1 }} />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            pt: 1,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Typography variant="body2" sx={{ color: 'rgba(226, 232, 240, 0.84)' }}>
            © {currentYear} Actro Jobs. Designed for premium hiring experiences.
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(226, 232, 240, 0.72)' }}>
            Modern talent marketplace for candidates and recruiters.
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
