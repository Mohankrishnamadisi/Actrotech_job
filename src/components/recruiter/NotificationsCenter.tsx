import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Badge,
  Button,
} from '@mui/material';
import {
  Close as CloseIcon,
  NotificationsActive as NotificationsActiveIcon,
  Info as InfoIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { notificationService } from '@services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface NotificationsCenterProps {
  userId: string;
  onNotificationRead?: () => void;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, unknown>;
  created_at: string;
}

export const NotificationsCenter: React.FC<NotificationsCenterProps> = ({
  userId,
  onNotificationRead,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getUserNotifications(userId, 20);
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      fetchNotifications();
      onNotificationRead?.();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(userId);
      fetchNotifications();
      onNotificationRead?.();
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'job_match':
        return <CheckIcon sx={{ color: '#10B981' }} />;
      case 'application_status':
        return <NotificationsActiveIcon sx={{ color: '#F59E0B' }} />;
      case 'new_job':
        return <InfoIcon sx={{ color: '#1D4ED8' }} />;
      case 'subscription':
        return <WarningIcon sx={{ color: '#EF4444' }} />;
      default:
        return <InfoIcon />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsActiveIcon />
              </Badge>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Notifications
              </Typography>
            </Box>
            {unreadCount > 0 && (
              <Button size="small" onClick={handleMarkAllAsRead}>
                Mark all as read
              </Button>
            )}
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : notifications.length === 0 ? (
            <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
              No notifications yet
            </Typography>
          ) : (
            <List sx={{ width: '100%' }}>
              {notifications.map((notification) => (
                <motion.div key={notification.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <ListItem
                    sx={{
                      mb: 1,
                      backgroundColor: notification.read ? 'transparent' : '#f0f7ff',
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      '&:hover': { backgroundColor: notification.read ? '#f9f9f9' : '#e8f4ff' },
                    }}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        onClick={() => handleMarkAsRead(notification.id)}
                        size="small"
                        title={notification.read ? 'Mark as unread' : 'Mark as read'}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemIcon>{getNotificationIcon(notification.type)}</ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontWeight: 600 }}>{notification.title}</Typography>
                          {!notification.read && (
                            <Chip label="New" size="small" color="primary" variant="filled" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="body2" color="textSecondary">
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                            {format(new Date(notification.created_at), 'dd MMM yyyy hh:mm a')}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                </motion.div>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
