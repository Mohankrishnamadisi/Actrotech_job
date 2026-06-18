import React, { useState, useEffect } from 'react';
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
  TextField,
  Alert,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { LocationOn as LocationOnIcon, Work as WorkIcon, MonetizationOn as MonetizationOnIcon, BookmarkBorder as BookmarkBorderIcon, Bookmark as BookmarkIcon, Share as ShareIcon } from '@mui/icons-material';
import { Layout } from '@components/layout/Layout';
import { Loading } from '@components/common/Loading';
import { jobService, applicationService } from '@services/api';
import { useAuthStore } from '@store/index';
import { useSubscription } from '@hooks/index';
import { formatDate, formatJobSalary } from '@utils/index';
import { ROUTES } from '@constants/index';
import toast from 'react-hot-toast';
import type { Job } from '@types/index';

export const JobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { subscription } = useSubscription(user?.id || null);

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');

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

  if (loading) return <Loading />;
  if (!job || error)
    return (
      <Layout>
        <Container>
          <Typography color="error">{error || 'Job not found'}</Typography>
        </Container>
      </Layout>
    );

  const requiresSubscription = ['Remote', 'Hybrid'].includes(job.jobType);
  const hasAccess = !requiresSubscription || subscription;

  const handleApply = async () => {
    if (!user) {
      toast.error('Please login to apply');
      navigate(ROUTES.LOGIN);
      return;
    }

    if (requiresSubscription && !subscription) {
      toast.error('This job requires a premium subscription');
      navigate(ROUTES.PRICING);
      return;
    }

    setApplyLoading(true);
    try {
      // TODO: Upload resume and apply
      toast.success('Application submitted successfully!');
      setApplyDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to apply');
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
                    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
                      {job.company}
                    </Typography>
                  </Box>
                  <Button variant="text" startIcon={isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}>
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
                    <Typography variant="body2">{job.jobType}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MonetizationOnIcon sx={{ color: 'success.main' }} />
                    <Typography variant="body2" sx={{ color: 'success.main' }}>
                      {formatJobSalary(job.salaryMin, job.salaryMax)}
                    </Typography>
                  </Box>
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

                {/* Description */}
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Job Description
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: 'text.secondary' }}>
                    {job.description}
                  </Typography>
                </Box>

                <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Posted on {formatDate(job.createdAt)}
                  </Typography>
                </Box>
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
                      This {job.jobType.toLowerCase()} job requires a premium subscription to access.
                    </Typography>
                  </Alert>
                )}

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={() => setApplyDialogOpen(true)}
                  disabled={!hasAccess}
                  sx={{ mb: 2 }}
                >
                  Apply Now
                </Button>

                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<ShareIcon />}
                  onClick={() => {
                    navigator.share({
                      title: job.title,
                      text: `Check out this job: ${job.title} at ${job.company}`,
                      url: window.location.href,
                    });
                  }}
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

        {/* Apply Dialog */}
        <Dialog open={applyDialogOpen} onClose={() => setApplyDialogOpen(false)} maxWidth="sm" fullWidth>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Apply for {job.title}
            </Typography>

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
              <Button variant="contained" fullWidth onClick={handleApply} disabled={applyLoading}>
                {applyLoading ? 'Applying...' : 'Submit Application'}
              </Button>
            </Box>
          </Box>
        </Dialog>
      </Container>
    </Layout>
  );
};
