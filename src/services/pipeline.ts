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
  let query = supabase.from('candidate_pipeline').select('*').order('updated_at', { ascending: false });
  if (jobId) query = query.eq('job_id', jobId);
  const { data, error } = await query;
  if (error) throw error;
  return data as PipelineEntry[];
}

export async function fetchPipelineCounts(jobId?: string) {
  // Fetch all pipeline entries and count by stage client-side
  let query = supabase.from('candidate_pipeline').select('stage');
  if (jobId) query = query.eq('job_id', jobId);
  const { data, error } = await query;
  if (error) throw error;
  
  // Count by stage
  const counts: Record<string, number> = {};
  (data || []).forEach(item => {
    counts[item.stage] = (counts[item.stage] || 0) + 1;
  });
  return counts;
}

export async function moveCandidate(pipelineId: string, newStage: PipelineStage) {
  const { data, error } = await supabase
    .from('candidate_pipeline')
    .update({ stage: newStage })
    .eq('id', pipelineId)
    .select()
    .single();
  if (error) throw error;
  return data as PipelineEntry;
}

export async function createPipelineEntry(payload: {
  candidate_id: string;
  job_id?: string | null;
  stage?: PipelineStage;
  owner_id: string;
  metadata?: any;
}) {
  const entry = {
    candidate_id: payload.candidate_id,
    job_id: payload.job_id || null,
    stage: payload.stage || 'Applied',
    owner_id: payload.owner_id,
    metadata: payload.metadata || {}
  };
  const { data, error } = await supabase.from('candidate_pipeline').insert(entry).select().single();
  if (error) throw error;
  return data as PipelineEntry;
}

export async function getPipelineHistory(pipelineId: string) {
  const { data, error } = await supabase
    .from('candidate_pipeline_history')
    .select('*')
    .eq('pipeline_id', pipelineId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as PipelineHistory[];
}

export async function subscribeToPipelineChanges(callback: (payload: any) => void) {
  // Requires Realtime or Postgres changes configured in Supabase project
  // Example using Realtime (worker) - adjust for your Supabase client version
  const channel = supabase.channel('public:candidate_pipeline')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'candidate_pipeline' }, payload => {
      callback(payload);
    })
    .subscribe();
  return channel;
}
