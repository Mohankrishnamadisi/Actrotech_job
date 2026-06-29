import React, { useState, useEffect, useRef } from 'react';
import Swal from '@utils/sweetAlert';
import { motion } from 'framer-motion';
import { messagingService, Message, Conversation } from '@services/messaging';
import ComposeMessage from './ComposeMessage';
import { IconButton } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

interface MessageDetailProps {
  conversation: Conversation;
  userId: string;
  userRole: 'recruiter' | 'candidate';
  onBack: () => void;
}

export const MessageDetail: React.FC<MessageDetailProps> = ({
  conversation,
  userId,
  userRole,
  onBack,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    const subscription = messagingService.subscribeToMessages(conversation.id, (newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
      if (newMsg.receiverId === userId) {
        messagingService.markAsRead(newMsg.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [conversation.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const msgs = await messagingService.getMessages(conversation.id);
      setMessages(msgs);

      // Mark all as read
      msgs.forEach((msg) => {
        if (msg.receiverId === userId && !msg.isRead) {
          messagingService.markAsRead(msg.id);
        }
      });
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content: string, attachments?: string[]) => {
    try {
      await messagingService.sendMessage(userId, conversation.participantId, content, attachments, userRole);
      loadMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid rgba(15,23,42,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'rgba(79,70,229,0.1)',
            border: 'none',
            borderRadius: 8,
            padding: 8,
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          ←
        </button>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: conversation.participantAvatar
              ? `url(${conversation.participantAvatar}) center/cover`
              : 'linear-gradient(135deg,#4F46E5,#7C3AED)',
          }}
        />
        <div>
          <div style={{ fontWeight: 700 }}>{conversation.participantName}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            {conversation.participantRole}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {loading && <div>Loading messages...</div>}

        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              alignSelf: msg.senderId === userId ? 'flex-end' : 'flex-start',
              maxWidth: '70%',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                background:
                  msg.senderId === userId
                    ? 'linear-gradient(135deg,#4F46E5,#7C3AED)'
                    : 'rgba(15,23,42,0.05)',
                color: msg.senderId === userId ? '#fff' : 'var(--color-dark)',
                wordBreak: 'break-word',
              }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>{msg.content}</div>
                {msg.senderId === userId && (
                  <IconButton
                    size="small"
                    onClick={async () => {
                      const result = await Swal.fire({
                        title: 'Delete this message?',
                        text: 'This message will be removed permanently.',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Delete',
                        cancelButtonText: 'Cancel',
                        confirmButtonColor: '#d33',
                      });
                      if (!result.isConfirmed) return;
                      try {
                        await messagingService.deleteMessage(msg.id);
                        setMessages((prev) => prev.filter((m) => m.id !== msg.id));
                      } catch (err) {
                        console.error('Failed to delete message:', err);
                        Swal.fire({
                          title: 'Failed to delete',
                          text: 'Unable to remove the message. Please try again.',
                          icon: 'error',
                        });
                      }
                    }}
                    aria-label="delete message"
                    sx={{ color: msg.senderId === userId ? '#fff' : 'inherit' }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </div>
              {msg.attachments && msg.attachments.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {msg.attachments.map((attach, idx) => (
                    <a
                      key={idx}
                      href={attach}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 12,
                        textDecoration: 'underline',
                        color: msg.senderId === userId ? '#fff' : 'var(--color-primary)',
                      }}
                    >
                      📎 Attachment {idx + 1}
                    </a>
                  ))}
                </div>
              )}
              <div
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  opacity: 0.7,
                }}
              >
                {new Date(msg.createdAt).toLocaleTimeString()}
              </div>
            </div>
          </motion.div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Compose */}
      <div style={{ borderTop: '1px solid rgba(15,23,42,0.06)', padding: '16px' }}>
        <ComposeMessage conversationId={conversation.id} onSend={handleSendMessage} />
      </div>
    </div>
  );
};

export default MessageDetail;
