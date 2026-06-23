import React, { Suspense, useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  CircularProgress,
  IconButton,
  Badge,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Add as AddIcon,
  Business as BusinessIcon,
  BusinessCenter as BusinessCenterIcon,
  Search as SearchIcon,
  Chat as ChatIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Notifications as NotificationsIcon,
  AutoAwesome as AutoAwesomeIcon,
  Work as WorkIcon,
  AccountTree as AccountTreeIcon,
  LocalOffer as TagIcon,
  FolderSpecial as PoolIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@components/layout/Layout';
import { useAuthStore } from '@store/index';
import { ROUTES } from '@constants/index';
import { recruiterService, statsService, chatService, notificationService, jobService } from '@services/api';
import { messagingService } from '@services/messaging';
import { JobPostingForm } from '@components/recruiter/JobPostingForm';
import { ManageJobs } from '@components/recruiter/ManageJobs';
import { ViewApplicants } from '@components/recruiter/ViewApplicants';
import { CompanyProfile } from '@components/recruiter/CompanyProfile';
import { CandidateSearch } from '@components/recruiter/CandidateSearch';
import { TagManager } from '@components/recruiter/TagManager';
import { TalentPool } from '@components/recruiter/TalentPool';
import toast from 'react-hot-toast';
import type { Job } from '@types';

// ATS Pipeline
import PipelineBoard from '../../features/ats/PipelineBoard';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`recruiter-tabpanel-${index}`}
      aria-labelledby={`recruiter-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const MotionCard = motion(Card);
const RecommendedCandidates = React.lazy(() =>
  import('@components/recruiter/RecommendedCandidates').then((module) => ({
    default: module.RecommendedCandidates,
  }))
);

export const RecruiterDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [currentTab, setCurrentTab] = useState(0);
  const [jobPostingFormOpen, setJobPostingFormOpen] = useState(false);
  const [stats, setStats] = useState({
    active_jobs: 0,
    total_jobs: 0,
    total_applicants: 0,
    shortlisted: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recruiterProfile, setRecruiterProfile] = useState<any>(null);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState<{ id: string; name: string } | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recommendedJobId, setRecommendedJobId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, profileData, unreadNotif, conversations, recruiterJobs] = await Promise.all([
        statsService.getRecruiterStats(user?.id || ''),
        recruiterService.getRecruiterProfile(user?.id || ''),
        notificationService.getUnreadNotifications(user?.id || ''),
        messagingService.getConversations(user?.id || ''),
        jobService.getRecruiterJobs(user?.id || ''),
      ]);

      setStats(statsData);
      setRecruiterProfile(profileData);
      setJobs(recruiterJobs || []);
      setRecommendedJobId((current) => current || recruiterJobs?.[0]?.id || '');
      setNotificationsCount((unreadNotif || []).length);
      setUnreadMessagesCount(
        (((conversations as any[]) || [])).reduce((count, conv) => count + (conv.unreadCount || 0), 0)
      );
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleJobCreated = () => {
    setJobPostingFormOpen(false);
    fetchData();
  };

  const handleChatClick = (candidateId: string, candidateName: string) => {
    setSelectedChatUser({ id: candidateId, name: candidateName });
    setChatDialogOpen(true);
  };

  const handleSendMessage = async () => {
    if (!selectedChatUser || !chatMessage.trim() || !user?.id) return;

    setSendingMessage(true);
    try {
      await chatService.sendMessage(user.id, selectedChatUser.id, chatMessage, 'recruiter');
      setChatMessage('');
      toast.success('Message sent successfully!');
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Container>
      </Layout>
    );
  }

  const averageApplicants = stats.total_jobs ? Math.round(stats.total_applicants / stats.total_jobs) : 0;
  const shortlistRate = stats.total_applicants ? Math.round((stats.shortlisted / stats.total_applicants) * 100) : 0;
  const rejectionRate = stats.total_applicants ? Math.round((stats.rejected / stats.total_applicants) * 100) : 0;
  const activitySummary =
    stats.total_jobs === 0
      ? 'No jobs posted yet. Post a job to start winning top talent.'
      : `You currently have ${stats.active_jobs} active job posting(s) and ${stats.total_applicants} applicants across ${stats.total_jobs} jobs. Shortlist rate is ${shortlistRate}% and average applicants per job is ${averageApplicants}.`;

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box
          sx={{
            mb: 4,
            p: 4,
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(55, 48, 163, 0.12), rgba(245, 158, 11, 0.12))',
            border: '1px solid rgba(245, 158, 11, 0.18)',
            boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08)',
          }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                  Recruiter Dashboard
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2, maxWidth: 720 }}>
                  Welcome back, {recruiterProfile?.company_name || user?.name}! Manage your hiring with elevated clarity and curated insights.
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <IconButton
                  onClick={() => navigate(ROUTES.MESSAGING)}
                  sx={{ background: 'rgba(79,70,229,0.08)' }}
                >
                  <Badge badgeContent={unreadMessagesCount} color="primary">
                    <ChatIcon />
                  </Badge>
                </IconButton>
                <IconButton
                  onClick={() => navigate(ROUTES.DASHBOARD_NOTIFICATIONS)}
                  sx={{ background: 'rgba(245,158,11,0.08)' }}
                >
                  <Badge badgeContent={notificationsCount} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Box>
            </Box>
          </Box>

        {/* Quick Actions */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setJobPostingFormOpen(true)}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(135deg, #1D4ED8 0%, #1e40af 100%)',
                  fontWeight: 600,
                }}
              >
                Post New Job
              </Button>
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<SearchIcon />}
                onClick={() => setCurrentTab(5)}
                sx={{ py: 1.5, fontWeight: 600 }}
              >
                Search Candidates
              </Button>
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<BusinessIcon />}
                onClick={() => setCurrentTab(2)}
                sx={{ py: 1.5, fontWeight: 600 }}
              >
                Company Profile
              </Button>
            </motion.div>
          </Grid>
        </Grid>

        {/* Tabs Section */}
        <Card
          sx={{
            boxShadow: '0 28px 70px rgba(15, 23, 42, 0.08)',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ background: 'linear-gradient(90deg, rgba(59,130,246,0.1), rgba(245,158,11,0.1))' }}>
            <Tabs
              value={currentTab}
              onChange={(_, newValue) => setCurrentTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                overflowX: 'auto',
                '& .MuiTabs-flexContainer': {
                  flexWrap: 'nowrap',
                },
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 700,
                  minHeight: 56,
                },
                '& .Mui-selected': { color: '#1D4ED8' },
                '& .MuiTabs-indicator': { backgroundColor: '#1D4ED8', height: 4, borderRadius: 2 },
              }}
            >
              <Tab label="Dashboard Overview" id="recruiter-tab-0" aria-controls="recruiter-tabpanel-0" icon={<DashboardIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
              <Tab label="Manage Jobs" id="recruiter-tab-1" aria-controls="recruiter-tabpanel-1" icon={<WorkIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
              <Tab label="Company Profile" id="recruiter-tab-2" aria-controls="recruiter-tabpanel-2" icon={<BusinessCenterIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
              <Tab label="View Applicants" id="recruiter-tab-3" aria-controls="recruiter-tabpanel-3" icon={<PeopleIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
              <Tab label="AI Recommended" id="recruiter-tab-4" aria-controls="recruiter-tabpanel-4" icon={<AutoAwesomeIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
              <Tab label="Candidate Tags" id="recruiter-tab-5" aria-controls="recruiter-tabpanel-5" icon={<TagIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
              <Tab label="Find Candidates" id="recruiter-tab-6" aria-controls="recruiter-tabpanel-6" icon={<SearchIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
              <Tab label="Talent Pool" id="recruiter-tab-7" aria-controls="recruiter-tabpanel-7" icon={<PoolIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
              <Tab label="ATS Pipeline" id="recruiter-tab-8" aria-controls="recruiter-tabpanel-8" icon={<AccountTreeIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
            </Tabs>
          </Box>

          <CardContent>
            {/* Dashboard Overview Tab */}
            <TabPanel value={currentTab} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <MotionCard initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                        Dashboard Overview
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.8 }}>
                        {activitySummary}
                      </Typography>

                      <Grid container spacing={2}>
                        {[
                          { label: 'Average Applicants / Job', value: averageApplicants, accent: '#A78BFA' },
                          { label: 'Shortlist Rate', value: `${shortlistRate}%`, accent: '#FBBF24' },
                          { label: 'Rejection Rate', value: `${rejectionRate}%`, accent: '#EF4444' },
                          { label: 'Active Job Pulse', value: stats.active_jobs, accent: '#22C55E' },
                        ].map((item) => (
                          <Grid item xs={12} sm={6} md={3} key={item.label}>
                            <Card
                              sx={{
                                background: `${item.accent}12`,
                                border: `1px solid ${item.accent}33`,
                                boxShadow: '0 18px 40px rgba(15, 23, 42, 0.06)',
                                borderRadius: 3,
                              }}
                            >
                              <CardContent>
                                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1, fontWeight: 600 }}>
                                  {item.label}
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: item.accent }}>
                                  {item.value}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </MotionCard>
                </Grid>

                <Grid item xs={12} md={6}>
                  <MotionCard initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                        Recent Activity
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        {stats.total_jobs === 0
                          ? 'No jobs posted yet. Click "Post New Job" to get started and begin attracting top candidates.'
                          : `You currently manage ${stats.total_jobs} job postings with ${stats.total_applicants} total applicants. Stay focused on the roles that are driving the most interest.`}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                        • Keep high-priority openings active to capture qualified talent quickly.
                        <br />
                        • Shortlist strong applicants early to move faster than competing employers.
                        <br />
                        • Update role descriptions once per week to keep candidate flow fresh.
                      </Typography>
                    </CardContent>
                  </MotionCard>
                </Grid>

                <Grid item xs={12} md={6}>
                  <MotionCard initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                        Recruitment Insights
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        Use this dashboard to evaluate the health of your hiring funnel. Focus on roles with growing applicant volume and shorter shortlist ratios for faster outcomes.
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                        • Update your company profile regularly to build trust.
                        <br />
                        • Review applicant status daily for maximum efficiency.
                        <br />
                        • Leverage chat to convert top candidates before they accept other offers.
                      </Typography>
                    </CardContent>
                  </MotionCard>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Manage Jobs Tab */}
            <TabPanel value={currentTab} index={1}>
              {user?.id && (
                <ManageJobs
                  recruiterId={user.id}
                  onJobsChange={fetchData}
                />
              )}
            </TabPanel>

            {/* Company Profile Tab */}
            <TabPanel value={currentTab} index={2}>
              {user?.id && (
                <CompanyProfile
                  recruiterId={user.id}
                  onProfileUpdate={fetchData}
                />
              )}
            </TabPanel>

            {/* View Applicants Tab */}
            <TabPanel value={currentTab} index={3}>
              {user?.id && (
                <ViewApplicants
                  recruiterId={user.id}
                  onChatClick={handleChatClick}
                />
              )}
            </TabPanel>

            {/* AI Recommended Candidates Tab */}
            <TabPanel value={currentTab} index={4}>
              {user?.id && (
                jobs.length === 0 ? (
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        No jobs available for recommendations
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Post a job first to see AI recommended candidates.
                      </Typography>
                      <Button variant="contained" startIcon={<AddIcon />} onClick={() => setJobPostingFormOpen(true)}>
                        Post New Job
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Box>
                    <Card sx={{ mb: 2, borderRadius: 2, border: '1px solid rgba(148,163,184,0.2)', boxShadow: 'none' }}>
                      <CardContent>
                        <FormControl fullWidth size="small">
                          <InputLabel>Recommend candidates for job</InputLabel>
                          <Select
                            value={recommendedJobId}
                            label="Recommend candidates for job"
                            onChange={(e) => setRecommendedJobId(e.target.value)}
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
                    {recommendedJobId && (
                      <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>}>
                        <RecommendedCandidates
                          recruiterId={user.id}
                          jobId={recommendedJobId}
                          onMessageClick={handleChatClick}
                        />
                      </Suspense>
                    )}
                  </Box>
                )
              )}
            </TabPanel>

            {/* Candidate Tags Tab */}
            <TabPanel value={currentTab} index={5}>
              {user?.id && <TagManager recruiterId={user.id} inline />}
            </TabPanel>

            {/* Find Candidates Tab */}
            <TabPanel value={currentTab} index={6}>
              {user?.id && (
                <CandidateSearch
                  recruiterId={user.id}
                  onChatClick={handleChatClick}
                />
              )}
            </TabPanel>

            {/* Talent Pool Tab */}
            <TabPanel value={currentTab} index={7}>
              {user?.id && (
                <TalentPool
                  recruiterId={user.id}
                  onChatClick={handleChatClick}
                />
              )}
            </TabPanel>

            {/* ATS Pipeline Tab */}
            <TabPanel value={currentTab} index={8}>
              {user?.id && (
                <PipelineBoard />
              )}
            </TabPanel>
          </CardContent>
        </Card>
      </Container>

      {/* Job Posting Form Dialog */}
      <JobPostingForm
        open={jobPostingFormOpen}
        onClose={() => setJobPostingFormOpen(false)}
        recruiterId={user?.id || ''}
        onJobCreated={handleJobCreated}
      />

      {/* Chat Dialog */}
      <Dialog
        open={chatDialogOpen}
        onClose={() => setChatDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ChatIcon />
            Chat with {selectedChatUser?.name}
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ minHeight: 300, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
            <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
              Start a conversation...
            </Typography>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Type your message..."
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            disabled={sendingMessage}
          />
        </DialogContent>
        <DialogContent sx={{ pt: 1, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button onClick={() => setChatDialogOpen(false)} disabled={sendingMessage}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!chatMessage.trim() || sendingMessage}
            endIcon={sendingMessage ? <CircularProgress size={20} /> : undefined}
          >
            {sendingMessage ? 'Sending...' : 'Send'}
          </Button>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};
