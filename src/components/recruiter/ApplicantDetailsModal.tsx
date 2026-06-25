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
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Lock as LockIcon,
  LocationOn as LocationIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { applicationService } from '@services/api';
import type { CandidateTag } from '@types';
import { CandidateTagAssigner } from './CandidateTagAssigner';
import { CandidateNotesPanel } from './CandidateNotesPanel';
import { ResumeUnlockContact } from './ResumeUnlockContact';
import { calculateMatchScore, getMatchScoreHex } from '@utils/matchScore';

interface ApplicantDetailsModalProps {
  open: boolean;
  onClose: () => void;
  applicantId?: string;
  candidateId?: string;
  jobId?: string;
  recruiterId?: string;
  availableTags?: CandidateTag[];
  onStatusChange?: () => void;
  onTagsChange?: () => void;
  onUnlocked?: () => void;
}

const MotionCard = motion(Card);

export const ApplicantDetailsModal: React.FC<ApplicantDetailsModalProps> = ({
  open,
  onClose,
  applicantId,
  candidateId,
  jobId,
  recruiterId,
  availableTags = [],
  onStatusChange,
  onTagsChange,
  onUnlocked,
}) => {
  const [loading, setLoading] = useState(false);
  const [applicant, setApplicant] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [status, setStatus] = useState('applied');
  const [saving, setSaving] = useState(false);
  const [contactUnlocked, setContactUnlocked] = useState(false);

  useEffect(() => {
    if (open && applicantId) {
      setContactUnlocked(false);
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
  const matchScore = applicant
    ? calculateMatchScore(
        {
          ...(profile || {}),
          expected_ctc: applicant.expected_ctc || applicant.expectedCtc,
          current_ctc: applicant.current_ctc || applicant.currentCtc,
        },
        applicant.jobs
      )
    : null;

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
                        {profile?.location && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationIcon sx={{ fontSize: 18 }} />
                            {profile.location}
                          </Box>
                        )}
                      </Box>
                      {recruiterId && candidateId && (
                        <Box sx={{ mt: 2, maxWidth: 520 }}>
                          <ResumeUnlockContact
                            recruiterId={recruiterId}
                            candidateId={candidateId}
                            jobId={jobId}
                            onUnlocked={(contact) =>
                              {
                                setContactUnlocked(true);
                                onUnlocked?.();
                                setProfile((current: any) => ({
                                  ...(current || {}),
                                  email: contact.email || current?.email,
                                  phone: contact.phone || current?.phone,
                                }));
                              }
                            }
                          />
                        </Box>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </MotionCard>
            </Grid>

            {/* AI Match Score */}
            {matchScore && (
              <Grid item xs={12}>
                <MotionCard initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          AI Match Score
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Rule-based match against {applicant.jobs?.title || 'this job'}
                        </Typography>
                      </Box>
                      <Chip
                        label={matchScore.label}
                        sx={{
                          height: 34,
                          px: 1,
                          fontWeight: 900,
                          bgcolor: `${getMatchScoreHex(matchScore.score)}14`,
                          color: getMatchScoreHex(matchScore.score),
                          border: `1px solid ${getMatchScoreHex(matchScore.score)}33`,
                        }}
                      />
                    </Box>

                    <Grid container spacing={2}>
                      {Object.values(matchScore.breakdown)
                        .filter((item) => item.weight > 0)
                        .map((item) => (
                          <Grid item xs={12} sm={6} md={4} key={item.label}>
                            <Box
                              sx={{
                                p: 1.5,
                                borderRadius: 1,
                                border: '1px solid rgba(148, 163, 184, 0.24)',
                                bgcolor: 'rgba(248,250,252,0.7)',
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                                  {item.label}
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: 800 }}>
                                  {item.points}/{item.weight}
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={item.percent}
                                sx={{
                                  height: 6,
                                  borderRadius: 3,
                                  bgcolor: 'rgba(148,163,184,0.18)',
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: getMatchScoreHex(item.percent),
                                    borderRadius: 3,
                                  },
                                }}
                              />
                            </Box>
                          </Grid>
                        ))}
                    </Grid>

                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                          Skills Matching Breakdown
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                          {matchScore.matchedSkills.length > 0 ? (
                            matchScore.matchedSkills.map((skill) => (
                              <Chip key={skill} label={skill} size="small" color="success" variant="outlined" />
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No required skills matched yet
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                          Missing Skills
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                          {matchScore.missingSkills.length > 0 ? (
                            matchScore.missingSkills.map((skill) => (
                              <Chip key={skill} label={skill} size="small" color="error" variant="outlined" />
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No missing required skills
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                          Strengths
                        </Typography>
                        <Box component="ul" sx={{ m: 0, pl: 2.2 }}>
                          {matchScore.strengths.length > 0 ? (
                            matchScore.strengths.map((strength) => (
                              <Typography component="li" variant="body2" key={strength} sx={{ mb: 0.5 }}>
                                {strength}
                              </Typography>
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Add more profile details for stronger insights
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </MotionCard>
              </Grid>
            )}

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
                    <Box sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
                          Featured Application
                        </Typography>
                        <Chip label={applicant.priority_application || applicant.priorityApplication ? 'YES' : 'NO'} size="small" color={applicant.priority_application || applicant.priorityApplication ? 'warning' : 'default'} />
                    </Box>
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
            {resumeUrl && (
              <Grid item xs={12}>
                <MotionCard initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                          Resume
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {contactUnlocked ? 'Candidate resume is available for this recruiter account.' : 'Resume Locked'}
                        </Typography>
                      </Box>
                      <Tooltip title={contactUnlocked ? 'View resume' : 'Unlock candidate to download resume.'}>
                        <span>
                          <Button
                            variant="contained"
                            endIcon={contactUnlocked ? <DownloadIcon /> : <LockIcon />}
                            onClick={downloadResume}
                            disabled={!contactUnlocked}
                            sx={{
                              background: contactUnlocked ? '#0A66C2' : undefined,
                              textTransform: 'none',
                              fontWeight: 700,
                            }}
                          >
                            {contactUnlocked ? 'View Resume' : 'Resume Locked'}
                          </Button>
                        </span>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </MotionCard>
              </Grid>
            )}

            <Divider sx={{ my: 1 }} />

            {/* Candidate Tags */}
            {recruiterId && candidateId && (
              <Grid item xs={12}>
                <MotionCard initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <CardContent>
                    <CandidateTagAssigner
                      candidateId={candidateId}
                      recruiterId={recruiterId}
                      availableTags={availableTags}
                      onTagsChange={onTagsChange}
                    />
                  </CardContent>
                </MotionCard>
              </Grid>
            )}

            {/* Recruiter Notes */}
            {recruiterId && candidateId && applicantId && (
              <Grid item xs={12}>
                <MotionCard initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <CardContent>
                    <CandidateNotesPanel
                      applicationId={applicantId}
                      candidateId={candidateId}
                      recruiterId={recruiterId}
                    />
                  </CardContent>
                </MotionCard>
              </Grid>
            )}

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
