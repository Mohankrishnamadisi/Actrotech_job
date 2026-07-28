export type PwaInstallEventName =
  | 'install_prompt_shown'
  | 'install_accepted'
  | 'install_dismissed'
  | 'ios_instructions_viewed'
  | 'already_installed'
  | 'unsupported_browser';

export interface PwaInstallEvent {
  id: string;
  event: PwaInstallEventName;
  at: string;
  payload?: Record<string, unknown>;
}

const STORAGE_KEY = 'actro:pwa-install-analytics:v1';
const MAX_EVENTS = 100;

const safeRead = (): PwaInstallEvent[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as PwaInstallEvent[] : [];
  } catch {
    return [];
  }
};

const safeWrite = (events: PwaInstallEvent[]) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(0, MAX_EVENTS)));
  } catch {
    // no-op
  }
};

const makeId = () => `pwa_evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const pwaInstallAnalyticsService = {
  track(event: PwaInstallEventName, payload?: Record<string, unknown>) {
    const item: PwaInstallEvent = {
      id: makeId(),
      event,
      at: new Date().toISOString(),
      payload,
    };

    const previous = safeRead();
    const next = [item, ...previous];
    safeWrite(next);

    window.dispatchEvent(new CustomEvent('pwa:install-analytics', { detail: item }));
    return item;
  },

  getEvents(): PwaInstallEvent[] {
    return safeRead();
  },

  clear() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // no-op
    }
  },
};

export default pwaInstallAnalyticsService;
