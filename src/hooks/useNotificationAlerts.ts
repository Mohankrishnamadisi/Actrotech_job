import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { notificationService } from '@services/api';

export const useNotificationAlerts = (userId: string | null) => {
  const seenNotificationIds = useRef<string[]>([]);

  useEffect(() => {
    if (!userId) return;
    let mounted = true;

    const loadInitialNotifications = async () => {
      try {
        const initialNotifications = await notificationService.getUnreadNotifications(userId);
        if (!mounted) return;
        seenNotificationIds.current = (initialNotifications || []).map((notification) => notification.id);
      } catch (error) {
        console.error('Failed to initialize notification alerts:', error);
      }
    };

    const pollNotifications = async () => {
      try {
        const notifications = await notificationService.getUnreadNotifications(userId);
        if (!mounted || !notifications) return;

        const newNotifications = notifications.filter(
          (notification) => !seenNotificationIds.current.includes(notification.id)
        );

        if (newNotifications.length > 0) {
          newNotifications
            .slice()
            .reverse()
            .forEach((notification) => {
              toast(`${notification.title}: ${notification.message}`, {
                duration: 5000,
                position: 'top-center',
                icon: '🔔',
              });
            });
        }

        seenNotificationIds.current = notifications.map((notification) => notification.id);
      } catch (error) {
        console.error('Failed to poll notification alerts:', error);
      }
    };

    loadInitialNotifications();
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        pollNotifications();
      }
    }, 60000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [userId]);
};
