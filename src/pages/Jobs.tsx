import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Sidebar,
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
} from '@mui/material';
import { Search as SearchIcon, Tune as TuneIcon } from '@mui/icons-material';
import { Layout } from '@components/layout/Layout';
import { JobCard } from '@components/jobs/JobCard';
import { Loading } from '@components/common/Loading';
import { Error } from '@components/common/Error';
import { jobService } from '@services/api';
import { JOB_CATEGORIES, JOB_TYPES, EXPERIENCE_LEVELS } from '@constants/index';
import type { Job } from '@types/index';

export const Jobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    location: '',
    jobType: [] as string[],
    category: [] as string[],
    experience: '',
  });

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, unknown> = {};
        if (filters.search) params.title = filters.search;
        if (filters.location) params.location = filters.location;
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
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
    setPage(1);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilterChange('search', e.target.value);
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
          {/* Sidebar Filters */}
          <Grid item xs={12} md={3} sx={{ display: { xs: showFilters ? 'block' : 'none', md: 'block' } }}>
            <Box sx={{ position: { md: 'sticky' }, top: 80 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Filters
              </Typography>

              {/* Search */}
              <TextField
                fullWidth
                placeholder="Search by title..."
                value={filters.search}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              {/* Location */}
              <TextField
                fullWidth
                placeholder="Search by location..."
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                sx={{ mb: 3 }}
              />

              {/* Job Type */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, mb: 1 }}>
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
                            if (e.target.checked) {
                              handleFilterChange('jobType', [type]);
                            } else {
                              handleFilterChange('jobType', []);
                            }
                          }}
                        />
                      }
                      label={type}
                    />
                  ))}
                </FormGroup>
              </FormControl>

              {/* Experience */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Experience</InputLabel>
                <Select
                  value={filters.experience}
                  onChange={(e) => handleFilterChange('experience', e.target.value)}
                  label="Experience"
                >
                  <MenuItem value="">All Levels</MenuItem>
                  {EXPERIENCE_LEVELS.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Category */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, mb: 1 }}>
                  Category
                </Typography>
                <FormGroup sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {JOB_CATEGORIES.map((category) => (
                    <FormControlLabel
                      key={category}
                      control={
                        <Checkbox
                          checked={filters.category.includes(category)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleFilterChange('category', [category]);
                            } else {
                              handleFilterChange('category', []);
                            }
                          }}
                        />
                      }
                      label={category}
                    />
                  ))}
                </FormGroup>
              </FormControl>

              <Button
                variant="contained"
                fullWidth
                onClick={() => {
                  setFilters({
                    search: '',
                    location: '',
                    jobType: [],
                    category: [],
                    experience: '',
                  });
                }}
              >
                Clear Filters
              </Button>
            </Box>
          </Grid>

          {/* Jobs List */}
          <Grid item xs={12} md={9}>
            {loading ? (
              <Loading />
            ) : jobs.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                  No jobs found. Try adjusting your filters.
                </Typography>
              </Box>
            ) : (
              <>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  {jobs.map((job) => (
                    <Grid item xs={12} sm={6} lg={4} key={job.id}>
                      <JobCard job={job} />
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
