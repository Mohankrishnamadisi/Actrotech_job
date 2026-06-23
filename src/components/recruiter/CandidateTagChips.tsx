import React from 'react';
import { Chip, Box } from '@mui/material';
import type { CandidateTag, CandidateTagAssignment } from '@types';
import { getContrastTextColor } from '@utils/tagColors';

interface CandidateTagChipProps {
  tag: Pick<CandidateTag, 'name' | 'color'>;
  size?: 'small' | 'medium';
  onDelete?: () => void;
  onClick?: () => void;
}

export const CandidateTagChip: React.FC<CandidateTagChipProps> = ({
  tag,
  size = 'small',
  onDelete,
  onClick,
}) => (
  <Chip
    label={tag.name}
    size={size}
    onDelete={onDelete}
    onClick={onClick}
    sx={{
      bgcolor: tag.color,
      color: getContrastTextColor(tag.color),
      fontWeight: 600,
      '& .MuiChip-deleteIcon': {
        color: getContrastTextColor(tag.color),
        opacity: 0.8,
        '&:hover': { opacity: 1 },
      },
    }}
  />
);

interface CandidateTagChipsProps {
  assignments: CandidateTagAssignment[];
  maxVisible?: number;
  onRemove?: (assignmentId: string) => void;
}

export const CandidateTagChips: React.FC<CandidateTagChipsProps> = ({
  assignments,
  maxVisible = 4,
  onRemove,
}) => {
  if (!assignments.length) {
    return (
      <Box component="span" sx={{ color: 'text.disabled', fontSize: 13 }}>
        —
      </Box>
    );
  }

  const visible = assignments.slice(0, maxVisible);
  const overflow = assignments.length - visible.length;

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {visible.map((assignment) => {
        const tag = assignment.candidate_tags;
        if (!tag) return null;
        return (
          <CandidateTagChip
            key={assignment.id}
            tag={tag}
            onDelete={onRemove ? () => onRemove(assignment.id) : undefined}
          />
        );
      })}
      {overflow > 0 && (
        <Chip label={`+${overflow}`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
      )}
    </Box>
  );
};
