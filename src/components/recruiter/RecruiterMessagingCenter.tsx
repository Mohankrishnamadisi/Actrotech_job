import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  Menu,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Archive as ArchiveIcon,
  AutoFixHigh as AutoFixHighIcon,
  Block as BlockIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Event as EventIcon,
  FileUpload as FileUploadIcon,
  FilterAlt as FilterAltIcon,
  FolderZip as FolderZipIcon,
  Mail as MailIcon,
  MarkEmailRead as MarkEmailReadIcon,
  MarkEmailUnread as MarkEmailUnreadIcon,
  MoreVert as MoreVertIcon,
  NotificationsActive as NotificationsActiveIcon,
  OutlinedFlag as OutlinedFlagIcon,
  OpenInNew as OpenInNewIcon,
  Person as PersonIcon,
  PersonSearch as PersonSearchIcon,
  PushPin as PushPinIcon,
  Search as SearchIcon,
  Send as SendIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  VolumeOff as VolumeOffIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import { format, formatDistanceToNowStrict, isSameDay } from 'date-fns';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { messagingService, type Conversation, type Message } from '@services/messaging';
import { supabase } from '@services/supabase';
import { recruiterSettingsService } from '@services/recruiterSettings';
import { themeColors } from '@styles/recruiterTheme';

export interface PendingRecruiterChatTarget {
  candidateId: string;
  candidateName: string;
  source?: 'applicants' | 'recommended' | 'talent-pool' | 'find-candidates' | 'interview-management' | 'manual';
  jobId?: string;
  jobTitle?: string;
  action?: 'message' | 'request_resume' | 'invite_interview' | 'reject_template';
}

interface RecruiterMessagingCenterProps {
  recruiterId: string;
  pendingTarget?: PendingRecruiterChatTarget | null;
  onPendingTargetHandled?: () => void;
  onOpenInterviewManagement?: (payload: {
    candidateId: string;
    candidateName: string;
    jobId?: string;
    jobTitle?: string;
  }) => void;
}

type ConversationStatus = 'online' | 'offline' | 'applied' | 'interview' | 'offer' | 'rejected';
type FilterPreset = 'all' | 'unread' | 'archived' | 'starred' | 'recent' | 'interview' | 'offer';
type AnalyticsWindow = '7d' | '30d' | '90d';

type TemplateCategory =
  | 'Application Received'
  | 'Under Review'
  | 'Interview Invitation'
  | 'Interview Reminder'
  | 'Interview Reschedule'
  | 'Interview Feedback Request'
  | 'Offer Letter'
  | 'Offer Accepted'
  | 'Offer Rejected'
  | 'Application Rejected'
  | 'Custom Template';

interface MessageTemplate {
  id: string;
  title: string;
  category: TemplateCategory;
  body: string;
  createdAt: string;
  updatedAt: string;
}

interface ConversationMeta {
  archived?: boolean;
  starred?: boolean;
  pinned?: boolean;
  muted?: boolean;
  blocked?: boolean;
  markedUnread?: boolean;
  tags?: string[];
  jobId?: string;
  jobTitle?: string;
  atsStage?: string;
  status?: ConversationStatus;
  isInterviewThread?: boolean;
  isOfferThread?: boolean;
  lastActiveAt?: string;
}

interface EnrichedConversation extends Conversation {
  jobId?: string;
  jobTitle?: string;
  atsStage?: string;
  status: ConversationStatus;
  matchScore?: number;
  tags: string[];
  meta: ConversationMeta;
}

interface CandidateContext {
  candidateId: string;
  candidateName: string;
  candidateEmail?: string;
  candidatePhone?: string;
  resumeUrl?: string;
  headline?: string;
  skills?: string[];
  experience?: string;
  applicationId?: string;
  jobId?: string;
  jobTitle?: string;
  atsStage?: string;
  matchScore?: number;
}

interface TalentPool {
  id: string;
  name: string;
}

const STORAGE_META_KEY_PREFIX = 'actro_recruiter_messages_meta_v1';
const STORAGE_TEMPLATE_KEY_PREFIX = 'actro_recruiter_message_templates_v1';
const STORAGE_TIMELINE_KEY_PREFIX = 'actro_recruiter_message_timeline_v1';

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'zip'];
const MAX_FILE_MB = 10;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

const defaultTemplates: MessageTemplate[] = [
  {
    id: 'tpl_application_received',
    title: 'Application Received',
    category: 'Application Received',
    body: 'Hi {candidateName}, we have received your application for {jobTitle}. Thank you for your interest.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_under_review',
    title: 'Under Review',
    category: 'Under Review',
    body: 'Hi {candidateName}, your profile is currently under review for {jobTitle}. We will update you soon.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_interview_invite',
    title: 'Interview Invitation',
    category: 'Interview Invitation',
    body: 'Hi {candidateName}, we would like to invite you for an interview for {jobTitle}. Please confirm your availability.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_interview_reminder',
    title: 'Interview Reminder',
    category: 'Interview Reminder',
    body: 'Reminder: your interview for {jobTitle} is scheduled on {date} at {time}. Meeting link: {meetingLink}',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_interview_reschedule',
    title: 'Interview Reschedule',
    category: 'Interview Reschedule',
    body: 'Hi {candidateName}, your interview for {jobTitle} has been rescheduled to {date} at {time}.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_feedback_request',
    title: 'Interview Feedback Request',
    category: 'Interview Feedback Request',
    body: 'Hi {candidateName}, thank you for attending the interview. Please share any questions or follow-ups you may have.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_offer_letter',
    title: 'Offer Letter',
    category: 'Offer Letter',
    body: 'Hi {candidateName}, we are pleased to extend an offer for {jobTitle}. Please review the offer and confirm acceptance.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_offer_accepted',
    title: 'Offer Accepted',
    category: 'Offer Accepted',
    body: 'Thank you {candidateName}. We are excited to have you join us. Our team will share onboarding details shortly.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_offer_rejected',
    title: 'Offer Rejected',
    category: 'Offer Rejected',
    body: 'Thank you for your update {candidateName}. We appreciate your time and wish you success in your career journey.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_application_rejected',
    title: 'Application Rejected',
    category: 'Application Rejected',
    body: 'Hi {candidateName}, thank you for your interest in {jobTitle}. We are moving ahead with other candidates at this time.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const ATS_STAGE_OPTIONS = [
  'Applied',
  'Screening',
  'Shortlisted',
  'Interview Scheduled',
  'Interview Completed',
  'Offer Sent',
  'Hired',
  'Rejected',
] as const;

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function makeId(prefix = 'id'): string {
  try {
    return `${prefix}_${crypto.randomUUID()}`;
  } catch {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

function getMetaStorageKey(recruiterId: string): string {
  return `${STORAGE_META_KEY_PREFIX}:${recruiterId}`;
}

function getTemplateStorageKey(recruiterId: string): string {
  return `${STORAGE_TEMPLATE_KEY_PREFIX}:${recruiterId}`;
}

function getTimelineStorageKey(recruiterId: string): string {
  return `${STORAGE_TIMELINE_KEY_PREFIX}:${recruiterId}`;
}

function normalizeConversationStatus(atsStage?: string, isOnline = false): ConversationStatus {
  if (isOnline) return 'online';
  const stage = String(atsStage || '').toLowerCase();
  if (stage.includes('interview')) return 'interview';
  if (stage.includes('offer') || stage.includes('hired')) return 'offer';
  if (stage.includes('reject')) return 'rejected';
  if (stage.includes('appl') || stage.includes('screen') || stage.includes('short')) return 'applied';
  return 'offline';
}

function statusChipColor(status: ConversationStatus): 'default' | 'success' | 'error' | 'warning' | 'info' {
  if (status === 'online') return 'success';
  if (status === 'interview') return 'warning';
  if (status === 'offer') return 'info';
  if (status === 'rejected') return 'error';
  return 'default';
}

function replaceTemplateVariables(
  template: string,
  candidate: CandidateContext | null,
  overrides?: Record<string, string>
): string {
  const values: Record<string, string> = {
    candidateName: candidate?.candidateName || 'Candidate',
    jobTitle: candidate?.jobTitle || 'the role',
    date: format(new Date(), 'dd MMM yyyy'),
    time: format(new Date(), 'hh:mm a'),
    meetingLink: 'https://meeting-link.example.com',
    ...(overrides || {}),
  };

  return Object.keys(values).reduce((text, key) => {
    return text.replace(new RegExp(`\\{${key}\\}`, 'g'), values[key]);
  }, template);
}

function formatTimeAgo(value: string): string {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '-';
  return formatDistanceToNowStrict(dt, { addSuffix: true });
}

function isGenericCandidateName(name?: string | null): boolean {
  const value = String(name || '').trim().toLowerCase();
  return !value || value === 'candidate' || value === 'unknown' || value === 'recruiter';
}

function csvEscape(value: unknown): string {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function generateConversationExport(rows: EnrichedConversation[]): string {
  const headers = ['Candidate', 'Job', 'ATS Stage', 'Last Message', 'Unread', 'Archived', 'Starred', 'Last Active'];
  const lines = rows.map((row) => [
    row.participantName,
    row.jobTitle || '',
    row.atsStage || '',
    row.lastMessage || '',
    row.unreadCount,
    row.meta.archived ? 'Yes' : 'No',
    row.meta.starred ? 'Yes' : 'No',
    row.lastMessageTime,
  ]);
  return [headers, ...lines].map((line) => line.map((cell) => csvEscape(cell)).join(',')).join('\n');
}

function downloadBlob(filename: string, content: string, mime = 'text/csv;charset=utf-8;'): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function inferMessageType(message: string): 'interview' | 'offer' | 'general' {
  const text = message.toLowerCase();
  if (text.includes('interview') || text.includes('meeting link') || text.includes('calendar invite')) return 'interview';
  if (text.includes('offer') || text.includes('salary') || text.includes('joining date')) return 'offer';
  return 'general';
}

function applyAiAction(text: string, action: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;

  if (action === 'professional') {
    return `Hello,\n\n${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1).replace(/\s+/g, ' ').trim()}\n\nBest regards,\nRecruitment Team`;
  }

  if (action === 'grammar') {
    const fixed = trimmed
      .replace(/\s+/g, ' ')
      .replace(/\bi\b/g, 'I')
      .replace(/\bim\b/gi, "I'm")
      .replace(/\bdont\b/gi, "don't")
      .trim();
    return fixed.endsWith('.') ? fixed : `${fixed}.`;
  }

  if (action === 'shorten') {
    const words = trimmed.split(/\s+/);
    if (words.length <= 28) return trimmed;
    return `${words.slice(0, 28).join(' ')}...`;
  }

  if (action === 'translate') {
    return `Translated (simple): ${trimmed}`;
  }

  if (action === 'rewrite') {
    return `Hi,\n\n${trimmed}\n\nPlease let me know if you have any questions.\nThank you.`;
  }

  if (action === 'invite') {
    return 'Hi {candidateName}, we would like to invite you for an interview for {jobTitle}. Please share your availability this week.';
  }

  if (action === 'reject') {
    return 'Hi {candidateName}, thank you for your time and interest in {jobTitle}. We have decided to move forward with other candidates at this stage.';
  }

  if (action === 'offer') {
    return 'Hi {candidateName}, we are happy to offer you the {jobTitle} position. Please review the details and share your decision.';
  }

  return trimmed;
}

const MotionBox = motion(Box);

export const RecruiterMessagingCenter: React.FC<RecruiterMessagingCenterProps> = ({
  recruiterId,
  pendingTarget,
  onPendingTargetHandled,
  onOpenInterviewManagement,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [viewTab, setViewTab] = useState<'dashboard' | 'center' | 'templates' | 'analytics'>('dashboard');

  const [conversations, setConversations] = useState<EnrichedConversation[]>([]);
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, Message[]>>({});
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string>('');
  const [draftTarget, setDraftTarget] = useState<PendingRecruiterChatTarget | null>(null);
  const [candidateContext, setCandidateContext] = useState<CandidateContext | null>(null);

  const [metaMap, setMetaMap] = useState<Record<string, ConversationMeta>>({});

  const [searchText, setSearchText] = useState('');
  const [leftFilter, setLeftFilter] = useState<FilterPreset>('all');
  const [filterJob, setFilterJob] = useState('all');
  const [filterAtsStage, setFilterAtsStage] = useState('all');

  const [selectedConversationIds, setSelectedConversationIds] = useState<Set<string>>(new Set());

  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState<{ title: string; category: TemplateCategory; body: string }>({
    title: '',
    category: 'Custom Template',
    body: '',
  });

  const [composerText, setComposerText] = useState('');
  const [composerAttachments, setComposerAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState<HTMLElement | null>(null);
  const [aiAnchorEl, setAiAnchorEl] = useState<HTMLElement | null>(null);
  const [conversationMenuAnchor, setConversationMenuAnchor] = useState<HTMLElement | null>(null);
  const [conversationMenuId, setConversationMenuId] = useState<string>('');

  const [notificationsEnabled, setNotificationsEnabled] = useState(Notification.permission === 'granted');

  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [offerForm, setOfferForm] = useState({ salary: '', joiningDate: format(new Date(), 'yyyy-MM-dd'), offerLetterUrl: '' });
  const [chatWindowOpen, setChatWindowOpen] = useState(false);

  const [bulkPoolOpen, setBulkPoolOpen] = useState(false);
  const [talentPools, setTalentPools] = useState<TalentPool[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState('');
  const [poolMessage, setPoolMessage] = useState('Hi {candidateName}, we would like to discuss a role with you.');

  const [analyticsWindow, setAnalyticsWindow] = useState<AnalyticsWindow>('30d');
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analytics, setAnalytics] = useState({
    sent: 0,
    replies: 0,
    responseRate: 0,
    avgResponseMinutes: 0,
    unread: 0,
    offerAcceptanceRate: 0,
    interviewMessages: 0,
    offerMessages: 0,
    sentToday: 0,
    archived: 0,
    conversations: 0,
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  const selectedMessages = useMemo(
    () => (selectedConversationId ? messagesByConversation[selectedConversationId] || [] : []),
    [messagesByConversation, selectedConversationId]
  );

  const saveMetaMap = (next: Record<string, ConversationMeta>) => {
    setMetaMap(next);
    localStorage.setItem(getMetaStorageKey(recruiterId), JSON.stringify(next));
  };

  const saveTemplates = (next: MessageTemplate[]) => {
    setTemplates(next);
    localStorage.setItem(getTemplateStorageKey(recruiterId), JSON.stringify(next));
  };

  const appendTimelineEvent = async (
    candidateId: string,
    applicationId: string | undefined,
    title: string,
    note: string
  ) => {
    const at = new Date().toISOString();
    try {
      if (applicationId) {
        await supabase.from('candidate_pipeline_history').insert({
          application_id: applicationId,
          notes: `${title}: ${note}`,
          created_at: at,
        });
      }
    } catch {
      // ignore table differences
    }

    const key = getTimelineStorageKey(recruiterId);
    const timeline = safeParse<any[]>(localStorage.getItem(key), []);
    timeline.unshift({ id: makeId('timeline'), candidateId, applicationId, title, note, at });
    localStorage.setItem(key, JSON.stringify(timeline.slice(0, 500)));
  };

  const loadTemplates = () => {
    const stored = safeParse<MessageTemplate[]>(localStorage.getItem(getTemplateStorageKey(recruiterId)), []);
    if (stored.length === 0) {
      saveTemplates(defaultTemplates);
      return;
    }
    setTemplates(stored);
  };

  const loadMeta = () => {
    const stored = safeParse<Record<string, ConversationMeta>>(localStorage.getItem(getMetaStorageKey(recruiterId)), {});
    setMetaMap(stored);
  };

  const requestDesktopNotifications = async () => {
    if (!('Notification' in window)) {
      toast.error('Desktop notifications are not supported in this browser');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === 'granted');
    if (permission === 'granted') {
      toast.success('Desktop notifications enabled');
    } else {
      toast.error('Desktop notifications permission denied');
    }
  };

  const showDesktopNotification = (title: string, body: string) => {
    if (!notificationsEnabled || !('Notification' in window)) return;
    try {
      const notification = new Notification(title, { body });
      window.setTimeout(() => notification.close(), 5000);
    } catch {
      // ignore
    }
  };

  const loadConversations = async () => {
    setLoadingConversations(true);
    try {
      const rows = await messagingService.getConversations(recruiterId);
      const blockedIds = recruiterSettingsService.getBlockedCandidateIds(recruiterId);
      const blockedEmails = recruiterSettingsService.getBlockedCandidateEmails(recruiterId);

      const candidateIds = Array.from(new Set((rows || []).map((row) => String(row.participantId || '')).filter(Boolean)));
      const profileNameMap = new Map<string, { name: string; avatar?: string }>();

      if (candidateIds.length > 0) {
        try {
          const [{ data: byId }, { data: byUserId }] = await Promise.all([
            supabase.from('profiles').select('id, name, full_name, avatar_url').in('id', candidateIds),
            supabase.from('profiles').select('user_id, name, full_name, avatar_url').in('user_id', candidateIds),
          ]);

          (byId || []).forEach((row: any) => {
            const key = String(row?.id || '').trim();
            const name = String(row?.name || row?.full_name || '').trim();
            if (key && name) {
              profileNameMap.set(key, {
                name,
                avatar: row?.avatar_url ? String(row.avatar_url) : undefined,
              });
            }
          });

          (byUserId || []).forEach((row: any) => {
            const key = String(row?.user_id || '').trim();
            const name = String(row?.name || row?.full_name || '').trim();
            if (key && name && !profileNameMap.has(key)) {
              profileNameMap.set(key, {
                name,
                avatar: row?.avatar_url ? String(row.avatar_url) : undefined,
              });
            }
          });
        } catch {
          // keep service-level resolution
        }
      }

      const enrichedRows = await Promise.all(
        (rows || []).map(async (row: Conversation) => {
          const meta = metaMap[row.id] || {};

          const mappedProfile = profileNameMap.get(String(row.participantId || ''));
          const serviceName = String(row.participantName || '').trim();
          const mergedName = isGenericCandidateName(serviceName)
            ? (mappedProfile?.name || serviceName)
            : serviceName;
          const mergedAvatar = String(row.participantAvatar || '').trim() || mappedProfile?.avatar_url || '';

          const { data: app } = await supabase
            .from('job_applications')
            .select('id, job_id, ats_stage, status, match_score, resume_url, jobs(id, title, posted_by), profiles(name, full_name, avatar_url, email, phone, headline, experience, skills)')
            .eq('user_id', row.participantId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const appData = app as any;
          const jobBelongsToRecruiter = !appData?.jobs?.posted_by || String(appData.jobs.posted_by) === recruiterId;
          const jobTitle = jobBelongsToRecruiter ? String(appData?.jobs?.title || meta.jobTitle || '') : meta.jobTitle || '';
          const jobId = jobBelongsToRecruiter ? String(appData?.job_id || meta.jobId || '') : meta.jobId || '';
          const atsStage = jobBelongsToRecruiter ? String(appData?.ats_stage || meta.atsStage || '') : (meta.atsStage || '');
          const profileEmail = String(appData?.profiles?.email || '').trim().toLowerCase();
          const appProfileName = String(appData?.profiles?.name || appData?.profiles?.full_name || '').trim();
          const appProfileAvatar = String(appData?.profiles?.avatar_url || '').trim();

          let resolvedName = String(row.participantName || '').trim();
          let resolvedAvatar = String(row.participantAvatar || '').trim();

          if (isGenericCandidateName(resolvedName)) {
            if (appProfileName) {
              resolvedName = appProfileName;
            } else {
              const { data: profileByUser } = await supabase
                .from('profiles')
                .select('name, full_name, avatar_url')
                .or(`id.eq.${row.participantId},user_id.eq.${row.participantId}`)
                .maybeSingle();

              const profileName = String((profileByUser as any)?.name || (profileByUser as any)?.full_name || '').trim();
              if (profileName) resolvedName = profileName;
              if (!resolvedAvatar) {
                resolvedAvatar = String((profileByUser as any)?.avatar_url || '').trim();
              }
            }
          }

          if (!resolvedAvatar && appProfileAvatar) {
            resolvedAvatar = appProfileAvatar;
          }

          if (!resolvedName) {
            resolvedName = `Candidate ${row.participantId.slice(0, 6).toUpperCase()}`;
          }

          const blocked = blockedIds.has(row.participantId) || (!!profileEmail && blockedEmails.has(profileEmail)) || !!meta.blocked;

          const isOnline = formatDistanceToNowStrict(new Date(row.lastMessageTime), { addSuffix: false }).includes('second')
            || formatDistanceToNowStrict(new Date(row.lastMessageTime), { addSuffix: false }).includes('minute');

          const status = normalizeConversationStatus(atsStage, isOnline && !blocked);

          const tags = Array.isArray(meta.tags) ? meta.tags : [];
          const isInterviewThread = meta.isInterviewThread || inferMessageType(row.lastMessage) === 'interview';
          const isOfferThread = meta.isOfferThread || inferMessageType(row.lastMessage) === 'offer';

          const enriched: EnrichedConversation = {
            ...row,
            participantName: isGenericCandidateName(resolvedName) ? (mergedName || resolvedName) : resolvedName,
            participantAvatar: resolvedAvatar || mergedAvatar || undefined,
            jobId,
            jobTitle,
            atsStage,
            status,
            matchScore: Number(appData?.match_score || 0) || undefined,
            tags,
            meta: {
              ...meta,
              blocked,
              status,
              isInterviewThread,
              isOfferThread,
              jobId,
              jobTitle,
              atsStage,
              lastActiveAt: row.lastMessageTime,
            },
          };

          return enriched;
        })
      );

      const visibleRows = enrichedRows.filter((row) => !row.meta.blocked);

      visibleRows.sort((a, b) => {
        const pinA = a.meta.pinned ? 1 : 0;
        const pinB = b.meta.pinned ? 1 : 0;
        if (pinA !== pinB) return pinB - pinA;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });

      setConversations(visibleRows);
      if (!selectedConversationId && visibleRows.length > 0) {
        setSelectedConversationId(visibleRows[0].id);
      }
    } catch (error) {
      console.error('Failed to load recruiter conversations', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    if (!conversationId) return;
    setLoadingMessages(true);
    try {
      const rows = await messagingService.getMessages(conversationId, 300);
      setMessagesByConversation((current) => ({ ...current, [conversationId]: rows }));

      await Promise.all(
        rows
          .filter((item) => item.receiverId === recruiterId && !item.isRead)
          .map(async (item) => {
            await messagingService.markAsRead(item.id);
            const conversation = conversations.find((conv) => conv.id === conversationId);
            if (conversation) {
              await appendTimelineEvent(
                conversation.participantId,
                candidateContext?.applicationId,
                'Message Read',
                `Recruiter read: ${item.content.slice(0, 120)}`
              );
            }
          })
      );
    } catch (error) {
      console.error('Failed to load messages', error);
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
      window.setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 30);
    }
  };

  const loadCandidateContext = async (conversation: EnrichedConversation | null) => {
    if (!conversation) {
      setCandidateContext(null);
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, user_id, name, full_name, email, phone, headline, skills, experience, resume_url')
        .or(`id.eq.${conversation.participantId},user_id.eq.${conversation.participantId}`)
        .maybeSingle();

      let applicationRow: any = null;
      if (conversation.jobId) {
        const { data: byJob } = await supabase
          .from('job_applications')
          .select('id, job_id, ats_stage, status, match_score, resume_url')
          .eq('user_id', conversation.participantId)
          .eq('job_id', conversation.jobId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        applicationRow = byJob;
      }

      if (!applicationRow) {
        const { data: latestApp } = await supabase
          .from('job_applications')
          .select('id, job_id, ats_stage, status, match_score, resume_url, jobs(id, title, posted_by)')
          .eq('user_id', conversation.participantId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        applicationRow = latestApp;
      }

      const resolvedContext: CandidateContext = {
        candidateId: conversation.participantId,
        candidateName: conversation.participantName,
        candidateEmail: (profile as any)?.email || undefined,
        candidatePhone: (profile as any)?.phone || undefined,
        resumeUrl: (applicationRow as any)?.resume_url || (profile as any)?.resume_url || undefined,
        headline: (profile as any)?.headline || undefined,
        skills: Array.isArray((profile as any)?.skills) ? (profile as any).skills : [],
        experience: (profile as any)?.experience ? String((profile as any).experience) : undefined,
        applicationId: (applicationRow as any)?.id || undefined,
        jobId: (applicationRow as any)?.job_id || conversation.jobId,
        jobTitle: conversation.jobTitle || (applicationRow as any)?.jobs?.title || undefined,
        atsStage: conversation.atsStage || (applicationRow as any)?.ats_stage || undefined,
        matchScore: Number((applicationRow as any)?.match_score || conversation.matchScore || 0) || undefined,
      };

      setCandidateContext(resolvedContext);
    } catch (error) {
      console.error('Failed to load candidate context', error);
    }
  };

  const ensureSubscription = (conversationId: string) => {
    subscriptionRef.current?.unsubscribe();
    if (!conversationId) return;

    const subscription = messagingService.subscribeToMessages(conversationId, async (message) => {
      setMessagesByConversation((current) => {
        const existing = current[conversationId] || [];
        if (existing.some((item) => item.id === message.id)) return current;
        return { ...current, [conversationId]: [...existing, message] };
      });

      if (message.senderId !== recruiterId) {
        const conversation = conversations.find((row) => row.id === conversationId);
        const title = 'Candidate Reply';
        const body = `${conversation?.participantName || 'Candidate'}: ${message.content}`;
        showDesktopNotification(title, body);
        await appendTimelineEvent(
          conversation?.participantId || '',
          candidateContext?.applicationId,
          'Candidate Replied',
          message.content.slice(0, 180)
        );
      }

      if (message.receiverId === recruiterId) {
        await messagingService.markAsRead(message.id);
      }

      void loadConversations();
    });

    subscriptionRef.current = subscription as any;
  };

  const toggleConversationMeta = (conversationId: string, key: keyof ConversationMeta, value?: boolean) => {
    const next = {
      ...metaMap,
      [conversationId]: {
        ...(metaMap[conversationId] || {}),
        [key]: typeof value === 'boolean' ? value : !metaMap[conversationId]?.[key],
      },
    };
    saveMetaMap(next);
  };

  const updateConversationMeta = (conversationId: string, updates: Partial<ConversationMeta>) => {
    const next = {
      ...metaMap,
      [conversationId]: {
        ...(metaMap[conversationId] || {}),
        ...updates,
      },
    };
    saveMetaMap(next);
  };

  const applyTemplateToComposer = (template: MessageTemplate) => {
    const parsed = replaceTemplateVariables(template.body, candidateContext);
    setComposerText(parsed);
  };

  const sendMessage = async (overrideText?: string, overrideAttachments?: string[]) => {
    const text = (overrideText ?? composerText).trim();
    const attachments = overrideAttachments ?? composerAttachments;
    if (!text && attachments.length === 0) return;

    const activeConversation = selectedConversation;
    const targetId = activeConversation?.participantId || draftTarget?.candidateId;
    if (!targetId) {
      toast.error('Select a candidate conversation first');
      return;
    }

    try {
      await messagingService.sendMessage(recruiterId, targetId, text, attachments, 'recruiter');
      setComposerText('');
      setComposerAttachments([]);
      setTyping(false);

      const messageType = inferMessageType(text);
      if (activeConversation) {
        const updates: Partial<ConversationMeta> = {};
        if (messageType === 'interview') updates.isInterviewThread = true;
        if (messageType === 'offer') updates.isOfferThread = true;
        if (Object.keys(updates).length > 0) updateConversationMeta(activeConversation.id, updates);
      }

      await appendTimelineEvent(
        targetId,
        candidateContext?.applicationId,
        messageType === 'interview'
          ? 'Interview Invite Sent'
          : messageType === 'offer'
            ? 'Offer Sent'
            : 'Message Sent',
        text.slice(0, 180)
      );

      if (messageType === 'offer') {
        showDesktopNotification('Offer Message Sent', `Offer details sent to ${candidateContext?.candidateName || 'candidate'}`);
      }
      if (messageType === 'interview') {
        showDesktopNotification('Interview Message Sent', `Interview message sent to ${candidateContext?.candidateName || 'candidate'}`);
      }

      if (draftTarget) {
        setDraftTarget(null);
      }

      await loadConversations();
      const rows = await messagingService.getConversations(recruiterId);
      const match = rows.find((row) => row.participantId === targetId);
      if (match) {
        setSelectedConversationId(match.id);
        await loadMessages(match.id);
      } else if (activeConversation) {
        await loadMessages(activeConversation.id);
      }
    } catch (error) {
      console.error('Failed to send message', error);
      toast.error('Failed to send message');
    }
  };

  const onFilePick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    const activeConversation = selectedConversation;
    if (!files || files.length === 0 || !activeConversation) return;

    setUploading(true);
    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          toast.error(`Unsupported file type: ${file.name}`);
          continue;
        }
        if (file.size > MAX_FILE_BYTES) {
          toast.error(`${file.name} exceeds ${MAX_FILE_MB}MB limit`);
          continue;
        }

        const url = await messagingService.uploadAttachment(file, activeConversation.id);
        setComposerAttachments((current) => [...current, url]);
      }
    } catch (error) {
      console.error('Attachment upload failed', error);
      toast.error('Failed to upload attachment');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const markConversationMessagesAsRead = async (conversationId: string, read: boolean) => {
    const rows = messagesByConversation[conversationId] || [];
    const candidates = rows.filter((row) => row.receiverId === recruiterId);
    if (read) {
      await Promise.all(candidates.filter((row) => !row.isRead).map((row) => messagingService.markAsRead(row.id)));
      toggleConversationMeta(conversationId, 'markedUnread', false);
    } else {
      toggleConversationMeta(conversationId, 'markedUnread', true);
    }
  };

  const handleConversationAction = async (action: string, row: EnrichedConversation) => {
    if (action === 'archive') {
      toggleConversationMeta(row.id, 'archived');
      toast.success('Conversation archive updated');
      return;
    }

    if (action === 'star') {
      toggleConversationMeta(row.id, 'starred');
      return;
    }

    if (action === 'pin') {
      toggleConversationMeta(row.id, 'pinned');
      await loadConversations();
      return;
    }

    if (action === 'mute') {
      toggleConversationMeta(row.id, 'muted');
      toast.success('Conversation mute updated');
      return;
    }

    if (action === 'mark_read') {
      await markConversationMessagesAsRead(row.id, true);
      await loadMessages(row.id);
      await loadConversations();
      return;
    }

    if (action === 'mark_unread') {
      await markConversationMessagesAsRead(row.id, false);
      await loadConversations();
      return;
    }

    if (action === 'block') {
      recruiterSettingsService.upsertBlockedCandidate(recruiterId, {
        candidateId: row.participantId,
        name: row.participantName,
      });
      updateConversationMeta(row.id, { blocked: true });
      toast.success('Candidate blocked from messaging');
      await loadConversations();
      return;
    }

    if (action === 'delete') {
      try {
        await messagingService.deleteConversation(row.id);
        setMessagesByConversation((current) => {
          const next = { ...current };
          delete next[row.id];
          return next;
        });
        setSelectedConversationIds((current) => {
          const next = new Set(current);
          next.delete(row.id);
          return next;
        });
        if (selectedConversationId === row.id) setSelectedConversationId('');
        toast.success('Conversation deleted');
        await loadConversations();
      } catch (error) {
        console.error('Failed to delete conversation', error);
        toast.error('Failed to delete conversation');
      }
      return;
    }
  };

  const runBulkAction = async (action: 'archive' | 'delete' | 'mark_read' | 'mark_unread' | 'export') => {
    const selectedRows = conversations.filter((row) => selectedConversationIds.has(row.id));
    if (selectedRows.length === 0) {
      toast.error('Select conversations first');
      return;
    }

    if (action === 'export') {
      downloadBlob(`messages-export-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`, generateConversationExport(selectedRows));
      return;
    }

    if (action === 'archive') {
      const next = { ...metaMap };
      selectedRows.forEach((row) => {
        next[row.id] = { ...(next[row.id] || {}), archived: true };
      });
      saveMetaMap(next);
      toast.success(`Archived ${selectedRows.length} conversation(s)`);
      await loadConversations();
      return;
    }

    if (action === 'mark_read' || action === 'mark_unread') {
      await Promise.all(selectedRows.map((row) => markConversationMessagesAsRead(row.id, action === 'mark_read')));
      toast.success(action === 'mark_read' ? 'Marked as read' : 'Marked as unread');
      await loadConversations();
      return;
    }

    if (action === 'delete') {
      await Promise.all(selectedRows.map((row) => messagingService.deleteConversation(row.id)));
      toast.success(`Deleted ${selectedRows.length} conversation(s)`);
      setSelectedConversationIds(new Set());
      await loadConversations();
    }
  };

  const moveAtsStage = async (stage: string) => {
    if (!candidateContext?.applicationId || !selectedConversation) {
      toast.error('No linked application found for this conversation');
      return;
    }

    try {
      await supabase
        .from('job_applications')
        .update({
          ats_stage: stage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', candidateContext.applicationId);

      updateConversationMeta(selectedConversation.id, { atsStage: stage });
      await appendTimelineEvent(candidateContext.candidateId, candidateContext.applicationId, 'Message Sent', `ATS stage moved to ${stage} from messaging center`);
      toast.success(`ATS stage moved to ${stage}`);
      await loadConversations();
      await loadCandidateContext(selectedConversation);
    } catch (error) {
      console.error('Failed to move ATS stage', error);
      toast.error('Failed to move ATS stage');
    }
  };

  const sendResumeRequest = () => {
    const base = 'Hi {candidateName}, please share your latest resume so we can proceed with your application for {jobTitle}.';
    setComposerText(replaceTemplateVariables(base, candidateContext));
  };

  const sendInterviewInvite = () => {
    const base = 'Hi {candidateName}, we would like to invite you to an interview for {jobTitle}. Please confirm your availability. Meeting link: {meetingLink}. Calendar invite: please add this slot to your calendar.';
    setComposerText(replaceTemplateVariables(base, candidateContext));
  };

  const sendRejectTemplate = () => {
    const base = 'Hi {candidateName}, thank you for your interest in {jobTitle}. We are proceeding with other candidates at this stage.';
    setComposerText(replaceTemplateVariables(base, candidateContext));
  };

  const openOfferDialog = () => {
    if (!selectedConversation) {
      toast.error('Select a conversation first');
      return;
    }
    setOfferDialogOpen(true);
  };

  const sendOfferMessage = async () => {
    const text = replaceTemplateVariables(
      'Offer details for {jobTitle}: Salary {salary}. Joining Date {joiningDate}. Offer Letter: {offerLetter}. Please reply ACCEPT or REJECT.',
      candidateContext,
      {
        salary: offerForm.salary,
        joiningDate: offerForm.joiningDate,
        offerLetter: offerForm.offerLetterUrl || 'Pending attachment',
      }
    );

    await sendMessage(text);
    setOfferDialogOpen(false);
    setOfferForm({ salary: '', joiningDate: format(new Date(), 'yyyy-MM-dd'), offerLetterUrl: '' });
  };

  const loadTalentPools = async () => {
    try {
      const { data, error } = await supabase
        .from('talent_pools')
        .select('id, name')
        .eq('recruiter_id', recruiterId)
        .order('name', { ascending: true });
      if (error) throw error;
      const pools = (data || []).map((row: any) => ({ id: String(row.id), name: String(row.name) }));
      setTalentPools(pools);
      if (!selectedPoolId && pools.length > 0) setSelectedPoolId(pools[0].id);
    } catch (error) {
      console.error('Failed to load talent pools', error);
    }
  };

  const sendTalentPoolBulkMessage = async () => {
    if (!selectedPoolId || !poolMessage.trim()) {
      toast.error('Select pool and enter message');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('talent_pool_candidates')
        .select('candidate_id')
        .eq('pool_id', selectedPoolId);
      if (error) throw error;

      const candidateIds = Array.from(new Set((data || []).map((row: any) => String(row.candidate_id)).filter(Boolean)));
      if (candidateIds.length === 0) {
        toast.error('No candidates in selected pool');
        return;
      }

      for (let index = 0; index < candidateIds.length; index += 1) {
        const candidateId = candidateIds[index];
        await messagingService.sendMessage(
          recruiterId,
          candidateId,
          replaceTemplateVariables(poolMessage, {
            candidateId,
            candidateName: 'Candidate',
          } as CandidateContext),
          undefined,
          'recruiter'
        );
      }

      toast.success(`Bulk message sent to ${candidateIds.length} candidate(s)`);
      setBulkPoolOpen(false);
      setPoolMessage('Hi {candidateName}, we would like to discuss a role with you.');
      await loadConversations();
    } catch (error) {
      console.error('Failed to send bulk message', error);
      toast.error('Failed to send bulk message');
    }
  };

  const computeAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const windowDays = analyticsWindow === '7d' ? 7 : analyticsWindow === '30d' ? 30 : 90;
      const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

      const conversationIds = conversations.map((row) => row.id);
      if (conversationIds.length === 0) {
        setAnalytics({
          sent: 0,
          replies: 0,
          responseRate: 0,
          avgResponseMinutes: 0,
          unread: 0,
          offerAcceptanceRate: 0,
          interviewMessages: 0,
          offerMessages: 0,
          sentToday: 0,
          archived: conversations.filter((row) => row.meta.archived).length,
          conversations: 0,
        });
        return;
      }

      const { data: messages, error } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, receiver_id, content, created_at, is_read')
        .in('conversation_id', conversationIds)
        .gte('created_at', since)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const list = (messages || []) as any[];
      const sent = list.filter((item) => String(item.sender_id) === recruiterId).length;
      const replies = list.filter((item) => String(item.sender_id) !== recruiterId).length;
      const sentToday = list.filter((item) => String(item.sender_id) === recruiterId && isSameDay(new Date(item.created_at), new Date())).length;

      let responseDurationsMinutes: number[] = [];
      const grouped: Record<string, any[]> = {};
      list.forEach((item) => {
        grouped[item.conversation_id] = grouped[item.conversation_id] || [];
        grouped[item.conversation_id].push(item);
      });

      Object.values(grouped).forEach((rows) => {
        for (let index = 0; index < rows.length - 1; index += 1) {
          const current = rows[index];
          const next = rows[index + 1];
          if (String(current.sender_id) === recruiterId && String(next.sender_id) !== recruiterId) {
            const diff = (new Date(next.created_at).getTime() - new Date(current.created_at).getTime()) / 60000;
            if (diff >= 0 && diff < 7 * 24 * 60) responseDurationsMinutes.push(diff);
          }
        }
      });

      const interviewMessages = list.filter((item) => inferMessageType(String(item.content || '')) === 'interview' && String(item.sender_id) === recruiterId).length;
      const offerMessages = list.filter((item) => inferMessageType(String(item.content || '')) === 'offer' && String(item.sender_id) === recruiterId).length;

      const offerAccepted = list.filter((item) => {
        const text = String(item.content || '').toLowerCase();
        return String(item.sender_id) !== recruiterId && (text.includes('accept') || text.includes('accepted'));
      }).length;

      setAnalytics({
        sent,
        replies,
        responseRate: sent > 0 ? Math.round((replies / sent) * 100) : 0,
        avgResponseMinutes: responseDurationsMinutes.length > 0
          ? Math.round(responseDurationsMinutes.reduce((sum, item) => sum + item, 0) / responseDurationsMinutes.length)
          : 0,
        unread: conversations.reduce((sum, row) => sum + row.unreadCount, 0),
        offerAcceptanceRate: offerMessages > 0 ? Math.round((offerAccepted / offerMessages) * 100) : 0,
        interviewMessages,
        offerMessages,
        sentToday,
        archived: conversations.filter((row) => row.meta.archived).length,
        conversations: conversations.length,
      });
    } catch (error) {
      console.error('Failed to compute analytics', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    loadMeta();
    loadTemplates();
    void loadTalentPools();
  }, [recruiterId]);

  useEffect(() => {
    if (Object.keys(metaMap).length === 0 && localStorage.getItem(getMetaStorageKey(recruiterId))) return;
    void loadConversations();
  }, [recruiterId, metaMap]);

  useEffect(() => {
    if (!selectedConversationId) return;
    void loadMessages(selectedConversationId);
    const convo = conversations.find((item) => item.id === selectedConversationId) || null;
    void loadCandidateContext(convo);
    ensureSubscription(selectedConversationId);

    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, [selectedConversationId]);

  useEffect(() => {
    if (!pendingTarget) return;

    const openTargetConversation = async () => {
      setViewTab('center');
      const canonicalTargetId = await messagingService.resolveUserId(pendingTarget.candidateId);

      let existingConversation = conversations.find(
        (item) => item.participantId === pendingTarget.candidateId || item.participantId === canonicalTargetId
      );

      if (!existingConversation) {
        try {
          await messagingService.ensureConversation(recruiterId, canonicalTargetId);
          await loadConversations();
        } catch (error) {
          console.error('Failed to ensure conversation for pending target:', error);
        }

        existingConversation = conversations.find(
          (item) => item.participantId === pendingTarget.candidateId || item.participantId === canonicalTargetId
        ) || (await messagingService.getConversations(recruiterId)).find(
          (item) => item.participantId === pendingTarget.candidateId || item.participantId === canonicalTargetId
        ) as any;
      }

      if (existingConversation?.id) {
        setSelectedConversationId(existingConversation.id);
        setDraftTarget(null);
        if (pendingTarget.source === 'recommended') {
          updateConversationMeta(existingConversation.id, { starred: true, pinned: true });
        }
      } else {
        setDraftTarget({
          ...pendingTarget,
          candidateId: canonicalTargetId || pendingTarget.candidateId,
        });
      }

      if (pendingTarget.action === 'request_resume') sendResumeRequest();
      if (pendingTarget.action === 'invite_interview') sendInterviewInvite();
      if (pendingTarget.action === 'reject_template') sendRejectTemplate();

      onPendingTargetHandled?.();
    };

    void openTargetConversation();
  }, [pendingTarget, conversations]);

  useEffect(() => {
    if (viewTab === 'analytics') {
      void computeAnalytics();
    }
  }, [viewTab, analyticsWindow, conversations]);

  const filteredConversations = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return conversations
      .filter((row) => {
        const meta = row.meta;
        const unread = row.unreadCount > 0 || meta.markedUnread;

        if (leftFilter === 'unread' && !unread) return false;
        if (leftFilter === 'archived' && !meta.archived) return false;
        if (leftFilter === 'starred' && !meta.starred) return false;
        if (leftFilter === 'recent') {
          const ageHours = (Date.now() - new Date(row.lastMessageTime).getTime()) / (60 * 60 * 1000);
          if (ageHours > 72) return false;
        }
        if (leftFilter === 'interview' && !meta.isInterviewThread) return false;
        if (leftFilter === 'offer' && !meta.isOfferThread) return false;

        if (filterJob !== 'all' && row.jobId !== filterJob) return false;
        if (filterAtsStage !== 'all' && row.atsStage !== filterAtsStage) return false;

        if (!keyword) return true;

        const haystack = [
          row.participantName,
          row.jobTitle,
          row.lastMessage,
          row.lastMessageTime,
          row.tags.join(' '),
          row.atsStage,
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(keyword);
      })
      .sort((a, b) => {
        const pinDiff = Number(Boolean(b.meta.pinned)) - Number(Boolean(a.meta.pinned));
        if (pinDiff !== 0) return pinDiff;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });
  }, [conversations, searchText, leftFilter, filterJob, filterAtsStage]);

  const summary = useMemo(() => {
    const unread = conversations.reduce((sum, row) => sum + (row.unreadCount > 0 || row.meta.markedUnread ? 1 : 0), 0);
    const archived = conversations.filter((row) => row.meta.archived).length;

    let sentToday = 0;
    let interviewMessages = 0;
    let offerMessages = 0;

    Object.values(messagesByConversation).forEach((rows) => {
      rows.forEach((row) => {
        if (row.senderId !== recruiterId) return;
        if (isSameDay(new Date(row.createdAt), new Date())) sentToday += 1;
        const type = inferMessageType(row.content);
        if (type === 'interview') interviewMessages += 1;
        if (type === 'offer') offerMessages += 1;
      });
    });

    return {
      unread,
      conversations: conversations.length,
      archived,
      sentToday,
      interviewMessages,
      offerMessages,
    };
  }, [conversations, messagesByConversation, recruiterId]);

  const allJobs = useMemo(() => {
    const map = new Map<string, string>();
    conversations.forEach((row) => {
      if (row.jobId && row.jobTitle) map.set(row.jobId, row.jobTitle);
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [conversations]);

  const addEmoji = (emoji: string) => {
    setComposerText((current) => `${current}${emoji}`);
    setEmojiAnchorEl(null);
  };

  const renderDashboard = () => (
    <>
      <Grid container spacing={2}>
        {[{
          title: 'Unread Messages', value: summary.unread, icon: <MarkEmailUnreadIcon />, color: themeColors.warning,
        }, {
          title: 'Conversations', value: summary.conversations, icon: <MailIcon />, color: themeColors.primary,
        }, {
          title: 'Archived', value: summary.archived, icon: <ArchiveIcon />, color: themeColors.text.secondary,
        }, {
          title: 'Sent Today', value: summary.sentToday, icon: <SendIcon />, color: themeColors.success,
        }, {
          title: 'Interview Messages', value: summary.interviewMessages, icon: <EventIcon />, color: themeColors.info,
        }, {
          title: 'Offer Messages', value: summary.offerMessages, icon: <OutlinedFlagIcon />, color: themeColors.primary,
        }].map((card) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={card.title} sx={{ display: 'flex' }}>
            <Card
              sx={{
                borderRadius: 2.5,
                border: `1px solid ${themeColors.border}`,
                minHeight: 148,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                overflow: 'hidden',
                boxShadow: '0 10px 20px rgba(15, 23, 42, 0.05)',
              }}
            >
              <CardContent sx={{ p: 1.75, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: themeColors.text.secondary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                        fontWeight: 700,
                        mb: 0.5,
                      }}
                    >
                      {card.title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.04em' }}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: 2,
                      bgcolor: `${card.color}1A`,
                      color: card.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {card.icon}
                  </Box>
                </Box>
                <Typography variant="caption" sx={{ color: themeColors.text.tertiary, pt: 0.5 }}>
                  Updated now
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mt: 2, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Notifications</Typography>
          <Stack spacing={1}>
            <Alert severity="info">New Message alerts are enabled in the split chat center.</Alert>
            <Alert severity="success">Candidate Reply alerts trigger desktop notifications when permission is granted.</Alert>
            <Alert severity="warning">Interview Confirmation and Offer decision messages are auto-detected from message text.</Alert>
            <Box>
              <Button size="small" variant="outlined" startIcon={<NotificationsActiveIcon />} onClick={requestDesktopNotifications}>
                {notificationsEnabled ? 'Desktop Notifications Enabled' : 'Enable Desktop Notifications'}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </>
  );

  const renderMessageRow = (message: Message, previous: Message | null) => {
    const isMine = message.senderId === recruiterId;
    const currentDate = new Date(message.createdAt);
    const previousDate = previous ? new Date(previous.createdAt) : null;
    const showDateSeparator = !previousDate || !isSameDay(previousDate, currentDate);

    return (
      <React.Fragment key={message.id}>
        {showDateSeparator && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
            <Chip size="small" label={format(currentDate, 'dd MMM yyyy')} />
          </Box>
        )}
        <Box sx={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', mb: 0.75 }}>
          <Box
            sx={{
              maxWidth: '78%',
              bgcolor: isMine ? `${themeColors.primary}` : '#F3F4F6',
              color: isMine ? '#fff' : themeColors.text.primary,
              borderRadius: 1.5,
              p: 1,
              border: isMine ? 'none' : `1px solid ${themeColors.border}`,
            }}
          >
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{message.content}</Typography>
            {message.attachments && message.attachments.length > 0 && (
              <Stack spacing={0.5} sx={{ mt: 0.75 }}>
                {message.attachments.map((attachment, idx) => (
                  <Typography key={`${message.id}-attachment-${idx}`} variant="caption">
                    <a href={attachment} target="_blank" rel="noreferrer" style={{ color: isMine ? '#fff' : themeColors.primary }}>
                      Attachment {idx + 1}
                    </a>
                  </Typography>
                ))}
              </Stack>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mt: 0.5 }}>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>{format(currentDate, 'hh:mm a')}</Typography>
              {isMine && (
                <Typography variant="caption" sx={{ opacity: 0.85 }}>
                  {message.isRead ? 'Read' : 'Sent'}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </React.Fragment>
    );
  };

  const renderCenter = () => (
    <Box sx={{ bgcolor: '#f1f5f9', borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '280px 340px minmax(0, 1fr)' },
          height: isMobile ? 'auto' : 'calc(100vh - 200px)',
          minHeight: 640,
          alignItems: 'stretch',
        }}
      >
        <Box
          sx={{
            borderRight: '1px solid #e2e8f0',
            p: 2,
            bgcolor: '#fff',
            minHeight: { xs: 'auto', lg: 0 },
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.7rem' }}>Conversations</Typography>

          <TextField
            fullWidth
            size="small"
            placeholder="Search candidate, job, message..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: '#94a3b8' }} /></InputAdornment> }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f8fafc' } }}
          />

          <Stack direction="row" spacing={0.75} sx={{ mt: 1.25, flexWrap: 'wrap' }}>
            {['all', 'unread', 'archived', 'starred', 'recent', 'interview', 'offer'].map((preset) => (
              <Chip
                key={preset}
                label={preset.charAt(0).toUpperCase() + preset.slice(1)}
                size="small"
                color={leftFilter === preset ? 'primary' : 'default'}
                onClick={() => setLeftFilter(preset as FilterPreset)}
                sx={{ mb: 0.5 }}
              />
            ))}
          </Stack>

          <FormControl fullWidth size="small" sx={{ mt: 1 }}>
            <InputLabel>Job</InputLabel>
            <Select value={filterJob} label="Job" onChange={(event) => setFilterJob(event.target.value)}>
              <MenuItem value="all">All Jobs</MenuItem>
              {allJobs.map((job) => <MenuItem key={job.id} value={job.id}>{job.title}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" sx={{ mt: 1 }}>
            <InputLabel>ATS Stage</InputLabel>
            <Select value={filterAtsStage} label="ATS Stage" onChange={(event) => setFilterAtsStage(event.target.value)}>
              <MenuItem value="all">All Stages</MenuItem>
              {ATS_STAGE_OPTIONS.map((stage) => <MenuItem key={stage} value={stage}>{stage}</MenuItem>)}
            </Select>
          </FormControl>

          <Divider sx={{ my: 0.5 }} />

          {/* Bulk actions as compact icon row */}
          <Box>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>Bulk Actions</Typography>
            <Stack direction="row" spacing={0.5} sx={{ mt: 0.75, flexWrap: 'wrap', gap: 0.5 }}>
              <Tooltip title="Bulk Archive">
                <IconButton size="small" onClick={() => runBulkAction('archive')} sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 1.5 }}><ArchiveIcon fontSize="small" /></IconButton>
              </Tooltip>
              <Tooltip title="Bulk Delete">
                <IconButton size="small" onClick={() => runBulkAction('delete')} sx={{ bgcolor: '#fff5f5', border: '1px solid #fecaca', borderRadius: 1.5, color: '#ef4444' }}><DeleteIcon fontSize="small" /></IconButton>
              </Tooltip>
              <Tooltip title="Mark Read">
                <IconButton size="small" onClick={() => runBulkAction('mark_read')} sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 1.5 }}><MarkEmailReadIcon fontSize="small" /></IconButton>
              </Tooltip>
              <Tooltip title="Mark Unread">
                <IconButton size="small" onClick={() => runBulkAction('mark_unread')} sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 1.5 }}><MarkEmailUnreadIcon fontSize="small" /></IconButton>
              </Tooltip>
              <Tooltip title="Export">
                <IconButton size="small" onClick={() => runBulkAction('export')} sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 1.5 }}><DownloadIcon fontSize="small" /></IconButton>
              </Tooltip>
              <Tooltip title="Message Talent Pool">
                <IconButton size="small" onClick={() => setBulkPoolOpen(true)} sx={{ bgcolor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 1.5, color: '#0284c7' }}><PersonSearchIcon fontSize="small" /></IconButton>
              </Tooltip>
            </Stack>
          </Box>
        </Box>

        <Box sx={{ borderRight: '1px solid #e2e8f0', overflow: 'hidden', bgcolor: '#fff', display: 'flex', flexDirection: 'column', minHeight: { xs: 320, lg: 0 } }}>
          <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#fafafa' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>Inbox</Typography>
            {loadingConversations && <LinearProgress sx={{ width: 60, borderRadius: 1 }} />}
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {filteredConversations.map((row) => {
              const selected = selectedConversationId === row.id;
              const unread = row.unreadCount > 0 || row.meta.markedUnread;
              return (
                <Box
                  key={row.id}
                  sx={{
                    px: 2, py: 1.5,
                    borderBottom: '1px solid #f8fafc',
                    bgcolor: selected ? '#f5f3ff' : unread ? '#fffbf0' : '#fff',
                    borderLeft: selected ? '3px solid #6366f1' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    '&:hover': { bgcolor: selected ? '#f5f3ff' : '#f8fafc' },
                  }}
                  onClick={() => { setSelectedConversationId(row.id); setDraftTarget(null); }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                    <Checkbox
                      checked={selectedConversationIds.has(row.id)}
                      onClick={(event) => event.stopPropagation()}
                      onChange={() => {
                        setSelectedConversationIds((current) => {
                          const next = new Set(current);
                          if (next.has(row.id)) next.delete(row.id); else next.add(row.id);
                          return next;
                        });
                      }}
                      size="small"
                      sx={{ p: 0, mt: 0.5 }}
                    />
                    <Box sx={{ position: 'relative' }}>
                      <Avatar src={row.participantAvatar} sx={{ width: 40, height: 40, fontSize: '0.95rem', bgcolor: '#6366f1' }}>{row.participantName.charAt(0).toUpperCase()}</Avatar>
                      <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', bgcolor: row.status === 'online' ? '#22c55e' : '#d1d5db', border: '2px solid #fff' }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
                        <Typography variant="body2" sx={{ fontWeight: unread ? 800 : 600, color: '#0f172a', fontSize: '0.875rem' }} noWrap>{row.participantName}</Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem', flexShrink: 0, ml: 1 }}>{formatTimeAgo(row.lastMessageTime)}</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontWeight: 500 }} noWrap>{row.jobTitle || 'No job linked'}</Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }} noWrap>{row.lastMessage || 'No messages yet'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                      {unread && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f59e0b' }} />}
                      <IconButton size="small" sx={{ p: 0.25, opacity: 0.5 }}
                        onClick={(event) => { event.stopPropagation(); void handleConversationAction('star', row); }}>
                        {row.meta.starred ? <StarIcon sx={{ fontSize: 14, color: '#f59e0b' }} /> : <StarBorderIcon sx={{ fontSize: 14 }} />}
                      </IconButton>
                      <IconButton size="small" sx={{ p: 0.25, opacity: 0.5 }}
                        onClick={(event) => { event.stopPropagation(); setConversationMenuAnchor(event.currentTarget); setConversationMenuId(row.id); }}>
                        <MoreVertIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              );
            })}

            {filteredConversations.length === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, color: '#94a3b8' }}>
                <MailIcon sx={{ fontSize: 40, mb: 1, opacity: 0.4 }} />
                <Typography variant="body2">No conversations found</Typography>
              </Box>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: { xs: 480, lg: 0 }, bgcolor: '#fff', overflow: 'hidden' }}>
          {selectedConversation || draftTarget ? (
            <>
              {/* Chat header */}
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9', bgcolor: '#fafafa' }}>

                {/* Row 1: Avatar + name */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.25 }}>
                  <Avatar src={selectedConversation?.participantAvatar} sx={{ width: 40, height: 40, bgcolor: '#6366f1', fontWeight: 800, flexShrink: 0 }}>
                    {(selectedConversation?.participantName || draftTarget?.candidateName || 'C').charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2, fontSize: '0.95rem' }} noWrap>
                      {selectedConversation?.participantName || draftTarget?.candidateName}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.25 }}>
                      {candidateContext?.matchScore !== undefined && <Chip size="small" label={`${candidateContext.matchScore}% match`} sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#dcfce7', color: '#16a34a' }} />}
                      {candidateContext?.jobTitle && <Chip size="small" label={candidateContext.jobTitle} sx={{ height: 18, fontSize: '0.6rem' }} />}
                      {candidateContext?.atsStage && <Chip size="small" label={candidateContext.atsStage} sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#ede9fe', color: '#7c3aed' }} />}
                    </Box>
                  </Box>
                </Box>

                {/* Row 2: Primary action buttons — all same height, no wrap */}
                <Box sx={{ display: 'flex', gap: 0.75, mb: 1, flexWrap: 'nowrap', overflowX: 'auto', pb: 0.25 }}>
                  <Button size="small" variant="outlined" startIcon={<PersonIcon sx={{ fontSize: '0.85rem !important' }} />}
                    sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.78rem', whiteSpace: 'nowrap', flexShrink: 0, height: 32 }}
                    onClick={() => { if (!candidateContext) { toast.error('Candidate profile unavailable'); return; } toast.success(`${candidateContext.candidateName}${candidateContext.headline ? ` · ${candidateContext.headline}` : ''}`); }}>
                    Profile
                  </Button>
                  <Button size="small" variant="outlined"
                    sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.78rem', whiteSpace: 'nowrap', flexShrink: 0, height: 32 }}
                    onClick={() => { if (!candidateContext?.resumeUrl) { toast.error('Resume not available'); return; } window.open(candidateContext.resumeUrl, '_blank', 'noopener,noreferrer'); }}>
                    Resume
                  </Button>
                  <Button size="small" variant="outlined" startIcon={<EventIcon sx={{ fontSize: '0.85rem !important' }} />}
                    sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.78rem', whiteSpace: 'nowrap', flexShrink: 0, height: 32 }}
                    onClick={() => { const name = selectedConversation?.participantName || draftTarget?.candidateName || 'Candidate'; const id = selectedConversation?.participantId || draftTarget?.candidateId || ''; onOpenInterviewManagement?.({ candidateId: id, candidateName: name, jobId: candidateContext?.jobId, jobTitle: candidateContext?.jobTitle }); }}>
                    Interview
                  </Button>
                  <Button size="small" variant="contained" startIcon={<OpenInNewIcon sx={{ fontSize: '0.85rem !important' }} />}
                    sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.78rem', whiteSpace: 'nowrap', flexShrink: 0, height: 32, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}
                    onClick={() => setChatWindowOpen(true)}>
                    Chat Window
                  </Button>
                  <FormControl size="small" sx={{ flexShrink: 0, minWidth: 120, height: 32 }}>
                    <Select value={candidateContext?.atsStage || ''} displayEmpty
                      sx={{ borderRadius: 2, fontSize: '0.78rem', height: 32 }}
                      onChange={(event) => { const stage = event.target.value; if (stage) void moveAtsStage(stage); }}
                      renderValue={(value) => value || 'Move Stage'}>
                      <MenuItem value="" disabled>Move Stage</MenuItem>
                      {ATS_STAGE_OPTIONS.map((stage) => <MenuItem key={stage} value={stage} sx={{ fontSize: '0.8rem' }}>{stage}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>

                {/* Row 3: Quick action buttons */}
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'nowrap', overflowX: 'auto', pb: 0.25 }}>
                  <Button size="small" onClick={sendResumeRequest}
                    sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.72rem', whiteSpace: 'nowrap', flexShrink: 0, height: 28, color: '#475569', border: '1px solid #e2e8f0', px: 1.25 }}>
                    Request Resume
                  </Button>
                  <Button size="small" onClick={sendInterviewInvite}
                    sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.72rem', whiteSpace: 'nowrap', flexShrink: 0, height: 28, color: '#475569', border: '1px solid #e2e8f0', px: 1.25 }}>
                    Interview Invite
                  </Button>
                  <Button size="small" onClick={openOfferDialog}
                    sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.72rem', whiteSpace: 'nowrap', flexShrink: 0, height: 28, color: '#16a34a', border: '1px solid #bbf7d0', px: 1.25 }}>
                    Offer Letter
                  </Button>
                  <Button size="small" color="error" onClick={sendRejectTemplate}
                    sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.72rem', whiteSpace: 'nowrap', flexShrink: 0, height: 28, border: '1px solid #fecaca', px: 1.25 }}>
                    Reject
                  </Button>
                  <FormControl size="small" sx={{ flexShrink: 0, minWidth: 140, height: 28 }}>
                    <Select value="" displayEmpty
                      sx={{ borderRadius: 2, fontSize: '0.72rem', height: 28, color: '#64748b' }}
                      onChange={(event) => { const t = templates.find((item) => item.id === event.target.value); if (t) applyTemplateToComposer(t); }}
                      renderValue={() => 'Use Template'}>
                      {templates.map((template) => <MenuItem key={template.id} value={template.id} sx={{ fontSize: '0.8rem' }}>{template.title}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#fafafa', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {loadingMessages && <LinearProgress sx={{ mb: 1, borderRadius: 1 }} />}
                {!loadingMessages && selectedMessages.length === 0 && (
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', py: 8 }}>
                    <MailIcon sx={{ fontSize: 48, mb: 1.5, opacity: 0.3 }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>Start the conversation</Typography>
                    <Typography variant="caption">Send a message to begin</Typography>
                  </Box>
                )}
                {selectedMessages.map((message, idx) => renderMessageRow(message, idx > 0 ? selectedMessages[idx - 1] : null))}
                {typing && <Typography variant="caption" sx={{ color: '#94a3b8', px: 1 }}>typing...</Typography>}
                <div ref={messagesEndRef} />
              </Box>

              {/* Composer */}
              <Box sx={{ borderTop: '1px solid #f1f5f9', bgcolor: '#fff' }}>
                {composerAttachments.length > 0 && (
                  <Box sx={{ px: 2, pt: 1.25, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {composerAttachments.map((url, idx) => (
                      <Chip key={`${url}-${idx}`} icon={<FolderZipIcon fontSize="small" />}
                        label={url.split('/').pop() || `Attachment ${idx + 1}`}
                        onDelete={() => setComposerAttachments((current) => current.filter((_, i) => i !== idx))}
                        size="small" sx={{ borderRadius: 2 }} />
                    ))}
                  </Box>
                )}
                <Box sx={{ px: 2, pt: 1.25 }}>
                  <TextField
                    fullWidth multiline minRows={2} maxRows={5}
                    placeholder="Type your message…"
                    value={composerText}
                    onChange={(event) => { setComposerText(event.target.value); setTyping(event.target.value.trim().length > 0); }}
                    onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: '#f8fafc', fontSize: '0.9rem' } }}
                  />
                </Box>
                <Box sx={{ px: 2, py: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Emoji">
                      <IconButton size="small" sx={{ color: '#94a3b8' }} onClick={(event) => setEmojiAnchorEl(event.currentTarget)}>😊</IconButton>
                    </Tooltip>
                    <Tooltip title="AI Tools">
                      <IconButton size="small" sx={{ color: '#94a3b8' }} onClick={(event) => setAiAnchorEl(event.currentTarget)}><AutoFixHighIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title={`Attach file (max ${MAX_FILE_MB}MB)`}>
                      <IconButton size="small" sx={{ color: '#94a3b8' }} onClick={() => fileInputRef.current?.click()} disabled={!selectedConversation || uploading}><FileUploadIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <input ref={fileInputRef} type="file" hidden multiple onChange={onFilePick} accept={ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',')} />
                    <Typography variant="caption" sx={{ color: '#cbd5e1', lineHeight: '34px' }}>PDF, DOC, Images, ZIP ≤ {MAX_FILE_MB}MB</Typography>
                  </Stack>
                  <Button variant="contained" endIcon={<SendIcon />}
                    disabled={(!composerText.trim() && composerAttachments.length === 0) || uploading}
                    onClick={() => void sendMessage()}
                    sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 700, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, px: 2.5 }}>
                    Send
                  </Button>
                </Box>
              </Box>

              <Menu anchorEl={emojiAnchorEl} open={Boolean(emojiAnchorEl)} onClose={() => setEmojiAnchorEl(null)}>
                {['😀', '👍', '✅', '📅', '📎', '🎯', '🙏'].map((emoji) => (
                  <MenuItem key={emoji} onClick={() => addEmoji(emoji)}>{emoji}</MenuItem>
                ))}
              </Menu>

              <Menu anchorEl={aiAnchorEl} open={Boolean(aiAnchorEl)} onClose={() => setAiAnchorEl(null)}>
                <MenuItem onClick={() => { setComposerText((current) => applyAiAction(current, 'professional')); setAiAnchorEl(null); }}>Generate Professional Message</MenuItem>
                <MenuItem onClick={() => { setComposerText((current) => applyAiAction(current, 'grammar')); setAiAnchorEl(null); }}>Improve Grammar</MenuItem>
                <MenuItem onClick={() => { setComposerText((current) => applyAiAction(current, 'shorten')); setAiAnchorEl(null); }}>Shorten Message</MenuItem>
                <MenuItem onClick={() => { setComposerText((current) => applyAiAction(current, 'translate')); setAiAnchorEl(null); }}>Translate Message</MenuItem>
                <MenuItem onClick={() => { setComposerText((current) => applyAiAction(current, 'rewrite')); setAiAnchorEl(null); }}>Rewrite Professionally</MenuItem>
                <MenuItem onClick={() => { setComposerText((current) => replaceTemplateVariables(applyAiAction(current, 'invite'), candidateContext)); setAiAnchorEl(null); }}>Generate Interview Invitation</MenuItem>
                <MenuItem onClick={() => { setComposerText((current) => replaceTemplateVariables(applyAiAction(current, 'reject'), candidateContext)); setAiAnchorEl(null); }}>Generate Rejection Email</MenuItem>
                <MenuItem onClick={() => { setComposerText((current) => replaceTemplateVariables(applyAiAction(current, 'offer'), candidateContext)); setAiAnchorEl(null); }}>Generate Offer Email</MenuItem>
              </Menu>

              <Menu
                anchorEl={conversationMenuAnchor}
                open={Boolean(conversationMenuAnchor)}
                onClose={() => {
                  setConversationMenuAnchor(null);
                  setConversationMenuId('');
                }}
              >
                <MenuItem onClick={async () => {
                  const row = conversations.find((item) => item.id === conversationMenuId);
                  if (row) await handleConversationAction('archive', row);
                  setConversationMenuAnchor(null);
                }}><ArchiveIcon fontSize="small" sx={{ mr: 1 }} />Archive</MenuItem>
                <MenuItem onClick={async () => {
                  const row = conversations.find((item) => item.id === conversationMenuId);
                  if (row) await handleConversationAction('mute', row);
                  setConversationMenuAnchor(null);
                }}><VolumeOffIcon fontSize="small" sx={{ mr: 1 }} />Mute</MenuItem>
                <MenuItem onClick={async () => {
                  const row = conversations.find((item) => item.id === conversationMenuId);
                  if (row) await handleConversationAction('mark_read', row);
                  setConversationMenuAnchor(null);
                }}><MarkEmailReadIcon fontSize="small" sx={{ mr: 1 }} />Mark Read</MenuItem>
                <MenuItem onClick={async () => {
                  const row = conversations.find((item) => item.id === conversationMenuId);
                  if (row) await handleConversationAction('mark_unread', row);
                  setConversationMenuAnchor(null);
                }}><MarkEmailUnreadIcon fontSize="small" sx={{ mr: 1 }} />Mark Unread</MenuItem>
                <MenuItem onClick={async () => {
                  const row = conversations.find((item) => item.id === conversationMenuId);
                  if (row) await handleConversationAction('block', row);
                  setConversationMenuAnchor(null);
                }}><BlockIcon fontSize="small" sx={{ mr: 1 }} />Block Candidate</MenuItem>
                <MenuItem onClick={async () => {
                  const row = conversations.find((item) => item.id === conversationMenuId);
                  if (row) await handleConversationAction('delete', row);
                  setConversationMenuAnchor(null);
                }}><DeleteIcon fontSize="small" sx={{ mr: 1 }} />Delete</MenuItem>
              </Menu>
            </>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: 1.5 }}>
              <MailIcon sx={{ fontSize: 56, opacity: 0.25 }} />
              <Typography variant="body1" sx={{ fontWeight: 600 }}>No conversation selected</Typography>
              <Typography variant="body2">Select a conversation from the inbox to start messaging</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );

  const renderTemplates = () => (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Message Templates</Typography>
          <Button variant="contained" onClick={() => {
            setEditingTemplate(null);
            setTemplateForm({ title: '', category: 'Custom Template', body: '' });
            setTemplateDialogOpen(true);
          }}>
            Create Template
          </Button>
        </Box>

        <Grid container spacing={1.25}>
          {templates.map((template) => (
            <Grid item xs={12} md={6} key={template.id}>
              <Card variant="outlined" sx={{ borderRadius: 1.5 }}>
                <CardContent>
                  <Stack spacing={0.75}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{template.title}</Typography>
                      <Chip size="small" label={template.category} />
                    </Stack>
                    <Typography variant="body2" sx={{ color: themeColors.text.secondary, whiteSpace: 'pre-wrap' }}>
                      {template.body}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="outlined" onClick={() => {
                        setEditingTemplate(template);
                        setTemplateForm({ title: template.title, category: template.category, body: template.body });
                        setTemplateDialogOpen(true);
                      }}>Edit</Button>
                      <Button size="small" variant="outlined" color="error" onClick={() => {
                        const next = templates.filter((item) => item.id !== template.id);
                        saveTemplates(next);
                      }}>Delete</Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderAnalytics = () => (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Messaging Analytics</Typography>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Window</InputLabel>
            <Select value={analyticsWindow} label="Window" onChange={(event) => setAnalyticsWindow(event.target.value as AnalyticsWindow)}>
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {analyticsLoading && <LinearProgress sx={{ mb: 1 }} />}

        <Grid container spacing={1.25}>
          {[
            { label: 'Messages Sent', value: analytics.sent },
            { label: 'Replies', value: analytics.replies },
            { label: 'Response Rate', value: `${analytics.responseRate}%` },
            { label: 'Avg Response Time', value: `${analytics.avgResponseMinutes} min` },
            { label: 'Unread', value: analytics.unread },
            { label: 'Offer Acceptance Rate', value: `${analytics.offerAcceptanceRate}%` },
          ].map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.label}>
              <Card variant="outlined" sx={{ borderRadius: 1.5 }}>
                <CardContent>
                  <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>{item.label}</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>{item.value}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Messages</Typography>
          <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
            Messaging and communication center integrated with applicants, ATS, interviews, offers, recommended candidates, and talent pool.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<NotificationsActiveIcon />} onClick={requestDesktopNotifications}>
            Desktop Alerts
          </Button>
          <Button variant="contained" startIcon={<MailIcon />} onClick={() => setViewTab('center')}>
            Open Conversations
          </Button>
        </Stack>
      </Box>

      <Tabs value={viewTab} onChange={(_, value) => setViewTab(value)} sx={{ mb: 1.5 }}>
        <Tab value="dashboard" label="Dashboard" />
        <Tab value="center" label="Conversation Center" />
        <Tab value="templates" label="Templates" />
        <Tab value="analytics" label="Analytics" />
      </Tabs>

      {viewTab === 'dashboard' && renderDashboard()}
      {viewTab === 'center' && renderCenter()}
      {viewTab === 'templates' && renderTemplates()}
      {viewTab === 'analytics' && renderAnalytics()}

      <Dialog
        open={chatWindowOpen}
        onClose={() => setChatWindowOpen(false)}
        fullWidth
        maxWidth="lg"
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Chat Window
            </Typography>
            <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
              {selectedConversation?.participantName || draftTarget?.candidateName || 'Candidate'}
            </Typography>
          </Box>
          <Button variant="outlined" onClick={() => setChatWindowOpen(false)}>Close</Button>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: isMobile ? 'calc(100vh - 150px)' : '75vh' }}>
            <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${themeColors.border}`, bgcolor: '#FCFCFF' }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Avatar src={selectedConversation?.participantAvatar}>{(selectedConversation?.participantName || 'C').charAt(0).toUpperCase()}</Avatar>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{selectedConversation?.participantName || draftTarget?.candidateName}</Typography>
                {candidateContext?.jobTitle && <Chip size="small" icon={<WorkIcon fontSize="small" />} label={candidateContext.jobTitle} />}
                {candidateContext?.atsStage && <Chip size="small" label={candidateContext.atsStage} />}
                {candidateContext?.matchScore !== undefined && <Chip size="small" label={`Match ${candidateContext.matchScore}%`} />}
              </Stack>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#FAFAFC' }}>
              {selectedMessages.length === 0 && (
                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>No messages yet.</Typography>
              )}
              {selectedMessages.map((message, idx) => renderMessageRow(message, idx > 0 ? selectedMessages[idx - 1] : null))}
              {typing && (
                <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                  Typing indicator: composing message...
                </Typography>
              )}
              <div ref={messagesEndRef} />
            </Box>

            <Box sx={{ p: 2, borderTop: `1px solid ${themeColors.border}` }}>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap">
                <Button variant="outlined" onClick={(event) => setEmojiAnchorEl(event.currentTarget)}>Emoji</Button>
                <Button variant="outlined" startIcon={<AutoFixHighIcon />} onClick={(event) => setAiAnchorEl(event.currentTarget)}>AI Tools</Button>
                <Tooltip title={`Allowed: ${ALLOWED_EXTENSIONS.join(', ').toUpperCase()} | Max ${MAX_FILE_MB}MB`}>
                  <Button variant="outlined" startIcon={<FileUploadIcon />} onClick={() => fileInputRef.current?.click()} disabled={!selectedConversation || uploading}>Attach</Button>
                </Tooltip>
              </Stack>

              {composerAttachments.length > 0 && (
                <Stack direction="row" spacing={0.5} sx={{ mb: 1, flexWrap: 'wrap' }}>
                  {composerAttachments.map((url, idx) => (
                    <Chip
                      key={`chat-window-${url}-${idx}`}
                      icon={<FolderZipIcon fontSize="small" />}
                      label={url.split('/').pop() || `Attachment ${idx + 1}`}
                      onDelete={() => setComposerAttachments((current) => current.filter((_, i) => i !== idx))}
                      size="small"
                    />
                  ))}
                </Stack>
              )}

              <TextField
                fullWidth
                multiline
                minRows={3}
                maxRows={8}
                placeholder="Type your message here..."
                value={composerText}
                onChange={(event) => {
                  setComposerText(event.target.value);
                  setTyping(event.target.value.trim().length > 0);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                  Attachments: PDF, DOC, DOCX, Images, ZIP up to {MAX_FILE_MB}MB
                </Typography>
                <Button
                  variant="contained"
                  endIcon={<SendIcon />}
                  disabled={(!composerText.trim() && composerAttachments.length === 0) || uploading}
                  onClick={() => void sendMessage()}
                >
                  Send Message
                </Button>
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.25}>
            <TextField label="Template Title" size="small" value={templateForm.title} onChange={(event) => setTemplateForm((current) => ({ ...current, title: event.target.value }))} />
            <FormControl size="small">
              <InputLabel>Category</InputLabel>
              <Select value={templateForm.category} label="Category" onChange={(event) => setTemplateForm((current) => ({ ...current, category: event.target.value as TemplateCategory }))}>
                {[
                  'Application Received',
                  'Under Review',
                  'Interview Invitation',
                  'Interview Reminder',
                  'Interview Reschedule',
                  'Interview Feedback Request',
                  'Offer Letter',
                  'Offer Accepted',
                  'Offer Rejected',
                  'Application Rejected',
                  'Custom Template',
                ].map((category) => <MenuItem key={category} value={category}>{category}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Body" multiline minRows={5} value={templateForm.body} onChange={(event) => setTemplateForm((current) => ({ ...current, body: event.target.value }))} helperText="Use placeholders like {candidateName}, {jobTitle}, {date}, {time}, {meetingLink}." />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => {
            if (!templateForm.title.trim() || !templateForm.body.trim()) {
              toast.error('Template title and body are required');
              return;
            }
            const nowIso = new Date().toISOString();
            if (editingTemplate) {
              const next = templates.map((item) => item.id === editingTemplate.id
                ? {
                    ...item,
                    title: templateForm.title.trim(),
                    category: templateForm.category,
                    body: templateForm.body,
                    updatedAt: nowIso,
                  }
                : item);
              saveTemplates(next);
              toast.success('Template updated');
            } else {
              const next = [{
                id: makeId('template'),
                title: templateForm.title.trim(),
                category: templateForm.category,
                body: templateForm.body,
                createdAt: nowIso,
                updatedAt: nowIso,
              }, ...templates];
              saveTemplates(next);
              toast.success('Template created');
            }
            setTemplateDialogOpen(false);
          }}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={offerDialogOpen} onClose={() => setOfferDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Send Offer</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.25}>
            <TextField label="Salary" size="small" value={offerForm.salary} onChange={(event) => setOfferForm((current) => ({ ...current, salary: event.target.value }))} />
            <TextField type="date" InputLabelProps={{ shrink: true }} label="Joining Date" size="small" value={offerForm.joiningDate} onChange={(event) => setOfferForm((current) => ({ ...current, joiningDate: event.target.value }))} />
            <TextField label="Offer Letter PDF URL" size="small" value={offerForm.offerLetterUrl} onChange={(event) => setOfferForm((current) => ({ ...current, offerLetterUrl: event.target.value }))} helperText="Candidate can reply ACCEPT or REJECT to this message." />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOfferDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => void sendOfferMessage()}>Send Offer Message</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bulkPoolOpen} onClose={() => setBulkPoolOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Bulk Message Talent Pool</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.25}>
            <FormControl size="small" fullWidth>
              <InputLabel>Talent Pool</InputLabel>
              <Select value={selectedPoolId} label="Talent Pool" onChange={(event) => setSelectedPoolId(event.target.value)}>
                {talentPools.map((pool) => <MenuItem key={pool.id} value={pool.id}>{pool.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField multiline minRows={4} label="Message" value={poolMessage} onChange={(event) => setPoolMessage(event.target.value)} helperText="Use placeholders such as {candidateName} and {jobTitle}." />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkPoolOpen(false)}>Cancel</Button>
          <Button onClick={() => void sendTalentPoolBulkMessage()}>Send Bulk Message</Button>
        </DialogActions>
      </Dialog>
    </MotionBox>
  );
};

export default RecruiterMessagingCenter;
