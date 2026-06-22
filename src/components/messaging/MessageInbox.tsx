import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button, IconButton } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import Swal from 'sweetalert2';
import { messagingService, Conversation } from '@services/messaging';
import { userService } from '@services/api';

interface MessageInboxProps {
  userId: string;
  userRole: 'recruiter' | 'candidate';
  onSelectConversation: (conv: Conversation) => void;
}

export const MessageInbox: React.FC<MessageInboxProps> = ({
  userId,
  userRole,
  onSelectConversation,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const convs = await messagingService.getConversations(userId);
      // Ensure we have participant names; if missing, try fetching profile as a fallback
      const normalized: Conversation[] = (convs || []).map((c: any) => ({
        id: c.id,
        participantId: c.participantId,
        participantName: c.participantName || 'Unknown',
        participantAvatar: c.participantAvatar,
        participantRole: c.participantRole,
        lastMessage: c.lastMessage,
        lastMessageTime: c.lastMessageTime,
        unreadCount: c.unreadCount || 0,
        isInitiatedByRecruiter: c.isInitiatedByRecruiter || c.initiated_by_recruiter || false,
      }));

      // Fetch missing names in parallel
      await Promise.all(
        normalized.map(async (c) => {
          const needsFallbackName = !c.participantName || c.participantName === 'Candidate' || c.participantName === 'Recruiter' || c.participantName === 'Unknown';
          if (needsFallbackName && c.participantId) {
            try {
              const profile = await userService.getProfile(c.participantId);
              const fallbackName = profile && (profile.name || profile.full_name);
              if (fallbackName) {
                c.participantName = fallbackName;
              }
              c.participantAvatar = c.participantAvatar || profile?.avatar_url || profile?.avatarUrl || profile?.avatar || null;
            } catch (e) {
              // ignore and keep existing fallback label
            }
          }
        })
      );

      setConversations(normalized as Conversation[]);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        Loading conversations...
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        <div style={{ marginBottom: 12 }}>No conversations yet</div>
        {userRole === 'recruiter' && (
          <div style={{ fontSize: 13 }}>Start messaging candidates to build relationships</div>
        )}
        {userRole === 'candidate' && (
          <div style={{ fontSize: 13 }}>Wait for recruiters to message you</div>
        )}
      </div>
    );
  }

  const handleDeleteConversation = async (conversationId: string) => {
    const result = await Swal.fire({
      title: 'Delete this conversation?',
      text: 'This will remove the entire chat history.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33',
    });

    if (!result.isConfirmed) return;

    try {
      await messagingService.deleteConversation(conversationId);
      setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      Swal.fire({
        title: 'Failed to delete',
        text: 'Unable to delete the conversation. Please try again.',
        icon: 'error',
      });
    }
  };

  const handleDeleteAll = async () => {
    const result = await Swal.fire({
      title: 'Delete all conversations?',
      text: 'This cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete all',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33',
    });

    if (!result.isConfirmed) return;

    try {
      await messagingService.deleteAllConversations(userId);
      setConversations([]);
      Swal.fire({
        title: 'All conversations deleted',
        icon: 'success',
      });
    } catch (err) {
      console.error('Failed to delete all conversations:', err);
      Swal.fire({
        title: 'Failed to delete',
        text: 'Unable to delete all conversations. Please try again.',
        icon: 'error',
      });
    }
  };

  return (
    <div>
      <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(15,23,42,0.08)', marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Messages</div>
        <Button size="small" variant="outlined" onClick={handleDeleteAll}>
          Delete all
        </Button>
      </div>
      {conversations.map((conv, idx) => (
        <motion.div
          key={conv.id}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05 }}
          onClick={() => onSelectConversation(conv)}
          style={{
            padding: 14,
            marginBottom: 8,
            borderRadius: 12,
            border: '1px solid rgba(15,23,42,0.06)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.background = 'rgba(79,70,229,0.04)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.background = 'transparent';
          }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: conv.participantAvatar
                  ? `url(${conv.participantAvatar}) center/cover`
                  : 'linear-gradient(135deg,#4F46E5,#7C3AED)',
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 4 }}>
                <div style={{ fontWeight: 700, color: 'var(--color-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.participantName || 'Unknown'}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  {(() => {
                    const dt = new Date(conv.lastMessageTime);
                    return Number.isNaN(dt.getTime()) ? '' : dt.toLocaleString();
                  })()}
                </div>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--color-text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {conv.lastMessage}
              </div>
            </div>
            {conv.unreadCount > 0 && (
              <div
                style={{
                  minWidth: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {conv.unreadCount}
              </div>
            )}
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteConversation(conv.id);
              }}
              aria-label="delete conversation"
              sx={{ marginLeft: 8 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default MessageInbox;
