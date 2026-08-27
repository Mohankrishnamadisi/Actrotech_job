import { supabase } from './supabase';

export interface LearningNote {
  id: string;
  videoId: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

const LEARNING_TAG = 'learning_studio';
const VIDEO_TAG_PREFIX = 'learning_video:';

const toVideoTag = (videoId: string) => `${VIDEO_TAG_PREFIX}${videoId}`;

const toLearningNote = (row: any, videoId: string): LearningNote => ({
  id: String(row.id || ''),
  videoId,
  userId: String(row.user_id || ''),
  title: String(row.title || ''),
  content: String(row.content || ''),
  tags: Array.isArray(row.tags) ? row.tags.map((tag: unknown) => String(tag)).filter(Boolean) : [],
  createdAt: new Date(row.created_at || new Date().toISOString()).getTime(),
  updatedAt: new Date(row.updated_at || new Date().toISOString()).getTime(),
});

const getLearningTitle = (noteTitle?: string | null) => {
  const clean = String(noteTitle || '').trim();
  return clean || 'Untitled Note';
};

export const learningNotesService = {
  async listNotes(userId: string): Promise<LearningNote[]> {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('free_notes')
      .select('id, user_id, title, content, tags, created_at, updated_at')
      .eq('user_id', userId)
      .contains('tags', [LEARNING_TAG])
      .order('updated_at', { ascending: false })
      .limit(300);

    if (error) throw error;

    const rows = Array.isArray(data) ? data : [];
    return rows.map((row: any) => {
      const tags = Array.isArray(row.tags) ? row.tags.map((tag: unknown) => String(tag)) : [];
      const videoTag = tags.find((tag) => tag.startsWith(VIDEO_TAG_PREFIX)) || '';
      const videoId = videoTag.replace(VIDEO_TAG_PREFIX, '');
      return toLearningNote(row, videoId);
    });
  },

  async getNoteById(userId: string, noteId: string): Promise<LearningNote | null> {
    if (!userId || !noteId) return null;

    const { data, error } = await supabase
      .from('free_notes')
      .select('id, user_id, title, content, tags, created_at, updated_at')
      .eq('user_id', userId)
      .eq('id', noteId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const tags = Array.isArray((data as any).tags)
      ? (data as any).tags.map((tag: unknown) => String(tag))
      : [];
    const videoTag = tags.find((tag) => tag.startsWith(VIDEO_TAG_PREFIX)) || '';
    return toLearningNote(data, videoTag.replace(VIDEO_TAG_PREFIX, ''));
  },

  async getLatestNoteForVideo(userId: string, videoId: string): Promise<LearningNote | null> {
    return this.getNote(userId, videoId);
  },

  async getNote(userId: string, videoId: string): Promise<LearningNote | null> {
    if (!userId || !videoId) return null;

    const videoTag = toVideoTag(videoId);
    const { data, error } = await supabase
      .from('free_notes')
      .select('id, user_id, title, content, tags, created_at, updated_at')
      .eq('user_id', userId)
      .contains('tags', [videoTag])
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return toLearningNote(data, videoId);
  },

  async saveNote(params: {
    userId: string;
    videoId: string;
    content: string;
    noteTitle?: string;
    noteId?: string | null;
    forceCreate?: boolean;
  }): Promise<LearningNote> {
    const { userId, videoId, content, noteTitle, noteId, forceCreate = false } = params;

    if (!userId || !videoId) {
      throw new Error('User ID and Video ID are required');
    }

    const videoTag = toVideoTag(videoId);
    const existing = forceCreate
      ? null
      : noteId
        ? await this.getNoteById(userId, noteId)
        : await this.getNote(userId, videoId);

    if (existing?.id) {
      const { data, error } = await supabase
        .from('free_notes')
        .update({
          title: getLearningTitle(noteTitle),
          content,
          tags: Array.from(new Set([...existing.tags, LEARNING_TAG, videoTag])),
          type: 'personal',
          priority: 'medium',
          status: 'open',
        })
        .eq('id', existing.id)
        .eq('user_id', userId)
        .select('id, user_id, title, content, tags, created_at, updated_at')
        .single();

      if (error) throw error;
      return toLearningNote(data, videoId);
    }

    const { data, error } = await supabase
      .from('free_notes')
      .insert({
        user_id: userId,
        title: getLearningTitle(noteTitle),
        content,
        type: 'personal',
        priority: 'medium',
        status: 'open',
        tags: [LEARNING_TAG, videoTag],
      })
      .select('id, user_id, title, content, tags, created_at, updated_at')
      .single();

    if (error) throw error;
    return toLearningNote(data, videoId);
  },

  async deleteNoteById(userId: string, noteId: string): Promise<void> {
    if (!userId || !noteId) return;

    const { error } = await supabase
      .from('free_notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async deleteNote(userId: string, videoId: string): Promise<void> {
    if (!userId || !videoId) return;

    const existing = await this.getNote(userId, videoId);
    if (!existing?.id) return;

    await this.deleteNoteById(userId, existing.id);
  },

  async getNotesCount(userId: string): Promise<number> {
    if (!userId) return 0;

    const { count, error } = await supabase
      .from('free_notes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .contains('tags', [LEARNING_TAG]);

    if (error) throw error;
    return Number(count || 0);
  },
};
