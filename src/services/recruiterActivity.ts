export type RecruiterActivityFilter = 'today' | '7d' | '30d' | '90d';
export type TrendRange = 'weekly' | 'monthly' | 'quarterly';

export type RecruiterActivityType =
  | 'profile_viewed'
  | 'resume_downloaded'
  | 'application_shortlisted'
  | 'recruiter_message'
  | 'interview_invite'
  | 'application_stage_update'
  | 'saved_by_recruiter'
  | 'assessment_viewed';

export type RecruiterActivityStatus = 'new' | 'in_progress' | 'completed';

export interface RecruiterActivityApplication {
  id: string;
  status?: string;
  appliedAt?: string;
  title?: string;
  companyName?: string;
}

export interface RecruiterActivityContext {
  userId: string;
  isPremium: boolean;
  profileCompletion: number;
  resumeDownloads: number;
  profileViews: number;
  recruiterMessages: number;
  savedJobs: number;
  skillsCount: number;
  assessmentsCompleted: number;
  hasResume: boolean;
  recentApplications: RecruiterActivityApplication[];
}

export interface RecruiterActivityEvent {
  id: string;
  type: RecruiterActivityType;
  title: string;
  subtitle: string;
  occurredAt: string;
  status: RecruiterActivityStatus;
  actionLabel: string;
  actionKey: string;
}

export interface RecruiterActivityOverview {
  profileViews: number;
  resumeDownloads: number;
  recruiterMessages: number;
  interviewInvitations: number;
  searchAppearances: number;
  shortlists: number;
  bookmarks: number;
}

export interface VisibilityBreakdown {
  resumeQuality: number;
  profileCompletion: number;
  skills: number;
  projects: number;
  assessments: number;
  portfolio: number;
  experience: number;
}

export interface WeeklyComparisonRow {
  label: 'Profile Views' | 'Resume Downloads' | 'Messages';
  thisWeek: number;
  lastWeek: number;
  growth: number;
}

export interface RecruiterNotificationItem {
  id: string;
  text: string;
  occurredAt: string;
}

export interface VisibilityTrendPoint {
  label: string;
  score: number;
}

export interface RecruiterInterestCategory {
  category: string;
  level: 'Very High' | 'High' | 'Medium' | 'Low';
  score: number;
}

export interface RecruiterActivityInsights {
  visibilityScore: number;
  visibilityBreakdown: VisibilityBreakdown;
  overview: RecruiterActivityOverview;
  timeline: RecruiterActivityEvent[];
  weeklyComparison: WeeklyComparisonRow[];
  suggestions: string[];
  notifications: RecruiterNotificationItem[];
  engagementScore: number;
  interestCategories: RecruiterInterestCategory[];
  trend: Record<TrendRange, VisibilityTrendPoint[]>;
  profileRankingPercentile: number;
}

const clamp = (value: number, min = 0, max = 100): number => Math.max(min, Math.min(max, value));

const seedFromUser = (userId: string): number => {
  if (!userId) return 17;
  return userId.split('').reduce((acc, char, index) => acc + (char.charCodeAt(0) * (index + 3)), 17);
};

const pseudo = (seed: number, salt: number, min: number, max: number): number => {
  const raw = Math.sin(seed * 0.013 + salt * 1.17) * 10000;
  const normalized = raw - Math.floor(raw);
  return Math.round(min + (max - min) * normalized);
};

const toIsoDate = (daysAgo: number, hourOffset = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(Math.max(0, 17 - hourOffset), Math.max(0, 50 - (daysAgo * 3) % 40), 0, 0);
  return date.toISOString();
};

const normalizeStatus = (status?: string): RecruiterActivityStatus => {
  if (!status) return 'new';
  if (status === 'accepted' || status === 'shortlisted') return 'completed';
  if (status === 'under_review') return 'in_progress';
  return 'new';
};

const buildTimelineFromApplications = (apps: RecruiterActivityApplication[]): RecruiterActivityEvent[] => {
  return apps.slice(0, 5).map((item, index) => {
    const normalized = (item.status || '').toLowerCase();
    const isShortlisted = normalized === 'shortlisted';
    const isReview = normalized === 'under_review';
    const isAccepted = normalized === 'accepted';

    const title = isShortlisted
      ? 'Application shortlisted'
      : isReview
      ? 'Application moved to next stage'
      : isAccepted
      ? 'Interview invitation received'
      : 'Recruiter viewed your application';

    return {
      id: `application-${item.id}-${index}`,
      type: isAccepted ? 'interview_invite' : isShortlisted ? 'application_shortlisted' : 'application_stage_update',
      title,
      subtitle: `${item.title || 'Role'} at ${item.companyName || 'Company'}`,
      occurredAt: item.appliedAt || toIsoDate(index + 1, index),
      status: normalizeStatus(item.status),
      actionLabel: 'View application',
      actionKey: 'applications',
    };
  });
};

const buildBaseTimeline = (ctx: RecruiterActivityContext): RecruiterActivityEvent[] => {
  const appEvents = buildTimelineFromApplications(ctx.recentApplications);
  const staticEvents: RecruiterActivityEvent[] = [
    {
      id: 'profile-view-1',
      type: 'profile_viewed',
      title: 'Recruiter viewed your profile',
      subtitle: 'Your profile appeared in recruiter discovery feed.',
      occurredAt: toIsoDate(0, 1),
      status: 'new',
      actionLabel: 'Improve profile',
      actionKey: 'improve-profile',
    },
    {
      id: 'resume-download-1',
      type: 'resume_downloaded',
      title: 'Resume downloaded',
      subtitle: 'A recruiter downloaded your resume.',
      occurredAt: toIsoDate(1, 2),
      status: 'completed',
      actionLabel: 'Update resume',
      actionKey: 'update-resume',
    },
    {
      id: 'message-1',
      type: 'recruiter_message',
      title: 'Recruiter sent message',
      subtitle: 'You received a new recruiter message.',
      occurredAt: toIsoDate(2, 3),
      status: ctx.recruiterMessages > 0 ? 'new' : 'in_progress',
      actionLabel: 'Open messages',
      actionKey: 'messages',
    },
    {
      id: 'saved-by-recruiter-1',
      type: 'saved_by_recruiter',
      title: 'Saved by recruiter',
      subtitle: 'A recruiter bookmarked your profile for follow-up.',
      occurredAt: toIsoDate(3, 4),
      status: 'in_progress',
      actionLabel: 'Browse jobs',
      actionKey: 'browse-jobs',
    },
    {
      id: 'assessment-viewed-1',
      type: 'assessment_viewed',
      title: 'Assessment viewed',
      subtitle: 'Recruiters checked your assessment performance.',
      occurredAt: toIsoDate(5, 5),
      status: 'completed',
      actionLabel: 'Take assessment',
      actionKey: 'take-assessment',
    },
  ];

  return [...appEvents, ...staticEvents]
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
};

const filterTimeline = (timeline: RecruiterActivityEvent[], filter: RecruiterActivityFilter): RecruiterActivityEvent[] => {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const days = filter === 'today' ? 1 : filter === '7d' ? 7 : filter === '30d' ? 30 : 90;
  return timeline.filter((item) => now - new Date(item.occurredAt).getTime() <= days * dayMs);
};

const calculateVisibilityBreakdown = (ctx: RecruiterActivityContext, timelineCount: number): VisibilityBreakdown => {
  const resumeQuality = clamp((ctx.hasResume ? 58 : 25) + (ctx.resumeDownloads * 5));
  const profileCompletion = clamp(ctx.profileCompletion);
  const skills = clamp(28 + (ctx.skillsCount * 9));
  const projects = clamp(Math.round(ctx.profileCompletion * 0.78));
  const assessments = clamp(20 + (ctx.assessmentsCompleted * 12));
  const portfolio = clamp((ctx.hasResume ? 45 : 18) + (ctx.skillsCount * 4));
  const experience = clamp(30 + (timelineCount * 7) + (ctx.profileViews * 2));

  return {
    resumeQuality,
    profileCompletion,
    skills,
    projects,
    assessments,
    portfolio,
    experience,
  };
};

const computeVisibilityScore = (breakdown: VisibilityBreakdown): number => {
  const weighted = (
    (breakdown.resumeQuality * 0.2)
    + (breakdown.profileCompletion * 0.2)
    + (breakdown.skills * 0.18)
    + (breakdown.assessments * 0.12)
    + (breakdown.experience * 0.12)
    + (breakdown.projects * 0.08)
    + (breakdown.portfolio * 0.1)
  );

  return clamp(Math.round(weighted));
};

const buildOverview = (ctx: RecruiterActivityContext, seed: number): RecruiterActivityOverview => {
  const shortlists = ctx.recentApplications.filter((item) => item.status === 'shortlisted').length;
  const interviewInvitations = ctx.recentApplications.filter((item) => item.status === 'accepted').length;
  const searchAppearances = clamp(
    Math.round((ctx.profileViews * 1.6) + (ctx.skillsCount * 2.2) + pseudo(seed, 3, 5, 18)),
    0,
    999,
  );

  return {
    profileViews: ctx.profileViews,
    resumeDownloads: ctx.resumeDownloads,
    recruiterMessages: ctx.recruiterMessages,
    interviewInvitations,
    searchAppearances,
    shortlists,
    bookmarks: ctx.savedJobs,
  };
};

const growth = (thisWeek: number, lastWeek: number): number => {
  if (lastWeek <= 0 && thisWeek > 0) return 100;
  if (lastWeek <= 0) return 0;
  return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
};

const buildWeeklyComparison = (overview: RecruiterActivityOverview, seed: number): WeeklyComparisonRow[] => {
  const viewsLast = Math.max(0, overview.profileViews - pseudo(seed, 11, 1, 5));
  const downloadsLast = Math.max(0, overview.resumeDownloads - pseudo(seed, 13, 0, 3));
  const messagesLast = Math.max(0, overview.recruiterMessages - pseudo(seed, 17, 0, 2));

  return [
    {
      label: 'Profile Views',
      thisWeek: overview.profileViews,
      lastWeek: viewsLast,
      growth: growth(overview.profileViews, viewsLast),
    },
    {
      label: 'Resume Downloads',
      thisWeek: overview.resumeDownloads,
      lastWeek: downloadsLast,
      growth: growth(overview.resumeDownloads, downloadsLast),
    },
    {
      label: 'Messages',
      thisWeek: overview.recruiterMessages,
      lastWeek: messagesLast,
      growth: growth(overview.recruiterMessages, messagesLast),
    },
  ];
};

const buildSuggestions = (ctx: RecruiterActivityContext, score: number): string[] => {
  const suggestions: string[] = [];

  if (ctx.assessmentsCompleted === 0) suggestions.push('Complete React Assessment.');
  if (!ctx.hasResume) suggestions.push('Upload resume to attract recruiters.');
  if (ctx.skillsCount < 6) suggestions.push('Add Docker skill.');
  if (ctx.profileCompletion < 80) suggestions.push('Increase profile completion.');
  if (score < 70) suggestions.push('Improve ATS score.');
  suggestions.push('Add certifications.');
  suggestions.push('Upload GitHub profile.');

  return suggestions.slice(0, ctx.isPremium ? 6 : 3);
};

const buildNotifications = (timeline: RecruiterActivityEvent[]): RecruiterNotificationItem[] => {
  return timeline
    .filter((item) => (
      item.type === 'profile_viewed'
      || item.type === 'resume_downloaded'
      || item.type === 'interview_invite'
      || item.type === 'recruiter_message'
      || item.type === 'application_shortlisted'
    ))
    .slice(0, 5)
    .map((item) => ({
      id: `notif-${item.id}`,
      text: item.title,
      occurredAt: item.occurredAt,
    }));
};

const buildTrend = (seed: number, baseline: number): Record<TrendRange, VisibilityTrendPoint[]> => {
  const mk = (labels: string[], salt: number): VisibilityTrendPoint[] => labels.map((label, idx) => ({
    label,
    score: clamp(baseline + pseudo(seed, salt + idx, -12, 14)),
  }));

  return {
    weekly: mk(['W1', 'W2', 'W3', 'W4'], 21),
    monthly: mk(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], 31),
    quarterly: mk(['Q1', 'Q2', 'Q3', 'Q4'], 41),
  };
};

const buildInterestCategories = (seed: number): RecruiterInterestCategory[] => {
  const raw = [
    { category: 'Frontend Companies', score: clamp(pseudo(seed, 61, 72, 96)) },
    { category: 'Remote Companies', score: clamp(pseudo(seed, 62, 65, 90)) },
    { category: 'Product Companies', score: clamp(pseudo(seed, 63, 48, 82)) },
    { category: 'Enterprise Companies', score: clamp(pseudo(seed, 64, 38, 78)) },
  ];

  return raw.map((item) => ({
    category: item.category,
    score: item.score,
    level: item.score >= 88 ? 'Very High' : item.score >= 72 ? 'High' : item.score >= 52 ? 'Medium' : 'Low',
  }));
};

const buildEngagementScore = (overview: RecruiterActivityOverview, seed: number): number => {
  const score = (
    (overview.recruiterMessages * 12)
    + (overview.resumeDownloads * 16)
    + (overview.searchAppearances * 0.9)
    + (overview.profileViews * 4)
    + (overview.shortlists * 14)
    + pseudo(seed, 70, 8, 20)
  ) / 4.2;

  return clamp(Math.round(score));
};

export const recruiterActivityService = {
  getInsights(context: RecruiterActivityContext, filter: RecruiterActivityFilter = '7d'): RecruiterActivityInsights {
    const seed = seedFromUser(context.userId);
    const timelineAll = buildBaseTimeline(context);
    const timeline = filterTimeline(timelineAll, filter);
    const overview = buildOverview(context, seed);
    const visibilityBreakdown = calculateVisibilityBreakdown(context, timeline.length);
    const visibilityScore = computeVisibilityScore(visibilityBreakdown);
    const weeklyComparison = buildWeeklyComparison(overview, seed);
    const suggestions = buildSuggestions(context, visibilityScore);
    const notifications = buildNotifications(timelineAll);
    const engagementScore = buildEngagementScore(overview, seed);
    const interestCategories = buildInterestCategories(seed);
    const trend = buildTrend(seed, visibilityScore);
    const profileRankingPercentile = clamp(100 - pseudo(seed, 81, 4, 36), 35, 98);

    return {
      visibilityScore,
      visibilityBreakdown,
      overview,
      timeline,
      weeklyComparison,
      suggestions,
      notifications,
      engagementScore,
      interestCategories,
      trend,
      profileRankingPercentile,
    };
  },
};
