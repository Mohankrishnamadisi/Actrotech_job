import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search as SearchIcon, Tune as TuneIcon } from '@mui/icons-material';
import { Layout } from '@components/layout/Layout';
import { JobCard } from '@components/jobs/JobCard';
import { JobListSkeleton } from '@components/common/LoadingSkeleton';
import { Error } from '@components/common/Error';
import { jobService } from '@services/api';
import { JOB_CATEGORIES, JOB_TYPES, EXPERIENCE_LEVELS, EDUCATION_OPTIONS, FRESHNESS_OPTIONS } from '@constants/index';
import type { Job } from '@types/index';

const MotionPaper = motion(Paper);

export const Jobs: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
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
    category: [] as string[],
  });

  useEffect(() => {
    setFilters({
      keyword: searchParams.get('keyword') || '',
      location: searchParams.get('location') || '',
      experience: searchParams.get('experience') || '',
      education: searchParams.get('education') || '',
      freshness: searchParams.get('freshness') || '',
      jobType: [],
      category: [],
    });
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, unknown> = {};
        if (filters.keyword) params.title = filters.keyword;
        if (filters.location) params.location = filters.location;
        if (filters.experience) params.experience = filters.experience;
        if (filters.education) params.education = filters.education;
        if (filters.freshness) params.freshness = filters.freshness;
        if (filters.jobType.length > 0) params.jobType = filters.jobType[0];
        if (filters.category.length > 0) params.category = filters.category[0];

        const { data, total: count } = await jobService.getJobs(params, page, 12);
        setJobs(data);
        setTotal(count);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [page, filters]);

  const handleFilterChange = (filterName: string, value: unknown) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
    setPage(1);

    const params = new URLSearchParams(searchParams);
    if (value && String(value).trim()) {
      params.set(filterName, String(value));
    } else {
      params.delete(filterName);
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({
      keyword: '',
      location: '',
      experience: '',
      education: '',
      freshness: '',
      jobType: [],
      category: [],
    });
    setSearchParams({});
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
                top: 80,
                background: '#FFFFFF',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                boxShadow: '0 12px 28px rgba(15, 23, 42, 0.06)',
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Filters
              </Typography>

              <TextField
                fullWidth
                placeholder="Job Title"
                value={filters.keyword}
                onChange={(e) => handleFilterChange('keyword', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2.5 }}
              />

              <TextField
                fullWidth
                placeholder="Location"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                sx={{ mb: 2.5 }}
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
                <FormGroup>
                  {JOB_TYPES.map((type) => (
                    <FormControlLabel
                      key={type}
                      control={
                        <Checkbox
                          checked={filters.jobType.includes(type)}
                          onChange={(e) => {
                            handleFilterChange('jobType', e.target.checked ? [type] : []);
                          }}
                        />
                      }
                      label={type}
                    />
                  ))}
                </FormGroup>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                  Category
                </Typography>
                <FormGroup sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {JOB_CATEGORIES.map((category) => (
                    <FormControlLabel
                      key={category}
                      control={
                        <Checkbox
                          checked={filters.category.includes(category)}
                          onChange={(e) => {
                            handleFilterChange('category', e.target.checked ? [category] : []);
                          }}
                        />
                      }
                      label={category}
                    />
                  ))}
                </FormGroup>
              </FormControl>

              <Button variant="outlined" fullWidth onClick={clearFilters}>
                Clear Filters
              </Button>
            </MotionPaper>
          </Grid>

          <Grid item xs={12} md={9}>
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
                        <JobCard job={job} />
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
