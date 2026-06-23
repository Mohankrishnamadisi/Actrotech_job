import { supabase } from './supabase';
import type { CandidateTag, CandidateTagAssignment } from '@types';

export type { CandidateTag, CandidateTagAssignment };

export async function getRecruiterTags(recruiterId: string): Promise<CandidateTag[]> {
  const { data, error } = await supabase
    .from('candidate_tags')
    .select('*')
    .eq('recruiter_id', recruiterId)
    .order('name', { ascending: true });

  if (error) throw error;
  return (data || []) as CandidateTag[];
}

export async function createTag(
  recruiterId: string,
  payload: { name: string; color: string }
): Promise<CandidateTag> {
  const { data, error } = await supabase
    .from('candidate_tags')
    .insert({
      recruiter_id: recruiterId,
      name: payload.name.trim(),
      color: payload.color,
    })
    .select()
    .single();

  if (error) throw error;
  return data as CandidateTag;
}

export async function updateTag(
  tagId: string,
  updates: { name?: string; color?: string }
): Promise<CandidateTag> {
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.color !== undefined) payload.color = updates.color;

  const { data, error } = await supabase
    .from('candidate_tags')
    .update(payload)
    .eq('id', tagId)
    .select()
    .single();

  if (error) throw error;
  return data as CandidateTag;
}

export async function deleteTag(tagId: string): Promise<void> {
  const { error } = await supabase.from('candidate_tags').delete().eq('id', tagId);
  if (error) throw error;
}

export async function getAssignmentsForCandidates(
  candidateIds: string[]
): Promise<CandidateTagAssignment[]> {
  if (candidateIds.length === 0) return [];

  const { data, error } = await supabase
    .from('candidate_tag_assignments')
    .select('*, candidate_tags(*)')
    .in('candidate_id', candidateIds);

  if (error) throw error;
  return (data || []) as CandidateTagAssignment[];
}

export async function getCandidateTagAssignments(
  candidateId: string
): Promise<CandidateTagAssignment[]> {
  const { data, error } = await supabase
    .from('candidate_tag_assignments')
    .select('*, candidate_tags(*)')
    .eq('candidate_id', candidateId);

  if (error) throw error;
  return (data || []) as CandidateTagAssignment[];
}

export async function assignTagsToCandidate(
  candidateId: string,
  tagIds: string[],
  assignedBy: string
): Promise<CandidateTagAssignment[]> {
  if (tagIds.length === 0) return [];

  const rows = tagIds.map((tagId) => ({
    tag_id: tagId,
    candidate_id: candidateId,
    assigned_by: assignedBy,
  }));

  const { data, error } = await supabase
    .from('candidate_tag_assignments')
    .upsert(rows, { onConflict: 'tag_id,candidate_id', ignoreDuplicates: true })
    .select('*, candidate_tags(*)');

  if (error) throw error;
  return (data || []) as CandidateTagAssignment[];
}

export async function removeTagAssignment(assignmentId: string): Promise<void> {
  const { error } = await supabase
    .from('candidate_tag_assignments')
    .delete()
    .eq('id', assignmentId);

  if (error) throw error;
}

export async function setCandidateTags(
  candidateId: string,
  tagIds: string[],
  assignedBy: string
): Promise<CandidateTagAssignment[]> {
  const current = await getCandidateTagAssignments(candidateId);
  const currentTagIds = new Set(current.map((a) => a.tag_id));
  const desiredTagIds = new Set(tagIds);

  const toRemove = current.filter((a) => !desiredTagIds.has(a.tag_id));
  const toAdd = tagIds.filter((id) => !currentTagIds.has(id));

  await Promise.all(toRemove.map((a) => removeTagAssignment(a.id)));

  if (toAdd.length > 0) {
    await assignTagsToCandidate(candidateId, toAdd, assignedBy);
  }

  return getCandidateTagAssignments(candidateId);
}

/** Group assignments by candidate_id for fast lookup in applicant lists */
export function groupAssignmentsByCandidate(
  assignments: CandidateTagAssignment[]
): Record<string, CandidateTagAssignment[]> {
  return assignments.reduce<Record<string, CandidateTagAssignment[]>>((acc, assignment) => {
    const key = assignment.candidate_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(assignment);
    return acc;
  }, {});
}

/** Filter applicants whose candidate profile has at least one of the selected tag IDs */
export function filterByTagIds<T extends { user_id: string }>(
  applicants: T[],
  tagAssignmentsByCandidate: Record<string, CandidateTagAssignment[]>,
  selectedTagIds: string[]
): T[] {
  if (selectedTagIds.length === 0) return applicants;

  return applicants.filter((app) => {
    const assignments = tagAssignmentsByCandidate[app.user_id] || [];
    const candidateTagIds = assignments.map((a) => a.tag_id);
    return selectedTagIds.some((tagId) => candidateTagIds.includes(tagId));
  });
}

export const candidateTagService = {
  getRecruiterTags,
  createTag,
  updateTag,
  deleteTag,
  getAssignmentsForCandidates,
  getCandidateTagAssignments,
  assignTagsToCandidate,
  removeTagAssignment,
  setCandidateTags,
  groupAssignmentsByCandidate,
  filterByTagIds,
};
