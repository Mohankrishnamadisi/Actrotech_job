import React, { useState, useEffect, useRef } from 'react';
import Swal from '@utils/sweetAlert';
import { motion } from 'framer-motion';
import {
  Avatar,
  Box,
  IconButton,
  Typography,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { messagingService, Message, Conversation } from '@services/messaging';
import ComposeMessage from './ComposeMessage';
import { DeleteActionButton } from '@components/common/DeleteActionButton';

interface MessageDetailProps {
  conversation: Conversation;
  userId: string;
  userRole: 'recruiter' | 'candidate';
  onBack: () => void;
}

const formatMessageTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'rgba(255,255,255,0.72)' }}>
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: '1px solid rgba(148, 163, 184, 0.18)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.88), rgba(239,246,255,0.72))',
        }}
      >
        <IconButton
          onClick={onBack}
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(59,130,246,0.08)',
            color: '#1d4ed8',
            '&:hover': { background: 'rgba(59,130,246,0.12)' },
          }}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>

        <Avatar
          src={conversation.participantAvatar || undefined}
          alt={conversation.participantName}
          sx={{
            width: 42,
            height: 42,
            bgcolor: conversation.participantAvatar ? 'transparent' : 'linear-gradient(135deg, #2563eb, #7c3aed)',
            border: '1px solid rgba(148,163,184,0.2)',
            fontWeight: 700,
          }}
        >
          {!conversation.participantAvatar && (conversation.participantName || 'U').slice(0, 2).toUpperCase()}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
            {conversation.participantName}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {conversation.participantRole}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 2,
          py: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          background: 'linear-gradient(180deg, rgba(248,250,252,0.6), rgba(255,255,255,0.7))',
        }}
      >
        {loading && <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>Loading messages...</Typography>}

        {messages.map((msg) => {
          const isOutgoing = msg.senderId === userId;

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                alignSelf: isOutgoing ? 'flex-end' : 'flex-start',
                maxWidth: '72%',
              }}
            >
              <Box
                sx={{
                  p: '12px 14px',
                  borderRadius: isOutgoing ? '18px 18px 6px 18px' : '18px 18px 18px 6px',
                  background: isOutgoing
                    ? 'linear-gradient(135deg, #2563eb, #4f46e5)'
                    : '#f8fafc',
                  color: isOutgoing ? '#fff' : '#0f172a',
                  boxShadow: '0 8px 18px rgba(15, 23, 42, 0.06)',
                  border: isOutgoing ? 'none' : '1px solid rgba(148, 163, 184, 0.12)',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                }}
              >
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1, fontSize: 14, lineHeight: 1.6 }}>{msg.content}</Box>
                  {isOutgoing && (
                    <Box sx={{ mt: 0.25, opacity: 0.8 }}>
                      <DeleteActionButton
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
                        ariaLabel="delete message"
                      />
                    </Box>
                  )}
                </Box>

                {msg.attachments && msg.attachments.length > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {msg.attachments.map((attach, idx) => (
                      <a
                        key={idx}
                        href={attach}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 12,
                          textDecoration: 'underline',
                          color: isOutgoing ? '#e0e7ff' : '#2563eb',
                        }}
                      >
                        📎 Attachment {idx + 1}
                      </a>
                    ))}
                  </Box>
                )}

                <Box
                  sx={{
                    mt: 0.75,
                    fontSize: 11,
                    opacity: 0.75,
                    textAlign: 'right',
                  }}
                >
                  {formatMessageTime(msg.createdAt)}
                </Box>
              </Box>
            </motion.div>
          );
        })}

        <div ref={messagesEndRef} />
      </Box>

      <Box sx={{ borderTop: '1px solid rgba(148, 163, 184, 0.18)', p: 2, background: 'rgba(248,250,252,0.9)' }}>
        <ComposeMessage conversationId={conversation.id} onSend={handleSendMessage} />
      </Box>
    </Box>
  );
};

export default MessageDetail;
