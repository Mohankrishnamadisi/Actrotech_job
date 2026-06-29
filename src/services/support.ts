import { supabase } from './supabase';

type SupportRole = 'job_seeker' | 'recruiter' | 'admin' | 'guest';

export type SupportTicket = {
  id: string;
  user_id?: string;
  role?: SupportRole | string;
  name?: string;
  email?: string;
  category: string;
  priority: string;
  subject: string;
  message: string;
  status?: string;
  admin_note?: string;
  resolved_at?: string;
  created_at?: string;
};

const LOCAL_KEY = 'support_tickets_local';
const SEEN_KEY = 'support_seen_ticket_ids';

const getSeenIds = (): string[] => {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const markTicketsSeen = (ids: string[]) => {
  try {
    const existing = getSeenIds();
    const merged = Array.from(new Set([...existing, ...ids]));
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(merged));
  } catch {
    // noop
  }
};

const readLocalTickets = (): SupportTicket[] => {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocalTickets = (tickets: SupportTicket[]) => {
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(tickets));
  } catch {
    // noop
  }
};

export const supportService = {
  async createTicket(ticket: Omit<SupportTicket, 'id' | 'created_at' | 'status'>) {
    const payload = {
      ...ticket,
      status: 'open',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('support_tickets')
      .insert([payload])
      .select()
      .limit(1);

    if (!error && data && data[0]) {
      return data[0] as SupportTicket;
    }

    const fallbackTicket: SupportTicket = {
      ...payload,
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    };

    const existing = readLocalTickets();
    writeLocalTickets([fallbackTicket, ...existing]);
    return fallbackTicket;
  },

  async getTickets(userId?: string, role?: string) {
    const isAdmin = role === 'admin';

    const query = supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    const scopedQuery = isAdmin || !userId ? query : query.eq('user_id', userId);
    const { data, error } = await scopedQuery;

    if (!error && Array.isArray(data)) {
      return data as SupportTicket[];
    }

    const local = readLocalTickets();
    if (isAdmin || !userId) return local;
    return local.filter((ticket) => ticket.user_id === userId);
  },

  async updateTicket(ticketId: string, updates: Partial<SupportTicket>) {
    const payload = {
      ...updates,
      ...(updates.status === 'closed' ? { resolved_at: new Date().toISOString() } : {}),
    };

    const { data, error } = await supabase
      .from('support_tickets')
      .update(payload)
      .eq('id', ticketId)
      .select()
      .limit(1);

    if (!error && data && data[0]) {
      return data[0] as SupportTicket;
    }

    const existing = readLocalTickets();
    const next = existing.map((ticket) => (
      ticket.id === ticketId
        ? {
          ...ticket,
          ...payload,
        }
        : ticket
    ));
    writeLocalTickets(next);
    return next.find((ticket) => ticket.id === ticketId) || null;
  },

  async getUnseenAdminResponseCount(userId: string): Promise<number> {
    try {
      const tickets = await this.getTickets(userId, 'user');
      const seenIds = getSeenIds();
      return tickets.filter(
        (t) => t.admin_note && t.admin_note.trim() && !seenIds.includes(t.id),
      ).length;
    } catch {
      return 0;
    }
  },
};

export default supportService;
