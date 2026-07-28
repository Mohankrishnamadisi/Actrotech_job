import { format, subMonths } from 'date-fns';
import { jobService } from '@services/api';
import { listInterviews } from '@services/interviewManagement';
import { aiHiringAssistantService } from '@services/aiHiringAssistant';
import { automationCenterService } from '@services/automationCenter';
import { employerBrandingService } from '@services/employerBranding';
import { billingSubscriptionService, type PlanId } from '@services/billingSubscription';
import { getRecruiterAnalyticsData } from '@services/recruiterAnalytics';
import { supabase } from '@services/supabase';

export interface MarketFilters {
  country: string;
  state: string;
  city: string;
  industry: string;
  jobCategory: string;
  experience: string;
  salaryRange: string;
  remote: boolean;
  hybrid: boolean;
  onsite: boolean;
}

export interface MarketOverviewKpis {
  marketDemand: number;
  talentAvailability: number;
  averageSalary: number;
  hiringCompetition: number;
  openPositions: number;
  remoteHiringTrend: number;
  averageTimeToHire: number;
  skillDemandScore: number;
  marketHealthScore: number;
}

export interface SalaryInsight {
  minimumSalary: number;
  averageSalary: number;
  maximumSalary: number;
  medianSalary: number;
  salaryTrend: Array<{ month: string; value: number }>;
  salaryGrowthPercent: number;
  salaryComparison: Array<{ label: string; value: number }>;
}

export interface HiringDemandData {
  topHiringCities: Array<{ city: string; jobs: number }>;
  fastestGrowingRoles: Array<{ role: string; growth: number }>;
  mostInDemandSkills: Array<{ skill: string; demand: number }>;
  fastestGrowingTechnologies: Array<{ technology: string; growth: number }>;
  hiringTrend: Array<{ month: string; demand: number }>;
  monthlyGrowth: number;
  yearlyGrowth: number;
}

export interface TalentAvailabilityData {
  candidateAvailability: number;
  experienceDistribution: Array<{ bucket: string; count: number }>;
  noticePeriodDistribution: Array<{ bucket: string; count: number }>;
  immediateJoiners: number;
  remoteCandidates: number;
  hybridCandidates: number;
  onsiteCandidates: number;
}

export interface CompetitionData {
  companiesHiring: Array<{ company: string; openJobs: number; averageSalary: number; hiringSpeedDays: number; competitionLevel: 'Low' | 'Medium' | 'High'; talentCompetitionScore: number }>;
}

export interface SkillIntelligenceData {
  trendingSkills: string[];
  decliningSkills: string[];
  emergingTechnologies: string[];
  mostRequestedSkills: string[];
  mostMissingSkills: string[];
  recommendedSkillsForJob: string[];
}

export interface JobOptimizationResult {
  betterJobTitle: string;
  salaryImprovement: string;
  requiredSkills: string[];
  preferredSkills: string[];
  jobDescriptionImprovements: string[];
  benefitsToAdd: string[];
  applicationDeadlineSuggestion: string;
  remoteWorkRecommendation: string;
  hiringSpeedPredictionDays: number;
  applicationPrediction: number;
}

export interface SupplyDemandData {
  supply: number;
  demand: number;
  gap: number;
  forecast: Array<{ month: string; supply: number; demand: number }>;
}

export interface LocationIntelligenceRow {
  city: string;
  hiringDensity: number;
  averageSalary: number;
  talentAvailability: number;
  competitionLevel: number;
  remoteAdoption: number;
}

export interface HiringForecastData {
  expectedApplications: number;
  hiringDifficulty: 'Low' | 'Medium' | 'High';
  timeToFillDays: number;
  salaryChangesPercent: number;
  skillDemandShift: number;
  recruitmentCost: number;
  hiringSuccessProbability: number;
}

export interface CompetitorInsightRow {
  company: string;
  salaryComparison: number;
  benefitsComparison: string;
  hiringVolume: number;
  hiringTrend: number;
  marketPosition: 'Leader' | 'Challenger' | 'Follower';
}

export interface JobHealthRow {
  jobId: string;
  title: string;
  location: string;
  healthScore: number;
  status: 'Excellent' | 'Good' | 'Average' | 'Poor';
  salaryScore: number;
  descriptionQuality: number;
  requiredSkillsScore: number;
  experienceScore: number;
  locationScore: number;
  applicationRateScore: number;
  hiringSpeedScore: number;
}

export interface MarketAlert {
  id: string;
  type: 'salary_below_market' | 'competition_increased' | 'skill_demand_changed' | 'hiring_trend_changed' | 'market_opportunity';
  message: string;
  createdAt: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export interface DailyBriefing {
  generatedAt: string;
  topHiringTrends: string[];
  topSkills: string[];
  salaryChanges: string[];
  hiringOpportunities: string[];
  recruitmentRisks: string[];
  recommendedActions: string[];
}

export interface PlanAccess {
  planId: PlanId;
  canAccess: boolean;
  message: string;
}

const defaultFilters: MarketFilters = {
  country: 'India',
  state: 'All',
  city: 'All',
  industry: 'All',
  jobCategory: 'All',
  experience: 'All',
  salaryRange: 'All',
  remote: true,
  hybrid: true,
  onsite: true,
};

const seededHash = (text: string): number => {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) % 1000000;
  }
  return hash;
};

const baseSalaryForRole = (title: string): number => {
  const lower = title.toLowerCase();
  if (lower.includes('frontend') || lower.includes('backend') || lower.includes('full stack')) return 1200000;
  if (lower.includes('data') || lower.includes('machine learning') || lower.includes('ai')) return 1800000;
  if (lower.includes('devops') || lower.includes('platform')) return 1700000;
  if (lower.includes('product')) return 1500000;
  if (lower.includes('qa') || lower.includes('test')) return 900000;
  return 1100000;
};

const locationMultiplier = (location: string): number => {
  const lower = location.toLowerCase();
  if (lower.includes('bangalore')) return 1.18;
  if (lower.includes('hyderabad')) return 1.12;
  if (lower.includes('mumbai')) return 1.2;
  if (lower.includes('delhi') || lower.includes('gurgaon') || lower.includes('noida')) return 1.15;
  if (lower.includes('chennai') || lower.includes('pune')) return 1.08;
  if (lower.includes('remote')) return 1.1;
  return 1;
};

const scoreToStatus = (score: number): JobHealthRow['status'] => {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Average';
  return 'Poor';
};

const safeNumber = (value: unknown, fallback = 0): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const monthLabel = (monthsBack: number): string => format(subMonths(new Date(), monthsBack), 'MMM');

const extractSkills = (jobs: any[]): string[] => {
  const bag: string[] = [];
  jobs.forEach((job) => {
    const raw = (job as any).required_skills || (job as any).skills || [];
    if (Array.isArray(raw)) {
      raw.forEach((skill) => bag.push(String(skill).trim()));
      return;
    }
    if (typeof raw === 'string') {
      raw.split(',').forEach((skill) => bag.push(skill.trim()));
    }
  });
  return bag.filter(Boolean);
};

const topCounts = (items: string[], limit: number): Array<{ key: string; count: number }> => {
  const map = new Map<string, number>();
  items.forEach((item) => map.set(item, (map.get(item) || 0) + 1));
  return [...map.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count).slice(0, limit);
};

const ensureFilters = (filters?: Partial<MarketFilters>): MarketFilters => ({ ...defaultFilters, ...(filters || {}) });

const syntheticCompanies = ['TalentSprint Labs', 'Nexora Systems', 'CloudAxis', 'ScaleForge', 'TechMotive', 'DeltaHire'];

const generateId = (prefix: string): string => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const marketIntelligenceService = {
  getPlanAccess(ownerId: string): PlanAccess {
    const sub = billingSubscriptionService.getSubscription(ownerId);
    const allowed = ['professional', 'business', 'enterprise'].includes(sub.planId);
    return {
      planId: sub.planId,
      canAccess: allowed,
      message: allowed
        ? 'Market Intelligence access enabled for your plan.'
        : 'Upgrade to Professional, Business, or Enterprise to access Market Intelligence.',
    };
  },

  async getBaseData(ownerId: string): Promise<{
    jobs: any[];
    applications: Array<Record<string, any>>;
    interviews: Array<Record<string, any>>;
    aiRequests: number;
    automationRuns: number;
    brandScore: number;
    analyticsSignal: number;
  }> {
    const jobs = await jobService.getRecruiterJobs(ownerId).catch(() => []);
    const jobIds = jobs.map((job: any) => String(job.id));

    let applications: Array<Record<string, any>> = [];
    if (jobIds.length > 0) {
      const query = await supabase
        .from('job_applications')
        .select('id, job_id, created_at, status, experience_years, notice_period, work_mode, profiles(location, skills)')
        .in('job_id', jobIds);
      applications = (query.data || []) as Array<Record<string, any>>;
    }

    const [interviews, aiRequests, automationRuns, analyticsData] = await Promise.all([
      listInterviews(ownerId).catch(() => []),
      Promise.resolve(aiHiringAssistantService.listRequestHistory(ownerId).length),
      Promise.resolve(automationCenterService.getExecutions(ownerId).length),
      getRecruiterAnalyticsData(ownerId).catch(() => null),
    ]);

    const brandingProfile = employerBrandingService.getProfile(ownerId, 'Company', 'hr@company.com');
    const brandScore = employerBrandingService.getBrandScore(brandingProfile).score;

    const analyticsSignal = analyticsData
      ? Math.min(20, Math.max(0, Math.round((safeNumber((analyticsData as any)?.summary?.applications) / 10) || 8)))
      : 0;

    return {
      jobs,
      applications,
      interviews,
      aiRequests,
      automationRuns,
      brandScore,
      analyticsSignal,
    };
  },

  async getOverview(ownerId: string, filters?: Partial<MarketFilters>): Promise<MarketOverviewKpis> {
    const safeFilters = ensureFilters(filters);
    const base = await this.getBaseData(ownerId);

    const openPositions = base.jobs.length;
    const candidateVolume = base.applications.length;
    const avgSalary = openPositions === 0
      ? 1200000
      : Math.round(base.jobs.reduce((sum, job) => {
        const explicit = safeNumber((job as any).salary_min) + safeNumber((job as any).salary_max);
        if (explicit > 0) return sum + Math.round(explicit / 2);
        return sum + Math.round(baseSalaryForRole(String((job as any).title || 'Role')) * locationMultiplier(String((job as any).location || 'India')));
      }, 0) / Math.max(1, openPositions));

    const remoteOpenings = base.jobs.filter((job) => String((job as any).work_mode || '').toLowerCase().includes('remote')).length;
    const remoteHiringTrend = openPositions > 0 ? Math.round((remoteOpenings / openPositions) * 100) : 35;

    const avgTimeToHire = base.interviews.length > 0 ? Math.max(18, Math.round(65 - Math.min(30, base.interviews.length / 2))) : 42;

    const skillSet = extractSkills(base.jobs);
    const uniqueSkills = new Set(skillSet.map((skill) => skill.toLowerCase()));
    const skillDemandScore = Math.min(100, Math.round(uniqueSkills.size * 6 + openPositions * 2));

    const marketDemand = Math.min(100, Math.round(openPositions * 8 + candidateVolume * 0.6 + base.aiRequests * 0.3 + base.analyticsSignal));
    const talentAvailability = Math.min(100, Math.round(candidateVolume * 4 + (safeFilters.remote ? 10 : 0) + (safeFilters.hybrid ? 6 : 0)));
    const hiringCompetition = Math.min(100, Math.round(marketDemand * 0.7 + skillDemandScore * 0.3));

    const marketHealthScore = Math.max(35, Math.min(99, Math.round((
      0.24 * marketDemand +
      0.18 * talentAvailability +
      0.14 * (100 - hiringCompetition) +
      0.14 * Math.min(100, base.brandScore) +
      0.15 * Math.min(100, skillDemandScore) +
      0.15 * Math.max(0, 100 - avgTimeToHire)
    ))));

    return {
      marketDemand,
      talentAvailability,
      averageSalary: avgSalary,
      hiringCompetition,
      openPositions,
      remoteHiringTrend,
      averageTimeToHire: avgTimeToHire,
      skillDemandScore,
      marketHealthScore,
    };
  },

  async getSalaryInsights(ownerId: string, query: {
    jobTitle: string;
    location: string;
    experience: string;
    industry: string;
    employmentType: string;
    workMode: string;
  }): Promise<SalaryInsight> {
    const base = await this.getBaseData(ownerId);
    const role = query.jobTitle || base.jobs[0]?.title || 'Software Engineer';
    const location = query.location || base.jobs[0]?.location || 'Bangalore';

    const seed = seededHash(`${role}_${location}_${query.experience}_${query.industry}_${query.employmentType}_${query.workMode}`);
    const baseSalary = Math.round(baseSalaryForRole(String(role)) * locationMultiplier(String(location)));

    const expYears = safeNumber((query.experience || '3').split('-')[0], 3);
    const expMultiplier = 1 + Math.min(0.5, expYears * 0.06);

    const averageSalary = Math.round(baseSalary * expMultiplier + (seed % 120000));
    const minimumSalary = Math.round(averageSalary * 0.75);
    const maximumSalary = Math.round(averageSalary * 1.35);
    const medianSalary = Math.round((minimumSalary + maximumSalary) / 2);

    const salaryTrend = Array.from({ length: 6 }).map((_, idx) => {
      const monthOffset = 5 - idx;
      const growth = 1 + ((idx - 2) * 0.012) + ((seed % 7) * 0.002);
      return {
        month: monthLabel(monthOffset),
        value: Math.round(averageSalary * growth),
      };
    });

    const growthPercent = Math.round(((salaryTrend[5].value - salaryTrend[0].value) / Math.max(1, salaryTrend[0].value)) * 100);

    const salaryComparison = [
      { label: 'Your Listed Salary', value: Math.round(averageSalary * 0.93) },
      { label: 'Market Average', value: averageSalary },
      { label: 'Top Quartile', value: Math.round(averageSalary * 1.18) },
    ];

    return {
      minimumSalary,
      averageSalary,
      maximumSalary,
      medianSalary,
      salaryTrend,
      salaryGrowthPercent: growthPercent,
      salaryComparison,
    };
  },

  async getHiringDemand(ownerId: string): Promise<HiringDemandData> {
    const base = await this.getBaseData(ownerId);
    const cityCounts = topCounts(base.jobs.map((job) => String((job as any).location || 'Unknown')), 6)
      .map((item) => ({ city: item.key, jobs: item.count }));

    const roleCounts = topCounts(base.jobs.map((job) => String((job as any).title || 'Unknown Role')), 5)
      .map((item, idx) => ({ role: item.key, growth: Math.max(6, 24 - idx * 3 + (item.count * 2)) }));

    const skillCounts = topCounts(extractSkills(base.jobs), 8)
      .map((item, idx) => ({ skill: item.key, demand: Math.max(30, 88 - idx * 6) }));

    const technologies = ['GenAI', 'MLOps', 'Kubernetes', 'TypeScript', 'Rust', 'Data Engineering', 'Cybersecurity'];
    const fastestGrowingTechnologies = technologies.map((technology, idx) => ({ technology, growth: 36 - idx * 4 }));

    const baseline = Math.max(20, base.jobs.length * 8 + base.applications.length * 0.5);
    const hiringTrend = Array.from({ length: 6 }).map((_, idx) => ({
      month: monthLabel(5 - idx),
      demand: Math.round(baseline * (0.84 + idx * 0.06)),
    }));

    const monthlyGrowth = Math.round(((hiringTrend[5].demand - hiringTrend[4].demand) / Math.max(1, hiringTrend[4].demand)) * 100);
    const yearlyGrowth = Math.round(monthlyGrowth * 8.5);

    return {
      topHiringCities: cityCounts,
      fastestGrowingRoles: roleCounts,
      mostInDemandSkills: skillCounts,
      fastestGrowingTechnologies,
      hiringTrend,
      monthlyGrowth,
      yearlyGrowth,
    };
  },

  async getTalentAvailability(ownerId: string): Promise<TalentAvailabilityData> {
    const base = await this.getBaseData(ownerId);

    const expDistributionMap = new Map<string, number>([
      ['0-2 years', 0],
      ['3-5 years', 0],
      ['6-9 years', 0],
      ['10+ years', 0],
    ]);
    const noticeMap = new Map<string, number>([
      ['Immediate', 0],
      ['15 Days', 0],
      ['30 Days', 0],
      ['60+ Days', 0],
    ]);

    let immediateJoiners = 0;
    let remoteCandidates = 0;
    let hybridCandidates = 0;
    let onsiteCandidates = 0;

    base.applications.forEach((app) => {
      const years = safeNumber(app.experience_years, 3);
      if (years <= 2) expDistributionMap.set('0-2 years', (expDistributionMap.get('0-2 years') || 0) + 1);
      else if (years <= 5) expDistributionMap.set('3-5 years', (expDistributionMap.get('3-5 years') || 0) + 1);
      else if (years <= 9) expDistributionMap.set('6-9 years', (expDistributionMap.get('6-9 years') || 0) + 1);
      else expDistributionMap.set('10+ years', (expDistributionMap.get('10+ years') || 0) + 1);

      const notice = String(app.notice_period || '').toLowerCase();
      if (notice.includes('immediate') || notice === '0') {
        immediateJoiners += 1;
        noticeMap.set('Immediate', (noticeMap.get('Immediate') || 0) + 1);
      } else if (notice.includes('15')) {
        noticeMap.set('15 Days', (noticeMap.get('15 Days') || 0) + 1);
      } else if (notice.includes('30')) {
        noticeMap.set('30 Days', (noticeMap.get('30 Days') || 0) + 1);
      } else {
        noticeMap.set('60+ Days', (noticeMap.get('60+ Days') || 0) + 1);
      }

      const workMode = String(app.work_mode || '').toLowerCase();
      if (workMode.includes('remote')) remoteCandidates += 1;
      else if (workMode.includes('hybrid')) hybridCandidates += 1;
      else onsiteCandidates += 1;
    });

    const candidateAvailability = Math.round(base.applications.length * 1.15);

    return {
      candidateAvailability,
      experienceDistribution: [...expDistributionMap.entries()].map(([bucket, count]) => ({ bucket, count })),
      noticePeriodDistribution: [...noticeMap.entries()].map(([bucket, count]) => ({ bucket, count })),
      immediateJoiners,
      remoteCandidates,
      hybridCandidates,
      onsiteCandidates,
    };
  },

  async getCompetitionAnalysis(ownerId: string): Promise<CompetitionData> {
    const base = await this.getBaseData(ownerId);
    const roles = topCounts(base.jobs.map((job) => String((job as any).title || 'Role')), 5);

    const companiesHiring = syntheticCompanies.map((company, idx) => {
      const roleImpact = roles[idx % Math.max(1, roles.length)]?.count || 2;
      const openJobs = Math.max(3, roleImpact + idx * 2 + Math.round(base.jobs.length * 0.4));
      const averageSalary = Math.round((1050000 + idx * 110000) * (1 + base.jobs.length * 0.01));
      const hiringSpeedDays = Math.max(18, 42 - idx * 3);
      const score = Math.min(96, 58 + idx * 6 + Math.round(base.applications.length * 0.05));
      const competitionLevel: 'Low' | 'Medium' | 'High' = score > 78 ? 'High' : score > 62 ? 'Medium' : 'Low';
      return {
        company,
        openJobs,
        averageSalary,
        hiringSpeedDays,
        competitionLevel,
        talentCompetitionScore: score,
      };
    });

    return { companiesHiring };
  },

  async getSkillIntelligence(ownerId: string, selectedJobId?: string): Promise<SkillIntelligenceData> {
    const base = await this.getBaseData(ownerId);
    const skills = extractSkills(base.jobs).map((skill) => skill.toLowerCase());
    const top = topCounts(skills, 12).map((item) => item.key);

    const trendingSkills = top.slice(0, 6).map((skill) => skill.replace(/\b\w/g, (c) => c.toUpperCase()));
    const mostRequestedSkills = top.slice(0, 8).map((skill) => skill.replace(/\b\w/g, (c) => c.toUpperCase()));

    const emergingTechnologies = ['Agentic AI', 'LangGraph', 'Edge AI', 'Realtime Analytics', 'RAG Engineering', 'Platform Security'];
    const decliningSkills = ['jQuery', 'Manual ETL', 'SVN', 'Legacy Flash APIs'];

    const selectedJob = base.jobs.find((job) => String((job as any).id) === String(selectedJobId || '')) || base.jobs[0];
    const selectedRaw = selectedJob ? extractSkills([selectedJob]) : [];

    const recommendedSkillsForJob = Array.from(new Set([
      ...selectedRaw,
      ...emergingTechnologies.slice(0, 2),
      'System Design',
      'Observability',
    ])).slice(0, 8);

    const missingSkillsUniverse = ['CI/CD', 'Testing', 'Cloud Architecture', 'Security', 'Communication', 'Data Modeling'];
    const selectedSet = new Set(selectedRaw.map((item) => item.toLowerCase()));
    const mostMissingSkills = missingSkillsUniverse.filter((item) => !selectedSet.has(item.toLowerCase())).slice(0, 6);

    return {
      trendingSkills,
      decliningSkills,
      emergingTechnologies,
      mostRequestedSkills,
      mostMissingSkills,
      recommendedSkillsForJob,
    };
  },

  async optimizeJob(ownerId: string, jobId: string): Promise<JobOptimizationResult> {
    const base = await this.getBaseData(ownerId);
    const job = base.jobs.find((item) => String((item as any).id) === String(jobId)) || base.jobs[0] || { title: 'Software Engineer', location: 'Remote' };

    const title = String((job as any).title || 'Software Engineer');
    const location = String((job as any).location || 'Remote');
    const baselineSalary = baseSalaryForRole(title);

    const betterJobTitle = title.toLowerCase().includes('senior') ? title : `Senior ${title}`;
    const suggestedAvgSalary = Math.round(baselineSalary * locationMultiplier(location) * 1.08);

    const requiredSkills = ['System Design', 'Distributed Systems', 'Problem Solving', 'APIs', 'Testing'];
    const preferredSkills = ['Leadership', 'Product Thinking', 'Mentorship', 'Performance Tuning'];

    return {
      betterJobTitle,
      salaryImprovement: `Consider moving midpoint salary to around INR ${suggestedAvgSalary.toLocaleString('en-IN')} to improve response quality.`,
      requiredSkills,
      preferredSkills,
      jobDescriptionImprovements: [
        'Add role impact metrics and team scope in the first paragraph.',
        'Clarify engineering ownership and success KPIs for first 90 days.',
        'Mention architecture scale and tech stack depth explicitly.',
      ],
      benefitsToAdd: ['Learning budget', 'Flexible hours', 'Home office allowance', 'Quarterly performance bonus'],
      applicationDeadlineSuggestion: 'Set a 21-day deadline with weekly reminder nudges for better conversion.',
      remoteWorkRecommendation: location.toLowerCase().includes('remote')
        ? 'Keep remote policy and add quarterly onsite collaboration cadence.'
        : 'Enable hybrid or remote-friendly options to increase candidate pool by 25-35%.',
      hiringSpeedPredictionDays: Math.max(16, 48 - Math.round(base.applications.length * 0.3)),
      applicationPrediction: Math.max(20, Math.round(base.jobs.length * 16 + base.applications.length * 0.55)),
    };
  },

  async getSupplyDemand(ownerId: string): Promise<SupplyDemandData> {
    const base = await this.getBaseData(ownerId);
    const demand = Math.max(1, base.jobs.length * 30);
    const supply = Math.max(1, base.applications.length * 12);
    const gap = supply - demand;

    const forecast = Array.from({ length: 6 }).map((_, idx) => ({
      month: monthLabel(5 - idx),
      supply: Math.round(supply * (0.9 + idx * 0.05)),
      demand: Math.round(demand * (0.94 + idx * 0.06)),
    }));

    return { supply, demand, gap, forecast };
  },

  async getLocationIntelligence(ownerId: string): Promise<LocationIntelligenceRow[]> {
    const base = await this.getBaseData(ownerId);
    const cities = topCounts(base.jobs.map((job) => String((job as any).location || 'Unknown')), 8);

    return cities.map((city, idx) => {
      const salary = Math.round((baseSalaryForRole(base.jobs[idx % Math.max(1, base.jobs.length)]?.title || 'Engineer')) * locationMultiplier(city.key));
      const hiringDensity = Math.min(100, city.count * 14 + 20);
      const talentAvailability = Math.min(100, Math.round(base.applications.length / Math.max(1, cities.length) * 2.2 + 20));
      const competitionLevel = Math.min(100, 45 + city.count * 8 + idx * 3);
      const remoteAdoption = Math.min(100, 25 + idx * 7 + Math.round(base.jobs.filter((job) => String((job as any).work_mode || '').toLowerCase().includes('remote')).length * 4));

      return {
        city: city.key,
        hiringDensity,
        averageSalary: salary,
        talentAvailability,
        competitionLevel,
        remoteAdoption,
      };
    });
  },

  async getHiringForecast(ownerId: string): Promise<HiringForecastData> {
    const base = await this.getBaseData(ownerId);

    const expectedApplications = Math.max(15, Math.round(base.jobs.length * 22 + base.aiRequests * 0.4));
    const hiringDifficultyScore = Math.round(base.jobs.length * 3 + Math.max(0, 50 - base.applications.length));
    const hiringDifficulty: HiringForecastData['hiringDifficulty'] = hiringDifficultyScore > 70 ? 'High' : hiringDifficultyScore > 45 ? 'Medium' : 'Low';
    const timeToFillDays = Math.max(18, 55 - Math.round(base.applications.length * 0.35));
    const salaryChangesPercent = Math.round(4 + base.jobs.length * 0.8);
    const skillDemandShift = Math.min(100, Math.round(extractSkills(base.jobs).length * 2.5 + 30));
    const recruitmentCost = Math.round(base.jobs.length * 85000 + base.aiRequests * 140 + base.automationRuns * 90);
    const hiringSuccessProbability = Math.max(20, Math.min(95, Math.round(52 + base.applications.length * 0.7 - timeToFillDays * 0.25 + base.brandScore * 0.08)));

    return {
      expectedApplications,
      hiringDifficulty,
      timeToFillDays,
      salaryChangesPercent,
      skillDemandShift,
      recruitmentCost,
      hiringSuccessProbability,
    };
  },

  async getCompetitorInsights(ownerId: string): Promise<CompetitorInsightRow[]> {
    const competition = await this.getCompetitionAnalysis(ownerId);

    return competition.companiesHiring.map((company, idx) => ({
      company: company.company,
      salaryComparison: Math.round((company.averageSalary / 1200000) * 100),
      benefitsComparison: idx % 2 === 0 ? 'Strong benefits stack' : 'Basic benefits',
      hiringVolume: company.openJobs,
      hiringTrend: Math.max(5, 24 - idx * 2),
      marketPosition: idx < 2 ? 'Leader' : idx < 4 ? 'Challenger' : 'Follower',
    }));
  },

  async getJobHealthAnalysis(ownerId: string): Promise<JobHealthRow[]> {
    const base = await this.getBaseData(ownerId);
    const applicationsByJob = new Map<string, number>();
    base.applications.forEach((item) => {
      const key = String(item.job_id || '');
      applicationsByJob.set(key, (applicationsByJob.get(key) || 0) + 1);
    });

    return base.jobs.map((job: any) => {
      const salaryScore = Math.min(100, Math.round((safeNumber(job.salary_max, baseSalaryForRole(job.title)) / baseSalaryForRole(job.title || 'Engineer')) * 70));
      const descriptionQuality = Math.min(100, 45 + String(job.description || '').length / 22);
      const requiredSkillsScore = Math.min(100, extractSkills([job]).length * 12 + 35);
      const experienceScore = Math.min(100, safeNumber(job.experience_years, 3) * 12 + 30);
      const locationScore = Math.min(100, 50 + locationMultiplier(String(job.location || '')) * 28);
      const appRate = applicationsByJob.get(String(job.id)) || 0;
      const applicationRateScore = Math.min(100, 32 + appRate * 8);
      const hiringSpeedScore = Math.min(100, 58 + (base.interviews.length / Math.max(1, base.jobs.length)) * 6);

      const healthScore = Math.round((
        salaryScore * 0.16 +
        descriptionQuality * 0.17 +
        requiredSkillsScore * 0.16 +
        experienceScore * 0.1 +
        locationScore * 0.11 +
        applicationRateScore * 0.16 +
        hiringSpeedScore * 0.14
      ));

      return {
        jobId: String(job.id),
        title: String(job.title || 'Untitled Job'),
        location: String(job.location || 'Unknown'),
        healthScore,
        status: scoreToStatus(healthScore),
        salaryScore,
        descriptionQuality,
        requiredSkillsScore,
        experienceScore,
        locationScore,
        applicationRateScore,
        hiringSpeedScore,
      };
    });
  },

  async getAiRecommendations(ownerId: string, jobId: string): Promise<string[]> {
    const [healthRows, skills, forecast] = await Promise.all([
      this.getJobHealthAnalysis(ownerId),
      this.getSkillIntelligence(ownerId, jobId),
      this.getHiringForecast(ownerId),
    ]);

    const targetJob = healthRows.find((item) => item.jobId === jobId) || healthRows[0];
    const recommendations: string[] = [];

    if (targetJob && targetJob.salaryScore < 68) recommendations.push('Increase salary band to align with market median for this role.');
    if (targetJob && targetJob.experienceScore < 55) recommendations.push('Reduce required experience to widen candidate pipeline and improve conversion.');
    if (skills.mostMissingSkills.length > 0) recommendations.push(`Add missing skills: ${skills.mostMissingSkills.slice(0, 3).join(', ')}.`);
    recommendations.push('Improve benefits with remote allowance and annual learning budget.');
    recommendations.push('Rewrite job description with outcome-focused role scope and growth path.');
    recommendations.push('Enable remote or hybrid work mode to expand market reach.');
    recommendations.push('Target high-availability cities from location intelligence and promote strategically.');
    if (forecast.hiringDifficulty === 'High') recommendations.push('Promote job for 7-14 days to improve visibility against competition.');

    return recommendations.slice(0, 8);
  },

  async getIndustryReport(ownerId: string, industry: string): Promise<string> {
    const [overview, demand, talent, forecast] = await Promise.all([
      this.getOverview(ownerId, { industry }),
      this.getHiringDemand(ownerId),
      this.getTalentAvailability(ownerId),
      this.getHiringForecast(ownerId),
    ]);

    return [
      `# ${industry} Market Intelligence Report`,
      '',
      `- Market Demand: ${overview.marketDemand}`,
      `- Talent Availability: ${overview.talentAvailability}`,
      `- Average Salary: INR ${overview.averageSalary.toLocaleString('en-IN')}`,
      `- Hiring Competition: ${overview.hiringCompetition}`,
      `- Monthly Growth: ${demand.monthlyGrowth}%`,
      `- Yearly Growth: ${demand.yearlyGrowth}%`,
      `- Immediate Joiners: ${talent.immediateJoiners}`,
      `- Hiring Success Probability: ${forecast.hiringSuccessProbability}%`,
      '',
      '## Top Hiring Cities',
      ...demand.topHiringCities.map((row) => `- ${row.city}: ${row.jobs} open roles`),
    ].join('\n');
  },

  async getExecutiveReport(ownerId: string, type: 'hiring_market' | 'salary_benchmark' | 'skill_trend' | 'competition' | 'location', formatType: 'pdf' | 'excel' | 'csv'): Promise<{ fileName: string; content: string }> {
    const [overview, salary, demand, skill, competition, location] = await Promise.all([
      this.getOverview(ownerId),
      this.getSalaryInsights(ownerId, {
        jobTitle: 'Software Engineer',
        location: 'Bangalore',
        experience: '3-5',
        industry: 'IT',
        employmentType: 'Full-time',
        workMode: 'Hybrid',
      }),
      this.getHiringDemand(ownerId),
      this.getSkillIntelligence(ownerId),
      this.getCompetitionAnalysis(ownerId),
      this.getLocationIntelligence(ownerId),
    ]);

    const titleMap: Record<string, string> = {
      hiring_market: 'Hiring Market Report',
      salary_benchmark: 'Salary Benchmark Report',
      skill_trend: 'Skill Trend Report',
      competition: 'Competition Report',
      location: 'Location Report',
    };

    const lines = [
      `# ${titleMap[type]}`,
      `Format: ${formatType.toUpperCase()}`,
      `Generated At: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`,
      '',
      `Market Demand: ${overview.marketDemand}`,
      `Average Salary: ${salary.averageSalary}`,
      `Top City: ${demand.topHiringCities[0]?.city || '-'}`,
      `Top Skill: ${skill.trendingSkills[0] || '-'}`,
      `Top Competitor: ${competition.companiesHiring[0]?.company || '-'}`,
      `Top Location Intelligence: ${location[0]?.city || '-'}`,
    ];

    return {
      fileName: `${type}_report.${formatType === 'excel' ? 'xlsx' : formatType === 'pdf' ? 'pdf' : 'csv'}`,
      content: lines.join('\n'),
    };
  },

  async getAlerts(ownerId: string): Promise<MarketAlert[]> {
    const [overview, demand, forecast] = await Promise.all([
      this.getOverview(ownerId),
      this.getHiringDemand(ownerId),
      this.getHiringForecast(ownerId),
    ]);

    const alerts: MarketAlert[] = [];

    if (overview.averageSalary < 900000) {
      alerts.push({
        id: generateId('alert'),
        type: 'salary_below_market',
        message: 'Your salary range is below market for key roles. Consider revising salary bands.',
        createdAt: new Date().toISOString(),
        severity: 'warning',
      });
    }

    if (overview.hiringCompetition > 72) {
      alerts.push({
        id: generateId('alert'),
        type: 'competition_increased',
        message: 'Hiring competition is increasing in top cities. Accelerate outreach and job promotion.',
        createdAt: new Date().toISOString(),
        severity: 'error',
      });
    }

    if (demand.mostInDemandSkills.length > 0) {
      alerts.push({
        id: generateId('alert'),
        type: 'skill_demand_changed',
        message: `Skill demand changed: ${demand.mostInDemandSkills[0].skill} is trending strongly.`,
        createdAt: new Date().toISOString(),
        severity: 'info',
      });
    }

    alerts.push({
      id: generateId('alert'),
      type: 'hiring_trend_changed',
      message: `Hiring trend updated: monthly growth is ${demand.monthlyGrowth}% and yearly growth is ${demand.yearlyGrowth}%.`,
      createdAt: new Date().toISOString(),
      severity: 'info',
    });

    if (forecast.hiringSuccessProbability >= 75) {
      alerts.push({
        id: generateId('alert'),
        type: 'market_opportunity',
        message: 'Market opportunity detected with high hiring success probability. Scale campaigns now.',
        createdAt: new Date().toISOString(),
        severity: 'success',
      });
    }

    return alerts;
  },

  async getDailyBriefing(ownerId: string): Promise<DailyBriefing> {
    const [demand, skill, forecast, overview] = await Promise.all([
      this.getHiringDemand(ownerId),
      this.getSkillIntelligence(ownerId),
      this.getHiringForecast(ownerId),
      this.getOverview(ownerId),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      topHiringTrends: [
        `Hiring demand in ${demand.topHiringCities[0]?.city || 'key cities'} grew by ${demand.monthlyGrowth}% this month.`,
        `${demand.fastestGrowingRoles[0]?.role || 'Core engineering roles'} are growing fastest.`,
      ],
      topSkills: skill.trendingSkills.slice(0, 5),
      salaryChanges: [
        `Average salary shift expected: +${forecast.salaryChangesPercent}%`,
        `Current market average salary: INR ${overview.averageSalary.toLocaleString('en-IN')}`,
      ],
      hiringOpportunities: [
        'Increase remote-friendly postings to tap broader talent pools.',
        'Promote jobs in top 2 demand cities for faster conversions.',
      ],
      recruitmentRisks: [
        forecast.hiringDifficulty === 'High'
          ? 'Hiring difficulty is high; refine JD and compensation quickly.'
          : 'Monitor skill inflation in top-demand technologies.',
        'Competition is actively increasing in specialized skill segments.',
      ],
      recommendedActions: [
        'Increase salary by 8-12% for hard-to-fill roles.',
        'Add 2-3 missing skills and simplify must-have criteria.',
        'Trigger automation-based candidate follow-up within 24 hours.',
      ],
    };
  },
};
