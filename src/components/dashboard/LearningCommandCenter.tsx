import React, { useMemo, useRef, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  IconButton,
  InputBase,
  MenuItem,
  Paper,
  Popover,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpNarrowWide,
  BarChart3,
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock4,
  Compass,
  Flame,
  GraduationCap,
  MessagesSquare,
  NotebookPen,
  Play,
  Rocket,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';

export type DifficultyFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';
export type DurationFilter = 'all' | 'short' | 'medium' | 'long';
export type SortFilter = 'relevance' | 'newest' | 'popular';

interface LearningCommandCenterProps {
  userName?: string;
  videosWatched?: number;
  learningStreak?: number;
  notesCreated?: number;
  topics: string[];
  activeTopic: string;
  onTopicChange: (topic: string) => void;
  onSearch: (query: string) => void;
  onFilterChange: (filters: {
    difficulty: DifficultyFilter;
    duration: DurationFilter;
    sort: SortFilter;
  }) => void;
  isLoading?: boolean;
}

const MotionPaper = motion(Paper);
const MotionBox = motion(Box);

const mapDurationLabel = (duration: DurationFilter) => {
  if (duration === 'short') return 'Under 10 min';
  if (duration === 'medium') return '10-30 min';
  if (duration === 'long') return '30+ min';
  return 'All';
};

const PATH_PALETTE = [
  { color: '#4F46E5', soft: 'rgba(79, 70, 229, 0.12)', gradient: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)' },
  { color: '#0EA5E9', soft: 'rgba(14, 165, 233, 0.12)', gradient: 'linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)' },
  { color: '#059669', soft: 'rgba(5, 150, 105, 0.12)', gradient: 'linear-gradient(135deg, #047857 0%, #10B981 100%)' },
  { color: '#D97706', soft: 'rgba(217, 119, 6, 0.12)', gradient: 'linear-gradient(135deg, #B45309 0%, #F59E0B 100%)' },
  { color: '#DB2777', soft: 'rgba(219, 39, 119, 0.12)', gradient: 'linear-gradient(135deg, #BE185D 0%, #EC4899 100%)' },
  { color: '#7C3AED', soft: 'rgba(124, 58, 237, 0.12)', gradient: 'linear-gradient(135deg, #6D28D9 0%, #A855F7 100%)' },
];

/** Splits a raw topic string into a readable title + the kind of path it is. */const describeTopic = (topic: string) => {
  const value = topic.trim();
  const lower = value.toLowerCase();

  if (lower.endsWith('interview questions')) {
    return { title: value.slice(0, -'interview questions'.length).trim(), kind: 'Interview prep', Icon: MessagesSquare };
  }
  if (lower.endsWith('interview preparation')) {
    return { title: value.slice(0, -'interview preparation'.length).trim(), kind: 'Interview prep', Icon: MessagesSquare };
  }
  if (lower.endsWith('tutorial')) {
    return { title: value.slice(0, -'tutorial'.length).trim(), kind: 'Tutorial series', Icon: GraduationCap };
  }
  if (lower.endsWith('career skills')) {
    return { title: value.slice(0, -'career skills'.length).trim(), kind: 'Career skills', Icon: Rocket };
  }
  return { title: value, kind: 'Learning path', Icon: Compass };
};

interface FilterSectionProps<T extends string> {
  label: string;
  icon: React.ReactNode;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}

const FilterSection = <T extends string>({ label, icon, value, options, onChange }: FilterSectionProps<T>) => (
  <Box>
    <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 0.9 }}>
      <Box sx={{ display: 'flex', color: '#64748B' }}>{icon}</Box>
      <Typography
        sx={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: 0.7, textTransform: 'uppercase', color: '#475569' }}
      >
        {label}
      </Typography>
    </Stack>

    <ToggleButtonGroup
      exclusive
      size="small"
      value={value}
      onChange={(_, next) => {
        if (next) onChange(next as T);
      }}
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0.7,
        '& .MuiToggleButtonGroup-grouped': {
          flex: '1 1 auto',
          m: 0,
          px: 1.4,
          py: 0.55,
          border: '1px solid rgba(148, 163, 184, 0.38) !important',
          borderRadius: '999px !important',
          textTransform: 'none',
          fontWeight: 700,
          fontSize: '0.78rem',
          color: '#475569',
          transition: 'all 0.18s ease',
          '&:hover': { borderColor: 'rgba(37, 99, 235, 0.6) !important', bgcolor: 'rgba(37, 99, 235, 0.06)' },
          '&.Mui-selected': {
            color: '#fff',
            borderColor: 'transparent !important',
            background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
            boxShadow: '0 6px 14px rgba(37, 99, 235, 0.3)',
            '&:hover': { background: 'linear-gradient(135deg, #1D4ED8 0%, #4338CA 100%)' },
          },
        },
      }}
    >
      {options.map((option) => (
        <ToggleButton key={option.value} value={option.value} disableRipple>
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  </Box>
);

export const LearningCommandCenter: React.FC<LearningCommandCenterProps> = ({
  userName = 'there',
  videosWatched = 0,
  learningStreak = 0,
  notesCreated = 0,
  topics,
  activeTopic,
  onTopicChange,
  onSearch,
  onFilterChange,
  isLoading = false,
}) => {
  const firstName = userName && userName !== 'there' ? userName.split(' ')[0] : 'there';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all');
  const [duration, setDuration] = useState<DurationFilter>('all');
  const [sort, setSort] = useState<SortFilter>('relevance');
  const [topicFilter, setTopicFilter] = useState('all');
  const pathScrollRef = useRef<HTMLDivElement | null>(null);

  const scrollPaths = (direction: -1 | 1) => {
    pathScrollRef.current?.scrollBy({ left: direction * 320, behavior: 'smooth' });
  };

  const filterOpen = Boolean(filterAnchorEl);
  const activeFiltersCount =
    (topicFilter !== 'all' ? 1 : 0) +
    (difficulty !== 'all' ? 1 : 0) +
    (duration !== 'all' ? 1 : 0) +
    (sort !== 'relevance' ? 1 : 0);

  const topicOptions = useMemo(() => {
    const base = ['React', 'HTML', 'JavaScript', 'Redux', 'TypeScript'];
    const merged = [...base, ...topics.map((topic) => topic.trim()).filter(Boolean)];
    return Array.from(new Set(merged)).slice(0, 12);
  }, [topics]);

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onDelete: () => void }> = [];

    if (topicFilter !== 'all') {
      chips.push({
        key: 'topic',
        label: topicFilter,
        onDelete: () => {
          setTopicFilter('all');
        },
      });
    }

    if (difficulty !== 'all') {
      chips.push({
        key: 'difficulty',
        label: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
        onDelete: () => {
          const nextDifficulty: DifficultyFilter = 'all';
          setDifficulty(nextDifficulty);
          onFilterChange({ difficulty: nextDifficulty, duration, sort });
        },
      });
    }

    if (duration !== 'all') {
      chips.push({
        key: 'duration',
        label: mapDurationLabel(duration),
        onDelete: () => {
          const nextDuration: DurationFilter = 'all';
          setDuration(nextDuration);
          onFilterChange({ difficulty, duration: nextDuration, sort });
        },
      });
    }

    if (sort !== 'relevance') {
      chips.push({
        key: 'sort',
        label: sort === 'newest' ? 'Newest' : 'Most Popular',
        onDelete: () => {
          const nextSort: SortFilter = 'relevance';
          setSort(nextSort);
          onFilterChange({ difficulty, duration, sort: nextSort });
        },
      });
    }

    return chips;
  }, [difficulty, duration, sort, topicFilter, onFilterChange]);

  const handleSearch = () => {
    const query = searchQuery.trim();
    if (query) onSearch(query);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleOpenFilters = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleCloseFilters = () => {
    setFilterAnchorEl(null);
  };

  const handleResetFilters = () => {
    const nextDifficulty: DifficultyFilter = 'all';
    const nextDuration: DurationFilter = 'all';
    const nextSort: SortFilter = 'relevance';
    setDifficulty(nextDifficulty);
    setDuration(nextDuration);
    setSort(nextSort);
    setTopicFilter('all');
    onFilterChange({ difficulty: nextDifficulty, duration: nextDuration, sort: nextSort });
  };

  const handleApplyFilters = () => {
    onFilterChange({ difficulty, duration, sort });
    handleCloseFilters();
  };

  const stats = [
    {
      key: 'watched',
      label: 'Watched',
      value: videosWatched,
      Icon: Play,
      iconColor: '#1d4ed8',
      tint: 'linear-gradient(135deg, rgba(219, 234, 254, 0.95) 0%, rgba(239, 246, 255, 1) 100%)',
      border: 'rgba(147, 197, 253, 0.7)',
    },
    {
      key: 'streak',
      label: 'Streak',
      value: learningStreak,
      Icon: Flame,
      iconColor: '#ea580c',
      tint: 'linear-gradient(135deg, rgba(255, 237, 213, 0.95) 0%, rgba(255, 247, 237, 1) 100%)',
      border: 'rgba(253, 186, 116, 0.8)',
    },
    {
      key: 'notes',
      label: 'Notes',
      value: notesCreated,
      Icon: NotebookPen,
      iconColor: '#7e22ce',
      tint: 'linear-gradient(135deg, rgba(243, 232, 255, 0.95) 0%, rgba(250, 245, 255, 1) 100%)',
      border: 'rgba(196, 181, 253, 0.9)',
    },
  ];

  return (
    <MotionPaper
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      elevation={0}
      className="relative overflow-hidden rounded-[24px]"
      sx={{
        mb: 2,
        p: { xs: 2, sm: 2.5, md: 3 },
        border: '1px solid rgba(148, 163, 184, 0.32)',
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.98) 48%, rgba(241,245,249,0.95) 100%)',
        boxShadow: '0 14px 34px rgba(15, 23, 42, 0.09)',
        backdropFilter: 'blur(2px)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(140% 90% at -10% 0%, rgba(37, 99, 235, 0.14) 0%, rgba(37, 99, 235, 0) 52%), radial-gradient(75% 75% at 110% 100%, rgba(14, 165, 233, 0.1) 0%, rgba(14, 165, 233, 0) 65%)',
        }}
      />

      <Box className="relative z-10">
        <Box className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-5">
          <Box>
            <Box className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/80 px-3 py-1 shadow-sm">
              <Circle size={8} fill="#2563eb" color="#2563eb" />
              <Typography
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  color: '#334155',
                }}
              >
                Learning Studio
              </Typography>
            </Box>

            <Typography
              sx={{
                fontFamily: 'Sora, Manrope, sans-serif',
                fontSize: { xs: '1.45rem', md: '1.8rem' },
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.18,
                color: '#0f172a',
                textAlign: 'left',
              }}
            >
              Continue learning, {firstName}
            </Typography>
            <Typography
              sx={{
                mt: 0.6,
                color: '#475569',
                fontSize: { xs: '0.9rem', md: '0.96rem' },
                maxWidth: 620,
                textAlign: 'left',
              }}
            >
              Personalized videos shaped by your skills and career goals.
            </Typography>
          </Box>

          <Stack
            direction={{ xs: 'row', sm: 'row' }}
            spacing={1.2}
            useFlexGap
            flexWrap="wrap"
            className="justify-start lg:justify-end"
          >
            {stats.map(({ key, label, value, Icon, iconColor, tint, border }, index) => (
              <MotionBox
                key={key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.08 + index * 0.06 }}
                sx={{
                  borderRadius: 2.8,
                  p: 1.2,
                  minWidth: { xs: 98, sm: 116, md: 122 },
                  border: `1px solid ${border}`,
                  background: tint,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 10px 20px rgba(15, 23, 42, 0.1)',
                  },
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={0.8} sx={{ mb: 0.7 }}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: 'rgba(255,255,255,0.8)',
                      border: '1px solid rgba(148, 163, 184, 0.25)',
                    }}
                  >
                    <Icon size={13} color={iconColor} />
                  </Box>
                  <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: '#334155' }}>
                    {label}
                  </Typography>
                </Stack>
                <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, lineHeight: 1.1, color: '#0f172a', textAlign: 'left' }}>
                  {value}
                </Typography>
              </MotionBox>
            ))}
          </Stack>
        </Box>

        <MotionBox
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.18 }}
          sx={{ mt: { xs: 2, md: 2.2 } }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.1, sm: 1.2 },
              borderRadius: 3,
              border: '1px solid rgba(148, 163, 184, 0.34)',
              bgcolor: 'rgba(255, 255, 255, 0.94)',
              transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
              '&:focus-within': {
                borderColor: 'primary.main',
                boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.18)',
              },
            }}
          >
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.1} alignItems={{ xs: 'stretch', md: 'center' }}>
              <Paper
                elevation={0}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  minHeight: 54,
                  px: 1.4,
                  borderRadius: 2.5,
                  border: '1px solid rgba(148, 163, 184, 0.35)',
                  bgcolor: 'white',
                  flex: 1,
                }}
              >
                <Search size={18} color="#64748b" />
                <InputBase
                  fullWidth
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  disabled={isLoading}
                  sx={{ ml: 1.1, fontSize: '0.95rem' }}
                />
                {searchQuery && (
                  <Tooltip title="Clear search">
                    <IconButton onClick={handleClearSearch} size="small">
                      <X size={16} />
                    </IconButton>
                  </Tooltip>
                )}
              </Paper>

              <Box className="grid grid-cols-2 gap-2 md:flex md:items-center md:gap-2">
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || isLoading}
                  className="h-[54px]"
                  sx={{
                    px: 2.8,
                    borderRadius: 2.2,
                    fontWeight: 700,
                    boxShadow: '0 6px 16px rgba(37, 99, 235, 0.28)',
                  }}
                  startIcon={<Search size={16} />}
                >
                  Search
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleOpenFilters}
                  className="h-[54px]"
                  sx={{
                    px: 2.2,
                    borderRadius: 2.2,
                    fontWeight: 700,
                    borderColor: 'rgba(100, 116, 139, 0.35)',
                    color: '#334155',
                  }}
                  startIcon={
                    <Badge badgeContent={activeFiltersCount} color="primary" invisible={!activeFiltersCount}>
                      <SlidersHorizontal size={16} />
                    </Badge>
                  }
                >
                  Filters
                </Button>
              </Box>
            </Stack>

            {activeFilterChips.length > 0 && (
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.3 }}>
                {activeFilterChips.map((chip) => (
                  <Chip
                    key={chip.key}
                    label={chip.label}
                    onDelete={chip.onDelete}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      bgcolor: 'rgba(37, 99, 235, 0.08)',
                      border: '1px solid rgba(37, 99, 235, 0.24)',
                    }}
                  />
                ))}
              </Stack>
            )}
          </Paper>
        </MotionBox>

        <Divider sx={{ my: { xs: 1.4, md: 1.7 }, borderColor: 'rgba(100, 116, 139, 0.22)' }} />

        <MotionBox
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.24 }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
            sx={{ mb: 1.3 }}
          >
            <Stack direction="row" alignItems="center" spacing={1.1}>
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: 1.6,
                  display: 'grid',
                  placeItems: 'center',
                  color: '#fff',
                  background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                  boxShadow: '0 6px 14px rgba(79, 70, 229, 0.32)',
                }}
              >
                <BookOpenText size={16} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                  Popular learning paths
                </Typography>
                <Typography sx={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 500 }}>
                  Curated from your skills · tap a card to start
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={0.5} sx={{ display: { xs: 'none', sm: 'flex' } }}>
              <IconButton
                size="small"
                onClick={() => scrollPaths(-1)}
                aria-label="Scroll learning paths left"
                sx={{
                  border: '1px solid rgba(148, 163, 184, 0.35)',
                  bgcolor: 'rgba(255,255,255,0.9)',
                  '&:hover': { bgcolor: '#fff', borderColor: 'primary.main', color: 'primary.main' },
                }}
              >
                <ChevronLeft size={16} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => scrollPaths(1)}
                aria-label="Scroll learning paths right"
                sx={{
                  border: '1px solid rgba(148, 163, 184, 0.35)',
                  bgcolor: 'rgba(255,255,255,0.9)',
                  '&:hover': { bgcolor: '#fff', borderColor: 'primary.main', color: 'primary.main' },
                }}
              >
                <ChevronRight size={16} />
              </IconButton>
            </Stack>
          </Stack>

          <Box sx={{ position: 'relative' }}>
            <Box
              ref={pathScrollRef}
              sx={{
                display: 'flex',
                gap: 1.2,
                overflowX: 'auto',
                // Padding keeps the hover lift, border and shadow from being clipped by the scroller
                pt: 1.2,
                pb: 1.6,
                px: 0.4,
                mx: -0.4,
                scrollSnapType: 'x mandatory',
                scrollPaddingLeft: '4px',
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
              }}
            >
              {topics.map((topic, index) => {
                const selected = topic === activeTopic;
                const { title, kind, Icon } = describeTopic(topic);
                const palette = PATH_PALETTE[index % PATH_PALETTE.length];

                return (
                  <MotionPaper
                    key={topic}
                    elevation={0}
                    onClick={() => onTopicChange(topic)}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                    sx={{
                      flex: '0 0 auto',
                      width: { xs: 186, sm: 208 },
                      p: 1.25,
                      cursor: 'pointer',
                      borderRadius: 2.5,
                      scrollSnapAlign: 'start',
                      border: '1px solid',
                      borderColor: selected ? 'transparent' : 'rgba(148, 163, 184, 0.3)',
                      background: selected ? palette.gradient : 'rgba(255, 255, 255, 0.96)',
                      color: selected ? '#fff' : '#0f172a',
                      boxShadow: selected
                        ? '0 12px 24px rgba(15, 23, 42, 0.2)'
                        : '0 1px 2px rgba(15, 23, 42, 0.05)',
                      transition: 'box-shadow 0.22s ease, border-color 0.22s ease',
                      '&:hover': {
                        borderColor: selected ? 'transparent' : palette.color,
                        boxShadow: selected
                          ? '0 14px 28px rgba(15, 23, 42, 0.24)'
                          : `0 10px 22px ${palette.soft}, 0 4px 10px rgba(15, 23, 42, 0.08)`,
                      },
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.1}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          flexShrink: 0,
                          borderRadius: 1.6,
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: selected ? 'rgba(255, 255, 255, 0.22)' : palette.soft,
                          color: selected ? '#fff' : palette.color,
                        }}
                      >
                        <Icon size={17} />
                      </Box>

                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          noWrap
                          sx={{ fontSize: '0.86rem', fontWeight: 800, lineHeight: 1.25, textTransform: 'capitalize' }}
                        >
                          {title}
                        </Typography>
                        <Typography
                          noWrap
                          sx={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            color: selected ? 'rgba(255,255,255,0.85)' : '#64748B',
                          }}
                        >
                          {kind}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', opacity: selected ? 1 : 0.4, flexShrink: 0 }}>
                        <ArrowRight size={15} />
                      </Box>
                    </Stack>
                  </MotionPaper>
                );
              })}
            </Box>
          </Box>
        </MotionBox>
      </Box>

      <Popover
        open={filterOpen}
        anchorEl={filterAnchorEl}
        onClose={handleCloseFilters}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1.2,
              width: { xs: 'calc(100vw - 32px)', sm: 440 },
              maxWidth: '100%',
              borderRadius: 3,
              overflow: 'hidden',
              border: '1px solid rgba(148, 163, 184, 0.28)',
              boxShadow: '0 24px 48px rgba(15, 23, 42, 0.2)',
            },
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.6,
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
            color: '#fff',
            background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 45%, #6366F1 100%)',
          }}
        >
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 1.8,
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'rgba(255,255,255,0.18)',
              flexShrink: 0,
            }}
          >
            <SlidersHorizontal size={17} />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, fontSize: '0.98rem', lineHeight: 1.2 }}>Refine results</Typography>
            <Typography sx={{ fontSize: '0.74rem', opacity: 0.85 }}>
              {activeFiltersCount ? `${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} applied` : 'No filters applied'}
            </Typography>
          </Box>

          <Tooltip title="Close">
            <IconButton
              size="small"
              onClick={handleCloseFilters}
              aria-label="Close filters"
              sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.16)' } }}
            >
              <X size={17} />
            </IconButton>
          </Tooltip>
        </Box>

        <Stack spacing={2.2} sx={{ p: 2.2, bgcolor: 'background.paper' }}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 0.9 }}>
              <Box sx={{ display: 'flex', color: '#64748B' }}>
                <Compass size={14} />
              </Box>
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  letterSpacing: 0.7,
                  textTransform: 'uppercase',
                  color: '#475569',
                }}
              >
                Topic
              </Typography>
            </Stack>

            <FormControl size="small" fullWidth>
              <Select
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                sx={{
                  borderRadius: 2,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148, 163, 184, 0.38)' },
                }}
                MenuProps={{ slotProps: { paper: { sx: { borderRadius: 2, maxHeight: 300 } } } }}
              >
                <MenuItem value="all">All topics</MenuItem>
                {topicOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <FilterSection<DifficultyFilter>
            label="Difficulty"
            icon={<BarChart3 size={14} />}
            value={difficulty}
            onChange={setDifficulty}
            options={[
              { value: 'all', label: 'All levels' },
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' },
            ]}
          />

          <FilterSection<DurationFilter>
            label="Duration"
            icon={<Clock4 size={14} />}
            value={duration}
            onChange={setDuration}
            options={[
              { value: 'all', label: 'Any length' },
              { value: 'short', label: 'Under 10 min' },
              { value: 'medium', label: '10-30 min' },
              { value: 'long', label: '30+ min' },
            ]}
          />

          <FilterSection<SortFilter>
            label="Sort by"
            icon={<ArrowUpNarrowWide size={14} />}
            value={sort}
            onChange={setSort}
            options={[
              { value: 'relevance', label: 'Relevance' },
              { value: 'newest', label: 'Newest' },
              { value: 'popular', label: 'Most popular' },
            ]}
          />
        </Stack>

        <Divider />

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1.5}
          sx={{ px: 2.2, py: 1.5, bgcolor: 'rgba(248, 250, 252, 0.9)' }}
        >
          <Button
            variant="text"
            color="inherit"
            onClick={handleResetFilters}
            disabled={!activeFiltersCount}
            startIcon={<RotateCcw size={14} />}
            sx={{ textTransform: 'none', fontWeight: 700, color: '#64748B' }}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            onClick={handleApplyFilters}
            sx={{
              textTransform: 'none',
              fontWeight: 800,
              px: 2.6,
              borderRadius: 2,
              boxShadow: '0 8px 18px rgba(37, 99, 235, 0.3)',
            }}
          >
            Apply filters
          </Button>
        </Stack>
      </Popover>
    </MotionPaper>
  );
};
