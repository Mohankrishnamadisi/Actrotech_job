import { supabase } from './supabase';
import type { CandidateNote } from '@types';

export type { CandidateNote };

const NOTE_SELECT = `
  *,
  recruiter:recruiters!candidate_notes_recruiter_id_fkey (
    id,
    hr_name,
    hr_email,
    company_name
  )
`;

export async function getApplicationNotes(applicationId: string): Promise<CandidateNote[]> {
  const { data, error } = await supabase
    .from('candidate_notes')
    .select(NOTE_SELECT)
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as CandidateNote[];
}

export async function getCandidateNotes(
  candidateId: string,
  recruiterId: string
): Promise<CandidateNote[]> {
  const { data, error } = await supabase
    .from('candidate_notes')
    .select(NOTE_SELECT)
    .eq('candidate_id', candidateId)
    .eq('recruiter_id', recruiterId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as CandidateNote[];
}

export async function createNote(payload: {
  applicationId: string;
  candidateId: string;
  recruiterId: string;
  note: string;
}): Promise<CandidateNote> {
  const { data, error } = await supabase
    .from('candidate_notes')
    .insert({
      application_id: payload.applicationId,
      candidate_id: payload.candidateId,
      recruiter_id: payload.recruiterId,
      note: payload.note.trim(),
    })
    .select(NOTE_SELECT)
    .single();

  if (error) throw error;
  return data as CandidateNote;
}

export async function updateNote(noteId: string, note: string): Promise<CandidateNote> {
  const { data, error } = await supabase
    .from('candidate_notes')
    .update({ note: note.trim() })
    .eq('id', noteId)
    .select(NOTE_SELECT)
    .single();

  if (error) throw error;
  return data as CandidateNote;
}

export async function deleteNote(noteId: string): Promise<void> {
  const { error } = await supabase.from('candidate_notes').delete().eq('id', noteId);
  if (error) throw error;
}

export const candidateNoteService = {
  getApplicationNotes,
  getCandidateNotes,
  createNote,
  updateNote,
  deleteNote,
};
