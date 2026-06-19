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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search as SearchIcon,
  LocationOn as LocationOnIcon,
  WorkOutline as WorkIcon,
  School as SchoolIcon,
  Code as CodeIcon,
  Storage as StorageIcon,
  Brush as BrushIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  DataObject as DataIcon,
} from '@mui/icons-material';
import { Layout } from '@components/layout/Layout';
import { ROUTES, JOB_CATEGORIES, EDUCATION_OPTIONS, FRESHNESS_OPTIONS } from '@constants/index';

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
  'rgba(124, 58, 237, 0.15)',
  'rgba(16, 185, 129, 0.15)',
  'rgba(245, 158, 11, 0.15)',
  'rgba(59, 130, 246, 0.15)',
  'rgba(236, 72, 153, 0.15)',
  'rgba(139, 92, 246, 0.15)',
];

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [experience, setExperience] = useState('');
  const [education, setEducation] = useState('');
  const [freshness, setFreshness] = useState('');

  const handleSearch = () => {
    const filters = new URLSearchParams();
    if (searchKeyword) filters.append('keyword', searchKeyword);
    if (searchLocation) filters.append('location', searchLocation);
    if (experience) filters.append('experience', experience);
    if (education) filters.append('education', education);
    if (freshness) filters.append('freshness', freshness);
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
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(15, 23, 42, 0.95) 50%, rgba(59, 130, 246, 0.08) 100%)',
          py: { xs: 8, md: 12 },
          mb: 6,
          position: 'relative',
          overflow: 'hidden',
        }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {[...Array(3)].map((_, i) => (
          <Box
            key={i}
            component={motion.div}
            animate={{
              y: [0, 20, 0],
              x: [0, 10, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 6 + i * 2, repeat: Infinity, ease: 'easeInOut' }}
            sx={{
              position: 'absolute',
              width: 200 + i * 100,
              height: 200 + i * 100,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(124, 58, 237, ${0.05 + i * 0.03}) 0%, transparent 70%)`,
              top: i === 0 ? '-10%' : i === 1 ? '60%' : '20%',
              right: i === 0 ? '-5%' : i === 1 ? '70%' : '10%',
              left: i === 2 ? '-10%' : 'auto',
            }}
          />
        ))}

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <MotionBox sx={{ textAlign: 'center', mb: 5 }} variants={itemVariants}>
            <MotionTypography
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', md: '4.5rem' },
                fontWeight: 800,
                mb: 2,
                background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 50%, #60A5FA 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
              }}
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 8, repeat: Infinity }}
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

          <MotionBox variants={itemVariants}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, md: 4 },
                background: 'rgba(30, 41, 59, 0.7)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(148, 163, 184, 0.15)',
                borderRadius: 4,
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
              }}
            >
              <Grid container spacing={2} alignItems="stretch">
                <Grid item xs={12} md={4}>
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
                <Grid item xs={12} md={4}>
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
                <Grid item xs={12} md={4}>
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
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Education</InputLabel>
                    <Select
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      label="Education"
                      startAdornment={
                        <InputAdornment position="start" sx={{ ml: 1 }}>
                          <SchoolIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                        </InputAdornment>
                      }
                    >
                      <MenuItem value="">All Education Levels</MenuItem>
                      {EDUCATION_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Freshness</InputLabel>
                    <Select
                      value={freshness}
                      onChange={(e) => setFreshness(e.target.value)}
                      label="Freshness"
                    >
                      <MenuItem value="">All Time</MenuItem>
                      {FRESHNESS_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <MotionButton
                    variant="contained"
                    size="large"
                    onClick={handleSearch}
                    fullWidth
                    whileHover={{ scale: 1.01, boxShadow: '0 20px 40px rgba(124, 58, 237, 0.4)' }}
                    whileTap={{ scale: 0.98 }}
                    sx={{ py: 1.75, fontSize: '1.1rem', fontWeight: 600, borderRadius: 2 }}
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
                      border: '1px solid rgba(148, 163, 184, 0.1)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: '0 12px 30px rgba(124, 58, 237, 0.2)',
                      },
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
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
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(15, 23, 42, 0.5) 100%)',
            borderRadius: 4,
            border: '1px solid rgba(124, 58, 237, 0.2)',
          }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
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
            Explore Jobs Now →
          </MotionButton>
        </MotionBox>
      </Container>
    </Layout>
  );
};
