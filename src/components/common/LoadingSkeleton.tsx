import React from 'react';
import { Box, Grid, Skeleton, Card, CardContent } from '@mui/material';

export const JobCardSkeleton: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      p: 2,
      minHeight: 140,
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: '#ffffff',
    }}
  >
    {/* Avatar */}
    <Skeleton variant="circular" width={56} height={56} sx={{ flexShrink: 0 }} />

    {/* Content */}
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Skeleton variant="text" width="60%" height={24} sx={{ mb: 0.5 }} />
      <Skeleton variant="text" width="40%" height={16} sx={{ mb: 1 }} />

      <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
        <Skeleton variant="rectangular" width={80} height={20} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={70} height={20} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={90} height={20} sx={{ borderRadius: 1 }} />
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        <Skeleton variant="text" width="25%" height={14} />
        <Skeleton variant="text" width="25%" height={14} />
        <Skeleton variant="text" width="20%" height={14} />
      </Box>

      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Skeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={65} height={20} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={70} height={20} sx={{ borderRadius: 1 }} />
      </Box>
    </Box>

    {/* Buttons */}
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
      <Skeleton variant="rectangular" width={90} height={36} sx={{ borderRadius: 1.5 }} />
      <Skeleton variant="rectangular" width={40} height={36} sx={{ borderRadius: 1 }} />
    </Box>
  </Box>
);

interface JobListSkeletonProps {
  count?: number;
}

export const JobListSkeleton: React.FC<JobListSkeletonProps> = ({ count = 6 }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
    {Array.from({ length: count }).map((_, i) => (
      <JobCardSkeleton key={i} />
    ))}
  </Box>
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
