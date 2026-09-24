import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const storageKey = `onboardiq_notifications_${user?._id || user?.id || 'default'}`;

  // Default seed notifications for fresh users
  const getInitialNotifications = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse notifications from localStorage:', e);
    }

    return [
      {
        id: 'init-1',
        title: '🎉 Welcome to OnboardIQ!',
        message: 'Your autonomous onboarding roadmap with 74 tasks across Day 1–5 is initialized and ready.',
        type: 'task',
        timestamp: new Date().toISOString(),
        read: false,
        link: '/onboarding'
      },
      {
        id: 'init-2',
        title: '🚀 Learning Path Synthesized',
        message: '4 progressive curriculum stages with 10 technical modules synthesized from enterprise docs.',
        type: 'learning',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        read: false,
        link: '/learning'
      },
      {
        id: 'init-3',
        title: '📚 10 Knowledge Documents Indexed',
        message: 'Company handbook, security protocols, and style guidelines ready for autonomous AI retrieval.',
        type: 'document',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        read: false,
        link: '/documents'
      },
      {
        id: 'init-4',
        title: '🤖 AI Mentor Online',
        message: 'Your 24/7 autonomous onboarding assistant is standing by to answer company policy questions.',
        type: 'assistant',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        read: true,
        link: '/assistant'
      }
    ];
  };

  const [notifications, setNotifications] = useState(getInitialNotifications);
  const [activeToast, setActiveToast] = useState(null);

  // Sync to localStorage whenever notifications change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(notifications));
    } catch (e) {
      console.error('Failed to persist notifications:', e);
    }
  }, [notifications, storageKey]);

  // Compute unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Add notification with optional toast trigger
  const addNotification = useCallback((notif) => {
    const newNotif = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: notif.title || 'Project Notification',
      message: notif.message || '',
      type: notif.type || 'info', // 'task' | 'learning' | 'document' | 'assistant' | 'sync' | 'info' | 'success'
      timestamp: new Date().toISOString(),
      read: false,
      link: notif.link || null
    };

    setNotifications((prev) => [newNotif, ...prev.slice(0, 49)]); // keep up to 50

    // Trigger instant toast notification
    setActiveToast(newNotif);
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAllNotifications,
        activeToast,
        dismissToast
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
