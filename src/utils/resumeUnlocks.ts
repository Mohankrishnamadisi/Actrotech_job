import { supabase } from '@services/supabase';
import type {
  RecruiterCredits,
  ResumeUnlock,
  ResumeUnlockCandidateStat,
  ResumeUnlockContext,
  ResumeUnlockResult,
  Subscription,
} from '@types';

const DEFAULT_CREDITS = 100;

export async function getRecruiterCredits(recruiterId: string): Promise<RecruiterCredits | null> {
  const { data, error } = await supabase
    .from('recruiter_credits')
    .select('*')
    .eq('recruiter_id', recruiterId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function ensureRecruiterCredits(recruiterId: string): Promise<RecruiterCredits> {
  const subscription = await getActiveRecruiterSubscription(recruiterId);
  const isUnlimited = isUnlimitedPlan(subscription?.plan);
  const existing = await getRecruiterCredits(recruiterId);
  if (existing) {
    if (isUnlimited && existing.available_credits !== -1) {
      const { data, error } = await supabase
        .from('recruiter_credits')
        .update({ available_credits: -1 })
        .eq('recruiter_id', recruiterId)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    }
    return existing;
  }

  const { data, error } = await supabase
    .from('recruiter_credits')
    .insert({ recruiter_id: recruiterId, available_credits: isUnlimited ? -1 : DEFAULT_CREDITS, used_credits: 0 })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function getResumeUnlock(
  recruiterId: string,
  candidateId: string
): Promise<ResumeUnlock | null> {
  const { data, error } = await supabase
    .from('resume_unlocks')
    .select('*')
    .eq('recruiter_id', recruiterId)
    .eq('candidate_id', candidateId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function getResumeUnlockMap(
  recruiterId: string,
  candidateIds: string[]
): Promise<Record<string, boolean>> {
  const uniqueIds = [...new Set(candidateIds.filter(Boolean))];
  if (!recruiterId || uniqueIds.length === 0) return {};

  const { data, error } = await supabase
    .from('resume_unlocks')
    .select('candidate_id')
    .eq('recruiter_id', recruiterId)
    .in('candidate_id', uniqueIds);

  if (error) throw error;
  return (data || []).reduce<Record<string, boolean>>((map, row) => {
    map[row.candidate_id] = true;
    return map;
  }, {});
}

export async function getActiveRecruiterSubscription(recruiterId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', recruiterId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export function normalizePlanLabel(plan?: string | null): 'FREE' | 'PREMIUM' | 'PRO' {
  const normalized = String(plan || '').toLowerCase();
  if (normalized === 'premium') return 'PREMIUM';
  if (normalized === 'pro') return 'PRO';
  return 'FREE';
}

export function isUnlimitedPlan(plan?: string | null): boolean {
  const label = normalizePlanLabel(plan);
  return label === 'PREMIUM' || label === 'PRO';
}

export async function getResumeUnlockContext(
  recruiterId: string,
  candidateId: string
): Promise<ResumeUnlockContext> {
  const [credits, unlock] = await Promise.all([
    ensureRecruiterCredits(recruiterId),
    getResumeUnlock(recruiterId, candidateId),
  ]);

  return { credits, unlock, isUnlocked: Boolean(unlock) };
}

export async function unlockCandidateContact(
  candidateId: string,
  jobId?: string | null
): Promise<ResumeUnlockResult> {
  const { data, error } = await supabase.rpc('unlock_candidate_contact', {
    p_candidate_id: candidateId,
    p_job_id: jobId || null,
  });

  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row as ResumeUnlockResult;
}

export async function getResumeUnlockAnalytics(
  recruiterId: string
): Promise<{
  totalCreditsUsed: number;
  totalUnlocks: number;
  mostViewedCandidates: ResumeUnlockCandidateStat[];
}> {
  const { data, error } = await supabase
    .from('resume_unlocks')
    .select(`
      id,
      candidate_id,
      credits_used,
      unlocked_at,
      profiles!resume_unlocks_candidate_id_fkey (
        id,
        name
      )
    `)
    .eq('recruiter_id', recruiterId)
    .order('unlocked_at', { ascending: false });

  if (error) throw error;

  const rows = (data || []) as Array<{
    candidate_id: string;
    credits_used: number;
    unlocked_at?: string | null;
    profiles?: { id?: string; name?: string | null } | null;
  }>;

  const candidateMap = new Map<string, ResumeUnlockCandidateStat>();
  rows.forEach((row) => {
    const current = candidateMap.get(row.candidate_id);
    const profile = row.profiles;
    if (current) {
      current.unlock_count += 1;
      if (!current.last_unlocked_at || (row.unlocked_at && row.unlocked_at > current.last_unlocked_at)) {
        current.last_unlocked_at = row.unlocked_at || null;
      }
      return;
    }

    candidateMap.set(row.candidate_id, {
      candidate_id: row.candidate_id,
      candidate_name: profile?.name || 'Candidate',
      candidate_email: null,
      unlock_count: 1,
      last_unlocked_at: row.unlocked_at || null,
    });
  });

  return {
    totalCreditsUsed: rows.reduce((sum, row) => sum + (row.credits_used || 0), 0),
    totalUnlocks: rows.length,
    mostViewedCandidates: Array.from(candidateMap.values())
      .sort((a, b) => b.unlock_count - a.unlock_count)
      .slice(0, 5),
  };
}

export const resumeUnlockService = {
  getRecruiterCredits,
  ensureRecruiterCredits,
  getResumeUnlock,
  getResumeUnlockMap,
  getResumeUnlockContext,
  unlockCandidateContact,
  getResumeUnlockAnalytics,
  getActiveRecruiterSubscription,
  normalizePlanLabel,
  isUnlimitedPlan,
};
