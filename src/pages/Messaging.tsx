import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { IconButton } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@store/index';
import { USER_ROLES } from '@constants/index';
import MessageInbox from '@components/messaging/MessageInbox';
import MessageDetail from '@components/messaging/MessageDetail';
import { Conversation } from '@services/messaging';

const MessagingPageContent: React.FC<{
  userId: string;
  userRole: 'recruiter' | 'candidate';
}> = ({ userId, userRole }) => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', height: '100vh', gap: 0, background: 'var(--color-page)' }}>
      {/* Sidebar - Inbox */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        style={{
          width: selectedConversation ? '0' : '360px',
          overflowY: 'auto',
          borderRight: '1px solid rgba(15,23,42,0.06)',
          background: '#fff',
          transition: 'width 0.3s ease',
        }}
      >
        {!selectedConversation && (
          <div>
            <div style={{ padding: 8, borderBottom: '1px solid rgba(15,23,42,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconButton size="small" onClick={() => navigate(-1)} aria-label="back" sx={{ marginLeft: 0 }}>
                <ArrowBackIcon />
              </IconButton>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Messages</h2>
            </div>
            <div style={{ padding: 12 }}>
              <MessageInbox userId={userId} userRole={userRole} onSelectConversation={setSelectedConversation} />
            </div>
          </div>
        )}
      </motion.div>

      {/* Main - Conversation Detail */}
      {selectedConversation && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: '#fff',
          }}
        >
          <MessageDetail
            conversation={selectedConversation}
            userId={userId}
            userRole={userRole}
            onBack={() => setSelectedConversation(null)}
          />
        </motion.div>
      )}

      {/* Empty state */}
      {!selectedConversation && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-secondary)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>💬</div>
            <div>Select a conversation to start chatting</div>
          </div>
        </div>
      )}
    </div>
  );
};

export const MessagingPage: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) {
    return <div>Redirecting to login...</div>;
  }

  const userRole = user.role === USER_ROLES.RECRUITER ? 'recruiter' : 'candidate';

  return <MessagingPageContent userId={user.id} userRole={userRole} />;
};

export default MessagingPage;
