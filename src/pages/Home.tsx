import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Chip,
  Rating,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Search as SearchIcon, LocationOn as LocationOnIcon, TrendingUp as TrendingUpIcon } from '@mui/icons-material';
import { Layout } from '@components/layout/Layout';
import { JobCard } from '@components/jobs/JobCard';
import { Loading } from '@components/common/Loading';
import { jobService } from '@services/api';
import { JOB_CATEGORIES, ROUTES, SUBSCRIPTION_PLANS } from '@constants/index';
import type { Job } from '@types/index';

export const Home: React.FC = () => {
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [latestJobs, setLatestJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const [featured, latest] = await Promise.all([
          jobService.getFeaturedJobs(6),
          jobService.getLatestJobs(12),
        ]);
        setFeaturedJobs(featured);
        setLatestJobs(latest);
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const handleSearch = () => {
    // Navigate to jobs page with filters
    const filters = new URLSearchParams();
    if (searchKeyword) filters.append('keyword', searchKeyword);
    if (searchLocation) filters.append('location', searchLocation);
    window.location.href = `${ROUTES.JOBS}?${filters.toString()}`;
  };

  if (loading) return <Loading />;

  return (
    <Layout>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(15, 23, 42, 0.5) 100%)',
          py: { xs: 4, md: 8 },
          mb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2rem', md: '3.5rem' },
                fontWeight: 700,
                mb: 2,
                background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Find Your Dream Job
            </Typography>
            <Typography variant="h5" sx={{ color: 'text.secondary', mb: 4 }}>
              Search and apply for top jobs across India's leading companies
            </Typography>
          </Box>

          {/* Search Box */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                placeholder="Job title, keyword..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'primary.main' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                placeholder="City or location..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnIcon sx={{ color: 'primary.main' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>

          <Button
            variant="contained"
            size="large"
            onClick={handleSearch}
            fullWidth
            sx={{ py: 1.5, fontSize: '1rem' }}
          >
            Search Jobs
          </Button>

          {/* Browse by Category */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Popular categories:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {JOB_CATEGORIES.slice(0, 6).map((category) => (
                <Chip
                  key={category}
                  label={category}
                  variant="outlined"
                  clickable
                  onClick={() => {
                    setSearchKeyword(category);
                  }}
                />
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Featured Jobs Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              Featured Jobs
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Handpicked opportunities from top companies
            </Typography>
          </Box>
          <Button component={RouterLink} to={ROUTES.JOBS} variant="text">
            View All →
          </Button>
        </Box>

        <Grid container spacing={3}>
          {featuredJobs.map((job) => (
            <Grid item xs={12} sm={6} md={4} key={job.id}>
              <JobCard job={job} />
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Latest Jobs Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 4 }}>
          Latest Jobs
        </Typography>

        <Grid container spacing={3}>
          {latestJobs.map((job) => (
            <Grid item xs={12} sm={6} md={4} key={job.id}>
              <JobCard job={job} />
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Pricing Plans Section */}
      <Box sx={{ py: 8, background: 'rgba(124, 58, 237, 0.05)', mb: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
              Choose Your Plan
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Unlock premium features and access exclusive job listings
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {SUBSCRIPTION_PLANS.map((plan) => (
              <Grid item xs={12} sm={6} md={4} key={plan.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    border: plan.recommended ? '2px solid' : '1px solid',
                    borderColor: plan.recommended ? 'primary.main' : 'rgba(148, 163, 184, 0.1)',
                    transform: plan.recommended ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  {plan.recommended && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                        px: 2,
                        py: 0.5,
                        borderRadius: '20px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Most Popular
                      </Typography>
                    </Box>
                  )}

                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', pt: plan.recommended ? 3 : 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                      {plan.name}
                    </Typography>
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="h3"
                        sx={{
                          fontWeight: 700,
                          color: 'primary.main',
                          display: 'inline',
                        }}
                      >
                        ₹{plan.price}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        /{plan.period}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 3, flex: 1 }}>
                      {plan.features.map((feature) => (
                        <Typography key={feature} variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                          ✓ {feature}
                        </Typography>
                      ))}
                    </Box>

                    <Button variant={plan.recommended ? 'contained' : 'outlined'} fullWidth>
                      Get Started
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, textAlign: 'center', mb: 6 }}>
          What Users Say
        </Typography>

        <Grid container spacing={3}>
          {[
            {
              name: 'Rahul Kumar',
              role: 'Frontend Developer',
              comment: 'Got my dream job through Actotech Jobs! Great platform and excellent support.',
              rating: 5,
            },
            {
              name: 'Priya Sharma',
              role: 'UI/UX Designer',
              comment: 'Easy to navigate and found relevant job opportunities quickly.',
              rating: 5,
            },
            {
              name: 'Vikram Singh',
              role: 'Backend Developer',
              comment: 'The filter options make it easy to find jobs that match my requirements.',
              rating: 4,
            },
          ].map((testimonial, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardContent>
                  <Rating value={testimonial.rating} readOnly sx={{ mb: 2 }} />
                  <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                    "{testimonial.comment}"
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {testimonial.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {testimonial.role}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Layout>
  );
};
