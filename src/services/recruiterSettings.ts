import { STORAGE_KEYS } from '@constants/index';

const getStorageKey = (recruiterId: string) => `${STORAGE_KEYS.PREFERENCES}:recruiter:${recruiterId}`;
const EMAIL_BLOCK_PREFIX = 'email:';

const normalizeEmail = (value?: string | null): string => String(value || '').trim().toLowerCase();

export interface RecruiterBlockedCandidate {
  candidateId: string;
  name: string;
  email?: string | null;
  headline?: string | null;
  blockedAt: string;
  reason?: string;
}

interface RecruiterNotificationSettings {
  newApplicantAlerts: boolean;
  unreadMessageAlerts: boolean;
  weeklyDigest: boolean;
}

export interface RecruiterSettings {
  notifications: RecruiterNotificationSettings;
  blockedCandidates: RecruiterBlockedCandidate[];
}

const DEFAULT_SETTINGS: RecruiterSettings = {
  notifications: {
    newApplicantAlerts: true,
    unreadMessageAlerts: true,
    weeklyDigest: false,
  },
  blockedCandidates: [],
};

const canUseStorage = (): boolean => typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const sanitizeSettings = (value: unknown): RecruiterSettings => {
  if (!value || typeof value !== 'object') return DEFAULT_SETTINGS;

  const record = value as Record<string, unknown>;
  const notificationsRaw = record.notifications as Record<string, unknown> | undefined;
  const blockedRaw = Array.isArray(record.blockedCandidates) ? record.blockedCandidates : [];

  const blockedCandidates = blockedRaw
    .map((entry) => {
      const item = entry as Record<string, unknown>;
      const email = normalizeEmail(item.email ? String(item.email) : null);
      const candidateId = String(item.candidateId || '').trim() || (email ? `${EMAIL_BLOCK_PREFIX}${email}` : '');
      if (!candidateId) return null;
      return {
        candidateId,
        name: String(item.name || 'Candidate'),
        email: email || null,
        headline: item.headline ? String(item.headline) : null,
        blockedAt: item.blockedAt ? String(item.blockedAt) : new Date().toISOString(),
        reason: item.reason ? String(item.reason) : undefined,
      } as RecruiterBlockedCandidate;
    })
    .filter(Boolean) as RecruiterBlockedCandidate[];

  return {
    notifications: {
      newApplicantAlerts: notificationsRaw?.newApplicantAlerts !== false,
      unreadMessageAlerts: notificationsRaw?.unreadMessageAlerts !== false,
      weeklyDigest: notificationsRaw?.weeklyDigest === true,
    },
    blockedCandidates,
  };
};

const loadSettings = (recruiterId: string): RecruiterSettings => {
  if (!canUseStorage() || !recruiterId) return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(getStorageKey(recruiterId));
    if (!raw) return DEFAULT_SETTINGS;
    return sanitizeSettings(JSON.parse(raw));
  } catch (error) {
    console.error('Failed to load recruiter settings', error);
    return DEFAULT_SETTINGS;
  }
};

const saveSettings = (recruiterId: string, settings: RecruiterSettings): RecruiterSettings => {
  const sanitized = sanitizeSettings(settings);
  if (!canUseStorage() || !recruiterId) return sanitized;
  try {
    localStorage.setItem(getStorageKey(recruiterId), JSON.stringify(sanitized));
  } catch (error) {
    console.error('Failed to save recruiter settings', error);
  }
  return sanitized;
};

const upsertBlockedCandidate = (
  recruiterId: string,
  input: Omit<RecruiterBlockedCandidate, 'blockedAt' | 'candidateId'> & {
    candidateId?: string | null;
    blockedAt?: string;
  }
): RecruiterSettings => {
  const current = loadSettings(recruiterId);
  const normalizedEmail = normalizeEmail(input.email ?? null);
  const resolvedCandidateId =
    String(input.candidateId || '').trim() || (normalizedEmail ? `${EMAIL_BLOCK_PREFIX}${normalizedEmail}` : '');

  if (!resolvedCandidateId) {
    throw new Error('candidateId or email is required to block candidate');
  }

  const nextCandidate: RecruiterBlockedCandidate = {
    candidateId: resolvedCandidateId,
    name: input.name || 'Candidate',
    email: normalizedEmail || null,
    headline: input.headline ?? null,
    blockedAt: input.blockedAt || new Date().toISOString(),
    reason: input.reason,
  };

  const deduped = current.blockedCandidates.filter((candidate) => {
    if (candidate.candidateId === resolvedCandidateId) return false;
    const candidateEmail = normalizeEmail(candidate.email);
    return !normalizedEmail || candidateEmail !== normalizedEmail;
  });
  const next = {
    ...current,
    blockedCandidates: [nextCandidate, ...deduped],
  };

  return saveSettings(recruiterId, next);
};

const removeBlockedCandidate = (recruiterId: string, candidateId: string): RecruiterSettings => {
  const current = loadSettings(recruiterId);
  const next = {
    ...current,
    blockedCandidates: current.blockedCandidates.filter((candidate) => candidate.candidateId !== candidateId),
  };
  return saveSettings(recruiterId, next);
};

const getBlockedCandidateIds = (recruiterId: string): Set<string> =>
  new Set(
    loadSettings(recruiterId)
      .blockedCandidates
      .map((candidate) => candidate.candidateId)
      .filter((candidateId) => candidateId && !candidateId.startsWith(EMAIL_BLOCK_PREFIX))
  );

const getBlockedCandidateEmails = (recruiterId: string): Set<string> => {
  const emails = new Set<string>();
  loadSettings(recruiterId).blockedCandidates.forEach((candidate) => {
    const normalized = normalizeEmail(candidate.email);
    if (normalized) {
      emails.add(normalized);
      return;
    }
    if (candidate.candidateId.startsWith(EMAIL_BLOCK_PREFIX)) {
      const emailFromId = normalizeEmail(candidate.candidateId.slice(EMAIL_BLOCK_PREFIX.length));
      if (emailFromId) emails.add(emailFromId);
    }
  });
  return emails;
};

const isCandidateBlocked = (recruiterId: string, candidateId: string): boolean =>
  getBlockedCandidateIds(recruiterId).has(candidateId);

const isCandidateBlockedByEmail = (recruiterId: string, email?: string | null): boolean => {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return getBlockedCandidateEmails(recruiterId).has(normalized);
};

const updateNotificationSettings = (
  recruiterId: string,
  updates: Partial<RecruiterNotificationSettings>
): RecruiterSettings => {
  const current = loadSettings(recruiterId);
  return saveSettings(recruiterId, {
    ...current,
    notifications: {
      ...current.notifications,
      ...updates,
    },
  });
};

export const recruiterSettingsService = {
  loadSettings,
  saveSettings,
  updateNotificationSettings,
  upsertBlockedCandidate,
  removeBlockedCandidate,
  getBlockedCandidateIds,
  getBlockedCandidateEmails,
  isCandidateBlocked,
  isCandidateBlockedByEmail,
};
