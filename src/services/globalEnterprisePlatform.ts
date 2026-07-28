import { format } from 'date-fns';

export type SupportedCurrency = 'USD' | 'EUR' | 'GBP' | 'INR' | 'AUD' | 'CAD' | 'SGD' | 'AED' | 'JPY';

export interface GlobalDashboardKpis {
  countriesSupported: number;
  organizationsByCountry: Array<{ country: string; organizations: number }>;
  usersByRegion: Array<{ region: string; users: number }>;
  jobsByRegion: Array<{ region: string; jobs: number }>;
  revenueByCountry: Array<{ country: string; revenue: number; currency: SupportedCurrency }>;
  regionalGrowth: Array<{ region: string; growth: number }>;
  globalHiringTrends: Array<{ month: string; hires: number }>;
  platformHealth: {
    uptime: string;
    latencyMs: number;
    apiAvailability: string;
    aiWorkers: string;
  };
}

export interface LocalizationArchitecture {
  supportedLanguages: string[];
  rtlLanguages: string[];
  dynamicTranslation: string;
  localizedEmails: string;
  localizedNotifications: string;
  localizedCareerPages: string;
  expansionStrategy: string;
}

export interface RegionalSetting {
  country: string;
  dateFormat: string;
  phoneFormat: string;
  addressFormat: string;
  postalCodeFormat: string;
  language: string;
  currency: SupportedCurrency;
  timezone: string;
}

export interface ComplianceFramework {
  name: 'GDPR' | 'CCPA' | 'India DPDP' | 'SOC 2' | 'ISO 27001';
  status: 'ready' | 'in_progress' | 'planned';
  controls: string[];
}

export interface GlobalAlert {
  id: string;
  type: 'compliance' | 'security' | 'performance' | 'billing' | 'regional';
  severity: 'low' | 'medium' | 'high' | 'critical';
  region: string;
  message: string;
  timestamp: string;
}

interface StoreModel {
  regionalSettings: RegionalSetting[];
  alerts: GlobalAlert[];
}

const STORAGE_KEY = 'actro_global_enterprise_v1';

const makeId = (prefix: string): string => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const defaultRegionalSettings: RegionalSetting[] = [
  {
    country: 'United States',
    dateFormat: 'MM/DD/YYYY',
    phoneFormat: '+1 (XXX) XXX-XXXX',
    addressFormat: 'Street, City, State, ZIP',
    postalCodeFormat: 'XXXXX',
    language: 'English',
    currency: 'USD',
    timezone: 'America/New_York',
  },
  {
    country: 'India',
    dateFormat: 'DD/MM/YYYY',
    phoneFormat: '+91 XXXXX-XXXXX',
    addressFormat: 'House, Street, Area, City, PIN',
    postalCodeFormat: 'XXXXXX',
    language: 'English',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
  },
  {
    country: 'Germany',
    dateFormat: 'DD.MM.YYYY',
    phoneFormat: '+49 XXXX XXXXXXX',
    addressFormat: 'Street HouseNumber, PostalCode City',
    postalCodeFormat: 'XXXXX',
    language: 'German',
    currency: 'EUR',
    timezone: 'Europe/Berlin',
  },
];

const seedStore = (): StoreModel => ({
  regionalSettings: defaultRegionalSettings,
  alerts: [
    {
      id: makeId('alert'),
      type: 'compliance',
      severity: 'high',
      region: 'EU',
      message: 'GDPR consent banner completion dropped below 94% threshold.',
      timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    },
    {
      id: makeId('alert'),
      type: 'performance',
      severity: 'medium',
      region: 'APAC',
      message: 'Edge latency increased to 230ms for image-heavy career pages.',
      timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
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

class GlobalEnterprisePlatformService {
  getGlobalDashboard(): GlobalDashboardKpis {
    return {
      countriesSupported: 48,
      organizationsByCountry: [
        { country: 'India', organizations: 420 },
        { country: 'United States', organizations: 310 },
        { country: 'Germany', organizations: 145 },
        { country: 'UAE', organizations: 102 },
        { country: 'Japan', organizations: 88 },
      ],
      usersByRegion: [
        { region: 'APAC', users: 1620000 },
        { region: 'North America', users: 1040000 },
        { region: 'Europe', users: 780000 },
        { region: 'Middle East', users: 390000 },
      ],
      jobsByRegion: [
        { region: 'APAC', jobs: 189000 },
        { region: 'North America', jobs: 121000 },
        { region: 'Europe', jobs: 97000 },
        { region: 'Middle East', jobs: 51000 },
      ],
      revenueByCountry: [
        { country: 'United States', revenue: 14800000, currency: 'USD' },
        { country: 'India', revenue: 620000000, currency: 'INR' },
        { country: 'Germany', revenue: 5200000, currency: 'EUR' },
        { country: 'UAE', revenue: 9100000, currency: 'AED' },
      ],
      regionalGrowth: [
        { region: 'APAC', growth: 26.2 },
        { region: 'North America', growth: 18.1 },
        { region: 'Europe', growth: 21.4 },
        { region: 'Middle East', growth: 29.7 },
      ],
      globalHiringTrends: Array.from({ length: 12 }).map((_, idx) => ({
        month: format(new Date(2026, idx, 1), 'MMM'),
        hires: 9200 + idx * 540,
      })),
      platformHealth: {
        uptime: '99.98%',
        latencyMs: 142,
        apiAvailability: '99.99%',
        aiWorkers: 'Healthy',
      },
    };
  }

  getLocalizationArchitecture(): LocalizationArchitecture {
    return {
      supportedLanguages: [
        'English',
        'Telugu',
        'Hindi',
        'Tamil',
        'Kannada',
        'Malayalam',
        'French',
        'German',
        'Spanish',
        'Portuguese',
        'Japanese',
        'Korean',
        'Chinese',
        'Arabic',
      ],
      rtlLanguages: ['Arabic'],
      dynamicTranslation: 'Namespace-driven i18n loader with per-region override dictionaries and fallback chain.',
      localizedEmails: 'Template catalog mapped by locale, compliance profile and brand tone.',
      localizedNotifications: 'Locale-aware notification renderer with timezone delivery windows.',
      localizedCareerPages: 'SEO-ready regional routes with translated schema metadata and country-specific content blocks.',
      expansionStrategy: 'Future language expansion via pluggable locale packs and managed translation pipeline.',
    };
  }

  getMultiCurrencySupport() {
    return {
      currencies: ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'SGD', 'AED', 'JPY'] as SupportedCurrency[],
      formatting: 'Intl.NumberFormat with locale and currency bindings at organization/user preference level.',
    };
  }

  getTimeZoneSupport() {
    return {
      userTimeZoneDetection: 'Browser Intl API + profile fallback + regional override.',
      interviewScheduling: 'Timezone-safe slots with conversion and daylight-saving adjustments.',
      jobDeadlines: 'Deadlines normalized in UTC and rendered by viewer timezone.',
      notifications: 'Delivery windows and quiet hours enforced per region.',
      calendarEvents: 'ICS and calendar payloads generated in user locale/timezone.',
      reports: 'Scheduled reports triggered in local business hours per recipient region.',
    };
  }

  listRegionalSettings(): RegionalSetting[] {
    return readStore().regionalSettings;
  }

  updateRegionalSetting(country: string, patch: Partial<RegionalSetting>): RegionalSetting | null {
    const store = readStore();
    const found = store.regionalSettings.find((item) => item.country === country);
    if (!found) return null;
    const updated = { ...found, ...patch, country: found.country };
    writeStore({
      ...store,
      regionalSettings: [updated, ...store.regionalSettings.filter((item) => item.country !== country)],
    });
    return updated;
  }

  getComplianceCenter(): ComplianceFramework[] {
    return [
      {
        name: 'GDPR',
        status: 'ready',
        controls: ['Consent Management', 'Data Subject Access', 'Right to Erasure', 'Data Processing Register'],
      },
      {
        name: 'CCPA',
        status: 'ready',
        controls: ['Do Not Sell Controls', 'Consumer Data Access', 'Deletion Workflows'],
      },
      {
        name: 'India DPDP',
        status: 'in_progress',
        controls: ['Purpose Limitation', 'Consent Tracking', 'Breach Response Governance'],
      },
      {
        name: 'SOC 2',
        status: 'ready',
        controls: ['Security Controls', 'Availability Controls', 'Audit Logging'],
      },
      {
        name: 'ISO 27001',
        status: 'in_progress',
        controls: ['ISMS Mapping', 'Risk Register', 'Control Evidence Library'],
      },
    ];
  }

  getRegionalDataManagement() {
    return {
      regionalStorage: 'Data residency with region-specific storage policies and tenant pinning.',
      backupStrategy: 'Incremental backup every 15 minutes with daily full snapshots.',
      disasterRecovery: 'Active-passive multi-region failover with RPO < 15m and RTO < 30m.',
      dataRetentionPolicies: 'Configurable retention by compliance regime and organization tier.',
    };
  }

  getHiringLocalization() {
    return {
      employmentTypes: ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'],
      noticePeriods: ['Immediate', '15 days', '30 days', '60 days', '90 days'],
      salaryStructures: ['Annual CTC', 'Monthly Gross', 'Hourly Rate', 'Project Fixed'],
      workAuthorization: 'Country-specific right-to-work capture with expiry and document checks.',
      visaSponsorship: 'Regional visa sponsorship matrix integrated into job eligibility filters.',
      taxFields: ['PAN', 'TIN', 'VAT ID', 'SSN Last4', 'National Insurance Number'],
      educationLevels: ['High School', 'Diploma', 'Bachelor', 'Master', 'Doctorate'],
    };
  }

  getGlobalJobDistribution() {
    return {
      regionalCareerPages: true,
      partnerPlatforms: ['LinkedIn', 'Indeed', 'Naukri', 'StepStone', 'Seek'],
      apis: 'Partner publish API with regional payload transformers.',
      rssFeeds: 'Country-specific job RSS feeds with localized schema fields.',
    };
  }

  getGlobalSearch() {
    return {
      countries: true,
      languages: true,
      currencies: true,
      regions: true,
      architecture: 'Federated global search index with locale analyzers and currency normalization.',
    };
  }

  getInternationalBilling() {
    return {
      countryTaxes: 'Tax engine with VAT/GST/sales tax mapping per jurisdiction.',
      invoices: 'Localized invoice templates with legal metadata per country.',
      taxIds: ['GSTIN', 'VAT ID', 'EIN', 'TRN', 'ABN'],
      regionalPaymentMethods: ['Cards', 'UPI', 'SEPA', 'Bank Transfer', 'Wallets'],
    };
  }

  getRegionalPaymentGateways() {
    return {
      integrations: ['Stripe', 'PayPal', 'Razorpay', 'Adyen', 'Regional Providers'],
      orchestration: 'Payment gateway router based on country, currency, risk and cost optimization.',
    };
  }

  getGlobalAnalytics() {
    return {
      regionalHiring: [
        { region: 'APAC', score: 88 },
        { region: 'North America', score: 76 },
        { region: 'Europe', score: 81 },
      ],
      salaryTrends: [
        { country: 'India', trend: 9.2 },
        { country: 'US', trend: 6.4 },
        { country: 'Germany', trend: 5.8 },
      ],
      demandByCountry: [
        { country: 'India', demand: 91 },
        { country: 'US', demand: 86 },
        { country: 'UAE', demand: 78 },
      ],
      recruiterPerformance: [
        { region: 'APAC', performance: 84 },
        { region: 'NA', performance: 79 },
        { region: 'EU', performance: 82 },
      ],
      candidateGrowth: [
        { region: 'APAC', growth: 21.6 },
        { region: 'NA', growth: 14.1 },
        { region: 'EU', growth: 16.9 },
      ],
      revenueByRegion: [
        { region: 'APAC', revenue: 18800000 },
        { region: 'NA', revenue: 16500000 },
        { region: 'EU', revenue: 11200000 },
      ],
    };
  }

  getAiLocalization() {
    return {
      localizedJobDescriptions: true,
      localizedInterviewQuestions: true,
      localizedEmails: true,
      localizedNotifications: true,
      localizedResumeSuggestions: true,
      strategy: 'Prompt templates with locale-aware style and legal/cultural rule packs.',
    };
  }

  getGlobalNotifications() {
    return {
      email: true,
      sms: true,
      push: true,
      timezoneAwareDelivery: true,
      deliveryArchitecture: 'Regional queue workers + preferred channel and quiet-hour policies.',
    };
  }

  getGlobalSecurity() {
    return {
      regionalAccessPolicies: 'Geo and role-driven access policies by tenant and region.',
      countryRestrictions: 'Policy rules for embargo and region lock as required.',
      ipRestrictions: 'Allow/deny lists with adaptive risk scoring.',
      mfa: 'Mandatory MFA for global admins and high-risk operations.',
      securityMonitoring: '24/7 SIEM with region-aware threat detection and incident routing.',
    };
  }

  getDisasterRecovery() {
    return {
      automaticBackup: true,
      multiRegionDeployment: true,
      healthChecks: 'Continuous regional health probes and synthetic user monitoring.',
      failoverStrategy: 'Automated failover using weighted traffic shift and warm standby.',
      businessContinuity: 'Documented BCP playbooks with quarterly DR drills.',
    };
  }

  getPerformanceOptimization() {
    return {
      globalCdn: true,
      imageOptimization: true,
      caching: true,
      edgeDelivery: true,
      lazyLoading: true,
      compression: true,
      architecture: 'CDN edge cache + origin shielding + Brotli compression + route-level lazy bundles.',
    };
  }

  getEnterpriseSupport() {
    return {
      support247: true,
      supportTickets: true,
      prioritySlas: ['P1 15m', 'P2 1h', 'P3 4h', 'P4 24h'],
      knowledgeBase: true,
      statusPage: true,
    };
  }

  generateGlobalReport(type: 'regional' | 'country' | 'executive' | 'compliance' | 'revenue'): string {
    const now = format(new Date(), 'yyyy-MM-dd HH:mm');
    return [
      `# GLOBAL ${type.toUpperCase()} REPORT`,
      `Generated: ${now}`,
      'Regions Covered: APAC, North America, Europe, Middle East',
      'Deployment Readiness: Multi-region active with compliance baselines',
      'Platform Health: 99.98% uptime',
      'Action Items: Optimize EU latency, complete DPDP control automation',
    ].join('\n');
  }

  getPermissions() {
    return {
      platformOwner: 'Owns global strategy, deployment policies, and cross-region governance.',
      globalAdmin: 'Manages worldwide configuration, localization, and infrastructure controls.',
      regionalAdmin: 'Manages settings, compliance overlays, and operations within assigned region.',
      organizationAdmin: 'Configures tenant-level localization, billing, and access controls.',
      support: 'Handles global support tickets, SLAs, and operational escalations.',
      complianceOfficer: 'Oversees GDPR/CCPA/DPDP/SOC2/ISO policies and audits.',
      finance: 'Manages taxes, invoices, payment providers, and regional revenue controls.',
    };
  }

  listAlerts(): GlobalAlert[] {
    return readStore().alerts;
  }

  resolveAlert(id: string): GlobalAlert | null {
    const store = readStore();
    const found = store.alerts.find((item) => item.id === id);
    if (!found) return null;
    const resolved: GlobalAlert = {
      ...found,
      message: `${found.message} [Resolved]`,
    };
    writeStore({
      ...store,
      alerts: [resolved, ...store.alerts.filter((item) => item.id !== id)],
    });
    return resolved;
  }

  formatCurrency(amount: number, currency: SupportedCurrency, locale = 'en-US'): string {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  }
}

export const globalEnterprisePlatformService = new GlobalEnterprisePlatformService();
