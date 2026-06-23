import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Avatar,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { applicationService } from '@services/api';

interface ApplicantDetailsModalProps {
  open: boolean;
  onClose: () => void;
  applicantId?: string;
  jobId?: string;
  onStatusChange?: () => void;
}

const MotionCard = motion(Card);

export const ApplicantDetailsModal: React.FC<ApplicantDetailsModalProps> = ({
  open,
  onClose,
  applicantId,
  jobId,
  onStatusChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [applicant, setApplicant] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [status, setStatus] = useState('applied');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && applicantId) {
      fetchApplicantDetails();
    }
  }, [open, applicantId]);

  const fetchApplicantDetails = async () => {
    setLoading(true);
    try {
      const application = await applicationService.getApplicationDetails(applicantId!, jobId);
      setApplicant(application);
      setProfile(application.profiles || null);
      setStatus(application.status || 'applied');
    } catch (err) {
      console.error('Error fetching applicant details:', err);
      toast.error('Failed to load applicant details');
    } finally {
      setLoading(false);
    }
  };

  const profileAvatarUrl =
    profile?.avatar_url || profile?.avatarUrl || profile?.image || profile?.photo || profile?.picture || '';

  const appliedDate = applicant?.applied_at
    ? new Date(applicant.applied_at)
    : applicant?.created_at
    ? new Date(applicant.created_at)
    : applicant?.updated_at
    ? new Date(applicant.updated_at)
    : null;

  const formatAppliedDate = appliedDate ? appliedDate.toLocaleString() : 'Unknown';

  const resumeUrl = profile?.resume_url || applicant?.resume_url || '';

  const handleStatusChange = async () => {
    if (!applicant?.id) return;
    setSaving(true);
    try {
      const updatedApplication = await applicationService.updateApplicationStatus(applicant.id, status, jobId);
      setApplicant(updatedApplication);
      if (updatedApplication.profiles) {
        setProfile(updatedApplication.profiles);
      }
      toast.success(`Status updated to ${status}`);
      onStatusChange?.();
      onClose();
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const downloadResume = () => {
    if (resumeUrl) {
      window.open(resumeUrl, '_blank');
    } else {
      toast.error('Resume not available');
    }
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 28px 70px rgba(15, 23, 42, 0.15)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
          background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(245,158,11,0.1))',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <Typography component="div" variant="h6" sx={{ fontWeight: 700 }}>
          Applicant Details
        </Typography>
        <CloseIcon sx={{ cursor: 'pointer' }} onClick={onClose} />
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : applicant ? (
          <Grid container spacing={3}>
            {/* Candidate Header */}
            <Grid item xs={12}>
              <MotionCard initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <Avatar
                      src={profileAvatarUrl || undefined}
                      sx={{
                        width: 80,
                        height: 80,
                        background: profileAvatarUrl ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        fontSize: 32,
                        fontWeight: 700,
                      }}
                    >
                      {!profileAvatarUrl && profile?.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                        {profile?.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                        {profile?.title && (
                          <Chip
                            label={profile.title}
                            size="small"
                            sx={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}
                          />
                        )}
                        <Chip
                          label={`Applied: ${formatAppliedDate}`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', color: 'text.secondary', fontSize: 14 }}>
                        {profile?.email && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmailIcon sx={{ fontSize: 18 }} />
                            {profile.email}
                          </Box>
                        )}
                        {profile?.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PhoneIcon sx={{ fontSize: 18 }} />
                            {profile.phone}
                          </Box>
                        )}
                        {profile?.location && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationIcon sx={{ fontSize: 18 }} />
                            {profile.location}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </MotionCard>
            </Grid>

            {/* Professional Info */}
            <Grid item xs={12} sm={6}>
              <MotionCard initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Professional Info
                  </Typography>
                  <Box sx={{ space: 2 }}>
                    {profile?.skills && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
                          Skills
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {(Array.isArray(profile.skills) ? profile.skills : profile.skills.split(',')).map(
                            (skill: string, idx: number) => (
                              <Chip key={idx} label={skill.trim()} size="small" variant="outlined" />
                            )
                          )}
                        </Box>
                      </Box>
                    )}
                    {profile?.experience && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          Experience
                        </Typography>
                        <Typography variant="body2">{profile.experience}</Typography>
                      </Box>
                    )}
                    {profile?.education && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SchoolIcon sx={{ fontSize: 18 }} />
                        <Typography variant="body2">{profile.education}</Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </MotionCard>
            </Grid>

            {/* Application Info */}
            <Grid item xs={12} sm={6}>
              <MotionCard initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Application Info
                  </Typography>
                  <Box sx={{ space: 2 }}>
                    {applicant?.cover_letter && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
                          Cover Letter
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            p: 1.5,
                            background: 'rgba(99,102,241,0.05)',
                            borderRadius: 1,
                            borderLeft: '3px solid #6366f1',
                            lineHeight: 1.6,
                          }}
                        >
                          {applicant.cover_letter}
                        </Typography>
                      </Box>
                    )}
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
                        Applied On
                      </Typography>
                      <Typography variant="body2">
                        {formatAppliedDate}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </MotionCard>
            </Grid>

            {/* Resume */}
            {profile?.resume_url && (
              <Grid item xs={12}>
                <MotionCard initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                          Resume
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Click the download button to view the full resume
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        endIcon={<DownloadIcon />}
                        onClick={downloadResume}
                        sx={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          textTransform: 'none',
                          fontWeight: 600,
                        }}
                      >
                        View Resume
                      </Button>
                    </Box>
                  </CardContent>
                </MotionCard>
              </Grid>
            )}

            <Divider sx={{ my: 1 }} />

            {/* Status Update */}
            <Grid item xs={12}>
              <MotionCard initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Update Application Status
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      label="Status"
                      disabled={saving}
                    >
                      <MenuItem value="applied">Applied</MenuItem>
                      <MenuItem value="under_review">Under Review</MenuItem>
                      <MenuItem value="shortlisted">Shortlisted</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                    </Select>
                  </FormControl>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Current status: <strong>{status}</strong>. Change and save to update the candidate&apos;s application status.
                  </Alert>
                </CardContent>
              </MotionCard>
            </Grid>
          </Grid>
        ) : (
          <Alert severity="error">Failed to load applicant details</Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1, background: 'rgba(0,0,0,0.02)' }}>
        <Button onClick={onClose} disabled={saving}>
          Close
        </Button>
        <Button
          variant="contained"
          onClick={handleStatusChange}
          disabled={saving || !applicant}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            textTransform: 'none',
            fontWeight: 600,
          }}
          endIcon={saving ? <CircularProgress size={20} /> : undefined}
        >
          {saving ? 'Saving...' : 'Save Status'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
