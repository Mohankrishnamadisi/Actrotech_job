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
import {
  ArrowForward as ArrowForwardIcon,
  Bookmark as BookmarkIcon,
  Download as DownloadIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';

import { Layout } from '@components/layout/Layout';
import SupportWidget from '@components/common/SupportWidget';
import { supportService } from '@services/support';
import { ROUTES } from '@constants/index';
import { useSubscription } from '@hooks/index';
import { useAuthStore } from '@store/index';
import { authService } from '@services/supabase';
import { applicationService, jobService, notificationService, savedService, userService } from '@services/api';
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
  const [profileMenuAnchorEl, setProfileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [supportOpen, setSupportOpen] = useState(false);
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
  const [resumeUnlockers, setResumeUnlockers] = useState<any[]>([]);
  const [profileViewers, setProfileViewers] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState<DashboardSectionKey>(null);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [recommendedLoading, setRecommendedLoading] = useState(false);

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

        const [downloads, views] = await Promise.all([
          getCandidateResumeUnlockCount(user.id),
          getCandidateProfileViewCount(user.id),
        ]);

        setResumeDownloadCount(downloads);
        setProfileViewCount(views);

        const skills = Array.isArray(profile?.skills) ? profile.skills : [];
        if (skills.length > 0) {
          setRecommendedLoading(true);
          const response = await jobService.getJobsBySkills(skills, 1, 5);
          setRecommendedJobs(Array.isArray(response?.data) ? response.data : []);
        } else {
          setRecommendedJobs([]);
        }
      } catch (error) {
        console.error('Failed to load candidate dashboard data:', error);
      } finally {
        setRecommendedLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.id, profile?.skills]);

  const openDetailPanel = async (section: DashboardSectionKey) => {
    if (!user?.id) return;
    if (selectedSection === section) {
      setSelectedSection(null);
      return;
    }

    setSelectedSection(section);
    if (section === 'resume' && resumeUnlockers.length === 0) {
      setSectionLoading(true);
      const items = await getCandidateResumeUnlockRecruiters(user.id);
      setResumeUnlockers(items);
      setSectionLoading(false);
    }

    if (section === 'profile' && profileViewers.length === 0) {
      setSectionLoading(true);
      const items = await getCandidateProfileViewRecruiters(user.id);
      setProfileViewers(items);
      setSectionLoading(false);
    }
  };

  const statusTone = (status?: string): 'success' | 'warning' | 'error' | 'primary' | 'default' => {
    if (status === 'shortlisted') return 'success';
    if (status === 'under_review') return 'warning';
    if (status === 'rejected') return 'error';
    if (status === 'accepted') return 'primary';
    return 'default';
  };

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

  const statCards = useMemo(
    () => [
      {
        key: 'applications' as const,
        label: 'Applications',
        value: recentApplications.length,
        caption: 'Track hiring stage updates',
        icon: WorkIcon,
        color: '#1D4ED8',
        bg: 'linear-gradient(140deg, #DBEAFE 0%, #EFF6FF 100%)',
      },
      {
        key: 'saved' as const,
        label: 'Saved Jobs',
        value: savedCount,
        caption: 'Your shortlist in one place',
        icon: BookmarkIcon,
        color: '#059669',
        bg: 'linear-gradient(140deg, #D1FAE5 0%, #ECFDF5 100%)',
      },
      {
        key: 'resume' as const,
        label: 'Resume Downloads',
        value: resumeDownloadCount ?? 0,
        caption: 'Recruiters who opened resume',
        icon: DownloadIcon,
        color: '#D97706',
        bg: 'linear-gradient(140deg, #FEF3C7 0%, #FFFBEB 100%)',
      },
      {
        key: 'profile' as const,
        label: 'Profile Views',
        value: profileViewCount ?? 0,
        caption: 'Interest from companies',
        icon: VisibilityIcon,
        color: '#BE185D',
        bg: 'linear-gradient(140deg, #FCE7F3 0%, #FDF2F8 100%)',
      },
    ],
    [profileViewCount, recentApplications.length, resumeDownloadCount, savedCount],
  );

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Card
          sx={{
            mb: 3,
            borderRadius: 5,
            overflow: 'hidden',
            background:
              'linear-gradient(130deg, rgba(15,23,42,0.95) 0%, rgba(30,64,175,0.93) 45%, rgba(14,116,144,0.92) 100%)',
            color: '#F8FAFC',
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
                  <Chip label={subscription ? 'Premium candidate' : 'Free candidate'} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700 }} />
                  <Chip label={`Profile score: ${profileCompletion}%`} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700 }} />
                </Stack>

                <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.1, mb: 1 }}>
                  Candidate command center
                </Typography>
                <Typography variant="h6" sx={{ color: 'rgba(241,245,249,0.95)', maxWidth: 720, mb: 3 }}>
                  Welcome back, {user?.name || 'Candidate'}. Your applications, recruiter interest, and smart recommendations are ready.
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Button
                    variant="contained"
                    component={RouterLink}
                    to={ROUTES.JOBS}
                    sx={{ bgcolor: '#fff', color: '#0F172A', fontWeight: 800, '&:hover': { bgcolor: '#E2E8F0' } }}
                  >
                    Discover jobs
                  </Button>
                  <Button
                    variant="outlined"
                    component={RouterLink}
                    to={ROUTES.DASHBOARD_APPLICATIONS}
                    sx={{ borderColor: 'rgba(255,255,255,0.8)', bgcolor: 'rgba(255,255,255,0.12)', color: '#fff', fontWeight: 700, '&:hover': { bgcolor: 'rgba(255,255,255,0.25)', borderColor: '#fff', color: '#fff' } }}
                  >
                    View applications
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(ROUTES.MESSAGING)}
                    sx={{ borderColor: 'rgba(255,255,255,0.8)', bgcolor: 'rgba(255,255,255,0.12)', color: '#fff', fontWeight: 700, '&:hover': { bgcolor: 'rgba(255,255,255,0.2)', borderColor: '#fff' } }}
                    startIcon={<Badge badgeContent={unreadMessagesCount} color="warning" sx={{ '& .MuiBadge-badge': { bgcolor: '#FBBF24', color: '#111827' } }}><WorkIcon /></Badge>}
                  >
                    Inbox
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(ROUTES.DASHBOARD_NOTIFICATIONS)}
                    sx={{ borderColor: 'rgba(255,255,255,0.8)', bgcolor: 'rgba(255,255,255,0.12)', color: '#fff', fontWeight: 700, '&:hover': { bgcolor: 'rgba(255,255,255,0.2)', borderColor: '#fff' } }}
                    startIcon={<Badge badgeContent={notificationsCount} color="error" sx={{ '& .MuiBadge-badge': { bgcolor: '#EF4444', color: '#fff' } }}><NotificationsIcon /></Badge>}
                  >
                    Alerts
                  </Button>
                </Stack>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ borderRadius: 4, background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.2 }}>
                      <IconButton onClick={openProfileMenu} size="small" sx={{ p: 0 }}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.35)' }}>
                          {(user?.name || 'U').charAt(0).toUpperCase()}
                        </Avatar>
                      </IconButton>
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#FFFFFF', mb: 1.5, fontSize: '1rem' }}>
                      📈 Profile momentum
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={profileCompletion}
                      sx={{ height: 10, borderRadius: 8, mb: 2, bgcolor: 'rgba(255,255,255,0.15)', '& .MuiLinearProgress-bar': { bgcolor: 'linear-gradient(90deg, #FBBF24, #F59E0B)', borderRadius: 8 } }}
                    />
                    <Typography variant="body2" sx={{ color: '#F0F4F8', mb: 2.5, fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.5 }}>
                      {profileCompletion < 60
                        ? '✨ Add details to improve visibility.'
                        : profileCompletion < 90
                        ? '🚀 Great progress. Add final missing fields.'
                        : '⭐ Excellent. Recruiter-ready profile.'}
                    </Typography>
                    <Button component={RouterLink} to={ROUTES.DASHBOARD_PROFILE} variant="contained" fullWidth sx={{ bgcolor: '#FBBF24', color: '#111827', fontWeight: 800, '&:hover': { bgcolor: '#F59E0B', boxShadow: '0 8px 16px rgba(251, 191, 36, 0.3)' } }}>
                      Improve profile
                    </Button>
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
                      <PersonIcon sx={{ fontSize: 18 }} />
                      Customer Care
                      {ticketNotifCount > 0 ? (
                        <Box component="span" sx={{ bgcolor: 'error.main', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, ml: 0.5 }}>{ticketNotifCount}</Box>
                      ) : null}
                    </Box>
                  </MenuItem>
                  <MenuItem onClick={handleSignout} sx={{ color: 'error.main' }}>
                    <LogoutIcon sx={{ mr: 1, fontSize: 18 }} />
                    Sign out
                  </MenuItem>
                </Menu>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {statCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={stat.label}>
              <MotionCard
                onClick={() => openDetailPanel(stat.key)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 4,
                  border: selectedSection === stat.key ? `2px solid ${stat.color}` : '1px solid rgba(148,163,184,0.32)',
                  background: stat.bg,
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: '#334155', fontWeight: 800 }}>
                      {stat.label}
                    </Typography>
                    <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: `${stat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <stat.icon sx={{ color: stat.color }} />
                    </Box>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569' }}>
                    {stat.caption}
                  </Typography>
                </CardContent>
              </MotionCard>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 4, minHeight: 460 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Live insights panel
                  </Typography>
                  {selectedSection ? <Button onClick={() => setSelectedSection(null)}>Clear</Button> : null}
                </Box>

                {!selectedSection ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    Tap any stat card above to load the matching details here.
                  </Typography>
                ) : null}

                {sectionLoading ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Loading details...
                  </Typography>
                ) : null}

                {selectedSection === 'applications' ? (
                  <List>
                    {(recentApplications.length ? recentApplications : [{} as any]).map((application: any, index: number) => (
                      <ListItem key={application.id || `empty-${index}`} sx={{ px: 0 }}>
                        {recentApplications.length === 0 ? (
                          <ListItemText
                            primary="No applications yet"
                            secondary="Apply to jobs to start tracking your hiring pipeline."
                          />
                        ) : (
                          <>
                            <ListItemText
                              primary={application.jobs?.title || 'Unknown role'}
                              secondary={`${application.jobs?.company_name || 'Unknown company'}${application.jobs?.location ? ` - ${application.jobs.location}` : ''}`}
                            />
                            <Box sx={{ textAlign: 'right' }}>
                              <Chip size="small" label={(application.status || 'applied').replace('_', ' ').toUpperCase()} color={statusTone(application.status)} />
                              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.4 }}>
                                {application.applied_at ? formatDate(application.applied_at) : 'Date unavailable'}
                              </Typography>
                            </Box>
                          </>
                        )}
                      </ListItem>
                    ))}
                  </List>
                ) : null}

                {selectedSection === 'saved' ? (
                  <List>
                    {(savedJobs.length ? savedJobs : [{} as any]).map((item: any, index: number) => (
                      <ListItem key={item.id || `saved-empty-${index}`} sx={{ px: 0 }}>
                        {savedJobs.length === 0 ? (
                          <ListItemText
                            primary="No saved jobs yet"
                            secondary="Bookmark roles to revisit and compare them later."
                          />
                        ) : (
                          <>
                            <ListItemText
                              primary={item.jobs?.title || 'Role unavailable'}
                              secondary={`${item.jobs?.company_name || 'Company unavailable'}${item.jobs?.location ? ` - ${item.jobs.location}` : ''}`}
                            />
                            {item.jobs?.id ? (
                              <Button component={RouterLink} to={ROUTES.JOB_DETAILS.replace(':id', item.jobs.id)} size="small" endIcon={<ArrowForwardIcon fontSize="small" />}>
                                Open
                              </Button>
                            ) : null}
                          </>
                        )}
                      </ListItem>
                    ))}
                  </List>
                ) : null}

                {selectedSection === 'resume' ? (
                  <List>
                    {(resumeUnlockers.length ? resumeUnlockers : [{} as any]).map((item: any, index: number) => (
                      <ListItem key={item.recruiter_id || `resume-empty-${index}`} sx={{ px: 0 }}>
                        {resumeUnlockers.length === 0 ? (
                          <ListItemText
                            primary="No resume downloads yet"
                            secondary="Recruiters who download your resume appear here."
                          />
                        ) : (
                          <>
                            <Avatar sx={{ bgcolor: '#FDE68A', color: '#7C2D12', mr: 1.5 }}>{(item.recruiter_name || 'R').charAt(0).toUpperCase()}</Avatar>
                            <ListItemText
                              primary={item.recruiter_name || 'Recruiter'}
                              secondary={`${item.company_name || 'Recruiter company'} - ${item.total_unlocks || 0} downloads`}
                            />
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {item.last_unlocked_at ? formatDate(item.last_unlocked_at) : 'No date'}
                            </Typography>
                          </>
                        )}
                      </ListItem>
                    ))}
                  </List>
                ) : null}

                {selectedSection === 'profile' ? (
                  <List>
                    {(profileViewers.length ? profileViewers : [{} as any]).map((item: any, index: number) => (
                      <ListItem key={item.recruiter_id || `view-empty-${index}`} sx={{ px: 0 }}>
                        {profileViewers.length === 0 ? (
                          <ListItemText
                            primary="No profile views yet"
                            secondary="Profile visits from recruiters will appear here."
                          />
                        ) : (
                          <>
                            <Avatar sx={{ bgcolor: '#E0E7FF', color: '#3730A3', mr: 1.5 }}>{(item.recruiter_name || 'R').charAt(0).toUpperCase()}</Avatar>
                            <ListItemText
                              primary={item.recruiter_name || 'Recruiter'}
                              secondary={`${item.company_name || 'Recruiter company'} - ${item.total_views || 0} views`}
                            />
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {item.last_viewed_at ? formatDate(item.last_viewed_at) : 'No date'}
                            </Typography>
                          </>
                        )}
                      </ListItem>
                    ))}
                  </List>
                ) : null}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Stack spacing={2.5}>
              <Card sx={{ borderRadius: 4 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                    Candidate shortcuts
                  </Typography>
                  <Stack spacing={1.2}>
                    <Button component={RouterLink} to={ROUTES.DASHBOARD_PROFILE} variant="contained" startIcon={<PersonIcon />} sx={{ justifyContent: 'flex-start' }}>
                      Edit profile
                    </Button>
                    <Button component={RouterLink} to={ROUTES.DASHBOARD_SAVED_JOBS} variant="outlined" startIcon={<BookmarkIcon />} sx={{ justifyContent: 'flex-start' }}>
                      Saved jobs
                    </Button>
                    <Button component={RouterLink} to={ROUTES.DASHBOARD_APPLICATIONS} variant="outlined" startIcon={<WorkIcon />} sx={{ justifyContent: 'flex-start' }}>
                      My applications
                    </Button>
                    <Button component={RouterLink} to={ROUTES.DASHBOARD_NOTIFICATIONS} variant="outlined" startIcon={<NotificationsIcon />} sx={{ justifyContent: 'flex-start' }}>
                      Notifications
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              <Card
                sx={{
                  borderRadius: 4,
                  background: subscription
                    ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)'
                    : 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
                }}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.2 }}>
                    Subscription status
                  </Typography>

                  {subscription ? (
                    <>
                      <Chip label={`${subscription.plan?.toUpperCase()} plan active`} color="success" sx={{ mb: 1.2 }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                        Valid until: {subscription.end_date}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Premium candidate features are enabled for your account.
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                        Upgrade for remote jobs, premium recommendations, and advanced career tools.
                      </Typography>
                      <Button component={RouterLink} to={ROUTES.PRICING} variant="contained" fullWidth>
                        View pricing plans
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: 4 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.2 }}>
                    Smart recommendations
                  </Typography>
                  {recommendedLoading ? (
                    <LinearProgress />
                  ) : recommendedJobs.length > 0 ? (
                    <List>
                      {recommendedJobs.map((job: any) => (
                        <ListItem key={job.id} sx={{ px: 0 }}>
                          <ListItemText
                            primary={job.title || 'Role'}
                            secondary={`${job.company_name || 'Company'}${job.location ? ` - ${job.location}` : ''}`}
                          />
                          <Button onClick={() => navigate(ROUTES.JOB_DETAILS.replace(':id', String(job.id)))} size="small">
                            View
                          </Button>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.2 }}>
                      Add skills in profile to get tailored role matches.
                    </Typography>
                  )}
                  <Button component={RouterLink} to="/dashboard/recommended-jobs" endIcon={<ArrowForwardIcon />}>
                    Explore all matches
                  </Button>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>

        <Card sx={{ mt: 3, borderRadius: 4, bgcolor: theme.palette.background.paper }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Latest application activity
              </Typography>
              <Button component={RouterLink} to={ROUTES.DASHBOARD_APPLICATIONS}>
                View all ({recentApplications.length})
              </Button>
            </Box>

            <List>
              {recentApplications.length === 0 ? (
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="No recent applications"
                    secondary="Start applying to see your latest activity feed here."
                  />
                </ListItem>
              ) : (
                recentApplications.slice(0, 4).map((application) => (
                  <ListItem key={application.id} sx={{ px: 0 }}>
                    <ListItemText
                      primary={application.jobs?.title || 'Unknown role'}
                      secondary={application.jobs?.company_name || 'Unknown company'}
                    />
                    <Box sx={{ textAlign: 'right' }}>
                      <Chip size="small" label={(application.status || 'applied').replace('_', ' ').toUpperCase()} color={statusTone(application.status)} />
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.4 }}>
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
      </Container>
    </Layout>
  );
};
