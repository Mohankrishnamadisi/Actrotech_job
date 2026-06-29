import React from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Icon } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Bolt as LightningIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { themeColors } from '@styles/recruiterTheme';

interface DashboardOverviewProps {
  activeJobs?: number;
  totalApplicants?: number;
  shortlisted?: number;
  rejected?: number;
  priorityCandidates?: number;
  onViewJobs?: () => void;
  onViewApplicants?: () => void;
}

const MotionCard = motion(Card);

const StatCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  trend?: string;
  onClick?: () => void;
  index?: number;
}> = ({ title, value, icon, color, trend, onClick, index = 0 }) => (
  <MotionCard
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: index * 0.1 }}
    whileHover={{ y: -8, boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)' }}
    onClick={onClick}
    sx={{
      cursor: onClick ? 'pointer' : 'default',
      borderRadius: '16px',
      border: `1px solid ${themeColors.border}`,
      background: `linear-gradient(135deg, ${color}05 0%, ${color}02 100%)`,
      transition: 'all 0.3s ease-in-out',
      '&:hover': {
        borderColor: color,
      },
    }}
  >
    <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Icon and Title */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Typography
          variant="body2"
          sx={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: themeColors.text.secondary,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {title}
        </Typography>
        <Box
          sx={{
            p: 1,
            borderRadius: '10px',
            backgroundColor: `${color}20`,
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>

      {/* Value */}
      <Typography
        variant="h3"
        sx={{
          fontSize: '2rem',
          fontWeight: 700,
          color: themeColors.text.primary,
          mb: 1,
        }}
      >
        {value}
      </Typography>

      {/* Trend */}
      {trend && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <TrendingUpIcon sx={{ fontSize: '0.875rem', color: themeColors.success }} />
          <Typography
            variant="caption"
            sx={{
              color: themeColors.success,
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          >
            {trend}
          </Typography>
        </Box>
      )}
    </CardContent>
  </MotionCard>
);

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  activeJobs = 0,
  totalApplicants = 0,
  shortlisted = 0,
  rejected = 0,
  priorityCandidates = 0,
  onViewJobs,
  onViewApplicants,
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: themeColors.text.primary,
              mb: 0.5,
            }}
          >
            Overview
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: themeColors.text.secondary,
              fontSize: '0.875rem',
            }}
          >
            Your recruitment metrics at a glance
          </Typography>
        </Box>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Active Jobs"
            value={activeJobs}
            icon={<LightningIcon sx={{ fontSize: '1.5rem' }} />}
            color={themeColors.primary}
            onClick={onViewJobs}
            index={0}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Applicants"
            value={totalApplicants}
            icon={<PeopleIcon sx={{ fontSize: '1.5rem' }} />}
            color="#7C3AED"
            onClick={onViewApplicants}
            index={1}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Shortlisted"
            value={shortlisted}
            icon={<CheckCircleIcon sx={{ fontSize: '1.5rem' }} />}
            color={themeColors.success}
            trend={`${totalApplicants > 0 ? ((shortlisted / totalApplicants) * 100).toFixed(1) : 0}% conversion`}
            index={2}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Rejected"
            value={rejected}
            icon={<CancelIcon sx={{ fontSize: '1.5rem' }} />}
            color={themeColors.danger}
            index={3}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Priority Candidates"
            value={priorityCandidates}
            icon={<TrendingUpIcon sx={{ fontSize: '1.5rem' }} />}
            color={themeColors.warning}
            index={4}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              borderRadius: '16px',
              border: `1px dashed ${themeColors.border}`,
              background: `linear-gradient(135deg, ${themeColors.primaryLight} 0%, transparent 100%)`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '180px',
              p: 2,
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  color: themeColors.text.secondary,
                  mb: 1.5,
                  fontSize: '0.875rem',
                }}
              >
                Need more applicants?
              </Typography>
              <Button
                variant="contained"
                size="small"
                sx={{
                  background: `linear-gradient(135deg, ${themeColors.primary} 0%, #7C3AED 100%)`,
                  color: '#FFFFFF',
                  fontWeight: 600,
                }}
              >
                Promote Job
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
