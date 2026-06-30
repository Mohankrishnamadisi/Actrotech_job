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

const notifyAdminsForNewTicket = async (ticket: SupportTicket) => {
  const { data: admins, error: adminError } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin');

  if (adminError) throw adminError;

  const adminIds = (admins || [])
    .map((admin: { id?: string | null }) => String(admin.id || '').trim())
    .filter(Boolean);

  if (adminIds.length === 0) return;

  const roleLabel = String(ticket.role || 'user').replace(/_/g, ' ');
  const title = `New Support Ticket: ${ticket.subject || 'Untitled'}`;
  const message = `${ticket.name || 'A user'} (${roleLabel}) raised a ${ticket.priority || 'medium'} priority ticket.`;

  const payload = adminIds.map((adminId) => ({
    user_id: adminId,
    type: 'support_ticket_created',
    title,
    message,
    data: {
      ticket_id: ticket.id,
      ticket_subject: ticket.subject,
      ticket_category: ticket.category,
      ticket_priority: ticket.priority,
      raised_by_user_id: ticket.user_id || null,
      raised_by_role: ticket.role || null,
    },
    read: false,
  }));

  const { error: notificationError } = await supabase
    .from('notifications')
    .insert(payload);

  if (notificationError) throw notificationError;
};

export const markTicketsSeen = async (ids: string[], userId?: string) => {
  if (!userId || ids.length === 0) return;
  const payload = ids.map((ticketId) => ({ ticket_id: ticketId, user_id: userId }));
  const { error } = await supabase.from('support_ticket_reads').upsert(payload, { onConflict: 'ticket_id,user_id' });
  if (error) throw error;
};

const getSeenIds = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('support_ticket_reads')
    .select('ticket_id')
    .eq('user_id', userId);

  if (error) throw error;
  return (data || []).map((row: any) => String(row.ticket_id));
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

    if (error) throw error;

    const createdTicket = (data?.[0] || null) as SupportTicket;

    if (createdTicket?.id) {
      try {
        await notifyAdminsForNewTicket(createdTicket);
      } catch (notificationError) {
        console.warn('Ticket created, but failed to notify admins:', notificationError);
      }
    }

    return createdTicket;
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

    if (error) throw error;
    return (data || []) as SupportTicket[];
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

    if (error) throw error;
    return (data?.[0] || null) as SupportTicket | null;
  },

  async getUnseenAdminResponseCount(userId: string): Promise<number> {
    try {
      const tickets = await this.getTickets(userId, 'user');
      const seenIds = await getSeenIds(userId);
      return tickets.filter(
        (t) => t.admin_note && t.admin_note.trim() && !seenIds.includes(t.id),
      ).length;
    } catch {
      return 0;
    }
  },
};

export default supportService;
