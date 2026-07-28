import { format } from 'date-fns';

export type TeamRoleKey =
  | 'owner'
  | 'company_admin'
  | 'recruiter'
  | 'senior_recruiter'
  | 'hiring_manager'
  | 'interviewer'
  | 'hr_executive'
  | 'recruitment_coordinator'
  | 'custom';

export type MemberStatus = 'active' | 'inactive' | 'invited';

export type PermissionKey =
  | 'jobs.view'
  | 'jobs.view_all'
  | 'jobs.create'
  | 'jobs.edit'
  | 'jobs.delete'
  | 'jobs.close'
  | 'jobs.promote'
  | 'applicants.view'
  | 'applicants.move_ats'
  | 'applicants.reject'
  | 'applicants.hire'
  | 'applicants.export'
  | 'messaging.send'
  | 'messaging.delete_conversation'
  | 'messaging.use_templates'
  | 'interview.schedule'
  | 'interview.cancel'
  | 'interview.submit_feedback'
  | 'analytics.view'
  | 'analytics.export'
  | 'ai.use_assistant'
  | 'ai.generate_reports'
  | 'ai.resume_review'
  | 'automation.create'
  | 'automation.edit'
  | 'automation.delete'
  | 'company.edit_profile'
  | 'company.manage_career_page'
  | 'company.manage_branding'
  | 'billing.manage_subscription'
  | 'billing.buy_credits'
  | 'billing.invoices'
  | 'settings.manage_team'
  | 'settings.manage_roles'
  | 'settings.security';

export interface TeamMember {
  id: string;
  ownerId: string;
  userId?: string;
  avatar: string;
  fullName: string;
  email: string;
  role: TeamRoleKey;
  customRoleId?: string;
  department: string;
  phone: string;
  permissions: PermissionKey[];
  assignedJobIds: string[];
  assignedCandidateIds: string[];
  status: MemberStatus;
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamInvitation {
  id: string;
  ownerId: string;
  fullName: string;
  email: string;
  role: TeamRoleKey;
  customRoleId?: string;
  department: string;
  phone: string;
  permissions: PermissionKey[];
  status: 'pending' | 'accepted' | 'expired';
  sentAt: string;
  resentCount: number;
}

export interface TeamCustomRole {
  id: string;
  ownerId: string;
  name: string;
  permissions: PermissionKey[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamDepartment {
  id: string;
  ownerId: string;
  name: string;
  createdAt: string;
}

export interface RecruiterActivitySnapshot {
  memberId: string;
  jobsCreated: number;
  applicantsReviewed: number;
  messagesSent: number;
  interviewsScheduled: number;
  offersSent: number;
  hiresCompleted: number;
}

export type AuditAction =
  | 'job_created'
  | 'job_edited'
  | 'candidate_moved'
  | 'interview_scheduled'
  | 'offer_sent'
  | 'role_changed'
  | 'permission_updated'
  | 'candidate_deleted'
  | 'login_success'
  | 'login_failed'
  | 'team_member_invited'
  | 'team_member_updated'
  | 'team_member_removed'
  | 'assignment_updated'
  | 'security_action';

export interface TeamAuditLog {
  id: string;
  ownerId: string;
  actorId: string;
  actorName: string;
  action: AuditAction;
  entityType: 'job' | 'candidate' | 'interview' | 'team' | 'permission' | 'security' | 'login';
  entityId: string;
  details: string;
  createdAt: string;
}

export interface LoginHistoryRecord {
  id: string;
  ownerId: string;
  memberId: string;
  device: string;
  browser: string;
  location: string;
  ipAddress: string;
  time: string;
  successful: boolean;
}

export interface TeamNotification {
  id: string;
  ownerId: string;
  type:
    | 'invitation_accepted'
    | 'invitation_pending'
    | 'new_team_member'
    | 'permission_changed'
    | 'recruiter_removed';
  message: string;
  read: boolean;
  createdAt: string;
}

interface TeamOrganizationStore {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  members: TeamMember[];
  invitations: TeamInvitation[];
  customRoles: TeamCustomRole[];
  departments: TeamDepartment[];
  activity: RecruiterActivitySnapshot[];
  auditLogs: TeamAuditLog[];
  loginHistory: LoginHistoryRecord[];
  notifications: TeamNotification[];
  forceLogoutMemberIds: string[];
}

interface TeamStore {
  organizations: TeamOrganizationStore[];
}

export interface TeamAccessContext {
  ownerId: string;
  currentMemberId: string;
  currentRole: TeamRoleKey;
  permissions: PermissionKey[];
  isOwner: boolean;
}

const STORAGE_KEY = 'actro_team_management_rbac_v1';

const builtInDepartments = ['Engineering', 'Design', 'Sales', 'Marketing', 'Finance', 'HR', 'Operations'];

const allPermissions: PermissionKey[] = [
  'jobs.view',
  'jobs.view_all',
  'jobs.create',
  'jobs.edit',
  'jobs.delete',
  'jobs.close',
  'jobs.promote',
  'applicants.view',
  'applicants.move_ats',
  'applicants.reject',
  'applicants.hire',
  'applicants.export',
  'messaging.send',
  'messaging.delete_conversation',
  'messaging.use_templates',
  'interview.schedule',
  'interview.cancel',
  'interview.submit_feedback',
  'analytics.view',
  'analytics.export',
  'ai.use_assistant',
  'ai.generate_reports',
  'ai.resume_review',
  'automation.create',
  'automation.edit',
  'automation.delete',
  'company.edit_profile',
  'company.manage_career_page',
  'company.manage_branding',
  'billing.manage_subscription',
  'billing.buy_credits',
  'billing.invoices',
  'settings.manage_team',
  'settings.manage_roles',
  'settings.security',
];

const roleLabels: Record<TeamRoleKey, string> = {
  owner: 'Owner',
  company_admin: 'Company Admin',
  recruiter: 'Recruiter',
  senior_recruiter: 'Senior Recruiter',
  hiring_manager: 'Hiring Manager',
  interviewer: 'Interviewer',
  hr_executive: 'HR Executive',
  recruitment_coordinator: 'Recruitment Coordinator',
  custom: 'Custom Role',
};

const defaultRolePermissions: Record<Exclude<TeamRoleKey, 'custom'>, PermissionKey[]> = {
  owner: [...allPermissions],
  company_admin: allPermissions.filter((perm) => perm !== 'billing.manage_subscription' && perm !== 'billing.buy_credits' && perm !== 'billing.invoices'),
  recruiter: [
    'jobs.view', 'jobs.create', 'jobs.edit', 'jobs.close', 'applicants.view', 'applicants.move_ats', 'applicants.reject',
    'messaging.send', 'messaging.use_templates', 'interview.schedule', 'interview.cancel', 'interview.submit_feedback',
    'analytics.view', 'ai.use_assistant', 'ai.resume_review', 'automation.create', 'automation.edit',
  ],
  senior_recruiter: [
    'jobs.view', 'jobs.view_all', 'jobs.create', 'jobs.edit', 'jobs.close', 'jobs.promote',
    'applicants.view', 'applicants.move_ats', 'applicants.reject', 'applicants.hire', 'applicants.export',
    'messaging.send', 'messaging.use_templates', 'interview.schedule', 'interview.cancel', 'interview.submit_feedback',
    'analytics.view', 'analytics.export', 'ai.use_assistant', 'ai.generate_reports', 'ai.resume_review',
    'automation.create', 'automation.edit', 'company.edit_profile',
  ],
  hiring_manager: [
    'jobs.view', 'applicants.view', 'applicants.reject', 'applicants.hire', 'interview.submit_feedback', 'analytics.view',
    'ai.use_assistant', 'ai.generate_reports', 'messaging.send',
  ],
  interviewer: ['jobs.view', 'applicants.view', 'interview.submit_feedback'],
  hr_executive: [
    'jobs.view', 'applicants.view', 'messaging.send', 'messaging.use_templates', 'interview.schedule', 'interview.cancel',
    'interview.submit_feedback', 'ai.use_assistant', 'ai.resume_review',
  ],
  recruitment_coordinator: [
    'jobs.view', 'applicants.view', 'applicants.move_ats', 'messaging.send', 'messaging.use_templates',
    'interview.schedule', 'interview.cancel', 'ai.use_assistant',
  ],
};

const makeId = (prefix: string): string => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const safeParse = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const readStore = (): TeamStore => safeParse<TeamStore>(localStorage.getItem(STORAGE_KEY), { organizations: [] });

const writeStore = (store: TeamStore): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

const nowIso = (): string => new Date().toISOString();

const uniq = <T,>(items: T[]): T[] => Array.from(new Set(items));

const toSearchText = (text: unknown): string => String(text || '').trim().toLowerCase();

const ensureOrganization = (store: TeamStore, ownerId: string, ownerName = 'Company Owner', ownerEmail = ''): TeamOrganizationStore => {
  let org = store.organizations.find((item) => item.ownerId === ownerId);
  if (org) return org;

  const createdAt = nowIso();

  const ownerMember: TeamMember = {
    id: makeId('team_member'),
    ownerId,
    userId: ownerId,
    avatar: '',
    fullName: ownerName,
    email: ownerEmail,
    role: 'owner',
    department: 'Management',
    phone: '',
    permissions: [...allPermissions],
    assignedJobIds: [],
    assignedCandidateIds: [],
    status: 'active',
    lastActiveAt: createdAt,
    createdAt,
    updatedAt: createdAt,
  };

  org = {
    ownerId,
    ownerName,
    ownerEmail,
    members: [ownerMember],
    invitations: [],
    customRoles: [],
    departments: builtInDepartments.map((name) => ({
      id: makeId('team_dept'),
      ownerId,
      name,
      createdAt,
    })),
    activity: [{
      memberId: ownerMember.id,
      jobsCreated: 0,
      applicantsReviewed: 0,
      messagesSent: 0,
      interviewsScheduled: 0,
      offersSent: 0,
      hiresCompleted: 0,
    }],
    auditLogs: [],
    loginHistory: [],
    notifications: [],
    forceLogoutMemberIds: [],
  };

  store.organizations.unshift(org);
  return org;
};

const pushAudit = (org: TeamOrganizationStore, payload: Omit<TeamAuditLog, 'id' | 'ownerId' | 'createdAt'>): void => {
  org.auditLogs.unshift({
    id: makeId('team_audit'),
    ownerId: org.ownerId,
    createdAt: nowIso(),
    ...payload,
  });
  org.auditLogs = org.auditLogs.slice(0, 8000);
};

const pushNotification = (org: TeamOrganizationStore, type: TeamNotification['type'], message: string): void => {
  org.notifications.unshift({
    id: makeId('team_notif'),
    ownerId: org.ownerId,
    type,
    message,
    read: false,
    createdAt: nowIso(),
  });
  org.notifications = org.notifications.slice(0, 1200);
};

const getMemberByUserId = (org: TeamOrganizationStore, userId: string): TeamMember | undefined =>
  org.members.find((member) => member.userId === userId) || org.members.find((member) => member.ownerId === userId && member.role === 'owner');

const resolveRolePermissions = (org: TeamOrganizationStore, member: TeamMember): PermissionKey[] => {
  if (member.role === 'custom' && member.customRoleId) {
    const custom = org.customRoles.find((role) => role.id === member.customRoleId);
    return custom ? [...custom.permissions] : [...member.permissions];
  }

  if (member.role === 'custom') return [...member.permissions];
  return [...defaultRolePermissions[member.role], ...member.permissions];
};

const permissionCategories: Record<string, PermissionKey[]> = {
  Jobs: ['jobs.view', 'jobs.view_all', 'jobs.create', 'jobs.edit', 'jobs.delete', 'jobs.close', 'jobs.promote'],
  Applicants: ['applicants.view', 'applicants.move_ats', 'applicants.reject', 'applicants.hire', 'applicants.export'],
  Messaging: ['messaging.send', 'messaging.delete_conversation', 'messaging.use_templates'],
  Interview: ['interview.schedule', 'interview.cancel', 'interview.submit_feedback'],
  Analytics: ['analytics.view', 'analytics.export'],
  AI: ['ai.use_assistant', 'ai.generate_reports', 'ai.resume_review'],
  Automation: ['automation.create', 'automation.edit', 'automation.delete'],
  Company: ['company.edit_profile', 'company.manage_career_page', 'company.manage_branding'],
  Billing: ['billing.manage_subscription', 'billing.buy_credits', 'billing.invoices'],
  Settings: ['settings.manage_team', 'settings.manage_roles', 'settings.security'],
};

const tabPermissionMap: Record<string, PermissionKey | null> = {
  overview: null,
  jobs: 'jobs.view',
  applicants: 'applicants.view',
  'ats-pipeline': 'applicants.move_ats',
  'talent-pool': 'applicants.view',
  recommended: 'applicants.view',
  'find-candidates': 'applicants.view',
  messages: 'messaging.send',
  'interview-management': 'interview.schedule',
  analytics: 'analytics.view',
  'automation-center': 'automation.create',
  'company-profile': 'company.edit_profile',
  'employer-branding': 'company.manage_branding',
  'ai-hiring-assistant': 'ai.use_assistant',
  settings: 'settings.security',
  tags: 'applicants.view',
  credits: 'billing.buy_credits',
  'team-management': 'settings.manage_team',
};

export const teamManagementService = {
  getRoleLabels(): Record<TeamRoleKey, string> {
    return roleLabels;
  },

  getAllPermissions(): PermissionKey[] {
    return [...allPermissions];
  },

  getPermissionCategories(): Record<string, PermissionKey[]> {
    return permissionCategories;
  },

  getDefaultRolePermissions(): Record<Exclude<TeamRoleKey, 'custom'>, PermissionKey[]> {
    return defaultRolePermissions;
  },

  initializeOwner(ownerId: string, ownerName = 'Company Owner', ownerEmail = ''): void {
    const store = readStore();
    ensureOrganization(store, ownerId, ownerName, ownerEmail);
    writeStore(store);
  },

  getOrganization(ownerId: string, ownerName = 'Company Owner', ownerEmail = ''): TeamOrganizationStore {
    const store = readStore();
    const org = ensureOrganization(store, ownerId, ownerName, ownerEmail);
    writeStore(store);
    return org;
  },

  getAccessContext(ownerId: string, userId: string): TeamAccessContext {
    const store = readStore();
    const org = ensureOrganization(store, ownerId);
    const member = getMemberByUserId(org, userId) || org.members.find((item) => item.role === 'owner') || org.members[0];
    const permissions = uniq(resolveRolePermissions(org, member));

    return {
      ownerId,
      currentMemberId: member.id,
      currentRole: member.role,
      permissions,
      isOwner: member.role === 'owner',
    };
  },

  can(ownerId: string, userId: string, permission: PermissionKey): boolean {
    const context = this.getAccessContext(ownerId, userId);
    return context.permissions.includes(permission);
  },

  getVisibleTabs(ownerId: string, userId: string, allTabs: string[]): string[] {
    const context = this.getAccessContext(ownerId, userId);
    return allTabs.filter((tab) => {
      const needed = tabPermissionMap[tab] ?? null;
      if (!needed) return true;
      return context.permissions.includes(needed);
    });
  },

  listMembers(ownerId: string, options?: {
    search?: string;
    role?: TeamRoleKey | 'all';
    department?: string;
    status?: MemberStatus | 'all';
    lastActive?: '7d' | '30d' | '90d' | 'all';
  }): TeamMember[] {
    const org = this.getOrganization(ownerId);
    const text = toSearchText(options?.search);

    return org.members
      .filter((member) => {
        if (text && !toSearchText(`${member.fullName} ${member.email} ${member.department} ${member.role}`).includes(text)) return false;
        if (options?.role && options.role !== 'all' && member.role !== options.role) return false;
        if (options?.department && options.department !== 'all' && member.department !== options.department) return false;
        if (options?.status && options.status !== 'all' && member.status !== options.status) return false;

        if (options?.lastActive && options.lastActive !== 'all') {
          const days = options.lastActive === '7d' ? 7 : options.lastActive === '30d' ? 30 : 90;
          const diff = Math.floor((Date.now() - new Date(member.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24));
          if (diff > days) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  inviteMember(ownerId: string, actorUserId: string, payload: {
    fullName: string;
    email: string;
    role: TeamRoleKey;
    customRoleId?: string;
    department: string;
    phone?: string;
    defaultPermissions?: PermissionKey[];
  }): TeamInvitation {
    const store = readStore();
    const org = ensureOrganization(store, ownerId);

    const rolePerms = payload.role === 'custom' && payload.customRoleId
      ? (org.customRoles.find((role) => role.id === payload.customRoleId)?.permissions || [])
      : payload.role === 'custom'
        ? (payload.defaultPermissions || [])
        : defaultRolePermissions[payload.role as Exclude<TeamRoleKey, 'custom'>];

    const invite: TeamInvitation = {
      id: makeId('team_invite'),
      ownerId,
      fullName: payload.fullName.trim(),
      email: payload.email.trim().toLowerCase(),
      role: payload.role,
      customRoleId: payload.customRoleId,
      department: payload.department || 'General',
      phone: payload.phone || '',
      permissions: uniq([...(payload.defaultPermissions || []), ...rolePerms]),
      status: 'pending',
      sentAt: nowIso(),
      resentCount: 0,
    };

    org.invitations.unshift(invite);

    pushNotification(org, 'invitation_pending', `Invitation sent to ${invite.fullName} (${invite.email})`);
    pushAudit(org, {
      actorId: actorUserId,
      actorName: getMemberByUserId(org, actorUserId)?.fullName || 'Recruiter',
      action: 'team_member_invited',
      entityType: 'team',
      entityId: invite.id,
      details: `Invited ${invite.fullName} as ${roleLabels[invite.role]}`,
    });

    writeStore(store);
    return invite;
  },

  resendInvitation(ownerId: string, inviteId: string, actorUserId: string): TeamInvitation {
    const store = readStore();
    const org = ensureOrganization(store, ownerId);
    const index = org.invitations.findIndex((invite) => invite.id === inviteId);
    if (index < 0) throw new Error('Invitation not found.');

    const updated: TeamInvitation = {
      ...org.invitations[index],
      sentAt: nowIso(),
      resentCount: org.invitations[index].resentCount + 1,
      status: 'pending',
    };
    org.invitations[index] = updated;

    pushNotification(org, 'invitation_pending', `Invitation resent to ${updated.fullName}`);
    pushAudit(org, {
      actorId: actorUserId,
      actorName: getMemberByUserId(org, actorUserId)?.fullName || 'Recruiter',
      action: 'team_member_invited',
      entityType: 'team',
      entityId: updated.id,
      details: `Resent invite to ${updated.email}`,
    });

    writeStore(store);
    return updated;
  },

  acceptInvitation(ownerId: string, inviteId: string, userId: string): TeamMember {
    const store = readStore();
    const org = ensureOrganization(store, ownerId);
    const inviteIndex = org.invitations.findIndex((invite) => invite.id === inviteId);
    if (inviteIndex < 0) throw new Error('Invitation not found.');

    const invite = org.invitations[inviteIndex];
    if (invite.status !== 'pending') throw new Error('Invitation cannot be accepted.');

    const createdAt = nowIso();
    const member: TeamMember = {
      id: makeId('team_member'),
      ownerId,
      userId,
      avatar: '',
      fullName: invite.fullName,
      email: invite.email,
      role: invite.role,
      customRoleId: invite.customRoleId,
      department: invite.department,
      phone: invite.phone,
      permissions: [...invite.permissions],
      assignedJobIds: [],
      assignedCandidateIds: [],
      status: 'active',
      lastActiveAt: createdAt,
      createdAt,
      updatedAt: createdAt,
    };

    org.members.push(member);
    org.activity.push({
      memberId: member.id,
      jobsCreated: 0,
      applicantsReviewed: 0,
      messagesSent: 0,
      interviewsScheduled: 0,
      offersSent: 0,
      hiresCompleted: 0,
    });

    org.invitations[inviteIndex] = { ...invite, status: 'accepted' };

    pushNotification(org, 'invitation_accepted', `${member.fullName} accepted the invitation.`);
    pushNotification(org, 'new_team_member', `New team member joined: ${member.fullName}`);
    pushAudit(org, {
      actorId: userId,
      actorName: member.fullName,
      action: 'team_member_updated',
      entityType: 'team',
      entityId: member.id,
      details: 'Invitation accepted and member activated',
    });

    writeStore(store);
    return member;
  },

  updateMember(ownerId: string, memberId: string, actorUserId: string, updates: Partial<Pick<TeamMember,
    'avatar' | 'fullName' | 'email' | 'role' | 'customRoleId' | 'department' | 'phone' | 'permissions' | 'status' | 'assignedJobIds' | 'assignedCandidateIds'>>): TeamMember {
    const store = readStore();
    const org = ensureOrganization(store, ownerId);
    const index = org.members.findIndex((member) => member.id === memberId);
    if (index < 0) throw new Error('Team member not found.');

    const current = org.members[index];
    const next: TeamMember = {
      ...current,
      ...updates,
      email: updates.email !== undefined ? String(updates.email).trim().toLowerCase() : current.email,
      fullName: updates.fullName !== undefined ? String(updates.fullName).trim() : current.fullName,
      updatedAt: nowIso(),
    };

    org.members[index] = next;

    if (updates.permissions) {
      pushNotification(org, 'permission_changed', `Permissions changed for ${next.fullName}`);
      pushAudit(org, {
        actorId: actorUserId,
        actorName: getMemberByUserId(org, actorUserId)?.fullName || 'Recruiter',
        action: 'permission_updated',
        entityType: 'permission',
        entityId: next.id,
        details: `Updated explicit permissions for ${next.fullName}`,
      });
    }

    if (updates.role && updates.role !== current.role) {
      pushAudit(org, {
        actorId: actorUserId,
        actorName: getMemberByUserId(org, actorUserId)?.fullName || 'Recruiter',
        action: 'role_changed',
        entityType: 'team',
        entityId: next.id,
        details: `Role changed from ${roleLabels[current.role]} to ${roleLabels[next.role]}`,
      });
    }

    pushAudit(org, {
      actorId: actorUserId,
      actorName: getMemberByUserId(org, actorUserId)?.fullName || 'Recruiter',
      action: 'team_member_updated',
      entityType: 'team',
      entityId: next.id,
      details: `Updated member profile for ${next.fullName}`,
    });

    writeStore(store);
    return next;
  },

  deactivateMember(ownerId: string, memberId: string, actorUserId: string): TeamMember {
    return this.updateMember(ownerId, memberId, actorUserId, { status: 'inactive' });
  },

  activateMember(ownerId: string, memberId: string, actorUserId: string): TeamMember {
    return this.updateMember(ownerId, memberId, actorUserId, { status: 'active' });
  },

  removeMember(ownerId: string, memberId: string, actorUserId: string): void {
    const store = readStore();
    const org = ensureOrganization(store, ownerId);
    const target = org.members.find((member) => member.id === memberId);
    if (!target) return;
    if (target.role === 'owner') throw new Error('Owner account cannot be removed.');

    org.members = org.members.filter((member) => member.id !== memberId);
    org.activity = org.activity.filter((item) => item.memberId !== memberId);

    pushNotification(org, 'recruiter_removed', `${target.fullName} was removed from team.`);
    pushAudit(org, {
      actorId: actorUserId,
      actorName: getMemberByUserId(org, actorUserId)?.fullName || 'Recruiter',
      action: 'team_member_removed',
      entityType: 'team',
      entityId: memberId,
      details: `Removed ${target.fullName}`,
    });

    writeStore(store);
  },

  createCustomRole(ownerId: string, actorUserId: string, payload: { name: string; permissions: PermissionKey[] }): TeamCustomRole {
    const store = readStore();
    const org = ensureOrganization(store, ownerId);
    const role: TeamCustomRole = {
      id: makeId('team_role'),
      ownerId,
      name: payload.name.trim(),
      permissions: uniq(payload.permissions),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    org.customRoles.unshift(role);

    pushAudit(org, {
      actorId: actorUserId,
      actorName: getMemberByUserId(org, actorUserId)?.fullName || 'Recruiter',
      action: 'role_changed',
      entityType: 'permission',
      entityId: role.id,
      details: `Created custom role ${role.name}`,
    });

    writeStore(store);
    return role;
  },

  listCustomRoles(ownerId: string): TeamCustomRole[] {
    return [...this.getOrganization(ownerId).customRoles].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  updateCustomRole(ownerId: string, roleId: string, actorUserId: string, updates: { name?: string; permissions?: PermissionKey[] }): TeamCustomRole {
    const store = readStore();
    const org = ensureOrganization(store, ownerId);
    const index = org.customRoles.findIndex((role) => role.id === roleId);
    if (index < 0) throw new Error('Custom role not found.');

    const current = org.customRoles[index];
    const next: TeamCustomRole = {
      ...current,
      name: updates.name !== undefined ? updates.name.trim() : current.name,
      permissions: updates.permissions ? uniq(updates.permissions) : current.permissions,
      updatedAt: nowIso(),
    };

    org.customRoles[index] = next;

    org.members = org.members.map((member) => {
      if (member.role === 'custom' && member.customRoleId === roleId) {
        return { ...member, permissions: [...next.permissions], updatedAt: nowIso() };
      }
      return member;
    });

    pushAudit(org, {
      actorId: actorUserId,
      actorName: getMemberByUserId(org, actorUserId)?.fullName || 'Recruiter',
      action: 'permission_updated',
      entityType: 'permission',
      entityId: roleId,
      details: `Updated custom role ${next.name}`,
    });

    writeStore(store);
    return next;
  },

  addDepartment(ownerId: string, name: string): TeamDepartment {
    const store = readStore();
    const org = ensureOrganization(store, ownerId);

    const normalized = name.trim();
    if (!normalized) throw new Error('Department name is required.');

    const existing = org.departments.find((dept) => toSearchText(dept.name) === toSearchText(normalized));
    if (existing) return existing;

    const created: TeamDepartment = {
      id: makeId('team_dept'),
      ownerId,
      name: normalized,
      createdAt: nowIso(),
    };

    org.departments.push(created);
    writeStore(store);
    return created;
  },

  listDepartments(ownerId: string): TeamDepartment[] {
    return [...this.getOrganization(ownerId).departments].sort((a, b) => a.name.localeCompare(b.name));
  },

  assignJobs(ownerId: string, actorUserId: string, memberIds: string[], jobIds: string[]): TeamMember[] {
    const store = readStore();
    const org = ensureOrganization(store, ownerId);
    const nextJobIds = uniq(jobIds.filter(Boolean));

    const updated: TeamMember[] = [];
    org.members = org.members.map((member) => {
      if (!memberIds.includes(member.id)) return member;
      const changed = {
        ...member,
        assignedJobIds: nextJobIds,
        updatedAt: nowIso(),
      };
      updated.push(changed);
      return changed;
    });

    pushAudit(org, {
      actorId: actorUserId,
      actorName: getMemberByUserId(org, actorUserId)?.fullName || 'Recruiter',
      action: 'assignment_updated',
      entityType: 'job',
      entityId: memberIds.join(','),
      details: `Assigned ${nextJobIds.length} jobs to ${memberIds.length} members`,
    });

    writeStore(store);
    return updated;
  },

  assignCandidates(ownerId: string, actorUserId: string, memberIds: string[], candidateIds: string[]): TeamMember[] {
    const store = readStore();
    const org = ensureOrganization(store, ownerId);
    const nextCandidateIds = uniq(candidateIds.filter(Boolean));

    const updated: TeamMember[] = [];
    org.members = org.members.map((member) => {
      if (!memberIds.includes(member.id)) return member;
      const changed = {
        ...member,
        assignedCandidateIds: nextCandidateIds,
        updatedAt: nowIso(),
      };
      updated.push(changed);
      return changed;
    });

    pushAudit(org, {
      actorId: actorUserId,
      actorName: getMemberByUserId(org, actorUserId)?.fullName || 'Recruiter',
      action: 'assignment_updated',
      entityType: 'candidate',
      entityId: memberIds.join(','),
      details: `Assigned ${nextCandidateIds.length} candidates to ${memberIds.length} members`,
    });

    writeStore(store);
    return updated;
  },

  getAssignedJobIdsForUser(ownerId: string, userId: string): string[] {
    const org = this.getOrganization(ownerId);
    const member = getMemberByUserId(org, userId);
    if (!member) return [];

    const perms = uniq(resolveRolePermissions(org, member));
    if (perms.includes('jobs.view_all')) return [];
    return [...member.assignedJobIds];
  },

  getAssignedCandidateIdsForUser(ownerId: string, userId: string): string[] {
    const org = this.getOrganization(ownerId);
    const member = getMemberByUserId(org, userId);
    if (!member) return [];

    const perms = uniq(resolveRolePermissions(org, member));
    if (perms.includes('applicants.view')) {
      return [...member.assignedCandidateIds];
    }

    return [];
  },

  trackActivity(ownerId: string, userId: string, metric: keyof Omit<RecruiterActivitySnapshot, 'memberId'>, amount = 1): void {
    const store = readStore();
    const org = ensureOrganization(store, ownerId);
    const member = getMemberByUserId(org, userId);
    if (!member) return;

    const index = org.activity.findIndex((item) => item.memberId === member.id);
    if (index < 0) {
      org.activity.push({
        memberId: member.id,
        jobsCreated: 0,
        applicantsReviewed: 0,
        messagesSent: 0,
        interviewsScheduled: 0,
        offersSent: 0,
        hiresCompleted: 0,
      });
    }

    const targetIndex = org.activity.findIndex((item) => item.memberId === member.id);
    if (targetIndex >= 0) {
      org.activity[targetIndex] = {
        ...org.activity[targetIndex],
        [metric]: Number(org.activity[targetIndex][metric] || 0) + amount,
      };
    }

    writeStore(store);
  },

  listActivity(ownerId: string): Array<RecruiterActivitySnapshot & { memberName: string; role: TeamRoleKey; department: string }> {
    const org = this.getOrganization(ownerId);
    return org.activity
      .map((row) => {
        const member = org.members.find((item) => item.id === row.memberId);
        return {
          ...row,
          memberName: member?.fullName || 'Unknown',
          role: member?.role || 'recruiter',
          department: member?.department || 'General',
        };
      })
      .sort((a, b) => (b.hiresCompleted + b.offersSent + b.interviewsScheduled) - (a.hiresCompleted + a.offersSent + a.interviewsScheduled));
  },

  logAction(ownerId: string, actorUserId: string, payload: {
    action: AuditAction;
    entityType: TeamAuditLog['entityType'];
    entityId: string;
    details: string;
  }): void {
    const store = readStore();
    const org = ensureOrganization(store, ownerId);

    pushAudit(org, {
      actorId: actorUserId,
      actorName: getMemberByUserId(org, actorUserId)?.fullName || 'Recruiter',
      action: payload.action,
      entityType: payload.entityType,
      entityId: payload.entityId,
      details: payload.details,
    });

    writeStore(store);
  },

  listAuditLogs(ownerId: string, search = ''): TeamAuditLog[] {
    const text = toSearchText(search);
    const logs = this.getOrganization(ownerId).auditLogs;
    return logs.filter((log) => !text || toSearchText(`${log.actorName} ${log.action} ${log.details}`).includes(text));
  },

  recordLogin(ownerId: string, payload: {
    memberId: string;
    device: string;
    browser: string;
    location: string;
    ipAddress: string;
    successful: boolean;
  }): LoginHistoryRecord {
    const store = readStore();
    const org = ensureOrganization(store, ownerId);

    const event: LoginHistoryRecord = {
      id: makeId('team_login'),
      ownerId,
      memberId: payload.memberId,
      device: payload.device,
      browser: payload.browser,
      location: payload.location,
      ipAddress: payload.ipAddress,
      successful: payload.successful,
      time: nowIso(),
    };

    org.loginHistory.unshift(event);
    org.loginHistory = org.loginHistory.slice(0, 3000);

    pushAudit(org, {
      actorId: payload.memberId,
      actorName: org.members.find((member) => member.id === payload.memberId)?.fullName || 'Unknown',
      action: payload.successful ? 'login_success' : 'login_failed',
      entityType: 'login',
      entityId: event.id,
      details: `${payload.successful ? 'Successful' : 'Failed'} login via ${payload.browser}`,
    });

    writeStore(store);
    return event;
  },

  listLoginHistory(ownerId: string): Array<LoginHistoryRecord & { memberName: string }> {
    const org = this.getOrganization(ownerId);
    return org.loginHistory.map((item) => ({
      ...item,
      memberName: org.members.find((member) => member.id === item.memberId)?.fullName || 'Unknown',
    }));
  },

  forceLogout(ownerId: string, actorUserId: string, memberIds: string[]): void {
    const store = readStore();
    const org = ensureOrganization(store, ownerId);
    org.forceLogoutMemberIds = uniq([...org.forceLogoutMemberIds, ...memberIds]);

    pushAudit(org, {
      actorId: actorUserId,
      actorName: getMemberByUserId(org, actorUserId)?.fullName || 'Recruiter',
      action: 'security_action',
      entityType: 'security',
      entityId: memberIds.join(','),
      details: `Forced logout for ${memberIds.length} team member(s)`,
    });

    writeStore(store);
  },

  shouldForceLogout(ownerId: string, memberId: string): boolean {
    return this.getOrganization(ownerId).forceLogoutMemberIds.includes(memberId);
  },

  clearForceLogout(ownerId: string, memberId: string): void {
    const store = readStore();
    const org = ensureOrganization(store, ownerId);
    org.forceLogoutMemberIds = org.forceLogoutMemberIds.filter((id) => id !== memberId);
    writeStore(store);
  },

  listNotifications(ownerId: string): TeamNotification[] {
    return [...this.getOrganization(ownerId).notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  markNotificationRead(ownerId: string, notificationId: string): void {
    const store = readStore();
    const org = ensureOrganization(store, ownerId);
    org.notifications = org.notifications.map((item) => item.id === notificationId ? { ...item, read: true } : item);
    writeStore(store);
  },

  summary(ownerId: string): {
    totalTeamMembers: number;
    activeRecruiters: number;
    hiringManagers: number;
    interviewers: number;
    pendingInvitations: number;
    openRoles: number;
  } {
    const org = this.getOrganization(ownerId);

    const activeRecruiters = org.members.filter((member) =>
      member.status === 'active' && (member.role === 'recruiter' || member.role === 'senior_recruiter')
    ).length;

    const hiringManagers = org.members.filter((member) => member.status === 'active' && member.role === 'hiring_manager').length;
    const interviewers = org.members.filter((member) => member.status === 'active' && member.role === 'interviewer').length;

    return {
      totalTeamMembers: org.members.length,
      activeRecruiters,
      hiringManagers,
      interviewers,
      pendingInvitations: org.invitations.filter((invite) => invite.status === 'pending').length,
      openRoles: org.customRoles.length + Object.keys(defaultRolePermissions).length,
    };
  },

  exportMembersCsv(ownerId: string): string {
    const rows = this.listMembers(ownerId);
    const headers = ['Name', 'Email', 'Role', 'Department', 'Assigned Jobs', 'Candidates Managed', 'Status', 'Last Active'];
    const lines = [headers.join(',')];
    rows.forEach((member) => {
      lines.push([
        JSON.stringify(member.fullName),
        JSON.stringify(member.email),
        JSON.stringify(roleLabels[member.role]),
        JSON.stringify(member.department),
        member.assignedJobIds.length,
        member.assignedCandidateIds.length,
        member.status,
        format(new Date(member.lastActiveAt), 'yyyy-MM-dd HH:mm'),
      ].join(','));
    });
    return lines.join('\n');
  },

  generateReports(ownerId: string): {
    recruiterPerformance: string;
    departmentPerformance: string;
    hiringPerformance: string;
    interviewPerformance: string;
    monthlyProductivity: string;
  } {
    const org = this.getOrganization(ownerId);
    const activity = this.listActivity(ownerId);

    const recruiterPerformance = [
      '# Recruiter Performance',
      '| Member | Role | Jobs Created | Applicants Reviewed | Messages Sent | Interviews Scheduled | Offers Sent | Hires Completed |',
      '|---|---|---:|---:|---:|---:|---:|---:|',
      ...activity.map((row) => `| ${row.memberName} | ${roleLabels[row.role]} | ${row.jobsCreated} | ${row.applicantsReviewed} | ${row.messagesSent} | ${row.interviewsScheduled} | ${row.offersSent} | ${row.hiresCompleted} |`),
    ].join('\n');

    const deptAgg = activity.reduce<Record<string, RecruiterActivitySnapshot>>((acc, row) => {
      const key = row.department || 'General';
      if (!acc[key]) {
        acc[key] = {
          memberId: key,
          jobsCreated: 0,
          applicantsReviewed: 0,
          messagesSent: 0,
          interviewsScheduled: 0,
          offersSent: 0,
          hiresCompleted: 0,
        };
      }
      acc[key].jobsCreated += row.jobsCreated;
      acc[key].applicantsReviewed += row.applicantsReviewed;
      acc[key].messagesSent += row.messagesSent;
      acc[key].interviewsScheduled += row.interviewsScheduled;
      acc[key].offersSent += row.offersSent;
      acc[key].hiresCompleted += row.hiresCompleted;
      return acc;
    }, {});

    const departmentPerformance = [
      '# Department Performance',
      '| Department | Jobs Created | Applicants Reviewed | Interviews Scheduled | Offers Sent | Hires Completed |',
      '|---|---:|---:|---:|---:|---:|',
      ...Object.entries(deptAgg).map(([name, row]) => `| ${name} | ${row.jobsCreated} | ${row.applicantsReviewed} | ${row.interviewsScheduled} | ${row.offersSent} | ${row.hiresCompleted} |`),
    ].join('\n');

    const hiringPerformance = [
      '# Hiring Performance',
      `- Total active team members: ${org.members.filter((member) => member.status === 'active').length}`,
      `- Total hires completed: ${activity.reduce((sum, row) => sum + row.hiresCompleted, 0)}`,
      `- Total offers sent: ${activity.reduce((sum, row) => sum + row.offersSent, 0)}`,
      `- Pending invitations: ${org.invitations.filter((invite) => invite.status === 'pending').length}`,
    ].join('\n');

    const interviewPerformance = [
      '# Interview Performance',
      `- Interviews scheduled: ${activity.reduce((sum, row) => sum + row.interviewsScheduled, 0)}`,
      `- Interviewers active: ${org.members.filter((member) => member.role === 'interviewer' && member.status === 'active').length}`,
      `- Feedback-capable users: ${org.members.filter((member) => uniq(resolveRolePermissions(org, member)).includes('interview.submit_feedback')).length}`,
    ].join('\n');

    const month = format(new Date(), 'MMMM yyyy');
    const monthlyProductivity = [
      `# Monthly Productivity (${month})`,
      `- Jobs created this month (tracked): ${activity.reduce((sum, row) => sum + row.jobsCreated, 0)}`,
      `- Applicants reviewed: ${activity.reduce((sum, row) => sum + row.applicantsReviewed, 0)}`,
      `- Messages sent: ${activity.reduce((sum, row) => sum + row.messagesSent, 0)}`,
      `- Hires completed: ${activity.reduce((sum, row) => sum + row.hiresCompleted, 0)}`,
    ].join('\n');

    return {
      recruiterPerformance,
      departmentPerformance,
      hiringPerformance,
      interviewPerformance,
      monthlyProductivity,
    };
  },
};
