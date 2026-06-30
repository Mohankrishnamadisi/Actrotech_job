import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Chat as ChatIcon,
  Description as DescriptionIcon,
  Notifications as NotificationsIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Videocam as VideocamIcon,
  Visibility as VisibilityIcon,
  Work as WorkIcon,
  Favorite as FavoriteIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Public as PublicIcon,
  AccountCircle as AccountCircleIcon,
  FlightTakeoff as FlightTakeoffIcon,
  AutoAwesome as AutoAwesomeIcon,
  Insights as InsightsIcon,
  Bolt as BoltIcon,
  TrackChanges as TrackChangesIcon,
  Tune as TuneIcon,
  StickyNote2 as StickyNote2Icon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

import { Layout } from '@components/layout/Layout';
import SupportWidget from '@components/common/SupportWidget';
import { useThemeMode } from '@hooks/index';
import { useAuthStore } from '@store/index';
import { authService } from '@services/supabase';
import { supportService } from '@services/support';
import { userService, applicationService, savedService, notificationService, jobService } from '@services/api';
import { messagingService } from '@services/messaging';
import {
  getCandidateProfileViewCount,
  getCandidateProfileViewRecruiters,
  getCandidateResumeUnlockCount,
  getCandidateResumeUnlockRecruiters,
} from '@utils/resumeUnlocks';
import { ROUTES } from '@constants/index';
import { formatDate } from '@utils/index';
import {
  getWeightsForRole,
  mergePremiumDashboardConfig,
  readLocalPreferencesRole,
  readLocalPremiumConfig,
  type DemandWeights,
  type WeeklyGoalTargets,
} from '@utils/premiumDashboardConfig';
import './PremiumHeroStars.css';
import '../../styles/spaceButton.css';
import '../../styles/sparkleButton.css';
import '../../styles/ctaButton.css';
import '../../styles/opportunitySignalButton.css';

const getJobList = (response: any): any[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const MotionCard = motion(Card);
const candidateHeroGradient = 'linear-gradient(310deg, rgba(15,23,42,0.95) 0%, rgba(30,64,175,0.93) 45%, rgba(14,116,144,0.92) 100%)';

type RecentApplication = {
  status: string;
  applied_at?: string;
  jobs?: {
    id?: string;
    title?: string;
    company_name?: string;
    location?: string;
  };
};

type OpportunitySignal = {
  title: string;
  description: string;
  cta: string;
  action: () => void;
  tone: 'success' | 'warning' | 'primary';
  observedAt?: string;
  priorityScore: number;
};

export const PremiumDashboard: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { themeMode } = useThemeMode();
  const theme = useTheme();
  const navigate = useNavigate();
  const isDarkMode = theme.palette.mode === 'dark';
  const [profileMenuAnchorEl, setProfileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const [ticketNotifCount, setTicketNotifCount] = useState(0);

  const [applicationCount, setApplicationCount] = useState(0);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profileStrength, setProfileStrength] = useState(0);
  const [resumeDownloadCount, setResumeDownloadCount] = useState<number>(0);
  const [profileViewCount, setProfileViewCount] = useState<number>(0);
  const [interactionModalOpen, setInteractionModalOpen] = useState(false);
  const [interactionModalTitle, setInteractionModalTitle] = useState('');
  const [interactionType, setInteractionType] = useState<'downloads' | 'views'>('downloads');
  const [interactionLoading, setInteractionLoading] = useState(false);
  const [interactionItems, setInteractionItems] = useState<any[]>([]);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [selectedRoleModel, setSelectedRoleModel] = useState('General');
  const [roleWeightMap, setRoleWeightMap] = useState<Record<string, DemandWeights>>({});
  const [weeklyTargets, setWeeklyTargets] = useState<WeeklyGoalTargets>({ applications: 6, interactions: 10, pipeline: 4 });

  const openProfileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchorEl(event.currentTarget);
  };

  useEffect(() => {
    if (!user?.id) return;
    supportService.getUnseenAdminResponseCount(user.id).then(setTicketNotifCount).catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return undefined;

    let mounted = true;
    const refreshUnreadNotifications = async () => {
      try {
        const unread = await notificationService.getUnreadNotifications(user.id);
        if (!mounted) return;
        setNotificationsCount((unread || []).length);
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

  const closeProfileMenu = () => {
    setProfileMenuAnchorEl(null);
  };

  const handleSignout = async () => {
    closeProfileMenu();
    try {
      await authService.signOut();
    } catch {
      // noop
    } finally {
      logout();
      navigate(ROUTES.LOGIN, { replace: true });
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const profile = await userService.getProfile(user.id);

        if (profile) {
          const skills = Array.isArray(profile.skills) ? profile.skills : [];
          setUserSkills(skills);

          const apiConfig = (profile.dashboard_preferences || profile.premium_dashboard_config || profile.dashboard_config || {}) as Record<string, any>;
          const localConfig = readLocalPremiumConfig();
          const roleFromPreferences = readLocalPreferencesRole();

          const mergedConfig = mergePremiumDashboardConfig(
            apiConfig,
            localConfig,
            roleFromPreferences || (Array.isArray(profile.preferred_job_titles) ? profile.preferred_job_titles[0] : 'General'),
          );

          setSelectedRoleModel(mergedConfig.selectedRole);
          setRoleWeightMap(mergedConfig.roleWeights);
          setWeeklyTargets(mergedConfig.weeklyTargets);

          const strength = Math.min(
            100,
            (
              (skills.length * 10)
              + (profile.resumeUrl || profile.resume_url ? 20 : 0)
              + (profile.experience ? 15 : 0)
              + (profile.phone ? 10 : 0)
              + (profile.bio ? 10 : 0)
              + ((profile.workExperience || profile.work_experience || []).length * 10)
              + ((profile.education || profile.education_details || []).length * 10)
            ) / 10,
          );

          setProfileStrength(Math.round(strength));

          if (skills.length > 0) {
            const recRes = await jobService.getJobsBySkills(skills, 1, 6);
            setRecommendedJobs(getJobList(recRes));
          } else {
            setRecommendedJobs([]);
          }
        }

        const [applications, saved, unreadNotifications, conversations] = await Promise.all([
          applicationService.getUserApplications(user.id),
          savedService.getUserSavedJobs(user.id),
          notificationService.getUnreadNotifications(user.id),
          messagingService.getConversations(user.id),
        ]);

        setRecentApplications(applications || []);
        setApplicationCount(applications?.length || 0);
        setSavedJobsCount(saved?.length || 0);
        setNotificationsCount((unreadNotifications || []).length);
        setUnreadMessagesCount(
          (((conversations as any[]) || []).reduce((count, conv) => count + (conv.unreadCount || 0), 0)),
        );

        const [downloadCount, viewCount] = await Promise.all([
          getCandidateResumeUnlockCount(user.id),
          getCandidateProfileViewCount(user.id),
        ]);

        setResumeDownloadCount(downloadCount);
        setProfileViewCount(viewCount);
      } catch (error) {
        console.error('Error fetching premium dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.id]);

  const openInteractionModal = async (type: 'downloads' | 'views') => {
    if (!user?.id) return;

    setInteractionLoading(true);
    setInteractionModalOpen(true);
    setInteractionItems([]);

    try {
      if (type === 'downloads') {
        setInteractionType('downloads');
        setInteractionModalTitle('Recruiters who downloaded your resume');
        const items = await getCandidateResumeUnlockRecruiters(user.id);
        setInteractionItems(items);
      } else {
        setInteractionType('views');
        setInteractionModalTitle('Recruiters who viewed your profile');
        const items = await getCandidateProfileViewRecruiters(user.id);
        setInteractionItems(items);
      }
    } finally {
      setInteractionLoading(false);
    }
  };

  const stats = useMemo(
    () => [
      {
        label: 'Applications',
        value: applicationCount,
        subtext: 'Track hiring movement',
        icon: WorkIcon,
        color: theme.palette.primary.main,
        lightBg: 'linear-gradient(140deg, #DBEAFE 0%, #EEF4FF 55%, #FFFFFF 100%)',
        darkBg: 'linear-gradient(145deg, rgba(30,58,138,0.42), rgba(15,23,42,0.95))',
        action: () => navigate(ROUTES.DASHBOARD_APPLICATIONS),
      },
      {
        label: 'Saved Jobs',
        value: savedJobsCount,
        subtext: 'Your shortlisted roles',
        icon: FavoriteIcon,
        color: theme.palette.error.main,
        lightBg: 'linear-gradient(140deg, #FFE4E6 0%, #FFF1F2 55%, #FFFFFF 100%)',
        darkBg: 'linear-gradient(145deg, rgba(131,24,67,0.4), rgba(15,23,42,0.95))',
        action: () => navigate(ROUTES.DASHBOARD_SAVED_JOBS),
      },
      {
        label: 'Resume Downloads',
        value: resumeDownloadCount,
        subtext: 'Recruiter resume opens',
        icon: VideocamIcon,
        color: theme.palette.success.main,
        lightBg: 'linear-gradient(140deg, #DCFCE7 0%, #F0FDF4 55%, #FFFFFF 100%)',
        darkBg: 'linear-gradient(145deg, rgba(20,83,45,0.4), rgba(15,23,42,0.95))',
        action: () => openInteractionModal('downloads'),
      },
      {
        label: 'Profile Views',
        value: profileViewCount,
        subtext: 'Interest from employers',
        icon: VisibilityIcon,
        color: theme.palette.secondary.main,
        lightBg: 'linear-gradient(140deg, #F3E8FF 0%, #FAF5FF 55%, #FFFFFF 100%)',
        darkBg: 'linear-gradient(145deg, rgba(76,29,149,0.4), rgba(15,23,42,0.95))',
        action: () => openInteractionModal('views'),
      },
    ],
    [applicationCount, navigate, profileViewCount, resumeDownloadCount, savedJobsCount, theme.palette.error.main, theme.palette.primary.main, theme.palette.secondary.main, theme.palette.success.main],
  );

  const premiumInsights = useMemo(() => {
    const views = Number(profileViewCount || 0);
    const downloads = Number(resumeDownloadCount || 0);
    const interactions = views + downloads;
    const activeWeights = getWeightsForRole(selectedRoleModel, roleWeightMap);

    const demandScore = Math.min(
      100,
      Math.round(
        (profileStrength * activeWeights.profileStrength)
        + (Math.min(applicationCount, 30) * activeWeights.applications)
        + (Math.min(interactions, 50) * activeWeights.interactions)
        + (Math.min(userSkills.length, 12) * activeWeights.skills),
      ),
    );

    const recentApplications7d = recentApplications.filter((item) => {
      if (!item.applied_at) return false;
      const applied = new Date(item.applied_at).getTime();
      if (Number.isNaN(applied)) return false;
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      return applied >= sevenDaysAgo;
    }).length;

    const interviewPipelineCount = recentApplications.filter(
      (item) => item.status === 'shortlisted' || item.status === 'under_review' || item.status === 'accepted',
    ).length;

    const weeklyGoals = [
      {
        label: 'Weekly applications',
        current: recentApplications7d,
        target: weeklyTargets.applications,
      },
      {
        label: 'Recruiter interactions',
        current: interactions,
        target: weeklyTargets.interactions,
      },
      {
        label: 'Pipeline interviews',
        current: interviewPipelineCount,
        target: weeklyTargets.pipeline,
      },
    ];

    const strengths = [
      profileStrength >= 80 ? 'Profile is highly optimized' : null,
      userSkills.length >= 5 ? 'Skill stack is strong for matching' : null,
      downloads > 0 ? 'Resume already attracting recruiters' : null,
    ].filter(Boolean) as string[];

    return {
      demandScore,
      recentApplications7d,
      interviewPipelineCount,
      weeklyGoals,
      strengths,
      activeWeights,
    };
  }, [applicationCount, profileStrength, profileViewCount, recentApplications, resumeDownloadCount, roleWeightMap, selectedRoleModel, userSkills.length, weeklyTargets.applications, weeklyTargets.interactions, weeklyTargets.pipeline]);

  const opportunitySignals = useMemo<OpportunitySignal[]>(() => {
    const now = Date.now();
    const latestAppliedAt = recentApplications
      .map((item) => item.applied_at)
      .filter(Boolean)
      .sort((a, b) => new Date(String(b)).getTime() - new Date(String(a)).getTime())[0];

    const computePriority = (base: number, observedAt?: string) => {
      if (!observedAt) return base;
      const observedMs = new Date(observedAt).getTime();
      if (Number.isNaN(observedMs)) return base;
      const hoursSince = Math.max(0, (now - observedMs) / (1000 * 60 * 60));
      const timeBoost = Math.max(0, 72 - hoursSince);
      return Math.round(base + (timeBoost * 0.4));
    };

    const signals: OpportunitySignal[] = [];

    if (profileStrength < 75) {
      signals.push({
        title: 'Boost profile completion',
        description: 'Profiles above 75% generally receive more recruiter callbacks.',
        cta: 'Improve profile',
        action: () => navigate(ROUTES.DASHBOARD_PROFILE),
        tone: 'warning',
        observedAt: latestAppliedAt,
        priorityScore: computePriority(70, latestAppliedAt),
      });
    }

    if (recommendedJobs.length > 0) {
      const topMatchObservedAt = String(recommendedJobs[0]?.created_at || recommendedJobs[0]?.createdAt || new Date().toISOString());
      signals.push({
        title: `${recommendedJobs.length} fresh AI matches available`,
        description: 'High-match roles are ready. Apply early to improve shortlist chances.',
        cta: 'Open matches',
        action: () => navigate('/dashboard/recommended-jobs?minMatch=60'),
        tone: 'success',
        observedAt: topMatchObservedAt,
        priorityScore: computePriority(86, topMatchObservedAt),
      });
    }

    if ((unreadMessagesCount || 0) > 0 || (notificationsCount || 0) > 0) {
      signals.push({
        title: 'Recruiter conversations need response',
        description: 'Unread activity detected. Faster replies can improve interview conversion.',
        cta: 'Check inbox',
        action: () => navigate(ROUTES.MESSAGING),
        tone: 'primary',
        observedAt: new Date().toISOString(),
        priorityScore: computePriority(93, new Date().toISOString()),
      });
    }

    if (recentApplications.length === 0) {
      const observedAt = new Date(now - (2 * 24 * 60 * 60 * 1000)).toISOString();
      signals.push({
        title: 'Application cadence is low this week',
        description: 'Start this week with at least 2 targeted applications for better momentum.',
        cta: 'Browse jobs',
        action: () => navigate(ROUTES.JOBS),
        tone: 'warning',
        observedAt,
        priorityScore: computePriority(78, observedAt),
      });
    }

    return signals
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 3);
  }, [navigate, notificationsCount, profileStrength, recentApplications, recommendedJobs, unreadMessagesCount]);

  const activeRoleWeights = useMemo(() => getWeightsForRole(selectedRoleModel, roleWeightMap), [roleWeightMap, selectedRoleModel]);

  if (loading) {
    return (
      <Layout>
        <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box
        sx={{
          px: { xs: 2, md: 4 },
          py: { xs: 3, md: 4 },
          maxWidth: 1440,
          mx: 'auto',
          backgroundColor: isDarkMode ? 'transparent' : '#FFFFFF',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            width: 280,
            height: 280,
            borderRadius: '50%',
            top: { xs: 10, md: 20 },
            right: { xs: -120, md: -80 },
            background: isDarkMode
              ? 'radial-gradient(circle, rgba(56,189,248,0.22) 0%, rgba(56,189,248,0) 72%)'
              : 'none',
            pointerEvents: 'none',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            width: 260,
            height: 260,
            borderRadius: '50%',
            bottom: 70,
            left: { xs: -120, md: -90 },
            background: isDarkMode
              ? 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, rgba(168,85,247,0) 72%)'
              : 'none',
            pointerEvents: 'none',
          },
        }}
      >
        <Card
          sx={{
            mb: 3,
            borderRadius: 6,
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(148, 163, 184, 0.32)',
            background: 'radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%)',
            color: '#E2E8F0',
            boxShadow: 'none',
          }}
        >
          <Box className="premium-hero-stars-container" aria-hidden>
            <div className="premium-hero-stars" />
            <div className="premium-hero-stars2" />
            <div className="premium-hero-stars3" />
          </Box>

          <CardContent sx={{ p: { xs: 2.5, md: 4 }, position: 'relative', zIndex: 1 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  <Chip
                    icon={<StarIcon />}
                    label="Premium Candidate"
                    sx={{
                      fontWeight: 700,
                      bgcolor: isDarkMode ? 'rgba(148,163,184,0.18)' : 'rgba(255, 248, 230, 0.2)',
                      color: isDarkMode ? '#E2E8F0' : '#FFF7E6',
                      '& .MuiChip-icon': { color: '#F59E0B' },
                    }}
                  />
                  <Chip
                    icon={<TrendingUpIcon />}
                    label={`Profile strength ${profileStrength}%`}
                    sx={{
                      fontWeight: 700,
                      bgcolor: isDarkMode ? 'rgba(148,163,184,0.18)' : 'rgba(255, 248, 230, 0.2)',
                      color: isDarkMode ? '#E2E8F0' : '#FFF7E6',
                      '& .MuiChip-icon': { color: '#F59E0B' },
                    }}
                  />
                </Box>

                <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.08, mb: 1.2 }}>
                  Premium command deck
                </Typography>
                <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 2.4, maxWidth: 760 }}>
                  Hello {user?.name || 'Candidate'}, this space is built for high-intent job hunting with exclusive insights, remote pipelines, and premium tools.
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2 }}>
                  <button className="sparkle-button" style={{ transform: 'scale(0.85)' }} onClick={() => navigate('/dashboard/recommended-jobs?minMatch=50')}>
                    <div className="dots-border"></div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="sparkle-icon">
                      <path className="path" strokeLinejoin="round" strokeLinecap="round" stroke="black" fill="black" d="M14.187 8.096L15 5.25L15.813 8.096C16.0231 8.83114 16.4171 9.50062 16.9577 10.0413C17.4984 10.5819 18.1679 10.9759 18.903 11.186L21.75 12L18.904 12.813C18.1689 13.0231 17.4994 13.4171 16.9587 13.9577C16.4181 14.4984 16.0241 15.1679 15.814 15.903L15 18.75L14.187 15.904C13.9769 15.1689 13.5829 14.4994 13.0423 13.9587C12.5016 13.4181 11.8321 13.0241 11.097 12.814L8.25 12L11.096 11.187C11.8311 10.9769 12.5006 10.5829 13.0413 10.0423C13.5819 9.50162 13.9759 8.83214 14.186 8.097L14.187 8.096Z" />
                      <path className="path" strokeLinejoin="round" strokeLinecap="round" stroke="black" fill="black" d="M6 14.25L5.741 15.285C5.59267 15.8785 5.28579 16.4206 4.85319 16.8532C4.42059 17.2858 3.87853 17.5927 3.285 17.741L2.25 18L3.285 18.259C3.87853 18.4073 4.42059 18.7142 4.85319 19.1468C5.28579 19.5794 5.59267 20.1215 5.741 20.715L6 21.75L6.259 20.715C6.40725 20.1216 6.71398 19.5796 7.14639 19.147C7.5788 18.7144 8.12065 18.4075 8.714 18.259L9.75 18L8.714 17.741C8.12065 17.5925 7.5788 17.2856 7.14639 16.853C6.71398 16.4204 6.40725 15.8784 6.259 15.285L6 14.25Z" />
                      <path className="path" strokeLinejoin="round" strokeLinecap="round" stroke="black" fill="black" d="M6.5 4L6.303 4.5915C6.24777 4.75718 6.15472 4.90774 6.03123 5.03123C5.90774 5.15472 5.75718 5.24777 5.5915 5.303L5 5.5L5.5915 5.697C5.75718 5.75223 5.90774 5.84528 6.03123 5.96877C6.15472 6.09226 6.24777 6.24282 6.303 6.4085L6.5 7L6.697 6.4085C6.75223 6.24282 6.84528 6.09226 6.96877 5.96877C7.09226 5.84528 7.24282 5.75223 7.4085 5.697L8 5.5L7.4085 5.303C7.24282 5.24777 7.09226 5.15472 6.96877 5.03123C6.84528 4.90774 6.75223 4.75718 6.697 4.5915L6.5 4Z" />
                    </svg>
                    <span className="text-button">AI Matched Jobs</span>
                  </button>
                  <Box className="space-btn" sx={{ position: 'relative', display: 'inline-block' }}>
                    <div className="space-container-stars">
                      <div className="space-stars"></div>
                      <div className="space-glow">
                        <div className="space-circle"></div>
                        <div className="space-circle"></div>
                      </div>
                    </div>
                    <Button variant="contained" onClick={() => navigate('/dashboard/remote-jobs')} sx={{ position: 'relative', zIndex: 2, border: 'none', bgcolor: 'transparent', color: '#FFFFFF', fontWeight: 700, '&:hover': { bgcolor: 'transparent' } }}>
                      Remote Hub
                    </Button>
                  </Box>
                  <Box className="space-btn" sx={{ position: 'relative', display: 'inline-block' }}>
                    <div className="space-container-stars">
                      <div className="space-stars"></div>
                      <div className="space-glow">
                        <div className="space-circle"></div>
                        <div className="space-circle"></div>
                      </div>
                    </div>
                    <Button variant="contained" onClick={() => navigate('/dashboard/mock-interviews')} sx={{ position: 'relative', zIndex: 2, border: 'none', bgcolor: 'transparent', color: '#FFFFFF', fontWeight: 700, '&:hover': { bgcolor: 'transparent' } }}>
                      Mock Interview
                    </Button>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    borderRadius: 3,
                    background: 'rgba(10, 15, 28, 0.72)',
                    border: '1px solid rgba(148, 163, 184, 0.22)',
                    backdropFilter: 'blur(14px)',
                    boxShadow: 'inset 0 1px 0 rgba(148,163,184,0.1), 0 8px 24px rgba(2,6,23,0.5)',
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#E2E8F0', mb: 2 }}>
                      Premium communication
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.2 }}>
                      <Typography sx={{ color: '#94A3B8', fontWeight: 600 }}>Unread messages</Typography>
                      <Typography sx={{ color: '#F1F5F9', fontWeight: 800 }}>{unreadMessagesCount}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.2 }}>
                      <Typography sx={{ color: '#94A3B8', fontWeight: 600 }}>Notifications</Typography>
                      <Typography sx={{ color: '#F1F5F9', fontWeight: 800 }}>{notificationsCount}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton onClick={() => navigate(ROUTES.MESSAGING)} sx={{ bgcolor: 'rgba(148,163,184,0.14)', '&:hover': { bgcolor: 'rgba(148,163,184,0.24)' } }}>
                        <Badge badgeContent={unreadMessagesCount} color="warning">
                          <ChatIcon sx={{ color: '#CBD5E1' }} />
                        </Badge>
                      </IconButton>
                      <IconButton onClick={() => navigate(ROUTES.DASHBOARD_NOTIFICATIONS)} sx={{ bgcolor: 'rgba(148,163,184,0.14)', '&:hover': { bgcolor: 'rgba(148,163,184,0.24)' } }}>
                        <Badge badgeContent={notificationsCount} color="error">
                          <NotificationsIcon sx={{ color: '#CBD5E1' }} />
                        </Badge>
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>

                <Menu
                  anchorEl={profileMenuAnchorEl}
                  open={Boolean(profileMenuAnchorEl)}
                  onClose={closeProfileMenu}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                  <MenuItem
                    onClick={() => {
                      closeProfileMenu();
                      navigate(ROUTES.DASHBOARD_PROFILE);
                    }}
                  >
                    Profile
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      closeProfileMenu();
                      navigate(ROUTES.DASHBOARD_SETTINGS);
                    }}
                  >
                    <SettingsIcon sx={{ mr: 1, fontSize: 18 }} />
                    Settings
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      closeProfileMenu();
                      setSupportOpen(true);
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccountCircleIcon sx={{ fontSize: 18 }} />
                      Customer Care
                      {ticketNotifCount > 0 ? (
                        <Box component="span" sx={{ bgcolor: 'error.main', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, ml: 0.5 }}>{ticketNotifCount}</Box>
                      ) : null}
                    </Box>
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleSignout} sx={{ color: 'error.main' }}>
                    <LogoutIcon sx={{ mr: 1, fontSize: 18 }} />
                    Sign out
                  </MenuItem>
                </Menu>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Grid container spacing={2.2} sx={{ mb: 3 }}>
          {stats.map((stat, idx) => (
            <Grid item xs={12} sm={6} md={3} key={stat.label}>
              <MotionCard
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={stat.action}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 4,
                  border: isDarkMode ? '1px solid rgba(148,163,184,0.26)' : `1px solid ${theme.palette.divider}`,
                  background: isDarkMode ? stat.darkBg : stat.lightBg,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: isDarkMode ? '0 12px 28px rgba(2, 6, 23, 0.44)' : '0 12px 28px rgba(15, 23, 42, 0.12)',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: isDarkMode ? '#CBD5E1' : '#334155' }}>
                      {stat.label}
                    </Typography>
                    <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: `${stat.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <stat.icon sx={{ color: stat.color }} />
                    </Box>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: isDarkMode ? '#F8FAFC' : '#0F172A' }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDarkMode ? '#94A3B8' : '#64748B', fontWeight: 600 }}>
                    {stat.subtext}
                  </Typography>
                </CardContent>
              </MotionCard>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 2.2 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            {[
              { label: 'Browse Jobs', to: ROUTES.JOBS, icon: WorkIcon, color: 'primary' as const },
              { label: 'Complete Profile', to: ROUTES.DASHBOARD_PROFILE, icon: AccountCircleIcon, color: 'secondary' as const },
              { label: 'Matched Jobs', to: '/dashboard/recommended-jobs?minMatch=50', icon: TrendingUpIcon, color: 'warning' as const },
              { label: 'Free Notes', to: ROUTES.DASHBOARD_FREE_NOTES, icon: StickyNote2Icon, color: 'success' as const },
            ].map((action, idx) => (
              <Grid item xs={12} sm={6} md={3} key={action.label}>
                <MotionCard
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  sx={{
                    borderRadius: 4,
                    border: isDarkMode ? '1px solid rgba(148,163,184,0.2)' : `1px solid ${theme.palette.divider}`,
                    background: isDarkMode
                      ? 'linear-gradient(150deg, rgba(15,23,42,0.9), rgba(30,41,59,0.9))'
                      : 'linear-gradient(150deg, #ffffff, #f8fafc)',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.2 }}>
                      <action.icon color={action.color} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {action.label}
                      </Typography>
                    </Box>
                    <button
                      className="cta"
                      onClick={() => navigate(action.to)}
                      style={{
                        background: candidateHeroGradient,
                        borderColor: 'rgba(255,255,255,0.2)',
                        boxShadow: '0 10px 22px rgba(2,6,23,0.16)',
                      }}
                    >
                      <span style={{ color: '#FFFFFF' }}>Open&nbsp;</span>
                      <svg viewBox="0 0 13 10" height="10px" width="15px" aria-hidden="true" style={{ stroke: '#FFFFFF' }}>
                        <path d="M1,5 L11,5"></path>
                        <polyline points="8 1 12 5 8 9"></polyline>
                      </svg>
                    </button>
                  </CardContent>
                </MotionCard>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Card
          sx={{
            mb: 3,
            borderRadius: 4,
            border: isDarkMode ? '1px solid rgba(148,163,184,0.2)' : `1px solid ${theme.palette.divider}`,
            background: isDarkMode
              ? 'linear-gradient(138deg, rgba(2,6,23,0.95), rgba(30,41,59,0.95))'
              : 'linear-gradient(140deg, #BFDBFE 0%, #DBEAFE 55%, #EFF6FF 100%)',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.2, mb: 2.2 }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  Premium Intelligence Center
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.4 }}>
                  Live signals based on your activity, recruiter interactions, and match momentum.
                </Typography>
              </Box>
              <Chip icon={<InsightsIcon />} label={`Demand score ${premiumInsights.demandScore}/100`} color={premiumInsights.demandScore >= 70 ? 'success' : 'warning'} sx={{ fontWeight: 700 }} />
            </Box>

            <Grid container spacing={2} sx={{ mb: 2.2 }}>
              <Grid item xs={12} md={4}>
                <Card sx={{ borderRadius: 3, border: isDarkMode ? '1px solid rgba(148,163,184,0.18)' : `1px solid ${theme.palette.divider}`, height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.1 }}>
                      <BoltIcon color="warning" />
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        Weekly velocity
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>
                      {premiumInsights.recentApplications7d}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      applications in last 7 days
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ borderRadius: 3, border: isDarkMode ? '1px solid rgba(148,163,184,0.18)' : `1px solid ${theme.palette.divider}`, height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.1 }}>
                      <TrackChangesIcon color="primary" />
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        Interview pipeline
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>
                      {premiumInsights.interviewPipelineCount}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      active under review or shortlisted
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ borderRadius: 3, border: isDarkMode ? '1px solid rgba(148,163,184,0.18)' : `1px solid ${theme.palette.divider}`, height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.1 }}>
                      Strategic strengths
                    </Typography>
                    <List sx={{ p: 0, display: 'grid', gap: 0.6 }}>
                      {(premiumInsights.strengths.length > 0 ? premiumInsights.strengths : ['Add skills and update profile to unlock stronger signals.']).map((point) => (
                        <ListItem key={point} sx={{ px: 0, py: 0.1 }}>
                          <ListItemText
                            primary={point}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 3, border: isDarkMode ? '1px solid rgba(148,163,184,0.18)' : `1px solid ${theme.palette.divider}` }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.2 }}>
                      Weekly Sprint Tracker
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 700, mb: 1.1 }}>
                      Active model: {selectedRoleModel} ({activeRoleWeights.profileStrength.toFixed(2)} / {activeRoleWeights.applications.toFixed(2)} / {activeRoleWeights.interactions.toFixed(2)} / {activeRoleWeights.skills.toFixed(2)})
                    </Typography>
                    <Box sx={{ display: 'grid', gap: 1.1 }}>
                      {premiumInsights.weeklyGoals.map((goal) => {
                        const progress = Math.min(100, Math.round((goal.current / goal.target) * 100));
                        return (
                          <Box key={goal.label}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.45 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                {goal.label}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                                {goal.current}/{goal.target}
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={progress}
                              sx={{
                                height: 8,
                                borderRadius: 8,
                                bgcolor: isDarkMode ? 'rgba(148,163,184,0.24)' : 'rgba(148,163,184,0.2)',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 8,
                                },
                              }}
                            />
                          </Box>
                        );
                      })}
                    </Box>
                    <Box sx={{ mt: 1.4, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button size="small" variant="outlined" startIcon={<TuneIcon />} onClick={() => navigate(ROUTES.DASHBOARD_SETTINGS_PREMIUM)} sx={{ fontWeight: 700 }}>
                        Customize Intelligence
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 3, border: isDarkMode ? '1px solid rgba(148,163,184,0.18)' : `1px solid ${theme.palette.divider}` }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.2 }}>
                      Opportunity Signals
                    </Typography>
                    <List sx={{ p: 0, display: 'grid', gap: 1 }}>
                      {opportunitySignals.length > 0 ? opportunitySignals.map((signal) => (
                        <ListItem key={signal.title} sx={{ borderRadius: 1.8, border: isDarkMode ? '1px solid rgba(148,163,184,0.2)' : `1px solid ${theme.palette.divider}`, bgcolor: isDarkMode ? 'rgba(15,23,42,0.7)' : '#FFFFFF', px: 1.4, py: 1.1, display: 'block' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.35 }}>
                            {signal.title}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 1 }}>
                            {signal.description}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 1, fontWeight: 600 }}>
                            Priority {signal.priorityScore}
                            {signal.observedAt ? ` • Updated ${formatDate(signal.observedAt)}` : ''}
                          </Typography>
                          <Button
                            size="small"
                            variant="contained"
                            color={signal.tone}
                            onClick={signal.action}
                            className="opportunity-signal-btn"
                            sx={{
                              fontWeight: 700,
                            }}
                          >
                            <span className="opportunity-signal-text">{signal.cta}</span>
                          </Button>
                        </ListItem>
                      )) : (
                        <ListItem sx={{ borderRadius: 1.8, border: isDarkMode ? '1px solid rgba(148,163,184,0.2)' : `1px solid ${theme.palette.divider}`, bgcolor: isDarkMode ? 'rgba(15,23,42,0.7)' : '#FFFFFF', px: 1.4, py: 1.1 }}>
                          <ListItemText
                            primary="No urgent signals"
                            secondary="Your dashboard is stable. Keep applying consistently this week."
                            primaryTypographyProps={{ fontWeight: 700 }}
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card
          sx={{
            mb: 3,
            borderRadius: 4,
            border: isDarkMode ? '1px solid rgba(148,163,184,0.2)' : `1px solid ${theme.palette.divider}`,
            background: isDarkMode
              ? 'linear-gradient(138deg, rgba(2,6,23,0.95), rgba(30,41,59,0.95))'
              : 'linear-gradient(140deg, #BFDBFE 0%, #DBEAFE 55%, #EFF6FF 100%)',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2.6 }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.6 }}>
                  Remote Job Hub
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 660 }}>
                  Premium remote opportunities in one place. Explore remote roles, track remote applications, and jump to high-match options.
                </Typography>
              </Box>
              <Chip label="Remote Focus" color="success" sx={{ fontWeight: 700 }} />
            </Box>

            <Grid container spacing={2}>
              {[
                {
                  title: 'Explore Remote Jobs',
                  description: 'Browse remote roles tailored to your profile.',
                  action: () => navigate('/dashboard/remote-jobs'),
                  icon: PublicIcon,
                },
                {
                  title: 'Remote Applications',
                  description: 'Track remote jobs you already applied to.',
                  action: () => navigate(`${ROUTES.DASHBOARD_APPLICATIONS}?filter=remote`),
                  icon: FlightTakeoffIcon,
                },
                {
                  title: 'Priority Remote Matches',
                  description: 'Open newly matched premium remote opportunities.',
                  action: () => navigate('/dashboard/remote-jobs'),
                  icon: AutoAwesomeIcon,
                },
              ].map((item) => (
                <Grid item xs={12} md={4} key={item.title}>
                  <Card sx={{ borderRadius: 3, height: '100%', border: isDarkMode ? '1px solid rgba(148,163,184,0.18)' : `1px solid ${theme.palette.divider}`, background: isDarkMode ? 'linear-gradient(180deg, rgba(15,23,42,0.9), rgba(30,41,59,0.9))' : '#FFFFFF' }}>
                    <CardContent>
                      <item.icon color="success" sx={{ mb: 1 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.8 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                        {item.description}
                      </Typography>
                      <button
                        className="cta"
                        onClick={item.action}
                        type="button"
                        style={{
                          background: candidateHeroGradient,
                          borderColor: 'rgba(255,255,255,0.2)',
                          boxShadow: '0 10px 22px rgba(2,6,23,0.16)',
                        }}
                      >
                        <span style={{ color: '#FFFFFF' }}>Open&nbsp;</span>
                        <svg viewBox="0 0 13 10" height="10px" width="15px" aria-hidden="true" style={{ stroke: '#FFFFFF' }}>
                          <path d="M1,5 L11,5"></path>
                          <polyline points="8 1 12 5 8 9"></polyline>
                        </svg>
                      </button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        <Card
          sx={{
            borderRadius: 4,
            border: isDarkMode ? '1px solid rgba(148,163,184,0.24)' : `1px solid ${theme.palette.divider}`,
            background: isDarkMode
              ? 'linear-gradient(145deg, rgba(2,6,23,0.96), rgba(15,23,42,0.95))'
              : 'linear-gradient(140deg, #BFDBFE 0%, #DBEAFE 55%, #EFF6FF 100%)',
            mb: 0.6,
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: 2.4 } }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3.2}>
                <Box sx={{ display: 'grid', gap: 1.2, position: { md: 'sticky' }, top: { md: 92 } }}>
                  {[
                    { id: '01', title: 'Exclusive Premium Tools', sub: 'Action studio' },
                    { id: '02', title: 'Recommended Jobs For You', sub: 'AI match feed' },
                    { id: '03', title: 'Quick Preferences', sub: 'Personal controls' },
                  ].map((tab, index) => (
                    <Box
                      key={tab.id}
                      sx={{
                        p: 1.3,
                        borderRadius: 2,
                        border: isDarkMode ? '1px solid rgba(148,163,184,0.3)' : '1px solid rgba(148,163,184,0.28)',
                        background: index === 0
                          ? (isDarkMode ? 'linear-gradient(135deg, rgba(51,65,85,0.85), rgba(15,23,42,0.85))' : 'linear-gradient(140deg, #BFDBFE 0%, #DBEAFE 55%, #EFF6FF 100%)')
                          : (isDarkMode ? 'rgba(15,23,42,0.56)' : 'rgba(248,250,252,0.94)'),
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.08em', color: 'text.secondary' }}>
                        {tab.id}
                      </Typography>
                      <Typography variant="subtitle2" sx={{ mt: 0.4, fontWeight: 800 }}>
                        {tab.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {tab.sub}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Grid>

              <Grid item xs={12} md={8.8}>
                <Box sx={{ display: 'grid', gap: 1.5 }}>
                  <Card sx={{ borderRadius: 3, border: isDarkMode ? '1px solid rgba(148,163,184,0.2)' : '1px solid rgba(203,213,225,0.8)', background: isDarkMode ? 'linear-gradient(138deg, rgba(2,6,23,0.9), rgba(30,41,59,0.88))' : '#FFFFFF' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.4 }}>
                        Exclusive Premium Tools
                      </Typography>
                      <Grid container spacing={1.2}>
                        <Grid item xs={12} sm={6}>
                          <Button fullWidth variant="outlined" startIcon={<VideocamIcon />} sx={{ justifyContent: 'flex-start' }} onClick={() => navigate('/dashboard/mock-interviews')}>
                            Mock Interviews
                          </Button>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Button fullWidth variant="outlined" startIcon={<DescriptionIcon />} sx={{ justifyContent: 'flex-start' }} onClick={() => navigate('/dashboard/resume-review')}>
                            Resume Review
                          </Button>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Button fullWidth variant="outlined" startIcon={<WorkIcon />} sx={{ justifyContent: 'flex-start' }} onClick={() => navigate('/dashboard/priority-apply')}>
                            Priority Apply
                          </Button>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Button fullWidth variant="outlined" startIcon={<ChatIcon />} sx={{ justifyContent: 'flex-start' }} onClick={() => window.open('https://www.ambitionbox.com/interviews?campaign=desktop_nav', '_blank', 'noopener')}>
                            Interview Preparation
                          </Button>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Button fullWidth variant="outlined" startIcon={<StickyNote2Icon />} sx={{ justifyContent: 'flex-start' }} onClick={() => navigate(ROUTES.DASHBOARD_FREE_NOTES)}>
                            Free Notes
                          </Button>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  <Card sx={{ borderRadius: 3, border: isDarkMode ? '1px solid rgba(148,163,184,0.2)' : '1px solid rgba(203,213,225,0.8)', background: isDarkMode ? 'rgba(15,23,42,0.72)' : '#FFFFFF' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1.4 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                          Recommended Jobs For You
                        </Typography>
                        <Button size="small" sx={{ fontWeight: 700 }} onClick={() => navigate('/dashboard/recommended-jobs?minMatch=50')}>
                          View all matches
                        </Button>
                      </Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.4 }}>
                        {userSkills.length > 0 ? `Matched with ${userSkills.slice(0, 4).join(', ')}` : 'Add skills in profile to get recommendations'}
                      </Typography>

                      <List sx={{ p: 0, display: 'grid', gap: 0.9 }}>
                        {recommendedJobs.length > 0 ? (
                          recommendedJobs.slice(0, 4).map((job) => (
                            <ListItem key={job.id} sx={{ px: 1.2, py: 0.8, borderRadius: 1.8, border: isDarkMode ? '1px solid rgba(148,163,184,0.22)' : '1px solid rgba(203,213,225,0.8)', bgcolor: isDarkMode ? 'rgba(2,6,23,0.46)' : 'rgba(248,250,252,0.9)' }}>
                              <ListItemText
                                primary={job.title || 'Role'}
                                secondary={`${job.company_name || 'Company'}${job.location ? ` • ${job.location}` : ''}`}
                                primaryTypographyProps={{ fontWeight: 700 }}
                              />
                              <Button size="small" sx={{ fontWeight: 700 }} onClick={() => navigate(`/jobs/${job.id}`)}>
                                View
                              </Button>
                            </ListItem>
                          ))
                        ) : (
                          <ListItem sx={{ px: 1.2, py: 1, borderRadius: 1.8, border: isDarkMode ? '1px solid rgba(148,163,184,0.22)' : '1px solid rgba(203,213,225,0.8)', bgcolor: isDarkMode ? 'rgba(2,6,23,0.46)' : 'rgba(248,250,252,0.9)' }}>
                            <ListItemText primary="No recommendations yet" secondary="Complete your profile to unlock matches." />
                          </ListItem>
                        )}
                      </List>
                    </CardContent>
                  </Card>

                  <Card sx={{ borderRadius: 3, border: isDarkMode ? '1px solid rgba(148,163,184,0.2)' : '1px solid rgba(203,213,225,0.8)', background: isDarkMode ? 'rgba(15,23,42,0.72)' : '#FFFFFF' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.2 }}>
                        Quick Preferences
                      </Typography>
                      <Grid container spacing={1.2} alignItems="center">
                        <Grid item xs={12} sm={8}>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Theme toggle is available in the navbar for premium candidates.
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Chip
                            label={themeMode === 'dark' ? 'Dark mode active' : 'Light mode active'}
                            color={themeMode === 'dark' ? 'secondary' : 'primary'}
                            variant="outlined"
                            sx={{ fontWeight: 700 }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Button fullWidth variant="outlined" sx={{ fontWeight: 700 }} onClick={() => navigate(ROUTES.DASHBOARD_PROFILE)}>
                            Update profile
                          </Button>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card
          sx={{
            mt: 3,
            borderRadius: 4,
            border: isDarkMode ? '1px solid rgba(148,163,184,0.24)' : '1px solid rgba(180, 122, 20, 0.24)',
            background: isDarkMode
              ? 'linear-gradient(138deg, rgba(2,6,23,0.95), rgba(30,41,59,0.95))'
              : 'linear-gradient(140deg, #BFDBFE 0%, #DBEAFE 55%, #EFF6FF 100%)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: isDarkMode
                ? 'radial-gradient(circle at 90% 12%, rgba(56,189,248,0.12), transparent 35%)'
                : 'radial-gradient(circle at 90% 12%, rgba(245,158,11,0.16), transparent 35%)',
              pointerEvents: 'none',
            },
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
                pb: 1.6,
                borderBottom: isDarkMode ? '1px dashed rgba(148,163,184,0.32)' : '1px dashed rgba(180, 122, 20, 0.35)',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, color: isDarkMode ? '#E2E8F0' : '#000000' }}>
                Recent Applications
              </Typography>
              <Button
                onClick={() => navigate(ROUTES.DASHBOARD_APPLICATIONS)}
                className="opportunity-signal-btn"
                sx={{
                  fontWeight: 700,
                }}
              >
                <span className="opportunity-signal-text">View all ({recentApplications.length})</span>
              </Button>
            </Box>

            <List sx={{ p: 0, display: 'grid', gap: 1.2 }}>
              {recentApplications.length === 0 ? (
                <ListItem
                  sx={{
                    px: 2,
                    py: 2,
                    borderRadius: 2.5,
                    border: isDarkMode ? '1px solid rgba(148,163,184,0.24)' : '1px solid rgba(180, 122, 20, 0.25)',
                    background: isDarkMode
                      ? 'linear-gradient(140deg, rgba(30,41,59,0.75), rgba(15,23,42,0.76))'
                      : '#FFFFFF',
                  }}
                >
                  <ListItemText primary="No applications yet" secondary="Apply to jobs to track your application history." />
                </ListItem>
              ) : (
                recentApplications.slice(0, 3).map((application) => (
                  <ListItem
                    key={application.id}
                    sx={{
                      px: 2,
                      py: 1.6,
                      borderRadius: 2.5,
                      border: isDarkMode ? '1px solid rgba(148,163,184,0.2)' : '1px solid rgba(180, 122, 20, 0.24)',
                      background: isDarkMode
                        ? 'linear-gradient(145deg, rgba(30,41,59,0.8), rgba(15,23,42,0.84))'
                        : '#FFFFFF',
                      alignItems: 'flex-start',
                      gap: 1.4,
                    }}
                  >
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        mt: 1,
                        bgcolor:
                          application.status === 'shortlisted'
                            ? '#22C55E'
                            : application.status === 'under_review'
                            ? '#F59E0B'
                            : application.status === 'rejected'
                            ? '#EF4444'
                            : application.status === 'accepted'
                            ? '#3B82F6'
                            : isDarkMode
                            ? '#94A3B8'
                            : '#B7791F',
                        boxShadow: '0 0 0 4px rgba(148,163,184,0.12)',
                        flexShrink: 0,
                      }}
                    />

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDarkMode ? '#F8FAFC' : '#000000', lineHeight: 1.2 }}>
                        {application.jobs?.title || 'Unknown role'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: isDarkMode ? '#CBD5E1' : '#000000', fontWeight: 600, mt: 0.35 }}>
                        {application.jobs?.company_name || 'Unknown company'}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: isDarkMode ? '#94A3B8' : '#000000', mt: 0.55 }}>
                        {application.jobs?.location || 'Location not specified'}
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: 'right', minWidth: 128 }}>
                      <Chip
                        label={(application.status || 'applied').replace('_', ' ').toUpperCase()}
                        size="small"
                        color={
                          application.status === 'shortlisted'
                            ? 'success'
                            : application.status === 'under_review'
                            ? 'warning'
                            : application.status === 'rejected'
                            ? 'error'
                            : application.status === 'accepted'
                            ? 'primary'
                            : 'default'
                        }
                        sx={{ fontWeight: 700 }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          color: isDarkMode ? '#94A3B8' : '#000000',
                          mt: 0.75,
                          fontWeight: 600,
                        }}
                      >
                        {application.applied_at ? formatDate(application.applied_at) : 'Date unavailable'}
                      </Typography>
                    </Box>
                  </ListItem>
                ))
              )}
            </List>
          </CardContent>
        </Card>

        <SupportWidget
          audience="candidate"
          showFab={false}
          open={supportOpen}
          onClose={() => setSupportOpen(false)}
        />

        <Dialog
          open={interactionModalOpen}
          onClose={() => setInteractionModalOpen(false)}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: 3,
              border: isDarkMode ? '1px solid rgba(148,163,184,0.24)' : '1px solid rgba(180,122,20,0.25)',
              overflow: 'hidden',
            },
          }}
        >
          <DialogTitle
            sx={{
              pb: 1.4,
              borderBottom: isDarkMode ? '1px solid rgba(148,163,184,0.2)' : '1px solid rgba(180,122,20,0.2)',
              background: isDarkMode
                ? 'linear-gradient(140deg, rgba(15,23,42,0.98), rgba(30,41,59,0.95))'
                : 'linear-gradient(140deg, #FFF9EA, #FFEDC7)',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.1 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.8,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: interactionType === 'downloads'
                      ? (isDarkMode ? 'rgba(34,197,94,0.18)' : 'rgba(22,163,74,0.14)')
                      : (isDarkMode ? 'rgba(59,130,246,0.2)' : 'rgba(37,99,235,0.14)'),
                  }}
                >
                  {interactionType === 'downloads' ? (
                    <VideocamIcon sx={{ fontSize: 20, color: interactionType === 'downloads' ? '#16A34A' : '#2563EB' }} />
                  ) : (
                    <VisibilityIcon sx={{ fontSize: 20, color: '#2563EB' }} />
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                    {interactionModalTitle}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    {interactionType === 'downloads' ? 'Resume engagement analytics' : 'Profile visibility analytics'}
                  </Typography>
                </Box>
              </Box>
              <Chip
                size="small"
                label={`${interactionItems.length} recruiters`}
                sx={{
                  fontWeight: 700,
                  bgcolor: isDarkMode ? 'rgba(148,163,184,0.18)' : 'rgba(255,255,255,0.72)',
                }}
              />
            </Box>
          </DialogTitle>
          <DialogContent
            dividers
            sx={{
              background: isDarkMode
                ? 'linear-gradient(160deg, rgba(15,23,42,0.98), rgba(2,6,23,0.98))'
                : 'linear-gradient(160deg, #FFFCF4, #FFF7E7)',
              borderTop: 'none',
            }}
          >
            {interactionLoading ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', py: 1 }}>
                Loading recruiters...
              </Typography>
            ) : interactionItems.length === 0 ? (
              <Box
                sx={{
                  borderRadius: 2,
                  border: isDarkMode ? '1px solid rgba(148,163,184,0.22)' : '1px solid rgba(180,122,20,0.2)',
                  p: 2,
                  background: isDarkMode ? 'rgba(30,41,59,0.56)' : 'rgba(255,255,255,0.8)',
                }}
              >
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No recruiter interactions found yet.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'grid', gap: 1.2 }}>
                {interactionItems.map((item, index) => (
                  <Card
                    key={item.recruiter_id || index}
                    sx={{
                      p: 1.6,
                      borderRadius: 2,
                      border: isDarkMode ? '1px solid rgba(148,163,184,0.22)' : '1px solid rgba(180,122,20,0.22)',
                      background: isDarkMode
                        ? 'linear-gradient(150deg, rgba(30,41,59,0.88), rgba(15,23,42,0.86))'
                        : 'linear-gradient(150deg, rgba(255,255,255,0.94), rgba(255,248,232,0.96))',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                          {item.recruiter_name || 'Recruiter'}
                        </Typography>
                        {item.company_name ? (
                          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.2 }}>
                            {item.company_name}
                          </Typography>
                        ) : null}
                      </Box>
                      <Chip
                        size="small"
                        label={item.total_unlocks != null ? `${item.total_unlocks} downloads` : `${item.total_views || 0} views`}
                        color={interactionType === 'downloads' ? 'success' : 'primary'}
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>

                    <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block', fontWeight: 600 }}>
                      Last activity: {item.last_unlocked_at || item.last_viewed_at ? formatDate(item.last_unlocked_at || item.last_viewed_at) : 'Recent'}
                    </Typography>
                  </Card>
                ))}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 2.2, py: 1.5, borderTop: isDarkMode ? '1px solid rgba(148,163,184,0.2)' : '1px solid rgba(180,122,20,0.2)' }}>
            <Button onClick={() => setInteractionModalOpen(false)} sx={{ fontWeight: 700 }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default PremiumDashboard;
