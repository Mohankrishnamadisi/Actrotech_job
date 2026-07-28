import { format } from 'date-fns';

export type IntegrationCategory =
  | 'ats'
  | 'calendar'
  | 'video'
  | 'communication'
  | 'api'
  | 'import_export';

export type IntegrationConnectionType = 'api_key' | 'oauth' | 'webhook' | 'csv' | 'rest_api';

export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'pending';

export type SyncObjectType = 'jobs' | 'candidates' | 'interviews' | 'offers' | 'messages' | 'calendar';

export type SyncDirection = 'import' | 'export' | 'both';

export type SyncStatus = 'success' | 'failed' | 'running' | 'pending';

export interface IntegrationDefinition {
  id: string;
  name: string;
  logo: string;
  description: string;
  category: IntegrationCategory;
  version: string;
  features: string[];
  defaultFrequencyMinutes: number;
  connectionType: IntegrationConnectionType;
}

export interface IntegrationConnection {
  id: string;
  ownerId: string;
  integrationId: string;
  status: IntegrationStatus;
  credentials: Record<string, string>;
  syncFrequencyMinutes: number;
  lastSyncAt?: string;
  autoSync: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StageMapping {
  id: string;
  ownerId: string;
  integrationId: string;
  externalStage: string;
  internalStage: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncLog {
  id: string;
  ownerId: string;
  integrationId: string;
  objectType: SyncObjectType;
  direction: SyncDirection;
  status: SyncStatus;
  startedAt: string;
  completedAt?: string;
  durationMs: number;
  recordsImported: number;
  recordsExported: number;
  errors: string[];
  retryCount: number;
}

export interface WebhookEndpoint {
  id: string;
  ownerId: string;
  direction: 'incoming' | 'outgoing';
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  createdAt: string;
}

export interface WebhookLog {
  id: string;
  ownerId: string;
  endpointId: string;
  direction: 'incoming' | 'outgoing';
  status: 'success' | 'failed';
  payload: string;
  response: string;
  createdAt: string;
  retries: number;
}

export interface IntegrationApiKey {
  id: string;
  ownerId: string;
  name: string;
  type: 'read_only' | 'read_write';
  keyMasked: string;
  keyValue: string;
  permissions: string[];
  expiresAt?: string;
  revoked: boolean;
  createdAt: string;
}

export interface ImportPreviewRow {
  rowNumber: number;
  objectType: 'jobs' | 'candidates' | 'companies' | 'recruiters' | 'tags' | 'talent_pools';
  raw: Record<string, string>;
  duplicate: boolean;
  warnings: string[];
}

export interface ExportJob {
  id: string;
  ownerId: string;
  format: 'csv' | 'excel' | 'json' | 'pdf';
  objectType: 'jobs' | 'candidates' | 'reports' | 'analytics';
  scheduled: boolean;
  scheduledCron?: string;
  createdAt: string;
}

interface IntegrationsStore {
  connections: IntegrationConnection[];
  stageMappings: StageMapping[];
  syncLogs: SyncLog[];
  webhooks: WebhookEndpoint[];
  webhookLogs: WebhookLog[];
  apiKeys: IntegrationApiKey[];
  exportJobs: ExportJob[];
}

export interface IntegrationSummary {
  connectedIntegrations: number;
  availableIntegrations: number;
  syncStatus: string;
  lastSyncTime: string;
  failedSyncs: number;
  pendingImports: number;
  apiUsage: number;
}

const STORAGE_KEY = 'actro_ats_integrations_hub_v1';

const supportedIntegrations: IntegrationDefinition[] = [
  { id: 'greenhouse', name: 'Greenhouse', logo: '🟢', description: 'ATS sync for jobs, candidates, interviews, and offers.', category: 'ats', version: 'v2', features: ['Job Sync', 'Candidate Sync', 'Stage Mapping', 'Interview Sync'], defaultFrequencyMinutes: 30, connectionType: 'api_key' },
  { id: 'lever', name: 'Lever', logo: '🟢', description: 'Connect Lever pipelines and candidate records.', category: 'ats', version: 'v1', features: ['Candidate Sync', 'Stage Mapping', 'Webhook Events'], defaultFrequencyMinutes: 30, connectionType: 'oauth' },
  { id: 'workday', name: 'Workday', logo: '🟡', description: 'Enterprise HR and requisition integration.', category: 'ats', version: 'v1', features: ['Job Import', 'Candidate Export', 'Reports'], defaultFrequencyMinutes: 60, connectionType: 'oauth' },
  { id: 'bamboohr', name: 'BambooHR', logo: '🎋', description: 'HR records and recruiting workflow bridge.', category: 'ats', version: 'v1', features: ['Candidate Profile Sync', 'Notes Sync'], defaultFrequencyMinutes: 60, connectionType: 'api_key' },
  { id: 'ashby', name: 'Ashby', logo: '🟣', description: 'Modern ATS integration with stage mapping.', category: 'ats', version: 'v1', features: ['Pipeline Sync', 'Job Sync', 'Interview Sync'], defaultFrequencyMinutes: 30, connectionType: 'oauth' },
  { id: 'sap_successfactors', name: 'SAP SuccessFactors', logo: '🔵', description: 'Enterprise candidate and requisition sync.', category: 'ats', version: 'v1', features: ['Job Sync', 'Candidate Sync', 'Offer Sync'], defaultFrequencyMinutes: 120, connectionType: 'api_key' },
  { id: 'oracle_taleo', name: 'Oracle Taleo', logo: '🟠', description: 'Legacy ATS connectivity for enterprise imports.', category: 'ats', version: 'v1', features: ['Import Jobs', 'Import Candidates'], defaultFrequencyMinutes: 120, connectionType: 'api_key' },
  { id: 'icims', name: 'iCIMS', logo: '🟡', description: 'iCIMS integration for jobs and candidates.', category: 'ats', version: 'v1', features: ['Job Sync', 'Candidate Sync', 'Webhook'], defaultFrequencyMinutes: 45, connectionType: 'oauth' },
  { id: 'smartrecruiters', name: 'SmartRecruiters', logo: '🔷', description: 'Talent acquisition integration.', category: 'ats', version: 'v1', features: ['Job Export', 'Candidate Import'], defaultFrequencyMinutes: 45, connectionType: 'oauth' },
  { id: 'jobvite', name: 'Jobvite', logo: '🟥', description: 'Recruiting pipeline and messaging sync.', category: 'ats', version: 'v1', features: ['Pipeline Sync', 'Messaging Sync'], defaultFrequencyMinutes: 45, connectionType: 'api_key' },
  { id: 'jazzhr', name: 'JazzHR', logo: '🎷', description: 'SMB ATS integration layer.', category: 'ats', version: 'v1', features: ['Job Sync', 'Candidate Sync'], defaultFrequencyMinutes: 60, connectionType: 'api_key' },
  { id: 'zoho_recruit', name: 'Zoho Recruit', logo: '🟦', description: 'Zoho recruiting data bridge.', category: 'ats', version: 'v2', features: ['Candidate Sync', 'Notes Sync', 'Webhook'], defaultFrequencyMinutes: 60, connectionType: 'oauth' },
  { id: 'recruitee', name: 'Recruitee', logo: '🟩', description: 'Collaborative hiring integration.', category: 'ats', version: 'v1', features: ['Job Sync', 'Interview Sync'], defaultFrequencyMinutes: 30, connectionType: 'oauth' },
  { id: 'teamtailor', name: 'Teamtailor', logo: '🟨', description: 'Employer branding and applicant sync.', category: 'ats', version: 'v1', features: ['Career Site Sync', 'Candidate Sync'], defaultFrequencyMinutes: 45, connectionType: 'api_key' },
  { id: 'google_calendar', name: 'Google Calendar', logo: '📆', description: 'Two-way calendar sync with reminders.', category: 'calendar', version: 'v3', features: ['Availability', 'Interview Booking', 'Timezone Sync'], defaultFrequencyMinutes: 10, connectionType: 'oauth' },
  { id: 'outlook_calendar', name: 'Microsoft Outlook Calendar', logo: '📅', description: 'Outlook two-way interview scheduling sync.', category: 'calendar', version: 'v1', features: ['Calendar Events', 'Reminders', 'Timezone Handling'], defaultFrequencyMinutes: 10, connectionType: 'oauth' },
  { id: 'google_meet', name: 'Google Meet', logo: '🎥', description: 'Auto-generate interview meeting links.', category: 'video', version: 'v1', features: ['Meeting Link Generation', 'Interview Attach'], defaultFrequencyMinutes: 5, connectionType: 'oauth' },
  { id: 'zoom', name: 'Zoom', logo: '🎦', description: 'Generate Zoom links and sync invites.', category: 'video', version: 'v2', features: ['Meeting Links', 'Interview Invites'], defaultFrequencyMinutes: 5, connectionType: 'oauth' },
  { id: 'microsoft_teams_meeting', name: 'Microsoft Teams', logo: '🟪', description: 'Teams meeting link generation.', category: 'video', version: 'v1', features: ['Meeting Links', 'Calendar Bind'], defaultFrequencyMinutes: 5, connectionType: 'oauth' },
  { id: 'slack', name: 'Slack', logo: '💬', description: 'Recruiting notifications to Slack channels.', category: 'communication', version: 'v1', features: ['New Applicant Alerts', 'Interview Alerts', 'Offer Alerts'], defaultFrequencyMinutes: 2, connectionType: 'webhook' },
  { id: 'microsoft_teams_chat', name: 'Microsoft Teams Chat', logo: '💠', description: 'Post recruitment updates to Teams chat.', category: 'communication', version: 'v1', features: ['Notifications', 'Automation Alerts'], defaultFrequencyMinutes: 2, connectionType: 'webhook' },
  { id: 'gmail', name: 'Gmail', logo: '✉️', description: 'Send and track recruiter emails.', category: 'communication', version: 'v1', features: ['Delivery Tracking', 'Open Tracking', 'Replies Sync'], defaultFrequencyMinutes: 10, connectionType: 'oauth' },
  { id: 'outlook_email', name: 'Outlook Email', logo: '📨', description: 'Outlook email sync and tracking.', category: 'communication', version: 'v1', features: ['Delivery Tracking', 'Replies Sync'], defaultFrequencyMinutes: 10, connectionType: 'oauth' },
  { id: 'webhook', name: 'Webhook', logo: '🔗', description: 'Incoming and outgoing webhook endpoints.', category: 'api', version: 'v1', features: ['Event Delivery', 'Retries', 'Payload Logs'], defaultFrequencyMinutes: 1, connectionType: 'webhook' },
  { id: 'rest_api', name: 'REST API', logo: '🧩', description: 'External platform integration via API keys.', category: 'api', version: 'v1', features: ['API Keys', 'Read/Write Scope', 'Rotation'], defaultFrequencyMinutes: 1, connectionType: 'rest_api' },
  { id: 'csv_import', name: 'CSV Import', logo: '📥', description: 'Bulk import from CSV with duplicate detection.', category: 'import_export', version: 'v1', features: ['Preview', 'Merge', 'Overwrite Rules'], defaultFrequencyMinutes: 0, connectionType: 'csv' },
];

const makeId = (prefix: string): string => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const safeParse = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const readStore = (): IntegrationsStore => safeParse<IntegrationsStore>(localStorage.getItem(STORAGE_KEY), {
  connections: [],
  stageMappings: [],
  syncLogs: [],
  webhooks: [],
  webhookLogs: [],
  apiKeys: [],
  exportJobs: [],
});

const writeStore = (store: IntegrationsStore): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

const nowIso = (): string => new Date().toISOString();

const findDefinition = (integrationId: string): IntegrationDefinition => {
  const found = supportedIntegrations.find((item) => item.id === integrationId);
  if (!found) throw new Error('Integration definition not found');
  return found;
};

const summarizeSyncStatus = (logs: SyncLog[]): string => {
  if (logs.some((log) => log.status === 'running')) return 'Running';
  if (logs.some((log) => log.status === 'failed')) return 'Degraded';
  if (logs.some((log) => log.status === 'pending')) return 'Pending';
  return 'Healthy';
};

const fakeDuration = (): number => Math.floor(300 + Math.random() * 1900);

const maskKey = (value: string): string => {
  if (value.length <= 8) return '********';
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
};

const toLower = (value: unknown): string => String(value || '').trim().toLowerCase();

export const integrationsHubService = {
  listSupportedIntegrations(): IntegrationDefinition[] {
    return [...supportedIntegrations];
  },

  listConnections(ownerId: string): IntegrationConnection[] {
    return readStore().connections.filter((item) => item.ownerId === ownerId).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  getConnection(ownerId: string, integrationId: string): IntegrationConnection | null {
    return readStore().connections.find((item) => item.ownerId === ownerId && item.integrationId === integrationId) || null;
  },

  testConnection(_integrationId: string, credentials: Record<string, string>): { ok: boolean; message: string } {
    const hasAny = Object.values(credentials).some((value) => String(value || '').trim().length > 0);
    if (!hasAny) return { ok: false, message: 'Provide at least one credential input.' };
    const likelyBad = Object.values(credentials).some((value) => toLower(value).includes('invalid') || toLower(value).includes('fail'));
    if (likelyBad) return { ok: false, message: 'Connection test failed: invalid credentials.' };
    return { ok: true, message: 'Connection test passed.' };
  },

  connectIntegration(ownerId: string, integrationId: string, credentials: Record<string, string>, frequencyMinutes?: number): IntegrationConnection {
    const store = readStore();
    const definition = findDefinition(integrationId);
    const existingIndex = store.connections.findIndex((item) => item.ownerId === ownerId && item.integrationId === integrationId);

    const now = nowIso();

    const connection: IntegrationConnection = {
      id: existingIndex >= 0 ? store.connections[existingIndex].id : makeId('int_conn'),
      ownerId,
      integrationId,
      status: 'connected',
      credentials,
      syncFrequencyMinutes: frequencyMinutes || definition.defaultFrequencyMinutes,
      lastSyncAt: undefined,
      autoSync: true,
      createdAt: existingIndex >= 0 ? store.connections[existingIndex].createdAt : now,
      updatedAt: now,
    };

    if (existingIndex >= 0) store.connections[existingIndex] = connection;
    else store.connections.unshift(connection);

    writeStore(store);
    return connection;
  },

  disconnectIntegration(ownerId: string, integrationId: string): void {
    const store = readStore();
    store.connections = store.connections.map((item) => {
      if (item.ownerId === ownerId && item.integrationId === integrationId) {
        return { ...item, status: 'disconnected', autoSync: false, updatedAt: nowIso() };
      }
      return item;
    });
    writeStore(store);
  },

  configureIntegration(ownerId: string, integrationId: string, config: { syncFrequencyMinutes?: number; autoSync?: boolean }): IntegrationConnection {
    const store = readStore();
    const index = store.connections.findIndex((item) => item.ownerId === ownerId && item.integrationId === integrationId);
    if (index < 0) throw new Error('Integration not connected');

    const next = {
      ...store.connections[index],
      syncFrequencyMinutes: config.syncFrequencyMinutes ?? store.connections[index].syncFrequencyMinutes,
      autoSync: config.autoSync ?? store.connections[index].autoSync,
      updatedAt: nowIso(),
    };

    store.connections[index] = next;
    writeStore(store);
    return next;
  },

  triggerSync(ownerId: string, integrationId: string, objectType: SyncObjectType, direction: SyncDirection, options?: { simulateFailure?: boolean; imported?: number; exported?: number }): SyncLog {
    const store = readStore();
    const startedAt = nowIso();
    const duration = fakeDuration();

    const failed = Boolean(options?.simulateFailure);
    const imported = Math.max(0, Number(options?.imported ?? (direction === 'import' || direction === 'both' ? Math.floor(Math.random() * 120) : 0)));
    const exported = Math.max(0, Number(options?.exported ?? (direction === 'export' || direction === 'both' ? Math.floor(Math.random() * 90) : 0)));

    const log: SyncLog = {
      id: makeId('sync_log'),
      ownerId,
      integrationId,
      objectType,
      direction,
      status: failed ? 'failed' : 'success',
      startedAt,
      completedAt: new Date(new Date(startedAt).getTime() + duration).toISOString(),
      durationMs: duration,
      recordsImported: imported,
      recordsExported: exported,
      errors: failed ? ['Remote API responded with 403 permission_denied'] : [],
      retryCount: 0,
    };

    store.syncLogs.unshift(log);
    store.syncLogs = store.syncLogs.slice(0, 10000);

    store.connections = store.connections.map((connection) => {
      if (connection.ownerId === ownerId && connection.integrationId === integrationId) {
        return {
          ...connection,
          status: failed ? 'error' : 'connected',
          lastSyncAt: log.completedAt,
          updatedAt: nowIso(),
        };
      }
      return connection;
    });

    writeStore(store);
    return log;
  },

  retrySync(ownerId: string, logId: string): SyncLog {
    const store = readStore();
    const current = store.syncLogs.find((log) => log.ownerId === ownerId && log.id === logId);
    if (!current) throw new Error('Sync log not found');

    const retried = this.triggerSync(ownerId, current.integrationId, current.objectType, current.direction, {
      simulateFailure: false,
      imported: current.recordsImported,
      exported: current.recordsExported,
    });

    store.syncLogs = store.syncLogs.map((log) => {
      if (log.id === logId) return { ...log, retryCount: log.retryCount + 1 };
      return log;
    });

    writeStore(store);
    return retried;
  },

  listSyncLogs(ownerId: string, filter?: { integrationId?: string; status?: SyncStatus | 'all'; objectType?: SyncObjectType | 'all' }): SyncLog[] {
    return readStore().syncLogs
      .filter((log) => log.ownerId === ownerId)
      .filter((log) => {
        if (filter?.integrationId && filter.integrationId !== 'all' && log.integrationId !== filter.integrationId) return false;
        if (filter?.status && filter.status !== 'all' && log.status !== filter.status) return false;
        if (filter?.objectType && filter.objectType !== 'all' && log.objectType !== filter.objectType) return false;
        return true;
      })
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  },

  upsertStageMapping(ownerId: string, integrationId: string, externalStage: string, internalStage: string): StageMapping {
    const store = readStore();
    const index = store.stageMappings.findIndex((item) => item.ownerId === ownerId && item.integrationId === integrationId && toLower(item.externalStage) === toLower(externalStage));
    const now = nowIso();

    if (index >= 0) {
      const next = {
        ...store.stageMappings[index],
        internalStage,
        updatedAt: now,
      };
      store.stageMappings[index] = next;
      writeStore(store);
      return next;
    }

    const created: StageMapping = {
      id: makeId('stage_map'),
      ownerId,
      integrationId,
      externalStage,
      internalStage,
      createdAt: now,
      updatedAt: now,
    };

    store.stageMappings.unshift(created);
    writeStore(store);
    return created;
  },

  listStageMappings(ownerId: string, integrationId?: string): StageMapping[] {
    return readStore().stageMappings
      .filter((item) => item.ownerId === ownerId)
      .filter((item) => !integrationId || item.integrationId === integrationId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  createWebhook(ownerId: string, payload: { direction: 'incoming' | 'outgoing'; url: string; secret: string; events: string[] }): WebhookEndpoint {
    const store = readStore();
    const endpoint: WebhookEndpoint = {
      id: makeId('webhook_ep'),
      ownerId,
      direction: payload.direction,
      url: payload.url.trim(),
      secret: payload.secret.trim(),
      events: payload.events.filter(Boolean),
      active: true,
      createdAt: nowIso(),
    };

    store.webhooks.unshift(endpoint);
    writeStore(store);
    return endpoint;
  },

  listWebhooks(ownerId: string): WebhookEndpoint[] {
    return readStore().webhooks.filter((item) => item.ownerId === ownerId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  sendWebhookTest(ownerId: string, endpointId: string, payload = '{"event":"test"}'): WebhookLog {
    const store = readStore();
    const endpoint = store.webhooks.find((item) => item.ownerId === ownerId && item.id === endpointId);
    if (!endpoint) throw new Error('Webhook endpoint not found');

    const failed = endpoint.url.includes('fail');

    const log: WebhookLog = {
      id: makeId('webhook_log'),
      ownerId,
      endpointId,
      direction: endpoint.direction,
      status: failed ? 'failed' : 'success',
      payload,
      response: failed ? '500 Internal Server Error' : '200 OK',
      createdAt: nowIso(),
      retries: 0,
    };

    store.webhookLogs.unshift(log);
    store.webhookLogs = store.webhookLogs.slice(0, 4000);
    writeStore(store);
    return log;
  },

  retryWebhook(ownerId: string, webhookLogId: string): WebhookLog {
    const store = readStore();
    const current = store.webhookLogs.find((item) => item.ownerId === ownerId && item.id === webhookLogId);
    if (!current) throw new Error('Webhook log not found');

    const endpoint = store.webhooks.find((item) => item.id === current.endpointId);
    if (!endpoint) throw new Error('Webhook endpoint not found for retry');

    const retried: WebhookLog = {
      ...current,
      id: makeId('webhook_log'),
      status: 'success',
      response: '200 OK',
      retries: current.retries + 1,
      createdAt: nowIso(),
    };

    store.webhookLogs.unshift(retried);
    store.webhookLogs = store.webhookLogs.map((item) => item.id === webhookLogId ? { ...item, retries: item.retries + 1 } : item);
    writeStore(store);
    return retried;
  },

  listWebhookLogs(ownerId: string): WebhookLog[] {
    return readStore().webhookLogs.filter((item) => item.ownerId === ownerId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createApiKey(ownerId: string, payload: { name: string; type: 'read_only' | 'read_write'; permissions: string[]; expiresAt?: string }): IntegrationApiKey {
    const store = readStore();
    const secret = `${payload.type === 'read_only' ? 'ro' : 'rw'}_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
    const key: IntegrationApiKey = {
      id: makeId('api_key'),
      ownerId,
      name: payload.name.trim(),
      type: payload.type,
      permissions: payload.permissions,
      expiresAt: payload.expiresAt,
      revoked: false,
      keyValue: secret,
      keyMasked: maskKey(secret),
      createdAt: nowIso(),
    };

    store.apiKeys.unshift(key);
    writeStore(store);
    return key;
  },

  listApiKeys(ownerId: string): IntegrationApiKey[] {
    return readStore().apiKeys.filter((item) => item.ownerId === ownerId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  rotateApiKey(ownerId: string, keyId: string): IntegrationApiKey {
    const store = readStore();
    const index = store.apiKeys.findIndex((item) => item.ownerId === ownerId && item.id === keyId);
    if (index < 0) throw new Error('API key not found');

    const secret = `${store.apiKeys[index].type === 'read_only' ? 'ro' : 'rw'}_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;

    const next = {
      ...store.apiKeys[index],
      keyValue: secret,
      keyMasked: maskKey(secret),
      createdAt: nowIso(),
    };

    store.apiKeys[index] = next;
    writeStore(store);
    return next;
  },

  revokeApiKey(ownerId: string, keyId: string): IntegrationApiKey {
    const store = readStore();
    const index = store.apiKeys.findIndex((item) => item.ownerId === ownerId && item.id === keyId);
    if (index < 0) throw new Error('API key not found');
    store.apiKeys[index] = { ...store.apiKeys[index], revoked: true };
    writeStore(store);
    return store.apiKeys[index];
  },

  createImportPreview(ownerId: string, objectType: ImportPreviewRow['objectType'], csvText: string): ImportPreviewRow[] {
    const lines = csvText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length <= 1) return [];

    const headers = lines[0].split(',').map((item) => item.trim());
    const seen = new Set<string>();

    const rows: ImportPreviewRow[] = lines.slice(1).map((line, index) => {
      const values = line.split(',').map((item) => item.trim());
      const raw: Record<string, string> = {};
      headers.forEach((header, idx) => {
        raw[header] = values[idx] || '';
      });

      const key = `${toLower(raw.email || raw.title || raw.name)}-${toLower(raw.id || raw.phone || '')}`;
      const duplicate = seen.has(key);
      seen.add(key);

      const warnings: string[] = [];
      if (!raw.email && objectType === 'candidates') warnings.push('Missing candidate email');
      if (!raw.title && objectType === 'jobs') warnings.push('Missing job title');
      if (!raw.name && (objectType === 'recruiters' || objectType === 'companies')) warnings.push('Missing name');

      return {
        rowNumber: index + 2,
        objectType,
        raw,
        duplicate,
        warnings,
      };
    });

    this.triggerSync(ownerId, 'csv_import', objectType === 'jobs' ? 'jobs' : 'candidates', 'import', {
      simulateFailure: false,
      imported: rows.length,
      exported: 0,
    });

    return rows;
  },

  resolveConflict(strategy: 'merge' | 'overwrite' | 'skip_duplicate', source: Record<string, string>, existing: Record<string, string>): Record<string, string> {
    if (strategy === 'overwrite') return { ...existing, ...source };
    if (strategy === 'skip_duplicate') return { ...existing };

    const merged: Record<string, string> = { ...existing };
    Object.keys(source).forEach((key) => {
      merged[key] = source[key] || existing[key] || '';
    });
    return merged;
  },

  createExportJob(ownerId: string, payload: { format: ExportJob['format']; objectType: ExportJob['objectType']; scheduled?: boolean; scheduledCron?: string }): ExportJob {
    const store = readStore();
    const job: ExportJob = {
      id: makeId('export_job'),
      ownerId,
      format: payload.format,
      objectType: payload.objectType,
      scheduled: Boolean(payload.scheduled),
      scheduledCron: payload.scheduledCron,
      createdAt: nowIso(),
    };
    store.exportJobs.unshift(job);
    writeStore(store);

    this.triggerSync(ownerId, 'rest_api', payload.objectType === 'jobs' ? 'jobs' : payload.objectType === 'candidates' ? 'candidates' : 'messages', 'export', {
      simulateFailure: false,
      imported: 0,
      exported: Math.floor(20 + Math.random() * 120),
    });

    return job;
  },

  listExportJobs(ownerId: string): ExportJob[] {
    return readStore().exportJobs.filter((item) => item.ownerId === ownerId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getSummary(ownerId: string): IntegrationSummary {
    const store = readStore();
    const logs = store.syncLogs.filter((log) => log.ownerId === ownerId);
    const connections = store.connections.filter((conn) => conn.ownerId === ownerId && conn.status === 'connected');

    const lastSync = logs[0]?.completedAt || logs[0]?.startedAt || '';
    const failed = logs.filter((log) => log.status === 'failed').length;
    const pendingImports = logs.filter((log) => log.status === 'pending' && (log.direction === 'import' || log.direction === 'both')).length;

    const apiUsage = logs.reduce((sum, log) => sum + log.recordsImported + log.recordsExported, 0);

    return {
      connectedIntegrations: connections.length,
      availableIntegrations: supportedIntegrations.length,
      syncStatus: summarizeSyncStatus(logs.slice(0, 50)),
      lastSyncTime: lastSync ? format(new Date(lastSync), 'dd MMM yyyy, hh:mm a') : '-',
      failedSyncs: failed,
      pendingImports,
      apiUsage,
    };
  },

  getAnalytics(ownerId: string): {
    mostUsedIntegration: string;
    importCount: number;
    exportCount: number;
    syncSuccessRate: number;
    averageSyncTimeMs: number;
    apiUsage: number;
    errorRate: number;
  } {
    const logs = this.listSyncLogs(ownerId);
    const usage = logs.reduce<Record<string, number>>((acc, log) => {
      acc[log.integrationId] = (acc[log.integrationId] || 0) + 1;
      return acc;
    }, {});

    const mostUsed = Object.entries(usage).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
    const mostUsedName = supportedIntegrations.find((item) => item.id === mostUsed)?.name || '-';

    const importCount = logs.reduce((sum, log) => sum + log.recordsImported, 0);
    const exportCount = logs.reduce((sum, log) => sum + log.recordsExported, 0);
    const successCount = logs.filter((log) => log.status === 'success').length;
    const failedCount = logs.filter((log) => log.status === 'failed').length;

    return {
      mostUsedIntegration: mostUsedName,
      importCount,
      exportCount,
      syncSuccessRate: logs.length > 0 ? Math.round((successCount / logs.length) * 100) : 0,
      averageSyncTimeMs: logs.length > 0 ? Math.round(logs.reduce((sum, log) => sum + log.durationMs, 0) / logs.length) : 0,
      apiUsage: importCount + exportCount,
      errorRate: logs.length > 0 ? Math.round((failedCount / logs.length) * 100) : 0,
    };
  },

  getAiSuggestions(ownerId: string): string[] {
    const logs = this.listSyncLogs(ownerId).slice(0, 200);
    const mappings = this.listStageMappings(ownerId);
    const connections = this.listConnections(ownerId);
    const suggestions: string[] = [];

    const failed = logs.filter((log) => log.status === 'failed');
    if (failed.length > 0) suggestions.push(`Detected ${failed.length} failed syncs. Retry failed logs and verify API permissions.`);

    const duplicateHints = logs.filter((log) => log.errors.some((error) => toLower(error).includes('duplicate'))).length;
    if (duplicateHints > 0) suggestions.push('Duplicate candidates/jobs detected in sync logs. Enable merge strategy in conflict resolution.');

    if (mappings.length === 0) suggestions.push('Missing ATS stage mappings. Configure external-to-internal stage mapping before full pipeline sync.');

    const disconnectedCore = ['greenhouse', 'lever', 'workday'].every((id) => !connections.some((conn) => conn.integrationId === id && conn.status === 'connected'));
    if (disconnectedCore) suggestions.push('No primary ATS connected. Connect at least one ATS to unlock job/candidate automation sync.');

    const permissionErrors = failed.filter((log) => log.errors.some((error) => toLower(error).includes('permission') || toLower(error).includes('403'))).length;
    if (permissionErrors > 0) suggestions.push('API scope appears insufficient. Reconnect integration with required read/write scopes.');

    if (suggestions.length === 0) suggestions.push('Integrations look healthy. Consider enabling scheduled exports and webhook retries for resilience.');
    return suggestions;
  },
};
