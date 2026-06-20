export const JOB_CATEGORIES = [
  'Frontend Developer',
  'React Developer',
  'Vue Developer',
  'Angular Developer',
  'Full Stack Developer',
  'Backend Developer',
  'Python Developer',
  'Java Developer',
  'Testing',
  'DevOps',
  'Data Analyst',
  'UI/UX Designer',
];

export const EMPLOYMENT_TYPES = ['Full-Time', 'Part-Time', 'Contract', 'Internship', 'Freelance'];
export const WORK_MODES = ['Onsite', 'Remote', 'Hybrid'];

export const JOB_TYPES = EMPLOYMENT_TYPES;

export const EXPERIENCE_LEVELS = [
  '0-1 years',
  '1-3 years',
  '3-5 years',
  '5-7 years',
  '7-10 years',
  '10+ years',
];

export const SUBSCRIPTION_PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    durationLabel: '1 Month',
    price: 149,
    durationMonths: 1,
    period: 'month',
    features: [
      'Access to Onsite jobs',
      'View job details',
      'Save jobs',
      'Email notifications',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    durationLabel: '2 Months',
    price: 249,
    durationMonths: 2,
    period: 'months',
    features: [
      'All Basic features',
      'Access to Remote & Hybrid jobs',
      'Save unlimited jobs',
      'Apply without resume upload',
      'Weekly job digest',
      'Priority job recommendations',
    ],
    recommended: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    durationLabel: '3 Months',
    price: 399,
    durationMonths: 3,
    period: 'months',
    features: [
      'All Premium features',
      'Early access to new jobs',
      'Personalized job matching',
      'Mock interview sessions',
      '1-on-1 career coaching',
      'Resume review & optimization',
      'Portfolio building assistance',
    ],
  },
];

export const SUBSCRIPTION_GATEWAY_FEE_PERCENT = 2;
export const SUBSCRIPTION_GST_PERCENT = 18;

export const USER_ROLES = {
  JOB_SEEKER: 'job_seeker',
  RECRUITER: 'recruiter',
  ADMIN: 'admin',
} as const;

export const JOB_APPLICATION_STATUS = {
  APPLIED: 'applied',
  UNDER_REVIEW: 'under_review',
  SHORTLISTED: 'shortlisted',
  REJECTED: 'rejected',
  ACCEPTED: 'accepted',
};

export const EDUCATION_OPTIONS = [
  '10th',
  '12th',
  'Diploma',
  "Bachelor's",
  "Master's",
  'PhD',
];

export const FRESHNESS_OPTIONS = [
  { label: 'Last 1 Day', value: '1d' },
  { label: 'Last 3 Days', value: '3d' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 15 Days', value: '15d' },
  { label: 'Last 30 Days', value: '30d' },
];

export const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

export const NOTICE_PERIOD_OPTIONS = [
  'Immediate',
  '15 Days',
  '30 Days',
  '60 Days',
  '90 Days',
  'Serving Notice',
];

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh',
];

export const INDUSTRY_TYPES = [
  'IT & Software', 'Finance & Banking', 'Healthcare', 'Education',
  'Manufacturing', 'Retail & E-commerce', 'Consulting', 'Media & Entertainment',
  'Real Estate', 'Telecommunications', 'Automotive', 'Pharmaceuticals',
  'Hospitality', 'Logistics', 'Energy', 'Other',
];

export const ROUTES = {
  HOME: '/',
  JOBS: '/jobs',
  JOB_DETAILS: '/jobs/:id',
  PRICING: '/pricing',
  ABOUT: '/about',
  CONTACT: '/contact',
  LOGIN: '/login',
  SIGNUP: '/signup',
  RECRUITER_REGISTER: '/recruiter/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  AUTH_CALLBACK: '/auth/callback',
  VERIFY_EMAIL: '/verify-email/:token',
  DASHBOARD: '/dashboard',
  DASHBOARD_PROFILE: '/dashboard/profile',
  DASHBOARD_RESUME: '/dashboard/resume',
  DASHBOARD_APPLICATIONS: '/dashboard/applications',
  DASHBOARD_SAVED_JOBS: '/dashboard/saved-jobs',
  DASHBOARD_SETTINGS: '/dashboard/settings',
  RECRUITER_DASHBOARD: '/recruiter/dashboard',
  RECRUITER_POST_JOB: '/recruiter/post-job',
  RECRUITER_JOBS: '/recruiter/jobs',
  RECRUITER_APPLICANTS: '/recruiter/applicants',
  RECRUITER_PROFILE: '/recruiter/profile',
  ADMIN_DASHBOARD: '/admin/dashboard',
  PRIVACY_POLICY: '/privacy-policy',
  TERMS_CONDITIONS: '/terms-conditions',
};

export const API_BASE_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'actotech_auth_token',
  USER_DATA: 'actotech_user_data',
  PREFERENCES: 'actotech_preferences',
  THEME: 'actotech_theme',
};
