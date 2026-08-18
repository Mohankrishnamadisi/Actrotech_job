import { supabase } from '@services/supabase';

export const FREE_JOB_POSTS_TOTAL = 15;
export const FREE_RESUME_VIEWS_TOTAL = 150;

export interface RecruiterWelcomeBenefit {
  id: string;
  recruiter_id: string;
  free_job_posts_total: number;
  free_job_posts_used: number;
  free_resume_views_total: number;
  free_resume_views_used: number;
  claimed_at: string;
  created_at: string;
  updated_at: string;
}

export interface RecruiterWelcomeUsageSnapshot {
  benefit: RecruiterWelcomeBenefit | null;
  freeJobPostsTotal: number;
  freeJobPostsUsed: number;
  freeJobPostsRemaining: number;
  freeResumeViewsTotal: number;
  freeResumeViewsUsed: number;
  freeResumeViewsRemaining: number;
  claimed: boolean;
}

export async function getRecruiterWelcomeBenefit(recruiterId: string): Promise<RecruiterWelcomeBenefit | null> {
  const { data, error } = await supabase
    .from('recruiter_onboarding_benefits')
    .select('*')
    .eq('recruiter_id', recruiterId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function ensureRecruiterWelcomeBenefit(recruiterId: string): Promise<RecruiterWelcomeBenefit> {
  const existing = await getRecruiterWelcomeBenefit(recruiterId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from('recruiter_onboarding_benefits')
    .insert({
      recruiter_id: recruiterId,
      free_job_posts_total: FREE_JOB_POSTS_TOTAL,
      free_job_posts_used: 0,
      free_resume_views_total: FREE_RESUME_VIEWS_TOTAL,
      free_resume_views_used: 0,
      claimed_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function getRecruiterWelcomeUsage(recruiterId: string): Promise<RecruiterWelcomeUsageSnapshot> {
  const benefit = await getRecruiterWelcomeBenefit(recruiterId).catch(() => null);
  if (!benefit) {
    return {
      benefit: null,
      freeJobPostsTotal: 0,
      freeJobPostsUsed: 0,
      freeJobPostsRemaining: 0,
      freeResumeViewsTotal: 0,
      freeResumeViewsUsed: 0,
      freeResumeViewsRemaining: 0,
      claimed: false,
    };
  }

  return {
    benefit,
    freeJobPostsTotal: Number(benefit.free_job_posts_total || 0),
    freeJobPostsUsed: Number(benefit.free_job_posts_used || 0),
    freeJobPostsRemaining: Math.max(0, Number(benefit.free_job_posts_total || 0) - Number(benefit.free_job_posts_used || 0)),
    freeResumeViewsTotal: Number(benefit.free_resume_views_total || 0),
    freeResumeViewsUsed: Number(benefit.free_resume_views_used || 0),
    freeResumeViewsRemaining: Math.max(0, Number(benefit.free_resume_views_total || 0) - Number(benefit.free_resume_views_used || 0)),
    claimed: true,
  };
}

export async function claimRecruiterWelcomeBenefit(recruiterId: string): Promise<RecruiterWelcomeBenefit> {
  return ensureRecruiterWelcomeBenefit(recruiterId);
}

export async function reserveRecruiterWelcomeJobPost(recruiterId: string): Promise<{ allowed: boolean; remaining_jobs: number; used_jobs: number; total_jobs: number }> {
  const { data, error } = await supabase.rpc('reserve_recruiter_welcome_job_post', {
    p_recruiter_id: recruiterId,
  });

  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    allowed: Boolean(row?.allowed),
    remaining_jobs: Number(row?.remaining_jobs ?? 0),
    used_jobs: Number(row?.used_jobs ?? 0),
    total_jobs: Number(row?.total_jobs ?? 0),
  };
}

export async function restoreRecruiterWelcomeJobPost(recruiterId: string, count = 1): Promise<void> {
  const { error } = await supabase.rpc('restore_recruiter_welcome_job_post', {
    p_recruiter_id: recruiterId,
    p_count: count,
  });
  if (error) throw error;
}

export async function reserveRecruiterWelcomeResumeView(recruiterId: string): Promise<{ allowed: boolean; remaining_views: number; used_views: number; total_views: number }> {
  const { data, error } = await supabase.rpc('reserve_recruiter_welcome_resume_view', {
    p_recruiter_id: recruiterId,
  });

  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    allowed: Boolean(row?.allowed),
    remaining_views: Number(row?.remaining_views ?? 0),
    used_views: Number(row?.used_views ?? 0),
    total_views: Number(row?.total_views ?? 0),
  };
}

export async function restoreRecruiterWelcomeResumeView(recruiterId: string, count = 1): Promise<void> {
  const { error } = await supabase.rpc('restore_recruiter_welcome_resume_view', {
    p_recruiter_id: recruiterId,
    p_count: count,
  });
  if (error) throw error;
}

export async function consumeRecruiterWelcomeJobPost(recruiterId: string): Promise<{ allowed: boolean; remaining_jobs: number; used_jobs: number; total_jobs: number }> {
  return reserveRecruiterWelcomeJobPost(recruiterId);
}

export async function consumeRecruiterWelcomeResumeView(recruiterId: string): Promise<{ allowed: boolean; remaining_views: number; used_views: number; total_views: number }> {
  return reserveRecruiterWelcomeResumeView(recruiterId);
}
