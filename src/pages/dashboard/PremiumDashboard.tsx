import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { Layout } from '@components/layout/Layout';
import { useSubscription } from '@hooks/index';
import { useAuthStore } from '@store/index';

export const PremiumDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { subscription } = useSubscription(user?.id || null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'professional' | 'modern'>('professional');
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('');

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>Premium Hub</Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Welcome back, {user?.name}. You are on the {subscription?.plan?.toUpperCase() || 'PREMIUM'} plan.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip label="Premium Member" color="secondary" sx={{ fontWeight: 700 }} />
            <FormControl size="small">
              <InputLabel>Theme</InputLabel>
              <Select
                value={theme}
                label="Theme"
                onChange={(e) => setTheme(e.target.value as any)}
                sx={{ width: 200 }}
              >
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
                <MenuItem value="professional">Professional</MenuItem>
                <MenuItem value="modern">Modern</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Advanced Job Search
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField fullWidth placeholder="Keyword, role, skills" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
                  <TextField sx={{ width: 240 }} placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
                  <TextField sx={{ width: 180 }} placeholder="Experience" value={experience} onChange={(e) => setExperience(e.target.value)} />
                  <Button variant="contained">Search</Button>
                </Box>

                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Use advanced filters including salary bands, remote/hybrid preferences, and priority matching.
                </Typography>
              </CardContent>
            </Card>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Priority Recommendations</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Personalized jobs curated based on your profile, activity and saved preferences.
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Button variant="contained">View Recommendations</Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Exclusive Tools</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                      <Button variant="outlined">Mock Interviews</Button>
                      <Button variant="outlined">Resume Review</Button>
                      <Button variant="outlined">Priority Apply</Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Premium Analytics</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  Dashboard widgets showing your applications, engagement rate and profile strength.
                </Typography>
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <Card sx={{ background: 'linear-gradient(135deg,#ECFDF5,#E0F2FE)' }}>
                    <CardContent>
                      <Typography variant="h4" sx={{ fontWeight: 800 }}>124</Typography>
                      <Typography variant="body2">Recommended Jobs</Typography>
                    </CardContent>
                  </Card>

                  <Card sx={{ background: 'linear-gradient(135deg,#FFF7ED,#FEE2E2)' }}>
                    <CardContent>
                      <Typography variant="h4" sx={{ fontWeight: 800 }}>37</Typography>
                      <Typography variant="body2">Priority Matches</Typography>
                    </CardContent>
                  </Card>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Profile Strength</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Complete your profile to increase match relevance and unlock more premium recommendations.
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Button variant="contained">Improve Profile</Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
};

export default PremiumDashboard;
