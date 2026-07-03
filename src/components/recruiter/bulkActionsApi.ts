import { supabase } from '@services/supabase';
import type { JobApplication } from '@types';

export const ATS_STAGES = [
  'Applied',
  'Screening',
  'Shortlisted',
  'Interview Scheduled',
  'Interview Completed',
  'Offer Sent',
  'Hired',
  'Rejected',
] as const;

export const RECRUITER_TAG_PRESETS = [
  'React Expert',
  'Immediate Joiner',
  'Top Talent',
  'Remote Ready',
  'High Priority',
] as const;

export const TALENT_POOL_PRESETS = [
  'Frontend Developers',
  'Backend Developers',
  'Future Hiring',
  'Top Talent',
] as const;

export type AtsStage = (typeof ATS_STAGES)[number];
export type ApplicationStatus = 'applied' | 'under_review' | 'shortlisted' | 'rejected' | 'accepted';

export interface CandidateProfile {
  id?: string;
  name?: string | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  skills?: string[] | string | null;
  experience?: string | null;
  bio?: string | null;
  [key: string]: unknown;
}

export interface BulkApplicant extends JobApplication {
  id: string;
  job_id: string;
  user_id: string;
  status: ApplicationStatus;
  applied_at?: string;
  updated_at?: string;
  ats_stage?: AtsStage | string | null;
  tags?: string[] | string | null;
  talent_pools?: string[] | string | null;
  match_score?: number | null;
  profiles?: CandidateProfile | null;
  metadata?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface PaginatedApplicants {
  data: BulkApplicant[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const statusByStage: Record<AtsStage, ApplicationStatus> = {
  Applied: 'applied',
  Screening: 'under_review',
  Shortlisted: 'shortlisted',
  'Interview Scheduled': 'under_review',
  'Interview Completed': 'under_review',
  'Offer Sent': 'accepted',
  Hired: 'accepted',
  Rejected: 'rejected',
};

const chunk = <T,>(items: T[], size = 100): T[][] => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
};

export const toStringArray = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value.split(/[,|;]/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

export const getApplicantTags = (applicant: BulkApplicant): string[] =>
  toStringArray(applicant.tags || applicant.recruiter_tags || applicant.metadata?.tags);

export const getApplicantTalentPools = (applicant: BulkApplicant): string[] =>
  toStringArray(applicant.talent_pools || applicant.talentPools || applicant.metadata?.talent_pools);

export const getApplicantStage = (applicant: BulkApplicant): AtsStage => {
  const explicitStage = applicant.ats_stage || applicant.stage || applicant.metadata?.ats_stage;
  if (ATS_STAGES.includes(explicitStage as AtsStage)) return explicitStage as AtsStage;
  if (applicant.status === 'shortlisted') return 'Shortlisted';
  if (applicant.status === 'rejected') return 'Rejected';
  if (applicant.status === 'accepted') return 'Offer Sent';
  if (applicant.status === 'under_review') return 'Screening';
  return 'Applied';
};

const applicationPayload = (updates: Record<string, unknown>) => ({
  ...updates,
  updated_at: new Date().toISOString(),
});

const stageByStatus: Record<ApplicationStatus, AtsStage> = {
  applied: 'Applied',
  under_review: 'Screening',
  shortlisted: 'Shortlisted',
  rejected: 'Rejected',
  accepted: 'Offer Sent',
};

const canonicalPoolName = (value: string): string => value.trim().toLowerCase();

async function ensureTalentPools(
  recruiterId: string,
  poolNames: string[]
): Promise<Map<string, string>> {
  const cleanNames = Array.from(new Set(poolNames.map((pool) => pool.trim()).filter(Boolean)));
  if (!recruiterId || cleanNames.length === 0) return new Map();

  const { data: existingRows, error: existingError } = await supabase
    .from('talent_pools')
    .select('id, name')
    .eq('recruiter_id', recruiterId);

  if (existingError) throw existingError;

  const byCanonical = new Map<string, { id: string; name: string }>();
  (existingRows || []).forEach((row: any) => {
    if (row?.id && row?.name) {
      byCanonical.set(canonicalPoolName(String(row.name)), {
        id: String(row.id),
        name: String(row.name),
      });
    }
  });

  const missing = cleanNames.filter((name) => !byCanonical.has(canonicalPoolName(name)));
  if (missing.length > 0) {
    const { error: createError } = await supabase.from('talent_pools').insert(
      missing.map((name) => ({ recruiter_id: recruiterId, name }))
    );
    if (createError) throw createError;

    const { data: refreshedRows, error: refreshedError } = await supabase
      .from('talent_pools')
      .select('id, name')
      .eq('recruiter_id', recruiterId);
    if (refreshedError) throw refreshedError;

    byCanonical.clear();
    (refreshedRows || []).forEach((row: any) => {
      if (row?.id && row?.name) {
        byCanonical.set(canonicalPoolName(String(row.name)), {
          id: String(row.id),
          name: String(row.name),
        });
      }
    });
  }

  const result = new Map<string, string>();
  cleanNames.forEach((name) => {
    const found = byCanonical.get(canonicalPoolName(name));
    if (found?.id) result.set(name, found.id);
  });
  return result;
}

async function syncTalentPoolMembership(
  recruiterId: string,
  candidateIds: string[],
  poolNames: string[],
  mode: 'add' | 'remove'
): Promise<void> {
  if (!recruiterId || candidateIds.length === 0 || poolNames.length === 0) return;

  const poolMap = await ensureTalentPools(recruiterId, poolNames);
  const poolIds = Array.from(poolMap.values());
  if (poolIds.length === 0) return;

  if (mode === 'add') {
    const rows = candidateIds.flatMap((candidateId) =>
      poolIds.map((poolId) => ({ pool_id: poolId, candidate_id: candidateId }))
    );
    const { error } = await supabase
      .from('talent_pool_candidates')
      .upsert(rows, { onConflict: 'pool_id,candidate_id' });
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from('talent_pool_candidates')
    .delete()
    .in('pool_id', poolIds)
    .in('candidate_id', candidateIds);
  if (error) throw error;
}

export async function getJobApplicantsPaginated(
  jobId: string,
  page = 1,
  pageSize = 25
): Promise<PaginatedApplicants> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('job_applications')
    .select('*, profiles(*)', { count: 'exact' })
    .eq('job_id', jobId)
    // Priority applications first, then newest
    .order('priority_application', { ascending: false })
    .order('applied_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  const total = count || 0;
  const normalizedData = ((data || []) as BulkApplicant[]).map((applicant) => ({
    ...applicant,
    priority_application: Boolean(applicant.priority_application ?? applicant.priorityApplication),
    priorityApplication: Boolean(applicant.priority_application ?? applicant.priorityApplication),
  }));

  return { data: normalizedData, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function bulkUpdateApplicationStatus(
  applicationIds: string[],
  status: ApplicationStatus,
  jobId?: string
): Promise<void> {
  if (applicationIds.length === 0) return;
  const atsStage = stageByStatus[status];
  await Promise.all(
    chunk(applicationIds).map(async (ids) => {
      let query = supabase
        .from('job_applications')
        .update(applicationPayload({ status, ats_stage: atsStage }))
        .in('id', ids);
      if (jobId) query = query.eq('job_id', jobId);
      const { error } = await query;
      if (error) throw error;
    })
  );
}

export async function bulkMoveToAtsStage(
  applicationIds: string[],
  stage: AtsStage,
  jobId?: string
): Promise<void> {
  if (applicationIds.length === 0) return;
  await Promise.all(
    chunk(applicationIds).map(async (ids) => {
      let query = supabase
        .from('job_applications')
        .update(applicationPayload({ ats_stage: stage, status: statusByStage[stage] }))
        .in('id', ids);
      if (jobId) query = query.eq('job_id', jobId);
      const { error } = await query;
      if (error) throw error;
    })
  );
}

export async function bulkSetTags(
  applicants: BulkApplicant[],
  tags: string[],
  mode: 'add' | 'remove'
): Promise<void> {
  const cleanTags = tags.map((tag) => tag.trim()).filter(Boolean);
  if (applicants.length === 0 || cleanTags.length === 0) return;
  await Promise.all(
    applicants.map(async (applicant) => {
      const current = new Set(getApplicantTags(applicant));
      cleanTags.forEach((tag) => (mode === 'add' ? current.add(tag) : current.delete(tag)));
      const { error } = await supabase.from('job_applications').update(applicationPayload({ tags: Array.from(current) })).eq('id', applicant.id);
      if (error) throw error;
    })
  );
}

export async function bulkSetTalentPools(
  recruiterId: string,
  applicants: BulkApplicant[],
  poolNames: string[],
  mode: 'add' | 'remove'
): Promise<void> {
  const cleanPools = poolNames.map((pool) => pool.trim()).filter(Boolean);
  if (!recruiterId || applicants.length === 0 || cleanPools.length === 0) return;

  const candidateIds = Array.from(new Set(applicants.map((applicant) => applicant.user_id).filter(Boolean)));

  await Promise.all(
    applicants.map(async (applicant) => {
      const current = new Set(getApplicantTalentPools(applicant));
      cleanPools.forEach((pool) => (mode === 'add' ? current.add(pool) : current.delete(pool)));
      const { error } = await supabase.from('job_applications').update(applicationPayload({ talent_pools: Array.from(current) })).eq('id', applicant.id);
      if (error) throw error;
    })
  );

  await syncTalentPoolMembership(recruiterId, candidateIds, cleanPools, mode);
}

export async function bulkSendMessage(
  recruiterId: string,
  applicants: BulkApplicant[],
  content: string
): Promise<void> {
  const message = content.trim();
  if (!message || applicants.length === 0) return;
  const recipientIds = [...new Set(applicants.map((applicant) => applicant.user_id).filter(Boolean))];
  const messages = recipientIds.map((receiverId) => ({ sender_id: recruiterId, receiver_id: receiverId, content: message, is_read: false }));

  if (messages.length > 0) {
    const { error } = await supabase.from('messages').insert(messages);
    if (error) throw error;
  }
  // NOTE: notifications table valid_notification_type constraint only allows
  // 'job_match', 'application_status', 'new_job', 'subscription'
  // Bulk message delivery is handled via the messages table above.
}
