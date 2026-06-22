import { supabase } from './supabase';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  attachments?: string[];
  createdAt: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  participantRole: 'recruiter' | 'candidate';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isInitiatedByRecruiter: boolean;
}

export const messagingService = {
  // Send message (only recruiter can initiate, candidate can only reply)
  async sendMessage(
    senderId: string,
    receiverId: string,
    content: string,
    attachments?: string[],
    userRole?: 'recruiter' | 'candidate'
  ) {
    try {
      let conversation = await this.getConversation(senderId, receiverId);

      if (!conversation) {
        if (userRole !== 'recruiter') {
          throw new Error('Only recruiters can initiate conversations');
        }

        const recruiterId = senderId;
        const candidateId = receiverId;
        console.log('No conversation found. Creating new conversation', {
          recruiterId,
          candidateId,
        });

        const { data, error } = await supabase
          .from('conversations')
          .insert([
            {
              recruiter_id: recruiterId,
              candidate_id: candidateId,
              initiated_by_recruiter: true,
            },
          ])
          .select('id')
          .single();

        if (error) {
          const sqlError = error as any;
          if (sqlError?.code === '23505' || sqlError?.details?.includes('duplicate key value')) {
            console.warn('Conversation already exists after insert race, refetching existing conversation');
            conversation = await this.getConversation(senderId, receiverId);
          } else {
            throw error;
          }
        } else {
          conversation = data;
          console.log('Conversation created', conversation.id);
        }
      } else {
        console.log('Conversation found', conversation.id);
      }

      if (!conversation?.id) {
        throw new Error('Unable to resolve conversation id');
      }

      console.log('Inserting message with conversation_id', conversation.id);
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: conversation.id,
            sender_id: senderId,
            receiver_id: receiverId,
            content,
            attachments: attachments || [],
            is_read: false,
          },
        ])
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  },

  // Get conversation between two users
  async getConversation(userId1: string, userId2: string) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('id')
        .or(
          `and(recruiter_id.eq.${userId1},candidate_id.eq.${userId2}),and(recruiter_id.eq.${userId2},candidate_id.eq.${userId1})`
        )
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Get conversation error:', error);
      return null;
    }
  },

  // Get all conversations for user
  async getConversations(userId: string) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(
          `
          id,
          recruiter_id,
          candidate_id,
          initiated_by_recruiter,
          created_at,
          messages(id, content, created_at, is_read, sender_id)
        `
        )
        .or(`recruiter_id.eq.${userId},candidate_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to get participant info
      const conversations = await Promise.all(
        data.map(async (conv: any) => {
          const isRecruiter = conv.recruiter_id === userId;
          const participantId = isRecruiter ? conv.candidate_id : conv.recruiter_id;
          const participantRole = isRecruiter ? 'candidate' : 'recruiter';

          // Get participant details - profiles table uses `id` and `name` fields
          let participantName = 'Unknown';
          let participantAvatar: string | undefined;

          if (participantRole === 'candidate') {
            const { data: participantData } = await supabase
              .from('profiles')
              .select('id, name, full_name, avatar_url, user_id')
              .or(`id.eq.${participantId},user_id.eq.${participantId}`)
              .maybeSingle();

            participantName = (participantData && (participantData.name || participantData.full_name)) || 'Candidate';
            participantAvatar = participantData?.avatar_url;
          } else {
            const { data: recruiterData } = await supabase
              .from('recruiters')
              .select('id, company_name, company_logo_url, user_id')
              .or(`id.eq.${participantId},user_id.eq.${participantId}`)
              .maybeSingle();

            participantName = (recruiterData && (recruiterData.company_name || 'Recruiter')) || 'Recruiter';
            participantAvatar = recruiterData?.company_logo_url || undefined;

            if (!participantAvatar) {
              const { data: fallbackProfile } = await supabase
                .from('profiles')
                .select('avatar_url')
                .or(`id.eq.${participantId},user_id.eq.${participantId}`)
                .maybeSingle();
              participantAvatar = fallbackProfile?.avatar_url || undefined;
            }
          }

          if (!participantAvatar && participantRole === 'candidate') {
            const { data: fallbackProfile } = await supabase
              .from('profiles')
              .select('avatar_url')
              .or(`id.eq.${participantId},user_id.eq.${participantId}`)
              .maybeSingle();
            participantAvatar = fallbackProfile?.avatar_url || undefined;
          }

          // Determine the latest message from the embedded messages array
          const msgs = Array.isArray(conv.messages) ? conv.messages.slice() : [];
          msgs.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;

          const unreadCount = (msgs.filter(
            (m: any) => !m.is_read && m.sender_id !== userId
          ).length) || 0;

          const lastMessageTime = lastMsg?.created_at || conv.created_at || new Date().toISOString();

          return {
            id: conv.id,
            participantId,
            participantName,
            participantAvatar,
            participantRole,
            lastMessage: lastMsg?.content || '',
            lastMessageTime,
            unreadCount,
            isInitiatedByRecruiter: conv.initiated_by_recruiter,
          };
        })
      );

      return conversations;
    } catch (error) {
      console.error('Get conversations error:', error);
      throw error;
    }
  },

  // Get messages in conversation
  async getMessages(conversationId: string, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      // Normalize message fields to camelCase for UI consumption
      return (data || []).map((m: any) => ({
        id: m.id,
        senderId: m.sender_id,
        receiverId: m.receiver_id,
        content: m.content,
        attachments: m.attachments || [],
        createdAt: m.created_at,
        isRead: !!m.is_read,
      }));
    } catch (error) {
      console.error('Get messages error:', error);
      throw error;
    }
  },

  // Mark message as read
  async markAsRead(messageId: string) {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  },

  // Delete message
  async deleteMessage(messageId: string) {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Delete message error:', error);
      throw error;
    }
  },

  async deleteConversation(conversationId: string) {
    try {
      const { error: deleteMessagesError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);
      if (deleteMessagesError) throw deleteMessagesError;

      const { error: deleteConversationError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);
      if (deleteConversationError) throw deleteConversationError;
    } catch (error) {
      console.error('Delete conversation error:', error);
      throw error;
    }
  },

  async deleteAllConversations(userId: string) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('id')
        .or(`recruiter_id.eq.${userId},candidate_id.eq.${userId}`);
      if (error) throw error;

      const conversationIds = (data || []).map((conv: any) => conv.id).filter(Boolean);
      if (conversationIds.length === 0) return;

      const { error: deleteMessagesError } = await supabase
        .from('messages')
        .delete()
        .in('conversation_id', conversationIds);
      if (deleteMessagesError) throw deleteMessagesError;

      const { error: deleteConversationError } = await supabase
        .from('conversations')
        .delete()
        .in('id', conversationIds);
      if (deleteConversationError) throw deleteConversationError;
    } catch (error) {
      console.error('Delete all conversations error:', error);
      throw error;
    }
  },

  // Subscribe to real-time messages
  subscribeToMessages(conversationId: string, callback: (message: Message) => void) {
    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const m = payload.new as any;
          const normalized: Message = {
            id: m.id,
            senderId: m.sender_id,
            receiverId: m.receiver_id,
            content: m.content,
            attachments: m.attachments || [],
            createdAt: m.created_at,
            isRead: !!m.is_read,
          };
          callback(normalized);
        }
      )
      .subscribe();

    return subscription;
  },

  // Upload file attachment
  async uploadAttachment(file: File, conversationId: string) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `messages/${conversationId}/${fileName}`;

      const { error } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: publicData } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      return publicData.publicUrl;
    } catch (error) {
      console.error('Upload attachment error:', error);
      throw error;
    }
  },

  // Delete attachment
  async deleteAttachment(url: string) {
    try {
      const path = url.split('/').pop();
      if (path) {
        const { error } = await supabase.storage
          .from('attachments')
          .remove([`messages/${path}`]);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Delete attachment error:', error);
    }
  },
};
