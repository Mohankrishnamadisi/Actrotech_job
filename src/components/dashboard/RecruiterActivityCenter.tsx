import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import {
  AutoAwesome as AutoAwesomeIcon,
  Bookmark as BookmarkIcon,
  Download as DownloadIcon,
  Forum as ForumIcon,
  Insights as InsightsIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
  Work as WorkIcon,
  EventAvailable as EventAvailableIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

import {
  recruiterActivityService,
  type RecruiterActivityContext,
  type RecruiterActivityEvent,
  type RecruiterActivityFilter,
  type TrendRange,
} from '@services/recruiterActivity';
import { formatDate } from '@utils/index';

export type RecruiterActivityQuickAction =
  | 'improve-profile'
  | 'update-resume'
  | 'take-assessment'
  | 'browse-jobs'
  | 'ai-career-hub'
  | 'messages'
  | 'applications';

interface RecruiterActivityCenterProps {
  context: RecruiterActivityContext;
  onQuickAction?: (action: RecruiterActivityQuickAction) => void;
}

const filters: Array<{ key: RecruiterActivityFilter; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 Days' },
  { key: '30d', label: 'Last 30 Days' },
  { key: '90d', label: 'Last 90 Days' },
];

const trendRanges: Array<{ key: TrendRange; label: string }> = [
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'quarterly', label: 'Quarterly' },
];

const overviewMeta: Array<{
  key: 'profileViews' | 'resumeDownloads' | 'recruiterMessages' | 'interviewInvitations' | 'searchAppearances' | 'shortlists' | 'bookmarks';
  label: string;
  icon: React.ElementType;
  premiumOnly?: boolean;
}> = [
  { key: 'profileViews', label: 'Profile Views', icon: VisibilityIcon },
  { key: 'resumeDownloads', label: 'Resume Downloads', icon: DownloadIcon },
  { key: 'recruiterMessages', label: 'Recruiter Messages', icon: ForumIcon },
  { key: 'interviewInvitations', label: 'Interview Invitations', icon: EventAvailableIcon },
  { key: 'searchAppearances', label: 'Search Appearances', icon: SearchIcon, premiumOnly: true },
  { key: 'shortlists', label: 'Shortlists', icon: CheckCircleIcon },
  { key: 'bookmarks', label: 'Bookmarks', icon: BookmarkIcon },
];

const breakdownMeta: Array<{ key: keyof ReturnType<typeof recruiterActivityService.getInsights>['visibilityBreakdown']; label: string }> = [
  { key: 'resumeQuality', label: 'Resume Quality' },
  { key: 'profileCompletion', label: 'Profile Completion' },
  { key: 'skills', label: 'Skills' },
  { key: 'projects', label: 'Projects' },
  { key: 'assessments', label: 'Assessments' },
  { key: 'portfolio', label: 'Portfolio' },
  { key: 'experience', label: 'Experience' },
];

const eventIcon = (type: RecruiterActivityEvent['type']) => {
  switch (type) {
    case 'profile_viewed':
      return <VisibilityIcon color="primary" fontSize="small" />;
    case 'resume_downloaded':
      return <DownloadIcon color="success" fontSize="small" />;
    case 'application_shortlisted':
      return <CheckCircleIcon color="success" fontSize="small" />;
    case 'recruiter_message':
      return <ForumIcon color="info" fontSize="small" />;
    case 'interview_invite':
      return <EventAvailableIcon color="warning" fontSize="small" />;
    case 'saved_by_recruiter':
      return <BookmarkIcon color="secondary" fontSize="small" />;
    case 'assessment_viewed':
      return <SchoolIcon color="primary" fontSize="small" />;
    default:
      return <TrendingUpIcon color="action" fontSize="small" />;
  }
};

const statusColor = (status: RecruiterActivityEvent['status']): 'success' | 'warning' | 'info' => {
  if (status === 'completed') return 'success';
  if (status === 'in_progress') return 'warning';
  return 'info';
};

const toTime = (iso: string): string => {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const RecruiterActivityCenter: React.FC<RecruiterActivityCenterProps> = ({ context, onQuickAction }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [filter, setFilter] = useState<RecruiterActivityFilter>('7d');
  const [trendRange, setTrendRange] = useState<TrendRange>('weekly');

  const insights = useMemo(
    () => recruiterActivityService.getInsights(context, filter),
    [context, filter],
  );

  const trendPoints = insights.trend[trendRange];

  return (
    <Card
      sx={{
        mt: 3,
        mb: 3,
        borderRadius: 4,
        border: isDarkMode ? '1px solid rgba(148,163,184,0.24)' : `1px solid ${theme.palette.divider}`,
        background: isDarkMode
          ? 'linear-gradient(140deg, rgba(2,6,23,0.95), rgba(30,41,59,0.95))'
          : 'linear-gradient(140deg, #FFFFFF 0%, #F8FAFF 60%, #EFF6FF 100%)',
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5, flexWrap: 'wrap', mb: 2.1 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Recruiter Activity
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              See how recruiters interact with your profile.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              icon={<InsightsIcon />}
              label={`Visibility Score ${insights.visibilityScore}/100`}
              color={insights.visibilityScore >= 72 ? 'success' : insights.visibilityScore >= 55 ? 'warning' : 'default'}
              sx={{ fontWeight: 700 }}
            />
            {context.isPremium ? (
              <Chip
                icon={<AutoAwesomeIcon />}
                label={`Engagement ${insights.engagementScore}/100`}
                color={insights.engagementScore >= 80 ? 'success' : 'warning'}
                sx={{ fontWeight: 700 }}
              />
            ) : null}
          </Stack>
        </Box>

        <Stack direction="row" spacing={1} sx={{ mb: 2.1, flexWrap: 'wrap', rowGap: 1 }}>
          {filters.map((item) => (
            <Chip
              key={item.key}
              label={item.label}
              onClick={() => setFilter(item.key)}
              color={filter === item.key ? 'primary' : 'default'}
              variant={filter === item.key ? 'filled' : 'outlined'}
              sx={{ fontWeight: 700 }}
            />
          ))}
        </Stack>

        <Grid container spacing={1.3} sx={{ mb: 2.2 }}>
          {overviewMeta.map((item) => {
            const value = insights.overview[item.key];
            const locked = item.premiumOnly && !context.isPremium;
            return (
              <Grid item xs={12} sm={6} md={3.4} lg={1.7} key={item.key}>
                <Card sx={{ borderRadius: 2.5, height: '100%', border: isDarkMode ? '1px solid rgba(148,163,184,0.22)' : '1px solid rgba(203,213,225,0.8)' }}>
                  <CardContent sx={{ p: 1.4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                      <item.icon sx={{ color: locked ? '#94A3B8' : theme.palette.primary.main }} fontSize="small" />
                      {locked ? <Chip size="small" label="Premium" sx={{ height: 20, fontSize: 11 }} /> : null}
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                      {item.label}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.35 }}>
                      {locked ? '--' : value}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} lg={7}>
            <Card sx={{ borderRadius: 3, border: isDarkMode ? '1px solid rgba(148,163,184,0.2)' : '1px solid rgba(203,213,225,0.8)' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.1 }}>
                  Recent Activity Feed
                </Typography>
                {insights.timeline.length === 0 ? (
                  <Box
                    sx={{
                      p: 1.6,
                      borderRadius: 2,
                      border: isDarkMode ? '1px dashed rgba(148,163,184,0.36)' : '1px dashed rgba(148,163,184,0.5)',
                    }}
                  >
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                      Complete profile to increase visibility.
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                      Upload resume to attract recruiters.
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Take assessments for better ranking.
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ p: 0, display: 'grid', gap: 1 }}>
                    {insights.timeline.slice(0, context.isPremium ? 10 : 6).map((event) => (
                      <ListItem
                        key={event.id}
                        sx={{
                          p: 1.2,
                          borderRadius: 2,
                          border: isDarkMode ? '1px solid rgba(148,163,184,0.2)' : '1px solid rgba(203,213,225,0.72)',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1,
                          flexWrap: 'wrap',
                        }}
                      >
                        <Box sx={{ mt: 0.35 }}>{eventIcon(event.type)}</Box>
                        <Box sx={{ flex: 1, minWidth: 190 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {event.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.3 }}>
                            {event.subtitle}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {formatDate(event.occurredAt)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {toTime(event.occurredAt)}
                            </Typography>
                            <Chip size="small" color={statusColor(event.status)} label={event.status.replace('_', ' ')} sx={{ textTransform: 'capitalize' }} />
                          </Stack>
                        </Box>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => onQuickAction?.(event.actionKey as RecruiterActivityQuickAction)}
                          sx={{ fontWeight: 700 }}
                        >
                          {event.actionLabel}
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={5}>
            <Stack spacing={1.5}>
              <Card sx={{ borderRadius: 3, border: isDarkMode ? '1px solid rgba(148,163,184,0.2)' : '1px solid rgba(203,213,225,0.8)' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.1 }}>
                    Profile Visibility Breakdown
                  </Typography>

                  <Stack spacing={1.1}>
                    {breakdownMeta.map((item) => {
                      const value = insights.visibilityBreakdown[item.key];
                      return (
                        <Box key={item.key}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700 }}>{item.label}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>{value}%</Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={value}
                            sx={{
                              height: 8,
                              borderRadius: 10,
                              bgcolor: isDarkMode ? 'rgba(148,163,184,0.24)' : 'rgba(203,213,225,0.5)',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 10,
                              },
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Stack>
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: 3, border: isDarkMode ? '1px solid rgba(148,163,184,0.2)' : '1px solid rgba(203,213,225,0.8)' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.1 }}>
                    Weekly Comparison
                  </Typography>

                  <Stack spacing={0.9}>
                    {insights.weeklyComparison.map((row) => (
                      <Box key={row.label} sx={{ p: 1, borderRadius: 1.5, border: isDarkMode ? '1px solid rgba(148,163,184,0.18)' : '1px solid rgba(203,213,225,0.65)' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>{row.label}</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.4 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>This Week: {row.thisWeek}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Last Week: {row.lastWeek}</Typography>
                          <Typography variant="caption" sx={{ color: row.growth >= 0 ? 'success.main' : 'error.main', fontWeight: 700 }}>
                            {row.growth >= 0 ? '+' : ''}{row.growth}%
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mt: 0.2 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, border: isDarkMode ? '1px solid rgba(148,163,184,0.2)' : '1px solid rgba(203,213,225,0.8)' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
                  Notifications
                </Typography>
                <List sx={{ p: 0 }}>
                  {insights.notifications.length > 0 ? insights.notifications.map((note) => (
                    <ListItem key={note.id} sx={{ px: 0, py: 0.6 }}>
                      <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                      <ListItemText
                        primary={note.text}
                        secondary={formatDate(note.occurredAt)}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                      />
                    </ListItem>
                  )) : (
                    <ListItem sx={{ px: 0, py: 0.6 }}>
                      <ListItemText
                        primary="No new recruiter activity"
                        secondary="Your visibility alerts will appear here."
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, border: isDarkMode ? '1px solid rgba(148,163,184,0.2)' : '1px solid rgba(203,213,225,0.8)' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
                  {context.isPremium ? 'AI Visibility Suggestions' : 'Basic Suggestions'}
                </Typography>
                <List sx={{ p: 0 }}>
                  {insights.suggestions.map((item) => (
                    <ListItem key={item} sx={{ px: 0, py: 0.5 }}>
                      <ListItemText
                        primary={item}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {context.isPremium ? (
          <Grid container spacing={2} sx={{ mt: 0.2 }}>
            <Grid item xs={12} lg={5}>
              <Card sx={{ borderRadius: 3, border: isDarkMode ? '1px solid rgba(148,163,184,0.2)' : '1px solid rgba(203,213,225,0.8)' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.1 }}>
                    Visibility Trend Chart
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mb: 1.2, flexWrap: 'wrap', rowGap: 1 }}>
                    {trendRanges.map((item) => (
                      <Chip
                        key={item.key}
                        label={item.label}
                        color={trendRange === item.key ? 'primary' : 'default'}
                        variant={trendRange === item.key ? 'filled' : 'outlined'}
                        onClick={() => setTrendRange(item.key)}
                        sx={{ fontWeight: 700 }}
                      />
                    ))}
                  </Stack>

                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, minHeight: 120 }}>
                    {trendPoints.map((point) => (
                      <Box key={point.label} sx={{ flex: 1, textAlign: 'center' }}>
                        <Box
                          sx={{
                            height: `${Math.max(18, point.score)}px`,
                            borderRadius: 1,
                            background: 'linear-gradient(180deg, #0EA5E9, #1D4ED8)',
                            mb: 0.5,
                          }}
                        />
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{point.label}</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>{point.score}</Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} lg={3.5}>
              <Card sx={{ borderRadius: 3, border: isDarkMode ? '1px solid rgba(148,163,184,0.2)' : '1px solid rgba(203,213,225,0.8)' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Profile Ranking
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.6 }}>
                    {insights.profileRankingPercentile}th
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.2 }}>
                    percentile in recruiter discovery
                  </Typography>

                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.7 }}>
                    Recruiter Interest Categories
                  </Typography>
                  <Stack spacing={0.8}>
                    {insights.interestCategories.map((item) => (
                      <Box key={item.category} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>{item.category}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{item.level}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} lg={3.5}>
              <Card sx={{ borderRadius: 3, border: isDarkMode ? '1px solid rgba(148,163,184,0.2)' : '1px solid rgba(203,213,225,0.8)' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
                    Recruiter Engagement Score
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    {insights.engagementScore}/100
                  </Typography>

                  <Stack spacing={0.9} sx={{ mt: 1.2 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Messages, downloads, searches, profile opens and shortlists drive this score.</Typography>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>Messages</Typography>
                      <LinearProgress variant="determinate" value={Math.min(100, insights.overview.recruiterMessages * 12)} sx={{ mt: 0.3, height: 7, borderRadius: 10 }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>Downloads</Typography>
                      <LinearProgress variant="determinate" value={Math.min(100, insights.overview.resumeDownloads * 16)} sx={{ mt: 0.3, height: 7, borderRadius: 10 }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>Searches</Typography>
                      <LinearProgress variant="determinate" value={Math.min(100, insights.overview.searchAppearances)} sx={{ mt: 0.3, height: 7, borderRadius: 10 }} />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : null}

        <Box sx={{ mt: 2.2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
            Quick Actions
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            <Button variant="outlined" onClick={() => onQuickAction?.('improve-profile')} sx={{ fontWeight: 700 }}>Improve Profile</Button>
            <Button variant="outlined" onClick={() => onQuickAction?.('update-resume')} sx={{ fontWeight: 700 }}>Update Resume</Button>
            <Button variant="outlined" onClick={() => onQuickAction?.('take-assessment')} sx={{ fontWeight: 700 }}>Take Assessment</Button>
            <Button variant="outlined" onClick={() => onQuickAction?.('browse-jobs')} sx={{ fontWeight: 700 }}>Browse Jobs</Button>
            <Button variant="outlined" onClick={() => onQuickAction?.('ai-career-hub')} sx={{ fontWeight: 700 }}>AI Career Hub</Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RecruiterActivityCenter;
