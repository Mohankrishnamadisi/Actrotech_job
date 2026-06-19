import React from 'react';
import { Box, Container, Grid, Typography, Link, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Facebook as FacebookIcon, Twitter as TwitterIcon, LinkedIn as LinkedInIcon, GitHub as GitHubIcon } from '@mui/icons-material';
import { ROUTES } from '@constants/index';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

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
    {
      title: 'For Recruiters',
      items: [
        { label: 'Post a Job', to: ROUTES.RECRUITER_REGISTER },
        { label: 'Recruiter Dashboard', to: ROUTES.RECRUITER_DASHBOARD },
        { label: 'Pricing', to: ROUTES.PRICING },
        { label: 'Register', to: ROUTES.SIGNUP },
      ],
    },
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
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(148, 163, 184, 0.1)',
        py: 6,
        mt: 10,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 2,
                background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Actotech Jobs
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Find your dream job or hire top talent. A modern platform for job seekers and
              recruiters.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Link href="#" sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                <FacebookIcon fontSize="small" />
              </Link>
              <Link href="#" sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                <TwitterIcon fontSize="small" />
              </Link>
              <Link href="#" sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                <LinkedInIcon fontSize="small" />
              </Link>
              <Link href="#" sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                <GitHubIcon fontSize="small" />
              </Link>
            </Box>
          </Grid>

          {footerSections.map((section) => (
            <Grid item xs={12} sm={6} md={3} key={section.title}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                {section.title}
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                {section.items.map((item) => (
                  <Typography
                    key={item.label}
                    component="li"
                    variant="body2"
                    sx={{ mb: 1 }}
                  >
                    <Link
                      component={RouterLink}
                      to={item.to}
                      sx={{
                        color: 'text.secondary',
                        textDecoration: 'none',
                        transition: 'color 0.3s',
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
        </Grid>

        <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.1)', my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            © {currentYear} Actotech Jobs. All rights reserved.
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Made with ❤️ for job seekers and recruiters
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};
