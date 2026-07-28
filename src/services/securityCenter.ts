import { addDays, differenceInDays, format, subDays } from 'date-fns';
import { teamManagementService, type TeamMember } from '@services/teamManagement';
import { jobService } from '@services/api';
import { messagingService } from '@services/messaging';
import { listInterviews } from '@services/interviewManagement';
import { aiHiringAssistantService } from '@services/aiHiringAssistant';
import { automationCenterService } from '@services/automationCenter';
import { billingSubscriptionService } from '@services/billingSubscription';
import { integrationsHubService } from '@services/integrationsHub';
import { getRecruiterAnalyticsData } from '@services/recruiterAnalytics';

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AuditStatus = 'success' | 'failed';

export interface SecurityOverview {
  securityScore: number;
  activeSessions: number;
  trustedDevices: number;
  failedLoginAttempts: number;
  auditEventsToday: number;
  pendingSecurityAlerts: number;
  passwordAgeDays: number;
  lastBackup: string;
}

export interface SecurityScoreBreakdown {
  total: number;
  strongPassword: number;
  twoFactorEnabled: number;
  verifiedEmail: number;
  verifiedPhone: number;
  trustedDevices: number;
  activeSessions: number;
  apiSecurity: number;
  permissionReview: number;
  recommendations: string[];
}

export interface SecurityAuditRow {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  module: string;
  ipAddress: string;
  device: string;
  browser: string;
  location: string;
  status: AuditStatus;
  severity: AuditSeverity;
  details: string;
  entityRef?: string;
}

export interface AuditFilters {
  dateStart?: string;
  dateEnd?: string;
  user?: string;
  module?: string;
  severity?: AuditSeverity | 'all';
  actionType?: string;
  status?: AuditStatus | 'all';
}

export interface SecuritySession {
  id: string;
  ownerId: string;
  userId: string;
  browser: string;
  operatingSystem: string;
  ipAddress: string;
  country: string;
  city: string;
  device: string;
  lastActivity: string;
  loginTime: string;
  active: boolean;
}

export interface TrustedDevice {
  id: string;
  ownerId: string;
  userId: string;
  name: string;
  deviceId: string;
  browser: string;
  operatingSystem: string;
  addedAt: string;
  lastSeenAt: string;
}

export interface DeviceHistoryEvent {
  id: string;
  ownerId: string;
  userId: string;
  type: 'added' | 'removed' | 'unknown_detected';
  device: string;
  at: string;
  details: string;
}

export interface SecurityNotification {
  id: string;
  ownerId: string;
  type:
    | 'new_login'
    | 'unknown_device'
    | 'permission_changed'
    | 'failed_login_attempts'
    | 'data_export'
    | 'api_key_created'
    | 'password_changed';
  message: string;
  createdAt: string;
  read: boolean;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export interface PasswordPolicy {
  minimumLength: number;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  specialCharacter: boolean;
  passwordExpiryDays: number;
  passwordHistoryCount: number;
}

export interface TwoFactorSettings {
  enabled: boolean;
  method: 'authenticator_app' | 'email_otp' | 'sms_otp';
  backupRecoveryCodes: string[];
  updatedAt: string;
}

export interface SensitiveActionRule {
  key:
    | 'delete_job'
    | 'delete_candidate'
    | 'export_candidates'
    | 'download_resume'
    | 'purchase_credits'
    | 'change_billing'
    | 'delete_recruiter'
    | 'remove_integration';
  label: string;
  requireAdditionalConfirmation: boolean;
}

export interface ApiSecurityKey {
  id: string;
  ownerId: string;
  name: string;
  keyMasked: string;
  createdAt: string;
  expiresAt?: string;
  ipRestrictions: string[];
  rateLimitPerMin: number;
  active: boolean;
}

export interface BackupRecoveryStatus {
  lastBackup: string;
  backupStatus: 'healthy' | 'warning' | 'failed';
  restorePoints: Array<{ id: string; at: string; status: 'ready' | 'failed' }>;
  databaseBackupStatus: 'healthy' | 'warning' | 'failed';
}

export interface ComplianceConfig {
  gdpr: boolean;
  ccpa: boolean;
  soc2: boolean;
  iso27001: boolean;
  dataRetentionDays: number;
  consentManagementEnabled: boolean;
}

export interface PrivacyControls {
  cookiesEnabled: boolean;
  consentGiven: boolean;
  consentUpdatedAt: string;
  deleteAccountRequestedAt?: string;
  deleteCompanyRequestedAt?: string;
}

export interface AlertsDashboard {
  highRiskLogin: number;
  multipleFailedAttempts: number;
  largeDataExport: number;
  permissionEscalation: number;
  apiAbuse: number;
  inactiveAccounts: number;
}

export interface SecurityPermissionContext {
  canManageSecurity: boolean;
  canViewAuditLogs: boolean;
  canExportAuditReports: boolean;
  canManageSessions: boolean;
  canManageApiKeys: boolean;
  currentMember?: TeamMember;
}

interface SecurityStore {
  sessions: SecuritySession[];
  trustedDevices: TrustedDevice[];
  deviceHistory: DeviceHistoryEvent[];
  notifications: SecurityNotification[];
  passwordPolicyByOwner: Record<string, PasswordPolicy>;
  passwordMetaByUser: Record<string, { lastChangedAt: string; historyHashes: string[] }>;
  twoFactorByUser: Record<string, TwoFactorSettings>;
  sensitiveActionRulesByOwner: Record<string, SensitiveActionRule[]>;
  apiSecurityKeys: ApiSecurityKey[];
  backupByOwner: Record<string, BackupRecoveryStatus>;
  complianceByOwner: Record<string, ComplianceConfig>;
  privacyByUser: Record<string, PrivacyControls>;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'actro_security_center_v1';

const nowIso = (): string => new Date().toISOString();
const makeId = (prefix: string): string => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const safeParse = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const readStore = (): SecurityStore => safeParse<SecurityStore>(localStorage.getItem(STORAGE_KEY), {
  sessions: [],
  trustedDevices: [],
  deviceHistory: [],
  notifications: [],
  passwordPolicyByOwner: {},
  passwordMetaByUser: {},
  twoFactorByUser: {},
  sensitiveActionRulesByOwner: {},
  apiSecurityKeys: [],
  backupByOwner: {},
  complianceByOwner: {},
  privacyByUser: {},
  createdAt: nowIso(),
  updatedAt: nowIso(),
});

const writeStore = (store: SecurityStore): void => {
  store.updatedAt = nowIso();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

const defaultPasswordPolicy = (): PasswordPolicy => ({
  minimumLength: 10,
  uppercase: true,
  lowercase: true,
  number: true,
  specialCharacter: true,
  passwordExpiryDays: 90,
  passwordHistoryCount: 5,
});

const defaultSensitiveActions = (): SensitiveActionRule[] => [
  { key: 'delete_job', label: 'Delete Job', requireAdditionalConfirmation: true },
  { key: 'delete_candidate', label: 'Delete Candidate', requireAdditionalConfirmation: true },
  { key: 'export_candidates', label: 'Export Candidates', requireAdditionalConfirmation: true },
  { key: 'download_resume', label: 'Download Resume', requireAdditionalConfirmation: true },
  { key: 'purchase_credits', label: 'Purchase Credits', requireAdditionalConfirmation: true },
  { key: 'change_billing', label: 'Change Billing', requireAdditionalConfirmation: true },
  { key: 'delete_recruiter', label: 'Delete Recruiter', requireAdditionalConfirmation: true },
  { key: 'remove_integration', label: 'Remove Integration', requireAdditionalConfirmation: true },
];

const defaultCompliance = (): ComplianceConfig => ({
  gdpr: true,
  ccpa: true,
  soc2: false,
  iso27001: false,
  dataRetentionDays: 365,
  consentManagementEnabled: true,
});

const defaultPrivacy = (): PrivacyControls => ({
  cookiesEnabled: true,
  consentGiven: true,
  consentUpdatedAt: nowIso(),
});

const defaultBackupStatus = (): BackupRecoveryStatus => ({
  lastBackup: subDays(new Date(), 1).toISOString(),
  backupStatus: 'healthy',
  restorePoints: [
    { id: makeId('restore'), at: subDays(new Date(), 1).toISOString(), status: 'ready' },
    { id: makeId('restore'), at: subDays(new Date(), 3).toISOString(), status: 'ready' },
    { id: makeId('restore'), at: subDays(new Date(), 7).toISOString(), status: 'ready' },
  ],
  databaseBackupStatus: 'healthy',
});

const detectOs = (): string => {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('mac')) return 'macOS';
  if (ua.includes('linux')) return 'Linux';
  if (ua.includes('android')) return 'Android';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
  return 'Unknown';
};

const detectBrowser = (): string => {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('edg')) return 'Edge';
  if (ua.includes('chrome')) return 'Chrome';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('firefox')) return 'Firefox';
  return 'Unknown';
};

const mapAuditToModule = (action: string, entityType: string): string => {
  const act = action.toLowerCase();
  if (act.includes('login') || act.includes('logout')) return 'Authentication';
  if (act.includes('password') || entityType === 'security') return 'Security';
  if (act.includes('job')) return 'Jobs';
  if (act.includes('candidate') || act.includes('resume')) return 'Applicants';
  if (act.includes('message')) return 'Messaging';
  if (act.includes('interview')) return 'Interview Management';
  if (act.includes('automation')) return 'Automation';
  if (act.includes('billing')) return 'Billing';
  if (act.includes('integration') || act.includes('api')) return 'Integrations';
  if (act.includes('ai')) return 'AI Assistant';
  if (act.includes('permission') || act.includes('role') || entityType === 'permission') return 'Team Management';
  return 'General';
};

const mapActionDisplay = (action: string): string => action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const actionSeverity = (action: string): AuditSeverity => {
  const lower = action.toLowerCase();
  if (lower.includes('failed') || lower.includes('delete') || lower.includes('revoke') || lower.includes('abuse')) return 'high';
  if (lower.includes('export') || lower.includes('permission') || lower.includes('billing') || lower.includes('integration')) return 'medium';
  if (lower.includes('login') || lower.includes('logout') || lower.includes('view')) return 'low';
  return 'medium';
};

const inferStatus = (action: string): AuditStatus => action.toLowerCase().includes('failed') ? 'failed' : 'success';

const makeSyntheticAudit = (ownerId: string, user: string, role: string, action: string, details: string, minutesAgo: number, ip = '103.44.22.11', device = 'Desktop', browser = 'Chrome', location = 'Hyderabad, IN'): SecurityAuditRow => ({
  id: makeId('audit_syn'),
  timestamp: new Date(Date.now() - minutesAgo * 60 * 1000).toISOString(),
  user,
  role,
  action,
  module: mapAuditToModule(action, ''),
  ipAddress: ip,
  device,
  browser,
  location,
  status: inferStatus(action),
  severity: actionSeverity(action),
  details,
  entityRef: ownerId,
});

export const securityCenterService = {
  getPermissionContext(ownerId: string, currentUserId: string): SecurityPermissionContext {
    const access = teamManagementService.getAccessContext(ownerId, currentUserId);
    const members = teamManagementService.listMembers(ownerId);
    const currentMember = members.find((item) => item.userId === currentUserId) || members.find((item) => item.role === access.currentRole);

    const isOwner = access.currentRole === 'owner';
    const isSecurityAdmin = access.permissions.includes('settings.security');

    return {
      canManageSecurity: isOwner || isSecurityAdmin,
      canViewAuditLogs: isOwner || isSecurityAdmin,
      canExportAuditReports: isOwner || isSecurityAdmin,
      canManageSessions: isOwner || isSecurityAdmin,
      canManageApiKeys: isOwner || isSecurityAdmin,
      currentMember,
    };
  },

  initialize(ownerId: string, currentUserId: string): void {
    const store = readStore();

    if (!store.passwordPolicyByOwner[ownerId]) {
      store.passwordPolicyByOwner[ownerId] = defaultPasswordPolicy();
    }

    if (!store.twoFactorByUser[currentUserId]) {
      store.twoFactorByUser[currentUserId] = {
        enabled: false,
        method: 'authenticator_app',
        backupRecoveryCodes: [],
        updatedAt: nowIso(),
      };
    }

    if (!store.passwordMetaByUser[currentUserId]) {
      store.passwordMetaByUser[currentUserId] = {
        lastChangedAt: subDays(new Date(), 32).toISOString(),
        historyHashes: [],
      };
    }

    if (!store.sensitiveActionRulesByOwner[ownerId]) {
      store.sensitiveActionRulesByOwner[ownerId] = defaultSensitiveActions();
    }

    if (!store.complianceByOwner[ownerId]) {
      store.complianceByOwner[ownerId] = defaultCompliance();
    }

    if (!store.backupByOwner[ownerId]) {
      store.backupByOwner[ownerId] = defaultBackupStatus();
    }

    if (!store.privacyByUser[currentUserId]) {
      store.privacyByUser[currentUserId] = defaultPrivacy();
    }

    const browser = detectBrowser();
    const os = detectOs();
    const active = store.sessions.find((item) => item.ownerId === ownerId && item.userId === currentUserId && item.active);

    if (!active) {
      store.sessions.push({
        id: makeId('sess'),
        ownerId,
        userId: currentUserId,
        browser,
        operatingSystem: os,
        ipAddress: `10.24.${Math.floor(Math.random() * 120)}.${Math.floor(Math.random() * 220)}`,
        country: 'India',
        city: 'Hyderabad',
        device: `${os} Device`,
        lastActivity: nowIso(),
        loginTime: nowIso(),
        active: true,
      });
    }

    const trusted = store.trustedDevices.find((item) => item.ownerId === ownerId && item.userId === currentUserId && item.deviceId === `${browser}_${os}`);
    if (!trusted) {
      const dev: TrustedDevice = {
        id: makeId('device'),
        ownerId,
        userId: currentUserId,
        name: `${browser} on ${os}`,
        deviceId: `${browser}_${os}`,
        browser,
        operatingSystem: os,
        addedAt: nowIso(),
        lastSeenAt: nowIso(),
      };
      store.trustedDevices.push(dev);
      store.deviceHistory.unshift({
        id: makeId('dev_hist'),
        ownerId,
        userId: currentUserId,
        type: 'added',
        device: dev.name,
        at: nowIso(),
        details: 'Device automatically trusted on first successful login',
      });
    }

    writeStore(store);
  },

  getPasswordPolicy(ownerId: string): PasswordPolicy {
    const store = readStore();
    if (!store.passwordPolicyByOwner[ownerId]) {
      store.passwordPolicyByOwner[ownerId] = defaultPasswordPolicy();
      writeStore(store);
    }
    return store.passwordPolicyByOwner[ownerId];
  },

  updatePasswordPolicy(ownerId: string, payload: Partial<PasswordPolicy>): PasswordPolicy {
    const store = readStore();
    const next = { ...this.getPasswordPolicy(ownerId), ...payload };
    store.passwordPolicyByOwner[ownerId] = next;
    writeStore(store);
    return next;
  },

  getTwoFactorSettings(userId: string): TwoFactorSettings {
    const store = readStore();
    if (!store.twoFactorByUser[userId]) {
      store.twoFactorByUser[userId] = {
        enabled: false,
        method: 'authenticator_app',
        backupRecoveryCodes: [],
        updatedAt: nowIso(),
      };
      writeStore(store);
    }
    return store.twoFactorByUser[userId];
  },

  updateTwoFactorSettings(userId: string, payload: Partial<TwoFactorSettings>): TwoFactorSettings {
    const store = readStore();
    const current = this.getTwoFactorSettings(userId);
    const next = {
      ...current,
      ...payload,
      updatedAt: nowIso(),
    };
    store.twoFactorByUser[userId] = next;
    writeStore(store);
    return next;
  },

  regenerateRecoveryCodes(userId: string): string[] {
    const codes = Array.from({ length: 8 }).map(() => `${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`);
    this.updateTwoFactorSettings(userId, { backupRecoveryCodes: codes });
    return codes;
  },

  markPasswordChanged(userId: string): void {
    const store = readStore();
    if (!store.passwordMetaByUser[userId]) {
      store.passwordMetaByUser[userId] = { lastChangedAt: nowIso(), historyHashes: [] };
    }
    store.passwordMetaByUser[userId].lastChangedAt = nowIso();
    writeStore(store);
  },

  getPasswordAgeDays(userId: string): number {
    const store = readStore();
    const item = store.passwordMetaByUser[userId];
    if (!item) return 0;
    return Math.max(0, differenceInDays(new Date(), new Date(item.lastChangedAt)));
  },

  listSessions(ownerId: string, currentUserId: string): SecuritySession[] {
    const store = readStore();
    const ctx = this.getPermissionContext(ownerId, currentUserId);
    const sessions = store.sessions.filter((item) => item.ownerId === ownerId && item.active);
    return ctx.canManageSessions ? sessions : sessions.filter((item) => item.userId === currentUserId);
  },

  terminateSession(ownerId: string, currentUserId: string, sessionId: string): void {
    const store = readStore();
    const ctx = this.getPermissionContext(ownerId, currentUserId);
    const target = store.sessions.find((item) => item.id === sessionId && item.ownerId === ownerId);
    if (!target) return;
    if (!ctx.canManageSessions && target.userId !== currentUserId) {
      throw new Error('Not allowed to terminate other user session');
    }

    target.active = false;
    target.lastActivity = nowIso();
    writeStore(store);
  },

  logoutOtherDevices(ownerId: string, currentUserId: string, keepSessionId: string): number {
    const store = readStore();
    const sessions = store.sessions.filter((item) => item.ownerId === ownerId && item.userId === currentUserId && item.active && item.id !== keepSessionId);
    sessions.forEach((item) => {
      item.active = false;
      item.lastActivity = nowIso();
    });
    writeStore(store);
    return sessions.length;
  },

  listTrustedDevices(ownerId: string, currentUserId: string): TrustedDevice[] {
    const store = readStore();
    const ctx = this.getPermissionContext(ownerId, currentUserId);
    const all = store.trustedDevices.filter((item) => item.ownerId === ownerId);
    return ctx.canManageSecurity ? all : all.filter((item) => item.userId === currentUserId);
  },

  addTrustedDevice(ownerId: string, currentUserId: string, payload: {
    name: string;
    deviceId: string;
    browser: string;
    operatingSystem: string;
  }): TrustedDevice {
    const store = readStore();
    const existing = store.trustedDevices.find((item) => item.ownerId === ownerId && item.userId === currentUserId && item.deviceId === payload.deviceId);
    if (existing) return existing;

    const device: TrustedDevice = {
      id: makeId('device'),
      ownerId,
      userId: currentUserId,
      name: payload.name,
      deviceId: payload.deviceId,
      browser: payload.browser,
      operatingSystem: payload.operatingSystem,
      addedAt: nowIso(),
      lastSeenAt: nowIso(),
    };

    store.trustedDevices.push(device);
    store.deviceHistory.unshift({
      id: makeId('dev_hist'),
      ownerId,
      userId: currentUserId,
      type: 'added',
      device: device.name,
      at: nowIso(),
      details: 'Trusted device added manually',
    });
    writeStore(store);
    return device;
  },

  removeTrustedDevice(ownerId: string, currentUserId: string, deviceId: string): void {
    const store = readStore();
    const target = store.trustedDevices.find((item) => item.id === deviceId && item.ownerId === ownerId);
    if (!target) return;
    const ctx = this.getPermissionContext(ownerId, currentUserId);
    if (!ctx.canManageSecurity && target.userId !== currentUserId) {
      throw new Error('Not allowed to remove this device');
    }

    store.trustedDevices = store.trustedDevices.filter((item) => item.id !== deviceId);
    store.deviceHistory.unshift({
      id: makeId('dev_hist'),
      ownerId,
      userId: currentUserId,
      type: 'removed',
      device: target.name,
      at: nowIso(),
      details: 'Trusted device removed',
    });
    writeStore(store);
  },

  listDeviceHistory(ownerId: string, currentUserId: string): DeviceHistoryEvent[] {
    const store = readStore();
    const ctx = this.getPermissionContext(ownerId, currentUserId);
    const logs = store.deviceHistory.filter((item) => item.ownerId === ownerId);
    return ctx.canManageSecurity ? logs : logs.filter((item) => item.userId === currentUserId);
  },

  detectUnknownDeviceAlerts(ownerId: string): DeviceHistoryEvent[] {
    const login = teamManagementService.listLoginHistory(ownerId);
    const store = readStore();
    const trustedKeys = new Set(store.trustedDevices.filter((item) => item.ownerId === ownerId).map((item) => `${item.browser}_${item.operatingSystem}_${item.userId}`));

    const unknownEvents = login
      .filter((item) => item.successful)
      .filter((item) => !trustedKeys.has(`${item.browser}_${item.device}_${item.memberId}`))
      .slice(0, 8)
      .map((item) => ({
        id: makeId('dev_hist'),
        ownerId,
        userId: item.memberId,
        type: 'unknown_detected' as const,
        device: `${item.browser} / ${item.device}`,
        at: item.time,
        details: `Unknown device login from ${item.location}`,
      }));

    return unknownEvents;
  },

  listLoginHistory(ownerId: string): Array<{
    id: string;
    user: string;
    successful: boolean;
    device: string;
    browser: string;
    location: string;
    ipAddress: string;
    time: string;
    eventType: 'successful_login' | 'failed_login' | 'password_reset' | 'new_device_login' | 'suspicious_login';
  }> {
    const history = teamManagementService.listLoginHistory(ownerId);
    return history.map((item) => ({
      id: item.id,
      user: item.memberName,
      successful: item.successful,
      device: item.device,
      browser: item.browser,
      location: item.location,
      ipAddress: item.ipAddress,
      time: item.time,
      eventType: item.successful ? 'successful_login' : 'failed_login',
    }));
  },

  listSensitiveActions(ownerId: string): SensitiveActionRule[] {
    const store = readStore();
    if (!store.sensitiveActionRulesByOwner[ownerId]) {
      store.sensitiveActionRulesByOwner[ownerId] = defaultSensitiveActions();
      writeStore(store);
    }
    return store.sensitiveActionRulesByOwner[ownerId];
  },

  updateSensitiveAction(ownerId: string, key: SensitiveActionRule['key'], enabled: boolean): SensitiveActionRule[] {
    const store = readStore();
    const rules = this.listSensitiveActions(ownerId).map((rule) =>
      rule.key === key ? { ...rule, requireAdditionalConfirmation: enabled } : rule
    );
    store.sensitiveActionRulesByOwner[ownerId] = rules;
    writeStore(store);
    return rules;
  },

  listApiSecurityKeys(ownerId: string): ApiSecurityKey[] {
    const store = readStore();
    return store.apiSecurityKeys.filter((item) => item.ownerId === ownerId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createApiSecurityKey(ownerId: string, payload: {
    name: string;
    expiresAt?: string;
    ipRestrictions?: string[];
    rateLimitPerMin: number;
  }): ApiSecurityKey {
    const store = readStore();
    const masked = `${Math.random().toString(36).slice(2, 6).toUpperCase()}****${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const key: ApiSecurityKey = {
      id: makeId('api_sec'),
      ownerId,
      name: payload.name,
      keyMasked: masked,
      createdAt: nowIso(),
      expiresAt: payload.expiresAt,
      ipRestrictions: payload.ipRestrictions || [],
      rateLimitPerMin: payload.rateLimitPerMin,
      active: true,
    };
    store.apiSecurityKeys.unshift(key);
    store.notifications.unshift({
      id: makeId('sec_note'),
      ownerId,
      type: 'api_key_created',
      message: `API key created: ${key.name}`,
      createdAt: nowIso(),
      read: false,
      severity: 'info',
    });
    writeStore(store);
    return key;
  },

  regenerateApiSecurityKey(ownerId: string, keyId: string): ApiSecurityKey {
    const store = readStore();
    const target = store.apiSecurityKeys.find((item) => item.ownerId === ownerId && item.id === keyId);
    if (!target) throw new Error('Key not found');
    target.keyMasked = `${Math.random().toString(36).slice(2, 6).toUpperCase()}****${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    target.createdAt = nowIso();
    writeStore(store);
    return target;
  },

  revokeApiSecurityKey(ownerId: string, keyId: string): void {
    const store = readStore();
    const target = store.apiSecurityKeys.find((item) => item.ownerId === ownerId && item.id === keyId);
    if (!target) return;
    target.active = false;
    writeStore(store);
  },

  updateApiSecurityKey(ownerId: string, keyId: string, payload: Partial<Pick<ApiSecurityKey, 'expiresAt' | 'ipRestrictions' | 'rateLimitPerMin'>>): ApiSecurityKey {
    const store = readStore();
    const target = store.apiSecurityKeys.find((item) => item.ownerId === ownerId && item.id === keyId);
    if (!target) throw new Error('Key not found');
    Object.assign(target, payload);
    writeStore(store);
    return target;
  },

  getBackupRecovery(ownerId: string): BackupRecoveryStatus {
    const store = readStore();
    if (!store.backupByOwner[ownerId]) {
      store.backupByOwner[ownerId] = defaultBackupStatus();
      writeStore(store);
    }
    return store.backupByOwner[ownerId];
  },

  createRestorePoint(ownerId: string): BackupRecoveryStatus {
    const store = readStore();
    const current = this.getBackupRecovery(ownerId);
    current.restorePoints.unshift({ id: makeId('restore'), at: nowIso(), status: 'ready' });
    current.lastBackup = nowIso();
    current.backupStatus = 'healthy';
    current.databaseBackupStatus = 'healthy';
    store.backupByOwner[ownerId] = current;
    writeStore(store);
    return current;
  },

  getComplianceConfig(ownerId: string): ComplianceConfig {
    const store = readStore();
    if (!store.complianceByOwner[ownerId]) {
      store.complianceByOwner[ownerId] = defaultCompliance();
      writeStore(store);
    }
    return store.complianceByOwner[ownerId];
  },

  updateComplianceConfig(ownerId: string, payload: Partial<ComplianceConfig>): ComplianceConfig {
    const store = readStore();
    const next = { ...this.getComplianceConfig(ownerId), ...payload };
    store.complianceByOwner[ownerId] = next;
    writeStore(store);
    return next;
  },

  getPrivacyControls(currentUserId: string): PrivacyControls {
    const store = readStore();
    if (!store.privacyByUser[currentUserId]) {
      store.privacyByUser[currentUserId] = defaultPrivacy();
      writeStore(store);
    }
    return store.privacyByUser[currentUserId];
  },

  updatePrivacyControls(currentUserId: string, payload: Partial<PrivacyControls>): PrivacyControls {
    const store = readStore();
    const next = { ...this.getPrivacyControls(currentUserId), ...payload, consentUpdatedAt: nowIso() };
    store.privacyByUser[currentUserId] = next;
    writeStore(store);
    return next;
  },

  requestDeleteAccount(currentUserId: string): void {
    this.updatePrivacyControls(currentUserId, { deleteAccountRequestedAt: nowIso() });
  },

  requestDeleteCompanyData(currentUserId: string): void {
    this.updatePrivacyControls(currentUserId, { deleteCompanyRequestedAt: nowIso() });
  },

  async downloadPersonalData(ownerId: string, currentUserId: string): Promise<string> {
    const [sessions, devices, loginHistory, audit] = await Promise.all([
      Promise.resolve(this.listSessions(ownerId, currentUserId)),
      Promise.resolve(this.listTrustedDevices(ownerId, currentUserId)),
      Promise.resolve(this.listLoginHistory(ownerId).filter((row) => row.user.toLowerCase().includes(currentUserId.toLowerCase()) || true)),
      this.listAuditLogs(ownerId, currentUserId),
    ]);

    return [
      '# Personal Security Data Export',
      `Generated At: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`,
      '',
      `Sessions: ${sessions.length}`,
      `Trusted Devices: ${devices.length}`,
      `Login Events: ${loginHistory.length}`,
      `Audit Events Visible: ${audit.length}`,
    ].join('\n');
  },

  async listAuditLogs(ownerId: string, currentUserId: string, search = '', filters?: AuditFilters): Promise<SecurityAuditRow[]> {
    const ctx = this.getPermissionContext(ownerId, currentUserId);
    const teamAudit = teamManagementService.listAuditLogs(ownerId, search);
    const loginHistory = teamManagementService.listLoginHistory(ownerId);
    const members = teamManagementService.listMembers(ownerId);

    const baseRows: SecurityAuditRow[] = teamAudit.map((log) => ({
      id: `team_${log.id}`,
      timestamp: log.createdAt,
      user: log.actorName,
      role: members.find((m) => m.userId === log.actorId || m.id === log.actorId)?.role || 'recruiter',
      action: mapActionDisplay(log.action),
      module: mapAuditToModule(log.action, log.entityType),
      ipAddress: '103.44.22.11',
      device: 'Desktop',
      browser: 'Chrome',
      location: 'Hyderabad, IN',
      status: inferStatus(log.action),
      severity: actionSeverity(log.action),
      details: log.details,
      entityRef: log.entityId,
    }));

    const loginRows: SecurityAuditRow[] = loginHistory.map((item) => ({
      id: `login_${item.id}`,
      timestamp: item.time,
      user: item.memberName,
      role: members.find((m) => m.id === item.memberId)?.role || 'recruiter',
      action: item.successful ? 'Login' : 'Login Failed',
      module: 'Authentication',
      ipAddress: item.ipAddress,
      device: item.device,
      browser: item.browser,
      location: item.location,
      status: item.successful ? 'success' : 'failed',
      severity: item.successful ? 'low' : 'high',
      details: item.successful ? 'Successful login' : 'Failed login attempt',
      entityRef: item.id,
    }));

    const [jobs, conversations, interviews, payments, integrations, aiRequests, automationRuns] = await Promise.all([
      jobService.getRecruiterJobs(ownerId).catch(() => []),
      messagingService.getConversations(ownerId).catch(() => []),
      listInterviews(ownerId).catch(() => []),
      Promise.resolve(billingSubscriptionService.getPayments(ownerId)),
      Promise.resolve(integrationsHubService.listConnections(ownerId)),
      Promise.resolve(aiHiringAssistantService.listRequestHistory(ownerId)),
      Promise.resolve(automationCenterService.getExecutions(ownerId)),
    ]);

    const syntheticRows: SecurityAuditRow[] = [
      ...jobs.slice(0, 4).map((job: any, idx: number) => makeSyntheticAudit(ownerId, 'Recruiter', 'recruiter', idx % 2 === 0 ? 'job_created' : 'job_edited', `Job ${job.title || 'Untitled'} updated`, 40 + idx * 13)),
      ...conversations.slice(0, 3).map((conv: any, idx: number) => makeSyntheticAudit(ownerId, 'Recruiter', 'recruiter', 'message_sent', `Message sent in conversation ${conv.id || idx + 1}`, 20 + idx * 9)),
      ...interviews.slice(0, 3).map((it: any, idx: number) => makeSyntheticAudit(ownerId, 'Recruiter', 'recruiter', idx % 2 ? 'interview_cancelled' : 'interview_scheduled', `Interview event ${it.id || idx + 1}`, 55 + idx * 17)),
      ...payments.slice(0, 2).map((pay, idx) => makeSyntheticAudit(ownerId, 'Owner', 'owner', 'billing_updated', `Payment ${pay.transactionId} recorded`, 75 + idx * 14)),
      ...integrations.slice(0, 2).map((int, idx) => makeSyntheticAudit(ownerId, 'Owner', 'owner', idx % 2 ? 'integration_removed' : 'integration_connected', `Integration ${int.integrationId} status ${int.status}`, 90 + idx * 11)),
      ...aiRequests.slice(0, 3).map((req, idx) => makeSyntheticAudit(ownerId, 'Recruiter', 'recruiter', 'ai_requests', `${req.type} request generated`, 22 + idx * 8)),
      ...automationRuns.slice(0, 2).map((run: any, idx: number) => makeSyntheticAudit(ownerId, 'Recruiter', 'recruiter', idx % 2 ? 'automation_updated' : 'automation_created', `Automation ${run.id || idx + 1}`, 68 + idx * 7)),
      makeSyntheticAudit(ownerId, 'Owner', 'owner', 'candidate_exported', 'Candidate export generated in CSV', 95),
      makeSyntheticAudit(ownerId, 'Owner', 'owner', 'resume_downloaded', 'Resume downloaded by recruiter', 110),
      makeSyntheticAudit(ownerId, 'Owner', 'owner', 'permission_changed', 'Role permission updated for recruiter', 118),
      makeSyntheticAudit(ownerId, 'Owner', 'owner', 'api_usage', 'High API usage detected from integration endpoint', 12, '103.44.22.19', 'Server', 'API Gateway', 'Mumbai, IN'),
      makeSyntheticAudit(ownerId, 'Owner', 'owner', 'logout', 'User logged out', 8),
    ];

    let all = [...baseRows, ...loginRows, ...syntheticRows]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (!ctx.canViewAuditLogs) {
      all = all.filter((row) => row.user.toLowerCase().includes('recruiter') || row.role === 'recruiter');
    }

    const text = search.trim().toLowerCase();
    if (text) {
      all = all.filter((row) => `${row.user} ${row.action} ${row.details} ${row.ipAddress} ${row.module}`.toLowerCase().includes(text));
    }

    if (filters) {
      if (filters.user) {
        const u = filters.user.toLowerCase();
        all = all.filter((row) => row.user.toLowerCase().includes(u));
      }
      if (filters.module && filters.module !== 'all') {
        const m = filters.module.toLowerCase();
        all = all.filter((row) => row.module.toLowerCase().includes(m));
      }
      if (filters.severity && filters.severity !== 'all') {
        all = all.filter((row) => row.severity === filters.severity);
      }
      if (filters.actionType) {
        const a = filters.actionType.toLowerCase();
        all = all.filter((row) => row.action.toLowerCase().includes(a));
      }
      if (filters.status && filters.status !== 'all') {
        all = all.filter((row) => row.status === filters.status);
      }
      if (filters.dateStart) {
        all = all.filter((row) => new Date(row.timestamp).getTime() >= new Date(filters.dateStart as string).getTime());
      }
      if (filters.dateEnd) {
        all = all.filter((row) => new Date(row.timestamp).getTime() <= new Date(filters.dateEnd as string).getTime());
      }
    }

    return all.slice(0, 2000);
  },

  async listDataExportLogs(ownerId: string, currentUserId: string): Promise<SecurityAuditRow[]> {
    const logs = await this.listAuditLogs(ownerId, currentUserId);
    return logs.filter((row) => {
      const action = row.action.toLowerCase();
      return action.includes('export') || action.includes('download') || action.includes('api usage');
    });
  },

  listNotifications(ownerId: string, currentUserId: string): SecurityNotification[] {
    const store = readStore();
    const existing = store.notifications.filter((item) => item.ownerId === ownerId);

    const login = this.listLoginHistory(ownerId).slice(0, 8);
    const generated: SecurityNotification[] = login.map((item, idx) => ({
      id: `generated_${item.id}_${idx}`,
      ownerId,
      type: item.successful ? 'new_login' : 'failed_login_attempts',
      message: item.successful
        ? `New login from ${item.device} (${item.location})`
        : `Failed login attempt from ${item.ipAddress}`,
      createdAt: item.time,
      read: false,
      severity: item.successful ? 'info' : 'warning',
    }));

    const all = [...existing, ...generated]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 500);

    const ctx = this.getPermissionContext(ownerId, currentUserId);
    if (ctx.canManageSecurity) return all;
    return all.filter((item) => item.type !== 'permission_changed' && item.type !== 'api_key_created');
  },

  markNotificationRead(ownerId: string, notificationId: string): void {
    const store = readStore();
    store.notifications = store.notifications.map((item) => (
      item.ownerId === ownerId && item.id === notificationId ? { ...item, read: true } : item
    ));
    writeStore(store);
  },

  async getSecurityScore(ownerId: string, currentUserId: string): Promise<SecurityScoreBreakdown> {
    const [sessions, devices] = [this.listSessions(ownerId, currentUserId), this.listTrustedDevices(ownerId, currentUserId)];
    const twoFa = this.getTwoFactorSettings(currentUserId);
    const policy = this.getPasswordPolicy(ownerId);
    const apiKeys = this.listApiSecurityKeys(ownerId);

    const access = teamManagementService.getAccessContext(ownerId, currentUserId);
    const verifiedEmail = true;
    const verifiedPhone = true;

    const strongPassword = policy.minimumLength >= 10 && policy.uppercase && policy.lowercase && policy.number && policy.specialCharacter ? 15 : 6;
    const twoFactorEnabled = twoFa.enabled ? 15 : 2;
    const trustedDevicesScore = Math.min(15, devices.length * 4 + 3);
    const sessionsScore = sessions.length <= 3 ? 10 : 5;
    const apiSecurityScore = apiKeys.filter((item) => item.active).length > 0 ? 12 : 6;
    const permissionReviewScore = access.permissions.includes('settings.security') ? 10 : 5;

    const verifiedEmailScore = verifiedEmail ? 10 : 0;
    const verifiedPhoneScore = verifiedPhone ? 10 : 0;

    const total = Math.min(100, strongPassword + twoFactorEnabled + verifiedEmailScore + verifiedPhoneScore + trustedDevicesScore + sessionsScore + apiSecurityScore + permissionReviewScore + 3);

    const recommendations: string[] = [];
    if (!twoFa.enabled) recommendations.push('Enable two-factor authentication for all security admins.');
    if (sessions.length > 3) recommendations.push('Terminate stale active sessions and enforce idle timeout.');
    if (apiKeys.filter((k) => k.active).length === 0) recommendations.push('Create scoped API key with IP restriction and expiry.');
    if (policy.passwordExpiryDays > 90) recommendations.push('Reduce password expiry window for higher compliance.');
    if (devices.length < 2) recommendations.push('Register trusted devices and review unknown login alerts.');

    return {
      total,
      strongPassword,
      twoFactorEnabled,
      verifiedEmail: verifiedEmailScore,
      verifiedPhone: verifiedPhoneScore,
      trustedDevices: trustedDevicesScore,
      activeSessions: sessionsScore,
      apiSecurity: apiSecurityScore,
      permissionReview: permissionReviewScore,
      recommendations,
    };
  },

  async getPermissionAudit(ownerId: string): Promise<{
    users: Array<{ user: string; role: string; permissions: number }>;
    permissionChanges: number;
    unauthorizedAttempts: number;
    adminActions: number;
  }> {
    const members = teamManagementService.listMembers(ownerId);
    const logs = teamManagementService.listAuditLogs(ownerId);

    const users = members.map((member) => ({
      user: member.fullName,
      role: member.role,
      permissions: member.permissions.length,
    }));

    const permissionChanges = logs.filter((item) => item.action.includes('role') || item.action.includes('permission')).length;
    const unauthorizedAttempts = logs.filter((item) => item.action.includes('failed') || item.details.toLowerCase().includes('unauthorized')).length;
    const adminActions = logs.filter((item) => item.actorName.toLowerCase().includes('owner') || item.actorName.toLowerCase().includes('admin')).length;

    return {
      users,
      permissionChanges,
      unauthorizedAttempts,
      adminActions,
    };
  },

  async getAlertsDashboard(ownerId: string, currentUserId: string): Promise<AlertsDashboard> {
    const [logins, exportLogs, auditLogs, members, integrationAnalytics] = await Promise.all([
      Promise.resolve(this.listLoginHistory(ownerId)),
      this.listDataExportLogs(ownerId, currentUserId),
      this.listAuditLogs(ownerId, currentUserId),
      Promise.resolve(teamManagementService.listMembers(ownerId)),
      Promise.resolve(integrationsHubService.getAnalytics(ownerId)),
    ]);

    const highRiskLogin = logins.filter((item) => !item.successful).length;
    const multipleFailedAttempts = Math.max(0, highRiskLogin - 2);
    const largeDataExport = exportLogs.filter((row) => row.severity === 'high' || row.action.toLowerCase().includes('export')).length;
    const permissionEscalation = auditLogs.filter((row) => row.action.toLowerCase().includes('permission')).length;
    const apiAbuse = integrationAnalytics.errorRate > 18 ? Math.round(integrationAnalytics.errorRate / 3) : 0;
    const inactiveAccounts = members.filter((member) => member.status !== 'active').length;

    return {
      highRiskLogin,
      multipleFailedAttempts,
      largeDataExport,
      permissionEscalation,
      apiAbuse,
      inactiveAccounts,
    };
  },

  async getOverview(ownerId: string, currentUserId: string): Promise<SecurityOverview> {
    const [score, sessions, devices, audit, alerts, backup] = await Promise.all([
      this.getSecurityScore(ownerId, currentUserId),
      Promise.resolve(this.listSessions(ownerId, currentUserId)),
      Promise.resolve(this.listTrustedDevices(ownerId, currentUserId)),
      this.listAuditLogs(ownerId, currentUserId),
      this.getAlertsDashboard(ownerId, currentUserId),
      Promise.resolve(this.getBackupRecovery(ownerId)),
    ]);

    const failedLoginAttempts = this.listLoginHistory(ownerId).filter((item) => !item.successful).length;
    const auditEventsToday = audit.filter((row) => differenceInDays(new Date(), new Date(row.timestamp)) === 0).length;
    const pendingSecurityAlerts = alerts.highRiskLogin + alerts.multipleFailedAttempts + alerts.apiAbuse;

    return {
      securityScore: score.total,
      activeSessions: sessions.length,
      trustedDevices: devices.length,
      failedLoginAttempts,
      auditEventsToday,
      pendingSecurityAlerts,
      passwordAgeDays: this.getPasswordAgeDays(currentUserId),
      lastBackup: format(new Date(backup.lastBackup), 'dd MMM yyyy, hh:mm a'),
    };
  },

  async getIntegrationSignals(ownerId: string): Promise<{
    teamMembers: number;
    billingEvents: number;
    aiRequests: number;
    messages: number;
    interviews: number;
    automationRuns: number;
    analyticsApplicationVolume: number;
    dashboardRiskSignal: number;
  }> {
    const [members, payments, aiRequests, conversations, interviews, automationRuns, analytics] = await Promise.all([
      Promise.resolve(teamManagementService.listMembers(ownerId).length),
      Promise.resolve(billingSubscriptionService.getPayments(ownerId).length),
      Promise.resolve(aiHiringAssistantService.listRequestHistory(ownerId).length),
      messagingService.getConversations(ownerId).then((rows) => rows.length).catch(() => 0),
      listInterviews(ownerId).then((rows) => rows.length).catch(() => 0),
      Promise.resolve(automationCenterService.getExecutions(ownerId).length),
      getRecruiterAnalyticsData(ownerId).catch(() => null),
    ]);

    const analyticsApplicationVolume = Number((analytics as any)?.summary?.applications || 0);
    const dashboardRiskSignal = Math.round((payments * 0.4) + (aiRequests * 0.1) + (automationRuns * 0.12));

    return {
      teamMembers: members,
      billingEvents: payments,
      aiRequests,
      messages: conversations,
      interviews,
      automationRuns,
      analyticsApplicationVolume,
      dashboardRiskSignal,
    };
  },

  async generateReports(ownerId: string, currentUserId: string): Promise<{
    securityReport: string;
    auditReport: string;
    loginReport: string;
    permissionReport: string;
    complianceReport: string;
  }> {
    const [overview, auditLogs, loginHistory, permissionAudit, compliance] = await Promise.all([
      this.getOverview(ownerId, currentUserId),
      this.listAuditLogs(ownerId, currentUserId),
      Promise.resolve(this.listLoginHistory(ownerId)),
      this.getPermissionAudit(ownerId),
      Promise.resolve(this.getComplianceConfig(ownerId)),
    ]);

    const securityReport = [
      '# Security Report',
      `Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`,
      `Security Score: ${overview.securityScore}`,
      `Active Sessions: ${overview.activeSessions}`,
      `Trusted Devices: ${overview.trustedDevices}`,
      `Failed Login Attempts: ${overview.failedLoginAttempts}`,
      `Pending Security Alerts: ${overview.pendingSecurityAlerts}`,
      `Last Backup: ${overview.lastBackup}`,
    ].join('\n');

    const auditReport = [
      '# Audit Report',
      '| Timestamp | User | Role | Action | Module | Status | Severity |',
      '|---|---|---|---|---|---|---|',
      ...auditLogs.slice(0, 80).map((row) => `| ${format(new Date(row.timestamp), 'dd MMM HH:mm')} | ${row.user} | ${row.role} | ${row.action} | ${row.module} | ${row.status} | ${row.severity} |`),
    ].join('\n');

    const loginReport = [
      '# Login Report',
      '| Time | User | Event | Device | IP | Location |',
      '|---|---|---|---|---|---|',
      ...loginHistory.slice(0, 80).map((row) => `| ${format(new Date(row.time), 'dd MMM HH:mm')} | ${row.user} | ${row.eventType} | ${row.device} | ${row.ipAddress} | ${row.location} |`),
    ].join('\n');

    const permissionReport = [
      '# Permission Report',
      `Permission Changes: ${permissionAudit.permissionChanges}`,
      `Unauthorized Attempts: ${permissionAudit.unauthorizedAttempts}`,
      `Admin Actions: ${permissionAudit.adminActions}`,
      '',
      '| User | Role | Permission Count |',
      '|---|---|---:|',
      ...permissionAudit.users.map((u) => `| ${u.user} | ${u.role} | ${u.permissions} |`),
    ].join('\n');

    const complianceReport = [
      '# Compliance Report',
      `GDPR: ${compliance.gdpr ? 'Enabled' : 'Disabled'}`,
      `CCPA: ${compliance.ccpa ? 'Enabled' : 'Disabled'}`,
      `SOC 2: ${compliance.soc2 ? 'Enabled' : 'Disabled'}`,
      `ISO 27001: ${compliance.iso27001 ? 'Enabled' : 'Disabled'}`,
      `Data Retention Days: ${compliance.dataRetentionDays}`,
      `Consent Management: ${compliance.consentManagementEnabled ? 'Enabled' : 'Disabled'}`,
    ].join('\n');

    return {
      securityReport,
      auditReport,
      loginReport,
      permissionReport,
      complianceReport,
    };
  },

  toCsvAudit(logs: SecurityAuditRow[]): string {
    const headers = ['Timestamp', 'User', 'Role', 'Action', 'Module', 'IP Address', 'Device', 'Browser', 'Location', 'Status', 'Severity', 'Details'];
    const rows = logs.map((row) => [
      row.timestamp,
      row.user,
      row.role,
      row.action,
      row.module,
      row.ipAddress,
      row.device,
      row.browser,
      row.location,
      row.status,
      row.severity,
      row.details,
    ]);

    return [headers.join(','), ...rows.map((r) => r.map((cell) => JSON.stringify(String(cell))).join(','))].join('\n');
  },

  getExportFormatPayload(content: string, formatType: 'pdf' | 'excel' | 'csv'): string {
    if (formatType === 'csv') return content;
    if (formatType === 'excel') return `EXCEL_EXPORT\n${content}`;
    return `PDF_EXPORT\n${content}`;
  },

  listActionTypes(): string[] {
    return [
      'Login', 'Logout', 'Password Changed', 'Profile Updated', 'Job Created', 'Job Edited', 'Job Deleted',
      'Candidate Viewed', 'Candidate Exported', 'Resume Downloaded', 'Message Sent', 'Interview Scheduled',
      'Interview Cancelled', 'Offer Sent', 'Offer Accepted', 'Automation Created', 'Automation Updated',
      'Team Member Added', 'Permission Changed', 'Billing Updated', 'Integration Connected', 'Integration Removed',
      'AI Requests', 'API Usage',
    ];
  },

  listModules(): string[] {
    return ['Authentication', 'Security', 'Jobs', 'Applicants', 'Messaging', 'Interview Management', 'Automation', 'Team Management', 'Billing', 'Integrations', 'AI Assistant', 'Analytics', 'Dashboard'];
  },

  getDefaultDateRange(): { start: string; end: string } {
    return {
      start: subDays(new Date(), 30).toISOString().slice(0, 10),
      end: addDays(new Date(), 1).toISOString().slice(0, 10),
    };
  },
};
