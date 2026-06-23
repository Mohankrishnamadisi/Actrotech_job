import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import type { CandidateTag } from '@types';
import { getContrastTextColor } from '@utils/tagColors';

interface TagFilterBarProps {
  tags: CandidateTag[];
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

export const TagFilterBar: React.FC<TagFilterBarProps> = ({ tags, selectedTagIds, onChange }) => {
  if (tags.length === 0) return null;

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  const clearAll = () => onChange([]);

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Filter by tags
        </Typography>
        {selectedTagIds.length > 0 && (
          <Chip
            label="Clear filters"
            size="small"
            variant="outlined"
            onClick={clearAll}
            sx={{ cursor: 'pointer' }}
          />
        )}
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {tags.map((tag) => {
          const selected = selectedTagIds.includes(tag.id);
          return (
            <Chip
              key={tag.id}
              label={tag.name}
              size="small"
              onClick={() => toggleTag(tag.id)}
              variant={selected ? 'filled' : 'outlined'}
              sx={{
                cursor: 'pointer',
                fontWeight: 600,
                ...(selected
                  ? {
                      bgcolor: tag.color,
                      color: getContrastTextColor(tag.color),
                      borderColor: tag.color,
                      '&:hover': { bgcolor: tag.color, opacity: 0.9 },
                    }
                  : {
                      borderColor: tag.color,
                      color: tag.color,
                      '&:hover': { bgcolor: `${tag.color}14` },
                    }),
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
};
