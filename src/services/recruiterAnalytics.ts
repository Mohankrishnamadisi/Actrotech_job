import { differenceInCalendarDays, endOfMonth, endOfWeek, format, parseISO, startOfMonth, startOfWeek } from 'date-fns';
import { recruiterService, jobService } from '@services/api';
import { listInterviews } from '@services/interviewManagement';
import { messagingService } from '@services/messaging';
import { supabase } from '@services/supabase';
import type { Job } from '@types';

export type TrendGranularity = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface AnalyticsFilters {
  from?: string;
  to?: string;
  jobId?: string;
  location?: string;
  department?: string;
  recruiter?: string;
  experience?: string;
  workMode?: string;
  employmentType?: string;
}

export interface KpiMetric {
  label: string;
  value: number;
  suffix?: string;
  trend?: number;
}

export interface FunnelStage {
  stage: string;
  count: number;
  conversionFromPrev: number;
}

export interface TrendPoint {
  label: string;
  applications: number;
  interviews: number;
  offers: number;
  hires: number;
}

export interface JobPerformanceRow {
  jobId: string;
  jobTitle: string;
  location: string;
  views: number;
  applications: number;
  qualified: number;
  shortlisted: number;
  interviews: number;
  offers: number;
  hires: number;
  conversionRate: number;
  timeToFillDays: number;
  aiScore: number;
}

export interface DistributionPoint {
  label: string;
  value: number;
}

export interface SourceTrendPoint {
  label: string;
  [source: string]: number | string;
}

export interface RecruiterPerformance {
  messagesSent: number;
  averageResponseTimeHours: number;
  interviewFeedbackPending: number;
  offerAcceptanceRate: number;
  candidateResponseRate: number;
  rejectedRate: number;
  hiringSuccess: number;
  recruiterResponseRate: number;
}

export interface TimeMetrics {
  averageTimeToReviewDays: number;
  averageTimeToShortlistDays: number;
  averageTimeToScheduleInterviewDays: number;
  averageTimeToHireDays: number;
  averageOfferAcceptanceTimeDays: number;
}

export interface SalaryInsights {
  averageSalary: number;
  minSalary: number;
  maxSalary: number;
  byLocation: DistributionPoint[];
  byCategory: DistributionPoint[];
  trend: Array<{ label: string; averageSalary: number }>;
}

export interface AiInsight {
  title: string;
  severity: 'info' | 'warning' | 'success';
  summary: string;
  recommendation: string;
}

export interface JobHealthScore {
  jobId: string;
  jobTitle: string;
  score: number;
  rating: 'Excellent' | 'Good' | 'Average' | 'Poor';
  factors: {
    applications: number;
    ctr: number;
    hiringSpeed: number;
    responseTime: number;
    matchScore: number;
    offerAcceptance: number;
  };
}

export interface TeamMemberAnalytics {
  recruiterId: string;
  recruiterName: string;
  applicationsHandled: number;
  interviewsConducted: number;
  offersSent: number;
  hiresCompleted: number;
  averageResponseTimeHours: number;
}

export interface CalendarActivityPoint {
  date: string;
  applications: number;
  interviews: number;
  offers: number;
  hires: number;
}

export interface AnalyticsReportRow {
  date: string;
  jobTitle: string;
  department: string;
  location: string;
  recruiter: string;
  stage: string;
  candidate: string;
  source: string;
  matchScore: number;
  status: string;
}

export interface RecruiterAnalyticsData {
  generatedAt: string;
  kpis: KpiMetric[];
  funnel: FunnelStage[];
  trends: Record<TrendGranularity, TrendPoint[]>;
  jobPerformance: JobPerformanceRow[];
  sourceAnalytics: {
    totals: DistributionPoint[];
    trend: SourceTrendPoint[];
  };
  demographics: {
    experience: DistributionPoint[];
    education: DistributionPoint[];
    location: DistributionPoint[];
    skills: DistributionPoint[];
    workMode: DistributionPoint[];
    employmentType: DistributionPoint[];
  };
  recruiterPerformance: RecruiterPerformance;
  timeMetrics: TimeMetrics;
  salaryInsights: SalaryInsights;
  hiringInsights: AiInsight[];
  jobHealth: JobHealthScore[];
  teamAnalytics: TeamMemberAnalytics[];
  calendarActivity: CalendarActivityPoint[];
  reportRows: AnalyticsReportRow[];
}

type ApplicationRow = {
  id: string;
  job_id: string;
  user_id: string;
  status: string;
  ats_stage?: string | null;
  match_score?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  source?: string | null;
  profiles?: Record<string, unknown> | null;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
};

const SOURCE_KEYS = [
  'Direct',
  'Google',
  'LinkedIn',
  'Referral',
  'Indeed',
  'Naukri',
  'RemoteOK',
  'Company Website',
  'GitHub',
  'Other',
] as const;

const clamp = (value: number, min = 0, max = 100): number => Math.max(min, Math.min(max, value));

const safeDate = (value: unknown): Date | null => {
  if (!value) return null;
  try {
    const parsed = parseISO(String(value));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
};

const safeNumber = (value: unknown): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const average = (values: number[]): number => {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const isInRange = (dateValue: unknown, from?: string, to?: string): boolean => {
  const date = safeDate(dateValue);
  if (!date) return false;

  const fromDate = from ? safeDate(from) : null;
  const toDate = to ? safeDate(to) : null;

  if (fromDate && date < fromDate) return false;
  if (toDate && date > toDate) return false;
  return true;
};

const toSourceLabel = (value: unknown): string => {
  const input = String(value || '').trim().toLowerCase();
  if (!input) return 'Other';

  if (input.includes('google')) return 'Google';
  if (input.includes('linkedin')) return 'LinkedIn';
  if (input.includes('referral') || input.includes('refer')) return 'Referral';
  if (input.includes('indeed')) return 'Indeed';
  if (input.includes('naukri')) return 'Naukri';
  if (input.includes('remoteok') || input.includes('remote ok')) return 'RemoteOK';
  if (input.includes('company') || input.includes('website') || input.includes('career')) return 'Company Website';
  if (input.includes('github')) return 'GitHub';
  if (input.includes('direct')) return 'Direct';
  return 'Other';
};

const getProfileText = (profile: Record<string, unknown> | null | undefined, keys: string[]): string => {
  if (!profile) return '';
  for (const key of keys) {
    const raw = profile[key];
    if (typeof raw === 'string' && raw.trim()) return raw.trim();
  }
  return '';
};

const getProfileArray = (profile: Record<string, unknown> | null | undefined, keys: string[]): string[] => {
  if (!profile) return [];
  for (const key of keys) {
    const raw = profile[key];
    if (Array.isArray(raw)) {
      return raw.map((item) => String(item || '').trim()).filter(Boolean);
    }
    if (typeof raw === 'string' && raw.trim()) {
      return raw
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const bucketizeExperience = (years: number): string => {
  if (years < 1) return '0-1 years';
  if (years < 3) return '1-3 years';
  if (years < 5) return '3-5 years';
  if (years < 8) return '5-8 years';
  return '8+ years';
};

const buildDistribution = (items: string[], top = 10): DistributionPoint[] => {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const key = item.trim();
    if (!key) return;
    map.set(key, (map.get(key) || 0) + 1);
  });

  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([label, value]) => ({ label, value }));
};

const bucketLabel = (date: Date, granularity: TrendGranularity): string => {
  if (granularity === 'daily') return format(date, 'dd MMM');
  if (granularity === 'weekly') {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
    return `${format(start, 'dd MMM')} - ${format(end, 'dd MMM')}`;
  }
  if (granularity === 'monthly') return format(date, 'MMM yyyy');
  return format(date, 'yyyy');
};

const makeTrend = (
  applications: Date[],
  interviews: Date[],
  offers: Date[],
  hires: Date[],
  granularity: TrendGranularity
): TrendPoint[] => {
  const map = new Map<string, TrendPoint>();

  const bump = (date: Date, key: keyof Omit<TrendPoint, 'label'>): void => {
    const label = bucketLabel(date, granularity);
    if (!map.has(label)) {
      map.set(label, { label, applications: 0, interviews: 0, offers: 0, hires: 0 });
    }
    const row = map.get(label);
    if (row) row[key] += 1;
  };

  applications.forEach((date) => bump(date, 'applications'));
  interviews.forEach((date) => bump(date, 'interviews'));
  offers.forEach((date) => bump(date, 'offers'));
  hires.forEach((date) => bump(date, 'hires'));

  return Array.from(map.values());
};

const toReportRows = (
  applications: ApplicationRow[],
  jobsById: Map<string, Job>,
  recruiterName: string
): AnalyticsReportRow[] => applications.map((app) => {
  const profile = app.profiles || {};
  const job = jobsById.get(app.job_id);
  return {
    date: String(app.created_at || app.updated_at || new Date().toISOString()),
    jobTitle: String(job?.title || 'Untitled Job'),
    department: String(job?.category || 'General'),
    location: String(job?.location || getProfileText(profile, ['location']) || 'Unspecified'),
    recruiter: recruiterName,
    stage: String(app.ats_stage || app.status || 'Applied'),
    candidate: getProfileText(profile, ['name', 'full_name']) || `Candidate ${String(app.user_id || '').slice(0, 6).toUpperCase()}`,
    source: toSourceLabel(app.source || getProfileText(profile, ['source'])),
    matchScore: safeNumber(app.match_score),
    status: String(app.status || 'applied'),
  };
});

async function fetchApplicationRows(jobIds: string[]): Promise<ApplicationRow[]> {
  if (jobIds.length === 0) return [];

  // Some environments don't have `source` column in job_applications.
  const primaryQuery = await supabase
    .from('job_applications')
    .select('id,job_id,user_id,status,ats_stage,match_score,created_at,updated_at,source,profiles(*)')
    .in('job_id', jobIds)
    .order('created_at', { ascending: false });

  if (!primaryQuery.error) {
    return (primaryQuery.data || []) as ApplicationRow[];
  }

  const fallbackQuery = await supabase
    .from('job_applications')
    .select('id,job_id,user_id,status,ats_stage,match_score,created_at,updated_at,profiles(*)')
    .in('job_id', jobIds)
    .order('created_at', { ascending: false });

  if (fallbackQuery.error) throw fallbackQuery.error;
  return (fallbackQuery.data || []) as ApplicationRow[];
}

async function fetchMessagesByConversations(conversationIds: string[]): Promise<MessageRow[]> {
  if (conversationIds.length === 0) return [];

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('id,conversation_id,sender_id,receiver_id,content,created_at,is_read')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as MessageRow[];
  } catch {
    // Messaging data is supplementary for analytics; continue without it.
    return [];
  }
}

function calculateResponseMetrics(messages: MessageRow[], recruiterId: string): { averageHours: number; recruiterResponseRate: number; candidateResponseRate: number } {
  if (messages.length === 0) {
    return { averageHours: 0, recruiterResponseRate: 0, candidateResponseRate: 0 };
  }

  const byConversation = new Map<string, MessageRow[]>();
  messages.forEach((message) => {
    const list = byConversation.get(message.conversation_id) || [];
    list.push(message);
    byConversation.set(message.conversation_id, list);
  });

  const responseHours: number[] = [];
  let candidateFirstMessages = 0;
  let recruiterReplies = 0;
  let recruiterFirstMessages = 0;
  let candidateReplies = 0;

  byConversation.forEach((items) => {
    const ordered = [...items].sort((a, b) => {
      const aTime = safeDate(a.created_at)?.getTime() || 0;
      const bTime = safeDate(b.created_at)?.getTime() || 0;
      return aTime - bTime;
    });
    const first = ordered[0];
    if (!first) return;

    if (first.sender_id === recruiterId) recruiterFirstMessages += 1;
    else candidateFirstMessages += 1;

    for (let idx = 1; idx < ordered.length; idx += 1) {
      const prev = ordered[idx - 1];
      const curr = ordered[idx];
      if (prev.sender_id !== recruiterId && curr.sender_id === recruiterId) {
        const prevDate = safeDate(prev.created_at);
        const currDate = safeDate(curr.created_at);
        if (prevDate && currDate) {
          responseHours.push((currDate.getTime() - prevDate.getTime()) / 3600000);
        }
        recruiterReplies += 1;
      }
      if (prev.sender_id === recruiterId && curr.sender_id !== recruiterId) {
        candidateReplies += 1;
      }
    }
  });

  const recruiterResponseRate = candidateFirstMessages > 0
    ? clamp((recruiterReplies / candidateFirstMessages) * 100)
    : 0;

  const candidateResponseRate = recruiterFirstMessages > 0
    ? clamp((candidateReplies / recruiterFirstMessages) * 100)
    : 0;

  return {
    averageHours: Number(average(responseHours).toFixed(1)),
    recruiterResponseRate: Number(recruiterResponseRate.toFixed(1)),
    candidateResponseRate: Number(candidateResponseRate.toFixed(1)),
  };
}

function scoreToRating(score: number): 'Excellent' | 'Good' | 'Average' | 'Poor' {
  if (score >= 80) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 45) return 'Average';
  return 'Poor';
}

function createEmptyAnalyticsData(): RecruiterAnalyticsData {
  return {
    generatedAt: new Date().toISOString(),
    kpis: [
      { label: 'Active Jobs', value: 0 },
      { label: 'Total Applicants', value: 0 },
      { label: 'Qualified Candidates', value: 0 },
      { label: 'Interview Scheduled', value: 0 },
      { label: 'Offers Sent', value: 0 },
      { label: 'Offers Accepted', value: 0 },
      { label: 'Hires', value: 0 },
      { label: 'Rejected', value: 0 },
      { label: 'Time To Hire', value: 0, suffix: ' days' },
      { label: 'Average Match Score', value: 0, suffix: '%' },
      { label: 'Recruiter Response Rate', value: 0, suffix: '%' },
      { label: 'Hiring Success Rate', value: 0, suffix: '%' },
      { label: 'Monthly Hiring Growth', value: 0, suffix: '%' },
    ],
    funnel: [
      { stage: 'Job Views', count: 0, conversionFromPrev: 100 },
      { stage: 'Applications', count: 0, conversionFromPrev: 0 },
      { stage: 'Qualified', count: 0, conversionFromPrev: 0 },
      { stage: 'Shortlisted', count: 0, conversionFromPrev: 0 },
      { stage: 'Interview Scheduled', count: 0, conversionFromPrev: 0 },
      { stage: 'Interview Completed', count: 0, conversionFromPrev: 0 },
      { stage: 'Offer Sent', count: 0, conversionFromPrev: 0 },
      { stage: 'Offer Accepted', count: 0, conversionFromPrev: 0 },
      { stage: 'Hired', count: 0, conversionFromPrev: 0 },
    ],
    trends: {
      daily: [],
      weekly: [],
      monthly: [],
      yearly: [],
    },
    jobPerformance: [],
    sourceAnalytics: {
      totals: SOURCE_KEYS.map((label) => ({ label, value: 0 })),
      trend: [],
    },
    demographics: {
      experience: [],
      education: [],
      location: [],
      skills: [],
      workMode: [],
      employmentType: [],
    },
    recruiterPerformance: {
      messagesSent: 0,
      averageResponseTimeHours: 0,
      interviewFeedbackPending: 0,
      offerAcceptanceRate: 0,
      candidateResponseRate: 0,
      rejectedRate: 0,
      hiringSuccess: 0,
      recruiterResponseRate: 0,
    },
    timeMetrics: {
      averageTimeToReviewDays: 0,
      averageTimeToShortlistDays: 0,
      averageTimeToScheduleInterviewDays: 0,
      averageTimeToHireDays: 0,
      averageOfferAcceptanceTimeDays: 0,
    },
    salaryInsights: {
      averageSalary: 0,
      minSalary: 0,
      maxSalary: 0,
      byLocation: [],
      byCategory: [],
      trend: [],
    },
    hiringInsights: [],
    jobHealth: [],
    teamAnalytics: [],
    calendarActivity: [],
    reportRows: [],
  };
}

export async function getRecruiterAnalyticsData(recruiterId: string, filters: AnalyticsFilters = {}): Promise<RecruiterAnalyticsData> {
  if (!recruiterId) {
    return createEmptyAnalyticsData();
  }

  const safe = async <T,>(loader: Promise<T>, fallback: T): Promise<T> => {
    try {
      return await loader;
    } catch (error) {
      console.warn('Analytics dependency failed, falling back:', error);
      return fallback;
    }
  };

  const [recruiterProfile, jobs, interviews, conversations] = await Promise.all([
    safe(recruiterService.getRecruiterProfile(recruiterId), null as any),
    safe(jobService.getRecruiterJobs(recruiterId), [] as Job[]),
    safe(listInterviews(recruiterId), [] as any[]),
    safe(messagingService.getConversations(recruiterId), [] as any[]),
  ]);

  const jobIds = (jobs || []).map((job) => String(job.id));
  const applicationsRaw = await safe(fetchApplicationRows(jobIds), [] as ApplicationRow[]);

  const jobsById = new Map<string, Job>(jobs.map((job) => [String(job.id), job]));

  const filteredJobs = jobs.filter((job) => {
    if (filters.jobId && String(job.id) !== filters.jobId) return false;
    if (filters.location && String(job.location || '').toLowerCase() !== filters.location.toLowerCase()) return false;
    if (filters.department && String(job.category || '').toLowerCase() !== filters.department.toLowerCase()) return false;
    if (filters.workMode && String(job.work_mode || job.workMode || '').toLowerCase() !== filters.workMode.toLowerCase()) return false;
    if (filters.employmentType && String(job.job_type || job.jobType || '').toLowerCase() !== filters.employmentType.toLowerCase()) return false;
    return true;
  });

  const filteredJobIds = new Set(filteredJobs.map((job) => String(job.id)));

  const applications = applicationsRaw.filter((row) => {
    if (!filteredJobIds.has(String(row.job_id))) return false;
    if (filters.from || filters.to) {
      if (!isInRange(row.created_at || row.updated_at, filters.from, filters.to)) return false;
    }

    const profile = row.profiles || {};
    if (filters.location) {
      const appLocation = getProfileText(profile, ['location']);
      if (appLocation && appLocation.toLowerCase() !== filters.location.toLowerCase()) return false;
    }

    if (filters.experience) {
      const experienceText = getProfileText(profile, ['experience']);
      if (experienceText && !experienceText.toLowerCase().includes(filters.experience.toLowerCase())) return false;
    }

    if (filters.workMode) {
      const mode = getProfileText(profile, ['work_mode', 'preferred_work_mode']);
      if (mode && mode.toLowerCase() !== filters.workMode.toLowerCase()) return false;
    }

    if (filters.employmentType) {
      const type = getProfileText(profile, ['employment_type', 'preferred_employment_type']);
      if (type && type.toLowerCase() !== filters.employmentType.toLowerCase()) return false;
    }

    return true;
  });

  const filteredInterviews = interviews.filter((item) => {
    if (filters.jobId && item.jobId !== filters.jobId) return false;
    if (filters.from || filters.to) {
      const iso = `${item.date}T${item.time || '00:00'}:00`;
      if (!isInRange(iso, filters.from, filters.to)) return false;
    }
    return true;
  });

  const conversationIds = conversations.map((item) => item.id);
  const messages = await fetchMessagesByConversations(conversationIds);

  const responseMetrics = calculateResponseMetrics(messages, recruiterId);

  const activeJobs = filteredJobs.filter((job) => String(job.status || '').toLowerCase() === 'published').length;
  const totalApplicants = applications.length;

  const qualifiedCandidates = applications.filter((app) => {
    const status = String(app.status || '').toLowerCase();
    const stage = String(app.ats_stage || '').toLowerCase();
    return status === 'under_review' || status === 'shortlisted' || status === 'accepted' || stage.includes('screen') || stage.includes('shortlist') || stage.includes('interview') || stage.includes('offer') || stage.includes('hired');
  }).length;

  const interviewsScheduled = filteredInterviews.filter((item) => item.status === 'Scheduled' || item.status === 'Rescheduled').length;
  const interviewsCompleted = filteredInterviews.filter((item) => item.status === 'Completed').length;
  const offersSent = applications.filter((app) => {
    const stage = String(app.ats_stage || '').toLowerCase();
    return stage.includes('offer') || String(app.status || '').toLowerCase() === 'accepted';
  }).length;
  const offersAccepted = applications.filter((app) => String(app.status || '').toLowerCase() === 'accepted').length;
  const hires = applications.filter((app) => String(app.ats_stage || '').toLowerCase() === 'hired').length;
  const rejected = applications.filter((app) => String(app.status || '').toLowerCase() === 'rejected' || String(app.ats_stage || '').toLowerCase() === 'rejected').length;

  const applicationDates = applications
    .map((item) => safeDate(item.created_at || item.updated_at))
    .filter((item): item is Date => Boolean(item));

  const previousRangeFrom = filters.from ? safeDate(filters.from) : startOfMonth(new Date());
  const previousRangeTo = filters.to ? safeDate(filters.to) : endOfMonth(new Date());
  let monthlyGrowth = 0;

  if (previousRangeFrom && previousRangeTo) {
    const daysDiff = Math.max(1, differenceInCalendarDays(previousRangeTo, previousRangeFrom));
    const prevFrom = new Date(previousRangeFrom.getTime() - (daysDiff + 1) * 24 * 60 * 60 * 1000);
    const prevTo = new Date(previousRangeTo.getTime() - (daysDiff + 1) * 24 * 60 * 60 * 1000);

    const currentCount = applicationDates.filter((date) => date >= previousRangeFrom && date <= previousRangeTo).length;
    const prevCount = applicationDates.filter((date) => date >= prevFrom && date <= prevTo).length;
    monthlyGrowth = prevCount > 0 ? Number((((currentCount - prevCount) / prevCount) * 100).toFixed(1)) : currentCount > 0 ? 100 : 0;
  }

  const averageMatchScore = Number(average(applications.map((app) => safeNumber(app.match_score))).toFixed(1));

  const timeToHireValues: number[] = applications
    .filter((app) => String(app.ats_stage || '').toLowerCase() === 'hired')
    .map((app) => {
      const created = safeDate(app.created_at);
      const updated = safeDate(app.updated_at);
      if (!created || !updated) return 0;
      return Math.max(0, differenceInCalendarDays(updated, created));
    })
    .filter((value) => value > 0);

  const averageTimeToHire = Number(average(timeToHireValues).toFixed(1));

  const hiringSuccessRate = totalApplicants > 0 ? Number(((hires / totalApplicants) * 100).toFixed(1)) : 0;

  const kpis: KpiMetric[] = [
    { label: 'Active Jobs', value: activeJobs },
    { label: 'Total Applicants', value: totalApplicants },
    { label: 'Qualified Candidates', value: qualifiedCandidates },
    { label: 'Interview Scheduled', value: interviewsScheduled },
    { label: 'Offers Sent', value: offersSent },
    { label: 'Offers Accepted', value: offersAccepted },
    { label: 'Hires', value: hires },
    { label: 'Rejected', value: rejected },
    { label: 'Time To Hire', value: averageTimeToHire, suffix: ' days' },
    { label: 'Average Match Score', value: averageMatchScore, suffix: '%' },
    { label: 'Recruiter Response Rate', value: responseMetrics.recruiterResponseRate, suffix: '%' },
    { label: 'Hiring Success Rate', value: hiringSuccessRate, suffix: '%' },
    { label: 'Monthly Hiring Growth', value: monthlyGrowth, suffix: '%' },
  ];

  const jobViews = filteredJobs.reduce((sum, job) => {
    const directViews = safeNumber((job as Record<string, unknown>).views || (job as Record<string, unknown>).view_count || (job as Record<string, unknown>).impressions);
    if (directViews > 0) return sum + directViews;
    const appCount = applications.filter((app) => app.job_id === job.id).length;
    return sum + appCount * 6;
  }, 0);

  const shortlisted = applications.filter((app) => String(app.status || '').toLowerCase() === 'shortlisted').length;

  const funnelSteps = [
    { stage: 'Job Views', count: jobViews },
    { stage: 'Applications', count: totalApplicants },
    { stage: 'Qualified', count: qualifiedCandidates },
    { stage: 'Shortlisted', count: shortlisted },
    { stage: 'Interview Scheduled', count: interviewsScheduled },
    { stage: 'Interview Completed', count: interviewsCompleted },
    { stage: 'Offer Sent', count: offersSent },
    { stage: 'Offer Accepted', count: offersAccepted },
    { stage: 'Hired', count: hires },
  ];

  const funnel: FunnelStage[] = funnelSteps.map((step, idx) => {
    if (idx === 0) return { ...step, conversionFromPrev: 100 };
    const previous = funnelSteps[idx - 1].count;
    return {
      ...step,
      conversionFromPrev: previous > 0 ? Number(((step.count / previous) * 100).toFixed(1)) : 0,
    };
  });

  const interviewDates = filteredInterviews
    .map((interview) => safeDate(`${interview.date}T${interview.time || '00:00'}:00`))
    .filter((item): item is Date => Boolean(item));

  const offerDates = applications
    .filter((app) => String(app.ats_stage || '').toLowerCase().includes('offer') || String(app.status || '').toLowerCase() === 'accepted')
    .map((app) => safeDate(app.updated_at || app.created_at))
    .filter((item): item is Date => Boolean(item));

  const hireDates = applications
    .filter((app) => String(app.ats_stage || '').toLowerCase() === 'hired')
    .map((app) => safeDate(app.updated_at || app.created_at))
    .filter((item): item is Date => Boolean(item));

  const trends: Record<TrendGranularity, TrendPoint[]> = {
    daily: makeTrend(applicationDates, interviewDates, offerDates, hireDates, 'daily'),
    weekly: makeTrend(applicationDates, interviewDates, offerDates, hireDates, 'weekly'),
    monthly: makeTrend(applicationDates, interviewDates, offerDates, hireDates, 'monthly'),
    yearly: makeTrend(applicationDates, interviewDates, offerDates, hireDates, 'yearly'),
  };

  const interviewsByJob = new Map<string, number>();
  filteredInterviews.forEach((interview) => {
    interviewsByJob.set(interview.jobId, (interviewsByJob.get(interview.jobId) || 0) + 1);
  });

  const jobPerformance: JobPerformanceRow[] = filteredJobs.map((job) => {
    const jobApps = applications.filter((app) => app.job_id === job.id);
    const appsCount = jobApps.length;
    const qualified = jobApps.filter((app) => {
      const status = String(app.status || '').toLowerCase();
      return status === 'under_review' || status === 'shortlisted' || status === 'accepted';
    }).length;
    const jobShortlisted = jobApps.filter((app) => String(app.status || '').toLowerCase() === 'shortlisted').length;
    const jobInterviews = interviewsByJob.get(String(job.id)) || 0;
    const jobOffers = jobApps.filter((app) => String(app.ats_stage || '').toLowerCase().includes('offer') || String(app.status || '').toLowerCase() === 'accepted').length;
    const jobHires = jobApps.filter((app) => String(app.ats_stage || '').toLowerCase() === 'hired').length;
    const views = safeNumber((job as Record<string, unknown>).views || (job as Record<string, unknown>).view_count || appsCount * 6);
    const conversionRate = views > 0 ? Number(((appsCount / views) * 100).toFixed(1)) : 0;

    const filledRows = jobApps.filter((app) => String(app.ats_stage || '').toLowerCase() === 'hired');
    const fillDays = filledRows.map((app) => {
      const created = safeDate(app.created_at);
      const updated = safeDate(app.updated_at);
      if (!created || !updated) return 0;
      return Math.max(0, differenceInCalendarDays(updated, created));
    }).filter((value) => value > 0);

    const timeToFillDays = Number(average(fillDays).toFixed(1));
    const aiScore = Number((
      clamp(conversionRate * 2.2) * 0.35
      + clamp((jobHires / Math.max(1, appsCount)) * 100) * 0.35
      + clamp(average(jobApps.map((row) => safeNumber(row.match_score)))) * 0.3
    ).toFixed(1));

    return {
      jobId: String(job.id),
      jobTitle: String(job.title || 'Untitled Job'),
      location: String(job.location || 'Unspecified'),
      views,
      applications: appsCount,
      qualified,
      shortlisted: jobShortlisted,
      interviews: jobInterviews,
      offers: jobOffers,
      hires: jobHires,
      conversionRate,
      timeToFillDays,
      aiScore,
    };
  });

  const sourceLabels = applications.map((app) => toSourceLabel(app.source || getProfileText(app.profiles || {}, ['source'])));
  const sourceTotalsMap = new Map<string, number>();
  SOURCE_KEYS.forEach((source) => sourceTotalsMap.set(source, 0));
  sourceLabels.forEach((source) => sourceTotalsMap.set(source, (sourceTotalsMap.get(source) || 0) + 1));

  const sourceAnalyticsTotals = Array.from(sourceTotalsMap.entries()).map(([label, value]) => ({ label, value }));

  const sourceTrendMap = new Map<string, SourceTrendPoint>();
  applications.forEach((app) => {
    const date = safeDate(app.created_at || app.updated_at);
    if (!date) return;
    const monthLabel = format(startOfMonth(date), 'MMM yyyy');
    if (!sourceTrendMap.has(monthLabel)) {
      const base: SourceTrendPoint = { label: monthLabel };
      SOURCE_KEYS.forEach((source) => {
        base[source] = 0;
      });
      sourceTrendMap.set(monthLabel, base);
    }

    const row = sourceTrendMap.get(monthLabel);
    const source = toSourceLabel(app.source || getProfileText(app.profiles || {}, ['source']));
    if (row) {
      row[source] = safeNumber(row[source]) + 1;
    }
  });

  const demographicsExperience: string[] = [];
  const demographicsEducation: string[] = [];
  const demographicsLocation: string[] = [];
  const demographicsSkills: string[] = [];
  const workModes: string[] = [];
  const employmentTypes: string[] = [];

  applications.forEach((app) => {
    const profile = app.profiles || {};

    const years = safeNumber((profile.experience_years as unknown) || (profile.experienceYears as unknown));
    if (years > 0 || years === 0) {
      demographicsExperience.push(bucketizeExperience(years));
    } else {
      const rawExperience = getProfileText(profile, ['experience']);
      if (rawExperience) {
        const match = rawExperience.match(/(\d+)/);
        demographicsExperience.push(bucketizeExperience(match ? safeNumber(match[1]) : 0));
      }
    }

    const edu = getProfileText(profile, ['education_level', 'highest_education']);
    if (edu) demographicsEducation.push(edu);
    const location = getProfileText(profile, ['location']);
    if (location) demographicsLocation.push(location);

    getProfileArray(profile, ['skills']).forEach((skill) => demographicsSkills.push(skill));

    const mode = getProfileText(profile, ['work_mode', 'preferred_work_mode']);
    if (mode) workModes.push(mode);
    const type = getProfileText(profile, ['employment_type', 'preferred_employment_type']);
    if (type) employmentTypes.push(type);
  });

  filteredJobs.forEach((job) => {
    if (job.work_mode || job.workMode) workModes.push(String(job.work_mode || job.workMode));
    if (job.job_type || job.jobType) employmentTypes.push(String(job.job_type || job.jobType));
  });

  const demographics = {
    experience: buildDistribution(demographicsExperience, 8),
    education: buildDistribution(demographicsEducation, 8),
    location: buildDistribution(demographicsLocation, 10),
    skills: buildDistribution(demographicsSkills, 12),
    workMode: buildDistribution(workModes, 6),
    employmentType: buildDistribution(employmentTypes, 6),
  };

  const messagesSent = messages.filter((message) => message.sender_id === recruiterId).length;

  const recruiterPerformance: RecruiterPerformance = {
    messagesSent,
    averageResponseTimeHours: responseMetrics.averageHours,
    interviewFeedbackPending: filteredInterviews.filter((item) => item.status === 'Completed' && !item.feedbackSubmittedAt).length,
    offerAcceptanceRate: offersSent > 0 ? Number(((offersAccepted / offersSent) * 100).toFixed(1)) : 0,
    candidateResponseRate: responseMetrics.candidateResponseRate,
    rejectedRate: totalApplicants > 0 ? Number(((rejected / totalApplicants) * 100).toFixed(1)) : 0,
    hiringSuccess: hiringSuccessRate,
    recruiterResponseRate: responseMetrics.recruiterResponseRate,
  };

  const timeToReview = applications
    .filter((app) => String(app.status || '').toLowerCase() !== 'applied')
    .map((app) => {
      const created = safeDate(app.created_at);
      const updated = safeDate(app.updated_at);
      if (!created || !updated) return 0;
      return Math.max(0, differenceInCalendarDays(updated, created));
    })
    .filter((value) => value > 0);

  const timeToShortlist = applications
    .filter((app) => String(app.status || '').toLowerCase() === 'shortlisted')
    .map((app) => {
      const created = safeDate(app.created_at);
      const updated = safeDate(app.updated_at);
      if (!created || !updated) return 0;
      return Math.max(0, differenceInCalendarDays(updated, created));
    })
    .filter((value) => value > 0);

  const appLookupByCandidateAndJob = new Map<string, ApplicationRow>();
  applications.forEach((app) => {
    appLookupByCandidateAndJob.set(`${app.user_id}::${app.job_id}`, app);
  });

  const timeToSchedule = filteredInterviews
    .map((interview) => {
      const app = appLookupByCandidateAndJob.get(`${interview.candidateId}::${interview.jobId}`);
      if (!app?.created_at) return 0;
      const appDate = safeDate(app.created_at);
      const interviewDate = safeDate(`${interview.date}T${interview.time || '00:00'}:00`);
      if (!appDate || !interviewDate) return 0;
      return Math.max(0, differenceInCalendarDays(interviewDate, appDate));
    })
    .filter((value) => value > 0);

  const offerAcceptanceTimes = applications
    .filter((app) => String(app.status || '').toLowerCase() === 'accepted')
    .map((app) => {
      const created = safeDate(app.created_at);
      const updated = safeDate(app.updated_at);
      if (!created || !updated) return 0;
      return Math.max(0, differenceInCalendarDays(updated, created));
    })
    .filter((value) => value > 0);

  const timeMetrics: TimeMetrics = {
    averageTimeToReviewDays: Number(average(timeToReview).toFixed(1)),
    averageTimeToShortlistDays: Number(average(timeToShortlist).toFixed(1)),
    averageTimeToScheduleInterviewDays: Number(average(timeToSchedule).toFixed(1)),
    averageTimeToHireDays: averageTimeToHire,
    averageOfferAcceptanceTimeDays: Number(average(offerAcceptanceTimes).toFixed(1)),
  };

  const salaryMidpoints = filteredJobs
    .map((job) => {
      const min = safeNumber(job.salaryMin || job.salary_min);
      const max = safeNumber(job.salaryMax || job.salary_max);
      if (min <= 0 && max <= 0) return 0;
      if (min > 0 && max > 0) return (min + max) / 2;
      return min || max;
    })
    .filter((value) => value > 0);

  const salaryByLocation = new Map<string, number[]>();
  const salaryByCategory = new Map<string, number[]>();
  const salaryTrendMap = new Map<string, number[]>();

  filteredJobs.forEach((job) => {
    const min = safeNumber(job.salaryMin || job.salary_min);
    const max = safeNumber(job.salaryMax || job.salary_max);
    const salary = min > 0 && max > 0 ? (min + max) / 2 : min || max;
    if (salary <= 0) return;

    const location = String(job.location || 'Unspecified');
    const category = String(job.category || 'General');
    const date = safeDate(job.createdAt || job.created_at) || new Date();
    const month = format(startOfMonth(date), 'MMM yyyy');

    salaryByLocation.set(location, [...(salaryByLocation.get(location) || []), salary]);
    salaryByCategory.set(category, [...(salaryByCategory.get(category) || []), salary]);
    salaryTrendMap.set(month, [...(salaryTrendMap.get(month) || []), salary]);
  });

  const salaryInsights: SalaryInsights = {
    averageSalary: Number(average(salaryMidpoints).toFixed(0)),
    minSalary: salaryMidpoints.length ? Math.min(...salaryMidpoints) : 0,
    maxSalary: salaryMidpoints.length ? Math.max(...salaryMidpoints) : 0,
    byLocation: Array.from(salaryByLocation.entries()).map(([label, values]) => ({ label, value: Number(average(values).toFixed(0)) })),
    byCategory: Array.from(salaryByCategory.entries()).map(([label, values]) => ({ label, value: Number(average(values).toFixed(0)) })),
    trend: Array.from(salaryTrendMap.entries()).map(([label, values]) => ({ label, averageSalary: Number(average(values).toFixed(0)) })),
  };

  const calendarMap = new Map<string, CalendarActivityPoint>();
  const upsertCalendar = (date: Date, field: 'applications' | 'interviews' | 'offers' | 'hires'): void => {
    const key = format(date, 'yyyy-MM-dd');
    if (!calendarMap.has(key)) {
      calendarMap.set(key, { date: key, applications: 0, interviews: 0, offers: 0, hires: 0 });
    }
    const row = calendarMap.get(key);
    if (row) row[field] += 1;
  };

  applicationDates.forEach((date) => upsertCalendar(date, 'applications'));
  interviewDates.forEach((date) => upsertCalendar(date, 'interviews'));
  offerDates.forEach((date) => upsertCalendar(date, 'offers'));
  hireDates.forEach((date) => upsertCalendar(date, 'hires'));

  const globalOfferAcceptance = offersSent > 0 ? (offersAccepted / offersSent) * 100 : 0;

  const jobHealth: JobHealthScore[] = jobPerformance.map((row) => {
    const ctr = row.views > 0 ? (row.applications / row.views) * 100 : 0;
    const hiringSpeedScore = row.timeToFillDays > 0 ? clamp(100 - (row.timeToFillDays / 60) * 100) : 45;
    const responseTimeScore = clamp(100 - recruiterPerformance.averageResponseTimeHours * 2.5);
    const offerAcceptance = row.offers > 0 ? (row.hires / row.offers) * 100 : globalOfferAcceptance;

    const score = Number((
      clamp(row.applications * 8) * 0.2
      + clamp(ctr * 3) * 0.15
      + hiringSpeedScore * 0.2
      + responseTimeScore * 0.15
      + clamp(row.aiScore) * 0.15
      + clamp(offerAcceptance) * 0.15
    ).toFixed(1));

    return {
      jobId: row.jobId,
      jobTitle: row.jobTitle,
      score,
      rating: scoreToRating(score),
      factors: {
        applications: clamp(row.applications * 8),
        ctr: clamp(ctr * 3),
        hiringSpeed: hiringSpeedScore,
        responseTime: responseTimeScore,
        matchScore: clamp(row.aiScore),
        offerAcceptance: clamp(offerAcceptance),
      },
    };
  });

  let teamAnalytics: TeamMemberAnalytics[] = [];
  try {
    if (recruiterProfile?.company_name) {
      const { data: teamRows, error: teamError } = await supabase
        .from('recruiters')
        .select('id, hr_name, company_name')
        .eq('company_name', String(recruiterProfile.company_name));

      if (!teamError && Array.isArray(teamRows) && teamRows.length > 1) {
        const recruiterIds = teamRows.map((row) => String((row as Record<string, unknown>).id || '')).filter(Boolean);

        const { data: teamJobs, error: teamJobsError } = await supabase
          .from('jobs')
          .select('id, posted_by')
          .in('posted_by', recruiterIds);

        if (!teamJobsError && Array.isArray(teamJobs)) {
          const jobsByRecruiter = new Map<string, string[]>();
          teamJobs.forEach((row) => {
            const owner = String((row as Record<string, unknown>).posted_by || '');
            const jobId = String((row as Record<string, unknown>).id || '');
            if (!owner || !jobId) return;
            jobsByRecruiter.set(owner, [...(jobsByRecruiter.get(owner) || []), jobId]);
          });

          const teamJobIds = teamJobs.map((row) => String((row as Record<string, unknown>).id || '')).filter(Boolean);
          const { data: teamApps, error: teamAppsError } = await supabase
            .from('job_applications')
            .select('job_id, status, ats_stage')
            .in('job_id', teamJobIds);

          if (!teamAppsError) {
            teamAnalytics = teamRows.map((member) => {
              const memberId = String((member as Record<string, unknown>).id || '');
              const memberName = String((member as Record<string, unknown>).hr_name || 'Recruiter');
              const ownedJobs = new Set(jobsByRecruiter.get(memberId) || []);
              const memberApps = (teamApps || []).filter((app) => ownedJobs.has(String((app as Record<string, unknown>).job_id || '')));

              const applicationsHandled = memberApps.length;
              const offers = memberApps.filter((app) => String((app as Record<string, unknown>).ats_stage || '').toLowerCase().includes('offer') || String((app as Record<string, unknown>).status || '').toLowerCase() === 'accepted').length;
              const memberHires = memberApps.filter((app) => String((app as Record<string, unknown>).ats_stage || '').toLowerCase() === 'hired').length;

              return {
                recruiterId: memberId,
                recruiterName: memberName,
                applicationsHandled,
                interviewsConducted: memberId === recruiterId ? filteredInterviews.length : 0,
                offersSent: offers,
                hiresCompleted: memberHires,
                averageResponseTimeHours: memberId === recruiterId ? recruiterPerformance.averageResponseTimeHours : 0,
              };
            }).sort((a, b) => b.hiresCompleted - a.hiresCompleted || b.offersSent - a.offersSent);
          }
        }
      }
    }
  } catch {
    // Team analytics is best-effort and optional.
  }

  const lowApplicationJob = jobPerformance
    .filter((row) => row.views >= 40 && row.applications <= Math.max(1, Math.round(row.views * 0.02)))
    .sort((a, b) => a.applications - b.applications)[0];

  const highQualityJob = jobPerformance
    .sort((a, b) => b.aiScore - a.aiScore)[0];

  const dropAfterInterviewRate = interviewsScheduled > 0
    ? Number((((interviewsScheduled - offersSent) / interviewsScheduled) * 100).toFixed(1))
    : 0;

  const bestSource = sourceAnalyticsTotals
    .slice()
    .sort((a, b) => b.value - a.value)
    .find((item) => item.value > 0);

  const topSkills = demographics.skills.slice(0, 5).map((item) => item.label).join(', ');
  const missingSkills = filteredJobs
    .flatMap((job) => (Array.isArray(job.skills) ? job.skills : []))
    .map((skill) => String(skill || '').trim())
    .filter(Boolean)
    .filter((skill, idx, arr) => arr.indexOf(skill) === idx)
    .filter((skill) => !demographics.skills.some((item) => item.label.toLowerCase() === skill.toLowerCase()))
    .slice(0, 5)
    .join(', ');

  const hiringInsights: AiInsight[] = [
    {
      title: 'Jobs with low application rate',
      severity: lowApplicationJob ? 'warning' : 'info',
      summary: lowApplicationJob
        ? `${lowApplicationJob.jobTitle} has low application conversion (${lowApplicationJob.conversionRate}%).`
        : 'No major low application outliers were detected.',
      recommendation: lowApplicationJob
        ? 'Refresh the title, tighten required skills, and distribute to high-performing channels like LinkedIn and referrals.'
        : 'Maintain current posting strategy and monitor conversion weekly.',
    },
    {
      title: 'Jobs receiving high quality applicants',
      severity: highQualityJob ? 'success' : 'info',
      summary: highQualityJob
        ? `${highQualityJob.jobTitle} leads with AI quality score ${highQualityJob.aiScore}.`
        : 'Insufficient match score data for quality ranking.',
      recommendation: 'Reuse the same job description pattern and screening sequence for underperforming jobs.',
    },
    {
      title: 'Candidates dropping after interview',
      severity: dropAfterInterviewRate > 35 ? 'warning' : 'info',
      summary: `${dropAfterInterviewRate}% of scheduled interviews are not reaching offer stage.`,
      recommendation: 'Shorten feedback turnaround and add interviewer calibration to improve consistency.',
    },
    {
      title: 'Best hiring source',
      severity: 'success',
      summary: bestSource ? `${bestSource.label} contributes the highest pipeline volume.` : 'Source signal is currently limited.',
      recommendation: bestSource
        ? `Increase budget and targeting depth for ${bestSource.label} while keeping source mix diversified.`
        : 'Capture source at application stage for stronger attribution.',
    },
    {
      title: 'Most demanded skills',
      severity: 'info',
      summary: topSkills || 'Skill demand data is limited.',
      recommendation: 'Prioritize these skills in ad copy and skill-based screening questions.',
    },
    {
      title: 'Missing skills',
      severity: missingSkills ? 'warning' : 'info',
      summary: missingSkills || 'Candidate supply matches required skill demand.',
      recommendation: missingSkills
        ? 'Broaden sourcing filters and run targeted outreach for missing skills.'
        : 'Continue current sourcing strategy for skills coverage.',
    },
    {
      title: 'Suggested salary improvement',
      severity: 'info',
      summary: salaryInsights.averageSalary > 0
        ? `Current average salary benchmark is ${salaryInsights.averageSalary.toLocaleString()}.`
        : 'Salary range coverage is incomplete.',
      recommendation: 'Align salary bands by location percentiles and publish min-max ranges for transparency.',
    },
    {
      title: 'Suggested job description improvement',
      severity: 'info',
      summary: 'Some jobs show lower than expected click-to-application conversion.',
      recommendation: 'Use concise outcomes-first opening, explicit growth path, and clear must-have skills list.',
    },
    {
      title: 'Suggested screening questions',
      severity: 'info',
      summary: 'Screening depth can be increased for higher funnel quality.',
      recommendation: 'Add 3 questions: practical task example, domain-specific problem, and communication scenario.',
    },
    {
      title: 'Hiring bottlenecks',
      severity: timeMetrics.averageTimeToScheduleInterviewDays > 5 ? 'warning' : 'info',
      summary: `Average time to schedule interview is ${timeMetrics.averageTimeToScheduleInterviewDays} days.`,
      recommendation: 'Enable interviewer slot templates and auto-reminders to reduce scheduling lag.',
    },
  ];

  const reportRows = toReportRows(applications, jobsById, String(recruiterProfile?.hr_name || 'Recruiter'));

  return {
    generatedAt: new Date().toISOString(),
    kpis,
    funnel,
    trends,
    jobPerformance,
    sourceAnalytics: {
      totals: sourceAnalyticsTotals,
      trend: Array.from(sourceTrendMap.values()),
    },
    demographics,
    recruiterPerformance,
    timeMetrics,
    salaryInsights,
    hiringInsights,
    jobHealth,
    teamAnalytics,
    calendarActivity: Array.from(calendarMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
    reportRows,
  };
}

export function getDefaultFilterWindow(): { from: string; to: string } {
  const now = new Date();
  const from = startOfMonth(now);
  const to = endOfMonth(now);
  return {
    from: format(from, 'yyyy-MM-dd'),
    to: format(to, 'yyyy-MM-dd'),
  };
}

export function getWeeklyWindow(): { from: string; to: string } {
  const now = new Date();
  const from = startOfWeek(now, { weekStartsOn: 1 });
  const to = endOfWeek(now, { weekStartsOn: 1 });
  return {
    from: format(from, 'yyyy-MM-dd'),
    to: format(to, 'yyyy-MM-dd'),
  };
}
