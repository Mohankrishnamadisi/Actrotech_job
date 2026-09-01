import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  ButtonBase,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Drawer,
  Grid,
  IconButton,
  LinearProgress,
  List,
  Menu,
  MenuItem,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  ArrowForward as ArrowForwardIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  AttachMoney as AttachMoneyIcon,
  AutoAwesome as AutoAwesomeIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  ChatBubbleOutline as ChatIcon,
  CheckCircle as CheckCircleIcon,
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  Download as DownloadIcon,
  EventAvailable as EventAvailableIcon,
  FolderOpen as FolderOpenIcon,
  LocationOn as LocationOnIcon,
  Login as LogoutIcon,
  Notifications as NotificationsIcon,
  PeopleAlt as PeopleAltIcon,
  Person as PersonIcon,
  Quiz as QuizIcon,
  RateReview as RateReviewIcon,
  Schedule as ScheduleIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  SettingsSuggest as SettingsSuggestIcon,
  SmartToy as SmartToyIcon,
  SupportAgent as SupportAgentIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  Verified as VerifiedIcon,
  VideoCameraBack as VideocamIcon,
  Visibility as VisibilityIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';

import { Layout } from '@components/layout/Layout';
import '../../styles/dashboardFixedNav.css';
import SupportWidget from '@components/common/SupportWidget';
import { ROUTES } from '@constants/index';
import { useSubscription } from '@hooks/index';
import { useAuthStore } from '@store/index';
import { authService } from '@services/supabase';
import { applicationService, jobService, notificationService, savedService, userService, recruiterService } from '@services/api';
import { messagingService } from '@services/messaging';
import Swal from '@utils/sweetAlert';
import { formatDate } from '@utils/index';
import { getPlanDisplayName, isCandidatePremium, isSubscriptionActive } from '@utils/candidateSubscriptionHelpers';
import {
  getCandidateProfileViewCount,
  getCandidateProfileViewRecruiters,
  getCandidateResumeUnlockCount,
  getCandidateResumeUnlockRecruiters,
} from '@utils/resumeUnlocks';

type RecentApplication = {
  id: string;
  status: string;
  applied_at?: string;
  jobs?: {
    title?: string;
    company_name?: string;
    location?: string;
  };
};

type SavedJobItem = {
  id: string;
  job_id?: string;
  created_at?: string;
  jobs?: {
    id?: string;
    title?: string;
    company_name?: string;
    location?: string;
  };
};


const calculateProfileStrength = (profile: any, user: any): number => {
  const checks = [
    profile?.name || user?.name,
    profile?.email || user?.email,
    profile?.phone,
    profile?.bio,
    profile?.experience,
    profile?.resume_url || profile?.resumeUrl,
    Array.isArray(profile?.skills) && profile.skills.length > 0,
    Array.isArray(profile?.education_details || profile?.education)
      && (profile?.education_details || profile?.education).length > 0,
    Array.isArray(profile?.work_experience || profile?.workExperience)
      && (profile?.work_experience || profile?.workExperience).length > 0,
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
};

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { subscription } = useSubscription(user?.id || null);
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [profileMenuAnchorEl, setProfileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);

  const [profile, setProfile] = useState<any | null>(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJobItem[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [resumeDownloadCount, setResumeDownloadCount] = useState<number | null>(null);
  const [profileViewCount, setProfileViewCount] = useState<number | null>(null);
  const [profileViewRecruiters, setProfileViewRecruiters] = useState<any[]>([]);
  const [resumeUnlockRecruiters, setResumeUnlockRecruiters] = useState<any[]>([]);
  const [selectedRecruiterInsight, setSelectedRecruiterInsight] = useState<any | null>(null);
  const [selectedRecruiterProfile, setSelectedRecruiterProfile] = useState<any | null>(null);
  const [selectedRecruiterJobs, setSelectedRecruiterJobs] = useState<any[] | null>(null);
  const [recruiterModalOpen, setRecruiterModalOpen] = useState(false);
  const [recruiterDetailsLoading, setRecruiterDetailsLoading] = useState(false);
  const [activeRecruiterFilter, setActiveRecruiterFilter] = useState<'all' | 'views' | 'resume'>('all');
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [recommendedLoading, setRecommendedLoading] = useState(false);
  const [savingJobId, setSavingJobId] = useState<string | null>(null);

  const sidebarItems = useMemo(
    () => [
      { label: 'Dashboard', icon: DashboardIcon, to: ROUTES.DASHBOARD, active: true },
      { label: 'Notifications', icon: NotificationsIcon, to: ROUTES.DASHBOARD_NOTIFICATIONS, badge: notificationsCount },
      { label: 'Chat', icon: ChatIcon, to: ROUTES.MESSAGING, badge: unreadMessagesCount },
      { label: 'Jobs', icon: WorkIcon, to: ROUTES.JOBS },
      { label: 'Applications', icon: AssignmentTurnedInIcon, to: ROUTES.DASHBOARD_APPLICATIONS },
      { label: 'Saved Jobs', icon: BookmarkIcon, to: ROUTES.DASHBOARD_SAVED_JOBS },
      { label: 'Assessments', icon: QuizIcon, to: ROUTES.DASHBOARD_ASSESSMENTS },
      { label: 'Learning', icon: QuizIcon, to: ROUTES.DASHBOARD_LEARNING },
      { label: 'Interview Invites', icon: EventAvailableIcon, to: ROUTES.DASHBOARD_APPLICATIONS },
      { label: 'Referrals', icon: PeopleAltIcon, to: ROUTES.DASHBOARD_REFERRALS },
    ],
    [notificationsCount, unreadMessagesCount],
  );

  const profileItems = useMemo(
    () => [
      { label: 'My Profile', icon: PersonIcon, to: ROUTES.DASHBOARD_PROFILE },
      { label: 'Resume Builder', icon: DescriptionIcon, to: '/dashboard/resume-review' },
      { label: 'Skill Test', icon: QuizIcon, to: ROUTES.DASHBOARD_ASSESSMENTS },
      { label: 'Certificates', icon: VerifiedIcon, to: ROUTES.DASHBOARD_PROFILE },
      { label: 'Portfolio', icon: FolderOpenIcon, to: ROUTES.DASHBOARD_PROFILE },
      { label: 'Career Preferences', icon: SettingsSuggestIcon, to: ROUTES.DASHBOARD_SETTINGS },
    ],
    [],
  );

  const toolsItems = useMemo(
    () => [
      { label: 'AI Career Coach', icon: SmartToyIcon, to: ROUTES.DASHBOARD_AI_CAREER_HUB },
      { label: 'Mock Interview', icon: VideocamIcon, to: '/dashboard/mock-interviews' },
      { label: 'Resume Review', icon: RateReviewIcon, to: '/dashboard/resume-review' },
      { label: 'Job Tracker', icon: TimelineIcon, to: ROUTES.DASHBOARD_APPLICATIONS },
    ],
    [],
  );

  const otherItems = useMemo(
    () => [
      { label: 'Settings', icon: SettingsIcon, to: ROUTES.DASHBOARD_SETTINGS },
      { label: 'Help & Support', icon: SupportAgentIcon, to: ROUTES.DASHBOARD_SETTINGS },
      { label: 'Logout', icon: LogoutIcon, to: '#', action: 'logout' },
    ],
    [],
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

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

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;

      try {
        const result = await userService.getProfile(user.id);
        setProfile(result || null);
        setProfileCompletion(calculateProfileStrength(result, user));
      } catch (error) {
        console.error('Failed to load candidate profile:', error);
      }
    };

    loadProfile();
  }, [user?.id, user?.name, user?.email]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) return;

      try {
        const [applications, saved, notifications, conversations] = await Promise.all([
          applicationService.getUserApplications(user.id),
          savedService.getUserSavedJobs(user.id),
          notificationService.getUnreadNotifications(user.id),
          messagingService.getConversations(user.id),
        ]);

        setRecentApplications(applications || []);
        setSavedJobs(saved || []);
        setSavedCount((saved || []).length);
        setNotificationsCount((notifications || []).length);
        setUnreadMessagesCount(
          (((conversations as any[]) || []).reduce((count, conv) => count + (conv.unreadCount || 0), 0)),
        );

        const [downloads, views, profileViewRecruiterRows, resumeUnlockRecruiterRows] = await Promise.all([
          getCandidateResumeUnlockCount(user.id),
          getCandidateProfileViewCount(user.id),
          getCandidateProfileViewRecruiters(user.id),
          getCandidateResumeUnlockRecruiters(user.id),
        ]);

        setResumeDownloadCount(downloads);
        setProfileViewCount(views);
        setProfileViewRecruiters(profileViewRecruiterRows || []);
        setResumeUnlockRecruiters(resumeUnlockRecruiterRows || []);
        setSelectedRecruiterInsight(null);

        const skills = Array.isArray(profile?.skills) ? profile.skills : [];
        if (skills.length > 0) {
          setRecommendedLoading(true);
          const response = await jobService.getJobsBySkills(skills, 1, 4);
          setRecommendedJobs(Array.isArray(response?.data) ? response.data : []);
        } else {
          const fallback = await jobService.getJobs({}, 1, 4).catch(() => ({ data: [] }));
          setRecommendedJobs(Array.isArray(fallback?.data) ? fallback.data : []);
        }
      } catch (error) {
        console.error('Failed to load candidate dashboard data:', error);
      } finally {
        setRecommendedLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.id, profile?.skills]);

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

  const stats = useMemo(
    () => [
      { label: 'Applications', value: recentApplications.length || 0, hint: '↑ 3 this week', icon: WorkIcon, color: '#2563EB', bg: 'linear-gradient(135deg, rgba(219,234,254,0.86), rgba(239,246,255,0.96))' },
      { label: 'Saved Jobs', value: savedCount || 0, hint: '↑ 2 this week', icon: BookmarkIcon, color: '#059669', bg: 'linear-gradient(135deg, rgba(209,250,229,0.9), rgba(236,253,245,0.96))' },
      { label: 'Resume Downloads', value: resumeDownloadCount ?? 0, hint: '↑ 1 this week', icon: DownloadIcon, color: '#7C3AED', bg: 'linear-gradient(135deg, rgba(233,213,255,0.9), rgba(245,243,255,0.96))' },
      { label: 'Profile Views', value: profileViewCount ?? 0, hint: '↑ 4 this week', icon: VisibilityIcon, color: '#EA580C', bg: 'linear-gradient(135deg, rgba(254,215,170,0.9), rgba(255,247,237,0.96))' },
      { label: 'Recruiter Actions', value: Math.max(0, (profileViewCount ?? 0) + (resumeDownloadCount ?? 0)), hint: 'Live now', icon: TrendingUpIcon, color: '#EC4899', bg: 'linear-gradient(135deg, rgba(252,231,243,0.9), rgba(253,242,248,0.96))' },
    ],
    [profileViewCount, recentApplications.length, resumeDownloadCount, savedCount],
  );

  /** Real timeline built from recruiter signals, applications and saved jobs. */
  const activityItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      subtitle: string;
      timestamp: number;
      status: string;
      icon: typeof VisibilityIcon;
      tone: 'primary' | 'success' | 'warning' | 'info';
      to?: string;
    }> = [];

    (profileViewRecruiters || []).forEach((item: any) => {
      items.push({
        id: `view-${item.recruiter_id}`,
        title: 'Recruiter viewed your profile',
        subtitle: `${item.company_name || item.recruiter_name || 'A recruiter'}${item.total_views > 1 ? ` · ${item.total_views} views` : ''}`,
        timestamp: new Date(item.last_viewed_at || 0).getTime(),
        status: 'Viewed',
        icon: VisibilityIcon,
        tone: 'primary',
      });
    });

    (resumeUnlockRecruiters || []).forEach((item: any) => {
      items.push({
        id: `unlock-${item.recruiter_id}`,
        title: 'Resume downloaded',
        subtitle: `${item.company_name || item.recruiter_name || 'A recruiter'} accessed your resume`,
        timestamp: new Date(item.last_unlocked_at || 0).getTime(),
        status: 'Resume',
        icon: DownloadIcon,
        tone: 'info',
      });
    });

    (recentApplications || []).forEach((application: any) => {
      const status = String(application.status || 'applied').toLowerCase();
      const isPositive = ['shortlisted', 'interview', 'selected', 'offer', 'hired'].includes(status);
      items.push({
        id: `app-${application.id}`,
        title: isPositive ? `Application ${status}` : `Applied to ${application.jobs?.title || 'a job'}`,
        subtitle: [application.jobs?.company_name, application.jobs?.title].filter(Boolean).join(' · ') || 'Job application',
        timestamp: new Date(application.applied_at || 0).getTime(),
        status: status.charAt(0).toUpperCase() + status.slice(1),
        icon: isPositive ? AssignmentTurnedInIcon : WorkIcon,
        tone: isPositive ? 'success' : 'warning',
        to: ROUTES.DASHBOARD_APPLICATIONS,
      });
    });

    (savedJobs || []).slice(0, 4).forEach((item: any) => {
      items.push({
        id: `saved-${item.id}`,
        title: `Saved ${item.jobs?.title || 'a job'}`,
        subtitle: item.jobs?.company_name || 'Saved for later',
        timestamp: new Date(item.created_at || 0).getTime(),
        status: 'Saved',
        icon: BookmarkIcon,
        tone: 'success',
        to: ROUTES.DASHBOARD_SAVED_JOBS,
      });
    });

    return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 6);
  }, [profileViewRecruiters, resumeUnlockRecruiters, recentApplications, savedJobs]);

  const recruiterActionCount = Math.max(0, (profileViewCount ?? 0) + (resumeDownloadCount ?? 0));
  const searchAppearanceCount = Math.max(0, profileViewCount ?? 0);

  const recruiterInsightFeed = useMemo(() => {
    const feed = [
      ...(profileViewRecruiters || []).map((item: any) => ({
        id: `view-${item.recruiter_id}`,
        recruiterId: String(item.recruiter_id || ''),
        company: item.company_name || item.recruiter_name || 'Company',
        recruiter: item.recruiter_name || 'Recruiter',
        logo: item.company_logo_url || item.logo_url || '',
        action: 'Viewed your profile',
        type: 'views' as const,
        count: item.total_views || 1,
        timestamp: item.last_viewed_at || null,
      })),
      ...(resumeUnlockRecruiters || []).map((item: any) => ({
        id: `unlock-${item.recruiter_id}`,
        recruiterId: String(item.recruiter_id || ''),
        company: item.company_name || item.recruiter_name || 'Company',
        recruiter: item.recruiter_name || 'Recruiter',
        logo: item.company_logo_url || item.logo_url || '',
        action: 'Downloaded your resume',
        type: 'resume' as const,
        count: item.total_unlocks || 1,
        timestamp: item.last_unlocked_at || null,
      })),
    ];

    return feed.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
  }, [profileViewRecruiters, resumeUnlockRecruiters]);

  const visibleRecruiterInsights = useMemo(() => {
    if (activeRecruiterFilter === 'all') return recruiterInsightFeed.slice(0, 9);
    return recruiterInsightFeed.filter((item) => item.type === activeRecruiterFilter).slice(0, 9);
  }, [activeRecruiterFilter, recruiterInsightFeed]);

  const recruiterViewCount = useMemo(
    () => recruiterInsightFeed.filter((item) => item.type === 'views').reduce((sum, item) => sum + item.count, 0),
    [recruiterInsightFeed]
  );

  const recruiterResumeCount = useMemo(
    () => recruiterInsightFeed.filter((item) => item.type === 'resume').reduce((sum, item) => sum + item.count, 0),
    [recruiterInsightFeed]
  );

  const companiesEngagedCount = useMemo(
    () => new Set(recruiterInsightFeed.map((item) => item.company.toLowerCase())).size,
    [recruiterInsightFeed]
  );

  const savedJobIds = useMemo(
    () => new Set((savedJobs || []).map((item: any) => String(item.job_id || item.jobs?.id || '')).filter(Boolean)),
    [savedJobs]
  );

  const handleToggleSaveJob = React.useCallback(
    async (job: any) => {
      if (!user?.id || !job?.id) return;
      const jobId = String(job.id);
      const wasSaved = savedJobIds.has(jobId);

      setSavingJobId(jobId);
      try {
        if (wasSaved) {
          await savedService.unsaveJob(user.id, jobId);
          setSavedJobs((prev) => prev.filter((item: any) => String(item.job_id || item.jobs?.id || '') !== jobId));
        } else {
          await savedService.saveJob(user.id, jobId);
          setSavedJobs((prev) => [
            { id: `saved-${jobId}`, job_id: jobId, jobs: job, created_at: new Date().toISOString() } as SavedJobItem,
            ...prev,
          ]);
        }
        void Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: wasSaved ? 'Removed from saved jobs' : 'Job saved',
          showConfirmButton: false,
          timer: 1600,
        });
      } catch {
        void Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Could not update saved jobs',
          showConfirmButton: false,
          timer: 2000,
        });
      } finally {
        setSavingJobId(null);
      }
    },
    [user?.id, savedJobIds]
  );

  // Details are fetched on demand so the dialog never opens by itself
  const openRecruiterInsight = React.useCallback(async (insight: any) => {
    setSelectedRecruiterInsight(insight);
    setSelectedRecruiterProfile(null);
    setSelectedRecruiterJobs(null);
    setRecruiterModalOpen(true);

    const recruiterId = insight?.recruiterId;
    if (!recruiterId) return;

    setRecruiterDetailsLoading(true);
    try {
      const [profile, jobs] = await Promise.all([
        recruiterService.getRecruiterProfile(recruiterId).catch(() => null),
        jobService.getRecruiterJobs(recruiterId).catch(() => []),
      ]);
      setSelectedRecruiterProfile(profile);
      setSelectedRecruiterJobs(jobs || []);
    } finally {
      setRecruiterDetailsLoading(false);
    }
  }, []);

  const pipeline = [
    { label: 'Applied', value: recentApplications.length || 0 },
    { label: 'Screening', value: Math.max(0, Math.round((recentApplications.length || 0) * 0.34)) },
    { label: 'Interview', value: Math.max(0, Math.round((recentApplications.length || 0) * 0.18)) },
    { label: 'Offer', value: Math.max(0, Math.round((recentApplications.length || 0) * 0.08)) },
    { label: 'Joined', value: 0 },
  ];

  const profileCompletionBreakdown = [
    { label: 'Resume', value: Math.min(100, Math.max(60, profileCompletion)), color: '#2563EB' },
    { label: 'Skills', value: Math.min(100, Math.max(55, profileCompletion - 8)), color: '#7C3AED' },
    { label: 'Experience', value: Math.min(100, Math.max(50, profileCompletion + 2)), color: '#06B6D4' },
    { label: 'Projects', value: Math.min(100, Math.max(42, profileCompletion - 18)), color: '#F59E0B' },
    { label: 'Education', value: Math.min(100, Math.max(58, profileCompletion - 5)), color: '#22C55E' },
  ];

  const navBadge = (count: number) => count > 0 ? <Box component="span" sx={{ ml: 'auto', minWidth: 22, height: 22, borderRadius: 999, bgcolor: '#dbeafe', color: '#1d4ed8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>{count}</Box> : null;

  const heroScore = Math.min(99, Math.max(35, profileCompletion || 0));
  const profileAvatarUrl = profile?.avatar_url || profile?.profile_image_url || profile?.avatarUrl || profile?.image || profile?.photo || (user as any)?.avatar || (user as any)?.user_metadata?.avatar_url || '';

  const coachRecommendations = useMemo(() => {
    const items: string[] = [];

    if (!profile?.resume_url && !profile?.resumeUrl) items.push('Upload your latest resume');
    if (!Array.isArray(profile?.skills) || profile.skills.length < 3) items.push('Add core skills that match your target jobs');
    if (!profile?.experience && !profile?.work_experience && !profile?.workExperience) items.push('Add your work experience timeline');
    if (!profile?.bio) items.push('Write a stronger professional summary');
    if (!profile?.location) items.push('Add your preferred location');

    return items.length > 0 ? items.slice(0, 4) : ['Your profile is strong. Keep refining your skills and résumé.'];
  }, [profile]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;

    const footerElement = document.querySelector('footer');
    if (!footerElement) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { threshold: 0.05 }
    );

    observer.observe(footerElement);

    return () => observer.disconnect();
  }, []);

  const renderSidebar = ({ drawerMode = false } = {}) => (
    <Box
      component="nav"
      className={!drawerMode ? 'dash-nav__cont' : undefined}
      aria-label="Dashboard navigation"
      onMouseEnter={!drawerMode ? () => document.body.classList.add('nav-expanded') : undefined}
      onMouseLeave={!drawerMode ? () => document.body.classList.remove('nav-expanded') : undefined}
      sx={drawerMode ? { position: 'relative', width: '100%' } : undefined}
    >
      <Box className="dash-nav-inner">
      <Box
        className="dash-nav-scroll"
        sx={{
          width: '100%',
          minWidth: 0,
          background: 'transparent',
          borderRadius: { xs: 0, lg: '20px' },
          boxShadow: 'none',
          p: { xs: 0, lg: 2 },
          position: 'relative',
          top: 0,
          height: '100%',
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          border: { xs: 'none', lg: '1px solid rgba(148,163,184,0.12)' },
        }}
      >
      <Box sx={{ px: 2.2 }}>
        <Stack spacing={0.8}>
          {sidebarItems.map(({ label, icon: Icon, to, active, badge }) => (
            <Button
              key={label}
              component={RouterLink}
              to={to}
              startIcon={<Icon fontSize="small" />}
              className="dash-nav-button"
              sx={{
                justifyContent: 'flex-start',
                gap: 1.3,
                borderRadius: 3,
                px: 1.2,
                py: 1.1,
                color: active ? '#1d4ed8' : '#1e293b',
                background: active ? 'linear-gradient(90deg, rgba(37,99,235,0.14), rgba(191,219,254,0.2))' : 'transparent',
                fontWeight: active ? 800 : 700,
                textTransform: 'none',
                minHeight: 46,
                boxShadow: active ? 'inset 0 0 0 1px rgba(37,99,235,0.08)' : 'none',
                '&:hover': { background: active ? 'linear-gradient(90deg, rgba(37,99,235,0.14), rgba(191,219,254,0.2))' : '#f8fafc' },
              }}
            >
              <span className="sidebar-button-label">{label}</span>
              {typeof badge === 'number' && badge > 0 && navBadge(badge)}
              {label === 'Jobs' && !badge && navBadge(3)}
            </Button>
          ))}
        </Stack>
      </Box>

      <Box sx={{ px: 2.2, mt: 1 }}>
        <Stack spacing={0.8}>
          {profileItems.map(({ label, icon: Icon, to }) => (
            <Button key={label} className="dash-nav-button" component={RouterLink} to={to} startIcon={<Icon fontSize="small" />} sx={{ justifyContent: 'flex-start', gap: 1.3, borderRadius: 3, px: 1.2, py: 1.1, color: '#1e293b', fontWeight: 700, textTransform: 'none', minHeight: 46, '&:hover': { background: '#f8fafc' } }}>
              <span className="sidebar-button-label">{label}</span>
            </Button>
          ))}
        </Stack>
      </Box>

      <Box sx={{ px: 2.2, mt: 1 }}>
        <Stack spacing={0.8}>
          {toolsItems.map(({ label, icon: Icon, to }) => (
            <Button key={label} className="dash-nav-button" component={RouterLink} to={to} startIcon={<Icon fontSize="small" />} sx={{ justifyContent: 'flex-start', gap: 1.3, borderRadius: 3, px: 1.2, py: 1.1, color: '#1e293b', fontWeight: 700, textTransform: 'none', minHeight: 46, '&:hover': { background: '#f8fafc' } }}>
              <span className="sidebar-button-label">{label}</span>
            </Button>
          ))}
        </Stack>
      </Box>

      <Box sx={{ px: 2.2, mt: 'auto' }}>
        <Stack spacing={0.8}>
          {otherItems.map(({ label, icon: Icon, to, action }) => (
            <Button
              key={label}
              className="dash-nav-button"
              component={action === 'logout' ? 'button' : RouterLink}
              to={action === 'logout' ? undefined : to}
              onClick={action === 'logout' ? handleSignout : undefined}
              startIcon={<Icon fontSize="small" />}
              sx={{ justifyContent: 'flex-start', gap: 1.3, borderRadius: 3, px: 1.2, py: 1.1, color: '#1e293b', fontWeight: 700, textTransform: 'none', minHeight: 46, '&:hover': { background: '#f8fafc' } }}
            >
              <span className="sidebar-button-label">{label}</span>
            </Button>
          ))}
        </Stack>
      </Box>
      </Box>
      </Box>
    </Box>
  );

  return (
    <Layout>
      <Box className={footerVisible ? 'dashboard-page candidate-dashboard footer-visible' : 'dashboard-page candidate-dashboard'} sx={{ background: 'radial-gradient(circle at top left, rgba(59,130,246,0.08), transparent 28%), radial-gradient(circle at top right, rgba(124,58,237,0.08), transparent 26%), #F6F8FC', minHeight: '100vh', px: { xs: 1.5, md: 2.5 }, py: { xs: 2, md: 3 } }}>
        <Drawer anchor="left" open={mobileNavOpen} onClose={() => setMobileNavOpen(false)}>
          <Box sx={{ width: 280, height: '100%', background: '#fff' }}>{renderSidebar({ drawerMode: true })}</Box>
        </Drawer>

        {!isMobile && renderSidebar()}

        <Box className="dashboard-content">
          <Box sx={{ width: '100%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'stretch' }}>
            <Box sx={{ width: '100%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: 'easeOut' }}>
                <Card sx={{ position: 'relative', overflow: 'hidden', borderRadius: 4.5, background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 34%, #4f46e5 66%, #7c3aed 100%)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 32px 60px rgba(79,70,229,0.24)' }}>
                  <Box sx={{ position: 'absolute', width: 280, height: 280, right: -60, top: -80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.08) 35%, transparent 70%)' }} />
                  <Box sx={{ position: 'absolute', width: 210, height: 210, left: -30, bottom: -56, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.28) 0%, rgba(96,165,250,0.1) 35%, transparent 70%)' }} />

                  <CardContent sx={{ position: 'relative', py: { xs: 1.8, md: 2.6 }, px: { xs: 1.8, md: 4 }, zIndex: 2 }}>
                    <Grid container spacing={2.8} alignItems="center">
                      <Grid item xs={12} md={8}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.7, mb: 2.1 }}>
                          <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}>
                            <Avatar src={profileAvatarUrl || undefined} imgProps={{ referrerPolicy: 'no-referrer' }} sx={{ width: { xs: 68, md: 80 }, height: { xs: 68, md: 80 }, bgcolor: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.5)', boxShadow: '0 10px 24px rgba(15,23,42,0.22)', fontWeight: 800, fontSize: 28 }}>
                              {(user?.name || 'U').charAt(0).toUpperCase()}
                            </Avatar>
                          </motion.div>
                          <Box>
                            <Chip 
                              label={isCandidatePremium(subscription?.plan) && isSubscriptionActive(subscription?.end_date) ? `Premium • ${getPlanDisplayName(subscription?.plan)}` : 'Free'} 
                              size="small" 
                              sx={{ mb: 0.55, height: 24, bgcolor: 'rgba(255,255,255,0.12)', color: '#fff', borderRadius: 999, fontWeight: 700, border: '1px solid rgba(255,255,255,0.18)' }} 
                            />
                            <Typography sx={{ color: '#fff', fontWeight: 800, lineHeight: 1.12, fontSize: { xs: 21, md: 24 } }}>
                              {getGreeting()}, {user?.name || 'Candidate'} 👋
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.78)', mt: 0.45, fontSize: 13 }}>
                              {(profile?.current_designation || profile?.currentDesignation || 'Professional')} • {(profile?.experience || 'Experience not added')} • {(profile?.location || 'Location not added')}
                            </Typography>
                          </Box>
                        </Box>

                        <Grid container spacing={1.4} sx={{ mb: 1.8 }}>
                          <Grid item xs={12} sm={7}>
                            <Box sx={{ height: '100%', boxSizing: 'border-box', p: 1.35, borderRadius: 2.4, bgcolor: 'rgba(15,23,42,0.16)', border: '1px solid rgba(255,255,255,0.12)' }}>
                              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 14, mb: 0.4 }}>Profile momentum</Typography>
                              <Typography sx={{ color: 'rgba(255,255,255,0.76)', fontSize: 12, mb: 1.2 }}>Complete your profile to unlock better job opportunities.</Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.1 }}>
                                <LinearProgress variant="determinate" value={Math.min(100, profileCompletion)} sx={{ flex: 1, height: 7, borderRadius: 999, background: 'rgba(255,255,255,0.16)', '& .MuiLinearProgress-bar': { bgcolor: '#fff', borderRadius: 999 } }} />
                                <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>{Math.min(100, profileCompletion)}%</Typography>
                              </Box>
                              <Typography sx={{ color: 'rgba(255,255,255,0.62)', fontSize: 11, mt: 0.85 }}>Updated {profile?.updated_at ? formatDate(profile.updated_at) : 'recently'}</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={5}>
                            <Box sx={{ height: '100%', boxSizing: 'border-box', p: 1.35, borderRadius: 2.4, bgcolor: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.12)' }}>
                              <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.86)', fontWeight: 800, mb: 0.75 }}>Profile performance</Typography>
                              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: 1.5, alignItems: 'start' }}>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{searchAppearanceCount}</Typography>
                                <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Search appearances</Typography>
                              </Box>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{recruiterActionCount}</Typography>
                                <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Recruiter actions</Typography>
                              </Box>
                            </Box>
                            </Box>
                          </Grid>
                        </Grid>

                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.2 }}>
                          <Button onClick={() => navigate(ROUTES.DASHBOARD_PROFILE)} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, px: 1.6, py: 0.7, color: '#0f172a', background: '#fff', boxShadow: 'none', border: '1px solid rgba(255,255,255,0.32)', '&:hover': { background: '#f8fafc', boxShadow: 'none' }, fontSize: 13 }}>
                            {Math.min(100, profileCompletion) >= 100 ? 'Edit Profile' : 'Complete Profile'}
                          </Button>
                          <Button onClick={() => navigate(ROUTES.JOBS)} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, px: 1.6, py: 0.7, color: '#fff', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', boxShadow: 'none', '&:hover': { background: 'rgba(255,255,255,0.18)', boxShadow: 'none' }, fontSize: 13 }}>Browse Jobs</Button>
                          <Button onClick={() => navigate(ROUTES.DASHBOARD_APPLICATIONS)} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, px: 1.6, py: 0.7, color: '#fff', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', boxShadow: 'none', '&:hover': { background: 'rgba(255,255,255,0.18)', boxShadow: 'none' }, fontSize: 13 }}>My Applications</Button>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 0.5 }}>
                            <Badge badgeContent={notificationsCount || 0} color="error" overlap="circular">
                              <IconButton onClick={() => navigate(ROUTES.DASHBOARD_NOTIFICATIONS)} sx={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', '&:hover': { background: 'rgba(255,255,255,0.18)' } }}><NotificationsIcon sx={{ fontSize: 18 }} /></IconButton>
                            </Badge>
                            <Badge badgeContent={unreadMessagesCount || 0} color="success" overlap="circular">
                              <IconButton onClick={() => navigate(ROUTES.MESSAGING)} sx={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', '&:hover': { background: 'rgba(255,255,255,0.18)' } }}><ChatIcon sx={{ fontSize: 18 }} /></IconButton>
                            </Badge>
                          </Box>
                        </Box>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Box sx={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 4, p: 2.4, width: '100%', maxWidth: 300, backdropFilter: 'blur(10px)' }}>
                            <Typography sx={{ color: 'rgba(255,255,255,0.72)', fontWeight: 700, letterSpacing: 0.4, mb: 1.2, textTransform: 'uppercase', fontSize: 11 }}>Career Score</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 1.6 }}>
                              <Box sx={{ position: 'relative', width: 84, height: 84, borderRadius: '50%', background: `conic-gradient(#ffffff 0deg ${heroScore * 3.6}deg, rgba(255,255,255,0.12) ${heroScore * 3.6}deg 360deg)`, display: 'grid', placeItems: 'center' }}>
                                  <Box sx={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(15,23,42,0.78), rgba(29,78,216,0.85))', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: 18 }}>{Math.round(heroScore)}</Box>
                                </Box>
                                <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>{heroScore >= 80 ? 'Good' : heroScore >= 60 ? 'Strong' : 'Growing'}</Typography>
                            </Box>

                            <Stack spacing={1.1}>
                              {profileCompletionBreakdown.slice(0, 4).map((item) => (
                                <Box key={item.label}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: 12, mb: 0.35 }}>
                                    <span>{item.label}</span>
                                    <span>{Math.min(99, item.value)}%</span>
                                  </Box>
                                  <LinearProgress variant="determinate" value={item.value} sx={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.15)', '& .MuiLinearProgress-bar': { bgcolor: '#fff', borderRadius: 999 } }} />
                                </Box>
                              ))}
                            </Stack>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </motion.div>

              <Grid container spacing={2}>
                {stats.map((item) => (
                  <Grid item xs={12} sm={6} md={4} lg={2.4} key={item.label}>
                    <Card sx={{ borderRadius: 3.2, border: '1px solid rgba(148,163,184,0.12)', background: item.bg, boxShadow: '0 8px 18px rgba(15,23,42,0.04)', transition: 'all 0.18s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 16px 26px rgba(15,23,42,0.06)' }, height: '100%' }}>
                      <CardContent sx={{ p: 1.2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography sx={{ fontWeight: 700, color: '#334155', fontSize: 12 }}>{item.label}</Typography>
                          <Box sx={{ width: 34, height: 34, borderRadius: 2.2, bgcolor: 'rgba(255,255,255,0.85)', display: 'grid', placeItems: 'center' }}>
                            <item.icon sx={{ color: item.color, fontSize: 18 }} />
                          </Box>
                        </Box>
                        <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#0F172A', lineHeight: 1.05 }}>{item.value}</Typography>
                        <Typography sx={{ color: '#475569', fontSize: 11, mt: 0.6, fontWeight: 600 }}>{item.hint}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Grid container spacing={2.5} sx={{ mb: 0.5 }}>
                <Grid item xs={12}>
                  <Card sx={{ borderRadius: 4, border: '1px solid rgba(148,163,184,0.18)', boxShadow: '0 18px 34px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
                    <Box sx={{ height: 4, background: 'linear-gradient(90deg, #2563eb 0%, #7c3aed 55%, #ec4899 100%)' }} />
                    <CardContent sx={{ p: { xs: 2.1, md: 2.5 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5, mb: 2.2 }}>
                        <Box sx={{ display: 'flex', gap: 1.4, alignItems: 'center' }}>
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: 2.4,
                              display: 'grid',
                              placeItems: 'center',
                              color: '#fff',
                              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                              boxShadow: '0 10px 22px rgba(37,99,235,0.32)',
                              flexShrink: 0,
                            }}
                          >
                            <TimelineIcon />
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em' }}>Recruiter Insights</Typography>
                            <Typography sx={{ color: '#64748B', fontSize: 13, mt: 0.2 }}>See which recruiters discovered your profile and what they did</Typography>
                          </Box>
                        </Box>

                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Chip
                            size="small"
                            icon={<SearchIcon sx={{ fontSize: 15 }} />}
                            label={`${searchAppearanceCount} search appearances`}
                            sx={{ bgcolor: '#f1f5f9', color: '#334155', fontWeight: 700 }}
                          />
                          <Chip
                            size="small"
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                                <Box
                                  sx={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: '50%',
                                    bgcolor: '#22c55e',
                                    animation: 'recruiterPulse 1.6s ease-in-out infinite',
                                    '@keyframes recruiterPulse': {
                                      '0%, 100%': { opacity: 1, boxShadow: '0 0 0 0 rgba(34,197,94,0.5)' },
                                      '50%': { opacity: 0.6, boxShadow: '0 0 0 5px rgba(34,197,94,0)' },
                                    },
                                  }}
                                />
                                Live
                              </Box>
                            }
                            sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 800 }}
                          />
                        </Stack>
                      </Box>

                      <Grid container spacing={1.6} sx={{ mb: 2.2 }}>
                        {[
                          {
                            key: 'all' as const,
                            label: 'Recruiter Actions',
                            value: recruiterActionCount,
                            subtitle: `${companiesEngagedCount} compan${companiesEngagedCount === 1 ? 'y' : 'ies'} engaged`,
                            icon: TrendingUpIcon,
                            accent: '#2563eb',
                          },
                          {
                            key: 'views' as const,
                            label: 'Profile Views',
                            value: recruiterViewCount,
                            subtitle: 'Recruiters opened your profile',
                            icon: VisibilityIcon,
                            accent: '#7c3aed',
                          },
                          {
                            key: 'resume' as const,
                            label: 'Resume Downloads',
                            value: recruiterResumeCount,
                            subtitle: 'Resume accessed by recruiters',
                            icon: DownloadIcon,
                            accent: '#0ea5e9',
                          },
                        ].map((item) => {
                          const isActive = activeRecruiterFilter === item.key;
                          return (
                            <Grid item xs={12} sm={6} md={4} key={item.key}>
                              <ButtonBase
                                onClick={() => setActiveRecruiterFilter(item.key)}
                                aria-pressed={isActive}
                                sx={{
                                  width: '100%',
                                  textAlign: 'left',
                                  justifyContent: 'flex-start',
                                  borderRadius: 3,
                                  p: 1.6,
                                  border: '1px solid',
                                  borderColor: isActive ? 'transparent' : 'rgba(148,163,184,0.24)',
                                  color: isActive ? '#fff' : '#0f172a',
                                  background: isActive ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : '#fff',
                                  boxShadow: isActive ? '0 14px 26px rgba(37,99,235,0.28)' : 'none',
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    background: isActive ? 'linear-gradient(135deg, #1d4ed8, #6d28d9)' : '#f8fafc',
                                    borderColor: isActive ? 'transparent' : item.accent,
                                    transform: 'translateY(-2px)',
                                  },
                                }}
                              >
                                <Box sx={{ width: '100%' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                    <Typography sx={{ fontWeight: 800, fontSize: 13.5 }}>{item.label}</Typography>
                                    <Box
                                      sx={{
                                        width: 30,
                                        height: 30,
                                        borderRadius: 2,
                                        display: 'grid',
                                        placeItems: 'center',
                                        bgcolor: isActive ? 'rgba(255,255,255,0.2)' : `${item.accent}14`,
                                        color: isActive ? '#fff' : item.accent,
                                        flexShrink: 0,
                                      }}
                                    >
                                      <item.icon sx={{ fontSize: 17 }} />
                                    </Box>
                                  </Box>
                                  <Typography sx={{ fontSize: 26, fontWeight: 800, lineHeight: 1.15, mt: 0.4 }}>{item.value}</Typography>
                                  <Typography sx={{ fontSize: 12, opacity: isActive ? 0.88 : 1, color: isActive ? '#fff' : '#64748B', fontWeight: 600 }}>
                                    {item.subtitle}
                                  </Typography>
                                </Box>
                              </ButtonBase>
                            </Grid>
                          );
                        })}
                      </Grid>

                      <Box>
                        {visibleRecruiterInsights.length > 0 ? (
                          <Grid container spacing={1.2}>
                            {visibleRecruiterInsights.map((item) => (
                              <Grid item xs={12} sm={6} lg={4} key={item.id}>
                                <ListItemButton
                                  onClick={() => void openRecruiterInsight(item)}
                                  sx={{
                                    borderRadius: 2.4,
                                    border: '1px solid rgba(148,163,184,0.2)',
                                    p: 1.2,
                                    gap: 1.2,
                                    alignItems: 'center',
                                    transition: 'all 0.18s ease',
                                    '&:hover': {
                                      borderColor: 'rgba(37,99,235,0.5)',
                                      boxShadow: '0 12px 22px rgba(15,23,42,0.07)',
                                      transform: 'translateY(-2px)',
                                      bgcolor: '#fff',
                                    },
                                  }}
                                >
                                  <ListItemAvatar sx={{ minWidth: 0 }}>
                                    <Badge
                                      overlap="circular"
                                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                      badgeContent={
                                        <Box
                                          sx={{
                                            width: 18,
                                            height: 18,
                                            borderRadius: '50%',
                                            display: 'grid',
                                            placeItems: 'center',
                                            bgcolor: item.type === 'views' ? '#7c3aed' : '#0ea5e9',
                                            color: '#fff',
                                            border: '2px solid #fff',
                                          }}
                                        >
                                          {item.type === 'views' ? (
                                            <VisibilityIcon sx={{ fontSize: 10 }} />
                                          ) : (
                                            <DownloadIcon sx={{ fontSize: 10 }} />
                                          )}
                                        </Box>
                                      }
                                    >
                                      <Avatar
                                        src={item.logo || undefined}
                                        sx={{ width: 44, height: 44, bgcolor: '#eef2ff', color: '#4338ca', fontWeight: 800 }}
                                      >
                                        {String(item.company || 'C').charAt(0).toUpperCase()}
                                      </Avatar>
                                    </Badge>
                                  </ListItemAvatar>

                                  <ListItemText
                                    sx={{ my: 0, minWidth: 0 }}
                                    primary={
                                      <Typography noWrap sx={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>
                                        {item.company}
                                      </Typography>
                                    }
                                    secondary={
                                      <Typography noWrap sx={{ fontSize: 12.5, color: '#64748B' }}>
                                        {item.recruiter} • {item.action}
                                      </Typography>
                                    }
                                  />

                                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                                    <Chip
                                      size="small"
                                      label={`${item.count}x`}
                                      sx={{ height: 20, fontWeight: 800, fontSize: 11, bgcolor: '#eff6ff', color: '#1d4ed8' }}
                                    />
                                    <Typography sx={{ fontSize: 11, color: '#94A3B8', mt: 0.3 }}>
                                      {item.timestamp ? formatDate(item.timestamp) : ''}
                                    </Typography>
                                  </Box>
                                </ListItemButton>
                              </Grid>
                            ))}
                          </Grid>
                        ) : (
                          <Box sx={{ border: '1px dashed rgba(148,163,184,0.32)', borderRadius: 3, p: 3, textAlign: 'center', background: 'linear-gradient(135deg, rgba(248,250,252,0.9), rgba(239,246,255,0.8))' }}>
                            <Box sx={{ display: 'grid', placeItems: 'center', mb: 1 }}>
                              <Avatar sx={{ bgcolor: '#e0e7ff', color: '#4338ca', width: 46, height: 46 }}>
                                <TimelineIcon />
                              </Avatar>
                            </Box>
                            <Typography sx={{ fontWeight: 800, color: '#0f172a' }}>
                              {activeRecruiterFilter === 'all' ? 'No recruiter activity yet' : 'Nothing in this filter yet'}
                            </Typography>
                            <Typography sx={{ color: '#64748B', fontSize: 13, mt: 0.5 }}>
                              Complete your profile and keep applying to see more recruiter signals.
                            </Typography>
                            <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1.8 }}>
                              {activeRecruiterFilter !== 'all' && (
                                <Button size="small" variant="outlined" onClick={() => setActiveRecruiterFilter('all')} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                                  Show all activity
                                </Button>
                              )}
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => navigate(ROUTES.DASHBOARD_PROFILE)}
                                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                              >
                                Improve profile
                              </Button>
                            </Stack>
                          </Box>
                        )}
                      </Box>

                      <Dialog
                        open={recruiterModalOpen}
                        onClose={() => setRecruiterModalOpen(false)}
                        fullWidth
                        maxWidth="sm"
                        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
                      >
                        <Box sx={{ height: 4, background: 'linear-gradient(90deg, #2563eb, #7c3aed)' }} />
                        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Recruiter details</DialogTitle>
                        <DialogContent dividers>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                            <Avatar
                              src={selectedRecruiterProfile?.company_logo_url || selectedRecruiterInsight?.logo || undefined}
                              sx={{ width: 60, height: 60, bgcolor: '#eef2ff', color: '#4338ca', fontWeight: 800, fontSize: 22 }}
                            >
                              {(selectedRecruiterProfile?.company_name || selectedRecruiterInsight?.company || 'C').charAt(0).toUpperCase()}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 800, fontSize: 17 }}>
                                {selectedRecruiterProfile?.company_name || selectedRecruiterInsight?.company}
                              </Typography>
                              <Typography sx={{ color: '#64748B', fontSize: 14 }}>
                                {selectedRecruiterProfile?.hr_name || selectedRecruiterInsight?.recruiter}
                              </Typography>
                              <Stack direction="row" spacing={0.8} sx={{ mt: 0.8 }} flexWrap="wrap" useFlexGap>
                                <Chip size="small" label={selectedRecruiterInsight?.action} sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 700 }} />
                                <Chip
                                  size="small"
                                  label={`${selectedRecruiterInsight?.count || 0} interaction${(selectedRecruiterInsight?.count || 0) > 1 ? 's' : ''}`}
                                  sx={{ bgcolor: '#f1f5f9', color: '#334155', fontWeight: 700 }}
                                />
                                {selectedRecruiterInsight?.timestamp && (
                                  <Chip size="small" label={formatDate(selectedRecruiterInsight.timestamp)} sx={{ bgcolor: '#f1f5f9', color: '#334155', fontWeight: 700 }} />
                                )}
                              </Stack>
                            </Box>
                          </Box>

                          <Divider sx={{ mb: 1.5 }} />

                          <Typography sx={{ fontWeight: 800, mb: 1, fontSize: 14 }}>Recent jobs from this company</Typography>

                          {recruiterDetailsLoading ? (
                            <Stack spacing={1}>
                              {[0, 1, 2].map((row) => (
                                <Skeleton key={row} variant="rounded" height={52} />
                              ))}
                            </Stack>
                          ) : selectedRecruiterJobs && selectedRecruiterJobs.length > 0 ? (
                            <List disablePadding>
                              {selectedRecruiterJobs.slice(0, 6).map((job) => (
                                <ListItem
                                  key={job.id}
                                  disableGutters
                                  secondaryAction={
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={() => navigate(ROUTES.JOB_DETAILS.replace(':id', String(job.id)))}
                                      sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                                    >
                                      View
                                    </Button>
                                  }
                                >
                                  <ListItemText
                                    primary={<Typography sx={{ fontWeight: 700, fontSize: 14 }}>{job.title}</Typography>}
                                    secondary={job.location || job.company_name}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          ) : (
                            <Typography sx={{ color: '#64748B', fontSize: 14 }}>No public job postings found for this company.</Typography>
                          )}
                        </DialogContent>
                        <DialogActions sx={{ px: 2.5, py: 1.6 }}>
                          <Button onClick={() => setRecruiterModalOpen(false)} sx={{ textTransform: 'none', fontWeight: 700 }}>
                            Close
                          </Button>
                          <Button
                            variant="contained"
                            disabled={!selectedRecruiterProfile?.company_name}
                            onClick={() => {
                              setRecruiterModalOpen(false);
                              if (selectedRecruiterProfile?.company_name) {
                                navigate(
                                  ROUTES.COMPANY_CAREER_PAGE.replace(
                                    ':slug',
                                    String(selectedRecruiterProfile.company_name).toLowerCase().replace(/\s+/g, '-')
                                  )
                                );
                              }
                            }}
                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                          >
                            View company
                          </Button>
                        </DialogActions>
                      </Dialog>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Grid container spacing={3}>
                <Grid item xs={12} lg={8}>
                  <Card sx={{ borderRadius: 4, border: '1px solid rgba(148,163,184,0.18)', boxShadow: '0 18px 34px rgba(15,23,42,0.04)', height: '100%', overflow: 'hidden' }}>
                    <Box sx={{ height: 4, background: 'linear-gradient(90deg, #2563eb 0%, #7c3aed 100%)' }} />
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap', mb: 2.2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4 }}>
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: 2.4,
                              display: 'grid',
                              placeItems: 'center',
                              color: '#fff',
                              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                              boxShadow: '0 10px 22px rgba(37,99,235,0.32)',
                              flexShrink: 0,
                            }}
                          >
                            <AutoAwesomeIcon />
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em' }}>Recommended Jobs for You</Typography>
                            <Typography sx={{ color: '#64748B', fontSize: 13, mt: 0.2 }}>Matched to your skills, role and preferences</Typography>
                          </Box>
                        </Box>
                        <Button
                          component={RouterLink}
                          to="/dashboard/recommended-jobs"
                          endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                          sx={{ textTransform: 'none', fontWeight: 700, color: '#1d4ed8', borderRadius: 2 }}
                        >
                          View all
                        </Button>
                      </Box>

                      {recommendedLoading ? (
                        <Stack spacing={1.4}>
                          {[0, 1, 2].map((row) => (
                            <Skeleton key={row} variant="rounded" height={132} sx={{ borderRadius: 3 }} />
                          ))}
                        </Stack>
                      ) : (
                        <Stack spacing={1.4}>
                          {recommendedJobs.length > 0 ? recommendedJobs.slice(0, 3).map((job, index) => {
                            const jobId = String(job.id ?? index);
                            const isSaved = savedJobIds.has(jobId);
                            const matchScore = Math.round(
                              Number(job.match_score ?? job.matchScore ?? Math.min(99, Math.max(60, 90 - index * 4)))
                            );
                            const skills: string[] = Array.isArray(job.skills) ? job.skills.filter(Boolean) : [];
                            const goToJob = () => navigate(ROUTES.JOB_DETAILS.replace(':id', jobId));

                            return (
                              <Box
                                key={job.id || index}
                                onClick={goToJob}
                                sx={{
                                  position: 'relative',
                                  border: '1px solid rgba(148,163,184,0.2)',
                                  borderRadius: 3,
                                  p: 1.8,
                                  background: '#fff',
                                  cursor: 'pointer',
                                  overflow: 'hidden',
                                  transition: 'all 0.2s ease',
                                  '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: 3,
                                    background: 'linear-gradient(180deg, #2563eb, #7c3aed)',
                                    opacity: 0,
                                    transition: 'opacity 0.2s ease',
                                  },
                                  '&:hover': {
                                    borderColor: 'rgba(37,99,235,0.45)',
                                    boxShadow: '0 14px 28px rgba(15,23,42,0.08)',
                                    transform: 'translateY(-2px)',
                                  },
                                  '&:hover::before': { opacity: 1 },
                                }}
                              >
                                <Box sx={{ display: 'flex', gap: 1.4, alignItems: 'flex-start' }}>
                                  <Avatar
                                    src={job.company_logo_url || job.company_logo || undefined}
                                    variant="rounded"
                                    sx={{
                                      width: 46,
                                      height: 46,
                                      fontWeight: 800,
                                      fontSize: 17,
                                      color: '#4338ca',
                                      bgcolor: '#eef2ff',
                                      borderRadius: 2,
                                      flexShrink: 0,
                                    }}
                                  >
                                    {String(job.company_name || 'C').charAt(0).toUpperCase()}
                                  </Avatar>

                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: 15, lineHeight: 1.3 }}>
                                      {job.title || 'Job Title'}
                                    </Typography>
                                    <Typography sx={{ color: '#64748B', fontWeight: 600, fontSize: 13, mt: 0.15 }}>
                                      {job.company_name || 'Company'}
                                    </Typography>
                                  </Box>

                                  <Tooltip title={`${matchScore}% profile match`}>
                                    <Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
                                      <CircularProgress
                                        variant="determinate"
                                        value={100}
                                        size={44}
                                        thickness={4}
                                        sx={{ color: 'rgba(148,163,184,0.22)' }}
                                      />
                                      <CircularProgress
                                        variant="determinate"
                                        value={matchScore}
                                        size={44}
                                        thickness={4}
                                        sx={{
                                          position: 'absolute',
                                          left: 0,
                                          color: matchScore >= 85 ? '#16a34a' : matchScore >= 70 ? '#2563eb' : '#f59e0b',
                                          '& .MuiCircularProgress-circle': { strokeLinecap: 'round' },
                                        }}
                                      />
                                      <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                                        <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#0f172a' }}>{matchScore}%</Typography>
                                      </Box>
                                    </Box>
                                  </Tooltip>
                                </Box>

                                <Stack direction="row" spacing={1.4} sx={{ mt: 1.2, flexWrap: 'wrap', rowGap: 0.6, color: '#475569', fontSize: 12.5 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <LocationOnIcon sx={{ fontSize: 15, color: '#94a3b8' }} /> {job.location || 'Remote'}
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <AttachMoneyIcon sx={{ fontSize: 15, color: '#94a3b8' }} /> {job.salary || 'Competitive'}
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <WorkIcon sx={{ fontSize: 15, color: '#94a3b8' }} /> {job.work_mode || job.job_type || 'Full-time'}
                                  </Box>
                                  {(job.created_at || job.posted_at) && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <ScheduleIcon sx={{ fontSize: 15, color: '#94a3b8' }} /> {formatDate(job.created_at || job.posted_at)}
                                    </Box>
                                  )}
                                </Stack>

                                {skills.length > 0 && (
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mt: 1.1 }}>
                                    {skills.slice(0, 4).map((skill: string, idx: number) => (
                                      <Chip
                                        key={`${skill}-${idx}`}
                                        label={skill}
                                        size="small"
                                        sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 700, height: 24, fontSize: 11.5 }}
                                      />
                                    ))}
                                    {skills.length > 4 && (
                                      <Chip
                                        label={`+${skills.length - 4}`}
                                        size="small"
                                        sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 700, height: 24, fontSize: 11.5 }}
                                      />
                                    )}
                                  </Box>
                                )}

                                <Divider sx={{ my: 1.3 }} />

                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                  <Tooltip title={isSaved ? 'Remove from saved jobs' : 'Save this job'}>
                                    <span>
                                      <IconButton
                                        size="small"
                                        aria-label={isSaved ? 'Remove from saved jobs' : 'Save this job'}
                                        disabled={savingJobId === jobId}
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          void handleToggleSaveJob(job);
                                        }}
                                        sx={{
                                          border: '1px solid',
                                          borderColor: isSaved ? 'rgba(37,99,235,0.4)' : 'rgba(148,163,184,0.35)',
                                          borderRadius: 2,
                                          color: isSaved ? '#1d4ed8' : '#64748B',
                                          bgcolor: isSaved ? 'rgba(37,99,235,0.08)' : 'transparent',
                                          '&:hover': { borderColor: '#1d4ed8', color: '#1d4ed8' },
                                        }}
                                      >
                                        {isSaved ? <BookmarkIcon sx={{ fontSize: 18 }} /> : <BookmarkBorderIcon sx={{ fontSize: 18 }} />}
                                      </IconButton>
                                    </span>
                                  </Tooltip>

                                  <Stack direction="row" spacing={1}>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        goToJob();
                                      }}
                                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, fontSize: 13, px: 1.6 }}
                                    >
                                      View details
                                    </Button>
                                    <Button
                                      variant="contained"
                                      size="small"
                                      endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />}
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        goToJob();
                                      }}
                                      sx={{
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        fontWeight: 800,
                                        fontSize: 13,
                                        px: 1.8,
                                        background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                                        boxShadow: '0 8px 18px rgba(37,99,235,0.3)',
                                      }}
                                    >
                                      Apply
                                    </Button>
                                  </Stack>
                                </Box>
                              </Box>
                            );
                          }) : (
                            <Box sx={{ border: '1px dashed rgba(148,163,184,0.32)', borderRadius: 3, p: 3, textAlign: 'center', background: 'linear-gradient(135deg, rgba(255,255,255,0.7), rgba(239,246,255,0.9))' }}>
                              <Avatar sx={{ bgcolor: '#e0e7ff', color: '#4338ca', width: 46, height: 46, mx: 'auto', mb: 1.2 }}>
                                <AutoAwesomeIcon />
                              </Avatar>
                              <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: 17, mb: 0.6 }}>Your next opportunity is waiting</Typography>
                              <Typography sx={{ color: '#475569', maxWidth: 420, mx: 'auto', mb: 1.6, fontSize: 13.5 }}>Complete your profile and add skills to unlock better matches.</Typography>
                              <Stack direction="row" spacing={1} justifyContent="center">
                                <Button component={RouterLink} to={ROUTES.JOBS} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>Browse jobs</Button>
                                <Button component={RouterLink} to={ROUTES.DASHBOARD_PROFILE} variant="contained" sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', textTransform: 'none', fontWeight: 800 }}>Improve profile</Button>
                              </Stack>
                            </Box>
                          )}
                        </Stack>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} lg={4}>
                  <Card sx={{ borderRadius: 4, border: '1px solid rgba(148,163,184,0.18)', boxShadow: '0 18px 34px rgba(15,23,42,0.04)', height: '100%' }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.04em' }}>AI Career Coach</Typography>
                        <AutoAwesomeIcon sx={{ color: '#7c3aed' }} />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.4 }}>
                        <Box sx={{ position: 'relative', width: 126, height: 126, borderRadius: '50%', background: `conic-gradient(#2563eb 0deg ${heroScore * 3.6}deg, rgba(37,99,235,0.12) ${heroScore * 3.6}deg 360deg)`, display: 'grid', placeItems: 'center' }}>
                          <Box sx={{ width: 90, height: 90, borderRadius: '50%', display: 'grid', placeItems: 'center', background: '#fff', color: '#0f172a', fontWeight: 800, fontSize: 28 }}>{Math.round(heroScore)}</Box>
                        </Box>
                      </Box>
                      <Stack spacing={1.2}>
                        {coachRecommendations.map((tip) => (
                          <Box key={tip} sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#334155', fontWeight: 600 }}>
                            <CheckCircleIcon sx={{ color: '#22c55e', fontSize: 18 }} />
                            {tip}
                          </Box>
                        ))}
                      </Stack>
                      <Button component={RouterLink} to={ROUTES.DASHBOARD_AI_CAREER_HUB} variant="contained" sx={{ mt: 2.2, width: '100%', borderRadius: 999, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', textTransform: 'none', fontWeight: 800 }}>Improve Profile</Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Grid container spacing={3}>
                <Grid item xs={12} lg={7}>
                  <Card sx={{ borderRadius: 4, border: '1px solid rgba(148,163,184,0.18)', boxShadow: '0 18px 34px rgba(15,23,42,0.04)', height: '100%', overflow: 'hidden' }}>
                    <Box sx={{ height: 4, background: 'linear-gradient(90deg, #0ea5e9 0%, #2563eb 55%, #7c3aed 100%)' }} />
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap', mb: 2.2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4 }}>
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: 2.4,
                              display: 'grid',
                              placeItems: 'center',
                              color: '#fff',
                              background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                              boxShadow: '0 10px 22px rgba(14,165,233,0.3)',
                              flexShrink: 0,
                            }}
                          >
                            <ScheduleIcon />
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em' }}>Recent Activity</Typography>
                            <Typography sx={{ color: '#64748B', fontSize: 13, mt: 0.2 }}>Everything happening on your profile</Typography>
                          </Box>
                        </Box>
                        <Button
                          onClick={() => navigate(ROUTES.DASHBOARD_NOTIFICATIONS)}
                          endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                          sx={{ textTransform: 'none', fontWeight: 700, color: '#1d4ed8', borderRadius: 2 }}
                        >
                          View all
                        </Button>
                      </Box>

                      {activityItems.length === 0 ? (
                        <Box sx={{ border: '1px dashed rgba(148,163,184,0.32)', borderRadius: 3, p: 3, textAlign: 'center', background: 'linear-gradient(135deg, rgba(248,250,252,0.9), rgba(239,246,255,0.8))' }}>
                          <Avatar sx={{ bgcolor: '#e0f2fe', color: '#0369a1', width: 46, height: 46, mx: 'auto', mb: 1.2 }}>
                            <ScheduleIcon />
                          </Avatar>
                          <Typography sx={{ fontWeight: 800, color: '#0f172a' }}>No activity yet</Typography>
                          <Typography sx={{ color: '#64748B', fontSize: 13, mt: 0.5, mb: 1.6 }}>
                            Apply to jobs and complete your profile to start building your activity feed.
                          </Typography>
                          <Button
                            component={RouterLink}
                            to={ROUTES.JOBS}
                            variant="contained"
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800, background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
                          >
                            Browse jobs
                          </Button>
                        </Box>
                      ) : (
                        <Box sx={{ position: 'relative' }}>
                          {/* Vertical timeline rail */}
                          <Box
                            sx={{
                              position: 'absolute',
                              left: 19,
                              top: 14,
                              bottom: 14,
                              width: 2,
                              borderRadius: 1,
                              background: 'linear-gradient(180deg, rgba(37,99,235,0.28), rgba(124,58,237,0.08))',
                              display: { xs: 'none', sm: 'block' },
                            }}
                          />

                          <Stack spacing={1.2}>
                            {activityItems.map(({ id, title, subtitle, timestamp, status, icon: Icon, tone, to }) => {
                              const palette = {
                                primary: { bg: '#dbeafe', fg: '#1d4ed8' },
                                success: { bg: '#dcfce7', fg: '#15803d' },
                                warning: { bg: '#fef3c7', fg: '#b45309' },
                                info: { bg: '#e0f2fe', fg: '#0369a1' },
                              }[tone];

                              return (
                                <ListItemButton
                                  key={id}
                                  disabled={!to}
                                  onClick={() => to && navigate(to)}
                                  sx={{
                                    alignItems: 'flex-start',
                                    gap: 1.5,
                                    p: 1.5,
                                    borderRadius: 3,
                                    border: '1px solid rgba(148,163,184,0.18)',
                                    bgcolor: '#fff',
                                    transition: 'all 0.18s ease',
                                    '&.Mui-disabled': { opacity: 1 },
                                    '&:hover': {
                                      borderColor: 'rgba(37,99,235,0.4)',
                                      boxShadow: '0 12px 22px rgba(15,23,42,0.06)',
                                      transform: 'translateX(2px)',
                                    },
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: 38,
                                      height: 38,
                                      borderRadius: 2.2,
                                      display: 'grid',
                                      placeItems: 'center',
                                      bgcolor: palette.bg,
                                      color: palette.fg,
                                      flexShrink: 0,
                                      border: '2px solid #fff',
                                      zIndex: 1,
                                    }}
                                  >
                                    <Icon sx={{ fontSize: 18 }} />
                                  </Box>

                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'center' }}>
                                      <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: 14.5 }}>{title}</Typography>
                                      <Chip
                                        label={status}
                                        size="small"
                                        sx={{ bgcolor: palette.bg, color: palette.fg, fontWeight: 700, height: 22, fontSize: 11 }}
                                      />
                                    </Box>
                                    <Typography noWrap sx={{ color: '#475569', fontSize: 13, mt: 0.3 }}>
                                      {subtitle}
                                    </Typography>
                                    <Typography sx={{ color: '#94a3b8', fontSize: 11.5, mt: 0.5, fontWeight: 600 }}>
                                      {timestamp ? formatDate(new Date(timestamp).toISOString()) : 'Recently'}
                                    </Typography>
                                  </Box>
                                </ListItemButton>
                              );
                            })}
                          </Stack>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} lg={5}>
                  <Stack spacing={3}>
                    <Card sx={{ borderRadius: 4, border: '1px solid rgba(148,163,184,0.18)', boxShadow: '0 18px 34px rgba(15,23,42,0.04)' }}>
                      <CardContent sx={{ p: 2.5 }}>
                        <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#0F172A', mb: 2, letterSpacing: '-0.04em' }}>Application Pipeline</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 1.2, mb: 2 }}>
                          {pipeline.map((step, index) => (
                            <Box key={step.label} sx={{ textAlign: 'center' }}>
                              <Box sx={{ height: 10, background: index === 0 ? '#2563EB' : '#e2e8f0', borderRadius: 999, mb: 1 }} />
                              <Typography sx={{ fontSize: 12, color: '#334155', fontWeight: 700 }}>{step.label}</Typography>
                              <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{step.value}</Typography>
                            </Box>
                          ))}
                        </Box>
                        <Typography sx={{ color: '#2563EB', fontWeight: 800 }}>Win more opportunities</Typography>
                        <Button variant="contained" onClick={() => navigate(ROUTES.DASHBOARD_ASSESSMENTS)} sx={{ mt: 2, borderRadius: 999, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', textTransform: 'none', fontWeight: 800 }}>Take Assessment</Button>
                      </CardContent>
                    </Card>

                    <Card sx={{ borderRadius: 4, border: '1px solid rgba(148,163,184,0.18)', boxShadow: '0 18px 34px rgba(15,23,42,0.04)' }}>
                      <CardContent sx={{ p: 2.5 }}>
                        <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#0F172A', mb: 2, letterSpacing: '-0.04em' }}>Profile Completion</Typography>
                        <Stack spacing={1.5}>
                          {profileCompletionBreakdown.map((item) => (
                            <Box key={item.label}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, color: '#334155', fontWeight: 700 }}>
                                <span>{item.label}</span><span>{Math.min(99, item.value)}%</span>
                              </Box>
                              <LinearProgress variant="determinate" value={item.value} sx={{ height: 8, borderRadius: 999, background: 'rgba(148,163,184,0.18)', '& .MuiLinearProgress-bar': { bgcolor: item.color, borderRadius: 999 } }} />
                            </Box>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Stack>
                </Grid>
              </Grid>

              <Grid container spacing={3}>
                <Grid item xs={12} lg={8}>
                  <Card sx={{ borderRadius: 4, border: '1px solid rgba(148,163,184,0.18)', boxShadow: '0 18px 34px rgba(15,23,42,0.04)' }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#0F172A', mb: 2, letterSpacing: '-0.04em' }}>Quick Actions</Typography>
                      <Grid container spacing={2}>
                        {[
                          { label: 'Upload Resume', icon: DescriptionIcon },
                          { label: 'Update Profile', icon: PersonIcon },
                          { label: 'Skill Test', icon: QuizIcon },
                          { label: 'Mock Interview', icon: VideocamIcon },
                          { label: 'Resume Review', icon: RateReviewIcon },
                          { label: 'Browse Jobs', icon: WorkIcon },
                        ].map(({ label, icon: Icon }) => (
                          <Grid item xs={12} sm={6} md={4} key={label}>
                            <Button variant="outlined" startIcon={<Icon />} sx={{ justifyContent: 'flex-start', width: '100%', borderRadius: 2.5, px: 1.5, py: 1.1, borderColor: 'rgba(148,163,184,0.22)', color: '#0f172a', fontWeight: 700, textTransform: 'none' }}>{label}</Button>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} lg={4}>
                  <Card sx={{ borderRadius: 4, background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 50%, #7c3aed 100%)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 50px rgba(37,99,235,0.22)', color: '#fff' }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography sx={{ fontSize: 28, fontWeight: 800, mb: 0.5 }}>Go Premium</Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>Unlock exclusive career benefits</Typography>
                      <Stack spacing={1.1}>
                        {['AI Resume Review', 'Priority Job Alerts', 'See Who Viewed Your Profile', 'Unlimited Applications', 'Interview Preparation', 'Remote Jobs'].map((feature) => (
                          <Box key={feature} sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#eff6ff', fontWeight: 600 }}><CheckCircleIcon sx={{ color: '#a5b4fc', fontSize: 18 }} /> {feature}</Box>
                        ))}
                      </Stack>
                      <Button onClick={() => navigate(ROUTES.PRICING)} variant="contained" sx={{ mt: 2.2, width: '100%', borderRadius: 999, background: '#fff', color: '#0f172a', textTransform: 'none', fontWeight: 800 }}>Upgrade Now</Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Box>

        <Menu anchorEl={profileMenuAnchorEl} open={Boolean(profileMenuAnchorEl)} onClose={closeProfileMenu} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <MenuItem onClick={() => { closeProfileMenu(); navigate(ROUTES.DASHBOARD_PROFILE); }}>Profile</MenuItem>
          <MenuItem onClick={() => { closeProfileMenu(); navigate(ROUTES.DASHBOARD_AI_CAREER_HUB); }}>AI Career Hub</MenuItem>
          <MenuItem onClick={() => { closeProfileMenu(); navigate(ROUTES.DASHBOARD_SETTINGS); }}>Settings</MenuItem>
          <MenuItem onClick={() => { closeProfileMenu(); setSupportOpen(true); }}>Help & Support</MenuItem>
          <MenuItem onClick={handleSignout} sx={{ color: 'error.main' }}>Logout</MenuItem>
        </Menu>
      </Box>

      <SupportWidget audience="candidate" showFab={false} open={supportOpen} onClose={() => setSupportOpen(false)} />
    </Layout>
  );
};
