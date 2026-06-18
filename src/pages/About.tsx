import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { Layout } from '@components/layout/Layout';

export const About: React.FC = () => {
  return (
    <Layout>
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="h2" sx={{ fontWeight: 700, mb: 4 }}>
          About Actotech Jobs
        </Typography>

        <Box sx={{ color: 'text.secondary', lineHeight: 1.8, '& p': { mb: 3 } }}>
          <Typography variant="body1" component="p">
            Actotech Jobs is a modern job portal platform designed to connect talented professionals with leading companies across India. We believe in making job search simple, transparent, and accessible to everyone.
          </Typography>

          <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary', mt: 4, mb: 2 }}>
            Our Mission
          </Typography>
          <Typography variant="body1" component="p">
            To empower job seekers with the right opportunities and help recruiters find the perfect talent. We strive to create a platform where careers are made and businesses thrive.
          </Typography>

          <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary', mt: 4, mb: 2 }}>
            Why Choose Us?
          </Typography>
          <Typography variant="body1" component="p">
            <strong>Wide Range of Opportunities:</strong> From startups to Fortune 500 companies, find jobs across all industries and experience levels.
          </Typography>
          <Typography variant="body1" component="p">
            <strong>Advanced Filtering:</strong> Filter jobs by location, experience, salary, and more to find what suits you best.
          </Typography>
          <Typography variant="body1" component="p">
            <strong>Premium Features:</strong> Upgrade to access exclusive remote jobs, get personalized recommendations, and more.
          </Typography>
          <Typography variant="body1" component="p">
            <strong>Secure & Reliable:</strong> Your data is protected and secured with the latest encryption technologies.
          </Typography>
        </Box>
      </Container>
    </Layout>
  );
};
