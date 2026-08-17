import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Divider,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Whatshot as WhatshotIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '@services/supabase';

export interface JobMatchNotificationCardProps {
  notification: any;
  onDismiss?: (notificationId: string) => void;
  onMarkAsRead?: (notificationId: string) => void;
  compact?: boolean;
}

/**
 * JobMatchNotificationCard
 * 
 * Displays a job match notification with job details and CTA
 */
export const JobMatchNotificationCard: React.FC<JobMatchNotificationCardProps> = ({
  notification,
  onDismiss,
  onMarkAsRead,
  compact = false,
}) => {
  const navigate = useNavigate();
  const metadata = notification.notification_metadata || notification.data || {};

  const handleApplyClick = () => {
    if (metadata.jobId) {
      navigate(`/jobs/${metadata.jobId}`);
      onMarkAsRead?.(notification.id);
    }
  };

  const handleDismiss = async () => {
    try {
      await supabase.from('notifications').delete().eq('id', notification.id);
      onDismiss?.(notification.id);
      toast.success('Notification dismissed');
    } catch (error) {
      console.error('Error dismissing notification:', error);
      toast.error('Failed to dismiss notification');
    }
  };

  const handleMarkAsRead = async () => {
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', notification.id);
      onMarkAsRead?.(notification.id);
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Failed to update notification');
    }
  };

  const isPremium = metadata.isPremium;
  const matchedSkills = metadata.matchedSkills || [];
  const matchedTitles = metadata.matchedTitles || [];
  const matchType = metadata.matchType || 'skill';

  if (compact) {
    // Compact view for notification center
    return (
      <Card
        sx={{
          mb: 1,
          bgcolor: notification.read ? 'background.paper' : '#E0F2FE',
          border: `1px solid ${notification.read ? '#E5E7EB' : '#BAE6FD'}`,
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: 1,
          },
        }}
        onClick={() => {
          if (!notification.read) {
            handleMarkAsRead();
          }
          handleApplyClick();
        }}
      >
        <CardContent sx={{ pb: 1, pt: 2, '&:last-child': { pb: 1 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1, pr: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: isPremium ? '#DC2626' : '#2563EB',
                  mb: 0.5,
                }}
              >
                {notification.title}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                {notification.message}
              </Typography>
              {(matchedSkills.length > 0 || matchedTitles.length > 0) && (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                  {matchedSkills.map((skill) => (
                    <Chip key={skill} label={skill} size="small" variant="outlined" />
                  ))}
                  {matchedTitles.map((title) => (
                    <Chip key={title} label={title} size="small" variant="outlined" />
                  ))}
                </Box>
              )}
            </Box>
            <IconButton size="small" onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Full card view for dashboard
  return (
    <Card
      sx={{
        background: isPremium
          ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.05) 0%, rgba(220, 38, 38, 0.02) 100%)'
          : 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(37, 99, 235, 0.02) 100%)',
        border: `2px solid ${isPremium ? '#FCA5A5' : '#BFDBFE'}`,
        borderRadius: 2,
        mb: 2,
        overflow: 'hidden',
      }}
    >
      {isPremium && (
        <Alert
          severity="error"
          sx={{
            mb: 0,
            borderRadius: 0,
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            color: '#DC2626',
            '& .MuiAlert-icon': {
              color: '#DC2626',
            },
            fontSize: '0.875rem',
          }}
        >
          ⚡ Premium Early Access - Limited time opportunity!
        </Alert>
      )}

      <CardContent sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isPremium ? (
              <WhatshotIcon sx={{ color: '#DC2626', fontSize: 28 }} />
            ) : (
              <CheckCircleIcon sx={{ color: '#2563EB', fontSize: 28 }} />
            )}
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: isPremium ? '#DC2626' : '#1F2937',
                  mb: 0.25,
                }}
              >
                {notification.title}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {notification.message}
              </Typography>
            </Box>
          </Box>
          {!notification.read && (
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: isPremium ? '#DC2626' : '#2563EB',
                ml: 1,
              }}
            />
          )}
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Match details */}
        <Box sx={{ mb: 2 }}>
          {matchedSkills.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                Matched Skills
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 0.5 }}>
                {matchedSkills.map((skill) => (
                  <Chip
                    key={skill}
                    label={skill}
                    size="small"
                    sx={{
                      backgroundColor: '#DBEAFE',
                      color: '#1E40AF',
                      fontWeight: 500,
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {matchedTitles.length > 0 && (
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                Matched Profile
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 0.5 }}>
                {matchedTitles.map((title) => (
                  <Chip
                    key={title}
                    label={title}
                    size="small"
                    sx={{
                      backgroundColor: '#E0E7FF',
                      color: '#3730A3',
                      fontWeight: 500,
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>

        {/* CTA Buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            size="medium"
            sx={{
              flex: 1,
              background: isPremium
                ? 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)'
                : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              color: 'white',
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.95rem',
              py: 1.2,
              '&:hover': {
                opacity: 0.9,
              },
            }}
            onClick={handleApplyClick}
          >
            {metadata.cta || (isPremium ? 'Apply Fast' : 'View Job')}
          </Button>
          <Button
            variant="outlined"
            size="medium"
            onClick={handleMarkAsRead}
            sx={{
              textTransform: 'none',
            }}
          >
            {notification.read ? 'Read' : 'Mark Read'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * JobMatchNotificationsList
 * 
 * Displays a list of job match notifications
 */
export const JobMatchNotificationsList: React.FC<{
  notifications: any[];
  onDismiss?: (notificationId: string) => void;
  onMarkAsRead?: (notificationId: string) => void;
  emptyMessage?: string;
  compact?: boolean;
}> = ({ notifications, onDismiss, onMarkAsRead, emptyMessage = 'No job match notifications', compact = false }) => {
  if (notifications.length === 0) {
    return (
      <Box sx={{ py: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {notifications.map((notification) => (
        <JobMatchNotificationCard
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
          onMarkAsRead={onMarkAsRead}
          compact={compact}
        />
      ))}
    </Box>
  );
};
