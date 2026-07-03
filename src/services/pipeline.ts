import supabase from './supabaseClient';

export type PipelineStage =
  | 'Applied'
  | 'Screening'
  | 'Shortlisted'
  | 'Interview Scheduled'
  | 'Interview Completed'
  | 'Offer Sent'
  | 'Hired'
  | 'Rejected';

export interface PipelineEntry {
  id: string;
  candidate_id: string;
  job_id?: string | null;
  stage: PipelineStage;
  metadata: any;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface PipelineHistory {
  id: string;
  pipeline_id: string;
  old_stage?: PipelineStage;
  new_stage?: PipelineStage;
  changed_by?: string;
  notes?: string;
  created_at: string;
}

export async function fetchPipelineByJob(jobId?: string): Promise<PipelineEntry[]> {
  let query = supabase
    .from('job_applications')
    .select('id, job_id, user_id, ats_stage, status, created_at, updated_at, profiles(name, headline)')
    .order('updated_at', { ascending: false });

  if (jobId && jobId.trim()) query = query.eq('job_id', jobId.trim());

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data || []) as any[];
  return rows.map((row) => ({
    id: String(row.id),
    candidate_id: String(row.user_id),
    job_id: row.job_id || null,
    stage: toPipelineStage(row.ats_stage, row.status),
    metadata: {
      name: row?.profiles?.name || 'Candidate',
      title: row?.profiles?.headline || '',
      status: row?.status || null,
    },
    owner_id: String(row.user_id || ''),
    created_at: String(row.created_at || row.updated_at || new Date().toISOString()),
    updated_at: String(row.updated_at || row.created_at || new Date().toISOString()),
  }));
}

export async function fetchPipelineCounts(jobId?: string) {
  let query = supabase.from('job_applications').select('ats_stage,status');
  if (jobId && jobId.trim()) query = query.eq('job_id', jobId.trim());
  const { data, error } = await query;
  if (error) throw error;
  
  // Count by stage
  const counts: Record<string, number> = {};
  (data || []).forEach((item: any) => {
    const stage = toPipelineStage(item?.ats_stage, item?.status);
    counts[stage] = (counts[stage] || 0) + 1;
  });
  return counts;
}

export async function moveCandidate(pipelineId: string, newStage: PipelineStage) {
  const statusByStage: Record<PipelineStage, string> = {
    Applied: 'applied',
    Screening: 'under_review',
    Shortlisted: 'shortlisted',
    'Interview Scheduled': 'under_review',
    'Interview Completed': 'under_review',
    'Offer Sent': 'accepted',
    Hired: 'accepted',
    Rejected: 'rejected',
  };

  const { data, error } = await supabase
    .from('job_applications')
    .update({
      ats_stage: newStage,
      status: statusByStage[newStage],
      updated_at: new Date().toISOString(),
    })
    .eq('id', pipelineId)
    .select('id, job_id, user_id, ats_stage, status, created_at, updated_at, profiles(name, headline)')
    .single();
  if (error) throw error;

  const row = data as any;
  return {
    id: String(row.id),
    candidate_id: String(row.user_id),
    job_id: row.job_id || null,
    stage: toPipelineStage(row.ats_stage, row.status),
    metadata: {
      name: row?.profiles?.name || 'Candidate',
      title: row?.profiles?.headline || '',
      status: row?.status || null,
    },
    owner_id: String(row.user_id || ''),
    created_at: String(row.created_at || row.updated_at || new Date().toISOString()),
    updated_at: String(row.updated_at || row.created_at || new Date().toISOString()),
  };
}

function toPipelineStage(stage: string | null | undefined, status: string | null | undefined): PipelineStage {
  const normalized = String(stage || '').trim() as PipelineStage;
  if (
    normalized === 'Applied' ||
    normalized === 'Screening' ||
    normalized === 'Shortlisted' ||
    normalized === 'Interview Scheduled' ||
    normalized === 'Interview Completed' ||
    normalized === 'Offer Sent' ||
    normalized === 'Hired' ||
    normalized === 'Rejected'
  ) {
    return normalized;
  }

  if (status === 'shortlisted') return 'Shortlisted';
  if (status === 'rejected') return 'Rejected';
  if (status === 'accepted') return 'Offer Sent';
  if (status === 'under_review') return 'Screening';
  return 'Applied';
}

// Pipeline history is stored in candidate_pipeline_history table.
// The pipeline_id column in that table references the job_application.id since
// we now use job_applications as the source-of-truth for ATS stage tracking.
export async function getPipelineHistory(applicationId: string): Promise<PipelineHistory[]> {
  const { data, error } = await supabase
    .from('candidate_pipeline_history')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false });
  if (error) {
    // history table may not have rows yet; return empty rather than throw
    console.warn('getPipelineHistory:', error.message);
    return [];
  }
  return (data || []) as PipelineHistory[];
}
