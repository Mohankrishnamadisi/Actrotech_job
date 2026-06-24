import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Avatar,
  Chip,
} from '@mui/material';
import { Message as MessageIcon } from '@mui/icons-material';
import type { TalentPoolCandidate } from '@types';
import { normalizeSkills } from '@utils/matchScore';
import { ResumeUnlockContact } from '../ResumeUnlockContact';

interface TalentPoolProfileDialogProps {
  open: boolean;
  onClose: () => void;
  entry: TalentPoolCandidate | null;
  recruiterId?: string;
  matchScore?: number;
  onMessage?: (candidateId: string, candidateName: string) => void;
}

export const TalentPoolProfileDialog: React.FC<TalentPoolProfileDialogProps> = ({
  open,
  onClose,
  entry,
  recruiterId,
  matchScore,
  onMessage,
}) => {
  const profile = entry?.profiles;
  const skills = normalizeSkills(profile?.skills);
  const name = profile?.name || 'Candidate';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Candidate Profile</DialogTitle>
      <DialogContent dividers>
        {profile && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar
                src={profile.avatar_url || undefined}
                sx={{ width: 80, height: 80, mx: 'auto', mb: 1, bgcolor: '#0A66C2' }}
              >
                {name.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {name}
              </Typography>
              {profile.headline && (
                <Typography variant="body2" color="text.secondary">
                  {profile.headline}
                </Typography>
              )}
              {matchScore !== undefined && matchScore > 0 && (
                <Chip
                  label={`${matchScore}% Match`}
                  size="small"
                  sx={{ mt: 1, bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 700 }}
                />
              )}
            </Box>

            {recruiterId && (
              <ResumeUnlockContact
                recruiterId={recruiterId}
                candidateId={profile.id}
              />
            )}

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                Location
              </Typography>
              <Typography variant="body2">{profile.location || 'Not specified'}</Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                Experience
              </Typography>
              <Typography variant="body2">
                {profile.experience_years != null
                  ? `${profile.experience_years} years`
                  : profile.experience || 'Not specified'}
              </Typography>
            </Box>

            {skills.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>
                  Skills
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                  {skills.map((skill) => (
                    <Chip key={skill} label={skill} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}

            {entry?.notes && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'rgba(10, 102, 194, 0.06)',
                  border: '1px solid rgba(10, 102, 194, 0.12)',
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  Pool Notes
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                  {entry.notes}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {profile && onMessage && (
          <Button
            variant="contained"
            startIcon={<MessageIcon />}
            onClick={() => {
              onMessage(profile.id, name);
              onClose();
            }}
            sx={{ bgcolor: '#0A66C2', '&:hover': { bgcolor: '#004182' } }}
          >
            Message
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
