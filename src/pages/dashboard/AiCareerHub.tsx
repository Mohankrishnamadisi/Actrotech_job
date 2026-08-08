import React, { useEffect, useMemo, useState } from 'react';
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
  LinearProgress,
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
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  AutoAwesome as AiIcon,
  Chat as ChatIcon,
  Download as DownloadIcon,
  PushPin as PinIcon,
  Add as NewChatIcon,
  Description as ResumeIcon,
  TrackChanges as AtsIcon,
  Insights as InsightIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { Layout } from '@components/layout/Layout';
import { useAuthStore } from '@store/index';
import { aiCareerHubService, type CareerPlanWindow, type CoverLetterTone, type MockInterviewType, type ResumeTemplate } from '@services/aiCareerHub';
import { jobService } from '@services/api';
import { ROUTES } from '@constants/index';
import { Link as RouterLink } from 'react-router-dom';

type HubTab =
  | 'dashboard'
  | 'assistant'
  | 'resume-builder'
  | 'ats-score'
  | 'resume-optimizer'
  | 'cover-letter'
  | 'skill-gap'
  | 'roadmap'
  | 'mock-interview'
  | 'interview-feedback'
  | 'portfolio'
  | 'learning'
  | 'salary'
  | 'insights'
  | 'application-assistant'
  | 'job-tracker'
  | 'notifications'
  | 'achievements'
  | 'reports'
  | 'integrations';

const MotionBox = motion(Box);

const downloadText = (fileName: string, content: string): void => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const statCard = (label: string, value: string | number, accent: string) => (
  <Card sx={{ borderRadius: 2, border: '1px solid #e2e8f0' }}>
    <CardContent>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h6" sx={{ fontWeight: 800, color: accent, mt: 0.3 }}>{value}</Typography>
    </CardContent>
  </Card>
);

export const AiCareerHub: React.FC = () => {
  const { user } = useAuthStore();
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  const [tab, setTab] = useState<HubTab>('dashboard');
  const [loading, setLoading] = useState(true);

  const [overview, setOverview] = useState<any>(null);
  const [permissions, setPermissions] = useState<any>(null);
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>('');
  const [savedPrompts, setSavedPrompts] = useState<any[]>([]);
  const [chatPrompt, setChatPrompt] = useState('');
  const [savingPromptTitle, setSavingPromptTitle] = useState('Career Prompt');

  const [resumeTemplate, setResumeTemplate] = useState<ResumeTemplate>('professional');
  const [resumeDraft, setResumeDraft] = useState<any>(null);

  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [atsResult, setAtsResult] = useState<any>(null);

  const [optimizerInput, setOptimizerInput] = useState({
    summary: '',
    experience: '',
    projects: '',
    skills: '',
    achievements: '',
  });
  const [optimizerOutput, setOptimizerOutput] = useState<any>(null);

  const [coverInput, setCoverInput] = useState({
    company: '',
    role: '',
    experience: '',
    tone: 'professional' as CoverLetterTone,
  });
  const [coverLetter, setCoverLetter] = useState('');

  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [skillGap, setSkillGap] = useState<any>(null);
  const [roadmapWindow, setRoadmapWindow] = useState<CareerPlanWindow>('6m');
  const [roadmapRole, setRoadmapRole] = useState('Software Engineer');
  const [roadmap, setRoadmap] = useState<any>(null);

  const [mockType, setMockType] = useState<MockInterviewType>('technical');
  const [mockRole, setMockRole] = useState('Software Engineer');
  const [mockSession, setMockSession] = useState<any>(null);
  const [mockAnswer, setMockAnswer] = useState('');
  const [mockEvaluations, setMockEvaluations] = useState<any[]>([]);
  const [feedbackReport, setFeedbackReport] = useState<any>(null);

  const [portfolio, setPortfolio] = useState<any>(null);
  const [learning, setLearning] = useState<any>(null);
  const [salaryInput, setSalaryInput] = useState({
    skills: 'React, TypeScript, Node.js',
    experienceYears: 3,
    location: 'Hyderabad',
    role: 'Software Engineer',
    industry: 'IT & Software',
  });
  const [salaryEstimate, setSalaryEstimate] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);

  const [applicationAssistant, setApplicationAssistant] = useState<any>(null);
  const [jobTracker, setJobTracker] = useState<any>(null);
  const [aiNotifications, setAiNotifications] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [reports, setReports] = useState<any>(null);
  const [integrationSummary, setIntegrationSummary] = useState<any>(null);

  const activeThread = useMemo(() => threads.find((t) => t.id === activeThreadId) || null, [threads, activeThreadId]);

  const loadAll = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const [
        nextOverview,
        nextPermissions,
        nextThreads,
        nextPrompts,
        nextJobs,
        nextPortfolio,
        nextLearning,
        nextInsights,
        nextTracker,
        nextNotifications,
        nextAchievements,
        nextReports,
        nextIntegrations,
      ] = await Promise.all([
        aiCareerHubService.getDashboardOverview(user.id),
        aiCareerHubService.getPermissions(user.id),
        Promise.resolve(aiCareerHubService.getChatHistory(user.id)),
        Promise.resolve(aiCareerHubService.getSavedPromptsSeed(user.id)),
        jobService.getJobs({}, 1, 40).then((res) => res?.data || []).catch(() => []),
        aiCareerHubService.buildPortfolio(user.id),
        aiCareerHubService.getLearningRecommendations(user.id, 'Software Engineer'),
        Promise.resolve(aiCareerHubService.getCareerInsights()),
        aiCareerHubService.getJobTracker(user.id),
        aiCareerHubService.getAiNotifications(user.id),
        aiCareerHubService.getAchievements(user.id),
        aiCareerHubService.generateReports(user.id),
        aiCareerHubService.getIntegrationSummary(user.id),
      ]);

      setOverview(nextOverview);
      setPermissions(nextPermissions);
      setThreads(nextThreads);
      setSavedPrompts(nextPrompts);
      setJobs(nextJobs);
      setPortfolio(nextPortfolio);
      setLearning(nextLearning);
      setInsights(nextInsights);
      setJobTracker(nextTracker);
      setAiNotifications(nextNotifications);
      setAchievements(nextAchievements);
      setReports(nextReports);
      setIntegrationSummary(nextIntegrations);

      if (nextThreads.length > 0) {
        setActiveThreadId(nextThreads[0].id);
      }

      const firstJob = nextJobs[0];
      if (firstJob) {
        const id = String(firstJob.id);
        setSelectedJobId(id);
        const [gap, appAssist] = await Promise.all([
          aiCareerHubService.analyzeSkillGap(user.id, id),
          aiCareerHubService.getApplicationAssistant(user.id, id),
        ]);
        setSkillGap(gap);
        setApplicationAssistant(appAssist);
      }

      const draft = aiCareerHubService.getResumeDraft(user.id) || await aiCareerHubService.buildResumeDraft(user.id, 'professional');
      setResumeDraft(draft);

      const generatedRoadmap = aiCareerHubService.generateCareerRoadmap('6m', 'Software Engineer');
      setRoadmap(generatedRoadmap);

      const estimated = aiCareerHubService.estimateSalary({
        skills: salaryInput.skills.split(',').map((s) => s.trim()).filter(Boolean),
        experienceYears: salaryInput.experienceYears,
        location: salaryInput.location,
        role: salaryInput.role,
        industry: salaryInput.industry,
      });
      setSalaryEstimate(estimated);
    } catch (error) {
      console.error('AI Career Hub load failed', error);
      toast.error('Failed to load AI Career Hub');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [user?.id]);

  if (!user?.id) {
    return (
      <Layout>
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography variant="h6">Please login to access AI Career Hub.</Typography>
        </Box>
      </Layout>
    );
  }

  if (loading || !overview || !permissions || !resumeDraft || !portfolio || !learning || !insights || !jobTracker || !reports || !integrationSummary) {
    return (
      <Layout>
        <Box sx={{ py: 5, px: 2 }}>
          <Typography variant="body2" color="text.secondary">Loading AI Career Hub...</Typography>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.28 }} sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, md: 3 }, py: 3 }}>
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 2, background: 'linear-gradient(120deg, #0f172a 0%, #1e3a8a 45%, #155e75 100%)', color: '#f8fafc' }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>AI Career Hub</Typography>
                <Typography variant="body2" sx={{ opacity: 0.92, mt: 0.4 }}>
                  Unified AI platform for resume, applications, interviews, skill growth, salary planning and career acceleration.
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.7} flexWrap="wrap">
                {(() => {
                  const planLabel = permissions?.plan ? String(permissions.plan).replace(/^\w/, (c) => c.toUpperCase()) : 'Free';
                  const requestsLabel = permissions?.isPremium ? 'Unlimited AI Access' : `${permissions?.remainingDailyRequests ?? 0} requests left today`;
                  return (
                    <>
                      <Chip
                        icon={<AiIcon />}
                        label={`Plan: ${planLabel}`}
                        sx={{ bgcolor: 'rgba(255,255,255,0.98)', color: '#0f172a', borderColor: 'rgba(15,23,42,0.06)', fontWeight: 800 }}
                        variant="outlined"
                      />
                      <Chip
                        label={requestsLabel}
                        sx={{ bgcolor: 'rgba(255,255,255,0.98)', color: '#0f172a', borderColor: 'rgba(15,23,42,0.06)', fontWeight: 700 }}
                        variant="outlined"
                      />
                    </>
                  );
                })()}
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Paper sx={{ mb: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
          <Tabs value={tab} onChange={(_, value: HubTab) => setTab(value)} variant={isTablet ? 'scrollable' : 'fullWidth'} scrollButtons="auto">
            <Tab value="dashboard" label="Dashboard" />
            <Tab value="assistant" label="AI Career Assistant" />
            <Tab value="resume-builder" label="Resume Builder" />
            <Tab value="ats-score" label="ATS Score" />
            <Tab value="resume-optimizer" label="Resume Optimizer" />
            <Tab value="cover-letter" label="Cover Letter" />
            <Tab value="skill-gap" label="Skill Gap" />
            <Tab value="roadmap" label="Career Roadmap" />
            <Tab value="mock-interview" label="Mock Interview" />
            <Tab value="interview-feedback" label="Interview Feedback" />
            <Tab value="portfolio" label="Portfolio" />
            <Tab value="learning" label="Learning" />
            <Tab value="salary" label="Salary Estimator" />
            <Tab value="insights" label="Career Insights" />
            <Tab value="application-assistant" label="Application Assistant" />
            <Tab value="job-tracker" label="Job Tracker" />
            <Tab value="notifications" label="AI Notifications" />
            <Tab value="achievements" label="Achievements" />
            <Tab value="reports" label="Reports" />
            <Tab value="integrations" label="Integrations" />
          </Tabs>
        </Paper>

        {tab === 'dashboard' && (
          <Grid container spacing={1.2}>
            <Grid item xs={12} sm={6} md={3}>{statCard('Profile Completion', `${overview.profileCompletion}%`, '#1d4ed8')}</Grid>
            <Grid item xs={12} sm={6} md={3}>{statCard('Resume Score', `${overview.resumeScore}%`, '#0369a1')}</Grid>
            <Grid item xs={12} sm={6} md={3}>{statCard('ATS Resume Score', `${overview.atsResumeScore}%`, '#0f766e')}</Grid>
            <Grid item xs={12} sm={6} md={3}>{statCard('Applications', overview.applications, '#9333ea')}</Grid>
            <Grid item xs={12} sm={6} md={3}>{statCard('Interview Invitations', overview.interviewInvitations, '#be123c')}</Grid>
            <Grid item xs={12} sm={6} md={3}>{statCard('Skill Score', `${overview.skillScore}%`, '#c2410c')}</Grid>
            <Grid item xs={12} sm={6} md={3}>{statCard('Career Readiness', `${overview.careerReadinessScore}%`, '#0e7490')}</Grid>
            <Grid item xs={12} sm={6} md={3}>{statCard('AI Recommendations', overview.aiRecommendations, '#7c3aed')}</Grid>
          </Grid>
        )}

        {tab === 'assistant' && (
          <Grid container spacing={1.2}>
            <Grid item xs={12} md={3}>
              <Card sx={{ borderRadius: 2, border: '1px solid #e2e8f0', height: '100%' }}>
                <CardContent>
                  <Stack spacing={1}>
                    <Button startIcon={<NewChatIcon />} variant="contained" onClick={() => {
                      const created = aiCareerHubService.createNewChat(user.id, 'New Career Chat');
                      setThreads(aiCareerHubService.getChatHistory(user.id));
                      setActiveThreadId(created.id);
                    }}>
                      New Chat
                    </Button>
                    <Typography variant="subtitle2">Pinned Chats</Typography>
                    {aiCareerHubService.getPinnedChats(user.id).map((thread) => (
                      <Button key={thread.id} variant="text" sx={{ justifyContent: 'flex-start' }} onClick={() => setActiveThreadId(thread.id)}>
                        {thread.title}
                      </Button>
                    ))}
                    <Divider />
                    <Typography variant="subtitle2">Conversation History</Typography>
                    <Box sx={{ maxHeight: 220, overflowY: 'auto' }}>
                      {threads.map((thread) => (
                        <Stack key={thread.id} direction="row" spacing={0.4} alignItems="center" justifyContent="space-between" sx={{ mb: 0.4 }}>
                          <Button size="small" variant={activeThreadId === thread.id ? 'contained' : 'text'} sx={{ justifyContent: 'flex-start', textTransform: 'none', maxWidth: 170 }} onClick={() => setActiveThreadId(thread.id)}>
                            {thread.title}
                          </Button>
                          <Stack direction="row" spacing={0.2}>
                            <Button size="small" onClick={() => {
                              aiCareerHubService.togglePinChat(user.id, thread.id);
                              setThreads(aiCareerHubService.getChatHistory(user.id));
                            }}><PinIcon fontSize="inherit" /></Button>
                            <Button size="small" color="error" onClick={() => {
                              aiCareerHubService.deleteChat(user.id, thread.id);
                              const next = aiCareerHubService.getChatHistory(user.id);
                              setThreads(next);
                              setActiveThreadId(next[0]?.id || '');
                            }}>x</Button>
                          </Stack>
                        </Stack>
                      ))}
                    </Box>
                    <Divider />
                    <Typography variant="subtitle2">Saved Prompts</Typography>
                    <TextField size="small" label="Prompt title" value={savingPromptTitle} onChange={(e) => setSavingPromptTitle(e.target.value)} />
                    <Button size="small" variant="outlined" onClick={() => {
                      if (!chatPrompt.trim()) {
                        toast.error('Enter prompt text to save');
                        return;
                      }
                      aiCareerHubService.savePrompt(user.id, savingPromptTitle || 'Saved Prompt', chatPrompt);
                      setSavedPrompts(aiCareerHubService.listSavedPrompts(user.id));
                      toast.success('Prompt saved');
                    }}>
                      Save Current Prompt
                    </Button>
                    <Box sx={{ maxHeight: 160, overflowY: 'auto' }}>
                      {savedPrompts.map((p) => (
                        <Button key={p.id} size="small" variant="text" sx={{ justifyContent: 'flex-start', textTransform: 'none' }} onClick={() => setChatPrompt(p.prompt)}>
                          {p.title}
                        </Button>
                      ))}
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={9}>
              <Card sx={{ borderRadius: 2, border: '1px solid #e2e8f0', height: '100%' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', minHeight: 560 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>AI Career Assistant</Typography>
                    <Button startIcon={<DownloadIcon />} variant="outlined" size="small" onClick={() => {
                      if (!activeThreadId) return;
                      const markdown = aiCareerHubService.exportChatMarkdown(user.id, activeThreadId);
                      downloadText('ai-career-chat.md', markdown);
                    }}>
                      Export Chat
                    </Button>
                  </Stack>

                  <Box sx={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 2, p: 1.2, mb: 1, bgcolor: '#f8fafc' }}>
                    {activeThread?.messages?.length ? activeThread.messages.map((msg: any) => (
                      <Box key={msg.id} sx={{ mb: 1.2, ml: msg.role === 'assistant' ? 0 : 'auto', maxWidth: '90%' }}>
                        <Paper sx={{ p: 1, bgcolor: msg.role === 'assistant' ? '#ffffff' : '#dbeafe', borderRadius: 2 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                            {msg.role === 'assistant' ? 'AI Career Assistant' : 'You'}
                          </Typography>
                          {msg.role === 'assistant' ? (
                            <Box sx={{ '& p': { my: 0.5 }, '& ul': { pl: 2.5 }, '& li': { mb: 0.3 } }}>
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </Box>
                          ) : (
                            <Typography variant="body2">{msg.content}</Typography>
                          )}
                        </Paper>
                      </Box>
                    )) : (
                      <Alert severity="info">Start a new conversation. AI automatically uses your profile, resume, skills, applications, saved jobs, interview signals and recruiter messages.</Alert>
                    )}
                  </Box>

                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                    <TextField fullWidth multiline minRows={2} maxRows={6} value={chatPrompt} onChange={(e) => setChatPrompt(e.target.value)} placeholder="Ask about resume, interviews, applications, salary, roadmap..." />
                    <Button
                      variant="contained"
                      startIcon={<ChatIcon />}
                      onClick={async () => {
                        const text = chatPrompt.trim();
                        if (!text) return;
                        let threadId = activeThreadId;
                        if (!threadId) {
                          const created = aiCareerHubService.createNewChat(user.id, 'New Career Chat');
                          threadId = created.id;
                          setActiveThreadId(created.id);
                        }
                        try {
                          await aiCareerHubService.sendMessage(user.id, threadId, text);
                          setChatPrompt('');
                          const nextThreads = aiCareerHubService.getChatHistory(user.id);
                          setThreads(nextThreads);
                        } catch (error: any) {
                          toast.error(error?.message || 'Unable to send prompt');
                        }
                      }}
                    >
                      Send
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {tab === 'resume-builder' && (
          <Grid container spacing={1.2}>
            <Grid item xs={12} md={3}>
              <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Templates</Typography>
                  <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                    <InputLabel>Template</InputLabel>
                    <Select value={resumeTemplate} label="Template" onChange={(e) => setResumeTemplate(e.target.value as ResumeTemplate)}>
                      <MenuItem value="modern">Modern</MenuItem>
                      <MenuItem value="professional">Professional</MenuItem>
                      <MenuItem value="executive">Executive</MenuItem>
                      <MenuItem value="developer">Developer</MenuItem>
                      <MenuItem value="designer">Designer</MenuItem>
                      <MenuItem value="fresher">Fresher</MenuItem>
                    </Select>
                  </FormControl>
                  <Button fullWidth variant="contained" onClick={async () => {
                    const draft = await aiCareerHubService.buildResumeDraft(user.id, resumeTemplate);
                    setResumeDraft(draft);
                    toast.success('Resume regenerated');
                  }}>
                    Generate Resume
                  </Button>
                  <Stack spacing={0.7} sx={{ mt: 1 }}>
                    <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => {
                      const content = aiCareerHubService.downloadResumeContent(user.id, 'pdf');
                      downloadText('resume.pdf.txt', content);
                    }}>Download PDF</Button>
                    <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => {
                      const content = aiCareerHubService.downloadResumeContent(user.id, 'docx');
                      downloadText('resume.docx.txt', content);
                    }}>Download DOCX</Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={9}>
              <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Editable Resume Sections</Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={12}><TextField fullWidth label="Professional Summary" value={resumeDraft.sections.summary} onChange={(e) => setResumeDraft((cur: any) => ({ ...cur, sections: { ...cur.sections, summary: e.target.value } }))} /></Grid>
                    <Grid item xs={12} md={6}><TextField fullWidth multiline minRows={3} label="Experience (one per line)" value={resumeDraft.sections.experience.join('\n')} onChange={(e) => setResumeDraft((cur: any) => ({ ...cur, sections: { ...cur.sections, experience: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean) } }))} /></Grid>
                    <Grid item xs={12} md={6}><TextField fullWidth multiline minRows={3} label="Projects (one per line)" value={resumeDraft.sections.projects.join('\n')} onChange={(e) => setResumeDraft((cur: any) => ({ ...cur, sections: { ...cur.sections, projects: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean) } }))} /></Grid>
                    <Grid item xs={12} md={6}><TextField fullWidth multiline minRows={3} label="Skills (comma separated)" value={resumeDraft.sections.skills.join(', ')} onChange={(e) => setResumeDraft((cur: any) => ({ ...cur, sections: { ...cur.sections, skills: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) } }))} /></Grid>
                    <Grid item xs={12} md={6}><TextField fullWidth multiline minRows={3} label="Education (one per line)" value={resumeDraft.sections.education.join('\n')} onChange={(e) => setResumeDraft((cur: any) => ({ ...cur, sections: { ...cur.sections, education: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean) } }))} /></Grid>
                    <Grid item xs={12} md={6}><TextField fullWidth multiline minRows={2} label="Certifications (one per line)" value={resumeDraft.sections.certifications.join('\n')} onChange={(e) => setResumeDraft((cur: any) => ({ ...cur, sections: { ...cur.sections, certifications: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean) } }))} /></Grid>
                    <Grid item xs={12} md={6}><TextField fullWidth multiline minRows={2} label="Achievements (one per line)" value={resumeDraft.sections.achievements.join('\n')} onChange={(e) => setResumeDraft((cur: any) => ({ ...cur, sections: { ...cur.sections, achievements: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean) } }))} /></Grid>
                    <Grid item xs={12}><Button variant="contained" startIcon={<ResumeIcon />} onClick={() => {
                      const next = aiCareerHubService.updateResumeDraft(user.id, resumeDraft.sections);
                      setResumeDraft(next);
                      toast.success('Resume draft saved');
                    }}>Save Resume Draft</Button></Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {tab === 'ats-score' && (
          <Grid container spacing={1.2}>
            <Grid item xs={12} md={6}><TextField fullWidth multiline minRows={8} label="Paste Resume Text" value={resumeText} onChange={(e) => setResumeText(e.target.value)} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth multiline minRows={8} label="Paste Target Job Description" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} /></Grid>
            <Grid item xs={12}><Button variant="contained" startIcon={<AtsIcon />} onClick={() => {
              const result = aiCareerHubService.analyzeAtsResume(resumeText, jobDescription);
              setAtsResult(result);
            }}>Analyze ATS Score</Button></Grid>
            {atsResult && (
              <>
                <Grid item xs={12} sm={6} md={3}>{statCard('Overall ATS Score', `${atsResult.overallScore}%`, '#1d4ed8')}</Grid>
                <Grid item xs={12} sm={6} md={3}>{statCard('Formatting', `${atsResult.formattingScore}%`, '#0369a1')}</Grid>
                <Grid item xs={12} sm={6} md={3}>{statCard('Keyword', `${atsResult.keywordScore}%`, '#0f766e')}</Grid>
                <Grid item xs={12} sm={6} md={3}>{statCard('Experience', `${atsResult.experienceScore}%`, '#9333ea')}</Grid>
                <Grid item xs={12} sm={6} md={3}>{statCard('Skills', `${atsResult.skillsScore}%`, '#be123c')}</Grid>
                <Grid item xs={12} sm={6} md={3}>{statCard('Grammar', `${atsResult.grammarScore}%`, '#c2410c')}</Grid>
                <Grid item xs={12} sm={6} md={3}>{statCard('Readability', `${atsResult.readabilityScore}%`, '#0e7490')}</Grid>
                <Grid item xs={12} sm={6} md={3}>{statCard('Section Completeness', `${atsResult.sectionCompleteness}%`, '#7c3aed')}</Grid>
                <Grid item xs={12} md={4}><Alert severity="warning">Missing Keywords: {(atsResult.missingKeywords || []).join(', ') || 'None'}</Alert></Grid>
                <Grid item xs={12} md={4}><Alert severity="warning">Missing Skills: {(atsResult.missingSkills || []).join(', ') || 'None'}</Alert></Grid>
                <Grid item xs={12} md={4}><Alert severity="info">Weak Sections: {(atsResult.weakSections || []).join(', ') || 'None'}</Alert></Grid>
                <Grid item xs={12}><Alert severity="success">{(atsResult.actionableImprovements || []).join(' | ')}</Alert></Grid>
              </>
            )}
          </Grid>
        )}

        {tab === 'resume-optimizer' && (
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Resume Optimizer</Typography>
              <Grid container spacing={1}>
                <Grid item xs={12}><TextField fullWidth label="Professional Summary" value={optimizerInput.summary} onChange={(e) => setOptimizerInput((cur) => ({ ...cur, summary: e.target.value }))} /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Experience" value={optimizerInput.experience} onChange={(e) => setOptimizerInput((cur) => ({ ...cur, experience: e.target.value }))} /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Projects" value={optimizerInput.projects} onChange={(e) => setOptimizerInput((cur) => ({ ...cur, projects: e.target.value }))} /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Skills" value={optimizerInput.skills} onChange={(e) => setOptimizerInput((cur) => ({ ...cur, skills: e.target.value }))} /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Achievements" value={optimizerInput.achievements} onChange={(e) => setOptimizerInput((cur) => ({ ...cur, achievements: e.target.value }))} /></Grid>
                <Grid item xs={12}><Button variant="contained" onClick={() => setOptimizerOutput(aiCareerHubService.optimizeResumeSections(optimizerInput))}>Optimize Sections</Button></Grid>
                {optimizerOutput && <Grid item xs={12}><Paper sx={{ p: 1.2, bgcolor: '#f8fafc' }}><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(optimizerOutput, null, 2)}</Typography></Paper></Grid>}
              </Grid>
            </CardContent>
          </Card>
        )}

        {tab === 'cover-letter' && (
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>AI Cover Letter Generator</Typography>
              <Grid container spacing={1}>
                <Grid item xs={12} md={4}><TextField fullWidth label="Company" value={coverInput.company} onChange={(e) => setCoverInput((cur) => ({ ...cur, company: e.target.value }))} /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth label="Role" value={coverInput.role} onChange={(e) => setCoverInput((cur) => ({ ...cur, role: e.target.value }))} /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth label="Experience" value={coverInput.experience} onChange={(e) => setCoverInput((cur) => ({ ...cur, experience: e.target.value }))} /></Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Tone</InputLabel>
                    <Select value={coverInput.tone} label="Tone" onChange={(e) => setCoverInput((cur) => ({ ...cur, tone: e.target.value as CoverLetterTone }))}>
                      <MenuItem value="professional">Professional</MenuItem>
                      <MenuItem value="friendly">Friendly</MenuItem>
                      <MenuItem value="executive">Executive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={9}><TextField fullWidth multiline minRows={4} label="Job Description" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} /></Grid>
                <Grid item xs={12}><Button variant="contained" onClick={() => setCoverLetter(aiCareerHubService.generateCoverLetter({
                  jobDescription,
                  company: coverInput.company,
                  role: coverInput.role,
                  experience: coverInput.experience,
                  tone: coverInput.tone,
                  candidateName: user.name,
                }))}>Generate Cover Letter</Button></Grid>
                {coverLetter && <Grid item xs={12}><Paper sx={{ p: 1.2, bgcolor: '#f8fafc' }}><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{coverLetter}</Typography></Paper></Grid>}
              </Grid>
            </CardContent>
          </Card>
        )}

        {tab === 'skill-gap' && (
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'stretch', md: 'center' }} sx={{ mb: 1 }}>
                <FormControl sx={{ minWidth: 320 }}>
                  <InputLabel>Select Job</InputLabel>
                  <Select value={selectedJobId} label="Select Job" onChange={async (e) => {
                    const jobId = String(e.target.value);
                    setSelectedJobId(jobId);
                    const gap = await aiCareerHubService.analyzeSkillGap(user.id, jobId);
                    setSkillGap(gap);
                  }}>
                    {jobs.map((job) => <MenuItem key={job.id} value={String(job.id)}>{job.title} - {job.company_name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Stack>
              {skillGap && (
                <Grid container spacing={1}>
                  <Grid item xs={12} md={6}><Alert severity="success">Matching Skills: {(skillGap.matchingSkills || []).join(', ') || 'None'}</Alert></Grid>
                  <Grid item xs={12} md={6}><Alert severity="warning">Missing Skills: {(skillGap.missingSkills || []).join(', ') || 'None'}</Alert></Grid>
                  <Grid item xs={12} md={6}><Alert severity="info">Recommended Skills: {(skillGap.recommendedSkills || []).join(', ') || 'None'}</Alert></Grid>
                  <Grid item xs={12} md={6}><Alert severity="error">Priority Skills: {(skillGap.prioritySkills || []).join(', ') || 'None'}</Alert></Grid>
                  <Grid item xs={12}><Paper sx={{ p: 1.2, bgcolor: '#f8fafc' }}><Typography variant="subtitle2" sx={{ mb: 0.6 }}>Learning Path</Typography>{(skillGap.learningPath || []).map((step: string) => <Typography key={step} variant="body2">- {step}</Typography>)}</Paper></Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        )}

        {tab === 'roadmap' && (
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 1 }}>
                <FormControl sx={{ minWidth: 180 }}>
                  <InputLabel>Duration</InputLabel>
                  <Select value={roadmapWindow} label="Duration" onChange={(e) => setRoadmapWindow(e.target.value as CareerPlanWindow)}>
                    <MenuItem value="3m">3 Months</MenuItem>
                    <MenuItem value="6m">6 Months</MenuItem>
                    <MenuItem value="1y">1 Year</MenuItem>
                    <MenuItem value="2y">2 Years</MenuItem>
                    <MenuItem value="5y">5 Years</MenuItem>
                  </Select>
                </FormControl>
                <TextField label="Target Role" value={roadmapRole} onChange={(e) => setRoadmapRole(e.target.value)} />
                <Button variant="contained" onClick={() => setRoadmap(aiCareerHubService.generateCareerRoadmap(roadmapWindow, roadmapRole))}>Generate Roadmap</Button>
              </Stack>
              {roadmap && <Grid container spacing={1}><Grid item xs={12} md={6}><Alert severity="info">Technologies: {(roadmap.technologies || []).join(', ')}</Alert></Grid><Grid item xs={12} md={6}><Alert severity="success">Certifications: {(roadmap.certifications || []).join(', ')}</Alert></Grid><Grid item xs={12} md={6}><Alert severity="warning">Projects: {(roadmap.projects || []).join(', ')}</Alert></Grid><Grid item xs={12} md={6}><Alert severity="error">Career Goals: {(roadmap.careerGoals || []).join(', ')}</Alert></Grid></Grid>}
            </CardContent>
          </Card>
        )}

        {tab === 'mock-interview' && (
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Mock Interview</Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 1 }}>
                <FormControl sx={{ minWidth: 220 }}><InputLabel>Interview Type</InputLabel><Select value={mockType} label="Interview Type" onChange={(e) => setMockType(e.target.value as MockInterviewType)}><MenuItem value="hr">HR</MenuItem><MenuItem value="technical">Technical</MenuItem><MenuItem value="behavioral">Behavioral</MenuItem><MenuItem value="coding">Coding</MenuItem><MenuItem value="system-design">System Design</MenuItem><MenuItem value="role-specific">Role Specific</MenuItem></Select></FormControl>
                <TextField label="Role" value={mockRole} onChange={(e) => setMockRole(e.target.value)} />
                <Button variant="contained" onClick={() => {
                  const session = aiCareerHubService.startMockInterview(mockType, mockRole);
                  setMockSession(session);
                  setMockEvaluations([]);
                  setFeedbackReport(null);
                }}>Start Mock Interview</Button>
              </Stack>
              {mockSession && <Paper sx={{ p: 1.2, mb: 1, bgcolor: '#f8fafc' }}><Typography variant="subtitle2" sx={{ mb: 0.6 }}>Questions</Typography>{mockSession.questions.map((q: string, idx: number) => <Typography key={q} variant="body2">{idx + 1}. {q}</Typography>)}</Paper>}
              <TextField fullWidth multiline minRows={4} label="Your Answer" value={mockAnswer} onChange={(e) => setMockAnswer(e.target.value)} sx={{ mb: 1 }} />
              <Stack direction="row" spacing={1}><Button variant="outlined" onClick={() => {
                const evalResult = aiCareerHubService.evaluateMockInterviewAnswer(mockAnswer);
                setMockEvaluations((cur) => [evalResult, ...cur]);
                setMockAnswer('');
              }}>Evaluate Answer</Button><Button variant="contained" onClick={() => {
                const report = aiCareerHubService.generateInterviewFeedback(mockEvaluations);
                setFeedbackReport(report);
              }}>Generate Interview Feedback</Button></Stack>
              {mockEvaluations.length > 0 && <TableContainer component={Paper} sx={{ mt: 1 }}><Table size="small"><TableHead><TableRow><TableCell>Confidence</TableCell><TableCell>Communication</TableCell><TableCell>Technical Accuracy</TableCell><TableCell>Problem Solving</TableCell><TableCell>Overall</TableCell></TableRow></TableHead><TableBody>{mockEvaluations.map((item: any, idx: number) => <TableRow key={`${item.overallRating}_${idx}`}><TableCell>{item.confidence}</TableCell><TableCell>{item.communication}</TableCell><TableCell>{item.technicalAccuracy}</TableCell><TableCell>{item.problemSolving}</TableCell><TableCell>{item.overallRating}</TableCell></TableRow>)}</TableBody></Table></TableContainer>}
            </CardContent>
          </Card>
        )}

        {tab === 'interview-feedback' && (
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Interview Feedback</Typography>
              {feedbackReport ? (
                <Grid container spacing={1}>
                  <Grid item xs={12} md={6}><Alert severity="success">Strengths: {(feedbackReport.strengths || []).join(', ')}</Alert></Grid>
                  <Grid item xs={12} md={6}><Alert severity="warning">Weaknesses: {(feedbackReport.weaknesses || []).join(', ')}</Alert></Grid>
                  <Grid item xs={12} md={6}><Alert severity="error">Common Mistakes: {(feedbackReport.commonMistakes || []).join(', ')}</Alert></Grid>
                  <Grid item xs={12} md={6}><Alert severity="info">Recommended Practice: {(feedbackReport.recommendedPractice || []).join(', ')}</Alert></Grid>
                  <Grid item xs={12}>{statCard('Confidence Score', `${feedbackReport.confidenceScore}%`, '#1d4ed8')}</Grid>
                </Grid>
              ) : (
                <Alert severity="info">Generate feedback from Mock Interview tab after evaluating answers.</Alert>
              )}
            </CardContent>
          </Card>
        )}

        {tab === 'portfolio' && (
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Portfolio Builder</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>{portfolio.headline}</Typography>
              <Grid container spacing={1}>
                <Grid item xs={12} md={6}><Alert severity="success">Projects: {(portfolio.projects || []).join(', ')}</Alert></Grid>
                <Grid item xs={12} md={6}><Alert severity="info">Skills: {(portfolio.skills || []).join(', ')}</Alert></Grid>
                <Grid item xs={12} md={6}><Alert severity="warning">Experience: {(portfolio.experience || []).join(', ') || 'Add more experience details in profile.'}</Alert></Grid>
                <Grid item xs={12} md={6}><Alert severity="error">Contact: {portfolio.contact || 'Update profile email'}</Alert></Grid>
                <Grid item xs={12}><Stack direction={{ xs: 'column', md: 'row' }} spacing={1}><TextField fullWidth label="GitHub" value={portfolio.socialLinks?.github || ''} /><TextField fullWidth label="LinkedIn" value={portfolio.socialLinks?.linkedin || ''} /><Button variant="contained" onClick={() => window.open(aiCareerHubService.getPortfolioLivePreviewUrl(user.id), '_blank')}>Live Preview</Button></Stack></Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {tab === 'learning' && (
          <Grid container spacing={1.2}>
            <Grid item xs={12} md={6}><Alert severity="success">Courses: {(learning.courses || []).join(', ')}</Alert></Grid>
            <Grid item xs={12} md={6}><Alert severity="info">Certifications: {(learning.certifications || []).join(', ')}</Alert></Grid>
            <Grid item xs={12} md={6}><Alert severity="warning">Books: {(learning.books || []).join(', ')}</Alert></Grid>
            <Grid item xs={12} md={6}><Alert severity="error">Practice Platforms: {(learning.practicePlatforms || []).join(', ')}</Alert></Grid>
            <Grid item xs={12}><Alert severity="info">Coding Challenges: {(learning.codingChallenges || []).join(', ')}</Alert></Grid>
            <Grid item xs={12}><Paper sx={{ p: 1.2, bgcolor: '#f8fafc' }}><Typography variant="subtitle2">Learning Path</Typography>{(learning.learningPath || []).map((step: string) => <Typography key={step} variant="body2">- {step}</Typography>)}</Paper></Grid>
          </Grid>
        )}

        {tab === 'salary' && (
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <CardContent>
              <Grid container spacing={1}>
                <Grid item xs={12} md={6}><TextField fullWidth label="Skills (comma separated)" value={salaryInput.skills} onChange={(e) => setSalaryInput((cur) => ({ ...cur, skills: e.target.value }))} /></Grid>
                <Grid item xs={12} md={3}><TextField fullWidth type="number" label="Experience (years)" value={salaryInput.experienceYears} onChange={(e) => setSalaryInput((cur) => ({ ...cur, experienceYears: Number(e.target.value) || 0 }))} /></Grid>
                <Grid item xs={12} md={3}><TextField fullWidth label="Location" value={salaryInput.location} onChange={(e) => setSalaryInput((cur) => ({ ...cur, location: e.target.value }))} /></Grid>
                <Grid item xs={12} md={6}><TextField fullWidth label="Role" value={salaryInput.role} onChange={(e) => setSalaryInput((cur) => ({ ...cur, role: e.target.value }))} /></Grid>
                <Grid item xs={12} md={6}><TextField fullWidth label="Industry" value={salaryInput.industry} onChange={(e) => setSalaryInput((cur) => ({ ...cur, industry: e.target.value }))} /></Grid>
                <Grid item xs={12}><Button variant="contained" onClick={() => {
                  const estimate = aiCareerHubService.estimateSalary({
                    skills: salaryInput.skills.split(',').map((s) => s.trim()).filter(Boolean),
                    experienceYears: salaryInput.experienceYears,
                    location: salaryInput.location,
                    role: salaryInput.role,
                    industry: salaryInput.industry,
                  });
                  setSalaryEstimate(estimate);
                }}>Estimate Salary</Button></Grid>
                {salaryEstimate && <><Grid item xs={12} sm={4}>{statCard('Expected Min', `Rs ${salaryEstimate.expectedMin.toLocaleString()}`, '#1d4ed8')}</Grid><Grid item xs={12} sm={4}>{statCard('Median', `Rs ${salaryEstimate.median.toLocaleString()}`, '#0f766e')}</Grid><Grid item xs={12} sm={4}>{statCard('Expected Max', `Rs ${salaryEstimate.expectedMax.toLocaleString()}`, '#9333ea')}</Grid><Grid item xs={12}><LinearProgress variant="determinate" value={salaryEstimate.confidence} sx={{ height: 10, borderRadius: 12 }} /><Typography variant="caption">Confidence: {salaryEstimate.confidence}%</Typography></Grid></>}
              </Grid>
            </CardContent>
          </Card>
        )}

        {tab === 'insights' && (
          <Grid container spacing={1}>
            <Grid item xs={12} md={6}><Alert severity="success">Trending Technologies: {(insights.trendingTechnologies || []).join(', ')}</Alert></Grid>
            <Grid item xs={12} md={6}><Alert severity="info">Most In-Demand Skills: {(insights.mostInDemandSkills || []).join(', ')}</Alert></Grid>
            <Grid item xs={12} md={6}><Alert severity="warning">Hiring Companies: {(insights.hiringCompanies || []).join(', ')}</Alert></Grid>
            <Grid item xs={12} md={6}><Alert severity="error">Remote Opportunities: {(insights.remoteOpportunities || []).join(', ')}</Alert></Grid>
            <Grid item xs={12}><Alert severity="info">Emerging Careers: {(insights.emergingCareers || []).join(', ')}</Alert></Grid>
          </Grid>
        )}

        {tab === 'application-assistant' && (
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 1 }}>
                <FormControl sx={{ minWidth: 320 }}>
                  <InputLabel>Choose Job</InputLabel>
                  <Select value={selectedJobId} label="Choose Job" onChange={async (e) => {
                    const jobId = String(e.target.value);
                    setSelectedJobId(jobId);
                    const result = await aiCareerHubService.getApplicationAssistant(user.id, jobId);
                    setApplicationAssistant(result);
                  }}>
                    {jobs.map((job) => <MenuItem key={job.id} value={String(job.id)}>{job.title} - {job.company_name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Stack>
              {applicationAssistant && (
                <Grid container spacing={1}>
                  <Grid item xs={12} md={3}>{statCard('Match Score', `${applicationAssistant.matchScore}%`, '#1d4ed8')}</Grid>
                  <Grid item xs={12} md={9}><Alert severity="warning">Missing Skills: {(applicationAssistant.missingSkills || []).join(', ') || 'None'}</Alert></Grid>
                  <Grid item xs={12}><Alert severity="success">Resume Improvements: {(applicationAssistant.resumeImprovements || []).join(' | ')}</Alert></Grid>
                  <Grid item xs={12}><Paper sx={{ p: 1.2, bgcolor: '#f8fafc' }}><Typography variant="subtitle2" sx={{ mb: 0.6 }}>Generated Cover Letter</Typography><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{applicationAssistant.coverLetter}</Typography></Paper></Grid>
                  <Grid item xs={12}><Alert severity="info">Application Tips: {(applicationAssistant.applicationTips || []).join(' | ')}</Alert></Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        )}

        {tab === 'job-tracker' && (
          <Grid container spacing={1.2}>
            <Grid item xs={12} sm={6} md={4}>{statCard('Saved Jobs', jobTracker.savedJobs, '#1d4ed8')}</Grid>
            <Grid item xs={12} sm={6} md={4}>{statCard('Applied Jobs', jobTracker.appliedJobs, '#0f766e')}</Grid>
            <Grid item xs={12} sm={6} md={4}>{statCard('Interview Stage', jobTracker.interviewStage, '#9333ea')}</Grid>
            <Grid item xs={12} sm={6} md={4}>{statCard('Offer Stage', jobTracker.offerStage, '#be123c')}</Grid>
            <Grid item xs={12} sm={6} md={4}>{statCard('Rejected Jobs', jobTracker.rejectedJobs, '#c2410c')}</Grid>
            <Grid item xs={12}><TableContainer component={Paper}><Table size="small"><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Event</TableCell></TableRow></TableHead><TableBody>{(jobTracker.timeline || []).slice(0, 20).map((t: any) => <TableRow key={`${t.date}_${t.event}`}><TableCell>{t.date}</TableCell><TableCell>{t.event}</TableCell></TableRow>)}</TableBody></Table></TableContainer></Grid>
          </Grid>
        )}

        {tab === 'notifications' && (
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <Button variant="contained" onClick={async () => {
                  await aiCareerHubService.publishAiNotifications(user.id);
                  const notes = await aiCareerHubService.getAiNotifications(user.id);
                  setAiNotifications(notes);
                  toast.success('AI notifications published');
                }}>Publish Notifications</Button>
              </Stack>
              <TableContainer component={Paper}><Table size="small"><TableHead><TableRow><TableCell>Type</TableCell><TableCell>Message</TableCell><TableCell>Time</TableCell></TableRow></TableHead><TableBody>{aiNotifications.map((n) => <TableRow key={n.id}><TableCell>{n.type}</TableCell><TableCell>{n.message}</TableCell><TableCell>{n.at}</TableCell></TableRow>)}</TableBody></Table></TableContainer>
            </CardContent>
          </Card>
        )}

        {tab === 'achievements' && (
          <Grid container spacing={1}>
            {achievements.map((badge: any) => (
              <Grid item xs={12} sm={6} md={4} key={badge.key}>
                <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: badge.unlocked ? '#ecfdf5' : '#fff7ed' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{badge.label}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{badge.criteria}</Typography>
                    <Chip label={badge.unlocked ? 'Unlocked' : 'Locked'} color={badge.unlocked ? 'success' : 'warning'} size="small" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {tab === 'reports' && (
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} flexWrap="wrap">
                <Button variant="contained" startIcon={<DownloadIcon />} onClick={() => downloadText('career-progress-report.md', reports.careerProgressReport)}>Career Progress Report</Button>
                <Button variant="outlined" onClick={() => downloadText('resume-report.md', reports.resumeReport)}>Resume Report</Button>
                <Button variant="outlined" onClick={() => downloadText('skill-report.md', reports.skillReport)}>Skill Report</Button>
                <Button variant="outlined" onClick={() => downloadText('interview-report.md', reports.interviewReport)}>Interview Report</Button>
                <Button variant="outlined" onClick={() => downloadText('application-report.md', reports.applicationReport)}>Application Report</Button>
                <Button variant="outlined" onClick={() => downloadText('career-progress.pdf.txt', aiCareerHubService.downloadReport(reports.careerProgressReport, 'pdf'))}>Download PDF</Button>
                <Button variant="outlined" onClick={() => downloadText('career-progress.docx.txt', aiCareerHubService.downloadReport(reports.careerProgressReport, 'docx'))}>Download DOCX</Button>
              </Stack>
            </CardContent>
          </Card>
        )}

        {tab === 'integrations' && (
          <Grid container spacing={1}>
            <Grid item xs={12} md={6}><Alert severity={integrationSummary.candidateDashboard ? 'success' : 'error'}>Candidate Dashboard Integration: {integrationSummary.candidateDashboard ? 'Connected' : 'Disconnected'}</Alert></Grid>
            <Grid item xs={12} md={6}><Alert severity={integrationSummary.resume ? 'success' : 'warning'}>Resume Integration: {integrationSummary.resume ? 'Connected' : 'Resume Missing'}</Alert></Grid>
            <Grid item xs={12} md={6}><Alert severity={integrationSummary.jobs ? 'success' : 'error'}>Jobs Integration: {integrationSummary.jobs ? 'Connected' : 'Disconnected'}</Alert></Grid>
            <Grid item xs={12} md={6}><Alert severity={integrationSummary.applications ? 'success' : 'error'}>Applications Integration: {integrationSummary.applications ? 'Connected' : 'Disconnected'}</Alert></Grid>
            <Grid item xs={12} md={6}><Alert severity={integrationSummary.messaging ? 'success' : 'error'}>Messaging Integration: {integrationSummary.messaging ? 'Connected' : 'Disconnected'}</Alert></Grid>
            <Grid item xs={12} md={6}><Alert severity={integrationSummary.interviewManagement ? 'success' : 'warning'}>Interview Management Integration: {integrationSummary.interviewManagement ? 'Connected' : 'Low activity'}</Alert></Grid>
            <Grid item xs={12} md={6}><Alert severity={integrationSummary.analytics ? 'success' : 'error'}>Analytics Integration: {integrationSummary.analytics ? 'Connected' : 'Disconnected'}</Alert></Grid>
            <Grid item xs={12} md={6}><Alert severity={integrationSummary.recruiterAi ? 'success' : 'error'}>Recruiter AI Integration: {integrationSummary.recruiterAi ? 'Connected' : 'Disconnected'}</Alert></Grid>
            <Grid item xs={12}><Stack direction={{ xs: 'column', md: 'row' }} spacing={1}><Button component={RouterLink} to={ROUTES.DASHBOARD} variant="contained">Open Candidate Dashboard</Button><Button component={RouterLink} to={ROUTES.DASHBOARD_PROFILE} variant="outlined">Open Resume/Profile</Button><Button component={RouterLink} to={ROUTES.DASHBOARD_APPLICATIONS} variant="outlined">Open Applications</Button><Button component={RouterLink} to={ROUTES.DASHBOARD_ASSESSMENTS} variant="outlined">Open Assessments</Button><Button component={RouterLink} to={ROUTES.DASHBOARD_COMMUNITY} variant="outlined">Open Community</Button><Button component={RouterLink} to={ROUTES.DASHBOARD_REFERRALS} variant="outlined">Open Referrals</Button><Button component={RouterLink} to={ROUTES.MESSAGING} variant="outlined">Open Messaging</Button></Stack></Grid>
          </Grid>
        )}

        <Alert severity={permissions.isPremium ? 'success' : 'warning'} sx={{ mt: 2 }} icon={<InsightIcon />}>
          {permissions.isPremium
            ? 'Premium access: unlimited AI requests and full feature access enabled.'
            : `Free access: ${permissions.remainingDailyRequests} AI requests remaining for today. Upgrade to premium for unlimited AI features.`}
        </Alert>
      </MotionBox>
    </Layout>
  );
};

export default AiCareerHub;
