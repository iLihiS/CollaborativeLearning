import { useState, useEffect } from 'react';
import { User } from '@/types';

export const useNotifications = (user: User | null) => {
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unhandledInquiries, setUnhandledInquiries] = useState(0);

  const loadNotificationCounts = async () => {
    try {
      if (!user) return;
      
      // Simulate API calls - replace with real API calls
      const notificationsCount = Math.floor(Math.random() * 5);
      const inquiriesCount = Math.floor(Math.random() * 3);
      
      setUnreadNotifications(notificationsCount);
      setUnhandledInquiries(inquiriesCount);
    } catch (error) {
      console.error('Error loading notification counts:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotificationCounts();
    }
  }, [user]);

  return {
    unreadNotifications,
    unhandledInquiries,
    loadNotificationCounts
  };
}; 