import React, { Suspense, useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Add as AddIcon,
  ArrowRight as ArrowRightIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@store/index';
import { ROUTES } from '@constants/index';
import { recruiterService, statsService, notificationService, jobService } from '@services/api';
import { messagingService } from '@services/messaging';
import toast from 'react-hot-toast';
import type { Job, RecruiterCredits, Subscription } from '@types';
import {
  ensureRecruiterCredits,
  getActiveRecruiterSubscription,
} from '@utils/resumeUnlocks';
import { themeColors } from '@styles/recruiterTheme';
import { RecruiterLayout } from '@components/recruiter/RecruiterLayout';
import { DashboardOverview } from '@components/recruiter/DashboardOverview';
import { JobPostingForm } from '@components/recruiter/JobPostingForm';
import { ManageJobs } from '@components/recruiter/ManageJobs';
import { ViewApplicants } from '@components/recruiter/ViewApplicants';
import { CompanyProfile } from '@components/recruiter/CompanyProfile';
import { CandidateSearch } from '@components/recruiter/CandidateSearch';
import { TagManager } from '@components/recruiter/TagManager';
import { TalentPool } from '@components/recruiter/TalentPool';
import { RecruiterSettingsPanel } from '@components/recruiter/RecruiterSettings';
import PipelineBoard from '../../features/ats/PipelineBoard';


type DashboardTab =
  | 'overview'
  | 'jobs'
  | 'company-profile'
  | 'applicants'
  | 'recommended'
  | 'find-candidates'
  | 'talent-pool'
  | 'tags'
  | 'ats-pipeline'
  | 'settings';

const MotionBox = motion(Box);
const RecommendedCandidates = React.lazy(() =>
  import('@components/recruiter/RecommendedCandidates').then((module) => ({
    default: module.RecommendedCandidates,
  }))
);

export const RecruiterDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // State
  const [currentTab, setCurrentTab] = useState<DashboardTab>('overview');
  const [jobPostingFormOpen, setJobPostingFormOpen] = useState(false);
  const [stats, setStats] = useState({
    active_jobs: 0,
    total_jobs: 0,
    total_applicants: 0,
    shortlisted: 0,
    rejected: 0,
    priority_applicants: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recruiterProfile, setRecruiterProfile] = useState<any>(null);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [credits, setCredits] = useState<RecruiterCredits | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recommendedJobId, setRecommendedJobId] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return undefined;

    let mounted = true;
    const refreshUnreadNotifications = async () => {
      try {
        const unreadNotif = await notificationService.getUnreadNotifications(user.id);
        if (!mounted) return;
        setNotificationsCount(unreadNotif?.length || 0);
      } catch {
        // noop
      }
    };

    refreshUnreadNotifications();
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshUnreadNotifications();
      }
    }, 30000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!recommendedJobId && jobs.length > 0) {
      setRecommendedJobId(jobs[0].id);
    }
  }, [jobs, recommendedJobId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, profileData, unreadNotif, conversations, recruiterJobs, creditsData, subscriptionData] =
        await Promise.all([
          statsService.getRecruiterStats(user?.id || ''),
          recruiterService.getRecruiterProfile(user?.id || ''),
          notificationService.getUnreadNotifications(user?.id || ''),
          messagingService.getConversations(user?.id || ''),
          jobService.getRecruiterJobs(user?.id || ''),
          ensureRecruiterCredits(user?.id || ''),
          getActiveRecruiterSubscription(user?.id || ''),
        ]);

      setStats((previous) => ({
        ...previous,
        ...statsData,
        priority_applicants: (statsData as any)?.priority_applicants || 0,
      }));
      setRecruiterProfile(profileData);
      setJobs(recruiterJobs || []);
      setNotificationsCount(unreadNotif?.length || 0);
      setUnreadMessagesCount(conversations?.filter((c: any) => c.unread)?.length || 0);
      setCredits(creditsData);
      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = () => {
    navigate(ROUTES.MESSAGING);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: themeColors.backgroundAlt,
        }}
      >
        <CircularProgress size={60} sx={{ color: themeColors.primary }} />
      </Box>
    );
  }

  // Render Content Based on Tab
  const renderContent = () => {
    switch (currentTab) {
      case 'overview':
        return (
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <DashboardOverview
              activeJobs={stats.active_jobs}
              totalApplicants={stats.total_applicants}
              shortlisted={stats.shortlisted}
              rejected={stats.rejected}
              priorityCandidates={stats.priority_applicants}
              onViewJobs={() => setCurrentTab('jobs')}
              onViewApplicants={() => setCurrentTab('applicants')}
            />

            {/* Quick Actions Section */}
            <Grid container spacing={3} sx={{ mt: 2 }}>
              {/* Post New Job Card */}
              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    borderRadius: '16px',
                    border: `1px solid ${themeColors.border}`,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
                      borderColor: themeColors.primary,
                    },
                  }}
                  onClick={() => setJobPostingFormOpen(true)}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: themeColors.text.primary,
                            mb: 0.5,
                          }}
                        >
                          Post a New Job
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: themeColors.text.secondary,
                            fontSize: '0.875rem',
                          }}
                        >
                          Start recruiting for your open positions
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        sx={{
                          background: `linear-gradient(135deg, ${themeColors.primary} 0%, #7C3AED 100%)`,
                          color: '#FFFFFF',
                        }}
                      >
                        Post Job
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* View Pipeline Card */}
              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    borderRadius: '16px',
                    border: `1px solid ${themeColors.border}`,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
                      borderColor: themeColors.primary,
                    },
                  }}
                  onClick={() => setCurrentTab('ats-pipeline')}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: themeColors.text.primary,
                            mb: 0.5,
                          }}
                        >
                          View ATS Pipeline
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: themeColors.text.secondary,
                            fontSize: '0.875rem',
                          }}
                        >
                          Manage your hiring stages and candidates
                        </Typography>
                      </Box>
                      <ArrowRightIcon sx={{ color: themeColors.primary, fontSize: '1.5rem' }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </MotionBox>
        );

      case 'jobs':
        return (
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: themeColors.text.primary,
                }}
              >
                Jobs
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setJobPostingFormOpen(true)}
                sx={{
                  background: `linear-gradient(135deg, ${themeColors.primary} 0%, #7C3AED 100%)`,
                  color: '#FFFFFF',
                }}
              >
                Post Job
              </Button>
            </Box>
            {user?.id && <ManageJobs recruiterId={user.id} onJobsChange={fetchData} />}
          </MotionBox>
        );

      case 'applicants':
        return (
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: themeColors.text.primary,
                mb: 3,
              }}
            >
              Applicants
            </Typography>
            {user?.id && <ViewApplicants recruiterId={user.id} onChatClick={handleChatClick} />}
          </MotionBox>
        );

      case 'recommended':
        return (
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: themeColors.text.primary,
                mb: 3,
              }}
            >
              Recommended Candidates
            </Typography>

            {jobs.length === 0 ? (
              <Card sx={{ borderRadius: '12px', border: `1px solid ${themeColors.border}` }}>
                <CardContent>
                  <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                    No jobs available for recommendations
                  </Typography>
                  <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 2 }}>
                    Post a job first to get AI-powered candidate recommendations.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setJobPostingFormOpen(true)}
                    sx={{ background: `linear-gradient(135deg, ${themeColors.primary} 0%, #7C3AED 100%)` }}
                  >
                    Post New Job
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card sx={{ mb: 2, borderRadius: '12px', border: `1px solid ${themeColors.border}` }}>
                  <CardContent>
                    <FormControl fullWidth size="small">
                      <InputLabel id="recommended-job-label">Recommend candidates for job</InputLabel>
                      <Select
                        labelId="recommended-job-label"
                        value={recommendedJobId}
                        label="Recommend candidates for job"
                        onChange={(event) => setRecommendedJobId(event.target.value)}
                      >
                        {jobs.map((job) => (
                          <MenuItem key={job.id} value={job.id}>
                            {job.title} - {job.location}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
                {user?.id && recommendedJobId && (
                  <Suspense fallback={<CircularProgress />}>
                    <RecommendedCandidates
                      recruiterId={user.id}
                      jobId={recommendedJobId}
                      onMessageClick={handleChatClick}
                    />
                  </Suspense>
                )}
              </>
            )}
          </MotionBox>
        );

      case 'find-candidates':
        return (
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: themeColors.text.primary,
                mb: 3,
              }}
            >
              Find Candidates
            </Typography>
            {user?.id && <CandidateSearch recruiterId={user.id} onChatClick={handleChatClick} />}
          </MotionBox>
        );

      case 'talent-pool':
        return (
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: themeColors.text.primary,
                mb: 3,
              }}
            >
              Talent Pool
            </Typography>
            {user?.id && <TalentPool recruiterId={user.id} onChatClick={handleChatClick} />}
          </MotionBox>
        );

      case 'tags':
        return (
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: themeColors.text.primary,
                mb: 3,
              }}
            >
              Candidate Tags
            </Typography>
            {user?.id && <TagManager recruiterId={user.id} inline onTagsChange={fetchData} />}
          </MotionBox>
        );

      case 'ats-pipeline':
        return (
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: themeColors.text.primary,
                mb: 3,
              }}
            >
              ATS Pipeline
            </Typography>
            <PipelineBoard />
          </MotionBox>
        );

      case 'company-profile':
        return (
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {user?.id && <CompanyProfile recruiterId={user.id} onProfileUpdate={fetchData} />}
          </MotionBox>
        );

      case 'settings':
        return (
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: themeColors.text.primary,
                mb: 3,
              }}
            >
              Settings
            </Typography>
            {user?.id && <RecruiterSettingsPanel recruiterId={user.id} />}
          </MotionBox>
        );

      default:
        return null;
    }
  };


  return (
    <RecruiterLayout
      currentTab={currentTab}
      onTabChange={(tab) => {
        if (tab === 'credits') {
          navigate(ROUTES.RECRUITER_SUBSCRIPTION);
          return;
        }
        setCurrentTab(tab as DashboardTab);
      }}
      companyName={recruiterProfile?.company_name || 'Your Company'}
      companyLogo={recruiterProfile?.logo_url}
      notificationCount={notificationsCount}
      unreadMessagesCount={unreadMessagesCount}
      credits={credits?.available_credits || 0}
      planName={subscription?.plan || 'Free'}
      onNotificationsClick={() => navigate(ROUTES.DASHBOARD_NOTIFICATIONS)}
      onMessagesClick={() => navigate(ROUTES.MESSAGING)}
      onProfileClick={() => setCurrentTab('company-profile')}
      onSettingsClick={() => setCurrentTab('settings')}
    >
      {renderContent()}

      {/* Job Posting Dialog */}
      <Dialog
        open={jobPostingFormOpen}
        onClose={() => setJobPostingFormOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <JobPostingForm
          open={jobPostingFormOpen}
          onClose={() => {
            setJobPostingFormOpen(false);
            fetchData();
          }}
          recruiterId={user?.id || ''}
          onJobCreated={fetchData}
        />
      </Dialog>
    </RecruiterLayout>
  );
};

