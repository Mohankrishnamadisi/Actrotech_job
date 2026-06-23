import React from 'react';
import { Box, Grid, Skeleton, Card, CardContent } from '@mui/material';

export const JobCardSkeleton: React.FC = () => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Skeleton variant="text" width="80%" height={28} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="50%" height={20} sx={{ mb: 2 }} />
      <Skeleton variant="text" width="60%" height={18} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="40%" height={18} sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: '6px' }} />
        <Skeleton variant="rectangular" width={70} height={24} sx={{ borderRadius: '6px' }} />
        <Skeleton variant="rectangular" width={55} height={24} sx={{ borderRadius: '6px' }} />
      </Box>
      <Skeleton variant="text" width="100%" height={16} />
      <Skeleton variant="text" width="90%" height={16} />
    </CardContent>
    <Box sx={{ p: 2, borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
      <Skeleton variant="rectangular" width="100%" height={36} sx={{ borderRadius: '6px' }} />
    </Box>
  </Card>
);

interface JobListSkeletonProps {
  count?: number;
}

export const JobListSkeleton: React.FC<JobListSkeletonProps> = ({ count = 6 }) => (
  <Grid container spacing={3}>
    {Array.from({ length: count }).map((_, i) => (
      <Grid item xs={12} sm={6} lg={4} key={i}>
        <JobCardSkeleton />
      </Grid>
    ))}
  </Grid>
);

export const ProfileSkeleton: React.FC = () => (
  <Box>
    <Skeleton variant="text" width={200} height={40} sx={{ mb: 1 }} />
    <Skeleton variant="text" width={300} height={24} sx={{ mb: 4 }} />
    <Card>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Skeleton variant="circular" width={100} height={100} sx={{ mx: 'auto', mb: 2 }} />
          <Skeleton variant="rectangular" width={120} height={32} sx={{ mx: 'auto', borderRadius: '6px' }} />
        </Box>
        <Grid container spacing={2}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} sm={6} key={i}>
              <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: '6px' }} />
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  </Box>
);
