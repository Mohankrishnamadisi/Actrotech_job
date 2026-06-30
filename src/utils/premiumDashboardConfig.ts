import { STORAGE_KEYS } from '@constants/index';

export type DemandWeights = {
  profileStrength: number;
  applications: number;
  interactions: number;
  skills: number;
};

export type WeeklyGoalTargets = {
  applications: number;
  interactions: number;
  pipeline: number;
};

export type PremiumDashboardConfig = {
  selectedRole: string;
  roleWeights: Record<string, DemandWeights>;
  weeklyTargets: WeeklyGoalTargets;
};

export const PREMIUM_DASHBOARD_CONFIG_KEY = 'actro_premium_dashboard_config';

export const DEFAULT_WEIGHTS: DemandWeights = {
  profileStrength: 0.4,
  applications: 1.5,
  interactions: 0.9,
  skills: 2.2,
};

export const DEFAULT_WEEKLY_TARGETS: WeeklyGoalTargets = {
  applications: 6,
  interactions: 10,
  pipeline: 4,
};

export const ROLE_WEIGHT_PRESETS: Record<string, DemandWeights> = {
  General: DEFAULT_WEIGHTS,
  'Frontend Developer': { profileStrength: 0.42, applications: 1.3, interactions: 1.1, skills: 2.45 },
  'React Developer': { profileStrength: 0.43, applications: 1.28, interactions: 1.18, skills: 2.5 },
  'Angular Developer': { profileStrength: 0.44, applications: 1.3, interactions: 1.1, skills: 2.42 },
  'Vue Developer': { profileStrength: 0.42, applications: 1.28, interactions: 1.15, skills: 2.44 },
  'Backend Developer': { profileStrength: 0.45, applications: 1.56, interactions: 0.82, skills: 2.32 },
  'Python Developer': { profileStrength: 0.46, applications: 1.52, interactions: 0.84, skills: 2.34 },
  'Java Developer': { profileStrength: 0.47, applications: 1.55, interactions: 0.8, skills: 2.3 },
  'Full Stack Developer': { profileStrength: 0.46, applications: 1.47, interactions: 0.94, skills: 2.36 },
  DevOps: { profileStrength: 0.44, applications: 1.44, interactions: 1.02, skills: 2.16 },
  Testing: { profileStrength: 0.48, applications: 1.36, interactions: 0.96, skills: 2.05 },
  'Data Analyst': { profileStrength: 0.54, applications: 1.32, interactions: 0.9, skills: 2.18 },
  'Data Scientist': { profileStrength: 0.56, applications: 1.24, interactions: 0.92, skills: 2.2 },
  'UI/UX Designer': { profileStrength: 0.52, applications: 1.2, interactions: 1.16, skills: 2.08 },
  'Product Manager': { profileStrength: 0.6, applications: 1.08, interactions: 1.3, skills: 1.86 },
};

export const safeNumber = (value: unknown, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const getWeightsForRole = (role: string, roleWeights: Record<string, DemandWeights>): DemandWeights => {
  if (roleWeights[role]) return roleWeights[role];
  if (ROLE_WEIGHT_PRESETS[role]) return ROLE_WEIGHT_PRESETS[role];
  return DEFAULT_WEIGHTS;
};

export const readLocalPreferencesRole = (): string => {
  try {
    const store = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    const parsed = store ? JSON.parse(store) : {};
    return parsed?.jobPreferences?.desiredRole || 'General';
  } catch {
    return 'General';
  }
};

export const readLocalPremiumConfig = (): Partial<PremiumDashboardConfig> => {
  try {
    const raw = localStorage.getItem(PREMIUM_DASHBOARD_CONFIG_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

export const persistLocalPremiumConfig = (config: PremiumDashboardConfig) => {
  try {
    localStorage.setItem(PREMIUM_DASHBOARD_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // noop
  }
};

export const mergePremiumDashboardConfig = (
  apiConfig: Partial<PremiumDashboardConfig>,
  localConfig: Partial<PremiumDashboardConfig>,
  fallbackRole?: string,
): PremiumDashboardConfig => {
  const roleWeights = {
    General: DEFAULT_WEIGHTS,
    ...(localConfig.roleWeights || {}),
    ...(apiConfig.roleWeights || {}),
  };

  return {
    selectedRole: String(apiConfig.selectedRole || localConfig.selectedRole || fallbackRole || 'General'),
    roleWeights,
    weeklyTargets: {
      applications: clamp(
        Math.round(safeNumber(apiConfig.weeklyTargets?.applications, safeNumber(localConfig.weeklyTargets?.applications, DEFAULT_WEEKLY_TARGETS.applications))),
        1,
        50,
      ),
      interactions: clamp(
        Math.round(safeNumber(apiConfig.weeklyTargets?.interactions, safeNumber(localConfig.weeklyTargets?.interactions, DEFAULT_WEEKLY_TARGETS.interactions))),
        1,
        80,
      ),
      pipeline: clamp(
        Math.round(safeNumber(apiConfig.weeklyTargets?.pipeline, safeNumber(localConfig.weeklyTargets?.pipeline, DEFAULT_WEEKLY_TARGETS.pipeline))),
        1,
        20,
      ),
    },
  };
};
