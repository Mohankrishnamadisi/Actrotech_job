import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Message as MessageIcon,
  Delete as DeleteIcon,
  DriveFileMove as MoveIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import type { TalentPoolCandidate } from '@types';
import { normalizeSkills } from '@utils/matchScore';

interface PoolCandidateCardProps {
  entry: TalentPoolCandidate;
  matchScore?: number;
  index?: number;
  onView: (entry: TalentPoolCandidate) => void;
  onMessage?: (candidateId: string, candidateName: string) => void;
  onRemove: (entry: TalentPoolCandidate) => void;
  onMove: (entry: TalentPoolCandidate) => void;
  disabled?: boolean;
}

const MotionCard = motion(Card);

function matchColor(score: number): string {
  if (score >= 80) return '#057642';
  if (score >= 60) return '#0A66C2';
  if (score >= 40) return '#915907';
  return '#666';
}

export const PoolCandidateCard: React.FC<PoolCandidateCardProps> = ({
  entry,
  matchScore = 0,
  index = 0,
  onView,
  onMessage,
  onRemove,
  onMove,
  disabled = false,
}) => {
  const profile = entry.profiles;
  const name = profile?.name || 'Candidate';
  const skills = normalizeSkills(profile?.skills);
  const experience =
    profile?.experience_years != null
      ? `${profile.experience_years} yrs`
      : profile?.experience || null;

  return (
    <MotionCard
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      sx={{
        height: '100%',
        borderRadius: 3,
        border: '1px solid rgba(148, 163, 184, 0.22)',
        background: 'linear-gradient(145deg, rgba(255,255,255,0.92), rgba(248,250,252,0.88))',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.1)',
        },
      }}
    >
      <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
          <Avatar
            src={profile?.avatar_url || undefined}
            sx={{ width: 52, height: 52, bgcolor: '#0A66C2', fontWeight: 700 }}
          >
            {name.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }} noWrap>
              {name}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {profile?.headline || 'Job Seeker'}
            </Typography>
          </Box>
          {matchScore > 0 && (
            <Chip
              label={`${matchScore}%`}
              size="small"
              sx={{
                height: 24,
                fontWeight: 800,
                bgcolor: `${matchColor(matchScore)}14`,
                color: matchColor(matchScore),
                border: `1px solid ${matchColor(matchScore)}33`,
              }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2, flex: 1 }}>
          {profile?.location && (
            <Typography variant="body2" color="text.secondary">
              📍 {profile.location}
            </Typography>
          )}
          {experience && (
            <Typography variant="body2" color="text.secondary">
              💼 {experience} experience
            </Typography>
          )}
          {skills.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
              {skills.slice(0, 4).map((skill) => (
                <Chip
                  key={skill}
                  label={skill}
                  size="small"
                  variant="outlined"
                  sx={{ height: 22, fontSize: 11 }}
                />
              ))}
              {skills.length > 4 && (
                <Chip label={`+${skills.length - 4}`} size="small" sx={{ height: 22, fontSize: 11 }} />
              )}
            </Box>
          )}
        </Box>

        {matchScore > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Match Score
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: matchColor(matchScore) }}>
                {matchScore}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={matchScore}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'rgba(148,163,184,0.2)',
                '& .MuiLinearProgress-bar': { bgcolor: matchColor(matchScore), borderRadius: 3 },
              }}
            />
          </Box>
        )}

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pt: 1.5,
            borderTop: '1px solid rgba(148, 163, 184, 0.16)',
          }}
        >
          <Tooltip title="View profile">
            <IconButton size="small" onClick={() => onView(entry)} disabled={disabled}>
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Message">
              <IconButton
                size="small"
                onClick={() => onMessage?.(entry.candidate_id, name)}
                disabled={disabled}
                sx={{ color: '#0A66C2' }}
              >
                <MessageIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Move to pool">
              <IconButton size="small" onClick={() => onMove(entry)} disabled={disabled}>
                <MoveIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Remove">
              <IconButton
                size="small"
                color="error"
                onClick={() => onRemove(entry)}
                disabled={disabled}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>
    </MotionCard>
  );
};
