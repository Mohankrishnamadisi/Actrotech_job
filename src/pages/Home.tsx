import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search as SearchIcon,
  LocationOn as LocationOnIcon,
  WorkOutline as WorkIcon,
  Code as CodeIcon,
  Storage as StorageIcon,
  Brush as BrushIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  DataObject as DataIcon,
} from '@mui/icons-material';
import { Layout } from '@components/layout/Layout';
import { ROUTES, JOB_CATEGORIES } from '@constants/index';

const MotionBox = motion(Box);
const MotionTypography = motion(Typography);
const MotionButton = motion(Button);
const MotionCard = motion(Card);

const categoryIcons: Record<string, React.ElementType> = {
  'Frontend Developer': CodeIcon,
  'React Developer': CodeIcon,
  'Vue Developer': CodeIcon,
  'Angular Developer': CodeIcon,
  'Full Stack Developer': StorageIcon,
  'Backend Developer': StorageIcon,
  'Python Developer': DataIcon,
  'Java Developer': DataIcon,
  'Testing': SettingsIcon,
  'DevOps': SettingsIcon,
  'Data Analyst': AnalyticsIcon,
  'UI/UX Designer': BrushIcon,
};

const categoryColors = [
  'linear-gradient(180deg, #EFF6FF 0%, #FFFFFF 100%)',
  'linear-gradient(180deg, #ECFDF5 0%, #FFFFFF 100%)',
  'linear-gradient(180deg, #FFFBEB 0%, #FFFFFF 100%)',
  'linear-gradient(180deg, #F0FDFA 0%, #FFFFFF 100%)',
  'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
  'linear-gradient(180deg, #EEF2FF 0%, #FFFFFF 100%)',
];

const categoryIconColors = [
  '#2563EB',
  '#0F766E',
  '#B7791F',
  '#0E7490',
  '#475569',
  '#4F46E5',
];

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [experience, setExperience] = useState('');

  const handleSearch = () => {
    const filters = new URLSearchParams();
    if (searchKeyword) filters.append('keyword', searchKeyword);
    if (searchLocation) filters.append('location', searchLocation);
    if (experience) filters.append('experience', experience);
    navigate(`${ROUTES.JOBS}?${filters.toString()}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const experienceOptions = Array.from({ length: 26 }, (_, i) => `${i} years`);

  return (
    <Layout>
      <MotionBox
        sx={{
          background: `
            linear-gradient(115deg, rgba(255, 255, 255, 0.96) 0%, rgba(240, 253, 250, 0.88) 42%, rgba(239, 246, 255, 0.96) 100%),
            repeating-linear-gradient(135deg, rgba(37, 99, 235, 0.07) 0 1px, transparent 1px 34px)
          `,
          borderBottom: '1px solid',
          borderColor: 'divider',
          py: { xs: 7, md: 11 },
          mb: 6,
          position: 'relative',
          overflow: 'hidden',
        }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <MotionBox sx={{ textAlign: 'center', mb: 5 }} variants={itemVariants}>
            <Chip
              label="India's Career Gateway"
              color="secondary"
              variant="outlined"
              sx={{
                mb: 2,
                px: 1,
                background: 'rgba(255, 255, 255, 0.72)',
                borderColor: 'rgba(14, 116, 144, 0.24)',
                color: 'secondary.dark',
              }}
            />
            <MotionTypography
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', md: '4.5rem' },
                fontWeight: 800,
                mb: 2,
                background: 'linear-gradient(90deg, #172033 0%, #2563EB 45%, #0F766E 100%)',
                backgroundSize: '220% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: 0,
                lineHeight: 1.1,
                cursor: 'default',
              }}
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              whileHover={{ letterSpacing: '0.35em', scale: 1.02 }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            >
              Find Your Dream Job
            </MotionTypography>
            <MotionTypography
              variant="h5"
              sx={{
                color: 'text.secondary',
                mb: 1,
                fontSize: { xs: '1rem', md: '1.35rem' },
                fontWeight: 400,
                maxWidth: 600,
                mx: 'auto',
              }}
              variants={itemVariants}
            >
              Search and apply for top jobs across India's leading companies.
            </MotionTypography>
          </MotionBox>

          <MotionBox variants={itemVariants} whileHover={{ y: -4 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, md: 4 },
                background: 'rgba(255, 255, 255, 0.88)',
                backdropFilter: 'blur(18px)',
                border: '1px solid',
                borderColor: 'rgba(255, 255, 255, 0.76)',
                borderRadius: 2,
                boxShadow: '0 24px 60px rgba(15, 23, 42, 0.12)',
                transition: 'box-shadow 0.25s ease, transform 0.25s ease',
                '&:hover': {
                  boxShadow: '0 30px 70px rgba(15, 23, 42, 0.16)',
                },
              }}
            >
              <Grid container spacing={2} alignItems="stretch">
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    placeholder="Job Title"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: 'primary.main' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { height: 56 } }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    placeholder="Location"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOnIcon sx={{ color: 'primary.main' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { height: 56 } }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Experience</InputLabel>
                    <Select
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      label="Experience"
                      sx={{ height: 56 }}
                    >
                      <MenuItem value="">All Experience</MenuItem>
                      {experienceOptions.map((option) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <MotionButton
                    variant="contained"
                    size="large"
                    onClick={handleSearch}
                    fullWidth
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    sx={{
                      height: 56,
                      py: 1.75,
                      fontSize: '1rem',
                      fontWeight: 700,
                      borderRadius: 2,
                    }}
                  >
                    <SearchIcon sx={{ mr: 1 }} /> Search Jobs
                  </MotionButton>
                </Grid>
              </Grid>
            </Paper>
          </MotionBox>
        </Container>
      </MotionBox>

      <Container maxWidth="lg" sx={{ pb: 8 }}>
        <MotionBox
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}
          >
            Browse by Category
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: 'text.secondary', mb: 4, textAlign: 'center' }}
          >
            Explore opportunities in your field of expertise
          </Typography>

          <Grid container spacing={2.5}>
            {JOB_CATEGORIES.map((category, index) => {
              const Icon = categoryIcons[category] || WorkIcon;
              return (
                <Grid item xs={6} sm={4} md={3} key={category}>
                  <MotionCard
                    whileHover={{ y: -6, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const filters = new URLSearchParams();
                      filters.append('keyword', category);
                      navigate(`${ROUTES.JOBS}?${filters.toString()}`);
                    }}
                    sx={{
                      cursor: 'pointer',
                      background: categoryColors[index % categoryColors.length],
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: '#AFC1DD',
                        boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
                      },
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          background: categoryIconColors[index % categoryIconColors.length],
                          boxShadow: '0 12px 22px rgba(15, 23, 42, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 1.5,
                        }}
                      >
                        <Icon sx={{ color: '#fff', fontSize: 24 }} />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                        {category}
                      </Typography>
                    </CardContent>
                  </MotionCard>
                </Grid>
              );
            })}
          </Grid>
        </MotionBox>

        <MotionBox
          sx={{
            textAlign: 'center',
            mt: 8,
            p: { xs: 4, md: 6 },
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F0FDFA 46%, #EFF6FF 100%)',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'rgba(203, 213, 225, 0.8)',
            boxShadow: '0 20px 42px rgba(15, 23, 42, 0.08)',
          }}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4 }}
          viewport={{ once: true }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            Ready to start your job search?
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
            Join thousands of job seekers who have found their dream jobs on Actotech Jobs
          </Typography>
          <MotionButton
            variant="contained"
            size="large"
            onClick={() => navigate(ROUTES.JOBS)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            sx={{ px: 5, py: 1.5 }}
          >
            Explore Jobs Now
          </MotionButton>
        </MotionBox>
      </Container>
    </Layout>
  );
};
