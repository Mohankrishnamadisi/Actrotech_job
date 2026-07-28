import { format } from 'date-fns';

export type ReportPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'powerpoint';

export interface ExecutiveKpis {
  organizations: number;
  recruiters: number;
  candidates: number;
  jobs: number;
  applications: number;
  interviews: number;
  offers: number;
  hires: number;
  revenue: number;
  mrr: number;
  arr: number;
  platformGrowth: number;
  userRetention: number;
  churnRate: number;
  aiUsage: number;
  assessmentUsage: number;
  referralGrowth: number;
}

export interface TrendPoint {
  label: string;
  value: number;
}

export interface BusinessIntelligenceData {
  charts: Array<{ title: string; type: 'line' | 'bar' | 'area' | 'pie'; data: TrendPoint[] }>;
  pivotRows: Array<{ metric: string; enterprise: number; growth: number; variance: number }>;
  heatMap: Array<{ segment: string; intensity: number }>;
  geoMap: Array<{ region: string; value: number }>;
  funnels: Array<{ stage: string; users: number }>;
  cohorts: Array<{ cohort: string; retention30d: number; retention90d: number }>;
}

export interface WarehouseArchitecture {
  centralizedStorage: string;
  historicalSnapshots: string;
  factTables: string[];
  dimensionTables: string[];
  dataPartitioning: string;
  retentionPolicies: string;
  refreshSchedule: string;
  scaleStrategy: string;
}

export interface ExecutiveAssistantResponse {
  query: string;
  summary: string;
  narrative: string[];
  chart: Array<{ label: string; value: number }>;
}

export interface AlertItem {
  id: string;
  type: 'revenue_drop' | 'hiring_slowdown' | 'application_drop' | 'ai_failure' | 'system_health' | 'subscription_churn' | 'security_event';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  createdAt: string;
  acknowledged: boolean;
}

export interface ScheduledReport {
  id: string;
  name: string;
  reportType: 'ceo' | 'chro' | 'recruitment' | 'finance' | 'operations' | 'board';
  cadence: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients: string[];
  enabled: boolean;
  createdAt: string;
}

interface CustomReportTemplate {
  id: string;
  name: string;
  fields: string[];
  filters: string[];
  chartType: 'line' | 'bar' | 'area' | 'pie';
  groupBy: string;
  createdAt: string;
}

interface StoreModel {
  scheduledReports: ScheduledReport[];
  templates: CustomReportTemplate[];
  alerts: AlertItem[];
}

const STORAGE_KEY = 'actro_executive_intelligence_v1';

const makeId = (prefix: string): string => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const seedStore = (): StoreModel => ({
  scheduledReports: [
    {
      id: makeId('sched'),
      name: 'CEO Weekly Executive Digest',
      reportType: 'ceo',
      cadence: 'weekly',
      recipients: ['ceo@actro.com', 'coo@actro.com'],
      enabled: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: makeId('sched'),
      name: 'Finance Monthly Revenue Report',
      reportType: 'finance',
      cadence: 'monthly',
      recipients: ['finance@actro.com'],
      enabled: true,
      createdAt: new Date().toISOString(),
    },
  ],
  templates: [
    {
      id: makeId('tpl'),
      name: 'Executive Hiring Funnel Template',
      fields: ['organization', 'jobs', 'applications', 'interviews', 'offers', 'hires'],
      filters: ['period:last_6_months', 'industry:all'],
      chartType: 'bar',
      groupBy: 'organization',
      createdAt: new Date().toISOString(),
    },
  ],
  alerts: [
    {
      id: makeId('alert'),
      type: 'revenue_drop',
      severity: 'high',
      message: 'Revenue decreased by 8.2% week-over-week across enterprise segment.',
      createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      acknowledged: false,
    },
    {
      id: makeId('alert'),
      type: 'ai_failure',
      severity: 'critical',
      message: 'AI ranking worker latency crossed 2.4s threshold in EU cluster.',
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      acknowledged: false,
    },
    {
      id: makeId('alert'),
      type: 'subscription_churn',
      severity: 'medium',
      message: 'SMB churn rose to 3.1% this month. Review retention workflows.',
      createdAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
      acknowledged: false,
    },
  ],
});

const readStore = (): StoreModel => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedStore();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as StoreModel;
  } catch {
    const seeded = seedStore();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
};

const writeStore = (store: StoreModel): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

class ExecutiveIntelligenceService {
  getExecutiveKpis(): ExecutiveKpis {
    return {
      organizations: 1280,
      recruiters: 24980,
      candidates: 2920000,
      jobs: 428000,
      applications: 9140000,
      interviews: 780000,
      offers: 183000,
      hires: 142000,
      revenue: 52750000,
      mrr: 4200000,
      arr: 50400000,
      platformGrowth: 24.8,
      userRetention: 91.4,
      churnRate: 2.6,
      aiUsage: 378000,
      assessmentUsage: 241000,
      referralGrowth: 17.9,
    };
  }

  getBusinessIntelligence(): BusinessIntelligenceData {
    return {
      charts: [
        {
          title: 'Platform Growth Trend',
          type: 'line',
          data: Array.from({ length: 12 }).map((_, idx) => ({ label: format(new Date(2026, idx, 1), 'MMM'), value: 65 + idx * 7 })),
        },
        {
          title: 'Applications Funnel Velocity',
          type: 'area',
          data: [
            { label: 'Applied', value: 1000000 },
            { label: 'Screened', value: 640000 },
            { label: 'Interviewed', value: 262000 },
            { label: 'Offered', value: 69000 },
            { label: 'Hired', value: 51000 },
          ],
        },
      ],
      pivotRows: [
        { metric: 'Revenue', enterprise: 4200000, growth: 14.8, variance: 5.4 },
        { metric: 'Hires', enterprise: 142000, growth: 11.2, variance: 3.1 },
        { metric: 'AI Usage', enterprise: 378000, growth: 21.3, variance: 7.2 },
      ],
      heatMap: [
        { segment: 'Enterprise Hiring', intensity: 86 },
        { segment: 'SMB Growth', intensity: 71 },
        { segment: 'Referral Conversions', intensity: 64 },
        { segment: 'Assessment Completions', intensity: 77 },
      ],
      geoMap: [
        { region: 'India', value: 294000 },
        { region: 'US', value: 248000 },
        { region: 'Europe', value: 172000 },
        { region: 'Middle East', value: 98000 },
      ],
      funnels: [
        { stage: 'Jobs Posted', users: 100000 },
        { stage: 'Applications', users: 640000 },
        { stage: 'Interviewed', users: 184000 },
        { stage: 'Offers', users: 47000 },
        { stage: 'Hires', users: 36200 },
      ],
      cohorts: [
        { cohort: 'Jan 2026', retention30d: 92, retention90d: 85 },
        { cohort: 'Feb 2026', retention30d: 93, retention90d: 86 },
        { cohort: 'Mar 2026', retention30d: 94, retention90d: 87 },
      ],
    };
  }

  getWarehouseArchitecture(): WarehouseArchitecture {
    return {
      centralizedStorage: 'Multi-tenant lakehouse with organization-level namespaces and row-level isolation.',
      historicalSnapshots: 'Daily and monthly snapshots with SCD Type 2 support for historical trend traceability.',
      factTables: ['fact_applications', 'fact_interviews', 'fact_hires', 'fact_revenue', 'fact_ai_usage'],
      dimensionTables: ['dim_organization', 'dim_recruiter', 'dim_candidate', 'dim_job', 'dim_time', 'dim_location'],
      dataPartitioning: 'Partitioned by tenant_id, event_date, and workload type; clustered for high-cardinality dimensions.',
      retentionPolicies: 'Hot storage 180 days, warm storage 2 years, cold archival 7 years with GDPR purge workflows.',
      refreshSchedule: 'Near-real-time streaming plus hourly batch compaction and nightly warehouse optimization.',
      scaleStrategy: 'Columnar storage, query federation, materialized views, and pre-aggregations for million+ record analysis.',
    };
  }

  getHiringIntelligence() {
    return {
      timeToHireDays: 24.2,
      timeToInterviewDays: 7.4,
      offerAcceptanceRate: 68.5,
      hiringFunnel: [
        { stage: 'Applied', value: 100 },
        { stage: 'Shortlisted', value: 42 },
        { stage: 'Interviewed', value: 21 },
        { stage: 'Offered', value: 8 },
        { stage: 'Hired', value: 6 },
      ],
      recruiterProductivity: 81.3,
      departmentHiring: [
        { department: 'Engineering', hires: 4800 },
        { department: 'Sales', hires: 3250 },
        { department: 'Operations', hires: 2380 },
      ],
      locationHiring: [
        { location: 'Bengaluru', hires: 2210 },
        { location: 'Hyderabad', hires: 1870 },
        { location: 'Chennai', hires: 1310 },
      ],
      sourceEffectiveness: [
        { source: 'Referrals', conversion: 18.3 },
        { source: 'LinkedIn', conversion: 10.8 },
        { source: 'Career Portal', conversion: 12.4 },
      ],
    };
  }

  getCandidateIntelligence() {
    return {
      candidateGrowth: 18.9,
      skillTrends: ['Generative AI', 'Cloud Security', 'MLOps', 'Data Engineering', 'Prompt Engineering'],
      resumeQualityScore: 78.2,
      assessmentPerformance: 74.6,
      interviewSuccessRate: 42.8,
      offerAcceptance: 69.1,
      retentionPrediction: 84.3,
    };
  }

  getRecruiterIntelligence() {
    return {
      recruiterProductivity: 81.3,
      averageResponseTimeHours: 3.8,
      hiringSuccessRate: 62.4,
      interviewSuccess: 44.2,
      candidateEngagement: 73.5,
      topRecruiters: [
        { name: 'Aparna R', hires: 143 },
        { name: 'Vivek S', hires: 137 },
        { name: 'Neha K', hires: 132 },
      ],
    };
  }

  getOrganizationIntelligence() {
    return {
      growthRate: 24.8,
      hiringTrends: 'Steady quarter-over-quarter expansion with enterprise acceleration in technical hiring.',
      subscriptionUsage: 88.4,
      storageUsageTb: 742,
      aiUsage: 378000,
      recruiterActivity: 91.2,
      departmentPerformance: [
        { department: 'Engineering', score: 90 },
        { department: 'Sales', score: 84 },
        { department: 'Operations', score: 79 },
      ],
    };
  }

  getRevenueIntelligence() {
    return {
      revenueTrends: Array.from({ length: 12 }).map((_, idx) => ({ label: format(new Date(2026, idx, 1), 'MMM'), value: 3000000 + idx * 130000 })),
      subscriptionGrowth: 16.7,
      creditsPurchased: 1380000,
      paymentSuccess: 98.7,
      refunds: 1.3,
      topPayingOrganizations: [
        { organization: 'Apex Corp', revenue: 920000 },
        { organization: 'Lumen Global', revenue: 810000 },
        { organization: 'Nexa Group', revenue: 760000 },
      ],
      revenueForecast: 59400000,
    };
  }

  getAiInsights() {
    return {
      hiringBottlenecks: ['Interview slot unavailability in engineering roles', 'Offer processing delays in APAC region'],
      recruitmentTrends: ['Referral-driven hiring rising 17%', 'AI-assisted screening improved 12%'],
      topSkills: ['GenAI', 'Cloud Security', 'Data Engineering', 'Full Stack React', 'Product Analytics'],
      emergingTechnologies: ['Agentic AI', 'LLMOps', 'Vector Databases', 'Cyber Resilience', 'Edge AI'],
      demandForecast: 'Demand for AI/ML and cyber security roles expected to grow 26% in next 2 quarters.',
      talentShortageAlerts: ['Senior MLOps engineers in Tier-1 cities', 'Staff-level cyber security architects'],
      recruiterRecommendations: ['Increase referral incentives for hard-to-fill roles', 'Automate round-1 screening for non-critical roles'],
      candidateRecommendations: ['Upskill in cloud-native AI', 'Build portfolio projects around agent workflows'],
    };
  }

  getPredictiveAnalytics() {
    return {
      hiringDemand: 21.2,
      candidateAvailability: 14.6,
      subscriptionGrowth: 16.7,
      revenueGrowth: 19.3,
      assessmentSuccess: 72.1,
      recruiterWorkload: 78.4,
      hiringTimelineDays: 22.8,
    };
  }

  getMarketIntelligence() {
    return {
      industryHiringTrends: 'FinTech, HealthTech and AI SaaS are leading in hiring demand.',
      salaryTrends: 'Senior engineering compensation up 11% YoY in metro regions.',
      technologyDemand: ['GenAI', 'MLOps', 'Data Platform', 'Cloud Native', 'DevSecOps'],
      remoteHiring: 48.2,
      regionalHiring: [
        { region: 'South India', index: 84 },
        { region: 'North India', index: 72 },
        { region: 'West India', index: 79 },
      ],
      companyHiringActivity: [
        { segment: 'Enterprise', activity: 92 },
        { segment: 'Mid-Market', activity: 76 },
        { segment: 'SMB', activity: 61 },
      ],
    };
  }

  generateExecutiveReport(reportType: 'ceo' | 'chro' | 'recruitment' | 'finance' | 'operations' | 'board', period: ReportPeriod): string {
    const kpis = this.getExecutiveKpis();
    return [
      `# ${reportType.toUpperCase()} ${period.toUpperCase()} REPORT`,
      `Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
      `Organizations: ${kpis.organizations}`,
      `Recruiters: ${kpis.recruiters}`,
      `Candidates: ${kpis.candidates}`,
      `Hires: ${kpis.hires}`,
      `MRR: ${kpis.mrr}`,
      `ARR: ${kpis.arr}`,
      `Retention: ${kpis.userRetention}%`,
      `Churn: ${kpis.churnRate}%`,
    ].join('\n');
  }

  createCustomReportTemplate(name: string, fields: string[], filters: string[], chartType: CustomReportTemplate['chartType'], groupBy: string): CustomReportTemplate {
    const store = readStore();
    const template: CustomReportTemplate = {
      id: makeId('tpl'),
      name,
      fields,
      filters,
      chartType,
      groupBy,
      createdAt: new Date().toISOString(),
    };
    writeStore({ ...store, templates: [template, ...store.templates] });
    return template;
  }

  listCustomReportTemplates(): CustomReportTemplate[] {
    return readStore().templates;
  }

  scheduleReport(name: string, reportType: ScheduledReport['reportType'], cadence: ScheduledReport['cadence'], recipients: string[]): ScheduledReport {
    const store = readStore();
    const row: ScheduledReport = {
      id: makeId('sched'),
      name,
      reportType,
      cadence,
      recipients,
      enabled: true,
      createdAt: new Date().toISOString(),
    };
    writeStore({ ...store, scheduledReports: [row, ...store.scheduledReports] });
    return row;
  }

  listScheduledReports(): ScheduledReport[] {
    return readStore().scheduledReports;
  }

  toggleScheduledReport(id: string): ScheduledReport | null {
    const store = readStore();
    const found = store.scheduledReports.find((item) => item.id === id);
    if (!found) return null;
    const updated = { ...found, enabled: !found.enabled };
    writeStore({
      ...store,
      scheduledReports: [updated, ...store.scheduledReports.filter((item) => item.id !== id)],
    });
    return updated;
  }

  getRealtimeMonitoring() {
    return {
      liveKpis: true,
      activeUsers: 12430,
      jobsPosted: 1492,
      applicationsReceived: 38210,
      interviewStatus: 'Healthy',
      queueHealth: 'Stable',
      apiHealth: '99.98% uptime',
      aiWorkerStatus: 'Operational',
    };
  }

  getDataQualityDashboard() {
    return {
      missingData: 0.9,
      duplicateRecords: 0.3,
      failedJobs: 2,
      importErrors: 7,
      validationErrors: 13,
      dataFreshnessMinutes: 8,
    };
  }

  askExecutiveAssistant(query: string): ExecutiveAssistantResponse {
    const lower = query.toLowerCase();

    if (lower.includes('hiring trend')) {
      return {
        query,
        summary: 'Hiring trend shows steady growth with a temporary dip in May and rebound in June.',
        narrative: [
          'Total hiring is up 14.6% over the last six months.',
          'Engineering and sales are the major contributors to growth.',
          'Referral-based hiring improved conversion by 3.8 percentage points.',
        ],
        chart: [
          { label: 'Jan', value: 9800 },
          { label: 'Feb', value: 10420 },
          { label: 'Mar', value: 11110 },
          { label: 'Apr', value: 11830 },
          { label: 'May', value: 10900 },
          { label: 'Jun', value: 12140 },
        ],
      };
    }

    if (lower.includes('recruiter') && lower.includes('most')) {
      return {
        query,
        summary: 'Aparna R is the top recruiter for hires in the current quarter.',
        narrative: [
          'Aparna R closed 143 candidates this quarter.',
          'Average time-to-hire for Aparna is 18.4 days versus platform average of 24.2 days.',
          'Candidate engagement score for top recruiters remains above 80.',
        ],
        chart: [
          { label: 'Aparna R', value: 143 },
          { label: 'Vivek S', value: 137 },
          { label: 'Neha K', value: 132 },
        ],
      };
    }

    if (lower.includes('predict') && lower.includes('hiring')) {
      return {
        query,
        summary: 'Next month hiring is projected to increase by around 9.2%.',
        narrative: [
          'Forecast confidence interval: 7.1% to 11.4%.',
          'Key drivers are enterprise demand and new assessment adoption.',
          'Potential risk: interview panel bottleneck in specialized roles.',
        ],
        chart: [
          { label: 'Current', value: 12140 },
          { label: 'Forecast', value: 13256 },
        ],
      };
    }

    if (lower.includes('skills') && lower.includes('growing')) {
      return {
        query,
        summary: 'Generative AI and cloud security are the fastest growing skill clusters.',
        narrative: [
          'GenAI keyword frequency rose 37% in job descriptions.',
          'Cloud security skills rose 24% in candidate searches.',
          'MLOps adoption increased in both product and platform teams.',
        ],
        chart: [
          { label: 'Generative AI', value: 37 },
          { label: 'Cloud Security', value: 24 },
          { label: 'MLOps', value: 19 },
        ],
      };
    }

    return {
      query,
      summary: 'Hiring slowed due to interview capacity and delayed approvals in enterprise accounts.',
      narrative: [
        'Interview-to-offer cycle time increased by 2.1 days this month.',
        'Hiring manager approvals took 18% longer in two high-volume departments.',
        'Recommendation: increase panel capacity and auto-reminders for approvals.',
      ],
      chart: [
        { label: 'Approval Delay', value: 18 },
        { label: 'Panel Overload', value: 22 },
        { label: 'Offer Delay', value: 14 },
      ],
    };
  }

  listAlerts(): AlertItem[] {
    return readStore().alerts;
  }

  acknowledgeAlert(id: string): AlertItem | null {
    const store = readStore();
    const found = store.alerts.find((item) => item.id === id);
    if (!found) return null;
    const updated = { ...found, acknowledged: true };
    writeStore({ ...store, alerts: [updated, ...store.alerts.filter((item) => item.id !== id)] });
    return updated;
  }

  getBenchmarking() {
    return {
      organizations: [
        { name: 'Apex Corp', score: 91 },
        { name: 'Nexa Systems', score: 86 },
        { name: 'Lumen Global', score: 84 },
      ],
      departments: [
        { name: 'Engineering', score: 90 },
        { name: 'Sales', score: 84 },
        { name: 'Operations', score: 79 },
      ],
      recruiters: [
        { name: 'Aparna R', score: 95 },
        { name: 'Vivek S', score: 93 },
        { name: 'Neha K', score: 90 },
      ],
      locations: [
        { name: 'Bengaluru', score: 89 },
        { name: 'Hyderabad', score: 84 },
        { name: 'Chennai', score: 81 },
      ],
      industries: [
        { name: 'FinTech', score: 92 },
        { name: 'HealthTech', score: 86 },
        { name: 'SaaS', score: 88 },
      ],
      periods: ['Last 30 days', 'Last Quarter', 'Last Year'],
    };
  }

  export(content: string, formatKind: ExportFormat): string {
    if (formatKind === 'csv') {
      return content
        .split('\n')
        .map((line) => `"${line.replace(/"/g, '""')}"`)
        .join('\n');
    }
    if (formatKind === 'excel') {
      return `EXCEL_EXPORT\n${content}`;
    }
    if (formatKind === 'powerpoint') {
      return `POWERPOINT_EXPORT\n${content}`;
    }
    return `PDF_EXPORT\n${content}`;
  }

  getPermissions() {
    return {
      platformOwner: 'Global governance over warehouse, AI intelligence and executive reporting.',
      executive: 'Access executive dashboards, AI assistant, KPI monitoring and benchmarking.',
      finance: 'Access revenue intelligence, payment analytics, forecasts and finance reports.',
      operations: 'Access operations KPIs, queue health, data quality and system monitoring.',
      hrDirector: 'Access hiring/candidate/recruiter intelligence and workforce planning.',
      superAdmin: 'Manage platform-wide policies, tenancy, permissions and scheduled reporting.',
    };
  }
}

export const executiveIntelligenceService = new ExecutiveIntelligenceService();
