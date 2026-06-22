import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Typography,
  Pagination,
  InputAdornment,
  Paper,
  Autocomplete,
  Chip,
} from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@store/index';
import { useSubscription } from '@hooks/index';
import { Search as SearchIcon, Tune as TuneIcon } from '@mui/icons-material';
import { Layout } from '@components/layout/Layout';
import { JobCard } from '@components/jobs/JobCard';
import { JobListSkeleton } from '@components/common/LoadingSkeleton';
import { Error } from '@components/common/Error';
import { jobService } from '@services/api';
import { JOB_CATEGORIES, EMPLOYMENT_TYPES, WORK_MODES, EXPERIENCE_LEVELS, EDUCATION_OPTIONS, FRESHNESS_OPTIONS, INDIAN_CITIES } from '@constants/index';
import type { Job } from '../types';

const MotionPaper = motion(Paper);

export const Jobs: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { subscription } = useSubscription(user?.id || null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    location: searchParams.get('location') || '',
    experience: searchParams.get('experience') || '',
    education: searchParams.get('education') || '',
    freshness: searchParams.get('freshness') || '',
    jobType: [] as string[],
    workMode: [] as string[],
    category: [] as string[],
  });

  useEffect(() => {
    const getMultiValues = (key: string) => {
      const values = searchParams.getAll(key);
      if (values.length > 0) return values.filter(Boolean);
      const rawValue = searchParams.get(key);
      if (!rawValue) return [];
      return rawValue.split(',').map((value) => value.trim()).filter(Boolean);
    };

    setFilters({
      keyword: searchParams.get('keyword') || '',
      location: searchParams.get('location') || '',
      experience: searchParams.get('experience') || '',
      education: searchParams.get('education') || '',
      freshness: searchParams.get('freshness') || '',
      jobType: getMultiValues('jobType'),
      workMode: getMultiValues('workMode'),
      category: getMultiValues('category'),
    });
    setPage(1);
  }, [searchParams]);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = {};
      if (filters.keyword) params.keyword = filters.keyword;
      if (filters.location) params.location = filters.location;
      if (filters.experience) params.experience = filters.experience;
      if (filters.education) params.education = filters.education;
      if (filters.freshness) params.freshness = filters.freshness;
      if (filters.jobType.length > 0) params.jobType = filters.jobType;
      if (filters.workMode.length > 0) params.workMode = filters.workMode;
      if (filters.category.length > 0) params.category = filters.category;

      const { data, total: count } = await jobService.getJobs(params, page, 12);
      setJobs(data);
      setTotal(count);
    } catch (err) {
      let loadError = 'Failed to load jobs';
      if (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string') {
        loadError = (err as any).message;
      } else if (typeof err === 'string') {
        loadError = err;
      }
      setError(loadError);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      fetchJobs();
    }, 60000);

    return () => window.clearInterval(interval);
  }, [fetchJobs]);

  const handleFilterChange = (filterName: string, value: unknown) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
    setPage(1);

    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.delete(filterName);

      if (Array.isArray(value)) {
        value.forEach((item) => {
          const text = String(item).trim();
          if (text) {
            params.append(filterName, text);
          }
        });
      } else if (value !== null && value !== undefined && String(value).trim() !== '') {
        params.set(filterName, String(value).trim());
      }

      return params;
    });
  };

  const clearFilters = () => {
    setFilters({
      keyword: '',
      location: '',
      experience: '',
      education: '',
      freshness: '',
      jobType: [],
      workMode: [],
      category: [],
    });
    setSearchParams(new URLSearchParams());
    setPage(1);
  };

  if (error) {
    return (
      <Layout>
        <Error message={error} />
      </Layout>
    );
  }

  const itemsPerPage = 12;
  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              Find Jobs
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Browse {total} job openings
            </Typography>
          </Box>
          <Button
            startIcon={<TuneIcon />}
            variant="outlined"
            onClick={() => setShowFilters(!showFilters)}
            sx={{ display: { md: 'none' } }}
          >
            Filters
          </Button>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={3} sx={{ display: { xs: showFilters ? 'block' : 'none', md: 'block' } }}>
            <MotionPaper
              sx={{
                p: 3,
                position: { md: 'sticky' },
                top: { md: 80 },
                maxHeight: { md: 'calc(100vh - 110px)' },
                overflowY: { md: 'auto' },
                overflowX: 'hidden',
                alignSelf: 'flex-start',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(243,246,255,0.96))',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                boxShadow: '0 26px 68px rgba(15, 23, 42, 0.10)',
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Smart Filters
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Use keywords, city, experience and job type to narrow the best matches.
              </Typography>

              <TextField
                fullWidth
                placeholder="Job title, skill, or company"
                value={filters.keyword}
                onChange={(e) => handleFilterChange('keyword', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { height: 54, fontSize: '0.97rem' } }}
              />

              <Autocomplete
                freeSolo
                options={INDIAN_CITIES}
                inputValue={filters.location}
                onInputChange={(_, value) => handleFilterChange('location', value)}
                filterOptions={(options, state) =>
                  options.filter((option) =>
                    option.toLowerCase().includes(state.inputValue.toLowerCase())
                  )
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    placeholder="Location"
                    sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { height: 54, fontSize: '0.97rem' } }}
                  />
                )}
              />

              <FormControl fullWidth sx={{ mb: 2.5 }}>
                <InputLabel>Experience</InputLabel>
                <Select
                  value={filters.experience}
                  onChange={(e) => handleFilterChange('experience', e.target.value)}
                  label="Experience"
                >
                  <MenuItem value="">All Levels</MenuItem>
                  {EXPERIENCE_LEVELS.map((level) => (
                    <MenuItem key={level} value={level}>{level}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2.5 }}>
                <InputLabel>Education</InputLabel>
                <Select
                  value={filters.education}
                  onChange={(e) => handleFilterChange('education', e.target.value)}
                  label="Education"
                >
                  <MenuItem value="">All Levels</MenuItem>
                  {EDUCATION_OPTIONS.map((edu) => (
                    <MenuItem key={edu} value={edu}>{edu}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2.5 }}>
                <InputLabel>Freshness</InputLabel>
                <Select
                  value={filters.freshness}
                  onChange={(e) => handleFilterChange('freshness', e.target.value)}
                  label="Freshness"
                >
                  <MenuItem value="">All Time</MenuItem>
                  {FRESHNESS_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                  Job Type
                </Typography>
                <FormGroup sx={{ flexDirection: 'column' }}>
                  {EMPLOYMENT_TYPES.map((type) => (
                    <FormControlLabel
                      key={type}
                      control={
                        <Checkbox
                          checked={filters.jobType.includes(type)}
                          onChange={(e) => {
                            const nextValues = e.target.checked
                              ? [...filters.jobType, type]
                              : filters.jobType.filter((item) => item !== type);
                            handleFilterChange('jobType', nextValues);
                          }}
                        />
                      }
                      label={type}
                    />
                  ))}
                </FormGroup>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                  Work Mode
                </Typography>
                <FormGroup sx={{ flexDirection: 'column' }}>
                  {WORK_MODES.map((mode) => (
                    <FormControlLabel
                      key={mode}
                      control={
                        <Checkbox
                          checked={filters.workMode.includes(mode)}
                          onChange={(e) => {
                            const nextValues = e.target.checked
                              ? [...filters.workMode, mode]
                              : filters.workMode.filter((item) => item !== mode);
                            handleFilterChange('workMode', nextValues);
                          }}
                        />
                      }
                      label={mode}
                    />
                  ))}
                </FormGroup>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                  Category
                </Typography>
                <Box
                  sx={{
                    maxHeight: 220,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    width: '100%',
                  }}
                >
                  <FormGroup
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      width: '100%',
                      gap: 1,
                    }}
                  >
                    {JOB_CATEGORIES.map((category) => (
                      <FormControlLabel
                        key={category}
                        control={
                          <Checkbox
                            sx={{ p: 0.5, mr: 0.75 }}
                            checked={filters.category.includes(category)}
                            onChange={(e) => {
                              const nextValues = e.target.checked
                                ? [...filters.category, category]
                                : filters.category.filter((item) => item !== category);
                              handleFilterChange('category', nextValues);
                            }}
                          />
                        }
                        label={category}
                        sx={{
                          m: 0,
                          width: '100%',
                          alignItems: 'center',
                          '& .MuiFormControlLabel-label': {
                            flex: 1,
                            minWidth: 0,
                            whiteSpace: 'normal',
                            overflowWrap: 'anywhere',
                            lineHeight: 1.4,
                          },
                        }}
                      />
                    ))}
                  </FormGroup>
                </Box>
              </FormControl>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                {filters.keyword && <Chip label={filters.keyword} size="small" />}
                {filters.location && <Chip label={filters.location} size="small" />}
                {filters.experience && <Chip label={filters.experience} size="small" />}
                {filters.education && <Chip label={filters.education} size="small" />}
              </Box>

              <Button variant="outlined" fullWidth onClick={clearFilters}>
                Clear Filters
              </Button>
            </MotionPaper>
          </Grid>

          <Grid item xs={12} md={9}>
            <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {filters.keyword && <Chip label={`Keyword: ${filters.keyword}`} size="small" />}
              {filters.location && <Chip label={`Location: ${filters.location}`} size="small" />}
              {filters.experience && <Chip label={`Experience: ${filters.experience}`} size="small" />}
            </Box>
            {loading ? (
              <JobListSkeleton count={6} />
            ) : jobs.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2 }}>
                  No jobs found
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Try adjusting your filters or search criteria
                </Typography>
              </Box>
            ) : (
              <>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  {jobs.map((job, index) => (
                    <Grid item xs={12} sm={6} lg={4} key={job.id}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <JobCard job={job} isPremiumUser={!!subscription} />
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>

                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={(_, value) => setPage(value)}
                      color="primary"
                    />
                  </Box>
                )}
              </>
            )}
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
};
