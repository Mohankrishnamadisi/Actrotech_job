import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  EmojiEvents as BadgeIcon,
  Assessment as AssessmentIcon,
  WorkspacePremium as CertificateIcon,
  Psychology as AiIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { Layout } from '@components/layout/Layout';
import { useAuthStore } from '@store/index';
import { assessmentPlatformService, type Difficulty } from '@services/assessmentPlatform';
import { ROUTES } from '@constants/index';
import { Link as RouterLink } from 'react-router-dom';

type CandidateTab =
  | 'dashboard'
  | 'library'
  | 'invitations'
  | 'results'
  | 'certificates'
  | 'leaderboard'
  | 'ai-career-integration'
  | 'reports';

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

const statCard = (label: string, value: string | number) => (
  <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
    <CardContent>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h6" sx={{ fontWeight: 800 }}>{value}</Typography>
    </CardContent>
  </Card>
);

export const AssessmentsPage: React.FC = () => {
  const { user } = useAuthStore();
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  const [tab, setTab] = useState<CandidateTab>('dashboard');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');

  const candidateId = user?.id || 'guest_candidate';
  const dashboard = useMemo(() => assessmentPlatformService.getCandidateDashboard(candidateId), [candidateId]);
  const library = useMemo(() => assessmentPlatformService.listLibrary(), []);
  const invitations = useMemo(() => assessmentPlatformService.listCandidateInvitations(candidateId), [candidateId]);
  const results = useMemo(() => assessmentPlatformService.listCandidateResults(candidateId), [candidateId, invitations.length]);
  const badges = useMemo(() => assessmentPlatformService.listCandidateBadges(candidateId), [candidateId, results.length]);
  const certificates = useMemo(() => assessmentPlatformService.listCandidateCertificates(candidateId), [candidateId, results.length]);
  const aiRecommendations = useMemo(() => assessmentPlatformService.getAiCareerHubRecommendations(candidateId), [candidateId, results.length]);
  const reports = useMemo(() => assessmentPlatformService.generateReports(candidateId), [candidateId, results.length]);
  const permissions = useMemo(() => assessmentPlatformService.getPermissions(), []);
  const leaderboard = useMemo(() => assessmentPlatformService.getLeaderboard('Global', 'Monthly'), [results.length]);

  if (!user?.id) {
    return (
      <Layout>
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography variant="h6">Please login to access assessments.</Typography>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ maxWidth: 1320, mx: 'auto', px: { xs: 2, md: 3 }, py: 3 }}>
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 2, background: 'linear-gradient(110deg, #0f172a 0%, #1e3a8a 52%, #0ea5e9 100%)', color: '#f8fafc' }}>
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>Assessments</Typography>
                <Typography variant="body2" sx={{ opacity: 0.92 }}>
                  Skill verification, coding assessments, certifications, leaderboard and AI recommendations.
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.8}>
                <Chip icon={<AssessmentIcon />} label="Candidate Assessment Hub" />
                <Chip icon={<AiIcon />} label={`Target Difficulty: ${difficulty}`} />
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Paper sx={{ border: '1px solid #e2e8f0', borderRadius: 2, mb: 2 }}>
          <Tabs value={tab} onChange={(_, value: CandidateTab) => setTab(value)} variant={isTablet ? 'scrollable' : 'fullWidth'} scrollButtons="auto">
            <Tab value="dashboard" label="Assessment Dashboard" />
            <Tab value="library" label="Assessment Library" />
            <Tab value="invitations" label="Invitations" />
            <Tab value="results" label="Assessment Results" />
            <Tab value="certificates" label="Certificates & Badges" />
            <Tab value="leaderboard" label="Leaderboard" />
            <Tab value="ai-career-integration" label="AI Career Hub Integration" />
            <Tab value="reports" label="Reports" />
          </Tabs>
        </Paper>

        {tab === 'dashboard' && (
          <Grid container spacing={1.2}>
            <Grid item xs={12} sm={6} md={3}>{statCard('Assessments Taken', dashboard.assessmentsTaken)}</Grid>
            <Grid item xs={12} sm={6} md={3}>{statCard('Assessments Passed', dashboard.assessmentsPassed)}</Grid>
            <Grid item xs={12} sm={6} md={3}>{statCard('Certificates Earned', dashboard.certificatesEarned)}</Grid>
            <Grid item xs={12} sm={6} md={3}>{statCard('Average Score', `${dashboard.averageScore}%`)}</Grid>
            <Grid item xs={12} sm={6} md={3}>{statCard('Skill Badges', dashboard.skillBadges)}</Grid>
            <Grid item xs={12} sm={6} md={3}>{statCard('Pending Invitations', dashboard.pendingInvitations)}</Grid>
            <Grid item xs={12} sm={6} md={3}>{statCard('Upcoming Assessments', dashboard.upcomingAssessments)}</Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Difficulty</InputLabel>
                <Select value={difficulty} label="Difficulty" onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
                  <MenuItem value="Easy">Easy</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Hard">Hard</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}

        {tab === 'library' && (
          <Grid container spacing={1.2}>
            <Grid item xs={12}><Alert severity="info">Library supports Programming, Frontend, Backend, Full Stack, DevOps, Cloud, Database, AI / ML, QA, HR, Communication, Aptitude, Logical Reasoning, English, Soft Skills and Custom Assessments.</Alert></Grid>
            {library.map((item) => (
              <Grid item xs={12} md={6} key={item.id}>
                <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
                      <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700 }}>{item.title}</Typography>
                      <Chip size="small" label={item.difficulty} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.8 }}>{item.description}</Typography>
                    <Typography variant="caption" display="block" sx={{ mb: 0.8 }}>Category: {item.category} | Duration: {item.durationMin} min | Pass: {item.passingScore}%</Typography>
                    <Stack direction="row" spacing={0.6} flexWrap="wrap" sx={{ mb: 1 }}>
                      {item.skills.map((skill) => <Chip key={skill} size="small" label={skill} />)}
                    </Stack>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => {
                        const result = assessmentPlatformService.submitAssessment(candidateId, item.id);
                        const feedback = assessmentPlatformService.generateAiFeedback(result);
                        toast.success(`Assessment submitted. Score ${result.overallScore}%`);
                        toast(feedback.performanceSummary);
                      }}
                    >
                      Start / Attempt
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {tab === 'invitations' && (
          <TableContainer component={Paper} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Assessment</TableCell>
                  <TableCell>Schedule</TableCell>
                  <TableCell>Deadline</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(invitations.length ? invitations : [{ id: 'empty', assessmentId: '-', scheduledAt: '-', deadlineAt: '-', status: 'pending' as const }]).map((inv) => {
                  const assessment = library.find((a) => a.id === inv.assessmentId);
                  return (
                    <TableRow key={inv.id}>
                      <TableCell>{assessment?.title || 'No invitation yet'}</TableCell>
                      <TableCell>{inv.scheduledAt === '-' ? '-' : new Date(inv.scheduledAt).toLocaleString()}</TableCell>
                      <TableCell>{inv.deadlineAt === '-' ? '-' : new Date(inv.deadlineAt).toLocaleString()}</TableCell>
                      <TableCell><Chip size="small" label={inv.status.toUpperCase()} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tab === 'results' && (
          <Grid container spacing={1.2}>
            {results.length === 0 ? <Grid item xs={12}><Alert severity="warning">No results yet. Attempt an assessment from library.</Alert></Grid> : null}
            {results.map((result) => {
              const aiFeedback = assessmentPlatformService.generateAiFeedback(result);
              return (
                <Grid item xs={12} key={result.id}>
                  <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                    <CardContent>
                      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{library.find((a) => a.id === result.assessmentId)?.title || 'Assessment'}</Typography>
                        <Chip label={`Score ${result.overallScore}%`} color={result.overallScore >= 70 ? 'success' : 'warning'} />
                      </Stack>
                      <Grid container spacing={1} sx={{ mt: 0.5 }}>
                        <Grid item xs={12} sm={6} md={3}>{statCard('Coding Score', `${result.codingScore}%`)}</Grid>
                        <Grid item xs={12} sm={6} md={3}>{statCard('Accuracy', `${result.accuracy}%`)}</Grid>
                        <Grid item xs={12} sm={6} md={3}>{statCard('Time Taken', `${result.timeTakenMin} min`)}</Grid>
                        <Grid item xs={12} sm={6} md={3}>{statCard('Percentile', `${result.percentile}%`)}</Grid>
                      </Grid>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2"><strong>Strengths:</strong> {result.strengths.join(', ')}</Typography>
                      <Typography variant="body2"><strong>Weaknesses:</strong> {result.weaknesses.join(', ')}</Typography>
                      <Typography variant="body2" sx={{ mt: 0.6 }}><strong>AI Summary:</strong> {aiFeedback.performanceSummary}</Typography>
                      <Typography variant="caption" color="text.secondary">Retake Option: available after 24 hours.</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {tab === 'certificates' && (
          <Grid container spacing={1.2}>
            <Grid item xs={12} md={6}>
              <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Skill Badges</Typography>
                  {badges.length === 0 ? <Alert severity="warning">No verified badges yet.</Alert> : null}
                  <Stack direction="row" spacing={0.7} flexWrap="wrap">
                    {badges.map((badge) => (
                      <Chip key={badge.id} icon={<BadgeIcon />} label={`${badge.skill} - ${badge.level}`} color="success" />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Certificates</Typography>
                  {certificates.length === 0 ? <Alert severity="warning">No certificates yet.</Alert> : null}
                  <Stack spacing={1}>
                    {certificates.map((certificate) => (
                      <Paper key={certificate.id} sx={{ p: 1, border: '1px solid #e2e8f0' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{certificate.skill} Certificate</Typography>
                        <Typography variant="caption" display="block">Certificate ID: {certificate.certificateId}</Typography>
                        <Typography variant="caption" display="block">Verification: {certificate.verificationUrl}</Typography>
                        <Button
                          size="small"
                          startIcon={<CertificateIcon />}
                          onClick={() => downloadText(`certificate-${certificate.certificateId}.txt`, assessmentPlatformService.generateCertificateDocument(certificate))}
                        >
                          Download PDF
                        </Button>
                      </Paper>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {tab === 'leaderboard' && (
          <TableContainer component={Paper} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>Candidate</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Badge</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaderboard.map((row) => (
                  <TableRow key={row.rank}>
                    <TableCell>{row.rank}</TableCell>
                    <TableCell>{row.candidate}</TableCell>
                    <TableCell>{row.score}</TableCell>
                    <TableCell><Chip size="small" label={row.badge} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tab === 'ai-career-integration' && (
          <Grid container spacing={1.2}>
            <Grid item xs={12}><Alert severity="info">AI Career Hub now recommends assessments, practice tests, certifications and skill improvement plans.</Alert></Grid>
            <Grid item xs={12} md={6}><Card sx={{ border: '1px solid #e2e8f0' }}><CardContent><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Recommended Assessments</Typography>{aiRecommendations.assessments.map((item) => <Typography key={item} variant="body2">- {item}</Typography>)}</CardContent></Card></Grid>
            <Grid item xs={12} md={6}><Card sx={{ border: '1px solid #e2e8f0' }}><CardContent><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Practice Tests</Typography>{aiRecommendations.practiceTests.map((item) => <Typography key={item} variant="body2">- {item}</Typography>)}</CardContent></Card></Grid>
            <Grid item xs={12} md={6}><Card sx={{ border: '1px solid #e2e8f0' }}><CardContent><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Certifications</Typography>{aiRecommendations.certifications.map((item) => <Typography key={item} variant="body2">- {item}</Typography>)}</CardContent></Card></Grid>
            <Grid item xs={12} md={6}><Card sx={{ border: '1px solid #e2e8f0' }}><CardContent><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Skill Improvement Plan</Typography>{aiRecommendations.skillImprovementPlan.map((item) => <Typography key={item} variant="body2">- {item}</Typography>)}</CardContent></Card></Grid>
            <Grid item xs={12}><Button component={RouterLink} to={ROUTES.DASHBOARD_AI_CAREER_HUB} variant="contained" startIcon={<AiIcon />}>Open AI Career Hub</Button></Grid>
          </Grid>
        )}

        {tab === 'reports' && (
          <Grid container spacing={1.2}>
            <Grid item xs={12}><Alert severity="success">Reports available: Assessment Report, Skill Report, Company Skill Report, Hiring Readiness Report. Download in PDF, Excel and CSV.</Alert></Grid>
            <Grid item xs={12} md={3}><Button fullWidth variant="contained" startIcon={<DownloadIcon />} onClick={() => downloadText('assessment-report.md', reports.assessmentReport)}>Assessment Report</Button></Grid>
            <Grid item xs={12} md={3}><Button fullWidth variant="outlined" onClick={() => downloadText('skill-report.md', reports.skillReport)}>Skill Report</Button></Grid>
            <Grid item xs={12} md={3}><Button fullWidth variant="outlined" onClick={() => downloadText('company-skill-report.md', reports.companySkillReport)}>Company Skill Report</Button></Grid>
            <Grid item xs={12} md={3}><Button fullWidth variant="outlined" onClick={() => downloadText('hiring-readiness-report.md', reports.hiringReadinessReport)}>Hiring Readiness</Button></Grid>
            <Grid item xs={12} md={4}><Button fullWidth variant="outlined" onClick={() => downloadText('assessment-report.pdf.txt', assessmentPlatformService.downloadReport(reports.assessmentReport, 'pdf'))}>Download PDF</Button></Grid>
            <Grid item xs={12} md={4}><Button fullWidth variant="outlined" onClick={() => downloadText('assessment-report.excel.txt', assessmentPlatformService.downloadReport(reports.assessmentReport, 'excel'))}>Download Excel</Button></Grid>
            <Grid item xs={12} md={4}><Button fullWidth variant="outlined" onClick={() => downloadText('assessment-report.csv', assessmentPlatformService.downloadReport(reports.assessmentReport, 'csv'))}>Download CSV</Button></Grid>
          </Grid>
        )}

        <Alert severity="info" sx={{ mt: 2 }}>
          Permissions: {permissions.candidate} | {permissions.recruiter} | {permissions.admin}
        </Alert>
      </Box>
    </Layout>
  );
};

export default AssessmentsPage;
