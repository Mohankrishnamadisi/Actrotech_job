import React, { useState } from 'react';
import { Box, Button, Chip, Stack, TextField, MenuItem, Select, InputAdornment, Paper } from '@mui/material';
import { Search, X, Filter } from 'lucide-react';

export type DifficultyFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';
export type DurationFilter = 'all' | 'short' | 'medium' | 'long';
export type SortFilter = 'relevance' | 'newest' | 'popular';

interface LearningSearchToolbarProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: {
    difficulty: DifficultyFilter;
    duration: DurationFilter;
    sort: SortFilter;
  }) => void;
  isLoading?: boolean;
}

export const LearningSearchToolbar: React.FC<LearningSearchToolbarProps> = ({
  onSearch,
  onFilterChange,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all');
  const [duration, setDuration] = useState<DurationFilter>('all');
  const [sort, setSort] = useState<SortFilter>('relevance');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleFilterChange = (
    newDifficulty: DifficultyFilter,
    newDuration: DurationFilter,
    newSort: SortFilter
  ) => {
    setDifficulty(newDifficulty);
    setDuration(newDuration);
    setSort(newSort);
    onFilterChange({
      difficulty: newDifficulty,
      duration: newDuration,
      sort: newSort,
    });
  };

  const activeFiltersCount = [difficulty !== 'all', duration !== 'all', sort !== 'relevance'].filter(Boolean).length;

  return (
    <Box sx={{ mb: 3 }}>
      {/* Search Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          mb: 2,
          borderRadius: 2,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            fullWidth
            placeholder="Search videos"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} style={{ color: 'var(--palette-action-active)' }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <Button
                    size="small"
                    onClick={handleClearSearch}
                    disabled={isLoading}
                    sx={{ minWidth: 'auto', p: 0.5 }}
                  >
                    <X size={18} />
                  </Button>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '0.9rem',
              },
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={!searchQuery.trim() || isLoading}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Search
          </Button>
          <Button
            variant="outlined"
            onClick={() => setShowFilters(!showFilters)}
            startIcon={<Filter size={18} />}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {activeFiltersCount > 0 ? `Filters (${activeFiltersCount})` : 'Filters'}
          </Button>
        </Stack>
      </Paper>

      {/* Filters Section */}
      {showFilters && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 2,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
          }}
        >
          <Stack spacing={2}>
            {/* Difficulty Filter */}
            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2}>
              <Box sx={{ minWidth: 120, fontWeight: 600, fontSize: '0.9rem' }}>Difficulty:</Box>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {(['all', 'beginner', 'intermediate', 'advanced'] as DifficultyFilter[]).map((level) => (
                  <Chip
                    key={level}
                    label={level.charAt(0).toUpperCase() + level.slice(1)}
                    onClick={() => handleFilterChange(level, duration, sort)}
                    variant={difficulty === level ? 'filled' : 'outlined'}
                    color={difficulty === level ? 'primary' : 'default'}
                  />
                ))}
              </Stack>
            </Stack>

            {/* Duration Filter */}
            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2}>
              <Box sx={{ minWidth: 120, fontWeight: 600, fontSize: '0.9rem' }}>Duration:</Box>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {(['all', 'short', 'medium', 'long'] as DurationFilter[]).map((dur) => (
                  <Chip
                    key={dur}
                    label={
                      dur === 'all'
                        ? 'All'
                        : dur === 'short'
                          ? 'Under 10 min'
                          : dur === 'medium'
                            ? '10–30 min'
                            : '30+ min'
                    }
                    onClick={() => handleFilterChange(difficulty, dur, sort)}
                    variant={duration === dur ? 'filled' : 'outlined'}
                    color={duration === dur ? 'primary' : 'default'}
                  />
                ))}
              </Stack>
            </Stack>

            {/* Sort Filter */}
            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2}>
              <Box sx={{ minWidth: 120, fontWeight: 600, fontSize: '0.9rem' }}>Sort by:</Box>
              <Select
                value={sort}
                onChange={(e) => handleFilterChange(difficulty, duration, e.target.value as SortFilter)}
                size="small"
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="relevance">Relevance</MenuItem>
                <MenuItem value="newest">Newest</MenuItem>
                <MenuItem value="popular">Most Popular</MenuItem>
              </Select>
            </Stack>
          </Stack>
        </Paper>
      )}
    </Box>
  );
};
