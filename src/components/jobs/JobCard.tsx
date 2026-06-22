import React from 'react';
import { Card, CardContent, Box, Typography, Chip, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { LocationOn as LocationOnIcon, Work as WorkIcon, TrendingUp as TrendingUpIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { getTimeAgo, formatJobSalary } from '@utils/index';
import { ROUTES } from '@constants/index';
import type { Job } from '../../types';

const MotionCard = motion(Card);

interface JobCardProps {
  job: Job;
  onSave?: (jobId: string) => void;
  isSaved?: boolean;
  isPremiumUser?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onSave, isSaved = false, isPremiumUser = false }) => {
  const workMode = job.workMode || job.work_mode;
  const showRemotePremium = workMode === 'Remote' && !isPremiumUser;
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
        alignSelf: 'stretch',
        minHeight: 380,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
        background: 'linear-gradient(180deg, #fff 0%, #fafcff 100%)',
      }}
    >
      {(job.featured || showRemotePremium) && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: showRemotePremium ? '#E0E7FF' : '#E8F5E9',
            color: showRemotePremium ? 'primary.dark' : 'success.dark',
            borderRadius: 999,
            px: 1.5,
            py: 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          {job.featured ? <TrendingUpIcon sx={{ fontSize: 16 }} /> : null}
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {showRemotePremium ? 'Premium Remote' : 'Featured'}
          </Typography>
        </Box>
      )}

      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, height: '100%', py: 2.2, px: 2.2 }}>
        {/* Header */}
        <Box sx={{ minHeight: 68 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 0.4,
              lineHeight: 1.25,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {job.title}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              mb: 0.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              ...(showRemotePremium ? { filter: 'blur(4px)', userSelect: 'none' } : {}),
            }}
          >
            {showRemotePremium ? 'Upgrade to view company' : job.company_name}
          </Typography>
          {job.featured && (
            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 500 }}>
              Posted {getTimeAgo(job.createdAt || job.created_at || new Date().toISOString())}
            </Typography>
          )}
        </Box>

        {/* Job Details */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOnIcon sx={{ fontSize: 18, color: 'primary.main' }} />
            <Typography
              variant="body2"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: 'text.secondary',
              }}
            >
              {job.location}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <WorkIcon sx={{ fontSize: 18, color: 'primary.main' }} />
            <Typography
              variant="body2"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: 'text.secondary',
              }}
            >
              {job.jobType || job.job_type || 'Type unavailable'}
            </Typography>
            {job.workMode || job.work_mode ? (
              <Chip
                label={job.workMode || job.work_mode}
                size="small"
                variant="outlined"
                sx={{ ml: 0.5 }}
              />
            ) : null}
          </Box>
          {(job.positionsAvailable || job.positions_available) && (
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {showRemotePremium ? 'Positions hidden • Upgrade' : `Hiring ${job.positionsAvailable || job.positions_available} position${(job.positionsAvailable || job.positions_available) === 1 ? '' : 's'}`}
            </Typography>
          )}
          <Typography
            variant="body2"
            sx={{ color: 'success.main', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {formatJobSalary(job.salaryMin, job.salaryMax)}
          </Typography>
        </Box>

        {/* Skills */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, minHeight: 28 }}>
          {job.skills.slice(0, 3).map((skill) => (
            <Chip
              key={skill}
              label={skill}
              size="small"
              variant="outlined"
              sx={{ maxWidth: '100%', bgcolor: 'grey.50' }}
            />
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
            textOverflow: 'ellipsis',
            minHeight: 42,
          }}
        >
          {job.description}
        </Typography>
      </CardContent>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 1, p: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
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
