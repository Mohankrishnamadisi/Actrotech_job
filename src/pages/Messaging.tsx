import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  useMediaQuery,
  useTheme,
  Box,
  Typography,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
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
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      open
      onClose={() => navigate(-1)}
      fullWidth
      maxWidth="md"
      fullScreen={isSmall}
      PaperProps={{
        sx: {
          borderRadius: isSmall ? 0 : 2,
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Messages</Typography>
        </Box>
        <IconButton aria-label="close" onClick={() => navigate(-1)} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: { xs: 1, sm: 2 }, background: 'var(--color-page)' }}>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Box sx={{ display: 'flex', gap: 2, height: isSmall ? '100%' : 560 }}>
            <Box sx={{ width: selectedConversation ? (isSmall ? '100%' : 320) : 320, flexShrink: 0, bgcolor: '#fff', borderRadius: 1, overflow: 'auto', border: '1px solid rgba(15,23,42,0.06)' }}>
              <Box sx={{ p: 1, borderBottom: '1px solid rgba(15,23,42,0.06)', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Inbox</Typography>
              </Box>
              <Box sx={{ p: 1 }}>
                <MessageInbox userId={userId} userRole={userRole} onSelectConversation={setSelectedConversation} />
              </Box>
            </Box>

            <Box sx={{ flex: 1, display: selectedConversation ? 'block' : 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {selectedConversation ? (
                <Box sx={{ width: '100%', bgcolor: '#fff', border: '1px solid rgba(15,23,42,0.06)', borderRadius: 1, overflow: 'hidden' }}>
                  <MessageDetail
                    conversation={selectedConversation}
                    userId={userId}
                    userRole={userRole}
                    onBack={() => setSelectedConversation(null)}
                  />
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', color: 'text.secondary', width: '100%' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
                  <Typography>Select a conversation to start chatting</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </motion.div>
      </DialogContent>
    </Dialog>
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
