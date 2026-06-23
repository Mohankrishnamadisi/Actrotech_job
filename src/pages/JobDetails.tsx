import React, { Suspense, useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Button,
  Typography,
  Chip,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { LocationOn as LocationOnIcon, Work as WorkIcon, MonetizationOn as MonetizationOnIcon, BookmarkBorder as BookmarkBorderIcon, Bookmark as BookmarkIcon, Share as ShareIcon } from '@mui/icons-material';
import { Layout } from '@components/layout/Layout';
import { Loading } from '@components/common/Loading';
import { jobService, userService, applicationService, savedService, chatService } from '@services/api';
import { useAuthStore } from '@store/index';
import { useSubscription } from '@hooks/index';
import { formatDate, formatJobSalary } from '@utils/index';
import { ROUTES } from '@constants/index';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import type { Job } from '../types';

const RecommendedCandidates = React.lazy(() =>
  import('@components/recruiter/RecommendedCandidates').then((module) => ({
    default: module.RecommendedCandidates,
  }))
);

export const JobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { subscription } = useSubscription(user?.id || null);

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState('');
  const [currentCtc, setCurrentCtc] = useState('');
  const [expectedCtc, setExpectedCtc] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('');
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, string>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [savedLoading, setSavedLoading] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [jobDetailsTab, setJobDetailsTab] = useState(0);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState<{ id: string; name: string } | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchJob = async () => {
      try {
        const data = await jobService.getJobById(id);
        setJob(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load job');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  useEffect(() => {
    const checkApplied = async () => {
      if (!id || !user?.id) return;
      try {
        const [applied, saved] = await Promise.all([
          applicationService.hasUserApplied(id, user.id),
          savedService.isJobSaved(user.id, id),
        ]);
        setHasApplied(!!applied);
        setIsSaved(!!saved);
      } catch (err) {
        console.error('Failed to check application or saved status:', err);
      }
    };
    checkApplied();
  }, [id, user?.id]);

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.id) return;
      try {
        const profile = await userService.getProfile(user.id);
        if (profile) {
          setResumeUrl(profile.resume_url || profile.resumeUrl || '');
          setCurrentCtc(profile.current_ctc || profile.currentCtc || '');
          setExpectedCtc(profile.expected_ctc || profile.expectedCtc || '');
          setNoticePeriod(profile.notice_period || profile.noticePeriod || '');
        }
      } catch (err) {
        console.error('Failed to load candidate profile for application:', err);
      }
    };

    loadProfileData();
  }, [user?.id]);

  if (loading) return <Loading />;
  if (!job || error)
    return (
      <Layout>
        <Container>
          <Typography color="error">{error || 'Job not found'}</Typography>
        </Container>
      </Layout>
    );

  const jobTypeLabel = job.jobType || job.job_type || 'Job';
  const workModeLabel = job.workMode || job.work_mode || 'Onsite';
  const requiresSubscription = workModeLabel === 'Remote';
  const hasAccess = !requiresSubscription || !!subscription;
  const showRemotePremium = workModeLabel === 'Remote' && !subscription;
  const isRecruiterOwner = Boolean(user?.id && job.posted_by === user.id);

  const handleRecommendedMessage = (candidateId: string, candidateName: string) => {
    setSelectedChatUser({ id: candidateId, name: candidateName });
    setChatDialogOpen(true);
  };

  const handleSendRecommendedMessage = async () => {
    if (!selectedChatUser || !chatMessage.trim() || !user?.id) return;

    setSendingMessage(true);
    try {
      await chatService.sendMessage(user.id, selectedChatUser.id, chatMessage, 'recruiter');
      setChatMessage('');
      toast.success('Message sent successfully!');
    } catch (err) {
      console.error('Failed to send candidate message:', err);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSaveToggle = async () => {
    if (!user?.id || !job?.id) {
      Swal.fire({
        icon: 'info',
        title: 'Login required',
        text: 'Please login to save this job.',
        timer: 1800,
        showConfirmButton: false,
        background: '#FFFFFF',
        color: '#172033',
      });
      return;
    }

    setSavedLoading(true);
    try {
      if (isSaved) {
        await savedService.unsaveJob(user.id, job.id);
        setIsSaved(false);
        Swal.fire({
          icon: 'success',
          title: 'Removed from saved jobs',
          timer: 1400,
          showConfirmButton: false,
          background: '#FFFFFF',
          color: '#172033',
        });
      } else {
        await savedService.saveJob(user.id, job.id);
        setIsSaved(true);
        Swal.fire({
          icon: 'success',
          title: 'Job saved successfully',
          timer: 1400,
          showConfirmButton: false,
          background: '#FFFFFF',
          color: '#172033',
        });
      }
    } catch (err) {
      console.error('Failed to update saved job:', err);
      Swal.fire({
        icon: 'error',
        title: 'Unable to update saved job',
        text: 'Please try again later.',
        background: '#FFFFFF',
        color: '#172033',
      });
    } finally {
      setSavedLoading(false);
    }
  };

  const handleApplyClick = () => {
    if (!user) {
      Swal.fire({
        icon: 'info',
        title: 'Login required',
        text: 'Login to apply and unlock job opportunities.',
        timer: 1800,
        showConfirmButton: false,
        background: '#FFFFFF',
        color: '#172033',
      }).then(() => navigate(ROUTES.LOGIN));
      return;
    }

    const externalApplyUrl =
      job.applicationLink || job.application_link || job.applicationUrl || job.application_url;

    if (externalApplyUrl) {
      window.open(externalApplyUrl as string, '_blank', 'noopener,noreferrer');
      return;
    }

    if (requiresSubscription && !subscription) {
      Swal.fire({
        icon: 'warning',
        title: 'Premium access required',
        text: 'Remote Jobs are available only for Premium Members.',
        confirmButtonText: 'View pricing',
        confirmButtonColor: '#1D4ED8',
        background: '#FFFFFF',
        color: '#172033',
      }).then((result) => {
        if (result.isConfirmed) {
          navigate(ROUTES.PRICING);
        }
      });
      return;
    }

    if (hasApplied) {
      Swal.fire({
        icon: 'info',
        title: 'Already applied',
        text: 'You have already applied for this job.',
        timer: 1600,
        showConfirmButton: false,
        background: '#FFFFFF',
        color: '#172033',
      });
      return;
    }

    setApplyDialogOpen(true);
  };

  const handleApply = async () => {
    if (!user) {
      Swal.fire({
        icon: 'info',
        title: 'Login required',
        text: 'Login to apply and unlock job opportunities.',
        timer: 1800,
        showConfirmButton: false,
        background: '#FFFFFF',
        color: '#172033',
      }).then(() => navigate(ROUTES.LOGIN));
      return;
    }

    if (requiresSubscription && !subscription) {
      Swal.fire({
        icon: 'warning',
        title: 'Premium access required',
        text: 'Remote Jobs are available only for Premium Members.',
        confirmButtonText: 'View pricing',
        confirmButtonColor: '#1D4ED8',
        background: '#FFFFFF',
        color: '#172033',
      }).then((result) => {
        if (result.isConfirmed) {
          navigate(ROUTES.PRICING);
        }
      });
      return;
    }

    if (hasApplied) {
      Swal.fire({
        icon: 'info',
        title: 'Already applied',
        text: 'You have already applied for this job.',
        timer: 1600,
        showConfirmButton: false,
        background: '#FFFFFF',
        color: '#172033',
      });
      return;
    }

    setApplyLoading(true);
    try {
      let finalResumeUrl = resumeUrl;
      if (resumeFile) {
        finalResumeUrl = await userService.uploadResume(user.id, resumeFile);
        await userService.updateProfile(user.id, { resume_url: finalResumeUrl });
        setResumeUrl(finalResumeUrl);
      }

      if (!finalResumeUrl) {
        Swal.fire({
          icon: 'error',
          title: 'Resume required',
          text: 'Please upload a resume before applying.',
          background: '#FFFFFF',
          color: '#172033',
        });
        return;
      }

      const answers = job.screeningQuestions?.map((question) => ({
        question,
        answer: screeningAnswers[question] || '',
      }))?.filter((item) => item.answer.trim()) || [];

      await applicationService.applyForJob(
        job.id,
        user.id,
        finalResumeUrl,
        coverLetter,
        answers,
        currentCtc,
        expectedCtc,
        noticePeriod
      );

      await Swal.fire({
        icon: 'success',
        title: 'Application submitted!',
        text: 'Your application has been sent successfully.',
        timer: 1800,
        showConfirmButton: false,
        background: '#FFFFFF',
        color: '#172033',
      });
      setHasApplied(true);
      setApplyDialogOpen(false);
      navigate(ROUTES.JOBS);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Application failed',
        text: error instanceof Error ? error.message : 'Failed to apply',
        background: '#FFFFFF',
        color: '#172033',
      });
    } finally {
      setApplyLoading(false);
    }
  };

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {job.title}
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2, ...(showRemotePremium ? { filter: 'blur(4px)', userSelect: 'none' } : {}) }}>
                      {showRemotePremium ? 'Upgrade to view company' : job.company_name}
                    </Typography>
                  </Box>
                  <Button variant="text" startIcon={isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />} onClick={handleSaveToggle} disabled={savedLoading}>
                    {isSaved ? 'Saved' : 'Save'}
                  </Button>
                </Box>

                {/* Job Meta */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOnIcon sx={{ color: 'primary.main' }} />
                    <Typography variant="body2">{job.location}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WorkIcon sx={{ color: 'primary.main' }} />
                    <Typography variant="body2">{jobTypeLabel}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WorkIcon sx={{ color: 'primary.main' }} />
                    <Typography variant="body2">{workModeLabel}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MonetizationOnIcon sx={{ color: 'success.main' }} />
                    <Typography variant="body2" sx={{ color: 'success.main' }}>
                      {formatJobSalary(job.salaryMin, job.salaryMax)}
                    </Typography>
                  </Box>
                  {job.positionsAvailable || job.positions_available ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WorkIcon sx={{ color: 'primary.main' }} />
                      <Typography variant="body2" sx={showRemotePremium ? { filter: 'blur(4px)', userSelect: 'none' } : {}}>
                        {showRemotePremium ? 'Positions hidden • Upgrade' : `Hiring ${job.positionsAvailable || job.positions_available} position${(job.positionsAvailable || job.positions_available) === 1 ? '' : 's'}`}
                      </Typography>
                    </Box>
                  ) : null}
                </Box>

                {/* Skills */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Required Skills
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {job.skills.map((skill) => (
                      <Chip key={skill} label={skill} color="primary" variant="outlined" />
                    ))}
                  </Box>
                </Box>

                {isRecruiterOwner && (
                  <Tabs
                    value={jobDetailsTab}
                    onChange={(_, value) => setJobDetailsTab(value)}
                    sx={{ mb: 3, borderBottom: '1px solid rgba(148, 163, 184, 0.18)' }}
                  >
                    <Tab label="Job Details" sx={{ textTransform: 'none', fontWeight: 700 }} />
                    <Tab label="Recommended Candidates" sx={{ textTransform: 'none', fontWeight: 700 }} />
                  </Tabs>
                )}

                {isRecruiterOwner && jobDetailsTab === 1 ? (
                  <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>}>
                    <RecommendedCandidates
                      recruiterId={user?.id || ''}
                      jobId={job.id}
                      compact
                      onMessageClick={handleRecommendedMessage}
                    />
                  </Suspense>
                ) : !hasAccess && requiresSubscription ? (
                  <Box sx={{ p: 3, border: '1px solid rgba(186, 230, 253, 1)', borderRadius: 2, background: '#EFF6FF' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      Premium Remote Job
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Remote Jobs are available only for Premium Members. Upgrade to access full job details and apply.
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Job Description
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: 'text.secondary' }}>
                        {job.description}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        Screening Questions
                      </Typography>
                      {job.screeningQuestions?.length ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {job.screeningQuestions.map((question) => (
                            <Typography key={question} variant="body2" sx={{ color: 'text.secondary' }}>
                              • {question}
                            </Typography>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          No screening questions for this role.
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Posted on {formatDate(job.createdAt || job.created_at || new Date().toISOString())}
                      </Typography>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Card sx={{ position: 'sticky', top: 80 }}>
              <CardContent>
                {!hasAccess && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Remote Jobs are available only for Premium Members.
                    </Typography>
                  </Alert>
                )}

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={handleApplyClick}
                  disabled={!hasAccess || hasApplied}
                  sx={{ mb: 2 }}
                >
                  {hasApplied ? 'Already Applied' : 'Apply Now'}
                </Button>

                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<ShareIcon />}
                  onClick={() => {
                    if (!hasAccess) {
                      toast.error('Upgrade to premium to share remote jobs');
                      return;
                    }
                    navigator.share({
                      title: job.title,
                      text: `Check out this job: ${job.title} at ${job.company_name}`,
                      url: window.location.href,
                    });
                  }}
                  disabled={!hasAccess}
                >
                  Share Job
                </Button>

                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Job Details
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Experience:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {job.experience}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Applications:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {job.applicationsCount || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recommended Candidate Message Dialog */}
        <Dialog open={chatDialogOpen} onClose={() => setChatDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Message {selectedChatUser?.name}</DialogTitle>
          <DialogContent dividers>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Write a message to this candidate..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              disabled={sendingMessage}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setChatDialogOpen(false)} disabled={sendingMessage}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSendRecommendedMessage}
              disabled={!chatMessage.trim() || sendingMessage}
              endIcon={sendingMessage ? <CircularProgress size={18} /> : undefined}
            >
              {sendingMessage ? 'Sending...' : 'Send Message'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Apply Dialog */}
        <Dialog open={applyDialogOpen} onClose={() => setApplyDialogOpen(false)} maxWidth="sm" fullWidth>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Apply for {job.title}
            </Typography>

            <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Resume Upload / Update
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Upload your latest resume or use the resume already saved to your profile.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <Button variant="outlined" component="label">
                  {resumeFile ? 'Update Resume' : 'Upload Resume'}
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => e.target.files?.[0] && setResumeFile(e.target.files[0])}
                  />
                </Button>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {resumeFile ? resumeFile.name : resumeUrl ? 'Using saved resume' : 'No resume uploaded yet'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 3, display: 'grid', gap: 2 }}>
              <TextField
                fullWidth
                label="Current CTC"
                value={currentCtc}
                onChange={(e) => setCurrentCtc(e.target.value)}
              />
              <TextField
                fullWidth
                label="Expected CTC"
                value={expectedCtc}
                onChange={(e) => setExpectedCtc(e.target.value)}
              />
              <TextField
                fullWidth
                label="Notice Period"
                value={noticePeriod}
                onChange={(e) => setNoticePeriod(e.target.value)}
              />
            </Box>

            {job.screeningQuestions?.length ? (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Screening Questions
                </Typography>
                <Box sx={{ display: 'grid', gap: 2 }}>
                  {job.screeningQuestions.map((question) => (
                    <TextField
                      key={question}
                      fullWidth
                      label={question}
                      multiline
                      rows={2}
                      value={screeningAnswers[question] || ''}
                      onChange={(e) => setScreeningAnswers((prev) => ({ ...prev, [question]: e.target.value }))}
                    />
                  ))}
                </Box>
              </Box>
            ) : null}

            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Write a cover letter (optional)"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" fullWidth onClick={() => setApplyDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="contained" fullWidth onClick={handleApply} disabled={applyLoading || hasApplied}>
                {hasApplied ? 'Already Applied' : applyLoading ? 'Applying...' : 'Submit Application'}
              </Button>
            </Box>
          </Box>
        </Dialog>
      </Container>
    </Layout>
  );
};
