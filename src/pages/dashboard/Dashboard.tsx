import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  LinearProgress,
  Badge,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Work as WorkIcon,
  Bookmark as BookmarkIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { Layout } from '@components/layout/Layout';
import { useAuthStore } from '@store/index';
import { useSubscription } from '@hooks/index';
import { ROUTES } from '@constants/index';
import { calculateProfileCompletion, formatDate, getProfileCompletionGradient } from '@utils/index';
import { useTheme } from '@mui/material/styles';
import { getCandidateProfileViewCount, getCandidateResumeUnlockCount, getCandidateProfileViewRecruiters, getCandidateResumeUnlockRecruiters } from '@utils/resumeUnlocks';
import { applicationService, savedService, notificationService, userService, jobService } from '@services/api';
import { messagingService } from '@services/messaging';
import { INTERVIEW_ROLES } from '@constants/index';

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

type DashboardSectionKey = 'applications' | 'saved' | 'resume' | 'profile' | null;

type SavedJobItem = {
  id: string;
  jobs?: {
    id?: string;
    title?: string;
    company_name?: string;
    location?: string;
  };
};

const MotionCard = motion(Card);

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { subscription } = useSubscription(user?.id || null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [profile, setProfile] = useState<any | null>(null);
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJobItem[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [skills, setSkills] = useState<string[]>([]);
  const [resumeDownloadCount, setResumeDownloadCount] = useState<number | null>(null);
  const [profileViewCount, setProfileViewCount] = useState<number | null>(null);
  const [resumeUnlockers, setResumeUnlockers] = useState<any[]>([]);
  const [profileViewers, setProfileViewers] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState<DashboardSectionKey>(null);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [recommendedLoading, setRecommendedLoading] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();

  const handleSectionSelect = async (section: DashboardSectionKey) => {
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


  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      try {
        const profile = await userService.getProfile(user.id);
        setProfile(profile || null);
        setProfileCompletion(
          calculateProfileCompletion({
            fullName: profile?.name || user.name,
            email: profile?.email || user.email,
            phone: profile?.phone,
            gender: profile?.gender,
            dateOfBirth: profile?.date_of_birth || profile?.dateOfBirth,
            address: profile?.address,
            city: profile?.city,
            state: profile?.state,
            country: profile?.country,
            bio: profile?.bio,
            experience: profile?.experience,
            skills: profile?.skills || [],
            education: profile?.education_details || profile?.education || [],
            workExperience: profile?.work_experience || profile?.workExperience || [],
            resumeUrl: profile?.resume_url || profile?.resumeUrl,
            socialLinks: profile?.linkedin_url || profile?.portfolio_url || profile?.github_url,
          })
        );
        // extract skills for personalized content
        const userSkills = profile?.skills || profile?.skills || [];
        setSkills(Array.isArray(userSkills) ? userSkills : String(userSkills || '').split(',').map((s: string) => s.trim()).filter(Boolean));
      } catch (err) {
        console.error('Failed to load profile for dashboard completion:', err);
      }
    };

    loadProfile();
  }, [user?.id, user?.name, user?.email]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) return;
      try {
        const [applications, savedJobs, notifications, conversations] = await Promise.all([
          applicationService.getUserApplications(user.id),
          savedService.getUserSavedJobs(user.id),
          notificationService.getUnreadNotifications(user.id),
          messagingService.getConversations(user.id),
        ]);

        setRecentApplications(applications || []);
        setSavedJobs(savedJobs || []);
        setSavedCount((savedJobs || []).length);
        setNotificationsCount((notifications || []).length);
        setUnreadMessagesCount(
          (((conversations as any[]) || [])
            .reduce((count, conv) => count + (conv.unreadCount || 0), 0))
        );

        try {
          const [downloads, views] = await Promise.all([
            getCandidateResumeUnlockCount(user.id),
            getCandidateProfileViewCount(user.id),
          ]);
          setResumeDownloadCount(downloads);
          setProfileViewCount(views);
        } catch (err) {
          console.error('Failed to load recruiter interaction counts:', err);
          setResumeDownloadCount(0);
          setProfileViewCount(0);
        }

        // load recommended jobs based on skills
        try {
          const skillList = (profile?.skills && Array.isArray(profile.skills) && profile.skills.length) ? profile.skills : (skills || []);
          if (skillList && skillList.length > 0) {
            setRecommendedLoading(true);
            const res = await jobService.getJobsBySkills(skillList, 1, 6);
            setRecommendedJobs(res.data || []);
          }
        } catch (err) {
          console.error('Failed to load recommended jobs by skills:', err);
        } finally {
          setRecommendedLoading(false);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    };

    loadDashboardData();
  }, [user?.id, profile?.skills, skills]);

  const stats: Array<{ key: DashboardSectionKey; label: string; value: React.ReactNode; icon: any; color: string; bg: string }> = [
    { key: 'applications', label: 'Applications', value: recentApplications.length, icon: WorkIcon, color: '#1D4ED8', bg: 'linear-gradient(135deg, rgba(59,130,246,0.16), rgba(59,130,246,0.05))' },
    { key: 'saved', label: 'Saved Jobs', value: savedCount, icon: BookmarkIcon, color: '#10B981', bg: 'linear-gradient(135deg, rgba(16,185,129,0.16), rgba(16,185,129,0.05))' },
    { key: 'resume', label: 'Resume Downloads', value: resumeDownloadCount ?? 0, icon: DownloadIcon, color: '#F59E0B', bg: 'linear-gradient(135deg, rgba(245,158,11,0.16), rgba(245,158,11,0.05))' },
    { key: 'profile', label: 'Profile Views', value: profileViewCount ?? 0, icon: VisibilityIcon, color: '#8B5CF6', bg: 'linear-gradient(135deg, rgba(139,92,246,0.16), rgba(139,92,246,0.05))' },
  ];


  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
            Welcome, {user?.name}!
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
            Here's your job search dashboard
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={() => navigate(ROUTES.MESSAGING)}
              startIcon={
                <Badge badgeContent={unreadMessagesCount} color="primary">
                  💬
                </Badge>
              }
            >
              Inbox
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate(ROUTES.DASHBOARD_NOTIFICATIONS)}
              startIcon={
                <Badge badgeContent={notificationsCount} color="error">
                  🔔
                </Badge>
              }
            >
              Notifications
            </Button>
          </Box>
        </Box>

        <Card sx={{ mb: 4, p: 3, borderRadius: 4, boxShadow: '0 20px 60px rgba(15,23,42,0.06)', background: theme.palette.background.paper }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
            Quick candidate overview
          </Typography>
          <Grid container spacing={2}>
            {stats.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={stat.label}>
                <MotionCard
                  onClick={() => handleSectionSelect(stat.key)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  sx={{
                    cursor: 'pointer',
                    background: stat.bg,
                    borderRadius: 3,
                    border: selectedSection === stat.key ? `2px solid ${stat.color}` : '1px solid rgba(145,158,171,0.16)',
                    boxShadow: selectedSection === stat.key ? `0 18px 40px ${stat.color}20` : 'none',
                  }}
                >
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1, minHeight: 140 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                        {stat.label}
                      </Typography>
                      <Box sx={{ width: 44, height: 44, borderRadius: 2, background: `${stat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <stat.icon sx={{ color: stat.color, fontSize: 24 }} />
                      </Box>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827' }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Tap to open details.
                    </Typography>
                  </CardContent>
                </MotionCard>
              </Grid>
            ))}
          </Grid>

          <Card sx={{ mt: 3, borderRadius: 3, p: 2, background: theme.palette.mode === 'dark' ? '#0F172A' : '#F8FAFC' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Quick view
                </Typography>
                {selectedSection ? (
                  <Button variant="outlined" onClick={() => setSelectedSection(null)}>
                    Close
                  </Button>
                ) : null}
              </Box>
              {!selectedSection ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Select any of the four cards above to preview the matching list right here.
                </Typography>
              ) : sectionLoading ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Loading details...
                </Typography>
              ) : selectedSection === 'applications' ? (
                <List>
                  {recentApplications.length ? (
                    recentApplications.map((application) => (
                      <ListItem key={application.id} sx={{ px: 0 }}>
                        <ListItemText
                          primary={application.jobs?.title || 'Unknown role'}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" sx={{ color: 'text.secondary' }}>
                                {application.jobs?.company_name || 'Unknown company'}
                              </Typography>
                              {application.jobs?.location ? ` • ${application.jobs.location}` : ''}
                            </>
                          }
                        />
                        <Box sx={{ textAlign: 'right' }}>
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
                          />
                          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                            {application.applied_at ? formatDate(application.applied_at) : 'Date unavailable'}
                          </Typography>
                        </Box>
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText
                        primary="No applications yet"
                        secondary="Apply to jobs to see your application history here."
                      />
                    </ListItem>
                  )}
                </List>
              ) : selectedSection === 'saved' ? (
                <List>
                  {savedJobs.length ? (
                    savedJobs.map((item) => (
                      <ListItem key={item.id} sx={{ px: 0 }}>
                        <ListItemText
                          primary={item.jobs?.title || 'Role unavailable'}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" sx={{ color: 'text.secondary' }}>
                                {item.jobs?.company_name || 'Company unavailable'}
                              </Typography>
                              {item.jobs?.location ? ` • ${item.jobs.location}` : ''}
                            </>
                          }
                        />
                        {item.jobs?.id ? (
                          <Button component={RouterLink} to={ROUTES.JOB_DETAILS.replace(':id', item.jobs.id)} size="small">
                            View Job
                          </Button>
                        ) : null}
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText
                        primary="No saved jobs yet"
                        secondary="Save a job to revisit it later."
                      />
                    </ListItem>
                  )}
                </List>
              ) : selectedSection === 'resume' ? (
                <List>
                  {resumeUnlockers.length ? (
                    resumeUnlockers.map((item, index) => (
                      <ListItem key={`${item.recruiter_id}-${index}`} sx={{ px: 0 }}>
                        <ListItemText
                          primary={item.recruiter_name || 'Recruiter'}
                          secondary={`${item.company_name || 'Recruiter company'} • ${item.total_unlocks} resume downloads`}
                        />
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {item.last_unlocked_at ? formatDate(item.last_unlocked_at) : 'No date'}
                        </Typography>
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText
                        primary="No resume downloads yet"
                        secondary="Recruiters will appear here once they download your resume."
                      />
                    </ListItem>
                  )}
                </List>
              ) : selectedSection === 'profile' ? (
                <List>
                  {profileViewers.length ? (
                    profileViewers.map((item, index) => (
                      <ListItem key={`${item.recruiter_id}-${index}`} sx={{ px: 0 }}>
                        <ListItemText
                          primary={item.recruiter_name || 'Recruiter'}
                          secondary={`${item.company_name || 'Recruiter company'} • ${item.total_views} profile views`}
                        />
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {item.last_viewed_at ? formatDate(item.last_viewed_at) : 'No date'}
                        </Typography>
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText
                        primary="No profile views yet"
                        secondary="Recruiter views are shown here as they happen."
                      />
                    </ListItem>
                  )}
                </List>
              ) : null}
            </CardContent>
          </Card>
        </Card>

        <Card
          sx={{
            mb: 4,
            background: getProfileCompletionGradient(profileCompletion),
            color: '#fff',
            border: '1px solid transparent',
            boxShadow: '0 20px 40px rgba(15,23,42,0.08)',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff' }}>
                  Complete Your Profile
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                  Track your profile readiness and get seen by employers.
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff' }}>
                  {profileCompletion}%
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  {profileCompletion === 100 ? 'Excellent profile' : profileCompletion < 60 ? 'Needs improvement' : 'Almost there'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ width: '100%', height: 16, borderRadius: 8, background: 'rgba(255,255,255,0.2)', overflow: 'hidden', mb: 3 }}>
              <Box
                sx={{
                  width: `${profileCompletion}%`,
                  height: '100%',
                  background: 'rgba(255,255,255,0.95)',
                  transition: 'width 0.3s ease',
                }}
              />
            </Box>
            <Button component={RouterLink} to={ROUTES.DASHBOARD_PROFILE} variant="contained" sx={{ background: '#fff', color: '#0F172A' }}>
              Update Profile
            </Button>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Quick Actions
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    component={RouterLink}
                    to={ROUTES.JOBS}
                    variant="contained"
                    fullWidth
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Browse Jobs
                  </Button>
                  <Button
                    component={RouterLink}
                    to={ROUTES.DASHBOARD_SAVED_JOBS}
                    variant="outlined"
                    fullWidth
                    startIcon={<BookmarkIcon />}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Saved Jobs
                  </Button>
                  <Button
                    component={RouterLink}
                    to={ROUTES.DASHBOARD_APPLICATIONS}
                    variant="outlined"
                    fullWidth
                    startIcon={<WorkIcon />}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    My Applications
                  </Button>
                  <Button
                    component={RouterLink}
                    to={ROUTES.DASHBOARD_NOTIFICATIONS}
                    variant="outlined"
                    fullWidth
                    startIcon={<NotificationsIcon />}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Notifications
                  </Button>
                  <Button
                    component={RouterLink}
                    to={ROUTES.DASHBOARD_PROFILE}
                    variant="outlined"
                    fullWidth
                    startIcon={<PersonIcon />}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    View Profile
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ background: subscription ? '#ECFDF5' : '#EFF6FF' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Subscription Status
                </Typography>

                {subscription ? (
                  <>
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={`${subscription.plan?.toUpperCase()} PLAN`}
                        color="success"
                        sx={{ mb: 2 }}
                      />
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                        Valid until: {subscription.end_date}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        You have access to all premium features
                      </Typography>
                    </Box>
                    <Button variant="outlined" fullWidth>
                      Upgrade Plan
                    </Button>
                  </>
                ) : (
                  <>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                      Unlock premium features and access exclusive job listings
                    </Typography>
                    <Button
                      component={RouterLink}
                      to={ROUTES.PRICING}
                      variant="contained"
                      fullWidth
                    >
                      View Pricing Plans
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        {/* Personalized sections: Skills, Recommended Jobs, Interview Prep */}
        <Grid container spacing={3} sx={{ mt: 4 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, p: 2, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Recruiter Interest
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                  Track how many recruiters have downloaded your resume and viewed your profile.
                </Typography>
                <Box sx={{ display: 'grid', gap: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, background: 'rgba(16, 185, 129, 0.08)', borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Resume downloads
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {resumeDownloadCount === null ? '—' : resumeDownloadCount}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, background: 'rgba(59, 130, 246, 0.08)', borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Recruiter profile views
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {profileViewCount === null ? '—' : profileViewCount}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button component={RouterLink} to={ROUTES.DASHBOARD_PROFILE} variant="contained" sx={{ textTransform: 'none' }}>
                    Edit Profile
                  </Button>
                  <Button variant="outlined" component={RouterLink} to={ROUTES.JOBS} sx={{ textTransform: 'none' }}>
                    Browse Jobs
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 3, p: 2, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Recommended Jobs For You
                </Typography>
                {recommendedLoading ? (
                  <LinearProgress />
                ) : recommendedJobs && recommendedJobs.length ? (
                  <List>
                    {recommendedJobs.map((job: any) => (
                      <ListItem key={job.id} button component={RouterLink} to={`/jobs/${job.id}`} sx={{ px: 0 }}>
                        <ListItemText
                          primary={job.title}
                          secondary={`${job.company_name} • ${job.location || 'Location'}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No recommendations yet. Improve your profile skills to receive tailored job suggestions.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: 3, p: 2, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Interview Prep
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  Role-specific interview questions from AmbitionBox matched to your skills.
                </Typography>
                <List>
                  {INTERVIEW_ROLES.filter((r) => skills.some((sk) => r.title.toLowerCase().includes(sk.toLowerCase()) || sk.toLowerCase().includes(r.title.toLowerCase().split(' ')[0]))).slice(0, 6).map((role) => (
                    <ListItem key={role.title} button onClick={() => window.open(role.url, '_blank')} sx={{ px: 0 }}>
                      <ListItemText primary={role.title} secondary={role.count} />
                    </ListItem>
                  ))}
                </List>
                <Button variant="text" component={RouterLink} to={ROUTES.JOBS} sx={{ mt: 1 }}>
                  Explore more interview roles
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Recent Applications
              </Typography>
              <Button component={RouterLink} to={ROUTES.DASHBOARD_APPLICATIONS} variant="text" size="small">
                View All ({recentApplications.length})
              </Button>
            </Box>

            <List>
              {recentApplications.length === 0 ? (
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="No applications yet"
                    secondary="Apply to jobs to see your recent application activity here."
                  />
                </ListItem>
              ) : (
                recentApplications.slice(0, 3).map((application, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemText
                      primary={application.jobs?.title || 'Unknown role'}
                      secondary={application.jobs?.company_name || 'Unknown company'}
                    />
                    <Box sx={{ textAlign: 'right' }}>
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
                      />
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                        {application.applied_at ? formatDate(application.applied_at) : 'Date unavailable'}
                      </Typography>
                    </Box>
                  </ListItem>
                ))
              )}
            </List>
          </CardContent>
        </Card>
      </Container>
    </Layout>
  );
};
