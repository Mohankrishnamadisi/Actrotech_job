import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Grid,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Layout } from '@components/layout/Layout';
import { useAuthStore } from '@store/index';
import { applicationService } from '@services/api';
import { formatDate } from '@utils/index';
import { ROUTES } from '@constants/index';
import { Link as RouterLink } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

type UserApplication = {
  id: string;
  status: string;
  applied_at?: string;
  jobs?: {
    title?: string;
    company_name?: string;
    location?: string;
  };
};

export const ApplicationsPage: React.FC = () => {
  const { user } = useAuthStore();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [applications, setApplications] = useState<UserApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const search = new URLSearchParams(location.search);
  const filter = search.get('filter');

  useEffect(() => {
    const loadApplications = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const data = await applicationService.getUserApplications(user.id);
        setApplications(data || []);
      } catch (err) {
        console.error('Failed to load user applications:', err);
      } finally {
        setLoading(false);
      }
    };
    loadApplications();
  }, [user?.id]);

  const filteredApplications = useMemo(() => {
    if (filter !== 'remote') return applications;

    return applications.filter((application) => {
      const loc = String(application.jobs?.location || '').toLowerCase();
      const workMode = String((application as any).jobs?.work_mode || (application as any).jobs?.workMode || '').toLowerCase();
      return loc.includes('remote') || workMode === 'remote' || workMode.includes('remote');
    });
  }, [applications, filter]);

  const getStatusConfig = (statusValue: string) => {
    const normalized = String(statusValue || 'applied').toLowerCase();

    if (normalized === 'shortlisted') {
      return {
        label: 'SHORTLISTED',
        chipColor: 'success' as const,
        accent: '#16A34A',
        lightBg: 'linear-gradient(160deg, #FFFFFF 0%, #F6FCF8 100%)',
        darkBg: 'linear-gradient(160deg, rgba(15,23,42,0.97), rgba(22,101,52,0.16))',
      };
    }

    if (normalized === 'under_review') {
      return {
        label: 'UNDER REVIEW',
        chipColor: 'warning' as const,
        accent: '#D97706',
        lightBg: 'linear-gradient(160deg, #FFFFFF 0%, #FFF9F0 100%)',
        darkBg: 'linear-gradient(160deg, rgba(15,23,42,0.97), rgba(120,53,15,0.16))',
      };
    }

    if (normalized === 'rejected') {
      return {
        label: 'REJECTED',
        chipColor: 'error' as const,
        accent: '#DC2626',
        lightBg: 'linear-gradient(160deg, #FFFFFF 0%, #FFF5F5 100%)',
        darkBg: 'linear-gradient(160deg, rgba(15,23,42,0.97), rgba(127,29,29,0.16))',
      };
    }

    if (normalized === 'accepted') {
      return {
        label: 'ACCEPTED',
        chipColor: 'primary' as const,
        accent: '#2563EB',
        lightBg: 'linear-gradient(160deg, #FFFFFF 0%, #F3F8FF 100%)',
        darkBg: 'linear-gradient(160deg, rgba(15,23,42,0.97), rgba(30,58,138,0.16))',
      };
    }

    return {
      label: 'APPLIED',
      chipColor: 'default' as const,
      accent: '#64748B',
      lightBg: 'linear-gradient(160deg, #FFFFFF 0%, #F8FAFC 100%)',
      darkBg: 'linear-gradient(160deg, rgba(15,23,42,0.97), rgba(71,85,105,0.14))',
    };
  };

  const statusSummary = useMemo(() => {
    return filteredApplications.reduce(
      (acc, application) => {
        const key = String(application.status || 'applied').toLowerCase();
        acc.total += 1;
        if (key === 'shortlisted') acc.shortlisted += 1;
        else if (key === 'under_review') acc.under_review += 1;
        else if (key === 'accepted') acc.accepted += 1;
        else if (key === 'rejected') acc.rejected += 1;
        else acc.applied += 1;
        return acc;
      },
      {
        total: 0,
        applied: 0,
        shortlisted: 0,
        under_review: 0,
        accepted: 0,
        rejected: 0,
      },
    );
  }, [filteredApplications]);

  const summaryCards = [
    { label: 'Total', value: statusSummary.total, accent: isDarkMode ? '#E2E8F0' : '#0F172A' },
    { label: 'Applied', value: statusSummary.applied, accent: '#64748B' },
    { label: 'Under Review', value: statusSummary.under_review, accent: '#D97706' },
    { label: 'Shortlisted', value: statusSummary.shortlisted, accent: '#16A34A' },
    { label: 'Accepted', value: statusSummary.accepted, accent: '#2563EB' },
    { label: 'Rejected', value: statusSummary.rejected, accent: '#DC2626' },
  ];

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
        <Card
          sx={{
            mb: 2.4,
            borderRadius: 3.2,
            border: '1px solid rgba(189, 139, 44, 0.42)',
            background:
              'radial-gradient(circle at 15% 18%, rgba(255,245,206,0.95) 0%, rgba(255,245,206,0) 42%), radial-gradient(circle at 86% 10%, rgba(253,186,116,0.45) 0%, rgba(253,186,116,0) 36%), linear-gradient(138deg, #FFF7DE 0%, #F7E5B7 50%, #EDD190 100%)',
            color: '#5D3A06',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 20px 44px rgba(156, 113, 36, 0.26), inset 0 1px 0 rgba(255, 255, 245, 0.72)',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(118deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0) 34%), repeating-linear-gradient(120deg, rgba(255,255,255,0.18) 0px, rgba(255,255,255,0.18) 1px, transparent 1px, transparent 22px)',
              pointerEvents: 'none',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              width: { xs: 220, md: 320 },
              height: { xs: 220, md: 320 },
              right: { xs: -100, md: -110 },
              bottom: { xs: -130, md: -145 },
              borderRadius: '50%',
              background: 'conic-gradient(from 45deg, rgba(255,230,160,0.72), rgba(251,191,36,0.34), rgba(245,158,11,0.46))',
              filter: 'blur(24px)',
              opacity: 0.72,
              pointerEvents: 'none',
            },
          }}
        >
          <CardContent sx={{ p: { xs: 2.2, md: 3.2 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.1, mb: 0.6 }}>
                  My Applications
                </Typography>
                <Typography sx={{ color: 'rgba(106, 65, 8, 0.88)' }}>
                  Status-driven command screen for every application in your pipeline.
                </Typography>
                {filter === 'remote' ? (
                  <Chip label="Remote Filter Active" size="small" sx={{ mt: 1.2, fontWeight: 700, bgcolor: 'rgba(255, 249, 232, 0.85)', color: '#6B4308', border: '1px solid rgba(188, 140, 43, 0.34)' }} />
                ) : null}
              </Box>
              <Button component={RouterLink} to={ROUTES.JOBS} variant="outlined" sx={{ borderColor: 'rgba(166, 116, 20, 0.5)', bgcolor: 'rgba(255, 251, 238, 0.62)', color: '#6A4208', fontWeight: 700, '&:hover': { borderColor: 'rgba(145, 95, 12, 0.66)', bgcolor: 'rgba(255, 248, 225, 0.92)' } }}>
                Browse More Jobs
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Grid container spacing={1.4} sx={{ mb: 2.4 }}>
          {summaryCards.map((item) => (
            <Grid item xs={6} sm={4} md={2} key={item.label}>
              <Card sx={{ borderRadius: 2.2, border: isDarkMode ? '1px solid rgba(148,163,184,0.2)' : `1px solid ${theme.palette.divider}`, background: isDarkMode ? 'linear-gradient(160deg, rgba(15,23,42,0.94), rgba(30,41,59,0.9))' : 'linear-gradient(160deg, #FFFFFF, #F8FAFC)' }}>
                <CardContent sx={{ py: 1.4, '&:last-child': { pb: 1.4 } }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {item.label}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: item.accent, mt: 0.3 }}>
                    {item.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {loading ? (
          <Card sx={{ borderRadius: 2.2 }}>
            <CardContent>
              <Typography sx={{ color: 'text.secondary' }}>Loading applications...</Typography>
            </CardContent>
          </Card>
        ) : filteredApplications.length === 0 ? (
          <Card sx={{ borderRadius: 2.2, border: isDarkMode ? '1px solid rgba(148,163,184,0.2)' : `1px solid ${theme.palette.divider}` }}>
            <CardContent sx={{ py: 5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.6 }}>
                No applications found
              </Typography>
              <Typography sx={{ color: 'text.secondary', mb: 2 }}>
                Apply to a job to see your application history here.
              </Typography>
              <Button component={RouterLink} to={ROUTES.JOBS} variant="contained">
                Explore Jobs
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={1.6}>
            {filteredApplications.map((application) => {
              const status = getStatusConfig(application.status);

              return (
                <Grid item xs={12} md={6} lg={4} key={application.id}>
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: 2.3,
                      border: isDarkMode ? '1px solid rgba(148,163,184,0.24)' : `1px solid ${theme.palette.divider}`,
                      background: isDarkMode ? status.darkBg : status.lightBg,
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: isDarkMode ? '0 8px 20px rgba(2,6,23,0.35)' : '0 8px 20px rgba(15,23,42,0.08)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 4,
                        background: status.accent,
                      },
                    }}
                  >
                    <CardContent sx={{ pl: 2.2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.2, mb: 1.2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.25, color: isDarkMode ? '#F8FAFC' : '#0F172A' }}>
                          {application.jobs?.title || 'Job title unavailable'}
                        </Typography>
                        <Chip label={status.label} color={status.chipColor} size="small" sx={{ fontWeight: 800 }} />
                      </Box>

                      <Typography variant="body2" sx={{ fontWeight: 700, color: isDarkMode ? '#CBD5E1' : '#334155', mb: 0.4 }}>
                        {application.jobs?.company_name || 'Company unavailable'}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mt: 1.2 }}>
                        <Chip
                          size="small"
                          variant="outlined"
                          label={application.jobs?.location || 'Location not specified'}
                          sx={{ fontWeight: 600 }}
                        />
                        <Chip
                          size="small"
                          variant="outlined"
                          label={application.applied_at ? `Applied ${formatDate(application.applied_at)}` : 'Applied date unavailable'}
                          sx={{ fontWeight: 600 }}
                        />
                        {String(application.jobs?.location || '').toLowerCase().includes('remote') ? (
                          <Chip size="small" label="Remote" color="info" sx={{ fontWeight: 700 }} />
                        ) : null}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>
    </Layout>
  );
};
