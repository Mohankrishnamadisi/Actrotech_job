import { format } from 'date-fns';

export type CareerSectionKey =
  | 'hero'
  | 'about'
  | 'benefits'
  | 'culture'
  | 'gallery'
  | 'leadership'
  | 'open_positions'
  | 'testimonials'
  | 'awards'
  | 'faq'
  | 'contact'
  | 'custom_html'
  | 'cta';

export interface BrandingLocation {
  id: string;
  country: string;
  state: string;
  city: string;
  address: string;
  mapsLink: string;
  remoteHiring: boolean;
  hybridHiring: boolean;
}

export interface BrandingBenefit {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

export interface BrandingGalleryItem {
  id: string;
  type: 'image' | 'video';
  title: string;
  url: string;
  category: string;
}

export interface BrandingLeader {
  id: string;
  photo: string;
  name: string;
  role: string;
  bio: string;
  linkedIn: string;
}

export interface BrandingTestimonial {
  id: string;
  photo: string;
  name: string;
  role: string;
  department: string;
  experience: string;
  rating: number;
  videoUrl: string;
}

export interface BrandingAward {
  id: string;
  title: string;
  issuer: string;
  year: string;
  description: string;
}

export interface BrandingFaq {
  id: string;
  question: string;
  answer: string;
}

export interface BrandingTheme {
  primaryColor: string;
  secondaryColor: string;
  buttonStyle: 'rounded' | 'pill' | 'square';
  fontFamily: string;
  cardStyle: 'flat' | 'elevated' | 'outlined';
  borderRadius: number;
  mode: 'light' | 'dark';
}

export interface BrandingSeo {
  pageTitle: string;
  metaDescription: string;
  keywords: string;
  ogImage: string;
  slug: string;
  canonicalUrl: string;
}

export interface BrandingAnalytics {
  careerPageViews: number;
  uniqueVisitors: number;
  jobClicks: number;
  applications: number;
  trafficSources: Record<string, number>;
  popularJobs: Array<{ jobId: string; title: string; clicks: number }>;
  averageTimeOnPageSec: number;
  followerCount: number;
}

export interface EmployerBrandingProfile {
  recruiterId: string;
  companyName: string;
  logo: string;
  coverBanner: string;
  tagline: string;
  industry: string;
  companySize: string;
  foundedYear: string;
  headquarters: string;
  website: string;
  linkedIn: string;
  twitter: string;
  facebook: string;
  instagram: string;
  youtube: string;
  companyEmail: string;
  supportEmail: string;
  phoneNumber: string;
  mission: string;
  vision: string;
  coreValues: string;
  story: string;
  leadershipMessage: string;
  locations: BrandingLocation[];
  benefits: BrandingBenefit[];
  gallery: BrandingGalleryItem[];
  workCulture: string;
  engineeringCulture: string;
  designCulture: string;
  managementStyle: string;
  learningEnvironment: string;
  employeeGrowth: string;
  diversityAndInclusion: string;
  leadershipTeam: BrandingLeader[];
  testimonials: BrandingTestimonial[];
  awards: BrandingAward[];
  faqs: BrandingFaq[];
  recruitmentEmail: string;
  hrContact: string;
  officeAddress: string;
  mapLink: string;
  sectionOrder: CareerSectionKey[];
  sectionEnabled: Record<CareerSectionKey, boolean>;
  customHtml: string;
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButtonLabel: string;
  ctaButtonLink: string;
  theme: BrandingTheme;
  seo: BrandingSeo;
  published: boolean;
  companyAdmins: string[];
  analytics: BrandingAnalytics;
  createdAt: string;
  updatedAt: string;
}

interface EmployerBrandingStore {
  profiles: EmployerBrandingProfile[];
  visits: Array<{ slug: string; visitorId: string; source: string; at: string; durationSec?: number }>;
}

const STORAGE_KEY = 'actro_employer_branding_v1';

const DEFAULT_SECTIONS: CareerSectionKey[] = [
  'hero',
  'about',
  'benefits',
  'culture',
  'gallery',
  'leadership',
  'open_positions',
  'testimonials',
  'awards',
  'faq',
  'contact',
  'cta',
];

const SECTION_LABELS: Record<CareerSectionKey, string> = {
  hero: 'Hero Banner',
  about: 'About Company',
  benefits: 'Benefits',
  culture: 'Culture',
  gallery: 'Gallery',
  leadership: 'Leadership',
  open_positions: 'Open Positions',
  testimonials: 'Testimonials',
  awards: 'Awards',
  faq: 'FAQ',
  contact: 'Contact',
  custom_html: 'Custom HTML Block',
  cta: 'CTA Banner',
};

const makeId = (prefix: string): string => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const safeParse = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const readStore = (): EmployerBrandingStore =>
  safeParse<EmployerBrandingStore>(localStorage.getItem(STORAGE_KEY), { profiles: [], visits: [] });

const writeStore = (store: EmployerBrandingStore): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

const normalizeSlug = (value: string): string =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const defaultProfile = (recruiterId: string, recruiterName = 'Company', recruiterEmail = ''): EmployerBrandingProfile => {
  const slug = normalizeSlug(recruiterName || `company-${recruiterId.slice(0, 6)}`);
  const now = new Date().toISOString();
  const sectionEnabled = DEFAULT_SECTIONS.reduce<Record<CareerSectionKey, boolean>>((acc, key) => {
    acc[key] = true;
    return acc;
  }, {
    custom_html: false,
    hero: true,
    about: true,
    benefits: true,
    culture: true,
    gallery: true,
    leadership: true,
    open_positions: true,
    testimonials: true,
    awards: true,
    faq: true,
    contact: true,
    cta: true,
  });

  return {
    recruiterId,
    companyName: recruiterName,
    logo: '',
    coverBanner: '',
    tagline: 'Build your future with us',
    industry: '',
    companySize: '',
    foundedYear: '',
    headquarters: '',
    website: '',
    linkedIn: '',
    twitter: '',
    facebook: '',
    instagram: '',
    youtube: '',
    companyEmail: recruiterEmail,
    supportEmail: '',
    phoneNumber: '',
    mission: '',
    vision: '',
    coreValues: '',
    story: '',
    leadershipMessage: '',
    locations: [],
    benefits: [],
    gallery: [],
    workCulture: '',
    engineeringCulture: '',
    designCulture: '',
    managementStyle: '',
    learningEnvironment: '',
    employeeGrowth: '',
    diversityAndInclusion: '',
    leadershipTeam: [],
    testimonials: [],
    awards: [],
    faqs: [],
    recruitmentEmail: recruiterEmail,
    hrContact: '',
    officeAddress: '',
    mapLink: '',
    sectionOrder: DEFAULT_SECTIONS,
    sectionEnabled,
    customHtml: '',
    ctaTitle: 'Join our team',
    ctaSubtitle: 'Explore opportunities that fit your goals.',
    ctaButtonLabel: 'View Jobs',
    ctaButtonLink: '/jobs',
    theme: {
      primaryColor: '#0066FF',
      secondaryColor: '#7C3AED',
      buttonStyle: 'rounded',
      fontFamily: 'Inter, Segoe UI, sans-serif',
      cardStyle: 'elevated',
      borderRadius: 12,
      mode: 'light',
    },
    seo: {
      pageTitle: `${recruiterName} Careers`,
      metaDescription: `Explore career opportunities at ${recruiterName}.`,
      keywords: `${recruiterName}, careers, jobs`,
      ogImage: '',
      slug,
      canonicalUrl: '',
    },
    published: false,
    companyAdmins: [recruiterId],
    analytics: {
      careerPageViews: 0,
      uniqueVisitors: 0,
      jobClicks: 0,
      applications: 0,
      trafficSources: {},
      popularJobs: [],
      averageTimeOnPageSec: 0,
      followerCount: 0,
    },
    createdAt: now,
    updatedAt: now,
  };
};

const completionRatio = (profile: EmployerBrandingProfile): number => {
  const checks = [
    Boolean(profile.companyName),
    Boolean(profile.logo),
    Boolean(profile.coverBanner),
    Boolean(profile.tagline),
    Boolean(profile.industry),
    Boolean(profile.website),
    Boolean(profile.companyEmail),
    Boolean(profile.mission),
    Boolean(profile.vision),
    Boolean(profile.story),
    profile.locations.length > 0,
    profile.benefits.length > 0,
    profile.gallery.length > 0,
    profile.leadershipTeam.length > 0,
    profile.testimonials.length > 0,
    profile.awards.length > 0,
    profile.faqs.length > 0,
    Boolean(profile.recruitmentEmail),
    Boolean(profile.seo.pageTitle),
    Boolean(profile.seo.metaDescription),
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
};

const calculateBrandScore = (profile: EmployerBrandingProfile): number => {
  const profileCompletion = completionRatio(profile);
  const socialLinks = [profile.linkedIn, profile.twitter, profile.facebook, profile.instagram, profile.youtube].filter(Boolean).length;
  const socialScore = Math.min(100, socialLinks * 20);
  const galleryScore = Math.min(100, profile.gallery.length * 12);
  const testimonialScore = Math.min(100, profile.testimonials.length * 20);
  const benefitScore = Math.min(100, profile.benefits.length * 10);
  const publishedScore = profile.published ? 100 : 30;
  const responseScore = profile.analytics.averageTimeOnPageSec > 0 ? Math.min(100, 40 + Math.round(profile.analytics.averageTimeOnPageSec / 4)) : 50;
  const jobQualityScore = Math.min(100, profile.analytics.popularJobs.length * 20 + Math.max(0, 40 - Math.round(profile.analytics.jobClicks / 20)));

  const weighted =
    profileCompletion * 0.22
    + socialScore * 0.11
    + galleryScore * 0.1
    + testimonialScore * 0.1
    + benefitScore * 0.1
    + publishedScore * 0.13
    + responseScore * 0.12
    + jobQualityScore * 0.12;

  return Math.round(weighted);
};

const brandSuggestions = (profile: EmployerBrandingProfile): string[] => {
  const tips: string[] = [];
  if (!profile.logo || !profile.coverBanner) tips.push('Add both company logo and cover banner to improve visual trust.');
  if (!profile.mission || !profile.vision) tips.push('Define mission and vision clearly to strengthen employer narrative.');
  if (profile.gallery.length < 4) tips.push('Upload more life-at-company photos/videos to showcase workplace authenticity.');
  if (profile.testimonials.length < 3) tips.push('Add at least 3 employee testimonials with ratings for social proof.');
  if ([profile.linkedIn, profile.twitter, profile.facebook, profile.instagram, profile.youtube].filter(Boolean).length < 3) {
    tips.push('Connect more social channels to improve discoverability and brand confidence.');
  }
  if (!profile.published) tips.push('Publish your career page to start collecting visitors and applications.');
  if (profile.benefits.length < 5) tips.push('Expand benefits and perks section to improve talent attraction.');
  return tips.slice(0, 6);
};

const applyThemeDefaults = (profile: EmployerBrandingProfile): EmployerBrandingProfile => ({
  ...profile,
  theme: {
    primaryColor: profile.theme?.primaryColor || '#0066FF',
    secondaryColor: profile.theme?.secondaryColor || '#7C3AED',
    buttonStyle: profile.theme?.buttonStyle || 'rounded',
    fontFamily: profile.theme?.fontFamily || 'Inter, Segoe UI, sans-serif',
    cardStyle: profile.theme?.cardStyle || 'elevated',
    borderRadius: Number(profile.theme?.borderRadius || 12),
    mode: profile.theme?.mode || 'light',
  },
});

export const employerBrandingService = {
  getSectionLabels(): Record<CareerSectionKey, string> {
    return SECTION_LABELS;
  },

  getProfile(recruiterId: string, recruiterName = 'Company', recruiterEmail = ''): EmployerBrandingProfile {
    const store = readStore();
    const existing = store.profiles.find((item) => item.recruiterId === recruiterId);
    if (existing) return applyThemeDefaults(existing);

    const created = defaultProfile(recruiterId, recruiterName, recruiterEmail);
    store.profiles.unshift(created);
    writeStore(store);
    return created;
  },

  saveProfile(recruiterId: string, updates: Partial<EmployerBrandingProfile>): EmployerBrandingProfile {
    const store = readStore();
    const index = store.profiles.findIndex((item) => item.recruiterId === recruiterId);
    if (index < 0) throw new Error('Branding profile not found');

    const current = store.profiles[index];
    const next: EmployerBrandingProfile = applyThemeDefaults({
      ...current,
      ...updates,
      recruiterId,
      seo: {
        ...current.seo,
        ...(updates.seo || {}),
        slug: normalizeSlug((updates.seo?.slug || current.seo.slug || current.companyName)),
      },
      theme: {
        ...current.theme,
        ...(updates.theme || {}),
      },
      updatedAt: new Date().toISOString(),
    });

    store.profiles[index] = next;
    writeStore(store);
    return next;
  },

  canEdit(profile: Record<string, unknown> | null | undefined, recruiterId: string, brandingProfile: EmployerBrandingProfile): boolean {
    if (brandingProfile.companyAdmins.includes(recruiterId)) return true;
    const isCompanyAdmin = Boolean(profile?.is_company_admin || profile?.company_admin);
    const roleInCompany = String(profile?.role_in_company || '').toLowerCase();
    return isCompanyAdmin || roleInCompany === 'admin';
  },

  getBrandScore(profile: EmployerBrandingProfile): { score: number; completion: number; suggestions: string[] } {
    return {
      score: calculateBrandScore(profile),
      completion: completionRatio(profile),
      suggestions: brandSuggestions(profile),
    };
  },

  getDashboardMetrics(profile: EmployerBrandingProfile): {
    careerPageViews: number;
    companyFollowers: number;
    jobPageViews: number;
    applicationsGenerated: number;
    brandScore: number;
    profileCompletion: number;
  } {
    const brand = this.getBrandScore(profile);
    return {
      careerPageViews: profile.analytics.careerPageViews,
      companyFollowers: profile.analytics.followerCount,
      jobPageViews: profile.analytics.jobClicks,
      applicationsGenerated: profile.analytics.applications,
      brandScore: brand.score,
      profileCompletion: brand.completion,
    };
  },

  trackPageView(slug: string, source = 'direct', visitorId?: string): void {
    const store = readStore();
    const visitor = visitorId || `visitor_${Math.random().toString(36).slice(2, 10)}`;
    const at = new Date().toISOString();

    store.visits.unshift({ slug, visitorId: visitor, source, at });
    store.visits = store.visits.slice(0, 20000);

    const profileIndex = store.profiles.findIndex((item) => item.seo.slug === slug && item.published);
    if (profileIndex >= 0) {
      const profile = store.profiles[profileIndex];
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayVisitors = new Set(
        store.visits
          .filter((item) => item.slug === slug)
          .filter((item) => item.at.startsWith(today))
          .map((item) => item.visitorId)
      );

      const traffic = { ...(profile.analytics.trafficSources || {}) };
      traffic[source] = (traffic[source] || 0) + 1;

      store.profiles[profileIndex] = {
        ...profile,
        analytics: {
          ...profile.analytics,
          careerPageViews: profile.analytics.careerPageViews + 1,
          uniqueVisitors: Math.max(profile.analytics.uniqueVisitors, todayVisitors.size),
          trafficSources: traffic,
        },
        updatedAt: new Date().toISOString(),
      };
    }

    writeStore(store);
  },

  trackJobClick(slug: string, jobId: string, title: string): void {
    const store = readStore();
    const profileIndex = store.profiles.findIndex((item) => item.seo.slug === slug && item.published);
    if (profileIndex < 0) return;

    const profile = store.profiles[profileIndex];
    const nextPopular = [...(profile.analytics.popularJobs || [])];
    const idx = nextPopular.findIndex((item) => item.jobId === jobId);
    if (idx >= 0) nextPopular[idx] = { ...nextPopular[idx], clicks: nextPopular[idx].clicks + 1 };
    else nextPopular.push({ jobId, title, clicks: 1 });

    nextPopular.sort((a, b) => b.clicks - a.clicks);

    store.profiles[profileIndex] = {
      ...profile,
      analytics: {
        ...profile.analytics,
        jobClicks: profile.analytics.jobClicks + 1,
        popularJobs: nextPopular.slice(0, 12),
      },
      updatedAt: new Date().toISOString(),
    };

    writeStore(store);
  },

  trackApplication(slug: string): void {
    const store = readStore();
    const profileIndex = store.profiles.findIndex((item) => item.seo.slug === slug && item.published);
    if (profileIndex < 0) return;

    const profile = store.profiles[profileIndex];
    store.profiles[profileIndex] = {
      ...profile,
      analytics: {
        ...profile.analytics,
        applications: profile.analytics.applications + 1,
      },
      updatedAt: new Date().toISOString(),
    };

    writeStore(store);
  },

  saveVisitDuration(slug: string, visitorId: string, durationSec: number): void {
    const store = readStore();
    const match = store.visits.find((item) => item.slug === slug && item.visitorId === visitorId && !item.durationSec);
    if (!match) return;
    match.durationSec = Math.max(1, Math.round(durationSec));

    const profileIndex = store.profiles.findIndex((item) => item.seo.slug === slug && item.published);
    if (profileIndex >= 0) {
      const profile = store.profiles[profileIndex];
      const durations = store.visits.filter((item) => item.slug === slug && item.durationSec).map((item) => Number(item.durationSec || 0));
      const avg = durations.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : 0;
      store.profiles[profileIndex] = {
        ...profile,
        analytics: {
          ...profile.analytics,
          averageTimeOnPageSec: avg,
        },
      };
    }

    writeStore(store);
  },

  getPublicProfileBySlug(slug: string): EmployerBrandingProfile | null {
    const store = readStore();
    const normalized = normalizeSlug(slug);
    const profile = store.profiles.find((item) => item.published && normalizeSlug(item.seo.slug) === normalized);
    return profile ? applyThemeDefaults(profile) : null;
  },

  getAiSuggestions(profile: EmployerBrandingProfile): {
    companyDescription: string;
    mission: string;
    vision: string;
    benefits: string[];
    culture: string;
    recruitmentMessage: string;
    brandingImprovements: string[];
    seoSuggestions: string[];
  } {
    const company = profile.companyName || 'our company';
    const industry = profile.industry || 'technology';

    return {
      companyDescription: `${company} is building high-impact products in ${industry}, focused on innovation, ownership, and measurable outcomes for customers globally.`,
      mission: `Empower teams and customers through scalable ${industry} solutions that create meaningful value.`,
      vision: `Become a trusted global employer and product leader known for people-first culture and consistent execution.`,
      benefits: [
        'Flexible hybrid work policy with role-based options',
        'Learning and certification budget for every employee',
        'Wellness and mental health support programs',
        'Transparent performance and growth framework',
      ],
      culture: `${company} promotes a collaborative, feedback-rich environment where teams learn fast, ship quality work, and celebrate impact.`,
      recruitmentMessage: `Join ${company} to work on meaningful challenges, grow with a strong team, and create measurable impact from day one.`,
      brandingImprovements: brandSuggestions(profile),
      seoSuggestions: [
        'Use role-specific keywords in page title and meta description',
        'Include location + work mode terms for discoverability',
        'Add OpenGraph image and canonical URL for social sharing consistency',
      ],
    };
  },

  ensureUniqueSlug(recruiterId: string, desiredSlug: string): string {
    const store = readStore();
    const normalized = normalizeSlug(desiredSlug || `company-${recruiterId.slice(0, 6)}`);
    let candidate = normalized;
    let counter = 2;

    while (store.profiles.some((item) => item.recruiterId !== recruiterId && normalizeSlug(item.seo.slug) === candidate)) {
      candidate = `${normalized}-${counter}`;
      counter += 1;
    }

    return candidate;
  },

  publish(recruiterId: string): EmployerBrandingProfile {
    const store = readStore();
    const index = store.profiles.findIndex((item) => item.recruiterId === recruiterId);
    if (index < 0) throw new Error('Branding profile not found');

    const current = store.profiles[index];
    const uniqueSlug = this.ensureUniqueSlug(recruiterId, current.seo.slug || current.companyName);

    const next: EmployerBrandingProfile = {
      ...current,
      published: true,
      seo: {
        ...current.seo,
        slug: uniqueSlug,
      },
      updatedAt: new Date().toISOString(),
    };

    store.profiles[index] = next;
    writeStore(store);
    return next;
  },
};
