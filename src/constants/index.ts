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
    price: 269,
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

export const INDIAN_CITIES = [
  'Hyderabad', 'Bengaluru', 'Chennai', 'Mumbai', 'Delhi', 'Pune', 'Kolkata', 'Ahmedabad',
  'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Surat', 'Vadodara', 'Bhopal', 'Coimbatore',
  'Visakhapatnam', 'Ludhiana', 'Agra', 'Madurai', 'Thiruvananthapuram', 'Noida', 'Gurgaon',
  'Faridabad', 'Amritsar', 'Nashik', 'Meerut', 'Rajkot', 'Vijayawada',
];

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh',
];

export interface InterviewRole {
  title: string;
  count: string;
  url: string;
  description: string;
  categories: string[];
}

export const INTERVIEW_ROLE_CATEGORIES = [
  'All',
  'Development',
  'Testing',
  'Cloud',
  'Data',
  'Management',
  'Design',
  'AI / ML',
];

export const INTERVIEW_ROLES: InterviewRole[] = [
  {
    title: 'Software Engineer',
    count: '7.2K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/software-engineer/interview-questions',
    description: 'Frontend, React, Java, Node.js, System Design and Coding Interviews.',
    categories: ['Development'],
  },
  {
    title: 'Frontend Developer',
    count: '6.4K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/frontend-developer/interview-questions',
    description: 'React, Angular, Vue, HTML, CSS, JavaScript and UI performance interviews.',
    categories: ['Development', 'Design'],
  },
  {
    title: 'Backend Developer',
    count: '5.8K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/backend-developer/interview-questions',
    description: 'Node.js, Java, Python, APIs, microservices, and architecture interviews.',
    categories: ['Development'],
  },
  {
    title: 'Full Stack Developer',
    count: '6.1K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/full-stack-developer/interview-questions',
    description: 'End-to-end interviews covering frontend, backend, databases, and devops.',
    categories: ['Development'],
  },
  {
    title: 'React Developer',
    count: '5.0K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/react-developer/interview-questions',
    description: 'React hooks, state management, component design and frontend architecture.',
    categories: ['Development'],
  },
  {
    title: 'Angular Developer',
    count: '3.6K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/angular-developer/interview-questions',
    description: 'Angular modules, services, RxJS, directives, and performance interviews.',
    categories: ['Development'],
  },
  {
    title: 'Vue.js Developer',
    count: '2.9K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/vuejs-developer/interview-questions',
    description: 'Vue, Vuex, components, animation and progressive web app interview prep.',
    categories: ['Development'],
  },
  {
    title: 'Node.js Developer',
    count: '4.2K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/nodejs-developer/interview-questions',
    description: 'Asynchronous programming, express, APIs, and backend integration interviews.',
    categories: ['Development'],
  },
  {
    title: 'Java Developer',
    count: '4.9K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/java-developer/interview-questions',
    description: 'Core Java, Spring, multithreading, collections, and system design questions.',
    categories: ['Development'],
  },
  {
    title: 'Python Developer',
    count: '4.5K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/python-developer/interview-questions',
    description: 'Python fundamentals, Django, Flask, data structures and automation interviews.',
    categories: ['Development', 'Data'],
  },
  {
    title: 'Dot Net Developer',
    count: '3.2K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/dot-net-developer/interview-questions',
    description: '.NET, C#, ASP.NET, design patterns and architecture interview questions.',
    categories: ['Development'],
  },
  {
    title: 'PHP Developer',
    count: '3.0K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/php-developer/interview-questions',
    description: 'Laravel, backend workflows, API design and database integration interviews.',
    categories: ['Development'],
  },
  {
    title: 'Flutter Developer',
    count: '2.8K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/flutter-developer/interview-questions',
    description: 'Mobile UI, state management, widgets and cross-platform interview prep.',
    categories: ['Development'],
  },
  {
    title: 'Android Developer',
    count: '3.7K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/android-developer/interview-questions',
    description: 'Kotlin, Android architecture, Jetpack, and app lifecycle interviews.',
    categories: ['Development'],
  },
  {
    title: 'iOS Developer',
    count: '2.4K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/ios-developer/interview-questions',
    description: 'Swift, UIKit, SwiftUI, and mobile app design interview practice.',
    categories: ['Development'],
  },
  {
    title: 'DevOps Engineer',
    count: '4.6K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/devops-engineer/interview-questions',
    description: 'CI/CD, containerization, monitoring, and deployment interview questions.',
    categories: ['Cloud'],
  },
  {
    title: 'Cloud Engineer',
    count: '3.8K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/cloud-engineer/interview-questions',
    description: 'Cloud architecture, infrastructure, automation, and scalability interviews.',
    categories: ['Cloud'],
  },
  {
    title: 'AWS Engineer',
    count: '3.5K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/aws-engineer/interview-questions',
    description: 'AWS services, architecture, security, and cloud-native interview prep.',
    categories: ['Cloud'],
  },
  {
    title: 'Azure Engineer',
    count: '2.9K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/azure-engineer/interview-questions',
    description: 'Azure provisioning, devops, networking, and cloud ops interview questions.',
    categories: ['Cloud'],
  },
  {
    title: 'Site Reliability Engineer',
    count: '2.6K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/site-reliability-engineer/interview-questions',
    description: 'Reliability, incident response, scalability, and performance engineering interviews.',
    categories: ['Cloud'],
  },
  {
    title: 'Data Scientist',
    count: '5.1K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/data-scientist/interview-questions',
    description: 'Statistics, machine learning, modeling, and data analysis interview topics.',
    categories: ['Data', 'AI / ML'],
  },
  {
    title: 'Data Analyst',
    count: '4.0K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/data-analyst/interview-questions',
    description: 'Excel, SQL, visualization, business metrics and analytical problem-solving interviews.',
    categories: ['Data'],
  },
  {
    title: 'Business Analyst',
    count: '3.8K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/business-analyst/interview-questions',
    description: 'Requirements gathering, stakeholder communication and process analysis interview prep.',
    categories: ['Management', 'Data'],
  },
  {
    title: 'Product Manager',
    count: '4.3K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/product-manager/interview-questions',
    description: 'Product strategy, roadmaps, stakeholder alignment, and execution interview questions.',
    categories: ['Management'],
  },
  {
    title: 'Project Manager',
    count: '3.1K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/project-manager/interview-questions',
    description: 'Planning, delivery, risk management, and agile leadership interview prep.',
    categories: ['Management'],
  },
  {
    title: 'UI Designer',
    count: '2.7K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/ui-designer/interview-questions',
    description: 'Visual design, layout, typography, branding and interaction interview questions.',
    categories: ['Design'],
  },
  {
    title: 'UX Designer',
    count: '2.9K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/ux-designer/interview-questions',
    description: 'User research, wireframes, usability, and experience design interview prep.',
    categories: ['Design'],
  },
  {
    title: 'UI UX Designer',
    count: '3.3K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/ui-ux-designer/interview-questions',
    description: 'End-to-end interface and experience design questions for modern product teams.',
    categories: ['Design'],
  },
  {
    title: 'QA Engineer',
    count: '3.2K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/qa-engineer/interview-questions',
    description: 'Manual testing, regression, test plans, and bug tracking interview questions.',
    categories: ['Testing'],
  },
  {
    title: 'Automation Tester',
    count: '2.8K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/automation-tester/interview-questions',
    description: 'Scripting, Selenium, test automation frameworks and continuous testing interview prep.',
    categories: ['Testing'],
  },
  {
    title: 'Manual Tester',
    count: '1.9K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/manual-tester/interview-questions',
    description: 'Test case creation, defect triage, exploratory testing and quality assurance interviews.',
    categories: ['Testing'],
  },
  {
    title: 'Performance Tester',
    count: '1.7K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/performance-tester/interview-questions',
    description: 'Load testing, performance tuning and benchmarking interview questions.',
    categories: ['Testing'],
  },
  {
    title: 'Security Engineer',
    count: '2.5K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/security-engineer/interview-questions',
    description: 'Security audits, threat modeling, encryption and compliance interview prep.',
    categories: ['AI / ML'],
  },
  {
    title: 'Cyber Security Analyst',
    count: '2.1K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/cyber-security-analyst/interview-questions',
    description: 'Threat detection, incident response and vulnerability assessment interview questions.',
    categories: ['AI / ML'],
  },
  {
    title: 'Network Engineer',
    count: '2.3K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/network-engineer/interview-questions',
    description: 'Networking protocols, routing, switching and infrastructure interview prep.',
    categories: ['Cloud'],
  },
  {
    title: 'Database Administrator',
    count: '2.0K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/database-administrator/interview-questions',
    description: 'SQL, database design, optimization and administration interview questions.',
    categories: ['Data'],
  },
  {
    title: 'Machine Learning Engineer',
    count: '3.4K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/machine-learning-engineer/interview-questions',
    description: 'ML models, pipelines, feature engineering and deployment interview prep.',
    categories: ['AI / ML', 'Data'],
  },
  {
    title: 'AI Engineer',
    count: '2.9K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/ai-engineer/interview-questions',
    description: 'AI frameworks, neural networks, NLP and model deployment interview questions.',
    categories: ['AI / ML'],
  },
  {
    title: 'Prompt Engineer',
    count: '1.8K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/prompt-engineer/interview-questions',
    description: 'Prompt design, generative AI workflows and large model interview prep.',
    categories: ['AI / ML'],
  },
  {
    title: 'GenAI Engineer',
    count: '1.5K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/genai-engineer/interview-questions',
    description: 'Generative AI systems, fine-tuning, and applied prompt engineering interviews.',
    categories: ['AI / ML'],
  },
  {
    title: 'Solution Architect',
    count: '3.0K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/solution-architect/interview-questions',
    description: 'System design, architecture patterns, and solution delivery interview questions.',
    categories: ['Management'],
  },
  {
    title: 'Technical Lead',
    count: '2.7K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/technical-lead/interview-questions',
    description: 'Leadership, coding direction, architecture review and team management questions.',
    categories: ['Management'],
  },
  {
    title: 'Engineering Manager',
    count: '2.3K+ Questions',
    url: 'https://www.ambitionbox.com/profiles/engineering-manager/interview-questions',
    description: 'People management, delivery, hiring and technical leadership interview prep.',
    categories: ['Management'],
  },
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
  DASHBOARD_NOTIFICATIONS: '/dashboard/notifications',
  DASHBOARD_SETTINGS: '/dashboard/settings',
  DASHBOARD_SETTINGS_ACCOUNT: '/dashboard/settings/account',
  DASHBOARD_SETTINGS_PRIVACY: '/dashboard/settings/privacy',
  DASHBOARD_SETTINGS_PREFERENCES: '/dashboard/settings/preferences',
  DASHBOARD_SETTINGS_BLOCKED: '/dashboard/settings/blocked-companies',
  RECRUITER_DASHBOARD: '/recruiter/dashboard',
  RECRUITER_POST_JOB: '/recruiter/post-job',
  RECRUITER_JOBS: '/recruiter/jobs',
  RECRUITER_APPLICANTS: '/recruiter/applicants',
  RECRUITER_PROFILE: '/recruiter/profile',
  RECRUITER_TALENT_POOL: '/recruiter/dashboard?tab=talent-pool',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_RECRUITERS: '/admin/recruiters',
  ADMIN_CANDIDATES: '/admin/candidates',
  ADMIN_JOBS: '/admin/jobs',
  ADMIN_APPLICATIONS: '/admin/applications',
  ADMIN_SUBSCRIPTIONS: '/admin/subscriptions',
  ADMIN_PAYMENTS: '/admin/payments',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_BULK_IMPORT: '/admin/bulk-import',
  ADMIN_BULK_EXPORT: '/admin/bulk-export',
  ADMIN_DATA_INTEGRITY: '/admin/data-integrity',
  ADMIN_SYSTEM_HEALTH: '/admin/system-health',
  ADMIN_SETTINGS: '/admin/settings',
  PRIVACY_POLICY: '/privacy-policy',
  TERMS_CONDITIONS: '/terms-conditions',
  MESSAGING: '/messaging',
  MESSAGING_INBOX: '/messaging/inbox',
  MESSAGING_SENT: '/messaging/sent',
};

export const CANDIDATE_TAG_COLORS = [
  '#6366F1', // indigo
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#EF4444', // red
  '#F97316', // orange
  '#F59E0B', // amber
  '#22C55E', // green
  '#14B8A6', // teal
  '#06B6D4', // cyan
  '#3B82F6', // blue
  '#64748B', // slate
  '#A855F7', // purple
] as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'actro_auth_token',
  USER_DATA: 'actro_user_data',
  PREFERENCES: 'actro_preferences',
  THEME: 'actro_theme',
};

export const API_BASE_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';
