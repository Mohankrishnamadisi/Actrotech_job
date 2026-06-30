import { supabase } from './supabase';

export type FreeNoteType = 'personal' | 'recruiter_call' | 'interview' | 'follow_up' | 'offer';
export type FreeNotePriority = 'low' | 'medium' | 'high' | 'critical';
export type FreeNoteStatus = 'open' | 'in_progress' | 'done' | 'archived';

export interface FreeNote {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: FreeNoteType;
  priority: FreeNotePriority;
  status: FreeNoteStatus;
  tags: string[];
  recruiter_name?: string;
  company_name?: string;
  call_date?: string;
  interview_date?: string;
  follow_up_at?: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

const toSafeArray = (value: unknown): FreeNote[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === 'object')
    .map((item: any) => ({
      id: String(item.id || ''),
      user_id: String(item.user_id || ''),
      title: String(item.title || ''),
      content: String(item.content || ''),
      type: item.type || 'personal',
      priority: item.priority || 'medium',
      status: item.status || 'open',
      tags: Array.isArray(item.tags) ? item.tags.map((tag: unknown) => String(tag)).filter(Boolean) : [],
      recruiter_name: item.recruiter_name ? String(item.recruiter_name) : undefined,
      company_name: item.company_name ? String(item.company_name) : undefined,
      call_date: item.call_date ? String(item.call_date) : undefined,
      interview_date: item.interview_date ? String(item.interview_date) : undefined,
      follow_up_at: item.follow_up_at ? String(item.follow_up_at) : undefined,
      pinned: Boolean(item.pinned),
      created_at: String(item.created_at || new Date().toISOString()),
      updated_at: String(item.updated_at || new Date().toISOString()),
    }))
    .filter((note) => note.id && note.title);
};

const sortNotes = (notes: FreeNote[]): FreeNote[] => {
  return [...notes].sort((x, y) => {
    if (x.pinned !== y.pinned) return x.pinned ? -1 : 1;
    return new Date(y.updated_at).getTime() - new Date(x.updated_at).getTime();
  });
};

export const freeNotesService = {
  async getNotes(userId: string): Promise<FreeNote[]> {
    const { data, error } = await supabase
      .from('free_notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return sortNotes(toSafeArray(data || []));
  },

  async createNote(userId: string, payload: Omit<FreeNote, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<FreeNote[]> {
    const { error } = await supabase
      .from('free_notes')
      .insert({
        user_id: userId,
        title: payload.title.trim(),
        content: payload.content.trim(),
        type: payload.type,
        priority: payload.priority,
        status: payload.status,
        tags: payload.tags,
        recruiter_name: payload.recruiter_name || null,
        company_name: payload.company_name || null,
        call_date: payload.call_date || null,
        interview_date: payload.interview_date || null,
        follow_up_at: payload.follow_up_at || null,
        pinned: payload.pinned,
      });

    if (error) throw error;
    return this.getNotes(userId);
  },

  async updateNote(userId: string, noteId: string, updates: Partial<Omit<FreeNote, 'id' | 'user_id' | 'created_at'>>): Promise<FreeNote[]> {
    const normalizedUpdates: Record<string, unknown> = {};
    if (typeof updates.title === 'string') normalizedUpdates.title = updates.title.trim();
    if (typeof updates.content === 'string') normalizedUpdates.content = updates.content.trim();
    if (updates.type) normalizedUpdates.type = updates.type;
    if (updates.priority) normalizedUpdates.priority = updates.priority;
    if (updates.status) normalizedUpdates.status = updates.status;
    if (Array.isArray(updates.tags)) normalizedUpdates.tags = updates.tags;
    if (updates.recruiter_name !== undefined) normalizedUpdates.recruiter_name = updates.recruiter_name || null;
    if (updates.company_name !== undefined) normalizedUpdates.company_name = updates.company_name || null;
    if (updates.call_date !== undefined) normalizedUpdates.call_date = updates.call_date || null;
    if (updates.interview_date !== undefined) normalizedUpdates.interview_date = updates.interview_date || null;
    if (updates.follow_up_at !== undefined) normalizedUpdates.follow_up_at = updates.follow_up_at || null;
    if (typeof updates.pinned === 'boolean') normalizedUpdates.pinned = updates.pinned;

    const { error } = await supabase
      .from('free_notes')
      .update(normalizedUpdates)
      .eq('id', noteId)
      .eq('user_id', userId);

    if (error) throw error;
    return this.getNotes(userId);
  },

  async deleteNote(userId: string, noteId: string): Promise<FreeNote[]> {
    const { error } = await supabase
      .from('free_notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', userId);

    if (error) throw error;
    return this.getNotes(userId);
  },
};
