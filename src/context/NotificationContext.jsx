import React, { createContext, useState, useCallback, useEffect } from 'react';

export const NotificationContext = createContext();

const STORAGE_KEY = 'notifications';
const HISTORY_KEY = 'notifications_history';

const saveToHistorique = (notifications) => {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const newHistory = [
      ...notifications.map(n => ({
        ...n,
        timestamp: n.timestamp instanceof Date ? n.timestamp.toISOString() : n.timestamp,
      })),
      ...history,
    ];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  } catch (err) {
    console.error('Error saving to notification history:', err);
  }
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const storedHistory = localStorage.getItem(HISTORY_KEY);
    if (storedHistory) {
      try {
        const parsed = JSON.parse(storedHistory);
        const historyWithDates = parsed.map(n => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
        setHistory(historyWithDates);
      } catch (err) {
        console.error('Error loading history from localStorage:', err);
      }
    }

    // Save active notifications to history before page unload/refresh
    const handleBeforeUnload = () => {
      const currentNotifications = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (currentNotifications.length > 0) {
        // Move all active notifications to history before page closes
        saveToHistorique(currentNotifications);
        // Clear the notifications storage
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
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
        setHistory(prevHistory => [dismissed, ...prevHistory]);
      }
      return prev.filter(n => n.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications(prev => {
      if (prev.length > 0) {
        saveToHistorique(prev);
        setHistory(prevHistory => [...prev, ...prevHistory]);
      }
      return [];
    });
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      history,
      addNotification,
      dismissNotification,
      clearAll,
      clearHistory,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
