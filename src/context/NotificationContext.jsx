import React, { createContext, useState, useCallback, useEffect } from 'react';
import { saveToHistorique } from '../services/notificationService';

export const NotificationContext = createContext();

const STORAGE_KEY = 'notifications';

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const notifications = parsed.map(n => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
        setNotifications(notifications);
      } catch (err) {
        console.error('Error loading notifications from localStorage:', err);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = useCallback((message, type = 'info', data = null) => {
    const id = Date.now();
    const notification = {
      id,
      message,
      type,
      timestamp: new Date(),
      data,
    };
    setNotifications(prev => [notification, ...prev]);
    return id;
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => {
      const dismissed = prev.find(n => n.id === id);
      if (dismissed) {
        saveToHistorique([dismissed]);
      }
      return prev.filter(n => n.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications(prev => {
      if (prev.length > 0) {
        saveToHistorique(prev);
      }
      return [];
    });
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      dismissNotification,
      clearAll,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
