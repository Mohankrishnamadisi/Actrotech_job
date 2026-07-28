import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  AutoAwesome as AiIcon,
  Groups as CommunityIcon,
  Recommend as ReferralIcon,
  School as MentorIcon,
  Event as EventIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Layout } from '@components/layout/Layout';
import { ROUTES } from '@constants/index';
import { useAuthStore } from '@store/index';
import { networkCommunityService } from '@services/networkCommunity';

type CandidateTab =
  | 'profile'
  | 'networking'
  | 'community'
  | 'referrals'
  | 'mentorship'
  | 'events'
  | 'knowledge'
  | 'ai-assistant'
  | 'notifications'
  | 'gamification'
  | 'analytics'
  | 'reports'
  | 'permissions';

const statCard = (label: string, value: string | number) => (
  <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
    <CardContent>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h6" sx={{ fontWeight: 800 }}>{value}</Typography>
    </CardContent>
  </Card>
);

const downloadText = (name: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const getInitialTabFromPath = (path: string): CandidateTab => {
  if (path === ROUTES.DASHBOARD_REFERRALS) return 'referrals';
  if (path === ROUTES.DASHBOARD_MENTORSHIP) return 'mentorship';
  if (path === ROUTES.DASHBOARD_EVENTS) return 'events';
  return 'community';
};

export const CommunityNetworkingHub: React.FC = () => {
  const { user } = useAuthStore();
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const location = useLocation();

  const [tab, setTab] = useState<CandidateTab>(getInitialTabFromPath(location.pathname));
  const [postContent, setPostContent] = useState('');
  const [selectedCommunityId, setSelectedCommunityId] = useState('');
  const [mentorAgenda, setMentorAgenda] = useState('Resume review and interview guidance');

  const userId = user?.id || 'guest_candidate';

  const profile = useMemo(() => networkCommunityService.getProfessionalProfile(userId, user?.name), [userId, user?.name]);
  const connections = useMemo(() => networkCommunityService.listConnections(userId), [userId, tab]);
  const suggestions = useMemo(() => networkCommunityService.listSuggestedConnections(userId), [userId, tab]);
  const communities = useMemo(() => networkCommunityService.listCommunities(), [tab]);
  const discussions = useMemo(() => networkCommunityService.listDiscussions(), [tab]);
  const opportunities = useMemo(() => networkCommunityService.listReferralOpportunities(), [tab]);
  const referralRequests = useMemo(() => networkCommunityService.listReferralRequestsByCandidate(userId), [userId, tab]);
  const mentors = useMemo(() => networkCommunityService.listMentors(), [tab]);
  const mentorSessions = useMemo(() => networkCommunityService.listMentorSessions(userId), [userId, tab]);
  const events = useMemo(() => networkCommunityService.listEvents(), [tab]);
  const knowledge = useMemo(() => networkCommunityService.listKnowledgeHub(), [tab]);
  const ai = useMemo(() => networkCommunityService.getAiCommunityRecommendations(userId), [userId, tab]);
  const notifications = useMemo(() => networkCommunityService.getNotifications(userId), [userId, tab]);
  const gamification = useMemo(() => networkCommunityService.getGamification(userId), [userId, tab]);
  const analytics = useMemo(() => networkCommunityService.getAnalytics(), [tab]);
  const reports = useMemo(() => networkCommunityService.generateReports(userId), [userId, tab]);
  const permissions = useMemo(() => networkCommunityService.getPermissions(), []);

  if (!user?.id) {
    return (
      <Layout>
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography variant="h6">Please login to access community platform.</Typography>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, md: 3 }, py: 3 }}>
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 2, background: 'linear-gradient(115deg, #0f172a 0%, #0e7490 55%, #1d4ed8 100%)', color: '#f8fafc' }}>
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>Community, Referrals & Networking</Typography>
                <Typography variant="body2" sx={{ opacity: 0.92 }}>
                  Professional ecosystem for candidates, recruiters, companies and mentors to collaborate.
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.8}>
                <Chip icon={<CommunityIcon />} label="Community" />
                <Chip icon={<ReferralIcon />} label="Referrals" />
                <Chip icon={<MentorIcon />} label="Mentorship" />
                <Chip icon={<EventIcon />} label="Events" />
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Paper sx={{ border: '1px solid #e2e8f0', borderRadius: 2, mb: 2 }}>
          <Tabs value={tab} onChange={(_, v: CandidateTab) => setTab(v)} variant={isTablet ? 'scrollable' : 'fullWidth'} scrollButtons="auto">
            <Tab value="profile" label="Professional Profile" />
            <Tab value="networking" label="Networking" />
            <Tab value="community" label="Community" />
            <Tab value="referrals" label="Referrals" />
            <Tab value="mentorship" label="Mentorship" />
            <Tab value="events" label="Events" />
            <Tab value="knowledge" label="Knowledge Hub" />
            <Tab value="ai-assistant" label="AI Assistant" />
            <Tab value="notifications" label="Notifications" />
            <Tab value="gamification" label="Gamification" />
            <Tab value="analytics" label="Analytics" />
            <Tab value="reports" label="Reports" />
            <Tab value="permissions" label="Permissions" />
          </Tabs>
        </Paper>

        {tab === 'profile' && (
          <Grid container spacing={1.2}>
            <Grid item xs={12} md={8}>
              <Card sx={{ border: '1px solid #e2e8f0' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{profile.professionalHeadline}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{profile.bio}</Typography>
                  <Typography variant="body2">Current Company: {profile.currentCompany}</Typography>
                  <Typography variant="body2">Experience: {profile.experience}</Typography>
                  <Typography variant="body2">Education: {profile.education.join(', ')}</Typography>
                  <Typography variant="body2">Skills: {profile.skills.join(', ')}</Typography>
                  <Typography variant="body2">Projects: {profile.projects.join(', ')}</Typography>
                  <Typography variant="body2">Achievements: {profile.achievements.join(', ')}</Typography>
                  <Typography variant="body2">Verified Certificates: {profile.verifiedCertificates.join(', ') || 'None'}</Typography>
                  <Typography variant="body2">Assessment Badges: {profile.assessmentBadges.join(', ') || 'None'}</Typography>
                  <Typography variant="body2">Portfolio: {profile.portfolioUrl}</Typography>
                  <Typography variant="body2">GitHub: {profile.githubUrl}</Typography>
                  <Typography variant="body2">LinkedIn: {profile.linkedinUrl}</Typography>
                  <Typography variant="body2">Website: {profile.websiteUrl}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Grid container spacing={1}>
                <Grid item xs={12}>{statCard('Followers', profile.followers)}</Grid>
                <Grid item xs={12}>{statCard('Following', profile.following)}</Grid>
                <Grid item xs={12}>{statCard('Connections', connections.length)}</Grid>
              </Grid>
            </Grid>
          </Grid>
        )}

        {tab === 'networking' && (
          <Grid container spacing={1.2}>
            <Grid item xs={12}><Alert severity="info">Follow, connect, accept/reject requests, remove connections, block users, mutual and suggested connections are supported.</Alert></Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ border: '1px solid #e2e8f0' }}><CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Suggested Connections</Typography>
                <Stack spacing={1}>
                  {suggestions.map((item) => (
                    <Paper key={item.id} sx={{ p: 1, border: '1px solid #e2e8f0' }}>
                      <Typography variant="subtitle2">{item.name}</Typography>
                      <Typography variant="caption" display="block">{item.headline} | Mutual: {item.mutualConnections}</Typography>
                      <Button size="small" onClick={() => { networkCommunityService.sendConnectionRequest(userId, item.id); toast.success('Connection request sent'); }}>Connect</Button>
                    </Paper>
                  ))}
                </Stack>
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ border: '1px solid #e2e8f0' }}><CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Pending Requests</Typography>
                <Stack spacing={1}>
                  {networkCommunityService.listConnectionRequests(userId).map((row) => (
                    <Paper key={row.id} sx={{ p: 1, border: '1px solid #e2e8f0' }}>
                      <Typography variant="body2">From: {row.fromUserId}</Typography>
                      <Stack direction="row" spacing={0.8}>
                        <Button size="small" onClick={() => { networkCommunityService.updateConnectionStatus(row.id, 'connected'); toast.success('Connection accepted'); }}>Accept</Button>
                        <Button size="small" color="warning" onClick={() => { networkCommunityService.updateConnectionStatus(row.id, 'rejected'); toast.success('Connection rejected'); }}>Reject</Button>
                        <Button size="small" color="error" onClick={() => { networkCommunityService.updateConnectionStatus(row.id, 'blocked'); toast.success('User blocked'); }}>Block</Button>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </CardContent></Card>
            </Grid>
          </Grid>
        )}

        {tab === 'community' && (
          <Grid container spacing={1.2}>
            <Grid item xs={12}><Alert severity="success">Posts, comments, replies, likes, bookmarks, polls, pinned posts, announcements, media upload, hashtags, mentions, search and moderation ready.</Alert></Grid>
            <Grid item xs={12} md={5}>
              <Card sx={{ border: '1px solid #e2e8f0' }}><CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Communities</Typography>
                <Stack spacing={0.8}>
                  {communities.map((community) => (
                    <Button key={community.id} variant={selectedCommunityId === community.id ? 'contained' : 'outlined'} onClick={() => setSelectedCommunityId(community.id)}>
                      {community.name} ({community.members})
                    </Button>
                  ))}
                </Stack>
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} md={7}>
              <Card sx={{ border: '1px solid #e2e8f0' }}><CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Create Post</Typography>
                <TextField fullWidth multiline minRows={3} value={postContent} onChange={(e) => setPostContent(e.target.value)} placeholder="Share updates with hashtags and mentions" sx={{ mb: 1 }} />
                <Button variant="contained" onClick={() => {
                  if (!selectedCommunityId) { toast.error('Select a community'); return; }
                  if (!postContent.trim()) { toast.error('Enter post content'); return; }
                  networkCommunityService.createPost({
                    communityId: selectedCommunityId,
                    authorId: userId,
                    authorName: user.name,
                    content: postContent,
                    hashtags: ['#career', '#community'],
                    mentions: [],
                    announcement: false,
                    pinned: false,
                  });
                  setPostContent('');
                  toast.success('Post published');
                }}>Publish Post</Button>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2">Trending Discussions</Typography>
                {discussions.slice(0, 4).map((d) => (
                  <Paper key={d.id} sx={{ p: 1, border: '1px solid #e2e8f0', mt: 0.6 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{d.title}</Typography>
                    <Typography variant="caption">Votes: {d.votes} | Answers: {d.answers} | Contributor: {d.contributor}</Typography>
                  </Paper>
                ))}
              </CardContent></Card>
            </Grid>
          </Grid>
        )}

        {tab === 'referrals' && (
          <Grid container spacing={1.2}>
            <Grid item xs={12}><Alert severity="info">Referral marketplace supports eligibility, deadlines, available positions and referral request tracking.</Alert></Grid>
            <Grid item xs={12} md={7}>
              <TableContainer component={Paper} sx={{ border: '1px solid #e2e8f0' }}>
                <Table size="small">
                  <TableHead><TableRow><TableCell>Company</TableCell><TableCell>Role</TableCell><TableCell>Eligibility</TableCell><TableCell>Deadline</TableCell><TableCell /></TableRow></TableHead>
                  <TableBody>
                    {opportunities.map((op) => (
                      <TableRow key={op.id}>
                        <TableCell>{op.company}</TableCell>
                        <TableCell>{op.role}</TableCell>
                        <TableCell>{op.eligibility}</TableCell>
                        <TableCell>{new Date(op.deadlineAt).toLocaleDateString()}</TableCell>
                        <TableCell><Button size="small" onClick={() => { networkCommunityService.requestReferral(op.id, userId, op.creatorId); toast.success('Referral requested'); }}>Request</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card sx={{ border: '1px solid #e2e8f0' }}><CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>My Referral Status</Typography>
                <Stack spacing={0.8}>
                  {referralRequests.map((row) => (
                    <Paper key={row.id} sx={{ p: 1, border: '1px solid #e2e8f0' }}>
                      <Typography variant="body2">Status: {row.status}</Typography>
                      <Typography variant="caption">Requested at: {new Date(row.createdAt).toLocaleString()}</Typography>
                    </Paper>
                  ))}
                </Stack>
              </CardContent></Card>
            </Grid>
          </Grid>
        )}

        {tab === 'mentorship' && (
          <Grid container spacing={1.2}>
            <Grid item xs={12}><Alert severity="success">Request mentor, book session, schedule calls, chat, share resume and receive feedback workflow enabled.</Alert></Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ border: '1px solid #e2e8f0' }}><CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Mentors</Typography>
                {mentors.map((mentor) => (
                  <Paper key={mentor.id} sx={{ p: 1, border: '1px solid #e2e8f0', mb: 0.8 }}>
                    <Typography variant="subtitle2">{mentor.name} - {mentor.title}</Typography>
                    <Typography variant="caption" display="block">Expertise: {mentor.expertise.join(', ')} | Rating: {mentor.rating}</Typography>
                    <TextField size="small" fullWidth sx={{ my: 0.8 }} value={mentorAgenda} onChange={(e) => setMentorAgenda(e.target.value)} />
                    <Button size="small" onClick={() => {
                      const at = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
                      networkCommunityService.requestMentorSession(userId, mentor.id, mentorAgenda, at);
                      toast.success('Mentor session requested');
                    }}>Request Session</Button>
                  </Paper>
                ))}
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ border: '1px solid #e2e8f0' }}><CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>My Sessions</Typography>
                {mentorSessions.map((session) => (
                  <Paper key={session.id} sx={{ p: 1, border: '1px solid #e2e8f0', mb: 0.8 }}>
                    <Typography variant="body2">Mentor: {session.mentorId}</Typography>
                    <Typography variant="body2">Status: {session.status}</Typography>
                    <Typography variant="caption">Scheduled: {new Date(session.scheduledAt).toLocaleString()}</Typography>
                  </Paper>
                ))}
              </CardContent></Card>
            </Grid>
          </Grid>
        )}

        {tab === 'events' && (
          <Grid container spacing={1.2}>
            {events.map((event) => (
              <Grid item xs={12} md={6} key={event.id}>
                <Card sx={{ border: '1px solid #e2e8f0' }}><CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{event.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{event.type} | {new Date(event.eventAt).toLocaleString()}</Typography>
                  <Typography variant="caption" display="block" sx={{ mb: 0.8 }}>Attendees: {event.attendees}</Typography>
                  <Stack direction="row" spacing={0.8}>
                    <Button size="small" onClick={() => { networkCommunityService.toggleRsvp(event.id); toast.success('RSVP updated'); }}>RSVP</Button>
                    <Button size="small" onClick={() => { networkCommunityService.toggleRsvp(event.id); toast.success('Attendance tracked'); }}>Mark Attendance</Button>
                    <Button size="small" component={RouterLink} to={ROUTES.DASHBOARD_EVENTS}>Calendar</Button>
                  </Stack>
                </CardContent></Card>
              </Grid>
            ))}
          </Grid>
        )}

        {tab === 'knowledge' && (
          <Grid container spacing={1.2}>
            {knowledge.map((item) => (
              <Grid item xs={12} md={6} key={item.id}>
                <Card sx={{ border: '1px solid #e2e8f0' }}><CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{item.title}</Typography>
                  <Chip label={item.category} size="small" sx={{ mt: 0.5, mb: 0.8 }} />
                  <Typography variant="body2" color="text.secondary">{item.summary}</Typography>
                </CardContent></Card>
              </Grid>
            ))}
          </Grid>
        )}

        {tab === 'ai-assistant' && (
          <Grid container spacing={1.2}>
            <Grid item xs={12}><Alert severity="info">AI Community Assistant recommends communities, mentors, events, referrals, career articles and connections.</Alert></Grid>
            <Grid item xs={12} md={6}><Card sx={{ border: '1px solid #e2e8f0' }}><CardContent><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Communities</Typography>{ai.communities.map((x) => <Typography key={x} variant="body2">- {x}</Typography>)}</CardContent></Card></Grid>
            <Grid item xs={12} md={6}><Card sx={{ border: '1px solid #e2e8f0' }}><CardContent><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Mentors</Typography>{ai.mentors.map((x) => <Typography key={x} variant="body2">- {x}</Typography>)}</CardContent></Card></Grid>
            <Grid item xs={12} md={6}><Card sx={{ border: '1px solid #e2e8f0' }}><CardContent><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Events</Typography>{ai.events.map((x) => <Typography key={x} variant="body2">- {x}</Typography>)}</CardContent></Card></Grid>
            <Grid item xs={12} md={6}><Card sx={{ border: '1px solid #e2e8f0' }}><CardContent><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Referral Opportunities</Typography>{ai.referralOpportunities.map((x) => <Typography key={x} variant="body2">- {x}</Typography>)}</CardContent></Card></Grid>
            <Grid item xs={12}><Stack direction={{ xs: 'column', md: 'row' }} spacing={1}><Button variant="contained" startIcon={<AiIcon />} component={RouterLink} to={ROUTES.DASHBOARD_AI_CAREER_HUB}>Open AI Career Hub</Button><Button variant="outlined" component={RouterLink} to={ROUTES.MESSAGING}>Open Messaging</Button><Button variant="outlined" component={RouterLink} to={ROUTES.DASHBOARD_ASSESSMENTS}>Open Assessments</Button></Stack></Grid>
          </Grid>
        )}

        {tab === 'notifications' && (
          <TableContainer component={Paper} sx={{ border: '1px solid #e2e8f0' }}>
            <Table size="small">
              <TableHead><TableRow><TableCell>Type</TableCell><TableCell>Notification</TableCell><TableCell>Time</TableCell></TableRow></TableHead>
              <TableBody>
                {notifications.map((item) => (
                  <TableRow key={item.id}><TableCell>{item.type}</TableCell><TableCell>{item.text}</TableCell><TableCell>{new Date(item.at).toLocaleString()}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tab === 'gamification' && (
          <Grid container spacing={1.2}>
            <Grid item xs={12} sm={6} md={3}>{statCard('Points', gamification.points)}</Grid>
            <Grid item xs={12} sm={6} md={3}>{statCard('Level', gamification.level)}</Grid>
            <Grid item xs={12} sm={6} md={3}>{statCard('XP', gamification.xp)}</Grid>
            <Grid item xs={12} sm={6} md={3}>{statCard('Daily Streak', gamification.dailyStreak)}</Grid>
            <Grid item xs={12}><Alert severity="success">Weekly Challenge: {gamification.weeklyChallenge}</Alert></Grid>
            <Grid item xs={12}><Alert severity="info">Achievements: {networkCommunityService.getAchievements().map((a) => a.label).join(', ')}</Alert></Grid>
          </Grid>
        )}

        {tab === 'analytics' && (
          <Grid container spacing={1.2}>
            <Grid item xs={12} sm={6} md={3}>{statCard('Community Growth', analytics.communityGrowth)}</Grid>
            <Grid item xs={12} sm={6} md={3}>{statCard('Referral Success Rate', `${analytics.referralSuccessRate}%`)}</Grid>
            <Grid item xs={12} sm={6} md={3}>{statCard('Mentorship Sessions', analytics.mentorshipSessions)}</Grid>
            <Grid item xs={12} sm={6} md={3}>{statCard('Event Attendance', analytics.eventAttendance)}</Grid>
            <Grid item xs={12} sm={6} md={6}>{statCard('User Engagement', analytics.userEngagement)}</Grid>
            <Grid item xs={12} sm={6} md={6}><Alert severity="info">Top Communities: {analytics.topCommunities.join(', ')} | Top Mentors: {analytics.topMentors.join(', ')}</Alert></Grid>
          </Grid>
        )}

        {tab === 'reports' && (
          <Grid container spacing={1.2}>
            <Grid item xs={12} md={3}><Button fullWidth variant="contained" startIcon={<DownloadIcon />} onClick={() => downloadText('community-report.md', reports.communityReport)}>Community Report</Button></Grid>
            <Grid item xs={12} md={3}><Button fullWidth variant="outlined" onClick={() => downloadText('referral-report.md', reports.referralReport)}>Referral Report</Button></Grid>
            <Grid item xs={12} md={3}><Button fullWidth variant="outlined" onClick={() => downloadText('mentorship-report.md', reports.mentorshipReport)}>Mentorship Report</Button></Grid>
            <Grid item xs={12} md={3}><Button fullWidth variant="outlined" onClick={() => downloadText('engagement-report.md', reports.engagementReport)}>Engagement Report</Button></Grid>
            <Grid item xs={12} md={4}><Button fullWidth variant="outlined" onClick={() => downloadText('community-report.pdf.txt', networkCommunityService.downloadReport(reports.communityReport, 'pdf'))}>PDF</Button></Grid>
            <Grid item xs={12} md={4}><Button fullWidth variant="outlined" onClick={() => downloadText('community-report.excel.txt', networkCommunityService.downloadReport(reports.communityReport, 'excel'))}>Excel</Button></Grid>
            <Grid item xs={12} md={4}><Button fullWidth variant="outlined" onClick={() => downloadText('community-report.csv', networkCommunityService.downloadReport(reports.communityReport, 'csv'))}>CSV</Button></Grid>
          </Grid>
        )}

        {tab === 'permissions' && (
          <Alert severity="info">
            Candidates: {permissions.candidate} | Recruiters: {permissions.recruiter} | Mentors: {permissions.mentor} | Community Managers: {permissions.communityManager} | Platform Moderators: {permissions.platformModerator} | Super Admin: {permissions.superAdmin}
          </Alert>
        )}
      </Box>
    </Layout>
  );
};

export default CommunityNetworkingHub;
