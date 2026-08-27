import { supabase } from './supabase';
import type { LearningVideo } from './learningVideos';

/**
 * Library store for the Learning Studio.
 * Data lives in the existing `free_notes` table (one row per user per kind,
 * JSON payload in `content`) with a localStorage mirror so the UI stays instant
 * and keeps working offline. DB writes are debounced and fire-and-forget.
 */

const NAMESPACE = 'actro_learning';
export const LEARNING_LIBRARY_TAG = 'learning_library';

export type LearningLibraryKind = 'bookmarks' | 'history' | 'downloads' | 'courses' | 'streak';

const kindTag = (kind: LearningLibraryKind) => `${LEARNING_LIBRARY_TAG}:${kind}`;

export interface HistoryEntry {
  video: LearningVideo;
  watchedAt: number;
  watchCount: number;
  completed: boolean;
}

export interface DownloadEntry {
  video: LearningVideo;
  savedAt: number;
  sizeLabel: string;
}

export interface LearningCourse {
  id: string;
  title: string;
  topic: string;
  createdAt: number;
  videos: LearningVideo[];
  completedVideoIds: string[];
}

export interface LearningStreak {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  todayMinutes: number;
  dailyGoalMinutes: number;
  activeDays: string[];
}

export interface LearningLibrarySnapshot {
  bookmarks: LearningVideo[];
  history: HistoryEntry[];
  downloads: DownloadEntry[];
  courses: LearningCourse[];
  streak: LearningStreak;
}

const DEFAULT_STREAK: LearningStreak = {
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: '',
  todayMinutes: 0,
  dailyGoalMinutes: 30,
  activeDays: [],
};

const KIND_TITLES: Record<LearningLibraryKind, string> = {
  bookmarks: 'Learning Library · Bookmarks',
  history: 'Learning Library · Watch History',
  downloads: 'Learning Library · Downloads',
  courses: 'Learning Library · Courses',
  streak: 'Learning Library · Streak',
};

const storageKey = (kind: LearningLibraryKind, userId: string) => `${NAMESPACE}_${kind}_${userId || 'guest'}`;

const read = <T,>(kind: LearningLibraryKind, userId: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(storageKey(kind, userId));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
};

const writeLocal = <T,>(kind: LearningLibraryKind, userId: string, value: T): T => {
  try {
    localStorage.setItem(storageKey(kind, userId), JSON.stringify(value));
  } catch (error) {
    console.error('[LearningLibrary] failed to cache', kind, error);
  }
  return value;
};

/* ------------------------------- persistence ------------------------------- */

const rowIds = new Map<string, string>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

const rowKey = (kind: LearningLibraryKind, userId: string) => `${userId}::${kind}`;

const findRowId = async (kind: LearningLibraryKind, userId: string): Promise<string | null> => {
  const cached = rowIds.get(rowKey(kind, userId));
  if (cached) return cached;

  const { data, error } = await supabase
    .from('free_notes')
    .select('id')
    .eq('user_id', userId)
    .contains('tags', [kindTag(kind)])
    .limit(1)
    .maybeSingle();

  if (error || !data?.id) return null;
  rowIds.set(rowKey(kind, userId), String(data.id));
  return String(data.id);
};

const persist = async (kind: LearningLibraryKind, userId: string, value: unknown) => {
  if (!userId) return;

  const payload = {
    user_id: userId,
    title: KIND_TITLES[kind],
    content: JSON.stringify(value),
    type: 'personal',
    priority: 'low',
    status: 'archived',
    pinned: false,
    tags: [LEARNING_LIBRARY_TAG, kindTag(kind)],
  };

  try {
    const existingId = await findRowId(kind, userId);
    if (existingId) {
      const { error } = await supabase
        .from('free_notes')
        .update({ content: payload.content, title: payload.title, tags: payload.tags })
        .eq('id', existingId)
        .eq('user_id', userId);
      if (error) throw error;
      return;
    }

    const { data, error } = await supabase.from('free_notes').insert(payload).select('id').maybeSingle();
    if (error) throw error;
    if (data?.id) rowIds.set(rowKey(kind, userId), String(data.id));
  } catch (error) {
    console.error('[LearningLibrary] failed to sync', kind, error);
  }
};

/** Caches locally right away, then pushes to Supabase on a short debounce. */
const write = <T,>(kind: LearningLibraryKind, userId: string, value: T): T => {
  writeLocal(kind, userId, value);
  if (!userId) return value;

  const key = rowKey(kind, userId);
  const pending = timers.get(key);
  if (pending) clearTimeout(pending);
  timers.set(
    key,
    setTimeout(() => {
      timers.delete(key);
      void persist(kind, userId, value);
    }, 600)
  );
  return value;
};

const parseRow = <T,>(content: unknown, fallback: T): T => {
  try {
    const parsed = JSON.parse(String(content || ''));
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
};

const today = () => new Date().toISOString().slice(0, 10);

const daysBetween = (fromIso: string, toIso: string) => {
  const from = new Date(`${fromIso}T00:00:00`).getTime();
  const to = new Date(`${toIso}T00:00:00`).getTime();
  if (Number.isNaN(from) || Number.isNaN(to)) return Number.MAX_SAFE_INTEGER;
  return Math.round((to - from) / 86_400_000);
};

const estimateSizeLabel = (video: LearningVideo) => {
  const seed = String(video.video_id || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return `${(40 + (seed % 160)).toFixed(0)} MB`;
};

export const learningLibraryService = {
  /**
   * Pulls every library row for the user from Supabase, refreshes the local
   * cache and returns the merged snapshot. Falls back to cache when offline.
   */
  async hydrate(userId: string): Promise<LearningLibrarySnapshot> {
    const cached: LearningLibrarySnapshot = {
      bookmarks: this.getBookmarks(userId),
      history: this.getHistory(userId),
      downloads: this.getDownloads(userId),
      courses: this.getCourses(userId),
      streak: this.getStreak(userId),
    };

    if (!userId) return cached;

    try {
      const { data, error } = await supabase
        .from('free_notes')
        .select('id, content, tags')
        .eq('user_id', userId)
        .contains('tags', [LEARNING_LIBRARY_TAG]);

      if (error) throw error;

      const rows = Array.isArray(data) ? data : [];
      if (rows.length === 0) {
        // First sync for this account: push any local-only data up once.
        (Object.keys(cached) as LearningLibraryKind[]).forEach((kind) => {
          const value = cached[kind];
          const isEmpty = Array.isArray(value) ? value.length === 0 : !(value as LearningStreak).lastActiveDate;
          if (!isEmpty) void persist(kind, userId, value);
        });
        return cached;
      }

      const snapshot: LearningLibrarySnapshot = { ...cached };

      rows.forEach((row: any) => {
        const tags: string[] = Array.isArray(row.tags) ? row.tags.map(String) : [];
        const tag = tags.find((item) => item.startsWith(`${LEARNING_LIBRARY_TAG}:`));
        if (!tag) return;
        const kind = tag.replace(`${LEARNING_LIBRARY_TAG}:`, '') as LearningLibraryKind;
        rowIds.set(rowKey(kind, userId), String(row.id));

        switch (kind) {
          case 'bookmarks':
            snapshot.bookmarks = writeLocal(kind, userId, parseRow<LearningVideo[]>(row.content, []));
            break;
          case 'history':
            snapshot.history = writeLocal(kind, userId, parseRow<HistoryEntry[]>(row.content, []));
            break;
          case 'downloads':
            snapshot.downloads = writeLocal(kind, userId, parseRow<DownloadEntry[]>(row.content, []));
            break;
          case 'courses':
            snapshot.courses = writeLocal(kind, userId, parseRow<LearningCourse[]>(row.content, []));
            break;
          case 'streak':
            snapshot.streak = writeLocal(kind, userId, {
              ...DEFAULT_STREAK,
              ...parseRow<Partial<LearningStreak>>(row.content, {}),
            });
            break;
          default:
            break;
        }
      });

      snapshot.history = [...snapshot.history].sort((a, b) => b.watchedAt - a.watchedAt);
      snapshot.downloads = [...snapshot.downloads].sort((a, b) => b.savedAt - a.savedAt);
      snapshot.courses = [...snapshot.courses].sort((a, b) => b.createdAt - a.createdAt);
      return snapshot;
    } catch (error) {
      console.error('[LearningLibrary] hydrate failed, using cached data:', error);
      return cached;
    }
  },

  /* ---------------------------------- bookmarks --------------------------------- */
  getBookmarks(userId: string): LearningVideo[] {
    return read<LearningVideo[]>('bookmarks', userId, []);
  },

  toggleBookmark(userId: string, video: LearningVideo): LearningVideo[] {
    const current = this.getBookmarks(userId);
    const exists = current.some((item) => item.video_id === video.video_id);
    const next = exists
      ? current.filter((item) => item.video_id !== video.video_id)
      : [video, ...current];
    return write('bookmarks', userId, next);
  },

  removeBookmark(userId: string, videoId: string): LearningVideo[] {
    const next = this.getBookmarks(userId).filter((item) => item.video_id !== videoId);
    return write('bookmarks', userId, next);
  },

  clearBookmarks(userId: string): LearningVideo[] {
    return write('bookmarks', userId, [] as LearningVideo[]);
  },

  /* ----------------------------------- history ---------------------------------- */
  getHistory(userId: string): HistoryEntry[] {
    return read<HistoryEntry[]>('history', userId, []).sort((a, b) => b.watchedAt - a.watchedAt);
  },

  recordWatch(userId: string, video: LearningVideo): HistoryEntry[] {
    const current = read<HistoryEntry[]>('history', userId, []);
    const existing = current.find((entry) => entry.video.video_id === video.video_id);
    const entry: HistoryEntry = {
      video,
      watchedAt: Date.now(),
      watchCount: (existing?.watchCount || 0) + 1,
      completed: existing?.completed || false,
    };
    const next = [entry, ...current.filter((item) => item.video.video_id !== video.video_id)].slice(0, 200);
    return write('history', userId, next);
  },

  markHistoryCompleted(userId: string, videoId: string, completed: boolean): HistoryEntry[] {
    const next = read<HistoryEntry[]>('history', userId, []).map((entry) =>
      entry.video.video_id === videoId ? { ...entry, completed } : entry
    );
    return write('history', userId, next);
  },

  removeHistory(userId: string, videoId: string): HistoryEntry[] {
    const next = read<HistoryEntry[]>('history', userId, []).filter(
      (entry) => entry.video.video_id !== videoId
    );
    return write('history', userId, next);
  },

  clearHistory(userId: string): HistoryEntry[] {
    return write('history', userId, [] as HistoryEntry[]);
  },

  /* ---------------------------------- downloads --------------------------------- */
  getDownloads(userId: string): DownloadEntry[] {
    return read<DownloadEntry[]>('downloads', userId, []).sort((a, b) => b.savedAt - a.savedAt);
  },

  toggleDownload(userId: string, video: LearningVideo): DownloadEntry[] {
    const current = read<DownloadEntry[]>('downloads', userId, []);
    const exists = current.some((entry) => entry.video.video_id === video.video_id);
    const next = exists
      ? current.filter((entry) => entry.video.video_id !== video.video_id)
      : [{ video, savedAt: Date.now(), sizeLabel: estimateSizeLabel(video) }, ...current];
    return write('downloads', userId, next);
  },

  removeDownload(userId: string, videoId: string): DownloadEntry[] {
    const next = read<DownloadEntry[]>('downloads', userId, []).filter(
      (entry) => entry.video.video_id !== videoId
    );
    return write('downloads', userId, next);
  },

  clearDownloads(userId: string): DownloadEntry[] {
    return write('downloads', userId, [] as DownloadEntry[]);
  },

  /* ----------------------------------- courses ---------------------------------- */
  getCourses(userId: string): LearningCourse[] {
    return read<LearningCourse[]>('courses', userId, []).sort((a, b) => b.createdAt - a.createdAt);
  },

  enrollCourse(userId: string, topic: string, videos: LearningVideo[]): LearningCourse[] {
    const current = read<LearningCourse[]>('courses', userId, []);
    const normalizedTopic = topic.trim();
    if (!normalizedTopic || videos.length === 0) return current;

    const existing = current.find((course) => course.topic.toLowerCase() === normalizedTopic.toLowerCase());
    if (existing) {
      const merged = [...existing.videos];
      videos.forEach((video) => {
        if (!merged.some((item) => item.video_id === video.video_id)) merged.push(video);
      });
      const next = current.map((course) =>
        course.id === existing.id ? { ...course, videos: merged.slice(0, 25) } : course
      );
      return write('courses', userId, next);
    }

    const course: LearningCourse = {
      id: `course_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: normalizedTopic.replace(/\b\w/g, (char) => char.toUpperCase()),
      topic: normalizedTopic,
      createdAt: Date.now(),
      videos: videos.slice(0, 25),
      completedVideoIds: [],
    };
    return write('courses', userId, [course, ...current]);
  },

  toggleCourseLesson(userId: string, courseId: string, videoId: string): LearningCourse[] {
    const next = read<LearningCourse[]>('courses', userId, []).map((course) => {
      if (course.id !== courseId) return course;
      const done = course.completedVideoIds.includes(videoId);
      return {
        ...course,
        completedVideoIds: done
          ? course.completedVideoIds.filter((id) => id !== videoId)
          : [...course.completedVideoIds, videoId],
      };
    });
    return write('courses', userId, next);
  },

  removeCourse(userId: string, courseId: string): LearningCourse[] {
    const next = read<LearningCourse[]>('courses', userId, []).filter((course) => course.id !== courseId);
    return write('courses', userId, next);
  },

  /* ------------------------------------ streak ---------------------------------- */
  getStreak(userId: string): LearningStreak {
    return { ...DEFAULT_STREAK, ...read<Partial<LearningStreak>>('streak', userId, {}) };
  },

  /** Registers activity for today and rolls the streak counters forward. */
  touchStreak(userId: string, addedMinutes = 0): LearningStreak {
    const current = this.getStreak(userId);
    const day = today();

    if (current.lastActiveDate === day) {
      const updated: LearningStreak = {
        ...current,
        todayMinutes: current.todayMinutes + addedMinutes,
      };
      return write('streak', userId, updated);
    }

    const gap = current.lastActiveDate ? daysBetween(current.lastActiveDate, day) : Number.MAX_SAFE_INTEGER;
    const currentStreak = gap === 1 ? current.currentStreak + 1 : 1;

    const updated: LearningStreak = {
      ...current,
      currentStreak,
      longestStreak: Math.max(current.longestStreak, currentStreak),
      lastActiveDate: day,
      todayMinutes: addedMinutes,
      activeDays: Array.from(new Set([...current.activeDays, day])).slice(-90),
    };
    return write('streak', userId, updated);
  },

  setDailyGoal(userId: string, dailyGoalMinutes: number): LearningStreak {
    const updated = { ...this.getStreak(userId), dailyGoalMinutes: Math.max(5, dailyGoalMinutes) };
    return write('streak', userId, updated);
  },
};
