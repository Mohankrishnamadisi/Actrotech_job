import React, { useEffect, useState } from 'react';
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
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Work as WorkIcon,
  People as PeopleIcon,
  Add as AddIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  Search as SearchIcon,
  Chat as ChatIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { Layout } from '@components/layout/Layout';
import { useAuthStore } from '@store/index';
import { recruiterService, statsService, chatService } from '@services/api';
import { JobPostingForm } from '@components/recruiter/JobPostingForm';
import { ManageJobs } from '@components/recruiter/ManageJobs';
import { ViewApplicants } from '@components/recruiter/ViewApplicants';
import { CompanyProfile } from '@components/recruiter/CompanyProfile';
import { CandidateSearch } from '@components/recruiter/CandidateSearch';
import { NotificationsCenter } from '@components/recruiter/NotificationsCenter';
import toast from 'react-hot-toast';

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

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, profileData] = await Promise.all([
        statsService.getRecruiterStats(user?.id || ''),
        recruiterService.getRecruiterProfile(user?.id || ''),
      ]);

      setStats(statsData);
      setRecruiterProfile(profileData);
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
      await chatService.sendMessage(user.id, selectedChatUser.id, chatMessage);
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

  const dashboardStats = [
    { label: 'Active Jobs', value: stats.active_jobs, icon: WorkIcon, color: '#1D4ED8' },
    { label: 'Total Applicants', value: stats.total_applicants, icon: PeopleIcon, color: '#10B981' },
    { label: 'Shortlisted', value: stats.shortlisted, icon: TrendingUpIcon, color: '#F59E0B' },
    { label: 'Total Jobs', value: stats.total_jobs, icon: BusinessIcon, color: '#8B5CF6' },
  ];

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
            Recruiter Dashboard
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Welcome back, {recruiterProfile?.company_name || user?.name}! Manage your hiring effortlessly.
          </Typography>
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {dashboardStats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={stat.label}>
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                sx={{
                  background: `linear-gradient(135deg, ${stat.color}20 0%, ${stat.color}10 100%)`,
                  border: `2px solid ${stat.color}30`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 24px ${stat.color}30`,
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                        {stat.label}
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color }}>
                        {stat.value}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        background: stat.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <stat.icon sx={{ color: 'white', fontSize: 32 }} />
                    </Box>
                  </Box>
                </CardContent>
              </MotionCard>
            </Grid>
          ))}
        </Grid>

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
                onClick={() => setCurrentTab(4)}
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
          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<NotificationsIcon />}
                onClick={() => setCurrentTab(5)}
                sx={{ py: 1.5, fontWeight: 600 }}
              >
                Notifications
              </Button>
            </motion.div>
          </Grid>
        </Grid>

        {/* Tabs Section */}
        <Card sx={{ boxShadow: 2 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={currentTab}
              onChange={(_, newValue) => setCurrentTab(newValue)}
              sx={{
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
                '& .Mui-selected': { color: '#1D4ED8' },
                '& .MuiTabs-indicator': { backgroundColor: '#1D4ED8' },
              }}
            >
              <Tab label="Dashboard Overview" id="recruiter-tab-0" aria-controls="recruiter-tabpanel-0" />
              <Tab label="Manage Jobs" id="recruiter-tab-1" aria-controls="recruiter-tabpanel-1" />
              <Tab label="Company Profile" id="recruiter-tab-2" aria-controls="recruiter-tabpanel-2" />
              <Tab label="View Applicants" id="recruiter-tab-3" aria-controls="recruiter-tabpanel-3" />
              <Tab label="Find Candidates" id="recruiter-tab-4" aria-controls="recruiter-tabpanel-4" />
              <Tab label="Notifications" id="recruiter-tab-5" aria-controls="recruiter-tabpanel-5" />
            </Tabs>
          </Box>

          <CardContent>
            {/* Dashboard Overview Tab */}
            <TabPanel value={currentTab} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <MotionCard initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Welcome to Your Recruiter Dashboard
                      </Typography>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        You can now post jobs for free, manage applicants, search candidates, and communicate with
                        them directly through our chat system!
                      </Alert>
                      <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                        • <strong>Post Jobs:</strong> Create job postings with detailed requirements and qualifications.
                        <br />
                        • <strong>Manage Jobs:</strong> Edit, delete, or change the status of your job postings.
                        <br />
                        • <strong>View Applicants:</strong> See all candidates who have applied for your jobs and manage
                        their application status.
                        <br />
                        • <strong>Search Candidates:</strong> Browse and search through our candidate pool by skills,
                        experience, and location.
                        <br />
                        • <strong>Chat System:</strong> Communicate directly with candidates without leaving the
                        platform.
                        <br />
                        • <strong>Company Profile:</strong> Update your company information, logo, and HR contact
                        details.
                      </Typography>
                    </CardContent>
                  </MotionCard>
                </Grid>

                <Grid item xs={12} md={6}>
                  <MotionCard initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Recent Activity
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {stats.total_jobs === 0
                          ? 'No jobs posted yet. Click "Post New Job" to get started!'
                          : `You have ${stats.active_jobs} active job(s) and ${stats.total_applicants} total applicant(s)`}
                      </Typography>
                    </CardContent>
                  </MotionCard>
                </Grid>

                <Grid item xs={12} md={6}>
                  <MotionCard initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Quick Tips
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        • Make your job postings detailed and clear for better candidates matches.
                        <br />
                        • Respond to applicants quickly to get the best talent.
                        <br />
                        • Update your company profile to attract more candidates.
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

            {/* Find Candidates Tab */}
            <TabPanel value={currentTab} index={4}>
              {user?.id && (
                <CandidateSearch
                  recruiterId={user.id}
                  onChatClick={handleChatClick}
                />
              )}
            </TabPanel>

            {/* Notifications Tab */}
            <TabPanel value={currentTab} index={5}>
              {user?.id && (
                <NotificationsCenter
                  userId={user.id}
                  onNotificationRead={fetchData}
                />
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
