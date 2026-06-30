import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  recruiterSettingsService,
  type RecruiterBlockedCandidate,
  type RecruiterSettings,
} from '@services/recruiterSettings';
import { DeleteActionButton } from '@components/common/DeleteActionButton';

interface RecruiterSettingsProps {
  recruiterId: string;
}

const MotionCard = motion(Card);

const defaultQuickBlockForm = {
  candidateId: '',
  candidateName: '',
  email: '',
  reason: '',
};

export const RecruiterSettingsPanel: React.FC<RecruiterSettingsProps> = ({ recruiterId }) => {
  const [settings, setSettings] = useState<RecruiterSettings | null>(null);
  const [quickBlockForm, setQuickBlockForm] = useState(defaultQuickBlockForm);

  useEffect(() => {
    setSettings(recruiterSettingsService.loadSettings(recruiterId));
  }, [recruiterId]);

  const blockedCandidates = settings?.blockedCandidates || [];

  const sortedBlockedCandidates = useMemo(
    () =>
      [...blockedCandidates].sort(
        (a, b) => new Date(b.blockedAt).getTime() - new Date(a.blockedAt).getTime()
      ),
    [blockedCandidates]
  );

  const updateSettings = (next: RecruiterSettings) => {
    setSettings(next);
  };

  const handleToggle = (key: 'newApplicantAlerts' | 'unreadMessageAlerts' | 'weeklyDigest') => {
    const current = settings?.notifications[key] ?? false;
    const next = recruiterSettingsService.updateNotificationSettings(recruiterId, { [key]: !current });
    updateSettings(next);
    toast.success('Settings updated');
  };

  const handleQuickBlock = () => {
    const candidateId = quickBlockForm.candidateId.trim();
    const candidateEmail = quickBlockForm.email.trim().toLowerCase();
    const candidateName = quickBlockForm.candidateName.trim();
    if (!candidateId && !candidateEmail) {
      toast.error('Enter candidate ID or email');
      return;
    }

    const next = recruiterSettingsService.upsertBlockedCandidate(recruiterId, {
      candidateId: candidateId || undefined,
      name: candidateName || 'Candidate',
      email: candidateEmail || null,
      reason: quickBlockForm.reason.trim() || undefined,
    });

    updateSettings(next);
    setQuickBlockForm(defaultQuickBlockForm);
    toast.success('Candidate blocked successfully');
  };

  const handleUnblock = (candidateId: string) => {
    const next = recruiterSettingsService.removeBlockedCandidate(recruiterId, candidateId);
    updateSettings(next);
    toast.success('Candidate unblocked');
  };

  if (!settings) return null;

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <MotionCard
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        sx={{ borderRadius: 2.5, border: '1px solid rgba(148,163,184,0.24)', boxShadow: '0 14px 32px rgba(15,23,42,0.06)' }}
      >
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
            Recruiter Settings
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Configure recruiter alerts and candidate blocking controls.
          </Typography>

          <Stack spacing={0.5}>
            <FormControlLabel
              control={<Switch checked={settings.notifications.newApplicantAlerts} onChange={() => handleToggle('newApplicantAlerts')} />}
              label="New applicant alerts"
            />
            <FormControlLabel
              control={<Switch checked={settings.notifications.unreadMessageAlerts} onChange={() => handleToggle('unreadMessageAlerts')} />}
              label="Unread message alerts"
            />
            <FormControlLabel
              control={<Switch checked={settings.notifications.weeklyDigest} onChange={() => handleToggle('weeklyDigest')} />}
              label="Weekly hiring digest"
            />
          </Stack>
        </CardContent>
      </MotionCard>

      <MotionCard
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.04 }}
        sx={{ borderRadius: 2.5, border: '1px solid rgba(148,163,184,0.24)', boxShadow: '0 14px 32px rgba(15,23,42,0.06)' }}
      >
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
            Block Candidate
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Block with candidate email (or ID if available) to hide from search, applicants, and recommendations.
          </Typography>
          <Box sx={{ display: 'grid', gap: 1.25, gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr 1fr' } }}>
            <TextField
              label="Candidate ID (optional)"
              value={quickBlockForm.candidateId}
              onChange={(event) => setQuickBlockForm((prev) => ({ ...prev, candidateId: event.target.value }))}
              size="small"
            />
            <TextField
              label="Candidate Name"
              value={quickBlockForm.candidateName}
              onChange={(event) => setQuickBlockForm((prev) => ({ ...prev, candidateName: event.target.value }))}
              size="small"
            />
            <TextField
              label="Email (optional)"
              value={quickBlockForm.email}
              onChange={(event) => setQuickBlockForm((prev) => ({ ...prev, email: event.target.value }))}
              size="small"
            />
          </Box>
          <TextField
            label="Reason (optional)"
            value={quickBlockForm.reason}
            onChange={(event) => setQuickBlockForm((prev) => ({ ...prev, reason: event.target.value }))}
            size="small"
            fullWidth
            sx={{ mt: 1.25 }}
          />
          <Button variant="contained" sx={{ mt: 1.5 }} onClick={handleQuickBlock}>
            Block Candidate
          </Button>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Blocked Candidates ({blockedCandidates.length})
          </Typography>

          {sortedBlockedCandidates.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No blocked candidates yet.
            </Typography>
          ) : (
            <List disablePadding sx={{ display: 'grid', gap: 1 }}>
              {sortedBlockedCandidates.map((candidate: RecruiterBlockedCandidate) => (
                <ListItem
                  key={candidate.candidateId}
                  secondaryAction={
                    <Tooltip title="Unblock candidate">
                      <DeleteActionButton onClick={() => handleUnblock(candidate.candidateId)} ariaLabel="Unblock candidate" />
                    </Tooltip>
                  }
                  sx={{
                    border: '1px solid rgba(148,163,184,0.2)',
                    borderRadius: 1.5,
                    pr: 6,
                  }}
                >
                  <ListItemText
                    primary={candidate.name || 'Candidate'}
                    secondary={
                      <Stack direction="row" spacing={1} sx={{ mt: 0.4 }}>
                        {candidate.candidateId.startsWith('email:') ? (
                          <Chip size="small" label="Email rule" color="info" variant="outlined" />
                        ) : (
                          <Chip size="small" label={`ID: ${candidate.candidateId}`} />
                        )}
                        {candidate.email ? <Chip size="small" variant="outlined" label={candidate.email} /> : null}
                        {candidate.reason ? <Chip size="small" variant="outlined" color="warning" label={candidate.reason} /> : null}
                      </Stack>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </MotionCard>
    </Box>
  );
};
