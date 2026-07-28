import { format, addDays } from 'date-fns';
import { applicationService, jobService, notificationService, savedService, subscriptionService, userService } from '@services/api';
import { messagingService } from '@services/messaging';

export type CareerPlanWindow = '3m' | '6m' | '1y' | '2y' | '5y';
export type CoverLetterTone = 'professional' | 'friendly' | 'executive';
export type ResumeTemplate = 'modern' | 'professional' | 'executive' | 'developer' | 'designer' | 'fresher';
export type MockInterviewType = 'hr' | 'technical' | 'behavioral' | 'coding' | 'system-design' | 'role-specific';

export interface CandidateDashboardOverview {
  profileCompletion: number;
  resumeScore: number;
  atsResumeScore: number;
  applications: number;
  interviewInvitations: number;
  skillScore: number;
  careerReadinessScore: number;
  aiRecommendations: number;
}

export interface CareerChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface CareerChatThread {
  id: string;
  userId: string;
  title: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  messages: CareerChatMessage[];
}

export interface SavedPrompt {
  id: string;
  userId: string;
  title: string;
  prompt: string;
  createdAt: string;
}

export interface ResumeSectionData {
  personalDetails: Record<string, string>;
  summary: string;
  experience: string[];
  projects: string[];
  skills: string[];
  education: string[];
  certifications: string[];
  achievements: string[];
  languages: string[];
}

export interface ResumeDraft {
  id: string;
  userId: string;
  template: ResumeTemplate;
  updatedAt: string;
  sections: ResumeSectionData;
}

export interface AtsResumeScoreResult {
  overallScore: number;
  formattingScore: number;
  keywordScore: number;
  experienceScore: number;
  skillsScore: number;
  grammarScore: number;
  readabilityScore: number;
  sectionCompleteness: number;
  missingKeywords: string[];
  missingSkills: string[];
  weakSections: string[];
  actionableImprovements: string[];
}

export interface SkillGapResult {
  matchingSkills: string[];
  missingSkills: string[];
  recommendedSkills: string[];
  learningPath: string[];
  prioritySkills: string[];
}

export interface CareerRoadmapResult {
  window: CareerPlanWindow;
  technologies: string[];
  certifications: string[];
  projects: string[];
  careerGoals: string[];
}

export interface InterviewEvaluation {
  confidence: number;
  communication: number;
  technicalAccuracy: number;
  problemSolving: number;
  overallRating: number;
  improvementSuggestions: string[];
}

export interface InterviewFeedbackReport {
  strengths: string[];
  weaknesses: string[];
  commonMistakes: string[];
  recommendedPractice: string[];
  confidenceScore: number;
}

export interface LearningRecommendations {
  courses: string[];
  certifications: string[];
  books: string[];
  practicePlatforms: string[];
  codingChallenges: string[];
  learningPath: string[];
}

export interface SalaryEstimate {
  expectedMin: number;
  expectedMax: number;
  median: number;
  confidence: number;
}

export interface CareerInsights {
  trendingTechnologies: string[];
  mostInDemandSkills: string[];
  hiringCompanies: string[];
  remoteOpportunities: string[];
  emergingCareers: string[];
}

export interface ApplicationAssistantResult {
  matchScore: number;
  resumeImprovements: string[];
  missingSkills: string[];
  coverLetter: string;
  applicationTips: string[];
}

export interface JobTrackerSummary {
  savedJobs: number;
  appliedJobs: number;
  interviewStage: number;
  offerStage: number;
  rejectedJobs: number;
  timeline: Array<{ date: string; event: string }>;
}

export interface BadgeAchievement {
  key: string;
  label: string;
  unlocked: boolean;
  criteria: string;
}

export interface CareerHubReportBundle {
  careerProgressReport: string;
  resumeReport: string;
  skillReport: string;
  interviewReport: string;
  applicationReport: string;
}

export interface IntegrationSummary {
  candidateDashboard: boolean;
  resume: boolean;
  jobs: boolean;
  applications: boolean;
  messaging: boolean;
  interviewManagement: boolean;
  analytics: boolean;
  recruiterAi: boolean;
}

interface CandidateContext {
  profile: any;
  applications: any[];
  savedJobs: any[];
  conversations: any[];
}

interface CareerHubStore {
  chats: CareerChatThread[];
  prompts: SavedPrompt[];
  resumeDrafts: ResumeDraft[];
  notifications: Array<{ id: string; userId: string; type: string; message: string; at: string }>;
  usage: Record<string, { day: string; requests: number }>;
}

const STORAGE_KEY = 'actro_ai_career_hub_v1';
const FREE_DAILY_LIMIT = 20;

const safeParse = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const nowIso = (): string => new Date().toISOString();
const makeId = (prefix: string): string => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const defaultStore = (): CareerHubStore => ({
  chats: [],
  prompts: [],
  resumeDrafts: [],
  notifications: [],
  usage: {},
});

const readStore = (): CareerHubStore => safeParse<CareerHubStore>(localStorage.getItem(STORAGE_KEY), defaultStore());
const writeStore = (store: CareerHubStore): void => localStorage.setItem(STORAGE_KEY, JSON.stringify(store));

const normalizeSkills = (skills: unknown): string[] => {
  if (Array.isArray(skills)) return skills.map((s) => String(s).trim()).filter(Boolean);
  if (typeof skills === 'string') return skills.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
};

const profileCompletion = (profile: any): number => {
  const checks = [
    profile?.name,
    profile?.email,
    profile?.phone,
    profile?.bio,
    profile?.experience,
    profile?.resume_url || profile?.resumeUrl,
    normalizeSkills(profile?.skills).length > 0,
    Array.isArray(profile?.education_details || profile?.education) && (profile?.education_details || profile?.education).length > 0,
    Array.isArray(profile?.work_experience || profile?.workExperience) && (profile?.work_experience || profile?.workExperience).length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

const subscriptionPlan = async (userId: string): Promise<string> => {
  const sub = await subscriptionService.getUserSubscription(userId).catch(() => null);
  return String(sub?.plan || 'free').toLowerCase();
};

const isPremiumPlan = (plan: string): boolean => ['premium', 'pro', 'enterprise'].includes(plan.toLowerCase());

const ensureUsage = (store: CareerHubStore, userId: string): { day: string; requests: number } => {
  const day = format(new Date(), 'yyyy-MM-dd');
  const existing = store.usage[userId];
  if (!existing || existing.day !== day) {
    store.usage[userId] = { day, requests: 0 };
  }
  return store.usage[userId];
};

const getContextAwareResponse = (prompt: string, context: CandidateContext): string => {
  const skills = normalizeSkills(context.profile?.skills);
  const topSkills = skills.slice(0, 8);
  const appCount = context.applications.length;
  const savedCount = context.savedJobs.length;
  const messageCount = context.conversations.length;

  const promptLower = prompt.toLowerCase();

  if (promptLower.includes('resume')) {
    return [
      '## Resume Strategy',
      '',
      `You currently show **${skills.length} skills** and **${appCount} applications**.`,
      '- Put your top 5 skills in the first half of the resume.',
      '- Quantify outcomes in experience bullets.',
      '- Mirror keywords from the target job description.',
      '',
      '### Priority updates',
      ...topSkills.slice(0, 5).map((skill) => `- Highlight ${skill} with evidence project/impact.`),
    ].join('\n');
  }

  if (promptLower.includes('interview')) {
    return [
      '## Interview Prep Plan',
      '',
      '- Practice 3 STAR stories for impact, conflict, and ownership.',
      '- Keep technical answers under 90 seconds with clear structure.',
      '- End every answer with measurable impact.',
      '',
      `You have **${appCount} active application signals** and **${messageCount} recruiter conversation threads** to prepare against.`,
    ].join('\n');
  }

  return [
    '## Career Assistant Response',
    '',
    `I used your profile context: **${skills.length} skills**, **${appCount} applications**, **${savedCount} saved jobs** and **${messageCount} recruiter conversations**.`,
    '',
    '### Recommended next actions',
    '- Tailor resume headline and summary per target role.',
    '- Prioritize jobs that overlap with your top skills.',
    '- Follow up with recruiters within 24 hours.',
    '- Track weekly interview readiness metrics.',
  ].join('\n');
};

const defaultResumeSections = (profile: any): ResumeSectionData => ({
  personalDetails: {
    name: String(profile?.name || ''),
    email: String(profile?.email || ''),
    phone: String(profile?.phone || ''),
    location: String(profile?.location || profile?.city || ''),
    linkedin: String(profile?.linkedin_url || ''),
    github: String(profile?.github_url || ''),
    portfolio: String(profile?.portfolio_url || ''),
  },
  summary: String(profile?.bio || 'Motivated professional focused on high-impact execution and continuous learning.'),
  experience: Array.isArray(profile?.work_experience) ? profile.work_experience.map((item: any) => String(item?.title || item || '')).filter(Boolean) : [],
  projects: [],
  skills: normalizeSkills(profile?.skills),
  education: Array.isArray(profile?.education_details) ? profile.education_details.map((item: any) => String(item?.degree || item || '')).filter(Boolean) : [],
  certifications: [],
  achievements: [],
  languages: ['English'],
});

const keywordExtract = (text: string): string[] => {
  return Array.from(new Set(text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3)
  )).slice(0, 60);
};

const evaluateAnswer = (answer: string): InterviewEvaluation => {
  const words = answer.trim().split(/\s+/).filter(Boolean);
  const lengthScore = Math.min(100, Math.round(words.length * 1.8));
  const confidence = Math.min(100, 45 + Math.round(lengthScore * 0.35));
  const communication = Math.min(100, 40 + Math.round(lengthScore * 0.4));
  const technicalAccuracy = Math.min(100, 35 + Math.round((answer.toLowerCase().match(/because|architecture|complexity|tradeoff|impact|metric/g) || []).length * 8));
  const problemSolving = Math.min(100, 35 + Math.round((answer.toLowerCase().match(/first|then|finally|approach|design|test/g) || []).length * 7));
  const overallRating = Math.round((confidence + communication + technicalAccuracy + problemSolving) / 4);

  const suggestions = [
    'Use structured answers: context, action, measurable result.',
    'Add one technical tradeoff in each answer.',
    'Conclude with impact in numbers where possible.',
  ];

  return {
    confidence,
    communication,
    technicalAccuracy,
    problemSolving,
    overallRating,
    improvementSuggestions: suggestions,
  };
};

export const aiCareerHubService = {
  async getCandidateContext(userId: string): Promise<CandidateContext> {
    const [profile, applications, savedJobs, conversations] = await Promise.all([
      userService.getProfile(userId).catch(() => null),
      applicationService.getUserApplications(userId).catch(() => []),
      savedService.getUserSavedJobs(userId).catch(() => []),
      messagingService.getConversations(userId).catch(() => []),
    ]);

    return {
      profile,
      applications: applications || [],
      savedJobs: savedJobs || [],
      conversations: conversations || [],
    };
  },

  async getDashboardOverview(userId: string): Promise<CandidateDashboardOverview> {
    const context = await this.getCandidateContext(userId);
    const skills = normalizeSkills(context.profile?.skills);
    const applications = context.applications;

    const interviewInvitations = applications.filter((a: any) => ['shortlisted', 'under_review', 'accepted'].includes(String(a.status || '').toLowerCase())).length;
    const skillScore = Math.min(100, 40 + skills.length * 6);
    const pCompletion = profileCompletion(context.profile);
    const resumeScore = Math.min(100, Math.round((pCompletion * 0.45) + (skillScore * 0.55)));
    const atsResumeScore = Math.min(100, Math.round((resumeScore * 0.7) + (interviewInvitations * 2.2)));
    const careerReadinessScore = Math.min(100, Math.round((resumeScore * 0.35) + (atsResumeScore * 0.35) + (Math.min(30, applications.length) * 1)));

    return {
      profileCompletion: pCompletion,
      resumeScore,
      atsResumeScore,
      applications: applications.length,
      interviewInvitations,
      skillScore,
      careerReadinessScore,
      aiRecommendations: Math.max(3, Math.round((100 - careerReadinessScore) / 8)),
    };
  },

  async getPermissions(userId: string): Promise<{
    plan: string;
    isPremium: boolean;
    remainingDailyRequests: number | null;
  }> {
    const plan = await subscriptionPlan(userId);
    const premium = isPremiumPlan(plan);
    const store = readStore();
    const usage = ensureUsage(store, userId);
    writeStore(store);

    return {
      plan,
      isPremium: premium,
      remainingDailyRequests: premium ? null : Math.max(0, FREE_DAILY_LIMIT - usage.requests),
    };
  },

  listChatThreads(userId: string): CareerChatThread[] {
    const store = readStore();
    return store.chats.filter((t) => t.userId === userId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  createNewChat(userId: string, title = 'New Career Chat'): CareerChatThread {
    const store = readStore();
    const thread: CareerChatThread = {
      id: makeId('career_chat'),
      userId,
      title,
      pinned: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      messages: [],
    };
    store.chats.unshift(thread);
    writeStore(store);
    return thread;
  },

  togglePinChat(userId: string, threadId: string): CareerChatThread | null {
    const store = readStore();
    const thread = store.chats.find((t) => t.userId === userId && t.id === threadId);
    if (!thread) return null;
    thread.pinned = !thread.pinned;
    thread.updatedAt = nowIso();
    writeStore(store);
    return thread;
  },

  deleteChat(userId: string, threadId: string): void {
    const store = readStore();
    store.chats = store.chats.filter((t) => !(t.userId === userId && t.id === threadId));
    writeStore(store);
  },

  listSavedPrompts(userId: string): SavedPrompt[] {
    return readStore().prompts.filter((p) => p.userId === userId);
  },

  savePrompt(userId: string, title: string, prompt: string): SavedPrompt {
    const store = readStore();
    const row: SavedPrompt = {
      id: makeId('saved_prompt'),
      userId,
      title,
      prompt,
      createdAt: nowIso(),
    };
    store.prompts.unshift(row);
    writeStore(store);
    return row;
  },

  exportChatMarkdown(userId: string, threadId: string): string {
    const thread = this.listChatThreads(userId).find((t) => t.id === threadId);
    if (!thread) return '# Chat not found';

    return [
      `# ${thread.title}`,
      `Exported: ${format(new Date(), 'dd MMM yyyy HH:mm')}`,
      '',
      ...thread.messages.map((m) => `## ${m.role === 'user' ? 'You' : 'AI Career Assistant'}\n${m.content}\n`),
    ].join('\n');
  },

  async sendMessage(userId: string, threadId: string, prompt: string): Promise<CareerChatThread> {
    const permissions = await this.getPermissions(userId);
    if (!permissions.isPremium && Number(permissions.remainingDailyRequests || 0) <= 0) {
      throw new Error('Free plan AI request limit reached for today. Upgrade to premium for unlimited requests.');
    }

    const store = readStore();
    const usage = ensureUsage(store, userId);
    const thread = store.chats.find((t) => t.userId === userId && t.id === threadId);
    if (!thread) throw new Error('Chat thread not found');

    const context = await this.getCandidateContext(userId);

    const userMessage: CareerChatMessage = {
      id: makeId('msg_user'),
      role: 'user',
      content: prompt,
      createdAt: nowIso(),
    };

    const assistantMessage: CareerChatMessage = {
      id: makeId('msg_ai'),
      role: 'assistant',
      content: getContextAwareResponse(prompt, context),
      createdAt: nowIso(),
    };

    thread.messages.push(userMessage, assistantMessage);
    thread.updatedAt = nowIso();
    if (thread.title === 'New Career Chat' && prompt.trim().length > 0) {
      thread.title = prompt.trim().slice(0, 42);
    }

    usage.requests += 1;
    store.notifications.unshift({
      id: makeId('notif'),
      userId,
      type: 'ai_chat',
      message: 'AI Career Assistant generated new guidance.',
      at: nowIso(),
    });

    writeStore(store);
    return thread;
  },

  async buildResumeDraft(userId: string, template: ResumeTemplate): Promise<ResumeDraft> {
    const context = await this.getCandidateContext(userId);
    const store = readStore();

    const draft: ResumeDraft = {
      id: makeId('resume_draft'),
      userId,
      template,
      updatedAt: nowIso(),
      sections: defaultResumeSections(context.profile),
    };

    store.resumeDrafts = [draft, ...store.resumeDrafts.filter((r) => r.userId !== userId)];
    writeStore(store);
    return draft;
  },

  getResumeDraft(userId: string): ResumeDraft | null {
    return readStore().resumeDrafts.find((r) => r.userId === userId) || null;
  },

  updateResumeDraft(userId: string, sections: Partial<ResumeSectionData>): ResumeDraft {
    const store = readStore();
    let draft = store.resumeDrafts.find((r) => r.userId === userId);
    if (!draft) {
      draft = {
        id: makeId('resume_draft'),
        userId,
        template: 'professional',
        updatedAt: nowIso(),
        sections: defaultResumeSections({}),
      };
      store.resumeDrafts.unshift(draft);
    }

    draft.sections = {
      ...draft.sections,
      ...sections,
      personalDetails: {
        ...draft.sections.personalDetails,
        ...(sections.personalDetails || {}),
      },
    };
    draft.updatedAt = nowIso();
    writeStore(store);
    return draft;
  },

  downloadResumeContent(userId: string, formatType: 'pdf' | 'docx'): string {
    const draft = this.getResumeDraft(userId);
    if (!draft) return 'Resume draft not found.';

    const s = draft.sections;
    const text = [
      `Template: ${draft.template}`,
      'Personal Details:',
      ...Object.entries(s.personalDetails).map(([k, v]) => `${k}: ${v}`),
      '',
      'Summary:',
      s.summary,
      '',
      'Experience:',
      ...s.experience.map((e) => `- ${e}`),
      '',
      'Projects:',
      ...s.projects.map((p) => `- ${p}`),
      '',
      'Skills:',
      s.skills.join(', '),
      '',
      'Education:',
      ...s.education.map((e) => `- ${e}`),
      '',
      'Certifications:',
      ...s.certifications.map((c) => `- ${c}`),
      '',
      'Achievements:',
      ...s.achievements.map((a) => `- ${a}`),
      '',
      'Languages:',
      s.languages.join(', '),
    ].join('\n');

    return `Generated ${formatType.toUpperCase()} Content\n\n${text}`;
  },

  analyzeAtsResume(resumeText: string, targetJobDescription: string): AtsResumeScoreResult {
    const text = `${resumeText} ${targetJobDescription}`.trim();
    const words = text.split(/\s+/).filter(Boolean);

    const formattingScore = Math.min(100, 45 + Math.round((resumeText.match(/\n/g)?.length || 0) * 1.5));
    const jobKeywords = keywordExtract(targetJobDescription);
    const resumeKeywords = keywordExtract(resumeText);
    const overlap = jobKeywords.filter((k) => resumeKeywords.includes(k));

    const keywordScore = Math.min(100, Math.round((overlap.length / Math.max(1, jobKeywords.length)) * 100));
    const skillsScore = Math.min(100, 35 + Math.round((resumeText.toLowerCase().match(/react|node|python|java|sql|aws|docker|kubernetes|testing|design/g) || []).length * 7));
    const experienceScore = Math.min(100, 40 + Math.round((resumeText.toLowerCase().match(/years|experience|led|built|delivered|optimized/g) || []).length * 6));
    const grammarScore = Math.min(100, 70 + Math.round(words.length / 25));
    const readabilityScore = Math.min(100, 58 + Math.round(words.length / 30));

    const sectionCompleteness = [
      /summary/i.test(resumeText),
      /experience/i.test(resumeText),
      /project/i.test(resumeText),
      /skill/i.test(resumeText),
      /education/i.test(resumeText),
    ].filter(Boolean).length * 20;

    const overallScore = Math.round((formattingScore + keywordScore + experienceScore + skillsScore + grammarScore + readabilityScore + sectionCompleteness) / 7);

    const missingKeywords = jobKeywords.filter((k) => !resumeKeywords.includes(k)).slice(0, 12);
    const weakSections: string[] = [];
    if (!/summary/i.test(resumeText)) weakSections.push('Professional Summary');
    if (!/project/i.test(resumeText)) weakSections.push('Projects');
    if (!/certification/i.test(resumeText)) weakSections.push('Certifications');

    const missingSkills = ['communication', 'leadership', 'problem solving', 'collaboration'].filter((s) => !resumeText.toLowerCase().includes(s));

    return {
      overallScore,
      formattingScore,
      keywordScore,
      experienceScore,
      skillsScore,
      grammarScore,
      readabilityScore,
      sectionCompleteness,
      missingKeywords,
      missingSkills,
      weakSections,
      actionableImprovements: [
        'Include measurable outcomes in each experience bullet.',
        'Mirror critical keywords from the job description naturally.',
        'Add a concise summary aligned to target role.',
        'Strengthen project section with architecture + impact.',
      ],
    };
  },

  optimizeResumeSections(input: {
    summary: string;
    experience: string;
    projects: string;
    skills: string;
    achievements: string;
  }): {
    summary: string;
    experience: string;
    projects: string;
    skills: string;
    achievements: string;
  } {
    const prefix = (label: string, text: string): string => `${label}: ${text}`;

    return {
      summary: prefix('ATS-friendly Summary', `${input.summary} Focused on business impact, stakeholder communication, and measurable outcomes.`),
      experience: prefix('Optimized Experience', `${input.experience} Delivered quantifiable results with cross-functional collaboration and automation.`),
      projects: prefix('Optimized Projects', `${input.projects} Highlighted architecture decisions, trade-offs, and scale impact.`),
      skills: prefix('Optimized Skills', `${input.skills} Prioritized role-relevant technical and communication skills.`),
      achievements: prefix('Optimized Achievements', `${input.achievements} Included numbers for growth, savings, efficiency, and delivery speed.`),
    };
  },

  generateCoverLetter(payload: {
    jobDescription: string;
    company: string;
    role: string;
    experience: string;
    tone: CoverLetterTone;
    candidateName: string;
  }): string {
    const toneLine = payload.tone === 'friendly'
      ? 'I am excited about the opportunity and the mission your team is building.'
      : payload.tone === 'executive'
        ? 'I bring a strategic and execution-focused track record aligned to high-growth business outcomes.'
        : 'I am writing to express strong interest in the role and to contribute immediately.';

    return [
      `Dear Hiring Team at ${payload.company},`,
      '',
      `I am applying for the ${payload.role} position. ${toneLine}`,
      `With ${payload.experience} and proven ability to deliver measurable outcomes, I can contribute to your hiring goals from day one.`,
      '',
      'I align well with the role requirements, especially around:',
      '- Stakeholder collaboration and communication',
      '- Execution excellence and delivery quality',
      '- Continuous improvement and learning mindset',
      '',
      `I would welcome the opportunity to discuss how I can add value at ${payload.company}.`,
      '',
      `Sincerely,`,
      payload.candidateName,
    ].join('\n');
  },

  async analyzeSkillGap(userId: string, jobId: string): Promise<SkillGapResult> {
    const context = await this.getCandidateContext(userId);
    const profileSkills = normalizeSkills(context.profile?.skills).map((s) => s.toLowerCase());
    const job = await jobService.getJobById(jobId).catch(() => null);
    const jobSkills = normalizeSkills(job?.skills).map((s) => s.toLowerCase());

    const matchingSkills = jobSkills.filter((s) => profileSkills.includes(s));
    const missingSkills = jobSkills.filter((s) => !profileSkills.includes(s));
    const prioritySkills = missingSkills.slice(0, 5);

    return {
      matchingSkills,
      missingSkills,
      recommendedSkills: Array.from(new Set([...missingSkills, ...['communication', 'problem solving', 'system design']])).slice(0, 12),
      learningPath: [
        'Week 1-2: Fundamentals and guided project',
        'Week 3-4: Build practical implementation',
        'Week 5-6: Mock interviews and peer review',
        'Week 7-8: Portfolio update and application sprint',
      ],
      prioritySkills,
    };
  },

  generateCareerRoadmap(window: CareerPlanWindow, targetRole: string): CareerRoadmapResult {
    const map: Record<CareerPlanWindow, CareerRoadmapResult> = {
      '3m': {
        window: '3m',
        technologies: ['TypeScript', 'SQL', 'Git', 'REST APIs'],
        certifications: ['Foundational Cloud Certification'],
        projects: ['Build 2 role-aligned projects with measurable outcomes'],
        careerGoals: [`Become interview-ready for ${targetRole} opportunities`],
      },
      '6m': {
        window: '6m',
        technologies: ['React', 'Node.js', 'Testing', 'System Design Basics'],
        certifications: ['Role-specific Associate Certification'],
        projects: ['Ship 1 end-to-end capstone and publish case study'],
        careerGoals: ['Reach consistent shortlist rate with targeted applications'],
      },
      '1y': {
        window: '1y',
        technologies: ['Cloud', 'CI/CD', 'Scalable Architecture'],
        certifications: ['Professional Certification Track'],
        projects: ['Lead or contribute to production-grade system'],
        careerGoals: ['Transition to mid-level ownership in chosen domain'],
      },
      '2y': {
        window: '2y',
        technologies: ['Distributed Systems', 'Observability', 'Performance Optimization'],
        certifications: ['Advanced Architecture Certification'],
        projects: ['Design and deliver high-scale platform module'],
        careerGoals: ['Move into lead responsibilities and mentoring'],
      },
      '5y': {
        window: '5y',
        technologies: ['Platform Strategy', 'Engineering Leadership', 'AI-enabled Workflows'],
        certifications: ['Leadership/Executive Credential'],
        projects: ['Drive roadmap-level initiatives with multi-team impact'],
        careerGoals: ['Achieve senior/leadership role with domain authority'],
      },
    };

    return map[window];
  },

  startMockInterview(interviewType: MockInterviewType, role = 'Software Engineer'): {
    interviewId: string;
    interviewType: MockInterviewType;
    role: string;
    questions: string[];
  } {
    const bank: Record<MockInterviewType, string[]> = {
      hr: [
        'Tell me about yourself and your recent impact.',
        'Why do you want to join this company?',
        'Describe a difficult challenge and how you solved it.',
      ],
      technical: [
        'Explain a project architecture you built recently.',
        'How do you debug production issues systematically?',
        'How do you improve performance in web applications?',
      ],
      behavioral: [
        'Tell me about a conflict in a team and your resolution approach.',
        'Describe a time you handled ambiguous requirements.',
        'How do you prioritize when everything is urgent?',
      ],
      coding: [
        'How would you optimize a slow endpoint returning large datasets?',
        'Walk through your approach to solving an unseen coding problem.',
        'How do you test edge cases in algorithmic solutions?',
      ],
      'system-design': [
        'Design a scalable job application notification system.',
        'How would you design multi-tenant analytics tracking?',
        'How do you handle reliability and failover in critical services?',
      ],
      'role-specific': [
        `What are the most important success metrics for a ${role}?`,
        `How would you create a 90-day impact plan for ${role}?`,
        `What domain tradeoffs are critical in ${role} decisions?`,
      ],
    };

    return {
      interviewId: makeId('mock_interview'),
      interviewType,
      role,
      questions: bank[interviewType],
    };
  },

  evaluateMockInterviewAnswer(answer: string): InterviewEvaluation {
    return evaluateAnswer(answer);
  },

  generateInterviewFeedback(evaluations: InterviewEvaluation[]): InterviewFeedbackReport {
    const avg = evaluations.length
      ? Math.round(evaluations.reduce((sum, e) => sum + e.overallRating, 0) / evaluations.length)
      : 0;

    return {
      strengths: ['Clear intent in answers', 'Good structure in problem explanation', 'Consistent communication tone'],
      weaknesses: ['Need stronger metric-backed outcomes', 'Can improve technical depth in tradeoff discussion'],
      commonMistakes: ['Overly generic examples', 'Missing concise conclusions'],
      recommendedPractice: ['Practice timed 90-second responses', 'Add one quantifiable outcome to each story', 'Do 2 mock rounds per week'],
      confidenceScore: avg,
    };
  },

  buildPortfolio(userId: string): Promise<{
    headline: string;
    projects: string[];
    skills: string[];
    experience: string[];
    resume: string;
    contact: string;
    socialLinks: { github: string; linkedin: string };
    livePreviewUrl: string;
  }> {
    return this.getCandidateContext(userId).then((ctx) => ({
      headline: String(ctx.profile?.bio || 'Career-focused professional portfolio'),
      projects: ['Project Alpha - scalable dashboard', 'Project Beta - automation workflow', 'Project Gamma - analytics insights'],
      skills: normalizeSkills(ctx.profile?.skills),
      experience: Array.isArray(ctx.profile?.work_experience) ? ctx.profile.work_experience.map((it: any) => String(it?.title || it || 'Experience')).slice(0, 8) : [],
      resume: String(ctx.profile?.resume_url || ctx.profile?.resumeUrl || 'Resume not uploaded'),
      contact: String(ctx.profile?.email || ''),
      socialLinks: {
        github: String(ctx.profile?.github_url || ''),
        linkedin: String(ctx.profile?.linkedin_url || ''),
      },
      livePreviewUrl: `https://portfolio.actro.ai/${userId.slice(0, 10)}`,
    }));
  },

  async getLearningRecommendations(userId: string, role: string): Promise<LearningRecommendations> {
    const ctx = await this.getCandidateContext(userId);
    const skills = normalizeSkills(ctx.profile?.skills);

    return {
      courses: [`Advanced ${role} Masterclass`, 'System Design for Scale', 'Practical Interview Preparation'],
      certifications: ['Cloud Fundamentals', 'Professional Role Certification', 'Security Basics'],
      books: ['Designing Data-Intensive Applications', 'Clean Code', 'The Pragmatic Programmer'],
      practicePlatforms: ['LeetCode', 'HackerRank', 'Exercism'],
      codingChallenges: ['30-day DSA sprint', 'Weekly system design challenge'],
      learningPath: [
        `Build on existing skills: ${skills.slice(0, 4).join(', ') || 'core fundamentals'}`,
        'Focus on one project every 2 weeks',
        'Practice interviews twice weekly',
      ],
    };
  },

  estimateSalary(payload: {
    skills: string[];
    experienceYears: number;
    location: string;
    role: string;
    industry: string;
  }): SalaryEstimate {
    const base = 350000;
    const skillBoost = Math.min(450000, payload.skills.length * 18000);
    const expBoost = Math.min(700000, payload.experienceYears * 90000);
    const locationMultiplier = payload.location.toLowerCase().includes('bangalore') || payload.location.toLowerCase().includes('hyderabad') ? 1.22 : 1.05;
    const industryMultiplier = payload.industry.toLowerCase().includes('finance') ? 1.18 : payload.industry.toLowerCase().includes('it') ? 1.15 : 1.0;

    const median = Math.round((base + skillBoost + expBoost) * locationMultiplier * industryMultiplier);
    return {
      expectedMin: Math.round(median * 0.78),
      expectedMax: Math.round(median * 1.28),
      median,
      confidence: Math.min(95, 60 + payload.experienceYears * 4 + payload.skills.length),
    };
  },

  getCareerInsights(): CareerInsights {
    return {
      trendingTechnologies: ['AI Engineering', 'TypeScript', 'Cloud Native', 'Platform Security', 'Data Engineering'],
      mostInDemandSkills: ['System Design', 'React', 'Python', 'SQL', 'Communication'],
      hiringCompanies: ['TCS', 'Infosys', 'Wipro', 'Accenture', 'Cognizant', 'Capgemini'],
      remoteOpportunities: ['Frontend Engineer', 'QA Automation', 'Data Analyst', 'Cloud Support Engineer'],
      emergingCareers: ['Prompt Engineer', 'AI Product Analyst', 'Platform Reliability Engineer'],
    };
  },

  async getApplicationAssistant(userId: string, jobId: string): Promise<ApplicationAssistantResult> {
    const ctx = await this.getCandidateContext(userId);
    const job = await jobService.getJobById(jobId).catch(() => null);

    const candidateSkills = normalizeSkills(ctx.profile?.skills).map((s) => s.toLowerCase());
    const jobSkills = normalizeSkills(job?.skills).map((s) => s.toLowerCase());
    const matched = jobSkills.filter((s) => candidateSkills.includes(s));
    const missing = jobSkills.filter((s) => !candidateSkills.includes(s));
    const matchScore = Math.min(100, Math.round((matched.length / Math.max(1, jobSkills.length)) * 100));

    const coverLetter = this.generateCoverLetter({
      company: String(job?.company_name || 'the company'),
      role: String(job?.title || 'the role'),
      experience: String(ctx.profile?.experience || 'relevant professional experience'),
      tone: 'professional',
      candidateName: String(ctx.profile?.name || 'Candidate'),
      jobDescription: String(job?.description || ''),
    });

    return {
      matchScore,
      resumeImprovements: [
        'Align summary with role keywords.',
        'Move high-impact projects above older experiences.',
        'Add metrics for ownership and outcomes.',
      ],
      missingSkills: missing,
      coverLetter,
      applicationTips: [
        'Submit application with role-specific resume variant.',
        'Follow up in 48 hours with concise recruiter message.',
        'Prepare one project walkthrough for the first interview.',
      ],
    };
  },

  async getJobTracker(userId: string): Promise<JobTrackerSummary> {
    const ctx = await this.getCandidateContext(userId);
    const apps = ctx.applications;

    const timeline = apps.slice(0, 20).map((app: any) => ({
      date: String(app.applied_at || app.created_at || nowIso()),
      event: `${app?.jobs?.title || 'Application'} - ${String(app.status || 'applied')}`,
    }));

    return {
      savedJobs: ctx.savedJobs.length,
      appliedJobs: apps.length,
      interviewStage: apps.filter((a: any) => ['shortlisted', 'under_review'].includes(String(a.status || '').toLowerCase())).length,
      offerStage: apps.filter((a: any) => String(a.status || '').toLowerCase() === 'accepted').length,
      rejectedJobs: apps.filter((a: any) => String(a.status || '').toLowerCase() === 'rejected').length,
      timeline,
    };
  },

  async getAiNotifications(userId: string): Promise<Array<{ id: string; type: string; message: string; at: string }>> {
    const [overview, tracker] = await Promise.all([
      this.getDashboardOverview(userId),
      this.getJobTracker(userId),
    ]);

    const generated: Array<{ id: string; type: string; message: string; at: string }> = [];

    if (overview.profileCompletion < 85) {
      generated.push({ id: makeId('n'), type: 'resume_update', message: 'Resume needs update to improve shortlist chances.', at: nowIso() });
    }
    if (tracker.savedJobs > 0) {
      generated.push({ id: makeId('n'), type: 'matching_jobs', message: 'New matching jobs detected in your saved categories.', at: nowIso() });
    }
    generated.push({ id: makeId('n'), type: 'interview_prep', message: 'Interview preparation reminder: complete 2 mock sessions this week.', at: nowIso() });
    generated.push({ id: makeId('n'), type: 'cert_recommendation', message: 'Recommended certification track updated based on your role goals.', at: nowIso() });
    generated.push({ id: makeId('n'), type: 'trending_skills', message: 'Trending skills this week: TypeScript, AI workflows, system design.', at: nowIso() });
    generated.push({ id: makeId('n'), type: 'salary_improvement', message: 'Salary potential can increase with one advanced certification and project case study.', at: nowIso() });

    const store = readStore();
    store.notifications = [...generated, ...store.notifications.filter((n) => n.userId === userId)].slice(0, 300);
    writeStore(store);

    return generated;
  },

  async getAchievements(userId: string): Promise<BadgeAchievement[]> {
    const [ctx, perms, tracker] = await Promise.all([
      this.getCandidateContext(userId),
      this.getPermissions(userId),
      this.getJobTracker(userId),
    ]);

    const completion = profileCompletion(ctx.profile);
    const apps = tracker.appliedJobs;
    const interviews = tracker.interviewStage;

    return [
      { key: 'resume_completed', label: 'Resume Completed', unlocked: completion >= 90, criteria: 'Reach profile/resume completion >= 90%' },
      { key: 'hundred_applications', label: '100 Applications', unlocked: apps >= 100, criteria: 'Submit 100 applications' },
      { key: 'interview_cleared', label: 'Interview Cleared', unlocked: interviews >= 1, criteria: 'Reach interview stage at least once' },
      { key: 'skill_certified', label: 'Skill Certified', unlocked: normalizeSkills(ctx.profile?.skills).length >= 8, criteria: 'Add 8+ validated skills' },
      { key: 'top_profile', label: 'Top Profile', unlocked: completion >= 95 && apps >= 10, criteria: '95% profile and active applications' },
      { key: 'premium_candidate', label: 'Premium Candidate', unlocked: perms.isPremium, criteria: 'Active premium subscription' },
    ];
  },

  async generateReports(userId: string): Promise<CareerHubReportBundle> {
    const [overview, tracker, achievements] = await Promise.all([
      this.getDashboardOverview(userId),
      this.getJobTracker(userId),
      this.getAchievements(userId),
    ]);

    const careerProgressReport = [
      '# Career Progress Report',
      `Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`,
      `Profile Completion: ${overview.profileCompletion}%`,
      `Career Readiness: ${overview.careerReadinessScore}%`,
      `Applications: ${overview.applications}`,
      `Interview Invitations: ${overview.interviewInvitations}`,
    ].join('\n');

    const resumeReport = [
      '# Resume Report',
      `Resume Score: ${overview.resumeScore}%`,
      `ATS Resume Score: ${overview.atsResumeScore}%`,
      'Recommendations: optimize summary, keyword coverage, and quantified achievements.',
    ].join('\n');

    const skillReport = [
      '# Skill Report',
      `Skill Score: ${overview.skillScore}%`,
      'Focus Areas: system design, communication, domain depth, portfolio proof points.',
    ].join('\n');

    const interviewReport = [
      '# Interview Report',
      `Interview Invitations: ${overview.interviewInvitations}`,
      'Practice Plan: 2 mock interviews/week with STAR-based refinement.',
    ].join('\n');

    const applicationReport = [
      '# Application Report',
      `Saved Jobs: ${tracker.savedJobs}`,
      `Applied Jobs: ${tracker.appliedJobs}`,
      `Offer Stage: ${tracker.offerStage}`,
      `Rejected Jobs: ${tracker.rejectedJobs}`,
      `Badges Unlocked: ${achievements.filter((a) => a.unlocked).length}`,
    ].join('\n');

    return {
      careerProgressReport,
      resumeReport,
      skillReport,
      interviewReport,
      applicationReport,
    };
  },

  downloadReport(content: string, formatType: 'pdf' | 'docx'): string {
    return `Downloaded as ${formatType.toUpperCase()}\n\n${content}`;
  },

  async getIntegrationSummary(userId: string): Promise<IntegrationSummary> {
    const ctx = await this.getCandidateContext(userId);

    return {
      candidateDashboard: true,
      resume: Boolean(ctx.profile?.resume_url || ctx.profile?.resumeUrl),
      jobs: true,
      applications: ctx.applications.length >= 0,
      messaging: ctx.conversations.length >= 0,
      interviewManagement: ctx.applications.some((a: any) => ['shortlisted', 'under_review', 'accepted'].includes(String(a.status || '').toLowerCase())),
      analytics: true,
      recruiterAi: true,
    };
  },

  async publishAiNotifications(userId: string): Promise<void> {
    const notes = await this.getAiNotifications(userId);
    await Promise.all(notes.slice(0, 4).map((note) =>
      notificationService.createNotification(userId, 'application_status', 'AI Career Hub', note.message, { type: note.type })
        .catch(() => null)
    ));
  },

  getPortfolioLivePreviewUrl(userId: string): string {
    return `https://portfolio.actro.ai/${userId.slice(0, 10)}?preview=true`;
  },

  getSavedPromptsSeed(userId: string): SavedPrompt[] {
    const existing = this.listSavedPrompts(userId);
    if (existing.length > 0) return existing;

    const seeds: Array<{ title: string; prompt: string }> = [
      { title: 'Resume Rewrite Prompt', prompt: 'Rewrite my summary for ATS and recruiter clarity.' },
      { title: 'Interview Prep Prompt', prompt: 'Ask me 5 technical interview questions with feedback.' },
      { title: 'Job Match Prompt', prompt: 'Analyze this job and tell me top 5 gaps to close.' },
    ];

    seeds.forEach((seed) => {
      this.savePrompt(userId, seed.title, seed.prompt);
    });

    return this.listSavedPrompts(userId);
  },

  getChatHistory(userId: string): CareerChatThread[] {
    return this.listChatThreads(userId);
  },

  getPinnedChats(userId: string): CareerChatThread[] {
    return this.listChatThreads(userId).filter((t) => t.pinned);
  },

  getUpcomingRoadmapMilestones(window: CareerPlanWindow): Array<{ title: string; dueAt: string }> {
    const days = window === '3m' ? 90 : window === '6m' ? 180 : window === '1y' ? 365 : window === '2y' ? 730 : 1825;

    return [
      { title: 'Skill sprint checkpoint', dueAt: addDays(new Date(), Math.round(days * 0.25)).toISOString() },
      { title: 'Project portfolio checkpoint', dueAt: addDays(new Date(), Math.round(days * 0.5)).toISOString() },
      { title: 'Interview readiness checkpoint', dueAt: addDays(new Date(), Math.round(days * 0.75)).toISOString() },
      { title: 'Role transition milestone', dueAt: addDays(new Date(), days).toISOString() },
    ];
  },
};
