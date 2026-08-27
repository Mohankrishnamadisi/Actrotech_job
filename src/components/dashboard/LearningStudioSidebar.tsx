import React from 'react';
import { Box, Button, Chip, LinearProgress, Paper, Stack, Tooltip, Typography } from '@mui/material';
import {
  BookMarked,
  BookOpen,
  Clock3,
  Download,
  Flame,
  Home,
  LayoutGrid,
  Lightbulb,
  Palette,
  UserRound,
} from 'lucide-react';

export type LearningView = 'overview' | 'courses' | 'bookmarks' | 'notes' | 'history' | 'downloads';

export interface LearningSidebarCounts {
  courses: number;
  bookmarks: number;
  notes: number;
  history: number;
  downloads: number;
}

export interface LearningCategory {
  label: string;
  query: string;
}

export const LEARNING_CATEGORIES: LearningCategory[] = [
  { label: 'Development', query: 'full stack web development tutorial' },
  { label: 'Data Science', query: 'data science and machine learning tutorial' },
  { label: 'Design', query: 'ui ux design tutorial' },
  { label: 'Personal Growth', query: 'career growth and communication skills' },
];

const quickLinks: Array<{
  view: LearningView;
  label: string;
  Icon: typeof Home;
  countKey?: keyof LearningSidebarCounts;
}> = [
  { view: 'overview', label: 'Overview', Icon: Home },
  { view: 'courses', label: 'My Courses', Icon: BookOpen, countKey: 'courses' },
  { view: 'bookmarks', label: 'Bookmarks', Icon: BookMarked, countKey: 'bookmarks' },
  { view: 'notes', label: 'My Notes', Icon: LayoutGrid, countKey: 'notes' },
  { view: 'history', label: 'History', Icon: Clock3, countKey: 'history' },
  { view: 'downloads', label: 'Downloads', Icon: Download, countKey: 'downloads' },
];

const categoryIcons: Record<string, typeof Home> = {
  Development: LayoutGrid,
  'Data Science': Lightbulb,
  Design: Palette,
  'Personal Growth': UserRound,
};

interface LearningStudioSidebarProps {
  activeView: LearningView;
  onViewChange: (view: LearningView) => void;
  counts: LearningSidebarCounts;
  activeCategory: string;
  onCategorySelect: (category: LearningCategory) => void;
  onUpgrade: () => void;
  streak: number;
  todayMinutes: number;
  dailyGoalMinutes: number;
  isPremium?: boolean;
}

export const LearningStudioSidebar: React.FC<LearningStudioSidebarProps> = ({
  activeView,
  onViewChange,
  counts,
  activeCategory,
  onCategorySelect,
  onUpgrade,
  streak,
  todayMinutes,
  dailyGoalMinutes,
  isPremium = false,
}) => {
  const goalProgress = Math.min(100, Math.round((todayMinutes / Math.max(1, dailyGoalMinutes)) * 100));

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          p: 2,
          bgcolor: 'background.paper',
          position: { xs: 'static', lg: 'sticky' },
          top: 90,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography
            sx={{
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: 0.9,
              textTransform: 'uppercase',
              color: 'text.secondary',
            }}
          >
            Learning Studio
          </Typography>
          <Tooltip title={`${streak} day learning streak`}>
            <Chip
              size="small"
              icon={<Flame size={13} />}
              label={streak}
              color={streak > 0 ? 'warning' : 'default'}
              variant={streak > 0 ? 'filled' : 'outlined'}
              sx={{ height: 22, fontWeight: 800, fontSize: '0.7rem', '& .MuiChip-icon': { ml: 0.6 } }}
            />
          </Tooltip>
        </Stack>

        <Stack
          sx={{
            mb: 2,
            flexDirection: { xs: 'row', lg: 'column' },
            flexWrap: { xs: 'wrap', lg: 'nowrap' },
            gap: { xs: 0.8, lg: 0.6 },
          }}
        >
          {quickLinks.map(({ view, label, Icon, countKey }) => {
            const active = activeView === view;
            const count = countKey ? counts[countKey] : 0;
            return (
              <Box
                key={label}
                component="button"
                type="button"
                onClick={() => onViewChange(view)}
                aria-current={active ? 'page' : undefined}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.2,
                  py: 0.95,
                  width: { xs: 'auto', lg: '100%' },
                  border: 'none',
                  textAlign: 'left',
                  borderRadius: 1.6,
                  bgcolor: active
                    ? (theme) => (theme.palette.mode === 'dark' ? 'rgba(88, 101, 242, 0.2)' : 'rgba(79, 70, 229, 0.1)')
                    : 'transparent',
                  color: active ? 'primary.main' : 'text.primary',
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.86rem',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  transition: 'background-color 0.18s ease, color 0.18s ease',
                  '&:hover': { bgcolor: (theme) => theme.palette.action.hover },
                }}
              >
                <Icon size={15} />
                <Box component="span" sx={{ flex: 1 }}>
                  {label}
                </Box>
                {countKey && count > 0 && (
                  <Box
                    component="span"
                    sx={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      px: 0.7,
                      py: 0.1,
                      borderRadius: 1,
                      bgcolor: (theme) => theme.palette.action.selected,
                      color: 'text.secondary',
                    }}
                  >
                    {count > 99 ? '99+' : count}
                  </Box>
                )}
              </Box>
            );
          })}
        </Stack>

        <Typography
          sx={{
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: 0.9,
            textTransform: 'uppercase',
            color: 'text.secondary',
            mb: 1,
          }}
        >
          Categories
        </Typography>

        <Stack
          sx={{
            mb: 2,
            flexDirection: { xs: 'row', lg: 'column' },
            flexWrap: { xs: 'wrap', lg: 'nowrap' },
            gap: { xs: 0.8, lg: 0.6 },
          }}
        >
          {LEARNING_CATEGORIES.map((category) => {
            const Icon = categoryIcons[category.label] || LayoutGrid;
            const active = activeCategory === category.label;
            return (
              <Box
                key={category.label}
                component="button"
                type="button"
                onClick={() => onCategorySelect(category)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.2,
                  py: 0.9,
                  width: { xs: 'auto', lg: '100%' },
                  border: 'none',
                  textAlign: 'left',
                  borderRadius: 1.4,
                  bgcolor: active
                    ? (theme) => (theme.palette.mode === 'dark' ? 'rgba(88, 101, 242, 0.16)' : 'rgba(79, 70, 229, 0.08)')
                    : 'transparent',
                  color: active ? 'primary.main' : 'text.primary',
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.84rem',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: (theme) => theme.palette.action.hover },
                }}
              >
                <Icon size={14} />
                <span>{category.label}</span>
              </Box>
            );
          })}
        </Stack>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            p: 1.5,
            mb: 1.5,
            border: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.8 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 800 }}>Today&apos;s goal</Typography>
            <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 700 }}>
              {todayMinutes}/{dailyGoalMinutes} min
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={goalProgress}
            color={goalProgress >= 100 ? 'success' : 'primary'}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Paper>

        {!isPremium && (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              p: 1.5,
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 45%, #7C3AED 100%)',
              color: 'white',
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: '0.86rem', mb: 0.7 }}>Go Premium</Typography>
            <Typography sx={{ fontSize: '0.73rem', opacity: 0.9, lineHeight: 1.4, mb: 1.2 }}>
              Unlock unlimited access to premium content and features.
            </Typography>
            <Button
              size="small"
              variant="contained"
              fullWidth
              onClick={onUpgrade}
              sx={{
                bgcolor: 'rgba(255,255,255,0.16)',
                color: 'white',
                borderRadius: 1.2,
                textTransform: 'none',
                fontWeight: 700,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' },
              }}
            >
              Upgrade Now
            </Button>
          </Paper>
        )}
      </Paper>
    </Box>
  );
};
