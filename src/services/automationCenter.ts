import { format, addDays, addWeeks, addMonths } from 'date-fns';
import { supabase } from '@services/supabase';
import { bulkMoveToAtsStage } from '@components/recruiter/bulkActionsApi';

export type AutomationApplyTo = 'single_job' | 'multiple_jobs' | 'all_jobs';
export type AutomationStatus = 'enabled' | 'disabled';

export type AutomationTriggerType =
  | 'candidate_applies'
  | 'match_score_reaches'
  | 'candidate_shortlisted'
  | 'candidate_rejected'
  | 'candidate_moved_stage'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'offer_sent'
  | 'offer_accepted'
  | 'candidate_no_reply'
  | 'recruiter_no_response'
  | 'scheduled_daily'
  | 'scheduled_weekly'
  | 'scheduled_monthly';

export type AutomationActionType =
  | 'move_ats_stage'
  | 'assign_recruiter'
  | 'add_candidate_tag'
  | 'remove_candidate_tag'
  | 'add_to_talent_pool'
  | 'remove_from_talent_pool'
  | 'send_message'
  | 'send_email'
  | 'send_interview_invite'
  | 'send_reminder'
  | 'schedule_interview'
  | 'reject_candidate'
  | 'archive_candidate'
  | 'star_candidate'
  | 'request_resume_update'
  | 'request_documents'
  | 'notify_recruiter'
  | 'notify_hiring_manager'
  | 'generate_ai_candidate_summary'
  | 'generate_ai_interview_questions';

export interface AutomationTrigger {
  type: AutomationTriggerType;
  value?: string | number;
}

export interface AutomationConditions {
  matchScoreMin?: number;
  matchScoreMax?: number;
  experience?: string;
  skills?: string[];
  location?: string;
  education?: string;
  workMode?: string;
  employmentType?: string;
  salaryMin?: number;
  salaryMax?: number;
  noticePeriod?: string;
  resumeAvailable?: boolean;
  portfolioAvailable?: boolean;
  customScreeningScoreMin?: number;
  applicationAgeDays?: number;
}

export interface AutomationAction {
  type: AutomationActionType;
  value?: string;
  metadata?: Record<string, unknown>;
}

export interface AutomationDefinition {
  id: string;
  recruiterId: string;
  name: string;
  description: string;
  applyTo: AutomationApplyTo;
  jobIds: string[];
  triggers: AutomationTrigger[];
  conditions: AutomationConditions;
  actions: AutomationAction[];
  status: AutomationStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  nextRunAt?: string;
  stats: {
    candidatesProcessed: number;
    messagesSent: number;
    interviewsScheduled: number;
    offersSent: number;
    successRuns: number;
    failedRuns: number;
  };
}

export type ExecutionStatus = 'success' | 'failed' | 'skipped';

export interface AutomationExecution {
  id: string;
  recruiterId: string;
  automationId: string;
  automationName: string;
  runTime: string;
  trigger: AutomationTriggerType;
  actionSummary: string;
  status: ExecutionStatus;
  durationMs: number;
  errorMessage?: string;
  candidateId?: string;
  applicationId?: string;
  jobId?: string;
  details?: string;
}

export interface AutomationNotification {
  id: string;
  recruiterId: string;
  type: 'automation_failed' | 'automation_completed' | 'candidate_processed' | 'interview_scheduled' | 'offer_sent';
  message: string;
  createdAt: string;
  read: boolean;
}

export interface AutomationSummary {
  activeAutomations: number;
  jobsUsingAutomation: number;
  candidatesProcessed: number;
  messagesSentAutomatically: number;
  interviewsScheduledAutomatically: number;
  offersSentAutomatically: number;
  successRate: number;
}

export interface AutomationSearchFilters {
  search?: string;
  status?: 'all' | AutomationStatus;
  jobId?: string;
  trigger?: string;
  action?: string;
  creator?: string;
}

export interface AutomationEventContext {
  recruiterId: string;
  trigger: AutomationTriggerType;
  candidateId?: string;
  applicationId?: string;
  jobId?: string;
  matchScore?: number;
  candidateName?: string;
  atsStage?: string;
}

interface StoredAutomationData {
  automations: AutomationDefinition[];
  executions: AutomationExecution[];
  notifications: AutomationNotification[];
}

const STORAGE_KEY = 'actro_recruiter_automation_center_v1';

const makeId = (prefix: string): string => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const safeParse = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const readStore = (): StoredAutomationData => safeParse<StoredAutomationData>(
  localStorage.getItem(STORAGE_KEY),
  { automations: [], executions: [], notifications: [] }
);

const writeStore = (state: StoredAutomationData): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const scheduleNextRun = (triggers: AutomationTrigger[]): string | undefined => {
  const now = new Date();
  if (triggers.some((item) => item.type === 'scheduled_daily')) {
    return addDays(now, 1).toISOString();
  }
  if (triggers.some((item) => item.type === 'scheduled_weekly')) {
    return addWeeks(now, 1).toISOString();
  }
  if (triggers.some((item) => item.type === 'scheduled_monthly')) {
    return addMonths(now, 1).toISOString();
  }
  return undefined;
};

const actionSummary = (actions: AutomationAction[]): string =>
  actions.map((item) => item.type.replace(/_/g, ' ')).join(', ');

const incrementNotification = (
  state: StoredAutomationData,
  recruiterId: string,
  type: AutomationNotification['type'],
  message: string
): void => {
  state.notifications.unshift({
    id: makeId('auto_notif'),
    recruiterId,
    type,
    message,
    createdAt: new Date().toISOString(),
    read: false,
  });
  state.notifications = state.notifications.slice(0, 500);
};

const ensureOwnAutomation = (automation: AutomationDefinition, recruiterId: string): void => {
  if (automation.recruiterId !== recruiterId) {
    throw new Error('Permission denied: you can manage only your own automations.');
  }
};

const matchesFilters = (automation: AutomationDefinition, filters: AutomationSearchFilters): boolean => {
  const search = String(filters.search || '').trim().toLowerCase();
  if (search && !`${automation.name} ${automation.description}`.toLowerCase().includes(search)) return false;
  if (filters.status && filters.status !== 'all' && automation.status !== filters.status) return false;
  if (filters.jobId && !automation.jobIds.includes(filters.jobId) && automation.applyTo !== 'all_jobs') return false;
  if (filters.trigger && !automation.triggers.some((item) => item.type === filters.trigger)) return false;
  if (filters.action && !automation.actions.some((item) => item.type === filters.action)) return false;
  if (filters.creator && automation.createdBy.toLowerCase() !== filters.creator.toLowerCase()) return false;
  return true;
};

const conditionsSatisfied = (conditions: AutomationConditions, context: AutomationEventContext): boolean => {
  if (conditions.matchScoreMin !== undefined && (context.matchScore ?? 0) < conditions.matchScoreMin) return false;
  if (conditions.matchScoreMax !== undefined && (context.matchScore ?? 0) > conditions.matchScoreMax) return false;
  return true;
};

const appendCandidateTimelineEvent = async (
  recruiterId: string,
  context: AutomationEventContext,
  title: string,
  note: string
): Promise<void> => {
  const event = {
    id: makeId('auto_timeline'),
    recruiterId,
    candidateId: context.candidateId || null,
    applicationId: context.applicationId || null,
    jobId: context.jobId || null,
    title,
    note,
    at: new Date().toISOString(),
  };

  const key = `${STORAGE_KEY}_timeline`;
  const list = safeParse<any[]>(localStorage.getItem(key), []);
  list.unshift(event);
  localStorage.setItem(key, JSON.stringify(list.slice(0, 3000)));

  if (context.applicationId) {
    try {
      await supabase.from('candidate_pipeline_history').insert({
        application_id: context.applicationId,
        new_stage: 'Automation Executed',
        notes: `${title}: ${note}`,
        created_at: event.at,
      });
    } catch {
      // Optional table and permissions vary by environment.
    }
  }
};

const actionEffects = async (
  action: AutomationAction,
  context: AutomationEventContext
): Promise<{ messages: number; interviews: number; offers: number }> => {
  if (!context.recruiterId) return { messages: 0, interviews: 0, offers: 0 };

  if (action.type === 'move_ats_stage' && context.applicationId) {
    const stage = String(action.value || 'Screening');
    const mapped = stage === 'Rejected' ? 'Rejected' : stage === 'Shortlisted' ? 'Shortlisted' : 'Screening';
    await bulkMoveToAtsStage([context.applicationId], mapped as any, context.jobId);
    return { messages: 0, interviews: 0, offers: 0 };
  }

  if (action.type === 'send_message' && context.candidateId) {
    const content = String(action.value || 'Hello from automation workflow.');
    await supabase.from('messages').insert({
      sender_id: context.recruiterId,
      receiver_id: context.candidateId,
      content,
      is_read: false,
    });
    return { messages: 1, interviews: 0, offers: 0 };
  }

  if (action.type === 'reject_candidate' && context.applicationId) {
    await supabase
      .from('job_applications')
      .update({ status: 'rejected', ats_stage: 'Rejected', updated_at: new Date().toISOString() })
      .eq('id', context.applicationId);
    return { messages: 0, interviews: 0, offers: 0 };
  }

  if (action.type === 'send_interview_invite' || action.type === 'schedule_interview') {
    return { messages: 0, interviews: 1, offers: 0 };
  }

  return { messages: 0, interviews: 0, offers: 0 };
};

export const AUTOMATION_TEMPLATES: Array<
  Pick<AutomationDefinition, 'name' | 'description' | 'triggers' | 'conditions' | 'actions'>
> = [
  {
    name: 'New Applicant Welcome',
    description: 'Send a welcome note immediately when a candidate applies.',
    triggers: [{ type: 'candidate_applies' }],
    conditions: {},
    actions: [{ type: 'send_message', value: 'Thanks for applying. Our team will review your profile shortly.' }],
  },
  {
    name: 'Auto Shortlist High Match Candidates',
    description: 'Automatically move high match candidates to shortlist.',
    triggers: [{ type: 'match_score_reaches', value: 80 }],
    conditions: { matchScoreMin: 80 },
    actions: [{ type: 'move_ats_stage', value: 'Shortlisted' }, { type: 'add_candidate_tag', value: 'High Match' }],
  },
  {
    name: 'Auto Reject Low Match Candidates',
    description: 'Reject low match candidates automatically after checks.',
    triggers: [{ type: 'match_score_reaches', value: 35 }],
    conditions: { matchScoreMax: 35 },
    actions: [{ type: 'reject_candidate' }, { type: 'send_message', value: 'Thanks for applying. We are moving ahead with other profiles for this role.' }],
  },
  {
    name: 'Interview Reminder',
    description: 'Remind candidates before upcoming interview.',
    triggers: [{ type: 'interview_scheduled' }, { type: 'scheduled_daily' }],
    conditions: {},
    actions: [{ type: 'send_reminder', value: 'Reminder: Your interview is coming up.' }],
  },
  {
    name: 'Follow-up After Interview',
    description: 'Follow up automatically after interview completion.',
    triggers: [{ type: 'interview_completed' }],
    conditions: {},
    actions: [{ type: 'send_message', value: 'Thank you for attending the interview. We will share updates soon.' }],
  },
  {
    name: 'Offer Reminder',
    description: 'Send reminder after offer release.',
    triggers: [{ type: 'offer_sent' }, { type: 'candidate_no_reply' }],
    conditions: {},
    actions: [{ type: 'send_reminder', value: 'Please review your offer and let us know if you have any questions.' }],
  },
  {
    name: 'Inactive Candidate Reminder',
    description: 'Nudge candidates with no response.',
    triggers: [{ type: 'candidate_no_reply' }, { type: 'scheduled_weekly' }],
    conditions: {},
    actions: [{ type: 'send_message', value: 'We would love to continue the process. Please reply with your availability.' }],
  },
  {
    name: 'Talent Pool Assignment',
    description: 'Move selected candidates into relevant pool automatically.',
    triggers: [{ type: 'candidate_shortlisted' }],
    conditions: {},
    actions: [{ type: 'add_to_talent_pool', value: 'Top Talent' }],
  },
  {
    name: 'Resume Missing Reminder',
    description: 'Remind candidates to update resume when missing.',
    triggers: [{ type: 'candidate_applies' }],
    conditions: { resumeAvailable: false },
    actions: [{ type: 'request_resume_update' }],
  },
  {
    name: 'No Recruiter Response Reminder',
    description: 'Alert recruiter when responses are delayed.',
    triggers: [{ type: 'recruiter_no_response' }],
    conditions: {},
    actions: [{ type: 'notify_recruiter' }],
  },
];

export const automationCenterService = {
  listAutomations(recruiterId: string, filters: AutomationSearchFilters = {}): AutomationDefinition[] {
    const state = readStore();
    return state.automations
      .filter((item) => item.recruiterId === recruiterId)
      .filter((item) => matchesFilters(item, filters))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  createAutomation(
    recruiterId: string,
    payload: Omit<AutomationDefinition, 'id' | 'recruiterId' | 'createdAt' | 'updatedAt' | 'lastRunAt' | 'nextRunAt' | 'stats'>
  ): AutomationDefinition {
    const state = readStore();
    const now = new Date().toISOString();
    const created: AutomationDefinition = {
      ...payload,
      id: makeId('auto_rule'),
      recruiterId,
      createdAt: now,
      updatedAt: now,
      lastRunAt: undefined,
      nextRunAt: scheduleNextRun(payload.triggers),
      stats: {
        candidatesProcessed: 0,
        messagesSent: 0,
        interviewsScheduled: 0,
        offersSent: 0,
        successRuns: 0,
        failedRuns: 0,
      },
    };

    state.automations.unshift(created);
    writeStore(state);
    return created;
  },

  updateAutomation(recruiterId: string, automationId: string, updates: Partial<AutomationDefinition>): AutomationDefinition {
    const state = readStore();
    const index = state.automations.findIndex((item) => item.id === automationId);
    if (index < 0) throw new Error('Automation not found.');

    const current = state.automations[index];
    ensureOwnAutomation(current, recruiterId);

    const next: AutomationDefinition = {
      ...current,
      ...updates,
      id: current.id,
      recruiterId: current.recruiterId,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
      nextRunAt: updates.triggers ? scheduleNextRun(updates.triggers) : current.nextRunAt,
      stats: { ...current.stats, ...(updates.stats || {}) },
    };

    state.automations[index] = next;
    writeStore(state);
    return next;
  },

  duplicateAutomation(recruiterId: string, automationId: string): AutomationDefinition {
    const state = readStore();
    const source = state.automations.find((item) => item.id === automationId);
    if (!source) throw new Error('Automation not found.');
    ensureOwnAutomation(source, recruiterId);

    return this.createAutomation(recruiterId, {
      name: `${source.name} Copy`,
      description: source.description,
      applyTo: source.applyTo,
      jobIds: [...source.jobIds],
      triggers: [...source.triggers],
      conditions: { ...source.conditions },
      actions: [...source.actions],
      status: 'disabled',
      createdBy: source.createdBy,
    });
  },

  deleteAutomation(recruiterId: string, automationId: string): void {
    const state = readStore();
    const target = state.automations.find((item) => item.id === automationId);
    if (!target) return;
    ensureOwnAutomation(target, recruiterId);

    state.automations = state.automations.filter((item) => item.id !== automationId);
    writeStore(state);
  },

  toggleAutomation(recruiterId: string, automationId: string, enabled: boolean): AutomationDefinition {
    return this.updateAutomation(recruiterId, automationId, { status: enabled ? 'enabled' : 'disabled' });
  },

  bulkAction(recruiterId: string, automationIds: string[], action: 'enable' | 'disable' | 'delete'): void {
    const state = readStore();
    const ownedIds = new Set(
      state.automations
        .filter((item) => item.recruiterId === recruiterId)
        .map((item) => item.id)
    );

    if (action === 'delete') {
      state.automations = state.automations.filter((item) => !automationIds.includes(item.id) || !ownedIds.has(item.id));
      writeStore(state);
      return;
    }

    state.automations = state.automations.map((item) => {
      if (!automationIds.includes(item.id) || !ownedIds.has(item.id)) return item;
      return { ...item, status: action === 'enable' ? 'enabled' : 'disabled', updatedAt: new Date().toISOString() };
    });
    writeStore(state);
  },

  getSummary(recruiterId: string): AutomationSummary {
    const list = this.listAutomations(recruiterId);
    const activeAutomations = list.filter((item) => item.status === 'enabled').length;
    const jobsUsingAutomation = new Set(
      list.flatMap((item) => (item.applyTo === 'all_jobs' ? ['*all*'] : item.jobIds))
    ).size;

    const totals = list.reduce(
      (acc, item) => {
        acc.candidatesProcessed += item.stats.candidatesProcessed;
        acc.messagesSentAutomatically += item.stats.messagesSent;
        acc.interviewsScheduledAutomatically += item.stats.interviewsScheduled;
        acc.offersSentAutomatically += item.stats.offersSent;
        acc.successRuns += item.stats.successRuns;
        acc.failedRuns += item.stats.failedRuns;
        return acc;
      },
      {
        candidatesProcessed: 0,
        messagesSentAutomatically: 0,
        interviewsScheduledAutomatically: 0,
        offersSentAutomatically: 0,
        successRuns: 0,
        failedRuns: 0,
      }
    );

    const totalRuns = totals.successRuns + totals.failedRuns;
    return {
      activeAutomations,
      jobsUsingAutomation,
      candidatesProcessed: totals.candidatesProcessed,
      messagesSentAutomatically: totals.messagesSentAutomatically,
      interviewsScheduledAutomatically: totals.interviewsScheduledAutomatically,
      offersSentAutomatically: totals.offersSentAutomatically,
      successRate: totalRuns > 0 ? Number(((totals.successRuns / totalRuns) * 100).toFixed(1)) : 0,
    };
  },

  getExecutions(recruiterId: string): AutomationExecution[] {
    return readStore().executions.filter((item) => item.recruiterId === recruiterId).sort(
      (a, b) => new Date(b.runTime).getTime() - new Date(a.runTime).getTime()
    );
  },

  getNotifications(recruiterId: string): AutomationNotification[] {
    return readStore().notifications.filter((item) => item.recruiterId === recruiterId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  markNotificationRead(recruiterId: string, id: string): void {
    const state = readStore();
    state.notifications = state.notifications.map((item) => (
      item.recruiterId === recruiterId && item.id === id ? { ...item, read: true } : item
    ));
    writeStore(state);
  },

  async executeAutomation(recruiterId: string, automationId: string, context: AutomationEventContext): Promise<AutomationExecution> {
    const state = readStore();
    const index = state.automations.findIndex((item) => item.id === automationId);
    if (index < 0) throw new Error('Automation not found.');

    const automation = state.automations[index];
    ensureOwnAutomation(automation, recruiterId);

    const startedAt = Date.now();
    let status: ExecutionStatus = 'success';
    let errorMessage = '';
    let effects = { messages: 0, interviews: 0, offers: 0 };

    try {
      if (automation.status !== 'enabled') {
        status = 'skipped';
      } else if (!automation.triggers.some((item) => item.type === context.trigger)) {
        status = 'skipped';
      } else if (!conditionsSatisfied(automation.conditions, context)) {
        status = 'skipped';
      } else {
        for (const action of automation.actions) {
          const result = await actionEffects(action, context);
          effects = {
            messages: effects.messages + result.messages,
            interviews: effects.interviews + result.interviews,
            offers: effects.offers + result.offers,
          };
        }
        await appendCandidateTimelineEvent(
          recruiterId,
          context,
          'Automation Executed',
          `${automation.name}: ${actionSummary(automation.actions)}`
        );
      }
    } catch (error: any) {
      status = 'failed';
      errorMessage = String(error?.message || 'Automation execution failed');
    }

    const durationMs = Date.now() - startedAt;
    const execution: AutomationExecution = {
      id: makeId('auto_exec'),
      recruiterId,
      automationId: automation.id,
      automationName: automation.name,
      runTime: new Date().toISOString(),
      trigger: context.trigger,
      actionSummary: actionSummary(automation.actions),
      status,
      durationMs,
      errorMessage: errorMessage || undefined,
      candidateId: context.candidateId,
      applicationId: context.applicationId,
      jobId: context.jobId,
      details: status === 'success'
        ? `Processed actions for candidate ${context.candidateName || context.candidateId || 'N/A'}`
        : undefined,
    };

    state.executions.unshift(execution);
    state.executions = state.executions.slice(0, 5000);

    const updatedAutomation: AutomationDefinition = {
      ...automation,
      lastRunAt: execution.runTime,
      nextRunAt: scheduleNextRun(automation.triggers),
      updatedAt: new Date().toISOString(),
      stats: {
        ...automation.stats,
        candidatesProcessed: automation.stats.candidatesProcessed + (status === 'success' ? 1 : 0),
        messagesSent: automation.stats.messagesSent + effects.messages,
        interviewsScheduled: automation.stats.interviewsScheduled + effects.interviews,
        offersSent: automation.stats.offersSent + effects.offers,
        successRuns: automation.stats.successRuns + (status === 'success' ? 1 : 0),
        failedRuns: automation.stats.failedRuns + (status === 'failed' ? 1 : 0),
      },
    };

    state.automations[index] = updatedAutomation;

    if (status === 'failed') {
      incrementNotification(state, recruiterId, 'automation_failed', `${automation.name} failed: ${errorMessage || 'Unknown error'}`);
    } else if (status === 'success') {
      incrementNotification(state, recruiterId, 'automation_completed', `${automation.name} completed successfully`);
      incrementNotification(state, recruiterId, 'candidate_processed', `${automation.name} processed candidate flow`);
    }

    writeStore(state);
    return execution;
  },

  async retryExecution(recruiterId: string, executionId: string): Promise<AutomationExecution> {
    const execution = this.getExecutions(recruiterId).find((item) => item.id === executionId);
    if (!execution) throw new Error('Execution not found.');

    return this.executeAutomation(recruiterId, execution.automationId, {
      recruiterId,
      trigger: execution.trigger,
      candidateId: execution.candidateId,
      applicationId: execution.applicationId,
      jobId: execution.jobId,
    });
  },

  async processEvent(context: AutomationEventContext): Promise<AutomationExecution[]> {
    const automations = this.listAutomations(context.recruiterId).filter((item) => item.status === 'enabled');
    const matches = automations.filter((item) => item.triggers.some((trigger) => trigger.type === context.trigger));
    const runs: AutomationExecution[] = [];

    for (const automation of matches) {
      if (automation.applyTo !== 'all_jobs' && context.jobId && !automation.jobIds.includes(context.jobId)) {
        continue;
      }
      // eslint-disable-next-line no-await-in-loop
      const result = await this.executeAutomation(context.recruiterId, automation.id, context);
      runs.push(result);
    }

    return runs;
  },

  createFromTemplate(recruiterId: string, createdBy: string, templateName: string, jobIds: string[] = []): AutomationDefinition {
    const template = AUTOMATION_TEMPLATES.find((item) => item.name === templateName);
    if (!template) throw new Error('Template not found.');

    return this.createAutomation(recruiterId, {
      name: template.name,
      description: template.description,
      applyTo: jobIds.length > 0 ? (jobIds.length === 1 ? 'single_job' : 'multiple_jobs') : 'all_jobs',
      jobIds,
      triggers: template.triggers,
      conditions: template.conditions,
      actions: template.actions,
      status: 'enabled',
      createdBy,
    });
  },

  getAiSuggestions(recruiterId: string): string[] {
    const summary = this.getSummary(recruiterId);
    const automations = this.listAutomations(recruiterId);

    const suggestions: string[] = [];
    if (summary.activeAutomations < 2) {
      suggestions.push('This job receives many applications. Create an auto-shortlisting rule.');
    }
    if (summary.successRate < 70 && automations.length > 0) {
      suggestions.push('Automation success rate is low. Add conditions and retry policies for failed rules.');
    }
    if (!automations.some((item) => item.triggers.some((trigger) => trigger.type === 'candidate_no_reply'))) {
      suggestions.push('Candidates are waiting too long. Create an automatic follow-up automation.');
    }
    if (!automations.some((item) => item.actions.some((action) => action.type === 'reject_candidate'))) {
      suggestions.push('This recruiter rejects many low match candidates. Create an auto rejection rule.');
    }
    if (!automations.some((item) => item.triggers.some((trigger) => trigger.type === 'interview_scheduled'))) {
      suggestions.push('Interview workflows are manual. Add interview reminder and feedback follow-up automations.');
    }

    return suggestions.slice(0, 6);
  },

  getJobAutomations(recruiterId: string, jobId: string): AutomationDefinition[] {
    return this.listAutomations(recruiterId).filter(
      (item) => item.applyTo === 'all_jobs' || item.jobIds.includes(jobId)
    );
  },

  attachAutomationToJob(recruiterId: string, automationId: string, jobId: string): AutomationDefinition {
    const automation = this.listAutomations(recruiterId).find((item) => item.id === automationId);
    if (!automation) throw new Error('Automation not found.');

    const jobIds = Array.from(new Set([...(automation.jobIds || []), jobId]));
    const applyTo: AutomationApplyTo = jobIds.length === 1 ? 'single_job' : 'multiple_jobs';
    return this.updateAutomation(recruiterId, automationId, { jobIds, applyTo });
  },

  detachAutomationFromJob(recruiterId: string, automationId: string, jobId: string): AutomationDefinition {
    const automation = this.listAutomations(recruiterId).find((item) => item.id === automationId);
    if (!automation) throw new Error('Automation not found.');

    const jobIds = automation.jobIds.filter((id) => id !== jobId);
    const applyTo: AutomationApplyTo = jobIds.length === 0 ? 'all_jobs' : jobIds.length === 1 ? 'single_job' : 'multiple_jobs';
    return this.updateAutomation(recruiterId, automationId, { jobIds, applyTo });
  },

  getCandidateTimelineEvents(recruiterId: string, candidateId: string, applicationId?: string): Array<{
    id: string;
    title: string;
    note: string;
    at: string;
  }> {
    const key = `${STORAGE_KEY}_timeline`;
    const rows = safeParse<any[]>(localStorage.getItem(key), []);
    return rows
      .filter((row) => row.recruiterId === recruiterId)
      .filter((row) => String(row.candidateId || '') === String(candidateId || ''))
      .filter((row) => (applicationId ? String(row.applicationId || '') === String(applicationId) : true))
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .map((row) => ({
        id: String(row.id),
        title: String(row.title || 'Automation Event'),
        note: String(row.note || ''),
        at: String(row.at || ''),
      }));
  },

  exportAutomationsCsv(recruiterId: string): string {
    const rows = this.listAutomations(recruiterId);
    const headers = ['Automation Name', 'Trigger', 'Action', 'Applied Jobs', 'Status', 'Created By', 'Last Run', 'Next Run'];
    const csvRows = rows.map((item) => [
      item.name,
      item.triggers.map((trigger) => trigger.type).join('|'),
      item.actions.map((action) => action.type).join('|'),
      item.applyTo === 'all_jobs' ? 'All Jobs' : item.jobIds.join('|'),
      item.status,
      item.createdBy,
      item.lastRunAt ? format(new Date(item.lastRunAt), 'yyyy-MM-dd HH:mm') : '-',
      item.nextRunAt ? format(new Date(item.nextRunAt), 'yyyy-MM-dd HH:mm') : '-',
    ]);

    const escapeCell = (value: unknown): string => {
      const text = String(value ?? '');
      if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
      return text;
    };

    return [headers, ...csvRows].map((line) => line.map((item) => escapeCell(item)).join(',')).join('\n');
  },
};
