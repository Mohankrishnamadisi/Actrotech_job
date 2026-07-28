import { differenceInCalendarDays, format } from 'date-fns';
import { recruiterService, jobService } from '@services/api';
import { getRecruiterAnalyticsData } from '@services/recruiterAnalytics';
import { listInterviews } from '@services/interviewManagement';
import { messagingService } from '@services/messaging';
import { supabase } from '@services/supabase';
import type { Job } from '@types';

export type CopilotRole = 'user' | 'assistant' | 'system';

export interface CopilotMessage {
  id: string;
  role: CopilotRole;
  content: string;
  createdAt: string;
}

export interface CopilotConversation {
  id: string;
  recruiterId: string;
  title: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  messages: CopilotMessage[];
}

export interface SavedPrompt {
  id: string;
  recruiterId: string;
  title: string;
  prompt: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AiRequestRecord {
  id: string;
  recruiterId: string;
  type:
    | 'chat'
    | 'job_description'
    | 'resume_analysis'
    | 'candidate_match'
    | 'interview_questions'
    | 'offer'
    | 'message'
    | 'insights'
    | 'comparison'
    | 'search'
    | 'meeting_summary'
    | 'report';
  title: string;
  input: string;
  output: string;
  createdAt: string;
  meta?: Record<string, unknown>;
}

export interface CandidateContextRow {
  applicationId: string;
  candidateId: string;
  candidateName: string;
  email: string;
  location: string;
  skills: string[];
  experienceYears: number;
  status: string;
  atsStage: string;
  resumeUrl: string;
  matchScore: number;
  jobId: string;
  jobTitle: string;
  workMode: string;
  appliedAt: string;
  updatedAt: string;
  notesCount: number;
}

export interface RecruiterAiContext {
  recruiterId: string;
  recruiterProfile: Record<string, any> | null;
  jobs: Job[];
  candidates: CandidateContextRow[];
  interviews: Array<Record<string, any>>;
  messagesUnread: number;
  analytics: {
    responseRate: number;
    rejectionRate: number;
    avgTimeToHireDays: number;
    lowPerformingJobs: string[];
  };
  kpis: {
    aiRequestsToday: number;
    jobsOptimized: number;
    candidatesAnalyzed: number;
    interviewQuestionsGenerated: number;
    resumesReviewed: number;
    hiringRecommendations: number;
    automationSuggestions: number;
  };
}

interface AiStore {
  conversations: CopilotConversation[];
  savedPrompts: SavedPrompt[];
  requestHistory: AiRequestRecord[];
}

export interface JobDescriptionPayload {
  title: string;
  department: string;
  location: string;
  experience: string;
  employmentType: string;
  workMode: string;
  skills: string[];
  tone: 'professional' | 'simple' | 'friendly';
  existingText?: string;
}

export interface ResumeAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  skillMatch: number;
  matchingSkills: string[];
  missingSkills: string[];
  experienceHighlights: string[];
  educationSummary: string;
  careerGrowth: string;
  recommendation: string;
  overallScore: number;
}

export interface CandidateMatchReport {
  matchScore: number;
  explanation: string;
  matchingSkills: string[];
  missingSkills: string[];
  riskFactors: string[];
  interviewTopics: string[];
  hiringRecommendation: string;
}

export interface InterviewQuestionPack {
  technical: string[];
  hr: string[];
  behavioral: string[];
  scenario: string[];
  coding: string[];
  roleSpecific: string[];
  scorecard: string;
}

export interface CandidateComparisonResult {
  tableMarkdown: string;
  pros: string[];
  cons: string[];
  bestFit: string;
  riskAnalysis: string;
  recommendedCandidate: string;
}

const STORAGE_KEY = 'actro_ai_hiring_assistant_v1';

const skillCorpus = [
  'react', 'typescript', 'javascript', 'node', 'python', 'java', 'spring', 'aws', 'azure', 'gcp',
  'docker', 'kubernetes', 'sql', 'postgres', 'mongodb', 'redis', 'graphql', 'rest', 'html', 'css',
  'tailwind', 'mui', 'figma', 'testing', 'jest', 'cypress', 'playwright', 'devops', 'ci/cd',
  'machine learning', 'nlp', 'llm', 'product', 'communication', 'leadership', 'agile',
];

const makeId = (prefix: string): string => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const safeParse = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const readStore = (): AiStore => safeParse<AiStore>(localStorage.getItem(STORAGE_KEY), {
  conversations: [],
  savedPrompts: [],
  requestHistory: [],
});

const writeStore = (store: AiStore): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

const normalizeText = (value: unknown): string => String(value || '').trim().toLowerCase();

const tokenizeSkills = (input: string): string[] => {
  const text = normalizeText(input);
  return skillCorpus.filter((skill) => text.includes(skill));
};

const parseYears = (value: unknown): number => {
  const text = String(value || '').trim().toLowerCase();
  const rangeMatch = text.match(/(\d+)\s*(?:-|to)\s*(\d+)/i);
  if (rangeMatch) {
    const min = Number(rangeMatch[1]);
    const max = Number(rangeMatch[2]);
    return Math.round((min + max) / 2);
  }

  const plusMatch = text.match(/(\d+)\s*\+/);
  if (plusMatch) return Number(plusMatch[1]);

  const numMatch = text.match(/(\d+)/);
  if (numMatch) return Number(numMatch[1]);
  return 0;
};

const toWords = (input: string): string[] =>
  input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

const cap = (value: number, min = 0, max = 100): number => Math.max(min, Math.min(max, value));

const unique = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)));

const buildConversationTitle = (prompt: string): string => {
  const trimmed = String(prompt || '').trim();
  if (!trimmed) return 'New Conversation';
  if (trimmed.length <= 56) return trimmed;
  return `${trimmed.slice(0, 56)}...`;
};

const ensureConversationOwnership = (conversation: CopilotConversation, recruiterId: string): void => {
  if (conversation.recruiterId !== recruiterId) {
    throw new Error('Permission denied: recruiter can only access own conversations.');
  }
};

const formatNow = (): string => new Date().toISOString();

const markdownScorecard = (): string => [
  '| Criteria | Score (1-5) | Notes |',
  '|---|---:|---|',
  '| Technical depth |  |  |',
  '| Problem solving |  |  |',
  '| Communication |  |  |',
  '| Ownership |  |  |',
  '| Culture fit |  |  |',
  '| Overall decision |  | Hire / Hold / Reject |',
].join('\n');

const makeSuggestionsFromContext = (context: RecruiterAiContext): string[] => {
  const tips: string[] = [];
  const totalCandidates = context.candidates.length;
  const shortlisted = context.candidates.filter((item) => normalizeText(item.status) === 'shortlisted').length;
  const pendingFeedback = context.interviews.filter((item) => !item.feedback).length;
  const lowMatch = context.candidates.filter((item) => item.matchScore > 0 && item.matchScore < 40).length;

  if (totalCandidates > 0 && shortlisted > 0 && pendingFeedback > 0) {
    tips.push(`Candidates are waiting for feedback: ${pendingFeedback} interviews need closure.`);
  }
  if (context.analytics.rejectionRate > 55) {
    tips.push('High rejection rate detected. Review JD clarity, must-have filters, and screening criteria.');
  }
  if (context.analytics.responseRate < 35) {
    tips.push('Low response rate detected. Improve outreach message personalization and response SLAs.');
  }
  if (context.analytics.lowPerformingJobs.length > 0) {
    tips.push(`Low performing jobs: ${context.analytics.lowPerformingJobs.slice(0, 3).join(', ')}.`);
  }
  if (lowMatch >= 6) {
    tips.push('Many low-match candidates are in the funnel. Tighten skill filters or update role requirements.');
  }

  const highMatchWaiting = context.candidates.filter((item) => item.matchScore >= 75 && normalizeText(item.status) !== 'accepted').length;
  if (highMatchWaiting > 0) {
    tips.push(`You have ${highMatchWaiting} high-match candidates waiting for next action.`);
  }

  return tips.slice(0, 8);
};

const makeInsightReport = (context: RecruiterAiContext): string => {
  const total = context.candidates.length;
  const byStage = context.candidates.reduce<Record<string, number>>((acc, item) => {
    const key = item.atsStage || item.status || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const delayedInterviews = context.interviews.filter((item) => {
    const dateText = `${item.date || ''}T${item.time || '00:00'}:00`;
    const dt = new Date(dateText);
    return !Number.isNaN(dt.getTime()) && dt < new Date() && normalizeText(item.status) === 'scheduled';
  }).length;

  const noNotes = context.candidates.filter((item) => item.notesCount === 0).length;
  const lowSalaryHints = context.jobs
    .filter((job) => Number(job.salary_max || job.salaryMax || 0) > 0)
    .filter((job) => Number(job.salary_max || job.salaryMax || 0) < 700000)
    .map((job) => String(job.title || 'Untitled Job'));

  const lines = [
    '## Hiring Insights',
    '',
    `- Total candidates in funnel: **${total}**`,
    `- Response rate: **${context.analytics.responseRate}%**`,
    `- Rejection rate: **${context.analytics.rejectionRate}%**`,
    `- Average time-to-hire: **${context.analytics.avgTimeToHireDays} days**`,
    `- Delayed interviews: **${delayedInterviews}**`,
    `- Candidates without feedback notes: **${noNotes}**`,
    '',
    '### Funnel Bottlenecks',
  ];

  Object.entries(byStage)
    .sort((a, b) => b[1] - a[1])
    .forEach(([stage, count]) => {
      lines.push(`- ${stage}: ${count}`);
    });

  lines.push('', '### Actionable Recommendations');
  makeSuggestionsFromContext(context).forEach((tip) => lines.push(`- ${tip}`));

  if (lowSalaryHints.length > 0) {
    lines.push(`- Jobs needing salary review: ${lowSalaryHints.slice(0, 4).join(', ')}`);
  }

  lines.push('- Improve low-performing job descriptions with clearer outcomes and must-have skills.');
  lines.push('- Schedule interviews for shortlisted candidates within 48 hours to reduce drop-off.');

  return lines.join('\n');
};

const toReadableDifficulty = (difficulty: 'easy' | 'medium' | 'hard'): string =>
  difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

const parsePromptForAction = (prompt: string): AiRequestRecord['type'] => {
  const p = normalizeText(prompt);
  if (p.includes('job description') || p.includes('jd')) return 'job_description';
  if (p.includes('resume')) return 'resume_analysis';
  if (p.includes('match')) return 'candidate_match';
  if (p.includes('interview')) return 'interview_questions';
  if (p.includes('offer')) return 'offer';
  if (p.includes('message') || p.includes('email')) return 'message';
  if (p.includes('insight') || p.includes('bottleneck')) return 'insights';
  if (p.includes('compare')) return 'comparison';
  if (p.includes('search') || p.includes('find')) return 'search';
  if (p.includes('summary') || p.includes('meeting')) return 'meeting_summary';
  if (p.includes('report')) return 'report';
  return 'chat';
};

const makeTable = (rows: Array<Record<string, string | number>>): string => {
  if (rows.length === 0) return 'No data available.';
  const headers = Object.keys(rows[0]);
  const head = `| ${headers.join(' | ')} |`;
  const sep = `|${headers.map(() => '---').join('|')}|`;
  const body = rows.map((row) => `| ${headers.map((header) => String(row[header] ?? '')).join(' | ')} |`).join('\n');
  return [head, sep, body].join('\n');
};

export const aiHiringAssistantService = {
  listConversations(recruiterId: string, search = ''): CopilotConversation[] {
    const text = normalizeText(search);
    return readStore()
      .conversations
      .filter((item) => item.recruiterId === recruiterId)
      .filter((item) => {
        if (!text) return true;
        return normalizeText(`${item.title} ${item.messages.map((msg) => msg.content).join(' ')}`).includes(text);
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  },

  createConversation(recruiterId: string, title = 'New Conversation'): CopilotConversation {
    const store = readStore();
    const now = formatNow();
    const conversation: CopilotConversation = {
      id: makeId('copilot_conv'),
      recruiterId,
      title,
      pinned: false,
      createdAt: now,
      updatedAt: now,
      messages: [],
    };

    store.conversations.unshift(conversation);
    writeStore(store);
    return conversation;
  },

  getConversation(recruiterId: string, conversationId: string): CopilotConversation | null {
    const conversation = readStore().conversations.find((item) => item.id === conversationId);
    if (!conversation) return null;
    ensureConversationOwnership(conversation, recruiterId);
    return conversation;
  },

  saveConversation(recruiterId: string, conversation: CopilotConversation): CopilotConversation {
    ensureConversationOwnership(conversation, recruiterId);
    const store = readStore();
    const index = store.conversations.findIndex((item) => item.id === conversation.id);
    if (index < 0) throw new Error('Conversation not found.');
    store.conversations[index] = { ...conversation, updatedAt: formatNow() };
    writeStore(store);
    return store.conversations[index];
  },

  renameConversation(recruiterId: string, conversationId: string, title: string): CopilotConversation {
    const store = readStore();
    const index = store.conversations.findIndex((item) => item.id === conversationId);
    if (index < 0) throw new Error('Conversation not found.');
    ensureConversationOwnership(store.conversations[index], recruiterId);
    store.conversations[index] = {
      ...store.conversations[index],
      title: title.trim() || 'Untitled Conversation',
      updatedAt: formatNow(),
    };
    writeStore(store);
    return store.conversations[index];
  },

  deleteConversation(recruiterId: string, conversationId: string): void {
    const store = readStore();
    const target = store.conversations.find((item) => item.id === conversationId);
    if (!target) return;
    ensureConversationOwnership(target, recruiterId);
    store.conversations = store.conversations.filter((item) => item.id !== conversationId);
    writeStore(store);
  },

  pinConversation(recruiterId: string, conversationId: string, pinned: boolean): CopilotConversation {
    const store = readStore();
    const index = store.conversations.findIndex((item) => item.id === conversationId);
    if (index < 0) throw new Error('Conversation not found.');
    ensureConversationOwnership(store.conversations[index], recruiterId);
    store.conversations[index] = { ...store.conversations[index], pinned, updatedAt: formatNow() };
    writeStore(store);
    return store.conversations[index];
  },

  addMessage(recruiterId: string, conversationId: string, message: Omit<CopilotMessage, 'id' | 'createdAt'>): CopilotConversation {
    const store = readStore();
    const index = store.conversations.findIndex((item) => item.id === conversationId);
    if (index < 0) throw new Error('Conversation not found.');

    const conversation = store.conversations[index];
    ensureConversationOwnership(conversation, recruiterId);

    const nextMessage: CopilotMessage = {
      id: makeId('copilot_msg'),
      role: message.role,
      content: message.content,
      createdAt: formatNow(),
    };

    const nextTitle = conversation.messages.length === 0 && message.role === 'user'
      ? buildConversationTitle(message.content)
      : conversation.title;

    store.conversations[index] = {
      ...conversation,
      title: nextTitle,
      messages: [...conversation.messages, nextMessage],
      updatedAt: formatNow(),
    };

    writeStore(store);
    return store.conversations[index];
  },

  exportConversation(recruiterId: string, conversationId: string): { fileName: string; content: string } {
    const conversation = this.getConversation(recruiterId, conversationId);
    if (!conversation) throw new Error('Conversation not found.');

    const lines: string[] = [`# ${conversation.title}`, '', `Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, ''];
    conversation.messages.forEach((msg) => {
      lines.push(`## ${msg.role.toUpperCase()} (${format(new Date(msg.createdAt), 'dd MMM yyyy, hh:mm a')})`);
      lines.push(msg.content);
      lines.push('');
    });

    return {
      fileName: `${conversation.title.replace(/[^a-z0-9]+/gi, '_').toLowerCase() || 'conversation'}.md`,
      content: lines.join('\n'),
    };
  },

  listSavedPrompts(recruiterId: string, search = ''): SavedPrompt[] {
    const text = normalizeText(search);
    return readStore()
      .savedPrompts
      .filter((item) => item.recruiterId === recruiterId)
      .filter((item) => !text || normalizeText(`${item.title} ${item.prompt}`).includes(text))
      .sort((a, b) => {
        if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  },

  savePrompt(recruiterId: string, payload: { title: string; prompt: string }): SavedPrompt {
    const store = readStore();
    const now = formatNow();
    const item: SavedPrompt = {
      id: makeId('copilot_prompt'),
      recruiterId,
      title: payload.title.trim() || buildConversationTitle(payload.prompt),
      prompt: payload.prompt.trim(),
      favorite: false,
      createdAt: now,
      updatedAt: now,
    };

    store.savedPrompts.unshift(item);
    writeStore(store);
    return item;
  },

  togglePromptFavorite(recruiterId: string, promptId: string, favorite: boolean): SavedPrompt {
    const store = readStore();
    const index = store.savedPrompts.findIndex((item) => item.id === promptId);
    if (index < 0) throw new Error('Saved prompt not found.');
    if (store.savedPrompts[index].recruiterId !== recruiterId) throw new Error('Permission denied.');

    store.savedPrompts[index] = {
      ...store.savedPrompts[index],
      favorite,
      updatedAt: formatNow(),
    };

    writeStore(store);
    return store.savedPrompts[index];
  },

  deletePrompt(recruiterId: string, promptId: string): void {
    const store = readStore();
    const target = store.savedPrompts.find((item) => item.id === promptId);
    if (!target) return;
    if (target.recruiterId !== recruiterId) throw new Error('Permission denied.');
    store.savedPrompts = store.savedPrompts.filter((item) => item.id !== promptId);
    writeStore(store);
  },

  listRequestHistory(recruiterId: string, search = ''): AiRequestRecord[] {
    const text = normalizeText(search);
    return readStore()
      .requestHistory
      .filter((item) => item.recruiterId === recruiterId)
      .filter((item) => !text || normalizeText(`${item.title} ${item.input} ${item.output}`).includes(text))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  logRequest(record: Omit<AiRequestRecord, 'id' | 'createdAt'>): AiRequestRecord {
    const store = readStore();
    const item: AiRequestRecord = {
      id: makeId('copilot_req'),
      createdAt: formatNow(),
      ...record,
    };

    store.requestHistory.unshift(item);
    store.requestHistory = store.requestHistory.slice(0, 5000);
    writeStore(store);
    return item;
  },

  getKpiSummary(recruiterId: string): RecruiterAiContext['kpis'] {
    const records = this.listRequestHistory(recruiterId);
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayRequests = records.filter((item) => item.createdAt.startsWith(today));

    const countByType = (type: AiRequestRecord['type']) => records.filter((item) => item.type === type).length;

    return {
      aiRequestsToday: todayRequests.length,
      jobsOptimized: countByType('job_description'),
      candidatesAnalyzed: countByType('candidate_match') + countByType('comparison'),
      interviewQuestionsGenerated: countByType('interview_questions'),
      resumesReviewed: countByType('resume_analysis'),
      hiringRecommendations: countByType('insights') + countByType('report'),
      automationSuggestions: Math.max(0, countByType('insights') - Math.floor(countByType('insights') / 4)),
    };
  },

  async buildRecruiterContext(recruiterId: string): Promise<RecruiterAiContext> {
    const [profile, jobs, conversations, analyticsResult, interviews] = await Promise.all([
      recruiterService.getRecruiterProfile(recruiterId).catch(() => null),
      jobService.getRecruiterJobs(recruiterId).catch(() => []),
      messagingService.getConversations(recruiterId).catch(() => []),
      getRecruiterAnalyticsData(recruiterId, {}).catch(() => null),
      listInterviews(recruiterId).catch(() => []),
    ]);

    const jobIds = (jobs || []).map((job) => String(job.id));

    let candidates: CandidateContextRow[] = [];
    if (jobIds.length > 0) {
      const { data } = await supabase
        .from('job_applications')
        .select('id, job_id, user_id, status, ats_stage, match_score, resume_url, created_at, updated_at, profiles(*), jobs(id, title, work_mode), candidate_notes(count)')
        .in('job_id', jobIds)
        .order('updated_at', { ascending: false });

      candidates = ((data || []) as any[]).map((row) => ({
        applicationId: String(row.id || ''),
        candidateId: String(row.user_id || ''),
        candidateName: String(row?.profiles?.name || row?.profiles?.full_name || 'Candidate'),
        email: String(row?.profiles?.email || ''),
        location: String(row?.profiles?.location || ''),
        skills: Array.isArray(row?.profiles?.skills)
          ? row.profiles.skills.map((item: unknown) => String(item || '').trim()).filter(Boolean)
          : tokenizeSkills(String(row?.profiles?.headline || row?.profiles?.bio || '')),
        experienceYears: Number(row?.profiles?.experience_years || parseYears(row?.profiles?.experience || '0')),
        status: String(row?.status || ''),
        atsStage: String(row?.ats_stage || row?.status || 'Applied'),
        resumeUrl: String(row?.resume_url || row?.profiles?.resume_url || ''),
        matchScore: Number(row?.match_score || 0),
        jobId: String(row?.job_id || ''),
        jobTitle: String(row?.jobs?.title || jobs.find((item) => String(item.id) === String(row?.job_id))?.title || 'Untitled Job'),
        workMode: String(row?.jobs?.work_mode || ''),
        appliedAt: String(row?.created_at || ''),
        updatedAt: String(row?.updated_at || row?.created_at || ''),
        notesCount: Number(row?.candidate_notes?.[0]?.count || 0),
      }));
    }

    const totalCandidates = candidates.length;
    const rejectedCount = candidates.filter((item) => normalizeText(item.status) === 'rejected').length;
    const underReviewCount = candidates.filter((item) => normalizeText(item.status) === 'under_review').length;
    const responded = conversations.reduce((sum: number, conv: any) => sum + Number(conv?.unreadCount || 0), 0);

    const lowPerformingJobs = (jobs || [])
      .filter((job) => {
        const perJob = candidates.filter((candidate) => candidate.jobId === String(job.id));
        const applications = perJob.length;
        const highMatch = perJob.filter((candidate) => candidate.matchScore >= 70).length;
        return applications < 4 || highMatch < 2;
      })
      .map((job) => String(job.title || 'Untitled Job'));

    const responseRate = totalCandidates > 0 ? cap(Math.round(((totalCandidates - responded) / totalCandidates) * 100)) : 0;
    const rejectionRate = totalCandidates > 0 ? cap(Math.round((rejectedCount / totalCandidates) * 100)) : 0;

    const avgTimeToHireDays = analyticsResult?.timeMetrics?.averageTimeToHireDays
      ? Math.round(Number(analyticsResult.timeMetrics.averageTimeToHireDays))
      : underReviewCount > 0
        ? Math.max(7, Math.round((totalCandidates * 2) / Math.max(1, underReviewCount)))
        : 0;

    return {
      recruiterId,
      recruiterProfile: profile,
      jobs,
      candidates,
      interviews,
      messagesUnread: responded,
      analytics: {
        responseRate,
        rejectionRate,
        avgTimeToHireDays,
        lowPerformingJobs,
      },
      kpis: this.getKpiSummary(recruiterId),
    };
  },

  generateJobDescription(payload: JobDescriptionPayload, recruiterContext?: RecruiterAiContext): string {
    const skills = unique(payload.skills.map((item) => item.trim()).filter(Boolean));
    const toneHint = payload.tone === 'simple'
      ? 'Use clear, concise language and avoid jargon.'
      : payload.tone === 'friendly'
        ? 'Keep the tone warm, inviting, and human.'
        : 'Use a formal and professional tone.';

    const companyName = String(recruiterContext?.recruiterProfile?.company_name || recruiterContext?.recruiterProfile?.companyName || 'Our Company');

    const responsibilities = [
      `Own end-to-end delivery for ${payload.title} initiatives with measurable outcomes.`,
      'Collaborate with product, design, and engineering teams to ship high-quality features.',
      'Translate business goals into scalable technical or operational solutions.',
      'Monitor key metrics and continuously improve user and hiring outcomes.',
      'Document architecture/decisions and mentor team members where needed.',
    ];

    const requirements = [
      `${payload.experience || '3+ years'} of relevant experience.`,
      ...skills.slice(0, 8).map((skill) => `Hands-on proficiency in ${skill}.`),
      'Strong communication and stakeholder management skills.',
      'Ability to work in a fast-paced, outcome-driven environment.',
    ];

    const niceToHave = [
      'Experience with AI-enabled workflows and automation-first delivery.',
      'Exposure to analytics, experimentation, and data-informed decisions.',
      'Mentoring experience and ability to drive cross-functional collaboration.',
    ];

    const benefits = [
      'Flexible work setup and supportive team culture.',
      'Learning and certification budget for continuous growth.',
      'Performance-oriented career progression framework.',
      'Comprehensive wellness and leave support.',
    ];

    const hiringProcess = [
      'Recruiter screening (20-30 mins)',
      'Technical/functional round',
      'Managerial and culture-fit round',
      'Final discussion and offer rollout',
    ];

    const titleSeo = `${payload.title} (${payload.location || 'Multiple Locations'}) - ${payload.workMode || 'Hybrid'} ${payload.employmentType || 'Full-Time'} Role`;

    const blocks = [
      `# ${payload.title || 'Job Role'}`,
      '',
      `**Department:** ${payload.department || 'Engineering'}`,
      `**Location:** ${payload.location || 'Not specified'}`,
      `**Experience:** ${payload.experience || 'Not specified'}`,
      `**Employment Type:** ${payload.employmentType || 'Full-Time'}`,
      `**Work Mode:** ${payload.workMode || 'Hybrid'}`,
      '',
      '## Professional Rewrite',
      payload.existingText
        ? `${payload.existingText.trim()}\n\nRewritten with clarity and stronger role outcomes for better candidate conversion.`
        : `${companyName} is hiring a ${payload.title} to build high-impact outcomes for customers and internal teams.`,
      '',
      '## Simplified Version',
      `We are looking for a ${payload.title} who can solve problems, work with teams, and deliver reliable results.`,
      '',
      '## Responsibilities',
      ...responsibilities.map((item) => `- ${item}`),
      '',
      '## Requirements',
      ...requirements.map((item) => `- ${item}`),
      '',
      '## Nice-to-have Skills',
      ...niceToHave.map((item) => `- ${item}`),
      '',
      '## Benefits',
      ...benefits.map((item) => `- ${item}`),
      '',
      '## Company Description',
      `${companyName} is focused on building scalable products and meaningful candidate experiences with a people-first culture.`,
      '',
      '## Hiring Process',
      ...hiringProcess.map((step, index) => `${index + 1}. ${step}`),
      '',
      '## SEO Optimized Job Title',
      `- ${titleSeo}`,
      '',
      `> Tone note: ${toneHint}`,
    ];

    return blocks.join('\n');
  },

  analyzeResume(resumeText: string, job: Job | null): ResumeAnalysis {
    const text = String(resumeText || '').trim();
    const words = toWords(text);
    const candidateSkills = unique(skillCorpus.filter((skill) => text.toLowerCase().includes(skill)));
    const jobSkills = job?.skills?.map((item) => String(item || '').toLowerCase()) || [];
    const matched = jobSkills.filter((skill) => candidateSkills.includes(skill));
    const missing = jobSkills.filter((skill) => !candidateSkills.includes(skill));

    const years = parseYears(text);
    const educationKeywords = ['bachelor', 'master', 'phd', 'b.tech', 'm.tech', 'mba'];
    const educationFound = educationKeywords.filter((item) => text.toLowerCase().includes(item));
    const leadershipSignals = ['lead', 'managed', 'mentored', 'architected', 'owned'].filter((item) => text.toLowerCase().includes(item));

    const qualityScore = cap(
      25
      + Math.min(40, matched.length * 8)
      + Math.min(15, leadershipSignals.length * 4)
      + Math.min(10, educationFound.length * 4)
      + Math.min(10, Math.round(words.length / 80))
      - Math.min(20, missing.length * 4)
    );

    return {
      summary: `Candidate resume indicates ${years || 0}+ years of experience with strengths in ${matched.slice(0, 5).join(', ') || 'general software delivery'}.`,
      strengths: unique([
        matched.length > 0 ? `Strong alignment with required skills: ${matched.slice(0, 5).join(', ')}.` : 'Demonstrates transferable technical skills.',
        leadershipSignals.length > 0 ? `Leadership indicators found: ${leadershipSignals.join(', ')}.` : 'Hands-on individual contribution experience.',
        educationFound.length > 0 ? `Education credentials include: ${educationFound.join(', ')}.` : 'Education details are limited in the resume.',
      ]),
      weaknesses: unique([
        missing.length > 0 ? `Missing required skills: ${missing.slice(0, 6).join(', ')}.` : 'No major skill gaps detected for this role.',
        years < 2 ? 'Limited experience years for senior responsibilities.' : '',
      ]).filter(Boolean),
      skillMatch: cap(Math.round((matched.length / Math.max(1, jobSkills.length)) * 100)),
      matchingSkills: matched,
      missingSkills: missing,
      experienceHighlights: [
        years > 0 ? `${years}+ years inferred from resume timeline.` : 'Experience years not clearly stated.',
        leadershipSignals.length > 0 ? `Evidence of ownership: ${leadershipSignals.join(', ')}.` : 'Add clearer impact statements and ownership metrics.',
      ],
      educationSummary: educationFound.length > 0
        ? `Education references found: ${educationFound.join(', ')}.`
        : 'Education summary is incomplete; request additional details.',
      careerGrowth: years >= 6
        ? 'Shows mature career progression with potential for leading initiatives.'
        : years >= 3
          ? 'Shows steady progression and readiness for independent ownership.'
          : 'Early-career profile; evaluate growth potential and learning velocity.',
      recommendation: qualityScore >= 75
        ? 'Strong profile. Move to interview round with role-specific assessment.'
        : qualityScore >= 55
          ? 'Promising profile. Conduct structured screening to validate missing skills.'
          : 'Low fit for current role. Consider alternate roles or keep in talent pool.',
      overallScore: qualityScore,
    };
  },

  analyzeCandidateMatch(candidate: CandidateContextRow, job: Job): CandidateMatchReport {
    const jobSkills = unique((job.skills || []).map((item) => String(item || '').toLowerCase()));
    const candidateSkills = unique((candidate.skills || []).map((item) => String(item || '').toLowerCase()));

    const matchingSkills = jobSkills.filter((skill) => candidateSkills.includes(skill));
    const missingSkills = jobSkills.filter((skill) => !candidateSkills.includes(skill));

    const experienceDemand = parseYears(job.experience || '0');
    const experienceGap = Math.max(0, experienceDemand - Number(candidate.experienceYears || 0));

    const score = cap(
      30
      + matchingSkills.length * 9
      - missingSkills.length * 4
      - experienceGap * 5
      + Math.min(10, Number(candidate.matchScore || 0) / 10)
    );

    const risks: string[] = [];
    if (missingSkills.length >= 3) risks.push('Multiple must-have skills are missing.');
    if (experienceGap >= 2) risks.push('Experience appears below role baseline.');
    if (normalizeText(candidate.status) === 'rejected') risks.push('Candidate already rejected for related role context.');
    if (candidate.notesCount === 0) risks.push('No recruiter notes available; decision confidence is lower.');

    const interviewTopics = unique([
      ...missingSkills.slice(0, 4).map((skill) => `Hands-on depth in ${skill}`),
      'Problem-solving under ambiguity',
      'Communication and stakeholder alignment',
      experienceGap > 0 ? 'Readiness for role-level ownership' : '',
    ]).filter(Boolean);

    const recommendation = score >= 75
      ? 'Strong fit: proceed with fast-track interviews.'
      : score >= 55
        ? 'Moderate fit: continue with targeted assessment.'
        : 'Low fit: hold or evaluate for alternate role.';

    return {
      matchScore: score,
      explanation: `Score combines skills overlap, experience alignment, and existing application signals for ${candidate.candidateName}.`,
      matchingSkills,
      missingSkills,
      riskFactors: risks,
      interviewTopics,
      hiringRecommendation: recommendation,
    };
  },

  generateInterviewQuestions(payload: {
    role: string;
    skills: string[];
    difficulty: 'easy' | 'medium' | 'hard';
  }): InterviewQuestionPack {
    const difficultyLabel = toReadableDifficulty(payload.difficulty);
    const skills = unique(payload.skills.map((item) => item.trim()).filter(Boolean));

    const technical = [
      `Explain core architecture decisions you would make for a ${payload.role} project. (${difficultyLabel})`,
      ...skills.slice(0, 4).map((skill) => `How have you applied ${skill} in production systems? (${difficultyLabel})`),
      'Describe a debugging approach for a high-impact production issue.',
    ];

    const hr = [
      'Why are you interested in this role and our company?',
      'Describe a conflict with a teammate and how you resolved it.',
      'How do you prioritize multiple deadlines?',
    ];

    const behavioral = [
      'Tell me about a time you had to deliver under tight constraints.',
      'Share an example where your decision improved measurable outcomes.',
      'Describe a failure and what changed in your process afterward.',
    ];

    const scenario = [
      `A critical release is blocked one day before go-live. How would you handle stakeholders? (${difficultyLabel})`,
      'Your team disagrees on implementation approach. How do you drive alignment?',
      'A high-potential candidate is at risk of drop-off. What actions do you take in 24 hours?',
    ];

    const coding = [
      `Implement a clean solution for a moderate ${payload.role} use-case and explain tradeoffs. (${difficultyLabel})`,
      'Refactor legacy code to improve readability and performance.',
      'Write test cases for edge conditions and failures.',
    ];

    const roleSpecific = [
      `${payload.role}: What KPIs would you track in your first 90 days?`,
      `${payload.role}: How do you ensure quality and velocity together?`,
      `${payload.role}: Which decisions should be data-driven vs intuition-driven?`,
    ];

    return {
      technical,
      hr,
      behavioral,
      scenario,
      coding,
      roleSpecific,
      scorecard: markdownScorecard(),
    };
  },

  generateOfferDraft(payload: {
    candidateName: string;
    role: string;
    companyName: string;
    joiningDate: string;
    ctc: string;
  }): string {
    return [
      `# Offer Letter Draft - ${payload.candidateName}`,
      '',
      `Dear ${payload.candidateName},`,
      '',
      `We are pleased to offer you the role of **${payload.role}** at **${payload.companyName}**.`,
      `Proposed joining date: **${payload.joiningDate || 'TBD'}**`,
      `Compensation: **${payload.ctc || 'As discussed'}**`,
      '',
      '## Welcome Email',
      `Welcome to ${payload.companyName}. We are excited to have you onboard.`,
      '',
      '## Salary Negotiation Email',
      `Thank you for sharing your expectations. We value your profile and are reviewing compensation flexibility for the ${payload.role} role.`,
      '',
      '## Follow-up Email',
      'Please confirm your acceptance and availability for onboarding formalities.',
      '',
      '## Joining Email',
      `Your onboarding is scheduled on ${payload.joiningDate || 'the agreed date'}. HR will share all required details shortly.`,
    ].join('\n');
  },

  generateMessageTemplates(payload: {
    candidateName: string;
    role: string;
    companyName: string;
    interviewDate?: string;
  }): string {
    return [
      '# Message Assistant Output',
      '',
      '## Interview Invitation',
      `Hi ${payload.candidateName}, we would like to invite you for an interview for the ${payload.role} role at ${payload.companyName}.`,
      '',
      '## Reminder',
      `Reminder: Your interview for ${payload.role} is scheduled on ${payload.interviewDate || 'the planned date'}.`,
      '',
      '## Follow-up',
      `Thank you for your time today. We will share next steps soon for the ${payload.role} role.`,
      '',
      '## Rejection Email',
      `Thank you for your interest in ${payload.companyName}. After careful evaluation, we are moving forward with other candidates at this time.`,
      '',
      '## Acceptance Email',
      `Congratulations, ${payload.candidateName}! We are pleased to move forward with your candidature for the ${payload.role} role.`,
      '',
      '## Document Request',
      'Please share your updated resume, current CTC proof, ID proof, and educational certificates for final processing.',
      '',
      '## Bulk Communication Template',
      `Hello Candidate, this is an update regarding your application for ${payload.role} at ${payload.companyName}.`,
    ].join('\n');
  },

  generateCandidateComparison(candidates: CandidateContextRow[], job: Job | null): CandidateComparisonResult {
    const rows = candidates.map((candidate) => {
      const report = job ? this.analyzeCandidateMatch(candidate, job) : null;
      return {
        Candidate: candidate.candidateName,
        Experience: `${candidate.experienceYears} yrs`,
        Match: `${report?.matchScore || candidate.matchScore || 0}%`,
        Stage: candidate.atsStage,
        Notes: candidate.notesCount,
      };
    });

    const scored = candidates
      .map((candidate) => ({
        candidate,
        score: job ? this.analyzeCandidateMatch(candidate, job).matchScore : Number(candidate.matchScore || 0),
      }))
      .sort((a, b) => b.score - a.score);

    const winner = scored[0];
    const runner = scored[1];

    return {
      tableMarkdown: makeTable(rows),
      pros: winner
        ? [
            `${winner.candidate.candidateName} has the strongest alignment for the role.`,
            `High readiness score at ${winner.score}%.`,
            winner.candidate.notesCount > 0 ? 'Has recruiter notes for better decision context.' : 'Needs more interview notes for confidence.',
          ]
        : [],
      cons: runner
        ? [
            `${runner.candidate.candidateName} is a close alternative but with lower match confidence.`,
            'Validate missing skills before final decision.',
          ]
        : ['Not enough candidates selected for meaningful comparison.'],
      bestFit: winner ? `${winner.candidate.candidateName} appears to be the best fit for ${job?.title || 'the selected role'}.` : 'No best fit identified.',
      riskAnalysis: winner
        ? `Primary risk: over-indexing on skill overlap; verify culture fit and role ownership depth in final round.`
        : 'Unable to estimate risks due to limited candidate data.',
      recommendedCandidate: winner?.candidate.candidateName || 'No recommendation',
    };
  },

  searchCandidates(query: string, candidates: CandidateContextRow[]): {
    summary: string;
    rows: CandidateContextRow[];
  } {
    const text = normalizeText(query);
    let result = [...candidates];

    const locationMatch = query.match(/in\s+([a-zA-Z\s]+)$/i);
    if (locationMatch) {
      const location = normalizeText(locationMatch[1]);
      result = result.filter((item) => normalizeText(item.location).includes(location));
    }

    const yearsMatch = query.match(/(\d+)\+?\s*years?/i);
    if (yearsMatch) {
      const years = Number(yearsMatch[1]);
      result = result.filter((item) => Number(item.experienceYears || 0) >= years);
    }

    if (text.includes('rejected')) {
      result = result.filter((item) => normalizeText(item.status) === 'rejected');
      const daysMatch = query.match(/last\s+(\d+)\s+days/i);
      if (daysMatch) {
        const days = Number(daysMatch[1]);
        result = result.filter((item) => {
          const date = new Date(item.updatedAt || item.appliedAt || '');
          if (Number.isNaN(date.getTime())) return false;
          return differenceInCalendarDays(new Date(), date) <= days;
        });
      }
    }

    if (text.includes('available immediately') || text.includes('immediate')) {
      result = result.filter((item) => {
        const status = normalizeText(item.status);
        return status === 'shortlisted' || status === 'under_review' || status === 'applied';
      });
    }

    if (text.includes('remote')) {
      result = result.filter((item) => normalizeText(item.workMode).includes('remote'));
    }

    const skillHits = skillCorpus.filter((skill) => text.includes(skill));
    if (skillHits.length > 0) {
      result = result.filter((item) => {
        const candidateSkillText = normalizeText(item.skills.join(' '));
        return skillHits.some((skill) => candidateSkillText.includes(skill));
      });
    }

    return {
      summary: `Found ${result.length} candidates for query: "${query}"`,
      rows: result.slice(0, 50),
    };
  },

  generateMeetingSummary(notes: string): string {
    const text = String(notes || '').trim();
    const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    const strengths = lines.filter((line) => /strong|good|excellent|clear|confident/i.test(line)).slice(0, 4);
    const weaknesses = lines.filter((line) => /weak|concern|gap|missing|unclear/i.test(line)).slice(0, 4);

    return [
      '# Interview Meeting Summary',
      '',
      '## Summary',
      lines.slice(0, 3).join(' ') || 'Discussion captured and summarized.',
      '',
      '## Strengths',
      ...(strengths.length > 0 ? strengths.map((item) => `- ${item}`) : ['- Technical fundamentals and communication evaluated.']),
      '',
      '## Weaknesses',
      ...(weaknesses.length > 0 ? weaknesses.map((item) => `- ${item}`) : ['- No major risks explicitly documented.']),
      '',
      '## Decision',
      weaknesses.length > strengths.length
        ? '- Hold decision pending additional validation round.'
        : '- Proceed to next round or final evaluation.',
      '',
      '## Action Items',
      '- Share structured feedback with panel within 24 hours.',
      '- Schedule next step and notify candidate.',
      '- Update ATS notes and scorecard.',
    ].join('\n');
  },

  generateReports(context: RecruiterAiContext): {
    hiringReport: string;
    recruiterReport: string;
    jobPerformanceReport: string;
    candidateQualityReport: string;
    executiveSummary: string;
  } {
    const jobsCount = context.jobs.length;
    const candidatesCount = context.candidates.length;
    const shortlisted = context.candidates.filter((item) => normalizeText(item.status) === 'shortlisted').length;
    const hired = context.candidates.filter((item) => normalizeText(item.status) === 'accepted').length;

    const topJobs = context.jobs
      .map((job) => {
        const count = context.candidates.filter((item) => item.jobId === String(job.id)).length;
        return { title: String(job.title || 'Untitled Job'), count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const avgMatch = context.candidates.length > 0
      ? Math.round(context.candidates.reduce((sum, item) => sum + Number(item.matchScore || 0), 0) / context.candidates.length)
      : 0;

    const hiringReport = [
      '# Hiring Report',
      `- Total jobs: ${jobsCount}`,
      `- Total applicants: ${candidatesCount}`,
      `- Shortlisted: ${shortlisted}`,
      `- Hired/Accepted: ${hired}`,
      `- Response rate: ${context.analytics.responseRate}%`,
      `- Rejection rate: ${context.analytics.rejectionRate}%`,
      `- Avg time to hire: ${context.analytics.avgTimeToHireDays} days`,
    ].join('\n');

    const recruiterReport = [
      '# Recruiter Report',
      `- Unread candidate messages: ${context.messagesUnread}`,
      `- Pending interview feedback entries: ${context.interviews.filter((item) => !item.feedback).length}`,
      `- AI requests today: ${context.kpis.aiRequestsToday}`,
      `- Automation suggestions triggered: ${context.kpis.automationSuggestions}`,
    ].join('\n');

    const jobPerformanceReport = [
      '# Job Performance Report',
      makeTable(topJobs.map((item) => ({ Job: item.title, Applicants: item.count }))),
      '',
      `Low performing jobs: ${context.analytics.lowPerformingJobs.join(', ') || 'None'}`,
    ].join('\n');

    const candidateQualityReport = [
      '# Candidate Quality Report',
      `- Average candidate match score: ${avgMatch}%`,
      `- High-match candidates (>=75): ${context.candidates.filter((item) => item.matchScore >= 75).length}`,
      `- Candidates lacking notes: ${context.candidates.filter((item) => item.notesCount === 0).length}`,
      `- Remote-ready candidates: ${context.candidates.filter((item) => normalizeText(item.workMode).includes('remote')).length}`,
    ].join('\n');

    const executiveSummary = [
      '# Executive Summary',
      `Recruiter pipeline currently handles ${candidatesCount} candidates across ${jobsCount} jobs.`,
      `Focus areas: reduce rejection (${context.analytics.rejectionRate}%), increase response (${context.analytics.responseRate}%), and close pending interviews quickly.`,
      ...makeSuggestionsFromContext(context).map((item) => `- ${item}`),
    ].join('\n');

    return {
      hiringReport,
      recruiterReport,
      jobPerformanceReport,
      candidateQualityReport,
      executiveSummary,
    };
  },

  generateCopilotResponse(prompt: string, context: RecruiterAiContext): string {
    const type = parsePromptForAction(prompt);

    if (type === 'insights') {
      return makeInsightReport(context);
    }

    if (type === 'search') {
      const search = this.searchCandidates(prompt, context.candidates);
      const table = makeTable(search.rows.slice(0, 12).map((item) => ({
        Candidate: item.candidateName,
        Job: item.jobTitle,
        Experience: `${item.experienceYears} yrs`,
        Location: item.location || '-',
        Stage: item.atsStage,
        Match: `${item.matchScore}%`,
      })));

      return [
        `## AI Search Result`,
        search.summary,
        '',
        table,
      ].join('\n');
    }

    if (type === 'report') {
      const reports = this.generateReports(context);
      return [
        reports.executiveSummary,
        '',
        reports.hiringReport,
        '',
        reports.recruiterReport,
      ].join('\n');
    }

    const suggestions = makeSuggestionsFromContext(context);
    return [
      '## Recruiter Copilot Response',
      `Prompt received: ${prompt}`,
      '',
      '### Context Snapshot',
      `- Jobs: ${context.jobs.length}`,
      `- Applicants: ${context.candidates.length}`,
      `- Interviews: ${context.interviews.length}`,
      `- Response rate: ${context.analytics.responseRate}%`,
      `- Rejection rate: ${context.analytics.rejectionRate}%`,
      '',
      '### Recommendations',
      ...suggestions.map((item) => `- ${item}`),
      '',
      '### Next Best Actions',
      '- Optimize low-performing job descriptions and compensation ranges.',
      '- Trigger interview scheduling for high-match shortlisted candidates.',
      '- Send follow-up reminders for pending feedback and inactive candidates.',
    ].join('\n');
  },

  askCopilot(recruiterId: string, conversationId: string, prompt: string, context: RecruiterAiContext): CopilotConversation {
    const question = this.addMessage(recruiterId, conversationId, { role: 'user', content: prompt });
    const response = this.generateCopilotResponse(prompt, context);

    const updated = this.addMessage(recruiterId, conversationId, {
      role: 'assistant',
      content: response,
    });

    const type = parsePromptForAction(prompt);
    this.logRequest({
      recruiterId,
      type,
      title: buildConversationTitle(prompt),
      input: prompt,
      output: response,
      meta: {
        conversationId,
        messageCount: updated.messages.length,
        contextJobs: context.jobs.length,
        contextCandidates: context.candidates.length,
      },
    });

    return updated || question;
  },
};
