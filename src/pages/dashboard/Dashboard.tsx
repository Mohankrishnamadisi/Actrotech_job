import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  Grid,
  IconButton,
  LinearProgress,
  List,
  Menu,
  MenuItem,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  ArrowForward as ArrowForwardIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  AttachMoney as AttachMoneyIcon,
  AutoAwesome as AutoAwesomeIcon,
  Bookmark as BookmarkIcon,
  ChatBubbleOutline as ChatIcon,
  CheckCircle as CheckCircleIcon,
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  Download as DownloadIcon,
  EventAvailable as EventAvailableIcon,
  ExpandMore as ExpandMoreIcon,
  FolderOpen as FolderOpenIcon,
  LocationOn as LocationOnIcon,
  Login as LogoutIcon,
  Logout as LogoutIconOld,
  Menu as MenuIcon,
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
import { UnlockProButton } from '@components/common/UnlockProButton';
import SupportWidget from '@components/common/SupportWidget';
import { InstallApp } from '@components/InstallApp/InstallApp';
import { supportService } from '@services/support';
import { ROUTES } from '@constants/index';
import { useSubscription } from '@hooks/index';
import { useAuthStore } from '@store/index';
import { authService } from '@services/supabase';
import { applicationService, jobService, notificationService, savedService, userService, recruiterService } from '@services/api';
import { messagingService } from '@services/messaging';
import { formatDate } from '@utils/index';
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
  jobs?: {
    id?: string;
    title?: string;
    company_name?: string;
    location?: string;
  };
};

type DashboardSectionKey = 'applications' | 'saved' | 'resume' | 'profile' | null;

const MotionCard = motion(Card);

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
  const [ticketNotifCount, setTicketNotifCount] = useState(0);

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
  const [activeRecruiterFilter, setActiveRecruiterFilter] = useState<'all' | 'actions' | 'search'>('all');
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [recommendedLoading, setRecommendedLoading] = useState(false);

  const sidebarItems = useMemo(
    () => [
      { label: 'Dashboard', icon: DashboardIcon, to: ROUTES.DASHBOARD, active: true },
      { label: 'Notifications', icon: NotificationsIcon, to: ROUTES.DASHBOARD_NOTIFICATIONS, badge: notificationsCount },
      { label: 'Chat', icon: ChatIcon, to: ROUTES.MESSAGING, badge: unreadMessagesCount },
      { label: 'Jobs', icon: WorkIcon, to: ROUTES.JOBS },
      { label: 'Applications', icon: AssignmentTurnedInIcon, to: ROUTES.DASHBOARD_APPLICATIONS },
      { label: 'Saved Jobs', icon: BookmarkIcon, to: ROUTES.DASHBOARD_SAVED_JOBS },
      { label: 'Assessments', icon: QuizIcon, to: ROUTES.DASHBOARD_ASSESSMENTS },
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

  const openProfileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchorEl(event.currentTarget);
  };

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

  const activityItems = useMemo(
    () => [
      { title: 'Recruiter viewed your profile', subtitle: 'Google · Hiring for Sr. Frontend Engineer', time: '2 hours ago', status: 'New', icon: VisibilityIcon, tone: 'primary' },
      { title: 'Resume downloaded', subtitle: 'Microsoft · Design systems team', time: '5 hours ago', status: 'Saved', icon: DownloadIcon, tone: 'success' },
      { title: 'Interview invite', subtitle: 'Cognizant · Product analyst panel', time: 'Yesterday', status: 'Priority', icon: EventAvailableIcon, tone: 'warning' },
      { title: 'Application shortlisted', subtitle: 'Amazon · Full-stack developer', time: '2 days ago', status: 'Shortlisted', icon: AssignmentTurnedInIcon, tone: 'success' },
    ],
    [],
  );

  const recruiterActionCount = Math.max(0, (profileViewCount ?? 0) + (resumeDownloadCount ?? 0));
  const searchAppearanceCount = Math.max(0, profileViewCount ?? 0);

  const recruiterInsightFeed = useMemo(() => {
    const feed = [
      ...(profileViewRecruiters || []).map((item: any) => ({
        id: `view-${item.recruiter_id}`,
        company: item.company_name || item.recruiter_name || 'Company',
        recruiter: item.recruiter_name || 'Recruiter',
        action: 'Viewed your profile',
        type: 'actions' as const,
        count: item.total_views || 1,
        timestamp: item.last_viewed_at || null,
      })),
      ...(resumeUnlockRecruiters || []).map((item: any) => ({
        id: `unlock-${item.recruiter_id}`,
        company: item.company_name || item.recruiter_name || 'Company',
        recruiter: item.recruiter_name || 'Recruiter',
        action: 'Downloaded your resume',
        type: 'search' as const,
        count: item.total_unlocks || 1,
        timestamp: item.last_unlocked_at || null,
      })),
    ];

    return feed
      .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
      .slice(0, 6);
  }, [profileViewRecruiters, resumeUnlockRecruiters]);

  const visibleRecruiterInsights = useMemo(() => {
    if (activeRecruiterFilter === 'actions') {
      return recruiterInsightFeed.filter((item) => item.type === 'actions');
    }
    if (activeRecruiterFilter === 'search') {
      return recruiterInsightFeed.filter((item) => item.type === 'search');
    }
    return recruiterInsightFeed;
  }, [activeRecruiterFilter, recruiterInsightFeed]);

  useEffect(() => {
    if (recruiterInsightFeed && recruiterInsightFeed.length > 0 && !selectedRecruiterInsight) {
      setSelectedRecruiterInsight(recruiterInsightFeed[0]);
    }
  }, [recruiterInsightFeed, selectedRecruiterInsight]);

  useEffect(() => {
    if (!selectedRecruiterInsight) return;
    let mounted = true;
    const loadDetails = async () => {
      try {
        const recruiterId = selectedRecruiterInsight?.id?.split('-')?.[1];
        if (!recruiterId) return;
        const [profile, jobs] = await Promise.all([
          recruiterService.getRecruiterProfile(recruiterId).catch(() => null),
          jobService.getRecruiterJobs(recruiterId).catch(() => []),
        ]);
        if (!mounted) return;
        setSelectedRecruiterProfile(profile);
        setSelectedRecruiterJobs(jobs || []);
        setRecruiterModalOpen(true);
      } catch (err) {
        // noop
      }
    };

    loadDetails();

    return () => { mounted = false; };
  }, [selectedRecruiterInsight]);

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
      <Box sx={{ px: 2.2, py: 1.4, mb: 0.8 }} />

      <Box sx={{ px: 2.2, py: 1 }}>
        <Typography className="sidebar-section-title" sx={{ fontSize: 12, letterSpacing: 1.5, color: '#64748B', textTransform: 'uppercase', fontWeight: 800, mb: 1.4 }}>Dashboard</Typography>
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

      <Box sx={{ px: 2.2, py: 2 }}>
        <Typography sx={{ fontSize: 12, letterSpacing: 1.5, color: '#64748B', textTransform: 'uppercase', fontWeight: 800, mb: 1.4 }}>Profile</Typography>
        <Stack spacing={0.8}>
          {profileItems.map(({ label, icon: Icon, to }) => (
            <Button key={label} className="dash-nav-button" component={RouterLink} to={to} startIcon={<Icon fontSize="small" />} sx={{ justifyContent: 'flex-start', gap: 1.3, borderRadius: 3, px: 1.2, py: 1.1, color: '#1e293b', fontWeight: 700, textTransform: 'none', minHeight: 46, '&:hover': { background: '#f8fafc' } }}>
              <span className="sidebar-button-label">{label}</span>
            </Button>
          ))}
        </Stack>
      </Box>

      <Box sx={{ px: 2.2, py: 2 }}>
        <Typography className="sidebar-section-title" sx={{ fontSize: 12, letterSpacing: 1.5, color: '#64748B', textTransform: 'uppercase', fontWeight: 800, mb: 1.4 }}>Career Tools</Typography>
        <Stack spacing={0.8}>
          {toolsItems.map(({ label, icon: Icon, to }) => (
            <Button key={label} className="dash-nav-button" component={RouterLink} to={to} startIcon={<Icon fontSize="small" />} sx={{ justifyContent: 'flex-start', gap: 1.3, borderRadius: 3, px: 1.2, py: 1.1, color: '#1e293b', fontWeight: 700, textTransform: 'none', minHeight: 46, '&:hover': { background: '#f8fafc' } }}>
              <span className="sidebar-button-label">{label}</span>
            </Button>
          ))}
        </Stack>
      </Box>

      <Box sx={{ px: 2.2, py: 2, mt: 'auto' }}>
        <Typography className="sidebar-section-title" sx={{ fontSize: 12, letterSpacing: 1.5, color: '#64748B', textTransform: 'uppercase', fontWeight: 800, mb: 1.4 }}>Other</Typography>
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
      <Box className={footerVisible ? 'dashboard-page footer-visible' : 'dashboard-page'} sx={{ background: 'radial-gradient(circle at top left, rgba(59,130,246,0.08), transparent 28%), radial-gradient(circle at top right, rgba(124,58,237,0.08), transparent 26%), #F6F8FC', minHeight: '100vh', px: { xs: 1.5, md: 2.5 }, py: { xs: 2, md: 3 } }}>
        <Drawer anchor="left" open={mobileNavOpen} onClose={() => setMobileNavOpen(false)}>
          <Box sx={{ width: 280, height: '100%', background: '#fff' }}>{renderSidebar({ drawerMode: true })}</Box>
        </Drawer>

        {!isMobile && renderSidebar()}

        <Box className="dashboard-content">
          <Box sx={{ width: '100%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: 'easeOut' }}>
                <Card sx={{ position: 'relative', overflow: 'hidden', borderRadius: 4.5, background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 34%, #4f46e5 66%, #7c3aed 100%)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 32px 60px rgba(79,70,229,0.24)' }}>
                  <Box sx={{ position: 'absolute', width: 280, height: 280, right: -60, top: -80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.08) 35%, transparent 70%)' }} />
                  <Box sx={{ position: 'absolute', width: 210, height: 210, left: -30, bottom: -56, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.28) 0%, rgba(96,165,250,0.1) 35%, transparent 70%)' }} />

                  <CardContent sx={{ position: 'relative', py: { xs: 1.8, md: 2.6 }, px: { xs: 1.8, md: 4 }, zIndex: 2 }}>
                    <Grid container spacing={2.8} alignItems="center">
                      <Grid item xs={12} md={8}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.6, mb: 1.2, pl: { xs: 0, md: 0 } }}>
                          <Avatar sx={{ width: 44, height: 44, bgcolor: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.14)', fontWeight: 800, fontSize: 18 }}>{(user?.name || 'U').charAt(0).toUpperCase()}</Avatar>
                          <Box>
                            <Chip label={subscription?.plan ? `Premium • ${subscription.plan}` : 'Basic'} size="small" sx={{ mb: 0.6, bgcolor: 'rgba(255,255,255,0.12)', color: '#fff', borderRadius: 999, fontWeight: 700, border: '1px solid rgba(255,255,255,0.14)' }} />
                            <Typography sx={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.06, fontSize: 20 }}>
                              {getGreeting()}, {user?.name || 'Candidate'} 👋
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.35, fontSize: 13 }}>
                              {(profile?.current_designation || profile?.currentDesignation || 'Professional')} • {(profile?.experience || 'Experience not added')} • {(profile?.location || 'Location not added')}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'flex-start', mb: 1.4, flexWrap: 'wrap' }}>
                          <Box sx={{ minWidth: 220, background: 'rgba(255,255,255,0.08)', borderRadius: 2.2, p: 1.1, border: '1px solid rgba(255,255,255,0.06)' }}>
                            <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 800, mb: 0.6 }}>Profile performance</Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{searchAppearanceCount}</Typography>
                                <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Search appearances</Typography>
                              </Box>
                              <Box sx={{ width: 1, height: 36, bgcolor: 'rgba(255,255,255,0.06)' }} />
                              <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{recruiterActionCount}</Typography>
                                <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Recruiter actions</Typography>
                              </Box>
                            </Box>
                          </Box>

                          <Box sx={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <Typography sx={{ color: 'rgba(255,255,255,0.9)', mb: 0.6, fontWeight: 600, fontSize: 14 }}>Complete your profile to unlock better job opportunities.</Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.72)', fontSize: 13 }}>Profile last updated: {profile?.updated_at ? formatDate(profile.updated_at) : 'Not yet'}</Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.2 }}>
                          <Box sx={{ flex: 1 }}>
                            <LinearProgress variant="determinate" value={Math.min(100, profileCompletion)} sx={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.14)', '& .MuiLinearProgress-bar': { bgcolor: '#fff', borderRadius: 999 } }} />
                          </Box>
                          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>{Math.min(100, profileCompletion)}%</Typography>
                        </Box>

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
                  <Card sx={{ borderRadius: 4, border: '1px solid rgba(148,163,184,0.18)', boxShadow: '0 18px 34px rgba(15,23,42,0.04)' }}>
                    <CardContent sx={{ p: { xs: 2.1, md: 2.5 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5, mb: 2.2 }}>
                        <Box>
                          <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em' }}>Recruiter Actions & Search Appearances</Typography>
                          <Typography sx={{ color: '#64748B', fontSize: 13, mt: 0.35 }}>See which recruiters discovered your profile and what they did</Typography>
                        </Box>
                        <Chip label="Live recruiter activity" sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 800 }} />
                      </Box>

                      <Grid container spacing={1.6} sx={{ mb: 2 }}>
                        {[
                          { key: 'actions', label: 'Recruiter Actions', value: recruiterActionCount, subtitle: 'Views + resume access' },
                          { key: 'search', label: 'Search Appearances', value: searchAppearanceCount, subtitle: 'Profile seen in recruiter search' },
                          { key: 'companies', label: 'Companies Engaged', value: recruiterInsightFeed.length, subtitle: 'Recruiters following up' },
                        ].map((item) => (
                          <Grid item xs={12} md={4} key={item.key}>
                            <Button
                              onClick={() => setActiveRecruiterFilter(item.key as 'actions' | 'search' | 'all')}
                              variant={activeRecruiterFilter === item.key || (item.key === 'companies' && activeRecruiterFilter === 'all') ? 'contained' : 'outlined'}
                              sx={{
                                width: '100%',
                                justifyContent: 'flex-start',
                                borderRadius: 3,
                                px: 1.5,
                                py: 1.2,
                                textTransform: 'none',
                                color: activeRecruiterFilter === item.key || (item.key === 'companies' && activeRecruiterFilter === 'all') ? '#fff' : '#0f172a',
                                background: activeRecruiterFilter === item.key || (item.key === 'companies' && activeRecruiterFilter === 'all') ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : '#fff',
                                borderColor: 'rgba(148,163,184,0.24)',
                                '&:hover': { background: activeRecruiterFilter === item.key || (item.key === 'companies' && activeRecruiterFilter === 'all') ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : '#f8fafc' },
                              }}
                            >
                              <Box sx={{ textAlign: 'left' }}>
                                <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{item.label}</Typography>
                                <Typography sx={{ fontSize: 24, fontWeight: 800, mt: 0.2 }}>{item.value}</Typography>
                                <Typography sx={{ fontSize: 12, opacity: 0.85 }}>{item.subtitle}</Typography>
                              </Box>
                            </Button>
                          </Grid>
                        ))}
                      </Grid>

                      <Box>
                        {visibleRecruiterInsights.length > 0 ? (
                          <Grid container spacing={1.2}>
                            {visibleRecruiterInsights.map((item) => {
                              const isSelected = selectedRecruiterInsight?.id === item.id;
                              return (
                                <Grid item xs={12} sm={6} md={4} key={item.id}>
                                  <Box
                                    onClick={() => setSelectedRecruiterInsight(item)}
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1.2,
                                      p: 1.1,
                                      borderRadius: 2.2,
                                      border: isSelected ? '1px solid rgba(37,99,235,0.18)' : '1px solid rgba(148,163,184,0.12)',
                                      background: isSelected ? 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(124,58,237,0.06))' : '#fff',
                                      cursor: 'pointer',
                                      '&:hover': { boxShadow: '0 12px 20px rgba(15,23,42,0.04)' },
                                    }}
                                  >
                                    <Box sx={{ width: 44, height: 44, borderRadius: 1.6, overflow: 'hidden', display: 'grid', placeItems: 'center', bgcolor: '#f1f5f9', fontWeight: 800 }}>
                                      {selectedRecruiterProfile?.company_logo_url && selectedRecruiterProfile?.company_logo_url === item.company ? (
                                        <img src={selectedRecruiterProfile.company_logo_url} alt={item.company} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      ) : (
                                        String(item.company || 'C').charAt(0)
                                      )}
                                    </Box>

                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Typography sx={{ fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.company}</Typography>
                                      <Typography sx={{ fontSize: 13, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.recruiter} • {item.action}</Typography>
                                    </Box>

                                    <Box sx={{ textAlign: 'right', minWidth: 72 }}>
                                      <Typography sx={{ fontWeight: 800 }}>{item.count}</Typography>
                                      <Typography sx={{ fontSize: 12, color: '#94A3B8' }}>{item.timestamp ? formatDate(item.timestamp) : ''}</Typography>
                                    </Box>
                                  </Box>
                                </Grid>
                              );
                            })}
                          </Grid>
                        ) : (
                          <Box sx={{ border: '1px dashed rgba(148,163,184,0.32)', borderRadius: 3, p: 2.5, textAlign: 'center', background: 'linear-gradient(135deg, rgba(248,250,252,0.9), rgba(239,246,255,0.8))' }}>
                            <Typography sx={{ fontWeight: 800, color: '#0f172a' }}>No recruiter activity yet</Typography>
                            <Typography sx={{ color: '#64748B', fontSize: 13, mt: 0.5 }}>Complete your profile and keep applying to see more recruiter signals.</Typography>
                          </Box>
                        )}
                      </Box>

                      {selectedRecruiterInsight && (
                        <Box sx={{ mt: 2.2, borderRadius: 3, border: '1px solid rgba(37,99,235,0.14)', background: 'linear-gradient(135deg, rgba(239,246,255,0.8), rgba(255,255,255,0.95))', p: 2 }}>
                          <Typography sx={{ fontWeight: 800, color: '#0f172a' }}>Selected recruiter activity</Typography>
                          <Typography sx={{ color: '#1d4ed8', fontWeight: 700, mt: 0.5 }}>{selectedRecruiterInsight.company}</Typography>
                          <Typography sx={{ color: '#334155', fontSize: 14, mt: 0.4 }}>{selectedRecruiterInsight.recruiter}</Typography>
                          <Typography sx={{ color: '#475569', fontSize: 13, mt: 0.8 }}>{selectedRecruiterInsight.action} • {selectedRecruiterInsight.count} interaction{selectedRecruiterInsight.count > 1 ? 's' : ''}</Typography>
                          <Typography sx={{ color: '#64748B', fontSize: 12, mt: 0.4 }}>{selectedRecruiterInsight.timestamp ? formatDate(selectedRecruiterInsight.timestamp) : 'Recent recruiter activity'}</Typography>
                        </Box>
                      )}
                      <Dialog open={recruiterModalOpen} onClose={() => setRecruiterModalOpen(false)} fullWidth maxWidth="md">
                        <DialogTitle>Recruiter Details</DialogTitle>
                        <DialogContent>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 1.5 }}>
                            <Box sx={{ width: 64, height: 64, borderRadius: 1.6, background: '#f1f5f9', display: 'grid', placeItems: 'center', fontWeight: 800 }}>{(selectedRecruiterProfile?.company_name || selectedRecruiterInsight?.company || 'C').charAt(0)}</Box>
                            <Box>
                              <Typography sx={{ fontWeight: 800 }}>{selectedRecruiterProfile?.company_name || selectedRecruiterInsight?.company}</Typography>
                              <Typography sx={{ color: '#64748B' }}>{selectedRecruiterProfile?.hr_name || selectedRecruiterInsight?.recruiter}</Typography>
                              <Typography sx={{ color: '#475569', fontSize: 13, mt: 0.6 }}>{selectedRecruiterInsight?.action} • {selectedRecruiterInsight?.count} interaction{selectedRecruiterInsight?.count > 1 ? 's' : ''}</Typography>
                            </Box>
                          </Box>

                          <Box sx={{ mt: 1 }}>
                            <Typography sx={{ fontWeight: 800, mb: 1 }}>Recent Jobs from this company</Typography>
                            {selectedRecruiterJobs && selectedRecruiterJobs.length > 0 ? (
                              <List>
                                {selectedRecruiterJobs.slice(0, 6).map((job) => (
                                  <ListItem key={job.id} secondaryAction={<Button size="small" onClick={() => navigate(ROUTES.JOB_DETAILS.replace(':id', String(job.id)))}>View</Button>}>
                                    <ListItemText primary={job.title} secondary={job.company_name} />
                                  </ListItem>
                                ))}
                              </List>
                            ) : (
                              <Typography sx={{ color: '#64748B' }}>No public job postings found for this company.</Typography>
                            )}
                          </Box>
                        </DialogContent>
                        <DialogActions>
                          <Button onClick={() => setRecruiterModalOpen(false)}>Close</Button>
                          <Button onClick={() => { setRecruiterModalOpen(false); if (selectedRecruiterProfile?.company_name) navigate(ROUTES.COMPANY_CAREER_PAGE.replace(':slug', String(selectedRecruiterProfile?.company_name).toLowerCase().replace(/\s+/g, '-'))); }}>View company</Button>
                        </DialogActions>
                      </Dialog>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Grid container spacing={3}>
                <Grid item xs={12} lg={8}>
                  <Card sx={{ borderRadius: 4, border: '1px solid rgba(148,163,184,0.18)', boxShadow: '0 18px 34px rgba(15,23,42,0.04)', height: '100%' }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.2 }}>
                        <Box>
                          <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.04em' }}>Recommended Jobs for You</Typography>
                          <Typography sx={{ color: '#64748B', fontSize: 13, mt: 0.35 }}>Based on your skills and preferences</Typography>
                        </Box>
                        <Button component={RouterLink} to="/dashboard/recommended-jobs" sx={{ textTransform: 'none', fontWeight: 700, color: '#1d4ed8' }}>View all</Button>
                      </Box>

                      {recommendedLoading ? (
                        <LinearProgress />
                      ) : (
                        <Stack spacing={1}
>
                          {recommendedJobs.length > 0 ? recommendedJobs.slice(0, 3).map((job, index) => (
                            <Box key={job.id || index} sx={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 2.4, p: 1.2, background: '#fff', transition: 'all 0.16s ease', '&:hover': { boxShadow: '0 12px 20px rgba(15,23,42,0.04)' } }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.2, alignItems: 'flex-start' }}>
                                <Box sx={{ display: 'flex', gap: 1.1, alignItems: 'center' }}>
                                  <Box sx={{ width: 36, height: 36, borderRadius: 1.6, background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(124,58,237,0.06))', display: 'grid', placeItems: 'center', fontWeight: 800, color: '#1d4ed8', fontSize: 14 }}>{String(job.company_name || 'C').charAt(0).toUpperCase()}</Box>
                                  <Box>
                                    <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>{job.company_name || 'Company'}</Typography>
                                    <Typography sx={{ color: '#0f172a', fontWeight: 700, fontSize: 13 }}>{job.title || 'Job Title'}</Typography>
                                  </Box>
                                </Box>
                                <Chip label={`${Math.min(99, Math.max(60, 90 - index * 4))}%`} sx={{ bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 800, height: 28 }} />
                              </Box>
                              
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.8, color: '#475569', fontSize: 12 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><LocationOnIcon sx={{ fontSize: 14 }} /> {job.location || 'Remote'}</Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><AttachMoneyIcon sx={{ fontSize: 14 }} /> {job.salary || 'Competitive'}</Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><WorkIcon sx={{ fontSize: 14 }} /> {job.work_mode || job.job_type || 'Full-time'}</Box>
                              </Box>

                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mt: 0.8 }}>
                                {(job.skills || ['React', 'TypeScript', 'Next.js']).slice(0, 3).map((skill: string, idx: number) => (
                                  <Chip key={`${skill}-${idx}`} label={skill} size="small" sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 700, height: 26 }} />
                                ))}
                              </Box>

                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                                <Button variant="outlined" onClick={() => navigate(`${ROUTES.JOB_DETAILS.replace(':id', String(job.id))}`)} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700, fontSize: 13, px: 1.2 }}>Apply</Button>
                                <Button variant="contained" onClick={() => navigate(`${ROUTES.JOB_DETAILS.replace(':id', String(job.id))}`)} sx={{ borderRadius: 999, background: '#1d4ed8', textTransform: 'none', fontWeight: 700, fontSize: 13, px: 1.2 }}>Save</Button>
                              </Box>
                            </Box>
                          )) : (
                            <Box sx={{ border: '1px dashed rgba(148,163,184,0.32)', borderRadius: 3, p: 2.2, textAlign: 'center', background: 'linear-gradient(135deg, rgba(255,255,255,0.7), rgba(239,246,255,0.9))' }}>
                              <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: 18, mb: 0.6 }}>Your next opportunity is waiting</Typography>
                              <Typography sx={{ color: '#475569', maxWidth: 420, mx: 'auto', mb: 1.2 }}>Complete your profile and add skills to unlock better matches.</Typography>
                              <Button component={RouterLink} to={ROUTES.DASHBOARD_PROFILE} variant="contained" sx={{ borderRadius: 999, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', textTransform: 'none', fontWeight: 800, fontSize: 14, px: 1.6 }}>Improve Profile</Button>
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
                  <Card sx={{ borderRadius: 4, border: '1px solid rgba(148,163,184,0.18)', boxShadow: '0 18px 34px rgba(15,23,42,0.04)', height: '100%' }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#0F172A', mb: 2, letterSpacing: '-0.04em' }}>Recent Activity</Typography>
                      <Stack spacing={2}>
                        {activityItems.map(({ title, subtitle, time, status, icon: Icon, tone }) => (
                          <Box key={title} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, border: '1px solid rgba(148,163,184,0.12)', borderRadius: 3, p: 1.5 }}>
                            <Box sx={{ width: 38, height: 38, borderRadius: 2.2, display: 'grid', placeItems: 'center', background: tone === 'primary' ? '#dbeafe' : tone === 'success' ? '#dcfce7' : '#fef3c7', color: tone === 'primary' ? '#1d4ed8' : tone === 'success' ? '#15803d' : '#b45309' }}><Icon sx={{ fontSize: 18 }} /></Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'center' }}>
                                <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>{title}</Typography>
                                <Chip label={status} size="small" sx={{ bgcolor: tone === 'primary' ? '#dbeafe' : tone === 'success' ? '#dcfce7' : '#fef3c7', color: tone === 'primary' ? '#1d4ed8' : tone === 'success' ? '#15803d' : '#b45309', fontWeight: 700 }} />
                              </Box>
                              <Typography sx={{ color: '#475569', fontSize: 13, mt: 0.3 }}>{subtitle}</Typography>
                              <Typography sx={{ color: '#64748B', fontSize: 12, mt: 0.5 }}>{time}</Typography>
                            </Box>
                          </Box>
                        ))}
                      </Stack>
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
                      <Button variant="contained" sx={{ mt: 2.2, width: '100%', borderRadius: 999, background: '#fff', color: '#0f172a', textTransform: 'none', fontWeight: 800 }}>Upgrade Now</Button>
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
