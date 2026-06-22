import React from 'react';
import { Box, Container, Card, CardContent, Typography, Button, Grid, TextField, MenuItem } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search as SearchIcon, TrendingUp as TrendingIcon } from '@mui/icons-material';
import { MobileLayout } from '@components/layout/MobileLayout';
import { ROUTES } from '@constants/index';

interface Job {
  id: string;
  title: string;
  company_name: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  job_type?: string;
  description?: string;
}

const MotionCard = motion(Card);

export const MobileJobs: React.FC<{ jobs?: Job[] }> = ({ jobs = [] }) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filteredJobs, setFilteredJobs] = React.useState<Job[]>(jobs);

  React.useEffect(() => {
    const filtered = jobs.filter(
      (job) =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredJobs(filtered);
  }, [searchQuery, jobs]);

  return (
    <MobileLayout>
      <Container maxWidth="sm" sx={{ py: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            Find Jobs
          </Typography>

          <TextField
            fullWidth
            placeholder="Search jobs, companies..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </Box>

        {filteredJobs.length > 0 ? (
          <Grid container spacing={2}>
            {filteredJobs.map((job, index) => (
              <Grid item xs={12} key={job.id}>
                <MotionCard
                  component={RouterLink}
                  to={`${ROUTES.JOBS}/${job.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  sx={{
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                          {job.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                          {job.company_name}
                        </Typography>
                      </Box>
                      {job.salary_min && (
                        <Box
                          sx={{
                            textAlign: 'right',
                            pl: 1,
                          }}
                        >
                          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, display: 'block' }}>
                            ${job.salary_min / 1000}K
                          </Typography>
                          {job.salary_max && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              - ${job.salary_max / 1000}K
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                      {job.location && (
                        <Box
                          sx={{
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            bgcolor: '#f5f5f5',
                            display: 'inline-block',
                          }}
                        >
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            📍 {job.location}
                          </Typography>
                        </Box>
                      )}
                      {job.job_type && (
                        <Box
                          sx={{
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            bgcolor: '#EFF6FF',
                            display: 'inline-block',
                          }}
                        >
                          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
                            {job.job_type}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {job.description && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {job.description}
                      </Typography>
                    )}
                  </CardContent>
                </MotionCard>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <TrendingIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              No jobs found. Try adjusting your search.
            </Typography>
          </Box>
        )}
      </Container>
    </MobileLayout>
  );
};
