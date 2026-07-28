import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import {
  AutoAwesome as AiIcon,
  OpenInNew as OpenIcon,
  Insights as InsightIcon,
  RocketLaunch as RocketIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
  aiDailyCareerBriefService,
  type BriefActionKey,
  type DailyCareerBrief,
  type DailyCareerBriefContext,
} from '@services/aiDailyCareerBrief';
import './AiDailyCareerBrief.css';

const MotionCard = motion(Card);

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

interface AiDailyCareerBriefProps {
  context: DailyCareerBriefContext;
  onAction: (action: BriefActionKey) => void;
}

export const AiDailyCareerBrief: React.FC<AiDailyCareerBriefProps> = ({ context, onAction }) => {
  const [brief, setBrief] = useState<DailyCareerBrief | null>(null);

  useEffect(() => {
    let mounted = true;
    aiDailyCareerBriefService.generateBrief(context).then((data) => {
      if (mounted) setBrief(data);
    });
    return () => {
      mounted = false;
    };
  }, [context]);

  const greeting = useMemo(() => getGreeting(), []);

  if (!brief) {
    return (
      <Card sx={{ borderRadius: 4, mb: 3 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary">Generating AI daily brief...</Typography>
          <LinearProgress sx={{ mt: 1.2 }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <MotionCard
      className="ai-daily-brief ai-brief-glass"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      sx={{
        borderRadius: 4,
        mb: 3,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(145deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.9))'
            : 'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(248,250,252,0.98))',
      }}
    >
      <CardContent sx={{ position: 'relative', zIndex: 1, p: { xs: 2, md: 2.5 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={1.2} sx={{ mb: 2 }}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.6 }}>
              <Chip size="small" icon={<AiIcon />} label="AI Brief" color="primary" sx={{ fontWeight: 700 }} />
              <Typography variant="caption" color="text.secondary">{brief.dateLabel}</Typography>
            </Stack>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>🤖 AI Daily Career Brief</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.2 }}>
              {greeting}{context.userName ? `, ${context.userName}` : ''}. Personalized recommendations generated from your profile, activity and market trends.
            </Typography>
          </Box>
          <Alert icon={<InsightIcon />} severity="info" sx={{ py: 0.2 }}>
            Future-ready: API-backed recommendation provider can replace this mock service anytime.
          </Alert>
        </Stack>

        <Grid container spacing={1.2} sx={{ mb: 2.2 }}>
          {brief.summaryCards.map((card, idx) => (
            <Grid item xs={12} sm={6} md={4} key={card.id}>
              <MotionCard
                className="ai-brief-summary-card"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                sx={{ borderRadius: 3, border: (theme) => `1px solid ${theme.palette.divider}` }}
              >
                <CardContent sx={{ p: 1.6 }}>
                  <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.2 }}>{card.value}</Typography>
                  <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mt: 0.4 }}>
                    {card.delta ? <Chip size="small" label={card.delta} color="success" /> : null}
                    <Typography variant="caption" color="text.secondary">{card.hint}</Typography>
                  </Stack>
                </CardContent>
              </MotionCard>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={1.6}>
          <Grid item xs={12} md={7}>
            <Card className="ai-brief-action-card" sx={{ borderRadius: 3, border: (theme) => `1px solid ${theme.palette.divider}`, mb: 1.4 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Intelligent Recommendations</Typography>
                <Stack spacing={0.7}>
                  {brief.recommendations.map((point, idx) => (
                    <Typography key={`${point}-${idx}`} variant="body2" color="text.secondary">{point}</Typography>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card className="ai-brief-momentum-card" sx={{ borderRadius: 3, border: (theme) => `1px solid ${theme.palette.divider}`, mb: 1.4 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Career Momentum</Typography>
                <Stack spacing={1.1}>
                  {brief.momentum.map((item) => (
                    <Box key={item.id}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.4 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.progress}%</Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={item.progress} sx={{ height: 8, borderRadius: 999 }} />
                      <Typography variant="caption" color="text.secondary">{item.helper}</Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card className="ai-brief-action-card" sx={{ borderRadius: 3, border: (theme) => `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Today's Focus</Typography>
                <Grid container spacing={1}>
                  {brief.focusActions.map((focus) => (
                    <Grid item xs={12} sm={4} key={focus.id}>
                      <Card sx={{ borderRadius: 2.5, border: (theme) => `1px solid ${theme.palette.divider}`, height: '100%' }}>
                        <CardContent sx={{ p: 1.4 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{focus.title}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.6 }}>{focus.description}</Typography>
                          <Button size="small" variant="outlined" sx={{ mt: 1 }} onClick={() => onAction(focus.actionKey)}>
                            Open
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card className="ai-brief-alert-card" sx={{ borderRadius: 3, border: (theme) => `1px solid ${theme.palette.divider}`, mb: 1.4 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Opportunity Alerts</Typography>
                <Stack spacing={0.9}>
                  {brief.alerts.slice(0, 5).map((alert) => (
                    <Card
                      key={alert.id}
                      className={`ai-priority-${alert.priority}`}
                      sx={{ borderRadius: 2.5, border: (theme) => `1px solid ${theme.palette.divider}` }}
                    >
                      <CardContent sx={{ p: 1.2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.4 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{alert.title}</Typography>
                          <Chip size="small" label={alert.priority.toUpperCase()} color={alert.priority === 'high' ? 'error' : alert.priority === 'medium' ? 'warning' : 'success'} />
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>{alert.description}</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.8 }}>
                          Suggested: {alert.suggestedAction}
                        </Typography>
                        <Button size="small" variant="outlined" startIcon={<OpenIcon />} onClick={() => onAction(alert.actionKey)}>
                          Open
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card className="ai-brief-action-card" sx={{ borderRadius: 3, border: (theme) => `1px solid ${theme.palette.divider}`, mb: 1.4 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Quick AI Actions</Typography>
                <Grid container spacing={1}>
                  {brief.quickActions.map((quick) => (
                    <Grid item xs={12} sm={6} key={quick.id}>
                      <Button fullWidth variant="outlined" onClick={() => onAction(quick.actionKey)}>{quick.label}</Button>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            <Card className="ai-brief-motivation-card" sx={{ borderRadius: 3, border: (theme) => `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
                  <RocketIcon color="warning" />
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Motivational Signal</Typography>
                </Stack>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{brief.motivationalTitle}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{brief.motivationalSubtitle}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </CardContent>
    </MotionCard>
  );
};

export default AiDailyCareerBrief;
