import React from 'react';
import { Card, CardContent, Box, Typography, Chip, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { LocationOn as LocationOnIcon, Work as WorkIcon, TrendingUp as TrendingUpIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { getTimeAgo, formatJobSalary } from '@utils/index';
import { ROUTES } from '@constants/index';
import type { Job } from '@types/index';

const MotionCard = motion(Card);

interface JobCardProps {
  job: Job;
  onSave?: (jobId: string) => void;
  isSaved?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onSave, isSaved = false }) => {
  return (
    <MotionCard
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {job.featured && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
            borderRadius: '4px',
            px: 1.5,
            py: 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <TrendingUpIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            Featured
          </Typography>
        </Box>
      )}

      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Header */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
            {job.title}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
            {job.company}
          </Typography>
          {job.featured && (
            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 500 }}>
              Posted {getTimeAgo(job.createdAt)}
            </Typography>
          )}
        </Box>

        {/* Job Details */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOnIcon sx={{ fontSize: 18, color: 'primary.main' }} />
            <Typography variant="body2">{job.location}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WorkIcon sx={{ fontSize: 18, color: 'primary.main' }} />
            <Typography variant="body2">{job.jobType}</Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 500 }}>
            {formatJobSalary(job.salaryMin, job.salaryMax)}
          </Typography>
        </Box>

        {/* Skills */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {job.skills.slice(0, 3).map((skill) => (
            <Chip key={skill} label={skill} size="small" variant="outlined" />
          ))}
          {job.skills.length > 3 && (
            <Chip label={`+${job.skills.length - 3}`} size="small" variant="outlined" />
          )}
        </Box>

        {/* Description Preview */}
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            overflow: 'hidden',
            flex: 1,
          }}
        >
          {job.description}
        </Typography>
      </CardContent>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 1, p: 2, borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
        <Button
          component={RouterLink}
          to={ROUTES.JOB_DETAILS.replace(':id', job.id)}
          variant="contained"
          fullWidth
          size="small"
        >
          View Details
        </Button>
        {onSave && (
          <Button
            variant={isSaved ? 'contained' : 'outlined'}
            size="small"
            onClick={() => onSave(job.id)}
          >
            {isSaved ? 'Saved' : 'Save'}
          </Button>
        )}
      </Box>
    </MotionCard>
  );
};
